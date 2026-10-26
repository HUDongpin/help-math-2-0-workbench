import {createHash} from 'node:crypto';
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual as exact} from 'node:util';
import * as previous from './g678-frozen16-continuous-audio-authority.server';
import type {FrozenGlossaryBinding,FrozenGlossaryPin} from './g678-frozen16-glossary-authority.server';
export const FROZEN_GLOSSARY_FREEZE=Object.freeze({path:'catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v9.json',bytes:2502210,sha256:'46a2c68950ef85111d22eec1e885e05e68965f47fb666b18a1a58e6c324c4295'});
export const INTRO_CANDIDATE=Object.freeze({path:'work/g678-shared-page-factory/frozen16-prepared-intro-v1/manifest.json',bytes:7254,sha256:'bd9011b1eb9eebf0cf4268ce5c69c355d377c2381dcba9ac5149b74dc7a64921'});
export const INTRO_IDS=Object.freeze(['shared-alg001-l01-p001','shared-dat001-l01-p001','shared-nms002-l01-p001']);
export const FROZEN_GLOSSARY_REGISTRY_WITNESS=previous.FROZEN_GLOSSARY_REGISTRY_WITNESS;
export const FROZEN_GLOSSARY_IDS=previous.FROZEN_GLOSSARY_IDS;
type Value=Record<string,any>;
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const encode=(v:unknown)=>Buffer.from(JSON.stringify(v,null,2)+'\n');
function demand(v:unknown,message:string):asserts v{if(!v)throw Error('PREPARED_INTRO_AUTHORITY_INVALID: '+message);}
function canonical(b:FrozenGlossaryBinding,p:FrozenGlossaryPin){const bytes=encode(b.value);demand(b.path===p.path&&b.bytes===p.bytes&&b.sha256===p.sha256&&bytes.length===p.bytes&&sha(bytes)===p.sha256,'canonical binding');return b.value as Value;}
function physical(root:string,p:FrozenGlossaryPin){const file=path.resolve(root,p.path);demand([root,'/Volumes/American Dream/hudongpin/helpmath-execution-20260906-01a0747f'].some(r=>file.startsWith(r+path.sep))&&realpathSync(file)===file,'physical path');const before=lstatSync(file,{bigint:true}),bytes=readFileSync(file),after=lstatSync(file,{bigint:true});demand(before.isFile()&&before.nlink===1n&&before.ino===after.ino&&before.mtimeNs===after.mtimeNs&&before.size===after.size&&bytes.length===p.bytes&&sha(bytes)===p.sha256,'physical drift: '+p.path);return bytes;}
export function validateFrozenGlossaryReplacement(input:{predecessor:FrozenGlossaryBinding;freeze:FrozenGlossaryBinding;candidate:FrozenGlossaryBinding}){
 const current=canonical(input.freeze,FROZEN_GLOSSARY_FREEZE);demand(exact(current.inputs.frozenPreparedIntroManifest,INTRO_CANDIDATE),'intro pointer');
 const prior=structuredClone(current),introEntries:Value[]=[];
 for(const id of INTRO_IDS){const selected=prior.selectedPages.find((p:Value)=>p.animationId===id),extension=selected?.frozenPreparedIntro;demand(extension?.kind==='frozen16-prepared-intro-v1'&&extension.firstPaintAccepted===false&&extension.audioAccepted===false&&exact(extension.candidateManifest,INTRO_CANDIDATE),'pending intro extension');demand(extension.entry?.key===id&&extension.entry.module==='./modules/frozen16-prepared-intro-'+id,'exact module');introEntries.push(extension.entry);delete selected.frozenPreparedIntro;}
 delete prior.inputs.frozenPreparedIntroManifest;
 const bytes=encode(prior);demand(bytes.length===previous.FROZEN_GLOSSARY_FREEZE.bytes&&sha(bytes)===previous.FROZEN_GLOSSARY_FREEZE.sha256,'only exact three intro extensions may differ from v8');
 const inherited=previous.validateFrozenGlossaryReplacement({...input,freeze:{...previous.FROZEN_GLOSSARY_FREEZE,value:prior}});
 return{...inherited,introEntries};
}
export function readFrozenGlossaryPackage(root:string,freeze?:FrozenGlossaryBinding){
 const inherited=previous.readFrozenGlossaryPackage(root),bound=freeze??{...FROZEN_GLOSSARY_FREEZE,value:JSON.parse(physical(root,FROZEN_GLOSSARY_FREEZE).toString())};
 const checked=validateFrozenGlossaryReplacement({predecessor:inherited.predecessor,freeze:bound,candidate:inherited.candidate});
 const candidate=JSON.parse(physical(root,INTRO_CANDIDATE).toString()) as Value;
 demand(candidate.kind==='frozen16-prepared-intro-v1'&&exact(candidate.entries,checked.introEntries)&&Object.values(candidate.acceptanceEffects).every(v=>v===false),'exact candidate entries');
 for(const pin of [...candidate.inputs,...candidate.outputs])physical(root,pin);
 return{...inherited,...checked,physicalPaths:[...new Set([...inherited.physicalPaths,path.join(root,FROZEN_GLOSSARY_FREEZE.path),path.join(root,INTRO_CANDIDATE.path),...[...candidate.inputs,...candidate.outputs].map((p:FrozenGlossaryPin)=>path.resolve(root,p.path))])]};
}
