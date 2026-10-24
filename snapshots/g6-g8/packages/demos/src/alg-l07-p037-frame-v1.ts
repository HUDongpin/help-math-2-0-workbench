import type {RuntimeContext} from './contract';
import type {LessonTextBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import {ALG_L07_P037_SOURCE as S,p037InitialState,p037Visual,type P037State} from './alg-l07-p037-state-v1';
export const P037_DOMAINS=Object.freeze([{id:'root',frameCount:10},...[28,30,32,34,53].map(id=>({id:`sprite-${id}`,frameCount:1,rootFrame:6})),...[55,57].map(id=>({id:`sprite-${id}`,frameCount:20,rootFrame:6})),{id:'sprite-85',frameCount:474,rootFrame:6}]);
export const P037_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P037_DEFAULTS=Object.freeze(Object.fromEntries(P037_DOMAINS.map(d=>[d.id,d.id==='sprite-55'?'dormant-coach':d.id==='sprite-57'?'right-feedback':d.id==='sprite-53'?'wrong-first':'source-instruction'])));
const rowInputIds=[10,13,14,11,15],outputIds=[12,27,29,31,33],revealedIds=[12,61,63,62,60],stepIds=[66,67,69,70,71,73,74,75,77,78,79,81,82,83,84];
export const P037_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l07-p037-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[8],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[8],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 ...[22,25].map((id,i)=>({id:`instruction-${i}`,sourceTextIds:[`character-${id}`],role:'body' as const,language:'en' as const,readingOrder:2+i,valueSource:'maintained-page-state' as const})),
 {id:'formula',sourceTextIds:['character-18','character-19'],role:'body',language:'en',readingOrder:4,valueSource:'maintained-page-state'},
 ...[16,17,58,59].map((id,i)=>({id:`header-${id}`,sourceTextIds:[`character-${id}`],role:'label' as const,language:'en' as const,readingOrder:5+i,valueSource:'maintained-page-state' as const})),
 ...S.rows.flatMap((r,i)=>[{id:`input-${i}`,sourceTextIds:[`character-${rowInputIds[i]}`],role:'body' as const,language:'en' as const,readingOrder:9+i*2,valueSource:'maintained-page-state' as const},{id:`output-${i}`,sourceTextIds:[...new Set([`character-${outputIds[i]}`,`character-${revealedIds[i]}`])],role:'answer' as const,language:'en' as const,readingOrder:10+i*2,valueSource:'maintained-page-state' as const}]),
 {id:'done',sourceTextIds:['character-38'],role:'label',language:'en',readingOrder:19,valueSource:'maintained-page-state'},
 {id:'popup',sourceTextIds:['character-52'],role:'feedback',language:'en',readingOrder:20,valueSource:'maintained-page-state'},
 {id:'close',sourceTextIds:['character-44'],role:'label',language:'en',readingOrder:21,valueSource:'maintained-page-state'},
 ...stepIds.map((id,i)=>({id:`step-${id}`,sourceTextIds:[`character-${id}`],role:'body' as const,language:'en' as const,readingOrder:22+i,valueSource:'maintained-page-state' as const})),
 ...[65,72,76,80].map((id,i)=>({id:`emphasis-${id}`,sourceTextIds:[`character-${id}`],role:'body' as const,language:'en' as const,readingOrder:37+i,valueSource:'maintained-page-state' as const}))
] as const)});
export function p037View(state:P037State,context:RuntimeContext,ready=true){
 const v=p037Visual(state.mainFrame),table=ready&&v.tableAlpha>0;
 const outputs=S.rows.map(r=>r.inputIndex===null||v.outputsRevealed?r.output:state.values[r.inputIndex]);
 const values:Record<string,{text:string;visible:boolean}>={'course-title':{text:'Linear and Nonlinear Functions:',visible:ready},'activity-title':{text:'Instruction',visible:ready},formula:{text:'y = x3',visible:ready&&v.formulaAlpha>0},done:{text:'Done',visible:ready&&state.mainFrame===215},popup:{text:state.message,visible:ready&&state.popup!==null},close:{text:'Close',visible:ready&&state.popup!==null}};
 for(let i=0;i<2;i++)values[`instruction-${i}`]={text:v.paragraphs[i],visible:ready&&Boolean(v.paragraphs[i])};
 for(const[id,text]of [[16,'Input'],[17,'Output'],[58,'x'],[59,'y']]as const)values[`header-${id}`]={text,visible:table&&(id<58?v.headerWordAlpha:v.headerVariableAlpha)>0};
 S.rows.forEach((r,i)=>{values[`input-${i}`]={text:r.input,visible:table};values[`output-${i}`]={text:outputs[i],visible:table&&Boolean(outputs[i])};});
 for(const id of stepIds){const p=v.steps.find(p=>p.sourceTextId===id);values[`step-${id}`]={text:p?.text.replaceAll('³','3')??'',visible:ready&&Boolean(p&&p.alpha>0)};}
 for(const id of[65,72,76,80])values[`emphasis-${id}`]={text:S.sourceTexts.find(t=>t.characterId===id)!.text!,visible:ready&&v.inputEmphasis.includes(id)};
 const frameDomain=context.frameDomain??'sprite-85',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,ready,state,visual:v,outputs,values,frame:context.frame,frameDomain,rootFrame,mainFrame:state.mainFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',sourceTextIds:Object.freeze([...new Set(P037_TEXT_BINDING.blocks.filter(b=>values[b.id].visible).flatMap(b=>b.sourceTextIds))]),textSnapshot:buildLessonTextSnapshot(P037_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});
}
export function algL07P037Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-85',scenario:'source-instruction',lang:'en',seed:0}){
 const domain=context.frameDomain??'sprite-85',spec=P037_DOMAINS.find(d=>d.id===domain);if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-p037-frame-identity');
 const valid=domain==='sprite-53'?['wrong-first','wrong-second','empty-only']:[P037_DEFAULTS[domain]];if(!valid.includes(context.scenario))throw Error('invalid-p037-scenario');
 const ready=domain!=='root'||frame>=6,main=domain==='sprite-85'?frame:domain==='root'?1:215;
 let s:P037State={...p037InitialState(0,context.replay??0),mainFrame:main,phase:main<215?'prequiz':main===215?'quiz-held':main===474?'ended':'postquiz',quizSection:main===215,inputsEnabled:main===215};
 if(domain==='sprite-53'){const empty=context.scenario==='empty-only',tries=empty?0:context.scenario==='wrong-first'?1:2;s={...s,popup:empty?'empty':'wrong',quizTryCount:tries,inputsEnabled:false,message:empty?S.emptyHint:S.wrongHint+(tries===1?' Try again.':'')};}
 if(domain==='sprite-57'&&frame>=2)s={...s,phase:frame===20?'postquiz':'feedback',quizSection:frame!==20,inputsEnabled:false,values:[...S.answers],feedback:frame===20?null:{spriteId:57,frame}};
 return p037View(s,{...context,frame,frameDomain:domain},ready);
}
export type P037View=ReturnType<typeof p037View>;
