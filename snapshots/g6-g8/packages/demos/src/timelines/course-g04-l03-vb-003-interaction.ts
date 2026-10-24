export type CourseG04L03Vb003ItemId = "2" | "3" | "4" | "5" | "6";

export type CourseG04L03Vb003InteractionMode =
  | "ready"
  | "correct-feedback"
  | "wrong-feedback"
  | "completed";

export type CourseG04L03Vb003CorrectFeedbackPolicy =
  | "inactive"
  | "hold-while-paused"
  | "complete-immediately"
  | "schedule-delay";

export interface CourseG04L03Vb003Point {
  readonly x: number;
  readonly y: number;
}

export interface CourseG04L03Vb003Size {
  readonly height: number;
  readonly width: number;
}

export interface CourseG04L03Vb003DragItem {
  readonly id: CourseG04L03Vb003ItemId;
  readonly label: string;
  readonly numericValue: number;
  readonly sourceInstance: `Scr_${CourseG04L03Vb003ItemId}`;
  readonly sourcePosition: CourseG04L03Vb003Point;
  readonly sourceSize: CourseG04L03Vb003Size;
  readonly targetInstance: `Mc_Tar_${CourseG04L03Vb003ItemId}`;
  readonly targetPosition: CourseG04L03Vb003Point;
  readonly targetSize: CourseG04L03Vb003Size;
}

export interface CourseG04L03Vb003InteractionState {
  readonly mode: CourseG04L03Vb003InteractionMode;
  readonly placedItemIds: readonly CourseG04L03Vb003ItemId[];
  readonly selectedItemId: CourseG04L03Vb003ItemId | null;
  readonly lastPlacedItemId: CourseG04L03Vb003ItemId | null;
  readonly attemptedTargetId: CourseG04L03Vb003ItemId | null;
  readonly feedbackText: string | null;
}

export type CourseG04L03Vb003InteractionAction =
  | Readonly<{type: "select-item"; itemId: CourseG04L03Vb003ItemId}>
  | Readonly<{
      type: "drop-item";
      itemId?: CourseG04L03Vb003ItemId;
      targetId: CourseG04L03Vb003ItemId;
    }>
  | Readonly<{type: "correct-feedback-finished"}>
  | Readonly<{type: "close-wrong-feedback"}>
  | Readonly<{type: "reset"}>
  | Readonly<{type: "replay"}>;

/**
 * These stage coordinates are the source registration points after applying
 * the root placement (414.4, 283.3) to sprite-106 frame 116. They are bound to
 * the hash-recorded swfmill placement graph, not estimated from a screenshot.
 */
export const COURSE_G04_L03_VB_003_DRAG_ITEMS:
  readonly CourseG04L03Vb003DragItem[] = Object.freeze([
    Object.freeze({
      id: "2",
      label: "–2",
      numericValue: -2,
      sourceInstance: "Scr_2",
      sourcePosition: Object.freeze({x: 316.1, y: 386.05}),
      sourceSize: Object.freeze({height: 35.1, width: 31.5}),
      targetInstance: "Mc_Tar_2",
      targetPosition: Object.freeze({x: 350.95, y: 250.55}),
      targetSize: Object.freeze({height: 40.05, width: 36.25}),
    }),
    Object.freeze({
      id: "3",
      label: "2",
      numericValue: 2,
      sourceInstance: "Scr_3",
      sourcePosition: Object.freeze({x: 387.1, y: 386.05}),
      sourceSize: Object.freeze({height: 35.1, width: 31.5}),
      targetInstance: "Mc_Tar_3",
      targetPosition: Object.freeze({x: 485.95, y: 250.55}),
      targetSize: Object.freeze({height: 39.85, width: 35.5}),
    }),
    Object.freeze({
      id: "4",
      label: "0",
      numericValue: 0,
      sourceInstance: "Scr_4",
      sourcePosition: Object.freeze({x: 458.1, y: 386.05}),
      sourceSize: Object.freeze({height: 35.1, width: 31.5}),
      targetInstance: "Mc_Tar_4",
      targetPosition: Object.freeze({x: 419.95, y: 250.55}),
      targetSize: Object.freeze({height: 40.25, width: 35.55}),
    }),
    Object.freeze({
      id: "5",
      label: "–5",
      numericValue: -5,
      sourceInstance: "Scr_5",
      sourcePosition: Object.freeze({x: 531.1, y: 386.05}),
      sourceSize: Object.freeze({height: 35.1, width: 31.5}),
      targetInstance: "Mc_Tar_5",
      targetPosition: Object.freeze({x: 247.95, y: 250.55}),
      targetSize: Object.freeze({height: 39.8, width: 35.2}),
    }),
    Object.freeze({
      id: "6",
      label: "5",
      numericValue: 5,
      sourceInstance: "Scr_6",
      sourcePosition: Object.freeze({x: 602.1, y: 386.05}),
      sourceSize: Object.freeze({height: 35.1, width: 31.5}),
      targetInstance: "Mc_Tar_6",
      targetPosition: Object.freeze({x: 590.95, y: 250.55}),
      targetSize: Object.freeze({height: 40.4, width: 35.2}),
    }),
  ]);

