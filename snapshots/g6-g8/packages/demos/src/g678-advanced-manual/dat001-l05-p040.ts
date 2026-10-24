import {
  ADVANCED_MANUAL_ACCEPTANCE_EFFECTS,
  isActivationInput,
  type ActivationInput,
  type FeedbackAudioDomain,
} from './contracts';
import {HELP_MATH_HOST_FEEDBACK_SELECTOR_V1} from './host-feedback-selector';

export type DatSourceId = 'Src_1' | 'Src_2' | 'Src_3' | 'Src_4' | 'Src_5';
export type DatTargetId = 'Tar_1' | 'Tar_2' | 'Tar_3' | 'Tar_4' | 'Tar_5';
export type DatFeedbackKind = 'right' | 'wrong';
export type DatFeedbackDomainId =
  | 'Mc_Wrong_Feed1'
  | 'Mc_Wrong_Feed2'
  | 'Mc_Wrong_Feed3'
  | 'Mc_Right_Feed1'
  | 'Mc_Right_Feed2'
  | 'Mc_Right_Feed3'
  | 'Mc_Right_Feed4';

const SOURCE_IDS = Object.freeze([
  'Src_1',
  'Src_2',
  'Src_3',
  'Src_4',
  'Src_5',
] as const satisfies readonly DatSourceId[]);

const SOURCE_TARGETS = Object.freeze({
  Src_1: 'Tar_1',
  Src_2: 'Tar_2',
  Src_3: 'Tar_3',
  Src_4: 'Tar_4',
  Src_5: 'Tar_5',
} as const satisfies Readonly<Record<DatSourceId, DatTargetId>>);

const WRONG_DOMAINS = Object.freeze([
  Object.freeze({id: 'Mc_Wrong_Feed1', kind: 'wrong', instanceName: 'Mc_Wrong_Feed1', objectId: 202, frameCount: 28, soundStreamHeadCount: 1, soundStreamBlockCount: 26, audioAccepted: false}),
  Object.freeze({id: 'Mc_Wrong_Feed2', kind: 'wrong', instanceName: 'Mc_Wrong_Feed2', objectId: 214, frameCount: 29, soundStreamHeadCount: 1, soundStreamBlockCount: 28, audioAccepted: false}),
  Object.freeze({id: 'Mc_Wrong_Feed3', kind: 'wrong', instanceName: 'Mc_Wrong_Feed3', objectId: 226, frameCount: 28, soundStreamHeadCount: 1, soundStreamBlockCount: 27, audioAccepted: false}),
] as const satisfies readonly FeedbackAudioDomain<'wrong'>[]);

const RIGHT_DOMAINS = Object.freeze([
  Object.freeze({id: 'Mc_Right_Feed1', kind: 'right', instanceName: 'Mc_Right_Feed1', objectId: 314, frameCount: 33, soundStreamHeadCount: 1, soundStreamBlockCount: 31, audioAccepted: false}),
  Object.freeze({id: 'Mc_Right_Feed2', kind: 'right', instanceName: 'Mc_Right_Feed2', objectId: 258, frameCount: 25, soundStreamHeadCount: 1, soundStreamBlockCount: 24, audioAccepted: false}),
  Object.freeze({id: 'Mc_Right_Feed3', kind: 'right', instanceName: 'Mc_Right_Feed3', objectId: 294, frameCount: 28, soundStreamHeadCount: 1, soundStreamBlockCount: 27, audioAccepted: false}),
  Object.freeze({id: 'Mc_Right_Feed4', kind: 'right', instanceName: 'Mc_Right_Feed4', objectId: 266, frameCount: 27, soundStreamHeadCount: 1, soundStreamBlockCount: 26, audioAccepted: false}),
] as const satisfies readonly FeedbackAudioDomain<'right'>[]);

