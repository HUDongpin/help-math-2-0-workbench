import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {uniquePins} from './g678-admission-proof.mjs';
import * as S from './alg-l06-p017-admission-semantics-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function proposal(){
 const source=S.readP017CanonicalSource(root),artifacts=S.proposedP017Artifacts(root);
 const entry={key:S.ID,module:`./modules/${S.ID}`,maturity:'private-current-js',
  complexityLane:S.COMPLEXITY_LANE,artifacts};
 const freezeManifest={path:S.FREEZE_PATH,bytes:1,sha256:'1'.repeat(64)};
 const packet={schemaVersion:1,calibrationId:S.CALIBRATION,sourceRoot:S.SOURCE_ROOT,
  scope:'private-engineering',deploymentScope:'local-only',source:S.SOURCE,sourceXml:S.XML,
  selectedPages:[{animationId:S.ID,placementId:S.ID,assetId:`swf-${S.SOURCE.sha256}`,
   sourceSha256:S.SOURCE.sha256,moduleCode:'ALG001',lessonNumber:6,
   globalPageOrdinal:17,sourceOccurrence:17,sectionCode:'VB',sectionPageOrdinal:7,
   complexityLane:S.COMPLEXITY_LANE,runtime:S.p017Runtime(artifacts)}],
  entry,continuousSource:S.CONTINUOUS,optionalSpanishAudio:S.OPTIONAL_SPANISH,
  glossaryActions:S.GLOSSARY,
  integrity:{scope:'P017-source-bound-test',completeTransitiveClosure:false,
   files:uniquePins([...source.localInputs,...Object.values(artifacts)])},
  acceptanceEffects:S.ACCEPTANCE,productCalibrationPassed:false,scaleOutAuthorized:false,
  freezeManifest};
 const registration={calibrationId:S.CALIBRATION,deploymentScope:'local-only',
  freezeManifest:S.FREEZE_PATH,freezeManifestBytes:freezeManifest.bytes,
  freezeManifestSha256:freezeManifest.sha256,entries:[entry]};
 return {source,packet,registration};
}

test('P017 proposal binds physical VB7, six distinct terms, 20 glyphs and one continuous main stream',()=>{
 const {source,packet,registration}=proposal();
 assert(source.localInputs.length>=39);
 assert.equal(source.migration.runtime.complexity,'behavior-heavy');
 assert.equal(S.COMPLEXITY_LANE,'behavior-heavy');
 assert.equal(source.external.length,6);
 assert.equal(source.frames.frames.length,721);
 assert.equal(source.text.textInstances.length,44);
 assert.deepEqual(source.audio.streams[0].contiguousRanges.map(row=>
  [row.firstFrame,row.lastFrame]),[[2,721]]);
 assert.equal(source.audio.streams[0].blockCount,720);
 assert.equal(source.canvas.sourceGlyphRendering.preserved,true);
 assert.deepEqual(Object.values(S.GLOSSARY).map(item=>
  [item.sourceKey,item.entryId,item.firstCandidateFrame]),[
  ['Equation','equation',11],['Sentence','sentence',54],['Function','function',20],
  ['Rule','rule',68],['Output variable','output-variable',108],
  ['Input variable','input-variable',173]]);
 assert.equal(S.validateP017AdmissionSemantics(packet,registration,root),true);
 assert.deepEqual(S.readP017Artifacts(root),S.proposedP017Artifacts(root));
});

test('P017 rejects changed source meaning, locale autoplay and unsupported acceptance claims',()=>{
 const {packet,registration}=proposal();
 for(const mutate of [
  p=>{p.selectedPages[0].globalPageOrdinal=16;},
  p=>{p.selectedPages[0].runtime.frameCount=720;},
  p=>{p.selectedPages[0].runtime.hostPlaybackCompletion=true;},
  p=>{p.continuousSource.mainRangeFrames=[[2,299],[312,721]];},
  p=>{p.continuousSource.negativeSeekSemanticsResolved=true;},
  p=>{p.continuousSource.syntheticSilenceForAbsentBlocks=true;},
  p=>{p.optionalSpanishAudio.localeAutoplay=true;},
  p=>{p.optionalSpanishAudio.mainStreamSpliced=true;},
  p=>{p.glossaryActions['Input variable'].entryId='input';},
  p=>{p.glossaryActions['Output variable'].firstCandidateFrame=80;},
  p=>{p.glossaryActions.Sentence.originalClickObserved=true;},
  p=>{p.acceptanceEffects.audioAccepted=true;},
  p=>{p.entry.artifacts.runtime.sha256='0'.repeat(64);},
  p=>{p.integrity.files=p.integrity.files.filter(x=>x.path!==S.FRAME_AUDIT.path);},
  p=>{p.integrity.files=p.integrity.files.filter(x=>x.path!==S.CROSSWALK.path);},
  p=>{p.integrity.files=p.integrity.files.filter(x=>x.path!==S.CANVAS_METADATA.path);},
  p=>{p.integrity.files.push({path:'apps/web/lib/g678-admission-activation.ts',
   bytes:1,sha256:'0'.repeat(64)});},
  p=>{p.canonicalMember={path:'invented',bytes:1,sha256:'0'.repeat(64)};},
 ]){
  const changed=structuredClone(packet);mutate(changed);
  assert.throws(()=>S.validateP017AdmissionSemantics(changed,registration,root));
 }
 assert.throws(()=>S.validateP017AdmissionSemantics(packet,
  {...registration,freezeManifestSha256:'0'.repeat(64)},root));
});
