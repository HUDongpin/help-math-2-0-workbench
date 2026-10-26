import test from 'node:test';import assert from 'node:assert/strict';
import {p034InitialState,p034Reduce,p034CanPlay,type P034State,type P034Tile,type P034Target}from'./alg-l07-p034-state-v1';
const send=(s:P034State,event:Omit<Parameters<typeof p034Reduce>[1],'epoch'>)=>p034Reduce(s,{...event,epoch:s.epoch}as Parameters<typeof p034Reduce>[1]);
const quiz=()=>send(send(p034InitialState(),{type:'play'}),{type:'advance-main',frame:166}as never);
const press=(s:P034State,tile:P034Tile)=>p034Reduce(s,{type:'press',tile,epoch:s.epoch});
const drop=(s:P034State,target:P034Target|null)=>p034Reduce(s,{type:'drop',target,epoch:s.epoch});
const advance=(s:P034State,frame:number)=>p034Reduce(s,{type:'advance-feedback',frame,epoch:s.epoch});
test('main holds at166; resume and inspection-like advance cannot bypass four drops',()=>{
 const s=quiz();assert.equal(s.mainFrame,166);assert.equal(s.phase,'quiz-held');assert(!p034CanPlay(s));assert.strictEqual(send(s,{type:'play'}),s);
 assert.strictEqual(p034Reduce(s,{type:'advance-main',frame:484,epoch:s.epoch}),s);
});
test('both4 tiles support either endpoint and every valid ordering waits for coach20',()=>{
 function orders<T>(xs:T[]):T[][]{return xs.length?xs.flatMap((x,i)=>orders(xs.filter((_,j)=>j!==i)).map(rest=>[x,...rest])):[[]];}
 let count=0;
 for(const swapped of [false,true])for(const sequence of orders<[P034Tile,P034Target]>([['Src_3','Tar_3'],['Src_2','Tar_2'],['Src_1',swapped?'Tar_4':'Tar_1'],['Src_4',swapped?'Tar_1':'Tar_4']])){
  let s=quiz();for(let i=0;i<sequence.length;i++){
   const[tile,target]=sequence[i];s=drop(press(s,tile),target);assert.equal(s.quizDragCount,i+1);assert.equal(s.placed[target],tile);assert.equal(s.feedback?.spriteId,62);assert.equal(s.mainFrame,166);
   assert.strictEqual(press(s,tile),s);s=advance(s,19);assert(s.quizSection);s=advance(s,20);
   if(i<3){assert(s.quizSection);assert.equal(s.phase,'feedback');s=advance(s,21);assert.equal(s.phase,'quiz-held');assert.equal(s.quizDragCount,i+1);}
   else{assert.equal(s.phase,'postquiz');assert.equal(s.quizDragCount,0);assert.equal(Object.keys(s.placed).length,4);assert(s.playing);assert(!s.quizSection);}
  }count++;
 }assert.equal(count,48);
});
test('wrong and outside drops return to bank with no two-attempt skip; Close leaves coach running',()=>{
 let s=quiz();for(let i=0;i<4;i++){
  s=drop(press(s,'Src_2'),i%2?'Tar_1':null);assert(s.popup);assert.equal(s.feedback?.spriteId,60);assert.equal(s.quizDragCount,0);assert.deepEqual(s.placed,{});
  const f=s.feedback;s=send(s,{type:'close-popup'});assert(!s.popup);assert.strictEqual(s.feedback,f);assert(s.playing);
  s=advance(s,21);assert.equal(s.phase,'quiz-held');assert.equal(s.mainFrame,166);
 }
});
test('press interrupts either coach, hides popup and rejects stale completion',()=>{
 let s=drop(press(quiz(),'Src_2'),'Tar_1');const stale=s.epoch;s=press(s,'Src_3');assert(!s.feedback);assert(!s.popup);assert.equal(s.selected,'Src_3');assert(!s.playing);
 assert.strictEqual(p034Reduce(s,{type:'advance-feedback',frame:21,epoch:stale}),s);
 s=drop(s,'Tar_3');assert.equal(s.quizDragCount,1);s=press(s,'Src_1');assert(!s.feedback);assert.equal(s.placed.Tar_3,'Src_3');
 s=drop(s,'Tar_1');s=press(s,'Src_4');s=drop(s,'Tar_1');assert(s.popup);assert.equal(s.quizDragCount,2);assert.equal(s.placed.Tar_1,'Src_1');
});
test('glossary holds current coach; closing stays paused;484 is a terminal stop',()=>{
 let s=drop(press(quiz(),'Src_3'),'Tar_3');s=p034Reduce(s,{type:'open-glossary',term:'Output',epoch:s.epoch});assert.equal(s.glossary,'Output');assert(!s.playing);
 assert.strictEqual(advance(s,20),s);s=send(s,{type:'close-glossary'});assert(!s.playing);assert.equal(s.feedback?.frame,2);
 for(const [tile,target]of [['Src_2','Tar_2'],['Src_1','Tar_1'],['Src_4','Tar_4']]as const)s=drop(press(s,tile),target);
 s=advance(s,20);s=p034Reduce(s,{type:'advance-main',frame:484,epoch:s.epoch});assert.equal(s.phase,'ended');assert.equal(s.mainFrame,484);assert(!s.playing);assert(!p034CanPlay(s));assert(!s.lessonCompleted);
 assert.strictEqual(send(s,{type:'play'}),s);const replay=send(s,{type:'replay'});assert.equal(replay.mainFrame,1);assert.equal(replay.replay,1);assert.deepEqual(replay.placed,{});assert(!replay.popup);assert(!replay.feedback);
});
