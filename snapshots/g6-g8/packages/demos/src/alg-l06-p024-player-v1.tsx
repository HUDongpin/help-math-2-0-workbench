import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {P024DomainClockV1,type P024AudioContextLike,type P024ClockResult}
 from './alg-l06-p024-clock-v1';
import {P024AudioOwnerV1,type P024SeparateSpanishAudio}
 from './alg-l06-p024-audio-owner-v1';
import {P024_AUDIO_DOMAINS,P024_AUDIO_SA,type P024AudioDomainId}
 from './alg-l06-p024-audio-schedule-v1';
import {P024_ANSWERS,P024_FEEDBACK,p024InitialState,p024Reduce,
 type P024Answer,type P024GlossaryKey,type P024State}
 from './alg-l06-p024-state-v1';
import {p024PresentationState} from './alg-l06-p024-presentation-v1';

const result=(accepted:boolean,reason:string):P024ClockResult=>Object.freeze({accepted,reason});
const isAnswer=(value:unknown):value is P024Answer=>
 typeof value==='string'&&Object.hasOwn(P024_ANSWERS,value);
type FeedbackSprite=69|83|97|123|155|188|196;
type P024CanvasRequest={frame:number;scenario:'source-static-frame';lang:'en';seed:0;
 feedback?:null|{spriteId:FeedbackSprite;frame:number};suppressTextIds?:readonly number[]};
export interface P024CanvasAssetV1{
 readonly metadata:{readonly animationId:string;readonly sourceSwfSha256:string;
  readonly stage:{readonly width:number;readonly height:number};readonly fps:number;
  readonly deterministicContentTimeline:{readonly timelineId:string;readonly frameCount:number};
  readonly mainQuizStopFrame?:number;
  readonly sourceGlyphRendering?:{readonly suppressTextIdsSupported?:boolean}};
 ready():Promise<unknown>;
 render(canvas:HTMLCanvasElement,request:P024CanvasRequest):{
  readonly localFrame:number;readonly frameDomain:string;readonly rootFrame:number;
  readonly feedbackSpriteId:number|null;readonly feedbackFrame:number|null;
  readonly suppressedSourceTextIds?:readonly number[]};
}
export type P024PlayerSnapshotV1=Readonly<{state:P024State;
 audio:ReturnType<P024AudioOwnerV1['snapshot']>;visualReady:boolean;error:string|null}>;
export interface P024PlayerControlsV1{
 setPaused(paused:boolean):void;replay():void;narration(action:'play'|'stop'):void;
 stop():void;answer(answer:P024Answer):void;closeWrong():void;
 startSpanish():void;returnSpanish():void;closeGlossary():void;
}
export interface P024PlayerPropsV1{
 asset:P024CanvasAssetV1;
 loadAudio:(id:P024AudioDomainId,signal:AbortSignal)=>Promise<ArrayBuffer>;
 loadSpanishAudio?:(signal:AbortSignal)=>Promise<ArrayBuffer>;
 createContext?:()=>P024AudioContextLike;
 createSpanishContext?:()=>AudioContext;
 language?:'en'|'es';reducedMotion?:boolean;volume?:number;
 chooseVariant?:(count:3|4)=>number;
 onSnapshot?:(snapshot:P024PlayerSnapshotV1)=>void;
 connectControls?:(controls:P024PlayerControlsV1)=>void|(()=>void);
 onOpenGlossary?:(key:P024GlossaryKey,trigger:HTMLButtonElement)=>void;
 nativeTextTarget?:HTMLElement|null;hidePlaybackControls?:boolean;
}

/** P024 SA is a separate recording. Browser decode facts are observed at
 * runtime; the FFmpeg PCM digest in the source audit is not a browser pin. */
