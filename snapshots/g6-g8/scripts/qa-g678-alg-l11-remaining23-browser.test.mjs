import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  A_CHOICE_IDS,
  A_IDS,
  A_TWO_TRY_IDS,
  B_IDS,
  D_IDS,
  IDS,
  assertAChoiceBrowserReceipt,
  assertATwoTryBrowserReceipt,
  assertAllLessons377Receipt,
  assertBPageBrowserReceipt,
  assertBSeekResumeRuntime,
  assertDAssessmentBrowserReceipt,
  assertDControllerBrowserReceipt,
  assertDMatchingBrowserReceipt,
  assertFinal354Predecessor104,
  assertFinal354SuccessorCompatibility,
  assertFocused377BrowserMetadata,
  assertFocused377ScreenshotComposition,
  assertP006BrowserReceipt,
  assertPredecessor104ReplayReceipt,
  assertRequestPolicy377Receipt,
  assertStableIntegrationBindingSet,
  exactPrivateCandidateSelector,
  exactPrivateTwoTryCandidateSelector,
  provisional377StableBindingStatus,
  requestGuardAction377,
  requestPolicy377Receipt,
  selectExactPrivateBSeekCandidate,
  selectExactPrivateTwoTryReplayCandidate,
  stableProvisional377IntegrationBindings,
} from './qa-g678-alg-l11-remaining23-browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (relative) => readFile(path.join(ROOT, relative), 'utf8')
  .then(JSON.parse);
const [final354, freeze354, catalog, auditA, auditB] = await Promise.all([
  readJson('output/playwright/g678-current-js-354-v1/evidence.json'),
  readJson('catalog/product-bridge-calibrations/' +
    'g678-current-js-354-page-registration-v1.json'),
  readJson('catalog/g678-shared-catalog.v1.json'),
  readJson('catalog/g678-alg-l11-interactive10-tranche-c-audit-v1.json'),
  readJson('catalog/g678-alg-l11-behavior10-tranche-b-audit-v1.json'),
]);

const SCREENSHOT = Object.freeze({
  path: 'output/playwright/g678-alg-l11-remaining23-377-v1/test.png',
  bytes: 1234,
  sha256: 'a'.repeat(64),
});

function mutate(value, key, replacement) {
  return {...value, [key]: replacement};
}

test('scaffold exposes only the reviewed exact16 integration binding set',
  async () => {
    assert.deepEqual(provisional377StableBindingStatus(), {
      ready: true, blocker: null,
    });
    const stable = stableProvisional377IntegrationBindings();
    assert.equal(assertStableIntegrationBindingSet(stable, stable), true);
    assert.deepEqual(Object.keys(stable), ['registrationFreeze',
      'registrationFragment', 'registrationFinalizer', 'privateRegistry',
      'localLoader', 'localRegistry', 'productBridge', 'descriptorPlayer',
      'launcher', 'successorCompatibility', 'aFragment', 'aRun', 'bFragment',
      'bRun', 'dFragment', 'dRun']);
    assert.deepEqual(stable.registrationFreeze, {path:
      'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v1.json',
    bytes: 2275220,
    sha256:
      '16a8e04786520f62e1e5a833cb9b23aa0e9c25c5e2c1a610970c4774e1bae646'});
    assert.deepEqual(stable.privateRegistry, {path:
      'packages/demos/private-current-js-registry.json', bytes: 430979,
    sha256:
      'bdae8f916495a80d13dd1e02282c21f6de25a8f45247ddb1207b410fc68b9212'});
    assert.deepEqual(stable.successorCompatibility, {path:
      'catalog/g678-final354-current-bridge-successor-compatibility-v1.json',
    bytes: 4232,
    sha256:
      '2b9f3501c97f0d2eb1bc298d093d67417eba89e24e17f5a20e0b67ff8b0f61c1'});
    const source = await readFile(path.join(ROOT,
      'scripts/qa-g678-alg-l11-remaining23-browser.mjs'), 'utf8');
    assert.doesNotMatch(source,
      /a3a3ed813eab4d6500efbd43a2503fd112b38ad2d99557032a328c9f69706e71|69195a53c2c35c1f33a593d1aed5c43f6efe52ce770a7b7f7bc70168b3b1d1e0/u);
    for (const hash of [
      '45398b11c513b52bac070fd37303376362e2be0e01fe6b0b4710350c86f56578',
      '63742b1e9a87829f99971a59d9153b1462dc89170774121ad89ba6b692e4ffb2',
      'b6392eb78b894847085f9c760c0c6dd63b51660dbc72f661e3f695f715b22276',
      'b0325468e2a1eb5812ced70ccae6bdd02ebf2caf228ce38b8dc007b056ebce5b',
    ]) assert.match(source, new RegExp(hash, 'u'));
  });

