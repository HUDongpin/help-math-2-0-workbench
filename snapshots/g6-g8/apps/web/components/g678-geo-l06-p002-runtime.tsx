'use client';
import {useEffect, useRef, useState, useSyncExternalStore, type CSSProperties} from 'react';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import type {LessonRuntimeAdapterControls, LessonRuntimeAdapterProps,
  PrivateLessonRuntimeAdapter} from '@/lib/lesson-runtime-adapter';
import {GEO_L06_P002_REDUCED_MOTION_FRAME, geoL06P002MainState} from
  '../../../packages/demos/src/geo-l06-p002-display-state-v1';
import {geoL06P002VisibleGlossaryTerms} from '../../../packages/demos/src/geo-l06-p002-glossary-v1';
import {GeoL06P002Renderer} from '../../../packages/demos/src/geo-l06-p002-renderer-v1';
import {GeoL06P002SourceAudioTransport} from '../../../packages/demos/src/geo-l06-p002-source-audio-transport-v1';
import type {AnimationRendererProps} from '../../../packages/demos/src/contract';

const ID = 'shared-geo001-l06-p002';
const LAST_FRAME = 1216;
type Phase = 'paused' | 'starting' | 'playing' | 'ended' | 'failed';
const MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const reducedMotionSnapshot = () => matchMedia(MOTION_QUERY).matches;
const serverMotionSnapshot = () => false;
function subscribeReducedMotion(notify: () => void) {
  const media = matchMedia(MOTION_QUERY);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
}

/** Source-clock candidate inside the real My Lesson controls. Its MP3
 * alignment, original-host entry, and listening/fidelity gates remain open. */
