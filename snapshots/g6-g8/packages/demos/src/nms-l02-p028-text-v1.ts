import {P028_TEACHING_DATA as DATA} from './generated/nms-l02-p028-teaching-data-v1';
import type {LessonTextBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId} from './lesson-text-snapshot';
import type {P028FrameState} from './nms-l02-p028-timeline-v1';
export const P028_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p028-native-source-v1',animationId:DATA.animationId,placementId:DATA.animationId,sourceSwfSha256:DATA.sourceSha256,template:'explanation',blocks:Object.freeze([
  {id:'course-title',sourceTextIds:[],sourceShapeIds:[8],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
  {id:'activity-title',sourceTextIds:[],sourceShapeIds:[8],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
  ...DATA.lines.map((line,i)=>({id:'line-'+line.characterId,sourceTextIds:line.runs.map(r=>r.sourceTextId),role:'body' as const,language:'en' as const,readingOrder:2+i,valueSource:'maintained-page-state' as const})),
  {id:'tenths',sourceTextIds:['character-18/run-0'],role:'label',language:'en',readingOrder:6,valueSource:'source-static'},
  {id:'hundredths',sourceTextIds:['character-19/run-0'],role:'label',language:'en',readingOrder:7,valueSource:'source-static'},
] as const)});
export function p028TextSnapshot(s:P028FrameState){
  const values:Record<string,{text:string;visible:boolean}>={
    'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible:s.mainFrame!==null},
    'activity-title':{text:'Instruction',visible:s.mainFrame!==null},
    tenths:{text:'10 equal parts',visible:s.gridAlpha>0},
    hundredths:{text:'100 equal parts',visible:s.gridAlpha>0},
  };
  for(const line of s.lines){const text=line.runs.map(r=>r.visiblePrefix).join('');values['line-'+line.characterId]={text,visible:!!text.trim()};}
  const snapshot=buildLessonTextSnapshot(P028_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:'default',lang:s.language,seed:s.seed,replay:s.replay},values);
  const suppressed=[];
  if(s.mainFrame!==null){
    const titlePath=Object.freeze([{timelineId:'root',depth:1,generation:1,characterId:8}]);suppressed.push(Object.freeze({id:lessonTextInstanceId(titlePath),path:titlePath}));
    for(const [cid,depth,birth]of[[12,4,1],[22,14,84],[26,22,117],[28,27,169],[18,30,64],[19,31,64]]){
      if(s.mainFrame<birth)continue;
      const path=Object.freeze([{timelineId:'root',depth:2,generation:1,characterId:29},{timelineId:'sprite-29',depth,generation:1,characterId:cid}]);
      suppressed.push(Object.freeze({id:lessonTextInstanceId(path),path}));
    }
  }
  return Object.freeze({...snapshot,suppressedInstances:Object.freeze(suppressed)});
}
