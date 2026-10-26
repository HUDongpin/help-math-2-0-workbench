'use client';

import {useEffect, useMemo, useRef, useState, useSyncExternalStore, type ComponentProps,
  type CSSProperties} from 'react';
import {DatL02P002CandidateRenderer} from '@helpmath/demos/dat-l02-p002-local-candidate';
import {DAT_L02_P002_AUDIO_URL} from '@/lib/dat-l02-p002-source-audio-access';
import {G678MultiPageLessonPlayer} from './g678-multi-page-lesson-player-v3.generated';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import type {LessonRuntimeAdapterProps, LessonRuntimeAdapterControls} from
  '@/lib/lesson-runtime-adapter';

const ID = 'shared-dat001-l02-p002';
const LAST = 276;
type Assets = Readonly<{assetHrefs: Readonly<Record<string, string>>;
  maskPaths: Readonly<Record<string, {d: string; clipRule: 'evenodd' | 'nonzero'}>>;
  transcript: Readonly<{title: string; assignment: string; steps: readonly string[]}>}>;
type Phase = 'paused' | 'starting' | 'playing' | 'ended' | 'failed';
const motionQuery = '(prefers-reduced-motion: reduce)';
const motionSnapshot = () => matchMedia(motionQuery).matches;
const serverMotionSnapshot = () => false;
function subscribeMotion(notify: () => void) {
  const media = matchMedia(motionQuery);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
}

