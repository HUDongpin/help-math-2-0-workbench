import test from 'node:test';
import assert from 'node:assert/strict';
import {readJsonPin} from './g678-admission-proof.mjs';
import * as V1 from './alg-l06-p008-admission-semantics-v1.mjs';
import * as V2 from './alg-l06-p008-admission-semantics-v2.mjs';

test('P008 Replay adapter successor preserves v1 and keeps acceptance false',()=>{
 const root=process.cwd(),previous=readJsonPin(root,V2.PREVIOUS_PROOF);
 assert.deepEqual(previous.packet.freezeManifest,V2.PREVIOUS_FREEZE);
 assert.equal(previous.packet.calibrationId,V1.CALIBRATION);
 const packet=structuredClone(previous.packet);
 const old=packet.integrity.files.findIndex(pin=>pin.path===V2.CURRENT_ADAPTER.path);
 assert(old>=0);packet.integrity.files.splice(old,1,V2.CURRENT_ADAPTER);
 packet.integrity.files.push(V2.PREVIOUS_PROOF,V2.PREVIOUS_FREEZE,V2.PREVIOUS_ADAPTER,
  V2.PREVIOUS_HOST);
 packet.calibrationId=V2.CALIBRATION;
 packet.freezeManifest={...packet.freezeManifest,path:V2.FREEZE_PATH};
 packet.historicalCandidate={proof:V2.PREVIOUS_PROOF,freeze:V2.PREVIOUS_FREEZE,
  adapter:V2.PREVIOUS_ADAPTER,host:V2.PREVIOUS_HOST};
 const registration={...previous.registration,calibrationId:V2.CALIBRATION,
  freezeManifest:V2.FREEZE_PATH};
 assert.equal(V2.validateP008AdmissionSemanticsV2(packet,registration),true);
 for(const mutate of [
  value=>{value.integrity.files=value.integrity.files.filter(pin=>pin.path!==V2.CURRENT_ADAPTER.path);},
  value=>{value.historicalCandidate.adapter.sha256='0'.repeat(64);},
  value=>{value.productCalibrationPassed=true;},
  value=>{value.optionalSpanishAudio.localeAutoplay=true;},
  value=>{value.selectedPages[0].runtime.frameCount=937;},
 ]){
  const changed=structuredClone(packet);mutate(changed);
  assert.throws(()=>V2.validateP008AdmissionSemanticsV2(changed,registration));
 }
});
