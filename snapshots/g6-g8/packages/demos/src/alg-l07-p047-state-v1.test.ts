import assert from 'node:assert/strict';
import test from 'node:test';
import * as p47 from './alg-l07-p047-state-v1';
import {createFixedExitHelpQuizV1,type FixedExitHelpEventV1,type FixedExitHelpStateV1} from './source-fixed-exit-help-quiz-v1';
import {algL07P047Frame,p047FormulaLabel,p047BarProgress,P047_DOMAINS} from './alg-l07-p047-frame-v1';
function suite<T extends string,I extends number>(name:string,api:ReturnType<typeof createFixedExitHelpQuizV1<T,I>>,e:{hold:number;last:number;right:I;wrong:I;correct:1|2|3|4;terms:readonly T[];hint:string}){
 const send=(s:FixedExitHelpStateV1<T,I>,event:Omit<FixedExitHelpEventV1<T>,'epoch'>)=>api.reduce(s,{...event,epoch:s.epoch} as FixedExitHelpEventV1<T>);
 const frame=(s:FixedExitHelpStateV1<T,I>,n:number)=>api.reduce(s,{type:s.feedback?'advance-feedback':'advance-main',frame:n,epoch:s.epoch});
 const choose=(s:FixedExitHelpStateV1<T,I>,answer:1|2|3|4)=>api.reduce(s,{type:'choose',answer,epoch:s.epoch});
 const quiz=()=>frame(send(api.initialState(),{type:'play'}),e.hold);
 test(name+' source hold rejects early and duplicate choices',()=>{let s=api.initialState();assert.equal(choose(s,e.correct),s);s=frame(send(s,{type:'play'}),e.last);assert.equal(s.mainFrame,e.hold);assert.equal(s.phase,'quiz-held');assert(!api.canPlay(s));s=choose(s,e.correct);assert.equal(s.feedback?.spriteId,e.right);assert.equal(s.feedback?.frame,2);assert.equal(choose(s,1),s);assert.equal(frame(s,e.last),s);});
 test(name+' every wrong choice counts only at28 after early14 or held21 Close',()=>{for(const answer of [1,2,3,4]as const){if(answer===e.correct)continue;for(const closeFrame of[14,21]){let s=quiz();for(let attempt=0;attempt<2;attempt++){s=choose(s,answer);assert.equal(s.feedback?.spriteId,e.wrong);assert.equal(s.quizTryCount,attempt);assert.equal(s.wrongText,e.hint+(attempt?'':' Try again.'));s=frame(s,13);assert(!api.canClose(s));assert.equal(send(s,{type:'close-feedback'}),s);s=frame(s,closeFrame);assert(api.canClose(s));assert.equal(s.playing,closeFrame===14);s=send(s,{type:'close-feedback'});assert.equal(s.feedback?.frame,22);assert.equal(s.quizTryCount,attempt);s=frame(s,27);assert.equal(s.quizTryCount,attempt);s=frame(s,28);assert.equal(s.phase,attempt?'postquiz':'quiz-held');assert.equal(s.quizTryCount,attempt?0:1);assert.equal(s.mainFrame,e.hold+(attempt?1:0));}assert(!s.quizButtonsEnabled);}}});
 test(name+' correct32 preserves prior wrong count then stops main without auto completion',()=>{let s=quiz();const wrong=e.correct===1?2:1;s=frame(send(frame(choose(s,wrong),21),{type:'close-feedback'}),28);s=choose(s,e.correct);assert.equal(s.quizTryCount,1);s=frame(s,31);assert.equal(s.mainFrame,e.hold);s=frame(s,32);assert.equal(s.mainFrame,e.hold+1);assert.equal(s.quizTryCount,1);s=frame(s,e.last);assert.equal(s.phase,'ended');assert.equal(s.lessonCompleted,false);assert(!s.playing);assert.equal(send(s,{type:'play'}),s);});
 test(name+' every help term preserves help, held frame, count and input locks',()=>{let s=send(quiz(),{type:'open-help'});assert(s.help&&!s.quizButtonsEnabled);assert.equal(choose(s,e.correct),s);assert.equal(send(s,{type:'play'}),s);for(const term of e.terms){s=api.reduce(s,{type:'open-glossary',term,epoch:s.epoch});assert.equal(s.glossary,term);assert.equal(send(s,{type:'close-help'}),s);s=send(s,{type:'close-glossary'});assert(s.help);assert.equal(s.mainFrame,e.hold);assert.equal(s.quizTryCount,0);assert(!s.playing);}s=send(s,{type:'close-help'});assert(s.quizButtonsEnabled&&!s.help);});
 test(name+' Replay/leave clears all activity state and rejects stale events',()=>{for(const phase of['help','glossary','feedback']){let s=phase==='feedback'?choose(quiz(),e.correct===1?2:1):send(quiz(),{type:'open-help'});if(phase==='glossary')s=api.reduce(s,{type:'open-glossary',term:e.terms[0],epoch:s.epoch});const old=s;s=send(s,{type:'replay'});assert.equal(s.epoch,old.epoch+1);assert.equal(s.replay,1);assert.equal(s.mainFrame,1);assert(!s.feedback&&!s.glossary&&!s.help);assert.equal(s.quizTryCount,0);assert.equal(api.reduce(s,{type:'advance-feedback',frame:28,epoch:old.epoch}),s);s=send(s,{type:'leave'});assert.equal(s.phase,'left');assert.equal(send(s,{type:'play'}),s);}});
}

