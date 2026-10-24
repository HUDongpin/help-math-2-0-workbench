import {frameToP010TimelineSample, P010_AUDIO_SCHEDULE as schedule,
  P010_AUDIO_SOURCE as source, p010TimelineSampleToFrame} from './alg-l12-p010-audio-schedule';

export const P010_AUDIO_URL = `/flash-assets/g678-local/shared-alg001-l12-p010/source-audio.mp3?sha256=${source.sha256}`;
export interface P010EmbeddedAudioOptions {
  origin: string;
  createContext?: () => AudioContext;
  fetch?: typeof globalThis.fetch;
}
export interface P010EmbeddedAudioSnapshot {
  phase: 'paused' | 'loading' | 'playing' | 'ended' | 'error' | 'closed';
  timelineSample: number;
  frame: number;
  volume: number;
  error: string | null;
}

/** Owns one lazy context and one continuous source. The host reads this clock.
 * Only an explicit Play/Replay caller may start loading and resume the context.
 * Technical playback is a candidate, not Flash/audio/listening acceptance.
 */
export class P010EmbeddedAudioController {
  private readonly url: string;
  private readonly options: P010EmbeddedAudioOptions;
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private buffer: AudioBuffer | null = null;
  private readonly nodes = new Set<AudioBufferSourceNode>();
  private generation = 0;
  private loading = false;
  private resumeReady = false;
  private closed = false;
  private sample = 0;
  private anchorTime: number | null = null;
  private anchorSample = 0;
  private volume = 0;
  private error: string | null = null;
  private abort: AbortController | null = null;
  private pending: Promise<boolean> | null = null;
  private closing: Promise<void> | null = null;
  private readonly reconcileContext = () => {
    if (!this.closed && this.context?.state !== 'running' &&
      (this.anchorTime !== null || (this.loading && this.resumeReady))) this.pause();
  };

