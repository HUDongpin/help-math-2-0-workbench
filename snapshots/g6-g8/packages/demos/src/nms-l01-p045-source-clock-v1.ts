import type {DecodedSourceStreamBinding, DecodedStreamResult} from './decoded-source-stream-transport';
import {selectHostFeedback} from './g678-advanced-manual/host-feedback-selector';
type Bounds = Readonly<{x: number; y: number; width: number; height: number}>;
export interface P045AudioClip {
 readonly frameDomain: string; readonly frameCount: number; readonly rawAudioFirstFrame: number;
 readonly latencySamples: number; readonly decoder: DecodedSourceStreamBinding;
 readonly normalization?: string;
 readonly emptyNegativeBlocks?: readonly Readonly<{frame: number; samples: number; seek: number; mp3Bytes: number}>[];
}
export type P045ChoiceId = 'AnsBtn1' | 'AnsBtn2' | 'AnsBtn3' | 'AnsBtn4';
export interface P045Branch {
 readonly kind: 'wrong' | 'right'; readonly index: number; readonly sourceCharacterId: number;
 readonly frameDomain: string; readonly frameCount: number; readonly entryFrame: number;
 readonly instanceName: string; readonly sourcePlacement: Readonly<Record<string, unknown>>; readonly hostXOverridePixels: number;
}
export interface P045Strategy {
 readonly index: number; readonly sourceCharacterId: number; readonly frameDomain: string;
 readonly mainFrame: number; readonly entryFrame: number; readonly waitFrame: number; readonly frameCount: number;
 readonly closeCharacterId: number; readonly closeBounds: Bounds;
}
export interface P045AudioPlan {
 readonly version: 1; readonly animationId: 'shared-nms002-l01-p045'; readonly sourceSwfSha256: string;
 readonly fps: 12; readonly mainFrameDomain: 'sprite-290'; readonly mainFrameCount: 835; readonly livePlaybackEndFrame: 832;
 readonly mainStops: readonly number[]; readonly questionFrame: 813; readonly outroFirstFrame: 814; readonly mainAudioFirstFrame: 9;
 readonly clips: readonly P045AudioClip[]; readonly branches: readonly P045Branch[]; readonly strategies: readonly P045Strategy[];
 readonly sourceAlignment: string; readonly seedPolicy?: string;
}
export interface P045Picture {
 readonly mainFrame: number;
 readonly interaction: Readonly<{
  holdIndex: number | null; continueEnabled: boolean; strategyEnabled: boolean;
  strategyCharacterId: number | null; strategyFrame: number;
  wrongAttempts: number; choicesEnabled: boolean; helpEnabled: boolean; helpVisible: boolean;
  feedbackCharacterId: number | null; feedbackFrame: number;
 }>;
}
type Operation = 'main' | 'strategy' | 'feedback';
type Phase = 'idle' | 'loading' | 'ready' | 'starting' | 'playing' | 'paused' | 'teaching-hold' | 'strategy-wait' | 'question' | 'ended' | 'failed' | 'closed';
type Policy = {activation: 'automatic' | 'user'; reducedMotion: boolean};
type Window = {domain: string; start: number; end: number; sample: number};
type Outcome = 'unanswered' | 'correct' | 'revealed';
const result = (accepted: boolean, reason: string): DecodedStreamResult => Object.freeze({accepted, reason});
const hashPattern = /^[a-f0-9]{64}$/u;
const framesPerSecond = 12, sampleRate = 22050, mainDomain = 'sprite-290';
const teachingStops = [388, 525, 651, 773] as const;
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

