import type {DecodedStreamResult} from './decoded-source-stream-transport';
import type {SourceStreamCycleClockPlan} from './source-stream-cycle-clock-v1';
import {sourceStreamCyclePosition,sourceStreamCycleSlices} from './source-stream-cycle-clock-v1';
export type {SourceStreamCycleClockPlan} from './source-stream-cycle-clock-v1';
export {sourceStreamCyclePosition,sourceStreamCycleSlices} from './source-stream-cycle-clock-v1';
type Phase = 'idle' | 'loading' | 'ready' | 'start-pending' | 'playing' | 'paused' | 'failed' | 'closed';
type Policy = {activation: 'automatic' | 'user'; reducedMotion: boolean};
const result = (accepted: boolean, reason: string): DecodedStreamResult => Object.freeze({accepted, reason});
const hashPattern = /^[a-f0-9]{64}$/u;

/** Explicit source clock successor for audited 22.05 and 44.1 kHz mono streams. Version 1 remains unchanged. */
async function sha256(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), n => n.toString(16).padStart(2, '0')).join('');
}
async function pcmSha256(buffer: AudioBuffer) {
  const bytes = new ArrayBuffer(buffer.length * 4), view = new DataView(bytes), samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) {
    if (!Number.isFinite(samples[i])) throw Error('nonfinite-decoded-sample');
    view.setFloat32(i * 4, samples[i], true);
  }
  return sha256(bytes);
}

/** Individually audited source cycles. Native scheduling covers the current and
 * next two cycles, and native ended events replenish it independently of drawing.
 * Source SWF alignment and original-runtime acceptance remain separate. */
export class SourceStreamCycleClockV2 {
  readonly plan: SourceStreamCycleClockPlan;
  private context?: AudioContext;
  private gain?: GainNode;
  private buffer?: AudioBuffer;
  private nodes = new Set<AudioBufferSourceNode>();
  private phase: Phase = 'idle';
  private position = 0;
  private anchor?: {contextTime: number; seconds: number};
  private scheduledThroughCycle = -1;
  private epoch = 0;
  private volume = 1;
  private audioPhase = 'idle';
  private failure: string | null = null;

