/** P062 source-bound audio transport. Bindings are generated from the exact SWF raw index.
 * This modern full-buffer scheduling candidate preserves MP3 bytes, empty blocks,
 * and signed seek metadata without applying trim or adding PCM silence. */
import {P062_AUDIO_SOURCE,P062_AUDIO_DOMAINS,P062_FEEDBACK_TIMINGS,
  P062_MAIN_STOP_FRAMES,P062_MAIN_DOMAIN,
  type P062AudioDomainId,type P062AudioBinding,
} from './generated/nms-l02-p062-audio-v1';
export {P062_AUDIO_SOURCE,P062_AUDIO_DOMAINS,P062_FEEDBACK_TIMINGS,
  P062_MAIN_STOP_FRAMES,P062_MAIN_DOMAIN};
export type {P062AudioDomainId,P062AudioBinding};

export type P062AudioPhase = 'paused' | 'loading' | 'playing' | 'ended' | 'error' | 'closed';

export interface P062AudioSnapshot {
  phase: P062AudioPhase;
  domain: P062AudioDomainId | null;
  frame: number;
  fromFrame: number | null;
  toFrame: number | null;
  sourceSample: number;
  atBoundary: boolean;
  audioPlaying: boolean;
  volume: number;
  error: string | null;
}

export interface P062AudioOptions {
  /** This reader must enforce the binding's exact URL, byte length, SHA-256 and decode. */
  readVerified: (binding: P062AudioBinding, signal: AbortSignal,
    context: AudioContext) => Promise<AudioBuffer>;
  createContext?: () => AudioContext;
  onChange?: (snapshot: P062AudioSnapshot) => void;
}

const SAMPLE_COUNTS = [0, 1728, 2304, 3456] as const;
const fail = (detail: string): never => { throw Error(`P062_AUDIO_${detail}`); };
const finiteFrame = (frame: number): boolean => Number.isSafeInteger(frame) && frame >= 1;

/** Exact prefix of declared source samples at a local frame boundary. A frame
 * after the final stream block maps to EOF. This is a modern full-buffer
 * proposal: signed seeks and empty blocks do not cause trim or inserted PCM. */
export function p062SourceSampleAtFrame(id: P062AudioDomainId, frame: number): number {
  const binding = P062_AUDIO_DOMAINS[id];
  if (!binding || !finiteFrame(frame) || frame > (id === P062_MAIN_DOMAIN ? 834 : binding.lastBlockFrame + 1))
    fail('FRAME');
  let sample = 0;
  const count = Math.max(0, Math.min(binding.blockCodes.length, frame - binding.firstBlockFrame));
  for (let i = 0; i < count; i++) {
    const code = binding.blockCodes.charCodeAt(i) - 48;
    if (code < 0 || code >= SAMPLE_COUNTS.length) fail('INDEX');
    sample += SAMPLE_COUNTS[code];
  }
  if (sample > binding.decodedSamples) fail('INDEX');
  return sample;
}

interface WindowState {
  id: P062AudioDomainId;
  fromFrame: number;
  toFrame: number;
  startSample: number;
  endSample: number;
  elapsedSeconds: number;
  sourceSample: number;
  atBoundary: boolean;
}

const windowKey = (id: P062AudioDomainId, from: number, to: number): string => `${id}:${from}:${to}`;

/** The page state chooses a domain and branch. This controller only owns one
 * AudioContext/node, verified decoded buffers, and exact source sample windows.
 * Visual frames use the source 12 fps clock, including main frames 1–8 before
 * MP3 starts and frames 829–834 after MP3 EOF. Hard node duration is scheduled
 * at each authored stop; frame clock completion is polled by the host. */
