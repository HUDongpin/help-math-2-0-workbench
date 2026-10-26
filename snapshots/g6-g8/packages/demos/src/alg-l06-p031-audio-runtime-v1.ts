import {ContinuousSourceStreamClockCandidate} from './continuous-source-stream-clock-candidate';
import {DecodedSourceStreamTransport} from './decoded-source-stream-transport';
import {P031_MAIN_CLOCK_PLAN, P031_MEASURED_BINDINGS} from './alg-l06-p031-measured-bindings-v1';
import {p031AnswerRequest, p031SourceState, type P031Choice, type P031Globals} from './alg-l06-p031-source-v1';

/** Unregistered P031 playback. Only page-owned effects are resolved at the terminal answer frame. */
export class P031AudioRuntimeV1 {
  private readonly main: ContinuousSourceStreamClockCandidate;
  private readonly spanish = new DecodedSourceStreamTransport(P031_MEASURED_BINDINGS.sa);
  private readonly mainAbort = new AbortController();
  private spanishAbort: AbortController | null = null;
  private generation = 0;
  private closed = false;
  private spanishPrepared = false;
  private spanishSelected = false;
  private spanishLoading = false;
  private globals: P031Globals = {quizTryCount: 0, wrongFeed: null};
  private failure: string | null = null;
  constructor(private readonly options: {
    load: (id: 'main' | 'sa', signal: AbortSignal) => Promise<ArrayBuffer>;
    commitFrame: (frame: number) => boolean;
  }) {
    this.main = new ContinuousSourceStreamClockCandidate(P031_MAIN_CLOCK_PLAN, {commitHeldFrame: options.commitFrame});
  }
  async prepare() {
    if (this.closed) return false;
    try {
      const bytes = await this.options.load('main', this.mainAbort.signal);
      if (this.closed) return false;
      const result = await this.main.prepare(bytes);
      if (this.closed) return false;
      if (!result.accepted) {this.failure = result.reason; return false;}
      if (!this.options.commitFrame(1)) {this.failure = 'P031_INITIAL_COMMIT_FAILED'; return false;}
      return true;
    } catch (error) {if (!this.closed) this.failure = String(error); return false;}
  }
  snapshot() {
    const main = this.main.snapshot(), spanish = this.spanish.snapshot();
    // Native Spanish EOF returns to the held main picture; later Play can continue main.
    if (this.spanishSelected && !this.spanishLoading && spanish.phase === 'buffer-ended') this.spanishSelected = false;
    return {main, spanish, frame: main.frame, source: p031SourceState(main.frame),
      selected: this.spanishSelected ? 'sa' as const : 'main' as const, spanishLoading: this.spanishLoading,
      globals: {...this.globals}, failure: this.failure, closed: this.closed,
      hostFeedbackResolved: false, lessonCompleted: false};
  }
  async play() {
    if (this.closed || this.spanishLoading) return false;
    this.snapshot();
    const result = this.spanishSelected ? await this.spanish.play({activation: 'user', reducedMotion: false})
      : await this.main.play({activation: 'user', reducedMotion: false});
    if (this.closed) return false;
    this.failure = result.accepted ? null : result.reason;
    return result.accepted;
  }
  pause() {
    if (this.closed) return false;
    if (this.spanishLoading) return this.returnMain();
    const result = this.spanishSelected ? this.spanish.pause() : this.main.pause();
    return result.accepted;
  }
  async startSpanish() {
    if (this.closed) return false;
    const ticket = ++this.generation;
    this.spanishAbort?.abort();
    const abort = new AbortController(); this.spanishAbort = abort;
    this.main.pause(); this.spanish.replay();
    this.spanishSelected = true; this.spanishLoading = true; this.failure = null;
    try {
      if (!this.spanishPrepared) {
        const bytes = await this.options.load('sa', abort.signal);
        if (ticket !== this.generation || this.closed) return false;
        const result = await this.spanish.prepare(bytes);
        if (ticket !== this.generation || this.closed) return false;
        if (!result.accepted) throw Error(result.reason);
        this.spanishPrepared = true;
      }
      const result = await this.spanish.play({activation: 'user', reducedMotion: false});
      if (ticket !== this.generation || this.closed) return false;
      this.spanishLoading = false;
      if (!result.accepted) {this.failure = result.reason; return false;}
      return true;
    } catch (error) {
      if (ticket === this.generation && !this.closed) {
        this.spanishLoading = false; this.spanishSelected = false; this.failure = String(error);
      }
      return false;
    }
  }
  returnMain() {
    if (this.closed) return false;
    this.generation++; this.spanishAbort?.abort(); this.spanishAbort = null;
    this.spanish.replay(); this.spanishSelected = false; this.spanishLoading = false;
    return this.options.commitFrame(this.main.snapshot().frame);
  }
  replay() {
    if (this.closed) return false;
    this.returnMain();
    const result = this.main.replay();
    if (!result.accepted) return false;
    this.globals = {quizTryCount: 0, wrongFeed: null}; this.failure = null;
    return this.options.commitFrame(1);
  }
  /** Developer inspection only; production host integration is not admitted. */
  inspectFrame(frame: number) {
    if (this.closed) return false;
    this.returnMain(); return this.main.seekCandidateFrame(frame).accepted;
  }
  answer(choice: P031Choice) {
    if (this.closed || this.spanishSelected || this.spanishLoading) throw Error('P031_ANSWER_INACTIVE');
    const request = p031AnswerRequest(this.main.snapshot().frame, choice, this.globals);
    this.globals = request.globals;
    return request;
  }
  setVolume(value: number) {
    const main = this.main.setVolume(value), spanish = this.spanish.setVolume(value);
    return main.accepted && spanish.accepted;
  }
  async close() {
    if (this.closed) return;
    this.closed = true; this.generation++; this.mainAbort.abort(); this.spanishAbort?.abort();
    this.spanishLoading = false; this.spanishSelected = false;
    await Promise.all([this.main.close(), this.spanish.close()]);
  }
}
