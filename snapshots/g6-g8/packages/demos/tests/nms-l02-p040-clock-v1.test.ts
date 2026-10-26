import test from 'node:test';import assert from 'node:assert/strict';
import{p040ClockInitial,p040ClockPlay,p040ClockPause,p040ClockSync,p040ClockOpenTerm,p040ClockCloseTerm,p040ClockReplay}from'../src/nms-l02-p040-clock-v1';
test('pause and glossary retain subframe offset; wall time while paused is excluded',()=>{
 let c=p040ClockPlay(p040ClockInitial(),100);c=p040ClockPause(c,105.125);assert.equal(c.elapsed,5.125);assert.equal(c.state.frame,62);
 assert.equal(p040ClockSync(c,999).elapsed,5.125);c=p040ClockPlay(c,1000);c=p040ClockOpenTerm(c,'percent',1000.025);assert(Math.abs(c.elapsed-5.15)<1e-9);assert.equal(c.state.term,'percent');assert.equal(c.anchor,null);
 c=p040ClockCloseTerm(c);assert.equal(c.state.playing,false);c=p040ClockPlay(c,2000);c=p040ClockSync(c,2001);assert(Math.abs(c.elapsed-6.15)<1e-9);assert.equal(c.state.frame,74);
 c=p040ClockReplay(c);assert.equal(c.elapsed,0);assert.equal(c.state.replay,1);assert.equal(c.state.frame,1);
});
test('terminal completion occurs after full440frame duration; invalid clocks rejected',()=>{
 let c=p040ClockPlay(p040ClockInitial(),0);c=p040ClockSync(c,439/12);assert.equal(c.state.frame,440);assert.equal(c.state.completed,false);
 c=p040ClockSync(c,440/12);assert.equal(c.state.completed,true);assert.equal(c.anchor,null);
 assert.throws(()=>p040ClockPlay(p040ClockInitial(),NaN),/TIME/);assert.throws(()=>p040ClockSync(p040ClockPlay(p040ClockInitial(),10),9),/REVERSED/);
});
