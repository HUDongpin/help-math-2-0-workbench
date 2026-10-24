import React,{useEffect,useRef,useState} from 'react';
import {createPortal,flushSync} from 'react-dom';
import {AlgL06P016ClockV1,type P016GlossaryKey} from './alg-l06-p016-clock-v1';
import {P016AudioOwnerV1} from './alg-l06-p016-audio-owner-v1';
import {P016OptionalSpanishAudio} from './alg-l06-p016-optional-spanish-audio-v1';
import {P016NativeTextV1} from './alg-l06-p016-native-text-v1';
import {P016_TIMELINE} from './alg-l06-p016-timeline-v1';
import {P016_AUDIO_ASSETS,type P016AudioId} from './alg-l06-p016-audio-schedule-v1';

export interface P016CanvasAssetV1{
  readonly metadata:{readonly animationId:string;readonly sourceSwfSha256:string;
    readonly stage:{readonly width:number;readonly height:number};readonly fps:number;
    readonly deterministicContentTimeline:{readonly timelineId:string;readonly frameCount:number}};
  ready():Promise<unknown>;
  render(canvas:HTMLCanvasElement,request:{frame:number;scenario:'source-static-frame';
    lang:'en';seed:0}):{readonly localFrame:number;readonly frameDomain:string;
    readonly rootFrame:number};
}
export type P016PlayerSnapshotV1=ReturnType<P016AudioOwnerV1['snapshot']>;
export interface P016PlayerControlsV1{
  setPaused(paused:boolean):void;
  replay():boolean;
  narration(action:'play'|'stop'):void;
  stop():void;
  closeGlossary():void;
}
export interface P016PlayerPropsV1{
  asset:P016CanvasAssetV1;
  loadAudio:(id:P016AudioId,signal:AbortSignal)=>Promise<ArrayBuffer>;
  loadSpanishAudio?:(signal:AbortSignal)=>Promise<ArrayBuffer>;
  createContext?:()=>AudioContext;
  createSpanishContext?:()=>AudioContext;
  language?:'en'|'es';reducedMotion?:boolean;volume?:number;
  onSnapshot?:(snapshot:P016PlayerSnapshotV1)=>void;
  connectControls?:(controls:P016PlayerControlsV1)=>void|(()=>void);
  hidePlaybackControls?:boolean;
  nativeTextTarget?:HTMLElement|null;
  onOpenGlossary:(key:P016GlossaryKey,trigger:HTMLButtonElement)=>void;
}

/** Verify the exact source Canvas and committed local frame before audio
 * ownership advances. Both UI locales retain the source-English drawing. */
export function p016PaintVerifiedFrame(asset:P016CanvasAssetV1,
  canvas:HTMLCanvasElement,frame:number):void{
  const m=asset.metadata,t=P016_TIMELINE;
  if(m.animationId!==t.animationId||m.sourceSwfSha256!==t.sourceSwfSha256||
    m.stage.width!==t.stage.width||m.stage.height!==t.stage.height||
    m.fps!==t.fps||m.deterministicContentTimeline.timelineId!==t.frameDomain||
    m.deterministicContentTimeline.frameCount!==t.mainFrameCount)
    throw Error('P016_CANVAS_ASSET_IDENTITY_MISMATCH');
  if(!Number.isSafeInteger(frame)||frame<1||frame>t.mainFrameCount)
    throw Error('P016_INVALID_MAIN_FRAME');
  const rendered=asset.render(canvas,{frame,scenario:'source-static-frame',lang:'en',seed:0});
  if(rendered.localFrame!==frame||rendered.frameDomain!==t.frameDomain||
    rendered.rootFrame!==t.rootEntryFrame||
    canvas.getAttribute('data-flash-frame')!==String(frame)||
    canvas.getAttribute('data-flash-frame-domain')!==t.frameDomain||
    canvas.getAttribute('data-flash-root-frame')!==String(t.rootEntryFrame))
    throw Error('P016_CANVAS_FRAME_COMMIT_MISMATCH');
}

/** A source-bound linear visual clock with two separate main decoders and
 * one optional, explicitly selected SA decoder. No locale starts audio. */
