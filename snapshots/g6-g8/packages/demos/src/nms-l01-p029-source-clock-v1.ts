import type {DecodedSourceStreamBinding, DecodedStreamResult} from './decoded-source-stream-transport';

export interface P029AudioClip {
  readonly frameDomain: string; readonly frameCount: number; readonly rawAudioFirstFrame: number;
  readonly latencySamples: number; readonly decoder: DecodedSourceStreamBinding;
  readonly normalization?: string;
  readonly emptyNegativeBlocks?: readonly Readonly<{frame: number; samples: number; seek: number; mp3Bytes: number}>[];
}
export interface P029AudioPlan {
  readonly version: 1; readonly animationId: 'shared-nms002-l01-p029'; readonly sourceSwfSha256: string;
  readonly fps: 12; readonly mainFrameDomain: 'sprite-327'; readonly mainFrameCount: 437;
  readonly questionFrame: 396; readonly outroFirstFrame: 397; readonly mainAudioFirstFrame: 9;
  readonly clips: readonly P029AudioClip[]; readonly sourceAlignment: string;
  readonly wrong: Readonly<Record<string, unknown>>; readonly correct: Readonly<Record<string, unknown>>; readonly coach: Readonly<Record<string, unknown>>;
}
export interface P029Picture {
  readonly mainFrame: number;
  readonly interaction: Readonly<{
    solvedIndices: readonly number[]; selectedIndex: number | null;
    drag: Readonly<{index: number; x: number; y: number}> | null;
    inputEnabled: boolean; helpEnabled: boolean; helpVisible: boolean;
    wrongVisible: boolean; wrongFrame: number; coachFrame: number; correctFrame: number;
  }>;
}
type Operation = 'intro' | 'wrong' | 'coach' | 'final' | 'outro';
type Phase = 'idle' | 'loading' | 'ready' | 'starting' | 'playing' | 'paused' | 'question' | 'wrong-wait' | 'ended' | 'failed' | 'closed';
type Policy = {activation: 'automatic' | 'user'; reducedMotion: boolean};
type Window = {domain: string; start: number; end: number; sample: number};
const result = (accepted: boolean, reason: string): DecodedStreamResult => Object.freeze({accepted, reason});
const hashPattern = /^[a-f0-9]{64}$/u;
const framesPerSecond = 12, sampleRate = 22050, mainDomain = 'sprite-327';
const isIndex = (n: number) => Number.isSafeInteger(n) && n >= 0 && n <= 12;
const isTarget = (n: number) => Number.isSafeInteger(n) && n >= 0 && n <= 4;
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

/** Thirteen source choices, five exact opposite targets, eight distractors and native continuous MP3 windows. Original Flash hit/alignment acceptance remains separate. */
export class P029SourceClockV1 {
  readonly plan: P029AudioPlan;
  private readonly clips = new Map<string, P029AudioClip>();
  private readonly buffers = new Map<string, AudioBuffer>();
  private readonly nodes = new Set<AudioBufferSourceNode>();
  private readonly solved = new Set<number>();
  private context?: AudioContext; private gain?: GainNode;
  private phase: Phase = 'idle'; private operation: Operation = 'intro';
  private position = 0; private outroFirst = 397;
  private selected: number | null = null;
  private drag: {index: number; x: number; y: number} | null = null;
  private helpVisible = false; private helpResume = false;
  private attempts = 0; private anchor?: {time: number; position: number}; private epoch = 0;
  private globalPaused = true; private volume = 1; private inspection = false; private failure: string | null = null;

