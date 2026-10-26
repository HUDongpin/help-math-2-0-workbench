import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  auditG678AlgL11Behavior10TrancheB,
  deriveAnswerRowCrosswalk,
  deriveCaseSensitivePopupCrosswalk,
  deriveP029FeedbackSequence,
  deriveVisibleLabelTextCrosswalk,
} from './audit-g678-alg-l11-behavior10-tranche-b.mjs';

const SOURCE_ROOT =
  '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ARTIFACT = new URL(
  '../catalog/g678-alg-l11-behavior10-tranche-b-audit-v1.json',
  import.meta.url);

function answerUse(instanceName, characterId, y) {
  return `<use ffdec:characterId="${characterId}" height="38.0" ` +
    `id="${instanceName}" transform="matrix(1.0, 0.0, 0.0, 1.0, ` +
    `200.0, ${y})" width="124.0" xlink:href="#button1"/>`;
}

test('answer row crosswalk resolves TS AnsBtn1 to visible C by exact Y order',
  () => {
    const svg = [
      answerUse('AnsBtn1', 300, 46.8),
      answerUse('AnsBtn2', 301, 110.95),
      answerUse('AnsBtn3', 301, -82.6),
      answerUse('AnsBtn4', 301, -19.6),
    ].join('\n');
    const rows = deriveAnswerRowCrosswalk(svg, {
      rightInstance: 'AnsBtn1',
      visibleOrder: ['AnsBtn3', 'AnsBtn4', 'AnsBtn1', 'AnsBtn2'],
      correctLabel: 'C',
    });
    assert.deepEqual(rows.map((row) => [row.visibleLabel, row.instanceName,
      row.correct]), [
      ['A', 'AnsBtn3', false],
      ['B', 'AnsBtn4', false],
      ['C', 'AnsBtn1', true],
      ['D', 'AnsBtn2', false],
    ]);
    assert.throws(() => deriveAnswerRowCrosswalk(svg.replace(
      'id="AnsBtn4"', 'id="AnsBtn1"'), {
      rightInstance: 'AnsBtn1',
    }), /four unique instance names/u);
    assert.throws(() => deriveAnswerRowCrosswalk(svg.replace(
      '110.95', '46.8'), {rightInstance: 'AnsBtn1'}),
    /four unique instance names and Y positions/u);
    assert.throws(() => deriveAnswerRowCrosswalk(svg, {
      rightInstance: 'AnsBtn1',
      visibleOrder: ['AnsBtn1', 'AnsBtn2', 'AnsBtn3', 'AnsBtn4'],
    }), /visible row order drifted/u);
  });

test('visible A-D text objects are independently bound to matching hit rows',
  () => {
    const svg = [
      '<svg><g>',
      '<use ffdec:characterId="33" height="19" ' +
        'transform="matrix(1, 0, 0, 1, 143, -97.4)" width="24" ' +
        'xlink:href="#text0"/>',
      '<use ffdec:characterId="56" height="19" ' +
        'transform="matrix(1, 0, 0, 1, 143, -32.1)" width="24" ' +
        'xlink:href="#text1"/>',
      '<use ffdec:characterId="60" height="19" ' +
        'transform="matrix(1, 0, 0, 1, 143, 33.2)" width="24" ' +
        'xlink:href="#text2"/>',
      '<use ffdec:characterId="64" height="19" ' +
        'transform="matrix(1, 0, 0, 1, 143, 98.5)" width="24" ' +
        'xlink:href="#text3"/>',
      '</g><defs>',
    ].join('\n');
    const text = new Map([[33, {normalized: 'A'}], [56, {normalized: 'B'}],
      [60, {normalized: 'C'}], [64, {normalized: 'D'}]]);
    const answers = [
      {visibleLabel: 'A', instanceName: 'AnsBtn3', characterId: 301,
        translateY: -82.6},
      {visibleLabel: 'B', instanceName: 'AnsBtn4', characterId: 301,
        translateY: -19.6},
      {visibleLabel: 'C', instanceName: 'AnsBtn1', characterId: 300,
        translateY: 46.8},
      {visibleLabel: 'D', instanceName: 'AnsBtn2', characterId: 301,
        translateY: 110.95},
    ];
    const result = deriveVisibleLabelTextCrosswalk(svg, [33, 56, 60, 64],
      text, answers);
    assert.deepEqual(result.map((row) => [row.visibleLabel,
      row.linkedAnswerInstanceName]), [['A', 'AnsBtn3'], ['B', 'AnsBtn4'],
      ['C', 'AnsBtn1'], ['D', 'AnsBtn2']]);
    assert.throws(() => deriveVisibleLabelTextCrosswalk(svg,
      [33, 56, 60, 64], new Map(text).set(60, {normalized: 'D'}), answers),
    /is not C/u);
    assert.throws(() => deriveVisibleLabelTextCrosswalk(svg,
      [33, 56, 60, 64], text, answers.map((row, index) =>
        index === 2 ? {...row, translateY: 80} : row)),
    /label\/hit-region geometry drifted/u);
  });

