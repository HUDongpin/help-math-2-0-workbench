import type {DecodedStreamResult} from './decoded-source-stream-transport';
import{sourceStreamRunSlices,type SourceStreamRunsClockPlan}from'./source-stream-runs-clock-v1';
export type {SourceStreamRunsClockPlan}from'./source-stream-runs-clock-v1';
type Phase = 'idle' | 'loading' | 'ready' | 'start-pending' | 'playing' | 'paused' | 'timeline-ended' | 'failed' | 'closed';
type Policy = {activation: 'automatic' | 'user'; reducedMotion: boolean};
const result = (accepted: boolean, reason: string): DecodedStreamResult => Object.freeze({accepted, reason});
const hashPattern = /^[a-f0-9]{64}$/u;

async function sha256(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), n => n.toString(16).padStart(2, '0')).join('');
}
async function pcmSha256(buffer: AudioBuffer) {
  // Channel-major Float32LE retains the v1 mono digest and binds both stereo
  // channels. It never downmixes or regenerates source MP3 bytes.
  const bytes = new ArrayBuffer(buffer.length * buffer.numberOfChannels * 4), view = new DataView(bytes);
  for(let ch=0;ch<buffer.numberOfChannels;ch++){
    const samples=buffer.getChannelData(ch);
    if(samples.length!==buffer.length)throw Error('decoded-channel-length-mismatch');
    for(let i=0;i<samples.length;i++){
      if(!Number.isFinite(samples[i]))throw Error('nonfinite-decoded-sample');
      view.setFloat32((ch*buffer.length+i)*4,samples[i],true);
    }
  }
  return sha256(bytes);
}

/** Stereo-capable successor of the frozen v1 clock. Existing admitted members
 * remain on v1 until separately revalidated. Slice coordinates are shared.
 * Clock for an individually audited set of source MP3 runs. Native scheduling preserves the declared runs
 * and gaps even if drawing pauses; navigation/Replay retires every node. */
export class SourceStreamRunsClockV2 {
  readonly plan: SourceStreamRunsClockPlan;
  private get endSeconds(){return (this.plan.lastFrame-1)/this.plan.fps;}
  private context?: AudioContext;
  private gain?: GainNode;
  private buffer?: AudioBuffer;
  private nodes = new Set<AudioBufferSourceNode>();
  private phase: Phase = 'idle';
  private position = 0;
  private anchor?: {contextTime: number; seconds: number};
  private epoch = 0;
  private volume = 1;
  private audioPhase = 'idle';
  private failure: string | null = null;

  constructor(plan: SourceStreamRunsClockPlan, private readonly options: {
    createContext?: () => AudioContext; commitHeldFrame: (frame: number) => boolean;
  }) {
    const d=plan.decoder;
    if(plan.version!==1||!hashPattern.test(plan.sourceSwfSha256)||!/^sprite-\d+$/u.test(plan.frameDomain)||plan.firstFrame!==1||
      !Number.isSafeInteger(plan.lastFrame)||plan.lastFrame<2||plan.lastFrame>18000||plan.fps!==12||
      plan.alignmentStatus!=='source-run-candidate-not-original-runtime-accepted'||d.sampleRate!==22050||![1,2].includes(d.channels)||
      !Number.isSafeInteger(d.decodedSamples)||d.decodedSamples<1||d.decodedSamples>20000000||!Number.isSafeInteger(d.sourceBytes)||d.sourceBytes<=0||
      !hashPattern.test(d.sourceSha256)||!hashPattern.test(d.pcmSha256)||typeof options.commitHeldFrame!=='function'||
      plan.segments.length<1||plan.segments.length>64||plan.emptyNegativeBlocks.length>64)throw Error('unsupported-source-runs-plan');
    let previousEnd=-1,previousFrame=0,previousDecodedEnd=0;
    for(const segment of plan.segments){
      if(![segment.firstFrame,segment.firstDecodedSample,segment.endDecodedSample].every(Number.isSafeInteger)||
        segment.firstFrame<=previousFrame||segment.firstFrame>plan.lastFrame||segment.firstDecodedSample<previousDecodedEnd||
        segment.firstDecodedSample<0||segment.endDecodedSample<=segment.firstDecodedSample||segment.endDecodedSample>d.decodedSamples||
        (segment.firstFrame-1)/12<previousEnd)throw Error('invalid-source-run-order-or-range');
      previousFrame=segment.firstFrame;previousDecodedEnd=segment.endDecodedSample;
      previousEnd=(segment.firstFrame-1)/12+(segment.endDecodedSample-segment.firstDecodedSample)/22050;
    }
    let previousMarkerFrame=0;
    for(const block of plan.emptyNegativeBlocks){
      if(!Number.isSafeInteger(block.frame)||block.frame<=previousMarkerFrame||block.frame>plan.lastFrame||block.samples!==0||block.mp3Bytes!==0||
        !Number.isSafeInteger(block.seek)||block.seek>=0||block.seek< -32768)throw Error('invalid-empty-source-marker');
      previousMarkerFrame=block.frame;
    }
    this.plan=Object.freeze({...plan,decoder:Object.freeze({...d}),emptyNegativeBlocks:Object.freeze(plan.emptyNegativeBlocks.map(b=>Object.freeze({...b}))),
      segments:Object.freeze(plan.segments.map(segment=>Object.freeze({...segment})))});
  }

