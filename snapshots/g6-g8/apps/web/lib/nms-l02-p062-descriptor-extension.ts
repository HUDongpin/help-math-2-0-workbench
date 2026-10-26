import {nmsL02P062CandidateDescriptorV1} from './nms-l02-p062-candidate-descriptor-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const ID='shared-nms002-l02-p062';
const SOURCE_SHA='5a075362f005aab68406d5fae2378f622a64520ec19e4b03b9ac9abbbd5faa50';
const XML_SHA='550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61';
const CALIBRATION='g678-nms-l02-p062-conditional-host-current-js-v1';
const XML_PATH='G6-G8-shared/NMS002/L2/index.xml';
const SOURCE_PATH='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/NMS002/L2/TS/L2TS09.swf';
type Pin=Readonly<{path:string;sha256:string;bytes?:number}>;

/** Supplied only after the reader verifies source, page proof and registration. */
export interface NmsL02P062DescriptorProvenance {
 readonly calibrationId:string;
 readonly sourceXml:Pin;
 readonly source:Pin;
 readonly selectedPage:Readonly<{
  animationId:string;placementId:string;assetId:string;sourceSha256:string;
  globalPageOrdinal:number;sourceOccurrence:number;sectionCode:string;sectionPageOrdinal:number;
  runtime:Readonly<{frameDomain:string;frameCount:number;rootBeginFrame:number;fps:number;
   stage:Readonly<{width:number;height:number}>;scenario:string}>;
 }>;
 readonly freeze:Pin;
 readonly sourceKeyAttributeCalls:0;
}
function demand(ok:unknown,reason:string):asserts ok{
 if(!ok)throw Error(`NMS_L02_P062_DESCRIPTOR_INVALID: ${reason}`);
}

export function extendNmsL02P062Descriptor(base:PageOnlyLessonPlayerDescriptor,
 provenance:NmsL02P062DescriptorProvenance):PageOnlyLessonPlayerDescriptor{
 const p=provenance,s=p.selectedPage,r=s.runtime;
 demand(p.calibrationId===CALIBRATION,'calibration identity');
 demand(p.sourceXml.path===XML_PATH&&p.sourceXml.bytes===12845&&p.sourceXml.sha256===XML_SHA,
  'source XML identity');
 demand(p.source.path===SOURCE_PATH&&p.source.bytes===564902&&p.source.sha256===SOURCE_SHA,
  'physical SWF identity');
 demand(s.animationId===ID&&s.placementId===ID&&s.assetId===`swf-${SOURCE_SHA}`&&
  s.sourceSha256===SOURCE_SHA&&s.globalPageOrdinal===62&&s.sourceOccurrence===62&&
  s.sectionCode==='TS'&&s.sectionPageOrdinal===8,'exact P062 source placement');
 demand(r.frameDomain==='sprite-315'&&r.frameCount===837&&r.rootBeginFrame===6&&r.fps===12&&
  r.stage.width===800&&r.stage.height===600&&r.scenario==='source-static-frame','source runtime');
 demand(p.freeze.path===`catalog/product-bridge-calibrations/${CALIBRATION}.json`&&
  /^[a-f0-9]{64}$/u.test(p.freeze.sha256),'freeze pin');
 demand(p.sourceKeyAttributeCalls===0,'no invented glossary controls');
 const acceptance=base.productBridge.acceptanceEffects;
 demand(acceptance.authoritativeOriginalRuntime===false&&acceptance.fidelityAccepted===false&&
  acceptance.audioAccepted===false&&acceptance.humanVisualAccepted===false&&
  acceptance.ownerAccepted===false&&acceptance.strictComplete===false&&acceptance.published===false,
  'independent acceptance gates');
 const preview=nmsL02P062CandidateDescriptorV1(base);
 demand(preview.productBridge===base.productBridge&&preview.glossary===base.glossary&&
  preview.pages.every((page,index)=>index===61||page===base.pages[index]),'one-page projection');
 const selected=preview.pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(selected.length===61&&selected.includes(ID),'registered count after projection');
 return Object.freeze({...base,
  descriptorId:`${base.descriptorId}:${CALIBRATION}`,calibrationId:CALIBRATION,releaseId:CALIBRATION,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}`}),
  source:Object.freeze({...base.source,candidateFreezeManifestPath:p.freeze.path,
   candidateFreezeManifestSha256:p.freeze.sha256}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:${CALIBRATION}`}),
  pages:preview.pages,glossary:base.glossary,
  productBridge:Object.freeze({...base.productBridge,selectedAnimationIds:Object.freeze(selected),
   registeredAnimationCount:61}),
 });
}
