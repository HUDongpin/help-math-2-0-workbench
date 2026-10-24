import type {DecodedSourceStreamBinding, DecodedStreamResult} from './decoded-source-stream-transport';
import {selectHostFeedback} from './g678-advanced-manual/host-feedback-selector';
export interface P035AudioClip {
 readonly frameDomain: string; readonly frameCount: number; readonly rawAudioFirstFrame: number;
 readonly latencySamples: number; readonly decoder: DecodedSourceStreamBinding;
 readonly normalization?: string;
 readonly emptyNegativeBlocks?: readonly Readonly<{frame: number; samples: number; seek: number; mp3Bytes: number}>[];
}
type Bounds = Readonly<{x: number; y: number; width: number; height: number}>;
export type P035ChoiceId = 'AnsBtn1' | 'AnsBtn2' | 'AnsBtn3' | 'AnsBtn4';
export interface P035Branch {
 readonly kind: 'wrong' | 'right'; readonly index: number; readonly sourceCharacterId: number;
 readonly frameDomain: string; readonly frameCount: number; readonly entryFrame: number;
 readonly waitFrame?: number; readonly closeEntryFrame?: number; readonly popupEntryFrame?: number;
 readonly instanceName: string; readonly sourcePlacement: Readonly<Record<string, unknown>>; readonly hostXOverridePixels: number;
 readonly popupLastFrame?: number; readonly popupCharacterId?: number; readonly popupTextCharacterId?: number;
 readonly popupCloseBounds?: Bounds; readonly popupTextBounds?: Bounds;
}
export interface P035AudioPlan {
 readonly version: 1; readonly animationId: 'shared-nms002-l01-p035'; readonly sourceSwfSha256: string;
 readonly fps: 12; readonly mainFrameDomain: 'sprite-246'; readonly mainFrameCount: 623;
 readonly questionFrame: 245; readonly outroFirstFrame: 246; readonly livePlaybackEndFrame: 623; readonly mainAudioFirstFrame: 9;
 readonly clips: readonly P035AudioClip[]; readonly branches: readonly P035Branch[];
 readonly sourceAlignment: string; readonly seedPolicy?: string;
}
export interface P035Picture {
 readonly mainFrame: number;
 readonly interaction: Readonly<{
  wrongAttempts: number; choicesEnabled: boolean; helpEnabled: boolean; helpVisible: boolean;
  feedbackCharacterId: number | null; feedbackFrame: number; popupVisible: boolean;
 }>;
}
type Operation = 'intro' | 'wrong' | 'wrong-close' | 'right' | 'outro';
type Phase = 'idle' | 'loading' | 'ready' | 'starting' | 'playing' | 'paused' | 'question' | 'wrong-wait' | 'ended' | 'failed' | 'closed';
type Policy = {activation: 'automatic' | 'user'; reducedMotion: boolean};
type Window = {domain: string; start: number; end: number; sample: number};
type Outcome = 'unanswered' | 'correct' | 'revealed';
const result = (accepted: boolean, reason: string): DecodedStreamResult => Object.freeze({accepted, reason});
const hashPattern = /^[a-f0-9]{64}$/u;
const framesPerSecond = 12, sampleRate = 22050, mainDomain = 'sprite-246';
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

