import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,uniquePins} from './g678-admission-proof.mjs';
import {buildP058Packet} from '../scripts/prepare-nms-l02-p058-admission.mjs';
import * as S from './nms-l02-p058-admission-semantics.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function fixture(){
 const own=uniquePins(S.P058_PAGE_INPUT_PATHS.map(relative=>pinFile(root,relative)));
 const packet=buildP058Packet({pins:own,artifacts:{kind:'maintained-dom-module-v1',
  module:S.P058_CANONICAL_MODULE,timeline:S.P058_CANONICAL_TIMELINE,
  sourceRun:S.P058_RUN,memberManifest:S.P058_MEMBER}});
 const freeze={path:`catalog/product-bridge-calibrations/${S.P058_ADMISSION_CALIBRATION}.json`,
  bytes:1,sha256:'a'.repeat(64)};
 const fragment={path:freeze.path.replace(/\.json$/u,'.fragment.json'),bytes:1,
  sha256:'b'.repeat(64)};
 const registration={calibrationId:S.P058_ADMISSION_CALIBRATION,deploymentScope:'local-only',
  freezeManifest:freeze.path,freezeManifestBytes:freeze.bytes,
  freezeManifestSha256:freeze.sha256,entries:[packet.entry]};
 return {schemaVersion:1,kind:'nms-l02-page-proof-v1',
  hostContract:'nms-l02-source-bound-host-v1',animationId:S.P058_ADMISSION_ID,
  packet,freeze,registration,files:uniquePins([...own,freeze,fragment]),
  external:S.P058_EXTERNAL_EXPECTED};
}
test('P058 frozen DOM run, exact page/host/external closure and qualified semantics',()=>{
 const proof=fixture();
 assert.equal(S.P058_RUN_INPUTS.length,57);
 assert.equal(S.P058_RUN_OUTPUTS.length,13);
 assert.equal(S.P058_PAGE_INPUT_PATHS.length,66);
 assert.equal(S.P058_SHARED_DEPENDENCIES.length,7);
 assert.equal(S.P058_EXTERNAL_EXPECTED.length,8);
 assert.equal(S.validateP058ProofClosure(proof),true);
 assert.deepStrictEqual(proof.packet.selectedPages[0].runtime.frameDomain,'sprite-37');
 assert.equal(proof.packet.selectedPages[0].runtime.frameCount,274);
 assert.equal(proof.packet.entry.artifacts.kind,'maintained-dom-module-v1');
 assert(Object.values(proof.packet.acceptanceEffects).every(value=>value===false));
});
test('seven occurrences retain six keys and transient duplicate Show is frame 242 only',()=>{
 const controls=S.P058_CONTROL_POLICY.controls;
 assert.equal(controls.length,7);
 assert.equal(new Set(controls.map(control=>control.entryId)).size,6);
 assert.deepStrictEqual(controls.filter(control=>control.entryId==='show'),[
  {id:'sprite-37/depth-41/generation-1',entryId:'show',sourceKeyAttribute:'Show',
   characterId:33,firstPlacedFrame:237,firstFrame:242,lastFrameExclusive:275},
  {id:'sprite-37/depth-45/generation-1',entryId:'show',sourceKeyAttribute:'Show',
   characterId:36,firstPlacedFrame:242,firstFrame:242,lastFrameExclusive:243},
 ]);
 assert.deepStrictEqual(S.P058_CONTROL_POLICY.spanishShowLabelCollisionWith,['Display']);
 assert.equal(S.P058_CONTROL_POLICY.historicalSpanishLabelLookupResolved,false);
 const proof=fixture();
 assert.equal(proof.packet.glossary.historicalSpanishLabelLookupResolved,false);
 assert.equal(proof.packet.glossary.modernSelectionByExactScreenkeyTerm,true);
 assert.deepStrictEqual(proof.packet.glossary.spanishShowLabelCollisionWith,['Display']);
});
test('coordinated run/input aliases and unsupported renderer/acceptance claims fail closed',()=>{
 for(const change of [
  p=>{p.packet.integrity.files.find(x=>x.path===S.P058_CANONICAL_MODULE.path).sha256='f'.repeat(64);
   p.packet.entry.artifacts.module.sha256='f'.repeat(64);},
  p=>{p.packet.integrity.files.find(x=>x.path===S.P058_CANONICAL_TIMELINE.path).sha256='f'.repeat(64);
   p.packet.entry.artifacts.timeline.sha256='f'.repeat(64);},
  p=>{p.packet.integrity.files.find(x=>x.path==='packages/demos/src/nms-l02-p058-product-renderer-v1.tsx').sha256='f'.repeat(64);},
  p=>{p.packet.integrity.files.find(x=>x.path==='packages/demos/src/generated/nms-l02-p058-display-list-v1.ts').sha256='f'.repeat(64);},
  p=>{p.packet.integrity.sharedDependencies[0].sha256='f'.repeat(64);},
  p=>{p.packet.entry.artifacts.canvasRenderer={url:'fake-canvas'};},
  p=>{p.packet.audio.sourceAlignmentAccepted=true;},
  p=>{p.packet.acceptanceEffects.originalRuntimeFidelity=true;},
 ]){const proof=structuredClone(fixture());change(proof);
  assert.throws(()=>S.validateP058ProofClosure(proof),/NMS_L02_P058_ADMISSION/u);}
});
test('missing source/bank/host pins, sparse closure, or Show lifetime drift fail closed',()=>{
 for(const change of [
  p=>p.packet.integrity.files.pop(),
  p=>p.files.pop(),
  p=>p.external.pop(),
  p=>p.external.splice(p.external.findIndex(x=>x.pin.path==='L1KTE01.xml'),1),
  p=>p.external.splice(p.external.findIndex(x=>x.pin.path==='frame_35/DoAction.as'),1),
  p=>p.packet.glossary.controlPolicy.controls[6].lastFrameExclusive=275,
  p=>p.packet.glossary.spanishShowLabelCollisionWith=[],
  p=>p.packet.glossary.historicalSpanishLabelLookupResolved=true,
  p=>p.packet.audio.lessonSaSubstituted=true,
  p=>p.packet.productCalibrationPassed=true,
 ]){const proof=structuredClone(fixture());change(proof);
  assert.throws(()=>S.validateP058ProofClosure(proof),/NMS_L02_P058_ADMISSION/u);}
});
