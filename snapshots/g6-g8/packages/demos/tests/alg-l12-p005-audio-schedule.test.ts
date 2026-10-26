import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {P005_AUDIO_SOURCE} from '../src/alg-l12-p005-audio-decode';
import {
  P005_AUDIO_RUNS,
  P005_AUDIO_SCHEDULE,
  resolveP005AudioFrame,
  resolveP005AudioSample,
} from '../src/alg-l12-p005-audio-schedule';

const receiptBytes = readFileSync(new URL(
  '../../../migrations/shared-alg001-l12-p005/audio-source-v1/machine-timing-receipt.json',
  import.meta.url,
));
type TimingReceipt = {
  source: {sha256: string};
  extraction: {sha256: string};
  domain: {declaredFrames: number; fpsNumerator: number; fpsDenominator: number};
  streamHead: {sampleRateHz: number};
  totalBlockHeaderSampleCount: number;
  blockGroups: Array<{firstFrame: number; lastFrame: number; blockCount: number}>;
  missingBlockIntervals: Array<{firstFrame: number; lastFrame: number; frameCount: number}>;
  blocks: Array<{localFrame: number; sampleCount: number; signedSeekSamples: number}>;
};
const receipt = JSON.parse(receiptBytes.toString('utf8')) as TimingReceipt;
const FRAME_SAMPLES = 3_675;
const GROUP_1_END = 1_158_912;
const GROUP_2_START = 1_159_959;
const DECODED_END = 3_309_696;
const FIRST_START = (23 - 1) * FRAME_SAMPLES;
const SECOND_START = (384 - 1) * FRAME_SAMPLES;
const TERMINAL = (968 - 1) * FRAME_SAMPLES;
const FIRST_EXHAUSTION = FIRST_START + GROUP_1_END - 1_695;

test('inferred, unregistered schedule is bound to the pinned source timing receipt', () => {
  assert.equal(createHash('sha256').update(receiptBytes).digest('hex'),
    'c193f9856de277227e8ee6dbe3c97d714863c701398bc98854276e94baa4b639');
  assert.equal(receipt.source.sha256,
    'b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe');
  assert.equal(receipt.extraction.sha256,
    '988a60d21db50f1b70babf7cd9503311c4635be8e46654c8bc6b27fbb26f50af');
  assert.equal(P005_AUDIO_SOURCE.sha256, receipt.extraction.sha256);
  assert.deepEqual(receipt.domain, {
    ...receipt.domain,
    declaredFrames: 968, fpsNumerator: 12, fpsDenominator: 1,
  });
  assert.equal(receipt.streamHead.sampleRateHz, 44_100);
  assert.equal(receipt.totalBlockHeaderSampleCount, DECODED_END);
  assert.deepEqual(receipt.blockGroups, [
    {firstFrame: 23, lastFrame: 339, blockCount: 317},
    {firstFrame: 384, lastFrame: 968, blockCount: 585},
  ]);
  assert.deepEqual(receipt.missingBlockIntervals, [
    {firstFrame: 340, lastFrame: 383, frameCount: 44, audibleMeaning: 'undetermined; absent stream blocks do not establish silence'},
  ]);
  assert.equal(receipt.blocks.length, 902);
  assert.equal(receipt.blocks.reduce((sum, block) => sum + block.sampleCount, 0), DECODED_END);
  assert.equal(receipt.blocks.filter(block => block.localFrame < 384)
    .reduce((sum, block) => sum + block.sampleCount, 0), GROUP_1_END);
  assert.equal(receipt.blocks.filter(block => block.localFrame >= 384)
    .reduce((sum, block) => sum + block.sampleCount, 0), DECODED_END - GROUP_1_END);

  const block = (frame: number) => receipt.blocks.find(entry => entry.localFrame === frame);
  assert.deepEqual(block(23), {...block(23), localFrame: 23, sampleCount: 4_608, signedSeekSamples: 1_695});
  assert.deepEqual(block(24), {...block(24), localFrame: 24, sampleCount: 0, signedSeekSamples: 0});
  assert.deepEqual(block(339), {...block(339), localFrame: 339, sampleCount: 0, signedSeekSamples: -4_080});
  assert.deepEqual(block(384), {...block(384), localFrame: 384, sampleCount: 4_608, signedSeekSamples: 1_047});

  assert.equal(P005_AUDIO_SCHEDULE.status, 'source-derived-inferred-continuous-schedule');
  assert.equal(P005_AUDIO_SCHEDULE.sourceSha256, receipt.source.sha256);
  assert.equal(P005_AUDIO_SCHEDULE.audioSha256, receipt.extraction.sha256);
  assert.equal(P005_AUDIO_SCHEDULE.sampleRate, receipt.streamHead.sampleRateHz);
  assert.equal(P005_AUDIO_SCHEDULE.fps, receipt.domain.fpsNumerator / receipt.domain.fpsDenominator);
  assert.equal(P005_AUDIO_SCHEDULE.samplesPerFrame, FRAME_SAMPLES);
  assert.equal(P005_AUDIO_SCHEDULE.terminalTimelineSample, TERMINAL);
  assert.equal(P005_AUDIO_SCHEDULE.originalRuntime, false);
  assert.equal(P005_AUDIO_SCHEDULE.synchronizationAccepted, false);
  assert.equal(P005_AUDIO_SCHEDULE.registered, false);
  assert.equal(Object.isFrozen(P005_AUDIO_SCHEDULE), true);
  assert.equal(Object.isFrozen(P005_AUDIO_RUNS), true);
  assert.equal(P005_AUDIO_RUNS.every(Object.isFrozen), true);
  assert.deepEqual(P005_AUDIO_RUNS, [
    {group: 1, firstFrame: 23, timelineStartSample: FIRST_START,
      sourceStartSample: 1_695, sourceEndSample: GROUP_1_END},
    {group: 2, firstFrame: 384, timelineStartSample: SECOND_START,
      sourceStartSample: GROUP_2_START, sourceEndSample: DECODED_END},
  ]);
});

