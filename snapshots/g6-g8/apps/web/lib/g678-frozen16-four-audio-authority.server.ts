import {createHash} from 'node:crypto';
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual as exact} from 'node:util';
import * as prepared from './g678-frozen16-prepared-glossary-authority.server';
import {FROZEN_CONTINUOUS_SOURCE_MEMBERS} from '../../../packages/demos/src/frozen-continuous-source-scope';
import type {FrozenGlossaryBinding,FrozenGlossaryPin} from './g678-frozen16-glossary-authority.server';
export const FROZEN_GLOSSARY_FREEZE=Object.freeze({path:'catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v10.json',bytes:2504216,sha256:'c2784a52c8f2909b80a91d8c16eb56491f1377251aad259d47d9487ed5fd65c8'});
export const AUDIO_CANDIDATE=Object.freeze({path:'work/g678-shared-page-factory/frozen16-four-audio-v1/manifest.json',bytes:17486,sha256:'f4bd11ba8dcc5465321f80ec5173c36b643e2153b46113c0a273221b56ffd691'});
export const FROZEN_GLOSSARY_REGISTRY_WITNESS=prepared.FROZEN_GLOSSARY_REGISTRY_WITNESS;
export const FROZEN_GLOSSARY_IDS=prepared.FROZEN_GLOSSARY_IDS;
type Value=Record<string,any>;
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const encode=(v:unknown)=>Buffer.from(JSON.stringify(v,null,2)+'\n');
function demand(v:unknown,message:string):asserts v{if(!v)throw Error('FOUR_AUDIO_AUTHORITY_INVALID: '+message);}
function canonical(b:FrozenGlossaryBinding,p:FrozenGlossaryPin){const bytes=encode(b.value);demand(b.path===p.path&&b.bytes===p.bytes&&b.sha256===p.sha256&&bytes.length===p.bytes&&sha(bytes)===p.sha256,'canonical binding');return b.value as Value;}
function physical(root:string,p:FrozenGlossaryPin){const file=path.resolve(root,p.path);demand([root,'/Volumes/American Dream/hudongpin/helpmath-execution-20260906-01a0747f'].some(r=>file.startsWith(r+path.sep))&&realpathSync(file)===file,'physical path');const before=lstatSync(file,{bigint:true}),bytes=readFileSync(file),after=lstatSync(file,{bigint:true});demand(before.isFile()&&before.nlink===1n&&before.ino===after.ino&&before.mtimeNs===after.mtimeNs&&before.size===after.size&&bytes.length===p.bytes&&sha(bytes)===p.sha256,'physical drift: '+p.path);return bytes;}
export function validateFrozenGlossaryReplacement(input:{predecessor:FrozenGlossaryBinding;freeze:FrozenGlossaryBinding;candidate:FrozenGlossaryBinding}){
 const current=canonical(input.freeze,FROZEN_GLOSSARY_FREEZE);demand(exact(current.inputs.frozenContinuousAudioManifest,AUDIO_CANDIDATE),'audio pointer');
 const prior=structuredClone(current),audioEntries:Value[]=[];
 for(const member of FROZEN_CONTINUOUS_SOURCE_MEMBERS){const id=member.animationId,selected=prior.selectedPages.find((p:Value)=>p.animationId===id),extension=selected?.frozenContinuousAudio;
  demand(extension?.kind==='frozen16-four-continuous-audio-v1'&&extension.audioAccepted===false&&extension.sourceAlignmentAccepted===false&&exact(extension.candidateManifest,AUDIO_CANDIDATE),'pending audio extension');
  demand(extension.entry?.key===id&&extension.entry.module==='./modules/frozen16-four-audio-'+id&&extension.sourceSha256===member.sourceSwfSha256,'exact source/module');audioEntries.push(extension.entry);delete selected.frozenContinuousAudio;
 }
 delete prior.inputs.frozenContinuousAudioManifest;
 const bytes=encode(prior);demand(bytes.length===prepared.FROZEN_GLOSSARY_FREEZE.bytes&&sha(bytes)===prepared.FROZEN_GLOSSARY_FREEZE.sha256,'only four exact audio extensions may differ from v5');
 return{...prepared.validateFrozenGlossaryReplacement({...input,freeze:{...prepared.FROZEN_GLOSSARY_FREEZE,value:prior}}),audioEntries};
}
function readCandidate(root:string){
 const candidate=JSON.parse(physical(root,AUDIO_CANDIDATE).toString()) as Value;
 demand(candidate.kind==='frozen16-four-continuous-audio-v1'&&candidate.members.length===4&&Object.values(candidate.acceptanceEffects).every(v=>v===false),'candidate contract');
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
