/** ALG001 L6 P042 source-bound behavior. No renderer, clock, or audio transport runs here. */
export const P042_SOURCE = Object.freeze({
  animationId: 'shared-alg001-l06-p042',
  swfSha256: '7df2077da472138df83a4485c0e15b7f3b1063aefcdcf2e3ded9232c98f68fcb',
  lessonXmlSha256: '9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c',
  sourcePinsSha256: 'f67bface0163136baf849e6b5a9947735ca22e5e12bd7d53c5d5d25c54e4c9ad',
  mainSprite: 341,
  quizFrame: 279,
  resumeFrame: 280,
  lastFrame: 400,
  wrongFeedbackSprite: 292,
  wrongHoldFrame: 22,
  wrongCloseButton: 285,
  wrongCloseJump: 23,
  wrongTerminalFrame: 31,
  rightFeedbackSprite: 239,
  rightTerminalFrame: 25,
} as const);

export const P042_CHOICES = Object.freeze({
  A: {instance: 'AnsBtn2', value: -3, buttonId: 171, kind: 'right'},
  B: {instance: 'AnsBtn1', value: 3, buttonId: 169, kind: 'wrong'},
  C: {instance: 'AnsBtn3', value: 10, buttonId: 170, kind: 'wrong'},
  D: {instance: 'AnsBtn4', value: 25, buttonId: 170, kind: 'wrong'},
} as const);

export const P042_GLOSSARY = Object.freeze({
  135: 'Substitute', 136: 'Input', 137: 'Value', 140: 'Simplify',
  141: 'Expression', 142: 'Calculate', 143: 'Output',
  152: 'Output', 153: 'Function', 154: 'Input',
} as const);

export type P042Choice = keyof typeof P042_CHOICES;
export type P042GlossaryButton = keyof typeof P042_GLOSSARY;
export type P042FeedbackKind = 'wrong' | 'right';
export type P042Phase = 'prequiz' | 'quiz-held' | 'nmh-popup' |
  'wrong-feedback-playing' | 'wrong-feedback-held' | 'wrong-feedback-tail' |
  'right-feedback-playing' | 'postquiz' | 'engineering-end-held' |
  'host-glossary' | 'left';

export interface P042Feedback {
  readonly spriteId: 292 | 239;
  readonly kind: P042FeedbackKind;
  readonly frame: number;
  readonly token: string;
}

/** The modern glossary dialog returns to this held page state without autoplay. */
export interface P042GlossaryReturn {
  readonly phase:'prequiz'|'quiz-held'|'nmh-popup'|'postquiz';
  readonly mainPlaying:boolean;
  readonly quizButtonsEnabled:boolean;
  readonly nmhButtonEnabled:boolean;
  readonly nmhPopupVisible:boolean;
}

export interface P042State {
  readonly epoch: number;
  readonly phase: P042Phase;
  readonly mainFrame: number;
  readonly mainPlaying: boolean;
  readonly quizSection: boolean;
  /** Wrong terminal increments; right terminal deliberately preserves this value. */
  readonly quizTryCount: 0 | 1;
  /** Invalidates late clicks after first wrong feedback returns to the quiz. */
  readonly quizGeneration: number;
  readonly selectionSerial: number;
  readonly selected: P042Choice | null;
  readonly wrongFeedText: string | null;
  readonly feedback: P042Feedback | null;
  readonly quizButtonsEnabled: boolean;
  readonly nmhButtonEnabled: boolean;
  readonly nmhPopupVisible: boolean;
  readonly wrongFeedbackPopupVisible: boolean;
  readonly glossaryTerm: string | null;
  readonly glossaryReturn:P042GlossaryReturn|null;
  readonly audioOwner: string | null;
  readonly sourceToAudioAlignment: 'unresolved';
  readonly lessonCompleted: false;
}

