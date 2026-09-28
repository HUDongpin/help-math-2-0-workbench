import {createG4L12VB036SourceState, reduceG4L12VB036SourceState,
  type G4L12VB036SourceState, type G4L12VB036SourceEvent} from './g4-l12-vb036-source-controller';
import {VB036_PCM_ASSETS, vb036PcmAsset, type Vb036PcmStream} from './g4-l12-vb036-pcm-assets';

const FPS = 12, SAMPLE_RATE = 22_050, LATENCY = 1673 / SAMPLE_RATE;
export const VB036_PCM_CLOCK_POLICY = Object.freeze({
  id: 'vb036-private-continuous-pcm-calibration-v1',
  authority: 'private-engineering-calibration-only',
  fps: FPS, sampleRateHz: SAMPLE_RATE, declaredLatencySeekSamples: 1673,
  alignment: 'declared latency once per stream origin plus continuous source-frame elapsed time',
  entryAndTerminalPolicy: 'maintained controller frame boundaries; original consumption ordering unverified',
  perBlockSeekApplied: false, frozenPcmTrimmed: false,
  unselectedHostStreams: Object.freeze(['0002', '0010']),
  buttonDownStream: '0001',
  buttonDownLifecycleImplemented: false,
  externalHostNarrationAutomaticallyMixed: false,
  sourceTriggerParityEstablished: false, flashTimingEstablished: false,
  terminalStopSemanticsVerified: false, originalRuntimeAcceptance: false,
});

type State = G4L12VB036SourceState;
type Interaction = Extract<G4L12VB036SourceEvent, {type: 'answer-release' | 'wrong-feedback-close'}>;
export function vb036DomainPlaying(state: State) {
  return state.feedback && state.feedback.playback !== 'reset-at-frame-1'
    ? state.feedback.playback === 'playing' : state.main.playback === 'playing';
}
function nextSegment(state: State) {
  if (!vb036DomainPlaying(state)) return null;
  const feedback = state.feedback?.playback === 'playing' ? state.feedback : null;
  const domain = feedback?.frameDomain ?? state.main.frameDomain;
  const asset = VB036_PCM_ASSETS.find((item) => item.frameDomain === domain);
  if (!asset) throw new Error('VB036 active domain has no bound PCM stream.');
  const frame = feedback?.localFrame ?? state.main.localFrame;
  const end = feedback ? (feedback.closeStopFrame && frame < feedback.closeStopFrame
    ? feedback.closeStopFrame : feedback.terminalFrame) : frame < 56 ? 56 : 82;
  if (end <= frame) throw new Error('VB036 segment must advance before its next source stop.');
  let after = state;
  for (let i = frame; i < end; i++) after = reduceG4L12VB036SourceState(after, {type: 'clock'});
  return {stream: asset.stream, firstFrame: asset.firstFrame, frame, end, after};
}

export interface Vb036PcmWindow {
  readonly stream: Vb036PcmStream;
  readonly startsAfterSeconds: number;
  readonly stopsAfterSeconds: number;
  readonly offsetSeconds: number;
}

/** Forecast to the next user-dependent stop, so audio does not depend on RAF delivery. */
export function planVb036PcmWindows(state: State, fractionalSeconds = 0): readonly Vb036PcmWindow[] {
  if (!Number.isFinite(fractionalSeconds) || fractionalSeconds < 0 || fractionalSeconds >= 1 / FPS) {
    throw new Error('VB036 fractional frame time is invalid.');
  }
  const windows: Vb036PcmWindow[] = [];
  let current = state, lead = 0, fraction = fractionalSeconds;
  for (let boundary = 0; boundary < 3; boundary++) {
    const segment = nextSegment(current);
    if (!segment) return Object.freeze(windows);
    const duration = (segment.end - segment.frame) / FPS - fraction;
    const delay = Math.max(0, (segment.firstFrame - segment.frame) / FPS - fraction);
    const offset = LATENCY + Math.max(0, (segment.frame - segment.firstFrame) / FPS + fraction);
    const bufferRemaining = vb036PcmAsset(segment.stream).sampleFrames / SAMPLE_RATE - offset;
    const stop = Math.min(duration, delay + bufferRemaining);
    if (bufferRemaining > 0 && stop > delay) windows.push(Object.freeze({
      stream: segment.stream, startsAfterSeconds: lead + delay,
      stopsAfterSeconds: lead + stop, offsetSeconds: offset,
    }));
    lead += duration; fraction = 0; current = segment.after;
  }
  if (vb036DomainPlaying(current)) throw new Error('Unexpected VB036 autonomous source cycle.');
  return Object.freeze(windows);
}

