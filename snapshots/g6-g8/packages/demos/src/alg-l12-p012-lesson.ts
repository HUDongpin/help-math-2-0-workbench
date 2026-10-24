import {initialP012State, reduceP012State, type P012Action, type P012State} from './alg-l12-p012-state';

/** Source root frame 6 owns sprite-86. Its frame 119 stops the timeline but
 * keeps onEnterFrame movement alive. Host pause suspends both clocks. */
export interface P012LessonState {
  readonly rootFrame: 6;
  readonly frame: number;
  readonly phase: 'intro' | 'interaction' | 'left';
  readonly paused: boolean;
  readonly glossaryOpen: boolean;
  readonly replay: number;
  readonly reducedMotion: boolean;
  readonly interaction: P012State;
}
export type P012LessonAction =
  | {readonly kind: 'play' | 'pause' | 'tick' | 'replay' | 'navigation' | 'open-coordinate' | 'close-coordinate'}
  | {readonly kind: 'interaction'; readonly action: P012Action};

export function initialP012Lesson(seed = 0, reducedMotion = false): P012LessonState {
  return {rootFrame: 6, frame: reducedMotion ? 119 : 1,
    phase: reducedMotion ? 'interaction' : 'intro', paused: true,
    glossaryOpen: false, replay: 0, reducedMotion,
    interaction: reduceP012State(initialP012State(seed), {kind: 'pause'})};
}

export function reduceP012Lesson(state: P012LessonState, action: P012LessonAction): P012LessonState {
  if (action.kind === 'replay') return {...initialP012Lesson(state.interaction.initialSeed, state.reducedMotion), replay: state.replay + 1};
  if (action.kind === 'navigation') return {...state, phase: 'left', paused: true,
    glossaryOpen: false, interaction: reduceP012State(state.interaction, {kind: 'navigation'})};
  if (state.phase === 'left') return state;
  switch (action.kind) {
    case 'play':
      if (state.glossaryOpen || !state.paused) return state;
      return {...state, paused: false, interaction: reduceP012State(state.interaction, {kind: 'resume'})};
    case 'pause':
      if (state.paused) return state;
      return {...state, paused: true, interaction: reduceP012State(state.interaction, {kind: 'pause'})};
    case 'open-coordinate':
      if (state.frame < 32) return state;
      // Source button 53 stops animation and asks the host for Coordinate.
      return {...state, glossaryOpen: true, paused: true,
        interaction: reduceP012State(state.interaction, {kind: 'pause'})};
    case 'close-coordinate':
      // Closing remains paused; only an explicit host Play resumes.
      if (!state.glossaryOpen) return state;
      return {...state, glossaryOpen: false};
    case 'tick': {
      if (state.paused || state.glossaryOpen) return state;
      if (state.phase === 'intro') {
        const frame = Math.min(119, state.frame + 1);
        return {...state, frame, phase: frame === 119 ? 'interaction' : 'intro'};
      }
      return {...state, interaction: reduceP012State(
        reduceP012State(state.interaction, {kind: 'tick'}), {kind: 'coach-tick'})};
    }
    case 'interaction':
      if (state.phase !== 'interaction' || state.glossaryOpen) return state;
      if (state.paused && action.action.kind !== 'close-popup' && action.action.kind !== 'cancel-press') return state;
      // Lifecycle belongs to this host bridge, not a nested control.
      if (!['press', 'release', 'cancel-press', 'close-popup'].includes(action.action.kind)) return state;
      return {...state, interaction: reduceP012State(state.interaction, action.action)};
    default: throw new Error('Unsupported P012 lesson action');
  }
}
