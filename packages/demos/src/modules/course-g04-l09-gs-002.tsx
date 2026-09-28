'use client';

import React, {useEffect, useRef, useState} from 'react';

import type {AnimationModule, AnimationRendererProps, RuntimeContext} from '../contract';
import {
  COURSE_G04_L09_GS_002_MOVIE,
  COURSE_G04_L09_GS_002_RUNTIME,
  COURSE_G04_L09_GS_002_SOURCE,
  getCourseG04L09Gs002FrameState,
  type CourseG04L09Gs002Blocker,
  type CourseG04L09Gs002FrameState
} from '../timelines/course-g04-l09-gs-002';

const ANIMATION_ID = 'course-g04-l09-gs-002';
const ASSET_SOURCE = '/flash-assets/courses/course-g04-l09-gs-002/canvas-renderer.js';
const SUPPLEMENTAL_CAPTURE_IDENTITY = Object.freeze({
  entryStateSha256: 'eac16c8a6d549d9073515fb54d06504374f1809e4b2a6e281ea581db58a72363',
  firstFrame: 1,
  frameDomain: 'sprite-787',
  language: 'en',
  lastFrame: 641,
  requirementId: 'req:sprite-787:source-drawing-lead-in:en:partial-frames-1-641',
  rootFrame: 6,
  scenario: 'source-drawing-lead-in',
  seed: 0,
  traceId: 'trace:sprite-787:source-drawing-lead-in:en:seed-0:partial-frames-1-641'
});

type CanvasStatus = 'idle' | 'loading' | 'ready' | 'error';

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
    } else if (window.HELP_MATH_CANVAS_ASSETS?.[ANIMATION_ID]) {
      finish();
    }
  }).catch((error) => {
    assetLoadPromise = null;
    throw error;
  });
  return assetLoadPromise;
}

function isFrameState(value: unknown): value is CourseG04L09Gs002FrameState {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'frame' in value &&
      'frameDomain' in value &&
      'status' in value
  );
}

export function buildCourseG04L09Gs002CaptureAttributes({
  canvasStatus,
  entryStateSha256,
  requirementId,
  state,
  traceId
}: {
  canvasStatus: CanvasStatus;
  entryStateSha256: string;
  requirementId: string;
  state: CourseG04L09Gs002FrameState;
  traceId: string;
}) {
  const auditedSupplementalIdentity =
    state.status === 'ready' &&
    state.frameDomain === SUPPLEMENTAL_CAPTURE_IDENTITY.frameDomain &&
    state.scenario === SUPPLEMENTAL_CAPTURE_IDENTITY.scenario &&
    state.language === SUPPLEMENTAL_CAPTURE_IDENTITY.language &&
    state.seed === SUPPLEMENTAL_CAPTURE_IDENTITY.seed &&
    state.rootFrame === SUPPLEMENTAL_CAPTURE_IDENTITY.rootFrame &&
    state.frame >= SUPPLEMENTAL_CAPTURE_IDENTITY.firstFrame &&
    state.frame <= SUPPLEMENTAL_CAPTURE_IDENTITY.lastFrame &&
    requirementId === SUPPLEMENTAL_CAPTURE_IDENTITY.requirementId &&
    traceId === SUPPLEMENTAL_CAPTURE_IDENTITY.traceId &&
    entryStateSha256 === SUPPLEMENTAL_CAPTURE_IDENTITY.entryStateSha256;
  const visualReady = auditedSupplementalIdentity && canvasStatus === 'ready';
  return {
    'data-animation-id': ANIMATION_ID,
    'data-flash-entry-state-sha256': entryStateSha256 || undefined,
    'data-flash-frame': visualReady ? state.frame : undefined,
    'data-flash-frame-domain': state.frameDomain,
    'data-flash-requirement-id': requirementId || undefined,
    'data-flash-root-frame': state.rootFrame,
    'data-flash-trace-id': traceId || undefined,
    'data-original-runtime-baseline-complete': 'false',
    'data-render-state': visualReady ? 'ready' : canvasStatus,
    'data-render-visual': visualReady ? 'true' : undefined,
    'data-runtime-language': state.language,
    'data-runtime-scenario': state.scenario,
    'data-runtime-seed': state.seed,
    'data-strict-acceptance-effect': 'none',
    'data-visual-localization-status': state.visualLocalizationStatus
  } as const;
}

