import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {
 initialP053PlayerState,p053AvailableControls,p053SceneOptions,reduceP053Player,
 type P053PlayerState,
} from '../src/nms-l02-p053-player-state-v1';

// Exact physical AVM1 pointers are under the retained P053 source audit:
// DefineSprite_187/frame_1/PlaceObject2_119_11/CLIPACTIONRECORD on(release).as
//   b0d5982c858956cfbe6308f372343fda348a0a68e5213e5b85d88ddec8f2f366
// DefineSprite_187/frame_6/PlaceObject2_119_11/CLIPACTIONRECORD on(release).as
//   46e127caaa3d4fd6ad6d1f9eb40fd529f1091166580ef3f4e0a66da8b1f0d76a
// DefineSprite_187/frame_7/PlaceObject2_119_35/CLIPACTIONRECORD on(release).as
//   46e127caaa3d4fd6ad6d1f9eb40fd529f1091166580ef3f4e0a66da8b1f0d76a
// DefineSprite_187/frame_693/PlaceObject2_186_32/CLIPACTIONRECORD on(release).as
//   998cd607cf3196ddbaf33092005b9511accfafb125de5eb8faff369ec6a60dcb
// Source SWF G6-G8-shared/NMS002/L2/GS/L2GS02.swf SHA-256
//   f42f6a4759759561035a7c97e7392241513d0410d69214af422425ef37523fdf.
const audit='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/p053-source-audit-rjgSPq/scripts';
const pinned=(relative:string,sha256:string)=>{
 const data=readFileSync(`${audit}/${relative}`);
 assert.equal(createHash('sha256').update(data).digest('hex'),sha256);
 return data.toString();
};
const action=(state:P053PlayerState,type:'play'|'pause'|'replay'|'repeat'|'skip'|'close-popup'|'start')=>
 reduceP053Player(state,{type});
const playFrom=(frameElapsedMs:number)=>{
 let state=action(initialP053PlayerState(),'play');
 state=reduceP053Player(state,{type:'tick',nowMs:0,generation:state.clock.generation});
 state=reduceP053Player(state,{type:'tick',nowMs:frameElapsedMs,generation:state.clock.generation});
 return state;
};

test('pinned release scripts distinguish early Repeat, frame-6 replacement, Skip and held popup',()=>{
 assert.match(pinned('DefineSprite_187/frame_1/PlaceObject2_119_11/CLIPACTIONRECORD on(release).as',
  'b0d5982c858956cfbe6308f372343fda348a0a68e5213e5b85d88ddec8f2f366'),
  /gotoAndPlay\("RepeatDirection"\)/u);
 for(const relative of [
  'DefineSprite_187/frame_6/PlaceObject2_119_11/CLIPACTIONRECORD on(release).as',
  'DefineSprite_187/frame_7/PlaceObject2_119_35/CLIPACTIONRECORD on(release).as',
 ])assert.match(pinned(relative,
  '46e127caaa3d4fd6ad6d1f9eb40fd529f1091166580ef3f4e0a66da8b1f0d76a'),
  /gotoAndStop\("SelectLevel"\)/u);
 assert.match(pinned('DefineSprite_187/frame_693/PlaceObject2_186_32/CLIPACTIONRECORD on(release).as',
  '998cd607cf3196ddbaf33092005b9511accfafb125de5eb8faff369ec6a60dcb'),
  /Mc_Popup\._visible = true/u);
});

