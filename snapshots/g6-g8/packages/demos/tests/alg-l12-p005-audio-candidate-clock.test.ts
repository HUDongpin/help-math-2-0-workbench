import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import {P005AudioCandidateClock, P005_AUDIO_CANDIDATE_CLOCK_POLICY} from
  '../src/alg-l12-p005-audio-candidate-clock';
import {P005_AUDIO_SOURCE} from '../src/alg-l12-p005-audio-decode';
import {P005_AUDIO_SCHEDULE} from '../src/alg-l12-p005-audio-schedule';

const RATE = 44_100;
const FRAME = 3_675;
const FIRST_START = 80_850;
const FIRST_SOURCE_START = 1_695;
const FIRST_SOURCE_END = 1_158_912;
const FIRST_EXHAUSTION = 1_238_067;
const ABSENT_BLOCK_START = 1_245_825;
const SECOND_START = 1_407_525;
const SECOND_SOURCE_START = 1_159_959;
const TERMINAL = 3_553_725;
const CANDIDATE_SOURCE_END = 3_306_159;
const DECODED_END = 3_309_696;

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((done, fail) => {resolve = done; reject = fail;});
  return {promise, resolve, reject};
}

class FakeGain {
  gain = {value: -1};
  disconnects = 0;
  constructor(private readonly destination: unknown) {}
  connect(destination: unknown) {assert.strictEqual(destination, this.destination);}
  disconnect() {this.disconnects++;}
}

/** Exercise the real transport with observable Web Audio ownership. Natural
 * completion is driven by the audio clock, independently of candidate tick(). */
class FakeSource {
  buffer: AudioBuffer | null = null;
  loop = false;
  onended: (() => void) | null = null;
  starts: Array<[number, number, number]> = [];
  stops = 0;
  disconnects = 0;
  active = false;
  ended = false;
  private endingAt = Number.POSITIVE_INFINITY;
  constructor(private readonly context: FakeContext) {}
  connect(target: unknown) {assert.strictEqual(target, this.context.gain);}
  start(when: number, offset: number, duration: number) {
    assert(Number.isFinite(when) && Number.isFinite(offset) && duration > 0);
    assert.equal(this.context.activeSources().length, 0, 'a new source must never overlap an owned node');
    this.starts.push([when, offset, duration]);
    this.endingAt = when + duration;
    this.active = true;
  }
  stop() {this.stops++; this.active = false;}
  disconnect() {this.disconnects++; this.active = false;}
  finishIfDue() {
    if (!this.active || this.context.currentTime + 1e-10 < this.endingAt) return;
    this.active = false;
    this.ended = true;
    this.onended?.();
  }
}

class FakeContext {
  sampleRate = RATE;
  state: AudioContextState = 'suspended';
  currentTime = 0;
  destination = {};
  gain = new FakeGain(this.destination);
  sources: FakeSource[] = [];
  resumeCalls = 0;
  closeCalls = 0;
  resumeNext: (() => Promise<void>) | undefined;
  private listeners = new Set<EventListenerOrEventListenerObject>();

  createGain() {return this.gain;}
  createBufferSource() {
    const source = new FakeSource(this);
    this.sources.push(source);
    return source;
  }
  activeSources() {return this.sources.filter(source => source.active);}
  listenerCount() {return this.listeners.size;}
  addEventListener(type: string, listener: EventListenerOrEventListenerObject | null) {
    assert.equal(type, 'statechange');
    if (listener) this.listeners.add(listener);
  }
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null) {
    assert.equal(type, 'statechange');
    if (listener) this.listeners.delete(listener);
  }
  changeState(state: AudioContextState) {
    this.state = state;
    const event = new Event('statechange');
    for (const listener of this.listeners) {
      if (typeof listener === 'function') listener(event);
      else listener.handleEvent(event);
    }
  }
  async resume() {
    this.resumeCalls++;
    await this.resumeNext?.();
    if (this.state !== 'closed') this.changeState('running');
  }
  async close() {this.closeCalls++; this.changeState('closed');}
  advanceSamples(samples: number) {
    assert(Number.isSafeInteger(samples) && samples >= 0);
    if (this.state !== 'running') return;
    this.currentTime += samples / RATE;
    for (const source of this.sources) source.finishIfDue();
  }
}

