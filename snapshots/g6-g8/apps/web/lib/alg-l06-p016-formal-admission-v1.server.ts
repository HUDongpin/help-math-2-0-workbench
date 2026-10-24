import 'server-only';
import {localOnlyAnimationModuleRegistration}
 from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {ID,PROOF_PATH,SOURCE_ROOT,readP016CanonicalSource,
 validateP016AdmissionSemantics} from '../../../lib/alg-l06-p016-admission-semantics-v1.mjs';
import {getWorkspaceRoot} from './catalog';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {algL6P015FormalDescriptor} from './alg-l06-p015-formal-admission-v1.server';
import {extendAlgL6P016Descriptor,type AlgL06P016DescriptorInput}
 from './alg-l06-p016-descriptor-extension-v1';

/** The active proof, physical registry transaction and source precede VB6 projection. */
export function algL6P016FormalDescriptor(){
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
  process.env.HELP_MATH_G678_SOURCE_ROOT!==SOURCE_ROOT||
  !['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')||
  process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND!=='127.0.0.1')
  throw Error('P016_FORMAL_LOCAL_ONLY');
 const root=getWorkspaceRoot();
 const index=readJsonPin(root,G678_ADMISSION_INDEX),host=verifyHostVersion(root,index.host);
 const transaction=readRegistryTransaction(root);
 const pages=index.pages.filter((page:{animationId:string})=>page.animationId===ID);
 if(pages.length!==1||pages[0].proof.path!==PROOF_PATH)
  throw Error('P016_FORMAL_EXACT_V1_ADMISSION');
 const proofPin=pages[0].proof;
 const packet=readPageProof(root,proofPin,host,transaction);
 const proof=readJsonPin(root,proofPin);
 if(proof.animationId!==ID)throw Error('P016_FORMAL_PROOF_IDENTITY');
 validateP016AdmissionSemantics(packet,proof.registration,root);
 readP016CanonicalSource(root);
 const metadata=localOnlyAnimationModuleRegistration(ID);
 const entry=proof.registration.entries[0];
 if(!metadata?.calibrationId||metadata.deploymentScope!=='local-only'||
   metadata.maturity!=='private-current-js'||
   !metadata.freezeManifestSha256||!metadata.moduleSha256||
   !metadata.timelineSha256||!metadata.runtimeSha256||
   metadata.calibrationId!==proof.registration.calibrationId||
   metadata.freezeManifestSha256!==proof.registration.freezeManifestSha256||
   metadata.moduleSha256!==entry.artifacts.module.sha256||
   metadata.timelineSha256!==entry.artifacts.timeline.sha256||
   metadata.runtimeSha256!==entry.artifacts.runtime.sha256)
  throw Error('P016_FORMAL_REGISTRATION_METADATA');
 return extendAlgL6P016Descriptor(algL6P015FormalDescriptor(),{
  packet:packet as AlgL06P016DescriptorInput['packet'],
  registration:proof.registration as AlgL06P016DescriptorInput['registration'],
  metadata:{calibrationId:metadata.calibrationId,deploymentScope:metadata.deploymentScope,
   maturity:metadata.maturity,freezeManifestSha256:metadata.freezeManifestSha256,
   moduleSha256:metadata.moduleSha256,timelineSha256:metadata.timelineSha256,
   runtimeSha256:metadata.runtimeSha256},
 },root);
}
