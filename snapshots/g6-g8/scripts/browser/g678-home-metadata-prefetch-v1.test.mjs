import assert from 'node:assert/strict';
import test from 'node:test';
import {EventEmitter} from 'node:events';
import {classifyHomeMetadataFailure,observeHomeMetadataFailures} from './g678-home-metadata-prefetch-v1.mjs';

const origin='http://127.0.0.1:3331',course=origin+'/en/migration-status/g678-course/nms002/7',url=origin+'/?_rsc=example';
const binding={origin,expectedCourseUrl:course};
function example(){return {capturedAtRequest:true,closing:false,metadataErrors:[],errorText:'net::ERR_ABORTED',failurePageUrl:course,responseCount:1,
 request:{url,method:'GET',resourceType:'fetch',isNavigationRequest:false,mainFrame:true,pageUrl:course,frameUrl:course,redirectedFrom:null,redirectedTo:null,
  headers:{rsc:'1','next-router-prefetch':'1','next-router-state-tree':encodeURIComponent('["",{},null,"metadata-only"]'),'next-url':'/en/migration-status/g678-course/nms002/7',referer:course}},
 response:{url,status:200,headers:{'content-type':'text/x-component; charset=utf-8','x-nextjs-rewritten-path':'/en','x-middleware-rewrite':'http://localhost:3331/en?_rsc=example'}}};}
const accepted=row=>classifyHomeMetadataFailure(row,binding).classification==='non-required-home-metadata-observed-err-aborted';
test('exact observed-shaped request is ancillary with unknown cause, not per-run CDP proof',()=>{
 const result=classifyHomeMetadataFailure(example(),binding);assert.equal(result.classification,'non-required-home-metadata-observed-err-aborted');assert.equal(result.cdpCanceledConfirmed,false);assert.match(result.reason,/cause unknown/);
});
const negatives={
 'no response':r=>{r.response=null;r.responseCount=0;},
 'HTTP500':r=>r.response.status=500,
 'no content type':r=>delete r.response.headers['content-type'],
 'not RSC':r=>r.response.headers['content-type']='text/html',
 'different response URL':r=>r.response.url=origin+'/?_rsc=other',
 'response observed twice':r=>r.responseCount=2,
 'navigation':r=>r.request.isNavigationRequest=true,
 'navigation missing':r=>delete r.request.isNavigationRequest,
 'audio':r=>r.request.resourceType='media',
 'source data':r=>{r.request.url=origin+'/flash-assets/g678-local/shared-nms002-l07-p005/hfr/data.json';r.response.url=r.request.url;},
 'POST':r=>r.request.method='POST',
 'other failure':r=>r.errorText='net::ERR_CONNECTION_RESET',
 'cleanup':r=>r.closing=true,
 'metadata exception':r=>r.metadataErrors.push('actual metadata read failed'),
 'no request-start observation':r=>r.capturedAtRequest=false,
 'truthy request-start field':r=>r.capturedAtRequest='true',
 'wrong current document':r=>r.failurePageUrl=origin+'/en/migration-status/g678-course/nms002/8',
 'wrong frame document':r=>r.request.frameUrl=origin+'/',
 'wrong next-url':r=>r.request.headers['next-url']='/en/migration-status/g678-course/nms002/8',
 'wrong referer':r=>r.request.headers.referer=origin+'/',
 'missing RSC':r=>delete r.request.headers.rsc,
 'missing prefetch':r=>delete r.request.headers['next-router-prefetch'],
 'tree only contains substring':r=>r.request.headers['next-router-state-tree']=encodeURIComponent('["x",{},null,"metadata-only"]'),
 'tree has extra child':r=>r.request.headers['next-router-state-tree']=encodeURIComponent('["",{"children":[]},null,"metadata-only"]'),
 'tree double encoded':r=>r.request.headers['next-router-state-tree']=encodeURIComponent(r.request.headers['next-router-state-tree']),
 'tree malformed encoding':r=>r.request.headers['next-router-state-tree']='%bad%',
 'additional query':r=>r.request.url+='&course=7',
 'duplicate query':r=>r.request.url+='&_rsc=second',
 'empty query':r=>r.request.url=origin+'/?_rsc=',
 'URL credentials':r=>r.request.url='http://name:secret@127.0.0.1:3331/?_rsc=example',
 'URL fragment':r=>r.request.url+='#fragment',
 'redirect from':r=>r.request.redirectedFrom=origin+'/old',
 'redirect to':r=>r.request.redirectedTo=origin+'/new',
 'redirect unknown':r=>delete r.request.redirectedFrom,
 'rewrite external':r=>r.response.headers['x-middleware-rewrite']='http://other.test:3331/en?_rsc=example',
 'rewrite wrong port':r=>r.response.headers['x-middleware-rewrite']='http://localhost:3332/en?_rsc=example',
 'rewrite course':r=>{r.response.headers['x-nextjs-rewritten-path']='/en/migration-status/g678-course/nms002/7';r.response.headers['x-middleware-rewrite']='http://localhost:3331/en/migration-status/g678-course/nms002/7?_rsc=example';},
 'rewrite resource':r=>r.response.headers['x-middleware-rewrite']='http://localhost:3331/flash-assets/g678-local/data.json?_rsc=example',
 'rewrite disagreement':r=>r.response.headers['x-middleware-rewrite']='http://localhost:3331/es?_rsc=example',
 'rewrite credentials':r=>r.response.headers['x-middleware-rewrite']='http://name:secret@localhost:3331/en?_rsc=example',
 'rewrite fragment':r=>r.response.headers['x-middleware-rewrite']+='#fragment',
 'rewrite extra query':r=>r.response.headers['x-middleware-rewrite']+='&resource=source',
 'rewrite changed RSC':r=>r.response.headers['x-middleware-rewrite']='http://localhost:3331/en?_rsc=other',
};
for(const [name,mutate]of Object.entries(negatives))test('blocker: '+name,()=>{const r=example();mutate(r);assert.equal(accepted(r),false);});

