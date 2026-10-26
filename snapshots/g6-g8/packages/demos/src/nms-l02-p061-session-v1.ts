import {
  advanceP061State, createP061State, dispatchP061State, P061_STOPS,
  type P061Event, type P061State,
} from './nms-l02-p061-state-v1';
import {
  P061_AUDIO_DOMAINS, P061_AUDIO_SOURCE, type P061AudioDomainId,
  type P061AudioSnapshot,
} from './nms-l02-p061-audio-v1';

/** The real P061AudioController satisfies this interface. A small injected
 * transport keeps session decisions testable without an AudioContext or DOM. */
export interface P061SessionAudio {
  snapshot(): P061AudioSnapshot;
  playDomain(id: P061AudioDomainId, fromFrame: number, toFrame: number,
    options?: {restart?: boolean}): Promise<boolean>;
  resume(): Promise<boolean>;
  pause(): void;
  reset(): void;
  close(): Promise<void>;
}

export type P061SessionPhase = 'paused' | 'loading' | 'playing' | 'complete' | 'error' | 'closed';
export interface P061SessionSnapshot {
  state: P061State;
  audio: P061AudioSnapshot;
  phase: P061SessionPhase;
}
export interface P061SessionOptions {
  audio: P061SessionAudio;
  seed?: number;
  onChange?: (snapshot: P061SessionSnapshot) => void;
  onComplete?: (snapshot: P061SessionSnapshot) => void;
}

const MAIN_DOMAIN: P061AudioDomainId = 'sprite-315';
const nextMainStop = (frame: number): number | undefined => P061_STOPS.find((stop) => stop > frame);

/** Source-script stop frames are visual state transitions, but decoded MP3 can
 * extend slightly beyond the visual frame clock. This modern policy holds the
 * picture at stop-1 until the verified source-sample window reaches its audio
 * boundary. Feedback holds terminal-1 until EOF at lastBlockFrame+1. Neither
 * policy claims original Flash runtime synchronization parity. */
export class P061Session {
  private state: P061State;
  private boxTickAt: number | null = null;
  private boxRemainderMs = 0;
  private completed = false;
  private closed = false;
  private readonly audio: P061SessionAudio;
  private readonly onChange?: P061SessionOptions['onChange'];
  private readonly onComplete?: P061SessionOptions['onComplete'];

  constructor(options: P061SessionOptions) {
    this.audio = options.audio;
    this.onChange = options.onChange;
    this.onComplete = options.onComplete;
    this.state = dispatchP061State(createP061State(options.seed), {type: 'pause'});
  }

  snapshot(): P061SessionSnapshot {
    const audio = this.audio.snapshot();
    const phase: P061SessionPhase = this.closed || this.state.navigatedAway ? 'closed' :
      this.state.mainFrame === 879 && !this.state.feedback ? 'complete' :
      audio.phase === 'error' ? 'error' :
      this.state.pausedByUser || this.state.glossaryKey ? 'paused' :
      this.state.box?.playing ? 'playing' :
      !this.state.mainPlaying && !this.state.feedback ? 'paused' :
      audio.phase === 'loading' ? 'loading' :
      audio.phase === 'playing' ? 'playing' : 'paused';
    return {state: this.state, audio, phase};
  }

  private publish(): P061SessionSnapshot {
    const current = this.snapshot();
    this.onChange?.(current);
    if (current.phase === 'complete' && !this.completed) {
      this.completed = true;
      this.onComplete?.(current);
    }
    return current;
  }

  private async startMain(restart: boolean): Promise<void> {
    const stop = nextMainStop(this.state.mainFrame);
    if (stop === undefined) return;
    await this.audio.playDomain(MAIN_DOMAIN, this.state.mainFrame, stop, {restart});
    this.publish();
  }

  private async startFeedback(id: P061AudioDomainId): Promise<void> {
    const end = P061_AUDIO_DOMAINS[id].lastBlockFrame + 1;
    // The same feedback sprite can be chosen twice. An ended saved window must
    // not suppress the second authored answer. The identified host enters the
    // feedback sprite at local frame 2; its source-sample prefix is still 0.
    await this.audio.playDomain(id, 2, end, {restart: true});
    this.publish();
  }

