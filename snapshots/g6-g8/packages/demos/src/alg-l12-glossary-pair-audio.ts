import {ALG_L12_GLOSSARY_PAIR_AUDIO, pairFrameToTimelineSample,
  pairTimelineSampleToFrame, type AlgL12GlossaryPairAudioConfig} from './alg-l12-glossary-pair-audio-schedule';
import {loadVerifiedPairAudio, pairAudioOrigin} from './alg-l12-glossary-pair-audio-loader';

export type AlgL12GlossaryPairAudioSnapshot = Readonly<{
  phase: 'paused' | 'loading' | 'playing' | 'ended' | 'error' | 'closed';
  timelineSample: number;
  frame: number;
  volume: number;
  error: string | null;
}>;
export interface AlgL12GlossaryPairAudioOptions {
  origin: string;
  onChange?: (snapshot: AlgL12GlossaryPairAudioSnapshot) => void;
  createContext?: () => AudioContext;
  fetch?: typeof globalThis.fetch;
}

/** One pair-configured embedded stream, played whole without MP3 seek trim.
 * Source visual frame clock continues through postroll after decoder EOF.
 * This is a modern playback candidate, not a SWF streaming emulator. */
export class AlgL12GlossaryPairAudioController {
  private readonly config: AlgL12GlossaryPairAudioConfig;
  private readonly options: AlgL12GlossaryPairAudioOptions;
  private readonly origin: string;
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private buffer: AudioBuffer | null = null;
  private node: AudioBufferSourceNode | null = null;
  private abort: AbortController | null = null;
  private pending: Promise<boolean> | null = null;
  private closing: Promise<void> | null = null;
  private generation = 0;
  private loading = false;
  private resumeReady = false;
  private closed = false;
  private sample = 0;
  private anchorTime: number | null = null;
  private anchorSample = 0;
  private volume = 0;
  private error: string | null = null;

  constructor(config: AlgL12GlossaryPairAudioConfig, options: AlgL12GlossaryPairAudioOptions) {
    if (!Object.values(ALG_L12_GLOSSARY_PAIR_AUDIO).includes(config)) throw Error('PAIR_AUDIO_CONFIG');
    this.origin = pairAudioOrigin(options.origin);
    this.config = config;
    this.options = {...options};
  }

  private readonly contextStateChanged = (): void => {
    if (!this.closed && this.context?.state !== 'running' &&
      (this.anchorTime !== null || (this.loading && this.resumeReady))) this.pause();
  };

  private position(): number {
    if (this.anchorTime === null || !this.context) return this.sample;
    return Math.min(this.config.terminalTimelineSample, this.anchorSample +
      Math.max(0, this.context.currentTime - this.anchorTime) * this.config.sampleRate);
  }

  private rawSnapshot(): AlgL12GlossaryPairAudioSnapshot {
    const timelineSample = this.position();
    const phase = this.closed ? 'closed' : this.loading ? 'loading' : this.error ? 'error' :
      timelineSample === this.config.terminalTimelineSample ? 'ended' :
      this.anchorTime !== null ? 'playing' : 'paused';
    return {phase, timelineSample,
      frame: pairTimelineSampleToFrame(this.config, timelineSample), volume: this.volume, error: this.error};
  }

  private emit(): void { this.options.onChange?.(this.rawSnapshot()); }

  private dispose(node: AudioBufferSourceNode, stop: boolean): void {
    node.onended = null;
    try { if (stop) node.stop(); } catch { /* Already ended or never started. */ }
    try { node.disconnect(); } catch { /* Owned context still closes. */ }
  }

  private detach(): void {
    const node = this.node;
    this.node = null;
    if (node) this.dispose(node, true);
    this.anchorTime = null;
  }

  private finishAtEnd(): void {
    if (this.anchorTime !== null && this.position() >= this.config.terminalTimelineSample) {
      this.sample = this.config.terminalTimelineSample;
      this.detach();
      this.emit();
    }
  }

  snapshot(): AlgL12GlossaryPairAudioSnapshot {
    this.contextStateChanged();
    this.finishAtEnd();
    return this.rawSnapshot();
  }

  pause(): void {
    if (this.closed) return;
    this.sample = this.position();
    this.generation++;
    this.abort?.abort(); this.abort = null;
    this.pending = null;
    this.loading = false;
    this.resumeReady = false;
    this.detach();
    this.emit();
  }

  seekFrame(frame: number): void {
    const sample = pairFrameToTimelineSample(this.config, frame);
    if (this.closed) throw Error('PAIR_AUDIO_CLOSED');
    this.pause();
    this.error = null;
    this.sample = sample;
    this.emit();
  }

