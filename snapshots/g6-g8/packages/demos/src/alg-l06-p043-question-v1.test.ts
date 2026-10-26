import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {P043_QUESTION_MODEL_SHA256,P043_QUESTION_TEXT,p043QuestionAtFrame}
  from './alg-l06-p043-question-v1';

test('P043 readable question follows exact source text and sprite 342 frame spans',()=>{
  const raw=readFileSync(new URL(
    '../../../migrations/shared-alg001-l06-p043/native-v1/native-model-v1.json',
    import.meta.url));
  assert.equal(createHash('sha256').update(raw).digest('hex'),
    P043_QUESTION_MODEL_SHA256);
  const model=JSON.parse(raw.toString('utf8'));
  const rows=[P043_QUESTION_TEXT.instruction,P043_QUESTION_TEXT.question,
    ...P043_QUESTION_TEXT.stories];
  for(const row of rows){
    assert.equal(model.staticTextDefinitions[String(row.objectId)].text,row.text);
    const instances=model.selectedInstances.filter((instance:{
      spriteId:number;objectId:number;firstFrame:number;lastFrame:number})=>
      instance.spriteId===342&&instance.objectId===row.objectId);
    assert.equal(instances.length,1);
    assert.equal(instances[0].firstFrame,row.firstFrame);
    assert.equal(instances[0].lastFrame,row.lastFrame);
  }
  assert.equal(p043QuestionAtFrame(1),null);
  assert.equal(p043QuestionAtFrame(242),null);
  assert.deepEqual([2,147,148,160,161,186,187,241].map(frame=>
    p043QuestionAtFrame(frame)?.story.objectId),
    [153,153,337,337,340,340,341,341]);
});
