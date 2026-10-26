import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isP052PreviewRequest} from '../../../apps/web/lib/nms-l02-p052-preview-access';
import {CONTINUOUS_AUDIO_PHASE} from '../../../apps/web/lib/continuous-source-audio-access';
const env={NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',
 HELP_MATH_G678_CALIBRATION_PHASE:CONTINUOUS_AUDIO_PHASE,HELP_MATH_G678_P052_AUDIO_CANDIDATE:'1'};
test('explicit engineering admission allows EN/ES loopback only',()=>{
 const h=new Headers({host:'127.0.0.1:3232'});
 for(const lang of ['en','es'])assert.equal(isP052PreviewRequest(h,lang,env),true);
 for(const lang of ['fr','EN','', '../en'])assert.equal(isP052PreviewRequest(h,lang,env),false);
 for(const patch of [{NODE_ENV:'production'},{VERCEL_ENV:'preview'},{HELP_MATH_G678_LOCAL_PREVIEW:'0'},
  {HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0'},{HELP_MATH_G678_CALIBRATION_PHASE:'wrong'},{HELP_MATH_G678_P052_AUDIO_CANDIDATE:undefined}])
  assert.equal(isP052PreviewRequest(h,'en',{...env,...patch}),false);
});
test('missing, remote, credential-bearing and mismatched forwarded authority fail closed',()=>{
 for(const host of ['', 'example.com','user@127.0.0.1:3232','127.0.0.1:3232/path','127.0.0.1:3232,localhost:3232'])
  assert.equal(isP052PreviewRequest(new Headers({host}),'en',env),false);
 assert.equal(isP052PreviewRequest(new Headers(),'en',env),false);
 assert.equal(isP052PreviewRequest(new Headers({host:'127.0.0.1:3232','x-forwarded-host':'127.0.0.1:3233'}),'en',env),false);
});
test('default English locale rewrite admits only the observed loopback alias on the same port',()=>{
 const allowed=new Headers({host:'localhost:3233','x-forwarded-host':'127.0.0.1:3233'});
 assert.equal(isP052PreviewRequest(allowed,'en',env),true);
 for(const patch of [{NODE_ENV:'production'},{VERCEL_ENV:'preview'},{HELP_MATH_G678_LOCAL_PREVIEW_BIND:'0.0.0.0'}])
  assert.equal(isP052PreviewRequest(allowed,'en',{...env,...patch}),false);
 for(const [host,forwarded]of [
  ['localhost:3233','127.0.0.1:3234'],['localhost','127.0.0.1'],
  ['127.0.0.1:3233','localhost:3233'],['localhost:3233','[::1]:3233'],
  ['localhost:3233','example.com:3233'],['localhost:3233','user@127.0.0.1:3233'],
  ['localhost:3233','127.0.0.1:3233,example.com'],
 ])assert.equal(isP052PreviewRequest(new Headers({host,'x-forwarded-host':forwarded}),'en',env),false,`${host} ${forwarded}`);
});
