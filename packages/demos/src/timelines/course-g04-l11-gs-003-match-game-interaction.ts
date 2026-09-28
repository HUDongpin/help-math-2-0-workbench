import {COURSE_G04_L11_GS_003_LEVEL_1_PAIRS,
  COURSE_G04_L11_GS_003_LEVEL_2_PAIRS,
  COURSE_G04_L11_GS_003_MATCHING_EVIDENCE} from
  "../source-static/g4-l11/course-g04-l11-gs-003-static";

export type CourseG04L11Gs003LevelId = "level-1" | "level-2";
export type CourseG04L11Gs003CardSide = "diagram" | "answer";
export type CourseG04L11Gs003CardId =
  `${CourseG04L11Gs003LevelId}:${string}:${CourseG04L11Gs003CardSide}`;

export interface CourseG04L11Gs003Card {
  readonly id: CourseG04L11Gs003CardId;
  readonly levelId: CourseG04L11Gs003LevelId;
  readonly pairId: string;
  readonly side: CourseG04L11Gs003CardSide;
  readonly sourceInstanceName: string;
  readonly sourceObjectId: number;
  readonly pointLabel: string | null;
  readonly coordinate: string | null;
  readonly distanceUnits: number | null;
}

const LEVEL_1_SOURCE_ORDER = Object.freeze([
  "Mc1:diagram", "Mc2:answer", "Mc5:diagram", "Mc6:answer",
  "Mc2:diagram", "Mc5:answer", "Mc4:answer", "Mc6:diagram",
  "Mc1:answer", "Mc3:diagram", "Mc3:answer", "Mc4:diagram",
] as const);
const LEVEL_2_SOURCE_ORDER = Object.freeze([
  "Mc1:diagram", "Mc1:answer", "Mc5:diagram", "Mc2:answer",
  "Mc4:diagram", "Mc3:answer", "Mc4:answer", "Mc3:diagram",
  "Mc6:answer", "Mc6:diagram", "Mc2:diagram", "Mc5:answer",
] as const);

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function card(levelId: CourseG04L11Gs003LevelId, token: string):
CourseG04L11Gs003Card {
  const [pairId, sideValue] = token.split(":");
  invariant((sideValue === "diagram" || sideValue === "answer") && pairId,
    `invalid GS003 source card token: ${token}`);
  const side = sideValue as CourseG04L11Gs003CardSide;
  if (levelId === "level-1") {
    const pair = COURSE_G04_L11_GS_003_LEVEL_1_PAIRS.find((candidate) =>
      candidate.pairId === pairId);
    invariant(pair, `unknown GS003 Level 1 pair: ${pairId}`);
    return Object.freeze({id: `${levelId}:${pairId}:${side}`, levelId, pairId, side,
      sourceInstanceName: side === "diagram" ? pair.diagramInstance : pair.answerInstance,
      sourceObjectId: side === "diagram" ? pair.diagramObjectId : pair.answerObjectId,
      pointLabel: pair.pointLabel, coordinate: pair.coordinate, distanceUnits: null});
  }
  const pair = COURSE_G04_L11_GS_003_LEVEL_2_PAIRS.find((candidate) =>
    candidate.pairId === pairId);
  invariant(pair, `unknown GS003 Level 2 pair: ${pairId}`);
  return Object.freeze({id: `${levelId}:${pairId}:${side}`, levelId, pairId, side,
    sourceInstanceName: side === "diagram" ? pair.diagramInstance : pair.answerInstance,
    sourceObjectId: side === "diagram" ? pair.diagramObjectId : pair.answerObjectId,
    pointLabel: null, coordinate: null, distanceUnits: pair.distanceUnits});
}

export const COURSE_G04_L11_GS_003_LEVEL_1_CARDS = Object.freeze(
  LEVEL_1_SOURCE_ORDER.map((token) => card("level-1", token)));
