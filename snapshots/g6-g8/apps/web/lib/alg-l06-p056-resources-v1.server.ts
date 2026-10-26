import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P033FormalDescriptor} from './alg-l06-p033-formal-admission-v1.server';
import {P033_RESOURCE_PINS} from './alg-l06-p033-local-request-v1';
import {P056_RESOURCE_PINS,type P056Resource} from './alg-l06-p056-local-request-v1';
import {P056_MEASURED_BINDINGS,type P056AudioDomain} from '../../../packages/demos/src/alg-l06-p056-measured-bindings-v1';
import {P056_SOURCE_ROOT,p056LocalDevelopment} from './alg-l06-p056-preview-policy-v1';
export async function readP056Resource(token:P056Resource):Promise<Buffer>{
 if(!p056LocalDevelopment()||!Object.hasOwn(P056_RESOURCE_PINS,token))throw Error('P056_RESOURCE_SCOPE');
 const row=P056_RESOURCE_PINS[token];
 if(token.startsWith('p033-')){
  const base=algL6P033FormalDescriptor();
  if(base.pages.length!==60||base.productBridge.registeredAnimationCount!==54||base.pages[55].animationId!=='shared-alg001-l06-p056'||base.pages[55].rendererAvailability.kind!=='unavailable')throw Error('P056_PREDECESSOR_DESCRIPTOR');
  const prior=P033_RESOURCE_PINS[token.slice(5)];
  if(!prior||!isDeepStrictEqual([prior.path,prior.originalPath,prior.bytes,prior.sha256,prior.contentType,prior.root],[row.path,row.originalPath,row.bytes,row.sha256,row.contentType,row.root]))throw Error('P056_PREDECESSOR_DRIFT');
 }else{
  readPin(P056_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/TS/L6TS07.swf',bytes:771707,sha256:'ba6ba691fafbc6bbd2d0a14b4d249c59e7f1569ca8aaddaa778957c6120205d1'});
  readPin(P056_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'});
  if(token==='canvas-renderer.js'){
   if(row.root!=='workspace'||row.contentType!=='text/javascript; charset=utf-8')throw Error('P056_CANVAS_SCOPE');
  }else{
   const id=token==='main-source-v1'?'main':token==='optional-spanish-audio-v1'?'sa':token.match(/^feedback-(51|83|116|124|138|149|160)-source-v1$/)?.[1];
   if(!id||!Object.hasOwn(P056_MEASURED_BINDINGS,id))throw Error('P056_AUDIO_SCOPE');
   const b=P056_MEASURED_BINDINGS[id as P056AudioDomain],file=id==='sa'?'source-v1/L6TS07.mp3':`assets/source-stream-${id==='main'?305:id}.mp3`;
   if(row.root!=='workspace'||row.path!==`migrations/shared-alg001-l06-p056/${file}`||row.contentType!=='audio/mpeg'||row.bytes!==b.sourceBytes||row.sha256!==b.sourceSha256)throw Error('P056_AUDIO_BINDING');
   if(id==='sa')readPin(P056_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/SA/L6TS07.mp3',bytes:109536,sha256:'5cc8952addd8da05969c88bee6c1f2563a968056ac787d2cd7a7070e4434ceec'});
  }
 }
 return readPin(row.root==='source'?P056_SOURCE_ROOT:getWorkspaceRoot(),row);
}
