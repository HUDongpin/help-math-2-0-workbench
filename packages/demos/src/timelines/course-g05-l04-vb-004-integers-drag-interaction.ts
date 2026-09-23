import type {AnimationLanguage} from "../contract";

export const COURSE_G05_L04_VB_004_INTERACTION_FRAME = 208;
export const COURSE_G05_L04_VB_004_SOURCE_CONTROL_FRAME = 209;
export const COURSE_G05_L04_VB_004_INTERACTION_DOMAIN = "sprite-71";
export const COURSE_G05_L04_VB_004_INTERACTION_SCENARIO =
  "source-static-frame";
export const COURSE_G05_L04_VB_004_STAGE = Object.freeze({
  width: 800,
  height: 600,
});

export type CourseG05L04Vb004CardId =
  | "Src_1"
  | "Src_2"
  | "Src_3"
  | "Src_4"
  | "Src_5"
  | "Src_6"
  | "Src_7"
  | "Src_8";

export type CourseG05L04Vb004TargetId = "Mc_Tar_1" | "Mc_Tar_2";

export interface CourseG05L04Vb004Point {
  readonly x: number;
  readonly y: number;
}

export interface CourseG05L04Vb004Bounds {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

interface CourseG05L04Vb004CardSize {
  readonly width: number;
  readonly height: number;
}

export interface CourseG05L04Vb004Card {
  readonly id: CourseG05L04Vb004CardId;
  readonly sourceCharacterId: number;
  readonly sourceDepth: number;
  readonly visibleText: string;
  readonly accessibleLabel: string;
  readonly fraction?: Readonly<{
    numerator: string;
    denominator: string;
  }>;
  readonly correctTargetId: CourseG05L04Vb004TargetId;
  readonly sourceCenter: CourseG05L04Vb004Point;
  readonly sourceCardSize: CourseG05L04Vb004CardSize;
  readonly sourceVisualBounds: CourseG05L04Vb004Bounds;
}

export interface CourseG05L04Vb004Target {
  readonly id: CourseG05L04Vb004TargetId;
  readonly label: "Integers" | "Non-Integers";
  readonly accessibleCategory: "an integer" | "a non-integer";
  readonly sourceObjectId: 44 | 43;
  readonly bounds: CourseG05L04Vb004Bounds;
}

const point = (x: number, y: number) => Object.freeze({x, y});
const size = (width: number, height: number) =>
  Object.freeze({width, height});
const bounds = (
  left: number,
  right: number,
  top: number,
  bottom: number,
) => Object.freeze({left, right, top, bottom});

export const COURSE_G05_L04_VB_004_TARGETS = Object.freeze([
  Object.freeze({
    id: "Mc_Tar_1",
    label: "Integers",
    accessibleCategory: "an integer",
    sourceObjectId: 44,
    bounds: bounds(
      123.08943023681641,
      269.0373062133789,
      187.00015258789062,
      397.9543914794922,
    ),
  }),
  Object.freeze({
    id: "Mc_Tar_2",
    label: "Non-Integers",
    accessibleCategory: "a non-integer",
    sourceObjectId: 43,
    bounds: bounds(
      314.8958709646016,
      463.005785774067,
      184.9995880126953,
      400.0274353027344,
    ),
  }),
] as const satisfies readonly CourseG05L04Vb004Target[]);

export const COURSE_G05_L04_VB_004_CARDS = Object.freeze([
  Object.freeze({
    id: "Src_1",
    sourceCharacterId: 45,
    sourceDepth: 31,
    visibleText: "−5",
    accessibleLabel: "negative five",
    correctTargetId: "Mc_Tar_1",
    sourceCenter: point(566.3, 171.5),
    sourceCardSize: size(34.00010375976563, 31.45),
    sourceVisualBounds: bounds(549.3, 591.7, 155.75, 187.2),
  }),
  Object.freeze({
    id: "Src_2",
    sourceCharacterId: 46,
    sourceDepth: 35,
    visibleText: "0",
    accessibleLabel: "zero",
    correctTargetId: "Mc_Tar_1",
    sourceCenter: point(566.3, 232.15),
    sourceCardSize: size(30.6, 31.45),
    sourceVisualBounds: bounds(551, 583.7, 216.4, 247.85),
  }),
  Object.freeze({
    id: "Src_3",
    sourceCharacterId: 47,
    sourceDepth: 38,
    visibleText: "1/4",
    accessibleLabel: "one fourth",
    fraction: Object.freeze({numerator: "1", denominator: "4"}),
    correctTargetId: "Mc_Tar_2",
    sourceCenter: point(566.3, 302.8),
    sourceCardSize: size(30.6, 59.20005645751953),
    sourceVisualBounds: bounds(551, 584.7, 273.2, 332.4),
  }),
  Object.freeze({
    id: "Src_4",
    sourceCharacterId: 48,
    sourceDepth: 42,
    visibleText: "18",
    accessibleLabel: "eighteen",
    correctTargetId: "Mc_Tar_1",
    sourceCenter: point(566.3, 373.45),
    sourceCardSize: size(30.6, 31.45),
    sourceVisualBounds: bounds(551, 589.65, 357.75, 389.2),
  }),
  Object.freeze({
    id: "Src_5",
    sourceCharacterId: 49,
    sourceDepth: 45,
    visibleText: "3.9",
    accessibleLabel: "three point nine",
    correctTargetId: "Mc_Tar_2",
    sourceCenter: point(659.55, 171.5),
    sourceCardSize: size(42.49989624023438, 31.45),
    sourceVisualBounds: bounds(638.3, 686.9, 155.75, 187.2),
  }),
  Object.freeze({
    id: "Src_6",
    sourceCharacterId: 50,
    sourceDepth: 48,
    visibleText: "−10.5",
    accessibleLabel: "negative ten point five",
    correctTargetId: "Mc_Tar_2",
    sourceCenter: point(659.55, 232.15),
    sourceCardSize: size(62.90005187988282, 31.45),
    sourceVisualBounds: bounds(628.1, 698.85, 216.4, 247.85),
  }),
  Object.freeze({
    id: "Src_7",
    sourceCharacterId: 51,
    sourceDepth: 51,
    visibleText: "35/100",
    accessibleLabel: "thirty-five hundredths",
    fraction: Object.freeze({numerator: "35", denominator: "100"}),
    correctTargetId: "Mc_Tar_2",
    sourceCenter: point(659.55, 302.8),
    sourceCardSize: size(51.00015563964844, 59.20005645751953),
    sourceVisualBounds: bounds(634.05, 689.4, 273.2, 332.4),
  }),
  Object.freeze({
    id: "Src_8",
    sourceCharacterId: 52,
    sourceDepth: 55,
    visibleText: "9",
    accessibleLabel: "nine",
    correctTargetId: "Mc_Tar_1",
    sourceCenter: point(659.55, 373.45),
    sourceCardSize: size(30.6, 31.45),
    sourceVisualBounds: bounds(644.25, 676.95, 357.75, 389.2),
  }),
] as const satisfies readonly CourseG05L04Vb004Card[]);

export const COURSE_G05_L04_VB_004_INPUT_METHODS = Object.freeze([
  "pointer-drag",
  "touch-pointer-drag",
  "select-card-then-target-keyboard",
  "select-card-then-target-touch",
  "escape-cancel",
] as const);

export const COURSE_G05_L04_VB_004_INTERACTION_AUTHORITY = Object.freeze({
  sourceGeometryAuthority: "swf-static-matrix-not-runtime-hit-probe",
  sourceActionScriptExecuted: false,
  sourceSnapBehaviorEstablished: false,
  embeddedCoachAudioModeled: false,
  associatedAudioModeled: false,
  audioParityEstablished: false,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  originalRuntimeAuthorityEstablished: false,
  fullFrameRmseEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  publicationAuthorized: false,
  lessonPublished: false,
  strictAcceptanceEffect: "none",
});

export interface CourseG05L04Vb004Feedback {
  readonly sequence: number;
  readonly kind: "wrong" | "correct" | "complete";
  readonly cardId: CourseG05L04Vb004CardId;
  readonly attemptedTargetId: CourseG05L04Vb004TargetId | null;
}

export interface CourseG05L04Vb004InteractionState {
  readonly buckets: Readonly<
    Record<CourseG05L04Vb004TargetId, readonly CourseG05L04Vb004CardId[]>
  >;
  readonly selectedCardId: CourseG05L04Vb004CardId | null;
  readonly status: "ready" | "complete";
  readonly attemptSequence: number;
  readonly feedback: CourseG05L04Vb004Feedback | null;
}

export type CourseG05L04Vb004InteractionAction =
  | Readonly<{type: "select-card"; cardId: string}>
  | Readonly<{type: "cancel-selection"}>
  | Readonly<{
      type: "drop-card";
      cardId: string;
      targetId: string | null;
      input: "pointer" | "keyboard" | "touch";
    }>
  | Readonly<{type: "reset"}>
  | Readonly<{type: "replay"}>;

const cardsById = new Map(
  COURSE_G05_L04_VB_004_CARDS.map((card) => [card.id, card]),
);
const targetsById = new Map(
  COURSE_G05_L04_VB_004_TARGETS.map((target) => [target.id, target]),
);

export function getCourseG05L04Vb004Card(cardId: string) {
  return cardsById.get(cardId as CourseG05L04Vb004CardId) ?? null;
}

export function getCourseG05L04Vb004Target(targetId: string) {
  return targetsById.get(targetId as CourseG05L04Vb004TargetId) ?? null;
}

function freezeBuckets(
  first: readonly CourseG05L04Vb004CardId[],
  second: readonly CourseG05L04Vb004CardId[],
) {
  return Object.freeze({
    Mc_Tar_1: Object.freeze([...first]),
    Mc_Tar_2: Object.freeze([...second]),
  });
}

function freezeState({
  attemptSequence,
  buckets: suppliedBuckets,
  feedback,
  selectedCardId,
  status,
}: CourseG05L04Vb004InteractionState): CourseG05L04Vb004InteractionState {
  return Object.freeze({
    buckets: freezeBuckets(
      suppliedBuckets.Mc_Tar_1,
      suppliedBuckets.Mc_Tar_2,
    ),
    selectedCardId,
    status,
    attemptSequence,
    feedback: feedback ? Object.freeze({...feedback}) : null,
  });
}

export function createCourseG05L04Vb004InteractionState(): CourseG05L04Vb004InteractionState {
  return freezeState({
    buckets: freezeBuckets([], []),
    selectedCardId: null,
    status: "ready",
    attemptSequence: 0,
    feedback: null,
  });
}

export function getCourseG05L04Vb004PlacedCount(
  state: CourseG05L04Vb004InteractionState,
) {
  return state.buckets.Mc_Tar_1.length + state.buckets.Mc_Tar_2.length;
}

export function getCourseG05L04Vb004CardPlacement(
  state: CourseG05L04Vb004InteractionState,
  cardId: CourseG05L04Vb004CardId,
) {
  for (const target of COURSE_G05_L04_VB_004_TARGETS) {
    const index = state.buckets[target.id].indexOf(cardId);
    if (index >= 0) return Object.freeze({targetId: target.id, index});
  }
  return null;
}

export function reduceCourseG05L04Vb004Interaction(
  state: CourseG05L04Vb004InteractionState,
  action: CourseG05L04Vb004InteractionAction,
): CourseG05L04Vb004InteractionState {
  if (action.type === "reset" || action.type === "replay") {
    return createCourseG05L04Vb004InteractionState();
  }
  if (state.status === "complete") return state;

  if (action.type === "cancel-selection") {
    if (state.selectedCardId === null) return state;
    return freezeState({...state, selectedCardId: null});
  }

  const card = getCourseG05L04Vb004Card(action.cardId);
  if (!card || getCourseG05L04Vb004CardPlacement(state, card.id)) return state;

  if (action.type === "select-card") {
    return freezeState({
      ...state,
      selectedCardId:
        state.selectedCardId === card.id ? null : card.id,
      feedback: null,
    });
  }

  const attemptedTarget = action.targetId
    ? getCourseG05L04Vb004Target(action.targetId)
    : null;
  const nextSequence = state.attemptSequence + 1;
  if (!attemptedTarget || attemptedTarget.id !== card.correctTargetId) {
    return freezeState({
      ...state,
      selectedCardId: null,
      attemptSequence: nextSequence,
      feedback: {
        sequence: nextSequence,
        kind: "wrong",
        cardId: card.id,
        attemptedTargetId: attemptedTarget?.id ?? null,
      },
    });
  }

  const nextBuckets = freezeBuckets(
    attemptedTarget.id === "Mc_Tar_1"
      ? [...state.buckets.Mc_Tar_1, card.id]
      : state.buckets.Mc_Tar_1,
    attemptedTarget.id === "Mc_Tar_2"
      ? [...state.buckets.Mc_Tar_2, card.id]
      : state.buckets.Mc_Tar_2,
  );
  const complete =
    nextBuckets.Mc_Tar_1.length + nextBuckets.Mc_Tar_2.length ===
    COURSE_G05_L04_VB_004_CARDS.length;
  return freezeState({
    buckets: nextBuckets,
    selectedCardId: null,
    status: complete ? "complete" : "ready",
    attemptSequence: nextSequence,
    feedback: {
      sequence: nextSequence,
      kind: complete ? "complete" : "correct",
      cardId: card.id,
      attemptedTargetId: attemptedTarget.id,
    },
  });
}

interface ClientRectLike {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

const finitePoint = ({x, y}: CourseG05L04Vb004Point) =>
  Number.isFinite(x) && Number.isFinite(y);

export function projectClientPointToCourseG05L04Vb004Stage(
  clientPoint: CourseG05L04Vb004Point,
  rect: ClientRectLike,
): CourseG05L04Vb004Point | null {
  if (
    !finitePoint(clientPoint) ||
    !Number.isFinite(rect.left) ||
    !Number.isFinite(rect.top) ||
    !Number.isFinite(rect.width) ||
    !Number.isFinite(rect.height) ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    return null;
  }
  return point(
    ((clientPoint.x - rect.left) * COURSE_G05_L04_VB_004_STAGE.width) /
      rect.width,
    ((clientPoint.y - rect.top) * COURSE_G05_L04_VB_004_STAGE.height) /
      rect.height,
  );
}

export function translateCourseG05L04Vb004CardCenter(
  sourceCenter: CourseG05L04Vb004Point,
  pointerStart: CourseG05L04Vb004Point,
  pointerNow: CourseG05L04Vb004Point,
): CourseG05L04Vb004Point | null {
  if (
    !finitePoint(sourceCenter) ||
    !finitePoint(pointerStart) ||
    !finitePoint(pointerNow)
  ) {
    return null;
  }
  return point(
    sourceCenter.x + pointerNow.x - pointerStart.x,
    sourceCenter.y + pointerNow.y - pointerStart.y,
  );
}

export function getCourseG05L04Vb004TargetAtPoint(
  stagePoint: CourseG05L04Vb004Point | null,
): CourseG05L04Vb004TargetId | null {
  if (!stagePoint || !finitePoint(stagePoint)) return null;
  const hits = COURSE_G05_L04_VB_004_TARGETS.filter(
    ({bounds: targetBounds}) =>
      stagePoint.x >= targetBounds.left &&
      stagePoint.x <= targetBounds.right &&
      stagePoint.y >= targetBounds.top &&
      stagePoint.y <= targetBounds.bottom,
  );
  return hits.length === 1 ? hits[0]!.id : null;
}

const SLOT_Y = Object.freeze([220, 270, 320, 367] as const);

export function getCourseG05L04Vb004SnapPoint(
  targetId: CourseG05L04Vb004TargetId,
  index: number,
) {
  const target = getCourseG05L04Vb004Target(targetId);
  if (!target || !Number.isSafeInteger(index) || index < 0) return null;
  return point(
    (target.bounds.left + target.bounds.right) / 2,
    SLOT_Y[Math.min(index, SLOT_Y.length - 1)]!,
  );
}

const APP_OWNED_CARD_LABELS_ES = Object.freeze({
  Src_1: "menos cinco",
  Src_2: "cero",
  Src_3: "un cuarto",
  Src_4: "dieciocho",
  Src_5: "tres punto nueve",
  Src_6: "menos diez punto cinco",
  Src_7: "treinta y cinco centésimos",
  Src_8: "nueve",
} as const satisfies Readonly<Record<CourseG05L04Vb004CardId, string>>);

export function getCourseG05L04Vb004AppOwnedCardLabel(
  cardId: CourseG05L04Vb004CardId,
  language: AnimationLanguage = "en",
) {
  const card = getCourseG05L04Vb004Card(cardId);
  if (!card) return "";
  return language === "es"
    ? APP_OWNED_CARD_LABELS_ES[card.id]
    : card.accessibleLabel;
}

export function getCourseG05L04Vb004AppOwnedTargetLabel(
  targetId: CourseG05L04Vb004TargetId,
  language: AnimationLanguage = "en",
) {
  const target = getCourseG05L04Vb004Target(targetId);
  if (!target) return "";
  if (language === "es") {
    return target.id === "Mc_Tar_1" ? "Enteros" : "No enteros";
  }
  return target.label;
}

export function getCourseG05L04Vb004AppOwnedAccessibleCategory(
  targetId: CourseG05L04Vb004TargetId,
  language: AnimationLanguage = "en",
) {
  const target = getCourseG05L04Vb004Target(targetId);
  if (!target) return "";
  if (language === "es") {
    return target.id === "Mc_Tar_1" ? "un entero" : "un número no entero";
  }
  return target.accessibleCategory;
}

export function getCourseG05L04Vb004FeedbackMessage(
  state: CourseG05L04Vb004InteractionState,
  language: AnimationLanguage = "en",
) {
  const spanish = language === "es";
  if (!state.feedback) {
    if (!state.selectedCardId) {
      return spanish
        ? "Mueve cada número a Enteros o No enteros."
        : "Move each number to Integers or Non-Integers.";
    }
    const selectedLabel = getCourseG05L04Vb004AppOwnedCardLabel(
      state.selectedCardId,
      language,
    );
    return spanish
      ? `Seleccionaste ${selectedLabel}. Elige Enteros o No enteros.`
      : `Selected ${selectedLabel}. Choose Integers or Non-Integers.`;
  }
  const card = getCourseG05L04Vb004Card(state.feedback.cardId);
  const target = state.feedback.attemptedTargetId
    ? getCourseG05L04Vb004Target(state.feedback.attemptedTargetId)
    : null;
  const cardLabel = card
    ? getCourseG05L04Vb004AppOwnedCardLabel(card.id, language)
    : "";
  if (state.feedback.kind === "complete") {
    return spanish
      ? "¡Buen trabajo! Los ocho números están clasificados correctamente."
      : "Great work! All eight numbers are classified correctly.";
  }
  if (state.feedback.kind === "correct") {
    const category = target
      ? getCourseG05L04Vb004AppOwnedAccessibleCategory(target.id, language)
      : "";
    return spanish
      ? `${cardLabel} es ${category}. Correcto.`
      : `${cardLabel} is ${category}. Correct.`;
  }
  if (target) {
    const targetLabel = getCourseG05L04Vb004AppOwnedTargetLabel(
      target.id,
      language,
    );
    return spanish
      ? `${cardLabel} no pertenece a ${targetLabel}. Inténtalo de nuevo.`
      : `${cardLabel} does not belong in ${targetLabel}. Try again.`;
  }
  return spanish
    ? `${cardLabel} no se colocó en una categoría. Inténtalo de nuevo.`
    : `${cardLabel} was not dropped in a category. Try again.`;
}
