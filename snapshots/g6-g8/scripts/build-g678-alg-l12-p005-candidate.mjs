import assert from 'node:assert/strict';
import {parse} from 'acorn';
import {createHash} from 'node:crypto';
import {readFile, writeFile, mkdir, realpath, lstat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildSafeRuntime} from './build-safe-ffdec-canvas-adapter.mjs';
import {validateP005Runtime} from './validate-g678-alg-l12-p005-runtime.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'shared-alg001-l12-p005', WORK = `migrations/${ID}`;
const OUT = `${WORK}/candidate-v1`, EXPORT = `${WORK}/audit/ffdec-26.2.1-canvas-v1`;
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE = 'G6-G8-shared/ALG001/L12/RW/L12RW05.swf';
const SHA = 'b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe';
const hash = value => createHash('sha256').update(value).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;

async function pinned(file, sha) {
  const full = path.resolve(ROOT, file);
  assert.equal(await realpath(full), full, 'physical input');
  const stat = await lstat(full);
  assert(stat.isFile() && stat.nlink === 1, 'ordinary input');
  const bytes = await readFile(full);
  assert.equal(hash(bytes), sha, `input drift: ${file}`);
  return bytes;
}

export function replaceP005Once(source, marker, replacement) {
  assert.equal(source.split(marker).length, 2, `nonunique P005 marker: ${marker.slice(0, 80)}`);
  return source.replace(marker, replacement);
}

export function p005Definitions(html) {
  const start = html.indexOf('var scalingGrids = {};');
  const end = html.indexOf('\nvar frame = -1;');
  assert(start >= 0 && end > start, 'P005 FFDec declaration boundaries');
  return html.slice(start, end);
}

function namedFunctions(html) {
  const source = p005Definitions(html);
  const declarations = parse(source, {ecmaVersion: 2020}).body
    .filter(node => node.type === 'FunctionDeclaration');
  const result = new Map(declarations.map(node => [node.id.name, source.slice(node.start, node.end)]));
  assert.equal(result.size, declarations.length, 'duplicate source function');
  return result;
}

