import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const ID='shared-nms002-l02-p064';
const SOURCE_SHA='f655f05d7be5576503a66f52909b322bd3fce3e7b51a7fcda52291f755bf346c';
const XML_SHA='550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61';
const pageId=(ordinal:number)=>`shared-nms002-l02-p${String(ordinal).padStart(3,'0')}`;
const EXPECTED_REGISTERED=Object.freeze([...Array.from({length:52},(_,i)=>pageId(i+1)),
 ...[55,56,57,58,59,60,61,62,63].map(pageId)]);

function demand(ok:unknown,reason:string):asserts ok{
 if(!ok)throw Error(`NMS_L02_P064_CANDIDATE_INVALID: ${reason}`);
}

/** Project one runnable final-quiz candidate from the actual registered P062
 * lesson. Scoring exists only in this memory-only local descriptor; its
 * product bridge still counts the 61 independently registered placements. */
export function nmsL02P064CandidateDescriptorV1(
 base:PageOnlyLessonPlayerDescriptor,seed=0,
):PageOnlyLessonPlayerDescriptor{
 demand(Number.isSafeInteger(seed)&&seed>=0&&seed<=0xffff_ffff,'uint32 quiz seed');
 demand(base.schemaVersion===2&&base.course.moduleCode==='NMS002'&&base.course.lesson===2&&
  base.course.activePageCount===64&&base.course.expectedReleaseMemberCount===64&&
  base.course.courseShellCount===0&&base.pages.length===64&&
  base.productBridge.pageOnlyDescriptorMemberCount===64&&
  base.productBridge.registeredAnimationCount===61,'P062 registered predecessor counts');
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
 const page=base.pages[63];
 demand(page.animationId===ID&&page.sectionCode==='FQ'&&page.sectionPageOrdinal===2&&
  page.globalPageOrdinal===64&&page.source.assetId===`swf-${SOURCE_SHA}`&&
  page.source.xmlNavigation==='OFF'&&page.rendererAvailability.kind==='unavailable'&&
  page.labels.en.text==='Page 1'&&page.labels.es.text==='Page 1',
  'exact unavailable FQ2 placement and source title');
 demand(Object.values(base.productBridge.acceptanceEffects).every(value=>value===false),
  'predecessor acceptance boundary');
 demand(base.glossary.length===25&&new Set(base.glossary.map(term=>term.id)).size===25&&
  new Set(base.glossary.map(term=>term.sourceKeyAttribute)).size===25,
  'registered predecessor glossary');
 demand(JSON.stringify(base.support.lessonHostCapabilities)==='["glossary"]',
  'exact predecessor host capabilities');
 const pages=base.pages.map((entry,index)=>index!==63?entry:Object.freeze({...entry,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-1258',language:'fixed-en' as const,
    scenario:'source-quiz-seeded',seed:String(seed)})}),
  runtimeEvidenceBoundary:Object.freeze({
   runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-interaction-reset-original-runtime-parity-not-established' as const,
   productBehavior:'maintained-javascript-state-machine-implemented' as const,
   productVisualBehaviorComposite:'not-established' as const,
  }),
 }));
 demand(pages.filter(entry=>entry.rendererAvailability.kind==='registered').length===62&&
  pages.every((entry,index)=>index===63||entry===base.pages[index]),'one preview page only');
 const support=Object.freeze({...base.support,
  lessonHostCapabilities:Object.freeze([...base.support.lessonHostCapabilities,'fq-scoring' as const])});
 return Object.freeze({...base,
  descriptorId:`${base.descriptorId}:p064-unregistered-quiz-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p064-unregistered-quiz-v1`}),
  support,pages:Object.freeze(pages),glossary:base.glossary,productBridge:base.productBridge,
 });
}
