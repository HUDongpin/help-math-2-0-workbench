import test from 'node:test';
import assert from 'node:assert/strict';
import {P047_CARDS} from '../src/nms-l02-p047-practice-v1';
import {P047_WRONG_WINDOWS} from '../src/generated/nms-l02-p047-audio-windows-v1';
import {p047ClockInitial,p047ClockPlay,p047ClockSync,p047ClockPause,p047ClockDuration,p047ClockWindow,p047ClockSelect,p047ClockDrop,p047ClockReplay,p047ClockHelp,p047ClockAudioOffset,p047ClockMainFrame,p047ClockCelebrationFrame,type P047Clock} from '../src/nms-l02-p047-clock-v1';
const finish=(c:P047Clock)=>p047ClockSync(p047ClockPlay(c,100),100+p047ClockDuration(c),c.state.phaseToken);
const ready=()=>finish(p047ClockInitial());
test('intro pause preserves sample offset, long pause consumes no source time',()=>{
 let c=p047ClockPlay(p047ClockInitial(),10);c=p047ClockPause(c,12);assert.equal(c.elapsed,2);assert.equal(p047ClockMainFrame(c),25);assert.equal(p047ClockAudioOffset(c),44100);
 assert.equal(p047ClockSync(c,1000,c.state.phaseToken),c);c=p047ClockPlay(c,1000);c=p047ClockSync(c,1001,c.state.phaseToken);assert.equal(c.elapsed,3);assert.equal(p047ClockAudioOffset(c),66150);
});
test('all wrong branches preserve measured tails before automatically returning ready',()=>{
 const seen=new Set<number>();let c=ready();
 for(let i=0;i<32;i++){
  c=p047ClockDrop(p047ClockSelect(c,1),0);const w=P047_WRONG_WINDOWS[c.state.wrongBranch];seen.add(c.state.wrongBranch);assert.deepEqual(p047ClockWindow(c),w);
  c=p047ClockPlay(c,10);const returnTime=(w.authoredReturn-w.start)/22050;
  if(w.end>w.authoredReturn){c=p047ClockSync(c,10+returnTime,c.state.phaseToken);assert.equal(c.state.phase,'wrong-feedback');}
  c=p047ClockSync(c,10+(w.end-w.start)/22050,c.state.phaseToken);assert.equal(c.state.phase,'ready');assert.equal(c.anchor,null);
 }
 assert.equal(seen.size,4);
});
test('correct feedback tail, celebration and narration remain distinct under delayed ticks',()=>{
 let c=ready();for(const card of P047_CARDS){c=p047ClockDrop(p047ClockSelect(c,card.id),card.tick);const duration=p047ClockDuration(c);c=p047ClockPlay(c,10);c=p047ClockSync(c,10+duration-1/22050,c.state.phaseToken);assert.equal(c.state.phase,'correct-feedback');c=p047ClockSync(c,999,c.state.phaseToken);}
 assert.equal(c.state.phase,'celebration');assert.equal(c.elapsed,0);assert.equal(c.anchor,null);assert.equal(p047ClockMainFrame(c),140);assert.equal(p047ClockCelebrationFrame(c),2);assert.equal(p047ClockDuration(c),23/12);assert.equal(p047ClockWindow(c),null);
 c=finish(c);assert.equal(c.state.phase,'continuation');assert.equal(c.elapsed,0);assert.equal(p047ClockDuration(c),4);assert.equal(p047ClockAudioOffset(c),255412);
 c=finish(c);assert.equal(c.state.phase,'complete');assert.equal(p047ClockMainFrame(c),188);assert.equal(p047ClockPlay(c,1000),c);
});
test('Replay and stale phase updates cannot advance replacement playback',()=>{
 let c=p047ClockDrop(p047ClockSelect(ready(),1),0);const oldToken=c.state.phaseToken;c=p047ClockReplay(c);c=p047ClockPlay(c,100);
 assert.equal(p047ClockSync(c,1000,oldToken),c);assert.equal(c.elapsed,0);assert.equal(c.state.phase,'intro');
});
test('help gates ready input and cannot start an audio clock',()=>{
 let c=p047ClockHelp(ready(),true);assert.equal(p047ClockPlay(c,100),c);assert.equal(p047ClockSelect(c,1),c);assert.equal(p047ClockDrop(c,4),c);
 c=p047ClockHelp(c,false);c=p047ClockSelect(c,1);assert.equal(c.state.selected,1);
});
test('invalid or reversed running time fails explicitly',()=>{
 const c=p047ClockPlay(p047ClockInitial(),10);assert.throws(()=>p047ClockSync(c,9,c.state.phaseToken),/REVERSED/);assert.throws(()=>p047ClockPlay(c,NaN),/TIME/);assert.throws(()=>p047ClockPause(c,-1),/TIME/);
});
