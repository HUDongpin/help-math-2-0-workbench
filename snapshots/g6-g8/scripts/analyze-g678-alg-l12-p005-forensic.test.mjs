import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';

import {analyzeG678AlgL12P005Forensic} from './analyze-g678-alg-l12-p005-forensic.mjs';

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'output/playwright/g678-p005-source-forensic-20260926';
const partA = await readFile(path.join(root, base, 'linear-trace-part-a.json'));
const full = await readFile(path.join(root, base, 'linear-full-trace.json'));
const partB = await readFile(path.join(root, base, 'linear-trace-part-b.json'));
const changed = (bytes, edit) => {
  const trace = JSON.parse(bytes);
  edit(trace);
  return Buffer.from(JSON.stringify(trace));
};

test('part A reports a contiguous but incomplete trace and bounded zero-chunk interval', () => {
  const result = analyzeG678AlgL12P005Forensic(partA, 'linear-trace-part-a.json');
  assert.equal(result.input.sha256, 'b47a867876d81cb7408fe4309b4272de227ad71bcb5f510b6fd3329095f137f5');
  assert.equal(result.binding.sourceSha256, 'b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe');
  assert.deepEqual([result.frameTrace.first, result.frameTrace.last, result.frameTrace.observed,
    result.frameTrace.complete], [1, 901, 901, false]);
  assert.equal(result.capture.complete, false);
  assert.equal(result.capture.droppedEvents, null);
  assert.equal(result.gap.zeroChunksEntirelyInside, 157);
  assert.equal(result.gap.nonzeroChunksEntirelyInside, 0);
  assert.equal(result.firstNonzero.scheduledAtSeconds, 2.507755102040818);
});

test('full capture binds the linear derivative and covers all 968 frames without dropped events', () => {
  const result = analyzeG678AlgL12P005Forensic(full, 'linear-full-trace.json');
  assert.equal(result.input.sha256, 'c21e7d4957a5093454db0496634d5942d70d8d2e605fc290ed1a7e29a557b5a0');
  assert.equal(result.binding.derivativeSha256, 'ce856f85e3cbc9f5384a437b9c573a58589999f211fdf207774a41d7366c410b');
  assert.deepEqual([result.frameTrace.first, result.frameTrace.last, result.frameTrace.observed,
    result.frameTrace.complete], [1, 968, 968, true]);
  assert.deepEqual([result.capture.eventCount, result.capture.eventCapacity,
    result.capture.droppedEvents, result.capture.complete], [11279, 30000, 0, true]);
  assert.deepEqual([result.gap.firstFrame, result.gap.lastFrameInclusive,
    result.gap.boundaryFrame, result.gap.chunksEntirelyInside,
    result.gap.nonzeroChunksEntirelyInside], [340, 383, 384, 158, 0]);
  assert.equal(result.firstNonzero.scheduledAtSeconds, 2.493242630385489);
  assert.equal(result.firstNonzeroAfterGap.scheduledAtSeconds, 32.74884353741412);
  assert.match(result.limits, /no original-runtime, audible-output, fidelity, or audio acceptance claim/);
});

test('CLI prints JSON for an explicit full capture', async () => {
  const {stdout} = await run(process.execPath,
    [path.join(root, 'scripts/analyze-g678-alg-l12-p005-forensic.mjs'),
      path.join(root, base, 'linear-full-trace.json')], {cwd: root});
  const result = JSON.parse(stdout);
  assert.equal(result.frameTrace.last, 968);
  assert.equal(result.capture.complete, true);
  assert.equal(result.input.path, `${base}/linear-full-trace.json`);
});

test('unbound or wrongly entered traces fail closed', () => {
  for (const edit of [
    (trace) => { trace.binding.sourceSha256 = '0'.repeat(64); },
    (trace) => { trace.binding.sourceModified = false; },
    (trace) => { trace.binding.derivative.derivativeSha256 = '0'.repeat(64); },
    (trace) => { trace.binding.derivative.entryAssumption = 'jump directly to authored root begin frame6'; },
  ]) {
    assert.throws(() => analyzeG678AlgL12P005Forensic(changed(partA, edit)));
  }
});

test('runtime, single clock, and sandboxed load config are pinned', () => {
  for (const edit of [
    (trace) => { trace.binding.version = '0.4.2'; },
    (trace) => { trace.binding.runtimeFiles[0].sha256 = '0'.repeat(64); },
    (trace) => { trace.contexts.push({...trace.contexts[0]}); },
    (trace) => { trace.contexts[0].muted = false; },
    (trace) => { trace.loadedConfig.allowNetworking = 'all'; },
    (trace) => { trace.loadedConfig.allowScriptAccess = true; },
  ]) {
    assert.throws(() => analyzeG678AlgL12P005Forensic(changed(full, edit)));
  }
});

test('chunk scheduling and buffer shape must agree with the single running context', () => {
  for (const edit of [
    (event) => { event.duration *= 2; },
    (event) => { event.loop = true; },
    (event) => { event.contextState = 'suspended'; },
    (event) => { event.channels = 0; },
    (event) => { event.sampleRate = 48000; },
    (event) => { event.args[0] = event.contextTime - 0.001; },
  ]) {
    assert.throws(() => analyzeG678AlgL12P005Forensic(changed(partA, (trace) => {
      edit(trace.events.find((event) => event.type === 'start' && event.contextTime > 0));
    })));
  }
});

test('missing frame, malformed chunk, and trace-free continuation fail closed', () => {
  assert.throws(() => analyzeG678AlgL12P005Forensic(changed(partA, (trace) => {
    trace.events = trace.events.filter((event) => event.message !== 'P005_MAIN_FRAME:340');
  })), /noncontiguous main frame/);
  assert.throws(() => analyzeG678AlgL12P005Forensic(changed(partA, (trace) => {
    trace.events.find((event) => event.type === 'start').args = [];
  })), /invalid chunk schedule/);
  assert.throws(() => analyzeG678AlgL12P005Forensic(partB), /main frame trace required/);
});

test('dropped events keep capture incomplete even when all frame markers are present', () => {
  const result = analyzeG678AlgL12P005Forensic(changed(full, (trace) => {
    trace.droppedEvents = 1;
  }));
  assert.equal(result.frameTrace.complete, true);
  assert.equal(result.capture.complete, false);
  const unknownCapacity = analyzeG678AlgL12P005Forensic(changed(full, (trace) => {
    delete trace.eventCapacity;
  }));
  assert.equal(unknownCapacity.frameTrace.complete, true);
  assert.equal(unknownCapacity.capture.complete, false);
});
