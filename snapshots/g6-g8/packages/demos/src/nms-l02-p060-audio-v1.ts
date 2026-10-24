/** P060 source-bound MP3 domains. Full decoded bytes are retained. The compact
 * block code is the exact ordered declared-sample sequence from the pinned
 * raw index: 0=0, 1=1728, 2=2304, 3=3456 samples. SWF seek and empty
 * blocks are recorded but not interpreted as trim or inserted silence. */
export const P060_AUDIO_SOURCE = {
  rawIndexSha256: '5883a745fb6c5f69fc5ad8cd12cf6d94d616c3c03d0c056528a70bebf38d88ca',
  swfSha256: '80410162eebca2f85b9aaccec9c91c8d74250c0cba6051595579b4df206215c1',
  sampleRate: 22050,
  fps: 12,
} as const;

export const P060_AUDIO_DOMAINS = {
  'sprite-104': {"id":"sprite-104","urlPath":"/migration-assets/nms-l02-p060/sprite-104.mp3?sha256=cc86fd730e1738e0f1a19976fe0cbdd06b3f92eef3a291bdd3a13b84b83b57c0","sourceSwfSha256":"80410162eebca2f85b9aaccec9c91c8d74250c0cba6051595579b4df206215c1","bytes":28470,"sha256":"cc86fd730e1738e0f1a19976fe0cbdd06b3f92eef3a291bdd3a13b84b83b57c0","sampleRate":22050,"channels":1,"decodedSamples":126144,"firstBlockFrame":2,"lastBlockFrame":70,"mp3LatencySeek":1673,"negativeSeekBlocks":[],"blockCodes":"301111211111211112111121111211111211112111121111121111211112111121111"},
  'sprite-205': {"id":"sprite-205","urlPath":"/migration-assets/nms-l02-p060/sprite-205.mp3?sha256=770ce8a109fb78c238d218e479047529e8cb39f006f8c70747be376556e2a541","sourceSwfSha256":"80410162eebca2f85b9aaccec9c91c8d74250c0cba6051595579b4df206215c1","bytes":11570,"sha256":"770ce8a109fb78c238d218e479047529e8cb39f006f8c70747be376556e2a541","sampleRate":22050,"channels":1,"decodedSamples":51264,"firstBlockFrame":2,"lastBlockFrame":29,"mp3LatencySeek":1673,"negativeSeekBlocks":[],"blockCodes":"3011112111112111121111211112"},
  'sprite-217': {"id":"sprite-217","urlPath":"/migration-assets/nms-l02-p060/sprite-217.mp3?sha256=3506fcffbe07e726fd4cf1c750cd2641d2aa06f4ca14379b4407ea5843e4f0f0","sourceSwfSha256":"80410162eebca2f85b9aaccec9c91c8d74250c0cba6051595579b4df206215c1","bytes":11050,"sha256":"3506fcffbe07e726fd4cf1c750cd2641d2aa06f4ca14379b4407ea5843e4f0f0","sampleRate":22050,"channels":1,"decodedSamples":48960,"firstBlockFrame":2,"lastBlockFrame":28,"mp3LatencySeek":1673,"negativeSeekBlocks":[],"blockCodes":"301111211111211112111121111"},
  'sprite-245': {"id":"sprite-245","urlPath":"/migration-assets/nms-l02-p060/sprite-245.mp3?sha256=f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1","sourceSwfSha256":"80410162eebca2f85b9aaccec9c91c8d74250c0cba6051595579b4df206215c1","bytes":11050,"sha256":"f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1","sampleRate":22050,"channels":1,"decodedSamples":48960,"firstBlockFrame":2,"lastBlockFrame":28,"mp3LatencySeek":1673,"negativeSeekBlocks":[],"blockCodes":"301111211111211112111121111"},
  'sprite-258': {"id":"sprite-258","urlPath":"/migration-assets/nms-l02-p060/sprite-258.mp3?sha256=2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77","sourceSwfSha256":"80410162eebca2f85b9aaccec9c91c8d74250c0cba6051595579b4df206215c1","bytes":11960,"sha256":"2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77","sampleRate":22050,"channels":1,"decodedSamples":52992,"firstBlockFrame":3,"lastBlockFrame":31,"mp3LatencySeek":1673,"negativeSeekBlocks":[],"blockCodes":"30111121111121111211112111121"},
  'sprite-275': {"id":"sprite-275","urlPath":"/migration-assets/nms-l02-p060/sprite-275.mp3?sha256=3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7","sourceSwfSha256":"80410162eebca2f85b9aaccec9c91c8d74250c0cba6051595579b4df206215c1","bytes":11050,"sha256":"3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7","sampleRate":22050,"channels":1,"decodedSamples":48960,"firstBlockFrame":2,"lastBlockFrame":28,"mp3LatencySeek":1673,"negativeSeekBlocks":[],"blockCodes":"301111211111211112111121111"},
  'sprite-296': {"id":"sprite-296","urlPath":"/migration-assets/nms-l02-p060/sprite-296.mp3?sha256=c9502f3d979684587046242dc9022b8aa89e89c72688dfa4bc027858badd9e6e","sourceSwfSha256":"80410162eebca2f85b9aaccec9c91c8d74250c0cba6051595579b4df206215c1","bytes":12740,"sha256":"c9502f3d979684587046242dc9022b8aa89e89c72688dfa4bc027858badd9e6e","sampleRate":22050,"channels":1,"decodedSamples":56448,"firstBlockFrame":3,"lastBlockFrame":33,"mp3LatencySeek":1673,"negativeSeekBlocks":[],"blockCodes":"3011112111112111121111211112111"},
  'sprite-322': {"id":"sprite-322","urlPath":"/migration-assets/nms-l02-p060/sprite-322.mp3?sha256=70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b","sourceSwfSha256":"80410162eebca2f85b9aaccec9c91c8d74250c0cba6051595579b4df206215c1","bytes":11960,"sha256":"70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b","sampleRate":22050,"channels":1,"decodedSamples":52992,"firstBlockFrame":2,"lastBlockFrame":31,"mp3LatencySeek":1673,"negativeSeekBlocks":[{"frame":31,"seekSamples":-1953}],"blockCodes":"301111211111211112111121111210"},
  'sprite-354': {"id":"sprite-354","urlPath":"/migration-assets/nms-l02-p060/sprite-354.mp3?sha256=113258636df75e97cc83ceb37ed3f476453cf091834633480aaa6ebe63fd5875","sourceSwfSha256":"80410162eebca2f85b9aaccec9c91c8d74250c0cba6051595579b4df206215c1","bytes":11856,"sha256":"113258636df75e97cc83ceb37ed3f476453cf091834633480aaa6ebe63fd5875","sampleRate":22050,"channels":2,"decodedSamples":43776,"firstBlockFrame":2,"lastBlockFrame":25,"mp3LatencySeek":1674,"negativeSeekBlocks":[],"blockCodes":"301111211111211112111121"},
  'sprite-368': {"id":"sprite-368","urlPath":"/migration-assets/nms-l02-p060/sprite-368.mp3?sha256=7e9810de5390cdc982dac2795e046343157a6ad9fe4a2ab13e1020b401b2ad11","sourceSwfSha256":"80410162eebca2f85b9aaccec9c91c8d74250c0cba6051595579b4df206215c1","bytes":12350,"sha256":"7e9810de5390cdc982dac2795e046343157a6ad9fe4a2ab13e1020b401b2ad11","sampleRate":22050,"channels":1,"decodedSamples":54720,"firstBlockFrame":3,"lastBlockFrame":32,"mp3LatencySeek":1673,"negativeSeekBlocks":[],"blockCodes":"301111211111211112111121111211"},
  'sprite-391': {"id":"sprite-391","urlPath":"/migration-assets/nms-l02-p060/sprite-391.mp3?sha256=78a98c5d3158f1fd41c9fd874380fe2a4a239d786e231597886a94cd1d6b67d0","sourceSwfSha256":"80410162eebca2f85b9aaccec9c91c8d74250c0cba6051595579b4df206215c1","bytes":290940,"sha256":"78a98c5d3158f1fd41c9fd874380fe2a4a239d786e231597886a94cd1d6b67d0","sampleRate":22050,"channels":1,"decodedSamples":1289088,"firstBlockFrame":9,"lastBlockFrame":711,"mp3LatencySeek":1673,"negativeSeekBlocks":[{"frame":711,"seekSamples":-2158}],"blockCodes":"3011112111112111121111211112111112111121111211111211112111121111211111211112111121111121111211112111121111121111211112111112111121111211112111112111121111211111211112111121111211111211112111121111121111211112111121111121111211112111112111121111211112111112111121111211111211112111121111211111211112111121111121111211112111121111121111211112111121111121111211112111112111121111211112111112111121111211111211112111121111211111211112111121111121111211112111121111121111211112111112111121111211112111112111121111211111211112111121111211111211112111121111121111211112111121111121111211112111112111121111211112111112111121111211111211112111121111211111211112111121111121111211112111121111121111211112111112110"},
} as const;

