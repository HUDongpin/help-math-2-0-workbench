import test from 'node:test';
import assert from 'node:assert/strict';
import {p021DocumentHeaders,p021DocumentRequest,p021ProxyDocumentRequest,P021_SOURCE_ROOT} from '../lib/alg-l06-p021-preview-policy-v1';
const env={NODE_ENV:'development',HELP_MATH_G678_SOURCE_ROOT:P021_SOURCE_ROOT,
 HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'};
const path='/en/migration-status/g678-calibration/shared-alg001-l06-p021/candidate-v1';
const headers=()=>new Headers({host:'127.0.0.1:3331'});
test('P021 document scope is exact origin, method, query and environment',()=>{
 const good=new URL('http://127.0.0.1:3331'+path);
 assert(p021DocumentRequest(good,headers(),'GET',env));
 assert(p021DocumentRequest(new URL(good+'?mode=focus'),headers(),'HEAD',env));
 for(const origin of ['http://localhost:3331','http://127.0.0.1:3332','https://127.0.0.1:3331','http://[::1]:3331'])
  assert.equal(p021DocumentRequest(new URL(origin+path),headers(),'GET',env),false);
 for(const query of ['?mode=focus&mode=focus','?autoplay=1','?mode=other','#x'])
  assert.equal(p021DocumentRequest(new URL(good+query),headers(),'GET',env),false);
 assert.equal(p021DocumentRequest(good,headers(),'POST',env),false);
 assert.equal(p021DocumentRequest(good,headers(),'GET',{...env,NODE_ENV:'production'}),false);
 assert.equal(p021DocumentRequest(good,headers(),'GET',{...env,VERCEL:'1'}),false);
});
test('P021 document headers refuse loopback aliases and forwarded scope mismatch',()=>{
 assert(p021DocumentHeaders(headers(),env));
 for(const [key,value] of [['host','localhost:3331'],['host','127.0.0.1:3332'],
  ['x-forwarded-host','localhost:3331'],['x-forwarded-proto','https'],['origin','https://example.org']]){
  const h=headers();h.set(key,value);assert.equal(p021DocumentHeaders(h,env),false,key);
 }
});

test('P021 proxy accepts Next internal localhost only with exact public Host',()=>{
 const internal=new URL('http://localhost:3331'+path);
 assert(p021ProxyDocumentRequest(internal,headers(),'GET',env));
 const alias=headers();alias.set('host','localhost:3331');
 assert.equal(p021ProxyDocumentRequest(internal,alias,'GET',env),false);
 for(const origin of ['http://localhost:3332','https://localhost:3331','http://example.org:3331'])
  assert.equal(p021ProxyDocumentRequest(new URL(origin+path),headers(),'GET',env),false);
});
