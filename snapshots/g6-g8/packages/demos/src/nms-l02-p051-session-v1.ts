import {P051AudioTransport, type P051TransportDependencies} from './nms-l02-p051-audio-transport-v1';
import {p051PhaseWindow} from './nms-l02-p051-audio-window-v1';
import {p051ClockInitial, p051ClockPlay, p051ClockPause, p051ClockSync, p051ClockEvent, p051ClockDuration, p051ClockMainFrame} from './nms-l02-p051-clock-v1';
import {p051Reduce, type P051Event} from './nms-l02-p051-practice-v1';
type Transport = Pick<P051AudioTransport, 'play' | 'resumeClock' | 'pause' | 'stop' | 'close' | 'setVolume' | 'currentTime'>;
/** Own source progression. Audio onended does not mutate exercise state. */
export class P051Session {
  private clock = p051ClockInitial();
  private audio: Transport;
  private operation = 0;
  private closed = false;
  private running = false;
  private loading = false;
  private failure: string | null = null;
  private volume = .8;
  private narrationEnabled = true;
  constructor(deps: P051TransportDependencies, transport?: Transport) {this.audio = transport ?? new P051AudioTransport(deps);}
  snapshot() {return {state: this.clock.state, frame: p051ClockMainFrame(this.clock), elapsed: this.clock.elapsed,
    running: this.running, loading: this.loading, closed: this.closed, failure: this.failure, narrationEnabled: this.narrationEnabled};}
  async play() {
    if (this.closed || this.loading || this.running || this.clock.elapsed >= p051ClockDuration(this.clock)) return;
    const window = p051PhaseWindow(this.clock.state);
    if (!window && this.clock.state.phase !== 'completion-feedback') return;
    const operation = ++this.operation; this.loading = true; this.failure = null;
    try {
      const started = await (window ? this.audio.play(window, this.clock.elapsed) : this.audio.resumeClock());
      if (this.closed || operation !== this.operation) return;
      if (!started) throw Error('P051_AUDIO_NOT_STARTED');
      this.clock = p051ClockPlay(this.clock, this.audio.currentTime()); this.running = this.clock.anchor !== null;
    } catch (error) {
      if (!this.closed && operation === this.operation) {
        this.failure = error instanceof Error ? error.message : 'P051_AUDIO_FAILED'; this.running = false; this.audio.stop();
      }
    } finally {if (operation === this.operation) this.loading = false;}
  }
  pause() {
    if (this.closed) return;
    this.operation++; this.loading = false;
    this.clock = p051ClockPause(this.clock, this.audio.currentTime()); this.audio.pause(); this.running = false;
  }
  async tick() {
    if (this.closed || !this.running) return;
    const token = this.clock.state.token;
    this.clock = p051ClockSync(this.clock, this.audio.currentTime());
    if (token !== this.clock.state.token) {this.audio.stop(); this.running = false; await this.play();}
    else if (this.clock.anchor === null) {this.audio.stop(); this.running = false;}
  }
  async event(event: P051Event) {
    if (this.closed || event.type === 'finish' || p051Reduce(this.clock.state, event) === this.clock.state) return;
    this.pause(); const previous = this.clock.state;
    this.clock = p051ClockEvent(this.clock, event, this.audio.currentTime());
    if (this.clock.state.token !== previous.token) this.audio.stop();
    if (event.type === 'replay') this.failure = null;
    if (this.clock.state !== previous) await this.play();
  }
  setVolume(value: number) {
    if (!Number.isFinite(value) || value < 0 || value > 1) throw Error('P051_VOLUME');
    this.volume = value; this.audio.setVolume(this.narrationEnabled ? value : 0);
  }
  setNarration(enabled: boolean) {this.narrationEnabled = enabled; this.audio.setVolume(enabled ? this.volume : 0);}
  async close() {if (this.closed) return; this.pause(); this.closed = true; await this.audio.close();}
}
