import type {DecodedSourceStreamBinding, DecodedStreamResult} from './decoded-source-stream-transport';

export interface NmsL1P002SourceClockPlan {
  readonly version: 1;
  readonly sourceSwfSha256: string;
  readonly frameDomain: 'sprite-722';
  readonly firstFrame: 1;
  readonly lastFrame: 985;
  readonly fps: 12;
  readonly sourceSegmentCount: 2;
  readonly sourceHasNegativeSeek: true;
  readonly decoder: DecodedSourceStreamBinding;
  readonly segments: readonly Readonly<{firstFrame: number; firstDecodedSample: number; endDecodedSample: number}>[];
  readonly terminalEmptyBlock: Readonly<{frame: 401; samples: 0; seek: -2072; mp3Bytes: 0}>;
  readonly alignmentStatus: 'source-block-boundary-candidate-not-original-runtime-accepted';
}

type Phase = 'idle' | 'loading' | 'ready' | 'start-pending' | 'playing' | 'paused' | 'timeline-ended' | 'failed' | 'closed';
type Policy = {activation: 'automatic' | 'user'; reducedMotion: boolean};
type Slice = Readonly<{segmentIndex: number; delaySeconds: number; firstDecodedSample: number; durationSeconds: number}>;
const END_SECONDS = 984 / 12;
const SOURCE = '8a7ecf75e3dc95dc4e9d7a35b52b97df02f5e93f5f7fa1e22b8e4472fe4fd6c4';
const result = (accepted: boolean, reason: string): DecodedStreamResult => Object.freeze({accepted, reason});
const hashPattern = /^[a-f0-9]{64}$/u;

/** Piecewise candidate coordinates, derived from the source MP3 run boundaries.
 * A silent gap schedules no source node. This does not assert Flash seek parity. */
export function nmsL1P002AudioSlices(plan: NmsL1P002SourceClockPlan, positionSeconds: number): readonly Slice[] {
  if (!Number.isFinite(positionSeconds) || positionSeconds < 0 || positionSeconds > END_SECONDS) throw Error('invalid-source-position');
  return Object.freeze(plan.segments.flatMap((segment, segmentIndex) => {
    const begin = (segment.firstFrame - 1) / 12;
    const end = Math.min(END_SECONDS, begin + (segment.endDecodedSample - segment.firstDecodedSample) / 22050);
    const from = Math.max(positionSeconds, begin);
    if (from >= end) return [];
    return [Object.freeze({segmentIndex, delaySeconds: from - positionSeconds,
      firstDecodedSample: segment.firstDecodedSample + (from - begin) * 22050, durationSeconds: end - from})];
  }));
}

async function sha256(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), n => n.toString(16).padStart(2, '0')).join('');
}
async function pcmSha256(buffer: AudioBuffer) {
  const bytes = new ArrayBuffer(buffer.length * 4), view = new DataView(bytes), samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) {
    if (!Number.isFinite(samples[i])) throw Error('nonfinite-decoded-sample');
    view.setFloat32(i * 4, samples[i], true);
  }
  return sha256(bytes);
}

/** Bounded football-story clock. Native scheduling preserves both source runs
 * across the gap even if drawing pauses; navigation/Replay retires every node. */
export class NmsL1P002SourceClockV1 {
  readonly plan: NmsL1P002SourceClockPlan;
  private context?: AudioContext;
  private gain?: GainNode;
  private buffer?: AudioBuffer;
  private nodes = new Set<AudioBufferSourceNode>();
  private phase: Phase = 'idle';
  private position = 0;
  private anchor?: {contextTime: number; seconds: number};
  private epoch = 0;
  private volume = 1;
  private audioPhase = 'idle';
  private failure: string | null = null;

  constructor(plan: NmsL1P002SourceClockPlan, private readonly options: {
    createContext?: () => AudioContext; commitHeldFrame: (frame: number) => boolean;
  }) {
    const d = plan.decoder;
    if (plan.version !== 1 || plan.sourceSwfSha256 !== SOURCE || plan.frameDomain !== 'sprite-722' ||
      plan.firstFrame !== 1 || plan.lastFrame !== 985 || plan.fps !== 12 || plan.sourceSegmentCount !== 2 || plan.sourceHasNegativeSeek !== true ||
      plan.alignmentStatus !== 'source-block-boundary-candidate-not-original-runtime-accepted' ||
      plan.terminalEmptyBlock.frame !== 401 || plan.terminalEmptyBlock.samples !== 0 || plan.terminalEmptyBlock.seek !== -2072 || plan.terminalEmptyBlock.mp3Bytes !== 0 ||
      plan.segments.length !== 2 || !plan.segments.every((s, i) => s.firstFrame === [1, 428][i] && s.firstDecodedSample === [1673, 734699][i] && s.endDecodedSample === [734400, 1759680][i]) ||
      d.sampleRate !== 22050 || d.channels !== 1 || d.decodedSamples !== 1759680 || !Number.isSafeInteger(d.sourceBytes) || d.sourceBytes <= 0 ||
      !hashPattern.test(d.sourceSha256) || !hashPattern.test(d.pcmSha256) || typeof options.commitHeldFrame !== 'function') throw Error('unsupported-nms-l01-p002-plan');
    this.plan = Object.freeze({...plan, decoder: Object.freeze({...d}), terminalEmptyBlock: Object.freeze({...plan.terminalEmptyBlock}),
      segments: Object.freeze(plan.segments.map(s => Object.freeze({...s})))});
  }

