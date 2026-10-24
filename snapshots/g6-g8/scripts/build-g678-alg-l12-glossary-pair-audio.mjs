#!/usr/bin/env node
// Exact embedded MP3 stream extraction for the P013/P015 glossary pair.
// This records source timing fields; it does not choose a Flash-to-Web trim policy.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {PAIR_OUTPUT, PAIR_PAGES, PAIR_SOURCE_ROOT, buildGlossaryPairInputs,
  physicalPairInput} from './build-g678-alg-l12-glossary-pair-inputs.mjs';
import {indexStreamFrames, rawSwfTags} from './build-g678-alg-l12-p012-audio-source.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, PAIR_OUTPUT, 'audio');
const FFMPEG = '/opt/homebrew/bin/ffmpeg';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const expectations = Object.freeze({
  'shared-alg001-l12-p013': {firstBlockFrame: 2, lastBlockFrame: 365, blocks: 364,
    emptyPayloadFrames: [3, 365], negativeSeek: [[365, -2071]],
    declaredSamples: 666432},
  'shared-alg001-l12-p015': {firstBlockFrame: 3, lastBlockFrame: 474, blocks: 472,
    emptyPayloadFrames: [4], negativeSeek: [], declaredSamples: 866880},
});

function ffmpeg(args, input, maxBuffer = 8 * 1024 * 1024) {
  const result = spawnSync(FFMPEG, args, {input, encoding: null, maxBuffer,
    env: {...process.env, LC_ALL: 'C'}});
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `ffmpeg failed: ${String(result.stderr).slice(0, 600)}`);
  return result.stdout;
}

function decodeToEof(mp3) {
  const pcm = ffmpeg(['-hide_banner', '-loglevel', 'error', '-nostdin', '-xerror',
    '-f', 'mp3', '-i', 'pipe:0', '-map', '0:a:0', '-ac', '1', '-ar', '22050',
    '-c:a', 'pcm_s16le', '-f', 's16le', 'pipe:1'], mp3);
  assert(pcm.length > 0 && pcm.length % 2 === 0, 'invalid decoded PCM length');
  return {decoder: 'ffmpeg', mode: 'complete raw MP3 to EOF; mono s16le 22050 Hz',
    exitCode: 0, decodedSamples: pcm.length / 2,
    decodedDurationSeconds: pcm.length / 2 / 22050,
    pcmBytes: pcm.length, pcmSha256: sha(pcm)};
}

export function validatePairAudioIndex(index) {
  assert.equal(index.schemaVersion, 1);
  assert.equal(index.kind, 'alg-l12-p013-p015-raw-stream-index-v1');
  assert.equal(index.fps, 12);
  assert.deepEqual(Object.keys(index.pages), PAIR_PAGES.map(p => p.id));
  for (const config of PAIR_PAGES) {
    const page = index.pages[config.id];
    const expected = expectations[config.id];
    assert.equal(page.source.sha256, config.sha256, `${config.id}: source identity`);
    assert.equal(page.source.bytes, config.bytes);
    assert.equal(page.domain, `sprite-${config.sprite}`);
    assert.equal(page.frameCount, config.frames);
    assert.equal(page.rows.length, config.frames);
    let sample = 0, byte = 0, blocks = 0;
    for (const [i, row] of page.rows.entries()) {
      assert.equal(row.frame, i + 1, `${config.id}: frame order`);
      assert.equal(row.cumulativeDeclaredSampleStart, sample);
      assert.equal(row.cumulativePayloadByteStart, byte);
      if (row.blockPresent) {
        assert(Number.isInteger(row.declaredSamples) && row.declaredSamples >= 0);
        assert(Number.isInteger(row.seekSamples) && row.seekSamples >= -32768 && row.seekSamples <= 32767);
        assert.equal(row.emptyPayload, row.mp3PayloadBytes === 0);
        sample += row.declaredSamples;
        byte += row.mp3PayloadBytes;
        blocks++;
      } else {
        assert.equal(row.declaredSamples, null);
        assert.equal(row.seekSamples, null);
        assert.equal(row.emptyPayload, null);
        assert.equal(row.mp3PayloadBytes, null);
      }
      assert.equal(row.cumulativeDeclaredSampleEnd, sample);
      assert.equal(row.cumulativePayloadByteEnd, byte);
    }
    assert.equal(blocks, page.totals.blockCount);
    assert.equal(blocks, expected.blocks);
    assert.equal(sample, page.totals.declaredSamples);
    assert.equal(sample, expected.declaredSamples);
    assert.equal(byte, page.totals.mp3PayloadBytes);
    assert.equal(byte, page.mp3.bytes);
    const present = page.rows.filter(row => row.blockPresent);
    assert.equal(present[0].frame, expected.firstBlockFrame);
    assert.equal(present.at(-1).frame, expected.lastBlockFrame);
    assert.deepEqual(present.filter(row => row.emptyPayload).map(row => row.frame),
      expected.emptyPayloadFrames);
    assert.deepEqual(present.filter(row => row.seekSamples < 0)
      .map(row => [row.frame, row.seekSamples]), expected.negativeSeek);
    assert.equal(page.head.latencySeekSamples, 1673);
    assert.equal(page.decode.exitCode, 0);
    assert.equal(page.decode.pcmBytes, page.decode.decodedSamples * 2);
  }
  return index;
}