export type P042Effect =
  | {readonly type: 'timeline:seekPlay'; readonly frame: number}
  | {readonly type: 'timeline:stop'; readonly frame: number}
  | {readonly type: 'feedback:seekPlay'; readonly spriteId: 292 | 239; readonly frame: number;
      readonly token: string; readonly wrongText?: string}
  | {readonly type: 'feedback:stop'; readonly spriteId: 292; readonly frame: 22}
  | {readonly type: 'feedback:reset'; readonly spriteId: 292 | 239; readonly frame: 1}
  | {readonly type: 'answerClips:reset'; readonly instances: readonly ['AnsBtn1', 'AnsBtn2', 'AnsBtn3', 'AnsBtn4']; readonly frame: 1}
  | {readonly type: 'host:enableQuizButton'}
  | {readonly type: 'host:disableQuizButton'}
  | {readonly type: 'host:DoHyperLinks'; readonly keyAttribute: string}
  | {readonly type: 'host:cleanup'}
  | {readonly type: 'stage:reset'}
  | {readonly type: 'audio:cancelAll'}
  | {readonly type: 'audio:intent'; readonly owner: string};

/** Every event carries the page run epoch; callbacks also carry their feedback token. */
export type P042Event =
  | {readonly type: 'start-main'; readonly epoch: number}
  | {readonly type: 'advance-main'; readonly epoch: number; readonly frame: number}
  | {readonly type: 'choose'; readonly epoch: number; readonly quizGeneration: number; readonly choice: P042Choice}
  | {readonly type: 'open-nmh'; readonly epoch: number; readonly quizGeneration: number}
  | {readonly type: 'close-nmh'; readonly epoch: number; readonly quizGeneration: number}
  | {readonly type: 'glossary'; readonly epoch: number; readonly quizGeneration: number; readonly buttonId: P042GlossaryButton}
  | {readonly type: 'close-glossary'; readonly epoch: number; readonly quizGeneration: number}
  | {readonly type: 'advance-feedback'; readonly epoch: number; readonly token: string; readonly frame: number}
  | {readonly type: 'close-wrong'; readonly epoch: number; readonly token: string}
  | {readonly type: 'audio-complete'; readonly epoch: number; readonly owner: string}
  | {readonly type: 'replay'; readonly epoch: number}
  | {readonly type: 'leave'; readonly epoch: number};

export interface P042Transition {
  readonly accepted: boolean;
  readonly reason: string;
  readonly state: P042State;
  readonly effects: readonly P042Effect[];
}

const WRONG_TEXT = 'Substitute –2 for x in the equation.';
const ANSWER_INSTANCES = ['AnsBtn1', 'AnsBtn2', 'AnsBtn3', 'AnsBtn4'] as const;
const NMH_GLOSSARY = new Set<P042GlossaryButton>([135, 136, 137, 140, 141, 142, 143]);
const MAIN_GLOSSARY = new Set<P042GlossaryButton>([152, 153, 154]);

export function p042InitialState(epoch = 0): P042State {
  if (!Number.isSafeInteger(epoch) || epoch < 0) throw new RangeError('P042_INVALID_EPOCH');
  return {
    epoch, phase: 'prequiz', mainFrame: 1, mainPlaying: false,
    quizSection: false, quizTryCount: 0, quizGeneration: 0, selectionSerial: 0,
    selected: null, wrongFeedText: null, feedback: null,
    quizButtonsEnabled: false, nmhButtonEnabled: false,
    nmhPopupVisible: false, wrongFeedbackPopupVisible: false,
    glossaryTerm: null, glossaryReturn:null, audioOwner: null,
    sourceToAudioAlignment: 'unresolved', lessonCompleted: false,
  };
}

function reject(state: P042State, reason: string): P042Transition {
  return {accepted: false, reason, state, effects: []};
}

function accept(state: P042State, reason: string, effects: readonly P042Effect[] = []): P042Transition {
  return {accepted: true, reason, state, effects};
}

function validFrame(frame: number, max: number): boolean {
  return Number.isSafeInteger(frame) && frame >= 1 && frame <= max;
}

