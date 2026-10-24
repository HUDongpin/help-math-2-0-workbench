import type {DecodedSourceStreamBinding, DecodedStreamResult} from './decoded-source-stream-transport';

export interface P037AudioClip {
  readonly frameDomain: string; readonly frameCount: number; readonly rawAudioFirstFrame: number;
  readonly latencySamples: number; readonly decoder: DecodedSourceStreamBinding;
  readonly normalization?: string;
  readonly emptyNegativeBlocks?: readonly Readonly<{frame: number; samples: number; seek: number; mp3Bytes: number}>[];
}
export interface P037AudioPlan {
  readonly version: 1; readonly animationId: 'shared-nms002-l01-p037'; readonly sourceSwfSha256: string;
  readonly fps: 12; readonly mainFrameDomain: 'sprite-636'; readonly mainFrameCount: 601;
  readonly instructionFrame: 595; readonly questionFrame: 596; readonly outroFirstFrame: 597; readonly mainAudioFirstFrame: 2;
  readonly endChildFrameDomain: 'sprite-635'; readonly endChildFirstMainFrame: 598; readonly endChildFrameCount: 111;
  readonly clips: readonly P037AudioClip[]; readonly sourceAlignment: string;
  readonly wrong: Readonly<Record<string, unknown>>; readonly counter: Readonly<Record<string, unknown>>;
}
export interface P037Picture {
  readonly mainFrame: number;
  readonly interaction: Readonly<{
    roundIndex: number; solvedCount: number; correctPicture: number; hoverIndex: number | null;
    inputEnabled: boolean; startEnabled: boolean; skipEnabled: boolean; nextEnabled: boolean;
    wrongVisible: boolean; wrongFrame: number; arrowFrame: number; counterFrame: number; endChildFrame: number;
  }>;
}
type Operation = 'intro' | 'game' | 'wrong' | 'correct' | 'final' | 'outro';
type Phase = 'idle' | 'loading' | 'ready' | 'starting' | 'playing' | 'paused' | 'instructions' | 'question' | 'next-wait' | 'wrong-wait' | 'ended' | 'failed' | 'closed';
type Policy = {activation: 'automatic' | 'user'; reducedMotion: boolean};
type Window = {domain: string; start: number; end: number; sample: number};
const result = (accepted: boolean, reason: string): DecodedStreamResult => Object.freeze({accepted, reason});
const hashPattern = /^[a-f0-9]{64}$/u;
const framesPerSecond = 12, sampleRate = 22050, mainDomain = 'sprite-636';
const isIndex = (n: number) => Number.isSafeInteger(n) && n >= 1 && n <= 101;
export const P037_ANSWERS = Object.freeze([8, -2, 28, 25, 40, 47, 45, 54, 43, 64, 71, 78, 74, 80]);
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

/** The14authored plays count after each dummy2..20; child635 continues past parent601 through its own111stop. */
export class P037SourceClockV1 {
  readonly plan: P037AudioPlan;
  private readonly clips = new Map<string, P037AudioClip>();
  private readonly buffers = new Map<string, AudioBuffer>();
  private readonly nodes = new Set<AudioBufferSourceNode>();
  private context?: AudioContext; private gain?: GainNode;
  private phase: Phase = 'idle'; private operation: Operation = 'intro';
  private position = 0; private outroFirst = 597;
  private roundIndex = 0; private solvedCount = 0; private correctPicture = 0;
  private hoverIndex: number | null = null;
  private attempts = 0; private anchor?: {time: number; position: number}; private epoch = 0;
  private globalPaused = true; private volume = 1; private inspection = false; private failure: string | null = null;

