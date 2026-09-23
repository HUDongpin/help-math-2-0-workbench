/**
 * Pure, deterministic product-state contracts for the four-page G5 L5
 * factory calibration slice.
 *
 * These transitions are reconstructed from the hash-bound FFDec P-code
 * inventories named below. They deliberately do not execute AVM1, infer an
 * original-runtime natural trace, bind unresolved audio, or send the legacy
 * quiz report. Keeping the state machines free of React and browser APIs makes
 * the behavior cheap to test and suitable for a later compiler target.
 */

export type G5L5VerticalSlicePageKind =
  | "linear"
  | "fixed-choice"
  | "multi-section"
  | "final-quiz";

export interface G5L5VerticalSliceSourceBinding {
  readonly animationId: string;
  readonly kind: G5L5VerticalSlicePageKind;
  readonly sourceSwfSha256: string;
  readonly sourceFrameDomain: string;
  readonly sourceFrameCount: number;
  readonly initialProductStopFrame: number;
  readonly userEventPcodeFileCount: number;
  readonly ffdecScriptsArtifact: string;
  readonly ffdecScriptsArtifactSha256: string;
  readonly scenarioInventoryArtifact: string;
  readonly scenarioInventoryArtifactSha256: string;
  readonly behaviorCompositeContractId?: string;
  readonly behaviorCompositeIrArtifact?: string;
  readonly behaviorCompositeIrFingerprintSha256?: string;
}

export const G5_L5_FOUR_PAGE_VERTICAL_SLICE_SOURCE_BINDINGS:
  readonly G5L5VerticalSliceSourceBinding[] = Object.freeze([
    Object.freeze({
      animationId: "course-g05-l05-rw-003",
      kind: "linear" as const,
      sourceSwfSha256:
        "5726f1760ff9378e9141b2e952c919a5c8b9eb76796e8c6a5d222da4378f93ba",
      sourceFrameDomain: "sprite-129",
      sourceFrameCount: 631,
      initialProductStopFrame: 631,
      userEventPcodeFileCount: 0,
      ffdecScriptsArtifact:
        "migrations/course-g05-l05-rw-003/audit/machine/ffdec-scripts.txt.gz",
      ffdecScriptsArtifactSha256:
        "c81bc3130962e2c165e93d7cc99fa3d1497ab51998bbf27f4876268f7a2a9f06",
      scenarioInventoryArtifact:
        "migrations/course-g05-l05-rw-003/audit/scenario-inventory.json",
      scenarioInventoryArtifactSha256:
        "0d40901ddfb9a77df8ecf688509c867861cc9c5fd20d4ab7a193fc0de93c4344",
    }),
    Object.freeze({
      animationId: "course-g05-l05-vb-012",
      kind: "fixed-choice" as const,
      sourceSwfSha256:
        "9530d6f3adb0ed6a3c8fbb5ba22c8084e2f8a20b45a735381574eb78e714abd0",
      sourceFrameDomain: "sprite-234",
      sourceFrameCount: 196,
      initialProductStopFrame: 81,
      userEventPcodeFileCount: 3,
      ffdecScriptsArtifact:
        "migrations/course-g05-l05-vb-012/audit/machine/ffdec-scripts.txt.gz",
      ffdecScriptsArtifactSha256:
        "c54be1f355130f407d88a88bc29c7537a4e6daaa9b52f1696ca23cae4e6d7f48",
      scenarioInventoryArtifact:
        "migrations/course-g05-l05-vb-012/audit/scenario-inventory.json",
      scenarioInventoryArtifactSha256:
        "3122474757c15cb202b0d69c5ed1f0a5c8a18484b1bea2162ad821380cca812b",
      behaviorCompositeContractId:
        "g5-l5-vb012-source-behavior-composite-v1",
      behaviorCompositeIrArtifact:
        "migrations/course-g05-l05-vb-012/audit/behavior-composite-ir.json",
      behaviorCompositeIrFingerprintSha256:
        "03299864518881a8f84892b3a0f2c4ee84c6e8518a5abed34a65d02c87606afa",
    }),
    Object.freeze({
      animationId: "course-g05-l05-ts-007",
      kind: "multi-section" as const,
      sourceSwfSha256:
        "e034c05612a1ff93223b4d3071f56b41204518b0cf9d7a4b436323e79b18a588",
      sourceFrameDomain: "sprite-439",
      sourceFrameCount: 690,
      initialProductStopFrame: 245,
      userEventPcodeFileCount: 40,
      ffdecScriptsArtifact:
        "migrations/course-g05-l05-ts-007/audit/machine/ffdec-scripts.txt.gz",
      ffdecScriptsArtifactSha256:
        "4f2a00bfcb0b9a06f3c765445d24e86be7dedab28a040056fe59bb2449b8c64d",
      scenarioInventoryArtifact:
        "migrations/course-g05-l05-ts-007/audit/scenario-inventory.json",
      scenarioInventoryArtifactSha256:
        "4c9a4d34aee8ec55e816166b48b01ff949b1f336a8e90fe49d5b17f576d83cd2",
      behaviorCompositeContractId:
        "g5-l5-ts007-source-behavior-composite-v1",
      behaviorCompositeIrArtifact:
        "migrations/course-g05-l05-ts-007/audit/behavior-composite-ir.json",
      behaviorCompositeIrFingerprintSha256:
        "bbaf0868c833902f72477b4c8b4b848decc014aacd386ed320d95b1851de50ff",
    }),
    Object.freeze({
      animationId: "course-g05-l05-fq-003",
      kind: "final-quiz" as const,
      sourceSwfSha256:
        "43c27a0b81662befa75d09fe042c0379090acee274839316d614c8d66ab0d7d2",
      sourceFrameDomain: "sprite-830",
      sourceFrameCount: 72,
      initialProductStopFrame: 2,
      userEventPcodeFileCount: 109,
      ffdecScriptsArtifact:
        "migrations/course-g05-l05-fq-003/audit/machine/ffdec-scripts.txt.gz",
      ffdecScriptsArtifactSha256:
        "55d639d251df5b8f3be222944a644e98bda1d886ccfc0baddd205005ba27f178",
      scenarioInventoryArtifact:
        "migrations/course-g05-l05-fq-003/audit/scenario-inventory.json",
      scenarioInventoryArtifactSha256:
        "7029b21306e7ce9f843cbaac1f9acb01128a2fbf053cccb6b40053dcbe5269ea",
      behaviorCompositeContractId:
        "g5-l5-fq003-source-behavior-composite-v1",
      behaviorCompositeIrArtifact:
        "migrations/course-g05-l05-fq-003/audit/behavior-composite-ir.json",
      behaviorCompositeIrFingerprintSha256:
        "72329d617c2881ccd489e6845fa30f813643676c878deedfef3f58a24b1c1d6e",
    }),
  ]);

