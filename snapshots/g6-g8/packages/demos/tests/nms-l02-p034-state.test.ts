import test from 'node:test';
import assert from 'node:assert/strict';
import {p034Initial,p034Advance,p034Tick,p034ValueAtSourceX,p034Decimal,p034BeginDrag,p034DragTo,p034EndDrag,p034SetValue,p034PressReset,p034CancelReset,p034Reset,p034OpenTerm,p034CloseTerm,p034Replay} from '../src/nms-l02-p034-state-v1';
const practice=()=>p034Advance(p034Initial(),395);
test('guided source counts include394blank and395initialization before fullhold',()=>{
 for(const [frame,value]of [[98,0],[99,1],[100,2],[108,10],[109,11],[110,12],[164,12],[165,13],[166,14],[167,15],[393,15],[394,0],[395,15]]){
  const s=p034Advance(p034Initial(),frame-1);assert.equal(s.mainFrame,frame);assert.equal(s.value,value);assert.equal(s.phase,'intro');assert.equal(p034SetValue(s,100),s);
 }
 const s=practice();assert.equal(s.phase,'practice');assert.equal(s.mainFrame,395);assert.equal(s.sourceX,-303.65);assert.equal(p034Tick(s),s);assert.equal(p034Advance(s,100000),s);
});
test('source pointer equation covers all101states, clamps release-outside and rejects invalid data',()=>{
 let s=p034BeginDrag(practice());const seen=new Set<number>();for(let i=0;i<=2490;i++){const x=-339+i/10;s=p034DragTo(s,x);assert.equal(s.value,Math.round((x/50+5)*40/2)+36);seen.add(s.value);}
 assert.deepEqual([...seen],Array.from({length:101},(_,i)=>i));assert.equal(p034DragTo(s,-1000).value,0);assert.equal(p034DragTo(s,1000).value,100);assert.equal(p034DragTo(s,NaN),s);assert.throws(()=>p034ValueAtSourceX(Infinity));
 s=p034EndDrag(s);assert.equal(s.value,100);assert.equal(p034DragTo(s,-339),s);assert.equal(p034BeginDrag(p034Initial()).dragging,false);
 for(let value=0;value<=100;value++){const q=p034SetValue(s,value);assert.equal(p034ValueAtSourceX(q.sourceX!),value);assert.equal(p034Decimal(value),value===100?'1.00':'0.'+String(value).padStart(2,'0'));}
});
test('reset press cue is independent from release action and cancel retains the value',()=>{
 let s=p034SetValue(practice(),73);s=p034PressReset(s);assert.equal(s.value,73);assert.equal(s.resetCueSerial,1);assert.equal(p034PressReset(s),s);assert.equal(p034SetValue(s,0),s);
 s=p034CancelReset(s);assert.equal(s.value,73);assert.equal(s.resetCount,0);s=p034PressReset(s);assert.equal(s.resetCueSerial,2);s=p034Reset(s);assert.equal(s.value,0);assert.equal(s.sourceX,-339.15);assert.equal(s.resetCount,1);assert.equal(s.resetPressed,false);assert.equal(p034Reset(p034Initial()).resetCount,0);
});
test('glossary readiness uses full readable Decimal, pauses ticks and cancels gestures',()=>{
 const early=p034Advance(p034Initial(),337);assert.equal(p034OpenTerm(early),early);const ready=p034Advance(p034Initial(),338);const term=p034OpenTerm(ready);assert(term.termOpen);assert.equal(p034Tick(term),term);
 let s=p034OpenTerm(p034PressReset(practice()));assert.equal(s.resetPressed,false);assert.equal(p034Reset(s),s);s=p034CloseTerm(s);assert.equal(s.value,15);assert.equal(s.phase,'practice');
 const dragging=p034OpenTerm(p034BeginDrag(practice()));assert.equal(dragging.dragging,false);
});
test('Replay resets every interactive field and rejects invalid identity/values',()=>{
 const s=p034OpenTerm(p034PressReset(p034SetValue(practice(),100)));assert.deepEqual(p034Replay(s),p034Initial(0,1));assert(Object.isFrozen(p034Replay(s)));for(const seed of [-1,1.1,NaN,4294967296])assert.throws(()=>p034Initial(seed));for(const value of [-1,1.1,NaN,101]){assert.throws(()=>p034Decimal(value));const q=practice();assert.equal(p034SetValue(q,value),q);}assert.throws(()=>p034Advance(p034Initial(),-1));
});
