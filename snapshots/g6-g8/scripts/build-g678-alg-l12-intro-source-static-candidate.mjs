#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {mkdir, readFile, realpath, lstat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';

import {buildSafeRuntime} from './build-safe-ffdec-canvas-adapter.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'shared-alg001-l12-p001';
const WORK = `migrations/${ID}`;
const SOURCE_REL = 'G6-G8-shared/ALG001/L12/IR/L12IR01.swf';
const SOURCE_SHA = '393da0d6755e706bf849a2cff0796823e129fa6bc7f438b93d09c05547679b67';
const PEER_SPEC = 'work/g678-shared-page-factory/g678-alg-l11-intro-terminal-tranche1-current-js-4-v1/members/shared-alg001-l11-p001/adapter-spec.json';
const PEER_SPEC_SHA = '22ee4fbf7059cf8fcfb5f973767cfa34c456b163c90a92b7535047cb1292eb13';
const XML_SHA = '893dcf4845bf4d7ecd1b44bfae9b9710420a9b358ec4bc530e330032e081743a';
const FRAMES_SHA = 'fcf1c289026488b0e7ec921f250ecc3e5081cef6e7fb2de018ccbc8b5c6f9818';
const HELPER_SHA = '78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93';
const AUDIT = `${WORK}/SOURCE_AUDIT_2026-09-25.md`;
const OUTPUT = `${WORK}/candidate`;
const WORK_RUNTIME = `work/g678-shared-page-factory/g678-alg-l12-intro-current-js-v1/members/${ID}/canvas-renderer.js`;
const FRAME_PATH = `${WORK}/audit/ffdec-26.2.1-canvas-v1/sprites/DefineSprite_142/frames.html`;
const HELPER_PATH = `${WORK}/audit/ffdec-26.2.1-canvas-v1/sprites/DefineSprite_142/canvas.js`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function bound(relative, expected) {
  const bytes = await readFile(path.join(ROOT, relative));
  assert(sha256(bytes) === expected, `${relative}: source drift`);
  return bytes;
}

function replaceOnce(source, original, replacement) {
  const first = source.indexOf(original);
  assert(first >= 0 && source.indexOf(original, first + original.length) < 0,
    `runtime marker drift: ${original.slice(0, 80)}`);
  return source.slice(0, first) + replacement +
    source.slice(first + original.length);
}

async function put(relative, bytes, check) {
  const target = path.join(ROOT, relative);
  if (check) {
    assert((await readFile(target)).equals(bytes), `${relative}: generated output drift`);
  } else {
    await writeFile(target, bytes, {flag: 'wx'});
  }
}

