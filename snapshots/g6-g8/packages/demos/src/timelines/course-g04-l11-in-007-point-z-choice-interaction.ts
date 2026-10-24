import {COURSE_G04_L11_IN_007_CHOICES} from
  "../source-static/g4-l11/course-g04-l11-in-007-static";

export type CourseG04L11In007ChoiceId =
  (typeof COURSE_G04_L11_IN_007_CHOICES)[number]["id"];
export type CourseG04L11In007TermId = "ordered-pair" | "point" | "coordinate-grid" |
  "number" | "unit" | "zero" | "x-axis";

export const COURSE_G04_L11_IN_007_TERMS = Object.freeze([
  Object.freeze({id: "ordered-pair", sourceButtonObjectId: 25, label: "Ordered pair",
    principal: true, prompt: "An ordered pair names a point as (x, y)."}),
  Object.freeze({id: "point", sourceButtonObjectId: 26, label: "Point",
    principal: true, prompt: "A point marks one exact location on the coordinate grid."}),
  Object.freeze({id: "coordinate-grid", sourceButtonObjectId: 27,
    label: "Coordinate grid", principal: true,
    prompt: "A coordinate grid uses the x- and y-axes to locate points."}),
  Object.freeze({id: "number", sourceButtonObjectId: null, label: "Number",
    principal: false, prompt: "A number tells how far to move along an axis."}),
  Object.freeze({id: "unit", sourceButtonObjectId: null, label: "Unit",
    principal: false, prompt: "A unit is one equal step on an axis."}),
  Object.freeze({id: "zero", sourceButtonObjectId: null, label: "Zero",
    principal: false, prompt: "Zero is the origin value where each axis begins."}),
  Object.freeze({id: "x-axis", sourceButtonObjectId: null, label: "X-axis",
    principal: false, prompt: "The x-axis measures horizontal distance from zero."}),
] as const);

export interface CourseG04L11In007ChoiceState {
  readonly frame: number;
  readonly phase: "instruction" | "point-z-question";
  readonly playing: boolean;
  readonly selectedChoice: CourseG04L11In007ChoiceId | null;
  readonly feedback: "none" | "wrong" | "correct";
  readonly controlsEnabled: boolean;
  readonly completed: boolean;
  readonly wrongAttemptCount: number;
  readonly selectedTermId: CourseG04L11In007TermId | null;
  readonly interactionRevision: number;
  readonly audioEnabled: false;
  readonly legacyHostCallCount: 0;
}
export type CourseG04L11In007ChoiceEvent =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{type: "choose"; choiceId: CourseG04L11In007ChoiceId}>
  | Readonly<{type: "dismiss-feedback"}>
  | Readonly<{type: "select-term"; termId: CourseG04L11In007TermId}>
  | Readonly<{type: "close-term"}>
  | Readonly<{type: "replay"}>;

function invariant(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
function exactFrame(frame: number) {
  invariant(Number.isInteger(frame) && frame >= 1 && frame <= 137,
    `invalid IN007 frame: ${frame}`);
  return Math.min(frame, 66);
}
function choice(id: string) {
  return COURSE_G04_L11_IN_007_CHOICES.find((candidate) => candidate.id === id) ?? null;
}
function freeze(state: CourseG04L11In007ChoiceState) { return Object.freeze(state); }
export function createCourseG04L11In007ChoiceState(frame = 1):
CourseG04L11In007ChoiceState {
  const local = exactFrame(frame);
  return freeze({frame: local, phase: local >= 66 ? "point-z-question" : "instruction",
    playing: local < 66, selectedChoice: null, feedback: "none",
    controlsEnabled: true, completed: false, wrongAttemptCount: 0,
    selectedTermId: null, interactionRevision: 0, audioEnabled: false,
    legacyHostCallCount: 0});
}
export function reduceCourseG04L11In007Choice(state: CourseG04L11In007ChoiceState,
  event: CourseG04L11In007ChoiceEvent): CourseG04L11In007ChoiceState {
  invariant(Object.isFrozen(state), "IN007 choice state must be frozen");
  if (event.type === "synchronize-frame") {
    if (!state.playing || state.selectedTermId) return state;
    const frame = exactFrame(event.frame);
    return frame === state.frame ? state : freeze({...state, frame,
      phase: frame >= 66 ? "point-z-question" : "instruction", playing: frame < 66});
  }
  if (event.type === "choose") {
    invariant(state.phase === "point-z-question", "IN007 choices are not enabled");
    invariant(state.controlsEnabled && !state.completed,
      "IN007 choices are locked during feedback or after completion");
    const selected = choice(event.choiceId);
    invariant(selected, `unknown IN007 choice: ${event.choiceId}`);
    return freeze({...state, selectedChoice: selected.id,
      feedback: selected.correct ? "correct" : "wrong", controlsEnabled: false,
      completed: selected.correct,
      wrongAttemptCount: state.wrongAttemptCount + (selected.correct ? 0 : 1),
      interactionRevision: state.interactionRevision + 1});
  }
  if (event.type === "dismiss-feedback") {
    if (state.feedback === "none") return state;
    return freeze({...state, selectedChoice: null, feedback: "none",
      controlsEnabled: !state.completed,
      interactionRevision: state.interactionRevision + 1});
  }
  if (event.type === "select-term") {
    invariant(COURSE_G04_L11_IN_007_TERMS.some((term) => term.id === event.termId),
      `unknown IN007 term: ${event.termId}`);
    return freeze({...state, playing: false, selectedTermId: event.termId,
      interactionRevision: state.interactionRevision + 1});
  }
  if (event.type === "close-term") {
    if (!state.selectedTermId) return state;
    return freeze({...state, selectedTermId: null,
      interactionRevision: state.interactionRevision + 1});
  }
  if (event.type === "replay") return createCourseG04L11In007ChoiceState(1);
  return event satisfies never;
}

export const COURSE_G04_L11_IN_007_INTERACTION_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true, sourcePointZCoordinatePreserved: true,
  sourceThreeChoiceOrderPreserved: true,
  sourceWrongExplanationAndRetryPreserved: true,
  animationInternalPedagogicalControlsPreserved: true,
  legacyCourseShellNavigationIncluded: false, legacyPlayerChromeIncluded: false,
  legacyGlobalsExecuted: false, arbitraryHostNavigationAllowed: false,
  sourceAudioEnabled: false, registeredCurrentJavascript: false,
  sourceDomainDeclared: false, authoritativeOriginalRuntimeAccepted: false,
  behaviorParityEstablished: false, visualFidelityEstablished: false,
  humanVisualReviewAccepted: false, ownerAccepted: false,
  strictMigrationComplete: false, lessonReleased: false, published: false,
  strictAcceptanceEffect: "none",
});
