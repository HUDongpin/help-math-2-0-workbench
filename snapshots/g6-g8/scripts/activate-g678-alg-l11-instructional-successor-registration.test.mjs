import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {link, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {composeInstructionalSuccessor, OUTPUT_FREEZE, OUTPUT_FRAGMENT, PREDECESSOR_REGISTRY_WITNESS, SUCCESSOR_IDS}
  from './prepare-g678-alg-l11-instructional-successor-registration.mjs';
import {planInstructionalActivation, expectedScopedRegistryOutputs, executeScopedRegistrationActivation,
  checkScopedRegistrationActivation, readBoundActivationFile, REGISTRY, GENERATED_OUTPUTS, ACTIVATION_RECEIPT, RECOVERY_ROOT}
  from './activate-g678-alg-l11-instructional-successor-registration.mjs';

const OLD_FREEZE = 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v1.json';
const OLD_FRAGMENT = 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v1.fragment.json';
const SOURCE_FRAGMENT = 'catalog/product-bridge-calibrations/g678-alg-l11-instructional-successor-current-js-v1.fragment.json';
const read = file => readFileSync(new URL(`../${file}`, import.meta.url));
const parse = value => JSON.parse(value.toString('utf8'));
const encode = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const hash = value => createHash('sha256').update(value).digest('hex');
const bind = (file, buffer) => ({path: file, bytes: buffer.length, sha256: hash(buffer)});

function fixture() {
  const witnessBytes = read(existsSync(new URL(`../${PREDECESSOR_REGISTRY_WITNESS}`, import.meta.url))
    ? PREDECESSOR_REGISTRY_WITNESS : REGISTRY);
  assert.equal(hash(witnessBytes), 'bdae8f916495a80d13dd1e02282c21f6de25a8f45247ddb1207b410fc68b9212');
  const priorFreezeBytes = read(OLD_FREEZE), priorFragmentBytes = read(OLD_FRAGMENT), sourceFragmentBytes = read(SOURCE_FRAGMENT);
  const proposed = composeInstructionalSuccessor({priorFreeze: parse(priorFreezeBytes), priorFragment: parse(priorFragmentBytes),
    priorRegistry: parse(witnessBytes), sourceFragment: parse(sourceFragmentBytes), glossaryByAnimationId: {},
    bindings: {priorFreeze: bind(OLD_FREEZE, priorFreezeBytes), priorFragment: bind(OLD_FRAGMENT, priorFragmentBytes),
      priorRegistry: bind(PREDECESSOR_REGISTRY_WITNESS, witnessBytes), sourceFragment: bind(SOURCE_FRAGMENT, sourceFragmentBytes),
      glossary: bind('test-only/glossary.json', encode({fixture: true})),
      preparer: bind('test-only/preparer.mjs', Buffer.from('// fixture\n'))}});
  return {witnessBytes, priorFreezeBytes, freezeBytes: proposed.freezeBytes, fragmentBytes: proposed.fragmentBytes};
}

function mutateFixture(input, mutate) {
  const freeze = parse(input.freezeBytes), fragment = parse(input.fragmentBytes);
  mutate({freeze, fragment});
  const freezeBytes = encode(freeze);
  fragment.freeze = bind(OUTPUT_FREEZE, freezeBytes);
  fragment.calibration.freezeManifestBytes = freezeBytes.length;
  fragment.calibration.freezeManifestSha256 = hash(freezeBytes);
  return {...input, freezeBytes, fragmentBytes: encode(fragment)};
}

test('pure activation plan changes exactly23 modules;354 entries and other calibrations are preserved', () => {
  const inputs = fixture(), before = Object.fromEntries(Object.entries(inputs).map(([key, bytes]) => [key, Buffer.from(bytes)])),
    plan = planInstructionalActivation(inputs);
  assert.deepEqual(inputs, before);
  assert.deepEqual(plan.changedIds, SUCCESSOR_IDS);
  assert.equal(plan.preservedIds.length, 354);
  const previous = parse(inputs.witnessBytes);
  assert.deepEqual(plan.nextRegistry.calibrations.slice(0, -1), previous.calibrations.slice(0, -1));
  const calibration = plan.nextRegistry.calibrations.at(-1);
  assert.equal(calibration.entries.length, 377);
  assert.equal(calibration.entries.filter((e, i) => e.module !== previous.calibrations.at(-1).entries[i].module).length, 23);
  assert.equal(parse(inputs.freezeBytes).productCalibrationPassed, false);
});

test('scope proof rejects extra membership, unchanged selected module, unrelated artifact, page and acceptance drift', () => {
  const mutations = [
    ({fragment}) => fragment.calibration.entries.pop(),
    ({fragment}) => fragment.calibration.entries.reverse(),
    ({fragment}) => {fragment.calibration.entries.find(e => e.key === SUCCESSOR_IDS[0]).module = './modules/wrong-p006';},
    ({fragment}) => {fragment.calibration.entries.find(e => !SUCCESSOR_IDS.includes(e.key)).artifacts.module.sha256 = '0'.repeat(64);},
    ({freeze}) => {freeze.selectedPages.find(p => !SUCCESSOR_IDS.includes(p.animationId)).title = 'unexpected';},
    ({fragment}) => {fragment.calibration.entries.find(e => e.key === SUCCESSOR_IDS[0]).maturity = 'strict-complete';},
    ({fragment}) => {fragment.calibration.extraAuthority = true;},
    ({freeze}) => {freeze.acceptanceEffects.audioAccepted = true;},
    ({freeze}) => {freeze.selectedPages.find(p => p.animationId === SUCCESSOR_IDS[0]).engineeringPreviewReady = true;},
    ({fragment}) => {fragment.productCalibrationPassed = true;},
    ({fragment}) => {fragment.predecessorRegistry.sha256 = '0'.repeat(64);},
  ];
  for (const mutate of mutations) assert.throws(() => planInstructionalActivation(mutateFixture(fixture(), mutate)));
});

test('prepared freeze and fragment byte identities are mandatory', () => {
  for (const key of ['freezeBytes', 'fragmentBytes', 'witnessBytes']) {
    const inputs = fixture();
    if (key === 'fragmentBytes') {
      const fragment = parse(inputs.fragmentBytes); fragment.freeze.sha256 = 'f'.repeat(64); inputs[key] = encode(fragment);
    } else inputs[key] = Buffer.concat([inputs[key], Buffer.from('\n')]);
    assert.throws(() => planInstructionalActivation(inputs));
  }
});

async function tempFixture(t) {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'helpmath-activation-test-')));
  t.after(() => rm(root, {recursive: true, force: true}));
  const inputs = fixture(), plan = planInstructionalActivation(inputs);
  const beforeOutputs = expectedScopedRegistryOutputs(parse(inputs.witnessBytes),
    {bundled: Buffer.from('// public runtime fixture\n'), metadata: Buffer.from('// public metadata fixture\n')});
  const files = new Map([[REGISTRY, inputs.witnessBytes], [PREDECESSOR_REGISTRY_WITNESS, inputs.witnessBytes],
    [OLD_FREEZE, inputs.priorFreezeBytes], [OUTPUT_FREEZE, inputs.freezeBytes], [OUTPUT_FRAGMENT, inputs.fragmentBytes],
    ...Object.entries(GENERATED_OUTPUTS).map(([key, file]) => [file, beforeOutputs[key]])]);
  for (const [file, bytes] of files) {
    await mkdir(path.dirname(path.join(root, file)), {recursive: true});
    await writeFile(path.join(root, file), bytes, {flag: 'wx'});
  }
  const inputBindings = plan.preparedBindings;
  const afterOutputs = expectedScopedRegistryOutputs(plan.nextRegistry, beforeOutputs);
  const calls = {writes: 0, checks: 0, prepares: 0};
  const runGenerator = async ({check}) => {
    if (check) {
      calls.checks++;
      for (const [key, file] of Object.entries(GENERATED_OUTPUTS))
        assert.deepEqual(await readFile(path.join(root, file)), afterOutputs[key]);
    } else {
      calls.writes++;
      for (const [key, file] of Object.entries(GENERATED_OUTPUTS))
        await writeFile(path.join(root, file), afterOutputs[key]);
    }
    return {command: 'isolated-test-fixture-generator', exitCode: 0, check};
  };
  const verifyPrepared = async () => {calls.prepares++;};
  return {root, plan, beforeOutputs, inputBindings, runGenerator, verifyPrepared, afterOutputs, calls};
}

