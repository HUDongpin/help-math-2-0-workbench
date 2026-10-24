'use client';

import React, {useState} from 'react';
import type {AnimationRendererProps, AudioCue, RuntimeContext} from '../contract';
import type {LessonTextBinding, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import {buildLessonTextSnapshot} from '../lesson-text-snapshot';
import {isCompleteTraceCaptureIdentity, type SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {createIn012Interaction, nextIn012Product, type In012InteractionState} from './g4-l5-in012';

interface Label {readonly id: string; readonly character: number; readonly text: string; readonly sourceInstance: string; readonly x: number; readonly y: number; readonly alpha: number; readonly runs: readonly {readonly text: string; readonly color: string}[]}
interface Graphic {readonly character: number; readonly sourceInstance: string; readonly matrix: readonly number[]; readonly alpha: number}
interface Scene {readonly labels: readonly Label[]; readonly graphics: readonly Graphic[]}
interface Shape {readonly bounds: {readonly left: number; readonly right: number; readonly top: number; readonly bottom: number}; readonly image?: string; readonly paths?: readonly {readonly d: string; readonly fill: string; readonly stroke: string; readonly width: number}[]}
export interface ProductPoolConfig {
  readonly animationId: string; readonly placementId: string; readonly sourceSha256: string; readonly frameDomain: string;
  readonly frameCount: number; readonly interactionFrame: number; readonly rootFrame: number; readonly method: string;
  readonly title: string; readonly instruction: string; readonly instructionAlpha: readonly (readonly [number, number])[];
  readonly terms: readonly {readonly key: string; readonly button: number; readonly entryId: string; readonly emphasisFrames: readonly number[]; readonly activeFrames: readonly (readonly [number, number])[]}[];
  readonly buttonAlpha: readonly (readonly [number, number])[];
  readonly button: {readonly x: number; readonly y: number; readonly sourceButton: number; readonly text: string};
  readonly introScenes: readonly (readonly [number, Scene])[];
  readonly cases: readonly {readonly id: string; readonly frame: number; readonly sprite: number; readonly a: number; readonly b: number; readonly result: number; readonly scene: Scene}[];
  readonly shapes: Readonly<Record<string, Shape>>; readonly viewBox: readonly number[]; readonly inlineRem: number;
  readonly binding: LessonTextBinding;
}
const at = <T,>(curve: readonly (readonly [number, T])[], frame: number): T => curve.filter(([f]) => f <= frame).at(-1)![1];

export function resolveProductPoolScene(config: ProductPoolConfig, frame: number, capture: boolean, interaction: In012InteractionState) {
  if (frame < config.interactionFrame) return {caseId: 'intro', sourceFrame: frame, scene: at(config.introScenes, frame)};
  const selected = capture ? config.cases[frame - config.interactionFrame] : config.cases.find(c => c.id === interaction.currentCaseId);
  if (!selected) throw new Error('Source product case identity is outside the five-case pool');
  return {caseId: selected.id, sourceFrame: selected.frame, scene: selected.scene};
}

export function createProductPoolPresentation(config: ProductPoolConfig,
  getSourceState: (frame: number, context: RuntimeContext) => SourceStaticCanvasFrameState,
  sourceAudio: readonly (AudioCue & {readonly sha256: string; readonly manualNarration?: false})[] = [],
): LessonTextPresentationCapability<SourceStaticCanvasFrameState> {
  const binding = config.binding;
  function getSnapshot(state: SourceStaticCanvasFrameState, context: RuntimeContext,
    interaction = createIn012Interaction(context.seed, context.replay ?? 0)): TextPresentationSnapshot {
    const expected = getSourceState(context.frame, context);
    const valid = state?.status === 'ready' && expected.status === 'ready' && state.animationId === config.animationId &&
      state.sourceSwfSha256 === config.sourceSha256 && state.frame === expected.frame && state.frameDomain === config.frameDomain &&
      (context.frameDomain ?? config.frameDomain) === config.frameDomain && state.rootFrame === config.rootFrame &&
      (context.rootFrame ?? config.rootFrame) === config.rootFrame && state.scenario === 'source-static-frame' &&
      context.scenario === state.scenario && state.language === 'en' && context.lang === 'en' && state.seed === expected.seed &&
      interaction.seed === expected.seed && interaction.replay === (context.replay ?? 0);
    if (!valid) return Object.freeze({...buildLessonTextSnapshot(binding, context, {}), status: 'blocked',
      blocks: Object.freeze([]), suppressedInstances: Object.freeze([]),
      blockers: Object.freeze(['source-or-interaction-identity-mismatch'])});
    const selected = resolveProductPoolScene(config, expected.frame, isCompleteTraceCaptureIdentity(context), interaction);
    const content: Record<string, {text: string; visible: boolean}> = Object.fromEntries(binding.blocks.map(b => [b.id, {text: '', visible: false}]));
    content['root-title'] = {text: config.title, visible: true};
    content.instruction = {text: config.instruction, visible: at(config.instructionAlpha, expected.frame) > 0};
    content['new-product'] = {text: config.button.text, visible: at(config.buttonAlpha, expected.frame) > 0};
    for (const label of selected.scene.labels) content[label.id] = {text: label.text, visible: label.alpha > 0};
    return buildLessonTextSnapshot(binding, {...context, frame: expected.frame, frameDomain: config.frameDomain, rootFrame: config.rootFrame, seed: expected.seed}, content);
  }
  function Session({state, context, props}: {readonly state: SourceStaticCanvasFrameState; readonly context: RuntimeContext; readonly props: AnimationRendererProps}) {
    const [interaction, setInteraction] = useState(() => createIn012Interaction(state.seed, context.replay ?? 0));
    const snapshot = getSnapshot(state, context, interaction);
    if (snapshot.status !== 'ready') return <section data-modern-text-page={config.animationId} data-presentation-status="blocked"/>;
    const capture = isCompleteTraceCaptureIdentity(context);
    const selected = resolveProductPoolScene(config, state.frame, capture, interaction);
    const buttonAlpha = at(config.buttonAlpha, state.frame);
    const interactive = state.frame >= config.interactionFrame && buttonAlpha > 0 && !capture && !props.paused;
    const [left, top, width, height] = config.viewBox;
    const x = (value: number) => `${(value - left) / width * 100}%`;
    const y = (value: number) => `${(value - top) / height * 100}%`;
    const word = (index: number, literal: string) => {
      const t = config.terms[index], active = t.activeFrames.some(([first, end]) => first <= state.frame && state.frame < end);
      const children = <span data-source-emphasized={t.emphasisFrames.includes(state.frame)} style={{fontWeight: t.emphasisFrames.includes(state.frame) ? 800 : 'inherit', background: t.emphasisFrames.includes(state.frame) ? '#fff0a6' : undefined}}>{literal}</span>;
      if (capture || !props.onLessonHostRequest) return children;
      return <button type="button" disabled={!active} data-keyterm-entry-id={t.entryId} data-source-button-id={t.button}
        onClick={event => {if (active) props.onLessonHostRequest?.({type: 'open-keyterm', entryId: t.entryId, sourceAnimationId: config.animationId, playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume'}, {trigger: event.currentTarget});}}
        style={{font: 'inherit', color: '#174fa5', background: 'transparent', border: 0, minHeight: 44, minWidth: 44, padding: '0 .1rem', textDecoration: 'underline'}}>{children}</button>;
    };
    return <section className="lesson-text-presentation" lang="en" data-modern-text-page={config.animationId} data-modern-lesson={config.animationId}
      data-presentation-status="candidate" data-source-swf-sha256={config.sourceSha256} data-source-case={selected.caseId}
      data-source-question-frame={selected.sourceFrame} data-flash-frame={state.frame} data-flash-frame-domain={state.frameDomain}
      data-flash-root-frame={state.rootFrame} data-flash-scenario={state.scenario} data-flash-seed={state.seed} data-flash-lang={state.language}
      data-replay={context.replay ?? 0} data-draw-count={interaction.drawCount} data-cycle={interaction.cycle}
      data-remaining-case-count={interaction.remaining.length} data-interaction-enabled={interactive}
      data-language-policy={props.uiLanguage === 'es' ? 'source-fallback' : 'source'} data-spanish-translation="false"
      style={{display: 'grid', gap: '1rem', minWidth: 0}}>
      <h2 className="lesson-text-presentation__block lesson-text-presentation__block--title" data-lesson-text-block="root-title" aria-label={config.title} style={{hyphens: 'manual'}}>{config.title.replace('Multiplication', 'Multipli\u00adcation')}</h2>
      <p className="lesson-text-presentation__block lesson-text-presentation__block--question" data-lesson-text-block="instruction"
        aria-hidden={at(config.instructionAlpha, state.frame) === 0} style={{opacity: at(config.instructionAlpha, state.frame), visibility: at(config.instructionAlpha, state.frame) > 0 ? 'visible' : 'hidden'}}>
        Click New {word(0, 'Product')} to change the {word(1, 'numbers')} in the {word(2, 'multiplication')} {word(3, 'problem')}.
      </p>
      <div role="region" tabIndex={0} aria-label="Multiplication diagram; scroll to read all source steps" data-product-pool-scroll="true"
        style={{overflowX: 'auto', maxWidth: '100%', border: '1px solid #cbd7e5', borderRadius: '.875rem', background: '#fff'}}>
        <div data-product-pool-board="true" style={{position: 'relative', width: `${config.inlineRem}rem`, height: `${config.inlineRem * height / width}rem`, fontFamily: 'var(--lesson-text-font-body)', fontSize: '1.125rem', lineHeight: 1.25, color: '#17273c'}}>
          <svg aria-hidden="true" viewBox={config.viewBox.join(' ')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
            {selected.scene.graphics.filter(g => g.alpha > 0).map((g, index) => {const shape = config.shapes[g.character];return <g key={`${g.sourceInstance}-${index}`} data-source-shape={g.character} transform={`matrix(${g.matrix.join(' ')})`} opacity={g.alpha}>
              {shape.paths?.map((p, i) => <path key={i} d={p.d} fill={p.fill} stroke={p.stroke} strokeWidth={p.width}/>)}
              {shape.image && <image href={shape.image} x={shape.bounds.left} y={shape.bounds.top} width={shape.bounds.right-shape.bounds.left} height={shape.bounds.bottom-shape.bounds.top}/>}
            </g>;})}
          </svg>
          {selected.scene.labels.filter(l => l.alpha > 0).map(label => <span key={label.id} data-lesson-text-block={label.id}
            data-source-character={label.character} data-source-instance={label.sourceInstance}
            style={{position: 'absolute', left: x(label.x), top: y(label.y), transform: 'translate(-50%, -50%)', whiteSpace: 'pre', opacity: label.alpha}}>
            {label.runs.map((run, i) => <span key={i} style={{color: run.color}}>{run.text}</span>)}
          </span>)}
          <button type="button" data-lesson-text-block="new-product" data-source-button-id={config.button.sourceButton} disabled={!interactive} aria-hidden={buttonAlpha === 0}
            onClick={() => {if (interactive) setInteraction(current => nextIn012Product(current));}}
            style={{position: 'absolute', opacity: buttonAlpha, visibility: buttonAlpha > 0 ? 'visible' : 'hidden', left: x(config.button.x), top: y(config.button.y), transform: 'translate(-50%, -50%)', font: 'inherit', minHeight: 44, minWidth: 44, padding: '.55rem 1rem', border: '2px solid #244db2', borderRadius: '.75rem', color: interactive ? '#fff' : '#52647a', background: interactive ? '#244db2' : '#e5eaf2'}}>{config.button.text}</button>
        </div>
      </div>
    </section>;
  }
  function Renderer(props: AnimationRendererProps) {
    const context: RuntimeContext = {...props, frameDomain: props.frameDomain ?? config.frameDomain, rootFrame: props.rootFrame ?? config.rootFrame};
    const state = (props.state === undefined ? getSourceState(props.frame, context) : props.state) as SourceStaticCanvasFrameState;
    if (!state || typeof state !== 'object') return <section data-modern-text-page={config.animationId} data-presentation-status="blocked"/>;
    return <Session key={`${state.seed}:${context.replay ?? 0}`} state={state} context={context} props={props}/>;
  }
  return Object.freeze({schemaVersion: 1, binding, Renderer, getSnapshot,
    keyTerms: {indexLanguage: 'en' as const, sourceAssetId: 'ELKTEG4.xml', sourceSha256: 'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749', entryIds: config.terms.map(t => t.entryId)},
    sourceTimelineAudioCues: sourceAudio, playbackEndFrameByDomain: {[config.frameDomain]: config.interactionFrame}, reducedMotionFrameByDomain: {[config.frameDomain]: config.interactionFrame},
  });
}
