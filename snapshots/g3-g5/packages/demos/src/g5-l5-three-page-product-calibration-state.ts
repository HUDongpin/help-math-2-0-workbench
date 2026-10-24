/**
 * Pure, deterministic product-state contracts for the G5 L5 P4 calibration
 * pages VB013, TS008, and FQ002.
 *
 * The transitions below are reconstructed from the exact hash-bound static
 * source artifacts in G5_L5_THREE_PAGE_PRODUCT_CALIBRATION_SOURCE_BINDINGS.
 * They do not execute AVM1, establish an original-runtime natural trace,
 * accept audio, send a legacy report, or claim visual fidelity. FQ002 uses a
 * documented product-seeded Mulberry32 order; that order is intentionally not
 * represented as parity with Flash's AVM1 random() implementation.
 */

type PlainRecord = Record<string, unknown>;

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const nested of Object.values(value as PlainRecord)) {
      deepFreeze(nested);
    }
    Object.freeze(value);
  }
  return value;
}

function assertDeepFrozen(value: unknown, label: string): void {
  if (value === null || typeof value !== "object") return;
  invariant(Object.isFrozen(value), `${label} must be deeply frozen`);
  for (const [key, nested] of Object.entries(value as PlainRecord)) {
    assertDeepFrozen(nested, `${label}.${key}`);
  }
}

function record(value: unknown, label: string): PlainRecord {
  invariant(
    value !== null && typeof value === "object" && !Array.isArray(value),
    `${label} must be an object`,
  );
  return value as PlainRecord;
}

function assertExactKeys(
  value: PlainRecord,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  invariant(
    JSON.stringify(actual) === JSON.stringify(wanted),
    `${label} has missing or unexpected fields`,
  );
}

function assertIntegerInRange(
  value: unknown,
  minimum: number,
  maximum: number,
  label: string,
): asserts value is number {
  invariant(
    Number.isSafeInteger(value) &&
      (value as number) >= minimum &&
      (value as number) <= maximum,
    `${label} must be an integer from ${minimum} through ${maximum}`,
  );
}

export type G5L5ThreePageCalibrationKind =
  | "fixed-choice"
  | "multi-section"
  | "randomized-final-quiz";

export interface G5L5ThreePageCalibrationSourceBinding {
  readonly animationId: string;
  readonly kind: G5L5ThreePageCalibrationKind;
  readonly sourceSwfArtifact: string;
  readonly sourceSwfSha256: string;
  readonly sourceFrameDomain: string;
  readonly sourceFrameCount: number;
  readonly initialProductStopFrame: number;
  readonly terminalProductFrame: number;
  readonly frameDomainArtifact: string;
  readonly frameDomainArtifactSha256: string;
  readonly userEventPcodeFileCount: number;
  readonly ffdecScriptsArtifact: string;
  readonly ffdecScriptsArtifactSha256: string;
  readonly scenarioInventoryArtifact: string;
  readonly scenarioInventoryArtifactSha256: string;
  readonly behaviorCompositeContractId: string;
  readonly randomizationDisposition?:
    "deterministic-mulberry32-product-seed-not-avm1-random-parity";
}

export const G5_L5_VB013_BEHAVIOR_COMPOSITE_CONTRACT_ID =
  "g5-l5-vb013-source-behavior-composite-v1" as const;
export const G5_L5_TS008_BEHAVIOR_COMPOSITE_CONTRACT_ID =
  "g5-l5-ts008-source-behavior-composite-v1" as const;
export const G5_L5_FQ002_BEHAVIOR_COMPOSITE_CONTRACT_ID =
  "g5-l5-fq002-source-behavior-composite-v1" as const;
export const G5_L5_FQ002_RANDOMIZATION_DISPOSITION =
  "deterministic-mulberry32-product-seed-not-avm1-random-parity" as const;

