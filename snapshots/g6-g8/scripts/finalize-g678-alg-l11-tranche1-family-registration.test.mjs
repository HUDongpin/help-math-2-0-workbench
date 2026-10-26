import assert from 'node:assert/strict';
import {constants as fsConstants} from 'node:fs';
import {
  copyFile,
  lstat,
  mkdtemp,
  readFile,
  rm,
  unlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  assertFinal354RequiredBinding,
  calibrateAlgL11Tranche1Page,
  FINAL354_REQUIRED_BINDINGS,
  OUTPUT_FRAGMENT,
  OUTPUT_FREEZE,
  prepareG678AlgL11Tranche1FamilyRegistration,
  rebindFinal342PageToCurrentHost,
} from './finalize-g678-alg-l11-tranche1-family-registration.mjs';

const provisional = JSON.parse(await readFile(new URL(
  '../catalog/product-bridge-calibrations/' +
    'g678-current-js-354-page-registration-v1.json',
  import.meta.url), 'utf8'));
const predecessor = JSON.parse(await readFile(new URL(
  '../catalog/product-bridge-calibrations/' +
    'g678-current-js-342-page-product-calibrated-registration-v1.json',
  import.meta.url), 'utf8'));
const byId = new Map(provisional.selectedPages.map((page) =>
  [page.animationId, page]));
const boundInputs = Object.freeze({
  aggregateBrowser: FINAL354_REQUIRED_BINDINGS.aggregateBrowser,
  family: FINAL354_REQUIRED_BINDINGS.family,
  focusedBrowser: FINAL354_REQUIRED_BINDINGS.focusedBrowser,
  successorCompatibility: FINAL354_REQUIRED_BINDINGS.successorCompatibility,
});

function identity(stats) {
  return {
    dev: stats.dev,
    ino: stats.ino,
    mode: stats.mode,
    nlink: stats.nlink,
    size: stats.size,
  };
}

async function stableCanonicalRead(relativePath) {
  const target = path.isAbsolute(relativePath)
    ? relativePath
    : new URL(`../${relativePath}`, import.meta.url);
  const before = await lstat(target);
  const bytes = await readFile(target);
  const after = await lstat(target);
  assert.equal(before.isFile(), true);
  assert.equal(before.isSymbolicLink(), false);
  assert.deepEqual(identity(after), identity(before));
  assert.equal(bytes.length, before.size);
  return {bytes, identity: identity(before)};
}

