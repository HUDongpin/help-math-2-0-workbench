export const COURSE_G04_L11_VB_004_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l11-vb-004",
  sourceSwfSha256:
    "46c6d94e6646a9f799d8f8625c3dec6c1e9fcf8bdcac57cc2d0fdbfa59404608",
  sourceTimelineId: "sprite-71",
  sourceFrameCount: 157,
  sourceTerminalStopFrame: 157,
  firstObservedControlPlacementFrame: 9,
  repeatedObservedControlPlacementFrame: 64,
  sourceControlCount: 4,
  sourceEmbeddedStreamDurationMs: 12_487,
  sourceEmbeddedStreamAccepted: false,
  legacyCourseShellRequired: false,
  legacyDefinitionTextRecovered: false,
  spanishRuntimeEstablished: false,
});

export const COURSE_G04_L11_VB_004_TERMS = Object.freeze([
  Object.freeze({
    id: "y-axis",
    sourceButtonObjectId: "46",
    sourceKeyAttribute: "Y-axis",
    label: "Y-axis",
    modernPedagogicalPrompt: "Highlight the vertical axis.",
  }),
  Object.freeze({
    id: "vertical",
    sourceButtonObjectId: "47",
    sourceKeyAttribute: "Vertical",
    label: "Vertical",
    modernPedagogicalPrompt: "Show the up-and-down direction.",
  }),
  Object.freeze({
    id: "number-line",
    sourceButtonObjectId: "48",
    sourceKeyAttribute: "Number line",
    label: "Number line",
    modernPedagogicalPrompt: "Show values arranged along a vertical line.",
  }),
  Object.freeze({
    id: "coordinate-grid",
    sourceButtonObjectId: "49",
    sourceKeyAttribute: "Coordinate grid",
    label: "Coordinate grid",
    modernPedagogicalPrompt: "Show the horizontal and vertical axes together.",
  }),
]);

export type CourseG04L11Vb004TermId =
  (typeof COURSE_G04_L11_VB_004_TERMS)[number]["id"];

export interface CourseG04L11Vb004VocabularyState {
  readonly frame: number;
  readonly playing: boolean;
  readonly selectedTermId: CourseG04L11Vb004TermId | null;
  readonly panelOpen: boolean;
  readonly interactionRevision: number;
  readonly legacyHostCallCount: 0;
  readonly audioEnabled: false;
  readonly spanishRuntimeEnabled: false;
}
export type CourseG04L11Vb004VocabularyEvent =
  | Readonly<{type: "advance"}>
  | Readonly<{
    type: "select-term";
    termId: CourseG04L11Vb004TermId;
    frame: number;
  }>
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{type: "close-term"}>
  | Readonly<{type: "resume"; frame: number}>
  | Readonly<{type: "replay"}>;

export interface CourseG04L11Vb004VisualEmphasis {
  readonly showFullGrid: boolean;
  readonly emphasizeYAxis: boolean;
  readonly showYAxisNumbers: boolean;
  readonly showVerticalDirection: boolean;
}

export const COURSE_G04_L11_VB_004_INTERACTION_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true,
  animationInternalPedagogicalControlsPreserved: true,
  legacyCourseShellNavigationIncluded: false,
  legacyPlayerChromeIncluded: false,
  legacyGlobalsExecuted: false,
  legacyDoHyperLinksExecuted: false,
  sourceDefinitionTextParityEstablished: false,
  spanishVisualRuntimeEstablished: false,
  sourceAudioEnabled: false,
  sourceAudioAccepted: false,
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

function termById(termId: string) {
  return COURSE_G04_L11_VB_004_TERMS.find((term) => term.id === termId) ?? null;
}

function exactFrame(frame: number) {
  invariant(Number.isInteger(frame) && frame >= 1 && frame <= 157,
    `invalid VB004 local frame: ${frame}`);
  return frame;
}

function freezeState(
  state: CourseG04L11Vb004VocabularyState,
): CourseG04L11Vb004VocabularyState {
  return Object.freeze(state);
}

export function createCourseG04L11Vb004VocabularyState(initialFrame = 1):
CourseG04L11Vb004VocabularyState {
  return freezeState({
    frame: exactFrame(initialFrame),
    playing: true,
    selectedTermId: null,
    panelOpen: false,
    interactionRevision: 0,
    legacyHostCallCount: 0,
    audioEnabled: false,
    spanishRuntimeEnabled: false,
  });
}

export function getCourseG04L11Vb004SelectedTerm(
  state: CourseG04L11Vb004VocabularyState,
) {
  return state.selectedTermId ? termById(state.selectedTermId) : null;
}

export function getCourseG04L11Vb004VisualEmphasis(
  state: CourseG04L11Vb004VocabularyState,
): CourseG04L11Vb004VisualEmphasis {
  return Object.freeze({
    showFullGrid: state.selectedTermId === "coordinate-grid",
    emphasizeYAxis: state.selectedTermId === "y-axis"
      || state.selectedTermId === "vertical"
      || state.selectedTermId === "number-line",
    showYAxisNumbers: state.selectedTermId === "number-line",
    showVerticalDirection: state.selectedTermId === "vertical",
  });
}

export function reduceCourseG04L11Vb004Vocabulary(
  state: CourseG04L11Vb004VocabularyState,
  event: CourseG04L11Vb004VocabularyEvent,
): CourseG04L11Vb004VocabularyState {
  invariant(Object.isFrozen(state), "VB004 vocabulary state must be frozen");
  switch (event.type) {
    case "advance": {
      if (!state.playing || state.frame === 157) return state;
      const frame = state.frame + 1;
      return freezeState({...state, frame, playing: frame < 157});
    }
    case "select-term": {
      invariant(termById(event.termId), `unknown VB004 term: ${event.termId}`);
      return freezeState({
        ...state,
        frame: exactFrame(event.frame),
        playing: false,
        selectedTermId: event.termId,
        panelOpen: true,
        interactionRevision: state.interactionRevision + 1,
      });
    }
    case "synchronize-frame": {
      const frame = exactFrame(event.frame);
      if (!state.playing || state.panelOpen || state.frame === frame) return state;
      return freezeState({...state, frame, playing: frame < 157});
    }
    case "close-term":
      if (!state.panelOpen) return state;
      return freezeState({
        ...state,
        selectedTermId: null,
        panelOpen: false,
        interactionRevision: state.interactionRevision + 1,
      });
    case "resume":
      return freezeState({
        ...state,
        frame: exactFrame(event.frame),
        playing: event.frame < 157,
        selectedTermId: null,
        panelOpen: false,
        interactionRevision: state.interactionRevision + 1,
      });
    case "replay":
      return createCourseG04L11Vb004VocabularyState();
    default:
      return event satisfies never;
  }
}
