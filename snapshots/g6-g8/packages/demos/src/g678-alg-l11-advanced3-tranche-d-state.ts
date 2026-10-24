import type {ActivationInput} from "./g678-advanced-manual/contracts";
import {isActivationInput} from "./g678-advanced-manual/contracts";
import type {LessonHostNavigationHandoff, LessonHostRequest} from
  "./lesson-host-contract";

export const G678_ALG_L11_ADVANCED3_TRANCHE_D_PREFIX =
  "g678-alg-l11-advanced3-tranche-d" as const;

export const G678_ALG_L11_ADVANCED3_TRANCHE_D_SPEC = Object.freeze({
  audit: Object.freeze({
    path: "catalog/g678-alg-l11-advanced3-tranche-d-audit-v1.json",
    sha256:
      "03e9ba9bb7af3baa2df8bc1792834bd74ca502a56bc041f3a8860dc51dffec42",
    exactPlacementCount: 3,
    auditP0Count: 0,
    auditP1Count: 0,
  }),
  pages: Object.freeze([
    Object.freeze({animationId: "shared-alg001-l11-p033",
      sourcePath: "G6-G8-shared/ALG001/L11/GS/L11GS02.swf",
      sourceSha256:
        "a45ea47bc800183016612ef316ba9d54c3cc191764650cb2bce24bcd920061c2",
      lane: "advanced-manual-cross-page-game-controller"}),
    Object.freeze({animationId: "shared-alg001-l11-p034",
      sourcePath: "G6-G8-shared/ALG001/L11/GS/L11GS03.swf",
      sourceSha256:
        "77b4d2a8ee13325bd527f558751ac84e60d1de36d1ff258cb6569f36885ad06c",
      lane: "advanced-manual-matching-game-state-machine"}),
    Object.freeze({animationId: "shared-alg001-l11-p044",
      sourcePath: "G6-G8-shared/ALG001/L11/FQ/L11FQ02.swf",
      sourceSha256:
        "d17c24baef9bf9ea87eefae6cf5d317ad50a211035cd997e0cfba16eb6390ff1",
      lane: "advanced-manual-final-assessment-state-machine"}),
  ]),
  currentJavaScriptImplementedPlacementCount: 3,
  candidateModuleMaturity: "private-current-js",
  registrationCandidatePlacementCount: 0,
  currentJavaScriptRegisteredPlacementCount: 0,
  productCalibrationPassed: false,
  wholeLessonEngineeringPreviewReady: false,
  acceptancePassed: false,
  releaseAuthorized: false,
  published: false,
  acceptanceEffects: Object.freeze({
    currentJavaScriptRegistered: false,
    behaviorAccepted: false,
    authoritativeOriginalRuntime: false,
    visualFidelityAccepted: false,
    audioAccepted: false,
    humanVisualAccepted: false,
    ownerAccepted: false,
    strictComplete: false,
    released: false,
    published: false,
  }),
} as const);

export type AlgL11Advanced3Level = 1 | 2;
export type AlgL11Advanced3ControllerPhase = "initial" | "terminal";

export interface AlgL11Advanced3ControllerState {
  readonly phase: AlgL11Advanced3ControllerPhase;
  readonly level: AlgL11Advanced3Level | null;
  readonly startRequested: boolean;
  readonly replay: number;
  readonly blockedReason: string | null;
}

export type AlgL11Advanced3ControllerEvent =
  | Readonly<{type: "select-level"; level: AlgL11Advanced3Level;
      input: ActivationInput}>
  | Readonly<{type: "start"; input: ActivationInput}>
  | Readonly<{type: "replay"; input: ActivationInput}>;

export function createAlgL11Advanced3ControllerState(
  phase: AlgL11Advanced3ControllerPhase,
): AlgL11Advanced3ControllerState {
  return {phase, level: null, startRequested: false, replay: 0,
    blockedReason: null};
}

export function reduceAlgL11Advanced3Controller(
  state: AlgL11Advanced3ControllerState,
  event: AlgL11Advanced3ControllerEvent,
): AlgL11Advanced3ControllerState {
  if (!isActivationInput(event.input)) {
    return {...state, blockedReason: "activation-input-unsupported"};
  }
  if (event.type === "replay") {
    return {...createAlgL11Advanced3ControllerState(state.phase),
      replay: state.replay + 1};
  }
  if (event.type === "select-level") {
    return {...state, level: event.level, startRequested: false,
      blockedReason: null};
  }
  return state.level === null
    ? {...state, startRequested: false, blockedReason: "level-required"}
    : {...state, startRequested: true, blockedReason: null};
}

