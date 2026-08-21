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
  createMemoryOnlyLessonHost,
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
import {useCallback, useEffect, useMemo, useRef, useState, type CSSProperties} from 'react';
import {
  LoadedSwfHostCanvas,
  type LoadedSwfHostAsset,
} from './loaded-swf-host-canvas';
export type AnimationRuntimeQuery = {frame?: string; frameDomain?: string; scenario?: string; lang?: string; seed?: string; requirementId?: string; trace?: string; entryStateSha256?: string; capture?: string; duplicateCaptureIdentity?: boolean};
/**
 * Narration is the lesson for a language learner, so the host renders a
 * permanent control for it instead of surfacing a button only when a browser
 * refuses autoplay. These are every state that control has to read back:
 *
 * - `unavailable`: this page carries no narration at all.
 * - `waiting`: narration exists but is bound to the timeline, so there is
 *   nothing the learner can start on demand right now.
 * - `idle`: narration exists and a track can be started on demand.
 * - `playing`: narration is sounding, from a timeline cue, track, or explicit
 *   in-page interaction.
 * - `interactive`: exact audio exists behind in-page controls rather than the
 *   shell's general narration button.
 * - `blocked`: the browser refused autoplay and is waiting for a gesture.
 */
export type AnimationRuntimeNarrationStatus =
  'unavailable' | 'waiting' | 'idle' | 'interactive' | 'playing' | 'blocked';
export interface AnimationRuntimePlaybackState {
  readonly audioAvailable: boolean;
  readonly frame: number;
  readonly frameCount: number;
  readonly frameDomain: string;
  readonly fps: number;
  readonly narration: AnimationRuntimeNarrationStatus;
  /**
   * Current playhead within the authored playback span, from 0 to 1.
   * This is intentionally separate from lesson/page completion. `null` keeps
   * capture, loading and unsupported renderer states fail-closed.
   */
  readonly playbackProgress: number | null;
  readonly seekAvailable: boolean;
  readonly stepFrames: number;
  readonly transportMode: 'none' | 'visual-frame-inspector';
}
export interface AnimationRuntimeSeekRequest {
  readonly frame: number;
  readonly requestId: number;
}
/**
 * Host to runtime narration command. It mirrors `AnimationRuntimeSeekRequest`:
 * the host owns the control, the runtime owns the audio elements, and a
 * monotonic `requestId` keeps a repeated action from replaying on re-render.
 */
export interface AnimationRuntimeNarrationRequest {
  readonly action: 'play' | 'stop';
  readonly requestId: number;
}
export const INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE:
AnimationRuntimePlaybackState = Object.freeze({
  audioAvailable: false,
  frame: 1,
  frameCount: 1,
  frameDomain: 'root',
  fps: 0,
  narration: 'unavailable',
  playbackProgress: null,
  seekAvailable: false,
  stepFrames: 0,
  transportMode: 'none',
});
type CaptureIdentityContext = Readonly<{frame: number; frameDomain: string; requirementId: string; traceId: string; entryStateSha256: string; scenario: string; lang: 'en' | 'es'; seed: number}>;
const stableCaptureId = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const canonicalPositiveInteger = /^[1-9]\d*$/;
const canonicalUnsignedInteger = /^(?:0|[1-9]\d*)$/;
const ignoreTimelinePauseChange: (paused: boolean) => void = () => undefined;
const ignoreAudioActivity: (sounding: boolean) => void = () => undefined;
type RuntimeAudioCue = AnimationModule['audioCues'][number];
type InteractiveAudioAsset =
  NonNullable<AnimationModule['interactiveAudioAssets']>[number];

