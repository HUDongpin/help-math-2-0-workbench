import {DecodedSourceStreamTransport, type DecodedStreamResult, type DecodedSourceStreamBinding}
  from './decoded-source-stream-transport';

// Chrome 153.0.8010.54; two suspended-context decodes, mono float32 LE.
// Receipt SHA-256: 0a35351fa025b3a67cdb1729d92b808d820fc8af55120271679af9f804871c57.
// Conditional static host algorithm: audit/sa-host-disposition-v1.json; historical page launch unobserved.
export const P004_OPTIONAL_SPANISH_AUDIO_BINDING: DecodedSourceStreamBinding = Object.freeze({
  sourceBytes: 667968,
  sourceSha256: '08bb62e9c1d92235c2e3fb96c44d44fc16b92ca7d175274e4c809f06bcfda8a5',
  sampleRate: 48000, channels: 1,
  decodedSamples: 2290176,
  pcmSha256: 'a2a1d4bae327a0f1ab1afd355d8d8b8e2961cd0dbdbb3a77dead8234879e80f4',
});
export const P004_OPTIONAL_SPANISH_AUDIO_URL =
  `/flash-assets/g678-local/shared-alg001-l06-p004/optional-spanish-audio-v1?sha256=${P004_OPTIONAL_SPANISH_AUDIO_BINDING.sourceSha256}`;
export type P004OptionalSpanishAudioSnapshot = Readonly<{
  phase: 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error' | 'closed';
  volume: number; failure: string | null; lessonCompleted: false;
}>;
const result = (accepted: boolean, reason: string): DecodedStreamResult => Object.freeze({accepted, reason});

/** Bounded same-origin delivery. The common transport independently hashes the
 * complete encoded bytes and measured decoded PCM before any source can play. */
async function loadSource(signal: AbortSignal): Promise<ArrayBuffer> {
  const url = new URL(P004_OPTIONAL_SPANISH_AUDIO_URL, window.location.origin);
  const response = await fetch(url, {signal, credentials: 'same-origin', cache: 'no-store', redirect: 'error'});
  if (!response.ok || response.redirected || response.url !== url.href ||
      response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'audio/mpeg' ||
      response.headers.get('content-length') !== String(P004_OPTIONAL_SPANISH_AUDIO_BINDING.sourceBytes) || !response.body)
    throw Error('optional-sa-response-mismatch');
  const reader = response.body.getReader();
  const bytes = new Uint8Array(P004_OPTIONAL_SPANISH_AUDIO_BINDING.sourceBytes);
  let count = 0;
  try {
    for (;;) {
      const chunk = await reader.read();
      if (signal.aborted) throw Error('optional-sa-load-canceled');
      if (chunk.done) break;
      if (count + chunk.value.byteLength > bytes.length) throw Error('optional-sa-response-too-large');
      bytes.set(chunk.value, count); count += chunk.value.byteLength;
    }
    if (count !== bytes.length) throw Error('optional-sa-response-length-mismatch');
    return bytes.buffer;
  } finally {
    await reader.cancel().catch(() => {}); reader.releaseLock();
  }
}

/** Optional host SA operation, separate from the main animation clock.
 * Main pause and conditional return belong to the caller. Each user Start
 * begins at zero, matching the source host rather than implying saved-offset resume. */
