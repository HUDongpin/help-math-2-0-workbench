import {P005_AUDIO_SOURCE as source} from './alg-l12-p005-audio-decode';

/** Unregistered source-sample transport. No SWF frame-to-sample policy is
 * implied. Caller supplies a hash-verified decode and transfers context ownership.
 * Muted by default; lesson/voice acceptance remains independent of playback. */
export class P005AudioTransport {
  private node: AudioBufferSourceNode | null = null;
  private readonly gain: GainNode;
  private generation = 0;
  private starting = false;
  private closed = false;
  private startSample = 0;
  private endSample: number = source.decodedSamples;
  private sample = 0;
  private anchor: number | null = null;
  private volume = 0;
  private closing: Promise<void> | null = null;

  constructor(private readonly context: AudioContext, private readonly buffer: AudioBuffer) {
    if (context.sampleRate !== source.sampleRate || context.state === 'closed' ||
      buffer.sampleRate !== source.sampleRate || buffer.numberOfChannels !== 1 || buffer.length !== source.decodedSamples)
      throw Error('P005_AUDIO_METADATA');
    this.gain = context.createGain();
    this.gain.gain.value = 0;
    this.gain.connect(context.destination);
  }

  snapshot() {
    const sample = this.position();
    const phase = this.closed ? 'closed' : this.starting ? 'starting' :
      sample === this.endSample ? 'ended' : this.node ? 'playing' : 'paused';
    return {phase, sample, startSample: this.startSample, endSample: this.endSample, volume: this.volume} as const;
  }

  private position() {
    const advanced = this.anchor === null ? 0 : Math.floor(Math.max(0, this.context.currentTime - this.anchor) * source.sampleRate + 1e-7);
    return Math.min(this.endSample, this.sample + advanced);
  }

  private detach() {
    const node = this.node;
    this.node = null;
    this.anchor = null;
    if (node) {node.onended = null; try {node.stop();} finally {node.disconnect();}}
  }

  pause() {
    if (this.closed) return;
    this.sample = this.position();
    this.generation++;
    this.starting = false;
    this.detach();
  }

  setWindow(startSample: number, endSample: number) {
    if (!Number.isSafeInteger(startSample) || !Number.isSafeInteger(endSample) ||
      startSample < 0 || endSample <= startSample || endSample > source.decodedSamples)
      throw Error('P005_AUDIO_WINDOW');
    if (this.closed) throw Error('P005_AUDIO_CLOSED');
    this.pause();
    this.startSample = startSample; this.endSample = endSample; this.sample = startSample;
  }

  seek(sample: number) {
    if (!Number.isSafeInteger(sample) || sample < this.startSample || sample > this.endSample)
      throw Error('P005_AUDIO_SEEK');
    if (this.closed) throw Error('P005_AUDIO_CLOSED');
    this.pause(); this.sample = sample;
  }

  setVolume(volume: number) {
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) throw Error('P005_AUDIO_VOLUME');
    if (this.closed) throw Error('P005_AUDIO_CLOSED');
    this.volume = volume; this.gain.gain.value = volume;
  }

  async play(): Promise<boolean> {
    if (this.closed) return false;
    if (this.node && this.position() < this.endSample) return true;
    this.pause();
    if (this.sample === this.endSample) return false;
    const generation = this.generation;
    this.starting = true;
    const current = () => !this.closed && this.generation === generation;
    try {
      await this.context.resume();
      if (!current()) return false;
      if (this.context.state !== 'running') throw Error('P005_AUDIO_CONTEXT_NOT_RUNNING');
      const node = this.context.createBufferSource();
      node.buffer = this.buffer;
      node.loop = false;
      const anchor = this.context.currentTime;
      try {
        node.connect(this.gain);
        node.start(anchor, this.sample / source.sampleRate, (this.endSample - this.sample) / source.sampleRate);
      } catch (error) {node.disconnect(); throw error;}
      this.node = node;
      this.anchor = anchor;
      node.onended = () => {
        if (!current() || this.node !== node) return;
        this.sample = this.endSample; this.anchor = null; this.node = null;
        node.onended = null; node.disconnect();
      };
      return true;
    } catch (error) {if (!current()) return false; throw error;}
    finally {if (current()) this.starting = false;}
  }

  async replay(): Promise<boolean> {
    if (this.closed) return false;
    this.seek(this.startSample);
    return this.play();
  }

  close(): Promise<void> {
    if (this.closing) return this.closing;
    this.pause(); this.closed = true;
    this.gain.disconnect();
    this.closing = this.context.close();
    return this.closing;
  }
}
