import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P015FormalDescriptor} from './alg-l06-p015-formal-admission-v1.server';
import {algL6P015CandidateDescriptor} from './alg-l06-p015-candidate-v1.server';
import {readP014Resource} from './alg-l06-p014-resources-v1.server';
import {P014_RESOURCE_PINS} from './alg-l06-p014-local-request-v1';
import {P015_RESOURCE_PINS,type P015Resource} from './alg-l06-p015-local-request-v1';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';

/** The candidate validates source and formal predecessors. Reuse each frozen
 * predecessor's byte verifier; expose only six new exact source assets. */
export async function readP015Resource(token:P015Resource):Promise<Buffer>{
 if(!Object.hasOwn(P015_RESOURCE_PINS,token))throw Error('P015_UNKNOWN_RESOURCE');
 const descriptor=localOnlyAnimationModuleRegistration('shared-alg001-l06-p015')
  ?algL6P015FormalDescriptor():algL6P015CandidateDescriptor();
 if(descriptor.productBridge.registeredAnimationCount!==26||
  descriptor.pages[14].animationId!=='shared-alg001-l06-p015')throw Error('P015_RESOURCE_CANDIDATE');
 const row=P015_RESOURCE_PINS[token];
 const inherited=Object.entries(P014_RESOURCE_PINS).filter(([,prior])=>prior.originalPath===row.originalPath);
 if(inherited.length){
  if(inherited.length!==1)throw Error('P015_AMBIGUOUS_PREDECESSOR');
  const [priorToken,prior]=inherited[0];
  if(prior.path!==row.path||prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.root!==row.root||prior.contentType!==row.contentType)throw Error('P015_PREDECESSOR_DRIFT');
  return readP014Resource(priorToken);
 }
 if(!['canvas-renderer.js','main-1','main-2','main-3','main-4','optional-spanish-audio-v1'].includes(token)||
  row.root!=='workspace')throw Error('P015_RESOURCE_SCOPE');
 return readPin(getWorkspaceRoot(),{path:row.path,bytes:row.bytes,sha256:row.sha256});
}
