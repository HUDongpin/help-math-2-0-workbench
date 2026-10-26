import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {P034_RESOURCE_PINS,P034_PREDECESSOR_ORIGINAL_PATHS,
  p034ResourceForRequest,p034ResourceUrl,type P034Resource}
  from '../lib/alg-l06-p034-local-request-v1';
import * as production from '../lib/alg-l06-p034-local-request.production-stub';
import {P032_RESOURCE_PINS} from '../lib/alg-l06-p032-local-request-v1';
import {p034DocumentRequest,p034ProxyDocumentRequest,p034DocumentKindFromReferer}
 from '../lib/alg-l06-p034-preview-policy-v1';

const root=process.cwd();
const source='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const origin='http://127.0.0.1:3331';
const env={NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',
  HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',HELP_MATH_G678_SOURCE_ROOT:source};
const tokens=Object.keys(P034_RESOURCE_PINS) as P034Resource[];
function request(token:P034Resource,options:{locale?:'en'|'es';focus?:boolean;
  version?:'candidate-v1'|'continuous-v1';path?:'originalPath'|'bridgePath';
  method?:'GET'|'HEAD'}={}){
  const row=P034_RESOURCE_PINS[token],script=row.contentType.startsWith('text/javascript');
  const referer=`${origin}/${options.locale??'en'}/migration-status/g678-calibration/shared-alg001-l06-p034/${options.version??'candidate-v1'}${options.focus?'?mode=focus':''}`;
  return {method:options.method??'GET',
    url:new URL(`${origin}${row[options.path??'originalPath']}?sha256=${row.sha256}`),
    headers:new Headers({host:'127.0.0.1:3331',referer,
      'sec-fetch-site':'same-origin','sec-fetch-mode':script?'no-cors':'cors',
      'sec-fetch-dest':script?'script':'empty'})};
}

test('one exact 112-row table pins P034 and all 109 P032 predecessor resources',()=>{
  assert.equal(tokens.length,112);
  assert.equal(P034_PREDECESSOR_ORIGINAL_PATHS.length,109);
  assert.equal(new Set(tokens.map(token=>P034_RESOURCE_PINS[token].originalPath )).size,112);
  assert.equal(new Set(tokens.map(token=>P034_RESOURCE_PINS[token].bridgePath )).size,112);
  assert.deepEqual(tokens.slice(0,3),['canvas-renderer.js','main-source-v1','optional-spanish-audio-v1']);
  assert.deepEqual(tokens.slice(3),Object.keys(P032_RESOURCE_PINS).map(token=>'p032-'+token));
  assert.deepEqual(P034_PREDECESSOR_ORIGINAL_PATHS,
    Object.values(P032_RESOURCE_PINS).map(row=>row.originalPath));
  for(const [token,prior] of Object.entries(P032_RESOURCE_PINS)){
    const inherited=P034_RESOURCE_PINS['p032-'+token];
    assert(inherited);
    assert.deepEqual(
      [inherited.originalPath,inherited.path,inherited.root,inherited.bytes,
        inherited.sha256,inherited.contentType],
      [prior.originalPath,prior.path,prior.root,prior.bytes,prior.sha256,
        prior.contentType]);
  }
  assert.equal(P034_RESOURCE_PINS['p032-p028-p027-p026-p025-p013Canvas'].path,
    'work/g678-shared-page-factory/g678-alg-l06-p013-current-js-20260928-v1/members/shared-alg001-l06-p013/canvas-renderer.js');
  for(const token of tokens){
    const row=P034_RESOURCE_PINS[token];
    assert.equal(row.bridgePath,`/flash-assets/g678-local/shared-alg001-l06-p034/${token}`);
    assert.equal(p034ResourceUrl(token),`${row.originalPath}?sha256=${row.sha256}`);
    const bytes=readFileSync(path.join(row.root==='source'?source:root,row.path));
    assert.equal(bytes.length,row.bytes,token);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256,token);
  }
});

test('P034 candidate and formal EN/ES resources accept only exact referers and optional focus',()=>{
  for(const token of tokens)for(const locale of ['en','es'] as const)
    for(const version of ['candidate-v1','continuous-v1'] as const)
      for(const focus of [false,true])for(const path of ['originalPath','bridgePath'] as const){
        assert.equal(p034ResourceForRequest(request(token,{locale,version,focus,path}),env),token);
        if(P034_RESOURCE_PINS[token].contentType.startsWith('audio/'))
          assert.equal(p034ResourceForRequest(request(token,{locale,version,focus,path,method:'HEAD'}),env),token);
      }
});

