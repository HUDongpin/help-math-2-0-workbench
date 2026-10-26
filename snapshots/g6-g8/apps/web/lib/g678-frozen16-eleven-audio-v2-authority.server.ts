import {createHash} from 'node:crypto';
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual as exact} from 'node:util';
import * as prepared from './g678-frozen16-prepared-glossary-authority.server';
import {FROZEN_CONTINUOUS_SOURCE_MEMBERS} from '../../../packages/demos/src/frozen-continuous-source-scope';
import type {FrozenGlossaryBinding,FrozenGlossaryPin} from './g678-frozen16-glossary-authority.server';
export const FROZEN_GLOSSARY_FREEZE=Object.freeze({path:'catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v22.json',bytes:2532682,sha256:'05da16855d5e8dc2549caf6248da7a730a2db9616e1e5da526c906c4641182fe'});
export const AUDIO_CANDIDATE=Object.freeze({path:'work/g678-shared-page-factory/frozen16-eleven-audio-v3/manifest.json',bytes:48965,sha256:'9859194b03fc52c9258f86398f1d0cc11de505e554e7c8cd02afca5b638b1635'});
export const FROZEN_GLOSSARY_REGISTRY_WITNESS=prepared.FROZEN_GLOSSARY_REGISTRY_WITNESS;
const NMS='shared-nms002-l02-p020',GEO='shared-geo001-l01-p001';
export const FROZEN_GLOSSARY_IDS=Object.freeze([...prepared.FROZEN_GLOSSARY_IDS,NMS]);
type Value=Record<string,any>;
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const encode=(v:unknown)=>Buffer.from(JSON.stringify(v,null,2)+'\n');
function demand(v:unknown,message:string):asserts v{if(!v)throw Error('ELEVEN_AUDIO_AUTHORITY_INVALID: '+message);}
function canonical(b:FrozenGlossaryBinding,p:FrozenGlossaryPin){const bytes=encode(b.value);demand(b.path===p.path&&b.bytes===p.bytes&&b.sha256===p.sha256&&bytes.length===p.bytes&&sha(bytes)===p.sha256,'canonical binding');return b.value as Value;}
function physical(root:string,p:FrozenGlossaryPin){const file=path.resolve(root,p.path);demand([root,'/Volumes/American Dream/hudongpin/helpmath-execution-20260906-01a0747f'].some(r=>file.startsWith(r+path.sep))&&realpathSync(file)===file,'physical path');const before=lstatSync(file,{bigint:true}),bytes=readFileSync(file),after=lstatSync(file,{bigint:true});demand(before.isFile()&&before.nlink===1n&&before.ino===after.ino&&before.mtimeNs===after.mtimeNs&&before.size===after.size&&bytes.length===p.bytes&&sha(bytes)===p.sha256,'physical drift: '+p.path);return bytes;}
export function validateFrozenGlossaryReplacement(input:{predecessor:FrozenGlossaryBinding;freeze:FrozenGlossaryBinding;candidate:FrozenGlossaryBinding}){
 const current=canonical(input.freeze,FROZEN_GLOSSARY_FREEZE);demand(exact(current.inputs.frozenContinuousAudioManifest,AUDIO_CANDIDATE),'audio pointer');
 const prior=structuredClone(current),audioEntries:Value[]=[];
 for(const member of FROZEN_CONTINUOUS_SOURCE_MEMBERS){const id=member.animationId,selected=prior.selectedPages.find((p:Value)=>p.animationId===id),extension=selected?.frozenContinuousAudio;
  demand(extension?.kind==='frozen16-eleven-audio-v3'&&extension.audioAccepted===false&&extension.sourceAlignmentAccepted===false&&exact(extension.candidateManifest,AUDIO_CANDIDATE),'pending audio extension');
  demand(extension.entry?.key===id&&extension.entry.module===(id===NMS?'./modules/nms-l02-hover-audio':id===GEO?'./modules/frozen16-geo-intro-v2-'+GEO:'./modules/'+(member.audioFirstFrame>1?'frozen16-nine-audio-':id==='shared-dat001-l03-p030'?'frozen16-five-audio-':'frozen16-four-audio-')+id)&&extension.sourceSha256===member.sourceSwfSha256,'exact source/module');audioEntries.push(extension.entry);delete selected.frozenContinuousAudio;
 }
 const nms=prior.selectedPages.find((p:Value)=>p.animationId===NMS),before=nms?.frozenNmsHover?.before;
 demand(before?.animationId===NMS&&before.sourceSha256===nms.sourceSha256&&before.runtime.frameDomain==='sprite-69','exact NMS predecessor');
 const nmsEntry=audioEntries.find(e=>e.key===NMS)!;
 demand(exact(nmsEntry.artifacts.runtime,{path:nms.runtime.canvasRenderer.path,bytes:nms.runtime.canvasRenderer.bytes,sha256:nms.runtime.canvasRenderer.sha256}),'NMS Canvas binding');
 prior.selectedPages=prior.selectedPages.map((p:Value)=>p.animationId===NMS?before:p);
 const geo=prior.selectedPages.find((p:Value)=>p.animationId===GEO),geoBefore=geo?.frozenGeoIntro?.before;
 demand(geoBefore?.animationId===GEO&&geoBefore.sourceSha256===geo.sourceSha256&&geo.runtime.interactiveSeek===undefined&&geo.runtime.companionDomains.length===0&&geo.frozenGeoIntro.unusedPageControlsRemoved===true&&geo.frozenGeoIntro.modernHostControlsPreserved===true,'exact GEO source control correction');
 const geoEntry=audioEntries.find(e=>e.key===GEO)!;demand(geo.frozenGeoIntro.immutableRegistryProperty===true&&exact(geoEntry.artifacts.runtime,{path:geo.runtime.canvasRenderer.path,bytes:geo.runtime.canvasRenderer.bytes,sha256:geo.runtime.canvasRenderer.sha256}),'GEO immutable Canvas binding');
 prior.selectedPages=prior.selectedPages.map((p:Value)=>p.animationId===GEO?geoBefore:p);
 delete prior.inputs.frozenContinuousAudioManifest;
 const bytes=encode(prior);demand(bytes.length===prepared.FROZEN_GLOSSARY_FREEZE.bytes&&sha(bytes)===prepared.FROZEN_GLOSSARY_FREEZE.sha256,'only eleven audio extensions and exact NMS/GEO replacements may differ from v5');
 const inherited=prepared.validateFrozenGlossaryReplacement({...input,freeze:{...prepared.FROZEN_GLOSSARY_FREEZE,value:prior}});
 const entries:Value[]=inherited.entries.map(entry=>{const priorEntry=entry as Value,audio=audioEntries.find(e=>e.key===priorEntry.key);return audio?{...priorEntry,module:audio.module,artifacts:{...priorEntry.artifacts as Value,module:audio.artifacts.module}}:priorEntry;});
 entries.push({...nmsEntry,controls:nms.frozenNmsHover.controls,glossaryEntries:nms.glossaryEntries,presentation:nms.presentation});
 return{...inherited,entries,audioEntries};
}
function readCandidate(root:string){
 const candidate=JSON.parse(physical(root,AUDIO_CANDIDATE).toString()) as Value;
 demand(candidate.kind==='frozen16-eleven-audio-v3'&&candidate.members.length===11&&Object.values(candidate.acceptanceEffects).every(v=>v===false),'candidate contract');
 demand(exact(candidate.members.map((m:Value)=>m.entry.key),FROZEN_CONTINUOUS_SOURCE_MEMBERS.map(m=>m.animationId)),'exact original member order');
 for(const pin of [...candidate.inputs,...candidate.outputs])physical(root,pin);
 for(const member of candidate.members){const allowed=FROZEN_CONTINUOUS_SOURCE_MEMBERS.find(m=>m.animationId===member.entry.key);demand(allowed?.sourceSwfSha256===member.sourceSha256,'source identity');demand(candidate.outputs.some((p:FrozenGlossaryPin)=>exact(p,member.sourceAsset)),'exact payload output');}
 return candidate;
}
export function readContinuousAudioCandidate(root:string,id:string){const member=readCandidate(root).members.find((m:Value)=>m.entry.key===id);demand(member,'audio member not admitted');return member as Value&{sourceAsset:FrozenGlossaryPin};}
export function readFrozenGlossaryPackage(root:string,freeze?:FrozenGlossaryBinding){
 const inherited=prepared.readFrozenGlossaryPackage(root),bound=freeze??{...FROZEN_GLOSSARY_FREEZE,value:JSON.parse(physical(root,FROZEN_GLOSSARY_FREEZE).toString())};
 const checked=validateFrozenGlossaryReplacement({predecessor:inherited.predecessor,freeze:bound,candidate:inherited.candidate}),candidate=readCandidate(root);
 demand(exact(candidate.members.map((m:Value)=>m.entry),checked.audioEntries),'physical registered entries');
 for(const member of candidate.members){const extension=(bound.value as Value).selectedPages.find((p:Value)=>p.animationId===member.entry.key).frozenContinuousAudio;demand(exact(extension.sourceAsset,member.sourceAsset)&&exact(extension.plan,member.plan),'exact payload and plan');}
 return{...inherited,...checked,physicalPaths:[...new Set([...inherited.physicalPaths,path.join(root,FROZEN_GLOSSARY_FREEZE.path),path.join(root,AUDIO_CANDIDATE.path),...[...candidate.inputs,...candidate.outputs].map((p:FrozenGlossaryPin)=>path.resolve(root,p.path))])]};
}