test('source placement and alpha make the current control mapping explicit',()=>{
 const initial=initialP053PlayerState();
 assert.equal(initial.mainFrame,1);assert.equal(initial.playing,false);
 assert.deepEqual(p053AvailableControls(initial).map(item=>
  [item.sourceName,item.action,item.sourceCharacterId,item.sourceAlpha256]),[
   ['mcRepeat','repeat',119,0],['mcL1','select-level-1',126,0],
   ['mcL2','select-level-2',130,0],['mcStart','start',136,0],
  ]);
 const frame6=playFrom(5*1000/12);
 assert.equal(frame6.mainFrame,6);
 assert.equal(p053AvailableControls(frame6)[0]?.sourceAlpha256,256);
 const frame7=playFrom(6*1000/12);
 assert.equal(frame7.mainFrame,7);
 assert.deepEqual(p053AvailableControls(frame7).map(item=>
  [item.sourceName,item.action,item.sourceCharacterId]),[['mcSkip','skip',119]]);
 const held=playFrom(60000);
 assert.equal(held.mainFrame,693);assert.equal(held.playing,false);
 assert.deepEqual(p053AvailableControls(held).map(item=>
  [item.sourceName,item.action,item.sourceCharacterId]),[
   ['mcRepeat','skip',186],['mcL1','select-level-1',126],
   ['mcL2','select-level-2',130],['mcStart','start',136],
  ]);
 assert.equal(held.controller.selectedLevel,null,'no level was selected before the natural hold');
 let chosen=reduceP053Player(initialP053PlayerState(),{type:'select-level',level:2});
 chosen=action(chosen,'play');
 chosen=reduceP053Player(chosen,{type:'tick',nowMs:0,generation:chosen.clock.generation});
 chosen=reduceP053Player(chosen,{type:'tick',nowMs:60000,generation:chosen.clock.generation});
 assert.equal(chosen.controller.selectedLevel,2,
  'frame-693 stop does not repeat the frame-1 global-level reset');
});

test('Repeat at frames 1–5 plays label frame 3, while frame 6 and later Skip hold 693',()=>{
 let state=action(initialP053PlayerState(),'repeat');
 assert.equal(state.mainFrame,3);assert.equal(state.playing,true);
 assert.equal(state.buttonFrames.mcRepeat,3);
 const earlyGeneration=state.clock.generation;
 state=reduceP053Player(state,{type:'tick',nowMs:999,generation:earlyGeneration-1});
 assert.equal(state.mainFrame,3,'stale pre-jump timer cannot advance source playhead');
 const frame6=playFrom(5*1000/12);
 const jumped=action(frame6,'repeat');
 assert.equal(jumped.mainFrame,693);assert.equal(jumped.playing,false);
 assert.equal(jumped.controller.startSite,'select-level-frame-693');
 assert.equal(jumped.buttonFrames.mcRepeat,1,'new source placement has its own child frame');
 const frame7=playFrom(6*1000/12);
 assert.throws(()=>action(frame7,'repeat'),/CONTROL_UNAVAILABLE/u);
 assert.equal(action(frame7,'skip').mainFrame,693);
 assert.throws(()=>action(initialP053PlayerState(),'skip'),/SKIP_NOT_PLACED/u);
});

test('12 fps clock freezes on pause, rejects regression, and cannot play frame 694',()=>{
 let state=action(initialP053PlayerState(),'play');
 const active=state.clock.generation;
 state=reduceP053Player(state,{type:'tick',nowMs:100,generation:active});
 state=reduceP053Player(state,{type:'tick',nowMs:350,generation:active});
 assert.equal(state.mainFrame,4);
 assert.equal(state.clock.remainderMs,0);
 state=reduceP053Player(state,{type:'tick',nowMs:390,generation:active});
 assert.equal(state.mainFrame,4);
 const savedSubframe=state.clock.remainderMs;
 assert(savedSubframe>0);
 state=action(state,'pause');
 assert.equal(state.playing,false);assert.equal(state.mainFrame,4);
 assert.equal(state.clock.remainderMs,savedSubframe);
 const oldEpoch=state.clock.generation-1;
 assert.strictEqual(reduceP053Player(state,{type:'tick',nowMs:100000,generation:oldEpoch}),state);
 state=action(state,'play');
 const resumed=state.clock.generation;
 state=reduceP053Player(state,{type:'tick',nowMs:100000,generation:resumed});
 assert.equal(state.mainFrame,4,'first resumed tick anchors wall clock');
 assert.equal(state.clock.remainderMs,savedSubframe,'pause preserves fractional-frame progress');
 assert.throws(()=>reduceP053Player(state,{type:'tick',nowMs:99999,generation:resumed}),
  /CLOCK_REGRESSION/u);
 const held=reduceP053Player(state,{type:'tick',nowMs:200000,generation:resumed});
 assert.equal(held.mainFrame,693);assert.equal(held.playing,false);
 assert.strictEqual(reduceP053Player(held,{type:'tick',nowMs:300000,
  generation:held.clock.generation}),held);
 assert.strictEqual(action(held,'play'),held);
 for(const value of [-1,Number.NaN,Number.POSITIVE_INFINITY,1e20])
  assert.throws(()=>reduceP053Player(state,{type:'tick',nowMs:value,generation:resumed}),
   /INVALID_CLOCK/u);
});

