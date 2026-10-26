#!/usr/bin/env node
// Extract the P003 source MP3 as one continuous encoded stream. This is
// machine evidence, not runtime synchronization or listening acceptance.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {parseSwfSourceFacts} from './build-g4-l3-machine-source-audits.mjs';
import {extractTerminalStream} from './prepare-g678-terminal-source-v1.mjs';
import {SOURCE, MAIN, validateP003SourceStructure} from
  './audit-g678-nms-l09-p003-source.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SA_RELATIVE = 'G6-G8-shared/NMS002/L9/SA/L9RW03.mp3';
const SA_SHA256 = 'e06a0c05b4de7d2a0dc0383b11726121dd2e635548fb5bb9d9e9062984be0e4e';
const DEST = path.join(ROOT,
  'work/g678-shared-page-factory/g678-nms-l09-p003-source-audio-v1');
const STREAM_SHA256 = 'a8ca1683d3f7848f16f9be96e3472c41594485a853778defc96cebfe6243307f';
const PCM_SHA256 = '1c0612cab206ae83ff9e80c7e4f4b7f3b3fdfb711b0bb33b3e248d15d93840a1';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

async function exactOrdinaryFile(file) {
  const before = await lstat(file);
  assert(before.isFile() && !before.isSymbolicLink() && before.nlink === 1 &&
    await realpath(file) === file, `ordinary single-link file required: ${file}`);
  const bytes = await readFile(file);
  const after = await lstat(file);
  assert.equal(after.dev, before.dev);
  assert.equal(after.ino, before.ino);
  assert.equal(after.size, before.size);
  assert.equal(after.mtimeMs, before.mtimeMs);
  return bytes;
}

export function auditP003AudioStream(sourceBytes) {
  validateP003SourceStructure(sourceBytes, parseSwfSourceFacts(sourceBytes));
  const stream = extractTerminalStream(sourceBytes, `sprite-${MAIN.id}`);
  assert.deepEqual(stream.heads, [{domain: 'sprite-246', frame: 1,
    hex: '0a2a2d078906'}]);
  assert.equal(stream.blocks.length, MAIN.frames);
  assert(stream.blocks.every((block, index) => block.frame === index + 1),
    'one authored block per main frame');
  assert.deepEqual(stream.blocks.filter(block =>
    block.samples === 0 || block.mp3Bytes === 0),
  [{frame: 2, samples: 0, seek: 0, mp3Bytes: 0}]);
  assert(stream.blocks.every(block => block.samples >= 0 &&
    block.seek >= 0 && block.mp3Bytes >= 0));
  assert.deepEqual(stream.blocks[0],
    {frame: 1, samples: 3456, seek: 1673, mp3Bytes: 780});
  assert.deepEqual(stream.blocks.at(-1),
    {frame: 635, samples: 1728, seek: 398, mp3Bytes: 390});
  const sumSamples = stream.blocks.reduce((sum, block) =>
    sum + block.samples, 0);
  assert.equal(sumSamples, 1165824);
  assert.equal(stream.mp3.length, 263120);
  assert.equal(sha256(stream.mp3), STREAM_SHA256);
  return Object.freeze({stream, sumSamples});
}

async function decodeWholeMp3(mp3, executable) {
  const decoder = spawn(executable, ['-v', 'error', '-nostdin', '-xerror',
    '-f', 'mp3', '-i', 'pipe:0', '-f', 'f32le', '-acodec', 'pcm_f32le',
    'pipe:1'], {stdio: ['pipe', 'pipe', 'pipe']});
  const digest = createHash('sha256');
  const errors = [];
  let bytes = 0;
  decoder.stdout.on('data', chunk => {bytes += chunk.length; digest.update(chunk);});
  decoder.stderr.on('data', chunk => {errors.push(chunk);});
  decoder.stdin.end(mp3);
  const code = await new Promise((resolve, reject) => {
    decoder.on('error', reject);
    decoder.stdin.on('error', reject);
    decoder.on('close', resolve);
  });
  assert.equal(code, 0, Buffer.concat(errors).toString());
  assert.equal(bytes, 4663296, 'whole-stream decoded PCM size');
  const pcmSha256 = digest.digest('hex');
  assert.equal(pcmSha256, PCM_SHA256, 'whole-stream PCM identity');
  return Object.freeze({sampleRateHz: 22050, channels: 1,
    decodedSamples: bytes / 4, pcmBytes: bytes, pcmSha256});
}

