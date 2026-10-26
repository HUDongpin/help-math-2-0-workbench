import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {p056InitialState,p056Reduce,type P056State,type P056Event,type P056Choice} from './alg-l06-p056-state-v1';
import {P056_BEHAVIOR_SOURCE as B} from './generated/alg-l06-p056-behavior-v1';
const raw='/Volumes/American Dream/hudongpin/g678-p056-source-extraction-20261003-v1/ffdec-export/scripts/';
const action=(name:string)=>fs.readFileSync(raw+name,'utf8').replace(/\s/g,'');
const step=(s:P056State,e:Omit<P056Event,'epoch'>,seed=0)=>p056Reduce(s,{...e,epoch:s.epoch} as P056Event,seed);
const act=(s:P056State,type:P056Event['type'],extra:Record<string,unknown>={},seed=0)=>step(s,{type,...extra} as Omit<P056Event,'epoch'>,seed).state;
function atQuiz(){let s=act(p056InitialState(),'play');for(const frame of [273,441,590,748]){
 s=act(s,'advance-main',{frame:818});assert.equal(s.mainFrame,frame);s=act(s,'continue-step');
}return act(s,'advance-main',{frame:818});}
function selected(choice:P056Choice,seed=0,state=atQuiz()){
 const pending=act(state,'choose',{choice},seed);assert.equal(pending.quizTryCount,state.quizTryCount);
 return act(pending,'resolve-host-feedback',{},seed);
}
const terminal:Record<number,number>={83:25,124:27,51:31,116:27,138:31,149:29,160:28};
function finish(s:P056State){return act(s,'advance-feedback',{frame:terminal[s.feedback!.spriteId],generation:s.feedback!.generation});}

test('raw SWF/script evidence fixes the answer and terminal-count rule independently',()=>{
 const swf=fs.readFileSync('migrations/shared-alg001-l06-p056/source-v1/L6TS07.swf');
 assert.equal(createHash('sha256').update(swf).digest('hex'),'ba6ba691fafbc6bbd2d0a14b4d249c59e7f1569ca8aaddaa778957c6120205d1');
 assert.equal(action('DefineButton2_273/BUTTONCONDACTION on(release).as'),'on(release){_root.disableQuizButton();_root.showRightFeed();NMHBtn.enabled=false;}');
 assert(!action('DefineButton2_274/BUTTONCONDACTION on(release).as').includes('quizTryCount'));
 assert(action('DefineSprite_138/frame_31/DoAction.as').includes('this.gotoAndStop(1);_global.quizTryCount++;'));
 assert.deepEqual(B.options.map(o=>[o.letter,o.value,o.right]),[['A','22',false],['B','24',false],['C','25',true],['D','39',false]]);
});

test('main clock clamps every authored step and final quiz; Play cannot bypass a source hold',()=>{
 let s=act(p056InitialState(),'play');for(const expected of [273,441,590,748]){
  s=act(s,'advance-main',{frame:818});assert.equal(s.phase,'step-held');assert.equal(s.mainFrame,expected);
  assert(s.quizSection);assert(!s.mainPlaying);assert(!step(s,{type:'play'}).accepted);
  assert(!step(s,{type:'choose',choice:'C'} as Omit<P056Event,'epoch'>).accepted);
  s=act(s,'continue-step');assert(s.mainPlaying);assert(!s.quizSection);
 }
 s=act(s,'advance-main',{frame:818});assert.equal(s.mainFrame,801);assert.equal(s.phase,'quiz-held');assert.equal(s.quizTryCount,0);
 assert(!step(s,{type:'play'}).accepted);
});

test('first two source step clicks resume main; last two open and close only their boxes',()=>{
 let s=act(p056InitialState(),'play');for(const frame of [273,441]){
  s=act(s,'advance-main',{frame});s=act(s,'step-click');assert.equal(s.phase,'main');assert(s.mainPlaying);
 }
 for(const [frame,sid,closeButton]of [[590,250,249],[748,270,269]]){
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
  s=finish(s);assert.equal(s.phase,'quiz-held');assert.equal(s.quizTryCount,1);assert.equal(s.mainFrame,801);assert(s.quizButtonsEnabled&&s.nmhButtonEnabled);
  s=selected('D',seed,s);assert.equal(s.quizTryCount,1);s=finish(s);assert.equal(s.quizTryCount,0);assert.equal(s.phase,'main');assert(s.mainPlaying);assert(!s.quizSection);
  assert(!step(s,{type:'choose',choice:'B'} as Omit<P056Event,'epoch'>).accepted);
 }
 assert.deepEqual([...seen].sort((a,b)=>a-b),[138,149,160]);
});

