import type{RuntimeContext}from'./contract';import type{LessonTextBinding}from'./lesson-text-contract';import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{ALG_L07_P021_SOURCE as S,p021InitialState,p021Visual,p021Branch,p021CanClose,type P021State}from'./alg-l07-p021-state-v1';
export const P021_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-2',frameCount:1,rootFrame:6},...([180,197,209]as const).map(id=>({id:`sprite-${id}`,frameCount:1,rootFrame:6})),...S.branches.map(b=>({id:`sprite-${b.spriteId}`,frameCount:b.terminal,rootFrame:6})),{id:'sprite-215',frameCount:154,rootFrame:6}]);
export const P021_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P021_DEFAULTS=Object.freeze(Object.fromEntries(P021_DOMAINS.map(d=>[d.id,['sprite-183','sprite-198','sprite-213','sprite-180','sprite-197','sprite-209'].includes(d.id)?'wrong-first':d.id==='sprite-158'?'right-feedback-unselected':['sprite-101','sprite-67','sprite-137','sprite-109'].includes(d.id)?'right-feedback':'source-instruction'])));
export const P021_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l07-p021-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[1],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[1],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'definition',sourceTextIds:['character-6'],role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 {id:'question',sourceTextIds:['character-12'],role:'question',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
 ...S.graphs.flatMap((g,i)=>[{id:`answer-${g.letter}`,sourceTextIds:[`character-${g.letterId}`],role:'answer' as const,language:'en' as const,readingOrder:5+i*15,valueSource:'maintained-page-state' as const},...g.labels.map((l,j)=>({id:`graph-${g.letter}-${j}`,sourceTextIds:[l.sourceTextId],role:'label' as const,language:'en' as const,readingOrder:6+i*15+j,valueSource:'maintained-page-state' as const}))]),
 ...S.branches.map((b,i)=>({id:`feedback-title-${b.spriteId}`,sourceTextIds:b.titleIds.map(n=>`character-${n}`),role:'feedback' as const,language:'en' as const,readingOrder:65+i,valueSource:'maintained-page-state' as const})),
 ...([{sprite:183,text:179},{sprite:198,text:196},{sprite:213,text:208}]as const).map((b,i)=>({id:`wrong-text-${b.sprite}`,sourceTextIds:[`character-${b.text}`],role:'feedback' as const,language:'en' as const,readingOrder:73+i,valueSource:'maintained-page-state' as const})),
 {id:'close',sourceTextIds:['character-171'],role:'label',language:'en',readingOrder:76,valueSource:'maintained-page-state'}]as const)});
export function p021View(state:P021State,context:RuntimeContext,ready=true){const v=p021Visual(state.mainFrame),f=state.feedback,b=f?p021Branch(f.spriteId):null;
 const titleAlpha=f&&b?b.titleAlpha.find(s=>f.frame>=s.first&&f.frame<=s.last)?.value??0:0,closeVisible=p021CanClose({...state,glossary:null});
 const values:Record<string,{text:string;visible:boolean}>={'course-title':{text:'Linear and Nonlinear Functions:',visible:ready},'activity-title':{text:'Instruction',visible:ready},definition:{text:v.definition,visible:ready&&Boolean(v.definition)},question:{text:v.question,visible:ready&&Boolean(v.question)},close:{text:'Close',visible:ready&&closeVisible}};
 for(const branch of S.branches){values[`feedback-title-${branch.spriteId}`]={text:branch.title,visible:ready&&b?.spriteId===branch.spriteId&&titleAlpha>0};if(branch.kind==='wrong')values[`wrong-text-${branch.spriteId}`]={text:state.wrongText??'',visible:ready&&b?.spriteId===branch.spriteId&&closeVisible};}
 for(const g of S.graphs){const visible=ready&&v.graphAlpha[g.letter]>0;values[`answer-${g.letter}`]={text:g.letter,visible};g.labels.forEach((l,j)=>values[`graph-${g.letter}-${j}`]={text:l.text,visible});}
 const frameDomain=context.frameDomain??'sprite-215',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,ready,state,visual:v,feedbackTitle:b?.title??'',feedbackTitleAlpha:titleAlpha,closeVisible,
  frame:context.frame,frameDomain,rootFrame,mainFrame:state.mainFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,
  traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',
  sourceTextIds:Object.freeze([...new Set(P021_TEXT_BINDING.blocks.filter(b=>values[b.id].visible).flatMap(b=>b.sourceTextIds))]),
  textSnapshot:buildLessonTextSnapshot(P021_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});}
export function algL07P021Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-215',scenario:'source-instruction',lang:'en',seed:0}){
 const domain=context.frameDomain??'sprite-215',spec=P021_DOMAINS.find(d=>d.id===domain);if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-p021-frame-identity');
 let s=p021InitialState(0,context.replay??0),ready=domain!=='root'||frame>=6;const id=Number(domain.slice(7)),popup=({180:183,197:198,209:213}as Record<number,number>)[id],b=S.branches.find(b=>b.spriteId===(popup??id));
 if(b){if(!((b.kind==='wrong'&&/^wrong-(first|second)(-(c|d))?$/.test(context.scenario))||(b.kind==='right'&&context.scenario===(b.naturallySelected?'right-feedback':'right-feedback-unselected'))))throw Error('invalid-p021-feedback-scenario');
  const local=popup&&b.kind==='wrong'?b.closeFirst:frame,second=context.scenario.startsWith('wrong-second'),answer=context.scenario.endsWith('-d')?4:context.scenario.endsWith('-c')?3:2;s={...s,phase:'feedback',mainFrame:97,quizSection:true,quizTryCount:second?1:0,selected:b.kind==='right'?1:answer,feedback:{spriteId:b.spriteId,kind:b.kind,frame:local,closing:b.kind==='wrong'&&local>b.hold,serial:1},selectionSerial:1,wrongText:b.kind==='wrong'?(second?S.answers[answer-1].wrongLater:S.answers[answer-1].wrongFirst):null};
 }else{if(context.scenario!=='source-instruction')throw Error('invalid-p021-main-scenario');const main=domain==='sprite-215'?frame:1;s={...s,mainFrame:main,phase:main<97?'prequiz':main===97?'quiz-held':'postquiz',quizSection:main===97,quizButtonsEnabled:main===97};}
 return p021View(s,{...context,frame,frameDomain:domain},ready);
}
export type P021View=ReturnType<typeof p021View>;
