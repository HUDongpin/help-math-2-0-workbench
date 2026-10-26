import 'server-only';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P046FormalDescriptor} from './alg-l06-p046-formal-admission-v1.server';
import {P046_RESOURCE_PINS} from './alg-l06-p046-local-request-v1';
import {P047_RESOURCE_PINS,type P047Resource} from './alg-l06-p047-local-request-v1';
import {P047_MEASURED_BINDINGS,type P047AudioDomain}
 from '../../../packages/demos/src/alg-l06-p047-measured-bindings-v1';
import {P047_SOURCE_ROOT,p047LocalDevelopment} from './alg-l06-p047-preview-policy-v1';

const OWN_AUDIO:Readonly<Record<string,{id:P047AudioDomain;path:string}>>=Object.freeze({
 'main-source-v1':{id:'main',path:'assets/source-stream-117-main.mp3'},
 'feedback-wrong-source-v1':{id:'wrong',path:'assets/source-stream-70-wrong.mp3'},
 'feedback-right-source-v1':{id:'right',path:'assets/source-stream-72-right.mp3'},
 'optional-spanish-audio-v1':{id:'sa',path:'source-v1/L6TI07.mp3'},
});

/** Candidate assets remain source-pinned and separate from registered P046. */
export async function readP047Resource(token:P047Resource):Promise<Buffer>{
 if(!p047LocalDevelopment()||!Object.hasOwn(P047_RESOURCE_PINS,token))
  throw Error('P047_RESOURCE_SCOPE');
 const row=P047_RESOURCE_PINS[token];
 if(token.startsWith('p046-')){
  const base=algL6P046FormalDescriptor(),target=base.pages[46];
  if(base.pages.length!==60||base.productBridge.registeredAnimationCount!==49||
   target.animationId!=='shared-alg001-l06-p047'||
   target.globalPageOrdinal!==47||target.rendererAvailability.kind!=='unavailable')
   throw Error('P047_PREDECESSOR_DESCRIPTOR');
  const prior=P046_RESOURCE_PINS[token.slice(5)];
  if(!prior||prior.path!==row.path||prior.originalPath!==row.originalPath||
   prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.contentType!==row.contentType||prior.root!==row.root)
   throw Error('P047_PREDECESSOR_DRIFT');
 }else if(token==='canvas-renderer.js'){
  if(row.root!=='workspace'||row.contentType!=='text/javascript; charset=utf-8')
   throw Error('P047_RESOURCE_SCOPE');
 }else{
  const own=OWN_AUDIO[token];
  if(!own||row.root!=='workspace'||row.contentType!=='audio/mpeg'||
   row.path!==`migrations/shared-alg001-l06-p047/${own.path}`||
   row.bytes!==P047_MEASURED_BINDINGS[own.id].sourceBytes||
   row.sha256!==P047_MEASURED_BINDINGS[own.id].sourceSha256)
   throw Error('P047_RESOURCE_SCOPE');
 }
 // Own candidate resources are individually hash-bound. The document validates
 // the complete formal predecessor; streaming four original MP3s does not need
 // to reconstruct that same descriptor four more times. No hash or source
 // identity check is cached, and inherited resources retain their reader above.
 if(!token.startsWith('p046-')) {
  readPin(P047_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/TI/L6TI07.swf',bytes:272387,
   sha256:'7fdbb16bcea020b3a28ada7d0bfbed26d077b339a914a86f493feb6827a9e893'});
  readPin(P047_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
   sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'});
  if(token==='optional-spanish-audio-v1')readPin(P047_SOURCE_ROOT,{
   path:'G6-G8-shared/ALG001/L6/SA/L6TI07.mp3',bytes:196560,
   sha256:'88e7c0f01e0569f5c8c828561669c87b4e468dbd218deca399db09bdb418448e'});
 }
 return readPin(row.root==='source'?P047_SOURCE_ROOT:getWorkspaceRoot(),row);
}
