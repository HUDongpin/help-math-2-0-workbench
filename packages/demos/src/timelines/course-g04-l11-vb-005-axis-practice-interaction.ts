export const COURSE_G04_L11_VB_005_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l11-vb-005",
  sourceSwfSha256:
    "0999c1fcec2bc839f0f3fdf266c71f3b12c18b835af6fdf9c0c9f55921c75a92",
  sourceTimelineId: "sprite-101",
  sourceFrameCount: 142,
  sourceInteractionFrame: 102,
  sourceTerminalStopFrame: 142,
  sourceDragPairCount: 2,
  sourceKeyTermButtonCount: 5,
  sourceEmbeddedStreamCount: 7,
  sourceExternalSpanishTrackPresent: true,
  sourceAudioAccepted: false,
  legacyCourseShellRequired: false,
  legacyPlayerChromeRequired: false,
  spanishRuntimeEstablished: false,
});

export const COURSE_G04_L11_VB_005_AXIS_TOKENS = Object.freeze([
  Object.freeze({
    id: "x-axis",
    label: "x-axis",
    sourceObjectId: "67",
    sourceInstanceName: "Scr_1",
    sourceTargetInstanceName: "Tar_1",
    modernTargetId: "horizontal-axis",
  }),
  Object.freeze({
    id: "y-axis",
    label: "y-axis",
    sourceObjectId: "68",
    sourceInstanceName: "Scr_2",
    sourceTargetInstanceName: "Tar_2",
    modernTargetId: "vertical-axis",
  }),
]);

export const COURSE_G04_L11_VB_005_KEY_TERMS = Object.freeze([
  Object.freeze({id: "x-axis", sourceButtonObjectId: "54", sourceKey: "X-axis"}),
  Object.freeze({id: "y-axis", sourceButtonObjectId: "55", sourceKey: "Y-axis"}),
  Object.freeze({id: "position", sourceButtonObjectId: "56", sourceKey: "Position"}),
  Object.freeze({id: "coordinate-grid", sourceButtonObjectId: "57", sourceKey: "Coordinate grid"}),
  Object.freeze({id: "number", sourceButtonObjectId: "89", sourceKey: "Number"}),
]);

export type CourseG04L11Vb005AxisId =
  (typeof COURSE_G04_L11_VB_005_AXIS_TOKENS)[number]["id"];
export type CourseG04L11Vb005TermId =
  (typeof COURSE_G04_L11_VB_005_KEY_TERMS)[number]["id"];
export type CourseG04L11Vb005TargetId =
  "horizontal-axis" | "vertical-axis";

export interface CourseG04L11Vb005AxisPracticeState {
  readonly placed: Readonly<Record<CourseG04L11Vb005AxisId, boolean>>;
  readonly selectedAxis: CourseG04L11Vb005AxisId | null;
  readonly feedback: null | Readonly<{
    kind: "correct" | "wrong";
    axis: CourseG04L11Vb005AxisId;
    target: CourseG04L11Vb005TargetId;
  }>;
  readonly openTerm: CourseG04L11Vb005TermId | null;
  readonly attempts: number;
  readonly completed: boolean;
  readonly interactionRevision: number;
  readonly legacyHostCallCount: 0;
  readonly audioEnabled: false;
  readonly spanishRuntimeEnabled: false;
}
export type CourseG04L11Vb005AxisPracticeEvent =
  | Readonly<{type: "select-axis"; axis: CourseG04L11Vb005AxisId}>
  | Readonly<{
    type: "place-axis";
    axis: CourseG04L11Vb005AxisId;
    target: CourseG04L11Vb005TargetId;
  }>
  | Readonly<{type: "dismiss-feedback"}>
  | Readonly<{type: "open-term"; term: CourseG04L11Vb005TermId}>
  | Readonly<{type: "close-term"}>
  | Readonly<{type: "replay"}>;

