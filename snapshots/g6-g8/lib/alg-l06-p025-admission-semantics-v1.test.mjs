import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readJsonPin,uniquePins} from './g678-admission-proof.mjs';
import {ACCEPTANCE,BINDING,CALIBRATION,ENGINEERING_RECEIPT_PATH,FREEZE_PATH,ID,PROOF_PATH,SA,SOURCE,
 SOURCE_ROOT,XML,p025ProposedEntry,p025Runtime,proposedP025Artifacts,
 readP025CanonicalSource,validateP025Admission,validateP025SourcePacket,
 validateP025Page} from './alg-l06-p025-admission-semantics-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const core=item=>({path:item.path,bytes:item.bytes,sha256:item.sha256});

function fixture(source){
 const entry=p025ProposedEntry(root,source),freezeManifest={path:FREEZE_PATH,bytes:100,
  sha256:'a'.repeat(64)};
 const packet={schemaVersion:1,calibrationId:CALIBRATION,sourceRoot:SOURCE_ROOT,
  scope:'private-engineering',deploymentScope:'local-only',source:SOURCE,sourceXml:XML,
  selectedPages:[{animationId:ID,placementId:ID,assetId:`swf-${SOURCE.sha256}`,
   sourceSha256:SOURCE.sha256,moduleCode:'ALG001',lessonNumber:6,
   globalPageOrdinal:25,sourceOccurrence:25,sectionCode:'VB',sectionPageOrdinal:15,
   complexityLane:'interactive-understood',runtime:p025Runtime(entry.artifacts)}],entry,
  continuousSource:{audit:source.binding.audio,plan:source.binding.audioPlan,
   browserDecode:source.binding.browserDecode,mainFrameDomain:'sprite-21',
   mainFrames:299,mainAsset:core(source.audioPlan.main.asset.source),
   firstBlockFrame:2,lastBlockFrame:299,zeroPayloadFrame:3,
   initialSeekSamples:1673,browserDecodedSamples:547200,
   browserPcmSha256:source.audioPlan.main.asset.browserPcmSha256,
   visualTailFrames:0.11455782312924612,oneContinuousStream:true,
   concatenated:false,originalRuntimeAccepted:false,listeningAccepted:false,
   audioAccepted:false},
  optionalSpanishAudio:{source:SA,asset:core(source.audioPlan.optionalSpanishAudio.source),
   browserDecodedSamples:593280,
   browserPcmSha256:source.audioPlan.optionalSpanishAudio.browserPcmSha256,
   trigger:'explicit-user-only',localeAutoplay:false,mainStreamSpliced:false,
   audioAccepted:false},
  nativeTextSource:{state:source.binding.native,frameDomain:'sprite-21',
   frames:299,staticTextDefinitions:8,suppressibleTextIds:[5,15],
   sourceEnglishFallback:true,originalRuntimeAccepted:false},
  glossaryActions:source.glossary,
  integrity:{completeTransitiveClosure:false,files:source.localInputs},
  acceptanceEffects:ACCEPTANCE,productCalibrationPassed:false,
  scaleOutAuthorized:false,freezeManifest};
 const registration={calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:FREEZE_PATH,freezeManifestBytes:100,
  freezeManifestSha256:'a'.repeat(64),entries:[entry]};
 return {packet,registration};
}

test('P025 v5 source lock binds 123 local, five physical pins and exact staged Canvas',()=>{
 const source=readP025CanonicalSource(root);
 assert.equal(source.binding.files.length,123);
 assert.equal(source.binding.external.length,5);
 assert.equal(source.localInputs.length,124);
 assert.deepEqual(source.binding.source,SOURCE);
 assert.deepEqual(source.artifacts,proposedP025Artifacts(root,source.canvasManifest));
 assert.deepEqual(source.geometry.masks.map(row=>[row.frame,row.depth,row.clipDepth,row.characterId]),
  [[2,1,10,2],[52,11,16,2]]);
 assert.deepEqual(source.geometry.textDefinitions.map(row=>row.characterId),
  [5,10,11,12,13,15,18,20]);
 assert.deepEqual(Object.keys(source.glossary),
  ['Independent variable','Function','Input variable','Domain']);
 assert.deepEqual(Object.values(source.glossary).map(row=>row.firstReadyFrame),
  [28,50,41,295]);
 assert.equal(source.glossary['Independent variable'].entryId,'independent-variable');
 assert.equal(source.crosswalk.expectedNextGlossaryCount,39);
 assert.equal(BINDING.path,'output/alg-l06-p025-host-prep-v1/candidate-source-binding-v5.json');
 assert.equal(PROOF_PATH,`work/g678-workflow/candidates/${ID}-proof-v1.json`);
});

test('P025 proposed serialized packet semantics admit one continuous main and explicit separate SA',()=>{
 const source=readP025CanonicalSource(root),{packet,registration}=fixture(source);
 assert.equal(validateP025SourcePacket(packet,registration,root),true);
 assert.equal(packet.selectedPages[0].runtime.frameCount,299);
 assert.equal(packet.continuousSource.initialSeekSamples,1673);
 assert.equal(packet.continuousSource.visualTailFrames,0.11455782312924612);
 assert.equal(packet.optionalSpanishAudio.mainStreamSpliced,false);
 assert.equal(source.browserDecode.sourceNodesCreated,0);
});