async function fileSnapshot(root, prefix = '') {
  const rows = [];
  for (const entry of await readdir(path.join(root, prefix), {withFileTypes: true})) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) rows.push(...await fileSnapshot(root, relative));
    else {
      const stat = await lstat(path.join(root, relative), {bigint: true});
      rows.push({path: relative, sha256: hash(await readFile(path.join(root, relative))),
        ino: String(stat.ino), mode: String(stat.mode), mtimeNs: String(stat.mtimeNs)});
    }
  }
  return rows.sort((a, b) => a.path.localeCompare(b.path));
}

test('isolated transaction retains5 before copies, changes only private output bytes, then checks twice without writes', async t => {
  const f = await tempFixture(t), result = await executeScopedRegistrationActivation(f);
  assert.equal(result.activated, true); assert.equal(result.registrationCount, 377);
  assert.equal(result.publicOutputBytesUnchanged, true); assert.equal(result.privateOutputChangedCount, 2);
  assert.deepEqual(await readFile(path.join(f.root, REGISTRY)), f.plan.nextRegistryBytes);
  const receipt = parse(await readFile(path.join(f.root, ACTIVATION_RECEIPT)));
  assert.equal(receipt.backups.length, 5);
  assert.ok(Object.values(receipt.acceptanceEffects).every(value => value === false));
  for (const item of receipt.backups) {
    const bytes = await readFile(path.join(f.root, item.backup.path));
    assert.equal(hash(bytes), item.original.sha256);
  }
  const beforeCheck = await fileSnapshot(f.root);
  for (let n = 0; n < 2; n++) {
    const checked = await checkScopedRegistrationActivation(f);
    assert.equal(checked.writes, 0); assert.equal(checked.check, true);
  }
  assert.deepEqual(await fileSnapshot(f.root), beforeCheck);
  assert.equal(f.calls.writes, 1); assert.equal(f.calls.checks, 3);
  await assert.rejects(executeScopedRegistrationActivation(f), /exact old377 witness/);
  assert.deepEqual(await fileSnapshot(f.root), beforeCheck, 'Repeat --write must not create another transaction');
});

