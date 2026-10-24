import {ButtonObj, MovieClip, Runtime, type DisplayObject} from './display';
import type {HostCall} from './types';
import type {LessonHostRequest} from '../lesson-host-contract';
import {selectHostFeedback, type HostFeedbackSelection} from '../g678-advanced-manual/host-feedback-selector';
import {P019} from './nms-l11-p019-source-binding';

type Choice = typeof P019.choices[number];
type Branch = typeof P019.feedback[number];
type Glossary = typeof P019.glossary[number];
type Options = Readonly<{validatedDataSha256: string; seed: number; onRequest?: (request: LessonHostRequest) => void}>;
export type P019AnswerIntent = Readonly<{kind: 'answer'; epoch: number; sourceName: string; button: ButtonObj}>;
export type P019CloseIntent = Readonly<{kind: 'wrong-close'; epoch: number; feedback: MovieClip; popup: MovieClip; button: ButtonObj}>;
export type P019GlossaryIntent = Readonly<{kind: 'question-glossary'; epoch: number; instanceId: string; button: ButtonObj}>;
const owners = new WeakMap<Runtime, P019PracticeHost>();
function requireSource(value: unknown, code: string): asserts value {if (!value) throw Error('P019_' + code);}
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const matrix = (object: DisplayObject) => [object.m.a, object.m.b, object.m.c, object.m.d, object.m.tx, object.m.ty];

/** P019's source-owned quiz counter and continuation remain in generated actions.
 * This adapter supplies the four inspected IndexMI callbacks. It observes the
 * completed source queue, without adding clocks, counter writes or frame stops.
 * Question glossary intents are instance-specific; pre-question native text and
 * mask projection are a separate integration step, not certified by this model. */
export class P019PracticeHost {
  private readonly root: MovieClip;
  private readonly previous: Runtime['hostCb'];
  private readonly callback: (call: HostCall) => void;
  private readonly issued = new WeakSet<object>();
  private readonly consumed = new WeakSet<object>();
  private disposed = false;
  private epoch = 0;
  private attempts = 0;
  private cycleResolved = false;
  private correctCycles = 0;
  private exhaustedCycles = 0;
  private retries = 0;
  private pendingAnswer = false;
  private questionAnchor: ButtonObj | null = null;
  private active: {clip: MovieClip; binding: Branch; selection: HostFeedbackSelection} | null = null;
  private pendingReturn: {kind: 'right' | 'wrong'; clip: MovieClip; countBefore: number} | null = null;
  private pendingGlossary: {intent: P019GlossaryIntent; binding: Glossary; tick: number; request: LessonHostRequest | null} | null = null;
  readonly handledCalls: HostCall[] = [];
  readonly feedbackSelections: HostFeedbackSelection[] = [];

