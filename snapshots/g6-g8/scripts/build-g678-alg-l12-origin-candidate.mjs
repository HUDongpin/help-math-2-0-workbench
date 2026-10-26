import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile, realpath, lstat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildSafeRuntime} from './build-safe-ffdec-canvas-adapter.mjs';
import {validateOriginRuntime} from './validate-g678-alg-l12-origin-runtime.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'shared-alg001-l12-p011';
const WORK = `migrations/${ID}`;
const OUTPUT = `${WORK}/candidate-v2`;
const CANONICAL = `work/g678-shared-page-factory/g678-alg-l12-origin-current-js-v1/members/${ID}`;
const EXPORT = `${WORK}/audit/ffdec-26.2.1-canvas-unpacked-v1`;
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE = 'G6-G8-shared/ALG001/L12/VB/L12VB06.swf';
const SOURCE_SHA = 'c26cce962362fe8aa1782e3cf5c4f358f76f3276af9dce4b14cbe81e0e049655';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function pinned(relative, sha) {
  const bytes = await readFile(path.join(ROOT, relative));
  assert.equal(hash(bytes), sha, `drift: ${relative}`);
  return bytes;
}
function definitions(html) {
  const start = html.indexOf('var scalingGrids = {};');
  const end = html.indexOf('\nvar frame = -1;');
  assert(start >= 0 && end > start, 'FFDec boundaries');
  return html.slice(start, end);
}
function once(source, old, replacement) {
  assert.equal(source.split(old).length, 2, `unique marker: ${old.slice(0, 70)}`);
  return source.replace(old, replacement);
}

