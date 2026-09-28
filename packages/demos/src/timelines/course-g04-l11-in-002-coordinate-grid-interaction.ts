export const COURSE_G04_L11_IN_002_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l11-in-002",
  sourceSwfSha256:
    "a87ccf50c6291e27d2de4a0fac3e959ec6f426cb6e4dcd828eef08ed3dab6894",
  sourceTimelineId: "sprite-80",
  sourceFrameCount: 331,
  sourceTerminalStopFrame: null,
  candidateTerminalHoldFrame: 331,
  sourceControlPlacementFrame: null,
  sourceControlCount: 9,
  definition:
    "A coordinate grid is a grid formed by two intersecting number lines, the horizontal x-axis and the vertical y-axis.",
  relation: "y = x + 4",
  points: Object.freeze([
    Object.freeze({x: 1, y: 5, orderedPair: "(1,5)"}),
    Object.freeze({x: 2, y: 6, orderedPair: "(2,6)"}),
    Object.freeze({x: 3, y: 7, orderedPair: "(3,7)"}),
    Object.freeze({x: 4, y: 8, orderedPair: "(4,8)"}),
  ]),
  constructionSequence: Object.freeze([
    Object.freeze({frame: 60, event: "definition-and-axes-revealing"}),
    Object.freeze({frame: 120, event: "horizontal-x-axis-language-visible"}),
    Object.freeze({frame: 180, event: "vertical-y-axis-and-grid-visible"}),
    Object.freeze({frame: 240, event: "first-point-and-projections-visible"}),
    Object.freeze({frame: 300, event: "all-four-points-visible"}),
    Object.freeze({frame: 331, event: "function-table-visible-under-direct-selection"}),
  ]),
  sourceEmbeddedStreamBlockCount: 328,
  sourceEmbeddedStreamDurationMs: 27_298,
  sourceExternalSpanishAudioDurationMs: 39_120,
  sourceAudioAccepted: false,
  sourceTerminalBehaviorEstablished: false,
  legacyCourseShellRequired: false,
  spanishSourceVisualParityEstablished: false,
});

export const COURSE_G04_L11_IN_002_TERMS = Object.freeze([
  Object.freeze({
    id: "coordinate-grid",
    sourceButtonObjectId: "9",
    sourceKeyAttribute: "Coordinate grid",
    label: "Coordinate grid",
    modernPedagogicalPrompt:
      "A coordinate grid is made from a horizontal x-axis and a vertical y-axis.",
  }),
  Object.freeze({
    id: "grid",
    sourceButtonObjectId: "10",
    sourceKeyAttribute: "Grid",
    label: "Grid",
    modernPedagogicalPrompt:
      "A grid is a pattern of evenly spaced horizontal and vertical lines.",
  }),
  Object.freeze({
    id: "form",
    sourceButtonObjectId: "11",
    sourceKeyAttribute: "Form",
    label: "Form",
    modernPedagogicalPrompt:
      "To form something means to make or create it.",
  }),
  Object.freeze({
    id: "intersect",
    sourceButtonObjectId: "12",
    sourceKeyAttribute: "Intersect",
    label: "Intersect",
    modernPedagogicalPrompt:
      "Lines intersect when they cross at the same point.",
  }),
  Object.freeze({
    id: "number-line",
    sourceButtonObjectId: "13",
    sourceKeyAttribute: "Number line",
    label: "Number line",
    modernPedagogicalPrompt:
      "A number line places numbers in order at equal distances.",
  }),
  Object.freeze({
    id: "horizontal",
    sourceButtonObjectId: "41",
    sourceKeyAttribute: "Horizontal",
    label: "Horizontal",
    modernPedagogicalPrompt:
      "Horizontal means moving from left to right, like the x-axis.",
  }),
  Object.freeze({
    id: "x-axis",
    sourceButtonObjectId: "42",
    sourceKeyAttribute: "X-axis",
    label: "X-axis",
    modernPedagogicalPrompt:
      "The x-axis is the horizontal number line on a coordinate grid.",
  }),
  Object.freeze({
    id: "vertical",
    sourceButtonObjectId: "43",
    sourceKeyAttribute: "Vertical",
    label: "Vertical",
    modernPedagogicalPrompt:
      "Vertical means moving up and down, like the y-axis.",
  }),
  Object.freeze({
    id: "y-axis",
    sourceButtonObjectId: "44",
    sourceKeyAttribute: "Y-axis",
    label: "Y-axis",
    modernPedagogicalPrompt:
      "The y-axis is the vertical number line on a coordinate grid.",
  }),
]);

export type CourseG04L11In002TermId =
  (typeof COURSE_G04_L11_IN_002_TERMS)[number]["id"];

export interface CourseG04L11In002CoordinateGridState {
  readonly frame: number;
  readonly playing: boolean;
  readonly selectedTermId: CourseG04L11In002TermId | null;
  readonly panelOpen: boolean;
  readonly interactionRevision: number;
  readonly legacyHostCallCount: 0;
  readonly audioEnabled: false;
  readonly spanishSourceVisualParityEnabled: false;
}

export type CourseG04L11In002CoordinateGridEvent =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{
    type: "select-term";
    termId: CourseG04L11In002TermId;
    frame: number;
  }>
  | Readonly<{type: "close-term"}>
  | Readonly<{type: "resume"; frame: number}>
  | Readonly<{type: "replay"}>;

export const COURSE_G04_L11_IN_002_INTERACTION_AUTHORITY = Object.freeze({
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
    Number.isInteger(frame) && frame >= 1 && frame <= 331,
    `invalid IN002 local frame: ${frame}`,
  );
  return frame;
}

function termById(termId: string) {
  return COURSE_G04_L11_IN_002_TERMS.find((term) => term.id === termId) ?? null;
}

function freezeState(
  state: CourseG04L11In002CoordinateGridState,
): CourseG04L11In002CoordinateGridState {
  return Object.freeze(state);
}

export function createCourseG04L11In002CoordinateGridState(initialFrame = 1):
CourseG04L11In002CoordinateGridState {
  const frame = exactFrame(initialFrame);
  return freezeState({
    frame,
    playing: frame < 331,
    selectedTermId: null,
    panelOpen: false,
    interactionRevision: 0,
    legacyHostCallCount: 0,
    audioEnabled: false,
    spanishSourceVisualParityEnabled: false,
  });
}

export function getCourseG04L11In002SelectedTerm(
  state: CourseG04L11In002CoordinateGridState,
) {
  return state.selectedTermId ? termById(state.selectedTermId) : null;
}

export function reduceCourseG04L11In002CoordinateGrid(
  state: CourseG04L11In002CoordinateGridState,
  event: CourseG04L11In002CoordinateGridEvent,
): CourseG04L11In002CoordinateGridState {
  invariant(Object.isFrozen(state), "IN002 coordinate-grid state must be frozen");
  switch (event.type) {
    case "synchronize-frame": {
      const frame = exactFrame(event.frame);
      if (!state.playing || state.panelOpen || state.frame === frame) return state;
      return freezeState({...state, frame, playing: frame < 331});
    }
    case "select-term": {
      invariant(termById(event.termId), `unknown IN002 term: ${event.termId}`);
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
        playing: frame < 331,
        selectedTermId: null,
        panelOpen: false,
        interactionRevision: state.interactionRevision + 1,
      });
    }
    case "replay":
      return createCourseG04L11In002CoordinateGridState();
    default:
      return event satisfies never;
  }
}
