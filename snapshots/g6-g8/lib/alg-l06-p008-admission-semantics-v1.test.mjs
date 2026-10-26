import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as S from './alg-l06-p008-admission-semantics-v1.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('P008 physical source and unregistered packet semantics remain bounded',()=>{
 const source=S.readP008CanonicalSource(ROOT);
 assert.equal(source.audit.frameDomains.find(row=>row.domainId==='sprite-507').declaredFrames,938);
 assert.equal(source.audit.audio.blockCount,911);
 assert.equal(source.sa.inputs.separateSa.sha256,S.SA.sha256);
 const freeze={path:S.FREEZE_PATH,bytes:1,sha256:'a'.repeat(64)};
 const entry={key:S.ID,module:`./modules/${S.ID}`,maturity:'private-current-js',
  complexityLane:'behavior-heavy',artifacts:S.ARTIFACTS};
 const packet={schemaVersion:1,calibrationId:S.CALIBRATION,sourceRoot:S.SOURCE_ROOT,
  scope:'private-engineering',deploymentScope:'local-only',source:S.SOURCE,sourceXml:S.XML,
  selectedPages:[{animationId:S.ID,placementId:S.ID,assetId:`swf-${S.SOURCE.sha256}`,
   sourceSha256:S.SOURCE.sha256,moduleCode:'ALG001',lessonNumber:6,
   globalPageOrdinal:8,sourceOccurrence:8,sectionCode:'RW',sectionPageOrdinal:7,
   complexityLane:'behavior-heavy',runtime:S.RUNTIME}],entry,
  continuousSource:S.CONTINUOUS,optionalSpanishAudio:S.OPTIONAL_SPANISH,
  integrity:{files:[...source.localInputs,S.ARTIFACTS.runtime]},
  acceptanceEffects:S.ACCEPTANCE,productCalibrationPassed:false,scaleOutAuthorized:false,
  freezeManifest:freeze};
 const registration={calibrationId:S.CALIBRATION,deploymentScope:'local-only',
  freezeManifest:freeze.path,freezeManifestBytes:freeze.bytes,
  freezeManifestSha256:freeze.sha256,entries:[entry]};
 assert.equal(S.validateP008AdmissionSemantics(packet,registration),true);
 for(const mutate of [
  value=>{value.selectedPages[0].globalPageOrdinal=7;},
  value=>{value.selectedPages[0].runtime.frameCount=937;},
  value=>{value.continuousSource.firstAudioBlockFrame=1;},
  value=>{value.optionalSpanishAudio.localeAutoplay=true;},
  value=>{value.acceptanceEffects.audioAccepted=true;},
  value=>{value.entry.artifacts.runtime.sha256='0'.repeat(64);},
  value=>{value.integrity.files=value.integrity.files.filter(pin=>pin.path!==S.TEXT_AUDIT.path);},
  value=>{value.integrity.files.push({path:'packages/demos/private-current-js-registry.json',
   bytes:1,sha256:'0'.repeat(64)});},
 ]){
  const changed=structuredClone(packet);mutate(changed);
  assert.throws(()=>S.validateP008AdmissionSemantics(changed,registration));
 }
});