function fixture() {
  const context = new FakeContext();
  const decoded = {sampleRate: RATE, numberOfChannels: 1, length: DECODED_END} as AudioBuffer;
  const clock = new P005AudioCandidateClock(context as unknown as AudioContext, decoded);
  return {context, decoded, clock};
}

function assertWindow(source: FakeSource, startSample: number, endSample: number) {
  assert.equal(source.starts.length, 1);
  const [when, offset, duration] = source.starts[0]!;
  assert(Number.isFinite(when));
  assert.equal(Math.round(offset * RATE), startSample);
  assert.equal(Math.round(duration * RATE), endSample - startSample);
  assert.equal(source.loop, false);
}

test('natural muted candidate traverses preroll, both audio groups, source-block gap and terminal', async () => {
  const {context, decoded, clock} = fixture();
  try {
    const initial = clock.snapshot();
    assert.equal(initial.state, 'paused');
    assert.equal(initial.timelineSample, 0);
    assert.equal(initial.frame, 1);
    assert.equal(initial.phase, 'preroll');
    assert.equal(initial.audio.volume, 0);
    assert.equal(context.gain.gain.value, 0);
    assert.equal(context.sources.length, 0);

    assert.equal(await clock.play(), true);
    assert.equal(clock.snapshot().state, 'playing');
    context.advanceSamples(FIRST_START - 1);
    let state = await clock.tick();
    assert.equal(state.phase, 'preroll');
    assert.equal(state.timelineSample, FIRST_START - 1);
    assert.equal(context.sources.length, 0);

    context.advanceSamples(1);
    state = await clock.tick();
    assert.equal(state.frame, 23);
    assert.equal(state.phase, 'first-run');
    assert.equal(state.timelineSample, FIRST_START);
    assert.equal(state.audio.sample, FIRST_SOURCE_START);
    assert.equal(context.sources.length, 1);
    assertWindow(context.sources[0]!, FIRST_SOURCE_START, FIRST_SOURCE_END);
    assert.strictEqual(context.sources[0]!.buffer, decoded);

    context.advanceSamples(FRAME);
    state = await clock.tick();
    assert.equal(state.frame, 24);
    assert.equal(state.phase, 'initial-zero-block');
    assert.equal(state.audio.sample, 5_370);
    assert.equal(context.sources.length, 1, 'zero new block bytes do not stop or restart the continuous run');
    assert.equal(context.sources[0]!.stops, 0);

    context.advanceSamples(FRAME);
    state = await clock.tick();
    assert.equal(state.frame, 25);
    assert.equal(state.phase, 'first-run');
    assert.equal(state.audio.sample, 9_045);
    assert.equal(context.sources.length, 1);

    context.advanceSamples(FIRST_EXHAUSTION - 1 - state.timelineSample);
    state = await clock.tick();
    assert.equal(state.phase, 'first-run');
    assert.equal(state.audio.sample, FIRST_SOURCE_END - 1);
    assert.equal(context.activeSources().length, 1);
    context.advanceSamples(1);
    state = await clock.tick();
    assert.equal(state.phase, 'first-run-depleted');
    assert.equal(state.timelineSample, FIRST_EXHAUSTION);
    assert.equal(state.audio.sample, FIRST_SOURCE_END);
    assert.equal(state.state, 'playing', 'source exhaustion leaves the independent candidate timeline running');
    assert.equal(context.activeSources().length, 0);
    assert.equal(context.sources[0]!.ended, true);

    context.advanceSamples(338 * FRAME - state.timelineSample);
    state = await clock.tick();
    assert.equal(state.frame, 339);
    assert.equal(state.phase, 'first-run-depleted');
    assert.equal(state.audio.sample, FIRST_SOURCE_END);
    assert.equal(context.sources.length, 1, 'zero block339 does not create a stop cue or an extra audio node');

    context.advanceSamples(ABSENT_BLOCK_START - state.timelineSample);
    state = await clock.tick();
    assert.equal(state.frame, 340);
    assert.equal(state.phase, 'missing-block-gap');
    assert.equal(context.sources.length, 1, 'the gap does not synthesize an extra source node');
    context.advanceSamples(SECOND_START - 1 - state.timelineSample);
    state = await clock.tick();
    assert.equal(state.phase, 'missing-block-gap');
    assert.equal(state.frame, 383);
    assert.equal(context.activeSources().length, 0);

    context.advanceSamples(1);
    state = await clock.tick();
    assert.equal(state.frame, 384);
    assert.equal(state.phase, 'second-run');
    assert.equal(state.timelineSample, SECOND_START);
    assert.equal(state.audio.sample, SECOND_SOURCE_START);
    assert.equal(context.sources.length, 2);
    assertWindow(context.sources[1]!, SECOND_SOURCE_START, CANDIDATE_SOURCE_END);
    assert.strictEqual(context.sources[1]!.buffer, decoded, 'both groups share the one full decode');

    context.advanceSamples(TERMINAL - 1 - state.timelineSample);
    state = await clock.tick();
    assert.equal(state.phase, 'second-run');
    assert.equal(state.audio.sample, CANDIDATE_SOURCE_END - 1);
    context.advanceSamples(1);
    state = await clock.tick();
    assert.equal(state.phase, 'terminal');
    assert.equal(state.frame, 968);
    assert.equal(state.timelineSample, TERMINAL);
    assert.equal(state.state, 'ended');
    assert.equal(state.audio.sample, CANDIDATE_SOURCE_END);
    assert.equal(context.activeSources().length, 0);
    context.advanceSamples(RATE);
    assert.equal((await clock.tick()).timelineSample, TERMINAL);
    assert.equal(await clock.play(), false);
    assert.equal(context.sources.length, 2, 'terminal never advances, loops or starts another audio node');
    assert.equal(context.gain.gain.value, 0);
  } finally {await clock.close();}
});