  /** Explicit events alone may start audio. In particular, glossary close
   * remains paused until Play, while Replay is an explicit play gesture. */
  async dispatch(event: P061Event): Promise<P061SessionSnapshot> {
    if (this.closed) return this.snapshot();
    if (event.type === 'navigate-away') {
      await this.close();
      return this.snapshot();
    }
    if (event.type !== 'replay' && event.type !== 'play') this.tick();
    if (event.type === 'replay') {
      this.audio.reset();
      this.state = dispatchP061State(this.state, event);
      this.completed = false;
      this.boxTickAt = null;
      this.boxRemainderMs = 0;
      this.publish();
      await this.startMain(true);
      return this.publish();
    }
    const before = this.state;
    this.state = dispatchP061State(this.state, event);
    if (event.type === 'glossary-close' && before.glossaryKey) {
      this.state = dispatchP061State(this.state, {type: 'pause'});
      this.audio.pause();
    } else if (event.type === 'pause' ||
      (event.type === 'glossary-open' && this.state !== before)) {
      this.audio.pause();
    }
    if (event.type === 'pause' || event.type === 'play' ||
        event.type === 'glossary-open' || event.type === 'glossary-close') {
      // Silent boxes use a separate wall clock. Pause/modal dwell must never
      // be counted as elapsed local frames when playback resumes.
      this.boxTickAt = null;
    }
    if (event.type === 'box-play' || event.type === 'box-release') {
      this.boxTickAt = null;
      this.boxRemainderMs = 0;
    }
    this.publish();
    if (this.state === before) return this.snapshot();
    if (event.type === 'play') {
      const audio = this.audio.snapshot();
      if (this.state.feedback) {
        const id = `sprite-${this.state.feedback.spriteId}` as P061AudioDomainId;
        if (audio.domain === id && !audio.atBoundary) await this.audio.resume();
      } else if (this.state.mainPlaying) {
        if (audio.domain === MAIN_DOMAIN && !audio.atBoundary &&
            audio.fromFrame !== null && audio.toFrame === nextMainStop(this.state.mainFrame)) {
          await this.audio.resume();
        } else {
          await this.startMain(true);
        }
      }
    } else if (event.type === 'continue' && this.state.mainPlaying) {
      await this.startMain(true);
    } else if (event.type === 'answer' && this.state.feedback && !before.feedback) {
      await this.startFeedback(`sprite-${this.state.feedback.spriteId}` as P061AudioDomainId);
    }
    return this.publish();
  }

  /** AudioContext's decoded source cursor drives main and feedback frames.
   * The supplied monotonic clock advances only the silent nested boxes. */
  tick(nowMs = performance.now()): P061SessionSnapshot {
    if (this.closed) return this.snapshot();
    if (!Number.isFinite(nowMs)) throw new RangeError('P061 tick requires finite time');
    const audio = this.audio.snapshot();
    const before = this.state;
    if (!this.state.pausedByUser && !this.state.glossaryKey && this.state.box?.playing) {
      if (this.boxTickAt === null) this.boxTickAt = nowMs;
      const elapsed = Math.max(0, nowMs - this.boxTickAt);
      this.boxTickAt = nowMs;
      this.boxRemainderMs += elapsed;
      const steps = Math.min(100_000, Math.floor(this.boxRemainderMs * P061_AUDIO_SOURCE.fps / 1000));
      this.boxRemainderMs -= steps * 1000 / P061_AUDIO_SOURCE.fps;
      this.state = advanceP061State(this.state, steps);
    } else if (!this.state.pausedByUser && !this.state.glossaryKey && this.state.feedback &&
      audio.domain === `sprite-${this.state.feedback.spriteId}` &&
      (audio.phase === 'playing' || audio.atBoundary)) {
      const terminal = this.state.feedback.terminalFrame;
      const target = audio.atBoundary ? terminal : Math.min(terminal - 1, Math.max(2, audio.frame));
      this.state = advanceP061State(this.state, Math.max(0, target - this.state.feedback.frame));
      if (before.feedback && !this.state.feedback && this.state.mainPlaying) {
        // The authored feedback branch resumed the main timeline at 860.
        void this.startMain(true);
      }
    } else if (!this.state.pausedByUser && !this.state.glossaryKey && this.state.mainPlaying &&
      audio.domain === MAIN_DOMAIN && (audio.phase === 'playing' || audio.atBoundary)) {
      const stop = nextMainStop(this.state.mainFrame);
      if (stop !== undefined && audio.toFrame === stop) {
        const target = audio.atBoundary ? stop : Math.min(stop - 1, audio.frame);
        this.state = advanceP061State(this.state, Math.max(0, target - this.state.mainFrame));
      }
    }
    if (this.state !== before || audio.phase === 'error') return this.publish();
    return this.snapshot();
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    this.state = dispatchP061State(this.state, {type: 'navigate-away'});
    await this.audio.close();
    this.publish();
  }
}
