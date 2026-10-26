#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';
import {guardedReplacement} from './activate-g678-frozen16-glossary-registration.mjs';
import {GENERATED_OUTPUTS, expectedScopedRegistryOutputs, readBoundActivationFile} from
  './activate-g678-alg-l11-feedback-host-score-registration.mjs';
import {buildRegistrySources} from '../packages/demos/scripts/generate-registry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const id = 'shared-geo001-l07-p001';
const calibrationId = 'g678-geo-l07-p001-native-current-js-v1';
const freezePath = `catalog/product-bridge-calibrations/${calibrationId}.json`;
const registryPath = 'packages/demos/private-current-js-registry.json';
const receiptPath = `catalog/product-bridge-calibrations/${calibrationId}.activation.json`;
const recovery = `work/g678-shared-page-factory/${calibrationId}-activation-20260925`;
const targets = [registryPath, GENERATED_OUTPUTS.localOnly, GENERATED_OUTPUTS.localOnlyMetadata];
const encode = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const pin = (relative, bytes) => ({path: relative, bytes: bytes.length,
  sha256: createHash('sha256').update(bytes).digest('hex')});

function g678Count(registry) {
  return registry.calibrations.flatMap(calibration => calibration.entries)
    .filter(entry => /^shared-(nms002|geo001|alg001|dat001)-l\d{2}-p\d{3}$/.test(entry.key)).length;
}

async function activate(mode) {
  assert(['--plan', '--write', '--check'].includes(mode), 'use --plan, --write, or --check');
  const verifyFreeze = () => execFileSync('node',
    ['scripts/freeze-g678-geo-l07-p001-native-current-js-v1.mjs', '--check'],
    {cwd: root, stdio: 'pipe'});
  verifyFreeze();
  const frozen = await readBoundActivationFile(root, freezePath);
  const packet = JSON.parse(frozen.buffer);
  assert.equal(packet.calibrationId, calibrationId);
  assert.equal(packet.entry.key, id);
  assert.deepEqual(packet.entry.artifacts, packet.selectedPages[0].runtime.rendererBinding);
  assert.deepEqual(Object.values(packet.acceptanceEffects), Array(8).fill(false));
  const calibration = {calibrationId, deploymentScope: 'local-only',
    freezeManifest: freezePath, freezeManifestBytes: frozen.bytes,
    freezeManifestSha256: frozen.sha256,
    entries: [{key: id, module: './modules/g678-geo-l07-native-introduction-p001',
      maturity: 'private-current-js', complexityLane: 'behavior-heavy',
      artifacts: packet.entry.artifacts}]};
  const current = await readBoundActivationFile(root, registryPath);
  const registry = JSON.parse(current.buffer);
  const outputFiles = Object.entries(GENERATED_OUTPUTS);
  const outputs = Object.fromEntries(await Promise.all(outputFiles.map(async ([key, relative]) =>
    [key, (await readBoundActivationFile(root, relative)).buffer])));
  assert.deepEqual(outputs, expectedScopedRegistryOutputs(registry, outputs),
    'live generated registries must match the live predecessor');
  if (mode === '--check') {
    assert.deepEqual(registry.calibrations.find(item => item.calibrationId === calibrationId),
      calibration, 'exact private registration');
    assert.equal(g678Count(registry), 474);
    const generated = await buildRegistrySources();
    for (const [key, bytes] of Object.entries(outputs)) assert.equal(bytes.toString(), generated[key]);
    const receipt = JSON.parse(await readFile(path.join(root, receiptPath)));
    assert.deepEqual(receipt.addedIds, [id]);
    verifyFreeze();
    return {checked: true, registered: 474, receipt: receiptPath};
  }
  assert.equal(g678Count(registry), 473, 'exact live predecessor count');
  assert(!registry.calibrations.some(item => item.entries.some(entry => entry.key === id)),
    'first page must be absent from current registry');
  const next = upsertPrivateCurrentJsCalibration(registry, calibration);
  const existing = next.calibrations.filter(item => item.calibrationId !== calibrationId);
  assert.equal(existing.length, registry.calibrations.length, 'existing calibration count');
  for (const item of registry.calibrations) {
    assert.deepEqual(existing.find(candidate => candidate.calibrationId === item.calibrationId),
      item, `preserved ${item.calibrationId}`);
  }
  assert.equal(g678Count(next), 474);
  const proposed = expectedScopedRegistryOutputs(next, outputs);
  for (const key of ['bundled', 'metadata']) assert(outputs[key].equals(proposed[key]),
    'public generated code unchanged');
  const before = new Map([[registryPath, current.buffer],
    ...outputFiles.map(([key, relative]) => [relative, outputs[key]])]);
  const after = new Map([[registryPath, encode(next)],
    ...outputFiles.map(([key, relative]) => [relative, proposed[key]])]);
  const summary = {before: [...before].map(([relative, bytes]) => pin(relative, bytes)),
    after: [...after].map(([relative, bytes]) => pin(relative, bytes)),
    addedIds: [id], preservedG678Placements: 473, changedExistingPlacements: 0,
    publicFilesWritten: 0, freeze: pin(freezePath, frozen.buffer),
    acceptanceEffects: packet.acceptanceEffects};
  if (mode === '--plan') return {planOnly: true, ...summary};
  const verify = async () => {
    await readBoundActivationFile(root, freezePath, pin(freezePath, frozen.buffer));
    verifyFreeze();
  };
  const postflight = async () => {
    const generated = await buildRegistrySources();
    for (const [key, bytes] of Object.entries(proposed)) {
      assert.equal(bytes.toString(), generated[key], `generated ${key}`);
    }
  };
  const transaction = await guardedReplacement({root, before, after, targets,
    recovery, verify, postflight});
  const receipt = {schemaVersion: 1, createdAt: new Date().toISOString(),
    status: 'local-private-registration-host-review-pending', ...summary, transaction};
  await writeFile(path.join(root, receiptPath), encode(receipt), {flag: 'wx'});
  return {registered: 474, addedIds: [id], publicFilesWritten: 0, receipt: receiptPath};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  activate(process.argv[2]).then(result => console.log(JSON.stringify(result)))
    .catch(error => {console.error(error); process.exitCode = 1;});
}
