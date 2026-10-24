import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {ID,PROOF_PATH,SOURCE_ROOT,readP013CanonicalSource,
 validateP013AdmissionSemantics} from '../../../lib/alg-l06-p013-admission-semantics-v1.mjs';
import {getWorkspaceRoot} from './catalog';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {algL6P010FormalDescriptor} from './alg-l06-p010-formal-admission-v1.server';
import {extendAlgL6P013Descriptor,type AlgL06P013DescriptorInput}
 from './alg-l06-p013-descriptor-extension-v1';

/** Exact active-index proof and registry transaction precede the one-page projection. */
export function algL6P013FormalDescriptor(){
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.VERCEL_ENV||
  process.env.HELP_MATH_G678_SOURCE_ROOT!==SOURCE_ROOT||
  !['1','true'].includes(process.env.HELP_MATH_G678_LOCAL_PREVIEW??'')||
  process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND!=='127.0.0.1')
  throw Error('P013_FORMAL_LOCAL_ONLY');
 const root=getWorkspaceRoot();
 const index=readJsonPin(root,G678_ADMISSION_INDEX),host=verifyHostVersion(root,index.host);
 const transaction=readRegistryTransaction(root);
 const pages=index.pages.filter((page:{animationId:string})=>page.animationId===ID);
 if(pages.length!==1||pages[0].proof.path!==PROOF_PATH)
  throw Error('P013_FORMAL_EXACT_V1_ADMISSION');
 const proofPin=pages[0].proof;
 const packet=readPageProof(root,proofPin,host,transaction);
 const proof=readJsonPin(root,proofPin);
 if(proof.animationId!==ID)throw Error('P013_FORMAL_PROOF_IDENTITY');
 validateP013AdmissionSemantics(packet,proof.registration);
 readP013CanonicalSource(root);
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
  throw Error('P013_FORMAL_REGISTRATION_METADATA');
 return extendAlgL6P013Descriptor(algL6P010FormalDescriptor(),{
  packet:packet as AlgL06P013DescriptorInput['packet'],
  registration:proof.registration as AlgL06P013DescriptorInput['registration'],
  metadata:{calibrationId:metadata.calibrationId,deploymentScope:metadata.deploymentScope,
   maturity:metadata.maturity,freezeManifestSha256:metadata.freezeManifestSha256,
   moduleSha256:metadata.moduleSha256,timelineSha256:metadata.timelineSha256,
   runtimeSha256:metadata.runtimeSha256},
 });
}
