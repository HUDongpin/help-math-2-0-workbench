import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {Script} from 'node:vm';
import {parse} from 'acorn';
import {buildSafeRuntime} from './build-safe-ffdec-canvas-adapter.mjs';

const SCRIPT = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT), '..');
export const P009_ID = 'shared-alg001-l12-p009';
export const P009_WORK = `migrations/${P009_ID}`;
export const P009_EXPORT = `${P009_WORK}/audit/ffdec-26.2.1-canvas-v1`;
export const P009_OUT = `${P009_WORK}/candidate-v1`;
export const P009_SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const P009_SOURCE_PATH = `${P009_SOURCE_ROOT}/G6-G8-shared/ALG001/L12/VB/L12VB04.swf`;
export const P009_SOURCE_SHA = 'd8bb6bfb4632fc528a0e14092277d95b2d96998aaeab2f0c1252a0233f35f533';
export const P009_PINS = Object.freeze({
  source: Object.freeze({bytes:165405,sha256:P009_SOURCE_SHA}),
  xml: Object.freeze({bytes:1167103,sha256:'cba1ba1f5ee73ed6f9c33f96d5288dd4aa56e9f51612eda0d49996a68b81c77f'}),
  sourceToolchain: Object.freeze({bytes:10487,sha256:'a5cd5da56844cf163484d39118b81270532e50f78f96c626fdb64008d0b3b9e4'}),
  sourceAuditReceipt: Object.freeze({bytes:25954,sha256:'d1826e66cbaddb816813a4d911a37088406de524fe3ea31a1d203d0fa5e0c15d'}),
  canvasReceipt: Object.freeze({bytes:30276,sha256:'0da97b5038c5d2e17244cb9e747a06881ac009f176a7ad97cd3db78dfe6194a1'}),
  helper: Object.freeze({bytes:52872,sha256:'78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93'}),
  main: Object.freeze({bytes:3648639,sha256:'c916a2aa88b345b4d1db3767f171aeba486252cca8c4c393e0ee89433e88dff6'}),
  root: Object.freeze({bytes:3660577,sha256:'0c33c9fc857c83172ea813f33d5f6e88af4e8d29cd1ac1d97007cb9d2b10dbcb'}),
  catalog: Object.freeze({bytes:1072225,sha256:'9c396b5db8a73742ee871b842ba79125db451023870f65956c8f45dd2cd0277b'}),
  behavior: Object.freeze({bytes:252838,sha256:'2b6f65b03f027eee9a6c1fe03fd4ac88e2d438ae479698704a44c45e9855aeb8'}),
});
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value,null,2)+'\n';
const normalize = value => value.toString().replace(/\r\n?/g,'\n');
export const P009_ACCEPTANCE_EFFECTS = Object.freeze({registered:false,browserValidated:false,interactiveStateResolved:false,originalRuntimeVerified:false,flashFidelityAccepted:false,audioEnabled:false,audioDecoded:false,audioSynchronizationAccepted:false,audioListeningAccepted:false,humanAccepted:false,ownerAccepted:false,strictComplete:false,releaseAccepted:false,published:false});

