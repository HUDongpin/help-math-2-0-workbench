import {P036_STATE_SOURCE as SOURCE} from './generated/nms-l02-p036-state-source-v1';
export const P036_ID=SOURCE.animationId;
export type P036TermId=keyof typeof SOURCE.termFrames;
export interface P036SessionState {readonly mainFrame:number;readonly phase:'explanation'|'terminal';readonly seed:number;readonly replay:number;readonly term:P036TermId|null;}
export function p036Initial(seed=0,replay=0):P036SessionState {
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||!Number.isSafeInteger(replay)||replay<0)throw Error('P036_IDENTITY');
 return Object.freeze({mainFrame:1,phase:'explanation',seed,replay,term:null});
}
/** Retain the last frame's full interval. The subsequent native hold is qualified:
 * the original main timeline has no authored stop. */
export function p036Tick(s:P036SessionState):P036SessionState {
 if(s.term!==null||s.phase==='terminal')return s;
 return s.mainFrame===SOURCE.mainFrames?Object.freeze({...s,phase:'terminal'}):Object.freeze({...s,mainFrame:s.mainFrame+1});
}
export function p036Advance(s:P036SessionState,frames:number):P036SessionState {
 if(!Number.isSafeInteger(frames)||frames<0||frames>100000)throw Error('P036_ADVANCE');
 for(let i=0;i<frames;i++){const next=p036Tick(s);if(next===s)break;s=next;}return s;
}
export function p036TermAvailable(s:P036SessionState,term:P036TermId):boolean {return Object.hasOwn(SOURCE.termFrames,term)&&s.mainFrame>=SOURCE.termFrames[term];}
export function p036OpenTerm(s:P036SessionState,term:P036TermId):P036SessionState {return s.term===null&&p036TermAvailable(s,term)?Object.freeze({...s,term}):s;}
export function p036CloseTerm(s:P036SessionState):P036SessionState {return s.term===null?s:Object.freeze({...s,term:null});}
export function p036Replay(s:P036SessionState){return p036Initial(s.seed,s.replay+1);}