/** Keep the standalone main wrapper; add only source-identical missing root objects. */
export function composeP005Definitions(mainHtml, rootHtml) {
  const main = namedFunctions(mainHtml), root = namedFunctions(rootHtml);
  const missing = [...root.keys()].filter(name => !main.has(name));
  assert.deepEqual(missing, ['font392', 'text393', 'shape394', 'sprite395', 'shape396', 'main']);
  assert.deepEqual([...main.keys()].filter(name => root.has(name) && main.get(name) !== root.get(name)), ['sprite391']);
  const wrapper = /^function sprite391\(ctx,ctrans,frame,ratio,time\)\{\s*ctx\.save\(\);\s*ctx\.transform\(1,0,0,1,(-?[\d.]+),(-?[\d.]+)\);/.exec(main.get('sprite391'));
  assert(wrapper, 'source standalone main bounds transform');
  const translation = {x: Number(wrapper[1]), y: Number(wrapper[2])};
  assert(Number.isFinite(translation.x) && Number.isFinite(translation.y));
  const html = replaceP005Once(mainHtml, '\nvar frame = -1;',
    `${missing.map(name => root.get(name)).join('\n')}\nvar frame = -1;`);
  return {html, translation, addedFunctions: missing};
}

/** Preserve the source placement transforms without running the raw root viewer. */
export function composeP005Render(runtime, offset) {
  const mainCall = `ctx.transform(1, 0, 0, 1, ${offset.x}, ${offset.y});\n        sprite391(ctx, new cxform(0,0,0,0,255,255,255,255), state.exportFrame, 0, 0);`;
  return replaceP005Once(runtime, mainCall,
    `ctx.save();${mainCall}\nctx.restore();\n` +
    'place("sprite395",canvas,ctx,[0.05,0,0,0.05,403.4,-42.4],new cxform(0,0,0,0,255,255,255,255),1,0,5,0);\n' +
    'place("shape396",canvas,ctx,[0.05,0,0,0.05,0,0],new cxform(0,0,0,0,255,255,255,255),1,0,0,0);');
}

async function main() {
  const check = process.argv[2] === '--check';
  assert(process.argv.length === 2 || (process.argv.length === 3 && check));
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT, SOURCE_ROOT);
  assert.equal(await realpath(SOURCE_ROOT), SOURCE_ROOT);
  const source = await pinned(path.join(SOURCE_ROOT, SOURCE), SHA);
  assert.equal(source.length, 1950595);
  const mainPath = `${EXPORT}/sprites/DefineSprite_391/frames.html`;
  const rootPath = `${EXPORT}/frames/frames.html`;
  const helperPath = `${EXPORT}/sprites/DefineSprite_391/canvas.js`;
  const mainBytes = await pinned(mainPath, '09073f31465eae137d4e8305a61d3d7b03d896dae9407d499e0a7c0dd0273fa5');
  const rootBytes = await pinned(rootPath, '34b776d8472722b53e339566cd6d5fe56c24107de5889007bb796d43a2ff9043');
  const helper = await pinned(helperPath, '78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93');
  const structureBytes = await pinned(`${WORK}/audit/source-structure.json`, '3292f24e124d9160356701b50cc458f0bf8e5f3e717953e6db50edb7aef4b26d');
  const structure = JSON.parse(structureBytes);
  assert.equal(structure.sourceSwfSha256, SHA);
  assert.deepEqual(structure.rootComposition.map(x =>
    [x.frame, x.characterId, x.depth, x.matrix.translateX, x.matrix.translateY]),
  [[6, 391, 1, '5568', '7337'], [6, 395, 135, '8068', '-848'], [6, 396, 138, '0', '0']]);
  const normalized = bytes => bytes.toString().replace(/\r\n?/g, '\n');
  const composed = composeP005Definitions(normalized(mainBytes), normalized(rootBytes));
  assert.deepEqual(composed.translation, {x: 1486.9, y: 1143.6});
  const defs = p005Definitions(composed.html);
  const placed = [...new Set([...defs.matchAll(/place\("([\w$]+)"/g)].map(m => m[1]))].sort();
  const fonts = [...defs.matchAll(/function\s+(font\d+)\s*\(/g)].map(m => m[1]);
  const images = [...defs.matchAll(/var\s+(imageObj\d+)\s*=\s*document\.createElement\("img"\);/g)].map(m => m[1]);
  assert.deepEqual(fonts, ['font392']);
  assert.deepEqual(images, ['imageObj2', 'imageObj99', 'imageObj204']);
  const briefPath = `${WORK}/MIGRATION_BRIEF.md`, brief = await readFile(path.join(ROOT, briefPath));
  const spec = JSON.parse(await pinned('migrations/shared-alg001-l12-p003/candidate-v1/adapter-spec.json',
    'ff1173f68e6da79014388c09188e3d200bcd24762e6f64c10642b9933809dabd'));
  Object.assign(spec, {animationId: `course-${ID}`, builderAnimationId: `course-${ID}`, finalAnimationId: ID,
    classification: 'unregistered-nested-timeline-source-drawing', title: 'Page 4'});
  spec.source = {swf: `$HELP_MATH_G678_SOURCE_ROOT/${SOURCE}`, swfBytes: source.length, swfSha256: SHA};
  spec.evidence = {scenarioInventory: briefPath, scenarioInventorySha256: hash(brief), audioAudit: briefPath, audioAuditSha256: hash(brief)};
  Object.assign(spec.ffdecExport, {helper: helperPath, helperSha256: hash(helper), helperBytes: helper.length,
    framesHtml: mainPath, framesHtmlSha256: hash(mainBytes), framesHtmlBytes: mainBytes.length,
    targetSpriteObjectId: 391, targetSpriteFunction: 'sprite391', exportCanvas: {width: 2280, height: 3108},
    exportInternalTranslation: composed.translation,
    expectedPlacedFunctionCount: placed.length, expectedPlacedFunctionsSha256: hash(JSON.stringify(placed)),
    expectedFontFunctionCount: fonts.length, expectedFontFunctionsSha256: hash(JSON.stringify(fonts)),
    embeddedImageVariableCount: images.length, embeddedImageVariablesSha256: hash(JSON.stringify(images))});
  Object.assign(spec.timeline.root, {placementDepth: '1', placementTwips: {x: 5568, y: 7337}, placementPixels: {x: 278.4, y: 366.85}});
  spec.timeline.local = {timelineId: 'sprite-391', frameCount: 968, livePlaybackEndFrame: 968, playbackMode: 'once', publicFrameIndexing: 'one-indexed'};
  spec.timeline.stageRenderOffset = {x: 278.4 - composed.translation.x, y: 366.85 - composed.translation.y};
  spec.runtimeContract.unresolved = [
    'Unregistered source drawing: six nested clocks and source masks require independent structural and browser validation; original natural traces remain pending.',
    'Embedded stream is required but disabled; stream gaps are not presumed silence, and synchronization/language/listening remain pending.',
    'Preloader host continuation, source terminal/Replay parity, Spanish drawing, fidelity, human/Owner review and publication remain pending.',
  ];
  spec.output = {script: `${OUT}/canvas-renderer.js`, manifest: `${OUT}/adapter-manifest.json`, spec: `${OUT}/adapter-spec.json`, globalRegistry: 'HELP_MATH_CANVAS_ASSETS'};
  spec.sourceComposition = {rootFrame: 6, rootExport: rootPath, rootExportSha256: hash(rootBytes), layers: structure.rootComposition,
    nestedDomains: ['sprite-78', 'sprite-147', 'sprite-258', 'sprite-289', 'sprite-306', 'sprite-346'],
    nestedClockAuthority: 'FFDec source drawing offsets; original-runtime natural trace pending'};
  let runtime = buildSafeRuntime({helperSource: helper.toString(), framesHtml: composed.html, spec}).runtime;
  runtime = composeP005Render(runtime, spec.timeline.stageRenderOffset);
  runtime = runtime.split(JSON.stringify(spec.animationId)).join(JSON.stringify(ID));
  // Fresh drawing contexts avoid retained mask/transform state across reverse seeks.
  runtime = replaceP005Once(runtime, 'var registry = global[', `var sourceFrameRender = render;
render = function(targetCanvas,request) {
    if (!targetCanvas || targetCanvas.width !== 800 || targetCanvas.height !== 600) throw new Error("targetCanvas must be exactly 800x600");
    var surface = document.createElement("canvas"); surface.width=800; surface.height=600;
    var state=sourceFrameRender(surface,request), ctx=targetCanvas.getContext("2d");
    ctx.save();try{ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation="copy";ctx.drawImage(surface,0,0);}finally{ctx.restore();}
    ["data-flash-frame","data-flash-frame-domain","data-flash-root-frame","data-runtime-scenario","data-runtime-seed"].forEach(function(name){targetCanvas.setAttribute(name,surface.getAttribute(name));});
    return state;
};
var registry = global[`);
  validateP005Runtime(runtime);
  const manifest = {schemaVersion: 1, animationId: ID, status: 'unregistered-composed-drawing-candidate', sourceSha256: SHA,
    runtimeBytes: Buffer.byteLength(runtime), runtimeSha256: hash(runtime), composition: spec.sourceComposition,
    acceptanceEffects: {currentJavaScriptRegistered: false, audioAccepted: false, fidelityAccepted: false, strictComplete: false}};
  if (!check) await mkdir(path.join(ROOT, OUT));
  for (const [name, contents] of [['adapter-spec.json', json(spec)], ['canvas-renderer.js', runtime], ['adapter-manifest.json', json(manifest)]]) {
    const file = path.join(ROOT, OUT, name);
    if (check) assert.equal(await readFile(file, 'utf8'), contents, `candidate drift: ${name}`);
    else await writeFile(file, contents, {flag: 'wx'});
  }
  console.log(json(manifest));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {console.error(error); process.exitCode = 1;});
}
