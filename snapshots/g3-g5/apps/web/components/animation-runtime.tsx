'use client';
import {g4L3InteractiveAudioLifecycle} from '../lib/g4-l3-fq002-audio-policy';
import {createInteractiveAudioController, type InteractiveAudioState} from '../lib/interactive-audio-controller';
import {
  loadAnimationModuleForPresentation,
  type AnimationModule,
  type AnimationRendererProps,
} from '@helpmath/demos/animation-registry';
import {matchPrototype} from '@helpmath/demos/prototype-manifest';
import {lessonTextActivityRequestAllowed, lessonTextFrameRequestAllowed} from '../../../packages/demos/src/lesson-text-frame-control';
import type {LessonTextActivityCancellation, LessonTextActivityDefinition, LessonTextButtonActivityRequest, LessonTextActivityRequest, LessonTextActivitySnapshot, LessonTextFrameTransition} from '../../../packages/demos/src/lesson-text-contract';
import {useLessonActivityAudio} from '../../../packages/demos/src/use-lesson-activity-audio';
import {useSourceAudioPreparation} from '../../../packages/demos/src/use-source-audio-preparation';
import {useLessonSourceClock} from '../../../packages/demos/src/use-lesson-source-clock';
import {boundedNarrationPlan, nextNarrationRange, type NarrationFrameRange} from '../../../packages/demos/src/lesson-manual-narration';
import {createSourceAudioMedia, type SourceAudioMedia} from '../../../packages/demos/src/source-pcm-audio';
import type {LessonPlaybackIdentity, HostAudioTrackEvent, LessonPlayCommand} from '../../../packages/demos/src/contract';
import {HostAudioTrackSession} from '../../../packages/demos/src/host-audio-track-session';
import {useLessonManualNarration} from '../../../packages/demos/src/use-lesson-manual-narration';
import {sourceActivityBlocksParent} from '../../../packages/demos/src/lesson-source-clock';
import {lessonTextKeyTermRequestAllowed} from '../../../packages/demos/src/lesson-text-keyterms';
import {lessonTextCompletionAllowed} from '../../../packages/demos/src/lesson-text-completion';
import {gs002GameStartAllowed, gs003EntryLevelAllowed, type GsGameRuntimeContext} from '../lib/g4-l8-gs002-handoff';
import {isLessonTypographyCandidateEnabled, lessonTypographyLanguages} from '@/lib/lesson-typography-policy';
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
import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties} from 'react';
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
 * - `paused`: a host track retains its position and intent while silent;
 *   its Stop action remains available.
 * - `interactive`: exact audio exists behind in-page controls rather than the
 *   shell's general narration button.
 * - `blocked`: the browser refused autoplay and is waiting for a gesture.
 */
export type AnimationRuntimeNarrationStatus =
  'unavailable' | 'waiting' | 'idle' | 'interactive' | 'playing' | 'paused' | 'blocked';
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
  readonly trackId?: string;
  readonly commandOrder?: number;
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
  if (request.type === 'play-audio' || request.type === 'stop-audio' || request.type === 'pause-audio' || request.type === 'resume-audio') {
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
  // Raw source requests require the modern button/frame gate, never a generic host declaration.
  if (request.type === 'open-keyterm-by-source-key') return false;
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


function useAudio(module: AnimationModule | undefined, frame: number, fps: number, frameDomain: string, lang: 'en' | 'es', enabled: boolean, replay: number, scenario: string, seed: number, volume: number, onAutoplayBlocked: (cue: RuntimeAudioCue | null) => void, onSounding: (sounding: boolean) => void = ignoreAudioActivity, preloadedPool?: Map<string, SourceAudioMedia>, terminal?: {identity:string;cueId:string;holdFrame:number}) {
  const active = useRef<Map<string, SourceAudioMedia>>(new Map()), previous = useRef(0);
  const terminalState=useRef({identity:terminal?.identity,started:false,consumed:false,resumeOffset:null as number|null});
  if(terminalState.current.identity!==terminal?.identity)terminalState.current={identity:terminal?.identity,started:false,consumed:false,resumeOffset:null as number|null};
  const liveTerminal=useRef({terminal,frame});liveTerminal.current={terminal,frame};
  const playGeneration=useRef(0),pendingPlays=useRef(new Set<string>()),listeners=useRef(new Map<string,()=>void>());
  const [,setTerminalRevision]=useState(0);
  const publishTerminal=useCallback(()=>setTerminalRevision(v=>v+1),[]);

  const prepared = useRef<Map<string, SourceAudioMedia>>(new Map());
  const explicitlyStopped = useRef(false);
  const [attemptRevision,setAttemptRevision] = useState(0);
  const [stopped,setStopped] = useState(false);
  const safeVolume = Math.max(0, Math.min(1, volume));
  // The host narration control reads timeline cues back as playback state, so
  // every path that adds to or drains `active` has to report the new count.
  const reportSounding = useCallback(() => {
    onSounding(active.current.size > 0);
  }, [onSounding]);
  const stopActive = useCallback(() => {
    playGeneration.current++;pendingPlays.current.clear();for(const cleanup of listeners.current.values())cleanup();listeners.current.clear();
    onAutoplayBlocked(null);
    for (const [cueId,audio] of active.current) {
      const live=liveTerminal.current,state=terminalState.current;
      if(live.terminal&&cueId===live.terminal.cueId&&state.identity===live.terminal.identity&&state.started&&!state.consumed&&live.frame>=live.terminal.holdFrame&&Number.isFinite(audio.currentTime))state.resumeOffset=Math.max(state.resumeOffset??0,audio.currentTime);
      audio.pause();
      audio.currentTime = 0;
    }
    active.current.clear();
    previous.current = 0;
    reportSounding();
  }, [onAutoplayBlocked, reportSounding]);
  // Fetch and validate this context's cues before their authored first frames.
  // A paused page keeps its decoded media; page/domain/language/Replay changes
  // release the pool and every AudioContext reference it owns.
  useEffect(() => {
    const pool = preloadedPool ?? new Map<string, SourceAudioMedia>(); prepared.current = pool;
    return () => {stopActive(); for (const media of pool.values()) {media.pause(); if (!preloadedPool) media.dispose?.();} if (prepared.current === pool) prepared.current = new Map();};
  }, [module, frameDomain, lang, replay, scenario, seed, stopActive, preloadedPool]);
  useEffect(() => {
    if (!enabled) return;
    for (const cue of module?.audioCues ?? []) {
      if (!isSameOriginAssetSource(cue.source) || !audioCueMatchesContext(cue, {frameDomain, lang, scenario, seed})) continue;
      let media = prepared.current.get(cue.id);
      if (!media) {media = preloadedPool ? createSourceAudioMedia(cue.source, cue.sha256) : new Audio(cue.source); media.preload = 'auto'; prepared.current.set(cue.id, media);}
      if (media.readyState === 0) media.load();
    }
  }, [module, enabled, frameDomain, lang, replay, scenario, seed, preloadedPool]);
  // A shell Stop command is a learner decision for this playback identity,
  // not a one-frame pause. Without this latch, resetting `previous` to zero
  // makes the next animation frame re-enter the same long-running cue at an
  // offset and the audio appears to ignore Stop. Replay, page/language/domain
  // changes, and pause/resume create a new identity and clear the latch.
  const stopNow = useCallback(() => {
    explicitlyStopped.current = true;
    setStopped(true);
    stopActive();
  }, [stopActive]);
  useEffect(() => {
    explicitlyStopped.current = false;
    setStopped(false);
    stopActive();
    return stopActive;
  }, [module, enabled, frameDomain, lang, replay, scenario, seed, stopActive, terminal?.identity]);
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
      active.current.delete(cueId);pendingPlays.current.delete(cueId);listeners.current.get(cueId)?.();listeners.current.delete(cueId);
    }
    for (const {cue, offsetSeconds} of transition.start) {
      if (!isSameOriginAssetSource(cue.source)) continue;
      if(terminal&&cue.id===terminal.cueId&&frame>=terminal.holdFrame&&(!terminalState.current.started||terminalState.current.consumed))continue;
      const prior = active.current.get(cue.id);
      if (prior) {prior.pause(); prior.currentTime = 0;}
      let audio = prepared.current.get(cue.id);
      if (!audio || audio.error) {
        audio?.dispose?.(); audio = preloadedPool ? createSourceAudioMedia(cue.source, cue.sha256) : new Audio(cue.source); prepared.current.set(cue.id, audio);
      }
      audio.volume = safeVolume;
      active.current.set(cue.id, audio);
      // Re-entering a cue at zero must explicitly reset a completed cached media.
      const generation=playGeneration.current,terminalIdentity=terminal?.identity;
      const isCurrent=()=>playGeneration.current===generation&&active.current.get(cue.id)===audio&&terminalState.current.identity===terminalIdentity;
      let cancelSeek=()=>{};
      const mediaOffset=terminal&&cue.id===terminal.cueId&&frame>=terminal.holdFrame?Math.max(offsetSeconds,terminalState.current.resumeOffset??0):offsetSeconds;
      try {audio.currentTime = mediaOffset;} catch {const ready=()=>{if(isCurrent())audio.currentTime=mediaOffset;};cancelSeek=()=>audio.removeEventListener('loadedmetadata',ready);audio.addEventListener('loadedmetadata',ready,{once:true});}
      pendingPlays.current.add(cue.id);
      const done = (ended=false) => {
        if(!isCurrent())return;
        if(ended&&terminal&&cue.id===terminal.cueId)terminalState.current.consumed=true;
        pendingPlays.current.delete(cue.id);active.current.delete(cue.id);
        listeners.current.get(cue.id)?.();listeners.current.delete(cue.id);
        reportSounding();if(terminal)publishTerminal();
      };
      const ended=()=>done(true),failed=()=>done(false);
      listeners.current.get(cue.id)?.();
      listeners.current.set(cue.id,()=>{cancelSeek();audio.removeEventListener('ended',ended);audio.removeEventListener('error',failed);});
      audio.addEventListener('ended', ended, {once: true});
      audio.addEventListener('error', failed, {once: true});
      void audio.play().then(
        () => {
          if (!isCurrent()) return;
          pendingPlays.current.delete(cue.id);
          if(terminal&&cue.id===terminal.cueId&&frame<terminal.holdFrame)terminalState.current.started=true;
          onAutoplayBlocked(null);
          reportSounding();
        },
        (error: unknown) => {
          if (!isCurrent()) return;
          done();
          if (error instanceof DOMException && error.name === 'NotAllowedError') {
            onAutoplayBlocked(cue);
          }
        }
      );
    }
    reportSounding();
  }, [module, enabled, frame, fps, frameDomain, lang, scenario, seed, safeVolume, onAutoplayBlocked, reportSounding, attemptRevision, preloadedPool, terminal?.identity, terminal?.cueId, terminal?.holdFrame, publishTerminal]);
  const retry=useCallback(()=>{
    if(!enabled||!module)return false;
    explicitlyStopped.current=false;setStopped(false);previous.current=0;setAttemptRevision(value=>value+1);return true;
  },[enabled,module]);
  const canStartManual=useCallback(()=>active.current.size===0&&pendingPlays.current.size===0,[]);
  return {stopNow,retry,stopped,canStartManual};
}

