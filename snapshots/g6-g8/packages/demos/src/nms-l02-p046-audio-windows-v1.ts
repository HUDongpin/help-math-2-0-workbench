import {P046_FIXED_WINDOWS,P046_WRONG_WINDOWS} from './generated/nms-l02-p046-audio-windows-v1';
import {P046_AUDIO_PLANS} from './generated/nms-l02-p046-audio-plan-v1';
import type {P046AudioDomain} from './nms-l02-p046-audio-pcm-v1';
export interface P046FeedbackTiming {readonly correct:number;readonly wrong:readonly [number,number,number,number];}
export interface P046AudioWindow{readonly domain:P046AudioDomain;readonly start:number;readonly end:number;}
const seconds=(w:P046AudioWindow)=>(w.end-w.start)/P046_AUDIO_PLANS[w.domain].sampleRate;
export const P046_SOURCE_FEEDBACK_TIMING:P046FeedbackTiming=Object.freeze({correct:seconds(P046_FIXED_WINDOWS['correct-feedback']),wrong:Object.freeze([seconds(P046_WRONG_WINDOWS[0]),seconds(P046_WRONG_WINDOWS[1]),seconds(P046_WRONG_WINDOWS[2]),seconds(P046_WRONG_WINDOWS[3])]as const)});
export function p046WrongWindow(branch:number):P046AudioWindow{
 if(!Number.isInteger(branch)||branch<0||branch>3)throw Error('P046_WRONG_BRANCH');return P046_WRONG_WINDOWS[branch];
}
/** Source windows apply only to fully prepared PCM; encoded MP3 input is never accepted here. */
export function p046WindowPcm(prepared:Float32Array,window:P046AudioWindow):Float32Array{
 if(!Object.hasOwn(P046_AUDIO_PLANS,window.domain)||prepared.length!==P046_AUDIO_PLANS[window.domain].totalSamples||!Number.isInteger(window.start)||!Number.isInteger(window.end)||window.start<0||window.end<=window.start||window.end>prepared.length)throw Error('P046_PCM_WINDOW');
 return prepared.slice(window.start,window.end);
}
export {P046_FIXED_WINDOWS};
