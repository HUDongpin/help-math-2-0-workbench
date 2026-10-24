import {ASFunction} from './avm';
import {ButtonObj, MovieClip, TextFieldObj, Runtime, type DisplayObject} from './display';
import type {HostCall} from './types';
import type {LessonHostRequest} from '../lesson-host-contract';
import {selectHostFeedback, type HostFeedbackSelection} from '../g678-advanced-manual/host-feedback-selector';
import {P010} from './nms-l11-p010-source-binding';

type Choice = typeof P010.choices[number];
type Branch = typeof P010.feedback[number];
type LinkKey = typeof P010.feedbackLinkKeys[number];
type PromptBinding = typeof P010.questionGlossary[number];
export type P010ChoiceIntent = Readonly<{kind: 'answer'; epoch: number; sourceName: Choice['name']; button: ButtonObj}>;
export type P010CloseIntent = Readonly<{kind: 'wrong-close'; epoch: number; feedback: MovieClip; popup: MovieClip; button: ButtonObj}>;
export type P010LinkIntent = Readonly<{kind: 'feedback-html-link'; epoch: number; feedback: MovieClip; popup: MovieClip;
  text: TextFieldObj; sourceFunction: ASFunction; sourceKey: LinkKey; entryId: string; sourceActionSha256: string}>;
export type P010FeedbackLinkIntent = P010LinkIntent;
export type P010PromptIntent = Readonly<{kind: 'prompt-glossary'; epoch: number; button: ButtonObj; sourceKey: PromptBinding['key']; entryId: string}>;
export type P010FeedbackToken = Readonly<{kind: 'text'; text: string}> |
  Readonly<{kind: 'link'; text: string; sourceKey: LinkKey; entryId: string; sourceActionSha256: string}>;
export type P010WrongRetryStamp = Readonly<{ordinal:number;sourceName:string;sourceCharacterId:number;frame:number;tick:number;epoch:number}>;
type Options = Readonly<{validatedDataSha256: string; seed: number; onRequest?: (request: LessonHostRequest) => void}>;
const owners = new WeakMap<Runtime, P010PracticeHost>();
function requireSource(value: unknown, code: string): asserts value {if (!value) throw Error('P010_' + code);}
const matrix = (object: DisplayObject) => [object.m.a, object.m.b, object.m.c, object.m.d, object.m.tx, object.m.ty];
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function sourceTokens(): readonly P010FeedbackToken[] {
  const pattern = /<A HREF='asfunction:DoHyperLinksTemp,([^']+)'><FONT COLOR='#0000CC'><U><B>([^<]+)<\/B><\/U><\/FONT><\/A>/g;
  const tokens: P010FeedbackToken[] = [], keys: string[] = []; let end = 0;
  for (const match of P010.html.matchAll(pattern)) {
    requireSource(match.index !== undefined, 'LINK_INDEX');
    if (match.index > end) tokens.push(Object.freeze({kind: 'text', text: P010.html.slice(end, match.index)}));
    const key = match[1] as LinkKey; requireSource(P010.feedbackLinkKeys.includes(key), 'LINK_KEY'); keys.push(key);
    tokens.push(Object.freeze({kind: 'link', text: match[2], sourceKey: key, entryId: P010.entries[key], sourceActionSha256: P010.feedbackScriptSha256}));
    end = match.index + match[0].length;
  }
  if (end < P010.html.length) tokens.push(Object.freeze({kind: 'text', text: P010.html.slice(end)}));
  requireSource(equal(keys, P010.feedbackLinkKeys) && tokens.filter(token => token.kind === 'text').every(token => !/[<>]/.test(token.text)), 'EXACT_SOURCE_HTML');
  return Object.freeze(tokens);
}
export const P010_FEEDBACK_TOKENS = sourceTokens();

/** Isolated P010 specialization of the reviewed P009 practice-host mechanism.
 * No clock, decoder, frame-script replacement, artificial terminal Stop or shim.
 * Call afterSourceUpdate() from the owning player's existing onTick/redraw, and
 * construct/dispose one adapter for each actual LessonRuntime lease. */