/** One synchronous source-clock transaction. Reading after the pause flush
 * catches an answer/Close accepted in this same event before React rendered it. */
export function retireObservedHostTrackActivities(options:{
  instances:readonly string[];
  definitions:readonly LessonTextActivityDefinition[];
  expectedSeekRevision:number;
  pause:()=>void;
  readCurrent:ReturnType<typeof useLessonSourceClock>['readCurrent'];
  cancel:ReturnType<typeof useLessonSourceClock>['cancelSourceActivity'];
  cancelMedia:(instances:readonly string[])=>number;
}){
  const {instances,definitions}=options;
  if(new Set(instances).size!==instances.length || instances.some(id=>!definitions.some(definition=>definition.sourceInstanceId===id)))return null;
  options.pause();
  const current=options.readCurrent();
  if(!current || current.seekRevision!==options.expectedSeekRevision)return null;
  const selected=current.activities.filter(activity=>activity.sourceInstanceId && instances.includes(activity.sourceInstanceId));
  if(selected.some(activity=>!activity.cancellationToken))return null;
  for(const activity of selected){
    if(!options.cancel({id:activity.id,sourceInstanceId:activity.sourceInstanceId,revision:activity.revision,
      cancellationToken:activity.cancellationToken!,parentFrame:current.frame}))return null;
  }
  options.cancelMedia(instances);
  return current;
}

type HostAudioTrack = NonNullable<AnimationModule['audioTracks']>[number];
interface HostAudioTracksOptions {
  module: AnimationModule | undefined;
  lang: 'en' | 'es';
  frameDomain?: string;
  fallbackCue?: RuntimeAudioCue | null;
  disabled?: boolean;
  /** Opt-in for real modern text renderers; external/legacy callers default off. */
  preservePositionOnPause?: boolean;
  paused?: boolean;
  playbackRevision?: string;
  sourcePcm?: boolean;
  onTimelinePauseChange?: (paused: boolean) => void;
  lifecycleIdentity?: LessonPlaybackIdentity;
  beforeStart?: (track: HostAudioTrack) => {sourceFrame:number} | null;
  nextSequence?: () => number;
  volume?: number;
}

/**
 * Owns the on-demand narration elements. It is a hook rather than component
 * state because two hosts drive the same tracks: the runtime toolbar's own
 * buttons, and a lesson shell that renders the narration control in its top
 * bar and commands playback through `narrationRequest`.
 */
export function useHostAudioTracks({module, lang, frameDomain = 'root', fallbackCue = null, disabled = false, preservePositionOnPause = false, paused = false, playbackRevision = '', sourcePcm = false, onTimelinePauseChange = ignoreTimelinePauseChange, lifecycleIdentity, beforeStart, nextSequence, volume = 1}: HostAudioTracksOptions) {
  const active = useRef<{
    audio: SourceAudioMedia;
    identity: string;
    pausesTimeline: boolean;
    session?: HostAudioTrackSession;
    start?: HostAudioTrackEvent;
  } | null>(null);
  const ownSequence=useRef(0);
  const [latestStart,setLatestStart]=useState<HostAudioTrackEvent>();
  const [latestEvent,setLatestEvent]=useState<HostAudioTrackEvent>();
  const preservePause = preservePositionOnPause && sourcePcm;
  const temporarilyPaused = preservePause && paused;
  // A track belongs to exactly one page, language, and frame domain. Stamping
  // what is playing with that identity means moving to another page reports
  // silence by derivation, with no reset to run and no window in which the new
  // page inherits the old one's playing state.
  const identity = JSON.stringify([module?.key ?? '', lang, frameDomain, disabled, fallbackCue?.id ?? '', preservePause, preservePause ? playbackRevision : '']);
  const currentIdentity=useRef(identity);currentIdentity.current=identity;
  const [playingTrack, setPlayingTrack] =
    useState<{identity: string; trackId: string} | null>(null);
  const retainedTrackId = playingTrack?.identity === identity ? playingTrack.trackId : null;
  const playing = temporarilyPaused ? null : retainedTrackId;
  const pausedTrackId = temporarilyPaused ? retainedTrackId : null;
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
  const stop = useCallback((reason:'stop' | NonNullable<HostAudioTrackEvent['cancellationReason']>='stop', trackId?:string) => {
    const current = active.current;
    if(trackId && current?.start?.trackId!==trackId && retainedTrackId!==trackId)return;
    active.current = null;
    setPlayingTrack(null);
    if (!current) return;
    if (current.session) current.session.stop();
    else {current.audio.pause();current.audio.currentTime=0;current.audio.dispose?.();}
    if(current.start)setLatestEvent({...current.start,kind:reason==='stop'?'stop':'cancelled',
      ...(reason==='stop'?{}:{cancellationReason:reason})});
    if (current.pausesTimeline) onTimelinePauseChange(false);
  }, [onTimelinePauseChange,retainedTrackId]);
  useEffect(() => {
    const retiringIdentity = identity;
    return () => {
      const current=active.current;
      if(!current || current.identity!==retiringIdentity)return;
      active.current=null;
      if(current.session)current.session.stop();
      else {current.audio.pause();current.audio.currentTime=0;current.audio.dispose?.();}
      if(current.start)setLatestEvent({...current.start,kind:'cancelled',cancellationReason:'identity-change'});
      setPlayingTrack(value=>value?.identity===retiringIdentity?null:value);
      if(current.pausesTimeline)onTimelinePauseChange(false);
    };
  },[identity,onTimelinePauseChange]);
  useEffect(() => {
    const current=active.current;
    if(current?.identity===identity && current.session)void current.session.setPaused(temporarilyPaused);
  },[identity,temporarilyPaused]);
  useEffect(()=>{if(active.current)active.current.audio.volume=safeVolume;},[safeVolume]);
  const play = useCallback((requested: HostAudioTrack) => {
    // Resolve against the actually exposed module track; a caller cannot supply
    // a different asset/policy under a borrowed ID or bypass locale/domain.
    const track=tracks.find(item=>item.id===requested.id && item.source===requested.source && item.sha256===requested.sha256);
    if(disabled || temporarilyPaused || !track || !isSameOriginAssetSource(track.source)
      || !/^[a-f0-9]{64}$/.test(track.sha256) || currentIdentity.current!==identity)return false;
    const prior=active.current;
    if(prior)stop('replaced');
    const pausesTimeline=track.timelineBehavior==='pause-while-playing';
    if(pausesTimeline)onTimelinePauseChange(true);
    const prepared=beforeStart?.(track);
    if(beforeStart && !prepared){if(pausesTimeline)onTimelinePauseChange(false);return false;}
    const start:HostAudioTrackEvent|undefined=lifecycleIdentity && prepared ? {
      kind:'accepted-start',sequence:nextSequence?.()??++ownSequence.current,identity:lifecycleIdentity,
      trackId:track.id,trackSha256:track.sha256,frameDomain,sourceFrame:prepared.sourceFrame,
    }:undefined;
    if(start){setLatestStart(start);setLatestEvent(start);}
    let audio:SourceAudioMedia;
    try{audio=sourcePcm?createSourceAudioMedia(track.source,track.sha256):new Audio(track.source);}
    catch{if(start)setLatestEvent({...start,kind:'error'});if(pausesTimeline)onTimelinePauseChange(false);return true;}
    audio.volume=safeVolume;
    const done=(reason:'ended'|'error')=>{
      const current=active.current;
      if(current?.audio!==audio || current.identity!==identity || currentIdentity.current!==identity
        || current.start?.sequence!==start?.sequence || current.start?.trackSha256!==start?.trackSha256)return;
      active.current=null;
      if(!current.session){audio.pause();audio.dispose?.();}
      if(current.start)setLatestEvent({...current.start,kind:reason});
      if(pausesTimeline)onTimelinePauseChange(false);
      setPlayingTrack(value=>value?.identity===identity && value.trackId===track.id?null:value);
    };
    const session=preservePause?new HostAudioTrackSession(audio,done):undefined;
    active.current={audio,identity,pausesTimeline,...(session?{session}:{}),...(start?{start}:{})};
    if(!session){audio.addEventListener('ended',()=>done('ended'),{once:true});audio.addEventListener('error',()=>done('error'),{once:true});}
    setPlayingTrack({identity,trackId:track.id});
    if(session)void session.play();else void audio.play().catch(()=>done('error'));
    return true;
  },[disabled,temporarilyPaused,tracks,identity,stop,onTimelinePauseChange,beforeStart,lifecycleIdentity,nextSequence,frameDomain,sourcePcm,safeVolume,preservePause]);
  const toggle = useCallback((track: HostAudioTrack) => {
    // A retained paused track is still stoppable; pause only blocks new play.
    if (retainedTrackId === track.id && active.current) {
      stop();
      return;
    }
    if (disabled || temporarilyPaused || !isSameOriginAssetSource(track.source)) return;
    play(track);
  }, [disabled, play, retainedTrackId, stop, temporarilyPaused]);
  const currentEvent=(event:HostAudioTrackEvent|undefined)=>event && lifecycleIdentity
    && event.identity.playbackIdentity===lifecycleIdentity.playbackIdentity
    && event.identity.replay===lifecycleIdentity.replay && event.identity.seekRevision===lifecycleIdentity.seekRevision ? event : undefined;
  return {play,playing,pausedTrackId,stop,toggle,tracks,start:currentEvent(latestStart),event:currentEvent(latestEvent)};
}

