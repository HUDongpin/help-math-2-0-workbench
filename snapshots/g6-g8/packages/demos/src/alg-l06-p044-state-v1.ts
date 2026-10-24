// P044 maintained source behavior candidate. An adapter supplies observed frames.
// Effects are intents: this module never plays a stream or calls the lesson host.

export type P044Choice = 'A'|'B'|'C'|'D';
export type P044Feedback = {spriteId:198|336;kind:'right'|'wrong';
  frame:number;token:string};
export type P044State = {
  epoch:number;phase:string;mainFrame:number;mainPlaying:boolean;
  quizSection:boolean;quizTryCount:number;quizGeneration:number;
  selectionSerial:number;selected:P044Choice|null;wrongFeedText:string|null;
  feedback:P044Feedback|null;quizButtonsEnabled:boolean;nmhButtonEnabled:boolean;
  nmhPopupVisible:boolean;wrongFeedbackPopupVisible:boolean;
  glossaryTerm:string|null;glossaryReturn:null|{
    phase:string;mainPlaying:boolean;quizButtonsEnabled:boolean;
    nmhButtonEnabled:boolean;nmhPopupVisible:boolean};
  audioOwner:string|null;sourceToAudioAlignment:'unresolved';
  lessonCompleted:false;
};
export type P044Event = {type:string;epoch:number;frame?:number;
  choice?:P044Choice;quizGeneration?:number;buttonId?:number;
  token?:string;owner?:string};
export type P044Effect = {type:string;[key:string]:unknown};
export type P044Transition = {accepted:boolean;reason:string;state:P044State;
  effects:P044Effect[]};

export const P044_SOURCE = Object.freeze({
  animationId: 'shared-alg001-l06-p044',
  swfSha256: '50952b58f10d24b5d649930817aff9f6b779ebb1f698f14392eda00d8afdec34',
  lessonXmlSha256: '9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c',
  separateSaSha256: '11784e80c090326e9d4f2863ae54d1bcd25d454a4e325d76516f415e377e3abb',
  mainSprite: 354, quizFrame: 53, resumeFrame: 54, lastFrame: 275,
  wrongFeedbackSprite: 336, wrongHoldFrame: 20, wrongCloseButton: 331,
  wrongCloseJump: 21, wrongTerminalFrame: 28,
  rightFeedbackSprite: 198, rightTerminalFrame: 31,
});

export const P044_CHOICES = Object.freeze({
  A: Object.freeze({instance: 'AnsBtn1', text: '{(0, –1), (0, 0), (0, 1)}', buttonId: 161, kind: 'wrong'}),
  B: Object.freeze({instance: 'AnsBtn2', text: '{(5, 1), (10, 1), (15, 1)}', buttonId: 162, kind: 'right'}),
  C: Object.freeze({instance: 'AnsBtn3', text: '{(2, –2), (2, 0), (–2, 0)}', buttonId: 161, kind: 'wrong'}),
  D: Object.freeze({instance: 'AnsBtn4', text: '{(–5, –4), (–4, –3), (–5, –1)}', buttonId: 161, kind: 'wrong'}),
});

export const P044_GLOSSARY = Object.freeze({
  137: 'Relation', 138: 'Set', 139: 'Ordered pair', 140: 'X-coordinate',
  141: 'Function', 149: 'Function', 150: 'Relation',
});

const NMH_GLOSSARY = new Set([137, 138, 139, 140, 141]);
const MAIN_GLOSSARY = new Set([149, 150]);
const ANSWER_INSTANCES = Object.freeze(['AnsBtn1', 'AnsBtn2', 'AnsBtn3', 'AnsBtn4']);
const WRONG_TEXT = 'All the x-coordinates must be different in a function.';

export function initialP044State(epoch = 0):P044State {
  if (!Number.isSafeInteger(epoch) || epoch < 0) throw new RangeError('P044_INVALID_EPOCH');
  return {
    epoch, phase: 'prequiz', mainFrame: 1, mainPlaying: false,
    quizSection: false, quizTryCount: 0, quizGeneration: 0,
    selectionSerial: 0, selected: null, wrongFeedText: null,
    feedback: null, quizButtonsEnabled: false, nmhButtonEnabled: false,
    nmhPopupVisible: false, wrongFeedbackPopupVisible: false,
    glossaryTerm: null, glossaryReturn: null, audioOwner: null,
    sourceToAudioAlignment: 'unresolved', lessonCompleted: false,
  };
}

