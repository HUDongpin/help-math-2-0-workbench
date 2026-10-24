import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P019FormalDescriptor} from './alg-l06-p019-formal-admission-v1.server';
import {algL6P019CandidateDescriptor} from './alg-l06-p019-candidate-v1.server';
import {readP018Resource} from './alg-l06-p018-resources-v1.server';
import {P018_RESOURCE_PINS} from './alg-l06-p018-local-request-v1';
import {P019_RESOURCE_PINS,type P019Resource} from './alg-l06-p019-local-request-v1';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';

/** The candidate validates source and formal predecessors. Reuse each frozen
 * predecessor's byte verifier; expose only three new exact source assets. */
export async function readP019Resource(token:P019Resource):Promise<Buffer>{
 if(!Object.hasOwn(P019_RESOURCE_PINS,token))throw Error('P019_UNKNOWN_RESOURCE');
 const descriptor=localOnlyAnimationModuleRegistration('shared-alg001-l06-p019')
  ?algL6P019FormalDescriptor():algL6P019CandidateDescriptor();
 if(descriptor.productBridge.registeredAnimationCount!==30||
  descriptor.pages[18].animationId!=='shared-alg001-l06-p019')throw Error('P019_RESOURCE_CANDIDATE');
 const row=P019_RESOURCE_PINS[token];
 const inherited=Object.entries(P018_RESOURCE_PINS).filter(([,prior])=>prior.originalPath===row.originalPath);
 if(inherited.length){
  if(inherited.length!==1)throw Error('P019_AMBIGUOUS_PREDECESSOR');
  const [priorToken,prior]=inherited[0];
  if(prior.path!==row.path||prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.root!==row.root||prior.contentType!==row.contentType)throw Error('P019_PREDECESSOR_DRIFT');
  return readP018Resource(priorToken);
 }
 if(!['canvas-renderer.js','main-1','optional-spanish-audio-v1'].includes(token)||
  row.root!=='workspace')throw Error('P019_RESOURCE_SCOPE');
 return readPin(getWorkspaceRoot(),{path:row.path,bytes:row.bytes,sha256:row.sha256});
}