test('live predecessor byte drift fails before backups, generation or registration writes', async t => {
  const f = await tempFixture(t);
  await writeFile(path.join(f.root, REGISTRY), Buffer.concat([f.plan.witnessBytes, Buffer.from('\n')]));
  const before = await fileSnapshot(f.root);
  await assert.rejects(executeScopedRegistrationActivation(f), /exact old377 witness/);
  assert.deepEqual(await fileSnapshot(f.root), before); assert.equal(f.calls.writes, 0);
});

test('generator failure retains exact old registry and generated backups; leaves explicit partial-state evidence', async t => {
  const f = await tempFixture(t);
  f.runGenerator = async () => {
    await writeFile(path.join(f.root, GENERATED_OUTPUTS.localOnly), f.afterOutputs.localOnly);
    throw new Error('test-only interrupted maintained generation');
  };
  await assert.rejects(executeScopedRegistrationActivation(f), /registryReplaced=true; no automatic rollback/);
  await assert.rejects(lstat(path.join(f.root, ACTIVATION_RECEIPT)), {code: 'ENOENT'});
  const [run] = await readdir(path.join(f.root, RECOVERY_ROOT));
  const failure = parse(await readFile(path.join(f.root, RECOVERY_ROOT, run, 'failure.json')));
  assert.equal(failure.phase, 'maintained-generator'); assert.equal(failure.registryReplaced, true);
  assert.equal(failure.rollbackAttempted, false); assert.equal(failure.backups.length, 5);
  assert.deepEqual(await readFile(path.join(f.root, failure.backups[0].backup.path)), f.plan.witnessBytes);
  assert.deepEqual(await readFile(path.join(f.root, REGISTRY)), f.plan.nextRegistryBytes);
  assert.deepEqual(await readFile(path.join(f.root, GENERATED_OUTPUTS.localOnlyMetadata)), f.beforeOutputs.localOnlyMetadata);
});

