#!/usr/bin/env node
// Exact local 378 activation. Only --write mutates; recovery never rolls back over edits.
import assert from 'node:assert/strict';
import {lstat, mkdir, mkdtemp, readFile, realpath, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT, REGISTRY, PRIOR, SOURCE_AUTHORITY, LIVE_PREDECESSOR_REGISTRY, PROPOSED_FREEZE, PROPOSED_FRAGMENT,
  PLANNER, CHANGED_IDS, encode, binding, descriptor, prepareP042ReadableRegistration}
  from './prepare-g678-nms-l01-p042-readable-registration.mjs';
import {CATALOG, SOURCE_RUN, composeP042ReadableRegistration} from './plan-g678-nms-l01-p042-readable-registration.mjs';
import {readBoundActivationFile, GENERATED_OUTPUTS, expectedScopedRegistryOutputs}
  from './activate-g678-alg-l11-feedback-host-score-registration.mjs';
import {buildRegistrySources} from '../packages/demos/scripts/generate-registry.mjs';
export {REGISTRY, GENERATED_OUTPUTS, expectedScopedRegistryOutputs};
export const ACTIVATION_RECEIPT = 'catalog/product-bridge-calibrations/g678-current-js-378-page-registration-v1.activation.json';
export const RECOVERY_ROOT = 'work/g678-shared-page-factory/g678-nms-l01-p042-readable-registration-378-v1-activation';
export const ACTIVATION_LOCK = `${RECOVERY_ROOT}/activation-lock.json`;
const PREPARER = 'scripts/prepare-g678-nms-l01-p042-readable-registration.mjs';
const ACTIVATOR = 'scripts/activate-g678-nms-l01-p042-readable-registration.mjs';
const GENERATOR = 'packages/demos/scripts/generate-registry.mjs';
const FILES = [REGISTRY, ...Object.values(GENERATED_OUTPUTS)];
const REPLACED = [REGISTRY, GENERATED_OUTPUTS.localOnly, GENERATED_OUTPUTS.localOnlyMetadata];
export const EFFECTS = Object.freeze({productCalibrationPassed: false, browserProductCalibrationPassed: false,
  originalRuntimeAccepted: false, visualFidelityAccepted: false, audioAccepted: false,
  humanVisualAccepted: false, ownerAccepted: false, strictCompletionPassed: false,
  acceptancePassed: false, releaseAuthorized: false, published: false});
const parse = bytes => JSON.parse(bytes.toString('utf8'));
const equal = (a, b, message) => assert.ok(a.equals(b), message);

