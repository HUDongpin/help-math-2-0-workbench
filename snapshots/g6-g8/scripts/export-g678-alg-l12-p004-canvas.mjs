import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {lstat, mkdir, readFile, readdir, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE = 'G6-G8-shared/ALG001/L12/RW/L12RW04.swf';
const SHA = '4d7aa78bd955aa52d476f31548c97135da989daf9d106986ff06a954c6d8b334';
const WORK = 'migrations/shared-alg001-l12-p004';
const OUT = `${WORK}/audit/ffdec-26.2.1-canvas-v1`;
const TOOL = '/opt/homebrew/bin/ffdec';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;

async function inventory(directory) {
  const records = [];
  for (const name of (await readdir(directory)).sort()) {
    if (name === 'extraction-receipt.json') continue;
    const file = path.join(directory, name), stat = await lstat(file);
    assert(!stat.isSymbolicLink(), 'no exported links');
    if (stat.isDirectory()) records.push(...await inventory(file));
    else {
      assert(stat.isFile() && stat.nlink === 1, 'ordinary generated file');
      const bytes = await readFile(file);
      records.push({path: path.relative(ROOT, file), bytes: bytes.length, sha256: hash(bytes)});
    }
  }
  return records;
}

async function main() {
  assert(['--export', '--check'].includes(process.argv[2]) && process.argv.length === 3,
    'usage: node scripts/export-g678-alg-l12-p004-canvas.mjs --export|--check');
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT, SOURCE_ROOT);
  assert.equal(await realpath(SOURCE_ROOT), SOURCE_ROOT);
  const source = path.join(SOURCE_ROOT, SOURCE);
  assert.equal(await realpath(source), source);
  assert((await lstat(source)).isFile());
  const bytes = await readFile(source);
  assert.equal(bytes.length, 363811);
  assert.equal(hash(bytes), SHA);
  const migration = JSON.parse(await readFile(path.join(ROOT, WORK, 'migration.json')));
  assert.equal(migration.animationId, 'shared-alg001-l12-p004');
  const out = path.join(ROOT, OUT);
  if (process.argv[2] === '--check') {
    const receipt = JSON.parse(await readFile(path.join(out, 'extraction-receipt.json')));
    assert.equal(receipt.source.sha256, SHA);
    assert.deepEqual(receipt.files, await inventory(out));
    console.log(json({checked: true, files: receipt.files.length, sourceSha256: SHA}));
    return;
  }
  const help = spawnSync(TOOL, ['-help', 'export'], {encoding: 'utf8', maxBuffer: 2e6});
  assert.equal(help.status, 0);
  assert(help.stdout.includes('v.26.2.1') && help.stdout.includes('sprite:canvas'));
  await mkdir(out); // Existing extraction fails closed, never overwrite evidence.
  await writeFile(path.join(out, 'help-export.txt'), help.stdout, {flag: 'wx'});
  const args = ['-config', 'packJavaScripts=false', '-onerror', 'abort',
    '-format', 'sprite:canvas', '-export', 'sprite', out, source];
  const result = spawnSync(TOOL, args, {encoding: 'utf8', maxBuffer: 4e6, timeout: 180000});
  await writeFile(path.join(out, 'export.log'), result.stdout + result.stderr, {flag: 'wx'});
  assert.equal(result.status, 0, 'export failed; preserve partial output for review');
  assert.equal(hash(await readFile(source)), SHA, 'source remained unchanged');
  const files = await inventory(out);
  assert(files.some(file => file.path.endsWith('/frames.html')));
  await writeFile(path.join(out, 'extraction-receipt.json'), json({
    schemaVersion: 1, animationId: migration.animationId, tool: 'FFDec 26.2.1',
    command: [TOOL, ...args], source: {path: SOURCE, bytes: bytes.length, sha256: SHA},
    files, acceptanceEffect: 'none',
  }), {flag: 'wx'});
  console.log(json({exported: true, files: files.length, sourceSha256: SHA}));
}
main().catch(error => {console.error(error); process.exitCode = 1;});
