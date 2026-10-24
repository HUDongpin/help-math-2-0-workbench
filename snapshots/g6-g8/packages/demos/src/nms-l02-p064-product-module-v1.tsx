'use client';

import React from 'react';
import type {AnimationModule, AnimationRendererProps, RuntimeContext} from './contract';
import {P064QuizCandidate} from './nms-l02-p064-quiz-candidate';

export const P064_PRODUCT_SCENARIO = 'source-quiz-seeded';
export const P064_SOURCE = Object.freeze({
  animationId: 'shared-nms002-l02-p064',
  relativePath: 'G6-G8-shared/NMS002/L2/FQ/L2FQ02.swf',
  bytes: 55392,
  sha256: 'f655f05d7be5576503a66f52909b322bd3fce3e7b51a7fcda52291f755bf346c',
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  rootFrames: 10,
  mainSpriteId: 1258,
  mainFrames: 90,
  rootPlacementFrame: 6,
});

export interface P064ProductFrameState {
  readonly animationId: typeof P064_SOURCE.animationId;
  readonly sourceSwfSha256: typeof P064_SOURCE.sha256;
  readonly status: 'contextual-candidate' | 'blocked';
  readonly blocker: 'invalid-context' | 'source-frame-inspection-unavailable' | null;
  readonly frame: number;
  readonly frameDomain: string;
  readonly rootFrame: number;
  readonly seed: number;
  readonly sourceMainSpriteId: 1258;
  readonly sourceMainFrames: 90;
  readonly questionStateOwnedByQuiz: true;
  readonly sourceTimelineSeekAvailable: false;
  readonly hostExitResolved: false;
}

const validSeed = (seed: number) => Number.isSafeInteger(seed) && seed >= 0 && seed <= 0xffffffff;

/** The Flash frame is source metadata, not a substitute for the quiz state.
 * Only the initial context can mount the maintained interactive candidate. */
export function p064ProductFrameState(frame: number, context: RuntimeContext): P064ProductFrameState {
  const domain = context.frameDomain ?? 'sprite-1258';
  const supported = domain === 'sprite-1258' && context.rootFrame === 6 &&
    context.scenario === P064_PRODUCT_SCENARIO && context.lang === 'en' &&
    validSeed(context.seed) && Number.isSafeInteger(context.replay ?? 0) &&
    (context.replay ?? 0) >= 0 && Number.isSafeInteger(frame) &&
    frame >= 1 && frame <= 90 && context.frame === frame;
  const blocker = !supported ? 'invalid-context' : frame !== 1
    ? 'source-frame-inspection-unavailable' : null;
  return Object.freeze({
    animationId: P064_SOURCE.animationId,
    sourceSwfSha256: P064_SOURCE.sha256,
    status: blocker ? 'blocked' as const : 'contextual-candidate' as const,
    blocker,
    frame,
    frameDomain: domain,
    rootFrame: context.rootFrame ?? 0,
    seed: context.seed,
    sourceMainSpriteId: 1258 as const,
    sourceMainFrames: 90 as const,
    questionStateOwnedByQuiz: true as const,
    sourceTimelineSeekAvailable: false as const,
    hostExitResolved: false as const,
  });
}

function P064ProductRenderer(props: AnimationRendererProps) {
  const state = p064ProductFrameState(props.frame, {
    frame: props.frame, frameDomain: props.frameDomain, rootFrame: props.rootFrame,
    scenario: props.scenario, lang: props.lang, seed: props.seed, replay: props.replay,
  });
  if (state.status === 'blocked' || !props.onLessonHostRequest) {
    return <section data-animation-id={P064_SOURCE.animationId} data-p064-product-status="blocked"
      data-p064-blocker={state.blocker ?? 'fq-scoring-host-required'}>
      {props.uiLanguage === 'es'
        ? 'El cuestionario requiere el anfitrión de puntuación de esta lección.'
        : 'This quiz requires its lesson scoring host.'}
    </section>;
  }
  return <P064QuizCandidate seed={props.seed} uiLanguage={props.uiLanguage ?? 'en'}
    onLessonHostRequest={request => props.onLessonHostRequest?.(request)}/>;
}

const stage = P064_SOURCE.stage;
const movie = Object.freeze({stage, fps: 12, frameCount: 90, durationMs: 7500});
const runtime = Object.freeze({stage, fps: 12, frameCount: 10, durationMs: 10_000 / 12,
  defaultFrameDomain: 'sprite-1258',
  frameDomains: Object.freeze([Object.freeze({id: 'sprite-1258', frameCount: 90, fps: 12,
    rootFrame: 6})]),
});

/** Contextual candidate only. The dedicated My Lesson adapter owns the quiz
 * session; generic frame playback must not be used as quiz completion. */
export const nmsL02P064ProductModuleV1: AnimationModule<P064ProductFrameState> = Object.freeze({
  key: P064_SOURCE.animationId,
  movie,
  runtime,
  playbackMode: 'once',
  scenarios: Object.freeze([Object.freeze({id: P064_PRODUCT_SCENARIO,
    label: 'Source question bank, seeded quiz candidate',
    description: 'Ten source questions are selected without replacement; host exit is unresolved.'})]),
  defaultScenarioByFrameDomain: Object.freeze({'sprite-1258': P064_PRODUCT_SCENARIO}),
  audioCues: Object.freeze([]),
  lessonHost: Object.freeze({capabilities: Object.freeze(['fq-scoring'] as const),
    legacyOperations: 'blocked' as const, auditStorage: 'memory-only' as const,
    storesPersonalData: false as const}),
  maturity: 'legacy-prototype',
  Renderer: P064ProductRenderer,
  getFrameState: p064ProductFrameState,
});

export const nmsL02P064ProductModule = nmsL02P064ProductModuleV1;
