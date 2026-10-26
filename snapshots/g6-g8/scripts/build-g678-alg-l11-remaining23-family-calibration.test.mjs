import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {IDS} from './qa-g678-alg-l11-remaining23-browser.mjs';
import {buildG678CurrentJs377AggregateArtifact} from
  './build-g678-current-js-377-browser-aggregate.mjs';
import {
  assertRemaining23FamilyInputs,
  assertRemaining23FamilyTransitiveBindings,
  buildRemaining23FamilyArtifact,
} from './build-g678-alg-l11-remaining23-family-calibration.mjs';

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
  const predecessorResults = predecessor.samples.map((sample) => ({
    animationId: sample.animationId, historicalKind: sample.kind,
    frameCount: sample.frameCount, frameDomain: 'test',
    replayCounterBefore: 0, replayCounterAfter: 1, renderState: 'ready',
    fullHistoricalInteractionReplayed: false, errors: [],
  }));
  const exact23Pages = IDS.map((animationId) => ({animationId,
    kind: 'dom-source-behavior', domModuleLoaded: true,
    pageSpecificAssetRequestCount: 0, deepProductBehaviorPassed: true}));
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
      limitation: 'test limitation',
      results: predecessorResults},
    observedRequests: [],
    requestPolicy: {observedRequestCount: 1,
      allObservedRequestsLoopback: true,
      allObservedRequestsExplicitlyAllowed: true,
      legacyNetworkOperationsObserved: 0,
      guardMode: 'abort-unallowlisted-before-network',
      blockedRequestCount: 0},
    screenshots: Array.from({length: 24}, (_, index) => ({
      path: `output/playwright/g678-alg-l11-remaining23-377-v1/${index}.png`,
      bytes: index + 1, sha256: String(index).padStart(64, '0')})),
    acceptanceEffects: FALSE_EFFECTS};
  const aggregate = buildG678CurrentJs377AggregateArtifact({predecessor,
    focused, freeze, generatedAt: '2026-09-05T00:00:00.000Z', inputs: {
      predecessor: {path: 'old', bytes: 1, sha256: 'a'.repeat(64)},
      focused: {path: 'focused', bytes: 2, sha256: 'b'.repeat(64)},
      freeze: {path: 'freeze', bytes: 3, sha256: 'c'.repeat(64)},
      builder: {path: 'builder', bytes: 4, sha256: 'd'.repeat(64)},
    }});
  return {freeze, focused, aggregate};
}

test('family input accepts only exact104 predecessor plus exact23/127 aggregate',
  () => {
    const {freeze, focused, aggregate} = fixture();
    assert.equal(assertRemaining23FamilyInputs({predecessor, focused,
      aggregate, freeze}), true);
    assert.throws(() => assertRemaining23FamilyInputs({predecessor, focused,
      aggregate: {...aggregate, samples: aggregate.samples.slice(1)},
      freeze}), /family aggregate/u);
    assert.throws(() => assertRemaining23FamilyInputs({predecessor, focused,
      aggregate: {...aggregate, browserEvidenceComposition:
        {...aggregate.browserEvidenceComposition,
          exact23FamilyCalibrationPending: false}}, freeze}),
    /family aggregate/u);
  });

test('behavior-only exact23 receipts cannot create product family authority',
  () => {
    const {freeze, focused, aggregate} = fixture();
    const inputs = {predecessor, focused, aggregate, freeze, inputs: {test: true}};
    for (const contentAdmission of [undefined, true, {passed: true},
      {placementIds: IDS, instructionalContentPassed: true}]) {
      assert.throws(() => buildRemaining23FamilyArtifact({...inputs,
        contentAdmission}), /BLOCKED_INSTRUCTIONAL_CONTENT_NOT_ADMITTED/u);
    }
  });

test('family binds every current authority to the checked focused/aggregate graph',
  () => {
    const descriptor = (key) => ({path: key, bytes: 1,
      sha256: 'a'.repeat(64)});
    const keys = ['aRun', 'aFragment', 'bRun', 'bFragment', 'dRun',
      'dFragment', 'aAudit', 'bAudit', 'bDecision', 'dAudit',
      'registrationFreeze', 'focusedBrowserVerifier', 'final354Aggregate',
      'focusedBrowser', 'aggregateBrowserBuilder'];
    const descriptors = Object.fromEntries(keys.map((key) =>
      [key, descriptor(key)]));
    const focused = {inputs: Object.fromEntries([
      ...keys.slice(0, 10).map((key) => [key, descriptors[key]]),
      ['registrationFreeze', descriptors.registrationFreeze],
      ['script', descriptors.focusedBrowserVerifier],
    ])};
    const aggregate = {inputs: {predecessor: descriptors.final354Aggregate,
      focused: descriptors.focusedBrowser,
      freeze: descriptors.registrationFreeze,
      builder: descriptors.aggregateBrowserBuilder}};
    assert.equal(assertRemaining23FamilyTransitiveBindings({focused,
      aggregate, descriptors}), true);
    assert.throws(() => assertRemaining23FamilyTransitiveBindings({focused,
      aggregate: {...aggregate, inputs: {...aggregate.inputs,
        builder: descriptor('changed-builder')}}, descriptors}),
    /binding drifted/u);
    assert.throws(() => assertRemaining23FamilyTransitiveBindings({focused: {
      inputs: {...focused.inputs, aAudit: descriptor('changed-audit')}},
    aggregate, descriptors}), /aAudit focused browser authority drifted/u);
  });
