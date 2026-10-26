import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {P041_RESOURCE_PINS} from '../lib/alg-l06-p041-local-request-v1';
import {P042_RESOURCE_PINS,P042_PREDECESSOR_ORIGINAL_PATHS,
 p042ResourceForRequest,p042ResourceUrl,type P042Resource}
 from '../lib/alg-l06-p042-local-request-v1';
import {p042DocumentRequest,p042ProxyDocumentRequest}
 from '../lib/alg-l06-p042-preview-policy-v1';
import * as production from '../lib/alg-l06-p042-local-request.production-stub';

const source='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const origin='http://127.0.0.1:3331';
const env={NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',
 HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',HELP_MATH_G678_SOURCE_ROOT:source};
const own=['canvas-renderer.js','main-source-v1','feedback-wrong4-source-v1',
 'feedback-right4-source-v1','optional-spanish-audio-v1'];
const tokens=Object.keys(P042_RESOURCE_PINS) as P042Resource[];
function request(token:P042Resource,locale:'en'|'es'='en',bridge=false){
 const row=P042_RESOURCE_PINS[token],script=row.contentType.startsWith('text/javascript');
 return {method:'GET',url:new URL(`${origin}${bridge?row.bridgePath:row.originalPath}?sha256=${row.sha256}`),
  headers:new Headers({host:'127.0.0.1:3331',
   referer:`${origin}/${locale}/migration-status/g678-calibration/shared-alg001-l06-p042/candidate-v1`,
   'sec-fetch-site':'same-origin','sec-fetch-mode':script?'no-cors':'cors',
   'sec-fetch-dest':script?'script':'empty'})};
}
test('P042 own resources and inherited P041 bytes retain exact identity',()=>{
 assert.equal(tokens.length,Object.keys(P041_RESOURCE_PINS).length+5);
 assert.deepEqual(P042_PREDECESSOR_ORIGINAL_PATHS,
  Object.values(P041_RESOURCE_PINS).map(row=>row.originalPath));
 for(const [token,prior] of Object.entries(P041_RESOURCE_PINS)){
  const row=P042_RESOURCE_PINS[`p041-${token}`];
  assert.deepEqual([row.originalPath,row.path,row.root,row.bytes,row.sha256,row.contentType],
   [prior.originalPath,prior.path,prior.root,prior.bytes,prior.sha256,prior.contentType]);
 }
 for(const token of own){
  const row=P042_RESOURCE_PINS[token],bytes=readFileSync(path.join(process.cwd(),row.path));
  assert.equal(bytes.length,row.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256);
  assert.equal(row.bridgePath,`/flash-assets/g678-local/shared-alg001-l06-p042/${token}`);
  assert.equal(p042ResourceUrl(token),`${row.originalPath}?sha256=${row.sha256}`);
 }
});
test('P042 resources accept exact EN/ES caller and reject scope drift',()=>{
 for(const token of tokens)for(const locale of ['en','es'] as const)
  for(const bridge of [false,true]){
   const valid=request(token,locale,bridge);
   assert.equal(p042ResourceForRequest(valid,env),token);
   if(P042_RESOURCE_PINS[token].contentType.startsWith('audio/')){
    valid.method='HEAD';assert.equal(p042ResourceForRequest(valid,env),token);
   }
  }
 const token='canvas-renderer.js';
 const mutations=[
  (r:ReturnType<typeof request>)=>r.headers.set('range','bytes=0-1'),
  (r:ReturnType<typeof request>)=>r.headers.set('host','localhost:3331'),
  (r:ReturnType<typeof request>)=>r.headers.set('sec-fetch-site','cross-site'),
  (r:ReturnType<typeof request>)=>r.headers.set('sec-fetch-dest','empty'),
  (r:ReturnType<typeof request>)=>r.headers.set('referer',origin+'/en/migration-status/g678-calibration/shared-alg001-l06-p041/candidate-v1'),
  (r:ReturnType<typeof request>)=>r.url.searchParams.set('sha256','0'.repeat(64)),
  (r:ReturnType<typeof request>)=>r.url.searchParams.append('sha256',P042_RESOURCE_PINS[token].sha256),
 ];
 for(const change of mutations){const r=request(token);change(r);
  assert.equal(p042ResourceForRequest(r,env),null);}
 const head=request(token);head.method='HEAD';
 assert.equal(p042ResourceForRequest(head,env),null);
 for(const patch of [{NODE_ENV:'production'},{VERCEL:'1'},
  {HELP_MATH_G678_SOURCE_ROOT:'/tmp'},{HELP_MATH_G678_LOCAL_PREVIEW:undefined}])
  assert.equal(p042ResourceForRequest(request(token),{...env,...patch}),null);
});
test('P042 candidate document boundary is exact and Production has no resources',()=>{
 for(const locale of ['en','es']){
  const url=new URL(`${origin}/${locale}/migration-status/g678-calibration/shared-alg001-l06-p042/candidate-v1`);
  const headers=new Headers({host:'127.0.0.1:3331'});
  assert.equal(p042DocumentRequest(url,headers,'GET',env),true);
  assert.equal(p042DocumentRequest(url,headers,'HEAD',env),true);
  const internal=new URL(url);internal.hostname='localhost';
  assert.equal(p042ProxyDocumentRequest(internal,headers,'GET',env),true);
  assert.equal(p042DocumentRequest(internal,headers,'GET',env),false);
  url.search='?autoplay=1';assert.equal(p042DocumentRequest(url,headers,'GET',env),false);
 }
 assert.deepEqual(Object.keys(production.P042_RESOURCE_PINS),[]);
 assert.deepEqual(production.P042_PREDECESSOR_ORIGINAL_PATHS,[]);
 assert.equal(production.p042ResourceForRequest(),null);
 assert.equal(production.p042ResourceUrl(),'');
});