export function replaceOnce(text, marker, replacement) {
  assert.equal(text.split(marker).length,2,'nonunique or missing source marker');
  return text.replace(marker,replacement);
}
export function declarationSection(html) {
  const start='var scalingGrids = {};',end='\nvar frame = -1;';
  assert.equal(html.split(start).length,2);assert.equal(html.split(end).length,2);
  const a=html.indexOf(start),b=html.indexOf(end);assert.ok(a>=0&&b>a);
  return html.slice(a,b);
}
export function canvasFunctions(html) {
  const code=declarationSection(html),nodes=parse(code,{ecmaVersion:2020}).body.filter(n=>n.type==='FunctionDeclaration');
  const functions=new Map(nodes.map(n=>[n.id.name,code.slice(n.start,n.end)]));assert.equal(functions.size,nodes.length,'duplicate source function');return functions;
}
export function composeP009Canvas(mainHtml,rootHtml) {
  const main=canvasFunctions(mainHtml),root=canvasFunctions(rootHtml);
  assert.deepEqual([...root.keys()].filter(n=>!main.has(n)),['shape63','main'],'root-only definitions changed');
  assert.deepEqual([...root.keys()].filter(n=>main.has(n)&&main.get(n)!==root.get(n)),['sprite62'],'unexpected common drawing drift');
  const header='function sprite62(ctx,ctrans,frame,ratio,time){\n\tctx.save();\n\tctx.transform(1,0,0,1,376.4,205.35);\n\tvar clips = [];\n\tvar frame_cnt = 394;';
  assert.ok(main.get('sprite62').startsWith(header));
  const rootMain=root.get('main'),case6=rootMain.slice(rootMain.indexOf('\n\t\tcase 5:'),rootMain.indexOf('\n\t\tcase 6:'));
  assert.equal(case6,'\n\t\tcase 5:\n\t\t\tplace("sprite62",canvas,ctx,[0.05,0.0,0.0,0.05,412.4,283.3],ctrans,1,(0+time)%394,5,time);\n\t\t\tplace("shape63",canvas,ctx,[0.05,0.0,0.0,0.05,0.0,0.0],ctrans,1,0,0,time);\n\t\t\tbreak;');
  const textFunctions=[...main.keys()].filter(k=>/^text\d+$/.test(k));assert.equal(textFunctions.length,16);assert.equal([...root.keys()].filter(k=>/^sprite\d+$/.test(k)).length,1);
  return replaceOnce(mainHtml,'\nvar frame = -1;','\n'+root.get('shape63')+'\n'+rootMain+'\nvar frame = -1;');
}

