import test from'node:test';import assert from'node:assert/strict';
import{p052InitialState,p052Reduce,p052CardAppearance,type P052State,type P052Card,type P052Action}from'./alg-l07-p052-state-v1';
function step(s:P052State,a:Omit<P052Action,'epoch'>|Record<string,unknown>){return p052Reduce(s,{...a,epoch:s.epoch}as P052Action);}
function pair(s:P052State,n:number,reverse=false){s=step(s,{type:'choose',card:`Mc${n}_${reverse?2:1}`});return step(s,{type:'choose',card:`Mc${n}_${reverse?1:2}`});}
function end(s:P052State,id:157|170){return step(s,{type:'advance-feedback',id,frame:id===170?27:28,generation:s.feedback[id]!.generation});}
test('P052 both source entry levels complete only after six distinct right feedback terminals',()=>{
 for(const level of[1,2]as const){let s=p052InitialState(level);assert.equal(s.mainFrame,level===1?2:4);
 for(let n=1;n<=6;n++){s=pair(s,n,n%2===0);assert.equal(s.score,n*10);assert.equal(s.phase,'game');assert.equal(s.quizSection,true);assert.equal(s.completedFeedbackCount,n-1);
 const f=s.feedback[170]!;s=step(s,{type:'advance-feedback',id:170,frame:26,generation:f.generation});assert.equal(s.phase,'game');s=end(s,170);assert.equal(s.phase,n===6?'complete':'game');}
 assert.equal(s.mainFrame,level===1?3:5);assert.equal(s.lessonCompleted,false);assert.equal(s.quizSection,false);assert.equal(s.completedFeedbackCount,0);
 assert.equal(step(s,{type:'start'}),s);s=step(s,{type:'select-level',level:level===1?2:1});s=step(s,{type:'start'});assert.equal(s.score,0);assert.equal(s.level,level===1?2:1);assert.deepEqual(s.matched,[]);assert.equal(s.selected,null);assert.equal(s.epoch,1);
 }
});
test('P052 wrong choices and the same card twice subtract two without a floor and clear only selection',()=>{
 let s=p052InitialState();for(const second of['Mc1_1','Mc2_1','Mc2_2']as P052Card[]){s=step(s,{type:'choose',card:'Mc1_1'});assert.equal(p052CardAppearance(s,'Mc1_1').sourceFrame,2);s=step(s,{type:'choose',card:second});assert.equal(s.selected,null);assert.equal(s.cardsEnabled,false);assert.equal(step(s,{type:'choose',card:'Mc3_1'}),s);assert.equal(s.feedback[157]?.frame,2);s=end(s,157);}
 assert.equal(s.score,-6);assert.deepEqual(s.matched,[]);assert.equal(s.completedFeedbackCount,0);
});
test('P052 reveal uses source 100 ms steps, includes negative alpha, and never rematches invisible cards',()=>{
 let s=pair(p052InitialState(),1);assert.equal(p052CardAppearance(s,'Mc1_1').revealed,false);
 for(const [ms,alpha,visible]of[[99,100,true],[1,60,true],[100,20,true],[100,-20,true],[100,-20,false]]as const){s=step(s,{type:'advance-fades',elapsedMs:ms,generation:s.selectionSerial});const a=p052CardAppearance(s,'Mc1_1');assert.equal(a.sourceAlpha,alpha);assert.equal(a.visible,visible);assert.equal(a.opacity,Math.max(0,alpha)/100);}
 s=end(s,170);assert.equal(step(s,{type:'choose',card:'Mc1_1'}),s);assert.equal(p052CardAppearance(s,'Mc1_2').revealed,true);
});
test('P052 directions close follows source enableMc, including feedback overlap and retrigger invalidation',()=>{
 let s=pair(p052InitialState(),1);const old=s.feedback[170]!;s=step(s,{type:'open-directions'});assert.equal(step(s,{type:'choose',card:'Mc2_1'}),s);s=step(s,{type:'close-directions'});assert.equal(s.cardsEnabled,true);
 s=pair(s,2);assert.equal(s.score,20);assert.equal(s.feedback[170]!.generation,old.generation+1);assert.equal(step(s,{type:'advance-feedback',id:170,frame:27,generation:old.generation}),s);s=end(s,170);assert.equal(s.completedFeedbackCount,1);
 s=step(s,{type:'choose',card:'Mc3_1'});s=step(s,{type:'choose',card:'Mc4_1'});s=step(s,{type:'open-directions'});s=step(s,{type:'close-directions'});s=pair(s,3);assert(s.feedback[157]?.playing&&s.feedback[170]?.playing);s=end(s,157);assert.equal(s.cardsEnabled,true);assert.equal(s.completedFeedbackCount,1);s=end(s,170);assert.equal(s.completedFeedbackCount,2);
});
test('P052 popup retains a first selection; modern host pause freezes feedback/fades; resume preserves values',()=>{
 let s=step(p052InitialState(2),{type:'choose',card:'Mc2_2'});s=step(s,{type:'open-directions'});s=step(s,{type:'close-directions'});assert.equal(s.selected,'Mc2_2');s=step(s,{type:'choose',card:'Mc2_1'});s=step(s,{type:'pause'});assert.equal(end(s,170),s);assert.equal(step(s,{type:'advance-fades',elapsedMs:400,generation:s.selectionSerial}),s);s=step(s,{type:'play'});s=end(s,170);assert.equal(s.score,10);
});
test('P052 Replay and leave invalidate delayed feedback, restore entry level and do not complete the lesson',()=>{
 let s=pair(p052InitialState(2),5),old=s;const f=s.feedback[170]!;s=step(s,{type:'replay'});assert.equal(s.level,2);assert.equal(s.replay,1);assert.equal(s.score,0);assert.equal(p052Reduce(s,{type:'advance-feedback',epoch:old.epoch,id:170,frame:27,generation:f.generation}),s);assert.deepEqual(s.feedback,{});s=pair(s,2);old=s;s=step(s,{type:'leave'});assert.equal(s.phase,'left');assert.deepEqual(s.fades,[]);assert.equal(p052Reduce(s,{type:'choose',card:'Mc1_1',epoch:old.epoch}),s);assert.equal(s.lessonCompleted,false);
});
