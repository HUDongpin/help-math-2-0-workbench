#!/usr/bin/env node
/** One source-only Canvas producer with two physical ALG L12 consumers.
 * It executes no AVM1, audio, glossary callback, or original Flash runtime. */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script, createContext} from 'node:vm';
import {parse} from 'acorn';
import {buildSafeRuntime} from './build-safe-ffdec-canvas-adapter.mjs';
import {PAIR_OUTPUT, PAIR_PAGES, buildGlossaryPairInputs, physicalPairInput} from './build-g678-alg-l12-glossary-pair-inputs.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = fileURLToPath(import.meta.url);
const hash = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const normalize = value => value.replace(/\r\n?/g, '\n');
const pin = (bytes, sha256) => ({bytes, sha256});

/** These are reviewed expectations from the two separate physical exports,
 * not values inferred from the same input used to build a runtime. */
export const PAIR_CANVAS_EXPECTATIONS = Object.freeze({
  p013: Object.freeze({
    sprite: 63, frames: 372, companion: 64, internal: [369.9, 204.9], exportSize: [638, 399],
    xml: pin(924429, '16574c3bd603caaed557161b21d3c9bd5d2f441587dc05ade2e7edc9f2ddbfa1'),
    helper: pin(52872, '78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93'),
    framesHtml: pin(2375912, 'c2c3499a052d19111f64a80ea64aeadde311e32faebe0b139cc92999c0d26f80'),
    rootHtml: pin(2382656, '6ef6562b81bc25d752f1b63933c3f1e894c85f6b438fb13fc117e513b0a17485'),
    textFunctions: 26, shapeFunctions: 29, fontFunctions: ['font3', 'font15', 'font33'],
    buttonFunctions: 4, placedFunctions: 60,
    placedSha256: 'adb43ecc815c9986c4e77bd7819cf5a4590ae735da734ad168edf461bf9c241f',
    masks: [[2, 1, 1, 10], [72, 1, 11, 16]], maskBlocks: 672,
    audio: {firstFrame: 2, lastFrame: 365, blockCount: 364,
      emptyFrames: [3, 365], negativeSeekBlocks: [[365, -2071]]},
  }),
  p015: Object.freeze({
    sprite: 76, frames: 474, companion: 77, internal: [380.35, 205.1], exportSize: [1016, 390],
    xml: pin(1779675, 'efe4af42b678998c87b73a3e7bc469bca8c2be3492f6ac38e9fafa74e9cd3369'),
    helper: pin(52872, '78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93'),
    framesHtml: pin(5878966, 'edc31192b011f4007b65a2ff0acce8f7fd69548ad030e423a4ce53401deabc88'),
    rootHtml: pin(5821422, '7d2cf756c41b08d55e242f638d6d0d56d0d801ef606af1ae0cf4f0cbf85bb2c9'),
    textFunctions: 19, shapeFunctions: 48, fontFunctions: ['font2', 'font55'],
    buttonFunctions: 6, placedFunctions: 74,
    placedSha256: '2da95229d26023481573dc4bf98b4fb4a0cc4cd0d90e939a1aa97c06eb16e85c',
    masks: [[3, 19, 108, 121], [66, 19, 122, 127]], maskBlocks: 881,
    audio: {firstFrame: 3, lastFrame: 474, blockCount: 472,
      emptyFrames: [4], negativeSeekBlocks: []},
  }),
});

