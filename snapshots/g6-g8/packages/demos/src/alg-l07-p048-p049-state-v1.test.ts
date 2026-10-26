import assert from 'node:assert/strict';
import test from 'node:test';
import * as p48 from './alg-l07-p048-state-v1';
import * as p49 from './alg-l07-p049-state-v1';
import {createFixedExitHelpQuizV1,type FixedExitHelpEventV1,type FixedExitHelpStateV1} from './source-fixed-exit-help-quiz-v1';
import {algL07P048Frame,P048_DOMAINS} from './alg-l07-p048-frame-v1';
import {algL07P049Frame,P049_DOMAINS} from './alg-l07-p049-frame-v1';
function suite<T extends string,I extends number>(name:string,api:ReturnType<typeof createFixedExitHelpQuizV1<T,I>>,e:{hold:number;last:number;right:I;wrong:I;correct:1|2|3|4;terms:readonly T[];hints:Readonly<Record<number,readonly [string,string]>>}){
 const send=(s:FixedExitHelpStateV1<T,I>,event:Omit<FixedExitHelpEventV1<T>,'epoch'>)=>api.reduce(s,{...event,epoch:s.epoch} as FixedExitHelpEventV1<T>);
 const frame=(s:FixedExitHelpStateV1<T,I>,n:number)=>api.reduce(s,{type:s.feedback?'advance-feedback':'advance-main',frame:n,epoch:s.epoch});
 const choose=(s:FixedExitHelpStateV1<T,I>,answer:1|2|3|4)=>api.reduce(s,{type:'choose',answer,epoch:s.epoch});
 const quiz=()=>frame(send(api.initialState(),{type:'play'}),e.hold);
 test(name+' source hold rejects early and duplicate choices',()=>{let s=api.initialState();assert.equal(choose(s,e.correct),s);s=frame(send(s,{type:'play'}),e.last);assert.equal(s.mainFrame,e.hold);assert.equal(s.phase,'quiz-held');assert(!api.canPlay(s));s=choose(s,e.correct);assert.equal(s.feedback?.spriteId,e.right);assert.equal(s.feedback?.frame,2);assert.equal(choose(s,1),s);assert.equal(frame(s,e.last),s);});
 test(name+' every wrong choice counts only at28 after early14 or held21 Close',()=>{for(const answer of [1,2,3,4]as const){if(answer===e.correct)continue;for(const closeFrame of[14,21]){let s=quiz();for(let attempt=0;attempt<2;attempt++){s=choose(s,answer);assert.equal(s.feedback?.spriteId,e.wrong);assert.equal(s.quizTryCount,attempt);assert.equal(s.wrongText,e.hints[answer][attempt]);s=frame(s,13);assert(!api.canClose(s));assert.equal(send(s,{type:'close-feedback'}),s);s=frame(s,closeFrame);assert(api.canClose(s));assert.equal(s.playing,closeFrame===14);s=send(s,{type:'close-feedback'});assert.equal(s.feedback?.frame,22);assert.equal(s.quizTryCount,attempt);s=frame(s,27);assert.equal(s.quizTryCount,attempt);s=frame(s,28);assert.equal(s.phase,attempt?'postquiz':'quiz-held');assert.equal(s.quizTryCount,attempt?0:1);assert.equal(s.mainFrame,e.hold+(attempt?1:0));}assert(!s.quizButtonsEnabled);}}});
 test(name+' correct32 preserves prior wrong count then stops main without auto completion',()=>{let s=quiz();const wrong=e.correct===1?2:1;s=frame(send(frame(choose(s,wrong),21),{type:'close-feedback'}),28);s=choose(s,e.correct);assert.equal(s.quizTryCount,1);s=frame(s,31);assert.equal(s.mainFrame,e.hold);s=frame(s,32);assert.equal(s.mainFrame,e.hold+1);assert.equal(s.quizTryCount,1);s=frame(s,e.last);assert.equal(s.phase,'ended');assert.equal(s.lessonCompleted,false);assert(!s.playing);assert.equal(send(s,{type:'play'}),s);});
 test(name+' every help term preserves help, held frame, count and input locks',()=>{let s=send(quiz(),{type:'open-help'});assert(s.help&&!s.quizButtonsEnabled);assert.equal(choose(s,e.correct),s);assert.equal(send(s,{type:'play'}),s);for(const term of e.terms){s=api.reduce(s,{type:'open-glossary',term,epoch:s.epoch});assert.equal(s.glossary,term);assert.equal(send(s,{type:'close-help'}),s);s=send(s,{type:'close-glossary'});assert(s.help);assert.equal(s.mainFrame,e.hold);assert.equal(s.quizTryCount,0);assert(!s.playing);}s=send(s,{type:'close-help'});assert(s.quizButtonsEnabled&&!s.help);});
 test(name+' Replay/leave clears all activity state and rejects stale events',()=>{for(const phase of['help','glossary','feedback']){let s=phase==='feedback'?choose(quiz(),e.correct===1?2:1):send(quiz(),{type:'open-help'});if(phase==='glossary')s=api.reduce(s,{type:'open-glossary',term:e.terms[0],epoch:s.epoch});const old=s;s=send(s,{type:'replay'});assert.equal(s.epoch,old.epoch+1);assert.equal(s.replay,1);assert.equal(s.mainFrame,1);assert(!s.feedback&&!s.glossary&&!s.help);assert.equal(s.quizTryCount,0);assert.equal(api.reduce(s,{type:'advance-feedback',frame:28,epoch:old.epoch}),s);s=send(s,{type:'leave'});assert.equal(s.phase,'left');assert.equal(send(s,{type:'play'}),s);}});
}

