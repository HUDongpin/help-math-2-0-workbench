'use client';

import React, {useEffect, useMemo, useRef, useState} from 'react';

import type {AnimationModule, AnimationRendererProps, RuntimeContext} from '../contract';
import {
  COURSE_SHELL_G04_L01_MOVIE,
  COURSE_SHELL_G04_L01_SECTIONS,
  COURSE_SHELL_G04_L01_SOURCE,
  getCourseShellFrameState,
  transitionCourseShell,
  type CourseShellFrameState,
  type CourseShellInteractionState,
  type CourseShellSectionCode
} from '../timelines/shell-course-g04-l01-index-local';

const scenarios = Object.freeze([
  Object.freeze({
    id: 'default',
    label: 'Course menu',
    description: 'Native, fail-closed navigation ordered from the original Grade 4 Lesson 1 XML.'
  }),
  ...COURSE_SHELL_G04_L01_SECTIONS.map((section) =>
    Object.freeze({
      id: `section-${section.code.toLowerCase()}`,
      label: `${section.code} section`,
      description: `Deterministic inspection of the ${section.titleEnglish} section.`
    })
  ),
  Object.freeze({
    id: 'quit-confirmation',
    label: 'Quit confirmation',
    description:
      'Source-proven confirmation state; the legacy close-window and fscommand side effects remain disabled.'
  })
]);

function isCourseShellFrameState(value: unknown): value is CourseShellFrameState {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'frame' in value &&
      'phase' in value &&
      'sections' in value &&
      'language' in value
  );
}

function labelForSection(
  section: (typeof COURSE_SHELL_G04_L01_SECTIONS)[number],
  lang: 'en' | 'es'
) {
  return lang === 'es' ? section.titleSpanish : section.titleEnglish;
}

