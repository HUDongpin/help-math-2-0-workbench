import type {DecodedStreamResult} from './decoded-source-stream-transport';
import {P004_CONTINUOUS_AUDIO as PLAN, p004ContinuousAudioSlice} from './alg-l06-p004-continuous-audio-schedule-v1';

type Phase = 'idle' | 'loading' | 'ready' | 'start-pending' | 'playing' | 'paused' | 'timeline-ended' | 'failed' | 'closed';
type Policy = {activation: 'automatic' | 'user'; reducedMotion: boolean};
const FIRST_FRAME = 1; // P004 source sprite-95 begins at frame 1; schedule omits firstFrame.
export const P004_CONTINUOUS_SOURCE_URL =
  `/flash-assets/g678-local/shared-alg001-l06-p004/continuous-source-v1?sha256=${PLAN.sourceSha256}`;
const END_SECONDS = (PLAN.lastFrame - FIRST_FRAME) / PLAN.fps;
const answer = (accepted: boolean, reason: string): DecodedStreamResult => Object.freeze({accepted, reason});
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join('');
const sha256 = async (bytes: ArrayBuffer) => hex(await crypto.subtle.digest('SHA-256', bytes));

async function pcmSha256(buffer: AudioBuffer): Promise<string> {
  if (buffer.numberOfChannels !== 1) throw Error('source-channel-mismatch');
  const data = buffer.getChannelData(0), bytes = new ArrayBuffer(data.length * 4), view = new DataView(bytes);
  for (let i = 0; i < data.length; i++) {
    if (!Number.isFinite(data[i])) throw Error('nonfinite-decoded-sample');
    view.setFloat32(i * 4, data[i], true);
  }
  return sha256(bytes);
}

/** One natural continuous MP3 stream; the same AudioContext owns visual time
 * before and after audible content. No frame seek or lesson completion is inferred. */
export class AlgL06P004ContinuousSourceClockV1 {
  readonly plan = PLAN;
  private readonly options: {createContext?: () => AudioContext; commitHeldFrame: (frame: number) => boolean};
  private context?: AudioContext;
  private gain?: GainNode;
  private buffer?: AudioBuffer;
  private nodes = new Set<AudioBufferSourceNode>();
  private phase: Phase = 'idle';
  private audioPhase = 'idle';
  private position = 0;
  private anchor?: {contextTime: number; seconds: number};
  private epoch = 0;
  private volume = 1;
  private failure: string | null = null;

  constructor(options: {createContext?: () => AudioContext; commitHeldFrame: (frame: number) => boolean}) {
    if (typeof options.commitHeldFrame !== 'function') throw Error('source-frame-commit-required');
    this.options = options;
  }

  private frame() {return Math.min(PLAN.lastFrame, FIRST_FRAME + Math.floor(this.position * PLAN.fps + 1e-9));}
  private commit() {try {return this.options.commitHeldFrame(this.frame()) === true;} catch {return false;}}
  private retire() {
    this.anchor = undefined;
    for (const node of this.nodes) {
      node.onended = null;
      try {node.stop();} catch {/* A completed or not-yet-started node is still disconnected. */}
      node.disconnect();
    }
    this.nodes.clear();
  }
  private settle() {
    if (this.phase !== 'playing' || !this.anchor || !this.context) return;
    this.position = Math.min(END_SECONDS, this.anchor.seconds + Math.max(0, this.context.currentTime - this.anchor.contextTime));
    if (this.position >= END_SECONDS) {
      this.retire(); this.phase = 'timeline-ended'; this.audioPhase = 'boundary-held';
      if (!this.commit()) {this.phase = 'failed'; this.failure = 'terminal-frame-not-committed';}
    }
  }
  private readonly contextChanged = () => {
    if (!this.context || this.phase === 'closed' || this.context.state === 'running' || (this.phase === 'loading' && this.context.state !== 'closed')) return;
    this.settle(); this.retire(); this.epoch++;
    if (this.context.state === 'closed') {
      this.phase = 'closed'; this.audioPhase = 'closed'; this.buffer = undefined; this.gain?.disconnect();
      this.context.removeEventListener('statechange', this.contextChanged);
    } else if (this.phase === 'playing' || this.phase === 'start-pending') {
      this.phase = 'paused'; this.audioPhase = 'interrupted';
      if (!this.commit()) {this.phase = 'failed'; this.failure = 'interrupted-frame-not-committed';}
    }
  };

