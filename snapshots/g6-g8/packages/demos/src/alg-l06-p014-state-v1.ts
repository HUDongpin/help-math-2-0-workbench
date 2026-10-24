/** P014 quiz state from source actions; rendering and audio clocks remain separate. */
export type P014AnswerInstance = 'AnsBtn1' | 'AnsBtn2' | 'AnsBtn3' | 'AnsBtn4';
export type P014GlossaryKey = 'Input' | 'Output';
export type P014Phase = 'before-quiz' | 'awaiting-answer' | 'feedback' | 'post-quiz' | 'closed';
export type P014FeedbackKind = 'right' | 'wrong';
export type P014FeedbackDomain =
  | 'sprite-115' | 'sprite-156' | 'sprite-83' | 'sprite-148'
  | 'sprite-173' | 'sprite-187' | 'sprite-28';

export const P014_RIGHT_BRANCHES = [
  {ordinal: 1, domain: 'sprite-115', terminalFrame: 25},
  {ordinal: 2, domain: 'sprite-156', terminalFrame: 27},
  {ordinal: 3, domain: 'sprite-83', terminalFrame: 31},
  {ordinal: 4, domain: 'sprite-148', terminalFrame: 27},
] as const;
export const P014_WRONG_BRANCHES = [
  {ordinal: 1, domain: 'sprite-173', holdFrame: 22, resumeFrame: 23, ackButtonCharacterId: 167, terminalFrame: 31},
  {ordinal: 2, domain: 'sprite-187', holdFrame: 23, resumeFrame: 24, ackButtonCharacterId: 182, terminalFrame: 29},
  {ordinal: 3, domain: 'sprite-28', holdFrame: 20, resumeFrame: 21, ackButtonCharacterId: 21, terminalFrame: 28},
] as const;
const WRONG_FIRST = 'Substitute 25 for the variable C, which is the input for the formula to find the output, F. Try again.';
const WRONG_REPEAT = 'Substitute 25 for the variable C, which is the input for the formula to find the output, F.';

export interface P014QuizSnapshot {
  phase: P014Phase;
  mainFrame: number;
  playing: boolean;
  quizSection: boolean;
  tryCount: number;
  answersEnabled: boolean;
  feedbackKind: P014FeedbackKind | null;
  feedbackDomain: P014FeedbackDomain | null;
  feedbackOrdinal: number | null;
  feedbackToken: number | null;
  feedbackEntryFrame: number | null;
  feedbackFrame: number | null;
  feedbackHoldFrame: number | null;
  feedbackAwaitingAcknowledgment: boolean;
  feedbackAckButtonCharacterId: number | null;
  feedbackTerminalFrame: number | null;
  feedbackPlaying: boolean;
  feedbackText: string | null;
  glossaryOpen: P014GlossaryKey | null;
  mainResumeRequested: boolean;
  lessonCompleted: boolean;
}

/** Caller chooses the host's random branch; this model never predicts random(4/3). */
export class AlgL06P014QuizStateV1 {
  private phase: P014Phase = 'before-quiz';
  private mainFrame = 1;
  private playing = false;
  private tryCount = 0;
  private feedbackKind: P014FeedbackKind | null = null;
  private feedbackDomain: P014FeedbackDomain | null = null;
  private feedbackOrdinal: number | null = null;
  private feedbackToken: number | null = null;
  private feedbackTerminalFrame: number | null = null;
  private feedbackFrame: number | null = null;
  private feedbackHoldFrame: number | null = null;
  private feedbackResumeFrame: number | null = null;
  private feedbackAckButtonCharacterId: number | null = null;
  private feedbackAcknowledged = false;
  private feedbackPlaying = false;
  private feedbackText: string | null = null;
  private glossaryOpen: P014GlossaryKey | null = null;
  private mainResumeRequested = false;
  private generation = 0;

