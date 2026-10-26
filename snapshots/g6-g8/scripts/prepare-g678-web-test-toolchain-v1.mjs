import assert from 'node:assert/strict';
import {lstat, mkdir, readFile, readlink, realpath, symlink} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// This worktree borrows the main checkout's dependencies. Keep that directory
// intact and resolve Web tests through their own lock-matched Playwright tools.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toolRoot = path.join(root, 'work/g678-shared-page-factory/web-test-toolchain-v1');
const appModules = path.join(root, 'apps/web/node_modules');
const versions = {'@playwright/test': '1.61.1', playwright: '1.61.1', 'playwright-core': '1.61.1', '@clerk/testing': '2.2.23'};
const args = process.argv.slice(2);
assert(args.length === 1 && ['--write', '--check'].includes(args[0]),
  'Usage: node scripts/prepare-g678-web-test-toolchain-v1.mjs --write | --check');
const write = args[0] === '--write';
const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));
const optionalStat = async (p) => {
  try { return await lstat(p); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
};
const lock = await readJson(path.join(root, 'package-lock.json'));
const toolLock = await readJson(path.join(toolRoot, 'package-lock.json'));
const declarations = await readJson(path.join(toolRoot, 'package.json'));
assert.equal(declarations.private, true);
assert.deepEqual(declarations.devDependencies, {'@clerk/testing': '2.2.23', '@playwright/test': '1.61.1'});
const sharedTarget = await realpath(path.join(root, 'node_modules'));
const plan = [];
for (const [name, version] of Object.entries(versions)) {
  const key = `node_modules/${name}`;
  const locked = lock.packages[key];
  assert.equal(locked.version, version);
  assert.equal(toolLock.packages[key].version, locked.version);
  assert.equal(toolLock.packages[key].integrity, locked.integrity);
  const target = path.join(toolRoot, key);
  assert.equal(await realpath(target), target);
  assert.equal((await readJson(path.join(target, 'package.json'))).version, locked.version);
  const link = path.join(appModules, name);
  plan.push({link, target, relativeTarget: path.relative(path.dirname(link), target), kind: 'dir'});
}
const cliTarget = path.join(toolRoot, 'node_modules/@playwright/test/cli.js');
assert((await lstat(cliTarget)).isFile());
const cliLink = path.join(appModules, '.bin/playwright');
plan.push({link: cliLink, target: cliTarget,
  relativeTarget: path.relative(path.dirname(cliLink), cliTarget), kind: 'file'});
const directories = [appModules, path.join(appModules, '@playwright'), path.join(appModules, '@clerk'), path.join(appModules, '.bin')];
for (const directory of directories) {
  const information = await optionalStat(directory);
  if (information) assert(information.isDirectory() && !information.isSymbolicLink(),
    `Refusing a non-directory or linked parent: ${directory}`);
  else assert(write, `Missing tool directory: ${directory}`);
}
for (const item of plan) {
  const information = await optionalStat(item.link);
  if (information) {
    assert(information.isSymbolicLink(), `Refusing to replace existing path: ${item.link}`);
    assert.equal(await readlink(item.link), item.relativeTarget);
    assert.equal(await realpath(item.link), item.target);
  } else assert(write, `Missing tool link: ${item.link}`);
}
if (write) {
  for (const directory of directories) await mkdir(directory, {recursive: true});
  for (const item of plan) {
    if (!(await optionalStat(item.link))) await symlink(item.relativeTarget, item.link, item.kind);
  }
}
for (const item of plan) {
  assert.equal(await readlink(item.link), item.relativeTarget);
  assert.equal(await realpath(item.link), item.target);
}
assert.equal(await realpath(path.join(root, 'node_modules')), sharedTarget);
console.log(JSON.stringify({status: 'verified', versions, sharedDependencyTargetUnchanged: sharedTarget,
  productCodeChanged: false, lockfileChanged: false, links: plan}, null, 2));
