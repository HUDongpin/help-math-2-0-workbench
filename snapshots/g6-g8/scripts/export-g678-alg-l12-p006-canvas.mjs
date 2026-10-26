import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {mkdir, readFile, readdir, lstat, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/RW/L12RW06.swf';
const SHA = '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6';
const OUT = path.join(ROOT, 'migrations/shared-alg001-l12-p006/audit/ffdec-26.2.1-canvas-v1');
const TOOL = '/opt/homebrew/bin/ffdec';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
async function inventory(dir, base = dir) {
  const result = [];
  for (const name of (await readdir(dir)).sort()) {
    if (name === 'extraction-receipt.json') continue;
    const file = path.join(dir, name), info = await lstat(file);
    assert(!info.isSymbolicLink());
    if (info.isDirectory()) result.push(...await inventory(file, base));
    else {
      assert(info.isFile());
      const bytes = await readFile(file);
      result.push({path: path.relative(base, file), bytes: bytes.length, sha256: hash(bytes)});
    }
  }
  return result;
}
const mode = process.argv[2];
assert(['--export', '--check'].includes(mode) && process.argv.length === 3);
assert.equal(await realpath(SOURCE), SOURCE);
const source = await readFile(SOURCE);
assert.equal(source.length, 708053);
assert.equal(hash(source), SHA);
const generatorSha256 = hash(await readFile(fileURLToPath(import.meta.url)));
const expectedFiles = ['export.log', 'help-export.txt', 'frames/canvas.js', 'frames/frames.html',
  ...[53, 56].flatMap(id => [`sprites/DefineSprite_${id}/canvas.js`, `sprites/DefineSprite_${id}/frames.html`])].sort();
if (mode === '--export') {
  const help = spawnSync(TOOL, ['-help', 'export'], {encoding: 'utf8', timeout: 30000});
  assert.ifError(help.error); assert.equal(help.status, 0);
  assert(help.stdout.includes('JPEXS Free Flash Decompiler v.26.2.1'));
  for (const option of ['-selectid', 'frame:canvas', 'sprite:canvas']) assert(help.stdout.includes(option));
  const launcher = await realpath(TOOL), jar = path.join(path.dirname(launcher), 'ffdec.jar');
  const tool = {version: '26.2.1', launcher, launcherSha256: hash(await readFile(launcher)),
    jar, jarSha256: hash(await readFile(jar))};
  await mkdir(OUT);
  await writeFile(path.join(OUT, 'help-export.txt'), help.stdout, {flag: 'wx'});
  const args = ['-config', 'packJavaScripts=false', '-onerror', 'abort', '-selectid', '53,56',
    '-format', 'frame:canvas,sprite:canvas', '-export', 'frame,sprite', OUT, SOURCE];
  const result = spawnSync(TOOL, args, {encoding: 'utf8', timeout: 180000, maxBuffer: 8e6});
  await writeFile(path.join(OUT, 'export.log'), `${result.stdout ?? ''}\n${result.stderr ?? ''}`, {flag: 'wx'});
  assert.ifError(result.error); assert.equal(result.status, 0);
  assert.equal(hash(await readFile(SOURCE)), SHA);
  const files = await inventory(OUT);
  assert.deepEqual(files.map(x => x.path).sort(), expectedFiles);
  await writeFile(path.join(OUT, 'extraction-receipt.json'), json({
    animationId: 'shared-alg001-l12-p006', sourceSha256: SHA, generatorSha256, tool,
    command: [TOOL, ...args], domains: {root: 10, 'sprite-53': 342, 'sprite-56': 1},
    files, evidence: 'static Canvas extraction; not a product renderer or runtime authority', registered: false,
  }), {flag: 'wx'});
} else {
  const receipt = JSON.parse(await readFile(path.join(OUT, 'extraction-receipt.json')));
  assert.equal(receipt.generatorSha256, generatorSha256);
  assert.equal(receipt.sourceSha256, SHA);
  assert.deepEqual(receipt.files, await inventory(OUT));
  assert.deepEqual(receipt.files.map(x => x.path).sort(), expectedFiles);
}
const files = await inventory(OUT);
console.log(json({mode, files: files.length, bytes: files.reduce((s, x) => s + x.bytes, 0), registered: false}));
