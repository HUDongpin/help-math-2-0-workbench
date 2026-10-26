import { p045ClockInitial, p045ClockPlay, p045ClockPause, p045ClockSync, p045ClockDuration, p045ClockCheck, p045ClockClose, p045ClockNew, p045ClockHelp, type P045Clock, p045ClockReplay, p045ClockMainFrame } from './nms-l02-p045-clock-v1';
import { p045DecodeAudio } from './nms-l02-p045-audio-decode-v1';
import type { P045AudioDomain } from './nms-l02-p045-audio-pcm-v1';
import {p045WrongWindow,P045_FIXED_WINDOWS,P045_SOURCE_FEEDBACK_TIMING,type P045AudioWindow} from './nms-l02-p045-audio-windows-v1';
import {p045ClockInput} from './nms-l02-p045-clock-v1';
function p045ClockWindow(c:P045Clock):P045AudioWindow|null {
 switch(c.state.phase){case 'intro':return P045_FIXED_WINDOWS.intro;case 'continuation':return P045_FIXED_WINDOWS.continuation;case 'correct-feedback':return P045_FIXED_WINDOWS['correct-feedback'];case 'wrong-feedback':return p045WrongWindow(c.wrongBranch);default:return null;}
}
function p045ClockDomain(c:P045Clock){return p045ClockWindow(c)?.domain??null;}
export interface P045AudioDependencies {
  read: (domain: P045AudioDomain, signal: AbortSignal) => Promise<ArrayBuffer>;
  changed: () => void;
  createContext?: () => AudioContext;
  decode?: typeof p045DecodeAudio;
}
export class P045SourceAudio {
  private clock;
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private node: AudioBufferSourceNode | null = null;
  private effectNode: AudioBufferSourceNode | null = null;
  private effectPending: AbortController | null = null;
  private effectTicket = 0;
  private buffers = new Map<P045AudioDomain, AudioBuffer>();
  private pending: AbortController | null = null;
  private ticket = 0;
  private phase: 'paused' | 'loading' | 'playing' | 'failed' | 'closed' = 'paused';
  private failure: string | null = null;
  private modal = false;
  private volume = .8;
  private narration = true;
  constructor(private readonly deps: P045AudioDependencies, seed = 0) { this.clock = p045ClockInitial(seed,P045_SOURCE_FEEDBACK_TIMING); }
  private emit() { if (this.phase !== 'closed') this.deps.changed(); }
  private cancel() { this.ticket++; this.pending?.abort(); this.pending = null; this.stopEffect(); }
  private stopEffect() {
    this.effectTicket++; this.effectPending?.abort(); this.effectPending=null;
    const node=this.effectNode;this.effectNode=null;
    if(node){node.onended=null;try{node.stop();}catch{}node.disconnect();}
  }
  /** Source sprite8 click: an independent node sharing volume, never the lesson clock. */
  async clickEffect() {
    if(this.phase==='closed'||this.phase==='failed'||!this.narration)return;
    this.stopEffect();const ticket=this.effectTicket,ac=new AbortController();this.effectPending=ac;
    try {
      if(!this.context){
        this.context=this.deps.createContext?.()??new AudioContext({sampleRate:22050});
        this.gain=this.context.createGain();this.gain.gain.value=this.volume;this.gain.connect(this.context.destination);
      }
      const context=this.context;await context.resume();ac.signal.throwIfAborted();
      if(!this.buffers.has('8')){
        const encoded=await this.deps.read('8',ac.signal);ac.signal.throwIfAborted();
        const buffer=await(this.deps.decode??p045DecodeAudio)(context,'8',encoded,ac.signal);ac.signal.throwIfAborted();
        if(ticket!==this.effectTicket)return;this.buffers.set('8',buffer);
      }
      if(ticket!==this.effectTicket||!this.gain)return;
      this.effectPending=null;const node=context.createBufferSource();node.buffer=this.buffers.get('8')!;
      node.connect(this.gain);this.effectNode=node;
      node.onended=()=>{if(this.effectNode===node){this.effectNode=null;node.disconnect();}};
      node.start(0,0,node.buffer.duration);
    }catch(error){
      if(ticket!==this.effectTicket||ac.signal.aborted)return;
      this.effectPending=null;this.pause();this.phase='failed';this.failure=error instanceof Error?error.message:'P045_CLICK_AUDIO_FAILURE';this.emit();
    }
  }
  private stopNode() {
    const node = this.node; this.node = null;
    if (node) { node.onended = null; try { node.stop(); } catch {} node.disconnect(); }
  }
  private sync() {
    if (this.phase !== 'playing' || !this.context) return;
    const before = this.clock.state.phase;
    this.clock = p045ClockSync(this.clock, this.context.currentTime);
    if (this.clock.anchor === null) {
      this.stopNode(); this.phase = 'paused';
      // Reveal completion may start the source main continuation.
      if (before === 'answer-reveal' && this.clock.state.phase === 'continuation' && !this.modal) void this.play();
    }
  }
  private startNode() {
    this.stopNode();
    const domain = p045ClockDomain(this.clock), buffer = domain ? this.buffers.get(domain) : null;
    if (!this.narration || !buffer || !this.context || !this.gain || this.phase !== 'playing' ) return;
    const node = this.context.createBufferSource(); node.buffer = buffer; node.connect(this.gain); this.node = node;
    node.onended = () => { if (this.node === node) { this.node = null; node.disconnect(); this.sync(); this.emit(); } };
    const window=p045ClockWindow(this.clock);
    const offset=(window?window.start/buffer.sampleRate:0)+this.clock.elapsed;
    const end=window?window.end/buffer.sampleRate:buffer.duration;
    if(offset>=end){this.stopNode();return;}
    node.start(0,offset,end-offset);
  }
  snapshot() {
    this.sync();
    return Object.freeze({ phase: this.phase, state: Object.freeze({ ...this.clock.state, frame: p045ClockMainFrame(this.clock), playing: this.phase === 'playing', completed: this.clock.state.phase === 'complete' }),
      audioDomain: p045ClockDomain(this.clock), wrongBranch:this.clock.wrongBranch, elapsed: this.clock.elapsed, modal: this.modal, volume: this.volume, narrationEnabled: this.narration, failure: this.failure });
  }
  async play() {
    if (this.phase === 'closed' || this.phase === 'loading' || this.phase === 'playing' || this.modal) return;
    const domain = p045ClockDomain(this.clock); if (this.clock.elapsed>=p045ClockDuration(this.clock)) return;
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
        const buffer = await (this.deps.decode ?? p045DecodeAudio)(context, domain, encoded, ac.signal); ac.signal.throwIfAborted();
        if (ticket !== this.ticket) return;
        this.buffers.set(domain, buffer);
      }
      if (ticket !== this.ticket) return;
      this.pending = null; this.clock = p045ClockPlay(this.clock, context.currentTime);
      this.phase = this.clock.anchor === null ? 'paused' : 'playing'; this.startNode(); this.emit();
    } catch (error) {
      if (ticket !== this.ticket || ac.signal.aborted) return;
      this.pending = null; this.stopNode(); this.clock = p045ClockPause(this.clock, this.context?.currentTime ?? 0);
      this.phase = 'failed'; this.failure = error instanceof Error ? error.message : 'P045_AUDIO_FAILURE'; this.emit();
    }
  }
  pause() {
    if (this.phase === 'closed') return;
    this.sync(); this.cancel(); this.clock = p045ClockPause(this.clock, this.context?.currentTime ?? 0); this.stopNode();
    if (this.phase !== 'failed') this.phase = 'paused'; this.emit();
  }
  private change(update:(clock:P045Clock)=>P045Clock,autoplay=false) {
    if(this.phase==='closed'||this.phase==='failed'||this.modal)return;
    this.sync();const next=update(this.clock);if(next===this.clock)return;
    this.cancel();this.stopNode();this.clock=next;this.phase='paused';this.emit();
    if(autoplay)void this.play();
  }
  input(field:'numerator'|'denominator',value:string){this.change(c=>p045ClockInput(c,field,value));}
  check(){this.change(p045ClockCheck,true);}
  newWhole(){this.change(p045ClockNew);}
  closeFeedback(){this.change(p045ClockClose,true);}
  help(open:boolean){this.change(c=>p045ClockHelp(c,open));}
  setModal(open: boolean) { if (this.phase === 'closed' || this.modal === open) return; this.modal = open; if (open) this.pause(); else this.emit(); }
  replay() {
    if (this.phase === 'closed') return;
    this.cancel(); this.stopNode(); this.clock = p045ClockReplay(this.clock); this.modal = false; this.phase = 'paused'; this.failure = null; this.emit();
  }
  setVolume(volume: number) { if (!Number.isFinite(volume) || volume < 0 || volume > 1) throw Error('P045_VOLUME'); if (this.phase === 'closed') return; this.volume = volume; if (this.gain) this.gain.gain.value = volume; this.emit(); }
  setNarration(enabled: boolean) { if (this.phase === 'closed') return; this.sync(); this.narration = enabled; if(!enabled)this.stopEffect(); this.startNode(); this.emit(); }
  async close() {
    if (this.phase === 'closed') return;
    this.cancel(); this.clock = p045ClockPause(this.clock, this.context?.currentTime ?? 0); this.stopNode(); this.phase = 'closed';
    this.gain?.disconnect(); this.gain = null; this.buffers.clear(); const context = this.context; this.context = null; await context?.close();
  }
}
