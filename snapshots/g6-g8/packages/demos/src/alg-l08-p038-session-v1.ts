import { SourceStreamRunsClockV1, type SourceStreamRunsClockPlan } from './source-stream-runs-clock-v1';
import { DecodedSourceStreamTransport, type DecodedSourceStreamBinding } from './decoded-source-stream-transport';
import { ALG_L08_P038_BEHAVIOR as S, p038InitialState, p038Reduce, p038CanPlay, type P038Event, type P038Point, type P038PointName, type P038Term } from './alg-l08-p038-state-v1';
export type P038Clock = Pick<SourceStreamRunsClockV1, 'snapshot' | 'prepare' | 'play' | 'pause' | 'seekCandidateFrame' | 'setVolume' | 'close'>;
export type P038Spanish = Pick<DecodedSourceStreamTransport, 'snapshot' | 'prepare' | 'play' | 'pause' | 'replay' | 'setVolume' | 'close' | 'subscribe'>;
export interface P038AudioSource {
  readonly main: { readonly decoder: DecodedSourceStreamBinding | null; readonly segments: SourceStreamRunsClockPlan['segments']; readonly emptyNegativeBlocks: SourceStreamRunsClockPlan['emptyNegativeBlocks'] };
  readonly sa: DecodedSourceStreamBinding | null;
}
export interface P038SessionOptions {
  load: (id: 585 | 'sa', signal: AbortSignal) => Promise<ArrayBuffer>; changed: () => void;
  makeClock?: (plan: SourceStreamRunsClockPlan) => P038Clock; makeSpanish?: () => P038Spanish;
}
type Event = P038Event extends infer T ? T extends P038Event ? Omit<T, 'epoch'> : never : never;
interface Run { readonly key: string; readonly frame: number; readonly plan: SourceStreamRunsClockPlan; readonly controller: AbortController; clock?: P038Clock; busy: boolean; promise?: Promise<boolean>; }
/** P038 selects only main585 and optional external SA; every feedback/coach stream remains unselected. */
export class P038Session {
  private state = p038InitialState(); private run?: Run; private retiring = new Set<Promise<void>>();
  private closed = false; private volume = .8; private failure: string | null = null; private mode: 'main' | 'sa' = 'main';
  private busy = false; private token = 0; private spanish?: P038Spanish; private unsubscribe?: () => void; private pending?: AbortController;
  constructor(private readonly source: P038AudioSource, private readonly options: P038SessionOptions) {}
  private emit() { if (!this.closed) this.options.changed(); }
  private reduce(event: Event) { const before = this.state; this.state = p038Reduce(before, { ...event, epoch: before.epoch } as P038Event); return before !== this.state; }
  snapshot() {
    const observation = this.run?.clock?.snapshot(), spanish = this.spanish?.snapshot(), loading = this.busy || Boolean(this.run?.busy);
    return { state: this.state, frame: this.state.mainFrame, mode: this.mode, loading, failure: this.failure,
      phase: this.closed ? 'closed' : this.failure ? 'failed' : loading ? 'loading' : this.mode === 'sa' ? spanish?.phase ?? 'idle' : this.state.phase === 'ended' ? 'ended' : this.state.playing ? 'playing' : 'paused',
      audioDomain: this.mode === 'sa' ? 'sa' : 585, audioPhase: this.mode === 'sa' ? spanish?.phase ?? 'idle' : observation?.audio.phase ?? 'idle',
      decodedSample: this.mode === 'sa' ? spanish?.decodedSample ?? 0 : observation?.audio.decodedSample ?? 0,
      clockKey: this.run?.key ?? null, clockCount: this.run ? 1 : 0, observation: observation ?? null, spanishPhase: spanish?.phase ?? 'idle', lessonCompleted: false,
    };
  }
  private spec() {
    if (this.state.phase === 'ended' || this.state.phase === 'left') return null;
    if (!this.source.main.decoder) throw new Error('P038_NATIVE_DECODE_BINDING_UNAVAILABLE');
    const last = this.state.phase === 'prequiz' || this.state.phase === 'quiz-held' ? 208 : 525;
    const plan: SourceStreamRunsClockPlan = { version: 1, sourceSwfSha256: S.sourceSha256, frameDomain: 'sprite-585', firstFrame: 1, lastFrame: last, fps: 12, decoder: this.source.main.decoder,
      segments: this.source.main.segments.filter(segment => segment.firstFrame <= last), emptyNegativeBlocks: this.source.main.emptyNegativeBlocks.filter(block => block.frame <= last), alignmentStatus: 'source-run-candidate-not-original-runtime-accepted' };
    return { key: `585:${last}`, frame: this.state.mainFrame, plan };
  }
  private closeTransport(transport: P038Clock | P038Spanish) { const promise = transport.close(); this.retiring.add(promise); void promise.finally(() => this.retiring.delete(promise)); return promise; }
  private retire(run: Run) { run.controller.abort(); if (this.run === run) this.run = undefined; if (run.clock) void this.closeTransport(run.clock); }
  private current(run: Run) { return !this.closed && !run.controller.signal.aborted && this.run === run; }
  private pauseRun() { const run = this.run; if (run?.busy) this.retire(run); else run?.clock?.pause(); }
  private cancelAuxiliary() {
    this.token++; this.pending?.abort(); this.pending = undefined;
    if (this.busy && this.spanish) { this.unsubscribe?.(); this.unsubscribe = undefined; void this.closeTransport(this.spanish); this.spanish = undefined; }
    this.busy = false;
  }
  private async start(run: Run, user: boolean) {
    run.busy = true;
    try {
      if (!run.clock) {
        const bytes = await this.options.load(585, run.controller.signal); if (!this.current(run)) return false;
        const clock = this.options.makeClock?.(run.plan) ?? new SourceStreamRunsClockV1(run.plan, { commitHeldFrame: frame => Number.isSafeInteger(frame) && frame >= 1 && frame <= run.plan.lastFrame });
        run.clock = clock; clock.setVolume(this.volume); const prepared = await clock.prepare(bytes); if (!this.current(run)) return false; if (!prepared.accepted) throw new Error(prepared.reason);
        const seek = clock.seekCandidateFrame(run.frame); if (!seek.accepted) throw new Error(seek.reason);
      }
      if (!this.current(run) || !this.state.playing || this.mode !== 'main') return false;
      const played = await run.clock.play({ activation: user ? 'user' : 'automatic', reducedMotion: false }); if (!this.current(run)) return false; if (!played.accepted) throw new Error(played.reason);
      run.busy = false; this.emit(); return true;
    } catch (error) {
      if (!this.current(run)) return false; this.retire(run); this.reduce({ type: 'pause' }); this.pauseRun(); this.failure = error instanceof Error ? error.message : String(error); this.emit(); return false;
    }
  }
  private sync(user = false): Promise<boolean> {
    if (this.closed) return Promise.resolve(false);
    let spec: ReturnType<P038Session['spec']>;
    try { spec = this.spec(); } catch (error) { this.reduce({ type: 'pause' }); this.failure = error instanceof Error ? error.message : String(error); this.emit(); return Promise.resolve(false); }
    if (this.run && this.run.key !== spec?.key) this.retire(this.run);
    if (!spec || !this.state.mainRunning || !this.state.playing || this.state.glossary || this.mode !== 'main') { this.pauseRun(); this.emit(); return Promise.resolve(true); }
    const run: Run = this.run ?? { ...spec, controller: new AbortController(), busy: false }; this.run = run;
    if (run.busy) return run.promise ?? Promise.resolve(false);
    if (run.clock?.snapshot().phase === 'playing') return Promise.resolve(true);
    run.promise = this.start(run, user); this.emit(); return run.promise;
  }
  tick() {
    if (this.closed || this.busy || this.mode === 'sa' || !this.state.playing) return;
    const run = this.run; if (!run?.clock || run.busy || !this.current(run)) return;
    const observation = run.clock.snapshot();
    if (observation.failure || !['playing', 'timeline-ended'].includes(observation.phase)) { this.failure = observation.failure; this.reduce({ type: 'pause' }); this.pauseRun(); this.emit(); return; }
    if (this.reduce({ type: 'advance-main', frame: observation.frame })) void this.sync();
  }
  async play() {
    if (this.closed || this.busy) return false;
    if (this.mode === 'sa') {
      if (!this.spanish) return false; if (this.spanish.snapshot().phase === 'buffer-ended') this.spanish.replay(); const ticket = this.token;
      const result = await this.spanish.play({ activation: 'user', reducedMotion: false }); if (this.closed || ticket !== this.token) return false; this.emit(); return result.accepted;
    }
    if (!p038CanPlay(this.state)) return false; this.failure = null; this.reduce({ type: 'play' }); return this.sync(true);
  }
  pause() { if (this.closed) return; this.tick(); this.cancelAuxiliary(); this.reduce({ type: 'pause' }); this.pauseRun(); this.spanish?.pause(); this.emit(); }
  private interaction(event: Event) { if (this.closed || this.busy || this.run?.busy || this.mode === 'sa') return false; this.tick(); const changed = this.reduce(event); if (changed) this.emit(); return changed; }
  namedPoint(name: P038PointName) { return this.interaction({ type: 'named-point', name }); }
  backgroundPoint(point: P038Point) { return this.interaction({ type: 'background-point', point }); }
  clonePoint(name: string) { return this.interaction({ type: 'clone-point', name }); }
  async submit() { if (!this.interaction({ type: 'submit' })) return false; this.failure = null; return this.sync(true); }
  async closeWrong() { if (!this.interaction({ type: 'close-wrong' })) return false; return this.sync(true); }
  openHelp() { return this.interaction({ type: 'open-help' }); }
  closeHelp() { return this.interaction({ type: 'close-help' }); }
  closeHint() { return this.interaction({ type: 'close-hint' }); }
  openGlossary(term: P038Term) { if (this.closed || this.busy || this.run?.busy || this.mode === 'sa' || this.state.glossary || !S.glossaryTerms.some(candidate => candidate === term)) return false; this.pause(); const changed = this.reduce({ type: 'open-glossary', term }); this.emit(); return changed; }
  closeGlossary() { if (this.closed || this.mode === 'sa') return false; const changed = this.reduce({ type: 'close-glossary' }); this.emit(); return changed; }
  async spanishAudio() {
    if (this.closed || this.busy || this.state.glossary || this.state.help || this.state.hint || this.state.wrong) return false;
    if (!this.source.sa) { this.failure = 'P038_NATIVE_SPANISH_DECODE_BINDING_UNAVAILABLE'; this.emit(); return false; }
    this.pause(); this.mode = 'sa'; this.failure = null; const ticket = this.token, controller = new AbortController(); this.pending = controller; this.busy = true; this.emit();
    const current = () => !this.closed && this.token === ticket && !controller.signal.aborted && this.mode === 'sa';
    try {
      let spanish = this.spanish;
      if (!spanish) {
        const bytes = await this.options.load('sa', controller.signal); if (!current()) return false;
        spanish = this.options.makeSpanish?.() ?? new DecodedSourceStreamTransport(this.source.sa); this.spanish = spanish; spanish.setVolume(this.volume);
        this.unsubscribe = spanish.subscribe(() => { if (this.spanish === spanish) this.emit(); }); const prepared = await spanish.prepare(bytes); if (!current()) return false; if (!prepared.accepted) throw new Error(prepared.reason);
      } else spanish.replay();
      const played = await spanish.play({ activation: 'user', reducedMotion: false }); if (!current()) return false; if (!played.accepted) throw new Error(played.reason);
      this.busy = false; this.pending = undefined; this.emit(); return true;
    } catch (error) {
      if (!current()) return false; this.unsubscribe?.(); this.unsubscribe = undefined; const spanish = this.spanish; this.spanish = undefined;
      if (spanish) await this.closeTransport(spanish); if (!current()) return false; this.busy = false; this.pending = undefined; this.failure = error instanceof Error ? error.message : String(error); this.emit(); return false;
    }
  }
  returnMain() { if (this.closed) return; this.pause(); this.mode = 'main'; this.emit(); }
  setVolume(value: number) { if (this.closed || !Number.isFinite(value)) return; this.volume = Math.max(0, Math.min(1, value)); this.run?.clock?.setVolume(this.volume); this.spanish?.setVolume(this.volume); this.emit(); }
  async replay() {
    if (this.closed) return false; this.cancelAuxiliary(); if (this.run) this.retire(this.run); this.unsubscribe?.(); this.unsubscribe = undefined;
    if (this.spanish) void this.closeTransport(this.spanish); this.spanish = undefined; this.mode = 'main'; this.reduce({ type: 'replay' }); this.failure = null; this.busy = true; const ticket = this.token; this.emit();
    await Promise.all([...this.retiring]); if (this.closed || ticket !== this.token) return false; this.busy = false; return this.play();
  }
  /** Bounded engineering inspection does not cross an unanswered source stop. */
  inspect(frame: number) {
    if (this.closed || this.busy || this.state.glossary || this.state.help || this.state.hint || this.state.wrong || this.mode === 'sa' || !Number.isSafeInteger(frame) || frame < this.state.mainFrame || frame > 525 || this.state.phase === 'quiz-held' || this.state.phase === 'ended') return false;
    this.pause(); if (this.run) this.retire(this.run); this.reduce({ type: 'play' }); this.reduce({ type: 'advance-main', frame }); this.reduce({ type: 'pause' }); this.emit(); return this.state.mainFrame === frame;
  }
  async close() {
    if (this.closed) return; this.cancelAuxiliary(); if (this.run) this.retire(this.run); this.unsubscribe?.(); this.unsubscribe = undefined;
    if (this.spanish) void this.closeTransport(this.spanish); this.spanish = undefined; this.reduce({ type: 'leave' }); this.closed = true; await Promise.all([...this.retiring]);
  }
}
