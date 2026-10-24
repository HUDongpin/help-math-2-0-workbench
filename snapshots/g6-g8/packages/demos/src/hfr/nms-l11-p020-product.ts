import {ButtonObj,MovieClip,type Runtime,type DisplayObject} from './display';
import type {HostCall} from './types';
import type {LessonHostRequest} from '../lesson-host-contract';
import type {HfrTextIdentity} from './hfr-native-text';
import {P020PracticeHost,type P020AnswerIntent,type P020CloseIntent} from './nms-l11-p020-practice-host';
import {P020NativePresentation,isP020NativeCurrent,type P020NativeFrame,type P020NativeGlossary} from './nms-l11-p020-native';
import {P020} from './nms-l11-p020-source-binding';
export type P020MainGlossaryIntent=Readonly<P020NativeGlossary&{kind:'main-glossary';frame:P020NativeFrame}>;
export type P020NativeIntent=P020AnswerIntent|P020CloseIntent|P020MainGlossaryIntent;
export type P020GlossaryHold=Readonly<{runtime:Runtime;clip:MovieClip;frame:number;resumeSource:boolean;request:LessonHostRequest}>;
/** One instance per actual LessonRuntime lease. The facade observes authored
 * exits; it does not rewrite the source two-attempt counter or natural loop. */
