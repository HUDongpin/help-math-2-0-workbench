'use client';

import React, {useEffect, useRef, useState} from 'react';

import type {AnimationModule, AnimationRendererProps, RuntimeContext} from '../contract';
import {
  COURSE_G03_L01_TS_008_MOVIE,
  COURSE_G03_L01_TS_008_RUNTIME,
  COURSE_G03_L01_TS_008_SOURCE,
  getCourseG03L01Ts008FrameState,
  type CourseG03L01Ts008FrameState
} from '../timelines/course-g03-l01-ts-008';

const ANIMATION_ID = 'course-g03-l01-ts-008';
const ASSET_SOURCE = '/flash-assets/courses/course-g03-l01-ts-008/canvas-renderer.js';

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

function isFrameState(value: unknown): value is CourseG03L01Ts008FrameState {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'frame' in value &&
      'status' in value &&
      'frameDomain' in value
  );
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

function blockerCopy(state: CourseG03L01Ts008FrameState): {title: string; detail: string} {
  if (state.blocker === 'correct-answer-host-state-unresolved') {
    return {
      title: 'Correct-answer state unavailable',
      detail: 'The original right-feedback and parent scoring contract has not been recovered.'
    };
  }
  if (state.blocker === 'first-wrong-answer-host-state-unresolved') {
    return {
      title: 'First-wrong-answer state unavailable',
      detail: 'The original retry count, wrong feedback, and enabled-button state remain unresolved.'
    };
  }
  if (state.blocker === 'second-wrong-answer-host-state-unresolved') {
    return {
      title: 'Second-wrong-answer state unavailable',
      detail: 'The forced-continuation and second-attempt scoring contract remains unresolved.'
    };
  }
  if (state.blocker === 'glossary-popup-host-state-unresolved') {
    return {
      title: 'Glossary and popup state unavailable',
      detail: 'The source delegates these actions to the legacy HELP Math host, so they are disabled.'
    };
  }
  return {
    title: 'Completion, scoring, and source Replay unavailable',
    detail:
      'The original terminal score, parent continuation, and Replay state have not been authoritatively traversed.'
  };
}

