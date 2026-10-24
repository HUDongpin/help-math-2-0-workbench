/** P020 quiz state from exact source action/placement audit c46706b5c6d7fc57af6ac4584b655d86d6b87d0395aed7ca35af4275287a8523.
 * Adapted from the maintained P014 state pattern without changing its frozen files.
 * Drawing, source-visible glossary gates and audio clocks are separate contracts. */
export type P020AnswerInstance = 'AnsBtn1' | 'AnsBtn2' | 'AnsBtn3' | 'AnsBtn4';
export type P020GlossaryKey = 'Input' | 'Function' | 'Output';
export type P020Phase = 'before-quiz' | 'awaiting-answer' | 'feedback' | 'post-quiz' | 'closed';
export type P020FeedbackKind = 'right' | 'wrong';
export type P020FeedbackDomain =
  | 'sprite-157' | 'sprite-128' | 'sprite-108' | 'sprite-141'
  | 'sprite-65' | 'sprite-94' | 'sprite-80';

export const P020_RIGHT_BRANCHES = [
  {ordinal: 1, domain: 'sprite-157', terminalFrame: 28},
  {ordinal: 2, domain: 'sprite-128', terminalFrame: 33},
  {ordinal: 3, domain: 'sprite-108', terminalFrame: 32},
  {ordinal: 4, domain: 'sprite-141', terminalFrame: 28},
] as const;
export const P020_WRONG_BRANCHES = [
  {ordinal: 1, domain: 'sprite-65', holdFrame: 23, resumeFrame: 24, ackButtonCharacterId: 60, terminalFrame: 28},
  {ordinal: 2, domain: 'sprite-94', holdFrame: 20, resumeFrame: 21, ackButtonCharacterId: 89, terminalFrame: 28},
  {ordinal: 3, domain: 'sprite-80', holdFrame: 21, resumeFrame: 22, ackButtonCharacterId: 74, terminalFrame: 28},
] as const;
const WRONG_FIRST = 'Find 5 in the input column. Then look across for its output value. Try again.';
const WRONG_REPEAT = 'Find 5 in the input column. Then look across for its output value.';

export interface P020QuizSnapshot {
  phase: P020Phase;
  mainFrame: number;
  playing: boolean;
  quizSection: boolean;
  tryCount: number;
  answersEnabled: boolean;
  feedbackKind: P020FeedbackKind | null;
  feedbackDomain: P020FeedbackDomain | null;
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
  glossaryOpen: P020GlossaryKey | null;
  mainResumeRequested: boolean;
  lessonCompleted: boolean;
}

/** Caller chooses the host's random branch; this model never predicts random(4/3). */
export class AlgL06P020QuizStateV1 {
  private phase: P020Phase = 'before-quiz';
  private mainFrame = 1;
  private playing = false;
  private tryCount = 0;
  private feedbackKind: P020FeedbackKind | null = null;
  private feedbackDomain: P020FeedbackDomain | null = null;
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
  private glossaryOpen: P020GlossaryKey | null = null;
  private mainResumeRequested = false;
  private generation = 0;

  snapshot(): P020QuizSnapshot {
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

  play(): P020QuizSnapshot {
    if (this.phase === 'feedback' && this.glossaryOpen === null &&
      !this.awaitingFeedbackAcknowledgment()) this.feedbackPlaying = true;
    if (this.phase !== 'closed' && this.glossaryOpen === null &&
      this.phase !== 'awaiting-answer' && this.phase !== 'feedback') this.playing = true;
    return this.snapshot();
  }

  pause(): P020QuizSnapshot {
    this.playing = false;
    this.feedbackPlaying = false;
    return this.snapshot();
  }

  /** Main timeline cannot tick past source frame 58 until feedback terminal resumes it. */
  advanceMain(frame: number): P020QuizSnapshot {
    if (!Number.isInteger(frame) || frame < this.mainFrame || frame > 172) throw new RangeError('P020 main frame');
    if (!this.playing || this.glossaryOpen !== null ||
      this.phase === 'closed' || this.phase === 'awaiting-answer' || this.phase === 'feedback') return this.snapshot();
    this.mainFrame = this.phase === 'before-quiz' ? Math.min(frame, 58) : frame;
    if (this.phase === 'before-quiz' && this.mainFrame === 58) {
      this.phase = 'awaiting-answer';
      this.playing = false;
      this.tryCount = 0;
    }
    if (this.phase === 'post-quiz' && this.mainFrame > 58) this.mainResumeRequested = false;
    if (this.mainFrame === 172) this.playing = false;
    return this.snapshot();
  }

  answer(instance: P020AnswerInstance, branchOrdinal: number): P020QuizSnapshot {
    if (!this.snapshot().answersEnabled || this.mainFrame !== 58) return this.snapshot();
    const kind: P020FeedbackKind = instance === 'AnsBtn2' ? 'right' : 'wrong';
    if (!['AnsBtn1', 'AnsBtn2', 'AnsBtn3', 'AnsBtn4'].includes(instance)) throw new RangeError('P020 source answer instance');
    const branch = (kind === 'right' ? P020_RIGHT_BRANCHES : P020_WRONG_BRANCHES)
      .find((row) => row.ordinal === branchOrdinal);
    if (!branch) throw new RangeError('P020 source feedback branch');
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
  advanceFeedback(localFrame: number, token: number): P020QuizSnapshot {
    if (this.phase !== 'feedback' || this.feedbackToken !== token || !this.feedbackPlaying ||
      this.glossaryOpen !== null || this.feedbackFrame === null ||
      !Number.isInteger(localFrame) || localFrame < this.feedbackFrame ||
      this.feedbackTerminalFrame === null) return this.snapshot();
    const limit = !this.feedbackAcknowledged && this.feedbackHoldFrame !== null
      ? this.feedbackHoldFrame : this.feedbackTerminalFrame;
    this.feedbackFrame = Math.min(localFrame, limit);
    if (this.awaitingFeedbackAcknowledgment()) this.feedbackPlaying = false;
    return this.snapshot();
  }

  acknowledgeFeedback(token: number): P020QuizSnapshot {
    if (this.phase !== 'feedback' || this.feedbackToken !== token ||
      !this.awaitingFeedbackAcknowledgment() || this.glossaryOpen !== null ||
      this.feedbackResumeFrame === null) return this.snapshot();
    this.feedbackAcknowledged = true;
    this.feedbackFrame = this.feedbackResumeFrame;
    this.feedbackPlaying = true;
    return this.snapshot();
  }

  /** Completes only the active nested feedback timeline; stale callbacks are ignored. */
  completeFeedback(token: number, localFrame: number): P020QuizSnapshot {
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

  /** Caller must first validate the exact source instance/visible hit gate. */
  openGlossary(key: P020GlossaryKey): P020QuizSnapshot {
    if (this.phase === 'closed' || this.glossaryOpen !== null || this.mainFrame < 2) return this.snapshot();
    if (key !== 'Input' && key !== 'Function' && key !== 'Output') throw new RangeError('P020 glossary key');
    this.glossaryOpen = key;
    this.playing = false;
    this.feedbackPlaying = false;
    return this.snapshot();
  }

  closeGlossary(): P020QuizSnapshot {
    this.glossaryOpen = null;
    return this.snapshot();
  }

  replay(): P020QuizSnapshot {
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

  navigateAway(): P020QuizSnapshot {
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
