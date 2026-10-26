import assert from 'node:assert/strict';
import test from 'node:test';
import {P005AudioTransport} from '../src/alg-l12-p005-audio-transport';

const RATE = 44_100;
const LENGTH = 3_309_696;

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
  connect(target: unknown) { assert.strictEqual(target, this.destination); }
  disconnect() { this.disconnects++; }
  constructor(private readonly destination: unknown) {}
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
  failStart = false;
  resumeNext: (() => Promise<void>) | undefined;
  createGain() { return this.gain; }
  createBufferSource() {
    const source = new FakeSource();
    source.failStart = this.failStart;
    this.sources.push(source);
    return source;
  }
  async resume() {
    this.resumeCalls++;
    await this.resumeNext?.();
    if (this.state !== 'closed') this.state = 'running';
  }
  async close() { this.closeCalls++; this.state = 'closed'; }
}

const buffer = (overrides: Partial<Pick<AudioBuffer, 'sampleRate' | 'numberOfChannels' | 'length'>> = {}) => ({
  sampleRate: RATE, numberOfChannels: 1, length: LENGTH, ...overrides,
}) as AudioBuffer;

function fixture() {
  const context = new FakeContext();
  const decoded = buffer();
  const transport = new P005AudioTransport(context as unknown as AudioContext, decoded);
  return {context, decoded, transport};
}

test('defaults to the whole mono source, paused and muted; play schedules exact window samples', async () => {
  const {context, decoded, transport} = fixture();
  assert.deepEqual(transport.snapshot(), {
    phase: 'paused', sample: 0, startSample: 0, endSample: LENGTH, volume: 0,
  });
  assert.equal(context.gain.gain.value, 0);
  transport.setWindow(RATE, RATE * 2);
  assert.deepEqual(transport.snapshot(), {
    phase: 'paused', sample: RATE, startSample: RATE, endSample: RATE * 2, volume: 0,
  });
  context.currentTime = 10;
  assert.equal(await transport.play(), true);
  assert.equal(context.sources.length, 1);
  const source = context.sources[0]!;
  assert.strictEqual(source.buffer, decoded);
  assert.equal(source.loop, false);
  assert.deepEqual(source.starts, [[10, 1, 1]]);
  assert.equal(transport.snapshot().phase, 'playing');
  assert.equal(await transport.play(), true);
  assert.equal(context.sources.length, 1, 'idempotent play cannot overlap nodes');
  context.currentTime = 10 + 1.9 / RATE;
  assert.equal(transport.snapshot().sample, RATE + 1, 'active cursor floors fractional samples');
  context.currentTime = 10.25;
  assert.equal(transport.snapshot().sample, RATE + RATE / 4);
  transport.setVolume(0.6);
  assert.equal(context.gain.gain.value, 0.6);
  assert.equal(transport.snapshot().sample, RATE + RATE / 4, 'volume does not move the cursor');
  assert.equal(context.sources.length, 1);
  context.currentTime = 20;
  assert.equal(transport.snapshot().sample, RATE * 2, 'cursor clamps at window end');
  await transport.close();
});

test('pause holds the sample through elapsed wall time; resume uses the remaining offset and duration', async () => {
  const {context, transport} = fixture();
  context.currentTime = 4;
  assert.equal(await transport.play(), true);
  context.currentTime = 4.25;
  transport.pause();
  assert.equal(context.sources[0]!.stops, 1);
  assert.equal(context.sources[0]!.disconnects, 1);
  assert.equal(transport.snapshot().sample, RATE / 4);
  context.currentTime = 100;
  assert.equal(transport.snapshot().sample, RATE / 4);
  assert.equal(transport.snapshot().phase, 'paused');
  assert.equal(await transport.play(), true);
  assert.deepEqual(context.sources[1]!.starts, [[100, 0.25, (LENGTH - RATE / 4) / RATE]]);
  assert.equal(context.sources[0]!.stops, 1);
  await transport.close();
});

