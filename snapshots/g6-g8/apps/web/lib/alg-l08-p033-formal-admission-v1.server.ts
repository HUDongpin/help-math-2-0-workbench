import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {validateP033Admission,P033_CALIBRATION}
 from '../../../lib/alg-l08-p033-admission-semantics-v1.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import {algL08CurrentDescriptor,algL08CurrentDescriptorAsync} from './alg-l08-current-descriptor-v1.server';
import {P033_ID as ID,p033LocalDevelopment} from './alg-l08-p033-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

function demand(ok:unknown,why:string):asserts ok{
 if(!ok)throw Error(`ALG_L08_P033_FORMAL_INVALID: ${why}`);
}
export function algL08P033FormalDescriptor():PageOnlyLessonPlayerDescriptor {
 return buildP033FormalDescriptor();
}
export async function algL08P033FormalDescriptorAsync():Promise<PageOnlyLessonPlayerDescriptor> {
 if(!p033LocalDevelopment())throw Error('ALG_L08_P033_ASYNC_SCOPE');
 return buildP033FormalDescriptor(await algL08CurrentDescriptorAsync());
}
function buildP033FormalDescriptor(verifiedDescriptor?:PageOnlyLessonPlayerDescriptor):PageOnlyLessonPlayerDescriptor {
 demand(p033LocalDevelopment(),'exact local source scope');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),transaction=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(own.length===1,
  'one P033 proof in the current admission index');
 const packet=readPageProof(root,own[0].proof,host,transaction),
  proof=readJsonPin(root,own[0].proof),registration=proof.registration,
  entry=registration.entries[0],meta=localOnlyAnimationModuleRegistration(ID);
 demand(registration.calibrationId===P033_CALIBRATION&&
  registration.deploymentScope==='local-only'&&registration.entries.length===1&&
  entry.key===ID&&entry.module==='./modules/shared-alg001-l08-p033'&&
  entry.maturity==='private-current-js'&&entry.complexityLane==='behavior-heavy'&&
  meta?.calibrationId===P033_CALIBRATION&&
  meta.freezeManifestSha256===registration.freezeManifestSha256&&
  meta.moduleSha256===entry.artifacts.module.sha256&&
  meta.timelineSha256===entry.artifacts.timeline.sha256&&
  meta.rendererBindingKind==='maintained-dom-module-v1'&&
  meta.memberManifestSha256===entry.artifacts.memberManifest.sha256&&
  meta.sourceRunSha256===entry.artifacts.sourceRun.sha256&&
  isDeepStrictEqual(packet.entry,entry),'current registry and dispatch');
 validateP033Admission(root,packet,registration);
 const candidate=verifiedDescriptor??algL08CurrentDescriptor();
 demand(candidate.pages.length===50&&candidate.pages[32].animationId===ID&&
  candidate.pages[32].globalPageOrdinal===33&&candidate.pages[32].sectionCode==='TI'&&
  candidate.pages[32].sectionPageOrdinal===4&&candidate.pages[32].rendererAvailability.kind==='registered'&&
  candidate.pages[32].source.sourceOccurrence===33&&
  candidate.pages[32].source.assetId==='swf-b37cc0a0aedb117cd21c153702545f775045eade5e8f678268e702a3fe465870'&&
  candidate.productBridge.selectedAnimationIds.filter(key=>key===ID).length===1&&
  candidate.productBridge.registeredAnimationCount===candidate.productBridge.selectedAnimationIds.length,
  'one source-ordered Current-JS page');
 return Object.freeze({...candidate,descriptorId:`${candidate.descriptorId}:${P033_CALIBRATION}`,
  calibrationId:P033_CALIBRATION,releaseId:P033_CALIBRATION,
  course:Object.freeze({...candidate.course,
   href:`/migration-status/g678-calibration/${ID}/registered-v1`}),
  source:Object.freeze({...candidate.source,candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...candidate.persistence,
   storageKey:`${candidate.persistence.storageKey}:${P033_CALIBRATION}`})});
}

export{algL08CurrentRegisteredSharedCount}from'./alg-l08-current-descriptor-v1.server';
