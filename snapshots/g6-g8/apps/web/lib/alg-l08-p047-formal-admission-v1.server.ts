import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {validateP047Admission,P047_CALIBRATION}
 from '../../../lib/alg-l08-p047-admission-semantics-v1.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import {algL08CurrentDescriptor,algL08CurrentDescriptorAsync} from './alg-l08-current-descriptor-v1.server';
import {P047_ID as ID,p047LocalDevelopment} from './alg-l08-p047-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

function demand(ok:unknown,why:string):asserts ok{
 if(!ok)throw Error(`ALG_L08_P047_FORMAL_INVALID: ${why}`);
}
export function algL08P047FormalDescriptor():PageOnlyLessonPlayerDescriptor {
 return buildP047FormalDescriptor();
}
export async function algL08P047FormalDescriptorAsync():Promise<PageOnlyLessonPlayerDescriptor> {
 if(!p047LocalDevelopment())throw Error('ALG_L08_P047_ASYNC_SCOPE');
 return buildP047FormalDescriptor(await algL08CurrentDescriptorAsync());
}
function buildP047FormalDescriptor(verifiedDescriptor?:PageOnlyLessonPlayerDescriptor):PageOnlyLessonPlayerDescriptor {
 demand(p047LocalDevelopment(),'exact local source scope');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),transaction=readRegistryTransaction(root);
 demand(host.files.some((p:{path:string})=>p.path==='apps/web/lib/alg-l08-p047-formal-admission-v1.server.ts')&&
  host.files.some((p:{path:string})=>p.path==='apps/web/app/[locale]/migration-status/g678-calibration/shared-alg001-l08-p047/registered-v1/page.tsx'),
  'registered route and formal server belong to current host');
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(own.length===1,
  'one P047 proof in the current admission index');
 const packet=readPageProof(root,own[0].proof,host,transaction),
  proof=readJsonPin(root,own[0].proof),registration=proof.registration,
  entry=registration.entries[0],meta=localOnlyAnimationModuleRegistration(ID);
 demand(registration.calibrationId===P047_CALIBRATION&&
  registration.deploymentScope==='local-only'&&registration.entries.length===1&&
  entry.key===ID&&entry.module==='./modules/shared-alg001-l08-p047'&&
  entry.maturity==='private-current-js'&&entry.complexityLane==='behavior-heavy'&&
  meta?.calibrationId===P047_CALIBRATION&&
  meta.freezeManifestSha256===registration.freezeManifestSha256&&
  meta.moduleSha256===entry.artifacts.module.sha256&&
  meta.timelineSha256===entry.artifacts.timeline.sha256&&
  meta.rendererBindingKind==='maintained-dom-module-v1'&&
  meta.memberManifestSha256===entry.artifacts.memberManifest.sha256&&
  meta.sourceRunSha256===entry.artifacts.sourceRun.sha256&&
  isDeepStrictEqual(packet.entry,entry),'current registry and dispatch');
 validateP047Admission(root,packet,registration);
 const candidate=verifiedDescriptor??algL08CurrentDescriptor();
 demand(candidate.pages.length===50&&candidate.pages[46].animationId===ID&&
  candidate.pages[46].globalPageOrdinal===47&&candidate.pages[46].sectionCode==='TS'&&
  candidate.pages[46].sectionPageOrdinal===7&&candidate.pages[46].rendererAvailability.kind==='registered'&&
  candidate.pages[46].source.sourceOccurrence===47&&
  candidate.pages[46].source.assetId==='swf-805ce1d4ffc602b347c172618009e69fabac57cd776d1d32ded46c89bc67945c'&&
  candidate.productBridge.selectedAnimationIds.filter(key=>key===ID).length===1&&
  candidate.productBridge.registeredAnimationCount===candidate.productBridge.selectedAnimationIds.length,
  'one source-ordered Current-JS page');
 return Object.freeze({...candidate,descriptorId:`${candidate.descriptorId}:${P047_CALIBRATION}`,
  calibrationId:P047_CALIBRATION,releaseId:P047_CALIBRATION,
  course:Object.freeze({...candidate.course,
   href:`/migration-status/g678-calibration/${ID}/registered-v1`}),
  source:Object.freeze({...candidate.source,candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...candidate.persistence,
   storageKey:`${candidate.persistence.storageKey}:${P047_CALIBRATION}`})});
}

export{algL08CurrentRegisteredSharedCount}from'./alg-l08-current-descriptor-v1.server';
