/** P029 source-bound quiz staging. Pure state only: no rendering, timers, audio, or registration. */
export const P029_SOURCE = {
  animationId: 'shared-alg001-l06-p029',
  swfSha256: 'cbfd012d0aff11544a252c9e2852dff30d408c634aa2a805eb0837933c3370d4',
  structuralXmlSha256: 'a22596049a263d1fb13056714af8db143aac4c7b9aa8e9b0a5e68d0047797c07',
  mainSpriteId: 185, quizFrame: 145, firstPostQuizFrame: 146, mainFrames: 234,
  answerButtonCharacterId: 27, inputCharacterId: 180, inputInstanceName: 'Entry_txt',
  expectedEntryText: '3', sourceComparisonOperator: '==',
  stagedComparisonPolicy: 'strict-string-no-normalization', authoritativeAvm1CoercionProved: false,
  firstWrongText: 'Each ordered pair contains two numbers. Try again. ',
  laterWrongText: 'Each ordered pair contains two numbers.',
  wrongWriteName: '_global.Wrongfeed', wrongPopupReadName: '_global.WrongFeed',
  separateSaAutomaticLocaleStart: false,
} as const;

const AUDIT = '../../../../migrations/shared-alg001-l06-p029/audit/source-planning-v1/source-export/scripts/';
const ROOT_RESET = {path: AUDIT + 'frame_1/DoAction.as', sha256: 'af7188282949f2613421ba9c8be629f489bbe2ee1e370a072024794b2d2cfc19'};
const ROOT_ENTRY = {path: AUDIT + 'frame_6/DoAction.as', sha256: '3271a793e3f9600314c6b0facc05023c4f3ed09c116d452966200a5d04735655'};
const QUIZ_GATE = {path: AUDIT + 'DefineSprite_185/frame_145/DoAction.as', sha256: '1c5ee973c2576fdd6e33a3a2cf1acd334b9fddb906b45d7b2e4d0a7874fd546f'};
const POST_DEFAULT = {path: AUDIT + 'DefineSprite_185/frame_146/DoAction.as', sha256: 'e3e559c42284e1775b6f519cda6f2d9b644460b020a97fac9b8672307ec06b01'};
const SUBMIT = {path: AUDIT + 'DefineButton2_27/BUTTONCONDACTION on(release).as', sha256: '80053294a1776a3622920e2505194ba0b08e438c82a31bdc5bbc01fa3d003484'};
const DISPLAY = {path: '../../../../migrations/shared-alg001-l06-p029/audit/source-planning-v1/source-structure.xml', sha256: P029_SOURCE.structuralXmlSha256};

/** The instance-to-character mapping is page-owned; branch ordinals come from the maintained host selector. */
export const P029_FEEDBACK = {
  wrong: {
    1: {domain: 'sprite-52', characterId: 52, instance: 'Mc_Wrong_Feed1', hold: 20, close: 21, end: 29, closeButton: 48, codec: 'mp3'},
    2: {domain: 'sprite-98', characterId: 98, instance: 'Mc_Wrong_Feed2', hold: 22, close: 23, end: 28, closeButton: 87, codec: 'mp3'},
    3: {domain: 'sprite-67', characterId: 67, instance: 'Mc_Wrong_Feed3', hold: 21, close: 22, end: 28, closeButton: 61, codec: 'mp3'},
  },
  right: {
    1: {domain: 'sprite-151', characterId: 151, instance: 'Mc_Right_Feed1', hold: null, close: null, end: 27, closeButton: null, codec: 'mp3'},
    2: {domain: 'sprite-167', characterId: 167, instance: 'Mc_Right_Feed2', hold: null, close: null, end: 28, closeButton: null, codec: 'mp3'},
    3: {domain: 'sprite-179', characterId: 179, instance: 'Mc_Right_Feed3', hold: null, close: null, end: 25, closeButton: null, codec: 'swf-adpcm'},
    4: {domain: 'sprite-126', characterId: 126, instance: 'Mc_Right_Feed4', hold: null, close: null, end: 28, closeButton: null, codec: 'mp3'},
  },
} as const;
export type P029Kind = 'right' | 'wrong';
export type P029Phase = 'prequiz' | 'question' | 'feedback-pending' | 'feedback-playing' | 'feedback-held' | 'postquiz';
export type P029FeedbackSpec = (typeof P029_FEEDBACK)['wrong'][1] | (typeof P029_FEEDBACK)['wrong'][2] | (typeof P029_FEEDBACK)['wrong'][3] |
  (typeof P029_FEEDBACK)['right'][1] | (typeof P029_FEEDBACK)['right'][2] | (typeof P029_FEEDBACK)['right'][3] | (typeof P029_FEEDBACK)['right'][4];

