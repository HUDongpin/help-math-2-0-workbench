import {P060_GLOSSARY_SOURCE_DISPOSITION,P060_SOURCE_TERMS} from
  '../../../packages/demos/src/generated/nms-l02-p060-terms-v1';
import {nmsL02P060CandidateDescriptorV1} from './nms-l02-p060-candidate-descriptor-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

export {P060_DESCRIPTOR_GLOSSARY_QUALIFICATION} from './nms-l02-p060-candidate-descriptor-v1';

const ID='shared-nms002-l02-p060';
const SOURCE_SHA='80410162eebca2f85b9aaccec9c91c8d74250c0cba6051595579b4df206215c1';
const XML_SHA='550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61';
const PRODUCT_SHA='476bd5597e35e08b32a54cd89c4ea7753466ecb9f6580fea615b4de7d2a9d7bf';
const XML_PATH='G6-G8-shared/NMS002/L2/index.xml';
const SOURCE_PATH='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/NMS002/L2/TS/L2TS07.swf';
const CALIBRATION='g678-nms-l02-p060-conditional-host-current-js-v1';
const FREEZE_PATH=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
const pageId=(ordinal:number)=>`shared-nms002-l02-p${String(ordinal).padStart(3,'0')}`;
const EXPECTED_REGISTERED_BEFORE=Object.freeze([
  ...Array.from({length:52},(_,index)=>pageId(index+1)),
  pageId(55),pageId(56),pageId(57),pageId(58),pageId(59),pageId(63),
]);
const EXPECTED_REGISTERED_AFTER=Object.freeze([
  ...EXPECTED_REGISTERED_BEFORE.slice(0,-1),ID,pageId(63),
]);
const NEW_TERM_IDS=Object.freeze(['decimal-fraction','equivalent','decimal','grid','part','value','represent']);
type Pin=Readonly<{path:string;sha256:string;bytes?:number}>;

/** Supplied only after independent physical page-proof, registration, and
 * source-run verification. This projection performs no I/O or registry read. */
export interface NmsL02P060DescriptorProvenance {
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
  if(!ok)throw Error(`NMS_L02_P060_DESCRIPTOR_INVALID: ${reason}`);
}
const sha256=(value:string)=>/^[0-9a-f]{64}$/u.test(value);

function verifyProvenance(value:NmsL02P060DescriptorProvenance):void {
  const selected=value.selectedPage;
  demand(value.calibrationId===CALIBRATION,'calibration ID');
  demand(value.sourceXml.path===XML_PATH&&value.sourceXml.bytes===12845&&
    value.sourceXml.sha256===XML_SHA,'source XML pin');
  demand(value.source.path===SOURCE_PATH&&value.source.bytes===577367&&
    value.source.sha256===SOURCE_SHA,'P060 SWF pin');
  demand(selected.animationId===ID&&selected.placementId===ID&&
    selected.assetId===`swf-${SOURCE_SHA}`&&selected.sourceSha256===SOURCE_SHA&&
    selected.globalPageOrdinal===60&&selected.sourceOccurrence===60&&
    selected.sectionCode==='TS'&&selected.sectionPageOrdinal===6,
    'selected P060 source placement');
  const runtime=selected.runtime;
  demand(runtime.frameDomain==='sprite-391'&&runtime.frameCount===721&&
    runtime.rootBeginFrame===6&&runtime.fps===12&&
    runtime.stage.width===800&&runtime.stage.height===600&&
    runtime.scenario==='source-static-frame','selected P060 runtime');
  demand(value.freeze.path===FREEZE_PATH&&sha256(value.freeze.sha256),
    'freeze manifest pin');
  demand(value.glossary.candidateSha256===P060_GLOSSARY_SOURCE_DISPOSITION.candidateSha256&&
    value.glossary.product.path==='packages/demos/src/generated/nms-l02-p060-terms-v1.ts'&&
    value.glossary.product.bytes===19429&&value.glossary.product.sha256===PRODUCT_SHA&&
    value.glossary.sourceSelection===P060_GLOSSARY_SOURCE_DISPOSITION.sourceSelection&&
    value.glossary.originalL2XmlResolved===false&&
    value.glossary.historicalHostAssociationEstablished===false&&
    value.glossary.originalRuntimeLookupVerified===false&&
    value.glossary.modernSelectionByScreenkeyTerm===false&&
    value.glossary.conditionalModernLabelResolutionReviewed===true,
    'conditional parsed-label glossary pin');
}

