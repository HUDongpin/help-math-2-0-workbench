import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {Script} from 'node:vm';
import {parse} from 'acorn';
import {buildSafeRuntime} from './build-safe-ffdec-canvas-adapter.mjs';
import {
  P010_ID, P010_WORK, P010_CANVAS_EXPORT, P010_SOURCE_ROOT,
  P010_SOURCE, P010_CANVAS_INPUT_PINS, physicalP010File,
  p010CanvasDeclarations, inspectP010Canvas, inspectP010Xml, checkP010CanvasExport,
} from './export-g678-alg-l12-p010-canvas.mjs';

const SCRIPT=fileURLToPath(import.meta.url),ROOT=path.resolve(path.dirname(SCRIPT),'..');
export {P010_ID};
export const P010_CANDIDATE=`${P010_WORK}/candidate-v1`;
export const P010_REVIEW_OUTPUT='output/p010-source-canvas-20260927-v1';
export const P010_SOURCE_CANVAS_PINS=Object.freeze({
  xml:P010_CANVAS_INPUT_PINS.xml,
  sourceAuditReceipt:P010_CANVAS_INPUT_PINS.sourceAuditReceipt,
  sourceToolchain:P010_CANVAS_INPUT_PINS.sourceToolchain,
  canvasReceipt:{path:P010_CANVAS_EXPORT+'/extraction-receipt.json',bytes:42628,sha256:'e75250b0f7243cc239a08eba89097c2dfe97d0bc89d8b2fa53e2d2f8b85cd64c'},
  helper:{path:P010_CANVAS_EXPORT+'/sprites/DefineSprite_96/canvas.js',bytes:52872,sha256:'78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93'},
  main:{path:P010_CANVAS_EXPORT+'/sprites/DefineSprite_96/frames.html',bytes:5021503,sha256:'16927e17b0b72925efc292a74226e01266ee3c5398b0a56c25f7a95e8e93cdb8'},
  root:{path:P010_CANVAS_EXPORT+'/frames/frames.html',bytes:5033500,sha256:'2ad911f5b80fde5ea83e683cb8c20f9ba7c428d069527553077d9dcc940e0ffc'},
  catalog:{path:P010_WORK+'/audit/source-text-catalog.json',bytes:1322051,sha256:'0926104d8e08a517807e389ccdd4a13cef5081c9229afed4900f424f8fe561d1'},
  behavior:{path:P010_WORK+'/audit/source-behavior.json',bytes:293983,sha256:'c584ad267cbca359c3196e7e5ca5cb54426124b864f45261ca4286c804d2cbd3'},
  audioAudit:{path:P010_WORK+'/audit/source-stream-blocks.json',bytes:274267,sha256:'656ccb77ccea9737b88c946d4101a759c2441f93522cfd34c3d872fff8080d2e'},
  sharedBuilder:{path:'scripts/build-safe-ffdec-canvas-adapter.mjs',bytes:115553,sha256:'1d1dd117dd59a6b7191f2fa8488249ece09bfb1da8837be146677f88a01315dd'},
});
export const P010_SOURCE_CANVAS_GATES=Object.freeze({
  registered:false,browserValidated:false,interactiveStateResolved:false,
  originalRuntimeVerified:false,flashFidelityAccepted:false,nativeTypographyComplete:false,
  audioEnabled:false,audioDecoded:false,audioSynchronizationAccepted:false,audioListeningAccepted:false,
  humanAccepted:false,ownerAccepted:false,strictComplete:false,releaseAccepted:false,published:false,
});
const hash=b=>createHash('sha256').update(b).digest('hex'),json=v=>JSON.stringify(v,null,2)+'\n';
const normalize=b=>b.toString().replace(/\r\n?/g,'\n');
const relative=p=>p.startsWith(ROOT+path.sep)?path.relative(ROOT,p).split(path.sep).join('/'):p;
export function replaceP010Once(text,marker,replacement){assert.equal(text.split(marker).length,2,'nonunique or missing source marker');return text.replace(marker,replacement);}
export function p010CanvasFunctions(html){const code=p010CanvasDeclarations(html),nodes=parse(code,{ecmaVersion:2020}).body.filter(n=>n.type==='FunctionDeclaration'),functions=new Map(nodes.map(n=>[n.id.name,code.slice(n.start,n.end)]));assert.equal(functions.size,nodes.length,'duplicate source function');return functions;}
export function composeP010Canvas(mainHtml,rootHtml){
  const main=p010CanvasFunctions(mainHtml),root=p010CanvasFunctions(rootHtml);
  assert.deepEqual([...root.keys()].filter(n=>!main.has(n)),['shape97','main'],'root-only source definitions changed');
  assert.deepEqual([...root.keys()].filter(n=>main.has(n)&&main.get(n)!==root.get(n)),['sprite96'],'unexpected common drawing drift');
  const header='function sprite96(ctx,ctrans,frame,ratio,time){\n\tctx.save();\n\tctx.transform(1,0,0,1,371.9,204.85);\n\tvar clips = [];\n\tvar frame_cnt = 465;';assert(main.get('sprite96').startsWith(header));
  const rootMain=root.get('main'),case6=rootMain.slice(rootMain.indexOf('\n\t\tcase 5:'),rootMain.indexOf('\n\t\tcase 6:'));
  assert.equal(case6,'\n\t\tcase 5:\n\t\t\tplace("sprite96",canvas,ctx,[0.05,0.0,0.0,0.05,412.4,283.3],ctrans,1,(0+time)%465,5,time);\n\t\t\tplace("shape97",canvas,ctx,[0.05,0.0,0.0,0.05,0.0,0.0],ctrans,1,0,0,time);\n\t\t\tbreak;');
  assert.equal([...main.keys()].filter(n=>/^text\d+$/.test(n)).length,28);
  const composed=replaceP010Once(mainHtml,'\nvar frame = -1;','\n'+root.get('shape97')+'\n'+rootMain+'\nvar frame = -1;');
  const result=p010CanvasFunctions(composed);for(const [name,body]of main)assert.equal(result.get(name),body,`source declaration changed: ${name}`);
  assert.equal(result.get('shape97'),root.get('shape97'));return composed;
}