const MASK_XML_AUDIT = `import json,sys,xml.etree.ElementTree as E
r=E.fromstring(sys.stdin.buffer.read()); ids={'1','29'}; definitions=[]; uses=[]
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
 if button.get('type')=='DefineButton2Tag':
  assert all(c.get('characterId') not in ids for c in button.find('characters'))
print(json.dumps({'definitions':definitions,'uses':uses},separators=(',',':')))
`;
export function auditP009Masks(xmlBytes,catalog) {
  const result=spawnSync('python3',['-c',MASK_XML_AUDIT],{input:xmlBytes,encoding:'utf8',timeout:30000,maxBuffer:1024*1024});
  assert.ok(!result.error&&result.status===0,`source mask XML audit failed: ${result.error?.message??result.stderr}`);
  const audit=JSON.parse(result.stdout);
  assert.deepEqual(audit.definitions,[{characterId:1,rgba:[102,153,0,164],lineStyleCount:0,fillStyleCount:1},{characterId:29,rgba:[153,204,0,184],lineStyleCount:0,fillStyleCount:1}]);
  assert.deepEqual(audit.uses,[{characterId:1,depth:1,clipDepth:12},{characterId:1,depth:13,clipDepth:20},{characterId:29,depth:21,clipDepth:28},{characterId:29,depth:29,clipDepth:31}]);
  assert.equal(catalog.sourceSha256,P009_SOURCE_SHA);assert.equal(catalog.summary.bitmapDefinitions,0);assert.equal(catalog.timelines.length,2);
  const instances=catalog.timelines.flatMap(t=>t.instances).filter(i=>[1,29].includes(i.characterId));assert.equal(instances.length,4);
  for(const instance of instances){assert.equal(instance.timelineId,'sprite-62');const events=catalog.timelines.find(t=>t.timelineId===instance.timelineId).events.filter(e=>e.instanceId===instance.instanceId);assert.ok(events.length>0);assert.ok(events[0].clipDepth!==undefined);for(const event of events){assert.ok(!event.colorTransform&&!event.clipActions);}}
  assert.ok(catalog.buttonDefinitions.every(b=>b.statePlacements.every(p=>![1,29].includes(p.characterId))));
  return {...audit,exclusiveClipDepthGeometry:true,instanceIds:instances.map(i=>i.instanceId),rule:'Opaque fill geometry only for the two definitions exclusively used by four source clipDepth instances; preserve path, placement and all nonmask drawing',acceptanceEffect:'none'};
}
export function maskFunction(runtime,name) {
  const marker=`function ${name}(`,start=runtime.indexOf(marker);assert.ok(start>=0&&runtime.indexOf(marker,start+1)<0,'mask function missing or duplicate');
  const end=runtime.indexOf('\n}',start)+2;assert.ok(end>start);const text=runtime.slice(start,end);const node=parse(text,{ecmaVersion:2020}).body;assert.equal(node.length,1);assert.equal(node[0].type,'FunctionDeclaration');assert.equal(node[0].id.name,name);return {start,end,text};
}
export function correctP009Masks(runtime) {
  for(const [name,fill] of [['shape1','ctx.fillStyle=tocolor(ctrans.apply([102,153,0,0.6431373]));'],['shape29','ctx.fillStyle=tocolor(ctrans.apply([153,204,0,0.72156864]));']]){
    const body=maskFunction(runtime,name);assert.equal((body.text.match(/ctx\.fill\("evenodd"\)/g)??[]).length,1);assert.ok(!/stroke|lineWidth|globalAlpha/.test(body.text));
    const corrected=replaceOnce(body.text,fill,'ctx.fillStyle="rgba(255,255,255,1)";');
    runtime=runtime.slice(0,body.start)+corrected+runtime.slice(body.end);
  }return runtime;
}
export function validateP009Runtime(runtime) {
  assert.deepEqual([...new Set([...runtime.matchAll(/document\.([\w$]+)/g)].map(m=>m[1]))],['createElement']);
  assert.deepEqual([...runtime.matchAll(/document\.createElement\("([a-z]+)"\)/g)].map(m=>m[1]),['canvas']);
  for(const pattern of [/\beval\s*\(/,/\bFunction\s*\(/,/\b(?:setInterval|setTimeout|requestAnimationFrame|requestIdleCallback)\s*\(/,/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB)\b/,/\b(?:Audio|AudioContext|webkitAudioContext|HTMLAudioElement|Worker|SharedWorker)\b/,/\b(?:location|postMessage|open)\s*(?:\.|\()/,/\bimport\s*\(/,/document\.body/,/\b(?:addEventListener|removeEventListener)\s*\(/,/\b(?:_root|_global|_level0|DoHyperLinks|InternalPreloader)\b/,/\bimageObj\d+\b/])assert.ok(!pattern.test(runtime),String(pattern));
  // The verified helper has a documentation URL in a comment. Reject URL
  // string literals, while retaining the original nonexecuting comment.
  const ast=parse(runtime,{ecmaVersion:2020});
  const visit=node=>{if(!node||typeof node!=='object')return;if(node.type==='Literal'&&typeof node.value==='string')assert.ok(!/^https?:\/\//.test(node.value),'runtime contains remote URL literal');for(const value of Object.values(node)){if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}};visit(ast);
  new Script(runtime);
}

export function buildP009VisualCandidate({helper,mainHtml,rootHtml,xml,catalog,behavior,sourceAuditReceipt,canvasReceipt}) {
  for(const [name,value]of Object.entries({helper,main:mainHtml,root:rootHtml,xml,catalog:Buffer.from(json(catalog)),behavior:Buffer.from(json(behavior)),sourceAuditReceipt,canvasReceipt})){const pin=P009_PINS[name];assert.ok(pin);assert.equal(Buffer.byteLength(value),pin.bytes,`${name} input size drift`);assert.equal(hash(value),pin.sha256,`${name} input hash drift`);}
  const maskAudit=auditP009Masks(xml,catalog);assert.equal(behavior.sourceSha256,P009_SOURCE_SHA);assert.deepEqual(behavior.rootPlacement.parentMatrix,[1,0,0,1,8248,5666]);assert.equal(behavior.rootPlacement.placementFrame,6);assert.equal(behavior.rootPlacement.borderInstance.characterId,63);
  const html=composeP009Canvas(normalize(mainHtml),normalize(rootHtml)),defs=declarationSection(html);
  const placed=[...new Set([...defs.matchAll(/place\("([\w$]+)"/g)].map(m=>m[1]))].sort(),fonts=[...defs.matchAll(/function\s+(font\d+)\s*\(/g)].map(m=>m[1]);assert.deepEqual(fonts,['font3']);assert.equal(placed.length,61);assert.ok(placed.includes('shape63')&&placed.includes('sprite62'));
  const spec={schemaVersion:1,animationId:`course-${P009_ID}`,finalAnimationId:P009_ID,classification:'unregistered-source-native-drawing-candidate',title:'Reviewing Ordered Pairs',source:{swf:P009_SOURCE_PATH,swfBytes:165405,swfSha256:P009_SOURCE_SHA},evidence:{scenarioInventory:`${P009_WORK}/audit/source-behavior.json`,scenarioInventorySha256:P009_PINS.behavior.sha256,audioAudit:`${P009_WORK}/audit/source-stream-blocks.json`,audioAuditSha256:'cc20000fdef998ecd62aac8454f8f1edf0e9ad8c5595140e9899354256036c4a'},ffdecExport:{tool:'JPEXS Free Flash Decompiler 26.2.1',helper:`${P009_EXPORT}/sprites/DefineSprite_62/canvas.js`,helperBytes:P009_PINS.helper.bytes,helperSha256:P009_PINS.helper.sha256,framesHtml:`${P009_EXPORT}/sprites/DefineSprite_62/frames.html`,framesHtmlBytes:P009_PINS.main.bytes,framesHtmlSha256:P009_PINS.main.sha256,rootFramesHtml:`${P009_EXPORT}/frames/frames.html`,rootFramesHtmlBytes:P009_PINS.root.bytes,rootFramesHtmlSha256:P009_PINS.root.sha256,targetSpriteObjectId:62,targetSpriteFunction:'sprite62',exportCanvas:{width:741,height:399},exportInternalTranslation:{x:376.4,y:205.35},expectedPlacedFunctionCount:placed.length,expectedPlacedFunctionsSha256:hash(JSON.stringify(placed)),expectedFontFunctionCount:fonts.length,expectedFontFunctionsSha256:hash(JSON.stringify(fonts)),embeddedImageVariableCount:0,embeddedImageVariablesSha256:hash('[]')},timeline:{fps:12,stage:{width:800,height:600,backgroundColor:'#b8d8f7'},root:{frameCount:10,preloaderStopFrame:1,beginFrame:6,beginLabel:'begin',placementName:'animation',placementDepth:'1',placementTwips:{x:8248,y:5666},placementPixels:{x:412.4,y:283.3}},local:{timelineId:'sprite-62',frameCount:394,livePlaybackEndFrame:394,playbackMode:'once',publicFrameIndexing:'one-indexed',originalTerminalStopEstablished:false},stageRenderOffset:{x:412.4-376.4,y:283.3-205.35}},runtimeContract:{kind:'structural-local-frame',scenarios:['source-static-frame'],defaultScenario:'source-static-frame',supportedLanguages:['en'],seedMapping:'request-seed-retained-as-inspection-metadata-no-source-randomness-executed',blockedLocalFrameRanges:[],currentCanonicalFrameDomainDispositionAsserted:false,unresolved:['Root preloader ownership and original natural start/end/Replay are unverified.','Eight source glossary handlers are not executed by this visual candidate; maintained typed semantic behavior belongs to the modern host.','All source text drawing remains; exact source-text/shape suppression and native text presentation require a separate maintained generator.','Audio stream is extracted but disabled; decoding, schedule, empty block, language, synchronization and listening are unaccepted.','ES page content is a disclosed source-English fallback in the modern host; this raw source renderer admits only en.','Mask geometry correction is a source-exclusive engineering candidate rule; browser/source parity, human/Owner, strict completion and publication are unaccepted.']},output:{script:`${P009_OUT}/canvas-renderer.js`,manifest:`${P009_OUT}/adapter-manifest.json`,globalRegistry:'HELP_MATH_CANVAS_ASSETS'},renderScale:2,requiredCanvas:{width:1600,height:1200},composition:{main:'sprite-only FFDec target keeps normalized pixel matrices and source internal translation',root:'Only shape63 and unused root drawing main definitions are composed from the preserved root export',title:'Outlined-title shape63 is drawn directly after main at source identity placement /20',naturalRootExecution:false}};
  const safe=buildSafeRuntime({helperSource:normalize(helper),framesHtml:html,spec,scale:2});let runtime=safe.runtime;
  const offset=spec.timeline.stageRenderOffset,call=`ctx.transform(1, 0, 0, 1, ${offset.x}, ${offset.y});\n        sprite62(ctx, new cxform(0,0,0,0,255,255,255,255), state.exportFrame, 0, 0);`;
  runtime=replaceOnce(runtime,call,`ctx.save();\n        ${call}\n        ctx.restore();\n        place("shape63",canvas,ctx,[0.05,0,0,0.05,0,0],new cxform(0,0,0,0,255,255,255,255),1,0,0,0);`);
  runtime=runtime.split(JSON.stringify(spec.animationId)).join(JSON.stringify(P009_ID));const uncorrectedRuntime=runtime;
  runtime=correctP009Masks(runtime);validateP009Runtime(runtime);
  const metadata=JSON.parse(JSON.stringify(safe.metadata));metadata.animationId=P009_ID;
  return {runtime,uncorrectedRuntime,spec,metadata,maskAudit,compositionSha256:hash(html),placedFunctions:placed,sourceTextFunctions:[...canvasFunctions(normalize(mainHtml)).keys()].filter(n=>/^text\d+$/.test(n))};
}

async function physicalFile(file,expected) {
  const absolute=path.resolve(file),parts=absolute.split(path.sep).filter(Boolean);let current=path.parse(absolute).root;
  for(const part of parts){current=path.join(current,part);assert.ok(!(await lstat(current)).isSymbolicLink(),`physical path required: ${current}`);}
  assert.equal(await realpath(absolute),absolute);const before=await lstat(absolute,{bigint:true});assert.ok(before.isFile()&&before.nlink===1n);const value=await readFile(absolute),after=await lstat(absolute,{bigint:true});for(const k of ['dev','ino','size','mtimeNs','ctimeNs','nlink'])assert.equal(after[k],before[k],`input changed while read: ${absolute}`);if(expected){assert.equal(value.length,expected.bytes);assert.equal(hash(value),expected.sha256,`hash drift: ${absolute}`);}return value;
}
async function filePin(file) {const b=await physicalFile(file);return {path:path.relative(ROOT,file).split(path.sep).join('/'),bytes:b.length,sha256:hash(b)};}
function checkUpstream(script,args) {const result=spawnSync(process.execPath,[script,...args],{cwd:ROOT,encoding:'utf8',timeout:30000,maxBuffer:2*1024*1024});assert.ok(!result.error&&result.status===0,`upstream check failed: ${script}: ${result.error?.message??result.stderr}`);return {script,args,exitCode:result.status,stdoutSha256:hash(result.stdout),stderrSha256:hash(result.stderr)};}
export async function prepareP009Candidate() {
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT,P009_SOURCE_ROOT,'exact physical AWS source-root opt-in required');assert.ok((await lstat(P009_SOURCE_ROOT)).isDirectory());assert.equal(await realpath(P009_SOURCE_ROOT),P009_SOURCE_ROOT);
  await physicalFile(P009_SOURCE_PATH,P009_PINS.source);await physicalFile(path.join(ROOT,P009_WORK,'audit/source-input.swf'),P009_PINS.source);
  const sourceAuditReceipt=await physicalFile(path.join(ROOT,P009_WORK,'audit/extraction-receipt.json'),P009_PINS.sourceAuditReceipt),canvasReceipt=await physicalFile(path.join(ROOT,P009_EXPORT,'extraction-receipt.json'),P009_PINS.canvasReceipt);
  const upstreamChecks=[checkUpstream(`${P009_WORK}/audit/build-source-audit.mjs`,['--check']),checkUpstream('scripts/export-g678-alg-l12-p009-canvas.mjs',['--check'])];
  const canvasJson=JSON.parse(canvasReceipt);assert.equal(canvasJson.animationId,P009_ID);assert.equal(canvasJson.source.sha256,P009_SOURCE_SHA);assert.equal(canvasJson.sourceXmlSha256,P009_PINS.xml.sha256);assert.equal(canvasJson.sourceToolchainSha256,P009_PINS.sourceToolchain.sha256);assert.equal(canvasJson.canvasDependencyClosure.maskFramesChecked,394);assert.equal(canvasJson.canvasDependencyClosure.generatedMaskBlockCount,1144);
  const sourceToolchain=await physicalFile(path.join(ROOT,P009_WORK,'audit/source-toolchain.json'),P009_PINS.sourceToolchain),xml=await physicalFile(path.join(ROOT,P009_WORK,'audit/movie.xml'),P009_PINS.xml),mainHtml=await physicalFile(path.join(ROOT,P009_EXPORT,'sprites/DefineSprite_62/frames.html'),P009_PINS.main),rootHtml=await physicalFile(path.join(ROOT,P009_EXPORT,'frames/frames.html'),P009_PINS.root),helper=await physicalFile(path.join(ROOT,P009_EXPORT,'sprites/DefineSprite_62/canvas.js'),P009_PINS.helper),catalogBytes=await physicalFile(path.join(ROOT,P009_WORK,'audit/source-text-catalog.json'),P009_PINS.catalog),behaviorBytes=await physicalFile(path.join(ROOT,P009_WORK,'audit/source-behavior.json'),P009_PINS.behavior);
  const candidate=buildP009VisualCandidate({helper,mainHtml,rootHtml,xml,catalog:JSON.parse(catalogBytes),behavior:JSON.parse(behaviorBytes),sourceAuditReceipt,canvasReceipt});
  const dependencies=await Promise.all([SCRIPT,path.join(ROOT,'scripts/build-safe-ffdec-canvas-adapter.mjs'),path.join(ROOT,'scripts/export-g678-alg-l12-p009-canvas.mjs'),path.join(ROOT,P009_WORK,'audit/build-source-audit.mjs')].map(filePin));
  const manifest={schemaVersion:1,animationId:P009_ID,status:'unregistered-mask-corrected-source-drawing-candidate',authority:'Hash-bound deterministic visual engineering candidate; original-runtime, Flash, audio, native typography, human/Owner, strict/release/publication acceptance remains independent',source:{path:P009_SOURCE_PATH,...P009_PINS.source},inputs:{sourceAuditReceipt:{path:`${P009_WORK}/audit/extraction-receipt.json`,...P009_PINS.sourceAuditReceipt},canvasExportReceipt:{path:`${P009_EXPORT}/extraction-receipt.json`,...P009_PINS.canvasReceipt},xml:{path:`${P009_WORK}/audit/movie.xml`,...P009_PINS.xml},sourceToolchain:{path:`${P009_WORK}/audit/source-toolchain.json`,bytes:sourceToolchain.length,sha256:hash(sourceToolchain)},helper:{path:`${P009_EXPORT}/sprites/DefineSprite_62/canvas.js`,...P009_PINS.helper},main:{path:`${P009_EXPORT}/sprites/DefineSprite_62/frames.html`,...P009_PINS.main},root:{path:`${P009_EXPORT}/frames/frames.html`,...P009_PINS.root},sourceTextCatalog:{path:`${P009_WORK}/audit/source-text-catalog.json`,...P009_PINS.catalog},behavior:{path:`${P009_WORK}/audit/source-behavior.json`,...P009_PINS.behavior}},generatorDependencies:dependencies,upstreamChecks,output:{script:`${P009_OUT}/canvas-renderer.js`,bytes:Buffer.byteLength(candidate.runtime),sha256:hash(candidate.runtime),globalRegistry:'HELP_MATH_CANVAS_ASSETS',assetId:P009_ID},runtimeSha256:hash(candidate.runtime),runtimeBytes:Buffer.byteLength(candidate.runtime),uncorrectedRuntimeSha256:hash(candidate.uncorrectedRuntime),compositionSha256:candidate.compositionSha256,stage:{width:800,height:600},renderScale:2,requiredCanvas:{width:1600,height:1200},fps:12,rootFrameCount:10,rootInspectionFrame:6,mainTimelineId:'sprite-62',mainFrameCount:394,maskAudit:candidate.maskAudit,sourceTextFunctionsRetained:candidate.sourceTextFunctions,sourceOutlinedTitleRetained:true,textSuppressionApplied:false,bitmapCount:0,nestedSpriteCount:0,noLegacyActionScriptExecuted:true,noAudioNetworkTimersOrAutoplay:true,rawExportsUnchanged:true,acceptanceEffects:P009_ACCEPTANCE_EFFECTS,strictAcceptanceEffect:'none'};
  const outputs=new Map([['canvas-renderer.js',candidate.runtime],['adapter-spec.json',json(candidate.spec)],['adapter-manifest.json',json(manifest)]]);
  return {...candidate,manifest,outputs};
}
async function absent(file) {try{await lstat(file);return false;}catch(error){if(error.code==='ENOENT')return true;throw error;}}
async function main() {
  assert.ok(process.argv.length<=3);const mode=process.argv[2]??'--dry-run';assert.ok(['--dry-run','--write','--check'].includes(mode),'Usage: build-g678-alg-l12-p009-candidate.mjs [--dry-run|--write|--check]');
  const candidate=await prepareP009Candidate(),out=path.join(ROOT,P009_OUT);
  if(mode==='--write'){assert.ok(await absent(out),'candidate output already exists; refusing rewrite');await mkdir(out);for(const [p,b]of candidate.outputs)await writeFile(path.join(out,p),b,{flag:'wx'});}
  if(mode!=='--dry-run')for(const [p,b]of candidate.outputs)assert.deepEqual(await physicalFile(path.join(out,p)),Buffer.from(b),`stale candidate: ${p}`);
  console.log(json({state:mode==='--check'?'P009_CANDIDATE_VERIFIED_READ_ONLY':mode==='--write'?'P009_CANDIDATE_CREATED_AND_VERIFIED':'P009_CANDIDATE_INPUTS_VERIFIED_NOT_WRITTEN',runtimeSha256:candidate.manifest.runtimeSha256,runtimeBytes:candidate.manifest.runtimeBytes,renderScale:2,requiredCanvas:candidate.manifest.requiredCanvas,sourceTextFunctionsRetained:candidate.sourceTextFunctions.length,maskInstances:candidate.maskAudit.uses.length,mainFrameCount:394,acceptanceEffects:P009_ACCEPTANCE_EFFECTS}));
}
if(process.argv[1]&&path.resolve(process.argv[1])===SCRIPT)main().catch(error=>{console.error(error.message);process.exitCode=1;});
