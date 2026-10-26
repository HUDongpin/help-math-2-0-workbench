import {p045Initial,p045Enter,p045Input,p045Check,p045CloseFeedback,p045FinishReveal,p045NewWhole,p045Help,p045FinishContinuation,p045Replay,type P045Practice} from './nms-l02-p045-practice-v1';
export interface P045FeedbackTiming{readonly correct:number;readonly wrong:readonly [number,number,number,number];}
export interface P045Clock{readonly state:P045Practice;readonly elapsed:number;readonly anchor:number|null;readonly wrongBranch:number;readonly timing:P045FeedbackTiming;}
/** Audio plans supply feedback durations. Intro/reveal/continuation retain separate source frame boundaries. */
export function p045ClockInitial(seed:number,timing:P045FeedbackTiming):P045Clock{
 if(timing.wrong.length!==4||![timing.correct,...timing.wrong].every(t=>Number.isFinite(t)&&t>0))throw Error('P045_CLOCK_TIMING');
 return Object.freeze({state:p045Initial(seed),elapsed:0,anchor:null,wrongBranch:0,timing:Object.freeze({correct:timing.correct,wrong:Object.freeze([timing.wrong[0],timing.wrong[1],timing.wrong[2],timing.wrong[3]] as const)})});
}
function time(now:number){if(!Number.isFinite(now)||now<0)throw Error('P045_CLOCK_TIME');}
export function p045ClockDuration(c:P045Clock):number{
 switch(c.state.phase){case 'intro':return 449/12;case 'answer-reveal':return (25-2)/12;case 'continuation':return 48/12;case 'correct-feedback':return c.timing.correct;case 'wrong-feedback':return c.timing.wrong[c.wrongBranch];default:return 0;}
}
export function p045ClockSync(c:P045Clock,now:number):P045Clock{
 time(now);if(c.anchor===null)return c;if(now<c.anchor)throw Error('P045_CLOCK_REVERSED');
 const duration=p045ClockDuration(c),raw=c.elapsed+(now-c.anchor);
 const elapsed=raw>=duration-1e-9?duration:raw;
 if(elapsed<duration)return Object.freeze({...c,elapsed,anchor:now});
 let state=c.state;
 if(state.phase==='intro')state=p045Enter(state);else if(state.phase==='answer-reveal')state=p045FinishReveal(state);else if(state.phase==='continuation')state=p045FinishContinuation(state);
 // Audio ending never closes a feedback dialog or consumes time in the next phase.
 return Object.freeze({...c,state,elapsed:state===c.state?elapsed:0,anchor:null});
}
export function p045ClockPlay(c:P045Clock,now:number):P045Clock{
 time(now);return c.anchor!==null||c.state.helpOpen||c.elapsed>=p045ClockDuration(c)?c:Object.freeze({...c,anchor:now});
}
export function p045ClockPause(c:P045Clock,now:number):P045Clock{return Object.freeze({...p045ClockSync(c,now),anchor:null});}
function change(c:P045Clock,state:P045Practice):P045Clock{return state===c.state?c:Object.freeze({...c,state,elapsed:0,anchor:null});}
export const p045ClockInput=(c:P045Clock,field:'numerator'|'denominator',value:string)=>change(c,p045Input(c.state,field,value));
export const p045ClockNew=(c:P045Clock)=>change(c,p045NewWhole(c.state));
export const p045ClockHelp=(c:P045Clock,open:boolean)=>change(c,p045Help(c.state,open));
export const p045ClockClose=(c:P045Clock)=>change(c,p045CloseFeedback(c.state));
export function p045ClockCheck(c:P045Clock):P045Clock{
 const state=p045Check(c.state);if(state===c.state)return c;
 return Object.freeze({...change(c,state),wrongBranch:(c.state.seed+c.state.questionIndex*2+c.state.attempts)%4});
}
export function p045ClockReplay(c:P045Clock):P045Clock{return Object.freeze({...change(c,p045Replay(c.state)),wrongBranch:0});}
export function p045ClockMainFrame(c:P045Clock):number{
 if(c.state.phase==='intro')return Math.min(449,Math.floor(c.elapsed*12+1e-9)+1);
 if(c.state.phase==='continuation')return Math.min(498,450+Math.floor(c.elapsed*12+1e-9));
 return c.state.phase==='complete'?498:450;
}
