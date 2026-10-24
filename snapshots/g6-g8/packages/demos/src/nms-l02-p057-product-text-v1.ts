import type {RuntimeContext} from './contract';
import type {LessonTextBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import {P057_ID,P057_SOURCE_SHA,P057_LEFT_STRATEGIES,P057_RIGHT_STRATEGIES,p057SemanticSnapshot} from './nms-l02-p057-semantic-v1';

export const P057_PRODUCT_SCENARIO='source-static-frame';
const glyphIds=Array.from({length:31},(_,i)=>String(i+27));
export const P057_PRODUCT_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,
 version:'nms-l02-p057-source-semantic-product-v1',placementId:P057_ID,animationId:P057_ID,
 sourceSwfSha256:P057_SOURCE_SHA,template:'explanation',blocks:Object.freeze([
  {id:'step-one',sourceTextIds:['9'],role:'body',language:'en',readingOrder:0,valueSource:'source-static'},
  {id:'step-two',sourceTextIds:['12'],role:'body',language:'en',readingOrder:1,valueSource:'source-static'},
  {id:'step-three',sourceTextIds:['19'],role:'body',language:'en',readingOrder:2,valueSource:'source-static'},
  {id:'heading',sourceTextIds:['14','15'],role:'heading',language:'en',readingOrder:3,valueSource:'source-static'},
  {id:'strategies',sourceTextIds:['23'],role:'heading',language:'en',readingOrder:4,valueSource:'source-static'},
  ...P057_LEFT_STRATEGIES.map((_,i)=>({id:`left-${i}`,sourceTextIds:glyphIds,role:'body' as const,language:'en' as const,readingOrder:5+i,valueSource:'source-static' as const})),
  ...P057_RIGHT_STRATEGIES.map((_,i)=>({id:`right-${i}`,sourceTextIds:['59'],role:'body' as const,language:'en' as const,readingOrder:9+i,valueSource:'source-static' as const})),
  {id:'circle-answer',sourceTextIds:['64'],role:'body',language:'en',readingOrder:13,valueSource:'source-static'},
 ] as const)});
export function p057ProductContextReady(context:RuntimeContext):boolean{
 return Number.isSafeInteger(context.frame)&&context.frame>=1&&context.frame<=328&&
  context.frameDomain==='sprite-66'&&context.rootFrame===6&&context.scenario===P057_PRODUCT_SCENARIO&&
  context.lang==='en'&&context.seed===0&&Number.isSafeInteger(context.replay??0)&&(context.replay??0)>=0;
}
export function p057ProductTextSnapshotV1(context:RuntimeContext){
 const ready=p057ProductContextReady(context),state=ready?p057SemanticSnapshot(context.frame):null;
 const values:Record<string,{text:string;visible:boolean}>={
  'step-one':{text:'Restate the question.',visible:ready},'step-two':{text:'Organize the information.',visible:ready},
  'step-three':{text:'Solve the problem.',visible:Boolean(state&&state.stepThreeAlpha>0)},
  heading:{text:'3 Solve the problem.',visible:Boolean(state&&state.headingAlpha>0)},
  strategies:{text:'Strategies to try:',visible:Boolean(state&&state.strategiesHeadingAlpha>0)},
  'circle-answer':{text:'Circle your answer',visible:Boolean(state&&state.finalPromptAlpha>0)},
 };
 P057_LEFT_STRATEGIES.forEach((text,i)=>{values[`left-${i}`]={text,visible:Boolean(state&&state.leftStrategiesAlpha>0)};});
 P057_RIGHT_STRATEGIES.forEach((text,i)=>{values[`right-${i}`]={text,visible:Boolean(state&&state.rightStrategiesAlpha>0)};});
 const snapshot=buildLessonTextSnapshot(P057_PRODUCT_TEXT_BINDING,context,values);
 return ready?snapshot:Object.freeze({...snapshot,status:'blocked' as const,
  blockers:Object.freeze([...snapshot.blockers,'unsupported-p057-source-context']),blocks:Object.freeze([]),suppressedInstances:Object.freeze([])});
}
