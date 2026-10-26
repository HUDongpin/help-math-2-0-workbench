#!/usr/bin/env node
// Reproducible FFDec 26.2.1 Canvas/vector extraction for P012.
// Generated drawings preserve every source graphic; no native suppression occurs.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE = SOURCE_ROOT + '/G6-G8-shared/ALG001/L12/VB/L12VB07.swf';
const SOURCE_SHA = 'b322949a960acef3fee6018a65785b29cd3693717ca3ba33d0d930d7866320aa';
const COPY_REL = 'output/p011-source-triage-20260927-v1/raw/source-input.swf';
const CATALOG_REL = 'output/p011-source-triage-20260927-v1/source-text-catalog.json';
const TRIAGE_REL = 'output/p011-source-triage-20260927-v1/TRIAGE_INVENTORY.json';
const RECEIPT_REL = 'output/p011-source-triage-20260927-v1/EXTRACTION_RECEIPT.json';
const OUT_REL = 'migrations/shared-alg001-l12-p012/graphics-source-v1';
const EVIDENCE_REL = 'migrations/shared-alg001-l12-p012/evidence/GRAPHICS_SOURCE_2026-09-27.md';
const JAVA = '/Users/peter/Library/Application Support/HELP Math Flash Workbench/temurin-jre-21.0.11+10/Contents/Home/bin/java';
const JAR = '/Users/peter/Applications/FFDec.app/Contents/Resources/ffdec.jar';
const PREFIX = ['-Djava.net.preferIPv4Stack=true', '-Djna.nosys=true',
  '-Djava.util.Arrays.useLegacyMergeSort=true', '-Xmx512m', '-Djava.awt.headless=true', '-jar', JAR];
const OPTIONS = ['-config', 'packJavaScripts=false', '-onerror', 'abort', '-timeout', '45', '-exportTimeout', '45'];
const EXPECTED_RAW = [
  'frames/canvas.js', 'frames/frames.html', 'images/47.png',
  'shapes/1.svg', 'shapes/48.svg', 'shapes/56.svg',
  ...[57, 76, 86].flatMap(id => [`sprites/DefineSprite_${id}/canvas.js`, `sprites/DefineSprite_${id}/frames.html`])
].sort();
const EXPECTED_PNG = ['1.png', '48.png', '56.png'];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = object => JSON.stringify(object, null, 2) + '\n';
const relative = file => file.startsWith(ROOT + '/') ? path.relative(ROOT, file) : file;

function readPhysical(file) {
  assert.equal(fs.realpathSync(file), file, `physical file required: ${file}`);
  const before = fs.lstatSync(file, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink(), `regular file required: ${file}`);
  const bytes = fs.readFileSync(file);
  const after = fs.lstatSync(file, {bigint: true});
  for (const key of ['dev', 'ino', 'size', 'mtimeNs', 'ctimeNs'])
    assert.equal(before[key], after[key], `file changed while reading: ${file}`);
  return bytes;
}
const pin = file => { const bytes = readPhysical(file); return {path: relative(file), bytes: bytes.length, sha256: sha(bytes)}; };
function checkPin(descriptor) {
  const file = descriptor.path.startsWith('/') ? descriptor.path : path.join(ROOT, descriptor.path);
  assert.deepEqual(pin(file), descriptor, `pin drift: ${descriptor.path}`);
}
function files(directory, base = directory) {
  return fs.readdirSync(directory, {withFileTypes: true}).sort((a,b) => a.name.localeCompare(b.name))
    .flatMap(entry => {
      const file = path.join(directory, entry.name);
      assert(!entry.isSymbolicLink(), `symlink in FFDec output: ${file}`);
      return entry.isDirectory() ? files(file, base) : (assert(entry.isFile()), [path.relative(base, file)]);
    }).sort();
}
function runExport(destination, kind) {
  fs.mkdirSync(destination, {recursive: true});
  const args = kind === 'canvas'
    ? [...PREFIX, ...OPTIONS, '-selectid', '1,47,48,56,57,76,86',
      '-format', 'frame:canvas,sprite:canvas,shape:svg,image:png',
      '-export', 'frame,sprite,shape,image', destination, path.join(ROOT, COPY_REL)]
    : [...PREFIX, ...OPTIONS, '-selectid', '1,48,56', '-format', 'shape:png',
      '-export', 'shape', destination, path.join(ROOT, COPY_REL)];
  const result = spawnSync(JAVA, args, {encoding: 'utf8', timeout: 60000, maxBuffer: 4 * 1024 * 1024});
  assert(!result.error, result.error?.message);
  assert.equal(result.status, 0, `FFDec ${kind} failed: ${result.stderr}`);
  assert(result.stdout.includes('JPEXS Free Flash Decompiler v.26.2.1'));
  assert(result.stdout.includes('Export finished.'));
  assert.deepEqual(files(destination), kind === 'canvas' ? EXPECTED_RAW : EXPECTED_PNG,
    `unexpected FFDec ${kind} membership`);
  return {command: JAVA, args, version: '26.2.1'};
}
function verifyRawAgainstFresh(out) {
  const temporary = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'p012-graphics-ffdec-'));
  try {
    for (const [name, kind, expected] of [['raw', 'canvas', EXPECTED_RAW], ['shape-png', 'shape-png', EXPECTED_PNG]]) {
      const fresh = path.join(temporary, name);
      runExport(fresh, kind);
      const held = path.join(out, name);
      assert.deepEqual(files(held), expected, `held ${name} membership`);
      for (const file of expected)
        assert.deepEqual(readPhysical(path.join(held, file)), readPhysical(path.join(fresh, file)),
          `FFDec reproduction drift: ${name}/${file}`);
    }
  } finally {
    fs.rmSync(temporary, {recursive: true, force: true});
  }
}

