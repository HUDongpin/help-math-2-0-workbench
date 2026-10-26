import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {isP008ResourceRequest,p008ResourceUrl,P008_RESOURCE_PINS,type P008Resource}
  from '../lib/alg-l06-p008-local-request-v1';
import {P008_PREDECESSOR_RESOURCES,p008PredecessorResourceForRequest,
  isP008PredecessorOriginalRequest,type P008PredecessorResource}
  from '../lib/alg-l06-p008-predecessor-request-v1';

const env={NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'true',
  HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',
  HELP_MATH_G678_SOURCE_ROOT:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'};
const origin='http://127.0.0.1:3331';
const referer=(locale='en')=>`${origin}/${locale}/migration-status/g678-calibration/shared-alg001-l06-p008/candidate-v1`;
function request(resource:P008Resource,locale='en'){
  return {method:'GET',url:new URL(origin+p008ResourceUrl(resource)),headers:new Headers({
    host:'127.0.0.1:3331',referer:referer(locale),
    'sec-fetch-site':'same-origin','sec-fetch-mode':'cors',
    'sec-fetch-dest':resource==='canvas'?'script':'empty',
  })};
}
function bridge(kind:P008PredecessorResource,path:'originalPath'|'bridgePath',locale='en'){
  const pin=P008_PREDECESSOR_RESOURCES[kind];
  const r=request(kind.endsWith('Canvas')?'canvas':'main',locale);
  r.url=new URL(`${origin}${pin[path]}?sha256=${pin.sha256}`);
  if(kind.endsWith('Canvas'))r.headers.set('origin',origin);
  return r;
}

test('P008 own resources bind exact optimized drawing and audited audio bytes',()=>{
  const root=new URL('../../../',import.meta.url);
  const paths={
    canvas:'output/alg-l06-p008-optimized-canvas-v1/successor-v2/canvas-renderer.js',
    main:'migrations/shared-alg001-l06-p008/audit/audio-v1/continuous-source-v1.mp3',
    spanish:'migrations/shared-alg001-l06-p008/audit/audio-v1/separate-sa-source-v1.mp3',
  };
  for(const resource of ['canvas','main','spanish'] as const){
    const bytes=readFileSync(fileURLToPath(new URL(paths[resource],root)));
    assert.equal(bytes.length,P008_RESOURCE_PINS[resource].bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),P008_RESOURCE_PINS[resource].sha256);
    for(const locale of ['en','es'])assert.equal(isP008ResourceRequest(request(resource,locale),resource,env),true);
  }
});

test('P008 own resource request rejects deployment, origin, document, hash, range and fetch drift',()=>{
  for(const resource of ['canvas','main','spanish'] as const){
    for(const patch of [{NODE_ENV:'production'},{VERCEL:'1'},{VERCEL_ENV:'preview'},
      {HELP_MATH_G678_LOCAL_PREVIEW:undefined},{HELP_MATH_G678_SOURCE_ROOT:'/tmp'}])
      assert.equal(isP008ResourceRequest(request(resource),resource,{...env,...patch}),false);
    for(const [header,value] of [
      ['referer',`${origin}/en/migration-status/g678-calibration/shared-alg001-l06-p004/candidate-v1`],
      ['referer',referer()+'?other=1'],['host','127.0.0.1:3332'],
      ['origin','http://localhost:3331'],['range','bytes=0-10'],['sec-fetch-site','cross-site'],
    ]){
      const r=request(resource);r.headers.set(header,value);
      assert.equal(isP008ResourceRequest(r,resource,env),false,`${resource}:${header}`);
    }
    const wrongHash=request(resource);wrongHash.url.searchParams.set('sha256','0'.repeat(64));
    assert.equal(isP008ResourceRequest(wrongHash,resource,env),false);
    const duplicate=request(resource);duplicate.url.search+='&extra=1';
    assert.equal(isP008ResourceRequest(duplicate,resource,env),false);
    const wrongPort=request(resource);wrongPort.url.port='3332';
    assert.equal(isP008ResourceRequest(wrongPort,resource,env),false);
    const normalized=request(resource);normalized.url.hostname='localhost';
    assert.equal(isP008ResourceRequest(normalized,resource,env),true);
    normalized.headers.set('host','localhost:3331');
    assert.equal(isP008ResourceRequest(normalized,resource,env),false);
    const head=request(resource);head.method='HEAD';
    assert.equal(isP008ResourceRequest(head,resource,env),resource!=='canvas');
  }
});

test('exact P004 and P003 predecessor URLs are accepted only from P008 candidate',()=>{
  assert.equal(Object.keys(P008_PREDECESSOR_RESOURCES).length,6);
  assert.equal(new Set(Object.values(P008_PREDECESSOR_RESOURCES).map(pin=>pin.bridgePath)).size,6);
  for(const kind of Object.keys(P008_PREDECESSOR_RESOURCES) as P008PredecessorResource[]){
    for(const path of ['originalPath','bridgePath'] as const)for(const locale of ['en','es']){
      const r=bridge(kind,path,locale);
      assert.equal(p008PredecessorResourceForRequest(r,env),kind);
      assert.equal(isP008PredecessorOriginalRequest(r,env),path==='originalPath');
      r.headers.set('referer',referer(locale).replace('p008','p004'));
      assert.equal(p008PredecessorResourceForRequest(r,env),null);
    }
  }
});

test('predecessor bridge rejects hash, method, fetch, port, and environment drift',()=>{
  for(const kind of Object.keys(P008_PREDECESSOR_RESOURCES) as P008PredecessorResource[]){
    const wrongHash=bridge(kind,'originalPath');wrongHash.url.searchParams.set('sha256','0'.repeat(64));
    assert.equal(p008PredecessorResourceForRequest(wrongHash,env),null);
    const range=bridge(kind,'bridgePath');range.headers.set('range','bytes=0-1');
    assert.equal(p008PredecessorResourceForRequest(range,env),null);
    const wrongPort=bridge(kind,'bridgePath');wrongPort.url.port='3332';
    assert.equal(p008PredecessorResourceForRequest(wrongPort,env),null);
    const normalized=bridge(kind,'bridgePath');normalized.url.hostname='localhost';
    assert.equal(p008PredecessorResourceForRequest(normalized,env),kind);
    normalized.headers.set('host','localhost:3331');
    assert.equal(p008PredecessorResourceForRequest(normalized,env),null);
    const post=bridge(kind,'bridgePath');post.method='POST';
    assert.equal(p008PredecessorResourceForRequest(post,env),null);
    const head=bridge(kind,'bridgePath');head.method='HEAD';
    assert.equal(p008PredecessorResourceForRequest(head,env),kind.endsWith('Canvas')?null:kind);
    const cross=bridge(kind,'bridgePath');cross.headers.set('sec-fetch-site','cross-site');
    assert.equal(p008PredecessorResourceForRequest(cross,env),null);
    const deploy=bridge(kind,'bridgePath');
    assert.equal(p008PredecessorResourceForRequest(deploy,{...env,VERCEL_ENV:'preview'}),null);
  }
});