export const G5_L5_THREE_PAGE_PRODUCT_CALIBRATION_SOURCE_BINDINGS:
  readonly G5L5ThreePageCalibrationSourceBinding[] = deepFreeze([
    {
      animationId: "course-g05-l05-vb-013",
      kind: "fixed-choice",
      sourceSwfArtifact:
        "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L5/VB/L5VB13.swf",
      sourceSwfSha256:
        "cc2b3a405682e3fc684ebdcebc72be044eeb1817839dd6f0f9fe5a4fd1eb9811",
      sourceFrameDomain: "sprite-225",
      sourceFrameCount: 201,
      initialProductStopFrame: 92,
      terminalProductFrame: 201,
      frameDomainArtifact:
        "migrations/course-g05-l05-vb-013/audit/frame-domain-disposition.json",
      frameDomainArtifactSha256:
        "14ff19701f229d65defaa4084710c19c5030ad2ac20f035cda55d87337cacecf",
      userEventPcodeFileCount: 3,
      ffdecScriptsArtifact:
        "migrations/course-g05-l05-vb-013/audit/machine/ffdec-scripts.txt.gz",
      ffdecScriptsArtifactSha256:
        "ce932bdecb1190737d5b33a079ae5398ed77316716453bf068d26793156485d3",
      scenarioInventoryArtifact:
        "migrations/course-g05-l05-vb-013/audit/scenario-inventory.json",
      scenarioInventoryArtifactSha256:
        "81ad4717791f8b9e17db1a788dfdb9a185a555023e5ba174045d796f941e3da6",
      behaviorCompositeContractId:
        G5_L5_VB013_BEHAVIOR_COMPOSITE_CONTRACT_ID,
    },
    {
      animationId: "course-g05-l05-ts-008",
      kind: "multi-section",
      sourceSwfArtifact:
        "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L5/TS/L5TS08.swf",
      sourceSwfSha256:
        "752ec6444203e2faff46a9c711ed76ee54a9f42e1111d9f78aad506cf8cc95d2",
      sourceFrameDomain: "sprite-347",
      sourceFrameCount: 690,
      initialProductStopFrame: 247,
      terminalProductFrame: 690,
      frameDomainArtifact:
        "migrations/course-g05-l05-ts-008/audit/frame-domain-disposition.json",
      frameDomainArtifactSha256:
        "757194d519af6058ce1aeb6bb64d7afd9634ab048220bebb91712c5f003c3285",
      userEventPcodeFileCount: 34,
      ffdecScriptsArtifact:
        "migrations/course-g05-l05-ts-008/audit/machine/ffdec-scripts.txt.gz",
      ffdecScriptsArtifactSha256:
        "4324d666cafec9a8d598f02e7fd382b994b3ada8d1652710039cb501cf6ec487",
      scenarioInventoryArtifact:
        "migrations/course-g05-l05-ts-008/audit/scenario-inventory.json",
      scenarioInventoryArtifactSha256:
        "92f38c7efae76bc0c54546113312fb1cb93abb78c8be22b68887f84921a405ae",
      behaviorCompositeContractId:
        G5_L5_TS008_BEHAVIOR_COMPOSITE_CONTRACT_ID,
    },
    {
      animationId: "course-g05-l05-fq-002",
      kind: "randomized-final-quiz",
      sourceSwfArtifact:
        "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L5/FQ/L5FQ02.swf",
      sourceSwfSha256:
        "1a28dba8c875c62dd655248b6f7ebe0af634ffe5ff174882d306a1f40d3060c3",
      sourceFrameDomain: "sprite-830",
      sourceFrameCount: 72,
      initialProductStopFrame: 2,
      terminalProductFrame: 45,
      frameDomainArtifact:
        "migrations/course-g05-l05-fq-002/audit/frame-domain-disposition.json",
      frameDomainArtifactSha256:
        "924c95cd28d88911f002686ddb9421c47e386773c35b4251ab5f44558ab87ed8",
      userEventPcodeFileCount: 109,
      ffdecScriptsArtifact:
        "migrations/course-g05-l05-fq-002/audit/machine/ffdec-scripts.txt.gz",
      ffdecScriptsArtifactSha256:
        "e547d4667dec1649ad65e45e96ae06a5fbed61f0d9915546a10bcdce7dc17704",
      scenarioInventoryArtifact:
        "migrations/course-g05-l05-fq-002/audit/scenario-inventory.json",
      scenarioInventoryArtifactSha256:
        "9563024194f949bd25212da3977db09a063627025a6ba5a4d6ba5178a9b95f45",
      behaviorCompositeContractId:
        G5_L5_FQ002_BEHAVIOR_COMPOSITE_CONTRACT_ID,
      randomizationDisposition: G5_L5_FQ002_RANDOMIZATION_DISPOSITION,
    },
  ]);

export function getG5L5ThreePageProductCalibrationSourceBinding(
  animationId: string,
): G5L5ThreePageCalibrationSourceBinding {
  const binding = G5_L5_THREE_PAGE_PRODUCT_CALIBRATION_SOURCE_BINDINGS.find(
    (candidate) => candidate.animationId === animationId,
  );
  invariant(
    binding,
    `Animation is outside the G5 L5 three-page calibration: ${animationId}`,
  );
  return binding;
}

export type G5L5CalibrationChoiceFeedback =
  | "idle"
  | "correct"
  | "wrong-attempt1"
  | "wrong-attempt2";

export interface G5L5Vb013State {
  readonly mode: "question" | "complete";
  readonly attempts: number;
  readonly feedback: G5L5CalibrationChoiceFeedback;
  readonly controlsEnabled: boolean;
}

export type G5L5Vb013Action =
  | Readonly<{type: "choose"; choice: 1 | 2}>
  | Readonly<{type: "continue-feedback"}>
  | Readonly<{type: "reset"}>;

