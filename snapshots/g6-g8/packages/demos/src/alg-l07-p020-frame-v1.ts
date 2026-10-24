import type{RuntimeContext}from'./contract';import type{LessonTextBinding}from'./lesson-text-contract';import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{ALG_L07_P020_SOURCE as S,p020InitialState,p020Visual,p020Branch,p020CanClose,type P020State}from'./alg-l07-p020-state-v1';
export const P020_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-2',frameCount:1,rootFrame:6},{id:'sprite-68',frameCount:1,rootFrame:6},{id:'sprite-75',frameCount:1,rootFrame:6},...([146,132,172]as const).map(id=>({id:`sprite-${id}`,frameCount:1,rootFrame:6})),...S.branches.map(b=>({id:`sprite-${b.spriteId}`,frameCount:b.terminal,rootFrame:6})),{id:'sprite-182',frameCount:296,rootFrame:6}]);
export const P020_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P020_DEFAULTS=Object.freeze(Object.fromEntries(P020_DOMAINS.map(d=>[d.id,['sprite-150','sprite-135','sprite-181','sprite-146','sprite-132','sprite-172'].includes(d.id)?'wrong-first':['sprite-78','sprite-62','sprite-111','sprite-90','sprite-68','sprite-75'].includes(d.id)?'right-feedback':'source-vocabulary'])));
export const P020_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l07-p020-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[1],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[1],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'definition',sourceTextIds:['character-6'],role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 {id:'question',sourceTextIds:['character-12'],role:'question',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
 ...S.graphs.flatMap((g,i)=>[{id:`answer-${g.letter}`,sourceTextIds:[`character-${g.letterId}`],role:'answer' as const,language:'en' as const,readingOrder:5+i*15,valueSource:'maintained-page-state' as const},...g.labels.map((l,j)=>({id:`graph-${g.letter}-${j}`,sourceTextIds:[],sourceShapeIds:[l.sourceShapeId],role:'label' as const,language:'en' as const,readingOrder:6+i*15+j,valueSource:'maintained-page-state' as const}))]),
 ...S.branches.map((b,i)=>({id:`feedback-title-${b.spriteId}`,sourceTextIds:b.titleIds.map(n=>`character-${n}`),role:'feedback' as const,language:'en' as const,readingOrder:65+i,valueSource:'maintained-page-state' as const})),
 ...([{sprite:181,text:171},{sprite:135,text:131},{sprite:150,text:145}]as const).map((b,i)=>({id:`wrong-text-${b.sprite}`,sourceTextIds:[`character-${b.text}`],role:'feedback' as const,language:'en' as const,readingOrder:72+i,valueSource:'maintained-page-state' as const})),
 {id:'reminder',sourceTextIds:['character-14'],role:'body',language:'en',readingOrder:4,valueSource:'maintained-page-state'},
 {id:'close',sourceTextIds:['character-123'],role:'label',language:'en',readingOrder:75,valueSource:'maintained-page-state'}]as const)});
export function p020View(state:P020State,context:RuntimeContext,ready=true){const v=p020Visual(state.mainFrame),f=state.feedback,b=f?p020Branch(f.spriteId):null;
 const titleAlpha=f&&b?b.titleAlpha.find(s=>f.frame>=s.first&&f.frame<=s.last)?.value??0:0,closeVisible=p020CanClose({...state,glossary:null});
 const values:Record<string,{text:string;visible:boolean}>={'course-title':{text:'Linear and Nonlinear Functions:',visible:ready},'activity-title':{text:'Vocabulary',visible:ready},definition:{text:v.definition,visible:ready&&Boolean(v.definition)},question:{text:v.question,visible:ready&&Boolean(v.question)},reminder:{text:v.reminder,visible:ready&&Boolean(v.reminder)},close:{text:'Close',visible:ready&&closeVisible}};
 for(const branch of S.branches){values[`feedback-title-${branch.spriteId}`]={text:branch.title,visible:ready&&b?.spriteId===branch.spriteId&&titleAlpha>0};if(branch.kind==='wrong')values[`wrong-text-${branch.spriteId}`]={text:state.wrongText??'',visible:ready&&b?.spriteId===branch.spriteId&&closeVisible};}
 for(const g of S.graphs){const visible=ready&&v.graphAlpha[g.letter]>0;values[`answer-${g.letter}`]={text:g.letter,visible};g.labels.forEach((l,j)=>values[`graph-${g.letter}-${j}`]={text:l.text,visible});}
 const frameDomain=context.frameDomain??'sprite-182',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,ready,state,visual:v,feedbackTitle:b?.title??'',feedbackTitleAlpha:titleAlpha,closeVisible,
  frame:context.frame,frameDomain,rootFrame,mainFrame:state.mainFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,
  traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',
  sourceTextIds:Object.freeze([...new Set(P020_TEXT_BINDING.blocks.filter(b=>values[b.id].visible).flatMap(b=>b.sourceTextIds))]),
  textSnapshot:buildLessonTextSnapshot(P020_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});}
export function algL07P020Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-182',scenario:'source-vocabulary',lang:'en',seed:0}){
 const domain=context.frameDomain??'sprite-182',spec=P020_DOMAINS.find(d=>d.id===domain);if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-p020-frame-identity');
 let s=p020InitialState(0,context.replay??0),ready=domain!=='root'||frame>=6;const id=Number(domain.slice(7)),popup=({146:150,132:135,172:181,68:78,75:78}as Record<number,number>)[id],b=S.branches.find(b=>b.spriteId===(popup??id));
 if(b){if(!((b.kind==='wrong'&&/^wrong-(first|second)(-(c|d))?$/.test(context.scenario))||(b.kind==='right'&&context.scenario==='right-feedback')))throw Error('invalid-p020-feedback-scenario');
  const local=popup&&b.kind==='wrong'?b.closeFirst:frame,second=context.scenario.startsWith('wrong-second'),answer=context.scenario.endsWith('-d')?4:context.scenario.endsWith('-c')?3:2;s={...s,phase:'feedback',mainFrame:204,quizSection:true,quizTryCount:second?1:0,selected:b.kind==='right'?1:answer,feedback:{spriteId:b.spriteId,kind:b.kind,frame:local,closing:b.kind==='wrong'&&local>b.hold,serial:1},selectionSerial:1,wrongText:b.kind==='wrong'?(second?S.answers[answer-1].wrongLater:S.answers[answer-1].wrongFirst):null};
 }else{if(context.scenario!=='source-vocabulary')throw Error('invalid-p020-main-scenario');const main=domain==='sprite-182'?frame:1;s={...s,mainFrame:main,phase:main<204?'prequiz':main===204?'quiz-held':'postquiz',quizSection:main===204,quizButtonsEnabled:main===204};}
 return p020View(s,{...context,frame,frameDomain:domain},ready);
}
export type P020View=ReturnType<typeof p020View>;
