import {P044_AUDIO_PLANS} from './generated/nms-l02-p044-audio-plan-v1';
import {p044WrongWindow,type P044AudioDomain} from './nms-l02-p044-audio-pcm-v1';
import {p044Initial,p044Enter,p044SetParts,p044TogglePart,p044Check,p044CloseWrong,p044CloseCorrect,p044FinishReveal,p044NewWhole,p044Help,p044FinishContinuation,p044Replay,type P044Practice} from './nms-l02-p044-practice-v1';
export interface P044Clock {readonly state:P044Practice;readonly elapsed:number;readonly anchor:number|null;readonly wrongBranch:number;}
export function p044ClockInitial(seed=0):P044Clock{return Object.freeze({state:p044Initial(seed),elapsed:0,anchor:null,wrongBranch:0});}
function time(now:number){if(!Number.isFinite(now)||now<0)throw Error('P044_CLOCK_TIME');}
export function p044ClockDomain(clock:P044Clock):P044AudioDomain|null {
  switch(clock.state.phase){case 'intro':return '243';case 'correct-feedback':return '240';case 'wrong-feedback':case 'answer-reveal':return '242';default:return null;}
}
export function p044ClockDuration(clock:P044Clock):number {
  if(clock.state.phase==='continuation')return 32/12;
  const domain=p044ClockDomain(clock);if(!domain)return 0;
  if(domain==='242'){const w=p044WrongWindow(clock.wrongBranch);return Math.max((w.end-w.start)/22050,clock.state.phase==='answer-reveal'?24/12:0);}
  return P044_AUDIO_PLANS[domain].totalSamples/P044_AUDIO_PLANS[domain].sampleRate;
}
export function p044ClockSync(clock:P044Clock,now:number):P044Clock {
  time(now);if(clock.anchor===null)return clock;if(now<clock.anchor)throw Error('P044_CLOCK_REVERSED');
  const duration=p044ClockDuration(clock),elapsed=Math.min(duration,clock.elapsed+now-clock.anchor);
  if(elapsed<duration)return Object.freeze({...clock,elapsed,anchor:now});
  let state=clock.state;
  if(state.phase==='intro')state=p044Enter(state);
  else if(state.phase==='answer-reveal')state=p044FinishReveal(state);
  else if(state.phase==='continuation')state=p044FinishContinuation(state);
  // Wrong and correct dialogs stay open after media ends, until explicit Close.
  return Object.freeze({...clock,state,elapsed:state===clock.state?elapsed:0,anchor:null});
}
export function p044ClockPlay(clock:P044Clock,now:number):P044Clock {
  time(now);return clock.anchor!==null||clock.state.helpOpen||clock.elapsed>=p044ClockDuration(clock)?clock:Object.freeze({...clock,anchor:now});
}
export function p044ClockPause(clock:P044Clock,now:number):P044Clock{return Object.freeze({...p044ClockSync(clock,now),anchor:null});}
function change(clock:P044Clock,state:P044Practice):P044Clock {
  return state===clock.state?clock:Object.freeze({...clock,state,elapsed:0,anchor:null});
}
export const p044ClockParts=(c:P044Clock,parts:number)=>change(c,p044SetParts(c.state,parts));
export const p044ClockToggle=(c:P044Clock,part:number)=>change(c,p044TogglePart(c.state,part));
export const p044ClockNew=(c:P044Clock)=>change(c,p044NewWhole(c.state));
export const p044ClockHelp=(c:P044Clock,open:boolean)=>change(c,p044Help(c.state,open));
export function p044ClockCheck(c:P044Clock):P044Clock {
  const state=p044Check(c.state);if(state===c.state)return c;
  // Independent deterministic native feedback selector, not original RNG parity.
  const wrongBranch=(c.state.seed+c.state.questionIndex*2+c.state.attempts)%4;
  return Object.freeze({...change(c,state),wrongBranch});
}
export function p044ClockClose(c:P044Clock):P044Clock {
  return change(c,c.state.phase==='wrong-feedback'?p044CloseWrong(c.state):p044CloseCorrect(c.state));
}
export function p044ClockReplay(c:P044Clock):P044Clock {return Object.freeze({...change(c,p044Replay(c.state)),wrongBranch:0});}
export function p044ClockMainFrame(c:P044Clock):number {
  if(c.state.phase==='intro')return Math.min(361,Math.floor(c.elapsed*12+1e-9)+1);
  if(c.state.phase==='continuation')return Math.min(393,361+Math.floor(c.elapsed*12+1e-9));
  return c.state.phase==='complete'?393:361;
}