export const G5_L5_VB013_CORRECT_CHOICE = 2 as const;
export const G5_L5_VB013_WRONG_FEEDBACK = deepFreeze([
  "The opposite of negative two is positive two. Negative two added to positive two has a sum of zero. Try again.",
  "The opposite of negative two is positive two. Negative two added to positive two has a sum of zero.",
] as const);

export const G5_L5_VB013_INITIAL_STATE: G5L5Vb013State = deepFreeze({
  mode: "question",
  attempts: 0,
  feedback: "idle",
  controlsEnabled: true,
});

function assertCalibrationChoiceFeedback(
  feedback: unknown,
  label: string,
): asserts feedback is G5L5CalibrationChoiceFeedback {
  invariant(
    typeof feedback === "string" &&
      ["idle", "correct", "wrong-attempt1", "wrong-attempt2"].includes(
        feedback,
      ),
    `${label} has an unsupported value`,
  );
}

function assertVb013State(state: G5L5Vb013State): void {
  const value = record(state, "VB013 state");
  assertExactKeys(
    value,
    ["mode", "attempts", "feedback", "controlsEnabled"],
    "VB013 state",
  );
  invariant(
    state.mode === "question" || state.mode === "complete",
    "VB013 state has an unsupported mode",
  );
  assertIntegerInRange(state.attempts, 0, 2, "VB013 attempts");
  assertCalibrationChoiceFeedback(state.feedback, "VB013 feedback");
  invariant(
    typeof state.controlsEnabled === "boolean",
    "VB013 controlsEnabled must be boolean",
  );

  if (state.mode === "complete") {
    invariant(
      state.attempts >= 1 &&
        state.feedback === "idle" &&
        state.controlsEnabled === false,
      "VB013 complete state is inconsistent",
    );
  } else if (state.feedback === "idle") {
    invariant(
      state.attempts <= 1 && state.controlsEnabled === true,
      "VB013 idle question state is inconsistent",
    );
  } else {
    invariant(
      state.attempts >= 1 && state.controlsEnabled === false,
      "VB013 feedback and controls state is inconsistent",
    );
    invariant(
      state.feedback !== "wrong-attempt1" || state.attempts === 1,
      "VB013 first-wrong feedback must bind attempt one",
    );
    invariant(
      state.feedback !== "wrong-attempt2" || state.attempts === 2,
      "VB013 second-wrong feedback must bind attempt two",
    );
  }
  assertDeepFrozen(state, "VB013 state");
}

function assertVb013Action(action: G5L5Vb013Action): void {
  const value = record(action, "VB013 action");
  invariant(typeof value.type === "string", "VB013 action type is required");
  if (value.type === "choose") {
    assertExactKeys(value, ["type", "choice"], "VB013 choose action");
    assertIntegerInRange(value.choice, 1, 2, "VB013 choice");
    return;
  }
  if (value.type === "continue-feedback" || value.type === "reset") {
    assertExactKeys(value, ["type"], `VB013 ${value.type} action`);
    return;
  }
  throw new Error(`VB013 action type is unsupported: ${String(value.type)}`);
}

export function reduceG5L5Vb013(
  state: G5L5Vb013State,
  action: G5L5Vb013Action,
): G5L5Vb013State {
  assertVb013State(state);
  assertVb013Action(action);
  if (action.type === "reset") return G5_L5_VB013_INITIAL_STATE;
  if (state.mode === "complete") return state;
  if (action.type === "choose") {
    if (!state.controlsEnabled || state.feedback !== "idle") return state;
    const attempts = state.attempts + 1;
    invariant(attempts <= 2, "VB013 cannot admit a third response");
    return deepFreeze({
      ...state,
      attempts,
      feedback: action.choice === G5_L5_VB013_CORRECT_CHOICE
        ? "correct" as const
        : attempts === 1
          ? "wrong-attempt1" as const
          : "wrong-attempt2" as const,
      controlsEnabled: false,
    });
  }
  if (state.feedback === "idle") return state;
  if (state.feedback === "correct" || state.feedback === "wrong-attempt2") {
    return deepFreeze({
      ...state,
      mode: "complete" as const,
      feedback: "idle" as const,
      controlsEnabled: false,
    });
  }
  return deepFreeze({
    ...state,
    feedback: "idle" as const,
    controlsEnabled: true,
  });
}

export function g5L5Vb013FrameForState(
  state: G5L5Vb013State,
  runtimeFrame: number,
): number {
  assertVb013State(state);
  assertIntegerInRange(runtimeFrame, 1, 201, "VB013 runtime frame");
  return state.mode === "complete" ? 201 : Math.min(92, runtimeFrame);
}

export function g5L5Vb013BehaviorCompositeStateForState(
  state: G5L5Vb013State,
  runtimeFrame: number,
): string {
  assertVb013State(state);
  assertIntegerInRange(runtimeFrame, 1, 201, "VB013 runtime frame");
  if (state.mode === "complete") return "complete";
  if (runtimeFrame < 92) return "intro";
  if (state.feedback === "correct") return "question-correct";
  if (state.feedback === "wrong-attempt1") return "question-wrong-attempt1";
  if (state.feedback === "wrong-attempt2") return "question-wrong-attempt2";
  return state.attempts === 1 ? "question-retry-attempt1" : "question-idle";
}

