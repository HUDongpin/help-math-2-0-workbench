import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {pinFile} from './g678-admission-proof.mjs';
import * as S from './nms-l02-p061-admission-semantics.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dummy=path=>({path,bytes:1,sha256:'a'.repeat(64)});
function fixture(){
 const entry={key:S.P061_ADMISSION_ID,module:`./modules/${S.P061_ADMISSION_ID}`,
  maturity:'private-current-js',complexityLane:'behavior-heavy',artifacts:{
   kind:'maintained-dom-module-v1',module:S.P061_REVIEWED_DOM_SEAL.module,
   timeline:S.P061_REVIEWED_DOM_SEAL.timeline,
   sourceRun:S.P061_REVIEWED_DOM_SEAL.run,memberManifest:S.P061_REVIEWED_DOM_SEAL.member,
  }};
 const freeze=dummy(S.P061_FREEZE_PATH);
 const packet={schemaVersion:1,calibrationId:S.P061_ADMISSION_CALIBRATION,
  sourceRoot:S.P061_SOURCE_ROOT,scope:'private-engineering',deploymentScope:'local-only',
  source:S.P061_SOURCE,sourceXml:S.P061_XML,selectedPages:[{
   animationId:S.P061_ADMISSION_ID,placementId:S.P061_ADMISSION_ID,
   assetId:`swf-${S.P061_SOURCE.sha256}`,stableLessonKey:'shared-nms002-l02',
   sourceSha256:S.P061_SOURCE.sha256,moduleCode:'NMS002',lessonNumber:2,
   globalPageOrdinal:61,sourceOccurrence:61,sectionCode:'TS',sectionPageOrdinal:7,
   complexityLane:'behavior-heavy',runtime:S.P061_RUNTIME,
  }],entry,audio:S.P061_AUDIO,glossary:S.P061_GLOSSARY,
  integrity:{scope:'single-NMS-L02-P061-source-and-implementation',
   completeTransitiveClosure:false,sharedDependencies:S.P061_SHARED_DEPENDENCIES},
  productCalibrationPassed:false,scaleOutAuthorized:false,
  acceptanceEffects:Object.fromEntries(S.P061_ACCEPTANCE_KEYS.map(key=>[key,false])),
  freezeManifest:freeze};
 const registration={calibrationId:S.P061_ADMISSION_CALIBRATION,deploymentScope:'local-only',
  freezeManifest:S.P061_FREEZE_PATH,freezeManifestBytes:freeze.bytes,
  freezeManifestSha256:freeze.sha256,entries:[entry]};
 return {packet,registration};
}

test('P061 source pins, audio domains, seven source controls and external custody match current receipts',()=>{
 const audio=JSON.parse(readFileSync(path.join(root,S.P061_AUDIO_RECEIPT.path)));
 const glossary=JSON.parse(readFileSync(path.join(root,S.P061_GLOSSARY_CANDIDATE.path)));
 assert.equal(S.P061_SOURCE_AUDIO_PAYLOADS.length,11);
 assert.deepEqual(S.P061_SOURCE_AUDIO_PAYLOADS,audio.streams.map(stream=>stream.payload));
 assert.deepEqual(S.P061_CONTROL_POLICY.controls,glossary.occurrences);
 assert.deepEqual(S.P061_CONTROL_POLICY.controls.map(item=>item.spriteId),[111,314,314,314,314,314,315]);
 assert.equal(new Set(S.P061_CONTROL_POLICY.controls.map(item=>item.entryId)).size,6);
 assert.deepEqual(S.P061_GLOSSARY.descriptorPredecessor,{
  registeredAnimationCount:59,glossaryCount:20,pageCount:64,
  previousPlacementId:'shared-nms002-l02-p060',nextPlacementId:'shared-nms002-l02-p062',
  newGlossaryIds:['equivalent-decimal','express','denominator','percent','equivalent-fraction'],
  reusedGlossaryIds:['decimal-fraction'],resultingGlossaryCount:25,
 });
 assert.equal(S.P061_AUDIO.decodedSamples,1590336);
 assert.deepEqual(S.P061_RUNTIME.sourceStops,[435,573,700,817,860,879]);
 assert.equal(S.P061_RUNTIME.frameCount,882);
 assert.equal(S.P061_RUNTIME.livePlaybackEndFrame,879);
 assert.equal(S.P061_EXTERNAL_EXPECTED.length,10);
 for(const pin of [S.P061_SOURCE_AUDIT,S.P061_BEHAVIOR_AUDIT,S.P061_RAW_AUDIO,
  S.P061_AUDIO_RECEIPT,S.P061_GLOSSARY_CANDIDATE,S.P061_GLOSSARY_RECEIPT,
  S.P061_GLOSSARY_PRODUCT,...S.P061_SOURCE_AUDIO_PAYLOADS])
  assert.deepEqual(pinFile(root,pin.path),pin);
 assert(S.P061_EXTERNAL_EXPECTED.some(item=>item.root===S.P061_SOURCE_ROOT&&
  item.pin.sha256===S.P061_SOURCE.sha256));
 for(const item of S.P061_EXTERNAL_EXPECTED)
  assert.deepEqual(pinFile(item.root,item.pin.path),item.pin);
});