suite('P047',{initialState:p47.p047InitialState,reduce:p47.p047Reduce,canPlay:p47.p047CanPlay,canClose:p47.p047CanClose},{hold:250,last:926,right:333,wrong:415,correct:2,terms:['Slope','Rate','Calculate','Graph','Right triangle','Linear function','Point','Coordinate','Vertical','Triangle','Horizontal','Axis','Length'],hint:'Form a triangle using two points whose coordinates you know. The slope equals the vertical length divided by horizontal length.'});

test('P047 currency choices retain source two-digit cents, units and B handler identity',()=>{
 const S=p47.ALG_L07_P047_SOURCE;
 assert.deepEqual(S.answers.map(a=>[a.letter,a.instance,a.characterId,a.amount,a.display]),[
  ['A','AnsBtn1',266,'0.09','$0.09 per minute'],['B','AnsBtn2',267,'0.10','$0.10 per minute'],
  ['C','AnsBtn3',266,'0.12','$0.12 per minute'],['D','AnsBtn4',266,'0.25','$0.25 per minute'],
 ]);
 const v=algL07P047Frame(250);assert.equal(v.state.phase,'quiz-held');
 assert.equal(v.textSnapshot.blocks.find(b=>b.id==='equation-B')!.text,'$0.10 per minute');
 assert(v.textSnapshot.blocks.filter(b=>b.id.startsWith('formula-')).every(b=>!b.visible));
 assert.equal(p47.p047Visual(300).bMove,1);
 assert.deepEqual(p47.p047Visual(300).answerAlpha,{A:0,B:1,C:0,D:0});
});
test('P047 preserves two distinct graphs, known coordinates and timed triangle masks',()=>{
 const S=p47.ALG_L07_P047_SOURCE;
 assert.deepEqual(S.graphs.map(g=>[g.name,g.labels.length]),[['question',20],['help',18]]);
 assert.deepEqual(S.graphs[0].paths.map(p=>p.sourceShapeId),[227,241]);
 assert.deepEqual(S.graphs[1].paths.map(p=>p.sourceShapeId),[194,207,210,212]);
 assert.deepEqual(p47.p047Visual(380).coordinate.map(c=>c.text.trim()),['(20,12)','(40,14)']);
 const triangles=p47.p047Visual(430).graphOverlays.filter(o=>[421,422].includes(o.sourceShapeId));
 assert.equal(triangles.length,2);assert(triangles.every(o=>o.clips.length>0));
 assert(p47.p047Visual(492).graphOverlays.some(o=>o.sourceShapeId===425));
 assert(!p47.p047Visual(493).graphOverlays.some(o=>o.sourceShapeId===425));
 assert.equal(algL07P047Frame(632).textSnapshot.blocks.find(b=>b.id==='change-432')!.visible,false);
 assert.equal(algL07P047Frame(633).textSnapshot.blocks.find(b=>b.id==='change-432')!.visible,true);
 assert.deepEqual(p47.p047Visual(641).changeTexts.map(t=>t.text.trim()),[
  'Vertical change in length','= 14 – 12','= 2','Horizontal change in length','= 40 – 20','= 20',
 ]);
});
test('P047 formula announces only visible atoms and source bar, preserving repeated equals',()=>{
 const label=(frame:number)=>p047FormulaLabel(p47.p047Visual(frame));
 assert.equal(label(620),'');
 assert.equal(label(700),'Slope equals vertical change');
 assert.equal(label(701),'Slope equals vertical change over');
 assert.equal(p047BarProgress(p47.p047Visual(700),103),0);
 assert.equal(p047BarProgress(p47.p047Visual(701),103),2.55/134);
 assert(p047BarProgress(p47.p047Visual(705),103)>.8&&p047BarProgress(p47.p047Visual(705),103)<.81);
 assert.equal(p047BarProgress(p47.p047Visual(706),103),1);
 assert.equal(label(730),'Slope equals vertical change over horizontal change');
 assert.equal(label(760),label(730));
 assert.equal(label(770),'Slope equals vertical change over horizontal change equals 2 over 20');
 assert.equal(label(810),'Slope equals vertical change over horizontal change equals 2 over 20 equals 1 over 10');
 assert.equal(label(850),'Slope equals vertical change over horizontal change equals 2 over 20 equals 1 over 10 equals 0.1');
 assert.deepEqual(p47.p047Visual(926).formula.filter(t=>t.characterId===435).map(t=>t.depth),[102,105,109]);
 assert.equal(algL07P047Frame(810).textSnapshot.blocks.find(b=>b.id==='formula-113')!.visible,false);
 assert.equal(algL07P047Frame(850).textSnapshot.blocks.find(b=>b.id==='formula-113')!.visible,true);
});
test('P047 exact main/child frame identity and source fallback remain queryable',()=>{
 assert.deepEqual(P047_DOMAINS.map(d=>[d.id,d.frameCount]),[
  ['root',10],['sprite-217',1],['sprite-214',1],['sprite-411',1],['sprite-333',32],['sprite-415',28],['sprite-447',926],
 ]);
 for(const lang of['en','es']as const)for(let frame=1;frame<=926;frame++){
  const v=algL07P047Frame(frame,{frame,frameDomain:'sprite-447',scenario:'source-question',lang,seed:0});
  assert.equal(v.mainFrame,frame);assert.equal(v.rootFrame,6);assert.equal(v.textSnapshot.status,'ready');
 }
 for(const frame of[0,927,1.5,NaN])assert.throws(()=>algL07P047Frame(frame));
 assert.equal(algL07P047Frame(926).state.lessonCompleted,false);
 assert.throws(()=>algL07P047Frame(1,{frame:1,frameDomain:'sprite-415',scenario:'wrong-first-b',lang:'en',seed:0}));
});