export const G5_L5_TS008_STOP_FRAMES = deepFreeze([
  247,
  385,
  512,
  627,
  671,
] as const);
export const G5_L5_TS008_CORRECT_CHOICE = 2 as const;

export interface G5L5Ts008State {
  readonly mode: "sections" | "complete";
  readonly sectionIndex: number;
  readonly explanationVisible: boolean;
  readonly attempts: number;
  readonly feedback: G5L5CalibrationChoiceFeedback;
  readonly controlsEnabled: boolean;
  readonly helpOpen: boolean;
}

export type G5L5Ts008Action =
  | Readonly<{type: "advance"}>
  | Readonly<{type: "reveal-explanation"}>
  | Readonly<{type: "choose"; choice: 1 | 2 | 3 | 4}>
  | Readonly<{type: "continue-feedback"}>
  | Readonly<{type: "open-help"}>
  | Readonly<{type: "close-help"}>
  | Readonly<{type: "reset"}>;

export const G5_L5_TS008_INITIAL_STATE: G5L5Ts008State = deepFreeze({
  mode: "sections",
  sectionIndex: 0,
  explanationVisible: false,
  attempts: 0,
  feedback: "idle",
  controlsEnabled: true,
  helpOpen: false,
});

function assertTs008State(state: G5L5Ts008State): void {
  const value = record(state, "TS008 state");
  assertExactKeys(
    value,
    [
      "mode",
      "sectionIndex",
      "explanationVisible",
      "attempts",
      "feedback",
      "controlsEnabled",
      "helpOpen",
    ],
    "TS008 state",
  );
  invariant(
    state.mode === "sections" || state.mode === "complete",
    "TS008 state has an unsupported mode",
  );
  assertIntegerInRange(state.sectionIndex, 0, 4, "TS008 sectionIndex");
  invariant(
    typeof state.explanationVisible === "boolean",
    "TS008 explanationVisible must be boolean",
  );
  assertIntegerInRange(state.attempts, 0, 2, "TS008 attempts");
  assertCalibrationChoiceFeedback(state.feedback, "TS008 feedback");
  invariant(
    typeof state.controlsEnabled === "boolean",
    "TS008 controlsEnabled must be boolean",
  );
  invariant(typeof state.helpOpen === "boolean", "TS008 helpOpen must be boolean");

  if (state.mode === "complete") {
    invariant(
      state.sectionIndex === 4 &&
        state.explanationVisible === false &&
        state.attempts >= 1 &&
        state.feedback === "idle" &&
        state.controlsEnabled === false &&
        state.helpOpen === false,
      "TS008 complete state is inconsistent",
    );
  } else if (state.sectionIndex < 4) {
    invariant(
      state.attempts === 0 &&
        state.feedback === "idle" &&
        state.controlsEnabled === true &&
        state.helpOpen === false,
      "TS008 pre-question section state is inconsistent",
    );
    invariant(
      state.explanationVisible === false ||
        state.sectionIndex === 2 ||
        state.sectionIndex === 3,
      "TS008 explanation is not allowed in this section",
    );
  } else {
    invariant(
      state.explanationVisible === false,
      "TS008 question section cannot retain an explanation",
    );
    if (state.feedback === "idle") {
      invariant(
        state.attempts <= 1 &&
          state.controlsEnabled === !state.helpOpen,
        "TS008 idle question/help state is inconsistent",
      );
    } else {
      invariant(
        state.attempts >= 1 &&
          state.controlsEnabled === false &&
          state.helpOpen === false,
        "TS008 feedback and controls state is inconsistent",
      );
      invariant(
        state.feedback !== "wrong-attempt1" || state.attempts === 1,
        "TS008 first-wrong feedback must bind attempt one",
      );
      invariant(
        state.feedback !== "wrong-attempt2" || state.attempts === 2,
        "TS008 second-wrong feedback must bind attempt two",
      );
    }
  }
  assertDeepFrozen(state, "TS008 state");
}

function assertTs008Action(action: G5L5Ts008Action): void {
  const value = record(action, "TS008 action");
  invariant(typeof value.type === "string", "TS008 action type is required");
  if (value.type === "choose") {
    assertExactKeys(value, ["type", "choice"], "TS008 choose action");
    assertIntegerInRange(value.choice, 1, 4, "TS008 choice");
    return;
  }
  if ([
    "advance",
    "reveal-explanation",
    "continue-feedback",
    "open-help",
    "close-help",
    "reset",
  ].includes(value.type)) {
    assertExactKeys(value, ["type"], `TS008 ${value.type} action`);
    return;
  }
  throw new Error(`TS008 action type is unsupported: ${String(value.type)}`);
}

