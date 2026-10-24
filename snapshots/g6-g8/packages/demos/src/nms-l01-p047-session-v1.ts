import {P047AudioV1, type P047AudioDependencies, type P047AudioState} from './nms-l01-p047-audio-v1';
import {createP047Quiz, p047AudioAsset, p047InputIdentity, reduceP047Quiz,
  type P047Action, type P047InputIdentity, type P047QuizState} from './nms-l01-p047-quiz-v1';
export interface P047SessionSnapshot {
  readonly quiz: P047QuizState;
  readonly paused: boolean;
  readonly audioLanguage: 'en' | 'es';
  readonly audio: P047AudioState;
  readonly closed: boolean;
}
interface Dependencies {
  readonly readAudio: P047AudioDependencies['read'];
  readonly changed: (snapshot: P047SessionSnapshot) => void;
  readonly now?: () => number;
  readonly context?: () => AudioContext;
}
export class P047SessionV1 {
  private quiz: P047QuizState;
  private paused = false;
  private closed = false;
  private audioLanguage: 'en' | 'es';
  private audio: P047AudioV1;
  private elapsed = 0;
  private startedAt: number;
  private now: () => number;
  constructor(seed: number, language: 'en' | 'es', private readonly dependencies: Dependencies) {
    this.quiz = createP047Quiz(seed); this.audioLanguage = language;
    this.now = dependencies.now ?? (() => performance.now()); this.startedAt = this.now();
    this.audio = new P047AudioV1({read: dependencies.readAudio, context: dependencies.context, changed: () => this.publish()});
  }
  snapshot(): P047SessionSnapshot { return Object.freeze({quiz: this.quiz, paused: this.paused, audioLanguage: this.audioLanguage, audio: this.audio.snapshot(), closed: this.closed}); }
  private publish() { this.dependencies.changed(this.snapshot()); }
  elapsedMs() { return this.quiz.finishedElapsedMs ?? this.elapsed + (this.paused ? 0 : Math.max(0, this.now() - this.startedAt)); }
  private current(identity: P047InputIdentity) {
    const actual = p047InputIdentity(this.quiz);
    return Object.keys(actual).every(key => actual[key as keyof P047InputIdentity] === identity[key as keyof P047InputIdentity]);
  }
  dispatch(action: P047Action) {
    if (this.closed || this.paused) return false;
    // The session owns elapsed time; an arbitrary presentation event cannot set it.
    const candidate = reduceP047Quiz(this.quiz, action.type === 'answer' ? {...action, elapsedMs: this.elapsedMs()} : action);
    if (candidate === this.quiz) return false;
    this.audio.stop(); this.quiz = candidate;
    if (action.type === 'replay') { this.elapsed = 0; this.startedAt = this.now(); }
    this.publish(); return true;
  }
  setPaused(paused: boolean) {
    if (this.closed || this.paused === paused) return;
    if (paused) { this.elapsed = this.elapsedMs(); this.paused = true; this.audio.stop(); }
    else { this.startedAt = this.now(); this.paused = false; }
    this.publish();
  }
  replay() {
    if (this.closed) return false;
    this.setPaused(false);
    return this.dispatch({type: 'replay', identity: p047InputIdentity(this.quiz)});
  }
  setAudioLanguage(language: 'en' | 'es') {
    if (this.closed || (language !== 'en' && language !== 'es') || this.audioLanguage === language) return;
    this.audio.stop(); this.audioLanguage = language; this.publish();
  }
  setVolume(volume: number) { this.audio.setVolume(volume); }
  async playAudio(assetId: string, identity: P047InputIdentity) {
    if (this.closed || this.paused || this.quiz.phase !== 'question' || !this.current(identity)) return false;
    const id = identity.questionId!;
    const allowed = [null, 'A', 'B', 'C', 'D'].some(choice => p047AudioAsset(id, this.audioLanguage, choice as null | 'A' | 'B' | 'C' | 'D').id === assetId);
    return allowed ? this.audio.toggle(assetId) : false;
  }
  stopAudio() { this.audio.stop(); }
  async close() {
    if (this.closed) return;
    this.closed = true;
    await this.audio.close(); this.publish();
  }
}
