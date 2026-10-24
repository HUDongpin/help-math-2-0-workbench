'use client';

import React, {useEffect, useRef, useState} from 'react';

import type {AnimationModule, AnimationRendererProps, RuntimeContext} from '../contract';
import {
  COURSE_G05_L13_RW_002_MOVIE,
  COURSE_G05_L13_RW_002_RUNTIME,
  COURSE_G05_L13_RW_002_SOURCE,
  getCourseG05L13Rw002FrameState,
  type CourseG05L13Rw002FrameState
} from '../timelines/course-g05-l13-rw-002';

const ANIMATION_ID = 'course-g05-l13-rw-002';
const ASSET_SOURCE = '/flash-assets/courses/course-g05-l13-rw-002/canvas-renderer.js';

interface CanvasAsset {
  readonly ready: () => Promise<void>;
  readonly render: (
    canvas: HTMLCanvasElement,
    request: {frame: number; scenario: string; lang: string; seed: number}
  ) => unknown;
}

interface CanvasAssetRegistryWindow extends Window {
  readonly HELP_MATH_CANVAS_ASSETS?: Record<string, CanvasAsset>;
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

type CanvasStatus = CanvasRenderStatus['status'];

function canvasAssetRegistry(): Record<string, CanvasAsset> | undefined {
  return (window as CanvasAssetRegistryWindow).HELP_MATH_CANVAS_ASSETS;
}

let assetLoadPromise: Promise<CanvasAsset> | null = null;

function loadCanvasAsset(): Promise<CanvasAsset> {
  const registered = canvasAssetRegistry()?.[ANIMATION_ID];
  if (registered) return Promise.resolve(registered);
  if (assetLoadPromise) return assetLoadPromise;
  assetLoadPromise = new Promise<CanvasAsset>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-help-math-canvas-asset="${ANIMATION_ID}"]`
    );
    const script = existing ?? document.createElement('script');
    const finish = () => {
      const asset = canvasAssetRegistry()?.[ANIMATION_ID];
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
    } else if (canvasAssetRegistry()?.[ANIMATION_ID]) finish();
  }).catch((error) => {
    assetLoadPromise = null;
    throw error;
  });
  return assetLoadPromise;
}

function isFrameState(value: unknown): value is CourseG05L13Rw002FrameState {
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

export function buildCourseG05L13Rw002CaptureAttributes({
  canvasStatus,
  entryStateSha256,
  requirementId,
  state,
  traceId
}: {
  canvasStatus: CanvasStatus;
  entryStateSha256: string;
  requirementId: string;
  state: CourseG05L13Rw002FrameState;
  traceId: string;
}) {
  const visualReady =
    state.status === 'ready' &&
    state.frameDomain === 'sprite-334' &&
    canvasStatus === 'ready';
  const captureReady =
    visualReady && Boolean(entryStateSha256 && requirementId && traceId);
  return {
    'data-animation-id': ANIMATION_ID,
    'data-capture-stage': captureReady ? 'true' : undefined,
    'data-render-state': visualReady ? 'ready' : canvasStatus,
    'data-render-visual': visualReady ? 'true' : undefined,
    'data-flash-entry-state-sha256': entryStateSha256 || undefined,
    'data-flash-frame': state.frame,
    'data-flash-frame-domain': state.frameDomain,
    'data-flash-requirement-id': requirementId || undefined,
    'data-flash-root-frame': state.rootFrame,
    'data-flash-trace-id': traceId || undefined,
    'data-runtime-language': state.language,
    'data-runtime-scenario': state.scenario,
    'data-runtime-seed': state.seed,
    'data-visual-localization-status': state.visualLocalizationStatus
  } as const;
}

export function CourseG05L13Rw002Renderer({
  entryStateSha256 = '',
  frame,
  frameDomain,
  lang,
  onReplay,
  requirementId = '',
  rootFrame,
  scenario,
  seed,
  state,
  traceId = ''
}: AnimationRendererProps) {
  const deterministicState = isFrameState(state)
    ? state
    : getCourseG05L13Rw002FrameState(frame, {
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
      deterministicState.frameDomain !== 'sprite-334'
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
          canvas.dataset.runtimeLanguage !== deterministicState.language ||
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

  const rootState = deterministicState.frameDomain === 'root' ? deterministicState : null;
  const localState = deterministicState.frameDomain === 'sprite-334' ? deterministicState : null;
  const reportedCanvasStatus = rootState ? 'root-authoritative-frame' : canvasStatus;
  const rendererReady = Boolean(rootState) || canvasStatus === 'ready';
  const rendererState = rootState || canvasStatus === 'ready'
    ? 'ready'
    : canvasStatus === 'error'
      ? 'error'
      : 'loading';
  const limitationCopy = deterministicState.language === 'es'
    ? 'Se conserva sin traducir la misma secuencia visual de la fuente. La escucha y sincronización del audio en español, el comportamiento del host, la interacción y Replay siguen pendientes.'
    : rootState
      ? 'Hash-bound standalone root frame only; natural child entry, click transition, terminal behavior, source Replay, and audio remain unresolved.'
      : 'Source drawings 1–1873 are directly addressable in both language contexts without translation. Normal playback still stops at frame 673; authoritative runtime execution, the source interaction, Replay, audio, and human/owner acceptance remain pending.';

  return (
    <section
      aria-label="Geometry: Your World"
      data-audio-rendered="false"
      data-audio-localization-status={deterministicState.audioLocalizationStatus}
      data-audio-status={deterministicState.audioStatus}
      data-candidate-status="engineering-not-strict"
      data-canvas-status={reportedCanvasStatus}
      data-host-integration-status={deterministicState.hostIntegrationStatus}
      data-strict-acceptance-effect="none"
      data-visual-localization-status={deterministicState.visualLocalizationStatus}
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
        data-source-schedule-phase={localState?.sourceSchedulePhase}
        data-source-schedule-sha256={localState?.sourceScheduleSha256}
        data-source-schedule-status={localState?.sourceScheduleStatus}
        data-source-schedule-step-execution-claimed={
          localState ? String(localState.sourceScheduleStepExecutionClaimed) : undefined
        }
        data-visual-localization-status={deterministicState.visualLocalizationStatus}
        style={{aspectRatio: '4 / 3', background: '#b8d8f7', overflow: 'hidden', position: 'relative'}}
      >
        {rootState ? (
          <img
            alt={`Source-runtime Geometry root frame ${rootState.frame} of 10`}
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
            data-visual-localization-status={rootState.visualLocalizationStatus}
            height={600}
            src={rootState.rootFrameAsset.source}
            style={{display: 'block', height: '100%', width: '100%'}}
            width={800}
          />
        ) : (
          <>
            <canvas
              {...buildCourseG05L13Rw002CaptureAttributes({
                canvasStatus,
                entryStateSha256,
                requirementId,
                state: localState!,
                traceId
              })}
              aria-label={`Source-derived Geometry animation drawing, frame ${localState!.frame} of 1873`}
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
        <span>{limitationCopy}</span>
      </div>
    </section>
  );
}

const animationModule: AnimationModule<CourseG05L13Rw002FrameState> = Object.freeze({
  key: ANIMATION_ID,
  movie: COURSE_G05_L13_RW_002_MOVIE,
  runtime: COURSE_G05_L13_RW_002_RUNTIME,
  playbackMode: 'once',
  playbackEndFrame: COURSE_G05_L13_RW_002_SOURCE.firstStopFrame,
  playbackEndFrameByDomain: Object.freeze({
    root: 1,
    'sprite-334': COURSE_G05_L13_RW_002_SOURCE.firstStopFrame
  }),
  reducedMotionFrame: COURSE_G05_L13_RW_002_SOURCE.firstStopFrame,
  defaultScenarioByFrameDomain: Object.freeze({root: 'root-standalone', 'sprite-334': 'default'}),
  scenarios: Object.freeze([
    Object.freeze({
      id: 'root-standalone',
      label: 'Standalone source root frame inspection',
      description: 'Ten hash-bound Adobe standalone frames are addressable as the same untranslated source visual in en and es contexts; natural child entry, interaction, and audio remain unclaimed.'
    }),
    Object.freeze({
      id: 'default',
      label: 'Source-scheduled untranslated drawing timeline',
      description: 'Static source drawings 1–1873 are directly addressable in en and es contexts without translation; normal playback stops at frame 673 and no authoritative runtime execution is claimed.'
    })
  ]),
  audioCues: Object.freeze([]),
  maturity: 'legacy-prototype',
  Renderer: CourseG05L13Rw002Renderer,
  getFrameState: (frame: number, context: RuntimeContext) =>
    getCourseG05L13Rw002FrameState(frame, context)
});

export default animationModule;
