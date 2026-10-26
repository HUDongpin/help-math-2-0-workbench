#!/usr/bin/env node
// One prepared, source-bound wrapper packet. No registry/descriptor activation.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat,mkdir,readFile,realpath,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const ID='shared-nms002-l01-p044',FAMILY='nms-l01-p044-prepared-instruction-maintained-dom',SUFFIX='nms-l01-p044-readable-instruction';
const RUN='work/g678-shared-page-factory/g678-nms-l01-p044-prepared-current-js-v1';
const MODULE='packages/demos/src/modules/g678-nms-l01-prepared-current-js-p044.tsx',TIMELINE='packages/demos/src/timelines/g678-nms-l01-prepared-current-js-p044.ts';
const MANIFEST='catalog/g678-nms-l01-p044-prepared-candidate-v1.json';
const FRAGMENT='catalog/product-bridge-calibrations/g678-nms-l01-p044-prepared-current-js-v1.fragment.json';
const REGISTRY='packages/demos/private-current-js-registry.json';
const PRIOR='catalog/product-bridge-calibrations/g678-current-js-378-page-registration-v1.json';
const BROWSER='output/playwright/g678-nms-l01-p044-product-v9-prepared-bound/evidence.json';
const METADATA='work/g678-shared-page-factory/g678-nms-l01-p044-prepared-module-metadata-v1/metadata.json';
const AST='work/g678-shared-page-factory/g678-nms-l01-p044-prepared-canvas-ast-verification-v1/verification.json';
const SOURCE={path:'G6-G8-shared/NMS002/L1/TS/L1TS08.swf',bytes:657348,sha256:'8ad8df775eff49a3763f67e95fba4ed211e34912bd63f6602078119240fe6c76'};
export const EFFECTS=Object.freeze(Object.fromEntries(['currentJavaScriptRegistered','registrationCandidate','productCalibrationPassed','browserProductCalibrationPassed',
  'wholeLessonEngineeringPreviewReady','scaleOutAuthorized','releaseAuthorized','authoritativeOriginalRuntime','visualFidelityAccepted','audioAccepted','humanVisualAccepted','ownerAccepted','strictComplete','released','published'].map(k=>[k,false])));
