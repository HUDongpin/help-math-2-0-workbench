#!/usr/bin/env node
// P002-only, unregistered drawing candidate. Source and extraction inputs are read-only.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateRealWorldRuntime} from './validate-g678-alg-l12-p002-runtime.mjs';
import {buildSafeRuntime} from './build-safe-ffdec-canvas-adapter.mjs';
import {extractTerminalStream} from './prepare-g678-terminal-source-v1.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ID = 'shared-alg001-l12-p002';
const WORK = `migrations/${ID}`;
const OUTPUT = `${WORK}/candidate-v2`;
const CANONICAL = `work/g678-shared-page-factory/g678-alg-l12-real-world-current-js-v1/members/${ID}`;
const SOURCE = 'G6-G8-shared/ALG001/L12/RW/L12RW02.swf';
const SA = 'G6-G8-shared/ALG001/L12/SA/L12RW02.mp3';
const SOURCE_SHA = '15e67732b739f0194087ded0748c2d23f9871363ed33388807c351f2aad6fb62';
const SA_SHA = 'cad83108fed08731582e639c0ef8c5886a5c56dab710c277c639cc0603c0fcf3';
const XML_SHA = '9332ec48d2a17395e7d37c593b5336aa47bb0a821ba135fb3e350d425af19aee';
const MAIN_SHA = '7936b06cd3de8afdd00c4af8631634e8bbe2bb6397137b3f2acb61f10c03cc21';
const TITLE_SHA = '5aee4b201379af0c66297fd0dc010ff369fadbeb9a5ac1252f3de72fd19f7cbd';
const HELPER_SHA = '78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93';
const PEER = 'migrations/shared-alg001-l12-p011/candidate-v2/adapter-spec.json';
const PEER_SHA = 'bf1e93fc87b09cc967f9fa1b3dea253334141e34c7a58fb78c4f5de4b0cfaa3b';
const BUILDER = 'scripts/build-g678-alg-l12-p002-candidate.mjs';
const SHARED_ADAPTER = 'scripts/build-safe-ffdec-canvas-adapter.mjs';
const STREAM_PARSER = 'scripts/prepare-g678-terminal-source-v1.mjs';
const EXPORT = `${WORK}/audit/ffdec-26.2.1-canvas-v1`;
const MAIN = `${EXPORT}/DefineSprite_454/frames.html`;
const TITLE = `${EXPORT}/DefineSprite_458/frames.html`;
const HELPER = `${EXPORT}/DefineSprite_454/canvas.js`;
const AUDIT = `${WORK}/SOURCE_AUDIT_2026-09-25.md`;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const px = twips => Math.round(twips / 20 * 100) / 100;

async function pinned(relative, expected) {
  const bytes = await readFile(path.join(ROOT, relative));
  assert.equal(hash(bytes), expected, `input drift: ${relative}`);
  return bytes;
}

function once(text, marker, replacement) {
  assert.equal(text.split(marker).length, 2, `unique marker drift: ${marker.slice(0, 75)}`);
  return text.replace(marker, replacement);
}

function definitions(html) {
  const start = html.indexOf('var scalingGrids = {};');
  const end = html.indexOf('\nvar frame = -1;');
  assert(start >= 0 && end > start, 'FFDec definition boundaries');
  return html.slice(start, end);
}

function placement(xml, id, depth) {
  const match = xml.match(new RegExp(`<PlaceObject2 replace="0" depth="${depth}" objectID="${id}"[^>]*>[\\s\\S]*?<Transform transX="(-?\\d+)" transY="(-?\\d+)"/>[\\s\\S]*?</PlaceObject2>`));
  assert(match, `root placement ${id} at depth ${depth}`);
  return {x: px(Number(match[1])), y: px(Number(match[2]))};
}

