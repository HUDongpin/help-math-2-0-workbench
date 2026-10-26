import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion} from '../../../lib/g678-admission-proof.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import {algL6P046CandidateDescriptor} from './alg-l06-p046-candidate-v1.server';
import {P046_ID as ID,p046LocalDevelopment} from './alg-l06-p046-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
const CALIBRATION='g678-alg-l06-p046-current-js-20261002-v1';
const PROOF=`work/g678-workflow/candidates/${ID}-proof-v2.json`;
const demand=(ok:unknown,why:string)=>{if(!ok)throw Error('P046_FORMAL_DESCRIPTOR_INVALID: '+why);};
/** One actual registry member and unchanged source-matching My Lesson behavior. */
export function algL6P046FormalDescriptor():PageOnlyLessonPlayerDescriptor {
 demand(p046LocalDevelopment(),'exact development source scope');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),tx=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(index.pages.length>=36&&index.pages[35].animationId===ID&&own.length===1&&own[0].proof.path===PROOF,'one P046 after 35 preserved proofs');
 const packet=readPageProof(root,own[0].proof,host,tx),proof=readJsonPin(root,own[0].proof),
  registration=proof.registration,entry=registration.entries[0],meta=localOnlyAnimationModuleRegistration(ID),
  page=packet.selectedPages[0],runtime=page.runtime;
 demand(registration.calibrationId===CALIBRATION&&registration.deploymentScope==='local-only'&&
  registration.entries.length===1&&entry.key===ID&&entry.module===`./modules/${ID}`&&
  entry.maturity==='private-current-js'&&entry.complexityLane==='behavior-heavy'&&
  meta?.calibrationId===CALIBRATION&&meta.freezeManifestSha256===registration.freezeManifestSha256&&
  meta.moduleSha256===entry.artifacts.module.sha256&&meta.timelineSha256===entry.artifacts.timeline.sha256&&
  meta.runtimeSha256===entry.artifacts.runtime.sha256&&isDeepStrictEqual(packet.entry,entry),'actual entry and dispatch');
 demand(packet.source.sha256==='c69f1f0fdaff0201af171aaee6b9b90a33b483e8c93ffef406c31cf0853a54b8'&&
  packet.sourceXml.sha256==='9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'&&
  entry.artifacts.runtime.sha256==='888a3e9f41e236eda7b4d0fe9c04a0aaa38d9e12bdbdbe844cc6d1e12a5272d6'&&
  page.animationId===ID&&page.sourceSha256===packet.source.sha256&&page.globalPageOrdinal===46&&
  page.sectionCode==='TI'&&page.sectionPageOrdinal===5&&runtime.frameDomain==='sprite-123'&&
  runtime.frameCount===743&&runtime.quizHoldFrame===163&&runtime.terminalFrame===743&&
  runtime.rootFrameCount===10&&runtime.rootBeginFrame===6&&runtime.hostPlaybackCompletion===false&&
  runtime.originalRuntimeTimingAccepted===false,'exact source occurrence and frame domains');
 demand(isDeepStrictEqual(packet.quiz.answers,['–3','–8','0','4','6'])&&
  packet.quiz.wrongFeedbackSprite===61&&packet.quiz.rightFeedbackSprite===63&&packet.quiz.feedbackFrames===20&&
  packet.quiz.independentFeedbackClocks===true&&packet.audio.embeddedStreamCount===3&&
  packet.optionalSpanishAudio.source.sha256==='de3c127ba68d082b9a296fb17cb31a72f477f460fde01b8e3370402bb414f18e'&&
  packet.optionalSpanishAudio.trigger==='explicit-user-only'&&packet.optionalSpanishAudio.localeAutoplay===false&&
  packet.optionalSpanishAudio.mainStreamSpliced===false&&Object.values(packet.acceptanceEffects).every(v=>v===false),'source semantics and independent gates');
 const candidate=algL6P046CandidateDescriptor();
 demand(candidate.pages.length===60&&candidate.productBridge.registeredAnimationCount===49&&
  candidate.pages[45].animationId===ID&&candidate.pages[45].rendererAvailability.kind==='registered','49 source-ordered runnable pages');
 return Object.freeze({...candidate,descriptorId:`${candidate.descriptorId}:${CALIBRATION}`,
  calibrationId:CALIBRATION,releaseId:CALIBRATION,
  course:Object.freeze({...candidate.course,href:`/migration-status/g678-calibration/${ID}/registered-v1`}),
  source:Object.freeze({...candidate.source,candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...candidate.persistence,storageKey:`${candidate.persistence.storageKey}:${CALIBRATION}`})});
}
