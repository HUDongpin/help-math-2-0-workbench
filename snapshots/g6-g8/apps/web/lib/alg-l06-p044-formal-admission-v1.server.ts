import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import {algL6P044CandidateDescriptor} from './alg-l06-p044-candidate-v1.server';
import {P044_ID as ID,p044LocalDevelopment}
 from './alg-l06-p044-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor}
 from './whole-lesson-player-descriptor';

const CALIBRATION='g678-alg-l06-p044-current-js-20261002-v1';
const PROOF=`work/g678-workflow/candidates/${ID}-proof-v1.json`;
const SWF='50952b58f10d24b5d649930817aff9f6b779ebb1f698f14392eda00d8afdec34';
const XML='9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c';
const SA='11784e80c090326e9d4f2863ae54d1bcd25d454a4e325d76516f415e377e3abb';
const CANVAS='26a7c58ba4f7ce018ffd8d1f552ecb8d63fa6d480eef7721a14cd8ba36cce01b';
const demand=(ok:unknown,why:string)=>{
 if(!ok)throw Error('P044_FORMAL_DESCRIPTOR_INVALID: '+why);
};

/** The formally registered P044 projection, with every independent gate open. */
export function algL6P044FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p044LocalDevelopment(),'exact local development and physical source scope');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),tx=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(index.pages.length>=34&&index.pages[33].animationId===ID&&
  own.length===1&&own[0].proof.path===PROOF,
  'one P044 proof after 33 source-ordered predecessors');
 const entries:{key:string}[]=tx.registry.calibrations.flatMap(
  (c:{entries:{key:string}[]})=>c.entries);
 demand(entries.filter(e=>e.key===ID).length===1&&
  entries.filter(e=>e.key.startsWith('shared-')).length>=524,
  'one actual P044 shared registry entry');
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
   `work/g678-shared-page-factory/alg-l06-p044-maintained-canvas-v1-20261002-v1/members/${ID}/canvas-renderer.js`&&
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
  page.globalPageOrdinal===44&&page.sourceOccurrence===44&&
  page.sectionCode==='TI'&&page.sectionPageOrdinal===3&&
  runtime.frameDomain==='sprite-354'&&runtime.frameCount===275&&
  runtime.rootFrameCount===10&&runtime.rootBeginFrame===6&&
  runtime.quizHoldFrame===53&&runtime.terminalFrame===275&&
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
  packet.acceptanceEffects&&
  Object.values(packet.acceptanceEffects).every(value=>value===false),
  'physical source, independent streams, and acceptance boundary');
 const candidate=algL6P044CandidateDescriptor();
 demand(candidate.pages.length===60&&
  candidate.productBridge.registeredAnimationCount===47&&
  candidate.pages[43].animationId===ID&&
  candidate.pages[43].rendererAvailability.kind==='registered'&&
  candidate.glossary.filter(entry=>entry.id==='relation').length===1&&
  candidate.glossary.filter(entry=>entry.id==='function').length===1,
  'one integrated source-ordered P044 page and deduplicated glossary');
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