test('stable integration descriptors require an exact ordered complete set',
  () => {
    const keys = ['registrationFreeze', 'registrationFragment',
      'registrationFinalizer', 'privateRegistry', 'localLoader',
      'localRegistry', 'productBridge', 'descriptorPlayer', 'launcher',
      'successorCompatibility', 'aFragment', 'aRun', 'bFragment', 'bRun',
      'dFragment', 'dRun'];
    const expected = Object.fromEntries(keys.map((key, index) => [key, {
      path: `stable/${key}`, bytes: index + 1,
      sha256: String(index).padStart(64, '0'),
    }]));
    assert.equal(assertStableIntegrationBindingSet(expected, expected), true);
    assert.throws(() => assertStableIntegrationBindingSet(
      {...expected, extra: expected.aRun}, expected), /pending/u);
    assert.throws(() => assertStableIntegrationBindingSet(
      {...expected, aRun: {...expected.aRun, sha256: 'f'.repeat(64)}},
      expected), /binding set drifted/u);
    assert.throws(() => assertStableIntegrationBindingSet(expected, null),
      /pending/u);
  });

test('final354 predecessor authority is exactly 104 unique current-host records',
  () => {
    const ids = assertFinal354Predecessor104(final354);
    assert.equal(ids.length, 104);
    assert.equal(new Set(ids).size, 104);
    assert.throws(() => assertFinal354Predecessor104({...final354,
      samples: final354.samples.slice(1)}), /predecessor104/u);
    assert.throws(() => assertFinal354Predecessor104({...final354,
      browserEvidenceComposition: {...final354.browserEvidenceComposition,
        fullHistoricalSpecialInteractionReplay: true}}), /predecessor104/u);
  });

test('successor contract requires exact inverse plus all 104 predecessor replays',
  () => {
    const descriptor = (name) => ({path: name, bytes: 1,
      sha256: 'a'.repeat(64)});
    const successor = {schemaVersion: 1, artifactType:
        'g678-final354-current-bridge-successor-compatibility-v1',
      status:
        'exact-final354-inverse-and-static-compatibility-current-host-revalidation-required',
      inputs: {currentBridge: descriptor('bridge'),
        preparedProvisional377BridgeTest: descriptor('test'),
        final354ProductCalibratedFreeze: descriptor('freeze'),
        final354ProductCalibratedFragment: descriptor('fragment'),
        final354PrivateRegistryWitness: descriptor('registry'),
        final354PrivateRegistryWitnessBuilder: descriptor('witness-builder'),
        builder: descriptor('builder')},
      exactInverseTransformation: {reconstructedBytes: 153620,
        reconstructedSha256:
          '00b14152cce3b84293fbd14ebe6390b254cfd22c208857c1c6618dcae8630166',
        expectedFinal354Bridge: {bytes: 153620,
          sha256:
            '00b14152cce3b84293fbd14ebe6390b254cfd22c208857c1c6618dcae8630166'},
        exactMatch: true, allowedSuccessorChanges: [
          'one provisional377 freeze phase selected only by an explicit local phase',
          'three exact unregistered maintained DOM fragment authority kinds',
          'one discriminated maintained-dom-module-v1 registration and descriptor provenance union for exact23',
          'separate 354 external canvas runtime assets and 23 maintained DOM renderer records',
          'source-bound ALG L11 maintained DOM lesson-host capability projection',
        ], otherBridgeChangesDetected: false},
      final354Compatibility: {exactDescriptorInvariantCount: 354,
        exactExternalCanvasRuntimeAssetCount: 354,
        maintainedDomRendererCount: 0,
        historicalProductHostCalibratedPlacementCount: 138,
        historicalFamilyCalibrationCount: 22,
        priorBrowserSampleCount: 104, priorScreenshotCount: 111,
        productCalibratedCompleteLessonKeys: ['shared-alg001-l09'],
        productCalibratedWholeLessonEngineeringPreviewCount: 1,
        currentBridgeStaticCompatibilityEstablished: true,
        currentHostBrowserRevalidated: false},
      requiredProvisional377BrowserAssertions: {
        predecessorSamplesMustBeReplayed: true, predecessorReplayCount: 104,
        exactNewMaintainedDomPlacementCount: 23,
        exactExternalCanvasRuntimeAssetCount: 354,
        exactMaintainedDomRendererCount: 23,
        algL11RegisteredPageCount: 44, algL11ActivePageCount: 44,
        registeredCompleteLessonCount: 2,
        productCalibratedWholeLessonEngineeringPreviewCount: 1,
        newWholeLessonEngineeringPreviewCount: 0,
        browserProductCalibrationPassed: false},
      acceptanceEffects: {authoritativeOriginalRuntime: false,
        behaviorParityAccepted: false, visualFidelityAccepted: false,
        audioAccepted: false, humanVisualAccepted: false,
        ownerAccepted: false, strictComplete: false,
        releaseEligible: false, published: false}};
    assert.equal(assertFinal354SuccessorCompatibility(successor), true);
    assert.throws(() => assertFinal354SuccessorCompatibility({...successor,
      requiredProvisional377BrowserAssertions: {
        ...successor.requiredProvisional377BrowserAssertions,
        predecessorReplayCount: 103}}),
    /successor compatibility/u);
    assert.throws(() => assertFinal354SuccessorCompatibility({...successor,
      exactInverseTransformation: {...successor.exactInverseTransformation,
        reconstructedSha256: 'b'.repeat(64)}}), /successor compatibility/u);
    assert.throws(() => assertFinal354SuccessorCompatibility({...successor,
      final354Compatibility: {...successor.final354Compatibility,
        currentHostBrowserRevalidated: true}}), /successor compatibility/u);
  });