export class P010PracticeHost {
  private readonly root: MovieClip;
  private readonly previous: Runtime['hostCb'];
  private readonly callback: (call: HostCall) => void;
  private readonly issued = new WeakSet<object>();
  private readonly consumed = new WeakSet<object>();
  private disposed = false;
  private epoch = 0;
  private attempts = 0;
  private cycleSolved = false;
  private completedActivities = 0;
  private pendingAnswer = false;
  private wrongRetryOrdinal = 0;
  private lastWrongRetry: P010WrongRetryStamp | null = null;
  private questionAnchor: ButtonObj | null = null;
  private pendingCorrect: {clip: MovieClip; binding: Branch; tick: number} | null = null;
  private active: {clip: MovieClip; binding: Branch; selection: HostFeedbackSelection} | null = null;
  private pendingLink: {intent: P010LinkIntent | P010PromptIntent; tick: number; request: LessonHostRequest | null} | null = null;
  readonly handledCalls: HostCall[] = [];
  readonly feedbackSelections: HostFeedbackSelection[] = [];

  constructor(readonly runtime: Runtime, private readonly options: Options) {
    const data = runtime.page;
    requireSource(!owners.has(runtime), 'RUNTIME_ALREADY_OWNED');
    requireSource(options.validatedDataSha256 === P010.data.sha256 && data.placement.animationId === P010.animationId &&
      data.source.sha256 === P010.source.sha256 && data.source.bytes === P010.source.bytes, 'SOURCE_BINDING');
    requireSource(Number.isSafeInteger(options.seed) && options.seed >= 0 && options.seed <= 0xffffffff, 'CAPTURE_SEED');
    requireSource(data.stage.width === 800 && data.stage.height === 600 && data.stage.fps === 12 && data.root.frameCount === 10 && data.root.labels.begin === 6, 'ROOT_DOMAIN');
    requireSource(data.dictionary[204]?.kind === 'sprite' && data.dictionary[204].frameCount === 83 && data.dictionary[46]?.frameCount === 1, 'SOURCE_TIMELINES');
    requireSource(equal(data.root.frames[5], P010.sourceFrames.root6) && equal(data.dictionary[204].frames[0], P010.sourceFrames.main1) &&
      equal(data.dictionary[204].frames[46], P010.sourceFrames.main47) && equal(data.dictionary[204].frames[47], P010.sourceFrames.main48) &&
      equal(data.dictionary[204].frames[82], P010.sourceFrames.main83) && equal(data.dictionary[46].frames[0], P010.sourceFrames.popup1), 'SOURCE_ACTION_AND_PLACEMENT_TAGS');
    requireSource(Object.entries(P010.sourceDictionary).every(([key, value]) => equal(data.dictionary[Number(key)], value)), 'SOURCE_CONTROLS_AND_POPUP');
    requireSource(runtime.page_ instanceof MovieClip && runtime.page_.def === data.root && !runtime.page_.removed, 'LOADED_PAGE_REQUIRED');
    const priorMain = runtime.allObjects().find(object => object instanceof MovieClip && object.charId === 204) as MovieClip | undefined;
    requireSource(!priorMain || priorMain.frame < 47, 'FRESH_PREQUESTION_SESSION_REQUIRED');
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
    const clip = this.root.children.get(4);
    return clip instanceof MovieClip && clip.name === 'animation' && clip.charId === 204 && clip.def === this.runtime.page.dictionary[204] &&
      clip.parentClip === this.root && !clip.removed && clip.visible && !clip.scriptMoved && equal(matrix(clip), P010.main.placement.m) ? clip : null;
  }
  private answer(main: MovieClip, choice: Choice): ButtonObj | null {
    const button = main.children.get(choice.depth);
    return button instanceof ButtonObj && button.charId === choice.buttonCharacterId && button.name === choice.name &&
      button.def === this.runtime.page.dictionary[choice.buttonCharacterId] && button.parentClip === main && !button.removed &&
      equal(matrix(button), choice.sourcePlacement.m) ? button : null;
  }
  private branch(main: MovieClip, spec: Branch): MovieClip | null {
    const clip = main.children.get(spec.sourcePlacement.depth), source = spec.sourcePlacement.m;
    return clip instanceof MovieClip && clip.charId === spec.characterId && clip.name === spec.name &&
      clip.def === this.runtime.page.dictionary[spec.characterId] && clip.parentClip === main && !clip.removed &&
      clip.totalFrames === spec.totalFrames && matrix(clip).every((value, index) => index === 4 ? value === source[4] || value === 100 : value === source[index]) ? clip : null;
  }
  private question(main: MovieClip): boolean {return main.frame === 47 && !main.playing && this.runtime.Global.get('quizSection') === true && !this.cycleSolved;}
  private availability(main: MovieClip, enabled: boolean): void {
    const buttons = P010.choices.map(choice => this.answer(main, choice)); requireSource(buttons.every(Boolean), 'EXACT_THREE_SOURCE_ANSWERS');
    for (const button of buttons) {button!.set('enabled', enabled); button!.set('_visible', enabled);}
  }

