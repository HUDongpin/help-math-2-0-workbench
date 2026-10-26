import 'server-only';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P048FormalDescriptor} from './alg-l06-p048-formal-admission-v1.server';
import {P048_RESOURCE_PINS} from './alg-l06-p048-local-request-v1';
import {P049_RESOURCE_PINS,type P049Resource} from './alg-l06-p049-local-request-v1';
import {P049_MEASURED_BINDINGS,type P049AudioDomain}
 from '../../../packages/demos/src/alg-l06-p049-measured-bindings-v1';
import {P049_SOURCE_ROOT,p049LocalDevelopment} from './alg-l06-p049-preview-policy-v1';

const OWN_AUDIO:Readonly<Record<string,{id:P049AudioDomain;path:string}>>=Object.freeze({
 'main-source-v1':{id:'main',path:'assets/source-stream-327-main.mp3'},
 'feedback-wrong4-source-v1':{id:'wrong4',path:'assets/source-stream-302-wrong4.mp3'},
 'feedback-right4-source-v1':{id:'right4',path:'assets/source-stream-192-right4.wav'},
 'optional-spanish-audio-v1':{id:'sa',path:'source-v1/L6TI09.mp3'},
});

/** Candidate assets remain source-pinned and separate from registered P048. */
export async function readP049Resource(token:P049Resource):Promise<Buffer>{
 if(!p049LocalDevelopment()||!Object.hasOwn(P049_RESOURCE_PINS,token))
  throw Error('P049_RESOURCE_SCOPE');
 const row=P049_RESOURCE_PINS[token];
 if(token.startsWith('p048-')){
  const base=algL6P048FormalDescriptor(),target=base.pages[48];
  if(base.pages.length!==60||base.productBridge.registeredAnimationCount!==51||
   target.animationId!=='shared-alg001-l06-p049'||
   target.globalPageOrdinal!==49||target.rendererAvailability.kind!=='unavailable')
   throw Error('P049_PREDECESSOR_DESCRIPTOR');
  const prior=P048_RESOURCE_PINS[token.slice(5)];
  if(!prior||prior.path!==row.path||prior.originalPath!==row.originalPath||
   prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.contentType!==row.contentType||prior.root!==row.root)
   throw Error('P049_PREDECESSOR_DRIFT');
 }else if(token==='canvas-renderer.js'){
  if(row.root!=='workspace'||row.contentType!=='text/javascript; charset=utf-8')
   throw Error('P049_RESOURCE_SCOPE');
 }else{
  const own=OWN_AUDIO[token];
  if(!own||row.root!=='workspace'||row.contentType!==(own.id==='right4'?'audio/wav':'audio/mpeg')||
   row.path!==`migrations/shared-alg001-l06-p049/${own.path}`||
   row.bytes!==P049_MEASURED_BINDINGS[own.id].sourceBytes||
   row.sha256!==P049_MEASURED_BINDINGS[own.id].sourceSha256)
   throw Error('P049_RESOURCE_SCOPE');
 }
 // Own candidate resources are individually hash-bound. The document validates
 // the complete formal predecessor; streaming source-bound MP3 and WAV assets does not need
 // to reconstruct that same descriptor four more times. No hash or source
 // identity check is cached, and inherited resources retain their reader above.
 if(!token.startsWith('p048-')) {
  readPin(P049_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/TI/L6TI09.swf',bytes:251429,
   sha256:'33f90f5897fa60939fb7015f60c8789d98aad3dca65ad39cb04dac4fededb3a6'});
  readPin(P049_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
   sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'});
  if(token==='optional-spanish-audio-v1')readPin(P049_SOURCE_ROOT,{
   path:'G6-G8-shared/ALG001/L6/SA/L6TI09.mp3',bytes:111888,
   sha256:'936b059a5355877c47f2bda90da6d4de47d7145371d97ef50cd9f1e267254150'});
 }
 return readPin(row.root==='source'?P049_SOURCE_ROOT:getWorkspaceRoot(),row);
}