class P024SeparateSpanishV1 implements P024SeparateSpanishAudio {
 private phase:'idle'|'loading'|'playing'|'paused'|'ended'|'error'|'closed'='idle';
 private failure:string|null=null;private volume=1;private epoch=0;
 private context:AudioContext|null=null;private gain:GainNode|null=null;
 private buffer:AudioBuffer|null=null;private node:AudioBufferSourceNode|null=null;
 private anchor=0;private offset=0;private abort:AbortController|null=null;
 private pending:Promise<P024ClockResult>|null=null;
 private disposal:Promise<void>=Promise.resolve();
 private browserDecode:{sampleRate:number;samples:number;channels:number;
  ffmpegSampleCountMatches:boolean}|null=null;
 constructor(private readonly options:{load:(signal:AbortSignal)=>Promise<ArrayBuffer>;
  createContext?:()=>AudioContext;onChange:()=>void;onEnded:()=>void}){}
 snapshot(){return Object.freeze({phase:this.phase,failure:this.failure,volume:this.volume,
  browserDecode:this.browserDecode,lessonCompleted:false as const});}
 private emit(){try{this.options.onChange();}catch{/* Observer cannot retain a source. */}}
 private retireNode(){const node=this.node;this.node=null;if(!node)return;
  node.onended=null;try{node.stop();}catch{/* Natural EOF. */}node.disconnect();}
 private retireContext(){const context=this.context;this.context=null;
  this.gain?.disconnect();this.gain=null;this.buffer=null;this.browserDecode=null;
  if(context&&context.state!=='closed'){
   const closed=context.close();this.disposal=Promise.all([this.disposal,closed]).then(()=>{});
   void this.disposal.catch(()=>{});
  }
 }
 private beginAt(offset:number,ticket:number){
  const context=this.context,buffer=this.buffer,gain=this.gain;
  if(!context||!buffer||!gain||context.state!=='running')throw Error('P024_SA_CONTEXT_NOT_RUNNING');
  this.retireNode();this.offset=Math.max(0,Math.min(offset,buffer.duration));
  if(this.offset>=buffer.duration){this.phase='ended';this.emit();return;}
  const node=context.createBufferSource();node.buffer=buffer;node.connect(gain);
  this.anchor=context.currentTime;
  node.onended=()=>{if(ticket!==this.epoch||this.node!==node)return;
   this.node=null;node.onended=null;node.disconnect();this.offset=buffer.duration;
   this.phase='ended';this.emit();try{this.options.onEnded();}catch{/* Callback isolated. */}};
  node.start(this.anchor,this.offset);this.node=node;this.phase='playing';this.emit();
 }
 async start(policy:{activation:'user'}):Promise<P024ClockResult>{
  if(policy?.activation!=='user'||this.phase==='closed')return result(false,'explicit-sa-start-required');
  if(this.phase==='playing')return result(true,'already-playing');
  if(this.phase==='paused'&&this.buffer)return this.resume();
  const ticket=++this.epoch;this.abort?.abort();this.retireNode();this.retireContext();
  const abort=new AbortController();this.abort=abort;this.phase='loading';this.failure=null;this.emit();
  let context:AudioContext;
  try{
   context=this.options.createContext?.()??new AudioContext({sampleRate:48000,latencyHint:'interactive'});
   this.context=context;
   if(context.sampleRate!==48000)throw Error('P024_SA_CONTEXT_RATE_MISMATCH');
   this.gain=context.createGain();
   this.gain.gain.setValueAtTime(this.volume,context.currentTime);
   this.gain.connect(context.destination);
  }catch(error){this.retireContext();this.phase='error';this.failure=String(error);this.emit();
   return result(false,this.failure);}
  // Resume starts inside the explicit click, before loading or decoding awaits.
  const resumed=context.resume();
  const run=(async():Promise<P024ClockResult>=>{
   try{
    await resumed;
    if(ticket!==this.epoch||abort.signal.aborted)return result(false,'stale-sa-start');
    if(context.state!=='running')throw Error('P024_SA_CONTEXT_NOT_RUNNING');
    const input=await this.options.load(abort.signal);
    if(ticket!==this.epoch||abort.signal.aborted)return result(false,'stale-sa-load');
    if(!(input instanceof ArrayBuffer)||input.byteLength!==P024_AUDIO_SA.sourceBytes)
     throw Error('P024_SA_SOURCE_LENGTH_MISMATCH');
    const digest=await crypto.subtle.digest('SHA-256',input.slice(0));
    const hash=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
    if(ticket!==this.epoch)return result(false,'stale-sa-hash');
    if(hash!==P024_AUDIO_SA.sourceSha256)throw Error('P024_SA_SOURCE_HASH_MISMATCH');
    const buffer=await context.decodeAudioData(input.slice(0));
    if(ticket!==this.epoch)return result(false,'stale-sa-decode');
    if(buffer.sampleRate!==48000||buffer.numberOfChannels!==1||buffer.length<=0||
       Math.abs(buffer.duration-buffer.length/buffer.sampleRate)>1/buffer.sampleRate)
     throw Error('P024_SA_BROWSER_DECODE_METADATA_INVALID');
    this.buffer=buffer;this.browserDecode={sampleRate:buffer.sampleRate,samples:buffer.length,
     channels:buffer.numberOfChannels,ffmpegSampleCountMatches:buffer.length===P024_AUDIO_SA.ffmpegSamples};
    this.beginAt(0,ticket);return result(true,'separate-sa-playing');
   }catch(error){
    if(ticket!==this.epoch)return result(false,'stale-sa-start');
    this.failure=error instanceof Error?error.message:String(error);this.phase='error';
    this.retireNode();this.retireContext();this.emit();return result(false,this.failure);
   }finally{if(this.abort===abort)this.abort=null;}
  })();
  this.pending=run;void run.finally(()=>{if(this.pending===run)this.pending=null;});
  return run;
 }
 async resume():Promise<P024ClockResult>{
  if(this.phase==='closed')return result(false,'sa-closed');
  if(this.phase!=='paused'||!this.buffer||!this.context)return this.start({activation:'user'});
  const ticket=++this.epoch,context=this.context;
  try{await context.resume();if(ticket!==this.epoch)return result(false,'stale-sa-resume');
   this.beginAt(this.offset,ticket);return result(true,'separate-sa-resumed');
  }catch(error){if(ticket!==this.epoch)return result(false,'stale-sa-resume');
   this.failure=String(error);this.phase='error';this.emit();return result(false,this.failure);}
 }
 pause():P024ClockResult{
  if(this.phase==='closed')return result(false,'sa-closed');
  if(this.phase==='playing'&&this.context&&this.buffer)
   this.offset=Math.min(this.buffer.duration,this.offset+Math.max(0,this.context.currentTime-this.anchor));
  this.epoch++;this.abort?.abort();this.abort=null;this.retireNode();
  if(this.phase==='loading')this.retireContext();
  this.phase='paused';this.emit();return result(true,'separate-sa-paused');
 }
 stop():P024ClockResult{
  if(this.phase==='closed')return result(false,'sa-closed');
  this.epoch++;this.abort?.abort();this.abort=null;this.retireNode();this.retireContext();
  this.offset=0;this.phase='idle';this.failure=null;this.emit();return result(true,'separate-sa-stopped');
 }
 async stopAndWait(){this.stop();const pending=this.pending;
  if(pending)await pending.catch(()=>{});await this.disposal;}
 setVolume(value:number):P024ClockResult{
  if(this.phase==='closed'||!Number.isFinite(value)||value<0||value>1)
   return result(false,'invalid-volume');
  this.volume=value;this.gain?.gain.setValueAtTime(value,this.context!.currentTime);
  this.emit();return result(true,'volume-set');
 }
 async close(){if(this.phase==='closed'){await this.disposal;return;}
  this.stop();this.phase='closed';this.emit();const pending=this.pending;
  if(pending)await pending.catch(()=>{});await this.disposal;}
}