const XML_PROJECTION = `import json,sys,xml.etree.ElementTree as E
r=E.fromstring(sys.stdin.buffer.read());tags=r.find('tags');stage=r.find('displayRect')
sprites=[e for e in tags if e.get('type')=='DefineSpriteTag'];assert len(sprites)==1
s=sprites[0];frame=1;active={};maskCounts=[];masks=[];blocks=[]
for e in s.find('subTags'):
 t=e.get('type','');d=e.get('depth')
 if t.startswith('RemoveObject'):active.pop(d,None)
 if t.startswith('PlaceObject'):
  if e.get('placeFlagMove')=='false':active.pop(d,None)
  if e.get('placeFlagHasClipDepth')=='true':
   active[d]=e.get('clipDepth');masks.append([frame,int(e.get('characterId')),int(d),int(e.get('clipDepth'))])
 if t=='SoundStreamBlockTag':
  data=bytes.fromhex(e.get('streamSoundData'));assert len(data)>=4
  blocks.append({'frame':frame,'samples':int.from_bytes(data[:2],'little'),'seek':int.from_bytes(data[2:4],'little',signed=True),'payloadBytes':len(data)-4})
 if t=='ShowFrameTag':maskCounts.append(len(active));frame+=1
rootFrame=1;placements=[]
for e in tags:
 t=e.get('type','')
 if t.startswith('PlaceObject') and e.get('characterId') is not None:
  m=e.find('matrix');placements.append({'frame':rootFrame,'characterId':int(e.get('characterId')),'name':e.get('name'),'depth':int(e.get('depth')),'hasScale':m.get('hasScale'),'hasRotate':m.get('hasRotate'),'translate':[int(m.get('translateX')),int(m.get('translateY'))]})
 if t=='ShowFrameTag':rootFrame+=1
buttons=[]
for e in tags:
 if e.get('type')=='DefineButton2Tag':
  records=list(e.find('characters'));buttons.append({'id':int(e.get('buttonId')),'hitOnly':len(records)==1 and records[0].get('buttonStateHitTest')=='true' and all(records[0].get(k)=='false' for k in ('buttonStateUp','buttonStateOver','buttonStateDown'))})
head=next(e for e in s.find('subTags') if e.get('type')=='SoundStreamHeadTag')
out={'fps':float(r.get('frameRate')),'stageTwips':[int(stage.get(k)) for k in ('Xmin','Xmax','Ymin','Ymax')],'rootFrames':int(r.get('frameCount')),'sprite':int(s.get('spriteId')),'frames':int(s.get('frameCount')),'childActionCount':sum(e.get('type')=='DoActionTag' for e in s.find('subTags')),'placements':placements,'buttons':buttons,'masks':masks,'maskCounts':maskCounts,'audio':{'latencySeek':int(head.get('latencySeek')),'compression':int(head.get('streamSoundCompression')),'firstFrame':min(b['frame'] for b in blocks),'lastFrame':max(b['frame'] for b in blocks),'blockCount':len(blocks),'emptyFrames':[b['frame'] for b in blocks if b['payloadBytes']==0],'negativeSeekBlocks':[[b['frame'],b['seek']] for b in blocks if b['seek']<0]}}
print(json.dumps(out,separators=(',',':')))
`;

function sourceStructure(xml, page, expected) {
  const result = spawnSync('python3', ['-c', XML_PROJECTION],
    {input: xml, encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024});
  assert(!result.error && result.status === 0, `source XML projection failed: ${result.error?.message ?? result.stderr}`);
  const actual = JSON.parse(result.stdout);
  assert.equal(actual.fps, 12); assert.deepEqual(actual.stageTwips, [0, 16000, 0, 12000]);
  assert.equal(actual.rootFrames, 10); assert.equal(actual.sprite, expected.sprite);
  assert.equal(actual.frames, expected.frames); assert.equal(actual.childActionCount, 0);
  assert.deepEqual(actual.placements.map(({frame, characterId, name, depth, hasScale, hasRotate, translate}) =>
    [frame, characterId, name, depth, hasScale, hasRotate, translate]), [
      [6, expected.sprite, 'animation', 1, 'false', 'false', [8248, 5666]],
      [6, expected.companion, null, page.short === 'p013' ? 68 : 129, 'false', 'false', [0, 0]],
    ]);
  assert(actual.buttons.every(button => button.hitOnly));
  assert.deepEqual(actual.buttons.map(button => button.id).sort((a,b) => a-b),
    Object.keys(PAIR_PAGES.find(config => config.short === page.short).buttons).map(Number).sort((a,b) => a-b));
  assert.deepEqual(actual.masks, expected.masks);
  assert.equal(actual.maskCounts.length, expected.frames);
  assert.equal(actual.maskCounts.reduce((a,b) => a+b, 0), expected.maskBlocks);
  assert.deepEqual(actual.audio, {latencySeek: 1673, compression: 2, ...expected.audio});
  return actual;
}