/** Strict serialized-map reader. A missing block frame remains missing, not silence. */
export function readPairAudioFrame(index, animationId, frame) {
  validatePairAudioIndex(index);
  const config = PAIR_PAGES.find(page => page.id === animationId);
  assert(config, `unknown pair animation ${animationId}`);
  assert(Number.isSafeInteger(frame) && frame >= 1 && frame <= config.frames,
    `${animationId}: source frame outside sprite domain`);
  return index.pages[animationId].rows[frame - 1];
}

function extractPage(config) {
  const expected = expectations[config.id];
  const real = physicalPairInput(`${PAIR_SOURCE_ROOT}/G6-G8-shared/ALG001/L12/VB/${config.stem}.swf`, config);
  const copy = physicalPairInput(path.join(ROOT, PAIR_OUTPUT, config.short, `${config.stem}.swf`), config);
  assert(real.bytes.equals(copy.bytes), `${config.id}: prepared source copy drift`);
  const parsed = rawSwfTags(real.bytes);
  assert.equal(parsed.fps, 12);
  assert.equal(parsed.rootFrames, 10);
  assert.equal(parsed.sprites.get(config.sprite), config.frames);
  const domain = `sprite-${config.sprite}`;
  const heads = parsed.tags.filter(t => t.code === 18 || t.code === 45);
  assert.equal(heads.length, 1, `${config.id}: one independent stream head required`);
  const tag = heads[0];
  assert.equal(tag.domain, domain);
  assert.equal(tag.frame, 1);
  const headBytes = tag.payload;
  assert.equal(headBytes.length, 6);
  assert.equal(headBytes[1] >> 4, 2, 'MP3 stream format');
  assert.equal((headBytes[1] >> 2) & 3, 2, '22050 Hz stream');
  assert.equal((headBytes[1] & 1) + 1, 1, 'mono stream');
  const head = {frame: tag.frame, tagCode: tag.code, sourceTagOffset: tag.offset,
    rawHex: headBytes.toString('hex'), codec: 'MP3', sampleRateHz: 22050,
    channels: 1, nominalSamplesPerFrame: headBytes.readUInt16LE(2),
    latencySeekSamples: headBytes.readInt16LE(4)};
  const allBlocks = parsed.tags.filter(t => t.code === 19);
  assert.equal(allBlocks.length, expected.blocks, `${config.id}: block count`);
  assert(allBlocks.every(t => t.domain === domain), `${config.id}: foreign audio stream`);
  const blocks = allBlocks.map(t => {
    assert(t.payload.length >= 4, `${config.id}: short SoundStreamBlock`);
    return {frame: t.frame, offset: t.offset, payloadOffset: t.payloadOffset,
      body: t.payload, header: t.payload.subarray(0, 4),
      samples: t.payload.readUInt16LE(0), seek: t.payload.readInt16LE(2),
      mp3: t.payload.subarray(4)};
  });
  assert.deepEqual(blocks.map(b => b.frame), Array.from({length: expected.blocks},
    (_, i) => expected.firstBlockFrame + i), `${config.id}: block-frame continuity`);
  assert.equal(blocks.at(-1).frame, expected.lastBlockFrame);
  const stream = indexStreamFrames({domain, frameCount: config.frames, head, blocks, fps: 12});
  assert.equal(stream.totals.declaredSamples, expected.declaredSamples);
  assert.deepEqual(stream.totals.emptyPayloadFrames, expected.emptyPayloadFrames);
  assert.deepEqual(stream.rows.filter(r => r.blockPresent && r.seekSamples < 0)
    .map(r => [r.frame, r.seekSamples]), expected.negativeSeek);
  const mp3 = Buffer.concat(blocks.map(b => b.mp3));
  assert.equal(mp3.length, stream.totals.mp3PayloadBytes);
  assert(mp3.length > 0);
  const audio = {...stream, source: real.pin, preparedCopy: copy.pin,
    mp3: {file: `${config.short}-main-sprite-${config.sprite}.mp3`,
      bytes: mp3.length, sha256: sha(mp3)}, decode: decodeToEof(mp3),
    sourceTimingFacts: {firstBlockFrame: expected.firstBlockFrame,
      lastBlockFrame: expected.lastBlockFrame,
      firstBlockNominalTimelineSeconds: (expected.firstBlockFrame - 1) / 12,
      lastBlockNominalTimelineSeconds: (expected.lastBlockFrame - 1) / 12,
      declaredSampleDurationSeconds: stream.totals.declaredSamples / 22050,
      fullSpriteDurationSeconds: config.frames / 12,
      finalBlockIsEmpty: blocks.at(-1).mp3.length === 0,
      finalBlockDeclaredSamples: blocks.at(-1).samples,
      finalBlockSeekSamples: blocks.at(-1).seek}};
  return {audio, mp3};
}

