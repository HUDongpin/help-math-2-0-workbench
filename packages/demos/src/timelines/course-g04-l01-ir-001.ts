import type {
  AnimationLanguage,
  AnimationRuntimeMetadata,
  MovieMetadata,
  RuntimeContext
} from '../contract';

export const COURSE_G04_L01_IR_001_SOURCE = Object.freeze({
  fla: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/IR/L1RW01.fla',
  flaSha256: 'c4ba5fd0b37b1a1ad622f4fdf89295a6b76c820588a8000b239b0f4d68984fb9',
  swf: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/IR/L1RW01.swf',
  swfSha256: 'b21b16d1e5756820b5703136708f625dcc3a324d629b2337b1dc42af64559e46',
  rootFrameCount: 10,
  rootBeginFrame: 6,
  rootStandaloneBaseline:
    'migrations/course-g04-l01-ir-001/baseline/adobe-flash-player-32-standalone-default.json',
  rootStandaloneBaselineSha256:
    '53bd9c14495a29241ad64899a6ceebe600a43ac782f4a2ebbf75fe5c4e532fb9',
  rootStandaloneAssetManifest:
    'public/flash-assets/courses/course-g04-l01-ir-001/root-standalone/manifest.json',
  localObjectId: 58,
  localTimelineId: 'sprite-58',
  localFrameCount: 142,
  randomSelectionFrame: 1,
  randomAudioStartFrame: 5,
  soundTimelineTerminalFrame: 135
});

export const COURSE_G04_L01_IR_001_ROOT_FRAME_ASSETS = Object.freeze([
  Object.freeze({frame: 1, file: 'frame-0001.png', sha256: 'a2dee8a9e10c4b5d4e4b683a4e3a534ea7614945479167b6c08de75c4bbc0aea'}),
  Object.freeze({frame: 2, file: 'frame-0002.png', sha256: 'a2dee8a9e10c4b5d4e4b683a4e3a534ea7614945479167b6c08de75c4bbc0aea'}),
  Object.freeze({frame: 3, file: 'frame-0003.png', sha256: 'a2dee8a9e10c4b5d4e4b683a4e3a534ea7614945479167b6c08de75c4bbc0aea'}),
  Object.freeze({frame: 4, file: 'frame-0004.png', sha256: 'a2dee8a9e10c4b5d4e4b683a4e3a534ea7614945479167b6c08de75c4bbc0aea'}),
  Object.freeze({frame: 5, file: 'frame-0005.png', sha256: 'a2dee8a9e10c4b5d4e4b683a4e3a534ea7614945479167b6c08de75c4bbc0aea'}),
  Object.freeze({frame: 6, file: 'frame-0006.png', sha256: 'a2dee8a9e10c4b5d4e4b683a4e3a534ea7614945479167b6c08de75c4bbc0aea'}),
  Object.freeze({frame: 7, file: 'frame-0007.png', sha256: '99c2a4bfa8bb7aae4d8bdaf1db33644151d95d59bb234b40bb08a1dd32a181b8'}),
  Object.freeze({frame: 8, file: 'frame-0008.png', sha256: 'b9436be29f1e104db68fcc9f9b07e482afee4b6b3e09933edef58e698cfa5e7c'}),
  Object.freeze({frame: 9, file: 'frame-0009.png', sha256: 'edb2b1cce1e9d73ff73918b4ebd0d9b4d3e8fb831f7f7bfe991bba377e8d751c'}),
  Object.freeze({frame: 10, file: 'frame-0010.png', sha256: '8cb1b9da53a255d4c46f7506bcd826b4c7e11d82b0c023f8ee6844bcd7b36aee'})
] as const);

export const COURSE_G04_L01_IR_001_RUNTIME: AnimationRuntimeMetadata = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  frameCount: COURSE_G04_L01_IR_001_SOURCE.rootFrameCount,
  durationMs: (COURSE_G04_L01_IR_001_SOURCE.rootFrameCount * 1_000) / 12,
  frameDomains: Object.freeze([
    Object.freeze({
      id: COURSE_G04_L01_IR_001_SOURCE.localTimelineId,
      frameCount: COURSE_G04_L01_IR_001_SOURCE.localFrameCount,
      rootFrame: COURSE_G04_L01_IR_001_SOURCE.rootBeginFrame
    })
  ]),
  defaultFrameDomain: COURSE_G04_L01_IR_001_SOURCE.localTimelineId
});

