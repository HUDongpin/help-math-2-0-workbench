/** P046 source-owned five-cell matching. Coach clips have independent clocks;
 * only a new event for the same coach replaces that coach's generation. */
export const P046_SOURCE = Object.freeze({
  animationId: 'shared-alg001-l06-p046',
  swfSha256: 'c69f1f0fdaff0201af171aaee6b9b90a33b483e8c93ffef406c31cf0853a54b8',
  modelSha256: '0ab3cce9ece208aae74dd0a8ecc380c2fe1a6c2ea19a4d4ce0cc8ab816f7d682',
  fps: 12, rootFrames: 10, mainSprite: 123, quizFrame: 163,
  resumeFrame: 164, endFrame: 743, wrongCoach: 61, rightCoach: 63,
  coachStart: 2, coachEnd: 20, completionCount: 5,
} as const);

export type P046Id = 1 | 2 | 3 | 4 | 5;
export type P046CoachKind = 'wrong' | 'right';
export type P046Coach = Readonly<{frame: number; token: number; playing: boolean}>;
export const P046_VALUES = Object.freeze({1: '–3', 2: '–8', 3: '0', 4: '4', 5: '6'});
export const P046_GLOSSARY = Object.freeze({
  15: 'Input', 16: 'Output', 17: 'Function', 18: 'Table',
  80: 'Variable', 81: 'Value', 82: 'Solve', 83: 'Substitute', 84: 'Equation',
});

export type P046State = Readonly<{
  epoch: number;
  phase: 'intro' | 'quiz' | 'explanation' | 'end' | 'left';
  mainFrame: number;
  mainPlaying: boolean;
  quizSection: boolean;
  placements: Readonly<Partial<Record<P046Id, true>>>;
  quizDragCount: number;
  selection: Readonly<{id: P046Id; token: number}> | null;
  serial: number;
  tryAgainVisible: boolean;
  coaches: Readonly<Record<P046CoachKind, P046Coach | null>>;
  nmhVisible: boolean;
  glossary: Readonly<{buttonId: number; term: string}> | null;
  spanishSelected: boolean;
  suspended: boolean;
  lessonCompleted: false;
}>;
type Epoch = {epoch: number};
export type P046Event = Epoch & (
  | {type: 'play' | 'pause' | 'replay' | 'leave' | 'open-nmh' | 'close-nmh' |
      'close-glossary' | 'spanish' | 'return-spanish'}
  | {type: 'advance-main'; frame: number}
  | {type: 'pick'; id: P046Id}
  | {type: 'drop'; id: P046Id; target: P046Id | null; token: number}
  | {type: 'cancel-drag'; token: number}
  | {type: 'advance-coach'; kind: P046CoachKind; frame: number; token: number}
  | {type: 'glossary'; buttonId: number}
);
export type P046Effect =
  | {type: 'audio:pauseAll' | 'audio:cancelAll' | 'audio:pauseMain' |
      'audio:cancelCoaches' | 'audio:explicitSpanish' | 'audio:resumeSpanish' | 'host:cleanup'}
  | {type: 'main:play'; frame: number}
  | {type: 'coach:play'; kind: P046CoachKind; frame: number; token: number}
  | {type: 'coach:stop'; kind: P046CoachKind; token: number}
  | {type: 'host:DoHyperLinks'; term: string}
  | {type: 'legacy:unboundCall'; name: 'showRightFeed' | 'showWrongFeed' | 'enableButton'};
export type P046Transition = Readonly<{
  accepted: boolean; reason: string; state: P046State; effects: readonly P046Effect[];
}>;

export function initialP046State(epoch = 0): P046State {
  if (!Number.isSafeInteger(epoch) || epoch < 0) throw new RangeError('P046_INVALID_EPOCH');
  return {epoch, phase: 'intro', mainFrame: 1, mainPlaying: false, quizSection: false,
    placements: {}, quizDragCount: 0, selection: null, serial: 0, tryAgainVisible: false,
    coaches: {wrong: null, right: null}, nmhVisible: false, glossary: null,
    spanishSelected: false, suspended: false, lessonCompleted: false};
}
const validId = (id: unknown): id is P046Id =>
  typeof id === 'number' && Number.isInteger(id) && id >= 1 && id <= 5;
const accept = (state: P046State, reason: string, effects: P046Effect[] = []): P046Transition =>
  ({accepted: true, reason, state, effects});
