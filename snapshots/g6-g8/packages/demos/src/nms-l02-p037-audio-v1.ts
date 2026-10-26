import {P037_AUDIO_SOURCES} from './nms-l02-p037-audio-source-v1';
import {p037AudioSource, p037PreparePcm, type P037AudioDomain} from './nms-l02-p037-audio-pcm-v1';
import {p037Initial, p037Tick, p037Drop, p037Choose, p037CancelSelection, p037ClosePopup,
  p037OpenTerm, p037CloseTerm, p037Replay, p037Advancing, p037Phase, type P037State, type P037TermId} from './nms-l02-p037-state-v1';
export interface P037AudioSnapshot {
  readonly phase: 'paused' | 'loading' | 'playing' | 'waiting' | 'completed' | 'failed' | 'closed';
  readonly state: P037State;
  readonly fraction: number;
  readonly volume: number;
  readonly narrationEnabled: boolean;
  readonly failure: string | null;
}
export interface P037AudioDependencies {
  readonly seed: number;
  readonly read: (domain: string, signal: AbortSignal) => Promise<ArrayBuffer>;
  readonly changed: (snapshot: P037AudioSnapshot) => void;
  readonly createContext?: () => AudioContext;
}
type Window = Readonly<{domain: P037AudioDomain; frame: number; boundary: number}>;
/** A hidden popup still advances/plays: source Close only changes visibility.
 * This also permits coach52 and popup79 to overlap after an early Close. */