test('reviewed DOM seal accepts exact packet and excludes canvas artifact',()=>{
 const {packet,registration}=fixture();
 assert.equal(S.P061_SEAL_STATUS,'reviewed-dom-run-sealed');
 assert.equal(S.P061_RUN_INPUTS.length,179);
 assert.equal(S.P061_RUN_OUTPUTS.length,22);
 assert.equal(S.P061_SHARED_DEPENDENCIES.length,6);
 assert.equal(S.P061_PAGE_INPUT_PATHS.length,188);
 assert.deepEqual(Object.keys(packet.entry.artifacts).sort(),
  ['kind','memberManifest','module','sourceRun','timeline']);
 assert(Object.values(packet.acceptanceEffects).every(value=>value===false));
 assert.equal(S.validateP061AdmissionSemantics(packet,registration),true);
});

test('source, placement, audio, glossary, seal, registration, and acceptance drift reject',()=>{
 for(const change of [
  f=>{f.packet.source.sha256='f'.repeat(64);},
  f=>{f.packet.selectedPages[0].runtime.sourceStops[0]=434;},
  f=>{f.packet.selectedPages[0].runtime.livePlaybackEndFrame=882;},
  f=>{f.packet.selectedPages[0].globalPageOrdinal=60;},
  f=>{f.packet.audio.payloads.pop();},
  f=>{f.packet.audio.lessonSaSubstituted=true;},
  f=>{f.packet.glossary.controlPolicy.controls.pop();},
  f=>{f.packet.glossary.historicalHostAssociationEstablished=true;},
  f=>{f.packet.acceptanceEffects.fidelityAccepted=true;},
  f=>{f.packet.entry.artifacts.canvasRenderer={url:'/fake.js'};},
  f=>{f.packet.entry.artifacts.sourceRun.sha256='f'.repeat(64);},
  f=>{f.packet.integrity.sharedDependencies.pop();},
  f=>{f.registration.deploymentScope='public';},
 ]){
  const candidate=structuredClone(fixture());change(candidate);
  assert.throws(()=>S.validateP061AdmissionSemantics(candidate.packet,candidate.registration),
   /NMS_L02_P061_ADMISSION/u);
 }
});

test('proof identity rejects wrong host contract',()=>{
 const {packet,registration}=fixture();
 const proof={schemaVersion:1,kind:'nms-l02-page-proof-v1',
  hostContract:'wrong-host',animationId:S.P061_ADMISSION_ID,
  packet,registration,freeze:packet.freezeManifest};
 assert.throws(()=>S.validateP061ProofClosure(proof),/page proof identity/u);
});