  reset(): void { this.seekFrame(1); }

  setVolume(volume: number): void {
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) throw Error('PAIR_AUDIO_VOLUME');
    if (this.closed) throw Error('PAIR_AUDIO_CLOSED');
    this.volume = volume;
    if (this.gain) this.gain.gain.value = volume;
    this.emit();
  }

  private ensureContext(): AudioContext {
    if (this.context) {
      if (this.context.state === 'closed') throw Error('PAIR_AUDIO_CONTEXT_CLOSED');
      return this.context;
    }
    const context = this.options.createContext?.() ?? new AudioContext({sampleRate: this.config.sampleRate});
    try {
      if (context.sampleRate !== this.config.sampleRate || context.state === 'closed')
        throw Error('PAIR_AUDIO_CONTEXT_RATE');
      const gain = context.createGain();
      gain.gain.value = this.volume;
      gain.connect(context.destination);
      context.addEventListener('statechange', this.contextStateChanged);
      this.context = context;
      this.gain = gain;
      return context;
    } catch (error) {
      void context.close().catch(() => {});
      throw error;
    }
  }

  play(): Promise<boolean> {
    if (this.closed) return Promise.resolve(false);
    this.contextStateChanged();
    this.finishAtEnd();
    if (this.anchorTime !== null) return Promise.resolve(true);
    if (this.pending) return this.pending;
    if (this.sample === this.config.terminalTimelineSample) return Promise.resolve(false);
    this.error = null;
    const ticket = ++this.generation;
    const current = () => !this.closed && this.generation === ticket;
    const abort = new AbortController(); this.abort = abort;
    this.loading = true;
    this.resumeReady = false;
    const pending = (async (): Promise<boolean> => {
      try {
        const context = this.ensureContext();
        // Called before the first await from the explicit Play gesture.
        await context.resume();
        if (!current()) return false;
        if (context.state !== 'running') throw Error('PAIR_AUDIO_CONTEXT_NOT_RUNNING');
        this.resumeReady = true;
        const buffer = this.buffer ?? await loadVerifiedPairAudio({path: this.config.mainUrl,
          sha256: this.config.mainSha256, bytes: this.config.mainBytes,
          sampleRate: this.config.sampleRate, channels: this.config.channels,
          decodedSamples: this.config.mainDecodedSamples},
        this.origin, context, abort.signal, current, this.options.fetch);
        if (!current() || !buffer) return false;
        this.buffer = buffer;
        if (context.state !== 'running') { this.pause(); return false; }
        const anchor = context.currentTime;
        const timelineStart = Math.max(this.sample, this.config.timelineStartSample);
        const sourceStart = timelineStart - this.config.timelineStartSample;
        if (sourceStart < this.config.sourceEndSample) {
          const node = context.createBufferSource();
          node.buffer = buffer; node.loop = false;
          try {
            node.connect(this.gain!);
            node.start(anchor + (timelineStart - this.sample) / this.config.sampleRate,
              sourceStart / this.config.sampleRate,
              (this.config.sourceEndSample - sourceStart) / this.config.sampleRate);
          } catch (error) {this.dispose(node, true); throw error;}
          if (!current()) {this.dispose(node, true); return false;}
          this.node = node;
          node.onended = () => {
            if (!current() || this.node !== node) return;
            this.node = null;
            this.dispose(node, false);
            this.emit();
          };
        }
        this.anchorSample = this.sample;
        this.anchorTime = anchor;
        this.emit();
        return true;
      } catch (error) {
        if (!current()) return false;
        abort.abort();
        this.detach();
        const message = error instanceof Error ? error.message : '';
        this.error = /^PAIR_AUDIO_[A-Z_]+$/.test(message) ? message : 'PAIR_AUDIO_LOAD';
        this.emit();
        return false;
      } finally {
        if (current()) {
          this.loading = false;
          this.resumeReady = false;
          this.abort = null;
          this.pending = null;
          this.emit();
        }
      }
    })();
    this.pending = pending;
    void pending.then(() => {if (current() && this.pending === pending) this.pending = null;});
    this.emit();
    return pending;
  }

  replay(): Promise<boolean> {
    if (this.closed) return Promise.resolve(false);
    this.reset();
    return this.play();
  }

  close(): Promise<void> {
    if (this.closing) return this.closing;
    this.pause();
    this.closed = true;
    this.context?.removeEventListener('statechange', this.contextStateChanged);
    try {this.gain?.disconnect();} catch { /* Closing the owned context releases its graph. */ }
    this.closing = this.context?.close() ?? Promise.resolve();
    this.emit();
    return this.closing;
  }
}
