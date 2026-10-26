import assert from 'node:assert/strict';
import {test} from 'node:test';
import {isP047AudioRequest,P047_AUDIO_PREFIX} from '../lib/nms-l01-p047-audio-access';
const env={NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'true',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',HELP_MATH_G678_CALIBRATION_PHASE:'frozen16-continuous-audio-provisional-browser-qa'};
function request(id='p047-q1-question-en') {return {method:'GET',url:new URL(`http://127.0.0.1:3343${P047_AUDIO_PREFIX}${id}?sha256=${'a'.repeat(64)}`),headers:new Headers({host:'127.0.0.1:3343','sec-fetch-site':'same-origin','sec-fetch-mode':'cors','sec-fetch-dest':'empty',referer:'http://127.0.0.1:3343/en/migration-status/g678-calibration/shared-nms002-l01-p047'})};}
test('all270 exact quiz audio paths admit only the current private loopback phase',()=>{
 for(let q=1;q<=27;q++)for(const language of['en','es'])for(const choice of['question','A','B','C','D'])assert.equal(isP047AudioRequest(request(`p047-q${q}-${choice}-${language}`),env),true);
});
test('production, remote, wrong phase, other lessons, range and cross-origin access fail closed',()=>{
 for(const change of[{NODE_ENV:'production'},{VERCEL_ENV:'preview'},{HELP_MATH_G678_LOCAL_PREVIEW:'false'},{HELP_MATH_G678_CALIBRATION_PHASE:'other'},{HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0'}])assert.equal(isP047AudioRequest(request(),{...env,...change}),false);
 for(const [key,value]of[['host','example.com'],['host','127.0.0.1:3000'],['sec-fetch-site','cross-site'],['sec-fetch-mode','no-cors'],['sec-fetch-dest','audio'],['range','bytes=0-10'],['origin','http://localhost:3343'],['referer','http://127.0.0.1:3343/en/migration-status/g678-calibration/shared-nms002-l02-p047'],['x-forwarded-host','example.com']]){const r=request();r.headers.set(key,value);assert.equal(isP047AudioRequest(r,env),false,key);}
 for(const id of['p047-q0-question-en','p047-q28-A-en','p047-q01-A-en','p047-q1-E-en','p047-q1-A-EN','p045-q1-A-en','../source.swf'])assert.equal(isP047AudioRequest(request(id),env),false,id);
 for(const method of['POST','HEAD','OPTIONS']){const r=request();r.method=method;assert.equal(isP047AudioRequest(r,env),false);}
});
test('digest parameter must be single and exact-shaped',()=>{
 for(const query of['','?sha256=bad',`?sha256=${'a'.repeat(64)}&x=1`,`?sha256=${'a'.repeat(64)}&sha256=${'a'.repeat(64)}`]){const r=request();r.url.search=query;assert.equal(isP047AudioRequest(r,env),false);}
});

test('NextURL loopback normalization retains exact actual origin and port',()=>{
 const r=request();r.url.hostname='localhost';assert.equal(isP047AudioRequest(r,env),true);
 for(const [key,value]of[['host','example.com:3343'],['host','127.0.0.1:3344'],['referer','http://localhost:3343/en/migration-status/g678-calibration/shared-nms002-l01-p047'],['origin','http://localhost:3343']]){const changed={...r,headers:new Headers(r.headers)};changed.headers.set(key,value);assert.equal(isP047AudioRequest(changed,env),false,key);}
});
