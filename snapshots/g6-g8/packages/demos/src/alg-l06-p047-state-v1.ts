/** P047 source-owned graph/table matching. Two independent 6 cards may
 * occupy either of two visible targets; occupied targets cannot be reused. Coach clips have independent clocks;
 * only a new event for the same coach replaces that coach's generation. */
export const P047_SOURCE = Object.freeze({
  animationId: 'shared-alg001-l06-p047',
  swfSha256: '7fdbb16bcea020b3a28ada7d0bfbed26d077b339a914a86f493feb6827a9e893',
  modelSha256: '5b67c6c758f069a080e300ca3b30db9bdc76eee838fe3c3cde8c38851ae3f1b9',
  fps: 12, rootFrames: 10, mainSprite: 117, quizFrame: 208,
  resumeFrame: 209, endFrame: 889, structuralFrames: 890, wrongCoach: 70, rightCoach: 72,
  coachStart: 2, coachEnd: 20, completionCount: 5,
} as const);

export type P047Id = 1 | 2 | 3 | 4 | 5;
export type P047CoachKind = 'wrong' | 'right';
export type P047Coach = Readonly<{frame: number; token: number; playing: boolean}>;
export const P047_VALUES = Object.freeze({1: '6', 2: '–3', 3: '0', 4: '–4', 5: '6'});
export const P047_GLOSSARY = Object.freeze({
  15:'Input',16:'Output',17:'Point',18:'Function',19:'Table',
  89:'Coordinate',90:'X-coordinate',91:'Y-coordinate',
});

export type P047State = Readonly<{
  epoch: number;
  phase: 'intro' | 'quiz' | 'explanation' | 'end' | 'left';
  mainFrame: number;
  mainPlaying: boolean;
  quizSection: boolean;
  placements: Readonly<Partial<Record<P047Id, P047Id>>>;
  targets: Readonly<Partial<Record<P047Id, P047Id>>>;
  quizDragCount: number;
  selection: Readonly<{id: P047Id; token: number}> | null;
  serial: number;
  tryAgainVisible: boolean;
  coaches: Readonly<Record<P047CoachKind, P047Coach | null>>;
  nmhVisible: boolean;
  glossary: Readonly<{buttonId: number; term: string}> | null;
  spanishSelected: boolean;
  suspended: boolean;
  lessonCompleted: false;
}>;
type Epoch = {epoch: number};
export type P047Event = Epoch & (
  | {type: 'play' | 'pause' | 'replay' | 'leave' | 'open-nmh' | 'close-nmh' |
      'close-glossary' | 'spanish' | 'return-spanish'}
  | {type: 'advance-main'; frame: number}
  | {type: 'pick'; id: P047Id}
  | {type: 'drop'; id: P047Id; target: P047Id | null; token: number}
  | {type: 'cancel-drag'; token: number}
  | {type: 'advance-coach'; kind: P047CoachKind; frame: number; token: number}
  | {type: 'glossary'; buttonId: number}
);
export type P047Effect =
  | {type: 'audio:pauseAll' | 'audio:cancelAll' | 'audio:pauseMain' |
      'audio:cancelCoaches' | 'audio:explicitSpanish' | 'audio:resumeSpanish' | 'host:cleanup'}
  | {type: 'main:play'; frame: number}
  | {type: 'coach:play'; kind: P047CoachKind; frame: number; token: number}
  | {type: 'coach:stop'; kind: P047CoachKind; token: number}
  | {type: 'host:DoHyperLinks'; term: string}
  | {type: 'legacy:unboundCall'; name: 'showRightFeed' | 'showWrongFeed' | 'enableButton'};
export type P047Transition = Readonly<{
  accepted: boolean; reason: string; state: P047State; effects: readonly P047Effect[];
}>;

export function initialP047State(epoch = 0): P047State {
  if (!Number.isSafeInteger(epoch) || epoch < 0) throw new RangeError('P047_INVALID_EPOCH');
  return {epoch, phase: 'intro', mainFrame: 1, mainPlaying: false, quizSection: false,
    placements: {}, targets: {}, quizDragCount: 0, selection: null, serial: 0, tryAgainVisible: false,
    coaches: {wrong: null, right: null}, nmhVisible: false, glossary: null,
    spanishSelected: false, suspended: false, lessonCompleted: false};
}
const validId = (id: unknown): id is P047Id =>
  typeof id === 'number' && Number.isInteger(id) && id >= 1 && id <= 5;
const accept = (state: P047State, reason: string, effects: P047Effect[] = []): P047Transition =>
  ({accepted: true, reason, state, effects});
const reject = (state: P047State, reason: string): P047Transition =>
  ({accepted: false, reason, state, effects: []});
const canInteract = (s: P047State) => s.phase === 'quiz' && !s.nmhVisible &&
  !s.glossary && !s.spanishSelected && !s.suspended;
