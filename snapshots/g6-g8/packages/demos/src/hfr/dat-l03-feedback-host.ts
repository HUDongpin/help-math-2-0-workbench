import {ButtonObj, MovieClip, type Runtime, type DisplayObject} from './display';
import type {HostCall} from './types';
import type {LessonHostRequest} from '../lesson-host-contract';
import {selectHostFeedback} from '../g678-advanced-manual/host-feedback-selector';
import {datL3FeedbackBinding, datL3FeedbackReturned, type DatL3FeedbackBinding, type DatL3FeedbackBranch, type DatL3Placement} from './dat-l03-feedback-source-binding';

type Options = Readonly<{
  validatedDataSha256: string; seed: number; isCurrent: () => boolean;
  onRequest?: (request: LessonHostRequest) => void;
}>;
const owners = new WeakMap<Runtime, DatL3FeedbackHost>();
const matrix = (object: DisplayObject) => [object.m.a, object.m.b, object.m.c, object.m.d, object.m.tx, object.m.ty];
const sameMatrix = (object: DisplayObject, expected: readonly number[], feedback = false) =>
  matrix(object).every((value, index) => value === expected[index] || feedback && index === 4 && value === 100);
function requireSource(value: unknown, code: string): asserts value {if (!value) throw Error('DAT_L03_FEEDBACK_' + code);}

/** The four indexMI dependencies for this exact DAT slice. No generated action,
 * counter, main timeline, missing-receiver policy, clock or audio resource is
 * replaced. Source BtnClose and source exit actions remain the only return path. */
class DatL3FeedbackHost {
  private readonly root: MovieClip;
  private readonly data: Runtime['page'];
  private readonly previous: Runtime['hostCb'];
  private readonly callback: (call: HostCall) => void;
  private disposed = false;
  private attempts = 0;
  private lock: 'answer' | 'help' | null = null;
  private active: {clip: MovieClip; binding: DatL3FeedbackBranch} | null = null;
  private pendingReturn: {clip: MovieClip; kind: 'wrong' | 'right'; countBefore: number} | null = null;

