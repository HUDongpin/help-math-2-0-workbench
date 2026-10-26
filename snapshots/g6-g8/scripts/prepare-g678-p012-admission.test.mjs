import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile, readJsonPin, readPageProof, readRegistryTransaction, verifyHostVersion} from '../lib/g678-admission-proof.mjs';
import {P012_ADMISSION_CALIBRATION, P012_ADMISSION_ID, P012_ADMISSION_RUNTIME, P012_ADMISSION_SOURCE_ROOT,
  validateP012AdmissionSemantics} from '../lib/g678-p012-admission-semantics.mjs';
import {buildP012AdmissionPlan} from './prepare-g678-p012-admission.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('P012 preflight is read-only; an admitted page remains verifiable after registration', () => {
  const transaction = readRegistryTransaction(ROOT);
  if (transaction.registry.calibrations.some(item => item.calibrationId === P012_ADMISSION_CALIBRATION)) {
    const activation = readFileSync(path.join(ROOT, 'apps/web/lib/g678-admission-activation.ts'), 'utf8');
    const match = activation.match(/export const G678_ADMISSION_INDEX = (\{[\s\S]*?\}) as const;/);
    assert(match, 'current admission index pin');
    const index = readJsonPin(ROOT, JSON.parse(match[1]));
    const page = index.pages.find(item => item.animationId === P012_ADMISSION_ID);
    assert(page, 'registered P012 has an active proof');
    const packet = readPageProof(ROOT, page.proof, verifyHostVersion(ROOT, index.host), transaction);
    assert.equal(validateP012AdmissionSemantics(packet,
      transaction.registry.calibrations.find(item => item.calibrationId === P012_ADMISSION_CALIBRATION)), true);
    return;
  }
  const registryBefore = pinFile(ROOT, 'packages/demos/private-current-js-registry.json');
  const indexBefore = pinFile(ROOT, 'catalog/g678-admission-v1/index-v6.json');
  const plan = buildP012AdmissionPlan({root: ROOT, sourceRoot: P012_ADMISSION_SOURCE_ROOT});
  assert.equal(validateP012AdmissionSemantics(plan.packet, plan.fragment), true);
  assert.equal(plan.packet.selectedPages.length, 1);
  assert.equal(plan.packet.selectedPages[0].globalPageOrdinal, 12);
  assert.equal(plan.packet.entry.artifacts.runtime.sha256, P012_ADMISSION_RUNTIME.sha256);
  assert.equal(plan.output[0].bytes.length, P012_ADMISSION_RUNTIME.bytes);
  assert(plan.inputCount > 180, 'P012 extracted scripts, native assets, maintained code and tests are closed');
  for (const path of [
    'apps/web/components/g678-alg-l12-p012-host-lesson.tsx',
    'apps/web/lib/g678-alg-l12-p012-admission.server.ts',
    'apps/web/app/flash-assets/g678-local/shared-alg001-l12-p012/[asset]/route.ts',
    'apps/web/app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p012/page.tsx',
    'packages/demos/src/generated/alg-l12-p012-text-data.ts',
    'packages/demos/src/alg-l12-p012-text-binding.ts',
    'packages/demos/src/alg-l12-p012-typography-asset.ts',
    'packages/demos/src/alg-l12-p012-audio.ts',
    'scripts/build-g678-alg-l12-p012-audio-source.mjs',
    'scripts/build-g678-alg-l12-p012-graphics-source.mjs',
    'scripts/build-g678-alg-l12-p012-typography.mjs',
    'scripts/prepare-g678-p012-admission.mjs',
    'output/p011-source-triage-20260927-v1/TRIAGE_INVENTORY.json',
    'migrations/shared-alg001-l12-p012/graphics-source-v1/source-drawings.js',
  ]) assert(plan.packet.integrity.files.some(pin => pin.path === path), `closed ${path}`);
  assert.deepEqual(pinFile(ROOT, 'packages/demos/private-current-js-registry.json'), registryBefore);
  assert.deepEqual(pinFile(ROOT, 'catalog/g678-admission-v1/index-v6.json'), indexBefore);
});

test('producer refuses a different or indeterminate external source root', () => {
  assert.throws(() => buildP012AdmissionPlan({root: ROOT, sourceRoot: '/tmp'}));
  assert.throws(() => buildP012AdmissionPlan({root: ROOT, sourceRoot: ''}));
});
