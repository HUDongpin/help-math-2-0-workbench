import 'server-only';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P042FormalDescriptor} from './alg-l06-p042-formal-admission-v1.server';
import {P042_RESOURCE_PINS} from './alg-l06-p042-local-request-v1';
import {P043_RESOURCE_PINS,type P043Resource} from './alg-l06-p043-local-request-v1';
import {P043_MEASURED_BINDINGS,type P043MeasuredDomainId}
 from '../../../packages/demos/src/alg-l06-p043-measured-bindings-v1';
import {P043_SOURCE_ROOT,p043LocalDevelopment} from './alg-l06-p043-preview-policy-v1';

const OWN_AUDIO:Readonly<Record<string,{id:P043MeasuredDomainId;path:string}>>=Object.freeze({
 'main-source-v1':{id:'main',path:'audio-source-v1/streams/sprite-342-main.mp3'},
 'feedback-wrong4-source-v1':{id:'wrong4',path:'audio-source-v1/streams/sprite-307-wrong4.mp3'},
 'feedback-right4-source-v1':{id:'right4',path:'audio-source-v1/streams/sprite-202-right4.mp3'},
 'optional-spanish-audio-v1':{id:'sa',path:'source-v1/SA/L6TI03.mp3'},
});

/** Candidate assets remain source-pinned and separate from registered P042. */
export async function readP043Resource(token:P043Resource):Promise<Buffer>{
 if(!p043LocalDevelopment()||!Object.hasOwn(P043_RESOURCE_PINS,token))
  throw Error('P043_RESOURCE_SCOPE');
 const base=algL6P042FormalDescriptor(),target=base.pages[42];
 if(base.pages.length!==60||base.productBridge.registeredAnimationCount!==45||
  target.animationId!=='shared-alg001-l06-p043'||
  target.globalPageOrdinal!==43||target.rendererAvailability.kind!=='unavailable')
  throw Error('P043_PREDECESSOR_DESCRIPTOR');
 const row=P043_RESOURCE_PINS[token];
 if(token.startsWith('p042-')){
  const prior=P042_RESOURCE_PINS[token.slice(5)];
  if(!prior||prior.path!==row.path||prior.originalPath!==row.originalPath||
   prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.contentType!==row.contentType||prior.root!==row.root)
   throw Error('P043_PREDECESSOR_DRIFT');
 }else if(token==='canvas-renderer.js'){
  if(row.root!=='workspace'||row.contentType!=='text/javascript; charset=utf-8')
   throw Error('P043_RESOURCE_SCOPE');
 }else{
  const own=OWN_AUDIO[token];
  if(!own||row.root!=='workspace'||row.contentType!=='audio/mpeg'||
   row.path!==`migrations/shared-alg001-l06-p043/${own.path}`||
   row.bytes!==P043_MEASURED_BINDINGS[own.id].sourceBytes||
   row.sha256!==P043_MEASURED_BINDINGS[own.id].sourceSha256)
   throw Error('P043_RESOURCE_SCOPE');
 }
 return readPin(row.root==='source'?P043_SOURCE_ROOT:getWorkspaceRoot(),row);
}
