import test from 'node:test';
import assert from 'node:assert/strict';
import {createP044State, reduceP044, type P044State, type P044Event} from '../src/g678-nms-l01-p044-controller';
import {createP044NestedClock, createP044ObservedProductEntry, tickP044NestedClock, P044_PRODUCT_STOPS, resolveP044ProductTransition, p044ProductResolution} from '../src/g678-nms-l01-p044-product-clock';

function event(state: P044State, partial: Omit<P044Event, 'epoch' | 'clockToken'> & Record<string, unknown>) {
  const result = reduceP044(state, {...partial, epoch: state.epoch, clockToken: state.clockToken} as P044Event);
  assert.equal(result.accepted, true, result.reason ?? 'expected accepted source event'); return result.state;
}
function at(stop: 312 | 449 | 575 | 697 | 737, reduced = false) {
  let state = createP044State({mode: reduced ? 'reduced-motion' : 'natural'});
  for (const frame of [312,449,575,697,737] as const) {
    state = event(state, {type: 'main-frame', frame});
    if (frame === stop) return state;
    state = event(state, {type: 'continue', stopFrame: frame, sourceTarget: 43, input: 'mouse'});
  }
  throw new Error('unreachable');
}
function explanation(reduced = false) {const state = at(575, reduced);return event(state, {type:'open-explanation',stopFrame:575,input:'mouse'});}