export const DAT001_L05_P040_BEHAVIOR_IR_V1 = Object.freeze({
  schemaVersion: 1,
  artifactType: 'help-math-source-bound-advanced-manual-behavior-ir',
  version: 'shared-dat001-l05-p040-v1',
  animationId: 'shared-dat001-l05-p040',
  lane: 'behavior-heavy',
  laneSelectionReason:
    'The source stops a 254-frame nested timeline at a five-item drag/drop task, derives targets through eval(_droptarget), tracks quizDragCount, and delegates seven feedback-audio variants to host functions.',
  source: Object.freeze({
    path: 'G6-G8-shared/DAT001/L5/TI/L5TI02.swf',
    catalogPath: 'HELP_COURSES/DAT001/L5/TI/L5TI02.swf',
    bytes: 984_792,
    sha256: '0945d41f55d2c0746ccd4e7d820983f3eea2c49bf9c54e1f6174f5ee33d420f6',
    assetId: 'swf-0945d41f55d2c0746ccd4e7d820983f3eea2c49bf9c54e1f6174f5ee33d420f6',
    sourceKind: 'swf-only',
  }),
  structuralEvidence: Object.freeze({
    report: Object.freeze({
      path: 'work/g678-shared-page-factory/calibration-structure-final-20260901-155359-v2/report.json',
      bytes: 274_459,
      sha256: 'af830040388dd502ca193f482f084a9db49da2176e26ed39ebe7e01f5e706b97',
    }),
    swfmillXml: Object.freeze({
      path: 'placements/shared-dat001-l05-p040/swfmill/source.xml',
      bytes: 3_346_592,
      sha256: 'ebf346560c6171d0f8de674c0071ab94256ec0cee360adfb4e79b428ffe546f9',
    }),
    ffdecDumpAs2: Object.freeze({
      path: 'placements/shared-dat001-l05-p040/logs/ffdec-dumpAS2.stdout.txt',
      bytes: 4_079,
      sha256: '0a45c742da480066c5590ad3d3fdedae6941a7e13dc7a4fee5b1f1fda9792f5e',
    }),
    exportedScriptSet: Object.freeze({
      fileCount: 71,
      totalBytes: 6_507,
      canonicalProjection:
        'structural-report exportedScripts.files serialized as sorted-key compact JSON plus LF',
      sha256: 'da27a1054d768c24197d754678a9b1655110fea52de051a470085bc75ad0c2f9',
    }),
  }),
  runtime: Object.freeze({
    stage: Object.freeze({width: 800, height: 600}),
    fps: 12,
    rootFrameCount: 10,
    rootPlacement: Object.freeze({rootFrame: 6, instanceName: 'animation', objectId: 315}),
    mainFrameDomain: Object.freeze({
      id: 'sprite-315',
      objectId: 315,
      frameCount: 254,
      soundStreamHeadCount: 1,
      soundStreamBlockCount: 231,
      interactionFrame: 238,
      resumeFrame: 239,
      terminalFrame: 254,
    }),
  }),
  dragDrop: Object.freeze({
    count: 5,
    completionExpression: '_global.quizDragCount >= 5',
    targetExpression:
      'eval(_droptarget) == eval(_parent["Tar_" + _name.substring(_name.length - 1,_name.length)])',
    sources: Object.freeze([
      Object.freeze({id: 'Src_1', objectId: 184, targetId: 'Tar_1', originTwips: Object.freeze({x: -6140, y: 53})}),
      Object.freeze({id: 'Src_2', objectId: 185, targetId: 'Tar_2', originTwips: Object.freeze({x: -6276, y: 2421})}),
      Object.freeze({id: 'Src_3', objectId: 186, targetId: 'Tar_3', originTwips: Object.freeze({x: -6144, y: 3439})}),
      Object.freeze({id: 'Src_4', objectId: 188, targetId: 'Tar_4', originTwips: Object.freeze({x: -6242, y: -1373})}),
      Object.freeze({id: 'Src_5', objectId: 189, targetId: 'Tar_5', originTwips: Object.freeze({x: -6242, y: 1273})}),
    ]),
    targets: Object.freeze([
      Object.freeze({id: 'Tar_1', objectId: 181, positionTwips: Object.freeze({x: -4118, y: -1345})}),
      Object.freeze({id: 'Tar_2', objectId: 182, positionTwips: Object.freeze({x: -4126, y: 64})}),
      Object.freeze({id: 'Tar_3', objectId: 179, positionTwips: Object.freeze({x: -4128, y: 1270})}),
      Object.freeze({id: 'Tar_4', objectId: 180, positionTwips: Object.freeze({x: -4138, y: 2402})}),
      Object.freeze({id: 'Tar_5', objectId: 182, positionTwips: Object.freeze({x: -4118, y: 3477})}),
    ]),
    pressResetSlots: Object.freeze({right: Object.freeze([1, 2, 3, 4]), wrong: Object.freeze([1, 2, 3, 4])}),
    unresolvedResetTarget: 'Mc_Wrong_Feed4 is referenced by the press loop but no fourth wrong feedback sprite is placed at frame 238.',
  }),
  feedbackAudioDomains: Object.freeze([...WRONG_DOMAINS, ...RIGHT_DOMAINS]),
  scriptEvidence: Object.freeze({
    interactionEntry: Object.freeze({
      path: 'scripts/DefineSprite_315/frame_238/DoAction.as',
      bytes: 66,
      sha256: 'd62c630a84f949d46633fec1a2d8e1e1e56bc4b71b2e5b821b9211afb5032bfd',
    }),
    dragPressFamily: Object.freeze({
      objectIds: Object.freeze([184, 185, 186, 188, 189]),
      sharedScriptSha256: '4cd11c3a02362ab59d90cae90ebc52c392ba04b1d6590122b6ee54c158585bf7',
      bytesPerScript: 272,
    }),
    dragReleaseFamily: Object.freeze({
      objectIds: Object.freeze([184, 185, 186, 188, 189]),
      sharedScriptSha256: 'f585ff8e2d58b30c8392392872426750ac12b67f2c8f9cf8543d2690374475e0',
      bytesPerScript: 435,
    }),
    postInteraction: Object.freeze({
      path: 'scripts/DefineSprite_315/frame_239/DoAction.as',
      bytes: 30,
      sha256: '97f40c5a1237941dde9cb53b208b3c2a293ae7b1de706239e6fe5d60301f947e',
    }),
    wrongFeedbackTerminalFamily: Object.freeze({
      objectIds: Object.freeze([202, 214, 226]),
      terminalFrames: Object.freeze([28, 29, 28]),
      sharedScriptSha256: 'f8114f97670cfe8e5edb49702f3e110e0c800851cadef2a4a31516e814df3478',
    }),
    rightFeedbackTerminalFamily: Object.freeze({
      objectIds: Object.freeze([258, 266, 294, 314]),
      terminalFrames: Object.freeze([25, 27, 28, 33]),
      sharedScriptSha256: 'd19ab7cde1009a1a92de53e09fb13420c1327ac82bf33a268f1b5d9325df77d4',
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
    reducerRule:
      'Resolve the exact 3-wrong/4-right product-host cardinality with the maintained page-seed mapping, then remain stopped until the selected source feedback domain finishes.',
    interactiveStop: Object.freeze({
      id: 'dat-drag-set-frame-238',
      stopFrame: 238,
      resumeFrame: 239,
      completionDisposition: 'blocked-while-unresolved',
      requiresHostInteractiveStop: true,
    }),
  }),
  resetBoundary: Object.freeze({
    sourceInteractionEntryInitializes: Object.freeze({
      quizSection: true,
      quizDragCount: 0,
    }),
    sourceInteractionEntryInitializesQuizTryCount: false,
    modernReducerQuizTryCountReset: 0,
    disposition:
      'modern-product-reset-assumption-not-original-runtime-evidence',
  }),
  accessibility: Object.freeze({
    modernActivationInputs: Object.freeze(['mouse', 'Enter', ' '] as const),
    semantics:
      'Enter and Space provide an accessible pick-up/drop equivalent for the source mouse drag; they do not claim legacy keyboard parity.',
    legacyKeyboardParity: false,
  }),
  blockers: Object.freeze([
    'The page SWF has no FLA authoring source.',
    'The page does not contain its shell-owned selector; the maintained adapter is cross-bound to matching G3, G4, and G5 product-host evidence and does not claim Adobe random-state parity.',
    'Mc_Wrong_Feed4 is referenced by the reset loop but is not placed in the frame-238 feedback set.',
    'Feedback audio language, audible correctness, and original-runtime synchronization are unaccepted.',
    'Instructional strings and visual object meanings are outside this behavior-only IR.',
    'Enter/Space pick-up/drop is a modern accessibility extension; legacy keyboard parity is not proven.',
    'The source frame-238 entry resets quizDragCount but does not initialize quizTryCount; resetting quizTryCount to 0 on modern interaction reset is a product assumption and does not establish legacy Replay parity.',
  ]),
  acceptanceEffects: ADVANCED_MANUAL_ACCEPTANCE_EFFECTS,
});

export interface DatDragItemState {
  readonly targetId: DatTargetId;
  readonly locked: boolean;
  readonly atTarget: boolean;
}

export interface DatPendingFeedback {
  readonly kind: DatFeedbackKind;
  readonly domainId: DatFeedbackDomainId | null;
  readonly sourceId: DatSourceId;
}

export interface Dat001State {
  readonly phase:
    | 'selecting'
    | 'dragging'
    | 'feedback-pending-host'
    | 'feedback-active'
    | 'resumed';
  readonly mainFrame: 238 | 239;
  readonly mainPlaying: boolean;
  readonly quizSection: boolean;
  readonly quizDragCount: number;
  readonly quizTryCount: number;
  readonly items: Readonly<Record<DatSourceId, DatDragItemState>>;
  readonly activeSource: DatSourceId | null;
  readonly pendingFeedback: DatPendingFeedback | null;
  readonly replay: number;
  readonly blockedReason: string | null;
}

export type Dat001Event =
  | Readonly<{type: 'activate-source'; input: ActivationInput; sourceId: DatSourceId}>
  | Readonly<{type: 'drop-on-target'; input: ActivationInput; targetId: DatTargetId | null}>
  | Readonly<{type: 'resolve-feedback-domain'; domainId: DatFeedbackDomainId}>
  | Readonly<{type: 'feedback-finished'}>
  | Readonly<{type: 'replay'; input: ActivationInput}>;

function createItems(): Readonly<Record<DatSourceId, DatDragItemState>> {
  return Object.freeze(Object.fromEntries(
    SOURCE_IDS.map((sourceId) => [
      sourceId,
      Object.freeze({targetId: SOURCE_TARGETS[sourceId], locked: false, atTarget: false}),
    ]),
  ) as unknown as Record<DatSourceId, DatDragItemState>);
}

export function createDat001State(): Dat001State {
  return {
    phase: 'selecting',
    mainFrame: 238,
    mainPlaying: false,
    quizSection: true,
    quizDragCount: 0,
    quizTryCount: 0,
    items: createItems(),
    activeSource: null,
    pendingFeedback: null,
    replay: 0,
    blockedReason: null,
  };
}

function blocked(state: Dat001State, reason: string): Dat001State {
  return {...state, blockedReason: reason};
}

function feedbackDomain(id: DatFeedbackDomainId) {
  return DAT001_L05_P040_BEHAVIOR_IR_V1.feedbackAudioDomains.find(
    (candidate) => candidate.id === id,
  );
}

export function reduceDat001(state: Dat001State, event: Dat001Event): Dat001State {
  switch (event.type) {
    case 'activate-source':
      if (!isActivationInput(event.input)) return blocked(state, 'activation-input-unsupported');
      if (state.phase !== 'selecting') return blocked(state, 'drag-controls-disabled');
      if (state.items[event.sourceId].locked) return blocked(state, 'source-already-locked');
      return {
        ...state,
        phase: 'dragging',
        activeSource: event.sourceId,
        blockedReason: null,
      };
    case 'drop-on-target': {
      if (!isActivationInput(event.input)) return blocked(state, 'activation-input-unsupported');
      if (state.phase !== 'dragging' || !state.activeSource) {
        return blocked(state, 'source-not-active');
      }
      const sourceId = state.activeSource;
      const correct = event.targetId === state.items[sourceId].targetId;
      const items = correct
        ? Object.freeze({
            ...state.items,
            [sourceId]: Object.freeze({...state.items[sourceId], locked: true, atTarget: true}),
          })
        : state.items;
      return {
        ...state,
        phase: 'feedback-pending-host',
        items,
        quizDragCount: state.quizDragCount + (correct ? 1 : 0),
        activeSource: null,
        pendingFeedback: {kind: correct ? 'right' : 'wrong', domainId: null, sourceId},
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
        blockedReason: null,
      };
    }
    case 'feedback-finished': {
      const pending = state.pendingFeedback;
      if (state.phase !== 'feedback-active' || !pending?.domainId) {
        return blocked(state, 'host-feedback-variant-unresolved');
      }
      if (pending.kind === 'wrong') {
        return {
          ...state,
          phase: 'selecting',
          quizTryCount: state.quizTryCount + 1,
          pendingFeedback: null,
          blockedReason: null,
        };
      }
      if (state.quizDragCount >= 5) {
        return {
          ...state,
          phase: 'resumed',
          mainFrame: 239,
          mainPlaying: true,
          quizSection: false,
          pendingFeedback: null,
          blockedReason: null,
        };
      }
      return {
        ...state,
        phase: 'selecting',
        pendingFeedback: null,
        blockedReason: null,
      };
    }
    case 'replay':
      if (!isActivationInput(event.input)) return blocked(state, 'activation-input-unsupported');
      return {...createDat001State(), replay: state.replay + 1};
  }
}