function LoadingView({state}: {state: CourseShellFrameState}) {
  const label =
    state.phase === 'loading-content'
      ? state.language === 'es'
        ? 'Cargando contenido'
        : 'Loading Content'
      : state.phase === 'loading-layout'
        ? state.language === 'es'
          ? 'Cargando diseño'
          : 'Loading Layout'
        : state.language === 'es'
          ? 'Cargando página'
          : 'Loading Page';
  return (
    <div aria-live="polite" className="course-shell-loading" role="status">
      <span>{label}</span>
      <span
        aria-label={`${state.progress}%`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={state.progress}
        className="course-shell-loading__track"
        role="progressbar"
      >
        <span style={{width: `${state.progress}%`}} />
      </span>
    </div>
  );
}

export function CourseShellG04L01Renderer({
  entryStateSha256,
  frame,
  frameDomain,
  lang,
  onReplay,
  replay: replaySequence = 0,
  requirementId,
  rootFrame,
  scenario,
  seed,
  state,
  traceId
}: AnimationRendererProps) {
  const deterministicState = isCourseShellFrameState(state)
    ? state
    : getCourseShellFrameState(frame, {lang, scenario, seed});
  const initialInteraction = useMemo<CourseShellInteractionState>(
    () =>
      replaySequence > 0
        ? {view: 'menu', selectedSection: null}
        : {
            view: deterministicState.view,
            selectedSection: deterministicState.selectedSection
          },
    [deterministicState.selectedSection, deterministicState.view, replaySequence]
  );
  const [interaction, setInteraction] = useState<CourseShellInteractionState>(initialInteraction);
  const cancelQuitRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setInteraction(initialInteraction), [initialInteraction]);
  useEffect(() => {
    if (interaction.view === 'quit-confirmation') cancelQuitRef.current?.focus();
  }, [interaction.view]);

  const selectedSection = deterministicState.sections.find(
    (section) => section.code === interaction.selectedSection
  );
  const chooseSection = (section: CourseShellSectionCode) =>
    setInteraction((current) =>
      transitionCourseShell(current, {type: 'select-section', section})
    );
  const replay = () => {
    setInteraction((current) => transitionCourseShell(current, {type: 'replay'}));
    onReplay?.();
  };
  const spanish = deterministicState.language === 'es';

  return (
    <div className="faithful-conversion course-shell-conversion">
      <section
        aria-label={
          spanish
            ? 'Navegación del curso de Valor posicional'
            : 'Place Value course navigation'
        }
        className="faithful-stage-wrap course-shell-stage"
        data-animation-id={COURSE_SHELL_G04_L01_SOURCE.animationId}
        data-capture-stage="true"
        data-flash-entry-state-sha256={entryStateSha256}
        data-flash-frame={deterministicState.frame}
        data-flash-frame-domain={deterministicState.frameDomain}
        data-flash-requirement-id={requirementId}
        data-flash-root-frame={rootFrame ?? deterministicState.rootFrame}
        data-flash-trace-id={traceId}
        data-render-state="ready"
        data-render-visual="true"
        data-runtime-language={deterministicState.language}
        data-runtime-scenario={deterministicState.scenario}
        data-runtime-seed={deterministicState.seed}
        data-shell-phase={deterministicState.phase}
        data-shell-view={interaction.view}
        data-state-frame-domain={frameDomain ?? deterministicState.frameDomain}
        style={{aspectRatio: '4 / 3'}}
      >
        <header className="course-shell-header">
          <div aria-hidden="true" className="course-shell-logo">
            <span>HELP</span>
            <small>MATH</small>
          </div>
          <div className="course-shell-heading">
            <p>{deterministicState.courseTitle}</p>
            <h2>{deterministicState.lessonTitle}</h2>
          </div>
          <div className="course-shell-utilities">
            <button
              aria-label={spanish ? 'Mostrar mapa del curso' : 'Show course map'}
              onClick={() =>
                setInteraction((current) => transitionCourseShell(current, {type: 'show-menu'}))
              }
              type="button"
            >
              {spanish ? 'Mapa' : 'Map'}
            </button>
            <button
              aria-label={
                spanish
                  ? 'Términos clave, pendiente de validación'
                  : 'Key Terms, pending validation'
              }
              disabled
              type="button"
            >
              {spanish ? 'Términos' : 'Key Terms'}
            </button>
            <button
              aria-label={
                spanish
                  ? 'Calculadora, pendiente de validación'
                  : 'Calculator, pending validation'
              }
              disabled
              type="button"
            >
              {spanish ? 'Calculadora' : 'Calculator'}
            </button>
            <button
              aria-haspopup="dialog"
              aria-label={spanish ? 'Solicitar cierre' : 'Request close'}
              onClick={() =>
                setInteraction((current) =>
                  transitionCourseShell(current, {type: 'request-quit'})
                )
              }
              type="button"
            >
              ×
            </button>
          </div>
        </header>

        <div className="course-shell-main" id="course-shell-content">
          {deterministicState.phase !== 'ready' ? (
            <LoadingView state={deterministicState} />
          ) : interaction.view === 'section' && selectedSection ? (
            <section aria-labelledby={`course-shell-${selectedSection.code}-title`}>
              <div className="course-shell-section-heading">
                <button
                  onClick={() =>
                    setInteraction((current) =>
                      transitionCourseShell(current, {type: 'show-menu'})
                    )
                  }
                  type="button"
                >
                  ← {spanish ? 'Mapa' : 'Map'}
                </button>
                <div>
                  <span>{selectedSection.code}</span>
                  <h3 id={`course-shell-${selectedSection.code}-title`}>
                    {labelForSection(selectedSection, deterministicState.language)}
                  </h3>
                </div>
              </div>
              <ol className="course-shell-pages">
                {selectedSection.pages.map((page) => {
                  const title =
                    spanish && page.titleSpanish ? page.titleSpanish : page.titleEnglish;
                  const unavailable =
                    page.sourceDisposition === 'missing-source'
                      ? spanish
                        ? 'Fuente no proporcionada'
                        : 'Source not provided'
                      : spanish
                        ? 'Pendiente de aceptación estricta'
                        : 'Awaiting strict acceptance';
                  return (
                    <li key={page.sourcePath}>
                      {page.strictRoute ? (
                        <a
                          href={`${spanish ? '/es' : ''}${page.strictRoute}`}
                          lang={spanish ? 'es' : 'en'}
                        >
                          <span>{page.ordinal}</span>
                          <strong>{title}</strong>
                        </a>
                      ) : (
                        <button
                          aria-label={`${title}. ${unavailable}`}
                          data-animation-id={page.animationId ?? undefined}
                          data-route-status={page.sourceDisposition}
                          disabled
                          type="button"
                        >
                          <span>{page.ordinal}</span>
                          <strong>{title}</strong>
                          <small>{unavailable}</small>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          ) : (
            <nav
              aria-label={spanish ? 'Secciones de la lección' : 'Lesson sections'}
              className="course-shell-sections"
            >
              {deterministicState.sections.map((section) => {
                const present = section.pages.filter((page) => page.animationId).length;
                return (
                  <button
                    aria-controls="course-shell-content"
                    key={section.code}
                    onClick={() => chooseSection(section.code)}
                    type="button"
                  >
                    <span>{section.code}</span>
                    <strong>{labelForSection(section, deterministicState.language)}</strong>
                    <small>
                      {spanish
                        ? `${section.pages.length} páginas · ${present} fuentes presentes`
                        : `${section.pages.length} pages · ${present} sources present`}
                    </small>
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        <footer className="course-shell-footer">
          <span>
            {spanish
              ? 'Los destinos no aceptados permanecen desactivados.'
              : 'Unaccepted destinations remain disabled.'}
          </span>
          <button onClick={replay} type="button">
            ↻ {spanish ? 'Repetir' : 'Replay'}
          </button>
        </footer>

        {deterministicState.phase === 'ready' && interaction.view === 'quit-confirmation' ? (
          <div
            aria-describedby="course-shell-quit-description"
            aria-labelledby="course-shell-quit-title"
            aria-modal="true"
            className="course-shell-modal-backdrop"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setInteraction((current) =>
                  transitionCourseShell(current, {type: 'cancel-quit'})
                );
              }
            }}
            role="dialog"
          >
            <div className="course-shell-modal">
              <h3 id="course-shell-quit-title">
                {spanish ? '¿Seguro que quieres cerrar?' : 'Are you sure you want to close?'}
              </h3>
              <p id="course-shell-quit-description">
                {spanish
                  ? 'El cierre heredado y sus efectos externos están desactivados en esta migración.'
                  : 'The legacy close command and its external side effects are disabled in this migration.'}
              </p>
              <div>
                <button disabled type="button">
                  {spanish ? 'Sí (desactivado)' : 'Yes (disabled)'}
                </button>
                <button
                  onClick={() =>
                    setInteraction((current) =>
                      transitionCourseShell(current, {type: 'cancel-quit'})
                    )
                  }
                  ref={cancelQuitRef}
                  type="button"
                >
                  {spanish ? 'No' : 'No'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

const animationModule: AnimationModule<CourseShellFrameState> = Object.freeze({
  key: 'shell-course-g04-l01-index-local',
  movie: COURSE_SHELL_G04_L01_MOVIE,
  playbackMode: 'once',
  reducedMotionFrame: 50,
  scenarios,
  audioCues: Object.freeze([]),
  maturity: 'legacy-prototype',
  Renderer: CourseShellG04L01Renderer,
  getFrameState(frame: number, context: RuntimeContext) {
    return getCourseShellFrameState(frame, context);
  }
});

export default animationModule;
