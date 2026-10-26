import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {frameToP010TimelineSample, P010_AUDIO_SCHEDULE as schedule, P010_AUDIO_SOURCE as source,
  p010TimelineSampleToFrame, resolveP010AudioSchedule} from '../src/alg-l12-p010-audio-schedule';

const migration = new URL('../../../migrations/shared-alg001-l12-p010/', import.meta.url);

test('exact source stream with1454 native MP3 packets remains complete and untrimmed', () => {
  const encoded = readFileSync(new URL('audit/source-stream.mp3', migration));
  assert.equal(encoded.length,189_020);
  assert.equal(encoded.length,source.bytes);
  assert.equal(createHash('sha256').update(encoded).digest('hex'),source.sha256);
  assert.equal(source.decodedSamples,1454*576);
  assert.equal(schedule.sourceStartSample,0);
  assert.equal(schedule.sourceEndSample,source.decodedSamples);
  assert.equal(schedule.audioEndTimelineSample,schedule.timelineStartSample+source.decodedSamples);
  assert.equal(schedule.terminalTimelineSample,465*22_050/12);
  assert.equal(schedule.terminalTimelineSample-schedule.audioEndTimelineSample,396);
  assert.equal(schedule.sourceHeadLatencySeekSamples,1673);
  assert.equal(schedule.initialLatencyTrimApplied,false);
  assert.equal(schedule.perBlockSeekReclockingApplied,false);
  for(const key of ['sourceTerminalStop','originalRuntime','synchronizationAccepted','listeningAccepted','registered'] as const)
    assert.equal(schedule[key],false);
});

test('all465 exact rational frame boundaries map forward and back without rounded1837 drift',()=>{
  for(let frame=1;frame<=465;frame++){
    const sample=frameToP010TimelineSample(frame);
    assert.equal(sample,(frame-1)*22_050/12);
    assert.equal(p010TimelineSampleToFrame(sample),frame);
    if(frame>1)assert.equal(p010TimelineSampleToFrame(sample-.01),frame-1);
  }
  assert.equal(frameToP010TimelineSample(465),852_600);
  assert.equal(p010TimelineSampleToFrame(schedule.terminalTimelineSample),465);
});

test('empty block11 is a continuous buffer interval; audio ends during final-frame hold',()=>{
  assert.deepEqual(resolveP010AudioSchedule(16_537),{kind:'preroll',timelineSample:16_537});
  assert.deepEqual(resolveP010AudioSchedule(16_537.5),{kind:'active',timelineSample:16_537.5,sourceSample:0,sourceEndSample:837_504});
  assert.deepEqual(resolveP010AudioSchedule(frameToP010TimelineSample(11)),{kind:'active',timelineSample:18_375,sourceSample:1_837.5,sourceEndSample:837_504});
  assert.equal(resolveP010AudioSchedule(854_041).kind,'active');
  assert.deepEqual(resolveP010AudioSchedule(854_041.5),{kind:'postroll',timelineSample:854_041.5});
  assert.equal(p010TimelineSampleToFrame(854_041.5),465);
  assert.deepEqual(resolveP010AudioSchedule(854_437.5),{kind:'terminal',timelineSample:854_437.5});
});

test('invalid frames and timeline values fail closed',()=>{
  for(const value of [0,466,-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER])
    assert.throws(()=>frameToP010TimelineSample(value),/P010_AUDIO_FRAME/);
  for(const value of [-.1,854_438,NaN,Infinity]){
    assert.throws(()=>resolveP010AudioSchedule(value),/P010_AUDIO_TIMELINE_SAMPLE/);
    assert.throws(()=>p010TimelineSampleToFrame(value),/P010_AUDIO_TIMELINE_SAMPLE/);
  }
});