export type P060AudioDomainId = keyof typeof P060_AUDIO_DOMAINS;
export type P060AudioBinding = (typeof P060_AUDIO_DOMAINS)[P060AudioDomainId];

export const P060_MAIN_STOP_FRAMES = [262, 400, 527, 646, 699, 718] as const;
export const P060_MAIN_DOMAIN: P060AudioDomainId = 'sprite-391';
export type P060AudioPhase = 'paused' | 'loading' | 'playing' | 'ended' | 'error' | 'closed';

export interface P060AudioSnapshot {
  phase: P060AudioPhase;
  domain: P060AudioDomainId | null;
  frame: number;
  fromFrame: number | null;
  toFrame: number | null;
  sourceSample: number;
  atBoundary: boolean;
  audioPlaying: boolean;
  volume: number;
  error: string | null;
}

export interface P060AudioOptions {
  /** This reader must enforce the binding's exact URL, byte length, SHA-256 and decode. */
  readVerified: (binding: P060AudioBinding, signal: AbortSignal,
    context: AudioContext) => Promise<AudioBuffer>;
  createContext?: () => AudioContext;
  onChange?: (snapshot: P060AudioSnapshot) => void;
}

const SAMPLE_COUNTS = [0, 1728, 2304, 3456] as const;
const fail = (detail: string): never => { throw Error(`P060_AUDIO_${detail}`); };
const finiteFrame = (frame: number): boolean => Number.isSafeInteger(frame) && frame >= 1;

