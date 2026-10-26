import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion} from '../../../lib/g678-admission-proof.mjs';
import {validateGamePairAdmission} from '../../../scripts/lib/g678-game-pair-candidate-v1.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import {algL07CurrentDescriptor} from './alg-l07-current-descriptor-v1.server';
import {p051LocalDevelopment} from './alg-l07-p051-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
function demand(ok:unknown,why:string):asserts ok{if(!ok)throw Error('ALG_L07_GAME_PAIR_FORMAL_INVALID: '+why);}
export function algL07GamePairFormalDescriptor(initialPage:51|52):PageOnlyLessonPlayerDescriptor{
 demand(p051LocalDevelopment(),'exact local source scope');const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),host=verifyHostVersion(root,index.host),transaction=readRegistryTransaction(root);
 let selectedPacket;
 for(const page of[51,52]){const id=`shared-alg001-l07-p0${page}`,calibration=`g678-alg-l07-p0${page}-current-js-20261006-v1`,own=index.pages.filter((p:{animationId:string})=>p.animationId===id);
  demand(own.length===1&&own[0].proof.path===`work/g678-workflow/candidates/${id}-proof-v1.json`,'one exact proof for each game placement');
  const packet=readPageProof(root,own[0].proof,host,transaction),proof=readJsonPin(root,own[0].proof),registration=proof.registration,entry=registration.entries[0],meta=localOnlyAnimationModuleRegistration(id);
  demand(registration.calibrationId===calibration&&registration.deploymentScope==='local-only'&&registration.entries.length===1&&entry.key===id&&entry.module===`./modules/${id}`&&entry.maturity==='private-current-js'&&entry.complexityLane==='behavior-heavy'&&meta?.calibrationId===calibration&&meta.freezeManifestSha256===registration.freezeManifestSha256&&meta.moduleSha256===entry.artifacts.module.sha256&&meta.timelineSha256===entry.artifacts.timeline.sha256&&meta.rendererBindingKind==='maintained-dom-module-v1'&&meta.memberManifestSha256===entry.artifacts.memberManifest.sha256&&meta.sourceRunSha256===entry.artifacts.sourceRun.sha256&&isDeepStrictEqual(packet.entry,entry),'current registry and generated dispatch');
  validateGamePairAdmission(root,packet,registration,page,calibration);if(page===initialPage)selectedPacket=packet;
 }
 demand(selectedPacket,'selected page proof');const base=algL07CurrentDescriptor();
 for(const page of[51,52]){const id=`shared-alg001-l07-p0${page}`,p=base.pages[page-1];demand(base.pages.length===62&&p?.animationId===id&&p.globalPageOrdinal===page&&p.sectionCode==='GS'&&p.sectionPageOrdinal===page-50&&p.rendererAvailability.kind==='registered'&&base.productBridge.selectedAnimationIds.filter(k=>k===id).length===1,'both source-ordered registered game placements');}
 demand(base.support.lessonHostCapabilities.includes('navigation'),'registered source game transition is enabled in every current lesson entry');
 const calibration=`g678-alg-l07-p0${initialPage}-current-js-20261006-v1`;return Object.freeze({...base,descriptorId:`${base.descriptorId}:${calibration}`,calibrationId:calibration,releaseId:calibration,course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/shared-alg001-l07-p0${initialPage}/registered-v1`}),source:Object.freeze({...base.source,candidateFreezeManifestPath:selectedPacket.freezeManifest.path,candidateFreezeManifestSha256:selectedPacket.freezeManifest.sha256}),persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p051-p052-registered-v1`})});
}
export{algL07CurrentRegisteredSharedCount}from'./alg-l07-current-descriptor-v1.server';
