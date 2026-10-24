import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {createZogXQuestionPool,drawZogXQuestion,type ZogXQuestionPool} from './g4-l4-zog-x-question-pool';
import {G4_L4_ZOG_X_GAME as game} from './generated/g4-l4-zog-x-game-config';

const recipe=JSON.parse(fs.readFileSync('scripts/inputs/typography-v1/g4-l4-zog-x/game.json','utf8'));
for(const r of Object.values(recipe.sources)as {path:string;sha256:string}[]){
 assert.equal(createHash('sha256').update(fs.readFileSync(r.path)).digest('hex'),r.sha256);
}
const code=gunzipSync(fs.readFileSync(recipe.sources.scripts.path)).toString();
const sections=new Map([...code.matchAll(/^===== (.+) =====\r?\n([\s\S]*?)(?=^===== |(?![\s\S]))/gm)].map(m=>[m[1],m[2].trim()]));
const init=sections.get('DefineSprite_841/frame_591/DoAction.as')!;
const body=init.slice(0,init.indexOf('\nstop();'));
assert(body.startsWith('function doGetRandomQuiz()'));
assert(!/\b(?:require|process|globalThis|constructor|prototype|__proto__|import|Function|eval)\b/.test(body));

function oracle(seed:number){
 let random=seed>>>0,frame=591;
 const global:any={quizSection:true,totQuizCount:0,startGame:false,correctSelect:0,quizLabelArray:Array.from({length:10},(_,i)=>'Q'+(i+1)),quizCorrectLabelArray:[]};
 const sandbox:any={_global:global,random(n:number){random=(Math.imul(random,1664525)+1013904223)>>>0;return Math.floor(random/4294967296*n);},gotoAndStop(label:string){frame=label==='Final'?602:591+Number(label.slice(1));}};
 const context=vm.createContext(sandbox,{codeGeneration:{strings:false,wasm:false}});
 const run=(s:string)=>new vm.Script(s).runInContext(context,{timeout:100});run(body);
 return {draw(){run('doGetRandomQuiz();');},rememberCorrect(){global.correctSelect++;global.quizCorrectLabelArray.push(global.qLabelName);},snapshot(){return {random,frame,question:global.qLabelName?Number(global.qLabelName.slice(1)):null,remaining:Array.from(global.quizLabelArray,(q:any)=>Number(q.slice(1))),correctQuestions:Array.from(global.quizCorrectLabelArray,(q:any)=>Number(q.slice(1))),correctSelect:global.correctSelect,totalQuizCount:global.totQuizCount,quizSection:global.quizSection,startGame:global.startGame};}};
}
function equal(s:ZogXQuestionPool,o:ReturnType<typeof oracle>){
 const {seed,...actual}=s;assert.deepEqual(actual,o.snapshot());
}

test('GS002 draw/refill/reset matches the authored function over 2500 draws, with correct answers excluded only on refill',()=>{
 let compared=0,refills=0;
 for(const seed of [0,1,17,12345,0xffffffff]){
  const o=oracle(seed);let s=createZogXQuestionPool(seed);equal(s,o);
  for(let i=0;i<500;i++){
   if(s.question!==null&&i%5===0&&s.correctSelect<7){
    s={...s,correctSelect:s.correctSelect+1,correctQuestions:[...s.correctQuestions,s.question]};o.rememberCorrect();
   }
   const refill=s.remaining.length===0;if(refill)refills++;
   s=drawZogXQuestion(s);o.draw();equal(s,o);compared++;
   assert(!s.correctQuestions.includes(s.question!));
   if(refill)assert.equal(s.totalQuizCount,1);
  }
 }
 assert.equal(compared,2500);assert(refills>100);
});

test('source eight-correct branch enters Final without consuming another random number or refilling the bag',()=>{
 const o=oracle(73);let s=createZogXQuestionPool(73);
 for(let i=0;i<8;i++){
  s=drawZogXQuestion(s);o.draw();equal(s,o);
  s={...s,correctSelect:s.correctSelect+1,correctQuestions:[...s.correctQuestions,s.question!]};o.rememberCorrect();
 }
 const before=s;s=drawZogXQuestion(s);o.draw();equal(s,o);
 assert.equal(s.frame,602);assert.equal(s.quizSection,false);assert.equal(s.totalQuizCount,9);
 assert.equal(s.random,before.random);assert.deepEqual(s.remaining,before.remaining);
});

test('Replay restores the original pool and seed; these helpers do not advance any animation clock',()=>{
 let s=createZogXQuestionPool(123),t=createZogXQuestionPool(123);
 for(let i=0;i<30;i++){s=drawZogXQuestion(s);t=drawZogXQuestion(t);assert.deepEqual(s,t);}
 assert.deepEqual(createZogXQuestionPool(123),{seed:123,random:123,remaining:[1,2,3,4,5,6,7,8,9,10],correctQuestions:[],correctSelect:0,totalQuizCount:0,question:null,frame:591,quizSection:true,startGame:false});
});

test('source answer actions and frame-5 draw timing remain distinct from feedback completion, including the eighth stage',()=>{
 for(const q of game.questions){
  assert.deepEqual(q.answers.map(a=>a.id),['A','B','C','D']);
  for(const a of q.answers){const code=sections.get(`DefineButton2_${a.sourceButtonId}/BUTTONCONDACTION on(release).as`)!;assert.equal(code.includes('_global.correctSelect++'),a.correct);}
 }
 for(const f of game.feedback){
  const code=sections.get(`DefineSprite_${f.frameDomain.slice(7)}/frame_5/DoAction.as`)!;
  assert(code.includes('_global.quizCorrectLabelArray.push(_global.qLabelName)'));
  assert.equal(code.includes('_parent.doGetRandomQuiz()'),f.stage<8);
  assert.equal(f.drawNextAtFrame,f.stage<8?5:null);
 }
 const final=sections.get('DefineSprite_642/frame_240/DoAction.as')!;assert(final.includes('_global.quizSection = false;'));assert(final.includes('_parent.gotoAndStop("Final")'));
 const close=sections.get('DefineButton2_644/BUTTONCONDACTION on(release).as')!;
 assert(close.includes('_parent.gotoAndPlay(65)'));assert(close.includes('_parent._parent.doGetRandomQuiz()'));
 assert.equal(game.wrongFeedback.declaredFrames,60);
 assert(game.wrongFeedback.disposition.includes('unresolved'));
});
