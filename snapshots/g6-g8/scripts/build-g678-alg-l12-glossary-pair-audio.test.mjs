import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {PAIR_PAGES} from './build-g678-alg-l12-glossary-pair-inputs.mjs';
import {readPairAudioFrame, validatePairAudioIndex} from './build-g678-alg-l12-glossary-pair-audio.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'output/alg-l12-next-glossary-20260927/audio');
const source = () => JSON.parse(fs.readFileSync(path.join(output, 'raw-index.json'), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

test('serialized map reader enforces pair source identity, frame bounds and signed seek', () => {
  const index = source();
  assert.strictEqual(validatePairAudioIndex(index), index);
  for (const config of PAIR_PAGES) {
    assert.equal(index.pages[config.id].source.sha256, config.sha256);
    assert.equal(readPairAudioFrame(index, config.id, 1).blockPresent, false);
    assert.equal(readPairAudioFrame(index, config.id, config.frames).frame, config.frames);
    for (const frame of [0, config.frames + 1, 1.5, NaN])
      assert.throws(() => readPairAudioFrame(index, config.id, frame));
  }
  assert.throws(() => readPairAudioFrame(index, 'shared-alg001-l12-p014', 1));
  assert.equal(readPairAudioFrame(index, 'shared-alg001-l12-p013', 365).seekSamples, -2071);
  assert.equal(readPairAudioFrame(index, 'shared-alg001-l12-p013', 365).emptyPayload, true);
  assert.equal(readPairAudioFrame(index, 'shared-alg001-l12-p015', 474).emptyPayload, false);
  assert.equal(readPairAudioFrame(index, 'shared-alg001-l12-p015', 474).seekSamples, 487);
});

test('serialized map rejects source drift, byte/sample discontinuity and changed negative-seek sign', () => {
  const index = source();
  const clone = () => structuredClone(index);
  const sourceDrift = clone();
  sourceDrift.pages['shared-alg001-l12-p013'].source.sha256 = '0'.repeat(64);
  assert.throws(() => validatePairAudioIndex(sourceDrift), /source identity/);
  const byteDrift = clone();
  byteDrift.pages['shared-alg001-l12-p015'].rows[4].cumulativePayloadByteEnd++;
  assert.throws(() => validatePairAudioIndex(byteDrift));
  const seekDrift = clone();
  seekDrift.pages['shared-alg001-l12-p013'].rows[364].seekSamples = 2071;
  assert.throws(() => validatePairAudioIndex(seekDrift));
});

test('pair outputs reproduce from exact SWFs and both complete MP3s decode to EOF', () => {
  const result = spawnSync(process.execPath,
    [path.join(root, 'scripts/build-g678-alg-l12-glossary-pair-audio.mjs'), '--check'],
    {cwd: root, encoding: 'utf8', timeout: 30000});
  assert.equal(result.status, 0, result.stderr);
  const index = source();
  assert.equal(index.pairInputs.sha256.length, 64);
  for (const config of PAIR_PAGES) {
    const page = index.pages[config.id];
    const mp3 = fs.readFileSync(path.join(output, page.mp3.file));
    assert.equal(sha(mp3), page.mp3.sha256);
    assert.equal(mp3.length, page.totals.mp3PayloadBytes);
    assert.equal(page.decode.decodedSamples, page.totals.declaredSamples);
    assert.equal(page.decode.pcmBytes, page.decode.decodedSamples * 2);
    assert.equal(page.head.latencySeekSamples, 1673);
    assert.equal(page.head.rawHex, '0a2a2d078906');
  }
  assert.deepEqual(index.pages['shared-alg001-l12-p013'].totals.emptyPayloadFrames, [3, 365]);
  assert.deepEqual(index.pages['shared-alg001-l12-p015'].totals.emptyPayloadFrames, [4]);
  assert.deepEqual(index.pages['shared-alg001-l12-p013'].gaps.map(g => [g.firstFrame, g.lastFrame]),
    [[1, 1], [366, 372]]);
  assert.deepEqual(index.pages['shared-alg001-l12-p015'].gaps.map(g => [g.firstFrame, g.lastFrame]),
    [[1, 2]]);
});