  constructor(readonly runtime: Runtime, private readonly binding: DatL3FeedbackBinding, private readonly options: Options) {
    this.root = runtime.page_; this.data = runtime.page; this.previous = runtime.hostCb;
    this.callback = call => {
      // A retained old callback must not reach a successor's host or state.
      if (this.disposed || owners.get(runtime) !== this || runtime.hostCb !== this.callback || !options.isCurrent()) return;
      if (!this.handle(call)) this.previous?.(call);
    };
    runtime.hostCb = this.callback; owners.set(runtime, this);
  }
  current(): boolean {
    return !this.disposed && owners.get(this.runtime) === this && this.runtime.hostCb === this.callback && this.options.isCurrent() &&
      this.runtime.page === this.data && this.runtime.page_ === this.root && !this.root.removed && this.root.def === this.data.root;
  }
  private main(): MovieClip | null {
    if (!this.current() || this.root.frame !== 6 || this.root.playing) return null;
    const spec = this.binding.main, clip = this.root.children.get(spec.depth);
    return clip instanceof MovieClip && clip.name === spec.name && clip.charId === spec.characterId && clip.parentClip === this.root &&
      clip.def === this.data.dictionary[spec.characterId] && !clip.removed && clip.visible && !clip.scriptMoved &&
      clip.totalFrames === spec.frameCount && sameMatrix(clip, spec.matrix) ? clip : null;
  }
  private button(main: MovieClip, spec: DatL3Placement): ButtonObj | null {
    const button = main.children.get(spec.depth);
    return button instanceof ButtonObj && button.name === spec.name && button.charId === spec.characterId && button.parentClip === main &&
      button.def === this.data.dictionary[spec.characterId] && !button.removed && sameMatrix(button, spec.matrix) ? button : null;
  }
  private feedback(main: MovieClip, spec: DatL3FeedbackBranch): MovieClip | null {
    const clip = main.children.get(spec.depth);
    return clip instanceof MovieClip && clip.name === spec.name && clip.charId === spec.characterId && clip.parentClip === main &&
      clip.def === this.data.dictionary[spec.characterId] && !clip.removed && clip.totalFrames === spec.frameCount &&
      sameMatrix(clip, spec.matrix, true) ? clip : null;
  }
  private help(main: MovieClip): MovieClip | null {
    const spec = this.binding.helpPopup, clip = main.children.get(spec.depth);
    return clip instanceof MovieClip && clip.name === spec.name && clip.charId === spec.characterId && clip.parentClip === main &&
      clip.def === this.data.dictionary[spec.characterId] && !clip.removed && sameMatrix(clip, spec.matrix) ? clip : null;
  }
  private question(main: MovieClip): boolean {
    return main.frame === this.binding.main.questionFrame && !main.playing && this.runtime.Global.get('quizSection') === true;
  }
  private count(): number {
    const count = this.runtime.Global.get('quizTryCount');
    requireSource(count === 0 || count === 1, 'AUTHORED_TRY_COUNT'); return count;
  }
  private availability(main: MovieClip, enabled: boolean): void {
    const answers = this.binding.answers.map(spec => this.button(main, spec)), nmh = this.button(main, this.binding.nmh);
    requireSource(answers.every(Boolean) && nmh, 'CURRENT_SOURCE_ANSWERS_AND_NMH');
    for (const answer of answers) {answer!.set('enabled', enabled); answer!.set('_visible', enabled);}
    nmh.set('enabled', enabled);
  }
  private handle(call: HostCall): boolean {
    if (!['shell.disableQuizButton', 'shell.enableQuizButton', 'shell.showWrongFeed', 'shell.showRightFeed'].includes(call.kind)) return false;
    const main = this.main();
    // A different source/main identity keeps its original host route.
    if (!main) return false;
    requireSource(call.tick === this.runtime.tickCount && call.args.length === 0 && this.question(main), 'SOURCE_HOST_CONTEXT');
    if (call.kind === 'shell.disableQuizButton') {
      if (this.active) {
        requireSource(this.active.binding.kind === 'right' && this.feedback(main, this.active.binding) === this.active.clip &&
          this.active.clip.frame === this.active.binding.frameCount, 'SOURCE_RIGHT_EXIT');
        this.availability(main, false);
        this.pendingReturn = {clip: this.active.clip, kind: 'right', countBefore: this.count()}; this.active = null;
      } else {
        requireSource(!this.lock && !this.pendingReturn && this.binding.answers.every(spec => {
          const answer = this.button(main, spec); return answer && this.runtime.isClickable(answer);
        }), 'SOURCE_QUESTION_UNLOCKED');
        const nmh = this.button(main, this.binding.nmh); requireSource(nmh, 'CURRENT_NMH');
        // The exact NMH release disables itself before this call; answers do it
        // after showRight/WrongFeed. This preserves the existing source popup.
        this.lock = nmh.get('enabled') === false ? 'help' : 'answer';
        this.availability(main, false);
      }
    } else if (call.kind === 'shell.enableQuizButton') {
      if (this.active) {
        requireSource(this.active.binding.kind === 'wrong' && this.feedback(main, this.active.binding) === this.active.clip &&
          this.active.clip.frame === this.active.binding.frameCount, 'SOURCE_WRONG_EXIT');
        this.availability(main, true);
        this.pendingReturn = {clip: this.active.clip, kind: 'wrong', countBefore: this.count()}; this.active = null;
      } else {
        const help = this.help(main);
        requireSource(this.lock === 'help' && !this.pendingReturn && help && !help.visible, 'SOURCE_HELP_CLOSE');
        this.availability(main, true); this.lock = null;
      }
    } else {
      requireSource(this.lock === 'answer' && !this.active && !this.pendingReturn && this.binding.answers.every(spec => {
        const answer = this.button(main, spec); return answer && !answer.visible && answer.get('enabled') === false;
      }), 'SOURCE_ANSWER_LOCK_BEFORE_FEEDBACK');
      const kind = call.kind === 'shell.showWrongFeed' ? 'wrong' : 'right';
      // Existing deterministic capture selection preserves the inspected branch
      // set only; it does not claim Adobe RNG state or alter quizTryCount.
      const selected = selectHostFeedback(kind, (this.options.seed + this.attempts) >>> 0);
      const spec = this.binding.feedback.find(row => row.kind === kind && row.name === selected.instanceName);
      requireSource(spec && selected.cardinality === (kind === 'wrong' ? 3 : 4), 'SOURCE_BRANCH_SET');
      const clip = this.feedback(main, spec); requireSource(clip && clip.frame === 1 && !clip.playing, 'CURRENT_SOURCE_FEEDBACK');
      this.count(); this.active = {clip, binding: spec}; this.lock = null; this.attempts++;
      clip.set('_visible', true); clip.gotoCmd(2, true); clip.set('_x', 5);
      this.runtime.callMethod(this.runtime.Global.get('gSound'), 'setVolume', [this.runtime.Global.get('VolLevel')], null);
      this.options.onRequest?.({type: 'record-practice-feedback', interactionId: this.binding.animationId,
        outcome: kind === 'wrong' ? 'incorrect' : 'correct', branchIndex: selected.branchIndex, branchCount: selected.cardinality});
    }
    return true;
  }
  /** Called by the existing completed-source-tick hook, never a timer. The
   * enable/disable callback happens before the rest of its source exit script. */
  afterSourceUpdate(): void {
    const main = this.main(), returned = this.pendingReturn;
    if (!main || !returned || this.runtime.queue.length) return;
    requireSource(!returned.clip.removed && returned.clip.parentClip === main && this.runtime.allObjects().includes(returned.clip), 'CURRENT_SOURCE_RETURN');
    requireSource(datL3FeedbackReturned({kind: returned.kind, countBefore: returned.countBefore,
      countAfter: this.runtime.Global.get('quizTryCount'), questionFrame: this.binding.main.questionFrame,
      mainFrame: main.frame, mainPlaying: main.playing, quizSection: this.runtime.Global.get('quizSection'),
      feedbackFrame: returned.clip.frame, feedbackPlaying: returned.clip.playing, pendingSourceActions: this.runtime.queue.length}), 'AUTHORED_FEEDBACK_RETURN');
    this.pendingReturn = null;
    this.options.onRequest?.({type: 'reset-practice-feedback', interactionId: this.binding.animationId});
  }
  dispose(): void {
    if (this.disposed) return; this.disposed = true; this.active = null; this.pendingReturn = null; this.lock = null;
    if (this.runtime.hostCb === this.callback) this.runtime.hostCb = this.previous;
    if (owners.get(this.runtime) === this) owners.delete(this.runtime);
    // No globals, page objects, timers, listeners or media are owned here.
  }
}

