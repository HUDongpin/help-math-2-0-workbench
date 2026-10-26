import test from 'node:test';
import assert from 'node:assert/strict';
import {p023DocumentHeaders,p023DocumentRequest,p023ProxyDocumentRequest,P023_SOURCE_ROOT} from '../lib/alg-l06-p023-preview-policy-v1';
const env={NODE_ENV:'development',HELP_MATH_G678_SOURCE_ROOT:P023_SOURCE_ROOT,
 HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'};
const path='/en/migration-status/g678-calibration/shared-alg001-l06-p023/candidate-v1';
const headers=()=>new Headers({host:'127.0.0.1:3331'});
test('P023 document scope is exact origin, method, query and environment',()=>{
 const good=new URL('http://127.0.0.1:3331'+path);
 assert(p023DocumentRequest(good,headers(),'GET',env));
 for(const locale of ['en','es'])assert(p023DocumentRequest(new URL(`http://127.0.0.1:3331/${locale}/migration-status/g678-calibration/shared-alg001-l06-p023/continuous-v1`),headers(),'GET',env));
 assert.equal(p023DocumentRequest(new URL(good.href.replace('candidate-v1','continuous-v2')),headers(),'GET',env),false);
 assert(p023DocumentRequest(new URL(good+'?mode=focus'),headers(),'HEAD',env));
 for(const origin of ['http://localhost:3331','http://127.0.0.1:3332','https://127.0.0.1:3331','http://[::1]:3331'])
  assert.equal(p023DocumentRequest(new URL(origin+path),headers(),'GET',env),false);
 for(const query of ['?mode=focus&mode=focus','?autoplay=1','?mode=other','#x'])
  assert.equal(p023DocumentRequest(new URL(good+query),headers(),'GET',env),false);
 assert.equal(p023DocumentRequest(good,headers(),'POST',env),false);
 assert.equal(p023DocumentRequest(good,headers(),'GET',{...env,NODE_ENV:'production'}),false);
 assert.equal(p023DocumentRequest(good,headers(),'GET',{...env,VERCEL:'1'}),false);
});
test('P023 document headers refuse loopback aliases and forwarded scope mismatch',()=>{
 assert(p023DocumentHeaders(headers(),env));
 for(const [key,value] of [['host','localhost:3331'],['host','127.0.0.1:3332'],
  ['x-forwarded-host','localhost:3331'],['x-forwarded-proto','https'],['origin','https://example.org']]){
  const h=headers();h.set(key,value);assert.equal(p023DocumentHeaders(h,env),false,key);
 }
});

test('P023 proxy accepts Next internal localhost only with exact public Host',()=>{
 const internal=new URL('http://localhost:3331'+path);
 assert(p023ProxyDocumentRequest(internal,headers(),'GET',env));
 const alias=headers();alias.set('host','localhost:3331');
 assert.equal(p023ProxyDocumentRequest(internal,alias,'GET',env),false);
 for(const origin of ['http://localhost:3332','https://localhost:3331','http://example.org:3331'])
  assert.equal(p023ProxyDocumentRequest(new URL(origin+path),headers(),'GET',env),false);
});
