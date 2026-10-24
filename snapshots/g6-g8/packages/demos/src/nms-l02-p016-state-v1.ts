/** Source-locked P016 native exercise state. See the source-defect disposition:
 * learner grading deliberately requires the authored target25/100.
 * This model alone does not register the page or establish original parity. */
export const P016_ID='shared-nms002-l02-p016';
export const P016_SOURCE_SHA256='b12976880eb12956d4ee758276b06b725fe2efc89f72c0c1e26c5b0c33d04edd';
export const P016_WRONG_BRANCHES=Object.freeze([
 Object.freeze({start:3,end:16}),Object.freeze({start:18,end:27}),
 Object.freeze({start:31,end:36}),Object.freeze({start:40,end:54}),
]);
export const P016_FEEDBACK=Object.freeze({
 correct:'Yes! You are correct.',
 gridOnly:'You were correct to shade 25 squares. Try again to enter the correct percent.',
 percentOnly:'You were correct to type 25%. Try again to shade the correct number of squares.',
 neither:'Oops. Try again.',
});
export type P016Phase='intro'|'exercise'|'outro'|'completed';
export type P016Feedback='none'|'wrong'|'correct'|'reveal';
export type P016WrongKind='gridOnly'|'percentOnly'|'neither';
export interface P016State {
 readonly phase:P016Phase; readonly mainFrame:number;
 readonly shaded:number; readonly digits:readonly [string,string];
 readonly dragging:boolean; readonly dragStart:number|null;
 readonly attempts:number; readonly wrongAttempts:number;
 readonly feedback:P016Feedback; readonly wrongKind:P016WrongKind|null;
 readonly outcome:'none'|'correct'|'assisted';
 readonly coachFrame:number|null; readonly coachBranch:number|null;
 readonly correctFrame:number|null; readonly wrongPanelFrame:number|null;
 readonly held:'reset'|'close'|null; readonly pressFrame:number|null;
 readonly seed:number; readonly replay:number;
}
function frozen<T>(v:T):T {
 if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const child of Object.values(v))frozen(child);}
 return v;
}
export function p016Initial(seed=0,replay=0):P016State {
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||!Number.isSafeInteger(replay)||replay<0)throw Error('P016_BAD_IDENTITY');
 return frozen({phase:'intro',mainFrame:1,shaded:0,digits:['',''],dragging:false,dragStart:null,
  attempts:0,wrongAttempts:0,feedback:'none',wrongKind:null,outcome:'none',coachFrame:null,coachBranch:null,
  correctFrame:null,wrongPanelFrame:null,held:null,pressFrame:null,seed,replay});
}
export const p016Enabled=(s:P016State)=>s.phase==='exercise'&&s.feedback==='none';
/** The exact source expression and clamp. All101 counts remain reachable. */
export function p016CountAtSourceX(x:number):number {
 if(!Number.isFinite(x))throw Error('P016_BAD_SLIDER_X');
 return Math.round((Math.max(-339,Math.min(-90,x))/50+5)*40/2)+36;
}
export function p016SourceXAtCount(count:number):number {
 if(!Number.isInteger(count)||count<0||count>100)throw Error('P016_BAD_COUNT');
 return Math.max(-339,Math.min(-90,(count-136)/.4));
}
/** Retained diagnostic of the faulty source comparison. Never used to grade. */
export function p016RawSourceWouldAccept(shaded:number,digits:readonly [string,string]):boolean {
 if(!Number.isInteger(shaded)||shaded<0||shaded>100)throw Error('P016_BAD_COUNT');
 const text=String(shaded).padStart(3,'0').slice(-2);
 return text===digits.join('');
}
export function p016SetShaded(s:P016State,count:number):P016State {
 if(!Number.isInteger(count)||count<0||count>100)throw Error('P016_BAD_COUNT');
 return !p016Enabled(s)||count===s.shaded?s:frozen({...s,shaded:count});
}
export function p016SetDigit(s:P016State,index:0|1,value:string):P016State {
 if((index!==0&&index!==1)||!/^\d?$/u.test(value))throw Error('P016_BAD_DIGIT');
 if(!p016Enabled(s)||s.digits[index]===value)return s;
 const digits:[string,string]=[...s.digits];digits[index]=value;return frozen({...s,digits});
}
export function p016DragStart(s:P016State):P016State {
 return !p016Enabled(s)||s.dragging?s:frozen({...s,dragging:true,dragStart:s.shaded});
}
export function p016DragMove(s:P016State,sourceX:number):P016State {
 return !s.dragging?s:p016SetShaded(s,p016CountAtSourceX(sourceX));
}
export function p016DragEnd(s:P016State,cancel=false):P016State {
 return !s.dragging?s:frozen({...s,shaded:cancel?s.dragStart!:s.shaded,dragging:false,dragStart:null});
}
/** Modern deterministic selector; the four source branch intervals are exact. */
export function p016CoachBranch(seed:number,attempt:number):number {
 let value=(seed+Math.imul(attempt+1,0x9e3779b9))>>>0;
 value^=value>>>16;value=Math.imul(value,0x21f0aaad);value^=value>>>15;
 value=Math.imul(value,0x735a2d97);value^=value>>>15;return(value>>>0)%4;
}
export function p016Submit(s:P016State):P016State {
 if(!p016Enabled(s)||s.dragging)return s;
 const correct=s.shaded===25&&s.digits[0]==='2'&&s.digits[1]==='5';
 if(correct)return frozen({...s,attempts:s.attempts+1,feedback:'correct',wrongKind:null,
  outcome:'correct',correctFrame:2,held:null,pressFrame:null});
 const wrongAttempts=s.wrongAttempts+1,branch=p016CoachBranch(s.seed,s.wrongAttempts);
 const wrongKind:P016WrongKind=s.shaded===25?'gridOnly':s.digits.join('')==='25'?'percentOnly':'neither';
 const shared={...s,attempts:s.attempts+1,wrongAttempts,wrongKind,coachBranch:branch,
  coachFrame:P016_WRONG_BRANCHES[branch]!.start,held:null,pressFrame:null};
 if(wrongAttempts>=2)return frozen({...shared,feedback:'reveal',outcome:'assisted',shaded:25,digits:['2','5'],wrongPanelFrame:null});
 return frozen({...shared,feedback:'wrong',wrongPanelFrame:2});
}
export function p016Reset(s:P016State):P016State {
 return !p016Enabled(s)?s:frozen({...s,shaded:0,dragging:false,dragStart:null});
}
export function p016CloseFeedback(s:P016State):P016State {
 if(s.feedback==='wrong')return frozen({...s,feedback:'none',wrongKind:null,wrongPanelFrame:null,digits:['',''],held:null,pressFrame:null});
 if(s.feedback==='correct')return frozen({...s,feedback:'none',phase:'outro',held:null,pressFrame:null});
 return s;
}
/** Press/release mirrors source button-down sound without click double firing.
 * The DOM adapter must pass activate=false for release outside or cancellation. */
