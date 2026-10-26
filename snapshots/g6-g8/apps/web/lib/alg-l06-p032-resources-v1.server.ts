import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P032FormalDescriptor} from './alg-l06-p032-formal-admission-v1.server';
import {algL6P032CandidateDescriptor} from './alg-l06-p032-candidate-v1.server';
import {P032_ID,P032_SOURCE_ROOT} from './alg-l06-p032-preview-policy-v1';
import {P028_RESOURCE_PINS} from './alg-l06-p028-local-request-v1';
import {P032_RESOURCE_PINS,type P032Resource} from './alg-l06-p032-local-request-v1';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';

export async function readP032Resource(token:P032Resource):Promise<Buffer>{
 if(!Object.hasOwn(P032_RESOURCE_PINS,token))throw Error('P032_UNKNOWN_RESOURCE');
 const descriptor=localOnlyAnimationModuleRegistration(P032_ID)?
  algL6P032FormalDescriptor():algL6P032CandidateDescriptor();
 if(descriptor.productBridge.registeredAnimationCount!==40||
  descriptor.pages.length!==60||descriptor.pages[27].animationId!=='shared-alg001-l06-p028'||
  descriptor.pages[31].animationId!==P032_ID)
  throw Error('P032_RESOURCE_CANDIDATE');
 const row=P032_RESOURCE_PINS[token];
 if(token.startsWith('p028-')){
  const prior=P028_RESOURCE_PINS[token.slice('p028-'.length)];
  if(!prior||prior.originalPath!==row.originalPath||prior.path!==row.path||
   prior.bytes!==row.bytes||prior.sha256!==row.sha256||prior.root!==row.root||
   prior.contentType!==row.contentType)
   throw Error('P032_PREDECESSOR_DRIFT');
 }else if(!['canvas-renderer.js','main-source-v1','optional-spanish-audio-v1'].includes(token)||
  (token==='optional-spanish-audio-v1'?row.root!=='source':row.root!=='workspace'))throw Error('P032_RESOURCE_SCOPE');
 if(row.root!=='workspace'&&row.root!=='source')throw Error('P032_RESOURCE_ROOT');
 return readPin(row.root==='source'?P032_SOURCE_ROOT:getWorkspaceRoot(),
  {path:row.path,bytes:row.bytes,sha256:row.sha256});
}
