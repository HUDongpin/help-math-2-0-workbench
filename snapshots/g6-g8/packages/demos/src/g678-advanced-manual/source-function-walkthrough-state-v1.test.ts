import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createFunctionWalkthroughReducer,type WalkthroughEvent,type WalkthroughState} from './source-function-walkthrough-state-v1';
import {p056InitialState,p056Reduce,P056_BEHAVIOR_SOURCE,type P056Event} from '../alg-l06-p056-state-v1';
import {p057InitialState,p057Reduce,P057_BEHAVIOR_SOURCE as B} from '../alg-l06-p057-state-v1';
import {p057SourceState} from '../alg-l06-p057-source-v1';
const reference=createFunctionWalkthroughReducer({...P056_BEHAVIOR_SOURCE,mainSpriteId:305});
test('shared reducer preserves frozen P056 outcomes across four stops, seven branches, overlays, pause, replay, stale callbacks and leave',()=>{
 const observed=new Set<number>();
 for(let seed=0;seed<12;seed++)for(const choice of ['A','B','C','D']as const){
  let old=p056InitialState(),current=reference.initialState();
  const apply=(type:WalkthroughEvent['type'],extra:Record<string,unknown>={})=>{
   const e={type,epoch:old.epoch,...extra}as WalkthroughEvent;
   const a=p056Reduce(old,e as P056Event,seed),b=reference.reduce(current,e,seed);
   assert.equal(b.accepted,a.accepted,type);assert.deepEqual(b.state,a.state,type);assert.deepEqual(b.cleanup,a.cleanup,type);old=a.state;current=b.state;
  };
  apply('play');apply('advance-main',{frame:18});apply('glossary',{buttonId:177,ownerSpriteId:305});apply('play');apply('close-glossary');apply('play');
  for(const frame of [273,441,590,748]){
   apply('advance-main',{frame:818});assert.equal(current.mainFrame,frame);apply('play');apply('step-click');
   if(frame>=590){apply('pause');apply('play');apply('advance-box',{frame:15,generation:current.stepBox!.generation});
    apply('play');apply('close-box');apply('advance-box',{frame:20,generation:current.stepBox!.generation});apply('continue-step');}
  }
  apply('advance-main',{frame:818});apply('open-help');apply('glossary',{buttonId:280,ownerSpriteId:288});apply('close-help');apply('close-glossary');apply('close-help');
  for(let n=0;n<2&&current.phase==='quiz-held';n++){
   apply('choose',{choice});apply('resolve-host-feedback');observed.add(current.feedback!.spriteId);
   const terminal=P056_BEHAVIOR_SOURCE.feedback.find(x=>x.spriteId===current.feedback!.spriteId)!.terminal;
   apply('pause');apply('advance-feedback',{frame:terminal,generation:current.feedback!.generation});apply('play');
   apply('advance-feedback',{frame:terminal-1,generation:current.feedback!.generation});apply('advance-feedback',{frame:terminal,generation:current.feedback!.generation});
  }
  apply('advance-main',{frame:818});const stale=old.epoch;apply('replay');apply('advance-main',{frame:818,epoch:stale});apply('leave');apply('play');
 }
 assert.deepEqual([...observed].sort((a,b)=>a-b),[51,83,116,124,138,149,160]);
});
const next=(s:WalkthroughState,type:WalkthroughEvent['type'],extra:Record<string,unknown>={},seed=0)=>p057Reduce(s,{type,epoch:s.epoch,...extra}as WalkthroughEvent,seed).state;
function question(){let s=next(p057InitialState(),'play');for(const f of [313,481,629,788]){s=next(s,'advance-main',{frame:856});assert.equal(s.mainFrame,f);s=next(s,'continue-step');}return next(s,'advance-main',{frame:856});}
test('P057 raw source binds answer D, terminal-count retries and reset-before-parent right order',()=>{
 const bytes=fs.readFileSync('migrations/shared-alg001-l06-p057/source-v1/L6TS08.swf');assert.equal(createHash('sha256').update(bytes).digest('hex'),'03782ef6ed4587d61db4476648d0d69b5ad158f84b2f6a0ba747605a6712fb31');
 assert.deepEqual(B.options.map(o=>[o.letter,o.value,o.right]),[['A','y = 2x + 5',false],['B','y = 3x + 8',false],['C','y = 4x + 5',false],['D','y = 5x – 4',true]]);
 const raw='/Volumes/American Dream/hudongpin/g678-p057-source-extraction-20261003-v1/ffdec-export/scripts/';
 for(const b of B.feedback){const text=fs.readFileSync(`${raw}DefineSprite_${b.spriteId}/frame_${b.terminal}/DoAction.as`,'utf8').replace(/\s/g,'');
  assert(text.includes(b.kind==='right'?'this.gotoAndStop(1);_parent.play();':'this.gotoAndStop(1);_global.quizTryCount++;'));
 }
 for(const kind of ['right','wrong']as const)for(let seed=0;seed<(kind==='right'?4:3);seed++){
  let s=next(question(),'choose',{choice:kind==='right'?'D':'C'},seed);s=next(s,'resolve-host-feedback',{},seed);
  assert.equal(s.feedback!.kind,kind);assert.equal(s.quizTryCount,0);const b=B.feedback.find(b=>b.spriteId===s.feedback!.spriteId)!;
  s=next(s,'advance-feedback',{frame:b.terminal-1,generation:s.feedback!.generation},seed);assert.equal(s.quizTryCount,0);
  s=next(s,'advance-feedback',{frame:b.terminal,generation:s.feedback!.generation},seed);assert.equal(s.quizTryCount,kind==='wrong'?1:0);assert.equal(s.mainPlaying,kind==='right');
 }
});
test('native P057 retains its function table, two example panels and source help comparison; offstage angle content stays absent',()=>{
 let s=next(p057InitialState(),'play');s=next(s,'advance-main',{frame:18});let n=p057SourceState(s);
 assert.deepEqual(n.table!.rows.map(r=>r.map(x=>x.text)),[['3','11'],['6','26'],['9','41']]);
 for(const f of [313,481]){s=next(s,'advance-main',{frame:f});s=next(s,'continue-step');}
 s=next(s,'advance-main',{frame:629});s=next(s,'step-click');s=next(s,'advance-box',{frame:15,generation:s.stepBox!.generation});n=p057SourceState(s);assert(n.calculation.some(x=>x.text==='y = 5x – 4 matches the table'));assert.equal(n.glossary.length,0);
 s=next(question(),'open-help');n=p057SourceState(s);assert.deepEqual(n.help!.equations,['Let x = 9','y = 2x + 5','y = 2 (9) +5','y = 18 + 5 ≠ 11']);assert.deepEqual(n.glossary.map(g=>g.key),['Function','Relation','Value']);
 assert(!JSON.stringify(n).includes('right angle'));assert.equal(p057Reduce(s,{type:'glossary',buttonId:301,ownerSpriteId:311,epoch:s.epoch}).accepted,false);
});
