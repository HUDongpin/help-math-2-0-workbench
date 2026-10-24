export type G4L12VB036WrongVariant = 1 | 2 | 3;
export type G4L12VB036RightVariant = 1 | 2 | 3 | 4;

export type G4L12VB036SourceEvent =
  | Readonly<{type: 'clock'}>
  | Readonly<{type: 'replay'}>
  | Readonly<{
      type: 'answer-release';
      button: 'AnsBtn1';
      feedbackVariant: G4L12VB036WrongVariant;
    }>
  | Readonly<{
      type: 'answer-release';
      button: 'AnsBtn2';
      feedbackVariant: G4L12VB036RightVariant;
    }>
  | Readonly<{
      type: 'wrong-feedback-close';
      activation: 'caller-established';
    }>;

type FeedbackOutcome = 'wrong' | 'right';
type Playback = 'playing' | 'stopped';
type FeedbackPlayback = 'playing' | 'awaiting-close' | 'reset-at-frame-1';

type CueDefinition = Readonly<{
  cueId: `embedded-stream-${string}`;
  frameDomain: `sprite-${number}`;
  firstSourceBlockFrame: number;
  lastSourceBlockFrame: number;
}>;

type FeedbackDefinition = Readonly<{
  outcome: FeedbackOutcome;
  variant: number;
  instanceName: `Mc_${'Wrong' | 'Right'}_Feed${number}`;
  frameDomain: `sprite-${number}`;
  entryFrame: 2;
  closeStopFrame: 22 | null;
  closeResumeFrame: 23 | null;
  terminalFrame: number;
  resetFrame: 1;
  closePopup: Readonly<{
    sourceObjectId: 53;
    placementDepth: number;
    placementFrame: number;
    firstNonzeroAlphaFrame: number;
    removalFrame: 23;
  }> | null;
  cue: CueDefinition;
}>;

export type G4L12VB036SourceCuePosition = CueDefinition & Readonly<{
  localFrame: number;
  sourceBlockFrameOffset: number;
  rangePosition:
    | 'before-source-blocks'
    | 'within-source-blocks'
    | 'after-source-blocks';
  audibleTiming: 'unresolved-original-runtime-required';
}>;

export type G4L12VB036SourceState = Readonly<{
  main: Readonly<{
    frameDomain: 'sprite-216';
    localFrame: number;
    playback: Playback;
  }>;
  feedback: Readonly<{
    outcome: FeedbackOutcome;
    variant: number;
    instanceName: FeedbackDefinition['instanceName'];
    frameDomain: FeedbackDefinition['frameDomain'];
    localFrame: number;
    playback: FeedbackPlayback;
    entryFrame: 2;
    closeStopFrame: 22 | null;
    closeResumeFrame: 23 | null;
    terminalFrame: number;
    resetFrame: 1;
    closePopup: Readonly<{
      sourceObjectId: 53;
      placementDepth: number;
      placementFrame: number;
      firstNonzeroAlphaFrame: number;
      removalFrame: 23;
      placed: boolean;
      sourceAlphaPhase: 'not-placed' | 'zero' | 'nonzero-or-full';
      controllerAcceptsCallerEstablishedActivation: boolean;
      hitTestEligibility: 'unresolved-original-runtime-required';
    }> | null;
  }> | null;
  quizSection: boolean;
  answerButtons: readonly [
    Readonly<{
      instanceName: 'AnsBtn1';
      sourceCharacterId: 30;
      outcome: 'wrong';
      placed: boolean;
      hostEnabled: boolean | null;
      sourceVisibleProperty: boolean | null;
      interactive: boolean;
      visualGeometryClaimed: false;
    }>,
    Readonly<{
      instanceName: 'AnsBtn2';
      sourceCharacterId: 29;
      outcome: 'right';
      placed: boolean;
      hostEnabled: boolean | null;
      sourceVisibleProperty: boolean | null;
      interactive: boolean;
      visualGeometryClaimed: false;
    }>,
  ];
  cuePositions: readonly G4L12VB036SourceCuePosition[];
}>;

const MAIN_CUE = Object.freeze({
  cueId: 'embedded-stream-0011',
  frameDomain: 'sprite-216',
  firstSourceBlockFrame: 9,
  lastSourceBlockFrame: 82,
} satisfies CueDefinition);

