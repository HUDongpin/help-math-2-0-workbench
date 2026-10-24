/** ALG001 L12 P012: stopped sprite-86 frame 119 interaction only.
 * Source: VB/L12VB07.swf, SHA-256 b322949a960acef3fee6018a65785b29cd3693717ca3ba33d0d930d7866320aa.
 * This pure state is an engineering candidate; it does not execute AVM1,
 * decode coach audio, or establish original-runtime behavior parity. */
export const P012_SOURCE = Object.freeze({
  animationId: 'shared-alg001-l12-p012',
  swfSha256: 'b322949a960acef3fee6018a65785b29cd3693717ca3ba33d0d930d7866320aa',
  mainTimeline: 'sprite-86',
  interactiveFrame: 119,
  fps: 12,
  coordinateLimit: 10,
  pixelsPerCoordinate: 14,
  pixelsPerTick: 2,
  spiderOrigin: Object.freeze({x: 133.8, y: 19.1}), // McSpider frame-102 matrix (2676,382) twips.
  dotOrigin: Object.freeze({x: 133.7, y: 18.85}), // Mc_Dot1 frame-119 (2674,377) twips.
  bubbleOrigin: Object.freeze({x: 135.1, y: -11.8}), // mcOP frame-119 (2702,-236) twips.
} as const);

export const P012_MOVES = Object.freeze({
  MoveBtn1: Object.freeze({path: 'Top1', axis: 'y', delta: 1, pixelSign: -1, buttonCharacter: 80}),
  MoveBtn2: Object.freeze({path: 'Top3', axis: 'y', delta: 3, pixelSign: -1, buttonCharacter: 81}),
  MoveBtn3: Object.freeze({path: 'Bottom1', axis: 'y', delta: -1, pixelSign: 1, buttonCharacter: 82}),
  MoveBtn4: Object.freeze({path: 'Bottom3', axis: 'y', delta: -3, pixelSign: 1, buttonCharacter: 83}),
  MoveBtn5: Object.freeze({path: 'Left1', axis: 'x', delta: -1, pixelSign: -1, buttonCharacter: 84}),
  MoveBtn6: Object.freeze({path: 'Left3', axis: 'x', delta: -3, pixelSign: -1, buttonCharacter: 85}),
  MoveBtn7: Object.freeze({path: 'Right1', axis: 'x', delta: 1, pixelSign: 1, buttonCharacter: 78}),
  MoveBtn8: Object.freeze({path: 'Right3', axis: 'x', delta: 3, pixelSign: 1, buttonCharacter: 79}),
} as const);

export type P012Button = keyof typeof P012_MOVES;
export type P012Path = (typeof P012_MOVES)[P012Button]['path'];
export type P012CoachLabel = 'S1' | 'S2' | 'S3' | 'S4';
export type P012Point = Readonly<{x: number; y: number}>;
export type P012Phase = 'idle' | 'moving' | 'completion' | 'left';

export const P012_COACH_BRANCHES = Object.freeze([
  Object.freeze({label: 'S1', firstFrame: 3, returnFrame: 16}),
  Object.freeze({label: 'S2', firstFrame: 18, returnFrame: 27}),
  Object.freeze({label: 'S3', firstFrame: 31, returnFrame: 36}),
  Object.freeze({label: 'S4', firstFrame: 40, returnFrame: 54}),
] as const);

interface P012Press {
  readonly button: P012Button;
  readonly originPixel: number;
  readonly originCoordinate: number;
}

interface P012Move {
  readonly button: P012Button;
  readonly path: P012Path;
  readonly originPixel: number;
  readonly targetPixel: number;
  readonly displacementTicks: number;
}

export interface P012State {
  /** Modern Replay seed; source random(4) has no reproducible seed contract. */
  readonly initialSeed: number;
  readonly randomState: number;
  /** Source-authored local sprite-86 pixel origin, retained for Replay. */
  readonly origin: P012Point;
  readonly x: number;
  readonly y: number;
  readonly spider: Readonly<P012Point & {rotation: 0 | 90 | 180 | 270}>;
  readonly dot: P012Point;
  readonly bubble: P012Point;
  readonly coordinateText: string;
  readonly phase: P012Phase;
  readonly pressed: P012Press | null;
  readonly move: P012Move | null;
  readonly popup: Readonly<{visible: boolean; frame: 1 | 2}>;
  readonly coach: Readonly<{label: P012CoachLabel | null; lastLabel: P012CoachLabel | null; frame: number; playing: boolean}>;
  readonly paused: boolean;
  readonly controlsEnabled: boolean;
}

type P012SimpleActionKind = 'tick' | 'coach-tick' | 'close-popup' |
  'cancel-press' | 'pause' | 'resume' | 'navigation';

export type P012Action =
  | Readonly<{kind: 'press' | 'release'; button: P012Button}>
  | {[K in P012SimpleActionKind]: Readonly<{kind: K}>}[P012SimpleActionKind]
  | Readonly<{kind: 'replay'}>;

function normalizeSeed(seed: number): number {
  if (!Number.isSafeInteger(seed)) throw new RangeError('P012 seed must be a safe integer');
  return seed >>> 0;
}

function point(x: number, y: number): P012Point { return {x, y}; }

function finish(state: Omit<P012State, 'controlsEnabled'>): P012State {
  return {
    ...state,
    controlsEnabled: state.phase === 'idle' && state.pressed === null &&
      !state.popup.visible && !state.paused,
  };
}

/** The first source idle onEnterFrame will move dot and bubble exactly onto
 * spider and update the read-only coordinate text. Initial placements remain
 * separate because their source matrices differ by a few twips. */