async function createExclusiveFixture(target, bytes) {
  const temporary = `${target}.tmp`;
  await writeFile(temporary, bytes, {flag: 'wx'});
  try {
    await copyFile(temporary, target, fsConstants.COPYFILE_EXCL);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

test('final354 hard bindings reject path, byte, hash, and label substitution', () => {
  for (const [label, expected] of Object.entries(FINAL354_REQUIRED_BINDINGS)) {
    assert.equal(assertFinal354RequiredBinding(label, expected), true);
    for (const changed of [
      {...expected, path: `${expected.path}.other`},
      {...expected, bytes: expected.bytes + 1},
      {...expected, sha256: '0'.repeat(64)},
      {...expected, extra: true},
    ]) {
      assert.throws(() => assertFinal354RequiredBinding(label, changed),
        new RegExp(`final354 ${label} binding drifted`, 'u'));
    }
  }
  assert.throws(() => assertFinal354RequiredBinding('unknown',
    FINAL354_REQUIRED_BINDINGS.family), /final354 unknown binding drifted/u);
});

test('only exact12 loses its browser blocker and gains family calibration', () => {
  const p001 = calibrateAlgL11Tranche1Page(byId.get(
    'shared-alg001-l11-p001'), boundInputs);
  const p002 = calibrateAlgL11Tranche1Page(byId.get(
    'shared-alg001-l11-p002'), boundInputs);
  for (const page of [p001, p002]) {
    assert.equal(page.productBlockers.includes(
      'alg-l11-tranche1-browser-product-calibration-pending'), false);
    assert.equal(page.implementation.familyVisualPlaybackCalibrationPassed,
      true);
    assert.equal(page.productHostCalibration.familyCurrentJsCalibrationPassed,
      true);
    assert.equal(page.productCalibrationPassed, false);
    assert.equal(page.engineeringPreviewReady, false);
  }
  assert.equal(p001.productHostCalibration
    .typedGlossaryHostOpenPauseCloseFocusPassed, false);
  assert.equal(p002.productHostCalibration
    .typedGlossaryHostOpenPauseCloseFocusPassed, true);
  assert.deepEqual(p002.productHostCalibration.familyAuthority,
    FINAL354_REQUIRED_BINDINGS.family);
  assert.deepEqual(p002.productHostCalibration.browserEvidence,
    FINAL354_REQUIRED_BINDINGS.aggregateBrowser);
});

test('exact12 page transformation rejects family, blocker, and presentation drift', () => {
  const p002 = byId.get('shared-alg001-l11-p002');
  assert.throws(() => calibrateAlgL11Tranche1Page({...p002,
    animationId: 'shared-alg001-l11-p005'}, boundInputs),
  /outside exact12/u);
  assert.throws(() => calibrateAlgL11Tranche1Page({...p002,
    adapterFamily: 'alg-l11-simple-glossary-tranche1-source-static'},
  boundInputs), /adapter family drifted/u);
  assert.throws(() => calibrateAlgL11Tranche1Page({...p002,
    productBlockers: p002.productBlockers.filter((blocker) =>
      blocker !== 'alg-l11-tranche1-browser-product-calibration-pending')},
  boundInputs), /browser blocker is not exact/u);
  assert.throws(() => calibrateAlgL11Tranche1Page({...p002,
    productBlockers: [...p002.productBlockers,
      'alg-l11-tranche1-browser-product-calibration-pending']},
  boundInputs), /browser blocker is not exact/u);
  assert.throws(() => calibrateAlgL11Tranche1Page({...p002,
    presentation: {pageInteractionCompanionTargetIdSuffix: 'substituted'}},
  boundInputs), /glossary presentation drifted/u);
});

test('final342 current-host rebind changes only an existing browser evidence field', () => {
  const page = predecessor.selectedPages.find((candidate) =>
    candidate.animationId === 'shared-alg001-l11-p005');
  const rebound = rebindFinal342PageToCurrentHost(page,
    FINAL354_REQUIRED_BINDINGS.aggregateBrowser);
  assert.deepEqual(rebound.productHostCalibration.browserEvidence,
    FINAL354_REQUIRED_BINDINGS.aggregateBrowser);
  assert.deepEqual({...rebound, productHostCalibration: {
    ...rebound.productHostCalibration, browserEvidence: null}},
  {...page, productHostCalibration: {
    ...page.productHostCalibration, browserEvidence: null}});
  const uncalibrated = predecessor.selectedPages.find((candidate) =>
    !candidate.productHostCalibration);
  assert.strictEqual(rebindFinal342PageToCurrentHost(uncalibrated,
    FINAL354_REQUIRED_BINDINGS.aggregateBrowser), uncalibrated);
});

test('the unchanged product bridge resolves final354 only through exact registry binding', async () => {
  const bridge = await readFile(new URL(
    '../apps/web/lib/g678-calibration-product-bridge.server.ts',
    import.meta.url), 'utf8');
  assert.match(bridge,
    /\^g678-current-js-\\d\+-page\(\?:-product-calibrated\)\?-registration-v1\\\.json\$/u);
  assert.match(bridge,
    /const freezeSha256s = new Set\(registrations\.map/u);
  assert.match(bridge,
    /if \(freezeSha256s\.size !== 1\)/u);
  assert.match(bridge,
    /value\.deploymentScope === 'local-only' &&\s*array\(value\.selectedPages\)\.length === registrations\.length/u);
  assert.match(bridge,
    /if \(candidates\.length !== 1\)/u);
});

test('prepare builds exact post-family artifacts without writing them', async () => {
  const beforeFreeze = await stableCanonicalRead(OUTPUT_FREEZE);
  const beforeFragment = await stableCanonicalRead(OUTPUT_FRAGMENT);
  const artifacts = await prepareG678AlgL11Tranche1FamilyRegistration();
  const afterFreeze = await stableCanonicalRead(OUTPUT_FREEZE);
  const afterFragment = await stableCanonicalRead(OUTPUT_FRAGMENT);
  assert.deepEqual(afterFreeze.identity, beforeFreeze.identity);
  assert.deepEqual(afterFragment.identity, beforeFragment.identity);
  assert.deepEqual(afterFreeze.bytes, beforeFreeze.bytes);
  assert.deepEqual(afterFragment.bytes, beforeFragment.bytes);
  assert.deepEqual(artifacts.freezeBytes, beforeFreeze.bytes);
  assert.deepEqual(artifacts.fragmentBytes, beforeFragment.bytes);

  const {freeze, fragment} = artifacts;
  assert.equal(freeze.status,
    'private-current-js-product-host-calibrated-candidates-registered');
  assert.equal(freeze.selectedPages.length, 354);
  const finalById = new Map(freeze.selectedPages.map((page) =>
    [page.animationId, page]));
  const withoutBrowser = (page) => page.productHostCalibration
    ? {...page, productHostCalibration: {...page.productHostCalibration,
        browserEvidence: null}}
    : page;
  assert.equal(predecessor.selectedPages.every((page) =>
    JSON.stringify(withoutBrowser(finalById.get(page.animationId))) ===
      JSON.stringify(withoutBrowser(page))), true);
  assert.equal(predecessor.selectedPages.filter((page) =>
    page.productHostCalibration).length, 126);
  assert.equal(predecessor.selectedPages.filter((page) =>
    page.productHostCalibration).every((page) =>
      JSON.stringify(finalById.get(page.animationId).productHostCalibration
        .browserEvidence) === JSON.stringify(
        FINAL354_REQUIRED_BINDINGS.aggregateBrowser)), true);
  const calibrated = freeze.selectedPages.filter((page) =>
    page.productHostCalibration?.familyCurrentJsCalibrationPassed === true &&
      page.productHostCalibration?.familyAuthority?.sha256 ===
        FINAL354_REQUIRED_BINDINGS.family.sha256);
  assert.equal(calibrated.length, 12);
  assert.equal(calibrated.every((page) =>
    !page.productBlockers.includes(
      'alg-l11-tranche1-browser-product-calibration-pending')), true);
  assert.deepEqual(freeze.productHostCalibration, {
    familyCalibratedPlacementCount: 138,
    familyCalibrationCount: 22,
    algL11Tranche1FamilyCalibratedPlacementCount: 12,
    currentHostPredecessorReplayCount: 92,
    currentHostLiveSampleRecordCount: 104,
    browserSampleCount: 104,
    screenshotCount: 111,
    oneCompleteAnd43PartialRegistrationTruthful: true,
    wholeLessonEngineeringPreviewCount: 1,
    newWholeLessonEngineeringPreviewCount: 0,
    browserProductCalibrationPassed: true,
    overallG678ProductCalibrationPassed: false,
  });
  assert.equal(Object.values(freeze.acceptanceEffects).every((value) =>
    value === false), true);
  const authorityPaths = freeze.inputs.selectionAuthorities.map((item) =>
    item.path);
  assert.equal(authorityPaths.includes(
    FINAL354_REQUIRED_BINDINGS.family.path), false);
  assert.equal(authorityPaths.includes(
    FINAL354_REQUIRED_BINDINGS.successorCompatibility.path), false);
  assert.equal(authorityPaths.includes(
    FINAL354_REQUIRED_BINDINGS.provisionalFreeze.path), true);
  assert.equal(predecessor.inputs.selectionAuthorities.every((item) =>
    authorityPaths.includes(item.path)), true);
  assert.deepEqual(freeze.inputs.algL11Tranche1FamilyCalibration,
    FINAL354_REQUIRED_BINDINGS.family);
  assert.deepEqual(freeze.inputs.successorCompatibilityAudit,
    FINAL354_REQUIRED_BINDINGS.successorCompatibility);
  assert.equal(fragment.calibration.freezeManifest, OUTPUT_FREEZE);
  assert.equal(fragment.freeze.path, OUTPUT_FREEZE);
  assert.equal(fragment.freeze.bytes, artifacts.freezeBytes.length);
  assert.equal(fragment.registrationBoundary.exactRegisteredPlacementCount,
    354);
  assert.equal(fragment.registrationBoundary
    .exactPredecessorPlacementCountPreserved, 342);
  assert.equal(fragment.registrationBoundary
    .exactNewFamilyCalibratedPlacementCount, 12);
  assert.equal(fragment.familyScaleout.overallG678ProductCalibrationPassed,
    false);
  assert.equal(Object.values(fragment.acceptanceEffects).every((value) =>
    value === false), true);
});

test('the finalizer create-exclusive primitive publishes once and never overwrites',
  async (t) => {
    const finalizerSource = await readFile(new URL(
      './finalize-g678-alg-l11-tranche1-family-registration.mjs',
      import.meta.url), 'utf8');
    assert.match(finalizerSource,
      /await writeFile\(temporary, bytes, \{flag: 'wx'\}\);/u);
    assert.match(finalizerSource,
      /await copyFile\(temporary, target, fsConstants\.COPYFILE_EXCL\);/u);

    const fixtureRoot = await mkdtemp(path.join(os.tmpdir(),
      'g678-final354-create-exclusive-'));
    t.after(() => rm(fixtureRoot, {recursive: true, force: true}));
    const target = path.join(fixtureRoot, 'freeze.json');
    const original = Buffer.from('first-final354\n', 'utf8');
    const replacement = Buffer.from('replacement-must-not-win\n', 'utf8');
    await createExclusiveFixture(target, original);
    const published = await stableCanonicalRead(target);
    assert.deepEqual(published.bytes, original);
    await assert.rejects(createExclusiveFixture(target, replacement),
      (error) => error?.code === 'EEXIST');
    assert.deepEqual(await readFile(target), original);
  });