const WRONG_FEEDBACK = Object.freeze([
  Object.freeze({
    outcome: 'wrong', variant: 1, instanceName: 'Mc_Wrong_Feed1',
    frameDomain: 'sprite-85', entryFrame: 2, closeStopFrame: 22,
    closeResumeFrame: 23, terminalFrame: 28, resetFrame: 1,
    closePopup: Object.freeze({
      sourceObjectId: 53, placementDepth: 9, placementFrame: 13,
      firstNonzeroAlphaFrame: 14, removalFrame: 23,
    }),
    cue: Object.freeze({
      cueId: 'embedded-stream-0003', frameDomain: 'sprite-85',
      firstSourceBlockFrame: 2, lastSourceBlockFrame: 28,
    }),
  }),
  Object.freeze({
    outcome: 'wrong', variant: 2, instanceName: 'Mc_Wrong_Feed2',
    frameDomain: 'sprite-96', entryFrame: 2, closeStopFrame: 22,
    closeResumeFrame: 23, terminalFrame: 28, resetFrame: 1,
    closePopup: Object.freeze({
      sourceObjectId: 53, placementDepth: 12, placementFrame: 16,
      firstNonzeroAlphaFrame: 17, removalFrame: 23,
    }),
    cue: Object.freeze({
      cueId: 'embedded-stream-0004', frameDomain: 'sprite-96',
      firstSourceBlockFrame: 2, lastSourceBlockFrame: 28,
    }),
  }),
  Object.freeze({
    outcome: 'wrong', variant: 3, instanceName: 'Mc_Wrong_Feed3',
    frameDomain: 'sprite-108', entryFrame: 2, closeStopFrame: 22,
    closeResumeFrame: 23, terminalFrame: 31, resetFrame: 1,
    closePopup: Object.freeze({
      sourceObjectId: 53, placementDepth: 4, placementFrame: 13,
      firstNonzeroAlphaFrame: 14, removalFrame: 23,
    }),
    cue: Object.freeze({
      cueId: 'embedded-stream-0005', frameDomain: 'sprite-108',
      firstSourceBlockFrame: 2, lastSourceBlockFrame: 31,
    }),
  }),
] as const satisfies readonly FeedbackDefinition[]);

const RIGHT_FEEDBACK = Object.freeze([
  Object.freeze({
    outcome: 'right', variant: 1, instanceName: 'Mc_Right_Feed1',
    frameDomain: 'sprite-184', entryFrame: 2, closeStopFrame: null,
    closeResumeFrame: null, terminalFrame: 28, resetFrame: 1,
    closePopup: null,
    cue: Object.freeze({
      cueId: 'embedded-stream-0009', frameDomain: 'sprite-184',
      firstSourceBlockFrame: 1, lastSourceBlockFrame: 28,
    }),
  }),
  Object.freeze({
    outcome: 'right', variant: 2, instanceName: 'Mc_Right_Feed2',
    frameDomain: 'sprite-134', entryFrame: 2, closeStopFrame: null,
    closeResumeFrame: null, terminalFrame: 31, resetFrame: 1,
    closePopup: null,
    cue: Object.freeze({
      cueId: 'embedded-stream-0006', frameDomain: 'sprite-134',
      firstSourceBlockFrame: 2, lastSourceBlockFrame: 31,
    }),
  }),
  Object.freeze({
    outcome: 'right', variant: 3, instanceName: 'Mc_Right_Feed3',
    frameDomain: 'sprite-151', entryFrame: 2, closeStopFrame: null,
    closeResumeFrame: null, terminalFrame: 28, resetFrame: 1,
    closePopup: null,
    cue: Object.freeze({
      cueId: 'embedded-stream-0007', frameDomain: 'sprite-151',
      firstSourceBlockFrame: 2, lastSourceBlockFrame: 28,
    }),
  }),
  Object.freeze({
    outcome: 'right', variant: 4, instanceName: 'Mc_Right_Feed4',
    frameDomain: 'sprite-172', entryFrame: 2, closeStopFrame: null,
    closeResumeFrame: null, terminalFrame: 33, resetFrame: 1,
    closePopup: null,
    cue: Object.freeze({
      cueId: 'embedded-stream-0008', frameDomain: 'sprite-172',
      firstSourceBlockFrame: 3, lastSourceBlockFrame: 33,
    }),
  }),
] as const satisfies readonly FeedbackDefinition[]);