test('changing a window during playback stops its node and resets the cursor to the new start', async () => {
  const {context, transport} = fixture();
  await transport.play();
  context.currentTime = 0.25;
  transport.setWindow(2_000, 4_000);
  assert.equal(context.sources[0]!.stops, 1);
  assert.equal(context.sources[0]!.disconnects, 1);
  assert.deepEqual(transport.snapshot(), {
    phase: 'paused', sample: 2_000, startSample: 2_000, endSample: 4_000, volume: 0,
  });
  assert.equal(await transport.play(), true);
  assert.deepEqual(context.sources[1]!.starts, [[0.25, 2_000 / RATE, 2_000 / RATE]]);
  await transport.close();
});

test('seek pauses, replay starts at window start, and stale onended cannot change the new playback', async () => {
  const {context, transport} = fixture();
  transport.setWindow(1_000, 5_000);
  await transport.play();
  const oldEnded = context.sources[0]!.onended!;
  transport.seek(3_000);
  assert.deepEqual(transport.snapshot(), {
    phase: 'paused', sample: 3_000, startSample: 1_000, endSample: 5_000, volume: 0,
  });
  await transport.play();
  assert.deepEqual(context.sources[1]!.starts, [[0, 3_000 / RATE, 2_000 / RATE]]);
  oldEnded();
  assert.equal(transport.snapshot().phase, 'playing');
  assert.equal(transport.snapshot().sample, 3_000);
  assert.equal(await transport.replay(), true);
  assert.deepEqual(context.sources[2]!.starts, [[0, 1_000 / RATE, 4_000 / RATE]]);
  oldEnded();
  assert.equal(transport.snapshot().sample, 1_000);
  context.sources[2]!.onended!();
  assert.equal(transport.snapshot().phase, 'ended');
  assert.equal(transport.snapshot().sample, 5_000);
  assert.equal(await transport.play(), false, 'end does not advance a lesson or restart by itself');
  assert.equal(await transport.replay(), true);
  assert.deepEqual(context.sources[3]!.starts, [[0, 1_000 / RATE, 4_000 / RATE]]);
  await transport.close();
});

test('pause and seek cancel a deferred resume before any source is created', async () => {
  for (const action of ['pause', 'seek'] as const) {
    const {context, transport} = fixture();
    const wait = deferred();
    context.resumeNext = () => wait.promise;
    const pending = transport.play();
    assert.equal(transport.snapshot().phase, 'starting');
    if (action === 'pause') transport.pause();
    else transport.seek(100);
    wait.resolve();
    assert.equal(await pending, false, action);
    assert.equal(context.sources.length, 0, action);
    assert.equal(transport.snapshot().phase, 'paused');
    assert.equal(transport.snapshot().sample, action === 'pause' ? 0 : 100);
    await transport.close();
  }
});

test('a cancelled resume rejection settles false without creating a source', async () => {
  const {context, transport} = fixture();
  const wait = deferred();
  context.resumeNext = () => wait.promise;
  const pending = transport.play();
  transport.pause();
  wait.reject(Error('late resume failure'));
  assert.equal(await pending, false);
  assert.equal(context.sources.length, 0);
  assert.equal(transport.snapshot().phase, 'paused');
  await transport.close();
});

test('a newer play wins a pair of deferred resumes without overlapping sources', async () => {
  const {context, transport} = fixture();
  const first = deferred(), second = deferred();
  let calls = 0;
  context.resumeNext = () => ++calls === 1 ? first.promise : second.promise;
  const oldPlay = transport.play();
  const newPlay = transport.play();
  second.resolve();
  assert.equal(await newPlay, true);
  first.resolve();
  assert.equal(await oldPlay, false);
  assert.equal(context.sources.length, 1);
  assert.equal(transport.snapshot().phase, 'playing');
  await transport.close();
});

test('close cancels a deferred resume and disposes the owned context exactly once', async () => {
  const {context, transport} = fixture();
  const wait = deferred();
  context.resumeNext = () => wait.promise;
  const pending = transport.play();
  const closing = transport.close();
  await Promise.all([closing, transport.close()]);
  wait.resolve();
  assert.equal(await pending, false);
  assert.equal(context.sources.length, 0);
  assert.equal(context.gain.disconnects, 1);
  assert.equal(context.closeCalls, 1);
  assert.equal(transport.snapshot().phase, 'closed');
  assert.equal(await transport.play(), false);
  assert.equal(await transport.replay(), false);
});

