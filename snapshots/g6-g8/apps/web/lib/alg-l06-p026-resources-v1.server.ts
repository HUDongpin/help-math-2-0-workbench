import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P026FormalDescriptor} from './alg-l06-p026-formal-admission-v1.server';
import {algL6P026CandidateDescriptor} from './alg-l06-p026-candidate-v1.server';
import {P026_SOURCE_ROOT} from './alg-l06-p026-preview-policy-v1';
import {P025_RESOURCE_PINS} from './alg-l06-p025-local-request-v1';
import {P026_RESOURCE_PINS,type P026Resource} from './alg-l06-p026-local-request-v1';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
export async function readP026Resource(token:P026Resource):Promise<Buffer>{
 if(!Object.hasOwn(P026_RESOURCE_PINS,token))throw Error('P026_UNKNOWN_RESOURCE');
 const descriptor=localOnlyAnimationModuleRegistration('shared-alg001-l06-p026')
  ?algL6P026FormalDescriptor():algL6P026CandidateDescriptor();
 if(descriptor.productBridge.registeredAnimationCount!==37||
  descriptor.pages.length!==60||descriptor.pages[24].animationId!=='shared-alg001-l06-p025'||
  descriptor.pages[25].animationId!=='shared-alg001-l06-p026')
  throw Error('P026_RESOURCE_CANDIDATE');
 const row=P026_RESOURCE_PINS[token],inherited=Object.entries(P025_RESOURCE_PINS).filter(([,p])=>p.originalPath===row.originalPath);
 if(inherited.length){
  if(inherited.length!==1)throw Error('P026_AMBIGUOUS_PREDECESSOR');
  const [,p]=inherited[0];
  if(p.path!==row.path||p.bytes!==row.bytes||p.sha256!==row.sha256||p.root!==row.root||p.contentType!==row.contentType)
   throw Error('P026_PREDECESSOR_DRIFT');
  // The admitted or unregistered P026 descriptor verifies the P025 formal predecessor chain.
  // Match its exact inherited tuple, then independently hash delivered bytes.
  if(!['workspace','source'].includes(row.root))throw Error('P026_RESOURCE_ROOT');
  return readPin(row.root==='source'?P026_SOURCE_ROOT:getWorkspaceRoot(),
   {path:row.path,bytes:row.bytes,sha256:row.sha256});
 }
 if(!['canvas-renderer.js','main-1','main-2','optional-spanish-audio-v1'].includes(token)||row.root!=='workspace')
  throw Error('P026_RESOURCE_SCOPE');
 return readPin(getWorkspaceRoot(),{path:row.path,bytes:row.bytes,sha256:row.sha256});
}
