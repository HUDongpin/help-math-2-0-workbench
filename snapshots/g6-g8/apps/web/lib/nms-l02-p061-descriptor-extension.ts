import {P061_GLOSSARY_SOURCE_DISPOSITION,P061_SOURCE_TERMS} from
  '../../../packages/demos/src/generated/nms-l02-p061-terms-v1';
import {nmsL02P061CandidateDescriptorV1} from './nms-l02-p061-candidate-descriptor-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

export {P061_DESCRIPTOR_GLOSSARY_QUALIFICATION} from './nms-l02-p061-candidate-descriptor-v1';

const ID='shared-nms002-l02-p061';
const SOURCE_SHA='4712cc077841cc0d16ea63c0c10827b933a0904a80eef010ec8f04eed5ffa50a';
const XML_SHA='550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61';
const PRODUCT_SHA='3151623a0e76ef184bc4008a4641ab957f95967c72623264310be5a9e3ad6f3c';
const XML_PATH='G6-G8-shared/NMS002/L2/index.xml';
const SOURCE_PATH='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/NMS002/L2/TS/L2TS08.swf';
const CALIBRATION='g678-nms-l02-p061-conditional-host-current-js-v1';
const FREEZE_PATH=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
const pageId=(ordinal:number)=>`shared-nms002-l02-p${String(ordinal).padStart(3,'0')}`;
const EXPECTED_REGISTERED_BEFORE=Object.freeze([
  ...Array.from({length:52},(_,index)=>pageId(index+1)),
  pageId(55),pageId(56),pageId(57),pageId(58),pageId(59),pageId(60),pageId(63),
]);
const EXPECTED_REGISTERED_AFTER=Object.freeze([
  ...EXPECTED_REGISTERED_BEFORE.slice(0,-1),ID,pageId(63),
]);
const NEW_TERM_IDS=Object.freeze(['equivalent-decimal','express','denominator','percent','equivalent-fraction']);
type Pin=Readonly<{path:string;sha256:string;bytes?:number}>;

/** Supplied only after independent physical page-proof, registration, and
 * source-run verification. This projection performs no I/O or registry read. */
export interface NmsL02P061DescriptorProvenance {
  readonly calibrationId:string;
  readonly sourceXml:Pin;
  readonly source:Pin;
  readonly selectedPage:Readonly<{
    animationId:string;placementId:string;assetId:string;
    globalPageOrdinal:number;sectionCode:string;sectionPageOrdinal:number;
    sourceOccurrence:number;sourceSha256:string;
    runtime:Readonly<{
      frameDomain:string;frameCount:number;rootBeginFrame:number;fps:number;
      stage:Readonly<{width:number;height:number}>;scenario:string;
    }>;
  }>;
  readonly freeze:Pin;
  readonly glossary:Readonly<{
    candidateSha256:string;product:Pin;sourceSelection:string;
    originalL2XmlResolved:false;historicalHostAssociationEstablished:false;
    originalRuntimeLookupVerified:false;
    modernSelectionByScreenkeyTerm:false;
    conditionalModernLabelResolutionReviewed:true;
  }>;
}

function demand(ok:unknown,reason:string):asserts ok {
  if(!ok)throw Error(`NMS_L02_P061_DESCRIPTOR_INVALID: ${reason}`);
}
const sha256=(value:string)=>/^[0-9a-f]{64}$/u.test(value);

function verifyProvenance(value:NmsL02P061DescriptorProvenance):void {
  const selected=value.selectedPage;
  demand(value.calibrationId===CALIBRATION,'calibration ID');
  demand(value.sourceXml.path===XML_PATH&&value.sourceXml.bytes===12845&&
    value.sourceXml.sha256===XML_SHA,'source XML pin');
  demand(value.source.path===SOURCE_PATH&&value.source.bytes===585741&&
    value.source.sha256===SOURCE_SHA,'P061 SWF pin');
  demand(selected.animationId===ID&&selected.placementId===ID&&
    selected.assetId===`swf-${SOURCE_SHA}`&&selected.sourceSha256===SOURCE_SHA&&
    selected.globalPageOrdinal===61&&selected.sourceOccurrence===61&&
    selected.sectionCode==='TS'&&selected.sectionPageOrdinal===7,
    'selected P061 source placement');
  const runtime=selected.runtime;
  demand(runtime.frameDomain==='sprite-315'&&runtime.frameCount===882&&
    runtime.rootBeginFrame===6&&runtime.fps===12&&
    runtime.stage.width===800&&runtime.stage.height===600&&
    runtime.scenario==='source-static-frame','selected P061 runtime');
  demand(value.freeze.path===FREEZE_PATH&&sha256(value.freeze.sha256),
    'freeze manifest pin');
  demand(value.glossary.candidateSha256===P061_GLOSSARY_SOURCE_DISPOSITION.candidateSha256&&
    value.glossary.product.path==='packages/demos/src/generated/nms-l02-p061-terms-v1.ts'&&
    value.glossary.product.bytes===14048&&value.glossary.product.sha256===PRODUCT_SHA&&
    value.glossary.sourceSelection===P061_GLOSSARY_SOURCE_DISPOSITION.sourceSelection&&
    value.glossary.originalL2XmlResolved===false&&
    value.glossary.historicalHostAssociationEstablished===false&&
    value.glossary.originalRuntimeLookupVerified===false&&
    value.glossary.modernSelectionByScreenkeyTerm===false&&
    value.glossary.conditionalModernLabelResolutionReviewed===true,
    'conditional parsed-label glossary pin');
}

