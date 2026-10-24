import 'server-only';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P042FormalDescriptor} from './alg-l06-p042-formal-admission-v1.server';
import {P042_RESOURCE_PINS,type P042Resource} from './alg-l06-p042-local-request-v1';
import {P041_RESOURCE_PINS} from './alg-l06-p041-local-request-v1';
import {P042_SOURCE_ROOT} from './alg-l06-p042-preview-policy-v1';

const own=new Set(['canvas-renderer.js','main-source-v1',
 'feedback-wrong4-source-v1','feedback-right4-source-v1',
 'optional-spanish-audio-v1']);

/** Formal host resource boundary; exactly five P042 and 134 inherited P041 pins. */
export async function readP042FormalResource(token:P042Resource):Promise<Buffer>{
 if(!Object.hasOwn(P042_RESOURCE_PINS,token))throw Error('P042_FORMAL_RESOURCE_SCOPE');
 const descriptor=algL6P042FormalDescriptor();
 if(descriptor.pages.length!==60||descriptor.productBridge.registeredAnimationCount!==45||
  descriptor.pages[41].animationId!=='shared-alg001-l06-p042'||
  descriptor.pages[41].rendererAvailability.kind!=='registered')
  throw Error('P042_FORMAL_RESOURCE_DESCRIPTOR');
 const row=P042_RESOURCE_PINS[token];
 if(token.startsWith('p041-')){
  const prior=P041_RESOURCE_PINS[token.slice(5)];
  if(!prior||prior.path!==row.path||prior.originalPath!==row.originalPath||
   prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.contentType!==row.contentType||prior.root!==row.root)
   throw Error('P042_FORMAL_PREDECESSOR_DRIFT');
 }else if(!own.has(token)||row.root!=='workspace')
  throw Error('P042_FORMAL_RESOURCE_SCOPE');
 return readPin(row.root==='source'?P042_SOURCE_ROOT:getWorkspaceRoot(),row);
}
