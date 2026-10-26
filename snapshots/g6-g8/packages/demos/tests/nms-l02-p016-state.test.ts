import assert from 'node:assert/strict';
import test from 'node:test';
import {p016Initial,p016Advance,p016Enabled,p016SetShaded,p016SetDigit,p016Submit,p016Reset,p016CloseFeedback,p016Replay,
 p016CountAtSourceX,p016SourceXAtCount,p016RawSourceWouldAccept,p016DragStart,p016DragMove,p016DragEnd,
 p016Press,p016Release,p016Elapse,p016FractionsAfterEvent,P016_ZERO_FRACTIONS,P016_WRONG_BRANCHES,type P016State} from '../src/nms-l02-p016-state-v1';

const ready=(seed=18)=>p016Advance(p016Initial(seed),175);
function answer(s:P016State,shaded:number,value:number){s=p016SetShaded(s,shaded);const digits=String(value).padStart(2,'0');s=p016SetDigit(s,0,digits[0]!);return p016SetDigit(s,1,digits[1]!);}

test('all101slider positions and all100two-digit answers admit only the25/100target',()=>{
 let accepted=0;
 for(let shaded=0;shaded<=100;shaded++)for(let input=0;input<100;input++){
  const s=p016Submit(answer(ready(),shaded,input));const correct=shaded===25&&input===25;
  assert.equal(s.feedback==='correct',correct);assert.equal(s.outcome,correct?'correct':'none');accepted+=Number(correct);
  if(!correct)assert.equal(s.wrongKind,shaded===25?'gridOnly':input===25?'percentOnly':'neither');
  assert.equal(p016Enabled(s),false);
 }
 assert.equal(accepted,1);
 for(const count of [0,15,99,100])assert(p016RawSourceWouldAccept(count,[String(count).padStart(3,'0').slice(-2)[0]!,String(count).padStart(3,'0').slice(-2)[1]!]));
});

test('source slider mapping, drag release outside, cancellation and reset retain their distinct semantics',()=>{
 for(let count=0;count<=100;count++)assert.equal(p016CountAtSourceX(p016SourceXAtCount(count)),count);
 assert.equal(p016CountAtSourceX(-1000),0);assert.equal(p016CountAtSourceX(1000),100);
 let s=answer(ready(),15,72);s=p016DragStart(s);s=p016DragMove(s,p016SourceXAtCount(100));assert.equal(s.shaded,100);
 assert.equal(p016Submit(s),s);s=p016DragEnd(s);assert.equal(s.shaded,100);
 s=p016DragStart(s);s=p016DragMove(s,p016SourceXAtCount(25));s=p016DragEnd(s,true);assert.equal(s.shaded,100);
 s=p016Reset(s);assert.equal(s.shaded,0);assert.deepEqual(s.digits,['7','2']);assert.equal(s.attempts,0);
 const intro=p016Initial();assert.equal(p016SetShaded(intro,25),intro);assert.equal(p016Submit(intro),intro);
 for(const bad of [-1,101,1.5,NaN])assert.throws(()=>p016SetShaded(s,bad));
 for(const bad of ['25','a','-',' '])assert.throws(()=>p016SetDigit(s,0,bad));
});

test('first wrong feedback clears input on close while its coach continues; second wrong is assisted',()=>{
 for(const [shaded,value] of [[25,24],[24,25],[24,24],[100,0]]){
  let s=p016Submit(answer(ready(),shaded!,value!));const branch=s.coachBranch!;
  s=p016CloseFeedback(s);assert(p016Enabled(s));assert.deepEqual(s.digits,['','']);assert.equal(s.shaded,shaded);assert.equal(s.coachBranch,branch);
  s=p016Reset(s);assert.equal(s.wrongAttempts,1);s=p016Submit(answer(s,100,0));
  assert.equal(s.feedback,'reveal');assert.equal(s.outcome,'assisted');assert.equal(s.shaded,25);assert.deepEqual(s.digits,['2','5']);
  const duration=P016_WRONG_BRANCHES[s.coachBranch!]!.end-s.coachFrame!;
  const before=p016Advance(s,duration-1);assert.equal(before.phase,'exercise');assert.equal(before.mainFrame,176);
  s=p016Advance(s,duration);assert.equal(s.phase,'outro');assert.equal(s.mainFrame,176);assert.equal(s.feedback,'none');assert.equal(s.outcome,'assisted');
  s=p016Advance(s,33);assert.equal(s.phase,'completed');assert.equal(s.mainFrame,209);
 }
});

test('correct audio ending leaves the modal open and main stopped until explicit close',()=>{
 let s=p016Submit(answer(ready(),25,25));assert.equal(s.correctFrame,2);
 s=p016Advance(s,100);assert.equal(s.correctFrame,null);assert.equal(s.feedback,'correct');assert.equal(s.mainFrame,176);
 s=p016CloseFeedback(s);assert.equal(s.phase,'outro');s=p016Advance(s,1);assert.equal(s.mainFrame,177);
 const live=p016Submit(answer(ready(),25,25));const closed=p016CloseFeedback(live);assert.equal(closed.correctFrame,2);
 assert.equal(p016Advance(closed,1).correctFrame,3);
});

test('button down sound and outside release do not accidentally reset or close; replay resets everything',()=>{
 let s=answer(ready(),32,74);s=p016Press(s,'reset');assert.equal(s.pressFrame,1);s=p016Advance(s,4);assert.equal(s.pressFrame,5);
 s=p016Release(s,false);assert.equal(s.shaded,32);s=p016Release(p016Press(s,'reset'),true);assert.equal(s.shaded,0);assert.deepEqual(s.digits,['7','4']);
 s=p016Submit(s);s=p016Press(s,'close');s=p016Release(s,false);assert.equal(s.feedback,'wrong');
 s=p016Release(p016Press(s,'close'),true);assert.equal(s.feedback,'none');assert.deepEqual(s.digits,['','']);
 assert.deepEqual(p016Replay(s),p016Initial(s.seed,1));
});

test('every source coach branch is reachable and subframe partitions preserve assisted resume and parallel clocks',()=>{
 const seen=new Set<number>();
 for(let seed=0;seed<64;seed++){
  const first=p016Submit(answer(ready(seed),0,0));seen.add(first.coachBranch!);
  const closed=p016CloseFeedback(first),second=p016Submit(answer(closed,99,99));
  const reference=p016Elapse(second,P016_ZERO_FRACTIONS,4);
  let s=second,f=P016_ZERO_FRACTIONS;
  for(const dt of [.013,.104,.317,.8,.066,2.7]){const result=p016Elapse(s,f,dt);s=result.state;f=result.fractions;}
  assert.deepEqual(s,reference.state);for(const key of Object.keys(f)as (keyof typeof f)[])assert(Math.abs(f[key]-reference.fractions[key])<1e-7);
  const partial=p016Elapse(first,P016_ZERO_FRACTIONS,.043),correct=p016Submit(answer(p016CloseFeedback(partial.state),25,25));
  const fractions=p016FractionsAfterEvent(partial.state,correct,partial.fractions);
  assert.equal(fractions.coach,partial.fractions.coach);assert.equal(fractions.correct,0);
  assert.equal(p016Elapse(correct,fractions,.02).state.correctFrame,2);
 }
 assert.equal(seen.size,4);
});
