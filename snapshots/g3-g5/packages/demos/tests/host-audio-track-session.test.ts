import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {HostAudioTrackSession} from '../src/host-audio-track-session';
import {SourcePcmAudio, type SourceAudioMedia} from '../src/source-pcm-audio';

class BufferNode {
  buffer: unknown = null;
  onended: (() => void) | null = null;
  readonly starts: number[][] = [];
  stops = 0;
  disconnected = false;
  connect() {}
  disconnect() {this.disconnected = true;}
  start(...values: number[]) {this.starts.push(values);}
  stop() {this.stops++;}
  finish() {this.onended?.();}
}
class PcmContext {
  static readonly created: PcmContext[] = [];
  state = 'running';
  currentTime = 0;
  readonly destination = {};
  readonly nodes: BufferNode[] = [];
  readonly gains: {gain: {value: number}; connect(): void; disconnect(): void}[] = [];
  constructor() {PcmContext.created.push(this);}
  async resume() {this.state = 'running';}
  async close() {this.state = 'closed';}
  createBuffer(channels: number, frames: number) {
    const samples = Array.from({length: channels}, () => new Float32Array(frames));
    return {getChannelData(channel: number) {return samples[channel]!;}};
  }
  createGain() {const gain = {gain: {value: 1}, connect() {}, disconnect() {}}; this.gains.push(gain); return gain;}
  createBufferSource() {const node = new BufferNode(); this.nodes.push(node); return node;}
}
function setupPcm() {
  const priorAudioContext = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  const priorFetch = globalThis.fetch;
  const bytes = Buffer.alloc(48000 * 4);
  for (let i = 0; i < 48000; i++) bytes.writeFloatLE(Math.sin(i / 16) * .1, i * 4);
  const asset = {source: '/test/narration.f32le', sha256: createHash('sha256').update(bytes).digest('hex'), channels: 1, sampleRate: 8000, frames: 48000};
  Object.defineProperty(globalThis, 'AudioContext', {configurable: true, writable: true, value: PcmContext});
  let fetches = 0;
  globalThis.fetch = (async () => {fetches++; return new Response(new Uint8Array(bytes), {status: 200});}) as typeof fetch;
  const audio = new SourcePcmAudio('/test/narration.mp3', asset);
  const finished: string[] = [];
  const session = new HostAudioTrackSession(audio, reason => finished.push(reason));
  return {audio, session, finished, contexts: PcmContext.created, get fetches() {return fetches;}, cleanup() {
    session.stop(); audio.dispose(); globalThis.fetch = priorFetch;
    if (priorAudioContext) Object.defineProperty(globalThis, 'AudioContext', priorAudioContext);
    else Reflect.deleteProperty(globalThis, 'AudioContext');
    PcmContext.created.length = 0;
  }};
}

test('a temporary host pause resumes the same decoded media at its nonzero position without releasing ownership', async t => {
  const h = setupPcm(); t.after(() => h.cleanup());
  assert.equal(await h.session.play(), true);
  const context = h.contexts[0]!, first = context.nodes[0]!;
  context.currentTime = 2.375;
  await h.session.setPaused(true);
  assert.equal(h.audio.currentTime, 2.375);
  assert.equal(h.audio.paused, true);
  assert.equal(first.stops, 1); assert.equal(first.disconnected, true);
  assert.deepEqual(h.finished, []); assert.equal(context.state, 'running');
  context.currentTime = 50;
  assert.equal(h.audio.currentTime, 2.375);
  assert.equal(await h.session.setPaused(false), true);
  assert.equal(h.contexts.length, 1); assert.equal(h.fetches, 1);
  assert.deepEqual(context.nodes[1]!.starts[0], [50, 2.375, 3.625]);
  assert.equal(context.nodes[1]!.buffer, first.buffer);
  assert.equal(h.audio.paused, false); assert.deepEqual(h.finished, []);
});

test('changing volume while held preserves position and applies the new level to the resumed shared gain', async t => {
  const h = setupPcm(); t.after(() => h.cleanup()); h.audio.volume = .8; await h.session.play();
  const context = h.contexts[0]!, gain = context.gains[0]!; context.currentTime = 2;
  await h.session.setPaused(true);
  h.audio.volume = 0; assert.equal(gain.gain.value, 0);
  h.audio.volume = .3; assert.equal(gain.gain.value, .3);
  assert.equal(h.audio.currentTime, 2); assert.equal(context.nodes.length, 1);
  assert.deepEqual(h.finished, []);
  context.currentTime = 12; assert.equal(await h.session.setPaused(false), true);
  assert.equal(context.gains.length, 1); assert.equal(context.gains[0], gain);
  assert.equal(gain.gain.value, .3); assert.equal(h.audio.volume, .3);
  assert.deepEqual(context.nodes[1]!.starts[0], [12, 2, 4]);
});

test('repeated temporary pause values do not restart media and Stop while paused discards intent and position', async t => {
  const h = setupPcm(); t.after(() => h.cleanup()); await h.session.play();
  const context = h.contexts[0]!; context.currentTime = 1.625;
  await h.session.setPaused(true); await h.session.setPaused(true);
  assert.equal(context.nodes[0]!.stops, 1); assert.equal(h.audio.currentTime, 1.625);
  h.session.stop(); h.session.stop();
  assert.equal(h.audio.currentTime, 0); assert.equal(context.state, 'closed');
  assert.equal(await h.session.setPaused(false), false);
  assert.equal(await h.session.play(), false);
  assert.equal(context.nodes.length, 1); assert.deepEqual(h.finished, []);
});