const heldCoaches = (s: P047State): P047State['coaches'] => {
  const hold = (coach: P047Coach | null) => coach ? {...coach, playing: false, token: s.serial + 1} : null;
  return {wrong: hold(s.coaches.wrong), right: hold(s.coaches.right)};
};

export function reduceP047(state: P047State, event: P047Event): P047Transition {
  if (event.epoch !== state.epoch) return reject(state, 'stale run');
  if (state.phase === 'left') return reject(state, 'page left');
  switch (event.type) {
    case 'replay':
      return accept(initialP047State(state.epoch + 1), 'Replay retires every callback', [{type: 'audio:cancelAll'}]);
    case 'leave':
      return accept({...initialP047State(state.epoch + 1), phase: 'left'}, 'navigation cleanup',
        [{type: 'audio:cancelAll'}, {type: 'host:cleanup'}]);
    case 'play': {
      if (state.glossary) return reject(state, 'Play unavailable');
      if (state.spanishSelected) return accept({...state,suspended:false},
        'explicit Play resumes only the selected Spanish stream',[{type:'audio:resumeSpanish'}]);
      if (state.phase === 'end') return reject(state, 'Play unavailable');
      const mainPlaying = state.phase === 'intro' || state.phase === 'explanation';
      const effects: P047Effect[] = mainPlaying ? [{type: 'main:play', frame: state.mainFrame}] : [];
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
      if (!Number.isInteger(event.frame) || event.frame <= state.mainFrame || event.frame > 889 ||
          !state.mainPlaying || state.suspended || state.spanishSelected || state.glossary)
        return reject(state, 'main held or invalid frame');
      if (state.phase === 'intro' && event.frame >= 208) {
        return accept({...state, phase: 'quiz', mainFrame: 208, mainPlaying: false,
          quizSection: true, quizDragCount: 0, placements: {}, targets: {}, selection: null,
          tryAgainVisible: false, coaches: {wrong: null, right: null}, nmhVisible: false},
        'source main stops at208 and resets the five-place quiz', [{type: 'audio:pauseMain'}]);
      }
      if (state.phase !== 'intro' && state.phase !== 'explanation') return reject(state, 'main phase unavailable');
      const leavingQuiz = state.mainFrame === 208;
      const terminal = event.frame === 889;
      const effects: P047Effect[] = leavingQuiz ? [{type: 'audio:cancelCoaches'}] : [];
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
      const target = event.target;
      const available = target !== null && state.targets[target] === undefined;
      const duplicate = event.id === 1 || event.id === 5;
      const correct = available && (duplicate ? target === 1 || target === 5 : event.id === target);
      const kind = correct ? 'right' : 'wrong';
      const token = state.serial + 1;
      return accept({...state, serial: token, selection: null,
        placements: correct ? {...state.placements, [event.id]: target as P047Id} : state.placements,
        targets: correct ? {...state.targets, [target as P047Id]: event.id} : state.targets,
        quizDragCount: state.quizDragCount + (correct ? 1 : 0), tryAgainVisible: !correct,
        coaches: {...state.coaches, [kind]: {frame: 2, token, playing: true}}},
      correct ? 'snap and lock only this source' : 'restore this source and show Try again', [
        // The duplicate6 handlers deliberately omit the historical wrong call.
        ...((correct || !duplicate) ? [{type:'legacy:unboundCall' as const,
          name:correct ? 'showRightFeed' as const : 'showWrongFeed' as const}] : []),
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
      const effects: P047Effect[] = [{type: 'legacy:unboundCall', name: 'enableButton'},
        {type: 'coach:stop', kind: event.kind, token: coach.token}];
      if (finished) effects.push({type: 'main:play', frame: 208});
      return accept({...state,
        coaches: {...state.coaches, [event.kind]: {...coach, frame: 1, playing: false}},
        ...(finished ? {phase: 'explanation', mainPlaying: true, quizSection: false, selection: null} : {})},
      finished ? 'fifth match resumes main only at right coach20' : 'coach20 returns to stopped frame1', effects);
    }
    case 'open-nmh':
      if (!canInteract(state)) return reject(state, 'help unavailable');
      return accept({...state, nmhVisible: true, selection: null}, 'static source popup92 opens; coach clips keep their clocks');
    case 'close-nmh':
      if (!state.nmhVisible || state.glossary || state.spanishSelected) return reject(state, 'help Close unavailable');
      return accept({...state, nmhVisible: false}, 'Close83 hides its owning popup');
    case 'glossary': {
      const term = (P047_GLOSSARY as Readonly<Record<number, string>>)[event.buttonId];
      const reachable = state.nmhVisible ? [15,16,17,19,89,90,91].includes(event.buttonId)
        : [15,16,17,18,19].includes(event.buttonId);
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
