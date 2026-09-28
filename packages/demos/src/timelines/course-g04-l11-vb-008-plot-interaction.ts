export const COURSE_G04_L11_VB_008_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l11-vb-008",
  sourceSwfSha256:
    "59dc96842caf162d103f3d2f0fcc14981eeaacb251b5757c4a0e5f39a56768c1",
  sourceTimelineId: "sprite-41",
  sourceFrameCount: 95,
  sourceTerminalStopFrame: 95,
  sourceControlPlacementFrame: 1,
  sourceControlCount: 6,
  plottedPoint: Object.freeze({x: 1, y: 2, label: "(1,2)"}),
  orderedConstruction: Object.freeze([
    Object.freeze({axis: "x", direction: "right", units: 1}),
    Object.freeze({axis: "y", direction: "up", units: 2}),
  ]),
  sourceEmbeddedStreamBlockCount: 92,
  sourceEmbeddedStreamDurationMs: 7_654,
  sourceEmbeddedStreamAccepted: false,
  legacyCourseShellRequired: false,
  spanishSourceVisualParityEstablished: false,
});

export const COURSE_G04_L11_VB_008_TERMS = Object.freeze([
  Object.freeze({
    id: "plot",
    sourceButtonObjectId: "10",
    sourceKeyAttribute: "Plot",
    label: "Plot",
    modernPedagogicalPrompt:
      "Locate a point on a coordinate grid by following its ordered pair.",
  }),
  Object.freeze({
    id: "locate",
    sourceButtonObjectId: "11",
    sourceKeyAttribute: "Locate",
    label: "Locate",
    modernPedagogicalPrompt:
      "Find the exact position where the ordered pair belongs.",
  }),
  Object.freeze({
    id: "point",
    sourceButtonObjectId: "12",
    sourceKeyAttribute: "Point",
    label: "Point",
    modernPedagogicalPrompt:
      "A point marks one exact location on the coordinate grid.",
  }),
  Object.freeze({
    id: "coordinate-grid",
    sourceButtonObjectId: "13",
    sourceKeyAttribute: "Coordinate grid",
    label: "Coordinate grid",
    modernPedagogicalPrompt:
      "The horizontal x-axis and vertical y-axis form the coordinate grid.",
  }),
  Object.freeze({
    id: "ordered-pair",
    sourceButtonObjectId: "14",
    sourceKeyAttribute: "Ordered pair",
    label: "Ordered pair",
    modernPedagogicalPrompt:
      "Read an ordered pair in order: x first, then y.",
  }),
  Object.freeze({
    id: "coordinate",
    sourceButtonObjectId: "40",
    sourceKeyAttribute: "Coordinate",
    label: "Coordinate",
    modernPedagogicalPrompt:
      "Each coordinate tells how far to move along one axis.",
  }),
]);

export type CourseG04L11Vb008TermId =
  (typeof COURSE_G04_L11_VB_008_TERMS)[number]["id"];

export interface CourseG04L11Vb008PlotState {
  readonly frame: number;
  readonly playing: boolean;
  readonly selectedTermId: CourseG04L11Vb008TermId | null;
  readonly panelOpen: boolean;
  readonly interactionRevision: number;
  readonly legacyHostCallCount: 0;
  readonly audioEnabled: false;
  readonly spanishSourceVisualParityEnabled: false;
}

export type CourseG04L11Vb008PlotEvent =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{
    type: "select-term";
    termId: CourseG04L11Vb008TermId;
    frame: number;
  }>
  | Readonly<{type: "close-term"}>
  | Readonly<{type: "resume"; frame: number}>
  | Readonly<{type: "replay"}>;

export const COURSE_G04_L11_VB_008_INTERACTION_AUTHORITY = Object.freeze({
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
    Number.isInteger(frame) && frame >= 1 && frame <= 95,
    `invalid VB008 local frame: ${frame}`,
  );
  return frame;
}

function termById(termId: string) {
  return COURSE_G04_L11_VB_008_TERMS.find((term) => term.id === termId) ?? null;
}

function freezeState(
  state: CourseG04L11Vb008PlotState,
): CourseG04L11Vb008PlotState {
  return Object.freeze(state);
}

export function createCourseG04L11Vb008PlotState(initialFrame = 1):
CourseG04L11Vb008PlotState {
  const frame = exactFrame(initialFrame);
  return freezeState({
    frame,
    playing: frame < 95,
    selectedTermId: null,
    panelOpen: false,
    interactionRevision: 0,
    legacyHostCallCount: 0,
    audioEnabled: false,
    spanishSourceVisualParityEnabled: false,
  });
}

export function getCourseG04L11Vb008SelectedTerm(
  state: CourseG04L11Vb008PlotState,
) {
  return state.selectedTermId ? termById(state.selectedTermId) : null;
}

export function reduceCourseG04L11Vb008Plot(
  state: CourseG04L11Vb008PlotState,
  event: CourseG04L11Vb008PlotEvent,
): CourseG04L11Vb008PlotState {
  invariant(Object.isFrozen(state), "VB008 plot state must be frozen");
  switch (event.type) {
    case "synchronize-frame": {
      const frame = exactFrame(event.frame);
      if (!state.playing || state.panelOpen || state.frame === frame) return state;
      return freezeState({...state, frame, playing: frame < 95});
    }
    case "select-term": {
      invariant(termById(event.termId), `unknown VB008 term: ${event.termId}`);
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
        playing: frame < 95,
        selectedTermId: null,
        panelOpen: false,
        interactionRevision: state.interactionRevision + 1,
      });
    }
    case "replay":
      return createCourseG04L11Vb008PlotState();
    default:
      return event satisfies never;
  }
}
