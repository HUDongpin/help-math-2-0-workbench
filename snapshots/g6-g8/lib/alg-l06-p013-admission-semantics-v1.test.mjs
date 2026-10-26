import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {uniquePins} from './g678-admission-proof.mjs';
import * as S from './alg-l06-p013-admission-semantics-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function candidate(){
 const source=S.readP013CanonicalSource(root),artifacts=S.readP013Artifacts(root);
 const entry={key:S.ID,module:`./modules/${S.ID}`,maturity:'private-current-js',
  complexityLane:S.COMPLEXITY_LANE,artifacts};
 const freezeManifest={path:S.FREEZE_PATH,bytes:1,sha256:'1'.repeat(64)};
 const packet={schemaVersion:1,calibrationId:S.CALIBRATION,
  sourceRoot:S.SOURCE_ROOT,scope:'private-engineering',deploymentScope:'local-only',
  source:S.SOURCE,sourceXml:S.XML,
  selectedPages:[{animationId:S.ID,placementId:S.ID,assetId:`swf-${S.SOURCE.sha256}`,
   sourceSha256:S.SOURCE.sha256,moduleCode:'ALG001',lessonNumber:6,
   globalPageOrdinal:13,sourceOccurrence:13,sectionCode:'VB',sectionPageOrdinal:3,
   complexityLane:S.COMPLEXITY_LANE,runtime:S.p013Runtime(artifacts)}],
  entry,continuousSource:S.CONTINUOUS,optionalSpanishAudio:S.OPTIONAL_SPANISH,
  glossaryActions:S.GLOSSARY,
  integrity:{scope:'P013-source-bound-test',completeTransitiveClosure:false,
   files:uniquePins([...source.localInputs,...Object.values(artifacts)])},
  acceptanceEffects:S.ACCEPTANCE,productCalibrationPassed:false,scaleOutAuthorized:false,
  freezeManifest};
 const registration={calibrationId:S.CALIBRATION,deploymentScope:'local-only',
  freezeManifest:S.FREEZE_PATH,freezeManifestBytes:freezeManifest.bytes,
  freezeManifestSha256:freezeManifest.sha256,entries:[entry]};
 return {source,packet,registration};
}

test('P013 physical source, Canvas, decoded audio and distinct dictionary actions remain exact',()=>{
 const {source,packet,registration}=candidate();
 assert.equal(source.audit.catalog.globalOrdinal,13);
 assert.equal(source.audio.embedded.blockCount,368);
 assert.deepEqual(source.audio.embedded.absentBlockFrames,[253,254,255]);
 assert.deepEqual(source.audio.embedded.zeroPayloadBlocks.filter(x=>x.seek<0).map(x=>x.frame),[161,252]);
 assert.deepEqual(source.glossary.terms.map(x=>[x.sourceKeyAttribute,x.entryId]),
  [['Input','input'],['Output','output']]);
 assert.equal(source.canvas.sourceGlyphRendering.nativeBinding,'semantic-flow-companion');
 assert.equal(source.external.length,8);
 assert.equal(S.validateP013AdmissionSemantics(packet,registration),true);
});

test('P013 admission rejects wrong placement, packet gaps, masked buttons, SA and acceptance',()=>{
 const {packet,registration}=candidate();
 for(const mutate of [
  p=>{p.selectedPages[0].globalPageOrdinal=12;},
  p=>{p.selectedPages[0].runtime.frameCount=371;},
  p=>{p.continuousSource.absentBlockFrames=[253,254];},
  p=>{p.continuousSource.negativeSeekSemanticsResolved=true;},
  p=>{p.continuousSource.syntheticSilenceForAbsentBlocks=true;},
  p=>{p.glossaryActions.Input.firstFullHitFrame=258;},
  p=>{p.glossaryActions.Output.entryId='input';},
  p=>{p.optionalSpanishAudio.localeAutoplay=true;},
  p=>{p.optionalSpanishAudio.mainStreamSpliced=true;},
  p=>{p.acceptanceEffects.audioAccepted=true;},
  p=>{p.entry.artifacts.module.sha256='0'.repeat(64);},
  p=>{p.integrity.files=p.integrity.files.filter(x=>x.path!==S.BROWSER_AUDIO.path);},
  p=>{p.integrity.files.push({path:'packages/demos/private-current-js-registry.json',
   bytes:1,sha256:'0'.repeat(64)});},
  p=>{p.canonicalRun={path:'invented',bytes:1,sha256:'0'.repeat(64)};},
 ]){
  const altered=structuredClone(packet);mutate(altered);
  assert.throws(()=>S.validateP013AdmissionSemantics(altered,registration));
 }
 assert.throws(()=>S.validateP013AdmissionSemantics(packet,
  {...registration,freezeManifestSha256:'0'.repeat(64)}));
});
