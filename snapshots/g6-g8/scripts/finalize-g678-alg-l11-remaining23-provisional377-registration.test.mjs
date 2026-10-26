import assert from 'node:assert/strict';
import {mkdir, mkdtemp, readFile, realpath, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  assertProvisional377RequiredBinding,
  finalizeG678AlgL11Remaining23Provisional377Registration,
  maintainedDomBinding,
  OUTPUT_FRAGMENT,
  OUTPUT_FREEZE,
  prepareG678AlgL11Remaining23Provisional377Registration,
  PROVISIONAL377_REQUIRED_BINDINGS,
} from './finalize-g678-alg-l11-remaining23-provisional377-registration.mjs';

const predecessor = JSON.parse(await readFile(new URL(
  '../catalog/product-bridge-calibrations/' +
    'g678-current-js-354-page-product-calibrated-registration-v1.json',
  import.meta.url), 'utf8'));

test('provisional377 exact hard bindings reject path byte hash and label substitution', () => {
  for (const [label, expected] of Object.entries(
    PROVISIONAL377_REQUIRED_BINDINGS)) {
    assert.equal(assertProvisional377RequiredBinding(label, expected), true);
    for (const changed of [{...expected, path: `${expected.path}.copy`},
      {...expected, bytes: expected.bytes + 1},
      {...expected, sha256: '0'.repeat(64)}, {...expected, extra: true}]) {
      assert.throws(() => assertProvisional377RequiredBinding(label, changed),
        new RegExp(`provisional377 ${label} binding drifted`, 'u'));
    }
  }
  assert.throws(() => assertProvisional377RequiredBinding('unknown',
    PROVISIONAL377_REQUIRED_BINDINGS.interactive10Fragment),
  /provisional377 unknown binding drifted/u);
});

test('provisional377 admission consumes immutable witness and current successor only', async () => {
  const source = await readFile(new URL(
    './finalize-g678-alg-l11-remaining23-provisional377-registration.mjs',
    import.meta.url), 'utf8');
  assert.match(source,
    /freezeG678Final354PrivateCurrentJsRegistryWitness\(\{check: true\}\)/u);
  assert.match(source,
    /g678-final354-current-bridge-successor-compatibility-v1\.json/u);
  assert.doesNotMatch(source,
    /finalizeG678AlgL11Tranche1FamilyRegistration/u);
  assert.doesNotMatch(source,
    /auditG678Final342CurrentBridgeSuccessorCompatibility/u);
  assert.equal(PROVISIONAL377_REQUIRED_BINDINGS.predecessorRegistry.path,
    'catalog/product-bridge-calibrations/' +
      'g678-final354-private-current-js-registry-witness-v1.json');
});

test('maintained DOM discriminator rejects copied cross-kind or incomplete entries', () => {
  const entry = {key: 'shared-alg001-l11-p006', maturity: 'private-current-js',
    registrationCandidate: false, currentJavaScriptRegistered: false,
    moduleFile: {path: 'packages/demos/src/modules/example.tsx', bytes: 1,
      sha256: '1'.repeat(64)},
    timeline: {path: 'packages/demos/src/timelines/example.ts', bytes: 1,
      sha256: '2'.repeat(64)},
    memberManifest: {path: 'work/example/member-manifest.json', bytes: 1,
      sha256: '3'.repeat(64)}};
  const run = {path: 'work/example/run-manifest.json', bytes: 1,
    sha256: '4'.repeat(64)};
  assert.deepEqual(maintainedDomBinding(entry, run), {
    kind: 'maintained-dom-module-v1', module: entry.moduleFile,
    timeline: entry.timeline, memberManifest: entry.memberManifest,
    sourceRun: run});
  assert.throws(() => maintainedDomBinding({...entry,
    maturity: 'legacy-prototype'}, run), /maintained DOM entry boundary drifted/u);
  assert.throws(() => maintainedDomBinding({...entry,
    registrationCandidate: true}, run), /maintained DOM entry boundary drifted/u);
  assert.throws(() => maintainedDomBinding({...entry,
    memberManifest: undefined}, run), /maintained DOM entry boundary drifted/u);
});

