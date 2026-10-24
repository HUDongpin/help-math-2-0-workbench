import {ButtonObj,type DisplayObject,type Runtime} from './display';
import type {HfrPlayer} from './player';
import type {HfrTextIdentity} from './hfr-native-text';
import type {LessonHostRequest} from '../lesson-host-contract';
import {P019Product,type P019ProductView,type P019NativeIntent,type P019GlossaryHold} from './nms-l11-p019-product';
import type {P019NativeFrame} from './nms-l11-p019-native';
import {settleP019ReducedMotion} from './nms-l11-p019-reduced-motion';
export interface P019ConnectionOptions{player:()=>HfrPlayer|null;current:()=>boolean;identity:()=>HfrTextIdentity;controls:()=>Readonly<{blocked:boolean;reduced:boolean}>;view:(view:P019ProductView|null)=>void;glossary:(hold:P019GlossaryHold,trigger?:HTMLElement)=>void;request?:(request:LessonHostRequest)=>void}
/** Clock, audio, Replay and visibility stay in the maintained HfrPlayer. */
export class P019PlayerConnection{
 product:P019Product|null=null;private epoch=0;private disposed=false;private committed:P019NativeFrame|null=null;
 constructor(readonly options:P019ConnectionOptions){}
 activate(rt:Runtime,hash:string){this.product?.dispose();this.committed=null;const epoch=++this.epoch;this.product=new P019Product(rt,{validatedDataSha256:hash,seed:this.options.identity().seed,isCurrent:()=>!this.disposed&&epoch===this.epoch&&this.options.current()&&this.options.player()?.rt===rt,onRequest:this.options.request});}
 current(rt=this.options.player()?.rt):boolean{return Boolean(rt&&this.product?.runtime===rt&&this.product.current()&&!this.disposed&&this.options.current());}
 input(rt:Runtime,object:DisplayObject):'allowed'|'blocked'{return !this.options.controls().blocked&&this.current(rt)&&this.product!.canReleaseSourceButton(object,this.options.identity())?'allowed':'blocked';}
 frameCurrent(frame:P019NativeFrame){return this.current(frame.runtime)&&this.product!.isNativeCurrent(frame,this.options.identity());}
 beforeRender(){if(this.committed&&!this.frameCurrent(this.committed)){this.committed=null;this.product?.commitNative(null,this.options.identity());this.options.view(null);}}
 suppress(rt:Runtime,object:DisplayObject){return Boolean(this.committed&&this.current(rt)&&this.product!.shouldSuppressText(object,this.options.identity()));}
 project(){if(this.current()){const identity=this.options.identity();if(this.committed&&this.product!.isNativeCommitted(this.committed,identity))return;this.options.view(this.product!.view(identity));}}
 sourceTick(){if(this.current())this.product!.afterSourceUpdate();}
 commit(frame:P019NativeFrame|null){this.committed=frame&&this.frameCurrent(frame)&&this.product!.commitNative(frame,this.options.identity())?frame:null;return Boolean(this.committed);}
 private settle(){if(this.options.controls().reduced&&this.product)settleP019ReducedMotion(this.product.runtime,this.product.adapter);}
 release(rt:Runtime,object:DisplayObject,point:readonly[number,number]|null,release:()=>void,trigger?:HTMLElement){
  if(!(object instanceof ButtonObj)||this.input(rt,object)!=='allowed')return false;const product=this.product!,player=this.options.player()!,identity=this.options.identity(),v=product.view(identity),glossary=v.glossary.find(i=>i.button===object);
  if(glossary){const hold=product.releaseMainGlossary(glossary,identity,()=>{player.runSourceButtonRelease(rt,object,point,release);});if(!hold)return false;this.options.glossary(hold,trigger);player.redraw();return true;}
  if(!player.runSourceButtonRelease(rt,object,point,release))return false;product.afterSourceUpdate();this.settle();player.redraw();return true;
 }
 activateNative(intent:P019NativeIntent,frame:P019NativeFrame,trigger?:HTMLElement){
  const product=this.product,player=this.options.player();if(trigger&&!trigger.isConnected)return false;if(!product||!player||this.options.controls().blocked||frame!==this.committed||!this.frameCurrent(frame))return false;
  let result:boolean|P019GlossaryHold=false;const didRelease=player.runSourceButtonRelease(product.runtime,intent.button,null,()=>{result=product.activate(intent,frame,this.options.identity());});
  if(!didRelease||!result)return false;if(typeof result==='object'){this.options.glossary(result,trigger);player.redraw();return true;}
  this.settle();player.redraw();return true;
 }
 execute(action:()=>boolean){const player=this.options.player();if(!player||!this.current())return false;try{return action();}catch(error){player.destroy();player.opts.onError?.(error);return false;}}
 dispose(){if(this.disposed)return;this.disposed=true;++this.epoch;this.committed=null;this.product?.dispose();this.product=null;this.options.view(null);}
}
