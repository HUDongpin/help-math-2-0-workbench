import assert from 'node:assert/strict';
import test from 'node:test';
import {isP008ResourceRequest,P008_RESOURCE_PINS} from '../lib/alg-l06-p008-local-request-v1';
import {P008_PREDECESSOR_RESOURCES,p008PredecessorResourceForRequest} from '../lib/alg-l06-p008-predecessor-request-v1';
const env={NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',HELP_MATH_G678_SOURCE_ROOT:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'};
const origin='http://127.0.0.1:3331';
test('formal EN/ES resource access retains exact document and production denial',()=>{
 for(const locale of ['en','es'])for(const [kind,pin] of Object.entries(P008_RESOURCE_PINS)){
  const resource=kind as keyof typeof P008_RESOURCE_PINS;
  const headers=new Headers({host:'127.0.0.1:3331',referer:`${origin}/${locale}/migration-status/g678-calibration/shared-alg001-l06-p008/continuous-v1`,'sec-fetch-site':'same-origin','sec-fetch-mode':'cors','sec-fetch-dest':kind==='canvas'?'script':'empty'});
  const request={method:'GET',url:new URL(`${origin}${pin.path}?sha256=${pin.sha256}`),headers};
  assert.equal(isP008ResourceRequest(request,resource,env),true);
  assert.equal(isP008ResourceRequest(request,resource,{...env,NODE_ENV:'production'}),false);
  headers.set('referer',headers.get('referer')+'?autoplay=1');assert.equal(isP008ResourceRequest(request,resource,env),false);
 }
 for(const locale of ['en','es'])for(const [kind,pin] of Object.entries(P008_PREDECESSOR_RESOURCES))for(const path of [pin.originalPath,pin.bridgePath]){
  const headers=new Headers({host:'127.0.0.1:3331',origin,referer:`${origin}/${locale}/migration-status/g678-calibration/shared-alg001-l06-p008/continuous-v1`,'sec-fetch-site':'same-origin','sec-fetch-mode':'cors','sec-fetch-dest':kind.endsWith('Canvas')?'script':'empty'});
  const request={method:'GET',url:new URL(`${origin}${path}?sha256=${pin.sha256}`),headers};
  assert.equal(p008PredecessorResourceForRequest(request,env),kind);
  assert.equal(p008PredecessorResourceForRequest(request,{...env,NODE_ENV:'production'}),null);
  headers.set('referer',headers.get('referer')+'?autoplay=1');assert.equal(p008PredecessorResourceForRequest(request,env),null);
 }
});
