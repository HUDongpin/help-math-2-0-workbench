import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  buildBehavior10TrancheBSourceDivergence,
  OUTPUT,
  prepareBehavior10TrancheBSourceDivergence,
  validateBehavior10TrancheBSourceDivergence,
} from './build-g678-alg-l11-behavior10-tranche-b-source-divergence.mjs';

const IDS = [
  'shared-alg001-l11-p040',
  'shared-alg001-l11-p041',
  'shared-alg001-l11-p042',
];
const NO_DIVERGENCE_IDS = [
  'shared-alg001-l11-p026',
  'shared-alg001-l11-p027',
  'shared-alg001-l11-p028',
  'shared-alg001-l11-p029',
  'shared-alg001-l11-p030',
  'shared-alg001-l11-p031',
  'shared-alg001-l11-p032',
];
const prepared = await prepareBehavior10TrancheBSourceDivergence();

function clone() {
  return structuredClone(prepared.artifact);
}

test('decision binds exact audit, builder, run, and evidence inventory', () => {
  const {inputs} = prepared.artifact;
  assert.deepEqual(inputs.reviewedSourceAudit, {
    path: 'catalog/g678-alg-l11-behavior10-tranche-b-audit-v1.json',
    bytes: 139507,
    sha256:
      '2b45cee5d1503d9e98521b5ca0518500a29f8bc43a0b1c84145016dccc5289b8',
  });
  assert.equal(inputs.sourceAuditBuilder.sha256,
    '5e6ccbec8fc5e8b92d3547484a2e1596967517aab61b8fac282a9294a29b515b');
  assert.equal(inputs.diagnosticRun.sha256,
    '832624ad441120ed1986b7dffd6f7ac0e2688e7ad8cf69c33f28c305ae5ab106');
  assert.equal(inputs.evidenceInventory.sha256,
    'df7b3b3962f0d046b7bef9c42b5d16222841d25f24982f8b8f1ab06803d402b6');
  assert.equal(inputs.evidenceInventory.fileCountBeforeInventoryAndManifest,
    1451);
});

test('only exact p040-p042 receive maintained-candidate stale overlay suppression',
  () => {
    const artifact = prepared.artifact;
    assert.deepEqual(artifact.scope.exactDivergencePlacementIds, IDS);
    assert.equal(artifact.maintainedCandidateSuppressionAuthorizedPlacementCount,
      3);
    assert.deepEqual(artifact.entries.map((entry) => entry.animationId), IDS);
    for (const entry of artifact.entries) {
      assert.equal(entry.decision.sourceDivergenceDecisionEstablished, true);
      assert.equal(
        entry.decision.maintainedCandidateMaySuppressStaleAngleOverlay, true);
      assert.equal(entry.decision.originalRuntimeDispositionEstablished, false);
      assert.equal(entry.decision.allowedDomBehavior.staleOverlayMayRender,
        false);
      assert.equal(entry.decision.allowedDomBehavior
        .correctHelpMustRemainImplemented, true);
    }
  });

test('case-sensitive object, sprite, ActionScript, placement, and SVG evidence is exact',
  () => {
    const expected = {
      'shared-alg001-l11-p040': [335, 350, 812,
        '19fecfb08ff8a8b52deeadf280b4e183599a2d080d3d4cf5fbdc9de1c578b377',
        'e154a8d2d388fcc5d2a2e349424af50945dac76e603739c36d163fc324d3e5c0'],
      'shared-alg001-l11-p041': [322, 337, 884,
        '60f23be2dc8af25f2c7bbe1114f8eefccea24554209ef22e4f4bb7a144327a2c',
        'db4bcfbdd951290a0693b390f0b5267def4cc1940be56214121a90b42b0ab8f4'],
      'shared-alg001-l11-p042': [287, 302, 982,
        'ccd776ec6f583425899512debde0f6168b0786bb4be5c99ff6d8974c81cd8781',
        'fe3332ad4e06f14265cd752d45ff90e3ad2422e70b83e59caac1ca06b21ed26e'],
    };
    for (const entry of prepared.artifact.entries) {
      const [correctId, staleId, frame, helpSvg, staleSvg] =
        expected[entry.animationId];
      const evidence = entry.sourceEvidence;
      assert.equal(evidence.finalQuizFrame, frame);
      assert.equal(evidence.correctHelp.instanceName, 'Mc_Popup');
      assert.equal(evidence.correctHelp.characterId, correctId);
      assert.equal(evidence.correctHelp.sprite.frameCount, 1);
      assert.equal(evidence.correctHelp.exactActionScriptReferenceCount, 2);
      assert.equal(evidence.correctHelp.actionScriptReferences.length, 2);
      assert.equal(evidence.correctHelp.frameSvg.sha256, helpSvg);
      assert.equal(evidence.staleAngleOverlay.instanceName, 'Mc_PopUp');
      assert.equal(evidence.staleAngleOverlay.characterId, staleId);
      assert.equal(evidence.staleAngleOverlay.sprite.frameCount, 70);
      assert.equal(evidence.staleAngleOverlay.exactActionScriptReferenceCount,
        0);
      assert.equal(evidence.staleAngleOverlay.frameSvg.sha256, staleSvg);
      assert.match(evidence.correctHelp.finalQuizPlacement.sha256,
        /^[0-9a-f]{64}$/u);
      assert.match(evidence.staleAngleOverlay.finalQuizPlacement.sha256,
        /^[0-9a-f]{64}$/u);
    }
  });