test('popup crosswalk keeps Mc_Popup and Mc_PopUp case-distinct', () => {
  const svg = [
    '<use ffdec:characterId="335" height="1" id="Mc_Popup" ' +
      'transform="matrix(1, 0, 0, 1, 0, 0)" width="1" ' +
      'xlink:href="#sprite1"/>',
    '<use ffdec:characterId="350" height="1" id="Mc_PopUp" ' +
      'transform="matrix(1, 0, 0, 1, 0, 0)" width="1" ' +
      'xlink:href="#sprite2"/>',
  ].join('\n');
  assert.deepEqual(deriveCaseSensitivePopupCrosswalk(svg, {
    helpPopupId: 335,
    staleAngleOverlayId: 350,
  }).map((row) => [row.instanceName, row.characterId]), [
    ['Mc_Popup', 335], ['Mc_PopUp', 350],
  ]);
  assert.throws(() => deriveCaseSensitivePopupCrosswalk(svg, {
    helpPopupId: 335,
    staleAngleOverlayId: null,
  }), /unexpected case-sensitive stale overlay/u);
  assert.throws(() => deriveCaseSensitivePopupCrosswalk(svg.replace(
    'characterId="350"', 'characterId="351"'), {
    helpPopupId: 335,
    staleAngleOverlayId: 350,
  }), /stale angle overlay drifted/u);
});

test('p029 feedback sequence binds pre-increment and reversed Try visibility',
  () => {
    const input = {
      wrongButtonScript: `on(release){
  _global.quizTryCount++;
  Mc_Wrong_Feed4.gotoAndPlay(2);
}`,
      popupScript: `if(_global.quizTryCount == 1){
  Try._visible = true;
} else {
  Try._visible = false;
}`,
      baseText:
        'Find the inequality that has x greater than    5 and less than 8. ',
      tryText: 'Try again.',
      wrongEndpointScript: `if(_global.quizTryCount >= 2){
  _global.quizTryCount = 0;
  _global.quizSection = false;
  _parent.play();
}`,
    };
    assert.deepEqual(deriveP029FeedbackSequence(input), {
      incrementLocation: 'wrong-answer-button-before-feedback-playback',
      firstWrong: {quizTryCountDuringPopup: 1,
        visibleText:
          'Find the inequality that has x greater than 5 and less than 8. Try again.'},
      secondWrong: {quizTryCountDuringPopup: 2,
        visibleText:
          'Find the inequality that has x greater than 5 and less than 8.',
        autoResumeAfterFeedback: true, resetQuizTryCountTo: 0},
    });
    assert.throws(() => deriveP029FeedbackSequence({...input,
      wrongButtonScript: input.wrongButtonScript.replace(
        '_global.quizTryCount++;\n  ', '')}), /increment timing drifted/u);
    assert.throws(() => deriveP029FeedbackSequence({...input,
      wrongEndpointScript: `${input.wrongEndpointScript}\n` +
        '_global.quizTryCount++;'}), /endpoint timing drifted/u);
    assert.throws(() => deriveP029FeedbackSequence({...input,
      tryText: 'Invented retry.'}), /feedback text drifted/u);
  });

