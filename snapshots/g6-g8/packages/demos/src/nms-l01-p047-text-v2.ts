import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import type {LessonTextBinding} from './lesson-text-contract';
import {P047_TEXT_BINDING as BASE_BINDING,p047TextSnapshot as baseSnapshot} from './nms-l01-p047-text-v1';
import {P047_FEEDBACK_BINDINGS} from './generated/nms-l01-p047-feedback-bindings-v1';
import {p047Review,type P047QuizState} from './nms-l01-p047-quiz-v1';

/** Add the exact108 source review fields to the same quiz-state snapshot. */
export const P047_TEXT_BINDING:LessonTextBinding=Object.freeze({...BASE_BINDING,version:BASE_BINDING.version+'-feedback-v2',
 blocks:Object.freeze([...BASE_BINDING.blocks,...P047_FEEDBACK_BINDINGS.map((field,index)=>Object.freeze({id:field.blockId,
  sourceTextIds:[field.sourceTextId],role:'feedback' as const,language:'en' as const,readingOrder:1000+index,valueSource:'maintained-page-state' as const}))])});
export function p047TextSnapshot(state:P047QuizState,language:'en'|'es'){
 const base=baseSnapshot(state,language);if(base.status!=='ready')return base;
 const values:Record<string,{text:string;visible:boolean}>=Object.fromEntries(base.blocks.map(block=>[block.id,{text:block.text,visible:block.visible}]));
 const review=p047Review(state);
 for(const field of P047_FEEDBACK_BINDINGS){const feedback=review?.question.id===field.question?review.options.find(option=>option.letter===field.letter)?.feedback:null;
  values[field.blockId]={text:feedback??'',visible:Boolean(feedback)};}
 return buildLessonTextSnapshot(P047_TEXT_BINDING,{frame:base.identity.frame,rootFrame:base.identity.rootFrame,frameDomain:base.identity.frameDomain,
  scenario:base.identity.scenario,lang:language,seed:state.seed,replay:state.replay},values);
}
