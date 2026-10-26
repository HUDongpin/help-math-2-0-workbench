#!/usr/bin/env node
// Explicit, local-only activation of the prepared 2-module replacement.
// Preparation and --check are read-only. --write is the separate mutation gate.
import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
import {execFile} from 'node:child_process';
import {lstat, mkdir, mkdtemp, open, readFile, realpath, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {
  prepareFeedbackHostScoreRegistration, composeFeedbackHostScoreRegistration,
  OUTPUT_FREEZE, OUTPUT_FRAGMENT, PREDECESSOR_REGISTRY_WITNESS, CHANGED_IDS as SUCCESSOR_IDS,
  PREDECESSOR_REGISTRY, PREDECESSOR_FRAGMENT, COMPOSITE,
} from './prepare-g678-alg-l11-feedback-host-score-registration.mjs';
import {upsertPrivateCurrentJsCalibration, privateCurrentJsCalibrationDeploymentScope}
  from './private-current-js-registry.mjs';
import {buildRegistrySources, renderLocalOnlyRegistrySource, renderLocalOnlyRegistryMetadataSource}
  from '../packages/demos/scripts/generate-registry.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REGISTRY = 'packages/demos/private-current-js-registry.json';
export const ACTIVATION_RECEIPT = 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v3.activation.json';
export const RECOVERY_ROOT = 'work/g678-shared-page-factory/g678-alg-l11-feedback-host-score-registration-v3-activation';
export const GENERATED_OUTPUTS = Object.freeze({
  bundled: 'packages/demos/src/registry.generated.ts',
  metadata: 'packages/demos/src/registry.metadata.generated.ts',
  localOnly: 'packages/demos/src/registry.local-only.generated.ts',
  localOnlyMetadata: 'packages/demos/src/registry.local-only.metadata.generated.ts',
});
const OLD_FREEZE = 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v2.json';
const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
const PREDECESSOR_SHA = 'cd2f223ba4b8c34f19f4b7054bacc687b7e36616b9bab760132d6944b5e7bf42';
const GENERATOR = 'packages/demos/scripts/generate-registry.mjs';
const INPUT_PATHS = [PREDECESSOR_REGISTRY_WITNESS, OLD_FREEZE, PREDECESSOR_FRAGMENT.path, COMPOSITE.path, OUTPUT_FREEZE, OUTPUT_FRAGMENT,
  'scripts/activate-g678-alg-l11-instructional-successor-registration.mjs',
  'scripts/activate-g678-alg-l11-feedback-host-score-registration.mjs',
  'scripts/prepare-g678-alg-l11-feedback-host-score-registration.mjs',
  'scripts/private-current-js-registry.mjs', GENERATOR,
  'packages/demos/prototype-registry.json', 'catalog/completion-ledger.json'];
const EFFECTS = Object.freeze({productCalibrationPassed: false, browserProductCalibrationPassed: false,
  originalRuntimeAccepted: false, visualFidelityAccepted: false, audioAccepted: false,
  humanVisualAccepted: false, ownerAccepted: false, strictCompletionPassed: false,
  acceptancePassed: false, releaseAuthorized: false, published: false});
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const encode = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const parse = bytes => JSON.parse(bytes.toString('utf8'));
const binding = (file, bytes) => ({path: file, bytes: bytes.length, sha256: sha(bytes)});
const execFileAsync = promisify(execFile);
const equalBytes = (actual, expected, message) => assert.ok(actual.equals(expected), message);

function exactPath(root, file) {
  assert.ok(typeof file === 'string' && !path.isAbsolute(file) && file.split('/').every(s => s && s !== '.' && s !== '..'),
    `Non-canonical relative path: ${file}`);
  const target = path.resolve(root, file);
  assert.ok(target.startsWith(root + path.sep), `Path escapes workspace: ${file}`);
  return target;
}

export async function readBoundActivationFile(root, file, expected) {
  const target = exactPath(root, file);
  const [canonical, before] = await Promise.all([realpath(target), lstat(target, {bigint: true})]);
  assert.ok(canonical === target && before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `Activation input must be canonical and single-link: ${file}`);
  const buffer = await readFile(target), after = await lstat(target, {bigint: true});
  for (const key of ['ino', 'dev', 'size', 'mtimeNs', 'mode', 'nlink'])
    assert.equal(before[key], after[key], `Activation read drift: ${file}`);
  const observed = binding(file, buffer);
  if (expected) assert.deepEqual(observed, expected, `Activation binding drift: ${file}`);
  return {...observed, buffer, mode: Number(before.mode & 0o777n)};
}

const descriptor = ({path, bytes, sha256}) => ({path, bytes, sha256});

// Pure scope proof, separately tested with corrupted proposals. The preparer
// additionally checks the complete source/config/runtime/generated closure.
export function planFeedbackHostScoreActivation({witnessBytes, freezeBytes, fragmentBytes, priorFreezeBytes, priorFragmentBytes, compositeBytes}) {
  const witness = parse(witnessBytes), freeze = parse(freezeBytes), fragment = parse(fragmentBytes);
  assert.deepEqual(binding(PREDECESSOR_REGISTRY_WITNESS, witnessBytes), PREDECESSOR_REGISTRY);
  assert.equal(fragment.schemaVersion, 1);
  assert.equal(fragment.artifactType, 'private-current-js-calibration-fragment-v1');
  assert.equal(fragment.registryActivationRequired, true);
  assert.equal(fragment.productCalibrationPassed, false);
  assert.equal(fragment.changedModuleCount, 2); assert.equal(fragment.preservedPageCount, 375);
  assert.deepEqual(fragment.freeze, binding(OUTPUT_FREEZE, freezeBytes));
  assert.deepEqual(fragment.predecessorRegistry, PREDECESSOR_REGISTRY);
  assert.deepEqual(fragment.sourceSuccessorFragment, COMPOSITE);
  const result = composeFeedbackHostScoreRegistration({priorFreeze: parse(priorFreezeBytes),
    priorFragment: parse(priorFragmentBytes), priorRegistry: witness, composite: parse(compositeBytes),
    preparerBinding: freeze.inputs.feedbackHostScorePreparer});
  equalBytes(result.freezeBytes, freezeBytes, 'Prepared v3 freeze differs from exact2/375 composition');
  equalBytes(result.fragmentBytes, fragmentBytes, 'Prepared v3 fragment differs from exact2/375 composition');
  const nextRegistry = upsertPrivateCurrentJsCalibration(witness, fragment.calibration);
  assert.deepEqual(nextRegistry, result.nextRegistry);
  const current = witness.calibrations.find(c => c.calibrationId === CALIBRATION_ID);
  const successor = nextRegistry.calibrations.find(c => c.calibrationId === CALIBRATION_ID);
  const changedIds = successor.entries.filter((entry, index) => entry.module !== current.entries[index].module).map(entry => entry.key);
  assert.deepEqual(changedIds, SUCCESSOR_IDS);
  const preservedIds = successor.entries.filter(entry => !SUCCESSOR_IDS.includes(entry.key)).map(entry => entry.key);
  assert.equal(preservedIds.length, 375);
  assert.deepEqual(successor.entries.filter(entry => !SUCCESSOR_IDS.includes(entry.key)),
    current.entries.filter(entry => !SUCCESSOR_IDS.includes(entry.key)));
  assert.deepEqual(nextRegistry.calibrations.filter(c => c.calibrationId !== CALIBRATION_ID),
    witness.calibrations.filter(c => c.calibrationId !== CALIBRATION_ID));
  return {witnessBytes, nextRegistry, nextRegistryBytes: encode(nextRegistry), changedIds, preservedIds,
    preparedBindings: [binding(PREDECESSOR_REGISTRY_WITNESS, witnessBytes), binding(OLD_FREEZE, priorFreezeBytes),
      binding(PREDECESSOR_FRAGMENT.path, priorFragmentBytes), binding(COMPOSITE.path, compositeBytes),
      binding(OUTPUT_FREEZE, freezeBytes), binding(OUTPUT_FRAGMENT, fragmentBytes)]};
}

// Use the maintained generator's renderers, not handwritten generated text.
export function expectedScopedRegistryOutputs(registry, publicOutputs) {
  const entries = registry.calibrations.flatMap(calibration => {
    if (privateCurrentJsCalibrationDeploymentScope(calibration) !== 'local-only') return [];
    return calibration.entries.map(entry => ({...entry, scope: 'private-engineering',
      calibrationId: calibration.calibrationId, deploymentScope: 'local-only',
      freezeManifestSha256: calibration.freezeManifestSha256,
      moduleSha256: entry.artifacts.module.sha256, timelineSha256: entry.artifacts.timeline.sha256,
      ...(entry.artifacts.kind === 'maintained-dom-module-v1'
        ? {rendererBindingKind: 'maintained-dom-module-v1', memberManifestSha256: entry.artifacts.memberManifest.sha256,
            sourceRunSha256: entry.artifacts.sourceRun.sha256}
        : {runtimeSha256: entry.artifacts.runtime.sha256})}));
  }).sort((a, b) => String(a.key).localeCompare(String(b.key)));
  return {bundled: Buffer.from(publicOutputs.bundled), metadata: Buffer.from(publicOutputs.metadata),
    localOnly: Buffer.from(renderLocalOnlyRegistrySource(entries)),
    localOnlyMetadata: Buffer.from(renderLocalOnlyRegistryMetadataSource(entries))};
}

async function assertOutputs(root, outputs) {
  for (const [key, file] of Object.entries(GENERATED_OUTPUTS)) {
    const observed = await readBoundActivationFile(root, file);
    equalBytes(observed.buffer, outputs[key], `Generated output differs: ${file}`);
  }
}
async function assertInputs(root, inputs) {
  for (const input of inputs) await readBoundActivationFile(root, input.path, input);
}
async function assertAbsent(root, file) {
  await assert.rejects(lstat(exactPath(root, file)), {code: 'ENOENT'}, `Exclusive output already exists: ${file}`);
}
async function exclusiveJson(root, file, value) {
  await writeFile(exactPath(root, file), encode(value), {flag: 'wx', mode: 0o444});
}
async function ensureCanonicalDirectory(root, relative) {
  exactPath(root, relative);
  let current = root;
  for (const segment of relative.split('/')) {
    current = path.join(current, segment);
    try { await mkdir(current); } catch (error) { if (error.code !== 'EEXIST') throw error; }
    const info = await lstat(current);
    assert.ok(info.isDirectory() && !info.isSymbolicLink() && await realpath(current) === current,
      'Recovery directory must not traverse symlinks');
  }
}

// The injectable runner is for isolated temporary-directory transaction tests.
// The public CLI below always binds the real maintained generator and preparer.
export async function executeScopedFeedbackHostScoreActivation({root, plan, beforeOutputs, inputBindings,
  runGenerator, verifyPrepared}) {
  await verifyPrepared();
  await assertInputs(root, inputBindings);
  const original = await readBoundActivationFile(root, REGISTRY);
  equalBytes(original.buffer, plan.witnessBytes, 'Live registry is not the exact v2 377 witness; use --check after activation');
  assert.deepEqual(beforeOutputs, expectedScopedRegistryOutputs(parse(plan.witnessBytes), beforeOutputs),
    'Before outputs must be generated from the exact predecessor registry');
  await assertOutputs(root, beforeOutputs);
  await assertAbsent(root, ACTIVATION_RECEIPT);
  const afterOutputs = expectedScopedRegistryOutputs(plan.nextRegistry, beforeOutputs);
  for (const key of ['localOnly', 'localOnlyMetadata'])
    assert.ok(!afterOutputs[key].equals(beforeOutputs[key]), `Expected private output change missing: ${key}`);
  const recoveryParent = exactPath(root, RECOVERY_ROOT);
  await ensureCanonicalDirectory(root, RECOVERY_ROOT);
  const recovery = path.relative(root, await mkdtemp(path.join(recoveryParent, 'activation-')));
  const beforeFiles = [{path: REGISTRY, buffer: original.buffer},
    ...Object.entries(GENERATED_OUTPUTS).map(([key, file]) => ({path: file, buffer: beforeOutputs[key]}))];
  const backups = [];
  let phase = 'backing-up', registryReplaced = false, temporaryRegistry = null;
  try {
    for (const file of beforeFiles) {
      const backup = `${recovery}/before-${path.basename(file.path)}`;
      await writeFile(exactPath(root, backup), file.buffer, {flag: 'wx', mode: 0o444});
      const observed = await readBoundActivationFile(root, backup);
      equalBytes(observed.buffer, file.buffer, 'Recovery copy differs');
      backups.push({original: binding(file.path, file.buffer), backup: descriptor(observed)});
    }
    const proposed = {registry: binding(REGISTRY, plan.nextRegistryBytes),
      generated: Object.entries(GENERATED_OUTPUTS).map(([key, file]) => binding(file, afterOutputs[key]))};
    await exclusiveJson(root, `${recovery}/transaction-plan.json`, {schemaVersion: 1,
      artifactType: 'g678-feedback-host-score-local-activation-plan-v1', deploymentScope: 'local-only',
      inputBindings, backups, proposed, changedModuleIds: plan.changedIds, preservedPageCount: 375,
      registrationCount: 377, acceptanceEffects: EFFECTS});
    phase = 'staging-registry';
    temporaryRegistry = `${path.dirname(REGISTRY)}/.feedback-host-score-registry-${randomUUID()}.tmp`;
    const handle = await open(exactPath(root, temporaryRegistry), 'wx', original.mode);
    try { await handle.writeFile(plan.nextRegistryBytes); await handle.sync(); } finally { await handle.close(); }
    await assertInputs(root, inputBindings);
    await assertOutputs(root, beforeOutputs);
    equalBytes((await readBoundActivationFile(root, temporaryRegistry)).buffer, plan.nextRegistryBytes,
      'Staged registry bytes differ before replacement');
    const immediatelyBefore = await readBoundActivationFile(root, REGISTRY);
    equalBytes(immediatelyBefore.buffer, plan.witnessBytes, 'Live registry changed before atomic replacement');
    phase = 'atomic-registry-replacement';
    await rename(exactPath(root, temporaryRegistry), exactPath(root, REGISTRY));
    registryReplaced = true;
    temporaryRegistry = null;
    phase = 'maintained-generator';
    const generatorResult = await runGenerator({check: false});
    await exclusiveJson(root, `${recovery}/generator-result.json`, generatorResult);
    phase = 'postflight';
    equalBytes((await readBoundActivationFile(root, REGISTRY)).buffer, plan.nextRegistryBytes, 'Postflight registry differs');
    await assertOutputs(root, afterOutputs);
    await verifyPrepared();
    await assertInputs(root, inputBindings);
    const generatorCheck = await runGenerator({check: true});
    await assertOutputs(root, afterOutputs);
    equalBytes((await readBoundActivationFile(root, REGISTRY)).buffer, plan.nextRegistryBytes, 'Postflight registry differs');
    await assertInputs(root, inputBindings);
    const receipt = {schemaVersion: 1, artifactType: 'g678-feedback-host-score-local-registration-activation-v1',
      status: 'local-feedback-host-score-registration-activated-product-calibration-pending', deploymentScope: 'local-only',
      createdAt: new Date().toISOString(), registryChanged: true, registrationCount: 377,
      changedModuleCount: 2, changedModuleIds: plan.changedIds, preservedPageCount: 375,
      otherCalibrationsUnchanged: true, publicOutputBytesUnchanged: true, privateOutputChangedCount: 2,
      inputBindings, recovery, backups, proposed, generatorCheck, acceptanceEffects: EFFECTS,
      limitations: ['Local registry activation is not My Lesson product calibration or 44-lesson engineering preview.',
        'Original runtime, audio, visual fidelity, human/Owner acceptance, strict completion, release and publication remain unaccepted.',
        'The maintained generator writes four files non-atomically after the atomic registry replacement; recoverable before copies are retained.']};
    await exclusiveJson(root, ACTIVATION_RECEIPT, receipt);
    return {activated: true, check: false, receipt: binding(ACTIVATION_RECEIPT, encode(receipt)),
      recovery, changedModuleCount: 2, preservedPageCount: 375, registrationCount: 377,
      publicOutputBytesUnchanged: true, privateOutputChangedCount: 2, acceptanceEffects: EFFECTS};
  } catch (error) {
    // Never roll back over possibly concurrent user edits. Retain all originals,
    // partial generated outputs and staging bytes for exact, reviewed recovery.
    const observed = [];
    for (const file of [REGISTRY, ...Object.values(GENERATED_OUTPUTS)]) {
      try { observed.push(descriptor(await readBoundActivationFile(root, file))); }
      catch (readError) { observed.push({path: file, observationError: String(readError.message)}); }
    }
    const failure = {schemaVersion: 1, artifactType: 'g678-feedback-host-score-local-activation-failure-v1',
      phase, registryReplaced, temporaryRegistry, recovery, backups, observed,
      message: String(error.message), rollbackAttempted: false, acceptanceEffects: EFFECTS};
    try { await exclusiveJson(root, `${recovery}/failure.json`, failure); }
    catch (failureError) { error.failureEvidenceError = String(failureError.message); }
    error.message += `; recovery retained at ${recovery}; registryReplaced=${registryReplaced}; no automatic rollback`;
    throw error;
  }
}

export async function checkScopedFeedbackHostScoreActivation({root, plan, inputBindings, runGenerator, verifyPrepared}) {
  await verifyPrepared();
  const receiptBinding = await readBoundActivationFile(root, ACTIVATION_RECEIPT);
  const receipt = parse(receiptBinding.buffer);
  assert.equal(receipt.schemaVersion, 1);
  assert.equal(receipt.artifactType, 'g678-feedback-host-score-local-registration-activation-v1');
  assert.equal(receipt.status, 'local-feedback-host-score-registration-activated-product-calibration-pending');
  assert.equal(receipt.deploymentScope, 'local-only');
  for (const [field, expected] of Object.entries({registryChanged: true, registrationCount: 377, changedModuleCount: 2,
    preservedPageCount: 375, otherCalibrationsUnchanged: true, publicOutputBytesUnchanged: true, privateOutputChangedCount: 2}))
    assert.equal(receipt[field], expected);
  assert.deepEqual(receipt.changedModuleIds, plan.changedIds);
  assert.deepEqual(receipt.acceptanceEffects, EFFECTS);
  assert.deepEqual(receipt.inputBindings, inputBindings);
  await assertInputs(root, inputBindings);
  equalBytes((await readBoundActivationFile(root, REGISTRY)).buffer, plan.nextRegistryBytes, 'Activated registry drift');
  assert.equal(receipt.backups.length, 5);
  assert.ok(receipt.recovery.startsWith(RECOVERY_ROOT + '/activation-'));
  const backups = new Map();
  for (const item of receipt.backups) {
    assert.ok(item.backup.path.startsWith(receipt.recovery + '/before-'));
    assert.ok(!backups.has(item.original.path), 'Duplicate recovery original');
    const backup = await readBoundActivationFile(root, item.backup.path, item.backup);
    assert.deepEqual(binding(item.original.path, backup.buffer), item.original);
    backups.set(item.original.path, backup.buffer);
  }
  assert.deepEqual([...backups.keys()], [REGISTRY, ...Object.values(GENERATED_OUTPUTS)]);
  equalBytes(backups.get(REGISTRY), plan.witnessBytes, 'Recovery registry is not predecessor witness');
  const beforeOutputs = Object.fromEntries(Object.entries(GENERATED_OUTPUTS).map(([key, file]) => [key, backups.get(file)]));
  const oldExpected = expectedScopedRegistryOutputs(parse(plan.witnessBytes), beforeOutputs);
  assert.deepEqual(beforeOutputs, oldExpected, 'Backups must bind exact predecessor local registry generation');
  const afterOutputs = expectedScopedRegistryOutputs(plan.nextRegistry, beforeOutputs);
  for (const key of ['localOnly', 'localOnlyMetadata']) assert.ok(!beforeOutputs[key].equals(afterOutputs[key]));
  assert.deepEqual(receipt.proposed, {registry: binding(REGISTRY, plan.nextRegistryBytes),
    generated: Object.entries(GENERATED_OUTPUTS).map(([key, file]) => binding(file, afterOutputs[key]))});
  await assertOutputs(root, afterOutputs);
  await runGenerator({check: true});
  await assertOutputs(root, afterOutputs);
  equalBytes((await readBoundActivationFile(root, REGISTRY)).buffer, plan.nextRegistryBytes, 'Activated registry drift');
  await assertInputs(root, inputBindings);
  return {activated: true, check: true, writes: 0, receipt: descriptor(receiptBinding),
    registrationCount: 377, changedModuleCount: 2, preservedPageCount: 375,
    publicOutputBytesUnchanged: true, privateOutputChangedCount: 2, acceptanceEffects: EFFECTS};
}

export async function activateFeedbackHostScoreRegistration({write = false, check = false} = {}) {
  assert.ok(typeof write === 'boolean' && typeof check === 'boolean' && !(write && check));
  if (!write && !check) {
    const prepared = await prepareFeedbackHostScoreRegistration();
    return {...prepared, mode: 'plan', activationExecuted: false, writes: 0};
  }
  await prepareFeedbackHostScoreRegistration({check: true});
  const inputs = await Promise.all(INPUT_PATHS.map(file => readBoundActivationFile(ROOT, file)));
  const byPath = new Map(inputs.map(item => [item.path, item]));
  assert.equal(byPath.get(PREDECESSOR_REGISTRY_WITNESS).sha256, PREDECESSOR_SHA, 'V2 377 witness identity changed');
  const plan = planFeedbackHostScoreActivation({witnessBytes: byPath.get(PREDECESSOR_REGISTRY_WITNESS).buffer,
    freezeBytes: byPath.get(OUTPUT_FREEZE).buffer, fragmentBytes: byPath.get(OUTPUT_FRAGMENT).buffer,
    priorFreezeBytes: byPath.get(OLD_FREEZE).buffer, priorFragmentBytes: byPath.get(PREDECESSOR_FRAGMENT.path).buffer,
    compositeBytes: byPath.get(COMPOSITE.path).buffer});
  const inputBindings = inputs.map(descriptor);
  for (const expected of plan.preparedBindings)
    assert.deepEqual(descriptor(byPath.get(expected.path)), expected);
  const runGenerator = async ({check: shouldCheck}) => {
    const args = [GENERATOR, ...(shouldCheck ? ['--check'] : [])];
    const {stdout, stderr} = await execFileAsync(process.execPath, args,
      {cwd: ROOT, timeout: 60_000, maxBuffer: 4 * 1024 * 1024});
    return {command: 'node', args, exitCode: 0, stdout, stderr};
  };
  const verifyPrepared = () => prepareFeedbackHostScoreRegistration({check: true});
  if (check) return checkScopedFeedbackHostScoreActivation({root: ROOT, plan, inputBindings, runGenerator, verifyPrepared});
  const sources = await buildRegistrySources();
  const beforeOutputs = Object.fromEntries(Object.entries(sources).map(([key, value]) => [key, Buffer.from(value)]));
  assert.deepEqual(beforeOutputs, expectedScopedRegistryOutputs(parse(plan.witnessBytes), beforeOutputs));
  return executeScopedFeedbackHostScoreActivation({root: ROOT, plan, beforeOutputs, inputBindings, runGenerator, verifyPrepared});
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length > 1 || args.length && !['--plan', '--write', '--check'].includes(args[0])) {
    console.error('Usage: node scripts/activate-g678-alg-l11-feedback-host-score-registration.mjs [--plan | --write | --check]');
    process.exitCode = 1;
  } else activateFeedbackHostScoreRegistration({write: args[0] === '--write', check: args[0] === '--check'})
    .then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(error => { console.error(error); process.exitCode = 1; });
}