/** Exact prefix of declared source samples at a local frame boundary. A frame
 * after the final stream block maps to EOF. This is a modern full-buffer
 * proposal: signed seeks and empty blocks do not cause trim or inserted PCM. */
export function p060SourceSampleAtFrame(id: P060AudioDomainId, frame: number): number {
  const binding = P060_AUDIO_DOMAINS[id];
  if (!binding || !finiteFrame(frame) || frame > (id === P060_MAIN_DOMAIN ? 718 : binding.lastBlockFrame + 1))
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
  id: P060AudioDomainId;
  fromFrame: number;
  toFrame: number;
  startSample: number;
  endSample: number;
  elapsedSeconds: number;
  sourceSample: number;
  atBoundary: boolean;
}

const windowKey = (id: P060AudioDomainId, from: number, to: number): string => `${id}:${from}:${to}`;

/** The page state chooses a domain and branch. This controller only owns one
 * AudioContext/node, verified decoded buffers, and exact source sample windows.
 * Visual frames use the source 12 fps clock, including main frames 1–8 before
 * MP3 starts and frames 711–718 after MP3 EOF. Hard node duration is scheduled
 * at each authored stop; frame clock completion is polled by the host. */
export class P060AudioController {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private node: AudioBufferSourceNode | null = null;
  private readonly buffers = new Map<P060AudioDomainId, AudioBuffer>();
  private readonly saved = new Map<string, WindowState>();
  private selected: WindowState | null = null;
  private anchorTime: number | null = null;
  private audioWhen: number | null = null;
  private audioAnchorSample = 0;
  private abort: AbortController | null = null;
  private pending: Promise<boolean> | null = null;
  private generation = 0;
  private phase: P060AudioPhase = 'paused';
  private volume = 1;
  private error: string | null = null;
  private closing: Promise<void> | null = null;

