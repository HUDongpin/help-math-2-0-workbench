#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ID,CALIBRATION,build} from './build-g678-nms-l01-p007-v5.mjs';
import {ROOT,encode,pin,readBound} from './lib/g678-nms-l01-p007-generator-v1.mjs';
const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`,FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json'),RUN=`work/g678-shared-page-factory/${CALIBRATION}`;
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';
import {guardedReplacement} from './activate-g678-frozen16-glossary-registration.mjs';
import {GENERATED_OUTPUTS, expectedScopedRegistryOutputs} from './activate-g678-alg-l11-feedback-host-score-registration.mjs';
import {buildRegistrySources} from '../packages/demos/scripts/generate-registry.mjs';

export const RECEIPT = `${FREEZE.slice(0, -5)}.activation.json`;
const REGISTRY = 'packages/demos/private-current-js-registry.json';
const PRIOR_SHA = '424ffb61bc9f42a99dcd7d862e028e19887de32feae0b4bc99dde22a1a008a79';
const PREVIOUS_CALIBRATION='g678-nms-l01-p007-current-js-v4';
const RECOVERY = `${RUN}-activation`;
const TARGETS = [REGISTRY, GENERATED_OUTPUTS.localOnly, GENERATED_OUTPUTS.localOnlyMetadata];

export async function activate({check = false, planOnly = false} = {}) {
  await build({check: true});
  const fragmentFile = await readBound(FRAGMENT), freezeFile = await readBound(FREEZE);
  const fragment = JSON.parse(fragmentFile.bytes), freeze = JSON.parse(freezeFile.bytes);
  assert.equal(fragment.calibration.calibrationId, CALIBRATION);
  assert.deepEqual(fragment.calibration.entries, [freeze.entry]);
  const verify = async () => {
    await readBound(FRAGMENT, fragmentFile.binding); await readBound(FREEZE, freezeFile.binding); await build({check: true});
  };
  const current = await readBound(REGISTRY), registry = JSON.parse(current.bytes);
  const outputs = Object.fromEntries(await Promise.all(Object.entries(GENERATED_OUTPUTS).map(async ([key, file]) => [key, (await readBound(file)).bytes])));
  const before = new Map([[REGISTRY, current.bytes], ...Object.entries(GENERATED_OUTPUTS).map(([key, file]) => [file, outputs[key]])]);
  if (check) {
    const receipt = JSON.parse(await readFile(path.join(ROOT, RECEIPT)));
    assert.equal(receipt.beforeRegistry.sha256, PRIOR_SHA); assert.deepEqual(receipt.addedIds, []); assert.deepEqual(receipt.reboundIds,[ID]);
    assert.deepEqual(registry.calibrations.find(c => c.calibrationId === CALIBRATION), fragment.calibration);
    assert.equal(registry.calibrations.flatMap(c => c.entries).filter(e => e.key.startsWith('shared-')).length, 393);
    for (const expected of receipt.after) await readBound(expected.path, expected);
    const generated = await buildRegistrySources(); for (const [key, bytes] of Object.entries(outputs)) assert.equal(bytes.toString(), generated[key]);
    await verify(); return {checked: true, registered: 393, publicFilesWritten: 0};
  }
  assert.equal(current.binding.sha256, PRIOR_SHA, 'exact predecessor registry required');
  assert.equal(registry.calibrations.flatMap(c => c.entries).filter(e => e.key.startsWith('shared-')).length, 393);
  assert.deepEqual(outputs, expectedScopedRegistryOutputs(registry, outputs));
  const predecessor=registry.calibrations.find(c=>c.calibrationId===PREVIOUS_CALIBRATION);
  assert(predecessor);assert.deepEqual(predecessor.entries,fragment.calibration.entries,'drawing artifacts unchanged');
  const retained={...registry,calibrations:registry.calibrations.filter(c=>c.calibrationId!==PREVIOUS_CALIBRATION)};
  const nextRegistry = upsertPrivateCurrentJsCalibration(retained, fragment.calibration);
  assert.deepEqual(nextRegistry.calibrations.filter(c => c.calibrationId !== CALIBRATION), retained.calibrations, 'all existing calibrations preserved');
  const nextOutputs = expectedScopedRegistryOutputs(nextRegistry, outputs);
  const after = new Map([[REGISTRY, Buffer.from(encode(nextRegistry))], ...Object.entries(GENERATED_OUTPUTS).map(([key, file]) => [file, nextOutputs[key]])]);
  const summary = {beforeRegistry: current.binding, after: [...after].map(([file, bytes]) => pin(file, bytes)),
    addedIds: [], reboundIds:[ID], preservedG678Placements: 392, changedExistingPlacements: 1, publicFilesWritten: 0};
  if (planOnly) return {...summary, planOnly: true, writes: 0};
  const postflight = async () => {
    const generated = await buildRegistrySources(); for (const [key, bytes] of Object.entries(nextOutputs)) assert.equal(bytes.toString(), generated[key]);
  };
  const transaction = await guardedReplacement({root: ROOT, before, after, targets: TARGETS, recovery: RECOVERY, verify, postflight});
  await writeFile(path.join(ROOT, RECEIPT), encode({schemaVersion: 1, createdAt: new Date().toISOString(),
    status: 'local-registration-rebound-after-focus-repair-product-qa-pending', ...summary, transaction,
    freeze: freezeFile.binding, fragment: fragmentFile.binding, productCalibrationPassed: false, scaleOutAuthorized: false,
    acceptanceEffects: freeze.acceptanceEffects}), {flag: 'wx'});
  return {registered: 393, addedIds: [], reboundIds:[ID], publicFilesWritten: 0, receipt: RECEIPT};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert(process.argv.length === 3 && ['--plan', '--write', '--check'].includes(process.argv[2]));
  console.log(encode(await activate({check: process.argv[2] === '--check', planOnly: process.argv[2] === '--plan'})));
}