  constructor(plan: SourceStreamCycleClockPlan, private readonly options: {
    createContext?: () => AudioContext; commitHeldFrame: (frame: number) => boolean;
  }) {
    const d = plan.decoder;
    if (plan.version !== 1 || !hashPattern.test(plan.sourceSwfSha256) || !/^sprite-\d+$/u.test(plan.frameDomain) || plan.firstFrame !== 1 ||
      !Number.isSafeInteger(plan.frameCount) || plan.frameCount < 2 || plan.frameCount > 18000 || plan.fps !== 12 || plan.playbackMode !== 'loop' ||
      plan.alignmentStatus !== 'source-run-candidate-not-original-runtime-accepted' || ![22050,44100].includes(d.sampleRate) || d.channels !== 1 ||
      !Number.isSafeInteger(d.decodedSamples) || d.decodedSamples < 1 || d.decodedSamples > 20000000 || !Number.isSafeInteger(d.sourceBytes) || d.sourceBytes < 1 ||
      !hashPattern.test(d.sourceSha256) || !hashPattern.test(d.pcmSha256) || typeof options.commitHeldFrame !== 'function' ||
      plan.segments.length < 1 || plan.segments.length > 64 || plan.emptyNegativeBlocks.length > 64) throw Error('unsupported-source-cycle-plan');
    let previousEnd = -1, previousFrame = 0, previousDecodedEnd = 0;
    for (const s of plan.segments) {
      const begin = (s.firstFrame - 1) / 12, end = begin + (s.endDecodedSample - s.firstDecodedSample) / d.sampleRate;
      if (![s.firstFrame, s.firstDecodedSample, s.endDecodedSample].every(Number.isSafeInteger) ||
        s.firstFrame <= previousFrame || s.firstFrame > plan.frameCount || s.firstDecodedSample < previousDecodedEnd || s.firstDecodedSample < 0 ||
        s.endDecodedSample <= s.firstDecodedSample || s.endDecodedSample > d.decodedSamples || begin < previousEnd || end > plan.frameCount / 12)
        throw Error('invalid-cycle-run-order-or-range');
      previousFrame = s.firstFrame; previousEnd = end; previousDecodedEnd = s.endDecodedSample;
    }
    let previousMarker = 0;
    for (const b of plan.emptyNegativeBlocks) {
      if (!Number.isSafeInteger(b.frame) || b.frame <= previousMarker || b.frame > plan.frameCount || b.samples !== 0 || b.mp3Bytes !== 0 ||
        !Number.isSafeInteger(b.seek) || b.seek >= 0 || b.seek < -32768) throw Error('invalid-empty-cycle-marker');
      previousMarker = b.frame;
    }
    this.plan = Object.freeze({...plan, decoder: Object.freeze({...d}),
      segments: Object.freeze(plan.segments.map(s => Object.freeze({...s}))), emptyNegativeBlocks: Object.freeze(plan.emptyNegativeBlocks.map(b => Object.freeze({...b})))});
  }
  private settle() {
    if (this.phase === 'playing' && this.anchor && this.context)
      this.position = this.anchor.seconds + Math.max(0, this.context.currentTime - this.anchor.contextTime);
  }
  private retire() {
    this.anchor = undefined; this.scheduledThroughCycle = -1;
    for (const node of this.nodes) {
      node.onended = null;
      try {node.stop();} catch {/* Retire a node even when it already reached its native end. */}
      node.disconnect();
    }
    this.nodes.clear();
  }
  private commit() {
    try {return this.options.commitHeldFrame(sourceStreamCyclePosition(this.plan, this.position).frame) === true;}
    catch {return false;}
  }
  private scheduleAhead() {
    if (this.phase !== 'playing' || !this.context || this.context.state !== 'running' || !this.buffer || !this.gain || !this.anchor) return;
    const now = this.context.currentTime, epoch = this.epoch;
    this.position = this.anchor.seconds + Math.max(0, now - this.anchor.contextTime);
    const current = sourceStreamCyclePosition(this.plan, this.position);
    for (let cycle = Math.max(current.cycleIndex, this.scheduledThroughCycle + 1); cycle <= current.cycleIndex + 2; cycle++) {
      for (const slice of sourceStreamCycleSlices(this.plan, this.position, cycle)) {
        const node = this.context.createBufferSource(); node.buffer = this.buffer; node.connect(this.gain); this.nodes.add(node);
        node.onended = () => {
          if (!this.nodes.delete(node)) return;
          node.onended = null; node.disconnect();
          if (this.phase === 'playing' && epoch === this.epoch) {
            try {this.scheduleAhead();} catch (error) {
              this.settle(); this.retire(); this.phase = 'failed'; this.audioPhase = 'failed';
              this.failure = error instanceof Error ? error.message : String(error);
            }
          }
        };
        node.start(now + slice.delaySeconds, slice.firstDecodedSample / this.plan.decoder.sampleRate, slice.durationSeconds);
      }
      this.scheduledThroughCycle = cycle;
    }
  }
  private readonly contextChanged = () => {
    if (!this.context || this.context.state === 'running' || this.phase === 'closed' || this.phase === 'loading') return;
    this.settle(); this.retire(); this.epoch++;
    if (this.context.state === 'closed') {
      this.phase = 'closed'; this.audioPhase = 'closed'; this.buffer = undefined;
      this.gain?.disconnect(); this.context.removeEventListener('statechange', this.contextChanged);
    } else if (this.phase === 'playing' || this.phase === 'start-pending') {
      this.phase = 'paused'; this.audioPhase = 'interrupted';
      if (!this.commit()) {this.phase = 'failed'; this.failure = 'interrupted-frame-not-committed';}
    }
  };
  snapshot() {
    this.settle();
    const current = sourceStreamCyclePosition(this.plan, this.position);
    const activeSegmentIndex = this.plan.segments.findIndex(s => current.seconds >= (s.firstFrame - 1) / 12 &&
      current.seconds < (s.firstFrame - 1) / 12 + (s.endDecodedSample - s.firstDecodedSample) / this.plan.decoder.sampleRate);
    let decodedSample = this.plan.segments[0].firstDecodedSample;
    for (const run of this.plan.segments) {
      const start = (run.firstFrame - 1) / 12;
      if (current.seconds < start) break;
      decodedSample = Math.min(run.endDecodedSample, run.firstDecodedSample + (current.seconds - start) * this.plan.decoder.sampleRate);
    }
    return Object.freeze({phase: this.phase, frame: current.frame, frameDomain: this.plan.frameDomain, frameCount: this.plan.frameCount,
      cycleIndex: current.cycleIndex, cycleSeconds: current.seconds, elapsedSeconds: this.position,
      audio: Object.freeze({phase: this.phase === 'playing' && activeSegmentIndex < 0 ? 'source-gap' : this.audioPhase,
        decodedSample, contextTime: this.context?.currentTime ?? null, volume: this.volume}),
      audioEnded: activeSegmentIndex < 0, activeSegmentIndex, timelineReachedEnd: false, scheduledThroughCycle: this.scheduledThroughCycle,
      failure: this.failure, sourceAlignment: this.plan.alignmentStatus, originalRuntimeAccepted: false, audioAccepted: false, lessonCompleted: false});
  }
  async prepare(input: ArrayBuffer): Promise<DecodedStreamResult> {
    if (this.phase !== 'idle') return result(false, 'prepare-not-idle');
    const bytes = input.slice(0), ticket = ++this.epoch; this.phase = 'loading';
    try {
      const d = this.plan.decoder;
      if (bytes.byteLength !== d.sourceBytes || await sha256(bytes) !== d.sourceSha256) throw Error('source-byte-identity-mismatch');
      if (ticket !== this.epoch) return result(false, 'stale-prepare');
      const context = this.options.createContext?.() ?? new AudioContext({sampleRate: this.plan.decoder.sampleRate, latencyHint: 'interactive'});
      this.context = context;
      if (context.sampleRate !== this.plan.decoder.sampleRate) throw Error('context-sample-rate-mismatch');
      context.addEventListener('statechange', this.contextChanged);
      this.gain = context.createGain(); this.gain.connect(context.destination); this.gain.gain.setValueAtTime(this.volume, context.currentTime);
      const buffer = await context.decodeAudioData(bytes);
      if (ticket !== this.epoch) return result(false, 'stale-prepare');
      if (buffer.sampleRate !== d.sampleRate || buffer.numberOfChannels !== 1 || buffer.length !== d.decodedSamples || await pcmSha256(buffer) !== d.pcmSha256) throw Error('decoded-buffer-identity-mismatch');
      if (ticket !== this.epoch) return result(false, 'stale-prepare');
      this.buffer = buffer; this.position = 0;
      if (!this.commit()) throw Error('source-first-frame-not-committed');
      this.phase = 'ready'; this.audioPhase = 'ready'; return result(true, 'source-cycle-ready');
    } catch (error) {
      if (ticket !== this.epoch) return result(false, 'stale-prepare');
      this.failure = error instanceof Error ? error.message : String(error); this.retire(); this.phase = 'failed'; this.audioPhase = 'failed'; this.buffer = undefined;
      this.context?.removeEventListener('statechange', this.contextChanged); this.gain?.disconnect();
      if (this.context && this.context.state !== 'closed') await this.context.close();
      return result(false, this.failure);
    }
  }
  async play(policy: Policy): Promise<DecodedStreamResult> {
    this.settle();
    if (!['automatic', 'user'].includes(policy.activation) || typeof policy.reducedMotion !== 'boolean') return result(false, 'invalid-play-policy');
    if (policy.reducedMotion && policy.activation === 'automatic') return result(false, 'reduced-motion-hold');
    if (this.phase === 'playing') return result(true, 'already-playing');
    if (!['ready', 'paused', 'start-pending'].includes(this.phase) || !this.buffer || !this.context || !this.gain) return result(false, 'not-ready');
    if (this.phase === 'start-pending' && policy.activation === 'automatic') return result(false, 'start-pending');
    const ticket = ++this.epoch; this.retire(); this.phase = 'start-pending'; this.audioPhase = 'start-pending';
    try {
      if (!this.commit()) throw Error('source-frame-not-committed');
      if (ticket !== this.epoch) return result(false, 'stale-frame-commit');
      await this.context.resume();
      if (ticket !== this.epoch) return result(false, 'stale-start');
      if (this.context.state !== 'running') throw Error('context-not-running');
      this.anchor = {contextTime: this.context.currentTime, seconds: this.position}; this.phase = 'playing'; this.audioPhase = 'playing'; this.failure = null;
      this.scheduleAhead(); return result(true, 'source-cycle-playing');
    } catch (error) {
      if (ticket !== this.epoch) return result(false, 'stale-start');
      this.retire(); this.phase = 'paused'; this.audioPhase = 'play-rejected'; this.failure = error instanceof Error ? error.message : String(error);
      return result(false, this.failure);
    }
  }
  pause() {
    this.settle();
    if (!['playing', 'start-pending'].includes(this.phase)) return result(false, 'not-playing');
    this.epoch++; this.retire(); this.phase = 'paused'; this.audioPhase = 'paused';
    if (this.commit()) return result(true, 'source-cycle-held');
    this.phase = 'failed'; this.failure = 'paused-frame-not-committed'; return result(false, this.failure);
  }
  replay() {
    if (!['ready', 'paused', 'playing', 'start-pending'].includes(this.phase)) return result(false, 'not-ready');
    this.epoch++; this.retire(); this.position = 0; this.phase = 'ready'; this.audioPhase = 'ready'; this.failure = null;
    if (this.commit()) return result(true, 'source-cycle-replayed-and-held');
    this.phase = 'failed'; this.failure = 'replay-frame-not-committed'; return result(false, this.failure);
  }
  seekCandidateFrame(frame: number) {
    if (!Number.isSafeInteger(frame) || frame < 1 || frame > this.plan.frameCount || !['ready', 'paused', 'playing', 'start-pending'].includes(this.phase)) return result(false, 'invalid-candidate-frame');
    this.epoch++; this.retire(); this.position = (frame - 1) / 12; this.phase = 'paused'; this.audioPhase = 'paused';
    if (this.commit()) return result(true, 'source-cycle-frame-held');
    this.phase = 'failed'; this.failure = 'inspected-frame-not-committed'; return result(false, this.failure);
  }
  setVolume(value: number) {
    if (!Number.isFinite(value) || value < 0 || value > 1 || this.phase === 'closed') return result(false, 'invalid-volume');
    this.volume = value; if (this.context) this.gain?.gain.setValueAtTime(value, this.context.currentTime); return result(true, 'volume-set');
  }
  async close() {
    if (this.phase === 'closed') return;
    this.epoch++; this.retire(); this.phase = 'closed'; this.audioPhase = 'closed'; this.buffer = undefined;
    this.context?.removeEventListener('statechange', this.contextChanged); this.gain?.disconnect();
    if (this.context && this.context.state !== 'closed') await this.context.close();
  }
}
