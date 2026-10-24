import 'server-only';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P041FormalDescriptor} from './alg-l06-p041-formal-admission-v1.server';
import {P042_RESOURCE_PINS,type P042Resource} from './alg-l06-p042-local-request-v1';
import {P041_RESOURCE_PINS} from './alg-l06-p041-local-request-v1';
import {P042_SOURCE_ROOT,p042LocalDevelopment} from './alg-l06-p042-preview-policy-v1';

const own=new Set(['canvas-renderer.js','main-source-v1',
 'feedback-wrong4-source-v1','feedback-right4-source-v1',
 'optional-spanish-audio-v1']);

/** Candidate assets are exact P042 bytes plus unchanged P041 predecessors. */
export async function readP042Resource(token:P042Resource):Promise<Buffer>{
 if(!p042LocalDevelopment()||!Object.hasOwn(P042_RESOURCE_PINS,token))
  throw Error('P042_RESOURCE_SCOPE');
 const base=algL6P041FormalDescriptor();
 const target=base.pages[41];
 if(base.pages.length!==60||base.productBridge.registeredAnimationCount!==44||
  target.animationId!=='shared-alg001-l06-p042'||
  target.globalPageOrdinal!==42||target.rendererAvailability.kind!=='unavailable')
  throw Error('P042_PREDECESSOR_DESCRIPTOR');
 const row=P042_RESOURCE_PINS[token];
 if(token.startsWith('p041-')){
  const prior=P041_RESOURCE_PINS[token.slice(5)];
  if(!prior||prior.path!==row.path||prior.originalPath!==row.originalPath||
   prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.contentType!==row.contentType||prior.root!==row.root)
   throw Error('P042_PREDECESSOR_DRIFT');
 }else if(!own.has(token)||row.root!=='workspace')throw Error('P042_RESOURCE_SCOPE');
 return readPin(row.root==='source'?P042_SOURCE_ROOT:getWorkspaceRoot(),row);
}