  constructor(plan: P029AudioPlan, private readonly options: {
    createContext?: () => AudioContext; commitPicture: (picture: P029Picture) => boolean;
  }) {
    if (plan.version !== 1 || plan.animationId !== 'shared-nms002-l01-p029' ||
      plan.sourceSwfSha256 !== '1570b465737d854cc5ecf2bf294e5ae87675b428d7b7c132b6b85e405704d048' ||
      plan.fps !== 12 || plan.mainFrameDomain !== mainDomain || plan.mainFrameCount !== 437 ||
      plan.questionFrame !== 396 || plan.outroFirstFrame !== 397 || plan.mainAudioFirstFrame !== 9 ||
      plan.clips.length !== 3 || typeof options.commitPicture !== 'function') throw Error('P029_SOURCE_PLAN_MISMATCH');
    if (plan.wrong.sourceCharacterId !== 318 || plan.wrong.frameCount !== 15 || plan.wrong.entryFrame !== 2 || plan.wrong.waitFrame !== 15 ||
      plan.coach.sourceCharacterId !== 326 || plan.coach.frameCount !== 20 || plan.coach.entryFrame !== 2 ||
      plan.correct.sourceCharacterId !== 322 || plan.correct.frameCount !== 25 || plan.correct.entryFrame !== 2) throw Error('P029_SOURCE_FEEDBACK_MISMATCH');
    const expected: Record<string, readonly number[]> = {
      'sprite-327': [437, 9, 1673, 786816], 'sprite-318': [15, 1, 1673, 27072], 'sprite-326': [20, 2, 1673, 34560],
    };
    for (const clip of plan.clips) {
      const e = expected[clip.frameDomain], d = clip.decoder;
      if (!e || this.clips.has(clip.frameDomain) || clip.frameCount !== e[0] ||
        clip.rawAudioFirstFrame !== e[1] || clip.latencySamples !== e[2] || d.decodedSamples !== e[3] ||
        d.sampleRate !== sampleRate || d.channels !== 1 || !Number.isSafeInteger(d.sourceBytes) ||
        d.sourceBytes < 1 || !hashPattern.test(d.sourceSha256) || !hashPattern.test(d.pcmSha256)) throw Error('P029_SOURCE_CLIP_MISMATCH');
      this.clips.set(clip.frameDomain, Object.freeze({...clip, decoder: Object.freeze({...d})}));
    }
    this.plan = Object.freeze({...plan, clips: Object.freeze([...this.clips.values()])});
  }
  private duration() {
    if (this.operation === 'intro') return 395 / framesPerSecond;
    if (this.operation === 'wrong') return 13 / framesPerSecond;
    if (this.operation === 'coach') return 18 / framesPerSecond;
    if (this.operation === 'final') return (18 + 23 + 40) / framesPerSecond;
    return (437 - this.outroFirst) / framesPerSecond;
  }
  private clipWindow(domain: string, firstFrame: number, start: number, end: number): Window {
    const c = this.clips.get(domain)!, lead = Math.max(0, c.rawAudioFirstFrame - firstFrame) / framesPerSecond;
    const sample = c.latencySamples + Math.max(0, firstFrame - c.rawAudioFirstFrame) * sampleRate / framesPerSecond;
    return {domain, start: start + lead, end: Math.min(end, start + lead + Math.max(0, c.decoder.decodedSamples - sample) / sampleRate), sample};
  }
  private windows(): Window[] {
    if (this.operation === 'intro') return [this.clipWindow(mainDomain, 1, 0, this.duration())];
    if (this.operation === 'wrong') return [this.clipWindow('sprite-318', 2, 0, this.duration())];
    if (this.operation === 'coach') return [this.clipWindow('sprite-326', 2, 0, this.duration())];
    if (this.operation === 'final') return [this.clipWindow('sprite-326', 2, 0, 18 / 12),
      this.clipWindow(mainDomain, 397, 41 / 12, this.duration())];
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
    if (this.operation === 'intro' || this.operation === 'coach') this.waitForQuestion();
    else if (this.operation === 'wrong') this.phase = 'wrong-wait';
    else { this.phase = 'ended'; this.globalPaused = true; }
  }
  private waitForQuestion() { this.phase = 'question'; this.operation = 'intro'; this.position = 395 / 12; }
  private picture(): P029Picture {
    const active = ['starting', 'playing', 'paused'].includes(this.phase);
    let mainFrame = ['idle', 'loading', 'ready'].includes(this.phase) ? 1 : 396;
    let wrongFrame = 1, coachFrame = 1, correctFrame = 1;
    if (this.operation === 'intro' && (active || this.phase === 'ready')) mainFrame = Math.min(396, 1 + Math.floor(this.position * 12 + 1e-8));
    if (this.operation === 'wrong' && (active || this.phase === 'wrong-wait')) wrongFrame = Math.min(15, 2 + Math.floor(this.position * 12 + 1e-8));
    if ((this.operation === 'coach' || this.operation === 'final') && active) {
      if (this.position < 18 / 12 - 1e-9) coachFrame = Math.min(20, 2 + Math.floor(this.position * 12 + 1e-8));
      else if (this.operation === 'final') {
        if (this.position < 41 / 12 - 1e-9) correctFrame = Math.min(25, 2 + Math.floor((this.position - 18 / 12) * 12 + 1e-8));
        else mainFrame = Math.min(437, 397 + Math.floor((this.position - 41 / 12) * 12 + 1e-8));
      }
    }
    if (this.operation === 'outro' && active) mainFrame = Math.min(437, this.outroFirst + Math.floor(this.position * 12 + 1e-8));
    if (this.phase === 'ended') mainFrame = 437;
    return Object.freeze({mainFrame, interaction: Object.freeze({
      solvedIndices: Object.freeze([...this.solved].sort((a, b) => a - b)), selectedIndex: this.selected,
      drag: this.drag ? Object.freeze({...this.drag}) : null,
      inputEnabled: this.phase === 'question' && this.solved.size < 5 && !this.helpVisible,
      helpEnabled: !this.helpVisible && mainFrame === 396 &&
        (this.operation === 'intro' && !['failed', 'closed'].includes(this.phase)),
      helpVisible: this.helpVisible, wrongVisible: wrongFrame > 1, wrongFrame, coachFrame, correctFrame,
    })});
  }
  private commit() { try { return this.options.commitPicture(this.picture()) === true; } catch { return false; } }
  snapshot() {
    this.settle();
    const picture = this.picture(), active = this.phase === 'playing' && this.context?.state === 'running'
      ? this.windows().find(w => this.position >= w.start - 1e-9 && this.position < w.end - 1e-9) : undefined;
    return Object.freeze({phase: this.phase, operation: this.operation, operationSeconds: this.position, picture,
      attempts: this.attempts, solvedCount: this.solved.size, allCorrect: this.solved.size === 5,
      globalPaused: this.globalPaused, inspectionMode: this.inspection,
      sourceQuizActive: picture.mainFrame === 396, audioNodePlaying: Boolean(active), audioDomain: active?.domain ?? null,
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
      if (payloads.size !== 3 || [...payloads.keys()].some(k => !this.clips.has(k))) throw Error('P029_EXACT_ACTIVE_PAYLOADS_REQUIRED');
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
      return result(true, 'P029_SOURCE_READY');
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
    if (this.helpVisible) return result(false, 'source-help-open');
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
    this.settle(); this.epoch++; this.retire(); this.globalPaused = true; this.drag = null;
    if (['playing', 'starting'].includes(this.phase)) this.phase = 'paused';
    return this.commit() ? result(true, 'source-held') : this.fail('paused-picture-not-committed');
  }
  select(index: number) {
    this.settle();
    if (!isIndex(index) || !this.picture().interaction.inputEnabled || this.solved.has(index)) return result(false, 'source-piece-unavailable');
    this.selected = index; this.drag = null;
    return this.commit() ? result(true, 'source-piece-selected') : this.fail('selected-picture-not-committed');
  }
  beginDrag(index: number) {
    const r = this.select(index); if (!r.accepted) return r;
    this.drag = {index, x: 0, y: 0};
    return this.commit() ? result(true, 'source-drag-started') : this.fail('drag-picture-not-committed');
  }
  moveDrag(x: number, y: number) {
    if (!this.drag || !this.picture().interaction.inputEnabled || !Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 10000 || Math.abs(y) > 10000) return result(false, 'source-drag-unavailable');
    this.drag = {...this.drag, x, y};
    return this.commit() ? result(true, 'source-drag-moved') : this.fail('drag-picture-not-committed');
  }
  cancelDrag() {
    this.drag = null; this.selected = null;
    return this.commit() ? result(true, 'source-drag-cancelled') : this.fail('cancel-picture-not-committed');
  }
  async drop(index: number, targetIndex: number | null, policy: Policy) {
    this.settle();
    if (!isIndex(index) || (targetIndex !== null && !isTarget(targetIndex)) || !this.picture().interaction.inputEnabled || this.solved.has(index)) return result(false, 'source-drop-unavailable');
    this.epoch++; this.retire(); this.selected = null; this.drag = null; this.attempts++;
    if (isTarget(index) && targetIndex === index) { this.solved.add(index); this.operation = this.solved.size === 5 ? 'final' : 'coach'; }
    else this.operation = 'wrong';
    this.position = 0; this.phase = 'paused'; return this.play(policy);
  }
  closeWrong() {
    this.settle();
    if (!this.picture().interaction.wrongVisible || this.helpVisible) return result(false, 'source-popup-not-open');
    this.epoch++; this.retire(); this.waitForQuestion(); this.globalPaused = false;
    return this.commit() ? result(true, 'source-popup-closed') : this.fail('close-picture-not-committed');
  }
  openHelp() {
    this.settle();
    if (!this.picture().interaction.helpEnabled) return result(false, 'source-help-unavailable');
    this.helpResume = this.phase === 'playing' && !this.globalPaused;
    const r = this.pause(); if (!r.accepted) return r;
    this.helpVisible = true;
    return this.commit() ? result(true, 'source-help-opened') : this.fail('help-picture-not-committed');
  }
  async closeHelp(policy: Policy) {
    if (!this.helpVisible) return result(false, 'source-help-not-open');
    this.helpVisible = false; const resume = this.helpResume; this.helpResume = false;
    if (!this.commit()) return this.fail('help-close-picture-not-committed');
    return resume ? this.play(policy) : result(true, 'source-help-closed');
  }
  replay() {
    if (['idle', 'loading', 'failed', 'closed'].includes(this.phase)) return result(false, 'replay-unavailable');
    this.epoch++; this.retire(); this.operation = 'intro'; this.position = 0; this.outroFirst = 397;
    this.solved.clear(); this.selected = null; this.drag = null; this.attempts = 0; this.helpVisible = false; this.helpResume = false;
    this.phase = 'ready'; this.globalPaused = true; this.inspection = false; this.failure = null;
    return this.commit() ? result(true, 'source-replayed') : this.fail('replay-picture-not-committed');
  }
  inspect(frame: number) {
    if (!Number.isSafeInteger(frame) || frame < 1 || frame > 437 || ['idle', 'loading', 'failed', 'closed'].includes(this.phase)) return result(false, 'invalid-source-inspection');
    this.epoch++; this.retire(); this.solved.clear(); this.selected = null; this.drag = null; this.attempts = 0;
    this.helpVisible = false; this.helpResume = false; this.inspection = true; this.globalPaused = true; this.failure = null;
    if (frame <= 396) { this.operation = 'intro'; this.position = (frame - 1) / 12; this.phase = frame === 396 ? 'question' : 'paused'; }
    else { this.operation = 'outro'; this.outroFirst = frame; this.position = 0; this.phase = frame === 437 ? 'ended' : 'paused'; }
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