/** Source-frame observations are supplied by a future host; this reducer owns no timer. */
export function p042Reduce(state: P042State, event: P042Event): P042Transition {
  if (event.epoch !== state.epoch) return reject(state, 'stale run epoch');
  if (state.phase === 'left') return reject(state, 'page already left');

  if (event.type === 'replay') {
    return accept(p042InitialState(state.epoch + 1), 'Replay invalidates current run', [
      {type: 'audio:cancelAll'}, {type: 'stage:reset'},
    ]);
  }
  if (event.type === 'leave') {
    return accept({...p042InitialState(state.epoch + 1), phase: 'left'}, 'navigation invalidates current run', [
      {type: 'audio:cancelAll'}, {type: 'stage:reset'}, {type: 'host:cleanup'},
    ]);
  }
  if (event.type === 'audio-complete') {
    if (!event.owner || event.owner !== state.audioOwner) return reject(state, 'stale audio owner');
    return accept({...state, audioOwner: null}, 'current audio owner completed');
  }

  switch (event.type) {
    case 'start-main': {
      if (state.phase !== 'prequiz' || state.mainPlaying) return reject(state, 'main start unavailable');
      const owner = `main:${state.epoch}:1`;
      return accept({...state, mainPlaying: true, audioOwner: owner}, 'host starts main source observer', [
        {type: 'timeline:seekPlay', frame: 1}, {type: 'audio:intent', owner},
      ]);
    }
    case 'advance-main': {
      if (!validFrame(event.frame, P042_SOURCE.lastFrame)) return reject(state, 'invalid main frame');
      if (!state.mainPlaying || event.frame <= state.mainFrame) return reject(state, 'main held or non-increasing frame');
      if (state.phase === 'prequiz') {
        if (event.frame >= P042_SOURCE.quizFrame) {
          return accept({...state, phase: 'quiz-held', mainFrame: 279, mainPlaying: false,
            quizSection: true, quizTryCount: 0, quizGeneration: state.quizGeneration + 1,
            selected: null, wrongFeedText: null, feedback: null,
            quizButtonsEnabled: true, nmhButtonEnabled: true,
            nmhPopupVisible: false, wrongFeedbackPopupVisible: false, audioOwner: null},
          'sprite 341 holds at 279 and resets quiz', [
            {type: 'timeline:stop', frame: 279}, {type: 'audio:cancelAll'},
            {type: 'host:enableQuizButton'},
          ]);
        }
        return accept({...state, mainFrame: event.frame}, 'observed prequiz source frame');
      }
      if (state.phase !== 'postquiz' || event.frame < 280) return reject(state, 'main frame outside continuation');
      if (event.frame >= P042_SOURCE.lastFrame) {
        return accept({...state, phase: 'engineering-end-held', mainFrame: 400,
          mainPlaying: false, audioOwner: null}, 'sprite 341 stops at 400, no lesson completion claim', [
            {type: 'timeline:stop', frame: 400}, {type: 'audio:cancelAll'},
          ]);
      }
      return accept({...state, mainFrame: event.frame, quizSection: false}, 'observed postquiz source frame');
    }
    case 'choose': {
      if (state.phase !== 'quiz-held' || !state.quizButtonsEnabled ||
          event.quizGeneration !== state.quizGeneration ||
          !Object.prototype.hasOwnProperty.call(P042_CHOICES, event.choice))
        return reject(state, 'answer unavailable or stale quiz generation');
      const choice = P042_CHOICES[event.choice];
      const token = `${state.epoch}:${state.selectionSerial + 1}`;
      const wrong = choice.kind === 'wrong';
      const wrongText = wrong ? WRONG_TEXT + (state.quizTryCount === 1 ? '' :
        choice.buttonId === 170 ? '  Try again.' : ' Try again.') : null;
      const owner = `feedback:${token}`;
      return accept({...state,
        phase: wrong ? 'wrong-feedback-playing' : 'right-feedback-playing',
        selectionSerial: state.selectionSerial + 1, selected: event.choice,
        wrongFeedText: wrongText, feedback: {spriteId: wrong ? 292 : 239,
          kind: choice.kind, frame: 2, token},
        quizButtonsEnabled: false, nmhButtonEnabled: false,
        audioOwner: owner}, 'source answer begins feedback sprite at 2', [
          {type: 'host:disableQuizButton'}, {type: 'audio:cancelAll'},
          {type: 'feedback:seekPlay', spriteId: wrong ? 292 : 239,
            frame: 2, token, ...(wrongText ? {wrongText} : {})},
          {type: 'audio:intent', owner},
        ]);
    }
    case 'open-nmh': {
      if (state.phase !== 'quiz-held' || !state.nmhButtonEnabled ||
          event.quizGeneration !== state.quizGeneration) return reject(state, 'NMH unavailable');
      return accept({...state, phase: 'nmh-popup', nmhButtonEnabled: false,
        quizButtonsEnabled: false, nmhPopupVisible: true}, 'button 146 opens NMH popup', [
          {type: 'host:disableQuizButton'},
        ]);
    }
    case 'close-nmh': {
      if (state.phase !== 'nmh-popup' || event.quizGeneration !== state.quizGeneration)
        return reject(state, 'NMH Close unavailable');
      return accept({...state, phase: 'quiz-held', nmhButtonEnabled: true,
        quizButtonsEnabled: true, nmhPopupVisible: false}, 'button 181 closes NMH popup', [
          {type: 'host:enableQuizButton'},
        ]);
    }
    case 'glossary': {
      const term = P042_GLOSSARY[event.buttonId];
      if (!term || event.quizGeneration !== state.quizGeneration)
        return reject(state, 'glossary button absent or stale generation');
      const nmhReachable = NMH_GLOSSARY.has(event.buttonId) &&
        state.phase === 'nmh-popup' && state.nmhPopupVisible;
      const mainReachable = MAIN_GLOSSARY.has(event.buttonId) &&
        (state.phase === 'prequiz' || state.phase === 'quiz-held' || state.phase === 'postquiz') &&
        state.mainFrame >= 2 && !state.nmhPopupVisible;
      if (!nmhReachable && !mainReachable) return reject(state, 'glossary button not reachable');
      const glossaryReturn:P042GlossaryReturn={
        phase:state.phase as P042GlossaryReturn['phase'],
        mainPlaying:state.mainPlaying,
        quizButtonsEnabled:state.quizButtonsEnabled,
        nmhButtonEnabled:state.nmhButtonEnabled,
        nmhPopupVisible:state.nmhPopupVisible,
      };
      return accept({...state, phase: 'host-glossary', mainPlaying: false,
        quizButtonsEnabled: false, glossaryTerm: term, glossaryReturn,
        audioOwner: null},
      'source KeyAttribute and DoHyperLinks hand off to host', [
        {type: 'audio:cancelAll'}, {type: 'timeline:stop', frame: state.mainFrame},
        {type: 'host:DoHyperLinks', keyAttribute: term},
      ]);
    }
    case 'close-glossary': {
      const previous=state.glossaryReturn;
      if(state.phase!=='host-glossary'||!previous||
        event.quizGeneration!==state.quizGeneration)
        return reject(state,'glossary return unavailable or stale');
      return accept({...state,phase:previous.phase,
        mainPlaying:previous.mainPlaying,
        quizButtonsEnabled:previous.quizButtonsEnabled,
        nmhButtonEnabled:previous.nmhButtonEnabled,
        nmhPopupVisible:previous.nmhPopupVisible,
        glossaryTerm:null,glossaryReturn:null,audioOwner:null},
      'modern host returns to the held source page; audio remains stopped');
    }
    case 'advance-feedback': {
      const feedback = state.feedback;
      if (!feedback || feedback.token !== event.token) return reject(state, 'stale feedback token');
      const max = feedback.kind === 'wrong' ? 31 : 25;
      if (!validFrame(event.frame, max) || event.frame <= feedback.frame)
        return reject(state, 'invalid or non-increasing feedback frame');
      if (state.phase === 'wrong-feedback-playing') {
        if (event.frame >= 22) {
          return accept({...state, phase: 'wrong-feedback-held',
            feedback: {...feedback, frame: 22}, wrongFeedbackPopupVisible: true,
            audioOwner: null}, 'sprite 292 stops at 22; nested Close required', [
              {type: 'feedback:stop', spriteId: 292, frame: 22}, {type: 'audio:cancelAll'},
            ]);
        }
        return accept({...state, feedback: {...feedback, frame: event.frame}}, 'observed wrong feedback head frame');
      }
      if (state.phase === 'wrong-feedback-tail') {
        if (event.frame >= 31) {
          const second = state.quizTryCount === 1;
          const owner = second ? `main:${state.epoch}:${state.selectionSerial + 1}` : null;
          const effects: P042Effect[] = [{type: 'audio:cancelAll'}];
          // Source transiently enables quiz before resuming after a second wrong.
          // The modern host suppresses that extra clickable interval.
          if (!second) effects.push({type: 'host:enableQuizButton'});
          effects.push({type: 'feedback:reset', spriteId: 292, frame: 1});
          if (second) effects.push({type: 'timeline:seekPlay', frame: 280},
            {type: 'audio:intent', owner: owner!});
          return accept({...state, phase: second ? 'postquiz' : 'quiz-held',
            mainFrame: second ? 280 : 279, mainPlaying: second,
            quizSection: !second, quizTryCount: second ? 0 : 1,
            quizGeneration: second ? state.quizGeneration : state.quizGeneration + 1,
            feedback: null, wrongFeedText: null, wrongFeedbackPopupVisible: false,
            quizButtonsEnabled: !second, nmhButtonEnabled: !second,
            audioOwner: owner},
          second ? 'second wrong terminal clears quiz and resumes at 280' :
            'first wrong terminal permits retry at 279', effects);
        }
        return accept({...state, feedback: {...feedback, frame: event.frame}}, 'observed wrong feedback tail frame');
      }
      if (state.phase === 'right-feedback-playing') {
        if (event.frame >= 25) {
          const owner = `main:${state.epoch}:${state.selectionSerial + 1}`;
          return accept({...state, phase: 'postquiz', mainFrame: 280,
            mainPlaying: true, quizSection: false,
            // Sprite 239 has no quizTryCount reset, even after one prior wrong.
            feedback: null, quizButtonsEnabled: false, nmhButtonEnabled: false,
            audioOwner: owner}, 'right terminal resumes parent without count reset', [
              {type: 'audio:cancelAll'}, {type: 'host:disableQuizButton'},
              {type: 'timeline:seekPlay', frame: 280},
              {type: 'feedback:reset', spriteId: 239, frame: 1},
              {type: 'audio:intent', owner},
            ]);
        }
        return accept({...state, feedback: {...feedback, frame: event.frame}}, 'observed right feedback frame');
      }
      return reject(state, 'feedback held or wrong phase');
    }
    case 'close-wrong': {
      const feedback = state.feedback;
      if (!feedback || feedback.kind !== 'wrong' || feedback.token !== event.token ||
          state.phase !== 'wrong-feedback-held' || feedback.frame !== 22)
        return reject(state, 'nested wrong feedback Close unavailable');
      const owner = `feedbackTail:${event.token}`;
      return accept({...state, phase: 'wrong-feedback-tail',
        feedback: {...feedback, frame: 23}, wrongFeedbackPopupVisible: false,
        audioOwner: owner}, 'button 285 resumes feedback parent at 23 and resets four answer clips', [
          {type: 'feedback:seekPlay', spriteId: 292, frame: 23, token: event.token},
          {type: 'answerClips:reset', instances: ANSWER_INSTANCES, frame: 1},
          {type: 'audio:intent', owner},
        ]);
    }
  }
}