test('request policy is exact, loopback-only, allowlisted, and rejects extras',
  () => {
    const page = freeze354.selectedPages.find((entry) =>
      entry.animationId === final354.samples[0].animationId);
    assert.ok(page);
    const pages = new Map([[page.animationId, page]]);
    const observed = [
      {method: 'GET', resourceType: 'document',
        url: 'http://127.0.0.1:3324/en?screen=lessons'},
      {method: 'GET', resourceType: 'document',
        url: `http://127.0.0.1:3324/en/migration-status/g678-calibration/${page.animationId}`},
      {method: 'GET', resourceType: 'script', url:
        `http://127.0.0.1:3324/flash-assets/g678-local/${page.animationId}` +
        `/canvas-renderer.js?sha256=${page.runtime.canvasRenderer.sha256}`},
    ];
    const receipt = requestPolicy377Receipt(observed, pages);
    assert.equal(assertRequestPolicy377Receipt(observed, receipt, pages), true);
    assert.throws(() => assertRequestPolicy377Receipt(observed,
      {...receipt, oldAllRequestsLoopback: true}, pages), /policy evidence/u);
    const remote = [{...observed[0], url: 'https://example.com/legacy'}];
    assert.throws(() => assertRequestPolicy377Receipt(remote,
      requestPolicy377Receipt(remote, pages), pages), /policy evidence/u);
    const unexpected = {...observed[0], resourceType: 'script',
      url: 'http://127.0.0.1:3324/unreviewed/unexpected.js'};
    assert.equal(requestGuardAction377(unexpected, pages), 'abort');
    assert.throws(() => assertRequestPolicy377Receipt([unexpected],
      requestPolicy377Receipt([unexpected], pages), pages), /policy evidence/u);
    assert.equal(requestGuardAction377({method: 'GET', resourceType: 'script',
      url: 'http://127.0.0.1:3324/learning-theme-bootstrap.js'}, pages),
    'continue');
  });

test('browser identity and exact24 screenshot custody reject substitutions',
  () => {
    const executable = {path: '/opt/chromium', bytes: 100,
      sha256: 'c'.repeat(64)};
    const browser = {name: 'Chromium', version: '141.0.7390.37', executable};
    assert.equal(assertFocused377BrowserMetadata(browser, executable), true);
    assert.throws(() => assertFocused377BrowserMetadata({...browser,
      name: 'Other'}, executable), /browser metadata/u);
    assert.throws(() => assertFocused377BrowserMetadata({...browser,
      executable: {...executable, sha256: 'd'.repeat(64)}}, executable),
    /browser metadata/u);

    const descriptor = (name, index) => ({
      path: `output/playwright/g678-alg-l11-remaining23-377-v1/${name}.png`,
      bytes: 1000 + index, sha256: index.toString(16).padStart(64, '0'),
    });
    const pageReceipts = IDS.map((animationId, index) => ({animationId,
      screenshot: descriptor(animationId, index + 1)}));
    const evidence = {
      aInteractive10: {pages: pageReceipts.slice(0, A_IDS.length)},
      bBehavior10: {pages: pageReceipts.slice(A_IDS.length,
        A_IDS.length + B_IDS.length)},
      dAdvanced3: {pages: pageReceipts.slice(-D_IDS.length)},
      screenshots: [descriptor('all-lessons-377-l9-l11-complete', 0),
        ...pageReceipts.map((receipt) => receipt.screenshot)],
    };
    assert.equal(assertFocused377ScreenshotComposition(evidence), true);
    assert.throws(() => assertFocused377ScreenshotComposition({...evidence,
      screenshots: [evidence.screenshots[1], evidence.screenshots[0],
        ...evidence.screenshots.slice(2)]}), /screenshot composition/u);
    assert.throws(() => assertFocused377ScreenshotComposition({...evidence,
      aInteractive10: {pages: [{...pageReceipts[0], screenshot:
        descriptor('unrelated', 99)}, ...pageReceipts.slice(1, A_IDS.length)]}}),
    /screenshot composition/u);
  });

