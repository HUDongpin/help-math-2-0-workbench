import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P057FormalDescriptor} from './alg-l06-p057-formal-admission-v1.server';
import {P057_RESOURCE_PINS} from './alg-l06-p057-local-request-v1';
import {P058_RESOURCE_PINS,type P058Resource} from './alg-l06-p058-local-request-v1';
import {P058_MEASURED_BINDINGS,type P058AudioDomain} from '../../../packages/demos/src/alg-l06-p058-measured-bindings-v1';
import {P058_SOURCE_ROOT,p058LocalDevelopment} from './alg-l06-p058-preview-policy-v1';
export async function readP058Resource(token:P058Resource):Promise<Buffer>{
 if(!p058LocalDevelopment()||!Object.hasOwn(P058_RESOURCE_PINS,token))throw Error('P058_RESOURCE_SCOPE');
 const row=P058_RESOURCE_PINS[token];
 if(token.startsWith('p057-')){
  const base=algL6P057FormalDescriptor();
  if(base.pages.length!==60||base.productBridge.registeredAnimationCount!==56||base.pages[57].animationId!=='shared-alg001-l06-p058'||base.pages[57].rendererAvailability.kind!=='unavailable')throw Error('P058_PREDECESSOR_DESCRIPTOR');
  const prior=P057_RESOURCE_PINS[token.slice(5)];
  if(!prior||!isDeepStrictEqual([prior.path,prior.originalPath,prior.bytes,prior.sha256,prior.contentType,prior.root],[row.path,row.originalPath,row.bytes,row.sha256,row.contentType,row.root]))throw Error('P058_PREDECESSOR_DRIFT');
 }else{
  readPin(P058_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/TS/L6TS09.swf',bytes:605394,sha256:'79bd9d4896d7b297a4df928711c92f1bd2b9f78b976f8399fc9e640d9704c4d3'});
  readPin(P058_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'});
  if(token==='canvas-renderer.js'){
   if(row.root!=='workspace'||row.contentType!=='text/javascript; charset=utf-8')throw Error('P058_CANVAS_SCOPE');
  }else{
   const id=token==='main-source-v1'?'main':token==='optional-spanish-audio-v1'?'sa':token.match(/^feedback-(36|62|76|97|115|129|140)-source-v1$/)?.[1];
   if(!id||!Object.hasOwn(P058_MEASURED_BINDINGS,id))throw Error('P058_AUDIO_SCOPE');
   const b=P058_MEASURED_BINDINGS[id as P058AudioDomain],file=id==='sa'?'source-v1/L6TS09.mp3':`assets/source-stream-${id==='main'?285:id}.mp3`;
   if(row.root!=='workspace'||row.path!==`migrations/shared-alg001-l06-p058/${file}`||row.contentType!=='audio/mpeg'||row.bytes!==b.sourceBytes||row.sha256!==b.sourceSha256)throw Error('P058_AUDIO_BINDING');
   if(id==='sa')readPin(P058_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/SA/L6TS09.mp3',bytes:167328,sha256:'5e3fa2f4bfc3c534102315ec592c9547b667fb5d19198f2d653a3c9768636c7a'});
  }
 }
 return readPin(row.root==='source'?P058_SOURCE_ROOT:getWorkspaceRoot(),row);
}
