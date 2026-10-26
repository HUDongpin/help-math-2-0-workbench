import 'server-only';
import path from 'node:path';
import {getWorkspaceRoot} from './catalog';
import {NMS_L02_P060_ADMISSION} from './nms-l02-p060-admission-activation';
import type {NmsL02AdmissionActivation} from './nms-l02-admission-activation';
import {extendNmsL02P055Descriptor} from './nms-l02-p055-descriptor-extension';
import {extendNmsL02P056Descriptor} from './nms-l02-p056-descriptor-extension';
import {extendNmsL02P060Descriptor,P060_DESCRIPTOR_GLOSSARY_QUALIFICATION} from './nms-l02-p060-descriptor-extension';
import {readJsonPin} from '../../../lib/g678-admission-proof.mjs';
import {verifyNmsL02Predecessor,verifyNmsL02PageProof} from '../../../lib/nms-l02-successor-proof.mjs';
import {validateP055AdmissionSemantics,validateP055ProofClosure} from '../../../lib/nms-l02-p055-admission-semantics.mjs';
import {validateP056AdmissionSemantics,validateP056ProofClosure} from '../../../lib/nms-l02-p056-admission-semantics.mjs';
import {P060_SOURCE_ROOT,P060_ADMISSION_ID,P060_SHARED_DEPENDENCIES,validateP060AdmissionSemantics,validateP060ProofClosure} from '../../../lib/nms-l02-p060-admission-semantics.mjs';

import {extendNmsL02P057Descriptor} from './nms-l02-p057-descriptor-extension';
import {validateP057AdmissionSemantics,validateP057ProofClosure} from '../../../lib/nms-l02-p057-admission-semantics.mjs';
import {extendNmsL02P058Descriptor} from './nms-l02-p058-descriptor-extension';
import {validateP058AdmissionSemantics,validateP058ProofClosure} from '../../../lib/nms-l02-p058-admission-semantics.mjs';
const P058_PROOF={"path":"work/g678-workflow/candidates/shared-nms002-l02-p058-v1.json","bytes":42710,"sha256":"3a90ce389391dc10c89f9bb3cd9c55b134502bda8639019f51b73d4ccd16dfb9"};
const P057_PROOF={"path": "work/g678-workflow/candidates/shared-nms002-l02-p057-v1.json", "bytes": 66031, "sha256": "2b1b08015bdef6b7624e73f4d85509aba1821cdf7cb7e9bf646e1c4d2b9634e7"};
const P055_PROOF={path:'work/g678-workflow/candidates/shared-nms002-l02-p055-v1.json',bytes:41970,
 sha256:'6d7b37096d01b7f712ebde9c461652733177b64cd654ecb75a9f0d656291bae1'};
const P056_PROOF={path:'work/g678-workflow/candidates/shared-nms002-l02-p056-v1.json',bytes:31795,
 sha256:'29c0da9919a42535c5969e3cf48ca37305f6d100db531294156012aedae97486'};

/** Executed base54 -> P055/P056/P057/P058 -> exact P060 DOM proof. A candidate uses an
 * in-memory registry projection only; registered mode requires the real entry. */
export function nmsL02P060AdmissionDescriptor(activation:NmsL02AdmissionActivation|null=NMS_L02_P060_ADMISSION){
 if(process.env.NODE_ENV==='production'||process.env.VERCEL||process.env.VERCEL_ENV||
  process.env.HELP_MATH_G678_SOURCE_ROOT!==P060_SOURCE_ROOT||!activation)
  throw Error('NMS_L02_P060_ADMISSION_LOCAL_ONLY');
 if(activation.schemaVersion!==1)throw Error('NMS_L02_P060_ADMISSION_VERSION');
 if(activation.host.path!=='catalog/nms-l02-admission-v1/host-v10.json'||
  activation.page.path!=='work/g678-workflow/candidates/shared-nms002-l02-p060-v1.json')
  throw Error('NMS_L02_P060_ADMISSION_BINDING');
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
 const p057=verifyNmsL02PageProof(root,P057_PROOF,predecessor,validateP057AdmissionSemantics,validateP057ProofClosure);
 const last=p057.packet;
 predecessor.descriptor=extendNmsL02P057Descriptor(predecessor.descriptor,{
  calibrationId:last.calibrationId,sourceXml:last.sourceXml,
  source:{...last.source,path:path.join(last.sourceRoot,last.source.path)},
  selectedPage:last.selectedPages[0],freeze:p057.freeze,glossary:last.glossary,
 });
 const p058=verifyNmsL02PageProof(root,P058_PROOF,predecessor,validateP058AdmissionSemantics,validateP058ProofClosure);
 const previous=p058.packet;
 predecessor.descriptor=extendNmsL02P058Descriptor(predecessor.descriptor,{
  calibrationId:previous.calibrationId,sourceXml:previous.sourceXml,
  source:{...previous.source,path:path.join(previous.sourceRoot,previous.source.path)},
  selectedPage:previous.selectedPages[0],freeze:p058.freeze,glossary:previous.glossary,
 });
 for(const pin of P060_SHARED_DEPENDENCIES){
  const hostPin=predecessor.host.files.find((item:{path:string})=>item.path===pin.path);
  if(JSON.stringify(hostPin)!==JSON.stringify(pin))throw Error(`NMS_L02_P060_SHARED_HOST_PIN: ${pin.path}`);
 }
 const candidate=readJsonPin(root,activation.page);
 validateP060ProofClosure(candidate);
 const hostPaths=new Set(predecessor.host.files.map((pin:{path:string})=>pin.path));
 if(candidate.files.some((pin:{path:string})=>hostPaths.has(pin.path)))
  throw Error('NMS_L02_P060_PAGE_HOST_OVERLAP');
 const existing=predecessor.transaction.registry.calibrations.filter(
  (row:{calibrationId:string})=>row.calibrationId===candidate.registration.calibrationId);
 const registered=activation.stage==='registered';
 if(!registered){
  if(activation.stage!=='candidate'||existing.length!==0||predecessor.transaction.registry.calibrations.some(
   (row:{entries:readonly {key:string}[]})=>row.entries.some(entry=>entry.key===P060_ADMISSION_ID)))
   throw Error('NMS_L02_P060_CANDIDATE_TRANSACTION');
  predecessor.transaction={...predecessor.transaction,registry:{...predecessor.transaction.registry,
   calibrations:[...predecessor.transaction.registry.calibrations,candidate.registration]}};
 }else if(existing.length!==1)throw Error('NMS_L02_P060_REGISTRATION_MISSING');
 const proof=verifyNmsL02PageProof(root,activation.page,predecessor,validateP060AdmissionSemantics,validateP060ProofClosure);
 const packet=proof.packet;
 const descriptor=extendNmsL02P060Descriptor(predecessor.descriptor,{
  calibrationId:packet.calibrationId,sourceXml:packet.sourceXml,
  source:{...packet.source,path:path.join(packet.sourceRoot,packet.source.path)},
  selectedPage:packet.selectedPages[0],freeze:proof.freeze,glossary:packet.glossary,
 });
 return {descriptor,registered,glossaryQualification:P060_DESCRIPTOR_GLOSSARY_QUALIFICATION};
}
