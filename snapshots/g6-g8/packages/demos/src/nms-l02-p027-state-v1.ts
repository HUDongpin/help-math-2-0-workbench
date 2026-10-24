import {selectHostFeedback} from './g678-advanced-manual/host-feedback-selector';
import {P027_GAME_SOURCE as SOURCE} from './generated/nms-l02-p027-game-source-v1';
export const P027_ID=SOURCE.animationId;
export const P027_OPTIONS=SOURCE.options;
export const P027_BRANCHES=SOURCE.branches;
export const P027_DORMANT_WRONG=SOURCE.dormantWrong;
function freeze<T>(v:T):T{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x);}return v;}freeze(SOURCE);
export type P027Phase='intro'|'question'|'wrong-in'|'wrong-wait'|'wrong-out'|'right'|'outro'|'completed';
export interface P027SessionState {
 readonly phase:P027Phase;
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
export function p027Initial(seed=0,replay=0):P027SessionState {
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||!Number.isSafeInteger(replay)||replay<0) throw Error('P027_BAD_SEED');
 return Object.freeze({phase:'intro',mainFrame:1,localFrame:1,domain:'207',seed,replay,attempts:0,quizTryCount:0,answer:null,branch:null,feedback:null,outcome:'unanswered',help:false});
}
export function p027Feedback(s:P027SessionState) {
 if(s.domain==='116') return P027_DORMANT_WRONG;
 return s.feedback && s.branch!==null ? P027_BRANCHES[s.feedback][s.branch-1] : undefined;
}
export function p027WrongExplanation(s:P027SessionState) {
 return s.quizTryCount===1 ? 'Whoops try again! Click Need More Help if you are stuck.' : 'Whoops! Click Need More Help if you are stuck.';
}
export function p027Answer(s:P027SessionState,index:number):P027SessionState {
 if(s.phase!=='question'||s.help||!Number.isSafeInteger(index)||index<0||index>3) return s;
 const feedback=index===SOURCE.correctIndex?'right':'wrong';
 const branch=selectHostFeedback(feedback,(s.seed+s.attempts)>>>0).branchIndex;
 return Object.freeze({...s,phase:feedback==='right'?'right':'wrong-in',localFrame:2,
  domain:P027_BRANCHES[feedback][branch-1].domain,attempts:s.attempts+1,
  quizTryCount:s.quizTryCount+(feedback==='wrong'?1:0),answer:index,branch,feedback,
  outcome:feedback==='right'?'correct':s.outcome});
}
export function p027CloseFeedback(s:P027SessionState):P027SessionState {
 const b=p027Feedback(s);
 if(!b||!('popup' in b)||!['wrong-in','wrong-wait'].includes(s.phase)||s.localFrame<b.popup) return s;
 return Object.freeze({...s,phase:'wrong-out',localFrame:b.close});
}
export function p027CanHelp(s:P027SessionState) {
 return !s.help && (s.phase==='question'||(['outro','completed'].includes(s.phase)&&s.outcome==='assisted'));
}
export function p027OpenHelp(s:P027SessionState):P027SessionState {
 return p027CanHelp(s)?Object.freeze({...s,help:true}):s;
}
export function p027CloseHelp(s:P027SessionState):P027SessionState {
 return s.help?Object.freeze({...s,help:false}):s;
}
export function p027Tick(s:P027SessionState):P027SessionState {
 if(s.help||['question','wrong-wait','completed'].includes(s.phase)) return s;
 if(s.phase==='intro') {
  const frame=Math.min(264,s.mainFrame+1);
  return Object.freeze({...s,mainFrame:frame,localFrame:frame,phase:frame===264?'question':'intro'});
 }
 if(s.phase==='outro') {
  // The source naturally wraps after frame384. Hold only after its full interval.
  if(s.mainFrame===384) return Object.freeze({...s,phase:'completed'});
  const frame=s.mainFrame+1;
  return Object.freeze({...s,mainFrame:frame,localFrame:frame});
 }
 const branch=p027Feedback(s);
 if(!branch) throw Error('P027_MISSING_BRANCH');
 const frame=s.localFrame+1;
 if(s.phase==='wrong-in' && 'hold' in branch) {
  return Object.freeze({...s,localFrame:Math.min(branch.hold,frame),phase:frame>=branch.hold?'wrong-wait':'wrong-in'});
 }
 if(frame>=branch.end) {
  const advance=s.phase==='right'||s.quizTryCount>=2;
  return Object.freeze({...s,phase:advance?'outro':'question',mainFrame:advance?265:264,
   localFrame:advance?265:264,domain:'207',branch:null,feedback:null,
   quizTryCount:advance&&s.phase!=='right'?0:s.quizTryCount,outcome:s.phase==='right'?'correct':advance?'assisted':s.outcome});
 }
 return Object.freeze({...s,localFrame:frame});
}
export function p027Advance(s:P027SessionState,frames:number) {
 if(!Number.isSafeInteger(frames)||frames<0||frames>100000) throw Error('P027_BAD_ADVANCE');
 for(let i=0;i<frames;i++) {const next=p027Tick(s);if(next===s) break;s=next;}
 return s;
}

export function p027Replay(s:P027SessionState){return p027Initial(s.seed,s.replay+1);}
