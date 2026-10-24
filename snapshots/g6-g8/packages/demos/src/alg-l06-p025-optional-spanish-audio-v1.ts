import {DecodedSourceStreamTransport, type DecodedStreamResult, type DecodedSourceStreamBinding}
  from './decoded-source-stream-transport';
import {P025_SA_ASSET} from './alg-l06-p025-audio-schedule-v1';

// P025 SA physical source and browser PCM are pinned by the generated audio plan.
// Headless Chrome 154 decode-only; native playback and listening remain separate gates.
export const P025_OPTIONAL_SPANISH_AUDIO_BROWSER_RECEIPT_SHA256 =
  P025_SA_ASSET.receiptSha256;
export const P025_OPTIONAL_SPANISH_AUDIO_BINDING: DecodedSourceStreamBinding = Object.freeze({
  sourceBytes: P025_SA_ASSET.sourceBytes, sourceSha256: P025_SA_ASSET.sourceSha256,
  sampleRate: P025_SA_ASSET.sampleRate, channels: P025_SA_ASSET.channels,
  decodedSamples: P025_SA_ASSET.decodedSamples, pcmSha256: P025_SA_ASSET.pcmSha256,
});
export const P025_OPTIONAL_SPANISH_AUDIO_URL =
  `/flash-assets/g678-local/shared-alg001-l06-p025/optional-spanish-audio-v1?sha256=${P025_OPTIONAL_SPANISH_AUDIO_BINDING.sourceSha256}`;
export type P025OptionalSpanishAudioSnapshot = Readonly<{
  phase: 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error' | 'closed';
  volume: number; failure: string | null; lessonCompleted: false;
}>;
const result = (accepted: boolean, reason: string): DecodedStreamResult => Object.freeze({accepted, reason});

/** Same-origin, exact-length delivery. The shared transport checks the complete
 * MP3 hash and measured decoded PCM independently before playback. */
async function loadSource(signal: AbortSignal): Promise<ArrayBuffer> {
  const url = new URL(P025_OPTIONAL_SPANISH_AUDIO_URL, window.location.origin);
  const response = await fetch(url, {signal, credentials: 'same-origin', cache: 'no-store', redirect: 'error'});
  if (!response.ok || response.redirected || response.url !== url.href ||
      response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'audio/mpeg' ||
      response.headers.get('content-length') !== String(P025_OPTIONAL_SPANISH_AUDIO_BINDING.sourceBytes) || !response.body)
    throw Error('optional-sa-response-mismatch');
  const reader = response.body.getReader();
  const bytes = new Uint8Array(P025_OPTIONAL_SPANISH_AUDIO_BINDING.sourceBytes);
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

/** Separate, explicitly selected host SA. The caller owns the P025 single-range main clock:
 * pause it before Start, then resume it only after explicit Return. Each
 * Start begins at decoded sample zero; locale never starts or splices this audio. */
export class P025OptionalSpanishAudio {
  private phase: P025OptionalSpanishAudioSnapshot['phase'] = 'idle';
  private volume = 1;
  private failure: string | null = null;
  private epoch = 0;
  private abort?: AbortController;
  private transport?: DecodedSourceStreamTransport;
  private unsubscribe?: () => void;
  private disposal: Promise<void> = Promise.resolve();
  private readonly options: {
    onChange: (snapshot: P025OptionalSpanishAudioSnapshot) => void;
    onEnded: () => void;
    load?: (signal: AbortSignal) => Promise<ArrayBuffer>;
    createContext?: () => AudioContext;
  };
  constructor(options: P025OptionalSpanishAudio['options']) {this.options = options;}
  snapshot(): P025OptionalSpanishAudioSnapshot {
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
  private cancel(phase: P025OptionalSpanishAudioSnapshot['phase']): DecodedStreamResult {
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
      const transport = new DecodedSourceStreamTransport(P025_OPTIONAL_SPANISH_AUDIO_BINDING,
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