/** No installation on an unsupported page or a source/data/main mismatch. */
export function createDatL3FeedbackHost(runtime: Runtime, options: Options): DatL3FeedbackHost | null {
  const data = runtime.page, binding = datL3FeedbackBinding(data.placement.animationId, data.source.sha256, options.validatedDataSha256);
  if (!binding || data.source.bytes !== binding.sourceBytes || data.source.swfVersion !== 6 ||
      !Number.isSafeInteger(options.seed) || options.seed < 0 || options.seed > 0xffffffff || !options.isCurrent() ||
      data.stage.width !== 800 || data.stage.height !== 600 || data.stage.fps !== 12 ||
      data.root.frameCount !== 10 || data.root.labels.begin !== 6 || !(runtime.page_ instanceof MovieClip) ||
      runtime.page_.def !== data.root || runtime.page_.removed) return null;
  const placement = data.root.frames[5].find(tag => tag.op === 'place' && tag.name === 'animation');
  if (!placement || placement.charId !== binding.main.characterId || placement.depth !== binding.main.depth ||
      JSON.stringify(placement.m) !== JSON.stringify(binding.main.matrix) ||
      data.dictionary[binding.main.characterId]?.frameCount !== binding.main.frameCount) return null;
  const priorMain = runtime.allObjects().find(object => object instanceof MovieClip && object.charId === binding.main.characterId);
  if (priorMain instanceof MovieClip && priorMain.frame >= binding.main.questionFrame) return null;
  const prior = owners.get(runtime); if (prior?.current()) return null; prior?.dispose();
  return new DatL3FeedbackHost(runtime, binding, options);
}
