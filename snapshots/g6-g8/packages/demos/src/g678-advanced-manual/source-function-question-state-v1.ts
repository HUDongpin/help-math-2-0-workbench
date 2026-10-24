import {createFunctionWalkthroughReducer,type FunctionWalkthroughConfig,type WalkthroughState,type WalkthroughEvent,type WalkthroughPhase,type WalkthroughTransition} from './source-function-walkthrough-state-v1';

export interface FunctionQuestionConfig extends FunctionWalkthroughConfig {readonly ending:'ordinary-wrap'|'source-stop';}
export interface FunctionQuestionState extends Omit<WalkthroughState,'phase'> {readonly phase:WalkthroughPhase|'source-end-held';readonly replay:number;readonly loop:number;}
export type FunctionQuestionEvent=WalkthroughEvent|{readonly type:'wrap-main';readonly epoch:number;readonly boundaryFrame:number};
export interface FunctionQuestionTransition extends Omit<WalkthroughTransition,'state'> {readonly state:FunctionQuestionState;}
export const functionQuestionPlaying=(s:FunctionQuestionState)=>s.mainPlaying||!!s.stepBox?.playing||!!s.feedback?.playing;

/** Source-qualified successor for P059/P060. Keep prior registered reducers
 * frozen. Their shared walkthrough transitions remain the behavioral core. */
export function createFunctionQuestionReducer(B:FunctionQuestionConfig){
 const base=createFunctionWalkthroughReducer(B);
 const initialState=(epoch=0,replay=0):FunctionQuestionState=>({...base.initialState(epoch),replay,loop:0});
 function reduce(s:FunctionQuestionState,e:FunctionQuestionEvent,seed=0):FunctionQuestionTransition{
  const reject=(reason:string):FunctionQuestionTransition=>({accepted:false,reason,state:s,cleanup:[]});
  if(e.epoch!==s.epoch||s.phase==='left')return reject('stale or left page');
  if(e.type==='wrap-main'){
   if(B.ending!=='ordinary-wrap'||e.boundaryFrame!==B.mainLastFrame+1||s.phase!=='main'||s.mainFrame!==B.mainLastFrame||!s.mainPlaying||s.glossaryTerm||s.helpVisible)return reject('ordinary wrap boundary unavailable');
   return{accepted:true,reason:'source ordinary wrap after full final-frame duration',state:{...initialState(s.epoch+1,s.replay),loop:s.loop+1,quizTryCount:s.quizTryCount,selectionSerial:s.selectionSerial,mainPlaying:true},cleanup:['abort-pending-work','retire-page-owned-media','reset-native-stage']};
  }
  if(e.type==='continue-step'&&s.stepBox&&s.stepBox.frame!==1)return reject('enlarged step owns controls until Close');
  const old:WalkthroughState={...s,phase:s.phase==='source-end-held'?'engineering-end-held':s.phase};
  const action=e.type==='play'&&s.phase==='step-held'&&!s.quizSection&&s.stepBox?.frame===1?{type:'continue-step' as const,epoch:s.epoch}:e;
  const r=base.reduce(old,action,seed);if(!r.accepted)return{...r,state:s};
  let state:FunctionQuestionState={...r.state,replay:s.replay,loop:s.loop};
  if(e.type==='replay'||e.type==='leave')state={...state,replay:s.replay+(e.type==='replay'?1:0),loop:0};
  if(e.type==='advance-main'&&state.phase==='engineering-end-held')state=B.ending==='ordinary-wrap'?{...state,phase:'main',mainPlaying:true}:{...state,phase:'source-end-held'};
  return{...r,state,...(state.phase==='source-end-held'?{reason:'authored terminal stop; no lesson completion call'}:{})};
 }
 function glossary(s:FunctionQuestionState){
  const owner=s.helpVisible?B.help.spriteId:s.stepBox&&s.stepBox.frame!==1?s.stepBox.spriteId:B.mainSpriteId;
  const frame=owner===B.mainSpriteId?s.mainFrame:owner===B.help.spriteId?1:s.stepBox!.frame;
  const entries=B.glossary.filter(g=>g.ownerSpriteId===owner&&frame>=g.firstFrame&&frame<=g.lastFrame);
  if(owner===B.mainSpriteId&&s.stepBox?.frame===1)entries.push(...B.glossary.filter(g=>g.ownerSpriteId===s.stepBox!.spriteId&&g.firstFrame<=1));
  return entries;
 }
 return{initialState,reduce,glossary};
}
