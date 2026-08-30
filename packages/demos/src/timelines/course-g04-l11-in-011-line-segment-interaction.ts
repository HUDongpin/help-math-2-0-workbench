export const COURSE_G04_L11_IN_011_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l11-in-011",
  sourceSwfSha256: "94d7cb372e19e6f641eb5e51633e86b57ceb818b5a7a148fe02925e141252364",
  sourceTimelineId: "sprite-57", sourceFrameCount: 835,
  sourceTerminalStopFrame: null, candidateTerminalHoldFrame: 835,
  sourceControlCount: 5,
  definition: "A line segment is part of a line between two points.",
  endpoints: Object.freeze([Object.freeze({x: 2, y: 4, orderedPair: "(2,4)"}),
    Object.freeze({x: 8, y: 4, orderedPair: "(8,4)"})]),
  subtraction: "8 − 2 = 6", conclusion: "length = 6 units",
  constructionSequence: Object.freeze([
    Object.freeze({frame: 50, event: "coordinate-grid-visible"}),
    Object.freeze({frame: 150, event: "definition-and-grid-visible"}),
    Object.freeze({frame: 200, event: "first-endpoint-visible"}),
    Object.freeze({frame: 250, event: "second-endpoint-and-segment-visible"}),
    Object.freeze({frame: 450, event: "coordinate-emphasis-active"}),
    Object.freeze({frame: 700, event: "subtraction-revealing"}),
    Object.freeze({frame: 750, event: "length-conclusion-visible"}),
    Object.freeze({frame: 835, event: "candidate-terminal-hold"}),
  ]),
  sourceEmbeddedStreamBlockCount: 835,
  sourceEmbeddedStreamDurationMs: 69_538, sourceAudioAccepted: false,
  sourceTerminalBehaviorEstablished: false, legacyCourseShellRequired: false,
  spanishSourceVisualParityEstablished: false,
});

export const COURSE_G04_L11_IN_011_TERMS = Object.freeze([
  Object.freeze({id: "line-segment", sourceButtonObjectId: "24",
    sourceKeyAttribute: "Line segment", label: "Line segment",
    modernPedagogicalPrompt: "A line segment is the part of a line between two endpoints."}),
  Object.freeze({id: "line", sourceButtonObjectId: "25",
    sourceKeyAttribute: "Line", label: "Line",
    modernPedagogicalPrompt: "A line continues in both directions without ending."}),
  Object.freeze({id: "point", sourceButtonObjectId: "26",
    sourceKeyAttribute: "Point", label: "Point",
    modernPedagogicalPrompt: "A point marks one exact location on the coordinate grid."}),
  Object.freeze({id: "length", sourceButtonObjectId: "55",
    sourceKeyAttribute: "Length", label: "Length",
    modernPedagogicalPrompt: "Length tells the distance from one endpoint to the other."}),
  Object.freeze({id: "unit", sourceButtonObjectId: "56",
    sourceKeyAttribute: "Unit", label: "Unit",
    modernPedagogicalPrompt: "A unit is one equal step used to measure distance."}),
]);

export type CourseG04L11In011TermId =
  (typeof COURSE_G04_L11_IN_011_TERMS)[number]["id"];
export interface CourseG04L11In011LineSegmentState {
  readonly frame: number; readonly playing: boolean;
  readonly selectedTermId: CourseG04L11In011TermId | null;
  readonly panelOpen: boolean; readonly interactionRevision: number;
  readonly legacyHostCallCount: 0; readonly audioEnabled: false;
  readonly spanishSourceVisualParityEnabled: false;
}
export type CourseG04L11In011LineSegmentEvent =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{type: "select-term"; termId: CourseG04L11In011TermId; frame: number}>
  | Readonly<{type: "close-term"}>
  | Readonly<{type: "pause"; frame: number}>
  | Readonly<{type: "resume"; frame: number}>
  | Readonly<{type: "replay"}>;

export const COURSE_G04_L11_IN_011_INTERACTION_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true, sourceCanvasSequenceRetained: true,
  animationInternalPedagogicalControlsPreserved: true,
  modernLocalPlaybackControlsProvided: true, sourceTerminalBehaviorEstablished: false,
  legacyCourseShellNavigationIncluded: false, legacyPlayerChromeIncluded: false,
  legacyGlobalsExecuted: false, legacyDoHyperLinksExecuted: false,
  sourceAudioEnabled: false, sourceAudioAccepted: false,
  spanishSourceVisualParityEstablished: false, sourceDomainDeclared: false,
  registeredCurrentJavascript: false, authoritativeOriginalRuntimeAccepted: false,
  behaviorParityEstablished: false, visualFidelityEstablished: false,
  humanVisualReviewAccepted: false, ownerAccepted: false,
  strictMigrationComplete: false, lessonReleased: false, published: false,
  strictAcceptanceEffect: "none",
});

function invariant(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
function exactFrame(frame: number) {
  invariant(Number.isInteger(frame) && frame >= 1 && frame <= 835,
    `invalid IN011 local frame: ${frame}`);
  return frame;
}
const termById = (id: string) =>
  COURSE_G04_L11_IN_011_TERMS.find((term) => term.id === id) ?? null;
const freezeState = (state: CourseG04L11In011LineSegmentState) =>
  Object.freeze(state);

export function createCourseG04L11In011LineSegmentState(initialFrame = 1):
CourseG04L11In011LineSegmentState {
  const frame = exactFrame(initialFrame);
  return freezeState({frame, playing: frame < 835, selectedTermId: null,
    panelOpen: false, interactionRevision: 0, legacyHostCallCount: 0,
    audioEnabled: false, spanishSourceVisualParityEnabled: false});
}
export function getCourseG04L11In011SelectedTerm(
  state: CourseG04L11In011LineSegmentState,
) { return state.selectedTermId ? termById(state.selectedTermId) : null; }

export function reduceCourseG04L11In011LineSegment(
  state: CourseG04L11In011LineSegmentState,
  event: CourseG04L11In011LineSegmentEvent,
): CourseG04L11In011LineSegmentState {
  invariant(Object.isFrozen(state), "IN011 state must be frozen");
  switch (event.type) {
    case "synchronize-frame": {
      const frame = exactFrame(event.frame);
      if (!state.playing || state.panelOpen || frame === state.frame) return state;
      return freezeState({...state, frame, playing: frame < 835});
    }
    case "select-term":
      invariant(termById(event.termId), `unknown IN011 term: ${event.termId}`);
      return freezeState({...state, frame: exactFrame(event.frame), playing: false,
        selectedTermId: event.termId, panelOpen: true,
        interactionRevision: state.interactionRevision + 1});
    case "close-term":
      if (!state.panelOpen) return state;
      return freezeState({...state, selectedTermId: null, panelOpen: false,
        interactionRevision: state.interactionRevision + 1});
    case "pause":
      return freezeState({...state, frame: exactFrame(event.frame), playing: false,
        interactionRevision: state.interactionRevision + 1});
    case "resume": {
      const frame = exactFrame(event.frame);
      return freezeState({...state, frame, playing: frame < 835,
        selectedTermId: null, panelOpen: false,
        interactionRevision: state.interactionRevision + 1});
    }
    case "replay": return createCourseG04L11In011LineSegmentState();
    default: return event satisfies never;
  }
}
