import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {createHash} from 'node:crypto';
import * as S from './nms-l02-p064-admission-semantics-v1.mjs';

const root=path.resolve(import.meta.dirname,'..');
const read=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const clone=value=>structuredClone(value);
function presentation(){
 const source=fs.readFileSync(path.join(root,S.P064_PRESENTATION.path),'utf8');
 const begin=source.indexOf('JSON.parse(')+11,end=source.lastIndexOf(') as P064PresentationData');
 assert(begin>=11&&end>begin,'maintained generated presentation shape');
 return JSON.parse(JSON.parse(source.slice(begin,end)));
}
function sourceInventory(){return{contract:read(S.P064_QUIZ_CONTRACT.path),
 questionIr:read(S.P064_QUESTION_IR.path),displayList:read(S.P064_DISPLAY_LIST.path),
 presentation:presentation()};}
const fakePin=(relative,character='a')=>({path:relative,bytes:1,sha256:character.repeat(64)});
const ordered=values=>[...values].sort((a,b)=>a.localeCompare(b));

function proofFixture(){
 const artifacts={kind:'maintained-dom-module-v1',
  module:fakePin(S.P064_CANONICAL_MODULE_PATH),
  timeline:fakePin(S.P064_CANONICAL_TIMELINE_PATH),
  sourceRun:fakePin(S.P064_RUN_PATH),
  memberManifest:fakePin(S.P064_MEMBER_PATH)};
 const entry={key:S.P064_ADMISSION_ID,module:`./modules/${S.P064_ADMISSION_ID}`,
  maturity:'private-current-js',complexityLane:'behavior-heavy',artifacts};
 const required=new Map(S.P064_REQUIRED_PAGE_PATHS.map(value=>[value,fakePin(value)]));
 for(const pin of S.P064_REVIEWED_CORE_INPUTS)required.set(pin.path,pin);
 for(const pin of [artifacts.module,artifacts.timeline,artifacts.sourceRun,
  artifacts.memberManifest])required.set(pin.path,pin);
 const files=ordered([...required.keys()]).map(value=>required.get(value));
 const freeze=fakePin(S.P064_FREEZE_PATH,'b'),fragment=fakePin(S.P064_FRAGMENT_PATH,'c');
 const packet={schemaVersion:1,calibrationId:S.P064_ADMISSION_CALIBRATION,
  sourceRoot:S.P064_SOURCE_ROOT,scope:'private-engineering',deploymentScope:'local-only',
  source:S.P064_SOURCE,sourceXml:S.P064_XML,
  selectedPages:[{animationId:S.P064_ADMISSION_ID,placementId:S.P064_ADMISSION_ID,
   assetId:`swf-${S.P064_SOURCE.sha256}`,stableLessonKey:'shared-nms002-l02',
   sourceSha256:S.P064_SOURCE.sha256,moduleCode:'NMS002',lessonNumber:2,
   globalPageOrdinal:64,sourceOccurrence:64,sectionCode:'FQ',sectionPageOrdinal:2,
   complexityLane:'behavior-heavy',runtime:S.P064_RUNTIME}],entry,
  sourceQuiz:{contract:S.P064_QUIZ_CONTRACT,questionIr:S.P064_QUESTION_IR,
   displayList:S.P064_DISPLAY_LIST,presentation:S.P064_PRESENTATION,
   scripts:S.P064_SCRIPT_AUDIT,bankSize:35,drawCount:10,optionCount:4,
   answerMapSha256:S.P064_ANSWER_MAP_SHA256},
  behavior:{disposition:S.P064_DISPOSITION,sourceRiskModule:S.P064_SOURCE_RISK_MODULE,
   quizState:S.P064_QUIZ_STATE,quizComponent:S.P064_QUIZ_COMPONENT,
   hostScore:S.P064_HOST_SCORE,runtimeAdapter:S.P064_RUNTIME_ADAPTER,
   productModule:S.P064_PRODUCT_MODULE,browserMain:S.P064_BROWSER_MAIN,
   browserReviewBranches:S.P064_BROWSER_REVIEW_BRANCHES,
   postReviewHostExitResolved:false,hostPlaybackCompletion:false,
   deterministicSelectionOriginalRngParity:false},
  audio:{sourceIndex:S.P064_AUDIO_INDEX,acceptedCueCount:0,
   sourceAlignmentAccepted:false,listeningAccepted:false,localeAutoPlayback:false,
   originalHostAssociationEstablished:false},
  glossary:[],sourceKeyAttributeCalls:0,
  integrity:{scope:'single-NMS-L02-P064-source-and-implementation',
   completeTransitiveClosure:false,
   qualification:'Q5 modern number line; Q10/Q21/Q23 review-name risks; host-exit unresolved.',
   files,sharedDependencies:S.P064_SHARED_DEPENDENCIES},
  acceptanceEffects:S.P064_ACCEPTANCE_EFFECTS,
  productCalibrationPassed:false,scaleOutAuthorized:false};
 const registration={calibrationId:S.P064_ADMISSION_CALIBRATION,
  deploymentScope:'local-only',freezeManifest:S.P064_FREEZE_PATH,
  freezeManifestBytes:freeze.bytes,freezeManifestSha256:freeze.sha256,entries:[entry]};
 return{schemaVersion:1,kind:'nms-l02-page-proof-v1',
  hostContract:'nms-l02-source-bound-host-v1',animationId:S.P064_ADMISSION_ID,
  freeze,packet,registration,
  files:ordered([...files.map(value=>value.path),freeze.path,fragment.path]).map(value=>
   value===freeze.path?freeze:value===fragment.path?fragment:required.get(value)),
  external:[{root:S.P064_SOURCE_ROOT,pin:S.P064_SOURCE},
   {root:S.P064_SOURCE_ROOT,pin:S.P064_XML}]};
}

