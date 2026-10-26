import test from 'node:test';
import assert from 'node:assert/strict';
import {isP043RuntimeModule,isP043RuntimeScope,P043_RUNTIME_ID} from '../lib/nms-l02-p043-runtime-access';
import {P043_FRAME_DOMAINS,P043_SOURCE_SHA256} from '../../../packages/demos/src/nms-l02-p043-frame-v1';
import {P043_AUDIO_PLANS} from '../../../packages/demos/src/generated/nms-l02-p043-audio-plan-v1';
test('P043 interactive scope excludes production, provider preview and deterministic capture',()=>{
  const props={audioEnabled:true,animationId:P043_RUNTIME_ID,moduleKey:P043_RUNTIME_ID,query:{lang:'en',frameDomain:'sprite-250',scenario:'source-inspection'}};
  assert.ok(isP043RuntimeScope(props,{NODE_ENV:'development'}));
  for(const env of [{NODE_ENV:'production'},{NODE_ENV:'development',VERCEL_ENV:'preview'}])assert.equal(isP043RuntimeScope(props,env),false);
  for(const patch of [{capture:'1'},{scenario:'four-matches-completion'},{frameDomain:'root'},{lang:'es'}])assert.equal(isP043RuntimeScope({...props,query:{...props.query,...patch}},{NODE_ENV:'development'}),false);
});
test('module identity binds all source frame domains and complete audio plan',()=>{
  const m={key:P043_RUNTIME_ID,maturity:'private-current-js',runtime:{defaultFrameDomain:'sprite-250',frameCount:10,fps:12,frameDomains:Object.entries(P043_FRAME_DOMAINS).map(([id,frameCount])=>({id,frameCount,rootFrame:6}))},textPresentation:{Renderer:()=>null},privateP043Matching:{version:1,sourceSwfSha256:P043_SOURCE_SHA256,audio:P043_AUDIO_PLANS}};
  assert.ok(isP043RuntimeModule(m));
  assert.equal(isP043RuntimeModule({...m,privateP043Matching:{...m.privateP043Matching,audio:{}}}),false);
  assert.equal(isP043RuntimeModule({...m,runtime:{...m.runtime,frameDomains:m.runtime.frameDomains.slice(1)}}),false);
  assert.equal(isP043RuntimeModule({get runtime(){throw Error('bad');}}),false);
});