export function initialP012State(seed = 0): P012State {
  const initialSeed = normalizeSeed(seed);
  const origin = point(P012_SOURCE.spiderOrigin.x, P012_SOURCE.spiderOrigin.y);
  return finish({
    initialSeed, randomState: initialSeed, origin,
    x: 0, y: 0, spider: {...origin, rotation: 0},
    dot: point(P012_SOURCE.dotOrigin.x, P012_SOURCE.dotOrigin.y),
    bubble: point(P012_SOURCE.bubbleOrigin.x, P012_SOURCE.bubbleOrigin.y),
    coordinateText: '(0,0)', phase: 'idle', pressed: null, move: null,
    popup: {visible: false, frame: 1},
    coach: {label: null, lastLabel: null, frame: 1, playing: false},
    paused: false,
  });
}

function directionRotation(path: P012Path): 0 | 90 | 180 | 270 {
  if (path.startsWith('Top')) return 0;
  if (path.startsWith('Right')) return 90;
  if (path.startsWith('Bottom')) return 180;
  return 270;
}

/** This modern state uses 270 degrees for left. The legacy handlers assign
 * 270 but other guards compare -90; AVM1 normalization has not been run. */
function nextCoach(randomState: number) {
  const next = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
  return {randomState: next, branch: P012_COACH_BRANCHES[next % 4]!};
}

/** One tick represents one main onEnterFrame call at the stopped interaction
 * frame. A move takes 7 or 21 displacement ticks, then a completion tick
 * (the source guard sees target reached), then an idle dot/bubble commit. */
export function reduceP012State(state: P012State, action: P012Action): P012State {
  if (action.kind === 'replay') return initialP012State(state.initialSeed);
  if (action.kind === 'navigation') {
    return finish({...initialP012State(state.initialSeed), phase: 'left'});
  }
  if (state.phase === 'left') return state;

  switch (action.kind) {
    case 'cancel-press':
      // Modern pointercancel/blur policy: no release means no coordinate edit.
      return state.pressed ? finish({...state, pressed: null}) : state;
    case 'pause':
      return state.paused ? state : finish({...state, paused: true, pressed: null});
    case 'resume':
      return !state.paused ? state : finish({...state, paused: false});
    case 'press': {
      if (!state.controlsEnabled || !(action.button in P012_MOVES)) return state;
      const spec = P012_MOVES[action.button];
      return finish({...state, pressed: {
        button: action.button,
        originPixel: state.spider[spec.axis],
        originCoordinate: state[spec.axis],
      }});
    }
    case 'release': {
      if (state.paused || !state.pressed || state.pressed.button !== action.button ||
          state.phase !== 'idle' || state.popup.visible || !(action.button in P012_MOVES)) return state;
      const spec = P012_MOVES[action.button];
      const origin = state.pressed;
      const changed = origin.originCoordinate + spec.delta;
      if (changed < -P012_SOURCE.coordinateLimit || changed > P012_SOURCE.coordinateLimit) {
        const {randomState, branch} = nextCoach(state.randomState);
        // The source increments, tests, then restores global temp. No spider,
        // dot, bubble, or read-only text change is committed on rejection.
        return finish({...state, [spec.axis]: origin.originCoordinate,
          pressed: null, move: null, randomState,
          popup: {visible: true, frame: 2},
          coach: {label: branch.label, lastLabel: branch.label,
            frame: branch.firstFrame, playing: true},
        });
      }
      return finish({...state, [spec.axis]: changed, pressed: null,
        spider: {...state.spider, rotation: directionRotation(spec.path)},
        phase: 'moving',
        move: {button: action.button, path: spec.path,
          originPixel: origin.originPixel,
          targetPixel: origin.originPixel + spec.pixelSign *
            Math.abs(spec.delta) * P012_SOURCE.pixelsPerCoordinate,
          displacementTicks: 0},
      });
    }
    case 'tick': {
      if (state.paused) return state;
      if (state.phase === 'moving' && state.move) {
        const spec = P012_MOVES[state.move.button];
        const reached = state.move.displacementTicks >=
          Math.abs(spec.delta) * P012_SOURCE.pixelsPerCoordinate / P012_SOURCE.pixelsPerTick;
        if (reached) return finish({...state, phase: 'completion'});
        const displacementTicks = state.move.displacementTicks + 1;
        return finish({...state, spider: {...state.spider,
          [spec.axis]: state.move.originPixel + spec.pixelSign *
            displacementTicks * P012_SOURCE.pixelsPerTick},
          move: {...state.move, displacementTicks}});
      }
      if (state.phase === 'completion' || state.phase === 'idle') {
        return finish({...state, phase: 'idle', move: null,
          dot: point(state.spider.x, state.spider.y),
          bubble: point(state.spider.x, state.spider.y - 29),
          coordinateText: `(${state.x},${state.y})`,
        });
      }
      return state;
    }
    case 'coach-tick': {
      if (state.paused || !state.coach.playing || !state.coach.label) return state;
      const branch = P012_COACH_BRANCHES.find(item => item.label === state.coach.label)!;
      if (state.coach.frame + 1 >= branch.returnFrame) {
        // The source return-frame DoAction immediately sends the clip to 1.
        // Its undefined page-local _parent.enableButton() is not simulated.
        return finish({...state, coach: {...state.coach, label: null, frame: 1, playing: false}});
      }
      return finish({...state, coach: {...state.coach, frame: state.coach.frame + 1}});
    }
    case 'close-popup':
      if (!state.popup.visible) return state;
      // Modern modal policy: explicit close cancels this coach branch and
      // releases controls. Legacy close hides popup but its sibling eval and
      // audio lifecycle are unresolved; no host enableButton is invoked.
      return finish({...state, popup: {visible: false, frame: 1},
        coach: {...state.coach, label: null, frame: 1, playing: false}});
    default:
      return action satisfies never;
  }
}
