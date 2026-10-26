import {p046Done,p046Initial,p046Enter,p046Input,p046Check,p046CloseFeedback,p046FinishReveal,p046NewWhole,p046Help,p046FinishContinuation,p046Replay,p046SetParts,p046TogglePart,type P046Practice} from './nms-l02-p046-practice-v1';
import type {P046FeedbackTiming} from './nms-l02-p046-audio-windows-v1';
export type {P046FeedbackTiming} from './nms-l02-p046-audio-windows-v1';
export interface P046Clock{readonly state:P046Practice;readonly elapsed:number;readonly anchor:number|null;readonly wrongBranch:number;readonly timing:P046FeedbackTiming;}
/** Audio plans supply feedback durations. Intro/reveal/continuation retain separate source frame boundaries. */
export function p046ClockInitial(seed:number,timing:P046FeedbackTiming):P046Clock{
 if(timing.wrong.length!==4||![timing.correct,...timing.wrong].every(t=>Number.isFinite(t)&&t>0))throw Error('P046_CLOCK_TIMING');
 return Object.freeze({state:p046Initial(seed),elapsed:0,anchor:null,wrongBranch:0,timing:Object.freeze({correct:timing.correct,wrong:Object.freeze([timing.wrong[0],timing.wrong[1],timing.wrong[2],timing.wrong[3]] as const)})});
}
function time(now:number){if(!Number.isFinite(now)||now<0)throw Error('P046_CLOCK_TIME');}
export function p046ClockDuration(c:P046Clock):number{
 switch(c.state.phase){case 'intro':return 653/12;case 'answer-reveal':return (25-2)/12;case 'continuation':return 52/12;case 'correct-feedback':return c.timing.correct;case 'wrong-feedback':return c.timing.wrong[c.wrongBranch];default:return 0;}
}
export function p046ClockSync(c:P046Clock,now:number):P046Clock{
 time(now);if(c.anchor===null)return c;if(now<c.anchor)throw Error('P046_CLOCK_REVERSED');
 const duration=p046ClockDuration(c),raw=c.elapsed+(now-c.anchor);
 const elapsed=raw>=duration-1e-9?duration:raw;
 if(elapsed<duration)return Object.freeze({...c,elapsed,anchor:now});
 let state=c.state;
 if(state.phase==='intro')state=p046Enter(state);else if(state.phase==='answer-reveal')state=p046FinishReveal(state);else if(state.phase==='continuation')state=p046FinishContinuation(state);
 // Audio ending never closes a feedback dialog or consumes time in the next phase.
 return Object.freeze({...c,state,elapsed:state===c.state?elapsed:0,anchor:null});
}
export function p046ClockPlay(c:P046Clock,now:number):P046Clock{
 time(now);return c.anchor!==null||c.state.helpOpen||c.elapsed>=p046ClockDuration(c)?c:Object.freeze({...c,anchor:now});
}
export function p046ClockPause(c:P046Clock,now:number):P046Clock{return Object.freeze({...p046ClockSync(c,now),anchor:null});}
function change(c:P046Clock,state:P046Practice):P046Clock{return state===c.state?c:Object.freeze({...c,state,elapsed:0,anchor:null});}
export const p046ClockInput=(c:P046Clock,field:'numerator'|'denominator',value:string)=>change(c,p046Input(c.state,field,value));
export const p046ClockNew=(c:P046Clock)=>change(c,p046NewWhole(c.state));
export const p046ClockHelp=(c:P046Clock,open:boolean)=>change(c,p046Help(c.state,open));
export const p046ClockClose=(c:P046Clock)=>change(c,p046CloseFeedback(c.state));
export function p046ClockCheck(c:P046Clock):P046Clock{
 const state=p046Check(c.state);if(state===c.state)return c;
 return Object.freeze({...change(c,state),wrongBranch:(c.state.seed+c.state.questionIndex*2+c.state.attempts)%4});
}
export function p046ClockReplay(c:P046Clock):P046Clock{return Object.freeze({...change(c,p046Replay(c.state)),wrongBranch:0});}
export function p046ClockMainFrame(c:P046Clock):number{
 if(c.state.phase==='intro')return Math.min(653,Math.floor(c.elapsed*12+1e-9)+1);
 if(c.state.phase==='continuation')return Math.min(706,654+Math.floor(c.elapsed*12+1e-9));
 return c.state.phase==='complete'?706:654;
}

export const p046ClockParts=(c:P046Clock,parts:number)=>change(c,p046SetParts(c.state,parts));
export const p046ClockToggle=(c:P046Clock,part:number)=>change(c,p046TogglePart(c.state,part));

export const p046ClockDone=(c:P046Clock)=>change(c,p046Done(c.state));