function fixture(){
 const page=new EventEmitter(),frame={url:()=>course},errors=[];let closed=false,phase='warmup';Object.assign(page,{url:()=>course,mainFrame:()=>frame,isClosed:()=>closed});
 const observer=observeHomeMetadataFailures({page,...binding,networkErrors:errors,phase:()=>phase});
 const request=()=>{const r=example().request;return {url:()=>r.url,method:()=>r.method,resourceType:()=>r.resourceType,isNavigationRequest:()=>r.isNavigationRequest,frame:()=>frame,headers:()=>({...r.headers,cookie:'fixture-sensitive-value'}),redirectedFrom:()=>null,redirectedTo:()=>null,failure:()=>({errorText:'net::ERR_ABORTED'})};};
 const response=request=>({request:()=>request,url:()=>url,status:()=>200,headers:()=>({...example().response.headers,'set-cookie':'fixture-sensitive-value'})});
 return {page,errors,observer,request,response,phase:value=>{phase=value;},close:()=>{closed=true;}};
}
test('concurrent same URL successful Request cannot lend its response to failed Request',()=>{
 const f=fixture(),a=f.request(),b=f.request();f.page.emit('request',a);f.page.emit('request',b);f.page.emit('response',f.response(b));f.page.emit('requestfailed',a);
 assert.equal(f.errors.length,1);assert.equal(f.observer.snapshot().diagnostics.length,0);
 f.page.emit('response',f.response(a));assert.equal(f.errors.length,1,'late response cannot retrospectively promote recorded failure');
 f.page.emit('requestfailed',b);assert.equal(f.observer.snapshot().diagnostics.length,1);assert.equal(f.observer.snapshot().failures.length,2);f.close();assert.equal(f.observer.finish().observationComplete,true);
});
test('callbacks are synchronous and preserve original failure without sensitive headers',()=>{
 const f=fixture(),r=f.request();f.page.emit('request',r);f.page.emit('response',f.response(r));f.page.emit('requestfailed',r);
 const s=f.observer.snapshot();assert.equal(s.failures.length,1);assert.equal(s.diagnostics.length,1);assert.deepEqual(s.failures[0].failure,{errorText:'net::ERR_ABORTED'});assert(!JSON.stringify(s).includes('fixture-sensitive-value'));assert.equal(f.errors.length,0);f.close();f.observer.finish();
});
test('metadata read throws remains immediate blocker',()=>{
 const f=fixture(),r=f.request();r.headers=()=>{throw Error('headers unavailable');};f.page.emit('request',r);f.page.emit('response',f.response(r));f.page.emit('requestfailed',r);assert.equal(f.errors.length,1);assert.equal(f.observer.snapshot().diagnostics.length,0);f.close();f.observer.finish();
});
test('failure arriving after warmup snapshot is retained in final ledger and required error sink',()=>{
 const f=fixture(),r=f.request();f.page.emit('request',r);const before=f.observer.snapshot();assert.equal(before.failures.length,0);f.phase('normal-entry');f.page.emit('requestfailed',r);assert.equal(f.errors.length,1);f.close();const end=f.observer.finish();assert.equal(end.failures.length,1);assert.equal(end.failures[0].startedPhase,'warmup');assert.equal(end.failures[0].failedPhase,'normal-entry');
});
test('cleanup failure cannot qualify, and finish removes listeners only after close',()=>{
 const f=fixture(),r=f.request();f.page.emit('request',r);f.page.emit('response',f.response(r));f.observer.beginClose();f.page.emit('requestfailed',r);assert.equal(f.errors.length,1);f.close();assert.equal(f.observer.finish().observationComplete,true);assert.equal(f.page.listenerCount('requestfailed'),0);
});
test('ending observation with open page is explicitly incomplete and blocking',()=>{
 const f=fixture();assert.equal(f.observer.finish().observationComplete,false);assert.equal(f.errors.at(-1).error,'NETWORK_OBSERVATION_ENDED_WITH_OPEN_PAGE');
});

