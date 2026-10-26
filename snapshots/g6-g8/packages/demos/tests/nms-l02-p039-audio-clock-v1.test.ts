import assert from'node:assert/strict';import test from'node:test';
import {p039ClockInitial,p039AdvanceClock,p039ClockPage,p039ClockPress,p039AudioWindows}from'../src/nms-l02-p039-audio-clock-v1';
import {p039Submit,p039CloseWrong,p039SetPercent}from'../src/nms-l02-p039-state-v1';
const practice=(seed=0)=>p039AdvanceClock(p039ClockInitial(seed),545/12);
test('source main stops546 regardless of excess clock time',()=>{const s=p039AdvanceClock(p039ClockInitial(),80);assert.equal(s.page.mainFrame,546);assert.equal(s.fraction,0);assert(s.page.enabled);assert.equal(p039AudioWindows(s).length,0);});
test('coach S2/S3/S4 natural tails survive their local stop and first Close',()=>{
 for(const [branch,stopSeconds]of[[1,9/12],[2,5/12],[3,14/12]]as const){let c=practice(branch);c=p039ClockPage(c,p039Submit(c.page));c=p039AdvanceClock(c,stopSeconds);assert(!c.page.coachPlaying);assert(c.coachSeconds!==null);assert(p039AudioWindows(c).some(w=>w.buffer==='coach-'+branch));c=p039ClockPage(c,p039CloseWrong(c.page));assert(c.page.enabled);assert(c.coachSeconds!==null);c=p039AdvanceClock(c,2);assert.equal(c.coachSeconds,null);assert(!p039AudioWindows(c).some(w=>w.buffer.startsWith('coach-')));}
});
test('new wrong replaces voice; correct preserves existing voice until main547 removal',()=>{
 let c=practice(3);c=p039ClockPage(c,p039Submit(c.page));c=p039AdvanceClock(c,.1);c=p039ClockPage(c,p039CloseWrong(c.page));c=p039ClockPage(c,p039Submit(c.page));assert.equal(c.page.coachBranch,0);assert.equal(c.coachSeconds,0);
 c=practice(3);c=p039ClockPage(c,p039Submit(c.page));c=p039ClockPage(c,p039CloseWrong(c.page));c=p039ClockPage(c,p039SetPercent(c.page,25));c=p039ClockPage(c,p039Submit(c.page));assert(p039AudioWindows(c).some(w=>w.buffer==='234'));assert(p039AudioWindows(c).some(w=>w.buffer==='coach-3'));c=p039AdvanceClock(c,1);assert.equal(c.page.mainFrame,547);assert.equal(c.coachSeconds,null);
});
test('press release/cancel and natural expiry do not advance a waiting page',()=>{let c=practice();c=p039ClockPress(c,true);c=p039AdvanceClock(c,.1);assert(p039AudioWindows(c).some(w=>w.buffer==='223'));c=p039ClockPress(c,false);assert.equal(c.pressSeconds,null);c=p039ClockPress(c,true);c=p039AdvanceClock(c,1);assert.equal(c.pressSeconds,null);assert.equal(c.page.mainFrame,546);});
test('clock is invariant to polling intervals across intro and correction sequence',()=>{let a=p039ClockInitial(),b=p039ClockInitial();a=p039AdvanceClock(a,45.5);for(let i=0;i<455;i++)b=p039AdvanceClock(b,.1);assert.deepEqual(a,b);for(const c of [a,b])assert.equal(c.page.mainFrame,546);for(const value of [-1,NaN,Infinity])assert.throws(()=>p039AdvanceClock(a,value));});