export function reduceG5L5Ts008(
  state: G5L5Ts008State,
  action: G5L5Ts008Action,
): G5L5Ts008State {
  assertTs008State(state);
  assertTs008Action(action);
  if (action.type === "reset") return G5_L5_TS008_INITIAL_STATE;
  if (state.mode === "complete") return state;
  if (action.type === "open-help") {
    if (
      state.sectionIndex !== 4 ||
      !state.controlsEnabled ||
      state.feedback !== "idle"
    ) return state;
    return deepFreeze({...state, controlsEnabled: false, helpOpen: true});
  }
  if (action.type === "close-help") {
    if (!state.helpOpen) return state;
    return deepFreeze({...state, controlsEnabled: true, helpOpen: false});
  }
  if (state.helpOpen) return state;
  if (action.type === "advance") {
    if (!state.controlsEnabled || state.feedback !== "idle") return state;
    if (state.sectionIndex >= G5_L5_TS008_STOP_FRAMES.length - 1) return state;
    return deepFreeze({
      ...state,
      sectionIndex: state.sectionIndex + 1,
      explanationVisible: false,
    });
  }
  if (action.type === "reveal-explanation") {
    if (
      !state.controlsEnabled ||
      state.feedback !== "idle" ||
      (state.sectionIndex !== 2 && state.sectionIndex !== 3)
    ) return state;
    return deepFreeze({...state, explanationVisible: true});
  }
  if (action.type === "choose") {
    if (
      state.sectionIndex !== 4 ||
      !state.controlsEnabled ||
      state.feedback !== "idle"
    ) return state;
    const attempts = state.attempts + 1;
    invariant(attempts <= 2, "TS008 cannot admit a third response");
    return deepFreeze({
      ...state,
      attempts,
      feedback: action.choice === G5_L5_TS008_CORRECT_CHOICE
        ? "correct" as const
        : attempts === 1
          ? "wrong-attempt1" as const
          : "wrong-attempt2" as const,
      controlsEnabled: false,
    });
  }
  if (action.type === "continue-feedback") {
    if (state.feedback === "idle") return state;
    if (state.feedback === "correct" || state.feedback === "wrong-attempt2") {
      return deepFreeze({
        ...state,
        mode: "complete" as const,
        explanationVisible: false,
        feedback: "idle" as const,
        controlsEnabled: false,
        helpOpen: false,
      });
    }
    return deepFreeze({
      ...state,
      feedback: "idle" as const,
      controlsEnabled: true,
    });
  }
  return state;
}

export function g5L5Ts008FrameForState(
  state: G5L5Ts008State,
  runtimeFrame: number,
): number {
  assertTs008State(state);
  assertIntegerInRange(runtimeFrame, 1, 690, "TS008 runtime frame");
  if (state.mode === "complete") return 690;
  const stopFrame = G5_L5_TS008_STOP_FRAMES[state.sectionIndex];
  invariant(stopFrame !== undefined, "TS008 stop-frame index drifted");
  return state.sectionIndex === 0
    ? Math.min(stopFrame, runtimeFrame)
    : stopFrame;
}

export function g5L5Ts008BehaviorCompositeStateForState(
  state: G5L5Ts008State,
): string {
  assertTs008State(state);
  if (state.mode === "complete") return "complete";
  if (state.sectionIndex === 0) return "section-1";
  if (state.sectionIndex === 1) return "section-2-stop";
  if (state.sectionIndex === 2) {
    return state.explanationVisible
      ? "section-3-explanation"
      : "section-3-idle";
  }
  if (state.sectionIndex === 3) {
    return state.explanationVisible
      ? "section-4-explanation"
      : "section-4-idle";
  }
  if (state.helpOpen) return "question-help-open";
  if (state.feedback === "correct") return "question-correct";
  if (state.feedback === "wrong-attempt1") return "question-wrong-attempt1";
  if (state.feedback === "wrong-attempt2") return "question-wrong-attempt2";
  return state.attempts === 1 ? "question-retry-attempt1" : "question-idle";
}

export const G5_L5_FQ002_SOURCE_ANSWER_ARRAY = deepFreeze([
  "A1Opt2",
  "A2Opt4",
  "A3Opt3",
  "A4Opt1",
  "A5Opt1",
  "A6Opt1",
  "A7Opt4",
  "A8Opt3",
  "A9Opt2",
  "A10Opt4",
  "A11Opt3",
  "A12Opt4",
  "A13Opt3",
  "A14Opt3",
  "A15Opt2",
  "A16Opt1",
  "A17Opt3",
  "A18Opt4",
  "A19Opt3",
  "A20Opt2",
  "A21Opt3",
  "A22Opt1",
  "A23Opt1",
  "A24Opt1",
  "A25Opt2",
  "A26Opt2",
] as const);

