// P045 maintained source behavior candidate. An adapter supplies observed frames.
// Effects are intents: this module never plays a stream or calls the lesson host.

export type P045Choice = 'A'|'B'|'C'|'D';
export type P045Feedback = {spriteId:220|307;kind:'right'|'wrong';
  frame:number;token:string};
export type P045State = {
  epoch:number;phase:string;mainFrame:number;mainPlaying:boolean;
  quizSection:boolean;quizTryCount:number;quizGeneration:number;
  selectionSerial:number;selected:P045Choice|null;wrongFeedText:string|null;
  feedback:P045Feedback|null;quizButtonsEnabled:boolean;nmhButtonEnabled:boolean;
  nmhPopupVisible:boolean;wrongFeedbackPopupVisible:boolean;
  glossaryTerm:string|null;glossaryReturn:null|{
    phase:string;mainPlaying:boolean;quizButtonsEnabled:boolean;
    nmhButtonEnabled:boolean;nmhPopupVisible:boolean};
  audioOwner:string|null;sourceToAudioAlignment:'unresolved';
  lessonCompleted:false;
};
export type P045Event = {type:string;epoch:number;frame?:number;
  choice?:P045Choice;quizGeneration?:number;buttonId?:number;
  token?:string;owner?:string};
export type P045Effect = {type:string;[key:string]:unknown};
export type P045Transition = {accepted:boolean;reason:string;state:P045State;
  effects:P045Effect[]};

export const P045_SOURCE = Object.freeze({
  animationId: 'shared-alg001-l06-p045',
  swfSha256: '9dfff51a15bb0010b98ca10c1fac954bee5d9451ceb649d8ac202e98f2c05b9d',
  lessonXmlSha256: '9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c',
  separateSaSha256: '99404ff17adb3498bf64c033a3063077f3dce961ca52dfc8074f8f84f33dc7e7',
  mainSprite: 350, quizFrame: 53, resumeFrame: 54, lastFrame: 167,
  wrongFeedbackSprite: 307, wrongHoldFrame: 22, wrongCloseButton: 300,
  wrongCloseJump: 23, wrongTerminalFrame: 31,
  rightFeedbackSprite: 220, rightTerminalFrame: 25,
});

export const P045_CHOICES = Object.freeze({
  A: Object.freeze({instance: 'AnsBtn1', text: 'Graph A', buttonId: 177, kind: 'wrong'}),
  B: Object.freeze({instance: 'AnsBtn3', text: 'Graph B', buttonId: 177, kind: 'wrong'}),
  C: Object.freeze({instance: 'AnsBtn2', text: 'Graph C', buttonId: 178, kind: 'right'}),
  D: Object.freeze({instance: 'AnsBtn4', text: 'Graph D', buttonId: 177, kind: 'wrong'}),
});

export const P045_GLOSSARY = Object.freeze({
  138: 'Function', 139: 'Vertical', 140: 'Point', 141: 'Graph',
  142: 'Vertical-line test', 143: 'Line',
  151: 'Function', 152: 'Graph', 153: 'Represent',
});

const NMH_GLOSSARY = new Set([138, 139, 140, 141, 142, 143]);
const MAIN_GLOSSARY = new Set([151, 152, 153]);

const ANSWER_INSTANCES = Object.freeze(['AnsBtn1', 'AnsBtn2', 'AnsBtn3', 'AnsBtn4']);
const WRONG_TEXT = 'Use the vertical-line test.';

