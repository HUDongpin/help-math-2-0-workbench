import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {readJsonPin,readPin,readRegistryTransaction} from '../../../lib/g678-admission-proof.mjs';
import {algL6P035SourceProjection} from './alg-l06-p035-source-projection-v1.server';
import {P035_CANDIDATE_BINDING} from './alg-l06-p035-candidate-binding-v1';
import {P035_ID as ID,P035_SOURCE_ROOT,p035LocalDevelopment} from './alg-l06-p035-preview-policy-v1';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
import {getWorkspaceRoot} from './catalog';
const demand=(ok:unknown,why:string)=>{if(!ok)throw Error('P035_CANDIDATE_INVALID: '+why);};

/** The old-registry packet is required only for the unregistered local candidate. */
export function algL6P035CandidateDescriptor():PageOnlyLessonPlayerDescriptor{
 demand(p035LocalDevelopment(),'local development and physical source');
 const root=getWorkspaceRoot(),binding=P035_CANDIDATE_BINDING,tx=readRegistryTransaction(root);
 demand(tx.sha256===binding.registrySha256&&!localOnlyAnimationModuleRegistration(ID),
  'exact unregistered candidate registry');
 const packet=readJsonPin(root,binding.packet);
 demand(packet.animationId===ID&&packet.kind==='alg-l06-p035-candidate-source-binding-v1'&&
  Object.values(packet.acceptanceEffects).every(v=>v===false)&&
  packet.registrySha256===tx.sha256,'root-reviewed packet and independent gates');
 for(const pin of packet.files)readPin(root,pin);
 for(const pin of packet.external)readPin(P035_SOURCE_ROOT,pin);
 return algL6P035SourceProjection();
}
