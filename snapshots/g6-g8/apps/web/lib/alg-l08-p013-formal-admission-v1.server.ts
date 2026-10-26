import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {validateP013Admission,P013_CALIBRATION}
 from '../../../lib/alg-l08-p013-admission-semantics-v1.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import {algL08CurrentDescriptor} from './alg-l08-current-descriptor-v1.server';
import {P013_ID as ID,p013LocalDevelopment} from './alg-l08-p013-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const PROOF=`work/g678-workflow/candidates/${ID}-proof-v1.json`;
function demand(ok:unknown,why:string):asserts ok{
 if(!ok)throw Error(`ALG_L08_P013_FORMAL_INVALID: ${why}`);
}
export function algL08P013FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p013LocalDevelopment(),'exact local source scope');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),transaction=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(own.length===1&&own[0].proof.path===PROOF,
  'one P013 proof in the current admission index');
 const packet=readPageProof(root,own[0].proof,host,transaction),
  proof=readJsonPin(root,own[0].proof),registration=proof.registration,
  entry=registration.entries[0],meta=localOnlyAnimationModuleRegistration(ID);
 demand(registration.calibrationId===P013_CALIBRATION&&
  registration.deploymentScope==='local-only'&&registration.entries.length===1&&
  entry.key===ID&&entry.module==='./modules/shared-alg001-l08-p013'&&
  entry.maturity==='private-current-js'&&entry.complexityLane==='behavior-heavy'&&
  meta?.calibrationId===P013_CALIBRATION&&
  meta.freezeManifestSha256===registration.freezeManifestSha256&&
  meta.moduleSha256===entry.artifacts.module.sha256&&
  meta.timelineSha256===entry.artifacts.timeline.sha256&&
  meta.rendererBindingKind==='maintained-dom-module-v1'&&
  meta.memberManifestSha256===entry.artifacts.memberManifest.sha256&&
  meta.sourceRunSha256===entry.artifacts.sourceRun.sha256&&
  isDeepStrictEqual(packet.entry,entry),'current registry and dispatch');
 validateP013Admission(root,packet,registration);
 const candidate=algL08CurrentDescriptor();
 demand(candidate.pages.length===50&&candidate.pages[12].animationId===ID&&
  candidate.pages[12].globalPageOrdinal===13&&candidate.pages[12].sectionCode==='VB'&&
  candidate.pages[12].sectionPageOrdinal===7&&candidate.pages[12].rendererAvailability.kind==='registered'&&
  candidate.pages[12].source.sourceOccurrence===13&&
  candidate.pages[12].source.assetId==='swf-01564a19d900d3244302b7d58e8b06a2c6b5664ceac469937693008fd79ab12b'&&
  candidate.productBridge.selectedAnimationIds.filter(key=>key===ID).length===1&&
  candidate.productBridge.registeredAnimationCount===candidate.productBridge.selectedAnimationIds.length,
  'one source-ordered Current-JS page');
 return Object.freeze({...candidate,descriptorId:`${candidate.descriptorId}:${P013_CALIBRATION}`,
  calibrationId:P013_CALIBRATION,releaseId:P013_CALIBRATION,
  course:Object.freeze({...candidate.course,
   href:`/migration-status/g678-calibration/${ID}/registered-v1`}),
  source:Object.freeze({...candidate.source,candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...candidate.persistence,
   storageKey:`${candidate.persistence.storageKey}:${P013_CALIBRATION}`})});
}

export{algL08CurrentRegisteredSharedCount}from'./alg-l08-current-descriptor-v1.server';
