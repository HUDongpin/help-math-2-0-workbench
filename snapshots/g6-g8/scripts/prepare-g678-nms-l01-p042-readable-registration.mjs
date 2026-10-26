#!/usr/bin/env node
// 378 preparation only. The live registry and generated registry files are never written.
import assert from 'node:assert/strict';
import {lstat, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT, REGISTRY, encode, binding, descriptor} from './prepare-g678-alg-l11-feedback-host-score-registration.mjs';
import {readBoundActivationFile} from './activate-g678-alg-l11-feedback-host-score-registration.mjs';
import {PRIOR, SOURCE_AUTHORITY, LIVE_PREDECESSOR_REGISTRY, PREDECESSOR_REGISTRY_WITNESS,
  PROPOSED_FREEZE, PROPOSED_FRAGMENT, CATALOG, SOURCE_RUN, composeP042ReadableRegistration, readP042ReadableRegistration}
  from './plan-g678-nms-l01-p042-readable-registration.mjs';
export {ROOT, REGISTRY, PRIOR, SOURCE_AUTHORITY, LIVE_PREDECESSOR_REGISTRY, PREDECESSOR_REGISTRY_WITNESS,
  PROPOSED_FREEZE, PROPOSED_FRAGMENT, encode, binding, descriptor};
export const PLANNER = 'scripts/plan-g678-nms-l01-p042-readable-registration.mjs';
export const CHANGED_IDS = Object.freeze(['shared-nms002-l01-p042']);

export async function assertAbsent378File(root, file) {
  assert.ok([PREDECESSOR_REGISTRY_WITNESS, PROPOSED_FREEZE, PROPOSED_FRAGMENT].includes(file));
  const full = path.join(root, file);
  assert.equal(await realpath(path.dirname(full)), path.dirname(full), 'Preparation parent must be canonical');
  await assert.rejects(lstat(full), {code: 'ENOENT'}, `Exclusive 378 output exists: ${file}`);
}

// Physical inputs are re-read even for temporary-root tests; callers cannot
// publish an arbitrary object by supplying a forged result or planner digest.
export async function read378Composition(root, witnessBytes) {
  assert.deepEqual(binding(PRIOR.registry.path, witnessBytes), PRIOR.registry);
  const inputs = await Promise.all([PRIOR.freeze, PRIOR.fragment, SOURCE_AUTHORITY, CATALOG, PRIOR.activation, SOURCE_RUN].map(expected =>
    readBoundActivationFile(root, expected.path, expected)));
  const planner = await readBoundActivationFile(root, PLANNER);
  const result = composeP042ReadableRegistration({priorFreeze: JSON.parse(inputs[0].buffer),
    priorFragment: JSON.parse(inputs[1].buffer), priorRegistry: JSON.parse(witnessBytes),
    source: JSON.parse(inputs[2].buffer), pagesCatalog: JSON.parse(inputs[3].buffer), plannerBinding: descriptor(planner)});
  return {result, inputs: [...inputs, planner]};
}

export async function publish378Preparation({root = ROOT, witnessBytes, result, check = false}) {
  const physical = await read378Composition(root, witnessBytes);
  assert.ok(physical.result.freezeBytes.equals(result.freezeBytes), '378 freeze differs from exact physical composition');
  assert.ok(physical.result.fragmentBytes.equals(result.fragmentBytes), '378 fragment differs from exact physical composition');
  assert.ok(physical.result.nextRegistryBytes.equals(result.nextRegistryBytes), '378 registry differs from exact physical composition');
  let witnessExists = true;
  try {
    const witness = await readBoundActivationFile(root, PRIOR.registry.path, PRIOR.registry);
    assert.equal(witness.mode & 0o222, 0, 'V4 registry witness must be read-only');
  } catch (error) {
    if (error.code !== 'ENOENT' || check) throw error;
    witnessExists = false;
  }
  const outputs = [[PROPOSED_FREEZE, result.freezeBytes], [PROPOSED_FRAGMENT, result.fragmentBytes]];
  if (check) {
    for (const [file, bytes] of outputs) {
      const observed = await readBoundActivationFile(root, file);
      assert.equal(observed.mode & 0o222, 0, 'Prepared 378 output must be read-only');
      assert.ok(observed.buffer.equals(bytes), `Prepared 378 drift: ${file}`);
    }
    return 0;
  }
  for (const [file] of outputs) await assertAbsent378File(root, file);
  if (!witnessExists) await assertAbsent378File(root, PRIOR.registry.path);
  const live = await readBoundActivationFile(root, REGISTRY, LIVE_PREDECESSOR_REGISTRY);
  for (const input of physical.inputs) await readBoundActivationFile(root, input.path, descriptor(input));
  if (!witnessExists) await writeFile(path.join(root, PRIOR.registry.path), witnessBytes, {flag: 'wx', mode: 0o444});
  for (const [file, bytes] of outputs) {
    for (const input of physical.inputs) await readBoundActivationFile(root, input.path, descriptor(input));
    assert.ok((await readFile(path.join(root, REGISTRY))).equals(live.buffer), 'Concurrent registry drift during preparation');
    await writeFile(path.join(root, file), bytes, {flag: 'wx', mode: 0o444});
  }
  assert.ok((await readFile(path.join(root, REGISTRY))).equals(live.buffer), 'Preparation never updates registry');
  for (const input of physical.inputs) await readBoundActivationFile(root, input.path, descriptor(input));
  return witnessExists ? 2 : 3;
}

export async function prepareP042ReadableRegistration({write = false, check = false} = {}) {
  assert.ok(typeof write === 'boolean' && typeof check === 'boolean' && !(write && check));
  const loaded = await readP042ReadableRegistration({requireWitness: check});
  const {result, witness, before} = loaded;
  if (write) assert.deepEqual(descriptor(before), LIVE_PREDECESSOR_REGISTRY);
  const preparationFilesWritten = write || check
    ? await publish378Preparation({witnessBytes: witness.buffer, result, check}) : 0;
  assert.ok((await readFile(path.join(ROOT, REGISTRY))).equals(before.buffer), 'Concurrent registry drift');
  return {mode: write ? 'write' : check ? 'check' : 'plan', preparationFilesWritten, registryChanged: false,
    activationExecuted: false, freeze: binding(PROPOSED_FREEZE, result.freezeBytes),
    fragment: binding(PROPOSED_FRAGMENT, result.fragmentBytes), proposedRegistry: binding(REGISTRY, result.nextRegistryBytes),
    witness: PRIOR.registry, addedModuleCount: 1, preservedPageCount: 377, registrationCountAfterActivation: 378,
    descriptorSlotActivationPending: true, productCalibrationPassed: false, sourceAudioIntegrated: false};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  assert.ok(args.length <= 1 && (!args.length || ['--plan', '--write', '--check'].includes(args[0])));
  prepareP042ReadableRegistration({write: args[0] === '--write', check: args[0] === '--check'})
    .then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {console.error(error); process.exitCode = 1;});
}

