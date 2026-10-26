import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {uniquePins} from './g678-admission-proof.mjs';
import * as S from './alg-l06-p016-admission-semantics-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function proposal(){
 const source=S.readP016CanonicalSource(root),artifacts=S.proposedP016Artifacts(root);
 const entry={key:S.ID,module:`./modules/${S.ID}`,maturity:'private-current-js',
  complexityLane:S.COMPLEXITY_LANE,artifacts};
 const freezeManifest={path:S.FREEZE_PATH,bytes:1,sha256:'1'.repeat(64)};
 const packet={schemaVersion:1,calibrationId:S.CALIBRATION,sourceRoot:S.SOURCE_ROOT,
  scope:'private-engineering',deploymentScope:'local-only',source:S.SOURCE,sourceXml:S.XML,
  selectedPages:[{animationId:S.ID,placementId:S.ID,assetId:`swf-${S.SOURCE.sha256}`,
   sourceSha256:S.SOURCE.sha256,moduleCode:'ALG001',lessonNumber:6,
   globalPageOrdinal:16,sourceOccurrence:16,sectionCode:'VB',sectionPageOrdinal:6,
   complexityLane:S.COMPLEXITY_LANE,runtime:S.p016Runtime(artifacts)}],
  entry,continuousSource:S.CONTINUOUS,optionalSpanishAudio:S.OPTIONAL_SPANISH,
  glossaryActions:S.GLOSSARY,
  integrity:{scope:'P016-source-bound-test',completeTransitiveClosure:false,
   files:uniquePins([...source.localInputs,...Object.values(artifacts)])},
  acceptanceEffects:S.ACCEPTANCE,productCalibrationPassed:false,scaleOutAuthorized:false,
  freezeManifest};
 const registration={calibrationId:S.CALIBRATION,deploymentScope:'local-only',
  freezeManifest:S.FREEZE_PATH,freezeManifestBytes:freezeManifest.bytes,
  freezeManifestSha256:freezeManifest.sha256,entries:[entry]};
 return {source,packet,registration};
}

test('P016 source proposal binds actual 16/VB6, 815 frames, two ranges and partial Function hit',()=>{
 const {source,packet,registration}=proposal();
 assert.equal(source.localInputs.length>=39,true);
 assert.equal(source.external.length,3);
 assert.equal(source.frames.frames.length,815);
 assert.deepEqual(source.audio.streams[0].contiguousRanges.map(row=>
  [row.firstFrame,row.lastFrame]),[[2,299],[312,815]]);
 assert.deepEqual(source.text.functionControl.availableSpans,[[72,815]]);
 assert.equal(source.text.functionControl.firstFullHitFrame,null);
 assert.equal(source.browser.results.length,3);
 assert.equal(source.canvas.sourceGlyphRendering.preserved,true);
 assert.equal(S.validateP016AdmissionSemantics(packet,registration,root),true);
});

test('P016 rejects invented source alignment, locale autoplay, full hit, acceptance and missing pins',()=>{
 const {packet,registration}=proposal();
 for(const mutate of [
  p=>{p.selectedPages[0].globalPageOrdinal=15;},
  p=>{p.selectedPages[0].runtime.frameCount=814;},
  p=>{p.selectedPages[0].runtime.hostPlaybackCompletion=true;},
  p=>{p.continuousSource.mainRangeFrames=[[2,815]];},
  p=>{p.continuousSource.negativeSeekSemanticsResolved=true;},
  p=>{p.continuousSource.syntheticSilenceForAbsentBlocks=true;},
  p=>{p.optionalSpanishAudio.localeAutoplay=true;},
  p=>{p.optionalSpanishAudio.mainStreamSpliced=true;},
  p=>{p.glossaryActions.Function.firstFullHitFrame=72;},
  p=>{p.glossaryActions.Function.entryId='relation';},
  p=>{p.acceptanceEffects.audioAccepted=true;},
  p=>{p.entry.artifacts.runtime.sha256='0'.repeat(64);},
  p=>{p.integrity.files=p.integrity.files.filter(x=>x.path!==S.FRAME_AUDIT.path);},
  p=>{p.integrity.files=p.integrity.files.filter(x=>x.path!==S.CANVAS_METADATA.path);},
  p=>{p.integrity.files.push({path:'apps/web/lib/g678-admission-activation.ts',
   bytes:1,sha256:'0'.repeat(64)});},
  p=>{p.canonicalMember={path:'invented',bytes:1,sha256:'0'.repeat(64)};},
 ]){
  const changed=structuredClone(packet);mutate(changed);
  assert.throws(()=>S.validateP016AdmissionSemantics(changed,registration,root));
 }
 assert.throws(()=>S.validateP016AdmissionSemantics(packet,
  {...registration,freezeManifestSha256:'0'.repeat(64)},root));
});

test('physical copied Canvas member is required before treating proposal artifacts as installed',()=>{
 const proposed=S.proposedP016Artifacts(root),absolute=path.join(root,S.ARTIFACT_PATHS.runtime);
 if(fs.existsSync(absolute))assert.deepEqual(S.readP016Artifacts(root),proposed);
 else assert.throws(()=>S.readP016Artifacts(root),/ENOENT/);
});
