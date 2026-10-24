import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P004FormalDescriptor} from './alg-l06-p004-formal-admission-v1.server';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const ID='shared-alg001-l06-p008';
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE={path:'G6-G8-shared/ALG001/L6/RW/L6RW07.swf',bytes:2805364,
 sha256:'6ea847e4682f9581cd72ee4a2fd8a177c9584cbf7a53ab8a2421e1ee0f012350'};
const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
const SOURCE_AUDIT={path:'migrations/shared-alg001-l06-p008/audit/source-v1/source-audit-v1.json',
 bytes:7960,sha256:'e14303e47454761f2fc17b77b7eb6afc714354d50cfbd1bd151264a516db6de2'};
const TEXT_AUDIT={path:'migrations/shared-alg001-l06-p008/audit/text-state-v1/text-state-audit-v1.json',
 bytes:7446,sha256:'2f5602d837edacd53a47ac3a7c7a7fe051421df4e076844c7987acf71f88e9e4'};
const SA_AUDIT={path:'migrations/shared-alg001-l06-p008/audit/sa-host-v1/sa-host-disposition-v1.json',
 bytes:8043,sha256:'220a687e723dc47f45997262c5311aef340dc881a97f0b274d7dfc79e3651227'};
const MAIN={path:'migrations/shared-alg001-l06-p008/audit/audio-v1/continuous-source-v1.mp3',
 bytes:377130,sha256:'ab14ce47d0f98c841213b222f27e7bc44587ba27849048ed1dd16bd41c2eabe2'};
const SA={path:'G6-G8-shared/ALG001/L6/SA/L6RW07.mp3',bytes:135072,
 sha256:'ca48f20431673bb4e6f17c28cb605134f4098161bbcb93cc82c274cb472466f3'};
const CANVAS={path:'output/alg-l06-p008-optimized-canvas-v1/successor-v2/canvas-renderer.js',
 bytes:19032480,sha256:'ef40a85081b1cd131e3751fbaec8242a847592247f1b1992f681dd499309c33e'};
const CANVAS_MANIFEST={path:'output/alg-l06-p008-optimized-canvas-v1/successor-v2/optimized-manifest.json',
 bytes:2900,sha256:'82d6997dacc6e6a7694bcca1b40909df4cbbf1af78b17921b16e011c7842353a'};
type Pin={path:string;bytes:number;sha256:string};
function demand(ok:unknown,reason:string):asserts ok{if(!ok)throw Error(`P008_CANDIDATE_INVALID: ${reason}`);}

