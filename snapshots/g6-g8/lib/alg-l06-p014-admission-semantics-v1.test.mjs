import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {uniquePins} from './g678-admission-proof.mjs';
import * as S from './alg-l06-p014-admission-semantics-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function proposal(){
 const source=S.readP014CanonicalSource(root),artifacts=S.proposedP014Artifacts(root);
 const entry={key:S.ID,module:`./modules/${S.ID}`,maturity:'private-current-js',
  complexityLane:S.COMPLEXITY_LANE,artifacts};
 const freezeManifest={path:S.FREEZE_PATH,bytes:1,sha256:'1'.repeat(64)};
 const packet={schemaVersion:1,calibrationId:S.CALIBRATION,
  sourceRoot:S.SOURCE_ROOT,scope:'private-engineering',deploymentScope:'local-only',
  source:S.SOURCE,sourceXml:S.XML,
  selectedPages:[{animationId:S.ID,placementId:S.ID,assetId:`swf-${S.SOURCE.sha256}`,
   sourceSha256:S.SOURCE.sha256,moduleCode:'ALG001',lessonNumber:6,
   globalPageOrdinal:14,sourceOccurrence:14,sectionCode:'VB',sectionPageOrdinal:4,
   complexityLane:S.COMPLEXITY_LANE,runtime:S.p014Runtime(artifacts)}],
  entry,continuousSource:S.CONTINUOUS,optionalSpanishAudio:S.OPTIONAL_SPANISH,
  glossaryActions:S.GLOSSARY,
  integrity:{scope:'P014-source-bound-test',completeTransitiveClosure:false,
   files:uniquePins([...source.localInputs,...Object.values(artifacts)])},
  acceptanceEffects:S.ACCEPTANCE,productCalibrationPassed:false,scaleOutAuthorized:false,
  freezeManifest};
 const registration={calibrationId:S.CALIBRATION,deploymentScope:'local-only',
  freezeManifest:S.FREEZE_PATH,freezeManifestBytes:freezeManifest.bytes,
  freezeManifestSha256:freezeManifest.sha256,entries:[entry]};
 return {source,packet,registration};
}

test('P014 physical source and proposal preserve seven feedback domains and malformed trailer',()=>{
 const {source,packet,registration}=proposal();
 assert.equal(source.audit.catalog.globalOrdinal,14);
 assert.equal(source.behavior.mainQuizHold.frame,120);
 assert.equal(source.audio.streamCount,8);
 assert.deepEqual(source.audio.streams.find(x=>x.domain==='sprite-227')
  .contiguousRanges.map(x=>[x.firstFrame,x.lastFrame]),[[2,110],[125,449]]);
 assert.equal(source.audit.warningReconciliation.unresolvedBinaryTail[0].bytes,386);
 assert.equal(source.canvas.sourceAudioTrailer.includedInTaggedAudio,false);
 assert.equal(source.browser.results.every(x=>x.playbackStarted===false),true);
 assert.equal(source.canvas.sourceGlyphRendering.nativeBinding,'semantic-flow-companion');
 assert.equal(S.validateP014AdmissionSemantics(packet,registration,root),true);
});

test('P014 packet rejects branch, audio, SA, terminal and acceptance inflation',()=>{
 const {packet,registration}=proposal();
 for(const mutate of [
  p=>{p.selectedPages[0].globalPageOrdinal=13;},
  p=>{p.selectedPages[0].runtime.frameCount=448;},
  p=>{p.selectedPages[0].runtime.quizHoldFrame=119;},
  p=>{p.selectedPages[0].runtime.terminalPolicy='original-runtime-end';},
  p=>{p.continuousSource.mainRangeFrames=[[2,449]];},
  p=>{p.continuousSource.feedbackDomains.wrong[0][1]=23;},
  p=>{p.continuousSource.unresolvedTrailer.appendedToAudio=true;},
  p=>{p.continuousSource.branchPlaybackScheduleResolved=true;},
  p=>{p.optionalSpanishAudio.localeAutoplay=true;},
  p=>{p.optionalSpanishAudio.mainStreamSpliced=true;},
  p=>{p.glossaryActions.Output.entryId='input';},
  p=>{p.acceptanceEffects.audioAccepted=true;},
  p=>{p.entry.artifacts.module.sha256='0'.repeat(64);},
  p=>{p.integrity.files=p.integrity.files.filter(x=>x.path!==S.BEHAVIOR_AUDIT.path);},
  p=>{p.integrity.files.push({path:'packages/demos/private-current-js-registry.json',
   bytes:1,sha256:'0'.repeat(64)});},
  p=>{p.canonicalRun={path:'invented',bytes:1,sha256:'0'.repeat(64)};},
 ]){
  const changed=structuredClone(packet);mutate(changed);
  assert.throws(()=>S.validateP014AdmissionSemantics(changed,registration,root));
 }
 assert.throws(()=>S.validateP014AdmissionSemantics(packet,
  {...registration,freezeManifestSha256:'0'.repeat(64)},root));
});

test('P014 physical member reader never treats the proposal as a copied member',()=>{
 const member=path.join(root,S.ARTIFACT_PATHS.runtime);
 if(existsSync(member))
  assert.deepEqual(S.readP014Artifacts(root).runtime,S.proposedP014Artifacts(root).runtime);
 else assert.throws(()=>S.readP014Artifacts(root),{code:'ENOENT'});
});
