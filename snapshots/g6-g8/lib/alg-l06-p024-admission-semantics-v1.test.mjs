import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ACCEPTANCE,BINDING,CALIBRATION,FREEZE_PATH,ID,PROOF_PATH,SA,SOURCE,
 p024ProposedEntry,p024Runtime,proposedP024Artifacts,readP024CanonicalSource,
 validateP024Page} from './alg-l06-p024-admission-semantics-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const core=item=>({path:item.path,bytes:item.bytes,sha256:item.sha256});
const feedback=[
 [69,'wrong',1,31,22,23,31],[83,'wrong',2,29,23,24,29],
 [97,'wrong',3,28,20,21,28],[123,'right',3,31,null,null,31],
 [155,'right',1,25,null,null,25],[188,'right',4,27,null,null,27],
 [196,'right',2,27,null,null,27],
].map(([id,kind,variant,frames,stop,closeGoto,terminal])=>
 ({id:`sprite-${id}`,kind,variant,frames,stop,closeGoto,terminal}));

function fixture(source){
 const entry=p024ProposedEntry(root,source),freezeManifest={path:FREEZE_PATH,bytes:100,
  sha256:'a'.repeat(64)};
 const page={schemaVersion:1,calibrationId:CALIBRATION,sourceRoot:SOURCE_ROOT,
  scope:'private-engineering',deploymentScope:'local-only',source:SOURCE,sourceXml:XML,
  selectedPages:[{animationId:ID,placementId:ID,assetId:`swf-${SOURCE.sha256}`,
   sourceSha256:SOURCE.sha256,moduleCode:'ALG001',lessonNumber:6,
   globalPageOrdinal:24,sourceOccurrence:24,sectionCode:'VB',sectionPageOrdinal:14,
   complexityLane:'behavior-heavy',runtime:p024Runtime(entry.artifacts)}],entry,
  continuousSource:{audit:source.binding.audio,plan:source.binding.audioPlan,
   mainFrameDomain:'sprite-208',mainFrames:381,quizStopFrame:154,
   domainAssets:source.plan.domains.map(row=>({id:row.id,frames:row.declaredFrames,
    asset:core(row.extractedMp3)})),independentDomains:true,concatenated:false,
   branchCoverageComplete:false,originalRuntimeAccepted:false,
   listeningAccepted:false,audioAccepted:false},feedbackSource:feedback,
  optionalSpanishAudio:{source:SA,trigger:'explicit-user-only',localeAutoplay:false,
   mainStreamSpliced:false,audioAccepted:false},glossaryActions:source.glossary,
  integrity:{completeTransitiveClosure:false,files:source.localInputs},
  acceptanceEffects:ACCEPTANCE,productCalibrationPassed:false,
  scaleOutAuthorized:false,freezeManifest};
 const registration={calibrationId:CALIBRATION,deploymentScope:'local-only',
  freezeManifest:FREEZE_PATH,freezeManifestBytes:100,
  freezeManifestSha256:'a'.repeat(64),entries:[entry]};
 return {page,registration};
}

// Local source is intentionally read each time by the validator; the fixture only
// avoids repeatedly constructing the future producer's not-yet-frozen packet.
import {SOURCE_ROOT,XML} from './alg-l06-p024-admission-semantics-v1.mjs';
test('P024 source locks 177+4 candidate pins and adds physical SA as fifth proof external',()=>{
 const source=readP024CanonicalSource(root);
 assert.deepEqual(source.binding.source,SOURCE);
 assert.deepEqual(source.binding.external.length,4);
 assert.deepEqual(source.binding.files.length,177);
 assert.deepEqual(source.external.length,5);
 assert.deepEqual(source.external.at(-1),{root:SOURCE_ROOT,pin:SA});
 assert.deepEqual(source.localInputs.length,179);
 assert.deepEqual(Object.keys(source.glossary),
  ['Range','Function','Output','Set','Function table']);
 assert.deepEqual(Object.values(source.glossary).flatMap(row=>row.instances.map(x=>x.firstReadyFrame)),
  [7,134,7,109,7,7,80]);
 assert.deepEqual(source.artifacts,proposedP024Artifacts(root,source.canvas));
 assert.equal(source.binding.acceptanceEffects.originalRuntime,false);
 assert.equal(source.binding.limits.branchCoveragePending,true);
 assert.equal(BINDING.path,'output/alg-l06-p024-host-prep-v5/candidate-source-binding-v1.json');
 assert.equal(PROOF_PATH,`work/g678-workflow/candidates/${ID}-proof-v1.json`);
});

test('P024 proposed page validates eight domains, quiz/feedback branches, glossary and false gates',()=>{
 const source=readP024CanonicalSource(root),{page,registration}=fixture(source);
 assert.equal(validateP024Page(page,registration,root),true);
 assert.deepEqual(page.feedbackSource.filter(row=>row.kind==='right')
  .sort((a,b)=>a.variant-b.variant).map(row=>row.id),
  ['sprite-155','sprite-196','sprite-123','sprite-188']);
 assert.equal(page.continuousSource.domainAssets.length,8);
 assert.equal(page.selectedPages[0].runtime.quizStopFrame,154);
});

test('P024 admission rejects changed quiz, wrong Close, separate SA and missing source input',()=>{
 const source=readP024CanonicalSource(root),{page,registration}=fixture(source);
 const changedQuiz=structuredClone(page);
 changedQuiz.selectedPages[0].runtime.quizStopFrame=155;
 assert.throws(()=>validateP024Page(changedQuiz,registration,root),/deep-equal/);
 const changedClose=structuredClone(page);
 changedClose.feedbackSource[0].closeGoto=24;
 assert.throws(()=>validateP024Page(changedClose,registration,root),/deep-equal/);
 const changedSa=structuredClone(page);
 changedSa.optionalSpanishAudio.localeAutoplay=true;
 assert.throws(()=>validateP024Page(changedSa,registration,root),/deep-equal/);
 const missingInput=structuredClone(page);
 missingInput.integrity.files=missingInput.integrity.files.filter(row=>row.path!==BINDING.path);
 assert.throws(()=>validateP024Page(missingInput,registration,root),/current P024 producer input/);
});

test('P024 admission rejects claim escalation and registration identity drift',()=>{
 const source=readP024CanonicalSource(root),{page,registration}=fixture(source);
 const claim=structuredClone(page);claim.acceptanceEffects={...claim.acceptanceEffects,audioAccepted:true};
 assert.throws(()=>validateP024Page(claim,registration,root),/deep-equal/);
 const changedRegistration=structuredClone(registration);
 changedRegistration.entries[0].artifacts.runtime.sha256='0'.repeat(64);
 assert.throws(()=>validateP024Page(page,changedRegistration,root),/deep-equal/);
});
