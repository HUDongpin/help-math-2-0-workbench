import type{RuntimeContext}from'./contract';import type{LessonTextBinding}from'./lesson-text-contract';import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{ALG_L07_P039_SOURCE as S,p039InitialState,p039Visual,p039Branch,p039CanClose,type P039State}from'./alg-l07-p039-state-v1';
export const P039_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-191',frameCount:1,rootFrame:6},{id:'sprite-188',frameCount:1,rootFrame:6},{id:'sprite-357',frameCount:1,rootFrame:6},...S.branches.map(b=>({id:`sprite-${b.spriteId}`,frameCount:b.terminal,rootFrame:6})),{id:'sprite-366',frameCount:375,rootFrame:6}]);
export const P039_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P039_DEFAULTS=Object.freeze(Object.fromEntries(P039_DOMAINS.map(d=>[d.id,['sprite-361','sprite-357'].includes(d.id)?'wrong-first-a':d.id==='sprite-280'?'right-feedback':d.id==='sprite-188'?'help':'source-question'])));
const blocks=[{id:'course-title',sourceTextIds:[],sourceShapeIds:[190],role:'heading' as const},{id:'activity-title',sourceTextIds:[],sourceShapeIds:[190],role:'title' as const},{id:'question',sourceTextIds:['character-193','character-194','character-198','character-199'],role:'question' as const},{id:'help-open',sourceTextIds:['character-4','character-5'],role:'label' as const},{id:'help-close',sourceTextIds:['character-219'],role:'label' as const},
 ...S.answers.map(a=>({id:`answer-${a.letter}`,sourceTextIds:[`character-${a.letterId}`],role:'answer' as const})),
 ...S.graphs.flatMap(g=>g.labels.map((l,i)=>({id:`axis-${g.name}-${i}`,sourceTextIds:[l.sourceTextId],role:'label' as const}))),
 ...S.helpTexts.map(t=>({id:`help-${t.characterId}`,sourceTextIds:[t.sourceTextId],role:'body' as const})),
 ...S.branches.map(b=>({id:`feedback-title-${b.spriteId}`,sourceTextIds:b.titleIds.map(n=>`character-${n}`),role:'feedback' as const})),
 {id:'wrong-text-361',sourceTextIds:['character-356'],role:'feedback' as const},{id:'close',sourceTextIds:['character-219'],role:'label' as const}];
export const P039_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l07-p039-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze(blocks.map((b,readingOrder)=>({...b,language:'en' as const,readingOrder,valueSource:'maintained-page-state' as const})))});
export function p039View(state:P039State,context:RuntimeContext,ready=true){
 const v=p039Visual(state.mainFrame),f=state.feedback,b=f?p039Branch(f.spriteId):null,titleAlpha=f&&b?b.titleAlpha.find(s=>f.frame>=s.first&&f.frame<=s.last)?.value??0:0,closeVisible=p039CanClose({...state,glossary:null});
 const values:Record<string,{text:string;visible:boolean}>={'course-title':{text:'Linear and Nonlinear Functions:',visible:ready},'activity-title':{text:'Try It!',visible:ready},question:{text:'1 '+S.question,visible:ready&&v.questionAlpha>0},'help-open':{text:'Need More Help',visible:ready&&state.phase==='quiz-held'},'help-close':{text:'Close',visible:ready&&state.help},close:{text:'Close',visible:ready&&closeVisible},'wrong-text-361':{text:state.wrongText??'',visible:ready&&closeVisible}};
 for(const a of S.answers)values[`answer-${a.letter}`]={text:a.letter,visible:ready&&v.answerAlpha[a.letter]>0};
 for(const g of S.graphs)for(let i=0;i<g.labels.length;i++)values[`axis-${g.name}-${i}`]={text:g.labels[i].text,visible:ready&&(g.name.startsWith('help-')?state.help:v.answerAlpha[g.name as 'A'|'B'|'C'|'D']>0)};
 for(const t of S.helpTexts)values[`help-${t.characterId}`]={text:t.text,visible:ready&&state.help};
 for(const branch of S.branches)values[`feedback-title-${branch.spriteId}`]={text:branch.title,visible:ready&&b?.spriteId===branch.spriteId&&titleAlpha>0};
 const frameDomain=context.frameDomain??'sprite-366',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,ready,state,visual:v,feedbackTitle:b?.title??'',feedbackTitleAlpha:titleAlpha,closeVisible,frame:context.frame,frameDomain,rootFrame,mainFrame:state.mainFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',sourceTextIds:Object.freeze([...new Set(P039_TEXT_BINDING.blocks.filter(b=>values[b.id].visible).flatMap(b=>b.sourceTextIds))]),textSnapshot:buildLessonTextSnapshot(P039_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});
}
export function algL07P039Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-366',scenario:'source-question',lang:'en',seed:0}){
 const domain=context.frameDomain??'sprite-366',spec=P039_DOMAINS.find(d=>d.id===domain);if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-p039-frame-identity');
 let s=p039InitialState(0,context.replay??0),ready=domain!=='root'||frame>=6;const id=Number(domain.slice(7)),popup=id===357,b=S.branches.find(b=>b.spriteId===(popup?361:id));
 if(b){
  if(!((b.kind==='wrong'&&/^wrong-(first|second)-(a|b|c)$/.test(context.scenario))||(b.kind==='right'&&context.scenario==='right-feedback')))throw Error('invalid-p039-feedback-scenario');
  const local=popup&&b.kind==='wrong'?b.closeFirst:frame,second=context.scenario.startsWith('wrong-second'),answer=context.scenario.endsWith('-c')?3:context.scenario.endsWith('-b')?2:1;
  s={...s,phase:'feedback',mainFrame:61,quizSection:true,quizTryCount:second?1:0,selected:b.kind==='right'?4:answer,feedback:{spriteId:b.spriteId,kind:b.kind,frame:local,closing:b.kind==='wrong'&&local>b.hold,serial:1},selectionSerial:1,wrongText:b.kind==='wrong'?(second?S.answers[answer-1].wrongLater:S.answers[answer-1].wrongFirst):null};
 }else if(domain==='sprite-188'){
  if(context.scenario!=='help')throw Error('invalid-p039-help-scenario');s={...s,phase:'quiz-held',mainFrame:61,help:true,quizSection:true};
 }else{
  if(context.scenario!=='source-question')throw Error('invalid-p039-main-scenario');const main=domain==='sprite-366'?frame:1;s={...s,mainFrame:main,phase:main<61?'prequiz':main===61?'quiz-held':main===375?'ended':'postquiz',quizSection:main===61,quizButtonsEnabled:main===61};
 }
 return p039View(s,{...context,frame,frameDomain:domain},ready);
}
export type P039View=ReturnType<typeof p039View>;
