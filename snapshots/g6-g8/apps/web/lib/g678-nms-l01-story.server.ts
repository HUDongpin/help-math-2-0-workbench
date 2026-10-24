import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync,readFileSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P002Descriptor,NMS_L1_P002_FREEZE,NMS_L1_P002_CALIBRATION} from './g678-nms-l01-p002.server';
import type {PageOnlyLessonPlayerDescriptor,WholeLessonPlayerPage} from './whole-lesson-player-descriptor';
export const NMS_L1_FOLLOWUP_IDS=Object.freeze(['shared-nms002-l01-p003','shared-nms002-l01-p004'] as const);
export const NMS_L1_FOLLOWUP_CALIBRATION='g678-nms-l01-p003-p004-current-js-v2';
export const NMS_L1_FOLLOWUP_FREEZE=Object.freeze({path:'catalog/product-bridge-calibrations/g678-nms-l01-p003-p004-current-js-v2.json',bytes:71857,sha256:'d05e5d71064ff597b371977eb4bd90335ebeda32245a52b66246cd4a6a3a8342'});
type Pin=Readonly<{path:string;bytes:number;sha256:string}>;
type Entry={key:string;artifacts:{module:Pin;timeline:Pin;runtime:Pin}};
type Registration=ReturnType<typeof localOnlyAnimationModuleRegistration>;
interface Packet {
 schemaVersion:number;calibrationId:string;deploymentScope:string;baseProductCandidate:Pin;baseEntry:Entry;sourceCatalog:Pin;sourceXml:Pin;inputs:Pin[];outputs:Pin[];entries:Entry[];
 selectedPages:Array<{animationId:string;globalPageOrdinal:number;sectionPageOrdinal:number;sectionCode:string;sourceSha256:string;runtime:{frameDomain:string;frameCount:number;canvasRenderer:Pin};runtimeEvidenceBoundary:WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
 members:Array<{animationId:string;source:Pin;sourceSpec:Pin;sourceFreeze:Pin;entry:Entry;sourceCorrections:Pin[];sourceGlossary:{entries:PageOnlyLessonPlayerDescriptor['glossary']}|null;audioPlan:{frameDomain:string;firstFrame:number;lastFrame:number;audioFirstFrame?:number;fps:number;latencySamples?:number;decoder:{sampleRate:number;channels:number;decodedSamples:number;sourceSha256:string}}}>;
 productCalibrationPassed:boolean;scaleOutAuthorized:boolean;acceptanceEffects:Record<string,boolean>;
 productHost:{module:string;runtimeAdapters:string[];newlyRegisteredAdapters:string[]};
}
function demand(value:unknown,message:string):asserts value {if(!value)throw Error(`NMS_L1_FOLLOWUP_INVALID: ${message}`);}
export function readNmsL1FollowupBinding(root:string,pin:Pin){
 const file=path.resolve(root,pin.path),anchors=[root,'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222','/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware','/Volumes/WestWorld/HELP MATH Related Files/Private Recovery Containers/2026-08-25-BOULDER-LEARNING-AWS-S3-EMERGENCY-V1'];
 demand(anchors.some(anchor=>file.startsWith(`${anchor}${path.sep}`))&&realpathSync(file)===file,'physical source path');
 const before=lstatSync(file,{bigint:true}),bytes=readFileSync(file),after=lstatSync(file,{bigint:true});
 demand(before.isFile()&&before.nlink===1n&&['dev','ino','size','mode','mtimeNs','nlink'].every(key=>before[key as keyof typeof before]===after[key as keyof typeof after]),'physical source identity');
 demand(bytes.length===pin.bytes&&createHash('sha256').update(bytes).digest('hex')===pin.sha256,`source hash: ${pin.path}`);return bytes;
}
export function readNmsL1FollowupPacket(root=getWorkspaceRoot()):Packet {
 demand(process.env.NODE_ENV!=='production','production closed');
 const packet=JSON.parse(readNmsL1FollowupBinding(root,NMS_L1_FOLLOWUP_FREEZE).toString()) as Packet;
 demand(packet.schemaVersion===1&&packet.calibrationId===NMS_L1_FOLLOWUP_CALIBRATION&&packet.deploymentScope==='local-only','candidate scope');
 for(const rows of [packet.entries.map(p=>p.key),packet.members.map(p=>p.animationId),packet.selectedPages.map(p=>p.animationId),packet.productHost.newlyRegisteredAdapters])demand(isDeepStrictEqual(rows,NMS_L1_FOLLOWUP_IDS),'exact paired members');
 demand(isDeepStrictEqual(packet.productHost.runtimeAdapters,['shared-nms002-l01-p002',...NMS_L1_FOLLOWUP_IDS])&&isDeepStrictEqual(packet.baseProductCandidate,NMS_L1_P002_FREEZE)&&packet.baseEntry.key==='shared-nms002-l01-p002','preserve existing source story entry');
 demand(packet.productHost.module==='apps/web/components/g678-multi-page-lesson-player-v3.generated.tsx','explicit multi-page host');
 demand(packet.productCalibrationPassed===false&&packet.scaleOutAuthorized===false&&Object.values(packet.acceptanceEffects).every(v=>v===false),'independent acceptance');
 const expected=[['6486970403a56712ad47bd50f504b8a6209226517016b6fedc70bf1de481643c',310459,'sprite-82',892],['3c35af96419daf09d110ed722a861248dd10d57677135c4ef23f0b4b28249c1d',1015332,'sprite-302',341]];
 packet.members.forEach((member,i)=>{const [sha,bytes,domain,frames]=expected[i],page=packet.selectedPages[i];
  demand(member.source.sha256===sha&&member.source.bytes===bytes&&page.sourceSha256===sha&&page.runtime.frameDomain===domain&&page.runtime.frameCount===frames,'exact source member');
  demand(member.audioPlan.frameDomain===domain&&member.audioPlan.lastFrame===frames&&member.audioPlan.fps===12&&member.audioPlan.decoder.channels===1,'source stream');
  demand(isDeepStrictEqual(member.entry,packet.entries[i])&&page.runtime.canvasRenderer.path===member.entry.artifacts.runtime.path,'source member artifacts');
 });
 demand(packet.members[0].sourceCorrections.length===1&&packet.members[0].sourceCorrections[0].sha256==='5c0f3ea1c1553cf3a6512fc4decd6a7d9c632ed0c68f063f4a21599d14327d02'&&packet.members[1].sourceCorrections.length===0,'explicit source teaching correction');
 for(const pin of [...packet.inputs,...packet.outputs])readNmsL1FollowupBinding(root,pin);return packet;
}
export function extendNmsL1FollowupDescriptor(base:PageOnlyLessonPlayerDescriptor,packet:Packet,registrations:readonly Registration[]):PageOnlyLessonPlayerDescriptor {
 demand(base.course.moduleCode==='NMS002'&&base.course.lesson===1&&base.course.activePageCount===47&&base.pages.length===47&&base.course.courseShellCount===0,'source lesson denominator');
 demand(base.source.sourceXmlSha256===packet.sourceXml.sha256&&base.source.sourceXmlPath===packet.sourceXml.path,'source XML');
 demand(base.calibrationId===NMS_L1_P002_CALIBRATION&&base.source.candidateFreezeManifestSha256===NMS_L1_P002_FREEZE.sha256&&base.productBridge.registeredAnimationCount===13&&base.pages[1].animationId==='shared-nms002-l01-p002'&&base.pages[1].rendererAvailability.kind==='registered','validated preceding13-page lesson');
 demand(base.glossary.length===23&&packet.members[0].sourceGlossary?.entries.length===3&&packet.members[1].sourceGlossary===null,'source glossary scope');
 for(const entry of packet.members[0].sourceGlossary!.entries){const projected={id:entry.id,sourceKeyAttribute:entry.sourceKeyAttribute,labels:entry.labels,definitions:entry.definitions,source:entry.source};demand(isDeepStrictEqual(base.glossary.find(e=>e.id===entry.id),projected),'preserve all source glossary entries');}
 demand(registrations.length===2,'two registrations required');
 packet.members.forEach((member,i)=>{
  const reg=registrations[i],artifacts=member.entry.artifacts,old=base.pages[2+i];
  demand(reg?.calibrationId===NMS_L1_FOLLOWUP_CALIBRATION&&reg.deploymentScope==='local-only'&&reg.maturity==='private-current-js'&&reg.freezeManifestSha256===NMS_L1_FOLLOWUP_FREEZE.sha256&&reg.moduleSha256===artifacts.module.sha256&&reg.timelineSha256===artifacts.timeline.sha256&&reg.runtimeSha256===artifacts.runtime.sha256,'actual paired registered modules');
  demand(old.animationId===NMS_L1_FOLLOWUP_IDS[i]&&old.placementId===NMS_L1_FOLLOWUP_IDS[i]&&old.globalPageOrdinal===3+i&&old.sectionCode==='RW'&&old.sectionPageOrdinal===2+i&&old.rendererAvailability.kind==='unavailable'&&old.source.assetId===`swf-${member.source.sha256}`,'exact unavailable source placements');
 });
 const pages=base.pages.map(page=>{
  const i=NMS_L1_FOLLOWUP_IDS.findIndex(id=>id===page.animationId);if(i<0)return page;
  return Object.freeze({...page,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:NMS_L1_FOLLOWUP_IDS[i],runtimeQuery:Object.freeze({frameDomain:packet.members[i].audioPlan.frameDomain,language:'fixed-en' as const,scenario:'source-static-frame',seed:'0'})}),
   runtimeEvidenceBoundary:packet.selectedPages[i].runtimeEvidenceBoundary,presentation:Object.freeze({pageInteractionCompanionTargetIdSuffix:'terminal-source-v1-readable'})});
 });
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered').map(page=>page.animationId);
 demand(selected.length===base.productBridge.registeredAnimationCount+2&&new Set(selected).size===selected.length,'two-page registration delta');
 return Object.freeze({...base,calibrationId:NMS_L1_FOLLOWUP_CALIBRATION,course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${NMS_L1_FOLLOWUP_IDS[0]}`}),
  source:Object.freeze({...base.source,candidateFreezeManifestPath:NMS_L1_FOLLOWUP_FREEZE.path,candidateFreezeManifestSha256:NMS_L1_FOLLOWUP_FREEZE.sha256}),pages:Object.freeze(pages),
  productBridge:Object.freeze({...base.productBridge,selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export function nmsL1StoryDescriptor():PageOnlyLessonPlayerDescriptor {
 const packet=readNmsL1FollowupPacket(),base=nmsL1P002Descriptor();
 return extendNmsL1FollowupDescriptor(base,packet,NMS_L1_FOLLOWUP_IDS.map(id=>localOnlyAnimationModuleRegistration(id)));
}
export function nmsL1StoryCanvas(animationId:string):{bytes:Buffer;sha256:string}{
 const packet=readNmsL1FollowupPacket(),member=packet.members.find(m=>m.animationId===animationId);demand(member,'exact pair asset');
 const binding=member.entry.artifacts.runtime;demand(binding.path.endsWith(`/members/${animationId}/canvas-renderer.js`),'member asset path');
 return {bytes:readNmsL1FollowupBinding(getWorkspaceRoot(),binding),sha256:binding.sha256};
}