test('level choice and Start preserve two unresolved source host targets',()=>{
 let early=reduceP053Player(initialP053PlayerState(),{type:'select-level',level:2});
 assert.equal(early.buttonFrames.mcL2,3);
 early=action(early,'start');
 assert.deepEqual(early.startIntent,{requestedBasename:'L7GS03',framePlay:1,
  selectedLevel:2,startSite:'early-frame-1',hostExecution:'not-observed'});
 assert.equal(early.mainFrame,1,'host navigation is an intent, not performed');
 let late=playFrom(60000);
 late=action(late,'start');
 assert.equal(late.controller.levelMessageVisible,true);
 assert.equal(late.startIntent,null);
 assert.equal(late.buttonFrames.mcStart,1,
  'no-level Start warning does not execute source gotoAndStop(3)');
 late=reduceP053Player(late,{type:'select-level',level:1});
 late=action(late,'start');
 assert.deepEqual(late.startIntent,{requestedBasename:'L2GS03',framePlay:1,tempSection:6,
  selectedLevel:1,startSite:'select-level-frame-693',hostExecution:'not-observed'});
 assert.equal(p053SceneOptions(late).levelMessageVisible,true);
 late=reduceP053Player(late,{type:'start-roll-out'});
 assert.equal(late.controller.levelMessageVisible,false);
 assert.throws(()=>reduceP053Player(playFrom(1000),{type:'select-level',level:1}),
  /CONTROL_UNAVAILABLE/u);
});

test('selected level hover/out retains frame 3 in both source placements',()=>{
 for(const initial of [initialP053PlayerState(),playFrom(60000)]){
  let state=reduceP053Player(initial,{type:'select-level',level:1});
  assert.equal(state.buttonFrames.mcL1,3);
  assert.strictEqual(reduceP053Player(state,{type:'hover',control:'mcL1'}),state);
  assert.strictEqual(reduceP053Player(state,{type:'leave',control:'mcL1'}),state);
  state=reduceP053Player(state,{type:'hover',control:'mcL2'});
  assert.equal(state.buttonFrames.mcL2,2);
  state=reduceP053Player(state,{type:'leave',control:'mcL2'});
  assert.equal(state.buttonFrames.mcL2,1);
 }
 for(const [relative,sha,operation] of [
  ['DefineSprite_187/frame_1/PlaceObject2_126_17/CLIPACTIONRECORD on(rollOver).as',
   '57e34510bc98dda50dcf1327cfb9881777ea9b922556443fdfaae1f0c9f56ebe','gotoAndStop(2)'],
  ['DefineSprite_187/frame_1/PlaceObject2_126_17/CLIPACTIONRECORD on(rollOut).as',
   '029c41728e1ab888feeef25843a977c4aa46392b114fd82fc36d06fc294988f8','gotoAndStop(1)'],
  ['DefineSprite_187/frame_693/PlaceObject2_126_36/CLIPACTIONRECORD on(rollOver).as',
   '57e34510bc98dda50dcf1327cfb9881777ea9b922556443fdfaae1f0c9f56ebe','gotoAndStop(2)'],
  ['DefineSprite_187/frame_693/PlaceObject2_126_36/CLIPACTIONRECORD on(rollOut).as',
   '029c41728e1ab888feeef25843a977c4aa46392b114fd82fc36d06fc294988f8','gotoAndStop(1)'],
 ] as const){
  const source=pinned(relative,sha);
  assert.match(source,/this\._currentframe != 3/u);
  assert(source.includes(operation));
 }
});

