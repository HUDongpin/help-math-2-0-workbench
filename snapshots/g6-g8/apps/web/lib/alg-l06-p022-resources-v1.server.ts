import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P022FormalDescriptor} from './alg-l06-p022-formal-admission-v1.server';
import {algL6P022CandidateDescriptor} from './alg-l06-p022-candidate-v1.server';
import {readP021Resource} from './alg-l06-p021-resources-v1.server';
import {P021_RESOURCE_PINS} from './alg-l06-p021-local-request-v1';
import {P022_RESOURCE_PINS,type P022Resource} from './alg-l06-p022-local-request-v1';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';

/** The candidate validates source and formal predecessors. Reuse each frozen
 * predecessor's byte verifier; expose only four new exact source assets. */
export async function readP022Resource(token:P022Resource):Promise<Buffer>{
 if(!Object.hasOwn(P022_RESOURCE_PINS,token))throw Error('P022_UNKNOWN_RESOURCE');
 const descriptor=localOnlyAnimationModuleRegistration('shared-alg001-l06-p022')
  ?algL6P022FormalDescriptor():algL6P022CandidateDescriptor();
 if(descriptor.productBridge.registeredAnimationCount!==33||
  descriptor.pages[21].animationId!=='shared-alg001-l06-p022')throw Error('P022_RESOURCE_CANDIDATE');
 const row=P022_RESOURCE_PINS[token];
 const inherited=Object.entries(P021_RESOURCE_PINS).filter(([,prior])=>prior.originalPath===row.originalPath);
 if(inherited.length){
  if(inherited.length!==1)throw Error('P022_AMBIGUOUS_PREDECESSOR');
  const [priorToken,prior]=inherited[0];
  if(prior.path!==row.path||prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.root!==row.root||prior.contentType!==row.contentType)throw Error('P022_PREDECESSOR_DRIFT');
  return readP021Resource(priorToken);
 }
 if(!['canvas-renderer.js','main-1','main-2','optional-spanish-audio-v1'].includes(token)||
  row.root!=='workspace')throw Error('P022_RESOURCE_SCOPE');
 return readPin(getWorkspaceRoot(),{path:row.path,bytes:row.bytes,sha256:row.sha256});
}
