import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {analyzeBlockTiming, parseMp3Frames, readP009SwfStream, runP009Analysis, sha256, summarizePcm} from './analyze-g678-alg-l12-p009-stream.mjs';

const swf = fs.readFileSync('/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/VB/L12VB04.swf');
const mp3 = fs.readFileSync(new URL('../migrations/shared-alg001-l12-p009/audit/source-stream.mp3', import.meta.url));
const extracted = readP009SwfStream(swf);
const frames = parseMp3Frames(mp3);
const head = extracted.main.heads[0];

test('physical P009 SWF reproduces the pinned whole stream with one empty packet and no terminal action', () => {
  assert.equal(sha256(swf), 'd8bb6bfb4632fc528a0e14092277d95b2d96998aaeab2f0c1252a0233f35f533');
  assert.equal(sha256(mp3), '15e60f13aad0e2187db0b32f6bcfe65151001a1ded336abd4fb4eb59b3014f2e');
  assert.equal(extracted.fps, 12); assert.equal(extracted.rootFrameCount, 10); assert.equal(extracted.main.declaredFrames, 394);
  assert.equal(extracted.main.blocks.length, 393);
  assert.deepEqual(extracted.main.actions, []);
  assert.deepEqual(head.rawHex, '0a2a2d078906'); assert.equal(head.latencySeekSamples, 1673);
  assert(Buffer.concat(extracted.main.blocks.map(block => block.payload)).equals(mp3));
  const empty = extracted.main.blocks.filter(block => block.mp3PayloadBytes === 0);
  assert.deepEqual(empty.map(block => [block.frame, block.headerHex, block.sampleCount, block.seekSamples]), [[3, '00000000', 0, 0]]);
});

test('whole MP3 frames match SWF counts and expose inter-frame reservoir dependencies', () => {
  assert.equal(frames.length, 1253);
  assert.equal(frames.at(-1).sampleEnd, 721728);
  assert.equal(frames.at(-1).byteOffset + frames.at(-1).frameBytes, 162890);
  assert(frames.every(frame => frame.mpegVersion === 2 && frame.layer === 'III' && frame.channels === 1 && frame.sampleRateHz === 22050));
  assert(frames.every(frame => frame.frameBytes === 130 && frame.samples === 576 && frame.bitrateKbps === 40));
  assert(frames.some(frame => frame.mainDataBeginBytes > 0));
  const timing = analyzeBlockTiming(extracted.main.blocks, frames, head, 12, 394);
  assert.equal(timing.declaredSampleCountSum, 721728);
  assert.deepEqual([...new Set(timing.rows.map(row => row.mp3Frames))].sort((a, b) => a - b), [0, 3, 4, 6]);
  assert.equal(timing.ordinarySeekRecurrence.everyIncrementMatchesNominal, true);
  assert.equal(timing.ordinarySeekRecurrence.incrementsChecked, 390);
  assert.equal(timing.nonemptyBlockOrdinalEquation.nonemptyBlocks, 392);
  assert.equal(timing.nonemptyBlockOrdinalEquation.everyRowMatches, true);
});

test('empty packet adds no silence and raw seek arithmetic stays separate from continuous candidate', () => {
  const timing = analyzeBlockTiming(extracted.main.blocks, frames, head, 12, 394);
  const at3 = timing.rows.find(row => row.frame === 3), at4 = timing.rows.find(row => row.frame === 4);
  assert.equal(at3.rawPrefixPlusSeek, null);
  assert.equal(at3.continuousHypothesisSourceSample, 3510.5);
  assert.equal(at4.rawPrefixPlusSeek, 3510);
  assert.equal(at4.continuousHypothesisSourceSample, 5348);
  assert.equal(at4.continuousMinusRaw, 1838);
  assert.deepEqual(timing.initialNonemptyDelta, {fromFrame: 2, toFrame: 4, rawSamples: 1837, timelineSamples: 3675});
  assert.equal(timing.continuousHypothesis.sourceStartSample, 1673);
  assert.equal(timing.continuousHypothesis.audioEndTimelineSample, 721892.5);
  assert.equal(timing.continuousHypothesis.terminalStartTimelineSample, 722137.5);
  assert.equal(timing.continuousHypothesis.postrollSamplesIfTerminalHeldAtFrameStart, 245);
  assert.equal(timing.continuousHypothesis.sourceHasTerminalStopAction, false);
  assert.deepEqual(timing.terminalArithmetic.rawPrefixPlusSeek, 719940);
  assert.equal(timing.terminalArithmetic.decodedSamplesAfterRawCoordinate, 1788);
  assert.equal(timing.terminalArithmetic.decodedSamplesAfterExtraLatencyArithmetic, 115);
});

test('MP3 header/frame and declared-count errors fail rather than resync, trim or synthesize', () => {
  assert.throws(() => parseMp3Frames(mp3.subarray(1)), /MP3 sync/);
  assert.throws(() => parseMp3Frames(mp3.subarray(0, mp3.length - 1)), /truncated MP3 frame/);
  const reserved = Buffer.from(mp3); reserved[1] = (reserved[1] & ~24) | 8;
  assert.throws(() => parseMp3Frames(reserved), /reserved MPEG version/);
  const wrongCount = extracted.main.blocks.map((block, index) => index === 2 ? {...block, sampleCount: block.sampleCount + 1} : block);
  assert.throws(() => analyzeBlockTiming(wrongCount, frames, head, 12, 394), /declared\/MP3 frame samples differ/);
  const fragment = extracted.main.blocks.map((block, index) => index === 0 ? {...block, mp3PayloadBytes: block.mp3PayloadBytes - 1} : block);
  assert.throws(() => analyzeBlockTiming(fragment, frames, head, 12, 394), /block fragments an MP3 frame/);
});

test('numerical PCM analysis measures only finite samples and preserves exact zero boundaries', () => {
  const pcm = Buffer.alloc(16); [0, 0.25, -0.5, 0].forEach((value, index) => pcm.writeFloatLE(value, index * 4));
  assert.deepEqual(summarizePcm(pcm), {firstSampleInclusive: 0, lastSampleExclusive: 4, samples: 4,
    peak: 0.5, rms: Math.sqrt(0.3125 / 4), nonzero: 2, firstNonzero: 1, lastNonzero: 2});
  assert.equal(summarizePcm(pcm, 3, 4).nonzero, 0);
  assert.throws(() => summarizePcm(pcm.subarray(1)), /partial f32 sample/);
  const invalid = Buffer.from(pcm); invalid.writeFloatLE(NaN, 0);
  assert.throws(() => summarizePcm(invalid), /nonfinite PCM sample/);
});

test('actual FFmpeg/FFprobe decode and every frozen analysis output reproduce read-only', () => {
  const result = runP009Analysis({check: true});
  assert.equal(result.check, true); assert.equal(result.pcmSamples, 721728); assert.equal(result.mp3Frames, 1253);
  assert.equal(result.pcmSeconds, 721728 / 22050);
});
