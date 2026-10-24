import {ALG_L07_P058_SOURCE as S,type P058Term} from './alg-l07-p058-source-v1';
import {createFunctionWalkthroughReducer,type WalkthroughState,type WalkthroughEvent,type WalkthroughChoice,type WalkthroughTransition} from './g678-advanced-manual/source-function-walkthrough-state-v1';
export {S as ALG_L07_P058_SOURCE};
export type {P058Term,WalkthroughChoice as P058Choice};
export interface P058State extends WalkthroughState {readonly replay:number;readonly loop:number;}
export type P058Event=WalkthroughEvent|{readonly type:'wrap-main';readonly epoch:number;readonly boundaryFrame:823};
export interface P058Transition extends Omit<WalkthroughTransition,'state'>{readonly state:P058State;}
const base=createFunctionWalkthroughReducer(S.behavior);
export const p058InitialState=(epoch=0,replay=0):P058State=>({...base.initialState(epoch),replay,loop:0});
export const p058Playing=(s:P058State)=>s.mainPlaying||!!s.stepBox?.playing||!!s.feedback?.playing;
export function p058Glossary(s:P058State){
 const owner=s.helpVisible?295:s.stepBox&&s.stepBox.frame!==1?s.stepBox.spriteId:311;
 const frame=owner===311?s.mainFrame:owner===295?1:s.stepBox!.frame;
 const entries=S.behavior.glossary.filter(g=>g.ownerSpriteId===owner&&frame>=g.firstFrame&&frame<=g.lastFrame);
 // The retained miniature helper has its own linked terms after Close returns1.
 if(owner===311&&s.stepBox?.frame===1)entries.push(...S.behavior.glossary.filter(g=>g.ownerSpriteId===s.stepBox!.spriteId&&g.firstFrame<=1));
 return entries.map(g=>({...g,term:S.terms.find(t=>t.sourceKeyAttribute.toLowerCase()===g.key.toLowerCase())!.sourceKeyAttribute}));
}
/** Reuse the source-audited walkthrough transitions. This page's source has no
 * terminal stop, so822 is displayed for one complete frame and823 wraps to1.
 * The family reducer's historical engineering end hold is not source behavior. */
export function p058Reduce(s:P058State,e:P058Event,seed=0):P058Transition{
 const reject=(reason:string):P058Transition=>({accepted:false,reason,state:s,cleanup:[]});
 if(e.epoch!==s.epoch||s.phase==='left')return reject('stale or left page');
 if(e.type==='wrap-main'){
  if(e.boundaryFrame!==823||s.phase!=='main'||s.mainFrame!==822||!s.mainPlaying||s.glossaryTerm||s.helpVisible)return reject('ordinary wrap boundary unavailable');
  return{accepted:true,reason:'source ordinary timeline wrap after full822 duration',state:{...p058InitialState(s.epoch+1,s.replay),loop:s.loop+1,quizTryCount:s.quizTryCount,selectionSerial:s.selectionSerial,mainPlaying:true},cleanup:['abort-pending-work','retire-page-owned-media','reset-native-stage']};
 }
 if(e.type==='continue-step'&&s.stepBox&&s.stepBox.frame!==1)return reject('enlarged step owns controls until Close');
 if(e.type==='play'&&s.phase==='step-held'&&!s.quizSection&&s.stepBox?.frame===1){
  const r=base.reduce(s,{type:'continue-step',epoch:s.epoch},seed);return{...r,state:{...r.state,replay:s.replay,loop:s.loop}};
 }
 const r=base.reduce(s,e,seed);if(!r.accepted)return{...r,state:s};
 let next:P058State={...r.state,replay:s.replay,loop:s.loop};
 if(e.type==='replay'||e.type==='leave')next={...next,replay:s.replay+(e.type==='replay'?1:0),loop:0};
 if(e.type==='advance-main'&&next.phase==='engineering-end-held')next={...next,phase:'main',mainPlaying:true};
 return{...r,state:next};
}
