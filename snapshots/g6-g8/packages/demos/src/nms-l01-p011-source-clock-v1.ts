import type {DecodedSourceStreamBinding, DecodedStreamResult} from './decoded-source-stream-transport';
import {selectHostFeedback} from './g678-advanced-manual/host-feedback-selector';

export interface P011AudioClip {
  readonly frameDomain: string;
  readonly frameCount: number;
  readonly rawAudioFirstFrame: number;
  readonly latencySamples: number;
  readonly decoder: DecodedSourceStreamBinding;
  readonly normalization?: string;
  readonly emptyNegativeBlocks?: readonly Readonly<{frame: number; samples: number; seek: number; mp3Bytes: number}>[];
}
type SourceBounds = Readonly<{x: number; y: number; width: number; height: number}>;
export interface P011Branch {
  readonly kind: 'wrong' | 'right';
  readonly index: number;
  readonly instanceName: string;
  readonly frameDomain: string;
  readonly sourceCharacterId: number;
  readonly frameCount: number;
  readonly entryFrame: 2;
  readonly sourcePlacement?: Readonly<{frame: number; tag: string; replace: string; depth: string; objectID: string;
    morph: string; name: string; transform: Readonly<Record<string, string>>}>;
  readonly hostXOverridePixels?: number;
  readonly waitFrame?: number;
  readonly closeEntryFrame?: number;
  readonly popupEntryFrame?: number;
  readonly popupLastFrame?: number;
  readonly popupTextBounds?: SourceBounds;
  readonly popupCloseBounds?: SourceBounds;
  readonly popupMatrixTwips?: readonly number[];
}
export interface P011AudioPlan {
  readonly version: 1;
  readonly animationId: 'shared-nms002-l01-p011';
  readonly sourceSwfSha256: string;
  readonly fps: 12;
  readonly mainFrameDomain: 'sprite-214';
  readonly mainFrameCount: 145;
  readonly questionFrame: 102;
  readonly outroFirstFrame: 103;
  readonly mainAudioFirstFrame: 6;
  readonly clips: readonly P011AudioClip[];
  readonly branches: readonly P011Branch[];
  readonly sourceAlignment: string;
  readonly seedPolicy?: string;
}
export type P011ChoiceId = 'answer-depth-23' | 'answer-depth-25' | 'answer-depth-21';
export interface P011Picture {
  readonly mainFrame: number;
  readonly interaction: Readonly<{
    feedbackCharacterId: number | null;
    feedbackFrame: number;
    choicesEnabled: boolean;
    popupVisible: boolean;
  }>;
}
type Operation = 'intro' | 'wrong' | 'wrong-close' | 'right' | 'outro';
type Phase = 'idle' | 'loading' | 'ready' | 'starting' | 'playing' | 'paused' | 'question' | 'wrong-wait' | 'ended' | 'failed' | 'closed';
type Policy = {activation: 'automatic' | 'user'; reducedMotion: boolean};
type Window = {domain: string; start: number; end: number; sample: number};
const result = (accepted: boolean, reason: string): DecodedStreamResult => Object.freeze({accepted, reason});
const hashPattern = /^[a-f0-9]{64}$/u;
const framesPerSecond = 12, sampleRate = 22050;
const mainDomain = 'sprite-214';
const branchRows = [
  ['wrong', 1, 92, 30],
  ['wrong', 2, 68, 28],
  ['wrong', 3, 80, 29],
  ['right', 1, 155, 27],
  ['right', 2, 183, 28],
  ['right', 3, 207, 28],
  ['right', 4, 143, 27],
] as const;

async function hash(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), n => n.toString(16).padStart(2, '0')).join('');
}
async function pcmHash(buffer: AudioBuffer) {
  const bytes = new ArrayBuffer(buffer.length * 4), view = new DataView(bytes), samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) {
    if (!Number.isFinite(samples[i])) throw Error('nonfinite-source-pcm');
    view.setFloat32(i * 4, samples[i], true);
  }
  return hash(bytes);
}

/** Exact NMS002/L1/VB07 host branch set; no original Adobe RNG or audio-alignment claim. */
export class P011SourceClockV1 {
  readonly plan: P011AudioPlan;
  private readonly clips = new Map<string, P011AudioClip>();
  private readonly buffers = new Map<string, AudioBuffer>();
  private readonly nodes = new Set<AudioBufferSourceNode>();
  private readonly seed: number;
  private context?: AudioContext;
  private gain?: GainNode;
  private phase: Phase = 'idle';
  private operation: Operation = 'intro';
  private position = 0;
  private outroFirst = 103;
  private selected: P011Branch | null = null;
  private choice: P011ChoiceId | null = null;
  private attempts = 0;
  private solved = false;
  private anchor?: {time: number; position: number};
  private epoch = 0;
  private globalPaused = true;
  private volume = 1;
  private inspection = false;
  private failure: string | null = null;

