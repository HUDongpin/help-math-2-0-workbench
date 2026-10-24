import {selectHostFeedback} from './g678-advanced-manual/host-feedback-selector';
import {P022_IR as IR} from './generated/nms-l02-p022-source-ir-v1';
import type {P022Matrix, P022Pose} from './nms-l02-p022-source-contract-v1';

function freezeSource<T>(value:T):T {
 if(value && typeof value==='object' && !Object.isFrozen(value)) {
  Object.freeze(value);
  for(const child of Object.values(value)) freezeSource(child);
 }
 return value;
}
freezeSource(IR);
export const P022_ID='shared-nms002-l02-p022';
export const P022_OPTIONS=Object.freeze([[1,4],[1,2],[3,8],[8,3]] as const);
export const P022_BRANCHES=Object.freeze({
 wrong:[
  {domain:'98',hold:23,close:24,end:28,popup:18,title:'OH! NO'},
  {domain:'77',hold:20,close:21,end:28,popup:14,title:'incorrect!'},
  {domain:'62',hold:23,close:24,end:29,popup:17,title:'Try Again!'},
 ],
 right:[
  {domain:'142',end:31,title:'YOU GOT IT!'},
  {domain:'171',end:28,title:'Correct!'},
  {domain:'185',end:32,title:'Excellent!'},
  {domain:'154',end:27,title:'Excellent!'},
 ],
} as const);
export const P022_DORMANT_WRONG=Object.freeze({domain:'116',hold:22,close:23,end:31,popup:17,title:'OH! NO'});
export type P022Phase='intro'|'question'|'wrong-in'|'wrong-wait'|'wrong-out'|'right'|'outro'|'completed';
export interface P022SessionState {
 readonly phase:P022Phase;
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
export function p022Initial(seed=0,replay=0):P022SessionState {
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff||!Number.isInteger(replay)||replay<0) throw Error('P022_BAD_SEED');
 return Object.freeze({phase:'intro',mainFrame:1,localFrame:1,domain:'206',seed,replay,attempts:0,quizTryCount:0,answer:null,branch:null,feedback:null,outcome:'unanswered',help:false});
}
export function p022Feedback(s:P022SessionState) {
 if(s.domain==='116') return P022_DORMANT_WRONG;
 return s.feedback && s.branch!==null ? P022_BRANCHES[s.feedback][s.branch-1] : undefined;
}
export function p022WrongExplanation(s:P022SessionState) {
 return s.quizTryCount===1 ? 'Whoops, try again! Click Need More Help if you are stuck.' : 'Whoops! Click Need More Help if you are stuck.';
}
export function p022Answer(s:P022SessionState,index:number):P022SessionState {
 if(s.phase!=='question'||s.help||!Number.isInteger(index)||index<0||index>3) return s;
 const feedback=index===2?'right':'wrong';
 const branch=selectHostFeedback(feedback,(s.seed+s.attempts)>>>0).branchIndex;
 return Object.freeze({...s,phase:feedback==='right'?'right':'wrong-in',localFrame:2,
  domain:P022_BRANCHES[feedback][branch-1].domain,attempts:s.attempts+1,
  quizTryCount:s.quizTryCount+(feedback==='wrong'?1:0),answer:index,branch,feedback,
  outcome:feedback==='right'?'correct':s.outcome});
}
export function p022CloseFeedback(s:P022SessionState):P022SessionState {
 const b=p022Feedback(s);
 if(!b||!('popup' in b)||!['wrong-in','wrong-wait'].includes(s.phase)||s.localFrame<b.popup) return s;
 return Object.freeze({...s,phase:'wrong-out',localFrame:b.close});
}
export function p022CanHelp(s:P022SessionState) {
 return !s.help && (s.phase==='question'||(['outro','completed'].includes(s.phase)&&s.outcome==='assisted'));
}
export function p022OpenHelp(s:P022SessionState):P022SessionState {
 return p022CanHelp(s)?Object.freeze({...s,help:true}):s;
}
export function p022CloseHelp(s:P022SessionState):P022SessionState {
 return s.help?Object.freeze({...s,help:false}):s;
}
export function p022Tick(s:P022SessionState):P022SessionState {
 if(s.help||['question','wrong-wait','completed'].includes(s.phase)) return s;
 if(s.phase==='intro') {
  const frame=Math.min(223,s.mainFrame+1);
  return Object.freeze({...s,mainFrame:frame,localFrame:frame,phase:frame===223?'question':'intro'});
 }
 if(s.phase==='outro') {
  // The source naturally wraps after frame501. Hold only after its full interval.
  if(s.mainFrame===501) return Object.freeze({...s,phase:'completed'});
  const frame=s.mainFrame+1;
  return Object.freeze({...s,mainFrame:frame,localFrame:frame});
 }
 const branch=p022Feedback(s);
 if(!branch) throw Error('P022_MISSING_BRANCH');
 const frame=s.localFrame+1;
 if(s.phase==='wrong-in' && 'hold' in branch) {
  return Object.freeze({...s,localFrame:Math.min(branch.hold,frame),phase:frame>=branch.hold?'wrong-wait':'wrong-in'});
 }
 if(frame>=branch.end) {
  const advance=s.phase==='right'||s.quizTryCount>=2;
  return Object.freeze({...s,phase:advance?'outro':'question',mainFrame:advance?224:223,
   localFrame:advance?224:223,domain:'206',branch:null,feedback:null,
   quizTryCount:advance?0:s.quizTryCount,outcome:s.phase==='right'?'correct':advance?'assisted':s.outcome});
 }
 return Object.freeze({...s,localFrame:frame});
}
export function p022Advance(s:P022SessionState,frames:number) {
 if(!Number.isInteger(frames)||frames<0||frames>100000) throw Error('P022_BAD_ADVANCE');
 for(let i=0;i<frames;i++) {const next=p022Tick(s);if(next===s) break;s=next;}
 return s;
}
export function p022LocalPoses(domain:string,frame:number):readonly P022Pose[]{if(!Object.hasOwn(IR.domains,domain))throw Error('P022_BAD_DOMAIN');const d=IR.domains[domain];if(!Number.isInteger(frame)||frame<1||frame>d.frameCount)throw Error('P022_BAD_FRAME');return d.frames[frame-1].map(i=>IR.poses[i]);}
const identity:P022Matrix=[1,0,0,1,0,0];
export const p022Multiply=(a:P022Matrix,b:P022Matrix):P022Matrix=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
export interface P022Node extends P022Pose{readonly instancePath:string;readonly masks:readonly P022Mask[];}
export interface P022Mask extends P022Pose{readonly key:string;}
/** Structural nested local-domain query. Interactive branch selection is supplied
 * separately; dormant feedback remains at its source stop1. */