const hints48={1:['The rate of  7.75 should be the coefficient of the input variable. Try again.','The rate of  7.75 should be the coefficient of the input variable.'],3:['The rate of  7.75 should be the coefficient of the input variable and the output of the function should be M for money not L for laps. Try again','The rate of  7.75 should be the coefficient of the input variable and the output of the function should be M for money not L for laps.'],4:['The output of the function should be M for money not L for laps. Try again','The output of the function should be M for money not L for laps.']} as const;
const hints49={"1": ["A function must pass the vertical-line test. Try again.", "A function must pass the vertical-line test."], "3": ["The graph of a nonlinear function cannot be a straight line. Try again.", "The graph of a nonlinear function cannot be a straight line."], "4": ["A function must pass the vertical-line test. Try again.", "A function must pass the vertical-line test."]} as const;
suite('P048',{initialState:p48.p048InitialState,reduce:p48.p048Reduce,canPlay:p48.p048CanPlay,canClose:p48.p048CanClose},{hold:82,last:266,right:234,wrong:317,correct:2,terms:["Function"],hints:hints48});
suite('P049',{initialState:p49.p049InitialState,reduce:p49.p049Reduce,canPlay:p49.p049CanPlay,canClose:p49.p049CanClose},{hold:99,last:408,right:154,wrong:238,correct:2,terms:["Function", "Nonlinear function", "Graph", "Vertical-line test", "Vertical", "Intersect", "Point", "Line"],hints:hints49});
test('P048 equations keep exact variable order, decimals and sparse source emphasis',()=>{
 assert.deepEqual(p48.ALG_L07_P048_SOURCE.answers.map(a=>a.display),['M = 15L + 7.75','M = 7.75L + 15','L = 15M + 7.75','L = 7.75M + 15']);
 for(const frame of[82,132,133,138,139,171,172,185,186,191,266])assert.equal(algL07P048Frame(frame).textSnapshot.blocks.find(b=>b.id==='equation-B')!.text,'M = 7.75L + 15');
 for(const[token,start,end]of[['M',132,138],['=',157,163],['7',171,177],['75',185,191],['L',222,228],['+',245,251],['15',256,262]]as const){for(let f=start;f<=end;f++)assert.equal(p48.p048Visual(f).emphasis.some(e=>e.token===token),(f-start)%2===0);assert(!p48.p048Visual(end+1).emphasis.length);}
 assert.deepEqual(p48.p048Visual(266).answerAlpha,{A:0,B:1,C:0,D:0});assert.equal(p48.p048Visual(266).bMove,1);
});
test('P049 B uses AnsBtn4 and graph labels, curves and repeated vertical-test placements survive',()=>{
 assert.deepEqual(p49.ALG_L07_P049_SOURCE.answers.map(a=>[a.letter,a.instance,a.characterId]),[['A','AnsBtn1',86],['B','AnsBtn4',88],['C','AnsBtn3',87],['D','AnsBtn2',86]]);
 assert.deepEqual(p49.ALG_L07_P049_SOURCE.graphs.map(g=>[g.name,g.labels.length,g.paths.map(p=>p.sourceShapeId)]),[['A',14,[65,74]],['B',14,[77,78]],['C',14,[80,81]],['D',14,[84,85]]]);
 const graph=(f:number,name:string)=>p49.p049Visual(f).graphs.find(g=>g.name===name)!;
 assert.deepEqual(p49.p049Visual(117).whiteHaloTargets,['B']);assert.deepEqual(p49.p049Visual(129).whiteHaloTargets,[]);
 assert(graph(178,'C').overlays.some(o=>o.sourceShapeId===240));assert(!graph(188,'C').overlays.some(o=>o.sourceShapeId===240));
 assert.equal(graph(254,'A').overlays.find(o=>o.sourceShapeId===241)!.matrix[3],0.048004150390625);
 assert.equal(graph(254,'D').overlays.find(o=>o.sourceShapeId===241)!.matrix[3],0.0763702392578125);
 assert.equal(graph(300,'A').overlays.filter(o=>o.alpha>0).length,2);
 assert.equal(algL07P049Frame(99).textSnapshot.blocks.filter(b=>b.id.startsWith('axis-')&&b.visible).length,56);
 assert.equal(algL07P049Frame(408).textSnapshot.blocks.filter(b=>b.id.startsWith('axis-')&&b.visible).length,14);
 assert.deepEqual(p49.p049Visual(408).answerAlpha,{A:0,B:1,C:0,D:0});assert.equal(p49.p049Visual(408).bMove,1);
});
test('Both source-root and nested domains have exact boundaries with no automatic lesson completion',()=>{
 for(const[frame,domains,last,main,wrong]of[[algL07P048Frame,P048_DOMAINS,266,332,317],[algL07P049Frame,P049_DOMAINS,408,243,238]]as const){
  assert.equal(domains.length,7);for(const lang of['en','es']as const)for(let n=1;n<=last;n++){const v=frame(n,{frame:n,frameDomain:`sprite-${main}`,scenario:'source-question',lang,seed:0});assert.equal(v.mainFrame,n);assert.equal(v.textSnapshot.status,'ready');}
  assert.equal(frame(last).state.lessonCompleted,false);for(const n of[0,last+1,1.5,NaN])assert.throws(()=>frame(n));assert.throws(()=>frame(1,{frame:1,frameDomain:`sprite-${wrong}`,scenario:'wrong-first-b',lang:'en',seed:0}));
 }
});
