#!/usr/bin/env node
// Exact same-count379 v2 repair activation. Only --write mutates; failures retain backups and never roll back over edits.
import assert from 'node:assert/strict';
import {lstat, mkdir, mkdtemp, readFile, realpath, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT,REGISTRY,PRIOR,SOURCE,CANDIDATE,ID,SELF,PROPOSED_FREEZE,PROPOSED_FRAGMENT,encode,binding,composeRepairRegistration,prepareRepairRegistration}
  from './prepare-g678-nms-l01-p044-live-clock-registration.mjs';
import {mapHistoricalInput} from './build-g678-nms-l01-p044-live-clock-candidate.mjs';
const CHANGED_IDS = Object.freeze([ID]);
const LIVE_PREDECESSOR_REGISTRY = Object.freeze({...PRIOR.registry, path: REGISTRY});
const descriptor = ({path, bytes, sha256}) => ({path, bytes, sha256});
import {readBoundActivationFile, GENERATED_OUTPUTS, expectedScopedRegistryOutputs}
  from './activate-g678-alg-l11-feedback-host-score-registration.mjs';
import {buildRegistrySources} from '../packages/demos/scripts/generate-registry.mjs';
export {REGISTRY, GENERATED_OUTPUTS, expectedScopedRegistryOutputs};
export const ACTIVATION_RECEIPT = 'catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v2.activation.json';
export const RECOVERY_ROOT = 'work/g678-shared-page-factory/g678-nms-l01-p044-live-clock-registration-379-v2-activation';
export const ACTIVATION_LOCK = `${RECOVERY_ROOT}/activation-lock.json`;
const ACTIVATOR = 'scripts/activate-g678-nms-l01-p044-live-clock-registration.mjs';
const GENERATOR = 'packages/demos/scripts/generate-registry.mjs';
const FILES = [REGISTRY, ...Object.values(GENERATED_OUTPUTS)];
const REPLACED = [REGISTRY, GENERATED_OUTPUTS.localOnly, GENERATED_OUTPUTS.localOnlyMetadata];
export const EFFECTS = Object.freeze({productCalibrationPassed: false, browserProductCalibrationPassed: false,
  originalRuntimeAccepted: false, visualFidelityAccepted: false, audioAccepted: false,
  humanVisualAccepted: false, ownerAccepted: false, strictCompletionPassed: false,
  acceptancePassed: false, releaseAuthorized: false, published: false});
const parse = bytes => JSON.parse(bytes.toString('utf8'));
const equal = (a, b, message) => assert.ok(a.equals(b), message);

export function planP044RepairActivation(inputs) {
  assert.deepEqual(Object.keys(inputs).sort(), ['witnessBytes','priorFreezeBytes','priorFragmentBytes','sourceBytes','priorSourceBytes','candidateBytes',
    'priorActivationBytes','priorBridgeBytes','preparerBytes','freezeBytes','fragmentBytes'].sort());
  const {witnessBytes,priorFreezeBytes,priorFragmentBytes,sourceBytes,priorSourceBytes,candidateBytes,priorActivationBytes,priorBridgeBytes,preparerBytes,freezeBytes,fragmentBytes}=inputs;
  const rows=[[PRIOR.registry,witnessBytes],[PRIOR.freeze,priorFreezeBytes],[PRIOR.fragment,priorFragmentBytes],[SOURCE,sourceBytes],
    [PRIOR.source,priorSourceBytes],[CANDIDATE,candidateBytes],[PRIOR.activation,priorActivationBytes],[PRIOR.bridge,priorBridgeBytes]];
  for(const[p,bytes]of rows)assert.deepEqual(binding(p.path,bytes),p);
  const result=composeRepairRegistration({priorFreeze:parse(priorFreezeBytes),priorFragment:parse(priorFragmentBytes),priorRegistry:parse(witnessBytes),
    source:parse(sourceBytes),priorSource:parse(priorSourceBytes),candidate:parse(candidateBytes),plannerBinding:binding(SELF,preparerBytes)});
  equal(freezeBytes,result.freezeBytes,'Exact379 v2 repair freeze required');equal(fragmentBytes,result.fragmentBytes,'Exact379 v2 repair fragment required');
  assert.deepEqual(binding(PROPOSED_FREEZE,freezeBytes),{path:PROPOSED_FREEZE,bytes:2428383,sha256:'949572a4abc466d30d6bb7ffd52ab3b61f57f7f7dd7497ed5c224b931a88af4d'});
  assert.deepEqual(binding(PROPOSED_FRAGMENT,fragmentBytes),{path:PROPOSED_FRAGMENT,bytes:387009,sha256:'743e246399ef95219482ce771eeb1f9f537e874718d264e2a4fd8c173af6dff5'});
  assert.deepEqual(binding(REGISTRY,result.nextRegistryBytes),{path:REGISTRY,bytes:433976,sha256:'8a9d076d3b8c781e3255163216666e644488f159bbb2eaff41b479a8802b9c0e'});
  const previous=parse(witnessBytes).calibrations.find(c=>c.calibrationId===result.fragment.calibration.calibrationId);
  const changedIds=result.fragment.calibration.entries.filter(e=>JSON.stringify(e)!==JSON.stringify(previous.entries.find(old=>old.key===e.key))).map(e=>e.key);
  assert.deepEqual(changedIds,CHANGED_IDS);assert.deepEqual(result.fragment.calibration.entries.filter(e=>e.key!==ID),previous.entries.filter(e=>e.key!==ID));
  const preparedBindings=[...rows.map(([p,bytes])=>binding(p.path,bytes)),binding(SELF,preparerBytes),binding(PROPOSED_FREEZE,freezeBytes),binding(PROPOSED_FRAGMENT,fragmentBytes)];
  return{inputs:Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,Buffer.from(v)])),witnessBytes:Buffer.from(witnessBytes),
    nextRegistry:result.nextRegistry,nextRegistryBytes:result.nextRegistryBytes,changedIds,preservedPageCount:378,preparedBindings};
}

