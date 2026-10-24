'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
import {AlgL06P028ClockV1,type P028GlossaryKey} from './alg-l06-p028-clock-v1';
import {P028OptionalSpanishAudio} from './alg-l06-p028-optional-spanish-audio-v1';
import {P028AudioOwnerV1} from './alg-l06-p028-audio-owner-v1';
import {loadP028MainAudioSource} from './alg-l06-p028-audio-source-v1';

export interface P028PlayerControlsV1 {
 play():Promise<void>;pause():void;replay():Promise<boolean>;
 startSpanish():Promise<void>;returnMain():Promise<void>;
 openGlossary(key:P028GlossaryKey,trigger:HTMLButtonElement):boolean;
 closeGlossary():void;stop():void;
}
export interface P028AudioPlayerPropsV1 {
 /** The visual owner paints and verifies this exact sprite-30 frame synchronously. */
 commitFrame:(frame:number)=>boolean;
 canOpenGlossary:(key:P028GlossaryKey,frame:number,trigger:HTMLButtonElement)=>boolean;
 onOpenGlossary:(key:P028GlossaryKey,trigger:HTMLButtonElement)=>void;
 audioBinding:DecodedSourceStreamBinding;spanishBinding:DecodedSourceStreamBinding;
 loadAudio?:(signal:AbortSignal)=>Promise<ArrayBuffer>;
 loadSpanishAudio?:(signal:AbortSignal)=>Promise<ArrayBuffer>;
 createContext?:()=>AudioContext;createSpanishContext?:()=>AudioContext;
 language?:'en'|'es';reducedMotion?:boolean;volume?:number;
 children?:ReactNode;
 onSnapshot?:(snapshot:ReturnType<P028AudioOwnerV1['snapshot']>)=>void;
 connectControls?:(controls:P028PlayerControlsV1)=>void|(()=>void);
 hidePlaybackControls?:boolean;
}

