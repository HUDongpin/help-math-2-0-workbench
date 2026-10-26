import assert from 'node:assert/strict';
import test from 'node:test';
import {isP030AudioRequest} from '../lib/nms-l02-p030-audio-access';
import {CONTINUOUS_AUDIO_PHASE} from '../lib/continuous-source-audio-access';
const env={NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'true',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',HELP_MATH_G678_CALIBRATION_PHASE:CONTINUOUS_AUDIO_PHASE};
const origin='http://127.0.0.1:3343';
function request(page='002',lang='en'){
  return {method:'GET',url:new URL(origin+'/flash-assets/g678-local/shared-nms002-l02-p030/source-audio?sha256=26d47b9a91209ece275b1f6ab730d7b8bdd780c764c59a840f6ff78c6126c290'),headers:new Headers({host:'127.0.0.1:3343',referer:origin+'/'+lang+'/migration-status/g678-calibration/shared-nms002-l02-p'+page,'sec-fetch-site':'same-origin','sec-fetch-mode':'cors','sec-fetch-dest':'empty'})};
}
test('the 64 exact source lesson page routes can select this audio in either UI locale',()=>{
  for(const lang of ['en','es'])for(let page=1;page<=64;page++)assert.equal(isP030AudioRequest(request(String(page).padStart(3,'0'),lang),env),true);
  const normalized=request();normalized.url.hostname='localhost';assert.equal(isP030AudioRequest(normalized,env),true);
});
test('out-of-lesson, forged origin, production and malformed source requests fail closed',()=>{
  for(const page of ['000','065','100','001/extra','01'])assert.equal(isP030AudioRequest(request(page),env),false);
  for(const patch of [{NODE_ENV:'production'},{VERCEL_ENV:'preview'},{HELP_MATH_G678_LOCAL_PREVIEW:undefined},{HELP_MATH_G678_CALIBRATION_PHASE:undefined},{HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0'}])assert.equal(isP030AudioRequest(request(),{...env,...patch}),false);
  for(const [key,value]of [['referer',origin+'/en/migration-status/g678-calibration/shared-nms002-l01-p030'],['referer','http://localhost:3343/en/migration-status/g678-calibration/shared-nms002-l02-p030'],['referer',origin+'/fr/migration-status/g678-calibration/shared-nms002-l02-p030'],['host','example.com:3343'],['x-forwarded-host','example.com'],['origin','https://example.com'],['sec-fetch-site','cross-site'],['sec-fetch-mode','navigate'],['sec-fetch-dest','audio'],['range','bytes=0-100']]){const r=request();r.headers.set(key!,value!);assert.equal(isP030AudioRequest(r,env),false,key);}
  for(const method of ['POST','HEAD','OPTIONS']){const r=request();r.method=method;assert.equal(isP030AudioRequest(r,env),false);}
  const bad=request();bad.url.searchParams.set('sha256','0'.repeat(64));assert.equal(isP030AudioRequest(bad,env),false);
  const extra=request();extra.url.searchParams.append('sha256',extra.url.searchParams.get('sha256')!);assert.equal(isP030AudioRequest(extra,env),false);
  const path=request();path.url.pathname+='/extra';assert.equal(isP030AudioRequest(path,env),false);
});