/** Promote only the exact P060 source placement in a verified 58-page P058
 * descriptor. The proof reader must first establish the actual private
 * registry row, immutable source run, page closure, and freeze bytes. */
export function extendNmsL02P060Descriptor(
  base:PageOnlyLessonPlayerDescriptor,
  provenance:NmsL02P060DescriptorProvenance,
):PageOnlyLessonPlayerDescriptor {
  verifyProvenance(provenance);
  demand(base.schemaVersion===2&&base.course.moduleCode==='NMS002'&&
    base.course.lesson===2&&base.course.activePageCount===64&&
    base.course.expectedReleaseMemberCount===64&&base.course.courseShellCount===0&&
    base.pages.length===64&&base.productBridge.pageOnlyDescriptorMemberCount===64&&
    base.productBridge.registeredAnimationCount===58,
    'P058 predecessor counts');
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
  const target=base.pages[59];
  demand(target.animationId===ID&&target.sectionCode==='TS'&&
    target.sectionPageOrdinal===6&&target.source.assetId===`swf-${SOURCE_SHA}`&&
    target.rendererAvailability.kind==='unavailable'&&
    target.labels.en.text==='Question 1'&&target.labels.es.text==='Pregunta 1',
    'unavailable exact P060 placement');
  const registeredBefore=base.pages.filter(page=>page.rendererAvailability.kind==='registered')
    .map(page=>page.animationId);
  demand(JSON.stringify(registeredBefore)===JSON.stringify(EXPECTED_REGISTERED_BEFORE)&&
    JSON.stringify(base.productBridge.selectedAnimationIds)===JSON.stringify(EXPECTED_REGISTERED_BEFORE),
    'registered P058 predecessor identity and order');
  const acceptance=base.productBridge.acceptanceEffects;
  demand(acceptance.authoritativeOriginalRuntime===false&&acceptance.fidelityAccepted===false&&
    acceptance.audioAccepted===false&&acceptance.humanVisualAccepted===false&&
    acceptance.ownerAccepted===false&&acceptance.strictComplete===false&&
    acceptance.published===false&&Object.values(acceptance).every(value=>value===false),
    'predecessor acceptance boundary');
  demand(base.glossary.length===13&&new Set(base.glossary.map(term=>term.id)).size===13&&
    new Set(base.glossary.map(term=>term.sourceKeyAttribute)).size===13&&
    P060_SOURCE_TERMS.length===8&&
    JSON.stringify(P060_SOURCE_TERMS.filter(term=>term.id!=='fraction').map(term=>term.id))===
      JSON.stringify(NEW_TERM_IDS),'source glossary identity');

  // The maintained local candidate already checks all eight definitions,
  // including the pre-existing Fraction entry, against the qualified L1 pins.
  const preview=nmsL02P060CandidateDescriptorV1(base);
  demand(preview.productBridge===base.productBridge&&preview.glossary.length===20&&
    preview.glossary.find(term=>term.id==='fraction')===
      base.glossary.find(term=>term.id==='fraction')&&
    preview.pages.every((page,index)=>index===59||page===base.pages[index]),
    'candidate changed predecessor members');
  const registeredAfter=preview.pages.filter(page=>page.rendererAvailability.kind==='registered')
    .map(page=>page.animationId);
  demand(JSON.stringify(registeredAfter)===JSON.stringify(EXPECTED_REGISTERED_AFTER)&&
    preview.glossary.slice(13).map(term=>term.id).join(',')===NEW_TERM_IDS.join(','),
    'P060 descriptor and glossary delta');
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
      selectedAnimationIds:Object.freeze(registeredAfter),registeredAnimationCount:59}),
  });
}