export function p022SourceNodes(domain:string,frame:number):readonly P022Node[]{const nodes:P022Node[]=[];
 const visit=(name:string,f:number,m:P022Matrix,parentColor:readonly number[],inherited:readonly P022Mask[],path:string)=>{
  const masks:P022Mask[]=[];
  for(const p of p022LocalPoses(name,f)){const matrix=p022Multiply(m,p.matrix),color=p.color.map((v,i)=>i<4?v*parentColor[i]:v*parentColor[i-4]+parentColor[i]),instancePath=path+'/d'+p.depth+'g'+p.generation+'c'+p.characterId,active=[...inherited,...masks.filter(a=>p.depth>a.depth&&p.depth<=a.clipDepth)],pose={...p,matrix,color};
   if(p.clipDepth){masks.push({...pose,key:instancePath});continue;}
   const child=String(p.characterId);if(Object.hasOwn(IR.domains,child)){const isFeedback=/^Mc_(Wrong|Right)_Feed/.test(p.name??'');visit(child,isFeedback?1:(f-p.birthFrame)%IR.domains[child].frameCount+1,matrix,color,active,instancePath);}else nodes.push({...pose,instancePath,masks:active});
  }
 };visit(domain,frame,identity,[1,1,1,1,0,0,0,0],[],domain);return nodes;
}

export function p022Teaching(s:P022SessionState) {
 const row=IR.teaching[s.mainFrame-1];
 if(!row) throw Error('P022_TEACHING_FRAME');
 const termEnabled=!s.help&&!s.feedback;
 return Object.freeze({row,answersEnabled:s.phase==='question'&&!s.help,
  helpEnabled:p022CanHelp(s),termEnabled,
  terms:Object.freeze({Part:termEnabled&&row.question[1].complete,Fraction:termEnabled&&row.question[3].complete})});
}
export function p022FeedbackTitleVisible(s:P022SessionState) {
 const ids:Record<string,readonly number[]>={
  '62':[44],'77':[66,67,70],'98':[81,82,84,92],'116':[107,108],
  '142':[131,132],'154':[151,152],'171':[166,167],'185':[178,179,183],
 };
 if(!Object.hasOwn(ids,s.domain)) return false;
 return p022SourceNodes(s.domain,s.localFrame).some(n=>ids[s.domain].includes(n.characterId)&&n.color[3]>0&&Math.abs(n.matrix[0]*n.matrix[3]-n.matrix[1]*n.matrix[2])>1e-8);
}
export function p022SourceTerm(id:string) {return IR.terms.find(t=>t.id===id);}