export const G4_L12_VB036_SOURCE_CONTRACT = Object.freeze({
  animationId: 'course-g04-l12-vb-036',
  sourceSwf: Object.freeze({
    path: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L12/VB/L12VB36.swf',
    sha256: '08c76350118e13f0e423692a57881fec48506aed533c780e2662503b08e96f3b',
  }),
  sameLessonHostSwf: Object.freeze({
    path: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L12/index_local.swf',
    sha256: '9e8f10fcaae4bcea672b3c236610118881b82c0983fac6018557348568234631',
  }),
  fps: 12,
  main: Object.freeze({
    frameDomain: 'sprite-216',
    frameCount: 82,
    questionStopFrame: 56,
    postCorrectResumeFrame: 57,
    terminalStopFrame: 82,
  }),
  answerButtons: Object.freeze([
    Object.freeze({
      instanceName: 'AnsBtn1', sourceCharacterId: 30, outcome: 'wrong',
      placementDepth: 15, mainPlacementFrame: 56, mainRemovalFrame: 57,
      hitAreaObjectId: 28, sourceButtonStates: 'hit-test-only',
      visualGeometryClaimed: false,
    }),
    Object.freeze({
      instanceName: 'AnsBtn2', sourceCharacterId: 29, outcome: 'right',
      placementDepth: 13, mainPlacementFrame: 56, mainRemovalFrame: 57,
      hitAreaObjectId: 28, sourceButtonStates: 'hit-test-only',
      visualGeometryClaimed: false,
    }),
  ]),
  feedback: Object.freeze({
    entryFrame: 2,
    wrongHostChoiceCount: 3,
    rightHostChoiceCount: 4,
    wrong: WRONG_FEEDBACK,
    right: RIGHT_FEEDBACK,
    sourceDefinedButHostDispatcherUnselected: Object.freeze([
      Object.freeze({outcome: 'wrong', variant: 4, frameDomain: 'sprite-57'}),
      Object.freeze({outcome: 'right', variant: 5, frameDomain: 'sprite-215'}),
    ]),
  }),
  close: Object.freeze({
    sourceExpression: '_parent.gotoAndPlay(23)',
    modeledActiveWrongFeedbackResumeFrame: 23,
    controllerEligibilityPolicy:
      'caller-established-activation-during-source-popup-placement',
    alphaAndHitTestEligibility: 'unresolved-original-runtime-required',
    avm1EventTimeParentScope: 'unresolved-original-runtime-required',
  }),
  closeButtonDownCue: Object.freeze({
    cueId: 'embedded-stream-0001',
    frameDomain: 'sprite-51',
    firstSourceBlockFrame: 1,
    lastSourceBlockFrame: 5,
    scheduling: 'not-modeled-button-down-lifecycle-unresolved',
  }),
  randomSelection: Object.freeze({
    source: 'host-random(3/4)-plus-one',
    controller: 'caller-supplied-explicit-variant',
    originalPrngParityClaimed: false,
  }),
  clockSemantics: 'one-maintained-engineering-frame-step',
  clockOrderingParity: 'unresolved-original-runtime-required',
  audioBoundary:
    'source stream-block frame position only; audible onset, stop, synchronization, and replay require original-runtime evidence',
  acceptanceEffects: Object.freeze({
    originalRuntime: false,
    behaviorParity: false,
    audioAccepted: false,
    humanVisual: false,
    owner: false,
    strictComplete: false,
    released: false,
    published: false,
  }),
});

function cuePosition(
  cue: CueDefinition,
  localFrame: number,
): G4L12VB036SourceCuePosition {
  const rangePosition = localFrame < cue.firstSourceBlockFrame
    ? 'before-source-blocks'
    : localFrame > cue.lastSourceBlockFrame
      ? 'after-source-blocks'
      : 'within-source-blocks';
  return Object.freeze({
    ...cue,
    localFrame,
    sourceBlockFrameOffset: localFrame - cue.firstSourceBlockFrame,
    rangePosition,
    audibleTiming: 'unresolved-original-runtime-required',
  });
}

