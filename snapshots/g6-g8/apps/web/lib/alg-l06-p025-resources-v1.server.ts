import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P025FormalDescriptor} from './alg-l06-p025-formal-admission-v1.server';
import {algL6P025CandidateDescriptor} from './alg-l06-p025-candidate-v1.server';
import {P025_SOURCE_ROOT} from './alg-l06-p025-preview-policy-v1';
import {P024_RESOURCE_PINS} from './alg-l06-p024-local-request-v1';
import {P025_RESOURCE_PINS,type P025Resource} from './alg-l06-p025-local-request-v1';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
export async function readP025Resource(token:P025Resource):Promise<Buffer>{
 if(!Object.hasOwn(P025_RESOURCE_PINS,token))throw Error('P025_UNKNOWN_RESOURCE');
 const descriptor=localOnlyAnimationModuleRegistration('shared-alg001-l06-p025')
  ?algL6P025FormalDescriptor():algL6P025CandidateDescriptor();
 if(descriptor.productBridge.registeredAnimationCount!==36||descriptor.pages[24].animationId!=='shared-alg001-l06-p025')
  throw Error('P025_RESOURCE_CANDIDATE');
 const row=P025_RESOURCE_PINS[token],inherited=Object.entries(P024_RESOURCE_PINS).filter(([,p])=>p.originalPath===row.originalPath);
 if(inherited.length){
  if(inherited.length!==1)throw Error('P025_AMBIGUOUS_PREDECESSOR');
  const [,p]=inherited[0];
  if(p.path!==row.path||p.bytes!==row.bytes||p.sha256!==row.sha256||p.root!==row.root||p.contentType!==row.contentType)
   throw Error('P025_PREDECESSOR_DRIFT');
  // The exact P025 descriptor above has already verified the full P024
  // predecessor. Re-entering its resource reader repeats that same recursive
  // proof chain for each audio file. Retain the exact inherited tuple and
  // independently hash the delivered bytes without repeating the descriptor.
  if(!['workspace','source'].includes(row.root))throw Error('P025_RESOURCE_ROOT');
  return readPin(row.root==='source'?P025_SOURCE_ROOT:getWorkspaceRoot(),
   {path:row.path,bytes:row.bytes,sha256:row.sha256});
 }
 if(!['canvas-renderer.js','main-1','optional-spanish-audio-v1'].includes(token)||row.root!=='workspace')
  throw Error('P025_RESOURCE_SCOPE');
 return readPin(getWorkspaceRoot(),{path:row.path,bytes:row.bytes,sha256:row.sha256});
}
