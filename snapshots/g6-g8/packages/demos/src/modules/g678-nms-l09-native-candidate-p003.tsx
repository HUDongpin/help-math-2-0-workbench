'use client';

import React, {useEffect, useState} from 'react';
import type {AnimationModule, AnimationRendererProps, RuntimeContext} from '../contract';
import type {NmsL09P003CanvasCandidate} from
  '../timelines/shared-nms002-l09-p003-canvas-bridge';
import {loadNmsL09P003LocalAsset} from
  '../timelines/shared-nms002-l09-p003-local-asset';
import {NmsL09P003NativeCandidate} from
  '../timelines/shared-nms002-l09-p003-native-candidate';
import {createNmsL09P003Clock, NMS_L09_P003_SOURCE,
  NMS_L09_P003_TEXT_BINDING, projectNmsL09P003Text} from
  '../timelines/g678-nms-l09-p003';

const DOMAIN = NMS_L09_P003_SOURCE.mainFrameDomain;
const ROOT_FRAME = NMS_L09_P003_SOURCE.rootBeginFrame;
const SCENARIO = 'source-static-frame';

function exactContext(frame: number, context: RuntimeContext): RuntimeContext {
  if (context.frame !== frame || context.frameDomain !== DOMAIN ||
      context.rootFrame !== ROOT_FRAME || context.scenario !== SCENARIO ||
      context.seed !== 0 || !Number.isSafeInteger(context.replay ?? 0) ||
      (context.replay ?? 0) < 0) {
    throw new Error('P003 private module requires the exact nested source context');
  }
  return context;
}

function state(frame: number, context: RuntimeContext) {
  const source = exactContext(frame, context);
  const clock = Object.freeze({...createNmsL09P003Clock(frame),
    revision: source.replay ?? 0});
  return Object.freeze({...projectNmsL09P003Text(clock, source),
    frameDomain: DOMAIN, scenario: source.scenario, language: source.lang});
}

function Renderer(props: AnimationRendererProps) {
  if (props.audioEnabled) {
    throw new Error('P003 source audio is not admitted');
  }
  const context = exactContext(props.frame, {
    frame: props.frame, frameDomain: props.frameDomain,
    rootFrame: props.rootFrame, scenario: props.scenario,
    lang: props.lang, seed: props.seed, replay: props.replay,
  });
  const clock = Object.freeze({...createNmsL09P003Clock(props.frame),
    revision: context.replay ?? 0,
    playing: !props.paused && props.frame < NMS_L09_P003_SOURCE.terminalStopFrame});
  const [adapter, setAdapter] = useState<NmsL09P003CanvasCandidate | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let mounted = true;
    void loadNmsL09P003LocalAsset().then(value => {
      if (mounted) setAdapter(value);
    }).catch(() => {if (mounted) setFailed(true);});
    return () => {mounted = false;};
  }, []);
  if (failed) return <p role="status">The source-bound lesson figure could not load.</p>;
  if (!adapter) return <p role="status">Loading source-bound lesson figure…</p>;
  return <NmsL09P003NativeCandidate adapter={adapter} clock={clock}
    context={context}/>;
}

const movie = Object.freeze({stage: Object.freeze({width: 800, height: 600}),
  fps: 12, frameCount: 10, durationMs: 10000 / 12});

/** Source-bound private adapter. Registration and host review have separate gates. */
const animationModule: AnimationModule<ReturnType<typeof state>> = Object.freeze({
  key: NMS_L09_P003_SOURCE.animationId,
  movie,
  runtime: Object.freeze({...movie, defaultFrameDomain: DOMAIN,
    frameDomains: Object.freeze([{id: 'root', frameCount: 10},
      {id: DOMAIN, frameCount: NMS_L09_P003_SOURCE.mainFrameCount,
        rootFrame: ROOT_FRAME}])}),
  maturity: 'private-current-js',
  playbackMode: 'once',
  playbackEndFrameByDomain: Object.freeze({root: ROOT_FRAME,
    [DOMAIN]: NMS_L09_P003_SOURCE.terminalStopFrame}),
  reducedMotionFrame: 1,
  scenarios: Object.freeze([{id: SCENARIO, label: 'Source frame'}]),
  defaultScenarioByFrameDomain: Object.freeze({[DOMAIN]: SCENARIO}),
  audioCues: Object.freeze([]),
  Renderer,
  getFrameState: state,
  textPresentation: Object.freeze({schemaVersion: 1,
    binding: NMS_L09_P003_TEXT_BINDING, Renderer,
    reducedMotionFrameByDomain: Object.freeze({[DOMAIN]: 1}),
    getSnapshot(projected: ReturnType<typeof state>, context: RuntimeContext) {
      const expected = state(context.frame, context);
      if (JSON.stringify(projected) !== JSON.stringify(expected)) {
        throw new Error('P003 text presentation state mismatch');
      }
      return projected.snapshot;
    }}),
});

export default animationModule;
