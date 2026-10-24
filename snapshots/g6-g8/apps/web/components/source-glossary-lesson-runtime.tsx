'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import type {AnimationModule} from '../../../packages/demos/src/contract';
import {SourceGlossaryControls,type SourceGlossaryControlPage} from '../../../packages/demos/src/source-glossary-controls';
import {SourceGlossarySession,type GlossaryTransport} from '../../../packages/demos/src/source-glossary-session';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';

export interface OptionalSourceAudio {
 start():Promise<unknown>;pause():void;stop():void;setVolume(volume:number):void;close():Promise<void>;
 snapshot():{phase:string};
}
export interface SourceGlossaryRuntimeConfig {
 page:SourceGlossaryControlPage;
 loadModule:()=>Promise<AnimationModule>;
 createTransport:(origin:string)=>GlossaryTransport;
 createSpanish?:(origin:string,onEnded:()=>void,onChange:(state:{phase:string})=>void)=>OptionalSourceAudio;
}

/** Pair-calibrated My Lesson bridge. Source-specific frames, assets and text
 * stay in config. One session owns playback, glossary pause and completion. */
export function SourceGlossaryLessonRuntime(props:LessonRuntimeAdapterProps&{config:SourceGlossaryRuntimeConfig}){
 const {config,connectRuntimeControls,onPlaybackStateChange}=props;
 const latest=useRef(props);useLayoutEffect(()=>{latest.current=props;},[props]);
 const root=useRef<HTMLDivElement>(null),session=useRef<SourceGlossarySession|null>(null);
 const spanish=useRef<OptionalSourceAudio|null>(null),spanishSelected=useRef(false);
 const [drawing,setDrawing]=useState<AnimationModule|null>(null),[ready,setReady]=useState(false),[failed,setFailed]=useState(false);
 const [frame,setFrame]=useState(1),[phase,setPhase]=useState('paused'),[replay,setReplay]=useState(0);
 const [spanishPhase,setSpanishPhase]=useState('idle'),[selected,setSelected]=useState(false),[glossaryOpen,setGlossaryOpen]=useState(false);
 const lastSeek=useRef<number|null>(null),activeSeek=useRef<number|null>(null);
 const rendered=useRef(''),live=useRef(false),reducedParked=useRef(false);
 const publish=useCallback(()=>{
  const state=session.current?.tick();if(!state)return;
  const sa=spanish.current?.snapshot().phase??'idle';
  const identity=[state.frame,state.phase,sa,Boolean(session.current?.glossary),spanishSelected.current].join(':');
  if(identity===rendered.current)return;
  rendered.current=identity;setFrame(state.frame);setPhase(state.phase);setSpanishPhase(sa);
  setGlossaryOpen(Boolean(session.current?.glossary));setSelected(spanishSelected.current);
 },[]);
 const pause=useCallback(()=>{session.current?.pause();spanish.current?.pause();publish();},[publish]);
 const cancelSpanish=useCallback(()=>{spanishSelected.current=false;spanish.current?.stop();publish();},[publish]);
 const play=useCallback(()=>{
  if(spanishSelected.current){void spanish.current?.start();publish();return;}
  activeSeek.current=null;
  const owned=session.current;
  if(!owned?.isReady){queueMicrotask(()=>{if(live.current)latest.current.onRuntimePausedChange(true);});return;}
  const resetParked=reducedParked.current;reducedParked.current=false;
  const started=resetParked?owned?.replay():owned?.play();
  void started?.then(result=>{if(live.current){if(!result)latest.current.onRuntimePausedChange(true);publish();}});publish();
 },[publish,config.page.frameCount]);
 const returnMain=useRef<()=>void>(()=>{});
 useLayoutEffect(()=>{returnMain.current=()=>{
  cancelSpanish();const state=session.current?.snapshot();
  if(state&&state.phase!=='ended'&&state.phase!=='closed'&&!reducedParked.current&&!session.current?.glossary)play();
  else session.current?.pause();
 };},[cancelSpanish,config.page.frameCount,play]);

 useEffect(()=>{
  if(process.env.NODE_ENV==='production')return;
  live.current=true;
  const transport=config.createTransport(window.location.origin);
  transport.setVolume(latest.current.volume??1);
  const owned=new SourceGlossarySession({page:config.page,transport,
   request:(request,context)=>latest.current.onLessonHostRequest?.(request,context),
   paused:value=>{if(live.current)latest.current.onRuntimePausedChange(value);},
   complete:()=>latest.current.onPlaybackComplete?.()});
  session.current=owned;
  const sa=config.createSpanish?.(window.location.origin,()=>{if(live.current&&spanishSelected.current)returnMain.current();},state=>{
   if(live.current&&spanishSelected.current)latest.current.onRuntimePausedChange(!['loading','playing'].includes(state.phase));
  });
  sa?.setVolume(latest.current.volume??1);spanish.current=sa??null;
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  // Seek for reduced motion before admission to playback. No network/audio on entry.
  reducedParked.current=media.matches;if(media.matches)transport.seekFrame(config.page.frameCount);
  const changed=()=>{if(media.matches)pause();};media.addEventListener('change',changed);
  let handle=0;const tick=()=>{publish();handle=requestAnimationFrame(tick);};handle=requestAnimationFrame(tick);
  latest.current.onRuntimePausedChange(true);publish();
  return()=>{
   live.current=false;spanishSelected.current=false;cancelAnimationFrame(handle);media.removeEventListener('change',changed);
   if(session.current===owned)session.current=null;if(spanish.current===sa)spanish.current=null;
   void owned.close().catch(()=>{});void sa?.close().catch(()=>{});
  };
 },[config,pause,publish]);
 useEffect(()=>{
  let active=true;
  void config.loadModule().then(async module=>{await module.textPresentation?.prepare?.();if(active)setDrawing(module);})
   .catch(()=>{if(active)setFailed(true);});return()=>{active=false;};
 },[config]);
 useEffect(()=>{session.current?.setVolume(props.volume??1);spanish.current?.setVolume(props.volume??1);},[props.volume]);
 useEffect(()=>{
  const element=root.current;if(!element||!drawing)return;
  const check=()=>{const status=element.querySelector('[data-canvas-status]')?.getAttribute('data-canvas-status');
   const ok=status==='ready';setReady(ok);session.current?.setReady(ok);if(status==='error'){setFailed(true);pause();}};
  check();const observer=new MutationObserver(check);observer.observe(element,{subtree:true,childList:true,attributes:true,attributeFilter:['data-canvas-status']});
  return()=>observer.disconnect();
 },[drawing,pause]);
 useEffect(()=>connectRuntimeControls({
  setPaused(value){if(value)pause();else play();},
  replay(){if(!session.current?.isReady)return false;cancelSpanish();activeSeek.current=null;reducedParked.current=false;
   setReplay(n=>n+1);void session.current.replay().then(()=>{if(live.current)publish();});publish();return true;},
  narration(action){if(action==='play')play();else pause();},
  stop(){cancelSpanish();activeSeek.current=null;session.current?.stop();publish();},
 }),[connectRuntimeControls,cancelSpanish,pause,play,publish]);
 useEffect(()=>{
  const request=props.seekRequest;if(!ready||!request||request.requestId===lastSeek.current)return;
  cancelSpanish();if(session.current?.seekFrame(request.frame)){reducedParked.current=false;lastSeek.current=request.requestId;activeSeek.current=request.requestId;publish();}
 },[props.seekRequest,ready,cancelSpanish,publish]);
 useEffect(()=>{
  if(props.paused)pause();
  else if(!props.seekRequest&&activeSeek.current!==null&&!session.current?.glossary){activeSeek.current=null;play();}
 },[props.paused,props.seekRequest,pause,play]);
 useEffect(()=>{
  let seen:string|null=null;
  const check=()=>{
   const pending=session.current?.glossary;if(!pending){seen=null;return;}
   const dialog=document.querySelector(`[role="dialog"][data-glossary-entry-id="${pending.entryId}"]`);
   if(dialog){seen=pending.entryId;return;}
   if(seen===pending.entryId){const trigger=session.current?.closeGlossary(false);seen=null;publish();
    requestAnimationFrame(()=>{if(trigger?.isConnected)trigger.focus({preventScroll:true});});}
  };
  const observer=new MutationObserver(check);observer.observe(document.body,{subtree:true,childList:true});
  return()=>observer.disconnect();
 },[publish]);
 useEffect(()=>{
  onPlaybackStateChange?.({audioAvailable:ready,frame,frameCount:config.page.frameCount,frameDomain:config.page.frameDomain,fps:12,
   narration:!ready?'unavailable':(selected?['playing','loading'].includes(spanishPhase):['playing','loading'].includes(phase))?'playing':'waiting',
   playbackProgress:ready?(frame-1)/(config.page.frameCount-1):null,seekAvailable:ready,stepFrames:12,transportMode:ready?'visual-frame-inspector':'none'});
 },[ready,frame,phase,selected,spanishPhase,config,onPlaybackStateChange]);
 const Renderer=drawing?.textPresentation?.Renderer??drawing?.Renderer;
 const startSpanish=()=>{if(!ready||session.current?.glossary)return;session.current?.pause();activeSeek.current=null;spanishSelected.current=true;
  void spanish.current?.start().then(()=>{if(live.current)publish();});publish();};
 return <div ref={root} className="runtime-shell" data-lesson-presentation="modern-text-v1"
  data-lesson-text-binding={drawing?.textPresentation?.binding.version} data-pair-page={config.page.animationId}
  data-pair-frame={frame} data-pair-ready={ready} data-runtime-paused={phase!=='playing'} data-pair-audio-phase={phase}
  data-pair-spanish-selected={selected} data-pair-spanish-phase={spanishPhase}
  style={{'--flash-stage-width':'800px','--flash-stage-height':'600px','--flash-stage-aspect':'800 / 600'} as CSSProperties}>
  {Renderer&&<Renderer frame={frame} frameDomain={config.page.frameDomain} rootFrame={6} scenario="source-static-frame" lang="en"
   uiLanguage={props.uiLanguage} seed={0} replay={replay} paused={phase!=='playing'}/>}
  <SourceGlossaryControls page={config.page} frame={frame} frameDomain={config.page.frameDomain} replay={replay}
   ready={ready&&!selected&&!glossaryOpen} onLessonHostRequest={(request,context)=>{
    if(request.type!=='open-glossary')return;const result=session.current?.openGlossary(request.entryId,context?.trigger);publish();return result;
   }}/>
  {config.createSpanish&&<section aria-label={props.uiLanguage==='es'?'Audio en español opcional':'Optional Spanish audio'}>
   <button type="button" disabled={!ready||glossaryOpen||['loading','playing'].includes(spanishPhase)} onClick={startSpanish}>
    {props.uiLanguage==='es'?'Reproducir audio en español desde el inicio':'Play Spanish audio from start'}</button>
   <button type="button" disabled={!selected||!['playing','loading'].includes(spanishPhase)} onClick={pause}>
    {props.uiLanguage==='es'?'Pausar audio en español':'Pause Spanish audio'}</button>
   <button type="button" disabled={!selected} onClick={()=>returnMain.current()}>
    {props.uiLanguage==='es'?'Volver a la animación':'Return to animation'}</button>
  </section>}
  {(failed||phase==='error'||spanishPhase==='error')&&<p role="alert">{props.labels.unavailable}</p>}
 </div>;
}
