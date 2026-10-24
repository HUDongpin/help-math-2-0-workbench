import type{RuntimeContext}from'./contract';import type{LessonTextBinding}from'./lesson-text-contract';import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{ALG_L07_P007_SOURCE as S,p007InitialState,p007Visual,p007Branch,p007CanClose,type P007State}from'./alg-l07-p007-state-v1';
export const P007_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-9',frameCount:1,rootFrame:6},...([66,89,118]as const).map(id=>({id:`sprite-${id}`,frameCount:1,rootFrame:6})),...S.branches.map(b=>({id:`sprite-${b.spriteId}`,frameCount:b.terminal,rootFrame:6})),{id:'sprite-228',frameCount:173,rootFrame:6}]);
export const P007_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P007_DEFAULTS=Object.freeze(Object.fromEntries(P007_DOMAINS.map(d=>[d.id,['sprite-67','sprite-98','sprite-119','sprite-66','sprite-89','sprite-118'].includes(d.id)?'wrong-first':['sprite-145','sprite-177','sprite-210','sprite-224'].includes(d.id)?'right-feedback':'source-vocabulary'])));
export const P007_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l07-p007-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[8],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[8],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'definition',sourceTextIds:['character-12'],role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 {id:'question',sourceTextIds:['character-18'],role:'question',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
 ...S.graphs.flatMap((g,i)=>[{id:`answer-${g.letter}`,sourceTextIds:[`character-${g.letterId}`],role:'answer' as const,language:'en' as const,readingOrder:4+i*15,valueSource:'maintained-page-state' as const},...g.labels.map((l,j)=>({id:`graph-${g.letter}-${j}`,sourceTextIds:[l.sourceTextId],role:'label' as const,language:'en' as const,readingOrder:5+i*15+j,valueSource:'maintained-page-state' as const}))]),
 ...S.branches.map((b,i)=>({id:`feedback-title-${b.spriteId}`,sourceTextIds:b.titleIds.map(n=>`character-${n}`),role:'feedback' as const,language:'en' as const,readingOrder:64+i,valueSource:'maintained-page-state' as const})),
 ...([{sprite:119,text:117},{sprite:98,text:88},{sprite:67,text:65}]as const).map((b,i)=>({id:`wrong-text-${b.sprite}`,sourceTextIds:[`character-${b.text}`],role:'feedback' as const,language:'en' as const,readingOrder:71+i,valueSource:'maintained-page-state' as const})),
 {id:'close',sourceTextIds:['character-57'],role:'label',language:'en',readingOrder:74,valueSource:'maintained-page-state'}]as const)});
export function p007View(state:P007State,context:RuntimeContext,ready=true){const v=p007Visual(state.mainFrame),f=state.feedback,b=f?p007Branch(f.spriteId):null;
 const titleAlpha=f&&b?b.titleAlpha.find(s=>f.frame>=s.first&&f.frame<=s.last)?.value??0:0,closeVisible=p007CanClose({...state,glossary:null});
 const values:Record<string,{text:string;visible:boolean}>={'course-title':{text:'Linear and Nonlinear Functions:',visible:ready},'activity-title':{text:'Vocabulary',visible:ready},definition:{text:v.definition,visible:ready&&Boolean(v.definition)},question:{text:v.question,visible:ready&&Boolean(v.question)},close:{text:'Close',visible:ready&&closeVisible}};
 for(const branch of S.branches){values[`feedback-title-${branch.spriteId}`]={text:branch.title,visible:ready&&b?.spriteId===branch.spriteId&&titleAlpha>0};if(branch.kind==='wrong')values[`wrong-text-${branch.spriteId}`]={text:state.wrongText??'',visible:ready&&b?.spriteId===branch.spriteId&&closeVisible};}
 for(const g of S.graphs){const visible=ready&&v.graphAlpha[g.letter]>0;values[`answer-${g.letter}`]={text:g.letter,visible};g.labels.forEach((l,j)=>values[`graph-${g.letter}-${j}`]={text:l.text,visible});}
 const frameDomain=context.frameDomain??'sprite-228',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,ready,state,visual:v,feedbackTitle:b?.title??'',feedbackTitleAlpha:titleAlpha,closeVisible,
  frame:context.frame,frameDomain,rootFrame,mainFrame:state.mainFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,
  traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',
  sourceTextIds:Object.freeze([...new Set(P007_TEXT_BINDING.blocks.filter(b=>values[b.id].visible).flatMap(b=>b.sourceTextIds))]),
  textSnapshot:buildLessonTextSnapshot(P007_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});}
export function algL07P007Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-228',scenario:'source-vocabulary',lang:'en',seed:0}){
 const domain=context.frameDomain??'sprite-228',spec=P007_DOMAINS.find(d=>d.id===domain);if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-p007-frame-identity');
 let s=p007InitialState(0,context.replay??0),ready=domain!=='root'||frame>=6;const id=Number(domain.slice(7)),popup=({66:67,89:98,118:119}as Record<number,number>)[id],b=S.branches.find(b=>b.spriteId===(popup??id));
 if(b){if(!((b.kind==='wrong'&&['wrong-first','wrong-second'].includes(context.scenario))||(b.kind==='right'&&context.scenario==='right-feedback')))throw Error('invalid-p007-feedback-scenario');
  const local=popup&&b.kind==='wrong'?b.closeFirst:frame,second=context.scenario==='wrong-second';s={...s,phase:'feedback',mainFrame:109,quizSection:true,quizTryCount:second?1:0,selected:b.kind==='right'?2:1,feedback:{spriteId:b.spriteId,kind:b.kind,frame:local,closing:b.kind==='wrong'&&local>b.hold,serial:1},selectionSerial:1,wrongText:b.kind==='wrong'?(second?S.behavior.wrongLater:S.behavior.wrongFirst):null};
 }else{if(context.scenario!=='source-vocabulary')throw Error('invalid-p007-main-scenario');const main=domain==='sprite-228'?frame:1;s={...s,mainFrame:main,phase:main<109?'prequiz':main===109?'quiz-held':'postquiz',quizSection:main===109,quizButtonsEnabled:main===109};}
 return p007View(s,{...context,frame,frameDomain:domain},ready);
}
export type P007View=ReturnType<typeof p007View>;