export const COURSE_G04_L03_VB_003_FIXED_EXAMPLE = Object.freeze({
  label: "–7",
  targetInstance: "Mc_Tar_1",
  targetPosition: Object.freeze({x: 180.95, y: 250.55}),
  targetSize: Object.freeze({height: 39.8, width: 35}),
});

export const COURSE_G04_L03_VB_003_INSTRUCTION =
  "Drag and drop each number to its correct position on the number line.";

export const COURSE_G04_L03_VB_003_WRONG_FEEDBACK =
  "Number lines show numbers in order. Try again.";

export const COURSE_G04_L03_VB_003_COMPLETION_FEEDBACK = "Correct!!!";

/**
 * Source Coach_audio_2 enters at frame 2 and re-enables the clips at frame 20.
 * This duration is a deterministic current-JS projection of 19 frames at
 * 12 FPS; it is not an original-runtime trace or accepted audio timing.
 */
export const COURSE_G04_L03_VB_003_CURRENT_JS_TIMING = Object.freeze({
  correctFeedbackMs: (19 * 1_000) / 12,
});

export const COURSE_G04_L03_VB_003_INTERACTION_AUTHORITY = Object.freeze({
  evidenceBasis:
    "exact-avm1-clip-handlers-and-hash-bound-swfmill-placement-graph",
  implementationKind: "current-javascript-pure-state-candidate",
  sourceDragDropExecuted: false,
  correctFeedbackTimingIsOriginalRuntimeTrace: false,
  embeddedCoachAudioModeled: false,
  completionContinuationModeled: false,
  spanishImplemented: false,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});

export const getCourseG04L03Vb003CorrectFeedbackPolicy = ({
  mode,
  paused,
  reducedMotion,
}: Readonly<{
  mode: CourseG04L03Vb003InteractionMode;
  paused: boolean;
  reducedMotion: boolean;
}>): CourseG04L03Vb003CorrectFeedbackPolicy => {
  if (mode !== "correct-feedback") return "inactive";
  if (paused) return "hold-while-paused";
  if (reducedMotion) return "complete-immediately";
  return "schedule-delay";
};

const allItemIds = (): CourseG04L03Vb003ItemId[] =>
  COURSE_G04_L03_VB_003_DRAG_ITEMS.map(({id}) => id);

const isKnownItemId = (
  itemId: string,
): itemId is CourseG04L03Vb003ItemId =>
  COURSE_G04_L03_VB_003_DRAG_ITEMS.some(({id}) => id === itemId);

const freezeState = (
  state: Omit<CourseG04L03Vb003InteractionState, "placedItemIds"> & {
    readonly placedItemIds: readonly CourseG04L03Vb003ItemId[];
  },
): CourseG04L03Vb003InteractionState => Object.freeze({
  ...state,
  placedItemIds: Object.freeze([...state.placedItemIds]),
});

export const createCourseG04L03Vb003InteractionState =
  (): CourseG04L03Vb003InteractionState => freezeState({
    mode: "ready",
    placedItemIds: [],
    selectedItemId: null,
    lastPlacedItemId: null,
    attemptedTargetId: null,
    feedbackText: null,
  });

export const reduceCourseG04L03Vb003Interaction = (
  state: CourseG04L03Vb003InteractionState,
  action: CourseG04L03Vb003InteractionAction,
): CourseG04L03Vb003InteractionState => {
  switch (action.type) {
    case "select-item":
      if (
        state.mode !== "ready"
        || state.placedItemIds.includes(action.itemId)
      ) return state;
      return freezeState({
        ...state,
        selectedItemId: action.itemId,
        attemptedTargetId: null,
        feedbackText: null,
      });

    case "drop-item": {
      if (state.mode !== "ready") return state;
      const itemId = action.itemId ?? state.selectedItemId;
      if (
        itemId === null
        || !isKnownItemId(itemId)
        || state.placedItemIds.includes(itemId)
      ) return state;

      if (itemId !== action.targetId) {
        return freezeState({
          ...state,
          mode: "wrong-feedback",
          selectedItemId: null,
          lastPlacedItemId: null,
          attemptedTargetId: action.targetId,
          feedbackText: COURSE_G04_L03_VB_003_WRONG_FEEDBACK,
        });
      }

      return freezeState({
        ...state,
        mode: "correct-feedback",
        placedItemIds: [...state.placedItemIds, itemId],
        selectedItemId: null,
        lastPlacedItemId: itemId,
        attemptedTargetId: action.targetId,
        feedbackText: null,
      });
    }

    case "correct-feedback-finished":
      if (state.mode !== "correct-feedback") return state;
      return freezeState({
        ...state,
        mode: state.placedItemIds.length >= allItemIds().length
          ? "completed"
          : "ready",
        attemptedTargetId: null,
        feedbackText: state.placedItemIds.length >= allItemIds().length
          ? COURSE_G04_L03_VB_003_COMPLETION_FEEDBACK
          : null,
      });

    case "close-wrong-feedback":
      if (state.mode !== "wrong-feedback") return state;
      return freezeState({
        ...state,
        mode: "ready",
        selectedItemId: null,
        attemptedTargetId: null,
        feedbackText: null,
      });

    case "reset":
    case "replay":
      return createCourseG04L03Vb003InteractionState();
  }
};
