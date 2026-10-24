/** Source-bound question and feedback semantics. Assisted or skipped questions
 * never count as correct; Replay recovers the source's exhausted third round. */
export const P021_ID='shared-nms002-l02-p021';
export const P021_SOURCE_SHA256='114219149b6a6aca2037d9e4c40a6ffb7f75d620ddf2c3030f597ccc11967c69';
export const P021_QUESTIONS=Object.freeze([Object.freeze([1,3]as const),Object.freeze([3,7]as const),Object.freeze([5,7]as const)]);
export const P021_WRONG_BRANCHES=Object.freeze([Object.freeze({start:3,end:16}),Object.freeze({start:18,end:27}),Object.freeze({start:31,end:36}),Object.freeze({start:40,end:54})]);
export const P021_FEEDBACK=Object.freeze({correct:'Yes, you are correct.',first:'Divide the whole and then click the correct number of parts. Try again.',later:'Divide the whole and then click the correct number of parts.'});
export type P021Button='up'|'down'|'check'|'new'|'close';
export type P021Outcome='none'|'correct'|'assisted'|'skipped';
export interface P021State {
 readonly phase:'intro'|'exercise'|'outro'|'completed';readonly mainFrame:number;
 readonly pool:readonly number[];readonly question:number|null;readonly round:number;readonly rng:number;
 readonly parts:number;readonly selected:readonly number[];readonly attempts:number;readonly wrongAttempts:number;
 readonly correctCount:number;readonly outcome:P021Outcome;readonly history:readonly {readonly question:number;readonly outcome:P021Outcome}[];
 readonly feedback:'none'|'wrong'|'correct';readonly coachFrame:number|null;readonly coachBranch:number|null;readonly correctFrame:number|null;
 readonly held:P021Button|null;readonly pressFrame:number|null;readonly seed:number;readonly replay:number;
}
function freeze<T>(v:T):T {if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x);}return v;}
export function p021Initial(seed=0,replay=0):P021State {
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||!Number.isSafeInteger(replay)||replay<0)throw Error('P021_BAD_IDENTITY');
 return freeze({phase:'intro',mainFrame:1,pool:[0,1,2],question:null,round:0,rng:seed,parts:1,selected:[],attempts:0,wrongAttempts:0,correctCount:0,outcome:'none',history:[],feedback:'none',coachFrame:null,coachBranch:null,correctFrame:null,held:null,pressFrame:null,seed,replay});
}
/** Seeded replacement for Flash random(), without claiming identical PRNG output. */
function draw(rng:number,length:number){const next=(Math.imul(rng,1664525)+1013904223)>>>0;return {rng:next,index:Math.floor(next/4294967296*length)};}
function nextQuestion(s:P021State):P021State {
 if(!s.pool.length||s.round>=3)return s;
 const pick=draw(s.rng,s.pool.length),pool=[...s.pool],question=pool.splice(pick.index,1)[0]!;
 const history=s.question===null?s.history:[...s.history,{question:s.question,outcome:s.outcome==='none'?'skipped' as const:s.outcome}];
 return freeze({...s,phase:'exercise',mainFrame:470,rng:pick.rng,pool,question,round:s.round+1,parts:1,selected:[],attempts:0,outcome:'none',history,feedback:'none',held:null,pressFrame:null});
}
export const p021Target=(s:P021State)=>s.question===null?null:P021_QUESTIONS[s.question]!;
export const p021Editable=(s:P021State)=>s.phase==='exercise'&&s.feedback==='none'&&s.outcome==='none';
export function p021ButtonEnabled(s:P021State,kind:P021Button):boolean {
 if(kind==='close')return s.feedback!=='none';
 if(kind==='new')return s.phase==='exercise'&&s.feedback==='none'&&s.round<3;
 return p021Editable(s);
}
export function p021Toggle(s:P021State,index:number):P021State {
 if(!Number.isInteger(index)||index<0||index>=s.parts)throw Error('P021_BAD_SECTOR');
 if(!p021Editable(s))return s;
 return freeze({...s,selected:s.selected.includes(index)?s.selected.filter(x=>x!==index):[...s.selected,index].sort((a,b)=>a-b)});
}
export function p021ChangeParts(s:P021State,delta:-1|1):P021State {
 if(delta!==1&&delta!==-1)throw Error('P021_BAD_PART_DELTA');if(!p021Editable(s))return s;
 const parts=Math.max(1,Math.min(20,s.parts+delta));
 // The source clears its count even at a clamped bound. Keep geometry and the
 // real shaded set consistent instead of retaining stale colors.
 return freeze({...s,parts,selected:[]});
}
export function p021Submit(s:P021State):P021State {
 if(!p021Editable(s))return s;const target=p021Target(s)!;
 if(s.selected.length===target[0]&&s.parts===target[1])return freeze({...s,attempts:s.attempts+1,correctCount:s.correctCount+1,outcome:'correct',feedback:'correct',correctFrame:2,held:null,pressFrame:null});
 const pick=draw(s.rng,4),branch=pick.index;
 return freeze({...s,attempts:s.attempts+1,wrongAttempts:s.wrongAttempts+1,feedback:'wrong',rng:pick.rng,coachBranch:branch,coachFrame:P021_WRONG_BRANCHES[branch]!.start,held:null,pressFrame:null});
}
export function p021NewWhole(s:P021State):P021State {return p021ButtonEnabled(s,'new')?nextQuestion(s):s;}
export function p021CloseFeedback(s:P021State):P021State {
 if(s.feedback==='none')return s;
 if(s.feedback==='correct'){
  const finishing=s.correctCount>=3;
  return freeze({...s,feedback:'none',phase:finishing?'outro':s.phase,mainFrame:finishing?474:s.mainFrame,held:null,pressFrame:null});
 }
 if(s.attempts>=2){const target=p021Target(s)!;return freeze({...s,feedback:'none',parts:target[1],selected:Array.from({length:target[0]},(_,i)=>i),outcome:'assisted',held:null,pressFrame:null});}
 return freeze({...s,feedback:'none',held:null,pressFrame:null});
}
export function p021Press(s:P021State,kind:P021Button):P021State {
 if(!['up','down','check','new','close'].includes(kind))throw Error('P021_BAD_BUTTON');
 return s.held||!p021ButtonEnabled(s,kind)?s:freeze({...s,held:kind,pressFrame:1});
}
export function p021Release(s:P021State,activate:boolean):P021State {
 if(!s.held)return s;const kind=s.held,next=freeze({...s,held:null,pressFrame:null});if(!activate)return next;
 return kind==='up'?p021ChangeParts(next,1):kind==='down'?p021ChangeParts(next,-1):kind==='check'?p021Submit(next):kind==='new'?p021NewWhole(next):p021CloseFeedback(next);
}
export function p021Replay(s:P021State):P021State{return p021Initial(s.seed,s.replay+1);}
export interface P021Fractions {readonly main:number;readonly coach:number;readonly correct:number;readonly press:number;}
export const P021_ZERO_FRACTIONS:P021Fractions=Object.freeze({main:0,coach:0,correct:0,press:0});
export function p021FractionsAfterEvent(before:P021State,after:P021State,f:P021Fractions):P021Fractions {
 if(before.replay!==after.replay)return P021_ZERO_FRACTIONS;
 return freeze({...f,main:before.phase!==after.phase?0:f.main,coach:before.wrongAttempts!==after.wrongAttempts||after.coachFrame===null?0:f.coach,correct:before.correctCount!==after.correctCount||after.correctFrame===null?0:f.correct,press:before.held!==after.held||after.pressFrame===null?0:f.press});
}
export function p021Elapse(s:P021State,f:P021Fractions,seconds:number):{state:P021State;fractions:P021Fractions} {
 if(!Number.isFinite(seconds)||seconds<0||seconds>1e6||Object.values(f).some(x=>!Number.isFinite(x)||x<0||x>=1))throw Error('P021_BAD_ELAPSE');
 const advance=(frame:number,fraction:number,end:number)=>{const v=frame+fraction+seconds*12,reached=v>=end-1e-8,floor=Math.floor(v+1e-8);return{frame:reached?end:floor,fraction:reached?0:Math.max(0,v-floor),reached};};
 let next:P021State={...s};const fractions={...f};
 if(s.coachFrame!==null){const q=advance(s.coachFrame,f.coach,P021_WRONG_BRANCHES[s.coachBranch!]!.end);next={...next,coachFrame:q.reached?null:q.frame,coachBranch:q.reached?null:s.coachBranch};fractions.coach=q.fraction;}
 if(s.correctFrame!==null){const q=advance(s.correctFrame,f.correct,20);next={...next,correctFrame:q.reached?null:q.frame};fractions.correct=q.fraction;}
 if(s.pressFrame!==null&&s.held){const q=advance(s.pressFrame,f.press,5);next={...next,pressFrame:q.frame};fractions.press=q.fraction;}
 if(s.phase==='intro'||s.phase==='outro'){
  const q=advance(s.mainFrame,f.main,s.phase==='intro'?470:515);next={...next,mainFrame:q.frame};fractions.main=q.fraction;
  if(q.reached)next=s.phase==='intro'?nextQuestion(next):{...next,phase:'completed'};
 }
 return freeze({state:next,fractions});
}
export function p021Advance(s:P021State,frames:number):P021State {if(!Number.isSafeInteger(frames)||frames<0||frames>100000)throw Error('P021_BAD_ADVANCE');return p021Elapse(s,P021_ZERO_FRACTIONS,frames/12).state;}
export const p021ClockActive=(s:P021State)=>s.phase==='intro'||s.phase==='outro'||s.coachFrame!==null||s.correctFrame!==null||(s.pressFrame!==null&&s.pressFrame<5);
export const p021NeedsReplay=(s:P021State)=>s.phase==='exercise'&&s.round===3&&s.feedback==='none'&&s.outcome!=='none'&&s.correctCount<3;
