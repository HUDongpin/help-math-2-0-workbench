#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT, ID, CALIBRATION, FRAGMENT, FREEZE, RUN, build, encode, pin, readBound} from './build-g678-nms-l03-p002-v2.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';
import {guardedReplacement} from './activate-g678-frozen16-glossary-registration.mjs';
import {GENERATED_OUTPUTS, expectedScopedRegistryOutputs} from './activate-g678-alg-l11-feedback-host-score-registration.mjs';
import {buildRegistrySources} from '../packages/demos/scripts/generate-registry.mjs';

export const RECEIPT = `${FREEZE.slice(0, -5)}.activation.json`;
const REGISTRY = 'packages/demos/private-current-js-registry.json';
const PRIOR_SHA = 'd113bd5eb5ec6d26cc5cbbb0c11a29994288ed78ff057720919c3d3d47be712b';
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
    assert.equal(receipt.beforeRegistry.sha256, PRIOR_SHA); assert.deepEqual(receipt.updatedIds, [ID]); assert.deepEqual(receipt.addedIds, []);
    assert.deepEqual(registry.calibrations.find(c => c.calibrationId === CALIBRATION), fragment.calibration);
    assert.equal(registry.calibrations.flatMap(c => c.entries).filter(e => e.key.startsWith('shared-')).length, 381);
    for (const expected of receipt.after) await readBound(expected.path, expected);
    const generated = await buildRegistrySources(); for (const [key, bytes] of Object.entries(outputs)) assert.equal(bytes.toString(), generated[key]);
    await verify(); return {checked: true, registered: 381, publicFilesWritten: 0};
  }
  assert.equal(current.binding.sha256, PRIOR_SHA, 'exact predecessor registry required');
  assert.equal(registry.calibrations.flatMap(c => c.entries).filter(e => e.key.startsWith('shared-')).length, 381);
  assert.deepEqual(outputs, expectedScopedRegistryOutputs(registry, outputs));
  const predecessorId = 'g678-nms-l03-p002-current-js-v1';
  const predecessor = registry.calibrations.find(c => c.calibrationId === predecessorId);
  assert.equal(predecessor?.freezeManifestSha256, '6ced5827f727cb3d27dee93bf1963c8179b294abbd4c1731063a7a8504aa18e3');
  assert.deepEqual(predecessor.entries.map(e => e.key), [ID]);
  const preserved = registry.calibrations.filter(c => c.calibrationId !== predecessorId);
  const nextRegistry = upsertPrivateCurrentJsCalibration({...registry, calibrations: preserved}, fragment.calibration);
  assert.deepEqual(nextRegistry.calibrations.filter(c => c.calibrationId !== CALIBRATION), preserved, 'all unrelated calibrations preserved');
  const nextOutputs = expectedScopedRegistryOutputs(nextRegistry, outputs);
  const after = new Map([[REGISTRY, Buffer.from(encode(nextRegistry))], ...Object.entries(GENERATED_OUTPUTS).map(([key, file]) => [file, nextOutputs[key]])]);
  const summary = {beforeRegistry: current.binding, after: [...after].map(([file, bytes]) => pin(file, bytes)),
    addedIds: [], updatedIds: [ID], supersededCalibration: predecessorId, preservedG678Placements: 380, changedExistingPlacements: 1, publicFilesWritten: 0};
  if (planOnly) return {...summary, planOnly: true, writes: 0};
  const postflight = async () => {
    const generated = await buildRegistrySources(); for (const [key, bytes] of Object.entries(nextOutputs)) assert.equal(bytes.toString(), generated[key]);
  };
  const transaction = await guardedReplacement({root: ROOT, before, after, targets: TARGETS, recovery: RECOVERY, verify, postflight});
  await writeFile(path.join(ROOT, RECEIPT), encode({schemaVersion: 1, createdAt: new Date().toISOString(),
    status: 'local-registered-single-page-product-qa-pending', ...summary, transaction,
    freeze: freezeFile.binding, fragment: fragmentFile.binding, productCalibrationPassed: false, scaleOutAuthorized: false,
    acceptanceEffects: freeze.acceptanceEffects}), {flag: 'wx'});
  return {registered: 381, updatedIds: [ID], publicFilesWritten: 0, receipt: RECEIPT};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert(process.argv.length === 3 && ['--plan', '--write', '--check'].includes(process.argv[2]));
  console.log(encode(await activate({check: process.argv[2] === '--check', planOnly: process.argv[2] === '--plan'})));
}
