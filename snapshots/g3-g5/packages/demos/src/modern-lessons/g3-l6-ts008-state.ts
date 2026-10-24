import type {RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition,LessonTextActivitySnapshot,LessonTextBinding,TextPresentationSnapshot} from '../lesson-text-contract';
import {buildLessonTextSnapshot} from '../lesson-text-snapshot';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import sourceModule from '../modules/course-g03-l06-ts-008';
import {G3_L6_TS008_SOURCE_DATA as SOURCE} from './generated/g3-l6-ts008-source-v1';
import {G3_L6_TS008_FEEDBACK_AUDIO as AUDIO} from './generated/g3-l6-ts008-audio-v1';

export const G3_L6_TS008_ID='course-g03-l06-ts-008';
export const G3_L6_TS008_DOMAIN=SOURCE.domain;
export const G3_L6_TS008_TRANSITIONS=SOURCE.transitions;
export const G3_L6_TS008_FEEDBACK=SOURCE.feedback;
export const G3_L6_TS008_CHOICES=Object.freeze([
 {letter:'A',shaded:3,total:100,letterCharacter:21,buttonCharacter:174},
 {letter:'B',shaded:30,total:100,letterCharacter:27,buttonCharacter:173},
 {letter:'C',shaded:1,total:10,letterCharacter:25,buttonCharacter:171},
 {letter:'D',shaded:7,total:10,letterCharacter:23,buttonCharacter:172},
] as const);
export type G3L6Ts008Choice=typeof G3_L6_TS008_CHOICES[number]['letter'];
export type G3L6Ts008Help='picture'|'reasoning'|'equivalent-decimals';
export const G3_L6_TS008_KEY_TERMS=SOURCE.keyTerms;
export const G3_L6_TS008_ACTIVITIES: readonly LessonTextActivityDefinition[]=Object.freeze(SOURCE.feedback.map(f=>{
 const audio=AUDIO.find(a=>a.id===f.id)!;
 return Object.freeze({id:f.id,frameDomain:`sprite-${f.sprite}`,startFrame:2,endFrame:f.endFrame,fps:12,parentFrames:Object.freeze([799]),
  audio:Object.freeze({...audio,language:'shared' as const,spokenLanguage:'undetermined' as const})});
}));
export interface G3L6Ts008Interaction {
 readonly seed:number;readonly replay:number;readonly quizTryCount:number;readonly help:G3L6Ts008Help|null;
 readonly feedback:Readonly<{id:string;kind:'wrong'|'correct';variant:number;selected:G3L6Ts008Choice;activityRevisionFloor:number}>|null;
 readonly pendingFromFrame:number|null;readonly terminalOutcome:'correct'|'two-wrong-continuation'|null;
}
export type G3L6Ts008Action=Readonly<{type:'continue'|'open-help'|'close-help'|'feedback-complete'}>|
 Readonly<{type:'answer';choice:G3L6Ts008Choice;activityRevisionFloor?:number}>;