function declarations(html) {
  const source = normalize(html);
  const start = source.indexOf('var scalingGrids = {};'), end = source.indexOf('\nvar frame = -1;');
  assert(start >= 0 && end > start && source.indexOf('var scalingGrids = {};', start + 1) < 0,
    'one Canvas declaration boundary');
  return {source, code: source.slice(start, end)};
}

function functions(code) {
  const nodes = parse(code, {ecmaVersion: 2020}).body.filter(node => node.type === 'FunctionDeclaration');
  const result = new Map(nodes.map(node => [node.id.name, code.slice(node.start, node.end)]));
  assert.equal(result.size, nodes.length, 'unique source drawing functions');
  return result;
}

function replaceOnce(text, marker, value) {
  assert.equal(text.split(marker).length, 2, `one source marker: ${marker.slice(0, 60)}`);
  return text.replace(marker, value);
}

function sourceCanvas(input, expected, structure) {
  const sprite = declarations(input.framesHtml.bytes.toString('utf8'));
  const root = declarations(input.rootHtml.bytes.toString('utf8'));
  const spriteFunctions = functions(sprite.code), rootFunctions = functions(root.code);
  const spriteName = `sprite${expected.sprite}`, shapeName = `shape${expected.companion}`;
  assert.deepEqual([...rootFunctions.keys()].filter(name => !spriteFunctions.has(name)), [shapeName, 'main']);
  assert.deepEqual([...rootFunctions.keys()].filter(name => spriteFunctions.has(name) &&
    spriteFunctions.get(name) !== rootFunctions.get(name)), [spriteName]);
  const header = spriteFunctions.get(spriteName);
  assert(header?.startsWith(`function ${spriteName}(ctx,ctrans,frame,ratio,time){\n\tctx.save();\n\tctx.transform(1,0,0,1,${expected.internal[0]},${expected.internal[1]});\n\tvar clips = [];\n\tvar frame_cnt = ${expected.frames};`));
  assert.equal([...spriteFunctions].filter(([name]) => /^text\d+$/.test(name)).length, expected.textFunctions);
  assert.equal([...spriteFunctions].filter(([name]) => /^shape\d+$/.test(name)).length, expected.shapeFunctions);
  assert.equal([...spriteFunctions].filter(([name]) => /^button\d+$/.test(name)).length, expected.buttonFunctions);
  assert.deepEqual([...spriteFunctions.keys()].filter(name => /^font\d+$/.test(name)), expected.fontFunctions);
  const rootMain = rootFunctions.get('main');
  const case6 = rootMain.slice(rootMain.indexOf('\n\t\tcase 5:'), rootMain.indexOf('\n\t\tcase 6:'));
  assert.equal(case6, `\n\t\tcase 5:\n\t\t\tplace("${spriteName}",canvas,ctx,[0.05,0.0,0.0,0.05,412.4,283.3],ctrans,1,(0+time)%${expected.frames},5,time);\n\t\t\tplace("${shapeName}",canvas,ctx,[0.05,0.0,0.0,0.05,0.0,0.0],ctrans,1,0,0,time);\n\t\t\tbreak;`);
  const composed = replaceOnce(sprite.source, '\nvar frame = -1;',
    `\n${rootFunctions.get(shapeName)}\n${rootMain}\nvar frame = -1;`);
  const composedFunctions = functions(declarations(composed).code);
  for (const [name, body] of spriteFunctions) assert.equal(composedFunctions.get(name), body);
  assert.equal(composedFunctions.get(shapeName), rootFunctions.get(shapeName));
  const placed = [...new Set([...declarations(composed).code.matchAll(/place\("([A-Za-z_$][A-Za-z0-9_$]*)"/g)]
    .map(match => match[1]))].sort();
  assert.equal(placed.length, expected.placedFunctions);
  assert.equal(hash(JSON.stringify(placed)), expected.placedSha256);
  const cases = [...header.matchAll(/\t\tcase (\d+):([\s\S]*?)(?=\t\tcase \d+:|\t\})/g)];
  assert.equal(cases.length, expected.frames);
  for (const [index, [, number, body]] of cases.entries()) {
    assert.equal(Number(number), index);
    const count = (body.match(/clips\.push\(\{ctx:ctx,canvas:canvas\}\);/g) ?? []).length;
    assert.equal(count, structure.maskCounts[index], `XML/Canvas clip count at frame ${index+1}`);
    for (const marker of ['var o = clips.pop();', 'ctx.globalCompositeOperation = "destination-in";',
      'ctx.drawImage(o.clipCanvas,0,0);']) assert.equal(body.split(marker).length-1, count,
      `complete source mask compositor at frame ${index+1}`);
  }
  const canvas = sprite.source.match(/<canvas\s+id="myCanvas"\s+width="(\d+)"\s+height="(\d+)"/);
  assert.deepEqual(canvas?.slice(1).map(Number), expected.exportSize);
  return {html: composed, functions: composedFunctions, placed};
}

