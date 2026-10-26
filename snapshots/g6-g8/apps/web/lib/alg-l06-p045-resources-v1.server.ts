import 'server-only';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P044FormalDescriptor} from './alg-l06-p044-formal-admission-v1.server';
import {P044_RESOURCE_PINS} from './alg-l06-p044-local-request-v1';
import {P045_RESOURCE_PINS,type P045Resource} from './alg-l06-p045-local-request-v1';
import {P045_MEASURED_BINDINGS,type P045MeasuredDomainId}
 from '../../../packages/demos/src/alg-l06-p045-measured-bindings-v1';
import {P045_SOURCE_ROOT,p045LocalDevelopment} from './alg-l06-p045-preview-policy-v1';

const OWN_AUDIO:Readonly<Record<string,{id:P045MeasuredDomainId;path:string}>>=Object.freeze({
 'main-source-v1':{id:'main',path:'audio-source-v1/streams/sprite-350-main.mp3'},
 'feedback-wrong4-source-v1':{id:'wrong4',path:'audio-source-v1/streams/sprite-307-wrong4.mp3'},
 'feedback-right4-source-v1':{id:'right4',path:'audio-source-v1/streams/sprite-220-right4.mp3'},
 'optional-spanish-audio-v1':{id:'sa',path:'source-v1/L6TI05.mp3'},
});

/** Candidate assets remain source-pinned and separate from registered P044. */
export async function readP045Resource(token:P045Resource):Promise<Buffer>{
 if(!p045LocalDevelopment()||!Object.hasOwn(P045_RESOURCE_PINS,token))
  throw Error('P045_RESOURCE_SCOPE');
 const base=algL6P044FormalDescriptor(),target=base.pages[44];
 if(base.pages.length!==60||base.productBridge.registeredAnimationCount!==47||
  target.animationId!=='shared-alg001-l06-p045'||
  target.globalPageOrdinal!==45||target.rendererAvailability.kind!=='unavailable')
  throw Error('P045_PREDECESSOR_DESCRIPTOR');
 const row=P045_RESOURCE_PINS[token];
 if(token.startsWith('p044-')){
  const prior=P044_RESOURCE_PINS[token.slice(5)];
  if(!prior||prior.path!==row.path||prior.originalPath!==row.originalPath||
   prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.contentType!==row.contentType||prior.root!==row.root)
   throw Error('P045_PREDECESSOR_DRIFT');
 }else if(token==='canvas-renderer.js'){
  if(row.root!=='workspace'||row.contentType!=='text/javascript; charset=utf-8')
   throw Error('P045_RESOURCE_SCOPE');
 }else{
  const own=OWN_AUDIO[token];
  if(!own||row.root!=='workspace'||row.contentType!=='audio/mpeg'||
   row.path!==`migrations/shared-alg001-l06-p045/${own.path}`||
   row.bytes!==P045_MEASURED_BINDINGS[own.id].sourceBytes||
   row.sha256!==P045_MEASURED_BINDINGS[own.id].sourceSha256)
   throw Error('P045_RESOURCE_SCOPE');
 }
 return readPin(row.root==='source'?P045_SOURCE_ROOT:getWorkspaceRoot(),row);
}
