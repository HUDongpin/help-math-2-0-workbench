import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P028CandidateDescriptor} from './alg-l06-p028-candidate-v1.server';
import {algL6P028FormalDescriptor} from './alg-l06-p028-formal-admission-v1.server';
import {P028_ID,P028_SOURCE_ROOT} from './alg-l06-p028-preview-policy-v1';
import {P027_RESOURCE_PINS} from './alg-l06-p027-local-request-v1';
import {P028_RESOURCE_PINS,type P028Resource} from './alg-l06-p028-local-request-v1';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';

export async function readP028Resource(token:P028Resource):Promise<Buffer>{
 if(!Object.hasOwn(P028_RESOURCE_PINS,token))throw Error('P028_UNKNOWN_RESOURCE');
 const descriptor=localOnlyAnimationModuleRegistration(P028_ID)
  ?algL6P028FormalDescriptor():algL6P028CandidateDescriptor();
 if(descriptor.productBridge.registeredAnimationCount!==39||
  descriptor.pages.length!==60||descriptor.pages[26].animationId!=='shared-alg001-l06-p027'||
  descriptor.pages[27].animationId!==P028_ID)
  throw Error('P028_RESOURCE_CANDIDATE');
 const row=P028_RESOURCE_PINS[token];
 if(token.startsWith('p027-')){
  const prior=P027_RESOURCE_PINS[token.slice('p027-'.length)];
  if(!prior||prior.originalPath!==row.originalPath||prior.path!==row.path||
   prior.bytes!==row.bytes||prior.sha256!==row.sha256||prior.root!==row.root||
   prior.contentType!==row.contentType)
   throw Error('P028_PREDECESSOR_DRIFT');
 }else if(!['canvas-renderer.js','main-source-v1','optional-spanish-audio-v1'].includes(token)||
  (token==='optional-spanish-audio-v1'?row.root!=='source':row.root!=='workspace'))throw Error('P028_RESOURCE_SCOPE');
 if(row.root!=='workspace'&&row.root!=='source')throw Error('P028_RESOURCE_ROOT');
 return readPin(row.root==='source'?P028_SOURCE_ROOT:getWorkspaceRoot(),
  {path:row.path,bytes:row.bytes,sha256:row.sha256});
}
