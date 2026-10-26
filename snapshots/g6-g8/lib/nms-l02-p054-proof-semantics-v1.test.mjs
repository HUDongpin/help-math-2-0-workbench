import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import * as S from './nms-l02-p054-proof-semantics-v1.mjs';

const root=path.resolve(import.meta.dirname,'..');
const read=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const clone=value=>structuredClone(value);
const order=values=>[...values].sort((a,b)=>a.localeCompare(b));
const dummyPin=(relative,character='a')=>({path:relative,bytes:1,sha256:character.repeat(64)});
const pinMap=values=>new Map(values.map(value=>[value.path,value]));
const run=read(S.P054_RUN_PATH);

function fixture(){
 const artifacts={kind:'maintained-dom-module-v1',module:S.P054_DOM_MODULE,
  timeline:S.P054_DOM_TIMELINE,sourceRun:S.P054_DOM_RUN,
  memberManifest:S.P054_DOM_MEMBER};
 const entry={key:S.P054_ADMISSION_ID,module:`./modules/${S.P054_ADMISSION_ID}`,
  maturity:'private-current-js',complexityLane:'behavior-heavy',artifacts};
 const support=S.P054_PAGE_SUPPORT_PATHS.map(relative=>dummyPin(relative));
 const ownPins=pinMap([...run.inputs,...run.outputs,S.P054_DOM_RUN,S.P054_DOM_MEMBER,
  ...support]);
 const own=order([...ownPins.keys()]).map(relative=>ownPins.get(relative));
 const resources=order([...run.reveal,...run.audio.feedback].map(item=>item.path))
  .map(relative=>pinMap([...run.reveal,...run.audio.feedback]).get(relative));
 const packet={schemaVersion:1,calibrationId:S.P054_ADMISSION_CALIBRATION,
  sourceRoot:S.P054_SOURCE_ROOT,scope:'private-engineering',deploymentScope:'local-only',
  source:S.P054_SOURCE,sourceXml:S.P054_XML,
  selectedPages:[{animationId:S.P054_ADMISSION_ID,placementId:S.P054_ADMISSION_ID,
   assetId:`swf-${S.P054_SOURCE.sha256}`,stableLessonKey:'shared-nms002-l02',
   sourceSha256:S.P054_SOURCE.sha256,moduleCode:'NMS002',lessonNumber:2,
   globalPageOrdinal:54,sourceOccurrence:54,sectionCode:'GS',sectionPageOrdinal:2,
   complexityLane:'behavior-heavy',runtime:S.P054_RUNTIME}],entry,
  sourceAudits:S.P054_REVIEWED_SOURCE_PINS,
  resources:{artRoot:S.P054_ART_ROOT,audioRoot:S.P054_AUDIO_ROOT,
   audioManifest:S.P054_AUDIO_MANIFEST,externalPins:resources,feedback:S.P054_FEEDBACK,
   revealCount:24,resultMusicActivated:false,lessonSaActivated:false},
  behavior:{levels:2,cardsPerLevel:12,pairsPerLevel:6,scoreCorrect:10,scoreWrong:-2,
   scoreFloor:'none-in-source-card-handlers',level1Entry:'default',
   level2Entry:'explicit-local-choice',earlierP053EntryReachabilityEstablished:false,
   correctFeedback:{spriteId:194,startFrame:2,terminalFrame:27},
   wrongFeedback:{spriteId:208,startFrame:2,terminalFrame:31},
   feedbackTiming:'source-script-based-maintained-clock-not-original-schedule',
   terminalOutcome:'terminal-unresolved',parentResultTransitionEstablished:false,
   hostPlaybackCompletion:false,sourceTimelineSeekAvailable:false,
   originalRuntimeParityEstablished:false,sourceRepeatIsReplay:false,
   feedbackAutoPlayOnMount:false,spanishAudioSubstitution:false},
  glossary:[],sourceKeyAttributeCalls:0,
  integrity:{scope:'single-NMS-L02-P054-source-and-implementation',
   completeTransitiveClosure:false,
   qualification:'L7GS03 early entry and terminal-unresolved parent outcome remain unproven.',
   files:own,sharedDependencies:S.P054_SHARED_DEPENDENCIES},
  acceptanceEffects:S.P054_ACCEPTANCE_EFFECTS,
  productCalibrationPassed:false,scaleOutAuthorized:false};
 const freeze=dummyPin(S.P054_FREEZE_PATH,'b');
 const fragment=dummyPin(S.P054_FRAGMENT_PATH,'c');
 const registration={calibrationId:S.P054_ADMISSION_CALIBRATION,
  deploymentScope:'local-only',freezeManifest:S.P054_FREEZE_PATH,
  freezeManifestBytes:freeze.bytes,freezeManifestSha256:freeze.sha256,entries:[entry]};
 const files=order([...own,freeze,fragment].map(item=>item.path))
  .map(relative=>pinMap([...own,freeze,fragment]).get(relative));
 const external=run.externalEvidence.map(item=>item.path.startsWith(`${S.P054_SOURCE_ROOT}/`)
  ? {root:S.P054_SOURCE_ROOT,pin:{...item,path:path.relative(S.P054_SOURCE_ROOT,item.path)}}
  : {root:path.dirname(item.path),pin:{...item,path:path.basename(item.path)}});
 return{schemaVersion:1,kind:'nms-l02-page-proof-v1',
  hostContract:'nms-l02-source-bound-host-v1',animationId:S.P054_ADMISSION_ID,
  freeze,packet,registration,files,external};
}

