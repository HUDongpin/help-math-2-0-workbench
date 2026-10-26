#!/usr/bin/env node
/** Exact P057 maintained-DOM run/member plan. No freeze, registry, or host write. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {pinFile,readPin,readJsonPin,uniquePins,sha256} from '../lib/g678-admission-proof.mjs';
import {upsertPrivateCurrentJsCalibration} from './private-current-js-registry.mjs';

const SCRIPT=fileURLToPath(import.meta.url),ROOT=path.resolve(path.dirname(SCRIPT),'..');
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ID='shared-nms002-l02-p057';
const CALIBRATION='g678-nms-l02-p057-conditional-host-current-js-v1';
const RUN_ROOT=`work/g678-shared-page-factory/${CALIBRATION}`;
const RUN=`${RUN_ROOT}/run-manifest.json`;
const MEMBER=`${RUN_ROOT}/members/${ID}/member-manifest.json`;
const MODULE=`packages/demos/src/modules/${ID}.tsx`;
const TIMELINE=`packages/demos/src/timelines/${ID}.ts`;
const SOURCE={path:'G6-G8-shared/NMS002/L2/TS/L2TS04.swf',bytes:137055,
 sha256:'9cc456a0af745dc31240b3a6d805e8e115c1c1c2725f851fca8e907a767820aa'};
const XML={path:'G6-G8-shared/NMS002/L2/index.xml',bytes:12845,
 sha256:'550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61'};
const SOURCE_AUDIT='output/nms-l02-p057-source-20260927/source-audit.json';
const SOURCE_AUDIT_SHA='4b4ab7a0f1ddb299703add4117036f31b672b309a62bd912804959f81fc88345';
const RAW_AUDIO='output/nms-l02-p057-audio-20260927/raw-index-v1.json';
const RAW_AUDIO_SHA='fb0e0bd403255a7a98fd46c5175f48747f7c840b4c5af08c74c53bbf2d64af71';
const AUDIO='output/nms-l02-p057-audio-20260927/embedded-source-stream-v1.mp3';
const AUDIO_SHA='c87ebf7d1117a616ebddd6b3530a7b19c50dfd885bc5e2734817657da026c2dc';
const GLOSSARY='output/nms-l02-p057-glossary-20260927/conditional-bank.json';
const GLOSSARY_SHA='b651a5d063e4c0c5c9a6f6b73543a643a3af2f5a5e27c8ac51eb6d705da9c365';
const GLOSSARY_RECEIPT='output/nms-l02-p057-glossary-20260927/receipt.json';
const GLOSSARY_RECEIPT_SHA='18d9f328e6e2bda55dde822962c92f4ae726489fb17ea9f7ec133260b329b37f';
const DISPLAY='packages/demos/src/generated/nms-l02-p057-display-list-v1.ts';
const DISPLAY_SHA='9bb7b24295242c3ab6e8a33a288d50da84ab486a3a962ed1995a8dd044c9c8ee';
const TERMS='packages/demos/src/generated/nms-l02-p057-terms-v1.ts';
const TERMS_SHA='177cbcdef722656206b29da8a31a643ef6a3555c13decb5d21ff5b7db2285ee7';
const INPUT_PATHS=[
 MODULE,TIMELINE,
 'packages/demos/src/nms-l02-p057-product-module-v1.tsx',
 'packages/demos/src/nms-l02-p057-product-renderer-v1.tsx',
 'packages/demos/src/nms-l02-p057-product-text-v1.ts',
 'packages/demos/src/nms-l02-p057-semantic-v1.ts',
 'packages/demos/src/timelines/shared-nms002-l02-p057-display-list.ts',
 DISPLAY,TERMS,
 'packages/demos/tests/nms-l02-p057-product-v1.test.tsx',
 'scripts/build-nms-l02-p057-display-list-v1.mjs',
 'scripts/build-nms-l02-p057-display-list-v1.test.mjs',
 'scripts/extract-nms-l02-p057-source-stream-v1.mjs',
 'scripts/extract-nms-l02-p057-source-stream-v1.test.mjs',
 'scripts/generate-nms-l02-p057-glossary-v1.mjs',
 'scripts/generate-nms-l02-p057-glossary-v1.test.mjs',
 'scripts/prepare-nms-l02-p057-dom-artifacts-v1.mjs',
 'scripts/prepare-nms-l02-p057-dom-artifacts-v1.test.mjs',
 SOURCE_AUDIT,'output/nms-l02-p057-source-20260927/README.md',
 RAW_AUDIO,AUDIO,'output/nms-l02-p057-audio-20260927/AUDIO_SOURCE_2026-09-27.md',
 GLOSSARY,GLOSSARY_RECEIPT,
];
const GENERATED=[MODULE,TIMELINE,DISPLAY,TERMS,RAW_AUDIO,AUDIO,GLOSSARY,GLOSSARY_RECEIPT];
// Runtime and common producer dependencies are host-owned. They are pinned in
// both manifests but remain disjoint from this page's own input closure.
const SHARED_DEPENDENCIES=[
 'packages/demos/src/contract.ts',
 'packages/demos/src/lesson-text-contract.ts',
 'packages/demos/src/lesson-text-snapshot.ts',
 'packages/demos/src/source-glossary-controls.tsx',
 'lib/g678-admission-proof.mjs',
 'scripts/private-current-js-registry.mjs',
 'scripts/build-g4-l3-embedded-audio-archive.mjs',
];
const CHECKS=[
 ['scripts/build-nms-l02-p057-display-list-v1.mjs',DISPLAY],
 ['scripts/extract-nms-l02-p057-source-stream-v1.mjs',RAW_AUDIO],
 ['scripts/generate-nms-l02-p057-glossary-v1.mjs',TERMS],
];
const json=value=>Buffer.from(JSON.stringify(value,null,2)+'\n');
const bytePin=(relative,bytes)=>({path:relative,bytes:bytes.length,sha256:sha256(bytes)});
const same=(left,right,label)=>assert.deepStrictEqual(left,right,label);

function verifySource(root){
 assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT,SOURCE_ROOT,'exact real G6-G8 source root');
 assert.equal(fs.realpathSync(SOURCE_ROOT),SOURCE_ROOT,'physical source root');
 assert(fs.lstatSync(SOURCE_ROOT).isDirectory(),'source root directory');
 same(pinFile(SOURCE_ROOT,SOURCE.path),SOURCE,'exact P057 SWF');
 same(pinFile(SOURCE_ROOT,XML.path),XML,'exact lesson XML');
 const auditPin=pinFile(root,SOURCE_AUDIT);
 assert.equal(auditPin.sha256,SOURCE_AUDIT_SHA,'final source audit');
 const audit=readJsonPin(root,auditPin);
 assert.equal(audit.animationId,ID);
 same(audit.source,{path:path.join(SOURCE_ROOT,SOURCE.path),bytes:SOURCE.bytes,sha256:SOURCE.sha256},
  'audited source identity');
 assert.equal(audit.sourceStructure?.teachingSprite,'sprite-66');
 assert.equal(audit.sourceStructure?.teachingFrames,328);
 assert.equal(audit.sourceStructure?.rootBeginFrame,6);
 assert.equal(audit.sourceStructure?.terminalChildStopPresent,false);
 assert(Array.isArray(audit.extraction?.pins)&&audit.extraction.pins.length===88,'finite extracted source audit');
 for(const pin of audit.extraction.pins){
  assert(pin.path.startsWith('output/nms-l02-p057-source-20260927/extraction/'),'bounded extracted input');
  readPin(root,pin);
 }
 const audioPin=pinFile(root,RAW_AUDIO);assert.equal(audioPin.sha256,RAW_AUDIO_SHA);
 const raw=readJsonPin(root,audioPin);
 assert.equal(raw.source.sha256,SOURCE.sha256);
 assert.equal(raw.stream.frameDomain,'sprite-66');
 assert.equal(raw.stream.blockCount,324);
 assert.deepStrictEqual(raw.stream.blockFrameRange,{first:5,last:328,inclusive:true});
 assert.equal(raw.decode.decodedSamples,595008);
 assert.equal(raw.interpretation.originalRuntimeSynchronizationEstablished,false);
 assert.equal(raw.interpretation.audioListeningAccepted,false);
 const audio=pinFile(root,AUDIO);
 assert.equal(audio.sha256,AUDIO_SHA);assert.equal(audio.bytes,134290);
 assert.equal(raw.stream.payload.sha256,AUDIO_SHA);
 const glossaryPin=pinFile(root,GLOSSARY);assert.equal(glossaryPin.sha256,GLOSSARY_SHA);
 const glossary=readJsonPin(root,glossaryPin);
 assert.equal(glossary.animationId,ID);
 assert.equal(glossary.sourceSelection,'identified-indexMI-export-literal-L1-bank-path');
 assert.equal(glossary.originalL2XmlResolved,false);
 assert.equal(glossary.historicalHostAssociationEstablished,false);
 assert.equal(glossary.originalRuntimeLookupVerified,false);
 assert.equal(glossary.terms.length,7);
 assert.equal(pinFile(root,GLOSSARY_RECEIPT).sha256,GLOSSARY_RECEIPT_SHA);
 assert.equal(pinFile(root,DISPLAY).sha256,DISPLAY_SHA);
 assert.equal(pinFile(root,TERMS).sha256,TERMS_SHA);
 return {auditPin,audit,rawAudioPin:audioPin,audioPin:audio,glossaryPin,
  glossaryReceiptPin:pinFile(root,GLOSSARY_RECEIPT)};
}
function checks(root){
 return CHECKS.map(([producer,output])=>{
  const run=spawnSync(process.execPath,[path.join(root,producer),'--check'],{
   cwd:root,env:{...process.env,HELP_MATH_G678_SOURCE_ROOT:SOURCE_ROOT},encoding:'utf8',
   timeout:180000,maxBuffer:1024*1024});
  assert.equal(run.status,0,`${producer} --check: ${String(run.stderr??run.error??'').slice(0,1500)}`);
  return {producer:pinFile(root,producer),output:pinFile(root,output),mode:'--check',exitCode:0};
 });
}
function projectRegistry(root,artifacts){
 const registry=JSON.parse(readPin(root,pinFile(root,'packages/demos/private-current-js-registry.json')));
 const registrations=registry.calibrations.flatMap(row=>row.entries.filter(entry=>entry.key===ID)
  .map(entry=>({calibrationId:row.calibrationId,entry})));
 if(registrations.length){
  assert.equal(registrations.length,1);
  assert.equal(registrations[0].calibrationId,CALIBRATION);
  same(registrations[0].entry.artifacts,artifacts,'existing P057 DOM registration exact');
  return true;
 }
 const fragment={calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:`catalog/product-bridge-calibrations/${CALIBRATION}.json`,
  freezeManifestBytes:1,freezeManifestSha256:'0'.repeat(64),
  entries:[{key:ID,module:`./modules/${ID}`,maturity:'private-current-js',
   complexityLane:'behavior-heavy',artifacts}]};
 const projected=upsertPrivateCurrentJsCalibration(registry,fragment);
 assert(projected.calibrations.some(row=>row.calibrationId===CALIBRATION),'DOM registry shape');
 return true;
}
export function buildP057DomArtifactPlan({root=ROOT}={}){
 assert.equal(fs.realpathSync(root),root,'physical worktree');
 assert(process.env.NODE_ENV!=='production'&&!process.env.VERCEL&&!process.env.VERCEL_ENV,'local engineering only');
 const source=verifySource(root);
 const inputs=uniquePins([...INPUT_PATHS.map(relative=>pinFile(root,relative)),...source.audit.extraction.pins]);
 const sharedDependencies=uniquePins(SHARED_DEPENDENCIES.map(relative=>pinFile(root,relative)));
 assert(sharedDependencies.every(pin=>!inputs.some(item=>item.path===pin.path)),
  'page-owned and host-owned inputs are disjoint');
 const outputs=uniquePins(GENERATED.map(relative=>{
  const pin=inputs.find(item=>item.path===relative);
  assert(pin,`generated output in finite input closure: ${relative}`);return pin;
 }));
 const generatorChecks=checks(root);
 for(const check of generatorChecks){
  same(inputs.find(pin=>pin.path===check.producer.path),check.producer,'checked producer in closure');
  same(outputs.find(pin=>pin.path===check.output.path),check.output,'checked output in closure');
 }
 const acceptanceEffects={originalRuntimeFidelity:false,audioAccepted:false,humanReviewed:false,
  ownerAccepted:false,strictComplete:false,published:false};
 const runManifest={schemaVersion:1,kind:'nms-l02-p057-maintained-dom-source-run-v1',animationId:ID,
  method:'source-locked-public-tool-IR-and-maintained-DOM-integration',
  sourceRoot:SOURCE_ROOT,source:SOURCE,sourceXml:XML,
  sourceStructure:{stage:{width:800,height:600},fps:12,rootFrameCount:10,rootBeginFrame:6,
   rootSpritePlacement:{characterId:66,depth:2,transXTwips:7430,transYTwips:5667},
   frameDomain:'sprite-66',frameCount:328,sourceChildTerminalStopPresent:false,
   productPlaybackMode:'once',productPlaybackEndFrame:328,originalRuntimeParityEstablished:false},
  sourceAudit:source.auditPin,
  sourceAudio:{rawIndex:source.rawAudioPin,payload:source.audioPin,blockCount:324,
   firstBlockFrame:5,lastBlockFrame:328,decodedSamples:595008,
   productModuleAudioRendered:false,sourceAlignmentAccepted:false,listeningAccepted:false},
  glossary:{candidate:source.glossaryPin,receipt:source.glossaryReceiptPin,
   sourceSelection:'identified-indexMI-export-literal-L1-bank-path',
   originalL2XmlResolved:false,historicalHostAssociationEstablished:false,
   originalRuntimeLookupVerified:false},
  generatorChecks,inputs,outputs,sharedDependencies,
  productCalibrationPassed:false,scaleOutAuthorized:false,
  acceptanceEffects};
 const runBytes=json(runManifest),runPin=bytePin(RUN,runBytes);
 const module=inputs.find(pin=>pin.path===MODULE),timeline=inputs.find(pin=>pin.path===TIMELINE);
 const memberManifest={schemaVersion:1,kind:'nms-l02-p057-maintained-dom-member-v1',animationId:ID,
  rendererBindingKind:'maintained-dom-module-v1',source:SOURCE,sourceXml:XML,
  sourceRun:runPin,module,timeline,inputs,outputs,sharedDependencies,
  productCalibrationPassed:false,scaleOutAuthorized:false,acceptanceEffects};
 const memberBytes=json(memberManifest),memberPin=bytePin(MEMBER,memberBytes);
 const artifacts={kind:'maintained-dom-module-v1',module,timeline,memberManifest:memberPin,sourceRun:runPin};
 assert(projectRegistry(root,artifacts),'structural registry projection');
 return {root,runManifest,memberManifest,runPin,memberPin,artifacts,registryShapeAccepted:true,
  outputs:[{path:RUN,bytes:runBytes},{path:MEMBER,bytes:memberBytes}]};
}
export function prepareP057DomArtifacts(plan){
 assert(plan.outputs.every(item=>!fs.existsSync(path.join(plan.root,item.path))),
  'immutable DOM artifacts already exist; use --check');
 for(const item of plan.outputs){
  const file=path.join(plan.root,item.path);fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,item.bytes,{flag:'wx'});
  same(pinFile(plan.root,item.path),bytePin(item.path,item.bytes),'written DOM artifact');
 }
 return {status:'P057_DOM_ARTIFACTS_PREPARED_UNREGISTERED',artifacts:plan.artifacts,
  registryShapeAccepted:true,registrationEffect:'none',acceptanceEffect:'none'};
}
export function checkP057DomArtifacts(plan){
 for(const item of plan.outputs)same(readPin(plan.root,bytePin(item.path,item.bytes)),item.bytes,
  `${item.path} manifest drift`);
 return {status:'P057_DOM_ARTIFACTS_CHECKED_UNREGISTERED',artifacts:plan.artifacts,
  registryShapeAccepted:true,registrationEffect:'none',acceptanceEffect:'none'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===SCRIPT){
 try{
  assert(process.argv.length===3&&['--dry-run','--prepare','--check'].includes(process.argv[2]),
   'use --dry-run, --prepare or --check');
  const plan=buildP057DomArtifactPlan();
  const result=process.argv[2]==='--prepare'?prepareP057DomArtifacts(plan):
   process.argv[2]==='--check'?checkP057DomArtifacts(plan):
   {status:'P057_DOM_ARTIFACTS_DRY_RUN_UNREGISTERED',artifacts:plan.artifacts,
    inputCount:plan.runManifest.inputs.length,outputCount:plan.runManifest.outputs.length,
    registryShapeAccepted:true,registrationEffect:'none',acceptanceEffect:'none'};
  console.log(JSON.stringify(result));
 }catch(error){console.error(error.stack??error);process.exitCode=1;}
}
