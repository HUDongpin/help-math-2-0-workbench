import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { p042PrepareSourcePcm } from '../src/nms-l02-p042-audio-pcm-v1';
import { P042_AUDIO_SOURCE as source } from '../src/generated/nms-l02-p042-audio-plan-v1';

const audit = new URL('../../../migrations/shared-nms002-l02-p042/audit/', import.meta.url);
const raw = readFileSync(new URL('source-pcm-v1.f32', audit));
const receipt = JSON.parse(readFileSync(new URL('source-pcm-v1.json', audit), 'utf8'));
assert.equal(createHash('sha256').update(raw).digest('hex'), receipt.sha256);
const samples = new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));

test('source PCM retained bit-for-bit through all scheduled audible segments', () => {
  const prepared = p042PrepareSourcePcm(samples);
  assert.equal(prepared.length / source.sampleRate, 52);
  let last = 0;
  for (const segment of source.segments) {
    assert.ok(prepared.subarray(last, segment.outputStart).every(value => value === 0));
    const end = Math.min(segment.outputEnd, prepared.length);
    assert.deepEqual(prepared.subarray(segment.outputStart, end), samples.subarray(segment.sourceStart, segment.sourceStart + end - segment.outputStart));
    last = end;
  }
  assert.ok(samples.subarray(source.silentTailStart).every(value => value === 0));
});

test('nonzero tail and latency are rejected rather than discarded', () => {
  const tail = samples.slice(); tail[source.silentTailStart] = 0.01;
  assert.throws(() => p042PrepareSourcePcm(tail), /TAIL_NOT_SILENT/);
  const latency = samples.slice(); latency[100] = 0.01;
  assert.throws(() => p042PrepareSourcePcm(latency), /LATENCY_NOT_SILENT/);
});

test('wrong decode, invalid samples and silence fail closed', () => {
  assert.throws(() => p042PrepareSourcePcm(samples.subarray(1)), /AUDIO_DECODE/);
  assert.throws(() => p042PrepareSourcePcm(new Float32Array(samples.length)), /AUDIO_SILENT/);
  const invalid = samples.slice(); invalid[10000] = NaN;
  assert.throws(() => p042PrepareSourcePcm(invalid), /AUDIO_NONFINITE/);
});
