import test from 'node:test';
import assert from 'node:assert/strict';
import {isP044RuntimeModule,isP044RuntimeScope,P044_RUNTIME_ID} from '../lib/nms-l02-p044-runtime-access';
import {P044_FRAME_DOMAINS,P044_SOURCE_SHA256} from '../../../packages/demos/src/nms-l02-p044-frame-v1';
import {P044_AUDIO_PLANS} from '../../../packages/demos/src/generated/nms-l02-p044-audio-plan-v1';
test('P044 interactive scope excludes production, provider preview and deterministic capture',()=>{
  const props={audioEnabled:true,animationId:P044_RUNTIME_ID,moduleKey:P044_RUNTIME_ID,query:{lang:'en',frameDomain:'sprite-243',scenario:'source-inspection'}};
  assert.ok(isP044RuntimeScope(props,{NODE_ENV:'development'}));
  for(const env of [{NODE_ENV:'production'},{NODE_ENV:'development',VERCEL_ENV:'preview'}])assert.equal(isP044RuntimeScope(props,env),false);
  for(const patch of [{capture:'1'},{scenario:'four-matches-completion'},{frameDomain:'root'},{lang:'es'}])assert.equal(isP044RuntimeScope({...props,query:{...props.query,...patch}},{NODE_ENV:'development'}),false);
});
test('module identity binds all source frame domains and complete audio plan',()=>{
  const m={key:P044_RUNTIME_ID,maturity:'private-current-js',runtime:{defaultFrameDomain:'sprite-243',frameCount:10,fps:12,frameDomains:Object.entries(P044_FRAME_DOMAINS).map(([id,frameCount])=>({id,frameCount,rootFrame:6}))},textPresentation:{Renderer:()=>null},privateP044PartitionPractice:{version:1,sourceSwfSha256:P044_SOURCE_SHA256,audio:P044_AUDIO_PLANS}};
  assert.ok(isP044RuntimeModule(m));
  assert.equal(isP044RuntimeModule({...m,privateP044PartitionPractice:{...m.privateP044PartitionPractice,audio:{}}}),false);
  assert.equal(isP044RuntimeModule({...m,runtime:{...m.runtime,frameDomains:m.runtime.frameDomains.slice(1)}}),false);
  assert.equal(isP044RuntimeModule({get runtime(){throw Error('bad');}}),false);
});
