import assert from 'node:assert/strict';
import {after, test} from 'node:test';
import {mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {G678_LIFE_EXECUTION_ROOT as ROOT, G678_LIFE_SOURCE_ROOT as SOURCE,
  isG678LifeExecution, resolveG678PhysicalPath, resolveG678HistoricalEvidencePath} from '../lib/g678-life-root-binding-v1.mjs';
import {pinFile, readPin} from '../lib/g678-admission-proof.mjs';
import {runStableBrowser as runV1} from './lib/g678-stable-browser-candidate-v1.mjs';
import {runStableBrowser as runV4} from './lib/g678-stable-browser-candidate-v4.mjs';

const prior = process.env.HELP_MATH_G678_SOURCE_ROOT;
process.env.HELP_MATH_G678_SOURCE_ROOT = SOURCE;
const audit = path.join(ROOT, 'work/hfr-typescript/life-root-binding-20261015-v1');
assert.equal(realpathSync(audit), audit);
const fixture = mkdtempSync(path.join(audit, 'test-'));
after(() => {
  rmSync(fixture, {recursive: true});
  if (prior === undefined) delete process.env.HELP_MATH_G678_SOURCE_ROOT;
  else process.env.HELP_MATH_G678_SOURCE_ROOT = prior;
});

test('Life binding covers server cwd and exact retained P015 source bytes', () => {
  assert(isG678LifeExecution(ROOT + '/apps/web'));
  const recorded = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared';
  const physical = resolveG678PhysicalPath(recorded, ROOT + '/apps/web');
  assert.equal(physical, SOURCE + '/G6-G8-shared');
  const pin = {path: 'NMS002/L11/IN/L11IN05.swf', bytes: 230382,
    sha256: '8c58397c556153b5f2104398939a179af077babafb469caba63ef214818c9b55'};
  const immutable = structuredClone(pin), bytes = readPin(recorded, pin);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), pin.sha256);
  assert.deepEqual(pin, immutable);
  assert.throws(() => readPin(recorded, {...pin, sha256: '0'.repeat(64)}), /current bytes/);
});

test('missing or wrong source env fails closed before binding', () => {
  for (const wrong of [undefined, '/tmp', '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware']) {
    if (wrong === undefined) delete process.env.HELP_MATH_G678_SOURCE_ROOT;
    else process.env.HELP_MATH_G678_SOURCE_ROOT = wrong;
    assert.throws(() => resolveG678PhysicalPath(ROOT), /exact Life G678 source root/);
  }
  process.env.HELP_MATH_G678_SOURCE_ROOT = SOURCE;
});

test('known original project maps Life, and missing Life target never falls back', () => {
  const recorded = '/Volumes/WestWorld/HELP MATH 2.0-g678-implementation';
  assert.equal(resolveG678PhysicalPath(recorded), ROOT);
  assert.throws(() => resolveG678HistoricalEvidencePath(recorded + '/__missing_life_binding_test__'), /ENOENT/);
  assert.throws(() => resolveG678PhysicalPath('/Volumes/WestWorld/unreviewed-root'), /Unmapped preserved-disk/);
  assert.throws(() => resolveG678PhysicalPath(recorded + '/../HELP MATH 2.0-g678-implementation'), /canonical path/);
});

test('mapped read still rejects symlinks and source-pin drift', () => {
  const original = path.join(fixture, 'ordinary.txt'), link = path.join(fixture, 'link.txt');
  writeFileSync(original, 'retained bytes');
  symlinkSync(original, link);
  assert.throws(() => resolveG678PhysicalPath(link), /must not follow a symlink/);
  const relative = path.relative(ROOT, original), bytes = readFileSync(original);
  const pin = {path: relative, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')};
  assert.deepEqual(readPin(ROOT, pin), bytes);
  writeFileSync(original, 'changed bytes');
  assert.throws(() => readPin(ROOT, pin), /current bytes/);
  assert.throws(() => readPin(ROOT, {...pin, path: path.relative(ROOT, link)}), /physical path/);
});

test('unmapped historical evidence is a read dependency, never a fresh execution address', () => {
  const historical = '/Volumes/American Dream/hudongpin/helpmath-execution-20260906-01a0747f';
  assert.throws(() => resolveG678PhysicalPath(historical), /Unmapped preserved-disk/);
  assert.equal(resolveG678HistoricalEvidencePath(historical), historical);
});

for (const [version, run] of [['v1', runV1], ['v4', runV4]]) {
  test(version + ' watches the Life file for an additional external input recorded on WestWorld', async () => {
    const base = path.join(fixture, version), workspace = path.join(base, 'workspace'), source = path.join(base, 'source');
    mkdirSync(workspace, {recursive: true});
    mkdirSync(source);
    const actual = path.join(source, 'input.txt');
    writeFileSync(actual, 'original');
    const recorded = '/Volumes/WestWorld/HELP MATH 2.0-g678-implementation/' + path.relative(ROOT, source);
    const candidate = {schemaVersion: 1, kind: 'g678-stable-browser-candidate-v1', root: workspace,
      animationIds: ['synthetic-life-watch'], host: null, registrySha256: 'fixture', files: [],
      external: [{root: recorded, pin: pinFile(source, 'input.txt')}]};
    writeFileSync(path.join(workspace, 'candidate.json'), JSON.stringify(candidate));
    await assert.rejects(run({root: workspace, candidatePin: pinFile(workspace, 'candidate.json'),
      receipt: 'output/result.json', command: process.execPath, args: ['--input-type=module', '-e',
        `import fs from 'node:fs'; setTimeout(()=>{fs.writeFileSync(${JSON.stringify(actual)},'changed');fs.writeFileSync(${JSON.stringify(actual)},'original');},120);setTimeout(()=>{},800);`]}));
    const result = JSON.parse(readFileSync(path.join(workspace, 'output/result.json')));
    assert.equal(result.status, 'failed');
    assert(result.drift?.includes(actual), 'The native watcher must identify the actual Life mutation');
    assert(!result.drift.includes('/Volumes/WestWorld/'));
    if (result.watch) assert(result.watch.roots.every(dir => dir.startsWith(ROOT + '/')));
    const stable = await run({root: workspace, candidatePin: pinFile(workspace, 'candidate.json'),
      receipt: 'output/stable-result.json', command: process.execPath, args: ['-e', 'process.exit(0)']});
    assert.equal(stable.status, 'stable-command-passed');
    if (stable.watch) assert(stable.watch.roots.every(dir => dir.startsWith(ROOT + '/')));
    // The candidate's historical address remains untouched by physical watching.
    assert.equal(JSON.parse(readFileSync(path.join(workspace, 'candidate.json'))).external[0].root, recorded);
  });
}
