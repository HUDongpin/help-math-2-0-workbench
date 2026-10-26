import assert from 'node:assert/strict';
import test from 'node:test';
import {isNmsL2P036AudioRequest,P036_AUDIO_SOURCES} from '../lib/nms-l02-p036-audio-access';
import {CONTINUOUS_AUDIO_PHASE} from '../lib/continuous-source-audio-access';
const env={NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'true',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',HELP_MATH_G678_CALIBRATION_PHASE:CONTINUOUS_AUDIO_PHASE};
const origin='http://127.0.0.1:3343';
function request(domain:keyof typeof P036_AUDIO_SOURCES='89',page='036',lang='en'){
 const s=P036_AUDIO_SOURCES[domain];return {method:'GET',url:new URL(origin+s.path+'?sha256='+s.sha256),headers:new Headers({host:'127.0.0.1:3343',referer:origin+'/'+lang+'/migration-status/g678-calibration/shared-nms002-l02-p'+page,'sec-fetch-site':'same-origin','sec-fetch-mode':'cors','sec-fetch-dest':'empty'})};
}
test('the exact main stream accept exact source lesson pages in both UI languages',()=>{
 assert.equal(Object.keys(P036_AUDIO_SOURCES).length,1);
 for(const domain of Object.keys(P036_AUDIO_SOURCES)as Array<keyof typeof P036_AUDIO_SOURCES>)for(const lang of ['en','es'])for(let page=1;page<=64;page++)assert(isNmsL2P036AudioRequest(request(domain,String(page).padStart(3,'0'),lang),domain,env));
});
test('dormant, mismatched source, malformed path and unsafe contexts fail closed',()=>{
 for(const domain of ['167','172','root','sprite-89','../89','__proto__'])assert.equal(isNmsL2P036AudioRequest(request(),domain,env),false);
 for(const domain of Object.keys(P036_AUDIO_SOURCES)as Array<keyof typeof P036_AUDIO_SOURCES>){
  for(const page of ['000','065','100','001/extra','01'])assert.equal(isNmsL2P036AudioRequest(request(domain,page),domain,env),false);
  for(const patch of [{NODE_ENV:'production'},{VERCEL_ENV:'preview'},{HELP_MATH_G678_LOCAL_PREVIEW:undefined},{HELP_MATH_G678_CALIBRATION_PHASE:undefined},{HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0'}])assert.equal(isNmsL2P036AudioRequest(request(domain),domain,{...env,...patch}),false);
  for(const[key,value]of [['referer',origin+'/en/migration-status/g678-calibration/shared-nms002-l01-p036'],['referer',origin+'/fr/migration-status/g678-calibration/shared-nms002-l02-p036'],['host','example.com:3343'],['x-forwarded-host','example.com'],['origin','https://example.com'],['sec-fetch-site','cross-site'],['sec-fetch-mode','navigate'],['sec-fetch-dest','audio'],['range','bytes=0-100']]){const r=request(domain);r.headers.set(key!,value!);assert.equal(isNmsL2P036AudioRequest(r,domain,env),false,key);}
  for(const method of ['POST','HEAD','OPTIONS']){const r=request(domain);r.method=method;assert.equal(isNmsL2P036AudioRequest(r,domain,env),false);}
  const bad=request(domain);bad.url.searchParams.set('sha256','0'.repeat(64));assert.equal(isNmsL2P036AudioRequest(bad,domain,env),false);
  const extra=request(domain);extra.url.searchParams.append('sha256',extra.url.searchParams.get('sha256')!);assert.equal(isNmsL2P036AudioRequest(extra,domain,env),false);
  const path=request(domain);path.url.pathname+='/extra';assert.equal(isNmsL2P036AudioRequest(path,domain,env),false);
 }
});
