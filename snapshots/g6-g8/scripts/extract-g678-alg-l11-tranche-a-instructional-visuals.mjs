#!/usr/bin/env node

import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, readdir, realpath, statfs, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUN = 'work/g678-shared-page-factory/g678-alg-l11-tranche-a-instructional-visuals-v2';
const AUDIT = 'catalog/g678-alg-l11-interactive10-tranche-c-audit-v1.json';
const AUDIT_SHA = '45398b11c513b52bac070fd37303376362e2be0e01fe6b0b4710350c86f56578';
const FFDEC = '/Users/peter/Applications/FFDec.app/Contents/Resources/ffdec.sh';
const JAR = path.join(path.dirname(FFDEC), 'ffdec.jar');
const IDS = [6, 8, 9, 10, 11, 14, 19, 20, 21, 25].map((page) =>
  `shared-alg001-l11-p${String(page).padStart(3, '0')}`);
const run = promisify(execFile);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const gates = Object.freeze({currentJavaScriptRegistered: false,
  productCalibrationPassed: false, authoritativeOriginalRuntime: false,
  visualFidelityAccepted: false, audioAccepted: false,
  humanVisualAccepted: false, ownerAccepted: false, strictComplete: false,
  released: false, published: false});

async function binding(file) {
  assert.equal(await realpath(file), file);
  const before = await lstat(file, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n);
  const bytes = await readFile(file);
  const after = await lstat(file, {bigint: true});
  for (const field of ['ino', 'dev', 'size', 'mtimeNs', 'mode', 'nlink']) {
    assert.equal(before[field], after[field], `${file} changed during read`);
  }
  return {path: file.startsWith(`${ROOT}/`) ? path.relative(ROOT, file) : file,
    bytes: bytes.length, sha256: hash(bytes)};
}

async function inventory(directory, base = directory) {
  const files = [];
  for (const entry of (await readdir(directory, {withFileTypes: true}))
    .sort((a, b) => a.name.localeCompare(b.name))) {
    assert.ok(!entry.isSymbolicLink(), 'generated symlinks are not allowed');
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await inventory(file, base));
    else files.push({...await binding(file), path: path.relative(base, file)});
  }
  return files;
}

