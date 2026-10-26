import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {validateP035Admission,P035_CALIBRATION}
 from '../../../lib/alg-l08-p035-admission-semantics-v1.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import {algL08CurrentDescriptor,algL08CurrentDescriptorAsync} from './alg-l08-current-descriptor-v1.server';
import {P035_ID as ID,p035LocalDevelopment} from './alg-l08-p035-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

function demand(ok:unknown,why:string):asserts ok{
 if(!ok)throw Error(`ALG_L08_P035_FORMAL_INVALID: ${why}`);
}
export function algL08P035FormalDescriptor():PageOnlyLessonPlayerDescriptor {
 return buildP035FormalDescriptor();
}
export async function algL08P035FormalDescriptorAsync():Promise<PageOnlyLessonPlayerDescriptor> {
 if(!p035LocalDevelopment())throw Error('ALG_L08_P035_ASYNC_SCOPE');
 return buildP035FormalDescriptor(await algL08CurrentDescriptorAsync());
}
function buildP035FormalDescriptor(verifiedDescriptor?:PageOnlyLessonPlayerDescriptor):PageOnlyLessonPlayerDescriptor {
 demand(p035LocalDevelopment(),'exact local source scope');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),transaction=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(own.length===1,
  'one P035 proof in the current admission index');
 const packet=readPageProof(root,own[0].proof,host,transaction),
  proof=readJsonPin(root,own[0].proof),registration=proof.registration,
  entry=registration.entries[0],meta=localOnlyAnimationModuleRegistration(ID);
 demand(registration.calibrationId===P035_CALIBRATION&&
  registration.deploymentScope==='local-only'&&registration.entries.length===1&&
  entry.key===ID&&entry.module==='./modules/shared-alg001-l08-p035'&&
  entry.maturity==='private-current-js'&&entry.complexityLane==='behavior-heavy'&&
  meta?.calibrationId===P035_CALIBRATION&&
  meta.freezeManifestSha256===registration.freezeManifestSha256&&
  meta.moduleSha256===entry.artifacts.module.sha256&&
  meta.timelineSha256===entry.artifacts.timeline.sha256&&
  meta.rendererBindingKind==='maintained-dom-module-v1'&&
  meta.memberManifestSha256===entry.artifacts.memberManifest.sha256&&
  meta.sourceRunSha256===entry.artifacts.sourceRun.sha256&&
  isDeepStrictEqual(packet.entry,entry),'current registry and dispatch');
 validateP035Admission(root,packet,registration);
 const candidate=verifiedDescriptor??algL08CurrentDescriptor();
 demand(candidate.pages.length===50&&candidate.pages[34].animationId===ID&&
  candidate.pages[34].globalPageOrdinal===35&&candidate.pages[34].sectionCode==='TI'&&
  candidate.pages[34].sectionPageOrdinal===6&&candidate.pages[34].rendererAvailability.kind==='registered'&&
  candidate.pages[34].source.sourceOccurrence===35&&
  candidate.pages[34].source.assetId==='swf-b8afe5101df7e70f29bd85a762745711638fe8e1152378673acc06b6e4585e09'&&
  candidate.productBridge.selectedAnimationIds.filter(key=>key===ID).length===1&&
  candidate.productBridge.registeredAnimationCount===candidate.productBridge.selectedAnimationIds.length,
  'one source-ordered Current-JS page');
 return Object.freeze({...candidate,descriptorId:`${candidate.descriptorId}:${P035_CALIBRATION}`,
  calibrationId:P035_CALIBRATION,releaseId:P035_CALIBRATION,
  course:Object.freeze({...candidate.course,
   href:`/migration-status/g678-calibration/${ID}/registered-v1`}),
  source:Object.freeze({...candidate.source,candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...candidate.persistence,
   storageKey:`${candidate.persistence.storageKey}:${P035_CALIBRATION}`})});
}

export{algL08CurrentRegisteredSharedCount}from'./alg-l08-current-descriptor-v1.server';
