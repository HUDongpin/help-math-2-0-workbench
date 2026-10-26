import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion} from '../../../lib/g678-admission-proof.mjs';
import {validateP002Admission,P002_CALIBRATION} from '../../../lib/alg-l07-p002-admission-semantics-v1.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import {algL07CurrentDescriptor,algL07CurrentRegisteredSharedCount} from './alg-l07-current-descriptor-v1.server';
import {P002_ID as ID,p002LocalDevelopment} from './alg-l07-p002-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
export {algL07CurrentRegisteredSharedCount};
function demand(ok:unknown,why:string):asserts ok{if(!ok)throw Error(`ALG_L07_P002_FORMAL_INVALID: ${why}`);}
export function algL07P002FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p002LocalDevelopment(),'exact local source scope');const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),host=verifyHostVersion(root,index.host),transaction=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);demand(own.length===1&&own[0].proof.path===`work/g678-workflow/candidates/${ID}-proof-v3.json`,'one P002 current proof');
 const packet=readPageProof(root,own[0].proof,host,transaction),proof=readJsonPin(root,own[0].proof),registration=proof.registration,entry=registration.entries[0],meta=localOnlyAnimationModuleRegistration(ID);
 demand(registration.calibrationId===P002_CALIBRATION&&registration.deploymentScope==='local-only'&&registration.entries.length===1&&entry.key===ID&&entry.module==='./modules/shared-alg001-l07-p002'&&entry.maturity==='private-current-js'&&meta?.calibrationId===P002_CALIBRATION&&meta.freezeManifestSha256===registration.freezeManifestSha256&&meta.moduleSha256===entry.artifacts.module.sha256&&meta.timelineSha256===entry.artifacts.timeline.sha256&&meta.rendererBindingKind==='maintained-dom-module-v1'&&meta.memberManifestSha256===entry.artifacts.memberManifest.sha256&&meta.sourceRunSha256===entry.artifacts.sourceRun.sha256&&isDeepStrictEqual(packet.entry,entry),'current registry and dispatch');
 validateP002Admission(root,packet,registration);const current=algL07CurrentDescriptor();demand(current.pages.length===62&&current.pages[1]?.animationId===ID&&current.pages[1].rendererAvailability.kind==='registered','admitted source placement2');
 return Object.freeze({...current,descriptorId:`${current.descriptorId}:${P002_CALIBRATION}`,calibrationId:P002_CALIBRATION,releaseId:P002_CALIBRATION,course:Object.freeze({...current.course,href:`/migration-status/g678-calibration/${ID}/registered-v1`}),source:Object.freeze({...current.source,candidateFreezeManifestPath:packet.freezeManifest.path,candidateFreezeManifestSha256:packet.freezeManifest.sha256})});
}
