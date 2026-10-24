/** P008 v3 changes only the native-companion location of existing SA controls. */
import assert from 'node:assert/strict';
import * as V2 from './alg-l06-p008-admission-semantics-v2.mjs';

export const CALIBRATION='g678-alg-l06-p008-current-js-20260928-v3';
export const FREEZE_PATH=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const PROOF_PATH='work/g678-workflow/candidates/shared-alg001-l06-p008-proof-v3.json';
export const PREVIOUS_PROOF={path:V2.PROOF_PATH,bytes:38859,
 sha256:'ceda2a9c11a94ee5d6087508d225f02e89c1009eb07203c5939fcf397b42897c'};
export const PREVIOUS_FREEZE={path:V2.FREEZE_PATH,bytes:15299,
 sha256:'212b806cb61d3c7b2c65194e466cd8e3fbef772929a7914c1f78af048ea77cc2'};
export const PREVIOUS_PLAYER={path:'output/alg-l06-p008-host-v1/player-before-companion-controls.tsx',
 bytes:14002,sha256:'944f7e21389189382e68c3f1133dd25b191816860bd880a59882090271657006'};
export const CURRENT_PLAYER={path:'packages/demos/src/alg-l06-p008-player-v1.tsx',bytes:14393,
 sha256:'265d23c16cc0868c5c8ef57714380d81fe966ae9c240f78040e0d7c319e391d3'};

export function validateP008AdmissionSemanticsV3(packet,registration){
 assert.equal(packet.calibrationId,CALIBRATION);
 assert.equal(packet.freezeManifest.path,FREEZE_PATH);
 assert.equal(registration.calibrationId,CALIBRATION);
 assert.equal(registration.freezeManifest,FREEZE_PATH);
 assert.deepEqual(packet.previousCandidateV2,{proof:PREVIOUS_PROOF,freeze:PREVIOUS_FREEZE,
  player:PREVIOUS_PLAYER});
 const evidence=new Map(packet.integrity.files.map(pin=>[pin.path,pin]));
 for(const pin of [PREVIOUS_PROOF,PREVIOUS_FREEZE,PREVIOUS_PLAYER,CURRENT_PLAYER])
  assert.deepEqual(evidence.get(pin.path),pin,`v3 exact player successor: ${pin.path}`);
 const history=new Set([PREVIOUS_PROOF.path,PREVIOUS_FREEZE.path,PREVIOUS_PLAYER.path]);
 const comparable={...packet,calibrationId:V2.CALIBRATION,
  freezeManifest:{...packet.freezeManifest,path:V2.FREEZE_PATH},
  integrity:{...packet.integrity,files:packet.integrity.files.filter(pin=>!history.has(pin.path))}};
 const priorRegistration={...registration,calibrationId:V2.CALIBRATION,
  freezeManifest:V2.FREEZE_PATH};
 return V2.validateP008AdmissionSemanticsV2(comparable,priorRegistration);
}
