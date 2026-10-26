import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {P032_RESOURCE_PINS,P032_PREDECESSOR_ORIGINAL_PATHS,
  p032ResourceForRequest,p032ResourceUrl,type P032Resource}
  from '../lib/alg-l06-p032-local-request-v1';
import * as production from '../lib/alg-l06-p032-local-request.production-stub';
import {P028_RESOURCE_PINS} from '../lib/alg-l06-p028-local-request-v1';
import {p032DocumentRequest,p032ProxyDocumentRequest}
 from '../lib/alg-l06-p032-preview-policy-v1';

const root=process.cwd();
const source='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const origin='http://127.0.0.1:3331';
const env={NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',
  HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',HELP_MATH_G678_SOURCE_ROOT:source};
const tokens=Object.keys(P032_RESOURCE_PINS) as P032Resource[];
function request(token:P032Resource,options:{locale?:'en'|'es';focus?:boolean;
  version?:'candidate-v1'|'continuous-v1';path?:'originalPath'|'bridgePath';
  method?:'GET'|'HEAD'}={}){
  const row=P032_RESOURCE_PINS[token],script=row.contentType.startsWith('text/javascript');
  const referer=`${origin}/${options.locale??'en'}/migration-status/g678-calibration/shared-alg001-l06-p032/${options.version??'candidate-v1'}${options.focus?'?mode=focus':''}`;
  return {method:options.method??'GET',
    url:new URL(`${origin}${row[options.path??'originalPath']}?sha256=${row.sha256}`),
    headers:new Headers({host:'127.0.0.1:3331',referer,
      'sec-fetch-site':'same-origin','sec-fetch-mode':script?'no-cors':'cors',
      'sec-fetch-dest':script?'script':'empty'})};
}

test('one exact 109-row table pins P032 and all 106 P028 predecessor resources',()=>{
  assert.equal(tokens.length,109);
  assert.equal(P032_PREDECESSOR_ORIGINAL_PATHS.length,106);
  assert.equal(new Set(tokens.map(token=>P032_RESOURCE_PINS[token].originalPath )).size,109);
  assert.equal(new Set(tokens.map(token=>P032_RESOURCE_PINS[token].bridgePath )).size,109);
  assert.deepEqual(tokens.slice(0,3),['canvas-renderer.js','main-source-v1','optional-spanish-audio-v1']);
  assert.deepEqual(tokens.slice(3),Object.keys(P028_RESOURCE_PINS).map(token=>'p028-'+token));
  assert.deepEqual(P032_PREDECESSOR_ORIGINAL_PATHS,
    Object.values(P028_RESOURCE_PINS).map(row=>row.originalPath));
  for(const [token,prior] of Object.entries(P028_RESOURCE_PINS)){
    const inherited=P032_RESOURCE_PINS['p028-'+token];
    assert(inherited);
    assert.deepEqual(
      [inherited.originalPath,inherited.path,inherited.root,inherited.bytes,
        inherited.sha256,inherited.contentType],
      [prior.originalPath,prior.path,prior.root,prior.bytes,prior.sha256,
        prior.contentType]);
  }
  assert.equal(P032_RESOURCE_PINS['p028-p027-p026-p025-p013Canvas'].path,
    'work/g678-shared-page-factory/g678-alg-l06-p013-current-js-20260928-v1/members/shared-alg001-l06-p013/canvas-renderer.js');
  for(const token of tokens){
    const row=P032_RESOURCE_PINS[token];
    assert.equal(row.bridgePath,`/flash-assets/g678-local/shared-alg001-l06-p032/${token}`);
    assert.equal(p032ResourceUrl(token),`${row.originalPath}?sha256=${row.sha256}`);
    const bytes=readFileSync(path.join(row.root==='source'?source:root,row.path));
    assert.equal(bytes.length,row.bytes,token);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256,token);
  }
});

test('P032 candidate EN/ES resources accept exact routes and optional focus',()=>{
  for(const token of tokens)for(const locale of ['en','es'] as const)
    for(const version of ['candidate-v1','continuous-v1'] as const)
      for(const focus of [false,true])for(const path of ['originalPath','bridgePath'] as const){
        assert.equal(p032ResourceForRequest(request(token,{locale,version,focus,path}),env),token);
        if(P032_RESOURCE_PINS[token].contentType.startsWith('audio/'))
          assert.equal(p032ResourceForRequest(request(token,{locale,version,focus,path,method:'HEAD'}),env),token);
      }
});

