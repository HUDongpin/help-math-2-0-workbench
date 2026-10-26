import assert from 'node:assert/strict';
import test from 'node:test';
import {isNmsL2P022AudioRequest,P022_AUDIO_SOURCES} from '../lib/nms-l02-p022-audio-access';
const isP022AudioRequest=(r:Parameters<typeof isNmsL2P022AudioRequest>[0],env:Parameters<typeof isNmsL2P022AudioRequest>[2])=>isNmsL2P022AudioRequest(r,r.url.pathname.split('/').at(-1)!,env);
import {CONTINUOUS_AUDIO_PHASE} from '../lib/continuous-source-audio-access';
const env={NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'true',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',HELP_MATH_G678_CALIBRATION_PHASE:CONTINUOUS_AUDIO_PHASE};
const origin='http://127.0.0.1:3343';
function request(page='002',lang='en'){
  return {method:'GET',url:new URL(origin+'/flash-assets/g678-local/shared-nms002-l02-p022/source-audio/206?sha256=5e55224c0610911a0b9f9e6be3abbd51d625b675133fe76b77fc57aafa2219e3'),headers:new Headers({host:'127.0.0.1:3343',referer:origin+'/'+lang+'/migration-status/g678-calibration/shared-nms002-l02-p'+page,'sec-fetch-site':'same-origin','sec-fetch-mode':'cors','sec-fetch-dest':'empty'})};
}
test('the 64 exact source lesson page routes can select this audio in either UI locale',()=>{
  for(const lang of ['en','es'])for(let page=1;page<=64;page++)assert.equal(isP022AudioRequest(request(String(page).padStart(3,'0'),lang),env),true);
  const normalized=request();normalized.url.hostname='localhost';assert.equal(isP022AudioRequest(normalized,env),true);
});
test('out-of-lesson, forged origin, production and malformed source requests fail closed',()=>{
  for(const page of ['000','065','100','001/extra','01'])assert.equal(isP022AudioRequest(request(page),env),false);
  for(const patch of [{NODE_ENV:'production'},{VERCEL_ENV:'preview'},{HELP_MATH_G678_LOCAL_PREVIEW:undefined},{HELP_MATH_G678_CALIBRATION_PHASE:undefined},{HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0'}])assert.equal(isP022AudioRequest(request(),{...env,...patch}),false);
  for(const [key,value]of [['referer',origin+'/en/migration-status/g678-calibration/shared-nms002-l01-p009'],['referer','http://localhost:3343/en/migration-status/g678-calibration/shared-nms002-l02-p009'],['referer',origin+'/fr/migration-status/g678-calibration/shared-nms002-l02-p009'],['host','example.com:3343'],['x-forwarded-host','example.com'],['origin','https://example.com'],['sec-fetch-site','cross-site'],['sec-fetch-mode','navigate'],['sec-fetch-dest','audio'],['range','bytes=0-100']]){const r=request();r.headers.set(key!,value!);assert.equal(isP022AudioRequest(r,env),false,key);}
  for(const method of ['POST','HEAD','OPTIONS']){const r=request();r.method=method;assert.equal(isP022AudioRequest(r,env),false);}
  const bad=request();bad.url.searchParams.set('sha256','0'.repeat(64));assert.equal(isP022AudioRequest(bad,env),false);
  const extra=request();extra.url.searchParams.append('sha256',extra.url.searchParams.get('sha256')!);assert.equal(isP022AudioRequest(extra,env),false);
  const path=request();path.url.pathname+='/extra';assert.equal(isP022AudioRequest(path,env),false);
});

test('all nine inventoried sources require their own exact domain and digest',()=>{for(const[domain,source]of Object.entries(P022_AUDIO_SOURCES)){const r=request();r.url=new URL(origin+source.path+'?sha256='+source.sha256);assert.equal(isNmsL2P022AudioRequest(r,domain,env),true);for(const other of Object.keys(P022_AUDIO_SOURCES).filter(d=>d!==domain))assert.equal(isNmsL2P022AudioRequest(r,other,env),false);}for(const domain of ['__proto__','constructor','0','0123','123/extra','105'])assert.equal(isNmsL2P022AudioRequest(request(),domain,env),false);});
