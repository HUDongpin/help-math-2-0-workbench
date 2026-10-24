import { ALG_L08_P038_BEHAVIOR as S } from './alg-l08-p038-behavior-source-v1';
export { ALG_L08_P038_BEHAVIOR } from './alg-l08-p038-behavior-source-v1';
export type P038PointName = typeof S.points[number]['name'];
export type P038Term = typeof S.glossaryTerms[number];
export interface P038Point { readonly x: number; readonly y: number; }
export interface P038FixedPoint { readonly name: P038PointName; readonly visible: boolean; readonly enabled: boolean; readonly frame: 1 | 2; }
export interface P038Clone extends P038Point {
  readonly name: `Mc_${number}`; readonly depth: number; readonly visible: boolean; readonly enabled: boolean;
  readonly requestedFrame: 1 | 2; readonly renderedFrame: 1;
}
export interface P038Line {
  readonly from: P038Point; readonly to: P038Point; readonly visible: boolean;
  readonly depth: 1001; readonly widthPixels: 3; readonly rgb: 255; readonly alphaPercent: 100;
}
export interface P038WrongCloseEffects {
  readonly attempt: number; readonly sourceHiddenFixed: readonly P038PointName[];
  readonly sourceRemovedClones: readonly string[]; readonly sourceRemovedLine: boolean;
  readonly modernRestoredFixed: readonly P038PointName[];
}
export interface P038State {
  readonly epoch: number; readonly replay: number; readonly cycle: 0; readonly rootFrame: 6;
  readonly phase: 'prequiz' | 'quiz-held' | 'postquiz' | 'ended' | 'left';
  readonly mainFrame: number; readonly playing: boolean; readonly mainRunning: boolean;
  readonly quizSection: boolean; readonly quizTryCount: number; readonly mcCount: number;
  readonly Y: string; readonly C: string; readonly firstPoint: boolean;
  readonly controlsEnabled: boolean; readonly fixed: readonly P038FixedPoint[];
  readonly clones: readonly P038Clone[]; readonly line: P038Line | null;
  readonly hint: string | null; readonly wrong: string | null; readonly help: boolean;
  readonly glossary: P038Term | null; readonly lastDynamicLookupNoops: readonly string[];
  readonly wrongCloseEffects: readonly P038WrongCloseEffects[]; readonly lessonCompleted: false;
}
export type P038Event = { readonly epoch: number } & (
  | { readonly type: 'play' | 'pause' | 'replay' | 'leave' | 'submit' | 'open-help' | 'close-help' | 'close-hint' | 'close-wrong' | 'close-glossary' }
  | { readonly type: 'advance-main'; readonly frame: number }
  | { readonly type: 'named-point'; readonly name: P038PointName }
  | { readonly type: 'background-point'; readonly point: P038Point }
  | { readonly type: 'clone-point'; readonly name: string }
  | { readonly type: 'open-glossary'; readonly term: P038Term }
);
const names = S.points.map(point => point.name);
export function p038InitialState(epoch = 0, replay = 0): P038State {
  return {
    epoch, replay, cycle: 0, rootFrame: 6, phase: 'prequiz', mainFrame: 1, playing: false, mainRunning: true,
    quizSection: false, quizTryCount: 0, mcCount: 100, Y: '', C: '', firstPoint: false, controlsEnabled: false,
    fixed: names.map(name => ({ name, visible: false, enabled: true, frame: 1 })), clones: [], line: null,
    hint: null, wrong: null, help: false, glossary: null, lastDynamicLookupNoops: [], wrongCloseEffects: [], lessonCompleted: false,
  };
}
/** Exact source string predicate. The Draw Line callback guards empty Y/C first. */
export function p038SourceAcceptsName(value: string): boolean { return S.literalAcceptedPointNames.indexOf(value) !== -1; }
export function p038CanInteract(state: P038State): boolean {
  return state.phase !== 'left' && state.mainFrame === S.quizFrame && state.controlsEnabled && !state.help && !state.hint && !state.wrong && !state.glossary;
}
export function p038CanPlay(state: P038State): boolean {
  return state.phase !== 'left' && state.mainRunning && !state.playing && !state.glossary;
}
function setSourceEnabled(state: P038State, enabled: boolean): P038State {
  // Source addresses point_mc101 etc, while actual clones are Mc_101 etc. The lookup is a no-op.
  const lastDynamicLookupNoops = Array.from({ length: state.mcCount - 100 }, (_, index) => `point_mc${index + 101}`);
  return { ...state, controlsEnabled: enabled && state.mainFrame === S.quizFrame, fixed: state.fixed.map(point => ({ ...point, enabled })), lastDynamicLookupNoops };
}
function openHint(state: P038State, hint: string): P038State { return { ...setSourceEnabled(state, false), hint }; }
function location(state: P038State, name: string): P038Point {
  const point = S.points.find(point => point.name === name) ?? state.clones.find(point => point.name === name);
  if (!point) throw new Error('P038_SOURCE_POINT_MISSING');
  return { x: point.x, y: point.y };
}
function hideSourcePointsAndLine(state: P038State): P038State {
  return { ...state, fixed: state.fixed.map(point => ({ ...point, visible: false })), clones: state.clones.map(point => ({ ...point, visible: false })), line: state.line ? { ...state.line, visible: false } : null };
}
/** Modern transport and modal locking surround the source-specific callback transitions. */
export function p038Reduce(state: P038State, event: P038Event): P038State {
  if (event.epoch !== state.epoch || state.phase === 'left') return state;
  if (event.type === 'leave') return { ...p038InitialState(state.epoch + 1, state.replay), phase: 'left', mainRunning: false };
  if (event.type === 'replay') return p038InitialState(state.epoch + 1, state.replay + 1);
  if (event.type === 'pause') return state.playing ? { ...state, playing: false } : state;
  if (event.type === 'play') return p038CanPlay(state) ? { ...state, playing: true } : state;
  if (event.type === 'advance-main') {
    if (!state.playing || !state.mainRunning || state.glossary || !Number.isSafeInteger(event.frame) || event.frame <= state.mainFrame || event.frame > S.mainFrames) return state;
    const frame = state.phase === 'prequiz' ? Math.min(event.frame, S.quizFrame) : event.frame;
    if (frame < S.quizFrame) return { ...state, mainFrame: frame };
    if (state.phase === 'prequiz' && frame === S.quizFrame) return {
      ...state, phase: 'quiz-held', mainFrame: frame, mainRunning: false, playing: false, controlsEnabled: true, quizSection: true,
      fixed: state.fixed.map(point => ({ ...point, visible: true })),
    };
    // At209 the source removes quiz buttons and three popup placements; fixed sprites and runtime line persist.
    const terminal = frame === S.mainFrames;
    return { ...state, mainFrame: frame, phase: terminal ? 'ended' : 'postquiz', mainRunning: !terminal, playing: !terminal, controlsEnabled: false, hint: null, wrong: null, help: false };
  }
  if (event.type === 'named-point') {
    const target = state.fixed.find(point => point.name === event.name);
    if (!p038CanInteract(state) || !target?.visible || !target.enabled) return state;
    if (state.Y && state.C) return openHint(state, S.messages.fullFixed);
    return { ...state, [event.name === 'PT_1' ? 'Y' : 'C']: event.name, fixed: state.fixed.map(point => point.name === event.name ? { ...point, enabled: false, frame: 2 } : point) };
  }
  if (event.type === 'background-point') {
    if (!p038CanInteract(state) || !Number.isFinite(event.point.x) || !Number.isFinite(event.point.y)) return state;
    if (state.Y && state.C) return openHint(state, S.messages.fullBackground);
    const count = state.mcCount + 1, name = `Mc_${count}` as const;
    return { ...state, mcCount: count, [state.Y ? 'C' : 'Y']: name, clones: [...state.clones, { ...event.point, name, depth: S.dynamicPoint.depthBase + count, visible: true, enabled: true, requestedFrame: 1, renderedFrame: 1 }] };
  }
  if (event.type === 'clone-point') {
    const target = state.clones.find(point => point.name === event.name);
    if (!p038CanInteract(state) || !target?.visible || !target.enabled) return state;
    return { ...state, firstPoint: true, clones: state.clones.map(point => point.name === event.name ? { ...point, enabled: false, requestedFrame: 2, renderedFrame: 1 } : point) };
  }
  if (event.type === 'submit') {
    if (!p038CanInteract(state)) return state;
    if (!state.Y || !state.C) return openHint(state, S.messages.incomplete);
    let Y = state.Y, C = state.C;
    if (Y === 'PT_1' && p038SourceAcceptsName(C)) { Y = S.correctEndpointRewrite.Y; C = S.correctEndpointRewrite.C; }
    const line: P038Line = { from: location(state, C), to: location(state, Y), visible: true, depth: 1001, widthPixels: 3, rgb: 255, alphaPercent: 100 };
    if (p038SourceAcceptsName(Y) && p038SourceAcceptsName(C)) {
      const next = hideSourcePointsAndLine({ ...state, Y, C, line });
      // No feedback clip, timer, attempt reset or button disable exists in this source success path.
      return { ...next, line: { ...line, visible: true }, quizSection: false, mainRunning: true, playing: true, phase: 'postquiz' };
    }
    const count = state.quizTryCount + 1;
    return { ...setSourceEnabled(state, false), Y: '', C: '', line, quizTryCount: count, wrong: count === 1 ? S.messages.wrongFirst : S.messages.wrongLater };
  }
  if (event.type === 'close-wrong') {
    if (!state.wrong || state.glossary) return state;
    const hidden = hideSourcePointsAndLine(setSourceEnabled(state, true));
    const removedLine = state.mcCount >= S.dynamicPoint.firstCounter;
    const restored: readonly P038PointName[] = state.quizTryCount === 1 ? names : [];
    const effect: P038WrongCloseEffects = {
      attempt: state.quizTryCount, sourceHiddenFixed: names, sourceRemovedClones: state.clones.map(point => point.name),
      sourceRemovedLine: removedLine && state.line !== null, modernRestoredFixed: restored,
    };
    // The reviewed first-attempt repair changes visibility only after the original close effects.
    const next: P038State = {
      ...hidden, wrong: null, clones: [], line: removedLine ? null : hidden.line,
      fixed: hidden.fixed.map(point => ({ ...point, visible: restored.includes(point.name) })),
      wrongCloseEffects: [...state.wrongCloseEffects, effect],
    };
    return state.quizTryCount >= 2 ? { ...next, quizSection: false, mainRunning: true, playing: true, phase: 'postquiz' } : next;
  }
  if (event.type === 'open-help') return p038CanInteract(state) ? { ...setSourceEnabled(state, false), help: true } : state;
  if (event.type === 'close-help') return state.help && !state.glossary ? { ...setSourceEnabled(state, true), help: false } : state;
  if (event.type === 'close-hint') return state.hint && !state.glossary ? { ...setSourceEnabled(state, true), hint: null } : state;
  if (event.type === 'open-glossary') return !state.glossary && S.glossaryTerms.some(term => term === event.term) ? { ...state, glossary: event.term, playing: false } : state;
  if (event.type === 'close-glossary') return state.glossary ? { ...state, glossary: null } : state;
  return state;
}
