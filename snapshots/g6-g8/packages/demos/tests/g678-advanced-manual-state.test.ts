import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  ADVANCED_MANUAL_ACCEPTANCE_EFFECTS,
  type ActivationInput,
} from '../src/g678-advanced-manual/contracts';
import {
  GEO001_L01_P001_BEHAVIOR_IR_V1,
  createGeo001State,
  geoDraggerXForFrame,
  geoFrameForDraggerX,
  reduceGeo001,
} from '../src/g678-advanced-manual/geo001-l01-p001';
import {
  NMS002_L11_P030_BEHAVIOR_IR_V1,
  createNms002State,
  reduceNms002,
} from '../src/g678-advanced-manual/nms002-l11-p030';
import {
  DAT001_L05_P040_BEHAVIOR_IR_V1,
  createDat001State,
  reduceDat001,
  type DatFeedbackDomainId,
  type DatSourceId,
} from '../src/g678-advanced-manual/dat001-l05-p040';
import {
  HELP_MATH_HOST_FEEDBACK_SELECTOR_V1,
  selectHostFeedback,
} from '../src/g678-advanced-manual/host-feedback-selector';

const INPUTS: readonly ActivationInput[] = ['mouse', 'Enter', ' '];

test('product-host feedback selector is evidence-bound and exhausts only the shipped 3/4 branch sets', async () => {
  for (const evidence of HELP_MATH_HOST_FEEDBACK_SELECTOR_V1.evidence) {
    const bytes = await readFile(new URL(`../../../${evidence.path}`, import.meta.url));
    assert.equal(bytes.length, evidence.bytes, evidence.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),
      evidence.sha256, evidence.path);
  }
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5].map((seed) =>
      selectHostFeedback('wrong', seed).instanceName),
    [
      'Mc_Wrong_Feed1', 'Mc_Wrong_Feed2', 'Mc_Wrong_Feed3',
      'Mc_Wrong_Feed1', 'Mc_Wrong_Feed2', 'Mc_Wrong_Feed3',
    ],
  );
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 6, 7].map((seed) =>
      selectHostFeedback('right', seed).instanceName),
    [
      'Mc_Right_Feed1', 'Mc_Right_Feed2', 'Mc_Right_Feed3',
      'Mc_Right_Feed4', 'Mc_Right_Feed1', 'Mc_Right_Feed2',
      'Mc_Right_Feed3', 'Mc_Right_Feed4',
    ],
  );
  assert.equal(
    HELP_MATH_HOST_FEEDBACK_SELECTOR_V1.authoritativeAdobeRandomStateAccepted,
    false,
  );
});

test('all three compact IRs bind exact source/report identities and keep every downstream gate false', () => {
  const specifications = [
    GEO001_L01_P001_BEHAVIOR_IR_V1,
    NMS002_L11_P030_BEHAVIOR_IR_V1,
    DAT001_L05_P040_BEHAVIOR_IR_V1,
  ];

  assert.deepEqual(
    specifications.map((specification) => specification.animationId),
    [
      'shared-geo001-l01-p001',
      'shared-nms002-l11-p030',
      'shared-dat001-l05-p040',
    ],
  );
  assert.deepEqual(
    specifications.map((specification) => specification.source.sha256),
    [
      '3034f4bb5df7a2033a57aacf8de5ba1cbda5add4c2d30a7987bac0769403b226',
      '853d0c3350fc1c39dfc730eb369041d91565003b6bdeed238aece874b2e06913',
      '0945d41f55d2c0746ccd4e7d820983f3eea2c49bf9c54e1f6174f5ee33d420f6',
    ],
  );
  for (const specification of specifications) {
    assert.equal(specification.schemaVersion, 1);
    assert.equal(specification.lane, 'behavior-heavy');
    assert.equal(
      specification.structuralEvidence.report.sha256,
      'af830040388dd502ca193f482f084a9db49da2176e26ed39ebe7e01f5e706b97',
    );
    assert.deepEqual(specification.acceptanceEffects, ADVANCED_MANUAL_ACCEPTANCE_EFFECTS);
    assert.ok(Object.values(specification.acceptanceEffects).every((value) => value === false));
  }
});

