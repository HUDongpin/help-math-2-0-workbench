'use client';

import React, {useEffect, useRef} from 'react';

import type {AnimationModule, AnimationRendererProps, RuntimeContext} from '../contract';
import {
  COURSE_G03_L08_RE_001_MOVIE,
  COURSE_G03_L08_RE_001_NATURAL_STOP_FRAME,
  COURSE_G03_L08_RE_001_RUNTIME,
  getCourseG03L08Re001FrameState,
  type CourseG03L08Re001FrameState
} from '../timelines/course-g03-l08-re-001';

const ANIMATION_ID = 'course-g03-l08-re-001';

function isFrameState(value: unknown): value is CourseG03L08Re001FrameState {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'frame' in value &&
      'localTimeline' in value &&
      'sourceSwfSha256' in value
  );
}

function drawStandaloneDefault(
  canvas: HTMLCanvasElement,
  state: CourseG03L08Re001FrameState
) {
  const context = canvas.getContext('2d');
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = state.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#000000';
  context.font = '27px Verdana, Arial, sans-serif';
  context.textBaseline = 'top';
  context.fillText(state.title, 8, 10);
}

function blockedCopy(state: CourseG03L08Re001FrameState): {title: string; detail: string} {
  if (state.blocker === 'unsupported-runtime-request') {
    return {
      title: 'Unsupported runtime request',
      detail: 'The requested frame domain or scenario is not declared by this migration.'
    };
  }
  if (state.blocker === 'frame-domain-scenario-mismatch') {
    return {
      title: 'Frame-domain/scenario mismatch',
      detail: 'This scenario is not valid for the requested Flash timeline domain.'
    };
  }
  if (state.blocker === 'spanish-host-state-not-source-proven') {
    return {
      title: 'Versión en español no disponible',
      detail:
        'El archivo fuente no demuestra el estado del repaso, sus respuestas ni una rama visual en español. El candidato se detiene de forma segura.'
    };
  }
  if (state.blocker === 'javascript-history-side-effect-disabled') {
    return {
      title: 'Legacy Back action disabled',
      detail:
        'The source invokes a JavaScript history URL. The modern candidate does not execute that side effect.'
    };
  }
  return {
    title: 'Quiz review data unavailable',
    detail:
      'The source requires REVIEWANS and related arrays from its original assessment host. No question, response, score, or answer is guessed.'
  };
}

