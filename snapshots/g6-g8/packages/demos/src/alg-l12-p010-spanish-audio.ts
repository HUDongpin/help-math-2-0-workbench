export const P010_SPANISH_AUDIO_SOURCE = Object.freeze({
  sha256: '685174141928210d8190f02a778f28db993dfb3f8a7576852264e539ed8b4644',
  bytes: 215_376,
  sampleRate: 48_000,
  numberOfChannels: 1,
  decodedSamples: 738_432,
  decodedDurationSeconds: 15.384,
  url: '/flash-assets/g678-local/shared-alg001-l12-p010/spanish-audio.mp3',
} as const);
export const P010_SPANISH_AUDIO_URL = `${P010_SPANISH_AUDIO_SOURCE.url}?sha256=${P010_SPANISH_AUDIO_SOURCE.sha256}`;

export type P010SpanishAudioSnapshot = Readonly<{
  phase: 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error' | 'closed';
  volume: number;
}>;
export interface P010SpanishAudioOptions {
  onChange?: (state: P010SpanishAudioSnapshot) => void;
  onEnded?: () => void;
  createContext?: () => AudioContext;
  /** Encoded input still passes the same hash/decode verification. */
  load?: (signal: AbortSignal) => Promise<ArrayBuffer>;
  origin?: string;
  fetch?: typeof globalThis.fetch;
}

function verifyOrigin(origin: string): string {
  const url = new URL(origin);
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin || url.username || url.password)
    throw Error('P010_SA_ORIGIN');
  return url.origin;
}

/** Hash-bound native decoding. This does not establish spoken language or parity. */
export async function decodeP010SpanishAudio(context: BaseAudioContext, encoded: ArrayBuffer): Promise<AudioBuffer> {
  const source = P010_SPANISH_AUDIO_SOURCE;
  if (context.sampleRate !== source.sampleRate) throw Error('P010_SA_CONTEXT_RATE');
  if (encoded.byteLength !== source.bytes) throw Error('P010_SA_BYTES');
  const verified = encoded.slice(0);
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', verified))]
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
  if (hash !== source.sha256) throw Error('P010_SA_HASH');
  const decoded = await context.decodeAudioData(verified.slice(0));
  if (decoded?.sampleRate !== source.sampleRate || decoded.numberOfChannels !== source.numberOfChannels ||
      decoded.length !== source.decodedSamples) throw Error('P010_SA_DECODE');
  const channel = decoded.getChannelData(0);
  if (channel.length !== source.decodedSamples || !channel.every(Number.isFinite)) throw Error('P010_SA_DECODE');
  return decoded;
}

/** Separate, lazy SA operation. The host owns main-clock pause and return rules.
 * Every explicit start after pause starts at zero; no saved-offset resume is
 * claimed. No locale, load completion, running event, or stale callback can
 * initiate a new source. onEnded is only for current natural completion.
 */
export class P010SpanishAudioController {
  private readonly options: P010SpanishAudioOptions;
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private buffer: AudioBuffer | null = null;
  private node: AudioBufferSourceNode | null = null;
  private abort: AbortController | null = null;
  private generation = 0;
  private resuming = false;
  private phase: P010SpanishAudioSnapshot['phase'] = 'idle';
  private volume = 1;
  private closing: Promise<void> | null = null;
  private readonly reconcileContext = () => {
    if (this.context && this.context.state !== 'running' &&
      (this.phase === 'playing' || (this.phase === 'loading' && !this.resuming))) this.pause();
  };

  constructor(options: P010SpanishAudioOptions = {}) {
    if (options.origin !== undefined) verifyOrigin(options.origin);
    this.options = {...options};
  }

  private changed(phase: P010SpanishAudioSnapshot['phase']): void {
    this.phase = phase;
    this.options.onChange?.({phase, volume: this.volume});
  }

  snapshot(): P010SpanishAudioSnapshot {
    this.reconcileContext();
    return {phase: this.phase, volume: this.volume};
  }

  private dispose(node: AudioBufferSourceNode, stop: boolean): void {
    node.onended = null;
    try { if (stop) node.stop(); } catch { /* Already ended or not started. */ }
    try { node.disconnect(); } catch { /* Cleanup still owns the context. */ }
  }

  private detach(): void {
    const node = this.node;
    this.node = null;
    if (node) this.dispose(node, true);
  }

  private cancel(): void {
    this.generation++;
    this.abort?.abort(); this.abort = null;
    this.resuming = false;
    this.detach();
  }

  pause(): void {
    if (this.phase !== 'loading' && this.phase !== 'playing') return;
    this.cancel(); this.changed('paused');
  }

  stop(): void {
    if (this.phase === 'closed') return;
    this.cancel(); this.buffer = null; this.changed('idle');
  }

