import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P050FormalDescriptor} from './alg-l06-p050-formal-admission-v1.server';
import {P050_RESOURCE_PINS} from './alg-l06-p050-local-request-v1';
import {P033_RESOURCE_PINS,type P033Resource} from './alg-l06-p033-local-request-v1';
import {P033_MEASURED_BINDINGS,type P033AudioDomain} from '../../../packages/demos/src/alg-l06-p033-measured-bindings-v1';
import {P033_SOURCE_ROOT,p033LocalDevelopment} from './alg-l06-p033-preview-policy-v1';
export async function readP033Resource(token:P033Resource):Promise<Buffer>{
 if(!p033LocalDevelopment()||!Object.hasOwn(P033_RESOURCE_PINS,token))throw Error('P033_RESOURCE_SCOPE');
 const row=P033_RESOURCE_PINS[token];
 if(token.startsWith('p050-')){
  const base=algL6P050FormalDescriptor();
  if(base.pages.length!==60||base.productBridge.registeredAnimationCount!==53||base.pages[32].animationId!=='shared-alg001-l06-p033'||base.pages[32].rendererAvailability.kind!=='unavailable')throw Error('P033_PREDECESSOR_DESCRIPTOR');
  const prior=P050_RESOURCE_PINS[token.slice(5)];
  if(!prior||!isDeepStrictEqual([prior.path,prior.originalPath,prior.bytes,prior.sha256,prior.contentType,prior.root],[row.path,row.originalPath,row.bytes,row.sha256,row.contentType,row.root]))throw Error('P033_PREDECESSOR_DRIFT');
 }else{
  readPin(P033_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/IN/L6IN05.swf',bytes:472620,sha256:'fb11fd842f3f0948cf5b00bf3b7b63bde86f0af9bf41bb2f9e3a762a1daad071'});
  readPin(P033_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'});
  if(token==='canvas-renderer.js'){
   if(row.root!=='workspace'||row.contentType!=='text/javascript; charset=utf-8')throw Error('P033_CANVAS_SCOPE');
  }else{
   const id=token==='main-source-v1'?'main':token==='optional-spanish-audio-v1'?'sa':token.match(/^feedback-(46|78|111|119|147|161|175)-source-v1$/)?.[1];
   if(!id||!Object.hasOwn(P033_MEASURED_BINDINGS,id))throw Error('P033_AUDIO_SCOPE');
   const b=P033_MEASURED_BINDINGS[id as P033AudioDomain],file=id==='sa'?'source-v1/L6IN05.mp3':`assets/source-stream-${id==='main'?190:id}.mp3`;
   if(row.root!=='workspace'||row.path!==`migrations/shared-alg001-l06-p033/${file}`||row.contentType!=='audio/mpeg'||row.bytes!==b.sourceBytes||row.sha256!==b.sourceSha256)throw Error('P033_AUDIO_BINDING');
   if(id==='sa')readPin(P033_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/SA/L6IN05.mp3',bytes:173040,sha256:'172f4d7a8f90e4e3d98487048eae702fdd4debf6706248d705f5c5dc55008220'});
  }
 }
 return readPin(row.root==='source'?P033_SOURCE_ROOT:getWorkspaceRoot(),row);
}
