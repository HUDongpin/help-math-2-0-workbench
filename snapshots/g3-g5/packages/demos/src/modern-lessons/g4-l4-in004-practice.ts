import {createIn004Question,drawIn004Question,reduceIn004Question,type In004State,type In004Action,type In004Effect,type In004QuestionId} from './g4-l4-in004-state';

export interface In004PracticeState extends In004State {
 readonly remaining:readonly In004QuestionId[];
 /** Function selections, including a Q1 selection superseded by its initializer. */
 readonly lastDraws:readonly In004QuestionId[];
 readonly lastNavigation:'initial-q1-entry'|'different-frame'|'q1-reentry'|'same-frame';
}
/** Source doGetRandomQuiz uses Flash random(). The existing deterministic LCG
 * supports replay tests; its sequence is not claimed to match Flash's PRNG.
 * Dynamic same-frame goto does not rerun actions in the pinned local Ruffle
 * diagnostic. Cross-frame Q1 entry executes its authored reset and draws again.
 * This is a maintained source-informed implementation, not Adobe acceptance. */
export function createIn004Practice(seed=0,replay=0):In004PracticeState {
 const draw=drawIn004Question({random:seed>>>0,remaining:[]});
 return {...createIn004Question(draw.question,seed,replay,0),random:draw.random,remaining:draw.remaining,lastDraws:[draw.question],lastNavigation:'initial-q1-entry'};
}
export function advanceIn004Practice(s:In004PracticeState,paused=false):In004PracticeState {
 if(paused||!s.newProblemEnabled)return s;
 const first=drawIn004Question(s),reentersQ1=first.question==='Q1'&&s.question!=='Q1';
 // Entering Q1 resets both authored arrays before its additional draw. Going
 // from Q1 to Q1 does not invoke that initializer for a second time.
 const draw=reentersQ1?drawIn004Question({random:first.random,remaining:[]}):first;
 const sameFrame=!reentersQ1&&draw.question===s.question;
 const base=sameFrame?{...s,count:0,answer:'',selected:null,finalToken:null,newProblemEnabled:false,visit:s.visit+1}:createIn004Question(draw.question,s.seed,s.replay,s.visit+1);
 // The authored wrong-feedback child persists across ordinary question frames;
 // only Q1's initializer explicitly hides it. The parent placed marker persists.
 // A same-frame draw does not recreate disabled/placed arrows or rerun target
 // visibility actions. Preserve this source edge case; Replay is independent.
 return {...base,wrongOpen:reentersQ1?false:s.wrongOpen,placedMarker:s.placedMarker,random:draw.random,remaining:draw.remaining,lastDraws:reentersQ1?[first.question,draw.question]:[first.question],lastNavigation:reentersQ1?'q1-reentry':sameFrame?'same-frame':'different-frame'};
}
export type In004PracticeAction=In004Action|{type:'new-problem'};
export function reduceIn004Practice(s:In004PracticeState,a:In004PracticeAction,paused=false):{state:In004PracticeState;effects:readonly In004Effect[]}{
 if(a.type==='new-problem')return {state:advanceIn004Practice(s,paused),effects:[]};
 const result=reduceIn004Question(s,a,paused);
 return {state:result.state===s?s:{...s,...result.state},effects:result.effects};
}
