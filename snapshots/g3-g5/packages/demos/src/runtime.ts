import type {
  AnimationLanguage,
  AudioCue,
  AnimationPlaybackMode,
  AnimationRuntimeMetadata,
  FrameDomainMetadata,
  MovieMetadata,
  ResolvedRuntimeContext,
  RuntimeContext,
  RuntimeScenario
} from './contract';

export {
  BLOCKED_LEGACY_HOST_OPERATIONS,
  FAIL_CLOSED_LESSON_HOST_DEFAULTS,
  KEYTERM_PLAYBACK_DISPOSITIONS,
  LESSON_HOST_CAPABILITIES,
  createMemoryOnlyLessonHost,
} from './lesson-host-contract';
export type {
  BlockedLegacyHostOperation,
  KeytermPlaybackDisposition,
  LessonHostCapability,
  LessonHostCapabilityDescriptor,
  LessonHostDecision,
  LessonHostLanguage,
  LessonHostMode,
  LessonHostRequest,
  LessonHostState,
  MemoryOnlyLessonHost,
  MemoryOnlyLessonHostConfig,
} from './lesson-host-contract';

type QueryValue = string | string[] | undefined;

function first(value: QueryValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseEntryStateSha256(value: QueryValue): string {
  const raw = first(value)?.trim().toLowerCase() ?? '';
  return /^[a-f0-9]{64}$/.test(raw) ? raw : '';
}

export function clampFrame(frame: number, frameCount: number): number {
  if (!Number.isFinite(frame) || !Number.isFinite(frameCount) || frameCount < 1) {
    return 1;
  }

  return Math.min(Math.trunc(frameCount), Math.max(1, Math.trunc(frame)));
}

export function parseFrame(value: QueryValue, frameCount: number): number | undefined {
  const raw = first(value)?.trim();
  if (!raw || !/^\d+$/.test(raw)) return undefined;

  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return undefined;
  return clampFrame(parsed, frameCount);
}

export function parseLanguage(value: QueryValue): AnimationLanguage {
  return first(value)?.toLowerCase() === 'es' ? 'es' : 'en';
}

export function parseSeed(value: QueryValue): number {
  const raw = first(value)?.trim();
  if (!raw || !/^-?\d+$/.test(raw)) return 0;

  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed)) return 0;
  return parsed >>> 0;
}

export function parseScenario(
  value: QueryValue,
  scenarios: readonly RuntimeScenario[],
  preferredFallback?: string
): string {
  const preferred = preferredFallback?.trim();
  const fallback = scenarios.some((scenario) => scenario.id === preferred)
    ? preferred!
    : scenarios[0]?.id ?? 'default';
  const requested = first(value)?.trim();
  return scenarios.some((scenario) => scenario.id === requested) ? requested! : fallback;
}

/**
 * Production audio may use only repository-local paths. A simple leading
 * slash check is insufficient because protocol-relative and backslash URLs
 * can navigate to another origin after WHATWG URL normalization.
 */
export function isSameOriginAssetSource(source: string): boolean {
  if (source !== source.trim() || !source.startsWith('/') || source.startsWith('//')) {
    return false;
  }
  try {
    return new URL(source, 'https://helpmath.local').origin === 'https://helpmath.local';
  } catch {
    return false;
  }
}

function validFrameDomain(domain: FrameDomainMetadata): boolean {
  return Boolean(
    domain.id.trim() &&
      Number.isSafeInteger(domain.frameCount) &&
      domain.frameCount >= 1 &&
      (domain.fps === undefined || (Number.isFinite(domain.fps) && domain.fps > 0)) &&
      (domain.rootFrame === undefined ||
        (Number.isSafeInteger(domain.rootFrame) && domain.rootFrame >= 1))
  );
}

export function listFrameDomains(
  runtime: AnimationRuntimeMetadata
): readonly FrameDomainMetadata[] {
  const root = Object.freeze({
    id: 'root',
    frameCount: Math.max(1, Math.trunc(runtime.frameCount))
  });
  const declared = (runtime.frameDomains ?? []).filter(
    (domain) => validFrameDomain(domain) && domain.id !== 'root'
  );

  // `runtime.frameCount` is always the shipped SWF root timeline, so the root
  // domain remains addressable even when compatibility metadata also exposes
  // one or more nested MovieClip timelines. Coverage requirements such as the
  // source root-shell trace must never silently fall back to a nested default.
  return Object.freeze([root, ...declared]);
}

