'use client';

import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import type {AnimationModule, AnimationRendererProps} from '../contract';
import {P012Controls} from '../alg-l12-p012-controls';
import {P012TypographyRenderer, type P012TypographyAsset} from '../alg-l12-p012-typography-renderer';
import {loadP012Typography} from '../alg-l12-p012-typography-asset';
import {P012_TEXT_BINDING, p012LessonTextSnapshot} from '../alg-l12-p012-text-binding';
import {reduceP012Lesson, type P012LessonAction, type P012LessonState} from '../alg-l12-p012-lesson';
import {P012_TYPOGRAPHY_ASSETS, p012FrameState, SHARED_ALG001_L12_P012_RUNTIME} from '../timelines/shared-alg001-l12-p012';

export {SHARED_ALG001_L12_P012_SOURCE, SHARED_ALG001_L12_P012_RUNTIME} from '../timelines/shared-alg001-l12-p012';

/** Canonical visual/interaction surface. Source audio and transport in the
 * formal My Lesson route belong to its required private P012 adapter. Both
 * surfaces use the identical typography, controls and pure behavior reducer. */
export function P012ModuleRenderer(props: AnimationRendererProps) {
  const {frameDomain, rootFrame, scenario, lang, seed, replay} = props;
  const pausedInput = useRef(props.paused);
  useLayoutEffect(() => {pausedInput.current = props.paused;}, [props.paused]);
  const [asset, setAsset] = useState<P012TypographyAsset | null>(null);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<P012LessonState | null>(null);
  const state = useRef<P012LessonState | null>(null);
  const frame = props.reducedMotion ? 119 : props.frame;
  useLayoutEffect(() => {
    const entry = p012FrameState(frame, {frame, frameDomain, rootFrame, scenario, lang, seed, replay});
    state.current = entry.lesson && reduceP012Lesson(entry.lesson, {kind: pausedInput.current ? 'pause' : 'play'});
    setView(state.current);
  }, [frame, frameDomain, rootFrame, scenario, lang, seed, replay]); // Pause preserves a partial movement.
  useEffect(() => {
    let live = true;
    void loadP012Typography(P012_TYPOGRAPHY_ASSETS).then(value => {if (live) setAsset(value);})
      .catch(() => {if (live) setFailed(true);});
    return () => {live = false;};
  }, []);
  useLayoutEffect(() => {
    if (!state.current) return;
    state.current = reduceP012Lesson(state.current, {kind: props.paused ? 'pause' : 'play'});
    setView(state.current);
  }, [props.paused]);
  useEffect(() => {
    let handle = 0, previous = performance.now();
    const tick = (now: number) => {
      if (!state.current || state.current.phase !== 'interaction' || state.current.paused || now - previous > 1000) previous = now;
      else {
        while (now - previous >= 1000 / 12) {
          state.current = reduceP012Lesson(state.current, {kind: 'tick'});
          previous += 1000 / 12;
        }
        setView(state.current);
      }
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, []);
  const dispatch = (action: P012LessonAction) => {
    if (state.current) {state.current = reduceP012Lesson(state.current, action); setView(state.current);}
  };
  if (failed || !view) return <p role="status">This source frame is unavailable.</p>;
  if (!asset) return <p role="status">Loading lesson text and illustration…</p>;
  return <div data-p012-module="source-bound-visual-interaction" data-source-audio-owner="private-p012-lesson-adapter"
    data-flash-frame={view.frame} data-flash-frame-domain="sprite-86" data-flash-root-frame="6"
    data-flash-scenario={props.scenario} data-flash-lang={props.lang} data-flash-seed={props.seed}
    data-flash-trace-id={props.traceId} data-flash-requirement-id={props.requirementId}
    data-flash-entry-state-sha256={props.entryStateSha256} data-flash-replay={props.replay ?? 0}>
    <P012TypographyRenderer asset={asset} state={view} uiLanguage={props.uiLanguage}
      onCoordinate={props.onLessonHostRequest ? trigger => {
        props.onLessonHostRequest?.({type: 'open-glossary', entryId: 'coordinate'}, {trigger});
      } : undefined}/>
    {view.phase === 'interaction' && <P012Controls state={view.interaction}
      dispatch={action => dispatch({kind: 'interaction', action})}/>}
  </div>;
}

const animation: AnimationModule<ReturnType<typeof p012FrameState>> = {
  key: 'shared-alg001-l12-p012', maturity: 'private-current-js',
  movie: SHARED_ALG001_L12_P012_RUNTIME, runtime: SHARED_ALG001_L12_P012_RUNTIME,
  playbackMode: 'once', playbackEndFrame: 119, reducedMotionFrame: 119,
  playbackEndFrameByDomain: {'sprite-86': 119},
  scenarios: [{id: 'ordered-pairs-interaction', label: 'Ordered pairs interaction'}],
  defaultScenarioByFrameDomain: {'sprite-86': 'ordered-pairs-interaction'},
  audioCues: [],
  textPresentation: {
    schemaVersion: 1, binding: P012_TEXT_BINDING, Renderer: P012ModuleRenderer,
    reducedMotionFrameByDomain: {'sprite-86': 119},
    prepare: async () => {await loadP012Typography(P012_TYPOGRAPHY_ASSETS);},
    getSnapshot: p012LessonTextSnapshot,
  },
  lessonHost: {capabilities: ['glossary'], legacyOperations: 'blocked',
    auditStorage: 'memory-only', storesPersonalData: false},
  // Reaching the stopped source frame does not constitute exercise completion.
  // This open-ended interaction has no invented success/score transition.
  interactiveStops: [{id: 'p012-coordinate-exploration', frameDomain: 'sprite-86', stopFrame: 119,
    resumeFrame: 119, resolution: 'explicit-source-control-finished',
    completionDisposition: 'blocked-while-unresolved', requiresHostInteractiveStop: true,
    strictAcceptanceEffect: 'none'}],
  Renderer: P012ModuleRenderer, getFrameState: p012FrameState,
};
export default Object.freeze(animation);
