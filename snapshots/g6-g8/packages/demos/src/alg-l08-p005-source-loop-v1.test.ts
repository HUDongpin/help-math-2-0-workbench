import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {SOURCE} from './generated/alg-l08-p005-source-loop-v1';
import {SourceLoopAudioSession} from './source-loop-audio-session-v1';
import {SourceStreamCycleClockV2,sourceStreamCyclePosition,sourceStreamCycleSlices} from './source-stream-cycle-clock-v2';
import {visibleFrozenGlossaryControls} from './frozen-calibration-glossary-candidate';
const config={mainId:SOURCE.mainId,clockPlan:SOURCE.clockPlan,sa:SOURCE.sa,initialState:()=>({mainFrame:1,cycle:0,replay:0,glossary:null as string|null}),termsAtFrame:(f:number)=>visibleFrozenGlossaryControls(SOURCE.controls,f).map(c=>c.sourceKeyAttribute)};
test('P005 original files and native decoder measurements bind the actual scheduler without allocating AudioContext',()=>{
 for(const [file,pin]of [[`source-stream-${SOURCE.mainId}.mp3`,SOURCE.clockPlan.decoder],['L8RW05.mp3',SOURCE.sa]]as const){const b=fs.readFileSync(`migrations/${SOURCE.animationId}/source-v1/${file}`);assert.equal(b.length,pin.sourceBytes);assert.equal(createHash('sha256').update(b).digest('hex'),pin.sourceSha256);}
 const clock=new SourceStreamCycleClockV2(SOURCE.clockPlan,{createContext:()=>{throw Error('unexpected audio allocation');},commitHeldFrame:()=>true});assert.equal(clock.snapshot().phase,'idle');
 assert.deepEqual(SOURCE.clockPlan.segments,[{firstFrame:7,firstDecodedSample:1673,endDecodedSample:3456},{firstFrame:9,firstDecodedSample:3510,endDecodedSample:278784},{firstFrame:175,firstDecodedSample:279076,endDecodedSample:1012032}]);
 assert.equal(sourceStreamCyclePosition(SOURCE.clockPlan,573/12-0.001).frame,573);assert.deepEqual(sourceStreamCyclePosition(SOURCE.clockPlan,573/12),{cycleIndex:1,seconds:0,frame:1});
 const slices=sourceStreamCycleSlices(SOURCE.clockPlan,159/12,0);assert.equal(slices.length,1);assert.equal(slices[0]!.segmentIndex,2);assert.equal(slices[0]!.delaySeconds,(175-1)/12-159/12);
});
test('P005 mask intervals hold glossary entry until the full source rectangle is visible',()=>{
 const session=new SourceLoopAudioSession(config,{load:async()=>{throw Error('inspection must not read audio');},changed(){}});
 for(const c of SOURCE.controls){const first=c.ranges[0].firstFrame;assert(session.inspect(first-1));assert.equal(session.openGlossary(c.sourceKeyAttribute),false);assert(session.inspect(first));assert(session.openGlossary(c.sourceKeyAttribute));assert.equal(session.inspect(1),false);assert(session.closeGlossary());assert.equal(session.snapshot().frame,first);assert.equal(session.snapshot().phase,'paused');}
 assert.equal(session.openGlossary('invented term'),false);
});
test('P005 close and Replay retire pending source reads without accepting stale completions',async()=>{
 let resolve!:(b:ArrayBuffer)=>void,signal:AbortSignal|undefined,allocations=0;
 const session=new SourceLoopAudioSession(config,{load:(_id,s)=>{signal=s;return new Promise<ArrayBuffer>(r=>resolve=r);},changed(){},makeClock:()=>{allocations++;throw Error('stale audio allocated');}});
 const pending=session.play();assert.equal(session.snapshot().loading,true);await session.close();assert(signal?.aborted);resolve(new ArrayBuffer(0));assert.equal(await pending,false);assert.equal(allocations,0);assert.equal(session.snapshot().phase,'closed');
});
