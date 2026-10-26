import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile, mkdir, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from 'acorn';
import {Script} from 'node:vm';
import {buildSafeRuntime} from './build-safe-ffdec-canvas-adapter.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'shared-alg001-l12-p006', WORK = `migrations/${ID}`;
const EXPORT = `${WORK}/audit/ffdec-26.2.1-canvas-v1`, OUT = `${WORK}/candidate-v1`;
const SOURCE = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/RW/L12RW06.swf';
const SHA = '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6';
const hash = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const normalize = bytes => bytes.toString().replace(/\r\n?/g, '\n');
export function replaceOnce(text, marker, replacement) {
  assert.equal(text.split(marker).length, 2, 'nonunique source marker');
  return text.replace(marker, replacement);
}
function definitions(html) {
  const start = html.indexOf('var scalingGrids = {};'), end = html.indexOf('\nvar frame = -1;');
  assert(start >= 0 && end > start);
  return html.slice(start, end);
}
function functions(html) {
  const code = definitions(html);
  const nodes = parse(code, {ecmaVersion: 2020}).body.filter(n => n.type === 'FunctionDeclaration');
  const map = new Map(nodes.map(n => [n.id.name, code.slice(n.start, n.end)]));
  assert.equal(map.size, nodes.length);
  return map;
}
export function compose(mainHtml, rootHtml) {
  const main = functions(mainHtml), root = functions(rootHtml);
  const missing = [...root.keys()].filter(name => !main.has(name));
  assert.deepEqual(missing, ['text54', 'shape55', 'sprite56', 'shape57', 'main']);
  assert.deepEqual([...root.keys()].filter(name => main.has(name) && main.get(name) !== root.get(name)), ['sprite53']);
  return replaceOnce(mainHtml, '\nvar frame = -1;', missing.map(name => root.get(name)).join('\n') + '\nvar frame = -1;');
}
export function validateRuntime(runtime) {
  assert.deepEqual([...new Set([...runtime.matchAll(/document\.([\w$]+)/g)].map(m => m[1]))], ['createElement']);
  assert.deepEqual([...runtime.matchAll(/document\.createElement\("([a-z]+)"\)/g)].map(m => m[1]), ['canvas', 'img', 'canvas']);
  const images = [...runtime.matchAll(/var (imageObj\d+) = document\.createElement\("img"\);\s*\1\.src="([^"]+)";/g)];
  assert.deepEqual(images.map(m => m[1]), ['imageObj2']);
  assert.match(images[0][2], /^data:image\/(?:JPEG|PNG);base64,[A-Za-z0-9+/=]+$/);
  for (const pattern of [/\beval\s*\(/, /\bFunction\s*\(/,
    /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/,
    /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB)\b/,
    /\b(?:Worker|SharedWorker)\s*\(/, /\b(?:location|postMessage|open)\s*(?:\.|\()/,
    /\bimport\s*\(/, /document\.body/, /\b(?:addEventListener|removeEventListener)\s*\(/]) assert(!pattern.test(runtime), String(pattern));
  new Script(runtime);
}
async function main() {
  const check = process.argv[2] === '--check';
  assert(process.argv.length === 2 || (check && process.argv.length === 3));
  assert.equal(await realpath(SOURCE), SOURCE);
  assert.equal(hash(await readFile(SOURCE)), SHA);
  const receiptBytes = await readFile(path.join(ROOT, EXPORT, 'extraction-receipt.json'));
  assert.equal(hash(receiptBytes), '531b5d3bb602e62779ae65106f8ed5961efa7f4db96f8563dde59a9fd76ca16c');
  const receipt = JSON.parse(receiptBytes);
  const pinned = async relative => {
    const bytes = await readFile(path.join(ROOT, EXPORT, relative));
    const record = receipt.files.find(f => f.path === relative);
    assert(record && bytes.length === record.bytes && hash(bytes) === record.sha256);
    return bytes;
  };
  const mainFile = 'sprites/DefineSprite_53/frames.html', rootFile = 'frames/frames.html';
  const mainBytes = await pinned(mainFile), rootBytes = await pinned(rootFile);
  const helper = await pinned('sprites/DefineSprite_53/canvas.js');
  const html = compose(normalize(mainBytes), normalize(rootBytes)), defs = definitions(html);
  const placed = [...new Set([...defs.matchAll(/place\("([\w$]+)"/g)].map(m => m[1]))].sort();
  const fonts = [...defs.matchAll(/function\s+(font\d+)\s*\(/g)].map(m => m[1]);
  const images = [...defs.matchAll(/var\s+(imageObj\d+)\s*=\s*document\.createElement\("img"\);/g)].map(m => m[1]);
  assert.deepEqual(images, ['imageObj2']);
  const briefPath = `${WORK}/MIGRATION_BRIEF.md`, brief = await readFile(path.join(ROOT, briefPath));
  const spec = {
    schemaVersion: 1, animationId: `course-${ID}`, finalAnimationId: ID,
    classification: 'unregistered-four-layer-visual-candidate', title: 'Page 5',
    source: {swf: SOURCE, swfBytes: 708053, swfSha256: SHA},
    evidence: {scenarioInventory: briefPath, scenarioInventorySha256: hash(brief), audioAudit: briefPath, audioAuditSha256: hash(brief)},
    ffdecExport: {helper: `${EXPORT}/sprites/DefineSprite_53/canvas.js`, helperSha256: hash(helper), helperBytes: helper.length,
      framesHtml: `${EXPORT}/${mainFile}`, framesHtmlSha256: hash(mainBytes), framesHtmlBytes: mainBytes.length,
      targetSpriteObjectId: 53, targetSpriteFunction: 'sprite53', exportCanvas: {width: 2057, height: 2715},
      exportInternalTranslation: {x: 1214.6, y: 1120.85},
      expectedPlacedFunctionCount: placed.length, expectedPlacedFunctionsSha256: hash(JSON.stringify(placed)),
      expectedFontFunctionCount: fonts.length, expectedFontFunctionsSha256: hash(JSON.stringify(fonts)),
      embeddedImageVariableCount: images.length, embeddedImageVariablesSha256: hash(JSON.stringify(images))},
    timeline: {fps: 12, stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
      root: {frameCount: 10, preloaderStopFrame: 1, beginFrame: 6, beginLabel: 'begin', placementName: 'animation',
        placementDepth: '1', placementTwips: {x: 5568, y: 7337}, placementPixels: {x: 278.4, y: 366.85}},
      local: {timelineId: 'sprite-53', frameCount: 342, livePlaybackEndFrame: 342, playbackMode: 'once', publicFrameIndexing: 'one-indexed'},
      stageRenderOffset: {x: 278.4 - 1214.6, y: 366.85 - 1120.85}},
    runtimeContract: {kind: 'structural-local-frame', scenarios: ['source-static-frame'], defaultScenario: 'source-static-frame',
      supportedLanguages: ['en'], seedMapping: 'fixed-zero-no-source-randomness-executed', blockedLocalFrameRanges: [],
      unresolved: ['Masks/morphs and four-layer composition need browser checks.', 'Glossary interaction and host integration are not implemented.',
        'Audio required but disabled; timing/language/listening pending.', 'Original runtime, Spanish content, human/Owner acceptance and publication pending.'],
      currentCanonicalFrameDomainDispositionAsserted: false},
    output: {script: `${OUT}/canvas-renderer.js`, manifest: `${OUT}/adapter-manifest.json`, globalRegistry: 'HELP_MATH_CANVAS_ASSETS'},
  };
  let runtime = buildSafeRuntime({helperSource: helper.toString(), framesHtml: html, spec}).runtime;
  const offset = spec.timeline.stageRenderOffset;
  const call = `ctx.transform(1, 0, 0, 1, ${offset.x}, ${offset.y});\n        sprite53(ctx, new cxform(0,0,0,0,255,255,255,255), state.exportFrame, 0, 0);`;
  runtime = replaceOnce(runtime, call, `ctx.save();${call}\nctx.restore();\n` +
    'place("text54",canvas,ctx,[0.05,0,0,0.05,120.35,-138],new cxform(0,0,0,0,255,255,255,255),1,0,0,0);\n' +
    'place("sprite56",canvas,ctx,[0.05,0,0,0.05,400,43.45],new cxform(0,0,0,0,255,255,255,255),1,0,5,0);\n' +
    'place("shape57",canvas,ctx,[0.05,0,0,0.05,0,0],new cxform(0,0,0,0,255,255,255,255),1,0,0,0);');
  runtime = runtime.split(JSON.stringify(spec.animationId)).join(JSON.stringify(ID));
  runtime = replaceOnce(runtime, 'var registry = global[', `var sourceRender = render;
render = function(targetCanvas, request) {
    if (!targetCanvas || targetCanvas.width !== 800 || targetCanvas.height !== 600) throw new Error("targetCanvas must be exactly 800x600");
    var surface = document.createElement("canvas"); surface.width=800; surface.height=600;
    var state=sourceRender(surface,request), ctx=targetCanvas.getContext("2d");
    ctx.save(); try {ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation="copy";ctx.drawImage(surface,0,0);} finally {ctx.restore();}
    ["data-flash-frame","data-flash-frame-domain","data-flash-root-frame","data-runtime-scenario","data-runtime-seed"].forEach(function(name){targetCanvas.setAttribute(name,surface.getAttribute(name));});
    return state;
};
var registry = global[`);
  validateRuntime(runtime);
  const manifest = {animationId: ID, sourceSha256: SHA, status: 'unregistered-unvalidated-visual-candidate',
    runtimeSha256: hash(runtime), runtimeBytes: Buffer.byteLength(runtime), sourceExportReceiptSha256: hash(receiptBytes),
    generatorSha256: hash(await readFile(fileURLToPath(import.meta.url))),
    registered: false, audioEnabled: false, interactiveStateResolved: false, browserValidated: false, strictComplete: false};
  if (!check) await mkdir(path.join(ROOT, OUT));
  for (const [file, text] of [['canvas-renderer.js', runtime], ['adapter-spec.json', json(spec)], ['adapter-manifest.json', json(manifest)]]) {
    const target = path.join(ROOT, OUT, file);
    if (check) assert.equal(await readFile(target, 'utf8'), text);
    else await writeFile(target, text, {flag: 'wx'});
  }
  console.log(json(manifest));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {console.error(error); process.exitCode = 1;});
}
