import React, {useEffect, useRef, useState} from 'react';
import {flushSync,createPortal} from 'react-dom';
import {AlgL06P008ClockV1} from './alg-l06-p008-clock-v1';
import {P008OptionalSpanishAudio} from './alg-l06-p008-optional-spanish-audio-v1';
import {P008AudioOwnerV1} from './alg-l06-p008-audio-owner-v1';
import {P008NativeTextV1} from './alg-l06-p008-native-text-v1';
import {P008_TIMELINE} from './alg-l06-p008-timeline-v1';

export interface P008CanvasAssetV1 {
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

export type P008ClockSnapshotV1 = ReturnType<AlgL06P008ClockV1['snapshot']>;
export type P008PlayerSnapshotV1 = ReturnType<P008AudioOwnerV1['snapshot']>;
export interface P008PlayerControlsV1 {
  setPaused(paused:boolean):void;
  replay():boolean;
  narration(action:'play'|'stop'):void;
  stop():void;
}

export interface P008PlayerPropsV1 {
  /** The caller pins and loads the composed Canvas asset before passing it here. */
  asset: P008CanvasAssetV1;
  /** Fetch only the source main stream; honor this signal and return its exact bytes. */
  loadAudio(signal: AbortSignal): Promise<ArrayBuffer>;
  loadSpanishAudio?: (signal: AbortSignal) => Promise<ArrayBuffer>;
  createSpanishContext?: () => AudioContext;
  language?: 'en' | 'es';
  reducedMotion?: boolean;
  volume?: number;
  createContext?: () => AudioContext;
  onSnapshot?: (snapshot: P008PlayerSnapshotV1) => void;
  connectControls?: (controls:P008PlayerControlsV1)=>void|(()=>void);
  hidePlaybackControls?: boolean;
  nativeTextTarget?: HTMLElement|null;
}

/** Checks the actual supplied asset and the frame committed to the Canvas. */
export function p008PaintVerifiedFrame(asset: P008CanvasAssetV1, canvas: HTMLCanvasElement, frame: number): void {
  const m = asset.metadata;
  if (m.animationId !== P008_TIMELINE.animationId ||
      m.sourceSwfSha256 !== P008_TIMELINE.sourceSwfSha256 ||
      m.stage.width !== P008_TIMELINE.stage.width ||
      m.stage.height !== P008_TIMELINE.stage.height || m.fps !== P008_TIMELINE.fps ||
      m.deterministicContentTimeline.timelineId !== 'sprite-507' ||
      m.deterministicContentTimeline.frameCount !== P008_TIMELINE.mainFrameCount)
    throw new Error('P008_CANVAS_ASSET_IDENTITY_MISMATCH');
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > P008_TIMELINE.mainFrameCount)
    throw new Error('P008_INVALID_MAIN_FRAME');
  const rendered = asset.render(canvas, {frame, scenario: 'source-static-frame', lang: 'en', seed: 0});
  if (rendered.localFrame !== frame || rendered.frameDomain !== 'sprite-507' || rendered.rootFrame !== 6 ||
      canvas.getAttribute('data-flash-frame') !== String(frame) ||
      canvas.getAttribute('data-flash-frame-domain') !== 'sprite-507')
    throw new Error('P008_CANVAS_FRAME_COMMIT_MISMATCH');
}

/** Owns the main-audio clock, source drawing, and readable native companion.
 * No audio starts before explicit user activation; SA owns a separate verified stream. */