  setVolume(volume: number): void {
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) throw Error('P010_SA_VOLUME');
    if (this.phase === 'closed') throw Error('P010_SA_CLOSED');
    this.volume = volume;
    if (this.gain) this.gain.gain.value = volume;
    this.changed(this.phase);
  }

  private async loadSource(signal: AbortSignal): Promise<ArrayBuffer> {
    const source = P010_SPANISH_AUDIO_SOURCE;
    const origin = verifyOrigin(this.options.origin ?? window.location.origin);
    const url = new URL(P010_SPANISH_AUDIO_URL, origin).href;
    const response = await (this.options.fetch ?? globalThis.fetch)(url, {
      signal, mode: 'same-origin', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
    });
    if (signal.aborted) throw Error('P010_SA_CANCELLED');
    if (response.status !== 200 || response.redirected || response.url !== url ||
      response.type === 'opaque' || response.type === 'opaqueredirect' ||
      response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'audio/mpeg' ||
      response.headers.get('content-length') !== String(source.bytes) || !response.body)
      throw Error('P010_SA_RESPONSE');
    const reader = response.body.getReader();
    const encoded = new Uint8Array(source.bytes);
    let offset = 0;
    try {
      while (true) {
        const {done, value} = await reader.read();
        if (signal.aborted) throw Error('P010_SA_CANCELLED');
        if (done) break;
        if (value.byteLength > source.bytes - offset) throw Error('P010_SA_BYTES');
        encoded.set(value, offset); offset += value.byteLength;
      }
    } catch (error) {
      await reader.cancel().catch(() => {});
      throw error;
    } finally { reader.releaseLock(); }
    if (offset !== source.bytes) throw Error('P010_SA_BYTES');
    return encoded.buffer;
  }

  private ensureContext(): AudioContext {
    if (this.context) {
      if (this.context.state === 'closed') throw Error('P010_SA_CONTEXT_CLOSED');
      return this.context;
    }
    const context = this.options.createContext?.() ?? new AudioContext({sampleRate: P010_SPANISH_AUDIO_SOURCE.sampleRate});
    let gain: GainNode | null = null;
    try {
      if (context.sampleRate !== P010_SPANISH_AUDIO_SOURCE.sampleRate || context.state === 'closed')
        throw Error('P010_SA_CONTEXT');
      gain = context.createGain(); gain.gain.value = this.volume; gain.connect(context.destination);
      context.addEventListener('statechange', this.reconcileContext);
    } catch (error) {
      try { gain?.disconnect(); } catch { /* Close the failed context below. */ }
      if (context.state !== 'closed') void context.close().catch(() => {});
      throw error;
    }
    this.context = context; this.gain = gain;
    return context;
  }

  async start(): Promise<boolean> {
    if (this.phase === 'closed') return false;
    this.reconcileContext();
    if (this.phase === 'playing') return true;
    this.cancel();
    const generation = this.generation;
    const current = () => this.phase !== 'closed' && this.generation === generation;
    const abort = new AbortController(); this.abort = abort;
    try {
      const context = this.ensureContext();
      this.resuming = true;
      // Keep resume in the explicit user-activation call before the first await.
      const resume = context.resume().then(() => {
        if (!current()) return;
        this.resuming = false;
        if (context.state !== 'running') throw Error('P010_SA_CONTEXT_NOT_RUNNING');
      });
      this.changed('loading');
      const loaded = this.buffer ? Promise.resolve(this.buffer) :
        (async () => (this.options.load ?? (signal => this.loadSource(signal)))(abort.signal))()
          .then(async encoded => {
            if (!current()) return null;
            const decoded = await decodeP010SpanishAudio(context, encoded);
            return current() ? decoded : null;
          });
      const [, decoded] = await Promise.all([resume, loaded]);
      if (!current() || !decoded) return false;
      if (context.state !== 'running') { this.pause(); return false; }
      this.buffer = decoded; this.abort = null;
      const node = context.createBufferSource(); node.buffer = decoded; node.loop = false;
      try { node.connect(this.gain!); node.start(context.currentTime, 0); }
      catch (error) { this.dispose(node, true); throw error; }
      if (!current()) { this.dispose(node, true); return false; }
      this.node = node;
      node.onended = () => {
        this.reconcileContext();
        if (!current() || this.node !== node) return;
        this.node = null; this.dispose(node, false); this.buffer = null;
        this.changed('ended');
        if (current()) this.options.onEnded?.();
      };
      this.changed('playing');
      return current();
    } catch {
      if (!current()) return false;
      this.cancel(); this.buffer = null; this.changed('error');
      return false;
    }
  }

  close(): Promise<void> {
    if (this.closing) return this.closing;
    this.cancel(); this.buffer = null;
    this.context?.removeEventListener('statechange', this.reconcileContext);
    try { this.gain?.disconnect(); } catch { /* Context close still releases the graph. */ }
    this.gain = null; this.phase = 'closed';
    this.closing = this.context && this.context.state !== 'closed' ? this.context.close() : Promise.resolve();
    this.changed('closed');
    return this.closing;
  }
}
