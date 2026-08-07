import type {
  AnimationLanguage,
  AnimationRuntimeMetadata,
  MovieMetadata,
  RuntimeContext
} from '../contract';

export const COURSE_G03_L06_TI_001_SOURCE = Object.freeze({
  swf: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L6/TI/L6TI01.swf',
  swfSha256: '722b56b73cfc3bcff71c83cf71b00bfc89b4fdd3b147ecb43646f644f45dc739',
  rootFrameCount: 10,
  rootBeginFrame: 6,
  localObjectId: 21,
  localTimelineId: 'sprite-21',
  localFrameCount: 142,
  randomSelectionFrame: 1,
  randomAudioStartFrame: 5,
  soundInstancesRemovalFrame: 137,
  soundTimelineTerminalFrame: 135
});

export const COURSE_G03_L06_TI_001_RUNTIME: AnimationRuntimeMetadata = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  frameCount: COURSE_G03_L06_TI_001_SOURCE.rootFrameCount,
  durationMs: (COURSE_G03_L06_TI_001_SOURCE.rootFrameCount * 1_000) / 12,
  frameDomains: Object.freeze([
    Object.freeze({
      id: COURSE_G03_L06_TI_001_SOURCE.localTimelineId,
      frameCount: COURSE_G03_L06_TI_001_SOURCE.localFrameCount,
      rootFrame: COURSE_G03_L06_TI_001_SOURCE.rootBeginFrame
    })
  ]),
  defaultFrameDomain: COURSE_G03_L06_TI_001_SOURCE.localTimelineId
});

// Compatibility metadata for the existing local-sprite Canvas renderer. The
// authoritative shipped SWF metadata is COURSE_G03_L06_TI_001_RUNTIME above.
export const COURSE_G03_L06_TI_001_MOVIE: MovieMetadata = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  frameCount: 142,
  durationMs: (142 * 1_000) / 12
});

export const COURSE_G03_L06_TI_001_SCENARIOS = Object.freeze([
  'sound-from-seed',
  'sound-0',
  'sound-1',
  'root-standalone'
] as const);

export type CourseG03L06Ti001Scenario = (typeof COURSE_G03_L06_TI_001_SCENARIOS)[number];

interface CourseG03L06Ti001BaseFrameState {
  readonly frame: number;
  readonly exportFrame: number;
  readonly scenario: CourseG03L06Ti001Scenario;
  readonly language: AnimationLanguage;
  readonly seed: number;
  readonly audioRendered: boolean;
  readonly sourceSwfSha256: typeof COURSE_G03_L06_TI_001_SOURCE.swfSha256;
}

export interface CourseG03L06Ti001RootFrameState extends CourseG03L06Ti001BaseFrameState {
  readonly frameDomain: 'root';
  readonly rootFrame: number;
  readonly status: 'ready';
  readonly blocker: null;
  readonly structuralVisual: 'uniform-source-background';
  readonly captureAuthority: 'direct-seek-structural-not-natural-playback';
  readonly naturalPlaybackStopFrame: 1;
  readonly visualLocalizationStatus: 'language-neutral-root-background';
  readonly audioLocalizationStatus: 'not-applicable';
}

export interface CourseG03L06Ti001LocalFrameState extends CourseG03L06Ti001BaseFrameState {
  readonly frameDomain: 'sprite-21';
  readonly rootFrame: 6;
  readonly status: 'ready';
  readonly blocker: null;
  readonly visualLocalizationStatus: 'source-shared-untranslated-visual';
  readonly audioLocalizationStatus: 'unresolved';
  readonly scenarioAuthority: 'implementation-capture-projection' | 'source-random-outcome-requirement';
  readonly soundOutcome: 0 | 1;
  readonly selectedSound: 'Mc_Sound_0' | 'Mc_Sound_1';
  readonly soundInstancesPresent: boolean;
  readonly selectedSoundLocalFrame: number | null;
  readonly selectedSoundLocalFrameAuthority:
    | 'source-exact-stopped-frame-1'
    | 'source-exact-goto-and-play-frame-2-request'
    | 'runtime-tick-phase-unresolved'
    | 'source-exact-parent-removal';
  readonly audioStartRequested: boolean;
  readonly audioPlaybackWindowOpen: boolean;
  readonly terminalStopReached: boolean;
  readonly playbackState: 'source-content-running-or-runtime-phase-unresolved' | 'source-terminal-stop';
  readonly visualBranchIndependent: true;
}

export type CourseG03L06Ti001FrameState =
  | CourseG03L06Ti001RootFrameState
  | CourseG03L06Ti001LocalFrameState;

export function normalizeCourseG03L06Ti001Frame(frame: number): number {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(COURSE_G03_L06_TI_001_MOVIE.frameCount, Math.max(1, Math.floor(frame)));
}

export function normalizeCourseG03L06Ti001RootFrame(frame: number): number {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(
    COURSE_G03_L06_TI_001_SOURCE.rootFrameCount,
    Math.max(1, Math.floor(frame))
  );
}

function normalizeScenario(
  value: string,
  frameDomain: 'root' | 'sprite-21'
): CourseG03L06Ti001Scenario {
  if (frameDomain === 'root') return 'root-standalone';
  return value === 'sound-0' || value === 'sound-1' || value === 'sound-from-seed'
    ? value
    : 'sound-from-seed';
}