async function main() {
  const check = process.argv.length === 3 && process.argv[2] === '--check';
  const materialize = process.argv.length === 3 && process.argv[2] === '--materialize';
  assert(process.argv.length === 2 || check || materialize,
    'usage: build-g678-alg-l12-intro-source-static-candidate.mjs [--check|--materialize]');
  const sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT;
  assert(sourceRoot, 'HELP_MATH_G678_SOURCE_ROOT is required');
  assert(sourceRoot === '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware',
    'source root must be the physical AWS Grade-Classified Courseware directory');
  const sourcePath = path.join(sourceRoot, SOURCE_REL);
  const [sourceRootInfo, sourceInfo] = await Promise.all([
    lstat(sourceRoot), lstat(sourcePath),
  ]);
  assert(sourceRootInfo.isDirectory() && !sourceRootInfo.isSymbolicLink() &&
    await realpath(sourceRoot) === sourceRoot,
  'source root must be a physical directory');
  assert(sourceInfo.isFile() && !sourceInfo.isSymbolicLink() &&
    await realpath(sourcePath) === sourcePath,
  'source SWF must be a physical file');
  const source = await readFile(sourcePath);
  assert(source.length === 71457 && sha256(source) === SOURCE_SHA,
    'L12 Introduction source SWF drift');

  const peer = JSON.parse(await bound(PEER_SPEC, PEER_SPEC_SHA));
  assert(peer.finalAnimationId === 'shared-alg001-l11-p001' &&
    peer.timeline.local.timelineId === 'sprite-142' &&
    peer.timeline.local.frameCount === 130 &&
    peer.runtimeContract.kind === 'structural-local-frame',
  'calibrated source-static peer contract drift');
  const xml = (await bound(`${WORK}/audit/movie.xml`, XML_SHA)).toString('utf8');
  assert(xml.includes('<DefineSprite objectID="142" frames="130">') &&
    xml.includes('<PlaceObject2 replace="0" depth="1" objectID="142" morph="5" name="animation">') &&
    xml.includes('<Transform transX="8248" transY="5666"/>'),
  'L12 intro root/child identity drift');
  const [frames, helper, audit] = await Promise.all([
    bound(FRAME_PATH, FRAMES_SHA),
    bound(HELPER_PATH, HELPER_SHA),
    readFile(path.join(ROOT, AUDIT)),
  ]);
  const frameText = frames.toString('utf8').replace(/\r\n?/gu, '\n');
  const canvas = frameText.match(/<canvas\s+id="myCanvas"\s+width="(\d+)"\s+height="(\d+)"/u);
  const header = frameText.match(/function\s+sprite142\(ctx,ctrans,frame,ratio,time\)\{\s*ctx\.save\(\);\s*ctx\.transform\(1,0,0,1,([-0-9.]+),([-0-9.]+)\);\s*var clips = \[\];\s*var frame_cnt = (\d+);/u);
  assert(canvas && Number(canvas[1]) === 506 && Number(canvas[2]) === 24 &&
    header && Number(header[1]) === 242.1 && Number(header[2]) === 15.05 &&
    Number(header[3]) === 130,
  'source-specific L12 drawing export drift');

  const spec = structuredClone(peer);
  spec.animationId = `course-${ID}`;
  spec.builderAnimationId = spec.animationId;
  spec.finalAnimationId = ID;
  spec.classification = 'private-g678-alg-l12-intro-source-static-local-candidate';
  spec.title = `${ID} source-bound local candidate`;
  spec.source = {swf: `$HELP_MATH_G678_SOURCE_ROOT/${SOURCE_REL}`,
    swfBytes: source.length, swfSha256: SOURCE_SHA};
  spec.evidence = {scenarioInventory: AUDIT,
    scenarioInventorySha256: sha256(audit),
    audioAudit: AUDIT, audioAuditSha256: sha256(audit)};
  Object.assign(spec.ffdecExport, {
    helper: HELPER_PATH, helperSha256: HELPER_SHA, helperBytes: helper.length,
    framesHtml: FRAME_PATH, framesHtmlSha256: FRAMES_SHA,
    framesHtmlBytes: frames.length,
    exportCanvas: {width: 506, height: 24},
    exportInternalTranslation: {x: 242.1, y: 15.05},
  });
  spec.timeline.stageRenderOffset = {x: 170.3, y: 268.25};
  spec.runtimeContract.unresolved = [
    'Local Canvas drawing candidate only; source audit is not a complete scenario or audio acceptance inventory.',
    'Embedded audio is not rendered or accepted; language, synchronization and listening remain open.',
    'My Lesson, registration, original runtime, fidelity, human, Owner, strict, release and publication gates remain open.',
  ];
  spec.output = {script: `${OUTPUT}/canvas-renderer.js`,
    manifest: `${OUTPUT}/adapter-manifest.json`,
    spec: `${OUTPUT}/adapter-spec.json`,
    globalRegistry: 'HELP_MATH_CANVAS_ASSETS'};

  const built = buildSafeRuntime({helperSource: helper.toString('utf8'),
    framesHtml: frameText, spec});
  let runtime = built.runtime;
  assert(runtime.includes('ctx.transform(1, 0, 0, 1, 170.3, 268.25);'),
    'source-specific placement transform drift');
  const alias = JSON.stringify(spec.animationId);
  assert(runtime.split(alias).length - 1 >= 2, 'builder alias drift');
  runtime = runtime.split(alias).join(JSON.stringify(ID));
  runtime = replaceOnce(runtime,
    `registry[${JSON.stringify(ID)}] = Object.freeze({metadata: METADATA, ready: ready, resolveFrameState: resolveFrameState, render: render});`,
    `Object.defineProperty(registry, ${JSON.stringify(ID)}, {value: Object.freeze({metadata: METADATA, ready: ready, resolveFrameState: resolveFrameState, render: render}), configurable: false, enumerable: true, writable: false});`);
  new Script(runtime, {filename: `${ID}-canvas-renderer.js`});
  assert(!/\b(?:eval|Function|fetch|XMLHttpRequest|WebSocket|setInterval|setTimeout|localStorage|sessionStorage)\s*\(/u.test(runtime),
    'generated runtime contains blocked primitive');
  const specBytes = Buffer.from(`${JSON.stringify(spec, null, 2)}\n`);
  const runtimeBytes = Buffer.from(runtime);
  const manifest = {schemaVersion: 1, animationId: ID,
    status: 'local-candidate-not-registered',
    source: {path: SOURCE_REL, bytes: source.length, sha256: SOURCE_SHA},
    peerSpec: {path: PEER_SPEC, sha256: PEER_SPEC_SHA},
    ffdec: {frames: {path: FRAME_PATH, sha256: FRAMES_SHA},
      helper: {path: HELPER_PATH, sha256: HELPER_SHA}},
    output: {spec: {path: `${OUTPUT}/adapter-spec.json`, sha256: sha256(specBytes)},
      runtime: {path: `${OUTPUT}/canvas-renderer.js`,
        bytes: runtimeBytes.length, sha256: sha256(runtimeBytes)}},
    acceptanceEffects: {currentJavaScriptRegistered: false,
      fidelityAccepted: false, audioAccepted: false, strictComplete: false}};
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
  if (!check && !materialize) await mkdir(path.join(ROOT, OUTPUT), {recursive: true});
  await put(`${OUTPUT}/adapter-spec.json`, specBytes, check || materialize);
  await put(`${OUTPUT}/canvas-renderer.js`, runtimeBytes, check || materialize);
  await put(`${OUTPUT}/adapter-manifest.json`, manifestBytes, check || materialize);
  if (materialize) {
    await mkdir(path.dirname(path.join(ROOT, WORK_RUNTIME)), {recursive: true});
    await put(WORK_RUNTIME, runtimeBytes, false);
  } else if (check) {
    await put(WORK_RUNTIME, runtimeBytes, true);
  }
  console.log(JSON.stringify({animationId: ID, check,
    runtimeSha256: sha256(runtimeBytes), bytes: runtimeBytes.length,
    currentJavaScriptRegistered: false}));
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
