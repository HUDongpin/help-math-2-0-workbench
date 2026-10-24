import type {RuntimeContext} from './contract';
import type {LessonTextBinding,LessonTextBlockBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import {createFunctionQuestionReducer,type FunctionQuestionState} from './g678-advanced-manual/source-function-question-state-v1';
import type {FunctionQuestionModel,QuestionMath} from './alg-l07-function-question-model-v1';
export const FUNCTION_QUESTION_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const questionMathId=(e:QuestionMath)=>`math-${e.sourceIds.join('-')}`;
export const questionMathText=(e:QuestionMath)=>e.kind==='plain'?e.text:e.kind==='power'?`${e.base}${e.exponent==='2'?'²':'³'}`:e.kind==='root'?`${e.prefix}√${e.radicand}`:`${e.prefix}${e.fractions.map(f=>`(${f.numerator})/(${f.denominator})`).join(' = ')}`;
export const questionHelperExpanded=(s:FunctionQuestionState)=>!!s.stepBox&&!(s.stepBox.frame===1&&s.stepBox.sourceStopped);
export function createFunctionQuestionFrames(S:FunctionQuestionModel){
 const reducer=createFunctionQuestionReducer(S.behavior),mainDomain=`sprite-${S.mainSpriteId}`;
 const domains=Object.freeze([{id:'root',frameCount:10},{id:mainDomain,frameCount:S.mainFrameCount,rootFrame:6},...S.steps.filter(s=>s.helperId).map(s=>({id:`sprite-${s.helperId}`,frameCount:s.number===3?21:20,rootFrame:6})),{id:`sprite-${S.help.spriteId}`,frameCount:1,rootFrame:6},...S.branches.map(b=>({id:`sprite-${b.spriteId}`,frameCount:b.terminal,rootFrame:6}))]);
 const correct=S.answers.find(a=>S.behavior.options.find(o=>o.letter===a.letter)?.right)!.letter;
 const wrong=S.answers.find(a=>a.letter!==correct)!.letter;
 const defaults=Object.freeze(Object.fromEntries(domains.map(d=>[d.id,S.steps.find(s=>`sprite-${s.helperId}`===d.id)?`step-${S.steps.find(s=>`sprite-${s.helperId}`===d.id)!.number}`:d.id===`sprite-${S.help.spriteId}`?'help':S.branches.find(b=>`sprite-${b.spriteId}`===d.id)?.kind==='right'?'right-feedback':S.branches.some(b=>`sprite-${b.spriteId}`===d.id)?`wrong-first-${wrong}`:'source-question'])));
 const math=[...S.answers.map(a=>a.equation),...S.steps.flatMap(s=>[...(s.equation?[s.equation]:[]),...(s.graphs??[]).map(g=>g.equation)]),...(S.help.equation?[S.help.equation]:[])];
 const paragraphIds=new Set([16,...S.steps.flatMap(s=>[...s.textIds,...(s.afterIds??[])]),...S.help.textIds,...(S.help.afterIds??[]),...S.help.examples.flatMap(e=>e.textIds)]);
 const paragraphs=S.texts.filter(t=>paragraphIds.has(t.characterId));
 const cards=S.steps.flatMap(s=>s.graphs??[]);
 type Draft=Pick<LessonTextBlockBinding,'id'|'sourceTextIds'|'role'>;
 const drafts:Draft[]=[...paragraphs.map(t=>({id:`text-${t.characterId}`,sourceTextIds:[t.sourceTextId],role:t.characterId===16?'question' as const:'body' as const})),...cards.map(c=>({id:`caption-${c.graph}`,sourceTextIds:[c.caption.sourceTextId],role:'label' as const})),...math.map(e=>({id:questionMathId(e),sourceTextIds:e.sourceIds.map(i=>`character-${i}`),role:'body' as const})),...S.steps.map(s=>({id:`step-${s.number}-number`,sourceTextIds:s.numberIds.map(i=>`character-${i}`),role:'label' as const})),...S.answers.map(a=>({id:`answer-${a.letter}`,sourceTextIds:[`character-${a.labelId}`],role:'answer' as const})),...S.graphs.flatMap(g=>g.labels.map((t,i)=>({id:`graph-${g.key}-label-${i}`,sourceTextIds:[t.sourceTextId],role:'label' as const}))),...S.branches.map(b=>({id:`feedback-${b.spriteId}`,sourceTextIds:b.titleIds.map(i=>`character-${i}`),role:'feedback' as const})),{id:'help-open',sourceTextIds:['character-4','character-5'],role:'label'},{id:'helper-close',sourceTextIds:[`character-${S.page===59?224:283}`],role:'label'}];
 const binding:LessonTextBinding=Object.freeze({schemaVersion:1,version:`alg-l07-p0${S.page}-native-source-v1`,animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:drafts.map((b,readingOrder)=>({...b,language:'en' as const,readingOrder,valueSource:'maintained-page-state' as const}))});
 const text=(id:number)=>{const t=S.texts.find(t=>t.characterId===id);if(!t)throw Error('Function question missing source text');return t.text;};
 function view(state:FunctionQuestionState,context:RuntimeContext,ready=true){
  const visual=S.visualStates.find(v=>state.mainFrame>=v.first&&state.mainFrame<=v.last)!.value,box=state.stepBox,expanded=questionHelperExpanded(state),helperVisual=box?S.helperStates[box.spriteId].find(v=>box.frame>=v.first&&box.frame<=v.last)!.value:null;
  const f=state.feedback,b=f?S.branches.find(b=>b.spriteId===f.spriteId)!:null,feedbackAlpha=b&&f?b.titleAlpha.find(v=>f.frame>=v.first&&f.frame<=v.last)?.value??0:0;
  const values:Record<string,{text:string;visible:boolean}>={};
  const visibleIds=new Set<number>(S.texts.filter(t=>(visual.textAlpha[t.characterId]??0)>0).map(t=>t.characterId));
  if(box)for(const [id,opacity]of Object.entries(helperVisual??{}))if(opacity>0)visibleIds.add(Number(id));
  if(state.helpVisible)for(const id of [...S.help.textIds,...(S.help.afterIds??[]),...S.help.examples.flatMap(e=>e.textIds),...(S.help.equation?.sourceIds??[])])visibleIds.add(id);
  for(const t of paragraphs)values[`text-${t.characterId}`]={text:t.text,visible:ready&&visibleIds.has(t.characterId)};
  for(const e of math)values[questionMathId(e)]={text:questionMathText(e),visible:ready&&e.sourceIds.some(id=>visibleIds.has(id))};
  for(const s of S.steps)values[`step-${s.number}-number`]={text:`${s.number}.`,visible:ready&&s.numberIds.some(id=>visibleIds.has(id))};
  for(const a of S.answers)values[`answer-${a.letter}`]={text:a.letter,visible:ready&&visual.answerAlpha[a.letter]>0};
  const visibleGraphs=new Set<string>();
  if(S.mainGraph&&visual.graphAlpha>0)visibleGraphs.add(S.mainGraph);
  if(state.helpVisible)for(const e of S.help.examples)visibleGraphs.add(e.graph);
  for(const s of S.steps)if(s.textIds.some(id=>visibleIds.has(id)))for(const card of s.graphs??[])visibleGraphs.add(card.graph);
  for(const card of cards)values[`caption-${card.graph}`]={text:card.caption.text,visible:ready&&visibleGraphs.has(card.graph)};
  for(const g of S.graphs)for(let i=0;i<g.labels.length;i++)values[`graph-${g.key}-label-${i}`]={text:g.labels[i].text,visible:ready&&visibleGraphs.has(g.key)};
  for(const branch of S.branches)values[`feedback-${branch.spriteId}`]={text:branch.title,visible:ready&&b?.spriteId===branch.spriteId&&feedbackAlpha>0};
  values['help-open']={text:'Need More Help',visible:ready&&state.mainFrame===S.quizFrame};values['helper-close']={text:'Close',visible:ready&&expanded&&box?.frame===15};
  const frameDomain=context.frameDomain??mainDomain,rootFrame=frameDomain==='root'?context.frame:6;
  return{source:S,animationId:S.animationId,...context,frameDomain,rootFrame,state,ready,visual,helperExpanded:expanded,helperVisual,feedback:b?{...b,alpha:feedbackAlpha}:null,glossary:reducer.glossary(state).map(g=>({...g,term:S.terms.find(t=>t.sourceKeyAttribute.toLowerCase()===g.key.toLowerCase())!.sourceKeyAttribute})),values,visibleGraphs,textSnapshot:buildLessonTextSnapshot(binding,{...context,frameDomain,rootFrame},values)};
 }
 function frame(frame:number,context:RuntimeContext={frame,frameDomain:mainDomain,scenario:'source-question',lang:'en',seed:0}){
  const domain=context.frameDomain??mainDomain,spec=domains.find(d=>d.id===domain),sid=Number(domain.slice(7));
  if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>0xffffffff||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('Function question invalid frame identity');
  let state=reducer.initialState(0,context.replay??0);const branch=S.branches.find(b=>b.spriteId===sid),step=S.steps.find(s=>s.helperId===sid);
  if(branch){const selected=context.scenario.at(-1);if(branch.kind==='right'&&context.scenario!=='right-feedback'||branch.kind==='wrong'&&(!/^wrong-(first|second)-[ABCD]$/.test(context.scenario)||selected===correct))throw Error('Function question invalid feedback scenario');state={...state,phase:'feedback-playing',mainFrame:S.quizFrame,quizSection:true,quizTryCount:context.scenario.startsWith('wrong-second')?1:0,selected:branch.kind==='right'?correct:selected as'A'|'B'|'C'|'D',feedback:{spriteId:sid,kind:branch.kind,frame,playing:frame<branch.terminal,generation:1,hostX:5}};}
  else if(step){if(context.scenario!==`step-${step.number}`)throw Error('Function question invalid helper scenario');state={...state,phase:'step-held',mainFrame:S.behavior.steps[step.number-1].frame,quizSection:frame<=15,stepBox:{spriteId:sid,frame,playing:frame>1&&frame!==15&&frame<20,visible:true,closing:frame>15,sourceStopped:frame===1||frame===15||frame>=20,generation:1}};}
  else if(sid===S.help.spriteId){if(context.scenario!=='help')throw Error('Function question invalid help scenario');state={...state,phase:'quiz-held',mainFrame:S.quizFrame,quizSection:true,helpVisible:true};}
  else{if(context.scenario!=='source-question')throw Error('Function question invalid main scenario');const main=domain==='root'?1:frame,held=S.behavior.steps.some(s=>s.frame===main);state={...state,mainFrame:main,phase:held?'step-held':main===S.quizFrame?'quiz-held':main===S.mainFrameCount&&S.behavior.ending==='source-stop'?'source-end-held':'main',quizSection:held||main===S.quizFrame,quizButtonsEnabled:main===S.quizFrame,nmhButtonEnabled:main===S.quizFrame};}
  return view(state,{...context,frame,frameDomain:domain},domain!=='root'||frame===6);
 }
 return{domains,defaults,binding,text,view,frame,reducer};
}
export type FunctionQuestionView=ReturnType<ReturnType<typeof createFunctionQuestionFrames>['view']>;
