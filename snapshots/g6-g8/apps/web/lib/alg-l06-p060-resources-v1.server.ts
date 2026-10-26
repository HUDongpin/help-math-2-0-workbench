import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {readPin} from '../../../lib/g678-admission-proof.mjs';
import {getWorkspaceRoot} from './catalog';
import {algL6P058FormalDescriptor} from './alg-l06-p058-formal-admission-v1.server';
import {P058_RESOURCE_PINS} from './alg-l06-p058-local-request-v1';
import {P060_RESOURCE_PINS,type P060Resource} from './alg-l06-p060-local-request-v1';
import {P060_AUDIO_SOURCE} from '../../../packages/demos/src/generated/alg-l06-p060-measured-v1';
import {P060_SOURCE_ROOT,p060LocalDevelopment} from './alg-l06-p060-preview-policy-v1';
export async function readP060Resource(token:P060Resource):Promise<Buffer>{
 if(!p060LocalDevelopment()||!Object.hasOwn(P060_RESOURCE_PINS,token))throw Error('P060_RESOURCE_SCOPE');
 const row=P060_RESOURCE_PINS[token];
 if(token.startsWith('p058-')){
  const base=algL6P058FormalDescriptor();
  if(base.pages.length!==60||base.productBridge.registeredAnimationCount!==57||base.pages[59].animationId!=='shared-alg001-l06-p060'||base.pages[59].rendererAvailability.kind!=='unavailable')throw Error('P060_PREDECESSOR_DESCRIPTOR');
  const prior=P058_RESOURCE_PINS[token.slice(5)];
  if(!prior||!isDeepStrictEqual([prior.path,prior.originalPath,prior.bytes,prior.sha256,prior.contentType,prior.root],[row.path,row.originalPath,row.bytes,row.sha256,row.contentType,row.root]))throw Error('P060_PREDECESSOR_DRIFT');
 }else{
  readPin(P060_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/FQ/L6FQ02.swf',bytes:48994,sha256:P060_AUDIO_SOURCE.sourceSha256});
  readPin(P060_SOURCE_ROOT,{path:'G6-G8-shared/ALG001/L6/index.xml',bytes:13926,sha256:'9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c'});
  const asset=P060_AUDIO_SOURCE.assets.find(a=>token===`quiz-${a.id.toLowerCase()}`);
  if(!asset)throw Error('P060_AUDIO_ROLE');
  const relative=`${asset.language==='en'?'EA':'SA'}/Q${asset.question}${asset.choice??''}.mp3`,b=asset.binding;
  if(row.root!=='workspace'||row.path!==`migrations/shared-alg001-l06-p060/audio-v1/${relative}`||row.contentType!=='audio/mpeg'||row.bytes!==b.sourceBytes||row.sha256!==b.sourceSha256)throw Error('P060_AUDIO_BINDING');
  readPin(P060_SOURCE_ROOT,{path:`G6-G8-shared/ALG001/L6/FQ/${relative}`,bytes:row.bytes,sha256:row.sha256});
 }
 return readPin(row.root==='source'?P060_SOURCE_ROOT:getWorkspaceRoot(),row);
}
