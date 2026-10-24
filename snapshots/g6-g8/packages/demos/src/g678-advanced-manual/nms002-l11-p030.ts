import {
  ADVANCED_MANUAL_ACCEPTANCE_EFFECTS,
  isActivationInput,
  type ActivationInput,
  type FeedbackAudioDomain,
} from './contracts';
import {HELP_MATH_HOST_FEEDBACK_SELECTOR_V1} from './host-feedback-selector';

export type NmsAnswerId = 'AnsBtn1' | 'AnsBtn2' | 'AnsBtn3' | 'AnsBtn4';
export type NmsFeedbackKind = 'right' | 'wrong';
export type NmsFeedbackDomainId =
  | 'Mc_Wrong_Feed1'
  | 'Mc_Wrong_Feed2'
  | 'Mc_Wrong_Feed3'
  | 'Mc_Wrong_Feed4'
  | 'Mc_Right_Feed1'
  | 'Mc_Right_Feed2'
  | 'Mc_Right_Feed3'
  | 'Mc_Right_Feed4'
  | 'Mc_Right_Feed5';

const WRONG_DOMAINS = Object.freeze([
  Object.freeze({id: 'Mc_Wrong_Feed1', kind: 'wrong', instanceName: 'Mc_Wrong_Feed1', objectId: 124, frameCount: 30, soundStreamHeadCount: 1, soundStreamBlockCount: 29, audioAccepted: false}),
  Object.freeze({id: 'Mc_Wrong_Feed2', kind: 'wrong', instanceName: 'Mc_Wrong_Feed2', objectId: 112, frameCount: 30, soundStreamHeadCount: 1, soundStreamBlockCount: 26, audioAccepted: false}),
  Object.freeze({id: 'Mc_Wrong_Feed3', kind: 'wrong', instanceName: 'Mc_Wrong_Feed3', objectId: 101, frameCount: 30, soundStreamHeadCount: 1, soundStreamBlockCount: 29, audioAccepted: false}),
  Object.freeze({id: 'Mc_Wrong_Feed4', kind: 'wrong', instanceName: 'Mc_Wrong_Feed4', objectId: 90, frameCount: 30, soundStreamHeadCount: 1, soundStreamBlockCount: 28, audioAccepted: false}),
] as const satisfies readonly FeedbackAudioDomain<'wrong'>[]);

const RIGHT_DOMAINS = Object.freeze([
  Object.freeze({id: 'Mc_Right_Feed1', kind: 'right', instanceName: 'Mc_Right_Feed1', objectId: 215, frameCount: 27, soundStreamHeadCount: 1, soundStreamBlockCount: 27, audioAccepted: false}),
  Object.freeze({id: 'Mc_Right_Feed2', kind: 'right', instanceName: 'Mc_Right_Feed2', objectId: 150, frameCount: 31, soundStreamHeadCount: 1, soundStreamBlockCount: 30, audioAccepted: false}),
  Object.freeze({id: 'Mc_Right_Feed3', kind: 'right', instanceName: 'Mc_Right_Feed3', objectId: 251, frameCount: 28, soundStreamHeadCount: 1, soundStreamBlockCount: 27, audioAccepted: false}),
  Object.freeze({id: 'Mc_Right_Feed4', kind: 'right', instanceName: 'Mc_Right_Feed4', objectId: 223, frameCount: 27, soundStreamHeadCount: 1, soundStreamBlockCount: 26, audioAccepted: false}),
  Object.freeze({id: 'Mc_Right_Feed5', kind: 'right', instanceName: 'Mc_Right_Feed5', objectId: 182, frameCount: 25, soundStreamHeadCount: 1, soundStreamBlockCount: 24, audioAccepted: false}),
] as const satisfies readonly FeedbackAudioDomain<'right'>[]);

