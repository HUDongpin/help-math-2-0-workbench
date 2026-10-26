import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {uniquePins} from './g678-admission-proof.mjs';
import * as S from './alg-l06-p020-admission-semantics-v2.mjs';

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
  integrity:{scope:'P020-v2-source-test',completeTransitiveClosure:false,
   files:uniquePins([...source.localInputs,...Object.values(artifacts)])},
  acceptanceEffects:S.ACCEPTANCE,productCalibrationPassed:false,scaleOutAuthorized:false,
  freezeManifest};
 const registration={calibrationId:S.CALIBRATION,deploymentScope:'local-only',
  freezeManifest:S.FREEZE_PATH,freezeManifestBytes:freezeManifest.bytes,
  freezeManifestSha256:freezeManifest.sha256,entries:[entry]};
 return {source,packet,registration};
}
test('P020 v2 canonical wrapper pins maintained timeline without replacing its source',()=>{
 const {source,packet,registration}=proposal();
 assert.equal(S.ARTIFACT_PATHS.timeline,
  `packages/demos/src/timelines/${S.ID}.ts`);
 assert(source.localInputs.some(item=>item.path===
  'packages/demos/src/alg-l06-p020-timeline-v1.ts'));
 assert.equal(packet.entry.artifacts.timeline.path,S.ARTIFACT_PATHS.timeline);
 assert.equal(packet.entry.artifacts.runtime.path.includes('20260929-v2'),true);
 assert.equal(S.validateP020AdmissionSemantics(packet,registration,root),true);
});
test('P020 v2 semantics rejects the v1 noncanonical timeline artifact',()=>{
 const {packet,registration}=proposal();
 const changed=structuredClone(packet);
 changed.entry.artifacts.timeline.path='packages/demos/src/alg-l06-p020-timeline-v1.ts';
 assert.throws(()=>S.validateP020AdmissionSemantics(changed,registration,root));
});