test('sealed P054 DOM and candidate evidence match literal physical pins',()=>{
 for(const pin of [S.P054_DOM_RUN,S.P054_DOM_MEMBER,S.P054_DOM_MODULE,
  S.P054_DOM_TIMELINE,...S.P054_REVIEWED_CORE_INPUTS]){
  const bytes=fs.readFileSync(path.join(root,pin.path));
  assert.equal(bytes.length,pin.bytes,pin.path);
  assert.equal(hash(bytes),pin.sha256,pin.path);
 }
 assert.deepEqual(run.inputs.length,S.P054_DOM_INPUT_COUNT);
 assert.equal(hash(JSON.stringify(run.inputs)),S.P054_DOM_INPUTS_SEAL);
 assert.deepEqual(run.externalEvidence.length,S.P054_DOM_EXTERNAL_COUNT);
 assert.equal(hash(JSON.stringify(run.externalEvidence)),S.P054_DOM_EXTERNAL_SEAL);
 for(const pin of run.externalEvidence){
  const bytes=fs.readFileSync(pin.path);
  assert.equal(bytes.length,pin.bytes,pin.path);
  assert.equal(hash(bytes),pin.sha256,pin.path);
 }
 assert.deepEqual(run.sharedDependencies,S.P054_SHARED_DEPENDENCIES);
 assert.deepEqual(run.outputs,[S.P054_DOM_MODULE,S.P054_DOM_TIMELINE]);
 assert.equal(fs.realpathSync(S.P054_SOURCE_ROOT),S.P054_SOURCE_ROOT);
 for(const pin of [S.P054_SOURCE,S.P054_XML]){
  const bytes=fs.readFileSync(path.join(S.P054_SOURCE_ROOT,pin.path));
  assert.equal(bytes.length,pin.bytes,pin.path);
  assert.equal(hash(bytes),pin.sha256,pin.path);
 }
});

test('risk disposition and actual browser paths stay local and terminal-unresolved',()=>{
 const disposition=read(S.P054_DISPOSITION.path);
 const main=read(S.P054_BROWSER_MAIN.path);
 const pending=read(S.P054_BROWSER_PENDING_MEDIA.path);
 assert.equal(S.validateP054Disposition(disposition),true);
 assert.equal(S.validateP054BrowserEvidence(main,pending),true);
 for(const change of [
  value=>{value.behavior.terminalPhase='complete';},
  value=>{value.behavior.hostCompletion=true;},
  value=>{value.riskCases[0].originalRuntimeEstablished=true;},
  value=>{value.mediaLifecycle.audioListeningAccepted=true;},
  value=>{value.acceptanceEffects.audioAccepted=true;},
 ]){const drift=clone(disposition);change(drift);
  assert.throws(()=>S.validateP054Disposition(drift));}
 const badMain=clone(main);
 badMain.cases[1].observations.find(row=>row.label==='correct-feedback-end-6').score=60;
 assert.throws(()=>S.validateP054BrowserEvidence(badMain,pending),/es-mobile-reduced-level2/);
 const badPending=clone(pending);
 badPending.cases[0].navigationAbort[0].failure='late-play';
 assert.throws(()=>S.validateP054BrowserEvidence(main,badPending),/en-level1/);
});

test('one exact GS2 proof accepts its closed 59/61/30 sets and rejects drift',()=>{
 const base=fixture();
 assert.equal(base.packet.integrity.files.length,59);
 assert.equal(base.files.length,61);
 assert.equal(base.external.length,30);
 assert.equal(S.validateP054ProofClosure(base),true);
 for(const change of [
  value=>{value.packet.selectedPages[0].sourceOccurrence=53;},
  value=>{value.packet.selectedPages[0].runtime.frameDomain='root';},
  value=>{value.packet.behavior.hostPlaybackCompletion=true;},
  value=>{value.packet.acceptanceEffects.fidelityAccepted=true;},
  value=>{value.packet.integrity.sharedDependencies[0].sha256='f'.repeat(64);},
  value=>{value.packet.integrity.files.find(item=>item.path===S.P054_DISPOSITION.path).sha256='f'.repeat(64);},
  value=>{value.packet.integrity.files.pop();},
  value=>{value.files.pop();},
  value=>{value.external[0].pin.sha256='f'.repeat(64);},
  value=>{value.external[0].root='/tmp';},
 ]){const drift=clone(base);change(drift);
  assert.throws(()=>S.validateP054ProofClosure(drift));}
});