export const NMS002_L11_P030_BEHAVIOR_IR_V1 = Object.freeze({
  schemaVersion: 1,
  artifactType: 'help-math-source-bound-advanced-manual-behavior-ir',
  version: 'shared-nms002-l11-p030-v1',
  animationId: 'shared-nms002-l11-p030',
  lane: 'behavior-heavy',
  laneSelectionReason:
    'The source stops a 356-frame nested timeline at an answer-selection state, delegates feedback choice to host functions, tracks two wrong attempts, and exposes nine separately clocked feedback-audio sprites.',
  source: Object.freeze({
    path: 'G6-G8-shared/NMS002/L11/TI/L11TI05.swf',
    catalogPath: 'HELP_COURSES/NMS002/L11/TI/L11TI05.swf',
    bytes: 898_472,
    sha256: '853d0c3350fc1c39dfc730eb369041d91565003b6bdeed238aece874b2e06913',
    assetId: 'swf-853d0c3350fc1c39dfc730eb369041d91565003b6bdeed238aece874b2e06913',
    sourceKind: 'swf-only',
  }),
  structuralEvidence: Object.freeze({
    report: Object.freeze({
      path: 'work/g678-shared-page-factory/calibration-structure-final-20260901-155359-v2/report.json',
      bytes: 274_459,
      sha256: 'af830040388dd502ca193f482f084a9db49da2176e26ed39ebe7e01f5e706b97',
    }),
    swfmillXml: Object.freeze({
      path: 'placements/shared-nms002-l11-p030/swfmill/source.xml',
      bytes: 2_634_776,
      sha256: '045d11790a0d604e6617d8aea5188b12edd0305c675d86be72d3912fd589a0c1',
    }),
    ffdecDumpAs2: Object.freeze({
      path: 'placements/shared-nms002-l11-p030/logs/ffdec-dumpAS2.stdout.txt',
      bytes: 2_452,
      sha256: '07fb8ed722e3a16a716821587c771888a98acf36ff98b476e2762eb30006769b',
    }),
    exportedScriptSet: Object.freeze({
      fileCount: 52,
      totalBytes: 4_396,
      canonicalProjection:
        'structural-report exportedScripts.files serialized as sorted-key compact JSON plus LF',
      sha256: 'a8a8b3b0e887e7202063afe6a0fb1856ef0db489f9e216c08734813524a8fc17',
    }),
  }),
  runtime: Object.freeze({
    stage: Object.freeze({width: 800, height: 600}),
    fps: 12,
    rootFrameCount: 10,
    rootPlacement: Object.freeze({rootFrame: 6, instanceName: 'animation', objectId: 260}),
    mainFrameDomain: Object.freeze({
      id: 'sprite-260',
      objectId: 260,
      frameCount: 356,
      soundStreamHeadCount: 1,
      soundStreamBlockCount: 348,
      questionFrame: 97,
      resumeFrame: 98,
    }),
  }),
  question: Object.freeze({
    questionFrame: 97,
    correctAnswerId: 'AnsBtn1' as const,
    answerButtons: Object.freeze([
      Object.freeze({id: 'AnsBtn1', objectId: 71, kind: 'right'}),
      Object.freeze({id: 'AnsBtn2', objectId: 69, kind: 'wrong'}),
      Object.freeze({id: 'AnsBtn3', objectId: 70, kind: 'wrong'}),
      Object.freeze({id: 'AnsBtn4', objectId: 72, kind: 'wrong'}),
    ]),
    hint: Object.freeze({
      openButton: Object.freeze({instanceName: 'NMHBtn', objectId: 40}),
      popup: Object.freeze({instanceName: 'Mc_PopUp', objectId: 39}),
      closeButton: Object.freeze({instanceName: 'BtnClose', objectId: 38}),
    }),
    wrongFeedbackText: Object.freeze({
      firstAttempt:
        'Calculate fraction division to write equivalent decimal number values. Try again.',
      laterAttempt:
        'Calculate fraction division to write equivalent decimal number values.',
    }),
    maximumWrongAttemptsBeforeResume: 2,
  }),
  feedbackAudioDomains: Object.freeze([...WRONG_DOMAINS, ...RIGHT_DOMAINS]),
  scriptEvidence: Object.freeze({
    questionEntry: Object.freeze({
      path: 'scripts/DefineSprite_260/frame_97/DoAction.as',
      bytes: 93,
      sha256: '1274981573a9e72c7a73c2478bdf8a0031e757b088688e721ca9ffc6071cb5d4',
    }),
    correctAnswer: Object.freeze({
      path: 'scripts/DefineButton2_71/BUTTONCONDACTION on(release).as',
      bytes: 103,
      sha256: '7fe19da097e90fca5bbd38c5cd41c2d016e4ae065ba4ed18e2187b14b36f074c',
    }),
    wrongAnswers: Object.freeze([
      Object.freeze({path: 'scripts/DefineButton2_69/BUTTONCONDACTION on(release).as', bytes: 411, sha256: '97908c64ff385ccaa68c1fb839eb26ee9b8ae379a29099ab0edede9c672ef301'}),
      Object.freeze({path: 'scripts/DefineButton2_70/BUTTONCONDACTION on(release).as', bytes: 411, sha256: '97908c64ff385ccaa68c1fb839eb26ee9b8ae379a29099ab0edede9c672ef301'}),
      Object.freeze({path: 'scripts/DefineButton2_72/BUTTONCONDACTION on(release).as', bytes: 411, sha256: '97908c64ff385ccaa68c1fb839eb26ee9b8ae379a29099ab0edede9c672ef301'}),
    ]),
    hintOpen: Object.freeze({path: 'scripts/DefineButton2_40/BUTTONCONDACTION on(release).as', bytes: 136, sha256: 'ebd4fa7f7943be402d7b7cef3df07b361fda275ab1d1f6a9b0961820c49a7195'}),
    hintClose: Object.freeze({path: 'scripts/DefineButton2_38/BUTTONCONDACTION on(release).as', bytes: 109, sha256: '5e4f8810033d551b78a8f920da5783362a2bb5d1e5d8e9e2ebd165a7cf5d21c5'}),
    wrongFeedbackTerminalFamily: Object.freeze({
      objectIds: Object.freeze([90, 101, 112, 124]),
      pauseFrame: 22,
      terminalFrame: 30,
      sharedScriptSha256: 'c602a1ed271ed7c5ee439f454e3ce2fdc40508240248169a6a8fe55f38e26455',
    }),
    wrongFeedbackDismiss: Object.freeze({
      path: 'scripts/DefineButton2_83/BUTTONCONDACTION on(release).as',
      bytes: 82,
      sha256: '4b96d1b9aab78c5d6f89e887cf651b3fcf133aa17b261fb31f09f5b2bb60decf',
      resumeFeedbackFrame: 23,
    }),
    rightFeedbackTerminalFamily: Object.freeze({
      objectIds: Object.freeze([150, 182, 215, 223, 251]),
      terminalFrames: Object.freeze([31, 25, 27, 27, 28]),
      sharedScriptSha256: '5bc24178f890e478f8b0dc8085e80c07a74ae6e4f721ee01452daf12efe70911',
    }),
  }),
  hostBoundary: Object.freeze({
    rightSelectorCall: '_root.showRightFeed()',
    wrongSelectorCall: '_root.showWrongFeed()',
    selectionAlgorithmPresentInPageSwf: false,
    selectionAlgorithmRecoveredFromProductHost: true,
    selector: HELP_MATH_HOST_FEEDBACK_SELECTOR_V1,
    sourceReachableWrongDomains: Object.freeze([
      'Mc_Wrong_Feed1', 'Mc_Wrong_Feed2', 'Mc_Wrong_Feed3',
    ]),
    sourceReachableRightDomains: Object.freeze([
      'Mc_Right_Feed1', 'Mc_Right_Feed2', 'Mc_Right_Feed3',
      'Mc_Right_Feed4',
    ]),
    sourcePresentButHostUnreachable: Object.freeze([
      'Mc_Wrong_Feed4', 'Mc_Right_Feed5',
    ]),
    reducerRule:
      'Resolve the exact 3-wrong/4-right product-host cardinality with the maintained page-seed mapping, then remain stopped until the selected source feedback domain finishes.',
    interactiveStop: Object.freeze({
      id: 'nms-question-frame-97',
      stopFrame: 97,
      resumeFrame: 98,
      completionDisposition: 'blocked-while-unresolved',
      requiresHostInteractiveStop: true,
    }),
  }),
  accessibility: Object.freeze({
    modernActivationInputs: Object.freeze(['mouse', 'Enter', ' '] as const),
    semantics: 'Enter and Space mirror the named button release action.',
    legacyKeyboardParity: false,
  }),
  blockers: Object.freeze([
    'The page SWF has no FLA authoring source.',
    'The page does not contain its shell-owned selector; the maintained adapter is cross-bound to matching G3, G4, and G5 product-host evidence and does not claim Adobe random-state parity.',
    'Mc_Wrong_Feed4 and Mc_Right_Feed5 are source-present but unreachable through the shipped random(3)/random(4) host selector.',
    'Feedback audio language, audible correctness, and original-runtime synchronization are unaccepted.',
    'Exact answer and prompt display strings are not reconstructed by this behavior-only IR.',
    'Enter/Space activation is a modern accessibility extension; legacy keyboard parity is not proven.',
  ]),
  acceptanceEffects: ADVANCED_MANUAL_ACCEPTANCE_EFFECTS,
});

