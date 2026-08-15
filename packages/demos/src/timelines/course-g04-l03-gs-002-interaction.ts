export type CourseG04L03Gs002Sign = "+" | "-";

export type CourseG04L03Gs002Mode =
  | "ready"
  | "moving"
  | "hit-resolving"
  | "feedback"
  | "help"
  | "expired";

export interface CourseG04L03Gs002InteractionState {
  readonly seed: number;
  readonly rngState: number;
  readonly drawCount: number;
  readonly initialVirusIndex: number;
  readonly shipIndex: number;
  readonly virusIndex: number;
  readonly sign: CourseG04L03Gs002Sign | null;
  readonly distanceInput: string;
  readonly score: number;
  readonly timerMinutes: number;
  readonly timerSeconds: number;
  readonly timerDisplay: string;
  readonly timerTickCount: number;
  readonly timerAccumulatorMs: number;
  readonly activityAccumulatorMs: number;
  readonly mode: CourseG04L03Gs002Mode;
  readonly feedbackText: string | null;
  readonly movementDirection: CourseG04L03Gs002Sign | null;
  readonly plannedTargetIndex: number | null;
  readonly remainingMoveCount: number;
}

export type CourseG04L03Gs002InteractionAction =
  | Readonly<{type: "set-sign"; sign: CourseG04L03Gs002Sign}>
  | Readonly<{type: "set-distance"; value: string}>
  | Readonly<{type: "submit-move"}>
  | Readonly<{type: "close-feedback"}>
  | Readonly<{type: "open-help"}>
  | Readonly<{type: "close-help"}>
  | Readonly<{type: "movement-step"}>
  | Readonly<{type: "resolve-hit"}>
  | Readonly<{type: "timer-tick"}>
  | Readonly<{type: "advance-time"; elapsedMs: number}>
  | Readonly<{type: "new-game"}>
  | Readonly<{type: "replay"; seed?: number}>;

export const COURSE_G04_L03_GS_002_SHIP_Y = Object.freeze([
  -177.35, -154.35, -130.35, -106.35, -82.35,
  -58.35, -33.35, -7.35, 16.65, 42.65,
  67.65, 91.65, 117.65, 140.65, 166.65,
] as const);

export const COURSE_G04_L03_GS_002_VIRUS_Y = Object.freeze([
  -174.1, -151.1, -127.1, -103.1, -79.1,
  -55.1, -30.1, -4.1, 19.9, 45.9,
  70.9, 94.9, 120.9, 143.9, 169.9,
] as const);

export const COURSE_G04_L03_GS_002_ALLOWED_INITIAL_VIRUS_INDICES =
  Object.freeze([0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14] as const);

export const COURSE_G04_L03_GS_002_FEEDBACK = Object.freeze({
  missingSign:
    "You need to choose whether the number is positive or negative.",
  missingNumber: "You need to enter the number in the number field.",
  zeroDistance: "Enter a number from 1 to 14. Zero does not move the ship.",
  lowerBoundary: "The ship can not go any lower.",
  upperBoundary: "The ship can not go any higher.",
} as const);

export const COURSE_G04_L03_GS_002_HELP = Object.freeze([
  "Positive numbers make the space coupe go up.",
  "Negative numbers make the space coupe go down.",
] as const);

/**
 * These durations make the current-JavaScript candidate deterministic and
 * queryable. Movement is informed by the saved child-frame scripts; the short
 * hit feedback is a modern product choice that avoids a silent locked state.
 * Neither duration is an original-runtime trace or audio-synchronization claim.
 */
export const COURSE_G04_L03_GS_002_CURRENT_JS_TIMING = Object.freeze({
  timerTickMs: 1_000,
  movementStepMs: 750,
  hitResolutionMs: 900,
  tieBreak: "timer-before-gameplay" as const,
});

export const COURSE_G04_L03_GS_002_INTERACTION_AUTHORITY = Object.freeze({
  evidenceBasis: "exact-avm1-source-script-and-static-authoring-structure",
  implementationKind: "current-javascript-pure-state-candidate",
  deterministicRandomExecutesAvm1Random: false,
  nominalTimingIsOriginalRuntimeTrace: false,
  audioModeled: false,
  spanishImplemented: false,
  glossaryHostImplemented: false,
  terminalFrameReachabilityEstablished: false,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  strictAcceptanceEffect: "none",
});

