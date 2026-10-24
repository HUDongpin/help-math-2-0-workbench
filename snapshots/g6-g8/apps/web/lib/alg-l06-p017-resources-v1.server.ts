import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P017FormalDescriptor} from './alg-l06-p017-formal-admission-v1.server';
import {algL6P017CandidateDescriptor} from './alg-l06-p017-candidate-v1.server';
import {readP016Resource} from './alg-l06-p016-resources-v1.server';
import {P016_RESOURCE_PINS} from './alg-l06-p016-local-request-v1';
import {P017_RESOURCE_PINS,type P017Resource} from './alg-l06-p017-local-request-v1';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';

/** The candidate validates source and formal predecessors. Reuse each frozen
 * predecessor's byte verifier; expose only three new exact source assets. */
export async function readP017Resource(token:P017Resource):Promise<Buffer>{
 if(!Object.hasOwn(P017_RESOURCE_PINS,token))throw Error('P017_UNKNOWN_RESOURCE');
 const descriptor=localOnlyAnimationModuleRegistration('shared-alg001-l06-p017')
  ?algL6P017FormalDescriptor():algL6P017CandidateDescriptor();
 if(descriptor.productBridge.registeredAnimationCount!==28||
  descriptor.pages[16].animationId!=='shared-alg001-l06-p017')throw Error('P017_RESOURCE_CANDIDATE');
 const row=P017_RESOURCE_PINS[token];
 const inherited=Object.entries(P016_RESOURCE_PINS).filter(([,prior])=>prior.originalPath===row.originalPath);
 if(inherited.length){
  if(inherited.length!==1)throw Error('P017_AMBIGUOUS_PREDECESSOR');
  const [priorToken,prior]=inherited[0];
  if(prior.path!==row.path||prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.root!==row.root||prior.contentType!==row.contentType)throw Error('P017_PREDECESSOR_DRIFT');
  return readP016Resource(priorToken);
 }
 if(!['canvas-renderer.js','main-1','optional-spanish-audio-v1'].includes(token)||
  row.root!=='workspace')throw Error('P017_RESOURCE_SCOPE');
 return readPin(getWorkspaceRoot(),{path:row.path,bytes:row.bytes,sha256:row.sha256});
}
