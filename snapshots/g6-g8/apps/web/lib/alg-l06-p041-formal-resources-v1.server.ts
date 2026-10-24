import 'server-only';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P041FormalDescriptor} from './alg-l06-p041-formal-admission-v1.server';
import {P041_RESOURCE_PINS,type P041Resource} from './alg-l06-p041-local-request-v1';
import {P038_RESOURCE_PINS} from './alg-l06-p038-local-request-v1';
import {P041_SOURCE_ROOT} from './alg-l06-p041-preview-policy-v1';

const own=new Set(['canvas-renderer.js','main-source-v1',
 'optional-spanish-audio-v1',...[76,91,105,119,139,152,168]
  .map(id=>`feedback-${id}-source-v1`)]);

/** Formal host resource boundary; exactly ten P041 and 124 inherited P038 pins. */
export async function readP041FormalResource(token:P041Resource):Promise<Buffer>{
 if(!Object.hasOwn(P041_RESOURCE_PINS,token))throw Error('P041_FORMAL_RESOURCE_SCOPE');
 const descriptor=algL6P041FormalDescriptor();
 if(descriptor.pages.length!==60||descriptor.productBridge.registeredAnimationCount!==44||
  descriptor.pages[40].animationId!=='shared-alg001-l06-p041'||
  descriptor.pages[40].rendererAvailability.kind!=='registered')
  throw Error('P041_FORMAL_RESOURCE_DESCRIPTOR');
 const row=P041_RESOURCE_PINS[token];
 if(token.startsWith('p038-')){
  const prior=P038_RESOURCE_PINS[token.slice(5)];
  if(!prior||prior.path!==row.path||prior.originalPath!==row.originalPath||
   prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.contentType!==row.contentType||prior.root!==row.root)
   throw Error('P041_FORMAL_PREDECESSOR_DRIFT');
 }else if(!own.has(token)||row.root!=='workspace')
  throw Error('P041_FORMAL_RESOURCE_SCOPE');
 return readPin(row.root==='source'?P041_SOURCE_ROOT:getWorkspaceRoot(),row);
}
