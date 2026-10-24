import type{RuntimeContext}from'./contract';
import type{LessonTextBinding}from'./lesson-text-contract';
import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{ALG_L07_P034_SOURCE as S,p034InitialState,p034Visual,type P034State}from'./alg-l07-p034-state-v1';
export const P034_DOMAINS=Object.freeze([{id:'root',frameCount:10},...[37,38,39,40,41,42,43,44,58].map(id=>({id:`sprite-${id}`,frameCount:1,rootFrame:6})),...([60,62]as const).map(id=>({id:`sprite-${id}`,frameCount:20,rootFrame:6})),{id:'sprite-86',frameCount:484,rootFrame:6}]);
export const P034_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P034_DEFAULTS=Object.freeze(Object.fromEntries(P034_DOMAINS.map(d=>[d.id,d.id==='sprite-60'?'wrong-coach':d.id==='sprite-62'?'right-coach':d.id==='sprite-58'?'wrong-popup':'source-instruction'])));
const rowInputIds=[12,14,15,13,16],rowOutputIds=[20,21,22,13,20];
const emphases=[['input-2',64,'–2'],['output4-negative',65,'4'],['input-1',73,'–1'],['output1',74,'1'],['input0',78,'0'],['output0',78,'0'],['input2',82,'2'],['output4-positive',83,'4']]as const;
export const P034_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l07-p034-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[8],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[8],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 ...([25,34]as const).map((id,i)=>({id:`instruction-${i}`,sourceTextIds:[`character-${id}`],role:'body' as const,language:'en' as const,readingOrder:2+i,valueSource:'maintained-page-state' as const})),
 {id:'formula',sourceTextIds:['character-17'],role:'body',language:'en',readingOrder:4,valueSource:'maintained-page-state'},
 ...([10,11]as const).map((id,i)=>({id:i?'output-heading':'input-heading',sourceTextIds:[`character-${id}`],role:'label' as const,language:'en' as const,readingOrder:5+i,valueSource:'maintained-page-state' as const})),
 ...S.rows.flatMap((r,i)=>[{id:`input-${i}`,sourceTextIds:[`character-${rowInputIds[i]}`],role:'body' as const,language:'en' as const,readingOrder:7+i*2,valueSource:'maintained-page-state' as const},{id:`output-${i}`,sourceTextIds:[`character-${rowOutputIds[i]}`],role:'answer' as const,language:'en' as const,readingOrder:8+i*2,valueSource:'maintained-page-state' as const}]),
 ...S.drops.map((d,i)=>({id:`tile-${d.name}`,sourceTextIds:[`character-${d.textId}`],role:'answer' as const,language:'en' as const,readingOrder:17+i,valueSource:'maintained-page-state' as const})),
 {id:'demo-copy',sourceTextIds:['character-35'],role:'answer',language:'en',readingOrder:21,valueSource:'maintained-page-state'},
 {id:'wrong-hint',sourceTextIds:['character-57'],role:'feedback',language:'en',readingOrder:22,valueSource:'maintained-page-state'},
 {id:'close',sourceTextIds:['character-49'],role:'label',language:'en',readingOrder:23,valueSource:'maintained-page-state'},
 ...S.columns.flatMap((c,i)=>c.ids.map((id,k)=>({id:`step-${i}-${k}`,sourceTextIds:[`character-${id}`,...(k===2?['character-71']:[])],role:'body' as const,language:'en' as const,readingOrder:24+i*4+k,valueSource:'maintained-page-state' as const}))),
 ...emphases.map(([key,id],i)=>({id:`emphasis-${key}`,sourceTextIds:[`character-${id}`],role:'body' as const,language:'en' as const,readingOrder:40+i,valueSource:'maintained-page-state' as const}))
]as const)});
export function p034View(state:P034State,context:RuntimeContext,ready=true){
 const v=p034Visual(state.mainFrame),post=state.phase==='postquiz'||state.phase==='ended',table=ready&&v.tableAlpha>0;
 const outputs=S.rows.map(r=>r.target===null?r.output:post||state.placed[r.target]?r.output:'');
 const values:Record<string,{text:string;visible:boolean}>={'course-title':{text:'Linear and Nonlinear Functions:',visible:ready},'activity-title':{text:'Instruction',visible:ready},formula:{text:'y = x2',visible:ready&&v.formulaAlpha>0},'input-heading':{text:'Input',visible:table},'output-heading':{text:'Output',visible:table},'demo-copy':{text:'1',visible:ready&&v.demoCopyVisible},'wrong-hint':{text:S.hint,visible:ready&&state.popup},close:{text:'Close',visible:ready&&state.popup}};
 for(let i=0;i<2;i++)values[`instruction-${i}`]={text:v.paragraphs[i],visible:ready&&Boolean(v.paragraphs[i])};
 S.rows.forEach((r,i)=>{values[`input-${i}`]={text:r.input,visible:table};values[`output-${i}`]={text:outputs[i],visible:table&&Boolean(outputs[i])};});
 for(const d of S.drops)values[`tile-${d.name}`]={text:d.value,visible:ready&&!post&&v.bankAlpha>0&&!Object.values(state.placed).includes(d.name)};
 S.columns.forEach((c,i)=>c.steps.forEach((text,k)=>values[`step-${i}-${k}`]={text:text.replaceAll('²','2'),visible:ready&&v.stepAlpha[i][k]>0}));
 for(const[key,,text]of emphases)values[`emphasis-${key}`]={text,visible:ready&&v.emphasis[key]};
 const frameDomain=context.frameDomain??'sprite-86',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,ready,state,visual:v,outputs,values,frame:context.frame,frameDomain,rootFrame,mainFrame:state.mainFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',sourceTextIds:Object.freeze([...new Set(P034_TEXT_BINDING.blocks.filter(b=>values[b.id].visible).flatMap(b=>b.sourceTextIds))]),textSnapshot:buildLessonTextSnapshot(P034_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});
}
export function algL07P034Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-86',scenario:'source-instruction',lang:'en',seed:0}){
 const domain=context.frameDomain??'sprite-86',spec=P034_DOMAINS.find(d=>d.id===domain);if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-p034-frame-identity');
 let s=p034InitialState(0,context.replay??0);const ready=domain!=='root'||frame>=6,id=Number(domain.slice(7));
 if(id===60||id===62||id===58){
  if(context.scenario!==P034_DEFAULTS[domain])throw Error('invalid-p034-feedback-scenario');
  s={...s,phase:'feedback',mainFrame:166,quizSection:true,popup:id!==62,feedback:id===58?null:{spriteId:id,frame},placed:id===62?{Tar_3:'Src_3'}:{},quizDragCount:id===62?1:0};
 }else{
  if(context.scenario!=='source-instruction')throw Error('invalid-p034-main-scenario');const main=domain==='sprite-86'?frame:domain==='root'?1:166;
  s={...s,mainFrame:main,phase:main<166?'prequiz':main===166?'quiz-held':main===484?'ended':'postquiz',quizSection:main===166,placed:main>166?{Tar_1:'Src_1',Tar_2:'Src_2',Tar_3:'Src_3',Tar_4:'Src_4'}:{}};
 }
 return p034View(s,{...context,frame,frameDomain:domain},ready);
}
export type P034View=ReturnType<typeof p034View>;
