import type{RuntimeContext}from'./contract';import type{LessonTextBinding}from'./lesson-text-contract';import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{ALG_L07_P040_SOURCE as S,p040InitialState,p040Visual,p040Branch,p040CanClose,type P040State}from'./alg-l07-p040-state-v1';
export const P040_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-145',frameCount:1,rootFrame:6},{id:'sprite-142',frameCount:1,rootFrame:6},{id:'sprite-315',frameCount:1,rootFrame:6},...S.branches.map(b=>({id:`sprite-${b.spriteId}`,frameCount:b.terminal,rootFrame:6})),{id:'sprite-335',frameCount:241,rootFrame:6}]);
export const P040_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P040_DEFAULTS=Object.freeze(Object.fromEntries(P040_DOMAINS.map(d=>[d.id,['sprite-319','sprite-315'].includes(d.id)?'wrong-first-a':d.id==='sprite-237'?'right-feedback':d.id==='sprite-142'?'help':'source-question'])));
const blocks=[{id:'course-title',sourceTextIds:[],sourceShapeIds:[144],role:'heading' as const},{id:'activity-title',sourceTextIds:[],sourceShapeIds:[144],role:'title' as const},{id:'question',sourceTextIds:['character-147','character-149','character-152','character-153'],role:'question' as const},{id:'help-open',sourceTextIds:['character-4','character-5'],role:'label' as const},{id:'help-close',sourceTextIds:['character-176'],role:'label' as const},
 ...S.answers.map(a=>({id:`answer-${a.letter}`,sourceTextIds:[`character-${a.letterId}`],role:'answer' as const})),
 ...S.answers.map(a=>({id:`equation-${a.letter}`,sourceTextIds:a.equationIds.filter(id=>id!==156).map(id=>`character-${id}`),sourceShapeIds:a.letter==='A'?[156]:[],role:'body' as const})),
 ...S.helpTexts.map(t=>({id:`help-${t.id}`,sourceTextIds:[t.sourceTextId],role:'body' as const})),
 ...S.branches.map(b=>({id:`feedback-title-${b.spriteId}`,sourceTextIds:b.titleIds.map(n=>`character-${n}`),role:'feedback' as const})),
 {id:'wrong-text-319',sourceTextIds:['character-314'],role:'feedback' as const},{id:'close',sourceTextIds:['character-176'],role:'label' as const}];
export const P040_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l07-p040-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze(blocks.map((b,readingOrder)=>({...b,language:'en' as const,readingOrder,valueSource:'maintained-page-state' as const})))});
export function p040View(state:P040State,context:RuntimeContext,ready=true){
 const v=p040Visual(state.mainFrame),f=state.feedback,b=f?p040Branch(f.spriteId):null,titleAlpha=f&&b?b.titleAlpha.find(s=>f.frame>=s.first&&f.frame<=s.last)?.value??0:0,closeVisible=p040CanClose({...state,glossary:null});
 const values:Record<string,{text:string;visible:boolean}>={'course-title':{text:'Linear and Nonlinear Functions:',visible:ready},'activity-title':{text:'Try It!',visible:ready},question:{text:'2 '+S.question,visible:ready&&v.questionAlpha>0},'help-open':{text:'Need More Help',visible:ready&&state.phase==='quiz-held'},'help-close':{text:'Close',visible:ready&&state.help},close:{text:'Close',visible:ready&&closeVisible},'wrong-text-319':{text:state.wrongText??'',visible:ready&&closeVisible}};
 for(const a of S.answers)values[`answer-${a.letter}`]={text:a.letter,visible:ready&&v.answerAlpha[a.letter]>0};
 for(const a of S.answers)values[`equation-${a.letter}`]={text:a.equationText,visible:ready&&v.answerAlpha[a.letter]>0};
 for(const t of S.helpTexts)values[`help-${t.id}`]={text:t.text,visible:ready&&state.help};
 for(const branch of S.branches)values[`feedback-title-${branch.spriteId}`]={text:branch.title,visible:ready&&b?.spriteId===branch.spriteId&&titleAlpha>0};
 const frameDomain=context.frameDomain??'sprite-335',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,ready,state,visual:v,feedbackTitle:b?.title??'',feedbackTitleAlpha:titleAlpha,closeVisible,frame:context.frame,frameDomain,rootFrame,mainFrame:state.mainFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',sourceTextIds:Object.freeze([...new Set(P040_TEXT_BINDING.blocks.filter(b=>values[b.id].visible).flatMap(b=>b.sourceTextIds))]),textSnapshot:buildLessonTextSnapshot(P040_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});
}
export function algL07P040Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-335',scenario:'source-question',lang:'en',seed:0}){
 const domain=context.frameDomain??'sprite-335',spec=P040_DOMAINS.find(d=>d.id===domain);if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-p040-frame-identity');
 let s=p040InitialState(0,context.replay??0),ready=domain!=='root'||frame>=6;const id=Number(domain.slice(7)),popup=id===315,b=S.branches.find(b=>b.spriteId===(popup?319:id));
 if(b){
  if(!((b.kind==='wrong'&&/^wrong-(first|second)-(a|c|d)$/.test(context.scenario))||(b.kind==='right'&&context.scenario==='right-feedback')))throw Error('invalid-p040-feedback-scenario');
  const local=popup&&b.kind==='wrong'?b.closeFirst:frame,second=context.scenario.startsWith('wrong-second'),answer=context.scenario.endsWith('-d')?4:context.scenario.endsWith('-c')?3:1;
  s={...s,phase:'feedback',mainFrame:79,quizSection:true,quizTryCount:second?1:0,selected:b.kind==='right'?2:answer,feedback:{spriteId:b.spriteId,kind:b.kind,frame:local,closing:b.kind==='wrong'&&local>b.hold,serial:1},selectionSerial:1,wrongText:b.kind==='wrong'?(second?S.answers[answer-1].wrongLater:S.answers[answer-1].wrongFirst):null};
 }else if(domain==='sprite-142'){
  if(context.scenario!=='help')throw Error('invalid-p040-help-scenario');s={...s,phase:'quiz-held',mainFrame:79,help:true,quizSection:true};
 }else{
  if(context.scenario!=='source-question')throw Error('invalid-p040-main-scenario');const main=domain==='sprite-335'?frame:1;s={...s,mainFrame:main,phase:main<79?'prequiz':main===79?'quiz-held':main===241?'ended':'postquiz',quizSection:main===79,quizButtonsEnabled:main===79};
 }
 return p040View(s,{...context,frame,frameDomain:domain},ready);
}
export type P040View=ReturnType<typeof p040View>;
