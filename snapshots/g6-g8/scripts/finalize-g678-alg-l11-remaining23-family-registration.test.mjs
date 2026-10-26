import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {IDS} from './qa-g678-alg-l11-remaining23-browser.mjs';
import {
  FINAL377_REQUIRED_BINDINGS,
  OUTPUT_FRAGMENT,
  OUTPUT_FREEZE,
  assertFinal377EvidenceSummary,
  assertFinal377RequiredBinding,
  buildFinal377Artifacts,
  calibrateFinal377Remaining23Page,
  final377BrowserBindingStatus,
  prepareG678AlgL11Remaining23FamilyRegistration,
} from './finalize-g678-alg-l11-remaining23-family-registration.mjs';

const provisionalFreeze = JSON.parse(await readFile(new URL(
  '../catalog/product-bridge-calibrations/' +
    'g678-current-js-377-page-registration-v1.json', import.meta.url)));
const provisionalFragment = JSON.parse(await readFile(new URL(
  '../catalog/product-bridge-calibrations/' +
    'g678-current-js-377-page-registration-v1.fragment.json',
  import.meta.url)));
const fakeBinding = (path, value = undefined) => ({path, bytes: 100,
  sha256: path.padEnd(64, 'a').slice(0, 64).replace(/[^a-f0-9]/gu, 'a'),
  ...(value === undefined ? {} : {value})});

function fixtures() {
  const oldIds = provisionalFreeze.selectedPages.filter((page) =>
    !IDS.includes(page.animationId)).slice(0, 104).map((page) =>
    page.animationId);
  const pageReceipts = IDS.map((animationId) => ({animationId, errors: [],
    screenshot: {path: `focused/${animationId}.png`, bytes: 1,
      sha256: 'a'.repeat(64)}}));
  const focused = {artifactType:
      'g678-alg-l11-remaining23-browser-qa-v1',
    registeredCurrentJsPages: 377,
    exact23Pages: IDS.map((animationId) => ({animationId,
      domModuleLoaded: true, pageSpecificAssetRequestCount: 0,
      deepProductBehaviorPassed: true})),
    aInteractive10: {pages: pageReceipts.slice(0, 10)},
    bBehavior10: {pages: pageReceipts.slice(10, 20)},
    dAdvanced3: {pages: pageReceipts.slice(20)},
    currentHostPredecessorReplay: {currentHostPredecessorReplayCount: 104,
      uniqueCurrentHostPredecessorModuleCount: 104,
      results: oldIds.map((animationId) => ({animationId, errors: [],
        replayCounterBefore: 0, replayCounterAfter: 1}))},
    requestPolicy: {allObservedRequestsLoopback: true,
      allObservedRequestsExplicitlyAllowed: true,
      legacyNetworkOperationsObserved: 0,
      guardMode: 'abort-unallowlisted-before-network',
      blockedRequestCount: 0},
    allLessons: {errors: []},
    screenshots: Array.from({length: 24}, (_, index) => ({
      path: `focused/${index}.png`, bytes: 1, sha256: 'b'.repeat(64)})),
    acceptanceEffects: {published: false}};
  const aggregate = {artifactType: 'g678-current-js-377-browser-qa-v1',
    registeredCurrentJsPages: 377,
    samples: [...oldIds, ...IDS].map((animationId) => ({animationId,
      currentHostBrowserRevalidated: true})),
    screenshots: Array.from({length: 135}, (_, index) => ({
      path: `aggregate/${index}.png`, bytes: 1, sha256: 'c'.repeat(64)})),
    browserEvidenceComposition: {currentHostPredecessorReplayCount: 104,
      currentHostNewPlacementDeepRecordCount: 23,
      currentHostLiveRecordCount: 127,
      currentHostUniqueSampledModuleCount: 127,
      fullHistoricalSpecialInteractionReplay: false,
      exact23FamilyCalibrationPending: true,
      overallG678ProductCalibrationPassed: false},
    acceptanceEffects: {published: false}};
  const family = {artifactType:
      'g678-alg-l11-remaining23-family-calibration-v1',
    status:
      'exact-23-alg-l11-private-current-js-product-host-calibrated-final-registration-pending',
    authorizedPlacementIds: IDS, auditedPlacementCount: 23,
    blockedPlacementCount: 0, focusedBrowserScreenshotCount: 24,
    currentHostPredecessorReplayCount: 104,
    aggregateCurrentHostLiveSampleRecordCount: 127,
    aggregateCurrentHostUniqueSampledModuleCount: 127,
    aggregateBrowserScreenshotCount: 135,
    productHostCalibration: {exact23FamilyCurrentJsCalibrationPassed: true,
      allBrowserConsoleAndPageErrorsZero: true,
      allObservedRequestsLoopback: true,
      allObservedRequestsExplicitlyAllowed: true,
      allLegacyNetworkOperationsBlocked: true,
      algL11Complete44Of44: true,
      overallG678ProductCalibrationPassed: false},
    authorization: {authorized: true, permitsOtherG678Placements: false,
      permitsFinal377Registration: false},
    acceptanceEffects: {published: false}};
  return {focused, aggregate, family};
}