test('prepare projects exact377 without mutating absent or canonical outputs', async () => {
  const outputUrls = [OUTPUT_FREEZE, OUTPUT_FRAGMENT].map((relativePath) =>
    new URL(`../${relativePath}`, import.meta.url));
  const stableRead = (url) => readFile(url).catch((error) => {
    if (error?.code === 'ENOENT') return null;
    throw error;
  });
  const before = await Promise.all(outputUrls.map(stableRead));
  const artifacts =
    await prepareG678AlgL11Remaining23Provisional377Registration();
  const after = await Promise.all(outputUrls.map(stableRead));
  assert.deepEqual(after, before);
  if (before[0]) assert.deepEqual(before[0], artifacts.freezeBytes);
  if (before[1]) assert.deepEqual(before[1], artifacts.fragmentBytes);
  const {freeze, fragment} = artifacts;
  assert.equal(freeze.selectedPages.length, 377);
  assert.equal(fragment.calibration.entries.length, 377);
  assert.equal(new Set(freeze.selectedPages.map((page) =>
    page.animationId)).size, 377);
  const byId = new Map(freeze.selectedPages.map((page) =>
    [page.animationId, page]));
  assert.equal(predecessor.selectedPages.every((page) =>
    JSON.stringify(byId.get(page.animationId)) === JSON.stringify(page)), true);
  const added = freeze.selectedPages.filter((page) =>
    !predecessor.selectedPages.some((prior) =>
      prior.animationId === page.animationId));
  assert.equal(added.length, 23);
  assert.equal(added.every((page) =>
    page.runtime.rendererBinding.kind === 'maintained-dom-module-v1' &&
    page.runtime.canvasRenderer === undefined &&
    page.productBlockers[0] ===
      'alg-l11-remaining23-browser-product-calibration-pending' &&
    page.implementation.familyVisualPlaybackCalibrationPassed === false &&
    page.productCalibrationPassed === false &&
    page.engineeringPreviewReady === false), true);
  const newEntries = fragment.calibration.entries.filter((entry) =>
    entry.artifacts?.kind === 'maintained-dom-module-v1');
  assert.equal(newEntries.length, 23);
  assert.equal(newEntries.every((entry) => {
    const page = byId.get(entry.key);
    return JSON.stringify(entry.artifacts) ===
      JSON.stringify(page.runtime.rendererBinding) &&
      entry.module === `./modules/${entry.artifacts.module.path
        .split('/').at(-1).replace(/\.tsx$/u, '')}`;
  }), true);
  assert.equal(freeze.selectedPages.filter((page) =>
    page.stableLessonKey === 'shared-alg001-l11').length, 44);
  assert.equal(freeze.productHostCalibration.registeredCompleteLessonCount, 2);
  assert.equal(freeze.productHostCalibration
    .productCalibratedWholeLessonEngineeringPreviewCount, 1);
  assert.equal(freeze.productHostCalibration
    .newWholeLessonEngineeringPreviewCount, 0);
  assert.equal(freeze.productHostCalibration.currentHostBrowserRevalidated,
    false);
  assert.equal(freeze.productHostCalibration
    .requiredCurrentHostPredecessorReplayCount, 104);
  assert.equal(fragment.descriptorProjection.registeredCompleteLessonCount, 2);
  assert.deepEqual(fragment.descriptorProjection
    .exactRegisteredCompleteLessonKeys,
  ['shared-alg001-l09', 'shared-alg001-l11']);
  assert.equal(fragment.descriptorProjection.wholeLessonEngineeringPreviewCount,
    1);
  assert.equal(fragment.tranche.maintainedDomModulePlacementCount, 23);
  assert.equal(Object.values(freeze.acceptanceEffects).every((value) =>
    value === false), true);
  assert.equal(Object.values(fragment.acceptanceEffects).every((value) =>
    value === false), true);
});

test('selection authority extends final354 by exactly the three source fragments', async () => {
  const {freeze} =
    await prepareG678AlgL11Remaining23Provisional377Registration();
  const paths = freeze.inputs.selectionAuthorities.map((item) => item.path);
  assert.equal(paths.length,
    predecessor.inputs.selectionAuthorities.length + 3);
  assert.equal(new Set(paths).size, paths.length);
  assert.equal(predecessor.inputs.selectionAuthorities.every((authority) =>
    paths.includes(authority.path)), true);
  assert.deepEqual(paths.slice(-3), [
    PROVISIONAL377_REQUIRED_BINDINGS.interactive10Fragment.path,
    PROVISIONAL377_REQUIRED_BINDINGS.behavior10Fragment.path,
    PROVISIONAL377_REQUIRED_BINDINGS.advanced3Fragment.path,
  ]);
});

test('prepared fragment binds exact freeze bytes without write or release claims', async () => {
  const artifacts =
    await prepareG678AlgL11Remaining23Provisional377Registration();
  assert.equal(artifacts.fragment.freeze.path, OUTPUT_FREEZE);
  assert.equal(artifacts.fragment.freeze.bytes, artifacts.freezeBytes.length);
  assert.equal(artifacts.freeze.status,
    'private-current-js-calibration-candidates-generated');
  assert.equal(artifacts.freeze.registrationCandidatePlacementCount, 377);
  assert.equal(artifacts.freeze.engineeringPreviewReady, false);
  assert.equal(artifacts.freeze.productCalibrationPassed, false);
  assert.equal(artifacts.fragment.registrationBoundary
    .releaseOrPublicationAuthorized, false);
});

test('isolated finalizer write and check preserve create-exclusive terminal identity', async (t) => {
  const outputRoot = await realpath(await mkdtemp(path.join(os.tmpdir(),
    'g678-provisional377-finalizer-')));
  t.after(() => rm(outputRoot, {recursive: true, force: true}));
  await mkdir(path.join(outputRoot,
    'catalog/product-bridge-calibrations'), {recursive: true});
  const written =
    await finalizeG678AlgL11Remaining23Provisional377Registration({
      outputRoot});
  assert.equal(written.check, false);
  const checked =
    await finalizeG678AlgL11Remaining23Provisional377Registration({
      check: true, outputRoot});
  assert.equal(checked.check, true);
  const [freezeBefore, fragmentBefore] = await Promise.all([
    readFile(path.join(outputRoot, OUTPUT_FREEZE)),
    readFile(path.join(outputRoot, OUTPUT_FRAGMENT)),
  ]);
  await assert.rejects(
    finalizeG678AlgL11Remaining23Provisional377Registration({outputRoot}),
    /EEXIST/u);
  const [freezeAfter, fragmentAfter] = await Promise.all([
    readFile(path.join(outputRoot, OUTPUT_FREEZE)),
    readFile(path.join(outputRoot, OUTPUT_FRAGMENT)),
  ]);
  assert.deepEqual(freezeAfter, freezeBefore);
  assert.deepEqual(fragmentAfter, fragmentBefore);
});
