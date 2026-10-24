import {P038_TEACHING_SOURCE as SOURCE} from './generated/nms-l02-p038-teaching-source-v1';
export const P038_ID=SOURCE.animationId;
export type P038TermId=keyof typeof SOURCE.termFrames;
export interface P038SessionState {readonly mainFrame:number;readonly phase:'explanation'|'terminal';readonly seed:number;readonly replay:number;readonly term:P038TermId|null;}
export function p038Initial(seed=0,replay=0):P038SessionState {
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||!Number.isSafeInteger(replay)||replay<0)throw Error('P038_IDENTITY');
 return Object.freeze({mainFrame:1,phase:'explanation',seed,replay,term:null});
}
/** Retain the last frame's full interval. The subsequent native hold is qualified:
 * the original main timeline has no authored stop. */
export function p038Tick(s:P038SessionState):P038SessionState {
 if(s.term!==null||s.phase==='terminal')return s;
 return s.mainFrame===SOURCE.mainFrames?Object.freeze({...s,phase:'terminal'}):Object.freeze({...s,mainFrame:s.mainFrame+1});
}
export function p038Advance(s:P038SessionState,frames:number):P038SessionState {
 if(!Number.isSafeInteger(frames)||frames<0||frames>100000)throw Error('P038_ADVANCE');
 for(let i=0;i<frames;i++){const next=p038Tick(s);if(next===s)break;s=next;}return s;
}
export function p038TermAvailable(s:P038SessionState,term:P038TermId):boolean {return Object.hasOwn(SOURCE.termFrames,term)&&s.mainFrame>=SOURCE.termFrames[term];}
export function p038OpenTerm(s:P038SessionState,term:P038TermId):P038SessionState {return s.term===null&&p038TermAvailable(s,term)?Object.freeze({...s,term}):s;}
export function p038CloseTerm(s:P038SessionState):P038SessionState {return s.term===null?s:Object.freeze({...s,term:null});}
export function p038Replay(s:P038SessionState){return p038Initial(s.seed,s.replay+1);}