/** Promote only the exact P061 source placement in a verified 59-page P060
 * descriptor. The proof reader must first establish the actual private
 * registry row, immutable source run, page closure, and freeze bytes. */
export function extendNmsL02P061Descriptor(
  base:PageOnlyLessonPlayerDescriptor,
  provenance:NmsL02P061DescriptorProvenance,
):PageOnlyLessonPlayerDescriptor {
  verifyProvenance(provenance);
  demand(base.schemaVersion===2&&base.course.moduleCode==='NMS002'&&
    base.course.lesson===2&&base.course.activePageCount===64&&
    base.course.expectedReleaseMemberCount===64&&base.course.courseShellCount===0&&
    base.pages.length===64&&base.productBridge.pageOnlyDescriptorMemberCount===64&&
    base.productBridge.registeredAnimationCount===59,
    'P060 predecessor counts');
  demand(base.source.sourceXmlPath===XML_PATH&&base.source.sourceXmlSha256===XML_SHA&&
    base.source.sourceXmlSha256===provenance.sourceXml.sha256,
    'predecessor source XML');
  demand(base.pages.every((page,index)=>{
    const ordinal=index+1,prev=ordinal===1?null:pageId(ordinal-1),
      next=ordinal===64?null:pageId(ordinal+1);
    return page.animationId===pageId(ordinal)&&page.placementId===pageId(ordinal)&&
      page.globalPageOrdinal===ordinal&&page.source.sourceOccurrence===ordinal&&
      page.previousPlacementId===prev&&page.nextPlacementId===next&&
      page.previousAnimationId===prev&&page.nextAnimationId===next;
  }),'64-page source order and links');
  const target=base.pages[60];
  demand(target.animationId===ID&&target.sectionCode==='TS'&&
    target.sectionPageOrdinal===7&&target.source.assetId===`swf-${SOURCE_SHA}`&&
    target.rendererAvailability.kind==='unavailable'&&
    target.labels.en.text==='Question 2'&&target.labels.es.text==='Pregunta 2',
    'unavailable exact P061 placement');
  const registeredBefore=base.pages.filter(page=>page.rendererAvailability.kind==='registered')
    .map(page=>page.animationId);
  demand(JSON.stringify(registeredBefore)===JSON.stringify(EXPECTED_REGISTERED_BEFORE)&&
    JSON.stringify(base.productBridge.selectedAnimationIds)===JSON.stringify(EXPECTED_REGISTERED_BEFORE),
    'registered P060 predecessor identity and order');
  const acceptance=base.productBridge.acceptanceEffects;
  demand(acceptance.authoritativeOriginalRuntime===false&&acceptance.fidelityAccepted===false&&
    acceptance.audioAccepted===false&&acceptance.humanVisualAccepted===false&&
    acceptance.ownerAccepted===false&&acceptance.strictComplete===false&&
    acceptance.published===false&&Object.values(acceptance).every(value=>value===false),
    'predecessor acceptance boundary');
  demand(base.glossary.length===20&&new Set(base.glossary.map(term=>term.id )).size===20&&
    new Set(base.glossary.map(term=>term.sourceKeyAttribute )).size===20&&
    P061_SOURCE_TERMS.length===6&&
    JSON.stringify(P061_SOURCE_TERMS.filter(term=>term.id!=='decimal-fraction').map(term=>term.id))===
      JSON.stringify(NEW_TERM_IDS),'source glossary identity');

  // The maintained local candidate already checks all six definitions,
  // including the pre-existing Decimal fraction entry, against the qualified L1 pins.
  const preview=nmsL02P061CandidateDescriptorV1(base);
  demand(preview.productBridge===base.productBridge&&preview.glossary.length===25&&
    preview.glossary.find(term=>term.id==='decimal-fraction')===
      base.glossary.find(term=>term.id==='decimal-fraction')&&
    preview.pages.every((page,index)=>index===60||page===base.pages[index]),
    'candidate changed predecessor members');
  const registeredAfter=preview.pages.filter(page=>page.rendererAvailability.kind==='registered')
    .map(page=>page.animationId);
  demand(JSON.stringify(registeredAfter)===JSON.stringify(EXPECTED_REGISTERED_AFTER)&&
    preview.glossary.slice(20).map(term=>term.id).join(',')===NEW_TERM_IDS.join(','),
    'P061 descriptor and glossary delta');
  return Object.freeze({...base,
    descriptorId:`${base.descriptorId}:${provenance.calibrationId}`,
    calibrationId:provenance.calibrationId,
    // A page admission has its own release identity; appending predecessor IDs
    // eventually exceeds the memory host 256-character identifier contract.
    releaseId:provenance.calibrationId,
    course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}`}),
    source:Object.freeze({...base.source,candidateFreezeManifestPath:provenance.freeze.path,
      candidateFreezeManifestSha256:provenance.freeze.sha256}),
    persistence:Object.freeze({...base.persistence,
      storageKey:`${base.persistence.storageKey}:${provenance.calibrationId}`}),
    pages:preview.pages,glossary:preview.glossary,
    productBridge:Object.freeze({...base.productBridge,
      selectedAnimationIds:Object.freeze(registeredAfter),registeredAnimationCount:60}),
  });
}
