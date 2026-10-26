import {createHash} from 'node:crypto';
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual as exact} from 'node:util';
import * as prepared from './g678-frozen16-prepared-glossary-authority.server';
import type {FrozenGlossaryBinding,FrozenGlossaryPin} from './g678-frozen16-glossary-authority.server';
export const FROZEN_GLOSSARY_FREEZE=Object.freeze({path:'catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v8.json',bytes:2497482,sha256:'204ee0e8a5bc7617ca13004e606b1201007f6dc1ab3c10263ff6db525e7b0ad0'});
export const FROZEN_GLOSSARY_REGISTRY_WITNESS=prepared.FROZEN_GLOSSARY_REGISTRY_WITNESS;
export const FROZEN_GLOSSARY_IDS=prepared.FROZEN_GLOSSARY_IDS;
export const AUDIO_CANDIDATE=Object.freeze({path:'work/g678-shared-page-factory/frozen16-continuous-audio-v3/manifest.json',bytes:6357,sha256:'8dc0f3af29372c263d376c94434d2df10137d3d693a2409e618444286c1fa15a'});
const ID='shared-alg001-l06-p040';
type RecordValue=Record<string,any>;
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
function demand(value:unknown,message:string):asserts value{if(!value)throw Error('CONTINUOUS_AUDIO_AUTHORITY_INVALID: '+message);}
function encoded(value:unknown){return Buffer.from(JSON.stringify(value,null,2)+'\n');}
function canonical(binding:FrozenGlossaryBinding,pin:FrozenGlossaryPin){const b=encoded(binding.value);demand(binding.path===pin.path&&binding.bytes===pin.bytes&&binding.sha256===pin.sha256&&b.length===pin.bytes&&sha(b)===pin.sha256,'canonical binding');return binding.value as RecordValue;}
function physical(root:string,pin:FrozenGlossaryPin){
 const file=path.resolve(root,pin.path),allowed=[root,'/Volumes/American Dream/hudongpin/helpmath-execution-20260906-01a0747f'];
 demand(allowed.some(r=>file.startsWith(r+path.sep))&&realpathSync(file)===file,'physical path');const before=lstatSync(file,{bigint:true});demand(before.isFile()&&before.nlink===1n,'ordinary input');
 const bytes=readFileSync(file),after=lstatSync(file,{bigint:true});demand(before.ino===after.ino&&before.mtimeNs===after.mtimeNs&&before.size===after.size&&bytes.length===pin.bytes&&sha(bytes)===pin.sha256,'physical drift: '+pin.path);return bytes;
}
export function validateFrozenGlossaryReplacement(input:{predecessor:FrozenGlossaryBinding;freeze:FrozenGlossaryBinding;candidate:FrozenGlossaryBinding}){
 const current=canonical(input.freeze,FROZEN_GLOSSARY_FREEZE);demand(exact(current.inputs.frozenContinuousAudioManifest,AUDIO_CANDIDATE),'candidate pointer');
 const previous=structuredClone(current),selected=previous.selectedPages.find((p:RecordValue)=>p.animationId===ID),extension=selected?.frozenContinuousAudio;
 demand(extension?.kind==='registered-continuous-source-clock-candidate-v1'&&extension.audioAccepted===false&&extension.sourceAlignmentAccepted===false&&exact(extension.candidateManifest,AUDIO_CANDIDATE),'exact pending extension');
 demand(extension.entry?.key===ID&&extension.entry.module==='./modules/frozen16-continuous-audio-shared-alg001-l06-p040','registered audio module');
 delete selected.frozenContinuousAudio;delete previous.inputs.frozenContinuousAudioManifest;
 const bytes=encoded(previous),prior={...prepared.FROZEN_GLOSSARY_FREEZE,value:previous};
 demand(bytes.length===prior.bytes&&sha(bytes)===prior.sha256,'only the exact audio extension may differ from v5');
 const inherited=prepared.validateFrozenGlossaryReplacement({...input,freeze:prior});
 return{...inherited,audioEntry:extension.entry as RecordValue};
}
export function readContinuousAudioCandidate(root:string){
 const candidate=JSON.parse(physical(root,AUDIO_CANDIDATE).toString()) as RecordValue;
 demand(candidate.entry.key===ID&&candidate.sourceSha256==='cb4b046089166eef2dd0407a921b91c89d33fe6d99071915325de3439b3b2653','source identity');
 demand(candidate.sourceAsset.path==='work/g678-shared-page-factory/frozen16-continuous-audio-v1/source-stream.mp3'&&candidate.sourceAsset.bytes===78260&&candidate.sourceAsset.sha256==='bf6cbc0d490526ed4dec3b7566204cb22057a09a37be6fbe61d2367143caaaad','audio identity');
 demand(Object.values(candidate.acceptanceEffects).every(v=>v===false),'pending acceptance');
 for(const pin of [...candidate.inputs,...candidate.outputs])physical(root,pin);
 return candidate as RecordValue&{sourceAsset:FrozenGlossaryPin};
}
export function readFrozenGlossaryPackage(root:string,freeze?:FrozenGlossaryBinding){
 const inherited=prepared.readFrozenGlossaryPackage(root),bound=freeze??{...FROZEN_GLOSSARY_FREEZE,value:JSON.parse(physical(root,FROZEN_GLOSSARY_FREEZE).toString())};
 const validated=validateFrozenGlossaryReplacement({predecessor:inherited.predecessor,freeze:bound,candidate:inherited.candidate});
 const audio=readContinuousAudioCandidate(root),extension=(bound.value as RecordValue).selectedPages.find((p:RecordValue)=>p.animationId===ID).frozenContinuousAudio;
 demand(exact(extension.entry,audio.entry)&&exact(extension.sourceAsset,audio.sourceAsset),'extension must match the physical package');
 return{...inherited,...validated,physicalPaths:[...new Set([...inherited.physicalPaths,path.join(root,FROZEN_GLOSSARY_FREEZE.path),path.join(root,AUDIO_CANDIDATE.path),...[...audio.inputs,...audio.outputs].map((p:FrozenGlossaryPin)=>path.resolve(root,p.path))])]};
}