export function planP042ReadableActivation(inputs) {
  assert.deepEqual(Object.keys(inputs).sort(),['witnessBytes','priorFreezeBytes','priorFragmentBytes','sourceBytes','catalogBytes',
    'priorActivationBytes','sourceRunBytes','plannerBytes','freezeBytes','fragmentBytes'].sort(),'Exact activation input keys only');
  const {witnessBytes, priorFreezeBytes, priorFragmentBytes, sourceBytes, catalogBytes, priorActivationBytes, sourceRunBytes, plannerBytes, freezeBytes, fragmentBytes} = inputs;
  assert.deepEqual(binding(PRIOR.registry.path, witnessBytes), PRIOR.registry);
  for (const [expected, bytes] of [[PRIOR.freeze, priorFreezeBytes], [PRIOR.fragment, priorFragmentBytes], [SOURCE_AUTHORITY, sourceBytes],
    [CATALOG, catalogBytes], [PRIOR.activation, priorActivationBytes], [SOURCE_RUN, sourceRunBytes]])
    assert.deepEqual(binding(expected.path, bytes), expected, 'Raw source/predecessor bytes must match exact pin');
  const result = composeP042ReadableRegistration({priorFreeze: parse(priorFreezeBytes), priorFragment: parse(priorFragmentBytes),
    priorRegistry: parse(witnessBytes), source: parse(sourceBytes), pagesCatalog: parse(catalogBytes), plannerBinding: binding(PLANNER, plannerBytes)});
  equal(freezeBytes, result.freezeBytes, 'Prepared 378 freeze differs from exact1/377 composition');
  equal(fragmentBytes, result.fragmentBytes, 'Prepared 378 fragment differs from exact1/377 composition');
  const previous = parse(witnessBytes).calibrations.find(c => c.calibrationId === result.fragment.calibration.calibrationId);
  const changedIds = result.fragment.calibration.entries.filter(e => !previous.entries.some(old => old.key === e.key)).map(e => e.key);
  assert.deepEqual(result.fragment.calibration.entries.filter(e => e.key !== CHANGED_IDS[0]), previous.entries);
  assert.deepEqual(changedIds, CHANGED_IDS);
  const preparedBindings = [[PRIOR.registry.path, witnessBytes], [PRIOR.freeze.path, priorFreezeBytes],
    [PRIOR.fragment.path, priorFragmentBytes], [SOURCE_AUTHORITY.path, sourceBytes], [CATALOG.path, catalogBytes],
    [PRIOR.activation.path, priorActivationBytes], [SOURCE_RUN.path, sourceRunBytes], [PLANNER, plannerBytes],
    [PROPOSED_FREEZE, freezeBytes], [PROPOSED_FRAGMENT, fragmentBytes]].map(([file, bytes]) => binding(file, bytes));
  return {inputs: Object.fromEntries(Object.entries(inputs).map(([key, bytes]) => [key, Buffer.from(bytes)])),
    witnessBytes: Buffer.from(witnessBytes), nextRegistry: result.nextRegistry, nextRegistryBytes: result.nextRegistryBytes,
    changedIds, preservedPageCount: 377, preparedBindings};
}
function validatePlan(plan, inputBindings) {
  assert.deepEqual(plan, planP042ReadableActivation(plan.inputs), 'Activation plan mutated after validation');
  assert.equal(new Set(inputBindings.map(b => b.path)).size, inputBindings.length, 'Duplicate input binding');
  for (const expected of plan.preparedBindings) assert.deepEqual(inputBindings.find(b => b.path === expected.path), expected);
}
function exactPath(root, file) {
  assert.ok(typeof file === 'string' && !path.isAbsolute(file) && file.split('/').every(s => s && s !== '.' && s !== '..'));
  const target = path.resolve(root, file); assert.ok(target.startsWith(root + path.sep)); return target;
}
async function absent(root, file) {await assert.rejects(lstat(exactPath(root, file)), {code: 'ENOENT'}, `Exclusive activation output exists: ${file}`);}
async function directory(root, relative) {
  exactPath(root, relative); let current = root;
  for (const part of relative.split('/')) {
    current = path.join(current, part); try {await mkdir(current);} catch (error) {if (error.code !== 'EEXIST') throw error;}
    const stat = await lstat(current); assert.ok(stat.isDirectory() && !stat.isSymbolicLink() && await realpath(current) === current,
      'Recovery directory must not traverse symlinks');
  }
}
async function exclusive(root, file, value) {await writeFile(exactPath(root, file), encode(value), {flag: 'wx', mode: 0o444});}
async function assertInputs(root, inputs) {for (const input of inputs) await readBoundActivationFile(root, input.path, input);}
async function assertState(root, state) {
  for (const [file, bytes] of state) equal((await readBoundActivationFile(root, file)).buffer, bytes, `Concurrent/output drift: ${file}`);
}
function states(plan, beforeOutputs) {
  assert.deepEqual(beforeOutputs, expectedScopedRegistryOutputs(parse(plan.witnessBytes), beforeOutputs), 'Before outputs must match exact V4 registry');
  const afterOutputs = expectedScopedRegistryOutputs(plan.nextRegistry, beforeOutputs);
  for (const key of ['localOnly', 'localOnlyMetadata']) assert.ok(!beforeOutputs[key].equals(afterOutputs[key]));
  for (const key of ['bundled', 'metadata']) equal(beforeOutputs[key], afterOutputs[key], 'Public output must remain unchanged');
  const before = new Map([[REGISTRY, plan.witnessBytes], ...Object.entries(GENERATED_OUTPUTS).map(([key, file]) => [file, beforeOutputs[key]])]);
  const after = new Map([[REGISTRY, plan.nextRegistryBytes], ...Object.entries(GENERATED_OUTPUTS).map(([key, file]) => [file, afterOutputs[key]])]);
  return {before, after};
}

