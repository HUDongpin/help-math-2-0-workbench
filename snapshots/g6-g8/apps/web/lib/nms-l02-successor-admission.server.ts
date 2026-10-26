import 'server-only';
import path from 'node:path';
import {getWorkspaceRoot} from './catalog';
import {NMS_L02_ADMISSION} from './nms-l02-admission-activation';
import {extendNmsL02P055Descriptor,P055_DESCRIPTOR_GLOSSARY_QUALIFICATION} from './nms-l02-p055-descriptor-extension';
import {readJsonPin} from '../../../lib/g678-admission-proof.mjs';
import {verifyNmsL02Predecessor,verifyNmsL02PageProof} from '../../../lib/nms-l02-successor-proof.mjs';
import {P055_SOURCE_ROOT,validateP055AdmissionSemantics,validateP055ProofClosure} from '../../../lib/nms-l02-p055-admission-semantics.mjs';

/** Candidate projection is explicit and never writes the real registry. The
 * final state requires an exact real transaction with canonical dispatch. */
export function nmsL02P055AdmissionDescriptor(){
 if(process.env.NODE_ENV==='production'||process.env.VERCEL||process.env.VERCEL_ENV||
  process.env.HELP_MATH_G678_SOURCE_ROOT!==P055_SOURCE_ROOT||!NMS_L02_ADMISSION)
  throw Error('NMS_L02_ADMISSION_LOCAL_ONLY');
 const activation=NMS_L02_ADMISSION,root=getWorkspaceRoot();
 if(activation.schemaVersion!==1)throw Error('NMS_L02_ADMISSION_VERSION');
 const predecessor=verifyNmsL02Predecessor(root,activation.predecessor,activation.host);
 const candidate=readJsonPin(root,activation.page);
 const calibrationId=candidate.registration.calibrationId;
 const existing=predecessor.transaction.registry.calibrations.filter((row:{calibrationId:string})=>row.calibrationId===calibrationId);
 const registered=activation.stage==='registered';
 if(!registered){
  if(activation.stage!=='candidate'||existing.length!==0||predecessor.transaction.registry.calibrations.some(
   (row:{entries:readonly {key:string}[]})=>row.entries.some(entry=>entry.key===candidate.animationId)))
   throw Error('NMS_L02_CANDIDATE_TRANSACTION');
  predecessor.transaction={...predecessor.transaction,registry:{...predecessor.transaction.registry,
   calibrations:[...predecessor.transaction.registry.calibrations,candidate.registration]}};
 }else if(existing.length!==1)throw Error('NMS_L02_REGISTRATION_MISSING');
 const proof=verifyNmsL02PageProof(root,activation.page,predecessor,validateP055AdmissionSemantics,validateP055ProofClosure);
 const packet=proof.packet;
 const descriptor=extendNmsL02P055Descriptor(predecessor.descriptor,{
  calibrationId:packet.calibrationId,sourceXml:packet.sourceXml,
  source:{...packet.source,path:path.join(packet.sourceRoot,packet.source.path)},
  selectedPage:packet.selectedPages[0],freeze:proof.freeze,glossary:packet.glossary,
 });
 return {descriptor,registered,glossaryQualification:P055_DESCRIPTOR_GLOSSARY_QUALIFICATION};
}