type CourseG03L06Ti001FrameContext = Pick<
  RuntimeContext,
  'scenario' | 'lang' | 'seed' | 'frameDomain' | 'rootFrame'
>;
type CourseG03L06Ti001RootFrameContext = Omit<
  CourseG03L06Ti001FrameContext,
  'frameDomain'
> & {readonly frameDomain: 'root'};
type CourseG03L06Ti001LocalFrameContext = Omit<
  CourseG03L06Ti001FrameContext,
  'frameDomain'
> & {readonly frameDomain?: 'sprite-21'};

export function getCourseG03L06Ti001FrameState(
  frame: number,
  context: CourseG03L06Ti001RootFrameContext
): CourseG03L06Ti001RootFrameState;
export function getCourseG03L06Ti001FrameState(
  frame: number,
  context: CourseG03L06Ti001LocalFrameContext
): CourseG03L06Ti001LocalFrameState;
export function getCourseG03L06Ti001FrameState(
  frame: number,
  context: CourseG03L06Ti001FrameContext
): CourseG03L06Ti001FrameState;
export function getCourseG03L06Ti001FrameState(
  frame: number,
  context: CourseG03L06Ti001FrameContext
): CourseG03L06Ti001FrameState {
  const frameDomain = context.frameDomain === 'root' ? 'root' : 'sprite-21';
  const normalizedFrame = frameDomain === 'root'
    ? normalizeCourseG03L06Ti001RootFrame(frame)
    : normalizeCourseG03L06Ti001Frame(frame);
  const scenario = normalizeScenario(context.scenario, frameDomain);
  const language = context.lang === 'es' ? 'es' : 'en';
  const seed = Number.isSafeInteger(context.seed) ? context.seed >>> 0 : 0;

  if (frameDomain === 'root') {
    return Object.freeze({
      frame: normalizedFrame,
      exportFrame: normalizedFrame - 1,
      frameDomain: 'root',
      rootFrame: normalizedFrame,
      scenario,
      language,
      seed,
      status: 'ready',
      blocker: null,
      structuralVisual: 'uniform-source-background',
      captureAuthority: 'direct-seek-structural-not-natural-playback',
      naturalPlaybackStopFrame: 1,
      visualLocalizationStatus: 'language-neutral-root-background',
      audioLocalizationStatus: 'not-applicable',
      audioRendered: false,
      sourceSwfSha256: COURSE_G03_L06_TI_001_SOURCE.swfSha256
    });
  }

  const soundOutcome: 0 | 1 = scenario === 'sound-0' ? 0 : scenario === 'sound-1' ? 1 : seed % 2 === 0 ? 0 : 1;
  const selectedSound = soundOutcome === 0 ? 'Mc_Sound_0' : 'Mc_Sound_1';
  const soundInstancesPresent = normalizedFrame < COURSE_G03_L06_TI_001_SOURCE.soundInstancesRemovalFrame;
  const selectedSoundLocalFrame = !soundInstancesPresent
    ? null
    : normalizedFrame < COURSE_G03_L06_TI_001_SOURCE.randomAudioStartFrame
      ? 1
      : normalizedFrame === COURSE_G03_L06_TI_001_SOURCE.randomAudioStartFrame
        ? 2
        : null;
  const selectedSoundLocalFrameAuthority = !soundInstancesPresent
    ? 'source-exact-parent-removal'
    : normalizedFrame < COURSE_G03_L06_TI_001_SOURCE.randomAudioStartFrame
      ? 'source-exact-stopped-frame-1'
      : normalizedFrame === COURSE_G03_L06_TI_001_SOURCE.randomAudioStartFrame
        ? 'source-exact-goto-and-play-frame-2-request'
        : 'runtime-tick-phase-unresolved';

  return Object.freeze({
    frame: normalizedFrame,
    exportFrame: normalizedFrame - 1,
    frameDomain: 'sprite-21',
    rootFrame: 6,
    scenario,
    language,
    seed,
    status: 'ready',
    blocker: null,
    visualLocalizationStatus: 'source-shared-untranslated-visual',
    audioLocalizationStatus: 'unresolved',
    scenarioAuthority:
      scenario === 'sound-from-seed'
        ? 'implementation-capture-projection'
        : 'source-random-outcome-requirement',
    soundOutcome,
    selectedSound,
    soundInstancesPresent,
    selectedSoundLocalFrame,
    selectedSoundLocalFrameAuthority,
    audioStartRequested:
      normalizedFrame === COURSE_G03_L06_TI_001_SOURCE.randomAudioStartFrame,
    audioPlaybackWindowOpen:
      normalizedFrame >= COURSE_G03_L06_TI_001_SOURCE.randomAudioStartFrame &&
      soundInstancesPresent,
    terminalStopReached: normalizedFrame === COURSE_G03_L06_TI_001_SOURCE.localFrameCount,
    playbackState:
      normalizedFrame === COURSE_G03_L06_TI_001_SOURCE.localFrameCount
        ? 'source-terminal-stop'
        : 'source-content-running-or-runtime-phase-unresolved',
    visualBranchIndependent: true,
    audioRendered: true,
    sourceSwfSha256: COURSE_G03_L06_TI_001_SOURCE.swfSha256
  });
}
