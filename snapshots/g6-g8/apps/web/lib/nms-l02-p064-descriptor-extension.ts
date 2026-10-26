import {nmsL02P064CandidateDescriptorV1} from './nms-l02-p064-candidate-descriptor-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const ID='shared-nms002-l02-p064';
const SOURCE_SHA='f655f05d7be5576503a66f52909b322bd3fce3e7b51a7fcda52291f755bf346c';
const XML_SHA='550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61';
const CALIBRATION='g678-nms-l02-p064-source-quiz-current-js-v1';
const SOURCE_PATH='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/NMS002/L2/FQ/L2FQ02.swf';
type Pin=Readonly<{path:string;sha256:string;bytes?:number}>;
export interface NmsL02P064DescriptorProvenance {
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
 if(!ok)throw Error(`NMS_L02_P064_DESCRIPTOR_INVALID: ${reason}`);
}

/** Only the proof reader can establish the provenance supplied here. The
 * projected quiz remains an interaction state machine with unresolved exit. */
export function extendNmsL02P064Descriptor(base:PageOnlyLessonPlayerDescriptor,
 provenance:NmsL02P064DescriptorProvenance,seed=0):PageOnlyLessonPlayerDescriptor{
 const p=provenance,s=p.selectedPage,r=s.runtime;
 demand(p.calibrationId===CALIBRATION,'calibration identity');
 demand(p.sourceXml.path==='G6-G8-shared/NMS002/L2/index.xml'&&
  p.sourceXml.bytes===12845&&p.sourceXml.sha256===XML_SHA,'source XML identity');
 demand(p.source.path===SOURCE_PATH&&p.source.bytes===55392&&p.source.sha256===SOURCE_SHA,
  'physical SWF identity');
 demand(s.animationId===ID&&s.placementId===ID&&s.assetId===`swf-${SOURCE_SHA}`&&
  s.sourceSha256===SOURCE_SHA&&s.globalPageOrdinal===64&&s.sourceOccurrence===64&&
  s.sectionCode==='FQ'&&s.sectionPageOrdinal===2,'exact P064 placement');
 demand(r.frameDomain==='sprite-1258'&&r.frameCount===90&&r.rootBeginFrame===6&&r.fps===12&&
  r.stage.width===800&&r.stage.height===600&&r.scenario==='source-quiz-seeded','source runtime');
 demand(p.freeze.path===`catalog/product-bridge-calibrations/${CALIBRATION}.json`&&
  /^[a-f0-9]{64}$/u.test(p.freeze.sha256),'freeze pin');
 demand(p.sourceKeyAttributeCalls===0,'no invented glossary controls');
 demand(Object.values(base.productBridge.acceptanceEffects).every(value=>value===false),
  'independent acceptance gates');
 const projected=nmsL02P064CandidateDescriptorV1(base,seed);
 demand(projected.pages.every((page,index)=>index===63||page===base.pages[index])&&
  projected.glossary===base.glossary&&projected.productBridge===base.productBridge,
  'one-page source-order projection');
 const selected=projected.pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(selected.length===62&&selected.at(-1)===ID,'62 registered placements');
 return Object.freeze({...base,
  descriptorId:`${base.descriptorId}:${CALIBRATION}`,calibrationId:CALIBRATION,releaseId:CALIBRATION,
  course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ID}`}),
  source:Object.freeze({...base.source,candidateFreezeManifestPath:p.freeze.path,
   candidateFreezeManifestSha256:p.freeze.sha256}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:${CALIBRATION}`}),
  support:projected.support,pages:projected.pages,glossary:base.glossary,
  productBridge:Object.freeze({...base.productBridge,selectedAnimationIds:Object.freeze(selected),
   registeredAnimationCount:62}),
 });
}