export const G5_L5_FQ002_CORRECT_OPTIONS = deepFreeze([
  2, 4, 3, 1, 1, 1, 4, 3, 2, 4, 3, 4, 3,
  3, 2, 1, 3, 4, 3, 2, 3, 1, 1, 1, 2, 2,
] as const);
export const G5_L5_FQ002_QUESTION_POOL_SIZE = 26 as const;
export const G5_L5_FQ002_ADMINISTERED_QUESTION_COUNT = 10 as const;
export const G5_L5_FQ002_DEFAULT_SEED = 5002 as const;

export type G5L5Fq002Option = 1 | 2 | 3 | 4;
export type G5L5Fq002Grade =
  | "Unsatisfactory"
  | "Partially Proficient"
  | "Proficient"
  | "Advanced";

export interface G5L5Fq002Response {
  readonly questionNumber: number;
  readonly choice: G5L5Fq002Option;
  readonly correct: boolean;
}

export interface G5L5Fq002MemoryReport {
  readonly total: 10;
  readonly correct: number;
  readonly wrong: number;
  readonly grade: G5L5Fq002Grade;
}

export interface G5L5Fq002HostState {
  readonly reportingDisposition: "blocked-memory-only";
  readonly networkRequestCount: 0;
  readonly memoryReport: G5L5Fq002MemoryReport | null;
}

export interface G5L5Fq002AudioState {
  readonly disposition: "disabled-pending-source-runtime-listening-acceptance";
  readonly enabled: false;
  readonly activeCue: null;
}

export interface G5L5Fq002State {
  readonly mode: "question" | "result" | "review";
  readonly seed: number;
  readonly randomizationDisposition:
    "deterministic-mulberry32-product-seed-not-avm1-random-parity";
  readonly questionOrder: readonly number[];
  readonly questionPosition: number;
  readonly responses: readonly G5L5Fq002Response[];
  readonly score: number;
  readonly grade: G5L5Fq002Grade | null;
  readonly reviewPosition: number;
  readonly reviewComplete: boolean;
  readonly host: G5L5Fq002HostState;
  readonly audio: G5L5Fq002AudioState;
}

export type G5L5Fq002Action =
  | Readonly<{type: "answer"; choice: G5L5Fq002Option}>
  | Readonly<{type: "start-review"}>
  | Readonly<{type: "next-review"}>
  | Readonly<{type: "return-to-result"}>
  | Readonly<{type: "reset"; seed?: number}>;

function assertFq002Seed(seed: unknown): asserts seed is number {
  assertIntegerInRange(seed, 0, 0xffff_ffff, "FQ002 seed");
}

