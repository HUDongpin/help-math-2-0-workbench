import {P040_SOURCE} from './generated/nms-l02-p040-presentation-v1';
export type P040Term='percent'|'equivalent'|'fraction'|'denominator';
export interface P040State {readonly frame:number;readonly playing:boolean;readonly term:P040Term|null;readonly replay:number;readonly completed:boolean}
export const p040Initial=():P040State=>Object.freeze({frame:1,playing:false,term:null,replay:0,completed:false});
export function p040Play(s:P040State):P040State{return s.term||s.completed||s.playing?s:Object.freeze({...s,playing:true});}
export function p040Pause(s:P040State):P040State{return !s.playing?s:Object.freeze({...s,playing:false});}
export function p040Advance(s:P040State,frames:number):P040State{
 if(!Number.isSafeInteger(frames)||frames<0)throw Error('P040_FRAME_DELTA');
 if(!s.playing||s.term||frames===0)return s;
 // Completion follows the full final-frame interval, preserving frame440.
 const position=s.frame+frames,completed=position>P040_SOURCE.frameCount;
 return Object.freeze({...s,frame:Math.min(position,P040_SOURCE.frameCount),completed,playing:!completed});
}
export function p040TermAvailable(s:P040State,term:P040Term):boolean{return s.frame>=P040_SOURCE.wordBoundaries.find(b=>b.term===term)!.firstCompleteWordFrame;}
export function p040OpenTerm(s:P040State,term:P040Term):P040State{return !p040TermAvailable(s,term)||s.term?s:Object.freeze({...s,term,playing:false});}
// Closing preserves the pause; resuming narration requires an explicit Play.
export function p040CloseTerm(s:P040State):P040State{return s.term?Object.freeze({...s,term:null}):s;}
export function p040Replay(s:P040State):P040State{return Object.freeze({...p040Initial(),replay:s.replay+1});}
export function p040EquationAt(frame:number){if(!Number.isInteger(frame)||frame<1||frame>440)throw Error('P040_FRAME');return P040_SOURCE.equationBeats.find(b=>frame>=b.firstFrame&&frame<=b.lastFrame)!.pose;}
