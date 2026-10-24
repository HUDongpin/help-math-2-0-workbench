import type {RuntimeContext} from './contract';
import type {LessonTextBinding,TextPresentationSnapshot} from './lesson-text-contract';
import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import {p056SemanticSnapshot} from './nms-l02-p056-semantic-view-v1';
import {P056_SOURCE_BEHAVIOR} from './timelines/shared-nms002-l02-p056-source-behavior';

export const P056_PRODUCT_SCENARIO='source-static-frame';
export const P056_PRODUCT_TEXT_BINDING:LessonTextBinding=Object.freeze({
  schemaVersion:1,version:'nms-l02-p056-source-semantic-product-v1',
  placementId:P056_SOURCE_BEHAVIOR.animationId,animationId:P056_SOURCE_BEHAVIOR.animationId,
  sourceSwfSha256:P056_SOURCE_BEHAVIOR.swfSha256,template:'explanation',
  blocks:Object.freeze([
    {id:'step-one',sourceTextIds:['9'],role:'body',language:'en',readingOrder:0,valueSource:'source-static'},
    {id:'step-two-heading',sourceTextIds:['12','14'],role:'heading',language:'en',readingOrder:1,valueSource:'source-static'},
    {id:'organize-flash',sourceTextIds:['18'],role:'label',language:'en',readingOrder:2,valueSource:'source-static'},
    {id:'information-flash',sourceTextIds:['19'],role:'label',language:'en',readingOrder:3,valueSource:'source-static'},
    {id:'step-two-plan',sourceTextIds:['12'],role:'body',language:'en',readingOrder:4,valueSource:'source-static'},
    {id:'have-question',sourceTextIds:['20'],role:'question',language:'en',readingOrder:5,valueSource:'source-static'},
    {id:'need-question',sourceTextIds:['22'],role:'question',language:'en',readingOrder:6,valueSource:'source-static'},
  ] as const),
});

export function p056ProductTextContextReady(context:RuntimeContext):boolean{
  return Number.isSafeInteger(context.frame)&&context.frame>=1&&context.frame<=234&&
    context.frameDomain==='sprite-24'&&context.rootFrame===6&&
    context.scenario===P056_PRODUCT_SCENARIO&&context.lang==='en'&&context.seed===0&&
    Number.isSafeInteger(context.replay??0)&&(context.replay??0)>=0;
}

/** Pure source-timed English text. ES changes only the surrounding UI language. */
export function p056ProductTextSnapshotV1(context:RuntimeContext):TextPresentationSnapshot{
  const valid=p056ProductTextContextReady(context);
  const source=valid?p056SemanticSnapshot(context.frame):null;
  const values={
    'step-one':{text:'Restate the question.',visible:valid},
    'step-two-heading':{text:'2 Organize the information.',visible:Boolean(source&&source.headingAlpha>0)},
    'organize-flash':{text:'Organize',visible:source?.highlightedTerm==='Organize'},
    'information-flash':{text:'information',visible:source?.highlightedTerm==='Information'},
    'step-two-plan':{text:'Organize the information.',visible:Boolean(source&&source.stepTwoAlpha>0)},
    'have-question':{text:'What information do I have?',visible:Boolean(source&&source.haveQuestionAlpha>0)},
    'need-question':{text:'What information do I need?',visible:Boolean(source&&source.needQuestionAlpha>0)},
  };
  const snapshot=buildLessonTextSnapshot(P056_PRODUCT_TEXT_BINDING,context,values);
  return valid?snapshot:Object.freeze({...snapshot,status:'blocked' as const,
    blockers:Object.freeze([...snapshot.blockers,'unsupported-p056-source-context']),blocks:Object.freeze([]),
    suppressedInstances:Object.freeze([])});
}