export interface AlgL11Advanced3NavigationIntent {
  readonly request: Extract<LessonHostRequest, {type: "navigate"}>;
  readonly legacyEvidence: Readonly<{
    target: "L11GS03";
    arguments: readonly ["L11GS03", 1] |
      readonly ["L11GS03", 1, 6];
    executed: false;
  }>;
}

export function buildAlgL11Advanced3NavigationIntent(
  state: AlgL11Advanced3ControllerState,
): AlgL11Advanced3NavigationIntent | null {
  if (!state.startRequested || state.level === null) return null;
  const handoff: LessonHostNavigationHandoff = Object.freeze({
    kind: "game-level", sourceAnimationId: "shared-alg001-l11-p033",
    targetAnimationId: "shared-alg001-l11-p034", level: state.level,
  });
  const sourceArguments = state.phase === "initial"
    ? Object.freeze(["L11GS03", 1] as const)
    : Object.freeze(["L11GS03", 1, 6] as const);
  return Object.freeze({request: Object.freeze({type: "navigate" as const,
    targetAnimationId: "shared-alg001-l11-p034", handoff}),
    legacyEvidence: Object.freeze({target: "L11GS03" as const,
      arguments: sourceArguments, executed: false as const})});
}

export interface AlgL11Advanced3MatchingCard {
  readonly id: string;
  readonly level: AlgL11Advanced3Level;
  readonly pairId: 1 | 2 | 3 | 4 | 5 | 6;
  readonly side: 1 | 2;
  readonly sourceCharacterId: number;
  readonly sourceInstanceName: string;
  readonly sourceTextIds: readonly number[];
  readonly sourceTextTokens: readonly string[];
  readonly sourceTextSha256s: readonly string[];
}

const P034_AUDIT_SOURCE_TEXT_SHA256_BY_ID: Readonly<Record<number, string>> =
  Object.freeze({
    56: "9073606df12b43d6c02d3384594727da52b384191d7ef882553ff59bb8fb0176",
    61: "d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35",
    62: "dabd3aff769f07eb2965401eb029974ebba3407afd02b26ddb564ea5f8efae72",
    63: "4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
    64: "2d711642b726b04401627ca9fbac32f5c8530fb1903cc4db02258717921a4881",
    67: "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
    68: "a318c24216defe206feeb73ef5be00033fa9c4a74d0b967f6532a26ca5906d3b",
    69: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
    72: "9287d9f4767054c10a4ae595194d77b11887ca896762136bf77767ba4156d939",
    73: "cbe5cfdf7c2118a9c3d78ef1d684f3afa089201352886449a06a6511cfef74a7",
    76: "76d6b603ea85901fa23fecebf88eeff4fcd59b1206575a8d8f31a013703951d5",
    79: "2c624232cdd221771294dfbb310aca000a0df6ac8b66b696d90ef06fdefb64a3",
    80: "62b67e1f685b7fef51102005dddd27774be3fee38c42965c53aab035d0b6b221",
    84: "68d0bed00782ed9634b860202e1f8a2f250173b23785e101f9f4e67a1776610a",
    192: "7902699be42c8a8e46fbbb4501726517e86b22c56a189f7625a6da49081b2451",
    193: "19581e27de7ced00ff1ce50b2047e7a567c76b1cbaebabe5ef03f7c3017bb5b7",
    194: "e7f6c011776e8db7cd330b54174fd76f7d0216b612387a5ffcfb81e6f0919683",
    199: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
    205: "5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9",
  });

