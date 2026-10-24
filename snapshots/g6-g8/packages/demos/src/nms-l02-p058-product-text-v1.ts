import type {RuntimeContext} from './contract';
import type {LessonTextBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import {P058_ID,P058_SOURCE_SHA,P058_LEFT_STRATEGIES,P058_RIGHT_STRATEGIES,p058SemanticSnapshot} from './nms-l02-p058-semantic-v1';

export const P058_PRODUCT_SCENARIO='source-static-frame';
export const P058_PRODUCT_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,
 version:'nms-l02-p058-source-semantic-product-v1',placementId:P058_ID,animationId:P058_ID,
 sourceSwfSha256:P058_SOURCE_SHA,template:'explanation',blocks:Object.freeze([
  {id:'step-one',sourceTextIds:['9'],role:'body',language:'en',readingOrder:0,valueSource:'source-static'},
  {id:'step-two',sourceTextIds:['12'],role:'body',language:'en',readingOrder:1,valueSource:'source-static'},
  {id:'step-three',sourceTextIds:['14'],role:'body',language:'en',readingOrder:2,valueSource:'source-static'},
  {id:'step-four',sourceTextIds:['15'],role:'body',language:'en',readingOrder:3,valueSource:'source-static'},
  {id:'heading',sourceTextIds:['17'],role:'heading',language:'en',readingOrder:4,valueSource:'source-static'},
  {id:'strategies',sourceTextIds:['19'],role:'heading',language:'en',readingOrder:5,valueSource:'source-static'},
  ...P058_LEFT_STRATEGIES.map((_,i)=>({id:`left-${i}`,sourceTextIds:['26'],role:'body' as const,language:'en' as const,readingOrder:6+i,valueSource:'source-static' as const})),
  ...P058_RIGHT_STRATEGIES.map((_,i)=>({id:`right-${i}`,sourceTextIds:['24'],role:'body' as const,language:'en' as const,readingOrder:10+i,valueSource:'source-static' as const})),
  {id:'show-work',sourceTextIds:['32','35'],role:'body',language:'en',readingOrder:14,valueSource:'source-static'},
 ] as const)});
export function p058ProductContextReady(context:RuntimeContext):boolean{
 return Number.isSafeInteger(context.frame)&&context.frame>=1&&context.frame<=274&&
  context.frameDomain==='sprite-37'&&context.rootFrame===6&&context.scenario===P058_PRODUCT_SCENARIO&&
  context.lang==='en'&&context.seed===0&&Number.isSafeInteger(context.replay??0)&&(context.replay??0)>=0;
}
export function p058ProductTextSnapshotV1(context:RuntimeContext){
 const ready=p058ProductContextReady(context),state=ready?p058SemanticSnapshot(context.frame):null;
 const values:Record<string,{text:string;visible:boolean}>={
  'step-one':{text:'Restate the question.',visible:ready},'step-two':{text:'Organize the information.',visible:ready},
  'step-three':{text:'Solve the problem.',visible:ready},
  'step-four':{text:'Check your answer.',visible:Boolean(state&&state.stepFour15.alpha>0)},
  heading:{text:'4 Check your answer.',visible:Boolean(state&&state.heading17.alpha>0)},
  strategies:{text:'Strategies to try:',visible:Boolean(state&&state.strategies19.alpha>0)},
  'show-work':{text:'Show your work.',visible:Boolean(state&&state.show32.alpha>0)},
 };
 P058_LEFT_STRATEGIES.forEach((text,i)=>{values[`left-${i}`]={text,visible:Boolean(state&&state.leftStrategies26.alpha>0)};});
 P058_RIGHT_STRATEGIES.forEach((text,i)=>{values[`right-${i}`]={text,visible:Boolean(state&&state.rightStrategies24.alpha>0)};});
 const snapshot=buildLessonTextSnapshot(P058_PRODUCT_TEXT_BINDING,context,values);
 return ready?snapshot:Object.freeze({...snapshot,status:'blocked' as const,
  blockers:Object.freeze([...snapshot.blockers,'unsupported-p058-source-context']),blocks:Object.freeze([]),suppressedInstances:Object.freeze([])});
}
