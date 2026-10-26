import {P045_FIXED_WINDOWS,P045_WRONG_WINDOWS} from './generated/nms-l02-p045-audio-windows-v1';
import {P045_AUDIO_PLANS} from './generated/nms-l02-p045-audio-plan-v1';
import type {P045AudioDomain} from './nms-l02-p045-audio-pcm-v1';
import type {P045FeedbackTiming} from './nms-l02-p045-clock-v1';
export interface P045AudioWindow{readonly domain:P045AudioDomain;readonly start:number;readonly end:number;}
const seconds=(w:P045AudioWindow)=>(w.end-w.start)/P045_AUDIO_PLANS[w.domain].sampleRate;
export const P045_SOURCE_FEEDBACK_TIMING:P045FeedbackTiming=Object.freeze({correct:seconds(P045_FIXED_WINDOWS['correct-feedback']),wrong:Object.freeze([seconds(P045_WRONG_WINDOWS[0]),seconds(P045_WRONG_WINDOWS[1]),seconds(P045_WRONG_WINDOWS[2]),seconds(P045_WRONG_WINDOWS[3])]as const)});
export function p045WrongWindow(branch:number):P045AudioWindow{
 if(!Number.isInteger(branch)||branch<0||branch>3)throw Error('P045_WRONG_BRANCH');return P045_WRONG_WINDOWS[branch];
}
/** Source windows apply only to fully prepared PCM; encoded MP3 input is never accepted here. */
export function p045WindowPcm(prepared:Float32Array,window:P045AudioWindow):Float32Array{
 if(!Object.hasOwn(P045_AUDIO_PLANS,window.domain)||prepared.length!==P045_AUDIO_PLANS[window.domain].totalSamples||!Number.isInteger(window.start)||!Number.isInteger(window.end)||window.start<0||window.end<=window.start||window.end>prepared.length)throw Error('P045_PCM_WINDOW');
 return prepared.slice(window.start,window.end);
}
export {P045_FIXED_WINDOWS};
