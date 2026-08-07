'use client';
import {
  loadAnimationModule,
  type AnimationModule,
  type AnimationRendererProps,
} from '@helpmath/demos/animation-registry';
import {matchPrototype} from '@helpmath/demos/prototype-manifest';
import {
  audioCueMatchesContext,
  clampFrame,
  createPlaybackContext,
  createRuntimeContext,
  frameAtElapsedMs,
  frameDomainMovie,
  frameToElapsedMs,
  isSameOriginAssetSource,
  resolveAudioCueTransition,
  resolveFrameDomain,
  resolvePlaybackEndFrame,
  resolveReducedMotionFrame,
  stateSupportsRuntimeContext,
  type LessonHostCapability,
  type LessonHostRequest,
} from '@helpmath/demos/runtime';
import {useCallback, useEffect, useRef, useState, type CSSProperties} from 'react';
import {
  LoadedSwfHostCanvas,
  type LoadedSwfHostAsset,
} from './loaded-swf-host-canvas';
export type AnimationRuntimeQuery = {frame?: string; frameDomain?: string; scenario?: string; lang?: string; seed?: string; requirementId?: string; trace?: string; entryStateSha256?: string; capture?: string; duplicateCaptureIdentity?: boolean};
export interface AnimationRuntimePlaybackState {
  readonly audioAvailable: boolean;
  readonly frame: number;
  readonly frameCount: number;
  readonly frameDomain: string;
  readonly fps: number;
  readonly seekAvailable: boolean;
  readonly stepFrames: number;
  readonly transportMode: 'none' | 'visual-frame-inspector';
}
export interface AnimationRuntimeSeekRequest {
  readonly frame: number;
  readonly requestId: number;
}
export const INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE:
AnimationRuntimePlaybackState = Object.freeze({
  audioAvailable: false,
  frame: 1,
  frameCount: 1,
  frameDomain: 'root',
  fps: 0,
  seekAvailable: false,
  stepFrames: 0,
  transportMode: 'none',
});
type CaptureIdentityContext = Readonly<{frame: number; frameDomain: string; requirementId: string; traceId: string; entryStateSha256: string; scenario: string; lang: 'en' | 'es'; seed: number}>;
const stableCaptureId = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const canonicalPositiveInteger = /^[1-9]\d*$/;
const canonicalUnsignedInteger = /^(?:0|[1-9]\d*)$/;
const ignoreTimelinePauseChange: (paused: boolean) => void = () => undefined;
type RuntimeAudioCue = AnimationModule['audioCues'][number];

function lessonHostCapabilityForRequest(
  request: LessonHostRequest,
): LessonHostCapability | null {
  if (request.type === 'navigate') return 'navigation';
  if (request.type === 'set-language') return 'language';
  if (request.type === 'open-glossary' || request.type === 'close-glossary') {
    return 'glossary';
  }
  if (request.type === 'open-keyterm' || request.type === 'close-keyterm') {
    return 'keyterm';
  }
  if (request.type === 'open-calculator' || request.type === 'close-calculator') {
    return 'calculator';
  }
  if (request.type === 'play-audio' || request.type === 'stop-audio') {
    return 'audio';
  }
  if (request.type === 'record-fq-score' || request.type === 'reset-fq-score') {
    return 'fq-scoring';
  }
  return null;
}

export function moduleDeclaresLessonHostRequest(
  module: AnimationModule | undefined,
  request: LessonHostRequest,
): boolean {
  const capability = lessonHostCapabilityForRequest(request);
  return capability !== null &&
    Boolean(module?.lessonHost?.capabilities.includes(capability));
}

/**
 * Capture URLs are evidence identities, so capture mode must not inherit the
 * normal playback fallbacks in createRuntimeContext. The pure TS006 state is
 * checked separately to prevent an outer host identity from masking a
 * different nested renderer identity.
 */
