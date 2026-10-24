import type {AudioCue} from './contract';
import {audioCueMatchesContext, isSameOriginAssetSource} from './runtime';
import {LESSON_MANUAL_NARRATION_PCM, type NarrationPcmAsset} from './generated/lesson-manual-narration-pcm';

export interface NarrationFrameRange {readonly firstFrame: number; readonly endFrameExclusive: number}
export interface BoundedNarrationPart {
  readonly id: string; readonly source: string; readonly sha256: string;
  readonly offsetSeconds: number; readonly delaySeconds: number; readonly durationSeconds: number;
  readonly pcm?: NarrationPcmAsset;
}
export interface BoundedNarrationPlan {readonly parts: readonly BoundedNarrationPart[]; readonly durationSeconds: number}

/** A stop frame is excluded, as it is by the automatic source-audio projection.
 * Discrete gotoAndStop question changes retain the last revealed instruction
 * range; they must never expose the unplayed stream between question frames. */
export function nextNarrationRange(previous: NarrationFrameRange, transition: {toFrame: number; stopFrame: number}): NarrationFrameRange {
  return transition.toFrame < transition.stopFrame
    ? {firstFrame: transition.toFrame, endFrameExclusive: transition.stopFrame} : previous;
}

export function boundedNarrationPlan(cues: readonly AudioCue[], range: NarrationFrameRange, fps: number,
  context: {frameDomain: string; lang: 'en' | 'es'; scenario: string; seed: number}): BoundedNarrationPlan | null {
  if (!Number.isFinite(fps) || fps <= 0 || !Number.isSafeInteger(range.firstFrame)
    || !Number.isSafeInteger(range.endFrameExclusive) || range.firstFrame < 1 || range.endFrameExclusive <= range.firstFrame) return null;
  const parts: BoundedNarrationPart[] = [];
  for (const cue of cues) {
    if (!audioCueMatchesContext(cue, context)) continue;
    if (!isSameOriginAssetSource(cue.source) || !/^[a-f0-9]{64}$/.test(cue.sha256 ?? '')
      || !Number.isSafeInteger(cue.frame) || cue.frame < 1
      || (cue.endFrame !== undefined && (!Number.isSafeInteger(cue.endFrame) || cue.endFrame <= cue.frame))) return null;
    const first = Math.max(range.firstFrame, cue.frame), end = Math.min(range.endFrameExclusive, cue.endFrame ?? range.endFrameExclusive);
    if (first >= end) continue;
    parts.push({id: cue.id, source: cue.source, sha256: cue.sha256!, offsetSeconds: (first - cue.frame) / fps,
      delaySeconds: (first - range.firstFrame) / fps, durationSeconds: (end - first) / fps,
      ...(LESSON_MANUAL_NARRATION_PCM[cue.sha256!] ? {pcm: LESSON_MANUAL_NARRATION_PCM[cue.sha256!]} : {})});
  }
  if (!parts.length) return null;
  // Do not make a learner wait through silence before this instruction begins.
  const leadingSilence = Math.min(...parts.map(part => part.delaySeconds));
  const normalized = parts.map(part => ({...part, delaySeconds: part.delaySeconds - leadingSilence}));
  return {parts: normalized, durationSeconds: Math.max(...normalized.map(part => part.delaySeconds + part.durationSeconds))};
}

export type ManualNarrationStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'blocked' | 'error';
type Environment = {
  createContext: () => AudioContext;
  fetch: typeof globalThis.fetch;
  digest: (bytes: ArrayBuffer) => Promise<string>;
};
const defaultEnvironment: Environment = {
  createContext: () => new AudioContext(),
  fetch: (...args) => fetch(...args),
  digest: async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join(''),
};

/** Media time controls only audio. No callback moves a teaching frame, submits
 * an answer, or marks the page complete. AudioBufferSourceNode's duration
 * argument enforces the boundary without timeupdate polling or UI timers. */
