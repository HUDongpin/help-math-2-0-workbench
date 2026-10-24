export const P035_ID='shared-nms002-l02-p035';
export type P035TermId='decimal'|'equivalent-decimal';
export interface P035SessionState {
 readonly mainFrame:number;
 readonly phase:'explanation'|'terminal';
 readonly seed:number;
 readonly replay:number;
 readonly term:P035TermId|null;
}
export function p035Initial(seed=0,replay=0):P035SessionState {
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||!Number.isSafeInteger(replay)||replay<0)throw Error('P035_IDENTITY');
 return Object.freeze({mainFrame:1,phase:'explanation',seed,replay,term:null});
}
/** A full interval is retained for frame1036. Holding afterward is a qualified
 * native adaptation: the source timeline has no authored main stop. */
export function p035Tick(s:P035SessionState):P035SessionState {
 if(s.term!==null||s.phase==='terminal')return s;
 return s.mainFrame===1036?Object.freeze({...s,phase:'terminal'}):Object.freeze({...s,mainFrame:s.mainFrame+1});
}
export function p035Advance(s:P035SessionState,frames:number):P035SessionState {
 if(!Number.isSafeInteger(frames)||frames<0||frames>100000)throw Error('P035_ADVANCE');
 for(let i=0;i<frames;i++){const next=p035Tick(s);if(next===s)break;s=next;}return s;
}
export function p035TermAvailable(s:P035SessionState,term:P035TermId){
 return term==='decimal'?s.mainFrame>=31:term==='equivalent-decimal'?s.mainFrame>=14:false;
}
/** Button activation waits for the complete source term to become readable. */
export function p035OpenTerm(s:P035SessionState,term:P035TermId):P035SessionState {
 return s.term===null&&p035TermAvailable(s,term)?Object.freeze({...s,term}):s;
}
export function p035CloseTerm(s:P035SessionState):P035SessionState {return s.term===null?s:Object.freeze({...s,term:null});}
export function p035Replay(s:P035SessionState){return p035Initial(s.seed,s.replay+1);}