export function strictCaptureIdentityFailure(
  query: AnimationRuntimeQuery,
  context: CaptureIdentityContext,
  state: unknown,
  requireStateIdentity = false
): string | null {
  if (query.capture !== '1') return null;
  if (query.duplicateCaptureIdentity) return 'duplicate-capture-identity-parameter';
  if (!query.frame || !canonicalPositiveInteger.test(query.frame)) return 'invalid-or-missing-frame';
  const requestedFrame = Number(query.frame);
  if (!Number.isSafeInteger(requestedFrame) || requestedFrame !== context.frame) return 'frame-mismatch';
  if (!query.frameDomain || !stableCaptureId.test(query.frameDomain) || query.frameDomain !== context.frameDomain) return 'invalid-or-mismatched-frame-domain';
  if (!query.requirementId || !stableCaptureId.test(query.requirementId) || query.requirementId !== context.requirementId) return 'invalid-or-mismatched-requirement-id';
  if (!query.trace || !stableCaptureId.test(query.trace) || query.trace !== context.traceId) return 'invalid-or-mismatched-trace-id';
  if (!/^[a-f0-9]{64}$/.test(query.entryStateSha256 ?? '') || query.entryStateSha256 !== context.entryStateSha256) return 'invalid-or-mismatched-entry-state-sha256';
  if (!query.scenario || !stableCaptureId.test(query.scenario) || query.scenario !== context.scenario) return 'invalid-or-mismatched-scenario';
  if ((query.lang !== 'en' && query.lang !== 'es') || query.lang !== context.lang) return 'invalid-or-mismatched-language';
  if (!query.seed || !canonicalUnsignedInteger.test(query.seed)) return 'invalid-or-missing-seed';
  const requestedSeed = Number(query.seed);
  if (!Number.isSafeInteger(requestedSeed) || requestedSeed > 0xffff_ffff || requestedSeed !== context.seed) return 'seed-mismatch';
  if (!requireStateIdentity) return null;
  if (!state || typeof state !== 'object') return 'state-capture-identity-missing';
  const candidate = state as Partial<{
    frame: number;
    frameDomain: string;
    requirementId: string;
    traceId: string;
    entryStateSha256: string;
    scenario: string;
    language: 'en' | 'es';
    seed: number;
  }>;
  return candidate.frame === context.frame
    && candidate.frameDomain === context.frameDomain
    && candidate.requirementId === context.requirementId
    && candidate.traceId === context.traceId
    && candidate.entryStateSha256 === context.entryStateSha256
    && candidate.scenario === context.scenario
    && candidate.language === context.lang
    && candidate.seed === context.seed
    ? null
    : 'state-capture-identity-mismatch';
}

