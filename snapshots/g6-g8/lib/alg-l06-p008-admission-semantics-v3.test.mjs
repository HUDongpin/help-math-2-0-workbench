import test from 'node:test';
import assert from 'node:assert/strict';
import {readJsonPin} from './g678-admission-proof.mjs';
import * as V3 from './alg-l06-p008-admission-semantics-v3.mjs';

test('P008 mobile SA controls successor binds final player and preserves v2',()=>{
 const previous=readJsonPin(process.cwd(),V3.PREVIOUS_PROOF);
 assert.deepEqual(previous.packet.freezeManifest,V3.PREVIOUS_FREEZE);
 const packet=structuredClone(previous.packet);
 const old=packet.integrity.files.findIndex(pin=>pin.path===V3.CURRENT_PLAYER.path);
 assert(old>=0);packet.integrity.files.splice(old,1,V3.CURRENT_PLAYER);
 packet.integrity.files.push(V3.PREVIOUS_PROOF,V3.PREVIOUS_FREEZE,V3.PREVIOUS_PLAYER);
 packet.calibrationId=V3.CALIBRATION;
 packet.freezeManifest={...packet.freezeManifest,path:V3.FREEZE_PATH};
 packet.previousCandidateV2={proof:V3.PREVIOUS_PROOF,freeze:V3.PREVIOUS_FREEZE,
  player:V3.PREVIOUS_PLAYER};
 const registration={...previous.registration,calibrationId:V3.CALIBRATION,
  freezeManifest:V3.FREEZE_PATH};
 assert.equal(V3.validateP008AdmissionSemanticsV3(packet,registration),true);
 for(const mutate of [
  value=>{value.integrity.files=value.integrity.files.filter(pin=>pin.path!==V3.CURRENT_PLAYER.path);},
  value=>{value.previousCandidateV2.player.sha256='0'.repeat(64);},
  value=>{value.productCalibrationPassed=true;},
  value=>{value.optionalSpanishAudio.localeAutoplay=true;},
 ]){
  const changed=structuredClone(packet);mutate(changed);
  assert.throws(()=>V3.validateP008AdmissionSemanticsV3(changed,registration));
 }
});