test('GEO progress state preserves the source 110px seek formula and nonterminal resume rule', () => {
  assert.equal(geoFrameForDraggerX(0), 1);
  assert.equal(geoFrameForDraggerX(55), 64);
  assert.equal(geoFrameForDraggerX(110), 127);
  assert.equal(geoDraggerXForFrame(127), 110);
  assert.equal(geoDraggerXForFrame(1), 110 / 127);

  let state = createGeo001State();
  state = reduceGeo001(state, {type: 'begin-seek', input: 'mouse'});
  assert.equal(state.progressMode, 'moveMedia');
  assert.equal(state.mediaPlaying, false);
  state = reduceGeo001(state, {type: 'drag-seek', x: 55});
  assert.equal(state.mediaFrame, 64);
  state = reduceGeo001(state, {type: 'release-seek', input: 'mouse'});
  assert.equal(state.progressMode, 'mediaPlaying');
  assert.equal(state.mediaPlaying, true);

  state = reduceGeo001(state, {type: 'click-seek', input: 'mouse', x: 110});
  assert.equal(state.mediaFrame, 127);
  assert.equal(state.mediaPlaying, false);
});

test('GEO mouse, Enter, and Space activation produce identical seek and Replay state', () => {
  const seek = (input: ActivationInput) => {
    let state = createGeo001State();
    state = reduceGeo001(state, {type: 'begin-seek', input});
    state = reduceGeo001(state, {type: 'drag-seek', x: 42});
    return reduceGeo001(state, {type: 'release-seek', input});
  };
  assert.deepEqual(seek('mouse'), seek('Enter'));
  assert.deepEqual(seek('mouse'), seek(' '));

  const replayed = INPUTS.map((input) => reduceGeo001(seek(input), {type: 'replay', input}));
  assert.deepEqual(replayed[0], replayed[1]);
  assert.deepEqual(replayed[0], replayed[2]);
  assert.deepEqual(replayed[0], {...createGeo001State(), replay: 1});
});

test('GEO FUI math stays inventory-only because page attachment is unproven', () => {
  assert.equal(
    GEO001_L01_P001_BEHAVIOR_IR_V1.fuiScroll.reachability,
    'exported-linkage-only-not-proven-placed-in-sprite-142',
  );
  assert.equal(GEO001_L01_P001_BEHAVIOR_IR_V1.fuiScroll.productControlEnabled,
    false);
  let state = createGeo001State();
  state = reduceGeo001(state, {
    type: 'configure-scroll',
    pageSize: 10,
    minPosition: 1,
    maxPosition: 51,
    position: 1,
    smallScroll: 2,
  });
  assert.equal(state.scroll.scrollable, false);
  assert.equal(state.blockedReason, 'fui-linkage-placement-unproven');
  const unreachable = reduceGeo001(createGeo001State(), {
    type: 'scroll-small',
    input: 'mouse',
    direction: 1,
  });
  assert.equal(unreachable.blockedReason, 'fui-linkage-placement-unproven');
});

test('NMS IR exposes exactly four answers and nine unaccepted feedback-audio domains', () => {
  assert.equal(NMS002_L11_P030_BEHAVIOR_IR_V1.runtime.mainFrameDomain.objectId, 260);
  assert.equal(NMS002_L11_P030_BEHAVIOR_IR_V1.runtime.mainFrameDomain.frameCount, 356);
  assert.equal(NMS002_L11_P030_BEHAVIOR_IR_V1.question.correctAnswerId, 'AnsBtn1');
  assert.equal(NMS002_L11_P030_BEHAVIOR_IR_V1.question.answerButtons.length, 4);
  assert.equal(NMS002_L11_P030_BEHAVIOR_IR_V1.feedbackAudioDomains.length, 9);
  assert.equal(
    NMS002_L11_P030_BEHAVIOR_IR_V1.feedbackAudioDomains.filter(({kind}) => kind === 'wrong').length,
    4,
  );
  assert.equal(
    NMS002_L11_P030_BEHAVIOR_IR_V1.feedbackAudioDomains.filter(({kind}) => kind === 'right').length,
    5,
  );
  assert.ok(
    NMS002_L11_P030_BEHAVIOR_IR_V1.feedbackAudioDomains.every(
      ({soundStreamHeadCount, audioAccepted}) => soundStreamHeadCount === 1 && audioAccepted === false,
    ),
  );
});

