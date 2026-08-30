import {COURSE_G04_L11_GS_002_DIRECTIONS, COURSE_G04_L11_GS_002_LEVELS} from
  "../source-static/g4-l11/course-g04-l11-gs-002-static";
import {getCourseG04L11Gs002CandidateCanvasFrame} from "./course-g04-l11-gs-002";

export const COURSE_G04_L11_GS_002_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l11-gs-002",
  sourceSwfSha256:
    "1ab04fa783eed441afdf386261bd6816e9084082db3b5cfce8fc63360f9167fd",
  pairedFlaStatus: "missing", sourceTimelineId: "sprite-227",
  sourceFrameCount: 729, repeatDirectionsLabelFrame: 4,
  selectLevelStopFrame: 728, modernInteractionBackgroundFrame: 727,
  terminalStructuralFrame: 729, directions: COURSE_G04_L11_GS_002_DIRECTIONS,
  scoreRule: Object.freeze({correctDelta: 10, incorrectDelta: -2}),
  levels: COURSE_G04_L11_GS_002_LEVELS,
  delegatedGameAnimationId: "course-g04-l11-gs-003",
  delegatedGameSourceBasename: "L11GS03",
  observedHostCallArgumentCounts: Object.freeze([2, 3]),
  sourceDirectionAndLaunchControlCount: 6, sourceGlossaryControlCount: 1,
  sourceEmbeddedStreamCount: 2, sourceAudioAccepted: false,
  externalSpanishAudioAccepted: false, legacyCourseShellRequired: false,
});

export type CourseG04L11Gs002LevelId =
  (typeof COURSE_G04_L11_GS_002_LEVELS)[number]["id"];

export interface CourseG04L11Gs002State {
  readonly frame: number; readonly sourceCanvasFrame: number;
  readonly phase: "directions" | "select-level" | "directions-popup" |
    "pair-glossary" | "launch-requested";
  readonly playing: boolean; readonly selectedLevelId: CourseG04L11Gs002LevelId | null;
  readonly message: string | null; readonly launchRequestCount: number;
  readonly delegatedGameAnimationId: "course-g04-l11-gs-003";
  readonly delegatedGameMounted: false; readonly hostCallExecuted: false;
  readonly hostCallSemanticsEstablished: false;
  readonly sourceAudioEnabled: false; readonly sourceAudioAccepted: false;
  readonly legacyHostCallCount: 0; readonly interactionRevision: number;
}

export type CourseG04L11Gs002Event =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{type: "skip-directions"}>
  | Readonly<{type: "repeat-directions"}>
  | Readonly<{type: "close-directions"}>
  | Readonly<{type: "select-level"; levelId: CourseG04L11Gs002LevelId}>
  | Readonly<{type: "start"}>
  | Readonly<{type: "back-to-level-selection"}>
  | Readonly<{type: "open-pair-glossary"}>
  | Readonly<{type: "close-pair-glossary"}>
  | Readonly<{type: "replay"}>;

export const COURSE_G04_L11_GS_002_INTERACTION_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true, sourceCanvasSequenceRetained: true,
  animationInternalPedagogicalControlsPreserved: true,
  directionAndLaunchControlsPreserved: 6, pairGlossaryControlPreserved: true,
  scoreRulePreserved: true, levelSelectionPreserved: true,
  delegatedGameRemainsSeparateMember: true,
  modernLaunchRequestDoesNotExecuteUnresolvedLegacyHostCall: true,
  legacyCourseShellNavigationIncluded: false, legacyPlayerChromeIncluded: false,
  legacyPreloaderIncluded: false, duplicateOldAndModernControlsIncluded: false,
  legacyGlobalsExecuted: false, legacyDoNeedMoreHelpExecuted: false,
  legacyDoHyperLinksExecuted: false, sourceAudioEnabled: false,
  sourceAudioAccepted: false, externalSpanishAudioAccepted: false,
  sourceDomainDeclared: false, registeredCurrentJavascript: false,
  authoritativeOriginalRuntimeAccepted: false, behaviorParityEstablished: false,
  visualFidelityEstablished: false, humanVisualReviewAccepted: false,
  ownerAccepted: false, strictMigrationComplete: false, lessonReleased: false,
  published: false, strictAcceptanceEffect: "none",
});

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function exactFrame(frame: number) {
  invariant(Number.isInteger(frame) && frame >= 1 && frame <= 729,
    `invalid GS002 local frame: ${frame}`);
  return frame;
}
const levelById = (id: string) => COURSE_G04_L11_GS_002_LEVELS.find((level) =>
  level.id === id) ?? null;
