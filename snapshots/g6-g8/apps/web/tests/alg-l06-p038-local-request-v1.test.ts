import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {P035_RESOURCE_PINS} from '../lib/alg-l06-p035-local-request-v1';
import {P038_RESOURCE_PINS,P038_PREDECESSOR_ORIGINAL_PATHS,
 p038ResourceForRequest,p038ResourceUrl,type P038Resource}
 from '../lib/alg-l06-p038-local-request-v1';
import * as production from '../lib/alg-l06-p038-local-request.production-stub';
import {p038DocumentRequest,p038ProxyDocumentRequest}
 from '../lib/alg-l06-p038-preview-policy-v1';

const source='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const origin='http://127.0.0.1:3331';
const env={NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',
 HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',HELP_MATH_G678_SOURCE_ROOT:source};
const own=['canvas-renderer.js','main-source-v1','optional-spanish-audio-v1'] as const;
const tokens=Object.keys(P038_RESOURCE_PINS) as P038Resource[];
function request(token:P038Resource,locale:'en'|'es'='en',bridge=false){
 const row=P038_RESOURCE_PINS[token],script=row.contentType.startsWith('text/javascript');
 return {method:'GET',url:new URL(`${origin}${bridge?row.bridgePath:row.originalPath}?sha256=${row.sha256}`),
  headers:new Headers({host:'127.0.0.1:3331',
   referer:`${origin}/${locale}/migration-status/g678-calibration/shared-alg001-l06-p038/candidate-v1`,
   'sec-fetch-site':'same-origin','sec-fetch-mode':script?'no-cors':'cors',
   'sec-fetch-dest':script?'script':'empty'})};
}
test('only three new P038 resources; inherited P035 source paths remain exact',()=>{
 assert.equal(tokens.length,Object.keys(P035_RESOURCE_PINS).length+3);
 assert.deepEqual(tokens.slice(0,3),own);
 assert.deepEqual(tokens.slice(3),Object.keys(P035_RESOURCE_PINS).map(token=>`p035-${token}`));
 assert.deepEqual(P038_PREDECESSOR_ORIGINAL_PATHS,
  Object.values(P035_RESOURCE_PINS).map(row=>row.originalPath));
 for(const [token,prior] of Object.entries(P035_RESOURCE_PINS)){
  const row=P038_RESOURCE_PINS[`p035-${token}`];
  assert.deepEqual([row.originalPath,row.path,row.root,row.bytes,row.sha256,row.contentType],
   [prior.originalPath,prior.path,prior.root,prior.bytes,prior.sha256,prior.contentType]);
 }
 for(const token of own){
  const row=P038_RESOURCE_PINS[token],bytes=readFileSync(path.join(process.cwd(),row.path));
  assert.equal(bytes.length,row.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256);
  assert.equal(row.bridgePath,`/flash-assets/g678-local/shared-alg001-l06-p038/${token}`);
  assert.equal(p038ResourceUrl(token),`${row.originalPath}?sha256=${row.sha256}`);
 }
});
test('P038 source requests accept exact EN/ES page and fail closed on mismatches',()=>{
 for(const token of tokens)for(const locale of ['en','es'] as const)
  for(const bridge of [false,true]){
   const valid=request(token,locale,bridge);
   assert.equal(p038ResourceForRequest(valid,env),token);
   if(P038_RESOURCE_PINS[token].contentType.startsWith('audio/')){
    valid.method='HEAD';assert.equal(p038ResourceForRequest(valid,env),token);
   }
  }
 const token:'canvas-renderer.js'='canvas-renderer.js';
 const mutations=[
  (r:ReturnType<typeof request>)=>r.headers.set('range','bytes=0-1'),
  (r:ReturnType<typeof request>)=>r.headers.set('host','localhost:3331'),
  (r:ReturnType<typeof request>)=>r.headers.set('sec-fetch-site','cross-site'),
  (r:ReturnType<typeof request>)=>r.headers.set('sec-fetch-dest','empty'),
  (r:ReturnType<typeof request>)=>r.headers.set('referer',origin+'/es/migration-status/g678-calibration/shared-alg001-l06-p035/continuous-v1'),
  (r:ReturnType<typeof request>)=>r.url.searchParams.set('sha256','0'.repeat(64)),
  (r:ReturnType<typeof request>)=>r.url.searchParams.append('sha256',P038_RESOURCE_PINS[token].sha256),
 ];
 for(const change of mutations){const r=request(token);change(r);
  assert.equal(p038ResourceForRequest(r,env),null);}
 const head=request(token);head.method='HEAD';
 assert.equal(p038ResourceForRequest(head,env),null);
 for(const patch of [{NODE_ENV:'production'},{VERCEL:'1'},
  {HELP_MATH_G678_SOURCE_ROOT:'/tmp'},{HELP_MATH_G678_LOCAL_PREVIEW:undefined}])
  assert.equal(p038ResourceForRequest(request(token),{...env,...patch}),null);
});
test('document and production boundaries are exact',()=>{
 for(const locale of ['en','es']){
  const url=new URL(`${origin}/${locale}/migration-status/g678-calibration/shared-alg001-l06-p038/candidate-v1`);
  const headers=new Headers({host:'127.0.0.1:3331'});
  assert.equal(p038DocumentRequest(url,headers,'GET',env),true);
  assert.equal(p038DocumentRequest(url,headers,'HEAD',env),true);
  const internal=new URL(url);internal.hostname='localhost';
  assert.equal(p038ProxyDocumentRequest(internal,headers,'GET',env),true);
  assert.equal(p038DocumentRequest(internal,headers,'GET',env),false);
  url.search='?autoplay=1';assert.equal(p038DocumentRequest(url,headers,'GET',env),false);
 }
 assert.deepEqual(Object.keys(production.P038_RESOURCE_PINS),[]);
 assert.deepEqual(production.P038_PREDECESSOR_ORIGINAL_PATHS,[]);
 assert.equal(production.p038ResourceForRequest(request('canvas-renderer.js'),env),null);
 assert.equal(production.p038ResourceUrl('canvas-renderer.js'),'');
});
