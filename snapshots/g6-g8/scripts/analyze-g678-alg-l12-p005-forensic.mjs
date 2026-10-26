#!/usr/bin/env node

import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultInput = path.join(root, 'output/playwright/g678-p005-source-forensic-20260926/linear-trace-part-a.json');
const sourceSha = 'b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe';
const derivativeSha = 'ce856f85e3cbc9f5384a437b9c573a58589999f211fdf207774a41d7366c410b';
const audioPayloadSha = '988a60d21db50f1b70babf7cd9503311c4635be8e46654c8bc6b27fbb26f50af';
const mainFrames = 968;
const runtimeFiles = [
  ['/1ef41ff58c9763bed027.wasm', 14201591, 'cd0a675924f4f40a8e1e7e16f8e7fe2105d13edfb2fd650dc42aaeac1e92143a'],
  ['/63468f5322aed2e768a8.wasm', 14146177, '381c459563278d830db728beb8e8f1bdeedb390d50b3c6b16bd6e4af6c2ed016'],
  ['/core.ruffle.0875e44536e955474b0c.js', 104433, '28fa24cd43c3d91899f92a5beedde63c58753b63850ed4b16484c14791625f7a'],
  ['/core.ruffle.831c4f4a93befb9e84af.js', 110362, '16214a9d1cc55219ee196fcd2bab9d303a6985567cbfe8ffc891eebacfd4cd29'],
  ['/ruffle.js', 461418, '8593f2d1f7cc39f2000c02813bed664bfb0594dee15c3e8e18ca9f0c201081f2'],
];
const finite = (value) => typeof value === 'number' && Number.isFinite(value);

function validateBinding(trace) {
  const binding = trace?.binding;
  assert.equal(binding?.animationId, 'shared-alg001-l12-p005');
  assert.equal(binding.sourceSha256, sourceSha);
  assert.equal(binding.sourceBytes, 1950595);
  assert.equal(binding.runtime, 'Ruffle');
  assert.equal(binding.version, '0.4.1');
  assert.ok(Array.isArray(binding.runtimeFiles), 'runtime file inventory required');
  assert.deepEqual(binding.runtimeFiles.map(({name, bytes, sha256}) => [name, bytes, sha256]).sort(),
    [...runtimeFiles].sort(), 'runtime file inventory drift');
  assert.equal(binding.authority, 'forensic-compatibility-only');
  assert.equal(binding.sourceModified, true);
  assert.equal(binding.audibleOutput, false);
  assert.equal(binding.originalRuntime, false);
  assert.equal(binding.acceptance, false);
  const derivative = binding.derivative;
  assert.equal(derivative?.sourceSha256, sourceSha);
  assert.equal(derivative.derivativeSha256, derivativeSha);
  assert.equal(derivative.derivativeBytes, 2292879);
  assert.equal(derivative.modifiedRootActionCount, 1);
  assert.equal(derivative.insertedMainTraceCount, mainFrames);
  assert.equal(derivative.audioBlockBodiesPreserved, true);
  assert.equal(derivative.audioPayloadSha256, audioPayloadSha);
  assert.equal(derivative.authority, 'instrumented-ruffle-diagnostic-only');
  assert.equal(derivative.entryAssumption, 'play root frames1-6 until authored begin stop');
  assert.equal(derivative.originalHostEntryProven, false);
  assert.equal(derivative.originalRuntime, false);
  assert.equal(trace.metadata?.uncompressedLength, derivative.derivativeBytes);
  assert.equal(trace.loadedConfig?.url, '/source.swf');
  assert.equal(trace.loadedConfig.allowNetworking, 'none');
  assert.equal(trace.loadedConfig.allowScriptAccess, false);
  assert.ok(Array.isArray(trace.contexts) && trace.contexts.length === 1,
    'exactly one audio context required for the trace clock');
  assert.equal(trace.contexts[0].muted, true);
  assert.equal(trace.contexts[0].state, 'running');
  assert.equal(trace.contexts[0].sampleRate, 44100);
  assert.ok(finite(trace.contexts[0].time) && trace.contexts[0].time >= 0,
    'invalid audio context time');
}

function startSummary(event) {
  return {id: event.id, scheduledAtSeconds: event.args[0],
    firstSampleAtSeconds: event.args[0] + event.firstNonzero / event.sampleRate,
    firstNonzeroSample: event.firstNonzero};
}