function mulberry32(seed: number): () => number {
  let current = seed >>> 0;
  return () => {
    current = (current + 0x6d2b_79f5) >>> 0;
    let value = current;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function createG5L5Fq002QuestionOrder(seed: number): readonly number[] {
  assertFq002Seed(seed);
  const random = mulberry32(seed);
  const pool = Array.from(
    {length: G5_L5_FQ002_QUESTION_POOL_SIZE},
    (_, index) => index + 1,
  );
  const selected: number[] = [];
  while (selected.length < G5_L5_FQ002_ADMINISTERED_QUESTION_COUNT) {
    const poolIndex = Math.floor(random() * pool.length);
    const [questionNumber] = pool.splice(poolIndex, 1);
    invariant(questionNumber !== undefined, "FQ002 seeded selection underflowed");
    selected.push(questionNumber);
  }
  return deepFreeze(selected);
}

function initialFq002HostState(): G5L5Fq002HostState {
  return deepFreeze({
    reportingDisposition: "blocked-memory-only" as const,
    networkRequestCount: 0 as const,
    memoryReport: null,
  });
}

function initialFq002AudioState(): G5L5Fq002AudioState {
  return deepFreeze({
    disposition:
      "disabled-pending-source-runtime-listening-acceptance" as const,
    enabled: false as const,
    activeCue: null,
  });
}

export function createG5L5Fq002InitialState(
  seed: number = G5_L5_FQ002_DEFAULT_SEED,
): G5L5Fq002State {
  assertFq002Seed(seed);
  return deepFreeze({
    mode: "question" as const,
    seed,
    randomizationDisposition: G5_L5_FQ002_RANDOMIZATION_DISPOSITION,
    questionOrder: createG5L5Fq002QuestionOrder(seed),
    questionPosition: 0,
    responses: [] as readonly G5L5Fq002Response[],
    score: 0,
    grade: null,
    reviewPosition: 0,
    reviewComplete: false,
    host: initialFq002HostState(),
    audio: initialFq002AudioState(),
  });
}

export const G5_L5_FQ002_INITIAL_STATE =
  createG5L5Fq002InitialState(G5_L5_FQ002_DEFAULT_SEED);

export function getG5L5Fq002Grade(correctCount: number): G5L5Fq002Grade {
  assertIntegerInRange(
    correctCount,
    0,
    G5_L5_FQ002_ADMINISTERED_QUESTION_COUNT,
    "FQ002 correct count",
  );
  if (correctCount <= 3) return "Unsatisfactory";
  if (correctCount <= 6) return "Partially Proficient";
  if (correctCount <= 8) return "Proficient";
  return "Advanced";
}

function assertFq002State(state: G5L5Fq002State): void {
  const value = record(state, "FQ002 state");
  assertExactKeys(
    value,
    [
      "mode",
      "seed",
      "randomizationDisposition",
      "questionOrder",
      "questionPosition",
      "responses",
      "score",
      "grade",
      "reviewPosition",
      "reviewComplete",
      "host",
      "audio",
    ],
    "FQ002 state",
  );
  invariant(["question", "result", "review"].includes(state.mode),
    "FQ002 state has an unsupported mode");
  assertFq002Seed(state.seed);
  invariant(
    state.randomizationDisposition === G5_L5_FQ002_RANDOMIZATION_DISPOSITION,
    "FQ002 randomization disposition drifted",
  );
  invariant(
    Array.isArray(state.questionOrder) &&
      state.questionOrder.length === G5_L5_FQ002_ADMINISTERED_QUESTION_COUNT &&
      new Set(state.questionOrder).size === state.questionOrder.length &&
      state.questionOrder.every((question) =>
        Number.isSafeInteger(question) && question >= 1 && question <= 26),
    "FQ002 question order must contain ten unique source questions",
  );
  invariant(
    JSON.stringify(state.questionOrder) ===
      JSON.stringify(createG5L5Fq002QuestionOrder(state.seed)),
    "FQ002 question order is not the deterministic seed result",
  );
  assertIntegerInRange(state.questionPosition, 0, 9, "FQ002 questionPosition");
  invariant(
    Array.isArray(state.responses) && state.responses.length <= 10,
    "FQ002 responses are invalid",
  );
  state.responses.forEach((response, index) => {
    const responseValue = record(response, `FQ002 response ${index + 1}`);
    assertExactKeys(
      responseValue,
      ["questionNumber", "choice", "correct"],
      `FQ002 response ${index + 1}`,
    );
    const questionNumber = state.questionOrder[index];
    invariant(response.questionNumber === questionNumber,
      `FQ002 response ${index + 1} question identity drifted`);
    assertIntegerInRange(
      response.choice,
      1,
      4,
      `FQ002 response ${index + 1} choice`,
    );
    invariant(
      response.correct ===
        (response.choice === G5_L5_FQ002_CORRECT_OPTIONS[questionNumber! - 1]),
      `FQ002 response ${index + 1} correctness drifted`,
    );
  });
  const expectedScore = state.responses.filter(({correct}) => correct).length;
  invariant(state.score === expectedScore, "FQ002 score drifted from responses");
  assertIntegerInRange(state.reviewPosition, 0, 9, "FQ002 reviewPosition");
  invariant(typeof state.reviewComplete === "boolean",
    "FQ002 reviewComplete must be boolean");

  const host = record(state.host, "FQ002 host state");
  assertExactKeys(
    host,
    ["reportingDisposition", "networkRequestCount", "memoryReport"],
    "FQ002 host state",
  );
  invariant(
    state.host.reportingDisposition === "blocked-memory-only" &&
      state.host.networkRequestCount === 0,
    "FQ002 legacy reporting must remain blocked-memory-only",
  );
  const audio = record(state.audio, "FQ002 audio state");
  assertExactKeys(
    audio,
    ["disposition", "enabled", "activeCue"],
    "FQ002 audio state",
  );
  invariant(
    state.audio.disposition ===
      "disabled-pending-source-runtime-listening-acceptance" &&
      state.audio.enabled === false &&
      state.audio.activeCue === null,
    "FQ002 audio state must remain disabled and acceptance-neutral",
  );

  if (state.mode === "question") {
    invariant(
      state.responses.length < 10 &&
        state.questionPosition === state.responses.length &&
        state.grade === null &&
        state.host.memoryReport === null &&
        !state.reviewComplete,
      "FQ002 question state is inconsistent",
    );
  } else {
    invariant(
      state.responses.length === 10 && state.questionPosition === 9,
      "FQ002 completed response set is inconsistent",
    );
    const expectedGrade = getG5L5Fq002Grade(state.score);
    invariant(state.grade === expectedGrade, "FQ002 grade drifted from score");
    const report = record(state.host.memoryReport, "FQ002 memory report");
    assertExactKeys(
      report,
      ["total", "correct", "wrong", "grade"],
      "FQ002 memory report",
    );
    invariant(
      state.host.memoryReport?.total === 10 &&
        state.host.memoryReport.correct === state.score &&
        state.host.memoryReport.wrong === 10 - state.score &&
        state.host.memoryReport.grade === state.grade,
      "FQ002 memory report drifted from result",
    );
  }
  invariant(
    state.mode !== "review" || !state.reviewComplete,
    "FQ002 active review cannot be complete",
  );
  invariant(
    !state.reviewComplete || state.mode === "result",
    "FQ002 completed review must return to result",
  );
  assertDeepFrozen(state, "FQ002 state");
}

function assertFq002Action(action: G5L5Fq002Action): void {
  const value = record(action, "FQ002 action");
  invariant(typeof value.type === "string", "FQ002 action type is required");
  if (value.type === "answer") {
    assertExactKeys(value, ["type", "choice"], "FQ002 answer action");
    assertIntegerInRange(value.choice, 1, 4, "FQ002 answer choice");
    return;
  }
  if (value.type === "reset") {
    const hasSeed = Object.prototype.hasOwnProperty.call(value, "seed");
    assertExactKeys(
      value,
      hasSeed ? ["type", "seed"] : ["type"],
      "FQ002 reset action",
    );
    if (value.seed !== undefined) assertFq002Seed(value.seed);
    return;
  }
  if ([
    "start-review",
    "next-review",
    "return-to-result",
  ].includes(value.type)) {
    assertExactKeys(value, ["type"], `FQ002 ${value.type} action`);
    return;
  }
  throw new Error(`FQ002 action type is unsupported: ${String(value.type)}`);
}

export function reduceG5L5Fq002(
  state: G5L5Fq002State,
  action: G5L5Fq002Action,
): G5L5Fq002State {
  assertFq002State(state);
  assertFq002Action(action);
  if (action.type === "reset") {
    return createG5L5Fq002InitialState(action.seed ?? state.seed);
  }
  if (action.type === "answer") {
    if (
      state.mode !== "question" ||
      state.responses.length !== state.questionPosition ||
      state.responses.length >= G5_L5_FQ002_ADMINISTERED_QUESTION_COUNT
    ) return state;
    const questionNumber = state.questionOrder[state.questionPosition];
    invariant(questionNumber !== undefined, "FQ002 current question is missing");
    const correct = action.choice ===
      G5_L5_FQ002_CORRECT_OPTIONS[questionNumber - 1];
    const responses = deepFreeze([
      ...state.responses,
      {questionNumber, choice: action.choice, correct},
    ]);
    const score = state.score + (correct ? 1 : 0);
    const finished = responses.length ===
      G5_L5_FQ002_ADMINISTERED_QUESTION_COUNT;
    const grade = finished ? getG5L5Fq002Grade(score) : null;
    return deepFreeze({
      ...state,
      mode: finished ? "result" as const : "question" as const,
      questionPosition: finished
        ? state.questionPosition
        : state.questionPosition + 1,
      responses,
      score,
      grade,
      host: finished
        ? deepFreeze({
            reportingDisposition: "blocked-memory-only" as const,
            networkRequestCount: 0 as const,
            memoryReport: deepFreeze({
              total: 10 as const,
              correct: score,
              wrong: 10 - score,
              grade: grade!,
            }),
          })
        : state.host,
    });
  }
  if (action.type === "start-review") {
    if (state.mode !== "result" || state.responses.length !== 10) return state;
    return deepFreeze({
      ...state,
      mode: "review" as const,
      reviewPosition: 0,
      reviewComplete: false,
    });
  }
  if (action.type === "next-review") {
    if (state.mode !== "review") return state;
    if (state.reviewPosition >= 9) {
      return deepFreeze({
        ...state,
        mode: "result" as const,
        reviewComplete: true,
      });
    }
    return deepFreeze({...state, reviewPosition: state.reviewPosition + 1});
  }
  if (action.type === "return-to-result") {
    if (state.mode !== "review") return state;
    return deepFreeze({...state, mode: "result" as const});
  }
  return state;
}

export function g5L5Fq002FrameForState(state: G5L5Fq002State): number {
  assertFq002State(state);
  if (state.mode === "result") return 45;
  const questionNumber = state.questionOrder[
    state.mode === "review" ? state.reviewPosition : state.questionPosition
  ];
  invariant(questionNumber !== undefined, "FQ002 frame question is missing");
  return state.mode === "review" ? questionNumber + 45 : questionNumber + 1;
}

export function g5L5Fq002BehaviorCompositeStateForState(
  state: G5L5Fq002State,
): string {
  assertFq002State(state);
  if (state.mode === "result") return `result-score${state.score}`;
  const position = state.mode === "review"
    ? state.reviewPosition
    : state.questionPosition;
  const questionNumber = state.questionOrder[position];
  invariant(questionNumber !== undefined, "FQ002 composite question is missing");
  if (state.mode === "question") {
    return `question-q${questionNumber}-position${position + 1}`;
  }
  const response = state.responses[position];
  invariant(response, "FQ002 review response is missing");
  return `review-q${questionNumber}-position${position + 1}-selected${
    response.choice
  }`;
}
