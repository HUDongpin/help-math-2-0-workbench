import {P047_AUDIO_PLANS} from './generated/nms-l02-p047-audio-plan-v1';
import {P047_FIXED_WINDOWS,P047_WRONG_WINDOWS} from './generated/nms-l02-p047-audio-windows-v1';
import {p047Initial,p047Select,p047Drop,p047Cancel,p047Help,p047Replay,p047FinishPhase,type P047Practice,type P047CardId} from './nms-l02-p047-practice-v1';
export interface P047AudioWindow {readonly domain:'78'|'80'|'81';readonly start:number;readonly end:number;}
export interface P047Clock {readonly state:P047Practice;readonly elapsed:number;readonly anchor:number|null;}
export function p047ClockInitial(seed=0):P047Clock {return Object.freeze({state:p047Initial(seed),elapsed:0,anchor:null});}
export function p047ClockWindow(c:P047Clock):P047AudioWindow|null {
 switch(c.state.phase){
  case 'intro':case 'continuation':case 'correct-feedback':return P047_FIXED_WINDOWS[c.state.phase];
  case 'wrong-feedback':return P047_WRONG_WINDOWS[c.state.wrongBranch];
  default:return null;
 }
}
export function p047ClockDuration(c:P047Clock):number {
 const w=p047ClockWindow(c);if(w)return (w.end-w.start)/P047_AUDIO_PLANS[w.domain].sampleRate;
 // Source sprite76 enters frame2 and executes its completion action at frame25.
 return c.state.phase==='celebration'?23/12:0;
}
function time(now:number){if(!Number.isFinite(now)||now<0)throw Error('P047_CLOCK_TIME');}
/** A phase boundary consumes no time in its successor. The controller must start
 * that successor's actual audio/timeline before advancing it. This prevents a
 * delayed UI tick from skipping feedback, celebration or narration.
 */
export function p047ClockSync(c:P047Clock,now:number,phaseToken:number):P047Clock {
 time(now);if(phaseToken!==c.state.phaseToken||c.anchor===null)return c;
 if(now<c.anchor)throw Error('P047_CLOCK_REVERSED');
 const duration=p047ClockDuration(c),elapsed=c.elapsed+now-c.anchor;
 if(elapsed+1e-9<duration)return Object.freeze({...c,elapsed,anchor:now});
 const state=p047FinishPhase(c.state,phaseToken);
 return Object.freeze({state,elapsed:state===c.state?duration:0,anchor:null});
}
export function p047ClockPlay(c:P047Clock,now:number):P047Clock {
 time(now);return c.anchor!==null||c.state.helpOpen||p047ClockDuration(c)===0?c:Object.freeze({...c,anchor:now});
}
export function p047ClockPause(c:P047Clock,now:number):P047Clock {
 return Object.freeze({...p047ClockSync(c,now,c.state.phaseToken),anchor:null});
}
function change(c:P047Clock,state:P047Practice):P047Clock {
 if(state===c.state)return c;
 return Object.freeze({state,elapsed:state.phaseToken===c.state.phaseToken?c.elapsed:0,anchor:null});
}
export const p047ClockSelect=(c:P047Clock,id:P047CardId)=>change(c,p047Select(c.state,id));
export const p047ClockDrop=(c:P047Clock,tick:number|null)=>change(c,p047Drop(c.state,tick));
export const p047ClockCancel=(c:P047Clock)=>change(c,p047Cancel(c.state));
export const p047ClockHelp=(c:P047Clock,open:boolean)=>change(c,p047Help(c.state,open));
export const p047ClockReplay=(c:P047Clock)=>change(c,p047Replay(c.state));
/** Main frame140 stays visible while practice/feedback/celebration runs. */
export function p047ClockMainFrame(c:P047Clock):number {
 if(c.state.phase==='intro')return Math.min(139,1+Math.floor(c.elapsed*12+1e-9));
 if(c.state.phase==='continuation')return Math.min(188,140+Math.floor(c.elapsed*12+1e-9));
 return c.state.phase==='complete'?188:140;
}
export function p047ClockCelebrationFrame(c:P047Clock):number {
 return c.state.phase==='celebration'?Math.min(25,2+Math.floor(c.elapsed*12+1e-9)):1;
}
/** Resume offsets address prepared PCM, never an encoded MP3 byte range. */
export function p047ClockAudioOffset(c:P047Clock):number|null {
 const w=p047ClockWindow(c);return w?Math.min(w.end,w.start+Math.floor(c.elapsed*P047_AUDIO_PLANS[w.domain].sampleRate+1e-7)):null;
}