const MASK_XML_AUDIT=`import json,sys,xml.etree.ElementTree as E
r=E.fromstring(sys.stdin.buffer.read()); ids={'18','30'}; definitions=[]; uses=[]
for e in r.iter('item'):
 if e.get('shapeId') in ids:
  assert e.get('type')=='DefineShape3Tag'
  fills=e.findall('./shapes/fillStyles/fillStyles/item'); lines=e.findall('./shapes/lineStyles/lineStyles/item')
  assert len(fills)==1 and fills[0].get('fillStyleType')=='0' and not lines
  c=fills[0].find('color'); definitions.append({'characterId':int(e.get('shapeId')),'rgba':[int(c.get(k)) for k in ('red','green','blue','alpha')],'lineStyleCount':len(lines),'fillStyleCount':len(fills)})
 if e.get('characterId') in ids and e.get('type','').startswith('PlaceObject'):
  assert e.get('type')=='PlaceObject2Tag' and e.get('placeFlagHasClipDepth')=='true'
  assert e.get('placeFlagHasColorTransform')=='false' and e.get('placeFlagHasClipActions')=='false'
  uses.append({k:int(e.get(k)) for k in ('characterId','depth','clipDepth')})
for container in [r.find('tags')]+list(r.iter('subTags')):
 active={}
 for e in container:
  kind=e.get('type'); d=e.get('depth')
  if kind=='PlaceObject2Tag':
   if active.get(d) in ids: assert e.get('placeFlagHasColorTransform')=='false' and e.get('placeFlagHasClipActions')=='false'
   if e.get('placeFlagHasCharacter')=='true':active[d]=e.get('characterId')
  elif kind=='RemoveObject2Tag':active.pop(d,None)
for button in r.iter('item'):
 if button.get('type')=='DefineButton2Tag': assert all(c.get('characterId') not in ids for c in button.find('characters'))
print(json.dumps({'definitions':definitions,'uses':uses},separators=(',',':')))
`;
export function auditP010SourceMasks(xmlBytes,catalog){
  const r=spawnSync('python3',['-c',MASK_XML_AUDIT],{input:xmlBytes,encoding:'utf8',timeout:30000,maxBuffer:1024*1024});assert(!r.error&&r.status===0,`source mask XML audit failed: ${r.error?.message??r.stderr}`);
  const audit=JSON.parse(r.stdout);assert.deepEqual(audit.definitions,[{characterId:18,rgba:[102,153,0,164],lineStyleCount:0,fillStyleCount:1},{characterId:30,rgba:[153,204,0,184],lineStyleCount:0,fillStyleCount:1}]);
  assert.deepEqual(audit.uses,[{characterId:18,depth:1,clipDepth:10},{characterId:18,depth:11,clipDepth:20},{characterId:30,depth:21,clipDepth:28},{characterId:30,depth:29,clipDepth:36}]);
  assert.equal(catalog.sourceSha256,P010_CANVAS_INPUT_PINS.source.sha256);assert.equal(catalog.summary.bitmapDefinitions,0);assert.equal(catalog.timelines.length,2);
  const main=catalog.timelines.find(t=>t.timelineId==='sprite-96'),instances=main.instances.filter(i=>[18,30].includes(i.characterId));assert.equal(instances.length,4);
  for(const i of instances){const events=main.events.filter(e=>e.instanceId===i.instanceId);assert(events.length>0&&events[0].clipDepth!==undefined);assert(events.every(e=>!e.colorTransform&&!e.clipActions));}
  assert(catalog.buttonDefinitions.every(b=>b.statePlacements.every(p=>![18,30].includes(p.characterId))));
  return {...audit,exclusiveClipDepthUsage:true,instanceIds:instances.map(i=>i.instanceId),sourcePathsAndColorsRetained:true,opacityCorrectionApplied:false,geometryRetained:true,mechanism:'Original FFDec clipCanvas plus destination-in raster mask compositing',claimBoundary:'Source drawing candidate retains raw mask alpha; actual Flash mask opacity, reveal and activation parity remain pending source/native review',acceptanceEffect:'none'};
}
function visit(node,fn){if(!node||typeof node!=='object')return;fn(node);for(const value of Object.values(node)){if(Array.isArray(value))value.forEach(v=>visit(v,fn));else if(value&&typeof value==='object')visit(value,fn);}}
export function validateP010StrictDirectives(runtime){
  const tree=parse(runtime,{ecmaVersion:2020,sourceType:'script'});new Script(runtime);
  const calls=tree.body.filter(n=>n.type==='ExpressionStatement'&&n.expression.type==='CallExpression'&&n.expression.callee.type==='FunctionExpression');assert.equal(calls.length,1,'one explicit runtime IIFE required');
  const wrapper=calls[0].expression.callee;assert.deepEqual(wrapper.params.map(p=>p.type),['Identifier']);assert.equal(wrapper.params[0].name,'global');
  assert.equal(wrapper.body.body[0]?.directive,'use strict','current runtime strict directive required');
  let directives=0;visit(tree,n=>{if(['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'].includes(n.type)&&n.body?.type==='BlockStatement'&&n.body.body.some(s=>s.directive==='use strict')){directives++;assert(n.params.every(p=>p.type==='Identifier'),'a use strict directive requires simple identifier parameters');}});
  return {currentStrict:true,strictIifeCount:1,strictDirectiveFunctionCount:directives,iifeParameter:'global',simpleParameterBoundary:true,nonSimpleParameterStrictDirectiveCount:0,syntaxChecks:['Acorn ecmaVersion2020 script','vm.Script'],claimBoundary:'JavaScript strict-directive validity only; not strict migration completion'};
}
export function validateP010SourceRuntime(runtime){
  assert.deepEqual([...new Set([...runtime.matchAll(/document\.([\w$]+)/g)].map(m=>m[1]))],['createElement']);assert.deepEqual([...runtime.matchAll(/document\.createElement\("([a-z]+)"\)/g)].map(m=>m[1]),['canvas']);
  for(const pattern of [/\beval\s*\(/,/\bFunction\s*\(/,/\b(?:setInterval|setTimeout|requestAnimationFrame|requestIdleCallback)\s*\(/,/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB)\b/,/\b(?:Audio|AudioContext|webkitAudioContext|HTMLAudioElement|Worker|SharedWorker)\b/,/\b(?:location|postMessage|open)\s*(?:\.|\()/,/\bimport\s*\(/,/document\.body/,/\b(?:addEventListener|removeEventListener)\s*\(/,/\b(?:_root|_global|_level0|DoHyperLinks|InternalPreloader)\b/,/\bimageObj\d+\b/])assert(!pattern.test(runtime),String(pattern));
  const tree=parse(runtime,{ecmaVersion:2020});visit(tree,n=>{if(n.type==='Literal'&&typeof n.value==='string')assert(!/^https?:\/\//.test(n.value),'runtime contains remote URL literal');});
  return validateP010StrictDirectives(runtime);
}
function checkInputs(input){for(const [name,value]of Object.entries(input)){assert(P010_SOURCE_CANVAS_PINS[name],`unknown candidate input: ${name}`);const p=P010_SOURCE_CANVAS_PINS[name],b=Buffer.isBuffer(value)?value:Buffer.from(typeof value==='string'?value:json(value));assert.equal(b.length,p.bytes,`${name} input size drift`);assert.equal(hash(b),p.sha256,`${name} input hash drift`);}}
export function buildP010SourceCanvas(input){
  checkInputs(input);for(const name of ['helper','main','root','xml','catalog','behavior','sourceAuditReceipt','canvasReceipt'])assert(Object.hasOwn(input,name),`missing source input: ${name}`);
  const catalog=JSON.parse(input.catalog),behavior=JSON.parse(input.behavior),maskAudit=auditP010SourceMasks(input.xml,catalog),xml=inspectP010Xml(input.xml);
  assert.equal(behavior.sourceSha256,P010_CANVAS_INPUT_PINS.source.sha256);assert.deepEqual(behavior.rootPlacement.contentPlacement.matrix,[1,0,0,1,8248,5666]);assert.equal(behavior.rootPlacement.placementFrame,6);assert.equal(behavior.rootPlacement.separateRootGraphic.characterId,97);assert.equal(behavior.main.hasTerminalStopAction,false);
  const mainHtml=normalize(input.main),rootHtml=normalize(input.root),html=composeP010Canvas(mainHtml,rootHtml),defs=p010CanvasDeclarations(html),functions=p010CanvasFunctions(html);
  const placed=[...new Set([...defs.matchAll(/place\("([\w$]+)"/g)].map(m=>m[1]))].sort(),fonts=[...functions.keys()].filter(n=>/^font\d+$/.test(n));assert.deepEqual(fonts,['font3']);
  const closure=inspectP010Canvas(rootHtml,xml);assert.deepEqual(placed,closure.placedCharacterFunctions);
  const parentTwips={x:8248,y:5666},internalTwips={x:7438,y:4097},offsetTwips={x:parentTwips.x-internalTwips.x,y:parentTwips.y-internalTwips.y},offset={x:offsetTwips.x/20,y:offsetTwips.y/20};assert.deepEqual(offset,{x:40.5,y:78.45});
  const spec={schemaVersion:1,animationId:`course-${P010_ID}`,finalAnimationId:P010_ID,classification:'unregistered-source-only-vector-drawing-candidate',title:'Plotting Points',source:{swf:P010_SOURCE,swfBytes:183770,swfSha256:P010_CANVAS_INPUT_PINS.source.sha256},evidence:{scenarioInventory:P010_SOURCE_CANVAS_PINS.behavior.path,scenarioInventorySha256:P010_SOURCE_CANVAS_PINS.behavior.sha256,audioAudit:P010_SOURCE_CANVAS_PINS.audioAudit.path,audioAuditSha256:P010_SOURCE_CANVAS_PINS.audioAudit.sha256},ffdecExport:{tool:'JPEXS Free Flash Decompiler 26.2.1',helper:P010_SOURCE_CANVAS_PINS.helper.path,helperBytes:input.helper.length,helperSha256:P010_SOURCE_CANVAS_PINS.helper.sha256,framesHtml:P010_SOURCE_CANVAS_PINS.main.path,framesHtmlBytes:input.main.length,framesHtmlSha256:P010_SOURCE_CANVAS_PINS.main.sha256,rootFramesHtml:P010_SOURCE_CANVAS_PINS.root.path,rootFramesHtmlBytes:input.root.length,rootFramesHtmlSha256:P010_SOURCE_CANVAS_PINS.root.sha256,targetSpriteObjectId:96,targetSpriteFunction:'sprite96',exportCanvas:{width:695,height:406},exportInternalTranslation:{x:371.9,y:204.85},expectedPlacedFunctionCount:placed.length,expectedPlacedFunctionsSha256:hash(JSON.stringify(placed)),expectedFontFunctionCount:1,expectedFontFunctionsSha256:hash(JSON.stringify(fonts)),embeddedImageVariableCount:0,embeddedImageVariablesSha256:hash('[]')},timeline:{fps:12,stage:{width:800,height:600,backgroundColor:'#b8d8f7'},root:{frameCount:10,preloaderStopFrame:1,beginFrame:6,beginLabel:'begin',placementName:'animation',placementDepth:'1',placementTwips:parentTwips,placementPixels:{x:412.4,y:283.3}},local:{timelineId:'sprite-96',frameCount:465,playbackMode:'state-explorer',publicFrameIndexing:'one-indexed',originalTerminalStopEstablished:false},stageRenderOffset:offset},runtimeContract:{kind:'structural-local-frame',scenarios:['source-static-frame'],defaultScenario:'source-static-frame',supportedLanguages:['en'],seedMapping:'uint32 request retained as inspection metadata; no source randomness executed',blockedLocalFrameRanges:[],currentCanonicalFrameDomainDispositionAsserted:false,unresolved:['Root frame6 Stop does not prove sprite96 terminal stop. Original host stop/loop, child time phase and Replay remain unverified.','Nine glossary release bodies and ten hit instances are not executed; masked activation, typed pause, repeated Position, keyboard and close/resume require later maintained behavior.','All 28 text and 58 shape functions are retained. Native typography, semantic reading order, outlined-text classification and suppression require source vector review.','Raw mask18/30 alpha and the actual clipCanvas/destination-in compositor are retained; Flash opacity/reveal/hit parity is not accepted.','Embedded audio and the distinct SA candidate remain disabled; no decoding, schedule, language, synchronization or listening acceptance is implied.','Only source English drawing is admitted here; no Spanish translation or bilingual typography acceptance.','Source text32/36 grammar is unchanged; an editorial change requires an explicit modern-edit policy.']},output:{script:P010_CANDIDATE+'/canvas-renderer.js',manifest:P010_CANDIDATE+'/adapter-manifest.json',globalRegistry:'HELP_MATH_CANVAS_ASSETS'},renderScale:2,requiredCanvas:{width:1600,height:1200},composition:{parentMatrixTwips:[1,0,0,1,8248,5666],sourceTwipsPerPixel:20,internalTranslationTwips:internalTwips,stageRenderOffsetTwips:offsetTwips,main:'All sprite96 source functions retain normalized pixel matrices and internal translation',root:'Source shape97 and original main declaration retained; render draws shape97 after the inspected child at its identity/20 placement',rootGraphicClassification:'unclassified; no title/border guess or suppression',naturalRootExecution:false,sourceTextAndGraphicsSuppressionApplied:false,sourceColorsRetained:true,maskOpacityCorrectionApplied:false}};
  const safe=buildSafeRuntime({helperSource:normalize(input.helper),framesHtml:html,spec,scale:2});let runtime=safe.runtime;
  const drawing=`ctx.transform(1, 0, 0, 1, 40.5, 78.45);\n        sprite96(ctx, new cxform(0,0,0,0,255,255,255,255), state.exportFrame, 0, 0);`;
  runtime=replaceP010Once(runtime,drawing,`ctx.save();\n        ${drawing}\n        ctx.restore();\n        place("shape97",canvas,ctx,[0.05,0,0,0.05,0,0],new cxform(0,0,0,0,255,255,255,255),1,0,0,0);`);
  runtime=runtime.split(JSON.stringify(spec.animationId)).join(JSON.stringify(P010_ID));
  runtime=replaceP010Once(runtime,'function resolveFrameState(request) {\n    request = request || {};',`function resolveFrameState(request) {
    if (!request || typeof request !== "object" || Array.isArray(request)) throw new Error("frame request must be an object");
    var allowedKeys = ["frame", "frameDomain", "rootFrame", "scenario", "lang", "seed"];
    Object.keys(request).forEach(function (key) { if (allowedKeys.indexOf(key) < 0) throw new Error("unsupported source frame request field: " + key); });
    if (request.frameDomain !== undefined && request.frameDomain !== "sprite-96") throw new Error("only sprite-96 frame inspection is supported");
    if (request.rootFrame !== undefined && request.rootFrame !== 6) throw new Error("only root frame6 composition is supported");
    if (request.seed !== undefined && (!Number.isSafeInteger(request.seed) || request.seed < 0 || request.seed > 4294967295)) throw new Error("seed must be a uint32 inspection value");`);
  const strictAudit=validateP010SourceRuntime(runtime),drawingFunctions=p010CanvasFunctions(mainHtml),sourceTextFunctions=[...drawingFunctions.keys()].filter(n=>/^text\d+$/.test(n)),sourceShapeFunctions=[...functions.keys()].filter(n=>/^shape\d+$/.test(n));
  // Every source drawing body is unchanged except the single font-local var
  // declaration needed under strict mode. This never edits raw tool artifacts.
  const generated=parse(runtime,{ecmaVersion:2020}),actualFunctions=new Map();visit(generated,n=>{if(n.type==='FunctionDeclaration'&&n.id&&/^(?:font|text|shape|button|sprite)\d+$/.test(n.id.name))actualFunctions.set(n.id.name,runtime.slice(n.start,n.end));});
  for(const [name,body]of functions){if(name==='main')continue;const expected=name==='font3'?replaceP010Once(body,'defaultFill = textColor;','var defaultFill = textColor;'):body;assert.equal(actualFunctions.get(name),expected,`unreviewed source graphics edit: ${name}`);}
  const metadata={...JSON.parse(JSON.stringify(safe.metadata)),animationId:P010_ID,sourceOnly:true,acceptanceEffects:P010_SOURCE_CANVAS_GATES,rootInspectionFrame:6,sourceParentMatrixTwips:spec.composition.parentMatrixTwips,sourceTwipsPerPixel:20,sourceInternalTranslationPixels:spec.ffdecExport.exportInternalTranslation,stageRenderOffsetPixels:offset,composition:spec.composition,maskAudit,strictDirectiveAudit:strictAudit,sourceTextFunctionsRetained:sourceTextFunctions,sourceShapeFunctionsRetained:sourceShapeFunctions,sourceTextRunCount:52,sourceTextMainInstanceCount:53,sourceButtonDefinitionCount:9,sourceButtonMainInstanceCount:10,sourceOnlyGraphic97Retained:true,sourceCanvasMaskBlockCount:1499,textSuppressionApplied:false,sourceColorsRetained:true,originalTerminalPolicyEstablished:false,nominalFrameSpanIsAudioDuration:false,noAudioNetworkTimersOrAutoplay:true,strictAcceptanceEffect:'none'};
  // The runtime carries the same detailed metadata that is persisted separately.
  const originalMeta=JSON.parse(JSON.stringify(safe.metadata));originalMeta.animationId=P010_ID;
  runtime=replaceP010Once(runtime,'var METADATA = deepFreeze('+JSON.stringify(originalMeta,null,2)+');','var METADATA = deepFreeze('+JSON.stringify(metadata,null,2)+');');
  validateP010SourceRuntime(runtime);
  return {runtime,spec,metadata,maskAudit,strictAudit,placedFunctions:placed,sourceTextFunctions,sourceShapeFunctions,compositionSha256:hash(html)};
}

async function pin(file){const b=await physicalP010File(file);return {path:relative(file),bytes:b.length,sha256:hash(b)};}
function upstream(script,args){const r=spawnSync(process.execPath,[script,...args],{cwd:ROOT,encoding:'utf8',timeout:30000,maxBuffer:2*1024*1024});assert(!r.error&&r.status===0,`upstream check failed: ${script}: ${r.error?.message??r.stderr}`);return {script,args,exitCode:r.status,stdoutSha256:hash(r.stdout),stderrSha256:hash(r.stderr)};}
const REVIEW_HTML=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; img-src data:; connect-src 'none'; media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
<meta name="robots" content="noindex,nofollow"><title>P010 source vector review</title><link rel="stylesheet" href="review.css"></head>
<body><main><h1>Plotting Points — source vector review</h1><p>English source drawing, inspected one frame at a time. Root frame 6 is fixed. This candidate retains source glyphs, graphics and masks; typography and runtime acceptance remain pending.</p>
<form id="inspection"><label for="frame">Source frame</label><input id="frame" name="frame" type="number" min="1" max="465" value="1" step="1"><button type="submit">Draw frame</button><button id="previous" type="button">Previous</button><button id="next" type="button">Next</button></form>
<p id="status" role="status">Loading local source drawing…</p><canvas id="source-canvas" width="1600" height="1200" aria-label="P010 source vector drawing"></canvas>
<p>Source-only inspection. No playback loop, audio, glossary activation, Current-JS registration or downstream acceptance.</p><p><a href="runtime-meta.json">Runtime metadata</a> · <a href="source-canvas-receipt.json">Artifact receipt</a></p></main>
<script src="canvas-renderer.js"></script><script src="review.js"></script></body></html>
`;
const REVIEW_CSS=`:root{color-scheme:light;font-family:system-ui,sans-serif;color:#152d43;background:#f1f5f8}body{margin:0}main{max-width:860px;margin:24px auto;padding:0 20px}h1{font-size:24px;line-height:1.25}p{line-height:1.55}form{display:flex;gap:10px;align-items:center;flex-wrap:wrap}input,button{font:inherit;padding:8px 12px;min-height:40px}input{width:90px}button{cursor:pointer}canvas{display:block;width:800px;height:600px;max-width:100%;height:auto;border:1px solid #668399;background:#b8d8f7}a{color:#164f81}:focus-visible{outline:3px solid #ce6800;outline-offset:3px}\n`;
const REVIEW_JS=`"use strict";
(async function () {
  var asset=globalThis.HELP_MATH_CANVAS_ASSETS[${JSON.stringify(P010_ID)}];
  var canvas=document.getElementById("source-canvas"),input=document.getElementById("frame"),status=document.getElementById("status"),form=document.getElementById("inspection");
  var current=1;
  function draw(frame) {
    if (!Number.isSafeInteger(frame)||frame<1||frame>465) { status.textContent="Choose a whole source frame from 1 to 465."; return; }
    var state=asset.render(canvas,{frame:frame,frameDomain:"sprite-96",rootFrame:6,lang:"en",scenario:"source-static-frame",seed:0});
    current=frame;input.value=String(frame);status.textContent="Source frame "+frame+" / 465 · fixed root frame 6 · no audio or autoplay";
    globalThis.P010_SOURCE_REVIEW=Object.freeze({frame:frame,state:state,metadata:asset.metadata});
  }
  try { await asset.ready();draw(1); }
  catch(error) { status.textContent="Source drawing failed: "+String(error.message||error);throw error; }
  form.addEventListener("submit",function(event){event.preventDefault();draw(Number(input.value));});
  document.getElementById("previous").addEventListener("click",function(){draw(Math.max(1,current-1));});
  document.getElementById("next").addEventListener("click",function(){draw(Math.min(465,current+1));});
})();
`;
function readme(metadata){return `# P010 reproducible source-only Canvas candidate\n\nThis local review package draws the exact source sprite96 frame selected by the caller, composed at root frame6 with the separate source shape97. It uses an 800×600 view and 1600×1200 backing store. It executes no original AVM1, audio, timers, autoplay, network or glossary behavior. The Canvas asset registry is an inspection API, not private Current-JS registration.\n\nAll 28 source text functions and 58 shape functions are retained, including source grammar and separate negative-sign/point-label placements. The four masks use the actual public-tool clipCanvas/destination-in compositor, with original source mask alpha unchanged. Flash mask opacity/activation and original terminal/loop/Replay remain unaccepted. Root shape97 remains unclassified. No native text suppression or modern typography is delivered here.\n\nUse the generated index.html through a local static HTTP server to inspect frames manually. The package has a restrictive no-network CSP and noindex; it is neither a product route nor a deployment candidate.\n\nAPI:\n\n\`\`\`js\nconst asset = globalThis.HELP_MATH_CANVAS_ASSETS["${P010_ID}"];\nawait asset.ready();\nasset.render(canvas1600x1200, {frame: 465, frameDomain: "sprite-96", rootFrame: 6, lang: "en", scenario: "source-static-frame", seed: 0});\n\`\`\`\n\nEvery frame1..465 is a static inspection state. Input outside the declared domains, a fractional/invalid frame, unproven Spanish or a behavior scenario is rejected. Request seed is uint32 inspection metadata; source randomness is not executed. Strict JavaScript directives use simple-parameter function boundaries and are parsed by Acorn and vm.Script. This programming-language strictness never closes strict migration completion.\n\nReproduction:\n\n\`\`\`sh\nHELP_MATH_G678_SOURCE_ROOT='${P010_SOURCE_ROOT}' node scripts/export-g678-alg-l12-p010-canvas.mjs --check\nHELP_MATH_G678_SOURCE_ROOT='${P010_SOURCE_ROOT}' node scripts/build-g678-alg-l12-p010-source-canvas.mjs --check\nnode --test scripts/export-g678-alg-l12-p010-canvas.test.mjs scripts/build-g678-alg-l12-p010-source-canvas.test.mjs\n\`\`\`\n\nAll gates in runtime-meta.json remain false. Main must independently inspect the code/checks and then review actual source vectors in the browser before source graphic disposition or native suppression.\n`;
}
export async function prepareP010SourceCanvas(){
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT,P010_SOURCE_ROOT,'exact physical AWS source-root opt-in required');
  await physicalP010File(P010_SOURCE,P010_CANVAS_INPUT_PINS.source);await physicalP010File(P010_CANVAS_INPUT_PINS.index.path,P010_CANVAS_INPUT_PINS.index);
  const checks=[upstream(P010_WORK+'/audit/extract-source.mjs',['--check']),upstream(P010_WORK+'/audit/build-source-audit.mjs',['--check'])];
  const exportReceipt=await checkP010CanvasExport();assert.equal(exportReceipt.canvasDependencyClosure.generatedMaskBlockCount,1499);
  checks.push({script:'scripts/export-g678-alg-l12-p010-canvas.mjs',args:['--check'],exitCode:0,outputChecksumSetSha256:exportReceipt.outputChecksumSetSha256});
  const input={};for(const name of['helper','main','root','xml','catalog','behavior','sourceAuditReceipt','canvasReceipt']){const p=P010_SOURCE_CANVAS_PINS[name];input[name]=await physicalP010File(path.join(ROOT,p.path),p);}
  await physicalP010File(path.join(ROOT,P010_SOURCE_CANVAS_PINS.sharedBuilder.path),P010_SOURCE_CANVAS_PINS.sharedBuilder);
  const candidate=buildP010SourceCanvas(input),dependencies=await Promise.all([SCRIPT,path.join(ROOT,'scripts/build-g678-alg-l12-p010-source-canvas.test.mjs'),path.join(ROOT,'scripts/export-g678-alg-l12-p010-canvas.mjs'),path.join(ROOT,'scripts/export-g678-alg-l12-p010-canvas.test.mjs'),path.join(ROOT,P010_SOURCE_CANVAS_PINS.sharedBuilder.path)].map(pin));
  const manifest={schemaVersion:1,animationId:P010_ID,status:'unregistered-source-only-canvas-candidate',scope:'local source-vector engineering inspection',source:P010_CANVAS_INPUT_PINS.source,sourceIndex:P010_CANVAS_INPUT_PINS.index,inputs:P010_SOURCE_CANVAS_PINS,generatorDependencies:dependencies,upstreamChecks:checks,output:{path:P010_CANDIDATE+'/canvas-renderer.js',bytes:Buffer.byteLength(candidate.runtime),sha256:hash(candidate.runtime),globalAssetRegistry:'HELP_MATH_CANVAS_ASSETS',assetId:P010_ID},runtimeBytes:Buffer.byteLength(candidate.runtime),runtimeSha256:hash(candidate.runtime),compositionSha256:candidate.compositionSha256,renderScale:2,view:{width:800,height:600},requiredCanvas:{width:1600,height:1200},rootInspectionFrame:6,mainTimelineId:'sprite-96',mainFrameCount:465,sourceTextDefinitions:28,sourceTextRuns:52,sourceTextMainInstances:53,sourceShapeDefinitions:58,sourceButtonDefinitions:9,sourceButtonMainInstances:10,sourceMaskInstances:4,sourceMaskCompositeBlockCount:1499,sourceGraphic97Classification:'unclassified-retained',maskAudit:candidate.maskAudit,strictDirectiveAudit:candidate.strictAudit,sourceTextFunctionsRetained:candidate.sourceTextFunctions,sourceShapeFunctionsRetained:candidate.sourceShapeFunctions,originalSourceColorsRetained:true,textSuppressionApplied:false,maskOpacityCorrectionApplied:false,noLegacyActionScriptExecuted:true,noAudioNetworkTimersOrAutoplay:true,originalTerminalPolicyEstablished:false,rawExportsUnchanged:true,acceptanceEffects:P010_SOURCE_CANVAS_GATES,strictAcceptanceEffect:'none'};
  const outputs=new Map([[P010_CANDIDATE+'/canvas-renderer.js',candidate.runtime],[P010_CANDIDATE+'/adapter-spec.json',json(candidate.spec)],[P010_CANDIDATE+'/adapter-manifest.json',json(manifest)],[P010_CANDIDATE+'/runtime-meta.json',json(candidate.metadata)],[P010_REVIEW_OUTPUT+'/canvas-renderer.js',candidate.runtime],[P010_REVIEW_OUTPUT+'/runtime-meta.json',json(candidate.metadata)],[P010_REVIEW_OUTPUT+'/index.html',REVIEW_HTML],[P010_REVIEW_OUTPUT+'/review.css',REVIEW_CSS],[P010_REVIEW_OUTPUT+'/review.js',REVIEW_JS],[P010_REVIEW_OUTPUT+'/README.md',readme(candidate.metadata)]]);
  const receipt={schemaVersion:1,kind:'p010-source-canvas-candidate-artifact-receipt-v1',animationId:P010_ID,source:P010_CANVAS_INPUT_PINS.source,inputs:P010_SOURCE_CANVAS_PINS,generatorDependencies:dependencies,upstreamChecks:checks,outputs:[...outputs].map(([p,b])=>({path:p,bytes:Buffer.byteLength(b),sha256:hash(b)})),rawCanvasOutputChecksumSetSha256:exportReceipt.outputChecksumSetSha256,acceptanceEffects:P010_SOURCE_CANVAS_GATES,claimBoundary:'Runnable source-only deterministic Canvas candidate; no browser vector review, native typography, host behavior, audio or downstream acceptance'};
  outputs.set(P010_REVIEW_OUTPUT+'/source-canvas-receipt.json',json(receipt));return {...candidate,manifest,receipt,outputs};
}
async function absent(file){try{await lstat(file);return false;}catch(e){if(e.code==='ENOENT')return true;throw e;}}
async function main(){
  const mode=process.argv[2]??'--dry-run';assert(process.argv.length<=3&&['--dry-run','--write','--check'].includes(mode),'Usage: build-g678-alg-l12-p010-source-canvas.mjs --dry-run|--write|--check');
  const candidate=await prepareP010SourceCanvas();
  if(mode==='--write'){for(const p of[P010_CANDIDATE,P010_REVIEW_OUTPUT])assert(await absent(path.join(ROOT,p)),`output already exists: ${p}; refuse overwrite`);for(const [p,b]of candidate.outputs){await mkdir(path.dirname(path.join(ROOT,p)),{recursive:true});await writeFile(path.join(ROOT,p),b,{flag:'wx'});}}
  if(mode!=='--dry-run')for(const [p,b]of candidate.outputs)assert.deepEqual(await physicalP010File(path.join(ROOT,p)),Buffer.from(b),`stale source candidate: ${p}`);
  console.log(json({state:mode==='--check'?'P010_SOURCE_CANVAS_VERIFIED_READ_ONLY':mode==='--write'?'P010_SOURCE_CANVAS_CREATED_AND_VERIFIED':'P010_SOURCE_CANVAS_INPUTS_VERIFIED_NOT_WRITTEN',runtimeSha256:candidate.manifest.runtimeSha256,runtimeBytes:candidate.manifest.runtimeBytes,renderScale:2,requiredCanvas:candidate.manifest.requiredCanvas,mainFrameCount:465,sourceTextFunctions:28,sourceShapeFunctions:58,sourceMaskInstances:4,maskCompositeBlocks:1499,strictDirectiveAudit:candidate.strictAudit,acceptanceEffects:P010_SOURCE_CANVAS_GATES}));
}
if(process.argv[1]&&path.resolve(process.argv[1])===SCRIPT)main().catch(e=>{console.error(e);process.exitCode=1;});
