// P043 12 fps engineering visual observer. Audio and source timing remain open.
import {initialP043State, reduceP043, P043_SOURCE,
  type P043Choice,type P043Event,type P043State}
  from './alg-l06-p043-state-v1';

export type P043VisualSnapshotV1={state:P043State;visualClockRunning:boolean;
  error:string|null;audioEnabled:false;browserPcmAccepted:false;
  sourceClockAlignment:'unverified';frameClock:'engineering-12fps-visual-only';
  lessonCompleted:false};
export type P043VisualDriverOptionsV1={paint:(state:P043State)=>boolean;
  now:()=>number;onSnapshot?:(snapshot:P043VisualSnapshotV1)=>void;
  onGlossary?:(keyAttribute:string)=>void;onCleanup?:()=>void;
  clearStage?:()=>void};

const FPS = 12;
const active = new Set(['prequiz', 'postquiz', 'wrong-feedback-playing',
  'wrong-feedback-tail', 'right-feedback-playing']);

export class P043VisualEngineeringRuntimeV1 {
  state = initialP043State();
  clock:null|{frame:number;time:number;epoch:number} = null;
  error:string|null = null;
  closed = false;
  paint:(state:P043State)=>boolean;
  now:()=>number;
  onSnapshot?:P043VisualDriverOptionsV1['onSnapshot'];
  onGlossary?:P043VisualDriverOptionsV1['onGlossary'];
  onCleanup?:P043VisualDriverOptionsV1['onCleanup'];
  clearStage?:P043VisualDriverOptionsV1['clearStage'];
  constructor({paint, now, onSnapshot, onGlossary, onCleanup,
    clearStage}:P043VisualDriverOptionsV1) {
    if (typeof paint !== 'function' || typeof now !== 'function')
      throw new TypeError('P043_VISUAL_DRIVER_REQUIRES_PAINT_AND_CLOCK');
    Object.assign(this, {paint, now, onSnapshot, onGlossary, onCleanup, clearStage});
    this.paint=paint;this.now=now;
  }
  snapshot():P043VisualSnapshotV1 {
    return {state: this.state, visualClockRunning: this.clock !== null,
      error: this.error, audioEnabled: false, browserPcmAccepted: false,
      sourceClockAlignment: 'unverified', frameClock: 'engineering-12fps-visual-only',
      lessonCompleted: false};
  }
  publish() {if (!this.closed) this.onSnapshot?.(this.snapshot());}
  commit(event:P043Event) {
    if (this.closed || this.error && !['replay', 'leave'].includes(event.type))
      return null;
    const result = reduceP043(this.state, event);
    if (!result.accepted) return null;
    this.state = result.state;
    if (this.state.phase === 'left') {
      this.clock = null;
      try {this.clearStage?.();} catch {this.error = 'P043_STAGE_CLEAR_FAILED';}
      try {this.onCleanup?.();} catch {this.error = 'P043_HOST_CLEANUP_FAILED';}
      this.publish();
      return result;
    }
    try {
      if (!this.paint(this.state)) throw Error('frame not committed');
    } catch {
      this.clock = null;
      this.error = 'P043_FRAME_COMMIT_FAILED';
      this.publish();
      return null;
    }
    for (const effect of result.effects)
      if (effect.type === 'host:DoHyperLinks')
        this.onGlossary?.(String(effect.keyAttribute));
    this.publish();
    return result;
  }
  mount() {
    if (this.closed) return false;
    try {
      if (!this.paint(this.state)) throw Error('frame not committed');
    } catch {this.error = 'P043_FRAME_COMMIT_FAILED'; this.publish(); return false;}
    this.publish();
    return true;
  }
  anchor(frame:number) {
    const time = this.now();
    if (!Number.isFinite(time)) return false;
    this.clock = {frame, time, epoch: this.state.epoch};
    this.publish();
    return true;
  }
  play() {
    if (this.closed || this.error || this.clock || !active.has(this.state.phase))
      return false;
    if (this.state.phase === 'prequiz' && !this.state.mainPlaying) {
      // After glossary the source page is held; its audio cursor is unknown.
      // Require Replay instead of silently resuming at a fabricated position.
      if (this.state.mainFrame !== 1) return false;
      if (!this.commit({type: 'start-main', epoch: this.state.epoch})) return false;
    }
    const frame = this.state.feedback?.frame ?? this.state.mainFrame;
    return this.anchor(frame);
  }
  pause() {this.tick(); const wasRunning = !!this.clock;
    this.clock = null; this.publish(); return wasRunning;}
  tick() {
    const clock = this.clock;
    if (!clock || this.closed || this.error || clock.epoch !== this.state.epoch)
      return this.snapshot();
    const elapsed = Math.max(0, this.now() - clock.time);
    if (!Number.isFinite(elapsed)) {this.clock = null; return this.snapshot();}
    const candidate = clock.frame + Math.floor(elapsed * FPS / 1000 + 1e-9);
    const feedback = this.state.feedback;
    if (feedback) {
      const end = feedback.kind === 'right' ? P043_SOURCE.rightTerminalFrame :
        this.state.phase === 'wrong-feedback-playing' ?
          P043_SOURCE.wrongHoldFrame : P043_SOURCE.wrongTerminalFrame;
      const target = Math.min(candidate, end);
      if (target > feedback.frame) {
        const token = feedback.token;
        this.commit({type: 'advance-feedback', epoch: clock.epoch,
          token, frame: target});
        if (this.state.phase === 'wrong-feedback-held' ||
            this.state.phase === 'quiz-held') this.clock = null;
        else if (this.state.phase === 'postquiz') this.anchor(this.state.mainFrame);
      }
    } else if (this.state.mainPlaying) {
      const target = Math.min(candidate,
        this.state.phase === 'prequiz' ? P043_SOURCE.quizFrame :
          P043_SOURCE.lastFrame);
      if (target > this.state.mainFrame) {
        this.commit({type: 'advance-main', epoch: clock.epoch, frame: target});
        if (!this.state.mainPlaying) this.clock = null;
      }
    }
    return this.snapshot();
  }
  choose(choice:P043Choice, quizGeneration = this.state.quizGeneration) {
    const result = this.commit({type: 'choose', epoch: this.state.epoch,
      quizGeneration, choice});
    return !!result && !!this.state.feedback && this.anchor(this.state.feedback.frame);
  }
  closeWrong(token:string) {
    const result = this.commit({type: 'close-wrong', epoch: this.state.epoch, token});
    return !!result && !!this.state.feedback && this.anchor(this.state.feedback.frame);
  }
  openNmh(quizGeneration = this.state.quizGeneration) {
    return !!this.commit({type: 'open-nmh', epoch: this.state.epoch,
      quizGeneration});
  }
  closeNmh(quizGeneration = this.state.quizGeneration) {
    return !!this.commit({type: 'close-nmh', epoch: this.state.epoch,
      quizGeneration});
  }
  glossary(buttonId:number, quizGeneration = this.state.quizGeneration) {
    const result = this.commit({type: 'glossary', epoch: this.state.epoch,
      quizGeneration, buttonId});
    if (result) this.clock = null;
    return !!result;
  }
  closeGlossary(quizGeneration = this.state.quizGeneration) {
    return !!this.commit({type: 'close-glossary', epoch: this.state.epoch,
      quizGeneration});
  }
  replay() {
    if (!this.commit({type: 'replay', epoch: this.state.epoch})) return false;
    this.clock = null;
    this.error = null;
    this.publish();
    return true;
  }
  close() {
    if (this.closed) return;
    this.commit({type: 'leave', epoch: this.state.epoch});
    this.closed = true;
    this.clock = null;
  }
}