  snapshot() {
    this.settle();
    const audible = this.position >= PLAN.audioStartSeconds && this.position < PLAN.audioEndSeconds;
    const sample = audible ? PLAN.initialSeekSamples + (this.position - PLAN.audioStartSeconds) * PLAN.sampleRate : null;
    return Object.freeze({phase: this.phase, frame: this.frame(), frameDomain: PLAN.frameDomain, elapsedSeconds: this.position,
      audio: Object.freeze({phase: this.phase === 'playing' ? (this.position < PLAN.audioStartSeconds ? 'preroll' : audible ? 'playing' : 'postroll') : this.audioPhase, runId: audible ? 'continuous-source-stream' : null, decodedSample: sample,
        contextTime: this.context?.currentTime ?? null, volume: this.volume}),
      activeSegmentIndex: audible ? 0 : -1, timelineReachedEnd: this.phase === 'timeline-ended', failure: this.failure,
      sourceAlignment: PLAN.alignmentStatus, originalRuntimeAccepted: false, audioAccepted: false, lessonCompleted: false});
  }

  async prepare(input: ArrayBuffer): Promise<DecodedStreamResult> {
    if (this.phase !== 'idle') return answer(false, 'prepare-not-idle');
    if (!(input instanceof ArrayBuffer)) return answer(false, 'invalid-source-stream');
    const bytes = input.slice(0), ticket = ++this.epoch;
    this.phase = 'loading';
    try {
      if (bytes.byteLength !== PLAN.sourceBytes || await sha256(bytes) !== PLAN.sourceSha256)
        throw Error('source-byte-identity-mismatch');
      if (ticket !== this.epoch) return answer(false, 'stale-prepare');
      const context = this.options.createContext?.() ?? new AudioContext({sampleRate: PLAN.sampleRate, latencyHint: 'interactive'});
      this.context = context;
      if (context.sampleRate !== PLAN.sampleRate) throw Error('context-sample-rate-mismatch');
      context.addEventListener('statechange', this.contextChanged);
      this.gain = context.createGain(); this.gain.gain.setValueAtTime(this.volume, context.currentTime); this.gain.connect(context.destination);
      const buffer = await context.decodeAudioData(bytes);
      if (ticket !== this.epoch) return answer(false, 'stale-prepare');
      if (buffer.sampleRate !== PLAN.sampleRate || buffer.numberOfChannels !== 1 ||
          buffer.length !== PLAN.decodedSamples || await pcmSha256(buffer) !== PLAN.measuredPcmSha256)
        throw Error('decoded-buffer-identity-mismatch');
      if (ticket !== this.epoch) return answer(false, 'stale-prepare');
      this.buffer = buffer;
      if (!this.commit()) throw Error('source-first-frame-not-committed');
      if (ticket !== this.epoch) return answer(false, 'stale-prepare');
      if (context.state === 'closed') throw Error('context-closed-during-prepare');
      this.phase = 'ready'; this.audioPhase = 'ready'; return answer(true, 'continuous-source-ready');
    } catch (error) {
      if (ticket !== this.epoch) return answer(false, 'stale-prepare');
      this.failure = error instanceof Error ? error.message : String(error);
      this.retire(); this.buffer = undefined; this.phase = 'failed'; this.audioPhase = 'failed';
      this.context?.removeEventListener('statechange', this.contextChanged); this.gain?.disconnect();
      if (this.context && this.context.state !== 'closed') await this.context.close();
      return answer(false, this.failure);
    }
  }

