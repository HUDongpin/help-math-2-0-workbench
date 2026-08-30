import {COURSE_G04_L11_IN_004_TARGETS} from "../source-static/g4-l11/course-g04-l11-in-004-static";

export const COURSE_G04_L11_IN_004_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l11-in-004",
  sourceSwfSha256:
    "b987be3902c3937a7c1e010aa241d5a87e569eac056f897c8c223b12a9e65641",
  sourceTimelineId: "sprite-127",
  sourceFrameCount: 233,
  naturalQuizStopFrame: 228,
  terminalDefinitionFrame: 233,
  terminalDefinitionReachabilityEstablished: false,
  instruction:
    "Click the exact location of the ordered pair on the coordinate grid. Click Next Ordered Pair as many times as you like to plot different ordered pairs.",
  sourceTargetCount: 18,
  sourceGridHitTargetCount: 121,
  gridRange: Object.freeze({xMin: 0, xMax: 10, yMin: 0, yMax: 10}),
  sourceGridStepPixels: Object.freeze({x: 26, y: 26}),
  sourceRandomTargetOrder: true,
  modernDeterministicSeedMapping: true,
  sourcePostExhaustionTypo: "arr.lenght",
  modernPostExhaustionBehavior: "reset-complete-source-target-set",
  sourceGlossaryControlCount: 8,
  sourceEmbeddedStreamCount: 4,
  sourceExternalSpanishAudioDurationMs: 24_384,
  sourceAudioAccepted: false,
  legacyCourseShellRequired: false,
  spanishSourceVisualParityEstablished: false,
});

export const COURSE_G04_L11_IN_004_TERMS = Object.freeze([
  Object.freeze({
    id: "location",
    sourceButtonObjectId: "74",
    sourceKeyAttribute: "Location",
    label: "Location",
    context: "instruction",
    modernPedagogicalPrompt:
      "A location tells the exact place of a point on the coordinate grid.",
  }),
  Object.freeze({
    id: "ordered-pair-instruction",
    sourceButtonObjectId: "75",
    sourceKeyAttribute: "Ordered pair",
    label: "Ordered pair",
    context: "instruction",
    modernPedagogicalPrompt:
      "Read an ordered pair in order: move along x first, then along y.",
  }),
  Object.freeze({
    id: "coordinate-grid",
    sourceButtonObjectId: "76",
    sourceKeyAttribute: "Coordinate grid",
    label: "Coordinate grid",
    context: "instruction",
    modernPedagogicalPrompt:
      "The horizontal x-axis and vertical y-axis form the coordinate grid.",
  }),
  Object.freeze({
    id: "ordered-pair-feedback",
    sourceButtonObjectId: "121",
    sourceKeyAttribute: "Ordered pair",
    label: "Ordered pair",
    context: "wrong-feedback",
    modernPedagogicalPrompt:
      "The first number tells the x distance and the second tells the y distance.",
  }),
  Object.freeze({
    id: "number",
    sourceButtonObjectId: "122",
    sourceKeyAttribute: "Number",
    label: "Number",
    context: "wrong-feedback",
    modernPedagogicalPrompt:
      "A number tells how many units to move on an axis.",
  }),
  Object.freeze({
    id: "unit",
    sourceButtonObjectId: "123",
    sourceKeyAttribute: "Unit",
    label: "Unit",
    context: "wrong-feedback",
    modernPedagogicalPrompt:
      "One unit is the distance from one grid line to the next.",
  }),
  Object.freeze({
    id: "zero",
    sourceButtonObjectId: "124",
    sourceKeyAttribute: "Zero",
    label: "Zero",
    context: "wrong-feedback",
    modernPedagogicalPrompt:
      "Zero means do not move away from the origin along that axis.",
  }),
  Object.freeze({
    id: "x-axis",
    sourceButtonObjectId: "125",
    sourceKeyAttribute: "X-axis",
    label: "x-axis",
    context: "wrong-feedback",
    modernPedagogicalPrompt:
      "The x-axis is the horizontal axis; use it for the first coordinate.",
  }),
] as const);

export type CourseG04L11In004TermId =
  (typeof COURSE_G04_L11_IN_004_TERMS)[number]["id"];
export type CourseG04L11In004Feedback = "none" | "correct" | "wrong";

export interface CourseG04L11In004Target {
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly orderedPair: string;
}