export function getG5L5VerticalSliceSourceBinding(
  animationId: string,
): G5L5VerticalSliceSourceBinding {
  const binding = G5_L5_FOUR_PAGE_VERTICAL_SLICE_SOURCE_BINDINGS.find(
    (candidate) => candidate.animationId === animationId,
  );
  if (!binding) {
    throw new Error(`Animation is outside the G5 L5 four-page slice: ${animationId}`);
  }
  return binding;
}

export type ChoiceFeedback = "idle" | "correct" | "wrong";

export interface G5L5Vb012State {
  readonly mode: "question" | "complete";
  readonly attempts: number;
  readonly feedback: ChoiceFeedback;
  readonly controlsEnabled: boolean;
}

export type G5L5Vb012Action =
  | Readonly<{type: "choose"; choice: 1 | 2}>
  | Readonly<{type: "continue"}>
  | Readonly<{type: "reset"}>;

export const G5_L5_VB012_INITIAL_STATE: G5L5Vb012State = Object.freeze({
  mode: "question",
  attempts: 0,
  feedback: "idle",
  controlsEnabled: true,
});

export const G5_L5_VB012_CORRECT_CHOICE = 2 as const;

export const G5_L5_VB012_BEHAVIOR_COMPOSITE_CONTRACT_ID =
  "g5-l5-vb012-source-behavior-composite-v1" as const;

export const G5_L5_VB012_WRONG_FEEDBACK = Object.freeze([
  "The opposite of negative eight is positive eight. Negative eight added to positive eight has a sum of zero. Try again.",
  "The opposite of negative eight is positive eight. Negative eight added to positive eight has a sum of zero.",
] as const);

export function reduceG5L5Vb012(
  state: G5L5Vb012State,
  action: G5L5Vb012Action,
): G5L5Vb012State {
  if (action.type === "reset") return G5_L5_VB012_INITIAL_STATE;
  if (action.type === "choose") {
    if (state.mode !== "question" || !state.controlsEnabled) return state;
    return Object.freeze({
      ...state,
      attempts: state.attempts + 1,
      feedback: action.choice === G5_L5_VB012_CORRECT_CHOICE
        ? "correct"
        : "wrong",
      controlsEnabled: false,
    });
  }
  if (state.mode !== "question" || state.feedback === "idle") return state;
  if (state.feedback === "correct" || state.attempts >= 2) {
    return Object.freeze({
      ...state,
      mode: "complete",
      feedback: "idle",
      controlsEnabled: false,
    });
  }
  return Object.freeze({
    ...state,
    feedback: "idle",
    controlsEnabled: true,
  });
}