  constructor(options: P010EmbeddedAudioOptions) {
    const origin = new URL(options.origin);
    if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== options.origin ||
      origin.username || origin.password) throw Error('P010_AUDIO_ORIGIN');
    this.options = {...options};
    this.url = new URL(P010_AUDIO_URL, origin).href;
  }

  private position(): number {
    if (this.anchorTime === null || !this.context) return this.sample;
    return Math.min(schedule.terminalTimelineSample, this.anchorSample +
      Math.max(0, this.context.currentTime - this.anchorTime) * source.sampleRate);
  }

  private dispose(node: AudioBufferSourceNode, stop: boolean): void {
    node.onended = null;
    try { if (stop) node.stop(); } catch { /* Already ended or never started. */ }
    try { node.disconnect(); } catch { /* Detached nodes must not block cleanup. */ }
  }

  private detach(): void {
    for (const node of this.nodes) this.dispose(node, true);
    this.nodes.clear();
    this.anchorTime = null;
  }

  private finishAtEnd(): void {
    if (this.anchorTime !== null && this.position() >= schedule.terminalTimelineSample) {
      this.sample = schedule.terminalTimelineSample;
      this.detach();
    }
  }

  snapshot(): P010EmbeddedAudioSnapshot {
    this.reconcileContext();
    this.finishAtEnd();
    const timelineSample = this.position();
    const phase = this.closed ? 'closed' : this.loading ? 'loading' : this.error ? 'error' :
      timelineSample === schedule.terminalTimelineSample ? 'ended' :
      this.anchorTime !== null ? 'playing' : 'paused';
    return {phase, timelineSample, frame: p010TimelineSampleToFrame(timelineSample), volume: this.volume, error: this.error};
  }

  pause(): void {
    if (this.closed) return;
    this.sample = this.position();
    this.generation++;
    this.abort?.abort();
    this.abort = null;
    this.pending = null;
    this.loading = false;
    this.resumeReady = false;
    this.detach();
  }

  seekFrame(frame: number): void {
    const sample = frameToP010TimelineSample(frame);
    if (this.closed) throw Error('P010_AUDIO_CLOSED');
    this.pause();
    this.error = null;
    this.sample = sample;
  }

  reset(): void { this.seekFrame(1); }

  setVolume(volume: number): void {
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) throw Error('P010_AUDIO_VOLUME');
    if (this.closed) throw Error('P010_AUDIO_CLOSED');
    this.volume = volume;
    if (this.gain) this.gain.gain.value = volume;
  }

  private ensureContext(): AudioContext {
    if (this.context) {
      if (this.context.state === 'closed') throw Error('P010_AUDIO_CONTEXT_CLOSED');
      return this.context;
    }
    const context = this.options.createContext?.() ?? new AudioContext({sampleRate: source.sampleRate});
    try {
      if (context.sampleRate !== source.sampleRate || context.state === 'closed')
        throw Error('P010_AUDIO_CONTEXT_RATE');
      const gain = context.createGain();
      gain.gain.value = this.volume;
      gain.connect(context.destination);
      this.gain = gain;
      this.context = context;
      context.addEventListener('statechange', this.reconcileContext);
      return context;
    } catch (error) {
      void context.close().catch(() => {});
      throw error;
    }
  }

  private async load(context: AudioContext, signal: AbortSignal,
    current: () => boolean): Promise<AudioBuffer | null> {
    if (this.buffer) return this.buffer;
    const response = await (this.options.fetch ?? globalThis.fetch)(this.url, {
      signal, mode: 'same-origin', credentials: 'same-origin', redirect: 'error', cache: 'no-store',
    });
    if (!current()) return null;
    if (response.status !== 200 || response.redirected || response.url !== this.url ||
      response.type === 'opaque' || response.type === 'opaqueredirect' ||
      response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'audio/mpeg')
      throw Error('P010_AUDIO_RESPONSE');
    const length = response.headers.get('content-length');
    if (length !== null && length !== String(source.bytes)) throw Error('P010_AUDIO_BYTES');
    if (!response.body) throw Error('P010_AUDIO_BODY');
    const reader = response.body.getReader();
    const encoded = new Uint8Array(source.bytes);
    let offset = 0;
    try {
      while (true) {
        const {done, value} = await reader.read();
        if (!current()) { await reader.cancel(); return null; }
        if (done) break;
        if (value.byteLength > source.bytes - offset) throw Error('P010_AUDIO_BYTES');
        encoded.set(value, offset);
        offset += value.byteLength;
      }
    } catch (error) {
      await reader.cancel().catch(() => {});
      throw error;
    } finally { reader.releaseLock(); }
    if (offset !== source.bytes) throw Error('P010_AUDIO_BYTES');
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', encoded))]
      .map(byte => byte.toString(16).padStart(2, '0')).join('');
    if (!current()) return null;
    if (hash !== source.sha256) throw Error('P010_AUDIO_HASH');
    const decoded = await context.decodeAudioData(encoded.buffer);
    if (!current()) return null;
    if (decoded?.sampleRate !== source.sampleRate || decoded.numberOfChannels !== source.numberOfChannels ||
      decoded.length !== source.decodedSamples) throw Error('P010_AUDIO_DECODE');
    const channel = decoded.getChannelData(0);
    if (channel.length !== source.decodedSamples || !channel.every(Number.isFinite))
      throw Error('P010_AUDIO_DECODE');
    this.buffer = decoded;
    return decoded;
  }

  play(): Promise<boolean> {
    if (this.closed) return Promise.resolve(false);
    this.reconcileContext();
    this.finishAtEnd();
    if (this.anchorTime !== null) return Promise.resolve(true);
    if (this.pending) return this.pending;
    if (this.sample === schedule.terminalTimelineSample) return Promise.resolve(false);
    this.error = null;
    const generation = ++this.generation;
    const current = () => !this.closed && this.generation === generation;
    const abort = new AbortController();
    this.abort = abort;
    this.loading = true;
    this.resumeReady = false;
    const pending = (async (): Promise<boolean> => {
      try {
        const context = this.ensureContext();
        // Called before the first await, preserving the explicit caller's gesture.
        await context.resume();
        if (!current()) return false;
        if (context.state !== 'running') throw Error('P010_AUDIO_CONTEXT_NOT_RUNNING');
        this.resumeReady = true;
        const buffer = await this.load(context, abort.signal, current);
        if (!current() || !buffer) return false;
        if (context.state !== 'running') { this.pause(); return false; }
        const anchor = context.currentTime;
        const timelineStart = Math.max(this.sample, schedule.timelineStartSample);
        const sourceStart = schedule.sourceStartSample + timelineStart - schedule.timelineStartSample;
        if (sourceStart < schedule.sourceEndSample) {
          const node = context.createBufferSource();
          node.buffer = buffer;
          node.loop = false;
          try {
            node.connect(this.gain!);
            node.start(anchor + (timelineStart - this.sample) / source.sampleRate,
              sourceStart / source.sampleRate, (schedule.sourceEndSample - sourceStart) / source.sampleRate);
          } catch (error) { this.dispose(node, true); throw error; }
          if (!current()) { this.dispose(node, true); return false; }
          this.nodes.add(node);
          node.onended = () => {
            if (!current() || !this.nodes.delete(node)) return;
            this.dispose(node, false);
          };
        }
        this.anchorSample = this.sample;
        this.anchorTime = anchor;
        return true;
      } catch (error) {
        if (!current()) return false;
        abort.abort();
        this.detach();
        const message = error instanceof Error ? error.message : '';
        // Only fixed local codes reach the host; provider URLs/messages stay private.
        this.error = /^P010_AUDIO_[A-Z_]+$/.test(message) ? message : 'P010_AUDIO_LOAD';
        return false;
      } finally {
        if (current()) {
          this.loading = false;
          this.resumeReady = false;
          this.abort = null;
          this.pending = null;
        }
      }
    })();
    this.pending = pending;
    // A constructor/resume synchronous failure can finish before assignment.
    void pending.then(() => { if (current() && this.pending === pending) this.pending = null; });
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
    this.context?.removeEventListener('statechange', this.reconcileContext);
    try { this.gain?.disconnect(); } catch { /* Closing the owned context still releases its graph. */ }
    this.closing = this.context?.close() ?? Promise.resolve();
    return this.closing;
  }
}