test('behavior10 canonical artifact self-checks exact fresh FFDec evidence',
  async () => {
    process.env.HELP_MATH_G678_SOURCE_ROOT = SOURCE_ROOT;
    const result = await auditG678AlgL11Behavior10TrancheB({check: true});
    assert.equal(result.auditedPlacementCount, 10);
    assert.equal(result.freshFfdecBinaryClosureCount, 10);
    assert.equal(result.answerVisibleGeometryCrosswalkCount, 10);
    assert.equal(result.tsAnsBtn1SemanticCResolvedCount, 3);
    assert.equal(result.staleAngleOverlayUnresolvedCount, 3);
    assert.equal(result.registrationCandidatePlacementCount, 0);
    assert.equal(result.productCalibrationPassed, false);
    assert.ok(Object.values(result.acceptanceEffects).every((value) =>
      value === false));
  });

test('behavior10 artifact preserves exact ten pages and every downstream gate',
  async () => {
    const artifact = JSON.parse(await readFile(ARTIFACT, 'utf8'));
    assert.equal(artifact.artifactType,
      'g678-alg-l11-behavior10-tranche-b-audit-v1');
    assert.deepEqual(artifact.inputs.predecessorFinal354, {
      path: 'catalog/product-bridge-calibrations/' +
        'g678-current-js-354-page-product-calibrated-registration-v1.json',
      bytes: 2190557,
      sha256:
        'e10f263fe19a9db3141c23ba2611730eed2e3cf7c495b27aef6e862a8936e850',
    });
    assert.equal(artifact.scope.selectedBehavior10Placements, 10);
    assert.equal(artifact.scope.tutorialChoicePlacements, 7);
    assert.equal(artifact.scope.guidedTutorialChoicePlacements, 3);
    assert.equal(artifact.freshFfdecBinaryClosureCount, 10);
    assert.equal(artifact.answerVisibleGeometryCrosswalkCount, 10);
    assert.equal(artifact.tsAnsBtn1SemanticCResolvedCount, 3);
    assert.equal(artifact.p028GraphGeometryBoundCount, 1);
    assert.equal(artifact.p030AbsoluteValueGlyphBoundCount, 1);
    assert.equal(artifact.p029FeedbackOrderingResolvedCount, 1);
    assert.equal(artifact.staleAngleOverlaySourceDefectCount, 3);
    assert.equal(
      artifact.staleAngleOverlayOriginalRuntimeDispositionEstablishedCount, 0);
    assert.equal(new Set(artifact.selectedPlacementIds).size, 10);
    assert.deepEqual(artifact.selectedPlacementIds,
      ['026', '027', '028', '029', '030', '031', '032', '040', '041',
        '042'].map((page) => `shared-alg001-l11-p${page}`));
    for (const member of artifact.members) {
      assert.equal(member.sourceAuditPassed, true);
      assert.equal(member.registrationCandidate, false);
      assert.equal(member.productCalibrationPassed, false);
      assert.equal(member.wholeLessonEngineeringPreviewReady, false);
      assert.equal(member.reuseAuthorized, false);
      assert.equal(member.audioCandidate.accepted, false);
      assert.ok(member.p1Blockers.length >= 3);
      assert.ok(Object.values(member.acceptanceEffects).every((value) =>
        value === false));
    }
    const guided = artifact.members.filter((member) =>
      member.familyId === 'l11-guided-tutorial-choice');
    assert.equal(guided.length, 3);
    for (const member of guided) {
      assert.equal(member.answerVisibleGeometryCrosswalk.correct.visibleLabel,
        'C');
      assert.equal(member.answerVisibleGeometryCrosswalk
        .tsAnsBtn1SemanticCConflictResolved, true);
      assert.equal(member.helpPopup.staleAngleOverlay
        .originalRuntimeDispositionEstablished, false);
    }
    assert.equal(artifact.registrationCandidatePlacementCount, 0);
    assert.equal(artifact.currentJavaScriptRegisteredPlacementCount, 0);
    assert.equal(artifact.productCalibrationPassed, false);
    assert.equal(artifact.wholeLessonEngineeringPreviewReady, false);
    assert.equal(artifact.scaleOutAuthorized, false);
    assert.ok(Object.values(artifact.acceptanceEffects).every((value) =>
      value === false));
  });
