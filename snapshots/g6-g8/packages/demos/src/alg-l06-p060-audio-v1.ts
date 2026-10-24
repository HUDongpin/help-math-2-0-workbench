import {bindTechnicalOwner, type TechnicalOwner} from './technical-observation-v1';
import {DecodedSourceStreamTransport, type DecodedStreamSnapshot} from './decoded-source-stream-transport';
import type {P060AudioAsset} from './alg-l06-p060-source-v1';

export interface P060AudioSnapshot {
  readonly assetId: string | null;
  readonly phase: 'idle' | 'loading' | 'playing' | 'failed' | 'closed';
  readonly failure: string | null;
  readonly transport: DecodedStreamSnapshot | null;
}
export interface P060AudioDependencies {
  readonly read: (asset: P060AudioAsset, signal: AbortSignal) => Promise<ArrayBuffer>;
  readonly changed: () => void;
  readonly context?: () => AudioContext;
  readonly technicalOwner?: () => TechnicalOwner|null;
}

/** Exact source bytes and PCM are checked by the existing shared transport.
 * Only one user-triggered question/option owns playback. No request or decode
 * can revive an answered, replayed or unmounted question. */
export class P060AudioV1 {
  private selected: {asset: P060AudioAsset; transport: DecodedSourceStreamTransport; context: AudioContext; unsubscribe: () => void} | null = null;
  private pending: AbortController | null = null;
  private epoch = 0;
  private closed = false;
  private volume = 1;
  private failure: string | null = null;
  private retiring = new Set<Promise<void>>();
  constructor(private readonly deps: P060AudioDependencies) {}
  snapshot(): P060AudioSnapshot {
    const transport = this.selected?.transport.snapshot() ?? null;
    const phase = this.closed ? 'closed' : this.failure ? 'failed' : this.pending ? 'loading' : transport?.phase === 'playing' ? 'playing' : 'idle';
    return Object.freeze({assetId: this.selected?.asset.id ?? null, phase, failure: this.failure, transport});
  }
  private publish() { this.deps.changed(); }
  stop() {
    ++this.epoch; this.pending?.abort(); this.pending = null;
    const old = this.selected; this.selected = null; this.failure = null;
    if (old) {
      old.unsubscribe();
      // If stop won before prepare, the transport has not yet adopted context.
      const done = old.transport.close().then(async () => {if (old.context.state !== 'closed') await old.context.close();});
      this.retiring.add(done);
      void done.then(() => this.retiring.delete(done), () => this.retiring.delete(done));
    }
    this.publish();
  }
  setVolume(value: number) {
    if (this.closed || !Number.isFinite(value) || value < 0 || value > 1) return false;
    this.volume = value; this.selected?.transport.setVolume(value); return true;
  }
  async toggle(asset: P060AudioAsset): Promise<boolean> {
    if (this.closed) return false;
    if (this.selected?.asset.id === asset.id && ['loading', 'playing'].includes(this.snapshot().phase)) {this.stop(); return true;}
    const technicalOwner = this.deps.technicalOwner?.();
    this.stop(); const epoch = this.epoch, controller = new AbortController(); this.pending = controller;
    const current = () => !this.closed && this.epoch === epoch && !controller.signal.aborted;
    try {
      // Allocate/unlock in the actual click before any read, hash or decode await.
      const context = this.deps.context?.() ?? new AudioContext({sampleRate: asset.binding.sampleRate, latencyHint: 'interactive'});
      const unlocked = bindTechnicalOwner(context, technicalOwner).resume().then(() => true, () => false);
      const transport = new DecodedSourceStreamTransport(asset.binding, {createContext: () => context, technicalOwner: () => technicalOwner ?? null});
      const unsubscribe = transport.subscribe(() => {if (current()) this.publish();});
      this.selected = {asset, transport, context, unsubscribe}; transport.setVolume(this.volume); this.publish();
      const bytes = await this.deps.read(asset, controller.signal);
      if (!current()) return false;
      if (!await unlocked || context.state !== 'running') throw Error('P060_AUDIO_ACTIVATION');
      const prepared = await transport.prepare(bytes);
      if (!current()) return false;
      if (!prepared.accepted) throw Error(prepared.reason);
      const result = await transport.play({activation: 'user', reducedMotion: false});
      if (!current()) return false;
      this.pending = null;
      if (!result.accepted) throw Error(result.reason);
      this.publish(); return true;
    } catch (error) {
      if (!current()) return false;
      this.stop(); this.failure = error instanceof Error ? error.message : 'P060_AUDIO_UNAVAILABLE'; this.publish(); return false;
    }
  }
  async close() {
    if (this.closed) return;
    this.stop(); this.closed = true; this.publish();
    await Promise.all([...this.retiring]);
  }
}
