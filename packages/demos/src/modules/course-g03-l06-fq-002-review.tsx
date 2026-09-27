'use client';

import React, {useEffect, useRef, useState} from 'react';

import type {AnimationModule, AnimationRendererProps, RuntimeContext} from '../contract';
import {
  COURSE_G03_L06_FQ_002_REVIEW_MOVIE,
  COURSE_G03_L06_FQ_002_REVIEW_RUNTIME,
  getCourseG03L06Fq002ReviewFrameState,
  type CourseG03L06Fq002ReviewFrameState
} from '../timelines/course-g03-l06-fq-002-review';

const ANIMATION_ID = 'course-g03-l06-fq-002-review';
const ASSET_SOURCE = '/flash-assets/courses/course-g03-l06-fq-002-review/canvas-renderer.js';

interface CanvasAsset {
  readonly ready: () => Promise<void>;
  readonly render: (
    canvas: HTMLCanvasElement,
    request: {frame: number; scenario: string; lang: string; seed: number}
  ) => unknown;
}

interface CanvasRenderState {
  readonly frameDomain: string;
  readonly localFrame: number;
  readonly rootFrame: number;
  readonly scenario: string;
  readonly lang: string;
  readonly seed: number;
}

interface CanvasRenderStatus {
  readonly identity: string | null;
  readonly status: 'idle' | 'loading' | 'ready' | 'error';
}

declare global {
  interface Window {
    HELP_MATH_CANVAS_ASSETS?: Record<string, CanvasAsset>;
  }
}

let assetLoadPromise: Promise<CanvasAsset> | null = null;

