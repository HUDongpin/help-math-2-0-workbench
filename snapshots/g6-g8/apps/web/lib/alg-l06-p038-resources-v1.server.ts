import 'server-only';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P038CandidateDescriptor} from './alg-l06-p038-candidate-v1.server';
import {P038_RESOURCE_PINS,type P038Resource} from './alg-l06-p038-local-request-v1';
import {P035_RESOURCE_PINS} from './alg-l06-p035-local-request-v1';
import {P038_SOURCE_ROOT} from './alg-l06-p038-preview-policy-v1';

export async function readP038Resource(token:P038Resource):Promise<Buffer>{
 if(!Object.hasOwn(P038_RESOURCE_PINS,token))throw Error('P038_RESOURCE_SCOPE');
 const descriptor=algL6P038CandidateDescriptor();
 if(descriptor.pages.length!==60||descriptor.productBridge.registeredAnimationCount!==43||
  descriptor.pages[37].animationId!=='shared-alg001-l06-p038')
  throw Error('P038_RESOURCE_DESCRIPTOR');
 const row=P038_RESOURCE_PINS[token];
 if(token.startsWith('p035-')){
  const prior=P035_RESOURCE_PINS[token.slice(5)];
  if(!prior||prior.path!==row.path||prior.originalPath!==row.originalPath||
   prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.contentType!==row.contentType||prior.root!==row.root)
   throw Error('P038_PREDECESSOR_DRIFT');
 }else if(!['canvas-renderer.js','main-source-v1',
  'optional-spanish-audio-v1'].includes(token)||row.root!=='workspace')
  throw Error('P038_RESOURCE_SCOPE');
 return readPin(row.root==='source'?P038_SOURCE_ROOT:getWorkspaceRoot(),row);
}
