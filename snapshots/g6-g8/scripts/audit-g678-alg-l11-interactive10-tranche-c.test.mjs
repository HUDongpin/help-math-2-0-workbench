import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  assertSourceTryMutationOrdering,
  auditG678AlgL11Interactive10TrancheC,
  deriveSourceWrongAttemptSequence,
  OUTPUT,
  prepareG678AlgL11Interactive10TrancheCAudit,
  validateInteractive10Audit,
} from './audit-g678-alg-l11-interactive10-tranche-c.mjs';

const SOURCE_ROOT =
  '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
process.env.HELP_MATH_G678_SOURCE_ROOT = SOURCE_ROOT;

const prepared = await prepareG678AlgL11Interactive10TrancheCAudit();

function clone() {
  return structuredClone(prepared.artifact);
}

test('interactive10 tranche-c prepares exact source audit with every gate closed',
  async () => {
    const artifact = prepared.artifact;
    assert.equal(await validateInteractive10Audit(artifact), true);
    assert.equal(artifact.auditedPlacementCount, 10);
    assert.deepEqual(artifact.familyCounts, {
      'l11-random-audio-label-timeline': 1,
      'l11-choice-feedback-practice': 7,
      'l11-two-try-need-more-help': 2,
    });
    assert.equal(artifact.physicalAudioIdentityVerifiedCount, 10);
    assert.equal(artifact.audioAcceptedCount, 0);
    assert.equal(artifact.choiceNeedMoreHelpControlPlacementCount, 1);
    assert.equal(artifact.choiceNeedMoreHelpTextPlacementCount, 2);
    assert.equal(artifact.sourceAuditP0Count, 0);
    assert.equal(artifact.sourceAuditP1Count, 0);
    assert.equal(artifact.independentReviewPassed, false);
    assert.equal(artifact.candidateImplementationAuthorized, false);
    assert.equal(artifact.registrationCandidatePlacementCount, 0);
    assert.equal(artifact.currentJavaScriptRegisteredPlacementCount, 0);
    assert.equal(artifact.productCalibrationPassed, false);
    assert.equal(artifact.browserCalibrationPassed, false);
    assert.ok(Object.values(artifact.acceptanceEffects).every((value) =>
      value === false));
  });