test('p006 receipt locks exact S1-S4 windows, Replay count, and silence', () => {
  const member = auditA.members.find((entry) => entry.animationId === A_IDS[0]);
  const selectedLabels = ['S3', 'S2', 'S1', 'S4'];
  const receipt = {animationId: A_IDS[0], selectedLabels,
    sourceWindows: selectedLabels.map((label) => {
      const source = member.sourceContract.labelWindows.find((entry) =>
        entry.label === label);
      return {label, startFrame: source.startFrame,
        returnFrame: source.returnFrame,
        soundStreamBlockCount: source.soundStreamBlockCount};
    }), replayCount: 3, audioPlayed: false, audioCueRequestCount: 0,
    replayResetPassed: true, pageSpecificAssetRequestCount: 0, errors: [],
    screenshot: SCREENSHOT};
  assert.equal(assertP006BrowserReceipt(receipt, member), true);
  assert.throws(() => assertP006BrowserReceipt(
    mutate(receipt, 'audioPlayed', true), member), /p006/u);
  assert.throws(() => assertP006BrowserReceipt(
    mutate(receipt, 'selectedLabels', ['S1', 'S1', 'S2', 'S3']), member),
  /p006/u);
});

test('seven A choice receipts bind full geometry, help, host reset, and math',
  () => {
    assert.deepEqual(A_CHOICE_IDS.filter((id) => auditA.members.find((entry) =>
      entry.animationId === id).sourceContract.needMoreHelpScripts.length > 0),
    ['shared-alg001-l11-p011']);
    const expected = {
      'shared-alg001-l11-p008': {correct: 'B', labels: {A: 'x > −3',
        B: '−3 < x < 3', C: 'x < 3'}, graph: null},
      'shared-alg001-l11-p011': {correct: 'C', labels: {A: 'x < 2',
        B: 'x < 10', C: 'x ≥ 2', D: 'x ≤ 10'}, graph: null},
      'shared-alg001-l11-p014': {correct: 'D', labels: {A: 'age = 16',
        B: 'age < 16', C: '16 > age', D: 'age ≥ 16'}, graph: null},
      'shared-alg001-l11-p019': {correct: 'A', labels: {A: 'x ≤ 2',
        B: 'x ≤ 5', C: 'source alternate number-line graph'},
        graph: {boundary: 2, closed: true, direction: 'left'}},
      'shared-alg001-l11-p020': {correct: 'B', labels: {A: 'x ≥ 6',
        B: 'x ≥ 2', C: 'x ≥ 3'},
        graph: {boundary: 2, closed: true, direction: 'right'}},
      'shared-alg001-l11-p021': {correct: 'B', labels: {A: 'x > 5',
        B: 'x > −5', C: 'source alternate number-line graph'},
        graph: {boundary: -5, closed: false, direction: 'right'}},
      'shared-alg001-l11-p025': {correct: 'B', labels: {A: 'x > −7',
        B: '−7 < x < 7', C: 'x < 7'}, graph: null},
    };
    for (const id of A_CHOICE_IDS) {
      const member = auditA.members.find((entry) => entry.animationId === id);
      const sourceGeometry = member.sourceContract.geometry.optionSlots
        .filter((slot) => slot.present).map((slot) => ({slot: slot.slot,
          geometrySha256: slot.geometrySha256,
          visibleObjectCount: slot.visibleObjects.length,
          visibleObjectProjectionSha256: createHash('sha256').update(Buffer.from(
            `${JSON.stringify(slot.visibleObjects, null, 2)}\n`)).digest('hex'),
          hitTarget: {name: slot.hitTarget.name,
            objectId: slot.hitTarget.objectId}}));
      const receipt = {animationId: id, visibleMath: expected[id].labels,
        correctSlot: expected[id].correct, sourceGeometry,
        correctGraph: expected[id].graph,
        firstWrongText: member.sourceContract.literalTwoAttemptSequence[0].text,
        secondWrongText: member.sourceContract.literalTwoAttemptSequence[1].text,
        firstWrongPassed: true, secondWrongPassed: true, rightPassed: true,
        helpLifecycle: {before: 0,
          open: member.sourceContract.needMoreHelpScripts.length > 0 ? 1 : 0,
          close: 0, replay: 0},
        helpTexts: member.sourceContract.needMoreHelpScripts.length > 0 ? [
          'Use the rules of inequalities to find the solution set.',
          'Inequality Rule 3: You can multiply or divide both sides of an inequality by any negative number but you must reverse the direction of the inequality symbol.',
        ] : [],
        pausePassed: true,
        hostFeedbackTransitions: [false, true, false, true, false, true, false],
        replayResetPassed: true, pageSpecificAssetRequestCount: 0, errors: [],
        screenshot: SCREENSHOT};
      assert.equal(assertAChoiceBrowserReceipt(receipt, member), true);
      assert.throws(() => assertAChoiceBrowserReceipt({...receipt,
        hostFeedbackTransitions: [false, true, true, true, false, true,
          false]}, member), /choice browser/u);
      assert.throws(() => assertAChoiceBrowserReceipt({...receipt,
        helpLifecycle: {...receipt.helpLifecycle,
          open: receipt.helpLifecycle.open === 0 ? 1 : 0}}, member),
      /choice browser/u);
      if (id === 'shared-alg001-l11-p019') {
        assert.throws(() => assertAChoiceBrowserReceipt({...receipt,
          correctGraph: {...receipt.correctGraph, closed: false}}, member),
        /choice browser/u);
      }
      if (id === 'shared-alg001-l11-p011') {
        assert.throws(() => assertAChoiceBrowserReceipt({...receipt,
          helpTexts: [...receipt.helpTexts].reverse()}, member),
        /choice browser/u);
      }
      if (id === 'shared-alg001-l11-p014' ||
        id === 'shared-alg001-l11-p019') {
        assert.equal(receipt.secondWrongText.endsWith(' '), true);
        assert.equal(assertAChoiceBrowserReceipt(receipt, member), true);
        assert.throws(() => assertAChoiceBrowserReceipt({...receipt,
          secondWrongText: receipt.secondWrongText.slice(0, -1)}, member),
        /choice browser/u);
        assert.throws(() => assertAChoiceBrowserReceipt({...receipt,
          secondWrongText: `${receipt.secondWrongText} `}, member),
        /choice browser/u);
      }
    }
  });

