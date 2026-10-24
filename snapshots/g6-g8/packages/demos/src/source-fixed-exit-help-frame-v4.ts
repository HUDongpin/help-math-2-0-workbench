import type {RuntimeContext} from './contract';
import type {LessonTextBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import {createFixedExitHelpQuizV1,type FixedExitHelpStateV1} from './source-fixed-exit-help-quiz-v1';
import type {FixedExitNativeVisualV2} from './source-fixed-exit-help-native-v2';
import type {FixedExitNativeSourceV4,FixedExitDisplayAnswerV4} from './source-fixed-exit-help-native-v4';
export type FixedExitTextDraftV4=Omit<LessonTextBinding['blocks'][number],'language'|'readingOrder'|'valueSource'>;
export type FixedExitTextValuesV4=Record<string,{text:string;visible:boolean}>;

const answerText=(a:FixedExitDisplayAnswerV4)=>a.display;
/** Exact frame-domain and native text binding for source-audited fixed-exit pages, including native equations and graph choices. */
export function createFixedExitHelpFrameV4<T extends string,I extends number,M extends number,V extends FixedExitNativeVisualV2<T>>(S:FixedExitNativeSourceV4<T,I,M,V>,c:{page:'p050';titleSpriteId:number;helpSpriteId:number;questionNumber:number;questionText:string;questionSourceIds:number[];closeTextId:number;wrongTextId:number;extraBlocks:readonly FixedExitTextDraftV4[];extraValues:(state:FixedExitHelpStateV1<T,I>,visual:V,ready:boolean)=>FixedExitTextValuesV4}){
 const quiz=createFixedExitHelpQuizV1<T,I>(S),wrong=S.branches.find(b=>b.kind==='wrong')!,right=S.branches.find(b=>b.kind==='right')!;
 if(wrong.kind!=='wrong')throw Error('FIXED_EXIT_FRAME_WRONG_BRANCH');
 const domains=Object.freeze([{id:'root',frameCount:10},{id:`sprite-${c.titleSpriteId}`,frameCount:1,rootFrame:6},{id:`sprite-${c.helpSpriteId}`,frameCount:1,rootFrame:6},{id:`sprite-${wrong.child}`,frameCount:1,rootFrame:6},...S.branches.map(b=>({id:`sprite-${b.spriteId}`,frameCount:b.terminal,rootFrame:6})),{id:`sprite-${S.mainSpriteId}`,frameCount:S.mainFrameCount,rootFrame:6}]);
 const firstWrong=S.answers.find(a=>a.answer!==S.correctAnswer)!.letter.toLowerCase();
 const defaults=Object.freeze(Object.fromEntries(domains.map(d=>[d.id,[`sprite-${wrong.spriteId}`,`sprite-${wrong.child}`].includes(d.id)?`wrong-first-${firstWrong}`:d.id===`sprite-${right.spriteId}`?'right-feedback':d.id===`sprite-${c.helpSpriteId}`?'help':'source-question'])));
 const knownTexts=new Set(S.sourceTexts.map(t=>t.characterId));
 const blocks:FixedExitTextDraftV4[]=[{id:'course-title',sourceTextIds:[],sourceShapeIds:[S.titleSourceShapeId],role:'heading'},{id:'activity-title',sourceTextIds:[],sourceShapeIds:[S.titleSourceShapeId],role:'title'},{id:'question',sourceTextIds:c.questionSourceIds.map(id=>`character-${id}`),role:'question'},{id:'help-open',sourceTextIds:['character-4','character-5'],role:'label'},{id:'help-close',sourceTextIds:[`character-${c.closeTextId}`],role:'label'},
  ...S.answers.map(a=>({id:`answer-${a.letter}`,sourceTextIds:[`character-${a.letterId}`],role:'answer' as const})),
  ...S.answers.filter(a=>a.valueKind!=='graph').map(a=>({id:`equation-${a.letter}`,sourceTextIds:a.equationIds.filter(id=>knownTexts.has(id)).map(id=>`character-${id}`),sourceShapeIds:a.equationIds.filter(id=>!knownTexts.has(id)),role:'body' as const})),
  ...S.helpTexts.map(t=>({id:`help-${t.id}`,sourceTextIds:[t.sourceTextId],role:'body' as const})),...S.branches.map(b=>({id:`feedback-title-${b.spriteId}`,sourceTextIds:b.titleIds.map(id=>`character-${id}`),role:'feedback' as const})),{id:`wrong-text-${wrong.spriteId}`,sourceTextIds:[`character-${c.wrongTextId}`],role:'feedback'},{id:'close',sourceTextIds:[`character-${c.closeTextId}`],role:'label'},...c.extraBlocks];
 const binding:LessonTextBinding=Object.freeze({schemaVersion:1,version:`alg-l07-${c.page}-native-source-v1`,animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze(blocks.map((b,readingOrder)=>({...b,language:'en' as const,readingOrder,valueSource:'maintained-page-state' as const})))});
 function view(state:FixedExitHelpStateV1<T,I>,context:RuntimeContext,ready=true){
  const visual=S.visualStates.find(s=>state.mainFrame>=s.first&&state.mainFrame<=s.last)!.value,f=state.feedback,b=f?S.branches.find(b=>b.spriteId===f.spriteId)!:null,titleAlpha=f&&b?b.titleAlpha.find(s=>f.frame>=s.first&&f.frame<=s.last)?.value??0:0,closeVisible=quiz.canClose({...state,glossary:null});
  const values:FixedExitTextValuesV4={'course-title':{text:'Linear and Nonlinear Functions:',visible:ready},'activity-title':{text:'Try It!',visible:ready},question:{text:c.questionNumber+' '+c.questionText,visible:ready&&visual.questionAlpha>0},'help-open':{text:'Need More Help',visible:ready&&state.phase==='quiz-held'},'help-close':{text:'Close',visible:ready&&state.help},close:{text:'Close',visible:ready&&closeVisible},[`wrong-text-${wrong.spriteId}`]:{text:state.wrongText??'',visible:ready&&closeVisible},...c.extraValues(state,visual,ready)};
  for(const a of S.answers){values[`answer-${a.letter}`]={text:a.letter,visible:ready&&visual.answerAlpha[a.letter]>0};if(a.valueKind!=='graph')values[`equation-${a.letter}`]={text:answerText(a),visible:ready&&visual.answerAlpha[a.letter]>0};}
  for(const t of S.helpTexts)values[`help-${t.id}`]={text:t.text,visible:ready&&state.help};
  for(const branch of S.branches)values[`feedback-title-${branch.spriteId}`]={text:branch.title,visible:ready&&b?.spriteId===branch.spriteId&&titleAlpha>0};
  const frameDomain=context.frameDomain??`sprite-${S.mainSpriteId}`,rootFrame=frameDomain==='root'?context.frame:6;
  return Object.freeze({animationId:S.animationId,ready,state,visual,feedbackTitle:b?.title??'',feedbackTitleAlpha:titleAlpha,closeVisible,frame:context.frame,frameDomain,rootFrame,mainFrame:state.mainFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',sourceTextIds:Object.freeze([...new Set(binding.blocks.filter(b=>values[b.id].visible).flatMap(b=>b.sourceTextIds))]),textSnapshot:buildLessonTextSnapshot(binding,{...context,frameDomain,rootFrame},values)});
 }
 function frame(frame:number,context:RuntimeContext={frame,frameDomain:`sprite-${S.mainSpriteId}`,scenario:'source-question',lang:'en',seed:0}){
  const domain=context.frameDomain??`sprite-${S.mainSpriteId}`,spec=domains.find(d=>d.id===domain);
  if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error(`invalid-${c.page}-frame-identity`);
  let state=quiz.initialState(0,context.replay??0);const ready=domain!=='root'||frame>=6,id=Number(domain.slice(7)),popup=id===wrong.child,b=S.branches.find(b=>b.spriteId===(popup?wrong.spriteId:id));
  if(b){
   const match=/^wrong-(first|second)-([abcd])$/.exec(context.scenario),answer=match?S.answers.find(a=>a.letter.toLowerCase()===match[2])?.answer:undefined;
   if(!((b.kind==='wrong'&&answer!==undefined&&answer!==S.correctAnswer)||(b.kind==='right'&&context.scenario==='right-feedback')))throw Error(`invalid-${c.page}-feedback-scenario`);
   const local=popup&&b.kind==='wrong'?b.closeFirst:frame,second=context.scenario.startsWith('wrong-second'),selected=b.kind==='right'?S.correctAnswer:answer!;
   state={...state,phase:'feedback',mainFrame:S.quizFrame,quizSection:true,quizTryCount:second?1:0,selected,feedback:{spriteId:b.spriteId,kind:b.kind,frame:local,closing:b.kind==='wrong'&&local>b.hold,serial:1},selectionSerial:1,wrongText:b.kind==='wrong'?(second?S.answers[selected-1].wrongLater:S.answers[selected-1].wrongFirst):null};
  }else if(domain===`sprite-${c.helpSpriteId}`){
   if(context.scenario!=='help')throw Error(`invalid-${c.page}-help-scenario`);state={...state,phase:'quiz-held',mainFrame:S.quizFrame,help:true,quizSection:true};
  }else{
   if(context.scenario!=='source-question')throw Error(`invalid-${c.page}-main-scenario`);const main=domain===`sprite-${S.mainSpriteId}`?frame:1;state={...state,mainFrame:main,phase:main<S.quizFrame?'prequiz':main===S.quizFrame?'quiz-held':main===S.mainFrameCount?'ended':'postquiz',quizSection:main===S.quizFrame,quizButtonsEnabled:main===S.quizFrame};
  }
  return view(state,{...context,frame,frameDomain:domain},ready);
 }
 return {domains,defaults,binding,view,frame,movie:Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12})};
}