  constructor(private readonly options: P060AudioOptions) {
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
    const context = this.options.createContext?.() ?? new AudioContext({sampleRate: P060_AUDIO_SOURCE.sampleRate});
    try {
      if (context.sampleRate !== P060_AUDIO_SOURCE.sampleRate || context.state === 'closed')
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
      Math.floor((this.context.currentTime - this.audioWhen) * P060_AUDIO_SOURCE.sampleRate + 1e-8)));
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
    const visual = (window.toFrame - window.fromFrame) / P060_AUDIO_SOURCE.fps;
    const firstAudioDelay = Math.max(0, (P060_AUDIO_DOMAINS[window.id].firstBlockFrame - window.fromFrame) /
      P060_AUDIO_SOURCE.fps);
    const audio = firstAudioDelay + (window.endSample - window.startSample) / P060_AUDIO_SOURCE.sampleRate;
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
    this.phase = window.id === P060_MAIN_DOMAIN && window.toFrame !== 718 ? 'paused' : 'ended';
    this.options.onChange?.(this.rawSnapshot());
  }

  private rawSnapshot(): P060AudioSnapshot {
    const window = this.selected;
    const elapsed = window ? this.runningElapsed(window) : 0;
    const frame = window ? Math.min(window.toFrame,
      Math.floor(window.fromFrame + elapsed * P060_AUDIO_SOURCE.fps + 1e-8)) : 1;
    return {phase: this.phase, domain: window?.id ?? null, frame,
      fromFrame: window?.fromFrame ?? null, toFrame: window?.toFrame ?? null,
      sourceSample: window ? this.runningSample(window) : 0,
      atBoundary: !!window?.atBoundary, audioPlaying: this.node !== null,
      volume: this.volume, error: this.error};
  }

  snapshot(): P060AudioSnapshot {
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

  private select(id: P060AudioDomainId, fromFrame: number, toFrame: number,
    restart: boolean): WindowState {
    const binding = P060_AUDIO_DOMAINS[id];
    if (!binding || !finiteFrame(fromFrame) || !finiteFrame(toFrame) || fromFrame >= toFrame ||
      (id === P060_MAIN_DOMAIN &&
        (P060_MAIN_STOP_FRAMES.find(stop => stop > fromFrame) !== toFrame || fromFrame > 717)) ||
      (id !== P060_MAIN_DOMAIN && toFrame !== binding.lastBlockFrame + 1)) fail('WINDOW');
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
      startSample: p060SourceSampleAtFrame(id, fromFrame),
      endSample: p060SourceSampleAtFrame(id, toFrame),
      elapsedSeconds: 0, sourceSample: p060SourceSampleAtFrame(id, fromFrame), atBoundary: false};
    this.selected = selected;
    this.phase = 'paused';
    this.error = null;
    this.emit();
    return selected;
  }

  private verifiedBuffer(binding: P060AudioBinding, buffer: AudioBuffer): AudioBuffer {
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
  playDomain(id: P060AudioDomainId, fromFrame: number, toFrame: number,
    options: {restart?: boolean} = {}): Promise<boolean> {
    if (this.phase === 'closed') return Promise.resolve(false);
    const window = this.select(id, fromFrame, toFrame, options.restart === true);
    if (window.atBoundary) return Promise.resolve(false);
    if (this.phase === 'playing') return Promise.resolve(true);
    if (this.pending) return this.pending;
    const binding = P060_AUDIO_DOMAINS[id];
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
            P060_AUDIO_SOURCE.fps - window.elapsedSeconds);
          const when = now + delay;
          const node = context.createBufferSource();
          node.buffer = buffer;
          node.loop = false;
          try {
            node.connect(this.gain!);
            node.start(when, window.sourceSample / P060_AUDIO_SOURCE.sampleRate,
              (window.endSample - window.sourceSample) / P060_AUDIO_SOURCE.sampleRate);
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
        this.error = /^P060_AUDIO_[A-Z_]+$/u.test(message) ? message : 'P060_AUDIO_LOAD';
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