type AnswerButtonMode = 'not-placed' | 'enabled' | 'disabled';

function answerButtons(mode: AnswerButtonMode): G4L12VB036SourceState['answerButtons'] {
  const placed = mode !== 'not-placed';
  const hostEnabled = placed ? mode === 'enabled' : null;
  const sourceVisibleProperty = placed ? mode === 'enabled' : null;
  const interactive = placed && hostEnabled === true &&
    sourceVisibleProperty === true;
  return Object.freeze([
    Object.freeze({
      instanceName: 'AnsBtn1', sourceCharacterId: 30, outcome: 'wrong',
      placed, hostEnabled, sourceVisibleProperty, interactive,
      visualGeometryClaimed: false as const,
    }),
    Object.freeze({
      instanceName: 'AnsBtn2', sourceCharacterId: 29, outcome: 'right',
      placed, hostEnabled, sourceVisibleProperty, interactive,
      visualGeometryClaimed: false as const,
    }),
  ]);
}

function feedbackState(
  definition: FeedbackDefinition,
  localFrame: number,
  playback: FeedbackPlayback,
): NonNullable<G4L12VB036SourceState['feedback']> {
  const sourcePopup = definition.closePopup;
  const popupPlaced = sourcePopup !== null &&
    localFrame >= sourcePopup.placementFrame &&
    localFrame < sourcePopup.removalFrame;
  const sourceAlphaPhase = !popupPlaced
    ? 'not-placed'
    : localFrame < sourcePopup.firstNonzeroAlphaFrame
      ? 'zero'
      : 'nonzero-or-full';
  return Object.freeze({
    outcome: definition.outcome,
    variant: definition.variant,
    instanceName: definition.instanceName,
    frameDomain: definition.frameDomain,
    localFrame,
    playback,
    entryFrame: definition.entryFrame,
    closeStopFrame: definition.closeStopFrame,
    closeResumeFrame: definition.closeResumeFrame,
    terminalFrame: definition.terminalFrame,
    resetFrame: definition.resetFrame,
    closePopup: sourcePopup === null ? null : Object.freeze({
      ...sourcePopup,
      placed: popupPlaced,
      sourceAlphaPhase,
      controllerAcceptsCallerEstablishedActivation: popupPlaced,
      hitTestEligibility: 'unresolved-original-runtime-required' as const,
    }),
  });
}

function definitionForFeedback(
  feedback: NonNullable<G4L12VB036SourceState['feedback']>,
) {
  const definitions = feedback.outcome === 'wrong'
    ? WRONG_FEEDBACK
    : RIGHT_FEEDBACK;
  const definition = definitions.find(({variant}) => variant === feedback.variant);
  if (!definition || definition.frameDomain !== feedback.frameDomain) {
    throw new Error('feedback state does not match the source contract');
  }
  return definition;
}

function makeState({
  mainFrame,
  mainPlayback,
  feedback,
  quizSection,
  answerButtonMode,
}: Readonly<{
  mainFrame: number;
  mainPlayback: Playback;
  feedback: G4L12VB036SourceState['feedback'];
  quizSection: boolean;
  answerButtonMode: AnswerButtonMode;
}>): G4L12VB036SourceState {
  const main = Object.freeze({
    frameDomain: 'sprite-216' as const,
    localFrame: mainFrame,
    playback: mainPlayback,
  });
  const cuePositions = [cuePosition(MAIN_CUE, mainFrame)];
  if (feedback && feedback.playback !== 'reset-at-frame-1') {
    cuePositions.push(cuePosition(definitionForFeedback(feedback).cue, feedback.localFrame));
  }
  return Object.freeze({
    main,
    feedback,
    quizSection,
    answerButtons: answerButtons(answerButtonMode),
    cuePositions: Object.freeze(cuePositions),
  });
}

export function createG4L12VB036SourceState(): G4L12VB036SourceState {
  return makeState({
    mainFrame: 1,
    mainPlayback: 'playing',
    feedback: null,
    quizSection: false,
    answerButtonMode: 'not-placed',
  });
}

