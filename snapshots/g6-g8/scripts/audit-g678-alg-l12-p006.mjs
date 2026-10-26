import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {lstat, mkdir, readFile, readdir, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const source = path.join(sourceRoot, 'G6-G8-shared/ALG001/L12/RW/L12RW06.swf');
const expectedSha = '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6';
const out = path.join(root, 'migrations/shared-alg001-l12-p006/audit/ffdec-26.2.1');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
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
assert(['--extract', '--check'].includes(mode) && process.argv.length === 3);
assert((await lstat(sourceRoot)).isDirectory());
assert.equal(await realpath(source), source);
const bytes = await readFile(source);
assert.equal(bytes.length, 708053);
assert.equal(hash(bytes), expectedSha);
const generatorSha256 = hash(await readFile(fileURLToPath(import.meta.url)));
if (mode === '--extract') {
  await mkdir(out); // Refuse to overwrite a prior extraction.
  const commands = [
    ['-help', 'swf2xml'], ['-help', 'export'],
    ['-swf2xml', source, path.join(out, 'movie.xml')],
    ['-export', 'script', path.join(out, 'as'), source],
    ['-format', 'script:pcode', '-export', 'script', path.join(out, 'pcode'), source],
  ];
  for (const [index, args] of commands.entries()) {
    const result = spawnSync('/opt/homebrew/bin/ffdec', args, {encoding: 'utf8', timeout: 120000, maxBuffer: 8e6});
    await writeFile(path.join(out, `command-${index}.log`), `${result.stdout ?? ''}\n${result.stderr ?? ''}`);
    assert.ifError(result.error);
    assert.equal(result.status, 0);
    if (index < 2) assert(result.stdout.includes('JPEXS Free Flash Decompiler v.26.2.1'));
  }
  assert.equal(hash(await readFile(source)), expectedSha);
  await writeFile(path.join(out, 'extraction-receipt.json'), JSON.stringify({
    animationId: 'shared-alg001-l12-p006', source, sourceSha256: expectedSha,
    sourceBytes: bytes.length, generatorSha256, commands,
    evidence: 'static-extraction-only', registered: false, files: await inventory(out),
  }, null, 2) + '\n');
} else {
  const receipt = JSON.parse(await readFile(path.join(out, 'extraction-receipt.json')));
  assert.equal(receipt.sourceSha256, expectedSha);
  assert.equal(receipt.generatorSha256, generatorSha256);
  assert.deepEqual(receipt.files, await inventory(out));
}
console.log(JSON.stringify({mode, sourceSha256: expectedSha, files: (await inventory(out)).length, registered: false}));
