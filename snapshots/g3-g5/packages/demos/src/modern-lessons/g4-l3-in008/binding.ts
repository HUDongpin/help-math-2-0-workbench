import type {LessonTextBinding,TextPresentationSnapshot} from '../../lesson-text-contract';
import type {RuntimeContext} from '../../contract';
import type {SourceStaticCanvasFrameState} from '../../source-static-canvas-candidate';
import {createCourseG04L03In008InteractionState,type CourseG04L03In008InteractionState} from '../../timelines/course-g04-l03-in-008-interaction';
import SOURCE from './source.generated.json';
export const ID='course-g04-l03-in-008',DOMAIN='sprite-57',VERSION='g04-l03-placement-019-modern-text-v1';
const text=(id:number)=>`character-${id}/run-0`;
export const BINDING:LessonTextBinding={schemaVersion:1,version:VERSION,placementId:'g04-l03-placement-019',animationId:ID,sourceSwfSha256:SOURCE.sourceSwfSha256,template:'exercise',blocks:[
{id:'title',sourceTextIds:[text(4)],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
...SOURCE.states[216].prose.map((p,i)=>({id:i===0?'prompt':`instruction-${i-1}`,sourceTextIds:[...p.sourceTextIds,...(i===0?[text(22)]:[])],role:i===0?'question' as const:'body' as const,language:'en' as const,readingOrder:i+1,valueSource:'maintained-page-state' as const})),
{id:'demonstration-prefix',sourceTextIds:[7,8,9,10].map(text),sourceShapeIds:[11],role:'label',language:'en',readingOrder:10,valueSource:'maintained-page-state'},
{id:'question',sourceTextIds:['character-38'],role:'question',language:'en',readingOrder:11,valueSource:'maintained-page-state'},
{id:'first-answer',sourceTextIds:[text(27),text(28),'character-39'],role:'answer',language:'en',readingOrder:12,valueSource:'maintained-page-state'},
{id:'between-answers',sourceTextIds:[text(13)],role:'label',language:'en',readingOrder:13,valueSource:'source-static'},
{id:'second-answer',sourceTextIds:['character-40'],role:'answer',language:'en',readingOrder:14,valueSource:'maintained-page-state'},
{id:'after-answers',sourceTextIds:[text(12)],role:'label',language:'en',readingOrder:15,valueSource:'source-static'},
{id:'check-answer',sourceTextIds:[text(15)],role:'answer',language:'en',readingOrder:20,valueSource:'source-static'},
{id:'new-problem',sourceTextIds:[text(16)],role:'answer',language:'en',readingOrder:21,valueSource:'source-static'},
{id:'feedback',sourceTextIds:['character-51'],role:'feedback',language:'en',readingOrder:30,valueSource:'maintained-page-state'},
{id:'close-feedback',sourceTextIds:[text(42)],role:'answer',language:'en',readingOrder:31,valueSource:'maintained-page-state'}]};
export function getIn008NativeState(frame:number){if(!Number.isInteger(frame)||frame<1||frame>SOURCE.frames)throw Error('Unsupported IN008 source frame');return SOURCE.states[frame-1];}
export function getIn008Snapshot(state:SourceStaticCanvasFrameState,context:RuntimeContext,interaction?:CourseG04L03In008InteractionState):TextPresentationSnapshot{
 const blockers:string[]=[];
 if(state.animationId!==ID||state.sourceSwfSha256!==SOURCE.sourceSwfSha256)blockers.push('source-identity-mismatch');
 if(state.status!=='ready'||state.blocker)blockers.push(state.blocker??'source-state-not-ready');
 if(state.frameDomain!==DOMAIN||(context.frameDomain??DOMAIN)!==DOMAIN)blockers.push('unsupported-frame-domain');
 if(state.scenario!=='source-static-frame'||context.scenario!==state.scenario)blockers.push('unsupported-scenario');
 if(state.language!=='en'||context.lang!=='en')blockers.push('spanish-text-not-source-verified');
 if(!Number.isInteger(context.frame)||context.frame<1||context.frame>217||state.frame!==context.frame||state.rootFrame!==6||(context.rootFrame!==undefined&&context.rootFrame!==6)||!Number.isInteger(context.seed)||context.seed<0||context.seed>0xffffffff||state.seed!==context.seed||!Number.isInteger(context.replay??0)||(context.replay??0)<0)blockers.push('source-context-mismatch');
 const identity={frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:context.replay??0};
 if(blockers.length)return{schemaVersion:1,animationId:ID,bindingVersion:VERSION,sourceSwfSha256:SOURCE.sourceSwfSha256,status:'blocked',blockers,identity,blocks:[],suppressedInstances:[]};
 const s=getIn008NativeState(state.frame),q=interaction??createCourseG04L03In008InteractionState(context.seed),quiz=s.phase!=='demonstration';
 const values:Record<string,{text:string;visible:boolean}>={title:{text:SOURCE.title,visible:true},'demonstration-prefix':{text:s.demonstration.prefix.join(', ')+',',visible:!quiz},question:{text:q.currentQuestion.label.replaceAll('-','−'),visible:quiz},'first-answer':{text:quiz?q.answerFirst:s.demonstration.firstAnswer,visible:true},'second-answer':{text:quiz?q.answerSecond:'',visible:true},'between-answers':{text:SOURCE.separators.betweenAnswers,visible:true},'after-answers':{text:SOURCE.separators.afterAnswers,visible:true},'check-answer':{text:SOURCE.labels.checkAnswer,visible:true},'new-problem':{text:SOURCE.labels.newProblem,visible:true},feedback:{text:q.feedbackText??'',visible:quiz&&q.feedbackVisible},'close-feedback':{text:'Close',visible:quiz&&q.feedbackVisible}};
 s.prose.forEach((p,i)=>{values[i===0?'prompt':`instruction-${i-1}`]={text:p.text,visible:p.visible};});
 return{schemaVersion:1,animationId:ID,bindingVersion:VERSION,sourceSwfSha256:SOURCE.sourceSwfSha256,status:'ready',blockers:[],identity,blocks:BINDING.blocks.map(b=>({id:b.id,...values[b.id],role:b.role,language:b.language,readingOrder:b.readingOrder})),suppressedInstances:[]};
}
