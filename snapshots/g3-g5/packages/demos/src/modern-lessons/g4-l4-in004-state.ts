import {G4_L4_IN004_INTERACTION_CONFIG as C} from './generated/g4-l4-in004-interaction-config';
export type In004QuestionId=typeof C.questions[number]['id'];
export type In004Card='Mc_Jump_1'|'Mc_Jump_2'|'Mc_Jump_3'|'Mc_Jump_4';
export type In004Target='Mc_NumLine'|'Mc_NumLine1';
export interface In004Rule {readonly target:In004Target;readonly minCount:number;readonly countDelta:number;readonly snapTwips:readonly number[];readonly snapWithOtherDisabledTwips:readonly number[];readonly otherCard:In004Card;readonly revealSecond:boolean;readonly placedMarker:number|null;readonly complete:'always'|'count-at-least-two'}
export interface In004QuestionSpec {readonly id:In004QuestionId;readonly frame:number;readonly answer:string;readonly cards:readonly {readonly name:In004Card;readonly characterId:number;readonly originTwips:readonly number[];readonly role:'first'|'second'|'distractor';readonly rule:In004Rule|null}[]}
export const IN004_QUESTIONS:readonly In004QuestionSpec[]=C.questions;
export const IN004_FEEDBACK=C.feedback;
const nextRandom=(v:number)=>(Math.imul(v,1664525)+1013904223)>>>0;
export interface In004DrawState {readonly random:number;readonly remaining:readonly In004QuestionId[]}
/** One invocation of the authored doGetRandomQuiz body. This does NOT decide
 * whether entering Q1 re-executes its frame initializer and draws again. That
 * navigation boundary is deliberately left to the source-reviewed host lane. */
export function drawIn004Question(s:In004DrawState){
 const remaining=s.remaining.length?[...s.remaining]:IN004_QUESTIONS.map(q=>q.id),random=nextRandom(s.random),index=Math.floor(random/4294967296*remaining.length),[question]=remaining.splice(index,1);
 return {random,remaining,question:question!,answer:IN004_QUESTIONS.find(q=>q.id===question)!.answer};
}
export interface In004State {
 readonly question:In004QuestionId;readonly seed:number;readonly replay:number;readonly visit:number;readonly random:number;
 readonly selected:In004Card|null;readonly placed:readonly In004Card[];readonly positions:Readonly<Partial<Record<In004Card,readonly number[]>>>;
 readonly count:number;readonly answer:string;readonly secondVisible:boolean;readonly wrongOpen:boolean;readonly placedMarker:number|null;
 readonly feedbackRevision:number;readonly finalToken:string|null;readonly newProblemEnabled:boolean;
}
/** State after one source random draw and destination-question initialization.
 * No source frame seek, random navigation, or host side effect is implied. */
export function createIn004Question(question:In004QuestionId,seed=0,replay=0,visit=0):In004State {
 if(!IN004_QUESTIONS.some(q=>q.id===question))throw new Error('Unknown IN004 source question');
 return {question,seed:seed>>>0,replay,visit,random:seed>>>0,selected:null,placed:[],positions:{},count:0,answer:'',secondVisible:false,wrongOpen:false,placedMarker:null,feedbackRevision:0,finalToken:null,newProblemEnabled:false};
}
export type In004Effect=Readonly<{kind:'coach'|'final'|'wrong';token:string;sprite:number;start:number;end:number}>;
export type In004Action={type:'press';card:In004Card}|{type:'drop';card?:In004Card;target:In004Target|null}|{type:'close-wrong'}|{type:'feedback-complete';kind:'coach'|'final'|'wrong';token:string;frame:number};
export function reduceIn004Question(s:In004State,a:In004Action,paused=false):{state:In004State;effects:readonly In004Effect[]}{
 const unchanged={state:s,effects:[] as readonly In004Effect[]};if(paused)return unchanged;
 const q=IN004_QUESTIONS.find(q=>q.id===s.question)!;const enabled=(c:In004Card)=>q.cards.some(x=>x.name===c)&&!s.placed.includes(c);
 if(a.type==='press')return enabled(a.card)?{...unchanged,state:{...s,selected:a.card,wrongOpen:false}}:unchanged;
 // Source Close hides its panel. Its absent Enable_btn helper is not invented.
 if(a.type==='close-wrong')return s.wrongOpen?{...unchanged,state:{...s,wrongOpen:false}}:unchanged;
 if(a.type==='feedback-complete')return a.kind==='final'&&a.frame===C.feedback.final.end&&s.finalToken!==null&&a.token===s.finalToken&&!s.newProblemEnabled?{...unchanged,state:{...s,newProblemEnabled:true}}:unchanged;
 const name=a.card??s.selected;if(!name||!enabled(name))return unchanged;
 const card=q.cards.find(c=>c.name===name)!,rule=card.rule,revision=s.feedbackRevision+1,token=`in004:${s.seed}:${s.replay}:${s.visit}:${s.question}:${revision}`;
 // A hidden second source target cannot be a real pointer/drop target.
 const target=a.target==='Mc_NumLine1'&&!s.secondVisible?null:a.target;
 if(rule&&target===rule.target&&s.count>=rule.minCount){
  const count=s.count+rule.countDelta,final=rule.complete==='always'||count>=2,otherEnabled=!s.placed.includes(rule.otherCard),position=otherEnabled?rule.snapTwips:rule.snapWithOtherDisabledTwips;
  const effects:In004Effect[]=[{kind:'coach',token,sprite:C.feedback.coach.sprite,start:C.feedback.coach.start,end:C.feedback.coach.end}];if(final)effects.push({kind:'final',token,sprite:C.feedback.final.sprite,start:C.feedback.final.start,end:C.feedback.final.end});
  return {state:{...s,selected:null,placed:[...s.placed,name],positions:{...s.positions,[name]:position},count,answer:final?q.answer:s.answer,secondVisible:s.secondVisible||rule.revealSecond,wrongOpen:false,placedMarker:otherEnabled&&rule.placedMarker!==null?rule.placedMarker:s.placedMarker,feedbackRevision:revision,finalToken:final?token:s.finalToken},effects};
 }
 const random=nextRandom(s.random),branch=C.feedback.wrong.branches[Math.floor(random/4294967296*4)]!;
 return {state:{...s,random,selected:null,wrongOpen:true,feedbackRevision:revision},effects:[{kind:'wrong',token,sprite:C.feedback.wrong.sprite,start:branch[0],end:branch[1]}]};
}
