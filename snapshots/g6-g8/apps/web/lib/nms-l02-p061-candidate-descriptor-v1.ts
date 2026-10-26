import type {PageOnlyLessonGlossaryEntry,PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
import {P061_GLOSSARY_SOURCE_DISPOSITION,P061_SOURCE_TERMS} from '../../../packages/demos/src/generated/nms-l02-p061-terms-v1';

const ID='shared-nms002-l02-p061';
const SOURCE_SHA='4712cc077841cc0d16ea63c0c10827b933a0904a80eef010ec8f04eed5ffa50a';
const XML_SHA='550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61';
const pageId=(ordinal:number)=>`shared-nms002-l02-p${String(ordinal).padStart(3,'0')}`;
const EXPECTED_REGISTERED=Object.freeze([...Array.from({length:52},(_,i)=>pageId(i+1)),
 pageId(55),pageId(56),pageId(57),pageId(58),pageId(59),pageId(60),pageId(63)]);
const newTermIds=Object.freeze(['equivalent-decimal','express','denominator','percent','equivalent-fraction']);

/** These terms are from a conditionally selected identified-host L1 bank;
 * neither a recovered L2 bank nor historical P061 host association is claimed. */
export const P061_DESCRIPTOR_GLOSSARY_QUALIFICATION=Object.freeze({
 ...P061_GLOSSARY_SOURCE_DISPOSITION,
 lessonXmlDeclaredBanks:Object.freeze({en:'HELP_KEYTERMS/KT/XML/L2KTE01.xml',es:'HELP_KEYTERMS/KT/XML/L2KTS01.xml'}),
 modernHostSelection:'conditional-identified-host-L1-bank' as const,
});

function demand(ok:unknown,reason:string):asserts ok{
 if(!ok)throw Error(`NMS_L02_P061_CANDIDATE_INVALID: ${reason}`);
}
function termEntry(term:typeof P061_SOURCE_TERMS[number]):PageOnlyLessonGlossaryEntry{
 const source={
  en:{assetId:'G678L1KTE01.xml' as const,path:`HELP_KEYTERMS/KT/XML/${term.conditionalBanks.en.path}`,
   sha256:term.conditionalBanks.en.sha256},
  es:{assetId:'G678L1KTS01.xml' as const,path:`HELP_KEYTERMS/KT/XML/${term.conditionalBanks.es.path}`,
   sha256:term.conditionalBanks.es.sha256},
 };
 return {id:term.id,sourceKeyAttribute:term.sourceKeyAttribute,labels:term.labels,
  definitions:term.definitions,source};
}
function sameCore(a:PageOnlyLessonGlossaryEntry,b:PageOnlyLessonGlossaryEntry){
 return a.id===b.id&&a.sourceKeyAttribute===b.sourceKeyAttribute&&
  (['en','es'] as const).every(locale=>a.labels[locale]===b.labels[locale]&&
   a.definitions[locale]===b.definitions[locale]&&
   a.source[locale].assetId===b.source[locale].assetId&&
   a.source[locale].path===b.source[locale].path&&
   a.source[locale].sha256===b.source[locale].sha256);
}

/** Local-only preview: P061 renders, while productBridge keeps the 59 real registrations. */
export function nmsL02P061CandidateDescriptorV1(base:PageOnlyLessonPlayerDescriptor):PageOnlyLessonPlayerDescriptor{
 demand(base.schemaVersion===2&&base.course.moduleCode==='NMS002'&&base.course.lesson===2&&
  base.course.activePageCount===64&&base.course.expectedReleaseMemberCount===64&&
  base.course.courseShellCount===0&&base.pages.length===64&&
  base.productBridge.pageOnlyDescriptorMemberCount===64&&
  base.productBridge.registeredAnimationCount===59,'P060 registered predecessor counts');
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
 const page=base.pages[60];
 demand(page.animationId===ID&&page.sectionCode==='TS'&&page.sectionPageOrdinal===7&&
  page.globalPageOrdinal===61&&page.source.assetId===`swf-${SOURCE_SHA}`&&
  page.rendererAvailability.kind==='unavailable'&&
  page.labels.en.text==='Question 2'&&page.labels.es.text==='Pregunta 2',
  'exact unavailable P061 placement');
 demand(Object.values(base.productBridge.acceptanceEffects).every(v=>v===false),
  'predecessor acceptance boundary');
 demand(base.glossary.length===20&&new Set(base.glossary.map(term=>term.id)).size===20&&
  new Set(base.glossary.map(term=>term.sourceKeyAttribute)).size===20,
  'predecessor glossary uniqueness');
 demand(P061_SOURCE_TERMS.length===6&&
  JSON.stringify(P061_SOURCE_TERMS.filter(term=>term.id!=='decimal-fraction').map(term=>term.id))===JSON.stringify(newTermIds)&&
  P061_GLOSSARY_SOURCE_DISPOSITION.originalL2XmlResolved===false&&
  P061_GLOSSARY_SOURCE_DISPOSITION.historicalHostAssociationEstablished===false,
  'conditional P061 glossary identity');
 const glossary:PageOnlyLessonGlossaryEntry[]=[...base.glossary];
 for(const raw of P061_SOURCE_TERMS){
  const term=termEntry(raw),byId=glossary.find(entry=>entry.id===term.id),
   byKey=glossary.find(entry=>entry.sourceKeyAttribute===term.sourceKeyAttribute);
  demand((!byId&&!byKey)||(byId===byKey&&byId!==undefined&&sameCore(byId,term)),
   `source glossary collision ${term.id}`);
  if(!byId)glossary.push(term);
 }
 demand(glossary.length===25,'20 previous terms plus five new terms');
 const pages=base.pages.map((entry,index)=>index!==60?entry:Object.freeze({...entry,
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
 demand(pages.filter(entry=>entry.rendererAvailability.kind==='registered').length===60&&
  pages.every((entry,index)=>index===60||entry===base.pages[index]),
  'one preview page only');
 return Object.freeze({...base,
  descriptorId:`${base.descriptorId}:p061-unregistered-product-v1`,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}`}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:p061-unregistered-product-v1`}),
  pages:Object.freeze(pages),glossary:Object.freeze(glossary),
  productBridge:base.productBridge,
 });
}
