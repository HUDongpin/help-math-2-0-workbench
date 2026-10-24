export const COURSE_G04_L11_VB_010_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l11-vb-010",
  sourceSwfSha256:
    "a4b46ef4c0a5476ecfc35f63d4fb78f3fd4d9c6340e760443e4f7d078013d5d8",
  sourceTimelineId: "sprite-43",
  sourceFrameCount: 66,
  sourceTerminalStopFrame: null,
  candidateTerminalHoldFrame: 66,
  sourceControlPlacementFrame: 1,
  sourceControlCount: 3,
  definition: "A line segment is part of a line between two points.",
  lineSegment: Object.freeze({
    orientation: "vertical",
    upperEndpoint: Object.freeze({x: 2, y: 6, orderedPair: "(2,6)"}),
    lowerEndpoint: Object.freeze({x: 2, y: 2, orderedPair: "(2,2)"}),
  }),
  constructionSequence: Object.freeze([
    Object.freeze({frame: 20, event: "both-endpoints-visible"}),
    Object.freeze({frame: 50, event: "red-segment-visible"}),
    Object.freeze({frame: 60, event: "both-coordinate-labels-visible"}),
    Object.freeze({frame: 66, event: "complete-structural-composition-visible"}),
  ]),
  sourceEmbeddedStreamBlockCount: 63,
  sourceEmbeddedStreamDurationMs: 5_224,
  sourceEmbeddedStreamAccepted: false,
  sourceTerminalBehaviorEstablished: false,
  legacyCourseShellRequired: false,
  spanishSourceVisualParityEstablished: false,
});

export const COURSE_G04_L11_VB_010_TERMS = Object.freeze([
  Object.freeze({
    id: "line-segment",
    sourceButtonObjectId: "10",
    sourceKeyAttribute: "Line segment",
    label: "Line segment",
    modernPedagogicalPrompt:
      "A line segment is the part of a line between two endpoints.",
  }),
  Object.freeze({
    id: "line",
    sourceButtonObjectId: "11",
    sourceKeyAttribute: "Line",
    label: "Line",
    modernPedagogicalPrompt:
      "A line continues in both directions; this example highlights only the segment between the two points.",
  }),
  Object.freeze({
    id: "point",
    sourceButtonObjectId: "12",
    sourceKeyAttribute: "Point",
    label: "Points",
    modernPedagogicalPrompt:
      "The points at (2,6) and (2,2) are the endpoints of the segment.",
  }),
]);

export type CourseG04L11Vb010TermId =
  (typeof COURSE_G04_L11_VB_010_TERMS)[number]["id"];

export interface CourseG04L11Vb010LineSegmentState {
  readonly frame: number;
  readonly playing: boolean;
  readonly selectedTermId: CourseG04L11Vb010TermId | null;
  readonly panelOpen: boolean;
  readonly interactionRevision: number;
  readonly legacyHostCallCount: 0;
  readonly audioEnabled: false;
  readonly spanishSourceVisualParityEnabled: false;
}

export type CourseG04L11Vb010LineSegmentEvent =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{
    type: "select-term";
    termId: CourseG04L11Vb010TermId;
    frame: number;
  }>
  | Readonly<{type: "close-term"}>
  | Readonly<{type: "resume"; frame: number}>
  | Readonly<{type: "replay"}>;

export const COURSE_G04_L11_VB_010_INTERACTION_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true,
  sourceCanvasSequenceRetained: true,
  animationInternalPedagogicalControlsPreserved: true,
  modernLocalReplayProvided: true,
  sourceTerminalBehaviorEstablished: false,
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
    Number.isInteger(frame) && frame >= 1 && frame <= 66,
    `invalid VB010 local frame: ${frame}`,
  );
  return frame;
}

function termById(termId: string) {
  return COURSE_G04_L11_VB_010_TERMS.find((term) => term.id === termId) ?? null;
}

function freezeState(
  state: CourseG04L11Vb010LineSegmentState,
): CourseG04L11Vb010LineSegmentState {
  return Object.freeze(state);
}

export function createCourseG04L11Vb010LineSegmentState(initialFrame = 1):
CourseG04L11Vb010LineSegmentState {
  const frame = exactFrame(initialFrame);
  return freezeState({
    frame,
    playing: frame < 66,
    selectedTermId: null,
    panelOpen: false,
    interactionRevision: 0,
    legacyHostCallCount: 0,
    audioEnabled: false,
    spanishSourceVisualParityEnabled: false,
  });
}

export function getCourseG04L11Vb010SelectedTerm(
  state: CourseG04L11Vb010LineSegmentState,
) {
  return state.selectedTermId ? termById(state.selectedTermId) : null;
}

export function reduceCourseG04L11Vb010LineSegment(
  state: CourseG04L11Vb010LineSegmentState,
  event: CourseG04L11Vb010LineSegmentEvent,
): CourseG04L11Vb010LineSegmentState {
  invariant(Object.isFrozen(state), "VB010 line-segment state must be frozen");
  switch (event.type) {
    case "synchronize-frame": {
      const frame = exactFrame(event.frame);
      if (!state.playing || state.panelOpen || state.frame === frame) return state;
      return freezeState({...state, frame, playing: frame < 66});
    }
    case "select-term": {
      invariant(termById(event.termId), `unknown VB010 term: ${event.termId}`);
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
        playing: frame < 66,
        selectedTermId: null,
        panelOpen: false,
        interactionRevision: state.interactionRevision + 1,
      });
    }
    case "replay":
      return createCourseG04L11Vb010LineSegmentState();
    default:
      return event satisfies never;
  }
}
