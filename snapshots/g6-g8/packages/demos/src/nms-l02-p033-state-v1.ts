import {selectHostFeedback} from './g678-advanced-manual/host-feedback-selector';
import {P033_GAME_SOURCE as SOURCE} from './generated/nms-l02-p033-game-source-v1';
export const P033_ID=SOURCE.animationId;
export const P033_OPTIONS=SOURCE.options;
export const P033_BRANCHES=SOURCE.branches;
export const P033_DORMANT_WRONG=SOURCE.dormantWrong;
function freeze<T>(v:T):T{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x);}return v;}freeze(SOURCE);
export type P033Phase='intro'|'question'|'wrong-in'|'wrong-wait'|'wrong-out'|'right'|'outro'|'completed';
export interface P033SessionState {
 readonly phase:P033Phase;
 readonly mainFrame:number;
 readonly localFrame:number;
 readonly domain:string;
 readonly seed:number;
 readonly replay:number;
 readonly attempts:number;
 readonly quizTryCount:number;
 readonly answer:number|null;
 readonly branch:number|null;
 readonly feedback:'wrong'|'right'|null;
 readonly outcome:'unanswered'|'correct'|'assisted';
 readonly help:boolean;
}
export function p033Initial(seed=0,replay=0):P033SessionState {
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||!Number.isSafeInteger(replay)||replay<0) throw Error('P033_BAD_SEED');
 return Object.freeze({phase:'intro',mainFrame:1,localFrame:1,domain:'221',seed,replay,attempts:0,quizTryCount:0,answer:null,branch:null,feedback:null,outcome:'unanswered',help:false});
}
export function p033Feedback(s:P033SessionState) {
 if(s.domain==='112') return P033_DORMANT_WRONG;
 return s.feedback && s.branch!==null ? P033_BRANCHES[s.feedback][s.branch-1] : undefined;
}
export function p033WrongExplanation(s:P033SessionState) {
 return s.quizTryCount===1 ? 'Whoops, try again! Click Need More Help if you are stuck.' : 'Whoops! Click Need More Help if you are stuck.';
}
export function p033Answer(s:P033SessionState,index:number):P033SessionState {
 if(s.phase!=='question'||s.help||!Number.isSafeInteger(index)||index<0||index>3) return s;
 const feedback=index===SOURCE.correctIndex?'right':'wrong';
 const branch=selectHostFeedback(feedback,(s.seed+s.attempts)>>>0).branchIndex;
 return Object.freeze({...s,phase:feedback==='right'?'right':'wrong-in',localFrame:2,
  domain:P033_BRANCHES[feedback][branch-1].domain,attempts:s.attempts+1,
  quizTryCount:s.quizTryCount+(feedback==='wrong'?1:0),answer:index,branch,feedback,
  outcome:feedback==='right'?'correct':s.outcome});
}
export function p033CloseFeedback(s:P033SessionState):P033SessionState {
 const b=p033Feedback(s);
 if(!b||!('popup' in b)||!['wrong-in','wrong-wait'].includes(s.phase)||s.localFrame<b.popup) return s;
 return Object.freeze({...s,phase:'wrong-out',localFrame:b.close});
}
export function p033CanHelp(s:P033SessionState) {
 return !s.help && (s.phase==='question'||(['outro','completed'].includes(s.phase)&&s.outcome==='assisted'));
}
export function p033OpenHelp(s:P033SessionState):P033SessionState {
 return p033CanHelp(s)?Object.freeze({...s,help:true}):s;
}
export function p033CloseHelp(s:P033SessionState):P033SessionState {
 return s.help?Object.freeze({...s,help:false}):s;
}
export function p033Tick(s:P033SessionState):P033SessionState {
 if(s.help||['question','wrong-wait','completed'].includes(s.phase)) return s;
 if(s.phase==='intro') {
  // Keep the full source hold-frame interval before entering the waiting state.
  if(s.mainFrame===130) return Object.freeze({...s,phase:'question'});
  const frame=s.mainFrame+1;
  return Object.freeze({...s,mainFrame:frame,localFrame:frame});
 }
 if(s.phase==='outro') {
  // The source naturally wraps after frame298. Hold only after its full interval.
  if(s.mainFrame===298) return Object.freeze({...s,phase:'completed'});
  const frame=s.mainFrame+1;
  return Object.freeze({...s,mainFrame:frame,localFrame:frame});
 }
 const branch=p033Feedback(s);
 if(!branch) throw Error('P033_MISSING_BRANCH');
 const frame=s.localFrame+1;
 if(s.phase==='wrong-in' && 'hold' in branch) {
  if(s.localFrame===branch.hold) return Object.freeze({...s,phase:'wrong-wait'});
  return Object.freeze({...s,localFrame:frame});
 }
 if(s.localFrame===branch.end) {
  const advance=s.phase==='right'||s.quizTryCount>=2;
  return Object.freeze({...s,phase:advance?'outro':'question',mainFrame:advance?131:130,
   localFrame:advance?131:130,domain:'221',branch:null,feedback:null,
   quizTryCount:advance&&s.phase!=='right'?0:s.quizTryCount,outcome:s.phase==='right'?'correct':advance?'assisted':s.outcome});
 }
 return Object.freeze({...s,localFrame:frame});
}
export function p033Advance(s:P033SessionState,frames:number) {
 if(!Number.isSafeInteger(frames)||frames<0||frames>100000) throw Error('P033_BAD_ADVANCE');
 for(let i=0;i<frames;i++) {const next=p033Tick(s);if(next===s) break;s=next;}
 return s;
}

export function p033Replay(s:P033SessionState){return p033Initial(s.seed,s.replay+1);}
