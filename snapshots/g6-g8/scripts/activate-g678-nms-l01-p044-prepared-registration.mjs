#!/usr/bin/env node
// Exact local 379 activation. Only --write mutates; failures retain backups and never roll back over edits.
import assert from 'node:assert/strict';
import {lstat, mkdir, mkdtemp, readFile, realpath, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT, REGISTRY, PRIOR, AUTHORITY, BASE_AUTHORITY, CATALOG, ID, PLANNER, PROPOSED_FREEZE, PROPOSED_FRAGMENT,
  encode, binding, composeP044Registration} from './plan-g678-nms-l01-p044-registration.mjs';
import {prepare379} from './prepare-g678-nms-l01-p044-registration.mjs';
const CHANGED_IDS = Object.freeze([ID]);
const LIVE_PREDECESSOR_REGISTRY = Object.freeze({...PRIOR.registry, path: REGISTRY});
const descriptor = ({path, bytes, sha256}) => ({path, bytes, sha256});
import {readBoundActivationFile, GENERATED_OUTPUTS, expectedScopedRegistryOutputs}
  from './activate-g678-alg-l11-feedback-host-score-registration.mjs';
import {buildRegistrySources} from '../packages/demos/scripts/generate-registry.mjs';
export {REGISTRY, GENERATED_OUTPUTS, expectedScopedRegistryOutputs};
export const ACTIVATION_RECEIPT = 'catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v1.activation.json';
export const RECOVERY_ROOT = 'work/g678-shared-page-factory/g678-nms-l01-p044-prepared-registration-379-v1-activation';
export const ACTIVATION_LOCK = `${RECOVERY_ROOT}/activation-lock.json`;
const PREPARER = 'scripts/prepare-g678-nms-l01-p044-registration.mjs';
const ACTIVATOR = 'scripts/activate-g678-nms-l01-p044-prepared-registration.mjs';
const GENERATOR = 'packages/demos/scripts/generate-registry.mjs';
const FILES = [REGISTRY, ...Object.values(GENERATED_OUTPUTS)];
const REPLACED = [REGISTRY, GENERATED_OUTPUTS.localOnly, GENERATED_OUTPUTS.localOnlyMetadata];
export const EFFECTS = Object.freeze({productCalibrationPassed: false, browserProductCalibrationPassed: false,
  originalRuntimeAccepted: false, visualFidelityAccepted: false, audioAccepted: false,
  humanVisualAccepted: false, ownerAccepted: false, strictCompletionPassed: false,
  acceptancePassed: false, releaseAuthorized: false, published: false});
const parse = bytes => JSON.parse(bytes.toString('utf8'));
const equal = (a, b, message) => assert.ok(a.equals(b), message);

