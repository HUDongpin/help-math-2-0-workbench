import {P012_AUDIO_SOURCE as source, P012_MAIN_AUDIO_SCHEDULE as schedule,
  frameToP012TimelineSample, p012TimelineSampleToFrame,
  p012CoachElapsedToFrame, resolveP012CoachBranch, type P012CoachAudioLabel,
} from './alg-l12-p012-audio-schedule';

export const P012_MAIN_AUDIO_URL = `/flash-assets/g678-local/shared-alg001-l12-p012/main.mp3?sha256=${source.main.sha256}`;
export const P012_COACH_AUDIO_URL = `/flash-assets/g678-local/shared-alg001-l12-p012/coach.mp3?sha256=${source.coach.sha256}`;

export interface P012AudioOptions {
  origin: string;
  mainPath?: typeof P012_MAIN_AUDIO_URL;
  coachPath?: typeof P012_COACH_AUDIO_URL;
  onChange?: (snapshot: P012AudioSnapshot) => void;
  createContext?: () => AudioContext;
  fetch?: typeof globalThis.fetch;
}

export interface P012AudioSnapshot {
  phase: 'paused' | 'loading' | 'playing' | 'ended' | 'error' | 'closed';
  mainFrame: number;
  timelineSample: number;
  coachLabel: P012CoachAudioLabel | null;
  coachFrame: number;
  coachPlaying: boolean;
  volume: number;
  error: string | null;
}

type Domain = 'main' | 'coach';
interface LoadLane {
  buffer: AudioBuffer | null;
  generation: number;
  abort: AbortController | null;
  pending: Promise<AudioBuffer | null> | null;
  loading: boolean;
}

/** Two independently loaded source streams, one owned AudioContext and clock.
 * This is a full-buffer modern candidate, not an AVM1/SWF audio emulator.
 * The host polls snapshot() to advance the visual frame at source 12 fps.
 * Only explicit Play/coach calls cause network or context resume. */
export class P012AudioController {
  private readonly options: P012AudioOptions;
  private readonly urls: Record<Domain, string>;
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private nodes: Partial<Record<Domain, AudioBufferSourceNode>> = {};
  private lanes: Record<Domain, LoadLane> = {
    main: {buffer: null, generation: 0, abort: null, pending: null, loading: false},
    coach: {buffer: null, generation: 0, abort: null, pending: null, loading: false},
  };
  private mainSample = 0;
  private mainAnchor: {time: number; sample: number} | null = null;
  private coachLabel: P012CoachAudioLabel | null = null;
  private coachSample = 0;
  private coachAnchor: {time: number; sample: number} | null = null;
  private volume = 0;
  private error: string | null = null;
  private closed = false;
  private closing: Promise<void> | null = null;
  private mainOperation = 0;
  private coachOperation = 0;
  private mainPending: Promise<boolean> | null = null;
  private coachPending: Promise<boolean> | null = null;

