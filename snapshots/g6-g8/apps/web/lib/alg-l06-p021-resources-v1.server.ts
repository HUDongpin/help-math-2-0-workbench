import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P021FormalDescriptor} from './alg-l06-p021-formal-admission-v1.server';
import {algL6P021CandidateDescriptor} from './alg-l06-p021-candidate-v1.server';
import {readP020Resource} from './alg-l06-p020-resources-v1.server';
import {P020_RESOURCE_PINS} from './alg-l06-p020-local-request-v1';
import {P021_RESOURCE_PINS,type P021Resource} from './alg-l06-p021-local-request-v1';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';

/** The candidate validates source and formal predecessors. Reuse each frozen
 * predecessor's byte verifier; expose only three new exact source assets. */
export async function readP021Resource(token:P021Resource):Promise<Buffer>{
 if(!Object.hasOwn(P021_RESOURCE_PINS,token))throw Error('P021_UNKNOWN_RESOURCE');
 const descriptor=localOnlyAnimationModuleRegistration('shared-alg001-l06-p021')
  ?algL6P021FormalDescriptor():algL6P021CandidateDescriptor();
 if(descriptor.productBridge.registeredAnimationCount!==32||
  descriptor.pages[20].animationId!=='shared-alg001-l06-p021')throw Error('P021_RESOURCE_CANDIDATE');
 const row=P021_RESOURCE_PINS[token];
 const inherited=Object.entries(P020_RESOURCE_PINS).filter(([,prior])=>prior.originalPath===row.originalPath);
 if(inherited.length){
  if(inherited.length!==1)throw Error('P021_AMBIGUOUS_PREDECESSOR');
  const [priorToken,prior]=inherited[0];
  if(prior.path!==row.path||prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.root!==row.root||prior.contentType!==row.contentType)throw Error('P021_PREDECESSOR_DRIFT');
  return readP020Resource(priorToken);
 }
 if(!['canvas-renderer.js','main-1','optional-spanish-audio-v1'].includes(token)||
  row.root!=='workspace')throw Error('P021_RESOURCE_SCOPE');
 return readPin(getWorkspaceRoot(),{path:row.path,bytes:row.bytes,sha256:row.sha256});
}