test('all five exact product stops preserve renderer state and retain independent gates', () => {
  assert.deepEqual(P044_PRODUCT_STOPS.map(stop => stop.stopFrame), [312,449,575,697,737]);
  for (const stop of P044_PRODUCT_STOPS) {assert.equal(stop.resumeFrame, stop.stopFrame+1);assert.equal(stop.rendererStateOnResume,'preserve');assert.equal(stop.strictAcceptanceEffect,'none');}
});
test('first host observation initializes natural1 or reduced312 before resource-ready paint',()=>{
  for(const paused of[true,false])for(const [mode,frame]of[['natural',1],['reduced-motion',312]] as const){
    const state=createP044ObservedProductEntry({frame,mode,seed:3,epoch:8,paused});assert.equal(state.mainFrame,frame);assert.equal(state.paused,paused);assert.equal(state.epoch,8);
    assert.deepEqual(state.resolvedStops,[]);assert.equal(state.pendingMainResume,null);
  }
  assert.equal(createP044ObservedProductEntry({frame:449,mode:'natural',seed:0,epoch:0,paused:false}).mainFrame,1,'An initial observation cannot invent earlier stop resolutions');
});
test('missing host consumer cannot consume a Continue or claim main resume', () => {
  const state=at(312), next=resolveP044ProductTransition(state,{type:'continue',epoch:state.epoch,stopFrame:312,sourceTarget:43,input:'Enter'},false);
  assert.equal(next.accepted,false);assert.equal(next.state,state);assert.equal(p044ProductResolution(next),null);
});
test('host dispatch remains pending until the authoritative main frame is observed', () => {
  const state=at(312), next=resolveP044ProductTransition(state,{type:'continue',epoch:state.epoch,stopFrame:312,sourceTarget:43,input:' '},true);
  assert.equal(next.state.mainFrame,312);assert.deepEqual(next.state.resolvedStops,[]);
  assert.deepEqual(p044ProductResolution(next),{stopId:'p044-source-stop-312',frameDomain:'sprite-293',resolution:'explicit-source-control-finished',source:'maintained-source-derived-interaction'});
  assert.deepEqual(event(next.state,{type:'main-frame',frame:313}).resolvedStops,[312]);
});
test('nested source clocks do not start before the initial RAF timestamp', () => {
  const state=explanation(), next=tickP044NestedClock(createP044NestedClock(),state,1000);
  assert.equal(next.event,null);assert.equal(next.clock.observedFrame,1);assert.equal(next.clock.remainderMs,0);
});
test('fractional 12fps clock preserves remainder across frame advances', () => {
  let state=explanation();let {clock}=tickP044NestedClock(createP044NestedClock(),state,0);
  const first=tickP044NestedClock(clock,state,90);assert.equal(first.event?.type,'nested-frame');
  assert.equal(first.clock.observedFrame,2);assert.ok(Math.abs(first.clock.remainderMs-20/3)<1e-8);
  state=reduceP044(state,first.event!).state;clock=first.clock;
  const next=tickP044NestedClock(clock,state,166.666666666667);assert.equal(next.clock.observedFrame,3);assert.ok(next.clock.remainderMs<1e-8);
});
test('pause freezes fractional remainder and excludes all paused wall time', () => {
  let state=explanation();let {clock}=tickP044NestedClock(createP044NestedClock(),state,0);
  clock=tickP044NestedClock(clock,state,40).clock;state=event(state,{type:'pause',paused:true});
  clock=tickP044NestedClock(clock,state,80).clock;assert.equal(clock.remainderMs,40);assert.equal(clock.lastTimeMs,null);
  state=event(state,{type:'pause',paused:false});clock=tickP044NestedClock(clock,state,10000).clock;
  assert.equal(tickP044NestedClock(clock,state,10040).event,null);
  assert.equal(tickP044NestedClock(clock,state,10044).clock.observedFrame,2);
});
test('long RAF delay clamps at source opening stop, not beyond it', () => {
  const state=explanation(), {clock}=tickP044NestedClock(createP044NestedClock(),state,0);
  const next=tickP044NestedClock(clock,state,60000);assert.equal(next.clock.observedFrame,15);assert.equal(next.clock.remainderMs,0);
  const held=reduceP044(state,next.event!).state;assert.equal(held.phase,'explanation-held');
  assert.equal(tickP044NestedClock(next.clock,held,60001).event,null);
});
test('flushing pre-hold state accounts for the final RAF-to-pause interval exactly', () => {
  let state=explanation();let {clock}=tickP044NestedClock(createP044NestedClock(),state,0);
  clock=tickP044NestedClock(clock,state,40).clock;
  // Actual Pause occurs at80ms, forty milliseconds after the last RAF.
  clock=tickP044NestedClock(clock,state,80).clock;
  state=event(state,{type:'pause',paused:true});clock=tickP044NestedClock(clock,state,80).clock;
  assert.equal(clock.remainderMs,80);
  state=event(state,{type:'pause',paused:false});clock=tickP044NestedClock(clock,state,10000).clock;
  assert.equal(tickP044NestedClock(clock,state,10004).clock.observedFrame,2);
});
test('pre-glossary flush may cross a source frame and retains the post-frame fraction', () => {
  let state=explanation();let {clock}=tickP044NestedClock(createP044NestedClock(),state,0);
  const flushed=tickP044NestedClock(clock,state,100);state=reduceP044(state,flushed.event!).state;clock=flushed.clock;
  state=event(state,{type:'open-glossary',term:'total',input:'mouse'});clock=tickP044NestedClock(clock,state,100).clock;
  assert.equal(clock.observedFrame,2);assert.ok(Math.abs(clock.remainderMs-100/6)<1e-8);
  state=event(state,{type:'glossary-result',requestToken:state.glossary!.requestToken,allowed:false});
  clock=tickP044NestedClock(clock,state,10000).clock;
  assert.equal(tickP044NestedClock(clock,state,10067).clock.observedFrame,3);
});
test('Close has a fresh nested interval and restores guided hold at main575', () => {
  let state=explanation(true);let tick=tickP044NestedClock(createP044NestedClock(),state,0);state=reduceP044(state,tick.event!).state;
  state=event(state,{type:'close-explanation',sourceObjectId:106,input:'Enter'});
  tick=tickP044NestedClock(tick.clock,state,1000);state=reduceP044(state,tick.event!).state;
  assert.equal(state.mainFrame,575);assert.equal(state.phase,'guided');assert.equal(state.pendingMainResume,null);
});
test('feedback terminal is distinct from lesson completion and needs a host consumer', () => {
  let state=at(737,true);state=event(state,{type:'choose-answer',instanceName:'AnsBtn3',input:'mouse'});
  const tick=tickP044NestedClock(createP044NestedClock(),state,0);
  assert.equal(resolveP044ProductTransition(state,tick.event!,false).state,state);
  const transition=resolveP044ProductTransition(state,tick.event!,true);
  assert.equal(transition.state.mainFrame,737);assert.equal(transition.state.phase,'awaiting-main-resume');
  assert.equal(p044ProductResolution(transition)?.resolution,'explicit-source-feedback-finished');
});
test('Replay and stale tokens cannot carry a nested timeline forward', () => {
  let state=explanation();const tick=tickP044NestedClock(createP044NestedClock(),state,100);
  state=event(state,{type:'replay',input:'mouse'});
  const reset=tickP044NestedClock(tick.clock,state,50000);assert.equal(reset.clock.identity,null);assert.equal(reset.event,null);
});
test('invalid or backward timestamps fail without a transition', () => {
  const state=explanation(), {clock}=tickP044NestedClock(createP044NestedClock(),state,20);
  for (const bad of [-1,NaN,Infinity,19]) assert.throws(()=>tickP044NestedClock(clock,state,bad));
});