test('Start no-level warning keeps child frame; late leave hides only level message',()=>{
 let early=reduceP053Player(initialP053PlayerState(),{type:'hover',control:'mcStart'});
 early=action(early,'start');
 assert.equal(early.buttonFrames.mcStart,2);
 assert.equal(early.controller.inlineMessage,'Please select the Level then Click Start');
 let late=reduceP053Player(playFrom(60000),{type:'hover',control:'mcStart'});
 late=action(late,'start');
 assert.equal(late.buttonFrames.mcStart,2);
 assert.equal(late.controller.levelMessageVisible,true);
 late=reduceP053Player(late,{type:'leave',control:'mcStart'});
 assert.equal(late.buttonFrames.mcStart,1);
 assert.equal(late.controller.levelMessageVisible,false);
 const release=pinned('DefineSprite_187/frame_693/PlaceObject2_136_43/CLIPACTIONRECORD on(release).as',
  '73e3330ff7d670fc88f8e574c4aaa34b490d978e690ab2fe3e6aed7500ab2102');
 assert.match(release,/else\s*\{\s*_parent\.Mc_Msg\._visible = true/u);
 const rollOut=pinned('DefineSprite_187/frame_693/PlaceObject2_136_43/CLIPACTIONRECORD on(rollOut).as',
  '39a0ff2b4435c5974afcb4438278b3e35f5f9371e96fab18970ce58234c92b70');
 assert.match(rollOut,/_parent\.Mc_Msg\._visible = false/u);
});

test('held Skip popup disables source controls; Close retains unresolved receiver',()=>{
 let state=playFrom(60000);
 state=action(state,'skip');
 assert.equal(state.controller.directionsPopupVisible,true);
 assert.equal(state.controller.controlsEnabled,false);
 assert.equal(state.buttonFrames.mcRepeat,3);
 assert.equal(p053SceneOptions(state).popupVisible,true);
 assert(p053AvailableControls(state).every(item=>!item.controlsEnabled));
 for(const event of [{type:'select-level',level:1},{type:'start'},
  {type:'hover',control:'mcRepeat'}] as const)
  assert.throws(()=>reduceP053Player(state,event),/CONTROL_UNAVAILABLE/u);
 state=action(state,'close-popup');
 assert.equal(state.controller.controlsEnabled,true);
 assert.equal(state.controller.directionsPopupVisible,'unresolved-after-close');
 assert.equal(state.buttonFrames.mcRepeat,1);
 assert.throws(()=>p053SceneOptions(state),/POPUP_VISIBILITY_UNRESOLVED/u);
 assert.throws(()=>action(state,'skip'),/Skip unavailable/u);
});

test('explicit Replay resets playhead, popup, selections, button frames and timer epoch',()=>{
 let state=playFrom(60000);
 state=reduceP053Player(state,{type:'select-level',level:1});
 state=action(state,'start');
 const oldGeneration=state.clock.generation;
 state=action(state,'replay');
 assert.equal(state.mainFrame,1);assert.equal(state.playing,true);
 assert.equal(state.controller.selectedLevel,null);assert.equal(state.controller.startGameFlag,'unobserved');
 assert.equal(state.controller.directionsPopupVisible,false);
 assert.equal(state.controller.levelMessageVisible,false);
 assert.equal(state.startIntent,null);
 assert.deepEqual(state.buttonFrames,{mcRepeat:1,mcL1:1,mcL2:1,mcStart:1,mcSkip:1});
 assert(state.clock.generation>oldGeneration);
 assert.strictEqual(reduceP053Player(state,{type:'tick',nowMs:50000,
  generation:oldGeneration}),state);
});
