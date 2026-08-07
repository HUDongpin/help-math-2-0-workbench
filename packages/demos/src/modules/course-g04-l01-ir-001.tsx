'use client';

import React, {useEffect, useRef, useState} from 'react';

import type {AnimationModule, AnimationRendererProps, RuntimeContext} from '../contract';
import {
  COURSE_G04_L01_IR_001_MOVIE,
  COURSE_G04_L01_IR_001_RUNTIME,
  COURSE_G04_L01_IR_001_SOURCE,
  getCourseG04L01Ir001FrameState,
  type CourseG04L01Ir001FrameState,
  type CourseG04L01Ir001RootFrameState
} from '../timelines/course-g04-l01-ir-001';

const ANIMATION_ID = 'course-g04-l01-ir-001';
const ASSET_SOURCE =
  '/flash-assets/courses/course-g04-l01-ir-001/canvas-renderer.js?revision=2f8e103fd39bfbe9';
const ROOT_FRAME_ASSET_BASE =
  '/flash-assets/courses/course-g04-l01-ir-001/root-standalone';

interface CanvasAsset {
  readonly ready: () => Promise<void>;
  readonly render: (
    canvas: HTMLCanvasElement,
    request: {frame: number; scenario: string; lang: string; seed: number}
  ) => unknown;
}

declare global {
  interface Window {
    HELP_MATH_CANVAS_ASSETS?: Record<string, CanvasAsset>;
  }
}

let assetLoadPromise: Promise<CanvasAsset> | null = null;
const rootFrameLoads = new Map<string, Promise<HTMLImageElement>>();

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

function loadRootFrameAsset(file: string): Promise<HTMLImageElement> {
  const existing = rootFrameLoads.get(file);
  if (existing) return existing;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'sync';
    image.onload = () => {
      if (image.naturalWidth === 800 && image.naturalHeight === 600) resolve(image);
      else reject(new Error(`Root frame ${file} is not the native 800x600 stage`));
    };
    image.onerror = () => reject(new Error(`Root frame ${file} could not be loaded`));
    image.src = `${ROOT_FRAME_ASSET_BASE}/${file}`;
  }).catch((error) => {
    rootFrameLoads.delete(file);
    throw error;
  });
  rootFrameLoads.set(file, promise);
  return promise;
}

function stampCanvasIdentity(canvas: HTMLCanvasElement, state: CourseG04L01Ir001FrameState) {
  canvas.dataset.flashFrame = String(state.frame);
  canvas.dataset.flashFrameDomain = state.frameDomain;
  canvas.dataset.flashRootFrame = String(state.rootFrame);
  canvas.dataset.runtimeScenario = state.scenario;
  canvas.dataset.runtimeLanguage = state.language;
  canvas.dataset.runtimeSeed = String(state.seed);
  canvas.dataset.audioStatus = state.audioStatus;
  canvas.dataset.audioLocalizationStatus = state.audioLocalizationStatus;
  canvas.dataset.hostIntegrationStatus = state.hostIntegrationStatus;
  canvas.dataset.visualLocalizationStatus = state.visualLocalizationStatus;
}

async function renderRootFrame(
  canvas: HTMLCanvasElement,
  state: CourseG04L01Ir001RootFrameState
) {
  const image = await loadRootFrameAsset(state.rootAssetFile);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The root-frame Canvas 2D context is unavailable');
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'source-over';
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, 800, 600);
  stampCanvasIdentity(canvas, state);
}

function isFrameState(value: unknown): value is CourseG04L01Ir001FrameState {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'frame' in value &&
      'frameDomain' in value &&
      'hostIntegrationStatus' in value
  );
}

function limitationCopy(state: CourseG04L01Ir001FrameState): string {
  if (state.language === 'es') {
    return 'Se conserva sin traducir la única secuencia visual de la fuente; el idioma, la escucha y la sincronización del audio siguen sin resolverse.';
  }
  if (state.frameDomain === 'root') {
    return 'This frame reproduces the hash-bound Adobe standalone root capture only. The original InternalPreloader and course-shell contract remain disabled.';
  }
  return `Visual seed branch ${state.soundOutcome}; both source audio streams and the original course host remain disabled pending authoritative evidence.`;
}

type CanvasStatus = 'idle' | 'loading' | 'ready' | 'error';

