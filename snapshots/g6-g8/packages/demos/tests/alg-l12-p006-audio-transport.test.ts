import assert from 'node:assert/strict';
import {getEventListeners} from 'node:events';
import test from 'node:test';
import {P006AudioTransport} from '../src/alg-l12-p006-audio-transport';

const RATE = 22_050;
const LENGTH = 624_384;
const AUDIO_END = 626_386;
const END = 626_587.5;

function deferred() {
  let resolve!: () => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<void>((done, fail) => { resolve = done; reject = fail; });
  return {promise, resolve, reject};
}

class FakeSource {
  buffer: AudioBuffer | null = null;
  loop = false;
  onended: (() => void) | null = null;
  starts: Array<[number, number, number]> = [];
  stops = 0;
  disconnects = 0;
  failStart = false;
  connect(target: unknown) { assert(target instanceof FakeGain); }
  start(when: number, offset: number, duration: number) {
    if (this.failStart) throw Error('source start failed');
    this.starts.push([when, offset, duration]);
  }
  stop() { this.stops++; }
  disconnect() { this.disconnects++; }
}

class FakeGain {
  gain = {value: -1};
  disconnects = 0;
  constructor(private readonly destination: unknown) {}
  connect(target: unknown) { assert.strictEqual(target, this.destination); }
  disconnect() { this.disconnects++; }
}

class FakeContext extends EventTarget {
  sampleRate = RATE;
  state: AudioContextState = 'suspended';
  currentTime = 0;
  destination = {};
  gain = new FakeGain(this.destination);
  sources: FakeSource[] = [];
  failStartAt = -1;
  resumeCalls = 0;
  closeCalls = 0;
  resumeNext: (() => Promise<void>) | undefined;
  setState(state: AudioContextState) {
    this.state = state;
    this.dispatchEvent(new Event('statechange'));
  }
  createGain() { return this.gain; }
  createBufferSource() {
    const source = new FakeSource();
    source.failStart = this.sources.length === this.failStartAt;
    this.sources.push(source);
    return source;
  }
  async resume() {
    this.resumeCalls++;
    await this.resumeNext?.();
    if (this.state !== 'closed') this.setState('running');
  }
  async close() { this.closeCalls++; this.setState('closed'); }
}

const buffer = (overrides: Partial<Pick<AudioBuffer, 'sampleRate' | 'numberOfChannels' | 'length'>> = {}) => ({
  sampleRate: RATE, numberOfChannels: 1, length: LENGTH, ...overrides,
}) as AudioBuffer;

function fixture() {
  const context = new FakeContext();
  const decoded = buffer();
  const transport = new P006AudioTransport(context as unknown as AudioContext, decoded);
  return {context, decoded, transport};
}

