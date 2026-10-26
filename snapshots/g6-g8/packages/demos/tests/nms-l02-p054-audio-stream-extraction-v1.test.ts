import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const evidenceRoot = '/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/p054-audio-streams-v1';
const script = fileURLToPath(new URL('../../../scripts/extract-nms-l02-p054-audio-v1.py', import.meta.url));
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

test('P054 four whole MP3 streams re-extract from the exact source without audio acceptance', t => {
  if (process.env.HELP_MATH_G678_SOURCE_ROOT !== sourceRoot) {
    t.skip('exact real source root is required');
    return;
  }
  assert.ok(existsSync(evidenceRoot), 'frozen external extraction is required with the real source root');
  const bytes = readFileSync(`${evidenceRoot}/stream-manifest-v1.json`);
  assert.equal(hash(bytes), 'fd31b5e1208eaf54ef3c14fd28d55d61b2fdb3fc47d7b1f41a097d7e40d2dca0');
  const manifest = JSON.parse(bytes.toString('utf8'));
  assert.equal(manifest.audioAccepted, false);
  assert.equal(manifest.originalRuntimeAccepted, false);
  assert.deepEqual(manifest.streams.map((item: {sourceCharacterId: number}) => item.sourceCharacterId),
    [194, 208, 648, 729]);
  assert.deepEqual(manifest.streams.map((item: {blockCount: number}) => item.blockCount),
    [26, 29, 106, 105]);
  for (const item of manifest.streams) {
    const encoded = readFileSync(item.encoded.path);
    assert.equal(encoded.length, item.encoded.bytes);
    assert.equal(hash(encoded), item.encoded.sha256);
    assert.equal(item.blocks.length, item.blockCount);
    assert.equal(item.blocks.reduce((sum: number, block: {sampleCount: number}) =>
      sum + block.sampleCount, 0), item.decodedPcmS16le22050Mono.samples);
    assert.deepEqual(item.emptyMp3Blocks, [item.firstBlockFrame + 1]);
    assert.equal(item.head.latencySeek, 1673);
  }
  const checked = JSON.parse(execFileSync('python3', [script, '--check'],
    {encoding: 'utf8', env: process.env}));
  assert.equal(checked.manifestSha256, hash(bytes));
  assert.equal(checked.streams.length, 4);
});

test('P054 extraction refuses to overwrite the frozen external evidence', t => {
  if (process.env.HELP_MATH_G678_SOURCE_ROOT !== sourceRoot) {
    t.skip('exact real source root is required');
    return;
  }
  assert.ok(existsSync(evidenceRoot), 'frozen external extraction is required with the real source root');
  const before = hash(readFileSync(`${evidenceRoot}/stream-manifest-v1.json`));
  const result = spawnSync('python3', [script, '--write'], {encoding: 'utf8', env: process.env});
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /FileExistsError/u);
  assert.equal(hash(readFileSync(`${evidenceRoot}/stream-manifest-v1.json`)), before);
});

test('P054 audio extraction rejects an unbound source-root setting', () => {
  const result = spawnSync('python3', [script, '--inspect'], {encoding: 'utf8',
    env: {...process.env, HELP_MATH_G678_SOURCE_ROOT: '/tmp'}});
  assert.notEqual(result.status, 0);
});
