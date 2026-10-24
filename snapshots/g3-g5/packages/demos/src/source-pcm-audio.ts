import {LESSON_MANUAL_NARRATION_PCM, type NarrationPcmAsset} from './generated/lesson-manual-narration-pcm';
import {isSameOriginAssetSource} from './runtime';

/** The source clock consumes this small media interface. Native audio remains
 * supported for assets outside the source-bound PCM inventory. */
export interface SourceAudioMedia {
  readonly src: string;
  preload: string;
  readonly readyState: number;
  readonly error: {readonly code: number} | null;
  readonly paused: boolean;
  readonly duration: number;
  currentTime: number;
  volume: number;
  play(): Promise<void>;
  pause(): void;
  load(): void;
  addEventListener(type: string, listener: () => void, options?: {once?: boolean}): void;
  removeEventListener(type: string, listener: () => void): void;
  dispose?(): void;
  prepareForTimeline?(): Promise<void>;
}

let sharedContext: AudioContext | null = null;
const contextOwners = new Set<SourcePcmAudio>();
function acquire(owner: SourcePcmAudio) {
  if (!sharedContext || sharedContext.state === 'closed') sharedContext = new AudioContext();
  contextOwners.add(owner); return sharedContext;
}
function release(owner: SourcePcmAudio) {
  contextOwners.delete(owner);
  if (contextOwners.size || !sharedContext) return;
  const context = sharedContext; sharedContext = null;
  if (context.state !== 'closed') void context.close().catch(() => {});
}

/** A decoded source media player, not a teaching timer. Source placement,
 * frame seeking, pause and removal still arrive from the existing host clock. */