function advance(state: State, seconds: number) {
  let current = state;
  const ticks = Math.floor((seconds + 1e-12) * FPS);
  const remainder = Math.max(0, seconds - ticks / FPS);
  // This source can advance at most 113 ticks without a new user interaction.
  for (let i = 0; i < Math.min(ticks, 150) && vb036DomainPlaying(current); i++) {
    current = reduceG4L12VB036SourceState(current, {type: 'clock'});
  }
  if (ticks > 150 && vb036DomainPlaying(current)) throw new Error('Unexpected VB036 source clock range.');
  return {state: current, fraction: vb036DomainPlaying(current) ? remainder : 0};
}

export interface Vb036PcmClockSnapshot {
  readonly state: State;
  readonly inspectionFrame: number | null;
  readonly running: boolean;
  readonly transportPlaying: boolean;
  readonly sounding: boolean;
  readonly soundingStreams: readonly Vb036PcmStream[];
  readonly muted: boolean;
  readonly status: 'ready' | 'playing' | 'interactive' | 'paused' | 'blocked' | 'complete' | 'inspection';
}
export interface Vb036PcmClock {
  snapshot(): Vb036PcmClockSnapshot;
  play(): Promise<void>;
  pause(): void;
  mute(): void;
  unmute(): void;
  replay(): void;
  inspect(frame: number): void;
  interact(event: Interaction): void;
  setVolume(value: number): void;
  destroy(): void;
}