export function CourseG03L08Re001Renderer({
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
    : getCourseG03L08Re001FrameState(frame, {frameDomain, lang, rootFrame, scenario, seed});
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (deterministicState.status === 'ready' && canvasRef.current) {
      drawStandaloneDefault(canvasRef.current, deterministicState);
    }
  }, [deterministicState]);

  const blocked = deterministicState.status === 'blocked' ? blockedCopy(deterministicState) : null;

  return (
    <section
      aria-label="Quiz Review Details for the Student"
      data-audio-rendered="false"
      data-candidate-status="engineering-not-strict"
      data-flash-frame={deterministicState.frame}
      data-flash-natural-frame={deterministicState.naturalPlaybackFrame}
      data-flash-phase={deterministicState.phase}
      data-local-frame={deterministicState.localTimeline.frame ?? 'not-placed'}
      data-local-frame-count={deterministicState.localTimeline.frameCount}
      data-local-object-id={deterministicState.localTimeline.objectId}
      data-runtime-language={deterministicState.language}
      data-runtime-scenario={deterministicState.scenario}
      data-runtime-seed={deterministicState.seed}
      data-visual-localization-status={deterministicState.visualLocalizationStatus}
      style={{margin: '0 auto', maxWidth: 800, width: '100%'}}
    >
      <div
        className="faithful-stage-wrap"
        data-animation-id={ANIMATION_ID}
        data-capture-stage="true"
        data-flash-entry-state-sha256={entryStateSha256}
        data-flash-frame={deterministicState.frame}
        data-flash-frame-domain={deterministicState.frameDomain}
        data-flash-requirement-id={requirementId}
        data-flash-root-frame={deterministicState.rootFrame}
        data-flash-trace-id={traceId}
        data-render-state={deterministicState.status === 'ready' ? 'ready' : 'blocked'}
        data-render-visual={deterministicState.status === 'ready' ? 'true' : undefined}
        data-runtime-language={deterministicState.language}
        data-runtime-scenario={deterministicState.scenario}
        data-runtime-seed={deterministicState.seed}
        data-visual-localization-status={deterministicState.visualLocalizationStatus}
        style={{
          aspectRatio: '4 / 3',
          background: deterministicState.background,
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
              background: deterministicState.background,
              color: '#17344c',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              justifyContent: 'center',
              padding: '8%',
              textAlign: 'center'
            }}
          >
            <strong style={{fontSize: 'clamp(1rem, 3vw, 2rem)'}}>{blocked.title}</strong>
            <p style={{maxWidth: 600}}>{blocked.detail}</p>
          </div>
        ) : (
          <canvas
            aria-label={`Standalone root structural visual, source frame ${deterministicState.frame} of 55`}
            data-course-canvas={ANIMATION_ID}
            data-visual-localization-status={deterministicState.visualLocalizationStatus}
            height={600}
            ref={canvasRef}
            role="img"
            style={{display: 'block', height: 'auto', width: '100%'}}
            width={800}
          />
        )}
      </div>
      <div
        aria-label="Candidate controls and unresolved source actions"
        style={{alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 10}}
      >
        <button onClick={onReplay} type="button">
          Replay
        </button>
        <button disabled type="button">
          Previous review unavailable
        </button>
        <button disabled type="button">
          Next review unavailable
        </button>
        <button disabled type="button">
          Back unavailable
        </button>
        <span>
          Host review data and authoritative audio listening remain unresolved; no legacy side effect
          runs.
        </span>
      </div>
    </section>
  );
}

const animationModule: AnimationModule<CourseG03L08Re001FrameState> = Object.freeze({
  key: ANIMATION_ID,
  movie: COURSE_G03_L08_RE_001_MOVIE,
  runtime: COURSE_G03_L08_RE_001_RUNTIME,
  playbackMode: 'once',
  playbackEndFrame: COURSE_G03_L08_RE_001_NATURAL_STOP_FRAME,
  playbackEndFrameByDomain: Object.freeze({
    root: COURSE_G03_L08_RE_001_NATURAL_STOP_FRAME,
    'sprite-621': 1
  }),
  reducedMotionFrame: COURSE_G03_L08_RE_001_NATURAL_STOP_FRAME,
  defaultScenarioByFrameDomain: Object.freeze({root: 'root-standalone', 'sprite-621': 'default'}),
  scenarios: Object.freeze([
    Object.freeze({
      id: 'root-standalone',
      label: 'Source-shared untranslated root trace',
      description:
        'The fixed English source drawing is exposed unchanged in en and es request contexts. This is source-shared untranslated visual rendering, not Spanish translation or parity.'
    }),
    Object.freeze({
      id: 'default',
      label: 'Assessment-host default (blocked)',
      description:
        'sprite-621 requires the original REVIEWANS assessment-host payload and fails closed when it is absent.'
    }),
    Object.freeze({
      id: 'host-review-unavailable',
      label: 'Host review state (blocked)',
      description: 'Fails closed because REVIEWANS and its related assessment arrays are absent.'
    }),
    Object.freeze({
      id: 'legacy-back-unavailable',
      label: 'Legacy Back action (blocked)',
      description: 'Records the source JavaScript-history obligation without executing it.'
    })
  ]),
  audioCues: Object.freeze([]),
  maturity: 'legacy-prototype',
  Renderer: CourseG03L08Re001Renderer,
  getFrameState: (frame: number, context: RuntimeContext) =>
    getCourseG03L08Re001FrameState(frame, context)
});

export default animationModule;
