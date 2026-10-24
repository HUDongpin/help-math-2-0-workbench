import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {readIn004Source} from '../../../../scripts/build-g4-l4-in004-interaction.mjs';
import {createIn004Practice,advanceIn004Practice,reduceIn004Practice,type In004PracticeState} from './g4-l4-in004-practice';
const source=readIn004Source();
// Execute the original frame/function expressions with only navigation and
// randomness supplied by the test. The queue rule is separately exercised as
// AVM1 GotoExpression by the pinned synthetic local Ruffle receipt.
function oracle(seed:number){
 let current='Q1',random=seed>>>0;const queue:string[]=[],visits:string[]=[];const global:any={};const parent:any={_global:global,txtAnswer:{htmlText:''},BtnNewProblem:{enabled:false},Mc_NumLine1:{_visible:false},Mc_Wrong_Feed:{_visible:false},stop(){},random(n:number){random=(Math.imul(random,1664525)+1013904223)>>>0;return Math.floor(random/4294967296*n);},gotoAndStop(q:string){if(q!==current){current=q;queue.push(q);}}};
 const context=vm.createContext(parent,{codeGeneration:{strings:false,wasm:false}});
 function frame(q:string){visits.push(q);new vm.Script(source.questions.find((q0:any)=>q0.id===q).frameAction).runInContext(context,{timeout:100});}
 function flush(){let limit=0;while(queue.length){assert(++limit<=3);frame(queue.shift()!);}}
 function snapshot(){return {question:current,random,remaining:Array.from(global.quizLabelArray),answer:global.answer,count:global.quizDragCount,visible:parent.Mc_NumLine1._visible,wrong:parent.Mc_Wrong_Feed._visible,visits:[...visits]};}
 frame('Q1');flush();return {snapshot,setWrong(v:boolean){parent.Mc_Wrong_Feed._visible=v;},next(){visits.length=0;new vm.Script('doGetRandomQuiz();').runInContext(context,{timeout:100});flush();return snapshot();}};
}
const receiptBytes=fs.readFileSync('work/typography-v1/g4-l4-in004-number-line-practice/frame-navigation-r1/receipt.json');assert.equal(createHash('sha256').update(receiptBytes).digest('hex'),'78295903e29b9951720a5a37b31827f70f26cac41f8f80d6641a62319b2f8825');const receipt=JSON.parse(receiptBytes.toString());
test('navigation queue assumption is pinned to two actual local AVM1 probe traces',()=>{assert.equal(receipt.status,'passed');assert.deepEqual(receipt.results.map((r:any)=>[r.kind,r.traces.filter((t:string)=>t==='ENTER-Q1').length]),[['same-frame',1],['cross-frame',2]]);});
test('initial and 200 subsequent source draws match authored arrays, Q1 resets and label/answer ownership',()=>{
 let compared=0,q1Reentries=0;
 for(const seed of [0,1,17,12345,0xffffffff]){
  const o=oracle(seed);let s=createIn004Practice(seed);
  const compare=()=>{const v=o.snapshot();assert.equal(s.question,v.question);assert.equal(s.random,v.random);assert.deepEqual(s.remaining,v.remaining);assert.equal(s.answer,'');assert.equal(s.count,0);assert.equal(s.wrongOpen,v.wrong);const expected=source.questions.find((q:any)=>q.id===s.question);assert(expected);assert.equal(v.answer,['6','10','3','9','4','6','3','2','3'][Number(s.question.slice(1))-1]);};compare();
  for(let n=0;n<40;n++){const wrong=n%2===0;o.setWrong(wrong);s=advanceIn004Practice({...s,wrongOpen:wrong,newProblemEnabled:true});o.next();compare();if(s.lastNavigation==='q1-reentry'){q1Reentries++;assert.equal(s.lastDraws.length,2);assert.equal(s.remaining.length,8);}compared++;}
 }
 assert.equal(compared,200);assert(q1Reentries>0);
});
function complete(s:In004PracticeState){
 for(const [card,target] of [['Mc_Jump_1','Mc_NumLine'],['Mc_Jump_3','Mc_NumLine1']] as const){s=reduceIn004Practice(s,{type:'press',card}).state;s=reduceIn004Practice(s,{type:'drop',card,target}).state;}
 return reduceIn004Practice(s,{type:'feedback-complete',kind:'final',token:s.finalToken!,frame:25}).state;
}
test('New Problem requires current final completion and pause remains inert',()=>{let s=createIn004Practice(17);assert.equal(advanceIn004Practice(s),s);s=complete(s);assert(s.newProblemEnabled);assert.equal(advanceIn004Practice(s,true),s);const n=advanceIn004Practice(s);assert.equal(n.newProblemEnabled,false);assert.equal(n.visit,s.visit+1);assert.equal(n.finalToken,null);assert.equal(reduceIn004Practice(n,{type:'feedback-complete',kind:'final',token:s.finalToken!,frame:25}).state,n);});
test('empty-bag draw of the current frame preserves source placed arrows and visible target',()=>{
 // Find a deterministic refill branch; do not force a non-source test override.
 let chosen:In004PracticeState|undefined;
 for(let seed=0;seed<20000;seed++){const s=complete(createIn004Practice(seed));const n=advanceIn004Practice({...s,remaining:[]});if(n.lastNavigation==='same-frame'){chosen=n;assert.deepEqual(n.placed,s.placed);assert.deepEqual(n.positions,s.positions);assert(n.secondVisible);assert.equal(n.answer,'');assert.equal(n.count,0);assert.equal(n.newProblemEnabled,false);break;}}
 assert(chosen,'reachable same-frame refill branch');
});
test('fresh practice on Replay resets bag, question state and feedback identity deterministically',()=>{const first=createIn004Practice(17,3),done=complete(first),replay=createIn004Practice(17,4);assert.equal(replay.question,first.question);assert.deepEqual(replay.remaining,first.remaining);assert.deepEqual(replay.placed,[]);assert.equal(replay.replay,4);assert.equal(reduceIn004Practice(replay,{type:'feedback-complete',kind:'final',token:done.finalToken!,frame:25}).state,replay);});