function blockerCopy(blocker: CourseG04L09Gs002Blocker): {title: string; detail: string} {
  if (blocker === 'spanish-visual-and-audio-not-source-proven') {
    return {
      title: 'Versión en español no disponible',
      detail:
        'La pista española está identificada por hash, pero el contenido hablado, los estados visuales, el inicio y la sincronización todavía no se han validado en el entorno original.'
    };
  }
  if (blocker === 'frame-domain-scenario-mismatch') {
    return {
      title: 'Scenario does not belong to this frame domain',
      detail:
        'The requested source timeline and scenario are declared separately. This invalid combination is blocked instead of being redirected to different content.'
    };
  }
  if (blocker === 'unsupported-runtime-request') {
    return {
      title: 'Unsupported deterministic request',
      detail:
        'The requested frame domain or scenario is not declared by this migration and was rejected without rendering fallback content.'
    };
  }
  if (blocker === 'question-final-avm1-state-unresolved') {
    return {
      title: 'Game, question, and Final frames require original AVM1 state',
      detail:
        'Frame 642 initializes and hides game objects through AVM1; frames 643–653 are Q1–Q10 and Final. Static exports that omit those scripts are not presented as reachable runtime behavior.'
    };
  }
  if (blocker === 'questions-q1-q10-host-state-unresolved') {
    return {
      title: 'Q1–Q10 states unavailable',
      detail: 'The original deterministic question order and parent/global fixture remain unresolved.'
    };
  }
  if (blocker === 'correct-answer-feedback-unresolved') {
    return {
      title: 'Correct-answer branch unavailable',
      detail: 'The original right-feedback animation, enabled targets, and score transition remain unresolved.'
    };
  }
  if (blocker === 'wrong-answer-feedback-unresolved') {
    return {
      title: 'Wrong-answer branch unavailable',
      detail: 'The original wrong-feedback, retry, and continuation behavior remain unresolved.'
    };
  }
  if (blocker === 'random-selection-and-scoring-unresolved') {
    return {
      title: 'Random selection and scoring unavailable',
      detail: 'Seeded question selection, ten-question progress, and score calculations are disabled.'
    };
  }
  return {
    title: 'Final, Replay, glossary, and course routing unavailable',
    detail:
      'The source terminal state and legacy host actions have not been authoritatively traversed, so these controls are disabled.'
  };
}

export function CourseG04L09Gs002Renderer({
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
    : getCourseG04L09Gs002FrameState(frame, {frameDomain, lang, scenario, seed});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasStatus, setCanvasStatus] = useState<CanvasStatus>('idle');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (
      !canvas ||
      deterministicState.status !== 'ready' ||
      deterministicState.frameDomain !== 'sprite-787'
    ) {
      setCanvasStatus('idle');
      return;
    }
    let cancelled = false;
    setCanvasStatus('loading');
    loadCanvasAsset()
      .then(async (asset) => {
        await asset.ready();
        if (cancelled) return;
        asset.render(canvas, {
          frame: deterministicState.frame,
          scenario: deterministicState.scenario,
          lang: deterministicState.language,
          seed: deterministicState.seed
        });
        if (canvas.dataset.flashFrame !== String(deterministicState.frame)) {
          throw new Error('Canvas asset did not report the requested deterministic frame');
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
    deterministicState.seed,
    deterministicState.status
  ]);

  const blocked = deterministicState.blocker ? blockerCopy(deterministicState.blocker) : null;
  const rootState = deterministicState.frameDomain === 'root' ? deterministicState : null;
  const localState = deterministicState.frameDomain === 'sprite-787' ? deterministicState : null;
  const reportedCanvasStatus = blocked
    ? 'blocked'
    : rootState
      ? 'root-ffdec-structural-frame'
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
      aria-label="Equations Play It: Game 1"
      className="faithful-conversion"
      data-audio-rendered="false"
      data-audio-localization-status={deterministicState.audioLocalizationStatus}
      data-avm1-executed="false"
      data-candidate-status="engineering-structural-frame-only"
      data-canvas-status={reportedCanvasStatus}
      data-strict-acceptance-effect="none"
      data-visual-localization={deterministicState.visualLocalizationStatus}
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
        data-visual-localization={deterministicState.visualLocalizationStatus}
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
            alt={`Source-shared untranslated FFDec structural root drawing, frame ${rootState.frame} of 10`}
            data-animation-id={ANIMATION_ID}
            data-flash-entry-state-sha256={entryStateSha256}
            data-flash-frame={rootState.frame}
            data-flash-frame-domain="root"
            data-flash-requirement-id={requirementId}
            data-flash-root-frame={rootState.rootFrame}
            data-flash-trace-id={traceId}
            data-original-runtime-baseline-complete="false"
            data-render-state="ready"
            data-render-visual="true"
            data-root-frame-sha256={rootState.rootFrameAsset?.sha256}
            data-root-visual-authority={rootState.rootVisualAuthority ?? undefined}
            data-runtime-language={rootState.language}
            data-runtime-scenario={rootState.scenario}
            data-runtime-seed={rootState.seed}
            data-spanish-translation-supplied="false"
            data-visual-localization="source-shared-untranslated-visual"
            data-visual-localization-status={rootState.visualLocalizationStatus}
            height={600}
            src={rootState.rootFrameAsset?.source}
            style={{display: 'block', height: '100%', width: '100%'}}
            width={800}
          />
        ) : (
          <>
            <canvas
              {...buildCourseG04L09Gs002CaptureAttributes({
                canvasStatus,
                entryStateSha256,
                requirementId,
                state: localState!,
                traceId
              })}
              aria-label={`Source-derived game lead-in drawing, frame ${localState!.frame} of 653`}
              height={600}
              ref={canvasRef}
              role="img"
              style={{
                display: canvasStatus === 'ready' ? 'block' : 'none',
                height: '100%',
                width: '100%'
              }}
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
            Hash-bound source drawing shown unchanged for English and Spanish request contexts. It is
            not a Spanish translation or original-runtime baseline; natural playback remains stopped
            at root frame 1, and AVM1, audio, interaction, Replay, human review, and owner acceptance
            remain separate unresolved gates.
          </span>
        ) : (
          <span>
            Modern candidate reset control only. Source-drawing lead-in only; Q1–Q10, fourteen button
            targets, random selection, feedback, score, Final, glossary, course routing, source-timeline
            audio, original-host audio acceptance, and original Replay remain disabled. The preserved
            Spanish MP3 is hash-inventoried but is not registered with or exposed by this runtime.
          </span>
        )}
      </div>
    </section>
  );
}