  snapshot(): P014QuizSnapshot {
    return {
      phase: this.phase,
      mainFrame: this.mainFrame,
      playing: this.playing,
      quizSection: this.phase === 'awaiting-answer' || this.phase === 'feedback',
      tryCount: this.tryCount,
      answersEnabled: this.phase === 'awaiting-answer' && this.glossaryOpen === null,
      feedbackKind: this.feedbackKind,
      feedbackDomain: this.feedbackDomain,
      feedbackOrdinal: this.feedbackOrdinal,
      feedbackToken: this.feedbackToken,
      feedbackEntryFrame: this.feedbackDomain === null ? null : 2,
      feedbackFrame: this.feedbackFrame,
      feedbackHoldFrame: this.feedbackHoldFrame,
      feedbackAwaitingAcknowledgment: this.awaitingFeedbackAcknowledgment(),
      feedbackAckButtonCharacterId: this.feedbackAckButtonCharacterId,
      feedbackTerminalFrame: this.feedbackTerminalFrame,
      feedbackPlaying: this.feedbackPlaying,
      feedbackText: this.feedbackText,
      glossaryOpen: this.glossaryOpen,
      mainResumeRequested: this.mainResumeRequested,
      lessonCompleted: false,
    };
  }

  play(): P014QuizSnapshot {
    if (this.phase === 'feedback' && this.glossaryOpen === null &&
      !this.awaitingFeedbackAcknowledgment()) this.feedbackPlaying = true;
    if (this.phase !== 'closed' && this.glossaryOpen === null &&
      this.phase !== 'awaiting-answer' && this.phase !== 'feedback') this.playing = true;
    return this.snapshot();
  }

  pause(): P014QuizSnapshot {
    this.playing = false;
    this.feedbackPlaying = false;
    return this.snapshot();
  }

  /** Main timeline cannot tick past source frame 120 until feedback terminal resumes it. */
  advanceMain(frame: number): P014QuizSnapshot {
    if (!Number.isInteger(frame) || frame < this.mainFrame || frame > 449) throw new RangeError('P014 main frame');
    if (!this.playing || this.glossaryOpen !== null ||
      this.phase === 'closed' || this.phase === 'awaiting-answer' || this.phase === 'feedback') return this.snapshot();
    this.mainFrame = this.phase === 'before-quiz' ? Math.min(frame, 120) : frame;
    if (this.phase === 'before-quiz' && this.mainFrame === 120) {
      this.phase = 'awaiting-answer';
      this.playing = false;
      this.tryCount = 0;
    }
    if (this.phase === 'post-quiz' && this.mainFrame > 120) this.mainResumeRequested = false;
    if (this.mainFrame === 449) this.playing = false;
    return this.snapshot();
  }

  answer(instance: P014AnswerInstance, branchOrdinal: number): P014QuizSnapshot {
    if (!this.snapshot().answersEnabled || this.mainFrame !== 120) return this.snapshot();
    const kind: P014FeedbackKind = instance === 'AnsBtn2' ? 'right' : 'wrong';
    if (!['AnsBtn1', 'AnsBtn2', 'AnsBtn3', 'AnsBtn4'].includes(instance)) throw new RangeError('P014 source answer instance');
    const branch = (kind === 'right' ? P014_RIGHT_BRANCHES : P014_WRONG_BRANCHES)
      .find((row) => row.ordinal === branchOrdinal);
    if (!branch) throw new RangeError('P014 source feedback branch');
    this.feedbackKind = kind;
    this.feedbackDomain = branch.domain;
    this.feedbackOrdinal = branch.ordinal;
    this.feedbackToken = ++this.generation;
    this.feedbackTerminalFrame = branch.terminalFrame;
    this.feedbackFrame = 2;
    this.feedbackHoldFrame = 'holdFrame' in branch ? branch.holdFrame : null;
    this.feedbackResumeFrame = 'resumeFrame' in branch ? branch.resumeFrame : null;
    this.feedbackAckButtonCharacterId = 'ackButtonCharacterId' in branch ? branch.ackButtonCharacterId : null;
    this.feedbackAcknowledged = false;
    this.feedbackPlaying = true;
    this.feedbackText = kind === 'wrong' ? (this.tryCount === 1 ? WRONG_REPEAT : WRONG_FIRST) : null;
    this.phase = 'feedback';
    this.playing = false;
    return this.snapshot();
  }