export interface P029Feedback {
  readonly kind: P029Kind;
  readonly branchIndex: number;
  readonly spec: P029FeedbackSpec;
  readonly frame: number;
  readonly token: number;
  readonly acknowledged: boolean;
}
export interface P029State {
  readonly phase: P029Phase;
  readonly mainFrame: number;
  readonly playing: boolean;
  readonly quizSection: boolean;
  readonly quizTryCount: number;
  readonly entryText: string;
  readonly entryWritable: boolean;
  readonly doneEnabled: boolean;
  readonly pendingHostCall: '_root.showRightFeed()' | '_root.showWrongFeed()' | null;
  readonly feedback: P029Feedback | null;
  readonly wrongfeedWritten: string | null;
  readonly wrongFeedPopupRead: 'unresolved' | null;
  readonly epoch: number;
}
export type P029Event =
  | {type: 'play'}
  | {type: 'advance-main'; frame: number}
  | {type: 'input'; text: string}
  | {type: 'submit'}
  | {type: 'host-select-feedback'; branchIndex: number}
  | {type: 'advance-feedback'; frame: number; token: number}
  | {type: 'close-wrong'; token: number}
  | {type: 'replay'};
export interface P029Binding {
  readonly domain: string;
  readonly frame: number;
  readonly sourcePath: string;
  readonly sourceSha256: string;
  readonly action: string;
  readonly authority: 'authored-action' | 'authored-placement' | 'host-selection-boundary' | 'modern-product-policy';
}
export interface P029Transition {
  readonly accepted: boolean;
  readonly state: P029State;
  readonly binding: P029Binding | null;
  readonly retireAudio: boolean;
}

export function p029InitialState(epoch = 0): P029State {
  return {phase: 'prequiz', mainFrame: 1, playing: false, quizSection: false,
    quizTryCount: 0, entryText: '', entryWritable: false, doneEnabled: false,
    pendingHostCall: null, feedback: null, wrongfeedWritten: null,
    wrongFeedPopupRead: null, epoch};
}
function binding(domain: string, frame: number, source: {path: string; sha256: string},
  action: string, authority: P029Binding['authority']): P029Binding {
  return {domain, frame, sourcePath: source.path, sourceSha256: source.sha256, action, authority};
}
const reject = (state: P029State): P029Transition => ({accepted: false, state, binding: null, retireAudio: false});
function accept(before: P029State, state: P029State, bound: P029Binding): P029Transition {
  const prior = p029AudioIntent(before), next = p029AudioIntent(state);
  return {accepted: true, state, binding: bound,
    retireAudio: prior !== null && (next === null || prior.domain !== next.domain || prior.epoch !== next.epoch)};
}
function feedbackSpec(kind: P029Kind, branchIndex: number): P029FeedbackSpec | null {
  if (!Number.isSafeInteger(branchIndex)) return null;
  const group: Record<number, P029FeedbackSpec> = P029_FEEDBACK[kind];
  return group[branchIndex] ?? null;
}
function terminalSource(feedback: P029Feedback) {
  const id = feedback.spec.characterId;
  return {path: AUDIT + `DefineSprite_${id}/frame_${feedback.spec.end}/DoAction.as`,
    sha256: feedback.kind === 'wrong'
      ? 'ec37864adc37ccccbd065ed86f5f4b585f403bb5e51824c40656e945eaf03913'
      : 'fbc376b22c841cf5917c6b8406f58c3daccdca8c1e795ba45b9a07e4f615338c'};
}
function holdSource(feedback: P029Feedback) {
  if (feedback.spec.hold === null) throw new Error('right feedback has no held popup');
  return {path: AUDIT + `DefineSprite_${feedback.spec.characterId}/frame_${feedback.spec.hold}/DoAction.as`,
    sha256: '3271a793e3f9600314c6b0facc05023c4f3ed09c116d452966200a5d04735655'};
}
function closeSource(feedback: P029Feedback) {
  const id = feedback.spec.closeButton;
  const hashes: Record<number, string> = {
    48: '3fe79f85ee919b2d07dc6e3ea32f67fe78ab058772ea4197375d1063d7be8a7c',
    61: '347253891f997902789749e125aa4b6eed7eaad17dbd308bc9ce40651e8222d0',
    87: '4057c3c6552def15f1e846f96fbf4df07b5166f278dad82eec3eea19b09b3394',
  };
  if (id === null) throw new Error('right feedback has no Close source');
  return {path: AUDIT + `DefineButton2_${id}/BUTTONCONDACTION on(release).as`, sha256: hashes[id]};
}

