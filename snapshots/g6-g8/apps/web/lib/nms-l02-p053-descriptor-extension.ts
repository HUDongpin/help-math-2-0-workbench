import {nmsL02P053ProductDescriptorV1} from './nms-l02-p053-product-descriptor-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
const ID='shared-nms002-l02-p053';
const CALIBRATION='g678-nms-l02-p053-source-directions-current-js-v1';
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_SHA='f42f6a4759759561035a7c97e7392241513d0410d69214af422425ef37523fdf';
type Pin=Readonly<{path:string;sha256:string;bytes?:number}>;
export interface NmsL02P053DescriptorProvenance {
 readonly calibrationId:string;readonly sourceXml:Pin;readonly source:Pin;
 readonly selectedPage:Readonly<{
  animationId:string;placementId:string;assetId:string;sourceSha256:string;
  globalPageOrdinal:number;sourceOccurrence:number;sectionCode:string;sectionPageOrdinal:number;
  runtime:Readonly<{frameDomain:string;frameCount:number;heldFrame:number;rootFrameCount:number;
   rootBeginFrame:number;fps:number;stage:Readonly<{width:number;height:number}>;
   scenario:string;seed:string;hostPlaybackCompletion:boolean;popupCloseReceiverResolved:boolean;
   audioSynchronizationEstablished:boolean}>;
 }>;
 readonly freeze:Pin;readonly sourceKeyAttributeCalls:0;
}
function demand(ok:unknown,reason:string):asserts ok{
 if(!ok)throw Error(`NMS_L02_P053_DESCRIPTOR_INVALID: ${reason}`);
}
/** The proof reader verifies actual registration before applying this pure
 * final-page projection. Every downstream acceptance flag stays unchanged. */
export function extendNmsL02P053Descriptor(base:PageOnlyLessonPlayerDescriptor,
 provenance:NmsL02P053DescriptorProvenance):PageOnlyLessonPlayerDescriptor{
 const p=provenance,s=p.selectedPage,r=s.runtime;
 demand(p.calibrationId===CALIBRATION,'calibration');
 demand(p.sourceXml.path==='G6-G8-shared/NMS002/L2/index.xml'&&p.sourceXml.bytes===12845&&
  p.sourceXml.sha256==='550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61',
  'source-ordered lesson XML');
 demand(p.source.path===`${SOURCE_ROOT}/G6-G8-shared/NMS002/L2/GS/L2GS02.swf`&&
  p.source.bytes===236774&&p.source.sha256===SOURCE_SHA,'real GS1 source');
 demand(s.animationId===ID&&s.placementId===ID&&s.assetId===`swf-${SOURCE_SHA}`&&
  s.sourceSha256===SOURCE_SHA&&s.globalPageOrdinal===53&&s.sourceOccurrence===53&&
  s.sectionCode==='GS'&&s.sectionPageOrdinal===1,'GS1 placement');
 demand(r.frameDomain==='sprite-187'&&r.frameCount===694&&r.heldFrame===693&&
  r.rootFrameCount===10&&r.rootBeginFrame===6&&r.fps===12&&
  r.stage.width===800&&r.stage.height===600&&r.scenario==='source-directions-v1'&&r.seed==='0'&&
  r.hostPlaybackCompletion===false&&r.popupCloseReceiverResolved===false&&
  r.audioSynchronizationEstablished===false,'source frame hold and independent unresolved gates');
 demand(p.freeze.path===`catalog/product-bridge-calibrations/${CALIBRATION}.json`&&
  Number.isSafeInteger(p.freeze.bytes)&&Number(p.freeze.bytes)>0&&/^[a-f0-9]{64}$/u.test(p.freeze.sha256),
  'freeze pin shape');
 demand(p.sourceKeyAttributeCalls===0,'no source glossary call');
 const candidate=nmsL02P053ProductDescriptorV1(base);
 const selected=candidate.pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(selected.length===64&&selected.every((id,index)=>
  id===`shared-nms002-l02-p${String(index+1).padStart(3,'0')}`),'all 64 source-order placements');
 return Object.freeze({...base,descriptorId:`${base.descriptorId}:${CALIBRATION}`,
  calibrationId:CALIBRATION,releaseId:CALIBRATION,course:candidate.course,
  source:Object.freeze({...base.source,candidateFreezeManifestPath:p.freeze.path,
   candidateFreezeManifestSha256:p.freeze.sha256}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:${CALIBRATION}`}),
  support:candidate.support,pages:candidate.pages,glossary:base.glossary,
  productBridge:Object.freeze({...base.productBridge,selectedAnimationIds:Object.freeze(selected),
   registeredAnimationCount:64}),
 });
}
