/** Source-bound, page-owned P035 behavior stage. No registration or audio playback. */
export const P035_SOURCE = {
  animationId: 'shared-alg001-l06-p035',
  swfSha256: '9aaf16b58c32b00b056c7c5040b38f9d1391486bb025b71c95fa0326bbae33b3',
  mainSprite: 227, mainFrames: 534, quizFrame: 145,
  sourceFps: 12,
  choices: {A: {text: '50', button: 54}, B: {text: '51', button: 55},
    C: {text: '225', button: 54}, D: {text: '226', button: 54}},
  wrongFirst: 'Sorry! Try Again.', wrongSecond: 'Sorry.',
  separateSaSha256: 'ca0d2121df287403e350e2f8812a755c3d5f43f6b13c2c84f8e205b286b8c79f',
  separateSaLanguage: 'undetermined', separateSaAutoplay: false,
} as const;

export type P035Choice = keyof typeof P035_SOURCE.choices;
export type P035Glossary = 'Substitute' | 'Equation' | 'Function' | 'Output' | 'Input';
export const P035_GLOSSARY: Readonly<Record<P035Glossary, {button: number; firstFrame: number}>> = {
  Substitute: {button: 23, firstFrame: 13}, Equation: {button: 24, firstFrame: 13},
  Function: {button: 25, firstFrame: 13}, Output: {button: 37, firstFrame: 89},
  Input: {button: 38, firstFrame: 89},
};

export type P035FeedbackKind = 'wrong' | 'right';
export const P035_FEEDBACK = {
  80: {kind: 'wrong', end: 29, hold: 20, close: 21, closeButton: 76, closeVisibleFirst: 14,
    firstBlockFrame: 2, audioAsset: 'streams/sprite-80-wrong-1.mp3', codec: 'mp3', audioStatus: 'extracted'},
  95: {kind: 'wrong', end: 28, hold: 21, close: 22, closeButton: 89, closeVisibleFirst: 15,
    firstBlockFrame: 2, audioAsset: 'streams/sprite-95-wrong-3.mp3', codec: 'mp3', audioStatus: 'extracted'},
  126: {kind: 'wrong', end: 28, hold: 22, close: 23, closeButton: 115, closeVisibleFirst: 16,
    firstBlockFrame: 2, audioAsset: 'streams/sprite-126-wrong-2.mp3', codec: 'mp3', audioStatus: 'extracted'},
  154: {kind: 'right', end: 28, hold: null, close: null, closeButton: null, closeVisibleFirst: null,
    firstBlockFrame: 2, audioAsset: 'streams/sprite-154-right-4.mp3', codec: 'mp3', audioStatus: 'extracted'},
  179: {kind: 'right', end: 27, hold: null, close: null, closeButton: null, closeVisibleFirst: null,
    firstBlockFrame: 3, audioAsset: 'streams/sprite-179-right-1.mp3', codec: 'mp3', audioStatus: 'incomplete-source-tail'},
  195: {kind: 'right', end: 28, hold: null, close: null, closeButton: null, closeVisibleFirst: null,
    firstBlockFrame: 2, audioAsset: 'streams/sprite-195-right-2.mp3', codec: 'mp3', audioStatus: 'extracted'},
  207: {kind: 'right', end: 25, hold: null, close: null, closeButton: null, closeVisibleFirst: null,
    firstBlockFrame: 1, audioAsset: 'streams/sprite-207-right-3-ffmpeg-pcm16.wav', codec: 'swf-adpcm', audioStatus: 'public-tool-decode'},
} as const;
export type P035FeedbackId = keyof typeof P035_FEEDBACK;

export type P035Phase = 'prequiz' | 'question' | 'feedback-pending' | 'feedback-playing' | 'feedback-held' | 'postquiz';
export interface P035Feedback {
  readonly characterId: P035FeedbackId;
  readonly kind: P035FeedbackKind;
  readonly frame: number;
  readonly token: number;
  readonly acknowledged: boolean;
}
export interface P035State {
  readonly phase: P035Phase;
  readonly mainFrame: number;
  readonly mainPlaying: boolean;
  readonly quizSection: boolean;
  readonly quizTryCount: 0 | 1;
  readonly quizButtonsEnabled: boolean;
  readonly nMhButtonEnabled: boolean;
  readonly pendingHostCall: '_root.showWrongFeed()' | '_root.showRightFeed()' | null;
  readonly wrongFeedText: string | null;
  readonly feedback: P035Feedback | null;
  readonly glossaryOpen: P035Glossary | null;
  readonly supplemental: 'off' | 'playing' | 'paused' | 'ended';
  /** Stable main decoder/buffer identity through glossary, quiz, feedback, and SA. */
  readonly mainAudioToken: number;
  /** New only on explicit SA start or Replay; Pause/Play retains this buffer identity. */
  readonly supplementalAudioToken: number;
  /** Feedback callback token; changes on resolved feedback and Replay, never SA. */
  readonly epoch: number;
}
export type P035Event =
  | {type: 'play-main'}
  | {type: 'advance-main'; frame: number}
  | {type: 'choose'; choice: P035Choice}
  | {type: 'resolve-feedback'; characterId: P035FeedbackId}
  | {type: 'advance-feedback'; frame: number; token: number}
  | {type: 'close-wrong'; token: number}
  | {type: 'open-glossary'; key: P035Glossary}
  | {type: 'close-glossary'}
  | {type: 'start-supplemental'}
  | {type: 'pause-supplemental'}
  | {type: 'resume-supplemental'}
  | {type: 'supplemental-ended'; token: number}
  | {type: 'return-supplemental'}
  | {type: 'replay'};