test('all 968 frame positions are pure and identical under reverse inspector queries', () => {
  const forward = Array.from({length: 968}, (_, index) => {
    const frame = index + 1;
    const timelineSample = index * FRAME_SAMPLES;
    const expected = frame === 968
      ? {kind: 'terminal', timelineSample}
      : frame < 23
        ? {kind: 'preroll', timelineSample}
        : timelineSample < FIRST_EXHAUSTION
          ? {kind: 'active', timelineSample, group: 1,
            sourceSample: 1_695 + timelineSample - FIRST_START,
            sourceEndSample: GROUP_1_END}
          : frame < 384
            ? {kind: 'gap', timelineSample}
            : {kind: 'active', timelineSample, group: 2,
              sourceSample: GROUP_2_START + timelineSample - SECOND_START,
              sourceEndSample: 3_306_159};
    const actual = resolveP005AudioFrame(frame);
    assert.deepEqual(actual, expected, `frame ${frame}`);
    assert.deepEqual(resolveP005AudioSample(timelineSample), expected, `sample at frame ${frame}`);
    return actual;
  });
  for (let frame = 968; frame >= 1; frame--) {
    assert.deepEqual(resolveP005AudioFrame(frame), forward[frame - 1], `reverse frame ${frame}`);
  }
});

test('integer boundaries preserve continuous samples, exhaustion, and the blockless interval', () => {
  assert.deepEqual(resolveP005AudioSample(FIRST_START - 1),
    {kind: 'preroll', timelineSample: FIRST_START - 1});
  assert.deepEqual(resolveP005AudioSample(FIRST_START),
    {kind: 'active', timelineSample: FIRST_START, group: 1,
      sourceSample: 1_695, sourceEndSample: GROUP_1_END});
  assert.deepEqual(resolveP005AudioSample(FIRST_EXHAUSTION - 1),
    {kind: 'active', timelineSample: FIRST_EXHAUSTION - 1, group: 1,
      sourceSample: GROUP_1_END - 1, sourceEndSample: GROUP_1_END});
  assert.deepEqual(resolveP005AudioSample(FIRST_EXHAUSTION),
    {kind: 'gap', timelineSample: FIRST_EXHAUSTION});
  assert.deepEqual(resolveP005AudioFrame(338),
    {kind: 'gap', timelineSample: 337 * FRAME_SAMPLES});
  for (let frame = 340; frame <= 383; frame++) {
    assert.deepEqual(resolveP005AudioFrame(frame),
      {kind: 'gap', timelineSample: (frame - 1) * FRAME_SAMPLES}, `no active run at ${frame}`);
  }
  assert.deepEqual(resolveP005AudioSample(SECOND_START - 1),
    {kind: 'gap', timelineSample: SECOND_START - 1});
  assert.deepEqual(resolveP005AudioSample(SECOND_START),
    {kind: 'active', timelineSample: SECOND_START, group: 2,
      sourceSample: GROUP_2_START, sourceEndSample: 3_306_159});
  assert.deepEqual(resolveP005AudioSample(TERMINAL - 1),
    {kind: 'active', timelineSample: TERMINAL - 1, group: 2,
      sourceSample: 3_306_158, sourceEndSample: 3_306_159});
  assert.deepEqual(resolveP005AudioSample(TERMINAL),
    {kind: 'terminal', timelineSample: TERMINAL});
  // The 3,537 unplayed source samples are an unresolved terminal-host decision,
  // not silence; a separate FFmpeg probe found nonzero samples in this tail.
  assert.equal(DECODED_END - (GROUP_2_START + TERMINAL - SECOND_START), 3_537);
});

test('zero block 24 continues naturally; frame 25 intentionally diverges from raw seek', () => {
  assert.equal(receipt.blocks.find(block => block.localFrame === 24)?.sampleCount, 0);
  assert.deepEqual(resolveP005AudioFrame(24),
    {kind: 'active', timelineSample: 23 * FRAME_SAMPLES, group: 1,
      sourceSample: 5_370, sourceEndSample: GROUP_1_END});
  const natural = resolveP005AudioFrame(25);
  assert.deepEqual(natural,
    {kind: 'active', timelineSample: 24 * FRAME_SAMPLES, group: 1,
      sourceSample: 9_045, sourceEndSample: GROUP_1_END});
  const rawSeekFrame25 = receipt.blocks
    .filter(block => block.localFrame < 25)
    .reduce((sum, block) => sum + block.sampleCount, 0)
    + (receipt.blocks.find(block => block.localFrame === 25)?.signedSeekSamples ?? Number.NaN);
  assert.equal(rawSeekFrame25, 5_370);
  assert.notEqual(natural.kind === 'active' && natural.sourceSample, rawSeekFrame25,
    'the inferred continuous clock must not be fitted to direct-seek coordinates');
});

test('frame and sample APIs reject unsafe, noninteger, and out-of-domain inputs', () => {
  for (const invalid of [-1, TERMINAL + 1, Number.NaN, Infinity, -Infinity, 0.5,
    Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => resolveP005AudioSample(invalid), /P005_AUDIO_TIMELINE_SAMPLE/, String(invalid));
  }
  for (const invalid of [0, 969, -1, Number.NaN, Infinity, -Infinity, 23.5,
    Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => resolveP005AudioFrame(invalid), /P005_AUDIO_FRAME/, String(invalid));
  }
});