const SOURCE_SWF='e36c6c293f1e620f82fa84d57a1b91fd0a977d24d365772126f87333ce359d05';
function feedbackSprite(state:P024State){
 if((state.phase!=='feedback'&&state.phase!=='popup')||!state.feedback)return null;
 const spriteId=Number(state.feedback.slice('sprite-'.length));
 if(![69,83,97,123,155,188,196].includes(spriteId))throw Error('P024_FEEDBACK_ID_INVALID');
 return {spriteId:spriteId as FeedbackSprite,frame:state.feedbackFrame};
}
/** The optional suppression request is sent only to a renderer that advertises
 * exact source-ID suppression. The v1 renderer keeps all static glyphs. */
export function p024PaintVerifiedFrame(asset:P024CanvasAssetV1,canvas:HTMLCanvasElement,
 state:P024State):boolean{
 const m=asset.metadata;
 if(m.animationId!=='shared-alg001-l06-p024'||m.sourceSwfSha256!==SOURCE_SWF||
  m.stage.width!==800||m.stage.height!==600||m.fps!==12||
  m.deterministicContentTimeline.timelineId!=='sprite-208'||
  m.deterministicContentTimeline.frameCount!==381||
  (m.mainQuizStopFrame!==undefined&&m.mainQuizStopFrame!==154))
  throw Error('P024_CANVAS_ASSET_IDENTITY_MISMATCH');
 const presentation=p024PresentationState(state),feedback=feedbackSprite(state);
 const supportsSuppression=m.sourceGlyphRendering?.suppressTextIdsSupported===true;
 const request:P024CanvasRequest={frame:state.mainFrame,scenario:'source-static-frame',lang:'en',seed:0};
 if(feedback)request.feedback=feedback;
 if(supportsSuppression)request.suppressTextIds=presentation.ownership.suppressibleSourceTextIds;
 const committed=asset.render(canvas,request);
 if(supportsSuppression&&(!Array.isArray(committed.suppressedSourceTextIds)||
  committed.suppressedSourceTextIds.length!==request.suppressTextIds!.length||
  committed.suppressedSourceTextIds.some((id,index)=>id!==request.suppressTextIds![index])))
  throw Error('P024_CANVAS_TEXT_SUPPRESSION_MISMATCH');
 if(committed.localFrame!==state.mainFrame||committed.frameDomain!=='sprite-208'||
  committed.rootFrame!==6||committed.feedbackSpriteId!==(feedback?.spriteId??null)||
  committed.feedbackFrame!==(feedback?.frame??null)||
  canvas.getAttribute('data-flash-frame')!==String(state.mainFrame)||
  canvas.getAttribute('data-flash-frame-domain')!=='sprite-208'||
  canvas.getAttribute('data-flash-root-frame')!=='6')
  throw Error('P024_CANVAS_FRAME_COMMIT_MISMATCH');
 return supportsSuppression;
}

