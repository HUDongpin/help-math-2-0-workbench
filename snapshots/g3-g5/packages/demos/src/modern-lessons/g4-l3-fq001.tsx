'use client';

import React from 'react';
import type {AnimationRendererProps, RuntimeContext} from '../contract';
import type {LessonTextBinding, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {getCourseG04L03Fq001FrameState} from '../modules/course-g04-l03-fq-001';
import {COURSE_G04_L03_FQ_001_SOURCE} from '../timelines/course-g04-l03-fq-001';

const ANIMATION_ID = 'course-g04-l03-fq-001';
const DOMAIN = 'sprite-41';
const SCENARIO = 'source-static-frame';
const VERSION = 'g04-l03-fq001-native-title-v1';
const textId = (character: number) => `character-${character}/run-0`;

/** The fixed companion is a generic, low-alpha word cloud. The five small
 * graph values and its shape are also 26/256-alpha background decoration,
 * not a question or a chart with an authored prompt on this page. */
export const FQ001_SOURCE_ROLES = Object.freeze({
  sourceCatalogContentSha256: 'd1530fd65c03540c27c6011da09d09ef6bb2b2cebb1ceba1745e28dde36d8a89',
  titleCharacters: Object.freeze([39, 40]),
  ambientNegativeCharacters: Object.freeze([24, 26, 27, 28]),
  omittedGraphCharacters: Object.freeze([33, 34, 35, 36, 37]),
  omittedCompanionCharacters: Object.freeze([7, 9, 11, 13, 15, 17, 19, 21]),
  sourceContextAlpha: 26 / 256,
  titleFirstVisibleFrame: 2,
  titleFullSourceAlphaFrame: 20,
  terminalStopFrame: 52,
});

export const FQ001_TEXT_BINDING = Object.freeze({
  schemaVersion: 1,
  version: VERSION,
  placementId: 'g04-l03-placement-037',
  animationId: ANIMATION_ID,
  sourceSwfSha256: COURSE_G04_L03_FQ_001_SOURCE.swfSha256,
  template: 'explanation',
  blocks: [
    {id: 'final-quiz', sourceTextIds: FQ001_SOURCE_ROLES.titleCharacters.map(textId),
      role: 'title', language: 'en', readingOrder: 0, valueSource: 'source-static'},
    ...FQ001_SOURCE_ROLES.ambientNegativeCharacters.map((character, index) => ({
      id: `ambient-negative-${index + 1}`, sourceTextIds: [textId(character)],
      role: 'label' as const, language: 'en' as const, readingOrder: 10 + index,
      valueSource: 'source-static' as const,
    })),
  ],
} satisfies LessonTextBinding);

const NEGATIVE_VALUES = Object.freeze(['−4', '−17', '−25', '−40']);

export function getFq001TextSnapshot(state: SourceStaticCanvasFrameState, context: RuntimeContext): TextPresentationSnapshot {
  const blockers: string[] = [];
  if (state?.animationId !== ANIMATION_ID || state.sourceSwfSha256 !== FQ001_TEXT_BINDING.sourceSwfSha256) blockers.push('source-identity-mismatch');
  if (state?.status !== 'ready') blockers.push(state?.blocker ?? 'source-state-not-ready');
  if (state?.frameDomain !== DOMAIN || (context.frameDomain ?? DOMAIN) !== DOMAIN) blockers.push('unsupported-frame-domain');
  if (state?.scenario !== SCENARIO || (context.scenario ?? SCENARIO) !== SCENARIO) blockers.push('unsupported-scenario');
  if (state?.language !== 'en' || (context.lang ?? 'en') !== 'en') blockers.push('spanish-source-text-not-verified');
  if (!Number.isSafeInteger(context.frame) || context.frame < 1 || context.frame > 52 || state?.frame !== context.frame ||
      state?.rootFrame !== 6 || (context.rootFrame !== undefined && context.rootFrame !== 6) ||
      state?.seed !== (Number.isSafeInteger(context.seed) ? context.seed >>> 0 : 0)) blockers.push('frame-state-identity-mismatch');
  const ready = blockers.length === 0;
  return {
    schemaVersion: 1, animationId: ANIMATION_ID, bindingVersion: VERSION,
    sourceSwfSha256: FQ001_TEXT_BINDING.sourceSwfSha256,
    status: ready ? 'ready' : 'blocked', blockers,
    identity: {frame: state?.frame ?? context.frame, frameDomain: state?.frameDomain ?? DOMAIN,
      rootFrame: state?.rootFrame ?? 6, scenario: state?.scenario ?? SCENARIO,
      language: state?.language ?? 'en', seed: state?.seed ?? 0, replay: context.replay ?? 0},
    suppressedInstances: [],
    blocks: ready ? FQ001_TEXT_BINDING.blocks.map((block, index) => ({
      id: block.id, role: block.role, language: block.language, readingOrder: block.readingOrder,
      text: index === 0 ? 'Final Quiz' : NEGATIVE_VALUES[index - 1]!,
      visible: index !== 0 || state.frame >= FQ001_SOURCE_ROLES.titleFirstVisibleFrame,
    })) : [],
  };
}

export function ModernRenderer(props: AnimationRendererProps) {
  const context: RuntimeContext = {...props, frameDomain: props.frameDomain ?? DOMAIN, rootFrame: props.rootFrame ?? 6};
  const state = props.state === undefined ? getCourseG04L03Fq001FrameState(props.frame, context) : props.state as SourceStaticCanvasFrameState;
  const snapshot = getFq001TextSnapshot(state, context);
  if (snapshot.status !== 'ready') return <section data-modern-lesson="g4-l3-fq001" data-presentation-status="blocked"
    data-presentation-blocker={snapshot.blockers.join(',')}/>;
  const title = snapshot.blocks[0]!;
  return <section className="g4l3-fq001-modern" lang="en" data-modern-lesson="g4-l3-fq001"
    data-presentation-status="candidate" data-source-swf-sha256={FQ001_TEXT_BINDING.sourceSwfSha256}
    data-flash-frame={state.frame} data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}
    data-flash-lang={state.language} data-flash-scenario={state.scenario} data-flash-seed={state.seed}
    data-replay={context.replay ?? 0} data-language-policy={props.uiLanguage === 'es' ? 'source-fallback' : 'source'}
    data-spanish-translation="false" data-original-runtime-accepted="false" data-strict-migration-complete="false"
    style={{boxSizing: 'border-box', display: 'grid', alignContent: 'center', justifyItems: 'center', gap: 'clamp(1.5rem, 4vw, 3.5rem)',
      inlineSize: '100%', minBlockSize: 'min(34rem, 100%)', padding: 'clamp(1.5rem, 5vw, 4rem)',
      borderRadius: '1.5rem', background: '#e8f3ff', color: '#183b70', textAlign: 'center'}}>
    <div style={{minBlockSize: 'clamp(4rem, 11vw, 7rem)', display: 'grid', placeItems: 'center'}}>
      {title.visible && <h2 data-lesson-text-block="final-quiz" style={{margin: 0, fontFamily: 'var(--lesson-text-font-heading)',
        fontSize: 'clamp(2.5rem, 7vw, 5.5rem)', lineHeight: 1.1, letterSpacing: '-.025em'}}>{title.text}</h2>}
    </div>
    <div aria-hidden="true" style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'clamp(.75rem, 2vw, 1.5rem)'}}>
      {snapshot.blocks.slice(1).map(block => <span key={block.id} data-lesson-text-block={block.id}
        style={{fontFamily: 'var(--lesson-text-font-body)', fontSize: 'clamp(1.25rem, 3vw, 2rem)', fontWeight: 700,
          lineHeight: 1.3, color: '#5074a2', fontVariantNumeric: 'tabular-nums'}}>{block.text}</span>)}
    </div>
  </section>;
}

export const FQ001_PRESENTATION: LessonTextPresentationCapability<SourceStaticCanvasFrameState> = Object.freeze({
  schemaVersion: 1, binding: FQ001_TEXT_BINDING, Renderer: ModernRenderer,
  getSnapshot: getFq001TextSnapshot,
  reducedMotionFrameByDomain: {[DOMAIN]: FQ001_SOURCE_ROLES.terminalStopFrame},
});