test('source try ordering preserves all three literal mutation phases', () => {
  assert.deepEqual(deriveSourceWrongAttemptSequence({
    tryMutationModel: 'feedback-endpoint', baseWrongText: 'base',
    retryWrongText: 'retry',
  }), [
    {attempt: 1, text: 'retry', afterSelection: 0,
      afterFeedbackEndpoint: 1, resumesParent: false},
    {attempt: 2, text: 'base', afterSelection: 1,
      afterFeedbackEndpoint: 0, resumesParent: true},
  ]);
  assert.deepEqual(deriveSourceWrongAttemptSequence({
    tryMutationModel: 'selection', baseWrongText: 'base',
    retryWrongText: 'retry',
  }), [
    {attempt: 1, text: 'retry', afterSelection: 1,
      afterFeedbackEndpoint: 1, resumesParent: false},
    {attempt: 2, text: 'base', afterSelection: 2,
      afterFeedbackEndpoint: 0, resumesParent: true},
  ]);
  assert.deepEqual(deriveSourceWrongAttemptSequence({
    tryMutationModel: 'p021-split', baseWrongText: 'base',
    retryWrongText: 'retry',
  }), [
    {attempt: 1, text: 'retry', afterSelection: 0,
      afterFeedbackEndpoint: 1, resumesParent: false},
    {attempt: 2, text: 'base', afterSelection: 2,
      afterFeedbackEndpoint: 0, resumesParent: true},
  ]);
  assert.throws(() => deriveSourceWrongAttemptSequence({
    tryMutationModel: 'normalized-generic', baseWrongText: 'base',
    retryWrongText: 'retry',
  }), /unknown source try mutation model/u);

  const feedbackConfig = {tryMutationModel: 'feedback-endpoint',
    baseWrongText: 'base', retryWrongText: 'retry'};
  const feedbackWrong = 'if(_global.quizTryCount == 1)\n' +
    '_global.WrongFeed = "base";\n_global.WrongFeed = "retry";\n' +
    '_root.disableQuizButton();\n_root.showWrongFeed();';
  const incrementEndpoint = '_root.enableQuizButton();\n' +
    '_global.quizTryCount++;\nif(_global.quizTryCount >= 2)\n' +
    '_global.quizTryCount = 0;\n_global.quizSection = false;\n_parent.play();';
  assert.equal(assertSourceTryMutationOrdering(feedbackConfig,
    [feedbackWrong], Array(3).fill(incrementEndpoint)), true);
  assert.throws(() => assertSourceTryMutationOrdering(feedbackConfig,
    [feedbackWrong.replace('_root.disableQuizButton();\n', '')],
    Array(3).fill(incrementEndpoint)), /ordering drifted/u);
  assert.throws(() => assertSourceTryMutationOrdering(feedbackConfig,
    [feedbackWrong], Array(3).fill(incrementEndpoint.replace(
      '_global.quizTryCount++;\nif', 'if') + '\n_global.quizTryCount++;')),
  /ordering drifted/u);

  const selectionConfig = {tryMutationModel: 'selection',
    baseWrongText: 'base', retryWrongText: 'retry'};
  const selectionWrong = '_global.quizTryCount++;\n' +
    'if(_global.quizTryCount == 1)\n' +
    '_global.WrongFeed = "retry";\n_global.WrongFeed = "base";\n' +
    '_root.disableQuizButton();\n_root.showWrongFeed();';
  const selectionEndpoint = '_root.enableQuizButton();\n' +
    'if(_global.quizTryCount >= 2)\n_global.quizTryCount = 0;\n' +
    '_global.quizSection = false;\n_parent.play();';
  assert.equal(assertSourceTryMutationOrdering(selectionConfig,
    [selectionWrong], Array(3).fill(selectionEndpoint)), true);
  assert.throws(() => assertSourceTryMutationOrdering(selectionConfig,
    [selectionWrong.replace('_global.quizTryCount++;\n', '') +
      '\n_global.quizTryCount++;'], Array(3).fill(selectionEndpoint)),
  /ordering drifted/u);

  const splitConfig = {tryMutationModel: 'p021-split',
    baseWrongText: 'base', retryWrongText: 'retry'};
  const splitWrong = 'if(_global.quizTryCount == 1)\n' +
    '_global.quizTryCount++;\n_global.WrongFeed = "base";\n' +
    '_global.WrongFeed = "retry";\n_root.disableQuizButton();\n' +
    '_root.showWrongFeed();';
  assert.equal(assertSourceTryMutationOrdering(splitConfig,
    [splitWrong], Array(3).fill(incrementEndpoint)), true);
  assert.throws(() => assertSourceTryMutationOrdering(splitConfig,
    [splitWrong.replace('_global.WrongFeed = "base";\n', '') +
      '\n_global.WrongFeed = "base";'], Array(3).fill(incrementEndpoint)),
  /ordering drifted/u);
});