  async play(policy: Policy): Promise<DecodedStreamResult> {
    this.settle();
    if (!policy || !['automatic', 'user'].includes(policy.activation) || typeof policy.reducedMotion !== 'boolean') return answer(false, 'invalid-play-policy');
    if (policy.reducedMotion && policy.activation === 'automatic') return answer(false, 'reduced-motion-hold');
    if (policy.activation !== 'user') return answer(false, 'explicit-user-play-required');
    if (this.phase === 'playing') return answer(true, 'already-playing');
    if (!['ready', 'paused', 'start-pending'].includes(this.phase) || !this.context || !this.gain || !this.buffer)
      return answer(false, 'not-ready');
    const ticket = ++this.epoch; this.retire(); this.phase = 'start-pending'; this.audioPhase = 'start-pending';
    try {
      if (!this.commit()) throw Error('source-frame-not-committed');
      if (ticket !== this.epoch) return answer(false, 'stale-frame-commit');
      await this.context.resume();
      if (ticket !== this.epoch) return answer(false, 'stale-start');
      if (this.context.state !== 'running') throw Error('context-not-running');
      const now = this.context.currentTime;
      const slice = p004ContinuousAudioSlice(this.position);
      if (slice) {
        const node = this.context.createBufferSource(); node.buffer = this.buffer; node.connect(this.gain); this.nodes.add(node);
        node.onended = () => {if (!this.nodes.delete(node)) return; node.onended = null; node.disconnect();};
        node.start(now + slice.delaySeconds, slice.firstDecodedSample / PLAN.sampleRate, slice.durationSeconds);
      }
      this.anchor = {contextTime: now, seconds: this.position}; this.phase = 'playing'; this.audioPhase = 'playing'; this.failure = null;
      this.settle(); return answer(true, 'continuous-source-playing');
    } catch (error) {
      if (ticket !== this.epoch) return answer(false, 'stale-start');
      this.retire(); this.phase = 'failed'; this.audioPhase = 'play-rejected';
      this.failure = error instanceof Error ? error.message : String(error); return answer(false, this.failure);
    }
  }

  pause(): DecodedStreamResult {
    this.settle();
    if (!['playing', 'start-pending'].includes(this.phase)) return answer(false, 'not-playing');
    this.epoch++; this.retire(); this.phase = 'paused'; this.audioPhase = 'paused';
    if (this.commit()) return answer(true, 'continuous-source-held');
    this.phase = 'failed'; this.failure = 'paused-frame-not-committed'; return answer(false, this.failure);
  }
  replay(): DecodedStreamResult {
    if (!['ready', 'paused', 'playing', 'start-pending', 'timeline-ended'].includes(this.phase)) return answer(false, 'not-ready');
    this.epoch++; this.retire(); this.position = 0; this.phase = 'ready'; this.audioPhase = 'ready'; this.failure = null;
    if (this.commit()) return answer(true, 'continuous-source-replayed-and-held');
    this.phase = 'failed'; this.failure = 'replay-frame-not-committed'; return answer(false, this.failure);
  }
  seekCandidateFrame(_frame: number): DecodedStreamResult {
    return answer(false, 'arbitrary-source-frame-seek-unsupported');
  }
  setVolume(value: number): DecodedStreamResult {
    if (!Number.isFinite(value) || value < 0 || value > 1 || this.phase === 'closed') return answer(false, 'invalid-volume');
    this.volume = value; if (this.context) this.gain?.gain.setValueAtTime(value, this.context.currentTime);
    return answer(true, 'volume-set');
  }
  async close() {
    if (this.phase === 'closed') return;
    this.epoch++; this.retire(); this.phase = 'closed'; this.audioPhase = 'closed'; this.buffer = undefined;
    this.context?.removeEventListener('statechange', this.contextChanged); this.gain?.disconnect();
    if (this.context && this.context.state !== 'closed') await this.context.close();
  }
}
