import assert from 'node:assert/strict';
import test from 'node:test';
import {isP052AudioRequest,P052_AUDIO_PREFIX} from '../lib/nms-l02-p052-audio-access';
import {P052_AUDIO_PLANS} from '../../../packages/demos/src/generated/nms-l02-p052-runtime-audio-v1';
import {CONTINUOUS_AUDIO_PHASE} from '../lib/continuous-source-audio-access';

const env={NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',
 HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',HELP_MATH_G678_P052_AUDIO_CANDIDATE:'1',
 HELP_MATH_G678_CALIBRATION_PHASE:CONTINUOUS_AUDIO_PHASE};
function request(domain:string,locale:string,page='p055'){
 const plan=P052_AUDIO_PLANS[domain as keyof typeof P052_AUDIO_PLANS];
 return {method:'GET',url:new URL(`http://127.0.0.1:3331${P052_AUDIO_PREFIX}${domain}?sha256=${plan.inputSha256}`),
  headers:new Headers({host:'127.0.0.1:3331',referer:`http://127.0.0.1:3331/${locale?locale+'/':''}migration-status/g678-calibration/shared-nms002-l02-${page}`,
   'sec-fetch-site':'same-origin','sec-fetch-mode':'cors','sec-fetch-dest':'empty'})};
}
test('all six predecessor streams remain accessible in exactly the two reviewed lesson hosts',()=>{
 for(const domain of Object.keys(P052_AUDIO_PLANS))for(const locale of ['en','es',''])for(const page of ['p052','p055'])
  assert.equal(isP052AudioRequest(request(domain,locale,page),domain,env),true,`${domain}/${locale}/${page}`);
});
test('successor access retains local environment and complete request denials',()=>{
 const domain='sprite-350';
 for(const patch of [{NODE_ENV:'production'},{VERCEL_ENV:'preview'},{HELP_MATH_G678_LOCAL_PREVIEW:'0'},
  {HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0'},{HELP_MATH_G678_P052_AUDIO_CANDIDATE:undefined},
  {HELP_MATH_G678_CALIBRATION_PHASE:'other'}])
  assert.equal(isP052AudioRequest(request(domain,'es'),domain,{...env,...patch}),false);
 for(const [key,value] of [['range','bytes=0-1'],['sec-fetch-site','cross-site'],['sec-fetch-mode','navigate'],
  ['sec-fetch-dest','audio'],['host','127.0.0.1:3332'],['x-forwarded-host','127.0.0.1:3332'],
  ['origin','http://localhost:3331'],['referer','http://127.0.0.1:3332/es/migration-status/g678-calibration/shared-nms002-l02-p055']]){
  const r=request(domain,'es');r.headers.set(key!,value!);assert.equal(isP052AudioRequest(r,domain,env),false,key);
 }
 for(const page of ['p051','p054','p056','p055/extra','p055-candidate'])
  assert.equal(isP052AudioRequest(request(domain,'es',page),domain,env),false,page);
 for(const locale of ['fr','EN'])assert.equal(isP052AudioRequest(request(domain,locale),domain,env),false);
 for(const suffix of ['&extra=1','&sha256=x','#fragment']){
  const r=request(domain,'es');r.url=new URL(r.url.href+suffix);assert.equal(isP052AudioRequest(r,domain,env),false);
 }
 const r=request(domain,'es');r.method='POST';assert.equal(isP052AudioRequest(r,domain,env),false);
 for(const unknown of ['__proto__','constructor','sprite-999'])assert.equal(isP052AudioRequest(request(domain,'es'),unknown,env),false);
});