export interface P035Transition {
  readonly accepted: boolean;
  readonly reason: string;
  readonly state: P035State;
  readonly source: string;
  readonly retireAudio: boolean;
}

export function p035InitialState(epoch = 0): P035State {
  return {phase: 'prequiz', mainFrame: 1, mainPlaying: false,
    quizSection: false, quizTryCount: 0, quizButtonsEnabled: false,
    nMhButtonEnabled: false, pendingHostCall: null, wrongFeedText: null,
    feedback: null, glossaryOpen: null, supplemental: 'off',
    mainAudioToken: epoch, supplementalAudioToken: epoch, epoch};
}

export type P035AudioIntent = {owner: 'main' | 'feedback' | 'supplemental'; source: string;
  frame: number; epoch: number; codec: 'mp3' | 'swf-adpcm'};
/** Audio owner is singular. No implicit SA, stream splice, or source-runtime timing claim. */
export function p035AudioIntent(state: P035State): P035AudioIntent | null {
  if (state.supplemental === 'playing') return {owner: 'supplemental',
    source: 'SA/L6IN07.mp3', frame: state.mainFrame,
    epoch: state.supplementalAudioToken, codec: 'mp3'};
  if (state.supplemental !== 'off') return null;
  if (state.feedback && state.phase === 'feedback-playing') {
    const spec = P035_FEEDBACK[state.feedback.characterId];
    if (spec.audioStatus === 'incomplete-source-tail' || state.feedback.frame < spec.firstBlockFrame) return null;
    return {owner: 'feedback', source: spec.audioAsset, frame: state.feedback.frame,
      epoch: state.feedback.token, codec: spec.codec};
  }
  if (state.mainPlaying && state.mainFrame >= 13 &&
    (state.phase === 'prequiz' || state.phase === 'postquiz'))
    return {owner: 'main', source: 'streams/sprite-227-main.mp3', frame: state.mainFrame,
      epoch: state.mainAudioToken, codec: 'mp3'};
  return null;
}
function reject(state: P035State, reason: string): P035Transition {
  return {accepted: false, reason, state, source: '', retireAudio: false};
}
function accept(before: P035State, state: P035State, reason: string, source: string): P035Transition {
  const old = p035AudioIntent(before), next = p035AudioIntent(state);
  // Disappearing main/SA intent can mean pause; the host retains its decoded buffer and cursor.
  const retireAudio = old?.owner === 'main' ? before.mainAudioToken !== state.mainAudioToken :
    old?.owner === 'supplemental' ? state.supplemental === 'off' || state.supplemental === 'ended' ||
      before.supplementalAudioToken !== state.supplementalAudioToken :
    old?.owner === 'feedback' ? next?.owner !== 'feedback' || old.epoch !== next.epoch : false;
  return {accepted: true, reason, state, source, retireAudio};
}
function isFeedbackId(id: number): id is P035FeedbackId {
  return Object.prototype.hasOwnProperty.call(P035_FEEDBACK, id);
}

/** The source-visible positive-alpha Close window; alpha-zero prior placement is unverified. */
export function p035CanCloseWrong(state: P035State): boolean {
  const feedback = state.feedback;
  if (!feedback || feedback.kind !== 'wrong' || feedback.acknowledged ||
    (state.phase !== 'feedback-playing' && state.phase !== 'feedback-held')) return false;
  const spec = P035_FEEDBACK[feedback.characterId];
  return spec.closeVisibleFirst !== null && spec.hold !== null &&
    feedback.frame >= spec.closeVisibleFirst && feedback.frame <= spec.hold;
}