test('NMS wrong answers require host-resolved feedback, retry once, then resume on attempt two', () => {
  let state = createNms002State();
  state = reduceNms002(state, {type: 'choose-answer', input: 'mouse', answerId: 'AnsBtn2'});
  assert.equal(state.phase, 'feedback-pending-host');
  assert.equal(state.quizTryCount, 1);
  assert.match(state.wrongFeedbackText ?? '', /Try again\.$/u);

  const unresolved = reduceNms002(state, {type: 'feedback-finished'});
  assert.equal(unresolved.blockedReason, 'host-feedback-variant-unresolved');
  const mismatched = reduceNms002(state, {
    type: 'resolve-feedback-domain',
    domainId: 'Mc_Right_Feed1',
  });
  assert.equal(mismatched.blockedReason, 'feedback-domain-kind-mismatch');

  state = reduceNms002(state, {type: 'resolve-feedback-domain', domainId: 'Mc_Wrong_Feed1'});
  const dismissalRequired = reduceNms002(state, {type: 'feedback-finished'});
  assert.equal(dismissalRequired.blockedReason, 'wrong-feedback-dismissal-required');
  state = reduceNms002(state, {type: 'dismiss-wrong-feedback', input: 'Enter'});
  state = reduceNms002(state, {type: 'feedback-finished'});
  assert.equal(state.phase, 'selecting');
  assert.equal(state.quizTryCount, 1);

  state = reduceNms002(state, {type: 'choose-answer', input: ' ', answerId: 'AnsBtn3'});
  assert.equal(state.quizTryCount, 2);
  assert.doesNotMatch(state.wrongFeedbackText ?? '', /Try again/u);
  state = reduceNms002(state, {type: 'resolve-feedback-domain', domainId: 'Mc_Wrong_Feed4'});
  state = reduceNms002(state, {type: 'dismiss-wrong-feedback', input: 'mouse'});
  state = reduceNms002(state, {type: 'feedback-finished'});
  assert.equal(state.phase, 'resumed');
  assert.equal(state.mainFrame, 98);
  assert.equal(state.mainPlaying, true);
  assert.equal(state.quizSection, false);
  assert.equal(state.quizTryCount, 0);
});

test('NMS correct answer, hint, and Replay support equivalent mouse/Enter/Space semantics', () => {
  const chooseCorrect = (input: ActivationInput) =>
    reduceNms002(createNms002State(), {type: 'choose-answer', input, answerId: 'AnsBtn1'});
  assert.deepEqual(chooseCorrect('mouse'), chooseCorrect('Enter'));
  assert.deepEqual(chooseCorrect('mouse'), chooseCorrect(' '));

  let state = createNms002State();
  state = reduceNms002(state, {type: 'open-hint', input: 'Enter'});
  assert.equal(state.phase, 'hint-open');
  assert.equal(state.answerControlsEnabled, false);
  state = reduceNms002(state, {type: 'close-hint', input: ' '});
  assert.equal(state.phase, 'selecting');

  state = reduceNms002(state, {type: 'choose-answer', input: 'mouse', answerId: 'AnsBtn1'});
  state = reduceNms002(state, {type: 'resolve-feedback-domain', domainId: 'Mc_Right_Feed5'});
  state = reduceNms002(state, {type: 'feedback-finished'});
  assert.equal(state.phase, 'resumed');
  assert.equal(state.quizSection, false);

  const replayed = INPUTS.map((input) => reduceNms002(state, {type: 'replay', input}));
  assert.deepEqual(replayed[0], replayed[1]);
  assert.deepEqual(replayed[0], replayed[2]);
  assert.deepEqual(replayed[0], {...createNms002State(), replay: 1});
});

test('DAT IR binds five suffix-matched drag targets and seven unaccepted feedback-audio domains', () => {
  assert.equal(DAT001_L05_P040_BEHAVIOR_IR_V1.runtime.mainFrameDomain.objectId, 315);
  assert.equal(DAT001_L05_P040_BEHAVIOR_IR_V1.runtime.mainFrameDomain.frameCount, 254);
  assert.equal(DAT001_L05_P040_BEHAVIOR_IR_V1.dragDrop.sources.length, 5);
  assert.equal(DAT001_L05_P040_BEHAVIOR_IR_V1.dragDrop.targets.length, 5);
  assert.deepEqual(
    DAT001_L05_P040_BEHAVIOR_IR_V1.dragDrop.sources.map(({id, targetId}) => [id, targetId]),
    [
      ['Src_1', 'Tar_1'],
      ['Src_2', 'Tar_2'],
      ['Src_3', 'Tar_3'],
      ['Src_4', 'Tar_4'],
      ['Src_5', 'Tar_5'],
    ],
  );
  assert.equal(DAT001_L05_P040_BEHAVIOR_IR_V1.feedbackAudioDomains.length, 7);
  assert.equal(
    DAT001_L05_P040_BEHAVIOR_IR_V1.feedbackAudioDomains.filter(({kind}) => kind === 'wrong').length,
    3,
  );
  assert.equal(
    DAT001_L05_P040_BEHAVIOR_IR_V1.feedbackAudioDomains.filter(({kind}) => kind === 'right').length,
    4,
  );
  assert.ok(
    DAT001_L05_P040_BEHAVIOR_IR_V1.feedbackAudioDomains.every(
      ({soundStreamHeadCount, audioAccepted}) => soundStreamHeadCount === 1 && audioAccepted === false,
    ),
  );
  assert.equal(
    DAT001_L05_P040_BEHAVIOR_IR_V1.resetBoundary
      .sourceInteractionEntryInitializesQuizTryCount,
    false,
  );
  assert.equal(
    DAT001_L05_P040_BEHAVIOR_IR_V1.resetBoundary.disposition,
    'modern-product-reset-assumption-not-original-runtime-evidence',
  );
});

