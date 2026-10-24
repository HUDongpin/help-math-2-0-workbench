/** P008 v2 candidate: the host Replay adapter changed; P008 source and renderer did not. */
import assert from 'node:assert/strict';
import * as V1 from './alg-l06-p008-admission-semantics-v1.mjs';

export const CALIBRATION='g678-alg-l06-p008-current-js-20260928-v2';
export const FREEZE_PATH=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const PROOF_PATH=`work/g678-workflow/candidates/${V1.ID}-proof-v2.json`;
export const PREVIOUS_PROOF={path:V1.PROOF_PATH,bytes:34099,
 sha256:'f874eabbede02802e7a419f0dbf319f90fbe3b0ba6a9721e8f1155d389344ec0'};
export const PREVIOUS_FREEZE={path:V1.FREEZE_PATH,bytes:13101,
 sha256:'adc182efec9c067403cc52222eabf6093508912261f18cc9b5163a9425fbc068'};
export const PREVIOUS_ADAPTER={path:'output/alg-l06-p008-host-v1/adapter-v27.tsx',bytes:8909,
 sha256:'1426c1f6a4c7132c9eadcc27a0883e28d8bc14c5cffd4290b33a2a5d3ae4121a'};
export const CURRENT_ADAPTER={path:'apps/web/components/g678-alg-l06-p008-runtime-v1.tsx',bytes:9110,
 sha256:'9ae6553f3dc0cce48b70da26711225da486ad3e1334d891988847707513781dc'};
export const PREVIOUS_HOST={path:'catalog/g678-admission-v1/host-v27.json',bytes:82547,
 sha256:'a573f94225df6b814fc5acba1c1c238b25c59144d873faf1172f97a3e13fe6e3'};

export function validateP008AdmissionSemanticsV2(packet,registration){
 assert.equal(packet.calibrationId,CALIBRATION);
 assert.equal(packet.freezeManifest.path,FREEZE_PATH);
 assert.equal(registration.calibrationId,CALIBRATION);
 assert.equal(registration.freezeManifest,FREEZE_PATH);
 assert.deepEqual(packet.historicalCandidate,{proof:PREVIOUS_PROOF,freeze:PREVIOUS_FREEZE,
  adapter:PREVIOUS_ADAPTER,host:PREVIOUS_HOST});
 const evidence=new Map(packet.integrity.files.map(pin=>[pin.path,pin]));
 for(const pin of [PREVIOUS_PROOF,PREVIOUS_FREEZE,PREVIOUS_ADAPTER,PREVIOUS_HOST,CURRENT_ADAPTER])
  assert.deepEqual(evidence.get(pin.path),pin,`v2 exact adapter predecessor: ${pin.path}`);
 // Reuse the source-family validator after substituting only its historical
 // calibration labels. Historical pins are additional v2 evidence, not v1 inputs.
 const history=new Set([PREVIOUS_PROOF.path,PREVIOUS_FREEZE.path,PREVIOUS_ADAPTER.path,
  PREVIOUS_HOST.path]);
 const comparable={...packet,calibrationId:V1.CALIBRATION,
  freezeManifest:{...packet.freezeManifest,path:V1.FREEZE_PATH},
  integrity:{...packet.integrity,files:packet.integrity.files.filter(pin=>!history.has(pin.path))}};
 const priorRegistration={...registration,calibrationId:V1.CALIBRATION,
  freezeManifest:V1.FREEZE_PATH};
 return V1.validateP008AdmissionSemantics(comparable,priorRegistration);
}