// Compatibility metadata for the existing local Canvas renderer. The shipped
// SWF root metadata is COURSE_G04_L01_IR_001_RUNTIME above.
export const COURSE_G04_L01_IR_001_MOVIE: MovieMetadata = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  frameCount: COURSE_G04_L01_IR_001_SOURCE.localFrameCount,
  durationMs: (COURSE_G04_L01_IR_001_SOURCE.localFrameCount * 1_000) / 12
});

export const COURSE_G04_L01_IR_001_SCENARIOS = Object.freeze([
  'sound-from-seed',
  'sound-0',
  'sound-1',
  'root-standalone'
] as const);

export type CourseG04L01Ir001Scenario = (typeof COURSE_G04_L01_IR_001_SCENARIOS)[number];
export type CourseG04L01Ir001FrameDomain = 'root' | 'sprite-58';

interface CourseG04L01Ir001BaseFrameState {
  readonly frame: number;
  readonly exportFrame: number;
  readonly frameDomain: CourseG04L01Ir001FrameDomain;
  readonly rootFrame: number;
  readonly scenario: CourseG04L01Ir001Scenario;
  readonly language: AnimationLanguage;
  readonly seed: number;
  readonly status: 'ready';
  readonly blocker: null;
  readonly visualLocalizationStatus: 'source-shared-untranslated-visual';
  readonly audioLocalizationStatus: 'unresolved';
  readonly audioStatus: 'blocked-not-rendered';
  readonly audioRendered: false;
  readonly hostIntegrationStatus: 'blocked-not-reconstructed';
  readonly sourceSwfSha256: typeof COURSE_G04_L01_IR_001_SOURCE.swfSha256;
}

export interface CourseG04L01Ir001RootFrameState extends CourseG04L01Ir001BaseFrameState {
  readonly frameDomain: 'root';
  readonly scenario: 'root-standalone';
  readonly rootFrame: number;
  readonly rootAssetFile: string;
  readonly rootAssetSha256: string;
  readonly renderingAuthority: 'authoritative-adobe-standalone-capture-raster';
  readonly runtimeReachability: 'authoritative-standalone-step-only';
  readonly soundOutcome: null;
  readonly selectedSound: null;
  readonly selectedSoundLocalFrame: null;
  readonly audioStartRequested: false;
  readonly visualBranchIndependent: true;
}

export interface CourseG04L01Ir001LocalFrameState extends CourseG04L01Ir001BaseFrameState {
  readonly frameDomain: 'sprite-58';
  readonly rootFrame: 6;
  readonly scenario: Exclude<CourseG04L01Ir001Scenario, 'root-standalone'>;
  readonly renderingAuthority: 'source-structured-ffdec-vector-addressability';
  readonly runtimeReachability: 'source-structured-local-frame-addressability-only';
  readonly soundOutcome: 0 | 1;
  readonly selectedSound: 'Mc_Sound_0' | 'Mc_Sound_1';
  readonly selectedSoundLocalFrame: number;
  readonly audioStartRequested: boolean;
  readonly visualBranchIndependent: true;
}

export type CourseG04L01Ir001FrameState =
  | CourseG04L01Ir001RootFrameState
  | CourseG04L01Ir001LocalFrameState;

function normalizeFrame(frame: number, frameCount: number): number {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(frameCount, Math.max(1, Math.floor(frame)));
}

export function normalizeCourseG04L01Ir001Frame(frame: number): number {
  return normalizeFrame(frame, COURSE_G04_L01_IR_001_SOURCE.localFrameCount);
}

export function normalizeCourseG04L01Ir001RootFrame(frame: number): number {
  return normalizeFrame(frame, COURSE_G04_L01_IR_001_SOURCE.rootFrameCount);
}

