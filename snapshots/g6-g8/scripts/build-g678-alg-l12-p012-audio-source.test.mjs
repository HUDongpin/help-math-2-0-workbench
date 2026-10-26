import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {coachBranchIndex, indexStreamFrames} from './build-g678-alg-l12-p012-audio-source.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'migrations/shared-alg001-l12-p012/audio-source-v1');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

test('raw frame index distinguishes absent tags from present empty MP3 blocks', () => {
  const emptyBody = Buffer.alloc(4);
  const audioBody = Buffer.from([0x40, 0x02, 0xff, 0xff, 0xaa, 0xbb]);
  const stream = indexStreamFrames({domain: 'sprite-1', frameCount: 4, fps: 12, head: {}, blocks: [
    {frame: 2, offset: 10, payloadOffset: 12, body: emptyBody,
      header: emptyBody, samples: 0, seek: 0, mp3: Buffer.alloc(0)},
    {frame: 4, offset: 20, payloadOffset: 22, body: audioBody,
      header: audioBody.subarray(0, 4), samples: 576, seek: -1, mp3: audioBody.subarray(4)}]});
  assert.deepEqual(stream.gaps.map(({firstFrame, lastFrame}) => [firstFrame, lastFrame]), [[1, 1], [3, 3]]);
  assert.equal(stream.rows[0].blockPresent, false);
  assert.equal(stream.rows[0].emptyPayload, null);
  assert.equal(stream.rows[1].blockPresent, true);
  assert.equal(stream.rows[1].emptyPayload, true);
  assert.equal(stream.rows[1].declaredSamples, 0);
  assert.equal(stream.rows[3].seekSamples, -1);
  assert.deepEqual(stream.totals.negativeSeekFrames, [4]);
  assert.equal(stream.rows[3].cumulativePayloadByteStart, 0);
  assert.equal(stream.rows[3].cumulativePayloadByteEnd, 2);
});

test('coach branch raw bounds do not absorb frames between return and next label', () => {
  const rows = Array.from({length: 8}, (_, i) => ({frame: i + 1, blockPresent: i >= 1,
    emptyPayload: false, declaredSamples: 576, seekSamples: 0,
    cumulativePayloadByteStart: i * 10, cumulativePayloadByteEnd: (i + 1) * 10}));
  const branches = coachBranchIndex(rows,
    [{label: 'S1', firstFrame: 2}, {label: 'S2', firstFrame: 4},
      {label: 'S3', firstFrame: 6}, {label: 'S4', firstFrame: 8}], [2, 4, 6, 8]);
  assert.deepEqual(branches.map(b => b.blockCount), [1, 1, 1, 1]);
  assert.deepEqual(branches.map(b => b.rawInclusiveFrameBounds), [[2, 2], [4, 4], [6, 6], [8, 8]]);
});

test('frozen P012 two-stream outputs reproduce from exact source and decode to EOF', () => {
  const result = spawnSync(process.execPath,
    [path.join(root, 'scripts/build-g678-alg-l12-p012-audio-source.mjs'), '--check'],
    {cwd: root, encoding: 'utf8'});
  assert.equal(result.status, 0, result.stderr);
  const index = JSON.parse(readFileSync(path.join(output, 'raw-index.json'), 'utf8'));
  assert.equal(index.source.sha256, 'b322949a960acef3fee6018a65785b29cd3693717ca3ba33d0d930d7866320aa');
  assert.deepEqual(Object.keys(index.streams), ['coach', 'main']);
  for (const [name, expectedBlocks, expectedSamples] of [['coach', 53, 96768], ['main', 90, 164736]]) {
    const stream = index.streams[name];
    const payload = readFileSync(path.join(output, stream.mp3.file));
    assert.equal(sha(payload), stream.mp3.sha256);
    assert.equal(payload.length, stream.totals.mp3PayloadBytes);
    assert.equal(stream.rows.filter(r => r.blockPresent).length, expectedBlocks);
    assert.equal(stream.rows.reduce((sum, r) => sum + (r.declaredSamples ?? 0), 0), expectedSamples);
    assert.equal(stream.decode.exitCode, 0);
    assert.equal(stream.decode.decodedSamples, expectedSamples);
    assert.equal(stream.decode.pcmBytes, expectedSamples * 2);
  }
  assert.deepEqual(index.streams.coach.totals.emptyPayloadFrames, [4]);
  assert.deepEqual(index.streams.main.totals.emptyPayloadFrames, [31]);
  assert.deepEqual(index.streams.coach.branches.map(b => [b.label, b.firstFrame, b.returnFrame]),
    [['S1', 3, 16], ['S2', 18, 27], ['S3', 31, 36], ['S4', 40, 54]]);
});
