'use client';
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import type {AnimationRendererProps, AudioCue, RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition, LessonTextActivitySnapshot, LessonTextBinding, LessonTextKeyTermsCapability, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
import {LessonSourceButton} from '../lesson-source-button';
import {numberLineValue as at} from './g4-l4-number-line';

type Curve<T> = readonly (readonly [number, T])[];
type Lifetime = Readonly<{firstFrame: number; lastFrameExclusive: number}>;
type PairKind = 'wrong' | 'correct';
export interface NinePairCard {
  readonly id: string; readonly blockId: string; readonly pair: number; readonly side: number;
  readonly text: string; readonly sourceInstanceId: string; readonly sourceCharacter: number;
  readonly textCharacters: readonly number[]; readonly parentLifetime: Lifetime;
  readonly alpha: Curve<number>; readonly matrix: readonly number[];
}
type PairFeedback = Readonly<{
  id: PairKind; sourceInstanceId: string; frameDomain: string;
  labels: readonly Readonly<{id: string; alpha: Curve<number>; sourceCharacters: readonly number[]}>[];
}>;
type Crop = Readonly<{character: number; rect: readonly number[]; sourceBounds: Readonly<Record<string, number>>}>;
export interface NinePairConfig {
  readonly animationId: string; readonly placementId: string; readonly sourceSha256: string;
  readonly rootFrame: 6; readonly frameDomain: string; readonly frameCount: number; readonly fps: 12; readonly activityFrame: number;
  readonly binding: LessonTextBinding; readonly text: Readonly<Record<string, string>>;
  readonly exerciseAlpha: Curve<number>;
  readonly prompts: readonly Readonly<{id: string; character: number; alpha: Curve<number>; tokens: readonly Readonly<{text: string; color: string}>[]}>[];
  readonly cards: readonly NinePairCard[]; readonly answerOrder: readonly string[]; readonly problemOrder: readonly string[];
  readonly help: Readonly<{
    sourceInstanceId: string; parentLifetime: Lifetime; button: number; closeButton: number;
    buttonLifetime: Lifetime; buttonAlpha: Curve<number>; top: string; bottom: string; operator: string; result: string;
    carry: readonly Readonly<{id: string; character: number; text: string; matrix: readonly number[]; sourceHeight: number}>[];
    strikeShape: number; strikeLines: readonly (readonly number[])[]; resultRule: readonly number[];
  }>;
  readonly terms: readonly Readonly<{button: number; key: string; entryId: string; scope: 'prompt' | 'help'; activeFrames: readonly (readonly [number, number])[]}>[];
  readonly feedback: readonly PairFeedback[]; readonly activities: readonly LessonTextActivityDefinition[];
  readonly reward: Readonly<{
    mode: 'underlay-reveal' | 'paired-image-reveal'; source: string; sha256: string;
    intrinsic: Readonly<{width: number; height: number}>; introCrop: Crop; fullCrop: Crop;
    tiles: readonly Readonly<{cardId: string; rect: readonly number[]; sourceCharacter: number; sourceInstanceId?: string}>[];
  }>;
  readonly layout: Readonly<{answerMinimumRem: number; answerMaximumRem: number; mathFontRem: number; keyboardScrollStep: number}>;
  readonly fade: Readonly<{intervalMs: 200; alphaStep: 40; hideTick: 4; pausePolicy: string}>;
  readonly keyTerms: LessonTextKeyTermsCapability; readonly sourceAudio: readonly (AudioCue & {readonly sha256: string})[];
}
interface PendingPairFeedback {
  readonly id: PairKind; readonly first: string; readonly second: string; readonly pair: number | null;
  readonly serial: number; readonly revisionFloor: number;
}
export interface NinePairState {
  readonly seed: number; readonly replay: number; readonly lastFrame: number; readonly selected: string | null;
  readonly matched: readonly number[]; readonly score: number; readonly attempts: number;
  readonly feedback: PendingPairFeedback | null; readonly feedbackRevision: number | null;
  readonly fadeTick: number; readonly help: boolean; readonly pendingFromFrame: number | null; readonly focusTarget: string | null;
}
export function createNinePairState(seed = 0, replay = 0, frame = 1): NinePairState {
  return {seed: seed >>> 0, replay, lastFrame: frame, selected: null, matched: [], score: 0, attempts: 0,
    feedback: null, feedbackRevision: null, fadeTick: 0, help: false, pendingFromFrame: null, focusTarget: null};
}
export function synchronizeNinePairState(c: NinePairConfig, s: NinePairState, r: RuntimeContext): NinePairState {
  if (s.seed !== (r.seed >>> 0) || s.replay !== (r.replay ?? 0) || (r.frame < c.activityFrame && s.lastFrame >= c.activityFrame) || (r.frame === c.activityFrame && s.lastFrame > c.activityFrame)) {
    return createNinePairState(r.seed, r.replay ?? 0, r.frame);
  }
  if (s.lastFrame === r.frame) return s;
  const outsideFeedback = r.frame !== c.activityFrame;
  const helpAlive = c.help.parentLifetime.firstFrame <= r.frame && r.frame < c.help.parentLifetime.lastFrameExclusive;
  return {...s, lastFrame: r.frame, feedback: outsideFeedback ? null : s.feedback,
    feedbackRevision: outsideFeedback ? null : s.feedbackRevision,
    pendingFromFrame: r.frame === s.pendingFromFrame ? s.pendingFromFrame : null, help: helpAlive && s.help};
}
function permitted(c: NinePairConfig, s: NinePairState, r: AnimationRendererProps): boolean {
  return r.lang === 'en' && r.scenario === 'source-static-frame' && !r.entryStateSha256 &&
    (r.frameDomain ?? c.frameDomain) === c.frameDomain && (r.rootFrame === undefined || r.rootFrame === c.rootFrame) &&
    (r.seed >>> 0) === s.seed && (r.replay ?? 0) === s.replay && !r.paused;
}
export function observeNinePairFeedback(c: NinePairConfig, s: NinePairState, activities: readonly LessonTextActivitySnapshot[]) {
  const pending = s.feedback, branch = c.feedback.find(row => row.id === pending?.id);
  const definition = c.activities.find(row => row.id === pending?.id);
  const matching = activities.filter(row => row.id === pending?.id || row.sourceInstanceId === branch?.sourceInstanceId);
  const activity = matching.length === 1 ? matching[0] : undefined;
  const bound = Boolean(pending && branch && definition && activity && activity.id === pending.id &&
    activity.sourceInstanceId === branch.sourceInstanceId && activity.frameDomain === definition.frameDomain &&
    Number.isSafeInteger(activity.revision) && activity.revision > pending.revisionFloor &&
    (s.feedbackRevision === null || s.feedbackRevision === activity.revision) && Number.isInteger(activity.frame) &&
    activity.frame >= definition.startFrame && activity.frame <= definition.endFrame &&
    (activity.status === 'playing' || activity.status === 'completed'));
  return {branch, definition, activity, bound,
    labels: branch?.labels.map(row => ({...row, alpha: bound ? at(row.alpha, activity!.frame, 0) : 0})) ?? [],
    complete: bound && activity!.status === 'completed' && activity!.frame === definition!.endFrame};
}
export function chooseNinePairCard(c: NinePairConfig, s: NinePairState, id: string, r: AnimationRendererProps): NinePairState {
  if (!permitted(c, s, r) || r.frame !== c.activityFrame || s.help || s.feedback || s.pendingFromFrame !== null || !r.onLessonActivityRequest || !r.onLessonFrameRequest) return s;
  const card = c.cards.find(row => row.id === id);
  if (!card || s.matched.includes(card.pair)) return s;
  if (s.selected === null) return {...s, lastFrame: r.frame, selected: id, focusTarget: id};
  const first = c.cards.find(row => row.id === s.selected);
  if (!first) return s;
  const correct = first.pair === card.pair && first.side !== card.side;
  const kind: PairKind = correct ? 'correct' : 'wrong';
  const branch = c.feedback.find(row => row.id === kind)!;
  const revisionFloor = Math.max(-1, ...(r.lessonActivities ?? []).filter(row => row.sourceInstanceId === branch.sourceInstanceId && Number.isSafeInteger(row.revision)).map(row => row.revision));
  if (r.onLessonActivityRequest({id: kind, parentFrame: r.frame}) !== true) return s;
  return {...s, lastFrame: r.frame, selected: null, score: s.score + (correct ? 10 : -2), attempts: s.attempts + 1,
    feedback: {id: kind, first: first.id, second: id, pair: correct ? card.pair : null, serial: s.attempts + 1, revisionFloor},
    feedbackRevision: null, fadeTick: 0, focusTarget: null};
}
/** Source interval: subtract 40 every 200ms, then hide on the fourth tick. */
export function tickNinePairFade(c: NinePairConfig, s: NinePairState, serial: number): NinePairState {
  if (s.feedback?.id !== 'correct' || s.feedback.serial !== serial || s.fadeTick >= c.fade.hideTick) return s;
  return {...s, fadeTick: s.fadeTick + 1};
}
export function finishNinePairFeedback(c: NinePairConfig, s: NinePairState, r: AnimationRendererProps): NinePairState {
  const seen = observeNinePairFeedback(c, s, r.lessonActivities ?? []);
  if (!permitted(c, s, r) || r.frame !== c.activityFrame || !s.feedback || !seen.complete) return s;
  const feedback = s.feedback;
  const matched = feedback.id === 'correct' && feedback.pair !== null ? [...s.matched, feedback.pair] : s.matched;
  if (new Set(matched).size !== matched.length || matched.length > 9) return s;
  if (matched.length === 9 && r.onLessonFrameRequest?.({fromFrame: c.activityFrame, toFrame: c.activityFrame + 1, stopFrame: c.frameCount}) !== true) return s;
  const nextFocus = feedback.id === 'wrong' ? feedback.second : c.problemOrder.find(id => !matched.includes(c.cards.find(card => card.id === id)!.pair)) ?? null;
  return {...s, matched, feedback: null, feedbackRevision: null, fadeTick: c.fade.hideTick,
    pendingFromFrame: matched.length === 9 ? r.frame : null, focusTarget: nextFocus};
}
export function setNinePairHelp(c: NinePairConfig, s: NinePairState, open: boolean, r: AnimationRendererProps): NinePairState {
  if (!permitted(c, s, r) || s.help === open) return s;
  const life = open ? c.help.buttonLifetime : c.help.parentLifetime;
  if (r.frame < life.firstFrame || r.frame >= life.lastFrameExclusive) return s;
  return {...s, lastFrame: r.frame, help: open, focusTarget: open ? null : 'help-button'};
}
export function getNinePairCardState(c: NinePairConfig, s: NinePairState, card: NinePairCard, frame: number) {
  const completed = s.matched.includes(card.pair);
  const fading = s.feedback?.id === 'correct' && s.feedback.pair === card.pair;
  const sourceAlpha = at(card.alpha, frame, 0);
  const factor = completed ? 0 : fading ? Math.max(0, 1 - s.fadeTick * c.fade.alphaStep / 100) : 1;
  return {alpha: sourceAlpha * factor, sourceAlpha, selected: s.selected === card.id,
    hidden: completed || (fading && s.fadeTick >= c.fade.hideTick),
    reveal: completed || (fading && s.fadeTick >= 1)};
}
export function getNinePairSnapshot(c: NinePairConfig, state: SourceStaticCanvasFrameState, r: RuntimeContext,
  stored = createNinePairState(r.seed, r.replay ?? 0), activities: readonly LessonTextActivitySnapshot[] = []): TextPresentationSnapshot {
  const blockers: string[] = [];
  if (state.status !== 'ready' || state.blocker || state.animationId !== c.animationId || state.sourceSwfSha256 !== c.sourceSha256) blockers.push('source-identity-mismatch');
  if (r.lang !== 'en' || state.language !== 'en') blockers.push('spanish-text-not-source-verified');
  if (r.scenario !== 'source-static-frame' || state.scenario !== r.scenario || r.entryStateSha256) blockers.push('original-renderer-required');
  if ((r.frameDomain ?? c.frameDomain) !== c.frameDomain || state.frameDomain !== c.frameDomain || !Number.isInteger(r.frame) || r.frame < 1 || r.frame > c.frameCount || state.frame !== r.frame || state.rootFrame !== c.rootFrame || (r.rootFrame !== undefined && r.rootFrame !== c.rootFrame) || state.seed !== (r.seed >>> 0)) blockers.push('teaching-state-identity-mismatch');
  const s = synchronizeNinePairState(c, stored, r), seen = observeNinePairFeedback(c, s, activities);
  const visible = (id: string): boolean => {
    if (id === 'root-title') return true;
    if (id === 'exercise-number') return at(c.exerciseAlpha, r.frame, 0) > 0;
    if (id.startsWith('help-')) return s.help;
    if (s.help) return false;
    if (id === 'need-help') return at(c.help.buttonAlpha, r.frame, 0) > 0;
    if (id.startsWith('feedback-')) return seen.labels.some(row => row.id === id && row.alpha > 0);
    const prompt = c.prompts.find(row => row.id === id);
    if (prompt) return at(prompt.alpha, r.frame, 0) > 0;
    const card = c.cards.find(row => row.blockId === id);
    return Boolean(card && getNinePairCardState(c, s, card, r.frame).alpha > 0);
  };
  return {schemaVersion: 1, animationId: c.animationId, bindingVersion: c.binding.version, sourceSwfSha256: c.sourceSha256,
    status: blockers.length ? 'blocked' : 'ready', blockers,
    identity: {frame: state.frame, frameDomain: state.frameDomain, rootFrame: state.rootFrame, scenario: state.scenario, language: state.language, seed: state.seed, replay: r.replay ?? 0},
    suppressedInstances: [], blocks: blockers.length ? [] : c.binding.blocks.map(block => ({...block, text: c.text[block.id] ?? '', visible: visible(block.id)}))};
}

const CSS = `
.g4l4-pairs{box-sizing:border-box;container:g4pairs / inline-size;inline-size:100%;min-inline-size:0;margin:auto;padding:.8rem;background:#fffdf7;color:#17273c;font:1.125rem/1.6 var(--lesson-font-body,system-ui,sans-serif)}
.g4l4-pairs *{box-sizing:border-box}.g4l4-pairs [hidden]{display:none!important}
.g4l4-pairs h2{font:700 2rem/1.3 var(--lesson-font-display,system-ui,sans-serif);margin:0 0 .65em;overflow-wrap:normal;word-break:normal;hyphens:none}
.g4l4-pairs p{margin:.55em 0;overflow-wrap:normal;word-break:normal;hyphens:none}
.g4l4-pairs button{font:inherit;min-inline-size:44px;min-block-size:44px;touch-action:manipulation;cursor:pointer}.g4l4-pairs button:disabled{cursor:default}
.g4l4-pairs button:focus-visible,.g4l4-pairs [tabindex]:focus-visible{outline:3px solid #1556a0;outline-offset:3px}
.g4l4-pairs__number{display:inline-flex;justify-content:center;align-items:center;inline-size:1.75em;block-size:1.75em;margin-inline-end:.5em;border-radius:50%;background:#203958;color:white;font-weight:700}
.g4l4-pairs__term{color:#164fa2;border:0;background:transparent;padding:0;text-align:start;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.15em}
.g4l4-pairs__board{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:1rem;align-items:start;margin-block:.8rem}
.g4l4-pairs__port{max-inline-size:100%;min-inline-size:0;overflow-x:auto;overscroll-behavior-inline:contain;padding:.25rem}
.g4l4-pairs__answers{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(3,minmax(0,1fr));position:relative;margin:auto;background:#eef2f6;border:1px solid #4f7299}
.g4l4-pairs__photo{display:block;inline-size:100%;block-size:100%;pointer-events:none}.g4l4-pairs__underlay{position:absolute;inset:0}
.g4l4-pairs__tile{position:relative;min-inline-size:0;min-block-size:0;border:1px solid #9aacc0}
.g4l4-pairs__tile>.g4l4-pairs__photo{position:absolute;inset:0}
.g4l4-pairs__card{position:relative;inline-size:100%;block-size:100%;white-space:nowrap;padding:.35rem .15rem;border:2px solid #557493;background:#fffdf4;color:inherit;font-weight:700!important;font-variant-numeric:tabular-nums;transition:none!important}
.g4l4-pairs__card[aria-pressed="true"]{border:4px solid #1765b3;background:#dcecff}
.g4l4-pairs__problems{display:grid;gap:.25rem;inline-size:100%;min-inline-size:0}
.g4l4-pairs__problem{min-block-size:44px;background:#e8eed2;border-radius:.2rem}.g4l4-pairs__problem>.g4l4-pairs__card{padding:.4rem .25rem}
.g4l4-pairs__feedback{border:2px solid #286b45;background:#eff9f2;border-radius:.6rem;padding:.5rem .8rem;scroll-margin-block-start:calc(var(--lesson-platform-header-height,0px) + 1rem)}
.g4l4-pairs__feedback[data-feedback-kind="wrong"]{border-color:#9d4d36;background:#fff4ef}
.g4l4-pairs__dialog{background:#f3f8ff;border:2px solid #3b678f;border-radius:.7rem;padding:.7rem;scroll-margin-block-start:calc(var(--lesson-platform-header-height,0px) + 1rem)}
.g4l4-pairs__dialog h3{font:600 1.25rem/1.65 var(--lesson-font-body,system-ui,sans-serif);margin:0 0 .75rem;overflow-wrap:normal;word-break:normal}
.g4l4-pairs__math{display:grid;grid-template-columns:repeat(4,1.8rem);justify-content:center;text-align:center;align-items:end;gap:.12rem;margin:1rem auto;font-weight:600;line-height:1.4;font-variant-numeric:tabular-nums}
.g4l4-pairs__carry{font-size:1.15rem;color:#174c84}.g4l4-pairs__nested{display:grid;justify-items:center}.g4l4-pairs__small-carry{font-size:1rem}
.g4l4-pairs__strike{position:relative;display:inline-block;text-decoration:none}.g4l4-pairs__strike:after{content:'';position:absolute;inset-inline:0;inset-block-start:50%;border-block-start:2px solid currentColor;transform:rotate(-45deg)}
.g4l4-pairs__rule{grid-column:1/-1;border-block-start:2px solid #17273c}
.g4l4-pairs__action{padding:.5rem .8rem;background:#1757af;color:white;border:1px solid #1757af;border-radius:.5rem}
.g4l4-pairs__complete{margin:1rem auto;max-inline-size:30rem;inline-size:100%;border:1px solid #6683a1}.g4l4-pairs__complete>.g4l4-pairs__photo{block-size:auto}
@container g4pairs (max-width:42rem){.g4l4-pairs__board{grid-template-columns:minmax(0,1fr)}.g4l4-pairs h2{font-size:1.5rem}}
@media(max-width:480px){.g4l4-pairs{padding-inline:0}
 .lesson-shell2 .lesson-shell2__legacy-stage:has(.runtime-shell[data-lesson-presentation='modern-text-v1'] .g4l4-pairs){width:calc(100vw - 8px);max-width:none;margin-inline:calc((100% - 100vw + 8px)/2)}
 .lesson-shell2 .lesson-shell2__legacy-stage:has(.runtime-shell[data-lesson-presentation='modern-text-v1'] .g4l4-pairs)>.lesson-shell2__stage{padding-inline:2px}}
`;
function RewardImage({c, rect, label, character}: {c: NinePairConfig; rect: readonly number[]; label?: string; character?: number}) {
  return <svg className="g4l4-pairs__photo" viewBox={rect.join(' ')} preserveAspectRatio="none" role={label ? 'img' : undefined} aria-label={label} aria-hidden={!label} data-source-picture-shape={character}>
    <image href={c.reward.source} width={c.reward.intrinsic.width} height={c.reward.intrinsic.height} data-source-sha256={c.reward.sha256}/>
  </svg>;
}
export function NinePairScene({config: c, runtime: r, session: s, activities = [], onChoose, onHelp}: {
  config: NinePairConfig; runtime: AnimationRendererProps; session: NinePairState; activities?: readonly LessonTextActivitySnapshot[];
  onChoose?: (id: string) => void; onHelp?: (open: boolean) => void;
}) {
  const root = useRef<HTMLElement>(null), seen = observeNinePairFeedback(c, s, activities);
  const complete = r.frame > c.activityFrame;
  const enabled = !r.paused && r.frame === c.activityFrame && !s.feedback && !s.help && s.pendingFromFrame === null && !!r.onLessonActivityRequest && !!r.onLessonFrameRequest;
  useLayoutEffect(() => {
    const target = s.help ? 'help-dialog' : s.feedback ? 'feedback' : complete ? 'replay' : s.focusTarget;
    if (!target) return;
    const element = root.current?.querySelector<HTMLElement>(`[data-pair-focus="${target}"]`);
    if (!element) return;
    element.focus({preventScroll: true});
    const bounds = element.getBoundingClientRect(), header = parseFloat(getComputedStyle(element).getPropertyValue('--lesson-platform-header-height')) || 0;
    if (bounds.top < header + 12 || bounds.bottom > innerHeight - 12 || bounds.left < 0 || bounds.right > innerWidth) element.scrollIntoView({block: 'center', inline: 'nearest', behavior: 'instant'});
  }, [s.help, s.feedback?.serial, s.focusTarget, complete, r.replay]);
  const term = (label: string, key: string, scope: 'prompt' | 'help') => {
    const source = c.terms.find(row => row.key === key && row.scope === scope);
    if (!source) return label;
    return <button className="g4l4-pairs__term" type="button" data-source-keyterm={source.key} data-source-button={source.button} data-keyterm-entry-id={source.entryId}
      disabled={!r.onLessonHostRequest || !source.activeFrames.some(([start, end]) => start <= r.frame && r.frame < end)}
      onClick={event => r.onLessonHostRequest?.({type: 'open-keyterm', entryId: source.entryId, sourceAnimationId: c.animationId, playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume'}, {trigger: event.currentTarget, keyTermIndexLanguage: 'en'})}>{label}</button>;
  };
  const card = (id: string) => {
    const definition = c.cards.find(row => row.id === id)!, state = getNinePairCardState(c, s, definition, r.frame);
    return <button type="button" className="g4l4-pairs__card" data-lesson-text-block={definition.blockId} data-pair-card={id} data-pair-focus={id}
      data-source-instance={definition.sourceInstanceId} data-source-character={definition.sourceCharacter} data-pair-alpha={state.alpha} data-pair-reveal={state.reveal} data-pair-hidden={state.hidden}
      aria-pressed={state.selected} aria-hidden={state.alpha <= 0} disabled={!enabled || state.alpha <= 0 || !onChoose}
      style={{opacity: state.alpha, visibility: state.hidden || state.sourceAlpha <= 0 ? 'hidden' : 'visible'}} onClick={() => onChoose?.(id)}>{definition.text}</button>;
  };
  const helpLife = c.help.buttonLifetime, helpEnabled = !s.help && !r.paused && r.frame >= helpLife.firstFrame && r.frame < helpLife.lastFrameExclusive;
  const carryByText = (text: string) => c.help.carry.find(row => row.text === text)!;
  const carry = (text: string, className = '') => {
    const row = carryByText(text);
    return <span className={className} data-lesson-text-block={row.id} data-source-text-character={row.character}>{text}</span>;
  };
  return <section ref={root} className="g4l4-pairs" lang="en" data-modern-text-page={c.animationId} data-lesson-text-status="ready" data-lesson-frame={r.frame} data-lesson-replay={r.replay ?? 0}
    data-pair-mode={s.help ? 'help' : s.feedback ? s.feedback.id : complete ? 'complete' : r.frame === c.activityFrame ? 'matching' : 'intro'}
    data-pair-selected={s.selected ?? ''} data-pair-matched={s.matched.join(',')} data-pair-attempts={s.attempts} data-source-score={s.score} data-pair-fade-tick={s.fadeTick}
    data-feedback-activity-id={seen.bound ? seen.activity!.id : ''} data-feedback-activity-frame={seen.bound ? seen.activity!.frame : ''}>
    <style>{CSS}</style><h2 data-lesson-text-block="root-title">{c.text['root-title']}</h2>
    <span className="g4l4-pairs__number" data-lesson-text-block="exercise-number" aria-hidden={at(c.exerciseAlpha, r.frame, 0) <= 0} style={{opacity: at(c.exerciseAlpha, r.frame, 0), visibility: at(c.exerciseAlpha, r.frame, 0) > 0 ? 'visible' : 'hidden'}}>{c.text['exercise-number']}</span>
    <div hidden={s.help}>
      {c.prompts.map(prompt => <p key={prompt.id} data-lesson-text-block={prompt.id} aria-hidden={at(prompt.alpha, r.frame, 0) <= 0} style={{opacity: at(prompt.alpha, r.frame, 0), visibility: at(prompt.alpha, r.frame, 0) > 0 ? 'visible' : 'hidden'}}>
        {prompt.tokens.map((token, index) => <span key={index} style={{color: token.color}}>{token.text === 'sum' ? term('sum', 'Sum', 'prompt') : token.text}</span>)}
      </p>)}
      {s.feedback && <div className="g4l4-pairs__feedback" data-feedback-kind={s.feedback.id} data-pair-focus="feedback" role="status" aria-live="polite" tabIndex={-1}>
        {seen.labels.filter(row => row.alpha > 0).map(row => <p key={row.id} data-lesson-text-block={row.id} style={{opacity: row.alpha}}>{c.text[row.id]}</p>)}
      </div>}
      {!complete && r.frame >= 5 && <div className="g4l4-pairs__board">
        <div className="g4l4-pairs__port" role="region" aria-label="Answer tiles" tabIndex={0} onKeyDown={event => {
          if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault(); const port = event.currentTarget;
          port.scrollLeft = event.key === 'Home' ? 0 : event.key === 'End' ? port.scrollWidth : port.scrollLeft + (event.key === 'ArrowRight' ? 1 : -1) * c.layout.keyboardScrollStep;
        }}>
          <div className="g4l4-pairs__answers" style={{minInlineSize: c.layout.answerMinimumRem + 'rem', maxInlineSize: c.layout.answerMaximumRem + 'rem', aspectRatio: c.reward.fullCrop.rect[2] / c.reward.fullCrop.rect[3]}}>
            {(c.reward.mode === 'underlay-reveal' || r.frame < c.activityFrame) && r.frame >= 5 && <div className="g4l4-pairs__underlay"><RewardImage c={c} rect={(r.frame < c.activityFrame ? c.reward.introCrop : c.reward.fullCrop).rect} character={(r.frame < c.activityFrame ? c.reward.introCrop : c.reward.fullCrop).character}/></div>}
            {c.answerOrder.map(id => {
              const definition = c.cards.find(row => row.id === id)!, current = getNinePairCardState(c, s, definition, r.frame), tile = c.reward.tiles.find(row => row.cardId === id)!;
              return <div className="g4l4-pairs__tile" key={id} data-reward-card={id} data-reward-visible={current.reveal}>
                {c.reward.mode === 'paired-image-reveal' && current.reveal && <RewardImage c={c} rect={tile.rect} character={tile.sourceCharacter}/>}{card(id)}
              </div>;
            })}
          </div>
        </div>
        <div className="g4l4-pairs__problems" role="group" aria-label="Problems">{c.problemOrder.map(id => <div className="g4l4-pairs__problem" key={id}>{card(id)}</div>)}</div>
      </div>}
      {complete && <figure className="g4l4-pairs__complete" data-complete-picture="true"><RewardImage c={c} rect={c.reward.fullCrop.rect} character={c.reward.fullCrop.character} label="Completed picture"/></figure>}
      {at(c.help.buttonAlpha, r.frame, 0) > 0 && <LessonSourceButton runtime={r} activityId="help-down" type="button" className="g4l4-pairs__action" data-lesson-text-block="need-help" data-pair-focus="help-button" data-source-button={c.help.button} disabled={!helpEnabled || !onHelp} onClick={() => onHelp?.(true)}>{c.text['need-help']}</LessonSourceButton>}
    </div>
    {s.help && <div className="g4l4-pairs__dialog" role="dialog" aria-modal="true" aria-label="Need More Help" tabIndex={-1} data-pair-focus="help-dialog" onKeyDown={event => {
      if (event.key === 'Escape') {event.preventDefault(); if (!r.paused) onHelp?.(false); return;}
      if (event.key !== 'Tab') return;
      const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
      if (!buttons.length) {event.preventDefault(); return;}
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      if (event.shiftKey && index <= 0) {event.preventDefault(); buttons.at(-1)!.focus();}
      else if (!event.shiftKey && (index < 0 || index === buttons.length - 1)) {event.preventDefault(); buttons[0].focus();}
    }}>
      <h3 data-lesson-text-block="help-heading">Example of {term(c.help.operator === '+' ? 'Addition' : 'Subtraction', c.help.operator === '+' ? 'Addition' : 'Subtraction', 'help')} {term('Problem', 'Problem', 'help')}{c.help.operator === '+' ? ':' : ''}</h3>
      <div className="g4l4-pairs__math" style={{fontSize: c.layout.mathFontRem + 'rem'}} role="group" aria-label={c.text['help-math']}>
        {c.help.operator === '+' ? <><span/><span className="g4l4-pairs__carry" data-lesson-text-block={c.help.carry[0].id} data-source-text-character={c.help.carry[0].character}>1</span><span className="g4l4-pairs__carry" data-lesson-text-block={c.help.carry[0].id} data-source-text-character={c.help.carry[0].character}>1</span><span/></> : <>
          <span/>{carry('3', 'g4l4-pairs__carry')}<span className="g4l4-pairs__carry g4l4-pairs__nested">{carry('10', 'g4l4-pairs__small-carry')}<s className="g4l4-pairs__strike" data-source-strike-shape={c.help.strikeShape}>{carry('0')}</s></span>{carry('12', 'g4l4-pairs__carry')}
        </>}
        {['', ...c.help.top, c.help.operator, ...c.help.bottom].map((value, index) => <span key={index} data-lesson-text-block="help-math">{c.help.operator === '−' && index > 0 && index < 4 ? <s className="g4l4-pairs__strike" data-source-strike-shape={c.help.strikeShape}>{value}</s> : value}</span>)}
        <span className="g4l4-pairs__rule" aria-hidden="true" data-source-rule-shape={c.help.strikeShape}/>
        {['', ...c.help.result].map((value, index) => <span key={index} data-lesson-text-block="help-math">{value}</span>)}
      </div>
      <LessonSourceButton runtime={r} activityId="close-down" type="button" className="g4l4-pairs__action" data-lesson-text-block="help-close" data-source-button={c.help.closeButton} disabled={!!r.paused || !onHelp} onClick={() => onHelp?.(false)}>{c.text['help-close']}</LessonSourceButton>
    </div>}
    {complete && !s.help && <p><button type="button" className="g4l4-pairs__action" data-pair-focus="replay" disabled={!r.onReplay} onClick={r.onReplay}>Replay</button></p>}
  </section>;
}

export function createNinePairPresentation(c: NinePairConfig, getFrameState: (frame: number, r: RuntimeContext) => SourceStaticCanvasFrameState, Fallback: React.ComponentType<AnimationRendererProps>): LessonTextPresentationCapability<SourceStaticCanvasFrameState> {
  validateLessonTextBinding(c.binding);
  function Renderer(r: AnimationRendererProps) {
    const context = {...r, frameDomain: r.frameDomain ?? c.frameDomain};
    const state = (r.state ?? getFrameState(r.frame, context)) as SourceStaticCanvasFrameState;
    const [stored, setStored] = useState(() => createNinePairState(r.seed, r.replay ?? 0, r.frame));
    const s = synchronizeNinePairState(c, stored, context), live = useRef(s); live.current = s;
    const activities = r.lessonActivities ?? (r.lessonActivity ? [r.lessonActivity] : []);
    const seen = observeNinePairFeedback(c, s, activities), snapshot = getNinePairSnapshot(c, state, context, s, activities);
    const ready = snapshot.status === 'ready', consumed = useRef<string | null>(null);
    const apply = (next: NinePairState) => {if (next !== live.current) {live.current = next; setStored(next);}};
    // Reuse the established pause-preserving remaining-time pattern. This is the
    // source's independent 200ms card interval, not a fabricated child timeline.
    const fadeClock = useRef({phase: '', remainingMs: 0});
    const fadeSerial = s.feedback?.id === 'correct' ? s.feedback.serial : null;
    const identity = `${s.seed}:${s.replay}`;
    useEffect(() => {
      if (!ready || fadeSerial === null || s.fadeTick >= c.fade.hideTick || r.frame !== c.activityFrame) {fadeClock.current = {phase: '', remainingMs: 0}; return;}
      const phase = `${identity}:${fadeSerial}:${s.fadeTick}`;
      if (fadeClock.current.phase !== phase) fadeClock.current = {phase, remainingMs: c.fade.intervalMs};
      if (r.paused) return;
      const startedAt = performance.now(); let fired = false;
      const timeout = window.setTimeout(() => {
        fired = true; fadeClock.current.remainingMs = 0;
        if (live.current.seed !== s.seed || live.current.replay !== s.replay) return;
        apply(tickNinePairFade(c, live.current, fadeSerial));
      }, fadeClock.current.remainingMs);
      return () => {
        window.clearTimeout(timeout);
        if (!fired && fadeClock.current.phase === phase) fadeClock.current.remainingMs = Math.max(0, fadeClock.current.remainingMs - (performance.now() - startedAt));
      };
    }, [ready, fadeSerial, s.fadeTick, identity, r.frame, r.paused]);
    useEffect(() => {
      if (!ready || r.paused || !s.feedback || !seen.bound || !seen.activity) return;
      if (s.feedbackRevision === null) {apply({...s, feedbackRevision: seen.activity.revision}); return;}
      if (!seen.complete) return;
      const token = `${identity}:${seen.activity.id}:${seen.activity.revision}`;
      if (consumed.current === token) return;
      const next = finishNinePairFeedback(c, live.current, {...r, lessonActivities: activities});
      if (next !== live.current) {consumed.current = token; apply(next);}
    }, [ready, r, s, seen.bound, seen.complete, seen.activity]);
    if (!ready) return <Fallback {...r} state={state}/>;
    return <NinePairScene config={c} runtime={r} session={s} activities={activities}
      onChoose={id => apply(chooseNinePairCard(c, live.current, id, {...r, lessonActivities: activities}))}
      onHelp={open => apply(setNinePairHelp(c, live.current, open, r))}/>;
  }
  return {schemaVersion: 1, binding: c.binding, Renderer, getSnapshot: (s, r) => getNinePairSnapshot(c, s, r),
    playbackMode: 'once', playbackEndFrameByDomain: {[c.frameDomain]: c.activityFrame}, reducedMotionFrameByDomain: {[c.frameDomain]: c.activityFrame},
    frameControl: {frameDomain: c.frameDomain, completionFrame: c.frameCount, transitions: [{fromFrame: c.activityFrame, toFrame: c.activityFrame + 1, stopFrame: c.frameCount}]},
    activityTimelines: c.activities, sourceTimelineAudioCues: c.sourceAudio, keyTerms: c.keyTerms};
}
