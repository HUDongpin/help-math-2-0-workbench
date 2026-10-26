import {p047ClockInitial,p047ClockPlay,p047ClockPause,p047ClockSync,p047ClockDuration,p047ClockHelp,p047ClockReplay,p047ClockMainFrame,p047ClockCelebrationFrame,p047ClockWindow,p047ClockSelect,p047ClockDrop,p047ClockCancel,type P047Clock} from './nms-l02-p047-clock-v1';
import {p047DecodeAudio} from './nms-l02-p047-audio-decode-v1';
import type {P047AudioDomain} from './nms-l02-p047-audio-pcm-v1';
import type {P047CardId} from './nms-l02-p047-practice-v1';
function p047ClockDomain(c:P047Clock){return p047ClockWindow(c)?.domain??null;}
/** Three source streams only. No event/click effect exists in this source.
 * The host polls snapshot for visual/silent phases. Audio nodes also notify onended.
 */
export interface P047AudioDependencies {
  read: (domain: P047AudioDomain, signal: AbortSignal) => Promise<ArrayBuffer>;
  changed: () => void;
  createContext?: () => AudioContext;
  decode?: typeof p047DecodeAudio;
}
export class P047SourceAudio {
  private clock;
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private node: AudioBufferSourceNode | null = null;
  private buffers = new Map<P047AudioDomain, AudioBuffer>();
  private pending: AbortController | null = null;
  private ticket = 0;
  private phase: 'paused' | 'loading' | 'playing' | 'failed' | 'closed' = 'paused';
  private failure: string | null = null;
  private modal = false;
  private volume = .8;
  private narration = true;
  constructor(private readonly deps: P047AudioDependencies, seed = 0) { this.clock = p047ClockInitial(seed); }
  private emit() { if (this.phase !== 'closed') this.deps.changed(); }
  private cancel() { this.ticket++; this.pending?.abort(); this.pending = null; }
  private stopNode() {
    const node = this.node; this.node = null;
    if (node) { node.onended = null; try { node.stop(); } catch {} node.disconnect(); }
  }
  private sync(autoplay=true) {
    if(this.phase!=='playing'||!this.context)return;
    this.clock=p047ClockSync(this.clock,this.context.currentTime,this.clock.state.phaseToken);
    if(this.clock.anchor===null){
      this.stopNode();this.phase='paused';
      if(autoplay&&!this.modal&&p047ClockDuration(this.clock)>0)void this.play();
    }
  }
  private startNode() {
    this.stopNode();
    const domain = p047ClockDomain(this.clock), buffer = domain ? this.buffers.get(domain) : null;
    if (!this.narration || !buffer || !this.context || !this.gain || this.phase !== 'playing' ) return;
    const node = this.context.createBufferSource(); node.buffer = buffer; node.connect(this.gain); this.node = node;
    node.onended = () => { if (this.node === node) { this.node = null; node.disconnect(); this.sync(); this.emit(); } };
    const window=p047ClockWindow(this.clock);
    const offset=(window?window.start/buffer.sampleRate:0)+this.clock.elapsed;
    const end=window?window.end/buffer.sampleRate:buffer.duration;
    if(offset>=end){this.stopNode();return;}
    node.start(0,offset,end-offset);
  }
  snapshot() {
    this.sync();
    return Object.freeze({ phase: this.phase, state: Object.freeze({ ...this.clock.state, frame: p047ClockMainFrame(this.clock), celebrationFrame:p047ClockCelebrationFrame(this.clock), playing: this.phase === 'playing', completed: this.clock.state.phase === 'complete' }),
      audioDomain: p047ClockDomain(this.clock), wrongBranch:this.clock.state.wrongBranch, elapsed: this.clock.elapsed, modal: this.modal, volume: this.volume, narrationEnabled: this.narration, failure: this.failure });
  }
  async play() {
    if (this.phase === 'closed' || this.phase === 'loading' || this.phase === 'playing' || this.modal) return;
    const domain = p047ClockDomain(this.clock); if (this.clock.elapsed>=p047ClockDuration(this.clock)) return;
    const ac = new AbortController(), ticket = ++this.ticket;
    this.pending = ac; this.phase = 'loading'; this.failure = null; this.emit();
    try {
      if (!this.context) {
        this.context = this.deps.createContext?.() ?? new AudioContext({ sampleRate: 22050 });
        this.gain = this.context.createGain(); this.gain.gain.value = this.volume; this.gain.connect(this.context.destination);
      }
      const context = this.context; await context.resume(); ac.signal.throwIfAborted();
      if (domain && !this.buffers.has(domain)) {
        const encoded = await this.deps.read(domain, ac.signal); ac.signal.throwIfAborted();
        const buffer = await (this.deps.decode ?? p047DecodeAudio)(context, domain, encoded, ac.signal); ac.signal.throwIfAborted();
        if (ticket !== this.ticket) return;
        this.buffers.set(domain, buffer);
      }
      if (ticket !== this.ticket) return;
      this.pending = null; this.clock = p047ClockPlay(this.clock, context.currentTime);
      this.phase = this.clock.anchor === null ? 'paused' : 'playing'; this.startNode(); this.emit();
    } catch (error) {
      if (ticket !== this.ticket || ac.signal.aborted) return;
      this.pending = null; this.stopNode(); this.clock = p047ClockPause(this.clock, this.context?.currentTime ?? 0);
      this.phase = 'failed'; this.failure = error instanceof Error ? error.message : 'P047_AUDIO_FAILURE'; this.emit();
    }
  }
  pause() {
    if (this.phase === 'closed') return;
    this.sync(false); this.cancel(); this.clock = p047ClockPause(this.clock, this.context?.currentTime ?? 0); this.stopNode();
    if (this.phase !== 'failed') this.phase = 'paused'; this.emit();
  }
  private change(update:(clock:P047Clock)=>P047Clock,autoplay=false) {
    if(this.phase==='closed'||this.phase==='failed'||this.modal)return;
    this.sync();const next=update(this.clock);if(next===this.clock)return;
    this.cancel();this.stopNode();this.clock=next;this.phase='paused';this.emit();
    if(autoplay)void this.play();
  }
  select(id:P047CardId){this.change(c=>p047ClockSelect(c,id));}
  drop(tick:number|null){this.change(c=>p047ClockDrop(c,tick),true);}
  cancelSelection(){this.change(p047ClockCancel);}
  help(open:boolean){this.change(c=>p047ClockHelp(c,open));}
  setModal(open: boolean) { if (this.phase === 'closed' || this.modal === open) return; this.modal = open; if (open) this.pause(); else this.emit(); }
  replay() {
    if (this.phase === 'closed') return;
    this.cancel(); this.stopNode(); this.clock = p047ClockReplay(this.clock); this.modal = false; this.phase = 'paused'; this.failure = null; this.emit();
  }
  setVolume(volume: number) { if (!Number.isFinite(volume) || volume < 0 || volume > 1) throw Error('P047_VOLUME'); if (this.phase === 'closed') return; this.volume = volume; if (this.gain) this.gain.gain.value = volume; this.emit(); }
  setNarration(enabled: boolean) { if (this.phase === 'closed') return; this.sync(); this.narration = enabled; this.startNode(); this.emit(); }
  async close() {
    if (this.phase === 'closed') return;
    this.cancel(); this.clock = p047ClockPause(this.clock, this.context?.currentTime ?? 0); this.stopNode(); this.phase = 'closed';
    this.gain?.disconnect(); this.gain = null; this.buffers.clear(); const context = this.context; this.context = null; await context?.close();
  }
}
