export const COURSE_G04_L11_IN_003_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l11-in-003",
  sourceSwfSha256:
    "4e7de4f04322e5460b468c3ea066f56345fc345bcd10fca40ed990eefc695885",
  sourceTimelineId: "sprite-109",
  sourceFrameCount: 781,
  sourceTerminalStopFrame: 781,
  candidateTerminalHoldFrame: 781,
  sourceControlPlacementFrame: null,
  sourceControlCount: 6,
  definition:
    "An ordered pair is a pair of numbers used to locate a point on a coordinate grid.",
  plottingOrder: "x-coordinate first; y-coordinate second",
  points: Object.freeze([
    Object.freeze({x: 2, y: 7, orderedPair: "(2,7)"}),
    Object.freeze({x: 3, y: 5, orderedPair: "(3,5)"}),
  ]),
  constructionSequence: Object.freeze([
    Object.freeze({frame: 120, event: "ordered-pair-definition-visible"}),
    Object.freeze({frame: 240, event: "first-x-coordinate-two-visible"}),
    Object.freeze({frame: 400, event: "first-y-path-and-transition-prompt-visible"}),
    Object.freeze({frame: 520, event: "point-two-seven-visible"}),
    Object.freeze({frame: 680, event: "second-y-path-to-five-visible"}),
    Object.freeze({frame: 781, event: "point-three-five-visible-at-local-stop"}),
  ]),
  nextOrderedPairVisualIsScriptedButton: false,
  supplementalHurricaneChartReachabilityEstablished: false,
  sourceEmbeddedStreamBlockCount: 781,
  sourceEmbeddedStreamDurationMs: 65_045,
  sourceExternalSpanishAudioDurationMs: 44_568,
  sourceAudioAccepted: false,
  sourceTerminalBehaviorEstablished: false,
  legacyCourseShellRequired: false,
  spanishSourceVisualParityEstablished: false,
});

export const COURSE_G04_L11_IN_003_TERMS = Object.freeze([
  Object.freeze({
    id: "locate",
    sourceButtonObjectId: "51",
    sourceKeyAttribute: "Locate",
    label: "Locate",
    modernPedagogicalPrompt:
      "To locate a point means to identify its exact position on the grid.",
  }),
  Object.freeze({
    id: "ordered-pair",
    sourceButtonObjectId: "52",
    sourceKeyAttribute: "Ordered pair",
    label: "Ordered pair",
    modernPedagogicalPrompt:
      "An ordered pair gives the x-coordinate first and the y-coordinate second.",
  }),
  Object.freeze({
    id: "coordinate-grid",
    sourceButtonObjectId: "53",
    sourceKeyAttribute: "Coordinate grid",
    label: "Coordinate grid",
    modernPedagogicalPrompt:
      "A coordinate grid uses a horizontal x-axis and a vertical y-axis to locate points.",
  }),
  Object.freeze({
    id: "pair",
    sourceButtonObjectId: "54",
    sourceKeyAttribute: "Pair",
    label: "Pair",
    modernPedagogicalPrompt:
      "A pair is a group of two values considered together.",
  }),
  Object.freeze({
    id: "number",
    sourceButtonObjectId: "55",
    sourceKeyAttribute: "Number",
    label: "Number",
    modernPedagogicalPrompt:
      "A number tells how much or which position is being described.",
  }),
  Object.freeze({
    id: "point",
    sourceButtonObjectId: "56",
    sourceKeyAttribute: "Point",
    label: "Point",
    modernPedagogicalPrompt:
      "A point marks one exact location on the coordinate grid.",
  }),
]);

export type CourseG04L11In003TermId =
  (typeof COURSE_G04_L11_IN_003_TERMS)[number]["id"];

export interface CourseG04L11In003OrderedPairState {
  readonly frame: number;
  readonly playing: boolean;
  readonly selectedTermId: CourseG04L11In003TermId | null;
  readonly panelOpen: boolean;
  readonly interactionRevision: number;
  readonly legacyHostCallCount: 0;
  readonly audioEnabled: false;
  readonly spanishSourceVisualParityEnabled: false;
}

export type CourseG04L11In003OrderedPairEvent =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{
    type: "select-term";
    termId: CourseG04L11In003TermId;
    frame: number;
  }>
  | Readonly<{type: "close-term"}>
  | Readonly<{type: "resume"; frame: number}>
  | Readonly<{type: "replay"}>;

export const COURSE_G04_L11_IN_003_INTERACTION_AUTHORITY = Object.freeze({
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
    Number.isInteger(frame) && frame >= 1 && frame <= 781,
    `invalid IN003 local frame: ${frame}`,
  );
  return frame;
}

function termById(termId: string) {
  return COURSE_G04_L11_IN_003_TERMS.find((term) => term.id === termId) ?? null;
}

function freezeState(
  state: CourseG04L11In003OrderedPairState,
): CourseG04L11In003OrderedPairState {
  return Object.freeze(state);
}

export function createCourseG04L11In003OrderedPairState(initialFrame = 1):
CourseG04L11In003OrderedPairState {
  const frame = exactFrame(initialFrame);
  return freezeState({
    frame,
    playing: frame < 781,
    selectedTermId: null,
    panelOpen: false,
    interactionRevision: 0,
    legacyHostCallCount: 0,
    audioEnabled: false,
    spanishSourceVisualParityEnabled: false,
  });
}

export function getCourseG04L11In003SelectedTerm(
  state: CourseG04L11In003OrderedPairState,
) {
  return state.selectedTermId ? termById(state.selectedTermId) : null;
}

export function reduceCourseG04L11In003OrderedPair(
  state: CourseG04L11In003OrderedPairState,
  event: CourseG04L11In003OrderedPairEvent,
): CourseG04L11In003OrderedPairState {
  invariant(Object.isFrozen(state), "IN003 ordered-pair state must be frozen");
  switch (event.type) {
    case "synchronize-frame": {
      const frame = exactFrame(event.frame);
      if (!state.playing || state.panelOpen || state.frame === frame) return state;
      return freezeState({...state, frame, playing: frame < 781});
    }
    case "select-term": {
      invariant(termById(event.termId), `unknown IN003 term: ${event.termId}`);
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
        playing: frame < 781,
        selectedTermId: null,
        panelOpen: false,
        interactionRevision: state.interactionRevision + 1,
      });
    }
    case "replay":
      return createCourseG04L11In003OrderedPairState();
    default:
      return event satisfies never;
  }
}
