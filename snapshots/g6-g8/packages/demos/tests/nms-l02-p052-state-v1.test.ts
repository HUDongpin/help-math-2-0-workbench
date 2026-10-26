import {test} from 'node:test';import assert from 'node:assert/strict';
import {createP052State,reduceP052,p052CanAnswer,p052WrongCue,type P052State,type P052Event} from '../src/nms-l02-p052-state-v1';
type WithoutEpoch<T>=T extends unknown?Omit<T,'epoch'>:never;
const act=(s:P052State,e:WithoutEpoch<P052Event>)=>reduceP052(s,{...e,epoch:s.epoch});
const ready=()=>act(createP052State(17),{type:'intro-ready'});
test('frame progression does not grant practice or completion by itself',()=>{
 let s=act(createP052State(),{type:'frame',frame:156});
 assert.equal(s.phase,'intro');assert.equal(s.frame,115);assert.equal(p052CanAnswer(s),false);
 s=act(s,{type:'intro-ready'});assert.equal(s.phase,'practice');
});
test('all101 answers: only75 is first-try correct; others get one retry',()=>{
 for(let percent=0;percent<=100;percent++){
  let s=reduceP052(ready(),{epoch:0,type:'value',percent});s=act(s,{type:'submit'});
  assert.equal(s.phase,percent===75?'right':'wrong');assert.equal(s.tryCount,percent===75?0:1);
  assert.equal(s.audioCue,percent===75?'correct':p052WrongCue(17,0));
  assert.equal(act(s,{type:'submit'}),s);
 }
});
test('Reset preserves attempts; second wrong reveals75; explicit close advances',()=>{
 let s=act(ready(),{type:'submit'});s=act(s,{type:'close-feedback'});s=act(s,{type:'reset'});
 assert.equal(s.tryCount,1);assert.equal(s.wrongOrdinal,1);
 s=act(s,{type:'submit'});assert.equal(s.percent,75);assert.equal(s.outcome,'revealed');assert.equal(s.tryCount,0);
 s=act(s,{type:'close-feedback'});assert.equal(s.phase,'outro');assert.equal(s.frame,116);assert.equal(s.audioCue,'outro');
 s=reduceP052(s,{epoch:0,type:'frame',frame:156});assert.equal(s.phase,'outro');
 s=act(s,{type:'outro-ended'});assert.equal(s.phase,'complete');assert.equal(s.percent,75);
});
test('retry then correct retains source attempt counter and correct audio',()=>{
 let s=act(ready(),{type:'submit'});s=act(s,{type:'close-feedback'});
 s=reduceP052(s,{epoch:0,type:'value',percent:75});s=act(s,{type:'submit'});
 assert.equal(s.outcome,'correct');assert.equal(s.tryCount,1);assert.equal(s.audioCue,'correct');
});
test('nested glossary close preserves parent help and exercise state',()=>{
 let s=reduceP052(ready(),{epoch:0,type:'value',percent:42});s=act(s,{type:'open-help'});
 s=reduceP052(s,{epoch:0,type:'open-glossary',term:'Column'});assert.equal(p052CanAnswer(s),false);
 assert.equal(act(s,{type:'close-help'}),s);assert.equal(act(s,{type:'submit'}),s);assert.equal(act(s,{type:'reset'}),s);
 s=act(s,{type:'close-glossary'});assert.equal(s.help,true);assert.equal(s.percent,42);
 s=act(s,{type:'close-help'});assert.equal(p052CanAnswer(s),true);assert.equal(s.percent,42);
});
test('Replay restores complete state and rejects late old-epoch events',()=>{
 let s=act(ready(),{type:'submit'});s=act(s,{type:'replay'});
 assert.deepEqual(s,createP052State(17,1));
 assert.equal(reduceP052(s,{epoch:0,type:'intro-ready'}),s);
 assert.equal(reduceP052(s,{epoch:0,type:'outro-ended'}),s);
});
test('pause gates progress; Replay remains available and clears pause',()=>{
 let s=reduceP052(ready(),{epoch:0,type:'pause',paused:true});assert.equal(act(s,{type:'submit'}),s);
 assert.equal(reduceP052(s,{epoch:0,type:'value',percent:75}),s);
 s=act(s,{type:'replay'});assert.equal(s.paused,false);assert.equal(s.phase,'intro');
});
test('invalid values rejected, previous state unchanged',()=>{
 const s=ready();for(const percent of [-1,101,0.5,NaN,Infinity])assert.throws(()=>reduceP052(s,{epoch:0,type:'value',percent}));
 assert.equal(s.percent,0);assert.throws(()=>createP052State(-1));
 assert.throws(()=>reduceP052(createP052State(),{epoch:0,type:'frame',frame:0}));
});
test('all10100 retry combinations preserve exact two-attempt outcome',()=>{
 for(let first=0;first<=100;first++){
  if(first===75)continue;
  for(let second=0;second<=100;second++){
   let s=act(ready(),{type:'value',percent:first});s=act(s,{type:'submit'});s=act(s,{type:'close-feedback'});
   s=act(s,{type:'value',percent:second});s=act(s,{type:'submit'});
   assert.equal(s.phase,'right');assert.equal(s.percent,75);
   assert.equal(s.outcome,second===75?'correct':'revealed');
   assert.equal(s.tryCount,second===75?1:0);assert.equal(s.wrongOrdinal,second===75?1:2);
  }
 }
});
test('Replay from every phase or nested overlay resets state; stale callbacks cannot advance',()=>{
 const start=createP052State(17),practice=ready(),wrong=act(practice,{type:'submit'});
 const right=act(act(practice,{type:'value',percent:75}),{type:'submit'});
 const outro=act(right,{type:'close-feedback'}),complete=act(outro,{type:'outro-ended'});
 const help=act(practice,{type:'open-help'}),glossary=act(help,{type:'open-glossary',term:'Square'});
 for(const original of [start,practice,wrong,right,outro,complete,help,glossary]){
  const replay=act(original,{type:'replay'});assert.deepEqual(replay,createP052State(17,1));
  for(const type of ['intro-ready','outro-ended','close-feedback'] as const)assert.equal(reduceP052(replay,{epoch:0,type}),replay);
 }
});
test('transitions leave frozen input state intact and source frames never move backwards',()=>{
 const original=Object.freeze(createP052State());const next=act(original,{type:'frame',frame:80});
 assert.equal(original.frame,1);assert.equal(next.frame,80);
 assert.equal(act(next,{type:'frame',frame:20}).frame,80);
 assert.equal(act(next,{type:'outro-ended'}),next);
});
