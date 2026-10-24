import {P047_SOURCE} from './nms-l01-p047-source-data-v1';

export type P047AudioAsset = (typeof P047_SOURCE.audio)[number];
export interface P047AudioState {
  readonly phase: 'idle' | 'loading' | 'playing' | 'failed' | 'closed';
  readonly assetId: string | null;
  readonly volume: number;
  readonly failure: string | null;
}
export interface P047AudioDependencies {
  /** The private product loader supplies the one exact allowed source file.
   * This class never builds a URL or reads an arbitrary path. */
  readonly read: (asset: P047AudioAsset, signal: AbortSignal) => Promise<ArrayBuffer>;
  readonly changed: (state: P047AudioState) => void;
  readonly context?: () => AudioContext;
}

/** One user-triggered source clip at a time. Stop, answer, replay and page
 * disposal invalidate every pending read/decode before another clip can start.
 * Native sample counts are bound to the preserved browser/FFmpeg measurement. */
export class P047AudioV1 {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private node: AudioBufferSourceNode | null = null;
  private pending: AbortController | null = null;
  private ticket = 0;
  private closed = false;
  private cache = new Map<string, AudioBuffer>();
  private state: P047AudioState = Object.freeze({phase: 'idle', assetId: null, volume: 1, failure: null});
  constructor(private readonly dependencies: P047AudioDependencies) {}
  snapshot() { return this.state; }
  private publish(phase: P047AudioState['phase'], assetId: string | null, failure: string | null = null) {
    this.state = Object.freeze({phase, assetId, failure, volume: this.state.volume});
    this.dependencies.changed(this.state);
  }
  setVolume(volume: number) {
    if (this.closed || !Number.isFinite(volume)) return;
    const bounded = Math.max(0, Math.min(1, volume));
    this.state = Object.freeze({...this.state, volume: bounded});
    if (this.gain && this.context) this.gain.gain.setValueAtTime(bounded, this.context.currentTime);
    this.dependencies.changed(this.state);
  }
  stop() {
    ++this.ticket;
    this.pending?.abort(); this.pending = null;
    const node = this.node; this.node = null;
    if (node) { node.onended = null; try { node.stop(); } catch {} node.disconnect(); }
    if (!this.closed) this.publish('idle', null);
  }
  async toggle(assetId: string): Promise<boolean> {
    if (this.closed) return false;
    const asset = P047_SOURCE.audio.find(asset => asset.id === assetId);
    if (!asset) return false;
    if (this.state.assetId === assetId && ['playing', 'loading'].includes(this.state.phase)) { this.stop(); return true; }
    this.stop();
    const ticket = this.ticket, controller = new AbortController(); this.pending = controller;
    const current = () => !this.closed && ticket === this.ticket && !controller.signal.aborted;
    this.publish('loading', assetId);
    try {
      // Called synchronously in the user's event, before any network await.
      const context = this.context ??= this.dependencies.context?.() ?? new AudioContext({sampleRate: 44100});
      if (context.sampleRate !== 44100) throw new Error('P047_AUDIO_SAMPLE_RATE');
      if (!this.gain) { this.gain = context.createGain(); this.gain.gain.value = this.state.volume; this.gain.connect(context.destination); }
      await context.resume();
      if (!current()) return false;
      if (context.state !== 'running') throw new Error('P047_AUDIO_ACTIVATION');
      let buffer = this.cache.get(assetId);
      if (!buffer) {
        const bytes = await this.dependencies.read(asset, controller.signal);
        if (!current()) return false;
        if (!(bytes instanceof ArrayBuffer) || bytes.byteLength !== asset.bytes) throw new Error('P047_AUDIO_BYTES');
        const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('');
        if (!current()) return false;
        if (digest !== asset.sha256) throw new Error('P047_AUDIO_HASH');
        buffer = await context.decodeAudioData(bytes.slice(0));
        if (!current()) return false;
        if (buffer.sampleRate !== asset.sampleRate || buffer.length !== asset.samples || buffer.numberOfChannels !== asset.channels) throw new Error('P047_AUDIO_DECODE');
        const samples = buffer.getChannelData(0);
        let peak = 0;
        for (const sample of samples) { if (!Number.isFinite(sample)) throw new Error('P047_AUDIO_NONFINITE'); peak = Math.max(peak, Math.abs(sample)); }
        if (peak === 0) throw new Error('P047_AUDIO_SILENT');
        this.cache.set(assetId, buffer);
        // Keep only the five controls of a question plus one recently used clip.
        while (this.cache.size > 6) this.cache.delete(this.cache.keys().next().value!);
      }
      if (!current()) return false;
      const node = context.createBufferSource(); node.buffer = buffer; node.connect(this.gain);
      this.node = node;
      node.onended = () => {
        if (!current() || this.node !== node) return;
        this.node = null; this.pending = null; node.disconnect(); this.publish('idle', null);
      };
      node.start(0, 0); this.publish('playing', assetId); return true;
    } catch (error) {
      if (!current()) return false;
      this.pending = null;
      if (this.node) { this.node.onended = null; try { this.node.stop(); } catch {} this.node.disconnect(); this.node = null; }
      this.publish('failed', null, error instanceof Error && /^P047_AUDIO_/.test(error.message) ? error.message : 'P047_AUDIO_UNAVAILABLE');
      return false;
    }
  }
  async close() {
    if (this.closed) return;
    this.stop(); this.closed = true; this.cache.clear(); this.gain?.disconnect(); this.gain = null;
    const context = this.context; this.context = null;
    this.publish('closed', null);
    if (context && context.state !== 'closed') await context.close();
  }
}
