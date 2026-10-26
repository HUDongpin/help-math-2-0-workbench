import {nmsL02P054ProductDescriptorV1} from './nms-l02-p054-product-descriptor-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const ID='shared-nms002-l02-p054';
const CALIBRATION='g678-nms-l02-p054-source-matching-current-js-v1';
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_SHA='06bde171fe294f555f983c15b50afbb53344851cdc2f76e31e5eb5a4719cabb8';
const XML_SHA='550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61';
const sourcePath=`${SOURCE_ROOT}/G6-G8-shared/NMS002/L2/GS/L2GS03.swf`;
type Pin=Readonly<{path:string;sha256:string;bytes?:number}>;
export interface NmsL02P054DescriptorProvenance {
 readonly calibrationId:string;
 readonly sourceXml:Pin;
 readonly source:Pin;
 readonly selectedPage:Readonly<{
  animationId:string;placementId:string;assetId:string;sourceSha256:string;
  globalPageOrdinal:number;sourceOccurrence:number;sectionCode:string;sectionPageOrdinal:number;
  runtime:Readonly<{frameDomain:string;frameCount:number;rootFrameCount:number;
   rootBeginFrame:number;fps:number;stage:Readonly<{width:number;height:number}>;
   scenario:string;seed:string;terminalOutcome:string;hostPlaybackCompletion:boolean}>;
 }>;
 readonly freeze:Pin;
 readonly sourceKeyAttributeCalls:0;
}
function demand(ok:unknown,reason:string):asserts ok{
 if(!ok)throw Error(`NMS_L02_P054_DESCRIPTOR_INVALID: ${reason}`);
}
const pageId=(ordinal:number)=>`shared-nms002-l02-p${String(ordinal).padStart(3,'0')}`;
const expectedRegistered=Object.freeze([...Array.from({length:52},(_,i)=>pageId(i+1)),
 ...[54,55,56,57,58,59,60,61,62,63,64].map(pageId)]);

/** Pure descriptor projection. The caller must independently verify the page
 * proof and registry transaction before supplying its provenance. */
export function extendNmsL02P054Descriptor(base:PageOnlyLessonPlayerDescriptor,
 provenance:NmsL02P054DescriptorProvenance,level:1|2=1):PageOnlyLessonPlayerDescriptor{
 const p=provenance,s=p.selectedPage,r=s.runtime;
 demand(level===1||level===2,'only two source levels');
 demand(p.calibrationId===CALIBRATION,'exact calibration');
 demand(p.sourceXml.path==='G6-G8-shared/NMS002/L2/index.xml'&&
  p.sourceXml.bytes===12845&&p.sourceXml.sha256===XML_SHA,'lesson XML identity');
 demand(p.source.path===sourcePath&&p.source.bytes===2077270&&
  p.source.sha256===SOURCE_SHA,'physical GS2 source identity');
 demand(s.animationId===ID&&s.placementId===ID&&s.assetId===`swf-${SOURCE_SHA}`&&
  s.sourceSha256===SOURCE_SHA&&s.globalPageOrdinal===54&&s.sourceOccurrence===54&&
  s.sectionCode==='GS'&&s.sectionPageOrdinal===2,'P054 source placement');
 demand(r.frameDomain==='sprite-731'&&r.frameCount===5&&r.rootFrameCount===10&&
  r.rootBeginFrame===6&&r.fps===12&&r.stage.width===800&&r.stage.height===600&&
  r.scenario==='source-matching-level-1'&&r.seed==='0'&&
  r.terminalOutcome==='terminal-unresolved'&&r.hostPlaybackCompletion===false,
  'source frame domains, default Level 1 and unresolved ending');
 demand(p.freeze.path===`catalog/product-bridge-calibrations/${CALIBRATION}.json`&&
  Number.isSafeInteger(p.freeze.bytes)&&Number(p.freeze.bytes)>0&&
  /^[a-f0-9]{64}$/u.test(p.freeze.sha256),'freeze pin shape');
 demand(p.sourceKeyAttributeCalls===0,'no invented glossary call');
 const candidate=nmsL02P054ProductDescriptorV1(base,level);
 demand(candidate.pages.every((page,index)=>index===53||page===base.pages[index])&&
  candidate.glossary===base.glossary&&candidate.productBridge===base.productBridge&&
  candidate.support===base.support,'only GS2 product projection');
 const selected=candidate.pages.filter(page=>page.rendererAvailability.kind==='registered')
  .map(page=>page.animationId);
 demand(JSON.stringify(selected)===JSON.stringify(expectedRegistered)&&
  selected.length===63&&candidate.pages[52].rendererAvailability.kind==='unavailable',
  'P053 unavailable, P054 newly registered, source order intact');
 demand(Object.values(base.productBridge.acceptanceEffects).every(value=>value===false),
  'no independent gate promotion');
 return Object.freeze({...base,
  descriptorId:`${base.descriptorId}:${CALIBRATION}`,calibrationId:CALIBRATION,releaseId:CALIBRATION,
  course:candidate.course,
  source:Object.freeze({...base.source,candidateFreezeManifestPath:p.freeze.path,
   candidateFreezeManifestSha256:p.freeze.sha256}),
  persistence:Object.freeze({...base.persistence,storageKey:`${base.persistence.storageKey}:${CALIBRATION}`}),
  support:base.support,pages:candidate.pages,glossary:base.glossary,
  productBridge:Object.freeze({...base.productBridge,selectedAnimationIds:Object.freeze(selected),
   registeredAnimationCount:63}),
 });
}
