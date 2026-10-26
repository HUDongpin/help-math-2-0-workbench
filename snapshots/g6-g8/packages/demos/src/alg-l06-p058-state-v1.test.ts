import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {p058InitialState,p058Reduce,type P058State,type P058Event,type P058Choice} from './alg-l06-p058-state-v1';
import {P058_BEHAVIOR_SOURCE as B} from './generated/alg-l06-p058-behavior-v1';
import {p058SourceState} from './alg-l06-p058-source-v1';
import {P058NativeV1} from './alg-l06-p058-native-v1';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const raw='/Volumes/American Dream/hudongpin/g678-p058-source-extraction-20261003-v1/ffdec-export/scripts/';
const action=(name:string)=>fs.readFileSync(raw+name,'utf8').replace(/\s/g,'');
const step=(s:P058State,e:Omit<P058Event,'epoch'>,seed=0)=>p058Reduce(s,{...e,epoch:s.epoch} as P058Event,seed);
const act=(s:P058State,type:P058Event['type'],extra:Record<string,unknown>={},seed=0)=>step(s,{type,...extra} as Omit<P058Event,'epoch'>,seed).state;
function atQuiz(){let s=act(p058InitialState(),'play');for(const frame of [403,571,720,878]){
 s=act(s,'advance-main',{frame:951});assert.equal(s.mainFrame,frame);s=act(s,'continue-step');
}return act(s,'advance-main',{frame:951});}
function selected(choice:P058Choice,seed=0,state=atQuiz()){
 const pending=act(state,'choose',{choice},seed);assert.equal(pending.quizTryCount,state.quizTryCount);
 return act(pending,'resolve-host-feedback',{},seed);
}
const terminal:Record<number,number>={97:33,76:32,62:31,36:28,129:31,115:28,140:29};
function finish(s:P058State){return act(s,'advance-feedback',{frame:terminal[s.feedback!.spriteId],generation:s.feedback!.generation});}

test('raw SWF/script evidence fixes the answer and terminal-count rule independently',()=>{
 const swf=fs.readFileSync('migrations/shared-alg001-l06-p058/source-v1/L6TS09.swf');
 assert.equal(createHash('sha256').update(swf).digest('hex'),'79bd9d4896d7b297a4df928711c92f1bd2b9f78b976f8399fc9e640d9704c4d3');
 assert.equal(action('DefineButton2_255/BUTTONCONDACTION on(release).as'),'on(release){_root.disableQuizButton();_root.showRightFeed();NMHBtn.enabled=false;}');
 assert(!action('DefineButton2_256/BUTTONCONDACTION on(release).as').includes('quizTryCount'));
 assert(action('DefineSprite_129/frame_31/DoAction.as').includes('this.gotoAndStop(1);_global.quizTryCount++;'));
 assert.deepEqual(B.options.map(o=>[o.letter,o.value,o.right]),[['A','The strength is staying the same.',false],['B','The strength is getting higher.',false],['C','The strength is getting lower.  ',true],['D','The strength is at its lowest.',false]]);
});

test('main clock clamps every authored step and final quiz; Play cannot bypass a source hold',()=>{
 let s=act(p058InitialState(),'play');for(const expected of [403,571,720,878]){
  s=act(s,'advance-main',{frame:951});assert.equal(s.phase,'step-held');assert.equal(s.mainFrame,expected);
  assert(s.quizSection);assert(!s.mainPlaying);assert(!step(s,{type:'play'}).accepted);
  assert(!step(s,{type:'choose',choice:'C'} as Omit<P058Event,'epoch'>).accepted);
  s=act(s,'continue-step');assert(s.mainPlaying);assert(!s.quizSection);
 }
 s=act(s,'advance-main',{frame:951});assert.equal(s.mainFrame,934);assert.equal(s.phase,'quiz-held');assert.equal(s.quizTryCount,0);
 assert(!step(s,{type:'play'}).accepted);
});

test('first two source step clicks resume main; last two open and close only their boxes',()=>{
 let s=act(p058InitialState(),'play');for(const frame of [403,571]){
  s=act(s,'advance-main',{frame});s=act(s,'step-click');assert.equal(s.phase,'main');assert(s.mainPlaying);
 }
 for(const [frame,sid,closeButton]of [[720,242,241],[878,252,251]]){
  s=act(s,'advance-main',{frame});s=act(s,'step-click');assert.equal(s.stepBox?.spriteId,sid);assert.equal(s.stepBox?.frame,1);
  assert(!step(s,{type:'continue-step'}).accepted);assert(!step(s,{type:'close-box'}).accepted);
  s=act(s,'advance-box',{frame:20,generation:s.stepBox!.generation});assert.equal(s.stepBox?.frame,15);assert.equal(s.mainFrame,frame);
  assert(!step(s,{type:'play'}).accepted);
  assert.equal(action(`DefineButton2_${closeButton}/BUTTONCONDACTION on(release).as`),'on(release){_global.quizSection=false;play();_parent.NMHBtn.enabled=true;}');
  s=act(s,'close-box');assert(!s.quizSection);assert(!s.mainPlaying);assert(s.stepBox?.playing);
  s=act(s,'advance-box',{frame:20,generation:s.stepBox!.generation});assert.equal(s.stepBox?.frame,1);assert.equal(s.phase,'step-held');assert.equal(s.mainFrame,frame);
  assert(!step(s,{type:'play'}).accepted);s=act(s,'continue-step');assert.equal(s.stepBox,null);assert(s.mainPlaying);
 }
});