export function p016Press(s:P016State,kind:'reset'|'close'):P016State {
 if(s.held||(kind==='reset'?!p016Enabled(s):!['wrong','correct'].includes(s.feedback)))return s;
 return frozen({...s,held:kind,pressFrame:1});
}
export function p016Release(s:P016State,activate:boolean):P016State {
 if(!s.held)return s;const kind=s.held,next=frozen({...s,held:null,pressFrame:null});
 return activate?(kind==='reset'?p016Reset(next):p016CloseFeedback(next)):next;
}
export function p016Replay(s:P016State):P016State {return p016Initial(s.seed,s.replay+1);}
export interface P016Fractions {readonly main:number;readonly coach:number;readonly correct:number;readonly panel:number;readonly press:number;}
export const P016_ZERO_FRACTIONS:P016Fractions=Object.freeze({main:0,coach:0,correct:0,panel:0,press:0});
/** Retain independent subframe clocks when input starts or replaces feedback.
 * Call after an event before the next elapse. Existing voices do not restart. */
export function p016FractionsAfterEvent(before:P016State,after:P016State,f:P016Fractions):P016Fractions {
 if(after.replay!==before.replay)return P016_ZERO_FRACTIONS;
 return frozen({...f,
  coach:after.wrongAttempts!==before.wrongAttempts||after.coachFrame===null?0:f.coach,
  correct:before.correctFrame===null&&after.correctFrame!==null||after.correctFrame===null?0:f.correct,
  panel:before.wrongPanelFrame===null&&after.wrongPanelFrame!==null||after.wrongPanelFrame===null?0:f.panel,
  press:after.held!==before.held||after.pressFrame===null?0:f.press});
}
export function p016Elapse(s:P016State,f:P016Fractions,seconds:number):{state:P016State;fractions:P016Fractions} {
 if(!Number.isFinite(seconds)||seconds<0||seconds>1e6||Object.values(f).some(x=>!Number.isFinite(x)||x<0||x>=1))throw Error('P016_BAD_ELAPSE');
 const advance=(frame:number,fraction:number,end:number,dt:number)=>{
  const value=frame+fraction+dt*12,reached=value>=end-1e-8;
  return {frame:reached?end:Math.floor(value+1e-8),fraction:reached?0:Math.max(0,value-Math.floor(value+1e-8)),reached};
 };
 const next={...s},fractions={...f};let mainSeconds=seconds;
 if(s.coachFrame!==null){
  const end=P016_WRONG_BRANCHES[s.coachBranch!]!.end,q=advance(s.coachFrame,f.coach,end,seconds);
  next.coachFrame=q.reached?null:q.frame;next.coachBranch=q.reached?null:s.coachBranch;fractions.coach=q.fraction;
  if(q.reached&&s.feedback==='reveal'){
   next.phase='outro';next.feedback='none';next.wrongKind=null;
   mainSeconds=Math.max(0,seconds-(end-s.coachFrame-f.coach)/12);
  }
 }
 if(s.correctFrame!==null){const q=advance(s.correctFrame,f.correct,20,seconds);next.correctFrame=q.reached?null:q.frame;fractions.correct=q.fraction;}
 if(s.wrongPanelFrame!==null){const q=advance(s.wrongPanelFrame,f.panel,15,seconds);next.wrongPanelFrame=q.frame;fractions.panel=q.fraction;}
 if(s.pressFrame!==null&&s.held){const q=advance(s.pressFrame,f.press,5,seconds);next.pressFrame=q.frame;fractions.press=q.fraction;}
 if(next.phase==='intro'||next.phase==='outro'){
  const end=next.phase==='intro'?176:209,q=advance(s.mainFrame,f.main,end,mainSeconds);
  next.mainFrame=q.frame;fractions.main=q.fraction;
  if(q.reached)next.phase=next.phase==='intro'?'exercise':'completed';
 }
 return frozen({state:next,fractions});
}
export function p016Advance(s:P016State,frames:number):P016State {
 if(!Number.isSafeInteger(frames)||frames<0||frames>100000)throw Error('P016_BAD_ADVANCE');
 return p016Elapse(s,P016_ZERO_FRACTIONS,frames/12).state;
}
export const p016ClockActive=(s:P016State)=>s.phase==='intro'||s.phase==='outro'||s.coachFrame!==null||s.correctFrame!==null||(s.wrongPanelFrame!==null&&s.wrongPanelFrame<15)||(s.pressFrame!==null&&s.pressFrame<5);
