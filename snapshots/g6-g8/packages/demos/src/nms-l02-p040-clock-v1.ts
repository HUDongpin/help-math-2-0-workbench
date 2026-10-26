import {p040Initial,p040OpenTerm,p040CloseTerm,p040Replay,type P040State,type P040Term} from './nms-l02-p040-state-v1';
export interface P040Clock {readonly state:P040State;readonly elapsed:number;readonly anchor:number|null}
const duration=440/12;
export const p040ClockInitial=():P040Clock=>Object.freeze({state:p040Initial(),elapsed:0,anchor:null});
function time(value:number){if(!Number.isFinite(value)||value<0)throw Error('P040_CLOCK_TIME');}
export function p040ClockSync(c:P040Clock,now:number):P040Clock{
 time(now);if(c.anchor===null)return c;if(now<c.anchor)throw Error('P040_CLOCK_REVERSED');
 const elapsed=Math.min(duration,c.elapsed+now-c.anchor),completed=elapsed>=duration;
 const state=Object.freeze({...c.state,frame:Math.min(440,Math.floor(elapsed*12+1e-9)+1),playing:!completed,completed});
 return Object.freeze({state,elapsed,anchor:completed?null:now});
}
export function p040ClockPlay(c:P040Clock,now:number):P040Clock{time(now);return c.state.term||c.state.completed||c.anchor!==null?c:Object.freeze({...c,state:Object.freeze({...c.state,playing:true}),anchor:now});}
export function p040ClockPause(c:P040Clock,now:number):P040Clock{const current=p040ClockSync(c,now);return Object.freeze({...current,anchor:null,state:Object.freeze({...current.state,playing:false})});}
export function p040ClockOpenTerm(c:P040Clock,term:P040Term,now:number):P040Clock{
 const current=p040ClockSync(c,now),state=p040OpenTerm(current.state,term);return state===current.state?current:Object.freeze({...current,state,anchor:null});
}
export function p040ClockCloseTerm(c:P040Clock):P040Clock{return Object.freeze({...c,state:p040CloseTerm(c.state)});}
export function p040ClockReplay(c:P040Clock):P040Clock{return Object.freeze({state:p040Replay(c.state),elapsed:0,anchor:null});}
