import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {algL07P001Frame,algL07P001FrameAtMilliseconds,ALG_L07_P001_SOURCE as SOURCE} from './alg-l07-p001-state-v1';
import {sourceStreamCyclePosition,sourceStreamCycleSlices} from './source-stream-cycle-clock-v1';
import {AlgL07P001Session} from './alg-l07-p001-session-v1';
const context={frame:1,frameDomain:'sprite-142',rootFrame:6,scenario:'source-introduction',lang:'en' as const,seed:0};
const model=JSON.parse(fs.readFileSync(new URL('../../../migrations/shared-alg001-l07-p001/native-v1/source-model-v1.json',import.meta.url),'utf8'));

test('all138 source frames retain title identities and the two matched fade/scale layers',()=>{
  for(const row of model.frames)for(const lang of ['en','es'] as const){
    const s=algL07P001Frame(row.frame,{...context,frame:row.frame,lang});
    assert.equal(s.title,model.title);assert.equal(s.alpha,row.layers[1].alpha256/256);
    assert.equal(s.scaleX,row.layers[1].scaleX);assert.equal(s.scaleY,row.layers[1].scaleY);
    assert.deepEqual(s.sourceTextIds,s.alpha?[140,141]:[]);
  }
});
test('root frames before6 have no title; source child last frame is complete and loops at11.5s',()=>{
  for(let f=1;f<=10;f++)assert.equal(algL07P001Frame(f,{...context,frameDomain:'root'}).mainFrame,f<6?null:f-5);
  assert.equal(algL07P001FrameAtMilliseconds(11499),138);assert.equal(algL07P001FrameAtMilliseconds(11500),1);
  assert.equal(algL07P001FrameAtMilliseconds(23000),1);
  assert.deepEqual(sourceStreamCyclePosition(SOURCE.clockPlan,11.5),{cycleIndex:1,seconds:0,frame:1});
  const slices=sourceStreamCycleSlices(SOURCE.clockPlan,0,0);assert.equal(slices.length,1);
  assert.equal(slices[0].firstDecodedSample,model.frames[0].audio.seekSamples);
  assert.equal(slices[0].durationSeconds,(252864-1673)/22050);
  assert.equal(sourceStreamCycleSlices(SOURCE.clockPlan,11.49,0).length,0);
});
test('invalid source context fails rather than substituting a frame or language',()=>{
  for(const frame of [0,139,NaN,1.5])assert.throws(()=>algL07P001Frame(frame,context));
  for(const c of [{...context,rootFrame:1},{...context,frameDomain:'sprite-143'},{...context,scenario:'guess'},{...context,seed:-1}])assert.throws(()=>algL07P001Frame(1,c));
});
test('pause and leave invalidate pending source reads before any AudioContext is created',async()=>{
  for(const action of ['pause','close'] as const){
    let resolve!:(b:ArrayBuffer)=>void,signal!:AbortSignal,allocations=0;
    const session=new AlgL07P001Session({read:s=>{signal=s;return new Promise(r=>{resolve=r;});},changed(){},commitFrame:()=>true,
      createContext:()=>{allocations++;throw Error('must not allocate');}});
    const playing=session.play();assert.equal(session.snapshot().phase,'loading');await session[action]();
    assert.equal(signal.aborted,true);resolve(new ArrayBuffer(0));assert.equal(await playing,false);assert.equal(allocations,0);
    assert.equal(session.snapshot().lessonCompleted,false);await session.close();
  }
});
test('Replay replaces a pending read and late prior bytes cannot revive it',async()=>{
  const resolves:Array<(b:ArrayBuffer)=>void>=[],signals:AbortSignal[]=[];
  const session=new AlgL07P001Session({read:s=>{signals.push(s);return new Promise(r=>resolves.push(r));},changed(){},commitFrame:()=>true});
  const first=session.play();const replay=session.replay();await Promise.resolve();
  assert.equal(signals.length,2);assert(signals[0].aborted);assert.equal(session.snapshot().replay,1);
  resolves[0](new ArrayBuffer(0));assert.equal(await first,false);assert.equal(session.snapshot().phase,'loading');
  await session.close();resolves[1](new ArrayBuffer(0));assert.equal(await replay,false);assert.equal(session.snapshot().phase,'closed');
});
