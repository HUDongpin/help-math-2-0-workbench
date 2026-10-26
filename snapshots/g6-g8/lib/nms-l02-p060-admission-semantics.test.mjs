import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,uniquePins} from './g678-admission-proof.mjs';
import {buildP060Packet} from '../scripts/prepare-nms-l02-p060-admission.mjs';
import * as S from './nms-l02-p060-admission-semantics.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function fixture(){
 const own=uniquePins(S.P060_PAGE_INPUT_PATHS.map(relative=>pinFile(root,relative)));
 const packet=buildP060Packet({pins:own,artifacts:{kind:'maintained-dom-module-v1',
  module:S.P060_CANONICAL_MODULE,timeline:S.P060_CANONICAL_TIMELINE,
  sourceRun:S.P060_RUN,memberManifest:S.P060_MEMBER}});
 const freeze={path:`catalog/product-bridge-calibrations/${S.P060_ADMISSION_CALIBRATION}.json`,
  bytes:1,sha256:'a'.repeat(64)};
 const fragment={path:freeze.path.replace(/\.json$/u,'.fragment.json'),bytes:1,
  sha256:'b'.repeat(64)};
 const registration={calibrationId:S.P060_ADMISSION_CALIBRATION,deploymentScope:'local-only',
  freezeManifest:freeze.path,freezeManifestBytes:freeze.bytes,
  freezeManifestSha256:freeze.sha256,entries:[packet.entry]};
 return {schemaVersion:1,kind:'nms-l02-page-proof-v1',
  hostContract:'nms-l02-source-bound-host-v1',animationId:S.P060_ADMISSION_ID,
  packet,freeze,registration,files:uniquePins([...own,freeze,fragment]),
  external:S.P060_EXTERNAL_EXPECTED};
}
test('P060 frozen DOM run, exact page/host/external closure and qualified semantics',()=>{
 const proof=fixture();
 assert.equal(S.P060_RUN_INPUTS.length,216);
 assert.equal(S.P060_RUN_OUTPUTS.length,20);
 assert.equal(S.P060_PAGE_INPUT_PATHS.length,225);
 assert.equal(S.P060_SHARED_DEPENDENCIES.length,6);
 assert.equal(S.P060_EXTERNAL_EXPECTED.length,10);
 assert.equal(S.validateP060ProofClosure(proof),true);
 for(const pin of [S.P060_SOURCE,S.P060_XML])
  assert(proof.external.some(item=>item.root===S.P060_SOURCE_ROOT&&
   JSON.stringify(item.pin)===JSON.stringify(pin))); 
 assert.deepStrictEqual(proof.packet.selectedPages[0].runtime.frameDomain,'sprite-391');
 assert.equal(proof.packet.selectedPages[0].runtime.frameCount,721);
 assert.equal(proof.packet.entry.artifacts.kind,'maintained-dom-module-v1');
 assert(Object.values(proof.packet.acceptanceEffects).every(value=>value===false));
});
test('16 placements retain eight parsed-label keys across main, picture and hint',()=>{
 const controls=S.P060_CONTROL_POLICY.controls;
 assert.equal(controls.length,16);assert.equal(new Set(controls.map(row=>row.entryId)).size,8);
 assert.deepEqual([139,388,391].map(id=>controls.filter(row=>row.spriteId===id).length),[4,5,7]);
 const proof=fixture();
 assert.equal(proof.packet.glossary.modernSelectionByScreenkeyTerm,false);
 assert.equal(proof.packet.glossary.conditionalModernLabelResolutionReviewed,true);
 assert.equal(proof.packet.glossary.historicalHostAssociationEstablished,false);
 assert.equal(proof.packet.audio.payloads.length,11);
 assert.equal(proof.packet.audio.decodedSamples,1289088);
 assert.equal(proof.packet.selectedPages[0].runtime.livePlaybackEndFrame,718);
});
test('coordinated run/input aliases and unsupported renderer/acceptance claims fail closed',()=>{
 for(const change of [
  p=>{p.packet.integrity.files.find(x=>x.path===S.P060_CANONICAL_MODULE.path).sha256='f'.repeat(64);
   p.packet.entry.artifacts.module.sha256='f'.repeat(64);},
  p=>{p.packet.integrity.files.find(x=>x.path===S.P060_CANONICAL_TIMELINE.path).sha256='f'.repeat(64);
   p.packet.entry.artifacts.timeline.sha256='f'.repeat(64);},
  p=>{p.packet.integrity.files.find(x=>x.path==='packages/demos/src/nms-l02-p060-product-renderer-v1.tsx').sha256='f'.repeat(64);},
  p=>{p.packet.integrity.files.find(x=>x.path==='packages/demos/src/generated/nms-l02-p060-display-list-v1.ts').sha256='f'.repeat(64);},
  p=>{p.packet.integrity.sharedDependencies[0].sha256='f'.repeat(64);},
  p=>{p.packet.entry.artifacts.canvasRenderer={url:'fake-canvas'};},
  p=>{p.packet.audio.sourceAlignmentAccepted=true;},
  p=>{p.packet.acceptanceEffects.originalRuntimeFidelity=true;},
 ]){const proof=structuredClone(fixture());change(proof);
  assert.throws(()=>S.validateP060ProofClosure(proof),/NMS_L02_P060_ADMISSION/u);}
});
test('missing source/bank/host pins, sparse closure, or source placement drift fail closed',()=>{
 for(const change of [
  p=>p.packet.integrity.files.pop(),
  p=>p.files.pop(),
  p=>p.external.pop(),
  p=>p.external.splice(p.external.findIndex(x=>x.pin.path==='L1KTE01.xml'),1),
  p=>p.external.splice(p.external.findIndex(x=>x.pin.path==='DoAction.as'),1),
  p=>p.packet.glossary.controlPolicy.controls[6].lastFrameExclusive=275,
  p=>p.packet.audio.payloads.pop(),
  p=>p.packet.glossary.historicalHostAssociationEstablished=true,
  p=>p.packet.audio.lessonSaSubstituted=true,
  p=>p.packet.productCalibrationPassed=true,
 ]){const proof=structuredClone(fixture());change(proof);
  assert.throws(()=>S.validateP060ProofClosure(proof),/NMS_L02_P060_ADMISSION/u);}
});