function card(level: AlgL11Advanced3Level, sourceInstanceName: string,
  sourceCharacterId: number, sourceTextIds: readonly number[],
  sourceTextTokens: readonly string[]): AlgL11Advanced3MatchingCard {
  const match = sourceInstanceName.match(/^Mc([1-6])_([12])$/);
  if (!match || sourceTextIds.length !== sourceTextTokens.length) {
    throw new Error("ALG L11 matching source card is invalid");
  }
  const sourceTextSha256s = sourceTextIds.map((textId) =>
    P034_AUDIT_SOURCE_TEXT_SHA256_BY_ID[textId]);
  if (sourceTextSha256s.some((hash) => !/^[a-f0-9]{64}$/.test(hash ?? ""))) {
    throw new Error("ALG L11 matching source text hash is invalid");
  }
  return Object.freeze({id: `level-${level}-${sourceInstanceName}`,
    level, pairId: Number(match[1]) as 1 | 2 | 3 | 4 | 5 | 6,
    side: Number(match[2]) as 1 | 2, sourceCharacterId,
    sourceInstanceName, sourceTextIds: Object.freeze([...sourceTextIds]),
    sourceTextTokens: Object.freeze([...sourceTextTokens]),
    sourceTextSha256s: Object.freeze(sourceTextSha256s as string[])});
}

export const G678_ALG_L11_ADVANCED3_TRANCHE_D_MATCHING_CARDS = Object.freeze([
  card(1, "Mc1_1", 59, [56], ["10 < x <10"]),
  card(1, "Mc5_1", 65, [61, 62, 63, 64], ["2", "<", "3", "x"]),
  card(1, "Mc6_1", 70, [62, 67, 68, 64, 69], ["<", "1", "+", "x", "5"]),
  card(1, "Mc2_2", 74, [72, 73], ["x <5", "|"]),
  card(1, "Mc4_1", 77, [76], ["x+3>6"]),
  card(1, "Mc3_1", 81, [79, 61, 80, 63, 68, 64, 69],
    ["8", "2", ">", "3", "+", "x", "5"]),
  card(1, "Mc3_2", 83, [69, 80, 64], ["5", ">", "x"]),
  card(1, "Mc1_2", 86, [84], ["|x|<10"]),
  card(1, "Mc5_2", 88, [69, 62, 64], ["5", "<", "x"]),
  card(1, "Mc6_2", 90, [61, 62, 64], ["2", "<", "x"]),
  card(1, "Mc2_1", 92, [69, 62, 64], ["5", "<", "x"]),
  card(1, "Mc4_2", 93, [63, 80, 64], ["3", ">", "x"]),
  card(2, "Mc1_1", 195, [192, 61, 62, 193, 68, 64, 63, 194],
    ["7", "2", "<", "9", "+", "x", "3", "6"]),
  card(2, "Mc4_1", 198, [193, 80, 64, 63], ["9", ">", "x", "3"]),
  card(2, "Mc3_2", 201, [199, 80, 64], ["4", ">", "x"]),
  card(2, "Mc5_1", 203, [192, 80, 64], ["7", ">", "x"]),
  card(2, "Mc2_1", 206, [205, 67, 80, 69, 68, 64, 61, 63],
    ["0", "1", ">", "5", "+", "x", "2", "3"]),
  card(2, "Mc6_2", 208, [67, 62, 64], ["1", "<", "x"]),
  card(2, "Mc4_2", 211, [63, 62, 64], ["3", "<", "x"]),
  card(2, "Mc1_2", 213, [61, 67, 80, 64], ["2", "1", ">", "x"]),
  card(2, "Mc2_2", 215, [69, 62, 64], ["5", "<", "x"]),
  card(2, "Mc6_1", 217, [192, 80, 64], ["7", ">", "x"]),
  card(2, "Mc3_1", 219, [194, 62, 61, 68, 64, 69, 63],
    ["6", "<", "2", "+", "x", "5", "3"]),
  card(2, "Mc5_2", 221, [67, 80, 64], ["1", ">", "x"]),
]);

const EXPECTED_CARD_IDENTITIES = Object.freeze([
  "1:Mc1_1:59:56", "1:Mc5_1:65:61,62,63,64",
  "1:Mc6_1:70:62,67,68,64,69", "1:Mc2_2:74:72,73",
  "1:Mc4_1:77:76", "1:Mc3_1:81:79,61,80,63,68,64,69",
  "1:Mc3_2:83:69,80,64", "1:Mc1_2:86:84",
  "1:Mc5_2:88:69,62,64", "1:Mc6_2:90:61,62,64",
  "1:Mc2_1:92:69,62,64", "1:Mc4_2:93:63,80,64",
  "2:Mc1_1:195:192,61,62,193,68,64,63,194",
  "2:Mc4_1:198:193,80,64,63", "2:Mc3_2:201:199,80,64",
  "2:Mc5_1:203:192,80,64",
  "2:Mc2_1:206:205,67,80,69,68,64,61,63",
  "2:Mc6_2:208:67,62,64", "2:Mc4_2:211:63,62,64",
  "2:Mc1_2:213:61,67,80,64", "2:Mc2_2:215:69,62,64",
  "2:Mc6_1:217:192,80,64",
  "2:Mc3_1:219:194,62,61,68,64,69,63",
  "2:Mc5_2:221:67,80,64",
]);