test('public output drift cannot produce a success receipt', async t => {
  const f = await tempFixture(t), originalRunner = f.runGenerator;
  f.runGenerator = async opts => {
    const result = await originalRunner(opts);
    await writeFile(path.join(f.root, GENERATED_OUTPUTS.bundled), '// unexpected public mutation\n');
    return result;
  };
  await assert.rejects(executeScopedRegistrationActivation(f), /Generated output differs/);
  await assert.rejects(lstat(path.join(f.root, ACTIVATION_RECEIPT)), {code: 'ENOENT'});
});

test('input drift during postflight generator check is detected and retained as failure evidence', async t => {
  const f = await tempFixture(t), originalRunner = f.runGenerator;
  f.runGenerator = async opts => {
    const result = await originalRunner(opts);
    if (opts.check) await writeFile(path.join(f.root, OUTPUT_FRAGMENT), '{}\n');
    return result;
  };
  await assert.rejects(executeScopedRegistrationActivation(f), /Activation binding drift/);
  await assert.rejects(lstat(path.join(f.root, ACTIVATION_RECEIPT)), {code: 'ENOENT'});
});

test('checks reject missing activation receipt or post-activation registry drift without writing', async t => {
  const f = await tempFixture(t), before = await fileSnapshot(f.root);
  await assert.rejects(checkScopedRegistrationActivation(f), {code: 'ENOENT'});
  assert.deepEqual(await fileSnapshot(f.root), before);
  await executeScopedRegistrationActivation(f);
  await writeFile(path.join(f.root, REGISTRY), f.plan.witnessBytes);
  const drifted = await fileSnapshot(f.root);
  await assert.rejects(checkScopedRegistrationActivation(f), /Activated registry drift/);
  assert.deepEqual(await fileSnapshot(f.root), drifted);
});

test('binding reader rejects symlinks, multiple links and path escapes', async t => {
  const f = await tempFixture(t);
  await symlink(path.join(f.root, REGISTRY), path.join(f.root, 'test-symlink'));
  await assert.rejects(readBoundActivationFile(f.root, 'test-symlink'), /canonical and single-link/);
  await link(path.join(f.root, REGISTRY), path.join(f.root, 'test-hardlink'));
  await assert.rejects(readBoundActivationFile(f.root, REGISTRY), /canonical and single-link/);
  await assert.rejects(readBoundActivationFile(f.root, '../outside'), /Non-canonical/);
});

test('recovery ancestor symlink is rejected before creating any directories through it', async t => {
  const f = await tempFixture(t), outside = path.join(f.root, 'outside-recovery-canary');
  await mkdir(outside);
  await symlink(outside, path.join(f.root, 'work'));
  await assert.rejects(executeScopedRegistrationActivation(f), /must not traverse symlinks/);
  assert.deepEqual(await readdir(outside), []);
  assert.ok((await readFile(path.join(f.root, REGISTRY))).equals(f.plan.witnessBytes));
  assert.equal(f.calls.writes, 0);
});
