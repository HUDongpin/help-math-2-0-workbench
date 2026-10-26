import assert from 'node:assert/strict';
import test from 'node:test';
import p3 from '../src/modules/g678-nms-l01-p003-v3';
import p4 from '../src/modules/g678-nms-l01-p004';
import {PLAN as plan3} from '../src/timelines/shared-nms002-l01-p003';
import {PLAN as plan4} from '../src/timelines/shared-nms002-l01-p004';
const context=(frame:number,frameDomain:string)=>({frame,frameDomain,rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:0});

test('all 1233 source states are deterministic and preserve their complete readable state',()=>{
  for(const [module,domain,last]of [[p3,'sprite-82',892],[p4,'sprite-302',341]] as const){
    for(let frame=1;frame<=last;frame++){
      const c=context(frame,domain),state=module.getFrameState(frame,c);assert.deepEqual(state,module.getFrameState(frame,c));
      assert(state.sourceReading.every(r=>frame>=r.firstFrame&&frame<=r.lastFrame));
      assert.deepEqual(module.getFrameState(frame,{...c,lang:'es'}).sourceReading,[]);
      assert.deepEqual(module.getFrameState(frame,{...c,frameDomain:'root'}).sourceReading,[]);
    }
  }
});
test('the number-line directions and 20 minus 5 example reveal at the source boundaries and reset on Replay',()=>{
  const text=(f:number)=>p3.getFrameState(f,context(f,'sprite-82')).sourceReading.map(r=>r.text);
  assert.equal(text(142).length,1);assert(text(143).includes('Adding a positive number means moving right on the number line.'));
  assert.equal(text(261).length,2);assert(text(262).includes('Adding a negative number means moving left on the number line.'));
  for(const [before,at,expected]of [[437,438,'20'],[668,669,'20 – 5'],[707,708,'20 – 5 = 15'],[767,768,'20 – 5 = 15 yards gained']] as const){assert(!text(before).includes(expected));assert.equal(text(at).at(-1),expected);}
  assert.deepEqual(text(1),['Adding Positive and Negative Integers on a Number Line']);
  assert.equal(text(614).at(-1),'20','same-position source overlay does not duplicate the20');
  assert.equal(text(771).at(-1),'20 – 5 = 15 yards gained','the source flashing15 overlay does not duplicate the result');
  const controls=p3.privateSourceStory.controls;assert.equal(controls.length,3);assert(controls.every(c=>c.ranges[0].firstFrame===1&&c.ranges[0].lastFrame===892));
  assert.equal(p3.getFrameState(532,context(532,'sprite-82')).positionMarkerLabel,null);
  assert.equal(p3.getFrameState(533,context(533,'sprite-82')).positionMarkerLabel,'+15');
  assert.equal(p3.getFrameState(782,context(782,'sprite-82')).positionMarkerLabel,'+15');
  assert.equal(p3.getFrameState(783,context(783,'sprite-82')).positionMarkerLabel,null);
});
test('the second child placement starts afresh rather than inheriting the earlier or main playhead',()=>{
  const child=(f:number)=>p4.getFrameState(f,context(f,'sprite-302')).nestedSprites;
  assert.deepEqual(child(1),[{characterId:51,depth:830,frame:1}]);assert.deepEqual(child(11),[{characterId:51,depth:830,frame:11}]);
  assert.deepEqual(child(12),[]);assert.deepEqual(child(60),[]);assert.deepEqual(child(61),[{characterId:51,depth:840,frame:1}]);
  assert.deepEqual(child(86),[{characterId:51,depth:840,frame:26}]);assert.deepEqual(child(87),[]);assert.deepEqual(child(341),[]);
  assert.equal(p4.getFrameState(299,context(299,'sprite-302')).sourceReading.length,0);
  assert.equal(p4.getFrameState(300,context(300,'sprite-302')).sourceReading[0].text,'“TOUCHDOWN!!!”');
});
test('the two pages retain distinct measured source audio schedules and the short visual tail',()=>{
  assert.equal(p3.privateSourceStory.clockKind,'continuous');assert.equal(plan3.audioFirstFrame,10);assert.equal(plan3.latencySamples,1673);assert.equal(plan3.lastFrame,892);assert.equal(plan3.decoder.decodedSamples,1621440);
  assert.equal(p4.privateSourceStory.clockKind,'runs');assert.equal(plan4.lastFrame,341);assert.deepEqual(plan4.emptyNegativeBlocks,[{frame:318,samples:0,seek:-2241,mp3Bytes:0}]);
  assert.equal(plan4.segments.length,1);assert.equal(plan4.segments[0].endDecodedSample,581760);
  const audioEnd=(581760-1673)/22050,visualEnd=340/12;assert(visualEnd-audioEnd>2&&visualEnd-audioEnd<2.1);
});