// The temporary-root test seam can inject a rename failure. The CLI does not
// accept alternate roots, targets, plans, renderers or replacement callbacks.
export async function executeP042ReadableActivation({root = ROOT, plan, beforeOutputs, inputBindings,
  verifyPrepared, checkGenerator, replaceFile = rename}) {
  validatePlan(plan, inputBindings); await verifyPrepared(); await assertInputs(root, inputBindings);
  assert.deepEqual(binding(REGISTRY, (await readBoundActivationFile(root, REGISTRY)).buffer), LIVE_PREDECESSOR_REGISTRY,
    'Live registry must be exact V4 predecessor; use --check after activation');
  const {before, after} = states(plan, beforeOutputs);
  await assertState(root, before); await absent(root, ACTIVATION_RECEIPT); await absent(root, ACTIVATION_LOCK);
  await directory(root, RECOVERY_ROOT);
  // Retained lock prevents duplicate tool writers. Failure needs reviewed
  // recovery/new authority, not an automatic overwrite or lock removal.
  await exclusive(root, ACTIVATION_LOCK, {schemaVersion: 1, artifactType: 'g678-378-p042-readable-activation-lock-v1',
    predecessor: LIVE_PREDECESSOR_REGISTRY, proposedRegistry: binding(REGISTRY, plan.nextRegistryBytes), changedIds: CHANGED_IDS});
  const lock = descriptor(await readBoundActivationFile(root, ACTIVATION_LOCK));
  const recovery = path.relative(root, await mkdtemp(path.join(exactPath(root, RECOVERY_ROOT), 'activation-')));
  const backups = [], staged = [], completedReplacements = [], current = new Map(before);
  let phase = 'backing-up';
  try {
    for (const [file, bytes] of before) {
      const observed = await readBoundActivationFile(root, file); equal(observed.buffer, bytes, `Before backup drift: ${file}`);
      const backupPath = `${recovery}/before-${path.basename(file)}`;
      await writeFile(exactPath(root, backupPath), bytes, {flag: 'wx', mode: 0o444});
      const backup = await readBoundActivationFile(root, backupPath); equal(backup.buffer, bytes, 'Recovery copy differs');
      backups.push({original: binding(file, bytes), backup: descriptor(backup), originalMode: observed.mode});
    }
    for (const file of REPLACED) {
      const stagePath = `${recovery}/staged-${path.basename(file)}`;
      await writeFile(exactPath(root, stagePath), after.get(file), {flag: 'wx', mode: backups.find(b => b.original.path === file).originalMode});
      staged.push({target: file, stage: descriptor(await readBoundActivationFile(root, stagePath))});
    }
    const proposed = {registry: binding(REGISTRY, plan.nextRegistryBytes),
      generated: Object.values(GENERATED_OUTPUTS).map(file => binding(file, after.get(file)))};
    await exclusive(root, `${recovery}/transaction-plan.json`, {schemaVersion: 1, artifactType: 'g678-378-p042-readable-transaction-plan-v1',
      inputBindings, lock, backups, staged, proposed, changedIds: CHANGED_IDS, preservedPageCount: 377, acceptanceEffects: EFFECTS});
    for (const item of staged) {
      phase = `replacing:${item.target}`;
      await verifyPrepared(); await assertInputs(root, inputBindings); await assertState(root, current);
      await readBoundActivationFile(root, item.stage.path, item.stage);
      await readBoundActivationFile(root, ACTIVATION_LOCK, lock);
      await absent(root, ACTIVATION_RECEIPT);
      await replaceFile(exactPath(root, item.stage.path), exactPath(root, item.target));
      current.set(item.target, after.get(item.target)); completedReplacements.push(item.target);
    }
    phase = 'postflight'; await assertState(root, after); await verifyPrepared(); await assertInputs(root, inputBindings);
    // Maintained generator is invoked read-only. Never rewrite either public file.
    const generatorCheck = await checkGenerator();
    await assertState(root, after); await assertInputs(root, inputBindings); await readBoundActivationFile(root, ACTIVATION_LOCK, lock);
    const receipt = {schemaVersion: 1, artifactType: 'g678-p042-readable-local-registration-activation-v1',
      status: 'local-p042-readable-registration-activated-product-calibration-pending', deploymentScope: 'local-only',
      createdAt: new Date().toISOString(), registryChanged: true, registrationCount: 378, addedModuleCount: 1,
      changedModuleIds: CHANGED_IDS, preservedPageCount: 377, otherCalibrationsUnchanged: true,
      publicOutputBytesUnchanged: true, publicOutputFilesWritten: 0, privateOutputChangedCount: 2,
      completedReplacements, inputBindings, lock, recovery, backups, proposed, generatorCheck, acceptanceEffects: EFFECTS,
      limitations: ['Three guarded file replacements are recoverable, not an atomic repository transaction or filesystem content-CAS.',
        'The retained lock coordinates this activation tool; unrelated writers still require a held coordination window.',
        'Local registration is not actual My Lesson companion QA, product calibration, audio/human/Owner acceptance, strict completion, release or publication.']};
    await exclusive(root, ACTIVATION_RECEIPT, receipt);
    return {activated: true, check: false, receipt: binding(ACTIVATION_RECEIPT, encode(receipt)), recovery,
      registrationCount: 378, addedModuleCount: 1, preservedPageCount: 377, publicOutputFilesWritten: 0, acceptanceEffects: EFFECTS};
  } catch (error) {
    const observed = [];
    for (const file of FILES) {
      try {observed.push(descriptor(await readBoundActivationFile(root, file)));}
      catch (readError) {observed.push({path: file, observationError: String(readError.message)});}
    }
    const failure = {schemaVersion: 1, artifactType: 'g678-p042-readable-local-activation-failure-v1',
      phase, recovery, lock, backups, staged, completedReplacements, observed,
      message: String(error.message), rollbackAttempted: false, lockRetained: true, acceptanceEffects: EFFECTS};
    try {await exclusive(root, `${recovery}/failure.json`, failure);} catch (failureError) {error.failureEvidenceError = String(failureError.message);}
    error.message += `; recovery retained at ${recovery}; no automatic rollback; lock retained`; throw error;
  }
}

