import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {validateP060Admission,P060_CALIBRATION}
 from '../../../lib/alg-l07-p060-admission-semantics-v1.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import {algL07CurrentDescriptor} from './alg-l07-current-descriptor-v1.server';
import {P060_ID as ID,p060LocalDevelopment} from './alg-l07-p060-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const PROOF=`work/g678-workflow/candidates/${ID}-proof-v1.json`;
function demand(ok:unknown,why:string):asserts ok{
 if(!ok)throw Error(`ALG_L07_P060_FORMAL_INVALID: ${why}`);
}
export function algL07P060FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p060LocalDevelopment(),'exact local source scope');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),transaction=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(own.length===1&&own[0].proof.path===PROOF,
  'one P060 proof in the current admission index');
 const packet=readPageProof(root,own[0].proof,host,transaction),
  proof=readJsonPin(root,own[0].proof),registration=proof.registration,
  entry=registration.entries[0],meta=localOnlyAnimationModuleRegistration(ID);
 demand(registration.calibrationId===P060_CALIBRATION&&
  registration.deploymentScope==='local-only'&&registration.entries.length===1&&
  entry.key===ID&&entry.module==='./modules/shared-alg001-l07-p060'&&
  entry.maturity==='private-current-js'&&entry.complexityLane==='behavior-heavy'&&
  meta?.calibrationId===P060_CALIBRATION&&
  meta.freezeManifestSha256===registration.freezeManifestSha256&&
  meta.moduleSha256===entry.artifacts.module.sha256&&
  meta.timelineSha256===entry.artifacts.timeline.sha256&&
  meta.rendererBindingKind==='maintained-dom-module-v1'&&
  meta.memberManifestSha256===entry.artifacts.memberManifest.sha256&&
  meta.sourceRunSha256===entry.artifacts.sourceRun.sha256&&
  isDeepStrictEqual(packet.entry,entry),'current registry and dispatch');
 validateP060Admission(root,packet,registration);
 const candidate=algL07CurrentDescriptor();
 demand(candidate.pages.length===62&&candidate.pages[59].animationId===ID&&
  candidate.pages[59].globalPageOrdinal===60&&candidate.pages[59].sectionCode==='TS'&&
  candidate.pages[59].sectionPageOrdinal===8&&candidate.pages[59].rendererAvailability.kind==='registered'&&
  candidate.productBridge.selectedAnimationIds.filter(key=>key===ID).length===1&&
  candidate.productBridge.registeredAnimationCount===candidate.productBridge.selectedAnimationIds.length,
  'one source-ordered Current-JS page');
 return Object.freeze({...candidate,descriptorId:`${candidate.descriptorId}:${P060_CALIBRATION}`,
  calibrationId:P060_CALIBRATION,releaseId:P060_CALIBRATION,
  course:Object.freeze({...candidate.course,
   href:`/migration-status/g678-calibration/${ID}/registered-v1`}),
  source:Object.freeze({...candidate.source,candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...candidate.persistence,
   storageKey:`${candidate.persistence.storageKey}:${P060_CALIBRATION}`})});
}

export{algL07CurrentRegisteredSharedCount}from'./alg-l07-current-descriptor-v1.server';
