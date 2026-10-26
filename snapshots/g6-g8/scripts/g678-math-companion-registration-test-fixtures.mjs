import {existsSync, readFileSync} from 'node:fs';
import {lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {ROOT, REGISTRY, PRIOR, COMPANION, PLANNER, PROPOSED_FREEZE, PROPOSED_FRAGMENT, encode, binding}
  from './prepare-g678-alg-l11-math-companion-registration.mjs';
import {composeMathCompanionRegistration} from './plan-g678-alg-l11-math-companion-registration.mjs';
export const read = file => readFileSync(path.join(ROOT, file));
export const parse = bytes => JSON.parse(bytes.toString('utf8'));
export function fixture() {
  const inputs = {witnessBytes: read(existsSync(path.join(ROOT, PRIOR.registry.path)) ? PRIOR.registry.path : REGISTRY),
    priorFreezeBytes: read(PRIOR.freeze.path), priorFragmentBytes: read(PRIOR.fragment.path),
    companionBytes: read(COMPANION.path), plannerBytes: read(PLANNER)};
  const result = composeMathCompanionRegistration({priorFreeze: parse(inputs.priorFreezeBytes), priorFragment: parse(inputs.priorFragmentBytes),
    priorRegistry: parse(inputs.witnessBytes), companion: parse(inputs.companionBytes), plannerBinding: binding(PLANNER, inputs.plannerBytes)});
  return {inputs: {...inputs, freezeBytes: result.freezeBytes, fragmentBytes: result.fragmentBytes}, result, witnessBytes: inputs.witnessBytes};
}
export async function seed(root, files) {
  for (const [file, bytes, mode = 0o644] of files) {
    await mkdir(path.dirname(path.join(root, file)), {recursive: true});
    await writeFile(path.join(root, file), bytes, {flag: 'wx', mode});
  }
}
export async function temporary(t, {prepared = false} = {}) {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'helpmath-v4-registration-test-')));
  t.after(() => rm(root, {recursive: true, force: true}));
  const f = fixture(), i = f.inputs;
  await seed(root, [[REGISTRY, i.witnessBytes], [PRIOR.freeze.path, i.priorFreezeBytes], [PRIOR.fragment.path, i.priorFragmentBytes],
    [COMPANION.path, i.companionBytes], [PLANNER, i.plannerBytes], ...(prepared ? [[PRIOR.registry.path, i.witnessBytes, 0o444],
      [PROPOSED_FREEZE, i.freezeBytes, 0o444], [PROPOSED_FRAGMENT, i.fragmentBytes, 0o444]] : [])]);
  return {root, ...f};
}
export async function snapshot(root, prefix = '') {
  const rows = [];
  for (const entry of await readdir(path.join(root, prefix), {withFileTypes: true})) {
    const file = path.join(prefix, entry.name);
    if (entry.isDirectory()) rows.push(...await snapshot(root, file));
    else if (entry.isSymbolicLink()) rows.push({path: file, symbolicLink: true});
    else {const stat = await lstat(path.join(root, file), {bigint: true}); rows.push({...binding(file, await readFile(path.join(root, file))),
      ino: String(stat.ino), mode: String(stat.mode), mtimeNs: String(stat.mtimeNs)});}
  }
  return rows.sort((a, b) => a.path.localeCompare(b.path));
}
export {encode};
