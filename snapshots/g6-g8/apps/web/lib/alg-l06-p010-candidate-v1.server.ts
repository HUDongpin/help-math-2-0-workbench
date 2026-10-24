import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readPin,readJsonPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P008FormalDescriptor} from './alg-l06-p008-formal-admission-v1.server';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const ID='shared-alg001-l06-p010';
const ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE={path:'G6-G8-shared/ALG001/L6/RW/L6RW09.swf',bytes:114334,
 sha256:'96552f567037f39868d01b1ba77311858caf2efcdb141ef64ed0878a6c48ce14'};
const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
const AUDIT={path:'migrations/shared-alg001-l06-p010/audit/source-v1/source-audit-v1.json',bytes:8394,
 sha256:'14a34b6527a77dc374f650ccad9f7bd9e4c1c8bc6e23198f93eb2a82e6f7de64'};
const CANDIDATE_EVIDENCE=[
  {
    "path": "migrations/shared-alg001-l06-p010/audit/sa-host-v1/sa-host-disposition-v1.json",
    "bytes": 10890,
    "sha256": "b5d6ae0f80df570ea341a4c8f00308ebe563eb26898d2247e1f0cd92b42045f6"
  },
  {
    "path": "migrations/shared-alg001-l06-p010/audit/source-v1/conditional-host-terminal-v1.json",
    "bytes": 2440,
    "sha256": "511103d546a061565613b5b2949ce30be86c5330ff1874cac8186eae0ab69845"
  },
  {
    "path": "migrations/shared-alg001-l06-p010/audit/text-state-v1/text-state-audit-v1.json",
    "bytes": 2331,
    "sha256": "465f4d94eaf83b16d504e65db22663103ba45d328a97959c16bfa47c5f53ade1"
  },
  {
    "path": "output/alg-l06-p010-canvas-v1/canvas-manifest.json",
    "bytes": 3547,
    "sha256": "e4c55c7f30adec8a60ed3848076fe87783987b9ea373364c7a9703aeb50fd079"
  }
] as const;
function demand(ok:unknown,reason:string):asserts ok{if(!ok)throw Error(`P010_CANDIDATE_INVALID: ${reason}`);}

/** A disclosed local projection of one unregistered page into the real My Lesson host. */
export function algL6P010CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
  process.env.HELP_MATH_G678_SOURCE_ROOT===ROOT&&
  ['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')&&
  process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND==='127.0.0.1','local source environment');
 const base=algL6P008FormalDescriptor(),root=getWorkspaceRoot();
 const transaction=readRegistryTransaction(root);
 demand(registeredLocalOnlyAnimationKeys.length===499&&!localOnlyAnimationModuleRegistration(ID)&&
  !transaction.registry.calibrations.some((row:{entries:{key:string}[]})=>row.entries.some(e=>e.key===ID)),
  '499 formal pages; P010 is unregistered');
 demand(base.course.moduleCode==='ALG001'&&base.course.lesson===6&&base.pages.length===60&&
  base.course.courseShellCount===0&&base.productBridge.registeredAnimationCount===22&&
  base.pages.filter(p=>p.rendererAvailability.kind==='registered').length===22&&
  base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256&&
  Object.values(base.productBridge.acceptanceEffects).every(v=>v===false),'formal 22-page predecessor');
 readPin(ROOT,SOURCE);readPin(ROOT,XML);
 for(const pin of CANDIDATE_EVIDENCE)readPin(root,pin);
 const audit=readJsonPin(root,AUDIT);
 demand(audit.animationId===ID&&audit.source.sha256===SOURCE.sha256&&
  audit.catalog.globalOrdinal===10&&audit.catalog.sectionPageOrdinal===9&&
  audit.header.rootFrameCount===10&&audit.header.fps===12&&
  audit.frameDomains.some((d:{domainId:string;declaredFrames:number})=>d.domainId==='sprite-52'&&d.declaredFrames===303),
  'source identity and nested domain');
 const target=base.pages[9];
 demand(target.animationId===ID&&target.placementId===ID&&target.globalPageOrdinal===10&&
  target.sectionCode==='RW'&&target.sectionPageOrdinal===9&&
  target.source.assetId===`swf-${SOURCE.sha256}`&&target.source.sourceOccurrence===10&&
  target.rendererAvailability.kind==='unavailable'&&
  target.previousPlacementId==='shared-alg001-l06-p009'&&
  target.nextPlacementId==='shared-alg001-l06-p011','exact P010 placement');
 demand(base.glossary.filter(entry=>entry.id==='function').length===1,'existing source-bound Function glossary');
 const pages=base.pages.map((page,index)=>index!==9?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-52',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,pageInteractionCompanionTargetIdSuffix:'p010-source-readable'}),
 }));
 const selected=pages.filter(p=>p.rendererAvailability.kind==='registered').map(p=>p.animationId);
 demand(selected.length===23&&isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),
  'exact single candidate addition');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p010-candidate-v1`,
  calibrationId:'g678-alg-l06-p010-unregistered-candidate-v1',releaseId:`${base.releaseId}:p010-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p010-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:23}),
 });
}
