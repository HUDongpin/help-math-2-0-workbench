import assert from 'node:assert/strict';
import test from 'node:test';
import {p050RegisteredDocumentRequest,p050RegisteredResourceForRequest,P050_REGISTERED_PATH} from '../lib/alg-l06-p050-registered-access-v1';
import {P050_RESOURCE_PINS} from '../lib/alg-l06-p050-local-request-v1';
import {P050_SOURCE_ROOT} from '../lib/alg-l06-p050-preview-policy-v1';
const env={NODE_ENV:'development',HELP_MATH_G678_SOURCE_ROOT:P050_SOURCE_ROOT,HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'};
const origin='http://127.0.0.1:3331';
test('registered view allows exact EN/ES reads and denies broadened origins, parameters and production',()=>{
 for(const locale of ['en','es']){
  const url=new URL(`${origin}/${locale}${P050_REGISTERED_PATH}?mode=focus`),headers=new Headers({host:'127.0.0.1:3331'});
  assert.equal(p050RegisteredDocumentRequest(url,headers,'GET',env),true);
  for(const method of ['POST','PUT','DELETE'])assert.equal(p050RegisteredDocumentRequest(url,headers,method,env),false);
  for(const bad of [url.href+'&mode=focus',url.href+'&foo=1',url.href.replace('127.0.0.1','localhost'),url.href.replace('p050','p048')])assert.equal(p050RegisteredDocumentRequest(new URL(bad),headers,'GET',env),false);
  for(const denied of [{...env,NODE_ENV:'production'},{...env,VERCEL:'1'},{...env,HELP_MATH_G678_SOURCE_ROOT:'/tmp'}])assert.equal(p050RegisteredDocumentRequest(url,headers,'GET',denied),false);
 }
});
test('registered source requests preserve the exact hash, inherited source identity and referer boundary',()=>{
 for(const [token,row] of Object.entries(P050_RESOURCE_PINS)){
  const script=row.contentType.startsWith('text/javascript'),headers=new Headers({host:'127.0.0.1:3331',referer:`${origin}/es${P050_REGISTERED_PATH}?mode=focus`,origin,'sec-fetch-site':'same-origin','sec-fetch-mode':'cors','sec-fetch-dest':script?'script':'empty'});
  const url=new URL(`${origin}${row.originalPath}?sha256=${row.sha256}`);
  assert.equal(p050RegisteredResourceForRequest({method:'GET',url,headers},env),token);
  const rewrite=new URL(url);rewrite.pathname=`/flash-assets/g678-local/shared-alg001-l06-p050-registered/${token}`;
  assert.equal(p050RegisteredResourceForRequest({method:'GET',url:rewrite,headers},env),token);
  for(const [field,value] of [['referer',`${origin}/en${P050_REGISTERED_PATH.replace('p050','p048')}`],['sec-fetch-site','cross-site'],['range','bytes=0-1']]){
   const bad=new Headers(headers);bad.set(field!,value!);assert.equal(p050RegisteredResourceForRequest({method:'GET',url,headers:bad},env),null);
  }
  assert.equal(p050RegisteredResourceForRequest({method:'GET',url,headers},{...env,NODE_ENV:'production'}),null);
 }
});