export function g5L5Vb012FrameForState(
  state: G5L5Vb012State,
  runtimeFrame: number,
): number {
  return state.mode === "complete" ? 196 : Math.min(81, runtimeFrame);
}

export function g5L5Vb012BehaviorCompositeStateForState(
  state: G5L5Vb012State,
  frame: number,
): string {
  if (state.mode === "complete") return "complete";
  if (frame < 81) return "intro";
  if (state.feedback === "correct") return "question-correct";
  if (state.feedback === "wrong") {
    return state.attempts >= 2
      ? "question-wrong-attempt2"
      : "question-wrong-attempt1";
  }
  return state.attempts > 0 ? "question-retry-attempt1" : "question-idle";
}

export const G5_L5_TS007_STOP_FRAMES = Object.freeze([
  245,
  384,
  510,
  628,
  671,
] as const);

export interface G5L5Ts007State {
  readonly mode: "sections" | "complete";
  readonly sectionIndex: number;
  readonly explanationVisible: boolean;
  readonly attempts: number;
  readonly feedback: ChoiceFeedback;
  readonly controlsEnabled: boolean;
  readonly helpOpen: boolean;
}

export type G5L5Ts007Action =
  | Readonly<{type: "advance"}>
  | Readonly<{type: "reveal-explanation"}>
  | Readonly<{type: "choose"; choice: 1 | 2 | 3 | 4}>
  | Readonly<{type: "continue-feedback"}>
  | Readonly<{type: "open-help"}>
  | Readonly<{type: "close-help"}>
  | Readonly<{type: "reset"}>;

export const G5_L5_TS007_INITIAL_STATE: G5L5Ts007State = Object.freeze({
  mode: "sections",
  sectionIndex: 0,
  explanationVisible: false,
  attempts: 0,
  feedback: "idle",
  controlsEnabled: true,
  helpOpen: false,
});

export const G5_L5_TS007_CORRECT_CHOICE = 2 as const;

export const G5_L5_TS007_BEHAVIOR_COMPOSITE_CONTRACT_ID =
  "g5-l5-ts007-source-behavior-composite-v1" as const;

