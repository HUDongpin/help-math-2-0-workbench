import {ALG_L12_GLOSSARY_PAIR_AUDIO,
  type AlgL12GlossaryPairAudioConfig} from './alg-l12-glossary-pair-audio-schedule';
import {loadVerifiedPairAudio, pairAudioOrigin} from './alg-l12-glossary-pair-audio-loader';

export type AlgL12GlossaryPairSpanishAudioSnapshot = Readonly<{
  phase: 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error' | 'closed';
  volume: number;
  error: string | null;
}>;
export interface AlgL12GlossaryPairSpanishAudioOptions {
  origin: string;
  onChange?: (snapshot: AlgL12GlossaryPairSpanishAudioSnapshot) => void;
  onEnded?: () => void;
  createContext?: () => AudioContext;
  fetch?: typeof globalThis.fetch;
}

/** Independent, explicit SA operation. A new start after pause begins at zero;
 * the host owns main-clock pause/return rules. No language/listening parity is
 * inferred from the SA filename or the available MP3. */
export class AlgL12GlossaryPairSpanishAudioController {
  private readonly config: AlgL12GlossaryPairAudioConfig;
  private readonly options: AlgL12GlossaryPairSpanishAudioOptions;
  private readonly origin: string;
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private buffer: AudioBuffer | null = null;
  private node: AudioBufferSourceNode | null = null;
  private abort: AbortController | null = null;
  private pending: Promise<boolean> | null = null;
  private closing: Promise<void> | null = null;
  private generation = 0;
  private resumeReady = false;
  private phase: AlgL12GlossaryPairSpanishAudioSnapshot['phase'] = 'idle';
  private volume = 1;
  private error: string | null = null;

  constructor(config: AlgL12GlossaryPairAudioConfig,
    options: AlgL12GlossaryPairSpanishAudioOptions) {
    if (!Object.values(ALG_L12_GLOSSARY_PAIR_AUDIO).some(page => page === config))
      throw Error('PAIR_SA_CONFIG');
    this.origin = pairAudioOrigin(options.origin);
    this.config = config;
    this.options = {...options};
  }

  private readonly contextStateChanged = (): void => {
    if (this.context?.state !== 'running' &&
      (this.phase === 'playing' || (this.phase === 'loading' && this.resumeReady))) this.pause();
  };

  private changed(phase: AlgL12GlossaryPairSpanishAudioSnapshot['phase']): void {
    this.phase = phase;
    this.options.onChange?.({phase, volume: this.volume, error: this.error});
  }

  snapshot(): AlgL12GlossaryPairSpanishAudioSnapshot {
    this.contextStateChanged();
    return {phase: this.phase, volume: this.volume, error: this.error};
  }

  private dispose(node: AudioBufferSourceNode, stop: boolean): void {
    node.onended = null;
    try {if (stop) node.stop();} catch { /* Already stopped or never started. */ }
    try {node.disconnect();} catch { /* Context remains owned. */ }
  }

  private cancel(): void {
    this.generation++;
    this.abort?.abort(); this.abort = null;
    this.pending = null;
    this.resumeReady = false;
    const node = this.node; this.node = null;
    if (node) this.dispose(node, true);
  }

  pause(): void {
    if (this.phase !== 'loading' && this.phase !== 'playing') return;
    this.cancel();
    this.changed('paused');
  }

  stop(): void {
    if (this.phase === 'closed') return;
    this.cancel();
    this.buffer = null;
    this.error = null;
    this.changed('idle');
  }

  setVolume(volume: number): void {
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) throw Error('PAIR_SA_VOLUME');
    if (this.phase === 'closed') throw Error('PAIR_SA_CLOSED');
    this.volume = volume;
    if (this.gain) this.gain.gain.value = volume;
    this.changed(this.phase);
  }

  private ensureContext(): AudioContext {
    if (this.context) {
      if (this.context.state === 'closed') throw Error('PAIR_SA_CONTEXT_CLOSED');
      return this.context;
    }
    const context = this.options.createContext?.() ?? new AudioContext({sampleRate: this.config.saSampleRate});
    try {
      if (context.sampleRate !== this.config.saSampleRate || context.state === 'closed')
        throw Error('PAIR_SA_CONTEXT_RATE');
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

  start(): Promise<boolean> {
    if (this.phase === 'closed') return Promise.resolve(false);
    this.contextStateChanged();
    if (this.phase === 'playing') return Promise.resolve(true);
    if (this.pending) return this.pending;
    this.cancel();
    this.error = null;
    const ticket = this.generation;
    const current = () => this.phase !== 'closed' && this.generation === ticket;
    const abort = new AbortController(); this.abort = abort;
    const pending = (async (): Promise<boolean> => {
      try {
        const context = this.ensureContext();
        this.resumeReady = false;
        this.changed('loading');
        // Explicit start calls resume before the first await.
        await context.resume();
        if (!current()) return false;
        if (context.state !== 'running') throw Error('PAIR_SA_CONTEXT_NOT_RUNNING');
        this.resumeReady = true;
        const decoded = this.buffer ?? await loadVerifiedPairAudio({path: this.config.saUrl,
          sha256: this.config.saSha256, bytes: this.config.saBytes,
          sampleRate: this.config.saSampleRate, channels: this.config.saChannels,
          decodedSamples: this.config.saDecodedSamples},
        this.origin, context, abort.signal, current, this.options.fetch);
        if (!current() || !decoded) return false;
        if (context.state !== 'running') {this.pause(); return false;}
        this.buffer = decoded;
        const node = context.createBufferSource();
        node.buffer = decoded; node.loop = false;
        try {node.connect(this.gain!); node.start(context.currentTime, 0);}
        catch (error) {this.dispose(node, true); throw error;}
        if (!current()) {this.dispose(node, true); return false;}
        this.node = node;
        node.onended = () => {
          if (!current() || this.node !== node || context.state !== 'running') return;
          this.node = null;
          this.dispose(node, false);
          this.buffer = null;
          this.changed('ended');
          this.options.onEnded?.();
        };
        this.changed('playing');
        return true;
      } catch (error) {
        if (!current()) return false;
        abort.abort();
        const message = error instanceof Error ? error.message : '';
        this.error = /^(PAIR_AUDIO|PAIR_SA)_[A-Z_]+$/.test(message) ? message : 'PAIR_SA_LOAD';
        this.changed('error');
        return false;
      } finally {
        if (current()) {
          this.abort = null;
          this.resumeReady = false;
          this.pending = null;
        }
      }
    })();
    this.pending = pending;
    void pending.then(() => {if (current() && this.pending === pending) this.pending = null;});
    return pending;
  }

  close(): Promise<void> {
    if (this.closing) return this.closing;
    this.cancel();
    this.buffer = null;
    this.context?.removeEventListener('statechange', this.contextStateChanged);
    try {this.gain?.disconnect();} catch { /* Context closes next. */ }
    this.changed('closed');
    this.closing = this.context?.close() ?? Promise.resolve();
    return this.closing;
  }
}