export function buildCourseG04L01Ir001CaptureAttributes({
  canvasStatus,
  entryStateSha256,
  requirementId,
  state,
  traceId
}: {
  canvasStatus: CanvasStatus;
  entryStateSha256: string;
  requirementId: string;
  state: CourseG04L01Ir001FrameState;
  traceId: string;
}) {
  const visualReady = state.status === 'ready' && canvasStatus === 'ready';
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

export function CourseG04L01Ir001Renderer({
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
    : getCourseG04L01Ir001FrameState(frame, {frameDomain, lang, scenario, seed});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasStatus, setCanvasStatus] = useState<CanvasStatus>('idle');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || deterministicState.status !== 'ready') {
      setCanvasStatus('idle');
      return;
    }
    let cancelled = false;
    setCanvasStatus('loading');
    const renderPromise = deterministicState.frameDomain === 'root'
      ? renderRootFrame(canvas, deterministicState)
      : loadCanvasAsset().then(async (asset) => {
          await asset.ready();
          if (cancelled) return;
          asset.render(canvas, {
            frame: deterministicState.frame,
            scenario: deterministicState.scenario,
            lang: deterministicState.language,
            seed: deterministicState.seed
          });
          if (
            canvas.dataset.flashFrame !== String(deterministicState.frame) ||
            canvas.dataset.flashFrameDomain !== deterministicState.frameDomain ||
            canvas.dataset.runtimeScenario !== deterministicState.scenario
          ) {
            throw new Error('Canvas asset did not report the requested deterministic identity');
          }
          stampCanvasIdentity(canvas, deterministicState);
        });
    renderPromise
      .then(() => {
        if (cancelled) return;
        if (
          canvas.dataset.flashFrame !== String(deterministicState.frame) ||
          canvas.dataset.flashFrameDomain !== deterministicState.frameDomain ||
          canvas.dataset.runtimeScenario !== deterministicState.scenario
        ) {
          throw new Error('Rendered Canvas identity does not match the requested frame state');
        }
        setCanvasStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setCanvasStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [
    deterministicState.frame,
    deterministicState.frameDomain,
    deterministicState.language,
    deterministicState.scenario,
    deterministicState.seed,
    deterministicState.status
  ]);

  const frameCount = deterministicState.frameDomain === 'root'
    ? COURSE_G04_L01_IR_001_SOURCE.rootFrameCount
    : COURSE_G04_L01_IR_001_SOURCE.localFrameCount;

  return (
    <section
      aria-label="Place Value: Your World"
      className="faithful-conversion"
      data-audio-rendered="false"
      data-audio-localization-status={deterministicState.audioLocalizationStatus}
      data-audio-status={deterministicState.audioStatus}
      data-candidate-status="engineering-not-strict"
      data-canvas-status={canvasStatus}
      data-host-integration-status={deterministicState.hostIntegrationStatus}
      data-visual-localization-status={deterministicState.visualLocalizationStatus}
      style={{margin: '0 auto', maxWidth: 800, width: '100%'}}
    >
      <div
        className="faithful-stage-wrap"
        data-canvas-status={canvasStatus}
        data-flash-entry-state-sha256={entryStateSha256 || undefined}
        data-flash-frame={canvasStatus === 'ready' ? deterministicState.frame : undefined}
        data-flash-frame-domain={deterministicState.frameDomain}
        data-flash-requirement-id={requirementId || undefined}
        data-flash-root-frame={deterministicState.rootFrame}
        data-flash-trace-id={traceId || undefined}
        data-rendering-authority={deterministicState.renderingAuthority}
        data-runtime-language={deterministicState.language}
        data-runtime-scenario={deterministicState.scenario}
        data-runtime-seed={deterministicState.seed}
        data-sound-outcome={deterministicState.soundOutcome ?? undefined}
        data-visual-localization-status={deterministicState.visualLocalizationStatus}
        style={{aspectRatio: '4 / 3', background: '#b8d8f7', overflow: 'hidden'}}
      >
        <div style={{height: '100%', position: 'relative', width: '100%'}}>
          <canvas
            {...buildCourseG04L01Ir001CaptureAttributes({
              canvasStatus,
              entryStateSha256,
              requirementId,
              state: deterministicState,
              traceId
            })}
            aria-label={`Source-bound Place Value introduction, ${deterministicState.frameDomain} frame ${deterministicState.frame} of ${frameCount}`}
            height={600}
            ref={canvasRef}
            role="img"
            style={{display: 'block', height: '100%', width: '100%'}}
            width={800}
          />
          {canvasStatus === 'loading' ? (
            <span aria-live="polite" role="status" style={{left: 12, position: 'absolute', top: 12}}>
              Loading source-bound drawing…
            </span>
          ) : null}
          {canvasStatus === 'error' ? (
            <p
              aria-live="assertive"
              role="alert"
              style={{background: '#fff', inset: 0, margin: 0, padding: '10%', position: 'absolute'}}
            >
              The local drawing asset failed safely. No legacy or remote fallback was executed.
            </p>
          ) : null}
        </div>
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

const animationModule: AnimationModule<CourseG04L01Ir001FrameState> = Object.freeze({
  key: ANIMATION_ID,
  movie: COURSE_G04_L01_IR_001_MOVIE,
  runtime: COURSE_G04_L01_IR_001_RUNTIME,
  playbackMode: 'once',
  playbackEndFrameByDomain: Object.freeze({
    root: 1,
    'sprite-58': 142
  }),
  reducedMotionFrame: 142,
  defaultScenarioByFrameDomain: Object.freeze({root: 'root-standalone', 'sprite-58': 'sound-from-seed'}),
  scenarios: Object.freeze([
    Object.freeze({
      id: 'sound-from-seed',
      label: 'Source random-audio branch from seed',
      description: 'Seed modulo two selects the structural sound branch; no audio is rendered.'
    }),
    Object.freeze({
      id: 'sound-0',
      label: 'Sound branch 0 (silent candidate)',
      description: 'Explicit Mc_Sound_0 structural branch with source audio omitted.'
    }),
    Object.freeze({
      id: 'sound-1',
      label: 'Sound branch 1 (silent candidate)',
      description: 'Explicit Mc_Sound_1 structural branch with source audio omitted.'
    }),
    Object.freeze({
      id: 'root-standalone',
      label: 'Adobe standalone root timeline',
      description: 'Ten hash-bound standalone root captures rendered as the same source visual in both requested language contexts; course-host behavior is not reconstructed.'
    })
  ]),
  audioCues: Object.freeze([]),
  maturity: 'legacy-prototype',
  Renderer: CourseG04L01Ir001Renderer,
  getFrameState: (frame: number, context: RuntimeContext) =>
    getCourseG04L01Ir001FrameState(frame, context)
});

export default animationModule;