/** No implicit host RNG, text normalization, sound playback, or original-runtime claim. */
export function p029Reduce(state: P029State, event: P029Event): P029Transition {
  switch (event.type) {
    case 'replay':
      return {...accept(state, p029InitialState(state.epoch + 1), binding('root', 1, ROOT_RESET,
        'modern Replay resets root/main/feedback and retires the old epoch; no authored Replay handler in this page SWF', 'modern-product-policy')),
        retireAudio: true};
    case 'play':
      if (state.playing || state.mainFrame >= 234 || (state.phase !== 'prequiz' && state.phase !== 'postquiz')) return reject(state);
      return accept(state, {...state, playing: true}, binding('root', 6, ROOT_ENTRY,
        'modern host starts or resumes the source main timeline; root source action itself is stop()', 'modern-product-policy'));
    case 'advance-main': {
      if (!Number.isSafeInteger(event.frame) || event.frame < 1 || event.frame > 234) throw new RangeError('P029_INVALID_MAIN_FRAME');
      if (!state.playing || !['prequiz', 'postquiz'].includes(state.phase) || event.frame <= state.mainFrame) return reject(state);
      if (state.phase === 'prequiz') {
        const frame = Math.min(event.frame, 145);
        if (frame === 145) return accept(state, {...state, phase: 'question', mainFrame: 145,
          playing: false, quizSection: true, quizTryCount: 0,
          entryText: '', entryWritable: true, doneEnabled: true},
          binding('sprite-185', 145, QUIZ_GATE, 'stop(); quizSection=true; quizTryCount=0', 'authored-action'));
        return accept(state, {...state, mainFrame: frame},
          binding('sprite-185', frame, DISPLAY, 'source ShowFrame/display-list advance before quiz stop', 'authored-placement'));
      }
      const frame = Math.min(event.frame, 234);
      return accept(state, {...state, mainFrame: frame, playing: frame < 234,
        entryText: state.mainFrame < 146 ? '3' : state.entryText, entryWritable: false},
        binding('sprite-185', frame, frame === 234 ? DISPLAY : state.mainFrame < 146 ? POST_DEFAULT : DISPLAY,
          frame === 234 ? 'modern boundary holds at the audited 234-frame domain; no source terminal stop established' :
            state.mainFrame < 146 ? 'frame146 assigns Entry_txt.text=3; later source display-list advance' : 'post-quiz source display-list advance',
          frame === 234 ? 'modern-product-policy' : state.mainFrame < 146 ? 'authored-action' : 'authored-placement'));
    }
    case 'input':
      if (typeof event.text !== 'string') throw new TypeError('P029_INPUT_TEXT_MUST_BE_STRING');
      if (state.phase !== 'question' || !state.entryWritable || !state.doneEnabled || event.text === state.entryText) return reject(state);
      return accept(state, {...state, entryText: event.text},
        binding('sprite-185', 145, DISPLAY, 'editable DefineEditText 180 named Entry_txt receives the raw user string', 'authored-placement'));
    case 'submit': {
      if (state.phase !== 'question' || !state.entryWritable || !state.doneEnabled) return reject(state);
      const right = state.entryText === '3';
      const count = state.quizTryCount + 1;
      return accept(state, {...state, phase: 'feedback-pending', playing: false,
        entryWritable: false, doneEnabled: false, quizTryCount: count,
        pendingHostCall: right ? '_root.showRightFeed()' : '_root.showWrongFeed()',
        wrongfeedWritten: right ? null : count === 1 ? P029_SOURCE.firstWrongText : P029_SOURCE.laterWrongText,
        wrongFeedPopupRead: right ? null : 'unresolved'},
        binding('sprite-185', 145, SUBMIT,
          'button27 pointerReleaseInside: increment quizTryCount; source compares Entry_txt.text == "3"; staged strict-string policy pending AVM1 coercion proof; call host feedback',
          'authored-action'));
    }
    case 'host-select-feedback': {
      if (state.phase !== 'feedback-pending' || state.pendingHostCall === null) return reject(state);
      const kind: P029Kind = state.pendingHostCall.includes('Right') ? 'right' : 'wrong';
      const spec = feedbackSpec(kind, event.branchIndex);
      if (!spec) throw new RangeError('P029_INVALID_HOST_FEEDBACK_VARIANT');
      const token = state.epoch + 1;
      return accept(state, {...state, phase: 'feedback-playing', pendingHostCall: null,
        epoch: token, feedback: {kind, branchIndex: event.branchIndex, spec, frame: 2, token, acknowledged: false}},
        binding('sprite-185', 145, SUBMIT,
          `host selects ${spec.instance} (${spec.domain}) from source-placed feedback clips; Adobe RNG state unresolved`,
          'host-selection-boundary'));
    }
    case 'advance-feedback': {
      const feedback = state.feedback;
      if (!feedback || state.phase !== 'feedback-playing' || event.token !== feedback.token) return reject(state);
      if (!Number.isSafeInteger(event.frame) || event.frame < feedback.frame) throw new RangeError('P029_INVALID_FEEDBACK_FRAME');
      const limit = feedback.kind === 'wrong' && !feedback.acknowledged ? feedback.spec.hold! : feedback.spec.end;
      const frame = Math.min(event.frame, limit);
      if (frame === feedback.frame) return reject(state);
      if (feedback.kind === 'wrong' && !feedback.acknowledged && frame === feedback.spec.hold) {
        return accept(state, {...state, phase: 'feedback-held', feedback: {...feedback, frame}},
          binding(feedback.spec.domain, frame, holdSource(feedback),
            'wrong feedback script stop() at held popup frame; Close is required', 'authored-action'));
      }
      if (frame === feedback.spec.end) {
        const wrong = feedback.kind === 'wrong';
        const retry = wrong && state.quizTryCount < 2;
        const after = {...state, phase: retry ? 'question' : 'postquiz',
          playing: !retry, quizSection: retry,
          quizTryCount: wrong && !retry ? 0 : state.quizTryCount,
          entryWritable: retry, doneEnabled: true, feedback: null} as P029State;
        return accept(state, after, binding(feedback.spec.domain, frame, terminalSource(feedback),
          wrong ? 'wrong terminal enables Done/NMH; second-or-later wrong resets quiz and resumes parent' :
            'right terminal clears quizSection and resumes parent without resetting quizTryCount', 'authored-action'));
      }
      return accept(state, {...state, feedback: {...feedback, frame}},
        binding(feedback.spec.domain, frame, DISPLAY, 'source nested ShowFrame/display-list advance', 'authored-placement'));
    }
    case 'close-wrong': {
      const feedback = state.feedback;
      if (!feedback || feedback.kind !== 'wrong' || state.phase !== 'feedback-held' ||
          event.token !== feedback.token || feedback.spec.close === null) return reject(state);
      return accept(state, {...state, phase: 'feedback-playing', feedback: {...feedback, frame: feedback.spec.close, acknowledged: true}},
        binding(feedback.spec.domain, feedback.spec.close, closeSource(feedback),
          'popup Close button jumps parent to its source resume frame and resets four AnsBtn clips', 'authored-action'));
    }
  }
}