export class P062AudioController {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private node: AudioBufferSourceNode | null = null;
  private readonly buffers = new Map<P062AudioDomainId, AudioBuffer>();
  private readonly saved = new Map<string, WindowState>();
  private selected: WindowState | null = null;
  private anchorTime: number | null = null;
  private audioWhen: number | null = null;
  private audioAnchorSample = 0;
  private abort: AbortController | null = null;
  private pending: Promise<boolean> | null = null;
  private generation = 0;
  private phase: P062AudioPhase = 'paused';
  private volume = 1;
  private error: string | null = null;
  private closing: Promise<void> | null = null;

  constructor(private readonly options: P062AudioOptions) {
    if (typeof options.readVerified !== 'function') fail('READER');
  }

  private readonly contextStateChanged = (): void => {
    if (this.phase !== 'closed' && this.context && this.context.state !== 'running' &&
      (this.phase === 'playing' || this.phase === 'loading')) this.pause();
  };

  private ensureContext(): AudioContext {
    if (this.context) {
      if (this.context.state === 'closed') fail('CONTEXT_CLOSED');
      return this.context;
    }
    const context = this.options.createContext?.() ?? new AudioContext({sampleRate: P062_AUDIO_SOURCE.sampleRate});
    try {
      if (context.sampleRate !== P062_AUDIO_SOURCE.sampleRate || context.state === 'closed')
        fail('CONTEXT_RATE');
      const gain = context.createGain();
      gain.gain.value = this.volume;
      gain.connect(context.destination);
      context.addEventListener('statechange', this.contextStateChanged);
      this.context = context;
      this.gain = gain;
      return context;
    } catch (error) {
      void context.close().catch(() => {});
      throw error;
    }
  }

  private stopNode(): void {
    const node = this.node;
    this.node = null;
    this.audioWhen = null;
    if (!node) return;
    node.onended = null;
    try { node.stop(); } catch { /* Natural end or stale node. */ }
    try { node.disconnect(); } catch { /* Closing context owns graph. */ }
  }

  private runningElapsed(window: WindowState): number {
    return this.anchorTime === null || !this.context ? window.elapsedSeconds :
      window.elapsedSeconds + Math.max(0, this.context.currentTime - this.anchorTime);
  }

  private runningSample(window: WindowState): number {
    if (this.anchorTime === null || this.audioWhen === null || !this.context)
      return window.sourceSample;
    return Math.min(window.endSample, this.audioAnchorSample + Math.max(0,
      Math.floor((this.context.currentTime - this.audioWhen) * P062_AUDIO_SOURCE.sampleRate + 1e-8)));
  }

  private capture(): void {
    const window = this.selected;
    if (!window || this.anchorTime === null) return;
    window.elapsedSeconds = this.runningElapsed(window);
    window.sourceSample = this.runningSample(window);
    this.anchorTime = null;
    this.audioWhen = null;
  }

  private windowDuration(window: WindowState): number {
    const visual = (window.toFrame - window.fromFrame) / P062_AUDIO_SOURCE.fps;
    const firstAudioDelay = Math.max(0, (P062_AUDIO_DOMAINS[window.id].firstBlockFrame - window.fromFrame) /
      P062_AUDIO_SOURCE.fps);
    const audio = firstAudioDelay + (window.endSample - window.startSample) / P062_AUDIO_SOURCE.sampleRate;
    return Math.max(visual, audio);
  }

  private finishIfDue(): void {
    const window = this.selected;
    if (this.phase !== 'playing' || !window || this.anchorTime === null) return;
    if (this.runningElapsed(window) + 1e-7 < this.windowDuration(window) ||
      this.runningSample(window) < window.endSample) return;
    window.elapsedSeconds = this.windowDuration(window);
    window.sourceSample = window.endSample;
    window.atBoundary = true;
    this.anchorTime = null;
    this.stopNode();
    this.phase = window.id === P062_MAIN_DOMAIN && window.toFrame !== 834 ? 'paused' : 'ended';
    this.options.onChange?.(this.rawSnapshot());
  }