export async function checkP042ReadableActivation({root = ROOT, plan, inputBindings, verifyPrepared, checkGenerator}) {
  validatePlan(plan, inputBindings); await verifyPrepared(); await assertInputs(root, inputBindings);
  const observed = await readBoundActivationFile(root, ACTIVATION_RECEIPT), receipt = parse(observed.buffer);
  assert.equal(receipt.artifactType, 'g678-p042-readable-local-registration-activation-v1');
  assert.equal(receipt.status, 'local-p042-readable-registration-activated-product-calibration-pending');
  assert.equal(receipt.schemaVersion, 1); assert.equal(receipt.deploymentScope, 'local-only');
  for (const [field, expected] of Object.entries({registryChanged: true, registrationCount: 378, addedModuleCount: 1,
    preservedPageCount: 377, otherCalibrationsUnchanged: true, publicOutputBytesUnchanged: true, publicOutputFilesWritten: 0, privateOutputChangedCount: 2}))
    assert.equal(receipt[field], expected);
  assert.deepEqual(receipt.changedModuleIds, CHANGED_IDS); assert.deepEqual(receipt.completedReplacements, REPLACED);
  assert.deepEqual(receipt.acceptanceEffects, EFFECTS); assert.deepEqual(receipt.inputBindings, inputBindings);
  assert.equal(receipt.lock.path, ACTIVATION_LOCK);
  const lock = await readBoundActivationFile(root, ACTIVATION_LOCK, receipt.lock);
  assert.equal(lock.mode & 0o222, 0);
  assert.deepEqual(parse(lock.buffer), {schemaVersion: 1, artifactType: 'g678-378-p042-readable-activation-lock-v1',
    predecessor: LIVE_PREDECESSOR_REGISTRY, proposedRegistry: binding(REGISTRY, plan.nextRegistryBytes), changedIds: CHANGED_IDS});
  assert.ok(receipt.recovery.startsWith(RECOVERY_ROOT + '/activation-')); assert.equal(receipt.backups.length, 5);
  const recovered = new Map();
  for (const backup of receipt.backups) {
    assert.ok(FILES.includes(backup.original.path)); assert.equal(backup.backup.path, `${receipt.recovery}/before-${path.basename(backup.original.path)}`);
    assert.ok(!recovered.has(backup.original.path));
    const recoveredFile = await readBoundActivationFile(root, backup.backup.path, backup.backup);
    assert.equal(recoveredFile.mode & 0o222, 0); const bytes = recoveredFile.buffer;
    assert.deepEqual(binding(backup.original.path, bytes), backup.original); recovered.set(backup.original.path, bytes);
  }
  assert.deepEqual([...recovered.keys()], FILES); equal(recovered.get(REGISTRY), plan.witnessBytes, 'Recovery witness differs');
  const beforeOutputs = Object.fromEntries(Object.entries(GENERATED_OUTPUTS).map(([key, file]) => [key, recovered.get(file)]));
  const {after} = states(plan, beforeOutputs);
  assert.deepEqual(receipt.proposed, {registry: binding(REGISTRY, plan.nextRegistryBytes),
    generated: Object.values(GENERATED_OUTPUTS).map(file => binding(file, after.get(file)))});
  await assertState(root, after); await checkGenerator(); await assertState(root, after); await assertInputs(root, inputBindings);
  await readBoundActivationFile(root, ACTIVATION_LOCK, receipt.lock);
  await readBoundActivationFile(root, ACTIVATION_RECEIPT, descriptor(observed));
  return {activated: true, check: true, writes: 0, receipt: descriptor(observed), registrationCount: 378,
    addedModuleCount: 1, preservedPageCount: 377, publicOutputFilesWritten: 0, acceptanceEffects: EFFECTS};
}