test('checker rejects schema, set, geometry, audio, blocker, and gate substitution',
  async () => {
  const mutations = [
    (value) => value.members.reverse(),
    (value) => {
      value.exactPlacementIds.reverse();
    },
    (value) => {
      const values = value.members[1].sourceContract.geometry.optionSlots[0]
        .visibleTextValues;
      values[0] = 'X'.repeat(values[0].length);
    },
    (value) => {
      value.members[6].sourceContract.geometry.optionSlots[0]
        .visibleObjects[0].transY += 1;
    },
    (value) => {
      const objects = value.members[7].sourceContract.geometry.optionSlots[0]
        .visibleObjects.flatMap((object) => object.reachableObjects);
      const shape = objects.find((object) => object.shapeSha256);
      assert.ok(shape);
      shape.shapeSha256 = '0'.repeat(64);
    },
    (value) => {
      value.members[1].sourceContract.tryMutationModel = 'selection';
    },
    (value) => {
      value.choiceNeedMoreHelpControlPlacementCount = 2;
    },
    (value) => {
      value.members[4].sourceContract.needMoreHelp.popupSprite.objectId = 18;
    },
    (value) => {
      value.members[4].sourceContract.needMoreHelp.textPlacements[0]
        .text.sha256 = '0'.repeat(64);
    },
    (value) => {
      value.members[4].sourceContract.needMoreHelp.textPlacements[1]
        .text.records.reverse();
    },
    (value) => {
      value.members[4].sourceContract.needMoreHelp.visibilityLifecycle
        .openScript.sha256 = '0'.repeat(64);
    },
    (value) => {
      value.members[1].sourceContract.needMoreHelp = {};
    },
    (value) => {
      value.members[0].sourceContract.labelWindows[0].startFrame = 4;
    },
    (value) => {
      value.members[2].sourceContract.runtimeParentBindingEstablished = true;
    },
    (value) => {
      value.members[2].sourceContract.sourceParentChain.nestedToPopup.frame = 39;
    },
    (value) => {
      value.members[3].sourceContract.sourceParentChain.popupToCloseButton
        .name = 'OtherClose';
    },
    (value) => {
      value.members[9].physicalAudioCandidate.sha256 = '0'.repeat(64);
    },
    (value) => {
      value.members[1].exactScriptInventory.checksumSetSha256 = '0'.repeat(64);
    },
    (value) => {
      value.members[1].exactTextInventory.fileCount -= 1;
    },
    (value) => {
      value.members[2].diagnosticEvidence.sourceXml.sha256 = '0'.repeat(64);
    },
    (value) => {
      value.members[2].diagnosticEvidence.frozenTree.checksumSetSha256 =
        '0'.repeat(64);
    },
    (value) => {
      value.members[1].sourceContract.correctScript.sha256 = '0'.repeat(64);
    },
    (value) => {
      value.members[1].sourceContract.wrongScripts[0].path =
        'DefineButton2_999/BUTTONCONDACTION on(release).as';
    },
    (value) => {
      value.members[1].sourceContract.tryMutationOrdering
        .wrongScriptSequenceSha256 = '0'.repeat(64);
    },
    (value) => {
      value.members[2].sourceContract.sourceParentChain.mainToNested
        .placementFragmentSha256 = '0'.repeat(64);
    },
    (value) => {
      value.members[2].sourceContract.closeButton.script.sha256 =
        '0'.repeat(64);
    },
    (value) => {
      value.limitations.pop();
    },
    (value) => {
      value.inputs.residualBuilder.bytes += 1;
    },
    (value) => {
      value.inputs.residualBuilder.unexpected = true;
    },
    (value) => {
      value.inputs.generator.bytes += 1;
    },
    (value) => {
      value.inputs.generator.sha256 = '0'.repeat(64);
    },
    (value) => {
      value.inputs.generator.unexpected = true;
    },
    (value) => {
      value.inputs.sourceRoot.unexpected = true;
    },
    (value) => {
      value.physicalAudioIdentityVerifiedCount = 0;
    },
    (value) => {
      value.audioAcceptedCount = 1;
    },
    (value) => {
      value.members[4].registrationCandidate = true;
    },
    (value) => {
      value.wholeLessonEngineeringPreviewReady = true;
    },
    (value) => {
      value.members[1].productBlockers.pop();
    },
    (value) => {
      value.acceptanceEffects.audioAccepted = true;
    },
    (value) => {
      value.unexpected = true;
    },
  ];
  for (const mutate of mutations) {
    const value = clone();
    mutate(value);
    await assert.rejects(() => validateInteractive10Audit(value), /drifted/u);
  }
  const pairedForgery = clone();
  pairedForgery.inputs.generator.bytes += 1;
  pairedForgery.inputs.generator.sha256 = '0'.repeat(64);
  const forgedExpectedGenerator = structuredClone(
    pairedForgery.inputs.generator);
  await assert.rejects(() => validateInteractive10Audit(pairedForgery,
    forgedExpectedGenerator), /drifted/u);
  });

