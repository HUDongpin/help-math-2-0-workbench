import {P030_TEACHING_DATA as DATA}from'./generated/nms-l02-p030-teaching-data-v1';
import {P030_TEXT_INSTANCES as INSTANCES}from'./generated/nms-l02-p030-text-instances-v1';
import type {LessonTextBinding}from'./lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId}from'./lesson-text-snapshot';
import type {P030FrameState}from'./nms-l02-p030-timeline-v1';
const ids=(values:readonly number[])=>values.map(id=>'character-'+id+'/run-0');
export const P030_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p030-native-source-v1',animationId:DATA.animationId,placementId:DATA.animationId,sourceSwfSha256:DATA.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[8],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[8],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'ones-group',sourceTextIds:ids([19]),role:'label',language:'en',readingOrder:2,valueSource:'source-static'},
 {id:'decimals-group',sourceTextIds:ids([20]),role:'label',language:'en',readingOrder:3,valueSource:'source-static'},
 {id:'column-labels',sourceTextIds:ids([11,12,13,14,15,16,17]),role:'label',language:'en',readingOrder:4,valueSource:'source-static'},
 {id:'number',sourceTextIds:ids([18,40,41,53,57,58]),role:'label',language:'en',readingOrder:5,valueSource:'maintained-page-state'},
 {id:'equivalence',sourceTextIds:ids([42,43,45,46,54,56,59,61,62]),sourceShapeIds:[44,55,60,63,64,65,66],role:'body',language:'en',readingOrder:6,valueSource:'maintained-page-state'},
]as const)});
export function p030TextSnapshot(s:P030FrameState){
 const t=s.teaching,visible=t.tableAlpha>0;
 const snapshot=buildLessonTextSnapshot(P030_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:'default',lang:s.language,seed:s.seed,replay:s.replay},{
 'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible:s.mainFrame!==null},
 'activity-title':{text:'Instruction',visible:s.mainFrame!==null},
 'ones-group':{text:'Ones',visible},'decimals-group':{text:'Decimals',visible},
 'column-labels':{text:'Hundreds, Tens, Ones, Decimal Point, Tenths, Hundredths, Thousandths',visible},
 number:{text:t.tableNumberAlpha>0?'0.'+t.example:'.',visible},
 equivalence:{text:t.decimalAlpha>0?'0.'+t.example+(t.fractionAlpha>0?' or '+t.example+'/10':''):'',visible:t.decimalAlpha>0},
 });
 const suppressed=[];
 if(s.mainFrame!==null){
  const path=Object.freeze([{timelineId:'root',depth:1,generation:1,characterId:8}]);suppressed.push(Object.freeze({id:lessonTextInstanceId(path),path}));
  for(const [characterId,depth,generation]of INSTANCES.states[INSTANCES.frames[s.mainFrame-1]]){
   const path=Object.freeze([{timelineId:'root',depth:2,generation:1,characterId:67},{timelineId:'sprite-67',depth,generation,characterId}]);suppressed.push(Object.freeze({id:lessonTextInstanceId(path),path}));
  }
 }
 return Object.freeze({...snapshot,suppressedInstances:Object.freeze(suppressed)});
}