const srOnly:React.CSSProperties={position:'absolute',width:1,height:1,padding:0,
 margin:-1,overflow:'hidden',clip:'rect(0,0,0,0)',whiteSpace:'nowrap',border:0};
const buttonStyle:React.CSSProperties={minHeight:44,padding:'0.5em 0.8em',font:'inherit',
 border:'1px solid #356aa0',borderRadius:6,background:'#fff',color:'#15344c'};

export function P024PlayerV1({asset,loadAudio,loadSpanishAudio,createContext,
 createSpanishContext,language='en',reducedMotion=false,volume=1,chooseVariant,
 onSnapshot,connectControls,onOpenGlossary,nativeTextTarget,
 hidePlaybackControls=false}:P024PlayerPropsV1){
 const rootRef=useRef<HTMLDivElement>(null),canvasRef=useRef<HTMLCanvasElement>(null);
 const ownerRef=useRef<P024AudioOwnerV1|null>(null),clockRef=useRef<P024DomainClockV1|null>(null);
 const spanishRef=useRef<P024SeparateSpanishV1|null>(null);
 const stateRef=useRef<P024State>(p024InitialState(language));
 const [state,setState]=useState<P024State>(()=>stateRef.current);
 const [ready,setReady]=useState(false),[error,setError]=useState<string|null>(null);
 const [saIssue,setSaIssue]=useState<string|null>(null);
 const readyRef=useRef(false),errorRef=useRef<string|null>(null);
 const [saPhase,setSaPhase]=useState('idle');
 const [canvasSuppresses,setCanvasSuppresses]=useState(false);
 const [replayCount,setReplayCount]=useState(0);
 const liveRef=useRef(false),generationRef=useRef(0),operationRef=useRef(0);
 const rafRef=useRef<number|null>(null),onSnapshotRef=useRef(onSnapshot);
 onSnapshotRef.current=onSnapshot;
 const reducedRef=useRef(reducedMotion);reducedRef.current=reducedMotion;
 const volumeRef=useRef(volume);volumeRef.current=volume;
 const variantRef=useRef(chooseVariant);variantRef.current=chooseVariant;
 const glossaryTriggerRef=useRef<HTMLButtonElement|null>(null);
 const glossaryFocusRef=useRef<HTMLButtonElement|null>(null);
 const stopLoop=()=>{if(rafRef.current!==null)cancelAnimationFrame(rafRef.current);rafRef.current=null;};
 const focusReading=()=>{queueMicrotask(()=>{
  if(!liveRef.current)return;
  const scope=nativeTextTarget??rootRef.current;
  const target=scope?.querySelector<HTMLElement>('[data-p024-native-reading="true"]');
  if(target?.isConnected){target.tabIndex=-1;target.focus({preventScroll:true});}
 });};
 const publish=()=>{const owner=ownerRef.current;
  if(!owner||!liveRef.current)return;
  try{onSnapshotRef.current?.({state:stateRef.current,audio:owner.snapshot(),
   visualReady:readyRef.current,error:errorRef.current});}
  catch(cause){stopLoop();owner.pause();errorRef.current=`snapshot-callback: ${String(cause)}`;
   setError(errorRef.current);}
 };
 const commit=(next:P024State)=>{
  if(!liveRef.current)return false;
  const canvas=canvasRef.current;if(!canvas)return false;
  try{const suppresses=p024PaintVerifiedFrame(asset,canvas,next);
   stateRef.current=next;setState(next);setCanvasSuppresses(suppresses);return true;
  }catch(cause){errorRef.current=String(cause);setError(errorRef.current);
   ownerRef.current?.pause();stopLoop();return false;}
 };
 const startLoop=(owner:P024AudioOwnerV1)=>{
  if(rafRef.current===null&&liveRef.current)
   rafRef.current=requestAnimationFrame(()=>tick(owner));
 };
 const sync=async(next:P024State,activation:'user'|'automatic')=>{
  const owner=ownerRef.current;if(!owner||!liveRef.current)return;
  const ticket=++operationRef.current,generation=generationRef.current;
  const started=await owner.sync(next,{activation,reducedMotion:reducedRef.current});
  if(generation!==generationRef.current||ticket!==operationRef.current||ownerRef.current!==owner)return;
  if(!started.accepted&&next.playing){errorRef.current=`source-audio: ${started.reason}`;
   setError(errorRef.current);commit(p024Reduce(stateRef.current,{type:'pause'}));}
  publish();if(owner.snapshot().clock.phase==='playing')startLoop(owner);
 };
 const tick=(owner:P024AudioOwnerV1)=>{
  rafRef.current=null;
  if(!liveRef.current||ownerRef.current!==owner)return;
  const s=stateRef.current,snap=owner.snapshot();
  if(snap.clock.phase==='failed'){
   errorRef.current=`source-audio: ${snap.clock.failure??'clock-failed'}`;
   setError(errorRef.current);commit(p024Reduce(s,{type:'pause'}));publish();return;
  }
  if(snap.selectedAudio==='source'&&s.playing&&
   (s.phase==='main'||s.phase==='feedback')){
   const current=s.phase==='main'?s.mainFrame:s.feedbackFrame;
   const target=snap.clock.domain===(s.phase==='main'?'sprite-208':s.feedback)?
    snap.clock.frame:current;
   const advance=Math.max(0,target-current);
   if(advance>0){const next=p024Reduce(s,{type:'tick',frames:Math.min(advance,1000)});
    if(next!==s){if(!commit(next))return;
     if(next.phase!==s.phase||next.feedback!==s.feedback){
      stopLoop();void sync(next,'automatic');publish();return;
     }}
   }
   if(snap.clock.phase==='paused'&&stateRef.current.playing){
    commit(p024Reduce(stateRef.current,{type:'pause'}));publish();return;
   }
  }
  publish();
  if(owner.snapshot().selectedAudio==='source'&&owner.snapshot().clock.phase==='playing')
   startLoop(owner);
 };

 useEffect(()=>{
  const generation=++generationRef.current,abort=new AbortController();
  liveRef.current=true;readyRef.current=false;errorRef.current=null;
  stateRef.current=p024InitialState(language);setState(stateRef.current);
  setReady(false);setError(null);setSaIssue(null);setSaPhase('idle');
  let owner:P024AudioOwnerV1|null=null;
  void (async()=>{
   try{
    await asset.ready();if(abort.signal.aborted||generation!==generationRef.current)return;
    const clock=new P024DomainClockV1({createContext});
    const spanish=new P024SeparateSpanishV1({
     load:loadSpanishAudio??(async()=>{throw Error('P024_SA_ASSET_UNAVAILABLE');}),
     createContext:createSpanishContext,
     onChange:()=>{if(liveRef.current){setSaPhase(spanish.snapshot().phase);publish();}},
     onEnded:()=>{if(!liveRef.current)return;
      const next=p024Reduce(stateRef.current,{type:'sa-ended'});
      if(next!==stateRef.current)commit(next);publish();},
    });
    owner=new P024AudioOwnerV1(clock,spanish);clockRef.current=clock;
    spanishRef.current=spanish;ownerRef.current=owner;
    if(!owner.setVolume(volumeRef.current).accepted)throw Error('P024_INVALID_VOLUME');
    const sources=await Promise.all(P024_AUDIO_DOMAINS.map(async row=>
     [row.id,await loadAudio(row.id,abort.signal)] as const));
    if(abort.signal.aborted||generation!==generationRef.current)return;
    for(const [id,bytes] of sources){
     const prepared=await clock.prepare(id,bytes);
     if(abort.signal.aborted||generation!==generationRef.current)return;
     if(!prepared.accepted)throw Error(`P024_AUDIO_${id}:${prepared.reason}`);
    }
    if(!commit(stateRef.current))throw Error('P024_FIRST_FRAME_NOT_COMMITTED');
    readyRef.current=true;setReady(true);publish();
   }catch(cause){if(abort.signal.aborted||generation!==generationRef.current)return;
    errorRef.current=String(cause);setError(errorRef.current);if(owner)void owner.close();}
  })();
  return()=>{abort.abort();generationRef.current++;operationRef.current++;
   liveRef.current=false;readyRef.current=false;stopLoop();glossaryTriggerRef.current=null;
   glossaryFocusRef.current=null;
   if(ownerRef.current===owner)ownerRef.current=null;
   clockRef.current=null;spanishRef.current=null;if(owner)void owner.close();};
 },[asset,loadAudio,loadSpanishAudio,createContext,createSpanishContext]);
 useEffect(()=>{ownerRef.current?.setVolume(volume);},[volume]);
 useEffect(()=>{if(stateRef.current.locale===language)return;
  const next=p024Reduce(stateRef.current,{type:'locale',locale:language});
  stateRef.current=next;setState(next);},[language]);
 useEffect(()=>{
  if(state.glossary!==null)return;
  const trigger=glossaryFocusRef.current;glossaryFocusRef.current=null;
  // The closing commit first re-enables the source button in React's DOM.
  if(liveRef.current&&trigger?.isConnected&&!trigger.disabled)
   trigger.focus({preventScroll:true});
 },[state.glossary]);

 const play=async()=>{
  const owner=ownerRef.current;if(!owner||!ready||error)return;
  if(owner.snapshot().selectedAudio==='spanish'){
   const spanish=spanishRef.current;if(!spanish||stateRef.current.sa!=='playing')return;
   const ticket=++operationRef.current,generation=generationRef.current;
   const started=await spanish.resume();
   if(ticket!==operationRef.current||generation!==generationRef.current)return;
   if(!started.accepted)setSaIssue(`spanish-audio: ${started.reason}`);
   else setSaIssue(null);
   publish();return;
  }
  const next=p024Reduce(stateRef.current,{type:'play'});
  if(next===stateRef.current)return;
  if(!commit(next))return;await sync(next,'user');
 };
 const pause=()=>{const owner=ownerRef.current;if(!owner)return;
  operationRef.current++;stopLoop();owner.pause();
  const next=p024Reduce(stateRef.current,{type:'pause'});commit(next);publish();};
 const replay=async()=>{const owner=ownerRef.current;if(!owner||!ready)return;
  operationRef.current++;stopLoop();const generation=generationRef.current;
  errorRef.current=null;setError(null);setSaIssue(null);
  const reset=owner.replay();
  const next=p024Reduce(stateRef.current,{type:'replay'});
  glossaryTriggerRef.current=null;glossaryFocusRef.current=null;if(!commit(next))return;
  setReplayCount(n=>n+1);const done=await reset;
  if(generation!==generationRef.current||ownerRef.current!==owner)return;
  if(!done.accepted)setError(`replay: ${done.reason}`);publish();};
 const answer=async(choice:P024Answer)=>{
  if(!ready||error)return;const s=stateRef.current;
  if(s.phase!=='quiz'||s.mainFrame!==154)return;
  const count=P024_ANSWERS[choice].correct?4:3;
  const raw=variantRef.current?.(count)??Math.floor(Math.random()*count)+1;
  if(!Number.isSafeInteger(raw)||raw<1||raw>count){setError('P024_VARIANT_INVALID');return;}
  const next=p024Reduce(s,{type:'answer',answer:choice,variant:raw});
  if(next===s||!commit(next))return;await sync(next,'user');
 };
 const closeWrong=async(trigger?:HTMLButtonElement)=>{
  const s=stateRef.current,next=p024Reduce(s,{type:'close-wrong'});
  if(next===s||!commit(next))return;
  if(trigger?.ownerDocument.activeElement===trigger)focusReading();
  await sync(next,'user');
 };
 const startSpanish=async()=>{
  const owner=ownerRef.current;if(!owner||!ready||!loadSpanishAudio||error)return;
  const s=stateRef.current,next=p024Reduce(s,{type:'sa-start'});
  if(next===s)return;setSaIssue(null);operationRef.current++;stopLoop();
  if(!commit(next))return;
  const ticket=++operationRef.current,generation=generationRef.current;
  const started=await owner.startSpanish(next);
  if(ticket!==operationRef.current||generation!==generationRef.current)return;
  if(!started.accepted){setSaIssue(`spanish-audio: ${started.reason}`);
   const restored=p024Reduce(next,{type:'sa-return'});
   if(commit(restored))await sync(restored,'automatic');}
  publish();
 };
 const returnSpanish=async(trigger?:HTMLButtonElement)=>{
  const owner=ownerRef.current;if(!owner||stateRef.current.sa==='idle')return;
  const hadFocus=trigger?.ownerDocument.activeElement===trigger;
  const next=p024Reduce(stateRef.current,{type:'sa-return'});
  operationRef.current++;stopLoop();if(!commit(next))return;
  const ticket=++operationRef.current,generation=generationRef.current;
  let returned:P024ClockResult;
  if(owner.snapshot().selectedAudio==='spanish')
   returned=await owner.returnFromSpanish(next,{activation:'automatic',
    reducedMotion:reducedRef.current});
  else{
   try{owner.pause();await spanishRef.current?.stopAndWait();
    if(ticket!==operationRef.current||generation!==generationRef.current)return;
    returned=await owner.sync(next,{activation:'automatic',reducedMotion:reducedRef.current});
   }catch(cause){returned=result(false,`spanish-stop: ${String(cause)}`);}
  }
  if(generation!==generationRef.current||ownerRef.current!==owner)return;
  // Pause may cancel automatic resume while the same owner finishes retiring
  // SA. Publish the released ownership without reviving the stale operation.
  if(ticket!==operationRef.current){publish();return;}
  if(!returned.accepted)setError(`spanish-return: ${returned.reason}`);
  else setSaIssue(null);
  if(hadFocus)focusReading();
  if(owner.snapshot().clock.phase==='playing')startLoop(owner);publish();
 };
 const closeGlossary=()=>{
  const s=stateRef.current,next=p024Reduce(s,{type:'glossary-close'});
  if(next===s)return;const trigger=glossaryTriggerRef.current;
  glossaryTriggerRef.current=null;glossaryFocusRef.current=trigger;if(!commit(next)){
   glossaryFocusRef.current=null;return;
  }
  if(next.playing)void sync(next,'automatic');
  publish();
 };
 const openGlossary=(key:P024GlossaryKey,trigger:HTMLButtonElement,instanceId:string)=>{
  const owner=ownerRef.current;if(!owner||!ready||error)return;
  const snapshot=p024PresentationState(stateRef.current);
  if(!snapshot.glossaryInstances.some(row=>row.key===key&&
   row.buttonInstanceId===instanceId&&row.interactionReady))return;
  const next=p024Reduce(stateRef.current,{type:'glossary-open',key,nativeReady:true});
  if(next===stateRef.current)return;
  operationRef.current++;stopLoop();owner.pause();
  glossaryTriggerRef.current=trigger;if(!commit(next))return;
  trigger.blur();publish();
  try{onOpenGlossary?.(key,trigger);}catch(cause){closeGlossary();setError(`glossary-host: ${String(cause)}`);}
 };
 const controlsRef=useRef<P024PlayerControlsV1|null>(null);
 controlsRef.current={setPaused:value=>value?pause():void play(),
  replay:()=>void replay(),narration:action=>action==='stop'?pause():void play(),
  stop:pause,answer:choice=>void answer(choice),closeWrong:()=>void closeWrong(),
  startSpanish:()=>void startSpanish(),returnSpanish:()=>void returnSpanish(),closeGlossary};
 useEffect(()=>connectControls?.({
  setPaused:value=>controlsRef.current?.setPaused(value),
  replay:()=>controlsRef.current?.replay(),
  narration:action=>controlsRef.current?.narration(action),
  stop:()=>controlsRef.current?.stop(),answer:choice=>controlsRef.current?.answer(choice),
  closeWrong:()=>controlsRef.current?.closeWrong(),
  startSpanish:()=>controlsRef.current?.startSpanish(),
  returnSpanish:()=>controlsRef.current?.returnSpanish(),
  closeGlossary:()=>controlsRef.current?.closeGlossary(),
 }),[connectControls]);

 const presentation=p024PresentationState(state);
 const labels=language==='es'?{
  controls:'Controles de la lección',play:'Reproducir',pause:'Pausar',replay:'Repetir',
  spanish:'Audio en español',returnMain:'Volver a la animación',close:'Cerrar',
  answer:'Elige una respuesta',glossary:'Términos de la lección',
  sourceNotice:'El texto de la animación original está en inglés.',
 }:{controls:'Lesson controls',play:'Play',pause:'Pause',replay:'Replay',
  spanish:'Spanish Audio',returnMain:'Return to animation',close:'Close',
  answer:'Choose an answer',glossary:'Lesson terms',
  sourceNotice:'Source animation text is in English.'};
 const mainSourceText=presentation.main.visibleText;
 const definition=mainSourceText.find(x=>x.instanceId==='sprite-208/depth-2/generation-1');
 const paragraph=mainSourceText.find(x=>x.instanceId==='sprite-208/depth-13/generation-1');
 const question=mainSourceText.find(x=>x.instanceId==='sprite-208/depth-21/generation-1');
 const tableRows=presentation.main.table.instanceIds.map(id=>mainSourceText.find(x=>x.instanceId===id));
 const staticNative=canvasSuppresses;
 const nativeReading=<section aria-label="Lesson text" data-p024-native-reading="true" tabIndex={-1}>
  {definition&&<p style={srOnly}>{definition.text}</p>}
  {presentation.main.table.sourceGeometryReady&&tableRows.every(Boolean)&&
   <table style={!staticNative||!presentation.main.table.nativeOwned?srOnly:
    {width:'100%',maxWidth:'24rem',borderCollapse:'collapse',margin:'1rem 0',lineHeight:1.6}}>
    <caption style={{textAlign:'left',fontWeight:600,paddingBottom:'0.5rem'}}>Input and Output</caption>
    <thead><tr><th scope="col" style={{textAlign:'left',padding:'0.5rem 1rem',border:'1px solid #91a8bd'}}>Input</th>
     <th scope="col" style={{textAlign:'left',padding:'0.5rem 1rem',border:'1px solid #91a8bd'}}>Output</th></tr></thead>
    <tbody>{[0,1,2].map(index=><tr key={index}>
     <td style={{padding:'0.5rem 1rem',border:'1px solid #91a8bd'}}>{tableRows[index+2]?.text}</td>
     <td style={{padding:'0.5rem 1rem',border:'1px solid #91a8bd'}}>{tableRows[index+5]?.text}</td></tr>)}</tbody></table>}
  {paragraph&&<p style={!staticNative||!presentation.ownership.nativeOwnedByRole.paragraph.length?
   srOnly:undefined}>{paragraph.text}</p>}
  {question&&<p style={!staticNative||!presentation.ownership.nativeOwnedByRole.question.length?
   srOnly:undefined}>{question.text}</p>}
 </section>;
 const controls=<div role="group" aria-label={labels.controls}
  style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',padding:'0.75rem 0'}}>
  {!hidePlaybackControls&&<>
   <button type="button" style={buttonStyle} onClick={()=>void play()}
    disabled={!ready||!!error||state.phase==='quiz'||state.phase==='popup'||
     state.phase==='ended'||state.glossary!==null||state.sa==='ended'}>{labels.play}</button>
   <button type="button" style={buttonStyle} onClick={pause}
    disabled={!ready||(!state.playing&&saPhase!=='playing')}>{labels.pause}</button>
   <button type="button" style={buttonStyle} onClick={()=>void replay()} disabled={!ready}>{labels.replay}</button>
  </>}
  <button type="button" style={buttonStyle} onClick={()=>void startSpanish()}
   disabled={!ready||!loadSpanishAudio||state.sa!=='idle'||state.glossary!==null}>
   {labels.spanish}</button>
  {state.sa!=='idle'&&<button type="button" style={buttonStyle}
   onClick={event=>void returnSpanish(event.currentTarget)}>{labels.returnMain}</button>}
  {state.glossary&&<button type="button" style={buttonStyle}
   onClick={closeGlossary}>{labels.close}</button>}
 </div>;
 const glossary=<div role="group" aria-label={labels.glossary}
  style={{display:'flex',flexWrap:'wrap',gap:'0.5rem'}}>
  {presentation.glossaryInstances.map(instance=><button type="button"
   key={instance.buttonInstanceId} style={buttonStyle}
   data-p024-glossary-key={instance.key}
   data-source-button-instance-id={instance.buttonInstanceId}
   disabled={!ready||!!error||!instance.interactionReady}
   onClick={event=>openGlossary(instance.key,event.currentTarget,instance.buttonInstanceId)}>
   {instance.key}</button>)}
 </div>;
 const answers=state.phase==='quiz'&&presentation.main.answers.length===4?
  <div role="group" aria-label={labels.answer}
   style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(13rem,1fr))',gap:'0.5rem'}}>
   {presentation.main.answers.map(a=><button type="button" key={a.label}
    style={buttonStyle} disabled={!isAnswer(a.label)}
    onClick={()=>{if(isAnswer(a.label))void answer(a.label);}}>
    <strong>{a.label}.</strong> {a.value}</button>)}
  </div>:null;
 const wrongPopup=state.phase==='popup'&&presentation.popupScene?.text?
  <div role="dialog" aria-modal="false" aria-label="Feedback"
   data-p024-popup-scene={presentation.popupScene.sceneId}>
   <p>{presentation.popupScene.text}</p>
   <button type="button" style={buttonStyle}
    onClick={event=>void closeWrong(event.currentTarget)}>{labels.close}</button>
  </div>:null;
 const companion=<>{nativeReading}{glossary}{answers}{wrongPopup}{controls}</>;
 return <div ref={rootRef} data-p024-player="true" data-p024-phase={state.phase}
  data-p024-main-frame={state.mainFrame} data-p024-replay={replayCount}
  data-p024-ready={String(ready)} data-p024-playing={String(state.playing)}
  data-p024-feedback-id={state.feedback??'none'}
  data-p024-feedback-frame={state.feedbackFrame}
  data-p024-wrong-count={state.wrongCount} data-p024-error={error??'none'}
  data-p024-audio-owner={state.sa==='idle'?'source':'separate-sa'}
  data-p024-sa-phase={saPhase} data-p024-source-language="en"
  data-p024-locale-policy="source-en-fallback">
  {language==='es'&&<p>{labels.sourceNotice}</p>}
  <canvas ref={canvasRef} width={800} height={600} aria-hidden="true"
   style={{display:ready?'block':'none',width:'100%',height:'auto'}}/>
  {nativeTextTarget&&ready?createPortal(companion,nativeTextTarget):companion}
  {error&&<p role="alert">{error}</p>}
  {saIssue&&<p role="alert">{saIssue}</p>}
 </div>;
}
