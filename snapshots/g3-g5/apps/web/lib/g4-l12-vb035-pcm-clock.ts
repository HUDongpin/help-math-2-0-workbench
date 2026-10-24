import {createVb035SourceState, transitionVb035Source, VB035_SOURCE,
  type Vb035SourceState, type Vb035SourceEvent} from './g4-l12-vb035-source-controller';

export const VB035_PCM_ASSET = Object.freeze({
  url: '/flash-assets/current-js-audio-calibration-v1/course-g04-l12-vb-035/source-pcm?sha256=081fa3562e96948e31b940131c9f6ee5b1e954cfc8e49a194b29ddc7cc1ed089',
  sha256: '081fa3562e96948e31b940131c9f6ee5b1e954cfc8e49a194b29ddc7cc1ed089',
  bytes: 458_540,
});

export const VB035_PCM_CLOCK_POLICY = Object.freeze({
  id: 'vb035-private-continuous-pcm-calibration-v1',
  authority: 'private-engineering-calibration-only',
  sampleRateHz: VB035_SOURCE.streamSampleRate,
  cueStartSeconds: (VB035_SOURCE.streamFirstFrame - 1) / VB035_SOURCE.fps,
  terminalSeconds: (VB035_SOURCE.frameCount - 1) / VB035_SOURCE.fps,
  declaredLatencySeekSamples: VB035_SOURCE.streamLatencySeekSamples,
  scheduledInitialOffsetSeconds: VB035_SOURCE.streamLatencySeekSamples / VB035_SOURCE.streamSampleRate,
  latencyApplication: 'once in the continuous PCM source offset, not once per block or resume',
  perBlockSeekApplied: false,
  frozenPcmAssetTrimmed: false,
  sourceTriggerParityEstablished: false,
  flashTimingEstablished: false,
  terminalStopSemanticsVerified: false,
  originalRuntimeAcceptance: false,
});

/** Decode the fixed canonical PCM container, never browser MP3/WAV normalization or resampling. */
export async function decodeVb035PrivatePcm(bytes: ArrayBuffer): Promise<Float32Array> {
  if (!(bytes instanceof ArrayBuffer) || bytes.byteLength !== VB035_PCM_ASSET.bytes) {
    throw new Error('VB035 private PCM byte length is invalid.');
  }
  // Snapshot the caller's mutable buffer before the asynchronous digest.
  const copy = bytes.slice(0), view = new DataView(copy), ascii = new Uint8Array(copy);
  const text = (start: number, end: number) => String.fromCharCode(...ascii.subarray(start, end));
  if (text(0, 4) !== 'RIFF' || view.getUint32(4, true) !== 458_532 || text(8, 16) !== 'WAVEfmt ' ||
    view.getUint32(16, true) !== 16 || view.getUint16(20, true) !== 1 || view.getUint16(22, true) !== 1 ||
    view.getUint32(24, true) !== 22_050 || view.getUint32(28, true) !== 44_100 ||
    view.getUint16(32, true) !== 2 || view.getUint16(34, true) !== 16 || text(36, 40) !== 'data' ||
    view.getUint32(40, true) !== 458_496) throw new Error('VB035 private PCM header is invalid.');
  if (!globalThis.crypto?.subtle) throw new Error('VB035 private PCM requires WebCrypto SHA-256.');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', copy);
  const sha = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
  if (sha !== VB035_PCM_ASSET.sha256) throw new Error('VB035 private PCM SHA-256 does not match.');
  const samples = new Float32Array(VB035_SOURCE.rawCodecSampleCount);
  for (let index = 0; index < samples.length; index += 1) samples[index] = view.getInt16(44 + index * 2, true) / 32768;
  return samples;
}

export interface Vb035PcmClockSnapshot {
  readonly state: Vb035SourceState;
  readonly running: boolean;
  readonly sounding: boolean;
  readonly muted: boolean;
  readonly status: 'ready' | 'playing' | 'paused' | 'blocked' | 'complete' | 'inspection';
}