function rootFrameShape(xml) {
  const match = xml.match(/<DefineShape objectID="459">([\s\S]*?)<\/DefineShape>/);
  assert(match && match[1].includes('<Color red="54" green="107" blue="231"/>'), 'root frame shape 459');
  assert(match[1].includes('<Rectangle left="1383" right="14967" top="1621" bottom="9688"/>'), 'root frame bounds');
  const edges = match[1].slice(match[1].indexOf('<Shape>'), match[1].indexOf('</Shape>'));
  const commands = [];
  let x = 0, y = 0, contours = 0;
  for (const tag of edges.match(/<(?:ShapeSetup|LineTo)[^>]*\/>/g) ?? []) {
    if (tag.startsWith('<ShapeSetup')) {
      const at = tag.match(/x="(-?\d+)" y="(-?\d+)"/);
      if (at) {
        if (contours) commands.push('ctx.closePath();');
        x = Number(at[1]); y = Number(at[2]); contours++;
        commands.push(`ctx.moveTo(${px(x)}, ${px(y)});`);
      }
    } else {
      const delta = tag.match(/x="(-?\d+)" y="(-?\d+)"/);
      assert(delta, 'line edge');
      x += Number(delta[1]); y += Number(delta[2]);
      commands.push(`ctx.lineTo(${px(x)}, ${px(y)});`);
    }
  }
  assert.equal(contours, 2, 'outer and inner frame contours');
  assert.equal(commands.filter(command => command.startsWith('ctx.lineTo')).length, 19, 'frame edge count');
  commands.push('ctx.closePath();');
  return `ctx.save();\n        ctx.beginPath();\n        ${commands.join('\n        ')}\n        ctx.fillStyle = '#366be7';\n        ctx.fill('evenodd');\n        ctx.restore();`;
}

function audioIdentification(swf, sa) {
  const stream = extractTerminalStream(swf, 'sprite-454');
  assert.deepEqual(stream.heads.map(({domain, frame, hex}) => [domain, frame, hex]),
    [['sprite-454', 1, '0a2a2d078906']]);
  assert.equal(stream.blocks.length, 1927);
  assert.equal(stream.blocks[0].frame, 1);
  assert.equal(stream.blocks.at(-1).frame, 1951);
  const windows = [];
  for (const block of stream.blocks) {
    const last = windows.at(-1);
    if (last && block.frame === last.lastFrame + 1) {
      last.lastFrame = block.frame;
      last.blocks++;
      last.declaredSamples += block.samples;
      last.mp3Bytes += block.mp3Bytes;
    } else {
      windows.push({firstFrame: block.frame, lastFrame: block.frame,
        blocks: 1, declaredSamples: block.samples, mp3Bytes: block.mp3Bytes});
    }
  }
  assert.deepEqual(windows.map(({firstFrame, lastFrame}) => [firstFrame, lastFrame]),
    [[1, 415], [435, 1115], [1121, 1951]]);
  assert.equal(sa.length, 478128);
  assert.equal(hash(sa), SA_SHA);
  return {
    schemaVersion: 1, animationId: ID,
    source: {path: SOURCE, sha256: SOURCE_SHA},
    embedded: {domain: 'sprite-454', headHex: stream.heads[0].hex,
      compression: 'MP3', declaredRateHz: 22050, blockCount: stream.blocks.length,
      payloadBytes: stream.mp3.length, payloadSha256: hash(stream.mp3), windows,
      emptyBlockFrames: stream.blocks.filter(block => block.mp3Bytes === 0).map(block => block.frame),
      negativeSeekFrames: stream.blocks.filter(block => block.seek < 0).map(block => block.frame)},
    separateSA: {path: SA, bytes: sa.length, sha256: SA_SHA,
      byteIdenticalToEmbedded: sa.equals(stream.mp3)},
    disposition: 'Stream cue meaning, pause/resume/sync, SA relationship, language and human listening remain unresolved; candidate renders no audio.',
  };
}

async function outputFile(name, bytes, check) {
  const target = path.join(ROOT, OUTPUT, name);
  if (check) assert((await readFile(target)).equals(bytes), `generated drift: ${name}`);
  else await writeFile(target, bytes, {flag: 'wx'});
}

