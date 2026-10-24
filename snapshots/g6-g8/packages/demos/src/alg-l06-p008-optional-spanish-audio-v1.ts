import {DecodedSourceStreamTransport, type DecodedStreamResult, type DecodedSourceStreamBinding}
  from './decoded-source-stream-transport';

// Static P008 host disposition SHA-256: 220a687e723dc47f45997262c5311aef340dc881a97f0b274d7dfc79e3651227.
// Chrome 153 decode-only receipt SHA-256: 1e234628e29ff9cb299225f019d9b8ab2d39ed6cf83c122fbffe6c2487a456d5.
// The source host role is optional SA; actual spoken language and listening acceptance remain unverified.
export const P008_OPTIONAL_SPANISH_AUDIO_BINDING: DecodedSourceStreamBinding = Object.freeze({
  sourceBytes: 135072,
  sourceSha256: 'ca48f20431673bb4e6f17c28cb605134f4098161bbcb93cc82c274cb472466f3',
  sampleRate: 48000, channels: 1,
  decodedSamples: 463104,
  pcmSha256: 'b793fc27e929695ea7b83e05c1c7717317f105e645e8758239df32cbdc6a2f56',
});
export const P008_OPTIONAL_SPANISH_AUDIO_URL =
  `/flash-assets/g678-local/shared-alg001-l06-p008/optional-spanish-audio-v1?sha256=${P008_OPTIONAL_SPANISH_AUDIO_BINDING.sourceSha256}`;
export type P008OptionalSpanishAudioSnapshot = Readonly<{
  phase: 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error' | 'closed';
  volume: number; failure: string | null; lessonCompleted: false;
}>;
const result = (accepted: boolean, reason: string): DecodedStreamResult => Object.freeze({accepted, reason});

/** Same-origin, exact-length delivery. The shared transport checks the complete
 * MP3 hash and measured decoded PCM independently before playback. */
async function loadSource(signal: AbortSignal): Promise<ArrayBuffer> {
  const url = new URL(P008_OPTIONAL_SPANISH_AUDIO_URL, window.location.origin);
  const response = await fetch(url, {signal, credentials: 'same-origin', cache: 'no-store', redirect: 'error'});
  if (!response.ok || response.redirected || response.url !== url.href ||
      response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'audio/mpeg' ||
      response.headers.get('content-length') !== String(P008_OPTIONAL_SPANISH_AUDIO_BINDING.sourceBytes) || !response.body)
    throw Error('optional-sa-response-mismatch');
  const reader = response.body.getReader();
  const bytes = new Uint8Array(P008_OPTIONAL_SPANISH_AUDIO_BINDING.sourceBytes);
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

/** Separate, explicitly selected host SA. The caller owns the P008 main clock:
 * pause it before Start, then conditionally resume it after End/Return. Each
 * Start begins at decoded sample zero; locale never starts or splices this audio. */
export class P008OptionalSpanishAudio {
  private phase: P008OptionalSpanishAudioSnapshot['phase'] = 'idle';
  private volume = 1;
  private failure: string | null = null;
  private epoch = 0;
  private abort?: AbortController;
  private transport?: DecodedSourceStreamTransport;
  private unsubscribe?: () => void;
  private disposal: Promise<void> = Promise.resolve();
  private readonly options: {
    onChange: (snapshot: P008OptionalSpanishAudioSnapshot) => void;
    onEnded: () => void;
    load?: (signal: AbortSignal) => Promise<ArrayBuffer>;
    createContext?: () => AudioContext;
  };
  constructor(options: P008OptionalSpanishAudio['options']) {this.options = options;}
  snapshot(): P008OptionalSpanishAudioSnapshot {
    return Object.freeze({phase: this.phase, volume: this.volume, failure: this.failure, lessonCompleted: false});
  }
  private emit() {
    // Host observer failures cannot strand a source or interrupt retirement.
    try {this.options.onChange(this.snapshot());} catch {/* Host owns observer failures. */}
  }
  private retire(): Promise<void> {
    this.abort?.abort(); this.abort = undefined;
    this.unsubscribe?.(); this.unsubscribe = undefined;
    const old = this.transport; this.transport = undefined;
    if (old) {
      // close invalidates pending decode/start and stops any playing node now.
      let closed: Promise<void>;
      try {closed = old.close();} catch (error) {closed = Promise.reject(error);}
      this.disposal = Promise.all([this.disposal, closed]).then(() => undefined);
      // A later Start/stopAndWait sees the rejection, without an unhandled one.
      void this.disposal.catch(() => {});
    }
    return this.disposal;
  }
  private cancel(phase: P008OptionalSpanishAudioSnapshot['phase']): DecodedStreamResult {
    if (this.phase === 'closed') return result(false, 'closed');
    this.epoch++; void this.retire(); this.phase = phase; this.failure = null; this.emit();
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
      const transport = new DecodedSourceStreamTransport(P008_OPTIONAL_SPANISH_AUDIO_BINDING,
        {createContext: this.options.createContext});
      this.transport = transport;
      transport.setVolume(this.volume);
      this.unsubscribe = transport.subscribe(() => {
        if (ticket !== this.epoch || this.transport !== transport) return;
        const snapshot = transport.snapshot();
        if (snapshot.phase === 'buffer-ended' && this.phase === 'playing') {
          this.phase = 'ended';
          const retired = this.retire();
          this.emit();
          void retired.then(() => {
            if (ticket !== this.epoch || this.phase !== 'ended') return;
            try {this.options.onEnded();} catch {/* Callback cannot retain audio resources. */}
          }).catch(error => {
            if (ticket !== this.epoch) return;
            this.phase = 'error'; this.failure = String(error); this.emit();
          });
        } else if (snapshot.phase === 'interrupted') {
          this.cancel('paused');
        } else if (snapshot.phase === 'closed') {
          this.epoch++; void this.retire(); this.phase = 'error';
          this.failure = 'optional-sa-context-closed'; this.emit();
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
      void this.retire(); this.phase = 'error';
      this.failure = error instanceof Error ? error.message : String(error); this.emit();
      return result(false, this.failure);
    }
  }
  pause(): DecodedStreamResult {return this.cancel('paused');}
  stop(): DecodedStreamResult {return this.cancel('idle');}
  /** Stop audio immediately and wait until the former native context closes. */
  async stopAndWait(): Promise<void> {this.stop(); await this.disposal;}
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
