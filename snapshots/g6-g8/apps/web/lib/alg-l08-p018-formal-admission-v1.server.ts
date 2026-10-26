import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {validateP018Admission,P018_CALIBRATION}
 from '../../../lib/alg-l08-p018-admission-semantics-v1.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import {algL08CurrentDescriptor} from './alg-l08-current-descriptor-v1.server';
import {P018_ID as ID,p018LocalDevelopment} from './alg-l08-p018-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const PROOF=`work/g678-workflow/candidates/${ID}-proof-v1.json`;
function demand(ok:unknown,why:string):asserts ok{
 if(!ok)throw Error(`ALG_L08_P018_FORMAL_INVALID: ${why}`);
}
export function algL08P018FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p018LocalDevelopment(),'exact local source scope');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),transaction=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(own.length===1&&own[0].proof.path===PROOF,
  'one P018 proof in the current admission index');
 const packet=readPageProof(root,own[0].proof,host,transaction),
  proof=readJsonPin(root,own[0].proof),registration=proof.registration,
  entry=registration.entries[0],meta=localOnlyAnimationModuleRegistration(ID);
 demand(registration.calibrationId===P018_CALIBRATION&&
  registration.deploymentScope==='local-only'&&registration.entries.length===1&&
  entry.key===ID&&entry.module==='./modules/shared-alg001-l08-p018'&&
  entry.maturity==='private-current-js'&&entry.complexityLane==='interactive-understood'&&
  meta?.calibrationId===P018_CALIBRATION&&
  meta.freezeManifestSha256===registration.freezeManifestSha256&&
  meta.moduleSha256===entry.artifacts.module.sha256&&
  meta.timelineSha256===entry.artifacts.timeline.sha256&&
  meta.rendererBindingKind==='maintained-dom-module-v1'&&
  meta.memberManifestSha256===entry.artifacts.memberManifest.sha256&&
  meta.sourceRunSha256===entry.artifacts.sourceRun.sha256&&
  isDeepStrictEqual(packet.entry,entry),'current registry and dispatch');
 validateP018Admission(root,packet,registration);
 const candidate=algL08CurrentDescriptor();
 demand(candidate.pages.length===50&&candidate.pages[17].animationId===ID&&
  candidate.pages[17].globalPageOrdinal===18&&candidate.pages[17].sectionCode==='IN'&&
  candidate.pages[17].sectionPageOrdinal===2&&candidate.pages[17].rendererAvailability.kind==='registered'&&
  candidate.pages[17].source.sourceOccurrence===18&&
  candidate.pages[17].source.assetId==='swf-843956b1edfcd2efacaf5da55496b7b496e1eb06acb5ce1dfd5d10c801df0f40'&&
  candidate.productBridge.selectedAnimationIds.filter(key=>key===ID).length===1&&
  candidate.productBridge.registeredAnimationCount===candidate.productBridge.selectedAnimationIds.length,
  'one source-ordered Current-JS page');
 return Object.freeze({...candidate,descriptorId:`${candidate.descriptorId}:${P018_CALIBRATION}`,
  calibrationId:P018_CALIBRATION,releaseId:P018_CALIBRATION,
  course:Object.freeze({...candidate.course,
   href:`/migration-status/g678-calibration/${ID}/registered-v1`}),
  source:Object.freeze({...candidate.source,candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...candidate.persistence,
   storageKey:`${candidate.persistence.storageKey}:${P018_CALIBRATION}`})});
}

export{algL08CurrentRegisteredSharedCount}from'./alg-l08-current-descriptor-v1.server';
