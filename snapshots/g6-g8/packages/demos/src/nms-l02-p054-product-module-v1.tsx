'use client';

import React from 'react';
import type {AnimationModule, AnimationRendererProps, RuntimeContext} from './contract';
import {P054ProductBoardV1} from './nms-l02-p054-product-board-v1';

export const P054_PRODUCT_SCENARIOS = Object.freeze({
  level1: 'source-matching-level-1',
  level2: 'source-matching-level-2',
} as const);

export const P054_SOURCE = Object.freeze({
  animationId: 'shared-nms002-l02-p054',
  relativePath: 'G6-G8-shared/NMS002/L2/GS/L2GS03.swf',
  bytes: 2077270,
  sha256: '06bde171fe294f555f983c15b50afbb53344851cdc2f76e31e5eb5a4719cabb8',
  stage: Object.freeze({width: 800, height: 600}),
  fps: 12,
  rootFrames: 10,
  mainSpriteId: 731,
  mainFrames: 5,
  rootPlacementFrame: 6,
});

export interface P054ProductFrameState {
  readonly animationId: typeof P054_SOURCE.animationId;
  readonly sourceSwfSha256: typeof P054_SOURCE.sha256;
  readonly status: 'contextual-candidate' | 'blocked';
  readonly blocker: 'invalid-context' | 'source-frame-inspection-unavailable' | null;
  readonly frame: number;
  readonly frameDomain: string;
  readonly rootFrame: number;
  readonly scenario: string;
  readonly level: 1 | 2 | null;
  readonly seed: number;
  readonly sourceMainSpriteId: 731;
  readonly sourceMainFrames: 5;
  readonly boardInteractionOwnedByBoard: true;
  readonly sourceTimelineSeekAvailable: false;
  readonly sourceTerminalResolved: false;
}

/** Sprite 731 chooses a level at entry. Its later frames are stateful game
 * branches, not queryable snapshots of an independently running timeline. */
export function p054ProductFrameState(frame: number, context: RuntimeContext): P054ProductFrameState {
  const domain = context.frameDomain ?? 'sprite-731';
  const level = context.scenario === P054_PRODUCT_SCENARIOS.level1 ? 1 :
    context.scenario === P054_PRODUCT_SCENARIOS.level2 ? 2 : null;
  const supported = domain === 'sprite-731' && context.rootFrame === 6 &&
    context.lang === 'en' && context.seed === 0 && level !== null &&
    Number.isSafeInteger(context.replay ?? 0) && (context.replay ?? 0) >= 0 &&
    Number.isSafeInteger(frame) && frame >= 1 && frame <= 5 && context.frame === frame;
  const blocker = !supported ? 'invalid-context' : frame !== 1
    ? 'source-frame-inspection-unavailable' : null;
  return Object.freeze({
    animationId: P054_SOURCE.animationId,
    sourceSwfSha256: P054_SOURCE.sha256,
    status: blocker ? 'blocked' as const : 'contextual-candidate' as const,
    blocker, frame, frameDomain: domain, rootFrame: context.rootFrame ?? 0,
    scenario: context.scenario, level, seed: context.seed,
    sourceMainSpriteId: 731 as const, sourceMainFrames: 5 as const,
    boardInteractionOwnedByBoard: true as const,
    sourceTimelineSeekAvailable: false as const,
    sourceTerminalResolved: false as const,
  });
}

function P054ProductRenderer(props: AnimationRendererProps) {
  const state = p054ProductFrameState(props.frame, {
    frame: props.frame, frameDomain: props.frameDomain, rootFrame: props.rootFrame,
    scenario: props.scenario, lang: props.lang, seed: props.seed, replay: props.replay,
  });
  if (state.status === 'blocked' || state.level === null) {
    return <section data-animation-id={P054_SOURCE.animationId}
      data-p054-product-status="blocked" data-p054-blocker={state.blocker}>
      {props.uiLanguage === 'es'
        ? 'Este estado del juego requiere el anfitrión interactivo de la lección.'
        : 'This game state requires its interactive lesson host.'}
    </section>;
  }
  return <div data-animation-id={P054_SOURCE.animationId}
    data-p054-product-status="contextual-candidate" data-p054-product-level={state.level}
    data-p054-source-timeline-seek="false" data-p054-terminal-resolved="false">
    <P054ProductBoardV1 level={state.level} uiLanguage={props.uiLanguage ?? 'en'}/>
  </div>;
}

const stage = P054_SOURCE.stage;
const movie = Object.freeze({stage, fps: 12, frameCount: 5, durationMs: 5000 / 12});
const runtime = Object.freeze({stage, fps: 12, frameCount: 10, durationMs: 10000 / 12,
  defaultFrameDomain: 'sprite-731',
  frameDomains: Object.freeze([Object.freeze({id: 'sprite-731', frameCount: 5,
    fps: 12, rootFrame: 6})]),
});

/** The dedicated My Lesson adapter owns the interaction state, feedback clock,
 * controls and Replay. These five frames are source metadata, not a generic
 * seekable lesson or a completion signal after the sixth matched pair. */
export const nmsL02P054ProductModuleV1: AnimationModule<P054ProductFrameState> = Object.freeze({
  key: P054_SOURCE.animationId,
  movie,
  runtime,
  playbackMode: 'once',
  scenarios: Object.freeze([
    Object.freeze({id: P054_PRODUCT_SCENARIOS.level1, label: 'Source matching level 1',
      description: 'Default maintained Level 1 board; completion remains unresolved.'}),
    Object.freeze({id: P054_PRODUCT_SCENARIOS.level2, label: 'Source matching level 2',
      description: 'Explicit Level 2 board; P053 global handoff parity remains unresolved.'}),
  ]),
  defaultScenarioByFrameDomain: Object.freeze({'sprite-731': P054_PRODUCT_SCENARIOS.level1}),
  audioCues: Object.freeze([]),
  maturity: 'legacy-prototype',
  Renderer: P054ProductRenderer,
  getFrameState: p054ProductFrameState,
});

export const nmsL02P054ProductModule = nmsL02P054ProductModuleV1;