export function resolveFrameDomain(
  runtime: AnimationRuntimeMetadata,
  requested?: QueryValue
): FrameDomainMetadata {
  const domains = listFrameDomains(runtime);
  const requestedId = first(requested)?.trim();
  const defaultId = runtime.defaultFrameDomain?.trim();
  return (
    domains.find((domain) => domain.id === requestedId) ??
    domains.find((domain) => domain.id === defaultId) ??
    domains[0]!
  );
}

export function frameDomainMovie(
  runtime: AnimationRuntimeMetadata,
  domain: FrameDomainMetadata
): MovieMetadata {
  const fps = domain.fps ?? runtime.fps;
  return Object.freeze({
    stage: runtime.stage,
    fps,
    frameCount: domain.frameCount,
    durationMs: (domain.frameCount * 1000) / fps
  });
}

/**
 * Multi-domain renderers must prove that their pure frame state belongs to the
 * requested domain. The product shell must not claim `root` while a legacy
 * candidate silently returns its default nested MovieClip state.
 */
export function stateSupportsFrameDomain(
  state: unknown,
  requestedDomainId: string,
  runtime: AnimationRuntimeMetadata
): boolean {
  if (listFrameDomains(runtime).length <= 1) return true;
  if (!state || typeof state !== 'object' || !("frameDomain" in state)) return false;
  const reportedDomain = (state as {readonly frameDomain?: unknown}).frameDomain;
  return typeof reportedDomain === 'string' && reportedDomain === requestedDomainId;
}

/**
 * Fail closed when a renderer normalizes an invalid scenario/language request
 * to a different state. Without this check the host could report the query
 * identity while the visual stage rendered another scenario.
 */
export function stateSupportsRuntimeContext(
  state: unknown,
  context: Pick<ResolvedRuntimeContext, 'frameDomain' | 'scenario' | 'lang'>,
  runtime: AnimationRuntimeMetadata
): boolean {
  if (!stateSupportsFrameDomain(state, context.frameDomain, runtime)) return false;
  if (!state || typeof state !== 'object') return listFrameDomains(runtime).length <= 1;
  const candidate = state as {
    readonly scenario?: unknown;
    readonly language?: unknown;
  };
  if ('scenario' in candidate && candidate.scenario !== context.scenario) return false;
  if ('language' in candidate && candidate.language !== context.lang) return false;
  return true;
}

function rootFrameFor(frame: number, domain: FrameDomainMetadata): number {
  return domain.id === 'root' ? frame : domain.rootFrame ?? 1;
}

export function frameToElapsedMs(frame: number, movie: MovieMetadata): number {
  const normalized = clampFrame(frame, movie.frameCount);
  return ((normalized - 1) * 1000) / movie.fps + 0.001;
}

export function resolveReducedMotionFrame(
  movie: MovieMetadata,
  requestedFrame?: number
): number {
  return requestedFrame === undefined ? 1 : clampFrame(requestedFrame, movie.frameCount);
}

export function resolvePlaybackEndFrame(
  movie: MovieMetadata,
  requestedFrame?: number
): number {
  return requestedFrame === undefined
    ? clampFrame(movie.frameCount, movie.frameCount)
    : clampFrame(requestedFrame, movie.frameCount);
}

/**
 * Resolve a live one-indexed Flash frame from elapsed playback time.
 * Deterministic `?frame=` capture does not call this helper and remains frozen.
 */
export function frameAtElapsedMs(
  elapsedMs: number,
  movie: MovieMetadata,
  playbackMode: AnimationPlaybackMode = 'once',
  playbackEndFrame?: number
): number {
  if (
    !Number.isFinite(elapsedMs) ||
    elapsedMs <= 0 ||
    !Number.isFinite(movie.fps) ||
    movie.fps <= 0 ||
    !Number.isFinite(movie.frameCount) ||
    movie.frameCount < 1
  ) {
    return 1;
  }

  const frameCount = resolvePlaybackEndFrame(movie, playbackEndFrame);
  const elapsedFrames = Math.floor(elapsedMs / (1000 / movie.fps));
  return playbackMode === 'loop'
    ? (elapsedFrames % frameCount) + 1
    : Math.min(frameCount, elapsedFrames + 1);
}