  constructor(readonly runtime: Runtime, private readonly options: Options) {
    const data = runtime.page;
    requireSource(!owners.has(runtime), 'RUNTIME_ALREADY_OWNED');
    requireSource(options.validatedDataSha256 === P019.data.sha256 && data.placement.animationId === P019.animationId &&
      data.source.sha256 === P019.source.sha256 && data.source.bytes === P019.source.bytes && data.source.swfVersion === 6, 'SOURCE_BINDING');
    requireSource(Number.isSafeInteger(options.seed) && options.seed >= 0 && options.seed <= 0xffffffff, 'CAPTURE_SEED');
    requireSource(data.stage.width === 800 && data.stage.height === 600 && data.stage.fps === 12 && data.root.frameCount === 10 && data.root.labels.begin === 6, 'ROOT_DOMAIN');
    requireSource(data.dictionary[245]?.kind === 'sprite' && data.dictionary[245].frameCount === 139, 'MAIN_DOMAIN');
    requireSource(equal(data.root.frames[5], P019.sourceFrames.root6) && [1,10,97,98,117,139].every(frame =>
      equal(data.dictionary[245].frames[frame - 1], P019.sourceFrames[('main' + frame) as keyof typeof P019.sourceFrames])), 'SOURCE_ACTION_AND_PLACEMENT_TAGS');
    requireSource(Object.entries(P019.sourceDictionary).every(([key, value]) => equal(data.dictionary[key], value)), 'SOURCE_CONTROLS_AND_POPUPS');
    requireSource(runtime.page_ instanceof MovieClip && runtime.page_.def === data.root && !runtime.page_.removed, 'LOADED_PAGE_REQUIRED');
    const priorMain = runtime.allObjects().find(object => object instanceof MovieClip && object.charId === 245) as MovieClip | undefined;
    requireSource(!priorMain || priorMain.frame < 97, 'FRESH_PREQUESTION_SESSION_REQUIRED');
    this.root = runtime.page_; this.previous = runtime.hostCb;
    this.callback = call => {if (!this.handle(call)) this.previous?.(call);};
    runtime.hostCb = this.callback; owners.set(runtime, this);
  }
  private current(): boolean {
    return !this.disposed && owners.get(this.runtime) === this && this.runtime.hostCb === this.callback &&
      this.runtime.page_ === this.root && !this.root.removed && this.root.def === this.runtime.page.root;
  }
  private main(): MovieClip | null {
    if (!this.current() || this.root.frame !== 6 || this.root.playing) return null;
    const clip = this.root.children.get(3);
    return clip instanceof MovieClip && clip.name === 'animation' && clip.charId === 245 && clip.def === this.runtime.page.dictionary[245] &&
      clip.parentClip === this.root && !clip.removed && clip.visible && !clip.scriptMoved && equal(matrix(clip), P019.main.placement.m) ? clip : null;
  }
  private answer(main: MovieClip, spec: Choice): ButtonObj | null {
    const button = main.children.get(spec.depth);
    return button instanceof ButtonObj && button.charId === spec.buttonCharacterId && button.name === spec.name &&
      button.def === this.runtime.page.dictionary[spec.buttonCharacterId] && button.parentClip === main && !button.removed &&
      equal(matrix(button), spec.sourcePlacement.m) ? button : null;
  }
  private branch(main: MovieClip, spec: Branch): MovieClip | null {
    const clip = main.children.get(spec.sourcePlacement.depth), source = spec.sourcePlacement.m;
    return clip instanceof MovieClip && clip.charId === spec.characterId && clip.name === spec.name &&
      clip.def === this.runtime.page.dictionary[spec.characterId] && clip.parentClip === main && !clip.removed &&
      clip.totalFrames === spec.totalFrames && matrix(clip).every((value, index) => index === 4 ? value === source[4] || value === 100 : value === source[index]) ? clip : null;
  }
  private question(main: MovieClip): boolean {return main.frame === 97 && !main.playing && this.runtime.Global.get('quizSection') === true && !this.cycleResolved;}
  private availability(main: MovieClip, enabled: boolean): void {
    const buttons = P019.choices.map(choice => this.answer(main, choice)); requireSource(buttons.every(Boolean), 'EXACT_THREE_SOURCE_ANSWERS');
    for (const button of buttons) {button!.set('enabled', enabled); button!.set('_visible', enabled);}
    // The inspected host also addresses AnsBtn4..25 and NMHBtn. These names are
    // absent in P019; AVM1 missing-member writes are inert. Do not invent them.
  }
  afterSourceUpdate(): void {
    const main = this.main(); if (!main || this.runtime.queue.length) return;
    if (this.pendingReturn) {
      const returned = this.pendingReturn;
      requireSource(returned.clip.frame === 1 && !returned.clip.playing, 'AUTHORED_FEEDBACK_RESET');
      const count = this.runtime.Global.get('quizTryCount');
      const continued = this.runtime.Global.get('quizSection') === false && ((main.frame === 97 && main.playing) || main.frame > 97);
      if (returned.kind === 'right') {
        requireSource(continued && this.runtime.toNum(count) === returned.countBefore, 'AUTHORED_CORRECT_CONTINUATION');
        this.correctCycles++; this.cycleResolved = true;
      } else if (returned.countBefore + 1 >= 2) {
        requireSource(continued && count === 0, 'AUTHORED_TWO_WRONG_CONTINUATION');
        this.exhaustedCycles++; this.cycleResolved = true;
      } else {
        requireSource(this.question(main) && count === returned.countBefore + 1, 'AUTHORED_WRONG_RETRY');
        this.retries++;
      }
      this.pendingReturn = null;
    }
    if (this.cycleResolved && main.looped && main.frame === 97 && !main.playing && this.runtime.Global.get('quizSection') === true &&
        this.questionAnchor && this.answer(main, P019.choices[0]) !== this.questionAnchor) {
      this.cycleResolved = false; this.questionAnchor = null; this.epoch++;
    }
  }
  private handle(call: HostCall): boolean {
    if (!this.current()) return false;
    if (call.kind === 'shell.DoHyperLinks' && this.pendingGlossary) {
      const pending = this.pendingGlossary;
      requireSource(call.tick === pending.tick && call.args.length === 0 && this.validGlossary(pending.intent) &&
        this.runtime.Global.get('KeyAttribute') === pending.binding.key && !pending.request, 'SOURCE_GLOSSARY_RELEASE');
      pending.request = Object.freeze({type: 'open-glossary', entryId: pending.binding.entryId,
        sourceAnimationId: P019.animationId, playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume'});
      this.handledCalls.push(call); return true;
    }
    if (!['shell.disableQuizButton','shell.enableQuizButton','shell.showWrongFeed','shell.showRightFeed'].includes(call.kind)) return false;
    const main = this.main(); requireSource(main && call.tick === this.runtime.tickCount && call.args.length === 0, 'SOURCE_HOST_CONTEXT');
    if (call.kind === 'shell.disableQuizButton') {
      if (this.active) {
        requireSource(this.active.binding.kind === 'right' && this.branch(main, this.active.binding) === this.active.clip &&
          this.active.clip.frame === this.active.binding.sourceTerminalFrame && this.question(main), 'RIGHT_SOURCE_COMPLETION_ONLY');
        this.availability(main, false);
        this.pendingReturn = {kind: 'right', clip: this.active.clip, countBefore: this.runtime.toNum(this.runtime.Global.get('quizTryCount'))};
        this.active = null; this.epoch++;
      } else {
        requireSource(this.question(main) && !this.pendingAnswer && !this.pendingReturn && P019.choices.every(choice => {
          const button = this.answer(main, choice); return button && this.runtime.isClickable(button);
        }), 'UNLOCKED_SOURCE_QUESTION');
        this.questionAnchor = this.answer(main, P019.choices[0]); this.availability(main, false); this.pendingAnswer = true; this.epoch++;
      }
    } else if (call.kind === 'shell.enableQuizButton') {
      requireSource(this.active?.binding.kind === 'wrong' && this.branch(main, this.active.binding) === this.active.clip &&
        this.active.clip.frame === this.active.binding.sourceTerminalFrame && this.question(main), 'WRONG_SOURCE_COMPLETION_ONLY');
      this.availability(main, true);
      this.pendingReturn = {kind: 'wrong', clip: this.active.clip, countBefore: this.runtime.toNum(this.runtime.Global.get('quizTryCount'))};
      this.active = null; this.epoch++;
    } else {
      requireSource(this.pendingAnswer && !this.active && this.question(main) && P019.choices.every(choice => {
        const button = this.answer(main, choice); return button && !button.visible && !this.runtime.toBool(button.get('enabled'));
      }), 'ANSWER_LOCK_BEFORE_FEEDBACK');
      const kind = call.kind === 'shell.showRightFeed' ? 'right' : 'wrong';
      const selected = selectHostFeedback(kind, (this.options.seed + this.attempts) >>> 0);
      const binding = P019.feedback.find(branch => branch.name === selected.instanceName);
      requireSource(binding?.selectedByInspectedHostBranchSet && binding.kind === kind, 'SOURCE_REACHABLE_FEEDBACK_BRANCH');
      const clip = this.branch(main, binding); requireSource(clip && clip.frame === 1 && !clip.playing, 'SOURCE_FEEDBACK_ENTRY');
      this.pendingAnswer = false; this.active = {clip, binding, selection: selected}; this.attempts++; this.feedbackSelections.push(selected);
      clip.set('_visible', true); clip.gotoCmd(2, true); clip.set('_x', 5);
      this.runtime.callMethod(this.runtime.Global.get('gSound'), 'setVolume', [this.runtime.Global.get('VolLevel')], null);
      this.options.onRequest?.(Object.freeze({type: 'record-practice-feedback', interactionId: P019.animationId,
        outcome: kind === 'right' ? 'correct' : 'incorrect', branchIndex: selected.branchIndex, branchCount: selected.cardinality}));
    }
    this.handledCalls.push(call); return true;
  }
  choices(): readonly P019AnswerIntent[] {
    this.afterSourceUpdate(); const main = this.main(); if (!main || !this.question(main) || this.active || this.pendingAnswer || this.pendingReturn) return [];
    return P019.choices.flatMap(choice => {const button = this.answer(main, choice); if (!button || !this.runtime.isClickable(button)) return [];
      const intent = Object.freeze({kind: 'answer' as const, epoch: this.epoch, sourceName: choice.name, button}); this.issued.add(intent); return [intent];});
  }
  choose(intent: P019AnswerIntent): boolean {
    this.afterSourceUpdate(); const main = this.main(), choice = P019.choices.find(value => value.name === intent.sourceName);
    if (!main || !this.issued.has(intent) || this.consumed.has(intent) || intent.epoch !== this.epoch || !choice || this.answer(main, choice) !== intent.button ||
        !this.question(main) || this.active || this.pendingAnswer || this.pendingReturn || !this.runtime.isClickable(intent.button)) return false;
    this.consumed.add(intent); this.runtime.click(intent.button); this.afterSourceUpdate(); return true;
  }
  private popup() {
    const main = this.main(), active = this.active;
    if (!main || !active || active.binding.kind !== 'wrong' || this.branch(main, active.binding) !== active.clip ||
        active.clip.frame !== 22 || active.clip.playing || main.frame !== 97) return null;
    const spec = active.binding.popupPlacementAt22; if (!spec) return null;
    const popup = active.clip.children.get(spec.depth);
    if (!(popup instanceof MovieClip) || popup.charId !== 203 || popup.name !== 'Mc_Feed_Popup' || popup.def !== this.runtime.page.dictionary[203] ||
        popup.parentClip !== active.clip || popup.removed || !popup.ancestorsVisible() || !equal(matrix(popup), spec.m) || !equal(popup.cx, spec.cx)) return null;
    const button = popup.children.get(1), first = popup.children.get(11), second = popup.children.get(16);
    if (!(button instanceof ButtonObj) || button.charId !== 192 || button.name !== 'BtnClose' || button.parentClip !== popup || button.def !== this.runtime.page.dictionary[192] ||
        !(first instanceof MovieClip) || first.charId !== 199 || !(second instanceof MovieClip) || second.charId !== 202 ||
        first.parentClip !== popup || second.parentClip !== popup || !this.runtime.isClickable(button)) return null;
    const secondHint = this.runtime.Global.get('quizTryCount') === 1;
    if (first.visible !== !secondHint || second.visible !== secondHint) return null;
    return {feedback: active.clip, popup, button, hint: secondHint ? 'second-attempt' as const : 'first-attempt' as const};
  }
  feedback() {
    const value = this.popup(); if (!value) return null;
    const close = Object.freeze({kind: 'wrong-close' as const, epoch: this.epoch, feedback: value.feedback, popup: value.popup, button: value.button}); this.issued.add(close);
    return Object.freeze({hint: value.hint, sourceStaticTextSprite: value.hint === 'second-attempt' ? 202 : 199, close});
  }
  closeWrong(intent: P019CloseIntent): boolean {
    const value = this.popup(); if (!value || !this.issued.has(intent) || this.consumed.has(intent) || intent.epoch !== this.epoch ||
      intent.feedback !== value.feedback || intent.popup !== value.popup || intent.button !== value.button) return false;
    this.consumed.add(intent); this.runtime.click(value.button); this.afterSourceUpdate(); return true;
  }
  private glossaryButton(binding: Glossary): ButtonObj | null {
    const main = this.main(); if (!main || !this.question(main) || this.active || this.pendingAnswer) return null;
    const spec = binding.sourcePlacementAt97, button = main.children.get(spec.depth);
    return button instanceof ButtonObj && button.charId === binding.characterId && button.parentClip === main &&
      button.def === this.runtime.page.dictionary[binding.characterId] && !button.removed && equal(matrix(button), spec.m) &&
      equal(button.cx, 'cx' in spec ? spec.cx : [256,256,256,256,0,0,0,0]) && this.runtime.isClickable(button) ? button : null;
  }
  glossaryLinks(): readonly P019GlossaryIntent[] {
    this.afterSourceUpdate(); return P019.glossary.flatMap(binding => {const button = this.glossaryButton(binding); if (!button) return [];
      const intent = Object.freeze({kind: 'question-glossary' as const, epoch: this.epoch, instanceId: binding.instanceId, button}); this.issued.add(intent); return [intent];});
  }
  private validGlossary(intent: P019GlossaryIntent): boolean {
    const binding = P019.glossary.find(spec => spec.instanceId === intent.instanceId);
    return Boolean(binding && this.issued.has(intent) && intent.epoch === this.epoch && this.glossaryButton(binding) === intent.button);
  }
  releaseGlossary(intent: P019GlossaryIntent): LessonHostRequest | null {
    if (this.pendingGlossary || this.consumed.has(intent) || !this.validGlossary(intent)) return null;
    const binding = P019.glossary.find(spec => spec.instanceId === intent.instanceId)!;
    this.consumed.add(intent); const pending = {intent, binding, tick: this.runtime.tickCount, request: null as LessonHostRequest | null}; this.pendingGlossary = pending;
    try {this.runtime.click(intent.button); requireSource(pending.request && this.main()?.playing === false, 'SOURCE_GLOSSARY_MUST_STOP_MAIN');
      this.options.onRequest?.(pending.request); return pending.request;
    } finally {this.pendingGlossary = null;}
  }
  mayResumeMainSource(): boolean {const main = this.main(); return Boolean(main && !main.playing && !this.active && !this.pendingAnswer && !this.pendingReturn && main.frame !== 97);}
  snapshot() {
    this.afterSourceUpdate(); const main = this.main(), active = this.active;
    return Object.freeze({current: this.current(), epoch: this.epoch, mainFrame: main?.frame ?? null, mainPlaying: main?.playing ?? false,
      attempts: this.attempts, cycleResolved: this.cycleResolved, correctCycles: this.correctCycles, exhaustedCycles: this.exhaustedCycles, retries: this.retries,
      quizTryCount: this.runtime.Global.get('quizTryCount') ?? null, quizSection: this.runtime.Global.get('quizSection') ?? null,
      sourceActivityExited: this.correctCycles + this.exhaustedCycles > 0, answeredCorrectly: this.correctCycles > 0, terminalStopClaim: false,
      answerLocked: !main || !this.question(main) || Boolean(active) || this.pendingAnswer || Boolean(this.pendingReturn),
      feedback: active ? {kind: active.binding.kind, sourceName: active.binding.name, sourceCharacterId: active.clip.charId,
        frame: active.clip.frame, playing: active.clip.playing, branchIndex: active.selection.branchIndex, branchCount: active.selection.cardinality} : null,
      authoritativeAdobeRandomStateAccepted: false});
  }
  dispose(): void {
    if (this.disposed) return; this.disposed = true; this.epoch++; this.active = null; this.pendingAnswer = false;
    this.pendingReturn = null; this.pendingGlossary = null; this.questionAnchor = null;
    if (this.runtime.hostCb === this.callback) this.runtime.hostCb = this.previous;
    if (owners.get(this.runtime) === this) owners.delete(this.runtime);
  }
}
