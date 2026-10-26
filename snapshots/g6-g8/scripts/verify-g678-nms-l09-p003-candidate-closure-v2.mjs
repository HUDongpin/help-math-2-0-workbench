#!/usr/bin/env node
// Read-only provenance check for the unregistered P003 drawing candidate.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {build} from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const LOCK = 'migrations/shared-nms002-l09-p003/audit/CANDIDATE_CLOSURE_V2.json';
const ROOT_V1 = 'work/g678-shared-page-factory/g678-nms-l09-p003-root-held-candidate-v1';
const ROOT_V2 = 'work/g678-shared-page-factory/g678-nms-l09-p003-root-held-candidate-v2';
const NATIVE = 'work/g678-shared-page-factory/g678-nms-l09-p003-native-candidate-v1';
const VARIANT = '/Volumes/American Dream/hudongpin/g678-p003-text-variant-20260923-v5';
const RAW = '/Volumes/American Dream/hudongpin/g678-p003-root-HMhJ2h';
const SOURCE_SWF = 'G6-G8-shared/NMS002/L9/RW/L9RW03.swf';
const INPUTS = Object.freeze({
  sourceSwf: path.join(SOURCE_ROOT, SOURCE_SWF),
  ffdecLauncher: '/Users/peter/Applications/FFDec.app/Contents/Resources/ffdec.sh',
  ffdecJar: '/Users/peter/Applications/FFDec.app/Contents/Resources/ffdec.jar',
  toolchain: 'catalog/toolchain.json',
  packageLock: 'package-lock.json',
  rootIr: 'migrations/shared-nms002-l09-p003/audit/ROOT_HELD_NESTED_DRAWING_V1.json',
  audioInventory: 'migrations/shared-nms002-l09-p003/audio-inventory.csv',
  rawFrames: path.join(RAW, 'frames.html'),
  rawHelper: path.join(RAW, 'canvas.js'),
  historicalRootRuntime: `${ROOT_V1}/canvas-renderer.js`,
  currentRootRuntime: `${ROOT_V2}/canvas-renderer.js`,
  currentRootSpec: `${ROOT_V2}/adapter-spec.json`,
  currentRootManifest: `${ROOT_V2}/candidate-manifest.json`,
  variantRuntime: path.join(VARIANT, 'canvas-renderer-with-text.js'),
  variantBinding: path.join(VARIANT, 'binding.json'),
  variantManifest: path.join(VARIANT, 'manifest.json'),
  localRuntime: `${NATIVE}/canvas-renderer.js`,
  localBinding: `${NATIVE}/binding.json`,
  localManifest: `${NATIVE}/manifest.json`,
});
const ENTRIES = Object.freeze([
  'scripts/build-g678-nms-l09-p003-root-canvas-candidate.mjs',
  'scripts/build-g678-nms-l09-p003-text-variant-v1.mts',
  'scripts/prepare-g678-nms-l09-p003-local-runtime-v1.mjs',
]);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const localPath = value => path.isAbsolute(value) ? value : path.join(ROOT, value);

async function ordinaryBytes(value) {
  const full = localPath(value);
  const metadata = await lstat(full);
  assert(metadata.isFile() && !metadata.isSymbolicLink() && metadata.nlink === 1,
    `P003 closure requires an ordinary single-link file: ${value}`);
  return readFile(full);
}

async function sourceGraph() {
  const result = await build({entryPoints: ENTRIES, absWorkingDir: ROOT,
    bundle: true, platform: 'node', format: 'esm', packages: 'external',
    write: false, outdir: 'unused-output', metafile: true, logLevel: 'silent'});
  const files = await Promise.all(Object.keys(result.metafile.inputs).sort().map(
    async value => {
      assert(!path.isAbsolute(value) && !value.startsWith('..'),
        `P003 generator graph escaped worktree: ${value}`);
      const bytes = await ordinaryBytes(value);
      return {path: value, bytes: bytes.length, sha256: sha(bytes)};
    }));
  return {files, sha256: sha(Buffer.from(JSON.stringify(files)))};
}

