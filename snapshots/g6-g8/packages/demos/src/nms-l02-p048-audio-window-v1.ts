import {P048_FIXED_WINDOWS,P048_WRONG_WINDOWS} from './generated/nms-l02-p048-audio-windows-v1';
import type {P048Phase} from './nms-l02-p048-practice-v1';
export interface P048AudioWindow {readonly domain:'498'|'442'|'444'|'8'|'413'|'436';readonly start:number;readonly end:number;}
/** Wrong branch chosen by the controller once per submission, not per render. */
export function p048AudioWindow(phase:P048Phase,wrongBranch=0):P048AudioWindow|null {
 if(phase==='intro'||phase==='continuation'||phase==='correct-feedback')return P048_FIXED_WINDOWS[phase];
 if(phase==='wrong-feedback'){
  if(!Number.isInteger(wrongBranch)||wrongBranch<0||wrongBranch>=4)throw Error('P048_AUDIO_BRANCH');
  return P048_WRONG_WINDOWS[wrongBranch]!;
 }
 return null;
}
/** Offset into already prepared PCM. Pauses retain elapsed seconds; never slice MP3 bytes. */
export function p048WindowOffset(window:P048AudioWindow,elapsed:number):number {
 if(!Number.isFinite(elapsed)||elapsed<0)throw Error('P048_AUDIO_ELAPSED');
 return Math.min(window.end,window.start+Math.floor(elapsed*22050+1e-7));
}
