import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P034CandidateDescriptor} from './alg-l06-p034-candidate-v1.server';
import {algL6P034FormalDescriptor} from './alg-l06-p034-formal-admission-v1.server';
import {P034_ID,P034_SOURCE_ROOT} from './alg-l06-p034-preview-policy-v1';
import {P032_RESOURCE_PINS} from './alg-l06-p032-local-request-v1';
import {P034_RESOURCE_PINS,type P034Resource} from './alg-l06-p034-local-request-v1';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';

export async function readP034Resource(token:P034Resource,
 mode:'candidate'|'formal'):Promise<Buffer>{
 if(!Object.hasOwn(P034_RESOURCE_PINS,token))throw Error('P034_UNKNOWN_RESOURCE');
 if(mode!=='candidate'&&mode!=='formal')throw Error('P034_RESOURCE_MODE');
 const registered=Boolean(localOnlyAnimationModuleRegistration(P034_ID));
 if((mode==='formal')!==registered)throw Error('P034_RESOURCE_MODE_REGISTRATION_MISMATCH');
 const descriptor=registered?algL6P034FormalDescriptor():algL6P034CandidateDescriptor();
 if(descriptor.productBridge.registeredAnimationCount!==41||
  descriptor.pages.length!==60||descriptor.pages[27].animationId!=='shared-alg001-l06-p028'||
  descriptor.pages[33].animationId!==P034_ID)
  throw Error('P034_RESOURCE_DESCRIPTOR');
 const row=P034_RESOURCE_PINS[token];
 if(token.startsWith('p032-')){
  const prior=P032_RESOURCE_PINS[token.slice('p032-'.length)];
  if(!prior||prior.originalPath!==row.originalPath||prior.path!==row.path||
   prior.bytes!==row.bytes||prior.sha256!==row.sha256||prior.root!==row.root||
   prior.contentType!==row.contentType)
   throw Error('P034_PREDECESSOR_DRIFT');
 }else if(!['canvas-renderer.js','main-source-v1','optional-spanish-audio-v1'].includes(token)||
  (token==='optional-spanish-audio-v1'?row.root!=='source':row.root!=='workspace'))throw Error('P034_RESOURCE_SCOPE');
 if(row.root!=='workspace'&&row.root!=='source')throw Error('P034_RESOURCE_ROOT');
 return readPin(row.root==='source'?P034_SOURCE_ROOT:getWorkspaceRoot(),
  {path:row.path,bytes:row.bytes,sha256:row.sha256});
}