  private rawSnapshot(): P062AudioSnapshot {
    const window = this.selected;
    const elapsed = window ? this.runningElapsed(window) : 0;
    const frame = window ? Math.min(window.toFrame,
      Math.floor(window.fromFrame + elapsed * P062_AUDIO_SOURCE.fps + 1e-8)) : 1;
    return {phase: this.phase, domain: window?.id ?? null, frame,
      fromFrame: window?.fromFrame ?? null, toFrame: window?.toFrame ?? null,
      sourceSample: window ? this.runningSample(window) : 0,
      atBoundary: !!window?.atBoundary, audioPlaying: this.node !== null,
      volume: this.volume, error: this.error};
  }

  snapshot(): P062AudioSnapshot {
    if (this.phase === 'playing' && this.context?.state !== 'running') this.pause();
    this.finishIfDue();
    return this.rawSnapshot();
  }

  private emit(): void { this.options.onChange?.(this.rawSnapshot()); }

  private cancel(): void {
    this.generation++;
    this.abort?.abort();
    this.abort = null;
    this.pending = null;
  }

  private select(id: P062AudioDomainId, fromFrame: number, toFrame: number,
    restart: boolean): WindowState {
    const binding = P062_AUDIO_DOMAINS[id];
    if (!binding || !finiteFrame(fromFrame) || !finiteFrame(toFrame) || fromFrame >= toFrame ||
      (id === P062_MAIN_DOMAIN &&
        (P062_MAIN_STOP_FRAMES.find(stop => stop > fromFrame) !== toFrame || fromFrame > 833)) ||
      (id !== P062_MAIN_DOMAIN && (fromFrame !== 2 || toFrame !== binding.lastBlockFrame + 1)))
      fail('WINDOW');
    const key = windowKey(id, fromFrame, toFrame);
    if (this.selected && windowKey(this.selected.id, this.selected.fromFrame, this.selected.toFrame) === key &&
      !restart) return this.selected;
    this.capture();
    if (this.selected) this.saved.set(windowKey(this.selected.id, this.selected.fromFrame,
      this.selected.toFrame), this.selected);
    this.cancel();
    this.stopNode();
    const prior = restart ? null : this.saved.get(key);
    const selected = prior ?? {id, fromFrame, toFrame,
      startSample: p062SourceSampleAtFrame(id, fromFrame),
      endSample: p062SourceSampleAtFrame(id, toFrame),
      elapsedSeconds: 0, sourceSample: p062SourceSampleAtFrame(id, fromFrame), atBoundary: false};
    this.selected = selected;
    this.phase = 'paused';
    this.error = null;
    this.emit();
    return selected;
  }

