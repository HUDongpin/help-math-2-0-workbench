import {P034_STATE_SOURCE as SOURCE} from './generated/nms-l02-p034-state-source-v1';
export const P034_ID=SOURCE.animationId;
export interface P034SessionState {
 readonly phase:'intro'|'practice';
 readonly mainFrame:number;
 readonly value:number;
 readonly sourceX:number|null;
 readonly seed:number;
 readonly replay:number;
 readonly dragging:boolean;
 readonly resetPressed:boolean;
 readonly resetCueSerial:number;
 readonly resetCount:number;
 readonly termOpen:boolean;
}
export function p034Initial(seed=0,replay=0):P034SessionState {
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||!Number.isSafeInteger(replay)||replay<0)throw Error('P034_IDENTITY');
 return Object.freeze({phase:'intro',mainFrame:1,value:0,sourceX:null,seed,replay,dragging:false,resetPressed:false,resetCueSerial:0,resetCount:0,termOpen:false});
}
const interactive=(s:P034SessionState)=>s.phase==='practice'&&!s.termOpen;
/** Source drag equation; clamp only to the authored startDrag limits. */
export function p034ValueAtSourceX(x:number) {
 if(!Number.isFinite(x))throw Error('P034_SOURCE_POSITION');
 const bounded=Math.max(SOURCE.sourceXBounds[0],Math.min(SOURCE.sourceXBounds[1],x));
 return Math.round((bounded/50+5)*40/2)+36;
}
export function p034Decimal(value:number) {
 if(!Number.isSafeInteger(value)||value<0||value>100)throw Error('P034_VALUE');
 return value===100?'1.00':'0.'+String(value).padStart(2,'0');
}
/** External clock owns pause/resume. The final hold frame retains a full interval
 * before practice controls become available; source frame396 is inspection only. */
export function p034Tick(s:P034SessionState):P034SessionState {
 if(s.termOpen||s.phase==='practice')return s;
 if(s.mainFrame===SOURCE.mainStopFrame)return Object.freeze({...s,phase:'practice'});
 const frame=s.mainFrame+1,entering=frame===SOURCE.mainStopFrame;
 return Object.freeze({...s,mainFrame:frame,value:entering?SOURCE.initialCount:SOURCE.guidedCounts[frame-1],sourceX:entering?SOURCE.sourceInitialX:null});
}
export function p034Advance(s:P034SessionState,frames:number) {
 if(!Number.isSafeInteger(frames)||frames<0||frames>100000)throw Error('P034_ADVANCE');
 for(let i=0;i<frames;i++){const next=p034Tick(s);if(next===s)break;s=next;}return s;
}
export function p034BeginDrag(s:P034SessionState):P034SessionState {
 return interactive(s)&&!s.resetPressed&&!s.dragging?Object.freeze({...s,dragging:true}):s;
}
export function p034DragTo(s:P034SessionState,x:number):P034SessionState {
 if(!interactive(s)||!s.dragging||!Number.isFinite(x))return s;
 const sourceX=Math.max(SOURCE.sourceXBounds[0],Math.min(SOURCE.sourceXBounds[1],x));
 return Object.freeze({...s,sourceX,value:p034ValueAtSourceX(sourceX)});
}
export function p034EndDrag(s:P034SessionState):P034SessionState {
 return s.dragging?Object.freeze({...s,dragging:false}):s;
}
/** Native keyboard/range access retains the same101mathematical states. */
export function p034SetValue(s:P034SessionState,value:number):P034SessionState {
 if(!interactive(s)||s.resetPressed||!Number.isSafeInteger(value)||value<0||value>100)return s;
 const sourceX=SOURCE.sourceXBounds[0]+(SOURCE.sourceXBounds[1]-SOURCE.sourceXBounds[0])*value/100;
 return Object.freeze({...s,value,sourceX});
}
export function p034PressReset(s:P034SessionState):P034SessionState {
 return interactive(s)&&!s.resetPressed?Object.freeze({...s,dragging:false,resetPressed:true,resetCueSerial:s.resetCueSerial+1}):s;
}
/** Release outside/cancel ends the down-state sound without resetting the value. */
export function p034CancelReset(s:P034SessionState):P034SessionState {
 return s.resetPressed?Object.freeze({...s,resetPressed:false}):s;
}
/** Source on(release). Also supports an assistive-technology click without a
 * preceding pointer event; the audio controller owns cue activation/cancellation. */
export function p034Reset(s:P034SessionState):P034SessionState {
 return interactive(s)?Object.freeze({...s,value:SOURCE.resetCount,sourceX:SOURCE.sourceResetX,dragging:false,resetPressed:false,resetCount:s.resetCount+1}):s;
}
export function p034OpenTerm(s:P034SessionState):P034SessionState {
 return !s.termOpen&&s.mainFrame>=SOURCE.termReadableFrame?Object.freeze({...s,termOpen:true,dragging:false,resetPressed:false}):s;
}
export function p034CloseTerm(s:P034SessionState):P034SessionState {
 return s.termOpen?Object.freeze({...s,termOpen:false}):s;
}
export function p034Replay(s:P034SessionState){return p034Initial(s.seed,s.replay+1);}
