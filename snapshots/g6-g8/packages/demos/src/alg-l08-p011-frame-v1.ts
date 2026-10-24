import type{RuntimeContext}from'./contract';import type{LessonTextBinding}from'./lesson-text-contract';import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{ALG_L08_P011_SOURCE as S,p011InitialState,p011Visual,type P011State}from'./alg-l08-p011-state-v1';
export const P011_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-2',frameCount:1,rootFrame:6},{id:'sprite-60',frameCount:288,rootFrame:6}]);
export const P011_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P011_DEFAULTS=Object.freeze({'root':'source-slope','sprite-2':'source-slope','sprite-60':'source-slope'});
export const P011_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l08-p011-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[1],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[1],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 ...[32,55,59].map((id,i)=>({id:`paragraph-${i}`,sourceTextIds:[`character-${id}`],role:'body' as const,language:'en' as const,readingOrder:i+2,valueSource:'maintained-page-state' as const})),
 ...[39,41,43].map((id,i)=>({id:`callout-${id}`,sourceTextIds:[`character-${id}`],role:'label' as const,language:'en' as const,readingOrder:i+5,valueSource:'maintained-page-state' as const})),
 ...S.graph.labels.map((l,i)=>({id:`axis-${i}`,sourceTextIds:[l.sourceTextId],role:'label' as const,language:'en' as const,readingOrder:i+8,valueSource:'source-static' as const}))]as const)});
export function p011View(state:P011State,context:RuntimeContext,ready=true){const visual=p011Visual(state.mainFrame),values:Record<string,{text:string;visible:boolean}>={},childOnly=context.frameDomain==='sprite-2';const set=(id:string,text:string,visible=true)=>values[id]={text,visible:ready&&visible&&Boolean(text.trim())};
 set('course-title','Graphing Linear Equations:');set('activity-title','Vocabulary');visual.paragraphs.forEach((text,i)=>set(`paragraph-${i}`,text,!childOnly));
 for(const id of[39,41,43]){const callout=visual.callouts.find(c=>c.sourceCharacterId===id);set(`callout-${id}`,callout?.text??'',!childOnly&&Boolean(callout?.alpha));}
 S.graph.labels.forEach((l,i)=>set(`axis-${i}`,l.text,!childOnly&&visual.graphAlpha>0));
 const frameDomain=context.frameDomain??'sprite-60',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,state,ready,childOnly,visual,values,frame:context.frame,frameDomain,rootFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',sourceTextIds:Object.freeze([...new Set(P011_TEXT_BINDING.blocks.filter(b=>values[b.id].visible).flatMap(b=>b.sourceTextIds))]),textSnapshot:buildLessonTextSnapshot(P011_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});
}
export function algL08P011Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-60',scenario:'source-slope',lang:'en',seed:0}){const domain=context.frameDomain??'sprite-60',spec=P011_DOMAINS.find(d=>d.id===domain);if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||context.scenario!=='source-slope'||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-p011-frame-identity');return p011View({...p011InitialState(),mainFrame:domain==='sprite-60'?frame:1,replay:context.replay??0},{...context,frame,frameDomain:domain},domain!=='root'||frame>=6);}
export type P011View=ReturnType<typeof p011View>;
