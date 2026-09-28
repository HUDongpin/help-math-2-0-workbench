'use client';

import React, {useEffect, useRef, useState} from 'react';

import type {AnimationModule, AnimationRendererProps, RuntimeContext} from '../contract';
import {
  COURSE_G03_L01_VB_004_MOVIE,
  COURSE_G03_L01_VB_004_PLAYBACK_END_FRAME,
  COURSE_G03_L01_VB_004_RUNTIME,
  COURSE_G03_L01_VB_004_SOURCE,
  getCourseG03L01Vb004FrameState,
  type CourseG03L01Vb004FrameState
} from '../timelines/course-g03-l01-vb-004';

const ANIMATION_ID = 'course-g03-l01-vb-004';
const ADAPTER_SOURCE =
  '/flash-assets/courses/course-g03-l01-vb-004/index.html?adapterRevision=4&embed=1&frameDomain=sprite-231&frame=1&scenario=linear-to-quiz-stop&lang=en&seed=0';

interface AdapterState {
  readonly frame: number;
  readonly frameDomain: string;
  readonly rootFrame: number;
  readonly scenario: string;
  readonly lang: string;
  readonly seed: number;
}

interface AdapterApi {
  readonly render: (request: {
    frameDomain: string;
    frame: number;
    scenario: string;
    lang: string;
    seed: number;
  }) => AdapterState;
}

type AdapterWindow = Window & {HELP_MATH_VB004?: AdapterApi};

function isFrameState(value: unknown): value is CourseG03L01Vb004FrameState {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'frame' in value &&
      'frameDomain' in value &&
      'runtimeReachability' in value
  );
}

function blockedCopy(): {title: string; detail: string} {
  return {
    title: 'Quiz interaction unavailable',
    detail:
      'Correct, retry, forced-continuation, score, feedback, glossary, and completion branches remain disabled until the original host contract is proved.'
  };
}

function limitationCopy(state: CourseG03L01Vb004FrameState): string {
  if (state.language === 'es') {
    return 'La única línea visual de origen se muestra sin traducir. No se afirma paridad visual bilingüe ni de audio; todo el audio permanece desactivado.';
  }
  if (state.frameDomain === 'root') {
    return 'Standalone root frames are source-addressable; accepted per-frame comparison and natural host entry remain separate evidence gates.';
  }
  if (state.runtimeReachability === 'structural-only-runtime-reachability-unproven') {
    return 'This source-derived structural frame is addressable for engineering inspection only. No post-stop interaction path or runtime reachability is claimed.';
  }
  return 'Audio, glossary actions, quiz branches, scoring, feedback, and source Replay remain unavailable pending authoritative validation.';
}