export function createG3L6Ts008Interaction(seed=0,replay=0):G3L6Ts008Interaction {
 return Object.freeze({seed:Number.isSafeInteger(seed)?seed>>>0:0,replay:Number.isSafeInteger(replay)?replay:0,
  quizTryCount:0,help:null,feedback:null,pendingFromFrame:null,terminalOutcome:null});
}
export function synchronizeG3L6Ts008Interaction(state:G3L6Ts008Interaction,context:RuntimeContext){
 const identity=createG3L6Ts008Interaction(context.seed,context.replay??0);
 if(identity.seed!==state.seed||identity.replay!==state.replay)return identity;
 return state.pendingFromFrame!==null&&state.pendingFromFrame!==context.frame?Object.freeze({...state,pendingFromFrame:null}):state;
}
export function reduceG3L6Ts008Interaction(state:G3L6Ts008Interaction,frame:number,action:G3L6Ts008Action){
 const edge=SOURCE.transitions.find(e=>e.fromFrame===frame);
 const reject=(reason:string)=>({allowed:false as const,reason,nextState:state,frameRequest:null});
 const accept=(next:G3L6Ts008Interaction,frameRequest:typeof edge|null=null)=>({allowed:true as const,reason:null,nextState:Object.freeze(next),frameRequest:frameRequest??null});
 if(state.pendingFromFrame===frame)return reject('source-transition-pending');
 if(action.type==='continue'){
  if(!edge||frame===799||state.help||state.feedback)return reject('continue-not-available');
  return accept({...state,pendingFromFrame:frame},edge);
 }
 if(action.type==='open-help'){
  if(state.help||state.feedback)return reject('help-not-available');
  // Both early source Help clip actions simply resume the next main segment.
  if(frame===329||frame===467)return accept({...state,pendingFromFrame:frame},edge);
  const help=frame===582?'picture':frame===688?'reasoning':frame===799?'equivalent-decimals':null;
  return help?accept({...state,help}):reject('help-not-available');
 }
 if(action.type==='close-help'){
  if(!state.help)return reject('help-not-open');
  if(state.help==='equivalent-decimals'&&frame===799)return accept({...state,help:null});
  if((state.help==='picture'&&frame===582)||(state.help==='reasoning'&&frame===688)){
   // Close sets quizSection=false. The exact L6 host then resumes the main
   // frame; the source help enlargement is presentation evidence only.
   return accept({...state,help:null,pendingFromFrame:frame},edge);
  }return reject('help-frame-mismatch');
 }
 if(action.type==='answer'){
  if(frame!==799||state.help||state.feedback||!G3_L6_TS008_CHOICES.some(c=>c.letter===action.choice))return reject('answer-not-available');
  const kind=action.choice==='B'?'correct':'wrong',choices=SOURCE.feedback.filter(f=>f.kind===kind);
  // Source establishes the 3/4 reachable variant sets. This deterministic
  // selection is Current-JS behavior, with no Flash random-sequence claim.
  const selected=choices[(state.seed+state.quizTryCount)%choices.length]!;
  return accept({...state,feedback:{id:selected.id,kind,variant:selected.variant,selected:action.choice,activityRevisionFloor:action.activityRevisionFloor??-1}});
 }
 if(action.type==='feedback-complete'){
  if(frame!==799||!state.feedback||state.help)return reject('feedback-not-available');
  if(state.feedback.kind==='wrong'&&state.quizTryCount===0)return accept({...state,feedback:null,quizTryCount:1});
  const correct=state.feedback.kind==='correct';
  return accept({...state,feedback:null,quizTryCount:correct?state.quizTryCount:0,pendingFromFrame:799,
   terminalOutcome:correct?'correct':'two-wrong-continuation'},edge);
 }return reject('unknown-action');
}
export function getG3L6Ts008FeedbackActivity(state:G3L6Ts008Interaction,activity?:LessonTextActivitySnapshot){
 const feedback=state.feedback,definition=feedback?SOURCE.feedback.find(f=>f.id===feedback.id):undefined;
 const matched=Boolean(feedback&&definition&&activity&&activity.id===definition.id&&activity.frameDomain===`sprite-${definition.sprite}`&&activity.revision>feedback.activityRevisionFloor);
 return {matched,visible:Boolean(matched&&activity&&definition&&definition.visibleFrames.some(([first,last])=>activity.frame>=first&&activity.frame<=last)),
  complete:Boolean(matched&&activity&&definition&&activity.status==='completed'&&activity.frame===definition.endFrame)};
}
const ids=(...characters:number[])=>characters.flatMap(character=>SOURCE.texts.find(t=>t.characterId===character)?.runs.map(r=>r.id)??[]);
const block=(id:string,characters:number[],role:'title'|'heading'|'question'|'body'|'label'|'answer',readingOrder:number)=>
 ({id,sourceTextIds:ids(...characters),role,language:'en' as const,readingOrder,valueSource:'maintained-page-state' as const});
export const G3_L6_TS008_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'g3-l6-ts008-modern-text-v1',
 placementId:SOURCE.placementId,animationId:G3_L6_TS008_ID,sourceSwfSha256:SOURCE.sourceSwfSha256,template:'exercise',blocks:Object.freeze([
  block('root-title',[369],'title',0),block('question',[29],'question',1),
  ...G3_L6_TS008_CHOICES.map((choice,index)=>block(`choice-${choice.letter}`,[choice.letterCharacter],'answer',10+index)),
  block('step1-heading',[19,18],'heading',20),block('step1-instruction',[65],'body',21),
  block('step2-heading',[15],'heading',30),block('given',[108],'body',31),block('needed',[107],'body',32),
  block('step3-heading',[16],'heading',40),block('model-equivalence',[113,114,115,116,118,119],'body',41),
  block('compare-A',[123,138,115,119,118,130,114],'body',42),block('compare-B',[124,118,119,126,114],'body',43),
  block('compare-C',[128,136,135,116,119,118,130,114],'body',44),block('compare-D',[129,134,132,116,133,119,118,130,114],'body',45),
  block('picture-answer',[121],'answer',46),block('step4-heading',[17],'heading',50),block('strategy',[151],'body',51),
  block('fraction-pattern',[154,155,156,157,158,159],'body',52),block('decimal-pattern',[161],'body',53),
  block('pattern-equivalence',[163],'body',54),block('reasoning-answer',[165,169],'answer',55),
  block('help-definition',[178],'body',100),block('help-example',[177],'heading',101),block('help-represents',[179],'body',102),
  block('help-equality',[180],'body',103),block('help-model',[182],'body',104),
  ...SOURCE.feedback.map((f,index)=>block(`feedback-${f.id}`,[...f.characters],'answer',110+index)),
 ])});
