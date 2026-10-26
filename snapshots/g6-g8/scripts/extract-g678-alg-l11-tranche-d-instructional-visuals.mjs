#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, readdir, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = promisify(execFile);
const FFDEC = '/Users/peter/Applications/FFDec.app/Contents/Resources/ffdec.sh';
const JAR = path.join(path.dirname(FFDEC), 'ffdec.jar');
const OUTPUT = 'work/g678-shared-page-factory/g678-alg-l11-tranche-d-instructional-visuals-v3';
const MEMBERS = [
  {page: 'p044', source: 'FQ/L11FQ02.swf', sha256: 'd17c24baef9bf9ea87eefae6cf5d317ad50a211035cd997e0cfba16eb6390ff1', ids: '1083', frames: '1083:2-25,45-68'},
  {page: 'p034', source: 'GS/L11GS03.swf', sha256: '77b4d2a8ee13325bd527f558751ac84e60d1de36d1ff258cb6569f36885ad06c', ids: '59,65,70,74,77,81,83,86,88,90,92,93,195,198,201,203,206,208,211,213,215,217,219,221', frames: 'all:1'},
  {page: 'p033', source: 'GS/L11GS02.swf', sha256: 'a45ea47bc800183016612ef316ba9d54c3cc191764650cb2bce24bcd920061c2', ids: '116', frames: '116:1,604,605'},
];
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function binding(file) {
  const before = await lstat(file);
  assert.ok(before.isFile() && !before.isSymbolicLink() && before.nlink === 1);
  const bytes = await readFile(file);
  const after = await lstat(file);
  assert.equal(before.ino, after.ino); assert.equal(before.mtimeMs, after.mtimeMs);
  return {path: file.startsWith(ROOT + path.sep) ? path.relative(ROOT, file) : file,
    bytes: bytes.length, sha256: hash(bytes)};
}
async function inventory(directory, base = directory) {
  const files = [];
  for (const entry of (await readdir(directory, {withFileTypes: true})).sort((a,b) => a.name.localeCompare(b.name))) {
    const file = path.join(directory, entry.name);
    assert.ok(!entry.isSymbolicLink());
    if (entry.isDirectory()) files.push(...await inventory(file, base));
    else files.push({...await binding(file), path: path.relative(base, file)});
  }
  return files;
}
export async function extract() {
  const sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT;
  assert.ok(sourceRoot && path.isAbsolute(sourceRoot));
  assert.equal(await realpath(sourceRoot), sourceRoot);
  const tools = {launcher: await binding(FFDEC), jar: await binding(JAR)};
  assert.equal(tools.launcher.sha256, '1a242c6333aa8dba0f18f635f9ea2585a988f4131aa5164b70eb00ad9e662bab');
  assert.equal(tools.jar.sha256, '090ab695053ad94cba6408574c7d7eea20ec60b6ae789ee6056a23f45106762f');
  const destination = path.join(ROOT, OUTPUT);
  await mkdir(destination); // Exclusive run identity; a retained attempt is never overwritten.
  const help = await run(FFDEC, ['-help', '-export'], {encoding: 'buffer'});
  assert.equal(help.stderr.length, 0);
  await writeFile(path.join(destination, 'ffdec-export-help.txt'), help.stdout, {flag: 'wx'});
  const pages = [];
  for (const member of MEMBERS) {
    const source = path.join(sourceRoot, 'G6-G8-shared/ALG001/L11', member.source);
    const input = await binding(source);
    assert.equal(input.sha256, member.sha256);
    assert.equal((await lstat(source)).mode & 0o222, 0);
    const output = path.join(destination, member.page);
    await mkdir(output);
    let ids = member.ids; let frames = member.frames;
    if (member.page === 'p044') {
      const sourceXml = path.join(ROOT, 'work/g678-shared-page-factory/g678-alg-l11-residual-routing-audit-v1/shared-alg001-l11-p044/source.xml');
      const xmlInput = await binding(sourceXml);
      const audit = JSON.parse(await readFile(path.join(ROOT, 'catalog/g678-alg-l11-advanced3-tranche-d-audit-v1.json'), 'utf8'));
      assert.equal(xmlInput.sha256, audit.pages.find(p => p.animationId.endsWith('p044')).ffdec.sourceXml.sha256);
      const xml = await readFile(sourceXml, 'utf8');
      const matches = [...xml.matchAll(/<PlaceObject2\b[^>]*objectID="(\d+)"[^>]*name="A(\d+)Opt([1-4])"[^>]*>/g)];
      const options = [...new Set(matches.map(m => Number(m[1])))].sort((a,b) => a-b);
      assert.equal(new Set(matches.map(m => `A${m[2]}Opt${m[3]}`)).size, 96);
      ids += ',' + options.join(','); frames += ',' + options.map(id => `${id}:1`).join(',');
    }
    const args = ['-onerror', 'abort', '-format', 'sprite:svg', '-selectid', ids,
      '-select', frames === 'all:1' ? ids.split(',').map(id => `${id}:1`).join(',') : frames,
      '-export', 'sprite', output, source];
    const result = await run(FFDEC, args, {encoding: 'buffer', maxBuffer: 16 * 1024 * 1024}).catch(async (error) => {
      await writeFile(path.join(output, 'stdout.txt'), error.stdout ?? '', {flag: 'wx'});
      await writeFile(path.join(output, 'stderr.txt'), error.stderr ?? '', {flag: 'wx'});
      await writeFile(path.join(output, 'failure.json'), JSON.stringify({command: args,
        code: error.code, input, tools}, null, 2) + '\n', {flag: 'wx'});
      throw error;
    });
    await writeFile(path.join(output, 'stdout.txt'), result.stdout, {flag: 'wx'});
    await writeFile(path.join(output, 'stderr.txt'), result.stderr, {flag: 'wx'});
    assert.equal(result.stderr.length, 0);
    assert.ok(result.stdout.toString().startsWith('JPEXS Free Flash Decompiler v.26.2.1'));
    assert.equal((await binding(source)).sha256, input.sha256);
    pages.push({page: member.page, source: {...input, path: 'G6-G8-shared/ALG001/L11/' + member.source},
      command: [FFDEC, ...args.map(arg => arg === source ? '<hash-bound-preserved-source>' : arg.replace(destination, '<run-root>'))],
      files: await inventory(output)});
  }
  const receipt = {schemaVersion: 1, runId: path.basename(OUTPUT),
    builder: await binding(fileURLToPath(import.meta.url)), tools,
    toolchain: await binding(path.join(ROOT, 'catalog/toolchain.json')),
    help: await binding(path.join(destination, 'ffdec-export-help.txt')), pages,
    transform: 'FFDec static layered SVG export; no ActionScript execution; maintained React behavior is separate',
    gates: {currentJavaScriptRegistered: false, productCalibrationPassed: false,
      authoritativeOriginalRuntime: false, visualFidelityAccepted: false, audioAccepted: false,
      humanVisualAccepted: false, ownerAccepted: false, strictComplete: false, released: false, published: false}};
  await writeFile(path.join(destination, 'extraction.json'), JSON.stringify(receipt, null, 2) + '\n', {flag: 'wx'});
  console.log(JSON.stringify({output: OUTPUT, pages: pages.map(p => ({page: p.page, files: p.files.length}))}));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await extract();
