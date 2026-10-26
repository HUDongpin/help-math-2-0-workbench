import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const ID='shared-nms002-l02-p054';
const SOURCE_SHA='06bde171fe294f555f983c15b50afbb53344851cdc2f76e31e5eb5a4719cabb8';
const XML_SHA='550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61';
const pageId=(ordinal:number)=>`shared-nms002-l02-p${String(ordinal).padStart(3,'0')}`;
const EXPECTED_REGISTERED=Object.freeze([...Array.from({length:52},(_,i)=>pageId(i+1)),
 ...[55,56,57,58,59,60,61,62,63,64].map(pageId)]);

function demand(ok:unknown,reason:string):asserts ok{
 if(!ok)throw Error(`NMS_L02_P054_CANDIDATE_INVALID: ${reason}`);
}

/** Project only the matching candidate from the registered P064 lesson.
 * The formal bridge continues to count only its 62 registered pages. */
export function nmsL02P054ProductDescriptorV1(
 base:PageOnlyLessonPlayerDescriptor,level:1|2=1,
):PageOnlyLessonPlayerDescriptor{
 demand(level===1||level===2,'source game level');
 demand(base.schemaVersion===2&&base.course.moduleCode==='NMS002'&&base.course.lesson===2&&
  base.course.activePageCount===64&&base.course.expectedReleaseMemberCount===64&&
  base.course.courseShellCount===0&&base.pages.length===64&&
  base.productBridge.pageOnlyDescriptorMemberCount===64&&
  base.productBridge.registeredAnimationCount===62,'P064 registered predecessor counts');
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
 const page=base.pages[53];
 demand(page.animationId===ID&&page.sectionCode==='GS'&&page.sectionPageOrdinal===2&&
  page.globalPageOrdinal===54&&page.source.assetId===`swf-${SOURCE_SHA}`&&
  page.source.xmlNavigation===null&&page.rendererAvailability.kind==='unavailable'&&
  page.labels.en.text==='Game 2'&&page.labels.es.text==='Game 2',
  'exact unavailable GS2 placement and source title');
 demand(Object.values(base.productBridge.acceptanceEffects).every(value=>value===false),
  'predecessor acceptance boundary');
 demand(base.glossary.length===25&&new Set(base.glossary.map(term=>term.id)).size===25&&
  new Set(base.glossary.map(term=>term.sourceKeyAttribute)).size===25,
  'registered predecessor glossary');
 demand(JSON.stringify(base.support.lessonHostCapabilities)==='["glossary","fq-scoring"]',
  'exact predecessor host capabilities');
 const pages=base.pages.map((entry,index)=>index!==53?entry:Object.freeze({...entry,
  rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ID,
   runtimeQuery:Object.freeze({frameDomain:'sprite-731',language:'fixed-en' as const,
    scenario:`source-matching-level-${level}`,seed:'0'})}),
  runtimeEvidenceBoundary:Object.freeze({
   runtimeKind:'source-script-bound-product-behavior-current-js-candidate' as const,
   actionScriptExecution:'not-executed' as const,naturalTraceValidation:'not-established' as const,
   audioAcceptance:'not-established' as const,
   replaySemantics:'product-complete-interaction-reset-original-runtime-parity-not-established' as const,
   productBehavior:'maintained-javascript-state-machine-implemented' as const,
   productVisualBehaviorComposite:'not-established' as const,
  }),
 }));
 demand(pages.filter(entry=>entry.rendererAvailability.kind==='registered').length===63&&
  pages.every((entry,index)=>index===53||entry===base.pages[index]),'one preview page only');
 return Object.freeze({...base,
  descriptorId:`${base.descriptorId}:p054-unregistered-matching-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p054-unregistered-matching-v1`}),
  support:base.support,pages:Object.freeze(pages),glossary:base.glossary,productBridge:base.productBridge,
 });
}
