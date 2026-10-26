import test from 'node:test';
import assert from 'node:assert/strict';
import {createP044LiveFrameCallback} from '../src/g678-nms-l01-p044-live-frame-callback';
import {createP044State,reduceP044,type P044Event,type P044State} from '../src/g678-nms-l01-p044-controller';
import {createP044NestedClock,tickP044NestedClock} from '../src/g678-nms-l01-p044-product-clock';
function event(s:P044State,partial:Record<string,unknown>){const r=reduceP044(s,{...partial,epoch:s.epoch,clockToken:s.clockToken} as P044Event);assert.equal(r.accepted,true);return r.state;}
function feedback(){let s=createP044State({mode:'natural'});for(const frame of[312,449,575,697,737]){
  s=event(s,{type:'main-frame',frame});if(frame!==737)s=event(s,{type:'continue',stopFrame:frame,sourceTarget:43,input:'mouse'});
}return event(s,{type:'choose-answer',instanceName:'AnsBtn1',input:'mouse'});}
test('delayed RAF batch timestamp reproduces the registered pause/resume failure; live callback time preserves the exact fraction',()=>{
  let state=feedback(),clock=createP044NestedClock();
  const advance=(now:number)=>{const r=tickP044NestedClock(clock,state,now);clock=r.clock;if(r.event)state=event(state,r.event);};
  advance(0);advance(80);assert.equal(clock.remainderMs,80);
  state=event(state,{type:'pause',paused:true});advance(80);advance(1000);
  state=event(state,{type:'pause',paused:false});advance(1000);assert.equal(clock.lastTimeMs,1000);
  assert.throws(()=>tickP044NestedClock(clock,state,995),/monotonic nested clock/);
  createP044LiveFrameCallback(advance,()=>1004)(995);
  assert.equal(clock.observedFrame,2);assert.ok(Math.abs(clock.remainderMs-(84-1000/12))<1e-8);
  assert.equal(state.phase,'feedback');assert.equal(state.mainFrame,737);
});
test('callback samples at execution and never forwards the stale batch value or clamps invalid live time',()=>{
  const values:number[]=[];let now=20,calls=0;const callback=createP044LiveFrameCallback(t=>values.push(t),()=>{calls++;return now;});
  callback(1);now=35;callback(2);assert.deepEqual(values,[20,35]);assert.equal(calls,2);
  const state=feedback(),clock=tickP044NestedClock(createP044NestedClock(),state,40).clock;
  assert.throws(()=>createP044LiveFrameCallback(t=>{tickP044NestedClock(clock,state,t);},()=>39)(100),/monotonic nested clock/);
});