  private settle() {
    if (!this.anchor || !this.context || this.phase !== 'playing') return;
    this.position = Math.min(this.endSeconds, this.anchor.seconds + Math.max(0, this.context.currentTime - this.anchor.contextTime));
    if (this.position >= this.endSeconds) {this.retire(); this.phase = 'timeline-ended'; this.audioPhase = 'boundary-held';}
  }
  private retire() {
    this.anchor = undefined;
    for (const node of this.nodes) {
      node.onended = null;
      try {node.stop();} catch {/* A source already at its native boundary still must be disconnected. */}
      node.disconnect();
    }
    this.nodes.clear();
  }
  private commit() {
    try {return this.options.commitHeldFrame(Math.min(this.plan.lastFrame, 1 + Math.floor(this.position * 12 + 1e-9))) === true;}
    catch {return false;}
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
    const frame = Math.min(this.plan.lastFrame, 1 + Math.floor(this.position * 12 + 1e-9));
    const segmentIndex = this.plan.segments.findIndex(s => this.position >= (s.firstFrame - 1) / 12 &&
      this.position < Math.min(this.endSeconds, (s.firstFrame - 1) / 12 + (s.endDecodedSample - s.firstDecodedSample) / 22050));
    let decodedSample=this.plan.segments[0].firstDecodedSample;
    for(const run of this.plan.segments){
      const start=(run.firstFrame-1)/12;
      if(this.position<start)break;
      decodedSample=Math.min(run.endDecodedSample,run.firstDecodedSample+(this.position-start)*22050);
    }
    return Object.freeze({phase: this.phase, frame, frameDomain: this.plan.frameDomain, elapsedSeconds: this.position,
      audio: Object.freeze({phase: this.audioPhase, decodedSample, contextTime: this.context?.currentTime ?? null, volume: this.volume}),
      audioEnded: segmentIndex < 0, activeSegmentIndex: segmentIndex, timelineReachedEnd: this.phase === 'timeline-ended',
      failure: this.failure, sourceAlignment: this.plan.alignmentStatus, originalRuntimeAccepted: false, audioAccepted: false, lessonCompleted: false});
  }

  async prepare(input: ArrayBuffer): Promise<DecodedStreamResult> {
    if (this.phase !== 'idle') return result(false, 'prepare-not-idle');
    const bytes = input.slice(0), ticket = ++this.epoch; this.phase = 'loading';
    try {
      const d = this.plan.decoder;
      if (bytes.byteLength !== d.sourceBytes || await sha256(bytes) !== d.sourceSha256) throw Error('source-byte-identity-mismatch');
      if (ticket !== this.epoch) return result(false, 'stale-prepare');
      const context = this.options.createContext?.() ?? new AudioContext({sampleRate: 22050, latencyHint: 'interactive'});
      this.context = context;
      if (context.sampleRate !== 22050) throw Error('context-sample-rate-mismatch');
      context.addEventListener('statechange', this.contextChanged);
      this.gain = context.createGain(); this.gain.connect(context.destination); this.gain.gain.setValueAtTime(this.volume, context.currentTime);
      const buffer = await context.decodeAudioData(bytes);
      if (ticket !== this.epoch) return result(false, 'stale-prepare');
      if (buffer.sampleRate !== 22050 || buffer.numberOfChannels !== this.plan.decoder.channels || buffer.length !== d.decodedSamples || await pcmSha256(buffer) !== d.pcmSha256) throw Error('decoded-buffer-identity-mismatch');
      if (ticket !== this.epoch) return result(false, 'stale-prepare');
      this.buffer = buffer; this.position = 0;
      if (!this.commit()) throw Error('source-first-frame-not-committed');
      this.phase = 'ready'; this.audioPhase = 'ready'; return result(true, 'source-runs-ready');
    } catch (error) {
      if (ticket !== this.epoch) return result(false, 'stale-prepare');
      this.failure = error instanceof Error ? error.message : String(error); this.retire();
      this.phase = 'failed'; this.audioPhase = 'failed'; this.buffer = undefined;
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
      const now = this.context.currentTime;
      // All source runs use the same native context anchor. Rendering ticks do
      // not start later runs, so background throttling cannot shift their cues.
      for (const slice of sourceStreamRunSlices(this.plan, this.position)) {
        const node = this.context.createBufferSource(); node.buffer = this.buffer; node.connect(this.gain); this.nodes.add(node);
        node.onended = () => {if (!this.nodes.delete(node)) return; node.onended = null; node.disconnect();};
        node.start(now + slice.delaySeconds, slice.firstDecodedSample / 22050, slice.durationSeconds);
      }
      this.anchor = {contextTime: now, seconds: this.position}; this.phase = 'playing'; this.audioPhase = 'playing'; this.failure = null;
      this.settle(); return result(true, 'source-runs-playing');
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
    if (this.commit()) return result(true, 'source-runs-held');
    this.phase = 'failed'; this.failure = 'paused-frame-not-committed'; return result(false, this.failure);
  }
  replay() {
    if (!['ready', 'paused', 'playing', 'start-pending', 'timeline-ended'].includes(this.phase)) return result(false, 'not-ready');
    this.epoch++; this.retire(); this.position = 0; this.phase = 'ready'; this.audioPhase = 'ready'; this.failure = null;
    if (this.commit()) return result(true, 'source-runs-replayed-and-held');
    this.phase = 'failed'; this.failure = 'replay-frame-not-committed'; return result(false, this.failure);
  }
  seekCandidateFrame(frame: number) {
    if (!Number.isSafeInteger(frame) || frame < 1 || frame > this.plan.lastFrame || !['ready', 'paused', 'playing', 'start-pending', 'timeline-ended'].includes(this.phase)) return result(false, 'invalid-candidate-frame');
    this.epoch++; this.retire(); this.position = (frame - 1) / 12; this.phase = 'paused'; this.audioPhase = 'paused';
    if (this.commit()) return result(true, 'source-candidate-frame-held');
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
