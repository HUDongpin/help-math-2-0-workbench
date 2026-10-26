import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {uniquePins} from './g678-admission-proof.mjs';
import * as S from './alg-l06-p010-admission-semantics-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function candidate(){
 const source=S.readP010CanonicalSource(root);
 const artifacts=S.readP010Artifacts(root);
 const entry={key:S.ID,module:`./modules/${S.ID}`,maturity:'private-current-js',
  complexityLane:S.COMPLEXITY_LANE,artifacts};
 const freezeManifest={path:S.FREEZE_PATH,bytes:1,sha256:'1'.repeat(64)};
 const packet={schemaVersion:1,calibrationId:S.CALIBRATION,
  sourceRoot:S.SOURCE_ROOT,scope:'private-engineering',deploymentScope:'local-only',
  source:S.SOURCE,sourceXml:S.XML,
  selectedPages:[{animationId:S.ID,placementId:S.ID,assetId:`swf-${S.SOURCE.sha256}`,
   sourceSha256:S.SOURCE.sha256,moduleCode:'ALG001',lessonNumber:6,
   globalPageOrdinal:10,sourceOccurrence:10,sectionCode:'RW',sectionPageOrdinal:9,
   complexityLane:S.COMPLEXITY_LANE,runtime:S.p010Runtime(artifacts)}],
  entry,continuousSource:S.CONTINUOUS,optionalSpanishAudio:S.OPTIONAL_SPANISH,
  integrity:{scope:'source-bound-test',completeTransitiveClosure:false,
   files:uniquePins([...source.localInputs,...Object.values(artifacts)])},
  acceptanceEffects:S.ACCEPTANCE,productCalibrationPassed:false,scaleOutAuthorized:false,
  freezeManifest};
 const registration={calibrationId:S.CALIBRATION,deploymentScope:'local-only',
  freezeManifest:S.FREEZE_PATH,freezeManifestBytes:freezeManifest.bytes,
  freezeManifestSha256:freezeManifest.sha256,entries:[entry]};
 return {source,packet,registration};
}

test('physical P010 source, Function crosswalk, Canvas and audio remain exact',()=>{
 const {source,packet,registration}=candidate();
 assert.equal(source.audit.catalog.globalOrdinal,10);
 assert.equal(source.audit.catalog.sectionPageOrdinal,9);
 assert.equal(source.audio.embedded.blockCount,300);
 assert.deepEqual(source.audio.embedded.zeroPayloadBlocks.map(x=>x.frame),[5]);
 assert.equal(source.saHost.functionGlossaryCrosswalk.sourceKey,'Function');
 assert.equal(source.canvas.sourceGlyphRendering.nativeBinding,'semantic-flow-companion');
 assert.equal(source.external.length,15);
 assert.equal(S.validateP010AdmissionSemantics(packet,registration),true);
});

test('P010 admission semantics reject wrong page, timing, SA, acceptance and evidence',()=>{
 const {packet,registration}=candidate();
 for(const mutate of [
  p=>{p.selectedPages[0].globalPageOrdinal=9;},
  p=>{p.selectedPages[0].runtime.frameCount=302;},
  p=>{p.continuousSource.blockCount=299;},
  p=>{p.optionalSpanishAudio.localeAutoplay=true;},
  p=>{p.optionalSpanishAudio.mainStreamSpliced=true;},
  p=>{p.acceptanceEffects.audioAccepted=true;},
  p=>{p.entry.artifacts.module.sha256='0'.repeat(64);},
  p=>{p.integrity.files=p.integrity.files.filter(x=>x.path!==S.SA_HOST_AUDIT.path);},
  p=>{p.integrity.files.push({path:'packages/demos/private-current-js-registry.json',
   bytes:1,sha256:'0'.repeat(64)});},
  p=>{p.canonicalRun={path:'invented',bytes:1,sha256:'0'.repeat(64)};},
 ]){
  const altered=structuredClone(packet);mutate(altered);
  assert.throws(()=>S.validateP010AdmissionSemantics(altered,registration));
 }
 assert.throws(()=>S.validateP010AdmissionSemantics(packet,
  {...registration,freezeManifestSha256:'0'.repeat(64)}));
});
