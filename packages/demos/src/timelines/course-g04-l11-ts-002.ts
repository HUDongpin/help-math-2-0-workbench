import type {AnimationLanguage, MovieMetadata, RuntimeContext} from "../contract";

export const COURSE_G04_L11_TS_002_SOURCE = Object.freeze({
  animationId: "course-g04-l11-ts-002", releaseId: "lesson-g04-l11-coordinate-grid",
  historicalReleaseOrdinal: 34, historicalAtomicMemberCountIncludingLegacyShell: 44,
  currentProductAnimationOrdinal: 34, currentProductAnimationMemberCount: 43,
  sourceFla: Object.freeze({
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/TS/L11TS02.fla",
    bytes: 2_322_432,
    sha256: "05f6d48cc34a4fc86bbe5d99f9503da5351252ddb6a88a292b4b2cc35dc7dccb"}),
  sourceSwf: Object.freeze({
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/TS/L11TS02.swf",
    bytes: 147_307,
    sha256: "767edc79656793f375295740236d834e298dfffe7a3c5b884ebdbeb7f64f6bb6"}),
  sourceStage: Object.freeze({width: 800, height: 600, backgroundColor: "#b8d8f7"}),
  sourceFps: 12, rootFrameCount: 10, rootBeginFrame: 6,
  mainFrameDomain: "sprite-27", mainFrameCount: 354, sourceStopFrame: 354,
  sourceEmbeddedStreamCount: 1, sourceStreamDurationMs: 29_388,
  sourceAudioEnabled: false, sourceAudioAccepted: false,
  sourceInstructionLanguage: "en", registeredCurrentJavascript: false,
  strictAcceptanceEffect: "none",
});

export const COURSE_G04_L11_TS_002_MOVIE = Object.freeze({
  stage: Object.freeze({width: 800, height: 600}), fps: 12,
  frameCount: 10, durationMs: 10 / 12 * 1000,
} satisfies MovieMetadata);

export const COURSE_G04_L11_TS_002_RUNTIME = Object.freeze({
  ...COURSE_G04_L11_TS_002_MOVIE,
  frameDomains: Object.freeze([
    Object.freeze({id: "root", frameCount: 10, fps: 12}),
    Object.freeze({id: "sprite-27", frameCount: 354, fps: 12, rootFrame: 6}),
  ]), defaultFrameDomain: "sprite-27",
});

export type CourseG04L11Ts002Phase = "empty-plan" | "step-heading-enter" |
  "step-heading-held" | "first-instruction-enter" | "first-instruction-held" |
  "second-instruction-enter" | "complete-step-one" | "terminal-cleared";

export interface CourseG04L11Ts002FrameState {
  readonly status: "ready" | "blocked";
  readonly blocker: "unsupported-frame-domain" | "unsupported-scenario" |
    "invalid-frame" | null;
  readonly frame: number; readonly frameDomain: "root" | "sprite-27";
  readonly rootFrame: number; readonly scenario: string;
  readonly language: AnimationLanguage; readonly seed: number;
  readonly phase: CourseG04L11Ts002Phase;
  readonly phaseProgress: number;
  readonly stepHeadingVisible: boolean;
  readonly firstCellTextVisible: boolean;
  readonly firstInstructionVisible: boolean;
  readonly secondInstructionVisible: boolean;
  readonly terminalCleared: boolean;
  readonly authoredStepCount: 1;
  readonly emptyFutureStepCount: 3;
  readonly sourceInstructionLanguage: "en";
  readonly sourceAudioEnabled: false;
  readonly sourceAudioAccepted: false;
}

const ranges = Object.freeze([
  Object.freeze({first: 1, last: 88, phase: "empty-plan" as const}),
  Object.freeze({first: 89, last: 96, phase: "step-heading-enter" as const}),
  Object.freeze({first: 97, last: 149, phase: "step-heading-held" as const}),
  Object.freeze({first: 150, last: 157, phase: "first-instruction-enter" as const}),
  Object.freeze({first: 158, last: 220, phase: "first-instruction-held" as const}),
  Object.freeze({first: 221, last: 228, phase: "second-instruction-enter" as const}),
  Object.freeze({first: 229, last: 352, phase: "complete-step-one" as const}),
  Object.freeze({first: 353, last: 354, phase: "terminal-cleared" as const}),
]);

