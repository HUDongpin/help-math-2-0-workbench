import type {LessonTextBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import {ALG_L07_P002_SOURCE as SOURCE,type AlgL07P002Frame} from './alg-l07-p002-state-v1';
export const ALG_L07_P002_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l07-p002-source-service-plans-v1',
 placementId:SOURCE.animationId,animationId:SOURCE.animationId,sourceSwfSha256:SOURCE.sourceSha256,template:'complex-figure',
 blocks:Object.freeze([
  {id:'lesson-title',sourceTextIds:['character-453/run-0'],sourceShapeIds:[454],role:'title',language:'en',readingOrder:0,valueSource:'source-static'},
  {id:'service-plans-title',sourceTextIds:['character-160/run-0'],role:'heading',language:'en',readingOrder:1,valueSource:'source-static'},
  {id:'service-plans-header',sourceTextIds:['character-155/run-0','character-155/run-1'],role:'label',language:'en',readingOrder:2,valueSource:'source-static'},
  ...SOURCE.rows.map((row,index)=>({id:`service-plan-${index+1}`,sourceTextIds:[`character-${row.characterId}/run-0`],role:'body' as const,language:'en' as const,readingOrder:3+index,valueSource:'maintained-page-state' as const}))
 ] as const)});
export function algL07P002TextSnapshot(state:AlgL07P002Frame){
 return buildLessonTextSnapshot(ALG_L07_P002_TEXT_BINDING,{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,lang:state.language,seed:state.seed,replay:state.replay},
 {'lesson-title':{text:SOURCE.title,visible:state.mainFrame!==null},'service-plans-title':{text:SOURCE.tableTitle,visible:state.tableVisible},
 'service-plans-header':{text:'Plan Monthly Fee Minutes Fee',visible:state.tableVisible},
 ...Object.fromEntries(SOURCE.rows.map((row,index)=>[`service-plan-${index+1}`,{text:`${index+1}. ${row.plan} ${row.monthly} ${row.rate}`,visible:state.tableVisible}]))});
}
