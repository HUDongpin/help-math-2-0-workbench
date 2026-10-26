'use client';
import {useEffect, useRef, useState, type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import type {LessonRuntimeAdapterControls, LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import {ALG_L6_P003_CANVAS_URL, ALG_L6_P003_DRAW_ID, ALG_L6_P003_ID,
  ALG_L6_P003_SOURCE_SHA256} from '@/lib/g678-alg-l06-p003-probe-access';
import {AlgL06P003SourceClockV1} from '../../../packages/demos/src/alg-l06-p003-source-clock-v1';
import {algL06P003TextSnapshot} from '../../../packages/demos/src/alg-l06-p003-text-v1';
import {LessonTextPresentation} from '../../../packages/demos/src/lesson-text-presentation';
import p003DrawingModule from '../../../packages/demos/src/modules/g678-alg-l06-p003-source-candidate-v1';
import styles from './g678-alg-l06-p003-host-runtime.module.css';

type View = {phase: string; frame: number; run: string | null; ready: boolean; reduced: boolean; error: string | null};
let canvasLoad: Promise<void> | undefined;
function ensureCanvasLoaded() {
  if (window.HELP_MATH_CANVAS_ASSETS?.[ALG_L6_P003_DRAW_ID]) return Promise.resolve();
  if (!canvasLoad) canvasLoad = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = ALG_L6_P003_CANVAS_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(Error('p003-canvas-request-failed'));
    document.head.append(script);
  });
  return canvasLoad;
}

