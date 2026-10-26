import assert from 'node:assert/strict';
import test from 'node:test';
import {P048_RESOURCE_PINS,p048ResourceForRequest}
 from '../lib/alg-l06-p048-local-request-v1';
import {P048_LOCAL_ORIGIN,P048_SOURCE_ROOT,p048DocumentRequest}
 from '../lib/alg-l06-p048-preview-policy-v1';

const env={NODE_ENV:'development',HELP_MATH_G678_SOURCE_ROOT:P048_SOURCE_ROOT,
  HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'};
const ref=`${P048_LOCAL_ORIGIN}/en/migration-status/g678-calibration/shared-alg001-l06-p048/candidate-v1?mode=focus`;
const documentHeaders=()=>new Headers({host:'127.0.0.1:3331'});
function assetHeaders(dest:'script'|'empty'){
  return new Headers({host:'127.0.0.1:3331',referer:ref,
    'sec-fetch-site':'same-origin','sec-fetch-mode':dest==='script'?'no-cors':'cors',
    'sec-fetch-dest':dest});
}

test('only the exact local bilingual P048 document is admitted',()=>{
  assert.equal(p048DocumentRequest(new URL(ref),documentHeaders(),'GET',env),true);
  assert.equal(p048DocumentRequest(new URL(ref.replace('/en/','/es/')),
    documentHeaders(),'HEAD',env),true);
  for(const url of [ref.replace('127.0.0.1','example.com'),
    ref.replace('candidate-v1','candidate-v2'),`${ref}&foo=bar`])
    assert.equal(p048DocumentRequest(new URL(url),documentHeaders(),'GET',env),false);
  assert.equal(p048DocumentRequest(new URL(ref),documentHeaders(),'GET',
    {...env,NODE_ENV:'production'}),false);
});

test('source assets require exact hash, document referer and same-origin fetch',()=>{
  for(const token of ['canvas-renderer.js','main-source-v1',
    'feedback-wrong4-source-v1','feedback-right4-source-v1',
    'optional-spanish-audio-v1']){
    const row=P048_RESOURCE_PINS[token];
    assert.ok(row);
    const url=new URL(`${P048_LOCAL_ORIGIN}${row.originalPath}?sha256=${row.sha256}`);
    const dest=token==='canvas-renderer.js'?'script':'empty';
    assert.equal(p048ResourceForRequest({method:'GET',url,headers:assetHeaders(dest)},env),token);
    const wrong=new URL(url);wrong.search='?sha256=000000';
    assert.equal(p048ResourceForRequest({method:'GET',url:wrong,
      headers:assetHeaders(dest)},env),null);
    const ranged=assetHeaders(dest);ranged.set('range','bytes=0-1');
    assert.equal(p048ResourceForRequest({method:'GET',url,headers:ranged},env),null);
    const foreign=assetHeaders(dest);foreign.set('referer','https://example.com/');
    assert.equal(p048ResourceForRequest({method:'GET',url,headers:foreign},env),null);
    assert.equal(p048ResourceForRequest({method:'GET',url,headers:assetHeaders(dest)},
      {...env,NODE_ENV:'production'}),null);
  }
});