/** Source-bound audio/control wrapper. Visual drawing remains page-owned. */
export function P028AudioPlayerV1({commitFrame,canOpenGlossary,onOpenGlossary,
 audioBinding,spanishBinding,loadAudio=loadP028MainAudioSource,loadSpanishAudio,
 createContext,createSpanishContext,language='en',reducedMotion=false,volume=1,
 children,onSnapshot,connectControls,hidePlaybackControls=false}:P028AudioPlayerPropsV1){
 const live=useRef(false),generation=useRef(0),raf=useRef<number|null>(null);
 const clock=useRef<AlgL06P028ClockV1|null>(null),owner=useRef<P028AudioOwnerV1|null>(null);
 const frame=useRef(1),glossaryTrigger=useRef<HTMLButtonElement|null>(null);
 const commitRef=useRef(commitFrame),gateRef=useRef(canOpenGlossary);
 const openedRef=useRef(onOpenGlossary),snapshotRef=useRef(onSnapshot);
 const reducedRef=useRef(reducedMotion);
 commitRef.current=commitFrame;gateRef.current=canOpenGlossary;
 openedRef.current=onOpenGlossary;snapshotRef.current=onSnapshot;
 reducedRef.current=reducedMotion;
 const [view,setView]=useState({phase:'loading',frame:1,replay:0,error:'',
   selected:'main',saPhase:'idle',glossary:false});
 const stopLoop=()=>{if(raf.current!==null)cancelAnimationFrame(raf.current);
   raf.current=null;};
 const show=(o:P028AudioOwnerV1)=>{
   if(!live.current||owner.current!==o)return;
   const s=o.snapshot();
   setView(p=>({...p,phase:s.playbackPhase,frame:s.frame,
     selected:s.selectedAudio,saPhase:s.spanish.phase,
     glossary:s.main.glossaryOpen!==null,error:s.failure??''}));
   try{snapshotRef.current?.(s);}catch(error){
     stopLoop();o.pause();setView(p=>({...p,phase:'failed',
       error:`snapshot-callback: ${String(error)}`}));}
 };
 const tick=(o:P028AudioOwnerV1)=>{
   raf.current=null;if(!live.current||owner.current!==o)return;
   show(o);const s=o.snapshot();
   if(s.phase==='playing'&&s.selectedAudio==='main')
     raf.current=requestAnimationFrame(()=>tick(o));
 };
 useEffect(()=>{
   const ticket=++generation.current,abort=new AbortController();
   live.current=true;frame.current=1;glossaryTrigger.current=null;
   setView({phase:'loading',frame:1,replay:0,error:'',selected:'main',
     saPhase:'idle',glossary:false});
   let instance:P028AudioOwnerV1|null=null;
   void (async()=>{
     try{
       const main=new AlgL06P028ClockV1({binding:audioBinding,createContext,
         commitFrame:next=>{
           if(!live.current||ticket!==generation.current)return false;
           const okay=commitRef.current(next);if(okay)frame.current=next;
           return okay;},
         canOpenGlossary:(key,next)=>{
           const trigger=glossaryTrigger.current;
           return !!trigger&&gateRef.current(key,next,trigger);}});
       const sa=new P028OptionalSpanishAudio({binding:spanishBinding,
         createContext:createSpanishContext,load:loadSpanishAudio,
         onChange:()=>{if(instance)show(instance);},
         onEnded:()=>{if(instance)show(instance);}});
       instance=new P028AudioOwnerV1(main,sa);
       clock.current=main;owner.current=instance;
       if(!instance.setVolume(volume).accepted)throw Error('P028_INVALID_VOLUME');
       const bytes=await loadAudio(abort.signal);
       if(abort.signal.aborted||ticket!==generation.current)return;
       const ready=await main.prepare(bytes);
       if(abort.signal.aborted||ticket!==generation.current)return;
       if(!ready.accepted)throw Error(ready.reason);show(instance);
     }catch(error){
       if(abort.signal.aborted||ticket!==generation.current)return;
       setView(p=>({...p,phase:'failed',error:String(error)}));
       if(instance)void instance.close();}
   })();
   return()=>{abort.abort();generation.current++;live.current=false;
     stopLoop();glossaryTrigger.current=null;
     if(owner.current===instance)owner.current=null;
     clock.current=null;if(instance)void instance.close();};
 },[audioBinding,spanishBinding,loadAudio,loadSpanishAudio,createContext,
   createSpanishContext]);
 useEffect(()=>{owner.current?.setVolume(volume);},[volume]);
 const controls=useRef<P028PlayerControlsV1|null>(null);
 controls.current={
   async play(){const o=owner.current;if(!o)return;
     await o.play({activation:'user',reducedMotion:reducedRef.current});
     if(owner.current!==o)return;show(o);
     if(o.snapshot().phase==='playing'&&o.snapshot().selectedAudio==='main'&&
       raf.current===null)raf.current=requestAnimationFrame(()=>tick(o));},
   pause(){const o=owner.current;if(!o)return;stopLoop();o.pause();show(o);},
   async replay(){const o=owner.current;if(!o)return false;
     stopLoop();glossaryTrigger.current=null;
     const reset=await o.replay();if(owner.current!==o)return false;
     if(reset.accepted)setView(p=>({...p,replay:p.replay+1}));
     show(o);return reset.accepted;},
   async startSpanish(){const o=owner.current;if(!o)return;stopLoop();
     await o.startSpanish({activation:'user'});if(owner.current===o)show(o);},
   async returnMain(){const o=owner.current;if(!o)return;
     await o.returnMain({activation:'user',reducedMotion:reducedRef.current});
     if(owner.current!==o)return;show(o);
     if(o.snapshot().phase==='playing'&&o.snapshot().selectedAudio==='main'&&
       raf.current===null)raf.current=requestAnimationFrame(()=>tick(o));},
   openGlossary(key,trigger){const o=owner.current,c=clock.current;
     if(!o||!c||o.snapshot().selectedAudio!=='main'||
       c.snapshot().frame!==frame.current)return false;
     glossaryTrigger.current=trigger;const held=c.openGlossary(key);
     if(!held.accepted){glossaryTrigger.current=null;return false;}
     stopLoop();show(o);
     try{openedRef.current(key,trigger);}catch(error){
       c.closeGlossary();glossaryTrigger.current=null;
       setView(p=>({...p,phase:'failed',error:String(error)}));return false;}
     return true;},
   closeGlossary(){const c=clock.current,o=owner.current;
     c?.closeGlossary();const trigger=glossaryTrigger.current;
     glossaryTrigger.current=null;if(o)show(o);
     if(trigger?.isConnected&&!trigger.disabled)trigger.focus({preventScroll:true});},
   stop(){controls.current?.pause()},
 };
 useEffect(()=>connectControls?.({
   play:()=>controls.current!.play(),pause:()=>controls.current!.pause(),
   replay:()=>controls.current!.replay(),
   startSpanish:()=>controls.current!.startSpanish(),
   returnMain:()=>controls.current!.returnMain(),
   openGlossary:(key,trigger)=>controls.current!.openGlossary(key,trigger),
   closeGlossary:()=>controls.current!.closeGlossary(),
   stop:()=>controls.current!.stop(),
 }),[connectControls]);
 const labels=language==='es'?{
   controls:'Controles de reproducción',play:'Reproducir',pause:'Pausar',
   replay:'Repetir',spanish:'Audio en español',returnMain:'Volver a la animación',
   stopped:'La reproducción se detuvo:'
 }:{controls:'Lesson playback controls',play:'Play',pause:'Pause',
   replay:'Replay',spanish:'Spanish Audio',returnMain:'Return to animation',
   stopped:'Lesson playback stopped:'};
 const c=controls.current;
 return <div data-p028-audio-player="true" data-p028-phase={view.phase}
   data-p028-frame={view.frame} data-p028-replay={view.replay}
   data-p028-audio-owner={view.selected} data-p028-sa-phase={view.saPhase}
   data-p028-glossary-open={view.glossary?'true':'false'}
   data-p028-source-alignment="unverified"
   data-p028-audio-policy="explicit-one-main-run-and-separate-sa">
   {children}
   <div role="group" aria-label={labels.controls}>
     {!hidePlaybackControls&&<>
       <button type="button" onClick={()=>void c?.play()}
         disabled={!['ready','paused'].includes(view.phase)||view.glossary||
           view.selected!=='main'}>{labels.play}</button>
       <button type="button" onClick={()=>c?.pause()}
         disabled={!['playing','start-pending','loading'].includes(view.phase)}>
         {labels.pause}</button>
       <button type="button" onClick={()=>void c?.replay()}
         disabled={view.phase==='loading'}>{labels.replay}</button>
     </>}
     <button type="button" onClick={()=>void c?.startSpanish()}
       disabled={view.phase==='loading'||view.phase==='transitioning'||
         view.selected==='spanish'||view.glossary}>{labels.spanish}</button>
     {view.selected==='spanish'&&<button type="button"
       onClick={()=>void c?.returnMain()}
       disabled={view.phase==='transitioning'}>{labels.returnMain}</button>}
   </div>
   {view.error&&<p role="alert">{labels.stopped} {view.error}</p>}
 </div>;
}