  constructor(plan: P011AudioPlan, private readonly options: {
    seed?: number;
    createContext?: () => AudioContext;
    commitPicture: (picture: P011Picture) => boolean;
  }) {
    if (plan.version !== 1 || plan.animationId !== 'shared-nms002-l01-p011' ||
      plan.sourceSwfSha256 !== '47d582e2d97b6ad33cdf5588a4894fde7ceeef80703fe1862f625cacb4fea481' ||
      plan.fps !== 12 || plan.mainFrameDomain !== mainDomain || plan.mainFrameCount !== 145 ||
      plan.questionFrame !== 102 || plan.outroFirstFrame !== 103 || plan.mainAudioFirstFrame !== 6 ||
      plan.clips.length !== 8 || plan.branches.length !== 7 || typeof options.commitPicture !== 'function') {
      throw Error('P011_SOURCE_PLAN_MISMATCH');
    }
    if (options.seed !== undefined && (!Number.isSafeInteger(options.seed) || options.seed < 0 || options.seed > 0xffffffff)) {
      throw Error('P011_INVALID_SEED');
    }
    this.seed = options.seed ?? 0;
    const expected: Record<string, readonly number[]> = {
      'sprite-214': [145, 6, 1673, 256896],
      'sprite-92': [30, 2, 1673, 52992],
      'sprite-68': [28, 2, 1673, 48960],
      'sprite-80': [29, 2, 1673, 51264],
      'sprite-155': [27, 2, 1673, 47232],
      'sprite-183': [28, 2, 1673, 48960],
      'sprite-207': [28, 1, 1673, 51264],
      'sprite-143': [27, 1, 1673, 48960],
    };
    for (const clip of plan.clips) {
      const e = expected[clip.frameDomain], d = clip.decoder;
      if (!e || this.clips.has(clip.frameDomain) || clip.frameCount !== e[0] ||
        clip.rawAudioFirstFrame !== e[1] || clip.latencySamples !== e[2] ||
        d.decodedSamples !== e[3] || d.sampleRate !== sampleRate || d.channels !== 1 ||
        !Number.isSafeInteger(d.sourceBytes) || d.sourceBytes < 1 || !hashPattern.test(d.sourceSha256) || !hashPattern.test(d.pcmSha256)) {
        throw Error('P011_SOURCE_CLIP_MISMATCH');
      }
      this.clips.set(clip.frameDomain, Object.freeze({...clip, decoder: Object.freeze({...d})}));
    }
    for (let i = 0; i < branchRows.length; i++) {
      const [kind, index, id, count] = branchRows[i], b = plan.branches[i];
      if (b.kind !== kind || b.index !== index || b.sourceCharacterId !== id || b.frameDomain !== `sprite-${id}` ||
        b.frameCount !== count || b.entryFrame !== 2 || b.instanceName !== `Mc_${kind === 'wrong' ? 'Wrong' : 'Right'}_Feed${index}`) {
        throw Error('P011_SOURCE_BRANCH_MISMATCH');
      }
    }
    this.plan = Object.freeze({...plan, clips: Object.freeze([...this.clips.values()]),
      branches: Object.freeze(plan.branches.map(b => Object.freeze({...b})))});
  }

