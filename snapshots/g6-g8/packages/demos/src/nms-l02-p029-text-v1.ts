import {P029_TEACHING_DATA as DATA} from './generated/nms-l02-p029-teaching-data-v1';
import type {LessonTextBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId} from './lesson-text-snapshot';
import type {P029FrameState} from './nms-l02-p029-timeline-v1';
const ids=(values:readonly number[])=>values.map(id=>'character-'+id+'/run-0');
export const P029_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p029-native-source-v1',animationId:DATA.animationId,placementId:DATA.animationId,sourceSwfSha256:DATA.sourceSha256,template:'complex-figure',blocks:Object.freeze([
  {id:'course-title',sourceTextIds:[],sourceShapeIds:[8],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
  {id:'activity-title',sourceTextIds:[],sourceShapeIds:[8],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
  {id:'place-value',sourceTextIds:ids([29,34]),role:'heading',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
  {id:'ones-group',sourceTextIds:ids([11]),role:'label',language:'en',readingOrder:3,valueSource:'source-static'},
  {id:'decimals-group',sourceTextIds:ids([12]),role:'label',language:'en',readingOrder:4,valueSource:'source-static'},
  {id:'column-labels',sourceTextIds:ids([17,18,19,20,21,22,23,11,38,42,46]),sourceShapeIds:[36,37,41,45,47,48],role:'label',language:'en',readingOrder:5,valueSource:'maintained-page-state'},
  {id:'number',sourceTextIds:ids([24,25,26,27,40,44]),sourceShapeIds:[35,36,37,39,41,43,47,48],role:'label',language:'en',readingOrder:6,valueSource:'maintained-page-state'},
] as const)});
export function p029TextSnapshot(s:P029FrameState){
  const visible=s.teaching.tableAlpha>0;
  const snapshot=buildLessonTextSnapshot(P029_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:'default',lang:s.language,seed:s.seed,replay:s.replay},{
    'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible:s.mainFrame!==null},
    'activity-title':{text:'Instruction',visible:s.mainFrame!==null},
    'place-value':{text:'Place Value',visible:s.teaching.placeValueAlpha>0},
    'ones-group':{text:'Ones',visible},'decimals-group':{text:'Decimals',visible},
    'column-labels':{text:'Hundreds, Tens, Ones, Decimal Point, Tenths, Hundredths, Thousandths',visible},
    number:{text:'0.15',visible},
  });
  const suppressed=[];
  if(s.mainFrame!==null){
    const path=Object.freeze([{timelineId:'root',depth:1,generation:1,characterId:8}]);suppressed.push(Object.freeze({id:lessonTextInstanceId(path),path}));
    for(const [characterId,depth,generation]of DATA.textInstanceStates[DATA.textInstanceFrames[s.mainFrame-1]]){
      const path=Object.freeze([{timelineId:'root',depth:2,generation:1,characterId:49},{timelineId:'sprite-49',depth,generation,characterId}]);
      suppressed.push(Object.freeze({id:lessonTextInstanceId(path),path}));
    }
  }
  return Object.freeze({...snapshot,suppressedInstances:Object.freeze(suppressed)});
}