export class P020Product{
 readonly adapter:P020PracticeHost;
 private native:P020NativePresentation|null=null;
 private committed:P020NativeFrame|null=null;
 private readonly root:MovieClip;
 private readonly previous:Runtime['hostCb'];
 private readonly callback:(call:HostCall)=>void;
 private readonly installed:Runtime['hostCb'];
 private readonly issued=new WeakSet<object>();
 private readonly consumed=new WeakSet<object>();
 private pending:{intent:P020MainGlossaryIntent;tick:number;request:LessonHostRequest|null}|null=null;
 private disposed=false;
 constructor(readonly runtime:Runtime,private readonly options:Readonly<{validatedDataSha256:string;seed:number;isCurrent:()=>boolean;onRequest?:(request:LessonHostRequest)=>void}>){
  this.root=runtime.page_;this.previous=runtime.hostCb;
  this.callback=call=>{const pending=this.pending;if(call.kind==='shell.DoHyperLinks'&&pending){
   if(!this.current()||call.tick!==pending.tick||call.args.length!==0||pending.request||runtime.Global.get('KeyAttribute')!==pending.intent.sourceKey)throw Error('P020_MAIN_SOURCE_RELEASE_MISMATCH');
   pending.request=Object.freeze({type:'open-glossary',entryId:pending.intent.entryId,sourceAnimationId:P020.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'});
  }else this.previous?.(call);};
  runtime.hostCb=this.callback;
  try{this.adapter=new P020PracticeHost(runtime,{validatedDataSha256:options.validatedDataSha256,seed:options.seed,onRequest:request=>{if(request.type==='record-practice-feedback')options.onRequest?.(request);}});this.installed=runtime.hostCb;}
  catch(error){if(runtime.hostCb===this.callback)runtime.hostCb=this.previous;throw error;}
 }
 current():boolean{return !this.disposed&&this.options.isCurrent()&&this.runtime.page_===this.root&&!this.root.removed&&this.runtime.hostCb===this.installed;}
 main():MovieClip|null{if(!this.current())return null;const main=this.root.children.get(3);return main instanceof MovieClip&&main.charId===219&&main.name==='animation'&&main.def===this.runtime.page.dictionary[219]&&main.parentClip===this.root&&!main.removed?main:null;}
 async prepareNative(){const native=await P020NativePresentation.prepare(this.runtime,this.options.validatedDataSha256,()=>this.current());if(!this.current())throw Error('P020_PRODUCT_STALE_PREPARATION');this.native=native;}
 afterSourceUpdate(){if(this.current())this.adapter.afterSourceUpdate();}
 view(identity:HfrTextIdentity){
  this.afterSourceUpdate();const state=this.adapter.snapshot(),native=this.current()?this.native?.capture(this.adapter,identity)??null:null;
  const glossary=native?.glossary.map(control=>{const intent=Object.freeze({...control,kind:'main-glossary' as const,frame:native});this.issued.add(intent);return intent;})??[];
  return Object.freeze({state,native,glossary,choices:this.current()?this.adapter.choices():[],feedback:this.current()?this.adapter.feedback():null});
 }
 isNativeCurrent(frame:P020NativeFrame,identity:HfrTextIdentity){return this.current()&&isP020NativeCurrent(frame,this.runtime,identity);}
 isNativeCommitted(frame:P020NativeFrame,identity:HfrTextIdentity){return this.committed===frame&&this.isNativeCurrent(frame,identity);}
 commitNative(frame:P020NativeFrame|null,identity:HfrTextIdentity){this.committed=frame?.snapshot.status==='ready'&&this.isNativeCurrent(frame,identity)?frame:null;return Boolean(this.committed);}
 shouldSuppressText(object:DisplayObject,identity:HfrTextIdentity){return Boolean(this.committed&&this.isNativeCurrent(this.committed,identity)&&this.committed.sourceObjects.includes(object));}
 releaseMainGlossary(intent:P020MainGlossaryIntent,identity:HfrTextIdentity,release:()=>void=()=>this.runtime.click(intent.button)):P020GlossaryHold|null{
  const main=this.main();if(!main||this.pending||!this.issued.has(intent)||this.consumed.has(intent)||!this.isNativeCurrent(intent.frame,identity)||!intent.frame.glossary.some(c=>c.instanceId===intent.instanceId&&c.button===intent.button&&c.sourceActionSha256===intent.sourceActionSha256)||!this.runtime.isClickable(intent.button))return null;
  this.consumed.add(intent);const wasPlaying=main.playing,errors=this.runtime.errors.length,pending={intent,tick:this.runtime.tickCount,request:null as LessonHostRequest|null};this.pending=pending;
  try{release();this.afterSourceUpdate();if(this.runtime.errors.length!==errors||!pending.request||this.main()!==main||main.playing)throw Error('P020_MAIN_GLOSSARY_SOURCE_STOP_REQUIRED');this.committed=null;return Object.freeze({runtime:this.runtime,clip:main,frame:main.frame,resumeSource:wasPlaying&&this.adapter.mayResumeMainSource(),request:pending.request});}finally{this.pending=null;}
 }
 resumeHeldSource(held:P020GlossaryHold):boolean{const main=this.main();if(!main||held.runtime!==this.runtime||held.clip!==main||main.frame!==held.frame||main.playing||main.removed)return false;if(held.resumeSource&&this.adapter.mayResumeMainSource())main.playCmd();this.committed=null;return true;}
 canReleaseSourceButton(object:DisplayObject,identity:HfrTextIdentity):boolean{if(!this.current()||!(object instanceof ButtonObj)||!this.runtime.isClickable(object))return false;const v=this.view(identity);return v.choices.some(c=>c.button===object)||v.feedback?.close.button===object||v.glossary.some(c=>c.button===object);}
 activate(intent:P020NativeIntent,frame:P020NativeFrame,identity:HfrTextIdentity):boolean|P020GlossaryHold{
  if(!this.committed||frame!==this.committed||!this.isNativeCurrent(frame,identity))return false;
  if(intent.kind==='main-glossary')return this.releaseMainGlossary(intent,identity)??false;
  const result=intent.kind==='answer'?this.adapter.choose(intent):this.adapter.closeWrong(intent);if(result){this.committed=null;this.afterSourceUpdate();}return result;
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.pending=null;this.committed=null;this.native=null;this.adapter.dispose();if(this.runtime.hostCb===this.callback)this.runtime.hostCb=this.previous;}
}
export type P020ProductView=ReturnType<P020Product['view']>;