export function isExactInteractiveAudioAsset(
  asset: InteractiveAudioAsset,
): boolean {
  const separator = asset.source.indexOf('?');
  const pathname = separator === -1
    ? asset.source
    : asset.source.slice(0, separator);
  const query = separator === -1
    ? ''
    : asset.source.slice(separator + 1);
  return /^[a-f0-9]{64}$/.test(asset.sha256) &&
    pathname.startsWith('/flash-assets/') &&
    query === `sha256=${asset.sha256}` &&
    isSameOriginAssetSource(asset.source);
}

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
  if (
    request.type === 'record-practice-feedback' ||
    request.type === 'reset-practice-feedback'
  ) {
    return 'practice-feedback';
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
 * A standalone animation route has no lesson shell, so it may supply only the
 * one host capability that the runtime can execute entirely inside this
 * component: exact interactive audio. Requiring an audio-only declaration
 * keeps the presence of the generic renderer callback from enabling glossary,
 * navigation, scoring, or any other lesson-host surface on direct routes.
 */
export function moduleSupportsDirectRuntimeAudioHost(
  module: AnimationModule | undefined,
  audioEnabled: boolean,
  interactiveAudioAssetCount: number,
): boolean {
  const capabilities = module?.lessonHost?.capabilities ?? [];
  return audioEnabled &&
    interactiveAudioAssetCount > 0 &&
    capabilities.length === 1 &&
    capabilities[0] === 'audio';
}

/**
 * A page has finished playing once its authored timeline reaches its end
 * frame. That is the last frame of the first pass, so a looping page reports
 * completion once instead of never.
 *
 * Two cases have nothing to play and are finished the moment they render: a
 * reduced-motion device, which holds a single authored frame, and a movie with
 * no live frame rate. Neither should cost a learner their progress.
 *
 * A page that has not rendered, cannot render its requested domain, or is
 * frozen at a deterministic capture frame reports nothing.
 */
export function playbackReachedEnd({
  captureFrame,
  fps,
  frame,
  playbackEndFrame,
  reducedMotion,
  rendererDomainSupported,
}: Readonly<{
  captureFrame: number | undefined;
  fps: number;
  frame: number;
  playbackEndFrame: number;
  reducedMotion: boolean | undefined;
  rendererDomainSupported: boolean;
}>): boolean {
  if (!rendererDomainSupported) return false;
  if (captureFrame !== undefined) return false;
  if (reducedMotion === undefined) return false;
  if (reducedMotion) return true;
  return !fps || frame >= playbackEndFrame;
}

export function resolveAnimationPlaybackProgress({
  capture,
  fps,
  frame,
  playbackEndFrame,
  reducedMotion,
  rendererDomainSupported,
}: Readonly<{
  capture: boolean;
  fps: number;
  frame: number;
  playbackEndFrame: number;
  reducedMotion: boolean | undefined;
  rendererDomainSupported: boolean;
}>): number | null {
  if (capture || !rendererDomainSupported || reducedMotion === undefined) {
    return null;
  }
  if (reducedMotion || !fps || playbackEndFrame <= 1) return 1;
  const clampedFrame = Math.min(
    playbackEndFrame,
    Math.max(1, Math.trunc(frame)),
  );
  return (clampedFrame - 1) / (playbackEndFrame - 1);
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

function useAudio(module: AnimationModule | undefined, frame: number, fps: number, frameDomain: string, lang: 'en' | 'es', enabled: boolean, replay: number, scenario: string, seed: number, volume: number, onAutoplayBlocked: (cue: RuntimeAudioCue | null) => void, onSounding: (sounding: boolean) => void = ignoreAudioActivity) {
  const active = useRef<Map<string, HTMLAudioElement>>(new Map()), previous = useRef(0);
  const explicitlyStopped = useRef(false);
  const safeVolume = Math.max(0, Math.min(1, volume));
  // The host narration control reads timeline cues back as playback state, so
  // every path that adds to or drains `active` has to report the new count.
  const reportSounding = useCallback(() => {
    onSounding(active.current.size > 0);
  }, [onSounding]);
  const stopActive = useCallback(() => {
    onAutoplayBlocked(null);
    for (const audio of active.current.values()) {
      audio.pause();
      audio.currentTime = 0;
    }
    active.current.clear();
    previous.current = 0;
    reportSounding();
  }, [onAutoplayBlocked, reportSounding]);
  // A shell Stop command is a learner decision for this playback identity,
  // not a one-frame pause. Without this latch, resetting `previous` to zero
  // makes the next animation frame re-enter the same long-running cue at an
  // offset and the audio appears to ignore Stop. Replay, page/language/domain
  // changes, and pause/resume create a new identity and clear the latch.
  const stopNow = useCallback(() => {
    explicitlyStopped.current = true;
    stopActive();
  }, [stopActive]);
  useEffect(() => {
    explicitlyStopped.current = false;
    stopActive();
    return stopActive;
  }, [module, enabled, frameDomain, lang, replay, scenario, seed, stopActive]);
  useEffect(() => {
    for (const audio of active.current.values()) audio.volume = safeVolume;
  }, [safeVolume]);
  useEffect(() => {
    if (!module || !enabled) return;
    if (explicitlyStopped.current) {
      previous.current = frame;
      return;
    }
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
      const done = () => {
        if (active.current.get(cue.id) === audio) active.current.delete(cue.id);
        reportSounding();
      };
      audio.addEventListener('ended', done, {once: true});
      audio.addEventListener('error', done, {once: true});
      void audio.play().then(
        () => {
          if (active.current.get(cue.id) !== audio) return;
          onAutoplayBlocked(null);
          reportSounding();
        },
        (error: unknown) => {
          if (active.current.get(cue.id) !== audio) return;
          done();
          if (error instanceof DOMException && error.name === 'NotAllowedError') {
            onAutoplayBlocked(cue);
          }
        }
      );
    }
    reportSounding();
  }, [module, enabled, frame, fps, frameDomain, lang, scenario, seed, safeVolume, onAutoplayBlocked, reportSounding]);
  return {stopNow};
}

type HostAudioTrack = NonNullable<AnimationModule['audioTracks']>[number];
interface HostAudioTracksOptions {
  module: AnimationModule | undefined;
  lang: 'en' | 'es';
  frameDomain?: string;
  fallbackCue?: RuntimeAudioCue | null;
  disabled?: boolean;
  onTimelinePauseChange?: (paused: boolean) => void;
  volume?: number;
}

/**
 * Owns the on-demand narration elements. It is a hook rather than component
 * state because two hosts drive the same tracks: the runtime toolbar's own
 * buttons, and a lesson shell that renders the narration control in its top
 * bar and commands playback through `narrationRequest`.
 */
function useHostAudioTracks({module, lang, frameDomain = 'root', fallbackCue = null, disabled = false, onTimelinePauseChange = ignoreTimelinePauseChange, volume = 1}: HostAudioTracksOptions) {
  const active = useRef<{
    audio: HTMLAudioElement;
    identity: string;
    pausesTimeline: boolean;
  } | null>(null);
  // A track belongs to exactly one page, language, and frame domain. Stamping
  // what is playing with that identity means moving to another page reports
  // silence by derivation, with no reset to run and no window in which the new
  // page inherits the old one's playing state.
  const identity = JSON.stringify([module?.key ?? '', lang, frameDomain, disabled, fallbackCue?.id ?? '']);
  const [playingTrack, setPlayingTrack] =
    useState<{identity: string; trackId: string} | null>(null);
  const playing = playingTrack?.identity === identity
    ? playingTrack.trackId
    : null;
  const safeVolume = Math.max(0, Math.min(1, volume));
  const tracks = useMemo(() => {
    const explicitTracks = (module?.audioTracks ?? []).filter(
      (track) => track.visibleWhen.includes(lang) && (!track.frameDomains || track.frameDomains.includes(frameDomain))
    );
    // Browsers may reject source-faithful autoplay until the learner interacts
    // with the page. Expose only the exact cue whose play() attempt was blocked.
    return explicitTracks.length === 0
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
  }, [module, lang, frameDomain, fallbackCue]);
  const stop = useCallback(() => {
    const current = active.current;
    active.current = null;
    setPlayingTrack(null);
    if (!current) return;
    current.audio.pause();
    current.audio.currentTime = 0;
    if (current.pausesTimeline) onTimelinePauseChange(false);
  }, [onTimelinePauseChange]);
  // Retire both the element and state owned by the prior identity. Ownership
  // checks keep a late cleanup from stopping or clearing a newer play.
  useEffect(() => {
    const retiringIdentity = identity;
    return () => {
      setPlayingTrack((current) =>
        current?.identity === retiringIdentity ? null : current
      );
      const current = active.current;
      if (!current || current.identity !== retiringIdentity) return;
      active.current = null;
      current.audio.pause();
      current.audio.currentTime = 0;
      if (current.pausesTimeline) onTimelinePauseChange(false);
    };
  }, [identity, onTimelinePauseChange]);
  useEffect(() => {
    if (active.current) active.current.audio.volume = safeVolume;
  }, [safeVolume]);
  const play = useCallback((track: HostAudioTrack) => {
    if (disabled || !isSameOriginAssetSource(track.source)) return;
    const prior = active.current;
    prior?.audio.pause();
    if (prior) prior.audio.currentTime = 0;
    if (prior?.pausesTimeline) onTimelinePauseChange(false);
    const audio = new Audio(track.source);
    audio.volume = safeVolume;
    const pausesTimeline = track.timelineBehavior === 'pause-while-playing';
    active.current = {audio, identity, pausesTimeline};
    if (pausesTimeline) onTimelinePauseChange(true);
    const done = () => {
      if (active.current?.audio !== audio) return;
      active.current = null;
      if (pausesTimeline) onTimelinePauseChange(false);
      setPlayingTrack((current) =>
        current?.identity === identity && current.trackId === track.id
          ? null
          : current
      );
    };
    audio.addEventListener('ended', done, {once: true});
    audio.addEventListener('error', done, {once: true});
    setPlayingTrack({identity, trackId: track.id});
    void audio.play().catch(done);
  }, [disabled, identity, onTimelinePauseChange, safeVolume]);
  const toggle = useCallback((track: HostAudioTrack) => {
    if (disabled || !isSameOriginAssetSource(track.source)) return;
    if (playing === track.id && active.current) {
      stop();
      return;
    }
    play(track);
  }, [disabled, play, playing, stop]);
  return {play, playing, stop, toggle, tracks};
}

interface InteractiveAudioOptions {
  readonly disabled?: boolean;
  readonly lang: 'en' | 'es';
  readonly module: AnimationModule | undefined;
  readonly replay: number;
  readonly volume?: number;
}

/**
 * Executes only exact, hash-bound, same-origin assets declared by the loaded
 * module. Renderers can address these elements only after the typed lesson
 * host has allowed their `play-audio` or `stop-audio` request.
 */
function useInteractiveAudioAssets({
  disabled = false,
  lang,
  module,
  replay,
  volume = 1,
}: InteractiveAudioOptions) {
  const active = useRef<{
    asset: InteractiveAudioAsset;
    audio: HTMLAudioElement;
    identity: string;
  } | null>(null);
  const identity = `${module?.key ?? ''}:${lang}:${replay}:${disabled}`;
  const [playingState, setPlayingState] = useState<{
    identity: string;
    assetId: string;
  } | null>(null);
  const playing = playingState?.identity === identity
    ? playingState.assetId
    : null;
  const safeVolume = Math.max(0, Math.min(1, volume));
  const assets = useMemo(
    () => Object.freeze(
      (module?.interactiveAudioAssets ?? []).filter(
        (asset) =>
          asset.language === lang && isExactInteractiveAudioAsset(asset),
      ),
    ),
    [lang, module],
  );
  const stop = useCallback((assetId?: string) => {
    const current = active.current;
    if (!current || (assetId !== undefined && current.asset.id !== assetId)) {
      return;
    }
    active.current = null;
    current.audio.pause();
    current.audio.currentTime = 0;
    setPlayingState(null);
  }, []);
  useEffect(() => {
    const retiringIdentity = identity;
    return () => {
      setPlayingState((current) =>
        current?.identity === retiringIdentity ? null : current
      );
      const current = active.current;
      if (!current || current.identity !== retiringIdentity) return;
      active.current = null;
      current.audio.pause();
      current.audio.currentTime = 0;
    };
  }, [identity]);
  useEffect(() => {
    if (active.current) active.current.audio.volume = safeVolume;
  }, [safeVolume]);
  const play = useCallback((assetId: string) => {
    if (disabled) return false;
    const asset = assets.find((candidate) => candidate.id === assetId);
    if (!asset) return false;
    const prior = active.current;
    if (prior) {
      prior.audio.pause();
      prior.audio.currentTime = 0;
    }
    const audio = new Audio(asset.source);
    audio.volume = safeVolume;
    active.current = {asset, audio, identity};
    setPlayingState({identity, assetId: asset.id});
    const done = () => {
      if (active.current?.audio !== audio) return;
      active.current = null;
      setPlayingState((current) =>
        current?.identity === identity && current.assetId === asset.id
          ? null
          : current,
      );
    };
    audio.addEventListener('ended', done, {once: true});
    audio.addEventListener('error', done, {once: true});
    void audio.play().catch(done);
    return true;
  }, [assets, disabled, identity, safeVolume]);
  return {assets, play, playing, stop};
}

function HostAudioControlsView({disabled, lang, playing, toggle, tracks}: {disabled: boolean; lang: 'en' | 'es'; playing: string | null; toggle: (track: HostAudioTrack) => void; tracks: readonly HostAudioTrack[]}) {
  if (!tracks.length) return null;
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

export function HostAudioControls(options: HostAudioTracksOptions & {module: AnimationModule}) {
  const {playing, toggle, tracks} = useHostAudioTracks(options);
  return <HostAudioControlsView
    disabled={options.disabled ?? false}
    lang={options.lang}
    playing={playing}
    toggle={toggle}
    tracks={tracks}
  />;
}

export function AnimationRuntime({
  audioEnabled = true,
  audioLanguage,
  animationId,
  moduleKey,
  query,
  labels,
  loadedSwfHostAsset,
  narrationRequest,
  onLessonHostRequest,
  onPlaybackComplete,
  onReplay: onReplayCallback,
  onPlaybackStateChange,
  pageInteractionCompanionTargetId,
  pageInteractionStageTargetId,
  paused = false,
  seekRequest,
  presentation = 'workbench',
  uiLanguage,
  volume = 1,
}: {
  audioEnabled?: boolean;
  audioLanguage?: AnimationRendererProps['lang'];
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
  narrationRequest?: AnimationRuntimeNarrationRequest | null;
  onLessonHostRequest?: AnimationRendererProps['onLessonHostRequest'];
  onPlaybackComplete?: () => void;
  onReplay?: () => void;
  onPlaybackStateChange?: (state: AnimationRuntimePlaybackState) => void;
  pageInteractionCompanionTargetId?: string;
  pageInteractionStageTargetId?: string;
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
  const [timelineAudioSounding, setTimelineAudioSounding] = useState(false);
  const animationModule = loaded.key === moduleKey ? loaded.module : undefined;
  // Keep visual/runtime identity intact while stripping every audio declaration
  // from the executable path when the server publication gate is closed.
  const audioModule = audioEnabled ? animationModule : undefined;
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
  const resolvedAudioLanguage = audioLanguage ?? context?.lang ?? 'en';
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
        lang: resolvedAudioLanguage,
        scenario: context.scenario,
        seed: context.seed,
      }
    : null;
  const audioAvailable = Boolean(
    audioModule &&
      audioContext &&
      (
        audioModule.audioCues.some((cue) =>
          isSameOriginAssetSource(cue.source) &&
            audioCueMatchesContext(cue, audioContext)) ||
        audioModule.audioTracks?.some((track) =>
          isSameOriginAssetSource(track.source) &&
            track.visibleWhen.includes(audioContext.lang) &&
            (!track.frameDomains ||
              track.frameDomains.includes(audioContext.frameDomain))) ||
        audioModule.interactiveAudioAssets?.some((asset) =>
          asset.language === audioContext.lang &&
            isExactInteractiveAudioAsset(asset))
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
  const resolvedPlaybackEndFrame = activeMovie
    ? resolvePlaybackEndFrame(activeMovie, playbackEndFrame)
    : 1;
  const playbackProgress = resolveAnimationPlaybackProgress({
    capture: capture || context?.captureFrame !== undefined,
    fps: activeMovie?.fps ?? 0,
    frame,
    playbackEndFrame: resolvedPlaybackEndFrame,
    reducedMotion: reduced,
    rendererDomainSupported,
  });
  const captureIdentityFailure = playbackContext
    ? strictCaptureIdentityFailure(
        query,
        playbackContext,
        state,
        moduleKey === 'course-g04-l03-ts-006'
      )
    : null;
  // Reduced motion deliberately holds the visual timeline on one authored
  // frame, so an automatic timeline cue can never become reachable. Preserve
  // access to the same exact, context-matched source asset as an on-demand
  // track instead of reporting audio that the learner cannot start.
  const reducedMotionManualCue = reduced === true && audioModule && audioContext
    ? audioModule.audioCues.find((cue) =>
        isSameOriginAssetSource(cue.source) &&
          audioCueMatchesContext(cue, audioContext)
      ) ?? null
    : null;
  const currentAutoplayBlockedCue = autoplayBlockedCue && audioModule && audioContext
    && audioModule.audioCues.some((cue) =>
      cue.id === autoplayBlockedCue.id
      && cue.source === autoplayBlockedCue.source
      && audioCueMatchesContext(cue, audioContext)
    )
    ? autoplayBlockedCue
    : null;
  const {stopNow: stopTimelineAudioNow} = useAudio(audioModule, frame, activeMovie?.fps ?? 1, context?.frameDomain ?? 'root', resolvedAudioLanguage, running && !capture && rendererDomainSupported, replay, context?.scenario ?? 'default', context?.seed ?? 0, volume, setAutoplayBlockedCue, setTimelineAudioSounding);
  const narrationDisabled = capture ||
    context?.captureFrame !== undefined ||
    paused;
  const {
    play: playNarrationTrack,
    playing: playingNarrationTrackId,
    stop: stopNarrationTrack,
    toggle: toggleNarrationTrack,
    tracks: narrationTracks,
  } = useHostAudioTracks({
    disabled: narrationDisabled,
    fallbackCue: currentAutoplayBlockedCue ?? reducedMotionManualCue,
    frameDomain: playbackContext?.frameDomain ?? 'root',
    lang: resolvedAudioLanguage,
    module: audioModule,
    onTimelinePauseChange: onHostAudioTimelinePauseChange,
    volume,
  });
  const {
    assets: interactiveAudioAssets,
    play: playInteractiveAudio,
    playing: playingInteractiveAudioId,
    stop: stopInteractiveAudio,
  } = useInteractiveAudioAssets({
    disabled: narrationDisabled,
    lang: resolvedAudioLanguage,
    module: audioModule,
    replay,
    volume,
  });
  const directRendererAudioHostAvailable = !onLessonHostRequest &&
    moduleSupportsDirectRuntimeAudioHost(
      animationModule,
      audioEnabled,
      interactiveAudioAssets.length,
    );
  const directAudioLessonHostIdentity = JSON.stringify([
    animationId,
    resolvedAudioLanguage,
  ]);
  const directAudioLessonHost = useMemo(() => {
    const [currentAnimationId, initialLanguage] = JSON.parse(
      directAudioLessonHostIdentity,
    ) as [string, 'en' | 'es'];
    return createMemoryOnlyLessonHost({
      releaseId: 'direct-runtime-audio',
      releaseMemberIds: [currentAnimationId],
      currentAnimationId,
      enabledCapabilities: ['audio'],
      initialLanguage,
      mode: 'audit',
      releasePublished: false,
    });
  }, [directAudioLessonHostIdentity]);
  const narrationSounding = timelineAudioSounding ||
    playingNarrationTrackId !== null ||
    playingInteractiveAudioId !== null;
  // A refused cue stays on the module for as long as the page is open, because
  // it is what the manual track is built from. A request on this page is the
  // gesture the browser was holding out for, so once one exists the control
  // stops asking and becomes an ordinary play/stop toggle. The host clears the
  // request when it changes page, which resets this with it: a new page makes
  // its own autoplay attempt, and the last page's refusal says nothing about it.
  const narrationGestureGiven = narrationRequest !== null;
  const narration: AnimationRuntimeNarrationStatus = !audioAvailable
    ? 'unavailable'
    : narrationSounding
      ? 'playing'
      : currentAutoplayBlockedCue && !narrationGestureGiven
        ? 'blocked'
        : narrationTracks.length > 0
          ? 'idle'
          : interactiveAudioAssets.length > 0
            ? 'interactive'
            : 'waiting';
  const lastNarrationRequestRef = useRef(0);
  useEffect(() => {
    if (
      !narrationRequest ||
      narrationRequest.requestId === lastNarrationRequestRef.current
    ) {
      return;
    }
    lastNarrationRequestRef.current = narrationRequest.requestId;
    if (narrationRequest.action === 'stop') {
      stopNarrationTrack();
      stopInteractiveAudio();
      stopTimelineAudioNow();
      return;
    }
    const track = narrationTracks[0];
    if (!track) return;
    if (playingNarrationTrackId === track.id) {
      toggleNarrationTrack(track);
      return;
    }
    playNarrationTrack(track);
  }, [
    narrationRequest,
    narrationTracks,
    playNarrationTrack,
    playingNarrationTrackId,
    stopNarrationTrack,
    stopInteractiveAudio,
    stopTimelineAudioNow,
    toggleNarrationTrack,
  ]);
  useEffect(() => {
    onPlaybackStateChange?.({
      audioAvailable,
      frame,
      frameCount: reportedFrameCount,
      frameDomain: frameDomain?.id ?? 'root',
      fps: activeMovie?.fps ?? 0,
      narration,
      playbackProgress,
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
    narration,
    onPlaybackStateChange,
    playbackProgress,
    reportedFrameCount,
    seekAvailable,
    transport?.stepFrames,
    transportEnabledForDomain,
  ]);
  const handleRendererLessonHostRequest = useCallback<
    NonNullable<AnimationRendererProps['onLessonHostRequest']>
  >((request, hostContext) => {
    if (
      !audioEnabled
      && (request.type === 'play-audio' || request.type === 'stop-audio')
    ) {
      return undefined;
    }
    if (!moduleDeclaresLessonHostRequest(animationModule, request)) {
      return undefined;
    }
    if (
      request.type === 'play-audio' &&
      (narrationDisabled ||
        !interactiveAudioAssets.some((asset) => asset.id === request.cueId))
    ) {
      return undefined;
    }
    if (
      request.type === 'stop-audio' &&
      request.cueId !== undefined &&
      !interactiveAudioAssets.some((asset) => asset.id === request.cueId)
    ) {
      return undefined;
    }
    const decision = onLessonHostRequest
      ? onLessonHostRequest(request, hostContext)
      : directRendererAudioHostAvailable &&
          (request.type === 'play-audio' || request.type === 'stop-audio')
        ? directAudioLessonHost.dispatch(request)
        : undefined;
    if (decision?.status === 'allowed' && request.type === 'play-audio') {
      playInteractiveAudio(request.cueId);
    }
    if (decision?.status === 'allowed' && request.type === 'stop-audio') {
      stopInteractiveAudio(request.cueId);
    }
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
    audioEnabled,
    animationModule,
    directAudioLessonHost,
    directRendererAudioHostAvailable,
    interactiveAudioAssets,
    narrationDisabled,
    onLessonHostRequest,
    pauseTimelineNow,
    playInteractiveAudio,
    stopInteractiveAudio,
    stopTimelineAudioNow,
  ]);
  const rendererLessonHostRequest =
    (onLessonHostRequest || directRendererAudioHostAvailable) &&
      animationModule?.lessonHost?.capabilities.length
      ? handleRendererLessonHostRequest
      : undefined;
  const playbackComplete = Boolean(
    animationModule &&
      activeMovie &&
      !captureIdentityFailure &&
      playbackReachedEnd({
        captureFrame: context?.captureFrame,
        fps: activeMovie.fps,
        frame: liveFrame,
        playbackEndFrame: resolvePlaybackEndFrame(
          activeMovie,
          playbackEndFrame,
        ),
        reducedMotion: reduced,
        rendererDomainSupported,
      }),
  );
  const completionIdentity = `${playbackIdentity}:${replay}`;
  const reportedCompletionRef = useRef<string | null>(null);
  useEffect(() => {
    if (!playbackComplete) return;
    if (reportedCompletionRef.current === completionIdentity) return;
    reportedCompletionRef.current = completionIdentity;
    onPlaybackComplete?.();
  }, [completionIdentity, onPlaybackComplete, playbackComplete]);
  if (loaded.failed) return <p className="runtime-unavailable">{labels.unavailable}</p>;
  if (!animationModule || !context || !runtimeMetadata || !frameDomain || !activeMovie || !playbackContext || !state) return <p aria-live="polite" className="runtime-unavailable">{labels.loading}</p>;
  const Renderer = animationModule.Renderer;
  const onReplay = () => {
    stopNarrationTrack();
    stopInteractiveAudio();
    stopTimelineAudioNow();
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
  return <div className={`runtime-shell${capture ? ' runtime-shell--capture' : ''}`} data-audio-available={audioAvailable ? 'true' : 'false'} data-host-audio-timeline-paused={hostAudioPaused ? 'true' : 'false'} data-interactive-audio-playing={playingInteractiveAudioId ?? undefined} data-product-audio-enabled={audioEnabled ? 'true' : 'false'} data-runtime-audio-language={resolvedAudioLanguage} data-runtime-playback-complete={playbackComplete ? 'true' : 'false'} data-runtime-paused={paused ? 'true' : 'false'} data-runtime-presentation={presentation} data-runtime-replay={replay} data-runtime-transport={transportEnabledForDomain ? 'visual-frame-inspector' : 'none'} data-runtime-volume={Math.max(0, Math.min(1, volume))} data-source-transport-parity="not-established" style={{'--flash-stage-width': `${runtimeMetadata.stage.width}px`, '--flash-stage-height': `${runtimeMetadata.stage.height}px`, '--flash-stage-aspect': `${runtimeMetadata.stage.width} / ${runtimeMetadata.stage.height}`} as CSSProperties}>
    {/* The lesson shell owns narration: it renders a permanent, designed
        control in its top bar and drives these same tracks through
        `narrationRequest`, so the runtime adds no floating button of its own. */}
    {presentation === 'legacy-shell'
      ? null
      : <div className="runtime-toolbar">{presentation === 'workbench' ? <div><span className="prototype-badge">{labels.prototype}</span><span>{runtimeMetadata.stage.width} × {runtimeMetadata.stage.height}</span><span>{runtimeMetadata.fps} FPS</span><span>{runtimeMetadata.frameCount} root frames</span>{playbackContext.frameDomain !== 'root' ? <span>{playbackContext.frameDomain}: {activeMovie.frameCount} frames</span> : null}</div> : <div><span className="prototype-badge">{labels.prototype}</span></div>}<div className="runtime-toolbar__actions"><HostAudioControlsView disabled={narrationDisabled} lang={resolvedAudioLanguage} playing={playingNarrationTrackId} toggle={toggleNarrationTrack} tracks={narrationTracks} /><button data-replay-keyboard="enter-space" disabled={context.captureFrame !== undefined} onClick={onReplay} onKeyDown={(event) => {if (event.key === ' ' || event.code === 'Space') event.preventDefault();}} onKeyUp={(event) => {if (event.key === ' ' || event.code === 'Space') {event.preventDefault(); onReplay();}}} type="button">{labels.replay}</button></div></div>}
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
        : <Renderer activeInteractiveAudioId={playingInteractiveAudioId} audioEnabled={audioEnabled} entryStateSha256={playbackContext.entryStateSha256} frame={playbackContext.frame} frameDomain={playbackContext.frameDomain} key={rendererKey} lang={playbackContext.lang} onLessonHostRequest={rendererLessonHostRequest} onReplay={onReplay} pageInteractionCompanionTargetId={pageInteractionCompanionTargetId} pageInteractionStageTargetId={pageInteractionStageTargetId} paused={paused || hostAudioPaused} reducedMotion={reduced === true} replay={playbackContext.replay} requirementId={playbackContext.requirementId} rootFrame={playbackContext.rootFrame} scenario={playbackContext.scenario} seed={playbackContext.seed} state={state} traceId={playbackContext.traceId} uiLanguage={uiLanguage ?? playbackContext.lang} />}
    </div>
  </div>;
}