export function p037AudioWindows(s: P037State): readonly Window[] {
  if (s.term !== null) return [];
  const windows: Window[] = [];
  if (s.mainPlaying) windows.push({domain: '80', frame: s.mainFrame, boundary: s.mainFrame < 442 ? 442 : 483});
  if (s.coachPlaying && s.coachFrame !== null) windows.push({domain: '52', frame: s.coachFrame, boundary: 21});
  if (s.popupPlaying && s.popupFrame !== null) windows.push({domain: '79', frame: s.popupFrame, boundary: 15});
  return windows;
}
export class P037SourceAudio {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private nodes = new Map<P037AudioDomain, AudioBufferSourceNode>();
  private buffers = new Map<P037AudioDomain, AudioBuffer>();
  private pending: AbortController | null = null;
  private ticket = 0;
  private state: P037State;
  private phase: P037AudioSnapshot['phase'] = 'paused';
  private fraction = 0;
  private lastAt = 0;
  private volume = 0.8;
  private narrationEnabled = true;
  private failure: string | null = null;
  constructor(private readonly dependencies: P037AudioDependencies) {this.state = p037Initial(dependencies.seed);}
  private stopNode(domain: P037AudioDomain) {
    const node = this.nodes.get(domain); this.nodes.delete(domain);
    if (node) {node.onended = null; try {node.stop();} catch {} node.disconnect();}
  }
  private stopNodes() {for (const domain of [...this.nodes.keys()]) this.stopNode(domain);}
  private reconcile(restart: readonly P037AudioDomain[] = []) {
    if (this.phase !== 'playing' || !this.narrationEnabled || !this.context || !this.gain) {this.stopNodes(); return;}
    const windows = p037AudioWindows(this.state);
    for (const domain of [...this.nodes.keys()]) {
      if (restart.includes(domain) || !windows.some(w => w.domain === domain)) this.stopNode(domain);
    }
    for (const window of windows) {
      if (this.nodes.has(window.domain)) continue;
      const buffer = this.buffers.get(window.domain);
      if (!buffer) throw Error('P037_AUDIO_DOMAIN');
      const offset = (window.frame - 1 + this.fraction) / 12;
      const duration = Math.min((window.boundary - window.frame - this.fraction) / 12, buffer.duration - offset);
      if (duration <= 0) continue;
      const node = this.context.createBufferSource(); node.buffer = buffer; node.connect(this.gain);
      this.nodes.set(window.domain, node);
      node.onended = () => {
        if (this.nodes.get(window.domain) !== node) return;
        this.nodes.delete(window.domain); node.disconnect();
        this.sync(); this.emit();
      };
      node.start(0, offset, duration);
    }
  }
  private sync() {
    if (this.phase !== 'playing' || !this.context) return;
    const elapsed = this.fraction + Math.max(0, this.context.currentTime - this.lastAt) * 12;
    this.lastAt = this.context.currentTime;
    const frames = Math.floor(elapsed + 1e-8); this.fraction = Math.max(0, elapsed - frames);
    for (let i = 0; i < frames; i++) {
      this.state = p037Tick(this.state);
      if (!p037Advancing(this.state)) {
        this.fraction = 0;
        this.phase = p037Phase(this.state) === 'completed' ? 'completed' : this.state.term ? 'paused' : 'waiting';
        break;
      }
    }
    this.reconcile();
  }
  snapshot(): P037AudioSnapshot {
    this.sync();
    return Object.freeze({phase: this.phase, state: this.state, fraction: this.fraction,
      volume: this.volume, narrationEnabled: this.narrationEnabled, failure: this.failure});
  }
  private emit() {this.dependencies.changed(this.snapshot());}
  async play() {
    this.sync();
    if (this.phase === 'closed' || this.phase === 'loading' || this.phase === 'completed' || this.state.term !== null) return false;
    if (!p037Advancing(this.state)) {this.phase = 'waiting'; this.emit(); return false;}
    if (this.phase === 'playing') return true;
    const ticket = ++this.ticket, controller = new AbortController(); this.pending = controller;
    this.phase = 'loading'; this.failure = null; this.emit();
    const current = () => this.phase !== 'closed' && ticket === this.ticket && !controller.signal.aborted;
    try {
      const context = this.context ??= this.dependencies.createContext?.() ?? new AudioContext({sampleRate: 22050});
      await context.resume(); if (!current()) return false;
      if (context.sampleRate !== 22050 || context.state !== 'running') throw Error('P037_AUDIO_ACTIVATION');
      for (const domain of Object.keys(P037_AUDIO_SOURCES) as P037AudioDomain[]) {
        if (this.buffers.has(domain)) continue;
        const source = p037AudioSource(domain), bytes = await this.dependencies.read(domain, controller.signal);
        if (!current()) return false;
        if (!(bytes instanceof ArrayBuffer) || bytes.byteLength !== source.sourceBytes) throw Error('P037_AUDIO_BYTES');
        const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x => x.toString(16).padStart(2, '0')).join('');
        if (!current()) return false;
        if (digest !== source.sourceSha256) throw Error('P037_AUDIO_HASH');
        const decoded = await context.decodeAudioData(bytes.slice(0)); if (!current()) return false;
        if (decoded.sampleRate !== 22050 || decoded.numberOfChannels !== 1 || decoded.length !== source.decodedSamples) throw Error('P037_AUDIO_DECODE');
        const buffer = context.createBuffer(1, source.totalSamples, 22050);
        buffer.getChannelData(0).set(p037PreparePcm(decoded.getChannelData(0), domain)); this.buffers.set(domain, buffer);
      }
      if (!current()) return false;
      if (!this.gain) {this.gain = context.createGain(); this.gain.gain.value = this.volume; this.gain.connect(context.destination);}
      this.pending = null; this.lastAt = context.currentTime; this.phase = 'playing'; this.reconcile(); this.emit(); return true;
    } catch (error) {
      if (!current()) return false;
      this.pending = null; this.stopNodes(); this.phase = 'failed';
      this.failure = error instanceof Error && /^P037_AUDIO_/.test(error.message) ? error.message : 'P037_AUDIO_UNAVAILABLE';
      this.emit(); return false;
    }
  }
  private pauseNow() {
    ++this.ticket; this.pending?.abort(); this.pending = null; this.stopNodes();
    if (this.phase !== 'closed' && this.phase !== 'completed') this.phase = 'paused';
  }
  pause() {if (this.phase === 'closed') return; this.sync(); this.pauseNow(); this.emit();}
  choose(id: number) {if (this.phase === 'closed' || this.phase === 'loading') return; this.sync(); this.state = p037Choose(this.state, id); this.emit();}
  cancelSelection() {if (this.phase === 'closed') return; this.sync(); this.state = p037CancelSelection(this.state); this.emit();}
  async drop(id: number, targetId: number | null) {
    if (this.phase === 'closed' || this.phase === 'loading') return false;
    this.sync(); const before = this.state, next = p037Drop(before, id, targetId); if (next === before) return false;
    const restart: P037AudioDomain = next.matchedMask !== before.matchedMask ? '52' : '79';
    this.state = next;
    if (this.phase === 'playing') {this.reconcile([restart]); this.emit(); return true;}
    if (!p037Advancing(before)) this.fraction = 0;
    this.emit(); return this.play();
  }
  closePopup() {
    if (this.phase === 'closed') return false;
    this.sync(); const next = p037ClosePopup(this.state); if (next === this.state) return false;
    this.state = next; this.emit(); return true;
  }
  openTerm(term: P037TermId) {
    if (this.phase === 'closed') return false;
    this.sync(); const next = p037OpenTerm(this.state, term); if (next === this.state) return false;
    this.pauseNow(); this.state = next; this.emit(); return true;
  }
  closeTerm() {
    if (this.phase === 'closed') return false;
    const next = p037CloseTerm(this.state); if (next === this.state) return false;
    this.state = next; this.emit(); return true;
  }
  async replay() {
    if (this.phase === 'closed') return false;
    this.sync(); this.pauseNow(); this.state = p037Replay(this.state); this.fraction = 0; this.phase = 'paused';
    this.emit(); return this.play();
  }
  setVolume(value: number) {
    if (this.phase === 'closed' || !Number.isFinite(value)) return;
    this.volume = Math.max(0, Math.min(1, value));
    if (this.gain && this.context) this.gain.gain.setValueAtTime(this.volume, this.context.currentTime);
    this.emit();
  }
  setNarrationEnabled(value: boolean) {
    if (this.phase === 'closed' || this.narrationEnabled === value) return;
    this.sync(); this.narrationEnabled = value; this.reconcile(); this.emit();
  }
  async close() {
    if (this.phase === 'closed') return;
    this.sync(); this.pauseNow(); this.phase = 'closed'; this.buffers.clear(); this.gain?.disconnect(); this.gain = null;
    const context = this.context; this.context = null; this.emit();
    if (context && context.state !== 'closed') await context.close();
  }
}
