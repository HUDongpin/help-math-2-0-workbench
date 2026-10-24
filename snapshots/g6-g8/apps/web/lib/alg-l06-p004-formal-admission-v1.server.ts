import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPageProof,readRegistryTransaction,verifyHostVersion} from '../../../lib/g678-admission-proof.mjs';
import {ID,readP004CanonicalSource,validateP004AdmissionSemantics} from '../../../lib/alg-l06-p004-admission-semantics-v1.mjs';
import {getWorkspaceRoot} from './catalog';
import {G678_ADMISSION_INDEX} from './g678-admission-activation';
import {algL6P003FormalDescriptor} from './alg-l06-p003-formal-admission-v1.server';
import {extendAlgL6P004Descriptor,type AlgL06P004DescriptorInput} from './alg-l06-p004-descriptor-extension-v1';

/** Source proof and actual registry transaction precede the pure 20→21 projection. */
export function algL6P004FormalDescriptor(){
 const root=getWorkspaceRoot();
 const index=readJsonPin(root,G678_ADMISSION_INDEX),host=verifyHostVersion(root,index.host);
 const transaction=readRegistryTransaction(root);
 const pages=index.pages.filter((page:{animationId:string})=>page.animationId===ID);
 if(pages.length!==1)throw Error('P004_FORMAL_EXACT_ADMISSION');
 const packet=readPageProof(root,pages[0].proof,host,transaction);
 const registration=transaction.registry.calibrations.find((row:{calibrationId:string})=>
  row.calibrationId===packet.calibrationId);
 validateP004AdmissionSemantics(packet,registration);
 const {glossary}=readP004CanonicalSource(root);
 const metadata=localOnlyAnimationModuleRegistration(ID);
 if(!metadata?.calibrationId||metadata.deploymentScope!=='local-only'||metadata.maturity!=='private-current-js'||
  !metadata.freezeManifestSha256||!metadata.moduleSha256||!metadata.timelineSha256||!metadata.runtimeSha256)
  throw Error('P004_FORMAL_REGISTRATION_METADATA');
 return extendAlgL6P004Descriptor(algL6P003FormalDescriptor(),{
  packet:packet as AlgL06P004DescriptorInput['packet'],glossary,
  registration:{calibrationId:metadata.calibrationId,deploymentScope:metadata.deploymentScope,
   maturity:metadata.maturity,freezeManifestSha256:metadata.freezeManifestSha256,
   moduleSha256:metadata.moduleSha256,timelineSha256:metadata.timelineSha256,
   runtimeSha256:metadata.runtimeSha256},
 });
}