function near(actual: number, expected: number) {
  assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} != ${expected}`);
}

test('initial play schedules one continuous source span against the context-time anchor', async () => {
  const {context, decoded, transport} = fixture();
  assert.deepEqual(transport.snapshot(), {phase: 'paused', timelineSample: 0, frame: 1, volume: 0});
  assert.equal(context.gain.gain.value, 0);
  context.currentTime = 10;
  assert.equal(await transport.play(), true);
  assert.equal(context.sources.length, 1);
  for (const source of context.sources) {
    assert.strictEqual(source.buffer, decoded);
    assert.equal(source.loop, false);
  }
  assert.deepEqual(context.sources[0]!.starts,
    [[10 + 3_675 / RATE, 1_673 / RATE, (LENGTH - 1_673) / RATE]]);
  assert.equal(transport.snapshot().phase, 'playing');
  assert.equal(await transport.play(), true);
  assert.equal(context.sources.length, 1, 'repeated play cannot overlap sources');
  transport.setVolume(0.6);
  assert.equal(context.gain.gain.value, 0.6);
  assert.equal(transport.snapshot().volume, 0.6);
  await transport.close();
});

test('context time advances the visual cursor across preroll, continuous audio and postroll without timers', async () => {
  const {context, transport} = fixture();
  await transport.play();
  for (const [sample, frame] of [
    [3_674.5, 2], [3_675, 3], [5_512, 3], [5_512.5, 4], [7_349.5, 4], [7_350, 5],
    [AUDIO_END - 0.5, 341], [AUDIO_END, 341], [END - 0.5, 341],
  ]) {
    context.currentTime = sample! / RATE;
    const snapshot = transport.snapshot();
    near(snapshot.timelineSample, sample!);
    assert.equal(snapshot.frame, frame, `sample ${sample}`);
    assert.equal(snapshot.phase, 'playing', `sample ${sample}`);
  }
  context.currentTime = (END + 1) / RATE;
  assert.deepEqual(transport.snapshot(), {phase: 'ended', timelineSample: END, frame: 342, volume: 0});
  assert.equal(await transport.play(), false);
  await transport.close();
});

test('audio completion keeps the visual clock running; pause/resume in postroll creates no audio node', async () => {
  const {context, transport} = fixture();
  await transport.play();
  const oldEnded = context.sources[0]!.onended!;
  context.currentTime = AUDIO_END / RATE;
  oldEnded();
  assert.equal(context.sources[0]!.disconnects, 1);
  assert.equal(context.sources[0]!.stops, 0);
  assert.equal(context.sources[0]!.onended, null);
  assert.equal(transport.snapshot().phase, 'playing');
  assert.equal(transport.snapshot().frame, 341);
  context.currentTime = (AUDIO_END + 100) / RATE;
  transport.pause();
  const pausedSample = transport.snapshot().timelineSample;
  near(pausedSample, AUDIO_END + 100);
  assert.equal(transport.snapshot().phase, 'paused');
  assert.equal(context.sources[0]!.stops, 0, 'completed source has already been retired');
  context.state = 'suspended';
  assert.equal(transport.snapshot().timelineSample, pausedSample, 'frozen context time cannot advance the cursor');
  context.currentTime = 100;
  assert.equal(transport.snapshot().timelineSample, pausedSample, 'paused wall time is ignored');
  assert.equal(await transport.play(), true);
  assert.equal(context.sources.length, 1, 'postroll resume has no remaining source samples');
  near(transport.snapshot().timelineSample, pausedSample);
  oldEnded();
  assert.equal(transport.snapshot().phase, 'playing', 'stale source callback cannot end resumed playback');
  assert.equal(context.sources[0]!.disconnects, 1, 'stale callback cannot dispose the source twice');
  context.currentTime = 100 + (END - pausedSample - 0.5) / RATE;
  assert.equal(transport.snapshot().frame, 341);
  assert.equal(transport.snapshot().phase, 'playing');
  context.currentTime = 100 + (END - pausedSample + 1) / RATE;
  assert.deepEqual(transport.snapshot(), {phase: 'ended', timelineSample: END, frame: 342, volume: 0});
  assert.equal(context.sources.length, 1);
  await transport.close();
});

test('external suspension immediately disposes sources, freezes exact position and requires explicit play', async () => {
  for (const {sample, frame, starts} of [
    {sample: 4_100.5, frame: 3, starts: [
      [100, 2_098.5 / RATE, (LENGTH - 2_098.5) / RATE],
    ]},
    {sample: 6_000.5, frame: 4, starts: [
      [100, 3_998.5 / RATE, (LENGTH - 3_998.5) / RATE],
    ]},
    {sample: 8_000.5, frame: 5, starts: [
      [100, 5_998.5 / RATE, (LENGTH - 5_998.5) / RATE],
    ]},
  ]) {
    const {context, transport} = fixture();
    context.currentTime = 10;
    await transport.play();
    context.currentTime = 10 + sample / RATE;
    context.setState('suspended');
    for (const source of context.sources) {
      assert.equal(source.stops, 1, 'statechange must stop sources before snapshot reconciliation');
      assert.equal(source.disconnects, 1);
      assert.equal(source.onended, null);
    }
    const frozen = transport.snapshot();
    assert.equal(frozen.phase, 'paused');
    near(frozen.timelineSample, sample);
    assert.equal(frozen.frame, frame);
    context.currentTime = 90;
    context.setState('suspended');
    assert.deepEqual(transport.snapshot(), frozen);
    context.currentTime = 100;
    context.setState('running');
    await Promise.resolve();
    assert.deepEqual(transport.snapshot(), frozen, 'running statechange cannot restart playback');
    assert.equal(context.sources.length, 1);
    assert.equal(context.resumeCalls, 1);
    for (const source of context.sources) {
      assert.equal(source.stops, 1, 'repeated statechanges cannot dispose a source twice');
      assert.equal(source.disconnects, 1);
    }
    assert.equal(await transport.play(), true);
    assert.equal(context.resumeCalls, 2);
    assert.equal(context.sources.length, 1 + starts.length);
    for (const [index, [when, offset, duration]] of starts.entries()) {
      const source = context.sources[index + 1]!;
      assert.equal(source.starts.length, 1);
      const actual = source.starts[0]!;
      near(actual[0], when!);
      near(actual[1], offset!);
      near(actual[2], duration!);
    }
    near(transport.snapshot().timelineSample, sample);
    assert.equal(transport.snapshot().phase, 'playing');
    await transport.close();
  }
});

test('snapshot reconciles external suspension before a delayed statechange arrives', async () => {
  const {context, transport} = fixture();
  await transport.play();
  context.currentTime = 8_000.5 / RATE;
  context.state = 'suspended'; // Deliberately withhold the statechange event.
  assert.equal(context.sources[0]!.stops, 0);
  const frozen = transport.snapshot();
  assert.equal(frozen.phase, 'paused');
  near(frozen.timelineSample, 8_000.5);
  for (const source of context.sources) {
    assert.equal(source.stops, 1);
    assert.equal(source.disconnects, 1);
    assert.equal(source.onended, null);
  }
  context.currentTime = 50;
  context.setState('suspended');
  context.setState('running');
  assert.deepEqual(transport.snapshot(), frozen);
  assert.equal(context.sources.length, 1);
  assert.equal(context.resumeCalls, 1);
  await transport.close();
});

test('play reconciles external suspension before a delayed event and resumes the remaining offset', async () => {
  const {context, transport} = fixture();
  await transport.play();
  context.currentTime = 8_000.5 / RATE;
  context.state = 'suspended'; // Call play before any event or snapshot can reconcile.
  const wait = deferred();
  context.resumeNext = () => wait.promise;
  const pending = transport.play();
  for (const source of context.sources) {
    assert.equal(source.stops, 1, 'play must retire the interrupted generation immediately');
    assert.equal(source.disconnects, 1);
  }
  assert.equal(context.resumeCalls, 2);
  assert.equal(context.sources.length, 1);
  assert.equal(transport.snapshot().phase, 'starting');
  near(transport.snapshot().timelineSample, 8_000.5);
  context.setState('suspended');
  context.currentTime = 50;
  wait.resolve();
  assert.equal(await pending, true);
  assert.equal(context.sources.length, 2);
  assert.deepEqual(context.sources[1]!.starts,
    [[50, 5_998.5 / RATE, (LENGTH - 5_998.5) / RATE]]);
  assert.equal(transport.snapshot().phase, 'playing');
  near(transport.snapshot().timelineSample, 8_000.5);
  await transport.close();
});

test('seek at frame 342 ends at the visual terminal without audio; replay restores one source', async () => {
  const {context, transport} = fixture();
  await transport.play();
  transport.seekFrame(342);
  assert.deepEqual(transport.snapshot(),
    {phase: 'ended', timelineSample: END, frame: 342, volume: 0});
  assert.equal(context.sources[0]!.stops, 1);
  assert.equal(context.sources[0]!.disconnects, 1);
  assert.equal(await transport.play(), false);
  assert.equal(context.resumeCalls, 1, 'terminal play cannot resume the context');
  assert.equal(context.sources.length, 1, 'terminal seek cannot schedule audio');
  assert.equal(await transport.replay(), true);
  assert.equal(context.sources.length, 2);
  assert.deepEqual(context.sources[1]!.starts,
    [[3_675 / RATE, 1_673 / RATE, (LENGTH - 1_673) / RATE]]);
  assert.deepEqual(transport.snapshot(), {phase: 'playing', timelineSample: 0, frame: 1, volume: 0});
  await transport.close();
});

test('pause, seek and close invalidate a pending context resume before creating nodes', async () => {
  for (const action of ['pause', 'seek', 'close'] as const) {
    const {context, transport} = fixture();
    const wait = deferred();
    context.resumeNext = () => wait.promise;
    const pending = transport.play();
    assert.equal(transport.snapshot().phase, 'starting');
    if (action === 'pause') transport.pause();
    if (action === 'seek') transport.seekFrame(341);
    if (action === 'close') await transport.close();
    wait.resolve();
    assert.equal(await pending, false, action);
    assert.equal(context.sources.length, 0, action);
    assert.equal(transport.snapshot().phase, action === 'close' ? 'closed' : 'paused');
    assert.equal(transport.snapshot().timelineSample, action === 'seek' ? 624_750 : 0);
    await transport.close();
    assert.equal(context.closeCalls, 1);
  }
});

test('statechange while starting preserves a legitimate pending resume and exact seek offset', async () => {
  const {context, transport} = fixture();
  transport.seekFrame(341);
  const wait = deferred();
  context.resumeNext = () => wait.promise;
  const pending = transport.play();
  const starting = {phase: 'starting', timelineSample: 624_750, frame: 341, volume: 0};
  assert.deepEqual(transport.snapshot(), starting);
  context.setState('suspended');
  assert.deepEqual(transport.snapshot(), starting);
  context.currentTime = 17;
  context.setState('running');
  assert.deepEqual(transport.snapshot(), starting);
  assert.equal(context.sources.length, 0, 'statechange cannot schedule nodes before resume resolves');
  wait.resolve();
  assert.equal(await pending, true);
  assert.equal(context.resumeCalls, 1);
  assert.equal(context.sources.length, 1);
  assert.deepEqual(context.sources[0]!.starts,
    [[17, 622_748 / RATE, 1_636 / RATE]]);
  assert.deepEqual(transport.snapshot(), {...starting, phase: 'playing'});
  await transport.close();
});

test('a cancelled rejection and a newer play leave no stale nodes', async () => {
  const {context, transport} = fixture();
  const first = deferred(), second = deferred();
  let calls = 0;
  context.resumeNext = () => ++calls === 1 ? first.promise : second.promise;
  const oldPlay = transport.play();
  const newPlay = transport.play();
  second.resolve();
  assert.equal(await newPlay, true);
  first.reject(Error('late resume failure'));
  assert.equal(await oldPlay, false);
  assert.equal(context.sources.length, 1);
  assert.equal(transport.snapshot().phase, 'playing');
  await transport.close();
});

test('a late successful older resume cannot duplicate or replace newer playback nodes', async () => {
  const {context, transport} = fixture();
  const first = deferred(), second = deferred();
  let calls = 0;
  context.resumeNext = () => ++calls === 1 ? first.promise : second.promise;
  const oldPlay = transport.play();
  const newPlay = transport.play();
  context.currentTime = 12;
  second.resolve();
  assert.equal(await newPlay, true);
  assert.equal(context.sources.length, 1);
  const liveSources = [...context.sources];
  context.currentTime = 12 + 8_000.5 / RATE;
  const playing = transport.snapshot();
  first.resolve();
  assert.equal(await oldPlay, false);
  assert.equal(context.resumeCalls, 2);
  assert.equal(context.sources.length, 1, 'stale successful resume cannot create duplicate nodes');
  for (const [index, source] of liveSources.entries()) {
    assert.strictEqual(context.sources[index], source);
    assert.equal(source.starts.length, 1);
    assert.equal(source.stops, 0);
    assert.equal(source.disconnects, 0);
  }
  assert.deepEqual(transport.snapshot(), playing, 'stale resume cannot reset the playback anchor');
  assert.equal(await transport.play(), true);
  assert.equal(context.sources.length, 1);
  assert.equal(context.resumeCalls, 2);
  await transport.close();
});

test('close removes the context statechange listener before closing and remains idempotent', async () => {
  const {context, transport} = fixture();
  assert.equal(getEventListeners(context, 'statechange').length, 1);
  await transport.play();
  const closing = transport.close();
  assert.equal(getEventListeners(context, 'statechange').length, 0);
  assert.strictEqual(transport.close(), closing);
  await closing;
  const closed = transport.snapshot();
  context.dispatchEvent(new Event('statechange'));
  assert.deepEqual(transport.snapshot(), closed);
  assert.equal(closed.phase, 'closed');
  assert.equal(context.closeCalls, 1);
  assert.equal(getEventListeners(context, 'statechange').length, 0);
});

test('resume and first-source start failures clean all nodes and permit retry', async () => {
  const {context, transport} = fixture();
  context.resumeNext = async () => { throw Error('resume failed'); };
  await assert.rejects(transport.play(), /resume failed/);
  assert.equal(context.sources.length, 0);
  assert.equal(transport.snapshot().phase, 'paused');
  context.resumeNext = undefined;
  context.failStartAt = 0;
  await assert.rejects(transport.play(), /source start failed/);
  assert.equal(context.sources.length, 1);
  assert.equal(context.sources[0]!.stops, 0, 'a failed start never became a live scheduled node');
  assert.equal(context.sources[0]!.disconnects, 1);
  assert.equal(context.sources[0]!.onended, null);
  assert.equal(transport.snapshot().phase, 'paused');
  assert.equal(context.sources[0]!.starts.length, 0);
  context.failStartAt = -1;
  assert.equal(await transport.play(), true);
  assert.equal(context.sources.length, 2);
  assert.deepEqual(context.sources[1]!.starts,
    [[3_675 / RATE, 1_673 / RATE, (LENGTH - 1_673) / RATE]]);
  await transport.close();
});

test('metadata, frame and volume validation; close is idempotent and disposes live nodes', async () => {
  for (const invalid of [
    {sampleRate: 48_000}, {sampleRate: NaN}, {numberOfChannels: 2},
    {numberOfChannels: 0}, {length: LENGTH - 1}, {length: NaN},
  ]) {
    const context = new FakeContext();
    assert.throws(() => new P006AudioTransport(context as unknown as AudioContext, buffer(invalid)),
      /P006_AUDIO_METADATA/);
  }
  for (const rate of [48_000, NaN]) {
    const context = new FakeContext();
    context.sampleRate = rate;
    assert.throws(() => new P006AudioTransport(context as unknown as AudioContext, buffer()),
      /P006_AUDIO_METADATA/);
  }
  const closedContext = new FakeContext();
  closedContext.state = 'closed';
  assert.throws(() => new P006AudioTransport(closedContext as unknown as AudioContext, buffer()),
    /P006_AUDIO_METADATA/);
  const {context, transport} = fixture();
  for (const frame of [0, 343, 2.5, NaN, Infinity])
    assert.throws(() => transport.seekFrame(frame), /P006_AUDIO_FRAME/);
  for (const volume of [-0.1, 1.1, NaN, Infinity, -Infinity])
    assert.throws(() => transport.setVolume(volume), /P006_AUDIO_VOLUME/);
  transport.setVolume(1);
  assert.equal(context.gain.gain.value, 1);
  transport.setVolume(0);
  await transport.play();
  const ended = context.sources[0]!.onended!;
  await Promise.all([transport.close(), transport.close()]);
  ended();
  assert.equal(context.sources[0]!.stops, 1);
  assert.equal(context.sources[0]!.disconnects, 1);
  assert.equal(context.sources[0]!.onended, null);
  assert.equal(context.gain.disconnects, 1);
  assert.equal(context.closeCalls, 1);
  assert.equal(transport.snapshot().phase, 'closed');
  assert.equal(await transport.play(), false);
  assert.equal(await transport.replay(), false);
  assert.throws(() => transport.seekFrame(1), /P006_AUDIO_CLOSED/);
  assert.throws(() => transport.setVolume(0.5), /P006_AUDIO_CLOSED/);
});
