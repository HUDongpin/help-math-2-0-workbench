import 'server-only';
import {isDeepStrictEqual as exact} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P045Descriptor,readNmsL1P045Binding,NMS_L1_P045_CALIBRATION,NMS_L1_P045_FREEZE} from './g678-nms-l01-p045.server';
import type {PageOnlyLessonPlayerDescriptor,WholeLessonPlayerPage} from './whole-lesson-player-descriptor';
export const NMS_L1_P047_ID='shared-nms002-l01-p047';
export const NMS_L1_P047_CALIBRATION='g678-nms-l01-p047-native-quiz-current-js-v1';
export const NMS_L1_P047_FREEZE=Object.freeze({path:'catalog/product-bridge-calibrations/g678-nms-l01-p047-native-quiz-current-js-v1-feedback-v3.json',bytes:277482,sha256:'161e26c38d0cb7e831265230f5fdff9002ff05e54d90fe4baeca5d7966fb57fa'});
type Pin=Readonly<{path:string;bytes:number;sha256:string}>;
type Artifact={kind:'maintained-dom-module-v1';module:Pin;timeline:Pin;memberManifest:Pin;sourceRun:Pin};
interface Packet {schemaVersion:number;calibrationId:string;deploymentScope:string;source:Pin;sourceXml:Pin;
  entry:{key:string;artifacts:Artifact};inputs:Pin[];outputs:Pin[];questionCount:number;sessionQuestionCount:number;
  selectedPages:{animationId:string;sourceSha256:string;runtimeEvidenceBoundary:WholeLessonPlayerPage['runtimeEvidenceBoundary']}[];
  audioAssets:{id:string;question:number;choice:'A'|'B'|'C'|'D'|null;language:'en'|'es';source:Pin;url:string;samples:number;sampleRate:number;channels:number}[];
  productCalibrationPassed:boolean;scaleOutAuthorized:boolean;acceptanceEffects:Record<string,boolean>;
}
function demand(value:unknown,message:string):asserts value {if(!value)throw Error('NMS_L1_P047_INVALID: '+message);}
export function readNmsL1P047Packet(root=getWorkspaceRoot()):Packet {
  demand(process.env.NODE_ENV!=='production','production closed');
  const packet=JSON.parse(readNmsL1P045Binding(root,NMS_L1_P047_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion===1&&packet.calibrationId===NMS_L1_P047_CALIBRATION&&packet.deploymentScope==='local-only','exact candidate');
  demand(packet.source.sha256==='748d7393d44dcfe9110ff429d0d8adcd6ec872bbf28a4ab6d2c4a4237f394647'&&packet.source.bytes===78002&&packet.source.path==='G6-G8-shared/NMS002/L1/FQ/L1FQ02.swf','exact source');
  demand(packet.entry.key===NMS_L1_P047_ID&&packet.entry.artifacts.kind==='maintained-dom-module-v1'&&packet.selectedPages.length===1
    &&packet.selectedPages[0].animationId===NMS_L1_P047_ID&&packet.selectedPages[0].sourceSha256===packet.source.sha256,'single maintained page');
  demand(packet.questionCount===27&&packet.sessionQuestionCount===10&&packet.audioAssets.length===270,'source quiz cardinalities');
  const seen=new Set<string>();
  for(const asset of packet.audioAssets){
    demand(Number.isInteger(asset.question)&&asset.question>=1&&asset.question<=27&&['en','es'].includes(asset.language)&&[null,'A','B','C','D'].includes(asset.choice),'source audio selection');
    demand(asset.id===`p047-q${asset.question}-${asset.choice??'question'}-${asset.language}`&&!seen.has(asset.id),'source audio identity');seen.add(asset.id);
    demand(asset.url===`/flash-assets/g678-local/${NMS_L1_P047_ID}/quiz-audio/${asset.id}`&&asset.sampleRate===44100&&asset.channels===1&&Number.isInteger(asset.samples)&&asset.samples>0,'audio endpoint and sample binding');
    demand(asset.source.path===`/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/NMS002/L1/FQ/${asset.language==='en'?'EA':'SA'}/Q${asset.question}${asset.choice??''}.mp3`,'bounded canonical source path');
  }
  demand(packet.productCalibrationPassed===false&&packet.scaleOutAuthorized===false&&Object.values(packet.acceptanceEffects).length>0&&Object.values(packet.acceptanceEffects).every(value=>value===false),'independent gates');
  for(const pin of [...packet.inputs,...packet.outputs])readNmsL1P045Binding(root,pin);
  return packet;
}
export function validateNmsL1P047Registration(packet:Packet,registration:ReturnType<typeof localOnlyAnimationModuleRegistration>) {
  const r=registration as (NonNullable<typeof registration>&{rendererBindingKind?:string;memberManifestSha256?:string;sourceRunSha256?:string})|undefined;
  demand(r?.calibrationId===NMS_L1_P047_CALIBRATION&&r.deploymentScope==='local-only'&&r.maturity==='private-current-js'&&r.freezeManifestSha256===NMS_L1_P047_FREEZE.sha256,'registered local candidate');
  demand(r.rendererBindingKind==='maintained-dom-module-v1'&&r.moduleSha256===packet.entry.artifacts.module.sha256&&r.timelineSha256===packet.entry.artifacts.timeline.sha256
    &&r.memberManifestSha256===packet.entry.artifacts.memberManifest.sha256&&r.sourceRunSha256===packet.entry.artifacts.sourceRun.sha256,'actual DOM module artifacts');
}
export function extendNmsL1P047Descriptor(base:PageOnlyLessonPlayerDescriptor,packet:Packet,registration:ReturnType<typeof localOnlyAnimationModuleRegistration>):PageOnlyLessonPlayerDescriptor {
  validateNmsL1P047Registration(packet,registration);
  demand(base.calibrationId===NMS_L1_P045_CALIBRATION&&base.source.candidateFreezeManifestSha256===NMS_L1_P045_FREEZE.sha256
    &&base.course.moduleCode==='NMS002'&&base.course.lesson===1&&base.course.activePageCount===47&&base.pages.length===47&&base.course.courseShellCount===0&&base.productBridge.registeredAnimationCount===46,'validated46-page predecessor');
  const page=base.pages[46];demand(page.animationId===NMS_L1_P047_ID&&page.rendererAvailability.kind==='unavailable'&&page.globalPageOrdinal===47&&page.sectionCode==='FQ'&&page.sectionPageOrdinal===2&&page.source.assetId===`swf-${packet.source.sha256}`,'exact last source placement');
  demand(base.source.sourceXmlPath===packet.sourceXml.path&&base.source.sourceXmlSha256===packet.sourceXml.sha256,'same source lesson sequence');
  const pages=base.pages.map(page=>page.animationId===NMS_L1_P047_ID?Object.freeze({...page,
    rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:NMS_L1_P047_ID,runtimeQuery:Object.freeze({frameDomain:'sprite-1024',language:'fixed-en' as const,scenario:'source-quiz',seed:'0'})}),
    runtimeEvidenceBoundary:packet.selectedPages[0].runtimeEvidenceBoundary,
  }):page);
  const selected=pages.filter(page=>page.rendererAvailability.kind==='registered').map(page=>page.animationId);demand(selected.length===47&&new Set(selected).size===47,'one-page registration delta');
  demand(exact(base.pages.slice(0,46),pages.slice(0,46)),'preserve all preceding pages');
  return Object.freeze({...base,calibrationId:NMS_L1_P047_CALIBRATION,course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${NMS_L1_P047_ID}`}),
    source:Object.freeze({...base.source,candidateFreezeManifestPath:NMS_L1_P047_FREEZE.path,candidateFreezeManifestSha256:NMS_L1_P047_FREEZE.sha256}),
    pages:Object.freeze(pages),productBridge:Object.freeze({...base.productBridge,registeredAnimationCount:47,selectedAnimationIds:Object.freeze(selected)})});
}
export function nmsL1P047Descriptor(){return extendNmsL1P047Descriptor(nmsL1P045Descriptor(),readNmsL1P047Packet(),localOnlyAnimationModuleRegistration(NMS_L1_P047_ID));}
export function readNmsL1P047Audio(assetId:string,sha256:string){
  const packet=readNmsL1P047Packet();
  // An unregistered candidate never exposes its files through this endpoint.
  validateNmsL1P047Registration(packet,localOnlyAnimationModuleRegistration(NMS_L1_P047_ID));
  const asset=packet.audioAssets.find(asset=>asset.id===assetId&&asset.source.sha256===sha256);demand(asset,'exact admitted audio hash');
  return {bytes:readNmsL1P045Binding(getWorkspaceRoot(),asset.source),sha256:asset.source.sha256};
}
