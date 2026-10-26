import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P023FormalDescriptor} from './alg-l06-p023-formal-admission-v1.server';
import 'server-only';
import {algL6P023CandidateDescriptor} from './alg-l06-p023-candidate-v1.server';
import {readP022Resource} from './alg-l06-p022-resources-v1.server';
import {P022_RESOURCE_PINS} from './alg-l06-p022-local-request-v1';
import {P023_RESOURCE_PINS,type P023Resource} from './alg-l06-p023-local-request-v1';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';

/** Reuse the P022 byte verifier for all predecessor resources; expose only
 * three source-bound P023 assets on this unregistered local candidate. */
export async function readP023Resource(token:P023Resource):Promise<Buffer>{
 if(!Object.hasOwn(P023_RESOURCE_PINS,token))throw Error('P023_UNKNOWN_RESOURCE');
 const descriptor=localOnlyAnimationModuleRegistration('shared-alg001-l06-p023')
  ?algL6P023FormalDescriptor():algL6P023CandidateDescriptor();
 if(descriptor.productBridge.registeredAnimationCount!==34||
  descriptor.pages[22].animationId!=='shared-alg001-l06-p023')throw Error('P023_RESOURCE_CANDIDATE');
 const row=P023_RESOURCE_PINS[token];
 const inherited=Object.entries(P022_RESOURCE_PINS).filter(([,prior])=>prior.originalPath===row.originalPath);
 if(inherited.length){
  if(inherited.length!==1)throw Error('P023_AMBIGUOUS_PREDECESSOR');
  const [priorToken,prior]=inherited[0];
  if(prior.path!==row.path||prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.root!==row.root||prior.contentType!==row.contentType)throw Error('P023_PREDECESSOR_DRIFT');
  return readP022Resource(priorToken);
 }
 if(!['canvas-renderer.js','main-1','optional-spanish-audio-v1'].includes(token)||
  row.root!=='workspace')throw Error('P023_RESOURCE_SCOPE');
 return readPin(getWorkspaceRoot(),{path:row.path,bytes:row.bytes,sha256:row.sha256});
}