function checkSourceAndTools() {
  assert.equal(fs.realpathSync(SOURCE_ROOT), SOURCE_ROOT, 'source root must be physical');
  assert(fs.lstatSync(SOURCE_ROOT).isDirectory() && !fs.lstatSync(SOURCE_ROOT).isSymbolicLink());
  assert.equal(sha(readPhysical(SOURCE)), SOURCE_SHA);
  assert.deepEqual(readPhysical(path.join(ROOT, COPY_REL)), readPhysical(SOURCE));
  const extraction = JSON.parse(readPhysical(path.join(ROOT, RECEIPT_REL)));
  assert.equal(extraction.toolVersion, 'JPEXS Free Flash Decompiler 26.2.1');
  assert.deepEqual(extraction.sourceInputs[0], pin(SOURCE));
  for (const item of extraction.toolInputs) checkPin(item);
  assert(extraction.toolInputs.some(item => item.path === JAVA));
  assert(extraction.toolInputs.some(item => item.path === JAR));
  const catalog = JSON.parse(readPhysical(path.join(ROOT, CATALOG_REL)));
  const triage = JSON.parse(readPhysical(path.join(ROOT, TRIAGE_REL)));
  assert.equal(catalog.sourceSha256, SOURCE_SHA);
  assert.equal(triage.inputs.source.sha256, SOURCE_SHA);
  assert.deepEqual(catalog.header.stageBoundsTwips, {left: 0, right: 16000, top: 0, bottom: 12000});
  assert.equal(catalog.header.frameRate, 12);
  return {catalog, triage, extraction};
}

export function canvasDeclarations(html) {
  const normalized = html.replace(/\r\n?/g, '\n');
  const start = normalized.indexOf('var scalingGrids = {};');
  const end = normalized.indexOf('\nvar frame = -1;');
  assert(start >= 0 && end > start, 'FFDec declaration boundaries');
  assert.equal(normalized.split('var scalingGrids = {};').length, 2);
  assert.equal(normalized.split('\nvar frame = -1;').length, 2);
  return normalized.slice(start, end);
}