test('close stops a live source; a captured completion callback cannot revive it', async () => {
  const {context, transport} = fixture();
  await transport.play();
  const ended = context.sources[0]!.onended!;
  await transport.close();
  ended();
  assert.equal(context.sources[0]!.stops, 1);
  assert.equal(context.sources[0]!.disconnects, 1);
  assert.equal(context.gain.disconnects, 1);
  assert.equal(context.closeCalls, 1);
  assert.equal(transport.snapshot().phase, 'closed');
});

test('rejects malformed buffer/context metadata, windows, seeks, and nonfinite or out-of-range volume', async () => {
  for (const invalid of [
    {sampleRate: 48_000}, {sampleRate: Number.NaN},
    {numberOfChannels: 2}, {numberOfChannels: 0},
    {length: LENGTH - 1}, {length: Number.NaN},
  ]) {
    const context = new FakeContext();
    assert.throws(() => new P005AudioTransport(context as unknown as AudioContext, buffer(invalid)), /P005_AUDIO_METADATA/);
  }
  for (const rate of [48_000, Number.NaN]) {
    const context = new FakeContext();
    context.sampleRate = rate;
    assert.throws(() => new P005AudioTransport(context as unknown as AudioContext, buffer()), /P005_AUDIO_METADATA/);
  }
  const closedContext = new FakeContext();
  closedContext.state = 'closed';
  assert.throws(() => new P005AudioTransport(closedContext as unknown as AudioContext, buffer()), /P005_AUDIO_METADATA/);
  const {context, transport} = fixture();
  for (const [start, end] of [
    [-1, 100], [0, 0], [101, 100], [0, LENGTH + 1],
    [0.5, 100], [0, 100.5], [Number.NaN, 100], [0, Number.POSITIVE_INFINITY],
  ]) assert.throws(() => transport.setWindow(start!, end!), /P005_AUDIO_WINDOW/);
  assert.equal(transport.snapshot().startSample, 0);
  assert.equal(transport.snapshot().endSample, LENGTH);
  transport.setWindow(100, 200);
  for (const sample of [99, 201, 100.5, Number.NaN, Number.NEGATIVE_INFINITY])
    assert.throws(() => transport.seek(sample), /P005_AUDIO_SEEK/);
  transport.seek(200);
  assert.equal(transport.snapshot().sample, 200, 'window end is a valid paused seek');
  assert.equal(await transport.play(), false);
  assert.equal(context.sources.length, 0);
  for (const volume of [-0.1, 1.1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])
    assert.throws(() => transport.setVolume(volume), /P005_AUDIO_VOLUME/);
  transport.setVolume(1);
  assert.equal(context.gain.gain.value, 1);
  transport.setVolume(0);
  assert.equal(transport.snapshot().volume, 0);
  await transport.close();
});

test('resume and source start failures leave no active node and allow retry', async () => {
  const {context, transport} = fixture();
  context.resumeNext = async () => { throw Error('resume failed'); };
  await assert.rejects(transport.play(), /resume failed/);
  assert.equal(context.sources.length, 0);
  assert.equal(transport.snapshot().phase, 'paused');
  context.resumeNext = undefined;
  context.failStart = true;
  await assert.rejects(transport.play(), /source start failed/);
  assert.equal(context.sources[0]!.starts.length, 0);
  assert.equal(context.sources[0]!.stops, 0);
  assert.equal(context.sources[0]!.disconnects, 1);
  assert.equal(transport.snapshot().phase, 'paused');
  context.failStart = false;
  assert.equal(await transport.play(), true);
  assert.equal(context.sources.length, 2);
  assert.deepEqual(context.sources[1]!.starts, [[0, 0, LENGTH / RATE]]);
  await transport.close();
});
