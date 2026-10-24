import {P006_AUDIO_SOURCE as source} from './alg-l12-p006-audio-decode';
import {frameToTimelineSample, P006_AUDIO_RUNS, P006_AUDIO_SCHEDULE, timelineSampleToFrame} from './alg-l12-p006-audio-schedule';

/** Owns the supplied context. Playback remains an unregistered candidate. */
export class P006AudioTransport {
  private readonly gain: GainNode;
  private readonly nodes = new Set<AudioBufferSourceNode>();
  private generation = 0;
  private starting = false;
  private closed = false;
  private sample = 0;
  private anchorTime: number | null = null;
  private anchorSample = 0;
  private volume = 0;
  private closing: Promise<void> | null = null;
  private readonly reconcileContext = () => {
    // An external interruption must not silently resume scheduled audio later.
    // A pending explicit resume has no anchor yet and is handled by play().
    if (!this.closed && this.anchorTime !== null && this.context.state !== 'running') this.pause();
  };

  constructor(private readonly context: AudioContext, private readonly buffer: AudioBuffer) {
    if (context.sampleRate !== source.sampleRate || context.state === 'closed' ||
      buffer.sampleRate !== source.sampleRate || buffer.numberOfChannels !== 1 ||
      buffer.length !== source.decodedSamples) throw Error('P006_AUDIO_METADATA');
    this.gain = context.createGain();
    this.gain.gain.value = 0;
    this.gain.connect(context.destination);
    context.addEventListener('statechange', this.reconcileContext);
  }

  private position(): number {
    if (this.anchorTime === null) return this.sample;
    const elapsed = Math.max(0, this.context.currentTime - this.anchorTime);
    return Math.min(P006_AUDIO_SCHEDULE.terminalTimelineSample,
      this.anchorSample + elapsed * source.sampleRate);
  }

  private dispose(node: AudioBufferSourceNode, stop: boolean) {
    node.onended = null;
    try { if (stop) node.stop(); } finally { node.disconnect(); }
  }

  private detach() {
    for (const node of this.nodes) this.dispose(node, true);
    this.nodes.clear();
    this.anchorTime = null;
  }

  private finishAtEnd() {
    if (this.anchorTime !== null && this.position() >= P006_AUDIO_SCHEDULE.terminalTimelineSample) {
      this.sample = P006_AUDIO_SCHEDULE.terminalTimelineSample;
      this.detach();
    }
  }

  snapshot() {
    this.reconcileContext();
    this.finishAtEnd();
    const timelineSample = this.position();
    const phase = this.closed ? 'closed' : this.starting ? 'starting' :
      timelineSample === P006_AUDIO_SCHEDULE.terminalTimelineSample ? 'ended' :
      this.anchorTime !== null ? 'playing' : 'paused';
    return {phase, timelineSample, frame: timelineSampleToFrame(timelineSample), volume: this.volume} as const;
  }

  pause() {
    if (this.closed) return;
    this.sample = this.position();
    this.generation++;
    this.starting = false;
    this.detach();
  }

  seekFrame(frame: number) {
    const sample = frameToTimelineSample(frame);
    if (this.closed) throw Error('P006_AUDIO_CLOSED');
    this.pause();
    this.sample = sample;
  }

  setVolume(volume: number) {
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) throw Error('P006_AUDIO_VOLUME');
    if (this.closed) throw Error('P006_AUDIO_CLOSED');
    this.volume = volume;
    this.gain.gain.value = volume;
  }

  async play(): Promise<boolean> {
    if (this.closed) return false;
    this.reconcileContext();
    this.finishAtEnd();
    if (this.anchorTime !== null) return true;
    this.pause();
    if (this.sample === P006_AUDIO_SCHEDULE.terminalTimelineSample) return false;
    const generation = this.generation;
    const current = () => !this.closed && this.generation === generation;
    this.starting = true;
    try {
      await this.context.resume();
      if (!current()) return false;
      if (this.context.state !== 'running') throw Error('P006_AUDIO_CONTEXT_NOT_RUNNING');
      const anchor = this.context.currentTime;
      const scheduled: AudioBufferSourceNode[] = [];
      try {
        for (const run of P006_AUDIO_RUNS) {
          const timelineStart = Math.max(this.sample, run.timelineStartSample);
          const sourceStart = run.sourceStartSample + timelineStart - run.timelineStartSample;
          if (sourceStart >= run.sourceEndSample) continue;
          const node = this.context.createBufferSource();
          node.buffer = this.buffer;
          node.loop = false;
          try {
            node.connect(this.gain);
            node.start(anchor + (timelineStart - this.sample) / source.sampleRate,
              sourceStart / source.sampleRate, (run.sourceEndSample - sourceStart) / source.sampleRate);
          } catch (error) {node.disconnect(); throw error;}
          scheduled.push(node);
        }
      } catch (error) {
        for (const node of scheduled) this.dispose(node, true);
        throw error;
      }
      if (!current()) {
        for (const node of scheduled) this.dispose(node, true);
        return false;
      }
      for (const node of scheduled) {
        this.nodes.add(node);
        node.onended = () => {
          if (!current() || !this.nodes.delete(node)) return;
          this.dispose(node, false);
        };
      }
      this.anchorSample = this.sample;
      this.anchorTime = anchor;
      return true;
    } catch (error) {if (!current()) return false; throw error;}
    finally {if (current()) this.starting = false;}
  }

  async replay(): Promise<boolean> {
    if (this.closed) return false;
    this.seekFrame(1);
    return this.play();
  }

  close(): Promise<void> {
    if (this.closing) return this.closing;
    this.pause();
    this.closed = true;
    this.context.removeEventListener('statechange', this.reconcileContext);
    this.gain.disconnect();
    this.closing = this.context.close();
    return this.closing;
  }
}
