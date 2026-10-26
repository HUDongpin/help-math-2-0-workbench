import assert from 'node:assert/strict';
import test from 'node:test';
import {P060SessionV1} from './alg-l06-p060-session-v1';
import {p060Identity} from './alg-l06-p060-state-v1';
import {p060Question,type P060Choice} from './alg-l06-p060-source-v1';

test('language selection, mounting and host resume do not start recordings', async()=>{
  let reads=0;const session=new P060SessionV1(3,'es',{readAudio:async()=>{reads++;throw Error('unexpected');},changed:()=>{}});
  session.setLanguage('en');session.setLanguage('es');session.setPaused(true);session.setPaused(false);
  assert.equal(reads,0);assert.equal(session.snapshot().audio.assetId,null);
  const old=p060Identity(session.snapshot().quiz);session.dispatch({type:'answer',identity:old,choice:'A',elapsedMs:0});
  assert.equal(await session.playAudio(null,old),false);assert.equal(reads,0);await session.close();
});
test('session owns monotonic active elapsed time and stops the clock at completion', async()=>{
  let now=100;const session=new P060SessionV1(2,'en',{now:()=>now,changed:()=>{},readAudio:async()=>{throw Error('unused');}});
  now=1100;session.setPaused(true);now=5100;assert.equal(session.elapsedMs(),1000);
  let identity=p060Identity(session.snapshot().quiz);assert.equal(session.dispatch({type:'answer',identity,choice:'A',elapsedMs:900000}),false);
  session.setPaused(false);now=6100;
  for(let i=0;i<10;i++){identity=p060Identity(session.snapshot().quiz);const correct=p060Question(identity.questionId!).options.find(o=>o.correct)!;assert(session.dispatch({type:'answer',identity,choice:correct.letter as P060Choice,elapsedMs:900000}));}
  assert.equal(session.snapshot().quiz.finishedElapsedMs,2000);now=900000;assert.equal(session.elapsedMs(),2000);
  session.setPaused(true);assert(session.replay());assert.equal(session.elapsedMs(),0);assert.equal(session.snapshot().paused,false);await session.close();
});
function pendingSession(){
  let release!:(bytes:ArrayBuffer)=>void,signal!:AbortSignal,reads=0,closed=0;
  const context={state:'running',sampleRate:44100,resume:async()=>{},close:async()=>{context.state='closed';closed++;}};
  const session=new P060SessionV1(7,'es',{changed:()=>{},context:()=>context as unknown as AudioContext,readAudio:async(_,s)=>{reads++;signal=s;return new Promise<ArrayBuffer>(r=>{release=r;});}});
  return {session,release:(b:ArrayBuffer)=>release(b),signal:()=>signal,reads:()=>reads,closed:()=>closed};
}
test('answer cancels a pending original recording before decode or start', async()=>{
  const p=pendingSession(),id=p060Identity(p.session.snapshot().quiz),promise=p.session.playAudio(null,id);
  assert.equal(p.reads(),1);assert.equal(p.session.snapshot().audio.phase,'loading');
  assert(p.session.dispatch({type:'answer',identity:id,choice:'A',elapsedMs:0}));assert(p.signal().aborted);
  p.release(new ArrayBuffer(1));assert.equal(await promise,false);await p.session.close();assert.equal(p.closed(),1);assert.equal(p.session.snapshot().audio.phase,'closed');
});
test('Replay and unmount cancel late audio independently', async()=>{
  for(const action of ['replay','close']){
    const p=pendingSession(),promise=p.session.playAudio('B',p060Identity(p.session.snapshot().quiz));
    if(action==='replay')assert(p.session.replay());else await p.session.close();
    assert(p.signal().aborted);p.release(new ArrayBuffer(1));assert.equal(await promise,false);await p.session.close();assert.equal(p.closed(),1);
    if(action==='replay')assert.equal(p.session.snapshot().quiz.replay,1);
  }
});
test('pause and audio-language changes cancel a pending clip without starting a replacement', async()=>{
  for(const action of ['pause','language']){
    const p=pendingSession(),promise=p.session.playAudio('C',p060Identity(p.session.snapshot().quiz));
    if(action==='pause')p.session.setPaused(true);else p.session.setLanguage('en');
    assert(p.signal().aborted);p.release(new ArrayBuffer(1));assert.equal(await promise,false);assert.equal(p.reads(),1);await p.session.close();assert.equal(p.closed(),1);
  }
});