export class LessonManualNarrationController {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private sources: AudioBufferSourceNode[] = [];
  private buffers = new Map<string, AudioBuffer>();
  private abort: AbortController | null = null;
  private generation = 0;
  private identity = '';
  private plan: BoundedNarrationPlan | null = null;
  private offset = 0;
  private startedAt = 0;
  private volume = 1;
  private externallyPaused = false;
  private status: ManualNarrationStatus = 'idle';
  constructor(private readonly report: (status: ManualNarrationStatus) => void, private readonly environment: Environment = defaultEnvironment) {}
  private emit(status: ManualNarrationStatus) {this.status = status; this.report(status);}
  private cancelSources() {
    this.generation++; this.abort?.abort(); this.abort = null;
    for (const source of this.sources) {source.onended = null; try {source.stop();} catch {} source.disconnect();}
    this.sources = [];
  }
  update(options: {identity: string; plan: BoundedNarrationPlan | null; paused: boolean; volume: number}) {
    const identity = `${options.identity}:${JSON.stringify(options.plan)}`;
    if (identity !== this.identity) {
      this.cancelSources(); this.offset = 0; this.buffers.clear(); this.identity = identity; this.plan = options.plan; this.emit('idle');
    }
    this.volume = Number.isFinite(options.volume) ? Math.max(0, Math.min(1, options.volume)) : 0;
    if (this.gain) this.gain.gain.value = this.volume;
    const wasPaused = this.externallyPaused; this.externallyPaused = options.paused;
    if (options.paused && (this.status === 'playing' || this.status === 'loading')) {
      if (this.status === 'playing' && this.context) this.offset += Math.max(0, this.context.currentTime - this.startedAt);
      this.cancelSources(); this.emit('paused');
    } else if (wasPaused && !options.paused && this.status === 'paused') void this.play();
  }
  async play(): Promise<boolean> {
    if (!this.plan || this.externallyPaused) return false;
    this.cancelSources(); const generation = this.generation, plan = this.plan;
    const isCurrent = () => generation === this.generation;
    this.emit('loading');
    try {
      if (!this.context) {this.context = this.environment.createContext(); this.gain = this.context.createGain(); this.gain.connect(this.context.destination);}
      const context = this.context; this.gain!.gain.value = this.volume;
      // Resume immediately in the learner's play request before asynchronous I/O.
      try {await context.resume();} catch {if (isCurrent()) this.emit('blocked'); return false;}
      if (!isCurrent()) return false;
      if (context.state !== 'running') {this.emit('blocked'); return false;}
      const abort = new AbortController(); this.abort = abort;
      for (const part of plan.parts) {
        if (this.buffers.has(part.sha256)) continue;
        const pcm = part.pcm;
        if (!pcm || !isSameOriginAssetSource(pcm.source) || !/^[a-f0-9]{64}$/.test(pcm.sha256)
          || ![1, 2].includes(pcm.channels) || !Number.isSafeInteger(pcm.frames) || pcm.frames <= 0
          || !Number.isSafeInteger(pcm.sampleRate) || pcm.sampleRate < 4000 || pcm.sampleRate > 96000) throw new Error('narration-pcm-binding-missing');
        const response = await this.environment.fetch(pcm.source, {signal: abort.signal, redirect: 'error', credentials: 'same-origin'});
        if (!response.ok) throw new Error('narration-asset-unavailable');
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength !== pcm.frames * pcm.channels * 4 || bytes.byteLength > 32 * 1024 * 1024
          || await this.environment.digest(bytes) !== pcm.sha256) throw new Error('narration-asset-integrity');
        if (!isCurrent()) return false;
        const buffer = context.createBuffer(pcm.channels, pcm.frames, pcm.sampleRate), data = new DataView(bytes);
        for (let channel = 0; channel < pcm.channels; channel++) {
          const samples = buffer.getChannelData(channel);
          for (let frame = 0; frame < pcm.frames; frame++) {
            const sample = data.getFloat32((frame * pcm.channels + channel) * 4, true);
            if (!Number.isFinite(sample)) throw new Error('narration-pcm-invalid-sample');
            samples[frame] = sample;
          }
        }
        this.buffers.set(part.sha256, buffer);
      }
      if (!isCurrent()) return false;
      if (this.offset >= plan.durationSeconds) this.offset = 0;
      const startedAt = context.currentTime, nodes: AudioBufferSourceNode[] = [];
      for (const part of plan.parts) {
        const skipped = Math.max(0, this.offset - part.delaySeconds);
        const buffer = this.buffers.get(part.sha256)!;
        const offset = part.offsetSeconds + skipped;
        const duration = Math.min(part.durationSeconds - skipped, buffer.duration - offset);
        if (duration <= 0) continue;
        const node = context.createBufferSource(); node.buffer = buffer; node.connect(this.gain!);
        nodes.push(node);
        node.onended = () => {
          if (!isCurrent()) return;
          node.disconnect(); this.sources = this.sources.filter(source => source !== node);
          if (!this.sources.length) {this.offset = 0; this.emit('idle');}
        };
        node.start(startedAt + Math.max(0, part.delaySeconds - this.offset), offset, duration);
      }
      this.sources = nodes; this.startedAt = startedAt;
      if (!nodes.length) {this.offset = 0; this.emit('idle'); return false;}
      this.emit('playing'); return true;
    } catch {
      if (isCurrent()) {this.cancelSources(); this.offset = 0; this.emit('error');}
      return false;
    }
  }
  stop() {this.cancelSources(); this.offset = 0; this.emit('idle');}
  dispose() {
    this.cancelSources(); this.buffers.clear(); this.offset = 0; this.plan = null; this.identity = ''; this.status = 'idle';
    this.gain?.disconnect(); this.gain = null; const context = this.context; this.context = null;
    if (context && context.state !== 'closed') void context.close().catch(() => {});
  }
}
