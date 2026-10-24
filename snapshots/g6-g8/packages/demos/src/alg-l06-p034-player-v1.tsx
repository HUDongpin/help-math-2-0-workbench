'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {createPortal,flushSync} from 'react-dom';
import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
import {AlgL06P034ClockV1,type P034GlossaryKey} from './alg-l06-p034-clock-v1';
import {P034OptionalSpanishAudio} from './alg-l06-p034-optional-spanish-audio-v1';
import {P034AudioOwnerV1} from './alg-l06-p034-audio-owner-v1';
import {P034VisualPlayerV1,p034CanOpenCommittedGlossary,
 type P034CanvasAssetV1} from './alg-l06-p034-visual-player-v1';

export type P034PlayerSnapshotV1=ReturnType<P034AudioOwnerV1['snapshot']>;
export interface P034PlayerControlsV1 {
 setPaused(paused:boolean):void;replay():boolean;
 narration(action:'play'|'stop'):void;stop():void;closeGlossary():void;
}
export interface P034PlayerPropsV1 {
 asset:P034CanvasAssetV1;
 audioBinding:DecodedSourceStreamBinding;spanishBinding:DecodedSourceStreamBinding;
 loadAudio:(signal:AbortSignal)=>Promise<ArrayBuffer>;
 loadSpanishAudio:(signal:AbortSignal)=>Promise<ArrayBuffer>;
 createContext?:()=>AudioContext;createSpanishContext?:()=>AudioContext;
 language?:'en'|'es';reducedMotion?:boolean;volume?:number;
 onSnapshot?:(snapshot:P034PlayerSnapshotV1&{returning:boolean})=>void;
 connectControls?:(controls:P034PlayerControlsV1)=>void|(()=>void);
 onOpenGlossary:(key:P034GlossaryKey,trigger:HTMLButtonElement)=>void;
 hidePlaybackControls?:boolean;nativeTextTarget?:HTMLElement|null;
}
type View={phase:string;frame:number;replay:number;selected:'main'|'spanish';
 saPhase:string;saCanResume:boolean;glossary:boolean;error:string;
 nativeEof:boolean;nativeEofPending:boolean;sourceStop:boolean};
const initial=(replay:number):View=>({phase:'loading',frame:1,replay,selected:'main',
 saPhase:'idle',saCanResume:false,glossary:false,error:'',nativeEof:false,
 nativeEofPending:false,sourceStop:false});

/** Page-owned composition of the verified visual commit, continuous main
 * clock, optional SA owner, and the existing My Lesson control protocol.
 * UI locale does not select audio; native main EOF does not complete a lesson. */