  constructor(options: P012AudioOptions) {
    const origin = new URL(options.origin);
    if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== options.origin ||
      origin.username || origin.password) throw Error('P012_AUDIO_ORIGIN');
    if ((options.mainPath && options.mainPath !== P012_MAIN_AUDIO_URL) ||
      (options.coachPath && options.coachPath !== P012_COACH_AUDIO_URL)) throw Error('P012_AUDIO_PATH');
    this.options = options;
    this.urls = {main: new URL(P012_MAIN_AUDIO_URL, origin).href,
      coach: new URL(P012_COACH_AUDIO_URL, origin).href};
  }

  private emit(): void { this.options.onChange?.(this.snapshot()); }

  private mainPosition(): number {
    if (!this.mainAnchor || !this.context) return this.mainSample;
    return Math.min(schedule.terminalTimelineSample, this.mainAnchor.sample +
      Math.max(0, this.context.currentTime - this.mainAnchor.time) * source.sampleRate);
  }

  private coachPosition(): number {
    if (!this.coachAnchor || !this.context) return this.coachSample;
    return this.coachAnchor.sample + Math.max(0, this.context.currentTime - this.coachAnchor.time) * source.sampleRate;
  }

  private retire(domain: Domain): void {
    const node = this.nodes[domain];
    delete this.nodes[domain];
    if (!node) return;
    node.onended = null;
    try { node.stop(); } catch { /* Already ended. */ }
    try { node.disconnect(); } catch { /* Detached node. */ }
  }

  private cancelLoad(domain: Domain): void {
    const lane = this.lanes[domain];
    lane.generation++;
    lane.abort?.abort();
    lane.abort = null;
    lane.pending = null;
    lane.loading = false;
  }

  private readonly contextStateChanged = (): void => {
    if (this.closed || !this.context || this.context.state === 'running') return;
    if (this.mainAnchor || this.coachAnchor || this.lanes.main.loading || this.lanes.coach.loading) {
      this.pause();
    }
  };

  private reconcile(): void {
    if (!this.closed && this.context?.state !== 'running' &&
      (this.mainAnchor || this.coachAnchor)) this.pause();
    if (this.mainAnchor && this.mainPosition() >= schedule.terminalTimelineSample - 1e-6) {
      this.mainSample = schedule.terminalTimelineSample;
      this.mainAnchor = null;
      this.retire('main');
      this.emit();
    }
    if (this.coachLabel && this.coachAnchor &&
      this.coachPosition() >= resolveP012CoachBranch(this.coachLabel).clockDurationSamples - 1e-6) {
      // The host observes the returned frame on its next snapshot poll and
      // advances the pure reducer. A transient paused callback here would
      // freeze that reducer before it can consume the return tick.
      this.clearCoach(false);
    }
  }

  snapshot(): P012AudioSnapshot {
    this.reconcile();
    const timelineSample = this.mainPosition();
    const coachFrame = this.coachLabel ? p012CoachElapsedToFrame(this.coachLabel, this.coachPosition()) : 1;
    const loading = this.lanes.main.loading || this.lanes.coach.loading;
    const phase = this.closed ? 'closed' : this.error ? 'error' :
      this.mainAnchor || this.coachAnchor ? 'playing' : loading ? 'loading' :
      this.coachLabel ? 'paused' :
      timelineSample >= schedule.terminalTimelineSample ? 'ended' : 'paused';
    return {phase, mainFrame: p012TimelineSampleToFrame(timelineSample), timelineSample,
      coachLabel: this.coachLabel, coachFrame, coachPlaying: !!this.coachAnchor,
      volume: this.volume, error: this.error};
  }

  private ensureContext(): AudioContext {
    if (this.context) {
      if (this.context.state === 'closed') throw Error('P012_AUDIO_CONTEXT_CLOSED');
      return this.context;
    }
    const context = this.options.createContext?.() ?? new AudioContext({sampleRate: source.sampleRate});
    try {
      if (context.sampleRate !== source.sampleRate || context.state === 'closed')
        throw Error('P012_AUDIO_CONTEXT_RATE');
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

  private async load(domain: Domain, context: AudioContext): Promise<AudioBuffer | null> {
    const lane = this.lanes[domain];
    if (lane.buffer) return lane.buffer;
    if (lane.pending) return lane.pending;
    const binding = source[domain];
    const generation = ++lane.generation;
    const current = () => !this.closed && generation === lane.generation;
    const abort = new AbortController();
    lane.abort = abort;
    lane.loading = true;
    this.emit();
    const pending = (async (): Promise<AudioBuffer | null> => {
      try {
        const response = await (this.options.fetch ?? globalThis.fetch)(this.urls[domain], {
          signal: abort.signal, mode: 'same-origin', credentials: 'same-origin', redirect: 'error', cache: 'no-store',
        });
        if (!current()) return null;
        if (response.status !== 200 || response.redirected || response.url !== this.urls[domain] ||
          response.type === 'opaque' || response.type === 'opaqueredirect' ||
          response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'audio/mpeg')
          throw Error('P012_AUDIO_RESPONSE');
        const length = response.headers.get('content-length');
        if (length !== null && length !== String(binding.bytes)) throw Error('P012_AUDIO_BYTES');
        if (!response.body) throw Error('P012_AUDIO_BODY');
        const encoded = new Uint8Array(binding.bytes);
        const reader = response.body.getReader();
        let offset = 0;
        try {
          while (true) {
            const {done, value} = await reader.read();
            if (!current()) { await reader.cancel(); return null; }
            if (done) break;
            if (value.byteLength > encoded.length - offset) throw Error('P012_AUDIO_BYTES');
            encoded.set(value, offset);
            offset += value.byteLength;
          }
        } catch (error) { await reader.cancel().catch(() => {}); throw error; }
        finally { reader.releaseLock(); }
        if (offset !== encoded.length) throw Error('P012_AUDIO_BYTES');
        const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', encoded))]
          .map(byte => byte.toString(16).padStart(2, '0')).join('');
        if (!current()) return null;
        if (hash !== binding.sha256) throw Error('P012_AUDIO_HASH');
        const decoded = await context.decodeAudioData(encoded.buffer);
        if (!current()) return null;
        if (decoded.sampleRate !== source.sampleRate || decoded.numberOfChannels !== source.channels ||
          decoded.length !== binding.decodedSamples ||
          decoded.getChannelData(0).length !== binding.decodedSamples ||
          !decoded.getChannelData(0).every(Number.isFinite)) throw Error('P012_AUDIO_DECODE');
        lane.buffer = decoded;
        return decoded;
      } finally {
        // The starting operation emits after its node/clock is attached.
        // An intermediate paused notification would freeze the host's coach
        // reducer before the returned-frame poll can complete.
        if (current()) { lane.loading = false; lane.abort = null; lane.pending = null; }
      }
    })();
    lane.pending = pending;
    void pending.finally(() => { if (current() && lane.pending === pending) lane.pending = null; }).catch(() => {});
    return pending;
  }

  private fail(error: unknown): void {
    const message = error instanceof Error ? error.message : '';
    this.error = /^P012_AUDIO_[A-Z_]+$/.test(message) ? message : 'P012_AUDIO_LOAD';
    this.emit();
  }

  /** Explicit Play. The clock begins after hash verification and decode. */
  play(): Promise<boolean> {
    if (this.closed) return Promise.resolve(false);
    this.reconcile();
    if (this.mainAnchor) return Promise.resolve(true);
    if (this.mainPending) return this.mainPending;
    if (this.mainSample >= schedule.terminalTimelineSample) return Promise.resolve(false);
    this.error = null;
    const ticket = ++this.mainOperation;
    const current = () => !this.closed && this.mainOperation === ticket;
    const pending = (async (): Promise<boolean> => { try {
      const context = this.ensureContext();
      // Resume is issued before the first await to preserve the caller gesture.
      await context.resume();
      if (!current() || context.state !== 'running') return false;
      const buffer = await this.load('main', context);
      if (!buffer || !current() || context.state !== 'running') return false;
      const anchor = context.currentTime;
      const start = Math.max(this.mainSample, schedule.timelineStartSample);
      const offset = start - schedule.timelineStartSample;
      if (offset < source.main.decodedSamples) {
        const node = context.createBufferSource();
        node.buffer = buffer;
        node.loop = false;
        node.connect(this.gain!);
        try { node.start(anchor + (start - this.mainSample) / source.sampleRate,
          offset / source.sampleRate, (source.main.decodedSamples - offset) / source.sampleRate); }
        catch (error) { node.disconnect(); throw error; }
        this.nodes.main = node;
        node.onended = () => { if (this.nodes.main === node) { delete this.nodes.main; node.disconnect(); } };
      }
      this.mainAnchor = {time: anchor, sample: this.mainSample};
      this.emit();
      return true;
    } catch (error) { if (current()) this.fail(error); return false; }
    finally { if (current()) this.mainPending = null; }
    })();
    this.mainPending = pending;
    void pending.then(() => { if (current() && this.mainPending === pending) this.mainPending = null; });
    return pending;
  }

  /** Source branch jump. A new rejection restarts/cancels the prior coach. */
  playCoach(label: P012CoachAudioLabel): Promise<boolean> {
    if (this.closed) return Promise.resolve(false);
    const branch = resolveP012CoachBranch(label);
    this.clearCoach(false);
    this.coachLabel = label;
    this.error = null;
    const ticket = ++this.coachOperation;
    const current = () => !this.closed && this.coachOperation === ticket && this.coachLabel === label;
    const pending = (async (): Promise<boolean> => { try {
      const context = this.ensureContext();
      await context.resume();
      if (!current() || context.state !== 'running') return false;
      const buffer = await this.load('coach', context);
      if (!buffer || !current() || context.state !== 'running') return false;
      const node = context.createBufferSource();
      node.buffer = buffer;
      node.loop = false;
      node.connect(this.gain!);
      const anchor = context.currentTime;
      try { node.start(anchor, branch.playbackStartSample / source.sampleRate,
        branch.scheduledDurationSamples / source.sampleRate); }
      catch (error) { node.disconnect(); throw error; }
      this.nodes.coach = node;
      node.onended = () => { if (this.nodes.coach === node) { delete this.nodes.coach; node.disconnect(); } };
      this.coachAnchor = {time: anchor, sample: 0};
      this.emit();
      return true;
    } catch (error) { if (current()) this.fail(error); return false; }
    finally { if (current()) this.coachPending = null; }
    })();
    this.coachPending = pending;
    void pending.then(() => { if (current() && this.coachPending === pending) this.coachPending = null; });
    return pending;
  }

  private clearCoach(notify: boolean): void {
    if (this.closed) return;
    this.coachOperation++;
    this.coachPending = null;
    this.cancelLoad('coach');
    this.retire('coach');
    this.coachLabel = null;
    this.coachSample = 0;
    this.coachAnchor = null;
    if (notify) this.emit();
  }

  stopCoach(): void { this.clearCoach(true); }

  pause(): void {
    if (this.closed) return;
    this.mainSample = this.mainPosition();
    this.coachSample = this.coachPosition();
    this.mainAnchor = null;
    this.coachAnchor = null;
    this.mainOperation++;
    this.coachOperation++;
    this.mainPending = null;
    this.coachPending = null;
    this.cancelLoad('main');
    this.cancelLoad('coach');
    this.retire('main');
    this.retire('coach');
    this.emit();
  }

  async resume(): Promise<boolean> {
    if (this.closed) return false;
    const coach = this.coachLabel;
    const main = this.mainSample < schedule.terminalTimelineSample ? await this.play() : true;
    if (!coach) return main;
    if (!main || this.coachLabel !== coach) return false;
    return await this.resumeCoach();
  }

  private async resumeCoach(): Promise<boolean> {
    const label = this.coachLabel;
    if (!label) return true;
    if (this.coachAnchor) return true;
    const branch = resolveP012CoachBranch(label);
    if (this.coachSample >= branch.clockDurationSamples) { this.stopCoach(); return true; }
    const ticket = ++this.coachOperation;
    const current = () => !this.closed && this.coachOperation === ticket && this.coachLabel === label;
    try {
      const context = this.ensureContext();
      await context.resume();
      if (!current() || context.state !== 'running') return false;
      const buffer = await this.load('coach', context);
      if (!buffer || !current() || context.state !== 'running') return false;
      const remaining = Math.min(branch.clockDurationSamples - this.coachSample,
        branch.sourceDurationSamples - this.coachSample);
      if (remaining > 0) {
        const node = context.createBufferSource();
        node.buffer = buffer;
        node.connect(this.gain!);
        node.start(context.currentTime,
          (branch.playbackStartSample + this.coachSample) / source.sampleRate,
          remaining / source.sampleRate);
        this.nodes.coach = node;
        node.onended = () => { if (this.nodes.coach === node) { delete this.nodes.coach; node.disconnect(); } };
      }
      this.coachAnchor = {time: context.currentTime, sample: this.coachSample};
      this.emit();
      return true;
    } catch (error) { if (current()) this.fail(error); return false; }
  }

  seekFrame(frame: number): void {
    const sample = frameToP012TimelineSample(frame);
    if (this.closed) throw Error('P012_AUDIO_CLOSED');
    this.pause();
    this.stopCoach();
    this.error = null;
    this.mainSample = sample;
    this.emit();
  }

  reset(): void { this.seekFrame(1); }

  setVolume(volume: number): void {
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) throw Error('P012_AUDIO_VOLUME');
    if (this.closed) throw Error('P012_AUDIO_CLOSED');
    this.volume = volume;
    if (this.gain) this.gain.gain.value = volume;
    this.emit();
  }

  close(): Promise<void> {
    if (this.closing) return this.closing;
    this.pause();
    this.closed = true;
    this.context?.removeEventListener('statechange', this.contextStateChanged);
    try { this.gain?.disconnect(); } catch { /* Owned context closes below. */ }
    this.closing = this.context?.close() ?? Promise.resolve();
    this.emit();
    return this.closing;
  }
}
