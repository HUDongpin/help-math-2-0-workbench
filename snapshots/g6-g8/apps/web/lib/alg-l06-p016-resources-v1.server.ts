import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P016FormalDescriptor} from './alg-l06-p016-formal-admission-v1.server';
import {algL6P016CandidateDescriptor} from './alg-l06-p016-candidate-v1.server';
import {readP015Resource} from './alg-l06-p015-resources-v1.server';
import {P015_RESOURCE_PINS} from './alg-l06-p015-local-request-v1';
import {P016_RESOURCE_PINS,type P016Resource} from './alg-l06-p016-local-request-v1';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';

/** The candidate validates source and formal predecessors. Reuse each frozen
 * predecessor's byte verifier; expose only four new exact source assets. */
export async function readP016Resource(token:P016Resource):Promise<Buffer>{
 if(!Object.hasOwn(P016_RESOURCE_PINS,token))throw Error('P016_UNKNOWN_RESOURCE');
 const descriptor=localOnlyAnimationModuleRegistration('shared-alg001-l06-p016')
  ?algL6P016FormalDescriptor():algL6P016CandidateDescriptor();
 if(descriptor.productBridge.registeredAnimationCount!==27||
  descriptor.pages[15].animationId!=='shared-alg001-l06-p016')throw Error('P016_RESOURCE_CANDIDATE');
 const row=P016_RESOURCE_PINS[token];
 const inherited=Object.entries(P015_RESOURCE_PINS).filter(([,prior])=>prior.originalPath===row.originalPath);
 if(inherited.length){
  if(inherited.length!==1)throw Error('P016_AMBIGUOUS_PREDECESSOR');
  const [priorToken,prior]=inherited[0];
  if(prior.path!==row.path||prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.root!==row.root||prior.contentType!==row.contentType)throw Error('P016_PREDECESSOR_DRIFT');
  return readP015Resource(priorToken);
 }
 if(!['canvas-renderer.js','main-1','main-2','optional-spanish-audio-v1'].includes(token)||
  row.root!=='workspace')throw Error('P016_RESOURCE_SCOPE');
 return readPin(getWorkspaceRoot(),{path:row.path,bytes:row.bytes,sha256:row.sha256});
}
