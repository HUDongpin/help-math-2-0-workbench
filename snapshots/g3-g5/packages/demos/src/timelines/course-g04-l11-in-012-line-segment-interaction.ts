export const COURSE_G04_L11_IN_012_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l11-in-012",
  sourceSwfSha256: "8c77afe6a63ff8254be0307f90b3e3f15dd9d1243fc370550af8c5049a341cb2",
  sourceTimelineId: "sprite-68", sourceFrameCount: 440,
  sourceTerminalStopFrame: null, candidateTerminalHoldFrame: 440,
  sourceControlCount: 2,
  definition: "A line segment is part of a line between two points.",
  orientation: "vertical",
  endpoints: Object.freeze([Object.freeze({x: 3, y: 1, orderedPair: "(3,1)"}),
    Object.freeze({x: 3, y: 9, orderedPair: "(3,9)"})]),
  subtraction: "9 − 1 = 8", conclusion: "length = 8 units",
  constructionSequence: Object.freeze([
    Object.freeze({frame: 40, event: "coordinate-grid-visible"}),
    Object.freeze({frame: 120, event: "definition-and-grid-visible"}),
    Object.freeze({frame: 240, event: "vertical-segment-construction-visible"}),
    Object.freeze({frame: 280, event: "coordinate-emphasis-active"}),
    Object.freeze({frame: 360, event: "subtraction-revealing"}),
    Object.freeze({frame: 400, event: "length-conclusion-visible"}),
    Object.freeze({frame: 440, event: "candidate-terminal-hold"}),
  ]),
  sourceEmbeddedStreamBlockCount: 433,
  sourceEmbeddedStreamDurationMs: 36_049,
  sourceExternalSpanishAudioDurationMs: 22_872,
  sourceAudioAccepted: false, sourceExternalSpanishAudioAccepted: false,
  sourceTerminalBehaviorEstablished: false, legacyCourseShellRequired: false,
  spanishSourceVisualParityEstablished: false,
});

export const COURSE_G04_L11_IN_012_TERMS = Object.freeze([
  Object.freeze({id: "length", sourceButtonObjectId: "66",
    sourceKeyAttribute: "Length", label: "Length",
    modernPedagogicalPrompt: "Length tells the distance from one endpoint to the other."}),
  Object.freeze({id: "unit", sourceButtonObjectId: "67",
    sourceKeyAttribute: "Unit", label: "Unit",
    modernPedagogicalPrompt: "A unit is one equal step used to measure distance."}),
]);

export type CourseG04L11In012TermId =
  (typeof COURSE_G04_L11_IN_012_TERMS)[number]["id"];
export interface CourseG04L11In012LineSegmentState {
  readonly frame: number; readonly playing: boolean;
  readonly selectedTermId: CourseG04L11In012TermId | null;
  readonly panelOpen: boolean; readonly interactionRevision: number;
  readonly legacyHostCallCount: 0; readonly audioEnabled: false;
  readonly externalSpanishAudioEnabled: false;
  readonly spanishSourceVisualParityEnabled: false;
}
export type CourseG04L11In012LineSegmentEvent =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{type: "select-term"; termId: CourseG04L11In012TermId; frame: number}>
  | Readonly<{type: "close-term"}>
  | Readonly<{type: "pause"; frame: number}>
  | Readonly<{type: "resume"; frame: number}>
  | Readonly<{type: "replay"}>;

export const COURSE_G04_L11_IN_012_INTERACTION_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true, sourceCanvasSequenceRetained: true,
  animationInternalPedagogicalControlsPreserved: true,
  modernLocalPlaybackControlsProvided: true, sourceTerminalBehaviorEstablished: false,
  legacyCourseShellNavigationIncluded: false, legacyPlayerChromeIncluded: false,
  legacyGlobalsExecuted: false, legacyDoHyperLinksExecuted: false,
  sourceAudioEnabled: false, sourceAudioAccepted: false,
  externalSpanishAudioEnabled: false, externalSpanishAudioAccepted: false,
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
  invariant(Number.isInteger(frame) && frame >= 1 && frame <= 440,
    `invalid IN012 local frame: ${frame}`);
  return frame;
}
const termById = (id: string) =>
  COURSE_G04_L11_IN_012_TERMS.find((term) => term.id === id) ?? null;
const freezeState = (state: CourseG04L11In012LineSegmentState) =>
  Object.freeze(state);

export function createCourseG04L11In012LineSegmentState(initialFrame = 1):
CourseG04L11In012LineSegmentState {
  const frame = exactFrame(initialFrame);
  return freezeState({frame, playing: frame < 440, selectedTermId: null,
    panelOpen: false, interactionRevision: 0, legacyHostCallCount: 0,
    audioEnabled: false, externalSpanishAudioEnabled: false,
    spanishSourceVisualParityEnabled: false});
}
export function getCourseG04L11In012SelectedTerm(
  state: CourseG04L11In012LineSegmentState,
) { return state.selectedTermId ? termById(state.selectedTermId) : null; }

export function reduceCourseG04L11In012LineSegment(
  state: CourseG04L11In012LineSegmentState,
  event: CourseG04L11In012LineSegmentEvent,
): CourseG04L11In012LineSegmentState {
  invariant(Object.isFrozen(state), "IN012 state must be frozen");
  switch (event.type) {
    case "synchronize-frame": {
      const frame = exactFrame(event.frame);
      if (!state.playing || state.panelOpen || frame === state.frame) return state;
      return freezeState({...state, frame, playing: frame < 440});
    }
    case "select-term":
      invariant(termById(event.termId), `unknown IN012 term: ${event.termId}`);
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
      return freezeState({...state, frame, playing: frame < 440,
        selectedTermId: null, panelOpen: false,
        interactionRevision: state.interactionRevision + 1});
    }
    case "replay": return createCourseG04L11In012LineSegmentState();
    default: return event satisfies never;
  }
}
