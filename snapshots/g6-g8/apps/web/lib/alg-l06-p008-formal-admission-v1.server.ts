import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion}
 from '../../../lib/g678-admission-proof.mjs';
import {ID,readP008CanonicalSource} from '../../../lib/alg-l06-p008-admission-semantics-v1.mjs';
import {PROOF_PATH,validateP008AdmissionSemanticsV3}
 from '../../../lib/alg-l06-p008-admission-semantics-v3.mjs';
import {getWorkspaceRoot} from './catalog';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {algL6P004FormalDescriptor} from './alg-l06-p004-formal-admission-v1.server';
import {extendAlgL6P008Descriptor,type AlgL06P008DescriptorInput}
 from './alg-l06-p008-descriptor-extension-v1';

const PROOF={path:PROOF_PATH,bytes:43176,
 sha256:'df0c101c0d02935a74bc930f4845ae2bd2c77ed65b9e3050117759085a024fe5'};

/** Exact v3 proof and real registry transaction precede the 21→22 projection. */
export function algL6P008FormalDescriptor(){
 const root=getWorkspaceRoot();
 const index=readJsonPin(root,G678_ADMISSION_INDEX),host=verifyHostVersion(root,index.host);
 const transaction=readRegistryTransaction(root);
 const pages=index.pages.filter((page:{animationId:string})=>page.animationId===ID);
 if(pages.length!==1||pages[0].proof.path!==PROOF.path||
   pages[0].proof.bytes!==PROOF.bytes||pages[0].proof.sha256!==PROOF.sha256)
  throw Error('P008_FORMAL_EXACT_V3_ADMISSION');
 const packet=readPageProof(root,PROOF,host,transaction);
 const registration=transaction.registry.calibrations.find((row:{calibrationId:string})=>
  row.calibrationId===packet.calibrationId);
 validateP008AdmissionSemanticsV3(packet,registration);
 readP008CanonicalSource(root);
 const metadata=localOnlyAnimationModuleRegistration(ID);
 if(!metadata?.calibrationId||metadata.deploymentScope!=='local-only'||
   metadata.maturity!=='private-current-js'||
   !metadata.freezeManifestSha256||!metadata.moduleSha256||
   !metadata.timelineSha256||!metadata.runtimeSha256||
   metadata.calibrationId!==registration.calibrationId||
   metadata.freezeManifestSha256!==registration.freezeManifestSha256||
   metadata.moduleSha256!==registration.entries[0].artifacts.module.sha256||
   metadata.timelineSha256!==registration.entries[0].artifacts.timeline.sha256||
   metadata.runtimeSha256!==registration.entries[0].artifacts.runtime.sha256)
  throw Error('P008_FORMAL_REGISTRATION_METADATA');
 return extendAlgL6P008Descriptor(algL6P004FormalDescriptor(),{
  packet:packet as AlgL06P008DescriptorInput['packet'],
  registration:{calibrationId:metadata.calibrationId,deploymentScope:metadata.deploymentScope,
   maturity:metadata.maturity,freezeManifestSha256:metadata.freezeManifestSha256,
   moduleSha256:metadata.moduleSha256,timelineSha256:metadata.timelineSha256,
   runtimeSha256:metadata.runtimeSha256},
 });
}
