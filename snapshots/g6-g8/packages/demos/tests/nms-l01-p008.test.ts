import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import p8 from '../src/modules/g678-nms-l01-p008';
import {CONFIG,PLAN} from '../src/timelines/shared-nms002-l01-p008';
import {SourceStreamCycleClockV1,sourceStreamCyclePosition,sourceStreamCycleSlices} from '../src/source-stream-cycle-clock-v1';
const context=(frame:number)=>({frame,frameDomain:'sprite-81',rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:0});
const near=(a:number,b:number)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('all330 source states retain frame-bound glossary regions and deterministic Replay',()=>{
  for(let frame=1;frame<=330;frame++){
    const state=p8.getFrameState(frame,context(frame));assert.deepEqual(state,p8.getFrameState(frame,context(frame)));
    assert.deepEqual(state.nestedSprites,[]);
    for(const h of state.sourceHotspots){assert.equal(h.ranges.length,1);const{rect:r}=h.ranges[0];assert(r.left>=0&&r.right<=800&&r.top>=0&&r.bottom<=600&&r.left<r.right&&r.top<r.bottom);}
    assert.deepEqual(p8.getFrameState(frame,{...context(frame),frameDomain:'root'}).sourceHotspots,[]);
    assert.deepEqual(p8.getFrameState(frame,{...context(frame),lang:'es'}).sourceReading,[]);
  }
  const hotspots=(frame:number)=>p8.getFrameState(frame,context(frame)).sourceHotspots.map(h=>h.sourceCharacterId);
  assert.deepEqual(hotspots(1),[39,40,41]);assert(!hotspots(8).includes(47));assert(hotspots(9).includes(47));
  assert(!hotspots(27).includes(49));assert(hotspots(28).includes(49));assert(!hotspots(44).includes(48));assert(hotspots(45).includes(48));
  assert(!hotspots(62).includes(55));assert(hotspots(63).includes(55));assert(!hotspots(86).includes(56));assert(hotspots(87).includes(56));
  assert.equal(hotspots(330).length,8);assert.deepEqual(hotspots(331),[]);assert.deepEqual(hotspots(1),[39,40,41]);
});
test('the complete definition and conclusion follow actual source mask reveal beats',()=>{
  const text=(f:number)=>p8.getFrameState(f,context(f)).sourceReading.map(r=>r.text);
  assert.deepEqual(text(6),[]);assert.equal(text(7).length,1);assert.equal(text(93).length,1);
  assert.equal(text(94)[1],'Opposite integers are integers that have the same distance from zero on a number line but in different directions.');
  assert.equal(text(325).length,2);assert.equal(text(326)[2],'-5 and +5 are opposite integers.');assert.equal(text(330).length,3);assert.deepEqual(text(331),[]);
  const controls=p8.privateSourceCycle.controls;assert.equal(controls.length,8);assert.equal(controls.filter(c=>c.ranges[0].firstFrame===56).length,2);
  assert.deepEqual(controls.map(c=>c.entryId),['opposite','negative-integers','positive-integers','opposite-integers','distance','integers','number-line','direction']);
});
test('one unchanged native source stream leaves its authored no-node interval and repeats after the complete330th frame',()=>{
  const bytes=Buffer.from(p8.privateSourceCycle.sourceAudioBase64,'base64');assert.equal(bytes.length,133770);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),'4e5d29e5e72ac363c6b859c9a63a44bfe2035e066bc146f0f7fe6ed8087d98e9');
  assert.equal(PLAN.decoder.decodedSamples,592704);assert.equal(PLAN.decoder.pcmSha256,'9ad8dbc867c22e80d6ec0196f0185fb19dded980d913cac4d1ee69c54efaf42f');
  assert.deepEqual(PLAN.emptyNegativeBlocks,[]);assert.equal(CONFIG.mainFrameCount,330);assert.equal(CONFIG.rootFrameCount,10);
  new SourceStreamCycleClockV1(PLAN,{commitHeldFrame:()=>true});
  const [first]=sourceStreamCycleSlices(PLAN,0,0);near(first.delaySeconds,7/12);assert.equal(first.firstDecodedSample,1673);near(first.durationSeconds,(592704-1673)/22050);
  near(first.delaySeconds+first.durationSeconds,27.387460317460317);assert.deepEqual(sourceStreamCycleSlices(PLAN,329/12,0),[]);
  assert.equal(sourceStreamCyclePosition(PLAN,27.49).frame,330);assert.deepEqual(sourceStreamCyclePosition(PLAN,27.5),{cycleIndex:1,seconds:0,frame:1});
  assert.deepEqual(sourceStreamCyclePosition(PLAN,55),{cycleIndex:2,seconds:0,frame:1});
  const [next]=sourceStreamCycleSlices(PLAN,27.49,1);near(next.delaySeconds,27.5+7/12-27.49);assert.equal(next.firstDecodedSample,1673);
  assert.throws(()=>new SourceStreamCycleClockV1({...PLAN,frameCount:328},{commitHeldFrame:()=>true}),/invalid-cycle-run-order-or-range/);
});
