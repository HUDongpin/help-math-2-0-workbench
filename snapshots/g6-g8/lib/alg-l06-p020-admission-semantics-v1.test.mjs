import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {uniquePins} from './g678-admission-proof.mjs';
import * as S from './alg-l06-p020-admission-semantics-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function proposal(){
 const source=S.readP020CanonicalSource(root),artifacts=S.proposedP020Artifacts(root);
 const entry={key:S.ID,module:`./modules/${S.ID}`,maturity:'private-current-js',
  complexityLane:S.COMPLEXITY_LANE,artifacts};
 const freezeManifest={path:S.FREEZE_PATH,bytes:1,sha256:'1'.repeat(64)};
 const packet={schemaVersion:1,calibrationId:S.CALIBRATION,sourceRoot:S.SOURCE_ROOT,
  scope:'private-engineering',deploymentScope:'local-only',source:S.SOURCE,sourceXml:S.XML,
  selectedPages:[{animationId:S.ID,placementId:S.ID,assetId:`swf-${S.SOURCE.sha256}`,
   sourceSha256:S.SOURCE.sha256,moduleCode:'ALG001',lessonNumber:6,globalPageOrdinal:20,
   sourceOccurrence:20,sectionCode:'VB',sectionPageOrdinal:10,
   complexityLane:S.COMPLEXITY_LANE,runtime:S.p020Runtime(artifacts)}],
  entry,continuousSource:S.CONTINUOUS,optionalSpanishAudio:S.OPTIONAL_SPANISH,
  glossaryActions:S.GLOSSARY,
  integrity:{scope:'P020-source-bound-test',completeTransitiveClosure:false,
   files:uniquePins([...source.localInputs,...Object.values(artifacts)])},
  acceptanceEffects:S.ACCEPTANCE,productCalibrationPassed:false,scaleOutAuthorized:false,
  freezeManifest};
 const registration={calibrationId:S.CALIBRATION,deploymentScope:'local-only',
  freezeManifest:S.FREEZE_PATH,freezeManifestBytes:freezeManifest.bytes,
  freezeManifestSha256:freezeManifest.sha256,entries:[entry]};
 return {source,packet,registration};
}
test('P020 canonical source binds 58 hold, 59 resume and all seven independent feedback domains',()=>{
 const {source,packet,registration}=proposal();
 assert.equal(source.behavior.main.quizStopFrame,58);
 assert.deepEqual(source.behavior.feedback.map(row=>[row.domain,row.holdFrame??null]),
  [['sprite-157',null],['sprite-128',null],['sprite-108',null],['sprite-141',null],
   ['sprite-65',23],['sprite-94',20],['sprite-80',21]]);
 assert.deepEqual(source.audio.streams.find(row=>row.domain==='sprite-94').negativeSeekBlocks
  .map(row=>[row.frame,row.rawSeekSamples]),[[27,-2093]]);
 assert.deepEqual(source.text.options.map(row=>[row.option,row.value]),
  [['A','1'],['B','-2'],['C','3'],['D','5']]);
 assert.equal(S.validateP020AdmissionSemantics(packet,registration,root),true);
});
test('P020 rejects altered ordinal, audio joining, SA autoplay, glossary identity and gate promotion',()=>{
 const {packet,registration}=proposal();
 for(const mutate of [
  p=>{p.selectedPages[0].globalPageOrdinal=19;},
  p=>{p.selectedPages[0].runtime.quizHoldFrame=59;},
  p=>{p.continuousSource.feedbackStreamsConcatenated=true;},
  p=>{p.continuousSource.sprite94NegativeSeekSemanticsResolved=true;},
  p=>{p.optionalSpanishAudio.localeAutoplay=true;},
  p=>{p.glossaryActions.Function.firstFullHitFrame=2;},
  p=>{p.acceptanceEffects.ownerAccepted=true;},
  p=>{p.entry.artifacts.runtime.sha256='0'.repeat(64);},
  p=>{p.integrity.files=p.integrity.files.filter(row=>
   row.path!==S.AUDIT_PATHS.behavior);},
  p=>{p.integrity.files.push({path:'apps/web/lib/g678-admission-activation.ts',
   bytes:1,sha256:'0'.repeat(64)});},
 ]){
  const changed=structuredClone(packet);mutate(changed);
  assert.throws(()=>S.validateP020AdmissionSemantics(changed,registration,root));
 }
 assert.throws(()=>S.validateP020AdmissionSemantics(packet,
  {...registration,freezeManifestSha256:'0'.repeat(64)},root));
});
