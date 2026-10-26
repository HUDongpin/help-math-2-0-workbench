import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {IDS} from './qa-g678-alg-l11-remaining23-browser.mjs';
import {
  assertCheckedArtifactBinding,
  assertFocused377AggregateInput,
  buildG678CurrentJs377AggregateArtifact,
} from './build-g678-current-js-377-browser-aggregate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (relative) => readFile(path.join(ROOT, relative), 'utf8')
  .then(JSON.parse);
const [predecessor, freeze354] = await Promise.all([
  readJson('output/playwright/g678-current-js-354-v1/evidence.json'),
  readJson('catalog/product-bridge-calibrations/' +
    'g678-current-js-354-page-registration-v1.json'),
]);
const FALSE_EFFECTS = Object.freeze({
  currentJavaScriptRegistered: false, registrationCandidate: false,
  productCalibrationPassed: false, browserCalibrationPassed: false,
  engineeringPreviewReady: false,
  authoritativeOriginalRuntime: false, behaviorAccepted: false,
  visualFidelityAccepted: false, audioAccepted: false,
  humanVisualAccepted: false, ownerAccepted: false, strictComplete: false,
  releaseEligible: false, released: false, published: false,
});

function fixture() {
  const freeze = {registrationCandidatePlacementCount: 377,
    selectedPages: [...freeze354.selectedPages, ...IDS.map((animationId) =>
      ({animationId, stableLessonKey: 'shared-alg001-l11'}))]};
  const results = predecessor.samples.map((sample) => ({
    animationId: sample.animationId, historicalKind: sample.kind,
    frameCount: sample.frameCount, frameDomain: 'test-domain',
    replayCounterBefore: 0, replayCounterAfter: 1, renderState: 'ready',
    fullHistoricalInteractionReplayed: false, errors: [],
  }));
  const exact23Pages = IDS.map((animationId) => ({animationId,
    kind: animationId.endsWith('p006') ? 'a-random-silent' :
      animationId.endsWith('p033') || animationId.endsWith('p034') ||
      animationId.endsWith('p044') ? 'd-advanced' :
        animationId.match(/p0(?:26|27|28|29|30|31|32|40|41|42)$/u)
          ? 'b-behavior' : 'a-interactive',
    domModuleLoaded: true, pageSpecificAssetRequestCount: 0,
    deepProductBehaviorPassed: true}));
  const focusedScreenshots = Array.from({length: 24}, (_, index) => ({
    path: `output/playwright/g678-alg-l11-remaining23-377-v1/${index}.png`,
    bytes: index + 1, sha256: String(index).padStart(64, '0')}));
  const focused = {schemaVersion: 1,
    artifactType: 'g678-alg-l11-remaining23-browser-qa-v1',
    generatedAt: '2026-09-05T00:00:00.000Z',
    baseUrl: 'http://127.0.0.1:3324', inputs: {}, browser: {},
    registeredCurrentJsPages: 377,
    allLessons: {registeredPageSum: 377, sharedCardCount: 44,
      linkedCardCount: 0,
      completeLessonKeys: ['shared-alg001-l09', 'shared-alg001-l11'],
      algL09: {registeredPageCount: 41, activePageCount: 41, complete: true},
      algL11: {registeredPageCount: 44, activePageCount: 44, complete: true}},
    exact23Pages,
    aInteractive10: {placementCount: 10, choicePlacementCount: 7,
      twoTryPlacementCount: 2, p006DeterministicSilentPassed: true,
      choiceHelpAndHostResetPassed: true,
      originalParentBindingClaimed: false, pages: []},
    bBehavior10: {placementCount: 10, guidedPlacementCount: 3,
      allGuidedStopsPassed: true, correctHelpLifecyclePassed: true,
      staleOverlayAbsentAllStates: true,
      typedHostFeedbackResetPassed: true, pages: []},
    dAdvanced3: {placementCount: 3, p033HandoffPassed: true,
      p034BothLevelsAndScoringPassed: true,
      p044PoolGradeReviewResetPassed: true, pages: []},
    currentHostPredecessorReplay: {historicalFinal354SampleCount: 104,
      currentHostPredecessorReplayCount: 104,
      uniqueCurrentHostPredecessorModuleCount: 104,
      fullHistoricalSpecialInteractionReplay: false,
      limitation: 'test limitation', results},
    observedRequests: [],
    requestPolicy: {observedRequestCount: 1,
      allObservedRequestsLoopback: true,
      allObservedRequestsExplicitlyAllowed: true,
      legacyNetworkOperationsObserved: 0,
      guardMode: 'abort-unallowlisted-before-network',
      blockedRequestCount: 0},
    screenshots: focusedScreenshots, acceptanceEffects: FALSE_EFFECTS};
  return {freeze, focused};
}