export function GeoL06P002HostRuntime(props: LessonRuntimeAdapterProps) {
  const latest = useRef(props);
  useEffect(() => { latest.current = props; });
  const {connectRuntimeControls, onRuntimePausedChange} = props;
  const [frame, setFrame] = useState(1);
  const [phase, setPhase] = useState<Phase>('paused');
  const [replay, setReplay] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion, reducedMotionSnapshot, serverMotionSnapshot);
  const visibleFrame = reducedMotion && !props.seekRequest
    ? GEO_L06_P002_REDUCED_MOTION_FRAME : frame;
  const frameRef = useRef(1);
  const transportRef = useRef<GeoL06P002SourceAudioTransport | null>(null);
  const controlsRef = useRef<LessonRuntimeAdapterControls | null>(null);
  const tokenRef = useRef(0);
  const playRef = useRef<{frame: number; time: number} | null>(null);
  const sourceStopRef = useRef(false);
  const inspectedRef = useRef(false);
  const lastSeekRef = useRef(0);
  const completeRef = useRef(false);
  const valid = process.env.NODE_ENV !== 'production' && props.audioEnabled === true &&
    props.animationId === ID && props.moduleKey === ID &&
    props.query.frameDomain === 'sprite-230' && props.query.scenario === 'default' &&
    props.query.lang === 'en' && String(props.query.seed) === '0' &&
    props.query.capture !== '1';
  const effectivePhase = valid ? phase : 'failed';
  const invalidSeek = props.seekRequest && (!Number.isSafeInteger(props.seekRequest.frame) ||
    props.seekRequest.frame < 1 || props.seekRequest.frame > LAST_FRAME);
  const effectiveError = valid ? invalidSeek ? 'GEO_P002_HOST_SEEK_OUT_OF_RANGE' : error
    : 'GEO_P002_HOST_SCOPE_MISMATCH';
  const publishFrame = (value: number) => {
    frameRef.current = value;
    setFrame(value);
  };

  useEffect(() => {
    if (!valid) return;
    const transport = new GeoL06P002SourceAudioTransport();
    transport.setVolume(latest.current.volume ?? 1);
    transportRef.current = transport;
    let closed = false;
    const pause = () => {
      tokenRef.current += 1;
      transport.stop();
      playRef.current = null;
      setPhase(current => current === 'ended' || current === 'failed' ? current : 'paused');
      latest.current.onRuntimePausedChange(true);
    };
    const start = async () => {
      if (closed || playRef.current || !transportRef.current) return;
      const nextFrame = frameRef.current === LAST_FRAME ? 1 : frameRef.current;
      if (nextFrame !== frameRef.current) {
        publishFrame(1);
        setReplay(value => value + 1);
        completeRef.current = false;
      }
      sourceStopRef.current = false;
      const token = ++tokenRef.current;
      setPhase('starting');
      setError(null);
      try {
        const started = await transport.startAt(nextFrame);
        if (!started || closed || token !== tokenRef.current) return;
        playRef.current = {frame: nextFrame, time: performance.now()};
        setPhase('playing');
        latest.current.onRuntimePausedChange(false);
      } catch (cause) {
        if (closed || token !== tokenRef.current) return;
        setError(cause instanceof Error ? cause.message : 'GEO_P002_AUDIO_START_FAILED');
        setPhase('failed');
        latest.current.onRuntimePausedChange(true);
      }
    };
    const controls: LessonRuntimeAdapterControls = {
      setPaused(value) { if (value) pause(); else void start(); },
      replay() {
        pause();
        sourceStopRef.current = false;
        inspectedRef.current = false;
        completeRef.current = false;
        publishFrame(1);
        setReplay(value => value + 1);
        void start();
        return true;
      },
      narration(action) { if (action === 'stop') pause(); else void start(); },
      stop() { pause(); },
    };
    controlsRef.current = controls;
    const disconnect = connectRuntimeControls(controls);
    onRuntimePausedChange(true); // Browser audio requires a user-started host action.
    return () => {
      closed = true;
      tokenRef.current += 1;
      transport.close();
      disconnect();
      if (transportRef.current === transport) transportRef.current = null;
      if (controlsRef.current === controls) controlsRef.current = null;
    };
  }, [valid, connectRuntimeControls, onRuntimePausedChange]);

  useEffect(() => {
    if (phase !== 'playing') return;
    let handle = 0;
    const tick = (now: number) => {
      const run = playRef.current;
      if (!run) return;
      const next = Math.min(LAST_FRAME, run.frame + Math.max(0,
        Math.floor((now - run.time) * 12 / 1000)));
      if (next !== frameRef.current) publishFrame(next);
      if (next === LAST_FRAME) {
        transportRef.current?.stop();
        playRef.current = null;
        setPhase('ended');
        latest.current.onRuntimePausedChange(true);
        if (!completeRef.current) {
          completeRef.current = true;
          latest.current.onPlaybackComplete?.();
        }
      } else handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [phase]);

  useEffect(() => {
    transportRef.current?.setVolume(props.volume ?? 1);
  }, [props.volume]);

  useEffect(() => {
    const request = props.seekRequest;
    if (!request || request.requestId === lastSeekRef.current) return;
    lastSeekRef.current = request.requestId;
    controlsRef.current?.setPaused(true);
    if (!Number.isSafeInteger(request.frame) || request.frame < 1 || request.frame > LAST_FRAME) {
      return;
    }
    inspectedRef.current = true;
    sourceStopRef.current = false;
    completeRef.current = false;
    const handle = requestAnimationFrame(() => publishFrame(request.frame));
    return () => cancelAnimationFrame(handle);
  }, [props.seekRequest]);

  useEffect(() => {
    if (props.paused) {
      controlsRef.current?.setPaused(true);
      return;
    }
    if (inspectedRef.current && !props.seekRequest) {
      inspectedRef.current = false;
      sourceStopRef.current = false;
      controlsRef.current?.setPaused(false);
      return;
    }
    if (sourceStopRef.current) {
      latest.current.onRuntimePausedChange(true);
      return;
    }
  }, [props.paused, props.seekRequest]);

  useEffect(() => {
    const report: AnimationRuntimePlaybackState = {
      audioAvailable: valid && effectivePhase !== 'failed', frame: visibleFrame,
      frameCount: LAST_FRAME,
      frameDomain: 'sprite-230', fps: 12,
      narration: effectivePhase === 'playing' ? 'playing' : 'idle',
      playbackProgress: reducedMotion ? null : (visibleFrame - 1) / (LAST_FRAME - 1),
      seekAvailable: valid && effectivePhase !== 'failed', stepFrames: 12,
      transportMode: 'visual-frame-inspector',
    };
    latest.current.onPlaybackStateChange?.(report);
  }, [visibleFrame, effectivePhase, reducedMotion, valid]);

  const onLessonHostRequest: NonNullable<AnimationRendererProps['onLessonHostRequest']> =
    (request, context) => {
      if (request.type !== 'open-glossary') return props.onLessonHostRequest?.(request, context);
      const source = geoL06P002MainState(visibleFrame, {frame: visibleFrame,
        frameDomain: 'sprite-230', scenario: 'default', lang: 'en', seed: 0, replay});
      if (!geoL06P002VisibleGlossaryTerms(source).some(term => term.id === request.entryId)) return;
      const decision = props.onLessonHostRequest?.(request, context);
      if (decision?.status === 'allowed') {
        sourceStopRef.current = true;
        controlsRef.current?.setPaused(true); // Source on(release) stops the sprite.
      }
      return decision;
    };
  const style = {'--flash-stage-width': '800px', '--flash-stage-height': '600px',
    '--flash-stage-aspect': '800 / 600'} as CSSProperties;
  return <div className="runtime-shell" style={style} data-source-p002-runtime={ID}
    data-source-p002-phase={effectivePhase} data-source-audio="candidate-not-accepted"
    data-source-p002-motion={reducedMotion ? 'static-source-summary' : 'source-frames'}
    data-source-p002-audio-frame={frame}
    data-runtime-paused={effectivePhase === 'playing' ? 'false' : 'true'}
    data-runtime-playback-complete={effectivePhase === 'ended' ? 'true' : 'false'}>
    <div className="runtime-stage" data-animation-module={ID} data-flash-frame={visibleFrame}
      data-flash-frame-domain="sprite-230" data-runtime-scenario="default">
      <GeoL06P002Renderer frame={visibleFrame} frameDomain="sprite-230" rootFrame={6}
        scenario="default" lang="en" uiLanguage={props.uiLanguage} seed={0} replay={replay}
        paused={effectivePhase !== 'playing'} reducedMotion={reducedMotion}
        audioEnabled={valid} onLessonHostRequest={onLessonHostRequest}/>
    </div>
    {effectivePhase === 'starting' && <p role="status">{props.labels.loading}</p>}
    {effectiveError && <p role="alert" data-source-p002-error={effectiveError}>{props.labels.unavailable}</p>}
  </div>;
}

export const GEO_L06_P002_RUNTIME_ADAPTER: PrivateLessonRuntimeAdapter = Object.freeze({
  animationId: ID, audioEnabled: true, Component: GeoL06P002HostRuntime,
});
