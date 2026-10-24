import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import {algL6P043CandidateDescriptor} from './alg-l06-p043-candidate-v1.server';
import {P043_ID as ID,p043LocalDevelopment}
 from './alg-l06-p043-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor}
 from './whole-lesson-player-descriptor';

const CALIBRATION='g678-alg-l06-p043-current-js-20261002-v2';
const PROOF=`work/g678-workflow/candidates/${ID}-proof-v2.json`;
const SWF='8bec405895d09cc8f7dd9f0da197f67726cb45cab6cc8dec3d15b103bc04a97b';
const CANVAS='4ef3fd48ec83ba97542791832682e0a14aabec52611d7a4f6f0750e5b4852de5';
const SA='dfd986d3c9d1615b2456c5a9b5ebc2d24ab3b5d22f1b1d6f20df9aa886fcadf1';
const demand=(ok:unknown,why:string)=>{
 if(!ok)throw Error('P043_FORMAL_DESCRIPTOR_INVALID: '+why);
};

/** One proof-backed P043 projection on the formally admitted P042 lesson. */
export function algL6P043FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p043LocalDevelopment(),'exact local development and physical source scope');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),tx=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(index.pages.length>=33&&index.pages[32].animationId===ID&&
  own.length===1&&own[0].proof.path===PROOF,
  'one P043 proof after 32 source-ordered predecessors');
 const entries:{key:string}[]=tx.registry.calibrations.flatMap(
  (c:{entries:{key:string}[]})=>c.entries);
 demand(entries.filter(e=>e.key===ID).length===1&&
  entries.filter(e=>e.key.startsWith('shared-')).length>=523,
  'one actual P043 shared registry entry');
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
    `work/g678-shared-page-factory/alg-l06-p043-maintained-canvas-v1-20261002-v1/members/${ID}/canvas-renderer.js`&&
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
  page.globalPageOrdinal===43&&page.sourceOccurrence===43&&
  page.sectionCode==='TI'&&page.sectionPageOrdinal===2&&
  runtime.frameDomain==='sprite-342'&&runtime.frameCount===241&&
  runtime.rootFrameCount===10&&runtime.rootBeginFrame===6&&
  runtime.quizHoldFrame===62&&runtime.terminalFrame===241&&
  runtime.hostPlaybackCompletion===false&&
  runtime.originalRuntimeTimingAccepted===false,
  'source occurrence, state frame bounds and open timing gate');
 demand(packet.source.sha256===SWF&&packet.sourceXml.sha256===
  '9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'&&
  packet.optionalSpanishAudio.source.sha256===SA&&
  packet.optionalSpanishAudio.trigger==='explicit-user-only'&&
  packet.optionalSpanishAudio.localeAutoplay===false&&
  packet.optionalSpanishAudio.mainStreamSpliced===false&&
  packet.optionalSpanishAudio.audioAccepted===false&&
  packet.audio.embeddedStreamCount===3&&
  packet.acceptanceEffects&&
  Object.values(packet.acceptanceEffects).every(value=>value===false),
  'physical source, independent streams, and acceptance boundary');
 const candidate=algL6P043CandidateDescriptor();
 demand(candidate.pages.length===60&&
  candidate.productBridge.registeredAnimationCount===46&&
  candidate.pages[42].animationId===ID&&
  candidate.pages[42].rendererAvailability.kind==='registered'&&
  candidate.glossary.filter(entry=>entry.id==='equation').length===1&&
  candidate.glossary.filter(entry=>entry.id==='estimate').length===1,
  'one integrated source-ordered P043 page and deduplicated glossary');
 return Object.freeze({...candidate,
  descriptorId:`${candidate.descriptorId}:${CALIBRATION}`,
  calibrationId:CALIBRATION,releaseId:CALIBRATION,
  source:Object.freeze({...candidate.source,
   candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...candidate.persistence,
   storageKey:`${candidate.persistence.storageKey}:${CALIBRATION}`})});
}