const EXPECTED_CARD_TOKEN_ROWS = Object.freeze([
  ["10 < x <10"], ["2", "<", "3", "x"], ["<", "1", "+", "x", "5"],
  ["x <5", "|"], ["x+3>6"], ["8", "2", ">", "3", "+", "x", "5"],
  ["5", ">", "x"], ["|x|<10"], ["5", "<", "x"],
  ["2", "<", "x"], ["5", "<", "x"], ["3", ">", "x"],
  ["7", "2", "<", "9", "+", "x", "3", "6"],
  ["9", ">", "x", "3"], ["4", ">", "x"], ["7", ">", "x"],
  ["0", "1", ">", "5", "+", "x", "2", "3"], ["1", "<", "x"],
  ["3", "<", "x"], ["2", "1", ">", "x"], ["5", "<", "x"],
  ["7", ">", "x"], ["6", "<", "2", "+", "x", "5", "3"],
  ["1", ">", "x"],
]);

export function assertAlgL11Advanced3MatchingCards(
  cards: readonly AlgL11Advanced3MatchingCard[],
) {
  const identities = cards.map((item) => `${item.level}:${
    item.sourceInstanceName}:${item.sourceCharacterId}:${
    item.sourceTextIds.join(",")}`);
  const tokens = cards.map((item) => item.sourceTextTokens);
  const hashes = cards.map((item) => item.sourceTextSha256s);
  const expectedHashes = cards.map((item) => item.sourceTextIds.map((textId) =>
    P034_AUDIT_SOURCE_TEXT_SHA256_BY_ID[textId]));
  if (JSON.stringify(identities) !== JSON.stringify(EXPECTED_CARD_IDENTITIES) ||
    JSON.stringify(tokens) !== JSON.stringify(EXPECTED_CARD_TOKEN_ROWS) ||
    JSON.stringify(hashes) !== JSON.stringify(expectedHashes) ||
    cards.some((item) => item.sourceTextTokens.length !==
      item.sourceTextIds.length || item.sourceTextSha256s.length !==
      item.sourceTextIds.length)) {
    throw new Error("ALG L11 exact matching card contract is invalid");
  }
}

export interface AlgL11Advanced3MatchingState {
  readonly level: AlgL11Advanced3Level;
  readonly selectedCardId: string | null;
  readonly matchedPairIds: readonly number[];
  readonly score: number;
  readonly phase: "choosing" | "correct-feedback" | "wrong-feedback" |
    "complete";
  readonly replay: number;
  readonly blockedReason: string | null;
}

export type AlgL11Advanced3MatchingEvent =
  | Readonly<{type: "select-card"; cardId: string; input: ActivationInput}>
  | Readonly<{type: "dismiss-feedback"; input: ActivationInput}>
  | Readonly<{type: "switch-level"; level: AlgL11Advanced3Level;
      input: ActivationInput}>
  | Readonly<{type: "replay"; input: ActivationInput}>;

export function createAlgL11Advanced3MatchingState(
  level: AlgL11Advanced3Level,
): AlgL11Advanced3MatchingState {
  return {level, selectedCardId: null, matchedPairIds: Object.freeze([]),
    score: 0, phase: "choosing", replay: 0, blockedReason: null};
}

