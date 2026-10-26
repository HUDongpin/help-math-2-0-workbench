import test from 'node:test';
import assert from 'node:assert/strict';
import {isP047RuntimeModule,isP047RuntimeScope,P047_RUNTIME_ID} from '../lib/nms-l02-p047-runtime-access';
import {P047_FRAME_DOMAINS,P047_SOURCE_SHA256} from '../../../packages/demos/src/nms-l02-p047-frame-v1';
import {P047_AUDIO_PLANS} from '../../../packages/demos/src/generated/nms-l02-p047-audio-plan-v1';
test('P047 interactive scope excludes production, provider preview and deterministic capture',()=>{
  const props={audioEnabled:true,animationId:P047_RUNTIME_ID,moduleKey:P047_RUNTIME_ID,query:{lang:'en',frameDomain:'sprite-81',scenario:'source-inspection'}};
  assert.ok(isP047RuntimeScope(props,{NODE_ENV:'development'}));
  for(const env of [{NODE_ENV:'production'},{NODE_ENV:'development',VERCEL_ENV:'preview'}])assert.equal(isP047RuntimeScope(props,env),false);
  for(const patch of [{capture:'1'},{scenario:'four-matches-completion'},{frameDomain:'root'},{lang:'es'}])assert.equal(isP047RuntimeScope({...props,query:{...props.query,...patch}},{NODE_ENV:'development'}),false);
});
test('module identity binds all source frame domains and complete audio plan',()=>{
  const m={key:P047_RUNTIME_ID,maturity:'private-current-js',runtime:{defaultFrameDomain:'sprite-81',frameCount:10,fps:12,frameDomains:Object.entries(P047_FRAME_DOMAINS).map(([id,frameCount])=>({id,frameCount,rootFrame:6}))},textPresentation:{Renderer:()=>null},privateP047NumberLineInput:{version:1,sourceSwfSha256:P047_SOURCE_SHA256,audio:P047_AUDIO_PLANS}};
  assert.ok(isP047RuntimeModule(m));
  for(const patch of [{key:'shared-nms002-l02-p045'},{maturity:'draft'},{textPresentation:{Renderer:null}},{privateP047NumberLineInput:{...m.privateP047NumberLineInput,sourceSwfSha256:'0'.repeat(64)}},{runtime:{...m.runtime,defaultFrameDomain:'sprite-204'}},{runtime:{...m.runtime,frameCount:188}},{runtime:{...m.runtime,fps:24}}])assert.equal(isP047RuntimeModule({...m,...patch}),false);
  for(const [index] of m.runtime.frameDomains.entries()){
    const domains=m.runtime.frameDomains.map((d,i)=>i===index?{...d,frameCount:d.frameCount+1}:d);
    assert.equal(isP047RuntimeModule({...m,runtime:{...m.runtime,frameDomains:domains}}),false);
  }

  assert.equal(isP047RuntimeModule({...m,privateP047NumberLineInput:{...m.privateP047NumberLineInput,audio:{}}}),false);
  assert.equal(isP047RuntimeModule({...m,runtime:{...m.runtime,frameDomains:m.runtime.frameDomains.slice(1)}}),false);
  assert.equal(isP047RuntimeModule({get runtime(){throw Error('bad');}}),false);
});
