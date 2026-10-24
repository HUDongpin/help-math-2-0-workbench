'use client';

import React from 'react';
import type {AnimationRendererProps, AudioCue, AudioTrack, RuntimeContext} from '../contract';
import type {LessonTextBinding, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
import {CourseG03L01Vb009Renderer, getCourseG03L01Vb009FrameState} from '../modules/course-g03-l01-vb-009';
import {G3_L1_VB009_SOURCE} from './generated/g3-l1-vb009-source';

type Curve = readonly (readonly [number, number])[];
type Token = Readonly<{id: string; block: 'definition' | 'number' | 'suffix'; text: string; alpha: Curve; sourceTextIds: readonly string[]; sourceInstances: readonly string[]; termButton?: number}>;
type Term = Readonly<{button: number; key: string; label: string; start: number; end: number; entryId: string; sourceInstance: string; activeFrames: readonly (readonly [number, number])[]; sourceHitX: readonly number[]; nativeEnabledAfterCompletePhrase: boolean}>;
export interface WordFormConfig {
  readonly animationId: string;
  readonly placementId: string;
  readonly sourceSwfSha256: string;
  readonly frameDomain: string;
  readonly rootFrame: 6;
  readonly frameCount: 202;
  readonly fps: 12;
  readonly title: string;
  readonly tokens: readonly Token[];
  readonly panelAlpha: Curve;
  readonly terms: readonly Term[];
  readonly binding: LessonTextBinding;
  readonly keyTerms: Readonly<{indexLanguage: 'en'; sourceAssetId: string; sourceSha256: string; entryIds: readonly string[]}>;
  readonly sourceAudio: readonly (AudioCue & {readonly sha256: string})[];
  readonly spanishHostAudio: AudioTrack & {readonly sha256: string};
}

const config: WordFormConfig = G3_L1_VB009_SOURCE;
validateLessonTextBinding(config.binding);

export function wordFormSourceValue(curve: Curve, frame: number) {
  let result = 0;
  for (const [first, value] of curve) {
    if (first > frame) break;
    result = value;
  }
  return result;
}

export function getWordFormTeachingState(frame: number) {
  const tokens = config.tokens.map(token => ({...token, alpha: wordFormSourceValue(token.alpha, frame)}));
  const text = (block: Token['block']) => tokens.filter(token => token.block === block && token.alpha > 0).map(token => token.text).join('');
  return {frame, tokens, title: config.title, definition: text('definition'), number: text('number'), suffix: text('suffix'), panelAlpha: wordFormSourceValue(config.panelAlpha, frame)};
}

export function getG3L1Vb009TextSnapshot(state: SourceStaticCanvasFrameState, context: RuntimeContext): TextPresentationSnapshot {
  const blockers: string[] = [];
  if (state.animationId !== config.animationId || state.sourceSwfSha256 !== config.sourceSwfSha256) blockers.push('source-identity-mismatch');
  if (state.status !== 'ready') blockers.push(state.blocker ?? 'source-state-not-ready');
  if (state.frameDomain !== config.frameDomain || (context.frameDomain ?? config.frameDomain) !== config.frameDomain) blockers.push('unsupported-frame-domain');
  if (state.rootFrame !== 6 || (context.rootFrame !== undefined && context.rootFrame !== 6)) blockers.push('unsupported-root-context');
  if (state.scenario !== 'source-static-frame' || context.scenario !== state.scenario) blockers.push('unsupported-scenario');
  if (state.language !== 'en' || context.lang !== 'en') blockers.push('spanish-text-not-source-verified');
  if (!Number.isInteger(context.frame) || context.frame < 1 || context.frame > 202 || state.frame !== context.frame) blockers.push('source-frame-mismatch');
  if (state.seed !== (context.seed >>> 0)) blockers.push('source-seed-mismatch');
  if (context.entryStateSha256) blockers.push('capture-uses-source-canvas');
  const teaching = getWordFormTeachingState(state.frame);
  return {
    schemaVersion: 1, animationId: config.animationId, bindingVersion: config.binding.version,
    sourceSwfSha256: config.sourceSwfSha256, status: blockers.length ? 'blocked' : 'ready', blockers,
    identity: {frame: state.frame, frameDomain: state.frameDomain, rootFrame: state.rootFrame, scenario: state.scenario, language: state.language, seed: state.seed, replay: context.replay ?? 0},
    suppressedInstances: [],
    blocks: blockers.length ? [] : config.binding.blocks.map(block => {
      const text = teaching[block.id as 'title' | 'definition' | 'number' | 'suffix'];
      return {id: block.id, text, visible: text.length > 0, role: block.role, language: block.language, readingOrder: block.readingOrder};
    }),
  };
}

const STYLE = `
.g3l1-word-form{inline-size:100%;min-inline-size:0;padding:.8rem;background:#fffdf7;box-sizing:border-box}
.g3l1-word-form *{box-sizing:border-box}
.g3l1-word-form h2,.g3l1-word-form p{margin:0;overflow-wrap:normal;word-break:normal;hyphens:none}
.g3l1-word-form__definition{padding:.55rem .7rem;background:#fff;border-radius:.4rem}
.g3l1-word-form__example{padding:.7rem;min-inline-size:0;border-radius:.4rem;line-height:1.6}
.g3l1-word-form__number{white-space:nowrap;font-variant-numeric:tabular-nums;font-size:1.375rem}
.g3l1-word-form__term{display:inline-block;min-inline-size:44px;min-block-size:44px;padding:0;border:0;background:transparent;color:#1556a0;font:inherit;line-height:inherit;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.15em;white-space:nowrap;cursor:pointer}
.g3l1-word-form__term:disabled{color:inherit;cursor:default}
.g3l1-word-form__term:focus-visible{outline:3px solid #1556a0;outline-offset:3px}
@media(max-width:480px){.g3l1-word-form{padding-inline:.2rem}.g3l1-word-form__definition,.g3l1-word-form__example{padding-inline:.3rem}}
`;

export function WordFormScene({frame, onOpenKeyTerm}: {frame: number; onOpenKeyTerm?: (term: Term, trigger: HTMLButtonElement) => void}) {
  const teaching = getWordFormTeachingState(frame);
  const tokens = (block: Token['block']) => teaching.tokens.filter(token => token.block === block && token.alpha > 0).map(token => {
    const term = config.terms.find(item => item.button === token.termButton);
    const active = term?.activeFrames.some(([first, end]) => frame >= first && frame < end) ?? false;
    const group = term ? teaching.tokens.filter(item => item.termButton === term.button) : [];
    const completeTerm = Boolean(term) && group.every(item => item.alpha > 0);
    if (completeTerm && token.id !== group[0].id) return null;
    const displayed = completeTerm ? group.map(item => item.text).join('') : token.text;
    return <span key={token.id} data-source-token={token.id} data-source-token-members={completeTerm ? group.map(item => item.id).join(',') : token.id} data-source-instances={token.sourceInstances.join(',')} style={{opacity: token.alpha}}>
      {term && completeTerm ? <><button type="button" className="g3l1-word-form__term" disabled={!active || !onOpenKeyTerm} data-source-button={term.button} data-source-keyterm={term.key} data-keyterm-entry-id={term.entryId} onClick={event => {if (active) onOpenKeyTerm?.(term, event.currentTarget);}}>{term.label}</button>{displayed.slice(term.label.length)}</> : displayed}
    </span>;
  });
  return <div className="g3l1-word-form"><style>{STYLE}</style><div className="lesson-text-presentation" lang="en"><div className="lesson-text-presentation__layout">
    <h2 className="lesson-text-presentation__block lesson-text-presentation__block--title" data-lesson-text-block="title" data-source-character="4">{teaching.title}</h2>
    {teaching.definition && <p className="g3l1-word-form__definition lesson-text-presentation__block lesson-text-presentation__block--body" data-lesson-text-block="definition">{tokens('definition')}</p>}
    {teaching.panelAlpha > 0 && <p className="g3l1-word-form__example lesson-text-presentation__block lesson-text-presentation__block--body" data-source-shape="12" style={{background: `rgba(255,255,255,${teaching.panelAlpha})`}}>
      <span className="g3l1-word-form__number" data-lesson-text-block="number">{tokens('number')}</span>{teaching.suffix && <> <span data-lesson-text-block="suffix">{tokens('suffix')}</span></>}
    </p>}
  </div></div></div>;
}

function Renderer(props: AnimationRendererProps) {
  const context: RuntimeContext = {...props, frameDomain: props.frameDomain ?? config.frameDomain};
  const state = (props.state ?? getCourseG03L01Vb009FrameState(props.frame, context)) as SourceStaticCanvasFrameState;
  if (getG3L1Vb009TextSnapshot(state, context).status !== 'ready') return <CourseG03L01Vb009Renderer {...props} state={state}/>;
  return <div data-modern-text-page={config.animationId} data-lesson-frame={state.frame} data-lesson-replay={props.replay ?? 0} data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}>
    <WordFormScene key={props.replay ?? 0} frame={state.frame} onOpenKeyTerm={props.onLessonHostRequest ? (term, trigger) => props.onLessonHostRequest?.({type: 'open-keyterm', entryId: term.entryId, sourceAnimationId: config.animationId, playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume'}, {trigger, keyTermIndexLanguage: 'en'}) : undefined}/>
  </div>;
}

export const G3_L1_VB009_TEXT_PRESENTATION = {
  schemaVersion: 1, binding: config.binding, Renderer, getSnapshot: getG3L1Vb009TextSnapshot,
  playbackMode: 'once', playbackEndFrameByDomain: {[config.frameDomain]: 202}, reducedMotionFrameByDomain: {[config.frameDomain]: 202},
  sourceTimelineAudioCues: config.sourceAudio, keyTerms: config.keyTerms,
} satisfies LessonTextPresentationCapability<SourceStaticCanvasFrameState>;
export const G3_L1_VB009_TEXT_BINDING = G3_L1_VB009_TEXT_PRESENTATION.binding;
export const G3_L1_VB009_SPANISH_HOST_AUDIO = config.spanishHostAudio;