function sourceFeedbackForAnswer(
  event: Extract<G4L12VB036SourceEvent, {type: 'answer-release'}>,
) {
  const definitions = event.button === 'AnsBtn1'
    ? WRONG_FEEDBACK
    : event.button === 'AnsBtn2'
      ? RIGHT_FEEDBACK
      : null;
  if (!definitions) {
    throw new Error(`unsupported source answer button: ${String(event.button)}`);
  }
  const definition = definitions.find(({variant}) =>
    variant === event.feedbackVariant);
  if (!definition) {
    throw new Error(`feedback variant is outside the host dispatcher: ${event.feedbackVariant}`);
  }
  return definition;
}

function clock(state: G4L12VB036SourceState): G4L12VB036SourceState {
  if (state.feedback && state.feedback.playback !== 'reset-at-frame-1') {
    if (state.feedback.playback === 'awaiting-close') return state;
    const definition = definitionForFeedback(state.feedback);
    const nextFeedbackFrame = state.feedback.localFrame + 1;
    if (nextFeedbackFrame >= definition.terminalFrame) {
      const wrong = definition.outcome === 'wrong';
      return makeState({
        mainFrame: state.main.localFrame,
        mainPlayback: wrong ? state.main.playback : 'playing',
        feedback: feedbackState(
          definition,
          definition.resetFrame,
          'reset-at-frame-1',
        ),
        quizSection: wrong,
        answerButtonMode: wrong ? 'enabled' : 'disabled',
      });
    }
    const awaitingClose = definition.outcome === 'wrong' &&
      nextFeedbackFrame === definition.closeStopFrame;
    return makeState({
      mainFrame: state.main.localFrame,
      mainPlayback: state.main.playback,
      feedback: feedbackState(
        definition,
        nextFeedbackFrame,
        awaitingClose ? 'awaiting-close' : 'playing',
      ),
      quizSection: state.quizSection,
      answerButtonMode: 'disabled',
    });
  }

  if (state.main.playback === 'stopped') return state;
  const nextMainFrame = Math.min(state.main.localFrame + 1, 82);
  const question = nextMainFrame === 56;
  const terminal = nextMainFrame === 82;
  return makeState({
    mainFrame: nextMainFrame,
    mainPlayback: question || terminal ? 'stopped' : 'playing',
    feedback: null,
    quizSection: question,
    answerButtonMode: question ? 'enabled' : 'not-placed',
  });
}

export function reduceG4L12VB036SourceState(
  state: G4L12VB036SourceState,
  event: G4L12VB036SourceEvent,
): G4L12VB036SourceState {
  if (event.type === 'clock') return clock(state);
  if (event.type === 'replay') return createG4L12VB036SourceState();

  if (event.type === 'answer-release') {
    if (
      (state.feedback !== null &&
        state.feedback.playback !== 'reset-at-frame-1') ||
      state.main.localFrame !== 56 ||
      state.main.playback !== 'stopped' ||
      !state.answerButtons.every(({interactive}) => interactive)
    ) {
      throw new Error('answer release is unavailable outside the frame-56 quiz state');
    }
    const definition = sourceFeedbackForAnswer(event);
    return makeState({
      mainFrame: 56,
      mainPlayback: 'stopped',
      feedback: feedbackState(definition, definition.entryFrame, 'playing'),
      quizSection: true,
      answerButtonMode: 'disabled',
    });
  }

  if (event.type !== 'wrong-feedback-close') {
    throw new Error('unsupported source controller event');
  }
  if (event.activation !== 'caller-established') {
    throw new Error('unsupported wrong-feedback close activation authority');
  }

  const feedback = state.feedback;
  if (
    feedback?.outcome !== 'wrong' ||
    feedback.closePopup === null ||
    !feedback.closePopup.controllerAcceptsCallerEstablishedActivation
  ) {
    throw new Error(
      'caller-established wrong-feedback close requires the source popup placement interval',
    );
  }
  return makeState({
    mainFrame: state.main.localFrame,
    mainPlayback: state.main.playback,
    feedback: feedbackState(definitionForFeedback(feedback), 23, 'playing'),
    quizSection: state.quizSection,
    answerButtonMode: 'disabled',
  });
}