export function assertP003CandidateRelations(bytes, graph) {
  const ir = JSON.parse(bytes.rootIr);
  const spec = JSON.parse(bytes.currentRootSpec);
  const root = JSON.parse(bytes.currentRootManifest);
  const variant = JSON.parse(bytes.variantManifest);
  const toolchain = JSON.parse(bytes.toolchain);
  assert.equal(ir.animationId, 'shared-nms002-l09-p003');
  assert.equal(ir.source.sha256, sha(bytes.sourceSwf));
  assert.equal(ir.ffdec.framesHtml.sha256, sha(bytes.rawFrames));
  assert.equal(ir.ffdec.helper.sha256, sha(bytes.rawHelper));
  assert.equal(toolchain.flashForensics.ffdec.version, '26.2.1');
  assert.equal(toolchain.flashForensics.ffdec.releaseAssetSha256,
    'a160249e037115b935db253e993a6c00694f5d89bc4808c379e9a08a4034795c');
  assert.equal(spec.evidence.audioAuditSha256, sha(bytes.audioInventory));
  assert.equal(spec.ffdecExport.framesHtmlSha256, sha(bytes.rawFrames));
  assert.equal(spec.ffdecExport.helperSha256, sha(bytes.rawHelper));
  assert.equal(root.inputs.find(item => item.path.endsWith('audio-inventory.csv'))?.sha256,
    sha(bytes.audioInventory));
  assert.equal(root.outputs.find(item => item.path.endsWith('canvas-renderer.js'))?.sha256,
    sha(bytes.currentRootRuntime));
  assert.equal(root.outputs.find(item => item.path.endsWith('adapter-spec.json'))?.sha256,
    sha(bytes.currentRootSpec));
  assert.equal(sha(bytes.currentRootRuntime), sha(bytes.historicalRootRuntime),
    'current source must reproduce the exact v1 drawing bytes used by the v5 variant');
  assert.equal(variant.inputSafeJavascriptSha256, sha(bytes.currentRootRuntime));
  assert.equal(variant.generatorSha256, graph.files.find(item =>
    item.path === ENTRIES[1])?.sha256);
  assert.equal(variant.bindingSha256, sha(bytes.variantBinding));
  assert.deepEqual(variant.output, {bytes: bytes.variantRuntime.length,
    sha256: sha(bytes.variantRuntime)});
  assert(bytes.localRuntime.equals(bytes.variantRuntime));
  assert(bytes.localBinding.equals(bytes.variantBinding));
  assert(bytes.localManifest.equals(bytes.variantManifest));
  assert.equal(variant.claimBoundary.localOnly, true);
  assert.equal(variant.claimBoundary.registered, false);
}

function checkGenerator(entry, args = []) {
  const result = spawnSync(process.execPath, [...args, entry, '--check'], {
    cwd: ROOT, env: process.env, encoding: 'utf8', timeout: 120_000,
    maxBuffer: 1024 * 1024,
  });
  assert.equal(result.status, 0,
    `${entry} --check failed: ${result.error?.message ?? result.stderr}`);
}

export async function verifyP003CandidateClosure({printLock = false} = {}) {
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT, SOURCE_ROOT,
    'P003 closure requires the real AWS source root');
  assert.equal(await realpath(SOURCE_ROOT), SOURCE_ROOT,
    'P003 source root must not be a symlink');
  assert.equal(await realpath('/opt/homebrew/bin/ffdec'), INPUTS.ffdecLauncher,
    'P003 FFDec launcher path drift');
  const pairs = await Promise.all(Object.entries(INPUTS).map(async ([key, value]) =>
    [key, await ordinaryBytes(value)]));
  const bytes = Object.fromEntries(pairs);
  const graph = await sourceGraph();
  const observed = {schemaVersion: 1,
    kind: 'g678-p003-unregistered-candidate-provenance-closure-v2',
    generatorSourceGraph: graph,
    files: Object.fromEntries(Object.entries(INPUTS).map(([key, value]) =>
      [key, {path: value, bytes: bytes[key].length, sha256: sha(bytes[key])}])),
    claimBoundary: {currentJavaScriptRegistered: false,
      originalRuntimeAccepted: false, audioListeningAccepted: false,
      scaleOutAuthorized: false}};
  if (!printLock) {
    const expected = JSON.parse(await ordinaryBytes(LOCK));
    assert.deepEqual(observed, expected, 'P003 candidate closure pin drift');
  }
  assertP003CandidateRelations(bytes, graph);
  if (!printLock) {
    checkGenerator(ENTRIES[0]);
    checkGenerator(ENTRIES[1], ['--import', 'tsx']);
    checkGenerator(ENTRIES[2]);
  }
  return observed;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const printLock = process.argv.includes('--print-lock');
  verifyP003CandidateClosure({printLock})
    .then(result => process.stdout.write(printLock
      ? `${JSON.stringify(result, null, 2)}\n`
      : `${JSON.stringify({kind: result.kind,
        generatorSourceGraphSha256: result.generatorSourceGraph.sha256,
        sourceSwfSha256: result.files.sourceSwf.sha256,
        currentRootRuntimeSha256: result.files.currentRootRuntime.sha256,
        variantRuntimeSha256: result.files.variantRuntime.sha256,
        registered: false})}\n`))
    .catch(error => {process.stderr.write(`${error.stack ?? error}\n`);
      process.exitCode = 1;});
}
