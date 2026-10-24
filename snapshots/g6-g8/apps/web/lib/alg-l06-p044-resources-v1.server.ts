import 'server-only';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P043FormalDescriptor} from './alg-l06-p043-formal-admission-v1.server';
import {P043_RESOURCE_PINS} from './alg-l06-p043-local-request-v1';
import {P044_RESOURCE_PINS,type P044Resource} from './alg-l06-p044-local-request-v1';
import {P044_MEASURED_BINDINGS,type P044MeasuredDomainId}
 from '../../../packages/demos/src/alg-l06-p044-measured-bindings-v1';
import {P044_SOURCE_ROOT,p044LocalDevelopment} from './alg-l06-p044-preview-policy-v1';

const OWN_AUDIO:Readonly<Record<string,{id:P044MeasuredDomainId;path:string}>>=Object.freeze({
 'main-source-v1':{id:'main',path:'audio-source-v1/streams/sprite-354-main.mp3'},
 'feedback-wrong4-source-v1':{id:'wrong4',path:'audio-source-v1/streams/sprite-336-wrong4.mp3'},
 'feedback-right4-source-v1':{id:'right4',path:'audio-source-v1/streams/sprite-198-right4.mp3'},
 'optional-spanish-audio-v1':{id:'sa',path:'source-v1/SA/L6TI04.mp3'},
});

/** Candidate assets remain source-pinned and separate from registered P043. */
export async function readP044Resource(token:P044Resource):Promise<Buffer>{
 if(!p044LocalDevelopment()||!Object.hasOwn(P044_RESOURCE_PINS,token))
  throw Error('P044_RESOURCE_SCOPE');
 const base=algL6P043FormalDescriptor(),target=base.pages[43];
 if(base.pages.length!==60||base.productBridge.registeredAnimationCount!==46||
  target.animationId!=='shared-alg001-l06-p044'||
  target.globalPageOrdinal!==44||target.rendererAvailability.kind!=='unavailable')
  throw Error('P044_PREDECESSOR_DESCRIPTOR');
 const row=P044_RESOURCE_PINS[token];
 if(token.startsWith('p043-')){
  const prior=P043_RESOURCE_PINS[token.slice(5)];
  if(!prior||prior.path!==row.path||prior.originalPath!==row.originalPath||
   prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.contentType!==row.contentType||prior.root!==row.root)
   throw Error('P044_PREDECESSOR_DRIFT');
 }else if(token==='canvas-renderer.js'){
  if(row.root!=='workspace'||row.contentType!=='text/javascript; charset=utf-8')
   throw Error('P044_RESOURCE_SCOPE');
 }else{
  const own=OWN_AUDIO[token];
  if(!own||row.root!=='workspace'||row.contentType!=='audio/mpeg'||
   row.path!==`migrations/shared-alg001-l06-p044/${own.path}`||
   row.bytes!==P044_MEASURED_BINDINGS[own.id].sourceBytes||
   row.sha256!==P044_MEASURED_BINDINGS[own.id].sourceSha256)
   throw Error('P044_RESOURCE_SCOPE');
 }
 return readPin(row.root==='source'?P044_SOURCE_ROOT:getWorkspaceRoot(),row);
}
