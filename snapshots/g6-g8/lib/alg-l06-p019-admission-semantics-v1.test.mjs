import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {uniquePins} from './g678-admission-proof.mjs';
import * as S from './alg-l06-p019-admission-semantics-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function proposal(){
 const source=S.readP019CanonicalSource(root),artifacts=S.proposedP019Artifacts(root);
 const entry={key:S.ID,module:`./modules/${S.ID}`,maturity:'private-current-js',
  complexityLane:S.COMPLEXITY_LANE,artifacts};
 const freezeManifest={path:S.FREEZE_PATH,bytes:1,sha256:'1'.repeat(64)};
 const packet={schemaVersion:1,calibrationId:S.CALIBRATION,sourceRoot:S.SOURCE_ROOT,
  scope:'private-engineering',deploymentScope:'local-only',source:S.SOURCE,sourceXml:S.XML,
  selectedPages:[{animationId:S.ID,placementId:S.ID,assetId:`swf-${S.SOURCE.sha256}`,
   sourceSha256:S.SOURCE.sha256,moduleCode:'ALG001',lessonNumber:6,
   globalPageOrdinal:19,sourceOccurrence:19,sectionCode:'VB',sectionPageOrdinal:9,
   complexityLane:S.COMPLEXITY_LANE,runtime:S.p019Runtime(artifacts)}],
  entry,continuousSource:S.CONTINUOUS,optionalSpanishAudio:S.OPTIONAL_SPANISH,
  glossaryActions:S.GLOSSARY,
  integrity:{scope:'P019-source-bound-test',completeTransitiveClosure:false,
   files:uniquePins([...source.localInputs,...Object.values(artifacts)])},
  acceptanceEffects:S.ACCEPTANCE,productCalibrationPassed:false,scaleOutAuthorized:false,
  freezeManifest};
 const registration={calibrationId:S.CALIBRATION,deploymentScope:'local-only',
  freezeManifest:S.FREEZE_PATH,freezeManifestBytes:freezeManifest.bytes,
  freezeManifestSha256:freezeManifest.sha256,entries:[entry]};
 return {source,packet,registration};
}

test('P019 binds VB9, six instance-specific glossary controls, morph mask and four table pairs',()=>{
 const {source,packet,registration}=proposal();
 assert.equal(source.frames.frames.length,351);
 assert.equal(source.text.textInstances.length,38);
 assert.deepEqual(source.source.replacementPlacements.map(x=>[x.frame,x.depth]),
  [[261,36],[261,37]]);
 assert.deepEqual(Object.values(S.GLOSSARY).map(term=>
  [term.sourceKey,term.characterId,term.instances[0].firstFullHitFrame]),[
  ['Function table',8,22],['Input',9,54],['Pair',10,47],['Table',11,29],
  ['Output',19,63],['Function',20,74]]);
 assert.deepEqual(source.text.tableRows.map(row=>
  [row.inputText,row.outputText,row.firstCompletePairFrame]),
  [['2','3',171],['3','5',175],['5','-2',178],['7','1',182]]);
 assert.deepEqual(source.audio.main.zeroPayloadBlocks.map(x=>x.frame),[3]);
 assert.equal(source.canvas.sourceGlyphRendering.preserved,true);
 assert.deepEqual(source.canvas.sourceMorphCharacterIds,[25]);
 assert.equal(S.validateP019AdmissionSemantics(packet,registration,root),true);
 if(source.localInputs.some(x=>x.path===S.ARTIFACT_PATHS.runtime))
  assert.deepEqual(S.readP019Artifacts(root),S.proposedP019Artifacts(root));
});

test('P019 refuses shifted page, early source key, changed table, SA autoplay and acceptance',()=>{
 const {packet,registration}=proposal();
 for(const mutate of [
  p=>{p.selectedPages[0].globalPageOrdinal=18;},
  p=>{p.selectedPages[0].runtime.frameCount=350;},
  p=>{p.selectedPages[0].runtime.hostPlaybackCompletion=true;},
  p=>{p.continuousSource.mainRangeFrames=[[2,168],[182,351]];},
  p=>{p.continuousSource.zeroPayloadBlockFrames=[];},
  p=>{p.optionalSpanishAudio.localeAutoplay=true;},
  p=>{p.optionalSpanishAudio.mainStreamSpliced=true;},
  p=>{p.glossaryActions.Input.entryId='input-variable';},
  p=>{p.glossaryActions.Pair.instances[0].firstFullHitFrame=2;},
  p=>{p.glossaryActions.Function.originalClickObserved=true;},
  p=>{p.acceptanceEffects.ownerAccepted=true;},
  p=>{p.entry.artifacts.runtime.sha256='0'.repeat(64);},
  p=>{p.integrity.files=p.integrity.files.filter(x=>x.path!==S.FRAME_AUDIT.path);},
  p=>{p.integrity.files=p.integrity.files.filter(x=>x.path!==S.CROSSWALK.path);},
  p=>{p.integrity.files.push({path:'apps/web/lib/g678-admission-activation.ts',
   bytes:1,sha256:'0'.repeat(64)});},
 ]){
  const changed=structuredClone(packet);mutate(changed);
  assert.throws(()=>S.validateP019AdmissionSemantics(changed,registration,root));
 }
 assert.throws(()=>S.validateP019AdmissionSemantics(packet,
  {...registration,freezeManifestSha256:'0'.repeat(64)},root));
});
