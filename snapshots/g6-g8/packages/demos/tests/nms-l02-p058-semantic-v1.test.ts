import assert from 'node:assert/strict';
import test from 'node:test';
import {P058_SOURCE_BUTTON_OCCURRENCES} from '../src/generated/nms-l02-p058-terms-v1';
import {P058_CONTROLS,P058_ID,P058_LEFT_STRATEGIES,P058_RIGHT_STRATEGIES,
 P058_SOURCE_SHA,p058SemanticSnapshot} from '../src/nms-l02-p058-semantic-v1';
import {sourceGlossaryControlsAtFrame} from '../src/source-glossary-controls';

test('source identity, ordered strategy text, and seven distinct button instances',()=>{
 assert.equal(P058_ID,'shared-nms002-l02-p058');
 assert.equal(P058_SOURCE_SHA,'fc26d0a7049db6b8ce5532cfbed1fcb380c75e503d9c7cb7974bea73b8505d57');
 assert.deepEqual(P058_LEFT_STRATEGIES,[
  'write an equation and solve it','draw a picture','look for a pattern','systematically guess and check']);
 assert.deepEqual(P058_RIGHT_STRATEGIES,[
  'act it out','make a table','work a simpler problem','work backwards']);
 assert.deepEqual(P058_CONTROLS.controls.map(row=>row.id),P058_SOURCE_BUTTON_OCCURRENCES.map(row=>row.id));
 assert.deepEqual(P058_CONTROLS.controls.map(row=>row.entryId),
  ['strategies','equation','pattern','simple-simpler-simplest','table','show','show']);
 assert.deepEqual(P058_CONTROLS.controls.map(row=>row.characterId),[22,27,28,29,30,33,36]);
 assert.deepEqual(P058_CONTROLS.controls.map(row=>row.label),
  ['Strategies','equation','pattern','simpler','table','Show','Show']);
 assert.deepEqual(P058_CONTROLS.controls.map(row=>row.sourceKeyAttribute),
  ['Strategies','Equation','Pattern','Simple / Simpler / Simplest','Table','Show','Show']);
});

test('every source frame is a deterministic pure query with exact glossary enablement',()=>{
 for(let frame=1;frame<=274;frame++){
  const state=p058SemanticSnapshot(frame);
  assert.deepEqual(state,p058SemanticSnapshot(frame));
  assert.equal(state.frame,frame);
  assert.equal(state.controlStates.length,7);
  for(const pose of [state.stepOne9,state.stepTwo12,state.stepThree14]){
   assert.equal(pose.placed,true);
   assert.equal(pose.alpha256,256);
   assert.deepEqual(pose.relativeToFinalTwips,{x:0,y:0});
  }
  assert.deepEqual(state.availableControlIds,
   sourceGlossaryControlsAtFrame(P058_CONTROLS,frame,'sprite-37').map(row=>row.id));
  assert.equal(state.sourceChildStopPresent,false);
  assert.equal(state.sourceTerminalStopPresent,false);
  assert.equal(state.originalRuntimeEstablished,false);
 }
});

