import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  ALG_L11_TRANCHE1_IDS,
  OUTPUT_FRAGMENT,
  OUTPUT_FREEZE,
} from './finalize-g678-alg-l11-tranche1-registration.mjs';

const EXPECTED_IDS = [
  'shared-alg001-l11-p001',
  'shared-alg001-l11-p002',
  'shared-alg001-l11-p003',
  'shared-alg001-l11-p004',
  'shared-alg001-l11-p007',
  'shared-alg001-l11-p013',
  'shared-alg001-l11-p016',
  'shared-alg001-l11-p017',
  'shared-alg001-l11-p018',
  'shared-alg001-l11-p022',
  'shared-alg001-l11-p023',
  'shared-alg001-l11-p024',
];

test('provisional354 finalizer exports the exact ALG L11 tranche1 set', () => {
  assert.deepEqual(ALG_L11_TRANCHE1_IDS, EXPECTED_IDS);
  assert.equal(OUTPUT_FREEZE,
    'catalog/product-bridge-calibrations/g678-current-js-354-page-registration-v1.json');
  assert.equal(OUTPUT_FRAGMENT,
    'catalog/product-bridge-calibrations/g678-current-js-354-page-registration-v1.fragment.json');
});

test('provisional354 finalizer binds residual, predecessor, exact lesson counts, and false downstream gates', async () => {
  const source = await readFile(new URL(
    './finalize-g678-alg-l11-tranche1-registration.mjs', import.meta.url),
  'utf8');
  assert.match(source, /finalizeG678AlgL09GameAssessmentFamilyRegistration/u);
  assert.match(source, /auditG678AlgL11ResidualRouting/u);
  assert.match(source, /predecessorRegisteredPageCount === 9/u);
  assert.match(source, /selectedPages\.filter\(\(page\) =>[\s\S]*shared-alg001-l11/u);
  assert.match(source, /length === 21/u);
  assert.match(source, /exact\(completeLessonKeys, \['shared-alg001-l09'\]\)/u);
  assert.match(source, /wholeLessonEngineeringPreviewCount: 1/u);
  assert.match(source, /newWholeLessonEngineeringPreviewCount: 0/u);
  assert.match(source, /browserProductCalibrationPassed: false/u);
  assert.match(source, /UNDECODED_MATH_ENTITY/u);
  assert.match(source, /module does not expose private-current-js maturity/u);
  assert.match(source, /companionSuffixes\.length === 11/u);
  assert.match(source, /alg-l11-\$\{pageToken\}-glossary-controls/u);
  assert.match(source, /falseEffects\(acceptanceEffects/u);
});