async function main() {
  const promote = process.argv[2] === '--promote';
  const check = process.argv[2] === '--check' || promote;
  assert(process.argv.length === 2 || (process.argv.length === 3 && check));
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT, SOURCE_ROOT);
  assert((await lstat(SOURCE_ROOT)).isDirectory());
  assert.equal(await realpath(SOURCE_ROOT), SOURCE_ROOT);
  const sourceFile = path.join(SOURCE_ROOT, SOURCE);
  assert.equal(await realpath(sourceFile), sourceFile);
  const source = await readFile(sourceFile);
  assert.equal(source.length, 52188);
  assert.equal(hash(source), SOURCE_SHA);
  await pinned(`${WORK}/audit/movie.xml`, '79737d87ff67635067aba29581eca826d0c0c40c1f6942b2785c4eeddf1c9c2f');
  const peerPath = 'work/g678-shared-page-factory/g678-vb03-l1-current-js-9-v1/members/shared-alg001-l12-p008/adapter-spec.json';
  const spec = JSON.parse(await pinned(peerPath, 'b961298124689ee48676bde1692e9caf4c424cbf1ce54193aeeb08d68269197d'));
  const mainPath = `${EXPORT}/DefineSprite_33/frames.html`;
  const titlePath = `${EXPORT}/DefineSprite_2/frames.html`;
  const mainBytes = await pinned(mainPath, 'db0e876708566c4750753feb7cadcd3ce59bb72299c49f951a00d9cbdb3378ab');
  const titleBytes = await pinned(titlePath, '33b3ba1bbb53569ca5b6fab60f216aa2296f5fd3c5375d989a2a8ac8ef94f1ab');
  const helperPath = `${EXPORT}/DefineSprite_33/canvas.js`;
  const helper = await pinned(helperPath, '78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93');
  let html = mainBytes.toString().replace(/\r\n?/g, '\n');
  const titleHtml = titleBytes.toString().replace(/\r\n?/g, '\n');
  const mainDefs = definitions(html);
  const titleDefs = definitions(titleHtml).replace('var scalingGrids = {};', '');
  const names = text => [...text.matchAll(/function\s+([\w$]+)\s*\(/g)].map(m => m[1]);
  const mainNames = new Set(names(mainDefs));
  assert(names(titleDefs).every(n => !mainNames.has(n)), 'title function collision');
  const titleHeader = titleDefs.match(/function sprite2\(ctx,ctrans,frame,ratio,time\)\{\s*ctx.save\(\);\s*ctx.transform\(1,0,0,1,([-\d.]+),([-\d.]+)\);\s*var clips = \[\];\s*var frame_cnt = 1;/);
  assert(titleHeader, 'one-frame source title');
  html = once(html, '\nvar frame = -1;', `${titleDefs}\nvar frame = -1;`);
  const defs = definitions(html);
  const placed = [...new Set([...defs.matchAll(/place\("([\w$]+)"/g)].map(m => m[1]))].sort();
  const fonts = [...defs.matchAll(/function\s+(font\d+)\(ctx,ch,textColor\)\{/g)].map(m => m[1]);
  assert.equal(placed.length, 29);
  assert.equal(fonts.length, 1);
  const auditPath = `${WORK}/SOURCE_AUDIT_2026-09-26.md`;
  const audit = await readFile(path.join(ROOT, auditPath));
  Object.assign(spec, {animationId: `course-${ID}`, builderAnimationId: `course-${ID}`,
    finalAnimationId: ID, classification: 'private-two-layer-origin-candidate', title: 'Origin'});
  spec.source = {swf: `$HELP_MATH_G678_SOURCE_ROOT/${SOURCE}`, swfBytes: source.length, swfSha256: SOURCE_SHA};
  spec.evidence = {scenarioInventory: auditPath, scenarioInventorySha256: hash(audit),
    audioAudit: auditPath, audioAuditSha256: hash(audit)};
  Object.assign(spec.ffdecExport, {helper: helperPath, helperSha256: hash(helper), helperBytes: helper.length,
    framesHtml: mainPath, framesHtmlSha256: hash(mainBytes), framesHtmlBytes: mainBytes.length,
    targetSpriteObjectId: 33, targetSpriteFunction: 'sprite33',
    exportCanvas: {width: 572, height: 357}, exportInternalTranslation: {x: 372.55, y: 203.2},
    expectedPlacedFunctionCount: placed.length, expectedPlacedFunctionsSha256: hash(JSON.stringify(placed)),
    expectedFontFunctionCount: fonts.length, expectedFontFunctionsSha256: hash(JSON.stringify(fonts)),
    embeddedImageVariableCount: 0, embeddedImageVariablesSha256: hash('[]')});
  spec.timeline.root = {...spec.timeline.root, placementDepth: '3', placementTwips: {x: 8248, y: 5666}, placementPixels: {x: 412.4, y: 283.3}};
  spec.timeline.local = {timelineId: 'sprite-33', frameCount: 118, livePlaybackEndFrame: 118, playbackMode: 'once', publicFrameIndexing: 'one-indexed'};
  spec.timeline.stageRenderOffset = {x: 412.4 - 372.55, y: 283.3 - 203.2};
  spec.runtimeContract.unresolved = ['Glossary actions require the maintained host and six source-frame-bound controls.',
    'Embedded and external audio timing/language/listening unresolved.',
    'Original runtime, fidelity, human/Owner acceptance and publication remain open.'];
  spec.output = {script: `${OUTPUT}/canvas-renderer.js`, manifest: `${OUTPUT}/adapter-manifest.json`,
    spec: `${OUTPUT}/adapter-spec.json`, globalRegistry: 'HELP_MATH_CANVAS_ASSETS'};
  spec.sourceComposition = {title: {path: titlePath, sha256: hash(titleBytes), sprite: 2,
    rootDepth: 1, rootPosition: {x: 400, y: 42.85}}, mainSprite: 33, mainRootDepth: 3};
  let runtime = buildSafeRuntime({helperSource: helper.toString(), framesHtml: html, spec}).runtime;
  const marker = `        ctx.transform(1, 0, 0, 1, ${spec.timeline.stageRenderOffset.x}, ${spec.timeline.stageRenderOffset.y});`;
  runtime = once(runtime, marker, `        ctx.save();\n        ctx.transform(1, 0, 0, 1, ${400 - Number(titleHeader[1])}, ${42.85 - Number(titleHeader[2])});\n        sprite2(ctx, new cxform(0,0,0,0,255,255,255,255), 0, 0, 0);\n        ctx.restore();\n${marker}`);
  runtime = runtime.split(JSON.stringify(spec.animationId)).join(JSON.stringify(ID));
  // FFDec mask compositing changes reused Canvas raster state in Chromium.
  // A fresh per-frame surface makes frame requests independent of prior draws.
  runtime = once(runtime, 'var registry = global[', `var sourceFrameRender = render;
render = function(targetCanvas, request) {
    if (targetCanvas.width !== 800 || targetCanvas.height !== 600) {
        throw new Error("targetCanvas must be exactly 800x600");
    }
    var surface = document.createElement("canvas");
    surface.width = 800;
    surface.height = 600;
    surface.getContext("2d", {willReadFrequently: true});
    var state = sourceFrameRender(surface, request);
    var targetContext = targetCanvas.getContext("2d");
    targetContext.save();
    try {
        targetContext.setTransform(1,0,0,1,0,0);
        targetContext.globalAlpha = 1;
        targetContext.globalCompositeOperation = "copy";
        targetContext.drawImage(surface,0,0);
    } finally { targetContext.restore(); }
    ["data-flash-frame", "data-flash-frame-domain", "data-flash-root-frame", "data-runtime-scenario", "data-runtime-seed"].forEach(function(name) {
        targetCanvas.setAttribute(name, surface.getAttribute(name));
    });
    return state;
};
var registry = global[`);
  validateOriginRuntime(runtime);
  const manifest = {schemaVersion: 1, animationId: ID, status: 'unregistered-two-layer-drawing-candidate',
    sourceSha256: SOURCE_SHA, runtimeSha256: hash(runtime), runtimeBytes: Buffer.byteLength(runtime),
    titleAndMainComposed: true, sourceComposition: spec.sourceComposition,
    acceptanceEffects: {currentJavaScriptRegistered: false, audioAccepted: false, fidelityAccepted: false, strictComplete: false}};
  if (!check) await mkdir(path.join(ROOT, OUTPUT), {recursive: true});
  for (const [name, bytes] of [['adapter-spec.json', `${JSON.stringify(spec, null, 2)}\n`],
    ['canvas-renderer.js', runtime], ['adapter-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`]]) {
    const file = path.join(ROOT, OUTPUT, name);
    if (check) assert.equal(await readFile(file, 'utf8'), bytes, `generated drift: ${name}`);
    else await writeFile(file, bytes, {flag: 'wx'});
  }
  if (promote) {
    // Promotion changes custody only; it never registers or accepts the page.
    await mkdir(path.join(ROOT, CANONICAL), {recursive: true});
    const file = path.join(ROOT, CANONICAL, 'canvas-renderer.js');
    try {
      await writeFile(file, runtime, {flag: 'wx'});
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      assert.equal(await readFile(file, 'utf8'), runtime, 'canonical runtime drift');
    }
    console.log(JSON.stringify({canonicalRuntime: `${CANONICAL}/canvas-renderer.js`,
      sha256: hash(runtime), bytes: Buffer.byteLength(runtime), registrationEffect: 'none'}));
  }
  console.log(JSON.stringify(manifest));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