export function initialP045State(epoch = 0):P045State {
  if (!Number.isSafeInteger(epoch) || epoch < 0) throw new RangeError('P045_INVALID_EPOCH');
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

const reject = (state:P045State, reason:string):P045Transition =>
  ({accepted: false, reason, state, effects: []});
const accept = (state:P045State, reason:string,
  effects:P045Effect[] = []):P045Transition => ({accepted: true, reason, state, effects});
const validFrame = (frame:unknown, max:number):frame is number =>
  typeof frame==='number'&&Number.isSafeInteger(frame)&&frame>=1&&frame<=max;

/** All events require the current run epoch. Choices also require quizGeneration. */
export function reduceP045(state:P045State, event:P045Event):P045Transition {
  if (!state || !event || typeof event.type !== 'string')
    throw new TypeError('P045_STATE_AND_EVENT_REQUIRED');
  if (event.epoch !== state.epoch) return reject(state, 'stale run epoch');
  if (state.phase === 'left') return reject(state, 'page already left');

  if (event.type === 'replay') {
    return accept(initialP045State(state.epoch + 1), 'Replay invalidates the run', [
      {type: 'audio:cancelAll'}, {type: 'stage:reset'},
    ]);
  }
  if (event.type === 'leave') {
    return accept({...initialP045State(state.epoch + 1), phase: 'left'},
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
      if (!validFrame(event.frame, P045_SOURCE.lastFrame))
        return reject(state, 'invalid main frame');
      if (!state.mainPlaying || event.frame <= state.mainFrame)
        return reject(state, 'main held or non-increasing frame');
      if (state.phase === 'prequiz') {
        if (event.frame >= P045_SOURCE.quizFrame) {
          return accept({...state, phase: 'quiz-held', mainFrame: 53, mainPlaying: false,
            quizSection: true, quizTryCount: 0, quizGeneration: state.quizGeneration + 1,
            selected: null, wrongFeedText: null, feedback: null,
            quizButtonsEnabled: true, nmhButtonEnabled: true,
            nmhPopupVisible: false, wrongFeedbackPopupVisible: false, audioOwner: null},
          'sprite 350 holds at 53 and resets the quiz', [
            {type: 'timeline:stop', frame: 53}, {type: 'audio:cancelAll'},
            {type: 'host:enableQuizButton'},
          ]);
        }
        return accept({...state, mainFrame: event.frame}, 'observed prequiz frame');
      }
      if (state.phase !== 'postquiz' || event.frame < P045_SOURCE.resumeFrame)
        return reject(state, 'main frame outside continuation');
      if (event.frame >= P045_SOURCE.lastFrame) {
        return accept({...state, phase: 'engineering-end-held', mainFrame: 167,
          mainPlaying: false, audioOwner: null},
        'sprite 350 stops at 167; no lesson completion claim', [
          {type: 'timeline:stop', frame: 167}, {type: 'audio:cancelAll'},
        ]);
      }
      return accept({...state, mainFrame: event.frame, quizSection: false},
        'observed postquiz frame');
    }
    case 'choose': {
      if (state.phase !== 'quiz-held' || !state.quizButtonsEnabled ||
          event.quizGeneration !== state.quizGeneration ||
          !Object.prototype.hasOwnProperty.call(P045_CHOICES, event.choice!))
        return reject(state, 'answer unavailable or stale quiz generation');
      const choice = P045_CHOICES[event.choice as P045Choice];
      const token = `${state.epoch}:${state.selectionSerial + 1}`;
      const wrong = choice.kind === 'wrong';
      const wrongText = wrong ? WRONG_TEXT + (state.quizTryCount === 1 ? '' : ' Try again.') : null;
      const owner = `feedback:${token}`;
      return accept({...state, phase: wrong ? 'wrong-feedback-playing' : 'right-feedback-playing',
        selectionSerial: state.selectionSerial + 1, selected: event.choice!,
        wrongFeedText: wrongText, feedback: {
          spriteId: wrong ? 307 : 220, kind: choice.kind, frame: 2, token,
        }, quizButtonsEnabled: false, nmhButtonEnabled: false, audioOwner: owner},
      'source answer starts feedback4 at frame 2', [
        {type: 'host:disableQuizButton'}, {type: 'audio:cancelAll'},
        {type: 'feedback:seekPlay', spriteId: wrong ? 307 : 220, frame: 2,
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
      'button 145 opens NMH popup', [{type: 'host:disableQuizButton'}]);
    }
    case 'close-nmh': {
      if (state.phase !== 'nmh-popup' || event.quizGeneration !== state.quizGeneration)
        return reject(state, 'NMH Close unavailable');
      return accept({...state, phase: 'quiz-held', nmhButtonEnabled: true,
        quizButtonsEnabled: true, nmhPopupVisible: false},
      'button 188 closes NMH popup', [{type: 'host:enableQuizButton'}]);
    }
    case 'glossary': {
      const term = (P045_GLOSSARY as Readonly<Record<number,string>>)[event.buttonId!];
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
      const max = feedback.kind === 'wrong' ? 31 : 25;
      if (!validFrame(event.frame, max) || event.frame <= feedback.frame)
        return reject(state, 'invalid or non-increasing feedback frame');
      if (state.phase === 'wrong-feedback-playing') {
        if (event.frame >= 22) {
          return accept({...state, phase: 'wrong-feedback-held',
            feedback: {...feedback, frame: 22}, wrongFeedbackPopupVisible: true,
            audioOwner: null}, 'sprite 307 stops at 22; nested Close is required', [
              {type: 'feedback:stop', spriteId: 307, frame: 22}, {type: 'audio:cancelAll'},
            ]);
        }
        return accept({...state, feedback: {...feedback, frame: event.frame}},
          'observed wrong feedback head frame');
      }
      if (state.phase === 'wrong-feedback-tail') {
        if (event.frame >= 31) {
          const second = state.quizTryCount === 1;
          const owner = second ? `main:${state.epoch}:${state.selectionSerial + 1}` : null;
          const effects:P045Effect[] = [{type: 'audio:cancelAll'}];
          // Source enables quiz before the count check. The adapter suppresses a
          // transient clickable interval when the second wrong resumes the main.
          if (!second) effects.push({type: 'host:enableQuizButton'});
          effects.push({type: 'feedback:reset', spriteId: 307, frame: 1});
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
        if (event.frame >= 25) {
          const owner = `main:${state.epoch}:${state.selectionSerial + 1}`;
          return accept({...state, phase: 'postquiz', mainFrame: 54,
            mainPlaying: true, quizSection: false, feedback: null,
            quizButtonsEnabled: false, nmhButtonEnabled: false, audioOwner: owner},
          'right4 terminal resumes parent without resetting prior wrong count', [
            {type: 'audio:cancelAll'}, {type: 'host:disableQuizButton'},
            {type: 'timeline:seekPlay', frame: 54},
            {type: 'feedback:reset', spriteId: 220, frame: 1},
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
          state.phase !== 'wrong-feedback-held' || feedback.frame !== 22)
        return reject(state, 'nested wrong Close unavailable');
      const owner = `feedbackTail:${event.token}`;
      return accept({...state, phase: 'wrong-feedback-tail',
        feedback: {...feedback, frame: 23}, wrongFeedbackPopupVisible: false,
        audioOwner: owner}, 'button 300 resumes feedback at 23 and resets answer clips', [
          {type: 'feedback:seekPlay', spriteId: 307, frame: 23, token: event.token},
          {type: 'answerClips:reset', instances: ANSWER_INSTANCES, frame: 1},
          {type: 'audio:intent', stream: 'wrong4', owner},
        ]);
    }
  }
  return reject(state, 'unknown event');
}
