import test from 'node:test';
import assert from 'node:assert/strict';
import {isP045RuntimeModule,isP045RuntimeScope,P045_RUNTIME_ID} from '../lib/nms-l02-p045-runtime-access';
import {P045_FRAME_DOMAINS,P045_SOURCE_SHA256} from '../../../packages/demos/src/nms-l02-p045-frame-v1';
import {P045_AUDIO_PLANS} from '../../../packages/demos/src/generated/nms-l02-p045-audio-plan-v1';
test('P045 interactive scope excludes production, provider preview and deterministic capture',()=>{
  const props={audioEnabled:true,animationId:P045_RUNTIME_ID,moduleKey:P045_RUNTIME_ID,query:{lang:'en',frameDomain:'sprite-204',scenario:'source-inspection'}};
  assert.ok(isP045RuntimeScope(props,{NODE_ENV:'development'}));
  for(const env of [{NODE_ENV:'production'},{NODE_ENV:'development',VERCEL_ENV:'preview'}])assert.equal(isP045RuntimeScope(props,env),false);
  for(const patch of [{capture:'1'},{scenario:'four-matches-completion'},{frameDomain:'root'},{lang:'es'}])assert.equal(isP045RuntimeScope({...props,query:{...props.query,...patch}},{NODE_ENV:'development'}),false);
});
test('module identity binds all source frame domains and complete audio plan',()=>{
  const m={key:P045_RUNTIME_ID,maturity:'private-current-js',runtime:{defaultFrameDomain:'sprite-204',frameCount:10,fps:12,frameDomains:Object.entries(P045_FRAME_DOMAINS).map(([id,frameCount])=>({id,frameCount,rootFrame:6}))},textPresentation:{Renderer:()=>null},privateP045FractionInput:{version:1,sourceSwfSha256:P045_SOURCE_SHA256,audio:P045_AUDIO_PLANS}};
  assert.ok(isP045RuntimeModule(m));
  assert.equal(isP045RuntimeModule({...m,privateP045FractionInput:{...m.privateP045FractionInput,audio:{}}}),false);
  assert.equal(isP045RuntimeModule({...m,runtime:{...m.runtime,frameDomains:m.runtime.frameDomains.slice(1)}}),false);
  assert.equal(isP045RuntimeModule({get runtime(){throw Error('bad');}}),false);
});
