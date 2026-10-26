import 'server-only';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P041CandidateDescriptor} from './alg-l06-p041-candidate-v1.server';
import {P041_RESOURCE_PINS,type P041Resource} from './alg-l06-p041-local-request-v1';
import {P038_RESOURCE_PINS} from './alg-l06-p038-local-request-v1';
import {P041_SOURCE_ROOT,p041LocalDevelopment} from './alg-l06-p041-preview-policy-v1';

export async function readP041Resource(token:P041Resource):Promise<Buffer>{
 if(!p041LocalDevelopment()||!Object.hasOwn(P041_RESOURCE_PINS,token))
  throw Error('P041_RESOURCE_SCOPE');
 const descriptor=algL6P041CandidateDescriptor();
 if(descriptor.pages.length!==60||descriptor.productBridge.registeredAnimationCount!==44||
  descriptor.pages[40].animationId!=='shared-alg001-l06-p041')
  throw Error('P041_RESOURCE_DESCRIPTOR');
 const row=P041_RESOURCE_PINS[token];
 if(token.startsWith('p038-')){
  const prior=P038_RESOURCE_PINS[token.slice(5)];
  if(!prior||prior.path!==row.path||prior.originalPath!==row.originalPath||
   prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.contentType!==row.contentType||prior.root!==row.root)
   throw Error('P041_PREDECESSOR_DRIFT');
 }else if(!['canvas-renderer.js','main-source-v1',
   'optional-spanish-audio-v1','feedback-76-source-v1','feedback-91-source-v1',
   'feedback-105-source-v1','feedback-119-source-v1','feedback-139-source-v1',
   'feedback-152-source-v1','feedback-168-source-v1'].includes(token)||
   row.root!=='workspace')throw Error('P041_RESOURCE_SCOPE');
 return readPin(row.root==='source'?P041_SOURCE_ROOT:getWorkspaceRoot(),row);
}
