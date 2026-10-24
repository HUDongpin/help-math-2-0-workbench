import {ButtonObj,MovieClip,type DisplayObject,type Runtime} from './display';
import type {HfrPlayer} from './player';
import type {HfrTextIdentity} from './hfr-native-text';
import {P014Product} from './nms-l11-p014-product';
import type {P014NativeFrame} from './nms-l11-p014-native';
import type {P014GlossaryHold} from './nms-l11-p014-practice-host';
import {P014_INPUTS} from './nms-l11-p014-input-binding';
import {settleP014ReducedMotion} from './nms-l11-p014-reduced-motion';
export type P014SourceButtonControl=Readonly<{key:string;kind:'help'|'close'|'glossary';label:string;button:ButtonObj;epoch:number}>;
export interface P014ConnectionOptions{player:()=>HfrPlayer|null;current:()=>boolean;identity:()=>HfrTextIdentity;controls:()=>Readonly<{blocked:boolean;reduced:boolean}>;frame:(frame:P014NativeFrame|null)=>void;glossary:(hold:P014GlossaryHold,trigger?:HTMLElement)=>void}
/** One current player lease. Source generated code alone resolves drops and score. */
export class P014PlayerConnection{
 product:P014Product|null=null;private epoch=0;private disposed=false;private committed:P014NativeFrame|null=null;
 private readonly issuedButtons=new WeakSet<object>();private readonly usedButtons=new WeakSet<object>();
 private buttonProjection:{value:string;controls:readonly P014SourceButtonControl[];definitions:readonly unknown[];parents:readonly unknown[]}|null=null;
 private selected:{source:MovieClip;pair:number;epoch:number;count:unknown}|null=null;
 constructor(readonly options:P014ConnectionOptions){}
 activate(rt:Runtime,hash:string){this.product?.dispose();this.committed=null;this.selected=null;this.buttonProjection=null;const epoch=++this.epoch;this.product=new P014Product(rt,{validatedDataSha256:hash,isCurrent:()=>!this.disposed&&epoch===this.epoch&&this.options.current()&&this.options.player()?.rt===rt});}
 current(rt=this.options.player()?.rt){return Boolean(rt&&this.product?.runtime===rt&&this.product.adapter.current()&&!this.disposed&&this.options.current());}
 input(rt:Runtime,object:DisplayObject):'allowed'|'blocked'{
  if(!this.current(rt)||this.options.controls().blocked||!rt.isClickable(object))return 'blocked';
  const state=this.product!.adapter.snapshot();
  if(object instanceof MovieClip)return state.frame===228&&state.pairs.some(p=>p.source===object)&&object.visible&&object.get('enabled')!==false?'allowed':'blocked';
  if(object instanceof ButtonObj){for(let parent=object.parentClip;parent;parent=parent.parentClip)if(parent===state.main)return 'allowed';}
  return 'blocked';
 }
 frameCurrent(frame:P014NativeFrame){const s=this.product?.adapter.snapshot();return Boolean(frame.labels.length>0&&this.current(frame.runtime)&&s?.frame===228&&!s.main?.playing&&this.product?.isNativeCurrent(frame,this.options.identity()));}
 beforeRender(){if(this.committed&&!this.frameCurrent(this.committed)){this.committed=null;this.options.frame(null);}}
 suppress(rt:Runtime,object:DisplayObject){return Boolean(this.committed&&this.current(rt)&&this.product?.shouldSuppressText(object,this.options.identity()));}
 project(){if(!this.current())return;const f=this.product!.view(this.options.identity()).native;this.options.frame(f?.snapshot.status==='ready'&&this.frameCurrent(f)?f:null);}
 commit(frame:P014NativeFrame|null){this.committed=frame&&this.frameCurrent(frame)&&this.product?.commitNative(frame,this.options.identity())?frame:null;return Boolean(this.committed);}
 pointerMutated(rt:Runtime){if(!this.current(rt))return;this.selected=null;this.options.player()?.redraw();}
 release(rt:Runtime,object:DisplayObject,release:()=>void,trigger?:HTMLElement){
  if(this.input(rt,object)!=='allowed')return false;this.selected=null;const player=this.options.player()!,product=this.product!;
  if(object instanceof MovieClip){if(!product.releaseSourceDrag(object,release))return false;}
  else {const control=product.adapter.glossaryControls().find(c=>c.button===object);if(control){const hold=product.adapter.releaseGlossary(control,()=>{player.runSourceButtonRelease(rt,object,null,release);});if(hold){this.options.glossary(hold,trigger);player.redraw();return true;}return false;}else release();}
  if(this.options.controls().reduced)settleP014ReducedMotion(rt,product.adapter);player.redraw();return true;
 }
 executeKeyboard(action:()=>boolean){const p=this.options.player();if(!p||!this.current())return false;try{return action();}catch(error){p.destroy();p.opts.onError?.(error);return false;}}
 sourceButtons():readonly P014SourceButtonControl[]{
  const p=this.product,m=p?.adapter.main();if(!p||!m||!this.current()){this.buttonProjection=null;return[];}
  const popup=m.get('Mc_Popup'),open=popup instanceof MovieClip&&popup.charId===50&&popup.def===p.runtime.page.dictionary[50]&&popup.ancestorsVisible();
  const controls:Array<Omit<P014SourceButtonControl,'epoch'>>=[];
  for(const c of p.adapter.glossaryControls())if((open&&c.term.parentTimelineId===50)||(!open&&c.term.parentTimelineId===237))controls.push({key:`glossary-${c.term.sourceButtonCharacterId}`,kind:'glossary',label:c.term.sourceKeyAttribute,button:c.button});
  const parent=open?popup:m,button=parent.get(open?'CloseBtn':'NMHBtn'),id=open?12:56;
  if(button instanceof ButtonObj&&button.charId===id&&button.def===p.runtime.page.dictionary[id]&&button.parentClip===parent&&this.input(p.runtime,button)==='allowed')controls.push({key:open?'close':'help',kind:open?'close':'help',label:open?'Close page help':'Open page help',button});
  // Publish only changed P014 presentation. Selection is part of the parent render;
  // consumed controls must be renewed even when their source geometry is unchanged.
  const value=JSON.stringify([this.epoch,this.options.controls().blocked,this.selectedPair(),controls.map(c=>{const b=c.button.localBounds(),w=c.button.worldMatrix();return[c.key,c.kind,c.label,c.button.charId,c.button.state,c.button.visible,c.button.removed,c.button.ancestorsVisible(),b?[b.xmin,b.ymin,b.xmax,b.ymax]:null,[w.a,w.b,w.c,w.d,w.tx,w.ty]];})]);
  const prior=this.buttonProjection;
  if(prior&&prior.value===value&&prior.controls.length===controls.length&&prior.controls.every((c,i)=>c.button===controls[i].button&&prior.definitions[i]===c.button.def&&prior.parents[i]===c.button.parentClip&&c.epoch===this.epoch&&this.issuedButtons.has(c)&&!this.usedButtons.has(c)))return prior.controls;
  const published=Object.freeze(controls.map(c=>{const issued=Object.freeze({...c,epoch:this.epoch});this.issuedButtons.add(issued);return issued;}));
  this.buttonProjection={value,controls:published,definitions:controls.map(c=>c.button.def),parents:controls.map(c=>c.button.parentClip)};return published;
 }
 activateSourceButton(control:P014SourceButtonControl,trigger?:HTMLElement){
  const p=this.product;if(!p||!this.issuedButtons.has(control)||this.usedButtons.has(control)||control.epoch!==this.epoch||p.runtime.drag||p.runtime.pressed||!this.sourceButtons().some(c=>c.key===control.key&&c.button===control.button)||this.input(p.runtime,control.button)!=='allowed')return false;
  this.usedButtons.add(control);return this.release(p.runtime,control.button,()=>p.runtime.click(control.button),trigger);
 }
 selectSource(pair:number){const p=this.product,s=p?.adapter.snapshot(),card=s?.pairs.find(x=>x.pair===pair)?.source;if(!p||!card||!p.view(this.options.identity()).native?.labels.some(l=>l.pair===pair&&l.card==='source')||this.input(p.runtime,card)!=='allowed'||p.runtime.drag||p.runtime.pressed)return false;this.selected={source:card,pair,epoch:this.epoch,count:s!.count};this.project();return true;}
 selectedPair(){const s=this.selected,p=this.product,view=p?.adapter.snapshot();if(!s||!p||!view||!this.current()||s.epoch!==this.epoch||view.count!==s.count||view.frame!==228||view.pairs.find(x=>x.pair===s.pair)?.source!==s.source||!p.view(this.options.identity()).native?.labels.some(l=>l.pair===s.pair&&l.card==='source')||this.input(p.runtime,s.source)!=='allowed')return null;return s.pair;}
 cancelSelection(){this.selected=null;this.project();}
 drop(targetPair:number){
  const pair=this.selectedPair(),p=this.product;if(pair===null||!p)return false;const selected=this.selected!,start=P014_INPUTS.find(x=>x.pair===pair)!,end=P014_INPUTS.find(x=>x.pair===targetPair);if(!end)return false;const rt=p.runtime,from=[start.start[0]+(selected.source.m.tx-start.sourceAuthoredMatrix[4])/20,start.start[1]+(selected.source.m.ty-start.sourceAuthoredMatrix[5])/20] as const;
  if(rt.drag||rt.pressed||rt.topClickableAt(from[0],from[1])!==selected.source)return false;
  this.selected=null;rt.pointerMove(from[0],from[1]);rt.pointerDown();if(rt.pressed!==selected.source||!p.canReleaseSourceDrag(selected.source))throw Error('P014_KEYBOARD_SOURCE_PRESS_FAILED');
  rt.pointerMove((from[0]+end.drop[0])/2,(from[1]+end.drop[1])/2);rt.pointerMove(end.drop[0],end.drop[1]);
  return this.release(rt,selected.source,()=>rt.pointerUp());
 }
 dispose(){this.disposed=true;++this.epoch;this.selected=null;this.committed=null;this.buttonProjection=null;this.product?.dispose();this.product=null;this.options.frame(null);}
}
