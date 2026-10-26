import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';

const root = new URL('../', import.meta.url);
const script = new URL('./export-g678-alg-l12-p004-canvas.mjs', import.meta.url);
const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const receipt = new URL('migrations/shared-alg001-l12-p004/audit/ffdec-26.2.1-canvas-v1/extraction-receipt.json', root);
const run = (args, value = sourceRoot) => spawnSync(process.execPath, [fileURLToPath(script), ...args], {
  cwd: root, env: {...process.env, HELP_MATH_G678_SOURCE_ROOT: value},
  encoding: 'utf8', timeout: 30000,
});

test('P004 extraction rechecks the physical source and every exported byte', () => {
  const result = run(['--check']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).files, 6);
});

test('P004 extraction rejects another source root and refuses to overwrite evidence', () => {
  const before = readFileSync(receipt);
  const wrong = run(['--export'], '/not-the-source-root');
  assert.notEqual(wrong.status, 0);
  const repeat = run(['--export']);
  assert.notEqual(repeat.status, 0);
  assert.match(repeat.stderr, /EEXIST/);
  assert(readFileSync(receipt).equals(before));
  assert.equal(run(['--check']).status, 0);
});

test('P004 exported layers have compatible declarations and the expected source-frame domains', () => {
  const extract = (id) => {
    const html = readFileSync(new URL(`migrations/shared-alg001-l12-p004/audit/ffdec-26.2.1-canvas-v1/DefineSprite_${id}/frames.html`, root), 'utf8').replace(/\r\n?/g, '\n');
    const start = html.indexOf('var scalingGrids = {};');
    const end = html.indexOf('\nvar frame = -1;');
    assert(start >= 0 && end > start);
    const definitions = html.slice(start, end);
    new Script(definitions); // Parse only. This is not runtime or fidelity acceptance.
    return definitions;
  };
  const main = extract(90), title = extract(92);
  const names = text => [...text.matchAll(/function\s+([\w$]+)\s*\(/g)].map(match => match[1]);
  const mainNames = new Set(names(main));
  assert(names(title).every(name => !mainNames.has(name)), 'layer declaration collision');
  assert.match(main, /function sprite90\(ctx,ctrans,frame,ratio,time\)\{\s*ctx.save\(\);\s*ctx.transform\(1,0,0,1,122\.8,185\.05\);\s*var clips = \[\];\s*var frame_cnt = 969;/);
  assert.match(title, /function sprite92\(ctx,ctrans,frame,ratio,time\)\{\s*ctx.save\(\);\s*ctx.transform\(1,0,0,1,282\.6,12\.2\);\s*var clips = \[\];\s*var frame_cnt = 1;/);
  assert.deepEqual(names(main).filter(name => /^font\d+$/.test(name)), ['font2', 'font60']);
  for (const id of [63, 66, 67, 71, 72]) assert(mainNames.has(`button${id}`));
  assert.equal(/new Image\s*\(/.test(main + title), false);
});