const TEXT:Record<string,string>={
 'root-title':'Decimals & Money: Practice Test',question:'This pictorial model represents the decimal 0.3. Which pictorial model shows an equivalent decimal?',
 'choice-A':'A','choice-B':'B','choice-C':'C','choice-D':'D',
 'step1-heading':'1.','step1-instruction':'Which is the equivalent decimal?',
 'step2-heading':'2.',given:'Information given: decimal grid with 0.3 shown',needed:'Information needed: which decimal pictorial model is equal to 0.3?',
 'step3-heading':'3.','model-equivalence':'0.3 = 3/10 = 30/100',
 'compare-A':'A. 0.03 = 3/100 ≠ 30/100 ✗','compare-B':'B. 30/100 = 30/100 ✓',
 'compare-C':'C. 0.1 = 0.10 = 1/10; 10/100 ≠ 30/100 ✗','compare-D':'D. 0.7 = 0.70 = 7/10; 70/100 ≠ 30/100 ✗',
 'picture-answer':'The correct answer choice is B.','step4-heading':'4.','strategy':'Use strategy: Find a Pattern',
 'fraction-pattern':'Fractions that are equal to 3/10 include 30/100','decimal-pattern':'Decimals that are equal to 0.3 include 0.30',
 'pattern-equivalence':'= 0.30 = 0.3','reasoning-answer':'The correct answer choice is B.',
 'help-definition':'Equivalent decimals are decimals that name the same number.','help-example':'Example:',
 'help-represents':'Represents the decimal 0.20.','help-equality':'0.20 = 0.2','help-model':'0.2 can be represented by the model:',
 ...Object.fromEntries(SOURCE.feedback.map(f=>[`feedback-${f.id}`,f.text])),
};
export function getG3L6Ts008TeachingState(frame:number){return Object.freeze({question:frame>=3,step1:frame>=330,step2:frame>=468,
 step3:frame>=583,step4:frame>=689,quiz:frame===799,complete:frame===816});}
export function getG3L6Ts008Snapshot(state:SourceStaticCanvasFrameState,context:RuntimeContext,interaction?:G3L6Ts008Interaction,activity?:LessonTextActivitySnapshot):TextPresentationSnapshot{
 const expected=sourceModule.getFrameState(context.frame,context),current=interaction??createG3L6Ts008Interaction(context.seed,context.replay??0),teaching=getG3L6Ts008TeachingState(expected.frame);
 const valid=Boolean(state&&state.status==='ready'&&expected.status==='ready'&&state.animationId===G3_L6_TS008_ID&&state.sourceSwfSha256===SOURCE.sourceSwfSha256&&
  state.frame===expected.frame&&state.frameDomain===SOURCE.domain&&(context.frameDomain??SOURCE.domain)===SOURCE.domain&&state.rootFrame===6&&
  (context.rootFrame===undefined||context.rootFrame===6)&&state.scenario==='source-static-frame'&&context.scenario===state.scenario&&state.language==='en'&&context.lang==='en'&&state.seed===expected.seed);
 const content:Record<string,{text:string;visible:boolean}>={};
 for(const item of G3_L6_TS008_BINDING.blocks){let visible=teaching.question;
  if(item.id==='root-title')visible=true; // Source Mc_Page_Title remains present at root frame 6.
  if(item.id.startsWith('step1')||item.id==='step1-instruction')visible=teaching.step1;
  if(item.id.startsWith('step2')||['given','needed'].includes(item.id))visible=teaching.step2;
  if(item.id.startsWith('step3')||['model-equivalence','picture-answer'].includes(item.id)||item.id.startsWith('compare-'))visible=teaching.step3||current.help==='picture';
  if(item.id.startsWith('step4')||['strategy','fraction-pattern','decimal-pattern','pattern-equivalence','reasoning-answer'].includes(item.id))visible=teaching.step4||current.help==='reasoning';
  if(item.id.startsWith('help-'))visible=current.help==='equivalent-decimals';
  if(item.id.startsWith('feedback-'))visible=item.id===`feedback-${current.feedback?.id}`&&getG3L6Ts008FeedbackActivity(current,activity).visible;
  content[item.id]={text:TEXT[item.id]??'',visible};
 }
 const snapshot=buildLessonTextSnapshot(G3_L6_TS008_BINDING,{...context,frame:expected.frame,frameDomain:SOURCE.domain,rootFrame:6},content);
 return valid?snapshot:{...snapshot,status:'blocked',blocks:[],blockers:['source-state-or-context-mismatch']};
}