const animationModule: AnimationModule<CourseG04L09Gs002FrameState> = Object.freeze({
  key: ANIMATION_ID,
  movie: COURSE_G04_L09_GS_002_MOVIE,
  runtime: COURSE_G04_L09_GS_002_RUNTIME,
  playbackMode: 'once',
  playbackEndFrame: COURSE_G04_L09_GS_002_SOURCE.staticDrawingReadyEndFrame,
  playbackEndFrameByDomain: Object.freeze({
    root: 1,
    'sprite-787': COURSE_G04_L09_GS_002_SOURCE.staticDrawingReadyEndFrame
  }),
  reducedMotionFrame: COURSE_G04_L09_GS_002_SOURCE.staticDrawingReadyEndFrame,
  defaultScenarioByFrameDomain: Object.freeze({root: 'root-standalone', 'sprite-787': 'source-drawing-lead-in'}),
  scenarios: Object.freeze([
    Object.freeze({
      id: 'source-drawing-lead-in',
      label: 'Source drawing before GS_Begin script state',
      description: 'Static exported drawings 1–641 are addressable. Frame 642 and later fail closed because AVM1 state is not executed.'
    }),
    Object.freeze({
      id: 'root-standalone',
      label: 'Standalone root structural inspection',
      description:
        'Exposes hash-bound FFDec structural drawings for frames 1–10 without claiming an original-runtime baseline or natural playback.'
    }),
    Object.freeze({
      id: 'questions-q1-q10-unavailable',
      label: 'Q1–Q10 (blocked)',
      description: 'Preserves all ten question obligations without inventing parent or global state.'
    }),
    Object.freeze({
      id: 'answer-correct-unavailable',
      label: 'Correct answer (blocked)',
      description: 'Correct-feedback, controls, and score transition remain unresolved.'
    }),
    Object.freeze({
      id: 'answer-wrong-unavailable',
      label: 'Wrong answer (blocked)',
      description: 'Wrong-feedback, retry, and continuation remain unresolved.'
    }),
    Object.freeze({
      id: 'random-scoring-unavailable',
      label: 'Random order and scoring (blocked)',
      description: 'Random question selection, progress, and score calculations remain unresolved.'
    }),
    Object.freeze({
      id: 'final-replay-glossary-routing-unavailable',
      label: 'Final and host actions (blocked)',
      description: 'Final, source Replay, glossary, and course routing remain unresolved.'
    })
  ]),
  audioCues: Object.freeze([]),
  maturity: 'legacy-prototype',
  Renderer: CourseG04L09Gs002Renderer,
  getFrameState: (frame: number, context: RuntimeContext) =>
    getCourseG04L09Gs002FrameState(frame, context)
});

export default animationModule;