/** Owns a dedicated context, including cleanup on validation/allocation failure. Only source-selected domains are scheduled. */
export function createVb036PcmClock(
  context: AudioContext,
  samples: ReadonlyMap<Vb036PcmStream, Float32Array>,
): Vb036PcmClock {
  if (samples.size !== VB036_PCM_ASSETS.length || VB036_PCM_ASSETS.some((asset) => {
    const values = samples.get(asset.stream);
    return !values || values.length !== asset.sampleFrames ||
      values.some((value) => !Number.isFinite(value) || value < -1 || value >= 1);
  })) {
    try { if (context.state !== 'closed') void context.close().catch(() => {}); } catch { /* Context already unavailable. */ }
    throw new Error('VB036 PCM clock requires all eleven fixed finite sample arrays.');
  }
  const buffers = new Map<Vb036PcmStream, AudioBuffer>();
  let gain!: GainNode;
  try {
    for (const asset of VB036_PCM_ASSETS) {
      const buffer = context.createBuffer(1, asset.sampleFrames, SAMPLE_RATE);
      buffer.copyToChannel(new Float32Array(samples.get(asset.stream)!), 0);
      buffers.set(asset.stream, buffer);
    }
    gain = context.createGain(); gain.connect(context.destination);
  } catch (error) {
    buffers.clear();
    try { gain?.disconnect(); } catch { /* Preserve the original allocation failure. */ }
    try { if (context.state !== 'closed') void context.close().catch(() => {}); } catch { /* Already unavailable. */ }
    throw error;
  }
  let state = createG4L12VB036SourceState(), fraction = 0, anchor = context.currentTime;
  let transport = false, muted = false, destroyed = false, volume = 1, inspection: number | null = null;
  let baseStatus: 'ready' | 'paused' | 'blocked' = 'ready', revision = 0;
  let pendingPlay: Promise<void> | null = null;
  type ActiveNode = {node: AudioBufferSourceNode; stream: Vb036PcmStream; start: number; end: number};
  const active = new Set<ActiveNode>();

  function stopNodes() {
    for (const item of active) {
      item.node.onended = null;
      try { item.node.stop(); } catch { /* Already-ended source. */ }
      item.node.disconnect(); item.node.buffer = null;
    }
    active.clear();
  }
  function cancelPending() { revision++; pendingPlay = null; }
  function sync() {
    if (destroyed || !transport) return;
    const now = context.currentTime;
    const next = advance(state, fraction + Math.max(0, now - anchor));
    state = next.state; fraction = next.fraction; anchor = now;
    if (state.main.localFrame === 82 || context.state !== 'running') {
      transport = false; stopNodes(); cancelPending();
      if (state.main.localFrame !== 82) baseStatus = 'blocked';
    }
  }
  function pausePlayback() {
    sync(); transport = false; anchor = context.currentTime;
    stopNodes(); cancelPending();
  }
  function schedule() {
    stopNodes();
    if (!transport || muted || destroyed || inspection !== null) return;
    try {
      const now = context.currentTime;
      for (const window of planVb036PcmWindows(state, fraction)) {
        const node = context.createBufferSource();
        const item = {node, stream: window.stream, start: now + window.startsAfterSeconds,
          end: now + window.stopsAfterSeconds};
        active.add(item);
        node.buffer = buffers.get(window.stream)!; node.connect(gain);
        node.onended = () => {
          if (!active.delete(item)) return;
          node.onended = null; node.disconnect(); node.buffer = null; sync();
        };
        node.start(item.start, window.offsetSeconds); node.stop(item.end);
      }
    } catch { pausePlayback(); baseStatus = 'blocked'; }
  }

  const api: Vb036PcmClock = {
    snapshot() {
      sync();
      const running = transport && vb036DomainPlaying(state);
      const soundingStreams = !transport || muted || volume <= 0 || context.state !== 'running' ? []
        : [...active].filter((item) => context.currentTime >= item.start && context.currentTime < item.end)
          .map((item) => item.stream);
      const status = inspection !== null ? 'inspection' : state.main.localFrame === 82 ? 'complete'
        : running ? 'playing' : transport ? 'interactive' : baseStatus;
      return Object.freeze({state, inspectionFrame: inspection, running, transportPlaying: transport,
        sounding: soundingStreams.length > 0, soundingStreams: Object.freeze(soundingStreams), muted, status});
    },
    play() {
      sync();
      if (destroyed || inspection !== null || state.main.localFrame === 82 || transport) return Promise.resolve();
      if (pendingPlay && context.state === 'running') return pendingPlay;
      if (context.state !== 'running') baseStatus = 'blocked';
      const mine = ++revision;
      const operation = (async () => {
        try {
          await context.resume();
          if (destroyed || mine !== revision) return;
          if (context.state !== 'running') throw new Error('VB036 AudioContext did not resume.');
          anchor = context.currentTime; transport = true; baseStatus = 'paused'; schedule();
        } catch {
          if (destroyed || mine !== revision) return;
          pausePlayback(); baseStatus = 'blocked';
        }
      })().finally(() => {if (pendingPlay === operation) pendingPlay = null;});
      pendingPlay = operation; return operation;
    },
    pause() {if (!destroyed) {pausePlayback(); baseStatus = 'paused';}},
    mute() {if (!destroyed) {sync(); muted = true; stopNodes();}},
    unmute() {if (!destroyed) {sync(); if (muted) {muted = false; schedule();}}},
    replay() {
      if (destroyed) return;
      pausePlayback(); state = createG4L12VB036SourceState();
      fraction = 0; inspection = null; muted = false; baseStatus = 'ready';
    },
    inspect(frame) {
      if (!Number.isInteger(frame) || frame < 1 || frame > 82) throw new Error('VB036 inspection requires frame 1..82.');
      if (destroyed) return;
      pausePlayback(); inspection = frame; baseStatus = 'paused';
    },
    interact(event) {
      if (destroyed || inspection !== null) return;
      sync();
      const next = reduceG4L12VB036SourceState(state, event);
      stopNodes(); cancelPending(); state = next; fraction = 0; anchor = context.currentTime;
      schedule();
    },
    setVolume(value) {
      if (destroyed) return;
      volume = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
      gain.gain.setValueAtTime(volume, context.currentTime);
    },
    destroy() {
      if (destroyed) return;
      pausePlayback(); destroyed = true; buffers.clear(); gain.disconnect();
      if (context.state !== 'closed') void context.close().catch(() => {});
    },
  };
  return Object.freeze(api);
}
