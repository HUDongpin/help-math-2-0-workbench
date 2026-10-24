/** The three source-aligned New Problem pools. Flash PRNG identity is not
 * claimed: the existing deterministic LCG supplies repeatable Replay inputs. */
export interface PlaceValuePracticeSpec {readonly poolSize:6|7;readonly initialQuestionFrame:number}
export interface PlaceValuePracticeState {
 readonly seed:number;readonly replay:number;readonly random:number;
 readonly question:number;readonly frame:number;readonly answerOwner:string;
 readonly remaining:readonly number[];readonly totalQuizCount:number;readonly visit:number;
 readonly lastDraws:readonly number[];readonly lastNavigation:'initial-q1-entry'|'q1-reentry'|'different-frame'|'same-frame';
}
function draw(spec:PlaceValuePracticeSpec,random:number,remaining:readonly number[]) {
 const bag=remaining.length?[...remaining]:Array.from({length:spec.poolSize},(_,i)=>i+1);
 const next=(Math.imul(random,1664525)+1013904223)>>>0,index=Math.floor(next/4294967296*bag.length),[question]=bag.splice(index,1);
 return {random:next,remaining:bag,question:question!,frame:spec.initialQuestionFrame+question!-1,answerOwner:'Mc_'+question};
}
export function createPlaceValuePractice(spec:PlaceValuePracticeSpec,seed=0,replay=0):PlaceValuePracticeState {
 const first=draw(spec,seed>>>0,[]);
 return {seed:seed>>>0,replay,...first,totalQuizCount:1,visit:0,lastDraws:[first.question],lastNavigation:'initial-q1-entry'};
}
/** Cross-frame Q1 entry reruns its initializer and consumes one additional
 * draw from a reset pool. Same-frame goto does not re-enter the initializer,
 * as shown by the pinned local AVM1 probe; this is not Adobe acceptance. */
export function advancePlaceValuePractice(spec:PlaceValuePracticeSpec,s:PlaceValuePracticeState,paused=false):PlaceValuePracticeState {
 if(paused)return s;
 const first=draw(spec,s.random,s.remaining),reentry=first.question===1&&s.question!==1;
 const next=reentry?draw(spec,first.random,[]):first;
 return {...s,...next,totalQuizCount:reentry?1:s.totalQuizCount+1,visit:s.visit+1,lastDraws:reentry?[first.question,next.question]:[first.question],lastNavigation:reentry?'q1-reentry':next.question===s.question?'same-frame':'different-frame'};
}
