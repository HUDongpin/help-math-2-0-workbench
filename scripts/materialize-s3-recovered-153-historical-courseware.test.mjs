import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';

import {
  checksumBytesForRecords,
  computeObjectShaSetDigest,
  computeReceiptMappingDigest,
  parseArguments,
  validateSafeS3Key,
} from './materialize-s3-recovered-153-historical-courseware.mjs';

test('CLI defaults to read-only preflight and admits exactly one explicit mode', () => {
  assert.deepEqual(parseArguments([]), {mode: 'preflight'});
  assert.deepEqual(parseArguments(['--preflight']), {mode: 'preflight'});
  assert.deepEqual(parseArguments(['--apply']), {mode: 'apply'});
  assert.deepEqual(parseArguments(['--check']), {mode: 'check'});
  assert.throws(() => parseArguments(['--apply', '--check']), /exactly one/);
  assert.throws(() => parseArguments(['--target', '/tmp/foreign']), /unknown argument/);
});

test('source-path validation preserves the two frozen S3 trees and rejects aliases', () => {
  const audio =
    'Transfer/FromLiveServer/SPARK & MARIA AUDIO/Math Foundation 1/Lesson 1/RW/GR3_L1_RWPg2.mp3';
  const swf =
    'Transfer/FromStagingServer/HELP 1.5 VERSION CORRECTIONS/FQ_Review_removed/Elementary/ELMGR5/L1_FQ/L1FQ02.swf';
  assert.equal(
    validateSafeS3Key(audio, 'Transfer/FromLiveServer/SPARK & MARIA AUDIO/'),
    audio,
  );
  assert.equal(
    validateSafeS3Key(
      swf,
      'Transfer/FromStagingServer/HELP 1.5 VERSION CORRECTIONS/',
    ),
    swf,
  );
  for (const unsafe of [
    '/absolute/file.swf',
    '../escape.swf',
    'Transfer//double.swf',
    'Transfer/../escape.swf',
    'Transfer\\windows.swf',
    'Transfer/nul\0.swf',
  ]) {
    assert.throws(() => validateSafeS3Key(unsafe), /S3 display key/);
  }
  assert.throws(
    () => validateSafeS3Key(audio, 'Transfer/FromStagingServer/'),
    /frozen prefix/,
  );
});

test('object-set digest is order independent and duplicate neutral', () => {
  const hashes = ['b'.repeat(64), 'a'.repeat(64), 'b'.repeat(64)];
  const expected = createHash('sha256')
    .update(`${'a'.repeat(64)}\n${'b'.repeat(64)}\n`)
    .digest('hex');
  assert.equal(computeObjectShaSetDigest(hashes), expected);
});

test('receipt mapping digest binds task, path, bytes, object, receipt, and CAS path', () => {
  const record = {
    taskId: 'audio-0001',
    sourceGroup: 'spark-maria-audio',
    sourceOrdinal: 1,
    sourcePath: 'Transfer/FromLiveServer/SPARK & MARIA AUDIO/example.mp3',
    bytes: 42,
    sha256: 'a'.repeat(64),
    sourceReceipt: {sha256: 'b'.repeat(64)},
    cas: {relativePath: `objects/sha256/aa/${'a'.repeat(64)}`},
  };
  const initial = computeReceiptMappingDigest([record]);
  assert.equal(initial, computeReceiptMappingDigest([structuredClone(record)]));
  assert.notEqual(
    initial,
    computeReceiptMappingDigest([{...record, sourcePath: `${record.sourcePath}.variant`}]),
  );
  assert.notEqual(
    initial,
    computeReceiptMappingDigest([{
      ...record,
      sourceReceipt: {sha256: 'c'.repeat(64)},
    }]),
  );
});

test('payload checksum manifest is deterministic and path ordered', () => {
  const records = [
    {sha256: 'b'.repeat(64), archivePath: 'source-paths/z.swf'},
    {sha256: 'a'.repeat(64), archivePath: 'source-paths/a.mp3'},
  ];
  assert.equal(
    checksumBytesForRecords(records).toString('utf8'),
    `${'a'.repeat(64)}  source-paths/a.mp3\n` +
      `${'b'.repeat(64)}  source-paths/z.swf\n`,
  );
});
