import type{RuntimeContext}from'./contract';
import type{LessonTextBinding}from'./lesson-text-contract';
import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{ALG_L07_P036_SOURCE as S,p036InitialState,p036Visual,p036Branch,p036CanClose,type P036State}from'./alg-l07-p036-state-v1';
export const P036_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-2',frameCount:1,rootFrame:6},...([111,127,150]as const).map(id=>({id:`sprite-${id}`,frameCount:1,rootFrame:6})),...S.branches.map(b=>({id:`sprite-${b.spriteId}`,frameCount:b.terminal,rootFrame:6})),{id:'sprite-167',frameCount:320,rootFrame:6}]);
export const P036_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P036_DEFAULTS=Object.freeze(Object.fromEntries(P036_DOMAINS.map(d=>[d.id,['sprite-114','sprite-159','sprite-128','sprite-111','sprite-127','sprite-150'].includes(d.id)?'wrong-first':['sprite-75','sprite-63','sprite-89','sprite-51'].includes(d.id)?'right-feedback':'source-instruction'])));
export const P036_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l07-p036-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[1],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[1],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'question',sourceTextIds:['character-6'],role:'question',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
 ...S.answers.flatMap((a,i)=>[{id:`answer-${a.letter}`,sourceTextIds:[`character-${a.letterId}`],role:'answer' as const,language:'en' as const,readingOrder:4+i*2,valueSource:'maintained-page-state' as const},{id:`value-${a.letter}`,sourceTextIds:a.valueIds.map(id=>`character-${id}`),role:'body' as const,language:'en' as const,readingOrder:5+i*2,valueSource:'maintained-page-state' as const}]),
 ...S.branches.map((b,i)=>({id:`feedback-title-${b.spriteId}`,sourceTextIds:b.titleIds.map(n=>`character-${n}`),role:'feedback' as const,language:'en' as const,readingOrder:12+i,valueSource:'maintained-page-state' as const})),
 ...([{sprite:114,text:110},{sprite:159,text:149},{sprite:128,text:126}]as const).map((b,i)=>({id:`wrong-text-${b.sprite}`,sourceTextIds:[`character-${b.text}`],role:'feedback' as const,language:'en' as const,readingOrder:19+i,valueSource:'maintained-page-state' as const})),
 {id:'close',sourceTextIds:['character-102'],role:'label',language:'en',readingOrder:22,valueSource:'maintained-page-state'},
 ...S.steps.map((step,i)=>({id:`step-${step.characterId}`,sourceTextIds:[`character-${step.characterId}`],role:'body' as const,language:'en' as const,readingOrder:23+i,valueSource:'maintained-page-state' as const}))
]as const)});
export function p036View(state:P036State,context:RuntimeContext,ready=true){
 const v=p036Visual(state.mainFrame),f=state.feedback,b=f?p036Branch(f.spriteId):null;
 const titleAlpha=f&&b?b.titleAlpha.find(s=>f.frame>=s.first&&f.frame<=s.last)?.value??0:0,closeVisible=p036CanClose({...state,glossary:null});
 const values:Record<string,{text:string;visible:boolean}>={'course-title':{text:'Linear and Nonlinear Functions:',visible:ready},'activity-title':{text:'Instruction',visible:ready},question:{text:v.rawSourceQuestion,visible:ready&&Boolean(v.rawSourceQuestion)},close:{text:'Close',visible:ready&&closeVisible}};
 for(const branch of S.branches){values[`feedback-title-${branch.spriteId}`]={text:branch.title,visible:ready&&b?.spriteId===branch.spriteId&&titleAlpha>0};if(branch.kind==='wrong')values[`wrong-text-${branch.spriteId}`]={text:state.wrongText??'',visible:ready&&b?.spriteId===branch.spriteId&&closeVisible};}
 for(const a of S.answers){const visible=ready&&v.answerAlpha[a.letter]>0;values[`answer-${a.letter}`]={text:a.letter,visible};values[`value-${a.letter}`]={text:a.value,visible};}
 for(const step of S.steps)values[`step-${step.characterId}`]={text:v.stepText[String(step.characterId)as keyof typeof v.stepText],visible:ready&&Boolean(v.stepText[String(step.characterId)as keyof typeof v.stepText])};
 const frameDomain=context.frameDomain??'sprite-167',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,ready,state,visual:v,feedbackTitle:b?.title??'',feedbackTitleAlpha:titleAlpha,closeVisible,frame:context.frame,frameDomain,rootFrame,mainFrame:state.mainFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',sourceTextIds:Object.freeze([...new Set(P036_TEXT_BINDING.blocks.filter(b=>values[b.id].visible).flatMap(b=>b.sourceTextIds))]),textSnapshot:buildLessonTextSnapshot(P036_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});
}
export function algL07P036Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-167',scenario:'source-instruction',lang:'en',seed:0}){
 const domain=context.frameDomain??'sprite-167',spec=P036_DOMAINS.find(d=>d.id===domain);if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-p036-frame-identity');
 let s=p036InitialState(0,context.replay??0),ready=domain!=='root'||frame>=6;const id=Number(domain.slice(7)),popup=({111:114,127:128,150:159}as Record<number,number>)[id],parent=popup,b=S.branches.find(b=>b.spriteId===(parent??id));
 if(b){
  if(!((b.kind==='wrong'&&/^wrong-(first|second)(-(c|d))?$/.test(context.scenario))||(b.kind==='right'&&context.scenario==='right-feedback')))throw Error('invalid-p036-feedback-scenario');
  const local=popup&&b.kind==='wrong'?b.closeFirst:frame,second=context.scenario.startsWith('wrong-second'),answer=context.scenario.endsWith('-c')?3:context.scenario.endsWith('-d')?4:1;
  s={...s,phase:'feedback',mainFrame:94,quizSection:true,quizTryCount:b.kind==='wrong'?(second?2:1):0,selected:b.kind==='right'?2:answer,feedback:{spriteId:b.spriteId,kind:b.kind,frame:local,closing:b.kind==='wrong'&&local>b.hold,serial:1},selectionSerial:1,wrongText:b.kind==='wrong'?(second?S.answers[answer-1].wrongLater:S.answers[answer-1].wrongFirst):null};
 }else{
  if(context.scenario!=='source-instruction')throw Error('invalid-p036-main-scenario');const main=domain==='sprite-167'?frame:1;s={...s,mainFrame:main,phase:main<94?'prequiz':main===94?'quiz-held':'postquiz',quizSection:main===94,quizButtonsEnabled:main===94};
 }
 return p036View(s,{...context,frame,frameDomain:domain},ready);
}
export type P036View=ReturnType<typeof p036View>;
