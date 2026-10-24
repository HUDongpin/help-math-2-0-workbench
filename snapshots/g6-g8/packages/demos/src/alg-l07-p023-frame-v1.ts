import type{RuntimeContext}from'./contract';import type{LessonTextBinding}from'./lesson-text-contract';import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{ALG_L07_P023_SOURCE as S,p023InitialState,p023Visual,p023Branch,p023CanClose,type P023State}from'./alg-l07-p023-state-v1';
export const P023_DOMAINS=Object.freeze(S.domains.map(d=>({...d,...(d.id==='root'?{}:{rootFrame:6})})));
export const P023_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const nested:Readonly<Record<number,number>>={72:83,80:83,120:124,121:124,134:137,155:156};
export const P023_DEFAULTS=Object.freeze(Object.fromEntries(P023_DOMAINS.map(d=>[d.id,['sprite-120','sprite-121','sprite-124','sprite-134','sprite-137','sprite-155','sprite-156'].includes(d.id)?'wrong-first':['sprite-54','sprite-66','sprite-72','sprite-80','sprite-83','sprite-97'].includes(d.id)?'right-feedback':'source-instruction'])));
export const P023_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l07-p023-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[1],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[1],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'definition',sourceTextIds:['character-6'],role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 {id:'question',sourceTextIds:['character-12'],role:'question',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
 ...S.answers.flatMap((a,i)=>[{id:`answer-${a.letter}`,sourceTextIds:[`character-${a.letterId}`],role:'answer' as const,language:'en' as const,readingOrder:4+i*2,valueSource:'maintained-page-state' as const},{id:`equation-${a.letter}`,sourceTextIds:[`character-${a.equationId}`],role:'body' as const,language:'en' as const,readingOrder:5+i*2,valueSource:'maintained-page-state' as const}]),
 ...S.branches.map((b,i)=>({id:`feedback-title-${b.spriteId}`,sourceTextIds:b.titleIds.map(n=>`character-${n}`),role:'feedback' as const,language:'en' as const,readingOrder:12+i,valueSource:'maintained-page-state' as const})),
 {id:'wrong-explanation',sourceTextIds:['character-118'],role:'feedback',language:'en',readingOrder:19,valueSource:'maintained-page-state'},
 {id:'try-again',sourceTextIds:['character-119'],role:'feedback',language:'en',readingOrder:20,valueSource:'maintained-page-state'},
 {id:'close',sourceTextIds:['character-110'],role:'label',language:'en',readingOrder:21,valueSource:'maintained-page-state'},
 ...[157,158,159].map((id,i)=>({id:`emphasis-${id}`,sourceTextIds:[`character-${id}`],role:'body' as const,language:'en' as const,readingOrder:22+i,valueSource:'maintained-page-state' as const}))]as const)});
export function p023View(state:P023State,context:RuntimeContext,ready=true){const v=p023Visual(state.mainFrame),f=state.feedback,b=f?p023Branch(f.spriteId):null;
 const titleAlpha=f&&b?b.titleAlpha.find(s=>f.frame>=s.first&&f.frame<=s.last)?.value??0:0,closeVisible=p023CanClose({...state,glossary:null});
 const values:Record<string,{text:string;visible:boolean}>={'course-title':{text:'Linear and Nonlinear Functions:',visible:ready},'activity-title':{text:'Instruction',visible:ready},definition:{text:v.definition,visible:ready&&Boolean(v.definition)},question:{text:v.question,visible:ready&&Boolean(v.question)},close:{text:'Close',visible:ready&&closeVisible},'wrong-explanation':{text:'A linear function cannot have x² terms.',visible:ready&&closeVisible},'try-again':{text:'Try again.',visible:ready&&closeVisible&&state.quizTryCount===1}};
 for(const branch of S.branches)values[`feedback-title-${branch.spriteId}`]={text:branch.title,visible:ready&&b?.spriteId===branch.spriteId&&titleAlpha>0};
 for(const a of S.answers){const visible=ready&&v.answerAlpha[a.letter]>0;values[`answer-${a.letter}`]={text:a.letter,visible};values[`equation-${a.letter}`]={text:a.equation.replace('2','²'),visible};}
 for(const id of[157,158,159])values[`emphasis-${id}`]={text:S.sourceTexts.find(t=>t.characterId===id)!.text,visible:ready&&v.emphasisTerms.includes(id)};
 const frameDomain=context.frameDomain??'sprite-160',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,ready,state,visual:v,feedbackTitle:b?.title??'',feedbackTitleAlpha:titleAlpha,closeVisible,frame:context.frame,frameDomain,rootFrame,mainFrame:state.mainFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',sourceTextIds:Object.freeze([...new Set(P023_TEXT_BINDING.blocks.filter(b=>values[b.id].visible).flatMap(b=>b.sourceTextIds))]),textSnapshot:buildLessonTextSnapshot(P023_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});}
export function algL07P023Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-160',scenario:'source-instruction',lang:'en',seed:0}){
 const domain=context.frameDomain??'sprite-160',spec=P023_DOMAINS.find(d=>d.id===domain);if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-p023-frame-identity');
 let s=p023InitialState(0,context.replay??0),ready=domain!=='root'||frame>=6;const id=Number(domain.slice(7)),parent=nested[id],b=S.branches.find(b=>b.spriteId===(parent??id));
 if(b){if(!((b.kind==='wrong'&&/^wrong-(first|second)(-(b|c))?$/.test(context.scenario))||(b.kind==='right'&&context.scenario==='right-feedback')))throw Error('invalid-p023-feedback-scenario');
  const local=parent?(b.kind==='wrong'?b.closeFirst:20):frame,second=context.scenario.startsWith('wrong-second'),answer=context.scenario.endsWith('-c')?3:context.scenario.endsWith('-b')?2:1;
  s={...s,phase:'feedback',mainFrame:144,quizSection:true,quizTryCount:b.kind==='wrong'?(second?2:1):0,selected:b.kind==='right'?4:answer,feedback:{spriteId:b.spriteId,kind:b.kind,frame:local,closing:b.kind==='wrong'&&local>b.hold,serial:1},selectionSerial:1,wrongText:b.kind==='wrong'?(second?S.answers[answer-1].wrongLater:S.answers[answer-1].wrongFirst):null};
 }else{if(context.scenario!=='source-instruction')throw Error('invalid-p023-main-scenario');const main=domain==='sprite-160'?frame:1;s={...s,mainFrame:main,phase:main<144?'prequiz':main===144?'quiz-held':'postquiz',quizSection:main===144,quizButtonsEnabled:main===144};}
 return p023View(s,{...context,frame,frameDomain:domain},ready);
}
export type P023View=ReturnType<typeof p023View>;