function loadCanvasAsset(): Promise<CanvasAsset> {
  const registered = window.HELP_MATH_CANVAS_ASSETS?.[ANIMATION_ID];
  if (registered) return Promise.resolve(registered);
  if (assetLoadPromise) return assetLoadPromise;
  assetLoadPromise = new Promise<CanvasAsset>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-help-math-canvas-asset="${ANIMATION_ID}"]`
    );
    const script = existing ?? document.createElement('script');
    const finish = () => {
      const asset = window.HELP_MATH_CANVAS_ASSETS?.[ANIMATION_ID];
      if (asset) resolve(asset);
      else reject(new Error('Canvas asset loaded without registering the expected animation'));
    };
    script.onload = finish;
    script.onerror = () => reject(new Error('The local Canvas asset could not be loaded'));
    if (!existing) {
      script.async = true;
      script.dataset.helpMathCanvasAsset = ANIMATION_ID;
      script.src = ASSET_SOURCE;
      document.head.appendChild(script);
    } else if (window.HELP_MATH_CANVAS_ASSETS?.[ANIMATION_ID]) finish();
  }).catch((error) => {
    assetLoadPromise = null;
    throw error;
  });
  return assetLoadPromise;
}

function isFrameState(value: unknown): value is CourseG03L06Fq002ReviewFrameState {
  return Boolean(value && typeof value === 'object' && 'frame' in value && 'frameDomain' in value);
}

function isCanvasRenderState(value: unknown): value is CanvasRenderState {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'frameDomain' in value &&
      'localFrame' in value &&
      'rootFrame' in value &&
      'scenario' in value &&
      'lang' in value &&
      'seed' in value
  );
}

export function CourseG03L06Fq002ReviewRenderer({
  entryStateSha256,
  frame,
  frameDomain,
  lang,
  onReplay,
  requirementId,
  rootFrame,
  scenario,
  seed,
  state,
  traceId
}: AnimationRendererProps) {
  const deterministicState = isFrameState(state)
    ? state
    : getCourseG03L06Fq002ReviewFrameState(frame, {
        frameDomain,
        lang,
        rootFrame,
        scenario,
        seed
      });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderIdentity = [
    ANIMATION_ID,
    deterministicState.frameDomain,
    deterministicState.frame,
    deterministicState.rootFrame,
    deterministicState.scenario,
    deterministicState.language,
    deterministicState.seed,
    requirementId ?? '',
    traceId ?? '',
    entryStateSha256 ?? ''
  ].join('\u0000');
  const [canvasRenderStatus, setCanvasRenderStatus] = useState<CanvasRenderStatus>({
    identity: null,
    status: 'idle'
  });
  const canvasStatus = canvasRenderStatus.identity === renderIdentity
    ? canvasRenderStatus.status
    : 'loading';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (
      !canvas ||
      deterministicState.status !== 'ready' ||
      deterministicState.frameDomain !== 'sprite-1168'
    ) {
      setCanvasRenderStatus({identity: null, status: 'idle'});
      return;
    }
    let cancelled = false;
    setCanvasRenderStatus({identity: renderIdentity, status: 'loading'});
    loadCanvasAsset()
      .then(async (asset) => {
        await asset.ready();
        if (cancelled) return;
        const rendered = asset.render(canvas, {
          frame: deterministicState.frame,
          scenario: deterministicState.scenario,
          lang: deterministicState.language,
          seed: deterministicState.seed
        });
        if (
          !isCanvasRenderState(rendered) ||
          rendered.localFrame !== deterministicState.frame ||
          rendered.frameDomain !== deterministicState.frameDomain ||
          rendered.rootFrame !== deterministicState.rootFrame ||
          rendered.scenario !== deterministicState.scenario ||
          rendered.lang !== deterministicState.language ||
          rendered.seed !== deterministicState.seed ||
          canvas.dataset.flashFrame !== String(deterministicState.frame) ||
          canvas.dataset.flashFrameDomain !== deterministicState.frameDomain ||
          canvas.dataset.flashRootFrame !== String(deterministicState.rootFrame) ||
          canvas.dataset.runtimeScenario !== deterministicState.scenario ||
          canvas.dataset.runtimeSeed !== String(deterministicState.seed)
        ) {
          throw new Error('Canvas asset did not report the requested deterministic context');
        }
        setCanvasRenderStatus({identity: renderIdentity, status: 'ready'});
      })
      .catch(() => {
        if (!cancelled) setCanvasRenderStatus({identity: renderIdentity, status: 'error'});
      });
    return () => {
      cancelled = true;
    };
  }, [
    deterministicState.frame,
    deterministicState.frameDomain,
    deterministicState.language,
    deterministicState.rootFrame,
    deterministicState.scenario,
    deterministicState.seed,
    deterministicState.status,
    renderIdentity
  ]);

  const blocked = deterministicState.status === 'blocked';
  const rootState = deterministicState.frameDomain === 'root' ? deterministicState : null;
  const localState = deterministicState.frameDomain === 'sprite-1168' ? deterministicState : null;
  const reportedCanvasStatus = blocked
    ? 'blocked'
    : rootState
      ? 'root-authoritative-frame'
      : canvasStatus;
  const rendererReady = blocked || Boolean(rootState) || canvasStatus === 'ready';
  const rendererState = blocked
    ? 'blocked'
    : rootState || canvasStatus === 'ready'
      ? 'ready'
      : canvasStatus === 'error'
        ? 'error'
        : 'loading';

  return (
    <section
      aria-label="Decimals and Money final quiz review"
      data-audio-rendered="false"
      data-candidate-status="engineering-structural-frame-only"
      data-canvas-status={reportedCanvasStatus}
      style={{margin: '0 auto', maxWidth: 800, width: '100%'}}
    >
      <div
        className="faithful-stage-wrap"
        data-animation-id={ANIMATION_ID}
        data-canvas-status={reportedCanvasStatus}
        data-capture-stage="true"
        data-flash-entry-state-sha256={entryStateSha256}
        data-flash-frame={rendererReady ? deterministicState.frame : undefined}
        data-flash-frame-domain={deterministicState.frameDomain}
        data-flash-requirement-id={requirementId}
        data-flash-root-frame={deterministicState.rootFrame}
        data-flash-trace-id={traceId}
        data-render-state={rendererState}
        data-runtime-language={deterministicState.language}
        data-runtime-scenario={deterministicState.scenario}
        data-runtime-seed={deterministicState.seed}
        style={{aspectRatio: '4 / 3', background: '#b8d8f7', overflow: 'hidden', position: 'relative'}}
      >
        {blocked ? (
          <div
            aria-live="polite"
            data-fail-closed-reason={deterministicState.blocker ?? undefined}
            role="status"
            style={{alignItems: 'center', background: '#eaf4fb', color: '#17344c', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '8%', textAlign: 'center'}}
          >
            <strong>Versión en español no disponible</strong>
            <p>Los estados visuales, las respuestas y el audio en español todavía no cuentan con evidencia de ejecución autorizada.</p>
          </div>
        ) : rootState ? (
          <img
            alt={`Source-runtime Final Quiz root frame ${rootState.frame} of 10`}
            data-animation-id={ANIMATION_ID}
            data-flash-entry-state-sha256={entryStateSha256}
            data-flash-frame={rootState.frame}
            data-flash-frame-domain="root"
            data-flash-requirement-id={requirementId}
            data-flash-root-frame={rootState.rootFrame}
            data-flash-trace-id={traceId}
            data-render-state="ready"
            data-render-visual="true"
            data-root-frame-sha256={rootState.rootFrameAsset.sha256}
            data-root-visual-authority={rootState.captureAuthority}
            data-runtime-language={rootState.language}
            data-runtime-scenario={rootState.scenario}
            data-runtime-seed={rootState.seed}
            height={600}
            src={rootState.rootFrameAsset.source}
            style={{display: 'block', height: '100%', width: '100%'}}
            width={800}
          />
        ) : (
          <>
            <canvas
              aria-label={`Source-derived final quiz structural drawing, frame ${localState!.frame} of 82`}
              data-animation-id={ANIMATION_ID}
              data-flash-entry-state-sha256={entryStateSha256}
              data-flash-frame={localState!.frame}
              data-flash-frame-domain={localState!.frameDomain}
              data-flash-requirement-id={requirementId}
              data-flash-root-frame={localState!.rootFrame}
              data-flash-trace-id={traceId}
              data-render-state={canvasStatus === 'ready' ? 'ready' : canvasStatus}
              data-render-visual="true"
              data-runtime-language={localState!.language}
              data-runtime-scenario={localState!.scenario}
              data-runtime-seed={localState!.seed}
              height={600}
              ref={canvasRef}
              role="img"
              style={{display: canvasStatus === 'ready' ? 'block' : 'none', height: '100%', width: '100%'}}
              width={800}
            />
            {canvasStatus === 'loading' ? <span aria-live="polite" role="status" style={{left: 12, position: 'absolute', top: 12}}>Loading source-derived drawing…</span> : null}
            {canvasStatus === 'error' ? <p aria-live="assertive" role="alert" style={{background: '#fff', inset: 0, margin: 0, padding: '10%', position: 'absolute'}}>The local drawing asset failed safely. No legacy or remote fallback was executed.</p> : null}
          </>
        )}
      </div>
      <div aria-label="Candidate controls and limitations" style={{alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 10}}>
        <button onClick={onReplay} type="button">Replay</button>
        {rootState && !blocked ? (
          <span>Hash-bound standalone root frame only; natural host entry, answer behavior, scoring, reporting, audio, and Replay semantics remain separate unresolved gates.</span>
        ) : (
          <span>Structural frame candidate only; answer handling, score, review navigation, reporting, bilingual audio, and completion remain disabled.</span>
        )}
      </div>
    </section>
  );
}

const animationModule: AnimationModule<CourseG03L06Fq002ReviewFrameState> = Object.freeze({
  key: ANIMATION_ID,
  movie: COURSE_G03_L06_FQ_002_REVIEW_MOVIE,
  runtime: COURSE_G03_L06_FQ_002_REVIEW_RUNTIME,
  playbackMode: 'once',
  playbackEndFrame: 1,
  playbackEndFrameByDomain: Object.freeze({root: 1, 'sprite-1168': 1}),
  reducedMotionFrame: 1,
  defaultScenarioByFrameDomain: Object.freeze({root: 'root-standalone', 'sprite-1168': 'default'}),
  scenarios: Object.freeze([
    Object.freeze({
      id: 'default',
      label: 'Structural source-drawing inspection',
      description: 'No AVM1 interaction, score, answer, reporting, or audio behavior is claimed.'
    }),
    Object.freeze({
      id: 'root-standalone',
      label: 'Standalone source root frame inspection',
      description: 'Ten hash-bound Adobe standalone frames are addressable for English direct inspection; natural playback and Spanish host behavior remain unclaimed.'
    })
  ]),
  audioCues: Object.freeze([]),
  maturity: 'legacy-prototype',
  Renderer: CourseG03L06Fq002ReviewRenderer,
  getFrameState: (frame: number, context: RuntimeContext) =>
    getCourseG03L06Fq002ReviewFrameState(frame, context)
});

export default animationModule;
