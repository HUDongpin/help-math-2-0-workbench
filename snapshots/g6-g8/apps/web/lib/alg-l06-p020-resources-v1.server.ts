import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P020FormalDescriptor} from './alg-l06-p020-formal-admission-v1.server';
import {algL6P020CandidateDescriptor} from './alg-l06-p020-candidate-v1.server';
import {readP019Resource} from './alg-l06-p019-resources-v1.server';
import {P019_RESOURCE_PINS} from './alg-l06-p019-local-request-v1';
import {P020_RESOURCE_PINS,type P020Resource} from './alg-l06-p020-local-request-v1';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';

const OWN=new Set(['canvas-renderer.js','main-1','feedback-right-1',
 'feedback-right-2','feedback-right-3','feedback-right-4','feedback-wrong-1',
 'feedback-wrong-2','feedback-wrong-3','optional-spanish-audio-v1']);

/** Exact local candidate/formal bridge. Every inherited byte remains validated by its
 * registered predecessor reader and the exact P020 table mapping. */
export async function readP020Resource(token:P020Resource):Promise<Buffer>{
 if(!Object.hasOwn(P020_RESOURCE_PINS,token))
  throw Error('P020_RESOURCE_SCOPE');
 const descriptor=localOnlyAnimationModuleRegistration('shared-alg001-l06-p020')
  ?algL6P020FormalDescriptor():algL6P020CandidateDescriptor();
 if(descriptor.productBridge.registeredAnimationCount!==31||
  descriptor.pages[19].animationId!=='shared-alg001-l06-p020')
  throw Error('P020_RESOURCE_CANDIDATE');
 const row=P020_RESOURCE_PINS[token];
 const inherited=Object.entries(P019_RESOURCE_PINS).filter(([,prior])=>
  prior.originalPath===row.originalPath);
 if(inherited.length){
  if(inherited.length!==1)throw Error('P020_AMBIGUOUS_PREDECESSOR');
  const [priorToken,prior]=inherited[0];
  if(prior.path!==row.path||prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.root!==row.root||prior.contentType!==row.contentType)
   throw Error('P020_PREDECESSOR_DRIFT');
  return readP019Resource(priorToken);
 }
 if(!OWN.has(token)||row.root!=='workspace')throw Error('P020_RESOURCE_UNKNOWN');
 return readPin(getWorkspaceRoot(),{path:row.path,bytes:row.bytes,sha256:row.sha256});
}