  private verifiedBuffer(binding: P062AudioBinding, buffer: AudioBuffer): AudioBuffer {
    if (buffer.sampleRate !== binding.sampleRate || buffer.numberOfChannels !== binding.channels ||
      buffer.length !== binding.decodedSamples) fail('DECODE');
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      const samples = buffer.getChannelData(i);
      if (samples.length !== binding.decodedSamples || !samples.every(Number.isFinite)) fail('DECODE');
    }
    return buffer;
  }

  /** All frame bounds are local to the requested sprite. The stop frame is
   * exclusive for audio; visual state reaches and holds that authored frame.
   * A repeated call resumes a paused window; restart explicitly begins again. */
  playDomain(id: P062AudioDomainId, fromFrame: number, toFrame: number,
    options: {restart?: boolean} = {}): Promise<boolean> {
    if (this.phase === 'closed') return Promise.resolve(false);
    const window = this.select(id, fromFrame, toFrame, options.restart === true);
    if (window.atBoundary) return Promise.resolve(false);
    if (this.phase === 'playing') return Promise.resolve(true);
    if (this.pending) return this.pending;
    const binding = P062_AUDIO_DOMAINS[id];
    const token = ++this.generation;
    const current = () => this.phase !== 'closed' && token === this.generation && this.selected === window;
    const abort = new AbortController();
    this.abort = abort;
    this.error = null;
    this.phase = 'loading';
    const pending = (async (): Promise<boolean> => {
      try {
        const context = this.ensureContext();
        await context.resume();
        if (!current()) return false;
        if (context.state !== 'running') fail('CONTEXT_NOT_RUNNING');
        const buffer = this.buffers.get(id) ?? this.verifiedBuffer(binding,
          await this.options.readVerified(binding, abort.signal, context));
        if (!current()) return false;
        this.buffers.set(id, this.verifiedBuffer(binding, buffer));
        if (context.state !== 'running') { this.pause(); return false; }
        const now = context.currentTime;
        if (window.sourceSample < window.endSample) {
          const delay = Math.max(0, (binding.firstBlockFrame - window.fromFrame) /
            P062_AUDIO_SOURCE.fps - window.elapsedSeconds);
          const when = now + delay;
          const node = context.createBufferSource();
          node.buffer = buffer;
          node.loop = false;
          try {
            node.connect(this.gain!);
            node.start(when, window.sourceSample / P062_AUDIO_SOURCE.sampleRate,
              (window.endSample - window.sourceSample) / P062_AUDIO_SOURCE.sampleRate);
          } catch (error) {
            try { node.disconnect(); } catch { /* Unstarted node. */ }
            throw error;
          }
          if (!current()) {
            node.onended = null;
            try { node.stop(); } catch { /* Stale node. */ }
            try { node.disconnect(); } catch { /* Stale node. */ }
            return false;
          }
          this.node = node;
          this.audioWhen = when;
          this.audioAnchorSample = window.sourceSample;
          node.onended = () => {
            if (!current() || this.node !== node) return;
            this.node = null;
            this.audioWhen = null;
            window.sourceSample = window.endSample;
            try { node.disconnect(); } catch { /* Natural end. */ }
            this.finishIfDue();
            this.emit();
          };
        }
        this.anchorTime = now;
        this.phase = 'playing';
        this.emit();
        return true;
      } catch (error) {
        if (!current()) return false;
        this.stopNode();
        const message = error instanceof Error ? error.message : '';
        this.error = /^P062_AUDIO_[A-Z_]+$/u.test(message) ? message : 'P062_AUDIO_LOAD';
        this.phase = 'error';
        this.emit();
        return false;
      } finally {
        if (current()) {
          this.abort = null;
          this.pending = null;
          this.emit();
        }
      }
    })();
    this.pending = pending;
    this.emit();
    return pending;
  }

  /** Resume the selected source window without converting its subframe sample
   * cursor to a rounded visual frame. Requires an explicit host action. */
  resume(): Promise<boolean> {
    const window = this.selected;
    return window ? this.playDomain(window.id, window.fromFrame, window.toFrame) : Promise.resolve(false);
  }

  pause(): void {
    if (this.phase === 'closed') return;
    this.capture();
    this.cancel();
    this.stopNode();
    if (this.phase !== 'error' && this.phase !== 'ended') this.phase = 'paused';
    this.emit();
  }

  reset(): void {
    if (this.phase === 'closed') return;
    this.pause();
    this.saved.clear();
    this.selected = null;
    this.error = null;
    this.phase = 'paused';
    this.emit();
  }

  setVolume(volume: number): void {
    if (this.phase === 'closed') fail('CLOSED');
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) fail('VOLUME');
    this.volume = volume;
    if (this.gain) this.gain.gain.value = volume;
    this.emit();
  }

  close(): Promise<void> {
    if (this.closing) return this.closing;
    this.pause();
    this.phase = 'closed';
    this.context?.removeEventListener('statechange', this.contextStateChanged);
    try { this.gain?.disconnect(); } catch { /* Context close owns graph. */ }
    this.buffers.clear();
    this.saved.clear();
    this.closing = this.context?.close() ?? Promise.resolve();
    this.emit();
    return this.closing;
  }
}
