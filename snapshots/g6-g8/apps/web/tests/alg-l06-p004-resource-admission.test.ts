import assert from 'node:assert/strict';
import test from 'node:test';
import {isP004ResourceRequest,p004ResourceUrl,type P004Resource} from '../lib/alg-l06-p004-local-request-v1';
import {P004_PREDECESSOR_RESOURCES,p004PredecessorResourceForRequest} from '../lib/alg-l06-p004-predecessor-request-v1';
const env={NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'true',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',HELP_MATH_G678_SOURCE_ROOT:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'};
const origin='http://127.0.0.1:3331';
function request(resource:P004Resource,version='continuous-v1',locale='en'){
 return {method:'GET',url:new URL(origin+p004ResourceUrl(resource)),headers:new Headers({
  host:'127.0.0.1:3331',referer:`${origin}/${locale}/migration-status/g678-calibration/shared-alg001-l06-p004/${version}`,
  'sec-fetch-site':'same-origin','sec-fetch-mode':'cors','sec-fetch-dest':resource==='canvas'?'script':'empty',
 })};
}
test('candidate and formal P004 pages retain exact EN/ES source resource access',()=>{
 for(const resource of ['canvas','main','spanish'] as const)
  for(const version of ['candidate-v1','continuous-v1'])for(const locale of ['en','es'])
   assert.equal(isP004ResourceRequest(request(resource,version,locale),resource,env),true);
});
test('formal route addition does not admit other pages, origins, hashes or deployments',()=>{
 for(const resource of ['canvas','main','spanish'] as const){
  for(const version of ['continuous-v2','continuous-v1/extra','candidate-v2',''])
   assert.equal(isP004ResourceRequest(request(resource,version),resource,env),false);
  assert.equal(isP004ResourceRequest(request(resource,'continuous-v1','fr'),resource,env),false);
  for(const patch of [{NODE_ENV:'production'},{VERCEL:'1'},{VERCEL_ENV:'preview'},{HELP_MATH_G678_LOCAL_PREVIEW:undefined},{HELP_MATH_G678_SOURCE_ROOT:'/tmp'}])
   assert.equal(isP004ResourceRequest(request(resource),resource,{...env,...patch}),false);
  for(const [key,value] of [['referer',`${origin}/en/migration-status/g678-calibration/shared-alg001-l06-p003/continuous-v1`],['origin','http://localhost:3331'],['host','127.0.0.1:3332'],['range','bytes=0-10'],['sec-fetch-site','cross-site']]){
   const r=request(resource);r.headers.set(key!,value!);assert.equal(isP004ResourceRequest(r,resource,env),false,key);
  }
  const r=request(resource);r.url.searchParams.set('sha256','0'.repeat(64));assert.equal(isP004ResourceRequest(r,resource,env),false);
  const duplicate=request(resource);duplicate.url.search+='&extra=1';assert.equal(isP004ResourceRequest(duplicate,resource,env),false);
  const head=request(resource);head.method='HEAD';assert.equal(isP004ResourceRequest(head,resource,env),resource!=='canvas');
 }
});

test('formal Previous navigation retains exact source-bound P003 bridge access',()=>{
 for(const [kind,pin] of Object.entries(P004_PREDECESSOR_RESOURCES)){
  for(const locale of ['en','es'])for(const route of [pin.originalPath,pin.bridgePath]){
   const r=request(kind==='canvas'?'canvas':'main','continuous-v1',locale);
   r.url=new URL(`${origin}${route}?sha256=${pin.sha256}`);
   if(kind==='canvas')r.headers.set('origin',origin);
   assert.equal(p004PredecessorResourceForRequest(r,env),kind);
   r.headers.set('referer',r.headers.get('referer')!+'/extra');
   assert.equal(p004PredecessorResourceForRequest(r,env),null);
  }
 }
});
