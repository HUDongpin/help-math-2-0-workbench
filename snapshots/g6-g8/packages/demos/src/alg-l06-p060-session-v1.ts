import type {TechnicalOwner} from './technical-observation-v1';
import {P060AudioV1, type P060AudioDependencies, type P060AudioSnapshot} from './alg-l06-p060-audio-v1';
import {p060AudioAsset, type P060Choice} from './alg-l06-p060-source-v1';
import {p060Initial, p060Identity, p060Matches, p060Reduce, type P060Action, type P060Identity, type P060State} from './alg-l06-p060-state-v1';
export interface P060SessionSnapshot {
  readonly quiz: P060State;
  readonly audio: P060AudioSnapshot;
  readonly language: 'en' | 'es';
  readonly paused: boolean;
  readonly closed: boolean;
}
export interface P060SessionDependencies {
  readonly readAudio: P060AudioDependencies['read'];
  readonly changed: (snapshot: P060SessionSnapshot) => void;
  readonly now?: () => number;
  readonly context?: () => AudioContext;
  readonly technicalOwner?: () => TechnicalOwner|null;
}
export class P060SessionV1 {
  private quiz: P060State;
  private audio: P060AudioV1;
  private paused = false;
  private closed = false;
  private elapsed = 0;
  private anchor: number;
  private now: () => number;
  constructor(seed: number, private language: 'en' | 'es', private readonly deps: P060SessionDependencies) {
    this.quiz = p060Initial(seed); this.now = deps.now ?? (() => performance.now()); this.anchor = this.now();
    this.audio = new P060AudioV1({read: deps.readAudio, context: deps.context, technicalOwner: deps.technicalOwner, changed: () => this.publish()});
  }
  snapshot(): P060SessionSnapshot {return Object.freeze({quiz: this.quiz, audio: this.audio.snapshot(), language: this.language, paused: this.paused, closed: this.closed});}
  private publish() {this.deps.changed(this.snapshot());}
  elapsedMs() {return this.quiz.finishedElapsedMs ?? this.elapsed + (this.paused || this.closed ? 0 : Math.max(0, this.now() - this.anchor));}
  dispatch(action: P060Action) {
    if (this.closed || this.paused) return false;
    const next = p060Reduce(this.quiz, action.type === 'answer' ? {...action, elapsedMs: this.elapsedMs()} : action);
    if (next === this.quiz) return false;
    this.quiz = next;
    if (action.type === 'replay') {this.elapsed = 0; this.anchor = this.now();}
    this.audio.stop();
    this.publish(); return true;
  }
  replay() {if (this.closed) return false; this.setPaused(false); return this.dispatch({type: 'replay', identity: p060Identity(this.quiz)});}
  setPaused(value: boolean) {
    if (this.closed || this.paused === value) return;
    if (value) {this.elapsed = this.elapsedMs(); this.paused = true; this.audio.stop();}
    else {this.anchor = this.now(); this.paused = false;}
    this.publish();
  }
  setLanguage(value: 'en' | 'es') {
    if (this.closed || !['en','es'].includes(value) || value === this.language) return;
    this.language = value; this.audio.stop(); this.publish();
  }
  setVolume(value: number) {return this.audio.setVolume(value);}
  stopAudio() {this.audio.stop();}
  async playAudio(choice: P060Choice | null, identity: P060Identity) {
    if (this.closed || this.paused || this.quiz.phase !== 'question' || !p060Matches(this.quiz, identity) || identity.questionId === null) return false;
    if (choice !== null && !['A','B','C','D'].includes(choice)) return false;
    return this.audio.toggle(p060AudioAsset(identity.questionId, this.language, choice));
  }
  async close() {
    if (this.closed) return;
    this.elapsed = this.elapsedMs(); this.closed = true; await this.audio.close(); this.publish();
  }
}