function useFrame(movie: AnimationModule['movie'] | undefined, playbackMode: AnimationModule['playbackMode'], playbackEndFrame: AnimationModule['playbackEndFrame'], running: boolean, replay: number, playbackIdentity: string) {
  const mode = playbackMode ?? 'once';
  const endFrame = movie ? resolvePlaybackEndFrame(movie, playbackEndFrame) : 1;
  const fps = movie?.fps ?? 0, frameCount = movie?.frameCount ?? 0;
  const signature = `${playbackIdentity}:${fps}:${frameCount}:${endFrame}:${mode}:${replay}`;
  const [clock, setClock] = useState({signature, frame: 1});
  const [seekRevision, setSeekRevision] = useState(0);
  const elapsed = useRef({signature, milliseconds: 0});
  const activeLoop = useRef<{
    signature: string;
    request: number;
    startedAt: number;
    priorElapsed: number;
    movie: AnimationModule['movie'];
    mode: NonNullable<AnimationModule['playbackMode']>;
    endFrame: number;
  } | null>(null);
  const stopActiveLoop = useCallback((expectedSignature?: string) => {
    const loop = activeLoop.current;
    if (!loop || (expectedSignature && loop.signature !== expectedSignature)) return;
    cancelAnimationFrame(loop.request);
    const milliseconds = loop.priorElapsed + Math.max(0, performance.now() - loop.startedAt);
    elapsed.current = {signature: loop.signature, milliseconds};
    const frozenFrame = frameAtElapsedMs(milliseconds, loop.movie!, loop.mode, loop.endFrame);
    setClock((value) => value.signature === loop.signature && value.frame === frozenFrame
      ? value
      : {signature: loop.signature, frame: frozenFrame});
    activeLoop.current = null;
  }, []);
  useEffect(() => {
    stopActiveLoop();
    if (elapsed.current.signature !== signature) {
      elapsed.current = {signature, milliseconds: 0};
      setClock({signature, frame: 1});
    }
    if (!fps || !frameCount || !running) return;
    const playbackMovie = {stage: {width: 1, height: 1}, fps, frameCount, durationMs: (frameCount * 1000) / fps};
    const loop = {
      signature,
      request: 0,
      startedAt: performance.now(),
      priorElapsed: elapsed.current.milliseconds,
      movie: playbackMovie,
      mode,
      endFrame
    };
    activeLoop.current = loop;
    const tick = (now: number) => {
      if (activeLoop.current !== loop) return;
      const elapsedMilliseconds = loop.priorElapsed + Math.max(0, now - loop.startedAt);
      elapsed.current = {signature, milliseconds: elapsedMilliseconds};
      const next = frameAtElapsedMs(elapsedMilliseconds, playbackMovie, mode, endFrame);
      setClock((value) => value.signature === signature && value.frame === next ? value : {signature, frame: next});
      if (mode === 'loop' || next < endFrame) {
        loop.request = requestAnimationFrame(tick);
      } else {
        activeLoop.current = null;
      }
    };
    loop.request = requestAnimationFrame(tick);
    return () => stopActiveLoop(signature);
  }, [endFrame, fps, frameCount, mode, running, seekRevision, signature, stopActiveLoop]);
  const seekToFrame = useCallback((requestedFrame: number) => {
    if (!fps || !frameCount) return;
    stopActiveLoop(signature);
    const normalizedFrame = clampFrame(requestedFrame, frameCount);
    const playbackMovie = {
      stage: {width: 1, height: 1},
      fps,
      frameCount,
      durationMs: (frameCount * 1000) / fps,
    };
    elapsed.current = {
      signature,
      milliseconds: frameToElapsedMs(normalizedFrame, playbackMovie),
    };
    setClock({signature, frame: normalizedFrame});
    setSeekRevision((value) => value + 1);
  }, [fps, frameCount, signature, stopActiveLoop]);
  return {
    frame: clock.signature === signature ? clock.frame : 1,
    pauseNow: useCallback(() => stopActiveLoop(signature), [signature, stopActiveLoop]),
    seekRevision,
    seekToFrame,
  };
}

function useAudio(module: AnimationModule | undefined, frame: number, fps: number, frameDomain: string, lang: 'en' | 'es', enabled: boolean, replay: number, scenario: string, seed: number, volume: number, onAutoplayBlocked: (cue: RuntimeAudioCue | null) => void) {
  const active = useRef<Map<string, HTMLAudioElement>>(new Map()), previous = useRef(0);
  const safeVolume = Math.max(0, Math.min(1, volume));
  const stopNow = useCallback(() => {
    onAutoplayBlocked(null);
    for (const audio of active.current.values()) {
      audio.pause();
      audio.currentTime = 0;
    }
    active.current.clear();
    previous.current = 0;
  }, [onAutoplayBlocked]);
  useEffect(() => {
    stopNow();
    return stopNow;
  }, [module, enabled, frameDomain, lang, replay, scenario, seed, stopNow]);
  useEffect(() => {
    for (const audio of active.current.values()) audio.volume = safeVolume;
  }, [safeVolume]);
  useEffect(() => {
    if (!module || !enabled) return;
    const transition = resolveAudioCueTransition(module.audioCues, {previousFrame: previous.current, frame, fps, frameDomain, lang, scenario, seed});
    previous.current = frame;
    for (const cueId of transition.stopIds) {
      const audio = active.current.get(cueId);
      if (!audio) continue;
      audio.pause();
      audio.currentTime = 0;
      active.current.delete(cueId);
    }
    for (const {cue, offsetSeconds} of transition.start) {
      if (!isSameOriginAssetSource(cue.source)) continue;
      const prior = active.current.get(cue.id);
      if (prior) {prior.pause(); prior.currentTime = 0;}
      const audio = new Audio(cue.source);
      audio.volume = safeVolume;
      active.current.set(cue.id, audio);
      if (offsetSeconds > 0) {
        try {audio.currentTime = offsetSeconds;} catch {audio.addEventListener('loadedmetadata', () => {audio.currentTime = offsetSeconds;}, {once: true});}
      }
      const done = () => {if (active.current.get(cue.id) === audio) active.current.delete(cue.id);};
      audio.addEventListener('ended', done, {once: true});
      audio.addEventListener('error', done, {once: true});
      void audio.play().then(
        () => onAutoplayBlocked(null),
        (error: unknown) => {
          done();
          if (error instanceof DOMException && error.name === 'NotAllowedError') {
            onAutoplayBlocked(cue);
          }
        }
      );
    }
  }, [module, enabled, frame, fps, frameDomain, lang, scenario, seed, safeVolume, onAutoplayBlocked]);
  return {stopNow};
}