test('candidate lifecycle preserves the 3675/408/3537 discrepancies without claiming source timing acceptance', async () => {
  const bytes = readFileSync(new URL(
    '../../../migrations/shared-alg001-l12-p005/audio-source-v1/machine-timing-receipt.json', import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
    'c193f9856de277227e8ee6dbe3c97d714863c701398bc98854276e94baa4b639');
  const receipt = JSON.parse(bytes.toString()) as {source: {sha256: string}; extraction: {sha256: string};
    blocks: Array<{localFrame: number; sampleCount: number; signedSeekSamples: number}>};
  assert.equal(receipt.source.sha256, 'b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe');
  assert.equal(receipt.extraction.sha256, P005_AUDIO_SOURCE.sha256);
  assert.equal(P005_AUDIO_SCHEDULE.registered, false);
  assert.equal(P005_AUDIO_SCHEDULE.originalRuntime, false);
  assert.equal(P005_AUDIO_SCHEDULE.synchronizationAccepted, false);
  assert.equal(P005_AUDIO_CANDIDATE_CLOCK_POLICY.status, 'inferred-unregistered-natural-audio-candidate');
  assert.equal(P005_AUDIO_CANDIDATE_CLOCK_POLICY.sourceSha256, receipt.source.sha256);
  assert.equal(P005_AUDIO_CANDIDATE_CLOCK_POLICY.audioSha256, receipt.extraction.sha256);
  assert.equal(P005_AUDIO_CANDIDATE_CLOCK_POLICY.registered, false);
  assert.equal(P005_AUDIO_CANDIDATE_CLOCK_POLICY.originalRuntime, false);
  assert.equal(P005_AUDIO_CANDIDATE_CLOCK_POLICY.synchronizationAccepted, false);
  assert.equal(P005_AUDIO_CANDIDATE_CLOCK_POLICY.audioAccepted, false);
  assert.equal(P005_AUDIO_CANDIDATE_CLOCK_POLICY.mutedByDefault, true);
  assert.equal(P005_AUDIO_CANDIDATE_CLOCK_POLICY.terminalTailSamples, 3_537);
  assert.equal(receipt.blocks.find(block => block.localFrame === 24)?.sampleCount, 0);
  assert.equal(receipt.blocks.find(block => block.localFrame === 339)?.sampleCount, 0);
  assert((receipt.blocks.find(block => block.localFrame === 338)?.sampleCount ?? 0) > 0);

  const rawSeek25 = receipt.blocks.filter(block => block.localFrame < 25)
    .reduce((sum, block) => sum + block.sampleCount, 0)
    + receipt.blocks.find(block => block.localFrame === 25)!.signedSeekSamples;
  const {context, clock} = fixture();
  try {
    clock.seekFrame(23);
    assert.equal(await clock.play(), true);
    context.advanceSamples(2 * FRAME);
    let state = await clock.tick();
    assert.equal(state.frame, 25);
    assert.equal(rawSeek25, 5_370, 'raw source seek arithmetic is preserved as separate evidence');
    assert.equal(state.audio.sample - rawSeek25, 3_675, 'this candidate deliberately retains the unresolved one-frame difference');
    context.advanceSamples(FIRST_EXHAUSTION - state.timelineSample);
    state = await clock.tick();
    assert.equal(state.phase, 'first-run-depleted');
    assert.equal(337 * FRAME - state.timelineSample, 408,
      'candidate audio is already exhausted 408 samples before positive source frame338');
    context.advanceSamples(408);
    state = await clock.tick();
    assert.equal(state.frame, 338);
    assert.equal(state.phase, 'first-run-depleted');
    assert.equal(context.activeSources().length, 0);
    clock.seekFrame(967);
    assert.equal(await clock.play(), true);
    context.advanceSamples(FRAME);
    state = await clock.tick();
    assert.equal(state.state, 'ended');
    assert.equal(DECODED_END - state.audio.sample, 3_537,
      'the clipped source tail is an unresolved terminal decision, not established silence');
  } finally {await clock.close();}
});

test('snapshot observes preroll boundary without creating a node; only caller tick starts the run', async () => {
  const {context, clock} = fixture();
  try {
    assert.equal(await clock.play(), true);
    context.advanceSamples(FIRST_START);
    assert.equal(clock.snapshot().timelineSample, FIRST_START);
    assert.equal(clock.snapshot().frame, 23);
    assert.equal(context.sources.length, 0);
    assert.equal(context.resumeCalls, 1);
    const current = await clock.tick();
    assert.equal(current.phase, 'first-run');
    assert.equal(context.sources.length, 1);
    assertWindow(context.sources[0]!, FIRST_SOURCE_START, FIRST_SOURCE_END);
  } finally {await clock.close();}
});

test('a late caller tick waits at each candidate run boundary instead of skipping its first source sample', async () => {
  // Boundary waiting is this modern candidate's declared caller-tick policy.
  // It provides no evidence about original Flash read-ahead or continuous timing.
  for (const [frame, timelineSample, sourceStart, sourceEnd, phase] of [
    [22, FIRST_START, FIRST_SOURCE_START, FIRST_SOURCE_END, 'first-run'],
    [383, SECOND_START, SECOND_SOURCE_START, CANDIDATE_SOURCE_END, 'second-run'],
  ] as const) {
    const {context, clock} = fixture();
    try {
      clock.seekFrame(frame);
      await clock.play();
      context.advanceSamples(10 * FRAME);
      assert.equal(clock.snapshot().timelineSample, timelineSample);
      assert.equal(context.sources.length, 0);
      const state = await clock.tick();
      assert.equal(state.timelineSample, timelineSample);
      assert.equal(state.phase, phase);
      assert.equal(state.audio.sample, sourceStart);
      assertWindow(context.sources[0]!, sourceStart, sourceEnd);
      context.advanceSamples(FRAME);
      assert.equal((await clock.tick()).timelineSample, timelineSample + FRAME);
    } finally {await clock.close();}
  }
});

test('pause freezes an active sample and fractional-frame cursor; resume uses the remaining source window', async () => {
  const {context, clock} = fixture();
  try {
    clock.seekFrame(25);
    assert.equal(await clock.play(), true);
    context.advanceSamples(1_837);
    const before = clock.snapshot();
    clock.pause();
    const paused = clock.snapshot();
    assert.equal(paused.state, 'paused');
    assert.equal(paused.timelineSample, 24 * FRAME + 1_837);
    assert.equal(paused.timelineSample, before.timelineSample);
    assert.equal(paused.audio.sample, before.audio.sample);
    assert.equal(context.activeSources().length, 0);
    assert.equal(context.sources[0]!.stops, 1);
    assert.equal(context.sources[0]!.disconnects, 1);
    context.advanceSamples(10 * RATE);
    assert.equal((await clock.tick()).timelineSample, paused.timelineSample);
    assert.equal(clock.snapshot().audio.sample, paused.audio.sample);
    assert.equal(await clock.play(), true);
    assert.equal(context.sources.length, 2);
    assertWindow(context.sources[1]!, paused.audio.sample, FIRST_SOURCE_END);
    context.advanceSamples(FRAME - 1_837);
    const resumed = await clock.tick();
    assert.equal(resumed.frame, 26);
    assert.equal(resumed.timelineSample, 25 * FRAME);
  } finally {await clock.close();}
});

test('pause freezes the blockless gap and resume reaches group2 after only its remaining timeline samples', async () => {
  const {context, clock} = fixture();
  try {
    clock.seekFrame(350);
    assert.equal(await clock.play(), true);
    assert.equal(context.sources.length, 0);
    context.advanceSamples(913);
    clock.pause();
    const paused = clock.snapshot();
    assert.equal(paused.phase, 'missing-block-gap');
    assert.equal(paused.timelineSample, 349 * FRAME + 913);
    context.advanceSamples(50 * RATE);
    assert.equal((await clock.tick()).timelineSample, paused.timelineSample);
    assert.equal(context.sources.length, 0);
    assert.equal(await clock.play(), true);
    context.advanceSamples(SECOND_START - paused.timelineSample - 1);
    assert.equal((await clock.tick()).phase, 'missing-block-gap');
    assert.equal(context.sources.length, 0);
    context.advanceSamples(1);
    const current = await clock.tick();
    assert.equal(current.timelineSample, SECOND_START);
    assert.equal(current.phase, 'second-run');
    assert.equal(context.sources.length, 1);
    assertWindow(context.sources[0]!, SECOND_SOURCE_START, CANDIDATE_SOURCE_END);
  } finally {await clock.close();}
});

test('paused seek crosses both groups and gaps without starting audio until explicit play', async () => {
  const {context, clock} = fixture();
  try {
    clock.seekFrame(23);
    await clock.play();
    context.advanceSamples(FRAME);
    clock.pause();
    const first = context.sources[0]!;
    for (const [frame, phase, sourceSample] of [
      [384, 'second-run', SECOND_SOURCE_START],
      [383, 'missing-block-gap', undefined],
      [24, 'initial-zero-block', 5_370],
      [1, 'preroll', undefined],
      [385, 'second-run', SECOND_SOURCE_START + FRAME],
    ] as const) {
      clock.seekFrame(frame);
      const state = await clock.tick();
      assert.equal(state.state, 'paused');
      assert.equal(state.frame, frame);
      assert.equal(state.timelineSample, (frame - 1) * FRAME);
      assert.equal(state.phase, phase);
      if (sourceSample !== undefined) assert.equal(state.audio.sample, sourceSample);
      assert.equal(context.sources.length, 1, 'paused seeking cannot create a node');
      assert.equal(context.activeSources().length, 0);
    }
    assert.equal(first.stops, 1);
    assert.equal(first.disconnects, 1);
    assert.equal(await clock.play(), true);
    assertWindow(context.sources[1]!, SECOND_SOURCE_START + FRAME, CANDIDATE_SOURCE_END);
  } finally {await clock.close();}
});

test('whole-page Replay from group2 resets to frame1, then waits through preroll before group1', async () => {
  const {context, clock} = fixture();
  try {
    clock.seekFrame(400);
    await clock.play();
    context.advanceSamples(777);
    const old = context.sources[0]!;
    const staleEnded = old.onended!;
    assert(clock.snapshot().audio.sample > SECOND_SOURCE_START);
    assert.equal(await clock.replay(), true);
    let state = clock.snapshot();
    assert.equal(state.state, 'playing');
    assert.equal(state.frame, 1);
    assert.equal(state.timelineSample, 0);
    assert.equal(state.phase, 'preroll');
    assert.equal(context.sources.length, 1, 'Replay must not replay the transport current group2 window');
    assert.equal(context.activeSources().length, 0);
    assert.equal(old.stops, 1);
    staleEnded();
    assert.equal(clock.snapshot().frame, 1);
    context.advanceSamples(FIRST_START - 1);
    assert.equal((await clock.tick()).phase, 'preroll');
    assert.equal(context.sources.length, 1);
    context.advanceSamples(1);
    state = await clock.tick();
    assert.equal(state.frame, 23);
    assert.equal(state.phase, 'first-run');
    assertWindow(context.sources[1]!, FIRST_SOURCE_START, FIRST_SOURCE_END);
    staleEnded();
    assert.equal(clock.snapshot().audio.sample, FIRST_SOURCE_START);
  } finally {await clock.close();}
});

test('late resume success and rejection are cancelled by pause, seek, Replay and close', async () => {
  for (const settlement of ['resolve', 'reject'] as const) {
    for (const action of ['pause', 'seek', 'replay', 'close'] as const) {
      const {context, clock} = fixture();
      try {
        clock.seekFrame(384);
        const pendingResume = deferred();
        context.resumeNext = () => pendingResume.promise;
        const oldPlay = clock.play();
        assert.equal(clock.snapshot().state, 'starting');
        if (action === 'pause') clock.pause();
        if (action === 'seek') clock.seekFrame(23);
        if (action === 'close') await clock.close();
        if (action === 'replay') {
          context.resumeNext = undefined;
          assert.equal(await clock.replay(), true);
          assert.equal(clock.snapshot().frame, 1);
        }
        const before = clock.snapshot();
        if (settlement === 'resolve') pendingResume.resolve();
        else pendingResume.reject(Error('cancelled old resume rejection'));
        assert.equal(await oldPlay, false, `${action}/${settlement}`);
        assert.equal(context.sources.length, 0, `${action}/${settlement}`);
        const after = clock.snapshot();
        assert.equal(after.state, before.state, `${action}/${settlement}`);
        assert.equal(after.timelineSample, before.timelineSample, `${action}/${settlement}`);
        assert.equal(after.error, null, 'a cancelled old promise must not report a current error');
      } finally {await clock.close();}
    }
  }
});

test('new play wins deferred resume races; late old success and rejection cannot replace its source', async () => {
  for (const settlement of ['resolve', 'reject'] as const) {
    const {context, clock} = fixture();
    try {
      clock.seekFrame(384);
      const first = deferred(), second = deferred();
      let calls = 0;
      context.resumeNext = () => (++calls === 1 ? first.promise : calls === 2 ? second.promise : Promise.resolve());
      const oldPlay = clock.play();
      const newPlay = clock.play();
      second.resolve();
      assert.equal(await newPlay, true);
      assert.equal(clock.snapshot().state, 'playing');
      assert.equal(context.sources.length, 1);
      const source = context.sources[0]!;
      assertWindow(source, SECOND_SOURCE_START, CANDIDATE_SOURCE_END);
      if (settlement === 'resolve') first.resolve();
      else first.reject(Error('late superseded resume rejection'));
      assert.equal(await oldPlay, false);
      assert.equal(clock.snapshot().state, 'playing');
      assert.equal(clock.snapshot().error, null);
      assert.equal(context.sources.length, 1);
      assert.equal(context.activeSources().length, 1);
      assert.equal(source.stops, 0);
    } finally {await clock.close();}
  }
});

test('an obsolete group1 onended callback cannot end or switch a newer group2 playback', async () => {
  const {context, clock} = fixture();
  try {
    clock.seekFrame(23);
    await clock.play();
    const old = context.sources[0]!;
    const oldEnded = old.onended!;
    clock.seekFrame(384);
    await clock.play();
    const current = context.sources[1]!;
    context.advanceSamples(123);
    const before = clock.snapshot();
    oldEnded();
    const after = await clock.tick();
    assert.equal(after.state, 'playing');
    assert.equal(after.phase, 'second-run');
    assert.equal(after.timelineSample, before.timelineSample);
    assert.equal(after.audio.sample, before.audio.sample);
    assert.equal(context.sources.length, 2);
    assert.strictEqual(context.activeSources()[0], current);
    assert.equal(current.stops, 0);
    assert.equal(current.disconnects, 0);
  } finally {await clock.close();}
});

test('starting a natural run freezes its boundary while resume is pending and pause cancels it', async () => {
  const {context, clock} = fixture();
  try {
    clock.seekFrame(22);
    await clock.play();
    const wait = deferred();
    context.resumeNext = () => wait.promise;
    context.advanceSamples(FRAME);
    const pendingTick = clock.tick();
    assert.equal(clock.snapshot().state, 'starting');
    assert.equal(clock.snapshot().timelineSample, FIRST_START);
    context.advanceSamples(3 * RATE);
    assert.equal(clock.snapshot().timelineSample, FIRST_START, 'pending resume time cannot silently move the candidate cursor');
    clock.pause();
    wait.resolve();
    const cancelled = await pendingTick;
    assert.equal(cancelled.state, 'paused');
    assert.equal(cancelled.timelineSample, FIRST_START);
    assert.equal(context.sources.length, 0);
    context.resumeNext = undefined;
    await clock.play();
    assertWindow(context.sources[0]!, FIRST_SOURCE_START, FIRST_SOURCE_END);
  } finally {await clock.close();}
});

test('natural tick transport resumes are cancelled by pause, close and new play for both late settlements', async () => {
  for (const settlement of ['resolve', 'reject'] as const) {
    for (const action of ['pause', 'close', 'new-play'] as const) {
      const {context, clock} = fixture();
      try {
        clock.seekFrame(22);
        await clock.play();
        const wait = deferred();
        context.resumeNext = () => wait.promise;
        context.advanceSamples(FRAME);
        const oldTick = clock.tick();
        assert.equal(clock.snapshot().state, 'starting');
        assert.equal(context.sources.length, 0);
        if (action === 'pause') clock.pause();
        if (action === 'close') await clock.close();
        if (action === 'new-play') {
          context.resumeNext = undefined;
          assert.equal(await clock.play(), true);
          assertWindow(context.sources[0]!, FIRST_SOURCE_START, FIRST_SOURCE_END);
        }
        const before = clock.snapshot();
        if (settlement === 'resolve') wait.resolve();
        else wait.reject(Error('obsolete natural transport resume failed'));
        const after = await oldTick;
        assert.equal(after.state, before.state, `${action}/${settlement}`);
        assert.equal(after.timelineSample, before.timelineSample, `${action}/${settlement}`);
        assert.equal(after.error, null);
        assert.equal(context.sources.length, action === 'new-play' ? 1 : 0);
        assert.equal(context.activeSources().length, action === 'new-play' ? 1 : 0);
        if (action === 'new-play') assert.equal(context.sources[0]!.stops, 0);
      } finally {await clock.close();}
    }
  }
});

test('context interruption freezes active playback and needs an explicit user play after running returns', async () => {
  const {context, clock} = fixture();
  try {
    clock.seekFrame(384);
    await clock.play();
    context.advanceSamples(1_233);
    const before = clock.snapshot();
    const oldEnded = context.sources[0]!.onended!;
    const resumeCalls = context.resumeCalls;
    context.changeState('suspended');
    let state = clock.snapshot();
    assert.equal(state.state, 'interrupted');
    assert.equal(state.timelineSample, before.timelineSample);
    assert.equal(state.audio.sample, before.audio.sample);
    assert.equal(context.activeSources().length, 0);
    context.advanceSamples(RATE);
    assert.equal((await clock.tick()).timelineSample, before.timelineSample);
    assert.equal(context.resumeCalls, resumeCalls, 'a tick cannot resume an interrupted context');
    context.changeState('running');
    context.advanceSamples(10 * RATE);
    state = await clock.tick();
    assert.equal(state.state, 'interrupted');
    assert.equal(state.timelineSample, before.timelineSample);
    assert.equal(context.sources.length, 1, 'context recovery alone cannot restart audio');
    oldEnded();
    assert.equal(clock.snapshot().state, 'interrupted');
    assert.equal(await clock.play(), true);
    assertWindow(context.sources[1]!, before.audio.sample, CANDIDATE_SOURCE_END);
    assert.equal(clock.snapshot().timelineSample, before.timelineSample);
    context.advanceSamples(111);
    state = await clock.tick();
    assert.equal(state.timelineSample, before.timelineSample + 111);
    assert.equal(state.state, 'playing');
  } finally {await clock.close();}
});

test('context interruption also freezes a node-free gap and cancels a pending group resume', async () => {
  for (const phase of ['gap', 'pending-run'] as const) {
    const {context, clock} = fixture();
    try {
      clock.seekFrame(phase === 'gap' ? 350 : 384);
      const wait = deferred();
      if (phase === 'pending-run') context.resumeNext = () => wait.promise;
      const start = clock.play();
      if (phase === 'gap') assert.equal(await start, true);
      const before = clock.snapshot();
      context.changeState('suspended');
      assert.equal(clock.snapshot().state, 'interrupted');
      if (phase === 'pending-run') {
        wait.resolve();
        assert.equal(await start, false);
      }
      context.changeState('running');
      context.advanceSamples(5 * RATE);
      assert.equal((await clock.tick()).state, 'interrupted');
      assert.equal(clock.snapshot().timelineSample, before.timelineSample);
      assert.equal(context.sources.length, 0);
      context.resumeNext = undefined;
      assert.equal(await clock.play(), true);
      if (phase === 'gap') assert.equal(context.sources.length, 0);
      else assertWindow(context.sources[0]!, SECOND_SOURCE_START, CANDIDATE_SOURCE_END);
    } finally {await clock.close();}
  }
});

test('current resume rejection reports an error and explicit retry clears it without overlapping nodes', async () => {
  const {context, clock} = fixture();
  try {
    clock.seekFrame(23);
    context.resumeNext = async () => {throw Error('current context resume failed');};
    await assert.rejects(clock.play(), /current context resume failed/);
    const failed = clock.snapshot();
    assert.equal(failed.state, 'error');
    assert.match(failed.error ?? '', /current context resume failed/);
    assert.equal(failed.timelineSample, FIRST_START);
    assert.equal(context.sources.length, 0);
    context.resumeNext = undefined;
    assert.equal(await clock.play(), true);
    assert.equal(clock.snapshot().state, 'playing');
    assert.equal(clock.snapshot().error, null);
    assert.equal(context.activeSources().length, 1);
    assertWindow(context.sources[0]!, FIRST_SOURCE_START, FIRST_SOURCE_END);
  } finally {await clock.close();}
});

test('invalid seek and volume leave active playback unchanged; valid volume reaches the owned gain', async () => {
  const {context, clock} = fixture();
  try {
    clock.seekFrame(23);
    await clock.play();
    context.advanceSamples(917);
    const initial = clock.snapshot();
    const resumeCalls = context.resumeCalls;
    const node = context.sources[0]!;
    for (const frame of [-1, 0, 969, Number.NaN, Infinity, -Infinity, 23.5,
      Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1]) {
      assert.throws(() => clock.seekFrame(frame), /P005.*(?:FRAME|frame)/u, String(frame));
      assert.deepEqual(clock.snapshot(), initial);
      assert.equal(node.stops, 0);
      assert.equal(context.sources.length, 1);
    }
    for (const volume of [-0.1, 1.1, Number.NaN, Infinity, -Infinity]) {
      assert.throws(() => clock.setVolume(volume), /P005.*VOLUME/u, String(volume));
      assert.deepEqual(clock.snapshot(), initial);
      assert.equal(context.gain.gain.value, 0);
      assert.equal(node.stops, 0);
    }
    clock.setVolume(0.25);
    assert.equal(context.gain.gain.value, 0.25);
    assert.deepEqual(clock.snapshot(), {...initial, audio: {...initial.audio, volume: 0.25}});
    clock.setVolume(0);
    assert.equal(context.gain.gain.value, 0);
    assert.deepEqual(clock.snapshot(), initial);
    assert.equal(context.resumeCalls, resumeCalls);
    assert.equal(context.sources.length, 1);
    assert.equal(context.activeSources().length, 1);
  } finally {await clock.close();}
});

test('repeated play/tick never overlap nodes and close removes its listener and closes the context once', async () => {
  const {context, clock} = fixture();
  clock.seekFrame(23);
  await clock.play();
  for (let index = 0; index < 4; index++) {
    assert.equal(await clock.play(), true);
    assert.equal((await clock.tick()).state, 'playing');
  }
  assert.equal(context.sources.length, 1);
  assert.equal(context.activeSources().length, 1);
  assert.equal(context.listenerCount(), 1);
  const oldEnded = context.sources[0]!.onended!;
  await Promise.all([clock.close(), clock.close()]);
  await clock.close();
  oldEnded();
  context.changeState('running');
  assert.equal(clock.snapshot().state, 'closed');
  assert.equal((await clock.tick()).state, 'closed');
  assert.equal(await clock.play(), false);
  assert.equal(await clock.replay(), false);
  assert.throws(() => clock.seekFrame(23), /P005.*CLOSED/u);
  assert.throws(() => clock.setVolume(0.25), /P005.*CLOSED/u);
  assert.equal(clock.snapshot().state, 'closed');
  assert.equal(context.closeCalls, 1);
  assert.equal(context.gain.disconnects, 1);
  assert.equal(context.sources[0]!.stops, 1);
  assert.equal(context.sources[0]!.disconnects, 1);
  assert.equal(context.listenerCount(), 0);
  assert.equal(context.activeSources().length, 0);
});