test('A p009/p010 receipts retain explicit original parent uncertainty', () => {
  for (const id of A_TWO_TRY_IDS) {
    const member = auditA.members.find((entry) => entry.animationId === id);
    const receipt = {animationId: id,
      nestedFrames: [1, 64, 65, 1, 64, 65, 70, 1],
      tryCounts: [0, 1, 2, 0],
      helpLifecycle: {before: 0, open: 1, close: 0, replay: 0},
      pausePassed: true, replayResetPassed: true,
      maintainedLocalParentTransition: true,
      originalRuntimeParentBindingEstablished: false,
      pageSpecificAssetRequestCount: 0, errors: [], screenshot: SCREENSHOT};
    assert.equal(assertATwoTryBrowserReceipt(receipt, member), true);
    assert.throws(() => assertATwoTryBrowserReceipt({...receipt,
      originalRuntimeParentBindingEstablished: true}, member), /two-try/u);
  }
});

test('two-try Replay selects one private candidate after a same-ID map node',
  () => {
    const animationId = 'shared-alg001-l11-p009';
    const map = {animationId, privateCurrentJs: null, nestedFrame: null,
      sourceCount: null};
    const candidate = {animationId, privateCurrentJs: 'true',
      nestedFrame: '1', sourceCount: '0'};
    assert.equal(exactPrivateTwoTryCandidateSelector(animationId),
      '[data-animation-id="shared-alg001-l11-p009"]' +
      '[data-private-current-js="true"]');
    assert.equal(selectExactPrivateTwoTryReplayCandidate([map, candidate],
      animationId), candidate);
    assert.throws(() => selectExactPrivateTwoTryReplayCandidate([map],
      animationId), /exact private two-try Replay candidate/u);
    assert.throws(() => selectExactPrivateTwoTryReplayCandidate(
      [map, candidate, {...candidate}], animationId),
    /exact private two-try Replay candidate/u);
    assert.throws(() => selectExactPrivateTwoTryReplayCandidate(
      [map, {...candidate, nestedFrame: null}], animationId),
    /exact private two-try Replay candidate/u);
    assert.throws(() => selectExactPrivateTwoTryReplayCandidate(
      [map, {...candidate, nestedFrame: '64'}], animationId),
    /exact private two-try Replay candidate/u);
    assert.throws(() => selectExactPrivateTwoTryReplayCandidate(
      [map, {...candidate, sourceCount: '1'}], animationId),
    /exact private two-try Replay candidate/u);
  });