export function reduceG5L5Ts007(
  state: G5L5Ts007State,
  action: G5L5Ts007Action,
): G5L5Ts007State {
  if (action.type === "reset") return G5_L5_TS007_INITIAL_STATE;
  if (state.mode === "complete") return state;
  if (action.type === "open-help") {
    if (state.sectionIndex !== 4 || !state.controlsEnabled) return state;
    return Object.freeze({...state, controlsEnabled: false, helpOpen: true});
  }
  if (action.type === "close-help") {
    if (!state.helpOpen) return state;
    return Object.freeze({...state, controlsEnabled: true, helpOpen: false});
  }
  if (state.helpOpen) return state;
  if (action.type === "advance") {
    if (!state.controlsEnabled || state.feedback !== "idle") return state;
    if (state.sectionIndex >= G5_L5_TS007_STOP_FRAMES.length - 1) return state;
    return Object.freeze({
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
    return Object.freeze({...state, explanationVisible: true});
  }
  if (action.type === "choose") {
    if (
      state.sectionIndex !== 4 ||
      !state.controlsEnabled ||
      state.feedback !== "idle"
    ) return state;
    return Object.freeze({
      ...state,
      attempts: state.attempts + 1,
      feedback: action.choice === G5_L5_TS007_CORRECT_CHOICE
        ? "correct"
        : "wrong",
      controlsEnabled: false,
    });
  }
  if (action.type === "continue-feedback") {
    if (state.feedback === "idle") return state;
    if (state.feedback === "correct" || state.attempts >= 2) {
      return Object.freeze({
        ...state,
        mode: "complete",
        feedback: "idle",
        controlsEnabled: false,
      });
    }
    return Object.freeze({...state, feedback: "idle", controlsEnabled: true});
  }
  return state;
}

export function g5L5Ts007FrameForState(
  state: G5L5Ts007State,
  runtimeFrame: number,
): number {
  if (state.mode === "complete") return 690;
  const stopFrame = G5_L5_TS007_STOP_FRAMES[state.sectionIndex] ?? 671;
  return state.sectionIndex === 0 ? Math.min(stopFrame, runtimeFrame) : stopFrame;
}

export function g5L5Ts007BehaviorCompositeStateForState(
  state: G5L5Ts007State,
): string {
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
  if (state.feedback === "wrong") {
    return state.attempts >= 2
      ? "question-wrong-attempt2"
      : "question-wrong-attempt1";
  }
  return state.attempts > 0 ? "question-retry-attempt1" : "question-idle";
}

export const G5_L5_FQ003_CORRECT_OPTIONS = Object.freeze([
  2, 4, 3, 1, 1, 1, 4, 3, 2, 4, 3, 4, 3,
  3, 2, 1, 3, 4, 3, 2, 3, 1, 1, 1, 2, 2,
] as const);

export const G5_L5_FQ003_BEHAVIOR_COMPOSITE_CONTRACT_ID =
  "g5-l5-fq003-source-behavior-composite-v1" as const;

export type G5L5Fq003Option = 1 | 2 | 3 | 4;

export interface G5L5Fq003State {
  readonly mode: "question" | "result" | "review";
  readonly questionIndex: number;
  readonly reviewIndex: number;
  readonly responses: readonly G5L5Fq003Option[];
  readonly reviewComplete: boolean;
  /** The legacy report is intentionally replaced by local, in-memory state. */
  readonly reportingDisposition: "blocked-memory-only";
}

export type G5L5Fq003Action =
  | Readonly<{type: "answer"; choice: G5L5Fq003Option}>
  | Readonly<{type: "start-review"}>
  | Readonly<{type: "next-review"}>
  | Readonly<{type: "return-to-result"}>
  | Readonly<{type: "reset"}>;

export const G5_L5_FQ003_INITIAL_STATE: G5L5Fq003State = Object.freeze({
  mode: "question",
  questionIndex: 0,
  reviewIndex: 0,
  responses: Object.freeze([]),
  reviewComplete: false,
  reportingDisposition: "blocked-memory-only",
});

export function reduceG5L5Fq003(
  state: G5L5Fq003State,
  action: G5L5Fq003Action,
): G5L5Fq003State {
  if (action.type === "reset") return G5_L5_FQ003_INITIAL_STATE;
  if (action.type === "answer") {
    if (
      state.mode !== "question" ||
      state.responses.length !== state.questionIndex ||
      state.responses.length >= G5_L5_FQ003_CORRECT_OPTIONS.length
    ) return state;
    const responses = Object.freeze([...state.responses, action.choice]);
    const finished = responses.length === G5_L5_FQ003_CORRECT_OPTIONS.length;
    return Object.freeze({
      ...state,
      mode: finished ? "result" : "question",
      questionIndex: finished ? state.questionIndex : state.questionIndex + 1,
      responses,
    });
  }
  if (action.type === "start-review") {
    if (state.mode !== "result" || state.responses.length !== 26) return state;
    return Object.freeze({...state, mode: "review", reviewIndex: 0});
  }
  if (action.type === "next-review") {
    if (state.mode !== "review") return state;
    if (state.reviewIndex >= G5_L5_FQ003_CORRECT_OPTIONS.length - 1) {
      return Object.freeze({
        ...state,
        mode: "result",
        reviewComplete: true,
      });
    }
    return Object.freeze({...state, reviewIndex: state.reviewIndex + 1});
  }
  if (action.type === "return-to-result") {
    if (state.mode !== "review") return state;
    return Object.freeze({...state, mode: "result"});
  }
  return state;
}

export function getG5L5Fq003CorrectCount(state: G5L5Fq003State): number {
  return state.responses.reduce(
    (count, response, index) =>
      count + (response === G5_L5_FQ003_CORRECT_OPTIONS[index] ? 1 : 0),
    0,
  );
}

export type G5L5Fq003Grade =
  | "Unsatisfactory"
  | "Partially Proficient"
  | "Proficient"
  | "Advanced";

/** Exact score thresholds from DefineSprite_16/frame_2/DoAction.as. */
export function getG5L5Fq003Grade(correctCount: number): G5L5Fq003Grade {
  if (correctCount <= 3) return "Unsatisfactory";
  if (correctCount <= 6) return "Partially Proficient";
  if (correctCount <= 8) return "Proficient";
  return "Advanced";
}

export function g5L5Fq003FrameForState(state: G5L5Fq003State): number {
  if (state.mode === "question") return state.questionIndex + 2;
  if (state.mode === "review") return state.reviewIndex + 46;
  return 45;
}

export function g5L5Fq003BehaviorCompositeStateForState(
  state: G5L5Fq003State,
): string {
  if (state.mode === "question") return `question-n${state.questionIndex + 1}`;
  if (state.mode === "result") {
    return `result-score${getG5L5Fq003CorrectCount(state)}`;
  }
  const response = state.responses[state.reviewIndex];
  if (response === undefined) {
    throw new Error("FQ003 review state has no source-bound response");
  }
  return `review-q${state.reviewIndex + 1}-selected${response}`;
}