test('all four right variants continue while preserving a prior wrong count',()=>{
 const seen=new Set<number>();for(let seed=0;seed<48;seed++)for(const priorWrong of [false,true]){
  let s=priorWrong?finish(selected('B',seed)):atQuiz();s=selected('C',seed,s);seen.add(s.feedback!.spriteId);
  assert.equal(s.feedback!.kind,'right');s=finish(s);assert.equal(s.quizTryCount,priorWrong?1:0);
  assert(s.mainPlaying);assert.equal(s.mainFrame,801);assert.equal(s.phase,'main');assert(!s.quizSection);assert(!s.quizButtonsEnabled);
  s=act(s,'advance-main',{frame:802});assert.equal(s.mainFrame,802);s=act(s,'advance-main',{frame:818});
  assert.equal(s.phase,'engineering-end-held');assert.equal(s.lessonCompleted,false);assert(!s.mainPlaying);
 }
 assert.deepEqual([...seen].sort((a,b)=>a-b),[51,83,116,124]);
});

test('help opens function popup, blocks answer input, and dictionary close preserves its parent',()=>{
 let s=finish(selected('D'));s=act(s,'open-help');assert(s.helpVisible);assert.equal(s.quizTryCount,1);assert(!s.quizButtonsEnabled);
 assert(!step(s,{type:'choose',choice:'C'} as Omit<P056Event,'epoch'>).accepted);
 s=act(s,'glossary',{buttonId:283,ownerSpriteId:288});assert.equal(s.glossaryTerm,'Substitute');
 assert(!step(s,{type:'close-help'}).accepted);s=act(s,'close-glossary');assert(s.helpVisible);assert(!s.mainPlaying);
 s=act(s,'close-help');assert(!s.helpVisible);assert(s.quizButtonsEnabled);assert.equal(s.quizTryCount,1);
 s=selected('C',0,s);assert(!step(s,{type:'open-help'}).accepted);
});

test('glossary ownership and source frame windows reject offstage angle vocabulary',()=>{
 let s=p056InitialState();assert(!step(s,{type:'glossary',buttonId:177,ownerSpriteId:305}as Omit<P056Event,'epoch'>).accepted);
 s=act(s,'play');s=act(s,'advance-main',{frame:18});s=act(s,'glossary',{buttonId:177,ownerSpriteId:305});assert.equal(s.glossaryTerm,'Value');assert(!s.mainPlaying);
 s=act(s,'close-glossary');assert(!s.mainPlaying);
 assert(!step(s,{type:'glossary',buttonId:294,ownerSpriteId:288}as Omit<P056Event,'epoch'>).accepted);
 assert(!step(s,{type:'glossary',buttonId:228,ownerSpriteId:305}as Omit<P056Event,'epoch'>).accepted);
});

test('pause at box entry resumes; content holds remain held, and stale box callbacks are rejected',()=>{
 let s=act(p056InitialState(),'play');for(const frame of [273,441]){s=act(s,'advance-main',{frame});s=act(s,'continue-step');}
 s=act(s,'advance-main',{frame:590});s=act(s,'step-click');const old=s.stepBox!.generation;
 s=act(s,'pause');assert.equal(s.stepBox!.frame,1);s=act(s,'play');assert(s.stepBox!.playing);
 s=act(s,'advance-box',{frame:15,generation:old});s=act(s,'close-box');s=act(s,'advance-box',{frame:20,generation:old});
 s=act(s,'step-click');assert(s.stepBox!.generation>old);
 assert(!step(s,{type:'advance-box',frame:15,generation:old}as Omit<P056Event,'epoch'>).accepted);
});

test('Replay and leave invalidate delayed selection, feedback and main callbacks and reset full state',()=>{
 let s=selected('A',12);const oldEpoch=s.epoch,oldGeneration=s.feedback!.generation;
 s=act(s,'pause');assert(!step(s,{type:'advance-feedback',frame:31,generation:oldGeneration}as Omit<P056Event,'epoch'>).accepted);
 s=act(s,'play');assert(s.feedback!.playing);const reset=step(s,{type:'replay'});assert.equal(reset.cleanup.length,3);
 s=reset.state;assert.deepEqual(s,p056InitialState(oldEpoch+1));
 assert(!p056Reduce(s,{type:'advance-feedback',frame:31,generation:oldGeneration,epoch:oldEpoch}).accepted);
 s=act(s,'leave');assert.equal(s.phase,'left');assert(!step(s,{type:'play'}).accepted);
 assert(!step(s,{type:'replay'}).accepted);assert.equal(s.lessonCompleted,false);
});
