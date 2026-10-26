import 'server-only';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P047FormalDescriptor} from './alg-l06-p047-formal-admission-v1.server';
import {P047_RESOURCE_PINS} from './alg-l06-p047-local-request-v1';
import {P048_RESOURCE_PINS,type P048Resource} from './alg-l06-p048-local-request-v1';
import {P048_MEASURED_BINDINGS,type P048AudioDomain}
 from '../../../packages/demos/src/alg-l06-p048-measured-bindings-v1';
import {P048_SOURCE_ROOT,p048LocalDevelopment} from './alg-l06-p048-preview-policy-v1';

const OWN_AUDIO:Readonly<Record<string,{id:P048AudioDomain;path:string}>>=Object.freeze({
 'main-source-v1':{id:'main',path:'assets/source-stream-348-main.mp3'},
 'feedback-wrong4-source-v1':{id:'wrong4',path:'assets/source-stream-304-wrong4.mp3'},
 'feedback-right4-source-v1':{id:'right4',path:'assets/source-stream-217-right4.mp3'},
 'optional-spanish-audio-v1':{id:'sa',path:'source-v1/L6TI08.mp3'},
});

/** Candidate assets remain source-pinned and separate from registered P047. */
export async function readP048Resource(token:P048Resource):Promise<Buffer>{
 if(!p048LocalDevelopment()||!Object.hasOwn(P048_RESOURCE_PINS,token))
  throw Error('P048_RESOURCE_SCOPE');
 const row=P048_RESOURCE_PINS[token];
 if(token.startsWith('p047-')){
  const base=algL6P047FormalDescriptor(),target=base.pages[47];
  if(base.pages.length!==60||base.productBridge.registeredAnimationCount!==50||
   target.animationId!=='shared-alg001-l06-p048'||
   target.globalPageOrdinal!==48||target.rendererAvailability.kind!=='unavailable')
   throw Error('P048_PREDECESSOR_DESCRIPTOR');
  const prior=P047_RESOURCE_PINS[token.slice(5)];
  if(!prior||prior.path!==row.path||prior.originalPath!==row.originalPath||
   prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.contentType!==row.contentType||prior.root!==row.root)
   throw Error('P048_PREDECESSOR_DRIFT');
 }else if(token==='canvas-renderer.js'){
  if(row.root!=='workspace'||row.contentType!=='text/javascript; charset=utf-8')
   throw Error('P048_RESOURCE_SCOPE');
 }else{
  const own=OWN_AUDIO[token];
  if(!own||row.root!=='workspace'||row.contentType!=='audio/mpeg'||
   row.path!==`migrations/shared-alg001-l06-p048/${own.path}`||
   row.bytes!==P048_MEASURED_BINDINGS[own.id].sourceBytes||
   row.sha256!==P048_MEASURED_BINDINGS[own.id].sourceSha256)
   throw Error('P048_RESOURCE_SCOPE');
 }
 // Own candidate resources are individually hash-bound. The document validates
 // the complete formal predecessor; streaming four original MP3s does not need
 // to reconstruct that same descriptor four more times. No hash or source
 // identity check is cached, and inherited resources retain their reader above.
 if(!token.startsWith('p047-')) {
  readPin(P048_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/TI/L6TI08.swf',bytes:829399,
   sha256:'03a8334e6349a9e80b47bdea4d2c5ada40f635570be5d63f70e8706a03761780'});
  readPin(P048_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
   sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'});
  if(token==='optional-spanish-audio-v1')readPin(P048_SOURCE_ROOT,{
   path:'G6-G8-shared/ALG001/L6/SA/L6TI08.mp3',bytes:192528,
   sha256:'b76a62e5c4af35ab3ba277c2e186bf2d148a319b63c8fe9a9f954ae15057e5fd'});
 }
 return readPin(row.root==='source'?P048_SOURCE_ROOT:getWorkspaceRoot(),row);
}