export const COURSE_G04_L11_GS_003_LEVEL_2_CARDS = Object.freeze(
  LEVEL_2_SOURCE_ORDER.map((token) => card("level-2", token)));

export const COURSE_G04_L11_GS_003_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l11-gs-003",
  sourceSwfSha256:
    "3dea7d98fe2cf38b880232743832dbd1b6a9219c1dca16f518045d76f18d7b3a",
  pairedFlaStatus: "missing", sourceTimelineId: "sprite-231",
  sourceFrameCount: 6, level1LocalFrame: 3, level2LocalFrame: 5,
  sourcePairCountPerLevel: 6, sourceCardCountPerLevel: 12,
  scoreRule: COURSE_G04_L11_GS_003_MATCHING_EVIDENCE.sourceClickScoreRule,
  sourceAllowsNegativeScore: true,
  pairIdentityRule: COURSE_G04_L11_GS_003_MATCHING_EVIDENCE.pairIdentityRule,
  pairIdentityEstablished: true, sourceAudioEnabled: false,
  sourceAudioAccepted: false, legacyCourseShellRequired: false,
});

export interface CourseG04L11Gs003State {
  readonly phase: "directions" | "select-level" | "playing" | "complete";
  readonly directionsOpen: boolean;
  readonly selectedLevelId: CourseG04L11Gs003LevelId;
  readonly selectedCardId: CourseG04L11Gs003CardId | null;
  readonly matchedPairIds: readonly string[];
  readonly score: number;
  readonly feedback: "correct" | "incorrect" | null;
  readonly attempts: number;
  readonly completedPairCount: number;
  readonly sourceAudioEnabled: false;
  readonly sourceAudioAccepted: false;
  readonly interactionRevision: number;
}

export type CourseG04L11Gs003Event =
  | Readonly<{type: "continue-to-levels"}>
  | Readonly<{type: "select-level"; levelId: CourseG04L11Gs003LevelId}>
  | Readonly<{type: "start"}>
  | Readonly<{type: "select-card"; cardId: CourseG04L11Gs003CardId}>
  | Readonly<{type: "repeat-directions"}>
  | Readonly<{type: "close-directions"}>
  | Readonly<{type: "back-to-levels"}>
  | Readonly<{type: "replay"}>;

function freezeState(state: CourseG04L11Gs003State): CourseG04L11Gs003State {
  const matchedPairIds = Object.freeze([...state.matchedPairIds]);
  return Object.freeze({...state, matchedPairIds});
}

export function getCourseG04L11Gs003Cards(levelId: CourseG04L11Gs003LevelId) {
  return levelId === "level-1" ? COURSE_G04_L11_GS_003_LEVEL_1_CARDS :
    COURSE_G04_L11_GS_003_LEVEL_2_CARDS;
}

export function createCourseG04L11Gs003State(): CourseG04L11Gs003State {
  return freezeState({phase: "directions", directionsOpen: true,
    selectedLevelId: "level-1", selectedCardId: null, matchedPairIds: [], score: 0,
    feedback: null, attempts: 0, completedPairCount: 0,
    sourceAudioEnabled: false, sourceAudioAccepted: false, interactionRevision: 0});
}

function resetLevel(state: CourseG04L11Gs003State,
  selectedLevelId: CourseG04L11Gs003LevelId, phase: "select-level" | "playing") {
  return freezeState({...state, phase, directionsOpen: false, selectedLevelId,
    selectedCardId: null, matchedPairIds: [], score: 0, feedback: null, attempts: 0,
    completedPairCount: 0, interactionRevision: state.interactionRevision + 1});
}

