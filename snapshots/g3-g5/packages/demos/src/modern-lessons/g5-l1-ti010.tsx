'use client';

import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import type {AnimationRendererProps, RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition, LessonTextActivityRequest, LessonTextActivitySnapshot, LessonTextBinding, LessonTextBlockBinding, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {getCourseG05L01Ti010FrameState} from '../modules/course-g05-l01-ti-010';
import {LessonSourceButton} from '../lesson-source-button';
import {SourceChoiceText} from './source-six-question-choice';
import {G5_L1_TI010_SOURCE_DATA as S} from './generated/g5-l1-ti010-source-v1';

const ID = S.animationId, DOMAIN = S.frameDomain;
// Raw shape33 is authored outlined lettering at root6/depth1.
export const G5_L1_TI010_ROOT_TITLE = 'Place Value: Try It!';
export const G5_L1_TI010_TERMS = Object.freeze({
  'Decimal Number': {entryId: 'en-0137-09788801a958', buttons: [14]},
  'Round / Rounding': {entryId: 'en-0591-985f6684fc7d', buttons: [15]},
  Digit: {entryId: 'en-0156-78eead3d9112', buttons: [30]},
  'Whole numbers': {entryId: 'en-0749-f97ce9cc1311', buttons: [39]},
});
export type G5L1Ti010Choice = typeof S.choices[number]['letter'];
export interface G5L1Ti010Session {
  seed: number;
  replay: number;
  tries: number;
  help: boolean;
  feedback: {id: string; selected: G5L1Ti010Choice; phase: 'intro' | 'waiting' | 'outro' | 'correct'; revisionFloor: number} | null;
  pendingFromFrame: number | null;
  outcome: 'correct' | 'two-wrong-continuation' | null;
  focus: string | null;
}
export function createG5L1Ti010Session(seed = 0, replay = 0): G5L1Ti010Session {
  return {seed: seed >>> 0, replay, tries: 0, help: false, feedback: null, pendingFromFrame: null, outcome: null, focus: null};
}
export function synchronizeG5L1Ti010Session(session: G5L1Ti010Session, context: RuntimeContext) {
  if (session.seed !== (context.seed >>> 0) || session.replay !== (context.replay ?? 0)) return createG5L1Ti010Session(context.seed, context.replay ?? 0);
  return {...session, ...(context.frame !== 208 ? {help: false, feedback: null} : {}), ...(session.pendingFromFrame !== null && session.pendingFromFrame !== context.frame ? {pendingFromFrame: null} : {})};
}
const sourceAudio = (id: string) => {
  const audio = S.audio.find(a => a.id === id);
  if (!audio) throw new Error('Missing source audio ' + id);
  return {...audio, language: 'shared' as const, spokenLanguage: 'undetermined' as const};
};
export const G5_L1_TI010_ACTIVITIES: readonly LessonTextActivityDefinition[] = Object.freeze([
  ...S.feedback.flatMap(branch => {
    const common = {sourceInstanceId: branch.sourceInstanceId, parentLifetime: branch.parentLifetime, frameDomain: `sprite-${branch.sprite}`, fps: 12, parentFrames: [208], audio: sourceAudio(branch.id)};
    return branch.kind === 'wrong' ? [
      {...common, id: branch.id + '-intro', startFrame: 2, endFrame: 22},
      {...common, id: branch.id + '-outro', startFrame: 23, endFrame: branch.endFrame, entryFromActivity: {id: branch.id + '-intro', firstFrame: branch.popupFrames[0][0], lastFrame: 22}},
    ] : [{...common, id: branch.id, startFrame: 2, endFrame: branch.endFrame}];
  }),
  {id: 'help-open-down', sourceInstanceId: S.help.openSourceInstanceId, parentLifetime: S.help.parentLifetime, buttonPress: {sourceButtonId: 32}, frameDomain: 'sprite-8', startFrame: 1, endFrame: 5, fps: 12, parentFrames: [208], audio: sourceAudio('help-open-click')},
  {id: 'help-close-down', sourceInstanceId: S.help.closeSourceInstanceId, parentLifetime: S.help.parentLifetime, buttonPress: {sourceButtonId: 23}, frameDomain: 'sprite-22', startFrame: 1, endFrame: 5, fps: 12, parentFrames: [208], audio: sourceAudio('help-close-click')},
  ...S.feedback.filter(branch => branch.kind === 'wrong').map(branch => ({id: branch.id + '-close-down', sourceInstanceId: branch.closeSourceInstanceId, parentLifetime: branch.parentLifetime, buttonPress: {sourceButtonId: 73}, frameDomain: 'sprite-72', startFrame: 1, endFrame: 5, fps: 12, parentFrames: [208], audio: sourceAudio('wrong-close-click')})),
]);
export function getG5L1Ti010ActivityId(session: G5L1Ti010Session) {
  const f = session.feedback;
  return f ? f.phase === 'correct' ? f.id : f.id + (f.phase === 'outro' ? '-outro' : '-intro') : null;
}
export function getG5L1Ti010Feedback(session: G5L1Ti010Session, activities: readonly LessonTextActivitySnapshot[]) {
  const id = getG5L1Ti010ActivityId(session), definition = G5_L1_TI010_ACTIVITIES.find(d => d.id === id), branch = S.feedback.find(b => b.id === session.feedback?.id);
  const activity = activities.find(a => a.id === id && a.frameDomain === definition?.frameDomain && a.sourceInstanceId === definition?.sourceInstanceId && a.revision > (session.feedback?.revisionFloor ?? Infinity) && a.frame >= definition!.startFrame && a.frame <= definition!.endFrame);
  return {id, definition, branch, activity, complete: !!activity && activity.status === 'completed' && activity.frame === definition?.endFrame,
    titleVisible: !!activity && !!branch && branch.visibleFrames.some(([first, last]) => activity.frame >= first && activity.frame <= last),
    popupVisible: !!activity && branch?.kind === 'wrong' && session.feedback?.phase !== 'outro' && branch.popupFrames.some(([first, last]) => activity.frame >= first && activity.frame <= last)};
}
export type G5L1Ti010Action =
  | {type: 'answer'; choice: G5L1Ti010Choice; revisionFloor?: number}
  | {type: 'help' | 'close-help'}
  | {type: 'activity-complete'; activity: LessonTextActivitySnapshot}
  | {type: 'close-feedback'; activity: LessonTextActivitySnapshot};
export function reduceG5L1Ti010Session(session: G5L1Ti010Session, frame: number, action: G5L1Ti010Action) {
  const no = (reason: string) => ({allowed: false as const, reason, state: session, frameRequest: null, activityRequest: null});
  const yes = (state: G5L1Ti010Session, frameRequest: typeof S.transitions[number] | null = null, activityRequest: LessonTextActivityRequest | null = null) => ({allowed: true as const, reason: null, state, frameRequest, activityRequest});
  if (frame !== 208 || session.pendingFromFrame === 208) return no('source-quiz-not-available');
  if (action.type === 'help') return session.help || session.feedback ? no('source-help-not-available') : yes({...session, help: true, focus: 'help-dialog'});
  if (action.type === 'close-help') return session.help ? yes({...session, help: false, focus: 'help'}) : no('source-help-not-open');
  if (session.help) return no('source-help-open');
  if (action.type === 'answer') {
    if (session.feedback || !S.choices.some(c => c.letter === action.choice)) return no('source-answer-not-available');
    const kind = action.choice === 'B' ? 'correct' : 'wrong', branches = S.feedback.filter(b => b.kind === kind), branch = branches[(session.seed + session.tries) % branches.length];
    const next: G5L1Ti010Session = {...session, feedback: {id: branch.id, selected: action.choice, phase: kind === 'correct' ? 'correct' : 'intro', revisionFloor: action.revisionFloor ?? -1}, focus: 'feedback'};
    return yes(next, null, {id: getG5L1Ti010ActivityId(next)!, parentFrame: 208});
  }
  if (!session.feedback) return no('source-feedback-not-open');
  if (action.type === 'close-feedback') {
    if (!getG5L1Ti010Feedback(session, [action.activity]).popupVisible) return no('source-close-not-visible');
    const next: G5L1Ti010Session = {...session, feedback: {...session.feedback, phase: 'outro', revisionFloor: action.activity.revision}, focus: 'feedback'};
    return yes(next, null, {id: getG5L1Ti010ActivityId(next)!, parentFrame: 208, fromActivity: {id: action.activity.id, revision: action.activity.revision}});
  }
  if (action.type === 'activity-complete') {
    if (!getG5L1Ti010Feedback(session, [action.activity]).complete) return no('source-activity-not-completed');
    if (session.feedback.phase === 'intro') return yes({...session, feedback: {...session.feedback, phase: 'waiting'}});
    if (session.feedback.phase === 'waiting') return no('source-popup-awaits-close');
    const branch = S.feedback.find(b => b.id === session.feedback!.id)!;
    if (branch.kind === 'wrong' && session.tries === 0) return yes({...session, tries: 1, feedback: null, focus: 'choice-' + session.feedback.selected});
    return yes({...session, feedback: null, tries: branch.kind === 'wrong' ? 0 : session.tries, pendingFromFrame: 208, outcome: branch.kind === 'correct' ? 'correct' : 'two-wrong-continuation', focus: null}, S.transitions[0]);
  }
  return no('unknown-action');
}
const revealedText = (rows: readonly {frame: number; text: string}[], frame: number) => rows.filter(row => row.frame <= frame).at(-1)?.text ?? '';
export function getG5L1Ti010Teaching(frame: number) {
  return {question: S.question.map(q => ({...q, text: revealedText(q.reveal, frame)})), explanation: S.explanation.map(q => ({...q, text: revealedText(q.reveal, frame)})), clarification: frame >= S.questionCompleteFrame, choices: frame >= S.choicesFirstVisible, allChoices: frame <= S.allChoicesLastFrame, quiz: frame === 208, terminal: frame === 441};
}
const ids = (character: number) => S.textDefinitions.find(d => d.characterId === character)!.runs.map(r => r.sourceTextId);
const definitions: readonly {id: string; sourceTextIds: readonly string[]; sourceShapeIds?: readonly number[]; role: LessonTextBlockBinding['role']; text: string}[] = [
  {id: 'root-title', sourceTextIds: [], sourceShapeIds: [33], role: 'title', text: G5_L1_TI010_ROOT_TITLE},
  ...S.question.map(q => ({id: 'question-' + q.characterId, sourceTextIds: q.sourceTextIds, role: 'question' as const, text: q.fullText})),
  {id: 'source-order-clarification', sourceTextIds: S.clarificationSource.sourceTextIds, role: 'body' as const, text: S.clarification},
  ...S.choices.map(c => ({id: 'choice-' + c.letter, sourceTextIds: [...ids(c.letterCharacter), ...ids(c.characterId)], role: 'answer' as const, text: c.letter + '. ' + c.text})),
  ...S.explanation.map(q => ({id: 'explanation-' + q.characterId, sourceTextIds: q.sourceTextIds, role: 'body' as const, text: q.fullText})),
  ...S.helpText.map(q => ({id: 'help-' + q.characterId, sourceTextIds: q.runs.map(r => r.sourceTextId), role: 'body' as const, text: q.runs.map(r => r.text).join('').replace(/\s+/g, ' ').trim()})),
  ...S.feedback.map(branch => ({id: 'feedback-' + branch.id, sourceTextIds: branch.characters.flatMap(ids), role: 'feedback' as const, text: branch.text})),
  {id: 'dynamic-feedback', sourceTextIds: ['character-67'], role: 'feedback' as const, text: S.wrongCopy.first},
  {id: 'help-label', sourceTextIds: [...ids(4), ...ids(5)], role: 'label', text: 'Need More Help'},
  {id: 'close-label', sourceTextIds: ids(17), role: 'label', text: 'Close'},
];
export const G5_L1_TI010_TEXT_BINDING: LessonTextBinding = Object.freeze({schemaVersion: 1, version: 'g05-l01-placement-071-modern-text-v2', placementId: S.placementId, animationId: ID, sourceSwfSha256: S.sourceSha256, template: 'exercise', blocks: definitions.map((d, i) => ({id: d.id, sourceTextIds: d.sourceTextIds, ...(d.sourceShapeIds ? {sourceShapeIds: d.sourceShapeIds} : {}), role: d.role as LessonTextBlockBinding['role'], language: 'en' as const, readingOrder: i, valueSource: 'maintained-page-state' as const}))});
export function getG5L1Ti010TextSnapshot(state: SourceStaticCanvasFrameState, context: RuntimeContext, session = createG5L1Ti010Session(context.seed, context.replay ?? 0), activities: readonly LessonTextActivitySnapshot[] = []): TextPresentationSnapshot {
  const expected = getCourseG05L01Ti010FrameState(context.frame, {...context, frameDomain: context.frameDomain ?? DOMAIN}), blockers: string[] = [];
  if (state.animationId !== ID || state.sourceSwfSha256 !== S.sourceSha256) blockers.push('source-identity-mismatch');
  if (state.frameDomain !== DOMAIN || (context.frameDomain ?? DOMAIN) !== DOMAIN || state.scenario !== 'source-static-frame' || context.scenario !== state.scenario) blockers.push('unsupported-source-domain-or-scenario');
  if (state.language !== 'en' || context.lang !== 'en') blockers.push('source-verified-Spanish-text-missing');
  if (context.entryStateSha256) blockers.push('source-capture-requires-original-renderer');
  if (!Number.isInteger(context.frame) || context.frame < 1 || context.frame > 441 || state.frame !== context.frame || state.rootFrame !== 6 || context.rootFrame !== undefined && context.rootFrame !== 6 || state.seed !== expected.seed) blockers.push('teaching-state-identity-mismatch');
  if (state.status !== expected.status || state.blocker !== expected.blocker || state.exportFrame !== expected.exportFrame || state.rootState !== expected.rootState || state.sourceStaticVisualReady !== expected.sourceStaticVisualReady || state.interactiveControlsEnabled !== false || state.sourceHostBehaviorResolved !== false || state.naturalRuntimeEstablished !== false || state.audioRendered !== false || JSON.stringify(state.visibleSourceMarkers) !== JSON.stringify(expected.visibleSourceMarkers)) blockers.push('unexpected-original-static-state');
  const current = synchronizeG5L1Ti010Session(session, context), teaching = getG5L1Ti010Teaching(state.frame), feedback = getG5L1Ti010Feedback(current, activities);
  return {schemaVersion: 1, animationId: ID, bindingVersion: G5_L1_TI010_TEXT_BINDING.version, sourceSwfSha256: S.sourceSha256, status: blockers.length ? 'blocked' : 'ready', blockers, identity: {frame: state.frame, frameDomain: state.frameDomain, rootFrame: state.rootFrame, scenario: state.scenario, language: state.language, seed: state.seed, replay: context.replay ?? 0}, suppressedInstances: [], blocks: blockers.length ? [] : G5_L1_TI010_TEXT_BINDING.blocks.map(block => {
    let text = definitions.find(d => d.id === block.id)!.text, visible = false;
    if (block.id === 'root-title') visible = true;
    else if (block.id.startsWith('question-')) {text = teaching.question.find(q => block.id === 'question-' + q.characterId)!.text; visible = !!text && !current.help;}
    else if (block.id === 'source-order-clarification') visible = teaching.clarification && !current.help;
    else if (block.id.startsWith('choice-')) visible = teaching.choices && !current.help && (teaching.allChoices || block.id === 'choice-B');
    else if (block.id.startsWith('explanation-')) {text = teaching.explanation.find(q => block.id === 'explanation-' + q.characterId)!.text; visible = !!text && !current.help;}
    else if (block.id === 'help-label') visible = teaching.quiz && !current.feedback;
    else if (block.id.startsWith('help-')) visible = current.help;
    else if (block.id === 'close-label') visible = current.help || feedback.popupVisible;
    else if (block.id === 'dynamic-feedback') {text = current.tries === 0 ? S.wrongCopy.first : S.wrongCopy.second; visible = feedback.popupVisible;}
    else if (block.id.startsWith('feedback-')) visible = block.id === 'feedback-' + current.feedback?.id && feedback.titleVisible;
    return {...block, text, visible};
  })};
}
const CSS = `
.g5-l1-ti010{box-sizing:border-box;container:round-add / inline-size;inline-size:100%;max-inline-size:70rem;margin:auto;padding:clamp(12px,2cqi,24px);background:#fffdf8;color:#17273c;border-radius:1rem;font:1.25rem/1.6 var(--lesson-font-body,system-ui,sans-serif)}.g5-l1-ti010 *{box-sizing:border-box}.g5-l1-ti010 [hidden]{display:none!important}.g5-l1-ti010 p{margin:.65em 0;overflow-wrap:anywhere}.g5-l1-ti010 h2{font:600 1.5rem/1.4 var(--lesson-font-display,system-ui,sans-serif);margin:0 0 1rem;overflow-wrap:anywhere}.g5-l1-ti010 [data-lesson-text-block="root-title"]{font:700 clamp(1.75rem,2.7cqi,2.25rem)/1.25 var(--lesson-font-display,system-ui,sans-serif);margin:0 0 1rem;overflow-wrap:normal;word-break:normal;hyphens:none}.g5-l1-ti010 button{font:inherit;line-height:inherit;cursor:pointer;max-inline-size:100%}.g5-l1-ti010 button:disabled{cursor:default}.g5-l1-ti010 button:focus-visible,.g5-l1-ti010 [tabindex]:focus-visible{outline:3px solid #1757af;outline-offset:3px}
.g5-l1-ti010 .six-choice-modern__numeric-token{display:inline-block;max-inline-size:100%;white-space:nowrap;overflow-x:auto;vertical-align:bottom}.g5-l1-ti010__question,.g5-l1-ti010__help,.g5-l1-ti010__feedback{padding:clamp(12px,2cqi,24px);border:1px solid #b5c9e4;border-radius:.8rem;background:#f1f6ff}.g5-l1-ti010__direction{padding:1rem;border-inline-start:4px solid #1757af;background:#eaf2ff;font-weight:700}.g5-l1-ti010__choices{display:grid;grid-template-columns:minmax(0,1fr);gap:.8rem;margin-block:1rem}.g5-l1-ti010__choice{display:flex;align-items:center;gap:1rem;padding:.85rem 1rem;background:white;border:2px solid #718eae;border-radius:.8rem;text-align:start;color:inherit}.g5-l1-ti010__choice strong{font-weight:800}.g5-l1-ti010__choice[data-source-answer=true]{border-color:#23734d;background:#eef8f1}.g5-l1-ti010__answer{font-weight:700;font-variant-numeric:tabular-nums}
.g5-l1-ti010__term{padding:0 .05em;border:0;background:transparent;color:#1757af;text-decoration:underline;text-underline-offset:.15em;overflow-wrap:anywhere;white-space:normal}.g5-l1-ti010__action{padding:.65rem 1rem;border:1px solid #1757af;border-radius:.6rem;background:#1757af;color:white}.g5-l1-ti010__help,.g5-l1-ti010__feedback{margin-block:1rem;scroll-margin-block-start:calc(var(--lesson-platform-header-height,0px) + env(safe-area-inset-top) + 1rem)}.g5-l1-ti010__feedback{border:2px solid #95715e;background:#fff5eb}.g5-l1-ti010__feedback[data-kind=correct]{border-color:#23734d;background:#eef8f1}.g5-l1-ti010__explanation{padding:.8rem 1rem;margin-block:.7rem;background:#f2f6fc;border:1px solid #becce0;border-radius:.65rem}.g5-l1-ti010__explanation[data-source-method=round-each]{border-color:#23734d;background:#eef8f1}.g5-l1-ti010__example{white-space:nowrap;display:inline-block;font-variant-numeric:tabular-nums;max-inline-size:100%;overflow-x:auto;vertical-align:middle}.g5-l1-ti010__target{color:#a82025;background:#ffe9df;border-radius:.15em;padding-inline:.03em}.g5-l1-ti010__neighbor{font-weight:900;text-decoration:underline;text-underline-offset:.15em}.g5-l1-ti010__controls{display:flex;gap:.8rem;flex-wrap:wrap;margin-block:1rem}
@container round-add (min-width:45rem){.g5-l1-ti010__choices{grid-template-columns:repeat(2,minmax(0,1fr))}}@container round-add (max-width:25rem){.g5-l1-ti010{font-size:1.125rem}.g5-l1-ti010__choice{padding:.8rem;gap:.65rem}}
`;
export function G5L1Ti010ModernRenderer(props: AnimationRendererProps) {
  const context: RuntimeContext = {...props, frameDomain: props.frameDomain ?? DOMAIN}, state = (props.state ?? getCourseG05L01Ti010FrameState(props.frame, context)) as SourceStaticCanvasFrameState;
  const [stored, setStored] = useState(() => createG5L1Ti010Session(props.seed, props.replay ?? 0)), session = synchronizeG5L1Ti010Session(stored, context), activities = props.lessonActivities ?? (props.lessonActivity ? [props.lessonActivity] : []), feedback = getG5L1Ti010Feedback(session, activities), teaching = getG5L1Ti010Teaching(state.frame), snapshot = getG5L1Ti010TextSnapshot(state, context, session, activities), root = useRef<HTMLElement>(null), consumed = useRef<string | null>(null);
  const locked = snapshot.status !== 'ready' || props.paused === true;
  const apply = (action: G5L1Ti010Action) => {
    if (locked) return false;
    let result = reduceG5L1Ti010Session(session, state.frame, action);
    if (!result.allowed) return false;
    if (result.activityRequest) {
      if (action.type === 'answer') {const d = G5_L1_TI010_ACTIVITIES.find(d => d.id === result.activityRequest!.id)!;result = reduceG5L1Ti010Session(session, state.frame, {...action, revisionFloor: activities.find(a => a.sourceInstanceId === d.sourceInstanceId)?.revision ?? -1});}
      if (props.onLessonActivityRequest?.(result.activityRequest!) !== true) return false;
    }
    if (result.frameRequest && props.onLessonFrameRequest?.(result.frameRequest) !== true) return false;
    setStored(result.state); return true;
  };
  useEffect(() => {
    if (locked || !feedback.complete || !feedback.activity) return;
    const token = `${session.seed}:${session.replay}:${feedback.activity.id}:${feedback.activity.revision}`;
    if (token === consumed.current) return;
    if (apply({type: 'activity-complete', activity: feedback.activity})) consumed.current = token;
  }, [locked, feedback.complete, feedback.activity?.id, feedback.activity?.revision, session.feedback?.phase, props.onLessonFrameRequest]);
  useLayoutEffect(() => {
    const target = session.help ? 'help-dialog' : feedback.popupVisible ? 'wrong-dialog' : session.feedback ? 'feedback' : teaching.terminal ? 'replay' : session.focus ?? (teaching.quiz ? 'choice-A' : null);
    if (!target) return;
    const element = root.current?.querySelector<HTMLElement>(`[data-ti010-focus="${target}"]`);
    // Source intro-to-stop updates must not interrupt a key held on a dialog control.
    if (target.endsWith('dialog') && element?.contains(element.ownerDocument.activeElement)) return;
    element?.focus({preventScroll: target.endsWith('dialog')});if (target.endsWith('dialog')) element?.scrollIntoView({block: 'start', behavior: 'instant'});
  }, [session.help, session.feedback?.id, session.feedback?.phase, feedback.popupVisible, session.focus, teaching.quiz, teaching.terminal, props.replay]);
  if (snapshot.status !== 'ready') return null;
  const term = (name: keyof typeof G5_L1_TI010_TERMS, label: string) => <button type="button" className="g5-l1-ti010__term" data-keyterm-entry-id={G5_L1_TI010_TERMS[name].entryId} disabled={!props.onLessonHostRequest} onClick={event => props.onLessonHostRequest?.({type: 'open-keyterm', entryId: G5_L1_TI010_TERMS[name].entryId, sourceAnimationId: ID, playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume'}, {trigger: event.currentTarget})}>{label}</button>;
  const questionText = (text: string) => {const phrase = 'whole number', at = text.indexOf(phrase);return at < 0 ? <SourceChoiceText text={text}/> : <><SourceChoiceText text={text.slice(0, at)}/>{term('Whole numbers', phrase)}<SourceChoiceText text={text.slice(at + phrase.length)}/></>;};
  const close = () => session.help ? apply({type: 'close-help'}) : feedback.activity ? apply({type: 'close-feedback', activity: feedback.activity}) : false;
  const trap = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {event.preventDefault();close();return;}
    if (event.key !== 'Tab') return;
    const elements = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]')].filter(e => e.getClientRects().length), index = elements.indexOf(document.activeElement as HTMLElement);
    if (!elements.length) {event.preventDefault();return;}
    if (event.shiftKey && index <= 0 || !event.shiftKey && index === elements.length - 1) {event.preventDefault();elements[event.shiftKey ? elements.length - 1 : 0].focus();}
  };
  return <section className="g5-l1-ti010" ref={root} lang="en" data-modern-text-page={ID} data-lesson-frame={state.frame} data-lesson-text-status={snapshot.status} data-lesson-seed={session.seed} data-lesson-replay={session.replay} data-help-open={String(session.help)} data-feedback-id={session.feedback?.id ?? ''} data-feedback-activity-id={feedback.activity?.id ?? ''} data-feedback-frame={feedback.activity?.frame ?? ''} data-feedback-phase={session.feedback?.phase ?? ''} data-quiz-try-count={session.tries} data-terminal-outcome={session.outcome ?? ''}>
    <style>{CSS}</style>
    <h2 data-lesson-text-block="root-title">{G5_L1_TI010_ROOT_TITLE}</h2>
    <div hidden={session.help}>
      {teaching.question.some(q => q.text) && <div className="g5-l1-ti010__question"><p>{teaching.question.filter(q => q.text).map(q => <span key={q.characterId} data-lesson-text-block={'question-' + q.characterId}>{questionText(q.text)}{' '}</span>)}</p></div>}
      {teaching.clarification && <p className="g5-l1-ti010__direction" data-lesson-text-block="source-order-clarification" data-source-copy-kind="source-backed-clarification">{S.clarification}</p>}
      {teaching.choices && <div className="g5-l1-ti010__choices" role="group" aria-label="Answer choices">{S.choices.filter(c => teaching.allChoices || c.letter === 'B').map(c => <button key={c.letter} type="button" className="g5-l1-ti010__choice" data-ti010-focus={'choice-' + c.letter} data-lesson-text-block={'choice-' + c.letter} data-source-button={c.button} data-source-answer={state.frame > 208 && c.letter === 'B' ? 'true' : undefined} disabled={locked || !teaching.quiz || !!session.feedback || session.pendingFromFrame === 208} onClick={() => apply({type: 'answer', choice: c.letter})}><strong>{c.letter}.</strong><span className="g5-l1-ti010__answer"><SourceChoiceText text={c.text}/></span></button>)}</div>}
      {teaching.explanation.filter(q => q.text).map(q => <p key={q.characterId} className="g5-l1-ti010__explanation" data-source-method={q.characterId === 247 ? 'round-each' : undefined} data-lesson-text-block={'explanation-' + q.characterId}><SourceChoiceText text={q.text}/></p>)}
      {teaching.quiz && !session.feedback && <div className="g5-l1-ti010__controls"><LessonSourceButton runtime={props} activityId="help-open-down" type="button" className="g5-l1-ti010__action" data-ti010-focus="help" data-lesson-text-block="help-label" disabled={locked} onClick={() => apply({type: 'help'})}>Need More Help</LessonSourceButton></div>}
    </div>
    {session.feedback && <div className="g5-l1-ti010__feedback" role="status" aria-live="polite" tabIndex={-1} data-ti010-focus="feedback" data-kind={feedback.branch?.kind}>
      {feedback.titleVisible && <p data-lesson-text-block={'feedback-' + session.feedback.id}>{feedback.branch!.text}</p>}
      {feedback.popupVisible && <div role="dialog" aria-modal="true" aria-label="Try again" tabIndex={-1} data-ti010-focus="wrong-dialog" onKeyDown={trap}><p data-lesson-text-block="dynamic-feedback">{session.tries === 0 ? S.wrongCopy.first : S.wrongCopy.second}</p><LessonSourceButton runtime={props} activityId={session.feedback.id + '-close-down'} type="button" className="g5-l1-ti010__action" data-lesson-text-block="close-label" disabled={locked} onClick={close}>Close</LessonSourceButton></div>}
    </div>}
    {session.help && <div className="g5-l1-ti010__help" role="dialog" aria-modal="true" aria-label="Need More Help" tabIndex={-1} data-ti010-focus="help-dialog" onKeyDown={trap}>
      <h2 data-lesson-text-block="help-label">Need More Help</h2>
      <p data-lesson-text-block="help-11">Use the rules for {term('Round / Rounding', 'rounding')} {term('Decimal Number', 'decimal numbers')}.</p>
      <p data-lesson-text-block="help-12">Example: <SourceChoiceText text="$0.84"/> Round to nearest whole number.</p>
      <p data-lesson-text-block="help-29">Highlight the place you are rounding to: <span className="g5-l1-ti010__example" tabIndex={0}>$<strong className="g5-l1-ti010__target">0</strong>.84</span></p>
      <div data-lesson-text-block="help-25"><p>1. Look at the {term('Digit', 'digit')} to the right of the highlighted digit:</p><p><span className="g5-l1-ti010__example" tabIndex={0}>$<strong className="g5-l1-ti010__target">0</strong>.<strong className="g5-l1-ti010__neighbor">8</strong>4</span></p></div>
      <p data-lesson-text-block="help-26">2. If the digit is equal to or greater than <SourceChoiceText text="5"/>, increase the highlighted digit by <SourceChoiceText text="1"/>.</p>
      <p data-lesson-text-block="help-27">3. If the digit is less than <SourceChoiceText text="5"/>, do not change the highlighted digit.</p>
      <div data-lesson-text-block="help-28"><p>4. Drop the digits to the right of the rounded digit.</p><p><SourceChoiceText text="$0.84"/> rounded to the nearest whole number is <SourceChoiceText text="$1.00"/>.</p></div>
      <LessonSourceButton runtime={props} activityId="help-close-down" type="button" className="g5-l1-ti010__action" data-lesson-text-block="close-label" disabled={locked} onClick={close}>Close</LessonSourceButton>
    </div>}
    {teaching.terminal && <button type="button" className="g5-l1-ti010__action" data-ti010-focus="replay" disabled={!props.onReplay} onClick={props.onReplay}>Replay</button>}
  </section>;
}
const main = S.audio.find(a => a.id === 'main')!;
export const G5_L1_TI010_TEXT_PRESENTATION: LessonTextPresentationCapability<SourceStaticCanvasFrameState> = Object.freeze({schemaVersion: 1, binding: G5_L1_TI010_TEXT_BINDING, Renderer: G5L1Ti010ModernRenderer, getSnapshot: getG5L1Ti010TextSnapshot, playbackEndFrameByDomain: {[DOMAIN]: 208}, reducedMotionFrameByDomain: {[DOMAIN]: 208}, frameControl: {frameDomain: DOMAIN, completionFrame: 441, transitions: S.transitions}, activityTimelines: G5_L1_TI010_ACTIVITIES, sourceTimelineAudioCues: [{id: 'source-main', frame: main.firstFrame, endFrame: main.lastFrame + 1, frameDomain: DOMAIN, source: main.source, sha256: main.sha256, language: 'shared' as const, spokenLanguage: 'undetermined' as const}], keyTerms: {indexLanguage: 'en' as const, sourceAssetId: 'ELKTEG4.xml', sourceSha256: 'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749', entryIds: Object.values(G5_L1_TI010_TERMS).map(t => t.entryId)}});
