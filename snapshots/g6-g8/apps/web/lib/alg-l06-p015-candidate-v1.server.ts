import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration,registeredLocalOnlyAnimationKeys}
  from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P014FormalDescriptor} from './alg-l06-p014-formal-admission-v1.server';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const ID='shared-alg001-l06-p015';
const ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE={"path": "G6-G8-shared/ALG001/L6/VB/L6VB06.swf", "bytes": 559546, "sha256": "d0f395f5410353733b42ae29198caa86fae6b6eebd0e2a71830a203d969868b1"};
const AUDIT={"path": "migrations/shared-alg001-l06-p015/audit/source-v1/source-audit-v1.json", "bytes": 8768, "sha256": "5e474ab8e2c00be798adfb1ca39b654ace6b178c2311745f69451bba589a9824"};
const GLOSSARY={"path": "migrations/shared-alg001-l06-p015/audit/glossary-v1/six-term-crosswalk-v1.json", "bytes": 19724, "sha256": "ac14fe36033aa463c691ec6bb27920a4a63acef804b8566e299110a309ba36ad"};
const AUDIO={"path": "migrations/shared-alg001-l06-p015/audit/audio-v1/audio-source-audit-v1.json", "bytes": 276045, "sha256": "cc0613c295d148102df51dd970d391cda380ffa3ed0f4da9f77ba2c04453ae15"};
const CANVAS={"path": "output/alg-l06-p015-canvas-v1/canvas-manifest.json", "bytes": 4878, "sha256": "8ac70251c90af2cfebf7290bb82f326a4f7fda36f783f2bafdc4bc4605d58d23"};
const TEXT={"path": "migrations/shared-alg001-l06-p015/audit/text-state-v1/text-state-audit-v1.json", "bytes": 4981, "sha256": "3b9e8b2e5296b5febdc1608ed502df35a70195103b5a7f2e5cb1a1c1486c2a7b"};
const NATIVE_STATE={"path": "packages/demos/src/generated/alg-l06-p015-text-state-v1.ts", "bytes": 9781, "sha256": "b952d4615e074274daeeda8695f39108714b27a2f53bf9daa5b85202ae5ab305"};
const RENDERER={"path": "output/alg-l06-p015-canvas-v1/canvas-renderer.js", "bytes": 10515188, "sha256": "4a572881adce44d318329f8895458eed8f63e8679e41ebfd38bbb3f0ee3dcb55"};
const SA={"path": "migrations/shared-alg001-l06-p015/audit/audio-v1/separate-sa-source-v1.mp3", "bytes": 363888, "sha256": "55ae5c2c9d5aa5b3a00f3fd30e642f6410dcaf6b9e66f1bf77ee349cce2bf434"};
const XML={path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
 sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'};
const REGISTRY_SHA='eb04af533dc4b633a4b8980ea7d71d03f7a3557a1bc098767f83a13a8800d8a7';
function demand(ok:unknown,reason:string):asserts ok{if(!ok)throw Error(`P015_CANDIDATE_INVALID: ${reason}`);}
/** One unregistered VB5 projection into the existing real My Lesson host. */
export function algL6P015CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(process.env.NODE_ENV==='development'&&!process.env.VERCEL&&!process.env.VERCEL_ENV&&
  process.env.HELP_MATH_G678_SOURCE_ROOT===ROOT&&
  ['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')&&
  process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND==='127.0.0.1','local source environment');
 const base=algL6P014FormalDescriptor(),root=getWorkspaceRoot(),transaction=readRegistryTransaction(root);
 demand(transaction.sha256===REGISTRY_SHA&&registeredLocalOnlyAnimationKeys.length===502&&
  !localOnlyAnimationModuleRegistration(ID)&&!transaction.registry.calibrations.some(
   (row:{entries:{key:string}[]})=>row.entries.some(entry=>entry.key===ID)),
  '502 formal pages; P015 unregistered');
 demand(base.pages.length===60&&base.course.moduleCode==='ALG001'&&base.course.lesson===6&&
  base.course.courseShellCount===0&&base.productBridge.registeredAnimationCount===25&&
  base.pages.filter(page=>page.rendererAvailability.kind==='registered').length===25&&
  base.source.sourceXmlPath===XML.path&&base.source.sourceXmlSha256===XML.sha256&&
  Object.values(base.productBridge.acceptanceEffects).every(value=>value===false),'formal predecessor');
 readPin(ROOT,SOURCE);readPin(ROOT,XML);
 for(const pin of [RENDERER,NATIVE_STATE,SA])readPin(root,pin);
 const audit=readJsonPin(root,AUDIT),glossary=readJsonPin(root,GLOSSARY),
  audio=readJsonPin(root,AUDIO),canvas=readJsonPin(root,CANVAS),text=readJsonPin(root,TEXT);
 demand(audit.animationId===ID&&audit.source.sha256===SOURCE.sha256&&
  audit.catalog.globalOrdinal===15&&audit.catalog.section==='VB'&&audit.catalog.sectionPageOrdinal===5&&
  audit.runtime.mainDomain==='sprite-270'&&audit.runtime.mainFrames===914&&
  audit.runtime.header.rootFrameCount===10&&audit.runtime.header.fps===12,'source domain');
 const keys=['function','value','relation','rule','input','output'];
 demand(glossary.animationId===ID&&glossary.inputs.swf.sha256===SOURCE.sha256&&
  isDeepStrictEqual(glossary.terms.map((term:{id:string})=>term.id),keys)&&
  keys.every(id=>base.glossary.filter(entry=>entry.id===id).length===1),'six source glossary entries');
 demand(audio.source.swf.sha256===SOURCE.sha256&&audio.source.separateSa.sha256===SA.sha256&&
  audio.separateSa.copy.sha256===SA.sha256&&audio.streamCount===1&&audio.trailers.length===0&&
  audio.streams[0].domain==='sprite-270'&&isDeepStrictEqual(audio.streams[0].contiguousRanges.map(
   (range:{firstFrame:number;lastFrame:number})=>[range.firstFrame,range.lastFrame]),
   [[2,622],[646,702],[712,849],[852,914]]),'four separate source ranges and optional SA');
 demand(canvas.animationId===ID&&canvas.source.sha256===SOURCE.sha256&&
  canvas.mainFrameCount===914&&canvas.rootFrame===6&&canvas.outputs[0].sha256===RENDERER.sha256&&
  Object.values(canvas.acceptanceEffects).every(value=>value===false),'source drawing');
 demand(text.animationId===ID&&text.sourceSwf.sha256===SOURCE.sha256&&
  text.output.sha256===NATIVE_STATE.sha256&&text.output.bytes===NATIVE_STATE.bytes&&
  text.output.path===NATIVE_STATE.path&&isDeepStrictEqual(text.semanticTiming.sectionReveal,
   [['definition',249],['rule',332],['unique-output',392]])&&
  isDeepStrictEqual(text.semanticTiming.glossaryFullHit,
   [['Function',172],['Relation',191],['Value',215],['Rule',302],['Input',317],['Output',332]]),
  'native source reveal gates');
  const target=base.pages[14];
  demand(target.animationId===ID&&target.placementId===ID&&target.globalPageOrdinal===15&&
    target.sectionCode==='VB'&&target.sectionPageOrdinal===5&&
    target.source.assetId===`swf-${SOURCE.sha256}`&&target.source.sourceOccurrence===15&&
    target.rendererAvailability.kind==='unavailable'&&
    target.previousPlacementId==='shared-alg001-l06-p014'&&
    target.nextPlacementId==='shared-alg001-l06-p016','exact P015 placement');
  demand(keys.every(id=>base.glossary.filter(entry=>entry.id===id).length===1),
    'existing source-bound Input/Output glossary');
  const pages=base.pages.map((page,index)=>index!==14?page:Object.freeze({...page,
    rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
      runtimeQuery:Object.freeze({frameDomain:'sprite-270',language:'fixed-en' as const,
        scenario:'source-static-frame',seed:'0'})}),
    runtimeEvidenceBoundary:Object.freeze({runtimeKind:'source-static-current-js-candidate' as const,
      actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
      audioAcceptance:'not-established' as const,
      replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established' as const,
      productVisualBehaviorComposite:'not-established' as const}),
    presentation:Object.freeze({...page.presentation,pageInteractionCompanionTargetIdSuffix:'p015-source-readable'}),
  }));
  const selected=pages.filter(page=>page.rendererAvailability.kind==='registered')
    .map(page=>page.animationId);
  demand(selected.length===26&&
    isDeepStrictEqual(selected.filter(id=>id!==ID),base.productBridge.selectedAnimationIds),
    'exact single candidate addition');
  return Object.freeze({...base,descriptorId:`${base.descriptorId}:p015-candidate-v1`,
    calibrationId:'g678-alg-l06-p015-unregistered-candidate-v1',
    releaseId:`${base.releaseId}:p015-candidate-v1`,
    course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}/candidate-v1`}),
    persistence:Object.freeze({...base.persistence,
      storageKey:`${base.persistence.storageKey}:p015-candidate-v1`}),
    pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,
      selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:26}),
  });
}
