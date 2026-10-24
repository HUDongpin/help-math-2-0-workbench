import{P032_TEACHING_DATA as DATA}from'./generated/nms-l02-p032-teaching-data-v1';
import{P032_TEXT_INSTANCES as INSTANCES}from'./generated/nms-l02-p032-text-instances-v1';
import type{LessonTextBinding}from'./lesson-text-contract';
import{buildLessonTextSnapshot,lessonTextInstanceId}from'./lesson-text-snapshot';
import type{P032FrameState}from'./nms-l02-p032-timeline-v1';
const ids=(values:readonly number[])=>values.map(id=>'character-'+id+'/run-0');
export const P032_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p032-native-source-v1',animationId:DATA.animationId,placementId:DATA.animationId,sourceSwfSha256:DATA.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[8],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[8],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'chart-title',sourceTextIds:ids([32]),role:'heading',language:'en',readingOrder:2,valueSource:'source-static'},
 {id:'ones-group',sourceTextIds:ids([27]),role:'label',language:'en',readingOrder:3,valueSource:'source-static'},
 {id:'decimals-group',sourceTextIds:ids([28]),role:'label',language:'en',readingOrder:4,valueSource:'source-static'},
 {id:'column-labels',sourceTextIds:ids(Array.from({length:15},(_,i)=>11+i)),role:'label',language:'en',readingOrder:5,valueSource:'source-static'},
 {id:'primary-number',sourceTextIds:ids([31,39,40,57,61,62]),role:'label',language:'en',readingOrder:6,valueSource:'maintained-page-state'},
 {id:'primary-equivalence',sourceTextIds:ids([41,42,43,44,54,55,58,59,60]),sourceShapeIds:[45,56],role:'body',language:'en',readingOrder:7,valueSource:'maintained-page-state'},
 {id:'secondary-number',sourceTextIds:ids([31,40,57,166,167]),role:'label',language:'en',readingOrder:8,valueSource:'maintained-page-state'},
 {id:'secondary-equivalence',sourceTextIds:ids([42,44,60,64,65,163,164]),sourceShapeIds:[66,...Array.from({length:48},(_,i)=>68+2*i),165,...Array.from({length:8},(_,i)=>168+i)],role:'body',language:'en',readingOrder:9,valueSource:'maintained-page-state'},
 {id:'target-qualification',sourceTextIds:ids([64,65]),role:'body',language:'en',readingOrder:10,valueSource:'maintained-page-state'},
]as const)});
export function p032TextSnapshot(s:P032FrameState){
 const t=s.teaching,visible=t!==null;
 const snapshot=buildLessonTextSnapshot(P032_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:s.scenario,lang:s.language,seed:s.seed,replay:s.replay},{
 'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible},'activity-title':{text:'Instruction',visible},
 'chart-title':{text:'Place Value Chart',visible},'ones-group':{text:'Ones',visible},'decimals-group':{text:'Decimals',visible},
 'column-labels':{text:'Hundreds, Tens, Ones, Decimal Point, Tenths, Hundredths, Thousandths',visible},
 'primary-number':{text:t&&t.primaryTableNumberAlpha>0?'0.0'+t.primaryNumerator:'.',visible},
 'primary-equivalence':{text:t&&t.primaryDecimalAlpha>0?'0.0'+t.primaryNumerator+(t.primaryFractionAlpha>0?' or '+t.primaryNumerator+'/100':''):'',visible:!!t&&t.primaryDecimalAlpha>0},
 'secondary-number':{text:'0.55',visible:!!t?.comparison},'secondary-equivalence':{text:'0.55 or 55/100',visible:!!t?.comparison},
 'target-qualification':{text:'Target: 55 hundredths. The grid is filling toward this value.',visible:!!t?.comparison&&t.secondaryShaded!==55},
 });
 const suppressed=[];
 if(s.mainFrame!==null){
  const path=Object.freeze([{timelineId:'root',depth:1,generation:1,characterId:8}]);suppressed.push(Object.freeze({id:lessonTextInstanceId(path),path}));
  for(const[characterId,depth,generation]of INSTANCES.states[INSTANCES.frames[s.mainFrame-1]]){
   const path=Object.freeze([{timelineId:'root',depth:2,generation:1,characterId:176},{timelineId:'sprite-176',depth,generation,characterId}]);suppressed.push(Object.freeze({id:lessonTextInstanceId(path),path}));
  }
 }
 return Object.freeze({...snapshot,suppressedInstances:Object.freeze(suppressed)});
}
