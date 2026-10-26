import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {validateP022Admission,P022_CALIBRATION}
 from '../../../lib/alg-l08-p022-admission-semantics-v1.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import {algL08CurrentDescriptor} from './alg-l08-current-descriptor-v1.server';
import {P022_ID as ID,p022LocalDevelopment} from './alg-l08-p022-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const PROOF=`work/g678-workflow/candidates/${ID}-proof-v1.json`;
function demand(ok:unknown,why:string):asserts ok{
 if(!ok)throw Error(`ALG_L08_P022_FORMAL_INVALID: ${why}`);
}
export function algL08P022FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p022LocalDevelopment(),'exact local source scope');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),transaction=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(own.length===1&&own[0].proof.path===PROOF,
  'one P022 proof in the current admission index');
 const packet=readPageProof(root,own[0].proof,host,transaction),
  proof=readJsonPin(root,own[0].proof),registration=proof.registration,
  entry=registration.entries[0],meta=localOnlyAnimationModuleRegistration(ID);
 demand(registration.calibrationId===P022_CALIBRATION&&
  registration.deploymentScope==='local-only'&&registration.entries.length===1&&
  entry.key===ID&&entry.module==='./modules/shared-alg001-l08-p022'&&
  entry.maturity==='private-current-js'&&entry.complexityLane==='interactive-understood'&&
  meta?.calibrationId===P022_CALIBRATION&&
  meta.freezeManifestSha256===registration.freezeManifestSha256&&
  meta.moduleSha256===entry.artifacts.module.sha256&&
  meta.timelineSha256===entry.artifacts.timeline.sha256&&
  meta.rendererBindingKind==='maintained-dom-module-v1'&&
  meta.memberManifestSha256===entry.artifacts.memberManifest.sha256&&
  meta.sourceRunSha256===entry.artifacts.sourceRun.sha256&&
  isDeepStrictEqual(packet.entry,entry),'current registry and dispatch');
 validateP022Admission(root,packet,registration);
 const candidate=algL08CurrentDescriptor();
 demand(candidate.pages.length===50&&candidate.pages[21].animationId===ID&&
  candidate.pages[21].globalPageOrdinal===22&&candidate.pages[21].sectionCode==='IN'&&
  candidate.pages[21].sectionPageOrdinal===6&&candidate.pages[21].rendererAvailability.kind==='registered'&&
  candidate.pages[21].source.sourceOccurrence===22&&
  candidate.pages[21].source.assetId==='swf-7c831f0e3bb42c28b5a82fa72a4cc28519cc813efe8b23bef2e0aae2c2ee35d5'&&
  candidate.productBridge.selectedAnimationIds.filter(key=>key===ID).length===1&&
  candidate.productBridge.registeredAnimationCount===candidate.productBridge.selectedAnimationIds.length,
  'one source-ordered Current-JS page');
 return Object.freeze({...candidate,descriptorId:`${candidate.descriptorId}:${P022_CALIBRATION}`,
  calibrationId:P022_CALIBRATION,releaseId:P022_CALIBRATION,
  course:Object.freeze({...candidate.course,
   href:`/migration-status/g678-calibration/${ID}/registered-v1`}),
  source:Object.freeze({...candidate.source,candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...candidate.persistence,
   storageKey:`${candidate.persistence.storageKey}:${P022_CALIBRATION}`})});
}

export{algL08CurrentRegisteredSharedCount}from'./alg-l08-current-descriptor-v1.server';
