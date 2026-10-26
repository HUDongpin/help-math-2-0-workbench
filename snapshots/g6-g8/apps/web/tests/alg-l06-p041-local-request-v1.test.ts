import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {P038_RESOURCE_PINS} from '../lib/alg-l06-p038-local-request-v1';
import {P041_RESOURCE_PINS,P041_PREDECESSOR_ORIGINAL_PATHS,
 p041ResourceForRequest,p041ResourceUrl,type P041Resource}
 from '../lib/alg-l06-p041-local-request-v1';
import {p041DocumentRequest,p041ProxyDocumentRequest}
 from '../lib/alg-l06-p041-preview-policy-v1';
import * as production from '../lib/alg-l06-p041-local-request.production-stub';

const source='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const origin='http://127.0.0.1:3331';
const env={NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',
 HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',HELP_MATH_G678_SOURCE_ROOT:source};
const own=['canvas-renderer.js','main-source-v1','optional-spanish-audio-v1',
 ...[76,91,105,119,139,152,168].map(id=>`feedback-${id}-source-v1`)];
const tokens=Object.keys(P041_RESOURCE_PINS) as P041Resource[];
function request(token:P041Resource,locale:'en'|'es'='en',bridge=false){
 const row=P041_RESOURCE_PINS[token],script=row.contentType.startsWith('text/javascript');
 return {method:'GET',url:new URL(`${origin}${bridge?row.bridgePath:row.originalPath}?sha256=${row.sha256}`),
  headers:new Headers({host:'127.0.0.1:3331',
   referer:`${origin}/${locale}/migration-status/g678-calibration/shared-alg001-l06-p041/candidate-v1`,
   'sec-fetch-site':'same-origin','sec-fetch-mode':script?'no-cors':'cors',
   'sec-fetch-dest':script?'script':'empty'})};
}
test('P041 own resources and inherited P038 bytes retain exact identity',()=>{
 assert.equal(tokens.length,Object.keys(P038_RESOURCE_PINS).length+10);
 assert.deepEqual(P041_PREDECESSOR_ORIGINAL_PATHS,
  Object.values(P038_RESOURCE_PINS).map(row=>row.originalPath));
 for(const [token,prior] of Object.entries(P038_RESOURCE_PINS)){
  const row=P041_RESOURCE_PINS[`p038-${token}`];
  assert.deepEqual([row.originalPath,row.path,row.root,row.bytes,row.sha256,row.contentType],
   [prior.originalPath,prior.path,prior.root,prior.bytes,prior.sha256,prior.contentType]);
 }
 for(const token of own){
  const row=P041_RESOURCE_PINS[token],bytes=readFileSync(path.join(process.cwd(),row.path));
  assert.equal(bytes.length,row.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256);
  assert.equal(row.bridgePath,`/flash-assets/g678-local/shared-alg001-l06-p041/${token}`);
  assert.equal(p041ResourceUrl(token),`${row.originalPath}?sha256=${row.sha256}`);
 }
});
test('P041 resources accept exact EN/ES caller and reject scope drift',()=>{
 for(const token of tokens)for(const locale of ['en','es'] as const)
  for(const bridge of [false,true]){
   const valid=request(token,locale,bridge);
   assert.equal(p041ResourceForRequest(valid,env),token);
   if(P041_RESOURCE_PINS[token].contentType.startsWith('audio/')){
    valid.method='HEAD';assert.equal(p041ResourceForRequest(valid,env),token);
   }
  }
 const token='canvas-renderer.js';
 const mutations=[
  (r:ReturnType<typeof request>)=>r.headers.set('range','bytes=0-1'),
  (r:ReturnType<typeof request>)=>r.headers.set('host','localhost:3331'),
  (r:ReturnType<typeof request>)=>r.headers.set('sec-fetch-site','cross-site'),
  (r:ReturnType<typeof request>)=>r.headers.set('sec-fetch-dest','empty'),
  (r:ReturnType<typeof request>)=>r.headers.set('referer',origin+'/en/migration-status/g678-calibration/shared-alg001-l06-p038/candidate-v1'),
  (r:ReturnType<typeof request>)=>r.url.searchParams.set('sha256','0'.repeat(64)),
  (r:ReturnType<typeof request>)=>r.url.searchParams.append('sha256',P041_RESOURCE_PINS[token].sha256),
 ];
 for(const change of mutations){const r=request(token);change(r);
  assert.equal(p041ResourceForRequest(r,env),null);}
 const head=request(token);head.method='HEAD';
 assert.equal(p041ResourceForRequest(head,env),null);
 for(const patch of [{NODE_ENV:'production'},{VERCEL:'1'},
  {HELP_MATH_G678_SOURCE_ROOT:'/tmp'},{HELP_MATH_G678_LOCAL_PREVIEW:undefined}])
  assert.equal(p041ResourceForRequest(request(token),{...env,...patch}),null);
});
test('P041 candidate document boundary is exact',()=>{
 for(const locale of ['en','es']){
  const url=new URL(`${origin}/${locale}/migration-status/g678-calibration/shared-alg001-l06-p041/candidate-v1`);
  const headers=new Headers({host:'127.0.0.1:3331'});
  assert.equal(p041DocumentRequest(url,headers,'GET',env),true);
  assert.equal(p041DocumentRequest(url,headers,'HEAD',env),true);
  const internal=new URL(url);internal.hostname='localhost';
  assert.equal(p041ProxyDocumentRequest(internal,headers,'GET',env),true);
  assert.equal(p041DocumentRequest(internal,headers,'GET',env),false);
  url.search='?autoplay=1';assert.equal(p041DocumentRequest(url,headers,'GET',env),false);
 }
 assert.deepEqual(Object.keys(production.P041_RESOURCE_PINS),[]);
 assert.deepEqual(production.P041_PREDECESSOR_ORIGINAL_PATHS,[]);
 assert.equal(production.p041ResourceForRequest(request('canvas-renderer.js'),env),null);
 assert.equal(production.p041ResourceUrl('canvas-renderer.js'),'');
});
