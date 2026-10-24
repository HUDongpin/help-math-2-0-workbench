import type{RuntimeContext}from'./contract';import type{LessonTextBinding}from'./lesson-text-contract';import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{ALG_L08_P018_SOURCE as S,p018InitialState,p018Visual,type P018State}from'./alg-l08-p018-state-v1';
export const P018_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-60',frameCount:220,rootFrame:6}]);
export const P018_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P018_DEFAULTS=Object.freeze({'root':'source-linear-equations','sprite-60':'source-linear-equations'});
export const P018_EQUATION_IDS=Object.freeze([37,38,42,47,48,49,50,55,56,57,58,59]);
export const P018_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l08-p018-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[1],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[1],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'definition',sourceTextIds:['character-5'],role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 ...S.axisBindings.map((a,i)=>({id:`axis-${a.depth}`,sourceTextIds:[a.sourceTextId],role:'label' as const,language:'en' as const,readingOrder:i+3,valueSource:'maintained-page-state' as const})),
 ...P018_EQUATION_IDS.map((id,i)=>({id:`equation-${id}`,sourceTextIds:(id===37?[37,45]:[id]).map(id=>`character-${id}`),role:'label' as const,language:'en' as const,readingOrder:i+132,valueSource:'maintained-page-state' as const})),
 ...[51,54].map((id,i)=>({id:`fraction-${id}`,sourceTextIds:['character-52','character-53'],sourceShapeIds:[id],role:'label' as const,language:'en' as const,readingOrder:i+144,valueSource:'maintained-page-state' as const}))]as const)});
export function p018View(state:P018State,context:RuntimeContext,ready=true){const visual=p018Visual(state.mainFrame),values:Record<string,{text:string;visible:boolean}>={};const set=(id:string,text:string,visible=true)=>values[id]={text,visible:ready&&visible&&Boolean(text.trim())};
 set('course-title','Graphing Linear Equations:');set('activity-title','Instruction');set('definition',visual.paragraph.text,visual.paragraph.alpha>0);
 for(const a of S.axisBindings){const p=visual.axisLabels.find(p=>p.depth===a.depth);set(`axis-${a.depth}`,p?.text??'',Boolean(p?.alpha));}
 for(const id of P018_EQUATION_IDS){const p=visual.equations.find(p=>(p.sourceCharacterId===45?37:p.sourceCharacterId)===id);set(`equation-${id}`,p?.text??'',Boolean(p?.alpha));}
 for(const id of[51,54]){const f=visual.fractions.find(f=>f.sourceBarId===id);set(`fraction-${id}`,f?`${f.numerator}/${f.denominator}`:'',Boolean(f?.alpha));}
 const frameDomain=context.frameDomain??'sprite-60',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,state,ready,visual,values,frame:context.frame,frameDomain,rootFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',sourceTextIds:Object.freeze([...new Set(P018_TEXT_BINDING.blocks.filter(b=>values[b.id].visible).flatMap(b=>b.sourceTextIds))]),textSnapshot:buildLessonTextSnapshot(P018_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});
}
export function algL08P018Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-60',scenario:'source-linear-equations',lang:'en',seed:0}){const domain=context.frameDomain??'sprite-60',spec=P018_DOMAINS.find(d=>d.id===domain);if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||context.scenario!=='source-linear-equations'||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-p018-frame-identity');return p018View({...p018InitialState(),mainFrame:domain==='sprite-60'?frame:1,replay:context.replay??0},{...context,frame,frameDomain:domain},domain!=='root'||frame>=6);}
export type P018View=ReturnType<typeof p018View>;
