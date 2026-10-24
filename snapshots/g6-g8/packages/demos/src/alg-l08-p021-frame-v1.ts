import type{RuntimeContext}from'./contract';import type{LessonTextBinding}from'./lesson-text-contract';import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{ALG_L08_P021_SOURCE as S,p021InitialState,p021Visual,type P021State}from'./alg-l08-p021-state-v1';
export const P021_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-70',frameCount:797,rootFrame:6}]);
export const P021_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P021_DEFAULTS=Object.freeze({'root':'source-slope','sprite-70':'source-slope'});
export const P021_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l08-p021-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[1],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[1],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 ...S.textBindings.map((a,i)=>({id:`text-${a.depth}`,sourceTextIds:a.sourceTextIds,role:'label' as const,language:'en' as const,readingOrder:i+3,valueSource:'maintained-page-state' as const}))]as const)});
export function p021View(state:P021State,context:RuntimeContext,ready=true){const visual=p021Visual(state.mainFrame),values:Record<string,{text:string;visible:boolean}>={};const set=(id:string,text:string,visible=true)=>values[id]={text,visible:ready&&visible&&Boolean(text.trim())};
 set('course-title','Graphing Linear Equations:');set('activity-title','Instruction');
 for(const a of S.textBindings){const p=visual.texts.find(p=>p.depth===a.depth);set(`text-${a.depth}`,p?.text??'',Boolean(p?.alpha));}
 const frameDomain=context.frameDomain??'sprite-70',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,state,ready,visual,values,frame:context.frame,frameDomain,rootFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',sourceTextIds:Object.freeze([...new Set(visual.texts.filter(t=>t.alpha>0).map(t=>t.sourceTextId))]),textSnapshot:buildLessonTextSnapshot(P021_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});
}
export function algL08P021Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-70',scenario:'source-slope',lang:'en',seed:0}){const domain=context.frameDomain??'sprite-70',spec=P021_DOMAINS.find(d=>d.id===domain);if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||context.scenario!=='source-slope'||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-p021-frame-identity');return p021View({...p021InitialState(),mainFrame:domain==='sprite-70'?frame:1,replay:context.replay??0},{...context,frame,frameDomain:domain},domain!=='root'||frame>=6);}
export type P021View=ReturnType<typeof p021View>;
