import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion} from '../../../lib/g678-admission-proof.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import {algL6P047CandidateDescriptor} from './alg-l06-p047-candidate-v1.server';
import {P047_ID as ID,p047LocalDevelopment} from './alg-l06-p047-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
const CALIBRATION='g678-alg-l06-p047-current-js-20261002-v1';
const PROOF=`work/g678-workflow/candidates/${ID}-proof-v1.json`;
const demand=(ok:unknown,why:string)=>{if(!ok)throw Error('P047_FORMAL_DESCRIPTOR_INVALID: '+why);};
/** One actual registry member and unchanged source-matching My Lesson behavior. */
export function algL6P047FormalDescriptor():PageOnlyLessonPlayerDescriptor {
 demand(p047LocalDevelopment(),'exact development source scope');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),tx=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(index.pages.length>=37&&index.pages[36].animationId===ID&&own.length===1&&own[0].proof.path===PROOF,'one P047 after 36 preserved proofs');
 const packet=readPageProof(root,own[0].proof,host,tx),proof=readJsonPin(root,own[0].proof),
  registration=proof.registration,entry=registration.entries[0],meta=localOnlyAnimationModuleRegistration(ID),
  page=packet.selectedPages[0],runtime=page.runtime;
 demand(registration.calibrationId===CALIBRATION&&registration.deploymentScope==='local-only'&&
  registration.entries.length===1&&entry.key===ID&&entry.module===`./modules/${ID}`&&
  entry.maturity==='private-current-js'&&entry.complexityLane==='behavior-heavy'&&
  meta?.calibrationId===CALIBRATION&&meta.freezeManifestSha256===registration.freezeManifestSha256&&
  meta.moduleSha256===entry.artifacts.module.sha256&&meta.timelineSha256===entry.artifacts.timeline.sha256&&
  meta.runtimeSha256===entry.artifacts.runtime.sha256&&isDeepStrictEqual(packet.entry,entry),'actual entry and dispatch');
 demand(packet.source.sha256==='7fdbb16bcea020b3a28ada7d0bfbed26d077b339a914a86f493feb6827a9e893'&&
  packet.sourceXml.sha256==='9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'&&
  entry.artifacts.runtime.sha256==='d959f374bb092f72efb20b8a80695539c681edbcbc0ab5e55d4f79483fe7eaf7'&&
  page.animationId===ID&&page.sourceSha256===packet.source.sha256&&page.globalPageOrdinal===47&&
  page.sectionCode==='TI'&&page.sectionPageOrdinal===6&&runtime.frameDomain==='sprite-117'&&
  runtime.frameCount===890&&runtime.quizHoldFrame===208&&runtime.terminalFrame===889&&
  runtime.rootFrameCount===10&&runtime.rootBeginFrame===6&&runtime.hostPlaybackCompletion===false&&
  runtime.originalRuntimeTimingAccepted===false,'exact source occurrence and frame domains');
 demand(isDeepStrictEqual(packet.quiz.answers,['6','–3','0','–4','6'])&&
  packet.quiz.wrongFeedbackSprite===70&&packet.quiz.rightFeedbackSprite===72&&packet.quiz.feedbackFrames===20&&
  packet.quiz.independentFeedbackClocks===true&&
  isDeepStrictEqual(packet.quiz.acceptedTargets,[[1,5],[2],[3],[4],[1,5]])&&packet.quiz.occupiedTargetsUnavailable===true&&packet.audio.embeddedStreamCount===3&&
  packet.optionalSpanishAudio.source.sha256==='88e7c0f01e0569f5c8c828561669c87b4e468dbd218deca399db09bdb418448e'&&
  packet.optionalSpanishAudio.trigger==='explicit-user-only'&&packet.optionalSpanishAudio.localeAutoplay===false&&
  packet.optionalSpanishAudio.mainStreamSpliced===false&&Object.values(packet.acceptanceEffects).every(v=>v===false),'source semantics and independent gates');
 const candidate=algL6P047CandidateDescriptor();
 demand(candidate.pages.length===60&&candidate.productBridge.registeredAnimationCount===50&&
  candidate.pages[46].animationId===ID&&candidate.pages[46].rendererAvailability.kind==='registered','50 source-ordered runnable pages');
 return Object.freeze({...candidate,descriptorId:`${candidate.descriptorId}:${CALIBRATION}`,
  calibrationId:CALIBRATION,releaseId:CALIBRATION,
  course:Object.freeze({...candidate.course,href:`/migration-status/g678-calibration/${ID}/registered-v1`}),
  source:Object.freeze({...candidate.source,candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...candidate.persistence,storageKey:`${candidate.persistence.storageKey}:${CALIBRATION}`})});
}