test('focused377 aggregate input requires exact23 plus exact predecessor104',
  () => {
    const {freeze, focused} = fixture();
    assert.equal(assertFocused377AggregateInput(focused, predecessor, freeze),
      true);
    assert.throws(() => assertFocused377AggregateInput({...focused,
      exact23Pages: focused.exact23Pages.slice(1)}, predecessor, freeze),
    /focused377/u);
    assert.throws(() => assertFocused377AggregateInput({...focused,
      currentHostPredecessorReplay: {...focused.currentHostPredecessorReplay,
        fullHistoricalSpecialInteractionReplay: true}}, predecessor, freeze),
    /focused377/u);
    assert.throws(() => assertFocused377AggregateInput({...focused,
      extra: true}, predecessor, freeze), /focused377/u);
    assert.throws(() => assertFocused377AggregateInput({...focused,
      baseUrl: 'http://127.0.0.1:3333'}, predecessor, freeze), /focused377/u);
  });

test('aggregate consumes the exact focused artifact that passed --check', () => {
  const current = {path:
    'output/playwright/g678-alg-l11-remaining23-377-v1/evidence.json',
  bytes: 123, sha256: 'a'.repeat(64)};
  const receipt = {check: true, output: current.path, bytes: current.bytes,
    sha256: current.sha256};
  assert.equal(assertCheckedArtifactBinding(receipt, current, 'focused'), true);
  assert.throws(() => assertCheckedArtifactBinding({...receipt, bytes: 124},
    current, 'focused'), /changed after prerequisite check/u);
  assert.throws(() => assertCheckedArtifactBinding({...receipt,
    sha256: 'b'.repeat(64)}, current, 'focused'),
  /changed after prerequisite check/u);
});

test('aggregate composition is exact127 current-host records and 135 screenshots',
  () => {
    const {freeze, focused} = fixture();
    const inputs = {predecessor: {path: 'old', bytes: 1,
      sha256: 'a'.repeat(64)}, focused: {path: 'focused', bytes: 2,
      sha256: 'b'.repeat(64)}, freeze: {path: 'freeze', bytes: 3,
      sha256: 'c'.repeat(64)}, builder: {path: 'builder', bytes: 4,
      sha256: 'd'.repeat(64)}};
    const artifact = buildG678CurrentJs377AggregateArtifact({predecessor,
      focused, freeze, inputs, generatedAt: '2026-09-05T00:00:00.000Z'});
    assert.equal(artifact.samples.length, 127);
    assert.equal(new Set(artifact.samples.map((sample) => sample.animationId))
      .size, 127);
    assert.equal(artifact.screenshots.length, 135);
    assert.equal(artifact.browserEvidenceComposition
      .currentHostPredecessorReplayCount, 104);
    assert.equal(artifact.browserEvidenceComposition
      .currentHostNewPlacementDeepRecordCount, 23);
    assert.equal(artifact.browserEvidenceComposition
      .exact23FamilyCalibrationPending, true);
    assert.equal(artifact.browserEvidenceComposition
      .overallG678ProductCalibrationPassed, false);
    assert.ok(Object.values(artifact.acceptanceEffects).every((value) =>
      value === false));
  });
