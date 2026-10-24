import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {validateP038Admission,P038_CALIBRATION}
 from '../../../lib/alg-l08-p038-admission-semantics-v1.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import {algL08CurrentDescriptor,algL08CurrentDescriptorAsync} from './alg-l08-current-descriptor-v1.server';
import {P038_ID as ID,p038LocalDevelopment} from './alg-l08-p038-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

function demand(ok:unknown,why:string):asserts ok{
 if(!ok)throw Error(`ALG_L08_P038_FORMAL_INVALID: ${why}`);
}
export function algL08P038FormalDescriptor():PageOnlyLessonPlayerDescriptor {
 return buildP038FormalDescriptor();
}
export async function algL08P038FormalDescriptorAsync():Promise<PageOnlyLessonPlayerDescriptor> {
 if(!p038LocalDevelopment())throw Error('ALG_L08_P038_ASYNC_SCOPE');
 return buildP038FormalDescriptor(await algL08CurrentDescriptorAsync());
}
function buildP038FormalDescriptor(verifiedDescriptor?:PageOnlyLessonPlayerDescriptor):PageOnlyLessonPlayerDescriptor {
 demand(p038LocalDevelopment(),'exact local source scope');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),transaction=readRegistryTransaction(root);
 demand(host.files.some((p:{path:string})=>p.path==='apps/web/lib/alg-l08-p038-formal-admission-v1.server.ts')&&
  host.files.some((p:{path:string})=>p.path==='apps/web/app/[locale]/migration-status/g678-calibration/shared-alg001-l08-p038/registered-v1/page.tsx'),
  'registered route and formal server belong to current host');
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(own.length===1,
  'one P038 proof in the current admission index');
 const packet=readPageProof(root,own[0].proof,host,transaction),
  proof=readJsonPin(root,own[0].proof),registration=proof.registration,
  entry=registration.entries[0],meta=localOnlyAnimationModuleRegistration(ID);
 demand(registration.calibrationId===P038_CALIBRATION&&
  registration.deploymentScope==='local-only'&&registration.entries.length===1&&
  entry.key===ID&&entry.module==='./modules/shared-alg001-l08-p038'&&
  entry.maturity==='private-current-js'&&entry.complexityLane==='behavior-heavy'&&
  meta?.calibrationId===P038_CALIBRATION&&
  meta.freezeManifestSha256===registration.freezeManifestSha256&&
  meta.moduleSha256===entry.artifacts.module.sha256&&
  meta.timelineSha256===entry.artifacts.timeline.sha256&&
  meta.rendererBindingKind==='maintained-dom-module-v1'&&
  meta.memberManifestSha256===entry.artifacts.memberManifest.sha256&&
  meta.sourceRunSha256===entry.artifacts.sourceRun.sha256&&
  isDeepStrictEqual(packet.entry,entry),'current registry and dispatch');
 validateP038Admission(root,packet,registration);
 const candidate=verifiedDescriptor??algL08CurrentDescriptor();
 demand(candidate.pages.length===50&&candidate.pages[37].animationId===ID&&
  candidate.pages[37].globalPageOrdinal===38&&candidate.pages[37].sectionCode==='TI'&&
  candidate.pages[37].sectionPageOrdinal===9&&candidate.pages[37].rendererAvailability.kind==='registered'&&
  candidate.pages[37].source.sourceOccurrence===38&&
  candidate.pages[37].source.assetId==='swf-e77e92b6cd1cebd8b330ab853a377bf7913b7c3911acc195ceb929150deaff0b'&&
  candidate.productBridge.selectedAnimationIds.filter(key=>key===ID).length===1&&
  candidate.productBridge.registeredAnimationCount===candidate.productBridge.selectedAnimationIds.length,
  'one source-ordered Current-JS page');
 return Object.freeze({...candidate,descriptorId:`${candidate.descriptorId}:${P038_CALIBRATION}`,
  calibrationId:P038_CALIBRATION,releaseId:P038_CALIBRATION,
  course:Object.freeze({...candidate.course,
   href:`/migration-status/g678-calibration/${ID}/registered-v1`}),
  source:Object.freeze({...candidate.source,candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...candidate.persistence,
   storageKey:`${candidate.persistence.storageKey}:${P038_CALIBRATION}`})});
}

export{algL08CurrentRegisteredSharedCount}from'./alg-l08-current-descriptor-v1.server';
