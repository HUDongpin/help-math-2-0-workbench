import type {RuntimeContext} from './contract';
import type {LessonTextBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import {createSourceLoopingQuizV1,type SourceLoopingQuizState} from './source-looping-quiz-state-v1';
import {ALG_L08_P026_SOURCE as S} from './alg-l08-p026-source-v1';
export const L8P026_MACHINE=createSourceLoopingQuizV1(S);
const children={125:{parent:148,frame:9},144:{parent:148,frame:16},159:{parent:162,frame:16},173:{parent:176,frame:13}} as const;
export const L8P026_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-2',frameCount:1,rootFrame:6},...Object.keys(children).map(id=>({id:`sprite-${id}`,frameCount:1,rootFrame:6})),...S.branches.map(b=>({id:`sprite-${b.spriteId}`,frameCount:b.terminal,rootFrame:6})),{id:'sprite-196',frameCount:372,rootFrame:6}]);
export const L8P026_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const L8P026_DEFAULTS=Object.freeze(Object.fromEntries(L8P026_DOMAINS.map(d=>[d.id,['sprite-125','sprite-144','sprite-159','sprite-173','sprite-148','sprite-162','sprite-176'].includes(d.id)?'wrong-first':['sprite-79','sprite-120','sprite-47','sprite-112'].includes(d.id)?'right-feedback':'source-vocabulary'])));
export const L8P026_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l08-p026-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[1],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[1],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'question',sourceTextIds:['character-6'],role:'question',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 ...S.textBindings.map((a,i)=>({id:`text-${a.depth}`,sourceTextIds:a.sourceTextIds,role:'label' as const,language:'en' as const,readingOrder:i+3,valueSource:'maintained-page-state' as const})),
 ...S.branches.map((b,i)=>({id:`feedback-title-${b.spriteId}`,sourceTextIds:b.titleIds.map(id=>`character-${id}`),role:'feedback' as const,language:'en' as const,readingOrder:100+i,valueSource:'maintained-page-state' as const})),
 ...S.branches.filter(b=>b.kind==='wrong').map((b,i)=>({id:`wrong-text-${b.spriteId}`,sourceTextIds:[`character-${b.dynamicTextId}`],role:'feedback' as const,language:'en' as const,readingOrder:120+i,valueSource:'maintained-page-state' as const})),
 {id:'close',sourceTextIds:['character-135'],role:'label',language:'en',readingOrder:130,valueSource:'maintained-page-state'}]as const)});
export function l8p026Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>S.mainFrameCount)throw Error('invalid-l8p026-main-frame');return S.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
export function l8p026View(state:SourceLoopingQuizState,context:RuntimeContext,ready=true){const v=l8p026Visual(state.mainFrame),f=state.feedback,b=f?S.branches.find(b=>b.spriteId===f.spriteId):null,titleAlpha=f&&b?b.titleAlpha.find(s=>f.frame>=s.first&&f.frame<=s.last)?.value??0:0,closeVisible=L8P026_MACHINE.canClose({...state,glossary:null});
 const values:Record<string,{text:string;visible:boolean}>={'course-title':{text:'Graphing Linear Equations:',visible:ready},'activity-title':{text:'Instruction',visible:ready},question:{text:v.question,visible:ready&&Boolean(v.question)},close:{text:'Close',visible:ready&&closeVisible}};
 for(const branch of S.branches){values[`feedback-title-${branch.spriteId}`]={text:branch.title,visible:ready&&b?.spriteId===branch.spriteId&&titleAlpha>0};if(branch.kind==='wrong')values[`wrong-text-${branch.spriteId}`]={text:state.wrongText??'',visible:ready&&b?.spriteId===branch.spriteId&&closeVisible};}
 for(const binding of S.textBindings){const t=v.texts.find(t=>t.depth===binding.depth);values[`text-${binding.depth}`]={text:t?.text??'',visible:ready&&Boolean(t?.alpha)};}
 const frameDomain=context.frameDomain??'sprite-196',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,ready,state,visual:v,feedbackTitle:b?.title??'',feedbackTitleAlpha:titleAlpha,closeVisible,frame:context.frame,frameDomain,rootFrame,mainFrame:state.mainFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',sourceTextIds:Object.freeze([...new Set(L8P026_TEXT_BINDING.blocks.filter(b=>values[b.id].visible).flatMap(b=>b.sourceTextIds))]),textSnapshot:buildLessonTextSnapshot(L8P026_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});
}
export function algL08P026Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-196',scenario:'source-vocabulary',lang:'en',seed:0}){const domain=context.frameDomain??'sprite-196',spec=L8P026_DOMAINS.find(d=>d.id===domain);if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-l8p026-frame-identity');
 let s=L8P026_MACHINE.initialState(0,context.replay??0);const id=Number(domain.slice(7)),child=children[id as keyof typeof children],b=S.branches.find(b=>b.spriteId===(child?.parent??id));
 if(b){if(!((b.kind==='wrong'&&['wrong-first','wrong-second'].includes(context.scenario))||(b.kind==='right'&&context.scenario==='right-feedback')))throw Error('invalid-l8p026-feedback-scenario');const local=child?.frame??frame,second=context.scenario==='wrong-second';s={...s,phase:'feedback',mainFrame:95,quizSection:true,quizTryCount:second?1:0,selected:b.kind==='right'?1:2,feedback:{spriteId:b.spriteId,kind:b.kind,frame:local,closing:b.kind==='wrong'&&local>b.hold,serial:1},selectionSerial:1,wrongText:b.kind==='wrong'?(second?S.behavior.wrongLater:S.behavior.wrongFirst):null};}
 else{if(context.scenario!=='source-vocabulary')throw Error('invalid-l8p026-main-scenario');const main=domain==='sprite-196'?frame:1;s={...s,mainFrame:main,phase:main<95?'prequiz':main===95?'quiz-held':'postquiz',quizSection:main===95,quizButtonsEnabled:main===95};}
 return l8p026View(s,{...context,frame,frameDomain:domain},domain!=='root'||frame>=6);
}
export type L8P026View=ReturnType<typeof l8p026View>;
