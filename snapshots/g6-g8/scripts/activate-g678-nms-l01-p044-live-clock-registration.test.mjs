import assert from 'node:assert/strict';
import {lstat, mkdir, readFile, readdir, rename, symlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {PRIOR, PROPOSED_FREEZE, PROPOSED_FRAGMENT, ID, encode}
  from './prepare-g678-nms-l01-p044-live-clock-registration.mjs';
const CHANGED_IDS=[ID];
import {REGISTRY, GENERATED_OUTPUTS, ACTIVATION_RECEIPT, ACTIVATION_LOCK, RECOVERY_ROOT, EFFECTS, CLI_INPUT_PATHS,readP044RepairActivationInputs,
  planP044RepairActivation, verify379V1ActivationHistory, expectedScopedRegistryOutputs, executeP044RepairActivation, checkP044RepairActivation}
  from './activate-g678-nms-l01-p044-live-clock-registration.mjs';
import {fixture, temporary, seed, snapshot, parse,read,checkTemporaryPrepared} from './g678-nms-l01-p044-live-clock-registration-test-fixtures.mjs';

test('exact 379 v2 activation plan replaces1/preserves378, uses immutable379 v1 witness and keeps all acceptance false', () => {
  const f = fixture(), plan = planP044RepairActivation(f.inputs);
  assert.deepEqual(plan.changedIds, CHANGED_IDS); assert.equal(plan.preservedPageCount, 378);
  assert.deepEqual(plan.preparedBindings[0], PRIOR.registry);
  assert.ok(Object.values(parse(f.inputs.freezeBytes).acceptanceEffects).every(v => v === false));
  assert.ok(Object.values(EFFECTS).every(v => v === false));
  const previous = parse(f.inputs.witnessBytes), next = plan.nextRegistry;
  const old = previous.calibrations.find(c => c.calibrationId === f.result.fragment.calibration.calibrationId);
  const current = next.calibrations.find(c => c.calibrationId === old.calibrationId);
  assert.equal(current.entries.length, 379); assert.equal(current.freezeManifest, PROPOSED_FREEZE);
  assert.deepEqual(current.entries.filter(e => !CHANGED_IDS.includes(e.key)), old.entries.filter(e => !CHANGED_IDS.includes(e.key)));
  assert.deepEqual(next.calibrations.filter(c => c.calibrationId !== old.calibrationId), previous.calibrations.filter(c => c.calibrationId !== old.calibrationId));
});
test('tampered preparation/source/witness/planner inputs cannot yield a validated activation plan', () => {
  for (const field of Object.keys(fixture().inputs)) {
    const f = fixture(); f.inputs[field] = Buffer.concat([f.inputs[field], Buffer.from('\n')]);
    assert.throws(() => planP044RepairActivation(f.inputs));
  }
  for (const mutate of [r => {r.freeze.acceptanceEffects.audioAccepted = true;},
    r => {r.freeze.selectedPages.find(p => !CHANGED_IDS.includes(p.animationId)).title = 'changed';},
    r => {r.freeze.selectedPages.find(p => p.animationId === CHANGED_IDS[0]).presentation.pageInteractionCompanionTargetIdSuffix = 'arbitrary';},
    r => {r.fragment.calibration.entries.find(e => e.key === CHANGED_IDS[0]).module = './modules/other';}]) {
    const f = fixture(); mutate(f.result); f.inputs.freezeBytes = encode(f.result.freeze); f.inputs.fragmentBytes = encode(f.result.fragment);
    assert.throws(() => planP044RepairActivation(f.inputs));
  }
});
async function activationFixture(t) {
  const f = await temporary(t, {prepared: true}), plan = planP044RepairActivation(f.inputs);
  const beforeOutputs = expectedScopedRegistryOutputs(parse(f.witnessBytes), {
    bundled: Buffer.from('// test-owned public registry\n'), metadata: Buffer.from('// test-owned public metadata\n')});
  await seed(f.root, Object.entries(GENERATED_OUTPUTS).map(([key, file]) => [file, beforeOutputs[key]]));
  const afterOutputs = expectedScopedRegistryOutputs(plan.nextRegistry, beforeOutputs), calls = {checks: 0, prepares: 0, replaces: []};
  const verifyPrepared = async () => {calls.prepares++; assert.equal(await checkTemporaryPrepared(f), 0);};
  const checkGenerator = async () => {
    calls.checks++;
    for (const [key, file] of Object.entries(GENERATED_OUTPUTS)) assert.ok((await readFile(path.join(f.root, file))).equals(afterOutputs[key]));
    return {implementation: 'test-only-read-only-generator', writes: 0, passed: true};
  };
  const replaceFile = async (from, to) => {calls.replaces.push(path.relative(f.root, to)); await rename(from, to);};
  return {...f, plan, beforeOutputs, afterOutputs, inputBindings: plan.preparedBindings, verifyPrepared, checkGenerator, replaceFile, calls};
}
async function failure(f) {
  await assert.rejects(lstat(path.join(f.root, ACTIVATION_RECEIPT)), {code: 'ENOENT'});
  const dir = (await readdir(path.join(f.root, RECOVERY_ROOT))).find(name => name.startsWith('activation-') && name !== 'activation-lock.json');
  return parse(await readFile(path.join(f.root, RECOVERY_ROOT, dir, 'failure.json')));
}
test('temporary activation retains5 originals, replaces only3 files, never writes public2; repeated checks are read-only', async t => {
  const f = await activationFixture(t), before = await snapshot(f.root), result = await executeP044RepairActivation(f);
  assert.equal(result.changedModuleCount, 1); assert.equal(result.preservedPageCount, 378); assert.equal(result.publicOutputFilesWritten, 0);
  assert.deepEqual(f.calls.replaces, [REGISTRY, GENERATED_OUTPUTS.localOnly, GENERATED_OUTPUTS.localOnlyMetadata]);
  const receipt = parse(await readFile(path.join(f.root, ACTIVATION_RECEIPT)));
  assert.equal(receipt.backups.length, 5); assert.equal(receipt.publicOutputFilesWritten, 0);
  for (const item of receipt.backups) assert.ok((await readFile(path.join(f.root, item.backup.path))).equals(
    item.original.path === REGISTRY ? f.witnessBytes : f.beforeOutputs[Object.entries(GENERATED_OUTPUTS).find(([,p]) => p === item.original.path)[0]]));
  const after = await snapshot(f.root);
  for (const file of [GENERATED_OUTPUTS.bundled, GENERATED_OUTPUTS.metadata]) assert.deepEqual(after.find(r => r.path === file), before.find(r => r.path === file));
  for (let i = 0; i < 2; i++) assert.equal((await checkP044RepairActivation(f)).writes, 0);
  assert.deepEqual(await snapshot(f.root), after); assert.equal(f.calls.checks, 3);
  await assert.rejects(executeP044RepairActivation(f), /Live registry must be exact379 v1 predecessor/);
  assert.deepEqual(await snapshot(f.root), after);
});
test('live drift, forged plan or an existing lock blocks before any transaction writes', async t => {
  for (const kind of ['registry', 'plan', 'lock']) {
    const f = await activationFixture(t);
    if (kind === 'registry') await writeFile(path.join(f.root, REGISTRY), '{}\n');
    if (kind === 'plan') f.plan.changedIds.push('shared-alg001-l11-p033');
    if (kind === 'lock') await seed(f.root, [[ACTIVATION_LOCK, '{}\n', 0o444]]);
    const before = await snapshot(f.root); await assert.rejects(executeP044RepairActivation(f));
    assert.deepEqual(await snapshot(f.root), before); assert.deepEqual(f.calls.replaces, []);
  }
});
test('interrupted second replacement retains partial 379 registry, all5 originals and lock without automatic rollback', async t => {
  const f = await activationFixture(t), runner = f.replaceFile;
  f.replaceFile = async (from, to) => {if (to.endsWith('registry.local-only.generated.ts')) throw Error('test-only replacement interruption'); await runner(from, to);};
  await assert.rejects(executeP044RepairActivation(f), /no automatic rollback; lock retained/);
  const failed = await failure(f); assert.equal(failed.rollbackAttempted, false); assert.equal(failed.lockRetained, true);
  assert.equal(failed.backups.length, 5); assert.deepEqual(failed.completedReplacements, [REGISTRY]);
  assert.ok((await readFile(path.join(f.root, REGISTRY))).equals(f.plan.nextRegistryBytes));
  assert.ok((await readFile(path.join(f.root, GENERATED_OUTPUTS.localOnly))).equals(f.beforeOutputs.localOnly));
  assert.equal(f.calls.checks, 0);
});
test('concurrent local or public edits after first replacement are retained and block the next overwrite', async t => {
  for (const target of [GENERATED_OUTPUTS.localOnly, GENERATED_OUTPUTS.bundled]) {
    const f = await activationFixture(t), runner = f.replaceFile, canary = Buffer.from('// concurrent user edit\n');
    f.replaceFile = async (from, to) => {await runner(from, to); if (to === path.join(f.root, REGISTRY)) await writeFile(path.join(f.root, target), canary);};
    await assert.rejects(executeP044RepairActivation(f), /Concurrent\/output drift/);
    assert.ok((await readFile(path.join(f.root, target))).equals(canary));
    assert.deepEqual(f.calls.replaces, [REGISTRY]); const failed = await failure(f); assert.equal(failed.rollbackAttempted, false);
  }
});
test('postflight checker or input drift leaves no success receipt and never rolls back', async t => {
  for (const kind of ['checker', 'input']) {
    const f = await activationFixture(t), check = f.checkGenerator;
    f.checkGenerator = async () => {await check(); if (kind === 'checker') throw Error('test-only generator mismatch');
      await writeFile(path.join(f.root, 'scripts/prepare-g678-nms-l01-p044-live-clock-registration.mjs'), '// changed input\n');};
    await assert.rejects(executeP044RepairActivation(f));
    const failed = await failure(f); assert.equal(failed.phase, 'postflight'); assert.equal(failed.rollbackAttempted, false);
    assert.deepEqual(failed.completedReplacements, [REGISTRY, GENERATED_OUTPUTS.localOnly, GENERATED_OUTPUTS.localOnlyMetadata]);
  }
});
test('missing receipt and changed activated output are rejected by write-free checks', async t => {
  const f = await activationFixture(t), initial = await snapshot(f.root);
  await assert.rejects(checkP044RepairActivation(f), {code: 'ENOENT'}); assert.deepEqual(await snapshot(f.root), initial);
  await executeP044RepairActivation(f); await writeFile(path.join(f.root, GENERATED_OUTPUTS.localOnlyMetadata), '// changed\n');
  const drifted = await snapshot(f.root); await assert.rejects(checkP044RepairActivation(f), /Concurrent\/output drift/);
  assert.deepEqual(await snapshot(f.root), drifted);
});
test('symlinked recovery root is rejected without writing outside the permitted new root', async t => {
  const f = await activationFixture(t), canary = path.join(f.root, 'outside-canary'); await mkdir(canary);
  await mkdir(path.dirname(path.join(f.root, RECOVERY_ROOT)), {recursive:true});
  await symlink(canary, path.join(f.root, RECOVERY_ROOT));
  const before = await snapshot(f.root); await assert.rejects(executeP044RepairActivation(f), /must not traverse symlinks/);
  assert.deepEqual(await readdir(canary), []); assert.deepEqual(await snapshot(f.root), before); assert.deepEqual(f.calls.replaces, []);
});
test('actual CLI input assembly supplies the exact11 buffers from physical files and is read-only',async t=>{
  const f=await temporary(t,{prepared:true});
  for(const file of CLI_INPUT_PATHS){try{await lstat(path.join(f.root,file));}catch(error){if(error.code!=='ENOENT')throw error;await seed(f.root,[[file,read(file)]]);}}
  const before=await snapshot(f.root),loaded=await readP044RepairActivationInputs(f.root);
  assert.deepEqual(Object.keys(loaded.plan.inputs).sort(),Object.keys(f.inputs).sort());
  assert.deepEqual(loaded.plan,planP044RepairActivation(f.inputs));assert.equal(loaded.inputBindings.length,CLI_INPUT_PATHS.length);
  assert.deepEqual(await snapshot(f.root),before);
  await writeFile(path.join(f.root,'catalog/g678-nms-l01-p044-live-clock-candidate-v3.json'),Buffer.concat([f.inputs.candidateBytes,Buffer.from('\n')]));
  const drifted=await snapshot(f.root);await assert.rejects(readP044RepairActivationInputs(f.root));assert.deepEqual(await snapshot(f.root),drifted);
});
test('interruptions before first and third replacements retain all5 backups, precise partial state and never touch public2',async t=>{
  for(const interrupted of [1,3]){
    const f=await activationFixture(t),before=await snapshot(f.root),runner=f.replaceFile;let attempt=0;
    f.replaceFile=async(from,to)=>{if(++attempt===interrupted)throw Error(`test interruption before replacement${interrupted}`);await runner(from,to);};
    await assert.rejects(executeP044RepairActivation(f),/no automatic rollback; lock retained/);
    const failed=await failure(f);assert.equal(failed.backups.length,5);assert.equal(failed.completedReplacements.length,interrupted-1);
    assert.deepEqual(failed.completedReplacements,[REGISTRY,GENERATED_OUTPUTS.localOnly].slice(0,interrupted-1));
    const after=await snapshot(f.root);for(const file of [GENERATED_OUTPUTS.bundled,GENERATED_OUTPUTS.metadata])assert.deepEqual(after.find(r=>r.path===file),before.find(r=>r.path===file));
    await assert.rejects(executeP044RepairActivation(f));assert.deepEqual(await snapshot(f.root),after);
  }
});
test('source input drift after first replacement blocks the next overwrite and retains concurrent bytes',async t=>{
  const f=await activationFixture(t),runner=f.replaceFile,changed='catalog/g678-nms-l01-p044-live-clock-candidate-v3.json',canary=Buffer.from('concurrent catalog edit\n');
  f.replaceFile=async(from,to)=>{await runner(from,to);if(to===path.join(f.root,REGISTRY))await writeFile(path.join(f.root,changed),canary);};
  await assert.rejects(executeP044RepairActivation(f));assert.deepEqual(f.calls.replaces,[REGISTRY]);
  assert.ok((await readFile(path.join(f.root,changed))).equals(canary));const failed=await failure(f);assert.equal(failed.rollbackAttempted,false);
});

test('actual379 v1 activation history verifies five originals and the exact archived bridge without reading mutable current bridge as old authority',async()=>{
  const result=await verify379V1ActivationHistory();assert.equal(result.writes,0);assert.equal(result.originalsVerified,5);assert.equal(result.archivedBridge.path,PRIOR.bridge.path);
});
