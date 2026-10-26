import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {readFileSync, lstatSync, realpathSync, existsSync, mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspace = path.join(root, 'migrations/shared-alg001-l12-p006');
const sha = value => createHash('sha256').update(value).digest('hex');
function pinned(file, hash) {
  const before = lstatSync(file, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink() && realpathSync(file) === file, 'physical file required');
  const data = readFileSync(file), after = lstatSync(file, {bigint: true});
  for (const key of ['dev', 'ino', 'size', 'mtimeNs']) assert.equal(before[key], after[key]);
  assert.equal(sha(data), hash, `hash drift: ${file}`);
  return data;
}
const mode = process.argv[2];
assert(['--write', '--check'].includes(mode) && process.argv.length === 3, 'usage: --write | --check');
const input = pinned(path.join(workspace, 'audio-source-v1/sprite-53-source-stream.mp3'),
  '801d34dc684341a2644a7fcc3373bea98cbc14bdf91f4364db0e37c30e7c1803');
const receiptBytes = pinned(path.join(workspace, 'audio-source-v1/stream-source-receipt.json'),
  'c3f1c26102fb9b7e0cb41a60a0de764b8cc68da559a7d20be7ccb42f557f4f78');
const source = JSON.parse(receiptBytes);
pinned(source.sourceSwf.path, '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6');
pinned(path.join(workspace, source.ffdecXml.path), source.ffdecXml.sha256);
assert.equal(input.length, 140920);
assert.equal(source.blocks.length, 340);
let prefix = 0, byteOffset = 0;
const anchors = source.blocks.map((block, index) => {
  assert.equal(block.spriteFrame, index + 3);
  assert.equal(block.payloadOffset, byteOffset);
  const payload = input.subarray(byteOffset, byteOffset + block.payloadBytes);
  assert.equal(payload.length, block.payloadBytes);
  assert.equal(sha(payload), block.payloadSha256);
  const anchor = {frame: block.spriteFrame, sampleCount: block.sampleCount,
    signedSeek: block.signedSeekSamples, decodedPrefix: prefix,
    sourceSeekCoordinate: block.sampleCount ? prefix + block.signedSeekSamples : null};
  prefix += block.sampleCount; byteOffset += block.payloadBytes;
  return anchor;
});
assert.equal(prefix, 624384); assert.equal(byteOffset, input.length);
assert.deepEqual(anchors.filter(a => a.sampleCount === 0).map(a => a.frame), [4]);
assert.equal(anchors[0].sourceSeekCoordinate, 1673);
assert.equal(anchors[2].sourceSeekCoordinate, 3510);
for (let i = 3; i < anchors.length; i++)
  assert.equal(anchors[i].sourceSeekCoordinate - anchors[i - 1].sourceSeekCoordinate, 1837);

const decoder = realpathSync('/opt/homebrew/bin/ffmpeg');
const args = ['-v', 'error', '-nostdin', '-xerror', '-f', 'mp3', '-i', 'pipe:0',
  '-map', '0:a:0', '-c:a', 'pcm_f32le', '-f', 'f32le', 'pipe:1'];
const result = spawnSync(decoder, args, {input, maxBuffer: 8 * 1024 * 1024});
if (result.error) throw result.error;
assert.equal(result.status, 0, result.stderr?.toString());
const pcm = result.stdout;
assert.equal(pcm.length, prefix * 4);
let peak = 0, power = 0, nonzero = 0;
for (let i = 0; i < pcm.length; i += 4) {
  const value = pcm.readFloatLE(i); assert(Number.isFinite(value));
  peak = Math.max(peak, Math.abs(value)); power += value * value;
  if (value !== 0) nonzero++;
}
// Two competing coordinates are retained. Neither is admitted as Flash timing.
const timing = anchors.map(a => ({...a,
  exactTimelineSample: (a.frame - 1) * 22050 / 12,
  continuousFromFrame5: a.frame >= 5 ? 3510 + (a.frame - 5) * 22050 / 12 : null,
  continuousMinusSourceSeek: a.frame >= 5 ? (a.frame - 5) * 0.5 : null,
}));
const output = path.join(workspace, 'audio-pcm-v1');
const manifest = {
  schemaVersion: 1, animationId: source.animationId,
  source: source.sourceSwf, sourceReceiptSha256: sha(receiptBytes), encoded: source.extraction,
  decoder: {path: decoder, sha256: sha(readFileSync(decoder)), args},
  pcm: {file: 'sprite-53-untrimmed.f32le', bytes: pcm.length, sha256: sha(pcm),
    sampleRate: 22050, channels: 1, samples: prefix, seconds: prefix / 22050,
    peak, rms: Math.sqrt(power / prefix), nonzero},
  timing: {fps: 12, nominalSourceSamplesPerFrame: 1837, exactSamplesPerFrame: 1837.5,
    latencySamples: 1673, emptyBlockFrame: 4,
    frame3To5SourceCoordinateDelta: 1837, frame3To5TimelineSampleDelta: 3675,
    terminalFrame: 342, terminalSourceSeek: 622579, terminalContinuousCoordinate: 622747.5,
    sourceSamplesAfterTerminalSeek: prefix - 622579,
    sourceSamplesAfterContinuousTerminal: prefix - 622747.5,
    maximumContinuousMinusSeekSamples: 168.5, frames: timing},
  policy: 'Full decoded PCM retained without trim, silence insertion, resampling, normalization or frame-rate stretching. Empty block is not independently proven silence. Source seek coordinates and continuous-clock coordinates are separate hypotheses; no playback schedule is admitted here.',
  audioAccepted: false, originalRuntimeAccepted: false, registered: false,
};
const files = [[manifest.pcm.file, pcm], ['receipt.json', Buffer.from(JSON.stringify(manifest, null, 2) + '\n')]];
if (mode === '--write') {
  for (const [name] of files) assert(!existsSync(path.join(output, name)), `refusing overwrite: ${name}`);
  mkdirSync(output, {recursive: true});
  for (const [name, bytes] of files) writeFileSync(path.join(output, name), bytes, {flag: 'wx'});
} else for (const [name, bytes] of files) assert.deepEqual(readFileSync(path.join(output, name)), bytes, `drift: ${name}`);
console.log(JSON.stringify({mode, pcm: manifest.pcm, maxSeekDifference: 168.5,
  timingAccepted: false, physicalSourceHashVerified: true}, null, 2));