test('all three wrong variants count at their actual terminal; second wrong resets and resumes',()=>{
 const seen=new Set<number>();for(let seed=0;seed<48;seed++){
  let s=selected('A',seed);seen.add(s.feedback!.spriteId);const end=terminal[s.feedback!.spriteId];
  assert.equal(s.quizTryCount,0);assert.equal(s.feedback?.frame,2);
  s=act(s,'advance-feedback',{frame:end-1,generation:s.feedback!.generation});assert.equal(s.quizTryCount,0);assert(s.feedback!.playing);
  s=finish(s);assert.equal(s.phase,'quiz-held');assert.equal(s.quizTryCount,1);assert.equal(s.mainFrame,934);assert(s.quizButtonsEnabled&&s.nmhButtonEnabled);
  s=selected('D',seed,s);assert.equal(s.quizTryCount,1);s=finish(s);assert.equal(s.quizTryCount,0);assert.equal(s.phase,'main');assert(s.mainPlaying);assert(!s.quizSection);
  assert(!step(s,{type:'choose',choice:'B'} as Omit<P058Event,'epoch'>).accepted);
 }
 assert.deepEqual([...seen].sort((a,b)=>a-b),[115,129,140]);
});

test('all four right variants continue while preserving a prior wrong count',()=>{
 const seen=new Set<number>();for(let seed=0;seed<48;seed++)for(const priorWrong of [false,true]){
  let s=priorWrong?finish(selected('B',seed)):atQuiz();s=selected('C',seed,s);seen.add(s.feedback!.spriteId);
  assert.equal(s.feedback!.kind,'right');s=finish(s);assert.equal(s.quizTryCount,priorWrong?1:0);
  assert(s.mainPlaying);assert.equal(s.mainFrame,934);assert.equal(s.phase,'main');assert(!s.quizSection);assert(!s.quizButtonsEnabled);
  s=act(s,'advance-main',{frame:935});assert.equal(s.mainFrame,935);s=act(s,'advance-main',{frame:951});
  assert.equal(s.phase,'engineering-end-held');assert.equal(s.lessonCompleted,false);assert(!s.mainPlaying);
 }
 assert.deepEqual([...seen].sort((a,b)=>a-b),[36,62,76,97]);
});

test('help opens function popup, blocks answer input, and dictionary close preserves its parent',()=>{
 let s=finish(selected('D'));s=act(s,'open-help');assert(s.helpVisible);assert.equal(s.quizTryCount,1);assert(!s.quizButtonsEnabled);
 assert(!step(s,{type:'choose',choice:'C'} as Omit<P058Event,'epoch'>).accepted);
 s=act(s,'glossary',{buttonId:171,ownerSpriteId:268});assert.equal(s.glossaryTerm,'Function');
 assert(!step(s,{type:'close-help'}).accepted);s=act(s,'close-glossary');assert(s.helpVisible);assert(!s.mainPlaying);
 s=act(s,'close-help');assert(!s.helpVisible);assert(s.quizButtonsEnabled);assert.equal(s.quizTryCount,1);
 s=selected('C',0,s);assert(!step(s,{type:'open-help'}).accepted);
});

test('glossary ownership and source frame windows reject offstage angle vocabulary',()=>{
 let s=p058InitialState();assert(!step(s,{type:'glossary',buttonId:172,ownerSpriteId:285}as Omit<P058Event,'epoch'>).accepted);
 s=act(s,'play');s=act(s,'advance-main',{frame:18});s=act(s,'glossary',{buttonId:172,ownerSpriteId:285});assert.equal(s.glossaryTerm,'Time');assert(!s.mainPlaying);
 s=act(s,'close-glossary');assert(!s.mainPlaying);
 assert(!step(s,{type:'glossary',buttonId:270,ownerSpriteId:268}as Omit<P058Event,'epoch'>).accepted);
 assert(!step(s,{type:'glossary',buttonId:999,ownerSpriteId:285}as Omit<P058Event,'epoch'>).accepted);
});

