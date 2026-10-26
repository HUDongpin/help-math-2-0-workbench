import assert from 'node:assert/strict';
import test from 'node:test';
import {isNmsL2IntroductionAudioRequest} from '../lib/nms-l02-introduction-audio-successor-access';
import {isP002AudioRequest} from '../lib/nms-l02-p002-audio-access';
import {CONTINUOUS_AUDIO_PHASE} from '../lib/continuous-source-audio-access';
const env={NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'true',HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',HELP_MATH_G678_CALIBRATION_PHASE:CONTINUOUS_AUDIO_PHASE};
const origin='http://127.0.0.1:3343',hash='90b4efedd2a6d49fa5c869d20269239e8b397293447a704753ab7fbe3d8933e4';
function request(page='002') {return {method:'GET',url:new URL(origin+'/flash-assets/g678-local/shared-nms002-l02-p002/lesson-introduction-audio?sha256='+hash),headers:new Headers({host:'127.0.0.1:3343',referer:origin+'/en/migration-status/g678-calibration/shared-nms002-l02-p'+page,'sec-fetch-site':'same-origin','sec-fetch-mode':'cors','sec-fetch-dest':'empty'})};}
test('the new introduction endpoint accepts only its exact original bytes and NMS L2 family',()=>{
  for(let page=1;page<=64;page++){const r=request(String(page).padStart(3,'0'));assert.equal(isNmsL2IntroductionAudioRequest(r,env),true);assert.equal(isP002AudioRequest(r,env),false);}
  for(const page of ['000','065','999'])assert.equal(isNmsL2IntroductionAudioRequest(request(page),env),false);
  const wrong=request();wrong.url.searchParams.set('sha256','7ebbf9e4485ca278e38cca90125c95cc7a7a450031aab39be070d1d684ecf6d6');assert.equal(isNmsL2IntroductionAudioRequest(wrong,env),false);
  const original=request();original.url.pathname='/flash-assets/g678-local/shared-nms002-l02-p001/source-audio';assert.equal(isNmsL2IntroductionAudioRequest(original,env),false);
  const repeat=request();repeat.url.searchParams.append('sha256',hash);assert.equal(isNmsL2IntroductionAudioRequest(repeat,env),false);
  const cross=request();cross.headers.set('referer','https://example.com/en/migration-status/g678-calibration/shared-nms002-l02-p002');assert.equal(isNmsL2IntroductionAudioRequest(cross,env),false);
  assert.equal(isNmsL2IntroductionAudioRequest(request(),{...env,NODE_ENV:'production'}),false);
  assert.equal(isNmsL2IntroductionAudioRequest(request(),{...env,VERCEL_ENV:'preview'}),false);
});
