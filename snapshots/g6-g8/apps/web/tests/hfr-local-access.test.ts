import assert from 'node:assert/strict';
import {test} from 'node:test';
import {hfrDocumentRequest, hfrAssetRequest, hfrAssetResponse} from '../lib/hfr-local-access';

const ID = 'shared-nms002-l07-p001', origin = 'http://127.0.0.1:3331';
const doc = `${origin}/en/migration-status/g678-hfr/${ID}/candidate`;
const data = `${origin}/flash-assets/g678-local/${ID}/hfr/${ID}.data.json`;
const audio = `${origin}/flash-assets/g678-local/${ID}/hfr/media/stream0_tl113.mp3`;
const env = {NODE_ENV:'development', HELP_MATH_G678_LOCAL_PREVIEW:'1', HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1'};
function headers(overrides: Readonly<Record<string,string | undefined>> = {}) {
  const result = new Headers({host:'127.0.0.1:3331',referer:doc,
    'sec-fetch-site':'same-origin','sec-fetch-mode':'cors','sec-fetch-dest':'empty'});
  for (const [key, value] of Object.entries(overrides)) if (value !== undefined) result.set(key, value);
  return result;
}

test('exact EN/ES candidate and registered documents stay development-only', () => {
  for (const locale of ['en','es']) for (const mode of ['candidate','registered'])
    assert.deepEqual(hfrDocumentRequest(new URL(`${origin}/${locale}/migration-status/g678-hfr/${ID}/${mode}`),headers(),'GET',env),{locale,mode,animationId:ID});
  for (const denied of [{...env,NODE_ENV:'production'},{...env,VERCEL:'1'},{...env,VERCEL_ENV:'preview'},
    {...env,HELP_MATH_G678_LOCAL_PREVIEW:'0'},{...env,HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0'}])
    assert.equal(hfrDocumentRequest(new URL(doc),headers(),'GET',denied),null);
  assert.equal(hfrDocumentRequest(new URL(doc+'?anything=1'),headers(),'GET',env),null);
  assert.equal(hfrDocumentRequest(new URL(doc),headers(),'POST',env),null);
});

test('data, decoded audio fetches and browser image/audio requests are bounded', () => {
  assert.equal(hfrAssetRequest(new URL(data),headers(),'GET',env)?.contentType,'application/json; charset=utf-8');
  assert.equal(hfrAssetRequest(new URL(audio),headers(),'GET',env)?.contentType,'audio/mpeg');
  assert.equal(hfrAssetRequest(new URL(audio),headers({'sec-fetch-dest':'audio','sec-fetch-mode':'no-cors',range:'bytes=0-'}),'GET',env)?.range,'bytes=0-');
  assert.equal(hfrAssetRequest(new URL(audio.replace('stream0_tl113.mp3','image1.png')),headers({'sec-fetch-dest':'image','sec-fetch-mode':'no-cors'}),'GET',env)?.contentType,'image/png');
  // Client-side page navigation keeps the initial lesson document URL.
  assert.ok(hfrAssetRequest(new URL(data),headers({referer:doc.replace('-p001/','-p002/')}),'GET',env));
  for (const referer of [
    `${origin}/en/courses/6/nms002/7`,
    `${origin}/es/courses/8/nms002/7`,
    `${origin}/en/courses/6/7?moduleCode=NMS002`,
    `${origin}/en/migration-status/g678-course/nms002/7`,
  ]) assert.ok(hfrAssetRequest(new URL(data),headers({referer}),'GET',env), referer);
  for (const referer of [
    `${origin}/en/courses/6/nms002/8`,
    `${origin}/en/courses/6/geo001/7`,
    `${origin}/en/courses/6/nms002/7?mode=focus`,
    `${origin}/en/courses/6/7?moduleCode=GEO001`,
    `${origin}/en/courses/5/nms002/7`,
  ]) assert.equal(hfrAssetRequest(new URL(data),headers({referer}),'GET',env),null,referer);
});

test('wrong origin, lesson, destination, source bytecode or arbitrary file requests are denied', () => {
  for (const overrides of [{'sec-fetch-site':'cross-site'},{referer:'https://example.test/'},
    {referer:doc.replace('l07','l08')},{origin:'http://localhost:3331'},
    {host:'example.test:3331'},{host:'user@127.0.0.1:3331'},{'x-forwarded-host':'localhost:9999'},
    {'sec-fetch-dest':'script'},{range:'bytes=0-1'}])
    assert.equal(hfrAssetRequest(new URL(data),headers(overrides),'GET',env),null,JSON.stringify(overrides));
  for (const file of [`${ID}.bytecode.json`,`${ID}.ts`,`${ID}.js`,'artifact-closure.json','media/%2e%2e/file.mp3','other.data.json'])
    assert.equal(hfrAssetRequest(new URL(data.replace(`${ID}.data.json`,file)),headers(),'GET',env),null,file);
  assert.equal(hfrAssetRequest(new URL(data.replace('http:','https:')),headers(),'GET',env),null);
  assert.equal(hfrAssetRequest(new URL(data+'?sha256=ignored'),headers(),'GET',env),null);
});

test('only one well-formed audio range is accepted by the request policy', () => {
  for (const range of ['bytes=0-1,3-4','items=0-2','bytes=','bytes=--1','bytes=1.5-4'])
    assert.equal(hfrAssetRequest(new URL(audio),headers({range}),'GET',env),null);
});

test('verified audio supports bounded byte ranges and rejects unsatisfiable values', async () => {
  const bytes=Uint8Array.from([1,2,3,4,5]);
  for (const [range,expected] of [['bytes=1-3',[2,3,4]],['bytes=3-',[4,5]],['bytes=-2',[4,5]],['bytes=0-999',[1,2,3,4,5]]] as const) {
    const request=hfrAssetRequest(new URL(audio),headers({range}),'GET',env)!;
    const response=hfrAssetResponse(bytes,request,'GET');
    assert.equal(response.status,206);assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],expected);
    assert.equal(response.headers.get('content-length'),String(expected.length));
    assert.match(response.headers.get('x-robots-tag')! ,/noindex/);
    assert.equal(response.headers.get('cross-origin-resource-policy'),'same-origin');
  }
  for (const range of ['bytes=9-','bytes=4-2','bytes=-0','bytes=-99999999999999999999999']) {
    const request=hfrAssetRequest(new URL(audio),headers({range}),'GET',env)!;
    const response=hfrAssetResponse(bytes,request,'GET');assert.equal(response.status,416);assert.equal(response.headers.get('content-range'),'bytes */5');
  }
  const request=hfrAssetRequest(new URL(audio),headers(),'HEAD',env)!;
  const response=hfrAssetResponse(bytes,request,'HEAD');assert.equal(response.status,200);assert.equal(await response.text(),'');assert.equal(response.headers.get('content-length'),'5');
});


test('real language-link focus mode and Next navigation nonce are exact and bounded', () => {
  for (const query of ['?mode=focus','?_rsc=a_B-9','?mode=focus&_rsc=abc'])
    assert.ok(hfrDocumentRequest(new URL(doc+query), headers(), 'GET', env), query);
  for (const query of ['?mode=study','?mode=classroom','?mode=focus&mode=focus','?_rsc=','?_rsc=a&_rsc=b',
    '?_rsc='+ 'x'.repeat(129),'?mode=focus&unknown=1','?mode=focus&_rsc=a%2Fb'])
    assert.equal(hfrDocumentRequest(new URL(doc+query), headers(), 'GET', env), null, query);
  assert.ok(hfrAssetRequest(new URL(data),headers({referer:doc+'?mode=focus'}),'GET',env));
  for (const query of ['?mode=study','?_rsc=a','?mode=focus&mode=focus'])
    assert.equal(hfrAssetRequest(new URL(data),headers({referer:doc+query}),'GET',env),null,query);
});

test('current local course language link preserves only its exact focus query for own resources',()=>{
  for(const locale of ['en','es']) {
    const course=`${origin}/${locale}/migration-status/g678-course/nms002/7`;
    for(const query of ['', '?mode=focus']) assert.ok(hfrAssetRequest(new URL(data),headers({referer:course+query}),'GET',env));
    for(const query of ['?mode=study','?mode=focus&mode=focus','?unknown=1','?_rsc=a'])
      assert.equal(hfrAssetRequest(new URL(data),headers({referer:course+query}),'GET',env),null);
    assert.equal(hfrAssetRequest(new URL(data),headers({referer:course.replace('/7','/8')+'?mode=focus'}),'GET',env),null);
  }
});
