import assert from 'node:assert/strict';
import test from 'node:test';
import {P049_RESOURCE_PINS,p049ResourceForRequest}
 from '../lib/alg-l06-p049-local-request-v1';
import {P049_LOCAL_ORIGIN,P049_SOURCE_ROOT,p049DocumentRequest}
 from '../lib/alg-l06-p049-preview-policy-v1';

const env={NODE_ENV:'development',HELP_MATH_G678_SOURCE_ROOT:P049_SOURCE_ROOT,
  HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'};
const ref=`${P049_LOCAL_ORIGIN}/en/migration-status/g678-calibration/shared-alg001-l06-p049/candidate-v1?mode=focus`;
const documentHeaders=()=>new Headers({host:'127.0.0.1:3331'});
function assetHeaders(dest:'script'|'empty'){
  return new Headers({host:'127.0.0.1:3331',referer:ref,
    'sec-fetch-site':'same-origin','sec-fetch-mode':dest==='script'?'no-cors':'cors',
    'sec-fetch-dest':dest});
}

test('only the exact local bilingual P049 document is admitted',()=>{
  assert.equal(p049DocumentRequest(new URL(ref),documentHeaders(),'GET',env),true);
  assert.equal(p049DocumentRequest(new URL(ref.replace('/en/','/es/')),
    documentHeaders(),'HEAD',env),true);
  for(const url of [ref.replace('127.0.0.1','example.com'),
    ref.replace('candidate-v1','candidate-v2'),`${ref}&foo=bar`])
    assert.equal(p049DocumentRequest(new URL(url),documentHeaders(),'GET',env),false);
  assert.equal(p049DocumentRequest(new URL(ref),documentHeaders(),'GET',
    {...env,NODE_ENV:'production'}),false);
});

test('source assets require exact hash, document referer and same-origin fetch',()=>{
  for(const token of ['canvas-renderer.js','main-source-v1',
    'feedback-wrong4-source-v1','feedback-right4-source-v1',
    'optional-spanish-audio-v1']){
    const row=P049_RESOURCE_PINS[token];
    assert.ok(row);
    const url=new URL(`${P049_LOCAL_ORIGIN}${row.originalPath}?sha256=${row.sha256}`);
    const dest=token==='canvas-renderer.js'?'script':'empty';
    assert.equal(p049ResourceForRequest({method:'GET',url,headers:assetHeaders(dest)},env),token);
    const wrong=new URL(url);wrong.search='?sha256=000000';
    assert.equal(p049ResourceForRequest({method:'GET',url:wrong,
      headers:assetHeaders(dest)},env),null);
    const ranged=assetHeaders(dest);ranged.set('range','bytes=0-1');
    assert.equal(p049ResourceForRequest({method:'GET',url,headers:ranged},env),null);
    const foreign=assetHeaders(dest);foreign.set('referer','https://example.com/');
    assert.equal(p049ResourceForRequest({method:'GET',url,headers:foreign},env),null);
    assert.equal(p049ResourceForRequest({method:'GET',url,headers:assetHeaders(dest)},
      {...env,NODE_ENV:'production'}),null);
  }
});

// Codec selection is observable by the actual route, not an assumed MP3 alias.
test('right4 serves only the independently derived P049 WAV',()=>{
 const row=P049_RESOURCE_PINS['feedback-right4-source-v1'];
 assert.equal(row.contentType,'audio/wav');
 assert.equal(row.bytes,11978);
 assert.equal(row.sha256,'f3e05365073feff502feda8779b3d3a5e3ba4ca6ee213e7a162e1ad5b3961eb8');
 assert.equal(row.path,'migrations/shared-alg001-l06-p049/assets/source-stream-192-right4.wav');
});

test('shared loader accepts the requested source codec and refuses a different response type',async t=>{
 const {loadBoundLessonAudio}=await import('../components/source-lesson-host-bridge-v1');
 const options={animationId:'shared-alg001-l06-p049',assetId:'feedback-right4-source-v1',
  pin:{sourceBytes:3,sourceSha256:'a'.repeat(64)},origin:P049_LOCAL_ORIGIN,
  signal:new AbortController().signal,errorPrefix:'P049'};
 for(const responseType of ['audio/mpeg','audio/wav']){
  t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL)=>{
   const response=new Response(Uint8Array.of(1,2,3),{headers:{'content-type':responseType,'content-length':'3'}});
   Object.defineProperty(response,'url',{value:String(input)});return response;
  });
  for(const expected of [undefined,'audio/wav'] as const){
   if(responseType===(expected??'audio/mpeg'))assert.deepEqual(new Uint8Array(await loadBoundLessonAudio({...options,contentType:expected})),Uint8Array.of(1,2,3));
   else await assert.rejects(loadBoundLessonAudio({...options,contentType:expected}),/response-mismatch/);
  }
  t.mock.restoreAll();
 }
});
