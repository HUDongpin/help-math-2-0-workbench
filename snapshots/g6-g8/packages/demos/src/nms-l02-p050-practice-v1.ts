/** Source-bound drag semantics; UI coordinates and audio clocks are separate. */
export const P050_ITEMS = Object.freeze([
  {id: 1, decimal: '0.8', tenths: 8},
  {id: 2, decimal: '1.5', tenths: 15},
  {id: 3, decimal: '2.7', tenths: 27},
  {id: 4, decimal: '3.1', tenths: 31},
  {id: 5, decimal: '0.2', tenths: 2},
] as const);
export type P050Phase = 'intro' | 'ready' | 'correct-feedback' | 'wrong-feedback' | 'completion-feedback' | 'outro' | 'complete';
export interface P050State {
  phase: P050Phase;
  solved: readonly number[];
  helpOpen: boolean;
  activeItem: number | null;
  replay: number;
  token: number;
}
export type P050Event =
  | {type: 'replay'}
  | {type: 'finish'; token: number}
  | {type: 'drop'; item: number; target: number | null}
  | {type: 'help'; open: boolean}
  | {type: 'close-wrong'};
export function p050Initial(): P050State {
  return {phase: 'intro', solved: [], helpOpen: false, activeItem: null, replay: 0, token: 0};
}
export function p050Reduce(state: P050State, event: P050Event): P050State {
  if (event.type === 'replay') return {...p050Initial(), replay: state.replay + 1, token: state.token + 1};
  const change = (patch: Partial<P050State>): P050State => ({...state, ...patch, token: state.token + 1});
  if (event.type === 'help') {
    if (state.phase !== 'ready' || state.helpOpen === event.open) return state;
    return change({helpOpen: event.open});
  }
  if (event.type === 'close-wrong') return state.phase === 'wrong-feedback'
    ? change({phase: 'ready', activeItem: null}) : state;
  if (event.type === 'drop') {
    if (state.phase !== 'ready' || state.helpOpen || !P050_ITEMS.some(x => x.id === event.item) || state.solved.includes(event.item)) return state;
    return event.item === event.target
      ? change({phase: 'correct-feedback', solved: [...state.solved, event.item], activeItem: event.item})
      : change({phase: 'wrong-feedback', activeItem: event.item});
  }
  if (event.token !== state.token || state.helpOpen) return state;
  switch (state.phase) {
    case 'intro': return change({phase: 'ready'});
    case 'correct-feedback': return change({phase: state.solved.length === 5 ? 'completion-feedback' : 'ready', activeItem: null});
    case 'completion-feedback': return change({phase: 'outro'});
    case 'outro': return change({phase: 'complete'});
    // Source wrong popup waits for its close button even when its sound ends.
    default: return state;
  }
}
