import assert from 'node:assert/strict';
import test from 'node:test';
import * as p50 from './alg-l07-p050-state-v1';
import {createFixedExitHelpQuizV1,type FixedExitHelpEventV1,type FixedExitHelpStateV1} from './source-fixed-exit-help-quiz-v1';
import {algL07P050Frame,P050_DOMAINS,P050_DEFAULTS} from './alg-l07-p050-frame-v1';
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

const hint=['Multiply the input by itself. Then multiply by 3.14. Try again.','Multiply the input by itself. Then multiply by 3.14.'] as const;
suite('P050',{initialState:p50.p050InitialState,reduce:p50.p050Reduce,canPlay:p50.p050CanPlay,canClose:p50.p050CanClose},{hold:332,last:572,right:257,wrong:340,correct:3,terms:['Equation','Substitute','Order of operations','Calculate','Value','Expression'],hints:{1:hint,2:hint,4:hint}});
test('P050 source option identities and blank table output cannot change with C movement',()=>{
 const S=p50.ALG_L07_P050_SOURCE;
 assert.deepEqual(S.answers.map(a=>[a.letter,a.instance,a.characterId,a.display]),[['A','AnsBtn1',190,'3.1432'],['B','AnsBtn3',190,'18.84'],['C','AnsBtn2',191,'28.26'],['D','AnsBtn4',190,'31.4']]);
 assert.deepEqual(S.table.rows.map(r=>[r.input,r.output]),[['0','0'],['1','3.14'],['2','12.56'],['3',null],['4','50.24']]);
 for(const f of[332,351,356,365,400,485,563,572]){const v=algL07P050Frame(f);assert.equal(v.textSnapshot.blocks.find(b=>b.id==='equation-C')?.text,'28.26');assert(!v.textSnapshot.blocks.some(b=>b.id==='table-output-3'));}
 assert.deepEqual(p50.p050Visual(572).answerAlpha,{A:0,B:0,C:1,D:0});assert.equal(p50.p050Visual(351).correctMove,0);assert(p50.p050Visual(356).correctMove>0);assert.equal(p50.p050Visual(366).correctMove,1);
});
test('P050 source exponents and two postquiz formula groups retain their actual timing',()=>{
 const S=p50.ALG_L07_P050_SOURCE,rich=(id:number)=>S.richTexts.find(t=>t.characterId===id)!;
 for(const id of[135,136,151,152,341,342])assert.equal(rich(id).tokens.filter(t=>t.superscript&&t.text==='2').length,1);
 assert.equal(rich(135).text,'A = 3.14 r²');assert.equal(rich(136).text,'A = 3.14(3)²');assert.equal(rich(343).text,'A = 3.14 (9)');assert.equal(rich(344).text,'A = 28.26');
 const visible=(f:number)=>algL07P050Frame(f).textSnapshot.blocks.filter(b=>b.id.startsWith('post-equation-')&&b.visible).map(b=>b.id);
 assert.deepEqual(visible(476),[]);assert.deepEqual(visible(477),['post-equation-341','post-equation-342']);assert.deepEqual(visible(554),visible(477));assert.deepEqual(visible(555),['post-equation-341','post-equation-342','post-equation-343','post-equation-344']);
 assert(p50.p050Visual(480).postEquations[0].offset>0);assert.equal(p50.p050Visual(485).postEquations[0].offset,0);assert.equal(p50.p050Visual(563).postEquations[2].offset,0);
});
test('P050 each authored term flash alternates and persists no longer than its source frames',()=>{
 for(const[term,start]of[['Nonlinear function',18],['Area',110],['Circle',127],['Function',145],['Radius',155],['Function table',217],['Evaluate',254],['Value',309]]as const){for(let f=start;f<=start+6;f++)assert.equal(p50.p050Visual(f).termFlash.includes(term),(f-start)%2===0);assert(!p50.p050Visual(start+7).termFlash.length);}
});
test('P050 root and every nested domain have exact boundaries and reject the correct answer as a wrong scenario',()=>{
 assert.equal(P050_DOMAINS.length,7);
 for(const lang of['en','es']as const)for(const domain of P050_DOMAINS){const scenario=P050_DEFAULTS[domain.id];for(let f=1;f<=domain.frameCount;f++){const v=algL07P050Frame(f,{frame:f,frameDomain:domain.id,scenario,lang,seed:0});assert.equal(v.frame,f);assert.equal(v.frameDomain,domain.id);assert.equal(v.state.lessonCompleted,false);}}
 for(const n of[0,573,1.5,NaN])assert.throws(()=>algL07P050Frame(n));assert.throws(()=>algL07P050Frame(1,{frame:1,frameDomain:'sprite-340',scenario:'wrong-first-c',lang:'en',seed:0}));
});