test('reviewed P064 source, maintained quiz and browser evidence retain exact bytes',()=>{
 for(const pin of S.P064_REVIEWED_CORE_INPUTS){
  const bytes=fs.readFileSync(path.join(root,pin.path));
  assert.equal(bytes.length,pin.bytes,pin.path);
  assert.equal(sha(bytes),pin.sha256,pin.path);
 }
 const physical=path.join(S.P064_SOURCE_ROOT,S.P064_SOURCE.path);
 assert.equal(fs.realpathSync(S.P064_SOURCE_ROOT),S.P064_SOURCE_ROOT);
 assert.equal(fs.statSync(physical).size,S.P064_SOURCE.bytes);
 assert.equal(sha(fs.readFileSync(physical)),S.P064_SOURCE.sha256);
});

test('all 35x4 options, frames, correct answers, source scripts and Q5 fields are checked',()=>{
 const source=sourceInventory();
 assert.equal(S.validateP064SourceInventory(source),true);
 const changed=clone(source);
 changed.questionIr.questions[34].options[3].instance.name='A35Opt4-synthetic';
 assert.throws(()=>S.validateP064SourceInventory(changed),/Q35 option D/);
 const wrongKey=clone(source);
 wrongKey.presentation.questions[20].options[2].correct=true;
 assert.throws(()=>S.validateP064SourceInventory(wrongKey),/Q21 option C/);
 const q5=clone(source);
 q5.questionIr.questions[4].frameDeltaPlacements.find(row=>row.name==='Txt10').rawText='1';
 assert.throws(()=>S.validateP064SourceInventory(q5),/Q5 source defaults/);
 const scripts=clone(source);
 scripts.contract.scripts.wrongOptionHandlers=104;
 assert.throws(()=>S.validateP064SourceInventory(scripts),/159 exact source script/);
});

test('risk disposition and actual host branch receipts cannot become acceptance',()=>{
 const disposition=read(S.P064_DISPOSITION.path);
 assert.equal(S.validateP064Disposition(disposition),true);
 assert.equal(S.validateP064BrowserEvidence(read(S.P064_BROWSER_MAIN.path),
  read(S.P064_BROWSER_REVIEW_BRANCHES.path)),true);
 for(const change of [
  value=>{value.riskCases[0].sourceEquivalenceClaimed=true;},
  value=>{value.riskCases[1].feedbackFieldLookup='matched-in-static-source';},
  value=>{value.riskCases[2].feedbackFieldLookup='missing-in-static-source';},
  value=>{value.postReview.hostPlaybackCompletionCallbackFired=true;},
  value=>{value.answerSemantics.deterministicCandidateRngOriginalParityEstablished=true;},
  value=>{value.acceptanceEffects.fidelityAccepted=true;},
 ]){const drift=clone(disposition);change(drift);
  assert.throws(()=>S.validateP064Disposition(drift));}
 const branch=read(S.P064_BROWSER_REVIEW_BRANCHES.path);
 branch.cases[1].hostPageMarkedComplete='true';
 assert.throws(()=>S.validateP064BrowserEvidence(read(S.P064_BROWSER_MAIN.path),branch),
  /es-mobile-q23-c/);
});

test('local proof accepts one exact FQ2 entry and rejects source, host, acceptance and closure drift',()=>{
 const base=proofFixture();
 assert.equal(S.validateP064ProofClosure(base),true);
 for(const change of [
  value=>{value.packet.selectedPages[0].sourceOccurrence=63;},
  value=>{value.packet.selectedPages[0].runtime.frameDomain='root';},
  value=>{value.packet.behavior.postReviewHostExitResolved=true;},
  value=>{value.packet.audio.listeningAccepted=true;},
  value=>{value.packet.acceptanceEffects.ownerAccepted=true;},
  value=>{value.packet.integrity.files.find(pin=>pin.path===S.P064_DISPOSITION.path).sha256='f'.repeat(64);},
  value=>{value.proofDummy=true;value.files.pop();},
 ]){const drift=clone(base);change(drift);
  assert.throws(()=>S.validateP064ProofClosure(drift));}
});
