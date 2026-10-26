import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,uniquePins} from './g678-admission-proof.mjs';
import {buildP056Packet} from '../scripts/prepare-nms-l02-p056-admission.mjs';
import * as S from './nms-l02-p056-admission-semantics.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function fixture(){
 const own=uniquePins(S.P056_PAGE_INPUT_PATHS.map(relative=>pinFile(root,relative)));
 const artifacts={kind:'maintained-dom-module-v1',
  module:own.find(pin=>pin.path===`packages/demos/src/modules/${S.P056_ADMISSION_ID}.tsx`),
  timeline:own.find(pin=>pin.path===`packages/demos/src/timelines/${S.P056_ADMISSION_ID}.ts`),
  sourceRun:S.P056_RUN,memberManifest:S.P056_MEMBER};
 const packet=buildP056Packet({pins:own,artifacts});
 // Synthetic envelope is confined to this pure semantic test, never persisted.
 const freeze={path:`catalog/product-bridge-calibrations/${S.P056_ADMISSION_CALIBRATION}.json`,bytes:1,sha256:'a'.repeat(64)};
 const fragment={...freeze,path:freeze.path.replace(/\.json$/u,'.fragment.json'),sha256:'b'.repeat(64)};
 const registration={calibrationId:S.P056_ADMISSION_CALIBRATION,deploymentScope:'local-only',
  freezeManifest:freeze.path,freezeManifestBytes:freeze.bytes,freezeManifestSha256:freeze.sha256,entries:[packet.entry]};
 return {schemaVersion:1,kind:'nms-l02-page-proof-v1',hostContract:'nms-l02-source-bound-host-v1',
  animationId:S.P056_ADMISSION_ID,packet,freeze,registration,files:uniquePins([...own,freeze,fragment]),
  external:[...S.P056_EXTERNAL_EXPECTED].sort((a,b)=>a.root.localeCompare(b.root)||a.pin.path.localeCompare(b.pin.path))};
}
test('P056 DOM proof matches actual source product pins and leaves all acceptance false',()=>{
 const proof=fixture();assert.equal(S.validateP056ProofClosure(proof),true);
 assert.equal(proof.packet.entry.artifacts.kind,'maintained-dom-module-v1');
 assert.equal(proof.packet.selectedPages[0].runtime.sourceChildTerminalStopPresent,false);
});
test('P056 rejects predecessor canvas, incorrect frames, glossary substitution, and acceptance escalation',()=>{
 const changes=[
  p=>p.packet.selectedPages[0].runtime.frameCount=351,
  p=>p.packet.selectedPages[0].runtime.frameDomain='sprite-26',
  p=>p.packet.selectedPages[0].globalPageOrdinal=55,
  p=>p.packet.selectedPages[0].runtime.canvasRenderer={url:'predecessor.js'},
  p=>p.packet.selectedPages[0].runtime.sourceChildTerminalStopPresent=true,
  p=>p.packet.entry.artifacts.runtime=p.packet.entry.artifacts.module,
  p=>p.packet.entry.artifacts.sourceRun.sha256='c'.repeat(64),
  // Fixture aliases module/timeline pins across packet, proof and registration.
  // This coordinated replacement must still conflict with the pinned member.
  p=>p.packet.entry.artifacts.module.sha256='c'.repeat(64),
  p=>p.packet.entry.artifacts.timeline.sha256='d'.repeat(64),
  p=>p.packet.audio.decodedSamples=637056,
  p=>p.packet.audio.localeAutoPlayback=true,
  p=>p.packet.audio.lessonSaSubstituted=true,
  p=>p.packet.glossary.controlPolicy.modernInteractiveFirstFrame=9,
  p=>p.packet.glossary.controlPolicy.controls[0].sourceKeyAttribute='Restate',
  p=>p.packet.glossary.originalL2XmlResolved=true,
  p=>p.packet.acceptanceEffects.audioAccepted=true,
  p=>p.packet.acceptanceEffects.extra=true,
  p=>p.packet.productCalibrationPassed=true,
  p=>p.registration.deploymentScope='production',
 ];
 const original=fixture();
 for(const change of changes){const proof=structuredClone(original);change(proof);
  assert.throws(()=>S.validateP056ProofClosure(proof),/NMS_L02_P056_ADMISSION/);}
});
test('P056 finite proof rejects missing, duplicate, foreign and changed owned/external pins',()=>{
 const original=fixture();
 for(const change of [
  p=>p.packet.integrity.files.pop(),p=>p.files.pop(),p=>p.external.pop(),
  p=>p.files.push(p.files[0]),p=>p.external[0].pin.sha256='d'.repeat(64),
  p=>p.packet.integrity.files[0]={...p.packet.integrity.files[0],sha256:'e'.repeat(64)},
  p=>p.packet.integrity.files.find(pin=>pin.path==='packages/demos/src/nms-l02-p056-product-renderer-v1.tsx').sha256='f'.repeat(64),
  p=>p.packet.integrity.files.find(pin=>pin.path==='packages/demos/src/generated/nms-l02-p056-symbol-art-v1.ts').sha256='f'.repeat(64),
  p=>p.packet.integrity.files[0].path='apps/web/lib/nms-l02-source-resource-host.ts',
 ]){const proof=structuredClone(original);change(proof);
  assert.throws(()=>S.validateP056ProofClosure(proof),/NMS_L02_P056_ADMISSION/);}
});