export function audioCueMatchesContext(
  cue: AudioCue,
  context: Readonly<{frameDomain: string; lang: AnimationLanguage; scenario: string; seed: number}>
): boolean {
  if (cue.frameDomain && cue.frameDomain !== context.frameDomain) return false;
  if (cue.language !== 'shared' && cue.language !== context.lang) return false;
  if (cue.scenario && cue.scenario !== context.scenario) return false;
  if (cue.seedModulo) {
    const divisor = Math.trunc(cue.seedModulo.divisor);
    const remainder = Math.trunc(cue.seedModulo.remainder);
    if (divisor < 1 || remainder < 0 || remainder >= divisor) return false;
    if (((context.seed % divisor) + divisor) % divisor !== remainder) return false;
  }
  return true;
}

export function resolveAudioCueTransition(
  cues: readonly AudioCue[],
  options: Readonly<{
    previousFrame: number;
    frame: number;
    fps: number;
    frameDomain: string;
    lang: AnimationLanguage;
    scenario: string;
    seed: number;
  }>
): Readonly<{
  start: readonly Readonly<{cue: AudioCue; offsetSeconds: number}>[];
  stopIds: readonly string[];
}> {
  const rewound = options.frame < options.previousFrame;
  const previousFrame = rewound ? 0 : Math.max(0, Math.trunc(options.previousFrame));
  const frame = Math.max(1, Math.trunc(options.frame));
  const matching = cues.filter((cue) => audioCueMatchesContext(cue, options));
  const stopIds = matching
    .filter((cue) => rewound || (cue.endFrame !== undefined && cue.endFrame > previousFrame && cue.endFrame <= frame))
    .map((cue) => cue.id);
  const fps = Number.isFinite(options.fps) && options.fps > 0 ? options.fps : 1;
  const start = matching
    .filter((cue) => Number.isSafeInteger(cue.frame) && cue.frame > previousFrame && cue.frame <= frame)
    .filter((cue) => cue.endFrame === undefined || frame < cue.endFrame)
    .map((cue) => Object.freeze({cue, offsetSeconds: Math.max(0, (frame - cue.frame) / fps)}));
  return Object.freeze({start: Object.freeze(start), stopIds: Object.freeze(stopIds)});
}

export function createRuntimeContext(
  query: {
    frame?: QueryValue;
    frameDomain?: QueryValue;
    scenario?: QueryValue;
    lang?: QueryValue;
    seed?: QueryValue;
    requirementId?: QueryValue;
    trace?: QueryValue;
    entryStateSha256?: QueryValue;
  },
  runtime: AnimationRuntimeMetadata,
  scenarios: readonly RuntimeScenario[],
  defaultScenarioByFrameDomain?: Readonly<Record<string, string>>
): ResolvedRuntimeContext & {readonly captureFrame?: number} {
  const domain = resolveFrameDomain(runtime, query.frameDomain);
  const captureFrame = parseFrame(query.frame, domain.frameCount);
  const frame = captureFrame ?? 1;
  const scenario = parseScenario(
    query.scenario,
    scenarios,
    defaultScenarioByFrameDomain?.[domain.id]
  );
  const lang = parseLanguage(query.lang);
  const traceId = first(query.trace)?.trim() || `${scenario}-${domain.id}-${lang}`;
  return {
    frame,
    frameDomain: domain.id,
    rootFrame: rootFrameFor(frame, domain),
    captureFrame,
    scenario,
    lang,
    seed: parseSeed(query.seed),
    traceId,
    requirementId: first(query.requirementId)?.trim() || `runtime-${traceId}`,
    entryStateSha256: parseEntryStateSha256(query.entryStateSha256),
    replay: 0
  };
}

/**
 * Produce the complete host-owned state for a live frame or Replay reset.
 * Renderer-private state is reset separately by the host remount key.
 */
export function createPlaybackContext(
  context: ResolvedRuntimeContext,
  frame: number,
  replay: number,
  domain: FrameDomainMetadata
): ResolvedRuntimeContext {
  const normalizedFrame = clampFrame(frame, domain.frameCount);
  return Object.freeze({
    frame: normalizedFrame,
    frameDomain: domain.id,
    rootFrame: rootFrameFor(normalizedFrame, domain),
    scenario: context.scenario,
    lang: context.lang,
    seed: context.seed,
    traceId: context.traceId,
    requirementId: context.requirementId,
    entryStateSha256: context.entryStateSha256,
    replay: Number.isSafeInteger(replay) && replay >= 0 ? replay : 0
  });
}