export function reduceCourseG04L11Gs003State(state: CourseG04L11Gs003State,
  event: CourseG04L11Gs003Event): CourseG04L11Gs003State {
  invariant(Object.isFrozen(state) && Object.isFrozen(state.matchedPairIds),
    "GS003 state must be deeply frozen");
  switch (event.type) {
    case "continue-to-levels":
      invariant(state.phase === "directions", "GS003 directions are unavailable");
      return resetLevel(state, state.selectedLevelId, "select-level");
    case "select-level":
      invariant(state.phase === "select-level", "GS003 level selection is unavailable");
      return resetLevel(state, event.levelId, "select-level");
    case "start":
      invariant(state.phase === "select-level", "GS003 Start is unavailable");
      return resetLevel(state, state.selectedLevelId, "playing");
    case "repeat-directions":
      invariant(state.phase !== "directions", "GS003 directions are already open");
      return freezeState({...state, directionsOpen: true,
        interactionRevision: state.interactionRevision + 1});
    case "close-directions":
      invariant(state.directionsOpen, "GS003 directions are not open");
      return freezeState({...state, directionsOpen: false,
        interactionRevision: state.interactionRevision + 1});
    case "back-to-levels":
      invariant(state.phase === "playing" || state.phase === "complete",
        "GS003 level selection is unavailable");
      return resetLevel(state, state.selectedLevelId, "select-level");
    case "replay": return createCourseG04L11Gs003State();
    case "select-card": {
      invariant(state.phase === "playing", "GS003 cards are unavailable");
      const cards = getCourseG04L11Gs003Cards(state.selectedLevelId);
      const chosen = cards.find((candidate) => candidate.id === event.cardId);
      invariant(chosen, `unknown GS003 card: ${event.cardId}`);
      if (state.matchedPairIds.includes(chosen.pairId) ||
        state.selectedCardId === chosen.id) return state;
      if (!state.selectedCardId) return freezeState({...state,
        selectedCardId: chosen.id, feedback: null,
        interactionRevision: state.interactionRevision + 1});
      const first = cards.find((candidate) => candidate.id === state.selectedCardId);
      invariant(first, "GS003 selected card left the active source level");
      const correct = first.pairId === chosen.pairId && first.side !== chosen.side;
      if (!correct) return freezeState({...state, selectedCardId: null,
        score: state.score - 2, feedback: "incorrect", attempts: state.attempts + 1,
        interactionRevision: state.interactionRevision + 1});
      const matchedPairIds = [...state.matchedPairIds, chosen.pairId];
      const complete = matchedPairIds.length === 6;
      return freezeState({...state, phase: complete ? "complete" : "playing",
        selectedCardId: null, matchedPairIds, score: state.score + 10,
        feedback: "correct", attempts: state.attempts + 1,
        completedPairCount: matchedPairIds.length,
        interactionRevision: state.interactionRevision + 1});
    }
  }
}

export const COURSE_G04_L11_GS_003_INTERACTION_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true,
  deterministicTypedLocalStateUsed: true,
  exactSourcePairIdentityPreserved: true,
  exactSourceScoreDeltasPreserved: true,
  sourceNegativeScoreAllowancePreserved: true,
  animationInternalPedagogicalControlsPreserved: true,
  modernSameCardRepeatIsSafeNoOp: true,
  sourceRepeatedSameCardBehaviorEstablished: false,
  modernVisualRewardReconstructed: true,
  sourcePictureVisualFidelityEstablished: false,
  sourceAudioEnabled: false, sourceAudioAccepted: false,
  legacyCourseShellNavigationIncluded: false,
  legacyPlayerChromeIncluded: false, legacyPreloaderIncluded: false,
  duplicateOldAndModernControlsIncluded: false,
  legacyGlobalsExecuted: false, legacyEvalExecuted: false,
  legacyIntervalsExecuted: false, legacyNavigationExecuted: false,
  sourceDomainDeclared: false, registeredCurrentJavascript: false,
  authoritativeOriginalRuntimeAccepted: false, behaviorParityEstablished: false,
  visualFidelityEstablished: false, humanVisualReviewAccepted: false,
  ownerAccepted: false, strictMigrationComplete: false, lessonReleased: false,
  published: false, strictAcceptanceEffect: "none",
});