function validatePlan(plan, inputBindings) {
  assert.deepEqual(plan, planP044RepairActivation(plan.inputs), 'Activation plan mutated after validation');
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
  assert.deepEqual(beforeOutputs, expectedScopedRegistryOutputs(parse(plan.witnessBytes), beforeOutputs), 'Before outputs must match exact379 v1 registry');
  const afterOutputs = expectedScopedRegistryOutputs(plan.nextRegistry, beforeOutputs);
  for (const key of ['localOnly', 'localOnlyMetadata']) assert.ok(!beforeOutputs[key].equals(afterOutputs[key]));
  for (const key of ['bundled', 'metadata']) equal(beforeOutputs[key], afterOutputs[key], 'Public output must remain unchanged');
  const before = new Map([[REGISTRY, plan.witnessBytes], ...Object.entries(GENERATED_OUTPUTS).map(([key, file]) => [file, beforeOutputs[key]])]);
  const after = new Map([[REGISTRY, plan.nextRegistryBytes], ...Object.entries(GENERATED_OUTPUTS).map(([key, file]) => [file, afterOutputs[key]])]);
  return {before, after};
}

// The temporary-root test seam can inject a rename failure. The CLI does not
// accept alternate roots, targets, plans, renderers or replacement callbacks.
export async function executeP044RepairActivation({root = ROOT, plan, beforeOutputs, inputBindings,
  verifyPrepared, checkGenerator, replaceFile = rename}) {
  validatePlan(plan, inputBindings); await verifyPrepared(); await assertInputs(root, inputBindings);
  assert.deepEqual(binding(REGISTRY, (await readBoundActivationFile(root, REGISTRY)).buffer), LIVE_PREDECESSOR_REGISTRY,
    'Live registry must be exact379 v1 predecessor; use --check after activation');
  const {before, after} = states(plan, beforeOutputs);
  await assertState(root, before); await absent(root, ACTIVATION_RECEIPT); await absent(root, ACTIVATION_LOCK);
  await directory(root, RECOVERY_ROOT);
  // Retained lock prevents duplicate tool writers. Failure needs reviewed
  // recovery/new authority, not an automatic overwrite or lock removal.
  await exclusive(root, ACTIVATION_LOCK, {schemaVersion: 1, artifactType: 'g678-379-v2-p044-live-clock-activation-lock-v1',
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
    await exclusive(root, `${recovery}/transaction-plan.json`, {schemaVersion: 1, artifactType: 'g678-379-v2-p044-live-clock-transaction-plan-v1',
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
    const receipt = {schemaVersion: 1, artifactType: 'g678-p044-live-clock-local-registration-activation-v1',
      status: 'local-p044-live-clock-registration-activated-product-calibration-pending', deploymentScope: 'local-only',
      createdAt: new Date().toISOString(), registryChanged: true, registrationCount: 379, addedModuleCount: 0, changedModuleCount: 1,
      changedModuleIds: CHANGED_IDS, preservedPageCount: 378, otherCalibrationsUnchanged: true,
      publicOutputBytesUnchanged: true, publicOutputFilesWritten: 0, privateOutputChangedCount: 2,
      completedReplacements, inputBindings, lock, recovery, backups, proposed, generatorCheck, acceptanceEffects: EFFECTS,
      limitations: ['Three guarded file replacements are recoverable, not an atomic repository transaction or filesystem content-CAS.',
        'The retained lock coordinates this activation tool; unrelated writers still require a held coordination window.',
        'Local registration is not actual My Lesson companion QA, product calibration, audio/human/Owner acceptance, strict completion, release or publication.']};
    await exclusive(root, ACTIVATION_RECEIPT, receipt);
    return {activated: true, check: false, receipt: binding(ACTIVATION_RECEIPT, encode(receipt)), recovery,
      registrationCount: 379, addedModuleCount: 0, changedModuleCount: 1, preservedPageCount: 378, publicOutputFilesWritten: 0, acceptanceEffects: EFFECTS};
  } catch (error) {
    const observed = [];
    for (const file of FILES) {
      try {observed.push(descriptor(await readBoundActivationFile(root, file)));}
      catch (readError) {observed.push({path: file, observationError: String(readError.message)});}
    }
    const failure = {schemaVersion: 1, artifactType: 'g678-p044-live-clock-local-activation-failure-v1',
      phase, recovery, lock, backups, staged, completedReplacements, observed,
      message: String(error.message), rollbackAttempted: false, lockRetained: true, acceptanceEffects: EFFECTS};
    try {await exclusive(root, `${recovery}/failure.json`, failure);} catch (failureError) {error.failureEvidenceError = String(failureError.message);}
    error.message += `; recovery retained at ${recovery}; no automatic rollback; lock retained`; throw error;
  }
}

export async function checkP044RepairActivation({root = ROOT, plan, inputBindings, verifyPrepared, checkGenerator}) {
  validatePlan(plan, inputBindings); await verifyPrepared(); await assertInputs(root, inputBindings);
  const observed = await readBoundActivationFile(root, ACTIVATION_RECEIPT), receipt = parse(observed.buffer);
  assert.equal(receipt.artifactType, 'g678-p044-live-clock-local-registration-activation-v1');
  assert.equal(receipt.status, 'local-p044-live-clock-registration-activated-product-calibration-pending');
  assert.equal(receipt.schemaVersion, 1); assert.equal(receipt.deploymentScope, 'local-only');
  for (const [field, expected] of Object.entries({registryChanged: true, registrationCount: 379, addedModuleCount: 0, changedModuleCount: 1,
    preservedPageCount: 378, otherCalibrationsUnchanged: true, publicOutputBytesUnchanged: true, publicOutputFilesWritten: 0, privateOutputChangedCount: 2}))
    assert.equal(receipt[field], expected);
  assert.deepEqual(receipt.changedModuleIds, CHANGED_IDS); assert.deepEqual(receipt.completedReplacements, REPLACED);
  assert.deepEqual(receipt.acceptanceEffects, EFFECTS); assert.deepEqual(receipt.inputBindings, inputBindings);
  assert.equal(receipt.lock.path, ACTIVATION_LOCK);
  const lock = await readBoundActivationFile(root, ACTIVATION_LOCK, receipt.lock);
  assert.equal(lock.mode & 0o222, 0);
  assert.deepEqual(parse(lock.buffer), {schemaVersion: 1, artifactType: 'g678-379-v2-p044-live-clock-activation-lock-v1',
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
    addedModuleCount: 0, changedModuleCount: 1, preservedPageCount: 378, publicOutputFilesWritten: 0, acceptanceEffects: EFFECTS};
}

export const CLI_INPUT_PATHS=Object.freeze([PRIOR.registry.path,PRIOR.freeze.path,PRIOR.fragment.path,SOURCE.path,PRIOR.source.path,CANDIDATE.path,
  PRIOR.activation.path,PRIOR.bridge.path,SELF,PROPOSED_FREEZE,PROPOSED_FRAGMENT,ACTIVATOR,
  'scripts/build-g678-nms-l01-p044-live-clock-candidate.mjs','scripts/prepare-g678-nms-l01-p044-live-clock-registration.test.mjs',
  'scripts/activate-g678-nms-l01-p044-live-clock-registration.test.mjs','scripts/g678-nms-l01-p044-live-clock-registration-test-fixtures.mjs',
  'scripts/activate-g678-alg-l11-feedback-host-score-registration.mjs','scripts/prepare-g678-alg-l11-feedback-host-score-registration.mjs',
  'scripts/private-current-js-registry.mjs',GENERATOR,'packages/demos/prototype-registry.json','catalog/completion-ledger.json',
  'apps/web/lib/g678-calibration-product-bridge.server.ts','apps/web/lib/g678-nms-l01-p044-live-clock-authority.server.ts',
  'apps/web/tests/g678-nms-l01-p044-live-clock-authority.server-test.ts','apps/web/tests/g678-nms-l01-p044-live-clock-product-bridge.server-test.ts',
  'scripts/run-g678-nms-l01-p044-live-clock-local-preview.mjs','scripts/run-g678-nms-l01-p044-live-clock-local-preview.test.mjs']);
export async function readP044RepairActivationInputs(root=ROOT){
  const inputs=await Promise.all(CLI_INPUT_PATHS.map(file=>readBoundActivationFile(root,file))),byPath=new Map(inputs.map(i=>[i.path,i]));
  const bytes=p=>byPath.get(p.path??p).buffer;
  const plan=planP044RepairActivation({witnessBytes:bytes(PRIOR.registry),priorFreezeBytes:bytes(PRIOR.freeze),priorFragmentBytes:bytes(PRIOR.fragment),
    sourceBytes:bytes(SOURCE),priorSourceBytes:bytes(PRIOR.source),candidateBytes:bytes(CANDIDATE),priorActivationBytes:bytes(PRIOR.activation),
    priorBridgeBytes:bytes(PRIOR.bridge),preparerBytes:bytes(SELF),freezeBytes:bytes(PROPOSED_FREEZE),fragmentBytes:bytes(PROPOSED_FRAGMENT)});
  return{plan,inputBindings:inputs.map(descriptor)};
}
// Old activation remains historical evidence. Its only changed implementation
// input is resolved through the exact archived bridge, never current bytes.
export async function verify379V1ActivationHistory(root=ROOT){
  const receiptFile=await readBoundActivationFile(root,PRIOR.activation.path,PRIOR.activation),receipt=parse(receiptFile.buffer);
  assert.equal(receipt.artifactType,'g678-p044-prepared-local-registration-activation-v1');assert.equal(receipt.registrationCount,379);
  assert.deepEqual(receipt.proposed.registry,LIVE_PREDECESSOR_REGISTRY);assert.deepEqual(receipt.changedModuleIds,CHANGED_IDS);
  assert.equal(receipt.backups.length,5);assert.equal(receipt.publicOutputFilesWritten,0);assert.ok(Object.values(receipt.acceptanceEffects).every(v=>v===false));
  for(const p of receipt.inputBindings){const resolved=mapHistoricalInput(p);await readBoundActivationFile(root,resolved.path,resolved);}
  const lock=await readBoundActivationFile(root,receipt.lock.path,receipt.lock);assert.equal(lock.mode&0o222,0);
  for(const backup of receipt.backups){const file=await readBoundActivationFile(root,backup.backup.path,backup.backup);assert.equal(file.mode&0o222,0);assert.deepEqual(binding(backup.original.path,file.buffer),backup.original);}
  return{writes:0,receipt:PRIOR.activation,originalsVerified:5,archivedBridge:PRIOR.bridge};
}
export async function activateP044RepairRegistration({write = false, check = false} = {}) {
  assert.ok(typeof write === 'boolean' && typeof check === 'boolean' && !(write && check));
  if (!write && !check) return {...await prepareRepairRegistration(), mode: 'plan', writes: 0, activationExecuted: false};
  await prepareRepairRegistration({check: true});await verify379V1ActivationHistory();
  const {plan, inputBindings} = await readP044RepairActivationInputs();
  const verifyPrepared = async () => {await prepareRepairRegistration({check:true});await verify379V1ActivationHistory();};
  const checkGenerator = async () => {
    const sources = await buildRegistrySources();
    for (const [key, file] of Object.entries(GENERATED_OUTPUTS)) equal((await readBoundActivationFile(ROOT, file)).buffer, Buffer.from(sources[key]), `Maintained generator check drift: ${file}`);
    return {implementation: 'maintained-buildRegistrySources-read-only', generator: GENERATOR, writes: 0, passed: true};
  };
  if (check) return checkP044RepairActivation({plan, inputBindings, verifyPrepared, checkGenerator});
  const beforeOutputs = Object.fromEntries(Object.entries(await buildRegistrySources()).map(([key, value]) => [key, Buffer.from(value)]));
  return executeP044RepairActivation({plan, beforeOutputs, inputBindings, verifyPrepared, checkGenerator});
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2); assert.ok(args.length <= 1 && (!args.length || ['--plan', '--write', '--check'].includes(args[0])));
  activateP044RepairRegistration({write: args[0] === '--write', check: args[0] === '--check'})
    .then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {console.error(error); process.exitCode = 1;});
}