test('p026-p032 receive no divergence and later browser contract stays pending',
  () => {
    const artifact = prepared.artifact;
    assert.deepEqual(artifact.scope.noDivergencePlacementIds,
      NO_DIVERGENCE_IDS);
    assert.deepEqual(artifact.noDivergencePlacements.map((entry) =>
      entry.animationId), NO_DIVERGENCE_IDS);
    assert.ok(artifact.noDivergencePlacements.every((entry) =>
      entry.sourceDivergenceAuthorizedByThisDecision === false));
    assert.equal(artifact.laterBrowserContract.requiredBeforeProductCalibration,
      true);
    assert.equal(artifact.laterBrowserContract.browserCalibrationPassed, false);
    for (const page of artifact.laterBrowserContract
      .perPlacementRequiredStates) {
      assert.equal(page.states.length, 4);
      assert.ok(page.states.every((state) => state.staleOverlayDomCount === 0));
      assert.deepEqual(page.states.map((state) =>
        state.correctHelpVisibleCount), [0, 1, 0, 0]);
    }
  });

test('validator rejects input, membership, evidence, authority, browser, and gate substitution',
  () => {
    const mutations = [
      (value) => { value.inputs.reviewedSourceAudit.sha256 = '0'.repeat(64); },
      (value) => { value.inputs.sourceAuditBuilder.sha256 = '0'.repeat(64); },
      (value) => { value.inputs.diagnosticRun.bytes += 1; },
      (value) => { value.inputs.evidenceInventory.sha256 = '0'.repeat(64); },
      (value) => { value.scope.exactDivergencePlacementIds.reverse(); },
      (value) => { value.entries[0].sourceEvidence.correctHelp.instanceName =
        'Mc_PopUp'; },
      (value) => { value.entries[0].sourceEvidence.staleAngleOverlay
        .instanceName = 'Mc_Popup'; },
      (value) => { value.entries[0].sourceEvidence.correctHelp.characterId =
        350; },
      (value) => { value.entries[1].sourceEvidence.staleAngleOverlay
        .sprite.frameCount = 1; },
      (value) => { value.entries[2].sourceEvidence.staleAngleOverlay
        .exactActionScriptReferenceCount = 1; },
      (value) => { value.entries[0].sourceEvidence.correctHelp.frameSvg.sha256 =
        '0'.repeat(64); },
      (value) => { value.entries[1].sourceEvidence.staleAngleOverlay
        .finalQuizPlacement.sha256 = '0'.repeat(64); },
      (value) => { value.entries[2].decision
        .maintainedCandidateMaySuppressStaleAngleOverlay = false; },
      (value) => { value.entries[0].decision
        .originalRuntimeDispositionEstablished = true; },
      (value) => { value.noDivergencePlacements[0]
        .sourceDivergenceAuthorizedByThisDecision = true; },
      (value) => { value.laterBrowserContract.browserCalibrationPassed = true; },
      (value) => { value.registrationCandidatePlacementCount = 3; },
      (value) => { value.productCalibrationPassed = true; },
      (value) => { value.scaleOutAuthorized = true; },
      (value) => { value.acceptanceEffects.visualFidelityAccepted = true; },
      (value) => { value.limitations.pop(); },
      (value) => { value.unexpected = true; },
    ];
    for (const mutate of mutations) {
      const value = clone();
      mutate(value);
      assert.throws(() => validateBehavior10TrancheBSourceDivergence(value),
        /drifted/u);
    }
  });

test('canonical decision is exact prepared bytes, read-only, and self-checks',
  async () => {
    const current = await readFile(new URL(`../${OUTPUT}`, import.meta.url));
    assert.deepEqual(current, prepared.bytes);
    const result = await buildBehavior10TrancheBSourceDivergence({check: true});
    assert.equal(result.check, true);
    assert.equal(result.exactDivergencePlacementCount, 3);
    assert.equal(result.maintainedCandidateSuppressionAuthorizedPlacementCount,
      3);
    assert.equal(result.originalRuntimeDispositionEstablishedCount, 0);
    assert.equal(result.registrationCandidatePlacementCount, 0);
    assert.equal(result.productCalibrationPassed, false);
    assert.equal(result.browserProductCalibrationPassed, false);
    assert.equal(result.scaleOutAuthorized, false);
    assert.equal(result.releaseAuthorized, false);
    assert.equal(result.published, false);
  });