export function analyzeG678AlgL12P005Forensic(bytes, inputPath = '<buffer>') {
  const inputSha256 = createHash('sha256').update(bytes).digest('hex');
  const trace = JSON.parse(bytes.toString('utf8'));
  validateBinding(trace);
  assert.ok(finite(trace.nowMs) && trace.nowMs >= 0, 'invalid capture time');
  assert.ok(Array.isArray(trace.events) && trace.events.length > 0, 'events required');
  if (trace.eventCapacity !== undefined) {
    assert.ok(Number.isSafeInteger(trace.eventCapacity) && trace.eventCapacity > 0);
    assert.ok(trace.events.length <= trace.eventCapacity);
  }
  if (trace.droppedEvents !== undefined) {
    assert.ok(Number.isSafeInteger(trace.droppedEvents) && trace.droppedEvents >= 0);
  }

  const frames = [];
  const starts = [];
  for (const event of trace.events) {
    assert.ok(event && finite(event.wallMs), 'event wallMs required');
    if (event.type === 'trace') {
      const match = /^P005_MAIN_FRAME:(\d+)$/u.exec(event.message);
      assert.ok(match, `unexpected frame trace: ${event.message}`);
      const frame = Number(match[1]);
      assert.equal(frame, frames.length + 1, `noncontiguous main frame ${frame}`);
      assert.ok(frame <= mainFrames, 'main frame exceeds source domain');
      assert.ok(finite(event.contextTime) && event.contextTime >= 0, 'invalid frame context time');
      if (frames.length) assert.ok(event.contextTime > frames.at(-1).contextTime, 'nonincreasing frame time');
      frames.push({frame, contextTime: event.contextTime});
    } else if (event.type === 'start') {
      assert.ok(Number.isSafeInteger(event.id) && event.id > 0, 'invalid chunk id');
      assert.ok(finite(event.contextTime) && event.contextTime >= 0, 'invalid chunk context time');
      assert.ok(Array.isArray(event.args) && event.args.length === 1 && finite(event.args[0]) && event.args[0] >= 0,
        'invalid chunk schedule');
      assert.ok(event.args[0] >= event.contextTime, 'chunk scheduled before context time');
      assert.equal(event.contextState, 'running', 'chunk context must be running');
      assert.equal(event.loop, false, 'looped chunk unsupported');
      assert.ok(finite(event.duration) && event.duration > 0, 'invalid chunk duration');
      assert.ok(finite(event.args[0] + event.duration), 'invalid chunk end time');
      assert.ok(Number.isSafeInteger(event.samples) && event.samples > 0, 'invalid chunk sample count');
      assert.equal(event.sampleRate, trace.contexts[0].sampleRate, 'chunk sample rate differs from context');
      assert.ok(Math.abs(event.duration - event.samples / event.sampleRate) <= 1e-9,
        'chunk duration differs from samples/sampleRate');
      assert.ok(Number.isSafeInteger(event.channels) && event.channels > 0, 'invalid channel count');
      assert.ok(finite(event.peak) && event.peak >= 0 && finite(event.rms) && event.rms >= 0,
        'invalid chunk levels');
      assert.ok(event.firstNonzero === null ||
        (Number.isSafeInteger(event.firstNonzero) && event.firstNonzero >= 0 && event.firstNonzero < event.samples),
      'invalid first nonzero sample');
      assert.equal(event.firstNonzero === null, event.peak === 0, 'nonzero sample/peak mismatch');
      assert.equal(event.firstNonzero === null, event.rms === 0, 'nonzero sample/RMS mismatch');
      starts.push(event);
    }
  }
  assert.ok(frames.length > 0, 'main frame trace required');
  const gapStart = frames[339]?.contextTime;
  const gapEnd = frames[383]?.contextTime;
  assert.ok(finite(gapStart) && finite(gapEnd) && gapEnd > gapStart,
    'frame 340..384 context interval required');
  const inside = starts.filter((event) => event.args[0] >= gapStart &&
    event.args[0] + event.duration <= gapEnd);
  const nonzeroInside = inside.filter((event) => event.firstNonzero !== null);
  const earliest = (events) => events.reduce((first, event) =>
    first === null || event.args[0] < first.args[0] ? event : first, null);
  const firstNonzero = earliest(starts.filter((event) => event.firstNonzero !== null));
  const firstNonzeroAfterGap = earliest(starts.filter((event) => event.firstNonzero !== null &&
    event.args[0] >= gapEnd));
  const frameComplete = frames.length === mainFrames;
  const droppedEvents = trace.droppedEvents ?? null;
  return {
    schemaVersion: 1,
    status: 'instrumented-ruffle-forensic-diagnostic-only',
    input: {path: inputPath, bytes: bytes.length, sha256: inputSha256},
    binding: {animationId: trace.binding.animationId, sourceSha256: sourceSha,
      sourceModified: true, derivativeSha256: derivativeSha, entry: 'linear'},
    frameTrace: {first: 1, last: frames.at(-1).frame, observed: frames.length,
      expected: mainFrames, contiguous: true, complete: frameComplete,
      firstContextTimeSeconds: frames[0].contextTime,
      lastContextTimeSeconds: frames.at(-1).contextTime},
    capture: {eventCount: trace.events.length, eventCapacity: trace.eventCapacity ?? null,
      droppedEvents, complete: frameComplete && droppedEvents === 0 &&
        trace.eventCapacity !== undefined && trace.events.length < trace.eventCapacity},
    gap: {firstFrame: 340, lastFrameInclusive: 383, boundaryFrame: 384,
      startContextTimeSeconds: gapStart, endContextTimeSeconds: gapEnd,
      chunksEntirelyInside: inside.length, zeroChunksEntirelyInside: inside.length - nonzeroInside.length,
      nonzeroChunksEntirelyInside: nonzeroInside.length},
    firstNonzero: firstNonzero ? startSummary(firstNonzero) : null,
    firstNonzeroAfterGap: firstNonzeroAfterGap ? startSummary(firstNonzeroAfterGap) : null,
    limits: 'Recorded muted WebAudio chunk data from a modified SWF in Ruffle; no original-runtime, audible-output, fidelity, or audio acceptance claim.',
  };
}

async function readTrace(file) {
  const before = await lstat(file, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink() && before.size <= 64n * 1024n * 1024n,
    'input must be a physical trace file within 64 MiB');
  assert.equal(await realpath(file), file, 'input must not traverse a symlink');
  const bytes = await readFile(file);
  const after = await lstat(file, {bigint: true});
  for (const key of ['dev', 'ino', 'size', 'mtimeNs']) assert.equal(after[key], before[key], `input changed: ${key}`);
  return bytes;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length > 3) {
    console.error('Usage: node scripts/analyze-g678-alg-l12-p005-forensic.mjs [trace.json]');
    process.exitCode = 2;
  } else {
    const file = path.resolve(process.argv[2] ?? defaultInput);
    readTrace(file).then((bytes) => console.log(JSON.stringify(
      analyzeG678AlgL12P005Forensic(bytes, path.relative(root, file)), null, 2)))
      .catch((error) => { console.error(error.message); process.exitCode = 1; });
  }
}