const UINT32_RANGE = 4_294_967_296;
const MULBERRY32_INCREMENT = 0x6d2b79f5;
const TIMER_EPSILON_MS = 0.000_001;

const normalizeSeed = (seed: number): number =>
  Number.isSafeInteger(seed) ? seed >>> 0 : 0;

const freezeState = (
  state: CourseG04L03Gs002InteractionState,
): CourseG04L03Gs002InteractionState => Object.freeze(state);

const nextCurrentJsRandom = (
  rngState: number,
): Readonly<{rngState: number; value: number}> => {
  const nextState = (rngState + MULBERRY32_INCREMENT) >>> 0;
  let value = nextState;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

  return Object.freeze({
    rngState: nextState,
    value: ((value ^ (value >>> 14)) >>> 0) / UINT32_RANGE,
  });
};

const sourceTimerDisplay = (minutes: number, seconds: number): string =>
  `00:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

const expireGame = (
  state: CourseG04L03Gs002InteractionState,
): CourseG04L03Gs002InteractionState => freezeState({
  ...state,
  mode: "expired",
  feedbackText: null,
  movementDirection: null,
  plannedTargetIndex: null,
  remainingMoveCount: 0,
  activityAccumulatorMs: 0,
});

const applyTimerTick = (
  state: CourseG04L03Gs002InteractionState,
): CourseG04L03Gs002InteractionState => {
  if (
    state.mode === "expired"
    || state.mode === "help"
    || state.mode === "feedback"
  ) return state;

  const remainingSeconds = Math.max(
    0,
    state.timerMinutes * 60 + state.timerSeconds - 1,
  );
  const next = freezeState({
    ...state,
    timerDisplay: sourceTimerDisplay(
      Math.floor(remainingSeconds / 60),
      remainingSeconds % 60,
    ),
    timerMinutes: Math.floor(remainingSeconds / 60),
    timerSeconds: remainingSeconds % 60,
    timerTickCount: state.timerTickCount + 1,
  });
  return remainingSeconds === 0 ? expireGame(next) : next;
};

const drawNextVirus = (
  state: CourseG04L03Gs002InteractionState,
): CourseG04L03Gs002InteractionState => {
  const candidates = COURSE_G04_L03_GS_002_VIRUS_Y
    .map((_, index) => index)
    .filter((index) => index !== state.shipIndex);
  const random = nextCurrentJsRandom(state.rngState);
  const selected = candidates[Math.floor(random.value * candidates.length)];

  if (selected === undefined) {
    throw new Error("GS002 current-JS virus pool is empty");
  }

  return freezeState({
    ...state,
    rngState: random.rngState,
    drawCount: state.drawCount + 1,
    virusIndex: selected,
    mode: "ready",
    activityAccumulatorMs: 0,
  });
};

const applyMovementStep = (
  state: CourseG04L03Gs002InteractionState,
): CourseG04L03Gs002InteractionState => {
  if (
    state.mode !== "moving"
    || state.movementDirection === null
    || state.plannedTargetIndex === null
  ) {
    return state;
  }

  const shipIndex = state.shipIndex
    + (state.movementDirection === "+" ? -1 : 1);
  const remainingMoveCount = state.remainingMoveCount - 1;

  if (remainingMoveCount > 0) {
    return freezeState({
      ...state,
      shipIndex,
      remainingMoveCount,
      activityAccumulatorMs: 0,
    });
  }

  const hit = state.plannedTargetIndex === state.virusIndex;
  return freezeState({
    ...state,
    shipIndex,
    sign: null,
    distanceInput: "",
    score: state.score + (hit ? 1 : 0),
    mode: hit ? "hit-resolving" : "ready",
    movementDirection: null,
    plannedTargetIndex: null,
    remainingMoveCount: 0,
    activityAccumulatorMs: 0,
  });
};

const applyResolveHit = (
  state: CourseG04L03Gs002InteractionState,
): CourseG04L03Gs002InteractionState =>
  state.mode === "hit-resolving" ? drawNextVirus(state) : state;

const withElapsedAccumulators = (
  state: CourseG04L03Gs002InteractionState,
  elapsedMs: number,
): CourseG04L03Gs002InteractionState => freezeState({
  ...state,
  timerAccumulatorMs: state.timerAccumulatorMs + elapsedMs,
  activityAccumulatorMs:
    state.mode === "moving" || state.mode === "hit-resolving"
      ? state.activityAccumulatorMs + elapsedMs
      : 0,
});

const activityEventMs = (
  state: CourseG04L03Gs002InteractionState,
): number => {
  if (state.mode === "moving") {
    return COURSE_G04_L03_GS_002_CURRENT_JS_TIMING.movementStepMs;
  }
  if (state.mode === "hit-resolving") {
    return COURSE_G04_L03_GS_002_CURRENT_JS_TIMING.hitResolutionMs;
  }
  return Number.POSITIVE_INFINITY;
};

const advanceTime = (
  state: CourseG04L03Gs002InteractionState,
  elapsedMs: number,
): CourseG04L03Gs002InteractionState => {
  if (
    !Number.isFinite(elapsedMs)
    || elapsedMs <= 0
    || state.mode === "expired"
    || state.mode === "help"
    || state.mode === "feedback"
  ) {
    return state;
  }

  let current = state;
  let remainingMs = elapsedMs;
  let eventGuard = 0;

  while (
    remainingMs > TIMER_EPSILON_MS
    && current.mode !== "expired"
  ) {
    eventGuard += 1;
    if (eventGuard > 2_000) {
      throw new Error("GS002 current-JS elapsed-time event guard exceeded");
    }

    const untilTimer = Math.max(
      0,
      COURSE_G04_L03_GS_002_CURRENT_JS_TIMING.timerTickMs
        - current.timerAccumulatorMs,
    );
    const activityMs = activityEventMs(current);
    const untilActivity = Number.isFinite(activityMs)
      ? Math.max(0, activityMs - current.activityAccumulatorMs)
      : Number.POSITIVE_INFINITY;
    const stepMs = Math.min(remainingMs, untilTimer, untilActivity);

    if (stepMs > 0) {
      current = withElapsedAccumulators(current, stepMs);
      remainingMs -= stepMs;
    }

    const timerDue =
      current.timerAccumulatorMs + TIMER_EPSILON_MS
      >= COURSE_G04_L03_GS_002_CURRENT_JS_TIMING.timerTickMs;
    const currentActivityMs = activityEventMs(current);
    const activityDue = Number.isFinite(currentActivityMs)
      && current.activityAccumulatorMs + TIMER_EPSILON_MS
        >= currentActivityMs;

    if (!timerDue && !activityDue) break;

    // The saved scripts do not prove ordering when independent child events
    // land on the same host instant. This explicit current-JS policy remains
    // acceptance-neutral and deterministic.
    if (timerDue) {
      current = freezeState({
        ...current,
        timerAccumulatorMs: Math.max(
          0,
          current.timerAccumulatorMs
            - COURSE_G04_L03_GS_002_CURRENT_JS_TIMING.timerTickMs,
        ),
      });
      current = applyTimerTick(current);
      if (current.mode === "expired") break;
    }

    if (activityDue) {
      current = freezeState({...current, activityAccumulatorMs: 0});
      current = current.mode === "moving"
        ? applyMovementStep(current)
        : applyResolveHit(current);
    }
  }

  return current;
};

export const courseG04L03Gs002ValueAtIndex = (index: number): number =>
  7 - index;

export const formatCourseG04L03Gs002Position = (index: number): string => {
  const value = courseG04L03Gs002ValueAtIndex(index);
  return value > 0 ? `+${value}` : String(value);
};

export const createCourseG04L03Gs002InteractionState = (
  seed = 0,
): CourseG04L03Gs002InteractionState => {
  const normalizedSeed = normalizeSeed(seed);
  const initialVirusIndex =
    COURSE_G04_L03_GS_002_ALLOWED_INITIAL_VIRUS_INDICES[
      normalizedSeed
        % COURSE_G04_L03_GS_002_ALLOWED_INITIAL_VIRUS_INDICES.length
    ];

  if (initialVirusIndex === undefined) {
    throw new Error("GS002 source-bound initial virus pool is empty");
  }

  return freezeState({
    seed: normalizedSeed,
    rngState: normalizedSeed,
    drawCount: 1,
    initialVirusIndex,
    shipIndex: 7,
    virusIndex: initialVirusIndex,
    sign: null,
    distanceInput: "",
    score: 0,
    timerMinutes: 4,
    timerSeconds: 0,
    timerDisplay: "00:04:00",
    timerTickCount: 0,
    timerAccumulatorMs: 0,
    activityAccumulatorMs: 0,
    mode: "ready",
    feedbackText: null,
    movementDirection: null,
    plannedTargetIndex: null,
    remainingMoveCount: 0,
  });
};

export const reduceCourseG04L03Gs002Interaction = (
  state: CourseG04L03Gs002InteractionState,
  action: CourseG04L03Gs002InteractionAction,
): CourseG04L03Gs002InteractionState => {
  switch (action.type) {
    case "set-sign":
      return state.mode === "ready"
        ? freezeState({...state, sign: action.sign})
        : state;

    case "set-distance":
      return state.mode === "ready"
        ? freezeState({
            ...state,
            distanceInput: action.value.replace(/\D/g, "").slice(0, 2),
          })
        : state;

    case "submit-move": {
      if (state.mode !== "ready") return state;
      if (state.sign === null) {
        return freezeState({
          ...state,
          mode: "feedback",
          feedbackText: COURSE_G04_L03_GS_002_FEEDBACK.missingSign,
        });
      }
      if (state.distanceInput === "") {
        return freezeState({
          ...state,
          mode: "feedback",
          feedbackText: COURSE_G04_L03_GS_002_FEEDBACK.missingNumber,
        });
      }

      const distance = Number(state.distanceInput);
      if (distance === 0) {
        return freezeState({
          ...state,
          mode: "feedback",
          feedbackText: COURSE_G04_L03_GS_002_FEEDBACK.zeroDistance,
        });
      }
      const plannedTargetIndex = state.shipIndex
        + (state.sign === "+" ? -distance : distance);
      if (plannedTargetIndex > 14) {
        return freezeState({
          ...state,
          mode: "feedback",
          feedbackText: COURSE_G04_L03_GS_002_FEEDBACK.lowerBoundary,
        });
      }
      if (plannedTargetIndex < 0) {
        return freezeState({
          ...state,
          mode: "feedback",
          feedbackText: COURSE_G04_L03_GS_002_FEEDBACK.upperBoundary,
        });
      }

      return freezeState({
        ...state,
        mode: "moving",
        feedbackText: null,
        movementDirection: state.sign,
        plannedTargetIndex,
        remainingMoveCount: distance,
        activityAccumulatorMs: 0,
      });
    }

    case "close-feedback":
      return state.mode === "feedback"
        ? freezeState({...state, mode: "ready", feedbackText: null})
        : state;

    case "open-help":
      return state.mode === "ready"
        ? freezeState({...state, mode: "help"})
        : state;

    case "close-help":
      return state.mode === "help"
        ? freezeState({...state, mode: "ready"})
        : state;

    case "movement-step":
      return applyMovementStep(state);

    case "resolve-hit":
      return applyResolveHit(state);

    case "timer-tick":
      return applyTimerTick(state);

    case "advance-time":
      return advanceTime(state, action.elapsedMs);

    case "new-game": {
      const random = nextCurrentJsRandom(state.rngState);
      const initialVirusIndex =
        COURSE_G04_L03_GS_002_ALLOWED_INITIAL_VIRUS_INDICES[
          Math.floor(
            random.value
              * COURSE_G04_L03_GS_002_ALLOWED_INITIAL_VIRUS_INDICES.length,
          )
        ];
      if (initialVirusIndex === undefined) {
        throw new Error("GS002 current-JS new-game target is unavailable");
      }
      return freezeState({
        ...createCourseG04L03Gs002InteractionState(state.seed),
        rngState: random.rngState,
        drawCount: state.drawCount + 1,
        initialVirusIndex,
        virusIndex: initialVirusIndex,
      });
    }

    case "replay":
      return createCourseG04L03Gs002InteractionState(action.seed ?? state.seed);
  }
};