test('B seek selects one private candidate and covers all source stop vectors',
  () => {
    const expectedVectors = {
      'shared-alg001-l11-p026': {guided: [], quiz: 180},
      'shared-alg001-l11-p027': {guided: [], quiz: 133},
      'shared-alg001-l11-p028': {guided: [], quiz: 127},
      'shared-alg001-l11-p029': {guided: [], quiz: 61},
      'shared-alg001-l11-p030': {guided: [], quiz: 63},
      'shared-alg001-l11-p031': {guided: [], quiz: 131},
      'shared-alg001-l11-p032': {guided: [], quiz: 128},
      'shared-alg001-l11-p040': {guided: [338, 497, 629, 753], quiz: 812},
      'shared-alg001-l11-p041': {guided: [415, 573, 705, 829], quiz: 884},
      'shared-alg001-l11-p042': {guided: [499, 660, 793, 917], quiz: 982},
    };
    const derivedVectors = Object.fromEntries(B_IDS.map((animationId) => {
      const member = auditB.members.find((entry) =>
        entry.animationId === animationId);
      return [animationId, {guided: [...new Set(member.sourceStateMachine
        .guidedHits.map((hit) => hit.frame))],
      quiz: member.sourceStateMachine.quizFrame}];
    }));
    assert.deepEqual(derivedVectors, expectedVectors);
    for (const animationId of B_IDS) {
      assert.equal(exactPrivateCandidateSelector(animationId),
        `[data-animation-id="${animationId}"]` +
        '[data-private-current-js="true"]');
      for (const [targetFrame, activePhase] of [
        ...derivedVectors[animationId].guided.map((frame) =>
          [frame, 'guided-stop']),
        [derivedVectors[animationId].quiz, 'choosing'],
      ]) {
        const map = {animationId, privateCurrentJs: null,
          activeStopFrame: null, activePhase: null};
        const candidate = {animationId, privateCurrentJs: 'true',
          activeStopFrame: String(targetFrame), activePhase};
        assert.equal(selectExactPrivateBSeekCandidate([map, candidate],
          animationId, targetFrame, activePhase), candidate);
      }
    }
    const animationId = B_IDS[0];
    const targetFrame = derivedVectors[animationId].quiz;
    const map = {animationId, privateCurrentJs: null, activeStopFrame: null,
      activePhase: null};
    const candidate = {animationId, privateCurrentJs: 'true',
      activeStopFrame: String(targetFrame), activePhase: 'choosing'};
    assert.throws(() => selectExactPrivateBSeekCandidate([map], animationId,
      targetFrame, 'choosing'), /exact private B seek candidate/u);
    assert.throws(() => selectExactPrivateBSeekCandidate(
      [map, candidate, {...candidate}], animationId, targetFrame, 'choosing'),
    /exact private B seek candidate/u);
    assert.throws(() => selectExactPrivateBSeekCandidate(
      [map, {...candidate, activeStopFrame: null}], animationId, targetFrame,
      'choosing'), /exact private B seek candidate/u);
    assert.throws(() => selectExactPrivateBSeekCandidate(
      [map, {...candidate, activeStopFrame: '181'}], animationId, targetFrame,
      'choosing'), /exact private B seek candidate/u);
    assert.throws(() => selectExactPrivateBSeekCandidate(
      [map, {...candidate, activePhase: 'timeline'}], animationId, targetFrame,
      'choosing'), /exact private B seek candidate/u);
    const resumed = {runtimePaused: 'false', interactiveStopHeld: 'true'};
    assert.equal(assertBSeekResumeRuntime(resumed), true);
    assert.throws(() => assertBSeekResumeRuntime({...resumed,
      runtimePaused: 'true'}), /resume runtime/u);
    assert.throws(() => assertBSeekResumeRuntime({...resumed,
      interactiveStopHeld: 'false'}), /resume runtime/u);
  });

