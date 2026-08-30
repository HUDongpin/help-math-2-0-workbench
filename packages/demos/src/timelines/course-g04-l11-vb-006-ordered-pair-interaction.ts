export const COURSE_G04_L11_VB_006_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l11-vb-006",
  sourceSwfSha256:
    "12701c2e3e0edd8fd1bafbb942a8ff237cc931e0ab37e9a4f370df0060eb4a2e",
  sourceTimelineId: "sprite-85",
  sourceFrameCount: 439,
  sourceTerminalStopFrame: 439,
  sourceKeyTermButtonCount: 7,
  coordinateButtonFadeFrames: Object.freeze([425, 426, 427, 428, 429, 430]),
  sourceEmbeddedStreamBlockCount: 436,
  sourceEmbeddedStreamApproximateDurationMs: 36_310,
  sourceAudioAccepted: false,
  legacyCourseShellRequired: false,
  legacyPlayerChromeRequired: false,
  spanishRuntimeEstablished: false,
});

export const COURSE_G04_L11_VB_006_TERMS = Object.freeze([
  Object.freeze({id: "ordered-pair", label: "Ordered pair", sourceButtonObjectId: "10", sourcePlacementFrame: 1}),
  Object.freeze({id: "pair", label: "Pair", sourceButtonObjectId: "11", sourcePlacementFrame: 1}),
  Object.freeze({id: "number", label: "Number", sourceButtonObjectId: "12", sourcePlacementFrame: 1}),
  Object.freeze({id: "locate", label: "Locate", sourceButtonObjectId: "13", sourcePlacementFrame: 1}),
  Object.freeze({id: "point", label: "Point", sourceButtonObjectId: "14", sourcePlacementFrame: 1}),
  Object.freeze({id: "coordinate-grid", label: "Coordinate grid", sourceButtonObjectId: "55", sourcePlacementFrame: 64}),
  Object.freeze({id: "coordinate", label: "Coordinate", sourceButtonObjectId: "78", sourcePlacementFrame: 425}),
]);

export type CourseG04L11Vb006TermId =
  (typeof COURSE_G04_L11_VB_006_TERMS)[number]["id"];

export interface CourseG04L11Vb006InteractionState {
  readonly frame: number;
  readonly playing: boolean;
  readonly selectedTermId: CourseG04L11Vb006TermId | null;
  readonly panelOpen: boolean;
  readonly interactionRevision: number;
  readonly legacyHostCallCount: 0;
  readonly audioEnabled: false;
  readonly spanishRuntimeEnabled: false;
}

export type CourseG04L11Vb006InteractionEvent =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{type: "select-term"; termId: CourseG04L11Vb006TermId}>
  | Readonly<{type: "close-term"}>
  | Readonly<{type: "resume"; frame: number}>
  | Readonly<{type: "replay"}>;

export const COURSE_G04_L11_VB_006_INTERACTION_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true,
  sourceCanvasSequencePreserved: true,
  animationInternalPedagogicalControlsPreserved: true,
  legacyCourseShellNavigationIncluded: false,
  legacyPlayerChromeIncluded: false,
  legacyGlobalsExecuted: false,
  legacyDoHyperLinksExecuted: false,
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

function exactFrame(frame: number) {
  invariant(Number.isInteger(frame) && frame >= 1 && frame <= 439,
    `invalid VB006 local frame: ${frame}`);
  return frame;
}

function termById(termId: string) {
  return COURSE_G04_L11_VB_006_TERMS.find((term) => term.id === termId) ?? null;
}

function freezeState(
  state: CourseG04L11Vb006InteractionState,
): CourseG04L11Vb006InteractionState {
  return Object.freeze(state);
}

export function getCourseG04L11Vb006CoordinateButtonAlpha(frame: number) {
  exactFrame(frame);
  if (frame < 425) return 0;
  if (frame >= 430) return 1;
  return Object.freeze([0, 51, 102, 154, 205, 256])[frame - 425] / 256;
}

export function createCourseG04L11Vb006InteractionState(initialFrame = 1):
CourseG04L11Vb006InteractionState {
  const frame = exactFrame(initialFrame);
  return freezeState({
    frame,
    playing: frame < 439,
    selectedTermId: null,
    panelOpen: false,
    interactionRevision: 0,
    legacyHostCallCount: 0,
    audioEnabled: false,
    spanishRuntimeEnabled: false,
  });
}

export function getCourseG04L11Vb006SelectedTerm(
  state: CourseG04L11Vb006InteractionState,
) {
  return state.selectedTermId ? termById(state.selectedTermId) : null;
}

export function reduceCourseG04L11Vb006Interaction(
  state: CourseG04L11Vb006InteractionState,
  event: CourseG04L11Vb006InteractionEvent,
): CourseG04L11Vb006InteractionState {
  invariant(Object.isFrozen(state), "VB006 interaction state must be frozen");
  switch (event.type) {
    case "synchronize-frame": {
      const frame = exactFrame(event.frame);
      if (!state.playing || state.panelOpen || state.frame === frame) return state;
      return freezeState({...state, frame, playing: frame < 439});
    }
    case "select-term": {
      const term = termById(event.termId);
      invariant(term, `unknown VB006 term: ${event.termId}`);
      invariant(state.frame >= term.sourcePlacementFrame,
        `${term.label} is not source-visible at VB006 frame ${state.frame}`);
      return freezeState({...state, playing: false,
        selectedTermId: event.termId, panelOpen: true,
        interactionRevision: state.interactionRevision + 1});
    }
    case "close-term":
      if (!state.panelOpen) return state;
      return freezeState({...state, selectedTermId: null, panelOpen: false,
        interactionRevision: state.interactionRevision + 1});
    case "resume": {
      const frame = exactFrame(event.frame);
      return freezeState({...state, frame, playing: frame < 439,
        selectedTermId: null, panelOpen: false,
        interactionRevision: state.interactionRevision + 1});
    }
    case "replay":
      return createCourseG04L11Vb006InteractionState();
    default:
      return event satisfies never;
  }
}
