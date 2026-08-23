import type {AnimationRuntimeMetadata, MovieMetadata, RuntimeContext} from '../contract';
import {buildG4L9P4SeededOrder, normalizeG4L9P4Seed} from '../g4-l9-p4-state-machines';

export const COURSE_G04_L09_GS_002_SOURCE = Object.freeze({
  swf: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L9/GS/L9GS02.swf',
  swfSha256: '41cdb7e5cc5735eef2af3e4831908c47781840f0addcc3ac1a2142cbb0d48f15',
  swfBytes: 3_994_465,
  externalSpanishAudio: 'public/flash-assets/audio/courses/course-g04-l09-gs-002/es.mp3',
  externalSpanishAudioSha256: 'fc1d611959deedae1d0ac4005b09c416fbd1711536c3190d190795798a4ad9d3',
  rootFrameCount: 10,
  localObjectId: 787,
  buttonTargetCount: 14,
  embeddedSoundStreamCount: 12,
  staticDrawingReadyEndFrame: 641,
  gameInitializationFrame: 642,
  firstQuestionFrame: 643,
  lastQuestionFrame: 652,
  finalFrame: 653,
  randomOpcodeCount: 1,
  sourceBehaviorAuthority:
    'static-actionscript-and-pcode-engineering-model-original-runtime-unvalidated',
});

export const COURSE_G04_L09_GS_002_ROOT_FRAME_ASSET_BASE =
  '/flash-assets/courses/course-g04-l09-gs-002/root-frames';
export const COURSE_G04_L09_GS_002_ROOT_VISUAL_LOCALIZATION =
  'source-shared-untranslated-en-es' as const;
export const COURSE_G04_L09_GS_002_ROOT_FRAME_ASSETS = Object.freeze(
  Array.from({length: 10}, (_, index) => Object.freeze({
    frame: index + 1,
    source: `${COURSE_G04_L09_GS_002_ROOT_FRAME_ASSET_BASE}/frame-${String(index + 1).padStart(4, '0')}.png`,
  })),
);

export const COURSE_G04_L09_GS_002_MOVIE: MovieMetadata = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  frameCount: 653,
  durationMs: 54_417,
});

export const COURSE_G04_L09_GS_002_RUNTIME: AnimationRuntimeMetadata = Object.freeze({
  stage: COURSE_G04_L09_GS_002_MOVIE.stage,
  fps: 12,
  frameCount: 10,
  durationMs: 833,
  defaultFrameDomain: 'sprite-787',
  frameDomains: Object.freeze([
    Object.freeze({id: 'root', frameCount: 10, fps: 12}),
    Object.freeze({id: 'sprite-787', frameCount: 653, fps: 12, rootFrame: 6}),
  ]),
});

export const COURSE_G04_L09_GS_002_SCENARIOS = Object.freeze([
  'root-standalone',
  'source-drawing-lead-in',
  'gs002-advanced-product',
] as const);
export type CourseG04L09Gs002Scenario =
  (typeof COURSE_G04_L09_GS_002_SCENARIOS)[number];
export type CourseG04L09Gs002FrameDomain = 'root' | 'sprite-787';
export type CourseG04L09Gs002Blocker =
  | 'unsupported-runtime-request'
  | 'frame-domain-scenario-mismatch'
  | 'spanish-visual-and-audio-not-source-proven';
export type CourseG04L09Gs002Phase =
  | 'root-inspection'
  | 'lead-in'
  | 'start'
  | 'question'
  | 'final';

export interface CourseG04L09Gs002FrameState {
  readonly frame: number;
  readonly frameDomain: CourseG04L09Gs002FrameDomain | string;
  readonly rootFrame: number;
  readonly exportFrame: number;
  readonly scenario: string;
  readonly language: 'en' | 'es';
  readonly seed: number;
  readonly replay: number;
  readonly status: 'ready' | 'blocked';
  readonly blocker: CourseG04L09Gs002Blocker | null;
  readonly phase: CourseG04L09Gs002Phase;
  readonly questionIndex: number | null;
  readonly questionOrder: readonly number[];
  readonly deterministicSeededRandom: true;
  readonly scoringResolved: true;
  readonly correctFeedbackResolved: true;
  readonly wrongFeedbackResolved: true;
  readonly finalResolved: true;
  readonly replayResolved: true;
  readonly glossaryIntentResolved: true;
  readonly courseRoutingIntentResolved: true;
  readonly legacyNetworkPolicy: 'deny-by-default';
  readonly networkCalls: 0;
  readonly avm1Executed: false;
  readonly originalRuntimeValidated: false;
  readonly fidelityAccepted: false;
  readonly audioAccepted: false;
  readonly visualLocalizationStatus:
    | 'english-source-engineering-model'
    | 'english-source-only-spanish-unresolved'
    | 'source-shared-untranslated-en-es';
}