export class P004OptionalSpanishAudio {
  private phase: P004OptionalSpanishAudioSnapshot['phase'] = 'idle';
  private volume = 1;
  private failure: string | null = null;
  private epoch = 0;
  private abort?: AbortController;
  private transport?: DecodedSourceStreamTransport;
  private unsubscribe?: () => void;
  private disposal: Promise<void> = Promise.resolve();
  private readonly options: {
    onChange: (snapshot: P004OptionalSpanishAudioSnapshot) => void;
    onEnded: () => void;
    load?: (signal: AbortSignal) => Promise<ArrayBuffer>;
    createContext?: () => AudioContext;
  };
  constructor(options: P004OptionalSpanishAudio['options']) {this.options = options;}
  snapshot(): P004OptionalSpanishAudioSnapshot {
    return Object.freeze({phase: this.phase, volume: this.volume, failure: this.failure, lessonCompleted: false});
  }
  private emit() {
    // Observer failures must never interrupt cancellation or native-resource disposal.
    try {this.options.onChange(this.snapshot());} catch {/* Host observers own their failures. */}
  }
  private retire(): Promise<void> {
    this.abort?.abort(); this.abort = undefined;
    this.unsubscribe?.(); this.unsubscribe = undefined;
    const old = this.transport; this.transport = undefined;
    if (old) {
      // close() invalidates pending preparation/start and stops current nodes synchronously.
      let closed: Promise<void>;
      try {closed = old.close();} catch (error) {closed = Promise.reject(error);}
      this.disposal = Promise.all([this.disposal, closed]).then(() => undefined);
      // Retain rejection for fail-closed subsequent starts while avoiding an unhandled rejection.
      void this.disposal.catch(() => {});
    }
    return this.disposal;
  }
  private cancel(phase: P004OptionalSpanishAudioSnapshot['phase']): DecodedStreamResult {
    if (this.phase === 'closed') return result(false, 'closed');
    this.epoch++; this.retire(); this.phase = phase; this.failure = null; this.emit();
    return result(true, `optional-sa-${phase}`);
  }
  async start(policy: {activation: 'user'}): Promise<DecodedStreamResult> {
    if (!policy || policy.activation !== 'user') return result(false, 'explicit-user-start-required');
    if (this.phase === 'closed') return result(false, 'closed');
    if (this.phase === 'playing') return result(true, 'already-playing');
    const ticket = ++this.epoch;
    const cleanup = this.retire();
    this.phase = 'loading'; this.failure = null; this.emit();
    try {
      await cleanup;
      if (ticket !== this.epoch) return result(false, 'stale-start');
      const abort = new AbortController(); this.abort = abort;
      const bytes = await (this.options.load ?? loadSource)(abort.signal);
      if (ticket !== this.epoch || abort.signal.aborted) return result(false, 'stale-load');
      const transport = new DecodedSourceStreamTransport(P004_OPTIONAL_SPANISH_AUDIO_BINDING,
        {createContext: this.options.createContext});
      this.transport = transport;
      transport.setVolume(this.volume);
      this.unsubscribe = transport.subscribe(() => {
        if (ticket !== this.epoch || this.transport !== transport) return;
        const snapshot = transport.snapshot();
        if (snapshot.phase === 'buffer-ended' && this.phase === 'playing') {
          this.phase = 'ended';
          const cleanup = this.retire();
          this.emit();
          void cleanup.then(() => {
            if (ticket !== this.epoch || this.phase !== 'ended') return;
            try {this.options.onEnded();} catch {/* Host callback cannot retain audio resources. */}
          }).catch(error => {
            if (ticket !== this.epoch) return;
            this.phase = 'error'; this.failure = String(error); this.emit();
          });
        } else if (snapshot.phase === 'interrupted') {
          this.cancel('paused');
        } else if (snapshot.phase === 'closed') {
          this.epoch++; this.retire(); this.phase = 'error'; this.failure = 'optional-sa-context-closed'; this.emit();
        } else if (snapshot.phase === 'playing') {
          this.phase = 'playing'; this.emit();
        }
      });
      const prepared = await transport.prepare(bytes);
      if (ticket !== this.epoch || this.transport !== transport) return result(false, 'stale-load');
      if (!prepared.accepted) throw Error(prepared.reason);
      const played = await transport.play({activation: 'user', reducedMotion: false});
      if (ticket !== this.epoch || this.transport !== transport) return result(false, 'stale-start');
      if (!played.accepted) throw Error(played.reason);
      return result(true, 'optional-sa-playing-from-zero');
    } catch (error) {
      if (ticket !== this.epoch) return result(false, 'stale-start');
      this.retire(); this.phase = 'error'; this.failure = error instanceof Error ? error.message : String(error); this.emit();
      return result(false, this.failure);
    }
  }
  pause(): DecodedStreamResult {return this.cancel('paused');}
  stop(): DecodedStreamResult {return this.cancel('idle');}
  setVolume(value: number): DecodedStreamResult {
    if (this.phase === 'closed' || !Number.isFinite(value) || value < 0 || value > 1) return result(false, 'invalid-volume');
    this.volume = value; this.transport?.setVolume(value); this.emit(); return result(true, 'volume-set');
  }
  async close(): Promise<void> {
    if (this.phase !== 'closed') {
      this.epoch++; const cleanup = this.retire(); this.phase = 'closed'; this.failure = null; this.emit();
      await cleanup;
    } else await this.disposal;
  }
}
