import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P056FormalDescriptor} from './alg-l06-p056-formal-admission-v1.server';
import {P056_RESOURCE_PINS} from './alg-l06-p056-local-request-v1';
import {P057_RESOURCE_PINS,type P057Resource} from './alg-l06-p057-local-request-v1';
import {P057_MEASURED_BINDINGS,type P057AudioDomain} from '../../../packages/demos/src/alg-l06-p057-measured-bindings-v1';
import {P057_SOURCE_ROOT,p057LocalDevelopment} from './alg-l06-p057-preview-policy-v1';
export async function readP057Resource(token:P057Resource):Promise<Buffer>{
 if(!p057LocalDevelopment()||!Object.hasOwn(P057_RESOURCE_PINS,token))throw Error('P057_RESOURCE_SCOPE');
 const row=P057_RESOURCE_PINS[token];
 if(token.startsWith('p056-')){
  const base=algL6P056FormalDescriptor();
  if(base.pages.length!==60||base.productBridge.registeredAnimationCount!==55||base.pages[56].animationId!=='shared-alg001-l06-p057'||base.pages[56].rendererAvailability.kind!=='unavailable')throw Error('P057_PREDECESSOR_DESCRIPTOR');
  const prior=P056_RESOURCE_PINS[token.slice(5)];
  if(!prior||!isDeepStrictEqual([prior.path,prior.originalPath,prior.bytes,prior.sha256,prior.contentType,prior.root],[row.path,row.originalPath,row.bytes,row.sha256,row.contentType,row.root]))throw Error('P057_PREDECESSOR_DRIFT');
 }else{
  readPin(P057_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/TS/L6TS08.swf',bytes:937900,sha256:'03782ef6ed4587d61db4476648d0d69b5ad158f84b2f6a0ba747605a6712fb31'});
  readPin(P057_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'});
  if(token==='canvas-renderer.js'){
   if(row.root!=='workspace'||row.contentType!=='text/javascript; charset=utf-8')throw Error('P057_CANVAS_SCOPE');
  }else{
   const id=token==='main-source-v1'?'main':token==='optional-spanish-audio-v1'?'sa':token.match(/^feedback-(52|77|93|105|117|129|157)-source-v1$/)?.[1];
   if(!id||!Object.hasOwn(P057_MEASURED_BINDINGS,id))throw Error('P057_AUDIO_SCOPE');
   const b=P057_MEASURED_BINDINGS[id as P057AudioDomain],file=id==='sa'?'source-v1/L6TS08.mp3':`assets/source-stream-${id==='main'?312:id}.${id==='105'?'wav':'mp3'}`;
   if(row.root!=='workspace'||row.path!==`migrations/shared-alg001-l06-p057/${file}`||row.contentType!==(id==='105'?'audio/wav':'audio/mpeg')||row.bytes!==b.sourceBytes||row.sha256!==b.sourceSha256)throw Error('P057_AUDIO_BINDING');
   if(id==='sa')readPin(P057_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/SA/L6TS08.mp3',bytes:58800,sha256:'2310e2c254f8acd45c47637176cd44b35ef3616cfa5a929cc182df628927ed0a'});
  }
 }
 return readPin(row.root==='source'?P057_SOURCE_ROOT:getWorkspaceRoot(),row);
}
