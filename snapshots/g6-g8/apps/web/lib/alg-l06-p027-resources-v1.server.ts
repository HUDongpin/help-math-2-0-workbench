import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {algL6P027CandidateDescriptor} from './alg-l06-p027-candidate-v1.server';
import {algL6P027FormalDescriptor} from './alg-l06-p027-formal-admission-v1.server';
import {P027_ID,P027_SOURCE_ROOT} from './alg-l06-p027-preview-policy-v1';
import {P026_RESOURCE_PINS} from './alg-l06-p026-local-request-v1';
import {P027_RESOURCE_PINS,type P027Resource} from './alg-l06-p027-local-request-v1';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';

export async function readP027Resource(token:P027Resource):Promise<Buffer>{
 if(!Object.hasOwn(P027_RESOURCE_PINS,token))throw Error('P027_UNKNOWN_RESOURCE');
 const descriptor=localOnlyAnimationModuleRegistration(P027_ID)
  ?algL6P027FormalDescriptor():algL6P027CandidateDescriptor();
 if(descriptor.productBridge.registeredAnimationCount!==38||
  descriptor.pages.length!==60||descriptor.pages[25].animationId!=='shared-alg001-l06-p026'||
  descriptor.pages[26].animationId!==P027_ID)
  throw Error('P027_RESOURCE_CANDIDATE');
 const row=P027_RESOURCE_PINS[token];
 if(token.startsWith('p026-')){
  const prior=P026_RESOURCE_PINS[token.slice('p026-'.length)];
  if(!prior||prior.originalPath!==row.originalPath||prior.path!==row.path||
   prior.bytes!==row.bytes||prior.sha256!==row.sha256||prior.root!==row.root||
   prior.contentType!==row.contentType)
   throw Error('P027_PREDECESSOR_DRIFT');
 }else if(!['canvas-renderer.js','main-source-v1','optional-spanish-audio-v1'].includes(token)||
  row.root!=='workspace')throw Error('P027_RESOURCE_SCOPE');
 if(row.root!=='workspace'&&row.root!=='source')throw Error('P027_RESOURCE_ROOT');
 return readPin(row.root==='source'?P027_SOURCE_ROOT:getWorkspaceRoot(),
  {path:row.path,bytes:row.bytes,sha256:row.sha256});
}