/** Unregistered source-clock adapter inside the real modern lesson controls. */
export function G678AlgL6P003HostRuntime(props: LessonRuntimeAdapterProps) {
  const latest = useRef(props); latest.current = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [readableTarget, setReadableTarget] = useState<HTMLElement | null>(null);
  const clockRef = useRef<AlgL06P003SourceClockV1 | null>(null);
  const controlsRef = useRef<LessonRuntimeAdapterControls | null>(null);
  const lastSeek = useRef(0);
  const [view, setView] = useState<View>({phase: 'loading', frame: 1, run: null, ready: false, reduced: false, error: null});
  useEffect(() => {
    const source = stage.current, owner = source?.closest('.lesson-shell2__learning-column');
    const id = props.pageInteractionCompanionTargetId;
    if (!source || !owner || !id?.endsWith('-p003-source-readable')) return;
    const resolve = () => {
      const target = source.ownerDocument.getElementById(id);
      const admitted = target?.parentElement === owner &&
        target.dataset.pageInteractionCompanionHost === 'true' && !source.contains(target) ? target : null;
      setReadableTarget(previous => previous === admitted ? previous : admitted);
    };
    resolve();
    const observer = new MutationObserver(resolve);
    observer.observe(owner, {childList: true, subtree: true});
    return () => observer.disconnect();
  }, [props.pageInteractionCompanionTargetId]);
  useEffect(() => {
    let active = true, clock: AlgL06P003SourceClockV1 | undefined, frameHandle = 0;
    let lastPainted = 0, lastView = '', lastReport = '', completeReported = false, reduced = false;
    let runtimeError: string | null = null;
    let asset: (NonNullable<typeof window.HELP_MATH_CANVAS_ASSETS>[string] &
      {metadata?: {sourceSwfSha256?: string}}) | undefined;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    reduced = media.matches;
    const motionChanged = () => {reduced = media.matches;};
    media.addEventListener('change', motionChanged);
    const paint = (frame: number) => {
      const target = canvas.current;
      if (!active || !target || !asset || window.HELP_MATH_CANVAS_ASSETS?.[ALG_L6_P003_DRAW_ID] !== asset) return false;
      const sourceState = p003DrawingModule.getFrameState(frame, {frame,
        frameDomain: 'sprite-154', rootFrame: 6, scenario: 'source-static-frame', lang: 'en', seed: 0});
      if (sourceState.status !== 'ready' || sourceState.frame !== frame ||
        sourceState.frameDomain !== 'sprite-154' ||
        sourceState.sourceSwfSha256 !== ALG_L6_P003_SOURCE_SHA256) return false;
      const state = asset.render(target, {frame, scenario: 'source-static-frame', lang: 'en', seed: 0}) as
        {localFrame?: number; frameDomain?: string};
      if (state.localFrame !== frame || state.frameDomain !== 'sprite-154' ||
        target.getAttribute('data-flash-frame') !== String(frame)) return false;
      lastPainted = frame;
      return target.getBoundingClientRect().width > 0;
    };
    const pause = () => {
      if (clock && ['playing', 'start-pending'].includes(clock.snapshot().phase)) clock.pause();
      latest.current.onRuntimePausedChange(true);
    };
    const start = async () => {
      if (!clock || !active || !['ready', 'paused'].includes(clock.snapshot().phase)) return;
      const result = await clock.play({activation: 'user', reducedMotion: reduced});
      if (!active) return;
      if (result.accepted) {runtimeError = null; latest.current.onRuntimePausedChange(false);}
      else {runtimeError = result.reason; setView(old => ({...old, error: runtimeError})); pause();}
    };
    const controls: LessonRuntimeAdapterControls = {
      setPaused(value) {if (value) pause(); else void start();},
      replay() {
        if (!clock || !active) return false;
        const result = clock.replay();
        if (!result.accepted) return false;
        completeReported = false;
        void start();
        return true;
      },
      narration(action) {if (action === 'stop') pause(); else void start();},
      stop() {pause();},
    };
    controlsRef.current = controls;
    const disconnect = props.connectRuntimeControls(controls);
    const init = async () => {
      if (process.env.NODE_ENV === 'production' || props.animationId !== ALG_L6_P003_ID ||
        props.moduleKey !== ALG_L6_P003_ID || props.audioEnabled !== true ||
        props.query.frameDomain !== 'sprite-154' || props.query.scenario !== 'source-static-frame' ||
        props.query.lang !== 'en' || String(props.query.seed) !== '0' || props.query.capture === '1')
        throw Error('p003-host-probe-scope-mismatch');
      if (p003DrawingModule.key !== ALG_L6_P003_ID ||
        p003DrawingModule.runtime?.frameCount !== 10 ||
        p003DrawingModule.runtime?.defaultFrameDomain !== 'sprite-154' ||
        p003DrawingModule.maturity !== 'legacy-prototype' ||
        p003DrawingModule.privateAlgL06P003.version !== 1 ||
        p003DrawingModule.privateAlgL06P003.sourceAudio.frameDomain !== 'sprite-154' ||
        p003DrawingModule.privateAlgL06P003.sourceRuns.length !== 2)
        throw Error('p003-drawing-module-identity-mismatch');
      await ensureCanvasLoaded();
      if (!active) return;
      asset = window.HELP_MATH_CANVAS_ASSETS?.[ALG_L6_P003_DRAW_ID] as typeof asset;
      if (!asset || asset.metadata?.sourceSwfSha256 !== ALG_L6_P003_SOURCE_SHA256)
        throw Error('p003-canvas-identity-mismatch');
      await asset.ready();
      if (!active) return;
      clock = new AlgL06P003SourceClockV1({commitHeldFrame: paint});
      clockRef.current = clock;
      const runs = p003DrawingModule.privateAlgL06P003.sourceRuns.map(run =>
        Uint8Array.from(atob(run.base64), char => char.charCodeAt(0)).buffer) as [ArrayBuffer, ArrayBuffer];
      const prepared = await clock.prepare(runs);
      if (!active) return;
      if (!prepared.accepted) throw Error(prepared.reason);
      clock.setVolume(latest.current.volume ?? 1);
      latest.current.onRuntimePausedChange(true);
      const draw = () => {
        if (!active || !clock) return;
        const snapshot = clock.snapshot();
        const frame = reduced ? 531 : snapshot.frame;
        if (frame !== lastPainted && !paint(frame)) {
          runtimeError = 'p003-frame-paint-failed';
          pause(); setView(old => ({...old, error: runtimeError})); return;
        }
        const report: AnimationRuntimePlaybackState = {
          audioAvailable: true, frame, frameCount: 719, frameDomain: 'sprite-154', fps: 12,
          narration: snapshot.phase === 'playing' && snapshot.audio.runId ? 'playing' : 'idle',
          playbackProgress: reduced ? null : (frame - 1) / 718,
          seekAvailable: true, stepFrames: 12, transportMode: 'visual-frame-inspector',
        };
        const reportKey = JSON.stringify(report);
        if (reportKey !== lastReport) {lastReport = reportKey; latest.current.onPlaybackStateChange?.(report);}
        const next: View = {phase: snapshot.phase, frame, run: snapshot.audio.runId, ready: true, reduced, error: runtimeError};
        const key = `${next.phase}:${next.frame}:${next.run}:${next.reduced}:${next.error}`;
        if (key !== lastView) {lastView = key; setView(next);}
        if (snapshot.timelineReachedEnd && !completeReported) {
          completeReported = true;
          if (!reduced) latest.current.onPlaybackComplete?.();
          latest.current.onRuntimePausedChange(true);
        }
        frameHandle = requestAnimationFrame(draw);
      };
      draw();
    };
    void init().catch(cause => {
      if (!active) return;
      pause(); void clock?.close();
      setView(old => ({...old, phase: 'failed', error: cause instanceof Error ? cause.message : String(cause)}));
    });
    return () => {
      active = false; cancelAnimationFrame(frameHandle);
      media.removeEventListener('change', motionChanged);
      disconnect(); void clock?.close();
      if (clockRef.current === clock) clockRef.current = null;
      if (controlsRef.current === controls) controlsRef.current = null;
    };
  }, [props.animationId, props.moduleKey, props.audioEnabled, props.connectRuntimeControls]);
  useEffect(() => {clockRef.current?.setVolume(props.volume ?? 1);}, [props.volume]);
  useEffect(() => {
    const clock = clockRef.current, request = props.seekRequest;
    if (!request || !clock || !view.ready || request.requestId === lastSeek.current) return;
    lastSeek.current = request.requestId;
    if (clock.seekCandidateFrame(request.frame).accepted) props.onRuntimePausedChange(true);
  }, [props.seekRequest, props.onRuntimePausedChange, view.ready]);
  useEffect(() => {
    const clock = clockRef.current;
    if (props.paused && clock && ['playing', 'start-pending'].includes(clock.snapshot().phase)) clock.pause();
  }, [props.paused]);
  const style = {'--flash-stage-width': '800px', '--flash-stage-height': '600px',
    '--flash-stage-aspect': '800 / 600'} as CSSProperties;
  const textState = p003DrawingModule.getFrameState(view.frame, {frame: view.frame,
    frameDomain: 'sprite-154', rootFrame: 6, scenario: 'source-static-frame', lang: 'en', seed: 0});
  const textSnapshot = algL06P003TextSnapshot(textState);
  return <div className="runtime-shell" style={style} data-p003-host-probe={ALG_L6_P003_ID}
    data-p003-probe-phase={view.phase} data-source-clock-ready={view.ready ? 'true' : 'false'}
    data-runtime-paused={view.phase === 'playing' ? 'false' : 'true'}
    data-runtime-playback-complete={view.phase === 'timeline-ended' ? 'true' : 'false'}
    data-source-audio-run={view.run ?? 'none'} data-source-alignment="candidate-not-accepted">
    <div ref={stage} className="runtime-stage" data-animation-module={ALG_L6_P003_ID}
      data-flash-frame={view.frame} data-flash-frame-domain="sprite-154" data-runtime-scenario="source-static-frame">
      <canvas ref={canvas} width={800} height={600} data-course-canvas={ALG_L6_P003_ID}
        aria-hidden="true"
        style={{display: 'block', width: '100%', height: 'auto'}}/>
    </div>
    {view.ready && readableTarget ? createPortal(<section className={styles.readable} aria-label="Source-readable lesson text"
      style={{maxWidth: 640, margin: '12px auto', minWidth: 0}}>
      <p lang={props.uiLanguage} style={{margin: '0 0 0.5rem'}}>{props.uiLanguage === 'es'
        ? 'Texto original en inglés:' : 'Source text:'}</p>
      <LessonTextPresentation template="explanation" snapshot={textSnapshot}/>
    </section>, readableTarget) : null}
    {!view.ready && !view.error ? <p role="status">{props.labels.loading}</p> : null}
    {view.error ? <p role="alert" data-p003-probe-error={view.error}>{props.labels.unavailable}</p> : null}
    {view.ready && view.reduced ? <p role="status">{props.labels.reduced}</p> : null}
  </div>;
}
