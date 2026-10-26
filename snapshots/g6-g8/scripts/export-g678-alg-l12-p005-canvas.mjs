import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {lstat, mkdir, readFile, readdir, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE = 'G6-G8-shared/ALG001/L12/RW/L12RW05.swf';
const SOURCE_SHA = 'b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe';
const WORK = 'migrations/shared-alg001-l12-p005';
const STRUCTURE_SHA = '3292f24e124d9160356701b50cc458f0bf8e5f3e717953e6db50edb7aef4b26d';
const TOOLCHAIN_SHA = '07484eaf52751128f91b429b7ce1b7bb46259365c545d17c360b5d0c74c3b41f';
const OUT = `${WORK}/audit/ffdec-26.2.1-canvas-v1`;
const TOOL = '/opt/homebrew/bin/ffdec';
const EXPECTED = [
  'export.log', 'frames/canvas.js', 'frames/frames.html', 'help-export.txt',
  'sprites/DefineSprite_78/canvas.js', 'sprites/DefineSprite_78/frames.html',
  'sprites/DefineSprite_391/canvas.js', 'sprites/DefineSprite_391/frames.html',
  'sprites/DefineSprite_395/canvas.js', 'sprites/DefineSprite_395/frames.html',
].sort((a, b) => a.localeCompare(b, 'en'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;

async function inventory(directory, base = directory) {
  const records = [];
  for (const name of (await readdir(directory)).sort()) {
    if (name === 'extraction-receipt.json') continue;
    const file = path.join(directory, name);
    const stat = await lstat(file);
    assert(!stat.isSymbolicLink(), 'export must contain no symlinks');
    if (stat.isDirectory()) records.push(...await inventory(file, base));
    else {
      assert(stat.isFile() && stat.nlink === 1, 'export must contain ordinary files');
      const bytes = await readFile(file);
      records.push({path: path.relative(base, file), bytes: bytes.length, sha256: hash(bytes)});
    }
  }
  return records.sort((a, b) => a.path.localeCompare(b.path, 'en'));
}

function run(args, timeout = 180000) {
  const result = spawnSync(TOOL, args, {encoding: 'utf8', maxBuffer: 4e6, timeout});
  assert(!result.error, result.error?.message);
  return result;
}

async function preflight() {
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT, SOURCE_ROOT,
    'exact physical G6-G8 source root required');
  assert((await lstat(SOURCE_ROOT)).isDirectory(), 'source root must be a real directory');
  assert.equal(await realpath(SOURCE_ROOT), SOURCE_ROOT);
  const source = path.join(SOURCE_ROOT, SOURCE);
  assert((await lstat(source)).isFile(), 'source must be a real file');
  assert.equal(await realpath(source), source);
  const sourceBytes = await readFile(source);
  assert.equal(sourceBytes.length, 1950595);
  assert.equal(hash(sourceBytes), SOURCE_SHA);
  const migration = JSON.parse(await readFile(path.join(ROOT, WORK, 'migration.json')));
  assert.equal(migration.animationId, 'shared-alg001-l12-p005');
  assert.equal(migration.source.swf, source);
  assert.equal(migration.source.swfSha256, SOURCE_SHA);
  const structureBytes = await readFile(path.join(ROOT, WORK, 'audit/source-structure.json'));
  assert.equal(hash(structureBytes), STRUCTURE_SHA);
  const structure = JSON.parse(structureBytes);
  assert.equal(structure.sourceSwfSha256, SOURCE_SHA);
  assert.deepEqual([structure.header.rootFrameCount,
    ...[391, 395, 78].map(id => structure.timelines[`sprite-${id}`].frameCount)],
    [10, 968, 1, 36]);
  assert.equal(hash(await readFile(path.join(ROOT, 'catalog/toolchain.json'))), TOOLCHAIN_SHA);
  return {source, structure};
}

async function main() {
  assert(['--export', '--check'].includes(process.argv[2]) && process.argv.length === 3,
    'usage: node scripts/export-g678-alg-l12-p005-canvas.mjs --export|--check');
  const {source} = await preflight();
  const out = path.join(ROOT, OUT);
  const generatorSha256 = hash(await readFile(fileURLToPath(import.meta.url)));
  if (process.argv[2] === '--check') {
    const receipt = JSON.parse(await readFile(path.join(out, 'extraction-receipt.json')));
    assert.equal(receipt.animationId, 'shared-alg001-l12-p005');
    assert.equal(receipt.source.sha256, SOURCE_SHA);
    assert.equal(receipt.sourceStructureSha256, STRUCTURE_SHA);
    assert.equal(receipt.toolchainSha256, TOOLCHAIN_SHA);
    assert.equal(receipt.generatorSha256, generatorSha256);
    const files = await inventory(out);
    assert.deepEqual(files.map(file => file.path), EXPECTED);
    assert.deepEqual(receipt.files, files);
    assert.equal(receipt.outputChecksumSetSha256, hash(Buffer.from(json(files))));
    console.log(json({checked: true, files: files.length,
      totalBytes: files.reduce((sum, file) => sum + file.bytes, 0), sourceSha256: SOURCE_SHA}));
    return;
  }

  const help = run(['-help', 'export']);
  assert.equal(help.status, 0);
  assert(help.stdout.includes('JPEXS Free Flash Decompiler v.26.2.1'));
  for (const option of ['-selectid', 'frame:canvas', 'sprite:canvas']) {
    assert(help.stdout.includes(option), `FFDec help lacks ${option}`);
  }
  const launcher = await realpath(TOOL);
  const jar = path.join(path.dirname(launcher), 'ffdec.jar');
  const tool = {
    version: '26.2.1', launcher: TOOL, launcherRealPath: launcher,
    launcherSha256: hash(await readFile(launcher)), jar,
    jarSha256: hash(await readFile(jar)), helpCommand: [TOOL, '-help', 'export'],
    helpSha256: hash(Buffer.from(help.stdout)),
  };
  await mkdir(out); // Exclusive creation: a rerun never overwrites an earlier attempt.
  await writeFile(path.join(out, 'help-export.txt'), help.stdout, {flag: 'wx'});
  const args = ['-config', 'packJavaScripts=false', '-onerror', 'abort',
    '-selectid', '78,391,395', '-format', 'frame:canvas,sprite:canvas',
    '-export', 'frame,sprite', out, source];
  const result = run(args, 300000);
  await writeFile(path.join(out, 'export.log'), result.stdout + result.stderr, {flag: 'wx'});
  assert.equal(result.status, 0, 'FFDec failed; partial output retained for review');
  assert.equal(hash(await readFile(source)), SOURCE_SHA, 'source changed during export');
  const files = await inventory(out);
  assert.deepEqual(files.map(file => file.path), EXPECTED,
    'FFDec output differs from the four selected Canvas domains');
  const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
  const receipt = {
    schemaVersion: 1, animationId: 'shared-alg001-l12-p005',
    evidenceKind: 'bounded FFDec Canvas extraction; no runtime authority',
    source: {physicalPath: source, bytes: 1950595, sha256: SOURCE_SHA},
    sourceStructureSha256: STRUCTURE_SHA, toolchainSha256: TOOLCHAIN_SHA,
    generatorSha256, tool, command: [TOOL, ...args],
    selectedDomains: {root: 10, 'sprite-391': 968, 'sprite-395': 1, 'sprite-78': 36},
    files, outputChecksumSetSha256: hash(Buffer.from(json(files))), totalBytes,
    under100MiB: totalBytes < 100 * 1024 * 1024,
    acceptanceEffect: 'none',
  };
  await writeFile(path.join(out, 'extraction-receipt.json'), json(receipt), {flag: 'wx'});
  console.log(json({exported: true, files: files.length, totalBytes,
    under100MiB: receipt.under100MiB, sourceSha256: SOURCE_SHA}));
}

main().catch(error => {console.error(error); process.exitCode = 1;});