export function getCourseG04L01Ir001RootFrameAsset(frame: number) {
  return COURSE_G04_L01_IR_001_ROOT_FRAME_ASSETS[
    normalizeCourseG04L01Ir001RootFrame(frame) - 1
  ];
}

function normalizeScenario(
  value: string,
  frameDomain: CourseG04L01Ir001FrameDomain
): CourseG04L01Ir001Scenario {
  if (frameDomain === 'root') return 'root-standalone';
  return value === 'sound-0' || value === 'sound-1' || value === 'sound-from-seed'
    ? value
    : 'sound-from-seed';
}

type CourseG04L01Ir001FrameContext = Pick<
  RuntimeContext,
  'scenario' | 'lang' | 'seed' | 'frameDomain'
>;

export function getCourseG04L01Ir001FrameState(
  frame: number,
  context: CourseG04L01Ir001FrameContext
): CourseG04L01Ir001FrameState {
  const frameDomain: CourseG04L01Ir001FrameDomain =
    context.frameDomain === 'root' ? 'root' : 'sprite-58';
  const normalizedFrame = frameDomain === 'root'
    ? normalizeCourseG04L01Ir001RootFrame(frame)
    : normalizeCourseG04L01Ir001Frame(frame);
  const scenario = normalizeScenario(context.scenario, frameDomain);
  const language: AnimationLanguage = context.lang === 'es' ? 'es' : 'en';
  const seed = Number.isSafeInteger(context.seed) ? context.seed >>> 0 : 0;
  const common = {
    frame: normalizedFrame,
    exportFrame: normalizedFrame - 1,
    language,
    seed,
    status: 'ready' as const,
    blocker: null,
    visualLocalizationStatus: 'source-shared-untranslated-visual' as const,
    audioLocalizationStatus: 'unresolved' as const,
    audioStatus: 'blocked-not-rendered' as const,
    audioRendered: false as const,
    hostIntegrationStatus: 'blocked-not-reconstructed' as const,
    sourceSwfSha256: COURSE_G04_L01_IR_001_SOURCE.swfSha256
  };

  if (frameDomain === 'root') {
    const asset = getCourseG04L01Ir001RootFrameAsset(normalizedFrame);
    return Object.freeze({
      ...common,
      frameDomain: 'root',
      rootFrame: normalizedFrame,
      scenario: 'root-standalone',
      rootAssetFile: asset.file,
      rootAssetSha256: asset.sha256,
      renderingAuthority: 'authoritative-adobe-standalone-capture-raster',
      runtimeReachability: 'authoritative-standalone-step-only',
      soundOutcome: null,
      selectedSound: null,
      selectedSoundLocalFrame: null,
      audioStartRequested: false,
      visualBranchIndependent: true
    });
  }

  const localScenario: Exclude<CourseG04L01Ir001Scenario, 'root-standalone'> =
    scenario === 'root-standalone' ? 'sound-from-seed' : scenario;
  const soundOutcome: 0 | 1 =
    localScenario === 'sound-0' ? 0 : localScenario === 'sound-1' ? 1 : seed % 2 === 0 ? 0 : 1;

  return Object.freeze({
    ...common,
    frameDomain: 'sprite-58',
    rootFrame: 6,
    scenario: localScenario,
    renderingAuthority: 'source-structured-ffdec-vector-addressability',
    runtimeReachability: 'source-structured-local-frame-addressability-only',
    soundOutcome,
    selectedSound: soundOutcome === 0 ? 'Mc_Sound_0' : 'Mc_Sound_1',
    selectedSoundLocalFrame:
      normalizedFrame < COURSE_G04_L01_IR_001_SOURCE.randomAudioStartFrame
        ? 1
        : Math.min(
            COURSE_G04_L01_IR_001_SOURCE.soundTimelineTerminalFrame,
            2 + normalizedFrame - COURSE_G04_L01_IR_001_SOURCE.randomAudioStartFrame
          ),
    audioStartRequested:
      normalizedFrame >= COURSE_G04_L01_IR_001_SOURCE.randomAudioStartFrame,
    visualBranchIndependent: true
  });
}
