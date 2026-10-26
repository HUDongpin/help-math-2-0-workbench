import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  assertFinal354InputBindings,
  deriveFinal354LessonTruth,
  FINAL354_INPUT_SHA256,
} from './build-g678-calibration-funnel-354.mjs';

const ROOT = new URL('../', import.meta.url);
const readJson = (relative) => readFile(new URL(relative, ROOT), 'utf8')
  .then(JSON.parse);

test('final354 report binds every final input hash exactly', () => {
  const paths = {
    freeze:
      'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.json',
    fragment:
      'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.fragment.json',
    privateRegistry: 'packages/demos/private-current-js-registry.json',
    family:
      'catalog/product-bridge-calibrations/g678-alg-l11-tranche1-family-calibration-v1.json',
    focusedBrowser:
      'output/playwright/g678-alg-l11-tranche1-354-v1/evidence.json',
    aggregateBrowser:
      'output/playwright/g678-current-js-354-v1/evidence.json',
    successorCompatibility:
      'catalog/g678-final342-current-bridge-successor-compatibility-v1.json',
  };
  const bindings = Object.fromEntries(Object.entries(paths).map(
    ([key, path]) => [key, {path, sha256: FINAL354_INPUT_SHA256[key]}]));
  assert.equal(assertFinal354InputBindings(bindings), true);
  for (const key of Object.keys(bindings)) {
    assert.throws(() => assertFinal354InputBindings({...bindings,
      [key]: {...bindings[key], sha256: '0'.repeat(64)}}),
    new RegExp(`final354 ${key} binding drifted`, 'u'));
  }
});

test('final354 report derives 354 of 2282 and one-complete truth', async () => {
  const [catalog, freeze, focused] = await Promise.all([
    readJson('catalog/g678-shared-catalog.v1.json'),
    readJson(
      'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.json'),
    readJson('output/playwright/g678-alg-l11-tranche1-354-v1/evidence.json'),
  ]);
  const truth = deriveFinal354LessonTruth(catalog, freeze.selectedPages);
  assert.equal(truth.vector.length, 44);
  assert.equal(truth.vector.reduce((sum, lesson) =>
    sum + lesson.registeredPageCount, 0), 354);
  assert.deepEqual(truth.completeLessonKeys, ['shared-alg001-l09']);
  assert.equal(truth.partialLessonCount, 43);
  assert.deepEqual([truth.algL09.registeredPageCount,
    truth.algL09.activePageCount, truth.algL09.complete], [41, 41, true]);
  assert.deepEqual([truth.algL11.registeredPageCount,
    truth.algL11.activePageCount, truth.algL11.complete], [21, 44, false]);
  assert.deepEqual(truth.vector, focused.allLessons.exactLessonVector);
  assert.equal(focused.allLessons.linkedCardCount, 0);
  assert.throws(() => deriveFinal354LessonTruth(catalog,
    freeze.selectedPages.slice(1)), /lesson truth inputs drifted/u);
});

test('final354 report source preserves all downstream false gates', async () => {
  const source = await readFile(new URL(
    './build-g678-calibration-funnel-354.mjs', import.meta.url), 'utf8');
  for (const field of ['authoritativeOriginalRuntime', 'behaviorAccepted',
    'visualFidelityAccepted', 'audioAccepted', 'humanVisualAccepted',
    'ownerAccepted', 'strictComplete', 'releaseEligible', 'released',
    'published']) {
    assert.match(source, new RegExp(`${field}: false`, 'u'));
  }
  assert.match(source, /overallG678ProductCalibrationPassed: false/u);
  assert.match(source, /partialLessonCount: 43/u);
  assert.match(source, /linkedLessonCardCount: 0/u);
});
