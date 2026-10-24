import React, {useEffect, useRef, useState} from 'react';
import {flushSync,createPortal} from 'react-dom';
import {AlgL06P010ClockV1} from './alg-l06-p010-clock-v1';
import {P010OptionalSpanishAudio} from './alg-l06-p010-optional-spanish-audio-v1';
import {P010AudioOwnerV1} from './alg-l06-p010-audio-owner-v1';
import {P010NativeTextV1} from './alg-l06-p010-native-text-v1';
import {P010_TIMELINE} from './alg-l06-p010-timeline-v1';

export interface P010CanvasAssetV1 {
  readonly metadata: {
    readonly animationId: string;
    readonly sourceSwfSha256: string;
    readonly stage: {readonly width: number; readonly height: number};
    readonly fps: number;
    readonly deterministicContentTimeline: {readonly timelineId: string; readonly frameCount: number};
  };
  ready(): Promise<unknown>;
  render(canvas: HTMLCanvasElement, request: {
    frame: number; scenario: 'source-static-frame'; lang: 'en'; seed: 0;
  }): {readonly localFrame: number; readonly frameDomain: string; readonly rootFrame: number};
}

export type P010ClockSnapshotV1 = ReturnType<AlgL06P010ClockV1['snapshot']>;
export type P010PlayerSnapshotV1 = ReturnType<P010AudioOwnerV1['snapshot']>;
export interface P010PlayerControlsV1 {
  setPaused(paused:boolean):void;
  replay():boolean;
  narration(action:'play'|'stop'):void;
  stop():void;
  closeGlossary():void;
}

export interface P010PlayerPropsV1 {
  /** The caller pins and loads the composed Canvas asset before passing it here. */
  asset: P010CanvasAssetV1;
  /** Fetch only the source main stream; honor this signal and return its exact bytes. */
  loadAudio(signal: AbortSignal): Promise<ArrayBuffer>;
  loadSpanishAudio?: (signal: AbortSignal) => Promise<ArrayBuffer>;
  createSpanishContext?: () => AudioContext;
  language?: 'en' | 'es';
  reducedMotion?: boolean;
  volume?: number;
  createContext?: () => AudioContext;
  onSnapshot?: (snapshot: P010PlayerSnapshotV1) => void;
  connectControls?: (controls:P010PlayerControlsV1)=>void|(()=>void);
  hidePlaybackControls?: boolean;
  nativeTextTarget?: HTMLElement|null;
  /** The modern My Lesson host opens its source-bound Function entry. */
  onOpenGlossary: (key:'Function', trigger:HTMLButtonElement)=>void;
}

/** Checks the actual supplied asset and the frame committed to the Canvas. */
export function p010PaintVerifiedFrame(asset: P010CanvasAssetV1, canvas: HTMLCanvasElement, frame: number): void {
  const m = asset.metadata;
  if (m.animationId !== P010_TIMELINE.animationId ||
      m.sourceSwfSha256 !== P010_TIMELINE.sourceSwfSha256 ||
      m.stage.width !== P010_TIMELINE.stage.width ||
      m.stage.height !== P010_TIMELINE.stage.height || m.fps !== P010_TIMELINE.fps ||
      m.deterministicContentTimeline.timelineId !== 'sprite-52' ||
      m.deterministicContentTimeline.frameCount !== P010_TIMELINE.mainFrameCount)
    throw new Error('P010_CANVAS_ASSET_IDENTITY_MISMATCH');
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > P010_TIMELINE.mainFrameCount)
    throw new Error('P010_INVALID_MAIN_FRAME');
  const rendered = asset.render(canvas, {frame, scenario: 'source-static-frame', lang: 'en', seed: 0});
  if (rendered.localFrame !== frame || rendered.frameDomain !== 'sprite-52' || rendered.rootFrame !== 6 ||
      canvas.getAttribute('data-flash-frame') !== String(frame) ||
      canvas.getAttribute('data-flash-frame-domain') !== 'sprite-52')
    throw new Error('P010_CANVAS_FRAME_COMMIT_MISMATCH');
}

/** Owns the main-audio clock, source drawing, and readable native companion.
 * No audio starts before explicit user activation; SA owns a separate verified stream. */
