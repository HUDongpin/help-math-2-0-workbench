import {p048Initial,p048Reduce,type P048State,type P048Event} from './nms-l02-p048-practice-v1';
/** Native sample coordinates from source-audio-clock-audit-v1.json.
 * Full-stream PCM transport is separate; wrong feedback closes by user action.
 */
export const P048_TIMING = {rate:22050,practiceSample:604538,terminalSample:665175,fullEndSample:666597} as const;
export interface P048Clock {readonly state:P048State;readonly elapsed:number;readonly anchor:number|null;}
export function p048ClockInitial(seed=0):P048Clock{return {state:p048Initial(seed),elapsed:0,anchor:null};}
export function p048ClockDuration(c:P048Clock):number {
 switch(c.state.phase){
  case 'intro':return P048_TIMING.practiceSample/P048_TIMING.rate;
  case 'continuation':return (P048_TIMING.fullEndSample-P048_TIMING.practiceSample)/P048_TIMING.rate;
  // Source sprites448/450 start at frame2 and finish at25.
  case 'correct-feedback':case 'reveal':return 23/12;
  default:return 0;
 }
}
function time(now:number){if(!Number.isFinite(now)||now<0)throw Error('P048_CLOCK_TIME');}
export function p048ClockSync(c:P048Clock,now:number,token=c.state.token):P048Clock {
 time(now);if(c.anchor===null||token!==c.state.token)return c;
 if(now<c.anchor)throw Error('P048_CLOCK_REVERSED');
 const elapsed=c.elapsed+now-c.anchor,duration=p048ClockDuration(c);
 if(elapsed+1e-9<duration)return {...c,elapsed,anchor:now};
 const state=p048Reduce(c.state,{type:c.state.phase==='intro'?'intro-finished':'phase-finished',token});
 // Discard excess time: successor audio must actually start before its clock.
 return {state,elapsed:state===c.state?duration:0,anchor:null};
}
export function p048ClockPlay(c:P048Clock,now:number):P048Clock {
 time(now);return c.anchor!==null||c.state.helpOpen||!p048ClockDuration(c)?c:{...c,anchor:now};
}
export function p048ClockPause(c:P048Clock,now:number):P048Clock {return {...p048ClockSync(c,now),anchor:null};}
export function p048ClockEvent(c:P048Clock,e:P048Event,now:number):P048Clock {
 const paused=p048ClockPause(c,now),state=p048Reduce(paused.state,e);
 return {state,elapsed:state.token===paused.state.token?paused.elapsed:0,anchor:null};
}
export function p048ClockMainFrame(c:P048Clock):number {
 if(c.state.phase==='intro')return Math.min(329,1+Math.floor(c.elapsed*12+1e-9));
 if(c.state.phase==='continuation')return Math.min(363,1+Math.floor((P048_TIMING.practiceSample+c.elapsed*P048_TIMING.rate)*12/P048_TIMING.rate+1e-9));
 return c.state.phase==='complete'?363:330;
}
export function p048ClockCompletionFrame(c:P048Clock):number {
 return c.state.phase==='correct-feedback'||c.state.phase==='reveal'?Math.min(25,2+Math.floor(c.elapsed*12+1e-9)):1;
}
