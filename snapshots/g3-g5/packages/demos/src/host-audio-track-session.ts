import type {SourceAudioMedia} from './source-pcm-audio';

/** Owns one already-selected host narration media object. It never selects an
 * asset, creates a teaching clock, or seeks during a temporary pause. */
export class HostAudioTrackSession {
  private attempt = 0;
  private paused = false;
  private wanted = false;
  private retired = false;
  private readonly ended = () => this.finish('ended');
  private readonly error = () => this.finish('error');

  constructor(
    private readonly media: SourceAudioMedia,
    private readonly onFinished: (reason: 'ended' | 'error') => void,
  ) {
    media.addEventListener('ended', this.ended);
    media.addEventListener('error', this.error);
  }

  async play(): Promise<boolean> {
    if (this.retired) return false;
    this.wanted = true;
    if (this.paused) return false;
    return this.startAttempt();
  }

  async setPaused(paused: boolean): Promise<boolean> {
    if (this.retired || this.paused === paused) return false;
    this.paused = paused;
    if (paused) {
      // SourcePcmAudio.pause() preserves media time and invalidates its own
      // pending native play. Our generation also protects this owner's intent.
      this.attempt++;
      this.media.pause();
      return false;
    }
    return this.wanted ? this.startAttempt() : false;
  }

  /** Explicit Stop and ownership changes discard both position and intent. */
  stop(): void {
    this.retire(true);
  }

  private async startAttempt(): Promise<boolean> {
    const attempt = ++this.attempt;
    try {
      await this.media.play();
      return !this.retired && !this.paused && this.wanted && attempt === this.attempt;
    } catch {
      // A pause or a newer play can reject an older SourcePcmAudio request.
      // It must not finish the retained owner or a newer resumed attempt.
      if (!this.retired && !this.paused && this.wanted && attempt === this.attempt) {
        this.finish('error');
      }
      return false;
    }
  }

  private finish(reason: 'ended' | 'error'): void {
    if (this.retired) return;
    this.retire(false);
    this.onFinished(reason);
  }

  private retire(resetPosition: boolean): void {
    if (this.retired) return;
    this.retired = true;
    this.wanted = false;
    this.attempt++;
    this.media.removeEventListener('ended', this.ended);
    this.media.removeEventListener('error', this.error);
    this.media.pause();
    if (resetPosition) this.media.currentTime = 0;
    this.media.dispose?.();
  }
}