export function resolveInteractiveAudioAssets(module: AnimationModule | undefined, lang: 'en' | 'es') {
  const languages = module?.interactiveAudioLanguages ?? [lang];
  return Object.freeze((module?.interactiveAudioAssets ?? []).filter(
    asset => (asset.language === 'en' || asset.language === 'es')
      && languages.includes(asset.language) && isExactInteractiveAudioAsset(asset),
  ));
}

interface InteractiveAudioOptions {
  readonly paused?: boolean;
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
export function useInteractiveAudioAssets({
  disabled = false,
  paused = false,
  lang,
  module,
  replay,
  volume = 1,
}: InteractiveAudioOptions) {
  const identity = `${module?.key ?? ''}:${lang}:${replay}:${disabled}`;
  const [state, setState] = useState<{identity: string; playback: InteractiveAudioState} | null>(null);
  const controller = useMemo(() => createInteractiveAudioController(
    source => new Audio(source),
    playback => setState({identity, playback}),
  ), [identity]);
  const playback = state?.identity === identity ? state.playback : null;
  // A temporary native-quiz pause retains its media; identity changes and
  // actual disablement still run the controller cleanup below.
  useEffect(() => {
    if (paused && playback?.status === 'playing') controller.pause(playback.assetId);
  }, [controller, paused, playback?.assetId, playback?.status]);
  const safeVolume = Math.max(0, Math.min(1, volume));
  const assets = useMemo(() => resolveInteractiveAudioAssets(module, lang), [lang, module]);
  useEffect(() => () => {controller.stop();}, [controller]);
  useEffect(() => {controller.setVolume(safeVolume);}, [controller, safeVolume]);
  const play = useCallback((id: string) => {
    const asset = assets.find(item => item.id === id);
    return !disabled && !paused && asset ? controller.play(id, asset.source, safeVolume) : false;
  }, [assets, controller, disabled, paused, safeVolume]);
  const resume = useCallback((id: string) => !disabled && !paused && controller.resume(id),
    [controller, disabled, paused]);
  return {assets, play, playing: playback?.status === 'playing' ? playback.assetId : null,
    paused: playback?.status === 'paused' ? playback.assetId : null,
    pause: controller.pause, resume, stop: controller.stop};
}

function HostAudioControlsView({disabled, lang, playing, pausedTrackId = null, toggle, tracks}: {disabled: boolean; lang: 'en' | 'es'; playing: string | null; pausedTrackId?: string | null; toggle: (track: HostAudioTrack) => void; tracks: readonly HostAudioTrack[]}) {
  if (!tracks.length) return null;
  return <div aria-label={lang === 'es' ? 'Audio narrado' : 'Narration audio'} className="runtime-audio-controls" role="group">
    {tracks.map((track) => {
      const trackName = track.language === 'shared' ||
          track.spokenLanguage === 'undetermined'
        ? lang === 'es'
          ? 'audio de origen (idioma no verificado)'
          : 'source audio (language unverified)'
        : lang === 'es'
          ? track.language === 'es' ? 'audio en español' : 'audio en inglés'
          : track.language === 'es' ? 'Spanish audio' : 'English audio';
      const trackPaused = pausedTrackId === track.id;
      const label = trackPaused
        ? lang === 'es' ? `Detener ${trackName} (en pausa)` : `Stop ${trackName} (paused)`
        : playing === track.id
          ? lang === 'es' ? `Detener ${trackName}` : `Stop ${trackName}`
          : lang === 'es' ? `Reproducir ${trackName}` : `Play ${trackName}`;
      return <button aria-pressed={playing === track.id} data-audio-control-kind={track.id.endsWith('-manual-fallback') ? 'autoplay-fallback' : 'host-track'} data-audio-playback-state={trackPaused ? 'paused' : playing === track.id ? 'playing' : 'idle'} data-audio-timeline-behavior={track.timelineBehavior ?? 'none'} disabled={disabled && !trackPaused} key={track.id} onClick={() => toggle(track)} type="button">
        {label}
      </button>;
    })}
  </div>;
}

export function HostAudioControls(options: HostAudioTracksOptions & {module: AnimationModule}) {
  const {playing, pausedTrackId, toggle, tracks} = useHostAudioTracks(options);
  return <HostAudioControlsView
    disabled={options.disabled ?? false}
    lang={options.lang}
    playing={playing}
    pausedTrackId={pausedTrackId}
    toggle={toggle}
    tracks={tracks}
  />;
}

export function AnimationRuntime({
  audioEnabled = true,
  sourceActivityAudioQa = false,
  audioLanguage,
  animationId,
  moduleKey,
  query,
  labels,
  loadedSwfHostAsset,
  narrationRequest,
  narrationTrackId,
  publicPlayRequest,
  onLessonHostRequest,
  onGs002GameStart,
  lessonPlacementId,
  gs003EntryLevel,
  onPlaybackComplete,
  onReplay: onReplayCallback,
  onPlaybackStateChange,
  pageInteractionCompanionTargetId,
  pageInteractionStageTargetId,
  paused = false,
  seekRequest,
  presentation = 'workbench',
  sourceLanguageDisclosure,
  uiLanguage,
  volume = 1,
}: {
  audioEnabled?: boolean;
  sourceActivityAudioQa?: boolean;
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
  /** Optional exact local track whose state the outer Narration control owns. */
  narrationTrackId?: string;
  publicPlayRequest?: Readonly<{requestId:number;commandOrder?:number}> | null;
  onLessonHostRequest?: AnimationRendererProps['onLessonHostRequest'];
  onGs002GameStart?: AnimationRendererProps['onGs002GameStart'];
  lessonPlacementId?: string;
  gs003EntryLevel?: AnimationRendererProps['gs003EntryLevel'];
  onPlaybackComplete?: () => void;
  onReplay?: () => void;
  onPlaybackStateChange?: (state: AnimationRuntimePlaybackState) => void;
  pageInteractionCompanionTargetId?: string;
  pageInteractionStageTargetId?: string;
  paused?: boolean;
  seekRequest?: AnimationRuntimeSeekRequest | null;
  presentation?: 'workbench' | 'lesson' | 'legacy-shell';
  /** Exact ordinary IR001 host owns both English-source explanations. */
  sourceLanguageDisclosure?: 'ir001-host';
  uiLanguage?: AnimationRendererProps['lang'];
  volume?: number;
}) {
  const [loaded, setLoaded] = useState<{key: string; module?: AnimationModule; failed?: boolean}>({key: moduleKey});
  const [replay, setReplay] = useState(0), [reduced, setReduced] = useState<boolean | undefined>();
  const [hostAudioPaused, setHostAudioPaused] = useState(false);
  const [autoplayBlockedCue, setAutoplayBlockedCue] = useState<RuntimeAudioCue | null>(null);
  const [timelineAudioSounding, setTimelineAudioSounding] = useState(false);
  const [sourceTimelineAudioSounding,setSourceTimelineAudioSounding] = useState(false);
  const [sourceTimelineBlockedCue,setSourceTimelineBlockedCue] = useState<RuntimeAudioCue | null>(null);
  const animationModule = loaded.key === moduleKey ? loaded.module : undefined;
  const sourceEvidenceCapture = query.capture === '1' || Boolean(query.entryStateSha256);
  const modernTextEnabled = isLessonTypographyCandidateEnabled() && !sourceEvidenceCapture;
  const typographyLanguages = lessonTypographyLanguages(query.lang, uiLanguage,
    modernTextEnabled ? animationModule?.textPresentation?.binding : undefined);
  // Keep visual/runtime identity intact while stripping every audio declaration
  // from the executable path when the server publication gate is closed.
  const audioModule = audioEnabled ? animationModule : undefined;
  const sourceTimelineAudioModule = useMemo(() => modernTextEnabled && animationModule?.textPresentation?.sourceTimelineAudioCues?.length
    ? {...animationModule,audioCues:animationModule.textPresentation.sourceTimelineAudioCues} : undefined,[animationModule,modernTextEnabled]);
  const prototype = matchPrototype({animationId: moduleKey});
  useEffect(() => {let cancelled = false; const preparation = new AbortController(); loadAnimationModuleForPresentation(moduleKey, {modernText: modernTextEnabled, signal: preparation.signal}).then((value) => {if (!cancelled) setLoaded({key: moduleKey, module: value, failed: !value});}).catch(() => {if (!cancelled) setLoaded({key: moduleKey, failed: true});}); return () => {cancelled = true; preparation.abort();};}, [moduleKey, modernTextEnabled]);
  useEffect(() => {const media = matchMedia('(prefers-reduced-motion: reduce)'), update = () => setReduced(media.matches); update(); media.addEventListener('change', update); return () => media.removeEventListener('change', update);}, []);
  const runtimeMetadata = prototype?.runtime ?? animationModule?.runtime ?? animationModule?.movie;
  const context = animationModule && runtimeMetadata
    ? createRuntimeContext(
        modernTextEnabled && animationModule.textPresentation
          ? {...query, lang: typographyLanguages.visualLanguage}
          : query,
        runtimeMetadata,
        animationModule.scenarios,
        animationModule.defaultScenarioByFrameDomain
      )
    : undefined;
  const resolvedAudioLanguage = audioLanguage ?? (modernTextEnabled && animationModule?.textPresentation
    ? typographyLanguages.requestedLanguage : context?.lang ?? 'en');
  const frameDomain = runtimeMetadata && context ? resolveFrameDomain(runtimeMetadata, context.frameDomain) : undefined;
  const activeMovie = runtimeMetadata && frameDomain ? frameDomainMovie(runtimeMetadata, frameDomain) : undefined;
  const playbackEndFrame = frameDomain
    ? animationModule?.playbackEndFrameByDomain?.[frameDomain.id] ?? animationModule?.playbackEndFrame
    : animationModule?.playbackEndFrame;
  const textFrameControl = modernTextEnabled ? animationModule?.textPresentation?.frameControl : undefined;
  const textActivityTimelines = modernTextEnabled ? animationModule?.textPresentation?.activityTimelines : undefined;
  const capture = query.capture === '1';
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
  const sourceAudioPreparation = useSourceAudioPreparation({
    active: Boolean((audioEnabled || sourceActivityAudioQa) && modernTextEnabled && !sourceEvidenceCapture && context?.captureFrame === undefined && reduced === false),
    identity: `${playbackIdentity}:${replay}:${resolvedAudioLanguage}`, cues: sourceTimelineAudioModule?.audioCues,
    activities: textActivityTimelines,
    frameDomain: frameDomain?.id ?? 'root', lang: resolvedAudioLanguage, scenario: context?.scenario ?? 'default', seed: context?.seed ?? 0,
  });
  const running = Boolean(animationModule && context?.captureFrame === undefined && reduced === false && !hostAudioPaused && !paused && sourceAudioPreparation.ready);
  const manualNarrationIdentity = `${playbackIdentity}:${replay}`;
  const [lastNarrationRange, setLastNarrationRange] = useState<{identity: string; range: NarrationFrameRange} | null>(null);
  const {
    frame: liveFrame,
    pauseNow: pauseTimelineNow,
    readCurrent: readSourceClock,
    restartNow: restartSourceClock,
    seekRevision,
    seekToFrame,
    continueSourceFrame,
    sourceFrame,
    sourceStopFrame,
    beginSourceActivity, beginSourceActivities, beginSourceButtonActivity, releaseSourceButton, cancelSourceActivity,
    lessonActivity, lessonActivities,
  } = useLessonSourceClock(activeMovie, animationModule?.playbackMode, playbackEndFrame, running, replay, playbackIdentity,
    Boolean(animationModule && context?.captureFrame === undefined && !hostAudioPaused && !paused && sourceAudioPreparation.ready));
  const onHostAudioTimelinePauseChange = useCallback((paused: boolean) => {
    if (paused) pauseTimelineNow();
    else restartSourceClock();
    setHostAudioPaused(paused);
  }, [pauseTimelineNow,restartSourceClock]);
  const reducedMotionFrame = animationModule && activeMovie
    ? (modernTextEnabled && frameDomain && animationModule.textPresentation?.reducedMotionFrameByDomain?.[frameDomain.id])
      || resolveReducedMotionFrame(activeMovie, animationModule.reducedMotionFrame)
    : 1;
  // `running` becomes false while source host narration pauses the child
  // timeline. Keep rendering the last live frame in that state; falling back
  // to frame 1 would visually restart the movie for the duration of the audio.
  const frame = context?.captureFrame ?? (reduced === true ? sourceFrame ?? reducedMotionFrame : liveFrame);
  const sourceKeyRequestContext = useRef({animationModule, modernTextEnabled, frame,
    frameDomain: frameDomain?.id ?? '', capture: sourceEvidenceCapture || context?.captureFrame !== undefined});
  useLayoutEffect(() => {
    sourceKeyRequestContext.current = {animationModule, modernTextEnabled, frame,
      frameDomain: frameDomain?.id ?? '', capture: sourceEvidenceCapture || context?.captureFrame !== undefined};
  }, [animationModule, modernTextEnabled, frame, frameDomain?.id, sourceEvidenceCapture, context?.captureFrame]);
  const requestLessonFrame = useCallback((request: LessonTextFrameTransition) => {
    const sourcePlayControl=modernTextEnabled?animationModule?.sourcePlayControl:undefined;
    let currentFrame=frame;
    if(sourcePlayControl && sourcePlayControl.frameDomain===frameDomain?.id){
      const current=readSourceClock();
      if(!current || sourceActivityBlocksParent(current.activities))return false;
      currentFrame=reduced===true&&!current.sourceControlled ? frame : current.frame;
    }else if(sourceActivityBlocksParent(lessonActivities))return false;
    if (!lessonTextFrameRequestAllowed(textFrameControl, request,
      {frame:currentFrame, frameDomain: frameDomain?.id ?? '', capture: sourceEvidenceCapture || context?.captureFrame !== undefined})) return false;
    const accepted = continueSourceFrame(reduced === true ? request.stopFrame : request.toFrame, request.stopFrame);
    if (accepted && request.toFrame < request.stopFrame) setLastNarrationRange({identity: manualNarrationIdentity,
      range: nextNarrationRange({firstFrame: 1, endFrameExclusive: reducedMotionFrame}, request)});
    return accepted;
  }, [textFrameControl, frame, frameDomain?.id, sourceEvidenceCapture, context?.captureFrame, continueSourceFrame, reduced, readSourceClock, manualNarrationIdentity, reducedMotionFrame,modernTextEnabled,animationModule,lessonActivities]);
  const requestLessonActivity = useCallback((request: LessonTextActivityRequest) => {
    if (!textFrameControl || frameDomain?.id !== textFrameControl.frameDomain) return false;
    const definition = lessonTextActivityRequestAllowed(textActivityTimelines, request, {
      frame, capture: sourceEvidenceCapture || context?.captureFrame !== undefined,
      activity: lessonActivity, activities: lessonActivities,
    });
    return definition ? beginSourceActivity(definition, frame) : false;
  }, [textFrameControl, frameDomain?.id, textActivityTimelines, frame, sourceEvidenceCapture, context?.captureFrame, lessonActivity, lessonActivities, beginSourceActivity]);
  const requestLessonActivities = useCallback((requests: readonly LessonTextActivityRequest[]) => {
    if (!textFrameControl || frameDomain?.id !== textFrameControl.frameDomain || !requests.length) return false;
    const definitions = requests.map(request=>lessonTextActivityRequestAllowed(textActivityTimelines,request,{
      frame,capture:sourceEvidenceCapture || context?.captureFrame !== undefined,activity:lessonActivity,activities:lessonActivities,
    }));
    if(definitions.some(definition=>!definition))return false;
    return beginSourceActivities(definitions as LessonTextActivityDefinition[],frame);
  },[textFrameControl,frameDomain?.id,textActivityTimelines,frame,sourceEvidenceCapture,context?.captureFrame,lessonActivity,lessonActivities,beginSourceActivities]);
  const requestLessonButtonActivity=useCallback((request:LessonTextButtonActivityRequest)=>{
    if(sourceEvidenceCapture||context?.captureFrame!==undefined||!textFrameControl||frameDomain?.id!==textFrameControl.frameDomain
      ||(request.phase==='press'&&(paused||hostAudioPaused))
      ||request.parentFrame!==frame||!request.token||request.token.length>128)return false;
    const definition=textActivityTimelines?.find(activity=>activity.id===request.id&&activity.buttonPress&&activity.parentFrames.includes(frame));
    if(!definition)return false;
    return request.phase==='press'?beginSourceButtonActivity(definition,frame,request.token)
      :request.phase==='release'?releaseSourceButton(request.id,request.token):false;
  },[sourceEvidenceCapture,context?.captureFrame,textFrameControl,frameDomain?.id,frame,textActivityTimelines,beginSourceButtonActivity,releaseSourceButton,paused,hostAudioPaused]);
  const cancelLessonActivity=useCallback((request:LessonTextActivityCancellation)=>{
    if(sourceEvidenceCapture||context?.captureFrame!==undefined||!textFrameControl
      ||frameDomain?.id!==textFrameControl.frameDomain||request.parentFrame!==frame)return false;
    const definition=textActivityTimelines?.find(activity=>activity.id===request.id
      &&activity.sourceInstanceId===request.sourceInstanceId&&activity.parentFrames.includes(frame));
    return definition?cancelSourceActivity(request):false;
  },[sourceEvidenceCapture,context?.captureFrame,textFrameControl,frameDomain?.id,frame,textActivityTimelines,cancelSourceActivity]);
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
  const legacyAudioAvailable = Boolean(
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
  const gsGameContext: GsGameRuntimeContext = {animationId, moduleKey,
    placementId: lessonPlacementId, binding: animationModule?.textPresentation?.binding,
    runtime: playbackContext, state, modernText: modernTextEnabled,
    capture: sourceEvidenceCapture || context?.captureFrame !== undefined, paused: paused || hostAudioPaused};
  const gs002Owner = useMemo(() => ({accepted: false}),
    [playbackIdentity, replay, lessonPlacementId, uiLanguage]);
  const gs002Current = useRef<Readonly<{owner: typeof gs002Owner; context: GsGameRuntimeContext;
    callback: typeof onGs002GameStart}> | null>(null);
  useLayoutEffect(() => {
    gs002Current.current = {owner: gs002Owner, context: gsGameContext, callback: onGs002GameStart};
    return () => {if (gs002Current.current?.owner === gs002Owner) gs002Current.current = null;};
  });
  const requestGs002GameStart = useCallback<NonNullable<AnimationRendererProps['onGs002GameStart']>>((request) => {
    const current = gs002Current.current;
    if (!current || current.owner !== gs002Owner || gs002Owner.accepted || !current.callback) return false;
    const clock = readSourceClock();
    if (!clock || sourceActivityBlocksParent(clock.activities)) return false;
    const actualFrame = reduced === true && !clock.sourceControlled ? current.context.runtime?.frame : clock.frame;
    if (actualFrame !== current.context.runtime?.frame || !gs002GameStartAllowed(request, current.context)) return false;
    if (current.callback(request) !== true) return false;
    gs002Owner.accepted = true;
    return true;
  }, [gs002Owner, readSourceClock, reduced]);
  const gs003EntryRejected = gs003EntryLevel !== undefined && !gs003EntryLevelAllowed(gs003EntryLevel, gsGameContext);
  const sourceActivityAudioEnabled = Boolean(
    (audioEnabled || sourceActivityAudioQa) && modernTextEnabled && !sourceEvidenceCapture
      && context?.captureFrame === undefined && rendererDomainSupported
      && textActivityTimelines?.some(activity => activity.audio
        && (activity.audio.language === 'shared' || activity.audio.language === resolvedAudioLanguage)
        && /^[a-f0-9]{64}$/.test(activity.audio.sha256)
        && activity.audio.firstFrame >= 1 && activity.audio.lastFrame >= activity.audio.firstFrame
        && isSameOriginAssetSource(activity.audio.source)),
  );
  const sourceTimelineAudioEnabled = Boolean((audioEnabled||sourceActivityAudioQa)&&modernTextEnabled&&!sourceEvidenceCapture
    &&context?.captureFrame===undefined&&rendererDomainSupported&&sourceTimelineAudioModule?.audioCues.some(cue=>
      audioCueMatchesContext(cue,{frameDomain:frameDomain?.id??'',lang:resolvedAudioLanguage,scenario:context?.scenario??'',seed:context?.seed??0})));
  const candidateTerminalPolicy=animationModule?.textPresentation?.terminalTimelineAudio;
  const terminalPolicy=modernTextEnabled&&candidateTerminalPolicy&&candidateTerminalPolicy.frameDomain===frameDomain?.id?candidateTerminalPolicy:undefined;
  const manualSourceRange = lastNarrationRange?.identity === manualNarrationIdentity ? lastNarrationRange.range
    : {firstFrame: 1, endFrameExclusive: terminalPolicy && playbackEndFrame!==undefined && playbackEndFrame<terminalPolicy.holdFrame
      ? Math.min(reducedMotionFrame,playbackEndFrame)
      : terminalPolicy?.endFrameExclusive ?? Math.min(reducedMotionFrame, playbackEndFrame ?? reducedMotionFrame)};
  const manualSourcePlan = (reduced === true || frame >= sourceStopFrame) && sourceTimelineAudioEnabled && audioContext
    ? boundedNarrationPlan(animationModule?.textPresentation?.sourceTimelineAudioCues?.filter(cue=>cue.manualNarration !== false) ?? [], manualSourceRange, activeMovie?.fps ?? 0, audioContext) : null;
  const manualSourceNarration = useLessonManualNarration({
    identity: `${manualNarrationIdentity}:${resolvedAudioLanguage}:${frame}:${lessonActivities.map(activity=>`${activity.id}:${activity.revision}`).join(',')}`,
    plan: manualSourcePlan, paused: paused || hostAudioPaused, volume,
  });
  const audioAvailable = legacyAudioAvailable || sourceActivityAudioEnabled || sourceTimelineAudioEnabled;
  const resolvedPlaybackEndFrame = activeMovie
    ? resolvePlaybackEndFrame(activeMovie, textFrameControl && textFrameControl.frameDomain === frameDomain?.id
      ? textFrameControl.completionFrame : playbackEndFrame)
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
  const reducedMotionManualCue = reduced === true && !sourceTimelineAudioEnabled && audioModule && audioContext
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
  const {stopNow: stopTimelineAudioNow} = useAudio(audioModule, frame, activeMovie?.fps ?? 1, context?.frameDomain ?? 'root', resolvedAudioLanguage, running && !capture && rendererDomainSupported && !sourceTimelineAudioEnabled, replay, context?.scenario ?? 'default', context?.seed ?? 0, volume, setAutoplayBlockedCue, setTimelineAudioSounding);
  const sourceTimelineAudioMayRun=sourceTimelineAudioEnabled&&running&&(frame<sourceStopFrame||Boolean(terminalPolicy&&frame===terminalPolicy.holdFrame))&&!sourceActivityBlocksParent(lessonActivities)&&(!terminalPolicy||!['loading','playing','paused'].includes(manualSourceNarration.status));
  const {stopNow:stopSourceTimelineAudio,retry:retrySourceTimelineAudio,stopped:sourceTimelineAudioStopped,canStartManual:canStartSourceManual}=useAudio(sourceTimelineAudioModule,frame,activeMovie?.fps??1,context?.frameDomain??'root',resolvedAudioLanguage,
    sourceTimelineAudioMayRun,replay,context?.scenario??'default',context?.seed??0,volume,setSourceTimelineBlockedCue,setSourceTimelineAudioSounding,sourceAudioPreparation.pool,terminalPolicy?{identity:`${playbackIdentity}:${replay}:${resolvedAudioLanguage}:${seekRevision}`,cueId:terminalPolicy.cueId,holdFrame:terminalPolicy.holdFrame}:undefined);
  const narrationDisabled = capture ||
    context?.captureFrame !== undefined ||
    paused;
  // A feature flag alone is not a modern renderer. Preserve temporary host
  // pauses only when this page actually uses its maintained text renderer.
  const preserveHostNarrationPause = Boolean(modernTextEnabled && animationModule?.textPresentation?.Renderer);
  const hostNarrationOwnershipDisabled = capture || context?.captureFrame !== undefined || (!preserveHostNarrationPause && paused);
  const {state: activityAudioState, stop: stopActivityAudio, retry: retryActivityAudio,cancelObservedInstances:cancelActivityAudioInstances} = useLessonActivityAudio({
    identity: `${moduleKey}:${replay}:${resolvedAudioLanguage}:${animationModule?.textPresentation?.binding.version ?? ''}:${textActivityTimelines?.map(activity=>activity.audio?.sha256??'').join(':') ?? ''}`,
    definitions: textActivityTimelines, activity: lessonActivity, activities: lessonActivities,
    enabled: sourceActivityAudioEnabled,
    paused: paused || hostAudioPaused, language: resolvedAudioLanguage, volume,
  });
  const lessonPlaybackIdentity=useMemo<LessonPlaybackIdentity>(()=>({playbackIdentity,replay,seekRevision}),[playbackIdentity,replay,seekRevision]);
  const signalSequence=useRef(0);
  const nextSignalSequence=useCallback(()=>++signalSequence.current,[]);
  const retireSourceInstances=useCallback((instances:readonly string[])=>{
    if(sourceEvidenceCapture || context?.captureFrame!==undefined || !textFrameControl
      || frameDomain?.id!==textFrameControl.frameDomain || new Set(instances).size!==instances.length
      || instances.some(id=>!textActivityTimelines?.some(definition=>definition.sourceInstanceId===id)))return null;
    const current=retireObservedHostTrackActivities({instances,definitions:textActivityTimelines??[],expectedSeekRevision:seekRevision,
      pause:pauseTimelineNow,readCurrent:readSourceClock,cancel:cancelSourceActivity,cancelMedia:cancelActivityAudioInstances});
    if(!current)return null;
    return {sourceFrame:reduced===true&&!current.sourceControlled?frame:current.frame};
  },[sourceEvidenceCapture,context?.captureFrame,textFrameControl,frameDomain?.id,textActivityTimelines,pauseTimelineNow,readSourceClock,seekRevision,cancelSourceActivity,cancelActivityAudioInstances,reduced,frame]);
  const prepareHostTrack=useCallback((track:HostAudioTrack)=>{
    if(track.interruptSourceInstances)return retireSourceInstances(track.interruptSourceInstances);
    const current=readSourceClock();return current?{sourceFrame:reduced===true&&!current.sourceControlled?frame:current.frame}:null;
  },[retireSourceInstances,readSourceClock,reduced,frame]);
  const {
    play: playNarrationTrack,
    playing: playingNarrationTrackId,
    pausedTrackId: pausedNarrationTrackId,
    stop: stopNarrationTrack,
    toggle: toggleNarrationTrack,
    tracks: narrationTracks,
    start: hostAudioTrackStart, event: hostAudioTrackEvent,
  } = useHostAudioTracks({
    disabled: hostNarrationOwnershipDisabled,
    preservePositionOnPause: preserveHostNarrationPause,
    paused,
    // Observed seek revisions are destructive; initial revision zero is stable.
    playbackRevision: JSON.stringify([playbackIdentity, replay, seekRevision]),
    sourcePcm: Boolean(modernTextEnabled && animationModule?.textPresentation),
    fallbackCue: currentAutoplayBlockedCue ?? reducedMotionManualCue,
    frameDomain: playbackContext?.frameDomain ?? 'root',
    lang: resolvedAudioLanguage,
    module: audioModule,
    onTimelinePauseChange: onHostAudioTimelinePauseChange,
    lifecycleIdentity:lessonPlaybackIdentity,beforeStart:prepareHostTrack,nextSequence:nextSignalSequence,
    volume,
  });
  const {
    assets: interactiveAudioAssets,
    play: playInteractiveAudio,
    playing: playingInteractiveAudioId,
    paused: pausedInteractiveAudioId,
    pause: pauseInteractiveAudio,
    resume: resumeInteractiveAudio,
    stop: stopInteractiveAudio,
  } = useInteractiveAudioAssets({
    ...g4L3InteractiveAudioLifecycle({animationId: animationModule?.key ?? '', audioEnabled, portalTarget: pageInteractionCompanionTargetId, capture, captureFrame: context?.captureFrame, paused}),
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
    sourceTimelineAudioSounding ||
    manualSourceNarration.status === 'playing' ||
    playingNarrationTrackId !== null ||
    playingInteractiveAudioId !== null || activityAudioState.status === 'playing';
  // A refused cue stays on the module for as long as the page is open, because
  // it is what the manual track is built from. A request on this page is the
  // gesture the browser was holding out for, so once one exists the control
  // stops asking and becomes an ordinary play/stop toggle. The host clears the
  // request when it changes page, which resets this with it: a new page makes
  // its own autoplay attempt, and the last page's refusal says nothing about it.
  const narrationGestureGiven = narrationRequest !== null;
  const aggregateNarration: AnimationRuntimeNarrationStatus = !audioAvailable
    ? 'unavailable'
    : pausedNarrationTrackId !== null || manualSourceNarration.status === 'paused'
      ? 'paused'
    : sourceTimelineBlockedCue || manualSourceNarration.status === 'blocked' || manualSourceNarration.status === 'error'
      ? 'blocked'
    : narrationSounding
      ? 'playing'
      : (currentAutoplayBlockedCue && !narrationGestureGiven) || activityAudioState.status === 'blocked'
        ? 'blocked'
        : manualSourcePlan || (sourceTimelineAudioStopped&&sourceTimelineAudioMayRun)||narrationTracks.length > 0
          ? 'idle'
          : interactiveAudioAssets.length > 0
            ? 'interactive'
            : 'waiting';
  // An exact-track control must not mistake unrelated feedback audio for its
  // own playing owner, or its first Spanish click would incorrectly send Stop.
  const narration:AnimationRuntimeNarrationStatus=narrationTrackId
    ? !audioAvailable || !narrationTracks.some(track=>track.id===narrationTrackId) ? 'unavailable'
      : pausedNarrationTrackId===narrationTrackId ? 'paused'
      : playingNarrationTrackId===narrationTrackId ? 'playing'
      : hostAudioTrackEvent?.trackId===narrationTrackId && hostAudioTrackEvent.kind==='error' ? 'blocked' : 'idle'
    : aggregateNarration;
  const [lastPlayCommand,setLastPlayCommand]=useState<LessonPlayCommand>();
  const lastPublicPlayRequest=useRef(0);
  const lessonPlayCommand=lastPlayCommand && lastPlayCommand.identity.playbackIdentity===playbackIdentity
    && lastPlayCommand.identity.replay===replay && lastPlayCommand.identity.seekRevision===seekRevision ? lastPlayCommand : undefined;
  const lastNarrationRequestRef = useRef(0);
  useEffect(() => {
    const publicCommand=()=>{
      if(!publicPlayRequest)return;
      lastPublicPlayRequest.current=publicPlayRequest.requestId;
    const control=modernTextEnabled?animationModule?.sourcePlayControl:undefined;
    if(!control || control.frameDomain!==frameDomain?.id || sourceEvidenceCapture || context?.captureFrame!==undefined)return;
    stopNarrationTrack('public-play');
    const prepared=retireSourceInstances(control.interruptSourceInstances);
    if(!prepared){restartSourceClock();return;}
    setLastPlayCommand({kind:'play',sequence:nextSignalSequence(),identity:lessonPlaybackIdentity,
      frameDomain:control.frameDomain,sourceFrame:prepared.sourceFrame});
    restartSourceClock();
    };
    const narrationCommand=()=>{
      if(!narrationRequest)return;
      lastNarrationRequestRef.current=narrationRequest.requestId;
    if (narrationRequest.action === 'stop') {
      if(narrationRequest.trackId){stopNarrationTrack('stop',narrationRequest.trackId);return;}
      stopNarrationTrack();
      stopInteractiveAudio();
      stopTimelineAudioNow();
      stopActivityAudio();
      stopSourceTimelineAudio();
      manualSourceNarration.stop();
      return;
    }
    if(narrationRequest.trackId){
      const exact=narrationTracks.find(track=>track.id===narrationRequest.trackId);
      if(exact)playNarrationTrack(exact);
      return;
    }
    if (manualSourcePlan) {
      if(terminalPolicy&&!canStartSourceManual())return;
      stopNarrationTrack(); stopInteractiveAudio(); stopTimelineAudioNow(); stopActivityAudio(); stopSourceTimelineAudio();
      void manualSourceNarration.play(); return;
    }
    if((sourceTimelineBlockedCue||sourceTimelineAudioStopped)&&retrySourceTimelineAudio())return;
    if (activityAudioState.status === 'blocked' && retryActivityAudio()) return;
    const track = narrationTracks[0];
    if (!track) return;
    if (playingNarrationTrackId === track.id) {
      toggleNarrationTrack(track);
      return;
    }
    playNarrationTrack(track);
    };
    const pending: {order:number;run:()=>void}[]=[];
    if(publicPlayRequest && publicPlayRequest.requestId!==lastPublicPlayRequest.current)
      pending.push({order:publicPlayRequest.commandOrder??publicPlayRequest.requestId,run:publicCommand});
    if(narrationRequest && narrationRequest.requestId!==lastNarrationRequestRef.current)
      pending.push({order:narrationRequest.commandOrder??narrationRequest.requestId,run:narrationCommand});
    pending.sort((a,b)=>a.order-b.order).forEach(command=>command.run());
  }, [
    publicPlayRequest,modernTextEnabled,animationModule,frameDomain?.id,sourceEvidenceCapture,context?.captureFrame,
    retireSourceInstances,nextSignalSequence,lessonPlaybackIdentity,restartSourceClock,
    narrationRequest,
    narrationTracks,
    playNarrationTrack,
    playingNarrationTrackId,
    stopNarrationTrack,
    stopInteractiveAudio,
    stopTimelineAudioNow,
    toggleNarrationTrack,
    activityAudioState.status,
    stopActivityAudio,
    retryActivityAudio,
    sourceTimelineBlockedCue,
    sourceTimelineAudioStopped,
    stopSourceTimelineAudio,
    retrySourceTimelineAudio,
    manualSourcePlan,
    terminalPolicy,canStartSourceManual,
    manualSourceNarration.play,
    manualSourceNarration.stop,
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
      && (request.type === 'play-audio' || request.type === 'stop-audio' || request.type === 'pause-audio' || request.type === 'resume-audio')
    ) {
      return undefined;
    }
    const currentSourceContext = sourceKeyRequestContext.current;
    const sourceKeyRequest = request.type === 'open-keyterm-by-source-key';
    const keyTerms = sourceKeyRequest
      ? (currentSourceContext.modernTextEnabled ? currentSourceContext.animationModule?.textPresentation?.keyTerms : undefined)
      : (modernTextEnabled ? animationModule?.textPresentation?.keyTerms : undefined);
    const isModernKeyTermRequest = sourceKeyRequest || Boolean(keyTerms && (request.type === 'open-keyterm' || request.type === 'close-keyterm'));
    if (isModernKeyTermRequest
      ? !lessonTextKeyTermRequestAllowed(keyTerms, request,
          sourceKeyRequest ? currentSourceContext.animationModule?.key ?? '' : animationModule!.key,
          currentSourceContext)
      : !moduleDeclaresLessonHostRequest(animationModule, request)) {
      return undefined;
    }
    if (
      (request.type === 'play-audio' || request.type === 'resume-audio') &&
      (narrationDisabled ||
        !interactiveAudioAssets.some((asset) => asset.id === request.cueId))
    ) {
      return undefined;
    }
    if (
      (request.type === 'stop-audio' || request.type === 'pause-audio') &&
      request.cueId !== undefined &&
      !interactiveAudioAssets.some((asset) => asset.id === request.cueId)
    ) {
      return undefined;
    }
    const decision = onLessonHostRequest
      ? onLessonHostRequest(request, isModernKeyTermRequest
        ? {...hostContext, keyTermIndexLanguage: keyTerms!.indexLanguage} : hostContext)
      : directRendererAudioHostAvailable &&
          (request.type === 'play-audio' || request.type === 'stop-audio' || request.type === 'pause-audio' || request.type === 'resume-audio')
        ? directAudioLessonHost.dispatch(request)
        : undefined;
    if (decision?.status === 'allowed' && request.type === 'play-audio') {
      playInteractiveAudio(request.cueId);
    }
    if (decision?.status === 'allowed' && request.type === 'pause-audio') pauseInteractiveAudio(request.cueId);
    if (decision?.status === 'allowed' && request.type === 'resume-audio') resumeInteractiveAudio(request.cueId);
    if (decision?.status === 'allowed' && request.type === 'stop-audio') {
      stopInteractiveAudio(request.cueId);
    }
    if (
      decision?.status === 'allowed' &&
      (request.type === 'open-keyterm' || request.type === 'open-keyterm-by-source-key') &&
      request.playbackDisposition ===
        'source-stop-timeline-and-audio-until-explicit-resume'
    ) {
      pauseTimelineNow();
      stopNarrationTrack();
      stopTimelineAudioNow();
      stopSourceTimelineAudio();
    }
    return decision;
  }, [
    audioEnabled,
    animationModule,
    modernTextEnabled,
    directAudioLessonHost,
    directRendererAudioHostAvailable,
    interactiveAudioAssets,
    narrationDisabled,
    onLessonHostRequest,
    pauseTimelineNow,
    playInteractiveAudio,
    stopInteractiveAudio,
    pauseInteractiveAudio,
    resumeInteractiveAudio,
    stopNarrationTrack,
    stopTimelineAudioNow,
    stopSourceTimelineAudio,
  ]);
  const rendererLessonHostRequest =
    (onLessonHostRequest || directRendererAudioHostAvailable) &&
      (animationModule?.lessonHost?.capabilities.length || (modernTextEnabled && animationModule?.textPresentation?.keyTerms))
      ? handleRendererLessonHostRequest
      : undefined;
  const explicitTextCompletion = (modernTextEnabled ? animationModule?.textPresentation?.completion : undefined)
    ?? animationModule?.interactionCompletion;
  const completionIdentity = `${playbackIdentity}:${replay}:${animationModule?.textPresentation?.binding.version ?? ''}`;
  const [completedInteractionIdentity,setCompletedInteractionIdentity] = useState<string | null>(null);
  const requestLessonCompletion = useCallback<NonNullable<AnimationRendererProps['onLessonCompletionRequest']>>((request)=>{
    if (!lessonTextCompletionAllowed(explicitTextCompletion,request,{frame,frameDomain:frameDomain?.id??'',
      seed:playbackContext?.seed??0,replay,capture:sourceEvidenceCapture||context?.captureFrame!==undefined}))return false;
    setCompletedInteractionIdentity(completionIdentity);
    return true;
  },[explicitTextCompletion,frame,frameDomain?.id,playbackContext?.seed,replay,sourceEvidenceCapture,context?.captureFrame,completionIdentity]);
  const playbackComplete = Boolean(
    animationModule &&
      activeMovie &&
      !captureIdentityFailure &&
      (explicitTextCompletion ? completedInteractionIdentity===completionIdentity : playbackReachedEnd({
        captureFrame: context?.captureFrame,
        fps: activeMovie.fps,
        frame: textFrameControl ? frame : liveFrame,
        playbackEndFrame: resolvePlaybackEndFrame(
          activeMovie,
          textFrameControl && textFrameControl.frameDomain === frameDomain?.id ? textFrameControl.completionFrame : playbackEndFrame,
        ),
        reducedMotion: textFrameControl && reduced === true ? false : reduced,
        rendererDomainSupported,
      })),
  );
  const reportedCompletionRef = useRef<string | null>(null);
  useEffect(() => {
    if (!playbackComplete) return;
    if (reportedCompletionRef.current === completionIdentity) return;
    reportedCompletionRef.current = completionIdentity;
    onPlaybackComplete?.();
  }, [completionIdentity, onPlaybackComplete, playbackComplete]);
  if (loaded.key === moduleKey && loaded.failed) return <p className="runtime-unavailable" data-source-preparation-status="error" data-animation-id={moduleKey}>{labels.unavailable}</p>;
  if (!animationModule || !context || !runtimeMetadata || !frameDomain || !activeMovie || !playbackContext || !state) return <p aria-live="polite" className="runtime-unavailable" data-source-preparation-status="loading" data-animation-id={moduleKey}>{labels.loading}</p>;
  const textPresentation = modernTextEnabled
    ? animationModule.textPresentation
    : undefined;
  const modernTextPresentation = Boolean(textPresentation?.Renderer);
  const Renderer = textPresentation?.Renderer ?? animationModule.Renderer;
  const onReplay = () => {
    stopNarrationTrack('replay');
    stopInteractiveAudio();
    stopTimelineAudioNow();
    stopActivityAudio();
    stopSourceTimelineAudio();
    manualSourceNarration.stop();
    setReplay((value) => value + 1);
    onReplayCallback?.();
  };
  if (gs003EntryRejected) return <p className="runtime-unavailable" data-source-preparation-status="error" data-animation-id={moduleKey}>{labels.unavailable}</p>;
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
  const ir001HostOwnsLanguageDisclosure = sourceLanguageDisclosure === 'ir001-host'
    && animationId === 'course-g04-l03-ir-001-341242cc'
    && moduleKey === 'course-g04-l03-ir-001-341242cc'
    && presentation === 'legacy-shell' && !sourceEvidenceCapture
    && context?.captureFrame === undefined;
  const compatibleLoadedSwfHostAsset =
    !modernTextPresentation && loadedSwfHostAsset?.sourceProvenLanguage === playbackContext.lang
      ? loadedSwfHostAsset
      : undefined;
  return <div className={`runtime-shell${capture ? ' runtime-shell--capture' : ''}`} data-source-preparation-status="ready" data-source-audio-preparation-status={sourceAudioPreparation.status} data-source-stop-frame={sourceStopFrame} data-source-held={frame >= sourceStopFrame ? 'true' : 'false'} data-source-clock-enabled={running ? 'true' : 'false'} data-source-running={running && frame < sourceStopFrame && !sourceActivityBlocksParent(lessonActivities) ? 'true' : 'false'} data-audio-available={audioAvailable ? 'true' : 'false'} data-host-audio-timeline-paused={hostAudioPaused ? 'true' : 'false'} data-interactive-audio-playing={playingInteractiveAudioId ?? undefined} data-lesson-activity-audio-enabled={sourceActivityAudioEnabled ? 'true' : 'false'} data-lesson-activity-audio-status={activityAudioState.status} data-lesson-activity-audio-id={activityAudioState.activityId ?? undefined} data-manual-source-narration-status={manualSourceNarration.status} data-manual-source-narration-range={manualSourcePlan ? `${manualSourceRange.firstFrame}:${manualSourceRange.endFrameExclusive}` : undefined} data-source-timeline-audio-enabled={sourceTimelineAudioEnabled ? 'true' : 'false'} data-source-timeline-audio-status={sourceTimelineBlockedCue ? 'blocked' : sourceTimelineAudioStopped ? 'stopped' : sourceTimelineAudioSounding ? 'playing' : sourceTimelineAudioEnabled && !sourceTimelineAudioMayRun ? 'held' : 'waiting'} data-product-audio-enabled={audioEnabled ? 'true' : 'false'} data-runtime-audio-language={resolvedAudioLanguage} data-runtime-playback-complete={playbackComplete ? 'true' : 'false'} data-runtime-paused={paused ? 'true' : 'false'} data-runtime-presentation={presentation} data-lesson-presentation={modernTextPresentation ? 'modern-text-v1' : undefined} data-lesson-text-binding={modernTextPresentation ? textPresentation?.binding.version : undefined} data-runtime-replay={replay} data-runtime-transport={transportEnabledForDomain ? 'visual-frame-inspector' : 'none'} data-runtime-volume={Math.max(0, Math.min(1, volume))} data-source-transport-parity="not-established" style={{'--flash-stage-width': `${runtimeMetadata.stage.width}px`, '--flash-stage-height': `${runtimeMetadata.stage.height}px`, '--flash-stage-aspect': `${runtimeMetadata.stage.width} / ${runtimeMetadata.stage.height}`} as CSSProperties}>
    {/* The lesson shell owns narration: it renders a permanent, designed
        control in its top bar and drives these same tracks through
        `narrationRequest`, so the runtime adds no floating button of its own. */}
    {presentation === 'legacy-shell'
      ? null
      : <div className="runtime-toolbar">{presentation === 'workbench' ? <div><span className="prototype-badge">{labels.prototype}</span><span>{runtimeMetadata.stage.width} × {runtimeMetadata.stage.height}</span><span>{runtimeMetadata.fps} FPS</span><span>{runtimeMetadata.frameCount} root frames</span>{playbackContext.frameDomain !== 'root' ? <span>{playbackContext.frameDomain}: {activeMovie.frameCount} frames</span> : null}</div> : <div><span className="prototype-badge">{labels.prototype}</span></div>}<div className="runtime-toolbar__actions"><HostAudioControlsView disabled={narrationDisabled} lang={resolvedAudioLanguage} playing={playingNarrationTrackId} pausedTrackId={pausedNarrationTrackId} toggle={toggleNarrationTrack} tracks={narrationTracks} /><button data-replay-keyboard="enter-space" disabled={context.captureFrame !== undefined} onClick={onReplay} onKeyDown={(event) => {if (event.key === ' ' || event.code === 'Space') event.preventDefault();}} onKeyUp={(event) => {if (event.key === ' ' || event.code === 'Space') {event.preventDefault(); onReplay();}}} type="button">{labels.replay}</button></div></div>}
    {reduced === true && context.captureFrame === undefined ? <p className="reduced-motion-note" role="status">{labels.reduced}</p> : null}
    {modernTextPresentation && typographyLanguages.usesEnglishFallback && !ir001HostOwnsLanguageDisclosure
      ? <p className="lesson-text-language-note" lang="es" data-lesson-text-language="en" data-spanish-translation="missing">Texto original en inglés. No hay una traducción verificada de esta página al español.</p>
      : null}
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
        : <Renderer lessonPlaybackIdentity={lessonPlaybackIdentity} hostAudioTrackStart={hostAudioTrackStart} hostAudioTrackEvent={hostAudioTrackEvent} lessonPlayCommand={lessonPlayCommand} onLessonActivityCancel={textActivityTimelines?.length ? cancelLessonActivity : undefined}
          activeInteractiveAudioId={playingInteractiveAudioId} pausedInteractiveAudioId={pausedInteractiveAudioId} audioEnabled={audioEnabled} entryStateSha256={playbackContext.entryStateSha256} frame={playbackContext.frame} frameDomain={playbackContext.frameDomain} key={rendererKey} lang={playbackContext.lang} onLessonHostRequest={rendererLessonHostRequest} onGs002GameStart={onGs002GameStart && lessonPlacementId === 'g04-l08-placement-035' && animationModule.key === 'course-g04-l08-gs-002' && modernTextPresentation ? requestGs002GameStart : undefined} gs003EntryLevel={gs003EntryLevel} onLessonFrameRequest={textFrameControl ? requestLessonFrame : undefined} onLessonActivityRequest={textActivityTimelines?.length ? requestLessonActivity : undefined} onLessonActivitiesRequest={textActivityTimelines?.length ? requestLessonActivities : undefined} onLessonButtonActivityRequest={textActivityTimelines?.some(activity=>activity.buttonPress) ? requestLessonButtonActivity : undefined} onLessonCompletionRequest={explicitTextCompletion ? requestLessonCompletion : undefined} lessonActivity={lessonActivity} lessonActivities={lessonActivities} onReplay={onReplay} pageInteractionCompanionTargetId={pageInteractionCompanionTargetId} pageInteractionStageTargetId={pageInteractionStageTargetId} paused={paused || hostAudioPaused} reducedMotion={reduced === true} replay={playbackContext.replay} requirementId={playbackContext.requirementId} rootFrame={playbackContext.rootFrame} scenario={playbackContext.scenario} seed={playbackContext.seed} state={state} traceId={playbackContext.traceId} uiLanguage={typographyLanguages.uiLanguage} />}
    </div>
  </div>;
}