function build() {
  assert.equal(fs.realpathSync(PAIR_SOURCE_ROOT), PAIR_SOURCE_ROOT, 'real source root required');
  const pairInputs = buildGlossaryPairInputs();
  const sourceInputsFile = physicalPairInput(path.join(ROOT, PAIR_OUTPUT, 'source-inputs.json'));
  assert.deepEqual(JSON.parse(sourceInputsFile.bytes), pairInputs, 'prepared pair inputs drift');
  const pages = {}, files = new Map();
  for (const config of PAIR_PAGES) {
    const {audio, mp3} = extractPage(config);
    pages[config.id] = audio;
    files.set(path.join(OUTPUT, audio.mp3.file), mp3);
  }
  const ffmpegVersion = ffmpeg(['-version']).toString('utf8').split('\n')[0];
  const index = {schemaVersion: 1, kind: 'alg-l12-p013-p015-raw-stream-index-v1',
    claimBoundary: 'Embedded MP3 extraction, signed block fields, raw sample/byte index and complete-EOF decoder measurement only; no playback trim, silence, sync, listening or acceptance decision.',
    pairInputs: sourceInputsFile.pin,
    decoder: {path: FFMPEG, version: ffmpegVersion, outputFormat: 's16le mono 22050 Hz'},
    fps: 12, pages,
    uncertainty: ['Head latencySeekSamples and every signed per-block seek are retained as source values; no trim or offset rule is selected.',
      'P013 final frame 365 has an empty MP3 payload, zero declared samples and signed seek -2071; its Flash playback meaning is unresolved.',
      'An empty MP3 block is not an audible-silence sample and no silence is inserted.',
      'Frames without a SoundStreamBlock do not by themselves prove silence or a pause.',
      'The independent SA sidecar is not spliced into the extracted stream.']};
  validatePairAudioIndex(index);
  files.set(path.join(OUTPUT, 'raw-index.json'), Buffer.from(json(index)));
  return {index, files};
}

function main() {
  const mode = process.argv[2];
  assert(['--write', '--check'].includes(mode) && process.argv.length === 3,
    'usage: build-g678-alg-l12-glossary-pair-audio.mjs --write | --check');
  const {index, files} = build();
  if (mode === '--write') {
    assert(!fs.existsSync(OUTPUT), 'immutable audio output already exists; use --check');
    fs.mkdirSync(OUTPUT, {recursive: false});
    for (const [file, bytes] of files) fs.writeFileSync(file, bytes, {flag: 'wx'});
  } else {
    for (const [file, bytes] of files)
      assert.deepEqual(physicalPairInput(file).bytes, bytes, `audio output drift: ${file}`);
  }
  console.log(JSON.stringify({mode, index: path.relative(ROOT, path.join(OUTPUT, 'raw-index.json')),
    pages: Object.fromEntries(Object.entries(index.pages).map(([id, page]) => [id,
      {domain: page.domain, blocks: page.totals.blockCount, mp3Sha256: page.mp3.sha256,
        decodedSamples: page.decode.decodedSamples,
        negativeSeekFrames: page.totals.negativeSeekFrames}]))}));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