/** The host must explicitly resolve the authored show*Feed() call to a source clip. */
export function p035Reduce(state: P035State, event: P035Event): P035Transition {
  switch (event.type) {
    case 'replay': {
      const reset = {...p035InitialState(state.epoch + 1),
        mainAudioToken: state.mainAudioToken + 1,
        supplementalAudioToken: state.supplementalAudioToken + 1};
      return {...accept(state, reset, 'modern Replay resets page-owned state and prior audio epoch',
        'modern My Lesson Replay'), retireAudio: true};
    }
    case 'play-main':
      if (state.mainPlaying || state.glossaryOpen || state.supplemental !== 'off' ||
        (state.phase !== 'prequiz' && state.phase !== 'postquiz') || state.mainFrame >= 534)
        return reject(state, 'main cannot play in this phase');
      return accept(state, {...state, mainPlaying: true}, 'host starts or resumes main',
        'root frame 6 stop(); host Play');
    case 'advance-main': {
      if (!Number.isSafeInteger(event.frame) || event.frame < 1 || event.frame > 534)
        throw new RangeError('P035_INVALID_MAIN_FRAME');
      if (!state.mainPlaying || state.glossaryOpen || state.supplemental !== 'off' ||
        event.frame <= state.mainFrame) return reject(state, 'main is held or frame did not advance');
      if (state.phase === 'prequiz') {
        const frame = Math.min(event.frame, 145);
        if (frame === 145) return accept(state, {...state, phase: 'question', mainFrame: 145,
          mainPlaying: false, quizSection: true, quizTryCount: 0,
          quizButtonsEnabled: true, nMhButtonEnabled: false},
          'authored quiz gate stops main and resets the attempt count',
          'DefineSprite_227/frame_145/DoAction.as');
        return accept(state, {...state, mainFrame: frame}, 'source frame advanced',
          'DefineSprite_227 ShowFrame');
      }
      if (state.phase !== 'postquiz') return reject(state, 'quiz/feedback owns the clock');
      return accept(state, {...state, mainFrame: event.frame, mainPlaying: event.frame < 534},
        event.frame === 534 ? 'hold at audited source-domain boundary; no lesson-complete claim' : 'source frame advanced',
        'DefineSprite_227 ShowFrame');
    }
    case 'choose': {
      if (state.phase !== 'question' || !state.quizButtonsEnabled || state.glossaryOpen ||
        state.supplemental !== 'off' || !(event.choice in P035_SOURCE.choices))
        return reject(state, 'choice unavailable');
      const right = event.choice === 'B';
      const wrongFeedText = right ? null : state.quizTryCount === 0 ? P035_SOURCE.wrongFirst : P035_SOURCE.wrongSecond;
      return accept(state, {...state, phase: 'feedback-pending', quizButtonsEnabled: false,
        pendingHostCall: right ? '_root.showRightFeed()' : '_root.showWrongFeed()', wrongFeedText},
        right ? 'correct B choice requests right feedback' : 'wrong choice requests first/second wrong feedback',
        right ? 'DefineButton2_55/BUTTONCONDACTION on(release).as' :
          'DefineButton2_54/BUTTONCONDACTION on(release).as');
    }
    case 'resolve-feedback': {
      if (state.phase !== 'feedback-pending' || state.supplemental !== 'off' ||
        !state.pendingHostCall || !isFeedbackId(event.characterId))
        return reject(state, 'no resolvable feedback call');
      const spec = P035_FEEDBACK[event.characterId];
      const expected = state.pendingHostCall.includes('Right') ? 'right' : 'wrong';
      if (spec.kind !== expected) return reject(state, 'feedback kind mismatches authored host call');
      if (spec.audioStatus === 'incomplete-source-tail') return reject(state, 'sprite 179 source audio tail unresolved');
      const token = state.epoch + 1;
      return accept(state, {...state, phase: 'feedback-playing', pendingHostCall: null,
        epoch: token, feedback: {characterId: event.characterId, kind: spec.kind,
          frame: 1, token, acknowledged: false}},
        'explicit host selection; source does not establish variant-selection policy',
        `DefineSprite_${event.characterId}/frame_1/DoAction.as`);
    }
    case 'advance-feedback': {
      const feedback = state.feedback;
      if (!feedback || state.phase !== 'feedback-playing' || event.token !== feedback.token)
        return reject(state, 'feedback token or phase mismatch');
      if (!Number.isSafeInteger(event.frame) || event.frame < 1)
        throw new RangeError('P035_INVALID_FEEDBACK_FRAME');
      const spec = P035_FEEDBACK[feedback.characterId];
      const limit = feedback.kind === 'wrong' && !feedback.acknowledged ? spec.hold! : spec.end;
      const frame = Math.min(event.frame, limit);
      if (frame <= feedback.frame) return reject(state, 'feedback frame did not advance');
      if (feedback.kind === 'wrong' && !feedback.acknowledged && frame === spec.hold)
        return accept(state, {...state, phase: 'feedback-held', feedback: {...feedback, frame}},
          'wrong feedback holds at authored popup stop',
          `DefineSprite_${feedback.characterId}/frame_${frame}/DoAction.as`);
      if (frame === spec.end) {
        if (feedback.kind === 'wrong') {
          const second = state.quizTryCount === 1;
          return accept(state, {...state, phase: second ? 'postquiz' : 'question',
            mainPlaying: second, quizSection: !second, quizTryCount: second ? 0 : 1,
            quizButtonsEnabled: true, nMhButtonEnabled: true,
            feedback: null, wrongFeedText: null},
            second ? 'second wrong resets count and resumes parent main' : 'first wrong increments count and enables retry',
            `DefineSprite_${feedback.characterId}/frame_${frame}/DoAction.as`);
        }
        return accept(state, {...state, phase: 'postquiz', mainPlaying: true, quizSection: false,
          quizButtonsEnabled: false, feedback: null, wrongFeedText: null},
          'right feedback clears quiz section and resumes parent main',
          `DefineSprite_${feedback.characterId}/frame_${frame}/DoAction.as`);
      }
      return accept(state, {...state, feedback: {...feedback, frame}}, 'feedback frame advanced',
        `DefineSprite_${feedback.characterId} ShowFrame`);
    }
    case 'close-wrong': {
      const feedback = state.feedback;
      if (!feedback || !p035CanCloseWrong(state) ||
        event.token !== feedback.token) return reject(state, 'wrong popup/token unavailable');
      const spec = P035_FEEDBACK[feedback.characterId];
      return accept(state, {...state, phase: 'feedback-playing',
        feedback: {...feedback, frame: spec.close!, acknowledged: true}},
        'Close jumps to authored frame and resets four AnsBtn clips',
        `DefineButton2_${spec.closeButton}/BUTTONCONDACTION on(release).as`);
    }
    case 'open-glossary': {
      const gate = P035_GLOSSARY[event.key];
      if (!gate || state.mainFrame < gate.firstFrame || state.glossaryOpen ||
        state.feedback || state.phase === 'feedback-pending' || state.supplemental !== 'off')
        return reject(state, 'glossary unavailable at this source frame');
      return accept(state, {...state, glossaryOpen: event.key,
        mainPlaying: false},
        'source key attribute and DoHyperLinks stop the main timeline',
        `DefineButton2_${gate.button}/BUTTONCONDACTION on(release).as`);
    }
    case 'close-glossary':
      if (!state.glossaryOpen) return reject(state, 'no glossary open');
      return accept(state, {...state, glossaryOpen: null, mainPlaying: false},
        'modern host closes dialog and keeps main held; explicit Play resumes same cursor',
        'modern My Lesson glossary close');
    case 'start-supplemental':
      if (state.supplemental !== 'off' || state.glossaryOpen || state.feedback || state.phase === 'feedback-pending')
        return reject(state, 'supplemental audio unavailable');
      return accept(state, {...state, supplemental: 'playing', mainPlaying: false,
        supplementalAudioToken: state.supplementalAudioToken + 1},
        'explicit user action owns separate SA buffer; no locale autoplay', 'modern My Lesson supplemental audio');
    case 'pause-supplemental':
      if (state.supplemental !== 'playing') return reject(state, 'supplemental is not playing');
      return accept(state, {...state, supplemental: 'paused'}, 'pause current SA buffer/cursor', 'modern My Lesson supplemental audio');
    case 'resume-supplemental':
      if (state.supplemental !== 'paused') return reject(state, 'supplemental is not paused');
      return accept(state, {...state, supplemental: 'playing'}, 'resume same SA buffer/cursor', 'modern My Lesson supplemental audio');
    case 'supplemental-ended':
      if (state.supplemental !== 'playing' || event.token !== state.supplementalAudioToken)
        return reject(state, 'stale or inactive SA natural EOF');
      return accept(state, {...state, supplemental: 'ended', mainPlaying: false},
        'SA natural EOF leaves its mode ended and main held; no implicit main playback',
        'modern My Lesson supplemental audio');
    case 'return-supplemental':
      if (state.supplemental === 'off') return reject(state, 'supplemental is not active');
      return accept(state, {...state, supplemental: 'off', mainPlaying: false},
        'return keeps main held at saved host cursor and retires SA owner; explicit Play resumes',
        'modern My Lesson supplemental audio');
  }
}
