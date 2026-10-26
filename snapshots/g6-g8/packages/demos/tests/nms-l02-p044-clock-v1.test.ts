import test from 'node:test';
import assert from 'node:assert/strict';
import {p044Question} from '../src/nms-l02-p044-practice-v1';
import {p044ClockInitial,p044ClockPlay,p044ClockPause,p044ClockSync,p044ClockDuration,p044ClockDomain,p044ClockParts,p044ClockToggle,p044ClockCheck,p044ClockClose,p044ClockNew,p044ClockReplay,p044ClockMainFrame} from '../src/nms-l02-p044-clock-v1';
const ready=(seed=0)=>p044ClockSync(p044ClockPlay(p044ClockInitial(seed),0),40);
test('intro holds visual361 through nonzero audio tail; pause does not consume remaining time',()=>{
  const initial=p044ClockInitial(),playing=p044ClockPlay(initial,10);
  const held=p044ClockPause(playing,40.125);assert.equal(held.state.phase,'intro');assert.equal(held.elapsed,30.125);assert.equal(p044ClockMainFrame(held),361);
  assert.equal(p044ClockSync(held,100),held);
  const resumed=p044ClockPlay(held,100);assert.equal(p044ClockSync(resumed,101).state.phase,'intro');
  assert.equal(p044ClockSync(resumed,103).state.phase,'ready');
});
test('wrong feedback persists after audio and second error waits for revealframe25',()=>{
  for(let seed=0;seed<4;seed++){
    let c=p044ClockCheck(ready(seed));assert.equal(c.wrongBranch,seed);assert.equal(p044ClockDomain(c),'242');
    c=p044ClockSync(p044ClockPlay(c,50),55);assert.equal(c.state.phase,'wrong-feedback');
    c=p044ClockCheck(p044ClockClose(c));assert.equal(c.state.phase,'answer-reveal');assert.equal(c.wrongBranch,(seed+1)%4);assert.equal(p044ClockDuration(c),2);
    const reveal=p044ClockPlay(c,60);assert.equal(p044ClockSync(reveal,61.999).state.phase,'answer-reveal');
    assert.equal(p044ClockSync(reveal,62).state.phase,'awaiting-new');
  }
});
test('correct close governs four questions; final silent continuation and Replay remain separate',()=>{
  let c=ready(8);
  for(let i=0;i<4;i++){
    const q=p044Question(c.state);c=p044ClockParts(c,q.denominator);for(let n=1;n<=q.numerator;n++)c=p044ClockToggle(c,n);
    c=p044ClockCheck(c);assert.equal(p044ClockDomain(c),'240');c=p044ClockSync(p044ClockPlay(c,100),105);assert.equal(c.state.phase,'correct-feedback');
    c=p044ClockClose(c);if(i<3)c=p044ClockNew(c);
  }
  assert.equal(c.state.phase,'continuation');assert.equal(p044ClockDomain(c),null);assert.equal(p044ClockDuration(c),32/12);
  const run=p044ClockPlay(c,200);assert.equal(p044ClockSync(run,202).state.phase,'continuation');
  c=p044ClockSync(run,203);assert.equal(c.state.phase,'complete');assert.equal(p044ClockMainFrame(c),393);
  c=p044ClockReplay(c);assert.equal(c.state.phase,'intro');assert.equal(c.elapsed,0);assert.equal(c.anchor,null);assert.equal(c.state.replay,1);
  assert.throws(()=>p044ClockPlay(c,NaN),/TIME/);assert.throws(()=>p044ClockSync(p044ClockPlay(c,10),9),/REVERSED/);
});
