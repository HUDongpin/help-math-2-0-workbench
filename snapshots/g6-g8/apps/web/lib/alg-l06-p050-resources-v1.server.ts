import 'server-only';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P049FormalDescriptor} from './alg-l06-p049-formal-admission-v1.server';
import {P049_RESOURCE_PINS} from './alg-l06-p049-local-request-v1';
import {P050_RESOURCE_PINS,type P050Resource} from './alg-l06-p050-local-request-v1';
import {P050_MEASURED_BINDINGS,type P050AudioDomain}
 from '../../../packages/demos/src/alg-l06-p050-measured-bindings-v1';
import {P050_SOURCE_ROOT,p050LocalDevelopment} from './alg-l06-p050-preview-policy-v1';

const OWN_AUDIO:Readonly<Record<string,{id:P050AudioDomain;path:string}>>={
  "main-source-v1": {
    "id": "main",
    "path": "assets/source-stream-489-main.mp3"
  },
  "feedback-wrong-source-v1": {
    "id": "wrong",
    "path": "assets/source-stream-380-wrong.mp3"
  },
  "feedback-correct358-source-v1": {
    "id": "correct358",
    "path": "assets/source-stream-358-correct-358.mp3"
  },
  "feedback-correct432-source-v1": {
    "id": "correct432",
    "path": "assets/source-stream-432-correct-432.wav"
  },
  "feedback-correct479-source-v1": {
    "id": "correct479",
    "path": "assets/source-stream-479-correct-479.mp3"
  },
  "optional-spanish-audio-v1": {
    "id": "sa",
    "path": "source-v1/L6GS02.mp3"
  }
};

/** Candidate assets remain source-pinned and separate from registered P049. */
export async function readP050Resource(token:P050Resource):Promise<Buffer>{
 if(!p050LocalDevelopment()||!Object.hasOwn(P050_RESOURCE_PINS,token))
  throw Error('P050_RESOURCE_SCOPE');
 const row=P050_RESOURCE_PINS[token];
 if(token.startsWith('p049-')){
  const base=algL6P049FormalDescriptor(),target=base.pages[49];
  if(base.pages.length!==60||base.productBridge.registeredAnimationCount!==52||
   target.animationId!=='shared-alg001-l06-p050'||
   target.globalPageOrdinal!==50||target.rendererAvailability.kind!=='unavailable')
   throw Error('P050_PREDECESSOR_DESCRIPTOR');
  const prior=P049_RESOURCE_PINS[token.slice(5)];
  if(!prior||prior.path!==row.path||prior.originalPath!==row.originalPath||
   prior.bytes!==row.bytes||prior.sha256!==row.sha256||
   prior.contentType!==row.contentType||prior.root!==row.root)
   throw Error('P050_PREDECESSOR_DRIFT');
 }else if(token==='canvas-renderer.js'){
  if(row.root!=='workspace'||row.contentType!=='text/javascript; charset=utf-8')
   throw Error('P050_RESOURCE_SCOPE');
 }else{
  const own=OWN_AUDIO[token];
  if(!own||row.root!=='workspace'||row.contentType!==(own.id==='correct432'?'audio/wav':'audio/mpeg')||
   row.path!==`migrations/shared-alg001-l06-p050/${own.path}`||
   row.bytes!==P050_MEASURED_BINDINGS[own.id].sourceBytes||
   row.sha256!==P050_MEASURED_BINDINGS[own.id].sourceSha256)
   throw Error('P050_RESOURCE_SCOPE');
 }
 // Own candidate resources are individually hash-bound. The document validates
 // the complete formal predecessor; streaming source-bound MP3 and WAV assets does not need
 // to reconstruct that same descriptor for each audio resource. No hash or source
 // identity check is cached, and inherited resources retain their reader above.
 if(!token.startsWith('p049-')) {
  readPin(P050_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/GS/L6GS02.swf',bytes:828730,
   sha256:'4353f9cbd7e60043baa8f59c7f5193fcd930778ace4b918ab56f2953f306937e'});
  readPin(P050_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,
   sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'});
  if(token==='optional-spanish-audio-v1')readPin(P050_SOURCE_ROOT,{
   path:'G6-G8-shared/ALG001/L6/SA/L6GS02.mp3',bytes:629664,
   sha256:'518d91f553c9ecf52f2a2eb1228a7193e1b2230a6357df382314a7d94c78583b'});
 }
 return readPin(row.root==='source'?P050_SOURCE_ROOT:getWorkspaceRoot(),row);
}
