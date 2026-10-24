import type{RuntimeContext}from'./contract';
import type{LessonTextBinding}from'./lesson-text-contract';
import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{ALG_L07_P033_SOURCE as S,p033InitialState,p033Visual,p033Branch,p033CanClose,type P033State}from'./alg-l07-p033-state-v1';
export const P033_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-2',frameCount:1,rootFrame:6},...([120,139,154,176]as const).map(id=>({id:`sprite-${id}`,frameCount:1,rootFrame:6})),...S.branches.map(b=>({id:`sprite-${b.spriteId}`,frameCount:b.terminal,rootFrame:6})),{id:'sprite-185',frameCount:374,rootFrame:6}]);
export const P033_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P033_DEFAULTS=Object.freeze(Object.fromEntries(P033_DOMAINS.map(d=>[d.id,['sprite-143','sprite-177','sprite-157','sprite-120','sprite-139','sprite-154','sprite-176'].includes(d.id)?'wrong-first':['sprite-102','sprite-57','sprite-115','sprite-90'].includes(d.id)?'right-feedback':'source-instruction'])));
export const P033_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l07-p033-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[1],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[1],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'definition',sourceTextIds:['character-6'],role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 {id:'question',sourceTextIds:['character-16'],role:'question',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
 ...S.answers.flatMap((a,i)=>[{id:`answer-${a.letter}`,sourceTextIds:[`character-${a.letterId}`],role:'answer' as const,language:'en' as const,readingOrder:4+i*2,valueSource:'maintained-page-state' as const},{id:`value-${a.letter}`,sourceTextIds:a.valueIds.map(id=>`character-${id}`),role:'body' as const,language:'en' as const,readingOrder:5+i*2,valueSource:'maintained-page-state' as const}]),
 ...S.branches.map((b,i)=>({id:`feedback-title-${b.spriteId}`,sourceTextIds:b.titleIds.map(n=>`character-${n}`),role:'feedback' as const,language:'en' as const,readingOrder:12+i,valueSource:'maintained-page-state' as const})),
 ...([{sprite:143,text:138},{sprite:177,text:175},{sprite:157,text:153}]as const).map((b,i)=>({id:`wrong-text-${b.sprite}`,sourceTextIds:[`character-${b.text}`],role:'feedback' as const,language:'en' as const,readingOrder:19+i,valueSource:'maintained-page-state' as const})),
 {id:'close',sourceTextIds:['character-130'],role:'label',language:'en',readingOrder:22,valueSource:'maintained-page-state'},
 ...S.steps.map((step,i)=>({id:`step-${step.characterId}`,sourceTextIds:[`character-${step.characterId}`],role:'body' as const,language:'en' as const,readingOrder:23+i,valueSource:'maintained-page-state' as const})),
 ...(['input','answer','result']as const).map((key,i)=>({id:`emphasis-${key}`,sourceTextIds:[`character-${182+i}`],role:'body' as const,language:'en' as const,readingOrder:27+i,valueSource:'maintained-page-state' as const}))
]as const)});
export function p033View(state:P033State,context:RuntimeContext,ready=true){
 const v=p033Visual(state.mainFrame),f=state.feedback,b=f?p033Branch(f.spriteId):null;
 const titleAlpha=f&&b?b.titleAlpha.find(s=>f.frame>=s.first&&f.frame<=s.last)?.value??0:0,closeVisible=p033CanClose({...state,glossary:null});
 const values:Record<string,{text:string;visible:boolean}>={'course-title':{text:'Linear and Nonlinear Functions:',visible:ready},'activity-title':{text:'Instruction',visible:ready},definition:{text:v.definition,visible:ready&&Boolean(v.definition)},question:{text:v.rawSourceQuestion,visible:ready&&Boolean(v.rawSourceQuestion)},close:{text:'Close',visible:ready&&closeVisible}};
 for(const branch of S.branches){values[`feedback-title-${branch.spriteId}`]={text:branch.title,visible:ready&&b?.spriteId===branch.spriteId&&titleAlpha>0};if(branch.kind==='wrong')values[`wrong-text-${branch.spriteId}`]={text:state.wrongText??'',visible:ready&&b?.spriteId===branch.spriteId&&closeVisible};}
 for(const a of S.answers){const visible=ready&&v.answerAlpha[a.letter]>0;values[`answer-${a.letter}`]={text:a.letter,visible};values[`value-${a.letter}`]={text:a.value,visible};}
 for(const step of S.steps)values[`step-${step.characterId}`]={text:step.sourceText,visible:ready&&v.stepAlpha[String(step.characterId)as keyof typeof v.stepAlpha]>0};
 for(const[key,text]of[['input','x = 3'],['answer','9'],['result','y = 9']]as const)values[`emphasis-${key}`]={text,visible:ready&&v.emphasis[key]};
 const frameDomain=context.frameDomain??'sprite-185',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,ready,state,visual:v,feedbackTitle:b?.title??'',feedbackTitleAlpha:titleAlpha,closeVisible,frame:context.frame,frameDomain,rootFrame,mainFrame:state.mainFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',sourceTextIds:Object.freeze([...new Set(P033_TEXT_BINDING.blocks.filter(b=>values[b.id].visible).flatMap(b=>b.sourceTextIds))]),textSnapshot:buildLessonTextSnapshot(P033_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});
}
export function algL07P033Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-185',scenario:'source-instruction',lang:'en',seed:0}){
 const domain=context.frameDomain??'sprite-185',spec=P033_DOMAINS.find(d=>d.id===domain);if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-p033-frame-identity');
 let s=p033InitialState(0,context.replay??0),ready=domain!=='root'||frame>=6;const id=Number(domain.slice(7)),popup=({139:143,154:157,176:177}as Record<number,number>)[id],parent=id===120?143:popup,b=S.branches.find(b=>b.spriteId===(parent??id));
 if(b){
  if(!((b.kind==='wrong'&&/^wrong-(first|second)(-(b|c))?$/.test(context.scenario))||(b.kind==='right'&&context.scenario==='right-feedback')))throw Error('invalid-p033-feedback-scenario');
  const local=popup&&b.kind==='wrong'?b.closeFirst:frame,second=context.scenario.startsWith('wrong-second'),answer=context.scenario.endsWith('-c')?3:context.scenario.endsWith('-b')?2:1;
  s={...s,phase:'feedback',mainFrame:176,quizSection:true,quizTryCount:second?1:0,selected:b.kind==='right'?4:answer,feedback:{spriteId:b.spriteId,kind:b.kind,frame:local,closing:b.kind==='wrong'&&local>b.hold,serial:1},selectionSerial:1,wrongText:b.kind==='wrong'?(second?S.answers[answer-1].wrongLater:S.answers[answer-1].wrongFirst):null};
 }else{
  if(context.scenario!=='source-instruction')throw Error('invalid-p033-main-scenario');const main=domain==='sprite-185'?frame:1;s={...s,mainFrame:main,phase:main<176?'prequiz':main===176?'quiz-held':'postquiz',quizSection:main===176,quizButtonsEnabled:main===176};
 }
 return p033View(s,{...context,frame,frameDomain:domain},ready);
}
export type P033View=ReturnType<typeof p033View>;
