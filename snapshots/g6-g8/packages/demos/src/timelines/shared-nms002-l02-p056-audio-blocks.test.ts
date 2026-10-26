import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync} from 'node:fs';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  P056_AUDIO_BLOCK_SAMPLE_COUNTS,
  P056_AUDIO_BLOCK_SOURCE,
} from '../generated/nms-l02-p056-audio-blocks-v1';
import {p056SourceAudioBlock} from './shared-nms002-l02-p056-audio-blocks';

test('P056 audio blocks cover exact teaching frames and preserve source sample totals', () => {
  assert.equal(P056_AUDIO_BLOCK_SOURCE.frameDomain, 'sprite-24');
  assert.equal(P056_AUDIO_BLOCK_SOURCE.sourceSwfSha256,
    'a1872d6c20987340889c1077d6720cbfe046faa3b5228164987e0834f3c639be');
  assert.equal(P056_AUDIO_BLOCK_SAMPLE_COUNTS.length, 230);
  assert.equal(P056_AUDIO_BLOCK_SAMPLE_COUNTS.filter(count => count === 0).length, 1);
  assert.equal(P056_AUDIO_BLOCK_SAMPLE_COUNTS.filter(count => count === 1728).length, 185);
  assert.equal(P056_AUDIO_BLOCK_SAMPLE_COUNTS.filter(count => count === 2304).length, 43);
  assert.equal(P056_AUDIO_BLOCK_SAMPLE_COUNTS.filter(count => count === 3456).length, 1);
  for (let frame = 1; frame <= 4; frame++) assert.equal(p056SourceAudioBlock(frame), null);
  assert.deepEqual(p056SourceAudioBlock(5), {
    teachingFrame: 5, declaredSamples: 3456,
    cumulativeDeclaredSamplesBefore: 0, cumulativeDeclaredSamplesAfter: 3456,
  });
  assert.deepEqual(p056SourceAudioBlock(6), {
    teachingFrame: 6, declaredSamples: 0,
    cumulativeDeclaredSamplesBefore: 3456, cumulativeDeclaredSamplesAfter: 3456,
  });
  let prior = 0;
  for (let frame = 5; frame <= 234; frame++) {
    const block = p056SourceAudioBlock(frame)!;
    assert.equal(block.cumulativeDeclaredSamplesBefore, prior);
    assert.equal(block.cumulativeDeclaredSamplesAfter - prior, block.declaredSamples);
    prior = block.cumulativeDeclaredSamplesAfter;
  }
  assert.equal(prior, 422208);
  assert.equal(p056SourceAudioBlock(234)?.cumulativeDeclaredSamplesAfter, 422208);
  for (const frame of [0, 235, 1.5, NaN]) {
    assert.throws(() => p056SourceAudioBlock(frame), RangeError);
  }
});

test('exact source regenerates P056 audio block IR without overwriting it', t => {
  const sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT;
  if (!sourceRoot) { t.skip('real G6–G8 source root required'); return; }
  assert.equal(sourceRoot,
    '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware');
  const sourceStat = lstatSync(sourceRoot);
  assert.ok(sourceStat.isDirectory() && !sourceStat.isSymbolicLink());
  const script = new URL('../../../../scripts/build-nms-l02-p056-audio-blocks-v1.mjs', import.meta.url);
  const generated = new URL('../generated/nms-l02-p056-audio-blocks-v1.ts', import.meta.url);
  const before = createHash('sha256').update(readFileSync(generated)).digest('hex');
  const env = {...process.env, HELP_MATH_G678_SOURCE_ROOT: sourceRoot};
  const check = spawnSync(process.execPath, [fileURLToPath(script), '--check'],
    {env, encoding: 'utf8'});
  assert.equal(check.status, 0, check.stderr);
  const overwrite = spawnSync(process.execPath, [fileURLToPath(script), '--write'],
    {env, encoding: 'utf8'});
  assert.notEqual(overwrite.status, 0);
  assert.match(overwrite.stderr, /EEXIST/u);
  assert.equal(createHash('sha256').update(readFileSync(generated)).digest('hex'), before);
});