export interface CourseG04L11In004QuizState {
  readonly frame: number;
  readonly phase: "instruction" | "quiz";
  readonly playing: boolean;
  readonly seed: number;
  readonly cycle: number;
  readonly targetOrder: readonly number[];
  readonly targetCursor: number;
  readonly target: CourseG04L11In004Target;
  readonly selectedTermId: CourseG04L11In004TermId | null;
  readonly glossaryOpen: boolean;
  readonly wrongPopupOpen: boolean;
  readonly feedback: CourseG04L11In004Feedback;
  readonly selectedCoordinate: Readonly<{x: number; y: number}> | null;
  readonly gridEnabled: boolean;
  readonly nextEnabled: boolean;
  readonly attemptCount: number;
  readonly correctCount: number;
  readonly interactionRevision: number;
  readonly legacyHostCallCount: 0;
  readonly audioEnabled: false;
  readonly spanishSourceVisualParityEnabled: false;
}

export type CourseG04L11In004QuizEvent =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{type: "select-term"; termId: CourseG04L11In004TermId;
    frame: number}>
  | Readonly<{type: "close-term"}>
  | Readonly<{type: "resume"; frame: number}>
  | Readonly<{type: "select-coordinate"; x: number; y: number}>
  | Readonly<{type: "close-wrong-feedback"}>
  | Readonly<{type: "next-target"}>
  | Readonly<{type: "replay"; seed?: number}>;

export const COURSE_G04_L11_IN_004_INTERACTION_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true,
  sourceCanvasSequenceRetained: true,
  animationInternalPedagogicalControlsPreserved: true,
  sourceTargetSetPreserved: true,
  sourceGridHitSetPreserved: true,
  sourceRandomOrderReplacedByDeterministicSeedForCapture: true,
  sourcePostExhaustionTypoPreservedAsBug: false,
  modernPostExhaustionResetProvided: true,
  naturalFrame228QuizStopModeled: true,
  frame233NaturalReachabilityEstablished: false,
  legacyCourseShellNavigationIncluded: false,
  legacyPlayerChromeIncluded: false,
  legacyGlobalsExecuted: false,
  legacyDoHyperLinksExecuted: false,
  sourceAudioEnabled: false,
  sourceAudioAccepted: false,
  spanishSourceVisualParityEstablished: false,
  sourceDomainDeclared: false,
  registeredCurrentJavascript: false,
  authoritativeOriginalRuntimeAccepted: false,
  behaviorParityEstablished: false,
  visualFidelityEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  lessonReleased: false,
  published: false,
  strictAcceptanceEffect: "none",
});

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function exactFrame(frame: number) {
  invariant(Number.isInteger(frame) && frame >= 1 && frame <= 233,
    `invalid IN004 local frame: ${frame}`);
  return frame;
}
function exactCoordinate(value: number, axis: "x" | "y") {
  invariant(Number.isInteger(value) && value >= 0 && value <= 10,
    `invalid IN004 ${axis}-coordinate: ${value}`);
  return value;
}
function normalizeSeed(seed: number) {
  invariant(Number.isFinite(seed), "IN004 seed must be finite");
  return Math.trunc(seed) >>> 0;
}
function termById(termId: string) {
  return COURSE_G04_L11_IN_004_TERMS.find((term) => term.id === termId) ?? null;
}
function targetByIndex(index: number): CourseG04L11In004Target {
  invariant(Number.isInteger(index) && index >= 0 &&
    index < COURSE_G04_L11_IN_004_TARGETS.length,
  `invalid IN004 target index: ${index}`);
  const point = COURSE_G04_L11_IN_004_TARGETS[index];
  return Object.freeze({index, x: point.x, y: point.y,
    orderedPair: `(${point.x},${point.y})`});
}

export function buildCourseG04L11In004TargetOrder(seed = 0): readonly number[] {
  const normalized = normalizeSeed(seed);
  const order = COURSE_G04_L11_IN_004_TARGETS.map((_, index) => index);
  if (normalized === 0) return Object.freeze(order);
  let state = normalized || 0x9e3779b9;
  const next = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  };
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swap = next() % (index + 1);
    [order[index], order[swap]] = [order[swap], order[index]];
  }
  invariant(new Set(order).size === 18, "IN004 target order must be a permutation");
  return Object.freeze(order);
}

function freezeState(state: CourseG04L11In004QuizState):
CourseG04L11In004QuizState {
  invariant(Object.isFrozen(state.targetOrder), "IN004 target order must be frozen");
  return Object.freeze(state);
}

