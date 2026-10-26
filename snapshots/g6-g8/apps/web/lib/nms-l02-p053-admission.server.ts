import 'server-only';
import path from 'node:path';
import {getWorkspaceRoot} from './catalog';
import {NMS_L02_P053_ADMISSION} from './nms-l02-p053-admission-activation';
import type {NmsL02AdmissionActivation} from './nms-l02-admission-activation';
import {extendNmsL02P055Descriptor} from './nms-l02-p055-descriptor-extension';
import {extendNmsL02P056Descriptor} from './nms-l02-p056-descriptor-extension';
import {extendNmsL02P057Descriptor} from './nms-l02-p057-descriptor-extension';
import {extendNmsL02P058Descriptor} from './nms-l02-p058-descriptor-extension';
import {extendNmsL02P060Descriptor} from './nms-l02-p060-descriptor-extension';
import {extendNmsL02P061Descriptor} from './nms-l02-p061-descriptor-extension';
import {readJsonPin} from '../../../lib/g678-admission-proof.mjs';
import {verifyNmsL02Predecessor,verifyNmsL02PageProof} from '../../../lib/nms-l02-successor-proof.mjs';
import {validateP055AdmissionSemantics,validateP055ProofClosure} from '../../../lib/nms-l02-p055-admission-semantics.mjs';
import {validateP056AdmissionSemantics,validateP056ProofClosure} from '../../../lib/nms-l02-p056-admission-semantics.mjs';
import {validateP057AdmissionSemantics,validateP057ProofClosure} from '../../../lib/nms-l02-p057-admission-semantics.mjs';
import {validateP058AdmissionSemantics,validateP058ProofClosure} from '../../../lib/nms-l02-p058-admission-semantics.mjs';
import {validateP060AdmissionSemantics,validateP060ProofClosure} from '../../../lib/nms-l02-p060-admission-semantics.mjs';
import {validateP061AdmissionSemantics,validateP061ProofClosure} from '../../../lib/nms-l02-p061-admission-semantics.mjs';
import {P053_SOURCE_ROOT,P053_ADMISSION_ID,validateP053AdmissionSemantics}
 from '../../../lib/nms-l02-p053-proof-semantics-v1.mjs';
import {P053_SHARED_DEPENDENCIES,validateP053ReviewedProofClosure}
 from '../../../lib/nms-l02-p053-reviewed-seal-v1.mjs';
import {validateP054AdmissionSemantics,validateP054ProofClosure}
 from '../../../lib/nms-l02-p054-proof-semantics-v1.mjs';
import {extendNmsL02P054Descriptor} from './nms-l02-p054-descriptor-extension';
import {extendNmsL02P053Descriptor} from './nms-l02-p053-descriptor-extension';
import {extendNmsL02P062Descriptor} from './nms-l02-p062-descriptor-extension';
import {validateP062AdmissionSemantics,validateP062ProofClosure} from '../../../lib/nms-l02-p062-admission-semantics.mjs';

import {extendNmsL02P064Descriptor} from './nms-l02-p064-descriptor-extension';
import {validateP064AdmissionSemantics,validateP064ProofClosure} from '../../../lib/nms-l02-p064-admission-semantics-v1.mjs';

const P054_PROOF={path:'work/g678-workflow/candidates/shared-nms002-l02-p054-v1.json',
 bytes:54313,sha256:'5e8fc913e9e0bc41dbf1336b4d042983e5fd5b74b60fc63beeec7c3015adf666'};

const P064_PROOF={path:'work/g678-workflow/candidates/shared-nms002-l02-p064-v1.json',bytes:44928,
 sha256:'91ecc6b6b5dece0d0b3521c5d150b25be0a4bbf06b85b776fdb7f146d8af0ec7'};

const P055_PROOF={path:'work/g678-workflow/candidates/shared-nms002-l02-p055-v1.json',bytes:41970,
 sha256:'6d7b37096d01b7f712ebde9c461652733177b64cd654ecb75a9f0d656291bae1'};
const P056_PROOF={path:'work/g678-workflow/candidates/shared-nms002-l02-p056-v1.json',bytes:31795,
 sha256:'29c0da9919a42535c5969e3cf48ca37305f6d100db531294156012aedae97486'};
const P057_PROOF={path:'work/g678-workflow/candidates/shared-nms002-l02-p057-v1.json',bytes:66031,
 sha256:'2b1b08015bdef6b7624e73f4d85509aba1821cdf7cb7e9bf646e1c4d2b9634e7'};
const P058_PROOF={path:'work/g678-workflow/candidates/shared-nms002-l02-p058-v1.json',bytes:42710,
 sha256:'3a90ce389391dc10c89f9bb3cd9c55b134502bda8639019f51b73d4ccd16dfb9'};
const P060_PROOF={path:'work/g678-workflow/candidates/shared-nms002-l02-p060-v1.json',bytes:121846,
 sha256:'7e408e17b13e5d96bef72919f9f132a4718ed9be9578663709f108496e823acd'};

const P061_PROOF={path:'work/g678-workflow/candidates/shared-nms002-l02-p061-v1.json',bytes:102913,
 sha256:'7e49a257ec06811fb45174752c96f5f5acda8071ed008de31b6951d4db31a094'};

const P062_PROOF={path:'work/g678-workflow/candidates/shared-nms002-l02-p062-v1.json',bytes:97811,
 sha256:'7939dfefe1191f9d6da937cc893fddce07944285395083917daaec058a41d4a9'};

type ProofPacket={calibrationId:string;sourceXml:unknown;source:{path:string};sourceRoot:string;
 selectedPages:unknown[];glossary:unknown;sourceKeyAttributeCalls?:number};
