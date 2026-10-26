import test from 'node:test';import assert from 'node:assert/strict';
import {ALG_L07_P002_SOURCE as SOURCE,algL07P002Frame,algL07P002FrameAtMilliseconds} from './alg-l07-p002-state-v1';
import {AlgL07P002Session} from './alg-l07-p002-session-v1';
import {sourceStreamRunSlices,SourceStreamRunsClockV1} from './source-stream-runs-clock-v1';
const context={frame:1,scenario:'source-static-frame',lang:'en' as const,seed:0,frameDomain:'sprite-452'};
test('source terminal stop never wraps and exact frame domain rejects bad requests',()=>{
 assert.equal(algL07P002FrameAtMilliseconds(99500),1195);assert.equal(algL07P002FrameAtMilliseconds(200000),1195);
 assert.equal(algL07P002Frame(1195,context).terminalHeld,true);
 for(const frame of [0,1196,1.5,NaN])assert.throws(()=>algL07P002Frame(frame,context),/FRAME_IDENTITY/);
 assert.throws(()=>algL07P002Frame(1,{...context,scenario:'invented'}),/FRAME_IDENTITY/);
});
test('exact source price table stays absent through695 and emphases follow source glyph ownership',()=>{
 assert.equal(algL07P002Frame(695,context).tableVisible,false);assert.equal(algL07P002Frame(696,context).tableVisible,true);
 assert.deepEqual(SOURCE.rows.map(r=>[r.plan,r.monthly,r.rate]),[['Smooth Talk','0','$.20/minute'],['Easy Talk','$50','$.05/minute'],['Super Talk','$60','$.03/minute']]);
 assert.deepEqual(algL07P002Frame(900,context).accents,[[0,'rate']]);assert.deepEqual(algL07P002Frame(1077,context).accents,[[2,'rate']]);
 assert.equal(algL07P002Frame(1,{...context,lang:'es'}).visualLanguageFallback,true);
});
test('source stream owns three native scheduled runs and negative markers without invented gaps',()=>{
 const clock=new SourceStreamRunsClockV1(SOURCE.clockPlan,{commitHeldFrame:()=>true});assert.equal(clock.snapshot().frame,1);
 assert.deepEqual(sourceStreamRunSlices(SOURCE.clockPlan,0).map(s=>s.segmentIndex),[0,1,2]);
 const gap=sourceStreamRunSlices(SOURCE.clockPlan,35.5);assert.equal(gap[0].segmentIndex,1);assert.equal(gap[0].delaySeconds,.5);
 assert.deepEqual(sourceStreamRunSlices(SOURCE.clockPlan,99.5),[]);
 assert.equal(SOURCE.clockPlan.emptyNegativeBlocks[0].frame,425);assert.equal(SOURCE.clockPlan.emptyNegativeBlocks[1].frame,1153);
});
test('close during source read aborts and stale response cannot reopen or create audio',async()=>{
 let resolve!:(b:ArrayBuffer)=>void,signal!:AbortSignal,contexts=0;const frames:number[]=[];
 const session=new AlgL07P002Session({read:s=>{signal=s;return new Promise(r=>{resolve=r;});},changed(){},commitFrame:f=>{frames.push(f);return true;},createContext:()=>{contexts++;throw Error('unexpected context');}});
 const pending=session.play();assert.equal(session.snapshot().phase,'loading');await session.close();assert.equal(signal.aborted,true);
 resolve(new ArrayBuffer(1));assert.equal(await pending,false);assert.equal(session.snapshot().phase,'closed');assert.equal(contexts,0);assert.deepEqual(frames,[]);
});
test('Replay during pending source read aborts the old request, resets frame and preserves volume',async()=>{
 const requests:{signal:AbortSignal;resolve:(b:ArrayBuffer)=>void}[]=[],frames:number[]=[];
 const session=new AlgL07P002Session({read:signal=>new Promise(resolve=>requests.push({signal,resolve})),changed(){},commitFrame:f=>{frames.push(f);return true;}});
 session.setVolume(.25);const old=session.play(),replay=session.replay();assert.equal(requests[0].signal.aborted,true);assert.equal(session.snapshot().replay,1);assert.equal(session.snapshot().volume,.25);assert.equal(frames[0],1);
 await session.close();requests.forEach(r=>r.resolve(new ArrayBuffer(1)));assert.equal(await old,false);assert.equal(await replay,false);assert.equal(session.snapshot().phase,'closed');
});
