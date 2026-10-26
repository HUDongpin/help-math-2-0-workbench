import {P050AudioTransport, type P050TransportDependencies} from './nms-l02-p050-audio-transport-v1';
import {p050PhaseWindow} from './nms-l02-p050-audio-window-v1';
import {p050ClockInitial, p050ClockPlay, p050ClockPause, p050ClockSync, p050ClockEvent, p050ClockDuration, p050ClockMainFrame} from './nms-l02-p050-clock-v1';
import {p050Reduce, type P050Event} from './nms-l02-p050-practice-v1';
type Transport = Pick<P050AudioTransport, 'play' | 'resumeClock' | 'pause' | 'stop' | 'close' | 'setVolume' | 'currentTime'>;
/** Own source progression. Audio onended does not mutate exercise state. */
export class P050Session {
  private clock = p050ClockInitial();
  private audio: Transport;
  private operation = 0;
  private closed = false;
  private running = false;
  private loading = false;
  private failure: string | null = null;
  private volume = .8;
  private narrationEnabled = true;
  constructor(deps: P050TransportDependencies, transport?: Transport) {this.audio = transport ?? new P050AudioTransport(deps);}
  snapshot() {return {state: this.clock.state, frame: p050ClockMainFrame(this.clock), elapsed: this.clock.elapsed,
    running: this.running, loading: this.loading, closed: this.closed, failure: this.failure, narrationEnabled: this.narrationEnabled};}
  async play() {
    if (this.closed || this.loading || this.running || this.clock.state.helpOpen || this.clock.elapsed >= p050ClockDuration(this.clock)) return;
    const window = p050PhaseWindow(this.clock.state);
    if (!window && this.clock.state.phase !== 'completion-feedback') return;
    const operation = ++this.operation; this.loading = true; this.failure = null;
    try {
      const started = await (window ? this.audio.play(window, this.clock.elapsed) : this.audio.resumeClock());
      if (this.closed || operation !== this.operation) return;
      if (!started) throw Error('P050_AUDIO_NOT_STARTED');
      this.clock = p050ClockPlay(this.clock, this.audio.currentTime()); this.running = this.clock.anchor !== null;
    } catch (error) {
      if (!this.closed && operation === this.operation) {
        this.failure = error instanceof Error ? error.message : 'P050_AUDIO_FAILED'; this.running = false; this.audio.stop();
      }
    } finally {if (operation === this.operation) this.loading = false;}
  }
  pause() {
    if (this.closed) return;
    this.operation++; this.loading = false;
    this.clock = p050ClockPause(this.clock, this.audio.currentTime()); this.audio.pause(); this.running = false;
  }
  async tick() {
    if (this.closed || !this.running) return;
    const token = this.clock.state.token;
    this.clock = p050ClockSync(this.clock, this.audio.currentTime());
    if (token !== this.clock.state.token) {this.audio.stop(); this.running = false; await this.play();}
    else if (this.clock.anchor === null) {this.audio.stop(); this.running = false;}
  }
  async event(event: P050Event) {
    if (this.closed || event.type === 'finish' || p050Reduce(this.clock.state, event) === this.clock.state) return;
    this.pause(); const previous = this.clock.state;
    this.clock = p050ClockEvent(this.clock, event, this.audio.currentTime());
    if (this.clock.state.token !== previous.token) this.audio.stop();
    if (event.type === 'replay') this.failure = null;
    if (this.clock.state !== previous && !this.clock.state.helpOpen) await this.play();
  }
  setVolume(value: number) {
    if (!Number.isFinite(value) || value < 0 || value > 1) throw Error('P050_VOLUME');
    this.volume = value; this.audio.setVolume(this.narrationEnabled ? value : 0);
  }
  setNarration(enabled: boolean) {this.narrationEnabled = enabled; this.audio.setVolume(enabled ? this.volume : 0);}
  async close() {if (this.closed) return; this.pause(); this.closed = true; await this.audio.close();}
}
