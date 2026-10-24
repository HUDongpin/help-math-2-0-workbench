export const P006_SPANISH_AUDIO_SOURCE = {
  sha256: '86fdbdeb0fec8cd6b9682d75ec436e4db370d56ba23e48efc47cf00c374c64bf',
  bytes: 214704,
  sampleRate: 48000,
  url: '/flash-assets/g678-local/shared-alg001-l12-p006/spanish-audio',
} as const;

export type P006SpanishAudioSnapshot = Readonly<{
  phase: 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error' | 'closed';
  volume: number;
}>;

type Options = {
  onChange?: (state: P006SpanishAudioSnapshot) => void;
  onEnded?: () => void;
  createContext?: () => AudioContext;
  load?: (signal: AbortSignal) => Promise<ArrayBuffer>;
};

async function loadSource(signal: AbortSignal): Promise<ArrayBuffer> {
  const source = P006_SPANISH_AUDIO_SOURCE;
  const response = await fetch(`${source.url}?sha256=${source.sha256}`, {
    signal, credentials: 'same-origin', cache: 'no-store', redirect: 'error',
  });
  if (!response.ok || response.headers.get('Content-Type') !== 'audio/mpeg' ||
      response.headers.get('Content-Length') !== String(source.bytes)) {
    throw Error('P006_SA_RESPONSE');
  }
  return response.arrayBuffer();
}

/** The encoded source is pinned; decoded length is not an original-runtime clock. */
export async function decodeP006SpanishAudio(context: BaseAudioContext, encoded: ArrayBuffer): Promise<AudioBuffer> {
  const source = P006_SPANISH_AUDIO_SOURCE;
  if (context.sampleRate !== source.sampleRate) throw Error('P006_SA_CONTEXT_RATE');
  if (encoded.byteLength !== source.bytes) throw Error('P006_SA_BYTES');
  const verified = encoded.slice(0);
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', verified))]
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
  if (hash !== source.sha256) throw Error('P006_SA_HASH');
  const decoded = await context.decodeAudioData(verified.slice(0));
  if (decoded?.numberOfChannels !== 1 || decoded.sampleRate !== source.sampleRate ||
      !Number.isInteger(decoded.length) || decoded.length <= 0) throw Error('P006_SA_DECODE');
  return decoded;
}

/** Optional SA owns its separate, lazy context. The host owns main-timeline pause/return.
 * Source SA_PAUSE stops Sound; SA_PLAY has no saved offset. This candidate therefore
 * restarts SA at zero after pause, rather than claiming a sample-position resume.
 * Construction, loading completion after cancellation and context state changes never
 * initiate playback. onEnded is reserved for natural completion of the live source. */
export class P006SpanishAudioController {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private buffer: AudioBuffer | null = null;
  private node: AudioBufferSourceNode | null = null;
  private abort: AbortController | null = null;
  private generation = 0;
  private resuming = false;
  private phase: P006SpanishAudioSnapshot['phase'] = 'idle';
  private volume = 1;
  private closing: Promise<void> | null = null;
  private readonly reconcileContext = () => {
    if (this.context && this.context.state !== 'running' &&
        (this.phase === 'playing' || (this.phase === 'loading' && !this.resuming))) this.pause();
  };

  constructor(private readonly options: Options = {}) {}

  private changed(phase: P006SpanishAudioSnapshot['phase']) {
    this.phase = phase;
    this.options.onChange?.({phase, volume: this.volume});
  }

  snapshot(): P006SpanishAudioSnapshot {
    this.reconcileContext();
    return {phase: this.phase, volume: this.volume};
  }

  private detach() {
    const node = this.node;
    this.node = null;
    if (!node) return;
    node.onended = null;
    try { node.stop(); } catch { /* A naturally completed source may already be stopped. */ }
    node.disconnect();
  }

  private cancel() {
    this.generation++;
    this.abort?.abort(); this.abort = null;
    this.resuming = false;
    this.detach();
  }

  pause() {
    if (this.phase === 'closed' || this.phase === 'idle' || this.phase === 'paused' ||
        this.phase === 'ended' || this.phase === 'error') return;
    this.cancel(); this.changed('paused');
  }

  stop() {
    if (this.phase === 'closed') return;
    this.cancel(); this.buffer = null; this.changed('idle');
  }

  setVolume(volume: number) {
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) throw Error('P006_SA_VOLUME');
    if (this.phase === 'closed') throw Error('P006_SA_CLOSED');
    this.volume = volume;
    if (this.gain) this.gain.gain.value = volume;
    this.changed(this.phase);
  }

  async start(): Promise<boolean> {
    if (this.phase === 'closed') return false;
    this.reconcileContext();
    if (this.phase === 'playing') return true;
    this.cancel();
    const generation = this.generation;
    const current = () => this.phase !== 'closed' && this.generation === generation;
    const abort = new AbortController();
    this.abort = abort;
    try {
      if (!this.context) {
        const context = (this.options.createContext ?? (() => new AudioContext({sampleRate: 48000})))();
        let gain: GainNode | null = null;
        try {
          if (context.sampleRate !== P006_SPANISH_AUDIO_SOURCE.sampleRate ||
              context.state === 'closed') throw Error('P006_SA_CONTEXT');
          gain = context.createGain();
          gain.gain.value = this.volume;
          gain.connect(context.destination);
          context.addEventListener('statechange', this.reconcileContext);
        } catch (error) {
          gain?.disconnect();
          if (context.state !== 'closed') void context.close().catch(() => {});
          throw error;
        }
        this.context = context; this.gain = gain;
      }
      const context = this.context;
      this.resuming = true;
      // Invoke resume synchronously in the explicit user-activation call, before fetch.
      const resume = context.resume().then(() => {
        if (!current()) return;
        this.resuming = false;
        if (context.state !== 'running') throw Error('P006_SA_CONTEXT_NOT_RUNNING');
      });
      this.changed('loading');
      const loaded = this.buffer ? Promise.resolve(this.buffer) :
        (async () => (this.options.load ?? loadSource)(abort.signal))().then(async encoded => {
          if (!current()) return null;
          const decoded = await decodeP006SpanishAudio(context, encoded);
          return current() ? decoded : null;
        });
      const [, decoded] = await Promise.all([resume, loaded]);
      if (!current() || !decoded) return false;
      if (context.state !== 'running') {this.pause(); return false;}
      this.buffer = decoded;
      this.abort = null;
      const node = context.createBufferSource();
      node.buffer = decoded;
      node.loop = false;
      try {
        node.connect(this.gain!);
        node.start(context.currentTime, 0);
      } catch (error) {node.disconnect(); throw error;}
      this.node = node;
      node.onended = () => {
        if (!current() || this.node !== node) return;
        this.node = null;
        node.onended = null;
        node.disconnect();
        this.buffer = null;
        this.changed('ended');
        this.options.onEnded?.();
      };
      this.changed('playing');
      return true;
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
    this.gain?.disconnect(); this.gain = null;
    this.changed('closed');
    this.closing = this.context && this.context.state !== 'closed'
      ? this.context.close() : Promise.resolve();
    return this.closing;
  }
}
