import type{RuntimeContext}from'./contract';import type{LessonTextBinding}from'./lesson-text-contract';import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{ALG_L08_P019_SOURCE as S,p019InitialState,p019Visual,type P019State}from'./alg-l08-p019-state-v1';
export const P019_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-80',frameCount:576,rootFrame:6}]);
export const P019_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P019_DEFAULTS=Object.freeze({'root':'source-linear-equations','sprite-80':'source-linear-equations'});
export const P019_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l08-p019-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[1],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[1],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'definition',sourceTextIds:['character-4','character-34'],role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 ...S.textBindings.map((a,i)=>({id:`text-${a.depth}`,sourceTextIds:a.sourceTextIds,role:'label' as const,language:'en' as const,readingOrder:i+3,valueSource:'maintained-page-state' as const}))]as const)});
export function p019View(state:P019State,context:RuntimeContext,ready=true){const visual=p019Visual(state.mainFrame),values:Record<string,{text:string;visible:boolean}>={};const set=(id:string,text:string,visible=true)=>values[id]={text,visible:ready&&visible&&Boolean(text.trim())};
 set('course-title','Graphing Linear Equations:');set('activity-title','Instruction');set('definition',visual.paragraph.text,visual.paragraph.alpha>0);
 for(const a of S.textBindings){const p=visual.texts.find(p=>p.depth===a.depth);set(`text-${a.depth}`,p?.text??'',Boolean(p?.alpha));}
 const frameDomain=context.frameDomain??'sprite-80',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,state,ready,visual,values,frame:context.frame,frameDomain,rootFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',sourceTextIds:Object.freeze([...new Set([visual.paragraph.sourceTextId,...(visual.definitionFlash?[visual.definitionFlash.sourceTextId]:[]),...visual.texts.filter(t=>t.alpha>0).map(t=>t.sourceTextId)])]),textSnapshot:buildLessonTextSnapshot(P019_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});
}
export function algL08P019Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-80',scenario:'source-linear-equations',lang:'en',seed:0}){const domain=context.frameDomain??'sprite-80',spec=P019_DOMAINS.find(d=>d.id===domain);if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||context.scenario!=='source-linear-equations'||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-p019-frame-identity');return p019View({...p019InitialState(),mainFrame:domain==='sprite-80'?frame:1,replay:context.replay??0},{...context,frame,frameDomain:domain},domain!=='root'||frame>=6);}
export type P019View=ReturnType<typeof p019View>;