export interface NmsPendingFeedback {
  readonly kind: NmsFeedbackKind;
  readonly domainId: NmsFeedbackDomainId | null;
  readonly answerId: NmsAnswerId;
}

export interface Nms002State {
  readonly phase:
    | 'selecting'
    | 'hint-open'
    | 'feedback-pending-host'
    | 'feedback-active'
    | 'resumed';
  readonly mainFrame: 97 | 98;
  readonly mainPlaying: boolean;
  readonly quizSection: boolean;
  readonly quizTryCount: number;
  readonly selectedAnswer: NmsAnswerId | null;
  readonly wrongFeedbackText: string | null;
  readonly pendingFeedback: NmsPendingFeedback | null;
  readonly wrongFeedbackDismissed: boolean;
  readonly answerControlsEnabled: boolean;
  readonly hintButtonEnabled: boolean;
  readonly replay: number;
  readonly blockedReason: string | null;
}

export type Nms002Event =
  | Readonly<{type: 'open-hint'; input: ActivationInput}>
  | Readonly<{type: 'close-hint'; input: ActivationInput}>
  | Readonly<{type: 'choose-answer'; input: ActivationInput; answerId: NmsAnswerId}>
  | Readonly<{type: 'resolve-feedback-domain'; domainId: NmsFeedbackDomainId}>
  | Readonly<{type: 'dismiss-wrong-feedback'; input: ActivationInput}>
  | Readonly<{type: 'feedback-finished'}>
  | Readonly<{type: 'replay'; input: ActivationInput}>;