export function createCourseG04L11In004QuizState(initialFrame = 1, seed = 0):
CourseG04L11In004QuizState {
  const requestedFrame = exactFrame(initialFrame);
  const frame = Math.min(requestedFrame, 228);
  const normalizedSeed = normalizeSeed(seed);
  const targetOrder = buildCourseG04L11In004TargetOrder(normalizedSeed);
  return freezeState({
    frame,
    phase: frame >= 228 ? "quiz" : "instruction",
    playing: frame < 228,
    seed: normalizedSeed,
    cycle: 0,
    targetOrder,
    targetCursor: 0,
    target: targetByIndex(targetOrder[0]),
    selectedTermId: null,
    glossaryOpen: false,
    wrongPopupOpen: false,
    feedback: "none",
    selectedCoordinate: null,
    gridEnabled: frame >= 228,
    nextEnabled: false,
    attemptCount: 0,
    correctCount: 0,
    interactionRevision: 0,
    legacyHostCallCount: 0,
    audioEnabled: false,
    spanishSourceVisualParityEnabled: false,
  });
}

export function getCourseG04L11In004SelectedTerm(
  state: CourseG04L11In004QuizState,
) {
  return state.selectedTermId ? termById(state.selectedTermId) : null;
}

export function reduceCourseG04L11In004Quiz(
  state: CourseG04L11In004QuizState,
  event: CourseG04L11In004QuizEvent,
): CourseG04L11In004QuizState {
  invariant(Object.isFrozen(state), "IN004 quiz state must be frozen");
  switch (event.type) {
    case "synchronize-frame": {
      const requestedFrame = exactFrame(event.frame);
      if (!state.playing || state.glossaryOpen) return state;
      const frame = Math.min(requestedFrame, 228);
      if (frame === state.frame) return state;
      const quiz = frame >= 228;
      return freezeState({...state, frame,
        phase: quiz ? "quiz" : "instruction", playing: !quiz,
        gridEnabled: quiz && !state.wrongPopupOpen && state.feedback !== "correct"});
    }
    case "select-term": {
      invariant(termById(event.termId), `unknown IN004 term: ${event.termId}`);
      const frame = Math.min(exactFrame(event.frame), 228);
      return freezeState({...state, frame, playing: false,
        selectedTermId: event.termId, glossaryOpen: true,
        gridEnabled: false, interactionRevision: state.interactionRevision + 1});
    }
    case "close-term":
      if (!state.glossaryOpen) return state;
      return freezeState({...state, selectedTermId: null, glossaryOpen: false,
        interactionRevision: state.interactionRevision + 1});
    case "resume": {
      const frame = Math.min(exactFrame(event.frame), 228);
      const quiz = frame >= 228;
      return freezeState({...state, frame,
        phase: quiz ? "quiz" : "instruction", playing: !quiz,
        selectedTermId: null, glossaryOpen: false,
        gridEnabled: quiz && !state.wrongPopupOpen && state.feedback !== "correct",
        interactionRevision: state.interactionRevision + 1});
    }
    case "select-coordinate": {
      invariant(state.phase === "quiz" && state.gridEnabled,
        "IN004 grid is not enabled");
      const x = exactCoordinate(event.x, "x");
      const y = exactCoordinate(event.y, "y");
      const correct = x === state.target.x && y === state.target.y;
      return freezeState({...state,
        selectedCoordinate: Object.freeze({x, y}),
        feedback: correct ? "correct" : "wrong",
        wrongPopupOpen: !correct,
        gridEnabled: false,
        nextEnabled: correct,
        attemptCount: state.attemptCount + 1,
        correctCount: state.correctCount + (correct ? 1 : 0),
        interactionRevision: state.interactionRevision + 1});
    }
    case "close-wrong-feedback":
      if (!state.wrongPopupOpen) return state;
      return freezeState({...state, feedback: "none", wrongPopupOpen: false,
        selectedCoordinate: null, gridEnabled: true,
        interactionRevision: state.interactionRevision + 1});
    case "next-target": {
      invariant(state.phase === "quiz" && state.nextEnabled,
        "IN004 next target is not enabled");
      const exhausted = state.targetCursor + 1 >= state.targetOrder.length;
      const cycle = exhausted ? state.cycle + 1 : state.cycle;
      const targetOrder = exhausted
        ? buildCourseG04L11In004TargetOrder((state.seed + cycle) >>> 0)
        : state.targetOrder;
      const targetCursor = exhausted ? 0 : state.targetCursor + 1;
      return freezeState({...state, cycle, targetOrder, targetCursor,
        target: targetByIndex(targetOrder[targetCursor]),
        feedback: "none", selectedCoordinate: null,
        gridEnabled: true, nextEnabled: false,
        interactionRevision: state.interactionRevision + 1});
    }
    case "replay":
      return createCourseG04L11In004QuizState(1, event.seed ?? state.seed);
    default:
      return event satisfies never;
  }
}