async function frozenFile(file, bytes, check) {
  if (!check) {
    try {await writeFile(file, bytes, {flag: 'wx'});}
    catch (error) {if (error.code !== 'EEXIST') throw error;}
  }
  assert((await exactOrdinaryFile(file)).equals(bytes),
    `P003 audio output collision: ${path.basename(file)}`);
}

export async function prepareP003SourceAudio({check = false} = {}) {
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT, SOURCE_ROOT,
    'P003 audio requires the real source root');
  assert.equal(await realpath(SOURCE_ROOT), SOURCE_ROOT,
    'P003 source root must not be a symlink');
  const source = await exactOrdinaryFile(path.join(SOURCE_ROOT, SOURCE.path));
  assert.equal(source.length, SOURCE.bytes);
  assert.equal(sha256(source), SOURCE.sha256);
  const {stream, sumSamples} = auditP003AudioStream(source);
  const sa = await exactOrdinaryFile(path.join(SOURCE_ROOT, SA_RELATIVE));
  assert.equal(sa.length, 470400);
  assert.equal(sha256(sa), SA_SHA256);
  assert.notEqual(sha256(sa), sha256(stream.mp3),
    'lesson-SA audio is not the embedded source stream');
  const ffmpeg = await realpath('/opt/homebrew/bin/ffmpeg');
  const ffmpegBytes = await exactOrdinaryFile(ffmpeg);
  const decoded = await decodeWholeMp3(stream.mp3, ffmpeg);
  assert.equal(decoded.decodedSamples, sumSamples);
  const script = await exactOrdinaryFile(fileURLToPath(import.meta.url));
  const mp3Path = path.join(DEST, 'source-stream.mp3');
  const receipt = Object.freeze({schemaVersion: 1,
    kind: 'g678-p003-embedded-stream-machine-audit-v1',
    animationId: 'shared-nms002-l09-p003',
    source: {path: path.join(SOURCE_ROOT, SOURCE.path), bytes: source.length,
      sha256: SOURCE.sha256},
    frameDomain: 'sprite-246', frames: 635, fps: 12,
    streamHead: {hex: stream.heads[0].hex, compression: 'MP3',
      sampleRateHz: 22050, channels: 1, latencySamples: 1673},
    blocks: stream.blocks,
    sumSamples,
    emptyFrameNumbers: [2],
    extractedMp3: {path: path.relative(ROOT, mp3Path),
      bytes: stream.mp3.length, sha256: STREAM_SHA256},
    wholeStreamDecode: {...decoded, tool: {path: ffmpeg,
      bytes: ffmpegBytes.length, sha256: sha256(ffmpegBytes)}},
    distinctLessonSaCandidate: {path: path.join(SOURCE_ROOT, SA_RELATIVE),
      bytes: sa.length, sha256: SA_SHA256,
      role: 'catalog-associated file; not substituted for embedded stream'},
    generator: {path: path.relative(ROOT, fileURLToPath(import.meta.url)),
      sha256: sha256(script)},
    gates: {currentJsAudioPlayback: false, originalRuntimeListening: false,
      synchronizationAccepted: false, audioAccepted: false},
  });
  const receiptBytes = Buffer.from(JSON.stringify(receipt, null, 2) + '\n');
  if (!check) await mkdir(DEST, {recursive: true});
  assert.equal(await realpath(DEST), DEST, 'P003 audio output directory must be real');
  await frozenFile(mp3Path, stream.mp3, check);
  await frozenFile(path.join(DEST, 'source-audio-blocks.json'),
    receiptBytes, check);
  return Object.freeze({extractedMp3: receipt.extractedMp3,
    decodedSamples: decoded.decodedSamples,
    emptyFrameNumbers: receipt.emptyFrameNumbers,
    claim: 'machine source and whole-stream decode only'});
}

if (process.argv[1] && path.resolve(process.argv[1]) ===
  fileURLToPath(import.meta.url)) {
  prepareP003SourceAudio({check: process.argv.includes('--check')})
    .then(result => process.stdout.write(JSON.stringify(result) + '\n'))
    .catch(error => {process.stderr.write(`${error.stack ?? error}\n`);
      process.exitCode = 1;});
}