export function createNms002State(): Nms002State {
  return {
    phase: 'selecting',
    mainFrame: 97,
    mainPlaying: false,
    quizSection: true,
    quizTryCount: 0,
    selectedAnswer: null,
    wrongFeedbackText: null,
    pendingFeedback: null,
    wrongFeedbackDismissed: false,
    answerControlsEnabled: true,
    hintButtonEnabled: true,
    replay: 0,
    blockedReason: null,
  };
}

function blocked(state: Nms002State, reason: string): Nms002State {
  return {...state, blockedReason: reason};
}

function feedbackDomain(id: NmsFeedbackDomainId) {
  return NMS002_L11_P030_BEHAVIOR_IR_V1.feedbackAudioDomains.find(
    (candidate) => candidate.id === id,
  );
}

function finishFeedback(state: Nms002State): Nms002State {
  const pending = state.pendingFeedback;
  if (!pending?.domainId) return blocked(state, 'host-feedback-variant-unresolved');
  if (pending.kind === 'right') {
    return {
      ...state,
      phase: 'resumed',
      mainFrame: 98,
      mainPlaying: true,
      quizSection: false,
      pendingFeedback: null,
      wrongFeedbackDismissed: false,
      answerControlsEnabled: false,
      hintButtonEnabled: false,
      blockedReason: null,
    };
  }
  if (state.quizTryCount >= 2) {
    return {
      ...state,
      phase: 'resumed',
      mainFrame: 98,
      mainPlaying: true,
      quizSection: false,
      quizTryCount: 0,
      pendingFeedback: null,
      wrongFeedbackDismissed: false,
      selectedAnswer: null,
      wrongFeedbackText: null,
      answerControlsEnabled: false,
      hintButtonEnabled: false,
      blockedReason: null,
    };
  }
  return {
    ...state,
    phase: 'selecting',
    selectedAnswer: null,
    wrongFeedbackText: null,
    pendingFeedback: null,
    wrongFeedbackDismissed: false,
    answerControlsEnabled: true,
    hintButtonEnabled: true,
    blockedReason: null,
  };
}