test('pause at box entry resumes; content holds remain held, and stale box callbacks are rejected',()=>{
 let s=act(p058InitialState(),'play');for(const frame of [403,571]){s=act(s,'advance-main',{frame});s=act(s,'continue-step');}
 s=act(s,'advance-main',{frame:720});s=act(s,'step-click');const old=s.stepBox!.generation;
 s=act(s,'pause');assert.equal(s.stepBox!.frame,1);s=act(s,'play');assert(s.stepBox!.playing);
 s=act(s,'advance-box',{frame:15,generation:old});s=act(s,'close-box');s=act(s,'advance-box',{frame:20,generation:old});
 s=act(s,'step-click');assert(s.stepBox!.generation>old);
 assert(!step(s,{type:'advance-box',frame:15,generation:old}as Omit<P058Event,'epoch'>).accepted);
});

test('Replay and leave invalidate delayed selection, feedback and main callbacks and reset full state',()=>{
 let s=selected('A',12);const oldEpoch=s.epoch,oldGeneration=s.feedback!.generation;
 s=act(s,'pause');assert(!step(s,{type:'advance-feedback',frame:31,generation:oldGeneration}as Omit<P058Event,'epoch'>).accepted);
 s=act(s,'play');assert(s.feedback!.playing);const reset=step(s,{type:'replay'});assert.equal(reset.cleanup.length,3);
 s=reset.state;assert.deepEqual(s,p058InitialState(oldEpoch+1));
 assert(!p058Reduce(s,{type:'advance-feedback',frame:31,generation:oldGeneration,epoch:oldEpoch}).accepted);
 s=act(s,'leave');assert.equal(s.phase,'left');assert(!step(s,{type:'play'}).accepted);
 assert(!step(s,{type:'replay'}).accepted);assert.equal(s.lessonCompleted,false);
});

test('P058 right action resumes parent before resetting feedback; shared transition retires it atomically',()=>{
 for(const [id,end]of [[97,33],[76,32],[62,31],[36,28]])
  assert.equal(action(`DefineSprite_${id}/frame_${end}/DoAction.as`),'stop();_root.disableQuizButton();_global.quizSection=false;_parent.play();this.gotoAndStop(1);');
 const s=selected('C');const result=step(s,{type:'advance-feedback',frame:terminal[s.feedback!.spriteId],generation:s.feedback!.generation}as Omit<P058Event,'epoch'>);
 assert(result.accepted&&result.state.mainPlaying);assert.equal(result.state.feedback,null);assert.deepEqual(result.cleanup,['retire-selected-feedback']);
});

test('native content retains curved graph, exact signal-strength statements and all source axis labels',()=>{
 const s=p058SourceState(atQuiz());assert(s.graph);assert(s.question?.text.includes('eight hours'));
 assert.equal(s.graph.sourceCurveCommands.filter(c=>c[0]==='Q').length,5);
 assert.deepEqual(s.graph.xLabels.map(l=>l.text),['0','4','8','12','16','20','24']);
 assert.deepEqual(s.graph.yLabels.map(l=>l.text),['100 %','60 %','20 %']);
 assert(s.check.some(l=>l.text==='When t = 8, signal strength < 80%'));
 assert(s.stages.some(l=>l.text==='Between the 7th and 10th hour, the strength is getting lower.'));
 const noop=()=>{};const html=renderToStaticMarkup(React.createElement(P058NativeV1,{state:atQuiz(),onChoose:noop,onStep:noop,onContinue:noop,onCloseBox:noop,onOpenHelp:noop,onCloseHelp:noop}));
 assert(html.includes('data-p058-source-curve'));assert(html.includes('signal strength &lt; 80%'));
 assert(!html.includes('right angle')&&!html.includes('function table'));assert(html.includes('data-source-text-id="164"'));
});

test('Need More Help has no early source placement; dictionary exposes exactly the three live terms',()=>{
 const m=JSON.parse(fs.readFileSync('migrations/shared-alg001-l06-p058/native-v1/source-model-v1.json','utf8'));
 const controls=m.domains['285'].instances.filter((i:{objectId:number})=>i.objectId===13);
 assert.deepEqual(controls.map((i:{firstFrame:number;lastFrame:number})=>[i.firstFrame,i.lastFrame]),[[934,934]]);
 let s=act(p058InitialState(),'play');s=act(s,'advance-main',{frame:403});assert(!step(s,{type:'open-help'}).accepted);
 assert.deepEqual([...new Set(B.glossary.map(g=>g.key))].sort(),['Function','Graph','Time']);
 assert.deepEqual(p058SourceState(act(atQuiz(),'open-help')).glossary.map(g=>g.key).sort(),['Function','Graph']);
});