  constructor(plan: P037AudioPlan, private readonly options: {
    createContext?: () => AudioContext; commitPicture: (picture: P037Picture) => boolean;
  }) {
    if (plan.version !== 1 || plan.animationId !== 'shared-nms002-l01-p037' ||
      plan.sourceSwfSha256 !== '6090cf99eed95c383c7f04d55f9e4dc697b02202aab168d1698cbef26752e2ce' ||
      plan.fps !== 12 || plan.mainFrameDomain !== mainDomain || plan.mainFrameCount !== 601 ||
      plan.instructionFrame !== 595 || plan.questionFrame !== 596 || plan.outroFirstFrame !== 597 || plan.mainAudioFirstFrame !== 2 ||
      plan.endChildFrameDomain !== 'sprite-635' || plan.endChildFirstMainFrame !== 598 || plan.endChildFrameCount !== 111 ||
      plan.clips.length !== 3 || typeof options.commitPicture !== 'function') throw Error('P037_SOURCE_PLAN_MISMATCH');
    if (plan.wrong.sourceCharacterId !== 569 || plan.wrong.frameCount !== 15 || plan.wrong.entryFrame !== 2 || plan.wrong.terminalResetFrame !== 1 ||
      plan.counter.sourceCharacterId !== 524 || plan.counter.frameCount !== 20 || plan.counter.entryFrame !== 2) throw Error('P037_SOURCE_FEEDBACK_MISMATCH');
    const expected: Record<string, readonly number[]> = {
      'sprite-636': [601, 2, 1673, 1100160], 'sprite-569': [15, 1, 1673, 27072], 'sprite-635': [111, 6, 1673, 194112],
    };
    for (const clip of plan.clips) {
      const e = expected[clip.frameDomain], d = clip.decoder;
      if (!e || this.clips.has(clip.frameDomain) || clip.frameCount !== e[0] ||
        clip.rawAudioFirstFrame !== e[1] || clip.latencySamples !== e[2] || d.decodedSamples !== e[3] ||
        d.sampleRate !== sampleRate || d.channels !== 1 || !Number.isSafeInteger(d.sourceBytes) ||
        d.sourceBytes < 1 || !hashPattern.test(d.sourceSha256) || !hashPattern.test(d.pcmSha256)) throw Error('P037_SOURCE_CLIP_MISMATCH');
      this.clips.set(clip.frameDomain, Object.freeze({...clip, decoder: Object.freeze({...d})}));
    }
    this.plan = Object.freeze({...plan, clips: Object.freeze([...this.clips.values()])});
  }
  private duration() {
    if (this.operation === 'intro') return 594 / framesPerSecond;
    if (this.operation === 'wrong') return 13 / framesPerSecond;
    if (this.operation === 'correct') return 18 / framesPerSecond;
    if (this.operation === 'final') return 129 / framesPerSecond;
    if (this.operation === 'outro') return (708 - this.outroFirst) / framesPerSecond;
    return 0;
  }
  private clipWindow(domain: string, firstFrame: number, start: number, end: number): Window {
    const c = this.clips.get(domain)!, lead = Math.max(0, c.rawAudioFirstFrame - firstFrame) / framesPerSecond;
    const sample = c.latencySamples + Math.max(0, firstFrame - c.rawAudioFirstFrame) * sampleRate / framesPerSecond;
    return {domain, start: start + lead, end: Math.min(end, start + lead + Math.max(0, c.decoder.decodedSamples - sample) / sampleRate), sample};
  }
  private windows(): Window[] {
    if (this.operation === 'intro') return [this.clipWindow(mainDomain, 1, 0, this.duration())];
    if (this.operation === 'wrong') return [this.clipWindow('sprite-569', 2, 0, this.duration())];
    if (this.operation === 'final') return [this.clipWindow(mainDomain, 597, 18 / 12, 22 / 12),
      this.clipWindow('sprite-635', 1, 19 / 12, this.duration())];
    if (this.operation === 'outro') return [this.clipWindow(mainDomain, this.outroFirst, 0, (601 - this.outroFirst) / 12),
      this.clipWindow('sprite-635', Math.max(1, this.outroFirst - 597), Math.max(0, 598 - this.outroFirst) / 12, this.duration())];
    return [];
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
    if ((this.operation === 'correct' || this.operation === 'final') && this.position >= 18 / 12 - 1e-9) this.solvedCount = this.roundIndex + 1;
    if (this.position < this.duration() - 1e-9) return;
    this.retire();
    if (this.operation === 'intro') this.phase = 'instructions';
    else if (this.operation === 'correct') { this.phase = 'next-wait'; this.operation = 'game'; this.position = 0; }
    else if (this.operation === 'wrong') this.phase = 'wrong-wait';
    else { this.phase = 'ended'; this.globalPaused = true; }
  }
  private picture(): P037Picture {
    const active = ['starting', 'playing', 'paused'].includes(this.phase);
    let mainFrame = ['idle', 'loading', 'ready'].includes(this.phase) ? 1 : 596;
    let wrongFrame = 1, arrowFrame = 1, counterFrame = 1, endChildFrame = 1;
    if (this.operation === 'intro') mainFrame = Math.min(595, 1 + Math.floor(this.position * 12 + 1e-8));
    if (this.operation === 'wrong' && active) wrongFrame = Math.min(14, 2 + Math.floor(this.position * 12 + 1e-8));
    if ((this.operation === 'correct' || this.operation === 'final') && active) {
      if (this.position < 4 / 12 - 1e-9) arrowFrame = Math.min(5, 2 + Math.floor(this.position * 12 + 1e-8));
      if (this.position < 18 / 12 - 1e-9) counterFrame = Math.min(19, 2 + Math.floor(this.position * 12 + 1e-8));
      else if (this.operation === 'final') {
        mainFrame = Math.min(601, 597 + Math.floor((this.position - 18 / 12) * 12 + 1e-8));
        if (this.position >= 19 / 12 - 1e-9) endChildFrame = Math.min(111, 1 + Math.floor((this.position - 19 / 12) * 12 + 1e-8));
      }
    }
    if (this.operation === 'outro' && active) {
      mainFrame = Math.min(601, this.outroFirst + Math.floor(this.position * 12 + 1e-8));
      endChildFrame = Math.max(1, Math.min(111, this.outroFirst - 597 + Math.floor(this.position * 12 + 1e-8)));
    }
    if (this.phase === 'ended') { mainFrame = 601; endChildFrame = 111; }
    const enabled = !this.globalPaused && !this.inspection;
    return Object.freeze({mainFrame, interaction: Object.freeze({
      roundIndex: this.roundIndex, solvedCount: this.solvedCount, correctPicture: this.correctPicture, hoverIndex: this.hoverIndex,
      inputEnabled: this.phase === 'question' && enabled,
      startEnabled: this.phase === 'instructions' && !this.inspection,
      skipEnabled: this.operation === 'intro' && mainFrame >= 82 && mainFrame < 595 && active,
      nextEnabled: this.phase === 'next-wait' && enabled && this.solvedCount === this.roundIndex + 1 && this.solvedCount < 14,
      wrongVisible: this.operation === 'wrong' && (active || this.phase === 'wrong-wait'),
      wrongFrame, arrowFrame, counterFrame, endChildFrame,
    })});
  }
  private commit() { try { return this.options.commitPicture(this.picture()) === true; } catch { return false; } }
  snapshot() {
    this.settle();
    const picture = this.picture(), active = this.phase === 'playing' && this.context?.state === 'running'
      ? this.windows().find(w => this.position >= w.start - 1e-9 && this.position < w.end - 1e-9) : undefined;
    return Object.freeze({phase: this.phase, operation: this.operation, operationSeconds: this.position, picture,
      attempts: this.attempts, solvedCount: this.solvedCount, allCorrect: this.solvedCount === 14,
      globalPaused: this.globalPaused, inspectionMode: this.inspection,
      sourceQuizActive: [595, 596].includes(picture.mainFrame), audioNodePlaying: Boolean(active), audioDomain: active?.domain ?? null,
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
      if (payloads.size !== 3 || [...payloads.keys()].some(k => !this.clips.has(k))) throw Error('P037_EXACT_ACTIVE_PAYLOADS_REQUIRED');
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
      return result(true, 'P037_SOURCE_READY');
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
    if (['instructions', 'question', 'next-wait', 'wrong-wait'].includes(this.phase)) { this.globalPaused = false; return result(true, 'source-waiting-for-input'); }
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
    this.settle(); this.epoch++; this.retire(); this.globalPaused = true; this.hoverIndex = null;
    if (['playing', 'starting'].includes(this.phase)) this.phase = 'paused';
    return this.commit() ? result(true, 'source-held') : this.fail('paused-picture-not-committed');
  }
  skipIntro() {
    this.settle();
    if (!this.picture().interaction.skipEnabled) return result(false, 'source-skip-unavailable');
    this.epoch++; this.retire(); this.operation = 'intro'; this.position = 594 / 12; this.phase = 'instructions'; this.globalPaused = false;
    return this.commit() ? result(true, 'source-instructions-shown') : this.fail('instructions-picture-not-committed');
  }
  startGame() {
    this.settle();
    if (!this.picture().interaction.startEnabled) return result(false, 'source-start-unavailable');
    this.epoch++; this.retire(); this.operation = 'game'; this.position = 0; this.phase = 'question'; this.globalPaused = false;
    return this.commit() ? result(true, 'source-first-play-shown') : this.fail('first-play-picture-not-committed');
  }
  hover(index: number | null) {
    this.settle();
    if ((index !== null && !isIndex(index)) || !this.picture().interaction.inputEnabled) return result(false, 'source-hover-unavailable');
    this.hoverIndex = index;
    return this.commit() ? result(true, 'source-hover-updated') : this.fail('hover-picture-not-committed');
  }
  async answer(index: number, policy: Policy) {
    this.settle();
    if (!isIndex(index) || !this.picture().interaction.inputEnabled) return result(false, 'source-answer-unavailable');
    if (!['automatic', 'user'].includes(policy.activation) || typeof policy.reducedMotion !== 'boolean') return result(false, 'invalid-play-policy');
    this.epoch++; this.retire(); this.hoverIndex = null; this.attempts++;
    if (index === P037_ANSWERS[this.roundIndex] + 21) {
      this.correctPicture = this.roundIndex + 1;
      this.operation = this.roundIndex === 13 ? 'final' : 'correct';
    } else this.operation = 'wrong';
    this.position = 0; this.phase = 'paused'; return this.play(policy);
  }
  nextPlay() {
    this.settle();
    if (!this.picture().interaction.nextEnabled) return result(false, 'source-next-unavailable');
    this.roundIndex++; this.operation = 'game'; this.position = 0; this.phase = 'question'; this.hoverIndex = null;
    return this.commit() ? result(true, 'source-next-play-shown') : this.fail('next-play-picture-not-committed');
  }
  closeWrong() {
    this.settle();
    if (!this.picture().interaction.wrongVisible) return result(false, 'source-popup-not-open');
    this.epoch++; this.retire(); this.phase = 'question'; this.operation = 'game'; this.position = 0; this.hoverIndex = null;
    return this.commit() ? result(true, 'source-popup-closed') : this.fail('close-picture-not-committed');
  }
  replay() {
    if (['idle', 'loading', 'failed', 'closed'].includes(this.phase)) return result(false, 'replay-unavailable');
    this.epoch++; this.retire(); this.operation = 'intro'; this.position = 0; this.outroFirst = 597;
    this.roundIndex = 0; this.solvedCount = 0; this.correctPicture = 0; this.hoverIndex = null; this.attempts = 0;
    this.phase = 'ready'; this.globalPaused = true; this.inspection = false; this.failure = null;
    return this.commit() ? result(true, 'source-replayed') : this.fail('replay-picture-not-committed');
  }
  inspect(frame: number) {
    if (!Number.isSafeInteger(frame) || frame < 1 || frame > 601 || ['idle', 'loading', 'failed', 'closed'].includes(this.phase)) return result(false, 'invalid-source-inspection');
    this.epoch++; this.retire(); this.roundIndex = 0; this.solvedCount = 0; this.correctPicture = 0; this.hoverIndex = null; this.attempts = 0;
    this.inspection = true; this.globalPaused = true; this.failure = null;
    if (frame <= 595) { this.operation = 'intro'; this.position = (frame - 1) / 12; this.phase = frame === 595 ? 'instructions' : 'paused'; }
    else if (frame === 596) { this.operation = 'game'; this.position = 0; this.phase = 'question'; }
    else { this.operation = 'outro'; this.outroFirst = frame; this.position = 0; this.phase = 'paused'; }
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