test('pause during pending SourcePcmAudio play rejects only the old attempt and the newer resume remains owned', async t => {
  const h = setupPcm(); t.after(() => h.cleanup());
  // Prepare once so the race isolates resume/play cancellation, not transport.
  await h.audio.prepareForTimeline();
  const first = h.session.play();
  await h.session.setPaused(true);
  const resumed = h.session.setPaused(false);
  assert.equal(await first, false); assert.equal(await resumed, true);
  assert.deepEqual(h.finished, []); assert.equal(h.audio.paused, false);
  assert.equal(h.contexts[0]!.nodes.length, 1); assert.equal(h.fetches, 1);
});

test('natural media completion releases ownership exactly once and cannot automatically restart on later resume', async t => {
  const h = setupPcm(); t.after(() => h.cleanup()); await h.session.play();
  const context = h.contexts[0]!, node = context.nodes[0]!;
  context.currentTime = h.audio.duration; node.finish(); node.finish();
  assert.deepEqual(h.finished, ['ended']); assert.equal(context.state, 'closed');
  assert.equal(h.audio.currentTime, h.audio.duration);
  await h.session.setPaused(true); await h.session.setPaused(false);
  assert.equal(context.nodes.length, 1);
});

function deferred() {
  let resolve!: () => void, reject!: (reason: unknown) => void;
  const promise = new Promise<void>((yes, no) => {resolve = yes; reject = no;});
  return {promise, resolve, reject};
}
class DeferredMedia extends EventTarget implements SourceAudioMedia {
  readonly src = '/test/narration.mp3';
  preload = 'auto'; readyState = 4; error = null; paused = true; duration = 30;
  currentTime = 7.25; volume = .8; pauses = 0; disposals = 0;
  readonly attempts: ReturnType<typeof deferred>[] = [];
  play() {const attempt = deferred(); this.attempts.push(attempt); return attempt.promise;}
  pause() {this.paused = true; this.pauses++;}
  load() {}
  dispose() {this.disposals++;}
}

test('a late rejection from the pre-pause play cannot retire a successful newer resume', async () => {
  const audio = new DeferredMedia(), finished: string[] = [];
  const session = new HostAudioTrackSession(audio, reason => finished.push(reason));
  const old = session.play(); await session.setPaused(true);
  const resumed = session.setPaused(false); audio.attempts[1]!.resolve();
  assert.equal(await resumed, true);
  audio.attempts[0]!.reject(new DOMException('cancelled old request', 'AbortError'));
  assert.equal(await old, false); assert.equal(audio.disposals, 0);
  assert.equal(audio.currentTime, 7.25); assert.deepEqual(finished, []);
  session.stop(); assert.equal(audio.disposals, 1); assert.equal(audio.currentTime, 0);
});

test('Stop during pending resume cancels ownership even if that play later resolves', async () => {
  const audio = new DeferredMedia(), finished: string[] = [];
  const session = new HostAudioTrackSession(audio, reason => finished.push(reason));
  const initial = session.play(); audio.attempts[0]!.resolve(); await initial;
  await session.setPaused(true); const pending = session.setPaused(false);
  session.stop(); audio.attempts[1]!.resolve();
  assert.equal(await pending, false); assert.equal(audio.disposals, 1);
  assert.equal(audio.currentTime, 0); assert.deepEqual(finished, []);
  assert.equal(await session.setPaused(false), false); assert.equal(audio.attempts.length, 2);
});

test('a current play failure releases ownership once; a paused transport error does too', async () => {
  for (const mode of ['current-rejection', 'paused-error'] as const) {
    const audio = new DeferredMedia(), finished: string[] = [];
    const session = new HostAudioTrackSession(audio, reason => finished.push(reason));
    const pending = session.play();
    if (mode === 'paused-error') {
      await session.setPaused(true); audio.dispatchEvent(new Event('error'));
    }
    audio.attempts[0]!.reject(new Error('current transport failure'));
    assert.equal(await pending, false);
    audio.dispatchEvent(new Event('error')); audio.dispatchEvent(new Event('ended'));
    assert.deepEqual(finished, ['error']); assert.equal(audio.disposals, 1);
    await session.setPaused(false); assert.equal(audio.attempts.length, 1);
  }
});

test('a retired page session cannot release or dispose the next page session on late errors', async () => {
  const oldAudio = new DeferredMedia(), newAudio = new DeferredMedia();
  const completed: string[] = [];
  const old = new HostAudioTrackSession(oldAudio, reason => completed.push(`old:${reason}`));
  const oldPlay = old.play(); old.stop();
  const next = new HostAudioTrackSession(newAudio, reason => completed.push(`new:${reason}`));
  const newPlay = next.play(); newAudio.attempts[0]!.resolve(); assert.equal(await newPlay, true);
  oldAudio.attempts[0]!.reject(new DOMException('old owner cancelled', 'AbortError'));
  oldAudio.dispatchEvent(new Event('error')); oldAudio.dispatchEvent(new Event('ended'));
  assert.equal(await oldPlay, false); assert.deepEqual(completed, []);
  assert.equal(oldAudio.disposals, 1); assert.equal(newAudio.disposals, 0);
  next.stop();
});
