import {p049Initial,p049Reduce,P049_QUESTION_STOPS,type P049State,type P049Event} from './nms-l02-p049-practice-v1';
import {p049PhaseWindow} from './nms-l02-p049-audio-window-v1';
export interface P049Clock {readonly state:P049State;readonly elapsed:number;readonly anchor:number|null;readonly wrongBranch:number;}
export function p049ClockInitial():P049Clock{return {state:p049Initial(),elapsed:0,anchor:null,wrongBranch:0};}
export function p049ClockDuration(c:P049Clock):number {const w=p049PhaseWindow(c.state,c.wrongBranch);return w?(w.end-w.start)/22050:0;}
function time(now:number){if(!Number.isFinite(now)||now<0)throw Error('P049_CLOCK_TIME');}
export function p049ClockSync(c:P049Clock,now:number,token=c.state.token):P049Clock{
 time(now);if(c.anchor===null||token!==c.state.token)return c;
 if(now<c.anchor)throw Error('P049_CLOCK_REVERSED');
 const elapsed=c.elapsed+now-c.anchor,duration=p049ClockDuration(c);
 if(elapsed+1e-9<duration)return {...c,elapsed,anchor:now};
 const state=p049Reduce(c.state,{type:'phase-finished',token});
 // Never spend late callback time in a successor whose audio has not started.
 return {...c,state,elapsed:state===c.state?duration:0,anchor:null};
}
export function p049ClockPlay(c:P049Clock,now:number):P049Clock{
 time(now);const duration=p049ClockDuration(c);
 return c.anchor!==null||c.state.helpOpen||duration<=c.elapsed?c:{...c,anchor:now};
}
export function p049ClockPause(c:P049Clock,now:number):P049Clock{return {...p049ClockSync(c,now),anchor:null};}
export function p049ClockEvent(c:P049Clock,e:P049Event,now:number,wrongBranch=0):P049Clock{
 const paused=p049ClockPause(c,now),state=p049Reduce(paused.state,e);
 const branch=state.phase==='wrong-feedback'&&state.token!==paused.state.token?wrongBranch:paused.wrongBranch;
 if(!Number.isInteger(branch)||branch<0||branch>3)throw Error('P049_AUDIO_BRANCH');
 return {state,elapsed:state.token===paused.state.token?paused.elapsed:0,anchor:null,wrongBranch:e.type==='replay'?0:branch};
}
export function p049ClockMainFrame(c:P049Clock):number{
 if(c.state.phase==='complete')return 435;
 const w=p049PhaseWindow(c.state,c.wrongBranch);
 if(!w||w.domain!=='156')return P049_QUESTION_STOPS[c.state.question];
 return Math.min(435,w.mainFrame+Math.floor(c.elapsed*12+1e-7));
}
