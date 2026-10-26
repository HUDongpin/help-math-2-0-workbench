import 'server-only';
import path from 'node:path';
import {getWorkspaceRoot} from './catalog';
import {NMS_L02_P057_ADMISSION} from './nms-l02-p057-admission-activation';
import type {NmsL02AdmissionActivation} from './nms-l02-admission-activation';
import {extendNmsL02P055Descriptor} from './nms-l02-p055-descriptor-extension';
import {extendNmsL02P056Descriptor} from './nms-l02-p056-descriptor-extension';
import {extendNmsL02P057Descriptor,P057_DESCRIPTOR_GLOSSARY_QUALIFICATION} from './nms-l02-p057-descriptor-extension';
import {readJsonPin} from '../../../lib/g678-admission-proof.mjs';
import {verifyNmsL02Predecessor,verifyNmsL02PageProof} from '../../../lib/nms-l02-successor-proof.mjs';
import {validateP055AdmissionSemantics,validateP055ProofClosure} from '../../../lib/nms-l02-p055-admission-semantics.mjs';
import {validateP056AdmissionSemantics,validateP056ProofClosure} from '../../../lib/nms-l02-p056-admission-semantics.mjs';
import {P057_SOURCE_ROOT,P057_ADMISSION_ID,P057_SHARED_DEPENDENCIES,validateP057AdmissionSemantics,validateP057ProofClosure} from '../../../lib/nms-l02-p057-admission-semantics.mjs';

const P055_PROOF={path:'work/g678-workflow/candidates/shared-nms002-l02-p055-v1.json',bytes:41970,
 sha256:'6d7b37096d01b7f712ebde9c461652733177b64cd654ecb75a9f0d656291bae1'};
const P056_PROOF={path:'work/g678-workflow/candidates/shared-nms002-l02-p056-v1.json',bytes:31795,
 sha256:'29c0da9919a42535c5969e3cf48ca37305f6d100db531294156012aedae97486'};

/** Executed base54 -> frozen P055 -> frozen P056 -> exact P057 DOM proof. A candidate uses an
 * in-memory registry projection only; registered mode requires the real entry. */
export function nmsL02P057AdmissionDescriptor(activation:NmsL02AdmissionActivation|null=NMS_L02_P057_ADMISSION){
 if(process.env.NODE_ENV==='production'||process.env.VERCEL||process.env.VERCEL_ENV||
  process.env.HELP_MATH_G678_SOURCE_ROOT!==P057_SOURCE_ROOT||!activation)
  throw Error('NMS_L02_P057_ADMISSION_LOCAL_ONLY');
 if(activation.schemaVersion!==1)throw Error('NMS_L02_P057_ADMISSION_VERSION');
 if(activation.host.path!=='catalog/nms-l02-admission-v1/host-v7.json'||
  activation.page.path!=='work/g678-workflow/candidates/shared-nms002-l02-p057-v1.json')
  throw Error('NMS_L02_P057_ADMISSION_BINDING');
 const root=getWorkspaceRoot();
 const predecessor=verifyNmsL02Predecessor(root,activation.predecessor,activation.host);
 const p055=verifyNmsL02PageProof(root,P055_PROOF,predecessor,validateP055AdmissionSemantics,validateP055ProofClosure);
 const old=p055.packet;
 predecessor.descriptor=extendNmsL02P055Descriptor(predecessor.descriptor,{
  calibrationId:old.calibrationId,sourceXml:old.sourceXml,
  source:{...old.source,path:path.join(old.sourceRoot,old.source.path)},
  selectedPage:old.selectedPages[0],freeze:p055.freeze,glossary:old.glossary,
 });
 const p056=verifyNmsL02PageProof(root,P056_PROOF,predecessor,validateP056AdmissionSemantics,validateP056ProofClosure);
 const prior=p056.packet;
 predecessor.descriptor=extendNmsL02P056Descriptor(predecessor.descriptor,{
  calibrationId:prior.calibrationId,sourceXml:prior.sourceXml,
  source:{...prior.source,path:path.join(prior.sourceRoot,prior.source.path)},
  selectedPage:prior.selectedPages[0],freeze:p056.freeze,glossary:prior.glossary,
 });
 for(const pin of P057_SHARED_DEPENDENCIES){
  const hostPin=predecessor.host.files.find((item:{path:string})=>item.path===pin.path);
  if(JSON.stringify(hostPin)!==JSON.stringify(pin))throw Error(`NMS_L02_P057_SHARED_HOST_PIN: ${pin.path}`);
 }
 const candidate=readJsonPin(root,activation.page);
 validateP057ProofClosure(candidate);
 const hostPaths=new Set(predecessor.host.files.map((pin:{path:string})=>pin.path));
 if(candidate.files.some((pin:{path:string})=>hostPaths.has(pin.path)))
  throw Error('NMS_L02_P057_PAGE_HOST_OVERLAP');
 const existing=predecessor.transaction.registry.calibrations.filter(
  (row:{calibrationId:string})=>row.calibrationId===candidate.registration.calibrationId);
 const registered=activation.stage==='registered';
 if(!registered){
  if(activation.stage!=='candidate'||existing.length!==0||predecessor.transaction.registry.calibrations.some(
   (row:{entries:readonly {key:string}[]})=>row.entries.some(entry=>entry.key===P057_ADMISSION_ID)))
   throw Error('NMS_L02_P057_CANDIDATE_TRANSACTION');
  predecessor.transaction={...predecessor.transaction,registry:{...predecessor.transaction.registry,
   calibrations:[...predecessor.transaction.registry.calibrations,candidate.registration]}};
 }else if(existing.length!==1)throw Error('NMS_L02_P057_REGISTRATION_MISSING');
 const proof=verifyNmsL02PageProof(root,activation.page,predecessor,validateP057AdmissionSemantics,validateP057ProofClosure);
 const packet=proof.packet;
 const descriptor=extendNmsL02P057Descriptor(predecessor.descriptor,{
  calibrationId:packet.calibrationId,sourceXml:packet.sourceXml,
  source:{...packet.source,path:path.join(packet.sourceRoot,packet.source.path)},
  selectedPage:packet.selectedPages[0],freeze:proof.freeze,glossary:packet.glossary,
 });
 return {descriptor,registered,glossaryQualification:P057_DESCRIPTOR_GLOSSARY_QUALIFICATION};
}