export function reduceAlgL11Advanced3Matching(
  state: AlgL11Advanced3MatchingState,
  event: AlgL11Advanced3MatchingEvent,
  cards = G678_ALG_L11_ADVANCED3_TRANCHE_D_MATCHING_CARDS,
): AlgL11Advanced3MatchingState {
  assertAlgL11Advanced3MatchingCards(cards);
  if (!isActivationInput(event.input)) {
    return {...state, blockedReason: "activation-input-unsupported"};
  }
  if (event.type === "replay") {
    return {...createAlgL11Advanced3MatchingState(state.level),
      replay: state.replay + 1};
  }
  if (event.type === "switch-level") {
    return {...createAlgL11Advanced3MatchingState(event.level),
      replay: state.replay};
  }
  if (event.type === "dismiss-feedback") {
    if (state.phase !== "correct-feedback" &&
      state.phase !== "wrong-feedback") {
      return {...state, blockedReason: "feedback-not-active"};
    }
    return {...state, selectedCardId: null,
      phase: state.matchedPairIds.length === 6 ? "complete" : "choosing",
      blockedReason: null};
  }
  if (state.phase !== "choosing") {
    return {...state, blockedReason: "cards-disabled-during-feedback"};
  }
  const levelCards = cards.filter((cardItem) => cardItem.level === state.level);
  const selected = levelCards.find((cardItem) => cardItem.id === event.cardId);
  if (!selected || state.matchedPairIds.includes(selected.pairId)) {
    return {...state, blockedReason: "card-unavailable"};
  }
  if (state.selectedCardId === null) {
    return {...state, selectedCardId: selected.id, blockedReason: null};
  }
  if (state.selectedCardId === selected.id) {
    return {...state, blockedReason: "same-card-selected"};
  }
  const first = levelCards.find((cardItem) =>
    cardItem.id === state.selectedCardId);
  if (!first) return {...state, blockedReason: "selected-card-missing"};
  const correct = first.pairId === selected.pairId &&
    first.side !== selected.side;
  const matchedPairIds = correct
    ? Object.freeze([...state.matchedPairIds, selected.pairId]
      .sort((left, right) => left - right))
    : state.matchedPairIds;
  return {...state, matchedPairIds, score: state.score + (correct ? 10 : -2),
    phase: correct ? "correct-feedback" : "wrong-feedback",
    blockedReason: null};
}

export const G678_ALG_L11_ADVANCED3_TRANCHE_D_AUDIT_ANSWER_KEY_PROJECTION =
  Object.freeze([
    "A1Opt4", "A2Opt1", "A3Opt4", "A4Opt3", "A5Opt3", "A6Opt4",
    "A7Opt2", "A8Opt1", "A9Opt4", "A10Opt2", "A11Opt4", "A12Opt1",
    "A13Opt3", "A14Opt4", "A15Opt2", "A16Opt4", "A17Opt3", "A18Opt2",
    "A19Opt3", "A20Opt1", "A21Opt4", "A22Opt3", "A23Opt2", "A24Opt1",
  ] as const);

export function buildAlgL11Advanced3AnswerKeyFromAudit(
  auditArtifactSha256: string,
  projection: readonly string[],
) {
  if (auditArtifactSha256 !==
      G678_ALG_L11_ADVANCED3_TRANCHE_D_SPEC.audit.sha256 ||
    JSON.stringify(projection) !== JSON.stringify(
      G678_ALG_L11_ADVANCED3_TRANCHE_D_AUDIT_ANSWER_KEY_PROJECTION)) {
    throw new Error("ALG L11 assessment audit answer-key projection drifted");
  }
  const options = projection.map((value, index) => {
    const match = value.match(/^A(\d{1,2})Opt([1-4])$/);
    if (!match || Number(match[1]) !== index + 1) {
      throw new Error("ALG L11 assessment audit answer-key item is invalid");
    }
    return Number(match[2]) as 1 | 2 | 3 | 4;
  });
  return Object.freeze(options);
}

export const G678_ALG_L11_ADVANCED3_TRANCHE_D_ANSWER_KEY =
  buildAlgL11Advanced3AnswerKeyFromAudit(
    G678_ALG_L11_ADVANCED3_TRANCHE_D_SPEC.audit.sha256,
    G678_ALG_L11_ADVANCED3_TRANCHE_D_AUDIT_ANSWER_KEY_PROJECTION,
  );

export interface AlgL11Advanced3AssessmentResponse {
  readonly questionNumber: number;
  readonly selectedOption: 1 | 2 | 3 | 4;
  readonly correctOption: 1 | 2 | 3 | 4;
  readonly correct: boolean;
}

export interface AlgL11Advanced3AssessmentState {
  readonly questionNumbers: readonly number[];
  readonly currentIndex: number;
  readonly responses: readonly AlgL11Advanced3AssessmentResponse[];
  readonly phase: "answering" | "results" | "review";
  readonly reviewIndex: number;
  readonly grade: "Unsatisfactory" | "Partially Proficient" |
    "Proficient" | "Advanced" | null;
  readonly replay: number;
  readonly blockedReason: string | null;
}