function blocked(frame: number, context: RuntimeContext,
  blocker: CourseG04L11Ts002FrameState["blocker"]): CourseG04L11Ts002FrameState {
  return Object.freeze({status: "blocked", blocker, frame,
    frameDomain: context.frameDomain === "root" ? "root" : "sprite-27",
    rootFrame: context.frameDomain === "root" ? frame : 6,
    scenario: context.scenario, language: context.lang, seed: context.seed,
    phase: "empty-plan", phaseProgress: 0, stepHeadingVisible: false,
    firstCellTextVisible: false, firstInstructionVisible: false,
    secondInstructionVisible: false, terminalCleared: false,
    authoredStepCount: 1, emptyFutureStepCount: 3,
    sourceInstructionLanguage: "en", sourceAudioEnabled: false,
    sourceAudioAccepted: false});
}

function progress(frame: number, first: number, last: number) {
  if (last === first) return 1;
  return Math.max(0, Math.min(1, (frame - first) / (last - first)));
}

export function getCourseG04L11Ts002FrameState(frame: number,
  context: RuntimeContext): CourseG04L11Ts002FrameState {
  const domain = context.frameDomain ?? "sprite-27";
  if (domain !== "root" && domain !== "sprite-27") {
    return blocked(frame, context, "unsupported-frame-domain");
  }
  if (context.scenario !== "source-authored-step-1") {
    return blocked(frame, context, "unsupported-scenario");
  }
  const max = domain === "root" ? 10 : 354;
  if (!Number.isInteger(frame) || frame < 1 || frame > max) {
    return blocked(frame, context, "invalid-frame");
  }
  if (domain === "root") return Object.freeze({status: "ready", blocker: null,
    frame, frameDomain: "root", rootFrame: frame, scenario: context.scenario,
    language: context.lang, seed: context.seed, phase: "empty-plan",
    phaseProgress: 1, stepHeadingVisible: false, firstCellTextVisible: false,
    firstInstructionVisible: false, secondInstructionVisible: false,
    terminalCleared: false, authoredStepCount: 1, emptyFutureStepCount: 3,
    sourceInstructionLanguage: "en", sourceAudioEnabled: false,
    sourceAudioAccepted: false});
  const range = ranges.find(({first, last}) => frame >= first && frame <= last);
  if (!range) return blocked(frame, context, "invalid-frame");
  const heading = frame >= 89 && frame <= 352;
  const firstCell = frame >= 97 && frame <= 352;
  const firstInstruction = frame >= 150 && frame <= 352;
  const secondInstruction = frame >= 221 && frame <= 352;
  return Object.freeze({status: "ready", blocker: null, frame,
    frameDomain: "sprite-27", rootFrame: 6, scenario: context.scenario,
    language: context.lang, seed: context.seed, phase: range.phase,
    phaseProgress: progress(frame, range.first, range.last),
    stepHeadingVisible: heading, firstCellTextVisible: firstCell,
    firstInstructionVisible: firstInstruction,
    secondInstructionVisible: secondInstruction,
    terminalCleared: range.phase === "terminal-cleared", authoredStepCount: 1,
    emptyFutureStepCount: 3, sourceInstructionLanguage: "en",
    sourceAudioEnabled: false, sourceAudioAccepted: false});
}

export const COURSE_G04_L11_TS_002_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true, exactSourceTextPreserved: true,
  exactSourcePhaseRangesPreserved: true, stepsTwoThroughFourRemainEmpty: true,
  modernGlossaryInteractionsProvided: true,
  sourceGlossaryPauseResumeParityEstablished: false,
  sourceAudioEnabled: false, sourceAudioAccepted: false,
  legacyCourseShellNavigationIncluded: false, legacyPlayerChromeIncluded: false,
  legacyPreloaderIncluded: false, duplicateOldAndModernControlsIncluded: false,
  legacyGlobalsExecuted: false, legacyDoHyperLinksExecuted: false,
  registeredCurrentJavascript: false, authoritativeOriginalRuntimeAccepted: false,
  behaviorParityEstablished: false, visualFidelityEstablished: false,
  spanishSourceTranslationEstablished: false, accessibilityAcceptanceEstablished: false,
  humanVisualReviewAccepted: false, ownerAccepted: false,
  strictMigrationComplete: false, lessonReleased: false, published: false,
  strictAcceptanceEffect: "none",
});
