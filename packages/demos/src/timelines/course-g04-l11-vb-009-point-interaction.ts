export const COURSE_G04_L11_VB_009_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l11-vb-009",
  sourceSwfSha256:
    "ef1b1c902cf362b5a75455033fb49d5ad04afa910c6d5612f851a54099677a7e",
  sourceTimelineId: "sprite-60",
  sourceFrameCount: 217,
  sourceTerminalStopFrame: 217,
  sourceControlPlacementFrame: 1,
  sourceControlCount: 4,
  point: Object.freeze({name: "Point A", x: 4, y: 3, orderedPair: "(4,3)"}),
  projectionOrder: Object.freeze([
    Object.freeze({axis: "x", direction: "right", units: 4}),
    Object.freeze({axis: "y", direction: "up", units: 3}),
  ]),
  sourceEmbeddedStreamBlockCount: 214,
  sourceEmbeddedStreamDurationMs: 17_816,
  sourceEmbeddedStreamAccepted: false,
  legacyCourseShellRequired: false,
  spanishSourceVisualParityEstablished: false,
});

export const COURSE_G04_L11_VB_009_TERMS = Object.freeze([
  Object.freeze({
    id: "point",
    sourceButtonObjectId: "11",
    sourceKeyAttribute: "Point",
    label: "Point",
    modernPedagogicalPrompt:
      "A point marks one exact location on the coordinate grid.",
  }),
  Object.freeze({
    id: "location",
    sourceButtonObjectId: "12",
    sourceKeyAttribute: "Location",
    label: "Location",
    modernPedagogicalPrompt:
      "A location tells exactly where the point belongs.",
  }),
  Object.freeze({
    id: "coordinate-grid",
    sourceButtonObjectId: "13",
    sourceKeyAttribute: "Coordinate grid",
    label: "Coordinate grid",
    modernPedagogicalPrompt:
      "Use the horizontal x-axis and vertical y-axis to name a location.",
  }),
  Object.freeze({
    id: "ordered-pair",
    sourceButtonObjectId: "9",
    sourceKeyAttribute: "Ordered pair",
    label: "Ordered pair",
    modernPedagogicalPrompt:
      "Read the ordered pair in order: x first, then y.",
  }),
]);

export type CourseG04L11Vb009TermId =
  (typeof COURSE_G04_L11_VB_009_TERMS)[number]["id"];

export interface CourseG04L11Vb009PointState {
  readonly frame: number;
  readonly playing: boolean;
  readonly selectedTermId: CourseG04L11Vb009TermId | null;
  readonly panelOpen: boolean;
  readonly interactionRevision: number;
  readonly legacyHostCallCount: 0;
  readonly audioEnabled: false;
  readonly spanishSourceVisualParityEnabled: false;
}

export type CourseG04L11Vb009PointEvent =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{
    type: "select-term";
    termId: CourseG04L11Vb009TermId;
    frame: number;
  }>
  | Readonly<{type: "close-term"}>
  | Readonly<{type: "resume"; frame: number}>
  | Readonly<{type: "replay"}>;

export const COURSE_G04_L11_VB_009_INTERACTION_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true,
  sourceCanvasSequenceRetained: true,
  animationInternalPedagogicalControlsPreserved: true,
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
  invariant(
    Number.isInteger(frame) && frame >= 1 && frame <= 217,
    `invalid VB009 local frame: ${frame}`,
  );
  return frame;
}

function termById(termId: string) {
  return COURSE_G04_L11_VB_009_TERMS.find((term) => term.id === termId) ?? null;
}

function freezeState(
  state: CourseG04L11Vb009PointState,
): CourseG04L11Vb009PointState {
  return Object.freeze(state);
}

export function createCourseG04L11Vb009PointState(initialFrame = 1):
CourseG04L11Vb009PointState {
  const frame = exactFrame(initialFrame);
  return freezeState({
    frame,
    playing: frame < 217,
    selectedTermId: null,
    panelOpen: false,
    interactionRevision: 0,
    legacyHostCallCount: 0,
    audioEnabled: false,
    spanishSourceVisualParityEnabled: false,
  });
}

export function getCourseG04L11Vb009SelectedTerm(
  state: CourseG04L11Vb009PointState,
) {
  return state.selectedTermId ? termById(state.selectedTermId) : null;
}

export function reduceCourseG04L11Vb009Point(
  state: CourseG04L11Vb009PointState,
  event: CourseG04L11Vb009PointEvent,
): CourseG04L11Vb009PointState {
  invariant(Object.isFrozen(state), "VB009 point state must be frozen");
  switch (event.type) {
    case "synchronize-frame": {
      const frame = exactFrame(event.frame);
      if (!state.playing || state.panelOpen || state.frame === frame) return state;
      return freezeState({...state, frame, playing: frame < 217});
    }
    case "select-term": {
      invariant(termById(event.termId), `unknown VB009 term: ${event.termId}`);
      return freezeState({
        ...state,
        frame: exactFrame(event.frame),
        playing: false,
        selectedTermId: event.termId,
        panelOpen: true,
        interactionRevision: state.interactionRevision + 1,
      });
    }
    case "close-term":
      if (!state.panelOpen) return state;
      return freezeState({
        ...state,
        selectedTermId: null,
        panelOpen: false,
        interactionRevision: state.interactionRevision + 1,
      });
    case "resume": {
      const frame = exactFrame(event.frame);
      return freezeState({
        ...state,
        frame,
        playing: frame < 217,
        selectedTermId: null,
        panelOpen: false,
        interactionRevision: state.interactionRevision + 1,
      });
    }
    case "replay":
      return createCourseG04L11Vb009PointState();
    default:
      return event satisfies never;
  }
}
