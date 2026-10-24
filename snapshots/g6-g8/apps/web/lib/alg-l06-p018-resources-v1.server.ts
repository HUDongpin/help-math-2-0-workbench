import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P018FormalDescriptor} from './alg-l06-p018-formal-admission-v1.server';
import {algL6P018CandidateDescriptor} from './alg-l06-p018-candidate-v1.server';
import {readP017Resource} from './alg-l06-p017-resources-v1.server';
import {P017_RESOURCE_PINS} from './alg-l06-p017-local-request-v1';
import {P018_RESOURCE_PINS,type P018Resource} from './alg-l06-p018-local-request-v1';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';

/** The candidate validates source and formal predecessors. Reuse each frozen
 * predecessor's byte verifier; expose only three new exact source assets. */
export async function readP018Resource(token:P018Resource):Promise<Buffer>{
 if(!Object.hasOwn(P018_RESOURCE_PINS,token))throw Error('P018_UNKNOWN_RESOURCE');
 const descriptor=localOnlyAnimationModuleRegistration('shared-alg001-l06-p018')
  ?algL6P018FormalDescriptor():algL6P018CandidateDescriptor();
 if(descriptor.productBridge.registeredAnimationCount!==29||
  descriptor.pages[17].animationId!=='shared-alg001-l06-p018')throw Error('P018_RESOURCE_CANDIDATE');
 const row=P018_RESOURCE_PINS[token];
 const inherited=Object.entries(P017_RESOURCE_PINS).filter(([,prior])=>prior.originalPath===row.originalPath);
 if(inherited.length){
  if(inherited.length!==1)throw Error('P018_AMBIGUOUS_PREDECESSOR');
  const [priorToken,prior]=inherited[0];
  if(prior.path!==row.path||prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.root!==row.root||prior.contentType!==row.contentType)throw Error('P018_PREDECESSOR_DRIFT');
  return readP017Resource(priorToken);
 }
 if(!['canvas-renderer.js','main-1','optional-spanish-audio-v1'].includes(token)||
  row.root!=='workspace')throw Error('P018_RESOURCE_SCOPE');
 return readPin(getWorkspaceRoot(),{path:row.path,bytes:row.bytes,sha256:row.sha256});
}
