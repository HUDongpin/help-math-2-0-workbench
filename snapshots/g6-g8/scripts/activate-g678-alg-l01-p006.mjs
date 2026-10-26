#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT, ID, CALIBRATION, FRAGMENT, FREEZE, RUN, build, encode, pin, readBound} from './build-g678-alg-l01-p006-v3.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';
import {guardedReplacement} from './activate-g678-frozen16-glossary-registration.mjs';
import {GENERATED_OUTPUTS, expectedScopedRegistryOutputs} from './activate-g678-alg-l11-feedback-host-score-registration.mjs';
import {buildRegistrySources} from '../packages/demos/scripts/generate-registry.mjs';

export const RECEIPT = `${FREEZE.slice(0, -5)}.activation.json`;
const REGISTRY = 'packages/demos/private-current-js-registry.json';
const PRIOR_SHA = 'ae5d765565ff32c0f8eff3db94b6a18257e7a69cb705b52bc7b2831f8abafe7f';
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
    assert.equal(receipt.beforeRegistry.sha256, PRIOR_SHA); assert.deepEqual(receipt.addedIds, [ID]);
    assert.deepEqual(registry.calibrations.find(c => c.calibrationId === CALIBRATION), fragment.calibration);
    assert.equal(registry.calibrations.flatMap(c => c.entries).filter(e => e.key.startsWith('shared-')).length, 381);
    for (const expected of receipt.after) await readBound(expected.path, expected);
    const generated = await buildRegistrySources(); for (const [key, bytes] of Object.entries(outputs)) assert.equal(bytes.toString(), generated[key]);
    await verify(); return {checked: true, registered: 381, publicFilesWritten: 0};
  }
  assert.equal(current.binding.sha256, PRIOR_SHA, 'exact predecessor registry required');
  assert.equal(registry.calibrations.flatMap(c => c.entries).filter(e => e.key.startsWith('shared-')).length, 380);
  assert.deepEqual(outputs, expectedScopedRegistryOutputs(registry, outputs));
  const nextRegistry = upsertPrivateCurrentJsCalibration(registry, fragment.calibration);
  assert.deepEqual(nextRegistry.calibrations.filter(c => c.calibrationId !== CALIBRATION), registry.calibrations, 'all existing calibrations preserved');
  const nextOutputs = expectedScopedRegistryOutputs(nextRegistry, outputs);
  const after = new Map([[REGISTRY, Buffer.from(encode(nextRegistry))], ...Object.entries(GENERATED_OUTPUTS).map(([key, file]) => [file, nextOutputs[key]])]);
  const summary = {beforeRegistry: current.binding, after: [...after].map(([file, bytes]) => pin(file, bytes)),
    addedIds: [ID], preservedG678Placements: 380, changedExistingPlacements: 0, publicFilesWritten: 0};
  if (planOnly) return {...summary, planOnly: true, writes: 0};
  const postflight = async () => {
    const generated = await buildRegistrySources(); for (const [key, bytes] of Object.entries(nextOutputs)) assert.equal(bytes.toString(), generated[key]);
  };
  const transaction = await guardedReplacement({root: ROOT, before, after, targets: TARGETS, recovery: RECOVERY, verify, postflight});
  await writeFile(path.join(ROOT, RECEIPT), encode({schemaVersion: 1, createdAt: new Date().toISOString(),
    status: 'local-registered-single-page-product-qa-pending', ...summary, transaction,
    freeze: freezeFile.binding, fragment: fragmentFile.binding, productCalibrationPassed: false, scaleOutAuthorized: false,
    acceptanceEffects: freeze.acceptanceEffects}), {flag: 'wx'});
  return {registered: 381, addedIds: [ID], publicFilesWritten: 0, receipt: RECEIPT};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert(process.argv.length === 3 && ['--plan', '--write', '--check'].includes(process.argv[2]));
  console.log(encode(await activate({check: process.argv[2] === '--check', planOnly: process.argv[2] === '--plan'})));
}