  private settle() {
    if (!this.anchor || !this.context || this.phase !== 'playing') return;
    this.position = Math.min(END_SECONDS, this.anchor.seconds + Math.max(0, this.context.currentTime - this.anchor.contextTime));
    if (this.position >= END_SECONDS) {this.retire(); this.phase = 'timeline-ended'; this.audioPhase = 'boundary-held';}
  }
  private retire() {
    this.anchor = undefined;
    for (const node of this.nodes) {
      node.onended = null;
      try {node.stop();} catch {/* A source already at its native boundary still must be disconnected. */}
      node.disconnect();
    }
    this.nodes.clear();
  }
  private commit() {
    try {return this.options.commitHeldFrame(Math.min(985, 1 + Math.floor(this.position * 12 + 1e-9))) === true;}
    catch {return false;}
  }
  private readonly contextChanged = () => {
    if (!this.context || this.context.state === 'running' || this.phase === 'closed' || this.phase === 'loading') return;
    this.settle(); this.retire(); this.epoch++;
    if (this.context.state === 'closed') {
      this.phase = 'closed'; this.audioPhase = 'closed'; this.buffer = undefined;
      this.gain?.disconnect(); this.context.removeEventListener('statechange', this.contextChanged);
    } else if (this.phase === 'playing' || this.phase === 'start-pending') {
      this.phase = 'paused'; this.audioPhase = 'interrupted';
      if (!this.commit()) {this.phase = 'failed'; this.failure = 'interrupted-frame-not-committed';}
    }
  };

  snapshot() {
    this.settle();
    const frame = Math.min(985, 1 + Math.floor(this.position * 12 + 1e-9));
    const segmentIndex = this.plan.segments.findIndex(s => this.position >= (s.firstFrame - 1) / 12 &&
      this.position < Math.min(END_SECONDS, (s.firstFrame - 1) / 12 + (s.endDecodedSample - s.firstDecodedSample) / 22050));
    const segment = this.plan.segments[segmentIndex];
    const decodedSample = segment ? segment.firstDecodedSample + (this.position - (segment.firstFrame - 1) / 12) * 22050 :
      this.position < 427 / 12 ? 734400 : Math.min(1759680, 734699 + (this.position - 427 / 12) * 22050);
    return Object.freeze({phase: this.phase, frame, frameDomain: this.plan.frameDomain, elapsedSeconds: this.position,
      audio: Object.freeze({phase: this.audioPhase, decodedSample, contextTime: this.context?.currentTime ?? null, volume: this.volume}),
      audioEnded: segmentIndex < 0, activeSegmentIndex: segmentIndex, timelineReachedEnd: this.phase === 'timeline-ended',
      failure: this.failure, sourceAlignment: this.plan.alignmentStatus, originalRuntimeAccepted: false, audioAccepted: false, lessonCompleted: false});
  }

  async prepare(input: ArrayBuffer): Promise<DecodedStreamResult> {
    if (this.phase !== 'idle') return result(false, 'prepare-not-idle');
    const bytes = input.slice(0), ticket = ++this.epoch; this.phase = 'loading';
    try {
      const d = this.plan.decoder;
      if (bytes.byteLength !== d.sourceBytes || await sha256(bytes) !== d.sourceSha256) throw Error('source-byte-identity-mismatch');
      if (ticket !== this.epoch) return result(false, 'stale-prepare');
      const context = this.options.createContext?.() ?? new AudioContext({sampleRate: 22050, latencyHint: 'interactive'});
      this.context = context;
      if (context.sampleRate !== 22050) throw Error('context-sample-rate-mismatch');
      context.addEventListener('statechange', this.contextChanged);
      this.gain = context.createGain(); this.gain.connect(context.destination); this.gain.gain.setValueAtTime(this.volume, context.currentTime);
      const buffer = await context.decodeAudioData(bytes);
      if (ticket !== this.epoch) return result(false, 'stale-prepare');
      if (buffer.sampleRate !== 22050 || buffer.numberOfChannels !== 1 || buffer.length !== d.decodedSamples || await pcmSha256(buffer) !== d.pcmSha256) throw Error('decoded-buffer-identity-mismatch');
      if (ticket !== this.epoch) return result(false, 'stale-prepare');
      this.buffer = buffer; this.position = 0;
      if (!this.commit()) throw Error('source-first-frame-not-committed');
      this.phase = 'ready'; this.audioPhase = 'ready'; return result(true, 'source-runs-ready');
    } catch (error) {
      if (ticket !== this.epoch) return result(false, 'stale-prepare');
      this.failure = error instanceof Error ? error.message : String(error); this.retire();
      this.phase = 'failed'; this.audioPhase = 'failed'; this.buffer = undefined;
      this.context?.removeEventListener('statechange', this.contextChanged); this.gain?.disconnect();
      if (this.context && this.context.state !== 'closed') await this.context.close();
      return result(false, this.failure);
    }
  }

