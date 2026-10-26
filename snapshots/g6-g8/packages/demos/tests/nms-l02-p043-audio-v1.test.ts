import test from 'node:test';
import assert from 'node:assert/strict';
import { P043SourceAudio } from '../src/nms-l02-p043-audio-v1';
import { P043_AUDIO_PLANS } from '../src/generated/nms-l02-p043-audio-plan-v1';
import { P043_TARGETS, type P043Term } from '../src/nms-l02-p043-matching-v1';
const settle = () => new Promise<void>(resolve => setImmediate(resolve));
function fixture() {
  const observed = { now: 0, closed: 0, stops: 0, reads: [] as string[] };
  const context = { get currentTime() { return observed.now; }, destination: {},
    createGain: () => ({ gain: { value: 0 }, connect() {}, disconnect() {} }), resume: async () => {}, close: async () => { observed.closed++; },
    createBufferSource: () => ({ buffer: null, onended: null, connect() {}, disconnect() {}, start() {}, stop() { observed.stops++; } }),
  } as unknown as AudioContext;
  const audio = new P043SourceAudio({ changed() {}, createContext: () => context,
    read: async domain => { observed.reads.push(domain); return new ArrayBuffer(0); },
    decode: async (_context, domain) => ({ duration: P043_AUDIO_PLANS[domain].totalSamples / P043_AUDIO_PLANS[domain].sampleRate }) as AudioBuffer,
  }, 2);
  return { audio, observed, context };
}
test('real clock with injected media transitions through four feedbacks and one final clip', async () => {
  const { audio, observed } = fixture(); await audio.play(); observed.now = 18.5;
  assert.equal(audio.snapshot().state.phase, 'ready');
  for (const term of Object.keys(P043_TARGETS) as P043Term[]) {
    audio.match(term, P043_TARGETS[term]); await settle();
    assert.equal(audio.snapshot().phase, 'playing'); assert.equal(audio.snapshot().audioDomain, '249');
    audio.match('fraction', 1); assert.equal(audio.snapshot().state.phase, 'correct-feedback');
    observed.now += P043_AUDIO_PLANS['249'].totalSamples / 22050 + .001; audio.snapshot(); await settle();
  }
  assert.equal(audio.snapshot().state.phase, 'completion-feedback'); assert.equal(audio.snapshot().audioDomain, '183');
  observed.now += 2 + 2 / 12 + .001;
  assert.equal(audio.snapshot().state.completed, true); assert.equal(audio.snapshot().state.frame, 225);
  assert.deepEqual(observed.reads, ['250', '249', '183']);
  audio.replay(); assert.equal(audio.snapshot().state.matched.length, 0); assert.equal(audio.snapshot().state.frame, 1);
  await audio.close(); await audio.close(); assert.equal(observed.closed, 1); assert.equal(audio.snapshot().state.playing, false);
});
test('modal pauses elapsed time and does not auto-resume; wrong Close cancels its media', async () => {
  const { audio, observed } = fixture(); await audio.play(); observed.now = .125;
  audio.setModal(true); assert.equal(audio.snapshot().elapsed, .125); observed.now = 100;
  await audio.play(); assert.equal(audio.snapshot().phase, 'paused'); assert.equal(audio.snapshot().elapsed, .125);
  audio.setModal(false); assert.equal(audio.snapshot().phase, 'paused'); await audio.play();
  observed.now += 18.375; assert.equal(audio.snapshot().state.phase, 'ready');
  audio.match('fraction', 1); await settle(); assert.equal(audio.snapshot().state.phase, 'wrong-feedback');
  audio.closeWrongFeedback(); assert.equal(audio.snapshot().state.phase, 'ready'); assert.equal(audio.snapshot().phase, 'paused');
  await audio.close();
});
test('Replay invalidates delayed reads and prevents stale decode publication', async () => {
  const { context } = fixture(); let resolve!: (v: ArrayBuffer) => void, signal!: AbortSignal, decoded = 0;
  const audio = new P043SourceAudio({ changed() {}, createContext: () => context,
    read: async (_domain, s) => { signal = s; return new Promise(r => { resolve = r; }); },
    decode: async () => { decoded++; throw Error('must not decode stale read'); },
  });
  const pending = audio.play(); await settle(); audio.replay(); assert.equal(signal.aborted, true);
  resolve(new ArrayBuffer(0)); await pending; assert.equal(decoded, 0); assert.equal(audio.snapshot().state.replay, 1);
  assert.equal(audio.snapshot().phase, 'paused'); await audio.close();
});