test('wrong page, hash, query, fetch, method, origin and environment fail closed',()=>{
  const token='p032-p028-p027-p026-p025-p013Canvas',good=request(token);
  for(const patch of [{NODE_ENV:'production'},{VERCEL:'1'},{VERCEL_ENV:'preview'},
    {HELP_MATH_G678_SOURCE_ROOT:'/tmp'},{HELP_MATH_G678_LOCAL_PREVIEW:undefined}])
    assert.equal(p034ResourceForRequest(good,{...env,...patch}),null);
  for(const version of ['continuous-v2','other']){
    const r=request(token);r.headers.set('referer',r.headers.get('referer')!.replace('candidate-v1',version));
    assert.equal(p034ResourceForRequest(r,env),null);
  }
  for(const suffix of ['?x=1','?mode=focus&x=1','#fragment']){
    const r=request(token);r.headers.set('referer',r.headers.get('referer')+suffix);
    assert.equal(p034ResourceForRequest(r,env),null);
  }
  const wrongHash=request(token);wrongHash.url.searchParams.set('sha256','0'.repeat(64));
  assert.equal(p034ResourceForRequest(wrongHash,env),null);
  const extraQuery=request(token);extraQuery.url.search+='&autoplay=1';
  assert.equal(p034ResourceForRequest(extraQuery,env),null);
  for(const [header,value] of [['range','bytes=0-1'],['host','localhost:3331'],
    ['origin','http://localhost:3331'],['sec-fetch-site','cross-site'],
    ['sec-fetch-dest','empty'],['sec-fetch-mode','navigate']] as const){
    const r=request(token);r.headers.set(header,value);
    assert.equal(p034ResourceForRequest(r,env),null,header);
  }
  const cors=request(token);cors.headers.set('sec-fetch-mode','cors');
  assert.equal(p034ResourceForRequest(cors,env),null);
  cors.headers.set('origin',origin);
  assert.equal(p034ResourceForRequest(cors,env),token);
  assert.equal(p034ResourceForRequest(request(token,{method:'HEAD'}),env),null);
  const wrongPort=request(token);wrongPort.url.port='3332';
  assert.equal(p034ResourceForRequest(wrongPort,env),null);
  const otherPage=request(token);otherPage.headers.set('referer',
    `${origin}/en/migration-status/g678-calibration/shared-alg001-l06-p013/candidate-v1`);
  assert.equal(p034ResourceForRequest(otherPage,env),null);
  const otherRoute=request(token);otherRoute.url.pathname='/flash-assets/g678-local/shared-alg001-l06-p034/unknown';
  assert.equal(p034ResourceForRequest(otherRoute,env),null);
});

test('production stub exposes no path or byte pins',()=>{
  assert.deepEqual(Object.keys(production.P034_RESOURCE_PINS),[]);
  assert.deepEqual(production.P034_PREDECESSOR_ORIGINAL_PATHS,[]);
  for(const token of tokens){
    assert.equal(production.p034ResourceForRequest(request(token),env),null);
    assert.equal(production.p034ResourceUrl(token),'');
  }
});

test('document boundary admits only the exact local EN/ES candidate and formal routes',()=>{
 for(const locale of ['en','es'])for(const version of ['candidate-v1','continuous-v1']){
  const url=new URL(`${origin}/${locale}/migration-status/g678-calibration/shared-alg001-l06-p034/${version}`);
  const headers=new Headers({host:'127.0.0.1:3331'});
  assert.equal(p034DocumentRequest(url,headers,'GET',env),true);
  assert.equal(p034DocumentRequest(url,headers,'HEAD',env),true);
  const internal=new URL(url);internal.hostname='localhost';
  assert.equal(p034ProxyDocumentRequest(internal,headers,'GET',env),true);
  assert.equal(p034DocumentRequest(internal,headers,'GET',env),false);
  const wrong=new URL(url);wrong.search='?autoplay=1';
  assert.equal(p034DocumentRequest(wrong,headers,'GET',env),false);
  assert.equal(p034DocumentRequest(url,headers,'POST',env),false);
  headers.set('host','localhost:3331');
  assert.equal(p034ProxyDocumentRequest(internal,headers,'GET',env),false);
 }
});

// Classification is consumed separately by the server reader's actual registration gate.
test('candidate and formal referers remain distinct and malformed variants cannot choose either mode',()=>{
 for(const locale of ['en','es'])for(const focus of ['', '?mode=focus']){
  const prefix=`${origin}/${locale}/migration-status/g678-calibration/shared-alg001-l06-p034/`;
  assert.equal(p034DocumentKindFromReferer(prefix+'candidate-v1'+focus),'candidate');
  assert.equal(p034DocumentKindFromReferer(prefix+'continuous-v1'+focus),'formal');
  for(const suffix of ['continuous-v2','continuous-v1/','continuous-v1?mode=focus&mode=focus','continuous-v1?autoplay=1','continuous-v1#fragment','continuous-v1?_rsc=cache'])
   assert.equal(p034DocumentKindFromReferer(prefix+suffix),null);
  assert.equal(p034DocumentKindFromReferer((prefix+'continuous-v1').replace('127.0.0.1','localhost')),null);
  assert.equal(p034DocumentKindFromReferer((prefix+'continuous-v1').replace('http://','http://owner:secret@')),null);
 }
 assert.equal(p034DocumentKindFromReferer(null),null);
});
