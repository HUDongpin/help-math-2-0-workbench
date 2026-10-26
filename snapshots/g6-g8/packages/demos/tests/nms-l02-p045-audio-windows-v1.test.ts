import test from 'node:test';
import assert from 'node:assert/strict';
import {P045_FIXED_WINDOWS,P045_SOURCE_FEEDBACK_TIMING,p045WrongWindow,p045WindowPcm} from '../src/nms-l02-p045-audio-windows-v1';
import {P045_AUDIO_PLANS} from '../src/generated/nms-l02-p045-audio-plan-v1';
import {p045ClockInitial,p045ClockPlay,p045ClockSync,p045ClockCheck} from '../src/nms-l02-p045-clock-v1';
test('source wrong windows exclude adjacent labels and retain their own trailing interval',()=>{
 const windows=[0,1,2,3].map(p045WrongWindow);for(let i=0;i<3;i++)assert.equal(windows[i].end,windows[i+1].start);assert.equal(windows[0].start,3675);assert.equal(windows[3].end,P045_AUDIO_PLANS['197'].totalSamples);
 const pcm=new Float32Array(P045_AUDIO_PLANS['197'].totalSamples);for(let i=0;i<4;i++)pcm.fill(i+1,windows[i].start,windows[i].end);for(let i=0;i<4;i++)assert(p045WindowPcm(pcm,windows[i]).every(x=>x===i+1));assert.throws(()=>p045WrongWindow(4));
});
test('main windows meet at practice hold and stop before separately preserved terminal tail',()=>{
 const a=P045_FIXED_WINDOWS.intro,b=P045_FIXED_WINDOWS.continuation;assert.equal(a.end,b.start);assert.equal(b.end-b.start,4*22050);assert.equal(P045_AUDIO_PLANS['204'].totalSamples-b.end,1477);assert.throws(()=>p045WindowPcm(new Float32Array(10),a));
});
test('real plan feedback duration drives the clock without automatic feedback closure',()=>{
 let c=p045ClockInitial(0,P045_SOURCE_FEEDBACK_TIMING);c=p045ClockSync(p045ClockPlay(c,0),449/12);c=p045ClockCheck(c);c=p045ClockSync(p045ClockPlay(c,0),P045_SOURCE_FEEDBACK_TIMING.wrong[c.wrongBranch]);assert.equal(c.state.phase,'wrong-feedback');assert.equal(c.anchor,null);
});