/** Four source teaching holds, two child strategies, seven feedback branches and finite native audio. */
export class P045SourceClockV1 {
 readonly plan: P045AudioPlan;
 private readonly clips = new Map<string, P045AudioClip>();
 private readonly buffers = new Map<string, AudioBuffer>();
 private readonly nodes = new Set<AudioBufferSourceNode>();
 private context?: AudioContext; private gain?: GainNode;
 private phase: Phase = 'idle'; private operation: Operation = 'main'; private position = 0;
 private mainFirst = 1; private mainLast = 388; private heldFrame = 388;
 private selected: P045Branch | null = null; private strategy: P045Strategy | null = null;
 private choice: P045ChoiceId | null = null; private wrongAttempts = 0; private outcome: Outcome = 'unanswered';
 private helpVisible = false; private attempts = 0; private readonly seed: number;
 private readonly visitedHolds = new Set<number>(); private readonly viewedStrategies = new Set<number>();
 private anchor?: {time: number; position: number}; private epoch = 0;
 private globalPaused = true; private volume = 1; private inspection = false; private failure: string | null = null;
 constructor(plan: P045AudioPlan, private readonly options: {
  seed?: number; createContext?: () => AudioContext; commitPicture: (picture: P045Picture) => boolean;
 }) {
  if (plan.version !== 1 || plan.animationId !== 'shared-nms002-l01-p045' ||
   plan.sourceSwfSha256 !== 'dce152af93c1bb221d02f1c09fd7265a3ebde88f47d0e39381d6f978bc3e1651' ||
   plan.fps !== 12 || plan.mainFrameDomain !== mainDomain || plan.mainFrameCount !== 835 || plan.livePlaybackEndFrame !== 832 ||
   plan.questionFrame !== 813 || plan.outroFirstFrame !== 814 || plan.mainAudioFirstFrame !== 9 ||
   plan.clips.length !== 8 || plan.branches.length !== 7 || plan.strategies.length !== 2 ||
   JSON.stringify(plan.mainStops) !== '[388,525,651,773,813,832]' || typeof options.commitPicture !== 'function') throw Error('P045_SOURCE_PLAN_MISMATCH');
  if (options.seed !== undefined && (!Number.isSafeInteger(options.seed) || options.seed < 0 || options.seed > 0xffffffff)) throw Error('P045_INVALID_SEED');
  this.seed = options.seed ?? 0;
  const expected: Record<string, readonly number[]> = {"sprite-290": [835, 9, 1673, 1505664], "sprite-185": [31, 3, 1673, 52992], "sprite-171": [28, 2, 1673, 48960], "sprite-196": [29, 2, 1673, 51264], "sprite-270": [33, 3, 1673, 56448], "sprite-249": [32, 3, 1673, 54720], "sprite-235": [31, 2, 1673, 52992], "sprite-209": [28, 1, 1673, 51264]};
  for (const clip of plan.clips) {
   const e = expected[clip.frameDomain], d = clip.decoder;
   if (!e || this.clips.has(clip.frameDomain) || clip.frameCount !== e[0] || clip.rawAudioFirstFrame !== e[1] ||
    clip.latencySamples !== e[2] || d.decodedSamples !== e[3] || d.sampleRate !== sampleRate || d.channels !== 1 ||
    !Number.isSafeInteger(d.sourceBytes) || d.sourceBytes < 1 || !hashPattern.test(d.sourceSha256) || !hashPattern.test(d.pcmSha256)) throw Error('P045_SOURCE_CLIP_MISMATCH');
   this.clips.set(clip.frameDomain, Object.freeze({...clip, decoder: Object.freeze({...d})}));
  }
  const rows = [["wrong", 1, 185, 31], ["wrong", 2, 171, 28], ["wrong", 3, 196, 29], ["right", 1, 270, 33], ["right", 2, 249, 32], ["right", 3, 235, 31], ["right", 4, 209, 28]];
  plan.branches.forEach((b,i) => { const r = rows[i]; if (b.kind !== r[0] || b.index !== r[1] || b.sourceCharacterId !== r[2] || b.frameCount !== r[3] || b.frameDomain !== `sprite-${b.sourceCharacterId}` || b.entryFrame !== 2 || b.hostXOverridePixels !== 5) throw Error('P045_SOURCE_BRANCH_MISMATCH'); });
  const strategyRows = [[2,110,651,15,20,109],[3,146,773,55,61,137]];
  plan.strategies.forEach((s,i) => { const r = strategyRows[i]; if (s.index !== r[0] || s.sourceCharacterId !== r[1] || s.mainFrame !== r[2] || s.waitFrame !== r[3] || s.frameCount !== r[4] || s.closeCharacterId !== r[5] || s.entryFrame !== 1 || s.frameDomain !== `sprite-${s.sourceCharacterId}`) throw Error('P045_SOURCE_STRATEGY_MISMATCH'); });
  this.plan = Object.freeze({...plan, mainStops: Object.freeze([...plan.mainStops]), clips: Object.freeze([...this.clips.values()]), branches: Object.freeze(plan.branches.map(b=>Object.freeze({...b}))), strategies: Object.freeze(plan.strategies.map(s=>Object.freeze({...s})))});
 }
 private feedbackSeconds() { return (this.selected!.frameCount - 2) / 12; }
 private endsAfterFeedback() { return this.selected?.kind === 'right' || this.wrongAttempts === 1; }
 private duration() {
  if (this.operation === 'strategy') return (this.strategy!.waitFrame - 1) / 12;
  if (this.operation === 'feedback') return this.feedbackSeconds() + (this.endsAfterFeedback() ? 18 / 12 : 0);
  return (this.mainLast - this.mainFirst) / 12;
 }
 private clipWindow(domain: string, firstFrame: number, start: number, end: number): Window {
  const c = this.clips.get(domain)!, lead = Math.max(0, c.rawAudioFirstFrame - firstFrame) / 12;
  const sample = c.latencySamples + Math.max(0, firstFrame - c.rawAudioFirstFrame) * sampleRate / 12;
  return {domain, start: start + lead, end: Math.min(end, start + lead + Math.max(0, c.decoder.decodedSamples - sample) / sampleRate), sample};
 }
 private windows(): Window[] {
  if (this.operation === 'strategy') return [];
  if (this.operation === 'main') return [this.clipWindow(mainDomain, this.mainFirst, 0, this.duration())];
  const seconds = this.feedbackSeconds(), ws = [this.clipWindow(this.selected!.frameDomain, 2, 0, seconds)];
  if (this.endsAfterFeedback()) ws.push(this.clipWindow(mainDomain, 814, seconds, this.duration()));
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
  if (this.operation === 'strategy') { this.phase = 'strategy-wait'; this.viewedStrategies.add(this.strategy!.sourceCharacterId); return; }
  if (this.operation === 'feedback') {
   const finish = this.endsAfterFeedback();
   if (this.selected!.kind === 'wrong') this.wrongAttempts++;
   if (finish) {
    if (this.selected!.kind === 'wrong') this.outcome = 'revealed';
    this.phase = 'ended'; this.globalPaused = true;
   } else { this.selected = null; this.setMain(813, 813); this.phase = 'question'; }
   return;
  }
  this.heldFrame = this.mainLast;
  if (teachingStops.some(n => n === this.mainLast)) { this.phase = 'teaching-hold'; this.visitedHolds.add(this.mainLast); }
  else if (this.mainLast === 813) this.phase = 'question';
  else { this.phase = 'ended'; this.globalPaused = true; }
 }
 private setMain(first: number, last: number) { this.operation = 'main'; this.mainFirst = first; this.mainLast = last; this.heldFrame = last; this.position = 0; this.strategy = null; }
 private picture(): P045Picture {
  const active = ['starting','playing','paused','ready'].includes(this.phase);
  let mainFrame = this.heldFrame, strategyCharacterId: number | null = null, strategyFrame = 1, feedbackCharacterId: number | null = null, feedbackFrame = 1;
  if (this.operation === 'main') mainFrame = Math.min(this.mainLast, this.mainFirst + Math.floor(this.position * 12 + 1e-8));
  if (this.operation === 'strategy' && this.strategy && (active || this.phase === 'strategy-wait')) {
   strategyCharacterId = this.strategy.sourceCharacterId;
   strategyFrame = Math.min(this.strategy.waitFrame, 1 + Math.floor(this.position * 12 + 1e-8));
  }
  if (this.operation === 'feedback' && this.selected && active) {
   if (this.position < this.feedbackSeconds() - 1e-9) { feedbackCharacterId = this.selected.sourceCharacterId; feedbackFrame = 2 + Math.floor(this.position * 12 + 1e-8); }
   else if (this.endsAfterFeedback()) mainFrame = Math.min(832, 814 + Math.floor((this.position - this.feedbackSeconds()) * 12 + 1e-8));
  }
  if (this.phase === 'ended') mainFrame = 832;
  const idx = teachingStops.findIndex(n=>n===mainFrame), holdIndex = idx >= 0 ? idx : null;
  const continueEnabled = this.phase === 'teaching-hold' && !this.inspection;
  const choicesEnabled = this.phase === 'question' && !this.helpVisible && !this.inspection && this.outcome === 'unanswered';
  return Object.freeze({mainFrame, interaction: Object.freeze({holdIndex, continueEnabled, strategyEnabled: continueEnabled && idx >= 2,
   strategyCharacterId, strategyFrame, wrongAttempts: this.wrongAttempts, choicesEnabled, helpEnabled: choicesEnabled,
   helpVisible: this.helpVisible, feedbackCharacterId, feedbackFrame})});
 }
 private commit() { try { return this.options.commitPicture(this.picture()) === true; } catch { return false; } }
 snapshot() {
  this.settle(); const picture = this.picture();
  const active = this.phase === 'playing' && this.context?.state === 'running' ? this.windows().find(w => this.position >= w.start - 1e-9 && this.position < w.end - 1e-9) : undefined;
  return Object.freeze({phase: this.phase, operation: this.operation, operationSeconds: this.position, picture, seed: this.seed,
   attempts: this.attempts, wrongAttempts: this.wrongAttempts, choice: this.choice, outcome: this.outcome, selectedBranch: this.selected,
   visitedHolds: Object.freeze([...this.visitedHolds]), viewedStrategies: Object.freeze([...this.viewedStrategies]),
   correctAnswer: this.outcome === 'correct', revealedAfterSecondWrong: this.outcome === 'revealed',
   globalPaused: this.globalPaused, inspectionMode: this.inspection, sourceQuizActive: ['teaching-hold','strategy-wait','question'].includes(this.phase),
   audioNodePlaying: Boolean(active), audioDomain: active?.domain ?? null,
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
      if (payloads.size !== 8 || [...payloads.keys()].some(k => !this.clips.has(k))) throw Error('P045_EXACT_ACTIVE_PAYLOADS_REQUIRED');
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
      return result(true, 'P045_SOURCE_READY');
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
    if (this.inspection) return result(false, 'source-inspection-readonly');
    if (!['automatic', 'user'].includes(policy.activation) || typeof policy.reducedMotion !== 'boolean') return result(false, 'invalid-play-policy');
    if (policy.activation === 'automatic' && policy.reducedMotion) return result(false, 'reduced-motion-hold');
    if (['question', 'teaching-hold', 'strategy-wait'].includes(this.phase)) { this.globalPaused = false; return result(true, 'source-waiting-for-input'); }
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
 async continueTeaching(policy: Policy) {
  this.settle();
  if (!this.picture().interaction.continueEnabled || !this.validPolicy(policy)) return result(false, 'source-continue-unavailable');
  const index = teachingStops.findIndex(n=>n===this.heldFrame), next = index < 3 ? teachingStops[index+1] : 813;
  this.epoch++; this.retire(); this.setMain(this.heldFrame + 1, next); this.phase = 'paused'; return this.play(policy);
 }
 async openStrategy(policy: Policy) {
  this.settle();
  if (!this.picture().interaction.strategyEnabled || !this.validPolicy(policy)) return result(false, 'source-strategy-unavailable');
  this.strategy = this.plan.strategies.find(s=>s.mainFrame===this.heldFrame)!;
  this.epoch++; this.retire(); this.operation = 'strategy'; this.position = 0; this.phase = 'paused'; return this.play(policy);
 }
 async closeStrategy(policy: Policy) {
  this.settle();
  if (this.phase !== 'strategy-wait' || !this.strategy || this.inspection || !this.validPolicy(policy)) return result(false, 'source-strategy-close-unavailable');
  this.epoch++; this.retire(); const first = this.strategy.mainFrame + 1;
  this.setMain(first, first === 652 ? 773 : 813); this.phase = 'paused'; return this.play(policy);
 }
 private validPolicy(policy: Policy) { return ['automatic','user'].includes(policy.activation) && typeof policy.reducedMotion === 'boolean'; }
 async choose(choice: string, policy: Policy) {
  this.settle();
  if (!this.picture().interaction.choicesEnabled || !['AnsBtn1','AnsBtn2','AnsBtn3','AnsBtn4'].includes(choice) || !this.validPolicy(policy)) return result(false, 'source-choice-unavailable');
  const kind = choice === 'AnsBtn3' ? 'right' : 'wrong';
  const selected = selectHostFeedback(kind, (this.seed + this.attempts) >>> 0);
  this.selected = this.plan.branches.find(b=>b.kind===kind && b.index===selected.branchIndex)!;
  this.choice = choice as P045ChoiceId; this.attempts++; if (kind === 'right') this.outcome = 'correct';
  this.operation = 'feedback'; this.position = 0; this.phase = 'paused'; return this.play(policy);
 }
 openHelp() {
  this.settle(); if (!this.picture().interaction.helpEnabled) return result(false, 'source-help-unavailable');
  const r = this.pause(); if (!r.accepted) return r; this.helpVisible = true;
  return this.commit() ? result(true, 'source-help-opened') : this.fail('help-picture-not-committed');
 }
 async closeHelp(policy: Policy) {
  if (!this.helpVisible || !this.validPolicy(policy)) return result(false, 'source-help-not-open');
  this.helpVisible = false; return this.commit() ? result(true, 'source-help-closed') : this.fail('help-close-picture-not-committed');
 }
 replay() {
  if (['idle','loading','failed','closed'].includes(this.phase)) return result(false, 'replay-unavailable');
  this.epoch++; this.retire(); this.setMain(1,388); this.heldFrame = 388;
  this.choice = null; this.wrongAttempts = 0; this.attempts = 0; this.selected = null; this.outcome = 'unanswered';
  this.helpVisible = false; this.visitedHolds.clear(); this.viewedStrategies.clear(); this.phase = 'ready'; this.globalPaused = true; this.inspection = false; this.failure = null;
  return this.commit() ? result(true, 'source-replayed') : this.fail('replay-picture-not-committed');
 }
 inspect(frame: number) {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > 832 || ['idle','loading','failed','closed'].includes(this.phase)) return result(false, 'invalid-source-inspection');
  this.epoch++; this.retire(); this.setMain(frame,frame); this.selected = null; this.choice = null; this.wrongAttempts = 0; this.attempts = 0; this.outcome = 'unanswered';
  this.helpVisible = false; this.visitedHolds.clear(); this.viewedStrategies.clear(); this.inspection = true; this.globalPaused = true; this.failure = null;
  this.phase = 'paused'; return this.commit() ? result(true, 'source-frame-inspected') : this.fail('inspection-picture-not-committed');
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