test('final377 file admission stays null-gated until all browser artifacts are stable', async () => {
  assert.deepEqual(final377BrowserBindingStatus(), {ready: false,
    blocker: 'final377-browser-family-evidence-not-stable',
    pending: ['focusedBrowser', 'aggregateBrowser', 'family']});
  for (const label of ['provisionalFreeze', 'provisionalFragment', 'registry',
    'final354RegistryWitness', 'successorCompatibility']) {
    assert.equal(assertFinal377RequiredBinding(label,
      FINAL377_REQUIRED_BINDINGS[label]), true);
    assert.throws(() => assertFinal377RequiredBinding(label,
      {...FINAL377_REQUIRED_BINDINGS[label], bytes:
        FINAL377_REQUIRED_BINDINGS[label].bytes + 1}), /binding drifted/u);
  }
  for (const label of ['focusedBrowser', 'aggregateBrowser', 'family']) {
    assert.throws(() => assertFinal377RequiredBinding(label, {
      path: 'copied.json', bytes: 1, sha256: '0'.repeat(64)}),
    /browser\/family evidence is not stable/u);
  }
  await assert.rejects(prepareG678AlgL11Remaining23FamilyRegistration(),
    /BLOCKED_INSTRUCTIONAL_CONTENT_NOT_ADMITTED/u);
});

test('final377 evidence summary rejects screenshot request error and family drift', () => {
  const values = fixtures();
  assert.equal(assertFinal377EvidenceSummary({...values,
    provisional: provisionalFreeze}), true);
  for (const mutate of [
    (value) => { value.focused.screenshots.pop(); },
    (value) => { value.focused.requestPolicy.blockedRequestCount = 1; },
    (value) => { value.focused.aInteractive10.pages[0].errors = ['error']; },
    (value) => { value.aggregate.samples.pop(); },
    (value) => { value.family.authorizedPlacementIds = [...IDS].reverse(); },
    (value) => { value.family.acceptanceEffects.published = true; },
  ]) {
    const changed = structuredClone(values); mutate(changed);
    assert.throws(() => assertFinal377EvidenceSummary({...changed,
      provisional: provisionalFreeze}), /evidence drifted|authority drifted/u);
  }
});

test('final377 exact23 page cannot remove its blocker without actual content admission', () => {
  const page = provisionalFreeze.selectedPages.find((candidate) =>
    candidate.animationId === IDS[0]);
  const inputs = {focusedBrowser: fakeBinding('focused.json'),
    aggregateBrowser: fakeBinding('aggregate.json'),
    family: fakeBinding('family.json'),
    successorCompatibility: fakeBinding('successor.json')};
  const before = structuredClone(page);
  for (const contentAdmission of [undefined, {passed: true},
    {placementIds: IDS, allContentVisible: true}]) {
    assert.throws(() => calibrateFinal377Remaining23Page(page,
      {...inputs, contentAdmission}), /BLOCKED_INSTRUCTIONAL_CONTENT_NOT_ADMITTED/u);
  }
  assert.deepEqual(page, before);
});

test('pure final377 build rejects fabricated passing behavior and family objects', () => {
  const {focused, aggregate, family} = fixtures();
  const inputs = {
    provisionalFreeze: fakeBinding('provisional-freeze.json',
      provisionalFreeze),
    provisionalFragment: fakeBinding('provisional-fragment.json',
      provisionalFragment),
    focusedBrowser: fakeBinding('focused.json', focused),
    aggregateBrowser: fakeBinding('aggregate.json', aggregate),
    family: fakeBinding('family.json', family),
    successorCompatibility: fakeBinding('successor.json'),
    builder: fakeBinding('finalizer.mjs'),
  };
  assert.throws(() => buildFinal377Artifacts(inputs),
    /BLOCKED_INSTRUCTIONAL_CONTENT_NOT_ADMITTED/u);
  assert.throws(() => buildFinal377Artifacts({...inputs, contentAdmission: {
    contentContract: fakeBinding('all23-passed.json'),
    browserVisibleContent: fakeBinding('all23-visible.json'), placementIds: IDS,
  }}), /BLOCKED_INSTRUCTIONAL_CONTENT_NOT_ADMITTED/u);
});

test('final377 preparation never mutates absent or canonical outputs', async () => {
  const stableRead = (relativePath) => readFile(new URL(`../${relativePath}`,
    import.meta.url)).catch((error) => {
    if (error?.code === 'ENOENT') return null;
    throw error;
  });
  const paths = [OUTPUT_FREEZE, OUTPUT_FRAGMENT];
  const before = await Promise.all(paths.map(stableRead));
  if (final377BrowserBindingStatus().ready) {
    const prepared = await prepareG678AlgL11Remaining23FamilyRegistration();
    const after = await Promise.all(paths.map(stableRead));
    assert.deepEqual(after, before);
    if (before[0]) assert.deepEqual(before[0], prepared.freezeBytes);
    if (before[1]) assert.deepEqual(before[1], prepared.fragmentBytes);
  } else {
    assert.deepEqual(before, [null, null]);
  }
});

test('final377 publisher remains create-exclusive with exact check mode', async () => {
  const source = await readFile(new URL(
    './finalize-g678-alg-l11-remaining23-family-registration.mjs',
    import.meta.url), 'utf8');
  assert.match(source, /flag: 'wx'/u);
  assert.match(source, /fsConstants\.COPYFILE_EXCL/u);
  assert.match(source,
    /freeze\.buffer\.equals\(artifacts\.freezeBytes\)/u);
  assert.match(source,
    /fragment\.buffer\.equals\(artifacts\.fragmentBytes\)/u);
  assert.match(source, /nlink === 1n/u);
  assert.doesNotMatch(source, /releaseAuthorized:\s*true/u);
  assert.doesNotMatch(source, /published:\s*true/u);
});
