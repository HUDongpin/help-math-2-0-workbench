import assert from 'node:assert/strict';
import test from 'node:test';
import {lessonTextCompletionAllowed,validateLessonTextCompletion} from './lesson-text-completion';
const capability={id:'source-five-cards-placed',frameDomain:'sprite-160',frames:[126]};
const current={frame:126,frameDomain:'sprite-160',seed:17,replay:2,capture:false};
const request={id:capability.id,frame:126,frameDomain:'sprite-160',seed:17,replay:2};
test('only a declared interaction completion for the current teaching identity can record learner completion',()=>{
  validateLessonTextCompletion(capability,169);
  assert.equal(lessonTextCompletionAllowed(capability,request,current),true);
  for(const override of [{frame:125},{frameDomain:'root'},{seed:18},{replay:1},{capture:true}])
    assert.equal(lessonTextCompletionAllowed(capability,request,{...current,...override}),false);
  assert.equal(lessonTextCompletionAllowed(capability,{...request,id:'another-state'},current),false);
  assert.equal(lessonTextCompletionAllowed(undefined,request,current),false);
});
test('completion metadata must name valid unique frames inside one declared source timeline',()=>{
  for(const change of [{frames:[]},{frames:[126,126]},{frames:[170]},{frames:[0]},{frameDomain:'other'},{id:''}])
    assert.throws(()=>validateLessonTextCompletion({...capability,...change},169));
});