async function main() {
  const promote = process.argv.length === 3 && process.argv[2] === '--promote';
  const check = promote || (process.argv.length === 3 && process.argv[2] === '--check');
  assert(process.argv.length === 2 || check, 'usage: build-g678-alg-l12-p002-candidate.mjs [--check]');
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT, SOURCE_ROOT, 'physical source root required');
  assert((await lstat(SOURCE_ROOT)).isDirectory() && !(await lstat(SOURCE_ROOT)).isSymbolicLink());
  assert.equal(await realpath(SOURCE_ROOT), SOURCE_ROOT);
  const swfPath = path.join(SOURCE_ROOT, SOURCE);
  const saPath = path.join(SOURCE_ROOT, SA);
  for (const file of [swfPath, saPath]) {
    assert((await lstat(file)).isFile() && !(await lstat(file)).isSymbolicLink());
    assert.equal(await realpath(file), file);
  }
  const swf = await readFile(swfPath);
  assert.equal(swf.length, 1802335);
  assert.equal(hash(swf), SOURCE_SHA);
  const sa = await readFile(saPath);
  const [xmlBytes, mainBytes, titleBytes, helperBytes, peerBytes, auditBytes] = await Promise.all([
    pinned(`${WORK}/audit/movie.xml`, XML_SHA), pinned(MAIN, MAIN_SHA),
    pinned(TITLE, TITLE_SHA), pinned(HELPER, HELPER_SHA), pinned(PEER, PEER_SHA),
    readFile(path.join(ROOT, AUDIT)),
  ]);
  const xml = xmlBytes.toString();
  assert(xml.includes('<Header framerate="12" frames="10">') &&
    xml.includes('<DefineSprite objectID="454" frames="1951">') &&
    xml.includes('<DefineSprite objectID="458" frames="1">'), 'source frame domains');
  assert(xml.includes('<Rectangle left="16" right="11603" top="125" bottom="593"/>') &&
    xml.includes('<Rectangle left="-5720" right="5585" top="1473" bottom="1961"/>') &&
    xml.includes('<PlaceObject2 replace="0" depth="1" objectID="456">') &&
    xml.includes('<PlaceObject2 replace="0" depth="2" objectID="457">'),
  'title child bounds and placement');
  const mainRoot = placement(xml, 454, 1);
  const titleRoot = placement(xml, 458, 147);
  const borderRoot = placement(xml, 459, 150);
  assert.deepEqual([mainRoot, titleRoot, borderRoot],
    [{x: 278.4, y: 366.85}, {x: 403.4, y: -42.4}, {x: 0, y: 0}]);
  const mainHtml = mainBytes.toString().replace(/\r\n?/g, '\n');
  const titleHtml = titleBytes.toString().replace(/\r\n?/g, '\n');
  const titleDefs = definitions(titleHtml).replace('var scalingGrids = {};', '');
  const mainNames = new Set([...definitions(mainHtml).matchAll(/function\s+([\w$]+)\s*\(/g)].map(m => m[1]));
  const titleNames = [...titleDefs.matchAll(/function\s+([\w$]+)\s*\(/g)].map(m => m[1]);
  assert(titleNames.every(name => !mainNames.has(name)), 'title symbol collision');
  assert.equal(mainNames.size, 454);
  assert.deepEqual(titleNames.sort(), ['font455', 'shape457', 'sprite458', 'text456']);
  const titleHeader = titleDefs.match(/function sprite458\(ctx,ctrans,frame,ratio,time\)\{\s*ctx.save\(\);\s*ctx.transform\(1,0,0,1,([-\d.]+),([-\d.]+)\);\s*var clips = \[\];\s*var frame_cnt = 1;/);
  assert(titleHeader && Number(titleHeader[1]) === 286 && Number(titleHeader[2]) === 89.35);
  const html = once(mainHtml, '\nvar frame = -1;', `${titleDefs}\nvar frame = -1;`);
  const defs = definitions(html);
  const placed = [...new Set([...defs.matchAll(/place\("([\w$]+)"/g)].map(m => m[1]))].sort();
  const fonts = [...defs.matchAll(/function\s+(font\d+)\(ctx,ch,textColor\)\{/g)].map(m => m[1]);
  const images = [...defs.matchAll(/var\s+(imageObj\d+)\s*=\s*document\.createElement\("img"\);/g)].map(m => m[1]);
  assert.equal(placed.length, 452);
  assert.deepEqual(fonts, ['font455']);
  assert.deepEqual(images, ['imageObj2', 'imageObj132', 'imageObj146']);

  const audioFacts = audioIdentification(swf, sa);
  const audio = json(audioFacts);
  const spec = structuredClone(JSON.parse(peerBytes));
  Object.assign(spec, {animationId: `course-${ID}`, builderAnimationId: `course-${ID}`,
    finalAnimationId: ID, classification: 'private-long-form-composed-canvas-candidate',
    title: 'Graphing in the Coordinate Plane: Real World Activity'});
  spec.source = {swf: `$HELP_MATH_G678_SOURCE_ROOT/${SOURCE}`, swfBytes: swf.length, swfSha256: SOURCE_SHA};
  spec.evidence = {scenarioInventory: AUDIT, scenarioInventorySha256: hash(auditBytes),
    audioAudit: `${OUTPUT}/audio-identification.json`, audioAuditSha256: hash(audio)};
  Object.assign(spec.ffdecExport, {helper: HELPER, helperSha256: HELPER_SHA, helperBytes: helperBytes.length,
    framesHtml: MAIN, framesHtmlSha256: MAIN_SHA, framesHtmlBytes: mainBytes.length,
    targetSpriteObjectId: 454, targetSpriteFunction: 'sprite454',
    exportCanvas: {width: 1906, height: 2149},
    exportInternalTranslation: {x: 1204.6, y: 604},
    expectedPlacedFunctionCount: placed.length, expectedPlacedFunctionsSha256: hash(JSON.stringify(placed)),
    expectedFontFunctionCount: fonts.length, expectedFontFunctionsSha256: hash(JSON.stringify(fonts)),
    embeddedImageVariableCount: images.length, embeddedImageVariablesSha256: hash(JSON.stringify(images))});
  spec.timeline.root = {...spec.timeline.root, placementDepth: '1',
    placementTwips: {x: 5568, y: 7337}, placementPixels: mainRoot};
  spec.timeline.local = {timelineId: 'sprite-454', frameCount: 1951,
    livePlaybackEndFrame: 1951, playbackMode: 'once', publicFrameIndexing: 'one-indexed'};
  spec.timeline.stageRenderOffset = {x: -926.2, y: -237.15};
  spec.runtimeContract.unresolved = [
    'Static inspection of sprite-454 frames only; root preloader and natural child clock are not reproduced.',
    'Embedded MP3 stream and separate SA MP3 are identified but no audio is rendered or accepted.',
    'Title text lies above the stage; title shape and root frame shape are composed from source placements. Original-runtime visual comparison remains open.',
    'My Lesson, Spanish localization, human/Owner review, strict completion and publication remain open.',
  ];
  spec.output = {script: `${OUTPUT}/canvas-renderer.js`, manifest: `${OUTPUT}/adapter-manifest.json`,
    spec: `${OUTPUT}/adapter-spec.json`, globalRegistry: 'HELP_MATH_CANVAS_ASSETS'};
  spec.sourceComposition = {
    rootFrame: 6, main: {objectId: 454, depth: 1, rootPosition: mainRoot},
    title: {objectId: 458, depth: 147, rootPosition: titleRoot,
      export: TITLE, exportSha256: TITLE_SHA,
      sourceTextStageY: [-131.75, -108.35], sourceShapeStageY: [31.25, 55.65]},
    frame: {objectId: 459, depth: 150, rootPosition: borderRoot,
      source: `${WORK}/audit/movie.xml`, sourceSha256: XML_SHA},
  };
  let runtime = buildSafeRuntime({helperSource: helperBytes.toString(), framesHtml: html, spec}).runtime;
  const mainCall = `ctx.transform(1, 0, 0, 1, -926.2, -237.15);\n        sprite454(ctx, new cxform(0,0,0,0,255,255,255,255), state.exportFrame, 0, 0);`;
  const titleOffset = {x: 117.4, y: -131.75};
  runtime = once(runtime, mainCall, `ctx.save();\n        ${mainCall}\n        ctx.restore();\n        ctx.save();\n        ctx.setTransform(1, 0, 0, 1, ${titleOffset.x}, ${titleOffset.y});\n        sprite458(ctx, new cxform(0,0,0,0,255,255,255,255), 0, 0, 0);\n        ctx.restore();\n        ${rootFrameShape(xml)}`);
  runtime = runtime.split(JSON.stringify(spec.animationId)).join(JSON.stringify(ID));
  // FFDec mask compositing retains raster state across draws on one context.
  // Each requested source frame starts on a fresh surface, including Replay.
  runtime = once(runtime, 'var registry = global[', `var sourceFrameRender = render;
render = function(targetCanvas, request) {
    if (targetCanvas.width !== 800 || targetCanvas.height !== 600) {
        throw new Error("targetCanvas must be exactly 800x600");
    }
    var surface = document.createElement("canvas");
    surface.width = 800;
    surface.height = 600;
    var state = sourceFrameRender(surface, request);
    var targetContext = targetCanvas.getContext("2d");
    targetContext.save();
    try {
        targetContext.setTransform(1, 0, 0, 1, 0, 0);
        targetContext.globalAlpha = 1;
        targetContext.globalCompositeOperation = "copy";
        targetContext.drawImage(surface, 0, 0);
    } finally { targetContext.restore(); }
    ["data-flash-frame", "data-flash-frame-domain", "data-flash-root-frame", "data-runtime-scenario", "data-runtime-seed"].forEach(function(name) {
        targetCanvas.setAttribute(name, surface.getAttribute(name));
    });
    return state;
};
var registry = global[`);
  validateRealWorldRuntime(runtime);
  const runtimeBytes = Buffer.from(runtime);
  const specBytes = json(spec);
  const probe = await readFile(path.join(ROOT, WORK, 'candidate/local-visual-probe.html'));
  const finalValidator = await readFile(path.join(ROOT, 'scripts/validate-g678-alg-l12-p002-runtime.mjs'));
  const [builder, sharedAdapter, streamParser] = await Promise.all([
    readFile(path.join(ROOT, BUILDER)), readFile(path.join(ROOT, SHARED_ADAPTER)),
    readFile(path.join(ROOT, STREAM_PARSER)),
  ]);
  const manifest = json({schemaVersion: 1, animationId: ID,
    status: 'unregistered-composed-canvas-drawing-candidate',
    source: {path: SOURCE, bytes: swf.length, sha256: SOURCE_SHA},
    inputs: {xml: {path: `${WORK}/audit/movie.xml`, sha256: XML_SHA},
      mainFrames: {path: MAIN, sha256: MAIN_SHA}, titleFrames: {path: TITLE, sha256: TITLE_SHA},
      helper: {path: HELPER, sha256: HELPER_SHA}, peerSpec: {path: PEER, sha256: PEER_SHA},
      sourceAudit: {path: AUDIT, sha256: hash(auditBytes)},
      builder: {path: BUILDER, sha256: hash(builder)},
      sharedAdapter: {path: SHARED_ADAPTER, sha256: hash(sharedAdapter)},
      streamParser: {path: STREAM_PARSER, sha256: hash(streamParser)},
      finalValidator: {path: 'scripts/validate-g678-alg-l12-p002-runtime.mjs', sha256: hash(finalValidator)}},
    composition: spec.sourceComposition,
    outputs: {spec: {sha256: hash(specBytes), bytes: specBytes.length},
      runtime: {sha256: hash(runtimeBytes), bytes: runtimeBytes.length},
      audioIdentification: {sha256: hash(audio), bytes: audio.length},
      localProbe: {sha256: hash(probe), bytes: probe.length}},
    acceptanceEffects: {currentJavaScriptRegistered: false, originalRuntimeAccepted: false,
      fidelityAccepted: false, audioAccepted: false, humanAccepted: false,
      ownerAccepted: false, strictComplete: false, published: false}});
  if (!check) await mkdir(path.join(ROOT, OUTPUT), {recursive: true});
  await outputFile('adapter-spec.json', specBytes, check);
  await outputFile('canvas-renderer.js', runtimeBytes, check);
  await outputFile('audio-identification.json', audio, check);
  await outputFile('adapter-manifest.json', manifest, check);
  await outputFile('local-visual-probe.html', probe, check);
  if (promote) {
    await mkdir(path.join(ROOT, CANONICAL), {recursive: true});
    const target = path.join(ROOT, CANONICAL, 'canvas-renderer.js');
    try {await writeFile(target, runtimeBytes, {flag: 'wx'});}
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      assert((await readFile(target)).equals(runtimeBytes), 'canonical runtime drift');
    }
  }
  console.log(JSON.stringify({animationId: ID, check, runtimeSha256: hash(runtimeBytes),
    runtimeBytes: runtimeBytes.length, currentJavaScriptRegistered: false}));
}

main().catch(error => {console.error(error); process.exitCode = 1;});