const reject = (state: P046State, reason: string): P046Transition =>
  ({accepted: false, reason, state, effects: []});
const canInteract = (s: P046State) => s.phase === 'quiz' && !s.nmhVisible &&
  !s.glossary && !s.spanishSelected && !s.suspended;
const heldCoaches = (s: P046State): P046State['coaches'] => {
  const hold = (coach: P046Coach | null) => coach ? {...coach, playing: false, token: s.serial + 1} : null;
  return {wrong: hold(s.coaches.wrong), right: hold(s.coaches.right)};
};

export function reduceP046(state: P046State, event: P046Event): P046Transition {
  if (event.epoch !== state.epoch) return reject(state, 'stale run');
  if (state.phase === 'left') return reject(state, 'page left');
  switch (event.type) {
    case 'replay':
      return accept(initialP046State(state.epoch + 1), 'Replay retires every callback', [{type: 'audio:cancelAll'}]);
    case 'leave':
      return accept({...initialP046State(state.epoch + 1), phase: 'left'}, 'navigation cleanup',
        [{type: 'audio:cancelAll'}, {type: 'host:cleanup'}]);
    case 'play': {
      if (state.glossary) return reject(state, 'Play unavailable');
      if (state.spanishSelected) return accept({...state,suspended:false},
        'explicit Play resumes only the selected Spanish stream',[{type:'audio:resumeSpanish'}]);
      if (state.phase === 'end') return reject(state, 'Play unavailable');
      const mainPlaying = state.phase === 'intro' || state.phase === 'explanation';
      const effects: P046Effect[] = mainPlaying ? [{type: 'main:play', frame: state.mainFrame}] : [];
      const coaches = {...state.coaches};
      for (const kind of ['wrong', 'right'] as const) {
        const coach = state.coaches[kind];
        if (coach && !coach.playing && coach.frame >= 2 && coach.frame < 20) {
          effects.push({type: 'coach:play', kind, frame: coach.frame, token: coach.token});
          coaches[kind] = {...coach, playing: true};
        }
      }
      if (state.mainPlaying && !state.suspended) return reject(state, 'already playing');
      return accept({...state, mainPlaying, coaches, suspended: false}, 'resume permitted clocks without crossing unanswered quiz', effects);
    }
    case 'pause':
      return accept({...state, mainPlaying: false, suspended: true, selection: null,
        coaches: heldCoaches(state), serial: state.serial + 1}, 'hold all current clocks', [{type: 'audio:pauseAll'}]);
    case 'advance-main': {
      if (!Number.isInteger(event.frame) || event.frame <= state.mainFrame || event.frame > 743 ||
          !state.mainPlaying || state.suspended || state.spanishSelected || state.glossary)
        return reject(state, 'main held or invalid frame');
      if (state.phase === 'intro' && event.frame >= 163) {
        return accept({...state, phase: 'quiz', mainFrame: 163, mainPlaying: false,
          quizSection: true, quizDragCount: 0, placements: {}, selection: null,
          tryAgainVisible: false, coaches: {wrong: null, right: null}, nmhVisible: false},
        'source main stops at163 and resets the five-place quiz', [{type: 'audio:pauseMain'}]);
      }
      if (state.phase !== 'intro' && state.phase !== 'explanation') return reject(state, 'main phase unavailable');
      const leavingQuiz = state.mainFrame === 163;
      const terminal = event.frame === 743;
      const effects: P046Effect[] = leavingQuiz ? [{type: 'audio:cancelCoaches'}] : [];
      if (terminal) effects.push({type: 'audio:pauseAll'});
      return accept({...state, mainFrame: event.frame,
        phase: terminal ? 'end' : state.phase, mainPlaying: !terminal,
        ...(leavingQuiz ? {coaches: {wrong: null, right: null}, nmhVisible: false, selection: null,
          tryAgainVisible: false} : {})}, 'observed source main frame', effects);
    }
    case 'pick': {
      if (!canInteract(state) || !validId(event.id) || state.placements[event.id]) return reject(state, 'source unavailable');
      const serial = state.serial + 1;
      return accept({...state, selection: {id: event.id, token: serial}, serial, tryAgainVisible: false},
        'source press stores its origin and hides Try again');
    }
    case 'cancel-drag':
      if (!state.selection || event.token !== state.selection.token) return reject(state, 'stale drag');
      return accept({...state, selection: null}, 'modern pointer cancellation restores the source without a scored drop');
    case 'drop': {
      if (!canInteract(state) || !validId(event.id) || (event.target !== null && !validId(event.target)) ||
          state.placements[event.id] || state.selection?.id !== event.id || state.selection.token !== event.token)
        return reject(state, 'source or drop token unavailable');
      const correct = event.id === event.target;
      const kind = correct ? 'right' : 'wrong';
      const token = state.serial + 1;
      return accept({...state, serial: token, selection: null,
        placements: correct ? {...state.placements, [event.id]: true} : state.placements,
        quizDragCount: state.quizDragCount + (correct ? 1 : 0), tryAgainVisible: !correct,
        coaches: {...state.coaches, [kind]: {frame: 2, token, playing: true}}},
      correct ? 'snap and lock only this source' : 'restore this source and show Try again', [
        {type: 'legacy:unboundCall', name: correct ? 'showRightFeed' : 'showWrongFeed'},
        {type: 'coach:play', kind, frame: 2, token},
      ]);
    }
    case 'advance-coach': {
      const coach = state.coaches[event.kind];
      if (!coach?.playing || coach.token !== event.token || !Number.isInteger(event.frame) ||
          event.frame <= coach.frame || event.frame > 20 || state.suspended || state.spanishSelected || state.glossary)
        return reject(state, 'stale or held coach clock');
      if (event.frame < 20)
        return accept({...state, coaches: {...state.coaches, [event.kind]: {...coach, frame: event.frame}}}, 'coach progresses independently');
      const finished = event.kind === 'right' && state.quizDragCount >= 5;
      const effects: P046Effect[] = [{type: 'legacy:unboundCall', name: 'enableButton'},
        {type: 'coach:stop', kind: event.kind, token: coach.token}];
      if (finished) effects.push({type: 'main:play', frame: 163});
      return accept({...state,
        coaches: {...state.coaches, [event.kind]: {...coach, frame: 1, playing: false}},
        ...(finished ? {phase: 'explanation', mainPlaying: true, quizSection: false, selection: null} : {})},
      finished ? 'fifth match resumes main only at right coach20' : 'coach20 returns to stopped frame1', effects);
    }
    case 'open-nmh':
      if (!canInteract(state)) return reject(state, 'help unavailable');
      return accept({...state, nmhVisible: true, selection: null}, 'static source popup85 opens; coach clips keep their clocks');
    case 'close-nmh':
      if (!state.nmhVisible || state.glossary || state.spanishSelected) return reject(state, 'help Close unavailable');
      return accept({...state, nmhVisible: false}, 'Close74 hides its owning popup');
    case 'glossary': {
      const term = (P046_GLOSSARY as Readonly<Record<number, string>>)[event.buttonId];
      const reachable = state.nmhVisible ? [15, 16, 80, 81, 82, 83, 84].includes(event.buttonId)
        : [15, 16, 17, 18].includes(event.buttonId);
      if (!term || !reachable || state.glossary || state.spanishSelected) return reject(state, 'glossary unavailable');
      return accept({...state, mainPlaying: false, suspended: true, selection: null,
        coaches: heldCoaches(state), serial: state.serial + 1,
        glossary: {buttonId: event.buttonId, term}}, 'source glossary host call; host holds audio',
      [{type: 'audio:pauseAll'}, {type: 'host:DoHyperLinks', term}]);
    }
    case 'close-glossary':
      if (!state.glossary) return reject(state, 'glossary not open');
      return accept({...state, glossary: null, suspended: false, mainPlaying: false},
        'return to retained help/table; main remains held until explicit Play');
    case 'spanish':
      if (state.spanishSelected || state.glossary) return reject(state, 'Spanish transfer unavailable');
      return accept({...state, spanishSelected: true, suspended: true, mainPlaying: false, selection: null,
        coaches: heldCoaches(state), serial: state.serial + 1},
        'explicit separate SA trigger', [{type: 'audio:pauseAll'}, {type: 'audio:explicitSpanish'}]);
    case 'return-spanish':
      if (!state.spanishSelected) return reject(state, 'Spanish not selected');
      return accept({...state, spanishSelected: false, suspended: false, mainPlaying: false},
        'SA return retains placement state and holds main', [{type: 'audio:pauseAll'}]);
  }
}