export const CLI_INPUT_PATHS = Object.freeze([PRIOR.registry.path, PRIOR.freeze.path, PRIOR.fragment.path, SOURCE_AUTHORITY.path, CATALOG.path, PRIOR.activation.path, SOURCE_RUN.path, PLANNER,
    PROPOSED_FREEZE, PROPOSED_FRAGMENT, PREPARER, ACTIVATOR,
    'scripts/plan-g678-nms-l01-p042-readable-registration.test.mjs',
    'scripts/prepare-g678-nms-l01-p042-readable-registration.test.mjs',
    'scripts/activate-g678-nms-l01-p042-readable-registration.test.mjs',
    'scripts/g678-nms-l01-p042-readable-registration-test-fixtures.mjs',
    'scripts/activate-g678-alg-l11-feedback-host-score-registration.mjs',
    'scripts/prepare-g678-alg-l11-feedback-host-score-registration.mjs',
    'scripts/build-g678-nms-l01-p042-readable-current-js.mjs', 'scripts/private-current-js-registry.mjs',
    GENERATOR, 'packages/demos/prototype-registry.json', 'catalog/completion-ledger.json']);
// The actual CLI uses this exact assembly; the root argument exists only for
// read-only seeded temporary-root tests, never as a command-line option.
export async function readP042ActivationInputs(root = ROOT) {
  const inputs = await Promise.all(CLI_INPUT_PATHS.map(file => readBoundActivationFile(root, file))), byPath = new Map(inputs.map(i => [i.path, i]));
  const plan = planP042ReadableActivation({witnessBytes: byPath.get(PRIOR.registry.path).buffer, priorFreezeBytes: byPath.get(PRIOR.freeze.path).buffer,
    priorFragmentBytes: byPath.get(PRIOR.fragment.path).buffer, sourceBytes: byPath.get(SOURCE_AUTHORITY.path).buffer,
    catalogBytes: byPath.get(CATALOG.path).buffer, priorActivationBytes: byPath.get(PRIOR.activation.path).buffer,
    sourceRunBytes: byPath.get(SOURCE_RUN.path).buffer,
    plannerBytes: byPath.get(PLANNER).buffer, freezeBytes: byPath.get(PROPOSED_FREEZE).buffer, fragmentBytes: byPath.get(PROPOSED_FRAGMENT).buffer});
  const inputBindings = inputs.map(descriptor);
  return {plan, inputBindings};
}
export async function activateP042ReadableRegistration({write = false, check = false} = {}) {
  assert.ok(typeof write === 'boolean' && typeof check === 'boolean' && !(write && check));
  if (!write && !check) return {...await prepareP042ReadableRegistration(), mode: 'plan', writes: 0, activationExecuted: false};
  await prepareP042ReadableRegistration({check: true});
  const {plan, inputBindings} = await readP042ActivationInputs();
  const verifyPrepared = () => prepareP042ReadableRegistration({check: true});
  const checkGenerator = async () => {
    const sources = await buildRegistrySources();
    for (const [key, file] of Object.entries(GENERATED_OUTPUTS)) equal((await readBoundActivationFile(ROOT, file)).buffer, Buffer.from(sources[key]), `Maintained generator check drift: ${file}`);
    return {implementation: 'maintained-buildRegistrySources-read-only', generator: GENERATOR, writes: 0, passed: true};
  };
  if (check) return checkP042ReadableActivation({plan, inputBindings, verifyPrepared, checkGenerator});
  const beforeOutputs = Object.fromEntries(Object.entries(await buildRegistrySources()).map(([key, value]) => [key, Buffer.from(value)]));
  return executeP042ReadableActivation({plan, beforeOutputs, inputBindings, verifyPrepared, checkGenerator});
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2); assert.ok(args.length <= 1 && (!args.length || ['--plan', '--write', '--check'].includes(args[0])));
  activateP042ReadableRegistration({write: args[0] === '--write', check: args[0] === '--check'})
    .then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {console.error(error); process.exitCode = 1;});
}
