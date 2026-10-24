import {bindTechnicalOwner, type TechnicalOwner} from './technical-observation-v1';
import {resolveMeasuredSourceDecoderProfile} from './measured-source-decoder-profiles-v1';
/**
 * Browser transport for one measured, hash-bound decoded source stream.
 * Positions are fractional decoded samples. This module does not infer an
 * SWF-frame mapping, apply MP3 latency, or turn buffer EOF into lesson completion.
 */
export interface DecodedSourceStreamBinding {
  readonly sourceSha256: string;
  readonly sourceBytes: number;
  readonly sampleRate: number;
  readonly channels: 1 | 2;
  readonly decodedSamples: number;
  readonly pcmSha256: string;
}

export type DecodedStreamPhase = 'idle' | 'loading' | 'ready' | 'start-pending' |
  'playing' | 'paused' | 'interrupted' | 'play-rejected' | 'buffer-ended' |
  'boundary-held' | 'failed' | 'closed';

export interface DecodedStreamSnapshot {
  readonly phase: DecodedStreamPhase;
  readonly epoch: number;
  readonly decodedSample: number;
  readonly contextTime: number | null;
  readonly heldContextTime: number | null;
  readonly playbackAnchor: Readonly<{contextTime: number; decodedSample: number}> | null;
  readonly elapsedMs: number;
  readonly volume: number;
  readonly failure: string | null;
  readonly sourceAlignment: 'unresolved';
  readonly lessonCompleted: false;
}

export interface DecodedStreamResult {
  readonly accepted: boolean;
  readonly reason: string;
}

interface ActiveSource {
  readonly node: AudioBufferSourceNode;
  readonly epoch: number;
  readonly startTime: number;
  readonly scheduledAt: number;
  readonly startSample: number;
}

const hashPattern = /^[a-f0-9]{64}$/u;
const result = (accepted: boolean, reason: string): DecodedStreamResult =>
  Object.freeze({accepted, reason});

async function sha256(bytes: ArrayBuffer, owner?: TechnicalOwner|null): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bindTechnicalOwner(bytes, owner));
  return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
}

async function pcmHash(buffer: AudioBuffer, owner?: TechnicalOwner|null): Promise<string> {
  // Channel-major Float32 LE preserves the established mono digest and binds
  // both stereo channels without downmixing or replacing the decoded buffer.
  const bytes = new ArrayBuffer(buffer.length * buffer.numberOfChannels * 4);
  const view = new DataView(bytes);
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const samples = buffer.getChannelData(channel);
    if (samples.length !== buffer.length) throw new Error('decoded-channel-length-mismatch');
    for (let index = 0; index < samples.length; index++) {
      if (!Number.isFinite(samples[index])) throw new Error('nonfinite-decoded-sample');
      view.setFloat32((channel * buffer.length + index) * 4, samples[index], true);
    }
  }
  return sha256(bytes, owner);
}

export class DecodedSourceStreamTransport {
  private readonly binding: DecodedSourceStreamBinding;
  private readonly createContext: () => AudioContext;
  private readonly technicalOwner?: () => TechnicalOwner|null;
  private readonly listeners = new Set<() => void>();
  private context: AudioContext | undefined;
  private gain: GainNode | undefined;
  private buffer: AudioBuffer | undefined;
  private active: ActiveSource | undefined;
  private phase: DecodedStreamPhase = 'idle';
  private epoch = 0;
  private cursor = 0;
  private volume = 1;
  private failure: string | null = null;
  private heldContextTime: number | null = null;