  async play(policy: Policy): Promise<DecodedStreamResult> {
    this.settle();
    if (!['automatic', 'user'].includes(policy.activation) || typeof policy.reducedMotion !== 'boolean') return result(false, 'invalid-play-policy');
    if (policy.reducedMotion && policy.activation === 'automatic') return result(false, 'reduced-motion-hold');
    if (this.phase === 'playing') return result(true, 'already-playing');
    if (!['ready', 'paused', 'start-pending'].includes(this.phase) || !this.buffer || !this.context || !this.gain) return result(false, 'not-ready');
    if (this.phase === 'start-pending' && policy.activation === 'automatic') return result(false, 'start-pending');
    const ticket = ++this.epoch; this.retire(); this.phase = 'start-pending'; this.audioPhase = 'start-pending';
    try {
      if (!this.commit()) throw Error('source-frame-not-committed');
      if (ticket !== this.epoch) return result(false, 'stale-frame-commit');
      await this.context.resume();
      if (ticket !== this.epoch) return result(false, 'stale-start');
      if (this.context.state !== 'running') throw Error('context-not-running');
      const now = this.context.currentTime;
      // Both future runs use the same native context anchor. Rendering ticks do
      // not start the second run, so background throttling cannot shift its cue.
      for (const slice of nmsL1P002AudioSlices(this.plan, this.position)) {
        const node = this.context.createBufferSource(); node.buffer = this.buffer; node.connect(this.gain); this.nodes.add(node);
        node.onended = () => {if (!this.nodes.delete(node)) return; node.onended = null; node.disconnect();};
        node.start(now + slice.delaySeconds, slice.firstDecodedSample / 22050, slice.durationSeconds);
      }
      this.anchor = {contextTime: now, seconds: this.position}; this.phase = 'playing'; this.audioPhase = 'playing'; this.failure = null;
      this.settle(); return result(true, 'source-runs-playing');
    } catch (error) {
      if (ticket !== this.epoch) return result(false, 'stale-start');
      this.retire(); this.phase = 'paused'; this.audioPhase = 'play-rejected'; this.failure = error instanceof Error ? error.message : String(error);
      return result(false, this.failure);
    }
  }

  pause() {
    this.settle();
    if (!['playing', 'start-pending'].includes(this.phase)) return result(false, 'not-playing');
    this.epoch++; this.retire(); this.phase = 'paused'; this.audioPhase = 'paused';
    if (this.commit()) return result(true, 'source-runs-held');
    this.phase = 'failed'; this.failure = 'paused-frame-not-committed'; return result(false, this.failure);
  }
  replay() {
    if (!['ready', 'paused', 'playing', 'start-pending', 'timeline-ended'].includes(this.phase)) return result(false, 'not-ready');
    this.epoch++; this.retire(); this.position = 0; this.phase = 'ready'; this.audioPhase = 'ready'; this.failure = null;
    if (this.commit()) return result(true, 'source-runs-replayed-and-held');
    this.phase = 'failed'; this.failure = 'replay-frame-not-committed'; return result(false, this.failure);
  }
  seekCandidateFrame(frame: number) {
    if (!Number.isSafeInteger(frame) || frame < 1 || frame > 985 || !['ready', 'paused', 'playing', 'start-pending', 'timeline-ended'].includes(this.phase)) return result(false, 'invalid-candidate-frame');
    this.epoch++; this.retire(); this.position = (frame - 1) / 12; this.phase = 'paused'; this.audioPhase = 'paused';
    if (this.commit()) return result(true, 'source-candidate-frame-held');
    this.phase = 'failed'; this.failure = 'inspected-frame-not-committed'; return result(false, this.failure);
  }
  setVolume(value: number) {
    if (!Number.isFinite(value) || value < 0 || value > 1 || this.phase === 'closed') return result(false, 'invalid-volume');
    this.volume = value; if (this.context) this.gain?.gain.setValueAtTime(value, this.context.currentTime); return result(true, 'volume-set');
  }
  async close() {
    if (this.phase === 'closed') return;
    this.epoch++; this.retire(); this.phase = 'closed'; this.audioPhase = 'closed'; this.buffer = undefined;
    this.context?.removeEventListener('statechange', this.contextChanged); this.gain?.disconnect();
    if (this.context && this.context.state !== 'closed') await this.context.close();
  }
}