test('P025 rejects temporal, audio and native-source semantic drift',()=>{
 const source=readP025CanonicalSource(root),{packet,registration}=fixture(source);
 for(const [label,mutate] of [
  ['main frame',p=>{p.selectedPages[0].runtime.frameCount=298;}],
  ['main seek',p=>{p.continuousSource.initialSeekSamples=0;}],
  ['visual tail',p=>{p.continuousSource.visualTailFrames=0;}],
  ['browser PCM',p=>{p.continuousSource.browserPcmSha256='0'.repeat(64);}],
  ['SA locale autoplay',p=>{p.optionalSpanishAudio.localeAutoplay=true;}],
  ['SA splice',p=>{p.optionalSpanishAudio.mainStreamSpliced=true;}],
  ['unaudited glyph suppression',p=>{p.nativeTextSource.suppressibleTextIds.push(10);}],
  ['translated source claim',p=>{p.nativeTextSource.sourceEnglishFallback=false;}],
  ['late Domain gate',p=>{p.glossaryActions.Domain.firstReadyFrame=294;}],
 ]){
  const bad=structuredClone(packet);mutate(bad);
  assert.throws(()=>validateP025SourcePacket(bad,registration,root),/deep-equal/,
   `${label} must fail`);
 }
});

test('P025 rejects source, registration, downstream claim and evidence-closure drift',()=>{
 const source=readP025CanonicalSource(root),{packet,registration}=fixture(source);
 const wrongSource=structuredClone(packet);
 wrongSource.source.sha256='0'.repeat(64);
 assert.throws(()=>validateP025SourcePacket(wrongSource,registration,root),/deep-equal/);
 const claim=structuredClone(packet);
 claim.acceptanceEffects={...claim.acceptanceEffects,listeningAccepted:true};
 assert.throws(()=>validateP025SourcePacket(claim,registration,root),/deep-equal/);
 const missingInput=structuredClone(packet);
 missingInput.integrity.files=missingInput.integrity.files.filter(row=>row.path!==BINDING.path);
 assert.throws(()=>validateP025SourcePacket(missingInput,registration,root),/current P025 producer input/);
 const registryInput=structuredClone(packet);
 registryInput.integrity.files.push({path:'packages/demos/private-current-js-registry.json',
  bytes:1,sha256:'0'.repeat(64)});
 assert.throws(()=>validateP025SourcePacket(registryInput,registration,root),/registration-dependent P025 evidence/);
 const changedRegistration=structuredClone(registration);
 changedRegistration.entries[0].artifacts.runtime.sha256='0'.repeat(64);
 assert.throws(()=>validateP025SourcePacket(packet,changedRegistration,root),/deep-equal/);
});

test('P025 admission reader rejects missing and fake browser receipt pins',()=>{
 const source=readP025CanonicalSource(root),{packet,registration}=fixture(source);
 assert.throws(()=>validateP025Admission(packet,registration,root),
  /exact P025 engineering receipt required/);
 assert.throws(()=>validateP025Page(packet,registration,root),
  /exact P025 engineering receipt required/);
 const wrongPath=structuredClone(packet);
 wrongPath.engineeringReceipt={path:'output/playwright/alg-l06-p025-host-v3/engineering-receipt-v1.json',
  bytes:1,sha256:'0'.repeat(64)};
 assert.throws(()=>validateP025Admission(wrongPath,registration,root),
  /exact P025 engineering receipt required/);
 const fake=structuredClone(packet);
 fake.engineeringReceipt={path:ENGINEERING_RECEIPT_PATH,bytes:1,sha256:'0'.repeat(64)};
 assert.throws(()=>validateP025Admission(fake,registration,root),
  /engineering receipt in proof integrity/);
 fake.integrity.files.push(fake.engineeringReceipt);
 assert.throws(()=>validateP025Admission(fake,registration,root),
  /ENOENT|current bytes/);
});

test('P025 strong reader replays the real v4 receipt and rejects missing raw artifacts',()=>{
 const source=readP025CanonicalSource(root),{packet,registration}=fixture(source);
 const receiptPin=pinFile(root,ENGINEERING_RECEIPT_PATH),
  receipt=readJsonPin(root,receiptPin);
 packet.engineeringReceipt=receiptPin;
 packet.integrity.files=uniquePins([...packet.integrity.files,receiptPin,
  ...receipt.artifacts]);
 assert.equal(validateP025Admission(packet,registration,root),true);
 const raw=receipt.artifacts.find(pin=>pin.path!==receipt.casesPin.path);
 assert(raw,'at least one independent raw artifact');
 for(const missing of [raw,receipt.casesPin]){
  const bad=structuredClone(packet);
  bad.integrity.files=bad.integrity.files.filter(pin=>pin.path!==missing.path);
  assert.throws(()=>validateP025Admission(bad,registration,root),
   /engineering artifact in proof integrity/,missing.path);
 }
});