/** A local My Lesson projection. Only the P004 predecessor is registered. */
export function algL6P008CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
  process.env.HELP_MATH_G678_SOURCE_ROOT===SOURCE_ROOT&&
  ['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')&&
  process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND==='127.0.0.1','exact local source environment');
 const base=algL6P004FormalDescriptor(),root=getWorkspaceRoot();
 const transaction=readRegistryTransaction(root);
 demand(registeredLocalOnlyAnimationKeys.length===498&&
  !transaction.registry.calibrations.some((calibration:{entries:{key:string}[]})=>
   calibration.entries.some(entry=>entry.key===ID))&&
  !localOnlyAnimationModuleRegistration(ID),'P008 remains unregistered');
 demand(base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.activePageCount===60&&base.course.courseShellCount===0&&base.pages.length===60&&
  base.productBridge.registeredAnimationCount===21&&
  base.pages.filter(page=>page.rendererAvailability.kind==='registered').length===21&&
  base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256&&
  Object.values(base.productBridge.acceptanceEffects).every(value=>value===false),
  'formal P004 predecessor');
 const target=base.pages[7];
 demand(target.animationId===ID&&target.placementId===ID&&
  target.rendererAvailability.kind==='unavailable'&&target.globalPageOrdinal===8&&
  target.sectionCode==='RW'&&target.sectionPageOrdinal===7&&
  target.previousPlacementId==='shared-alg001-l06-p007'&&
  target.nextPlacementId==='shared-alg001-l06-p009'&&
  target.source.assetId===`swf-${SOURCE.sha256}`&&target.source.sourceOccurrence===8,
  'exact P008 source occurrence');
 readPin(SOURCE_ROOT,SOURCE);readPin(SOURCE_ROOT,XML);
 const audit=readJsonPin(root,SOURCE_AUDIT) as {kind:string;animationId:string;source:Pin&{root:string};
  catalog:{globalOrdinal:number;sectionCode:string;sectionPageOrdinal:number};
  header:{stage:{width:number;height:number};fps:number;rootFrameCount:number};
  frameDomains:Array<{domainId:string;declaredFrames:number;rootReachable:boolean}>;
  tagCounts:Record<string,number>;audio:{embedded:{bytes:number;sha256:string};optionalSpanish:Pin}};
 demand(audit.kind==='alg-l06-p008-source-audit-v1'&&audit.animationId===ID&&
  audit.source.root===SOURCE_ROOT&&isDeepStrictEqual({...audit.source,root:undefined},{...SOURCE,root:undefined})&&
  audit.catalog.globalOrdinal===8&&audit.catalog.sectionCode==='RW'&&
  audit.catalog.sectionPageOrdinal===7&&audit.header.stage.width===800&&
  audit.header.stage.height===600&&audit.header.fps===12&&audit.header.rootFrameCount===10&&
  audit.frameDomains.some(domain=>domain.domainId==='sprite-507'&&
   domain.declaredFrames===938&&domain.rootReachable)&&
  !audit.tagCounts.DefineButton&&!audit.tagCounts.DefineButton2&&
  audit.audio.embedded.bytes===MAIN.bytes&&audit.audio.embedded.sha256===MAIN.sha256&&
  audit.audio.optionalSpanish.path===SA.path&&audit.audio.optionalSpanish.bytes===SA.bytes&&
  audit.audio.optionalSpanish.sha256===SA.sha256,'source audit identity, frame domain, and audio');
 const saAudit=readJsonPin(root,SA_AUDIT) as {kind:string;animationId:string;status:string;
  inputs:{lessonXml:Pin;pageSwf:Pin;separateSa:Pin};acceptanceEffects:Record<string,boolean>};
 demand(saAudit.kind==='alg-l06-p008-separate-sa-host-disposition-v1'&&saAudit.animationId===ID&&
  saAudit.status==='verified-static-host-algorithm-conditional-page-application-not-runtime-or-listening'&&
  saAudit.inputs.lessonXml.sha256===XML.sha256&&saAudit.inputs.pageSwf.sha256===SOURCE.sha256&&
  saAudit.inputs.separateSa.sha256===SA.sha256&&
  Object.values(saAudit.acceptanceEffects).every(value=>value===false),'separate optional Spanish source');
 const textAudit=readJsonPin(root,TEXT_AUDIT) as {kind:string};
 demand(textAudit.kind==='alg-l06-p008-text-state-audit-v1','native text source audit');
 const canvasManifest=readJsonPin(root,CANVAS_MANIFEST) as {kind:string;animationId:string;
  status:string;inputs:Array<{name:string;path:string;bytes:number;sha256:string}>;
  outputs:Array<{name:string;bytes:number;sha256:string}>};
 demand(canvasManifest.kind==='alg-l06-p008-bounded-bitmap-cache-diagnostic-v2'&&
  canvasManifest.animationId===ID&&canvasManifest.status==='unregistered-optimized-canvas-diagnostic'&&
  canvasManifest.inputs.some(input=>input.name==='runtime'&&
   input.path==='output/alg-l06-p008-composed-canvas-v1/successor-v4/canvas-renderer.js'&&
   input.sha256==='6bee67fa24900e148ad6babc1c82dbd66760aed42166cba7caa04667649e1d5c')&&
  canvasManifest.outputs.some(output=>
   output.name==='canvas-renderer.js'&&output.bytes===CANVAS.bytes&&
   output.sha256===CANVAS.sha256),'source-drawing candidate pin');
 readPin(root,CANVAS);readPin(root,MAIN);readPin(SOURCE_ROOT,SA);
 const pages=base.pages.map((page,index)=>index!==7?page:Object.freeze({...page,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-507',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
   productVisualBehaviorComposite:'not-established' as const}),
  presentation:Object.freeze({...page.presentation,
   pageInteractionCompanionTargetIdSuffix:'p008-source-readable'}),
 }));
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(selected.length===22&&selected[7]===ID&&
  isDeepStrictEqual(selected.filter(animationId=>animationId!==ID),
   base.productBridge.selectedAnimationIds),'one simulated page only');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:p008-candidate-v1`,
  calibrationId:'g678-alg-l06-p008-unregistered-candidate-v1',
  releaseId:`${base.releaseId}:p008-candidate-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p008-candidate-v1`}),
  pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
   selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:22}),
  p008CandidateDisclosure:Object.freeze({status:'unregistered-engineering-candidate',
   actualRegisteredLessonPages:21,simulatedLessonPages:22,officialRegisteredCount:498,
   registrationChanged:false,acceptanceEffect:'none'}),
 });
}