const esCourse=origin+'/es/migration-status/g678-course/nms002/7';
const esBinding={origin,expectedCourseUrl:esCourse};
function esExample(){const r=example();Object.assign(r,{failurePageUrl:esCourse});Object.assign(r.request,{url:origin+'/es?_rsc=example',pageUrl:esCourse,frameUrl:esCourse});Object.assign(r.request.headers,{'next-url':'/es/migration-status/g678-course/nms002/7',referer:esCourse});r.response.url=r.request.url;delete r.response.headers['x-nextjs-rewritten-path'];delete r.response.headers['x-middleware-rewrite'];return r;}
const esAccepted=row=>classifyHomeMetadataFailure(row,esBinding).classification==='non-required-home-metadata-observed-err-aborted';
test('calibrated ES /es response with both rewrite keys absent is ancillary',()=>{assert.equal(esAccepted(esExample()),true);});
for(const [name,mutate]of Object.entries(negatives))test('ES retains shared blocker: '+name,()=>{const r=esExample();mutate(r);assert.equal(esAccepted(r),false);});
for(const value of ['',undefined,null,'/es','http://localhost:3331/es?_rsc=example'])for(const header of ['x-nextjs-rewritten-path','x-middleware-rewrite'])test('ES present rewrite key stays blocked: '+header+'='+String(value),()=>{const r=esExample();r.response.headers[header]=value;assert.equal(esAccepted(r),false);});
for(const wrong of ['/','/en','/es/','/fr','/es/migration-status/g678-course/nms002/7'])test('ES rejects uncalibrated path '+wrong,()=>{const r=esExample();r.request.url=origin+wrong+'?_rsc=example';r.response.url=r.request.url;assert.equal(esAccepted(r),false);});
for(const wrong of ['/en','/es','/en/'])test('EN still rejects alternate direct home '+wrong,()=>{const r=example();r.request.url=origin+wrong+'?_rsc=example';r.response.url=r.request.url;assert.equal(accepted(r),false);});
test('EN still requires both valid rewrite headers',()=>{for(const header of ['x-nextjs-rewritten-path','x-middleware-rewrite']){const r=example();delete r.response.headers[header];assert.equal(accepted(r),false);}});
test('locale branch cannot borrow the other course binding',()=>{assert.equal(accepted(esExample()),false);assert.equal(esAccepted(example()),false);});
test('ES exact real Request association succeeds without introducing a response/headers fallback',()=>{
 const row=esExample(),page=new EventEmitter(),frame={url:()=>esCourse},errors=[];let closed=false;Object.assign(page,{url:()=>esCourse,mainFrame:()=>frame,isClosed:()=>closed});
 const observer=observeHomeMetadataFailures({page,...esBinding,networkErrors:errors});
 const request={url:()=>row.request.url,method:()=>row.request.method,resourceType:()=>row.request.resourceType,isNavigationRequest:()=>false,frame:()=>frame,headers:()=>row.request.headers,redirectedFrom:()=>null,redirectedTo:()=>null,failure:()=>({errorText:'net::ERR_ABORTED'})};
 page.emit('request',request);page.emit('response',{request:()=>request,url:()=>row.response.url,status:()=>200,headers:()=>row.response.headers});page.emit('requestfailed',request);assert.equal(errors.length,0);assert.equal(observer.snapshot().diagnostics.length,1);closed=true;observer.finish();
});

