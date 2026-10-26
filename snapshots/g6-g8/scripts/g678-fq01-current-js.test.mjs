import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {promisify} from 'node:util';

const execFileAsync = promisify(execFile);
const root = new URL('../', import.meta.url);
const readJson = async (relative) => JSON.parse(await readFile(
  new URL(relative, root), 'utf8'));
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('FQ01 authority closes the exact 44-placement family only', async () => {
  const [audit, family, freeze] = await Promise.all([
    readJson('catalog/g678-final-quiz-intro-family-audit-v1.json'),
    readJson('catalog/product-bridge-calibrations/g678-fq01-family-calibration-v1.json'),
    readJson('catalog/product-bridge-calibrations/g678-current-js-216-page-registration-v1.json'),
  ]);
  const audited = audit.records.flatMap((record) => record.placementIds).sort();
  const selected = freeze.selectedPages.filter((page) =>
    page.adapterFamily === 'final-quiz-intro-source-static');
  assert.equal(audited.length, 44);
  assert.equal(new Set(audited).size, 44);
  assert.deepEqual(family.authorizedPlacementIds, audited);
  assert.deepEqual(selected.map((page) => page.animationId).sort(), audited);
  assert.equal(selected.every((page) =>
    page.runtime.frameCount === 52 &&
      page.runtime.livePlaybackEndFrame === 52 &&
      page.productCalibrationPassed === false &&
      page.engineeringPreviewReady === false), true);
  assert.equal(family.scaleOutAuthorization.authorized, true);
  assert.equal(Object.values(family.acceptanceEffects).every(
    (value) => value === false), true);
});

test('current private registry preserves exact FQ01 hashes inside the 326-page successor', async () => {
  const [registry, fragment, freeze] = await Promise.all([
    readJson('packages/demos/private-current-js-registry.json'),
    readJson('catalog/product-bridge-calibrations/g678-current-js-326-page-product-calibrated-registration-v1.fragment.json'),
    readJson('catalog/product-bridge-calibrations/g678-current-js-326-page-product-calibrated-registration-v1.json'),
  ]);
  const calibration = registry.calibrations.find((candidate) =>
    candidate.calibrationId === 'g678-16-page-product-calibration-v1');
  assert.equal(calibration.entries.length, 326);
  assert.equal(fragment.calibration.entries.length, 326);
  assert.equal(freeze.selectedPages.length, 326);
  assert.equal(calibration.freezeManifest,
    'catalog/product-bridge-calibrations/g678-current-js-326-page-product-calibrated-registration-v1.json');
  assert.equal(calibration.freezeManifestSha256, fragment.freeze.sha256);
  const fqEntries = calibration.entries.filter((candidate) =>
    freeze.selectedPages.find((page) => page.animationId === candidate.key)
      ?.adapterFamily === 'final-quiz-intro-source-static');
  assert.equal(fqEntries.length, 44);
  for (const entry of fqEntries) {
    for (const artifact of Object.values(entry.artifacts)) {
      const bytes = await readFile(new URL(artifact.path, root));
      assert.equal(bytes.length, artifact.bytes);
      assert.equal(digest(bytes), artifact.sha256);
    }
  }
});

test('all 44 lessons remain truthful partial descriptors after FQ01 admission', async () => {
  const [catalog, freeze] = await Promise.all([
    readJson('catalog/g678-shared-catalog.v1.json'),
    readJson('catalog/product-bridge-calibrations/g678-current-js-216-page-registration-v1.json'),
  ]);
  const counts = new Map();
  for (const page of freeze.selectedPages) counts.set(page.stableLessonKey,
    (counts.get(page.stableLessonKey) ?? 0) + 1);
  assert.equal(catalog.lessons.length, 44);
  assert.equal(counts.size, 44);
  assert.equal([...counts.values()].reduce((sum, count) => sum + count, 0),
    216);
  assert.equal(catalog.lessons.every((lesson) => {
    const count = counts.get(lesson.stableLessonKey) ?? 0;
    return count > 0 && count < lesson.pages.length;
  }), true);
  assert.equal(freeze.engineeringPreviewReady, false);
  assert.equal(freeze.productCalibrationPassed, false);
});

test('FQ01 generators, finalizers, and historical browser receipt recheck', async () => {
  const env = {...process.env,
    HELP_MATH_G678_SOURCE_ROOT:
      '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'};
  const commands = [
    ['scripts/audit-g678-final-quiz-intro-family.mjs', '--check'],
    ['scripts/build-g678-fq01-current-js.mjs', '--phase=calibration', '--check'],
    ['scripts/finalize-g678-fq01-registration.mjs', '--phase=calibration', '--check'],
    ['scripts/check-g678-fq01-browser-calibration-receipt.mjs'],
    ['scripts/build-g678-fq01-family-calibration.mjs', '--check'],
    ['scripts/build-g678-fq01-current-js.mjs', '--phase=scaleout', '--check'],
    ['scripts/finalize-g678-fq01-registration.mjs', '--phase=final', '--check'],
  ];
  for (const args of commands) {
    const result = await execFileAsync(process.execPath, args,
      {cwd: new URL('.', root), env});
    assert.equal(result.stderr, '');
  }
});
