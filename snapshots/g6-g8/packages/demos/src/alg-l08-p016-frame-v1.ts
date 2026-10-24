import type{RuntimeContext}from'./contract';import type{LessonTextBinding}from'./lesson-text-contract';import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{ALG_L08_P016_SOURCE as S,p016InitialState,p016Visual,type P016State}from'./alg-l08-p016-state-v1';
export const P016_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-33',frameCount:575,rootFrame:6}]);
export const P016_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P016_DEFAULTS=Object.freeze({'root':'source-slope-intercept','sprite-33':'source-slope-intercept'});
export const P016_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l08-p016-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[1],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[1],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 ...[5,10,14].map((id,i)=>({id:`paragraph-${i}`,sourceTextIds:[`character-${id}`],role:'body' as const,language:'en' as const,readingOrder:i+2,valueSource:'maintained-page-state' as const})),
 ...[[17],[17],[17],[17,27],[17,26]].map((ids,i)=>({id:`equation-${i}`,sourceTextIds:ids.map(id=>`character-${id}`),role:'label' as const,language:'en' as const,readingOrder:i+5,valueSource:'maintained-page-state' as const})),
 {id:'fraction',sourceTextIds:['character-18'],sourceShapeIds:[19],role:'label',language:'en',readingOrder:10,valueSource:'maintained-page-state'},
 ...[24,32].map((id,i)=>({id:`callout-${i}`,sourceTextIds:[`character-${id}`],role:'label' as const,language:'en' as const,readingOrder:i+11,valueSource:'maintained-page-state' as const}))]as const)});
export function p016View(state:P016State,context:RuntimeContext,ready=true){const visual=p016Visual(state.mainFrame),values:Record<string,{text:string;visible:boolean}>={};const set=(id:string,text:string,visible=true)=>values[id]={text,visible:ready&&visible&&Boolean(text.trim())};
 set('course-title','Graphing Linear Equations:');set('activity-title','Vocabulary');visual.paragraphs.forEach((text,i)=>set(`paragraph-${i}`,text));
 for(let i=0;i<5;i++){const part=visual.equation?.parts[i];set(`equation-${i}`,part?.text??'',Boolean(part?.alpha));}
 const fraction=visual.equation?.fraction;set('fraction',fraction?`${fraction.numerator}/${fraction.denominator}`:'',Boolean(fraction?.alpha));
 for(const[id,i]of[[24,0],[32,1]]){const c=visual.callouts.find(c=>c.sourceCharacterId===id);set(`callout-${i}`,c?.text??'',Boolean(c?.alpha));}
 const frameDomain=context.frameDomain??'sprite-33',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,state,ready,visual,values,frame:context.frame,frameDomain,rootFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',sourceTextIds:Object.freeze([...new Set(P016_TEXT_BINDING.blocks.filter(b=>values[b.id].visible).flatMap(b=>b.sourceTextIds))]),textSnapshot:buildLessonTextSnapshot(P016_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});
}
export function algL08P016Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-33',scenario:'source-slope-intercept',lang:'en',seed:0}){const domain=context.frameDomain??'sprite-33',spec=P016_DOMAINS.find(d=>d.id===domain);if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||context.scenario!=='source-slope-intercept'||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-p016-frame-identity');return p016View({...p016InitialState(),mainFrame:domain==='sprite-33'?frame:1,replay:context.replay??0},{...context,frame,frameDomain:domain},domain!=='root'||frame>=6);}
export type P016View=ReturnType<typeof p016View>;
