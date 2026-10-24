"use client";
import React, {useId, useMemo} from 'react';
import type {AnimationModule, AnimationRendererProps, RuntimeContext} from './contract';
import {G678_NMS_L01_P042_SOURCE_VISUAL as SOURCE} from './generated/g678-nms-l01-p042-source-visual-v1';

export const G678_NMS_L01_P042_CONFIG = Object.freeze({
  animationId: 'shared-nms002-l01-p042', sourceSwfSha256: SOURCE.source.sha256,
  stage: Object.freeze({width: 800, height: 600}), fps: 12, rootFrameCount: 10,
  sourceEntryRootFrame: 6, mainFrameDomain: 'sprite-23', mainFrameCount: 125,
  playbackEndFrame: 125, playbackMode: 'once', reducedMotionFrame: 125,
  scenario: 'nms-l01-p042-source-static-frame', visualStateCount: 1,
  sourceVisualLanguage: 'en', audioIntegrated: false,
  entryAdapter: 'Modern host enters source main frame1 at root6; no legacy preloader call is executed.',
  sourceTitleDisposition: 'Source root sibling sprite3 is included in the full static SVG composition.',
  sourceRuntimeParity: false, currentJavaScriptRegistered: false,
} as const);

export function resolveNmsL01P042Frame(frame: number, context: RuntimeContext) {
  const domain = context.frameDomain ?? G678_NMS_L01_P042_CONFIG.mainFrameDomain;
  const valid = domain === 'sprite-23' && Number.isSafeInteger(frame) && frame >= 1 && frame <= 125 &&
    context.frame === frame && (context.rootFrame === undefined || context.rootFrame === 6) &&
    context.scenario === G678_NMS_L01_P042_CONFIG.scenario && context.lang === 'en' &&
    Number.isSafeInteger(context.seed) && context.seed >= 0 && context.seed <= 0xffffffff &&
    Number.isSafeInteger(context.replay ?? 0) && (context.replay ?? 0) >= 0;
  return Object.freeze({animationId: G678_NMS_L01_P042_CONFIG.animationId,
    frameDomain: valid ? 'sprite-23' : 'unsupported-source-state', requestedFrameDomain: domain,
    frame, rootFrame: 6, scenario: context.scenario, language: context.lang, seed: context.seed,
    replay: context.replay ?? 0, status: valid ? 'ready' as const : 'blocked' as const,
    visualStateId: valid ? 'full-root-static-composition' : null,
    sourceDrawingSha256: valid ? SOURCE.svgSha256 : null, sourceTerminalStopReached: valid && frame === 125,
    sourceActionScriptExecuted: false, sourceAudioIntegrated: false, currentJavaScriptRegistered: false,
    productCalibrationPassed: false, authoritativeOriginalRuntime: false, strictAcceptanceEffect: 'none'});
}

export function namespaceNmsL01P042Svg(namespace: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(namespace)) throw new Error('Invalid p042 SVG instance namespace');
  return SOURCE.svg.replace(/\bid="([^"]+)"/g, (_, id) => `id="${namespace}-${id}"`)
    .replace(/(xlink:href|href)="#([^"]+)"/g, (_, attr, id) => `${attr}="#${namespace}-${id}"`)
    .replace(/url\(#([^)]*)\)/g, (_, id) => `url(#${namespace}-${id})`);
}

export function NmsL01P042SourceRenderer(props: AnimationRendererProps) {
  const namespace = 'p042-' + useId().replace(/[^a-zA-Z0-9_-]/g, '_');
  const svg = useMemo(() => namespaceNmsL01P042Svg(namespace), [namespace]);
  const state = resolveNmsL01P042Frame(props.frame, props);
  if (state.status !== 'ready') return <p lang="en" role="alert" data-p042-source-state="blocked">
    This source candidate supports only its declared English main timeline.</p>;
  const description = `${SOURCE.literalTitle}. ${SOURCE.literalSteps.map((text, i) => `${i + 1}. ${text}`).join(' ')}`;
  return <figure lang="en" role="img" aria-label={description} data-p042-source-candidate="v1"
    data-source-main-frame={props.frame} data-source-main-frame-count="125"
    data-source-root-frame="6" data-source-root-frame-count="10" data-source-terminal-stop="125"
    data-source-static-visual-states="1" data-source-title-sibling="3"
    data-source-drawing-sha256={SOURCE.svgSha256} data-runtime-replay={props.replay ?? 0}
    data-runtime-paused={props.paused ? 'true' : 'false'} data-audio-integrated="false"
    data-current-javascript-registered="false" data-product-calibration-passed="false"
    data-authoritative-original-runtime="false" data-visual-fidelity-accepted="false"
    data-audio-accepted="false" data-strict-complete="false" data-release-authorized="false"
    style={{margin: 0, width: '100%', maxWidth: 800, aspectRatio: '4 / 3'}}
    dangerouslySetInnerHTML={{__html: svg}}/>;
}

const MOVIE = Object.freeze({stage: G678_NMS_L01_P042_CONFIG.stage, fps: 12, frameCount: 10, durationMs: Math.round(10 * 1000 / 12)});
export const G678_NMS_L01_P042_CANDIDATE_MODULE = Object.freeze({
  key: G678_NMS_L01_P042_CONFIG.animationId, maturity: 'private-current-js', movie: MOVIE,
  runtime: Object.freeze({...MOVIE, defaultFrameDomain: 'sprite-23', frameDomains: Object.freeze([
    Object.freeze({id: 'root', frameCount: 10, fps: 12}),
    Object.freeze({id: 'sprite-23', frameCount: 125, fps: 12, rootFrame: 6}),
  ])}),
  playbackMode: 'once', playbackEndFrame: 125,
  playbackEndFrameByDomain: Object.freeze({root: 1, 'sprite-23': 125}), reducedMotionFrame: 125,
  scenarios: Object.freeze([Object.freeze({id: G678_NMS_L01_P042_CONFIG.scenario,
    label: 'Source-bound static four-step plan',
    description: 'Full source root composition; narration is not integrated. This is an unregistered candidate.'})]),
  defaultScenarioByFrameDomain: Object.freeze({'sprite-23': G678_NMS_L01_P042_CONFIG.scenario}),
  audioCues: Object.freeze([]), audioTracks: Object.freeze([]), interactiveAudioAssets: Object.freeze([]),
  lessonHost: Object.freeze({capabilities: Object.freeze([]), legacyOperations: 'blocked',
    auditStorage: 'memory-only', storesPersonalData: false}),
  Renderer: NmsL01P042SourceRenderer, getFrameState: resolveNmsL01P042Frame,
} satisfies AnimationModule);