export function CourseG03L01Vb004Renderer({
  entryStateSha256 = '',
  frame,
  frameDomain,
  lang,
  onReplay,
  requirementId = '',
  scenario,
  seed,
  state,
  traceId = ''
}: AnimationRendererProps) {
  const deterministicState = isFrameState(state)
    ? state
    : getCourseG03L01Vb004FrameState(frame, {
        frameDomain: frameDomain === 'root' ? 'root' : 'sprite-231',
        lang,
        scenario,
        seed
      });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [adapterStatus, setAdapterStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [adapterError, setAdapterError] = useState('');

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || deterministicState.status !== 'ready') return;
    let observer: MutationObserver | null = null;
    let cancelled = false;

    const renderRequestedFrame = () => {
      if (cancelled) return;
      const adapter = (iframe.contentWindow as AdapterWindow | null)?.HELP_MATH_VB004;
      const documentElement = iframe.contentDocument?.documentElement;
      if (!adapter || documentElement?.dataset.renderState !== 'ready') return;
      try {
        observer?.disconnect();
        const rendered = adapter.render({
          frameDomain: deterministicState.frameDomain,
          frame: deterministicState.frame,
          scenario: deterministicState.scenario,
          lang: deterministicState.language,
          seed: deterministicState.seed
        });
        const canvas = iframe.contentDocument?.querySelector<HTMLCanvasElement>('#flash-stage');
        if (
          rendered.frame !== deterministicState.frame ||
          rendered.frameDomain !== deterministicState.frameDomain ||
          rendered.rootFrame !== deterministicState.rootFrame ||
          rendered.scenario !== deterministicState.scenario ||
          rendered.lang !== deterministicState.language ||
          rendered.seed !== deterministicState.seed ||
          canvas?.dataset.flashFrame !== String(deterministicState.frame) ||
          canvas?.dataset.flashFrameDomain !== deterministicState.frameDomain ||
          canvas?.dataset.flashRootFrame !== String(deterministicState.rootFrame)
        ) {
          throw new Error('embedded adapter did not report the requested deterministic state');
        }
        setAdapterError('');
        setAdapterStatus('ready');
      } catch (error) {
        setAdapterError(error instanceof Error ? error.message : String(error));
        setAdapterStatus('error');
      }
    };

    const attach = () => {
      if (cancelled) return;
      setAdapterStatus('loading');
      const documentElement = iframe.contentDocument?.documentElement;
      if (!documentElement) {
        setAdapterError('embedded adapter document is unavailable');
        setAdapterStatus('error');
        return;
      }
      observer?.disconnect();
      observer = new MutationObserver(renderRequestedFrame);
      observer.observe(documentElement, {
        attributeFilter: ['data-render-state'],
        attributes: true
      });
      renderRequestedFrame();
    };

    iframe.addEventListener('load', attach);
    if (iframe.contentDocument?.readyState === 'complete') attach();
    return () => {
      cancelled = true;
      observer?.disconnect();
      iframe.removeEventListener('load', attach);
    };
  }, [
    deterministicState.frame,
    deterministicState.frameDomain,
    deterministicState.language,
    deterministicState.rootFrame,
    deterministicState.scenario,
    deterministicState.seed,
    deterministicState.status
  ]);

  const blocked = deterministicState.status === 'blocked' ? blockedCopy() : null;
  const rendererReady = Boolean(blocked) || adapterStatus === 'ready';
  const rendererState = blocked
    ? 'blocked'
    : adapterStatus === 'ready'
      ? 'ready'
      : adapterStatus === 'error'
        ? 'error'
        : 'loading';

  return (
    <section
      aria-label="Place-value chart and place-value models"
      className="faithful-conversion"
      data-adapter-status={blocked ? 'blocked' : adapterStatus}
      data-audio-localization-status={deterministicState.audioLocalizationStatus}
      data-audio-rendered="false"
      data-candidate-status="engineering-not-strict"
      data-visual-localization-status={deterministicState.visualLocalizationStatus}
      style={{margin: '0 auto', maxWidth: 800, width: '100%'}}
    >
      <div
        className="faithful-stage-wrap"
        data-adapter-status={blocked ? 'blocked' : adapterStatus}
        data-animation-id={ANIMATION_ID}
        data-capture-stage="true"
        data-flash-entry-state-sha256={entryStateSha256}
        data-flash-frame={rendererReady ? deterministicState.frame : undefined}
        data-flash-frame-domain={deterministicState.frameDomain}
        data-flash-requirement-id={requirementId}
        data-flash-root-frame={deterministicState.rootFrame}
        data-flash-trace-id={traceId}
        data-render-state={rendererState}
        data-runtime-language={deterministicState.language}
        data-runtime-reachability={deterministicState.runtimeReachability}
        data-runtime-scenario={deterministicState.scenario}
        data-runtime-seed={deterministicState.seed}
        style={{
          aspectRatio: '4 / 3',
          background: '#b8d8f7',
          overflow: 'hidden',
          position: 'relative',
          width: '100%'
        }}
      >
        {blocked ? (
          <div
            aria-live="polite"
            data-fail-closed-reason={deterministicState.blocker ?? undefined}
            role="status"
            style={{
              alignItems: 'center',
              background: '#eaf4fb',
              color: '#17344c',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              justifyContent: 'center',
              padding: '8%',
              textAlign: 'center'
            }}
          >
            <strong>{blocked.title}</strong>
            <p>{blocked.detail}</p>
          </div>
        ) : (
          <>
            <iframe
              aria-label={`Source-derived deterministic Canvas rendering, ${deterministicState.frameDomain} frame ${deterministicState.frame}`}
              data-animation-id={adapterStatus === 'ready' ? ANIMATION_ID : undefined}
              data-flash-entry-state-sha256={adapterStatus === 'ready' ? entryStateSha256 : undefined}
              data-flash-frame={adapterStatus === 'ready' ? deterministicState.frame : undefined}
              data-flash-frame-domain={adapterStatus === 'ready' ? deterministicState.frameDomain : undefined}
              data-flash-requirement-id={adapterStatus === 'ready' ? requirementId : undefined}
              data-flash-root-frame={adapterStatus === 'ready' ? deterministicState.rootFrame : undefined}
              data-flash-trace-id={adapterStatus === 'ready' ? traceId : undefined}
              data-render-state={adapterStatus}
              data-render-visual="true"
              data-runtime-language={adapterStatus === 'ready' ? deterministicState.language : undefined}
              data-runtime-scenario={adapterStatus === 'ready' ? deterministicState.scenario : undefined}
              data-runtime-seed={adapterStatus === 'ready' ? deterministicState.seed : undefined}
              ref={iframeRef}
              src={ADAPTER_SOURCE}
              style={{border: 0, display: 'block', height: '100%', width: '100%'}}
              title="Place Value source-derived Canvas adapter"
            />
            {adapterStatus === 'loading' ? (
              <span
                aria-live="polite"
                role="status"
                style={{left: 12, position: 'absolute', top: 12}}
              >
                Loading source-derived frame…
              </span>
            ) : null}
            {adapterStatus === 'error' ? (
              <p
                aria-live="assertive"
                role="alert"
                style={{background: '#fff', inset: 0, margin: 0, padding: '10%', position: 'absolute'}}
              >
                The local adapter failed safely: {adapterError}
              </p>
            ) : null}
          </>
        )}
      </div>
      <div
        aria-label="Candidate controls and limitations"
        style={{alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 10}}
      >
        <button onClick={onReplay} type="button">
          Replay
        </button>
        <span>{limitationCopy(deterministicState)}</span>
      </div>
    </section>
  );
}