export function planP044PreparedActivation(inputs) {
  assert.deepEqual(Object.keys(inputs).sort(), ['witnessBytes', 'priorFreezeBytes', 'priorFragmentBytes', 'sourceBytes', 'baseSourceBytes',
    'catalogBytes', 'priorActivationBytes', 'plannerBytes', 'freezeBytes', 'fragmentBytes'].sort(), 'Exact activation input keys only');
  const {witnessBytes, priorFreezeBytes, priorFragmentBytes, sourceBytes, baseSourceBytes, catalogBytes,
    priorActivationBytes, plannerBytes, freezeBytes, fragmentBytes} = inputs;
  for (const [expected, bytes] of [[PRIOR.registry, witnessBytes], [PRIOR.freeze, priorFreezeBytes], [PRIOR.fragment, priorFragmentBytes],
    [AUTHORITY, sourceBytes], [BASE_AUTHORITY, baseSourceBytes], [CATALOG, catalogBytes], [PRIOR.activation, priorActivationBytes]])
    assert.deepEqual(binding(expected.path, bytes), expected, 'Raw source/predecessor bytes must match exact pin');
  const result = composeP044Registration({priorFreeze: parse(priorFreezeBytes), priorFragment: parse(priorFragmentBytes),
    priorRegistry: parse(witnessBytes), source: parse(sourceBytes), sourceBase: parse(baseSourceBytes), pagesCatalog: parse(catalogBytes),
    plannerBinding: binding(PLANNER, plannerBytes)});
  equal(freezeBytes, result.freezeBytes, 'Prepared379 freeze differs from exact1/378 composition');
  equal(fragmentBytes, result.fragmentBytes, 'Prepared379 fragment differs from exact1/378 composition');
  assert.deepEqual(binding(PROPOSED_FREEZE, freezeBytes), {path:PROPOSED_FREEZE,bytes:2424951,sha256:'1c80050ed48b12f4f16039c3a83136781c586da4520a4108d7b6cd8e5bb9cc81'});
  assert.deepEqual(binding(PROPOSED_FRAGMENT, fragmentBytes), {path:PROPOSED_FRAGMENT,bytes:386993,sha256:'82ff42f9d38d3c66cf8b497645375970a773870af8975867fc046f231e3c23d5'});
  assert.deepEqual(binding(REGISTRY, result.nextRegistryBytes), {path:REGISTRY,bytes:433966,sha256:'e68a3d39213766e220795a4f0a16412e09a0e830c9978a66bcd7dd02361372cb'});
  const previous = parse(witnessBytes).calibrations.find(c => c.calibrationId === result.fragment.calibration.calibrationId);
  const changedIds = result.fragment.calibration.entries.filter(e => !previous.entries.some(old => old.key === e.key)).map(e => e.key);
  assert.deepEqual(result.fragment.calibration.entries.filter(e => e.key !== ID), previous.entries);
  assert.deepEqual(changedIds, CHANGED_IDS);
  const preparedBindings = [[PRIOR.registry.path, witnessBytes], [PRIOR.freeze.path, priorFreezeBytes], [PRIOR.fragment.path, priorFragmentBytes],
    [AUTHORITY.path, sourceBytes], [BASE_AUTHORITY.path, baseSourceBytes], [CATALOG.path, catalogBytes], [PRIOR.activation.path, priorActivationBytes],
    [PLANNER, plannerBytes], [PROPOSED_FREEZE, freezeBytes], [PROPOSED_FRAGMENT, fragmentBytes]].map(([file, bytes]) => binding(file, bytes));
  return {inputs: Object.fromEntries(Object.entries(inputs).map(([key, bytes]) => [key, Buffer.from(bytes)])),
    witnessBytes: Buffer.from(witnessBytes), nextRegistry: result.nextRegistry, nextRegistryBytes: result.nextRegistryBytes,
    changedIds, preservedPageCount: 378, preparedBindings};
}

function validatePlan(plan, inputBindings) {
  assert.deepEqual(plan, planP044PreparedActivation(plan.inputs), 'Activation plan mutated after validation');
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
  assert.deepEqual(beforeOutputs, expectedScopedRegistryOutputs(parse(plan.witnessBytes), beforeOutputs), 'Before outputs must match exact 378 registry');
  const afterOutputs = expectedScopedRegistryOutputs(plan.nextRegistry, beforeOutputs);
  for (const key of ['localOnly', 'localOnlyMetadata']) assert.ok(!beforeOutputs[key].equals(afterOutputs[key]));
  for (const key of ['bundled', 'metadata']) equal(beforeOutputs[key], afterOutputs[key], 'Public output must remain unchanged');
  const before = new Map([[REGISTRY, plan.witnessBytes], ...Object.entries(GENERATED_OUTPUTS).map(([key, file]) => [file, beforeOutputs[key]])]);
  const after = new Map([[REGISTRY, plan.nextRegistryBytes], ...Object.entries(GENERATED_OUTPUTS).map(([key, file]) => [file, afterOutputs[key]])]);
  return {before, after};
}

