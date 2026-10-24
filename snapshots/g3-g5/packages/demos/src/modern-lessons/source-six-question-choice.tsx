'use client';

import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import type {ComponentType} from 'react';
import type {AnimationRendererProps, AudioCue, RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition, LessonTextActivitySnapshot, LessonTextBinding, LessonTextKeyTermsCapability, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {LessonSourceButton} from '../lesson-source-button';

type Range = readonly [number, number];
export interface SixQuestionChoiceQuestion {
  readonly id: string;
  readonly frame: number;
  readonly firstFrame: number;
  readonly lastFrameExclusive: number;
  readonly prompt: string;
  readonly answers: readonly Readonly<{id: string; text: string; correct: boolean; sourceButton: number}>[];
  readonly wrongExplanation: string;
}
export interface SixQuestionChoiceFeedback {
  readonly id: string;
  readonly kind: 'wrong' | 'correct';
  readonly variant: number;
  readonly sprite: number;
  readonly endFrame: number;
  readonly text: string;
  readonly sourceInstanceId: string;
  readonly parentLifetime: Readonly<{firstFrame: number; lastFrameExclusive: number}>;
  readonly visibleFrames: readonly Range[];
  readonly popupFrames: readonly Range[];
}
export interface SixQuestionChoiceState {
  readonly seed: number;
  readonly replay: number;
  readonly attempts: readonly number[];
  readonly help: boolean;
  readonly feedback: Readonly<{id: string; stage: 'intro' | 'outro'; parentFrame: number; selected: string; revisionFloor: number}> | null;
  readonly pendingFromFrame: number | null;
  readonly focusTarget: string | null;
}
export interface SixQuestionChoiceHelpProps {
  readonly runtime: AnimationRendererProps;
}
export interface SixQuestionChoiceQuestionProps extends SixQuestionChoiceHelpProps {
  readonly question: SixQuestionChoiceQuestion;
}
export interface SixQuestionChoiceInstructionProps extends SixQuestionChoiceHelpProps {
  readonly text: string;
}
export interface SixQuestionChoiceAnswerProps extends SixQuestionChoiceQuestionProps {
  readonly answer: SixQuestionChoiceQuestion['answers'][number];
}
export interface SixQuestionChoiceConfig {
  readonly animationId: string;
  readonly frameDomain: string;
  readonly rootFrame: number;
  readonly fps: number;
  readonly frameCount: number;
  readonly sourceSha256: string;
  readonly questions: readonly SixQuestionChoiceQuestion[];
  readonly feedback: readonly SixQuestionChoiceFeedback[];
  readonly instructionFrames: readonly Readonly<{frame: number; text: string}>[];
  readonly audio: readonly Readonly<{id: string; source: string; sha256: string; firstFrame: number; lastFrame: number}>[];
  readonly binding: LessonTextBinding;
  /** All bindings use stable canonical IDs; this map supplies exact local source text. */
  readonly text: Readonly<Record<string, string>>;
  readonly helpBlockIds: readonly string[];
  readonly HelpContent: ComponentType<SixQuestionChoiceHelpProps>;
  readonly QuestionContent?: ComponentType<SixQuestionChoiceQuestionProps>;
  readonly InstructionContent?: ComponentType<SixQuestionChoiceInstructionProps>;
  /** Authored exercise identifier, independent of the internal answer-row index. */
  readonly exerciseNumber?: Readonly<{blockId: string; alphaFrames: readonly Readonly<{frame: number; alpha: number}>[]}>;
  readonly AnswerContent?: ComponentType<SixQuestionChoiceAnswerProps>;
  readonly buttonActivities?: readonly LessonTextActivityDefinition[];
  readonly helpOpenActivityIds?: Readonly<Record<string, string>>;
  readonly helpCloseActivityIds?: Readonly<Record<string, string>>;
  readonly wrongCloseActivityIds?: Readonly<Record<string, string>>;
  readonly keyTerms?: LessonTextKeyTermsCapability;
  readonly getFrameState: (frame: number, context: RuntimeContext) => SourceStaticCanvasFrameState;
}
const inRanges = (frame: number, ranges: readonly Range[]) => ranges.some(([first,last]) => frame >= first && frame <= last);
export function createSixQuestionChoiceState(seed = 0, replay = 0, count = 6): SixQuestionChoiceState {
  return {seed: Number.isSafeInteger(seed) ? seed >>> 0 : 0, replay: Number.isSafeInteger(replay) ? replay : 0,
    attempts: Array(count).fill(0), help: false, feedback: null, pendingFromFrame: null, focusTarget: null};
}
export function synchronizeSixQuestionChoiceState(state: SixQuestionChoiceState, context: RuntimeContext, count = 6): SixQuestionChoiceState {
  const next = createSixQuestionChoiceState(context.seed, context.replay ?? 0, count);
  if (state.seed !== next.seed || state.replay !== next.replay) return next;
  if (context.frame === 1 && (state.help || state.feedback || state.attempts.some(Boolean))) return next;
  if (state.pendingFromFrame !== null && context.frame !== state.pendingFromFrame) return {...state, pendingFromFrame: null, focusTarget: null};
  if (state.feedback && context.frame !== state.feedback.parentFrame) return {...state, feedback: null, help: false, focusTarget: null};
  if (state.help && !Number.isInteger(context.frame)) return {...state, help: false};
  return state;
}
export function getSixQuestionChoiceTeaching(config: SixQuestionChoiceConfig, frame: number) {
  const question = config.questions.find(q => frame >= q.firstFrame && frame < q.lastFrameExclusive);
  return {question, canAnswer: question?.frame === frame, terminal: frame === config.frameCount,
    instruction: config.instructionFrames.filter(row => row.frame <= frame).at(-1)?.text ?? '',
    exerciseNumberAlpha: config.exerciseNumber?.alphaFrames.filter(row => row.frame <= frame).at(-1)?.alpha ?? 0};
}
export function getSixQuestionChoiceActivityDefinitions(config: SixQuestionChoiceConfig): readonly LessonTextActivityDefinition[] {
  const parentFrames = config.questions.map(q => q.frame);
  return config.feedback.flatMap(branch => {
    const audio = config.audio.find(audio => audio.id === branch.id);
    if (!audio) throw new Error(`Missing source feedback audio: ${config.animationId}/${branch.id}`);
    const definition = {id: branch.id, sourceInstanceId: branch.sourceInstanceId, parentLifetime: branch.parentLifetime,
      frameDomain: `sprite-${branch.sprite}`, startFrame: 2, endFrame: branch.kind === 'wrong' ? 22 : branch.endFrame,
      fps: config.fps, parentFrames, audio: {...audio, language: 'shared' as const, spokenLanguage: 'undetermined' as const}};
    return branch.kind === 'correct' ? [definition] : [definition, {...definition, id: `${branch.id}-outro`, startFrame: 23, endFrame: branch.endFrame,
      entryFromActivity: {id: branch.id, firstFrame: branch.popupFrames[0][0], lastFrame: 22}}];
  });
}
export function chooseSixQuestionChoiceAnswer(config: Readonly<{questions: readonly Pick<SixQuestionChoiceQuestion, 'frame' | 'answers'>[]; feedback: readonly Pick<SixQuestionChoiceFeedback, 'id' | 'kind' | 'variant'>[]}>, state: SixQuestionChoiceState, frame: number, choiceId: string, revisionFloor = -1): SixQuestionChoiceState | null {
  const index = config.questions.findIndex(q => q.frame === frame), question = config.questions[index];
  if (!question || state.help || state.feedback || state.pendingFromFrame === frame) return null;
  const answer = question.answers.find(a => a.id === choiceId);
  if (!answer) return null;
  const kind = answer.correct ? 'correct' : 'wrong';
  // Source host chooses random(3)+1/random(4)+1. This seeded schedule is a
  // deterministic modern adapter, not a reconstruction of Flash's RNG.
  const variant = (state.seed + state.attempts[index]) % (answer.correct ? 4 : 3) + 1;
  const branch = config.feedback.find(b => b.kind === kind && b.variant === variant);
  if (!branch) return null;
  const attempts = [...state.attempts]; attempts[index]++;
  return {...state, attempts, focusTarget: 'feedback', feedback: {id: branch.id, stage: 'intro', parentFrame: frame, selected: choiceId, revisionFloor}};
}
export function getSixQuestionChoiceFeedback(config: SixQuestionChoiceConfig, state: SixQuestionChoiceState, activities: readonly LessonTextActivitySnapshot[]) {
  const feedback = state.feedback, branch = config.feedback.find(b => b.id === feedback?.id), expectedId = feedback ? feedback.id + (feedback.stage === 'outro' ? '-outro' : '') : null;
  const definition = getSixQuestionChoiceActivityDefinitions(config).find(d => d.id === expectedId);
  const activity = activities.find(a => a.id === expectedId && a.sourceInstanceId === branch?.sourceInstanceId);
  const bound = Boolean(feedback && branch && activity && definition && activity.frameDomain === definition.frameDomain && activity.revision > feedback.revisionFloor
    && Number.isInteger(activity.frame) && activity.frame >= definition.startFrame && activity.frame <= definition.endFrame);
  return {branch, activity, bound, visible: bound && inRanges(activity!.frame, branch!.visibleFrames),
    popup: bound && branch!.kind === 'wrong' && feedback!.stage === 'intro' && inRanges(activity!.frame, branch!.popupFrames),
    complete: bound && activity!.status === 'completed' && activity!.frame === definition!.endFrame && (branch!.kind === 'correct' || feedback!.stage === 'outro')};
}
export function getSixQuestionChoiceSnapshot(config: SixQuestionChoiceConfig, state: SourceStaticCanvasFrameState, context: RuntimeContext,
  interaction = createSixQuestionChoiceState(context.seed, context.replay ?? 0, config.questions.length), activities: readonly LessonTextActivitySnapshot[] = []): TextPresentationSnapshot {
  const expected = config.getFrameState(context.frame, {...context, frameDomain: context.frameDomain ?? config.frameDomain}), blockers: string[] = [];
  if (state.sourceSwfSha256 !== config.sourceSha256 || state.animationId !== config.animationId) blockers.push('source-identity-mismatch');
  if ((context.frameDomain ?? config.frameDomain) !== config.frameDomain || state.frameDomain !== config.frameDomain) blockers.push('unsupported-frame-domain');
  if (context.lang !== 'en' || state.language !== 'en') blockers.push('source-verified-spanish-page-text-missing');
  if (context.scenario !== 'source-static-frame' || state.scenario !== context.scenario) blockers.push('unsupported-scenario');
  if (context.entryStateSha256) blockers.push('source-capture-requires-original-renderer');
  if (!Number.isInteger(context.frame) || context.frame < 1 || context.frame > config.frameCount || state.frame !== context.frame || state.rootFrame !== config.rootFrame
    || (context.rootFrame !== undefined && context.rootFrame !== config.rootFrame) || state.seed !== expected.seed) blockers.push('teaching-state-identity-mismatch');
  if (state.status !== expected.status || state.blocker !== expected.blocker || state.exportFrame !== expected.exportFrame || state.rootState !== expected.rootState
    || state.sourceStaticVisualReady !== expected.sourceStaticVisualReady || state.interactiveControlsEnabled !== false || state.sourceHostBehaviorResolved !== false
    || state.naturalRuntimeEstablished !== false || state.audioRendered !== false || JSON.stringify(state.visibleSourceMarkers) !== JSON.stringify(expected.visibleSourceMarkers)) blockers.push('unexpected-original-static-state');
  const session = synchronizeSixQuestionChoiceState(interaction, context, config.questions.length), teaching = getSixQuestionChoiceTeaching(config, state.frame), feedback = getSixQuestionChoiceFeedback(config, session, activities);
  const questionId = teaching.question?.id, hiddenQuestion = session.help || feedback.popup;
  const titleBlock = config.binding.blocks.find(block => block.role === 'title');
  const visible = (id: string) => id === titleBlock?.id ? true : id === config.exerciseNumber?.blockId ? teaching.exerciseNumberAlpha > 0
    : id === 'instruction' ? !!teaching.instruction && !hiddenQuestion
    : id === `question-${questionId}` || id.startsWith(`answer-${questionId}-`) ? !!questionId && !hiddenQuestion
    : id === `wrong-explanation-${questionId}` ? feedback.popup
    : config.helpBlockIds.includes(id) ? session.help
    : id === 'close' ? session.help || feedback.popup
    : id === 'help-button' ? teaching.canAnswer && !session.help && !session.feedback
    : id === `feedback-${session.feedback?.id}` && feedback.visible;
  return {schemaVersion: 1, animationId: config.animationId, bindingVersion: config.binding.version, sourceSwfSha256: config.sourceSha256,
    status: blockers.length ? 'blocked' : 'ready', blockers,
    identity: {frame: state.frame, frameDomain: state.frameDomain, rootFrame: state.rootFrame, scenario: state.scenario, language: state.language, seed: state.seed, replay: context.replay ?? 0},
    suppressedInstances: [], blocks: blockers.length ? [] : config.binding.blocks.map(block => ({...block, text: block.id === 'instruction' ? teaching.instruction : config.text[block.id] ?? '', visible: visible(block.id)}))};
}
/** Preserve the authored numeric token as one selectable mathematical value.
 * The containing inline region can scroll when enlarged text cannot fit. */
export function SourceChoiceText({text}: {readonly text: string}) {
  return <>{text.split(/(\d[\d,]*(?:\.\d+)?)/g).map((part,index)=>/^[0-9]/.test(part)
    ? <span key={index} className="six-choice-modern__numeric-token">{part}</span> : part)}</>;
}
const CSS = `
.six-choice-modern{container:sixchoice / inline-size;box-sizing:border-box;min-inline-size:0;max-inline-size:70rem;margin:auto;padding:clamp(12px,3cqi,28px);border-radius:1rem;background:#fffdf8;color:#17273c;font:1.25rem/1.6 var(--lesson-font-body,system-ui,sans-serif)}
.six-choice-modern__title{font:700 2.25rem/1.25 var(--lesson-font-display,system-ui,sans-serif);margin:0 0 .6rem;white-space:normal;overflow-wrap:normal;word-break:normal;hyphens:none}
.six-choice-modern__exercise-number{display:inline-flex;align-items:center;justify-content:center;min-inline-size:1.6em;min-block-size:1.6em;aspect-ratio:1;padding:.15em;border-radius:50%;background:#17273c;color:#fff;font-weight:700;line-height:1}
.six-choice-modern *{box-sizing:border-box}.six-choice-modern [hidden]{display:none!important}.six-choice-modern p{margin:.6em 0;overflow-wrap:anywhere}.six-choice-modern h3{font:600 1.5rem/1.4 var(--lesson-font-display,system-ui,sans-serif);margin:0 0 .5em}.six-choice-modern__question{border:1px solid #a0b5cf;border-radius:.8rem;padding:clamp(12px,3cqi,24px);background:#f2f7ff}
.six-choice-modern__answers{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.85rem;margin-block:1.5rem}.six-choice-modern__answers:where(:has(> button:nth-child(4))){grid-template-columns:repeat(2,minmax(0,1fr))}.six-choice-modern button{font:inherit;color:inherit;min-block-size:44px;min-inline-size:44px;max-inline-size:100%;cursor:pointer;touch-action:manipulation}.six-choice-modern button:disabled{cursor:default}.six-choice-modern button:focus-visible,.six-choice-modern [tabindex]:focus-visible{outline:3px solid #1757af;outline-offset:3px}
.six-choice-modern__answer{font-size:clamp(1.125rem,6cqi,1.5rem)!important;font-weight:700!important;font-variant-numeric:tabular-nums;border:2px solid #4f7299;border-radius:.7rem;background:#fff;padding:.75rem .4rem;overflow-wrap:anywhere}.six-choice-modern__answer:not(:disabled):hover{background:#eaf3ff;border-color:#1757af}.six-choice-modern__action{border:1px solid #1757af;border-radius:.5rem;background:#1757af;color:#fff!important;padding:.55rem 1rem}
.six-choice-modern__feedback{min-block-size:4rem;padding:clamp(12px,3cqi,16px);border:2px solid #9d4d36;border-radius:.8rem;background:#fff4ef;margin-block:1rem}.six-choice-modern__feedback[data-kind=correct]{background:#eff9f2;border-color:#286b45}.six-choice-modern__dialog{display:grid;gap:1rem;border:2px solid #6887ab;border-radius:.8rem;padding:clamp(12px,3cqi,24px);background:#f4f8ff;scroll-margin-block-start:calc(var(--lesson-platform-header-height,0px) + env(safe-area-inset-top) + 1rem)}
.six-choice-modern__help-example{min-inline-size:0;padding-block:.5rem;border-block-end:1px solid #a0b5cf}.six-choice-modern__help-example:last-of-type{border:0}.six-choice-modern__numeric-token{display:inline-block;max-inline-size:100%;white-space:nowrap;overflow-x:auto;vertical-align:bottom}.six-choice-modern__number{white-space:nowrap;overflow-x:auto;max-inline-size:100%;font-family:var(--lesson-font-display,system-ui,sans-serif);font-size:1.5rem;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.six-choice-modern__digit{display:inline-flex;flex-direction:column;align-items:center;color:#9b2940;font-weight:700}.six-choice-modern__digit>span{line-height:.8}.six-choice-modern__term{font:inherit;border:0;background:none;color:#1757af!important;text-decoration:underline;text-underline-offset:.15em;text-decoration-thickness:1px;padding:0 .05em}.six-choice-modern__terminal{margin-block-start:1.5rem}
@container sixchoice (max-width:40rem){.six-choice-modern__title{font-size:1.75rem}.six-choice-modern{font-size:1.125rem}.six-choice-modern__answers{grid-template-columns:1fr}.six-choice-modern__answer{padding:.6rem}}
@container sixchoice (max-width:40rem){.six-choice-modern__answers:where(:has(> button:nth-child(4))) .six-choice-modern__answer{padding-inline:6px}}
`;
function trapDialog(event: React.KeyboardEvent<HTMLElement>, close: () => void) {
  if (event.key === 'Escape') {event.preventDefault(); close(); return;}
  if (event.key !== 'Tab') return;
  const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]')).filter(el => el.getClientRects().length > 0);
  const index = controls.indexOf(document.activeElement as HTMLElement);
  if (!controls.length) {event.preventDefault(); return;}
  if ((event.shiftKey && index <= 0) || (!event.shiftKey && index === controls.length - 1)) {event.preventDefault(); controls[event.shiftKey ? controls.length - 1 : 0].focus();}
}
export function createSourceSixQuestionChoice(config: SixQuestionChoiceConfig): LessonTextPresentationCapability<SourceStaticCanvasFrameState> {
  const definitions = [...getSixQuestionChoiceActivityDefinitions(config), ...(config.buttonActivities ?? [])], transitions = config.questions.map((question,index) => ({fromFrame: question.frame, toFrame: question.frame + 1, stopFrame: config.questions[index + 1]?.frame ?? config.frameCount}));
  const getSnapshot = (state: SourceStaticCanvasFrameState, context: RuntimeContext) => getSixQuestionChoiceSnapshot(config, state, context);
  const titleBlock = config.binding.blocks.find(block => block.role === 'title');
  function Renderer(props: AnimationRendererProps) {
    const context = {...props, frameDomain: props.frameDomain ?? config.frameDomain}, state = (props.state ?? config.getFrameState(props.frame, context)) as SourceStaticCanvasFrameState;
    const [stored,setStored] = useState(() => createSixQuestionChoiceState(props.seed, props.replay ?? 0, config.questions.length));
    const interaction = synchronizeSixQuestionChoiceState(stored, context, config.questions.length), activities = props.lessonActivities ?? (props.lessonActivity ? [props.lessonActivity] : []);
    const feedback = getSixQuestionChoiceFeedback(config, interaction, activities), snapshot = getSixQuestionChoiceSnapshot(config, state, context, interaction, activities), teaching = getSixQuestionChoiceTeaching(config, state.frame);
    const root = useRef<HTMLElement>(null), consumed = useRef<string | null>(null), question = teaching.question, previousQuestion = useRef<string | null>(null);
    const locked = snapshot.status !== 'ready' || props.paused === true;
    const canAnswer = teaching.canAnswer && !interaction.help && !interaction.feedback && interaction.pendingFromFrame !== state.frame && Boolean(props.onLessonActivityRequest);
    useEffect(() => {
      if (locked || !feedback.complete || !interaction.feedback || !feedback.activity) return;
      const token = `${interaction.seed}:${interaction.replay}:${feedback.activity.sourceInstanceId}:${feedback.activity.id}:${feedback.activity.revision}`;
      if (consumed.current === token) return;
      if (feedback.branch!.kind === 'correct') {
        const edge = transitions.find(edge => edge.fromFrame === state.frame);
        if (!edge || props.onLessonFrameRequest?.(edge) !== true) return;
        setStored({...interaction, feedback: null, pendingFromFrame: state.frame, focusTarget: null});
      } else setStored({...interaction, feedback: null, focusTarget: interaction.feedback.selected});
      consumed.current = token;
    }, [locked, feedback.complete, feedback.activity, interaction, state.frame, props.onLessonFrameRequest]);
    useLayoutEffect(() => {
      let target = interaction.help ? 'help-dialog' : feedback.popup ? 'wrong-dialog' : interaction.feedback ? 'feedback'
        : teaching.terminal ? 'replay' : teaching.canAnswer ? (previousQuestion.current === question?.id ? interaction.focusTarget : null) ?? question?.answers[0].id : null;
      if (target) {
        const el = root.current?.querySelector<HTMLElement>(`[data-six-choice-focus="${target}"]`), dialog = target.endsWith('dialog');
        el?.focus({preventScroll: dialog}); if (dialog) el?.scrollIntoView({block: 'start', behavior: 'instant'});
      }
      if (teaching.canAnswer) previousQuestion.current = question?.id ?? null;
    }, [interaction.help, interaction.feedback?.id, interaction.feedback?.stage, interaction.focusTarget, feedback.popup, teaching.canAnswer, teaching.terminal, question?.id, props.replay]);
    if (snapshot.status !== 'ready') return null;
    const choose = (choiceId: string) => {
      if (locked || !canAnswer) return;
      const draft = chooseSixQuestionChoiceAnswer(config, interaction, state.frame, choiceId);
      if (!draft?.feedback) return;
      const sourceInstance = config.feedback.find(b => b.id === draft.feedback!.id)!.sourceInstanceId;
      const revisionFloor = activities.find(a => a.sourceInstanceId === sourceInstance)?.revision ?? -1;
      if (props.onLessonActivityRequest?.({id: draft.feedback.id, parentFrame: state.frame}) === true) setStored({...draft, feedback: {...draft.feedback, revisionFloor}});
    };
    const closeWrong = () => {
      if (locked || !feedback.popup || !feedback.activity || !interaction.feedback) return;
      const current = feedback.activity;
      if (props.onLessonActivityRequest?.({id: `${interaction.feedback.id}-outro`, parentFrame: state.frame, fromActivity: {id: current.id, revision: current.revision}}) !== true) return;
      setStored({...interaction, focusTarget: 'feedback', feedback: {...interaction.feedback, stage: 'outro', revisionFloor: current.revision}});
    };
    const closeHelp = () => setStored({...interaction, help: false, focusTarget: 'help'});
    return <section ref={root} className="six-choice-modern" lang="en" data-modern-text-page={config.animationId} data-lesson-text-status={snapshot.status} data-lesson-frame={state.frame}
      data-lesson-seed={state.seed} data-lesson-replay={props.replay ?? 0} data-current-question={question?.id ?? ''} data-feedback-activity-id={feedback.activity?.id ?? ''} data-feedback-activity-frame={feedback.activity?.frame ?? ''}
      data-feedback-stage={interaction.feedback?.stage ?? ''} data-help-open={interaction.help ? 'true' : 'false'} data-source-clock="main-and-placed-feedback">
      <style>{CSS}</style>
      {titleBlock && <h2 className="six-choice-modern__title" data-lesson-text-block={titleBlock.id}>{config.text[titleBlock.id]}</h2>}
      {config.exerciseNumber && teaching.exerciseNumberAlpha > 0 && <span className="six-choice-modern__exercise-number" data-lesson-text-block={config.exerciseNumber.blockId} aria-label={`Exercise ${config.text[config.exerciseNumber.blockId]}`} style={{opacity:teaching.exerciseNumberAlpha / 256}}>{config.text[config.exerciseNumber.blockId]}</span>}
      <div hidden={interaction.help || feedback.popup}>
        {teaching.instruction && <p data-lesson-text-block="instruction">{config.InstructionContent ? <config.InstructionContent runtime={props} text={teaching.instruction}/> : teaching.instruction}</p>}
        {question && <>{question.prompt && <div className="six-choice-modern__question"><p data-lesson-text-block={`question-${question.id}`}>{config.QuestionContent ? <config.QuestionContent runtime={props} question={question}/> : <SourceChoiceText text={question.prompt}/>}</p></div>}
          <div className="six-choice-modern__answers" role="group" aria-label="Answer choices">{question.answers.map(answer => <button key={answer.id} type="button" className="six-choice-modern__answer"
            data-six-choice-focus={answer.id} data-source-button={answer.sourceButton} data-lesson-text-block={`answer-${question.id}-${answer.id}`} disabled={locked || !canAnswer} onClick={() => choose(answer.id)}>{config.AnswerContent ? <config.AnswerContent runtime={props} question={question} answer={answer}/> : <SourceChoiceText text={answer.text}/>}</button>)}</div></>}
        {teaching.canAnswer && !interaction.feedback && (config.helpOpenActivityIds?.[question!.id]
          ? <LessonSourceButton key={`${question!.id}:${props.replay ?? 0}`} runtime={props} activityId={config.helpOpenActivityIds[question!.id]} type="button" className="six-choice-modern__action" data-six-choice-focus="help" data-lesson-text-block="help-button"
              data-source-button="26" disabled={locked || !canAnswer} onClick={() => setStored({...interaction, help: true})}>Need More Help</LessonSourceButton>
          : <button type="button" className="six-choice-modern__action" data-six-choice-focus="help" data-lesson-text-block="help-button"
              disabled={locked || !canAnswer} onClick={() => setStored({...interaction, help: true})}>Need More Help</button>)}
      </div>
      {interaction.feedback && <div className="six-choice-modern__feedback" data-kind={feedback.branch?.kind} data-six-choice-focus="feedback" role="status" aria-live="polite" tabIndex={-1}>
        {feedback.visible && <p data-lesson-text-block={`feedback-${interaction.feedback.id}`}>{feedback.branch!.text}</p>}
      </div>}
      {feedback.popup && <div className="six-choice-modern__dialog" role="dialog" aria-modal="true" aria-label="Try again" tabIndex={-1} data-six-choice-focus="wrong-dialog" onKeyDown={event => trapDialog(event,closeWrong)}>
        <p data-lesson-text-block={`wrong-explanation-${question?.id}`}>{question?.wrongExplanation}</p>
        <LessonSourceButton runtime={props} activityId={config.wrongCloseActivityIds?.[interaction.feedback!.id] ?? ''} type="button" className="six-choice-modern__action" data-lesson-text-block="close" disabled={locked} onClick={closeWrong}>Close</LessonSourceButton>
      </div>}
      {interaction.help && <div className="six-choice-modern__dialog" role="dialog" aria-modal="true" aria-label="Need More Help" tabIndex={-1} data-six-choice-focus="help-dialog" onKeyDown={event => trapDialog(event,closeHelp)}>
        <h3>Need More Help</h3><config.HelpContent runtime={props}/>
        <LessonSourceButton runtime={props} activityId={config.helpCloseActivityIds?.[question!.id] ?? ''} type="button" className="six-choice-modern__action" data-lesson-text-block="close" onClick={closeHelp}>Close</LessonSourceButton>
      </div>}
      {teaching.terminal && <div className="six-choice-modern__terminal"><button type="button" className="six-choice-modern__action" data-six-choice-focus="replay" onClick={props.onReplay} disabled={!props.onReplay}>Replay</button></div>}
    </section>;
  }
  const main = config.audio.find(audio => audio.id === 'main');
  if (!main) throw new Error(`Missing source main audio: ${config.animationId}`);
  const cue: AudioCue & {readonly sha256: string} = {id: 'source-main', sourceCueId: `${config.frameDomain}-original-stream`, frame: main.firstFrame, endFrame: main.lastFrame + 1,
    frameDomain: config.frameDomain, language: 'shared', spokenLanguage: 'undetermined', source: main.source, sha256: main.sha256};
  return Object.freeze({schemaVersion: 1, binding: config.binding, Renderer, getSnapshot, sourceTimelineAudioCues: [cue],
    playbackEndFrameByDomain: {[config.frameDomain]: config.questions[0].frame}, reducedMotionFrameByDomain: {[config.frameDomain]: config.questions[0].frame},
    frameControl: {frameDomain: config.frameDomain, completionFrame: config.frameCount, transitions}, activityTimelines: definitions, keyTerms: config.keyTerms});
}
