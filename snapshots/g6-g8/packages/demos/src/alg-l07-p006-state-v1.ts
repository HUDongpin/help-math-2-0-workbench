import type{RuntimeContext}from'./contract';
import type{LessonTextBinding}from'./lesson-text-contract';
import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{ALG_L07_P006_SOURCE as SOURCE}from'./alg-l07-p006-source-v1';
export{ALG_L07_P006_SOURCE}from'./alg-l07-p006-source-v1';
export type P006TermKey='Linear function'|'Nonlinear function';
export const P006_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l07-p006-native-source-v1',animationId:SOURCE.animationId,placementId:SOURCE.animationId,sourceSwfSha256:SOURCE.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:['character-224'],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:['character-224'],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'plans',sourceTextIds:[8,9,10,11,13].map(x=>'character-'+x),role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 {id:'bill-heading',sourceTextIds:['character-43'],role:'heading',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
 {id:'bills-500',sourceTextIds:['character-44'],role:'body',language:'en',readingOrder:4,valueSource:'maintained-page-state'},
 {id:'bills-1000-labels',sourceTextIds:['character-45'],role:'label',language:'en',readingOrder:5,valueSource:'maintained-page-state'},
 ...([83,85,92]as const).map((x,i)=>({id:'calculation-'+x,sourceTextIds:['character-'+x],role:'body' as const,language:'en' as const,readingOrder:6+i,valueSource:'maintained-page-state' as const})),
 {id:'emphasis-90',sourceTextIds:['character-114'],sourceShapeIds:[113],role:'label',language:'en',readingOrder:9,valueSource:'maintained-page-state'},
 {id:'question',sourceTextIds:['character-218'],role:'question',language:'en',readingOrder:10,valueSource:'maintained-page-state'}]as const)});
export function algL07P006Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-223',scenario:'source-real-world',lang:'en',seed:0}){
 const domain=context.frameDomain??'sprite-223';if(!['root','sprite-223'].includes(domain)||!Number.isSafeInteger(frame)||frame<1||frame>(domain==='root'?10:1845)||context.scenario!=='source-real-world'||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295)throw Error('invalid-p006-source-state');
 const ready=domain!=='root'||frame>=6,mainFrame=domain==='root'?1:frame,v=SOURCE.visualStates.find(s=>mainFrame>=s.first&&mainFrame<=s.last)!.value;
 const text=(id:number)=>SOURCE.texts.find(t=>t.characterId===id)!.text.trim(),alpha=(id:number)=>ready?(v.textAlpha as Readonly<Record<number,number>>)[id]??0:0;
 const values=Object.fromEntries(P006_TEXT_BINDING.blocks.map(b=>{const id=Number(b.sourceTextIds[0]?.slice(10));return[b.id,{text:b.id==='course-title'?'Linear and Nonlinear Functions:':b.id==='activity-title'?'Real World Activity':b.id==='question'?v.question:b.sourceTextIds.map(s=>text(Number(s.slice(10)))).join(' '),visible:id===224?ready:id===218?ready&&Boolean(v.question):alpha(id)>0}];}));
 return Object.freeze({animationId:SOURCE.animationId,frame,frameDomain:domain,mainFrame,rootFrame:domain==='root'?frame:6,ready,scenario:context.scenario,traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',language:context.lang,seed:context.seed,replay:context.replay??0,
  plansVisible:alpha(13)>0,billHeadingAlpha:alpha(43),bills500Alpha:alpha(44),billLabels1000Alpha:alpha(45),calculationAlpha:Object.freeze({83:alpha(83),85:alpha(85),92:alpha(92)}),emphasis90:alpha(114)>0,
  question:ready?v.question:'',termAvailable:Object.freeze({'Linear function':ready&&v.termAvailable['Linear function'],'Nonlinear function':ready&&v.termAvailable['Nonlinear function']}),
  suppressInstanceIds:SOURCE.nativeTextInstances.find(s=>mainFrame>=s.first&&mainFrame<=s.last)!.value,
  sourceTextIds:Object.freeze(SOURCE.texts.filter(t=>t.characterId===224?ready:t.characterId===218?ready&&Boolean(v.question):alpha(t.characterId)>0).map(t=>t.sourceTextId)),
  textSnapshot:buildLessonTextSnapshot(P006_TEXT_BINDING,{...context,frame,frameDomain:domain,rootFrame:domain==='root'?frame:6},values)});
}
export type AlgL07P006Frame=ReturnType<typeof algL07P006Frame>;