export function normalizeCourseG04L09Gs002Frame(
  frame: number,
  frameDomain: CourseG04L09Gs002FrameDomain = 'sprite-787',
): number {
  const maximum = frameDomain === 'root' ? 10 : 653;
  const integer = Number.isFinite(frame) ? Math.trunc(frame) : 1;
  return Math.max(1, Math.min(maximum, integer));
}

export function buildCourseG04L09Gs002QuestionOrder(seed: number): readonly number[] {
  return Object.freeze(
    buildG4L9P4SeededOrder(10, normalizeG4L9P4Seed(seed)).map((index) => index + 1),
  );
}

function stateFor(
  frame: number,
  context: RuntimeContext,
  status: 'ready' | 'blocked',
  blocker: CourseG04L09Gs002Blocker | null,
): CourseG04L09Gs002FrameState {
  const domain = context.frameDomain ?? 'sprite-787';
  const normalized = normalizeCourseG04L09Gs002Frame(
    frame,
    domain === 'root' ? 'root' : 'sprite-787',
  );
  const phase: CourseG04L09Gs002Phase = domain === 'root'
    ? 'root-inspection'
    : normalized <= 641
      ? 'lead-in'
      : normalized === 642
        ? 'start'
        : normalized === 653
          ? 'final'
          : 'question';
  return Object.freeze({
    frame: normalized,
    frameDomain: domain,
    rootFrame: domain === 'root' ? normalized : 6,
    exportFrame: normalized - 1,
    scenario: context.scenario,
    language: context.lang,
    seed: normalizeG4L9P4Seed(context.seed),
    replay: Math.max(0, context.replay ?? 0),
    status,
    blocker,
    phase,
    questionIndex: phase === 'question' ? normalized - 643 : null,
    questionOrder: buildCourseG04L09Gs002QuestionOrder(context.seed),
    deterministicSeededRandom: true,
    scoringResolved: true,
    correctFeedbackResolved: true,
    wrongFeedbackResolved: true,
    finalResolved: true,
    replayResolved: true,
    glossaryIntentResolved: true,
    courseRoutingIntentResolved: true,
    legacyNetworkPolicy: 'deny-by-default',
    networkCalls: 0,
    avm1Executed: false,
    originalRuntimeValidated: false,
    fidelityAccepted: false,
    audioAccepted: false,
    visualLocalizationStatus: domain === 'root'
      ? 'source-shared-untranslated-en-es'
      : context.lang === 'es'
        ? 'english-source-only-spanish-unresolved'
        : 'english-source-engineering-model',
  });
}

export function getCourseG04L09Gs002FrameState(
  frame: number,
  context: RuntimeContext,
): CourseG04L09Gs002FrameState {
  const domain = context.frameDomain ?? 'sprite-787';
  const validDomain = domain === 'root' || domain === 'sprite-787';
  const validScenario = COURSE_G04_L09_GS_002_SCENARIOS.includes(
    context.scenario as CourseG04L09Gs002Scenario,
  );
  if (!validDomain || !validScenario) {
    return stateFor(frame, context, 'blocked', 'unsupported-runtime-request');
  }
  if (
    (domain === 'root' && context.scenario !== 'root-standalone') ||
    (domain === 'sprite-787' && context.scenario === 'root-standalone')
  ) {
    return stateFor(frame, context, 'blocked', 'frame-domain-scenario-mismatch');
  }
  if (domain === 'sprite-787' && context.lang === 'es') {
    return stateFor(frame, context, 'blocked', 'spanish-visual-and-audio-not-source-proven');
  }
  return stateFor(frame, context, 'ready', null);
}
