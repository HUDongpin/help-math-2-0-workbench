import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const ID='shared-nms002-l02-p062';
const SOURCE_SHA='5a075362f005aab68406d5fae2378f622a64520ec19e4b03b9ac9abbbd5faa50';
const XML_SHA='550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61';
const pageId=(ordinal:number)=>`shared-nms002-l02-p${String(ordinal).padStart(3,'0')}`;
const EXPECTED_REGISTERED=Object.freeze([...Array.from({length:52},(_,i)=>pageId(i+1)),
 pageId(55),pageId(56),pageId(57),pageId(58),pageId(59),pageId(60),pageId(61),pageId(63)]);

function demand(ok:unknown,reason:string):asserts ok{
 if(!ok)throw Error(`NMS_L02_P062_CANDIDATE_INVALID: ${reason}`);
}

/** Local preview projects one runnable page. The product bridge still counts
 * only the 60 independently registered placements in the P061 predecessor. */
export function nmsL02P062CandidateDescriptorV1(base:PageOnlyLessonPlayerDescriptor):PageOnlyLessonPlayerDescriptor{
 demand(base.schemaVersion===2&&base.course.moduleCode==='NMS002'&&base.course.lesson===2&&
  base.course.activePageCount===64&&base.course.expectedReleaseMemberCount===64&&
  base.course.courseShellCount===0&&base.pages.length===64&&
  base.productBridge.pageOnlyDescriptorMemberCount===64&&
  base.productBridge.registeredAnimationCount===60,'P061 registered predecessor counts');
 demand(base.source.sourceXmlPath==='G6-G8-shared/NMS002/L2/index.xml'&&
  base.source.sourceXmlSha256===XML_SHA,'exact lesson XML');
 demand(base.pages.every((page,index)=>{
  const n=index+1,previous=n===1?null:pageId(n-1),next=n===64?null:pageId(n+1);
  return page.animationId===pageId(n)&&page.placementId===pageId(n)&&
   page.globalPageOrdinal===n&&page.source.sourceOccurrence===n&&
   page.previousPlacementId===previous&&page.nextPlacementId===next&&
   page.previousAnimationId===previous&&page.nextAnimationId===next;
 }), '64-page source order and links');
 const registered=base.pages.filter(page=>page.rendererAvailability.kind==='registered').map(page=>page.animationId);
 demand(JSON.stringify(registered)===JSON.stringify(EXPECTED_REGISTERED)&&
  JSON.stringify(base.productBridge.selectedAnimationIds)===JSON.stringify(EXPECTED_REGISTERED),
  'exact registered predecessor identity');
 const page=base.pages[61];
 demand(page.animationId===ID&&page.sectionCode==='TS'&&page.sectionPageOrdinal===8&&
  page.globalPageOrdinal===62&&page.source.assetId===`swf-${SOURCE_SHA}`&&
  page.rendererAvailability.kind==='unavailable'&&
  page.labels.en.text==='Question 3'&&page.labels.es.text==='Pregunta 3',
  'exact unavailable P062 placement');
 demand(Object.values(base.productBridge.acceptanceEffects).every(value=>value===false),
  'predecessor acceptance boundary');
 demand(base.glossary.length===25&&new Set(base.glossary.map(term=>term.id)).size===25&&
  new Set(base.glossary.map(term=>term.sourceKeyAttribute)).size===25,
  'registered predecessor glossary');
 const pages=base.pages.map((entry,index)=>index!==61?entry:Object.freeze({...entry,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-315',language:'fixed-en' as const,
    scenario:'source-static-frame',seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({
   runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-interaction-reset-original-runtime-parity-not-established' as const,
   productBehavior:'maintained-javascript-state-machine-implemented' as const,
   productVisualBehaviorComposite:'not-established' as const,
  }),
 }));
 demand(pages.filter(entry=>entry.rendererAvailability.kind==='registered').length===61&&
  pages.every((entry,index)=>index===61||entry===base.pages[index]),'one preview page only');
 return Object.freeze({...base,
  descriptorId:`${base.descriptorId}:p062-unregistered-product-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p062-unregistered-product-v1`}),
  pages:Object.freeze(pages),glossary:base.glossary,productBridge:base.productBridge,
 });
}
