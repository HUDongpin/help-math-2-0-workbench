'use client';
import React, {useLayoutEffect, useState} from 'react';
import type {AnimationRendererProps} from '../../contract';
import type {LessonTextPresentationCapability} from '../../lesson-text-contract';
import {createSourceStaticCanvasCandidate, type SourceStaticCanvasFrameState} from '../../source-static-canvas-candidate';
import {COURSE_G04_L03_IN_010_CONFIG} from '../../timelines/course-g04-l03-in-010';
import {BINDING, DOMAIN, FEEDBACK_COPY, ID, SOURCE_TITLE, VERSION, getIn010Snapshot} from './binding';
import {IN010_AUDIO_HOST} from './audio-host';
import {SourceFigure} from './SourceFigure';
import {NativeQuiz} from './NativeQuiz';
import {useIn010Session} from './Session';
import {NATIVE_STYLES} from './native-styles';
import {createPreparedAssetStore} from './asset-lifecycle';
import {loadIn010Assets, type In010Assets} from './assets';

export const IN010_KEY_TERMS = {
  indexLanguage: 'en', sourceAssetId: 'ELKTEG4.xml',
  sourceSha256: 'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
  entryIds: ['en-0684-c1f7ef269aea', 'en-0694-ee23f1e354bc'],
} as const;
const sourceState = createSourceStaticCanvasCandidate(COURSE_G04_L03_IN_010_CONFIG).getFrameState;
const assets = createPreparedAssetStore<In010Assets>(loadIn010Assets);
export async function prepareIn010(signal?: AbortSignal) {
  // Node preflight verifies metadata only; it cannot attest browser asset readiness.
  if (typeof window === 'undefined') return;
  await assets.prepare(signal);
}
export function disposeIn010PreparedAssets() { assets.disposeUnused(); }
function sourceContext(runtime: AnimationRendererProps) {
  const context = {...runtime, frameDomain: runtime.frameDomain ?? DOMAIN};
  const state = (runtime.state ?? sourceState(runtime.frame, context)) as SourceStaticCanvasFrameState;
  return {context, state};
}
export function requestIn010Keyword(runtime: AnimationRendererProps, term: 'Temperature' | 'Thermometer', trigger: HTMLElement) {
  const {context, state} = sourceContext(runtime);
  const snapshot = getIn010Snapshot(state, context);
  if (runtime.entryStateSha256 || snapshot.status !== 'ready' || !snapshot.blocks.find(block => block.id === 'instruction')?.visible) return null;
  return runtime.onLessonHostRequest?.({
    type: 'open-keyterm', entryId: IN010_KEY_TERMS.entryIds[term === 'Temperature' ? 0 : 1],
    sourceAnimationId: ID,
    playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume',
  }, {trigger, keyTermIndexLanguage: 'en'}) ?? null;
}
function useViewportInvalidation() {
  const [, invalidate] = useState(0);
  useLayoutEffect(() => {
    let query: MediaQueryList | null = null;
    const changed = () => {
      invalidate(value => value + 1);
      query?.removeEventListener('change', changed);
      query = window.matchMedia?.(`(resolution: ${window.devicePixelRatio || 1}dppx)`) ?? null;
      query?.addEventListener('change', changed);
    };
    changed();
    window.addEventListener('resize', changed);
    window.visualViewport?.addEventListener('resize', changed);
    return () => {
      query?.removeEventListener('change', changed);
      window.removeEventListener('resize', changed);
      window.visualViewport?.removeEventListener('resize', changed);
    };
  }, []);
}
function LessonSession(runtime: AnimationRendererProps) {
  useViewportInvalidation();
  const [resource, setResource] = useState<{value: In010Assets | null; failed: boolean}>(() => ({value: assets.peekReady(), failed: false}));
  useLayoutEffect(() => {
    let live = true;
    const lease = assets.acquire();
    lease.ready.then(value => {if (live) setResource({value, failed: false});}, () => {if (live) setResource({value: null, failed: true});});
    return () => {live = false; lease.release();};
  }, []);
  const {state, context} = sourceContext(runtime);
  const baseline = getIn010Snapshot(state, context);
  const ready = baseline.status === 'ready' && !!resource.value && !resource.failed;
  const session = useIn010Session(runtime, ready, ID);
  const snapshot = getIn010Snapshot(state, context, session.state);
  if (snapshot.status !== 'ready' || resource.failed) return <p role="status" data-lesson-text-status="blocked">This lesson view is unavailable in the selected context.</p>;
  if (!resource.value) return <p role="status" data-source-preparation-status="loading">Loading lesson graphics…</p>;
  const loaded = resource.value;
  const keyword = (term: 'Temperature' | 'Thermometer', trigger: HTMLElement) => {requestIn010Keyword(runtime, term, trigger);};
  const rawDpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  const figure = <SourceFigure input={loaded.input} geometry={loaded.geometry} bitmaps={loaded.bitmaps}
    frame={runtime.frame} placements={runtime.frame === 264 ? session.state.placements : undefined}
    dpr={Math.min(2, rawDpr)} locale={runtime.uiLanguage ?? runtime.lang} onKeyword={keyword}
    showInstruction={runtime.frame !== 264} showTargetReadout={runtime.frame !== 264}
    representedCityCodes={runtime.frame === 264 ? ['A','B','C','D','E','F'] : []}/>;
  return <section className="in010-surface" lang="en" data-modern-text-page={ID} data-lesson-text-binding={VERSION}
    data-lesson-frame={runtime.frame} data-lesson-seed={runtime.seed} data-lesson-replay={runtime.replay ?? 0}
    data-lesson-activities={JSON.stringify(runtime.lessonActivities ?? [])}
    data-lesson-text-status="ready" data-source-language-policy="english-source-visual-fallback"
    data-native-dpr-status={rawDpr > 2 ? 'capped' : 'supported'} data-in010-session-status={session.status}>
    <style>{NATIVE_STYLES}</style>
    <h2 data-lesson-text-block="title">{SOURCE_TITLE}</h2>
    {runtime.frame === 264 ? <NativeQuiz sourceTextByBlock={Object.fromEntries(snapshot.blocks.map(block => [block.id, block.text]))} state={session.state} dispatch={session.dispatch}
      controlsReady={ready && !runtime.paused && !runtime.entryStateSha256} feedbackCopy={FEEDBACK_COPY}
      sourceFigure={figure} onKeyword={keyword} onDrop={session.onDrop}
      onClosePress={session.onClosePress} onCloseRelease={session.onCloseRelease} lessonActivities={runtime.lessonActivities}/> : figure}
  </section>;
}
export function In010Renderer(runtime: AnimationRendererProps) {
  return <LessonSession key={`${runtime.seed}:${runtime.replay ?? 0}`} {...runtime}/>;
}
export const IN010_PRESENTATION: LessonTextPresentationCapability<SourceStaticCanvasFrameState> = {
  schemaVersion: 1, binding: BINDING, Renderer: In010Renderer, getSnapshot: getIn010Snapshot,
  prepare: prepareIn010, ...IN010_AUDIO_HOST, keyTerms: IN010_KEY_TERMS,
};