export function buildSourceDrawings(helper, html) {
  const oldNormal = 'eval(obj + "(ctx,ctrans,frame,ratio,time);");';
  const oldBlend = 'eval(obj + "(ctx,new cxform(0,0,0,0,255,255,255,255),frame,ratio,time);");';
  assert.equal(helper.split(oldNormal).length, 2, 'one FFDec normal dispatch');
  assert.equal(helper.split(oldBlend).length, 2, 'one FFDec blend dispatch');
  assert.equal(helper.split('eval(').length, 3, 'only the two known FFDec eval calls');
  const dispatchSafeHelper = helper.replace(oldNormal,
    'sourceFunction(obj)(ctx,ctrans,frame,ratio,time);').replace(oldBlend,
    'sourceFunction(obj)(ctx,new cxform(0,0,0,0,255,255,255,255),frame,ratio,time);');
  const demoStartMarker = "window.addEventListener('load', function () {";
  const drawingStartMarker = 'function drawMorphPath(ctx, p, ratio, doStroke, scaleMode) {';
  assert.equal(dispatchSafeHelper.split(demoStartMarker).length, 2, 'one FFDec demo DOM auto-binding');
  assert.equal(dispatchSafeHelper.split(drawingStartMarker).length, 2, 'one FFDec drawing continuation');
  const demoStart = dispatchSafeHelper.indexOf(demoStartMarker);
  const drawingStart = dispatchSafeHelper.indexOf(drawingStartMarker);
  assert(drawingStart > demoStart);
  const demo = dispatchSafeHelper.slice(demoStart, drawingStart);
  for (const marker of ['width_size', 'height_size', 'initDragWidth', 'initDragHeight',
    'document.documentElement.addEventListener', 'function stopDrag(e)'])
    assert(demo.includes(marker), `FFDec demo auto-binding drift: ${marker}`);
  const safeHelper = dispatchSafeHelper.slice(0, demoStart) +
    '/* FFDec standalone resize demo DOM binding removed; drawing functions retained. */\n' +
    dispatchSafeHelper.slice(drawingStart);
  assert(!safeHelper.includes('window.addEventListener'));
  assert(!safeHelper.includes('document.getElementById'));
  const declarations = canvasDeclarations(html);
  const names = [...declarations.matchAll(/^function ((?:shape|text|font|image|button|sprite)\d+)\(/gm)]
    .map(match => match[1]);
  assert.equal(new Set(names).size, names.length, 'duplicate source functions');
  for (const name of ['shape1', 'shape48', 'shape56', 'image47', 'sprite57', 'sprite76', 'sprite86', 'main'])
    assert(name === 'main' ? declarations.includes('function main(') : names.includes(name), `missing ${name}`);
  assert.equal((declarations.match(/function sprite86\(/g) ?? []).length, 1);
  assert(declarations.includes('var frame_cnt = 119;'));
  const rootCase = declarations.slice(declarations.indexOf('function main('));
  assert(rootCase.includes('place("shape1",canvas,ctx,[0.05,0.0,0.0,0.05,0.0,0.0]'));
  assert(rootCase.includes('place("sprite86",canvas,ctx,[0.05,0.0,0.0,0.05,412.4,283.3]'));
  const mainFunction = declarations.slice(declarations.indexOf('function sprite86('), declarations.indexOf('function main('));
  const terminalCase = mainFunction.slice(mainFunction.indexOf('case 118:'));
  for (const name of ['sprite32', 'sprite61', 'sprite74', 'sprite76', 'sprite57'])
    assert.equal(terminalCase.split(`place("${name}",canvas,ctx,`).length, 2,
      `terminal source placement count: ${name}`);
  const bubbleFunction = declarations.slice(declarations.indexOf('function sprite61('), declarations.indexOf('function sprite74('));
  assert.equal(bubbleFunction.split('place("text34",canvas,ctx,').length, 2,
    'one nested sprite61 dynamic text34 placement');
  assert(!terminalCase.includes('place("text34",canvas,ctx,'), 'terminal direct text34 is replaced by sprite61');
  assert(!declarations.includes('window.setInterval'));
  const script = `/* Generated from source SWF via FFDec 26.2.1; engineering drawing API only. */\n` +
`(function(global){\nvar canvas=null;\nvar defaultFill=null;\nvar sourceFunctions=null;\nvar activeInteractive=null;\n` +
`function sourceFunction(name){\n  var fn=sourceFunctions[name];\n  if(typeof fn!=="function") throw new Error("Unknown source function: "+name);\n  return fn;\n}\n` +
safeHelper + '\n' + declarations + '\n' +
`sourceFunctions=Object.freeze({${names.map(name => `${JSON.stringify(name)}:${name}`).join(',')},"main":main});\n` +
`var sourcePlace=place;\n` +
`var interactivePlacements=Object.freeze({\n` +
`  sprite32:Object.freeze({matrix:[0.75,0,0,0.75,2674,377],ratio:0}),\n` +
`  sprite61:Object.freeze({matrix:[1,0,0,1,2702,-236],ratio:118}),\n` +
`  sprite74:Object.freeze({matrix:[1,0,0,1,1555,-689],ratio:118}),\n` +
`  sprite76:Object.freeze({matrix:[1,0,0,1,-13516,36],ratio:118}),\n` +
`  sprite57:Object.freeze({matrix:[0.5,0,0,0.5,2676,382],ratio:101}),\n` +
`  text34:Object.freeze({matrix:[1.95001220703125,0,0,1.95001220703125,-598,-227],ratio:0})\n` +
`});\n` +
`function sameMatrix(left,right){return left.length===6&&right.every(function(n,i){return left[i]===n;});}\n` +
`place=function(obj,target,ctx,matrix,ctrans,blendMode,frame,ratio,time){\n` +
`  var active=activeInteractive,expected=active&&interactivePlacements[obj];\n` +
`  if(!expected) return sourcePlace(obj,target,ctx,matrix,ctrans,blendMode,frame,ratio,time);\n` +
`  if(!sameMatrix(matrix,expected.matrix)||ratio!==expected.ratio||blendMode!==1||active.consumed[obj])\n` +
`    throw new Error("P012 interactive source placement drift: "+obj);\n` +
`  active.consumed[obj]=true;\n` +
`  var state=active.state,adjusted=matrix.slice();\n` +
`  if(obj==="sprite32"){adjusted[4]=state.dot.x*20;adjusted[5]=state.dot.y*20;}\n` +
`  else if(obj==="sprite61"){adjusted[4]=state.bubble.x*20;adjusted[5]=state.bubble.y*20;}\n` +
`  else if(obj==="sprite57"){\n` +
`    var rotation={0:[0.5,0,0,0.5],90:[0,0.5,-0.5,0],180:[-0.5,0,0,-0.5],270:[0,-0.5,0.5,0]}[state.spider.rotation];\n` +
`    for(var i=0;i<4;i++)adjusted[i]=rotation[i];\n` +
`    adjusted[4]=state.spider.x*20;adjusted[5]=state.spider.y*20;\n` +
`  }else if(obj==="sprite74"){\n` +
`    if(!state.popup.visible)return;\n` +
`    frame=state.popup.frame-1;\n` +
`  }else if(obj==="sprite76"){\n` +
`    if(!state.coach.playing)return;\n` +
`    frame=state.coach.frame-1;\n` +
`  }else if(obj==="text34"&&active.nativeCoordinate)return;\n` +
`  return sourcePlace(obj,target,ctx,adjusted,ctrans,blendMode,frame,ratio,time);\n` +
`};\n` +
`var preparedContexts=new WeakSet();\n` +
`function ready(){\n` +
`  if(imageObj47.complete) return imageObj47.naturalWidth===38?Promise.resolve():Promise.reject(new Error("Source bitmap 47 failed to decode"));\n` +
`  return new Promise(function(resolve,reject){\n` +
`    var settled=false,timer=null;\n` +
`    function done(error){\n` +
`      if(settled)return;settled=true;clearTimeout(timer);\n` +
`      imageObj47.removeEventListener("load",onLoad);imageObj47.removeEventListener("error",onError);\n` +
`      if(error)reject(error);else resolve();\n` +
`    }\n` +
`    function onLoad(){done(imageObj47.naturalWidth===38?null:new Error("Source bitmap 47 decoded at wrong width"));}\n` +
`    function onError(){done(new Error("Source bitmap 47 failed to decode"));}\n` +
`    imageObj47.addEventListener("load",onLoad);imageObj47.addEventListener("error",onError);\n` +
`    timer=setTimeout(function(){done(new Error("Source bitmap 47 decode timed out"));},10000);\n` +
`    if(imageObj47.complete)onLoad();\n` +
`  });\n` +
`}\n` +
`function prepare(target){\n  if(!target || target.width!==800 || target.height!==600) throw new Error("P012 source canvas must be 800x600");\n  var ctx=target.getContext("2d");\n  if(!ctx) throw new Error("2D context required");\n  if(!preparedContexts.has(ctx)){enhanceContext(ctx);preparedContexts.add(ctx);}\n  return ctx;\n}\n` +
`function render(target,mainFrame,includeTitle,interactive){\n` +
`  if(!Number.isInteger(mainFrame)||mainFrame<1||mainFrame>119) throw new Error("P012 main frame must be 1..119");\n` +
`  if(!imageObj47.complete||imageObj47.naturalWidth!==38) throw new Error("Call ready() before rendering");\n` +
`  var ctx=prepare(target),previousCanvas=canvas;\n` +
`  if(activeInteractive)throw new Error("P012 reentrant interactive render");\n` +
`  canvas=target;activeInteractive=interactive||null;ctx.save();\n` +
`  try{\n` +
`    ctx.setTransform(1,0,0,1,0,0);\n` +
`    ctx.fillStyle="#b8d8f7";ctx.fillRect(0,0,800,600);\n` +
`    var ctrans=new cxform(0,0,0,0,255,255,255,255);\n` +
`    if(includeTitle)main(ctx,ctrans,5,0,mainFrame-1);\n` +
`    else place("sprite86",canvas,ctx,[0.05,0,0,0.05,412.4,283.3],ctrans,1,mainFrame-1,5,mainFrame-1);\n` +
`  }finally{ctx.restore();canvas=previousCanvas;activeInteractive=null;}\n` +
`  return Object.freeze({frameDomain:"sprite-86",mainFrame:mainFrame,rootFrame:6,sourceOnly:true,titleIncluded:includeTitle});\n` +
`}\n` +
`function finitePoint(point,label){\n` +
`  if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))throw new Error("Invalid "+label+" source coordinates");\n` +
`  if(Math.abs(point.x)>10000||Math.abs(point.y)>10000)throw new Error("Out-of-bounds "+label+" source coordinates");\n` +
`}\n` +
`function renderInteractive(target,state,options){\n` +
`  options=options||{};\n` +
`  if(!state||typeof state!=="object")throw new Error("Interactive state required");\n` +
`  finitePoint(state.spider,"spider");finitePoint(state.dot,"dot");finitePoint(state.bubble,"bubble");\n` +
`  if(![0,90,180,270].includes(state.spider.rotation))throw new Error("Invalid source spider rotation");\n` +
`  if(!state.popup||typeof state.popup.visible!=="boolean"||!Number.isInteger(state.popup.frame)||state.popup.frame<1||state.popup.frame>2)throw new Error("Invalid popup state");\n` +
`  if(state.popup.visible&&state.popup.frame!==2)throw new Error("Visible popup must be source frame 2");\n` +
`  if(!state.coach||typeof state.coach.playing!=="boolean"||!Number.isInteger(state.coach.frame)||state.coach.frame<1||state.coach.frame>55)throw new Error("Invalid coach state");\n` +
`  if(typeof state.coordinateText!=="string"||!/^\\(-?(?:10|[0-9]),-?(?:10|[0-9])\\)$/.test(state.coordinateText))throw new Error("Invalid coordinate text");\n` +
`  if(typeof options.nativeCoordinate!=="boolean"&&options.nativeCoordinate!==undefined)throw new Error("nativeCoordinate must be boolean");\n` +
`  if(!options.nativeCoordinate&&state.coordinateText!=="(0,0)")throw new Error("Source text34 cannot render changed coordinates; use nativeCoordinate");\n` +
`  var active={state:state,nativeCoordinate:options.nativeCoordinate===true,consumed:Object.create(null)};\n` +
`  render(target,119,true,active);\n` +
`  var expected=["sprite32","sprite61","sprite74","sprite76","sprite57","text34"];\n` +
`  for(var i=0;i<expected.length;i++)if(active.consumed[expected[i]]!==true)throw new Error("P012 interactive placement not consumed: "+expected[i]);\n` +
`  return Object.freeze({frameDomain:"sprite-86",mainFrame:119,rootFrame:6,sourceOnly:true,\n` +
`    coordinateText:state.coordinateText,nativeCoordinate:active.nativeCoordinate,\n` +
`    overridesConsumed:Object.freeze(expected.slice())});\n` +
`}\n` +
`global.HELP_MATH_P012_SOURCE_DRAWINGS=Object.freeze({\n  ready:ready,\n  renderRootFrame6:function(target,request){return render(target,request.mainFrame,true);},\n  renderMainFrame:function(target,request){return render(target,request.mainFrame,false);},\n  renderInteractive:renderInteractive,\n  metadata:Object.freeze({animationId:"shared-alg001-l12-p012",stage:Object.freeze({width:800,height:600}),fps:12,rootFrame:6,mainFrameCount:119,sourceOnly:true,textSuppressionApplied:false,dynamicCoordinateSuppressionOptional:true})\n});\n})(globalThis);\n`;
  new Script(script, {filename: 'p012-source-drawings.js'});
  assert(!script.includes('eval(') && !script.includes('setInterval('));
  return {script, names};
}

function pngDimensions(bytes) {
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(bytes.subarray(12, 16).toString('ascii'), 'IHDR');
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}
function composition(catalog, triage, raw, pngs, names) {
  const timeline = id => {
    const t = catalog.timelines.find(value => value.timelineId === id);
    assert(t, `missing timeline ${id}`);
    return {domain: id, declaredFrames: t.declaredFrameCount, observedFrames: t.observedFrameCount,
      placements: t.events.filter(e => e.kind === 'place' || e.kind === 'remove')};
  };
  const root = timeline('root');
  const title = root.placements.find(p => p.characterId === 1 && p.frame === 6);
  const main = root.placements.find(p => p.characterId === 86 && p.frame === 6);
  assert.equal(title.depth, 1);
  assert.equal(main.depth, 2);
  assert.deepEqual(main.matrix, [1,0,0,1,8248,5666]);
  const image47 = pngDimensions(readPhysical(path.join(raw, 'images/47.png')));
  assert.deepEqual(image47, {width: 38, height: 29});
  const shape1 = pngDimensions(readPhysical(path.join(pngs, '1.png')));
  const shape48 = pngDimensions(readPhysical(path.join(pngs, '48.png')));
  const shape56 = pngDimensions(readPhysical(path.join(pngs, '56.png')));
  const vectors = [1,48,56].map(id => {
    const graphic = triage.graphics.find(g => g.characterId === id);
    assert(graphic);
    return {characterId: id, sourceTagOffset: graphic.sourceTagOffset,
      sourceTagSha256: graphic.sourceTagSha256,
      svg: pin(path.join(raw, `shapes/${id}.svg`)),
      png: pin(path.join(pngs, `${id}.png`)),
      pngDimensions: {1:shape1,48:shape48,56:shape56}[id]};
  });
  return {schemaVersion: 1, kind: 'p012-source-graphics-composition-v1',
    animationId: 'shared-alg001-l12-p012', source: pin(SOURCE),
    stage: {width: 800, height: 600, fps: 12, backgroundColor: '#b8d8f7'},
    rootFrame: 6, rootLayerOrder: [{depth: 1, characterId: 1, role: 'outlined-English-title'},
      {depth: 2, characterId: 86, role: 'main-lesson-sprite', translationPixels: [412.4, 283.3]}],
    sourceFunctionCount: names.length, sourceFunctions: names,
    interactiveFrame119: {
      api: 'HELP_MATH_P012_SOURCE_DRAWINGS.renderInteractive(canvas800x600,state,{nativeCoordinate:true})',
      positionSemantics: 'spider, dot and bubble x/y are absolute source-local pixels; Canvas placement translation is x*20/y*20 twips',
      bindings: [
        {name:'Mc_Dot1', characterId:32, sourceFunction:'sprite32', depth:65, sourceFrame119Matrix:[0.75,0,0,0.75,2674,377], statePath:'dot', scaleRetained:0.75},
        {name:'mcOP', characterId:61, sourceFunction:'sprite61', depth:67, sourceFrame119Matrix:[1,0,0,1,2702,-236], statePath:'bubble', scaleRetained:1},
        {name:'Mc_Feed_Popup1', characterId:74, sourceFunction:'sprite74', depth:94, sourceFrame119Matrix:[1,0,0,1,1555,-689], statePath:'popup', visibleSourceFrame:2},
        {name:'Coach_audio_1', characterId:76, sourceFunction:'sprite76', depth:105, sourceFrame119Matrix:[1,0,0,1,-13516,36], statePath:'coach'},
        {name:'McSpider', characterId:57, sourceFunction:'sprite57', depth:123, sourceFrame119Matrix:[0.5,0,0,0.5,2676,382], statePath:'spider', scaleRetained:0.5},
        {name:'txtOP', characterId:34, sourceFunction:'text34', parentSprite:61, statePath:'coordinateText', nativeSuppressionOptIn:true,
          ffdecFunctionDrawsGlyphs:false}
      ],
      failClosedChecks: 'Exact function, source matrix, ratio and one-time consumption are checked at render; text34 suppression is opt-in only.'
    },
    classifiedVisuals: {
      shape1: {characterId: 1, role: 'outlined-title', observedText: 'Graphing in the Coordinate Plane: Vocabulary',
        evidence: 'FFDec shape 1 PNG visually inspected against source SVG path and root depth-1 placement',
        nativeSuppressionAuthorized: false},
      bitmap47: {characterId: 47, role: 'pointer-bitmap', dimensions: image47,
        png: pin(path.join(raw, 'images/47.png')), referencedByShape: 48,
        evidence: 'FFDec PNG visually displays a small pointer, not the spider'},
      shape48: {characterId: 48, role: 'pointer-vector-wrapper',
        evidence: 'FFDec PNG visually displays a pointer and source bitmap-fill link is shape 48 to bitmap 47'},
      shape56: {characterId: 56, role: 'spider-vector',
        evidence: 'FFDec PNG visually displays the spider; source sprite 57 places shape 56'}},
    selectedVectors: vectors,
    selectedTimelines: [root, timeline('sprite-57'), timeline('sprite-76'), timeline('sprite-86')],
    textSuppressionApplied: false, graphicsSuppressionApplied: false,
    claimBoundary: 'FFDec source drawing and static composition only; no AVM1 execution, motion, mask, text, audio, original-runtime, fidelity, listening or human acceptance.'};
}

function evidence(manifest) {
  const c = manifest.composition;
  return `# P012 source graphics extraction — 2026-09-27\n\n` +
    `The physical source \`${c.source.path}\` is ${c.source.bytes} bytes, SHA-256 \`${c.source.sha256}\`. ` +
    `The pinned Java/FFDec 26.2.1 toolchain generated raw root-frame and sprite 57/76/86 Canvas exports, selected SVGs and PNG inspection files. ` +
    `A fresh export reproduces every generated raw byte.\n\n` +
    `The usable browser bundle is \`${OUT_REL}/source-drawings.js\`. After loading it, call ` +
    `\`await globalThis.HELP_MATH_P012_SOURCE_DRAWINGS.ready()\`, then ` +
    `\`.renderRootFrame6(canvas800x600,{mainFrame:1})\` for source root frame 6 with the outlined title, ` +
    `or \`.renderMainFrame(canvas800x600,{mainFrame:119})\` for the main sprite alone. ` +
    `Frames are one-indexed 1–119. The bundle replaces FFDec's two string-eval dispatches with a frozen source-function table, ` +
    `removes its timer loop and standalone resize-demo DOM binding, and retains the actual source drawing functions. ` +
    `It does not execute ActionScript.\n\n` +
    `The maintained interactive drawing entry is \`.renderInteractive(canvas800x600,state,{nativeCoordinate:true})\`. ` +
    `It matches the reducer's absolute source-local spider/dot/bubble positions and source rotations, popup visibility/frame and coach frame, ` +
    `then checks that each of six exact frame-119/nested placements was consumed once. ` +
    `Only the nested dynamic text34 drawing can be skipped, and only through the explicit native-coordinate option. ` +
    `FFDec's text34 function draws no glyphs; the caller must draw the current coordinate string in a native layer. ` +
    `The static \`renderRootFrame6\` remains available for source comparison.\n\n` +
    `I visually inspected the FFDec PNGs: shape 1 is the outlined English title ` +
    `“Graphing in the Coordinate Plane: Vocabulary”; bitmap 47 is a small pointer, ` +
    `shape 48 is its vector wrapper, and sprite 57's shape 56 is the spider. ` +
    `The title sits at root depth 1; sprite 86 sits above it at depth 2 with a source placement of (8248,5666) twips = (412.4,283.3) pixels. ` +
    `The selected visual hashes, source tag offsets, placement events and mask-related source events are retained in \`composition.json\`.\n\n` +
    `No shape or text is suppressed. Source text, title, graphics, masks and interactive controls remain in the raw drawing; ` +
    `native replacement requires a later exact-instance review. FFDec static frame rendering does not establish stopped AVM1 behavior, ` +
    `original-runtime fidelity, coach playback or audio synchronization. This extraction creates no registry or acceptance claim.\n\n` +
    `Reproduce with \`node scripts/build-g678-alg-l12-p012-graphics-source.mjs --check\`.\n`;
}

function build(out, context) {
  const raw = path.join(out, 'raw'), pngs = path.join(out, 'shape-png');
  const helper = readPhysical(path.join(raw, 'frames/canvas.js')).toString('utf8');
  const html = readPhysical(path.join(raw, 'frames/frames.html')).toString('utf8');
  const drawing = buildSourceDrawings(helper, html);
  const comp = composition(context.catalog, context.triage, raw, pngs, drawing.names);
  const generated = new Map([
    [path.join(out, 'source-drawings.js'), Buffer.from(drawing.script)],
    [path.join(out, 'composition.json'), Buffer.from(json(comp))]
  ]);
  const rawFiles = [...EXPECTED_RAW.map(file => path.join(raw, file)),
    ...EXPECTED_PNG.map(file => path.join(pngs, file))];
  const manifest = {schemaVersion: 1, kind: 'p012-graphics-source-extraction-v1',
    source: pin(SOURCE), sourceCopy: pin(path.join(ROOT, COPY_REL)),
    sourceCatalog: pin(path.join(ROOT, CATALOG_REL)), frozenTriage: pin(path.join(ROOT, TRIAGE_REL)),
    extractionReceipt: pin(path.join(ROOT, RECEIPT_REL)),
    tool: {version: 'JPEXS Free Flash Decompiler 26.2.1', java: pin(JAVA), jar: pin(JAR)},
    generator: pin(fileURLToPath(import.meta.url)),
    rawOutputs: rawFiles.map(pin),
    generatedOutputs: [...generated].map(([file, bytes]) => ({path: relative(file), bytes: bytes.length, sha256: sha(bytes)})),
    composition: comp,
    verification: 'Fresh FFDec extraction compared byte-for-byte with all held raw outputs; Canvas bundle parsed by node:vm Script.',
    gates: {registered: false, originalRuntime: false, fidelity: false, audio: false,
      human: false, owner: false, strictComplete: false, published: false}};
  generated.set(path.join(out, 'manifest.json'), Buffer.from(json(manifest)));
  generated.set(path.join(ROOT, EVIDENCE_REL), Buffer.from(evidence(manifest)));
  return {manifest, generated};
}

function main() {
  const mode = process.argv[2];
  assert(['--write', '--check'].includes(mode) && process.argv.length === 3,
    'usage: build-g678-alg-l12-p012-graphics-source.mjs --write | --check');
  const context = checkSourceAndTools();
  const out = path.join(ROOT, OUT_REL);
  if (mode === '--write' && !fs.existsSync(path.join(out, 'raw'))) {
    runExport(path.join(out, 'raw'), 'canvas');
    runExport(path.join(out, 'shape-png'), 'shape-png');
  }
  verifyRawAgainstFresh(out);
  const {manifest, generated} = build(out, context);
  if (mode === '--write') {
    for (const [file, bytes] of generated) {
      fs.mkdirSync(path.dirname(file), {recursive: true});
      fs.writeFileSync(file, bytes, {flag: 'wx'});
    }
  } else {
    for (const [file, bytes] of generated) assert.deepEqual(readPhysical(file), bytes, `generated drift: ${file}`);
  }
  console.log(JSON.stringify({mode, output: OUT_REL, rawFiles: manifest.rawOutputs.length,
    sourceFunctions: manifest.composition.sourceFunctionCount,
    bundleSha256: manifest.generatedOutputs[0].sha256,
    rootTitle: manifest.composition.classifiedVisuals.shape1.observedText}));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
