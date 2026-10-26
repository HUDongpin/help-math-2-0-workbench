#!/usr/bin/env node
// One source-locked candidate audit only; no registry/family/acceptance authority.
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, readdir, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {parseSwfSourceFacts} from './build-g4-l3-machine-source-audits.mjs';
import {rootDoActions} from './review-g678-pure-linear-exact-scripts.mjs';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const RUN = 'work/g678-shared-page-factory/g678-nms-l01-p042-source-audit-v1';
export const ID = 'shared-nms002-l01-p042';
export const SOURCE = {path: 'G6-G8-shared/NMS002/L1/TS/L1TS06.swf', bytes: 55501,
  sha256: 'c81f09a098702054a62ac8a7307aca1ac80d305ebe2cf432cfab05a2a7f74f82'};
export const FALSE_GATES = Object.freeze({currentJavaScriptRegistered: false, productCalibrationPassed: false,
  scaleOutAuthorized: false, authoritativeOriginalRuntime: false, visualFidelityAccepted: false,
  audioIntegrated: false, audioAccepted: false, humanVisualAccepted: false, ownerAccepted: false,
  strictComplete: false, released: false, published: false});
const TOOLS_RECEIPT = {path: 'work/g678-shared-page-factory/g678-ts07-nms-l1-current-js-1-v1/run-manifest.json',
  bytes: 32104, sha256: '248d3c39d3ab09dc231cdd82a629802b0e38a7355fe778e036fd6c0704b5b158'};
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const json = value => JSON.stringify(value, null, 2) + '\n';
export const desc = ({buffer, ...rest}) => rest;
export async function file(input, expected) {
  const full = path.isAbsolute(input) ? input : path.join(ROOT, input), before = await lstat(full, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n && await realpath(full) === full);
  const buffer = await readFile(full), after = await lstat(full, {bigint: true});
  for (const key of ['ino', 'dev', 'size', 'mode', 'mtimeNs', 'nlink']) assert.equal(before[key], after[key]);
  const result = {path: input, bytes: buffer.length, sha256: hash(buffer), buffer};
  if (expected) assert.deepEqual(desc(result), expected); return result;
}
export async function verifySource() {
  const sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT;
  assert.ok(sourceRoot && path.isAbsolute(sourceRoot) && await realpath(sourceRoot) === sourceRoot);
  const full = path.join(sourceRoot, SOURCE.path), input = await file(full);
  assert.equal((await lstat(full)).mode & 0o222, 0);
  assert.deepEqual({...desc(input), path: SOURCE.path}, SOURCE); return input;
}
async function inventory(directory, base = directory) {
  const rows = [];
  for (const entry of (await readdir(directory, {withFileTypes: true})).sort((a,b) => a.name.localeCompare(b.name))) {
    assert.ok(!entry.isSymbolicLink()); const p = path.join(directory, entry.name);
    if (entry.isDirectory()) rows.push(...await inventory(p, base));
    else rows.push({...desc(await file(p)), path: path.relative(base, p)});
  }
  return rows;
}
export async function extract({check = false} = {}) {
  const source = await verifySource(), destination = path.join(ROOT, RUN);
  if (check) {
    const receipt = JSON.parse((await file(`${RUN}/extraction.json`)).buffer);
    assert.deepEqual(receipt.source, SOURCE); assert.deepEqual(receipt.gates, FALSE_GATES);
    await file(receipt.builder.path, receipt.builder);
    for (const item of receipt.files) await file(`${RUN}/${item.path}`, {...item, path: `${RUN}/${item.path}`});
    const actual = (await inventory(destination)).filter(item => item.path !== 'extraction.json');
    assert.deepEqual(actual, receipt.files); return {check: true, run: RUN, files: actual.length};
  }
  for (const key of ['FFDEC_JARFILENAME','FFDEC_MEMORY','FFDEC_STACK_SIZE','JAVA_TOOL_OPTIONS','JDK_JAVA_OPTIONS','_JAVA_OPTIONS','CLASSPATH'])
    assert.equal(process.env[key], undefined, `Unsupported active Java/FFDec override: ${key}`);
  const previousToolReceipt = await file(TOOLS_RECEIPT.path, TOOLS_RECEIPT);
  const toolchain = JSON.parse(previousToolReceipt.buffer).toolchain;
  const bindings = [toolchain.ffdec.launcher, toolchain.ffdec.jar, toolchain.ffdec.java,
    ...toolchain.ffdec.jarManifest.classPath, toolchain.swfmill];
  for (const value of bindings) {
    const observed = await file(value.realPath); assert.equal(observed.bytes, value.bytes); assert.equal(observed.sha256, value.sha256);
  }
  const facts = parseSwfSourceFacts(source.buffer);
  assert.equal(facts.header.rootFrameCount, 10); assert.equal(facts.header.fps, 12);
  assert.equal(facts.header.stage.width, 800); assert.equal(facts.header.stage.height, 600);
  assert.deepEqual(facts.frameDomains.longestStaticallyRootReachableDomain, {domainId: 'sprite-23', declaredFrameCount: 125});
  assert.equal(facts.actionScript.tagCounts.DoAction, 3); assert.equal(facts.tagCounts.DefineButton2 ?? 0, 0);
  assert.equal(facts.audio.tagCounts.SoundStreamBlock, 118);
  assert.deepEqual(rootDoActions(source.buffer), [
    {frame: 1, bytes: 73, sha256: '8230b64765b935120a08654ce7e74ecfc3eaa3f00b90379acca03918e38dd9ac'},
    {frame: 6, bytes: 2, sha256: '0a6361b3a802f55cd5ae06101c88a1e216320fe11cc0cfe1d791eed08a1200fd'},
  ]);
  await mkdir(destination); // Exclusive: retained attempts never overwritten.
  await writeFile(path.join(destination, 'source.swf'), source.buffer, {flag: 'wx', mode: 0o444});
  await writeFile(path.join(destination, 'source-facts.json'), json(facts), {flag: 'wx', mode: 0o444});
  const java = toolchain.ffdec.java.realPath, jar = toolchain.ffdec.jar.realPath;
  const prefix = ['-Djava.net.preferIPv4Stack=true', '-Djna.nosys=true', '-Djava.util.Arrays.useLegacyMergeSort=true',
    '-Xmx1024m', '-Djava.awt.headless=true', '-jar', jar];
  const commands = [];
  async function run(name, executable, args) {
    try {
      const result = await promisify(execFile)(executable, args, {cwd: ROOT, encoding: 'buffer', maxBuffer: 16*1024*1024, timeout: 120000});
      await writeFile(path.join(destination, `${name}-stdout.txt`), result.stdout, {flag: 'wx'});
      await writeFile(path.join(destination, `${name}-stderr.txt`), result.stderr, {flag: 'wx'});
      assert.equal(result.stderr.length, 0, `${name} emitted stderr`);
      commands.push({name, command: executable, args, exitCode: 0}); return result;
    } catch (error) {
      await writeFile(path.join(destination, `${name}-failure.json`), json({name, executable, args,
        message: String(error.message), stdout: error.stdout?.toString(), stderr: error.stderr?.toString(), gates: FALSE_GATES}), {flag: 'wx'});
      throw error;
    }
  }
  const help = await run('help', java, [...prefix, '-help', '-export']);
  assert.match(help.stdout.toString(), /frame:svg/); assert.match(help.stdout.toString(), /sprite:svg/);
  const copy = path.join(destination, 'source.swf');
  await run('svg', java, [...prefix, '-config', 'packJavaScripts=false', '-onerror', 'abort', '-format',
    'frame:svg,sprite:svg,script:as,text:plain,sound:mp3_wav', '-export', 'frame,sprite,script,text,sound', path.join(destination, 'svg'), copy]);
  await run('canvas', java, [...prefix, '-config', 'packJavaScripts=false', '-onerror', 'abort', '-format',
    'frame:canvas,sprite:canvas', '-export', 'frame,sprite', path.join(destination, 'canvas'), copy]);
  await run('swfmill', toolchain.swfmill.realPath, ['-n', 'swf2xml', copy, path.join(destination, 'source.xml')]);
  await verifySource();
  const copied = await file(`${RUN}/source.swf`); assert.equal(copied.sha256, SOURCE.sha256);
  const files = await inventory(destination);
  const receipt = {schemaVersion: 1, artifactType: 'g678-nms-l01-p042-source-extraction-v1', animationId: ID, runId: path.basename(RUN),
    builder: desc(await file(path.relative(ROOT, fileURLToPath(import.meta.url)))), source: SOURCE,
    toolchainProvenanceOnly: TOOLS_RECEIPT, toolchain, commands, files,
    authority: 'One source-locked engineering candidate extraction; no inherited TS07 or ALG L09 family authority.',
    gates: FALSE_GATES};
  await writeFile(path.join(destination, 'extraction.json'), json(receipt), {flag: 'wx', mode: 0o444});
  return {check: false, run: RUN, files: files.length};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2); assert.ok(args.length <= 1 && (!args.length || args[0] === '--check'));
  console.log(json(await extract({check: args[0] === '--check'})));
}
