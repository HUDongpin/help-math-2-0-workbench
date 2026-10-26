import 'server-only';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P045FormalDescriptor} from './alg-l06-p045-formal-admission-v1.server';
import {P045_RESOURCE_PINS} from './alg-l06-p045-local-request-v1';
import {P046_RESOURCE_PINS,type P046Resource} from './alg-l06-p046-local-request-v1';
import {P046_MEASURED_BINDINGS,type P046AudioDomain}
 from '../../../packages/demos/src/alg-l06-p046-measured-bindings-v1';
import {P046_SOURCE_ROOT,p046LocalDevelopment} from './alg-l06-p046-preview-policy-v1';

const OWN_AUDIO:Readonly<Record<string,{id:P046AudioDomain;path:string}>>=Object.freeze({
 'main-source-v1':{id:'main',path:'assets/source-stream-123-main.mp3'},
 'feedback-wrong-source-v1':{id:'wrong',path:'assets/source-stream-61-wrong.mp3'},
 'feedback-right-source-v1':{id:'right',path:'assets/source-stream-63-right.mp3'},
 'optional-spanish-audio-v1':{id:'sa',path:'source-v1/L6TI06.mp3'},
});

/** Candidate assets remain source-pinned and separate from registered P045. */
export async function readP046Resource(token:P046Resource):Promise<Buffer>{
 if(!p046LocalDevelopment()||!Object.hasOwn(P046_RESOURCE_PINS,token))
  throw Error('P046_RESOURCE_SCOPE');
 const row=P046_RESOURCE_PINS[token];
 if(token.startsWith('p045-')){
  const base=algL6P045FormalDescriptor(),target=base.pages[45];
  if(base.pages.length!==60||base.productBridge.registeredAnimationCount!==48||
   target.animationId!=='shared-alg001-l06-p046'||
   target.globalPageOrdinal!==46||target.rendererAvailability.kind!=='unavailable')
   throw Error('P046_PREDECESSOR_DESCRIPTOR');
  const prior=P045_RESOURCE_PINS[token.slice(5)];
  if(!prior||prior.path!==row.path||prior.originalPath!==row.originalPath||
   prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.contentType!==row.contentType||prior.root!==row.root)
   throw Error('P046_PREDECESSOR_DRIFT');
 }else if(token==='canvas-renderer.js'){
  if(row.root!=='workspace'||row.contentType!=='text/javascript; charset=utf-8')
   throw Error('P046_RESOURCE_SCOPE');
 }else{
  const own=OWN_AUDIO[token];
  if(!own||row.root!=='workspace'||row.contentType!=='audio/mpeg'||
   row.path!==`migrations/shared-alg001-l06-p046/${own.path}`||
   row.bytes!==P046_MEASURED_BINDINGS[own.id].sourceBytes||
   row.sha256!==P046_MEASURED_BINDINGS[own.id].sourceSha256)
   throw Error('P046_RESOURCE_SCOPE');
 }
 // Own candidate resources are individually hash-bound. The document validates
 // the complete formal predecessor; streaming four original MP3s does not need
 // to reconstruct that same descriptor four more times. No hash or source
 // identity check is cached, and inherited resources retain their reader above.
 if(!token.startsWith('p045-')) {
  readPin(P046_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/TI/L6TI06.swf',bytes:240172,
   sha256:'c69f1f0fdaff0201af171aaee6b9b90a33b483e8c93ffef406c31cf0853a54b8'});
  readPin(P046_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
   sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'});
  if(token==='optional-spanish-audio-v1')readPin(P046_SOURCE_ROOT,{
   path:'G6-G8-shared/ALG001/L6/SA/L6TI06.mp3',bytes:350784,
   sha256:'de3c127ba68d082b9a296fb17cb31a72f477f460fde01b8e3370402bb414f18e'});
 }
 return readPin(row.root==='source'?P046_SOURCE_ROOT:getWorkspaceRoot(),row);
}