export function HostAudioControls({module, lang, frameDomain = 'root', fallbackCue = null, disabled = false, onTimelinePauseChange = ignoreTimelinePauseChange, volume = 1}: {module: AnimationModule; lang: 'en' | 'es'; frameDomain?: string; fallbackCue?: RuntimeAudioCue | null; disabled?: boolean; onTimelinePauseChange?: (paused: boolean) => void; volume?: number}) {
  const active = useRef<{audio: HTMLAudioElement; pausesTimeline: boolean} | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const safeVolume = Math.max(0, Math.min(1, volume));
  const explicitTracks = (module.audioTracks ?? []).filter(
    (track) => track.visibleWhen.includes(lang) && (!track.frameDomains || track.frameDomains.includes(frameDomain))
  );
  // Browsers may reject source-faithful autoplay until the learner interacts
  // with the page. Expose only the exact cue whose play() attempt was blocked.
  const tracks = explicitTracks.length === 0
      && fallbackCue
      && fallbackCue.durationMs !== undefined
      && fallbackCue.sha256 !== undefined
    ? [
        {
          id: `${fallbackCue.id}-manual-fallback`,
          language: lang,
          label: lang === 'es' ? 'Audio en español' : 'English audio',
          source: fallbackCue.source,
          durationMs: fallbackCue.durationMs,
          sha256: fallbackCue.sha256,
          activation: 'user' as const,
          visibleWhen: [lang] as const,
          frameDomains: [frameDomain] as const,
          timelineBehavior: 'none' as const
        }
      ]
    : explicitTracks;
  useEffect(() => () => {
    const current = active.current;
    current?.audio.pause();
    if (current?.pausesTimeline) onTimelinePauseChange(false);
    active.current = null;
  }, [module, lang, frameDomain, disabled, onTimelinePauseChange]);
  useEffect(() => {
    if (active.current) active.current.audio.volume = safeVolume;
  }, [safeVolume]);
  if (!tracks.length) return null;
  const toggle = (track: NonNullable<AnimationModule['audioTracks']>[number]) => {
    if (disabled || !isSameOriginAssetSource(track.source)) return;
    if (playing === track.id && active.current) {
      const current = active.current;
      current.audio.pause();
      current.audio.currentTime = 0;
      if (current.pausesTimeline) onTimelinePauseChange(false);
      active.current = null;
      setPlaying(null);
      return;
    }
    const prior = active.current;
    prior?.audio.pause();
    if (prior) prior.audio.currentTime = 0;
    if (prior?.pausesTimeline) onTimelinePauseChange(false);
    const audio = new Audio(track.source);
    audio.volume = safeVolume;
    const pausesTimeline = track.timelineBehavior === 'pause-while-playing';
    active.current = {audio, pausesTimeline};
    if (pausesTimeline) onTimelinePauseChange(true);
    const done = () => {
      if (active.current?.audio === audio) {
        active.current = null;
        if (pausesTimeline) onTimelinePauseChange(false);
      }
      setPlaying((current) => current === track.id ? null : current);
    };
    audio.addEventListener('ended', done, {once: true});
    audio.addEventListener('error', done, {once: true});
    setPlaying(track.id);
    void audio.play().catch(done);
  };
  return <div aria-label={lang === 'es' ? 'Audio narrado' : 'Narration audio'} className="runtime-audio-controls" role="group">
    {tracks.map((track) => {
      const trackName = lang === 'es'
        ? track.language === 'es' ? 'audio en español' : 'audio en inglés'
        : track.language === 'es' ? 'Spanish audio' : 'English audio';
      const label = playing === track.id
        ? lang === 'es' ? `Detener ${trackName}` : `Stop ${trackName}`
        : lang === 'es' ? `Reproducir ${trackName}` : `Play ${trackName}`;
      return <button aria-pressed={playing === track.id} data-audio-control-kind={track.id.endsWith('-manual-fallback') ? 'autoplay-fallback' : 'host-track'} data-audio-timeline-behavior={track.timelineBehavior ?? 'none'} disabled={disabled} key={track.id} onClick={() => toggle(track)} type="button">
        {label}
      </button>;
    })}
  </div>;
}