  /** Observe completed authored actions; never advance or alter the timeline. */
  afterSourceUpdate(): void {
    const main = this.main(); if (!main || this.runtime.queue.length) return;
    const freshQuestion = main.frame === 47 && !main.playing && this.runtime.Global.get('quizSection') === true &&
      main.looped && this.questionAnchor && this.answer(main, P010.choices[0]) !== this.questionAnchor;
    if (this.pendingCorrect) {
      const tail = this.pendingCorrect;
      const continued = this.runtime.Global.get('quizSection') === false && ((main.frame === 47 && main.playing) || main.frame > 47);
      if (tail.clip.frame === 1 && !tail.clip.playing && (continued || freshQuestion)) {
        this.completedActivities++; this.pendingCorrect = null;
      }
    }
    if (this.cycleSolved && !this.pendingCorrect && freshQuestion) {this.cycleSolved = false; this.questionAnchor = null; this.epoch++;}
  }

  private handle(call: HostCall): boolean {
    if (!this.current()) return false;
    if (call.kind === 'shell.DoHyperLinks' && this.pendingLink) {
      const pending = this.pendingLink;
      const valid = pending.intent.kind === 'feedback-html-link' ? this.validLink(pending.intent) : this.validPrompt(pending.intent);
      requireSource(call.tick === pending.tick && call.args.length === 0 && valid &&
        this.runtime.Global.get('KeyAttribute') === pending.intent.sourceKey && !pending.request, 'SOURCE_LINK_RELEASE');
      pending.request = Object.freeze({type: 'open-glossary', entryId: pending.intent.entryId,
        sourceAnimationId: P010.animationId, playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume'});
      this.handledCalls.push(call); return true;
    }
    if (!['shell.disableQuizButton', 'shell.enableQuizButton', 'shell.showWrongFeed', 'shell.showRightFeed'].includes(call.kind)) return false;
    const main = this.main(); requireSource(main && call.tick === this.runtime.tickCount && call.args.length === 0, 'SOURCE_HOST_CONTEXT');
    if (call.kind === 'shell.disableQuizButton') {
      if (this.active) {
        requireSource(this.active.binding.kind === 'right' && this.branch(main, this.active.binding) === this.active.clip &&
          this.active.clip.frame === this.active.binding.sourceTerminalFrame && main.frame === 47, 'RIGHT_SOURCE_COMPLETION_ONLY');
        this.availability(main, false); this.cycleSolved = true;
        this.pendingCorrect = {clip: this.active.clip, binding: this.active.binding, tick: call.tick};
        this.active = null; this.epoch++;
      } else {
        requireSource(this.question(main) && !this.pendingAnswer && P010.choices.every(choice => {
          const button = this.answer(main, choice); return button && this.runtime.isClickable(button);
        }), 'UNLOCKED_SOURCE_QUESTION');
        this.questionAnchor = this.answer(main, P010.choices[0]);
        this.availability(main, false); this.pendingAnswer = true; this.epoch++;
      }
    } else if (call.kind === 'shell.enableQuizButton') {
      requireSource(this.active?.binding.kind === 'wrong' && this.branch(main, this.active.binding) === this.active.clip &&
        this.active.clip.frame === this.active.binding.sourceTerminalFrame && this.question(main), 'WRONG_SOURCE_COMPLETION_ONLY');
      this.availability(main, true);
      // Passive record of the source callback already validated above; it cannot advance or unlock the page.
      this.lastWrongRetry = Object.freeze({ordinal:++this.wrongRetryOrdinal,sourceName:this.active.binding.name,
        sourceCharacterId:this.active.clip.charId,frame:this.active.clip.frame,tick:call.tick,epoch:this.epoch});
      this.active = null; this.epoch++;
    } else {
      requireSource(this.pendingAnswer && !this.active && this.question(main) && P010.choices.every(choice => {
        const button = this.answer(main, choice); return button && !button.visible && !this.runtime.toBool(button.get('enabled'));
      }), 'ANSWER_LOCK_BEFORE_FEEDBACK');
      const kind = call.kind === 'shell.showRightFeed' ? 'right' : 'wrong';
      const selected = selectHostFeedback(kind, (this.options.seed + this.attempts) >>> 0);
      const binding = P010.feedback.find(branch => branch.name === selected.instanceName);
      requireSource(binding?.selectedByInspectedHostBranchSet && binding.kind === kind, 'SOURCE_REACHABLE_FEEDBACK_BRANCH');
      const clip = this.branch(main, binding); requireSource(clip && clip.frame === 1 && !clip.playing, 'SOURCE_FEEDBACK_ENTRY');
      this.pendingAnswer = false; this.active = {clip, binding, selection: selected}; this.attempts++; this.feedbackSelections.push(selected);
      clip.set('_visible', true); clip.gotoCmd(2, true); clip.set('_x', 5);
      this.runtime.callMethod(this.runtime.Global.get('gSound'), 'setVolume', [this.runtime.Global.get('VolLevel')], null);
      this.options.onRequest?.(Object.freeze({type: 'record-practice-feedback', interactionId: P010.animationId,
        outcome: kind === 'right' ? 'correct' : 'incorrect', branchIndex: selected.branchIndex, branchCount: selected.cardinality}));
    }
    this.handledCalls.push(call); return true;
  }
  choices(): readonly P010ChoiceIntent[] {
    this.afterSourceUpdate(); const main = this.main(); if (!main || !this.question(main) || this.active || this.pendingAnswer) return [];
    return P010.choices.flatMap(choice => {const button = this.answer(main, choice); if (!button || !this.runtime.isClickable(button)) return [];
      const intent = Object.freeze({kind: 'answer' as const, epoch: this.epoch, sourceName: choice.name, button}); this.issued.add(intent); return [intent];});
  }
  choose(intent: P010ChoiceIntent): boolean {
    this.afterSourceUpdate(); const main = this.main(), choice = P010.choices.find(value => value.name === intent.sourceName);
    if (!main || !this.issued.has(intent) || this.consumed.has(intent) || intent.epoch !== this.epoch || !choice ||
        this.answer(main, choice) !== intent.button || !this.question(main) || this.active || this.pendingAnswer || !this.runtime.isClickable(intent.button)) return false;
    this.consumed.add(intent); this.runtime.click(intent.button); this.afterSourceUpdate(); return true;
  }
  private popup() {
    const main = this.main(), active = this.active;
    if (!main || !active || active.binding.kind !== 'wrong' || this.branch(main, active.binding) !== active.clip ||
        active.clip.frame !== 22 || active.clip.playing || main.frame !== 47) return null;
    const popup = active.clip.get('Mc_Feed_Popup'); if (!(popup instanceof MovieClip) || popup.charId !== 46 || popup.parentClip !== active.clip || popup.removed || !this.runtime.allObjects().includes(popup)) return null;
    const text = popup.get('txtFeed'), button = popup.get('BtnClose'), fn = popup.get('DoHyperLinksTemp');
    if (!(text instanceof TextFieldObj) || text.charId !== 45 || text.parentClip !== popup || !text.html || text.htmlValue !== P010.html ||
        this.runtime.Global.get('WrongFeed') !== P010.html || !(button instanceof ButtonObj) || button.charId !== 42 || button.parentClip !== popup || !(fn instanceof ASFunction)) return null;
    return {feedback: active.clip, popup, text, button, fn};
  }
  feedback() {
    const value = this.popup(); if (!value) return null;
    const close = Object.freeze({kind: 'wrong-close' as const, epoch: this.epoch, feedback: value.feedback, popup: value.popup, button: value.button}); this.issued.add(close);
    const links = P010.feedbackLinkKeys.map(sourceKey => {const intent = Object.freeze({kind: 'feedback-html-link' as const,
      epoch: this.epoch, feedback: value.feedback, popup: value.popup, text: value.text, sourceFunction: value.fn,
      sourceKey, entryId: P010.entries[sourceKey], sourceActionSha256: P010.feedbackScriptSha256}); this.issued.add(intent); return intent;});
    return Object.freeze({html: P010.html, tokens: P010_FEEDBACK_TOKENS, close, links: Object.freeze(links)});
  }
  closeWrong(intent: P010CloseIntent): boolean {
    const value = this.popup(); if (!value || !this.issued.has(intent) || this.consumed.has(intent) || intent.epoch !== this.epoch ||
      intent.feedback !== value.feedback || intent.popup !== value.popup || intent.button !== value.button || !this.runtime.isClickable(value.button)) return false;
    this.consumed.add(intent); this.runtime.click(value.button); return true;
  }
  private validLink(intent: P010LinkIntent): boolean {
    const value = this.popup(); return Boolean(value && this.issued.has(intent) && intent.epoch === this.epoch &&
      intent.feedback === value.feedback && intent.popup === value.popup && intent.text === value.text && intent.sourceFunction === value.fn &&
      P010.feedbackLinkKeys.includes(intent.sourceKey) && intent.entryId === P010.entries[intent.sourceKey] && intent.sourceActionSha256 === P010.feedbackScriptSha256);
  }
  private promptButton(binding: PromptBinding): ButtonObj | null {
    const main = this.main(); if (!main || !this.question(main) || this.active || this.pendingAnswer) return null;
    const button = main.children.get(binding.sourcePlacement.depth);
    return button instanceof ButtonObj && button.charId === binding.sourceCharacterId && button.parentClip === main &&
      button.def === this.runtime.page.dictionary[binding.sourceCharacterId] && !button.removed &&
      equal(matrix(button), binding.sourcePlacement.m) && equal(button.cx, binding.sourcePlacement.cx) && this.runtime.isClickable(button) ? button : null;
  }
  promptLinks(): readonly P010PromptIntent[] {
    this.afterSourceUpdate(); return P010.questionGlossary.flatMap(binding => {
      const button = this.promptButton(binding); if (!button) return [];
      const intent = Object.freeze({kind: 'prompt-glossary' as const, epoch: this.epoch, button, sourceKey: binding.key,
        entryId: P010.entries[binding.key]}); this.issued.add(intent); return [intent];
    });
  }
  private validPrompt(intent: P010PromptIntent): boolean {
    const binding = P010.questionGlossary.find(value => value.key === intent.sourceKey);
    return Boolean(binding && this.issued.has(intent) && intent.epoch === this.epoch && this.promptButton(binding) === intent.button && intent.entryId === P010.entries[binding.key]);
  }
  releaseGlossary(intent: P010LinkIntent | P010PromptIntent): LessonHostRequest | null {
    if (this.pendingLink || this.consumed.has(intent) || !(intent.kind === 'feedback-html-link' ? this.validLink(intent) : this.validPrompt(intent))) return null;
    this.consumed.add(intent); const pending = {intent, tick: this.runtime.tickCount, request: null as LessonHostRequest | null}; this.pendingLink = pending;
    try {
      if (intent.kind === 'feedback-html-link') {this.runtime.callFn(intent.sourceFunction, intent.popup, [intent.sourceKey]); this.runtime.runQueue();}
      else this.runtime.click(intent.button);
      requireSource(pending.request && this.main()?.playing === false, 'SOURCE_GLOSSARY_MUST_STOP_MAIN');
      this.options.onRequest?.(pending.request); return pending.request;
    } finally {this.pendingLink = null;}
  }
  /** Same product interface as P009; source execution remains releaseGlossary. */
  releaseFeedbackLink(intent: P010FeedbackLinkIntent): LessonHostRequest | null {return this.releaseGlossary(intent);}
  /** Host transport can resume, but must never forcibly play the unanswered47. */
  mayResumeMainSource(): boolean {const main = this.main(); return Boolean(main && !main.playing && !this.active && !this.pendingAnswer && main.frame !== 47);}
  snapshot() {
    this.afterSourceUpdate(); const main = this.main(), active = this.active;
    return Object.freeze({current: this.current(), epoch: this.epoch, mainFrame: main?.frame ?? null, mainPlaying: main?.playing ?? false,
      attempts: this.attempts, cycleSolved: this.cycleSolved, completedActivities: this.completedActivities,
      lastWrongRetry: this.lastWrongRetry,
      activityComplete: this.completedActivities > 0, complete: this.completedActivities > 0, terminalStopClaim: false,
      answerLocked: !main || !this.question(main) || Boolean(active) || this.pendingAnswer,
      feedback: active ? {kind: active.binding.kind, sourceCharacterId: active.binding.characterId, sourceName: active.binding.name,
        frame: active.clip.frame, playing: active.clip.playing, branchIndex: active.selection.branchIndex,
        branchCount: active.selection.cardinality, sourceTerminalFrame: active.binding.sourceTerminalFrame} : null,
      authoritativeAdobeRandomStateAccepted: false});
  }
  dispose(): void {
    if (this.disposed) return; this.disposed = true; this.epoch++; this.pendingLink = null; this.active = null;
    this.pendingAnswer = false; this.pendingCorrect = null; this.questionAnchor = null;
    if (this.runtime.hostCb === this.callback) this.runtime.hostCb = this.previous;
    if (owners.get(this.runtime) === this) owners.delete(this.runtime);
  }
}