test('p011 alone binds exact source Need More Help popup and visible text', () => {
  const choices = prepared.artifact.members.filter((member) =>
    member.sourceContract.kind === 'choice-feedback-practice');
  const p011 = choices.find((member) =>
    member.animationId === 'shared-alg001-l11-p011');
  assert.ok(p011);
  assert.deepEqual(choices.map((member) => ({id: member.animationId,
    scripts: member.sourceContract.needMoreHelpScripts.length,
    hasHelp: member.sourceContract.needMoreHelp !== null})), [
    {id: 'shared-alg001-l11-p008', scripts: 0, hasHelp: false},
    {id: 'shared-alg001-l11-p011', scripts: 2, hasHelp: true},
    {id: 'shared-alg001-l11-p014', scripts: 0, hasHelp: false},
    {id: 'shared-alg001-l11-p019', scripts: 0, hasHelp: false},
    {id: 'shared-alg001-l11-p020', scripts: 0, hasHelp: false},
    {id: 'shared-alg001-l11-p021', scripts: 0, hasHelp: false},
    {id: 'shared-alg001-l11-p025', scripts: 0, hasHelp: false},
  ]);
  assert.deepEqual(p011.sourceContract.needMoreHelp.popupSprite,
    {objectId: 17, frameCount: 1, exportName: 'show mc1_new_001'});
  assert.deepEqual(p011.sourceContract.needMoreHelp.textPlacements.map(
    (placement) => ({depth: placement.depth, objectId: placement.objectId,
      path: placement.text.path, bytes: placement.text.bytes,
      sha256: placement.text.sha256, visibleText: placement.text.visibleText})), [
    {depth: 3, objectId: 10, path: '10.txt', bytes: 55,
      sha256: '789a442b0090f9537d1efa7b97cd6075ef43001ccd8618580ffb28f47d6cee2e',
      visibleText: 'Use the rules of inequalities to find the solution set.'},
    {depth: 4, objectId: 11, path: '11.txt', bytes: 407,
      sha256: '7f7f7b0c92b237a145d964ca4e70b08bfd6d242b2f594f153629d072f4f771ed',
      visibleText: 'Inequality Rule 3: You can multiply or divide both sides ' +
        'of an inequality by any negative number but you must reverse the ' +
        'direction of the inequality symbol.'},
  ]);
  assert.deepEqual(p011.sourceContract.needMoreHelp.visibilityLifecycle, {
    openScript: p011.sourceContract.needMoreHelpScripts[0],
    closeScript: p011.sourceContract.needMoreHelpScripts[1],
    openDisablesQuiz: true, openShowsPopupAndCloseButton: true,
    closeEnablesQuiz: true, closeHidesPopupAndCloseButton: true,
  });
});

test('choice audit binds 28 source-derived geometry slots and exact correct hit targets',
  () => {
  const actual = Object.fromEntries(prepared.artifact.members
    .filter((member) => member.sourceContract.kind ===
      'choice-feedback-practice')
    .map((member) => [member.animationId,
      member.sourceContract.geometry.optionSlots.find((slot) =>
        slot.present && slot.correct).slot]));
  assert.deepEqual(actual, {
    'shared-alg001-l11-p008': 'B',
    'shared-alg001-l11-p011': 'C',
    'shared-alg001-l11-p014': 'D',
    'shared-alg001-l11-p019': 'A',
    'shared-alg001-l11-p020': 'B',
    'shared-alg001-l11-p021': 'B',
    'shared-alg001-l11-p025': 'B',
  });
  assert.equal(prepared.artifact.choiceLogicalOptionSlotCount, 28);
  assert.equal(prepared.artifact.choicePresentOptionCount, 23);
  assert.equal(prepared.artifact.choiceAbsentOptionCount, 5);
  for (const page of prepared.artifact.members.filter((member) =>
    member.sourceContract.kind === 'choice-feedback-practice')) {
    assert.equal(page.sourceContract.geometry.optionSlots.length, 4);
    for (const slot of page.sourceContract.geometry.optionSlots.filter(
      (candidate) => candidate.present)) {
      assert.match(slot.geometrySha256, /^[0-9a-f]{64}$/u);
      assert.ok(slot.hitTarget.reachableObjects.some((object) =>
        object.shapeSha256 || object.type === 'DefineButton2'));
      assert.ok(slot.visibleObjects.some((object) =>
        object.reachableObjects.some((reachable) =>
          reachable.text || reachable.shapeSha256)));
    }
  }
  });

