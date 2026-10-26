import assert from 'node:assert/strict';
import {lstat, mkdir, readFile, readdir, rename, symlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {PRIOR, PROPOSED_FREEZE, PROPOSED_FRAGMENT, CHANGED_IDS, publishV4Preparation, encode}
  from './prepare-g678-alg-l11-math-companion-registration.mjs';
import {REGISTRY, GENERATED_OUTPUTS, ACTIVATION_RECEIPT, ACTIVATION_LOCK, RECOVERY_ROOT, EFFECTS,
  planMathCompanionActivation, expectedScopedRegistryOutputs, executeMathCompanionActivation, checkMathCompanionActivation}
  from './activate-g678-alg-l11-math-companion-registration.mjs';
import {fixture, temporary, seed, snapshot, parse} from './g678-math-companion-registration-test-fixtures.mjs';

test('exact V4 activation plan changes2/375, uses immutable V3 witness and keeps all acceptance false', () => {
  const f = fixture(), plan = planMathCompanionActivation(f.inputs);
  assert.deepEqual(plan.changedIds, CHANGED_IDS); assert.equal(plan.preservedPageCount, 375);
  assert.deepEqual(plan.preparedBindings[0], PRIOR.registry);
  assert.ok(Object.values(parse(f.inputs.freezeBytes).acceptanceEffects).every(v => v === false));
  assert.ok(Object.values(EFFECTS).every(v => v === false));
  const previous = parse(f.inputs.witnessBytes), next = plan.nextRegistry;
  const old = previous.calibrations.find(c => c.calibrationId === f.result.fragment.calibration.calibrationId);
  const current = next.calibrations.find(c => c.calibrationId === old.calibrationId);
  assert.equal(current.entries.length, 377); assert.equal(current.freezeManifest, PROPOSED_FREEZE);
  assert.deepEqual(current.entries.filter(e => !CHANGED_IDS.includes(e.key)), old.entries.filter(e => !CHANGED_IDS.includes(e.key)));
  assert.deepEqual(next.calibrations.filter(c => c.calibrationId !== old.calibrationId), previous.calibrations.filter(c => c.calibrationId !== old.calibrationId));
});
test('tampered preparation/source/witness/planner inputs cannot yield a validated activation plan', () => {
  for (const field of Object.keys(fixture().inputs)) {
    const f = fixture(); f.inputs[field] = Buffer.concat([f.inputs[field], Buffer.from('\n')]);
    assert.throws(() => planMathCompanionActivation(f.inputs));
  }
  for (const mutate of [r => {r.freeze.acceptanceEffects.audioAccepted = true;},
    r => {r.freeze.selectedPages.find(p => !CHANGED_IDS.includes(p.animationId)).title = 'changed';},
    r => {r.freeze.selectedPages.find(p => p.animationId === CHANGED_IDS[0]).presentation.pageInteractionCompanionTargetIdSuffix = 'arbitrary';},
    r => {r.fragment.calibration.entries.find(e => e.key === CHANGED_IDS[1]).module = './modules/other';}]) {
    const f = fixture(); mutate(f.result); f.inputs.freezeBytes = encode(f.result.freeze); f.inputs.fragmentBytes = encode(f.result.fragment);
    assert.throws(() => planMathCompanionActivation(f.inputs));
  }
});
async function activationFixture(t) {
  const f = await temporary(t, {prepared: true}), plan = planMathCompanionActivation(f.inputs);
  const beforeOutputs = expectedScopedRegistryOutputs(parse(f.witnessBytes), {
    bundled: Buffer.from('// test-owned public registry\n'), metadata: Buffer.from('// test-owned public metadata\n')});
  await seed(f.root, Object.entries(GENERATED_OUTPUTS).map(([key, file]) => [file, beforeOutputs[key]]));
  const afterOutputs = expectedScopedRegistryOutputs(plan.nextRegistry, beforeOutputs), calls = {checks: 0, prepares: 0, replaces: []};
  const verifyPrepared = async () => {calls.prepares++; assert.equal(await publishV4Preparation({...f, check: true}), 0);};
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
  const f = await activationFixture(t), before = await snapshot(f.root), result = await executeMathCompanionActivation(f);
  assert.equal(result.changedModuleCount, 2); assert.equal(result.preservedPageCount, 375); assert.equal(result.publicOutputFilesWritten, 0);
  assert.deepEqual(f.calls.replaces, [REGISTRY, GENERATED_OUTPUTS.localOnly, GENERATED_OUTPUTS.localOnlyMetadata]);
  const receipt = parse(await readFile(path.join(f.root, ACTIVATION_RECEIPT)));
  assert.equal(receipt.backups.length, 5); assert.equal(receipt.publicOutputFilesWritten, 0);
  for (const item of receipt.backups) assert.ok((await readFile(path.join(f.root, item.backup.path))).equals(
    item.original.path === REGISTRY ? f.witnessBytes : f.beforeOutputs[Object.entries(GENERATED_OUTPUTS).find(([,p]) => p === item.original.path)[0]]));
  const after = await snapshot(f.root);
  for (const file of [GENERATED_OUTPUTS.bundled, GENERATED_OUTPUTS.metadata]) assert.deepEqual(after.find(r => r.path === file), before.find(r => r.path === file));
  for (let i = 0; i < 2; i++) assert.equal((await checkMathCompanionActivation(f)).writes, 0);
  assert.deepEqual(await snapshot(f.root), after); assert.equal(f.calls.checks, 3);
  await assert.rejects(executeMathCompanionActivation(f), /Live registry must be exact V3 predecessor/);
  assert.deepEqual(await snapshot(f.root), after);
});
test('live drift, forged plan or an existing lock blocks before any transaction writes', async t => {
  for (const kind of ['registry', 'plan', 'lock']) {
    const f = await activationFixture(t);
    if (kind === 'registry') await writeFile(path.join(f.root, REGISTRY), '{}\n');
    if (kind === 'plan') f.plan.changedIds.push('shared-alg001-l11-p033');
    if (kind === 'lock') await seed(f.root, [[ACTIVATION_LOCK, '{}\n', 0o444]]);
    const before = await snapshot(f.root); await assert.rejects(executeMathCompanionActivation(f));
    assert.deepEqual(await snapshot(f.root), before); assert.deepEqual(f.calls.replaces, []);
  }
});
test('interrupted second replacement retains partial V4 registry, all5 originals and lock without automatic rollback', async t => {
  const f = await activationFixture(t), runner = f.replaceFile;
  f.replaceFile = async (from, to) => {if (to.endsWith('registry.local-only.generated.ts')) throw Error('test-only replacement interruption'); await runner(from, to);};
  await assert.rejects(executeMathCompanionActivation(f), /no automatic rollback; lock retained/);
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
    await assert.rejects(executeMathCompanionActivation(f), /Concurrent\/output drift/);
    assert.ok((await readFile(path.join(f.root, target))).equals(canary));
    assert.deepEqual(f.calls.replaces, [REGISTRY]); const failed = await failure(f); assert.equal(failed.rollbackAttempted, false);
  }
});
test('postflight checker or input drift leaves no success receipt and never rolls back', async t => {
  for (const kind of ['checker', 'input']) {
    const f = await activationFixture(t), check = f.checkGenerator;
    f.checkGenerator = async () => {await check(); if (kind === 'checker') throw Error('test-only generator mismatch');
      await writeFile(path.join(f.root, 'scripts/plan-g678-alg-l11-math-companion-registration.mjs'), '// changed input\n');};
    await assert.rejects(executeMathCompanionActivation(f));
    const failed = await failure(f); assert.equal(failed.phase, 'postflight'); assert.equal(failed.rollbackAttempted, false);
    assert.deepEqual(failed.completedReplacements, [REGISTRY, GENERATED_OUTPUTS.localOnly, GENERATED_OUTPUTS.localOnlyMetadata]);
  }
});
test('missing receipt and changed activated output are rejected by write-free checks', async t => {
  const f = await activationFixture(t), initial = await snapshot(f.root);
  await assert.rejects(checkMathCompanionActivation(f), {code: 'ENOENT'}); assert.deepEqual(await snapshot(f.root), initial);
  await executeMathCompanionActivation(f); await writeFile(path.join(f.root, GENERATED_OUTPUTS.localOnlyMetadata), '// changed\n');
  const drifted = await snapshot(f.root); await assert.rejects(checkMathCompanionActivation(f), /Concurrent\/output drift/);
  assert.deepEqual(await snapshot(f.root), drifted);
});
test('symlinked recovery root is rejected without writing outside the permitted new root', async t => {
  const f = await activationFixture(t), canary = path.join(f.root, 'outside-canary'); await mkdir(canary);
  await symlink(canary, path.join(f.root, 'work'));
  const before = await snapshot(f.root); await assert.rejects(executeMathCompanionActivation(f), /must not traverse symlinks/);
  assert.deepEqual(await readdir(canary), []); assert.deepEqual(await snapshot(f.root), before); assert.deepEqual(f.calls.replaces, []);
});