// The temporary-root test seam can inject a rename failure. The CLI does not
// accept alternate roots, targets, plans, renderers or replacement callbacks.
export async function executeP044PreparedActivation({root = ROOT, plan, beforeOutputs, inputBindings,
  verifyPrepared, checkGenerator, replaceFile = rename}) {
  validatePlan(plan, inputBindings); await verifyPrepared(); await assertInputs(root, inputBindings);
  assert.deepEqual(binding(REGISTRY, (await readBoundActivationFile(root, REGISTRY)).buffer), LIVE_PREDECESSOR_REGISTRY,
    'Live registry must be exact 378 predecessor; use --check after activation');
  const {before, after} = states(plan, beforeOutputs);
  await assertState(root, before); await absent(root, ACTIVATION_RECEIPT); await absent(root, ACTIVATION_LOCK);
  await directory(root, RECOVERY_ROOT);
  // Retained lock prevents duplicate tool writers. Failure needs reviewed
  // recovery/new authority, not an automatic overwrite or lock removal.
  await exclusive(root, ACTIVATION_LOCK, {schemaVersion: 1, artifactType: 'g678-379-p044-prepared-activation-lock-v1',
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
    await exclusive(root, `${recovery}/transaction-plan.json`, {schemaVersion: 1, artifactType: 'g678-379-p044-prepared-transaction-plan-v1',
      inputBindings, lock, backups, staged, proposed, changedIds: CHANGED_IDS, preservedPageCount: 378, acceptanceEffects: EFFECTS});
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
    const receipt = {schemaVersion: 1, artifactType: 'g678-p044-prepared-local-registration-activation-v1',
      status: 'local-p044-prepared-registration-activated-product-calibration-pending', deploymentScope: 'local-only',
      createdAt: new Date().toISOString(), registryChanged: true, registrationCount: 379, addedModuleCount: 1,
      changedModuleIds: CHANGED_IDS, preservedPageCount: 378, otherCalibrationsUnchanged: true,
      publicOutputBytesUnchanged: true, publicOutputFilesWritten: 0, privateOutputChangedCount: 2,
      completedReplacements, inputBindings, lock, recovery, backups, proposed, generatorCheck, acceptanceEffects: EFFECTS,
      limitations: ['Three guarded file replacements are recoverable, not an atomic repository transaction or filesystem content-CAS.',
        'The retained lock coordinates this activation tool; unrelated writers still require a held coordination window.',
        'Local registration is not actual My Lesson companion QA, product calibration, audio/human/Owner acceptance, strict completion, release or publication.']};
    await exclusive(root, ACTIVATION_RECEIPT, receipt);
    return {activated: true, check: false, receipt: binding(ACTIVATION_RECEIPT, encode(receipt)), recovery,
      registrationCount: 379, addedModuleCount: 1, preservedPageCount: 378, publicOutputFilesWritten: 0, acceptanceEffects: EFFECTS};
  } catch (error) {
    const observed = [];
    for (const file of FILES) {
      try {observed.push(descriptor(await readBoundActivationFile(root, file)));}
      catch (readError) {observed.push({path: file, observationError: String(readError.message)});}
    }
    const failure = {schemaVersion: 1, artifactType: 'g678-p044-prepared-local-activation-failure-v1',
      phase, recovery, lock, backups, staged, completedReplacements, observed,
      message: String(error.message), rollbackAttempted: false, lockRetained: true, acceptanceEffects: EFFECTS};
    try {await exclusive(root, `${recovery}/failure.json`, failure);} catch (failureError) {error.failureEvidenceError = String(failureError.message);}
    error.message += `; recovery retained at ${recovery}; no automatic rollback; lock retained`; throw error;
  }
}

export async function checkP044PreparedActivation({root = ROOT, plan, inputBindings, verifyPrepared, checkGenerator}) {
  validatePlan(plan, inputBindings); await verifyPrepared(); await assertInputs(root, inputBindings);
  const observed = await readBoundActivationFile(root, ACTIVATION_RECEIPT), receipt = parse(observed.buffer);
  assert.equal(receipt.artifactType, 'g678-p044-prepared-local-registration-activation-v1');
  assert.equal(receipt.status, 'local-p044-prepared-registration-activated-product-calibration-pending');
  assert.equal(receipt.schemaVersion, 1); assert.equal(receipt.deploymentScope, 'local-only');
  for (const [field, expected] of Object.entries({registryChanged: true, registrationCount: 379, addedModuleCount: 1,
    preservedPageCount: 378, otherCalibrationsUnchanged: true, publicOutputBytesUnchanged: true, publicOutputFilesWritten: 0, privateOutputChangedCount: 2}))
    assert.equal(receipt[field], expected);
  assert.deepEqual(receipt.changedModuleIds, CHANGED_IDS); assert.deepEqual(receipt.completedReplacements, REPLACED);
  assert.deepEqual(receipt.acceptanceEffects, EFFECTS); assert.deepEqual(receipt.inputBindings, inputBindings);
  assert.equal(receipt.lock.path, ACTIVATION_LOCK);
  const lock = await readBoundActivationFile(root, ACTIVATION_LOCK, receipt.lock);
  assert.equal(lock.mode & 0o222, 0);
  assert.deepEqual(parse(lock.buffer), {schemaVersion: 1, artifactType: 'g678-379-p044-prepared-activation-lock-v1',
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
  return {activated: true, check: true, writes: 0, receipt: descriptor(observed), registrationCount: 379,
    addedModuleCount: 1, preservedPageCount: 378, publicOutputFilesWritten: 0, acceptanceEffects: EFFECTS};
}

export const CLI_INPUT_PATHS = Object.freeze([PRIOR.registry.path, PRIOR.freeze.path, PRIOR.fragment.path, AUTHORITY.path, BASE_AUTHORITY.path,
  CATALOG.path, PRIOR.activation.path, PLANNER, PROPOSED_FREEZE, PROPOSED_FRAGMENT, PREPARER, ACTIVATOR,
  'scripts/plan-g678-nms-l01-p044-registration.test.mjs',
  'scripts/prepare-g678-nms-l01-p044-registration.test.mjs',
  'scripts/activate-g678-nms-l01-p044-prepared-registration.test.mjs',
  'scripts/g678-nms-l01-p044-prepared-registration-test-fixtures.mjs',
  'scripts/prepare-g678-nms-l01-p044-stable-candidate.mjs',
  'scripts/activate-g678-alg-l11-feedback-host-score-registration.mjs',
  'scripts/prepare-g678-alg-l11-feedback-host-score-registration.mjs',
  'scripts/private-current-js-registry.mjs', GENERATOR, 'packages/demos/prototype-registry.json', 'catalog/completion-ledger.json',
  'apps/web/lib/g678-calibration-product-bridge.server.ts',
  'apps/web/lib/g678-nms-l01-p044-authority.server.ts',
  'apps/web/tests/g678-nms-l01-p044-authority.server-test.ts',
  'apps/web/tests/g678-nms-l01-p044-product-bridge.server-test.ts',
  'scripts/run-g678-nms-l01-p044-prepared-local-preview.mjs',
  'scripts/run-g678-nms-l01-p044-prepared-local-preview.test.mjs']);
export async function readP044ActivationInputs(root = ROOT) {
  const inputs = await Promise.all(CLI_INPUT_PATHS.map(file => readBoundActivationFile(root, file))), byPath = new Map(inputs.map(i => [i.path, i]));
  const plan = planP044PreparedActivation({witnessBytes: byPath.get(PRIOR.registry.path).buffer, priorFreezeBytes: byPath.get(PRIOR.freeze.path).buffer,
    priorFragmentBytes: byPath.get(PRIOR.fragment.path).buffer, sourceBytes: byPath.get(AUTHORITY.path).buffer,
    baseSourceBytes: byPath.get(BASE_AUTHORITY.path).buffer, catalogBytes: byPath.get(CATALOG.path).buffer,
    priorActivationBytes: byPath.get(PRIOR.activation.path).buffer, plannerBytes: byPath.get(PLANNER).buffer,
    freezeBytes: byPath.get(PROPOSED_FREEZE).buffer, fragmentBytes: byPath.get(PROPOSED_FRAGMENT).buffer});
  return {plan, inputBindings: inputs.map(descriptor)};
}
export async function activateP044PreparedRegistration({write = false, check = false} = {}) {
  assert.ok(typeof write === 'boolean' && typeof check === 'boolean' && !(write && check));
  if (!write && !check) return {...await prepare379(), mode: 'plan', writes: 0, activationExecuted: false};
  await prepare379({check: true});
  const {plan, inputBindings} = await readP044ActivationInputs();
  const verifyPrepared = () => prepare379({check: true});
  const checkGenerator = async () => {
    const sources = await buildRegistrySources();
    for (const [key, file] of Object.entries(GENERATED_OUTPUTS)) equal((await readBoundActivationFile(ROOT, file)).buffer, Buffer.from(sources[key]), `Maintained generator check drift: ${file}`);
    return {implementation: 'maintained-buildRegistrySources-read-only', generator: GENERATOR, writes: 0, passed: true};
  };
  if (check) return checkP044PreparedActivation({plan, inputBindings, verifyPrepared, checkGenerator});
  const beforeOutputs = Object.fromEntries(Object.entries(await buildRegistrySources()).map(([key, value]) => [key, Buffer.from(value)]));
  return executeP044PreparedActivation({plan, beforeOutputs, inputBindings, verifyPrepared, checkGenerator});
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2); assert.ok(args.length <= 1 && (!args.length || ['--plan', '--write', '--check'].includes(args[0])));
  activateP044PreparedRegistration({write: args[0] === '--write', check: args[0] === '--check'})
    .then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {console.error(error); process.exitCode = 1;});
}
