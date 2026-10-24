import {ButtonObj,MovieClip,type DisplayObject,type Runtime} from './display';
import type {HfrPlayer} from './player';
import type {HfrTextIdentity} from './hfr-native-text';
import {P027Product} from './nms-l11-p027-product';
import type {P027NativeFrame} from './nms-l11-p027-native';
import type {P027GlossaryHold} from './nms-l11-p027-practice-host';
import {P027_INPUTS} from './nms-l11-p027-input-binding';
import {settleP027ReducedMotion} from './nms-l11-p027-reduced-motion';
export type P027SourceButtonControl=Readonly<{key:string;kind:'close'|'glossary';label:string;button:ButtonObj;epoch:number;instanceId:string;box:readonly number[]}>;
export interface P027ConnectionOptions{player:()=>HfrPlayer|null;current:()=>boolean;identity:()=>HfrTextIdentity;controls:()=>Readonly<{blocked:boolean;reduced:boolean}>;frame:(frame:P027NativeFrame|null)=>void;glossary:(hold:P027GlossaryHold,trigger?:HTMLElement)=>void}
/** One current lease; keyboard actions send the same source press/move/pointerUp
 * as Canvas. Source AVM alone resolves drop target, feedback and completion. */
export class P027PlayerConnection{
 product:P027Product|null=null;private epoch=0;private disposed=false;private committed:P027NativeFrame|null=null;
 private readonly issuedButtons=new WeakSet<object>();private readonly usedButtons=new WeakSet<object>();
 private buttonProjection:{value:string;controls:readonly P027SourceButtonControl[];definitions:readonly unknown[];parents:readonly unknown[]}|null=null;
 private selected:{source:MovieClip;pair:number;epoch:number;count:unknown}|null=null;
 constructor(readonly options:P027ConnectionOptions){}
 activate(rt:Runtime,hash:string){this.product?.dispose();this.committed=null;this.selected=null;this.buttonProjection=null;const epoch=++this.epoch;this.product=new P027Product(rt,{validatedDataSha256:hash,isCurrent:()=>!this.disposed&&epoch===this.epoch&&this.options.current()&&this.options.player()?.rt===rt});}
 current(rt=this.options.player()?.rt){return Boolean(rt&&this.product?.runtime===rt&&this.product.adapter.current()&&!this.disposed&&this.options.current());}
 private view(){return this.product?.view(this.options.identity()).native??null;}
 input(rt:Runtime,object:DisplayObject):'allowed'|'blocked'{
  if(!this.current(rt)||this.options.controls().blocked||!rt.isClickable(object))return'blocked';const s=this.product!.adapter.snapshot();
  if(object instanceof MovieClip)return s.frame===278&&s.pairs.some(p=>p.source===object)&&object.visible&&object.get('enabled')!==false?'allowed':'blocked';
  if(!(object instanceof ButtonObj))return'blocked';const n=this.view();if(!n||!this.frameCurrent(n))return'blocked';
  if(n.glossary.some(g=>g.button===object))return'allowed';
  const popup=s.main?.get('Pop1_mc');return popup instanceof MovieClip&&popup.charId===133&&popup.def===rt.page.dictionary[133]&&popup.visible&&popup.ancestorsVisible()&&object.parentClip===popup&&popup.get('BtnClose')===object&&object.charId===130&&object.def===rt.page.dictionary[130]?'allowed':'blocked';
 }
 frameCurrent(frame:P027NativeFrame){return Boolean(frame.snapshot.status==='ready'&&this.current(frame.runtime)&&this.product?.isNativeCurrent(frame,this.options.identity()));}
 beforeRender(){if(this.committed&&!this.frameCurrent(this.committed)){this.committed=null;this.options.frame(null);}}
 suppress(rt:Runtime,o:DisplayObject){return Boolean(this.committed&&this.current(rt)&&this.product?.shouldSuppressText(o,this.options.identity()));}
 project(){if(!this.current())return;const f=this.view();this.options.frame(f&&this.frameCurrent(f)?f:null);}
 commit(frame:P027NativeFrame|null){this.committed=frame&&this.frameCurrent(frame)&&this.product?.commitNative(frame,this.options.identity())?frame:null;return Boolean(this.committed);}
 pointerMutated(rt:Runtime){if(!this.current(rt))return;this.selected=null;this.options.player()?.redraw();}
 release(rt:Runtime,object:DisplayObject,release:()=>void,trigger?:HTMLElement){
  if(this.input(rt,object)!=='allowed')return false;this.selected=null;const player=this.options.player()!,product=this.product!;
  if(object instanceof MovieClip){if(!product.releaseSourceDrag(object,release))return false;}
  else {const control=product.adapter.glossaryControls().find(c=>c.button===object);if(control){const hold=product.adapter.releaseGlossary(control,()=>{if(!player.runSourceButtonRelease(rt,object,null,release))throw Error('P027_CURRENT_SOURCE_GLOSSARY_RELEASE_REQUIRED');});if(!hold)return false;this.options.glossary(hold,trigger);player.redraw();return true;}release();}
  if(this.options.controls().reduced)settleP027ReducedMotion(rt,product.adapter);player.redraw();return true;
 }
 executeKeyboard(action:()=>boolean){const p=this.options.player();if(!p||!this.current())return false;try{return action();}catch(error){p.destroy();p.opts.onError?.(error);return false;}}
 sourceButtons():readonly P027SourceButtonControl[]{
  const p=this.product,m=p?.adapter.main(),frame=this.view();if(!p||!m||!frame||!this.frameCurrent(frame)){this.buttonProjection=null;return[];}
  const controls:Array<Omit<P027SourceButtonControl,'epoch'>>=frame.glossary.map(g=>({key:'glossary-'+g.instanceId,kind:'glossary',label:g.label,button:g.button,instanceId:g.instanceId,box:g.box}));
  const popup=m.get('Pop1_mc'),button=popup instanceof MovieClip&&popup.charId===133&&popup.visible&&popup.ancestorsVisible()?popup.get('BtnClose'):null;
  if(button instanceof ButtonObj&&button.charId===130&&button.def===p.runtime.page.dictionary[130]&&button.parentClip===popup&&p.runtime.isClickable(button)){const b=button.localBounds(),w=button.worldMatrix();if(b){const points=[[b.xmin,b.ymin],[b.xmax,b.ymin],[b.xmin,b.ymax],[b.xmax,b.ymax]].map(([x,y])=>[w.a*x+w.c*y+w.tx,w.b*x+w.d*y+w.ty]),box=[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];controls.push({key:'close',kind:'close',label:'Close feedback',button,instanceId:'source-popup133-close130',box});}}
  const value=JSON.stringify([this.epoch,this.options.controls().blocked,this.selectedPair(),controls.map(c=>[c.key,c.kind,c.label,c.box,c.button.charId,c.button.state,c.button.visible,c.button.removed])]),prior=this.buttonProjection;
  if(prior&&prior.value===value&&prior.controls.length===controls.length&&prior.controls.every((c,i)=>c.button===controls[i].button&&prior.definitions[i]===c.button.def&&prior.parents[i]===c.button.parentClip&&this.issuedButtons.has(c)&&!this.usedButtons.has(c)))return prior.controls;
  const published=Object.freeze(controls.map(c=>{const issued=Object.freeze({...c,box:Object.freeze([...c.box]),epoch:this.epoch});this.issuedButtons.add(issued);return issued;}));this.buttonProjection={value,controls:published,definitions:controls.map(c=>c.button.def),parents:controls.map(c=>c.button.parentClip)};return published;
 }
 activateSourceButton(control:P027SourceButtonControl,trigger?:HTMLElement){const p=this.product;if(!p||!this.issuedButtons.has(control)||this.usedButtons.has(control)||control.epoch!==this.epoch||p.runtime.drag||p.runtime.pressed||!this.sourceButtons().some(c=>c===control)||this.input(p.runtime,control.button)!=='allowed')return false;this.usedButtons.add(control);return this.release(p.runtime,control.button,()=>p.runtime.click(control.button),trigger);}
 selectSource(pair:number){const p=this.product,s=p?.adapter.snapshot(),card=s?.pairs.find(x=>x.pair===pair)?.source,frame=this.view();if(!p||!card||!frame||!this.frameCurrent(frame)||!frame.labels.some(l=>l.pair===pair&&l.card==='source')||this.input(p.runtime,card)!=='allowed'||p.runtime.drag||p.runtime.pressed)return false;this.selected={source:card,pair,epoch:this.epoch,count:s!.count};this.project();return true;}
 selectedPair(){const s=this.selected,p=this.product,view=p?.adapter.snapshot(),frame=this.view();if(!s||!p||!view||!frame||!this.current()||s.epoch!==this.epoch||view.count!==s.count||view.frame!==278||view.pairs.find(x=>x.pair===s.pair)?.source!==s.source||!this.frameCurrent(frame)||!frame.labels.some(l=>l.pair===s.pair&&l.card==='source')||this.input(p.runtime,s.source)!=='allowed')return null;return s.pair;}
 cancelSelection(){this.selected=null;this.project();}
 drop(targetPair:number){const pair=this.selectedPair(),p=this.product;if(pair===null||!p)return false;const selected=this.selected!,start=P027_INPUTS.find(x=>x.pair===pair)!,end=P027_INPUTS.find(x=>x.pair===targetPair);if(!end)return false;const rt=p.runtime,from=[start.start[0]+(selected.source.m.tx-start.sourceAuthoredMatrix[4])/20,start.start[1]+(selected.source.m.ty-start.sourceAuthoredMatrix[5])/20] as const;
  if(rt.drag||rt.pressed||rt.topClickableAt(...from)!==selected.source)return false;this.selected=null;rt.pointerMove(...from);rt.pointerDown();if(rt.pressed!==selected.source||!p.canReleaseSourceDrag(selected.source))throw Error('P027_KEYBOARD_SOURCE_PRESS_FAILED');rt.pointerMove((from[0]+end.drop[0])/2,(from[1]+end.drop[1])/2);rt.pointerMove(end.drop[0],end.drop[1]);return this.release(rt,selected.source,()=>rt.pointerUp());
 }
 dispose(){this.disposed=true;++this.epoch;this.selected=null;this.committed=null;this.buttonProjection=null;this.product?.dispose();this.product=null;this.options.frame(null);}
}
