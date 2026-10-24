import type{RuntimeContext}from'./contract';
import type{LessonTextBinding}from'./lesson-text-contract';
import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{ALG_L07_P031_SOURCE as S,p031InitialState,p031Visual,p031Branch,p031CanClose,type P031State}from'./alg-l07-p031-state-v1';
export const P031_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-2',frameCount:1,rootFrame:6},...([128,141,155]as const).map(id=>({id:`sprite-${id}`,frameCount:1,rootFrame:6})),...S.branches.map(b=>({id:`sprite-${b.spriteId}`,frameCount:b.terminal,rootFrame:6})),{id:'sprite-164',frameCount:572,rootFrame:6}]);
export const P031_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P031_DEFAULTS=Object.freeze(Object.fromEntries(P031_DOMAINS.map(d=>[d.id,['sprite-131','sprite-144','sprite-159','sprite-128','sprite-141','sprite-155'].includes(d.id)?'wrong-first':['sprite-81','sprite-93','sprite-106','sprite-69'].includes(d.id)?'right-feedback':'source-instruction'])));
export const P031_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l07-p031-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[1],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[1],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 ...([5,7,8,11,16,20]as const).map((id,i)=>({id:`paragraph-${id}`,sourceTextIds:[`character-${id}`],role:i<3?'body' as const:'question' as const,language:'en' as const,readingOrder:2+i,valueSource:'maintained-page-state' as const})),
 ...S.answers.flatMap((a,i)=>[{id:`answer-${a.letter}`,sourceTextIds:[`character-${a.letterId}`],role:'answer' as const,language:'en' as const,readingOrder:8+i*2,valueSource:'maintained-page-state' as const},{id:`value-${a.letter}`,sourceTextIds:a.valueIds.map(id=>`character-${id}`),role:'body' as const,language:'en' as const,readingOrder:9+i*2,valueSource:'maintained-page-state' as const}]),
 ...S.branches.map((b,i)=>({id:`feedback-title-${b.spriteId}`,sourceTextIds:b.titleIds.map(n=>`character-${n}`),role:'feedback' as const,language:'en' as const,readingOrder:16+i,valueSource:'maintained-page-state' as const})),
 ...([{sprite:131,text:127},{sprite:144,text:140},{sprite:159,text:154}]as const).map((b,i)=>({id:`wrong-text-${b.sprite}`,sourceTextIds:[`character-${b.text}`],role:'feedback' as const,language:'en' as const,readingOrder:23+i,valueSource:'maintained-page-state' as const})),
 {id:'close',sourceTextIds:['character-119'],role:'label',language:'en',readingOrder:26,valueSource:'maintained-page-state'},
 ...(['money','rate','sunglasses','booth']as const).map((key,i)=>({id:`emphasis-${key}`,sourceTextIds:[`character-${160+i}`],role:'body' as const,language:'en' as const,readingOrder:27+i,valueSource:'maintained-page-state' as const}))
]as const)});
export function p031View(state:P031State,context:RuntimeContext,ready=true){
 const v=p031Visual(state.mainFrame),f=state.feedback,b=f?p031Branch(f.spriteId):null;
 const titleAlpha=f&&b?b.titleAlpha.find(s=>f.frame>=s.first&&f.frame<=s.last)?.value??0:0,closeVisible=p031CanClose({...state,glossary:null});
 const values:Record<string,{text:string;visible:boolean}>={'course-title':{text:'Linear and Nonlinear Functions:',visible:ready},'activity-title':{text:'Instruction',visible:ready},close:{text:'Close',visible:ready&&closeVisible}};
 for(const id of [5,7,8,11,16,20])values[`paragraph-${id}`]={text:v.paragraphs[id],visible:ready&&Boolean(v.paragraphs[id])};
 for(const branch of S.branches){values[`feedback-title-${branch.spriteId}`]={text:branch.title,visible:ready&&b?.spriteId===branch.spriteId&&titleAlpha>0};if(branch.kind==='wrong')values[`wrong-text-${branch.spriteId}`]={text:state.wrongText??'',visible:ready&&b?.spriteId===branch.spriteId&&closeVisible};}
 for(const a of S.answers){const visible=ready&&v.answerAlpha[a.letter]>0;values[`answer-${a.letter}`]={text:a.letter,visible};values[`value-${a.letter}`]={text:a.value,visible};}
 for(const [key,text]of [['money','M'],['rate','0.50'],['sunglasses','S'],['booth','25']]as const)values[`emphasis-${key}`]={text,visible:ready&&v.emphasis[key]};
 const frameDomain=context.frameDomain??'sprite-164',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,ready,state,visual:v,feedbackTitle:b?.title??'',feedbackTitleAlpha:titleAlpha,closeVisible,frame:context.frame,frameDomain,rootFrame,mainFrame:state.mainFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',sourceTextIds:Object.freeze([...new Set(P031_TEXT_BINDING.blocks.filter(b=>values[b.id].visible).flatMap(b=>b.sourceTextIds))]),textSnapshot:buildLessonTextSnapshot(P031_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});
}
export function algL07P031Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-164',scenario:'source-instruction',lang:'en',seed:0}){
 const domain=context.frameDomain??'sprite-164',spec=P031_DOMAINS.find(d=>d.id===domain);if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-p031-frame-identity');
 let s=p031InitialState(0,context.replay??0),ready=domain!=='root'||frame>=6;const id=Number(domain.slice(7)),popup=({128:131,141:144,155:159}as Record<number,number>)[id],b=S.branches.find(b=>b.spriteId===(popup??id));
 if(b){
  if(!((b.kind==='wrong'&&/^wrong-(first|second)(-(b|d))?$/.test(context.scenario))||(b.kind==='right'&&context.scenario==='right-feedback')))throw Error('invalid-p031-feedback-scenario');
  const local=popup&&b.kind==='wrong'?b.closeFirst:frame,second=context.scenario.startsWith('wrong-second'),answer=context.scenario.endsWith('-d')?4:context.scenario.endsWith('-b')?2:1;
  s={...s,phase:'feedback',mainFrame:420,quizSection:true,quizTryCount:second?1:0,selected:b.kind==='right'?3:answer,feedback:{spriteId:b.spriteId,kind:b.kind,frame:local,closing:b.kind==='wrong'&&local>b.hold,serial:1},selectionSerial:1,wrongText:b.kind==='wrong'?(second?S.answers[answer-1].wrongLater:S.answers[answer-1].wrongFirst):null};
 }else{
  if(context.scenario!=='source-instruction')throw Error('invalid-p031-main-scenario');const main=domain==='sprite-164'?frame:1;s={...s,mainFrame:main,phase:main<420?'prequiz':main===420?'quiz-held':'postquiz',quizSection:main===420,quizButtonsEnabled:main===420};
 }
 return p031View(s,{...context,frame,frameDomain:domain},ready);
}
export type P031View=ReturnType<typeof p031View>;
