'use client';

import React, {useEffect, useRef, useState} from 'react';

import type {AnimationModule, AnimationRendererProps, RuntimeContext} from '../contract';
import {
  COURSE_G03_L06_TI_001_MOVIE,
  COURSE_G03_L06_TI_001_RUNTIME,
  getCourseG03L06Ti001FrameState,
  type CourseG03L06Ti001FrameState
} from '../timelines/course-g03-l06-ti-001';

const ANIMATION_ID = 'course-g03-l06-ti-001';
const ASSET_SOURCE = '/flash-assets/courses/course-g03-l06-ti-001/canvas-renderer.js';

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

function isFrameState(value: unknown): value is CourseG03L06Ti001FrameState {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'frame' in value &&
      'frameDomain' in value
  );
}

export function CourseG03L06Ti001Renderer({
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
    : getCourseG03L06Ti001FrameState(frame, {frameDomain, lang, rootFrame, scenario, seed});
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
      deterministicState.frameDomain !== 'sprite-21'
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
    deterministicState.language,
    deterministicState.scenario,
    deterministicState.seed,
    deterministicState.status,
    renderIdentity
  ]);

  const rootDomain = deterministicState.frameDomain === 'root';
  const localState = deterministicState.frameDomain === 'sprite-21'
    ? deterministicState
    : null;
  const reportedCanvasStatus = rootDomain
    ? 'root-source-structural'
    : canvasStatus;
  const rendererReady = rootDomain || canvasStatus === 'ready';
  const rendererState = rendererReady
    ? 'ready'
    : canvasStatus === 'error'
      ? 'error'
      : 'loading';

  return (
    <section
      aria-label="Decimals and Money: Try It"
      className="faithful-conversion"
      data-audio-rendered={deterministicState.audioRendered}
      data-audio-localization-status={deterministicState.audioLocalizationStatus}
      data-candidate-status="engineering-not-strict"
      data-canvas-status={reportedCanvasStatus}
      data-visual-localization-status={deterministicState.visualLocalizationStatus}
      style={{margin: '0 auto', maxWidth: 800, width: '100%'}}
    >
      <div
        className="faithful-stage-wrap"
        data-animation-id={ANIMATION_ID}
        data-capture-stage="true"
        data-canvas-status={reportedCanvasStatus}
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
        data-sound-instances-present={localState?.soundInstancesPresent}
        data-sound-outcome={localState?.soundOutcome}
        style={{aspectRatio: '4 / 3', background: '#b8d8f7', overflow: 'hidden'}}
      >
        {rootDomain ? (
          <div
            aria-label={`Source-derived root timeline background, frame ${deterministicState.frame} of 10`}
            data-animation-id={ANIMATION_ID}
            data-flash-entry-state-sha256={entryStateSha256}
            data-flash-frame={deterministicState.frame}
            data-flash-frame-domain={deterministicState.frameDomain}
            data-flash-requirement-id={requirementId}
            data-flash-root-frame={deterministicState.rootFrame}
            data-flash-trace-id={traceId}
            data-render-state="ready"
            data-render-visual="true"
            data-root-visual-authority="ffdec-static-structure"
            data-runtime-language={deterministicState.language}
            data-runtime-scenario={deterministicState.scenario}
            data-runtime-seed={deterministicState.seed}
            role="img"
            style={{background: '#b8d8f7', height: '100%', width: '100%'}}
          />
        ) : (
          <div style={{height: '100%', position: 'relative', width: '100%'}}>
            <canvas
              aria-label={`Source-derived Try It animation, frame ${localState!.frame} of 142`}
              data-animation-id={rendererReady ? ANIMATION_ID : undefined}
              data-flash-entry-state-sha256={rendererReady ? entryStateSha256 : undefined}
              data-flash-frame={rendererReady ? deterministicState.frame : undefined}
              data-flash-frame-domain={rendererReady ? deterministicState.frameDomain : undefined}
              data-flash-requirement-id={rendererReady ? requirementId : undefined}
              data-flash-root-frame={rendererReady ? deterministicState.rootFrame : undefined}
              data-flash-trace-id={rendererReady ? traceId : undefined}
              data-render-state={rendererState}
              data-render-visual="true"
              data-runtime-language={rendererReady ? deterministicState.language : undefined}
              data-runtime-scenario={rendererReady ? deterministicState.scenario : undefined}
              data-runtime-seed={rendererReady ? deterministicState.seed : undefined}
              height={600}
              ref={canvasRef}
              role="img"
              style={{display: 'block', height: '100%', width: '100%'}}
              width={800}
            />
            {canvasStatus === 'loading' ? (
              <span aria-live="polite" role="status" style={{left: 12, position: 'absolute', top: 12}}>
                Loading source-derived drawing…
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
        )}
      </div>
      <div
        aria-label="Candidate controls and limitations"
        style={{alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 10}}
      >
        <button onClick={onReplay} type="button">
          Replay
        </button>
        {rootDomain ? (
          <span>
            Root frames reproduce the hash-bound static SWF background; natural host entry is still
            validated separately.
          </span>
        ) : (
          <span>
            Audio selection fixture {localState!.soundOutcome}; the source visuals do not vary by
            random outcome or requested language. The embedded title remains English exactly as
            shipped. Both byte-exact embedded streams are restored for their structural branch;
            spoken language, listening, and authoritative synchronization acceptance remain pending.
          </span>
        )}
      </div>
    </section>
  );
}

const animationModule: AnimationModule<CourseG03L06Ti001FrameState> = Object.freeze({
  key: ANIMATION_ID,
  movie: COURSE_G03_L06_TI_001_MOVIE,
  runtime: COURSE_G03_L06_TI_001_RUNTIME,
  playbackMode: 'once',
  playbackEndFrameByDomain: Object.freeze({root: 1, 'sprite-21': 142}),
  reducedMotionFrame: 142,
  defaultScenarioByFrameDomain: Object.freeze({root: 'root-standalone', 'sprite-21': 'sound-from-seed'}),
  scenarios: Object.freeze([
    Object.freeze({
      id: 'sound-from-seed',
      label: 'Deterministic fixture for source random-audio selection',
      description:
        'Seed modulo two makes implementation captures repeatable; it does not claim parity with the AVM1 random(2) sequence.'
    }),
    Object.freeze({
      id: 'sound-0',
      label: 'Source random outcome 0 requirement',
      description:
        'A future untouched original-runtime reload must naturally observe Mc_Sound_0; the implementation never forces the original PRNG.'
    }),
    Object.freeze({
      id: 'sound-1',
      label: 'Source random outcome 1 requirement',
      description:
        'A future untouched original-runtime reload must naturally observe Mc_Sound_1; the implementation never forces the original PRNG.'
    }),
    Object.freeze({
      id: 'root-standalone',
      label: 'Source root timeline direct-seek structural frames',
      description:
        'Ten hash-bound root frames rendered for direct inspection; live root playback stops at frame 1 and natural host/preloader entry remains separate evidence.'
    })
  ]),
  audioCues: Object.freeze([
    Object.freeze({
      id: 'embedded-stream-0001-sound-0', sourceCueId: 'embedded-stream-0001', frame: 5, endFrame: 137,
      frameDomain: 'sprite-21', language: 'shared', scenario: 'sound-0',
      source: '/flash-assets/courses/course-g03-l06-ti-001/audio/embedded-stream-0001.mp3',
      durationMs: 11233, sha256: '9b5b7659bda9ce6d22df5e3b927e9e56a87ef9a5405b55a46a8af2fff94e87ff',
      spokenLanguage: 'undetermined'
    }),
    Object.freeze({
      id: 'embedded-stream-0002-sound-1', sourceCueId: 'embedded-stream-0002', frame: 5, endFrame: 137,
      frameDomain: 'sprite-21', language: 'shared', scenario: 'sound-1',
      source: '/flash-assets/courses/course-g03-l06-ti-001/audio/embedded-stream-0002.mp3',
      durationMs: 11233, sha256: 'd90d924f11f549a10218a6689b21b5d73aa19208ffab07c5f5725110e7b5d420',
      spokenLanguage: 'undetermined'
    }),
    Object.freeze({
      id: 'embedded-stream-0001-seed-even', sourceCueId: 'embedded-stream-0001', frame: 5, endFrame: 137,
      frameDomain: 'sprite-21', language: 'shared', scenario: 'sound-from-seed', seedModulo: Object.freeze({divisor: 2, remainder: 0}),
      source: '/flash-assets/courses/course-g03-l06-ti-001/audio/embedded-stream-0001.mp3',
      durationMs: 11233, sha256: '9b5b7659bda9ce6d22df5e3b927e9e56a87ef9a5405b55a46a8af2fff94e87ff',
      spokenLanguage: 'undetermined'
    }),
    Object.freeze({
      id: 'embedded-stream-0002-seed-odd', sourceCueId: 'embedded-stream-0002', frame: 5, endFrame: 137,
      frameDomain: 'sprite-21', language: 'shared', scenario: 'sound-from-seed', seedModulo: Object.freeze({divisor: 2, remainder: 1}),
      source: '/flash-assets/courses/course-g03-l06-ti-001/audio/embedded-stream-0002.mp3',
      durationMs: 11233, sha256: 'd90d924f11f549a10218a6689b21b5d73aa19208ffab07c5f5725110e7b5d420',
      spokenLanguage: 'undetermined'
    })
  ]),
  maturity: 'legacy-prototype',
  Renderer: CourseG03L06Ti001Renderer,
  getFrameState: (frame: number, context: RuntimeContext) =>
    getCourseG03L06Ti001FrameState(frame, context)
});

export default animationModule;