function routeTree(row=example()){delete row.request.headers['next-router-state-tree'];row.request.headers['next-router-segment-prefetch']='/_tree';return row;}
for(const [locale,build,scope]of [['en',example,binding],['es',esExample,esBinding]]){
 test(locale+': exact route-tree and metadata-only protocol variants remain distinct',()=>{
  for(const [variant,row]of [['route-tree',routeTree(build())],['metadata-only',build()]]){const r=classifyHomeMetadataFailure(row,scope);assert.equal(r.classification,'non-required-home-metadata-observed-err-aborted');assert.equal(r.protocolVariant,variant);assert.equal(r.cdpCanceledConfirmed,false);}
 });
 for(const [name,mutate]of Object.entries(negatives))test(locale+' route-tree retains blocker: '+name,()=>{const row=routeTree(build());mutate(row);assert.equal(classifyHomeMetadataFailure(row,scope).classification,'required-or-unclassified-network-failure');});
 for(const [name,mutate]of [
  ['both headers',row=>row.request.headers['next-router-segment-prefetch']='/_tree'],
  ['neither header',row=>delete row.request.headers['next-router-state-tree']],
  ['other segment',row=>{delete row.request.headers['next-router-state-tree'];row.request.headers['next-router-segment-prefetch']='/children';}],
  ['segment suffix',row=>{delete row.request.headers['next-router-state-tree'];row.request.headers['next-router-segment-prefetch']='/_tree/';}],
  ['segment whitespace',row=>{delete row.request.headers['next-router-state-tree'];row.request.headers['next-router-segment-prefetch']=' /_tree';}],
  ['segment encoded',row=>{delete row.request.headers['next-router-state-tree'];row.request.headers['next-router-segment-prefetch']='%2F_tree';}],
 ])test(locale+': protocol rejects '+name,()=>{const row=build();mutate(row);assert.equal(classifyHomeMetadataFailure(row,scope).classification,'required-or-unclassified-network-failure');});
 for(const value of ['',undefined,null]){
  test(locale+': metadata-only cannot hide present segment '+String(value),()=>{const row=build();row.request.headers['next-router-segment-prefetch']=value;assert.equal(classifyHomeMetadataFailure(row,scope).classification,'required-or-unclassified-network-failure');});
  test(locale+': route-tree cannot hide present state-tree '+String(value),()=>{const row=routeTree(build());row.request.headers['next-router-state-tree']=value;assert.equal(classifyHomeMetadataFailure(row,scope).classification,'required-or-unclassified-network-failure');});
 }
}
test('new logger captures actual segment header without borrowing state from another Request',()=>{
 const f=fixture(),treeRequest=f.request(),metadataRequest=f.request();treeRequest.headers=()=>routeTree().request.headers;
 f.page.emit('request',treeRequest);f.page.emit('request',metadataRequest);f.page.emit('response',f.response(treeRequest));f.page.emit('requestfailed',treeRequest);
 const raw=f.observer.snapshot().failures[0];assert.equal(raw.request.headers['next-router-segment-prefetch'],'/_tree');assert.equal(Object.hasOwn(raw.request.headers,'next-router-state-tree'),false);assert.equal(raw.protocolVariant,'route-tree');assert.equal(f.errors.length,0);
 f.page.emit('requestfailed',metadataRequest);assert.equal(f.errors.length,1,'other Request has no same-object response');f.close();f.observer.finish();
});
test('a legacy incomplete log with both protocol headers missing stays blocking',()=>{
 const row=example();delete row.request.headers['next-router-state-tree'];assert.equal(accepted(row),false);
});