type GlossaryButtonId = Extract<Vb035SourceEvent, {type: 'glossary-button-activated'}>['buttonId'];
export interface Vb035PcmClock {
  snapshot(): Vb035PcmClockSnapshot;
  play(): Promise<void>;
  pause(): void;
  mute(): void;
  unmute(): void;
  replay(): void;
  inspect(frame: number): void;
  openGlossary(buttonId: GlossaryButtonId): void;
  closeGlossary(): void;
  setVolume(value: number): void;
  destroy(): void;
}

/** Owns the supplied dedicated AudioContext. Destroy closes it; do not pass a shared context. */
export function createVb035PcmClock(context: AudioContext, samples: Float32Array): Vb035PcmClock {
  if (samples.length !== VB035_SOURCE.rawCodecSampleCount ||
    samples.some((sample) => !Number.isFinite(sample) || sample < -1 || sample >= 1)) {
    throw new Error('VB035 PCM clock requires the fixed finite source samples.');
  }
  let buffer: AudioBuffer | null = context.createBuffer(1, samples.length, VB035_SOURCE.streamSampleRate);
  buffer.copyToChannel(new Float32Array(samples), 0);
  const gain = context.createGain();
  gain.connect(context.destination);
  let state = createVb035SourceState(), running = false, muted = false, destroyed = false;
  let elapsed = 0, anchor = context.currentTime, volume = 1;
  let baseStatus: 'ready' | 'paused' | 'blocked' = 'ready';
  let playRevision = 0, nodeRevision = 0, pendingPlay: Promise<void> | null = null;
  let active: {node: AudioBufferSourceNode; revision: number; start: number; end: number} | null = null;
  const terminal = VB035_PCM_CLOCK_POLICY.terminalSeconds;

  function stopNode() {
    nodeRevision += 1;
    const previous = active;
    active = null;
    if (!previous) return;
    previous.node.onended = null;
    try { previous.node.stop(); } catch { /* It may already have ended naturally. */ }
    previous.node.disconnect();
    previous.node.buffer = null;
  }

  function currentElapsed() {
    return Math.min(terminal, elapsed + (running ? Math.max(0, context.currentTime - anchor) : 0));
  }

  function update() {
    if (!running || destroyed) return;
    const nowElapsed = currentElapsed();
    const frame = Math.min(VB035_SOURCE.frameCount, 1 + Math.floor(nowElapsed * VB035_SOURCE.fps));
    if (frame > state.frame) state = transitionVb035Source(state, {type: 'advance-frames', count: frame - state.frame});
    // A browser/OS suspension (including native "interrupted") freezes the
    // master clock. Retain the fractional elapsed value, not only its frame.
    if (state.phase === 'complete' || context.state !== 'running') {
      elapsed = nowElapsed; running = false; stopNode();
      playRevision += 1; pendingPlay = null;
      if (state.phase !== 'complete') {
        state = transitionVb035Source(state, {type: 'pause'}); baseStatus = 'blocked';
      }
    }
  }

  function suspendPlayback() {
    update();
    elapsed = currentElapsed(); running = false;
    playRevision += 1; pendingPlay = null;
    stopNode();
  }

  function schedule() {
    stopNode();
    if (!running || muted || destroyed || !buffer || state.phase !== 'playing') return;
    const nowElapsed = currentElapsed(), cue = VB035_PCM_CLOCK_POLICY.cueStartSeconds;
    const offset = VB035_PCM_CLOCK_POLICY.scheduledInitialOffsetSeconds + Math.max(0, nowElapsed - cue);
    if (offset >= buffer.duration || nowElapsed >= terminal) return;
    const start = context.currentTime + Math.max(0, cue - nowElapsed);
    const end = context.currentTime + (terminal - nowElapsed);
    try {
      const node = context.createBufferSource();
      const revision = ++nodeRevision;
      active = {node, revision, start, end: Math.min(end, start + buffer.duration - offset)};
      node.buffer = buffer; node.connect(gain);
      node.onended = () => {
        if (destroyed || active?.node !== node || active.revision !== revision) return;
        active = null; node.onended = null; node.disconnect(); node.buffer = null;
        update();
      };
      node.start(start, offset); node.stop(end);
    }
    catch { suspendPlayback(); state = transitionVb035Source(state, {type: 'pause'}); baseStatus = 'blocked'; }
  }

  const api: Vb035PcmClock = {
    snapshot() {
      update();
      const status = state.phase === 'inspection' ? 'inspection' : state.phase === 'complete' ? 'complete'
        : running ? 'playing' : baseStatus;
      return Object.freeze({state, running, muted, status,
        sounding: Boolean(active && running && !muted && volume > 0 && context.state === 'running' &&
          context.currentTime >= active.start && context.currentTime < active.end)});
    },
    play() {
      update();
      if (destroyed || running || state.phase === 'inspection' || state.phase === 'complete' || state.phase === 'glossary') return Promise.resolve();
      if (pendingPlay && context.state === 'running') return pendingPlay;
      // Autoplay may leave resume() unresolved until a gesture. A subsequent
      // explicit Play must call resume() in that new gesture, not only return
      // the indefinitely pending promise. Older completions lose their epoch.
      if (context.state !== 'running') {
        state = transitionVb035Source(state, {type: 'pause'}); baseStatus = 'blocked';
      }
      const revision = ++playRevision;
      const operation = (async () => {
        try {
          await context.resume();
          if (destroyed || revision !== playRevision) return;
          if (context.state !== 'running') throw new Error('AudioContext did not resume.');
          state = transitionVb035Source(state, {type: 'play'});
          anchor = context.currentTime; running = true; baseStatus = 'paused';
          schedule();
        } catch {
          if (destroyed || revision !== playRevision) return;
          suspendPlayback(); state = transitionVb035Source(state, {type: 'pause'}); baseStatus = 'blocked';
        }
      })().finally(() => { if (pendingPlay === operation) pendingPlay = null; });
      pendingPlay = operation;
      return operation;
    },
    pause() {
      if (destroyed) return;
      suspendPlayback(); state = transitionVb035Source(state, {type: 'pause'}); baseStatus = 'paused';
    },
    mute() { if (!destroyed) { update(); muted = true; stopNode(); } },
    unmute() { if (!destroyed) { update(); if (muted) { muted = false; schedule(); } } },
    replay() {
      if (destroyed) return;
      suspendPlayback(); state = transitionVb035Source(state, {type: 'replay'});
      elapsed = 0; anchor = context.currentTime; muted = false; baseStatus = 'ready';
    },
    inspect(frame) {
      if (destroyed) return;
      const inspected = transitionVb035Source(state, {type: 'inspect-frame', frame});
      suspendPlayback(); state = inspected; baseStatus = 'paused';
    },
    openGlossary(buttonId) {
      if (destroyed) return;
      update();
      const opened = transitionVb035Source(state, {type: 'glossary-button-activated', buttonId});
      suspendPlayback(); state = opened; baseStatus = 'paused';
    },
    closeGlossary() {
      if (destroyed) return;
      state = transitionVb035Source(state, {type: 'close-glossary'});
      baseStatus = 'paused';
    },
    setVolume(value) {
      if (destroyed) return;
      volume = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
      gain.gain.setValueAtTime(volume, context.currentTime);
    },
    destroy() {
      if (destroyed) return;
      suspendPlayback(); destroyed = true;
      state = transitionVb035Source(state, {type: 'pause'}); baseStatus = 'paused';
      buffer = null; gain.disconnect();
      if (context.state !== 'closed') void context.close().catch(() => {});
    },
  };
  return Object.freeze(api);
}