export type AlgL11Advanced3AssessmentEvent =
  | Readonly<{type: "answer"; option: 1 | 2 | 3 | 4;
      input: ActivationInput}>
  | Readonly<{type: "begin-review"; input: ActivationInput}>
  | Readonly<{type: "next-review"; input: ActivationInput}>
  | Readonly<{type: "finish-review"; input: ActivationInput}>
  | Readonly<{type: "replay"; input: ActivationInput}>;

function nextRandom(value: number) {
  return (Math.imul(value, 1664525) + 1013904223) >>> 0;
}

export function selectAlgL11Advanced3AssessmentQuestions(seed: number) {
  const pool = Array.from({length: 24}, (_, index) => index + 1);
  const selected = [];
  let state = Number.isSafeInteger(seed) ? seed >>> 0 : 0;
  while (selected.length < 10) {
    state = nextRandom(state);
    const index = state % pool.length;
    selected.push(pool[index]);
    pool.splice(index, 1);
  }
  return Object.freeze(selected);
}

export function gradeAlgL11Advanced3Assessment(correct: number) {
  if (!Number.isSafeInteger(correct) || correct < 0 || correct > 10) {
    throw new Error("ALG L11 assessment correct count is invalid");
  }
  if (correct <= 3) return "Unsatisfactory" as const;
  if (correct <= 6) return "Partially Proficient" as const;
  if (correct <= 8) return "Proficient" as const;
  return "Advanced" as const;
}

export function createAlgL11Advanced3AssessmentState(seed: number,
  replay = 0): AlgL11Advanced3AssessmentState {
  const replaySeed = (seed ^ Math.imul(replay, 0x9e3779b9)) >>> 0;
  return {questionNumbers: selectAlgL11Advanced3AssessmentQuestions(replaySeed),
    currentIndex: 0, responses: Object.freeze([]), phase: "answering",
    reviewIndex: 0, grade: null, replay, blockedReason: null};
}

export function reduceAlgL11Advanced3Assessment(
  state: AlgL11Advanced3AssessmentState,
  event: AlgL11Advanced3AssessmentEvent,
  seed: number,
): AlgL11Advanced3AssessmentState {
  if (!isActivationInput(event.input)) {
    return {...state, blockedReason: "activation-input-unsupported"};
  }
  if (event.type === "replay") {
    return createAlgL11Advanced3AssessmentState(seed, state.replay + 1);
  }
  if (event.type === "begin-review") {
    return state.phase === "results"
      ? {...state, phase: "review", reviewIndex: 0, blockedReason: null}
      : {...state, blockedReason: "results-not-ready"};
  }
  if (event.type === "next-review") {
    if (state.phase !== "review") {
      return {...state, blockedReason: "review-not-active"};
    }
    return {...state,
      reviewIndex: Math.min(state.reviewIndex + 1,
        Math.max(0, state.responses.length - 1)), blockedReason: null};
  }
  if (event.type === "finish-review") {
    return state.phase === "review" &&
      state.reviewIndex === state.responses.length - 1
      ? {...state, phase: "results", blockedReason: null}
      : {...state, blockedReason: "review-not-finished"};
  }
  if (state.phase !== "answering") {
    return {...state, blockedReason: "answering-complete"};
  }
  const questionNumber = state.questionNumbers[state.currentIndex];
  const correctOption = G678_ALG_L11_ADVANCED3_TRANCHE_D_ANSWER_KEY[
    questionNumber - 1];
  if (!questionNumber || !correctOption) {
    return {...state, blockedReason: "question-missing"};
  }
  const response = Object.freeze({questionNumber,
    selectedOption: event.option, correctOption,
    correct: event.option === correctOption});
  const responses = Object.freeze([...state.responses, response]);
  const finished = responses.length === 10;
  const correct = responses.filter((item) => item.correct).length;
  return {...state, responses,
    currentIndex: finished ? state.currentIndex : state.currentIndex + 1,
    phase: finished ? "results" : "answering",
    grade: finished ? gradeAlgL11Advanced3Assessment(correct) : null,
    blockedReason: null};
}
