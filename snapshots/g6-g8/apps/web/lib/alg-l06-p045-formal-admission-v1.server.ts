import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import {algL6P045CandidateDescriptor} from './alg-l06-p045-candidate-v1.server';
import {P045_ID as ID,p045LocalDevelopment}
 from './alg-l06-p045-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor}
 from './whole-lesson-player-descriptor';

const CALIBRATION='g678-alg-l06-p045-current-js-20261002-v1';
const PROOF=`work/g678-workflow/candidates/${ID}-proof-v1.json`;
const SWF='9dfff51a15bb0010b98ca10c1fac954bee5d9451ceb649d8ac202e98f2c05b9d';
const XML='9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c';
const SA='99404ff17adb3498bf64c033a3063077f3dce961ca52dfc8074f8f84f33dc7e7';
const CANVAS='4e9e318fdd503275e8d89b1b462b7e525888f0b0c14ecad3d6c114d18c7d5bc0';
const demand=(ok:unknown,why:string)=>{
 if(!ok)throw Error('P045_FORMAL_DESCRIPTOR_INVALID: '+why);
};

/** The formally registered P045 projection, with every independent gate open. */
export function algL6P045FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p045LocalDevelopment(),'exact local development and physical source scope');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),tx=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(index.pages.length>=35&&index.pages[34].animationId===ID&&
  own.length===1&&own[0].proof.path===PROOF,
  'one P045 proof after 34 source-ordered predecessors');
 const entries:{key:string}[]=tx.registry.calibrations.flatMap(
  (c:{entries:{key:string}[]})=>c.entries);
 demand(entries.filter(e=>e.key===ID).length===1&&
  entries.filter(e=>e.key.startsWith('shared-')).length>=525,
  'one actual P045 shared registry entry');
 const packet=readPageProof(root,own[0].proof,host,tx),
  proof=readJsonPin(root,own[0].proof),registration=proof.registration,
  entry=registration.entries[0],meta=localOnlyAnimationModuleRegistration(ID),
  page=packet.selectedPages[0],runtime=page.runtime;
 demand(registration.calibrationId===CALIBRATION&&
  registration.deploymentScope==='local-only'&&registration.entries.length===1&&
  entry.key===ID&&entry.module===`./modules/${ID}`&&
  entry.maturity==='private-current-js'&&entry.complexityLane==='behavior-heavy'&&
  entry.artifacts.module.path===`packages/demos/src/modules/${ID}.tsx`&&
  entry.artifacts.timeline.path===`packages/demos/src/timelines/${ID}.ts`&&
  entry.artifacts.runtime.path===
   `work/g678-shared-page-factory/alg-l06-p045-maintained-canvas-v1-20261002-v1/members/${ID}/canvas-renderer.js`&&
  entry.artifacts.runtime.sha256===CANVAS&&
  meta?.calibrationId===CALIBRATION&&
  meta.freezeManifestSha256===registration.freezeManifestSha256&&
  meta.moduleSha256===entry.artifacts.module.sha256&&
  meta.timelineSha256===entry.artifacts.timeline.sha256&&
  meta.runtimeSha256===CANVAS&&
  isDeepStrictEqual(packet.entry,entry),
  'exact registry, generated dispatch and maintained drawing');
 demand(page.animationId===ID&&page.placementId===ID&&
  page.sourceSha256===SWF&&page.assetId===`swf-${SWF}`&&
  page.moduleCode==='ALG001'&&page.lessonNumber===6&&
  page.globalPageOrdinal===45&&page.sourceOccurrence===45&&
  page.sectionCode==='TI'&&page.sectionPageOrdinal===4&&
  runtime.frameDomain==='sprite-350'&&runtime.frameCount===167&&
  runtime.rootFrameCount===10&&runtime.rootBeginFrame===6&&
  runtime.quizHoldFrame===53&&runtime.terminalFrame===167&&
  runtime.hostPlaybackCompletion===false&&
  runtime.originalRuntimeTimingAccepted===false,
  'source occurrence, state frame bounds and open timing gate');
 demand(packet.source.sha256===SWF&&packet.sourceXml.sha256===XML&&
  packet.optionalSpanishAudio.source.sha256===SA&&
  packet.optionalSpanishAudio.trigger==='explicit-user-only'&&
  packet.optionalSpanishAudio.localeAutoplay===false&&
  packet.optionalSpanishAudio.mainStreamSpliced===false&&
  packet.optionalSpanishAudio.audioAccepted===false&&
  packet.audio.embeddedStreamCount===3&&
  packet.quiz.correctVisibleChoice==='C'&&
  isDeepStrictEqual(packet.quiz.visibleInstanceMap,{A:'AnsBtn1',B:'AnsBtn3',C:'AnsBtn2',D:'AnsBtn4'})&&
  packet.acceptanceEffects&&
  Object.values(packet.acceptanceEffects).every(value=>value===false),
  'physical source, independent streams, and acceptance boundary');
 const candidate=algL6P045CandidateDescriptor();
 demand(candidate.pages.length===60&&
  candidate.productBridge.registeredAnimationCount===48&&
  candidate.pages[44].animationId===ID&&
  candidate.pages[44].rendererAvailability.kind==='registered'&&
  candidate.glossary.filter(entry=>entry.id==='represent').length===1&&
  candidate.glossary.filter(entry=>entry.id==='function').length===1,
  'one integrated source-ordered P045 page and deduplicated glossary');
 return Object.freeze({...candidate,
  descriptorId:`${candidate.descriptorId}:${CALIBRATION}`,
  calibrationId:CALIBRATION,releaseId:CALIBRATION,
  course:Object.freeze({...candidate.course,
   href:`/migration-status/g678-calibration/${ID}/registered-v1`}),
  source:Object.freeze({...candidate.source,
   candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...candidate.persistence,
   storageKey:`${candidate.persistence.storageKey}:${CALIBRATION}`})});
}