  private rightSeconds() { return (this.selected!.frameCount - 2) / framesPerSecond; }
  private duration() {
    if (this.operation === 'intro') return 101 / framesPerSecond;
    if (this.operation === 'wrong') return 20 / framesPerSecond;
    if (this.operation === 'wrong-close') return (this.selected!.frameCount - 23) / framesPerSecond;
    if (this.operation === 'right') return this.rightSeconds() + 42 / framesPerSecond;
    return (145 - this.outroFirst) / framesPerSecond;
  }
  /** Samples are scheduled at native time before RAF. Source frame22/102 holds cannot overrun. */
  private clipWindow(domain: string, firstFrame: number, start: number, end: number): Window {
    const c = this.clips.get(domain)!, lead = Math.max(0, c.rawAudioFirstFrame - firstFrame) / framesPerSecond;
    const sample = c.latencySamples + Math.max(0, firstFrame - c.rawAudioFirstFrame) * sampleRate / framesPerSecond;
    return {domain, start: start + lead, end: Math.min(end, start + lead + Math.max(0, c.decoder.decodedSamples - sample) / sampleRate), sample};
  }
  private windows(): Window[] {
    if (this.operation === 'intro') return [this.clipWindow(mainDomain, 1, 0, this.duration())];
    if (this.operation === 'wrong') return [this.clipWindow(this.selected!.frameDomain, 2, 0, this.duration())];
    if (this.operation === 'wrong-close') return [this.clipWindow(this.selected!.frameDomain, 23, 0, this.duration())];
    if (this.operation === 'right') return [
      this.clipWindow(this.selected!.frameDomain, 2, 0, this.rightSeconds()),
      this.clipWindow(mainDomain, 103, this.rightSeconds(), this.duration()),
    ];
    return [this.clipWindow(mainDomain, this.outroFirst, 0, this.duration())];
  }
  private retire() {
    this.anchor = undefined;
    for (const node of this.nodes) {
      node.onended = null;
      try { node.stop(); } catch { /* A native node may already have ended. */ }
      node.disconnect();
    }
    this.nodes.clear();
  }
  private settle() {
    if (this.phase !== 'playing' || !this.anchor || !this.context) return;
    this.position = Math.min(this.duration(), this.anchor.position + Math.max(0, this.context.currentTime - this.anchor.time));
    if (this.position < this.duration() - 1e-9) return;
    this.retire();
    if (this.operation === 'intro' || this.operation === 'wrong-close') {
      this.phase = 'question';
      if (this.operation === 'wrong-close') this.selected = null;
      this.operation = 'intro'; this.position = 101 / framesPerSecond;
    } else if (this.operation === 'wrong') this.phase = 'wrong-wait';
    else { this.phase = 'ended'; this.globalPaused = true; }
  }
  private picture(): P011Picture {
    const active = ['starting', 'playing', 'paused'].includes(this.phase);
    let mainFrame = ['idle', 'loading', 'ready'].includes(this.phase) ? 1 : 102;
    let feedbackCharacterId: number | null = null, feedbackFrame = 1;
    if (this.operation === 'intro' && (active || this.phase === 'ready')) {
      mainFrame = Math.min(102, 1 + Math.floor(this.position * framesPerSecond + 1e-8));
    }
    if (this.selected && (active || this.phase === 'wrong-wait')) {
      if (this.operation === 'wrong' || this.operation === 'wrong-close') {
        feedbackCharacterId = this.selected.sourceCharacterId;
        feedbackFrame = Math.min(this.operation === 'wrong' ? 22 : this.selected.frameCount,
          (this.operation === 'wrong' ? 2 : 23) + Math.floor(this.position * framesPerSecond + 1e-8));
      } else if (this.operation === 'right') {
        if (this.position < this.rightSeconds() - 1e-9) {
          feedbackCharacterId = this.selected.sourceCharacterId;
          feedbackFrame = Math.min(this.selected.frameCount, 2 + Math.floor(this.position * framesPerSecond + 1e-8));
        } else mainFrame = Math.min(145, 103 + Math.floor((this.position - this.rightSeconds()) * framesPerSecond + 1e-8));
      }
    }
    if (this.operation === 'outro' && active) mainFrame = Math.min(145, this.outroFirst + Math.floor(this.position * framesPerSecond + 1e-8));
    if (this.phase === 'ended') mainFrame = 145;
    return Object.freeze({mainFrame, interaction: Object.freeze({feedbackCharacterId, feedbackFrame,
      choicesEnabled: this.phase === 'question' && !this.solved,
      popupVisible: this.selected?.kind === 'wrong' && feedbackCharacterId !== null && feedbackFrame >= 16 && feedbackFrame <= 22})});
  }
  private commit() { try { return this.options.commitPicture(this.picture()) === true; } catch { return false; } }
  snapshot() {
    this.settle();
    const active = this.phase === 'playing' && this.context?.state === 'running'
      ? this.windows().find(w => this.position >= w.start - 1e-9 && this.position < w.end - 1e-9) : undefined;
    return Object.freeze({phase: this.phase, operation: this.operation, operationSeconds: this.position,
      picture: this.picture(), seed: this.seed, attempts: this.attempts, choice: this.choice,
      selectedBranch: this.selected, correctAnswer: this.solved, globalPaused: this.globalPaused,
      inspectionMode: this.inspection, sourceQuizActive: this.picture().mainFrame === 102 && !this.solved,
      audioNodePlaying: Boolean(active), audioDomain: active?.domain ?? null,
      audioSample: active ? active.sample + Math.max(0, this.position - active.start) * sampleRate : 0,
      contextTime: this.context?.currentTime ?? null, volume: this.volume, failure: this.failure,
      originalRuntimeAccepted: false, audioAccepted: false, lessonCompleted: false});
  }
  tick() { return this.snapshot(); }
  private readonly contextChanged = () => {
    if (!this.context || this.context.state === 'running' || ['loading', 'closed'].includes(this.phase)) return;
    this.settle(); this.epoch++; this.retire(); this.globalPaused = true;
    if (this.context.state === 'closed') {
      this.phase = 'closed'; this.buffers.clear(); this.context.removeEventListener('statechange', this.contextChanged);
    } else if (['playing', 'starting'].includes(this.phase)) this.phase = 'paused';
    this.commit();
  };
  private fail(reason: string) {
    this.epoch++; this.retire(); this.phase = 'failed'; this.globalPaused = true; this.failure = reason;
    return result(false, reason);
  }
  async prepare(payloads: ReadonlyMap<string, ArrayBuffer>): Promise<DecodedStreamResult> {
    if (this.phase !== 'idle') return result(false, 'prepare-not-idle');
    this.phase = 'loading'; const turn = ++this.epoch;
    try {
      if (payloads.size !== 8 || [...payloads.keys()].some(k => !this.clips.has(k))) throw Error('P011_EXACT_ACTIVE_PAYLOADS_REQUIRED');
      const copies = new Map([...payloads].map(([id, bytes]) => [id, bytes.slice(0)]));
      for (const [id, bytes] of copies) {
        const d = this.clips.get(id)!.decoder;
        if (bytes.byteLength !== d.sourceBytes || await hash(bytes) !== d.sourceSha256) throw Error('source-byte-identity-mismatch:' + id);
      }
      if (turn !== this.epoch) return result(false, 'stale-prepare');
      const context = this.options.createContext?.() ?? new AudioContext({sampleRate, latencyHint: 'interactive'});
      this.context = context;
      if (context.sampleRate !== sampleRate) throw Error('context-rate-mismatch');
      context.addEventListener('statechange', this.contextChanged);
      this.gain = context.createGain(); this.gain.connect(context.destination);
      this.gain.gain.setValueAtTime(this.volume, context.currentTime);
      for (const [id, bytes] of copies) {
        const decoded = await context.decodeAudioData(bytes), d = this.clips.get(id)!.decoder;
        if (turn !== this.epoch) return result(false, 'stale-prepare');
        if (decoded.sampleRate !== sampleRate || decoded.numberOfChannels !== 1 || decoded.length !== d.decodedSamples || await pcmHash(decoded) !== d.pcmSha256) {
          throw Error('decoded-pcm-identity-mismatch:' + id);
        }
        if (turn !== this.epoch) return result(false, 'stale-prepare');
        this.buffers.set(id, decoded);
      }
      this.phase = 'ready';
      if (!this.commit()) throw Error('source-picture-not-committed');
      return result(true, 'P011_SOURCE_READY');
    } catch (error) {
      if (turn !== this.epoch) return result(false, 'stale-prepare');
      const r = this.fail(error instanceof Error ? error.message : String(error));
      this.context?.removeEventListener('statechange', this.contextChanged); this.gain?.disconnect();
      if (this.context && this.context.state !== 'closed') await this.context.close();
      this.buffers.clear(); return r;
    }
  }
  async play(policy: Policy): Promise<DecodedStreamResult> {
    this.settle();
    if (!['automatic', 'user'].includes(policy.activation) || typeof policy.reducedMotion !== 'boolean') return result(false, 'invalid-play-policy');
    if (policy.activation === 'automatic' && policy.reducedMotion) return result(false, 'reduced-motion-hold');
    if (['question', 'wrong-wait'].includes(this.phase)) { this.globalPaused = false; return result(true, 'source-waiting-for-input'); }
    if (this.phase === 'playing') return result(true, 'already-playing');
    if (!['ready', 'paused', 'starting'].includes(this.phase) || !this.context || !this.gain) return result(false, 'source-phase-cannot-play');
    if (this.phase === 'starting' && policy.activation === 'automatic') return result(false, 'start-pending');
    const turn = ++this.epoch; this.retire(); this.phase = 'starting'; this.globalPaused = false;
    try {
      if (!this.commit()) throw Error('source-picture-not-committed');
      if (turn !== this.epoch) return result(false, 'stale-frame-commit');
      await this.context.resume();
      if (turn !== this.epoch) return result(false, 'stale-start');
      if (this.context.state !== 'running') throw Error('context-not-running');
      const now = this.context.currentTime;
      for (const w of this.windows()) {
        const start = Math.max(this.position, w.start), end = Math.min(this.duration(), w.end);
        if (start >= end) continue;
        const node = this.context.createBufferSource(); node.buffer = this.buffers.get(w.domain)!;
        node.connect(this.gain); this.nodes.add(node);
        node.onended = () => { if (this.nodes.delete(node)) { node.onended = null; node.disconnect(); } };
        node.start(now + start - this.position, (w.sample + (start - w.start) * sampleRate) / sampleRate, end - start);
      }
      this.anchor = {time: now, position: this.position}; this.phase = 'playing'; this.failure = null;
      return result(true, 'source-operation-playing');
    } catch (error) {
      if (turn !== this.epoch) return result(false, 'stale-start');
      this.retire(); this.phase = 'paused'; this.globalPaused = true;
      this.failure = error instanceof Error ? error.message : String(error);
      return result(false, this.failure);
    }
  }
  pause() {
    this.settle(); this.epoch++; this.retire(); this.globalPaused = true;
    if (['playing', 'starting'].includes(this.phase)) this.phase = 'paused';
    return this.commit() ? result(true, 'source-held') : this.fail('paused-picture-not-committed');
  }
  async choose(choice: string, policy: Policy) {
    this.settle();
    if (this.phase !== 'question' || this.solved || !['answer-depth-23', 'answer-depth-25', 'answer-depth-21'].includes(choice)) return result(false, 'source-choice-unavailable');
    const kind = choice === 'answer-depth-23' ? 'right' : 'wrong';
    const selected = selectHostFeedback(kind, (this.seed + this.attempts) >>> 0);
    this.selected = this.plan.branches.find(b => b.kind === kind && b.index === selected.branchIndex)!;
    this.choice = choice as P011ChoiceId; this.attempts++; this.solved = kind === 'right';
    this.operation = kind; this.position = 0; this.phase = 'paused';
    return this.play(policy);
  }
  async closeWrong(policy: Policy) {
    this.settle();
    if (this.selected?.kind !== 'wrong' || !this.picture().interaction.popupVisible) return result(false, 'source-popup-not-open');
    this.epoch++; this.retire(); this.operation = 'wrong-close'; this.position = 0; this.phase = 'paused';
    return this.play(policy);
  }
  replay() {
    if (['idle', 'loading', 'failed', 'closed'].includes(this.phase)) return result(false, 'replay-unavailable');
    this.epoch++; this.retire(); this.operation = 'intro'; this.position = 0; this.outroFirst = 103;
    this.selected = null; this.choice = null; this.attempts = 0; this.solved = false;
    this.phase = 'ready'; this.globalPaused = true; this.inspection = false; this.failure = null;
    return this.commit() ? result(true, 'source-replayed') : this.fail('replay-picture-not-committed');
  }
  inspect(frame: number) {
    if (!Number.isSafeInteger(frame) || frame < 1 || frame > 145 || ['idle', 'loading', 'failed', 'closed'].includes(this.phase)) return result(false, 'invalid-source-inspection');
    this.epoch++; this.retire(); this.selected = null; this.choice = null; this.attempts = 0; this.solved = false;
    this.inspection = true; this.globalPaused = true; this.failure = null;
    if (frame <= 102) { this.operation = 'intro'; this.position = (frame - 1) / framesPerSecond; this.phase = frame === 102 ? 'question' : 'paused'; }
    else { this.operation = 'outro'; this.outroFirst = frame; this.position = 0; this.phase = frame === 145 ? 'ended' : 'paused'; }
    return this.commit() ? result(true, 'source-frame-inspected') : this.fail('inspection-picture-not-committed');
  }
  setVolume(value: number) {
    if (!Number.isFinite(value) || value < 0 || value > 1 || this.phase === 'closed') return result(false, 'invalid-volume');
    this.volume = value;
    if (this.context) this.gain?.gain.setValueAtTime(value, this.context.currentTime);
    return result(true, 'volume-set');
  }
  async close() {
    if (this.phase === 'closed') return;
    this.epoch++; this.retire(); this.phase = 'closed'; this.globalPaused = true; this.buffers.clear();
    this.context?.removeEventListener('statechange', this.contextChanged); this.gain?.disconnect();
    if (this.context && this.context.state !== 'closed') await this.context.close();
  }
}