test('first placement, source motion, and full opacity remain separate',()=>{
 const beforeStep=p058SemanticSnapshot(11),firstStep=p058SemanticSnapshot(12),stepEnd=p058SemanticSnapshot(22);
 assert.equal(beforeStep.stepFour15.placed,false);
 assert.equal(beforeStep.heading17.placed,false);
 assert.deepEqual(firstStep.stepFour15.relativeToFinalTwips,{x:0,y:600});
 assert.deepEqual(firstStep.heading17.relativeToFinalTwips,{x:0,y:400});
 assert.equal(firstStep.stepFour15.alpha256,0);
 assert.equal(p058SemanticSnapshot(21).stepFour15.alpha256,230);
 assert.equal(stepEnd.stepFour15.alpha256,256);
 assert.deepEqual(stepEnd.stepFour15.relativeToFinalTwips,{x:0,y:0});
 assert.deepEqual(stepEnd.heading17.relativeToFinalTwips,{x:0,y:0});

 const beforeHeading=p058SemanticSnapshot(102),firstHeading=p058SemanticSnapshot(103),headingEnd=p058SemanticSnapshot(110);
 assert.equal(beforeHeading.strategies19.placed,false);
 assert.deepEqual(firstHeading.strategies19.relativeToFinalTwips,{x:3,y:200});
 assert.equal(firstHeading.strategies19.alpha256,0);
 assert.equal(firstHeading.controlStates[0].placed,true);
 assert.equal(firstHeading.controlStates[0].enabled,false);
 assert.equal(p058SemanticSnapshot(109).strategies19.alpha256,219);
 assert.deepEqual(headingEnd.strategies19.relativeToFinalTwips,{x:0,y:0});
 assert.equal(headingEnd.controlStates[0].enabled,true);

 const firstLists=p058SemanticSnapshot(139),listsEnd=p058SemanticSnapshot(146);
 assert.equal(p058SemanticSnapshot(138).leftStrategies26.placed,false);
 assert.equal(firstLists.leftStrategies26.alpha256,0);
 assert.equal(firstLists.rightStrategies24.alpha256,0);
 assert.deepEqual(firstLists.leftStrategies26.relativeToFinalTwips,{x:0,y:0});
 assert.deepEqual(firstLists.rightStrategies24.relativeToFinalTwips,{x:0,y:0});
 assert.equal(p058SemanticSnapshot(145).leftStrategies26.alpha256,219);
 assert.equal(listsEnd.leftStrategies26.alpha256,256);
 assert.equal(listsEnd.rightStrategies24.alpha256,256);

 const firstShow=p058SemanticSnapshot(237),fullShow=p058SemanticSnapshot(242);
 assert.equal(p058SemanticSnapshot(236).show32.placed,false);
 assert.deepEqual(firstShow.show32.relativeToFinalTwips,{x:0,y:500});
 assert.equal(firstShow.show32.alpha256,0);
 assert.equal(p058SemanticSnapshot(241).show32.alpha256,205);
 assert.equal(fullShow.show32.alpha256,256);
 assert.deepEqual(fullShow.show32.relativeToFinalTwips,{x:0,y:0});
});

test('all opacity boundaries, duplicate Show lifetimes, and terminal frame',()=>{
 const cases:[number,number,number][]=[
  [1,0,0],[102,0,0],[103,0,1],[109,0,1],[110,1,1],
  [138,1,1],[139,1,5],[145,1,5],[146,5,5],
  [236,5,5],[237,5,6],[241,5,6],[242,7,7],[243,6,6],[274,6,6],
 ];
 for(const [frame,enabled,placed] of cases){
  const state=p058SemanticSnapshot(frame);
  assert.equal(state.availableControlIds.length,enabled,`enabled at ${frame}`);
  assert.equal(state.controlStates.filter(row=>row.placed).length,placed,`placed at ${frame}`);
 }
 const at242=p058SemanticSnapshot(242);
 assert.deepEqual(at242.controlStates.filter(row=>row.entryId==='show').map(row=>
  [row.depth,row.characterId,row.enabled,row.lastFrameExclusive]),
  [[41,33,true,275],[45,36,true,243]]);
 assert.deepEqual(p058SemanticSnapshot(243).controlStates.filter(row=>row.entryId==='show'&&row.enabled)
  .map(row=>row.id),['sprite-37/depth-41/generation-1']);
 assert.equal(p058SemanticSnapshot(274).controlStates[6].placed,false);
 assert.equal(p058SemanticSnapshot(274).controlStates[5].enabled,true);
});

test('one-frame source emphasis flashes at 242, 244, and 246 only',()=>{
 for(const frame of [242,244,246]){
  const state=p058SemanticSnapshot(frame);
  assert.equal(state.flashActive,true);
  assert.equal(state.flashing35.alpha256,256);
  assert.deepEqual(state.flashing35.relativeToFinalTwips,{x:0,y:0});
 }
 for(const frame of [1,241,243,245,247,274]){
  const state=p058SemanticSnapshot(frame);
  assert.equal(state.flashActive,false);
  assert.equal(state.flashing35.placed,false);
 }
});

test('non-source frames fail closed',()=>{
 for(const frame of [0,-1,275,1.5,NaN,Infinity,-Infinity])
  assert.throws(()=>p058SemanticSnapshot(frame),RangeError);
});
