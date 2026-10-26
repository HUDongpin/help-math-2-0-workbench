import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {P023_RESOURCE_PINS,P023_PREDECESSOR_ORIGINAL_PATHS,
  p023ResourceForRequest,p023ResourceUrl,type P023Resource}
  from '../lib/alg-l06-p023-local-request-v1';
import * as production from '../lib/alg-l06-p023-local-request.production-stub';

const root=fileURLToPath(new URL('../../../',import.meta.url));
const source='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const origin='http://127.0.0.1:3331';
const env={NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',
  HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',HELP_MATH_G678_SOURCE_ROOT:source};
const tokens=Object.keys(P023_RESOURCE_PINS) as P023Resource[];
function request(token:P023Resource,options:{locale?:'en'|'es';focus?:boolean;
  version?:'candidate-v1'|'continuous-v1';path?:'originalPath'|'bridgePath';
  method?:'GET'|'HEAD'}={}){
  const row=P023_RESOURCE_PINS[token],script=row.contentType.startsWith('text/javascript');
  const referer=`${origin}/${options.locale??'en'}/migration-status/g678-calibration/shared-alg001-l06-p023/${options.version??'candidate-v1'}${options.focus?'?mode=focus':''}`;
  return {method:options.method??'GET',
    url:new URL(`${origin}${row[options.path??'originalPath']}?sha256=${row.sha256}`),
    headers:new Headers({host:'127.0.0.1:3331',referer,
      'sec-fetch-site':'same-origin','sec-fetch-mode':script?'no-cors':'cors',
      'sec-fetch-dest':script?'script':'empty'})};
}

test('one exact 83-row table pins P023 and all 80 P022 predecessor resources',()=>{
  assert.equal(tokens.length,83);
  assert.equal(P023_PREDECESSOR_ORIGINAL_PATHS.length,80);
  assert.equal(new Set(tokens.map(token=>P023_RESOURCE_PINS[token].originalPath )).size,83);
  assert.equal(new Set(tokens.map(token=>P023_RESOURCE_PINS[token].bridgePath )).size,83);
  assert.deepEqual(tokens.slice(0,3),['canvas-renderer.js','main-1','optional-spanish-audio-v1']);
  assert.equal(P023_RESOURCE_PINS.p013Canvas.path,
    'work/g678-shared-page-factory/g678-alg-l06-p013-current-js-20260928-v1/members/shared-alg001-l06-p013/canvas-renderer.js');
  for(const token of tokens){
    const row=P023_RESOURCE_PINS[token];
    assert.equal(row.bridgePath,`/flash-assets/g678-local/shared-alg001-l06-p023/${token}`);
    assert.equal(p023ResourceUrl(token),`${row.originalPath}?sha256=${row.sha256}`);
    const bytes=readFileSync(path.join(row.root==='source'?source:root,row.path));
    assert.equal(bytes.length,row.bytes,token);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256,token);
  }
});

test('P023 candidate and formal EN/ES resources accept exact routes and optional focus',()=>{
  for(const token of tokens)for(const locale of ['en','es'] as const)
    for(const version of ['candidate-v1','continuous-v1'] as const)
      for(const focus of [false,true])for(const path of ['originalPath','bridgePath'] as const){
        assert.equal(p023ResourceForRequest(request(token,{locale,version,focus,path}),env),token);
        if(P023_RESOURCE_PINS[token].contentType.startsWith('audio/'))
          assert.equal(p023ResourceForRequest(request(token,{locale,version,focus,path,method:'HEAD'}),env),token);
      }
});

test('wrong page, hash, query, fetch, method, origin and environment fail closed',()=>{
  const token='p013Canvas',good=request(token);
  for(const patch of [{NODE_ENV:'production'},{VERCEL:'1'},{VERCEL_ENV:'preview'},
    {HELP_MATH_G678_SOURCE_ROOT:'/tmp'},{HELP_MATH_G678_LOCAL_PREVIEW:undefined}])
    assert.equal(p023ResourceForRequest(good,{...env,...patch}),null);
  for(const version of ['continuous-v2','other']){
    const r=request(token);r.headers.set('referer',r.headers.get('referer')!.replace('candidate-v1',version));
    assert.equal(p023ResourceForRequest(r,env),null);
  }
  for(const suffix of ['?x=1','?mode=focus&x=1','#fragment']){
    const r=request(token);r.headers.set('referer',r.headers.get('referer')+suffix);
    assert.equal(p023ResourceForRequest(r,env),null);
  }
  const wrongHash=request(token);wrongHash.url.searchParams.set('sha256','0'.repeat(64));
  assert.equal(p023ResourceForRequest(wrongHash,env),null);
  const extraQuery=request(token);extraQuery.url.search+='&autoplay=1';
  assert.equal(p023ResourceForRequest(extraQuery,env),null);
  for(const [header,value] of [['range','bytes=0-1'],['host','localhost:3331'],
    ['origin','http://localhost:3331'],['sec-fetch-site','cross-site'],
    ['sec-fetch-dest','empty'],['sec-fetch-mode','navigate']] as const){
    const r=request(token);r.headers.set(header,value);
    assert.equal(p023ResourceForRequest(r,env),null,header);
  }
  const cors=request(token);cors.headers.set('sec-fetch-mode','cors');
  assert.equal(p023ResourceForRequest(cors,env),null);
  cors.headers.set('origin',origin);
  assert.equal(p023ResourceForRequest(cors,env),token);
  assert.equal(p023ResourceForRequest(request(token,{method:'HEAD'}),env),null);
  const wrongPort=request(token);wrongPort.url.port='3332';
  assert.equal(p023ResourceForRequest(wrongPort,env),null);
  const otherPage=request(token);otherPage.headers.set('referer',
    `${origin}/en/migration-status/g678-calibration/shared-alg001-l06-p013/candidate-v1`);
  assert.equal(p023ResourceForRequest(otherPage,env),null);
  const otherRoute=request(token);otherRoute.url.pathname='/flash-assets/g678-local/shared-alg001-l06-p023/unknown';
  assert.equal(p023ResourceForRequest(otherRoute,env),null);
});

test('production stub exposes no path or byte pins',()=>{
  assert.deepEqual(Object.keys(production.P023_RESOURCE_PINS),[]);
  assert.deepEqual(production.P023_PREDECESSOR_ORIGINAL_PATHS,[]);
  for(const token of tokens){
    assert.equal(production.p023ResourceForRequest(request(token),env),null);
    assert.equal(production.p023ResourceUrl(token),'');
  }
});