export function P016PlayerV1({asset,loadAudio,loadSpanishAudio,createContext,
  createSpanishContext,language='en',reducedMotion=false,volume=1,onSnapshot,
  connectControls,hidePlaybackControls=false,nativeTextTarget,onOpenGlossary}:P016PlayerPropsV1){
  const rootRef=useRef<HTMLDivElement>(null),canvasRef=useRef<HTMLCanvasElement>(null);
  const ownerRef=useRef<P016AudioOwnerV1|null>(null);
  const clockRef=useRef<AlgL06P016ClockV1|null>(null);
  const rafRef=useRef<number|null>(null),generationRef=useRef(0),frameRef=useRef(1);
  const liveRef=useRef(false),notificationFailedRef=useRef(false);
  const reducedRef=useRef(reducedMotion);reducedRef.current=reducedMotion;
  const volumeRef=useRef(volume);volumeRef.current=volume;
  const callbackRef=useRef(onSnapshot);callbackRef.current=onSnapshot;
  const glossaryTriggerRef=useRef<HTMLButtonElement|null>(null);
  const glossaryOpenRef=useRef(false);
  const [view,setView]=useState({phase:'loading',frame:1,replay:0,error:''});
  const [visualReady,setVisualReady]=useState(false);
  const [saView,setSaView]=useState({selected:false,phase:'idle'});
  const [glossaryOpen,setGlossaryOpen]=useState(false);
  const stopLoop=()=>{if(rafRef.current!==null)cancelAnimationFrame(rafRef.current);
    rafRef.current=null;};
  const commit=(frame:number):boolean=>{
    const canvas=canvasRef.current;
    if(!liveRef.current||!canvas)return false;
    try{
      p016PaintVerifiedFrame(asset,canvas,frame);
      frameRef.current=frame;
      flushSync(()=>{setVisualReady(true);
        setView(previous=>previous.frame===frame?previous:{...previous,frame});});
      return true;
    }catch(error){
      flushSync(()=>{setVisualReady(false);
        setView(previous=>({...previous,phase:'failed',error:String(error)}));});
      return false;
    }
  };
  const showSnapshot=(owner:P016AudioOwnerV1,snapshot=owner.snapshot())=>{
    if(!liveRef.current||ownerRef.current!==owner||notificationFailedRef.current)return;
    const failure=snapshot.ownershipFailure??(snapshot.selectedAudio==='spanish'?
      snapshot.spanish.failure:null)??snapshot.failure??'';
    setSaView(previous=>previous.selected===(snapshot.selectedAudio==='spanish')&&
      previous.phase===snapshot.spanish.phase?previous:
      {selected:snapshot.selectedAudio==='spanish',phase:snapshot.spanish.phase});
    setView(previous=>previous.phase===snapshot.playbackPhase&&
      previous.frame===snapshot.frame&&previous.error===failure?previous:
      {...previous,phase:snapshot.playbackPhase,frame:snapshot.frame,error:failure});
    try{callbackRef.current?.(snapshot);}catch(error){
      notificationFailedRef.current=true;stopLoop();owner.pause();
      setView(previous=>({...previous,phase:'failed',error:`snapshot-callback: ${String(error)}`}));
    }
  };
  const tick=(owner:P016AudioOwnerV1)=>{
    rafRef.current=null;
    if(!liveRef.current||ownerRef.current!==owner)return;
    const snapshot=owner.snapshot();
    if(snapshot.frame!==frameRef.current&&!commit(snapshot.frame)){
      owner.pause();showSnapshot(owner);return;
    }
    showSnapshot(owner,snapshot);
    if(owner.snapshot().phase==='playing'&&owner.snapshot().selectedAudio==='main')
      rafRef.current=requestAnimationFrame(()=>tick(owner));
  };

  useEffect(()=>{
    const generation=++generationRef.current,abort=new AbortController();
    liveRef.current=true;notificationFailedRef.current=false;
    glossaryOpenRef.current=false;glossaryTriggerRef.current=null;
    setGlossaryOpen(false);frameRef.current=1;
    setView({phase:'loading',frame:1,replay:0,error:''});setVisualReady(false);
    let owner:P016AudioOwnerV1|null=null;
    void (async()=>{
      try{
        await asset.ready();
        if(abort.signal.aborted||generation!==generationRef.current)return;
        const clock=new AlgL06P016ClockV1({createContext,commitFrame:commit});
        const spanish=new P016OptionalSpanishAudio({load:loadSpanishAudio,
          createContext:createSpanishContext,
          onChange:()=>{if(owner)showSnapshot(owner);},
          onEnded:()=>{if(owner&&liveRef.current)showSnapshot(owner);}});
        owner=new P016AudioOwnerV1(clock,spanish);
        clockRef.current=clock;ownerRef.current=owner;
        if(!owner.setVolume(volumeRef.current).accepted)throw Error('P016_INVALID_VOLUME');
        const entries=await Promise.all(P016_AUDIO_ASSETS.map(async a=>
          [a.id,await loadAudio(a.id,abort.signal)] as const));
        if(abort.signal.aborted||generation!==generationRef.current)return;
        const audio=Object.fromEntries(entries) as Record<P016AudioId,ArrayBuffer>;
        const prepared=await clock.prepare(audio);
        if(abort.signal.aborted||generation!==generationRef.current)return;
        if(!prepared.accepted)throw Error(prepared.reason);
        if(!commit(1))throw Error('P016_FIRST_FRAME_NOT_COMMITTED');
        showSnapshot(owner);
      }catch(error){
        if(abort.signal.aborted||generation!==generationRef.current)return;
        setView(previous=>({...previous,phase:'failed',error:String(error)}));
        if(owner)void owner.close();
      }
    })();
    return()=>{
      abort.abort();generationRef.current++;liveRef.current=false;
      glossaryOpenRef.current=false;glossaryTriggerRef.current=null;stopLoop();
      if(ownerRef.current===owner)ownerRef.current=null;
      clockRef.current=null;if(owner)void owner.close();
    };
  },[asset,loadAudio,createContext,loadSpanishAudio,createSpanishContext]);
  useEffect(()=>{ownerRef.current?.setVolume(volume);},[volume]);

  const play=async()=>{
    const owner=ownerRef.current;
    if(!owner||notificationFailedRef.current||glossaryOpenRef.current)return;
    const generation=generationRef.current;
    const pending=owner.play(reducedRef.current);showSnapshot(owner);
    await pending;
    if(generation!==generationRef.current||ownerRef.current!==owner)return;
    showSnapshot(owner);
    if(owner.snapshot().phase==='playing'&&owner.snapshot().selectedAudio==='main'&&
      rafRef.current===null)rafRef.current=requestAnimationFrame(()=>tick(owner));
  };
  const pause=()=>{
    const owner=ownerRef.current;if(!owner)return;
    stopLoop();owner.pause();showSnapshot(owner);
  };
  const replay=()=>{
    const owner=ownerRef.current;if(!owner)return false;
    stopLoop();glossaryOpenRef.current=false;glossaryTriggerRef.current=null;
    setGlossaryOpen(false);
    const reset=owner.replay();
    if(reset.accepted){
      if(!commit(1)){owner.pause();return false;}
      setView(previous=>({...previous,replay:previous.replay+1}));
    }
    showSnapshot(owner);return reset.accepted;
  };
  const startSpanish=async()=>{
    const owner=ownerRef.current;
    if(!owner||notificationFailedRef.current||glossaryOpenRef.current)return;
    stopLoop();const generation=generationRef.current;
    const pending=owner.startSpanish();showSnapshot(owner);
    await pending;
    if(generation===generationRef.current&&ownerRef.current===owner)showSnapshot(owner);
  };
  const returnFromSpanish=async(trigger?:HTMLButtonElement)=>{
    const owner=ownerRef.current;
    if(!owner||notificationFailedRef.current||glossaryOpenRef.current)return;
    const hadFocus=trigger?.ownerDocument.activeElement===trigger;
    const generation=generationRef.current;
    const pending=owner.returnMain(reducedRef.current);showSnapshot(owner);
    await pending;
    if(generation!==generationRef.current||ownerRef.current!==owner)return;
    showSnapshot(owner);
    if(hadFocus&&trigger){
      queueMicrotask(()=>{
        if(generation!==generationRef.current||ownerRef.current!==owner)return;
        const doc=trigger.ownerDocument;
        if(doc.activeElement!==trigger&&doc.activeElement!==doc.body)return;
        const scope=nativeTextTarget??rootRef.current;
        const target=scope?.querySelector<HTMLElement>('[data-p016-native-text="true"]');
        if(target?.isConnected){target.tabIndex=-1;target.focus();}
      });
    }
    if(owner.snapshot().phase==='playing'&&owner.snapshot().selectedAudio==='main'&&
      rafRef.current===null)rafRef.current=requestAnimationFrame(()=>tick(owner));
  };
  const closeGlossary=()=>{
    if(!glossaryOpenRef.current)return;
    glossaryOpenRef.current=false;
    const trigger=glossaryTriggerRef.current;glossaryTriggerRef.current=null;
    clockRef.current?.closeGlossary();setGlossaryOpen(false);
    const owner=ownerRef.current;if(owner)showSnapshot(owner);
    if(trigger?.isConnected&&!trigger.disabled)trigger.focus({preventScroll:true});
  };
  const openGlossary=(key:P016GlossaryKey,trigger:HTMLButtonElement)=>{
    const owner=ownerRef.current,clock=clockRef.current;
    if(!owner||!clock||owner.snapshot().selectedAudio!=='main'||
      !Object.prototype.hasOwnProperty.call(P016_TIMELINE.glossary,key)||
      frameRef.current<P016_TIMELINE.glossary[key].firstAvailableFrame||
      !trigger.isConnected||glossaryOpenRef.current)return;
    const held=clock.openGlossary(key);if(!held.accepted)return;
    stopLoop();glossaryOpenRef.current=true;glossaryTriggerRef.current=trigger;
    setGlossaryOpen(true);trigger.blur();showSnapshot(owner);
    try{onOpenGlossary(key,trigger);}catch(error){
      closeGlossary();setView(previous=>({...previous,phase:'failed',
        error:`glossary-host: ${String(error)}`}));
    }
  };

  const controlsRef=useRef<P016PlayerControlsV1|null>(null);
  controlsRef.current={setPaused:value=>value?pause():void play(),replay,
    narration:action=>action==='stop'?pause():void play(),stop:pause,closeGlossary};
  useEffect(()=>connectControls?.({
    setPaused:value=>controlsRef.current?.setPaused(value),
    replay:()=>controlsRef.current?.replay()??false,
    narration:action=>controlsRef.current?.narration(action),
    stop:()=>controlsRef.current?.stop(),
    closeGlossary:()=>controlsRef.current?.closeGlossary(),
  }),[connectControls]);
  const labels=language==='es'?{
    drawing:'Ilustración de la función',controls:'Controles de reproducción de la lección',
    play:'Reproducir',pause:'Pausar',replay:'Repetir',spanish:'Audio en español',
    returnMain:'Volver a la animación',stopped:'La reproducción se detuvo:',
  }:{drawing:'Function lesson drawing',controls:'Lesson playback controls',
    play:'Play',pause:'Pause',replay:'Replay',spanish:'Spanish Audio',
    returnMain:'Return to animation',stopped:'Lesson playback stopped:'};
  const buttonStyle:React.CSSProperties={minHeight:44,padding:'0.5em 1em',
    border:'1px solid #356aa0',borderRadius:'0.5em',background:'#fff',
    color:'#15344c',font:'inherit'};
  const controls=<div role="group" aria-label={labels.controls}
    style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',padding:'0.75rem 0'}}>
    {!hidePlaybackControls&&<>
      <button type="button" onClick={()=>void play()}
        disabled={!(saView.selected?['paused','ended','error','idle']:
          ['ready','paused']).includes(view.phase)}>{labels.play}</button>
      <button type="button" onClick={pause}
        disabled={!['playing','start-pending','loading'].includes(view.phase)}>{labels.pause}</button>
      <button type="button" onClick={replay} disabled={!visualReady}>{labels.replay}</button>
    </>}
    <button type="button" style={buttonStyle} onClick={()=>void startSpanish()}
      disabled={!visualReady||glossaryOpen||view.phase==='returning'||
        (saView.selected&&['playing','loading'].includes(saView.phase))}>{labels.spanish}</button>
    {saView.selected&&<button type="button" style={buttonStyle}
      onClick={event=>void returnFromSpanish(event.currentTarget)}
      disabled={view.phase==='returning'}>{labels.returnMain}</button>}
  </div>;
  const companion=<P016NativeTextV1 frame={view.frame} language={language}
    onGlossary={saView.selected?undefined:openGlossary}/>;
  return <div ref={rootRef} data-p016-player="true" data-p016-player-phase={view.phase}
    data-p016-player-frame={view.frame} data-p016-player-replay={view.replay}
    data-p016-glossary-open={glossaryOpen?'true':'false'}
    data-p016-audio-policy="explicit-separate-main-ranges-and-sa"
    data-p016-audio-owner={saView.selected?'spanish':'main'}
    data-p016-sa-phase={saView.phase}
    data-p016-motion-policy={reducedMotion?'explicit-reduced':'explicit'}>
    <div hidden={!visualReady}>
      <canvas ref={canvasRef} width={800} height={600} aria-hidden="true"
        aria-label={labels.drawing} style={{display:'block',width:'100%',height:'auto'}}/>
      {!nativeTextTarget&&companion}
    </div>
    {visualReady&&nativeTextTarget&&createPortal(<>{companion}{controls}</>,nativeTextTarget)}
    {!nativeTextTarget&&controls}
    {view.error&&<p role="alert">{labels.stopped} {view.error}</p>}
  </div>;
}