const reject = (state:P044State, reason:string):P044Transition =>
  ({accepted: false, reason, state, effects: []});
const accept = (state:P044State, reason:string,
  effects:P044Effect[] = []):P044Transition => ({accepted: true, reason, state, effects});
const validFrame = (frame:unknown, max:number):frame is number =>
  typeof frame==='number'&&Number.isSafeInteger(frame)&&frame>=1&&frame<=max;

/** All events require the current run epoch. Choices also require quizGeneration. */
export function reduceP044(state:P044State, event:P044Event):P044Transition {
  if (!state || !event || typeof event.type !== 'string')
    throw new TypeError('P044_STATE_AND_EVENT_REQUIRED');
  if (event.epoch !== state.epoch) return reject(state, 'stale run epoch');
  if (state.phase === 'left') return reject(state, 'page already left');

  if (event.type === 'replay') {
    return accept(initialP044State(state.epoch + 1), 'Replay invalidates the run', [
      {type: 'audio:cancelAll'}, {type: 'stage:reset'},
    ]);
  }
  if (event.type === 'leave') {
    return accept({...initialP044State(state.epoch + 1), phase: 'left'},
      'navigation invalidates the run', [
        {type: 'audio:cancelAll'}, {type: 'stage:reset'}, {type: 'host:cleanup'},
      ]);
  }
  if (event.type === 'audio-complete') {
    if (!event.owner || event.owner !== state.audioOwner)
      return reject(state, 'stale audio owner');
    return accept({...state, audioOwner: null}, 'current audio owner completed');
  }

  switch (event.type) {
    case 'start-main': {
      if (state.phase !== 'prequiz' || state.mainPlaying)
        return reject(state, 'main start unavailable');
      const owner = `main:${state.epoch}:1`;
      return accept({...state, mainPlaying: true, audioOwner: owner},
        'host starts the main source observer', [
          {type: 'timeline:seekPlay', frame: 1}, {type: 'audio:intent', stream: 'main', owner},
        ]);
    }
    case 'advance-main': {
      if (!validFrame(event.frame, P044_SOURCE.lastFrame))
        return reject(state, 'invalid main frame');
      if (!state.mainPlaying || event.frame <= state.mainFrame)
        return reject(state, 'main held or non-increasing frame');
      if (state.phase === 'prequiz') {
        if (event.frame >= P044_SOURCE.quizFrame) {
          return accept({...state, phase: 'quiz-held', mainFrame: 53, mainPlaying: false,
            quizSection: true, quizTryCount: 0, quizGeneration: state.quizGeneration + 1,
            selected: null, wrongFeedText: null, feedback: null,
            quizButtonsEnabled: true, nmhButtonEnabled: true,
            nmhPopupVisible: false, wrongFeedbackPopupVisible: false, audioOwner: null},
          'sprite 354 holds at 53 and resets the quiz', [
            {type: 'timeline:stop', frame: 53}, {type: 'audio:cancelAll'},
            {type: 'host:enableQuizButton'},
          ]);
        }
        return accept({...state, mainFrame: event.frame}, 'observed prequiz frame');
      }
      if (state.phase !== 'postquiz' || event.frame < P044_SOURCE.resumeFrame)
        return reject(state, 'main frame outside continuation');
      if (event.frame >= P044_SOURCE.lastFrame) {
        return accept({...state, phase: 'engineering-end-held', mainFrame: 275,
          mainPlaying: false, audioOwner: null},
        'sprite 354 stops at 275; no lesson completion claim', [
          {type: 'timeline:stop', frame: 275}, {type: 'audio:cancelAll'},
        ]);
      }
      return accept({...state, mainFrame: event.frame, quizSection: false},
        'observed postquiz frame');
    }
    case 'choose': {
      if (state.phase !== 'quiz-held' || !state.quizButtonsEnabled ||
          event.quizGeneration !== state.quizGeneration ||
          !Object.prototype.hasOwnProperty.call(P044_CHOICES, event.choice!))
        return reject(state, 'answer unavailable or stale quiz generation');
      const choice = P044_CHOICES[event.choice as P044Choice];
      const token = `${state.epoch}:${state.selectionSerial + 1}`;
      const wrong = choice.kind === 'wrong';
      const wrongText = wrong ? WRONG_TEXT + (state.quizTryCount === 1 ? '' : ' Try again.') : null;
      const owner = `feedback:${token}`;
      return accept({...state, phase: wrong ? 'wrong-feedback-playing' : 'right-feedback-playing',
        selectionSerial: state.selectionSerial + 1, selected: event.choice!,
        wrongFeedText: wrongText, feedback: {
          spriteId: wrong ? 336 : 198, kind: choice.kind, frame: 2, token,
        }, quizButtonsEnabled: false, nmhButtonEnabled: false, audioOwner: owner},
      'source answer starts feedback4 at frame 2', [
        {type: 'host:disableQuizButton'}, {type: 'audio:cancelAll'},
        {type: 'feedback:seekPlay', spriteId: wrong ? 336 : 198, frame: 2,
          token, ...(wrongText ? {wrongText} : {})},
        {type: 'audio:intent', stream: wrong ? 'wrong4' : 'right4', owner},
      ]);
    }
    case 'open-nmh': {
      if (state.phase !== 'quiz-held' || !state.nmhButtonEnabled ||
          event.quizGeneration !== state.quizGeneration)
        return reject(state, 'NMH unavailable');
      return accept({...state, phase: 'nmh-popup', nmhButtonEnabled: false,
        quizButtonsEnabled: false, nmhPopupVisible: true},
      'button 143 opens NMH popup', [{type: 'host:disableQuizButton'}]);
    }
    case 'close-nmh': {
      if (state.phase !== 'nmh-popup' || event.quizGeneration !== state.quizGeneration)
        return reject(state, 'NMH Close unavailable');
      return accept({...state, phase: 'quiz-held', nmhButtonEnabled: true,
        quizButtonsEnabled: true, nmhPopupVisible: false},
      'button 172 closes NMH popup', [{type: 'host:enableQuizButton'}]);
    }
    case 'glossary': {
      const term = (P044_GLOSSARY as Readonly<Record<number,string>>)[event.buttonId!];
      if (!term || event.quizGeneration !== state.quizGeneration)
        return reject(state, 'glossary button absent or stale generation');
      const onPopup = NMH_GLOSSARY.has(event.buttonId!) &&
        state.phase === 'nmh-popup' && state.nmhPopupVisible;
      const onMain = MAIN_GLOSSARY.has(event.buttonId!) &&
        (state.phase === 'prequiz' || state.phase === 'quiz-held' || state.phase === 'postquiz') &&
        state.mainFrame >= 2 && !state.nmhPopupVisible;
      if (!onPopup && !onMain)
        return reject(state, 'glossary button not reachable');
      const previous = {phase: state.phase, mainPlaying: state.mainPlaying,
        quizButtonsEnabled: state.quizButtonsEnabled,
        nmhButtonEnabled: state.nmhButtonEnabled,
        nmhPopupVisible: state.nmhPopupVisible};
      return accept({...state, phase: 'host-glossary', mainPlaying: false,
        quizButtonsEnabled: false, glossaryTerm: term, glossaryReturn: previous,
        audioOwner: null},
      'source KeyAttribute and DoHyperLinks hand off to the host', [
        {type: 'audio:cancelAll'}, {type: 'timeline:stop', frame: state.mainFrame},
        {type: 'host:DoHyperLinks', keyAttribute: term},
      ]);
    }
    case 'close-glossary': {
      if (state.phase !== 'host-glossary' || !state.glossaryReturn ||
          event.quizGeneration !== state.quizGeneration)
        return reject(state, 'glossary return unavailable');
      const previous = state.glossaryReturn;
      return accept({...state, phase: previous.phase,
        // The host returns to a held page. No audio is started by dialog close.
        mainPlaying: false, quizButtonsEnabled: previous.quizButtonsEnabled,
        nmhButtonEnabled: previous.nmhButtonEnabled,
        nmhPopupVisible: previous.nmhPopupVisible, glossaryTerm: null,
        glossaryReturn: null, audioOwner: null},
      'glossary close returns to the held source page');
    }
    case 'advance-feedback': {
      const feedback = state.feedback;
      if (!feedback || feedback.token !== event.token)
        return reject(state, 'stale feedback token');
      const max = feedback.kind === 'wrong' ? 28 : 31;
      if (!validFrame(event.frame, max) || event.frame <= feedback.frame)
        return reject(state, 'invalid or non-increasing feedback frame');
      if (state.phase === 'wrong-feedback-playing') {
        if (event.frame >= 20) {
          return accept({...state, phase: 'wrong-feedback-held',
            feedback: {...feedback, frame: 20}, wrongFeedbackPopupVisible: true,
            audioOwner: null}, 'sprite 336 stops at 20; nested Close is required', [
              {type: 'feedback:stop', spriteId: 336, frame: 20}, {type: 'audio:cancelAll'},
            ]);
        }
        return accept({...state, feedback: {...feedback, frame: event.frame}},
          'observed wrong feedback head frame');
      }
      if (state.phase === 'wrong-feedback-tail') {
        if (event.frame >= 28) {
          const second = state.quizTryCount === 1;
          const owner = second ? `main:${state.epoch}:${state.selectionSerial + 1}` : null;
          const effects:P044Effect[] = [{type: 'audio:cancelAll'}];
          // Source enables quiz before the count check. The adapter suppresses a
          // transient clickable interval when the second wrong resumes the main.
          if (!second) effects.push({type: 'host:enableQuizButton'});
          effects.push({type: 'feedback:reset', spriteId: 336, frame: 1});
          if (second) effects.push({type: 'timeline:seekPlay', frame: 54},
            {type: 'audio:intent', stream: 'main', owner});
          return accept({...state, phase: second ? 'postquiz' : 'quiz-held',
            mainFrame: second ? 54 : 53, mainPlaying: second,
            quizSection: !second, quizTryCount: second ? 0 : 1,
            quizGeneration: second ? state.quizGeneration : state.quizGeneration + 1,
            feedback: null, wrongFeedText: null, wrongFeedbackPopupVisible: false,
            quizButtonsEnabled: !second, nmhButtonEnabled: !second, audioOwner: owner},
          second ? 'second wrong clears quiz and resumes at 54' :
            'first wrong permits another choice at 53', effects);
        }
        return accept({...state, feedback: {...feedback, frame: event.frame}},
          'observed wrong feedback tail frame');
      }
      if (state.phase === 'right-feedback-playing') {
        if (event.frame >= 31) {
          const owner = `main:${state.epoch}:${state.selectionSerial + 1}`;
          return accept({...state, phase: 'postquiz', mainFrame: 54,
            mainPlaying: true, quizSection: false, feedback: null,
            quizButtonsEnabled: false, nmhButtonEnabled: false, audioOwner: owner},
          'right4 terminal resumes parent without resetting prior wrong count', [
            {type: 'audio:cancelAll'}, {type: 'host:disableQuizButton'},
            {type: 'timeline:seekPlay', frame: 54},
            {type: 'feedback:reset', spriteId: 198, frame: 1},
            {type: 'audio:intent', stream: 'main', owner},
          ]);
        }
        return accept({...state, feedback: {...feedback, frame: event.frame}},
          'observed right feedback frame');
      }
      return reject(state, 'feedback held or wrong phase');
    }
    case 'close-wrong': {
      const feedback = state.feedback;
      if (!feedback || feedback.kind !== 'wrong' || feedback.token !== event.token ||
          state.phase !== 'wrong-feedback-held' || feedback.frame !== 20)
        return reject(state, 'nested wrong Close unavailable');
      const owner = `feedbackTail:${event.token}`;
      return accept({...state, phase: 'wrong-feedback-tail',
        feedback: {...feedback, frame: 21}, wrongFeedbackPopupVisible: false,
        audioOwner: owner}, 'button 331 resumes feedback at 21 and resets answer clips', [
          {type: 'feedback:seekPlay', spriteId: 336, frame: 21, token: event.token},
          {type: 'answerClips:reset', instances: ANSWER_INSTANCES, frame: 1},
          {type: 'audio:intent', stream: 'wrong4', owner},
        ]);
    }
  }
  return reject(state, 'unknown event');
}
