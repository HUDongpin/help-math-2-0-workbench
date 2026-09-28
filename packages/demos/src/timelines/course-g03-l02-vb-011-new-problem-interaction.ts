import {COURSE_G03_L02_VB_011_SOURCE} from "./course-g03-l02-vb-011";

// DefineSprite_65 frame 166 initializes the paired Q1..Q5 / Mc_1..Mc_5 pool.
// The arithmetic and frames below come from its XML display lists and font maps.
export const COURSE_G03_L02_VB_011_PROBLEMS = Object.freeze([
  Object.freeze({id: "Q1", frame: 167, minuend: 9, subtrahend: 6, difference: 3}),
  Object.freeze({id: "Q2", frame: 168, minuend: 7, subtrahend: 6, difference: 1}),
  Object.freeze({id: "Q3", frame: 169, minuend: 6, subtrahend: 6, difference: 0}),
  Object.freeze({id: "Q4", frame: 170, minuend: 5, subtrahend: 4, difference: 1}),
  Object.freeze({id: "Q5", frame: 171, minuend: 4, subtrahend: 2, difference: 2}),
] as const);
export type CourseG03L02Vb011ProblemId =
  (typeof COURSE_G03_L02_VB_011_PROBLEMS)[number]["id"];

export const COURSE_G03_L02_VB_011_NEW_PROBLEM_SOURCE = Object.freeze({
  animationId: "course-g03-l02-vb-011",
  sourceSwfSha256: COURSE_G03_L02_VB_011_SOURCE.swfSha256,
  frameDomain: "sprite-65", introStopFrame: 166, frameCount: 171,
  functionName: "doGetRandomQuiz", sourceButtonIds: Object.freeze([20, 34]),
  instanceName: "BtnNewProblem", selection: "random-without-replacement-five-item-pool",
  nativeButtonBounds: Object.freeze({x: 590.95, y: 407, width: 128.1, height: 23.6}),
  sourceAudioAccepted: false, originalRuntimeAccepted: false,
  strictMigrationComplete: false, published: false,
});

export interface CourseG03L02Vb011NewProblemState {
  readonly sourceFrame: number;
  readonly selectedProblemId: CourseG03L02Vb011ProblemId | null;
  readonly remaining: readonly CourseG03L02Vb011ProblemId[];
  readonly drawCount: number;
  readonly seed: number;
  readonly randomState: number;
}
export type CourseG03L02Vb011NewProblemEvent =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{type: "new-problem"}>
  | Readonly<{type: "replay"; seed?: number}>;

function exactFrame(frame: number) {
  if (!Number.isInteger(frame) || frame < 1 || frame > 171) {
    throw new Error(`invalid VB011 source frame: ${frame}`);
  }
  return frame;
}
function normalizeSeed(seed: number) {
  if (!Number.isFinite(seed)) throw new Error("VB011 seed must be finite");
  return Math.trunc(seed) >>> 0;
}
const fullPool = () => COURSE_G03_L02_VB_011_PROBLEMS.map(({id}) => id);
const freeze = (state: CourseG03L02Vb011NewProblemState) => Object.freeze({
  ...state, remaining: Object.freeze([...state.remaining]),
});

export function createCourseG03L02Vb011NewProblemState(frame = 1, seed = 0):
CourseG03L02Vb011NewProblemState {
  const normalizedSeed = normalizeSeed(seed);
  return freeze({sourceFrame: Math.min(exactFrame(frame), 166),
    selectedProblemId: null, remaining: fullPool(), drawCount: 0,
    seed: normalizedSeed, randomState: normalizedSeed});
}

export function getCourseG03L02Vb011SelectedProblem(state: CourseG03L02Vb011NewProblemState) {
  return COURSE_G03_L02_VB_011_PROBLEMS.find(({id}) => id === state.selectedProblemId) ?? null;
}

export function reduceCourseG03L02Vb011NewProblem(
  state: CourseG03L02Vb011NewProblemState,
  event: CourseG03L02Vb011NewProblemEvent,
): CourseG03L02Vb011NewProblemState {
  switch (event.type) {
    case "synchronize-frame": {
      const frame = exactFrame(event.frame);
      // gotoAndStop(Qn) holds the chosen problem independently of the host clock.
      if (state.selectedProblemId) return state;
      const sourceFrame = Math.min(frame, 166);
      return sourceFrame === state.sourceFrame ? state : freeze({...state, sourceFrame});
    }
    case "new-problem": {
      if (state.sourceFrame < 166) return state;
      const pool = state.remaining.length ? state.remaining : fullPool();
      // A deterministic PRNG replaces Flash random(n); no legacy global is run.
      const randomState = (state.randomState + 0x6d2b79f5) >>> 0;
      let value = Math.imul(randomState ^ (randomState >>> 15), randomState | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      const fraction = ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
      const index = Math.floor(fraction * pool.length);
      const selectedProblemId = pool[index];
      const problem = COURSE_G03_L02_VB_011_PROBLEMS.find(({id}) => id === selectedProblemId)!;
      return freeze({...state, sourceFrame: problem.frame, selectedProblemId,
        remaining: pool.filter((_, position) => position !== index),
        drawCount: state.drawCount + 1, randomState});
    }
    case "replay": return createCourseG03L02Vb011NewProblemState(1, event.seed ?? state.seed);
    default: return event satisfies never;
  }
}
