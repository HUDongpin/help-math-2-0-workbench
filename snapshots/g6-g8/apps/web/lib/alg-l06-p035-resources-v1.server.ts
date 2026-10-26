import 'server-only';
import {P035_RESOURCE_PINS,type P035Resource} from './alg-l06-p035-local-request-v1';
import {P034_RESOURCE_PINS} from './alg-l06-p034-local-request-v1';
import {P035_SOURCE_ROOT} from './alg-l06-p035-preview-policy-v1';
import {algL6P035CandidateDescriptor} from './alg-l06-p035-candidate-v1.server';
import {algL6P035FormalDescriptor} from './alg-l06-p035-formal-admission-v1.server';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';

export async function readP035Resource(token:P035Resource,mode:'candidate'|'formal'):Promise<Buffer>{
 if(!['candidate','formal'].includes(mode)||!Object.hasOwn(P035_RESOURCE_PINS,token))throw Error('P035_RESOURCE_SCOPE');
 const descriptor=mode==='formal'?algL6P035FormalDescriptor():algL6P035CandidateDescriptor();
 if(descriptor.pages.length!==60||descriptor.productBridge.registeredAnimationCount!==42||
  descriptor.pages[34].animationId!=='shared-alg001-l06-p035')throw Error('P035_RESOURCE_DESCRIPTOR');
 const row=P035_RESOURCE_PINS[token];
 if(token.startsWith('p034-')){
  const prior=P034_RESOURCE_PINS[token.slice(5)];
  if(!prior||prior.path!==row.path||prior.originalPath!==row.originalPath||
   prior.bytes!==row.bytes||prior.sha256!==row.sha256||prior.contentType!==row.contentType||
   prior.root!==row.root)throw Error('P035_PREDECESSOR_DRIFT');
 }else if(!['canvas-renderer.js','main-source-v1','optional-spanish-audio-v1',
  'feedback-80','feedback-95','feedback-126','feedback-154','feedback-195','feedback-207'].includes(token)||
  row.root!=='workspace')throw Error('P035_RESOURCE_SCOPE');
 return readPin(row.root==='source'?P035_SOURCE_ROOT:getWorkspaceRoot(),row);
}