const freezeState = (state: CourseG04L11Gs002State) => Object.freeze(state);

export function createCourseG04L11Gs002State(initialFrame = 1):
CourseG04L11Gs002State {
  const frame = exactFrame(initialFrame); const selecting = frame >= 728;
  return freezeState({frame: selecting ? 728 : frame,
    sourceCanvasFrame: getCourseG04L11Gs002CandidateCanvasFrame(frame, selecting),
    phase: selecting ? "select-level" : "directions", playing: frame < 727,
    selectedLevelId: null, message: null, launchRequestCount: 0,
    delegatedGameAnimationId: "course-g04-l11-gs-003", delegatedGameMounted: false,
    hostCallExecuted: false, hostCallSemanticsEstablished: false,
    sourceAudioEnabled: false, sourceAudioAccepted: false, legacyHostCallCount: 0,
    interactionRevision: 0});
}

export function reduceCourseG04L11Gs002State(state: CourseG04L11Gs002State,
  event: CourseG04L11Gs002Event): CourseG04L11Gs002State {
  invariant(Object.isFrozen(state), "GS002 state must be frozen");
  switch (event.type) {
    case "synchronize-frame": {
      const requested = exactFrame(event.frame);
      if (state.phase === "directions-popup" || state.phase === "pair-glossary" ||
        state.phase === "launch-requested") return state;
      const selecting = state.phase === "select-level" || requested >= 728;
      const frame = selecting ? 728 : requested;
      return freezeState({...state, frame,
        sourceCanvasFrame: getCourseG04L11Gs002CandidateCanvasFrame(frame, selecting),
        phase: selecting ? "select-level" : "directions",
        playing: !selecting && requested < 727});
    }
    case "skip-directions":
      invariant(state.phase === "directions", "GS002 Skip Directions is unavailable");
      return freezeState({...state, frame: 728, sourceCanvasFrame: 727,
        phase: "select-level", playing: false, message: null,
        interactionRevision: state.interactionRevision + 1});
    case "repeat-directions":
      invariant(state.phase === "select-level", "GS002 Repeat Directions is unavailable");
      return freezeState({...state, phase: "directions-popup", playing: false,
        message: null, interactionRevision: state.interactionRevision + 1});
    case "close-directions":
      invariant(state.phase === "directions-popup", "GS002 directions are not open");
      return freezeState({...state, phase: "select-level",
        interactionRevision: state.interactionRevision + 1});
    case "select-level":
      invariant(state.phase === "select-level" && levelById(event.levelId),
        `unknown or unavailable GS002 level: ${event.levelId}`);
      return freezeState({...state, selectedLevelId: event.levelId, message: null,
        interactionRevision: state.interactionRevision + 1});
    case "start":
      invariant(state.phase === "select-level", "GS002 Start is unavailable");
      if (!state.selectedLevelId) return freezeState({...state,
        message: "Select Level 1 or Level 2, then choose Start.",
        interactionRevision: state.interactionRevision + 1});
      return freezeState({...state, phase: "launch-requested", playing: false,
        message: "The matching game is the separate GS003 activity.",
        launchRequestCount: state.launchRequestCount + 1,
        interactionRevision: state.interactionRevision + 1});
    case "back-to-level-selection":
      invariant(state.phase === "launch-requested", "GS002 launch request is not open");
      return freezeState({...state, phase: "select-level", message: null,
        interactionRevision: state.interactionRevision + 1});
    case "open-pair-glossary":
      invariant(state.phase === "select-level", "GS002 Pair glossary is unavailable");
      return freezeState({...state, phase: "pair-glossary", message: null,
        interactionRevision: state.interactionRevision + 1});
    case "close-pair-glossary":
      invariant(state.phase === "pair-glossary", "GS002 Pair glossary is not open");
      return freezeState({...state, phase: "select-level",
        interactionRevision: state.interactionRevision + 1});
    case "replay": return createCourseG04L11Gs002State(1);
  }
}
