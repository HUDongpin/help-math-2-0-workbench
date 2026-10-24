// Source-bound two-attempt practice flow. The host owns every clock.
import {chooseSixQuestionChoiceAnswer,createSixQuestionChoiceState} from './source-six-question-choice';
type Transition=Readonly<{fromFrame:number;toFrame:number;stopFrame:number}>;
type Activity=Readonly<{id:string;frameDomain:string;sourceInstanceId:string;startFrame:number;endFrame:number}>;
export type PracticeConfig=Readonly<{frameCount:number;finalFrame:number;finalTransition:Transition;steps:readonly Readonly<{hold:number;transition:Transition;box:(Activity&{closeButton:number})|null}>[];answers:readonly Readonly<{id:string;text:string;correct:boolean;sourceButton:number}>[];feedback:readonly (Activity&{kind:'correct'|'wrong';variant:number})[];help:Readonly<{availableFrames:readonly number[]}>}>;
type Context=Readonly<{frame:number;seed:number;replay:number;paused?:boolean}>;
type Running=Readonly<{definition:Activity;parentFrame:number;revisionFloor:number;selected?:string;kind?:'correct'|'wrong'}>;
export type PracticeState=Readonly<{seed:number;replay:number;frame:number;wrongAttempts:number;help:boolean;box:Running|null;boxReady:boolean;feedback:Running|null;pendingFromFrame:number|null;focus:string|null}>;
type Proof=Readonly<{id:string;frameDomain:string;sourceInstanceId:string;frame:number;revision:number;status:string}>;
export type PracticeAction=Readonly<{type:'continue-step'|'close-step'|'open-help'|'close-help'}>|Readonly<{type:'open-step';revisionFloor:number}>|Readonly<{type:'choose';choice:string;revisionFloor:number}>|Readonly<{type:'activity-completed';proof:Proof}>;
export type PracticeProposal=Readonly<{state:PracticeState;request?:Readonly<{kind:'frame';transition:Transition}>|Readonly<{kind:'activity';id:string;parentFrame:number}>}>;
const seedValue=(n:number)=>Number.isSafeInteger(n)?n>>>0:0;
export function createPracticeState(context:Context):PracticeState{return{seed:seedValue(context.seed),replay:context.replay,frame:context.frame,wrongAttempts:0,help:false,box:null,boxReady:false,feedback:null,pendingFromFrame:null,focus:null};}
export function synchronizePracticeState(config:PracticeConfig,state:PracticeState,context:Context):PracticeState{
 if(state.seed!==seedValue(context.seed)||state.replay!==context.replay||(context.frame===1&&state.frame!==1))return createPracticeState(context);
 if(state.frame===context.frame)return state;
 return{...state,frame:context.frame,wrongAttempts:context.frame===config.finalFrame?0:state.wrongAttempts,help:false,box:null,boxReady:false,feedback:null,pendingFromFrame:null,focus:null};
}
function currentProof(running:Running,proof:Proof){const d=running.definition;return proof.id===d.id&&proof.frameDomain===d.frameDomain&&proof.sourceInstanceId===d.sourceInstanceId&&Number.isSafeInteger(proof.revision)&&proof.revision>running.revisionFloor&&proof.status==='completed'&&proof.frame===d.endFrame;}
/** Commit a proposal that has a request only after the host accepts that exact
 * request. A rejected request leaves the previous state untouched. */
export function proposePracticeAction(config:PracticeConfig,stored:PracticeState,context:Context,action:PracticeAction):PracticeProposal|null{
 const state=synchronizePracticeState(config,stored,context),frame=context.frame;
 if(context.paused||!Number.isInteger(frame)||frame<1||frame>config.frameCount||state.pendingFromFrame!==null)return null;
 const index=config.steps.findIndex(s=>s.hold===frame),step=config.steps[index];
 const advance=(transition:Transition,next:PracticeState=state):PracticeProposal=>({state:{...next,help:false,box:null,boxReady:false,feedback:null,pendingFromFrame:frame,focus:null},request:{kind:'frame',transition}});
 switch(action.type){
  case'continue-step':return step&&!step.box&&!state.help&&!state.feedback?advance(step.transition):null;
  case'open-step':{
   if(!step?.box||state.box||state.help||state.feedback||!Number.isSafeInteger(action.revisionFloor)||action.revisionFloor< -1)return null;
   return{state:{...state,box:{definition:step.box,parentFrame:frame,revisionFloor:action.revisionFloor},boxReady:false,focus:'step-opening'},request:{kind:'activity',id:step.box.id,parentFrame:frame}};
  }
  case'close-step':return step?.box&&state.boxReady&&state.box?.parentFrame===frame&&!state.help?advance(step.transition):null;
  case'choose':{
   if(frame!==config.finalFrame||state.help||state.feedback||state.box||!Number.isSafeInteger(action.revisionFloor)||action.revisionFloor< -1)return null;
   const reused=createSixQuestionChoiceState(state.seed,state.replay,1),choice=chooseSixQuestionChoiceAnswer({questions:[{frame,answers:config.answers}],feedback:config.feedback},{...reused,attempts:[state.wrongAttempts]},frame,action.choice,action.revisionFloor);
   if(!choice?.feedback)return null;const definition=config.feedback.find(f=>f.id===choice.feedback!.id)!;
   return{state:{...state,feedback:{definition,parentFrame:frame,revisionFloor:action.revisionFloor,selected:action.choice,kind:definition.kind},focus:'feedback'},request:{kind:'activity',id:definition.id,parentFrame:frame}};
  }
  case'activity-completed':{
   if(state.box&&!state.boxReady&&state.box.parentFrame===frame&&currentProof(state.box,action.proof))return{state:{...state,boxReady:true,focus:'step-close'}};
   if(!state.feedback||state.feedback.parentFrame!==frame||!currentProof(state.feedback,action.proof))return null;
   if(state.feedback.kind==='correct'||state.wrongAttempts===1)return advance(config.finalTransition,{...state,wrongAttempts:0});
   return{state:{...state,wrongAttempts:1,feedback:null,focus:'choice-'+state.feedback.selected}};
  }
  case'open-help':return config.help.availableFrames.includes(frame)&&!state.help&&!state.feedback&&!state.box?{state:{...state,help:true,focus:'help-close'}}:null;
  case'close-help':return state.help?{state:{...state,help:false,focus:'help'}}:null;
 }
}