export function CourseG03L01Ts008Renderer({
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
    : getCourseG03L01Ts008FrameState(frame, {
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
      deterministicState.frameDomain !== 'sprite-348'
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

  const blocked = deterministicState.status === 'blocked' ? blockerCopy(deterministicState) : null;
  const rootState = deterministicState.frameDomain === 'root' ? deterministicState : null;
  const localState = deterministicState.frameDomain === 'sprite-348' ? deterministicState : null;
  const reportedCanvasStatus = blocked
    ? 'blocked'
    : rootState
      ? 'root-authoritative-frame'
      : canvasStatus;
  const rendererReady = Boolean(blocked) || Boolean(rootState) || canvasStatus === 'ready';
  const rendererState = blocked
    ? 'blocked'
    : rootState || canvasStatus === 'ready'
      ? 'ready'
      : canvasStatus === 'error'
        ? 'error'
        : 'loading';

  return (
    <section
      aria-label="Place Value Practice Test: Question 2"
      className="faithful-conversion"
      data-audio-localization-status={deterministicState.audioLocalizationStatus}
      data-audio-rendered="false"
      data-candidate-status="engineering-not-strict"
      data-canvas-status={reportedCanvasStatus}
      data-visual-localization="source-shared-untranslated-visual"
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
        data-visual-localization="source-shared-untranslated-visual"
        data-visual-localization-status={deterministicState.visualLocalizationStatus}
        style={{
          aspectRatio: '4 / 3',
          background: '#b8d8f7',
          overflow: 'hidden',
          position: 'relative'
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
        ) : rootState ? (
          <img
            alt={`Source-runtime Practice Test root frame ${rootState.frame} of 10`}
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
            data-visual-localization="source-shared-untranslated-visual"
            height={600}
            src={rootState.rootFrameAsset.source}
            style={{display: 'block', height: '100%', width: '100%'}}
            width={800}
          />
        ) : (
          <>
            <canvas
              aria-label={`Source-derived Practice Test drawing, frame ${localState!.frame} of 747`}
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
              data-visual-localization="source-shared-untranslated-visual"
              height={600}
              ref={canvasRef}
              role="img"
              style={{display: canvasStatus === 'ready' ? 'block' : 'none', height: '100%', width: '100%'}}
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
        {rootState && !blocked ? (
          <span>
            Hash-bound standalone root frame with identical untranslated source pixels for English
            and Spanish contexts only; natural host entry, test answers, scoring, glossary, audio,
            completion, and source Replay remain unresolved.
          </span>
        ) : (
          <span>
            Source-drawing inspection only. Test answers, scoring, glossary, host state, timeline
            audio, and original-host audio acceptance are disabled; the separately routed Spanish
            track is available only for machine product inspection.
          </span>
        )}
      </div>
    </section>
  );
}

const animationModule: AnimationModule<CourseG03L01Ts008FrameState> = Object.freeze({
  key: ANIMATION_ID,
  movie: COURSE_G03_L01_TS_008_MOVIE,
  runtime: COURSE_G03_L01_TS_008_RUNTIME,
  playbackMode: 'once',
  playbackEndFrame: COURSE_G03_L01_TS_008_SOURCE.firstAuthoredStopFrame,
  playbackEndFrameByDomain: Object.freeze({
    root: 1,
    'sprite-348': COURSE_G03_L01_TS_008_SOURCE.firstAuthoredStopFrame
  }),
  reducedMotionFrame: COURSE_G03_L01_TS_008_SOURCE.firstAuthoredStopFrame,
  defaultScenarioByFrameDomain: Object.freeze({
    root: 'root-standalone',
    'sprite-348': 'source-drawing-default'
  }),
  scenarios: Object.freeze([
    Object.freeze({
      id: 'root-standalone',
      label: 'Standalone source root frame inspection',
      description:
        'Ten hash-bound Adobe standalone frames expose identical untranslated source pixels for English and Spanish inspection; natural host playback, interaction, translation, and audio remain unclaimed.'
    }),
    Object.freeze({
      id: 'source-drawing-default',
      label: 'Source drawing to first authored stop',
      description:
        'Static source-derived frames 1–295 render unchanged for English and Spanish contexts; no translation, interaction, scoring, or audio claim.'
    }),
    Object.freeze({
      id: 'answer-correct-unavailable',
      label: 'Correct answer (blocked)',
      description: 'Preserves the correct-response obligation while failing closed on host scoring.'
    }),
    Object.freeze({
      id: 'answer-first-wrong-unavailable',
      label: 'First wrong answer (blocked)',
      description: 'Preserves the first-wrong/retry obligation without inventing host state.'
    }),
    Object.freeze({
      id: 'answer-second-wrong-unavailable',
      label: 'Second wrong answer (blocked)',
      description: 'Preserves forced-continuation and scoring obligations without guessing.'
    }),
    Object.freeze({
      id: 'glossary-popup-unavailable',
      label: 'Glossary and popup (blocked)',
      description: 'Legacy HELP Math host actions are explicitly disabled.'
    }),
    Object.freeze({
      id: 'completion-scoring-replay-unavailable',
      label: 'Completion, scoring, and source Replay (blocked)',
      description: 'Terminal host state remains unresolved; the player Replay is QA-only.'
    })
  ]),
  audioCues: Object.freeze([]),
  audioTracks: Object.freeze([
    Object.freeze({
      id: 'course-g03-l01-ts-008-es-host-audio',
      language: 'es',
      label: 'Audio en español',
      source: '/flash-assets/audio/courses/course-g03-l01-ts-008/es.mp3',
      durationMs: 9408,
      sha256: 'e81753a65c066c3b0112abf7dda689712a15aa022c8cc5ee7b4e38724c9fb734',
      activation: 'user',
      visibleWhen: Object.freeze(['es'] as const),
      frameDomains: Object.freeze(['sprite-348']),
      timelineBehavior: 'pause-while-playing'
    })
  ]),
  maturity: 'legacy-prototype',
  Renderer: CourseG03L01Ts008Renderer,
  getFrameState: (frame: number, context: RuntimeContext) =>
    getCourseG03L01Ts008FrameState(frame, context)
});

export default animationModule;
