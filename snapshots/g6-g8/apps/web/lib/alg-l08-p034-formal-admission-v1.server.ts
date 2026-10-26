import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {validateP034Admission,P034_CALIBRATION}
 from '../../../lib/alg-l08-p034-admission-semantics-v1.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import {algL08CurrentDescriptor,algL08CurrentDescriptorAsync} from './alg-l08-current-descriptor-v1.server';
import {P034_ID as ID,p034LocalDevelopment} from './alg-l08-p034-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

function demand(ok:unknown,why:string):asserts ok{
 if(!ok)throw Error(`ALG_L08_P034_FORMAL_INVALID: ${why}`);
}
export function algL08P034FormalDescriptor():PageOnlyLessonPlayerDescriptor {
 return buildP034FormalDescriptor();
}
export async function algL08P034FormalDescriptorAsync():Promise<PageOnlyLessonPlayerDescriptor> {
 if(!p034LocalDevelopment())throw Error('ALG_L08_P034_ASYNC_SCOPE');
 return buildP034FormalDescriptor(await algL08CurrentDescriptorAsync());
}
function buildP034FormalDescriptor(verifiedDescriptor?:PageOnlyLessonPlayerDescriptor):PageOnlyLessonPlayerDescriptor {
 demand(p034LocalDevelopment(),'exact local source scope');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),transaction=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(own.length===1,
  'one P034 proof in the current admission index');
 const packet=readPageProof(root,own[0].proof,host,transaction),
  proof=readJsonPin(root,own[0].proof),registration=proof.registration,
  entry=registration.entries[0],meta=localOnlyAnimationModuleRegistration(ID);
 demand(registration.calibrationId===P034_CALIBRATION&&
  registration.deploymentScope==='local-only'&&registration.entries.length===1&&
  entry.key===ID&&entry.module==='./modules/shared-alg001-l08-p034'&&
  entry.maturity==='private-current-js'&&entry.complexityLane==='behavior-heavy'&&
  meta?.calibrationId===P034_CALIBRATION&&
  meta.freezeManifestSha256===registration.freezeManifestSha256&&
  meta.moduleSha256===entry.artifacts.module.sha256&&
  meta.timelineSha256===entry.artifacts.timeline.sha256&&
  meta.rendererBindingKind==='maintained-dom-module-v1'&&
  meta.memberManifestSha256===entry.artifacts.memberManifest.sha256&&
  meta.sourceRunSha256===entry.artifacts.sourceRun.sha256&&
  isDeepStrictEqual(packet.entry,entry),'current registry and dispatch');
 validateP034Admission(root,packet,registration);
 const candidate=verifiedDescriptor??algL08CurrentDescriptor();
 demand(candidate.pages.length===50&&candidate.pages[33].animationId===ID&&
  candidate.pages[33].globalPageOrdinal===34&&candidate.pages[33].sectionCode==='TI'&&
  candidate.pages[33].sectionPageOrdinal===5&&candidate.pages[33].rendererAvailability.kind==='registered'&&
  candidate.pages[33].source.sourceOccurrence===34&&
  candidate.pages[33].source.assetId==='swf-794afc62ac6c5505cdcc9b28b72c56ea7d57e0d85c9eba4bd64b78c835495a5f'&&
  candidate.productBridge.selectedAnimationIds.filter(key=>key===ID).length===1&&
  candidate.productBridge.registeredAnimationCount===candidate.productBridge.selectedAnimationIds.length,
  'one source-ordered Current-JS page');
 return Object.freeze({...candidate,descriptorId:`${candidate.descriptorId}:${P034_CALIBRATION}`,
  calibrationId:P034_CALIBRATION,releaseId:P034_CALIBRATION,
  course:Object.freeze({...candidate.course,
   href:`/migration-status/g678-calibration/${ID}/registered-v1`}),
  source:Object.freeze({...candidate.source,candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...candidate.persistence,
   storageKey:`${candidate.persistence.storageKey}:${P034_CALIBRATION}`})});
}

export{algL08CurrentRegisteredSharedCount}from'./alg-l08-current-descriptor-v1.server';
