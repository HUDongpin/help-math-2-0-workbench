import type {AnimationRendererProps, RuntimeContext} from '../contract';
import {advancePlaceValuePractice, createPlaceValuePractice, type PlaceValuePracticeSpec, type PlaceValuePracticeState} from './g4-l4-place-value-practice-state';
export interface PracticeHostSpec extends PlaceValuePracticeSpec {readonly frameDomain:string; readonly frameCount:number}
export interface PracticeSession {
 readonly seed:number; readonly replay:number; readonly practice:PlaceValuePracticeState|null;
 readonly pendingFrame:Readonly<{from:number;to:number}>|null;
}
export const createPracticeSession=(seed=0,replay=0):PracticeSession=>({seed:seed>>>0,replay,practice:null,pendingFrame:null});
export function practiceFrameControl(c:PracticeHostSpec){
 const frames=Array.from({length:c.poolSize},(_,i)=>c.initialQuestionFrame+i);
 return {frameDomain:c.frameDomain,completionFrame:c.frameCount,transitions:frames.flatMap(fromFrame=>frames.map(toFrame=>({fromFrame,toFrame,stopFrame:toFrame})))};
}
/** Only an accepted source seek may preserve the random pool across frames.
 * Replay, a changed seed/domain, or an unrelated seek starts a fresh session. */
export function synchronizePracticeSession(c:PracticeHostSpec,s:PracticeSession,r:RuntimeContext):PracticeSession {
 const reset=()=>s.practice||s.pendingFrame||s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0)?createPracticeSession(r.seed,r.replay??0):s;
 if(s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0)||(r.frameDomain??c.frameDomain)!==c.frameDomain)return reset();
 if(s.pendingFrame&&r.frame===s.pendingFrame.from)return s;
 if(!s.practice)return s;
 if(r.frame!==s.practice.frame)return reset();
 return s.pendingFrame?{...s,pendingFrame:null}:s;
}
/** Both the Q1 initializer and New Problem commit only after My Lesson accepts
 * the exact authored frame edge. No timer or independent teaching clock. */
export function dispatchPractice(c:PracticeHostSpec,s:PracticeSession,action:'enter'|'new-problem',r:AnimationRendererProps):PracticeSession {
 if(r.lang!=='en'||r.scenario!=='source-static-frame'||r.entryStateSha256||r.paused
  ||(r.frameDomain??c.frameDomain)!==c.frameDomain||(r.rootFrame??6)!==6
  ||s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0)||(s.pendingFrame&&r.frame!==s.pendingFrame.to))return s;
 let next:PlaceValuePracticeState;
 if(action==='enter'){
  if(s.practice||r.frame!==c.initialQuestionFrame)return s;
  next=createPlaceValuePractice(c,s.seed,s.replay);
 }else{
  if(!s.practice||r.frame!==s.practice.frame)return s;
  next=advancePlaceValuePractice(c,s.practice);
 }
 if(r.onLessonFrameRequest?.({fromFrame:r.frame,toFrame:next.frame,stopFrame:next.frame})!==true)return s;
 return {...s,practice:next,pendingFrame:next.frame===r.frame?null:{from:r.frame,to:next.frame}};
}