test('DAT wrong drop restores the item and increments quizTryCount only after feedback completes', () => {
  let state = createDat001State();
  state = reduceDat001(state, {type: 'activate-source', input: 'mouse', sourceId: 'Src_1'});
  state = reduceDat001(state, {type: 'drop-on-target', input: 'mouse', targetId: 'Tar_2'});
  assert.equal(state.phase, 'feedback-pending-host');
  assert.equal(state.quizDragCount, 0);
  assert.equal(state.quizTryCount, 0);
  assert.equal(state.items.Src_1.locked, false);
  assert.equal(state.items.Src_1.atTarget, false);

  state = reduceDat001(state, {type: 'resolve-feedback-domain', domainId: 'Mc_Wrong_Feed2'});
  state = reduceDat001(state, {type: 'feedback-finished'});
  assert.equal(state.phase, 'selecting');
  assert.equal(state.quizTryCount, 1);
});

test('DAT requires a matching host feedback domain and resumes only after all five correct drops', () => {
  const rightDomains: readonly DatFeedbackDomainId[] = [
    'Mc_Right_Feed1',
    'Mc_Right_Feed2',
    'Mc_Right_Feed3',
    'Mc_Right_Feed4',
    'Mc_Right_Feed1',
  ];
  const pairs = [
    ['Src_1', 'Tar_1'],
    ['Src_2', 'Tar_2'],
    ['Src_3', 'Tar_3'],
    ['Src_4', 'Tar_4'],
    ['Src_5', 'Tar_5'],
  ] as const satisfies readonly (readonly [DatSourceId, string])[];

  let state = createDat001State();
  for (let index = 0; index < pairs.length; index += 1) {
    const [sourceId, targetId] = pairs[index];
    state = reduceDat001(state, {type: 'activate-source', input: 'Enter', sourceId});
    state = reduceDat001(state, {type: 'drop-on-target', input: ' ', targetId});
    assert.equal(state.quizDragCount, index + 1);
    if (index === 0) {
      const mismatched = reduceDat001(state, {
        type: 'resolve-feedback-domain',
        domainId: 'Mc_Wrong_Feed1',
      });
      assert.equal(mismatched.blockedReason, 'feedback-domain-kind-mismatch');
    }
    state = reduceDat001(state, {
      type: 'resolve-feedback-domain',
      domainId: rightDomains[index],
    });
    state = reduceDat001(state, {type: 'feedback-finished'});
  }

  assert.equal(state.phase, 'resumed');
  assert.equal(state.mainFrame, 239);
  assert.equal(state.mainPlaying, true);
  assert.equal(state.quizSection, false);
  assert.ok(Object.values(state.items).every(({locked, atTarget}) => locked && atTarget));
});

test('DAT mouse, Enter, and Space semantics match; modern reset is explicitly acceptance-neutral', () => {
  const oneCorrectDrop = (input: ActivationInput) => {
    let state = createDat001State();
    state = reduceDat001(state, {type: 'activate-source', input, sourceId: 'Src_4'});
    return reduceDat001(state, {type: 'drop-on-target', input, targetId: 'Tar_4'});
  };
  assert.deepEqual(oneCorrectDrop('mouse'), oneCorrectDrop('Enter'));
  assert.deepEqual(oneCorrectDrop('mouse'), oneCorrectDrop(' '));

  let state = oneCorrectDrop('mouse');
  state = reduceDat001(state, {type: 'resolve-feedback-domain', domainId: 'Mc_Right_Feed3'});
  state = reduceDat001(state, {type: 'feedback-finished'});
  const locked = reduceDat001(state, {type: 'activate-source', input: 'mouse', sourceId: 'Src_4'});
  assert.equal(locked.blockedReason, 'source-already-locked');

  const replayed = INPUTS.map((input) => reduceDat001(state, {type: 'replay', input}));
  assert.deepEqual(replayed[0], replayed[1]);
  assert.deepEqual(replayed[0], replayed[2]);
  assert.deepEqual(replayed[0], {...createDat001State(), replay: 1});
  assert.equal(DAT001_L05_P040_BEHAVIOR_IR_V1.acceptanceEffects.originalRuntimeAccepted,
    false);
});