export function reduceNms002(state: Nms002State, event: Nms002Event): Nms002State {
  switch (event.type) {
    case 'open-hint':
      if (!isActivationInput(event.input)) return blocked(state, 'activation-input-unsupported');
      if (state.phase !== 'selecting' || !state.hintButtonEnabled) {
        return blocked(state, 'hint-control-disabled');
      }
      return {
        ...state,
        phase: 'hint-open',
        answerControlsEnabled: false,
        hintButtonEnabled: false,
        blockedReason: null,
      };
    case 'close-hint':
      if (!isActivationInput(event.input)) return blocked(state, 'activation-input-unsupported');
      if (state.phase !== 'hint-open') return blocked(state, 'hint-not-open');
      return {
        ...state,
        phase: 'selecting',
        answerControlsEnabled: true,
        hintButtonEnabled: true,
        blockedReason: null,
      };
    case 'choose-answer': {
      if (!isActivationInput(event.input)) return blocked(state, 'activation-input-unsupported');
      if (state.phase !== 'selecting' || !state.answerControlsEnabled) {
        return blocked(state, 'answer-controls-disabled');
      }
      const kind: NmsFeedbackKind = event.answerId === 'AnsBtn1' ? 'right' : 'wrong';
      const quizTryCount = kind === 'wrong' ? state.quizTryCount + 1 : state.quizTryCount;
      return {
        ...state,
        phase: 'feedback-pending-host',
        quizTryCount,
        selectedAnswer: event.answerId,
        wrongFeedbackText: kind === 'wrong'
          ? quizTryCount === 1
            ? NMS002_L11_P030_BEHAVIOR_IR_V1.question.wrongFeedbackText.firstAttempt
            : NMS002_L11_P030_BEHAVIOR_IR_V1.question.wrongFeedbackText.laterAttempt
          : null,
        pendingFeedback: {kind, domainId: null, answerId: event.answerId},
        wrongFeedbackDismissed: false,
        answerControlsEnabled: false,
        hintButtonEnabled: false,
        blockedReason: null,
      };
    }
    case 'resolve-feedback-domain': {
      if (!state.pendingFeedback || state.phase !== 'feedback-pending-host') {
        return blocked(state, 'feedback-not-pending');
      }
      const domain = feedbackDomain(event.domainId);
      if (!domain) return blocked(state, 'feedback-domain-unknown');
      if (domain.kind !== state.pendingFeedback.kind) {
        return blocked(state, 'feedback-domain-kind-mismatch');
      }
      return {
        ...state,
        phase: 'feedback-active',
        pendingFeedback: {...state.pendingFeedback, domainId: event.domainId},
        wrongFeedbackDismissed: false,
        blockedReason: null,
      };
    }
    case 'dismiss-wrong-feedback':
      if (!isActivationInput(event.input)) return blocked(state, 'activation-input-unsupported');
      if (state.phase !== 'feedback-active' || state.pendingFeedback?.kind !== 'wrong') {
        return blocked(state, 'wrong-feedback-not-active');
      }
      return {...state, wrongFeedbackDismissed: true, blockedReason: null};
    case 'feedback-finished':
      if (state.phase === 'feedback-pending-host') {
        return blocked(state, 'host-feedback-variant-unresolved');
      }
      if (state.phase !== 'feedback-active') return blocked(state, 'feedback-not-active');
      if (state.pendingFeedback?.kind === 'wrong' && !state.wrongFeedbackDismissed) {
        return blocked(state, 'wrong-feedback-dismissal-required');
      }
      return finishFeedback(state);
    case 'replay':
      if (!isActivationInput(event.input)) return blocked(state, 'activation-input-unsupported');
      return {...createNms002State(), replay: state.replay + 1};
  }
}