  /** The authored wrong branch stops at a popup until its own Close button. */
  advanceFeedback(localFrame: number): P014QuizSnapshot {
    if (this.phase !== 'feedback' || !this.feedbackPlaying ||
      this.glossaryOpen !== null || this.feedbackFrame === null ||
      !Number.isInteger(localFrame) || localFrame < this.feedbackFrame ||
      this.feedbackTerminalFrame === null) return this.snapshot();
    const limit = !this.feedbackAcknowledged && this.feedbackHoldFrame !== null
      ? this.feedbackHoldFrame : this.feedbackTerminalFrame;
    this.feedbackFrame = Math.min(localFrame, limit);
    if (this.awaitingFeedbackAcknowledgment()) this.feedbackPlaying = false;
    return this.snapshot();
  }

  acknowledgeFeedback(token: number): P014QuizSnapshot {
    if (this.phase !== 'feedback' || this.feedbackToken !== token ||
      !this.awaitingFeedbackAcknowledgment() || this.glossaryOpen !== null ||
      this.feedbackResumeFrame === null) return this.snapshot();
    this.feedbackAcknowledged = true;
    this.feedbackFrame = this.feedbackResumeFrame;
    this.feedbackPlaying = true;
    return this.snapshot();
  }

  /** Completes only the active nested feedback timeline; stale callbacks are ignored. */
  completeFeedback(token: number, localFrame: number): P014QuizSnapshot {
    if (this.phase !== 'feedback' || this.feedbackToken !== token ||
      !this.feedbackPlaying || this.glossaryOpen !== null ||
      localFrame !== this.feedbackTerminalFrame ||
      this.feedbackFrame !== this.feedbackTerminalFrame) return this.snapshot();
    const kind = this.feedbackKind;
    this.clearFeedback();
    if (kind === 'wrong') {
      if (this.tryCount === 0) {
        this.tryCount = 1;
        this.phase = 'awaiting-answer';
      } else {
        this.tryCount = 0;
        this.phase = 'post-quiz';
        this.mainResumeRequested = true;
        this.playing = true;
      }
    } else {
      // The authored right terminal does not mutate quizTryCount.
      this.phase = 'post-quiz';
      this.mainResumeRequested = true;
      this.playing = true;
    }
    return this.snapshot();
  }

  openGlossary(key: P014GlossaryKey): P014QuizSnapshot {
    if (this.phase === 'closed' || this.glossaryOpen !== null || this.mainFrame < 2) return this.snapshot();
    if (key !== 'Input' && key !== 'Output') throw new RangeError('P014 glossary key');
    this.glossaryOpen = key;
    this.playing = false;
    this.feedbackPlaying = false;
    return this.snapshot();
  }

  closeGlossary(): P014QuizSnapshot {
    this.glossaryOpen = null;
    return this.snapshot();
  }

  replay(): P014QuizSnapshot {
    if (this.phase === 'closed') return this.snapshot();
    this.generation++;
    this.phase = 'before-quiz';
    this.mainFrame = 1;
    this.playing = false;
    this.tryCount = 0;
    this.clearFeedback();
    this.glossaryOpen = null;
    this.mainResumeRequested = false;
    return this.snapshot();
  }

  navigateAway(): P014QuizSnapshot {
    this.generation++;
    this.phase = 'closed';
    this.playing = false;
    this.clearFeedback();
    this.glossaryOpen = null;
    this.mainResumeRequested = false;
    return this.snapshot();
  }

  private clearFeedback(): void {
    this.feedbackKind = null;
    this.feedbackDomain = null;
    this.feedbackOrdinal = null;
    this.feedbackToken = null;
    this.feedbackTerminalFrame = null;
    this.feedbackFrame = null;
    this.feedbackHoldFrame = null;
    this.feedbackResumeFrame = null;
    this.feedbackAckButtonCharacterId = null;
    this.feedbackAcknowledged = false;
    this.feedbackText = null;
    this.feedbackPlaying = false;
  }

  private awaitingFeedbackAcknowledgment(): boolean {
    return this.phase === 'feedback' && !this.feedbackAcknowledged &&
      this.feedbackHoldFrame !== null && this.feedbackFrame === this.feedbackHoldFrame;
  }
}
