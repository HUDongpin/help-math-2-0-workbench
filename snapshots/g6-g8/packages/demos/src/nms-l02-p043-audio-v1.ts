import { p043ClockInitial, p043ClockDomain, p043ClockPlay, p043ClockPause, p043ClockSync, p043ClockMatch, p043ClockCloseWrong, p043ClockReplay, p043ClockMainFrame } from './nms-l02-p043-clock-v1';
import { p043DecodeAudio } from './nms-l02-p043-audio-decode-v1';
import type { P043AudioDomain } from './nms-l02-p043-audio-pcm-v1';
import type { P043Term, P043Row } from './nms-l02-p043-matching-v1';
export interface P043AudioDependencies {
  read: (domain: P043AudioDomain, signal: AbortSignal) => Promise<ArrayBuffer>;
  changed: () => void;
  createContext?: () => AudioContext;
  decode?: typeof p043DecodeAudio;
}
export class P043SourceAudio {
  private clock;
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private node: AudioBufferSourceNode | null = null;
  private buffers = new Map<P043AudioDomain, AudioBuffer>();
  private pending: AbortController | null = null;
  private ticket = 0;
  private phase: 'paused' | 'loading' | 'playing' | 'failed' | 'closed' = 'paused';
  private failure: string | null = null;
  private modal = false;
  private volume = .8;
  private narration = true;
  constructor(private readonly deps: P043AudioDependencies, seed = 0) { this.clock = p043ClockInitial(seed); }
  private emit() { if (this.phase !== 'closed') this.deps.changed(); }
  private cancel() { this.ticket++; this.pending?.abort(); this.pending = null; }
  private stopNode() {
    const node = this.node; this.node = null;
    if (node) { node.onended = null; try { node.stop(); } catch {} node.disconnect(); }
  }
  private sync() {
    if (this.phase !== 'playing' || !this.context) return;
    const before = this.clock.state.phase;
    this.clock = p043ClockSync(this.clock, this.context.currentTime);
    if (this.clock.anchor === null) {
      this.stopNode(); this.phase = 'paused';
      // The fourth correct answer starts the final clip only after its own clip.
      if (before === 'correct-feedback' && this.clock.state.phase === 'completion-feedback' && !this.modal) void this.play();
    }
  }
  private startNode() {
    this.stopNode();
    const domain = p043ClockDomain(this.clock), buffer = domain ? this.buffers.get(domain) : null;
    if (!this.narration || !buffer || !this.context || !this.gain || this.phase !== 'playing' || this.clock.elapsed >= buffer.duration) return;
    const node = this.context.createBufferSource(); node.buffer = buffer; node.connect(this.gain); this.node = node;
    node.onended = () => { if (this.node === node) { this.node = null; node.disconnect(); this.sync(); this.emit(); } };
    node.start(0, this.clock.elapsed, buffer.duration - this.clock.elapsed);
  }
  snapshot() {
    this.sync();
    return Object.freeze({ phase: this.phase, state: Object.freeze({ ...this.clock.state, frame: p043ClockMainFrame(this.clock), playing: this.phase === 'playing', completed: this.clock.state.phase === 'complete' }),
      audioDomain: p043ClockDomain(this.clock), elapsed: this.clock.elapsed, modal: this.modal, volume: this.volume, narrationEnabled: this.narration, failure: this.failure });
  }
  async play() {
    if (this.phase === 'closed' || this.phase === 'loading' || this.phase === 'playing' || this.modal) return;
    const domain = p043ClockDomain(this.clock); if (!domain) return;
    const ac = new AbortController(), ticket = ++this.ticket;
    this.pending = ac; this.phase = 'loading'; this.failure = null; this.emit();
    try {
      if (!this.context) {
        this.context = this.deps.createContext?.() ?? new AudioContext({ sampleRate: 22050 });
        this.gain = this.context.createGain(); this.gain.gain.value = this.volume; this.gain.connect(this.context.destination);
      }
      const context = this.context; await context.resume(); ac.signal.throwIfAborted();
      if (!this.buffers.has(domain)) {
        const encoded = await this.deps.read(domain, ac.signal); ac.signal.throwIfAborted();
        const buffer = await (this.deps.decode ?? p043DecodeAudio)(context, domain, encoded, ac.signal); ac.signal.throwIfAborted();
        if (ticket !== this.ticket) return;
        this.buffers.set(domain, buffer);
      }
      if (ticket !== this.ticket) return;
      this.pending = null; this.clock = p043ClockPlay(this.clock, context.currentTime);
      this.phase = this.clock.anchor === null ? 'paused' : 'playing'; this.startNode(); this.emit();
    } catch (error) {
      if (ticket !== this.ticket || ac.signal.aborted) return;
      this.pending = null; this.stopNode(); this.clock = p043ClockPause(this.clock, this.context?.currentTime ?? 0);
      this.phase = 'failed'; this.failure = error instanceof Error ? error.message : 'P043_AUDIO_FAILURE'; this.emit();
    }
  }
  pause() {
    if (this.phase === 'closed') return;
    this.sync(); this.cancel(); this.clock = p043ClockPause(this.clock, this.context?.currentTime ?? 0); this.stopNode();
    if (this.phase !== 'failed') this.phase = 'paused'; this.emit();
  }
  match(term: P043Term, row: P043Row) {
    if (this.phase === 'closed' || this.phase === 'failed' || this.modal) return;
    this.sync(); const next = p043ClockMatch(this.clock, term, row); if (next === this.clock) return;
    this.cancel(); this.stopNode(); this.clock = next; this.phase = 'paused'; this.emit(); void this.play();
  }
  closeWrongFeedback() {
    if (this.phase === 'closed' || this.clock.state.phase !== 'wrong-feedback') return;
    this.cancel(); this.stopNode(); this.clock = p043ClockCloseWrong(this.clock); this.phase = 'paused'; this.failure = null; this.emit();
  }
  setModal(open: boolean) { if (this.phase === 'closed' || this.modal === open) return; this.modal = open; if (open) this.pause(); else this.emit(); }
  replay() {
    if (this.phase === 'closed') return;
    this.cancel(); this.stopNode(); this.clock = p043ClockReplay(this.clock); this.modal = false; this.phase = 'paused'; this.failure = null; this.emit();
  }
  setVolume(volume: number) { if (!Number.isFinite(volume) || volume < 0 || volume > 1) throw Error('P043_VOLUME'); if (this.phase === 'closed') return; this.volume = volume; if (this.gain) this.gain.gain.value = volume; this.emit(); }
  setNarration(enabled: boolean) { if (this.phase === 'closed') return; this.sync(); this.narration = enabled; this.startNode(); this.emit(); }
  async close() {
    if (this.phase === 'closed') return;
    this.cancel(); this.clock = p043ClockPause(this.clock, this.context?.currentTime ?? 0); this.stopNode(); this.phase = 'closed';
    this.gain?.disconnect(); this.gain = null; this.buffers.clear(); const context = this.context; this.context = null; await context?.close();
  }
}
