import {P049_AUDIO_PLANS} from './generated/nms-l02-p049-audio-plan-v1';
import {P049_QUESTION_STOPS,p049OutroStart,type P049State} from './nms-l02-p049-practice-v1';
import type {P049AudioDomain} from './nms-l02-p049-audio-pcm-v1';
export interface P049Window {readonly domain:P049AudioDomain;readonly start:number;readonly end:number;readonly mainFrame:number;}
/** Seek inside prepared PCM; reject unbound windows before I/O or context allocation. */
export function p049WindowOffset(window:P049Window,elapsed:number):number {
 if(!Number.isFinite(elapsed)||elapsed<0)throw Error('P049_AUDIO_ELAPSED');
 if(!Object.hasOwn(P049_AUDIO_PLANS,window.domain)||!Number.isSafeInteger(window.start)||!Number.isSafeInteger(window.end)
   ||window.start<0||window.end<=window.start||window.end>P049_AUDIO_PLANS[window.domain].totalSamples)throw Error('P049_WINDOW');
 return Math.min(window.end,window.start+Math.floor(elapsed*22050+1e-7));
}
/** Nearest sample with ties to even, matching the source-clock preparation audit. */
export function p049FrameSample(frame:number):number {
 const x=(frame-1)*22050/12,lo=Math.floor(x);
 return x-lo===.5 ? lo+(lo%2) : Math.round(x);
}
export function p049PhaseWindow(s:P049State,wrongBranch=0):P049Window|null {
 const stop=P049_QUESTION_STOPS[s.question];
 switch(s.phase){
  case 'intro':return {domain:'156',start:0,end:p049FrameSample(327),mainFrame:1};
  // Resume from the paused sample. The next visual tick advances to stop+1.
  case 'answer-transition':return {domain:'156',start:p049FrameSample(stop),end:p049FrameSample(s.question===2?385:P049_QUESTION_STOPS[s.question+1]!),mainFrame:stop};
  case 'outro': {const frame=p049OutroStart(s);return {domain:'156',start:p049FrameSample(frame),end:p049FrameSample(435),mainFrame:frame};}
  case 'correct-feedback': {const domain=(['72','143','153'] as const)[s.question];return {domain,start:p049FrameSample(2),end:P049_AUDIO_PLANS[domain].totalSamples,mainFrame:stop};}
  case 'wrong-feedback': {
   if(!Number.isInteger(wrongBranch)||wrongBranch<0||wrongBranch>3)throw Error('P049_AUDIO_BRANCH');
   // S1 return tail is silent; other branches retain audio through the next branch boundary.
   const starts=[3,18,31,40],ends=[16,31,40];
   return {domain:'74',start:p049FrameSample(starts[wrongBranch]!),end:wrongBranch===3?P049_AUDIO_PLANS['74'].totalSamples:p049FrameSample(ends[wrongBranch]!),mainFrame:stop};
  }
  default:return null;
 }
}
