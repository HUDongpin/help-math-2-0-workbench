#!/usr/bin/env node
/** Reproducible drawing-only candidate for the exact P003 SWF. No registration. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';
import {buildSafeRuntime} from './build-safe-ffdec-canvas-adapter.mjs';
import {normalizeSourceClipMasks} from './lib/g678-source-clip-masks-v1.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = 'G6-G8-shared/ALG001/L6/RW/L6RW03.swf';
const SWF_SHA = 'c3d265b61aedccc48e679cbecfe6424a2a78f2a9cb5cfa2a33791fa124933766';
const AUDIT_DIR = '/Volumes/American Dream/hudongpin/g678-p003-audit.11qugt';
const FRAMES = `${AUDIT_DIR}/ffdec-canvas/sprites/DefineSprite_154/frames.html`;
const HELPER = `${AUDIT_DIR}/ffdec-canvas/sprites/DefineSprite_154/canvas.js`;
const XML = `${AUDIT_DIR}/source.xml`;
const SHA = Object.freeze({
  audit: '26d5e3a113fd0268d678b8831b70deedfa913c84beb017f3c2e1b7f1a71ec35f',
  facts: '4be20ebbdfa9a84ffc5a9a66d492668479fecd0ad47758622c9f6a37b08c1746',
  frames: 'f24c1629fbacaee1b5a6d4845effa344ba528b503f0bc5137910a8fc1b4c2f37',
  helper: '78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93',
  xml: '06a62bfa3791432396d16a1eff2751576b98f13216560220492b59f03c84d72e',
});
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');

function readPinned(file, expected) {
  assert.equal(realpathSync(file), file, `physical file: ${file}`);
  const before = lstatSync(file, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n, `ordinary file: ${file}`);
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  for (const key of ['dev', 'ino', 'size', 'mtimeNs', 'nlink']) assert.equal(before[key], after[key], `stable file: ${file}`);
  assert.equal(sha(bytes), expected, `input hash drift: ${file}`);
  return bytes;
}

export function buildCandidate(sourceRoot) {
  assert(typeof sourceRoot === 'string' && path.isAbsolute(sourceRoot) &&
    realpathSync(sourceRoot) === sourceRoot && lstatSync(sourceRoot).isDirectory() &&
    !lstatSync(sourceRoot).isSymbolicLink(), 'real source root');
  const swf = readPinned(path.join(sourceRoot, SOURCE), SWF_SHA);
  assert.equal(swf.length, 1220637);
  const audit = JSON.parse(readPinned(`${AUDIT_DIR}/source-audit.json`, SHA.audit));
  const facts = JSON.parse(readPinned(`${AUDIT_DIR}/source-facts.json`, SHA.facts));
  assert.equal(audit.source.sha256, SWF_SHA);
  assert.equal(audit.acceptance.currentJsRegistered, false);
  assert.deepEqual(audit.frameDomains.map(d => [d.id, d.frames]), [['root', 10], ['sprite-154', 719], ['sprite-158', 1]]);
  assert.deepEqual(audit.embeddedStream.runs.map(r => [r.firstFrame, r.lastFrame]), [[41, 501], [544, 719]]);
  assert.deepEqual(audit.embeddedStream.gap, {firstFrame: 502, lastFrame: 543});
  const main = facts.frameDomains.domains.find(d => d.domainId === 'sprite-154');
  assert(main && main.declaredFrameCount === 719 && main.scriptTagCount === 1);
  assert.deepEqual(main.placedSpriteIds, []);
  const sourceXml = readPinned(XML, SHA.xml).toString();
  assert(sourceXml.includes('<PlaceObject2 replace="0" depth="1" objectID="154" morph="5" name="animation">\n        <transform>\n          <Transform transX="7390" transY="5060"/>'));
  const frames = readPinned(FRAMES, SHA.frames).toString();
  const helper = readPinned(HELPER, SHA.helper).toString();
  const canvas = frames.match(/<canvas\s+id="myCanvas"\s+width="(\d+)"\s+height="(\d+)"/u);
  const header = frames.match(/function sprite154\(ctx,ctrans,frame,ratio,time\)\{\s*ctx.save\(\);\s*ctx.transform\(1,0,0,1,([-0-9.]+),([-0-9.]+)\);\s*var clips = \[\];\s*var frame_cnt = (\d+);/u);
  assert(canvas && header && Number(header[3]) === 719);
  const definitionEnd = frames.indexOf('\nvar frame = -1;');
  assert(definitionEnd > 0);
  const definitions = frames.slice(0, definitionEnd);
  const placed = [...new Set([...definitions.matchAll(/place\("([A-Za-z_$][A-Za-z0-9_$]*)"/gu)].map(m => m[1]))].sort();
  const fonts = [...definitions.matchAll(/function\s+(font\d+)\(ctx,ch,textColor\)\{/gu)].map(m => m[1]);
  const images = [...definitions.matchAll(/var\s+(imageObj\d+)\s*=\s*document.createElement\("img"\);\s*\1.src="data:image\/(?:PNG|JPEG);base64,[A-Za-z0-9+/=]+";/gu)].map(m => m[1]);
  assert.deepEqual([placed.length, fonts.length, images.length], [142, 4, 7]);
  const internal = {x: Number(header[1]), y: Number(header[2])};
  assert.deepEqual(internal, {x: 915.8, y: 545.8});
  const offset = {x: 369.5 - internal.x, y: 253 - internal.y};
  const spec = {
    schemaVersion: 1, animationId: 'course-shared-alg001-l06-p003', finalAnimationId: audit.animationId,
    classification: 'unregistered-source-locked-canvas-drawing-candidate-v1', title: 'Understanding Functions: Real World Activity',
    source: {swf: `$HELP_MATH_G678_SOURCE_ROOT/${SOURCE}`, swfBytes: swf.length, swfSha256: SWF_SHA},
    evidence: {scenarioInventory: `${AUDIT_DIR}/source-audit.json`, scenarioInventorySha256: SHA.audit,
      audioAudit: `${AUDIT_DIR}/source-audit.json`, audioAuditSha256: SHA.audit},
    ffdecExport: {tool: 'JPEXS Free Flash Decompiler 26.2.1 Canvas export', helper: HELPER, helperSha256: SHA.helper,
      helperBytes: Buffer.byteLength(helper), framesHtml: FRAMES, framesHtmlSha256: SHA.frames, framesHtmlBytes: Buffer.byteLength(frames),
      targetSpriteObjectId: 154, targetSpriteFunction: 'sprite154', exportCanvas: {width: Number(canvas[1]), height: Number(canvas[2])},
      exportInternalTranslation: internal, expectedPlacedFunctionCount: placed.length, expectedPlacedFunctionsSha256: sha(JSON.stringify(placed)),
      expectedFontFunctionCount: fonts.length, expectedFontFunctionsSha256: sha(JSON.stringify(fonts)),
      embeddedImageVariableCount: images.length, embeddedImageVariablesSha256: sha(JSON.stringify(images))},
    timeline: {fps: 12, stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
      root: {frameCount: 10, preloaderStopFrame: 1, beginFrame: 6, beginLabel: 'begin', placementName: 'animation',
        placementDepth: '1', placementTwips: {x: 7390, y: 5060}, placementPixels: {x: 369.5, y: 253}},
      local: {timelineId: 'sprite-154', frameCount: 719, livePlaybackEndFrame: 719, playbackMode: 'once', publicFrameIndexing: 'one-indexed'},
      stageRenderOffset: offset},
    runtimeContract: {kind: 'structural-local-frame', scenarios: ['source-static-frame'], defaultScenario: 'source-static-frame',
      supportedLanguages: ['en'], seedMapping: 'fixed-zero-no-source-randomness-executed', blockedLocalFrameRanges: [],
      currentCanonicalFrameDomainDispositionAsserted: false,
      unresolved: ['Two source audio runs and the 42-frame gap are not implemented by this drawing-only candidate.',
        'Source text modernization, masks, original runtime and all downstream acceptance remain pending.']},
    output: {script: 'canvas-renderer.js', manifest: 'candidate-manifest.json', spec: 'adapter-spec.json', globalRegistry: 'HELP_MATH_CANVAS_ASSETS'},
    strictAcceptanceEffect: 'none',
  };
  const generated = buildSafeRuntime({helperSource: helper, framesHtml: frames, spec}).runtime;
  const runtime = normalizeSourceClipMasks(generated, [{characterId: 1,
    placements: [{depth: 1, clipDepth: 94}],
    rawFill: 'ctx.fillStyle=tocolor(ctrans.apply([0,102,255,0.2509804]));'}], sourceXml);
  new Script(runtime);
  const preview = Buffer.from(`<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,">\n<title>P003 source drawing candidate — not accepted</title>\n<style>body{margin:0;background:#192836;color:white;font:16px system-ui}main{width:min(100%,800px);margin:auto}canvas{display:block;width:100%;height:auto}p{padding:8px}</style></head>\n<body><main><canvas id="stage" width="800" height="600" aria-label="Source drawing candidate for Understanding Functions: Real World Activity"></canvas><p id="status" role="status">Loading unregistered drawing candidate…</p></main>\n<script src="./canvas-renderer.js"></script><script>\n(async()=>{try{const frame=Number(new URLSearchParams(location.search).get('frame')||'1');if(!Number.isSafeInteger(frame)||frame<1||frame>719)throw Error('invalid frame');const asset=globalThis.HELP_MATH_CANVAS_ASSETS?.['course-shared-alg001-l06-p003'];if(!asset)throw Error('drawing asset missing');await asset.ready();const state=asset.render(document.getElementById('stage'),{frame,scenario:'source-static-frame',lang:'en',seed:0});document.getElementById('status').textContent='Unregistered drawing-only candidate · frame '+state.localFrame+'/719 · no audio or acceptance';document.body.dataset.candidateReady='true';}catch(error){document.getElementById('status').textContent=String(error);document.body.dataset.candidateError=String(error);}})();\n</script></body></html>\n`);
  const specBytes = json(spec), runtimeBytes = Buffer.from(runtime);
  return {spec: specBytes, runtime: runtimeBytes, preview, manifest: json({schemaVersion: 1, animationId: audit.animationId,
    status: 'unregistered-drawing-only-candidate', sourceSha256: SWF_SHA, inputs: [
      {path: SOURCE, sha256: SWF_SHA}, {path: `${AUDIT_DIR}/source-audit.json`, sha256: SHA.audit},
      {path: FRAMES, sha256: SHA.frames}, {path: HELPER, sha256: SHA.helper}, {path: XML, sha256: SHA.xml},
      {path: 'scripts/lib/g678-source-clip-masks-v1.mjs', sha256: sha(readFileSync(path.join(ROOT, 'scripts/lib/g678-source-clip-masks-v1.mjs')))},
    ], outputs: [{name: 'adapter-spec.json', bytes: specBytes.length, sha256: sha(specBytes)},
      {name: 'canvas-renderer.js', bytes: runtimeBytes.length, sha256: sha(runtimeBytes)},
      {name: 'preview.html', bytes: preview.length, sha256: sha(preview)}],
    acceptance: audit.acceptance, unresolved: spec.runtimeContract.unresolved})};
}

function main() {
  const args = process.argv.slice(2), check = args.includes('--check');
  const normalized = args.filter(arg => arg !== '--check');
  assert(normalized.length === 2 && normalized[0] === '--output', 'usage: script --output <existing-external-directory> [--check]');
  const output = path.resolve(normalized[1]);
  assert.equal(realpathSync(output), output);
  assert(output.startsWith('/Volumes/American Dream/hudongpin/') && lstatSync(output).isDirectory());
  const built = buildCandidate(process.env.HELP_MATH_G678_SOURCE_ROOT);
  const files = [['adapter-spec.json', built.spec], ['canvas-renderer.js', built.runtime], ['preview.html', built.preview], ['candidate-manifest.json', built.manifest]];
  for (const [name, bytes] of files) {
    const target = path.join(output, name);
    if (check) assert(readFileSync(target).equals(bytes), `${name} drifted`);
    else try {writeFileSync(target, bytes, {flag: 'wx'});}
    catch (error) {if (error.code !== 'EEXIST') throw error; assert(readFileSync(target).equals(bytes), `${name} drifted`);}
  }
  console.log(JSON.stringify({status: check ? 'verified' : 'created', output,
    files: files.map(([name, bytes]) => ({name, bytes: bytes.length, sha256: sha(bytes)}))}));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
