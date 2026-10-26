#!/usr/bin/env node
/** Exact P058 maintained-DOM run/member plan. No freeze, registry, or host write. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {pinFile,readPin,readJsonPin,uniquePins,sha256} from '../lib/g678-admission-proof.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';

const SCRIPT=fileURLToPath(import.meta.url),ROOT=path.resolve(path.dirname(SCRIPT),'..');
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ID='shared-nms002-l02-p058';
const CALIBRATION='g678-nms-l02-p058-conditional-host-current-js-v1';
const RUN_ROOT=`work/g678-shared-page-factory/${CALIBRATION}`;
const RUN=`${RUN_ROOT}/run-manifest.json`;
const MEMBER=`${RUN_ROOT}/members/${ID}/member-manifest.json`;
const MODULE=`packages/demos/src/modules/${ID}.tsx`;
const TIMELINE=`packages/demos/src/timelines/${ID}.ts`;
const SOURCE={path:'G6-G8-shared/NMS002/L2/TS/L2TS05.swf',bytes:113754,
 sha256:'fc26d0a7049db6b8ce5532cfbed1fcb380c75e503d9c7cb7974bea73b8505d57'};
const XML={path:'G6-G8-shared/NMS002/L2/index.xml',bytes:12845,
 sha256:'550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61'};
const SOURCE_AUDIT='output/nms-l02-p058-source-20260927/source-audit.json';
const SOURCE_AUDIT_SHA='de06df9ad2434071d8470d14694e2c79543ae5515fdd43df30f1f4809639047a';
const RAW_AUDIO='output/nms-l02-p058-audio-20260927/raw-index-v1.json';
const RAW_AUDIO_SHA='16ebe7ff8d0ba39cb976a20e12f24b698d623024e44fdcf3236a6fdca45a9690';
const AUDIO='output/nms-l02-p058-audio-20260927/embedded-source-stream-v1.mp3';
const AUDIO_SHA='05f43faf63e470935728be5b54933ebb71760aeb819074b570091a6e4b068f38';
const AUDIO_BLOCKS='packages/demos/src/generated/nms-l02-p058-audio-blocks-v1.ts';
const AUDIO_BLOCKS_SHA='c75627caf40b0e97e34221677a8ac55fcfdd6ba44df3366885dd7f67957fa2d3';
const GLOSSARY='output/nms-l02-p058-glossary-20260927/conditional-bank.json';
const GLOSSARY_SHA='7fc26d3389ffac81a9cfc4c8d560822ce49b5096cfa54b8d52465ebfefa478aa';
const GLOSSARY_RECEIPT='output/nms-l02-p058-glossary-20260927/receipt.json';
const GLOSSARY_RECEIPT_SHA='0fcf28817223d61357a0b47465da77568bfcc18fa9ec7c5673f7d2a0d52300c5';
const DISPLAY='packages/demos/src/generated/nms-l02-p058-display-list-v1.ts';
const DISPLAY_SHA='a4fb69b5e1698b2553e2e6c0dac9d9376b8eb96b231bb195675016deced28ec1';
const DISPLAY_TIMELINE='packages/demos/src/timelines/shared-nms002-l02-p058-display-list.ts';
const DISPLAY_RECEIPT='output/nms-l02-p058-source-20260927/display-list-generation-v1.json';
const TERMS='packages/demos/src/generated/nms-l02-p058-terms-v1.ts';
const TERMS_SHA='bed47b321546dd4400ef7e553623bc21347627e9d00f41519fc82f3b9c34e677';
const SEMANTIC_TEST='packages/demos/tests/nms-l02-p058-semantic-v1.test.ts';
const PRODUCT_TEST='packages/demos/tests/nms-l02-p058-product-v1.test.tsx';
const INPUT_PATHS=[
 MODULE,TIMELINE,
 'packages/demos/src/nms-l02-p058-product-module-v1.tsx',
 'packages/demos/src/nms-l02-p058-product-renderer-v1.tsx',
 'packages/demos/src/nms-l02-p058-product-text-v1.ts',
 'packages/demos/src/nms-l02-p058-semantic-v1.ts',
 DISPLAY_TIMELINE,DISPLAY,TERMS,AUDIO_BLOCKS,SEMANTIC_TEST,PRODUCT_TEST,
 'scripts/prepare-nms-l02-p058-source.mjs',
 'scripts/prepare-nms-l02-p058-source.test.mjs',
 'scripts/build-nms-l02-p058-display-list-v1.mjs',
 'scripts/build-nms-l02-p058-display-list-v1.test.mjs',
 'scripts/build-nms-l02-p058-audio-blocks-v1.mjs',
 'scripts/build-nms-l02-p058-audio-blocks-v1.test.mjs',
 'scripts/prepare-nms-l02-p058-glossary.mjs',
 'scripts/prepare-nms-l02-p058-glossary.test.mjs',
 'scripts/prepare-nms-l02-p058-dom-artifacts-v1.mjs',
 'scripts/prepare-nms-l02-p058-dom-artifacts-v1.test.mjs',
 SOURCE_AUDIT,'output/nms-l02-p058-source-20260927/README.md',DISPLAY_RECEIPT,
 RAW_AUDIO,AUDIO,'output/nms-l02-p058-audio-20260927/AUDIO_SOURCE_2026-09-27.md',
 GLOSSARY,GLOSSARY_RECEIPT,
];
const GENERATED=[MODULE,TIMELINE,DISPLAY_TIMELINE,DISPLAY,DISPLAY_RECEIPT,TERMS,AUDIO_BLOCKS,
 SOURCE_AUDIT,RAW_AUDIO,AUDIO,'output/nms-l02-p058-audio-20260927/AUDIO_SOURCE_2026-09-27.md',
 GLOSSARY,GLOSSARY_RECEIPT];
// Common contracts and extractors are host-owned, pinned but disjoint from
// this page's own source and product closure.
const SHARED_DEPENDENCIES=[
 'packages/demos/src/contract.ts',
 'packages/demos/src/lesson-text-contract.ts',
 'packages/demos/src/lesson-text-snapshot.ts',
 'packages/demos/src/source-glossary-controls.tsx',
 'lib/g678-admission-proof.mjs',
 'scripts/private-current-js-registry.mjs',
 'scripts/build-g4-l3-embedded-audio-archive.mjs',
];
const GENERATOR_CHECKS=[
 ['scripts/prepare-nms-l02-p058-source.mjs',SOURCE_AUDIT],
 ['scripts/build-nms-l02-p058-display-list-v1.mjs',DISPLAY],
 ['scripts/build-nms-l02-p058-audio-blocks-v1.mjs',RAW_AUDIO],
 ['scripts/prepare-nms-l02-p058-glossary.mjs',TERMS],
];
const json=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
const bytePin=(relative,bytes)=>({path:relative,bytes:bytes.length,sha256:sha256(bytes)});
const same=(left,right,label)=>assert.deepStrictEqual(left,right,label);

function verifySource(root){
 assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT,SOURCE_ROOT,'exact real G6-G8 source root');
 assert.equal(fs.realpathSync(SOURCE_ROOT),SOURCE_ROOT,'physical source root');
 assert(fs.lstatSync(SOURCE_ROOT).isDirectory(),'source root directory');
 same(pinFile(SOURCE_ROOT,SOURCE.path),SOURCE,'exact P058 SWF');
 same(pinFile(SOURCE_ROOT,XML.path),XML,'exact lesson XML');
 const auditPin=pinFile(root,SOURCE_AUDIT);
 assert.equal(auditPin.sha256,SOURCE_AUDIT_SHA,'final source audit');
 const audit=readJsonPin(root,auditPin);
 assert.equal(audit.kind,'nms-l02-p058-source-static-audit-v1');
 assert.equal(audit.animationId,ID);
 same(audit.source,SOURCE,'audited source identity');
 same(audit.sourceXml,XML,'audited lesson XML identity');
 assert.equal(audit.sourceStructure?.teachingDomain,'sprite-37');
 assert.equal(audit.sourceStructure?.teachingFrameCount,274);
 assert.equal(audit.sourceStructure?.rootBeginFrame,6);
 assert.equal(audit.sourceStructure?.rootSprite?.characterId,37);
 assert.equal(audit.sourceStructure?.sourceChildTerminalStopPresent,false);
 assert(Array.isArray(audit.extraction?.files)&&audit.extraction.files.length===27,
  'finite 27-file source extraction');
 for(const pin of audit.extraction.files){
  assert(pin.path.startsWith('output/nms-l02-p058-source-20260927/extraction/'),
   'bounded extracted input');
  readPin(root,pin);
 }
 assert.equal(audit.buttonActions.length,7);
 assert.equal(new Set(audit.buttonActions.map(row=>row.sourceKeyAttribute)).size,6);
 const audioPin=pinFile(root,RAW_AUDIO);assert.equal(audioPin.sha256,RAW_AUDIO_SHA);
 const raw=readJsonPin(root,audioPin);
 assert.equal(raw.source.sha256,SOURCE.sha256);
 assert.equal(raw.stream.frameDomain,'sprite-37');
 assert.equal(raw.stream.blockCount,265);
 same(raw.stream.blockFrameRange,{first:10,last:274,inclusive:true},'audio frame range');
 assert.equal(raw.stream.declaredBlockSamples,486144);
 assert.equal(raw.decode.decodedSamples,486144);
 assert.equal(raw.interpretation.emptyBlockSilenceInserted,false);
 assert.equal(raw.interpretation.seekTrimApplied,false);
 assert.equal(raw.interpretation.originalRuntimeSynchronizationEstablished,false);
 assert.equal(raw.interpretation.audioListeningAccepted,false);
 const audio=pinFile(root,AUDIO);
 assert.equal(audio.sha256,AUDIO_SHA);assert.equal(audio.bytes,109720);
 assert.equal(raw.stream.payload.sha256,AUDIO_SHA);
 const glossaryPin=pinFile(root,GLOSSARY);assert.equal(glossaryPin.sha256,GLOSSARY_SHA);
 const glossary=readJsonPin(root,glossaryPin);
 assert.equal(glossary.animationId,ID);
 assert.equal(glossary.sourceSelection,'identified-indexMI-export-literal-L1-bank-path');
 assert.equal(glossary.originalL2XmlResolved,false);
 assert.equal(glossary.historicalHostAssociationEstablished,false);
 assert.equal(glossary.originalRuntimeLookupVerified,false);
 assert.equal(glossary.terms.length,6);
 assert.equal(glossary.actions.length,7);
 assert.equal(pinFile(root,GLOSSARY_RECEIPT).sha256,GLOSSARY_RECEIPT_SHA);
 assert.equal(pinFile(root,DISPLAY).sha256,DISPLAY_SHA);
 assert.equal(pinFile(root,TERMS).sha256,TERMS_SHA);
 assert.equal(pinFile(root,AUDIO_BLOCKS).sha256,AUDIO_BLOCKS_SHA);
 return {auditPin,audit,rawAudioPin:audioPin,audioPin:audio,glossaryPin,
  glossaryReceiptPin:pinFile(root,GLOSSARY_RECEIPT),audioBlocksPin:pinFile(root,AUDIO_BLOCKS)};
}
function checks(root){
 return GENERATOR_CHECKS.map(([producer,output])=>{
  const run=spawnSync(process.execPath,[path.join(root,producer),'--check'],{
   cwd:root,env:{...process.env,HELP_MATH_G678_SOURCE_ROOT:SOURCE_ROOT},encoding:'utf8',
   timeout:180000,maxBuffer:1024*1024});
  assert.equal(run.status,0,`${producer} --check: ${String(run.stderr??run.error??'').slice(0,1500)}`);
  return {producer:pinFile(root,producer),output:pinFile(root,output),mode:'--check',exitCode:0};
 });
}
function validationChecks(root){
 const run=spawnSync(process.execPath,['--import','tsx','--test',SEMANTIC_TEST,PRODUCT_TEST],{
  cwd:root,env:process.env,encoding:'utf8',timeout:180000,maxBuffer:1024*1024});
 assert.equal(run.status,0,`P058 semantic/product tests: ${String(run.stderr??run.error??'').slice(0,1500)}`);
 return [{tests:[pinFile(root,SEMANTIC_TEST),pinFile(root,PRODUCT_TEST)],
  mode:'node --import tsx --test',exitCode:0}];
}
function projectRegistry(root,artifacts){
 const registry=JSON.parse(readPin(root,pinFile(root,'packages/demos/private-current-js-registry.json')));
 const registrations=registry.calibrations.flatMap(row=>row.entries.filter(entry=>entry.key===ID)
  .map(entry=>({calibrationId:row.calibrationId,entry})));
 if(registrations.length){
  assert.equal(registrations.length,1);
  assert.equal(registrations[0].calibrationId,CALIBRATION);
  same(registrations[0].entry.artifacts,artifacts,'existing P058 DOM registration exact');
  return true;
 }
 const fragment={calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:`catalog/product-bridge-calibrations/${CALIBRATION}.json`,
  freezeManifestBytes:1,freezeManifestSha256:'0'.repeat(64),
  entries:[{key:ID,module:`./modules/${ID}`,maturity:'private-current-js',
   complexityLane:'interactive-understood',artifacts}]};
 const projected=upsertPrivateCurrentJsCalibration(registry,fragment);
 assert(projected.calibrations.some(row=>row.calibrationId===CALIBRATION),'DOM registry shape');
 return true;
}
export function buildP058DomArtifactPlan({root=ROOT}={}){
 assert.equal(fs.realpathSync(root),root,'physical worktree');
 assert(process.env.NODE_ENV!=='production'&&!process.env.VERCEL&&!process.env.VERCEL_ENV,
  'local engineering only');
 const source=verifySource(root);
 const inputs=uniquePins([...INPUT_PATHS.map(relative=>pinFile(root,relative)),...source.audit.extraction.files]);
 const sharedDependencies=uniquePins(SHARED_DEPENDENCIES.map(relative=>pinFile(root,relative)));
 assert(sharedDependencies.every(pin=>!inputs.some(item=>item.path===pin.path)),
  'page-owned and host-owned inputs are disjoint');
 const outputs=uniquePins(GENERATED.map(relative=>{
  const pin=inputs.find(item=>item.path===relative);
  assert(pin,`generated output in finite input closure: ${relative}`);return pin;
 }));
 const generatorChecks=checks(root),validation=validationChecks(root);
 for(const check of generatorChecks){
  same(inputs.find(pin=>pin.path===check.producer.path),check.producer,'checked producer in closure');
  same(outputs.find(pin=>pin.path===check.output.path),check.output,'checked output in closure');
 }
 const acceptanceEffects={originalRuntimeFidelity:false,audioAccepted:false,humanReviewed:false,
  ownerAccepted:false,strictComplete:false,published:false};
 const runManifest={schemaVersion:1,kind:'nms-l02-p058-maintained-dom-source-run-v1',animationId:ID,
  method:'source-locked-public-tool-IR-and-maintained-DOM-integration',
  sourceRoot:SOURCE_ROOT,source:SOURCE,sourceXml:XML,
  sourceStructure:{stage:{width:800,height:600},fps:12,rootFrameCount:10,rootBeginFrame:6,
   rootSpritePlacement:{characterId:37,depth:2,transXTwips:7477,transYTwips:5666,
    scaleX:1.000045776367188,scaleY:1},
   frameDomain:'sprite-37',frameCount:274,sourceChildTerminalStopPresent:false,
   productPlaybackMode:'once',productPlaybackEndFrame:274,originalRuntimeParityEstablished:false},
  sourceAudit:source.auditPin,
  sourceAudio:{rawIndex:source.rawAudioPin,payload:source.audioPin,
   blockIr:source.audioBlocksPin,blockCount:265,firstBlockFrame:10,lastBlockFrame:274,
   decodedSamples:486144,headLatencySeekSamples:1673,
   productModuleAudioRendered:false,sourceAlignmentAccepted:false,listeningAccepted:false},
  glossary:{candidate:source.glossaryPin,receipt:source.glossaryReceiptPin,
   uniqueTermCount:6,buttonOccurrenceCount:7,
   sourceSelection:'identified-indexMI-export-literal-L1-bank-path',
   originalL2XmlResolved:false,historicalHostAssociationEstablished:false,
   originalRuntimeLookupVerified:false},
  generatorChecks,validationChecks:validation,inputs,outputs,sharedDependencies,
  productCalibrationPassed:false,scaleOutAuthorized:false,acceptanceEffects};
 const runBytes=json(runManifest),runPin=bytePin(RUN,runBytes);
 const module=inputs.find(pin=>pin.path===MODULE),timeline=inputs.find(pin=>pin.path===TIMELINE);
 const memberManifest={schemaVersion:1,kind:'nms-l02-p058-maintained-dom-member-v1',animationId:ID,
  rendererBindingKind:'maintained-dom-module-v1',source:SOURCE,sourceXml:XML,
  sourceRun:runPin,module,timeline,inputs,outputs,sharedDependencies,
  productCalibrationPassed:false,scaleOutAuthorized:false,acceptanceEffects};
 const memberBytes=json(memberManifest),memberPin=bytePin(MEMBER,memberBytes);
 const artifacts={kind:'maintained-dom-module-v1',module,timeline,memberManifest:memberPin,sourceRun:runPin};
 assert(projectRegistry(root,artifacts),'structural registry projection');
 return {root,runManifest,memberManifest,runPin,memberPin,artifacts,registryShapeAccepted:true,
  outputs:[{path:RUN,bytes:runBytes},{path:MEMBER,bytes:memberBytes}]};
}
export function prepareP058DomArtifacts(plan){
 assert(plan.outputs.every(item=>!fs.existsSync(path.join(plan.root,item.path))),
  'immutable DOM artifacts already exist; use --check');
 for(const item of plan.outputs){
  const file=path.join(plan.root,item.path);fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,item.bytes,{flag:'wx'});
  same(pinFile(plan.root,item.path),bytePin(item.path,item.bytes),'written DOM artifact');
 }
 return {status:'P058_DOM_ARTIFACTS_PREPARED_UNREGISTERED',artifacts:plan.artifacts,
  registryShapeAccepted:true,registrationEffect:'none',acceptanceEffect:'none'};
}
export function checkP058DomArtifacts(plan){
 for(const item of plan.outputs)same(readPin(plan.root,bytePin(item.path,item.bytes)),item.bytes,
  `${item.path} manifest drift`);
 return {status:'P058_DOM_ARTIFACTS_CHECKED_UNREGISTERED',artifacts:plan.artifacts,
  registryShapeAccepted:true,registrationEffect:'none',acceptanceEffect:'none'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===SCRIPT){
 try{
  assert(process.argv.length===3&&['--dry-run','--prepare','--check'].includes(process.argv[2]),
   'use --dry-run, --prepare or --check');
  const plan=buildP058DomArtifactPlan();
  const result=process.argv[2]==='--prepare'?prepareP058DomArtifacts(plan):
   process.argv[2]==='--check'?checkP058DomArtifacts(plan):
   {status:'P058_DOM_ARTIFACTS_DRY_RUN_UNREGISTERED',artifacts:plan.artifacts,
    inputCount:plan.runManifest.inputs.length,outputCount:plan.runManifest.outputs.length,
    registryShapeAccepted:true,registrationEffect:'none',acceptanceEffect:'none'};
  console.log(JSON.stringify(result));
 }catch(error){console.error(error.stack??error);process.exitCode=1;}
}