test('all ten B receipts lock guided stops, visible labels, help, stale absence, and host reset',
  () => {
    for (const id of B_IDS) {
      const member = auditB.members.find((entry) => entry.animationId === id);
      const stops = [...new Set(member.sourceStateMachine.guidedHits
        .map((hit) => hit.frame))].map((frame) =>
        ({frame, phase: 'guided-stop'}));
      stops.push({frame: member.sourceStateMachine.quizFrame,
        phase: 'choosing'});
      const receipt = {animationId: id, familyId: member.familyId,
        guidedStopFrames: [...new Set(member.sourceStateMachine.guidedHits
          .map((hit) => hit.frame))], guidedStopsPassed: true,
        naturalStopTraversals: {initial: stops, replay: stops},
        visibleLabels: member.answerVisibleGeometryCrosswalk.rows.map((row) =>
          ({label: row.visibleLabel, sourceInstanceName: row.instanceName,
            sourceCharacterId: row.characterId, correct: row.correct})),
        correctSlot: member.answerVisibleGeometryCrosswalk.correct.visibleLabel,
        correctSemanticAnswer:
          member.answerVisibleGeometryCrosswalk.correct.semanticAnswer,
        specialMathGeometry: id.endsWith('p028')
          ? {kind: 'number-line-graph', boundary: '2', closed: 'false',
            direction: 'right'}
          : id.endsWith('p030')
            ? {kind: 'absolute-value-inequality', bars: '2',
              operator: 'less-than', text: '|x| < 5'} : null,
        p029FeedbackTexts: id.endsWith('p029') ? [
          member.sourceStateMachine.p029FeedbackSequence.firstWrong.visibleText,
          member.sourceStateMachine.p029FeedbackSequence.secondWrong.visibleText,
        ] : null,
        firstWrongPassed: true, secondWrongPassed: true, rightPassed: true,
        helpLifecycle: {before: 0, open: 1, close: 0, replay: 0},
        staleOverlayCounts: {before: 0, open: 0, close: 0, replay: 0},
        pausePassed: true,
        hostFeedbackTransitions: [false, true, false, true, false, true, false],
        replayResetPassed: true, pageSpecificAssetRequestCount: 0, errors: [],
        screenshot: SCREENSHOT};
      assert.equal(assertBPageBrowserReceipt(receipt, member), true);
      assert.throws(() => assertBPageBrowserReceipt({...receipt,
        naturalStopTraversals: {initial: stops, replay: []}}, member),
      /B browser/u);
      if (stops.length > 1) assert.throws(() =>
        assertBPageBrowserReceipt({...receipt, naturalStopTraversals: {
          initial: stops, replay: stops.slice(-1)}}, member), /B browser/u);
      assert.throws(() => assertBPageBrowserReceipt({...receipt,
        staleOverlayCounts: {...receipt.staleOverlayCounts, open: 1}}, member),
      /B browser/u);
      if (id.endsWith('p028')) assert.throws(() =>
        assertBPageBrowserReceipt({...receipt,
          specialMathGeometry: {...receipt.specialMathGeometry,
            direction: 'left'}}, member), /B browser/u);
      if (id.endsWith('p029')) assert.throws(() =>
        assertBPageBrowserReceipt({...receipt,
          p029FeedbackTexts: [...receipt.p029FeedbackTexts].reverse()}, member),
      /B browser/u);
    }
  });

