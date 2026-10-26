import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {ROOT, PREDECESSOR_REGISTRY_WITNESS, PREDECESSOR_FREEZE, PREDECESSOR_FRAGMENT, COMPOSITE,
  OUTPUT_FREEZE, OUTPUT_FRAGMENT, CHANGED_IDS, encode, binding, composeFeedbackHostScoreRegistration}
  from './prepare-g678-alg-l11-feedback-host-score-registration.mjs';
import {REGISTRY, GENERATED_OUTPUTS, ACTIVATION_RECEIPT, RECOVERY_ROOT, planFeedbackHostScoreActivation,
  expectedScopedRegistryOutputs, executeScopedFeedbackHostScoreActivation, checkScopedFeedbackHostScoreActivation}
  from './activate-g678-alg-l11-feedback-host-score-registration.mjs';
const read = file => readFileSync(path.join(ROOT, file));
const parse = bytes => JSON.parse(bytes.toString('utf8'));
function fixture() {
  const witnessBytes = read(existsSync(path.join(ROOT, PREDECESSOR_REGISTRY_WITNESS)) ? PREDECESSOR_REGISTRY_WITNESS : REGISTRY);
  const priorFreezeBytes = read(PREDECESSOR_FREEZE.path), priorFragmentBytes = read(PREDECESSOR_FRAGMENT.path), compositeBytes = read(COMPOSITE.path);
  const result = composeFeedbackHostScoreRegistration({priorFreeze: parse(priorFreezeBytes), priorFragment: parse(priorFragmentBytes),
    priorRegistry: parse(witnessBytes), composite: parse(compositeBytes),
    preparerBinding: binding('scripts/prepare-g678-alg-l11-feedback-host-score-registration.mjs', read('scripts/prepare-g678-alg-l11-feedback-host-score-registration.mjs'))});
  return {witnessBytes, priorFreezeBytes, priorFragmentBytes, compositeBytes, freezeBytes: result.freezeBytes, fragmentBytes: result.fragmentBytes};
}
test('activation planner proves exactly2/375 and recomputes the entire prepared pair from pinned v2 inputs', () => {
  const inputs = fixture(), plan = planFeedbackHostScoreActivation(inputs);
  assert.deepEqual(plan.changedIds, CHANGED_IDS); assert.equal(plan.preservedIds.length, 375);
  const old = parse(inputs.witnessBytes), next = plan.nextRegistry;
  assert.deepEqual(next.calibrations.slice(0, -1), old.calibrations.slice(0, -1));
  assert.equal(next.calibrations.at(-1).entries.length, 377);
  assert.equal(next.calibrations.at(-1).freezeManifest, OUTPUT_FREEZE);
  assert.ok(Object.values(parse(inputs.freezeBytes).acceptanceEffects).every(value => value === false));
});
test('forged prepared page/artifact/acceptance changes and stale source or witness are rejected', () => {
  for (const mutate of [
    ({freeze}) => {freeze.selectedPages.find(p => !CHANGED_IDS.includes(p.animationId)).title = 'unexpected';},
    ({freeze}) => {freeze.selectedPages.find(p => p.animationId === CHANGED_IDS[0]).runtime.lessonHostCapabilities.push('audio');},
    ({freeze}) => {freeze.acceptanceEffects.audioAccepted = true;},
    ({fragment}) => {fragment.calibration.entries.find(e => !CHANGED_IDS.includes(e.key)).artifacts.module.sha256 = '0'.repeat(64);},
    ({fragment}) => {fragment.calibration.entries.find(e => e.key === CHANGED_IDS[1]).module = './modules/wrong-p044';},
    ({fragment}) => {fragment.changedModuleCount = 3;},
  ]) {
    const input = fixture(), freeze = parse(input.freezeBytes), fragment = parse(input.fragmentBytes);
    mutate({freeze, fragment}); input.freezeBytes = encode(freeze); fragment.freeze = binding(OUTPUT_FREEZE, input.freezeBytes);
    fragment.calibration.freezeManifestBytes = input.freezeBytes.length;
    fragment.calibration.freezeManifestSha256 = fragment.freeze.sha256; input.fragmentBytes = encode(fragment);
    assert.throws(() => planFeedbackHostScoreActivation(input));
  }
  for (const field of ['witnessBytes', 'priorFreezeBytes', 'priorFragmentBytes', 'compositeBytes']) {
    const input = fixture(); const value = parse(input[field]); value.unexpected = true; input[field] = encode(value);
    assert.throws(() => planFeedbackHostScoreActivation(input));
  }
});
async function temporary(t) {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'helpmath-v3-activation-test-')));
  t.after(() => rm(root, {recursive: true, force: true}));
  const inputs = fixture(), plan = planFeedbackHostScoreActivation(inputs);
  const beforeOutputs = expectedScopedRegistryOutputs(parse(inputs.witnessBytes),
    {bundled: Buffer.from('// public fixture\n'), metadata: Buffer.from('// public metadata fixture\n')});
  const files = new Map([[REGISTRY, inputs.witnessBytes], [PREDECESSOR_REGISTRY_WITNESS, inputs.witnessBytes],
    [PREDECESSOR_FREEZE.path, inputs.priorFreezeBytes], [PREDECESSOR_FRAGMENT.path, inputs.priorFragmentBytes],
    [COMPOSITE.path, inputs.compositeBytes], [OUTPUT_FREEZE, inputs.freezeBytes], [OUTPUT_FRAGMENT, inputs.fragmentBytes],
    ...Object.entries(GENERATED_OUTPUTS).map(([key, file]) => [file, beforeOutputs[key]])]);
  for (const [file, bytes] of files) {await mkdir(path.dirname(path.join(root, file)), {recursive: true}); await writeFile(path.join(root, file), bytes, {flag: 'wx'});}
  const afterOutputs = expectedScopedRegistryOutputs(plan.nextRegistry, beforeOutputs), calls = {writes: 0, checks: 0, prepares: 0};
  const runGenerator = async ({check}) => {
    if (check) {
      calls.checks++;
      for (const [key, file] of Object.entries(GENERATED_OUTPUTS)) assert.ok((await readFile(path.join(root, file))).equals(afterOutputs[key]));
    } else {
      calls.writes++;
      for (const [key, file] of Object.entries(GENERATED_OUTPUTS)) await writeFile(path.join(root, file), afterOutputs[key]);
    }
    return {command: 'isolated-fixture-generator', check, exitCode: 0};
  };
  const verifyPrepared = async () => {calls.prepares++;};
  return {root, plan, beforeOutputs, inputBindings: plan.preparedBindings, runGenerator, verifyPrepared, afterOutputs, calls};
}
async function snapshot(root, prefix = '') {
  const rows = [];
  for (const entry of await readdir(path.join(root, prefix), {withFileTypes: true})) {
    const file = path.join(prefix, entry.name);
    if (entry.isDirectory()) rows.push(...await snapshot(root, file));
    else {const stat = await lstat(path.join(root, file), {bigint: true}); rows.push({...binding(file, await readFile(path.join(root, file))),
      ino: String(stat.ino), mode: String(stat.mode), mtimeNs: String(stat.mtimeNs)});}
  } return rows.sort((a, b) => a.path.localeCompare(b.path));
}
test('isolated v3 transaction keeps5 recovery originals and checks twice without writes; public2 unchanged/private2 changed', async t => {
  const f = await temporary(t), result = await executeScopedFeedbackHostScoreActivation(f);
  assert.equal(result.changedModuleCount, 2); assert.equal(result.preservedPageCount, 375); assert.equal(result.registrationCount, 377);
  assert.equal(result.publicOutputBytesUnchanged, true); assert.equal(result.privateOutputChangedCount, 2);
  const receipt = parse(await readFile(path.join(f.root, ACTIVATION_RECEIPT)));
  assert.equal(receipt.backups.length, 5); assert.deepEqual(receipt.changedModuleIds, CHANGED_IDS);
  for (const item of receipt.backups) assert.deepEqual(binding(item.original.path, await readFile(path.join(f.root, item.backup.path))), item.original);
  const before = await snapshot(f.root);
  for (let i = 0; i < 2; i++) {const checked = await checkScopedFeedbackHostScoreActivation(f); assert.equal(checked.writes, 0); assert.equal(checked.check, true);}
  assert.deepEqual(await snapshot(f.root), before); assert.equal(f.calls.writes, 1); assert.equal(f.calls.checks, 3);
  await assert.rejects(executeScopedFeedbackHostScoreActivation(f), /exact v2 377 witness/);
  assert.deepEqual(await snapshot(f.root), before);
});
test('live v2 drift blocks before recovery or generation writes', async t => {
  const f = await temporary(t); await writeFile(path.join(f.root, REGISTRY), Buffer.concat([f.plan.witnessBytes, Buffer.from('\n')]));
  const before = await snapshot(f.root);
  await assert.rejects(executeScopedFeedbackHostScoreActivation(f), /exact v2 377 witness/);
  assert.deepEqual(await snapshot(f.root), before); assert.equal(f.calls.writes, 0);
});
test('generator interruption retains partial state plus all originals and does not auto-rollback', async t => {
  const f = await temporary(t); f.runGenerator = async () => {
    await writeFile(path.join(f.root, GENERATED_OUTPUTS.localOnly), f.afterOutputs.localOnly);
    throw new Error('test-only generation interrupted');
  };
  await assert.rejects(executeScopedFeedbackHostScoreActivation(f), /registryReplaced=true; no automatic rollback/);
  await assert.rejects(lstat(path.join(f.root, ACTIVATION_RECEIPT)), {code: 'ENOENT'});
  const [dir] = await readdir(path.join(f.root, RECOVERY_ROOT));
  const failure = parse(await readFile(path.join(f.root, RECOVERY_ROOT, dir, 'failure.json')));
  assert.equal(failure.phase, 'maintained-generator'); assert.equal(failure.registryReplaced, true); assert.equal(failure.rollbackAttempted, false);
  assert.equal(failure.backups.length, 5);
  assert.ok((await readFile(path.join(f.root, failure.backups[0].backup.path))).equals(f.plan.witnessBytes));
  assert.ok((await readFile(path.join(f.root, REGISTRY))).equals(f.plan.nextRegistryBytes));
  assert.ok((await readFile(path.join(f.root, GENERATED_OUTPUTS.localOnlyMetadata))).equals(f.beforeOutputs.localOnlyMetadata));
});
test('public output drift cannot produce a success receipt', async t => {
  const f = await temporary(t), runner = f.runGenerator; f.runGenerator = async opts => {
    const result = await runner(opts); await writeFile(path.join(f.root, GENERATED_OUTPUTS.bundled), '// unexpected\n'); return result;
  };
  await assert.rejects(executeScopedFeedbackHostScoreActivation(f), /Generated output differs/);
  await assert.rejects(lstat(path.join(f.root, ACTIVATION_RECEIPT)), {code: 'ENOENT'});
});
test('postflight input drift is recorded as failure, including drift inside final generator check', async t => {
  const f = await temporary(t), runner = f.runGenerator; f.runGenerator = async opts => {
    const result = await runner(opts); if (opts.check) await writeFile(path.join(f.root, OUTPUT_FRAGMENT), '{}\n'); return result;
  };
  await assert.rejects(executeScopedFeedbackHostScoreActivation(f), /Activation binding drift/);
  await assert.rejects(lstat(path.join(f.root, ACTIVATION_RECEIPT)), {code: 'ENOENT'});
});
test('checks fail read-only without a receipt or after activated registry drift', async t => {
  const f = await temporary(t), before = await snapshot(f.root);
  await assert.rejects(checkScopedFeedbackHostScoreActivation(f), {code: 'ENOENT'});
  assert.deepEqual(await snapshot(f.root), before);
  await executeScopedFeedbackHostScoreActivation(f); await writeFile(path.join(f.root, REGISTRY), f.plan.witnessBytes);
  const drifted = await snapshot(f.root); await assert.rejects(checkScopedFeedbackHostScoreActivation(f), /Activated registry drift/);
  assert.deepEqual(await snapshot(f.root), drifted);
});
test('recovery symlink is rejected before directory creation outside the intended recovery root', async t => {
  const f = await temporary(t), canary = path.join(f.root, 'outside-canary'); await mkdir(canary);
  // The composite input already has work-independent files; recovery work is absent.
  await symlink(canary, path.join(f.root, 'work'));
  await assert.rejects(executeScopedFeedbackHostScoreActivation(f), /must not traverse symlinks/);
  assert.deepEqual(await readdir(canary), []); assert.equal(f.calls.writes, 0);
  assert.ok((await readFile(path.join(f.root, REGISTRY))).equals(f.plan.witnessBytes));
});
