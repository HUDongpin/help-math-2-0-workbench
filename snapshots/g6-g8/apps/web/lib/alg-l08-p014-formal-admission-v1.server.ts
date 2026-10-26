import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {validateP014Admission,P014_CALIBRATION}
 from '../../../lib/alg-l08-p014-admission-semantics-v1.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import {algL08CurrentDescriptor} from './alg-l08-current-descriptor-v1.server';
import {P014_ID as ID,p014LocalDevelopment} from './alg-l08-p014-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const PROOF=`work/g678-workflow/candidates/${ID}-proof-v1.json`;
function demand(ok:unknown,why:string):asserts ok{
 if(!ok)throw Error(`ALG_L08_P014_FORMAL_INVALID: ${why}`);
}
export function algL08P014FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p014LocalDevelopment(),'exact local source scope');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),transaction=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(own.length===1&&own[0].proof.path===PROOF,
  'one P014 proof in the current admission index');
 const packet=readPageProof(root,own[0].proof,host,transaction),
  proof=readJsonPin(root,own[0].proof),registration=proof.registration,
  entry=registration.entries[0],meta=localOnlyAnimationModuleRegistration(ID);
 demand(registration.calibrationId===P014_CALIBRATION&&
  registration.deploymentScope==='local-only'&&registration.entries.length===1&&
  entry.key===ID&&entry.module==='./modules/shared-alg001-l08-p014'&&
  entry.maturity==='private-current-js'&&entry.complexityLane==='interactive-understood'&&
  meta?.calibrationId===P014_CALIBRATION&&
  meta.freezeManifestSha256===registration.freezeManifestSha256&&
  meta.moduleSha256===entry.artifacts.module.sha256&&
  meta.timelineSha256===entry.artifacts.timeline.sha256&&
  meta.rendererBindingKind==='maintained-dom-module-v1'&&
  meta.memberManifestSha256===entry.artifacts.memberManifest.sha256&&
  meta.sourceRunSha256===entry.artifacts.sourceRun.sha256&&
  isDeepStrictEqual(packet.entry,entry),'current registry and dispatch');
 validateP014Admission(root,packet,registration);
 const candidate=algL08CurrentDescriptor();
 demand(candidate.pages.length===50&&candidate.pages[13].animationId===ID&&
  candidate.pages[13].globalPageOrdinal===14&&candidate.pages[13].sectionCode==='VB'&&
  candidate.pages[13].sectionPageOrdinal===8&&candidate.pages[13].rendererAvailability.kind==='registered'&&
  candidate.pages[13].source.sourceOccurrence===14&&
  candidate.pages[13].source.assetId==='swf-7272413d6a2aef903ac2df6778172ef5448bde2bae73e9fc227a70e5ce354e15'&&
  candidate.productBridge.selectedAnimationIds.filter(key=>key===ID).length===1&&
  candidate.productBridge.registeredAnimationCount===candidate.productBridge.selectedAnimationIds.length,
  'one source-ordered Current-JS page');
 return Object.freeze({...candidate,descriptorId:`${candidate.descriptorId}:${P014_CALIBRATION}`,
  calibrationId:P014_CALIBRATION,releaseId:P014_CALIBRATION,
  course:Object.freeze({...candidate.course,
   href:`/migration-status/g678-calibration/${ID}/registered-v1`}),
  source:Object.freeze({...candidate.source,candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...candidate.persistence,
   storageKey:`${candidate.persistence.storageKey}:${P014_CALIBRATION}`})});
}

export{algL08CurrentRegisteredSharedCount}from'./alg-l08-current-descriptor-v1.server';
