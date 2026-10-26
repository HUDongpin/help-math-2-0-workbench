import test from 'node:test';
import assert from 'node:assert/strict';
import {isP046RuntimeModule,isP046RuntimeScope,P046_RUNTIME_ID} from '../lib/nms-l02-p046-runtime-access';
import {P046_FRAME_DOMAINS,P046_SOURCE_SHA256} from '../../../packages/demos/src/nms-l02-p046-frame-v1';
import {P046_AUDIO_PLANS} from '../../../packages/demos/src/generated/nms-l02-p046-audio-plan-v1';
test('P046 interactive scope excludes production, provider preview and deterministic capture',()=>{
  const props={audioEnabled:true,animationId:P046_RUNTIME_ID,moduleKey:P046_RUNTIME_ID,query:{lang:'en',frameDomain:'sprite-205',scenario:'source-inspection'}};
  assert.ok(isP046RuntimeScope(props,{NODE_ENV:'development'}));
  for(const env of [{NODE_ENV:'production'},{NODE_ENV:'development',VERCEL_ENV:'preview'}])assert.equal(isP046RuntimeScope(props,env),false);
  for(const patch of [{capture:'1'},{scenario:'four-matches-completion'},{frameDomain:'root'},{lang:'es'}])assert.equal(isP046RuntimeScope({...props,query:{...props.query,...patch}},{NODE_ENV:'development'}),false);
});
test('module identity binds all source frame domains and complete audio plan',()=>{
  const m={key:P046_RUNTIME_ID,maturity:'private-current-js',runtime:{defaultFrameDomain:'sprite-205',frameCount:10,fps:12,frameDomains:Object.entries(P046_FRAME_DOMAINS).map(([id,frameCount])=>({id,frameCount,rootFrame:6}))},textPresentation:{Renderer:()=>null},privateP046FractionInput:{version:1,sourceSwfSha256:P046_SOURCE_SHA256,audio:P046_AUDIO_PLANS}};
  assert.ok(isP046RuntimeModule(m));
  for(const patch of [{key:'shared-nms002-l02-p045'},{maturity:'draft'},{textPresentation:{Renderer:null}},{privateP046FractionInput:{...m.privateP046FractionInput,sourceSwfSha256:'0'.repeat(64)}},{runtime:{...m.runtime,defaultFrameDomain:'sprite-204'}},{runtime:{...m.runtime,frameCount:706}},{runtime:{...m.runtime,fps:24}}])assert.equal(isP046RuntimeModule({...m,...patch}),false);
  for(const [index] of m.runtime.frameDomains.entries()){
    const domains=m.runtime.frameDomains.map((d,i)=>i===index?{...d,frameCount:d.frameCount+1}:d);
    assert.equal(isP046RuntimeModule({...m,runtime:{...m.runtime,frameDomains:domains}}),false);
  }

  assert.equal(isP046RuntimeModule({...m,privateP046FractionInput:{...m.privateP046FractionInput,audio:{}}}),false);
  assert.equal(isP046RuntimeModule({...m,runtime:{...m.runtime,frameDomains:m.runtime.frameDomains.slice(1)}}),false);
  assert.equal(isP046RuntimeModule({get runtime(){throw Error('bad');}}),false);
});
