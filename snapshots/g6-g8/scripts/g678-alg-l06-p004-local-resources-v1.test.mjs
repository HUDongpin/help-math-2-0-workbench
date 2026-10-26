import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {algL6P004CandidateDescriptor} from '../apps/web/lib/alg-l06-p004-candidate-v1.server.ts';
import {readP004Resource} from '../apps/web/lib/alg-l06-p004-resources-v1.server.ts';
import {isP004ResourceRequest,p004ResourceUrl,P004_RESOURCE_PINS} from '../apps/web/lib/alg-l06-p004-local-request-v1.ts';

const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ENV={NODE_ENV:'development',HELP_MATH_G678_SOURCE_ROOT:SOURCE_ROOT,
 HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'};
Object.assign(process.env,ENV);delete process.env.VERCEL;delete process.env.VERCEL_ENV;
const base='http://127.0.0.1:3331';
const page=`${base}/en/migration-status/g678-calibration/shared-alg001-l06-p004/candidate-v1`;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function request(resource,overrides={}){
 const pin=P004_RESOURCE_PINS[resource];
 const headers=new Headers({'host':'127.0.0.1:3331','referer':page,
  'sec-fetch-site':'same-origin','sec-fetch-mode':resource==='canvas'?'no-cors':'cors',
  'sec-fetch-dest':resource==='canvas'?'script':'empty',...overrides.headers});
 return new Request(overrides.url??new URL(p004ResourceUrl(resource),base),
  {method:overrides.method??'GET',headers});
}
const guard=(request,resource,env=ENV)=>isP004ResourceRequest(
 {method:request.method,url:new URL(request.url),headers:request.headers},resource,env);

test('actual P003 formal predecessor projects one unregistered P004 and five distinct new terms',()=>{
 const d=algL6P004CandidateDescriptor();
 assert.equal(d.pages.length,60);assert.equal(d.productBridge.registeredAnimationCount,21);
 assert.equal(d.pages[2].rendererAvailability.kind,'registered');
 assert.deepEqual(d.pages[3].rendererAvailability.runtimeQuery,
  {frameDomain:'sprite-95',language:'fixed-en',scenario:'source-static-frame',seed:'0'});
 assert.equal(d.glossary.length,24);
 assert.equal(d.glossary.filter(e=>e.id==='function').length,1);
 assert.equal(d.glossary.filter(e=>e.id==='output').length,1);
 assert(Object.values(d.productBridge.acceptanceEffects).every(value=>value===false));
 assert.equal(d.p004CandidateDisclosure.actualRegisteredLessonPages,20);
 assert.equal(d.p004CandidateDisclosure.officialRegisteredCount,497);
});

test('all three exact physical resources are hash bound to the real predecessor and source',()=>{
 for(const resource of ['canvas','main','spanish']){
  const pin=P004_RESOURCE_PINS[resource];
  const bytes=readP004Resource(resource);
  assert.equal(bytes.length,pin.bytes);assert.equal(sha(bytes),pin.sha256);
  assert(guard(request(resource),resource));
  if(resource!=='canvas')assert(guard(request(resource,{method:'HEAD'}),resource));
 }
});

test('request boundary rejects wrong route, hash, method, origin, referer and forwarded identity',()=>{
 for(const resource of ['canvas','main','spanish']){
  assert(guard(request(resource),resource));
  assert(!guard(request(resource,{url:`${base}${P004_RESOURCE_PINS[resource].path}?sha256=${'0'.repeat(64)}`}),resource));
  assert(!guard(request(resource,{url:`${base}${p004ResourceUrl(resource)}&frame=1`}),resource));
  assert(!guard(request(resource,{url:`${base}${P004_RESOURCE_PINS[resource].path}%2F?sha256=${P004_RESOURCE_PINS[resource].sha256}`}),resource));
  assert(!guard(request(resource,{method:'POST'}),resource));
  assert(!guard(request(resource,{headers:{range:'bytes=0-1'}}),resource));
  assert(!guard(request(resource,{headers:{host:'localhost:3331'}}),resource));
  assert(!guard(request(resource,{headers:{'x-forwarded-host':'other:3331'}}),resource));
  assert(!guard(request(resource,{headers:{origin:'http://other:3331'}}),resource));
  assert(!guard(request(resource,{headers:{referer:page.replace('/en/','/fr/')}}),resource));
  assert(!guard(request(resource,{headers:{referer:page.replace('p004','p003')}}),resource));
  assert(!guard(request(resource),resource,{...ENV,NODE_ENV:'production'}));
  assert(!guard(request(resource),resource,{...ENV,VERCEL:'1'}));
  assert(!guard(request(resource),resource,{...ENV,HELP_MATH_G678_SOURCE_ROOT:'/tmp'}));
 }
 assert(!guard(request('canvas',{method:'HEAD'}),'canvas'));
 assert(!guard(request('main',{url:`${base}${p004ResourceUrl('canvas')}` }),'main'));
});