export class SourcePcmAudio extends EventTarget implements SourceAudioMedia {
  readonly kind = 'source-pcm';
  preload = 'auto';
  readyState = 0;
  error: {code: number} | null = null;
  paused = true;
  private seconds = 0;
  private level = 1;
  private startedAt = 0;
  private revision = 0;
  private disposed = false;
  private loading: Promise<void> | null = null;
  private abort: AbortController | null = null;
  private channels: Float32Array[] | null = null;
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private buffer: AudioBuffer | null = null;
  private node: AudioBufferSourceNode | null = null;
  constructor(readonly src: string, private readonly asset: NarrationPcmAsset) {super();}
  get duration() {return this.asset.frames / this.asset.sampleRate;}
  get currentTime() {return Math.min(this.duration, this.seconds + (!this.paused && this.context ? Math.max(0, this.context.currentTime - this.startedAt) : 0));}
  set currentTime(value: number) {
    if (!Number.isFinite(value) || value < 0) throw new RangeError('Invalid source media offset');
    const playing = !this.paused; this.pause(); this.seconds = Math.min(value, this.duration);
    if (playing) void this.play().catch(() => {});
  }
  get volume() {return this.level;}
  set volume(value: number) {this.level = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0; if (this.gain) this.gain.gain.value = this.level;}
  private emit(type: string) {if (!this.disposed) this.dispatchEvent(new Event(type));}
  private prepare() {
    if (this.loading) return this.loading;
    this.loading = (async () => {
      const asset = this.asset;
      if (!isSameOriginAssetSource(asset.source) || !/^[a-f0-9]{64}$/.test(asset.sha256)
        || ![1, 2].includes(asset.channels) || !Number.isSafeInteger(asset.frames) || asset.frames <= 0
        || !Number.isSafeInteger(asset.sampleRate) || asset.sampleRate < 4000 || asset.sampleRate > 96000) throw new Error('Invalid source PCM binding');
      this.abort = new AbortController();
      const response = await fetch(asset.source, {signal: this.abort.signal, redirect: 'error', credentials: 'same-origin'});
      if (!response.ok) throw new Error('Source PCM unavailable');
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength !== asset.frames * asset.channels * 4 || bytes.byteLength > 32 * 1024 * 1024) throw new Error('Invalid source PCM size');
      const sha = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
      if (sha !== asset.sha256) throw new Error('Source PCM integrity failure');
      if (this.disposed) return;
      const view = new DataView(bytes), channels = Array.from({length: asset.channels}, () => new Float32Array(asset.frames));
      for (let channel = 0; channel < asset.channels; channel++) for (let frame = 0; frame < asset.frames; frame++) {
        const sample = view.getFloat32((frame * asset.channels + channel) * 4, true);
        if (!Number.isFinite(sample)) throw new Error('Invalid PCM sample');
        channels[channel]![frame] = sample;
      }
      this.channels = channels; this.readyState = 4; this.emit('loadedmetadata'); this.emit('canplay');
    })().catch(error => {
      if (!this.disposed) {this.error = {code: 4}; this.emit('error');}
      throw error;
    });
    return this.loading;
  }
  load() {if (!this.disposed) void this.prepare().catch(() => {});}
  async prepareForTimeline() {
    const preparations: Promise<unknown>[] = [this.prepare()];
    if (typeof navigator !== 'undefined' && navigator.userActivation?.hasBeenActive) {
      this.context ??= acquire(this); preparations.push(this.context.resume());
    }
    await Promise.all(preparations);
  }
  async play() {
    if (this.disposed) throw new DOMException('Source media disposed', 'AbortError');
    if (!this.paused) return;
    const revision = ++this.revision;
    const context = this.context ?? (this.context = acquire(this));
    const resume = context.resume();
    // A page with no user activation exposes the existing manual retry. A
    // gesture-approved resume is asynchronous in Firefox/WebKit; wait for its
    // real result rather than treating a still-pending state as a refusal.
    if (context.state === 'suspended' && typeof navigator !== 'undefined' && navigator.userActivation?.hasBeenActive === false) {
      void resume.catch(() => {}); throw new DOMException('Audio requires a gesture', 'NotAllowedError');
    }
    await resume; await this.prepare();
    if (this.disposed || revision !== this.revision) throw new DOMException('Source media request cancelled', 'AbortError');
    // A source-clock seek at or beyond the decoded end is completion, not Replay.
    // Callers request a deliberate Replay by explicitly seeking to zero.
    if (this.seconds >= this.duration) {
      this.seconds = this.duration;
      this.emit('ended');
      return;
    }
    if (!this.buffer) {
      this.buffer = context.createBuffer(this.asset.channels, this.asset.frames, this.asset.sampleRate);
      this.channels!.forEach((samples, channel) => this.buffer!.getChannelData(channel).set(samples));
    }
    if (!this.gain) {this.gain = context.createGain(); this.gain.connect(context.destination);}
    this.gain.gain.value = this.level;
    const node = context.createBufferSource(); this.node = node; node.buffer = this.buffer; node.connect(this.gain);
    node.onended = () => {
      if (this.node !== node) return;
      this.node = null; node.disconnect(); this.seconds = this.duration; this.paused = true; this.emit('ended');
    };
    this.startedAt = context.currentTime; this.paused = false;
    node.start(this.startedAt, this.seconds, this.duration - this.seconds);
    this.emit('play'); this.emit('playing');
  }
  pause() {
    this.revision++;
    const seconds = this.currentTime, wasPlaying = !this.paused;
    const node = this.node; this.node = null;
    if (node) {node.onended = null; try {node.stop();} catch {} node.disconnect();}
    this.seconds = seconds; this.paused = true;
    if (wasPlaying) {this.emit('timeupdate'); this.emit('pause');}
  }
  dispose() {
    if (this.disposed) return;
    this.pause(); this.disposed = true; this.abort?.abort(); this.abort = null;
    this.gain?.disconnect(); this.gain = null; this.channels = null; this.buffer = null;
    if (this.context) release(this); this.context = null;
  }
}

export function createSourceAudioMedia(source: string, sha256?: string): SourceAudioMedia {
  const asset = sha256 ? LESSON_MANUAL_NARRATION_PCM[sha256] : undefined;
  return asset ? new SourcePcmAudio(source, asset) : new Audio(source);
}