const animationModule: AnimationModule<CourseG03L01Vb004FrameState> = Object.freeze({
  key: ANIMATION_ID,
  movie: COURSE_G03_L01_VB_004_MOVIE,
  runtime: COURSE_G03_L01_VB_004_RUNTIME,
  playbackMode: 'once',
  playbackEndFrame: COURSE_G03_L01_VB_004_PLAYBACK_END_FRAME,
  playbackEndFrameByDomain: Object.freeze({root: 1, 'sprite-231': 56}),
  reducedMotionFrame: COURSE_G03_L01_VB_004_PLAYBACK_END_FRAME,
  scenarios: Object.freeze([
    Object.freeze({
      id: 'linear-to-quiz-stop',
      label: 'Source timeline addressability with natural stop at frame 56',
      description:
        'Frames 1–56 are source-structured linear playback. Frames 57–222 are structural renderer inspection only and do not claim post-stop reachability.'
    }),
    Object.freeze({
      id: 'root-standalone',
      label: 'Source root timeline standalone frames',
      description:
        'Ten source-root frames are deterministically addressable; accepted per-frame comparison and original-host entry remain separate gates.'
    }),
    Object.freeze({
      id: 'authoring-frame-inspection',
      label: 'Authoring frame inspection',
      description: 'Structural frames 1–222; runtime reachability after frame 56 is not claimed.'
    }),
    Object.freeze({
      id: 'quiz-interaction-unavailable',
      label: 'Quiz branches (blocked)',
      description: 'Fails closed on unresolved host, answer, scoring, feedback, and completion state.'
    })
  ]),
  audioCues: Object.freeze([]),
  maturity: 'legacy-prototype',
  Renderer: CourseG03L01Vb004Renderer,
  getFrameState: (frame: number, context: RuntimeContext) =>
    getCourseG03L01Vb004FrameState(frame, context)
});

export default animationModule;