export const COURSE_G04_L11_VB_005_INTERACTION_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true,
  animationInternalPedagogicalControlsPreserved: true,
  pointerDragEquivalentImplemented: true,
  keyboardPlacementEquivalentImplemented: true,
  legacyCourseShellNavigationIncluded: false,
  legacyPlayerChromeIncluded: false,
  legacyGlobalsExecuted: false,
  legacyDoHyperLinksExecuted: false,
  dynamicEvalExecuted: false,
  sourceAudioEnabled: false,
  sourceAudioAccepted: false,
  sourceDomainDeclared: false,
  registeredCurrentJavascript: false,
  authoritativeOriginalRuntimeAccepted: false,
  behaviorParityEstablished: false,
  visualFidelityEstablished: false,
  spanishSourceParityEstablished: false,
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

function isAxis(value: string): value is CourseG04L11Vb005AxisId {
  return COURSE_G04_L11_VB_005_AXIS_TOKENS.some((axis) => axis.id === value);
}

function isTerm(value: string): value is CourseG04L11Vb005TermId {
  return COURSE_G04_L11_VB_005_KEY_TERMS.some((term) => term.id === value);
}

function expectedTarget(axis: CourseG04L11Vb005AxisId): CourseG04L11Vb005TargetId {
  return axis === "x-axis" ? "horizontal-axis" : "vertical-axis";
}

function freezeState(
  state: CourseG04L11Vb005AxisPracticeState,
): CourseG04L11Vb005AxisPracticeState {
  return Object.freeze({
    ...state,
    placed: Object.freeze({...state.placed}),
    feedback: state.feedback ? Object.freeze({...state.feedback}) : null,
  });
}

export function createCourseG04L11Vb005AxisPracticeState():
CourseG04L11Vb005AxisPracticeState {
  return freezeState({
    placed: {"x-axis": false, "y-axis": false},
    selectedAxis: null,
    feedback: null,
    openTerm: null,
    attempts: 0,
    completed: false,
    interactionRevision: 0,
    legacyHostCallCount: 0,
    audioEnabled: false,
    spanishRuntimeEnabled: false,
  });
}

export function reduceCourseG04L11Vb005AxisPractice(
  state: CourseG04L11Vb005AxisPracticeState,
  event: CourseG04L11Vb005AxisPracticeEvent,
): CourseG04L11Vb005AxisPracticeState {
  invariant(Object.isFrozen(state), "VB005 axis-practice state must be frozen");
  switch (event.type) {
    case "select-axis": {
      invariant(isAxis(event.axis), `unknown VB005 axis: ${event.axis}`);
      if (state.placed[event.axis]) return state;
      return freezeState({...state, selectedAxis: event.axis, feedback: null});
    }
    case "place-axis": {
      invariant(isAxis(event.axis), `unknown VB005 axis: ${event.axis}`);
      invariant(event.target === "horizontal-axis" || event.target === "vertical-axis",
        `unknown VB005 target: ${event.target}`);
      if (state.placed[event.axis]) return state;
      const correct = expectedTarget(event.axis) === event.target;
      const placed = correct
        ? {...state.placed, [event.axis]: true}
        : {...state.placed};
      return freezeState({
        ...state,
        placed,
        selectedAxis: correct ? null : event.axis,
        feedback: {kind: correct ? "correct" : "wrong", axis: event.axis,
          target: event.target},
        attempts: state.attempts + 1,
        completed: placed["x-axis"] && placed["y-axis"],
        interactionRevision: state.interactionRevision + 1,
      });
    }
    case "dismiss-feedback":
      if (!state.feedback) return state;
      return freezeState({...state, feedback: null,
        interactionRevision: state.interactionRevision + 1});
    case "open-term": {
      invariant(isTerm(event.term), `unknown VB005 term: ${event.term}`);
      return freezeState({...state, openTerm: event.term, feedback: null,
        interactionRevision: state.interactionRevision + 1});
    }
    case "close-term":
      if (!state.openTerm) return state;
      return freezeState({...state, openTerm: null,
        interactionRevision: state.interactionRevision + 1});
    case "replay":
      return createCourseG04L11Vb005AxisPracticeState();
    default:
      return event satisfies never;
  }
}
