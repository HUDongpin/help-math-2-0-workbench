import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion} from '../../../lib/g678-admission-proof.mjs';
import {validateP004Admission,P004_CALIBRATION} from '../../../lib/alg-l10-p004-admission-semantics-v1.mjs';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {getWorkspaceRoot} from './catalog';
import {retainedL10Descriptor} from './alg-l10-p004-candidate-v1.server';
import {P004_ID as ID,p004LocalDevelopment} from './alg-l10-p004-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
export {algL10CurrentRegisteredSharedCount} from './alg-l10-p004-candidate-v1.server';

const PROOF='work/g678-workflow/candidates/shared-alg001-l10-p004-proof-v1.json';
function demand(ok:unknown,why:string):asserts ok{if(!ok)throw Error(`ALG_L10_P004_FORMAL_INVALID: ${why}`);}

/** Admit P004 only after its physical source proof, current registration and
 * maintained-DOM dispatch agree; the other eleven L10 members keep their exact
 * reviewed decoder-successor bindings. */
export function algL10P004FormalDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p004LocalDevelopment(),'exact physical local development scope');
 demand(P004_CALIBRATION==='g678-alg-l10-p004-maintained-current-js-v1','exact P004 calibration');
 const root=getWorkspaceRoot(),index=readJsonPin(root,G678_ADMISSION_INDEX),
  host=verifyHostVersion(root,index.host),transaction=readRegistryTransaction(root);
 const own=index.pages.filter((row:{animationId:string})=>row.animationId===ID);
 demand(own.length===1&&own[0].proof.path===PROOF,'one exact active P004 proof');
 const packet=readPageProof(root,own[0].proof,host,transaction),
  proof=readJsonPin(root,own[0].proof),registration=proof.registration;
 demand(registration.calibrationId===P004_CALIBRATION&&registration.deploymentScope==='local-only'&&
  registration.entries.length===1,'one local P004 registration');
 const entry=registration.entries[0],meta=localOnlyAnimationModuleRegistration(ID);
 demand(entry.key===ID&&entry.module===`./modules/${ID}`&&entry.maturity==='private-current-js'&&
  entry.complexityLane==='behavior-heavy'&&entry.artifacts.kind==='maintained-dom-module-v1'&&
  meta?.calibrationId===P004_CALIBRATION&&meta.scope==='private-engineering'&&
  meta.deploymentScope==='local-only'&&meta.maturity==='private-current-js'&&
  meta.freezeManifestSha256===registration.freezeManifestSha256&&
  meta.moduleSha256===entry.artifacts.module.sha256&&
  meta.timelineSha256===entry.artifacts.timeline.sha256&&
  meta.rendererBindingKind==='maintained-dom-module-v1'&&
  meta.memberManifestSha256===entry.artifacts.memberManifest.sha256&&
  meta.sourceRunSha256===entry.artifacts.sourceRun.sha256&&
  isDeepStrictEqual(packet.entry,entry),'exact maintained entry and generated dispatch');
 validateP004Admission(root,packet,registration);

 const base=retainedL10Descriptor(),page=base.pages[3];
 demand(base.pages.length===52&&base.course.activePageCount===52&&base.course.courseShellCount===0&&
  base.productBridge.registeredAnimationCount===11&&page?.animationId===ID&&page.placementId===ID&&
  page.globalPageOrdinal===4&&page.sectionCode==='RW'&&page.sectionPageOrdinal===3&&
  page.source.sourceOccurrence===4&&page.rendererAvailability.kind==='unavailable'&&
  page.source.assetId==='swf-5ac9be9459e12bdc6552d53a66b67ceb645633d2fe57522639a043d28180f5b2',
  'exact source-ordered P004 placement in the eleven-member retained descriptor');
 const pages=Object.freeze(base.pages.map((p,i)=>i!==3?p:Object.freeze({...p,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-60',language:'fixed-en' as const,scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const})})));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(selected.length===12&&new Set(selected).size===12&&selected.includes(ID)&&
  isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds)&&
  pages.every((p,i)=>i===3||p===base.pages[i]),'one exact admitted P004 addition; all other pages retained');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:${P004_CALIBRATION}`,
  calibrationId:P004_CALIBRATION,releaseId:P004_CALIBRATION,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/registered-v1`}),
  source:Object.freeze({...base.source,candidateFreezeManifestPath:packet.freezeManifest.path,
   candidateFreezeManifestSha256:packet.freezeManifest.sha256}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:${P004_CALIBRATION}`}),
  pages,productBridge:Object.freeze({...base.productBridge,selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:12})});
}