export function AnimationRuntime({
  animationId,
  moduleKey,
  query,
  labels,
  loadedSwfHostAsset,
  onLessonHostRequest,
  onReplay: onReplayCallback,
  onPlaybackStateChange,
  pageInteractionCompanionTargetId,
  paused = false,
  seekRequest,
  presentation = 'workbench',
  uiLanguage,
  volume = 1,
}: {
  animationId: string;
  moduleKey: string;
  query: AnimationRuntimeQuery;
  labels: {
    replay: string;
    reduced: string;
    prototype: string;
    unavailable: string;
    loading: string;
  };
  loadedSwfHostAsset?: LoadedSwfHostAsset;
  onLessonHostRequest?: AnimationRendererProps['onLessonHostRequest'];
  onReplay?: () => void;
  onPlaybackStateChange?: (state: AnimationRuntimePlaybackState) => void;
  pageInteractionCompanionTargetId?: string;
  paused?: boolean;
  seekRequest?: AnimationRuntimeSeekRequest | null;
  presentation?: 'workbench' | 'lesson' | 'legacy-shell';
  uiLanguage?: AnimationRendererProps['lang'];
  volume?: number;
}) {
  const [loaded, setLoaded] = useState<{key: string; module?: AnimationModule; failed?: boolean}>({key: moduleKey});
  const [replay, setReplay] = useState(0), [reduced, setReduced] = useState<boolean | undefined>();
  const [hostAudioPaused, setHostAudioPaused] = useState(false);
  const [autoplayBlockedCue, setAutoplayBlockedCue] = useState<RuntimeAudioCue | null>(null);
  const animationModule = loaded.key === moduleKey ? loaded.module : undefined;
  const prototype = matchPrototype({animationId: moduleKey});
  useEffect(() => {let cancelled = false; loadAnimationModule(moduleKey).then((value) => {if (!cancelled) setLoaded({key: moduleKey, module: value, failed: !value});}).catch(() => {if (!cancelled) setLoaded({key: moduleKey, failed: true});}); return () => {cancelled = true;};}, [moduleKey]);
  useEffect(() => {const media = matchMedia('(prefers-reduced-motion: reduce)'), update = () => setReduced(media.matches); update(); media.addEventListener('change', update); return () => media.removeEventListener('change', update);}, []);
  const runtimeMetadata = prototype?.runtime ?? animationModule?.runtime ?? animationModule?.movie;
  const context = animationModule && runtimeMetadata
    ? createRuntimeContext(
        query,
        runtimeMetadata,
        animationModule.scenarios,
        animationModule.defaultScenarioByFrameDomain
      )
    : undefined;
  const frameDomain = runtimeMetadata && context ? resolveFrameDomain(runtimeMetadata, context.frameDomain) : undefined;
  const activeMovie = runtimeMetadata && frameDomain ? frameDomainMovie(runtimeMetadata, frameDomain) : undefined;
  const playbackEndFrame = frameDomain
    ? animationModule?.playbackEndFrameByDomain?.[frameDomain.id] ?? animationModule?.playbackEndFrame
    : animationModule?.playbackEndFrame;
  const capture = query.capture === '1', running = Boolean(animationModule && context?.captureFrame === undefined && reduced === false && !hostAudioPaused && !paused);
  const playbackIdentity = JSON.stringify([
    animationModule?.key ?? moduleKey,
    context?.frameDomain ?? '',
    context?.scenario ?? '',
    context?.lang ?? '',
    context?.seed ?? 0,
    context?.traceId ?? '',
    context?.requirementId ?? '',
    context?.entryStateSha256 ?? ''
  ]);
  const {
    frame: liveFrame,
    pauseNow: pauseTimelineNow,
    seekRevision,
    seekToFrame,
  } = useFrame(activeMovie, animationModule?.playbackMode, playbackEndFrame, running, replay, playbackIdentity);
  const onHostAudioTimelinePauseChange = useCallback((paused: boolean) => {
    if (paused) pauseTimelineNow();
    setHostAudioPaused(paused);
  }, [pauseTimelineNow]);
  const reducedMotionFrame = animationModule && activeMovie
    ? resolveReducedMotionFrame(activeMovie, animationModule.reducedMotionFrame)
    : 1;
  // `running` becomes false while source host narration pauses the child
  // timeline. Keep rendering the last live frame in that state; falling back
  // to frame 1 would visually restart the movie for the duration of the audio.
  const frame = context?.captureFrame ?? (reduced === true ? reducedMotionFrame : liveFrame);
  const transport = animationModule?.transport;
  const transportEnabledForDomain = Boolean(
    transport &&
      frameDomain &&
      transport.frameDomains.includes(frameDomain.id),
  );
  const seekAvailable = Boolean(
    transportEnabledForDomain &&
      activeMovie &&
      activeMovie.frameCount > 1 &&
      context?.captureFrame === undefined &&
      reduced === false &&
      !capture,
  );
  const audioContext = context && frameDomain
    ? {
        frameDomain: frameDomain.id,
        lang: context.lang,
        scenario: context.scenario,
        seed: context.seed,
      }
    : null;
  const audioAvailable = Boolean(
    animationModule &&
      audioContext &&
      (
        animationModule.audioCues.some((cue) =>
          isSameOriginAssetSource(cue.source) &&
            audioCueMatchesContext(cue, audioContext)) ||
        animationModule.audioTracks?.some((track) =>
          isSameOriginAssetSource(track.source) &&
            track.visibleWhen.includes(audioContext.lang) &&
            (!track.frameDomains ||
              track.frameDomains.includes(audioContext.frameDomain)))
      ),
  );
  const lastSeekRequestRef = useRef(0);
  useEffect(() => {
    if (
      !seekRequest ||
      !seekAvailable ||
      seekRequest.requestId === lastSeekRequestRef.current
    ) {
      return;
    }
    lastSeekRequestRef.current = seekRequest.requestId;
    seekToFrame(seekRequest.frame);
  }, [seekAvailable, seekRequest, seekToFrame]);
  const reportedFrameCount = activeMovie?.frameCount ?? 1;
  useEffect(() => {
    onPlaybackStateChange?.({
      audioAvailable,
      frame,
      frameCount: reportedFrameCount,
      frameDomain: frameDomain?.id ?? 'root',
      fps: activeMovie?.fps ?? 0,
      seekAvailable,
      stepFrames: transport?.stepFrames ?? 0,
      transportMode: transportEnabledForDomain
        ? 'visual-frame-inspector'
        : 'none',
    });
  }, [
    activeMovie?.fps,
    audioAvailable,
    frame,
    frameDomain?.id,
    onPlaybackStateChange,
    reportedFrameCount,
    seekAvailable,
    transport?.stepFrames,
    transportEnabledForDomain,
  ]);
  const playbackContext = context && frameDomain
    ? createPlaybackContext(context, frame, replay, frameDomain)
    : undefined;
  const state = animationModule && playbackContext
    ? animationModule.getFrameState(frame, playbackContext)
    : undefined;
  const rendererDomainSupported = Boolean(
    state && playbackContext && runtimeMetadata &&
      stateSupportsRuntimeContext(state, playbackContext, runtimeMetadata)
  );
  const captureIdentityFailure = playbackContext
    ? strictCaptureIdentityFailure(
        query,
        playbackContext,
        state,
        moduleKey === 'course-g04-l03-ts-006'
      )
    : null;
  const {stopNow: stopTimelineAudioNow} = useAudio(animationModule, frame, activeMovie?.fps ?? 1, context?.frameDomain ?? 'root', context?.lang ?? 'en', running && !capture && rendererDomainSupported, replay, context?.scenario ?? 'default', context?.seed ?? 0, volume, setAutoplayBlockedCue);
  const handleRendererLessonHostRequest = useCallback<
    NonNullable<AnimationRendererProps['onLessonHostRequest']>
  >((request, hostContext) => {
    if (!moduleDeclaresLessonHostRequest(animationModule, request)) {
      return undefined;
    }
    const decision = onLessonHostRequest?.(request, hostContext);
    if (
      decision?.status === 'allowed' &&
      request.type === 'open-keyterm' &&
      request.playbackDisposition ===
        'source-stop-timeline-and-audio-until-explicit-resume'
    ) {
      pauseTimelineNow();
      stopTimelineAudioNow();
    }
    return decision;
  }, [
    animationModule,
    onLessonHostRequest,
    pauseTimelineNow,
    stopTimelineAudioNow,
  ]);
  const rendererLessonHostRequest =
    onLessonHostRequest && animationModule?.lessonHost?.capabilities.length
      ? handleRendererLessonHostRequest
      : undefined;
  if (loaded.failed) return <p className="runtime-unavailable">{labels.unavailable}</p>;
  if (!animationModule || !context || !runtimeMetadata || !frameDomain || !activeMovie || !playbackContext || !state) return <p aria-live="polite" className="runtime-unavailable">{labels.loading}</p>;
  const Renderer = animationModule.Renderer;
  const onReplay = () => {
    setReplay((value) => value + 1);
    onReplayCallback?.();
  };
  if (captureIdentityFailure) {
    return <p
      aria-live="assertive"
      className="runtime-unavailable"
      data-capture-identity-error={captureIdentityFailure}
      data-capture-identity-status="blocked"
      data-render-state="blocked"
      role="alert"
    >
      Deterministic capture identity is incomplete, invalid, or inconsistent.
    </p>;
  }
  if (!rendererDomainSupported) {
    return <p
      className="runtime-unavailable"
      data-runtime-domain-error="renderer-state-domain-mismatch"
      data-requested-frame-domain={playbackContext.frameDomain}
    >
      The module cannot render the requested source timeline domain.
    </p>;
  }
  const rendererKey = `${replay}:${seekRevision}:${playbackContext.frameDomain}:${playbackContext.lang}:${playbackContext.scenario}:${playbackContext.seed}:${playbackContext.requirementId}:${playbackContext.traceId}:${playbackContext.entryStateSha256}`;
  const compatibleLoadedSwfHostAsset =
    loadedSwfHostAsset?.sourceProvenLanguage === playbackContext.lang
      ? loadedSwfHostAsset
      : undefined;
  return <div className={`runtime-shell${capture ? ' runtime-shell--capture' : ''}`} data-audio-available={audioAvailable ? 'true' : 'false'} data-host-audio-timeline-paused={hostAudioPaused ? 'true' : 'false'} data-runtime-paused={paused ? 'true' : 'false'} data-runtime-presentation={presentation} data-runtime-replay={replay} data-runtime-transport={transportEnabledForDomain ? 'visual-frame-inspector' : 'none'} data-runtime-volume={Math.max(0, Math.min(1, volume))} data-source-transport-parity="not-established" style={{'--flash-stage-width': `${runtimeMetadata.stage.width}px`, '--flash-stage-height': `${runtimeMetadata.stage.height}px`, '--flash-stage-aspect': `${runtimeMetadata.stage.width} / ${runtimeMetadata.stage.height}`} as CSSProperties}>
    {presentation === 'legacy-shell'
      ? <div className="runtime-toolbar runtime-toolbar--legacy-audio">
          <div className="runtime-toolbar__actions">
            <HostAudioControls disabled={capture || context.captureFrame !== undefined || paused} fallbackCue={autoplayBlockedCue} frameDomain={playbackContext.frameDomain} key={`${animationModule.key}:${context.lang}:${playbackContext.frameDomain}:${context.scenario}:${context.seed}:${autoplayBlockedCue?.id ?? ''}:${capture}:${context.captureFrame !== undefined}:${replay}`} lang={context.lang} module={animationModule} onTimelinePauseChange={onHostAudioTimelinePauseChange} volume={volume} />
          </div>
        </div>
      : <div className="runtime-toolbar">{presentation === 'workbench' ? <div><span className="prototype-badge">{labels.prototype}</span><span>{runtimeMetadata.stage.width} × {runtimeMetadata.stage.height}</span><span>{runtimeMetadata.fps} FPS</span><span>{runtimeMetadata.frameCount} root frames</span>{playbackContext.frameDomain !== 'root' ? <span>{playbackContext.frameDomain}: {activeMovie.frameCount} frames</span> : null}</div> : <div><span className="prototype-badge">{labels.prototype}</span></div>}<div className="runtime-toolbar__actions"><HostAudioControls disabled={capture || context.captureFrame !== undefined || paused} fallbackCue={autoplayBlockedCue} frameDomain={playbackContext.frameDomain} key={`${animationModule.key}:${context.lang}:${playbackContext.frameDomain}:${context.scenario}:${context.seed}:${autoplayBlockedCue?.id ?? ''}:${capture}:${context.captureFrame !== undefined}:${replay}`} lang={context.lang} module={animationModule} onTimelinePauseChange={onHostAudioTimelinePauseChange} volume={volume} /><button data-replay-keyboard="enter-space" disabled={context.captureFrame !== undefined} onClick={onReplay} onKeyDown={(event) => {if (event.key === ' ' || event.code === 'Space') event.preventDefault();}} onKeyUp={(event) => {if (event.key === ' ' || event.code === 'Space') {event.preventDefault(); onReplay();}}} type="button">{labels.replay}</button></div></div>}
    {reduced === true && context.captureFrame === undefined ? <p className="reduced-motion-note" role="status">{labels.reduced}</p> : null}
    <div className="runtime-stage" data-animation-id={animationId} data-animation-module={animationModule.key} data-capture-identity-status={capture ? 'verified' : undefined} data-flash-entry-state-sha256={playbackContext.entryStateSha256 || undefined} data-flash-frame={playbackContext.frame} data-flash-frame-domain={playbackContext.frameDomain} data-flash-lang={playbackContext.lang} data-flash-requirement-id={playbackContext.requirementId} data-flash-root-frame={playbackContext.rootFrame} data-flash-scenario={playbackContext.scenario} data-flash-seed={playbackContext.seed} data-flash-trace-id={playbackContext.traceId} data-loaded-swf-host-composite={compatibleLoadedSwfHostAsset && presentation === 'legacy-shell' ? 'true' : 'false'} data-runtime-language={playbackContext.lang} data-runtime-scenario={playbackContext.scenario} data-runtime-seed={playbackContext.seed}>
      {compatibleLoadedSwfHostAsset && presentation === 'legacy-shell'
        ? <LoadedSwfHostCanvas
            animationId={animationId}
            asset={compatibleLoadedSwfHostAsset}
            entryStateSha256={playbackContext.entryStateSha256}
            frame={playbackContext.frame}
            frameDomain={playbackContext.frameDomain}
            height={runtimeMetadata.stage.height}
            key={`loaded-swf-host:${rendererKey}`}
            lang={playbackContext.lang}
            requirementId={playbackContext.requirementId}
            rootFrame={playbackContext.rootFrame}
            scenario={playbackContext.scenario}
            seed={playbackContext.seed}
            traceId={playbackContext.traceId}
            width={runtimeMetadata.stage.width}
          />
        : <Renderer entryStateSha256={playbackContext.entryStateSha256} frame={playbackContext.frame} frameDomain={playbackContext.frameDomain} key={rendererKey} lang={playbackContext.lang} onLessonHostRequest={rendererLessonHostRequest} onReplay={onReplay} pageInteractionCompanionTargetId={pageInteractionCompanionTargetId} paused={paused || hostAudioPaused} reducedMotion={reduced === true} replay={playbackContext.replay} requirementId={playbackContext.requirementId} rootFrame={playbackContext.rootFrame} scenario={playbackContext.scenario} seed={playbackContext.seed} state={state} traceId={playbackContext.traceId} uiLanguage={uiLanguage ?? playbackContext.lang} />}
    </div>
  </div>;
}