export function P034PlayerV1({asset,audioBinding,spanishBinding,loadAudio,
 loadSpanishAudio,createContext,createSpanishContext,language='en',
 reducedMotion=false,volume=1,onSnapshot,connectControls,onOpenGlossary,
 hidePlaybackControls=false,nativeTextTarget=null}:P034PlayerPropsV1){
 const [view,setView]=useState<View>(()=>initial(0));
 const [visualReady,setVisualReady]=useState(false);
 const commit=useRef<((frame:number,replayToken?:number)=>boolean)|null>(null);
 const committedFrame=useRef(0),replayToken=useRef(0);
 const generation=useRef(0),live=useRef(false),raf=useRef<number|null>(null);
 const clock=useRef<AlgL06P034ClockV1|null>(null),owner=useRef<P034AudioOwnerV1|null>(null);
 const glossaryTrigger=useRef<HTMLButtonElement|null>(null);
 const observer=useRef(onSnapshot),opened=useRef(onOpenGlossary),reduced=useRef(reducedMotion);
 observer.current=onSnapshot;opened.current=onOpenGlossary;reduced.current=reducedMotion;
 const stopLoop=()=>{if(raf.current!==null)cancelAnimationFrame(raf.current);raf.current=null;};
 const fail=(error:unknown)=>{
  stopLoop();owner.current?.pause();
  setView(p=>({...p,phase:'failed',error:error instanceof Error?error.message:String(error)}));
 };
 const show=(instance:P034AudioOwnerV1)=>{
  if(!live.current||owner.current!==instance)return;
  const s=instance.snapshot();
  setView(p=>({...p,phase:s.playbackPhase,frame:s.frame,
   selected:s.selectedAudio,saPhase:s.spanish.phase,saCanResume:s.spanish.canResume,
   glossary:s.main.glossaryOpen!==null,error:s.failure??'',
   nativeEof:s.main.nativeEofObserved,nativeEofPending:s.main.nativeEofPending,
   sourceStop:s.frame===433}));
  try{observer.current?.({...s,returning:s.transitioning});}catch(error){fail(error);}
 };
 const tick=(instance:P034AudioOwnerV1)=>{
  raf.current=null;if(!live.current||owner.current!==instance)return;
  show(instance);const s=instance.snapshot();
  if(s.phase==='playing'&&s.selectedAudio==='main')
   raf.current=requestAnimationFrame(()=>tick(instance));
 };
 const runLoop=(instance:P034AudioOwnerV1)=>{
  const s=instance.snapshot();
  if(s.phase==='playing'&&s.selectedAudio==='main'&&raf.current===null)
   raf.current=requestAnimationFrame(()=>tick(instance));
 };
 const connectFrameCommit=useCallback((value:(frame:number,replayToken?:number)=>boolean)=>{
  commit.current=value;setVisualReady(true);
  return()=>{if(commit.current===value){commit.current=null;setVisualReady(false);}};
 },[]);
 const onCommittedFrame=useCallback((frame:number,token:number)=>{
  if(token!==replayToken.current)return;
  committedFrame.current=frame;
  setView(p=>p.frame===frame&&p.replay===token?p:{...p,frame,replay:token});
 },[]);

 useEffect(()=>{
  if(!visualReady||!commit.current)return;
  const ticket=++generation.current,abort=new AbortController();
  live.current=true;glossaryTrigger.current=null;committedFrame.current=0;
  const token=++replayToken.current;setView(initial(token));
  let instance:P034AudioOwnerV1|null=null;
  void(async()=>{
   try{
    const main=new AlgL06P034ClockV1({binding:audioBinding,createContext,
     commitFrame:next=>{
      if(!live.current||generation.current!==ticket)return false;
      const painted=commit.current?.(next,replayToken.current)===true;
      if(painted)committedFrame.current=next;
      return painted;
     },canOpenGlossary:(key,next)=>{
      // This callback runs only for a live glossary click. The clock has just
      // committed Canvas; synchronously publish its native companion before
      // rechecking the exact source instance, frame and mask. A replaced
      // source button remains unavailable; the clock is never rewound.
      flushSync(()=>setView(p=>({...p,frame:next,replay:replayToken.current})));
      const trigger=glossaryTrigger.current;
      return !!trigger&&trigger.isConnected&&!trigger.disabled&&
       trigger.dataset.p034GlossaryKey===key&&
       trigger.closest('[data-p034-native-text="true"]')?.getAttribute('data-p034-frame')===String(next)&&
       p034CanOpenCommittedGlossary(key,next,committedFrame.current);
     }});
    const sa=new P034OptionalSpanishAudio({binding:spanishBinding,
     load:loadSpanishAudio,createContext:createSpanishContext,
     onChange:()=>{if(instance)show(instance);},onEnded:()=>{if(instance)show(instance);}});
    instance=new P034AudioOwnerV1(main,sa);clock.current=main;owner.current=instance;
    if(!instance.setVolume(volume).accepted)throw Error('P034_INVALID_VOLUME');
    const bytes=await loadAudio(abort.signal);
    if(abort.signal.aborted||generation.current!==ticket)return;
    const prepared=await main.prepare(bytes);
    if(abort.signal.aborted||generation.current!==ticket)return;
    if(!prepared.accepted)throw Error(prepared.reason);show(instance);
   }catch(error){
    if(abort.signal.aborted||generation.current!==ticket)return;
    fail(error);if(instance)void instance.close();
   }
  })();
  return()=>{
   abort.abort();generation.current++;live.current=false;stopLoop();glossaryTrigger.current=null;
   if(owner.current===instance){owner.current=null;clock.current=null;}
   if(instance)void instance.close();
  };
 },[asset,visualReady,audioBinding,spanishBinding,loadAudio,loadSpanishAudio,
  createContext,createSpanishContext]);
 useEffect(()=>{const value=owner.current;
  if(value&&!value.setVolume(volume).accepted)fail(Error('P034_INVALID_VOLUME'));
 },[volume]);
 const actions=useRef<{
  play():Promise<void>;pause():void;replay():Promise<boolean>;
  startSpanish():Promise<void>;returnMain():Promise<void>;
  openGlossary(key:P034GlossaryKey,trigger:HTMLButtonElement):boolean;closeGlossary():void;
 }|null>(null);
 actions.current={
  async play(){const value=owner.current;if(!value)return;
   try{await value.play({activation:'user',reducedMotion:reduced.current});
    if(owner.current===value){show(value);runLoop(value);}}
   catch(error){if(owner.current===value)fail(error);}},
  pause(){const value=owner.current;if(!value)return;stopLoop();value.pause();show(value);},
  async replay(){const value=owner.current;if(!value)return false;
   stopLoop();glossaryTrigger.current=null;replayToken.current++;
   try{const reset=await value.replay();
    if(owner.current!==value)return false;
    if(!reset.accepted){show(value);fail(Error(reset.reason));return false;}
    setView(p=>({...p,replay:replayToken.current}));show(value);return true;
   }catch(error){if(owner.current===value)fail(error);return false;}},
  async startSpanish(){const value=owner.current;if(!value)return;stopLoop();
   try{await value.startSpanish({activation:'user'});
    if(owner.current===value){show(value);runLoop(value);}}
   catch(error){if(owner.current===value)fail(error);}},
  async returnMain(){const value=owner.current;if(!value)return;
   try{await value.returnMain({activation:'user',reducedMotion:reduced.current});
    if(owner.current===value){show(value);runLoop(value);}}
   catch(error){if(owner.current===value)fail(error);}},
  openGlossary(key,trigger){const value=owner.current,main=clock.current;
   if(!value||!main||value.snapshot().selectedAudio!=='main')return false;
   glossaryTrigger.current=trigger;
   const held=main.openGlossary(key);
   if(!held.accepted){glossaryTrigger.current=null;return false;}
   stopLoop();show(value);
   try{opened.current(key,trigger);return main.snapshot().glossaryOpen===key;}
   catch(error){main.closeGlossary();glossaryTrigger.current=null;fail(error);return false;}},
  closeGlossary(){const main=clock.current,value=owner.current;
   main?.closeGlossary();const trigger=glossaryTrigger.current;glossaryTrigger.current=null;
   if(value)show(value);
   if(trigger?.isConnected&&!trigger.disabled)trigger.focus({preventScroll:true});},
 };
 useEffect(()=>connectControls?.({
  setPaused:paused=>{if(paused)actions.current?.pause();else void actions.current?.play();},
  replay:()=>{const value=owner.current;
   if(!value||!live.current)return false;
   const state=value.snapshot();
   // Decline unusable main clocks so My Lesson performs its real remount.
   if(state.closed||!['ready','paused','playing','start-pending','timeline-ended']
    .includes(state.main.phase))return false;
   void actions.current?.replay();return true;},
  narration:action=>{if(action==='stop')actions.current?.pause();else void actions.current?.play();},
  stop:()=>actions.current?.pause(),closeGlossary:()=>actions.current?.closeGlossary(),
 }),[connectControls]);
 const onGlossary=useCallback((key:P034GlossaryKey,trigger:HTMLButtonElement)=>
  actions.current?.openGlossary(key,trigger)??false,[]);
 const labels=language==='es'?{
  controls:'Controles de reproducción',play:'Reproducir',pause:'Pausar',replay:'Repetir',
  spanish:'Audio en español',returnMain:'Volver a la animación',stopped:'La reproducción se detuvo:'
 }:{controls:'Lesson playback controls',play:'Play',pause:'Pause',replay:'Replay',
  spanish:'Spanish Audio',returnMain:'Return to animation',stopped:'Lesson playback stopped:'};
 const canPlay=view.selected==='spanish'?view.saCanResume:['ready','paused'].includes(view.phase);
 const controls=<div role="group" aria-label={labels.controls} data-p034-control-group="true">
  {!hidePlaybackControls&&<>
   <button type="button" onClick={()=>void actions.current?.play()}
    disabled={view.glossary||!canPlay}>{labels.play}</button>
   <button type="button" onClick={()=>actions.current?.pause()}
    disabled={!['playing','start-pending','loading'].includes(view.phase)}>{labels.pause}</button>
   <button type="button" onClick={()=>void actions.current?.replay()}
    disabled={view.phase==='loading'}>{labels.replay}</button>
  </>}
  <button type="button" onClick={()=>void actions.current?.startSpanish()}
   disabled={view.phase==='loading'||view.phase==='failed'||view.phase==='closed'||
    view.phase==='transitioning'||view.selected==='spanish'||view.glossary}>{labels.spanish}</button>
  {view.selected==='spanish'&&<button type="button" onClick={()=>void actions.current?.returnMain()}
   disabled={view.phase==='transitioning'}>{labels.returnMain}</button>}
 </div>;
 return <div data-p034-player="true" data-p034-phase={view.phase}
  data-p034-frame={view.frame} data-p034-replay={view.replay}
  data-p034-audio-owner={view.selected} data-p034-sa-phase={view.saPhase}
  data-p034-main-native-eof={String(view.nativeEof)}
  data-p034-main-native-eof-pending={String(view.nativeEofPending)}
  data-p034-authored-stop={String(view.sourceStop)}
  data-p034-glossary-open={String(view.glossary)} data-p034-source-alignment="unverified"
  data-p034-audio-policy="continuous-main-explicit-separate-sa">
  <style>{`[data-p034-control-group]{display:flex;flex-wrap:wrap;gap:.5rem;padding:.75rem;box-sizing:border-box;min-width:0;max-width:100%;font:inherit}
   [data-p034-control-group] button{min-height:44px;min-width:0;max-width:100%;padding:.45em .8em;font:inherit;overflow-wrap:anywhere}`}</style>
  <P034VisualPlayerV1 asset={asset} frame={view.frame} replayToken={view.replay}
   language={language} nativeTextTarget={nativeTextTarget}
   connectFrameCommit={connectFrameCommit} onCommittedFrame={onCommittedFrame}
   onOpenGlossary={onGlossary} onError={fail}/>
  {nativeTextTarget?createPortal(controls,nativeTextTarget):controls}
  {view.error&&<p role="alert">{labels.stopped} {view.error}</p>}
 </div>;
}