/** Source-bound four choices, two-attempt reveal and independently scheduled feedback/main audio. */
export class P035SourceClockV1 {
 readonly plan: P035AudioPlan;
 private readonly clips = new Map<string, P035AudioClip>();
 private readonly buffers = new Map<string, AudioBuffer>();
 private readonly nodes = new Set<AudioBufferSourceNode>();
 private context?: AudioContext; private gain?: GainNode;
 private phase: Phase = 'idle'; private operation: Operation = 'intro'; private position = 0; private outroFirst = 246;
 private selected: P035Branch | null = null; private choice: P035ChoiceId | null = null; private wrongAttempts = 0;
 private outcome: Outcome = 'unanswered';
 private helpVisible = false; private helpResume = false; private attempts = 0; private readonly seed: number;
 private anchor?: {time: number; position: number}; private epoch = 0;
 private globalPaused = true; private volume = 1; private inspection = false; private failure: string | null = null;
 constructor(plan: P035AudioPlan, private readonly options: {
  seed?: number; createContext?: () => AudioContext; commitPicture: (picture: P035Picture) => boolean;
 }) {
  if (plan.version !== 1 || plan.animationId !== 'shared-nms002-l01-p035' ||
   plan.sourceSwfSha256 !== 'f782359938a02658c23fdfb1b81fee008046a9a56afc3e7c62879870c7d40192' ||
   plan.fps !== 12 || plan.mainFrameDomain !== mainDomain || plan.mainFrameCount !== 623 ||
   plan.questionFrame !== 245 || plan.outroFirstFrame !== 246 || plan.livePlaybackEndFrame !== 623 ||
   plan.mainAudioFirstFrame !== 9 || plan.clips.length !== 8 || plan.branches.length !== 7 ||
   typeof options.commitPicture !== 'function') throw Error('P035_SOURCE_PLAN_MISMATCH');
  if (options.seed !== undefined && (!Number.isSafeInteger(options.seed) || options.seed < 0 || options.seed > 0xffffffff)) throw Error('P035_INVALID_SEED');
  this.seed = options.seed ?? 0;
  const expected: Record<string, readonly number[]> = {"sprite-246": [623, 9, 1673, 1129536], "sprite-235": [28, 2, 1673, 48960], "sprite-185": [29, 2, 1673, 51264], "sprite-199": [28, 2, 1673, 45504], "sprite-91": [25, 2, 1673, 43776], "sprite-112": [33, 3, 1673, 56448], "sprite-169": [31, 2, 1673, 52992], "sprite-129": [28, 2, 1673, 48960]};
  for (const clip of plan.clips) {
   const e = expected[clip.frameDomain], d = clip.decoder;
   if (!e || this.clips.has(clip.frameDomain) || clip.frameCount !== e[0] || clip.rawAudioFirstFrame !== e[1] ||
    clip.latencySamples !== e[2] || d.decodedSamples !== e[3] || d.sampleRate !== sampleRate || d.channels !== 1 ||
    !Number.isSafeInteger(d.sourceBytes) || d.sourceBytes < 1 || !hashPattern.test(d.sourceSha256) || !hashPattern.test(d.pcmSha256)) throw Error('P035_SOURCE_CLIP_MISMATCH');
   this.clips.set(clip.frameDomain, Object.freeze({...clip, decoder: Object.freeze({...d})}));
  }
  const rows = [["wrong", 1, 235, 28, 23, 24, 17], ["wrong", 2, 185, 29, 23, 24, 16], ["wrong", 3, 199, 28, 20, 21, 13], ["right", 1, 91, 25], ["right", 2, 112, 33], ["right", 3, 169, 31], ["right", 4, 129, 28]];
  plan.branches.forEach((b,i) => { const r = rows[i]; if (b.kind !== r[0] || b.index !== r[1] || b.sourceCharacterId !== r[2] || b.frameCount !== r[3] ||
   b.frameDomain !== `sprite-${b.sourceCharacterId}` || b.entryFrame !== 2 || b.waitFrame !== r[4] || b.closeEntryFrame !== r[5] || b.popupEntryFrame !== r[6]) throw Error('P035_SOURCE_BRANCH_MISMATCH'); });
  this.plan = Object.freeze({...plan, clips: Object.freeze([...this.clips.values()]), branches: Object.freeze(plan.branches.map(b=>Object.freeze({...b})))});
 }
 private feedbackSeconds() { return this.operation === 'wrong-close' ? (this.selected!.frameCount - this.selected!.closeEntryFrame!) / 12 : (this.selected!.frameCount - 2) / 12; }
 private revealAfterClose() { return this.operation === 'wrong-close' && this.wrongAttempts >= 2; }
 private revealSeconds() { return 377 / 12; }
 private duration() {
  if (this.operation === 'intro') return 244 / 12;
  if (this.operation === 'wrong') return (this.selected!.waitFrame! - 2) / 12;
  if (this.operation === 'right') return this.feedbackSeconds() + this.revealSeconds();
  if (this.operation === 'wrong-close') return this.feedbackSeconds() + (this.revealAfterClose() ? this.revealSeconds() : 0);
  return (623 - this.outroFirst) / 12;
 }
 private clipWindow(domain: string, firstFrame: number, start: number, end: number): Window {
  const c = this.clips.get(domain)!, lead = Math.max(0, c.rawAudioFirstFrame - firstFrame) / 12;
  const sample = c.latencySamples + Math.max(0, firstFrame - c.rawAudioFirstFrame) * sampleRate / 12;
  return {domain, start: start + lead, end: Math.min(end, start + lead + Math.max(0, c.decoder.decodedSamples - sample) / sampleRate), sample};
 }
 private windows(): Window[] {
  if (this.operation === 'intro') return [this.clipWindow(mainDomain, 1, 0, this.duration())];
  if (this.operation === 'outro') return [this.clipWindow(mainDomain, this.outroFirst, 0, this.duration())];
  if (this.operation === 'wrong') return [this.clipWindow(this.selected!.frameDomain, 2, 0, this.duration())];
  const seconds = this.feedbackSeconds(), ws = [this.clipWindow(this.selected!.frameDomain, this.operation === 'right' ? 2 : this.selected!.closeEntryFrame!, 0, seconds)];
  if (this.operation === 'right' || this.revealAfterClose()) {
   ws.push(this.clipWindow(mainDomain, 246, seconds, this.duration()));
  }
  return ws;
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
  if (this.operation === 'intro') this.waitForQuestion();
  else if (this.operation === 'wrong') this.phase = 'wrong-wait';
  else if (this.operation === 'wrong-close' && !this.revealAfterClose()) { this.selected = null; this.waitForQuestion(); }
  else {
   if (this.operation === 'wrong-close') this.outcome = 'revealed';
   this.phase = 'ended'; this.globalPaused = true;
  }
 }
 private waitForQuestion() { this.phase = 'question'; this.operation = 'intro'; this.position = 244/12; }
 private picture(): P035Picture {
  const active = ['starting','playing','paused'].includes(this.phase);
  let mainFrame = ['idle','loading','ready'].includes(this.phase) ? 1 : 245;
  let feedbackCharacterId: number | null = null, feedbackFrame = 1;
  if (this.operation === 'intro' && (active || this.phase === 'ready')) mainFrame = Math.min(245, 1 + Math.floor(this.position*12 + 1e-8));
  if (this.selected && (active || this.phase === 'wrong-wait')) {
   if (this.operation === 'wrong') {
    feedbackCharacterId = this.selected.sourceCharacterId;
    feedbackFrame = Math.min(this.selected.waitFrame!, 2 + Math.floor(this.position*12 + 1e-8));
   } else if (this.operation === 'right' || this.operation === 'wrong-close') {
    const seconds = this.feedbackSeconds();
    if (this.position < seconds - 1e-9) {
     feedbackCharacterId = this.selected.sourceCharacterId;
     feedbackFrame = (this.operation === 'right' ? 2 : this.selected.closeEntryFrame!) + Math.floor(this.position*12 + 1e-8);
    } else if (this.operation === 'right' || this.revealAfterClose()) mainFrame = Math.min(623, 246 + Math.floor((this.position-seconds)*12 + 1e-8));
   }
  }
  if (this.operation === 'outro' && active) mainFrame = Math.min(623, this.outroFirst + Math.floor(this.position*12 + 1e-8));
  if (this.phase === 'ended') mainFrame = 623;
  const choicesEnabled = this.phase === 'question' && this.outcome === 'unanswered' && !this.helpVisible;
  return Object.freeze({mainFrame, interaction: Object.freeze({wrongAttempts: this.wrongAttempts,
   choicesEnabled, helpEnabled: choicesEnabled, helpVisible: this.helpVisible, feedbackCharacterId, feedbackFrame,
   popupVisible: this.selected?.kind === 'wrong' && this.operation === 'wrong' && feedbackCharacterId !== null && feedbackFrame >= this.selected.popupEntryFrame! && feedbackFrame <= this.selected.waitFrame!,
  })});
 }
 private commit() { try { return this.options.commitPicture(this.picture()) === true; } catch { return false; } }
 snapshot() {
  this.settle(); const picture = this.picture();
  const active = this.phase === 'playing' && this.context?.state === 'running' ? this.windows().find(w => this.position >= w.start - 1e-9 && this.position < w.end - 1e-9) : undefined;
  return Object.freeze({phase: this.phase, operation: this.operation, operationSeconds: this.position, picture, seed: this.seed,
   attempts: this.attempts, wrongAttempts: this.wrongAttempts, choice: this.choice, outcome: this.outcome,
   selectedBranch: this.selected, correctAnswer: this.outcome === 'correct', revealedAfterSecondWrong: this.outcome === 'revealed',
   globalPaused: this.globalPaused, inspectionMode: this.inspection,
   sourceQuizActive: this.phase === 'question', audioNodePlaying: Boolean(active), audioDomain: active?.domain ?? null,
   audioSample: active ? active.sample + Math.max(0, this.position-active.start)*sampleRate : 0,
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
      if (payloads.size !== 8 || [...payloads.keys()].some(k => !this.clips.has(k))) throw Error('P035_EXACT_ACTIVE_PAYLOADS_REQUIRED');
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
      return result(true, 'P035_SOURCE_READY');
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
    this.settle(); this.epoch++; this.retire(); this.globalPaused = true;
    if (['playing', 'starting'].includes(this.phase)) this.phase = 'paused';
    return this.commit() ? result(true, 'source-held') : this.fail('paused-picture-not-committed');
  }
 async choose(choice: string, policy: Policy) {
  this.settle();
  if (!this.picture().interaction.choicesEnabled || !['AnsBtn1','AnsBtn2','AnsBtn3','AnsBtn4'].includes(choice)) return result(false, 'source-choice-unavailable');
  const kind = choice === 'AnsBtn3' ? 'right' : 'wrong';
  const selected = selectHostFeedback(kind, (this.seed + this.attempts) >>> 0);
  this.selected = this.plan.branches.find(b=>b.kind===kind && b.index===selected.branchIndex)!;
  this.choice = choice as P035ChoiceId; this.attempts++;
  if (kind === 'wrong') this.wrongAttempts++; else this.outcome = 'correct';
  this.operation = kind; this.position = 0; this.phase = 'paused'; return this.play(policy);
 }
 async closeWrong(policy: Policy) {
  this.settle(); if (!this.picture().interaction.popupVisible || this.helpVisible) return result(false, 'source-popup-not-open');
  this.epoch++; this.retire(); this.operation = 'wrong-close'; this.position = 0; this.phase = 'paused'; return this.play(policy);
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
  if (['idle','loading','failed','closed'].includes(this.phase)) return result(false, 'replay-unavailable');
  this.epoch++; this.retire(); this.operation = 'intro'; this.position = 0; this.outroFirst = 246;
  this.choice = null; this.wrongAttempts = 0; this.attempts = 0; this.selected = null; this.outcome = 'unanswered';
  this.helpVisible = false; this.helpResume = false; this.phase = 'ready'; this.globalPaused = true; this.inspection = false; this.failure = null;
  return this.commit() ? result(true, 'source-replayed') : this.fail('replay-picture-not-committed');
 }
 inspect(frame: number) {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > 623 || ['idle','loading','failed','closed'].includes(this.phase)) return result(false, 'invalid-source-inspection');
  this.epoch++; this.retire(); this.selected = null; this.choice = null; this.wrongAttempts = 0; this.attempts = 0; this.outcome = 'unanswered';
  this.helpVisible = false; this.helpResume = false; this.inspection = true; this.globalPaused = true; this.failure = null; this.outroFirst = 246;
  if (frame < 245) { this.operation = 'intro'; this.position = (frame-1)/12; this.phase = 'paused'; }
  else if (frame === 245) this.waitForQuestion();
  else { this.operation = 'outro'; this.outroFirst = frame; this.position = 0; this.phase = frame === 623 ? 'ended' : 'paused'; }
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
