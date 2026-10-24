export const ALG_L09_VB06_DRAG_BEHAVIOR_V1 = Object.freeze({
  schemaVersion: 1,
  artifactType: "g678-alg-l09-vb06-source-bound-drag-behavior-v1",
  animationId: "shared-alg001-l09-p012",
  source: Object.freeze({
    path: "G6-G8-shared/ALG001/L9/VB/L9VB06.swf",
    bytes: 480_011,
    sha256: "a45c6ec1adf9d5341f65024188959fa7b7a99d7c9a189866b629c61df9c3f437",
  }),
  timeline: Object.freeze({
    rootFrameCount: 10,
    rootBeginFrame: 6,
    frameDomain: "sprite-78",
    frameCount: 188,
    interactionStopFrame: 129,
    resumeFrame: 130,
  }),
  sourceGroups: Object.freeze({
    proportional: Object.freeze(["drag-2", "drag-4"] as const),
    nonProportional: Object.freeze(["drag-1", "drag-3"] as const),
  }),
  targetGroups: Object.freeze({
    proportional: Object.freeze(["drop-1", "drop-2"] as const),
    nonProportional: Object.freeze(["drop-3", "drop-4"] as const),
  }),
  completion: Object.freeze({
    counter: "_global.quizDragCount",
    threshold: 4,
    sourceExpression: "if(_global.quizDragCount >= 4){ _global.quizSection = false; _parent.play(); }",
  }),
  feedback: Object.freeze({
    wrongProportionalExplanation:
      "Two quantities have a proportional relationship when every ratio of pairs of values is equal. Try again.",
    wrongNonProportionalExplanation:
      "Two quantities have a non-proportional relationship if at least one ratio of a pair of values does not equal one of the other ratios. Try again.",
    randomAudioLabels: Object.freeze(["S1", "S2", "S3", "S4"] as const),
    audioAcceptance: false,
  }),
  glossarySourceKeys: Object.freeze([
    "Quantity",
    "Proportional relationship",
    "Non-proportional relationship",
  ] as const),
  acceptanceEffects: Object.freeze({
    authoritativeOriginalRuntime: false,
    behaviorAccepted: false,
    visualFidelityAccepted: false,
    audioAccepted: false,
    humanVisualAccepted: false,
    ownerAccepted: false,
    strictComplete: false,
    released: false,
    published: false,
  }),
});

export type AlgL09Vb06SourceId =
  | "drag-1"
  | "drag-2"
  | "drag-3"
  | "drag-4";

export type AlgL09Vb06TargetId =
  | "drop-1"
  | "drop-2"
  | "drop-3"
  | "drop-4";

export type AlgL09Vb06Input = "mouse" | "enter" | "space";

export interface AlgL09Vb06State {
  readonly phase: "playing" | "interacting" | "resolved" | "resumed";
  readonly selectedSource: AlgL09Vb06SourceId | null;
  readonly placements: Readonly<Partial<Record<
    AlgL09Vb06SourceId,
    AlgL09Vb06TargetId
  >>>;
  readonly wrongFeedback: "proportional" | "non-proportional" | null;
  readonly quizDragCount: number;
  readonly replay: number;
  readonly blockedReason: string | null;
}

export type AlgL09Vb06Event =
  | Readonly<{type: "observe-frame"; frame: number}>
  | Readonly<{
      type: "pick-source";
      sourceId: AlgL09Vb06SourceId;
      input: AlgL09Vb06Input;
    }>
  | Readonly<{
      type: "drop-source";
      sourceId: AlgL09Vb06SourceId;
      targetId: AlgL09Vb06TargetId;
      input: AlgL09Vb06Input;
    }>
  | Readonly<{type: "dismiss-feedback"; input: AlgL09Vb06Input}>
  | Readonly<{type: "replay"; input: AlgL09Vb06Input}>;

const SOURCE_IDS = new Set<AlgL09Vb06SourceId>([
  "drag-1", "drag-2", "drag-3", "drag-4",
]);
const TARGET_IDS = new Set<AlgL09Vb06TargetId>([
  "drop-1", "drop-2", "drop-3", "drop-4",
]);
const INPUTS = new Set<AlgL09Vb06Input>(["mouse", "enter", "space"]);

function sourceGroup(sourceId: AlgL09Vb06SourceId) {
  return sourceId === "drag-2" || sourceId === "drag-4"
    ? "proportional"
    : "non-proportional";
}

function targetGroup(targetId: AlgL09Vb06TargetId) {
  return targetId === "drop-1" || targetId === "drop-2"
    ? "proportional"
    : "non-proportional";
}

function blocked(state: AlgL09Vb06State, reason: string): AlgL09Vb06State {
  return {...state, blockedReason: reason};
}

export function createAlgL09Vb06State(): AlgL09Vb06State {
  return {
    phase: "playing",
    selectedSource: null,
    placements: Object.freeze({}),
    wrongFeedback: null,
    quizDragCount: 0,
    replay: 0,
    blockedReason: null,
  };
}

export function algL09Vb06CorrectTarget(
  sourceId: AlgL09Vb06SourceId,
  targetId: AlgL09Vb06TargetId,
) {
  return sourceGroup(sourceId) === targetGroup(targetId);
}

export function reduceAlgL09Vb06(
  state: AlgL09Vb06State,
  event: AlgL09Vb06Event,
): AlgL09Vb06State {
  switch (event.type) {
    case "observe-frame": {
      const frame = Math.max(1, Math.min(188, Math.trunc(event.frame)));
      if (frame > 129 && state.phase === "resolved") {
        return {...state, phase: "resumed", blockedReason: null};
      }
      if (frame >= 129 && state.phase === "playing") {
        return {...state, phase: "interacting", blockedReason: null};
      }
      return state;
    }
    case "pick-source": {
      if (!INPUTS.has(event.input) || !SOURCE_IDS.has(event.sourceId)) {
        return blocked(state, "source-activation-invalid");
      }
      if (state.phase !== "interacting" ||
        state.placements[event.sourceId]) {
        return blocked(state, "source-not-available");
      }
      return {...state, selectedSource: event.sourceId,
        wrongFeedback: null, blockedReason: null};
    }
    case "drop-source": {
      if (!INPUTS.has(event.input) || !SOURCE_IDS.has(event.sourceId) ||
        !TARGET_IDS.has(event.targetId)) {
        return blocked(state, "drop-activation-invalid");
      }
      if (state.phase !== "interacting" ||
        state.placements[event.sourceId]) {
        return blocked(state, "source-not-available");
      }
      if (!algL09Vb06CorrectTarget(event.sourceId, event.targetId)) {
        return {...state,
          selectedSource: null,
          wrongFeedback: targetGroup(event.targetId),
          blockedReason: null,
        };
      }
      const placements = Object.freeze({
        ...state.placements,
        [event.sourceId]: event.targetId,
      });
      const quizDragCount = Object.keys(placements).length;
      return {...state,
        phase: quizDragCount >= 4 ? "resolved" : "interacting",
        selectedSource: null,
        placements,
        wrongFeedback: null,
        quizDragCount,
        blockedReason: null,
      };
    }
    case "dismiss-feedback": {
      if (!INPUTS.has(event.input) || !state.wrongFeedback) {
        return blocked(state, "feedback-dismissal-invalid");
      }
      return {...state, wrongFeedback: null, blockedReason: null};
    }
    case "replay": {
      if (!INPUTS.has(event.input)) {
        return blocked(state, "replay-activation-invalid");
      }
      return {...createAlgL09Vb06State(), replay: state.replay + 1};
    }
  }
}