/** Intent only. A host owns the actual audio node and must retire it on owner or epoch change. */
export function p029AudioIntent(state: P029State): {domain: string; frame: number; epoch: number; codec: 'mp3' | 'swf-adpcm'} | null {
  if (state.phase === 'prequiz' && state.playing && state.mainFrame >= 2) return {domain: 'sprite-185', frame: state.mainFrame, epoch: state.epoch, codec: 'mp3'};
  if (state.phase === 'postquiz' && state.playing && state.mainFrame >= 146) return {domain: 'sprite-185', frame: state.mainFrame, epoch: state.epoch, codec: 'mp3'};
  if (state.phase === 'feedback-playing' && state.feedback) return {domain: state.feedback.spec.domain, frame: state.feedback.frame,
    epoch: state.feedback.token, codec: state.feedback.spec.codec};
  return null;
}

/** Two explicit interpretations of the authored Wrongfeed / popup WrongFeed spelling mismatch. */
export function p029WrongDisplayText(state: P029State, policy: 'source-exact-unresolved' | 'product-readable-fallback') {
  if (!state.feedback || state.feedback.kind !== 'wrong' || state.wrongfeedWritten === null) return null;
  return policy === 'source-exact-unresolved'
    ? {text: null, basis: 'popup reads _global.WrongFeed; value unresolved by this page source', parityAccepted: false}
    : {text: state.wrongfeedWritten, basis: 'modern readable fallback from authored _global.Wrongfeed write', parityAccepted: false};
}
