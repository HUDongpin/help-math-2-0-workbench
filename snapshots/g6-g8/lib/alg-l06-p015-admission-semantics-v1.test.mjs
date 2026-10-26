import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {uniquePins} from './g678-admission-proof.mjs';
import * as S from './alg-l06-p015-admission-semantics-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function proposal(){
 const source=S.readP015CanonicalSource(root),artifacts=S.proposedP015Artifacts(root);
 const entry={key:S.ID,module:`./modules/${S.ID}`,maturity:'private-current-js',
  complexityLane:S.COMPLEXITY_LANE,artifacts};
 const freezeManifest={path:S.FREEZE_PATH,bytes:1,sha256:'1'.repeat(64)};
 const packet={schemaVersion:1,calibrationId:S.CALIBRATION,sourceRoot:S.SOURCE_ROOT,
  scope:'private-engineering',deploymentScope:'local-only',source:S.SOURCE,sourceXml:S.XML,
  selectedPages:[{animationId:S.ID,placementId:S.ID,assetId:`swf-${S.SOURCE.sha256}`,
   sourceSha256:S.SOURCE.sha256,moduleCode:'ALG001',lessonNumber:6,
   globalPageOrdinal:15,sourceOccurrence:15,sectionCode:'VB',sectionPageOrdinal:5,
   complexityLane:S.COMPLEXITY_LANE,runtime:S.p015Runtime(artifacts)}],
  entry,continuousSource:S.CONTINUOUS,optionalSpanishAudio:S.OPTIONAL_SPANISH,
  glossaryActions:S.GLOSSARY,
  integrity:{scope:'P015-source-bound-test',completeTransitiveClosure:false,
   files:uniquePins([...source.localInputs,...Object.values(artifacts)])},
  acceptanceEffects:S.ACCEPTANCE,productCalibrationPassed:false,scaleOutAuthorized:false,
  freezeManifest};
 const registration={calibrationId:S.CALIBRATION,deploymentScope:'local-only',
  freezeManifest:S.FREEZE_PATH,freezeManifestBytes:freezeManifest.bytes,
  freezeManifestSha256:freezeManifest.sha256,entries:[entry]};
 return {source,packet,registration};
}

test('P015 proposal binds source 15/VB5, 914 frames, four main ranges, six terms and separate SA',()=>{
 const {source,packet,registration}=proposal();
 assert.deepEqual([source.audit.runtime.mainDomain,source.audit.runtime.mainFrames],['sprite-270',914]);
 assert.deepEqual(source.audio.streams[0].contiguousRanges.map(x=>[x.firstFrame,x.lastFrame]),
  [[2,622],[646,702],[712,849],[852,914]]);
 assert.equal(source.glossary.sourceButtons.length,6);
 assert.equal(source.audio.trailers.length,0);
 assert.equal(source.browser.results.length,5);
 assert.equal(source.canvas.sourceGlyphRendering.nativeBinding,'semantic-flow-companion');
 assert.equal(S.validateP015AdmissionSemantics(packet,registration,root),true);
});

test('P015 packet rejects audio, glossary, renderer, terminal and acceptance inflation',()=>{
 const {packet,registration}=proposal();
 for(const mutate of [
  p=>{p.selectedPages[0].globalPageOrdinal=14;},
  p=>{p.selectedPages[0].runtime.frameCount=913;},
  p=>{p.selectedPages[0].runtime.terminalPolicy='original-runtime-end';},
  p=>{p.continuousSource.mainRangeFrames=[[2,914]];},
  p=>{p.continuousSource.negativeSeekSemanticsResolved=true;},
  p=>{p.continuousSource.syntheticSilenceForAbsentBlocks=true;},
  p=>{p.optionalSpanishAudio.localeAutoplay=true;},
  p=>{p.optionalSpanishAudio.mainStreamSpliced=true;},
  p=>{p.glossaryActions.Output.entryId='input';},
  p=>{p.acceptanceEffects.audioAccepted=true;},
  p=>{p.entry.artifacts.runtime.sha256='0'.repeat(64);},
  p=>{p.integrity.files=p.integrity.files.filter(x=>x.path!==S.AUDIO_AUDIT.path);},
  p=>{p.integrity.files.push({path:'packages/demos/private-current-js-registry.json',
   bytes:1,sha256:'0'.repeat(64)});},
  p=>{p.canonicalRun={path:'invented',bytes:1,sha256:'0'.repeat(64)};},
 ]){
  const changed=structuredClone(packet);mutate(changed);
  assert.throws(()=>S.validateP015AdmissionSemantics(changed,registration,root));
 }
 assert.throws(()=>S.validateP015AdmissionSemantics(packet,
  {...registration,freezeManifestSha256:'0'.repeat(64)},root));
});

test('P015 physical Canvas member must equal the extracted source bytes',()=>{
 assert.deepEqual(S.readP015Artifacts(root),S.proposedP015Artifacts(root));
});