test('wrong page, hash, query, fetch, method, origin and environment fail closed',()=>{
  const token='p028-p027-p026-p025-p013Canvas',good=request(token);
  for(const patch of [{NODE_ENV:'production'},{VERCEL:'1'},{VERCEL_ENV:'preview'},
    {HELP_MATH_G678_SOURCE_ROOT:'/tmp'},{HELP_MATH_G678_LOCAL_PREVIEW:undefined}])
    assert.equal(p032ResourceForRequest(good,{...env,...patch}),null);
  for(const version of ['continuous-v2','other']){
    const r=request(token);r.headers.set('referer',r.headers.get('referer')!.replace('candidate-v1',version));
    assert.equal(p032ResourceForRequest(r,env),null);
  }
  for(const suffix of ['?x=1','?mode=focus&x=1','#fragment']){
    const r=request(token);r.headers.set('referer',r.headers.get('referer')+suffix);
    assert.equal(p032ResourceForRequest(r,env),null);
  }
  const wrongHash=request(token);wrongHash.url.searchParams.set('sha256','0'.repeat(64));
  assert.equal(p032ResourceForRequest(wrongHash,env),null);
  const extraQuery=request(token);extraQuery.url.search+='&autoplay=1';
  assert.equal(p032ResourceForRequest(extraQuery,env),null);
  for(const [header,value] of [['range','bytes=0-1'],['host','localhost:3331'],
    ['origin','http://localhost:3331'],['sec-fetch-site','cross-site'],
    ['sec-fetch-dest','empty'],['sec-fetch-mode','navigate']] as const){
    const r=request(token);r.headers.set(header,value);
    assert.equal(p032ResourceForRequest(r,env),null,header);
  }
  const cors=request(token);cors.headers.set('sec-fetch-mode','cors');
  assert.equal(p032ResourceForRequest(cors,env),null);
  cors.headers.set('origin',origin);
  assert.equal(p032ResourceForRequest(cors,env),token);
  assert.equal(p032ResourceForRequest(request(token,{method:'HEAD'}),env),null);
  const wrongPort=request(token);wrongPort.url.port='3332';
  assert.equal(p032ResourceForRequest(wrongPort,env),null);
  const otherPage=request(token);otherPage.headers.set('referer',
    `${origin}/en/migration-status/g678-calibration/shared-alg001-l06-p013/candidate-v1`);
  assert.equal(p032ResourceForRequest(otherPage,env),null);
  const otherRoute=request(token);otherRoute.url.pathname='/flash-assets/g678-local/shared-alg001-l06-p032/unknown';
  assert.equal(p032ResourceForRequest(otherRoute,env),null);
});

test('production stub exposes no path or byte pins',()=>{
  assert.deepEqual(Object.keys(production.P032_RESOURCE_PINS),[]);
  assert.deepEqual(production.P032_PREDECESSOR_ORIGINAL_PATHS,[]);
  for(const token of tokens){
    assert.equal(production.p032ResourceForRequest(request(token),env),null);
    assert.equal(production.p032ResourceUrl(token),'');
  }
});

test('document boundary admits only the exact local EN/ES candidate routes',()=>{
 for(const locale of ['en','es'])for(const version of ['candidate-v1','continuous-v1']){
  const url=new URL(`${origin}/${locale}/migration-status/g678-calibration/shared-alg001-l06-p032/${version}`);
  const headers=new Headers({host:'127.0.0.1:3331'});
  assert.equal(p032DocumentRequest(url,headers,'GET',env),true);
  assert.equal(p032DocumentRequest(url,headers,'HEAD',env),true);
  const internal=new URL(url);internal.hostname='localhost';
  assert.equal(p032ProxyDocumentRequest(internal,headers,'GET',env),true);
  assert.equal(p032DocumentRequest(internal,headers,'GET',env),false);
  const wrong=new URL(url);wrong.search='?autoplay=1';
  assert.equal(p032DocumentRequest(wrong,headers,'GET',env),false);
  assert.equal(p032DocumentRequest(url,headers,'POST',env),false);
  headers.set('host','localhost:3331');
  assert.equal(p032ProxyDocumentRequest(internal,headers,'GET',env),false);
 }
});