export function P008PlayerV1({asset, loadAudio, language = 'en', reducedMotion = false,volume=1,
  createContext, createSpanishContext, loadSpanishAudio, onSnapshot,
  connectControls,hidePlaybackControls=false,nativeTextTarget}: P008PlayerPropsV1) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clockRef = useRef<P008AudioOwnerV1 | null>(null);
  const rafRef = useRef<number | null>(null);
  const generationRef = useRef(0);
  const frameRef = useRef(1);
  const liveRef = useRef(false);
  const reducedRef = useRef(reducedMotion); reducedRef.current = reducedMotion;
  const volumeRef=useRef(volume);volumeRef.current=volume;
  const callbackRef = useRef(onSnapshot);
  const notificationFailedRef = useRef(false);
  callbackRef.current = onSnapshot;
  const [view, setView] = useState({phase: 'loading', frame: 1, replay: 0, error: ''});
  const [visualReady, setVisualReady] = useState(false);
  const [saView,setSaView]=useState({selected:false,phase:'idle'});

  const stopLoop = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };
  const showSnapshot = (clock: P008AudioOwnerV1) => {
    if (!liveRef.current || clockRef.current !== clock||notificationFailedRef.current) return;
    const snapshot = clock.snapshot();
    const failure=snapshot.ownershipFailure??(snapshot.selectedAudio==='spanish'?snapshot.spanish.failure:null)??snapshot.failure??'';
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
      p008PaintVerifiedFrame(asset, canvas, frame);
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
  const tick = (clock: P008AudioOwnerV1) => {
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
    frameRef.current = 1;
    setView({phase: 'loading', frame: 1, replay: 0, error: ''});
    setVisualReady(false);
    let clock: P008AudioOwnerV1 | null = null;
    void (async () => {
      try {
        await asset.ready();
        if (abort.signal.aborted || generation !== generationRef.current) return;
        const main = new AlgL06P008ClockV1({createContext, commitHeldFrame: commit});
        const spanish=new P008OptionalSpanishAudio({load:loadSpanishAudio,createContext:createSpanishContext,
          onChange:()=>{if(clock)showSnapshot(clock);},
          onEnded:()=>{if(clock&&liveRef.current)void returnFromSpanish(clock);}});
        clock = new P008AudioOwnerV1(main,spanish);
        clockRef.current = clock;
        if(!clock.setVolume(volumeRef.current).accepted)throw Error('P008_INVALID_VOLUME');
        const audio = await loadAudio(abort.signal);
        if (abort.signal.aborted || generation !== generationRef.current) return;
        const result = await main.prepare(audio);
        if (abort.signal.aborted || generation !== generationRef.current) return;
        if (!result.accepted) throw new Error(result.reason);
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
      stopLoop();
      if (clockRef.current === clock) clockRef.current = null;
      if (clock) void clock.close();
    };
  // The asset and loader identify one source run. A changed identity tears it down.
  }, [asset, loadAudio, createContext, loadSpanishAudio, createSpanishContext]);
  useEffect(()=>{clockRef.current?.setVolume(volume);},[volume]);

  const play = async () => {
    const clock = clockRef.current;
    if (!clock||notificationFailedRef.current) return;
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
    if (!clock) return false;
    stopLoop();
    const result = clock.replay();
    if (result.accepted) setView(previous => ({...previous, replay: previous.replay + 1}));
    showSnapshot(clock);
    return result.accepted;
  };

  const startSpanish = async () => {
    const clock=clockRef.current;if(!clock||notificationFailedRef.current)return;
    stopLoop();const generation=generationRef.current;
    const pending=clock.startSpanish();showSnapshot(clock);
    await pending;
    if(generation===generationRef.current&&clockRef.current===clock)showSnapshot(clock);
  };
  const returnFromSpanish = async (clock=clockRef.current) => {
    if(!clock||notificationFailedRef.current)return;
    const generation=generationRef.current;
    const pending=clock.returnMain(reducedRef.current);showSnapshot(clock);
    await pending;
    if(generation!==generationRef.current||clockRef.current!==clock)return;
    showSnapshot(clock);
    if(clock.snapshot().phase==='playing'&&clock.snapshot().selectedAudio==='main'&&rafRef.current===null)
      rafRef.current=requestAnimationFrame(()=>tick(clock));
  };

  const controlsRef=useRef<P008PlayerControlsV1|null>(null);
  controlsRef.current={setPaused(value){if(value)pause();else void play();},replay,
    narration(action){if(action==='stop')pause();else void play();},stop:pause};
  useEffect(()=>connectControls?.({
    setPaused:value=>controlsRef.current?.setPaused(value),replay:()=>controlsRef.current?.replay()??false,
    narration:action=>controlsRef.current?.narration(action),stop:()=>controlsRef.current?.stop(),
  }),[connectControls]);

  const labels = language === 'es' ? {
    drawing: 'Ilustración de la lección de limonada', controls: 'Controles de reproducción de la lección',
    play: 'Reproducir', pause: 'Pausar', replay: 'Repetir', spanish:'Audio en español', returnMain:'Volver a la animación', stopped: 'La reproducción se detuvo:',
  } : {
    drawing: 'Lemonade lesson drawing', controls: 'Lesson playback controls',
    play: 'Play', pause: 'Pause', replay: 'Replay', spanish:'Spanish Audio', returnMain:'Return to animation', stopped: 'Lesson playback stopped:',
  };
  const audioButtonStyle:React.CSSProperties={minHeight:44,padding:"0.5em 1em",border:"1px solid #356aa0",borderRadius:"0.5em",background:"#fff",color:"#15344c",font:"inherit"};
  const playbackControls = <div role="group" aria-label={labels.controls} style={{display:"flex",flexWrap:"wrap",gap:"0.5rem",padding:"0.75rem 0"}}>
      {!hidePlaybackControls&&<><button type="button" onClick={() => void play()} disabled={!(saView.selected?['paused','ended','error','idle']:['ready','paused']).includes(view.phase)}>{labels.play}</button>
      <button type="button" onClick={pause} disabled={!['playing', 'start-pending', ...(saView.selected?['loading']:[])].includes(view.phase)}>{labels.pause}</button>
      <button type="button" onClick={replay} disabled={!visualReady}>{labels.replay}</button></>}
      <button type="button" style={audioButtonStyle} onClick={()=>void startSpanish()} disabled={!visualReady||view.phase==='returning'||(saView.selected&&['playing','loading'].includes(saView.phase))}>{labels.spanish}</button>
      {saView.selected&&<button type="button" style={audioButtonStyle} onClick={()=>void returnFromSpanish()} disabled={view.phase==='returning'}>{labels.returnMain}</button>}
    </div>;
  return <div data-p008-player="true" data-p008-player-phase={view.phase}
    data-p008-player-frame={view.frame} data-p008-player-replay={view.replay}
    data-p008-audio-policy="explicit-separate-streams" data-p008-audio-owner={saView.selected?'spanish':'main'} data-p008-sa-phase={saView.phase} data-p008-motion-policy={reducedMotion ? 'explicit-reduced' : 'explicit'}>
    <div hidden={!visualReady}>
      <canvas ref={canvasRef} width={800} height={600} role="img"
        aria-label={labels.drawing} style={{display: 'block', width: '100%', height: 'auto'}} />
      {!nativeTextTarget&&<P008NativeTextV1 frame={view.frame} replay={view.replay} language={language} />}
    </div>
    {visualReady&&nativeTextTarget&&createPortal(<><P008NativeTextV1 frame={view.frame} replay={view.replay} language={language}/>{playbackControls}</>,nativeTextTarget)}
    {!nativeTextTarget&&playbackControls}
    {view.error && <p role="alert">{labels.stopped} {view.error}</p>}
  </div>;
}