  constructor(binding: DecodedSourceStreamBinding, options: {
    readonly createContext?: () => AudioContext;
    readonly technicalOwner?: () => TechnicalOwner|null;
  } = {}) {
    if (!hashPattern.test(binding.sourceSha256) || !hashPattern.test(binding.pcmSha256) ||
      !Number.isSafeInteger(binding.sourceBytes) || binding.sourceBytes <= 0 ||
      !Number.isSafeInteger(binding.sampleRate) || binding.sampleRate < 8000 || binding.sampleRate > 96000 ||
      !Number.isSafeInteger(binding.decodedSamples) || binding.decodedSamples <= 0 || ![1, 2].includes(binding.channels)) {
      throw new Error('invalid-decoded-source-binding');
    }
    this.binding = Object.freeze({...resolveMeasuredSourceDecoderProfile(binding)});
    this.technicalOwner = options.technicalOwner;
    this.createContext = options.createContext ?? (() =>
      new AudioContext({sampleRate: binding.sampleRate, latencyHint: 'interactive'}));
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {this.listeners.delete(listener);};
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  private sampleNow(contextTime = this.context?.currentTime): number {
    if (!this.active || !this.context) return this.cursor;
    const delta = contextTime! - this.active.startTime;
    if (!Number.isFinite(delta) || contextTime! < this.active.scheduledAt) throw new Error('invalid-audio-clock');
    return Math.min(this.binding.decodedSamples,
      this.active.startSample + Math.max(0, delta) * this.binding.sampleRate);
  }

  snapshot(): DecodedStreamSnapshot {
    const contextTime = this.context?.currentTime ?? null;
    const decodedSample = this.sampleNow(contextTime ?? undefined);
    return Object.freeze({phase: this.phase, epoch: this.epoch, decodedSample,
      contextTime, heldContextTime: this.heldContextTime, playbackAnchor: this.active ? Object.freeze({contextTime: this.active.startTime, decodedSample: this.active.startSample}) : null,
      elapsedMs: decodedSample / this.binding.sampleRate * 1000,
      volume: this.volume, failure: this.failure,
      sourceAlignment: 'unresolved', lessonCompleted: false});
  }

  private retireSource(): void {
    const active = this.active;
    this.active = undefined;
    if (!active) return;
    active.node.onended = null;
    try {active.node.stop();} finally {active.node.disconnect();}
  }

  private invalidate(): number {
    const now=this.context?.currentTime ?? null;
    this.cursor = this.sampleNow(now ?? undefined);
    this.heldContextTime=now;
    this.epoch++;
    this.retireSource();
    return this.epoch;
  }

  private readonly contextStateChanged = (): void => {
    if (!this.context || this.phase === 'closed') return;
    if (this.context.state === 'closed') {
      this.invalidate();
      this.phase = 'closed';
      this.buffer = undefined;
      this.gain?.disconnect();
      this.context.removeEventListener('statechange', this.contextStateChanged);
      this.emit();
      this.listeners.clear();
    } else if (this.phase === 'playing' && this.context.state !== 'running') {
      this.invalidate();
      this.phase = 'interrupted';
      this.emit();
    }
  };

  /** The delivery layer supplies bounded bytes; no fetch or URL is owned here. */
  async prepare(source: ArrayBuffer): Promise<DecodedStreamResult> {
    if (this.phase === 'closed') return result(false, 'closed');
    const technicalOwner = this.technicalOwner?.();
    const ticket = this.invalidate();
    this.cursor = 0;
    this.buffer = undefined;
    this.failure = null;
    this.phase = 'loading';
    this.emit();
    // Clone before the first await so the caller cannot change an admitted input.
    const bytes = source.slice(0);
    try {
      if (bytes.byteLength !== this.binding.sourceBytes || await sha256(bytes, technicalOwner) !== this.binding.sourceSha256)
        throw new Error('source-byte-identity-mismatch');
      if (ticket !== this.epoch || this.phase !== 'loading') return result(false, 'stale-load');
      if (!this.context) {
        this.context = this.createContext();
        this.context.addEventListener('statechange', this.contextStateChanged);
        this.gain = this.context.createGain();
        this.gain.gain.setValueAtTime(this.volume, this.context.currentTime);
        this.gain.connect(this.context.destination);
      }
      if (this.context.sampleRate !== this.binding.sampleRate) throw new Error('context-sample-rate-mismatch');
      const decoded = await bindTechnicalOwner(this.context, technicalOwner).decodeAudioData(bytes);
      if (ticket !== this.epoch || this.phase !== 'loading') return result(false, 'stale-load');
      if (decoded.sampleRate !== this.binding.sampleRate || decoded.numberOfChannels !== this.binding.channels ||
        decoded.length !== this.binding.decodedSamples || await pcmHash(decoded, technicalOwner) !== this.binding.pcmSha256)
        throw new Error('decoded-buffer-identity-mismatch');
      if (ticket !== this.epoch || this.phase !== 'loading') return result(false, 'stale-load');
      this.buffer = decoded;
      this.phase = 'ready';
      this.emit();
      return result(true, 'ready');
    } catch (error) {
      if (ticket !== this.epoch || this.phase !== 'loading') return result(false, 'stale-load');
      this.phase = 'failed';
      this.failure = error instanceof Error ? error.message : 'decode-failed';
      this.emit();
      return result(false, this.failure);
    }
  }

  /** Call directly from a user activation when an automatic resume is blocked. */
  async play(options: {readonly activation: 'automatic' | 'user'; readonly reducedMotion: boolean; readonly delaySeconds?: number}): Promise<DecodedStreamResult> {
    const delaySeconds=options.delaySeconds===undefined?0:options.delaySeconds;
    if (!['automatic', 'user'].includes(options.activation) || typeof options.reducedMotion !== 'boolean'||!Number.isFinite(delaySeconds)||delaySeconds<0)
      return result(false, 'invalid-play-policy');
    if (options.reducedMotion && options.activation === 'automatic') return result(false, 'reduced-motion-hold');
    if (this.phase === 'playing') return result(true, 'already-playing');
    if (!this.buffer || !this.context || !this.gain ||
      !['ready', 'paused', 'interrupted', 'play-rejected', 'start-pending'].includes(this.phase))
      return result(false, 'not-ready-for-play');
    if (this.phase === 'start-pending' && options.activation === 'automatic') return result(false, 'start-pending');
    const technicalOwner = this.technicalOwner?.();
    const ticket = ++this.epoch;
    this.phase = 'start-pending';
    this.failure = null;
    this.emit();
    try {
      // Calling resume before awaiting anything preserves the actual gesture.
      await bindTechnicalOwner(this.context, technicalOwner).resume();
      if (ticket !== this.epoch || this.phase !== 'start-pending') return result(false, 'stale-start');
      if (this.context.state !== 'running') throw new Error('context-not-running');
      const scheduledAt=this.context.currentTime,startTime=scheduledAt+delaySeconds;
      if(!Number.isFinite(startTime))throw new Error('invalid-audio-schedule');
      const node = bindTechnicalOwner(this.context.createBufferSource(), technicalOwner);
      node.buffer = this.buffer;
      node.connect(this.gain);
      const active = {node, epoch: ticket, scheduledAt, startTime, startSample: this.cursor};
      this.heldContextTime=null;
      node.onended = () => {
        if (this.active !== active || this.epoch !== ticket || this.phase !== 'playing') return;
        this.cursor = this.binding.decodedSamples;
        this.active = undefined;
        node.onended = null;
        node.disconnect();
        this.phase = 'buffer-ended';
        this.emit();
      };
      try {
        node.start(active.startTime, this.cursor / this.binding.sampleRate);
      } catch (error) {
        node.onended = null;
        node.disconnect();
        throw error;
      }
      this.active = active;
      this.phase = 'playing';
      this.emit();
      return result(true, 'playing');
    } catch (error) {
      if (ticket !== this.epoch || this.phase !== 'start-pending') return result(false, 'stale-start');
      this.retireSource();
      this.phase = 'play-rejected';
      this.failure = error instanceof Error ? error.message : 'play-rejected';
      this.emit();
      return result(false, this.failure);
    }
  }

  pause(): DecodedStreamResult {
    if (!['playing', 'start-pending'].includes(this.phase)) return result(false, 'not-playing');
    this.invalidate();
    this.phase = 'paused';
    this.emit();
    return result(true, 'paused');
  }

  /** Explicit decoder-coordinate seeking; never a guessed SWF-frame seek. */
  seekDecodedSample(sample: number): DecodedStreamResult {
    if (!this.buffer || this.phase === 'closed' || !Number.isFinite(sample) || sample < 0 || sample > this.binding.decodedSamples)
      return result(false, 'invalid-decoder-seek');
    this.invalidate();
    this.cursor = sample;
    this.phase = sample === this.binding.decodedSamples ? 'buffer-ended' : 'paused';
    this.emit();
    return result(true, 'seeked-and-held');
  }

  holdSourceBoundary(): DecodedStreamResult {
    if (this.phase === 'closed') return result(false, 'closed');
    this.invalidate();
    this.phase = 'boundary-held';
    this.emit();
    return result(true, 'source-boundary-held');
  }

  replay(): DecodedStreamResult {
    if (this.phase === 'closed') return result(false, 'closed');
    this.invalidate();
    this.cursor = 0;
    this.failure = null;
    this.phase = this.buffer ? 'ready' : 'idle';
    this.emit();
    return result(true, 'replayed-without-autostart');
  }

  setVolume(volume: number): DecodedStreamResult {
    if (this.phase === 'closed' || !Number.isFinite(volume) || volume < 0 || volume > 1) return result(false, 'invalid-volume');
    this.volume = volume;
    this.gain?.gain.setValueAtTime(volume, this.context!.currentTime);
    this.emit();
    return result(true, 'volume-set');
  }

  async close(): Promise<void> {
    if (this.phase === 'closed') return;
    this.invalidate();
    this.phase = 'closed';
    this.buffer = undefined;
    this.gain?.disconnect();
    this.context?.removeEventListener('statechange', this.contextStateChanged);
    this.emit();
    this.listeners.clear();
    if (this.context && this.context.state !== 'closed') await this.context.close();
  }
}