const encode=v=>JSON.stringify(v,null,2)+'\n',hash=b=>createHash('sha256').update(b).digest('hex');
const pin=(p,b)=>({path:p,bytes:Buffer.byteLength(b),sha256:hash(b)});
async function physical(p,expected){
  const absolute=p.startsWith('G6-G8-shared/')?path.resolve(process.env.HELP_MATH_G678_SOURCE_ROOT??'',p):path.resolve(ROOT,p);
  if(p.startsWith('G6-G8-shared/'))assert.ok(process.env.HELP_MATH_G678_SOURCE_ROOT);
  const actual=await realpath(absolute),vendor=await realpath(path.join(ROOT,'node_modules'));
  assert.ok(actual===absolute||actual.startsWith(vendor+path.sep),`Noncanonical source path: ${p}`);
  const before=await lstat(actual,{bigint:true});assert.ok(before.isFile()&&!before.isSymbolicLink()&&before.nlink===1n,p);
  const bytes=await readFile(actual),after=await lstat(actual,{bigint:true});for(const k of['dev','ino','size','mtimeNs','ctimeNs','nlink'])assert.equal(after[k],before[k],p);
  const binding=pin(p,bytes);if(expected)assert.deepEqual(binding,expected,p);return{bytes,binding,value:p.endsWith('.json')?JSON.parse(bytes):undefined};
}
export function validatePreparedEvidence(browser,metadata){
  assert.equal(browser.status,'passed-isolated-product-candidate-not-registered');assert.equal(browser.preparedLoader,true);assert.equal(browser.inputsUnchanged,true);assert.deepEqual(browser.inputsAfter,browser.inputs);
  assert.equal(browser.records.length,155);assert.deepEqual(browser.errors,[]);assert.deepEqual(browser.requests,[]);
  assert.equal(browser.executedFixture.path,'output/playwright/g678-nms-l01-p044-product-v9-prepared-bound/fixture.js');
  assert.equal(browser.executedFixture.bytes,17035417);assert.equal(browser.executedFixture.sha256,'d5371fb152c5279bad7089377604684a92698efb0dece84246ff189a83f4e632');
  assert.equal(browser.preparedDefaultPixels.length,23);assert.ok(browser.preparedDefaultPixels.every(r=>r.differingBytes===0));
  assert.deepEqual(browser.loadGates.map(g=>g.label),['370-initial','390-initial','1440-initial','natural-initial','decode-rejection']);
  for(const gate of browser.loadGates){assert.equal(gate.before.decodeCalls,11);assert.equal(gate.before.runtimeCount,0);assert.equal(gate.before.admitted,false);assert.equal(gate.before.externalHold,'true');
    if(gate.label==='decode-rejection')assert.deepEqual(gate.after,{admitted:false,runtimeCount:0});else{assert.equal(gate.after.firstRuntimeFrame,gate.label==='natural-initial'?1:312);assert.equal(gate.after.firstVisualFrame,gate.after.firstRuntimeFrame);}}
  assert.equal(metadata.status,'passed');assert.equal(metadata.inputsUnchanged,true);assert.equal(metadata.actual.rendererName,'PreparedP044Renderer');assert.equal(metadata.actual.allValid,true);assert.equal(metadata.actual.allInvalid,true);assert.equal(metadata.actual.allGatesFalse,true);
  const m=metadata.actual.metadata;assert.equal(m.key,ID);assert.equal(m.movie.frameCount,10);assert.equal(m.movie.fps,12);assert.deepEqual(m.movie.stage,{width:800,height:600});
  assert.deepEqual(m.runtime.frameDomains,[{id:'root',frameCount:10,fps:12},{id:'sprite-293',frameCount:759,fps:12,rootFrame:6}]);
  assert.equal(m.playbackEndFrame,756);assert.equal(m.reducedMotionFrame,756);assert.deepEqual(m.interactiveStops.map(s=>s.stopFrame),[312,449,575,697,737]);
  assert.ok(m.interactiveStops.every(s=>s.rendererStateOnResume==='preserve'));assert.deepEqual(m.lessonHost.capabilities,['glossary','practice-feedback']);
  for(const k of['audioCues','audioTracks','interactiveAudioAssets'])assert.deepEqual(m[k],[]);
  return m;
}
export function wrapperSource(){return `"use client";
// Generated by build-g678-nms-l01-p044-current-js-candidate.mjs; do not edit.
import candidate,{P044_MODULE_PREPARATION} from '../g678-nms-l01-p044-prepared-module';
import {SOURCE_TIMELINE} from '../timelines/g678-nms-l01-prepared-current-js-p044';
if(candidate.key!==SOURCE_TIMELINE.animationId||P044_MODULE_PREPARATION.sourceSha256!==SOURCE_TIMELINE.source.sha256||P044_MODULE_PREPARATION.sourceImagesDecoded!==11||!P044_MODULE_PREPARATION.loaderAwaitedDecode)throw Error('p044 prepared source binding drift');
export {SOURCE_TIMELINE};
export const CURRENT_JAVASCRIPT_REGISTERED=false as const;
export const DOM_RENDERER_IMPLEMENTED=true as const;
export default candidate;
`;}
export async function buildPacket(check=false){
  const registry=await physical(REGISTRY,{path:REGISTRY,bytes:432557,sha256:'c075c204a21c020da2cef54bec74a2e713d7eba1c4fc3d55b158e0d8a8d464e2'});
  const prior=await physical(PRIOR,{path:PRIOR,bytes:2415408,sha256:'cf4921508fcaff5270c2dc4a3bd2571397b9c456b0ff5c1cae46378081e71cf5'});
  const browser=await physical(BROWSER,{path:BROWSER,bytes:397575,sha256:'508f3238a180e228f478bfaed318f3203e48aa6cc9c89297cc12691cd63670a4'});
  const metadata=await physical(METADATA,{path:METADATA,bytes:13856,sha256:'1adf0e0704876fbf56ed798fd663562208a44db29e84ff47122e3933d4a14e54'});
  const runtime=validatePreparedEvidence(browser.value,metadata.value),source=await physical(SOURCE.path,SOURCE);
  const migration=await physical('migrations/shared-nms002-l01-p044/migration.json');assert.equal(migration.value.animationId,ID);assert.equal(migration.value.source.swfSha256,SOURCE.sha256);
  const files=new Map();const add=async p=>{const item=typeof p==='string'?await physical(p):await physical(p.path,p);const previous=files.get(item.binding.path);if(previous)assert.deepEqual(previous,item.binding);files.set(item.binding.path,item.binding);return item;};
  for(const item of[registry,prior,browser,metadata,source,migration])files.set(item.binding.path,item.binding);
  for(const entry of[...browser.value.inputs,...browser.value.screenshots,...metadata.value.inputs,metadata.value.probe,...Object.values(migration.value.source.sourceEvidence)])await add(entry);
  await add({path:browser.value.executedFixture.path,bytes:browser.value.executedFixture.bytes,sha256:browser.value.executedFixture.sha256});
  for(const name of['packages/demos/tests/g678-nms-l01-p044-controller.test.ts','packages/demos/tests/g678-nms-l01-p044-product-clock.test.ts','packages/demos/tests/g678-nms-l01-p044-product-host.test.ts',
    'packages/demos/tests/g678-nms-l01-p044-candidate-view.test.ts','packages/demos/tests/g678-nms-l01-p044-candidate-module.test.ts','packages/demos/tests/g678-nms-l01-p044-readable-instruction.test.ts',
    'scripts/build-g678-nms-l01-p044-current-js-candidate.mjs','scripts/build-g678-nms-l01-p044-current-js-candidate.test.mjs'])await add(name);
  for(const name of['catalog/g678-nms-l01-p044-source-glossary-v1.json','catalog/g678-nms-l01-p044-readable-instruction-v1.json',AST,
    'work/g678-shared-page-factory/g678-nms-l01-p044-prepared-source-canvas-v2/run.json']){const doc=await add(name);for(const input of doc.value.inputs??[])await add(input);if(doc.value.output)await add(doc.value.output);}
  const inputs=[...files.values()].sort((a,b)=>a.path.localeCompare(b.path));
  const timeline='// Generated source binding; do not edit.\nexport const SOURCE_TIMELINE = '+encode({schemaVersion:1,animationId:ID,source:SOURCE,adapterFamily:FAMILY,
    mainTimeline:{objectId:293,frameDomain:'sprite-293',frameCount:759,depth:3},preparedSourceImages:11,proposedPresentation:{pageInteractionCompanionTargetIdSuffix:SUFFIX,descriptorActivated:false},
    currentJavaScriptImplemented:true,currentJavaScriptRegistered:false,acceptanceEffects:EFFECTS}).trimEnd()+' as const;\n';
  const module=wrapperSource();const manifest={schemaVersion:1,artifactType:'g678-nms-l01-p044-prepared-unregistered-candidate',animationId:ID,gradeScope:'G6-G8-shared',source:SOURCE,
    predecessorFreeze:prior.binding,registryBefore:registry.binding,inputs,actualBrowserModule:metadata.value.actual,browserEvidence:browser.binding,
    preparedResourceSuccessor:'eleven-source-images-decoded-before-standard-module-import-resolves',
    originalRuntimeLimits:migration.value.unresolvedBoundaries,sourceResidual:migration.value.source.sourceBoundary,
    module:pin(MODULE,module),timeline:pin(TIMELINE,timeline),gates:EFFECTS};
  const manifestBytes=encode(manifest),memberPath=`${RUN}/members/${ID}/member-manifest.json`;
  const member=encode({animationId:ID,source:SOURCE,module:pin(MODULE,module),timeline:pin(TIMELINE,timeline),candidateManifest:pin(MANIFEST,manifestBytes),acceptanceEffects:EFFECTS});
  const runPath=`${RUN}/run-manifest.json`,run=encode({schemaVersion:1,artifactType:'single-prepared-p044-wrapper-packet',inputs,outputs:[pin(MODULE,module),pin(TIMELINE,timeline),pin(MANIFEST,manifestBytes),pin(memberPath,member)],currentJavaScriptRegisteredCount:0,gates:EFFECTS});
  const fragment=encode({schemaVersion:1,artifactType:'g678-nms-l01-p044-prepared-current-js-fragment-v1',deploymentScope:'local-only',exactPlacementCount:1,generatedPlacementCount:1,
    registrationCandidatePlacementCount:0,currentJavaScriptRegisteredCount:0,wholeLessonEngineeringPreviewCount:0,candidateManifest:pin(MANIFEST,manifestBytes),compilerRun:pin(runPath,run),predecessorFreeze:prior.binding,
    entries:[{key:ID,module:'./modules/g678-nms-l01-prepared-current-js-p044',maturity:'private-current-js',deploymentScope:'local-only',adapterFamily:FAMILY,source:SOURCE,
      moduleFile:pin(MODULE,module),timeline:pin(TIMELINE,timeline),memberManifest:pin(memberPath,member),runtimeContract:runtime,
      proposedPresentation:{pageInteractionCompanionTargetIdSuffix:SUFFIX,descriptorActivated:false},...EFFECTS,acceptanceEffects:EFFECTS}],...EFFECTS,acceptanceEffects:EFFECTS});
  const outputs=[[MODULE,module],[TIMELINE,timeline],[MANIFEST,manifestBytes],[memberPath,member],[runPath,run],[FRAGMENT,fragment]];
  if(!check)for(const[p]of outputs)await assert.rejects(lstat(path.join(ROOT,p)),{code:'ENOENT'},`Output already exists: ${p}`);
  for(const[p,b]of outputs){if(check)assert.equal((await physical(p)).bytes.toString(),b,p);else{
    let directory=ROOT;for(const part of path.dirname(p).split('/')){directory=path.join(directory,part);await mkdir(directory).catch(e=>{if(e.code!=='EEXIST')throw e;});
      const info=await lstat(directory);assert.ok(info.isDirectory()&&!info.isSymbolicLink()&&await realpath(directory)===directory,'Noncanonical output parent');}
    await writeFile(path.join(ROOT,p),b,{flag:'wx',mode:0o444});}}
  for(const input of inputs)await physical(input.path,input);
  return{check,filesWritten:check?0:outputs.length,outputs:outputs.map(([p,b])=>pin(p,b)),registeredCount:0};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert.ok(process.argv.length<=3&&(!process.argv[2]||process.argv[2]==='--check'));console.log(encode(await buildPacket(process.argv[2]==='--check')));}
