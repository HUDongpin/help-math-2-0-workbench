import test from 'node:test';
import assert from 'node:assert/strict';
import {p045ClockInitial,p045ClockPlay,p045ClockPause,p045ClockSync,p045ClockDuration,p045ClockMainFrame,p045ClockInput,p045ClockCheck,p045ClockClose,p045ClockNew,p045ClockReplay} from '../src/nms-l02-p045-clock-v1';
import {p045Question} from '../src/nms-l02-p045-practice-v1';
const timing={correct:1.7,wrong:[1.4,1.2,.9,1.5]as const}; // Synthetic durations exercise the clock contract, not source audio acceptance.
function ready(){const c=p045ClockInitial(0,timing);return p045ClockSync(p045ClockPlay(c,0),449/12);}
test('intro pauses exactly and a late tick cannot skip the practice hold',()=>{
 let c=p045ClockPlay(p045ClockInitial(0,timing),10);c=p045ClockPause(c,20);assert.equal(c.elapsed,10);assert.equal(p045ClockMainFrame(c),121);assert.equal(p045ClockSync(c,1000),c);
 c=p045ClockPlay(c,1000);c=p045ClockSync(c,2000);assert.equal(c.state.phase,'ready');assert.equal(p045ClockMainFrame(c),450);assert.equal(c.anchor,null);assert.equal(c.elapsed,0);assert.equal(p045ClockPlay(c,2001),c);
});
test('feedback audio end does not close dialogs; second Close enters reveal2 and reaches source callback25',()=>{
 let c=p045ClockCheck(ready());c=p045ClockSync(p045ClockPlay(c,0),100);assert.equal(c.state.phase,'wrong-feedback');c=p045ClockClose(c);c=p045ClockCheck(c);c=p045ClockClose(c);assert.equal(c.state.phase,'answer-reveal');assert.equal(p045ClockDuration(c),23/12);c=p045ClockPlay(c,0);c=p045ClockSync(c,1.9);assert.equal(c.state.phase,'answer-reveal');c=p045ClockSync(c,23/12);assert.equal(c.state.phase,'awaiting-new');assert.equal(c.anchor,null);
});
test('three answers require final48frame continuation and Replay restores initial clock',()=>{
 let c=ready();for(let i=0;i<3;i++){const q=p045Question(c.state);c=p045ClockInput(p045ClockInput(c,'numerator',q.numerator),'denominator',q.denominator);c=p045ClockCheck(c);c=p045ClockSync(p045ClockPlay(c,0),100);assert.equal(c.state.phase,'correct-feedback');c=p045ClockClose(c);if(i<2)c=p045ClockNew(c);}
 assert.equal(c.state.phase,'continuation');c=p045ClockPlay(c,0);c=p045ClockSync(c,3);assert.equal(p045ClockMainFrame(c),486);c=p045ClockSync(c,4);assert.equal(c.state.phase,'complete');assert.equal(p045ClockMainFrame(c),498);c=p045ClockReplay(c);assert.equal(c.state.phase,'intro');assert.equal(c.elapsed,0);assert.equal(c.anchor,null);assert.equal(c.state.replay,1);
});
test('invalid feedback timings and reversed running clocks are rejected',()=>{
 assert.throws(()=>p045ClockInitial(0,{correct:0,wrong:[1,1,1,1]}));assert.throws(()=>p045ClockPlay(ready(),NaN));assert.throws(()=>p045ClockSync(p045ClockPlay(p045ClockInitial(0,timing),10),9));
});
