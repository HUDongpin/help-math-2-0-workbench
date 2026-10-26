import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P024FormalDescriptor} from './alg-l06-p024-formal-admission-v1.server';
import {algL6P024CandidateDescriptor} from './alg-l06-p024-candidate-v1.server';
import {readP023Resource} from './alg-l06-p023-resources-v1.server';
import {P023_RESOURCE_PINS} from './alg-l06-p023-local-request-v1';
import {P024_RESOURCE_PINS,type P024Resource} from './alg-l06-p024-local-request-v1';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';

export async function readP024Resource(token:P024Resource):Promise<Buffer>{
 if(!Object.hasOwn(P024_RESOURCE_PINS,token))throw Error('P024_UNKNOWN_RESOURCE');
 const descriptor=localOnlyAnimationModuleRegistration('shared-alg001-l06-p024')
  ?algL6P024FormalDescriptor():algL6P024CandidateDescriptor();
 if(descriptor.productBridge.registeredAnimationCount!==35||
  descriptor.pages[23].animationId!=='shared-alg001-l06-p024')throw Error('P024_RESOURCE_CANDIDATE');
 const row=P024_RESOURCE_PINS[token];
 const inherited=Object.entries(P023_RESOURCE_PINS).filter(([,prior])=>prior.originalPath===row.originalPath);
 if(inherited.length){
  if(inherited.length!==1)throw Error('P024_AMBIGUOUS_PREDECESSOR');
  const [priorToken,prior]=inherited[0];
  if(prior.path!==row.path||prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.root!==row.root||prior.contentType!==row.contentType)throw Error('P024_PREDECESSOR_DRIFT');
  return readP023Resource(priorToken);
 }
 if(row.root!=='workspace'||!['canvas-renderer.js','optional-spanish-audio-v1',
  'sprite-69','sprite-83','sprite-97','sprite-123','sprite-155','sprite-188','sprite-196','sprite-208'].includes(token))
  throw Error('P024_RESOURCE_SCOPE');
 return readPin(getWorkspaceRoot(),{path:row.path,bytes:row.bytes,sha256:row.sha256});
}