export function P010PlayerV1({asset, loadAudio, language = 'en', reducedMotion = false,volume=1,
  createContext, createSpanishContext, loadSpanishAudio, onSnapshot,
  connectControls,hidePlaybackControls=false,nativeTextTarget,onOpenGlossary}: P010PlayerPropsV1) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clockRef = useRef<P010AudioOwnerV1 | null>(null);
  const rafRef = useRef<number | null>(null);
  const generationRef = useRef(0);
  const frameRef = useRef(1);
  const liveRef = useRef(false);
  const reducedRef = useRef(reducedMotion); reducedRef.current = reducedMotion;
  const volumeRef=useRef(volume);volumeRef.current=volume;
  const callbackRef = useRef(onSnapshot);
  const notificationFailedRef = useRef(false);
  const glossaryTriggerRef = useRef<HTMLButtonElement|null>(null);
  const glossaryOpenRef = useRef(false);
  callbackRef.current = onSnapshot;
  const [view, setView] = useState({phase: 'loading', frame: 1, replay: 0, error: ''});
  const [visualReady, setVisualReady] = useState(false);
  const [saView,setSaView]=useState({selected:false,phase:'idle'});
  const [glossaryOpen,setGlossaryOpen]=useState(false);

  const stopLoop = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };
  const showSnapshot = (clock: P010AudioOwnerV1) => {
    if (!liveRef.current || clockRef.current !== clock||notificationFailedRef.current) return;
    const snapshot = clock.snapshot();
    const failure=snapshot.ownershipFailure??(snapshot.selectedAudio==='spanish'?snapshot.spanish.failure:null)??snapshot.audio.failure??'';
    setSaView(previous=>previous.selected===(snapshot.selectedAudio==='spanish')&&previous.phase===snapshot.spanish.phase?previous:{selected:snapshot.selectedAudio==='spanish',phase:snapshot.spanish.phase});
    setView(previous => previous.phase === snapshot.playbackPhase && previous.frame === frameRef.current&&previous.error===failure
      ? previous : {...previous, phase: snapshot.playbackPhase, frame: frameRef.current,error:failure});
    try {
      if(!notificationFailedRef.current)callbackRef.current?.(snapshot);
    } catch (error) {
      // Host notification must never be able to strand a playing soundtrack.
      notificationFailedRef.current=true;
      stopLoop();
      clock.pause();
      const message = error instanceof Error ? error.message : String(error);
      setView(previous => ({...previous, phase: 'failed', error: `snapshot-callback: ${message}`}));
    }
  };
  const commit = (frame: number): boolean => {
    const canvas = canvasRef.current;
    if (!liveRef.current || !canvas) return false;
    try {
      p010PaintVerifiedFrame(asset, canvas, frame);
      frameRef.current = frame;
      // Both representations commit in one browser task before another paint.
      flushSync(() => {
        setVisualReady(true);
        setView(previous => previous.frame === frame ? previous : {...previous, frame});
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      flushSync(() => {
        setVisualReady(false);
        setView(previous => ({...previous, phase: 'failed', error: message}));
      });
      return false;
    }
  };
  const tick = (clock: P010AudioOwnerV1) => {
    rafRef.current = null;
    if (!liveRef.current || clockRef.current !== clock) return;
    const snapshot = clock.snapshot();
    if (snapshot.frame !== frameRef.current && !commit(snapshot.frame)) {
      // A failed or partial Canvas draw must not leave its soundtrack running.
      clock.pause();
      showSnapshot(clock);
      return;
    }
    showSnapshot(clock);
    if (clock.snapshot().phase === 'playing' && clock.snapshot().selectedAudio === 'main') rafRef.current = requestAnimationFrame(() => tick(clock));
  };

  useEffect(() => {
    const generation = ++generationRef.current;
    const abort = new AbortController();
    liveRef.current = true;
    notificationFailedRef.current=false;
    glossaryOpenRef.current=false;
    glossaryTriggerRef.current=null;
    setGlossaryOpen(false);
    frameRef.current = 1;
    setView({phase: 'loading', frame: 1, replay: 0, error: ''});
    setVisualReady(false);
    let clock: P010AudioOwnerV1 | null = null;
    void (async () => {
      try {
        await asset.ready();
        if (abort.signal.aborted || generation !== generationRef.current) return;
        const main = new AlgL06P010ClockV1({createContext, commitHeldFrame: commit});
        const spanish=new P010OptionalSpanishAudio({load:loadSpanishAudio,createContext:createSpanishContext,
          onChange:()=>{if(clock)showSnapshot(clock);},
          onEnded:()=>{if(clock&&liveRef.current)showSnapshot(clock);}});
        clock = new P010AudioOwnerV1(main,spanish);
        clockRef.current = clock;
        if(!clock.setVolume(volumeRef.current).accepted)throw Error('P010_INVALID_VOLUME');
        const audio = await loadAudio(abort.signal);
        if (abort.signal.aborted || generation !== generationRef.current) return;
        const result = await main.prepare(audio);
        if (abort.signal.aborted || generation !== generationRef.current) return;
        if (!result.accepted) throw new Error(result.reason);
        if (!commit(1)) throw new Error('P010_FIRST_FRAME_NOT_COMMITTED');
        showSnapshot(clock);
      } catch (error) {
        if (abort.signal.aborted || generation !== generationRef.current) return;
        const message = error instanceof Error ? error.message : String(error);
        setView(previous => ({...previous, phase: 'failed', error: message}));
        if (clock) void clock.close();
      }
    })();
    return () => {
      abort.abort();
      generationRef.current++;
      liveRef.current = false;
      glossaryOpenRef.current=false;
      glossaryTriggerRef.current=null;
      stopLoop();
      if (clockRef.current === clock) clockRef.current = null;
      if (clock) void clock.close();
    };
  // The asset and loader identify one source run. A changed identity tears it down.
  }, [asset, loadAudio, createContext, loadSpanishAudio, createSpanishContext]);
  useEffect(()=>{clockRef.current?.setVolume(volume);},[volume]);

  const play = async () => {
    const clock = clockRef.current;
    if (!clock||notificationFailedRef.current||glossaryOpenRef.current) return;
    const generation = generationRef.current;
    const pending = clock.play(reducedRef.current);
    showSnapshot(clock);
    await pending;
    if (generation !== generationRef.current || clockRef.current !== clock) return;
    showSnapshot(clock);
    if (clock.snapshot().phase === 'playing' && clock.snapshot().selectedAudio === 'main' && rafRef.current === null)
      rafRef.current = requestAnimationFrame(() => tick(clock));
  };
  const pause = () => {
    const clock = clockRef.current;
    if (!clock) return;
    stopLoop();
    clock.pause();
    showSnapshot(clock);
  };
  const replay = () => {
    const clock = clockRef.current;
    if (!clock||glossaryOpenRef.current) return false;
    stopLoop();
    glossaryOpenRef.current=false;
    glossaryTriggerRef.current=null;
    setGlossaryOpen(false);
    const result = clock.replay();
    if (result.accepted) {
      if (!commit(1)) {clock.pause();return false;}
      setView(previous => ({...previous, replay: previous.replay + 1}));
    }
    showSnapshot(clock);
    return result.accepted;
  };

  const startSpanish = async () => {
    const clock=clockRef.current;if(!clock||notificationFailedRef.current||glossaryOpenRef.current)return;
    stopLoop();const generation=generationRef.current;
    const pending=clock.startSpanish();showSnapshot(clock);
    await pending;
    if(generation===generationRef.current&&clockRef.current===clock)showSnapshot(clock);
  };
  const returnFromSpanish = async (clock=clockRef.current) => {
    if(!clock||notificationFailedRef.current||glossaryOpenRef.current)return;
    const generation=generationRef.current;
    const pending=clock.returnMain(reducedRef.current);showSnapshot(clock);
    await pending;
    if(generation!==generationRef.current||clockRef.current!==clock)return;
    showSnapshot(clock);
    if(clock.snapshot().phase==='playing'&&clock.snapshot().selectedAudio==='main'&&rafRef.current===null)
      rafRef.current=requestAnimationFrame(()=>tick(clock));
  };

  const closeGlossary = () => {
    if (!glossaryOpenRef.current) return;
    glossaryOpenRef.current=false;
    const trigger=glossaryTriggerRef.current;
    glossaryTriggerRef.current=null;
    setGlossaryOpen(false);
    if (trigger?.isConnected && !trigger.disabled) trigger.focus({preventScroll:true});
  };
  const openGlossary = (key:'Function', trigger:HTMLButtonElement) => {
    if (key!==P010_TIMELINE.glossaryKey || frameRef.current<P010_TIMELINE.glossaryFirstFrame ||
        !trigger.isConnected || glossaryOpenRef.current) return;
    pause();
    glossaryOpenRef.current=true;
    glossaryTriggerRef.current=trigger;
    setGlossaryOpen(true);
    try {onOpenGlossary(key,trigger);}
    catch (error) {
      closeGlossary();
      const message=error instanceof Error?error.message:String(error);
      setView(previous=>({...previous,phase:'failed',error:`glossary-host: ${message}`}));
    }
  };

  const controlsRef=useRef<P010PlayerControlsV1|null>(null);
  controlsRef.current={setPaused(value){if(value)pause();else void play();},replay,
    narration(action){if(action==='stop')pause();else void play();},stop:pause,closeGlossary};
  useEffect(()=>connectControls?.({
    setPaused:value=>controlsRef.current?.setPaused(value),replay:()=>controlsRef.current?.replay()??false,
    narration:action=>controlsRef.current?.narration(action),stop:()=>controlsRef.current?.stop(),
    closeGlossary:()=>controlsRef.current?.closeGlossary(),
  }),[connectControls]);

  const labels = language === 'es' ? {
    drawing: 'Ilustración de la actividad de funciones', controls: 'Controles de reproducción de la lección',
    play: 'Reproducir', pause: 'Pausar', replay: 'Repetir', spanish:'Audio en español', returnMain:'Volver a la animación', stopped: 'La reproducción se detuvo:',
  } : {
    drawing: 'Functions real-world activity drawing', controls: 'Lesson playback controls',
    play: 'Play', pause: 'Pause', replay: 'Replay', spanish:'Spanish Audio', returnMain:'Return to animation', stopped: 'Lesson playback stopped:',
  };
  const audioButtonStyle:React.CSSProperties={minHeight:44,padding:"0.5em 1em",border:"1px solid #356aa0",borderRadius:"0.5em",background:"#fff",color:"#15344c",font:"inherit"};
  const playbackControls = <div role="group" aria-label={labels.controls} style={{display:"flex",flexWrap:"wrap",gap:"0.5rem",padding:"0.75rem 0"}}>
      {!hidePlaybackControls&&<><button type="button" onClick={() => void play()} disabled={!(saView.selected?['paused','ended','error','idle']:['ready','paused']).includes(view.phase)}>{labels.play}</button>
      <button type="button" onClick={pause} disabled={!['playing', 'start-pending', ...(saView.selected?['loading']:[])].includes(view.phase)}>{labels.pause}</button>
      <button type="button" onClick={replay} disabled={!visualReady}>{labels.replay}</button></>}
      <button type="button" style={audioButtonStyle} onClick={()=>void startSpanish()} disabled={!visualReady||glossaryOpen||view.phase==='returning'||(saView.selected&&['playing','loading'].includes(saView.phase))}>{labels.spanish}</button>
      {saView.selected&&<button type="button" style={audioButtonStyle} onClick={()=>void returnFromSpanish()} disabled={view.phase==='returning'}>{labels.returnMain}</button>}
    </div>;
  return <div data-p010-player="true" data-p010-player-phase={view.phase} data-p010-glossary-open={glossaryOpen?'true':'false'}
    data-p010-player-frame={view.frame} data-p010-player-replay={view.replay}
    data-p010-audio-policy="explicit-separate-streams" data-p010-audio-owner={saView.selected?'spanish':'main'} data-p010-sa-phase={saView.phase} data-p010-motion-policy={reducedMotion ? 'explicit-reduced' : 'explicit'}>
    <div hidden={!visualReady}>
      <canvas ref={canvasRef} width={800} height={600} role="img"
        aria-label={labels.drawing} style={{display: 'block', width: '100%', height: 'auto'}} />
      {!nativeTextTarget&&<P010NativeTextV1 frame={view.frame} language={language} onGlossary={openGlossary} />}
    </div>
    {visualReady&&nativeTextTarget&&createPortal(<><P010NativeTextV1 frame={view.frame} language={language} onGlossary={openGlossary}/>{playbackControls}</>,nativeTextTarget)}
    {!nativeTextTarget&&playbackControls}
    {view.error && <p role="alert">{labels.stopped} {view.error}</p>}
  </div>;
}
