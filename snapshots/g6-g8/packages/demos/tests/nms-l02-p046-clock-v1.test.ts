import test from 'node:test';
import assert from 'node:assert/strict';
import {p046ClockInitial,p046ClockPlay,p046ClockPause,p046ClockSync,p046ClockDuration,p046ClockMainFrame,p046ClockInput,p046ClockCheck,p046ClockClose,p046ClockNew,p046ClockReplay} from '../src/nms-l02-p046-clock-v1';
import {p046Question} from '../src/nms-l02-p046-practice-v1';
import {p046ClockParts,p046ClockToggle,p046ClockHelp} from '../src/nms-l02-p046-clock-v1';
import {P046_SOURCE_FEEDBACK_TIMING} from '../src/nms-l02-p046-audio-windows-v1';
const timing={correct:1.7,wrong:[1.4,1.2,.9,1.5]as const}; // Synthetic durations exercise the clock contract, not source audio acceptance.
function ready(){const c=p046ClockInitial(0,timing);return p046ClockSync(p046ClockPlay(c,0),653/12);}
test('intro pauses exactly and a late tick cannot skip the practice hold',()=>{
 let c=p046ClockPlay(p046ClockInitial(0,timing),10);c=p046ClockPause(c,20);assert.equal(c.elapsed,10);assert.equal(p046ClockMainFrame(c),121);assert.equal(p046ClockSync(c,1000),c);
 c=p046ClockPlay(c,1000);c=p046ClockSync(c,2000);assert.equal(c.state.phase,'ready');assert.equal(p046ClockMainFrame(c),654);assert.equal(c.anchor,null);assert.equal(c.elapsed,0);assert.equal(p046ClockPlay(c,2001),c);
});
test('feedback audio end does not close dialogs; second Close enters reveal2 and reaches source callback25',()=>{
 let c=p046ClockCheck(ready());c=p046ClockSync(p046ClockPlay(c,0),100);assert.equal(c.state.phase,'wrong-feedback');c=p046ClockClose(c);c=p046ClockCheck(c);c=p046ClockClose(c);assert.equal(c.state.phase,'answer-reveal');assert.equal(p046ClockDuration(c),23/12);c=p046ClockPlay(c,0);c=p046ClockSync(c,1.9);assert.equal(c.state.phase,'answer-reveal');c=p046ClockSync(c,23/12);assert.equal(c.state.phase,'awaiting-new');assert.equal(c.anchor,null);
});
test('three answers require final52frame continuation and Replay restores initial clock',()=>{
 let c=ready();for(let i=0;i<3;i++){const q=p046Question(c.state);c=p046ClockInput(p046ClockInput(c,'numerator',q.numerator),'denominator',q.denominator);c=p046ClockCheck(c);c=p046ClockSync(p046ClockPlay(c,0),100);assert.equal(c.state.phase,'correct-feedback');c=p046ClockClose(c);if(i<2)c=p046ClockNew(c);}
 assert.equal(c.state.phase,'continuation');c=p046ClockPlay(c,0);c=p046ClockSync(c,3);assert.equal(p046ClockMainFrame(c),690);c=p046ClockSync(c,52/12);assert.equal(c.state.phase,'complete');assert.equal(p046ClockMainFrame(c),706);c=p046ClockReplay(c);assert.equal(c.state.phase,'intro');assert.equal(c.elapsed,0);assert.equal(c.anchor,null);assert.equal(c.state.replay,1);
});
test('invalid feedback timings and reversed running clocks are rejected',()=>{
 assert.throws(()=>p046ClockInitial(0,{correct:0,wrong:[1,1,1,1]}));assert.throws(()=>p046ClockPlay(ready(),NaN));assert.throws(()=>p046ClockSync(p046ClockPlay(p046ClockInitial(0,timing),10),9));
});
test('source audio durations and partition edits preserve paused practice and locks',()=>{
 let c=p046ClockSync(p046ClockPlay(p046ClockInitial(0,P046_SOURCE_FEEDBACK_TIMING),0),653/12);
 c=p046ClockToggle(p046ClockParts(c,12),7);assert.deepEqual(c.state.selected,[7]);assert.equal(c.anchor,null);assert.equal(p046ClockMainFrame(c),654);
 c=p046ClockHelp(c,true);assert.equal(p046ClockParts(c,2),c);assert.equal(p046ClockToggle(c,1),c);
 c=p046ClockCheck(p046ClockHelp(c,false));const duration=P046_SOURCE_FEEDBACK_TIMING.wrong[c.wrongBranch];
 c=p046ClockSync(p046ClockPlay(c,100),100+duration);assert.equal(c.state.phase,'wrong-feedback');assert.equal(c.anchor,null);
 c=p046ClockReplay(c);assert.equal(c.state.parts,1);assert.deepEqual(c.state.selected,[]);assert.equal(c.timing.correct,P046_SOURCE_FEEDBACK_TIMING.correct);
});
