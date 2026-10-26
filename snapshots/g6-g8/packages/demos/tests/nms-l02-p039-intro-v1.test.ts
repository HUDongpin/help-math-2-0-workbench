import assert from 'node:assert/strict';
import test from 'node:test';
import {p039IntroAt} from '../src/nms-l02-p039-intro-v1';
import {p039Initial,p039Advance,p039Replay} from '../src/nms-l02-p039-state-v1';

test('intro follows ten-fill, clear, twenty-five-fill and cumulative emphasis source beats', () => {
  for(const [frame,count] of [[33,0],[34,1],[43,10],[52,10],[53,9],[62,0],[133,0],[134,1],[158,25],[448,25],[449,0],[545,0]])
    assert.equal(p039IntroAt(frame).filled.length,count,`filled ${frame}`);
  for(const [frame,count] of [[286,0],[287,10],[302,20],[368,21],[381,22],[394,23],[400,23],[409,24],[421,25],[449,0]])
    assert.equal(p039IntroAt(frame).outlined.length,count,`outlined ${frame}`);
  assert.deepEqual(p039IntroAt(134).filled,[90]);
  assert.deepEqual(p039IntroAt(400).filled,[0,1,10,11,20,21,30,31,40,41,50,51,52,60,61,62,70,71,72,80,81,82,90,91,92]);
});
test('both instruction lines reveal independently with no duplicate Done label', () => {
  assert(!p039IntroAt(60).sentences[0].complete);
  assert(p039IntroAt(61).sentences[0].complete);
  assert.equal(p039IntroAt(513).sentences[1].visibleOffsets.length,0);
  assert(!p039IntroAt(534).sentences[1].complete);
  const end=p039IntroAt(535);
  assert(end.sentences[1].complete);
  assert.equal(end.sentences[1].maskedText,'When you have finished, click the Done button.');
  assert.equal(end.sentences.length,2);
});
test('all main intro states are queryable, immutable and repeatable after Replay', () => {
  for(let frame=1;frame<=545;frame++){
    const state=p039Advance(p039Initial(),frame-1);
    const pose=p039IntroAt(state.mainFrame);
    assert(Object.isFrozen(pose)&&Object.isFrozen(pose.filled));
    assert.equal(pose.frame,frame);
    for(const cell of pose.outlined)assert(pose.filled.some(filled => filled === cell));
    const replay=p039Advance(p039Replay(state),frame-1);
    assert.deepEqual(p039IntroAt(replay.mainFrame),pose);
  }
  for(const frame of [0,546,579,1.5,NaN,Infinity])assert.throws(()=>p039IntroAt(frame),/P039_INTRO_FRAME/);
});
