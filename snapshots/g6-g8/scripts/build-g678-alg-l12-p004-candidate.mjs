import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile, mkdir, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildSafeRuntime} from './build-safe-ffdec-canvas-adapter.mjs';
import {validateP004Runtime} from './validate-g678-alg-l12-p004-runtime.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'shared-alg001-l12-p004', WORK = `migrations/${ID}`;
const OUT = `${WORK}/candidate-v1`, EXPORT = `${WORK}/audit/ffdec-26.2.1-canvas-v1`;
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE = 'G6-G8-shared/ALG001/L12/RW/L12RW04.swf';
const SHA = '4d7aa78bd955aa52d476f31548c97135da989daf9d106986ff06a954c6d8b334';
const hash = b => createHash('sha256').update(b).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;
async function pinned(file, sha) {
  const b = await readFile(path.resolve(ROOT, file));
  assert.equal(hash(b), sha, `input drift: ${file}`); return b;
}
function once(text, marker, replacement) {
  assert.equal(text.split(marker).length, 2, `nonunique marker: ${marker.slice(0, 60)}`);
  return text.replace(marker, replacement);
}
function definitions(html) {
  const start = html.indexOf('var scalingGrids = {};'), end = html.indexOf('\nvar frame = -1;');
  assert(start >= 0 && end > start); return html.slice(start, end);
}
function border(xml) {
  const shape = xml.match(/<DefineShape objectID="93">([\s\S]*?)<\/DefineShape>/)?.[1];
  assert(shape?.includes('<Color red="54" green="107" blue="231"/>'));
  assert(shape.includes('<Rectangle left="1383" right="14967" top="1621" bottom="9688"/>'));
  const edges = shape.slice(shape.indexOf('<Shape>'), shape.indexOf('</Shape>'));
  let x = 0, y = 0, contours = 0, lines = 0;
  const commands = [];
  for (const tag of edges.match(/<(?:ShapeSetup|LineTo)[^>]*\/>/g) || []) {
    const point = tag.match(/x="(-?\d+)" y="(-?\d+)"/);
    if (tag.startsWith('<ShapeSetup')) {
      if (!point) continue;
      if (contours++) commands.push('ctx.closePath();');
      x = Number(point[1]); y = Number(point[2]);
      commands.push(`ctx.moveTo(${x / 20},${y / 20});`);
    } else {
      assert(point); x += Number(point[1]); y += Number(point[2]); lines++;
      commands.push(`ctx.lineTo(${x / 20},${y / 20});`);
    }
  }
  assert.equal(contours, 2); assert.equal(lines, 19);
  return `ctx.save();ctx.beginPath();${commands.join('')}ctx.closePath();ctx.fillStyle='#366be7';ctx.fill('evenodd');ctx.restore();`;
}
async function main() {
  const promote = process.argv[2] === '--promote';
  const check = process.argv[2] === '--check' || promote;
  assert(process.argv.length === 2 || (process.argv.length === 3 && check));
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT, SOURCE_ROOT);
  assert.equal(await realpath(SOURCE_ROOT), SOURCE_ROOT);
  const sourceFile = path.join(SOURCE_ROOT, SOURCE);
  assert.equal(await realpath(sourceFile), sourceFile);
  const source = await pinned(sourceFile, SHA); assert.equal(source.length, 363811);
  const xml = (await pinned(`${WORK}/audit/movie.xml`, '7d6a9145ad1aa3df704e440cce62301845971eb044e225db7017a451f73d4f19')).toString();
  const mainPath = `${EXPORT}/DefineSprite_90/frames.html`, titlePath = `${EXPORT}/DefineSprite_92/frames.html`;
  const mainBytes = await pinned(mainPath, '05d5bd9f61013fd688dd5f58c5dbcf4a1c655534a5a969042f4fdfb8fe9febc7');
  const titleBytes = await pinned(titlePath, '18e7d4c24a8821a86b16a88ec8730cf3c94a2aefea8172ff282d9c6b34af6b21');
  const helperPath = `${EXPORT}/DefineSprite_90/canvas.js`;
  const helper = await pinned(helperPath, '78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93');
  const spec = JSON.parse(await pinned('migrations/shared-alg001-l12-p011/candidate-v2/adapter-spec.json', 'bf1e93fc87b09cc967f9fa1b3dea253334141e34c7a58fb78c4f5de4b0cfaa3b'));
  const mainHtml = mainBytes.toString().replace(/\r\n?/g, '\n');
  const titleDefs = definitions(titleBytes.toString().replace(/\r\n?/g, '\n')).replace('var scalingGrids = {};', '');
  const names = text => [...text.matchAll(/function\s+([\w$]+)\s*\(/g)].map(m => m[1]);
  const mainNames = new Set(names(definitions(mainHtml)));
  assert(names(titleDefs).every(name => !mainNames.has(name)));
  assert.deepEqual(names(titleDefs), ['shape91', 'sprite92']);
  const html = once(mainHtml, '\nvar frame = -1;', `${titleDefs}\nvar frame = -1;`);
  const defs = definitions(html);
  const placed = [...new Set([...defs.matchAll(/place\("([\w$]+)"/g)].map(m => m[1]))].sort();
  const fonts = names(defs).filter(name => /^font\d+$/.test(name));
  assert.deepEqual(fonts, ['font2', 'font60']);
  assert(!defs.includes('document.createElement'));
  const auditPath = `${WORK}/MIGRATION_BRIEF.md`, audit = await readFile(path.join(ROOT, auditPath));
  Object.assign(spec, {animationId: `course-${ID}`, builderAnimationId: `course-${ID}`, finalAnimationId: ID,
    classification: 'private-three-layer-glossary-drawing-candidate', title: 'Page 3'});
  spec.source = {swf: `$HELP_MATH_G678_SOURCE_ROOT/${SOURCE}`, swfBytes: source.length, swfSha256: SHA};
  spec.evidence = {scenarioInventory: auditPath, scenarioInventorySha256: hash(audit), audioAudit: auditPath, audioAuditSha256: hash(audit)};
  Object.assign(spec.ffdecExport, {helper: helperPath, helperSha256: hash(helper), helperBytes: helper.length,
    framesHtml: mainPath, framesHtmlSha256: hash(mainBytes), framesHtmlBytes: mainBytes.length,
    targetSpriteObjectId: 90, targetSpriteFunction: 'sprite90', exportCanvas: {width: 618, height: 367},
    exportInternalTranslation: {x: 122.8, y: 185.05}, expectedPlacedFunctionCount: placed.length,
    expectedPlacedFunctionsSha256: hash(JSON.stringify(placed)), expectedFontFunctionCount: fonts.length,
    expectedFontFunctionsSha256: hash(JSON.stringify(fonts)), embeddedImageVariableCount: 0, embeddedImageVariablesSha256: hash('[]')});
  Object.assign(spec.timeline.root, {placementDepth: '1', placementTwips: {x: 4189, y: 5670}, placementPixels: {x: 209.45, y: 283.5}});
  spec.timeline.local = {timelineId: 'sprite-90', frameCount: 969, livePlaybackEndFrame: 969, playbackMode: 'once', publicFrameIndexing: 'one-indexed'};
  spec.timeline.stageRenderOffset = {x: 86.65, y: 98.45};
  spec.runtimeContract.unresolved = ['Source-frame drawing only; original host clock and glossary traces pending.',
    'Required embedded and SA audio remains silent and unaccepted.', 'Spanish content, typography, fidelity, human/Owner review and publication pending.'];
  spec.output = {script: `${OUT}/canvas-renderer.js`, manifest: `${OUT}/adapter-manifest.json`, spec: `${OUT}/adapter-spec.json`, globalRegistry: 'HELP_MATH_CANVAS_ASSETS'};
  spec.sourceComposition = {rootFrame: 6, main: {objectId: 90, depth: 1, position: {x: 209.45, y: 283.5}},
    title: {objectId: 92, depth: 171, position: {x: 400, y: 43.45}, export: titlePath, sha256: hash(titleBytes)},
    border: {objectId: 93, depth: 173, position: {x: 0, y: 0}}};
  let runtime = buildSafeRuntime({helperSource: helper.toString(), framesHtml: html, spec}).runtime;
  const call = 'ctx.transform(1, 0, 0, 1, 86.65, 98.45);\n        sprite90(ctx, new cxform(0,0,0,0,255,255,255,255), state.exportFrame, 0, 0);';
  runtime = once(runtime, call, `ctx.save();${call}\nctx.restore();ctx.save();ctx.setTransform(1,0,0,1,117.4,31.25);sprite92(ctx,new cxform(0,0,0,0,255,255,255,255),0,0,0);ctx.restore();${border(xml)}`);
  runtime = runtime.split(JSON.stringify(spec.animationId)).join(JSON.stringify(ID));
  runtime = once(runtime, 'var registry = global[', `var sourceFrameRender = render;
render = function(targetCanvas, request) {
    if (targetCanvas.width !== 800 || targetCanvas.height !== 600) throw new Error("targetCanvas must be exactly 800x600");
    var surface = document.createElement("canvas"); surface.width = 800; surface.height = 600;
    var state = sourceFrameRender(surface, request), ctx = targetCanvas.getContext("2d");
    ctx.save(); try {ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation="copy";ctx.drawImage(surface,0,0);} finally {ctx.restore();}
    ["data-flash-frame","data-flash-frame-domain","data-flash-root-frame","data-runtime-scenario","data-runtime-seed"].forEach(function(name){targetCanvas.setAttribute(name,surface.getAttribute(name));});
    return state;
};
var registry = global[`);
  validateP004Runtime(runtime);
  const manifest = {schemaVersion: 1, animationId: ID, status: 'unregistered-composed-drawing-candidate', sourceSha256: SHA,
    runtimeSha256: hash(runtime), runtimeBytes: Buffer.byteLength(runtime), composition: spec.sourceComposition,
    acceptanceEffects: {currentJavaScriptRegistered: false, audioAccepted: false, fidelityAccepted: false, strictComplete: false}};
  if (!check) await mkdir(path.join(ROOT, OUT));
  for (const [name, data] of [['adapter-spec.json', json(spec)], ['canvas-renderer.js', runtime], ['adapter-manifest.json', json(manifest)]]) {
    const file = path.join(ROOT, OUT, name);
    if (check) assert.equal(await readFile(file, 'utf8'), data, `generated drift: ${name}`);
    else await writeFile(file, data, {flag: 'wx'});
  }
  if (promote) {
    const directory = path.join(ROOT, `work/g678-shared-page-factory/g678-alg-l12-p004-current-js-v1/members/${ID}`);
    await mkdir(directory, {recursive: true});
    const destination = path.join(directory, 'canvas-renderer.js');
    try {await writeFile(destination, runtime, {flag: 'wx'});}
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      assert.equal(await readFile(destination, 'utf8'), runtime, 'canonical runtime drift');
    }
    // Custody only. Registry admission and acceptance are independent.
  }
  console.log(json(manifest));
}
main().catch(error => {console.error(error); process.exitCode = 1;});
