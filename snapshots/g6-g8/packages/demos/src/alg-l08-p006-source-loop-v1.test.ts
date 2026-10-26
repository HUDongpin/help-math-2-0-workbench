import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {SOURCE} from './generated/alg-l08-p006-source-loop-v1';
import {SourceLoopAudioSession} from './source-loop-audio-session-v1';
import {SourceStreamCycleClockV2,sourceStreamCyclePosition,sourceStreamCycleSlices} from './source-stream-cycle-clock-v2';
import {visibleFrozenGlossaryControls} from './frozen-calibration-glossary-candidate';
const config={mainId:SOURCE.mainId,clockPlan:SOURCE.clockPlan,sa:SOURCE.sa,initialState:()=>({mainFrame:1,cycle:0,replay:0,glossary:null as string|null}),termsAtFrame:(f:number)=>visibleFrozenGlossaryControls(SOURCE.controls,f).map(c=>c.sourceKeyAttribute)};
test('P006 original files and native decoder measurements bind the actual scheduler without allocating AudioContext',()=>{
 for(const [file,pin]of [[`source-stream-${SOURCE.mainId}.mp3`,SOURCE.clockPlan.decoder],['L8RW06.mp3',SOURCE.sa]]as const){const b=fs.readFileSync(`migrations/${SOURCE.animationId}/source-v1/${file}`);assert.equal(b.length,pin.sourceBytes);assert.equal(createHash('sha256').update(b).digest('hex'),pin.sourceSha256);}
 const clock=new SourceStreamCycleClockV2(SOURCE.clockPlan,{createContext:()=>{throw Error('unexpected audio allocation');},commitHeldFrame:()=>true});assert.equal(clock.snapshot().phase,'idle');
 assert.deepEqual(SOURCE.clockPlan.segments,[{firstFrame:8,firstDecodedSample:1673,endDecodedSample:3456},{firstFrame:10,firstDecodedSample:3510,endDecodedSample:379584},{firstFrame:232,firstDecodedSample:379644,endDecodedSample:726336}]);
 assert.equal(sourceStreamCyclePosition(SOURCE.clockPlan,420/12-0.001).frame,420);assert.deepEqual(sourceStreamCyclePosition(SOURCE.clockPlan,420/12),{cycleIndex:1,seconds:0,frame:1});
 const slices=sourceStreamCycleSlices(SOURCE.clockPlan,215/12,0);assert.equal(slices.length,1);assert.equal(slices[0]!.segmentIndex,2);assert.equal(slices[0]!.delaySeconds,(232-1)/12-215/12);
});
test('P006 mask intervals hold glossary entry until the full source rectangle is visible',()=>{
 const session=new SourceLoopAudioSession(config,{load:async()=>{throw Error('inspection must not read audio');},changed(){}});
 for(const c of SOURCE.controls){const first=c.ranges[0].firstFrame;assert(session.inspect(first-1));assert.equal(session.openGlossary(c.sourceKeyAttribute),false);assert(session.inspect(first));assert(session.openGlossary(c.sourceKeyAttribute));assert.equal(session.inspect(1),false);assert(session.closeGlossary());assert.equal(session.snapshot().frame,first);assert.equal(session.snapshot().phase,'paused');}
 assert.equal(session.openGlossary('invented term'),false);
});