/** Probe-only media clock, not a source-host synchronization or completion claim. */
function DatL02P002HostRuntime({assets, ...props}: LessonRuntimeAdapterProps & {assets: Assets}) {
  const latest = useRef(props);
  useEffect(() => {latest.current = props;});
  const [frame, setFrame] = useState(1);
  const [phase, setPhase] = useState<Phase>('paused');
  const [replay, setReplay] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const reducedMotion = useSyncExternalStore(subscribeMotion, motionSnapshot,
    serverMotionSnapshot);
  const visibleFrame = reducedMotion ? LAST : frame;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSeek = useRef(0);
  const connectRuntimeControls = props.connectRuntimeControls;
  const valid = process.env.NODE_ENV !== 'production' &&
    props.animationId === ID && props.moduleKey === ID &&
    props.query.frameDomain === 'sprite-113' &&
    props.query.scenario === 'default' &&
    props.query.lang === 'en' && String(props.query.seed) === '0' &&
    props.query.capture !== '1';

  useEffect(() => {
    if (!valid) return;
    const audio = new Audio(DAT_L02_P002_AUDIO_URL);
    audio.preload = 'metadata';
    audio.volume = latest.current.volume ?? 1;
    audioRef.current = audio;
    let closed = false;
    const onPlay = () => {
      if (closed) return;
      setPhase('playing'); latest.current.onRuntimePausedChange(false);
    };
    const onPause = () => {
      if (closed) return;
      setPhase(current => current === 'ended' || current === 'failed' ? current : 'paused');
      latest.current.onRuntimePausedChange(true);
    };
    const onEnded = () => {
      if (closed) return;
      setFrame(LAST); setPhase('ended');
      latest.current.onRuntimePausedChange(true);
      // The parent source Stop is known; the original host's page-complete signal is not.
      // Never call onPlaybackComplete from this probe.
    };
    const onError = () => {
      if (closed) return;
      setError('DAT_P002_SOURCE_AUDIO_UNAVAILABLE'); setPhase('failed');
      latest.current.onRuntimePausedChange(true);
    };
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    const pause = () => {audio.pause(); latest.current.onRuntimePausedChange(true);};
    const start = () => {
      if (audio.ended || (Number.isFinite(audio.duration) &&
          audio.currentTime >= audio.duration - 0.08)) {
        audio.currentTime = 0; setFrame(1); setReplay(value => value + 1);
      }
      setError(null); setPhase('starting');
      void audio.play().catch(onError);
    };
    const controls: LessonRuntimeAdapterControls = {
      setPaused(value) {if (value) pause(); else start();},
      replay() {pause(); audio.currentTime = 0; setFrame(1);
        setReplay(value => value + 1); start(); return true;},
      narration(action) {if (action === 'stop') pause(); else start();},
      stop: pause,
    };
    const disconnect = connectRuntimeControls(controls);
    latest.current.onRuntimePausedChange(true);
    return () => {
      closed = true; pause(); disconnect(); audio.removeAttribute('src'); audio.load();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      if (audioRef.current === audio) audioRef.current = null;
    };
  }, [valid, connectRuntimeControls]);

  useEffect(() => {if (audioRef.current) audioRef.current.volume = props.volume ?? 1;},
    [props.volume]);
  useEffect(() => {
    if (phase !== 'playing') return;
    let handle = 0;
    const tick = () => {
      const audio = audioRef.current;
      if (!audio) return;
      const current = Math.min(LAST, Math.floor(audio.currentTime * 12) + 1);
      setFrame(previous => previous === current ? previous : current);
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [phase]);
  useEffect(() => {
    const request = props.seekRequest;
    const audio = audioRef.current;
    if (!request || !audio || request.requestId === lastSeek.current) return;
    lastSeek.current = request.requestId;
    audio.pause();
    const handle = requestAnimationFrame(() => {
      if (!Number.isSafeInteger(request.frame) || request.frame < 1 || request.frame > LAST) {
        setError('DAT_P002_PROBE_SEEK_OUT_OF_RANGE'); return;
      }
      audio.currentTime = (request.frame - 1) / 12;
      setFrame(request.frame); setPhase('paused');
    });
    return () => cancelAnimationFrame(handle);
  }, [props.seekRequest]);
  useEffect(() => {
    if (props.paused) audioRef.current?.pause();
  }, [props.paused]);
  useEffect(() => {
    const report: AnimationRuntimePlaybackState = {
      audioAvailable: valid && phase !== 'failed', frame: visibleFrame, frameCount: LAST,
      frameDomain: 'sprite-113', fps: 12,
      narration: phase === 'playing' ? 'playing' : 'idle',
      playbackProgress: reducedMotion ? null : (frame - 1) / (LAST - 1),
      seekAvailable: valid && phase !== 'failed' && !reducedMotion, stepFrames: 12,
      transportMode: 'visual-frame-inspector',
    };
    latest.current.onPlaybackStateChange?.(report);
  }, [frame, visibleFrame, phase, valid, reducedMotion]);

  const locale = props.uiLanguage === 'es' ? 'es' : 'en';
  const style = {'--flash-stage-width': '800px', '--flash-stage-height': '600px',
    '--flash-stage-aspect': '800 / 600'} as CSSProperties;
  return <div className="runtime-shell" style={style} data-dat-p002-host-probe={ID}
    data-dat-p002-phase={valid ? phase : 'failed'}
    data-runtime-paused={phase === 'playing' ? 'false' : 'true'}
    data-runtime-playback-complete="false">
    <div className="runtime-stage" data-animation-module={ID} data-flash-frame={visibleFrame}
      data-flash-frame-domain="sprite-113" data-runtime-scenario="default">
      {valid && <DatL02P002CandidateRenderer context={{frame: visibleFrame, frameDomain: 'sprite-113',
        rootFrame: 6, scenario: 'default', lang: 'en', seed: 0, replay}}
      assetHrefs={assets.assetHrefs} maskPaths={assets.maskPaths}
      nativeTerminalAssignment={visibleFrame === LAST}/>}
    </div>
    {valid && visibleFrame === LAST && <section lang="en" data-p002-host-native-assignment="candidate"
      style={{padding: '0.75rem', fontSize: 'clamp(1rem, 2vw, 1.25rem)', lineHeight: 1.5}}>
      <h2>{assets.transcript.title}</h2><p>{assets.transcript.assignment}</p>
      <ul>{assets.transcript.steps.map((step, index) => <li key={index}>{step}</li>)}</ul>
    </section>}
    {valid && visibleFrame !== LAST && <details style={{padding: '0.75rem'}}>
      <summary>{locale === 'es' ? 'Transcripción original en inglés' : 'Original English transcript'}</summary>
      <div lang="en"><h2>{assets.transcript.title}</h2><p>{assets.transcript.assignment}</p>
        <ul>{assets.transcript.steps.map((step, index) => <li key={index}>{step}</li>)}</ul>
      </div>
    </details>}
    {(error || !valid) && <p role="alert">{locale === 'es'
      ? 'La prueba local no está disponible.' : 'Local probe unavailable.'}</p>}
  </div>;
}

export function G678DatL02P002HostLesson({assets, ...props}:
  Omit<ComponentProps<typeof G678MultiPageLessonPlayer>, 'privateRuntimeAdapter'> &
  {assets: Assets}) {
  const adapter = useMemo(() => ({animationId: ID, audioEnabled: true,
    Component: (runtimeProps: LessonRuntimeAdapterProps) =>
      <DatL02P002HostRuntime {...runtimeProps} assets={assets}/>,
  }), [assets]);
  return <G678MultiPageLessonPlayer {...props} privateRuntimeAdapter={adapter}/>;
}
