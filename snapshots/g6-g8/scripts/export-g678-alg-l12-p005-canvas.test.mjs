import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {readFileSync, realpathSync} from 'node:fs';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';

const root = new URL('../', import.meta.url);
const script = new URL('./export-g678-alg-l12-p005-canvas.mjs', import.meta.url);
const output = new URL('migrations/shared-alg001-l12-p005/audit/ffdec-26.2.1-canvas-v1/', root);
const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const run = (args, source = sourceRoot) => spawnSync(process.execPath,
  [fileURLToPath(script), ...args], {
    cwd: fileURLToPath(root), env: {...process.env, HELP_MATH_G678_SOURCE_ROOT: source},
    encoding: 'utf8', timeout: 30000,
  });
const html = relative => readFileSync(new URL(relative, output), 'utf8').replace(/\r\n?/g, '\n');

test('P005 check binds the physical source, selected outputs, tool and hashes', () => {
  const checked = run(['--check']);
  assert.equal(checked.status, 0, checked.stderr);
  assert.equal(JSON.parse(checked.stdout).files, 10);
  const receipt = JSON.parse(readFileSync(new URL('extraction-receipt.json', output)));
  assert.equal(receipt.source.sha256,
    'b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe');
  assert.deepEqual(receipt.selectedDomains,
    {root: 10, 'sprite-391': 968, 'sprite-395': 1, 'sprite-78': 36});
  assert.deepEqual(receipt.files.map(file => file.path), [
    'export.log', 'frames/canvas.js', 'frames/frames.html', 'help-export.txt',
    'sprites/DefineSprite_391/canvas.js', 'sprites/DefineSprite_391/frames.html',
    'sprites/DefineSprite_395/canvas.js', 'sprites/DefineSprite_395/frames.html',
    'sprites/DefineSprite_78/canvas.js', 'sprites/DefineSprite_78/frames.html',
  ]);
  assert(receipt.under100MiB);
  assert(receipt.files.every(file => !/\.png$/i.test(file.path)));
  assert.equal(receipt.tool.version, '26.2.1');
  assert.equal(sha256(readFileSync(receipt.tool.launcherRealPath)), receipt.tool.launcherSha256);
  assert.equal(sha256(readFileSync(receipt.tool.jar)), receipt.tool.jarSha256);
  assert.equal(realpathSync(receipt.tool.launcher), receipt.tool.launcherRealPath);
  assert.equal(sha256(readFileSync(new URL('help-export.txt', output))), receipt.tool.helpSha256);
  assert(receipt.command.includes('78,391,395'));
  assert.deepEqual(receipt.command.slice(-4),
    ['-export', 'frame,sprite', fileURLToPath(output).replace(/\/$/, ''),
      `${sourceRoot}/G6-G8-shared/ALG001/L12/RW/L12RW05.swf`]);
});

test('P005 refuses alternate roots and cannot overwrite retained extraction', () => {
  const receipt = new URL('extraction-receipt.json', output);
  const before = readFileSync(receipt);
  assert.notEqual(run(['--check'], '/not-the-source-root').status, 0);
  const repeated = run(['--export']);
  assert.notEqual(repeated.status, 0);
  assert.match(repeated.stderr, /EEXIST/);
  assert(readFileSync(receipt).equals(before));
});

test('P005 generated Canvas declares exact four domains and bitmap/font IDs', () => {
  const rootHtml = html('frames/frames.html');
  const start = rootHtml.indexOf('var scalingGrids = {};');
  const end = rootHtml.indexOf('\nvar frame = -1;');
  assert(start >= 0 && end > start);
  new Script(rootHtml.slice(start, end)); // Parse only; no rendering or fidelity claim.
  for (const [name, frames] of [
    ['main', 10], ['sprite391', 968], ['sprite395', 1], ['sprite78', 36],
  ]) {
    assert.match(rootHtml, new RegExp(`function ${name}\\(ctx,ctrans,frame,ratio,time\\)\\{[\\s\\S]*?var frame_cnt = ${frames};`));
  }
  assert.deepEqual([...rootHtml.matchAll(/function (image\d+)\(/g)].map(match => match[1]),
    ['image2', 'image99', 'image204']);
  assert.match(rootHtml, /function font392\(/);
  for (const name of ['sprite391', 'sprite395', 'shape396']) {
    assert(rootHtml.includes(`place("${name}"`));
  }
});

test('P005 root and standalone wrappers retain their distinct translations', () => {
  const rootHtml = html('frames/frames.html');
  assert(rootHtml.includes('function main(ctx,ctrans,frame,ratio,time){\n\tctx.save();\n\tctx.transform(1,0,0,1,0.0,0.0);'));
  assert(rootHtml.includes('place("sprite391",canvas,ctx,[0.05,0.0,0.0,0.05,278.4,366.85],ctrans,1,(0+time)%968,5,time);'));
  assert(rootHtml.includes('place("sprite395",canvas,ctx,[0.05,0.0,0.0,0.05,403.4,-42.4],ctrans,1,(0+time)%1,5,time);'));
  assert(rootHtml.includes('place("shape396",canvas,ctx,[0.05,0.0,0.0,0.05,0.0,0.0],ctrans,1,0,0,time);'));
  for (const [id, x, y, count] of [[391, '1486.9', '1143.6', 968],
    [395, '286.0', '89.35', 1], [78, '128.9', '-3.6', 36]]) {
    const spriteHtml = html(`sprites/DefineSprite_${id}/frames.html`);
    assert(spriteHtml.includes(`function sprite${id}(ctx,ctrans,frame,ratio,time){\n\tctx.save();\n\tctx.transform(1,0,0,1,${x},${y});`));
    assert(spriteHtml.includes(`var frame_cnt = ${count};`));
  }
});

test('P005 parent 391 has exactly two source-timed sprite78 placement spans', () => {
  const rootHtml = html('frames/frames.html');
  const calls = [...rootHtml.matchAll(/place\("sprite78",canvas,ctx,\[([^\]]+)\],ctrans,1,\((\d+)\+time\)%36,(\d+),time\);/g)]
    .map(match => ({matrix: match[1], local: Number(match[2]), offset: Number(match[3])}));
  assert.equal(calls.length, 17);
  assert(calls.every(call => call.matrix === '0.6736297607421875,0.0,0.0,0.6736297607421875,197.0,-788.0'));
  assert.deepEqual(calls.slice(0, 11).map(call => [call.local, call.offset]),
    Array.from({length: 11}, (_, frame) => [frame, 265]));
  assert.deepEqual(calls.slice(11).map(call => [call.local, call.offset]),
    Array.from({length: 6}, (_, frame) => [frame, 282]));
});
