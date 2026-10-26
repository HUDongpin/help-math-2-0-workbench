import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm, symlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {extractG678AlgL12P005Stream} from './extract-g678-alg-l12-p005-stream.mjs';

const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const relative = 'migrations/shared-alg001-l12-p005/audio-source-v1';

test('P005 source extraction preserves MP3 bytes, block headers, timing, and the gap', async () => {
  const projectRoot = await mkdtemp(path.join(tmpdir(), 'g678-p005-audio-test-'));
  try {
    const options = {sourceRoot, projectRoot};
    await assert.rejects(extractG678AlgL12P005Stream({...options, check: true}), {code: 'ENOENT'});
    const result = await extractG678AlgL12P005Stream(options);
    assert.equal(result.acceptance, 'machine-evidence-only');
    assert.equal(result.blockCount, 902);
    assert.equal(result.sampleCount, 3309696);
    assert.equal(result.lessonSaProbeSeconds, 7.248);
    assert.ok(result.outputs.reduce((sum, output) => sum + output.bytes, 0) < 20 * 1024 * 1024);
    const receipt = JSON.parse(await readFile(path.join(projectRoot, relative, 'machine-timing-receipt.json')));
    assert.equal(receipt.extraction.sha256, result.payloadSha256);
    assert.deepEqual(receipt.blockGroups, [
      {firstFrame: 23, lastFrame: 339, blockCount: 317},
      {firstFrame: 384, lastFrame: 968, blockCount: 585},
    ]);
    assert.deepEqual(receipt.missingBlockIntervals, [{firstFrame: 340, lastFrame: 383,
      frameCount: 44, audibleMeaning: 'undetermined; absent stream blocks do not establish silence'}]);
    assert.equal(receipt.streamHead.mp3LatencySeek, 1695);
    assert.equal(receipt.blocks[0].rawMp3BlockHeaderHex, '00129f06');
    assert.equal(receipt.blocks[316].signedSeekSamples, -4080);
    assert.equal(receipt.blocks[316].payloadBytes, 0);
    assert.equal(receipt.blocks[317].localFrame, 384);
    assert.equal(receipt.blocks.at(-1).localFrame, 968);
    assert.equal(receipt.ffprobe.extractedMp3.sampleRateHz, 44100);
    assert.equal(receipt.ffprobe.separateLessonSaCandidate.sampleRateHz, 48000);
    assert.equal(receipt.limits.listeningAccepted, false);
    await extractG678AlgL12P005Stream({...options, check: true});
    await assert.rejects(extractG678AlgL12P005Stream(options), /output already exists/);
  } finally {
    await rm(projectRoot, {recursive: true, force: true});
  }
});

test('P005 extraction detects output drift without overwriting it', async () => {
  const projectRoot = await mkdtemp(path.join(tmpdir(), 'g678-p005-audio-drift-'));
  try {
    const options = {sourceRoot, projectRoot};
    await extractG678AlgL12P005Stream(options);
    const receiptPath = path.join(projectRoot, relative, 'machine-timing-receipt.json');
    await writeFile(receiptPath, 'changed');
    await assert.rejects(extractG678AlgL12P005Stream({...options, check: true}), /output differs/);
    await assert.rejects(extractG678AlgL12P005Stream(options), /output already exists/);
    assert.equal((await readFile(receiptPath, 'utf8')), 'changed');
  } finally {
    await rm(projectRoot, {recursive: true, force: true});
  }
});

test('P005 extraction rejects a symlink source root', async () => {
  const projectRoot = await mkdtemp(path.join(tmpdir(), 'g678-p005-audio-link-'));
  try {
    const linkedRoot = path.join(projectRoot, 'source-link');
    await symlink(sourceRoot, linkedRoot);
    await assert.rejects(extractG678AlgL12P005Stream({sourceRoot: linkedRoot, projectRoot}),
      /source root must be a real directory/);
  } finally {
    await rm(projectRoot, {recursive: true, force: true});
  }
});