test('p006 random labels bind exact stream windows but no Replay or listening claim',
  () => {
    const page = prepared.artifact.members[0];
    assert.deepEqual(page.sourceContract.labelWindows, [
      {label: 'S1', startFrame: 3, returnFrame: 16,
        soundStreamBlockCount: 15},
      {label: 'S2', startFrame: 18, returnFrame: 27,
        soundStreamBlockCount: 13},
      {label: 'S3', startFrame: 31, returnFrame: 36,
        soundStreamBlockCount: 9},
      {label: 'S4', startFrame: 40, returnFrame: 54,
        soundStreamBlockCount: 16},
    ]);
    assert.equal(page.sourceContract.embeddedAudioStructure
      .listeningAcceptancePassed, false);
    assert.match(page.sourceContract.deterministicImplementationBoundary,
      /Replay seed policy is not authorized/u);
  });

test('p009 and p010 preserve the static _parent ambiguity as a product blocker',
  () => {
    for (const id of ['shared-alg001-l11-p009',
      'shared-alg001-l11-p010']) {
      const page = prepared.artifact.members.find((member) =>
        member.animationId === id);
      assert.equal(page.sourceContract.runtimeParentBindingEstablished, false);
      assert.deepEqual(page.sourceContract.nestedTimeline.stopFrames, [1, 64]);
      assert.equal(page.sourceContract.nestedTimeline.closeTargetFrame, 65);
      assert.equal(page.sourceContract.nestedTimeline.completionFrame, 70);
      assert.equal(page.sourceContract.sourceParentChain.popupFrameCount, 1);
      assert.equal(page.sourceContract.sourceParentChain.nestedToPopup.frame,
        38);
      assert.equal(page.sourceContract.sourceParentChain
        .popupToCloseButton.frame, 1);
      assert.equal(page.sourceContract.sourceParentChain
        .popupToCloseButton.depth, 1);
      assert.equal(page.sourceContract.sourceParentChain
        .popupToCloseButton.name, 'BtnClose');
      assert.match(page.sourceContract.runtimeParentBindingBlocker,
        /physically nested in the one-frame popup sprite/u);
    }
  });

test('semantic reuse is diff-only and never assumes ALG L9 equivalence', () => {
  assert.deepEqual(prepared.artifact.semanticReuse, {
    algL09AssumedEquivalent: false,
    reuseAuthorized: false,
    exactSemanticDiffRequired: true,
  });
  for (const member of prepared.artifact.members) {
    assert.equal(member.semanticReuseBoundary.reuseAuthorized, false);
    assert.ok(member.semanticReuseBoundary.differences.length >= 2);
  }
});

test('canonical audit is exact prepared bytes and self-checks', async () => {
  const current = await readFile(new URL(`../${OUTPUT}`, import.meta.url));
  assert.deepEqual(current, prepared.bytes);
  const result = await auditG678AlgL11Interactive10TrancheC({check: true});
  assert.equal(result.check, true);
  assert.equal(result.auditedPlacementCount, 10);
  assert.equal(result.sourceAuditP0Count, 0);
  assert.equal(result.sourceAuditP1Count, 0);
  assert.equal(result.registrationCandidatePlacementCount, 0);
  assert.equal(result.productCalibrationPassed, false);
  assert.equal(result.browserCalibrationPassed, false);
});
