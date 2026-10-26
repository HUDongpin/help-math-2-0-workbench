import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {uniquePins} from './g678-admission-proof.mjs';
import * as S from './alg-l06-p018-admission-semantics-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function proposal(){
 const source=S.readP018CanonicalSource(root),artifacts=S.proposedP018Artifacts(root);
 const entry={key:S.ID,module:`./modules/${S.ID}`,maturity:'private-current-js',
  complexityLane:S.COMPLEXITY_LANE,artifacts};
 const freezeManifest={path:S.FREEZE_PATH,bytes:1,sha256:'1'.repeat(64)};
 const packet={schemaVersion:1,calibrationId:S.CALIBRATION,sourceRoot:S.SOURCE_ROOT,
  scope:'private-engineering',deploymentScope:'local-only',source:S.SOURCE,sourceXml:S.XML,
  selectedPages:[{animationId:S.ID,placementId:S.ID,assetId:`swf-${S.SOURCE.sha256}`,
   sourceSha256:S.SOURCE.sha256,moduleCode:'ALG001',lessonNumber:6,
   globalPageOrdinal:18,sourceOccurrence:18,sectionCode:'VB',sectionPageOrdinal:8,
   complexityLane:S.COMPLEXITY_LANE,runtime:S.p018Runtime(artifacts)}],
  entry,continuousSource:S.CONTINUOUS,optionalSpanishAudio:S.OPTIONAL_SPANISH,
  glossaryActions:S.GLOSSARY,
  integrity:{scope:'P018-source-bound-test',completeTransitiveClosure:false,
   files:uniquePins([...source.localInputs,...Object.values(artifacts)])},
  acceptanceEffects:S.ACCEPTANCE,productCalibrationPassed:false,scaleOutAuthorized:false,
  freezeManifest};
 const registration={calibrationId:S.CALIBRATION,deploymentScope:'local-only',
  freezeManifest:S.FREEZE_PATH,freezeManifestBytes:freezeManifest.bytes,
  freezeManifestSha256:freezeManifest.sha256,entries:[entry]};
 return {source,packet,registration};
}

test('P018 binds VB8, corrected v2 instance gates, one continuous main stream and separate SA',()=>{
 const {source,packet,registration}=proposal();
 assert.equal(source.frames.frames.length,648);
 assert.equal(source.text.textInstances.length,38);
 assert.equal(source.source.replacementPlacements.length,1);
 assert.deepEqual(source.source.replacementPlacements[0].frame,64);
 assert.deepEqual(Object.values(S.GLOSSARY).map(term=>
  [term.sourceKey,term.characterId,term.instances.map(i=>i.firstFullHitFrame)]),[
  ['Evaluate',8,[11,324]],['Input variable',9,[65]],
  ['Substitute',10,[43]],['Function',11,[18,333]],['Result',20,[102]]]);
 assert.equal(Object.values(S.GLOSSARY).reduce((n,t)=>n+t.instances.length,0),7);
 assert.deepEqual(source.audio.streams[0].contiguousRanges.map(r=>
  [r.firstFrame,r.lastFrame]),[[2,648]]);
 assert.equal(source.canvas.sourceGlyphRendering.preserved,true);
 assert.equal(S.validateP018AdmissionSemantics(packet,registration,root),true);
 assert.deepEqual(S.readP018Artifacts(root),S.proposedP018Artifacts(root));
});

test('P018 rejects changed second-instance meaning, autoplay, source closure drift and acceptance claims',()=>{
 const {packet,registration}=proposal();
 for(const mutate of [
  p=>{p.selectedPages[0].globalPageOrdinal=17;},
  p=>{p.selectedPages[0].runtime.frameCount=647;},
  p=>{p.selectedPages[0].runtime.hostPlaybackCompletion=true;},
  p=>{p.continuousSource.mainRangeFrames=[[2,320],[333,648]];},
  p=>{p.continuousSource.negativeSeekSemanticsResolved=true;},
  p=>{p.optionalSpanishAudio.localeAutoplay=true;},
  p=>{p.optionalSpanishAudio.mainStreamSpliced=true;},
  p=>{p.glossaryActions['Input variable'].entryId='input';},
  p=>{p.glossaryActions.Evaluate.instances[1].labelTextId=6;},
  p=>{p.glossaryActions.Function.instances[1].firstFullHitFrame=18;},
  p=>{p.glossaryActions.Result.originalClickObserved=true;},
  p=>{p.acceptanceEffects.audioAccepted=true;},
  p=>{p.entry.artifacts.runtime.sha256='0'.repeat(64);},
  p=>{p.integrity.files=p.integrity.files.filter(x=>x.path!==S.FRAME_AUDIT.path);},
  p=>{p.integrity.files=p.integrity.files.filter(x=>x.path!==S.CROSSWALK.path);},
  p=>{p.integrity.files.push({path:'apps/web/lib/g678-admission-activation.ts',
   bytes:1,sha256:'0'.repeat(64)});},
 ]){
  const changed=structuredClone(packet);mutate(changed);
  assert.throws(()=>S.validateP018AdmissionSemantics(changed,registration,root));
 }
 assert.throws(()=>S.validateP018AdmissionSemantics(packet,
  {...registration,freezeManifestSha256:'0'.repeat(64)},root));
});