export async function extractAlgL11AInstructionalVisuals() {
  const sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT;
  assert.ok(sourceRoot && path.isAbsolute(sourceRoot));
  assert.equal(await realpath(sourceRoot), sourceRoot);
  const disk = await statfs(ROOT);
  assert.ok(disk.bavail * disk.bsize > 8 * 1024 ** 3,
    'A vector extraction requires at least 8 GiB free');
  const auditBinding = await binding(path.join(ROOT, AUDIT));
  assert.equal(auditBinding.sha256, AUDIT_SHA);
  const audit = JSON.parse(await readFile(path.join(ROOT, AUDIT), 'utf8'));
  assert.deepEqual(audit.members.map((member) => member.animationId), IDS);
  const tools = {launcher: await binding(FFDEC), jar: await binding(JAR)};
  assert.equal(tools.launcher.sha256,
    '1a242c6333aa8dba0f18f635f9ea2585a988f4131aa5164b70eb00ad9e662bab');
  assert.equal(tools.jar.sha256,
    '090ab695053ad94cba6408574c7d7eea20ec60b6ae789ee6056a23f45106762f');
  const destination = path.join(ROOT, RUN);
  await mkdir(destination);
  const help = await run(FFDEC, ['-help', '-export'], {encoding: 'buffer'});
  assert.equal(help.stderr.length, 0);
  await writeFile(path.join(destination, 'ffdec-export-help.txt'), help.stdout,
    {flag: 'wx'});
  const pages = [];
  let totalBytes = 0;
  for (const member of audit.members) {
    const source = path.join(sourceRoot, member.source.path);
    const sourceBinding = await binding(source);
    assert.equal(sourceBinding.sha256, member.source.sha256);
    assert.equal(sourceBinding.bytes, member.source.bytes);
    assert.equal((await lstat(source)).mode & 0o222, 0);
    const directory = path.join(destination, member.animationId);
    await mkdir(directory);
    const main = member.exactMainTimeline;
    const operations = [
      {name: 'source-xml', args: ['-swf2xml', source,
        path.join(directory, 'source.xml')]},
      {name: 'main-frames', args: ['-format', 'sprite:svg', '-select',
        `${main.objectId}:1-${main.frameCount}`, '-selectid',
        String(main.objectId), '-export', 'sprite',
        path.join(directory, 'main-frames'), source]},
      {name: 'root-frame6', args: ['-format', 'frame:svg', '-select', '0:6',
        '-export', 'frame', path.join(directory, 'root-frame6'), source]},
    ];
    const commands = [];
    try {
      for (const operation of operations) {
        const args = ['-onerror', 'abort', '-timeout', '120',
          '-exportTimeout', '600', ...operation.args];
        const result = await run(FFDEC, args, {encoding: 'buffer',
          timeout: 660_000, maxBuffer: 16 * 1024 ** 2});
        await writeFile(path.join(directory, `${operation.name}.stdout.txt`),
          result.stdout, {flag: 'wx'});
        await writeFile(path.join(directory, `${operation.name}.stderr.txt`),
          result.stderr, {flag: 'wx'});
        assert.equal(result.stderr.length, 0);
        if (operation.name === 'source-xml') {
          assert.equal(result.stdout.length, 0);
          assert.match(await readFile(path.join(directory, 'source.xml'),
            'utf8'), /_generator="JPEXS Free Flash Decompiler v\.26\.2\.1"/u);
        } else {
          assert.ok(result.stdout.toString().startsWith(
            'JPEXS Free Flash Decompiler v.26.2.1'));
        }
        commands.push({operation: operation.name,
          args: args.map((argument) => argument === source
            ? '<hash-bound-preserved-source>'
            : argument.replace(destination, '<run-root>'))});
      }
      const frames = (await inventory(path.join(directory, 'main-frames')))
        .filter((file) => file.path.endsWith('.svg'));
      assert.equal(frames.length, main.frameCount);
      assert.deepEqual(frames.map((file) => Number(path.basename(file.path,
        '.svg'))).sort((a, b) => a - b),
      Array.from({length: main.frameCount}, (_, index) => index + 1));
      assert.equal((await binding(source)).sha256, sourceBinding.sha256);
      const files = await inventory(directory);
      totalBytes += files.reduce((sum, file) => sum + file.bytes, 0);
      assert.ok(totalBytes < 3 * 1024 ** 3, 'A raw vectors exceed 3 GiB budget');
      const receipt = {animationId: member.animationId,
        source: {...sourceBinding, path: member.source.path},
        main, commands, files, gates};
      await writeFile(path.join(directory, 'page-extraction.json'),
        json(receipt), {flag: 'wx'});
      pages.push(receipt);
      process.stdout.write(`${member.animationId}: ${frames.length} source ` +
        `vector frames extracted\n`);
    } catch (error) {
      await writeFile(path.join(directory, 'failure.json'), json({
        status: 'failed-retained', animationId: member.animationId,
        source: sourceBinding, commands, message: error.message, gates}),
      {flag: 'wx'});
      throw error;
    }
  }
  const receipt = {schemaVersion: 1, runId: path.basename(RUN),
    status: 'source-vector-extraction-only',
    builder: await binding(fileURLToPath(import.meta.url)), audit: auditBinding,
    toolchain: await binding(path.join(ROOT, 'catalog/toolchain.json')), tools,
    help: await binding(path.join(destination, 'ffdec-export-help.txt')),
    pages, totalBytes,
    limitations: ['Static FFDec vectors do not execute source ActionScript.',
      'Independent child playheads and maintained interaction overlays require '
        + 'source-derived composition before product calibration.'], gates};
  await writeFile(path.join(destination, 'extraction.json'), json(receipt),
    {flag: 'wx'});
  return {output: RUN, pageCount: pages.length,
    mainFrameCount: pages.reduce((sum, page) => sum + page.main.frameCount, 0),
    totalBytes, gates};
}

if (process.argv[1] && path.resolve(process.argv[1]) ===
    fileURLToPath(import.meta.url)) {
  extractAlgL11AInstructionalVisuals().then((result) =>
    process.stdout.write(json(result))).catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