type Predecessor=ReturnType<typeof verifyNmsL02Predecessor>;

/** Replay the admitted source-order chain against the exact real registry. */
function replayAdmittedPages(root:string,predecessor:Predecessor){
 for(const [pin,validateSemantics,validateClosure,extend] of [
  [P055_PROOF,validateP055AdmissionSemantics,validateP055ProofClosure,extendNmsL02P055Descriptor],
  [P056_PROOF,validateP056AdmissionSemantics,validateP056ProofClosure,extendNmsL02P056Descriptor],
  [P057_PROOF,validateP057AdmissionSemantics,validateP057ProofClosure,extendNmsL02P057Descriptor],
  [P058_PROOF,validateP058AdmissionSemantics,validateP058ProofClosure,extendNmsL02P058Descriptor],
  [P060_PROOF,validateP060AdmissionSemantics,validateP060ProofClosure,extendNmsL02P060Descriptor],
  [P061_PROOF,validateP061AdmissionSemantics,validateP061ProofClosure,extendNmsL02P061Descriptor],
  [P062_PROOF,validateP062AdmissionSemantics,validateP062ProofClosure,extendNmsL02P062Descriptor],
  [P064_PROOF,validateP064AdmissionSemantics,validateP064ProofClosure,extendNmsL02P064Descriptor],
  [P054_PROOF,validateP054AdmissionSemantics,validateP054ProofClosure,extendNmsL02P054Descriptor],
 ] as const){
  const proof=verifyNmsL02PageProof(root,pin,predecessor,validateSemantics,validateClosure);
  const packet=proof.packet as ProofPacket;
  predecessor.descriptor=extend(predecessor.descriptor,{
   calibrationId:packet.calibrationId,sourceXml:packet.sourceXml,
   source:{...packet.source,path:path.join(packet.sourceRoot,packet.source.path)},
   selectedPage:packet.selectedPages[0],freeze:proof.freeze,glossary:packet.glossary,
   sourceKeyAttributeCalls:packet.sourceKeyAttributeCalls,
  } as never);
 }
}

/** An absent activation never exposes an admitted route. Candidate mode only
 * projects one registration in memory; it does not write the registry. */
export function nmsL02P053AdmissionDescriptor(activation:NmsL02AdmissionActivation|null=NMS_L02_P053_ADMISSION){
 if(process.env.NODE_ENV==='production'||process.env.VERCEL||process.env.VERCEL_ENV||
  process.env.HELP_MATH_G678_SOURCE_ROOT!==P053_SOURCE_ROOT||!activation)
  throw Error('NMS_L02_P053_ADMISSION_LOCAL_ONLY');
 if(activation.schemaVersion!==1)throw Error('NMS_L02_P053_ADMISSION_VERSION');
 if(activation.host.path!=='catalog/nms-l02-admission-v1/host-v16.json'||
  activation.page.path!=='work/g678-workflow/candidates/shared-nms002-l02-p053-v1.json')
  throw Error('NMS_L02_P053_ADMISSION_BINDING');
 const root=getWorkspaceRoot();
 const validateClosure=(proof:unknown)=>validateP053ReviewedProofClosure(root,proof);
 const predecessor=verifyNmsL02Predecessor(root,activation.predecessor,activation.host);
 replayAdmittedPages(root,predecessor);
 if(predecessor.descriptor.pages.length!==64||
  predecessor.descriptor.productBridge.registeredAnimationCount!==63||
  predecessor.descriptor.glossary.length!==25)
  throw Error('NMS_L02_P053_PREDECESSOR_COUNTS');
 for(const pin of P053_SHARED_DEPENDENCIES){
  const hostPin=predecessor.host.files.find((item:{path:string})=>item.path===pin.path);
  if(JSON.stringify(hostPin)!==JSON.stringify(pin))
   throw Error(`NMS_L02_P053_SHARED_HOST_PIN: ${pin.path}`);
 }
 const candidate=readJsonPin(root,activation.page);
 validateClosure(candidate);
 const hostPins=new Map(predecessor.host.files.map((pin:{path:string})=>[pin.path,pin]));
 const overlap=candidate.files.filter((pin:{path:string})=>hostPins.has(pin.path));
 if(overlap.length!==0)
  throw Error('NMS_L02_P053_PAGE_HOST_OVERLAP');
 const existing=predecessor.transaction.registry.calibrations.filter(
  (row:{calibrationId:string})=>row.calibrationId===candidate.registration.calibrationId);
 const registered=activation.stage==='registered';
 if(!registered){
  if(activation.stage!=='candidate'||existing.length!==0||
   predecessor.transaction.registry.calibrations.some(
    (row:{entries:readonly {key:string}[]})=>row.entries.some(entry=>entry.key===P053_ADMISSION_ID)))
   throw Error('NMS_L02_P053_CANDIDATE_TRANSACTION');
  predecessor.transaction={...predecessor.transaction,registry:{...predecessor.transaction.registry,
   calibrations:[...predecessor.transaction.registry.calibrations,candidate.registration]}};
 }else if(existing.length!==1)throw Error('NMS_L02_P053_REGISTRATION_MISSING');
 const proof=verifyNmsL02PageProof(root,activation.page,predecessor,
  validateP053AdmissionSemantics,validateClosure);
 const packet=proof.packet;
 const descriptor=extendNmsL02P053Descriptor(predecessor.descriptor,{
  calibrationId:packet.calibrationId,sourceXml:packet.sourceXml,
  source:{...packet.source,path:path.join(packet.sourceRoot,packet.source.path)},
  selectedPage:packet.selectedPages[0],freeze:proof.freeze,sourceKeyAttributeCalls:packet.sourceKeyAttributeCalls,
 });
 return {descriptor,registered};
}
