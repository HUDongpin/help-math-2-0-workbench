import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync,readFileSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {g678PartialCalibrationSnapshot} from './g678-calibration-product-bridge.server';
import type {PageOnlyLessonPlayerDescriptor,WholeLessonPlayerPage} from './whole-lesson-player-descriptor';
export const ALG_L10_PAIR_IDS=Object.freeze(['shared-alg001-l10-p005','shared-alg001-l10-p006'] as const);
export const ALG_L10_PAIR_CALIBRATION='g678-alg-l10-p005-p006-native-decoder-v2';
export const ALG_L10_PAIR_FREEZE=Object.freeze({"path":"catalog/product-bridge-calibrations/g678-alg-l10-p005-p006-native-decoder-v2.json","bytes":78244,"sha256":"a23c8e318e4dc9ca05479b6559fd389887e1f764caaeae761d6dc9238d25b6af"});
type Pin=Readonly<{path:string;bytes:number;sha256:string}>;
type Entry={key:string;artifacts:{module:Pin;timeline:Pin;runtime:Pin}};
type Registration=ReturnType<typeof localOnlyAnimationModuleRegistration>;
interface Packet {
 schemaVersion:number;calibrationId:string;deploymentScope:string;sourceCatalog:Pin;sourceXml:Pin;inputs:Pin[];outputs:Pin[];entries:Entry[];
 selectedPages:Array<{animationId:string;globalPageOrdinal:number;sectionPageOrdinal:number;sectionCode:string;sourceSha256:string;runtime:{frameDomain:string;frameCount:number;canvasRenderer:Pin};runtimeEvidenceBoundary:WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
 members:Array<{animationId:string;source:Pin;sourceSpec:Pin;sourceFreeze:Pin;entry:Entry;audioPlan:{frameDomain:string;firstFrame:number;lastFrame:number;audioFirstFrame:number;fps:number;latencySamples:number;decoder:{sampleRate:number;channels:number;decodedSamples:number;sourceSha256:string}}}>;
 productCalibrationPassed:boolean;scaleOutAuthorized:boolean;acceptanceEffects:Record<string,boolean>;
 productHost:{module:string;runtimeAdapters:string[]};
}
function demand(value:unknown,message:string):asserts value {if(!value)throw Error(`ALG_L10_PAIR_INVALID: ${message}`);}
export function readAlgL10PairBinding(root:string,pin:Pin){
 const file=path.resolve(root,pin.path),anchors=[root,'/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222','/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware',"/Volumes/American Dream/g678-p005-native-diagnostic-20261008-v1","/Volumes/American Dream/g678-p006-native-diagnostic-20261008-v1","/Volumes/American Dream/g678-p005-native-diagnostic-preparation-20261008-v1","/Volumes/American Dream/g678-p006-native-diagnostic-preparation-20261008-v1"];
 demand(anchors.some(anchor=>file.startsWith(`${anchor}${path.sep}`))&&realpathSync(file)===file,'physical source path');
 const before=lstatSync(file,{bigint:true}),bytes=readFileSync(file),after=lstatSync(file,{bigint:true});
 demand(before.isFile()&&before.nlink===1n&&['dev','ino','size','mode','mtimeNs','nlink'].every(key=>before[key as keyof typeof before]===after[key as keyof typeof after]),'physical source identity');
 demand(bytes.length===pin.bytes&&createHash('sha256').update(bytes).digest('hex')===pin.sha256,`source hash: ${pin.path}`);return bytes;
}
export function readAlgL10PairPacket(root=getWorkspaceRoot()):Packet {
 demand(process.env.NODE_ENV!=='production','production closed');
 const packet=JSON.parse(readAlgL10PairBinding(root,ALG_L10_PAIR_FREEZE).toString()) as Packet;
 demand(packet.schemaVersion===1&&packet.calibrationId===ALG_L10_PAIR_CALIBRATION&&packet.deploymentScope==='local-only','candidate scope');
 for(const rows of [packet.entries.map(p=>p.key),packet.members.map(p=>p.animationId),packet.selectedPages.map(p=>p.animationId),packet.productHost.runtimeAdapters])demand(isDeepStrictEqual(rows,ALG_L10_PAIR_IDS),'exact paired members');
 demand(packet.productHost.module==='apps/web/components/g678-multi-page-lesson-player-v3.generated.tsx','explicit multi-page host');
 demand(packet.productCalibrationPassed===false&&packet.scaleOutAuthorized===false&&Object.values(packet.acceptanceEffects).every(v=>v===false),'independent acceptance');
 const expected=[['fb1e8707652f7eec02443c63a4ce4e068642cbc91e222d2b19a02acdcbde23e7',430730,'sprite-128',1304],['3843394c1ebfd124c72fb191e71a5568fe6673db2d8250f32ac0b1f74667c0fa',409478,'sprite-78',1106]];
 packet.members.forEach((member,i)=>{const [sha,bytes,domain,frames]=expected[i],page=packet.selectedPages[i];
  demand(member.source.sha256===sha&&member.source.bytes===bytes&&page.sourceSha256===sha&&page.runtime.frameDomain===domain&&page.runtime.frameCount===frames,'exact source member');
  demand(member.audioPlan.frameDomain===domain&&member.audioPlan.lastFrame===frames&&member.audioPlan.fps===12&&member.audioPlan.decoder.channels===1,'source stream');
  demand(isDeepStrictEqual(member.entry,packet.entries[i])&&page.runtime.canvasRenderer.path===member.entry.artifacts.runtime.path,'source member artifacts');
 });
 for(const pin of [...packet.inputs,...packet.outputs])readAlgL10PairBinding(root,pin);return packet;
}
export function extendAlgL10PairDescriptor(base:PageOnlyLessonPlayerDescriptor,packet:Packet,registrations:readonly Registration[]):PageOnlyLessonPlayerDescriptor {
 demand(base.course.moduleCode==='ALG001'&&base.course.lesson===10&&base.course.activePageCount===52&&base.pages.length===52&&base.course.courseShellCount===0,'source lesson denominator');
 demand(base.source.sourceXmlSha256===packet.sourceXml.sha256&&base.source.sourceXmlPath===packet.sourceXml.path,'source XML');
 demand(registrations.length===2,'two registrations required');
 packet.members.forEach((member,i)=>{
  const reg=registrations[i],artifacts=member.entry.artifacts,old=base.pages[4+i];
  demand(reg?.calibrationId===ALG_L10_PAIR_CALIBRATION&&reg.deploymentScope==='local-only'&&reg.maturity==='private-current-js'&&reg.freezeManifestSha256===ALG_L10_PAIR_FREEZE.sha256&&reg.moduleSha256===artifacts.module.sha256&&reg.timelineSha256===artifacts.timeline.sha256&&reg.runtimeSha256===artifacts.runtime.sha256,'actual paired registered modules');
  demand(old.animationId===ALG_L10_PAIR_IDS[i]&&old.placementId===ALG_L10_PAIR_IDS[i]&&old.globalPageOrdinal===5+i&&old.sectionCode==='RW'&&old.sectionPageOrdinal===4+i&&old.rendererAvailability.kind==='unavailable'&&old.source.assetId===`swf-${member.source.sha256}`,'exact unavailable source placements');
 });
 const pages=base.pages.map(page=>{
  const i=ALG_L10_PAIR_IDS.findIndex(id=>id===page.animationId);if(i<0)return page;
  return Object.freeze({...page,rendererAvailability:Object.freeze({kind:'registered' as const,moduleKey:ALG_L10_PAIR_IDS[i],runtimeQuery:Object.freeze({frameDomain:packet.members[i].audioPlan.frameDomain,language:'fixed-en' as const,scenario:'source-static-frame',seed:'0'})}),
   runtimeEvidenceBoundary:packet.selectedPages[i].runtimeEvidenceBoundary,presentation:Object.freeze({pageInteractionCompanionTargetIdSuffix:'terminal-source-v1-readable'})});
 });
 const selected=pages.filter(page=>page.rendererAvailability.kind==='registered').map(page=>page.animationId);
 demand(selected.length===base.productBridge.registeredAnimationCount+2&&new Set(selected).size===selected.length,'two-page registration delta');
 return Object.freeze({...base,calibrationId:ALG_L10_PAIR_CALIBRATION,course:Object.freeze({...base.course,href:`/migration-status/g678-calibration/${ALG_L10_PAIR_IDS[0]}`}),
  source:Object.freeze({...base.source,candidateFreezeManifestPath:ALG_L10_PAIR_FREEZE.path,candidateFreezeManifestSha256:ALG_L10_PAIR_FREEZE.sha256}),pages:Object.freeze(pages),
  productBridge:Object.freeze({...base.productBridge,selectedAnimationIds:Object.freeze(selected),registeredAnimationCount:selected.length})});
}
export function algL10PairDescriptor():PageOnlyLessonPlayerDescriptor {
 const packet=readAlgL10PairPacket(),predecessor=g678PartialCalibrationSnapshot();demand(predecessor.status==='ready','379-page predecessor');
 const matches=predecessor.descriptors.filter(d=>d.course.moduleCode==='ALG001'&&d.course.lesson===10);demand(matches.length===1,'unique source-ordered lesson');
 return extendAlgL10PairDescriptor(matches[0],packet,ALG_L10_PAIR_IDS.map(id=>localOnlyAnimationModuleRegistration(id)));
}
export function algL10PairCanvas(animationId:string):{bytes:Buffer;sha256:string}{
 const packet=readAlgL10PairPacket(),member=packet.members.find(m=>m.animationId===animationId);demand(member,'exact pair asset');
 const binding=member.entry.artifacts.runtime;demand(binding.path.endsWith(`/members/${animationId}/canvas-renderer.js`),'member asset path');
 return {bytes:readAlgL10PairBinding(getWorkspaceRoot(),binding),sha256:binding.sha256};
}