function runtimeFor(page, short, expected, input, structure, sourceInputsPin) {
  const drawing = sourceCanvas(input, expected, structure);
  const base = `${PAIR_OUTPUT}/candidates/${short}`;
  const audioStructure = json({schemaVersion:1, animationId:page.animationId,
    sourceSwfSha256:page.source.sha256, frameDomain:page.frameDomain,
    structure:structure.audio, audioPlaybackEnabled:false,
    sourceAlignmentAccepted:false, listeningAccepted:false});
  const audioPin = {path:`${base}/source-audio-structure.json`,bytes:Buffer.byteLength(audioStructure),sha256:hash(audioStructure)};
  const parent = [8248,5666], internalTwips=expected.internal.map(value=>Math.round(value*20));
  assert.deepEqual(internalTwips.map(value=>value/20),expected.internal,'exact exported twip translation');
  const offset = [(parent[0]-internalTwips[0])/20,(parent[1]-internalTwips[1])/20];
  assert(offset.every(Number.isFinite));
  const source = input.source.pin, helper = input.helper.pin, frames = input.framesHtml.pin;
  const spec = {
    schemaVersion:1, animationId:`course-${page.animationId}`, finalAnimationId:page.animationId,
    classification:'unregistered-source-only-vector-drawing-candidate',
    title:`ALG L12 ${short.toUpperCase()} source graphics`,
    source:{swf:source.path,swfBytes:source.bytes,swfSha256:source.sha256},
    evidence:{scenarioInventory:sourceInputsPin.path,scenarioInventorySha256:sourceInputsPin.sha256,
      audioAudit:audioPin.path,audioAuditSha256:audioPin.sha256},
    ffdecExport:{tool:'JPEXS Free Flash Decompiler 26.2.1',helper:helper.path,
      helperBytes:helper.bytes,helperSha256:helper.sha256,
      framesHtml:frames.path,framesHtmlBytes:frames.bytes,framesHtmlSha256:frames.sha256,
      rootFramesHtml:input.rootHtml.pin.path,rootFramesHtmlBytes:input.rootHtml.pin.bytes,
      rootFramesHtmlSha256:input.rootHtml.pin.sha256,targetSpriteObjectId:expected.sprite,
      targetSpriteFunction:`sprite${expected.sprite}`,
      exportCanvas:{width:expected.exportSize[0],height:expected.exportSize[1]},
      exportInternalTranslation:{x:expected.internal[0],y:expected.internal[1]},
      expectedPlacedFunctionCount:expected.placedFunctions,expectedPlacedFunctionsSha256:expected.placedSha256,
      expectedFontFunctionCount:expected.fontFunctions.length,
      expectedFontFunctionsSha256:hash(JSON.stringify(expected.fontFunctions)),
      embeddedImageVariableCount:0,embeddedImageVariablesSha256:hash('[]')},
    timeline:{fps:12,stage:{width:800,height:600,backgroundColor:'#b8d8f7'},
      root:{frameCount:10,preloaderStopFrame:1,beginFrame:6,beginLabel:'begin',
        placementName:'animation',placementDepth:'1',placementTwips:{x:8248,y:5666},
        placementPixels:{x:412.4,y:283.3}},
      local:{timelineId:page.frameDomain,frameCount:expected.frames,playbackMode:'state-explorer',
        publicFrameIndexing:'one-indexed',originalTerminalStopEstablished:false},
      stageRenderOffset:{x:offset[0],y:offset[1]}},
    runtimeContract:{kind:'structural-local-frame',scenarios:['source-static-frame'],
      defaultScenario:'source-static-frame',supportedLanguages:['en'],
      seedMapping:'uint32 inspection metadata; no source random execution',
      blockedLocalFrameRanges:[],currentCanonicalFrameDomainDispositionAsserted:false,
      unresolved:['Root preloader/child natural start, loop and Replay remain unverified.',
        'Source glossary actions are not executed by this graphics candidate.',
        'Native text suppression and bilingual editorial presentation are not implemented.',
        'Source mask colors and compositor are retained; Flash pixel/hit parity is unverified.',
        'Embedded audio is not played; phase, decode, listening and terminal policy are unaccepted.']},
    output:{script:`${base}/canvas-renderer.js`,manifest:`${base}/source-canvas-receipt.json`,
      globalRegistry:'HELP_MATH_CANVAS_ASSETS'},renderScale:2,requiredCanvas:{width:1600,height:1200},
    composition:{sourceRootMatrixTwips:[1,0,0,1,8248,5666],sourceInternalTranslationPixels:expected.internal,
      stageOffsetPixels:offset,rootCompanionShapeId:expected.companion,
      rootCompanionClassification:'unclassified-retained',sourceTextAndGraphicsSuppressionApplied:false,
      sourceColorsRetained:true,maskOpacityCorrectionApplied:false,naturalRootExecution:false},
  };
  const built = buildSafeRuntime({helperSource:normalize(input.helper.bytes.toString('utf8')),
    framesHtml:drawing.html,spec,scale:2});
  let runtime = built.runtime;
  const sourceDraw = `ctx.transform(1, 0, 0, 1, ${offset[0]}, ${offset[1]});\n        sprite${expected.sprite}(ctx, new cxform(0,0,0,0,255,255,255,255), state.exportFrame, 0, 0);`;
  runtime = replaceOnce(runtime, sourceDraw,
    `ctx.save();\n        ${sourceDraw}\n        ctx.restore();\n        place("shape${expected.companion}",canvas,ctx,[0.05,0,0,0.05,0,0],new cxform(0,0,0,0,255,255,255,255),1,0,0,0);`);
  runtime = runtime.split(JSON.stringify(spec.animationId)).join(JSON.stringify(page.animationId));
  runtime = replaceOnce(runtime, 'function resolveFrameState(request) {\n    request = request || {};',
    `function resolveFrameState(request) {\n    if (!request || typeof request !== "object" || Array.isArray(request)) throw Error("source frame request must be an object");\n    var allowedKeys = ["frame", "frameDomain", "rootFrame", "scenario", "lang", "seed"];\n    Object.keys(request).forEach(function (key) { if (allowedKeys.indexOf(key) < 0) throw Error("unsupported source frame field: " + key); });\n    if (request.frameDomain !== undefined && request.frameDomain !== "${page.frameDomain}") throw Error("source frame domain mismatch");\n    if (request.rootFrame !== undefined && request.rootFrame !== 6) throw Error("only root frame 6 is composed");\n    if (request.seed !== undefined && (!Number.isSafeInteger(request.seed) || request.seed < 0 || request.seed > 4294967295)) throw Error("seed must be uint32 inspection metadata");`);
  const metadata = {...built.metadata,animationId:page.animationId,sourceOnly:true,
    audioPlaybackEnabled:false,glossaryBehaviorEnabled:false,nativeTextSuppressionApplied:false,
    sourceMaskColorsRetained:true,sourceCompanionGraphicRetained:true,
    sourceParentMatrixTwips:[1,0,0,1,8248,5666],sourceInternalTranslationPixels:expected.internal,
    stageRenderOffsetPixels:offset,sourceCanvasMaskBlocks:expected.maskBlocks,
    originalRuntimeAccepted:false,fidelityAccepted:false,audioAccepted:false,humanAccepted:false,
    ownerAccepted:false,strictComplete:false,published:false};
  const original = {...built.metadata,animationId:page.animationId};
  runtime = replaceOnce(runtime, `var METADATA = deepFreeze(${JSON.stringify(original,null,2)});`,
    `var METADATA = deepFreeze(${JSON.stringify(metadata,null,2)});`);
  const generated = parse(runtime,{ecmaVersion:2020,sourceType:'script'});
  const declared = new Map();
  const visit = node => {if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration' && node.id && /^(?:font|text|shape|button|sprite)\d+$/.test(node.id.name))
      declared.set(node.id.name,runtime.slice(node.start,node.end));
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit); else if (value && typeof value === 'object') visit(value);
    }};
  visit(generated);
  for (const [name, body] of drawing.functions) {
    if (name === 'main') continue;
    const expectedBody = /^font\d+$/.test(name)
      ? replaceOnce(body,'defaultFill = textColor;','var defaultFill = textColor;') : body;
    assert.equal(declared.get(name),expectedBody,`source graphic changed: ${name}`);
  }
  assert.deepEqual([...new Set([...runtime.matchAll(/document\.([\w$]+)/g)].map(match=>match[1]))],['createElement']);
  for (const blocked of [/\beval\s*\(/,/\bFunction\s*\(/,/\b(?:fetch|XMLHttpRequest|WebSocket|AudioContext|Audio|setTimeout|setInterval|requestAnimationFrame|localStorage|sessionStorage)\b/,/\b(?:_root|_global|_level0|DoHyperLinks|InternalPreloader)\b/])
    assert(!blocked.test(runtime),`forbidden source graphics runtime: ${blocked}`);
  new Script(runtime);
  const sandbox = createContext({}); new Script(runtime).runInContext(sandbox,{timeout:3000});
  const asset = sandbox.HELP_MATH_CANVAS_ASSETS?.[page.animationId];
  assert(asset && asset.metadata.animationId === page.animationId &&
    asset.metadata.sourceSwfSha256 === page.source.sha256);
  assert.equal(asset.resolveFrameState({frame:1,frameDomain:page.frameDomain,rootFrame:6,
    scenario:'source-static-frame',lang:'en',seed:0}).localFrame,1);
  assert.equal(asset.resolveFrameState({frame:expected.frames,frameDomain:page.frameDomain,rootFrame:6,
    scenario:'source-static-frame',lang:'en',seed:0}).localFrame,expected.frames);
  assert.throws(()=>asset.resolveFrameState({frame:expected.frames+1,frameDomain:page.frameDomain,
    rootFrame:6,scenario:'source-static-frame',lang:'en',seed:0}));
  return {spec,metadata,runtime,audioStructure,structure};
}

function readOutputInput(relative, expected) {
  const result = physicalPairInput(path.join(ROOT,relative),expected);
  return result;
}

export function buildGlossaryPairCanvasCandidates() {
  const sourceInputs = buildGlossaryPairInputs();
  const saved = readOutputInput(`${PAIR_OUTPUT}/source-inputs.json`);
  assert.equal(saved.bytes.toString('utf8'),json(sourceInputs),'current pair source-input receipt');
  const generator = physicalPairInput(SCRIPT).pin;
  const sharedBuilder = physicalPairInput(path.join(ROOT,'scripts/build-safe-ffdec-canvas-adapter.mjs')).pin;
  const output = new Map(), pages=[];
  for (const [index, config] of PAIR_PAGES.entries()) {
    const page = sourceInputs.pages[index], expected = PAIR_CANVAS_EXPECTATIONS[config.short];
    assert(page && expected && page.animationId === config.id && page.frameDomain === `sprite-${expected.sprite}` &&
      page.frameCount === expected.frames && config.sprite === expected.sprite && config.frames === expected.frames);
    const base = `${PAIR_OUTPUT}/${config.short}`, sprite = `DefineSprite_${expected.sprite}`;
    const input = {
      source:physicalPairInput(path.join(ROOT,base,`${config.stem}.swf`),config),
      xml:readOutputInput(`${base}/movie.xml`,expected.xml),
      helper:readOutputInput(`${base}/canvas/sprites/${sprite}/canvas.js`,expected.helper),
      framesHtml:readOutputInput(`${base}/canvas/sprites/${sprite}/frames.html`,expected.framesHtml),
      rootHtml:readOutputInput(`${base}/canvas/frames/frames.html`,expected.rootHtml),
    };
    assert.equal(input.source.pin.sha256,page.source.sha256);
    const structure=sourceStructure(input.xml.bytes,config,expected);
    const candidate=runtimeFor(page,config.short,expected,input,structure,saved.pin);
    const outBase=`${PAIR_OUTPUT}/candidates/${config.short}`;
    const artifacts=new Map([
      [`${outBase}/canvas-renderer.js`,candidate.runtime],
      [`${outBase}/runtime-meta.json`,json(candidate.metadata)],
      [`${outBase}/adapter-spec.json`,json(candidate.spec)],
      [`${outBase}/source-audio-structure.json`,candidate.audioStructure],
      [`${outBase}/source-structure.json`,json(candidate.structure)],
    ]);
    const artifactPins=[...artifacts].map(([relative,bytes])=>({path:relative,bytes:Buffer.byteLength(bytes),sha256:hash(bytes)}));
    const receipt={schemaVersion:1,kind:'g678-alg-l12-glossary-pair-source-canvas-v1',
      animationId:page.animationId,source:page.source,sourceInputs:saved.pin,
      inputs:Object.values(input).map(item=>item.pin),generator,sharedBuilder,
      sourceRootFrame:6,frameDomain:page.frameDomain,frameCount:expected.frames,
      sourceCompanionShapeId:expected.companion,sourceMaskBlocks:expected.maskBlocks,
      outputs:artifactPins,registered:false,audioPlaybackEnabled:false,
      nativeTextSuppressionApplied:false,sourceActionScriptExecuted:false,
      originalRuntimeAccepted:false,fidelityAccepted:false,audioAccepted:false,
      humanAccepted:false,ownerAccepted:false,strictComplete:false,published:false};
    artifacts.set(`${outBase}/source-canvas-receipt.json`,json(receipt));
    for (const [relative,bytes] of artifacts) output.set(relative,bytes);
    pages.push({id:page.animationId,frameDomain:page.frameDomain,frames:expected.frames,
      runtimeSha256:hash(candidate.runtime),runtimeBytes:Buffer.byteLength(candidate.runtime),
      sourceMaskBlocks:expected.maskBlocks,sourceCompanionShapeId:expected.companion});
  }
  return {output,pages};
}

function writeOrCheck(mode,result) {
  if (mode === '--dry-run') return;
  if (mode === '--write') {
    for (const relative of result.output.keys()) assert(!fs.existsSync(path.join(ROOT,relative)),
      `immutable candidate already exists: ${relative}`);
    for (const [relative,bytes] of result.output) {
      const target=path.join(ROOT,relative);fs.mkdirSync(path.dirname(target),{recursive:true});
      fs.writeFileSync(target,bytes,{flag:'wx'});
    }
  }
  for (const [relative,bytes] of result.output) assert.deepEqual(physicalPairInput(path.join(ROOT,relative)).bytes,
    Buffer.from(bytes),`candidate output changed: ${relative}`);
}

export function main(argv=process.argv.slice(2)) {
  assert(argv.length===1 && ['--dry-run','--write','--check'].includes(argv[0]),
    'use --dry-run, --write, or --check');
  const result=buildGlossaryPairCanvasCandidates();writeOrCheck(argv[0],result);
  const status=argv[0]==='--write'?'SOURCE_CANVAS_PAIR_WRITTEN_UNREGISTERED':
    argv[0]==='--check'?'SOURCE_CANVAS_PAIR_VERIFIED_UNREGISTERED':'SOURCE_CANVAS_PAIR_INPUTS_VERIFIED_NOT_WRITTEN';
  const report={status,pages:result.pages,registered:false,acceptanceEffect:'none'};
  process.stdout.write(json(report));return report;
}
if (process.argv[1] && path.resolve(process.argv[1])===SCRIPT) {
  try {main();} catch(error) {process.stderr.write(`${error.stack??error}\n`);process.exitCode=1;}
}