test('D receipts lock navigation, both matching levels, and assessment review/reset',
  () => {
    const controller = {animationId: D_IDS[0],
      sourceHandoffArities: [2, 3], selectedLevels: [2, 1],
      targetAnimationIds: [D_IDS[1], D_IDS[1]], targetLevels: [2, 1],
      navigationAllowedCount: 2, legacyOperationRequestCount: 0,
      legacyCallExecuted: false, pausePassed: true,
      replayResetPassed: true, pageSpecificAssetRequestCount: 0, errors: [],
      screenshot: SCREENSHOT};
    assert.equal(assertDControllerBrowserReceipt(controller), true);
    assert.throws(() => assertDControllerBrowserReceipt({...controller,
      sourceHandoffArities: [2, 2]}), /controller/u);
    assert.throws(() => assertDControllerBrowserReceipt({...controller,
      legacyCallExecuted: true}), /controller/u);
    assert.throws(() => assertDControllerBrowserReceipt({...controller,
      legacyOperationRequestCount: 1}), /controller/u);
    const matching = {animationId: D_IDS[1], sourceCardCount: 24,
      levelCount: 2, levelOneWrongScore: -2, levelOneCorrectScore: 8,
      levelTwoFinalScore: 60, matchedPairCount: 6,
      bothLevelsPassed: true, feedbackDisablePassed: true,
      replayResetPassed: true, pageSpecificAssetRequestCount: 0, errors: [],
      screenshot: SCREENSHOT};
    assert.equal(assertDMatchingBrowserReceipt(matching), true);
    assert.throws(() => assertDMatchingBrowserReceipt({...matching,
      levelTwoFinalScore: 58}), /matching/u);
    const initialQuestions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const assessment = {animationId: D_IDS[2], initialQuestions,
      replayQuestions: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], poolSize: 24,
      uniqueQuestionCount: 10, wrongAnswerCount: 1, rightAnswerCount: 9,
      score: 9, grade: 'Advanced', reviewOrder: initialQuestions,
      reviewPassed: true, resetPassed: true,
      pageSpecificAssetRequestCount: 0, errors: [], screenshot: SCREENSHOT};
    assert.equal(assertDAssessmentBrowserReceipt(assessment), true);
    assert.throws(() => assertDAssessmentBrowserReceipt({...assessment,
      replayQuestions: initialQuestions}), /assessment/u);
  });

test('predecessor receipt binds one current canvas asset and does not inflate historical interaction claims',
  () => {
    const historical = final354.samples[0];
    const registered = freeze354.selectedPages.find((entry) =>
      entry.animationId === historical.animationId);
    const asset = {url: 'http://127.0.0.1:3324/flash-assets/g678-local/' +
      `${registered.animationId}/canvas-renderer.js?sha256=` +
      registered.runtime.canvasRenderer.sha256, status: 200,
    cacheControl: 'private, no-store, max-age=0',
    contentType: 'text/javascript; charset=utf-8', corp: 'same-origin',
    nosniff: 'nosniff'};
    const receipt = {animationId: historical.animationId,
      historicalKind: historical.kind, frameCount: historical.frameCount,
      frameDomain: registered.runtime.frameDomain, initialFrame: 1,
      replayFrame: 1, replayCounterBefore: 0, replayCounterAfter: 1,
      renderState: 'ready', asset,
      fullHistoricalInteractionReplayed: false, requests: [], errors: []};
    assert.equal(assertPredecessor104ReplayReceipt(receipt, historical,
      registered), true);
    assert.throws(() => assertPredecessor104ReplayReceipt({...receipt,
      fullHistoricalInteractionReplayed: true}, historical, registered),
    /predecessor104 replay/u);
  });

test('All Lessons receipt locks 44 cards, sum377, ALG L9 and ALG L11 only complete',
  () => {
    const syntheticFreeze = {selectedPages: [...freeze354.selectedPages,
      ...IDS.map((animationId) => ({animationId,
        stableLessonKey: 'shared-alg001-l11'}))]};
    const counts = new Map();
    for (const page of syntheticFreeze.selectedPages) counts.set(
      page.stableLessonKey, (counts.get(page.stableLessonKey) ?? 0) + 1);
    const vector = catalog.lessons.map((lesson) => ({
      stableLessonKey: lesson.stableLessonKey, moduleCode: lesson.moduleCode,
      lessonNumber: lesson.lessonNumber, activePageCount: lesson.activePageCount,
      registeredPageCount: counts.get(lesson.stableLessonKey) ?? 0}));
    const receipt = {sharedCardCount: 44, linkedCardCount: 0,
      registeredPageSum: 377, exactLessonVector: vector,
      completeLessonKeys: ['shared-alg001-l09', 'shared-alg001-l11'],
      algL09: {registeredPageCount: 41, activePageCount: 41, complete: true},
      algL11: {registeredPageCount: 44, activePageCount: 44, complete: true},
      errors: []};
    assert.equal(assertAllLessons377Receipt(receipt, catalog, syntheticFreeze),
      true);
    assert.throws(() => assertAllLessons377Receipt({...receipt,
      registeredPageSum: 376}, catalog, syntheticFreeze), /All Lessons/u);
    assert.throws(() => assertAllLessons377Receipt({...receipt, extra: true},
      catalog, syntheticFreeze), /All Lessons/u);
  });
