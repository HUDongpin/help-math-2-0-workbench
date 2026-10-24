import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion} from '../../../lib/g678-admission-proof.mjs';
import {ID,readP003CanonicalSource,validateP003AdmissionSemantics} from '../../../lib/alg-l06-p003-admission-semantics-v1.mjs';
import {getWorkspaceRoot} from './catalog';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {algL6P003FormalBaseDescriptor} from './alg-l06-p003-formal-base-v1.server';
import {extendAlgL6P003Descriptor,type AlgL06P003DescriptorPacketView} from './alg-l06-p003-descriptor-extension-v1';

/** Actual registry, frozen source proof and host bytes precede the pure 19→20 projection. */
export function algL6P003FormalDescriptor(){
 const base=algL6P003FormalBaseDescriptor(),root=getWorkspaceRoot();
 const index=readJsonPin(root,G678_ADMISSION_INDEX),host=verifyHostVersion(root,index.host);
 const transaction=readRegistryTransaction(root);
 const pages=index.pages.filter((page:{animationId:string})=>page.animationId===ID);
 if(pages.length!==1)throw Error('P003_FORMAL_EXACT_ADMISSION');
 const packet=readPageProof(root,pages[0].proof,host,transaction);
 const registration=transaction.registry.calibrations.find((row:{calibrationId:string})=>
  row.calibrationId===packet.calibrationId);
 validateP003AdmissionSemantics(packet,registration);
 readP003CanonicalSource(root);
 const metadata=localOnlyAnimationModuleRegistration(ID);
 if(!metadata?.calibrationId||metadata.deploymentScope!=='local-only'||metadata.maturity!=='private-current-js'||
  !metadata.freezeManifestSha256||!metadata.moduleSha256||!metadata.timelineSha256||!metadata.runtimeSha256)
  throw Error('P003_FORMAL_REGISTRATION_METADATA');
 return extendAlgL6P003Descriptor(base,packet as AlgL06P003DescriptorPacketView,
  {calibrationId:metadata.calibrationId,deploymentScope:metadata.deploymentScope,maturity:metadata.maturity,
   freezeManifestSha256:metadata.freezeManifestSha256,moduleSha256:metadata.moduleSha256,
   timelineSha256:metadata.timelineSha256,runtimeSha256:metadata.runtimeSha256});
}
