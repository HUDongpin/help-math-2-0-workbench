'use client';

import React, {useEffect, useMemo, useRef, useState} from 'react';

import type {AnimationModule, AnimationRendererProps, RuntimeContext} from '../contract';
import {
  COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA,
  COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_IDS
} from '../timelines/generated/shell-course-g04-l03-additional-domain-assets';
import {
  COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_DATA,
  COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_IDS
} from '../timelines/generated/shell-course-g04-l03-single-frame-domain-assets';
import {
  COURSE_SHELL_G04_L03_MOVIE,
  COURSE_SHELL_G04_L03_SECTIONS,
  COURSE_SHELL_G04_L03_SOURCE,
  getCourseShellG04L03FrameState,
  transitionCourseShellG04L03,
  type CourseShellG04L03FrameState,
  type CourseShellG04L03InteractionState,
  type CourseShellG04L03SectionCode
} from '../timelines/shell-course-g04-l03-index-local';

const scenarios = Object.freeze([
  Object.freeze({
    id: 'source-root-structural',
    label: 'FFDec structural root timeline',
    description:
      'Hash-bound static root drawings; not original-runtime, ActionScript, audio, or interaction evidence.'
  }),
  Object.freeze({
    id: 'native-menu-structural',
    label: 'FFDec structural native menu timeline',
    description:
      'Hash-bound sprite-1011 drawings; not original-runtime, ActionScript, interaction, audio, or full-stage parity evidence.'
  }),
  Object.freeze({
    id: 'mover-tooltip-structural',
    label: 'FFDec structural mover tooltip timeline',
    description:
      'Hash-bound sprite-528 drawings and complete local-frame mapping; not original-runtime, ActionScript, hover causality, audio, or full-stage parity evidence.'
  }),
  Object.freeze({
    id: 'popup-control-structural',
    label: 'FFDec structural popup control timeline',
    description:
      'Hash-bound sprite-302 drawings and complete local-frame mapping; not original-runtime, ActionScript, hover causality, audio, or full-stage parity evidence.'
  }),
  Object.freeze({
    id: 'mouse-object-control-structural',
    label: 'FFDec structural mouse-object control timeline',
    description:
      'Hash-bound sprite-327 drawings and complete local-frame mapping; not original-runtime, ActionScript, mouse causality, audio, or full-stage parity evidence.'
  }),
  Object.freeze({
    id: 'preloader-progress-structural',
    label: 'FFDec structural preloader progress timeline',
    description:
      'Hash-bound sprite-132 drawings for all 100 local frames; not original-runtime, ActionScript, loading-progress causality, audio, or full-stage parity evidence.'
  }),
  ...COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_IDS.map((frameDomain) => {
    const data = COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA[frameDomain];
    return Object.freeze({
      id: data.scenarioId,
      label: `FFDec structural ${data.label} timeline`,
      description:
        `Hash-bound ${frameDomain} drawings and complete ${data.frameCount}-frame mapping; ` +
        `not original-runtime, ActionScript, ${data.behaviorObligations.join(', ')}, interaction, audio, localization, full-stage parity, RMSE, or acceptance evidence.`
    });
  }),
  ...COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_IDS.map((frameDomain) => {
    const data = COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_DATA[frameDomain];
    return Object.freeze({
      id: data.scenarioId,
      label: `FFDec structural ${data.label} timeline`,
      description:
        `Hash-bound one-frame ${frameDomain} drawing; not original-runtime, ActionScript, ` +
        `${data.behaviorObligations.join(', ')}, interaction, audio, localization, full-stage parity, RMSE, or acceptance evidence.`
    });
  }),
  Object.freeze({
    id: 'lesson-map-audit',
    label: 'Current-JavaScript lesson map',
    description: '39 active pages in the physical G4 L3 index.xml order.'
  }),
  ...COURSE_SHELL_G04_L03_SECTIONS.map((section) =>
    Object.freeze({
      id: `section-${section.code.toLowerCase()}`,
      label: `${section.code} section`,
      description: `Deterministic audit projection of ${section.titleEnglish}.`
    })
  ),
  Object.freeze({
    id: 'quit-confirmation',
    label: 'Disabled close confirmation',
    description: 'The recovered legacy close side effect remains disabled.'
  })
]);

function isFrameState(value: unknown): value is CourseShellG04L03FrameState {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'frame' in value &&
      'phase' in value &&
      'sections' in value &&
      'language' in value
  );
}

function sectionLabel(
  section: (typeof COURSE_SHELL_G04_L03_SECTIONS)[number],
  spanish: boolean
): string {
  return spanish ? section.titleSpanish : section.titleEnglish;
}

function StructuralRootFrameView({state}: {state: CourseShellG04L03FrameState}) {
  return (
    <img
      alt={`FFDec structural root drawing, frame ${state.frame} of 50; original-runtime behavior is not established`}
      data-actionscript-executed="false"
      data-original-runtime-baseline-complete="false"
      data-root-frame-sha256={state.rootFrameAsset.sha256}
      data-root-visual-authority={state.rootVisualAuthority}
      data-spanish-translation-supplied="false"
      height={600}
      src={state.rootFrameAsset.source}
      style={{display: 'block', height: '100%', width: '100%'}}
      width={800}
    />
  );
}

function StructuralNestedTimelineView({state}: {state: CourseShellG04L03FrameState}) {
  if (!state.nestedFrameAsset || !state.nestedGeometry) return null;
  const mover = state.frameDomain === 'sprite-528';
  const control = state.frameDomain === 'sprite-302' || state.frameDomain === 'sprite-327';
  const progress = state.frameDomain === 'sprite-132';
  const additional = COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_IDS.some(
    (frameDomain) => frameDomain === state.frameDomain
  );
  const singleFrame = COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_IDS.some(
    (frameDomain) => frameDomain === state.frameDomain
  );
  const supplemental = additional || singleFrame;
  const nativeMenu = !mover && !control && !progress && !supplemental;
  const supplementalMatrix = supplemental
    ? (state.nestedGeometry as unknown as {rootCompositionMatrix: {a: number; b: number; c: number; d: number; e: number; f: number}}).rootCompositionMatrix
    : null;
  return (
    <div
      data-full-stage-composition-claimed="false"
      data-mover-manifest-sha256={mover ? state.nestedGeometry.assetManifestSha256 : undefined}
      data-mover-source-character-id={mover ? state.nestedGeometry.sourceCharacterId : undefined}
      data-mover-source-instance-id={mover ? state.nestedGeometry.sourceInstanceId : undefined}
      data-control-manifest-sha256={control ? state.nestedGeometry.assetManifestSha256 : undefined}
      data-control-source-character-id={control ? state.nestedGeometry.sourceCharacterId : undefined}
      data-control-source-instance-id={control ? state.nestedGeometry.sourceInstanceId : undefined}
      data-progress-manifest-sha256={progress ? state.nestedGeometry.assetManifestSha256 : undefined}
      data-progress-source-character-id={progress ? state.nestedGeometry.sourceCharacterId : undefined}
      data-progress-source-instance-id={progress ? state.nestedGeometry.sourceInstanceId : undefined}
      data-additional-domain-manifest-sha256={additional ? state.nestedGeometry.assetManifestSha256 : undefined}
      data-additional-domain-source-character-id={additional ? state.nestedGeometry.sourceCharacterId : undefined}
      data-additional-domain-source-instance-id={additional ? state.nestedGeometry.sourceInstanceId : undefined}
      data-single-frame-domain-manifest-sha256={singleFrame ? state.nestedGeometry.assetManifestSha256 : undefined}
      data-single-frame-domain-source-character-id={singleFrame ? state.nestedGeometry.sourceCharacterId : undefined}
      data-single-frame-domain-source-instance-id={singleFrame ? state.nestedGeometry.sourceInstanceId : undefined}
      data-native-menu-manifest-sha256={nativeMenu ? state.nestedGeometry.assetManifestSha256 : undefined}
      data-native-menu-source-character-id={nativeMenu ? state.nestedGeometry.sourceCharacterId : undefined}
      data-native-menu-source-instance-id={nativeMenu ? state.nestedGeometry.sourceInstanceId : undefined}
      data-nested-timeline-visual-authority={state.nestedVisualAuthority ?? undefined}
      style={{background: '#fff', height: '100%', overflow: 'hidden', position: 'relative', width: '100%'}}
    >
      <img
        alt={`FFDec structural ${state.frameDomain} drawing, local frame ${state.frame} of ${state.nestedGeometry.frameCount}; original-runtime behavior and full-stage composition are not established`}
        data-actionscript-executed="false"
        data-mover-frame-sha256={mover ? state.nestedFrameAsset.sha256 : undefined}
        data-control-frame-sha256={control ? state.nestedFrameAsset.sha256 : undefined}
        data-progress-frame-sha256={progress ? state.nestedFrameAsset.sha256 : undefined}
        data-additional-domain-frame-sha256={additional ? state.nestedFrameAsset.sha256 : undefined}
        data-single-frame-domain-frame-sha256={singleFrame ? state.nestedFrameAsset.sha256 : undefined}
        data-native-menu-frame-sha256={nativeMenu ? state.nestedFrameAsset.sha256 : undefined}
        data-original-runtime-baseline-complete="false"
        height={state.nestedGeometry.exporterCanvas.height}
        src={state.nestedFrameAsset.source}
        style={{
          display: 'block',
          height: `${state.nestedGeometry.exporterCanvas.height}px`,
          left: supplemental ? '0' : `${state.nestedGeometry.rootCompositionOffset.x}px`,
          maxWidth: 'none',
          position: 'absolute',
          top: supplemental ? '0' : `${state.nestedGeometry.rootCompositionOffset.y}px`,
          transform: supplementalMatrix
            ? `matrix(${supplementalMatrix.a}, ${supplementalMatrix.b}, ${supplementalMatrix.c}, ${supplementalMatrix.d}, ${supplementalMatrix.e}, ${supplementalMatrix.f})`
            : undefined,
          transformOrigin: supplementalMatrix ? '0 0' : undefined,
          width: `${state.nestedGeometry.exporterCanvas.width}px`
        }}
        width={state.nestedGeometry.exporterCanvas.width}
      />
    </div>
  );
}

export function CourseShellG04L03Renderer({
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
  const deterministicState = isFrameState(state)
    ? state
    : getCourseShellG04L03FrameState(frame, {frameDomain, lang, scenario, seed});
  const initialInteraction = useMemo<CourseShellG04L03InteractionState>(
    () =>
      replaySequence > 0
        ? {view: 'menu', selectedSection: null}
        : {
            view: deterministicState.view,
            selectedSection: deterministicState.selectedSection
          },
    [deterministicState.selectedSection, deterministicState.view, replaySequence]
  );
  const [interaction, setInteraction] = useState<CourseShellG04L03InteractionState>(
    initialInteraction
  );
  const cancelQuitRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setInteraction(initialInteraction), [initialInteraction]);
  useEffect(() => {
    if (interaction.view === 'quit-confirmation') cancelQuitRef.current?.focus();
  }, [interaction.view]);

  const lessonMapProjection =
    deterministicState.presentation === 'current-javascript-lesson-map';
  const nestedMenuProjection =
    deterministicState.presentation === 'ffdec-structural-native-menu' ||
    deterministicState.presentation === 'ffdec-structural-mover-tooltip' ||
    deterministicState.presentation === 'ffdec-structural-control-tooltip' ||
    deterministicState.presentation === 'ffdec-structural-preloader-progress' ||
    deterministicState.presentation === 'ffdec-structural-additional-domain' ||
    deterministicState.presentation === 'ffdec-structural-single-frame-domain';
  const spanish = deterministicState.language === 'es';
  const selectedSection = deterministicState.sections.find(
    (section) => section.code === interaction.selectedSection
  );
  const chooseSection = (section: CourseShellG04L03SectionCode) =>
    setInteraction((current) =>
      transitionCourseShellG04L03(current, {type: 'select-section', section})
    );
  const replay = () => {
    setInteraction((current) => transitionCourseShellG04L03(current, {type: 'replay'}));
    onReplay?.();
  };

  return (
    <div className="faithful-conversion course-shell-conversion">
      <section
        aria-label={
          lessonMapProjection && spanish
            ? 'Candidato estructural actual de JavaScript para la lección 3 del grado 4'
            : lessonMapProjection
              ? 'Grade 4 Lesson 3 current-JavaScript structural candidate'
              : nestedMenuProjection
                ? `Grade 4 Lesson 3 FFDec structural ${deterministicState.frameDomain} timeline inspection`
                : 'Grade 4 Lesson 3 FFDec structural root-frame inspection'
        }
        className="faithful-stage-wrap course-shell-stage g4-l3-course-shell-stage"
        data-animation-id={COURSE_SHELL_G04_L03_SOURCE.animationId}
        data-capture-stage="true"
        data-flash-entry-state-sha256={entryStateSha256}
        data-flash-frame={deterministicState.frame}
        data-flash-frame-domain={deterministicState.frameDomain}
        data-flash-requirement-id={requirementId}
        data-flash-root-frame={rootFrame ?? deterministicState.rootFrame}
        data-flash-trace-id={traceId}
        data-render-state={deterministicState.status}
        data-actionscript-executed={deterministicState.actionScriptExecuted}
        data-original-runtime-baseline-complete={deterministicState.originalRuntimeBaselineComplete}
        data-render-visual="true"
        data-runtime-language={deterministicState.language}
        data-runtime-scenario={deterministicState.scenario}
        data-runtime-seed={deterministicState.seed}
        data-shell-page-count={COURSE_SHELL_G04_L03_SOURCE.activeXmlPageCount}
        data-shell-phase={deterministicState.phase}
        data-shell-presentation={deterministicState.presentation}
        data-shell-source-visual-parity="false"
        data-shell-static-page-count-conflict="unresolved"
        data-shell-view={
          lessonMapProjection
            ? interaction.view
            : nestedMenuProjection
              ? `ffdec-structural-${deterministicState.frameDomain}`
              : 'ffdec-structural-root'
        }
        data-state-frame-domain={frameDomain ?? deterministicState.frameDomain}
        data-strict-acceptance-effect={deterministicState.strictAcceptanceEffect}
        style={{aspectRatio: '4 / 3'}}
      >
        {nestedMenuProjection ? (
          <StructuralNestedTimelineView state={deterministicState} />
        ) : !lessonMapProjection ? (
          <StructuralRootFrameView state={deterministicState} />
        ) : (
          <>
            <header className="course-shell-header">
              <div aria-hidden="true" className="course-shell-logo">
                <span>HELP</span>
                <small>MATH</small>
              </div>
              <div className="course-shell-heading">
                <p lang="en">{deterministicState.courseTitle}</p>
                <h2 lang="en">{deterministicState.lessonTitle}</h2>
                {spanish ? (
                  <small
                    className="course-shell-title-fallback"
                    data-source-language-fallback="lesson-title"
                  >
                    Título en español no disponible en la fuente
                  </small>
                ) : null}
              </div>
              <div className="course-shell-utilities">
                <button
                  aria-label={spanish ? 'Mostrar mapa de auditoría' : 'Show audit map'}
                  onClick={() =>
                    setInteraction((current) =>
                      transitionCourseShellG04L03(current, {type: 'show-menu'})
                    )
                  }
                  type="button"
                >
                  {spanish ? 'Mapa' : 'Map'}
                </button>
                <button disabled type="button">
                  {spanish ? 'Términos' : 'Key Terms'}
                </button>
                <button disabled type="button">
                  {spanish ? 'Calculadora' : 'Calculator'}
                </button>
                <button
                  aria-haspopup="dialog"
                  aria-label={spanish ? 'Solicitar cierre' : 'Request close'}
                  onClick={() =>
                    setInteraction((current) =>
                      transitionCourseShellG04L03(current, {type: 'request-quit'})
                    )
                  }
                  type="button"
                >
                  ×
                </button>
              </div>
            </header>

            <div className="course-shell-main" id="course-shell-g04-l03-content">
              {interaction.view === 'section' && selectedSection ? (
                <section aria-labelledby={`course-shell-g04-l03-${selectedSection.code}-title`}>
                  <div className="course-shell-section-heading">
                    <button
                      onClick={() =>
                        setInteraction((current) =>
                          transitionCourseShellG04L03(current, {type: 'show-menu'})
                        )
                      }
                      type="button"
                    >
                      ← {spanish ? 'Mapa' : 'Map'}
                    </button>
                    <div>
                      <span>{selectedSection.code}</span>
                      <h3 id={`course-shell-g04-l03-${selectedSection.code}-title`}>
                        {sectionLabel(selectedSection, spanish)}
                      </h3>
                    </div>
                  </div>
                  <ol className="course-shell-pages">
                    {selectedSection.pages.map((page) => {
                      const hasSpanishTitle = Boolean(page.titleSpanish);
                      const title = spanish && hasSpanishTitle
                        ? page.titleSpanish
                        : page.titleEnglish;
                      const href = `${spanish ? '/es' : ''}${page.auditRoute}`;
                      return (
                        <li key={page.animationId}>
                          <a
                            data-animation-id={page.animationId}
                            data-route-authority="local-current-javascript-audit-only"
                            href={href}
                            lang={spanish && hasSpanishTitle ? 'es' : 'en'}
                          >
                            <span>{page.sectionPageOrdinal}</span>
                            <strong>{title}</strong>
                            <small>
                              {spanish && !hasSpanishTitle
                                ? 'Texto inglés: no hay título español de página en la fuente'
                                : spanish
                                  ? 'Candidato JavaScript actual · no aceptado estrictamente'
                                  : 'Current-JavaScript candidate · not strictly accepted'}
                            </small>
                          </a>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              ) : (
                <nav
                  aria-label={spanish ? 'Secciones de auditoría de la lección' : 'Lesson audit sections'}
                  className="course-shell-sections"
                >
                  {deterministicState.sections.map((section) => (
                    <button
                      aria-controls="course-shell-g04-l03-content"
                      key={section.code}
                      onClick={() => chooseSection(section.code)}
                      type="button"
                    >
                      <span>{section.code}</span>
                      <strong>{sectionLabel(section, spanish)}</strong>
                      <small>
                        {spanish
                          ? `${section.pages.length} páginas activas en XML`
                          : `${section.pages.length} active XML pages`}
                      </small>
                    </button>
                  ))}
                </nav>
              )}
            </div>

            <footer className="course-shell-footer">
              <span>
                {spanish
                  ? 'Proyección de auditoría: 39 páginas activas; candidato estático de 44 aún sin resolver.'
                  : 'Audit projection: 39 active pages; 44-page static candidate remains unresolved.'}
              </span>
              <button onClick={replay} type="button">
                ↻ {spanish ? 'Repetir mapa' : 'Replay map'}
              </button>
            </footer>

            {interaction.view === 'quit-confirmation' ? (
              <div
                aria-describedby="course-shell-g04-l03-quit-description"
                aria-labelledby="course-shell-g04-l03-quit-title"
                aria-modal="true"
                className="course-shell-modal-backdrop"
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setInteraction((current) =>
                      transitionCourseShellG04L03(current, {type: 'cancel-quit'})
                    );
                  }
                }}
                role="dialog"
              >
                <div className="course-shell-modal">
                  <h3 id="course-shell-g04-l03-quit-title">
                    {spanish ? '¿Seguro que quieres cerrar?' : 'Are you sure you want to close?'}
                  </h3>
                  <p id="course-shell-g04-l03-quit-description">
                    {spanish
                      ? 'El cierre heredado y todos sus efectos externos permanecen desactivados.'
                      : 'The legacy close command and all external side effects remain disabled.'}
                  </p>
                  <div>
                    <button disabled type="button">
                      {spanish ? 'Sí (desactivado)' : 'Yes (disabled)'}
                    </button>
                    <button
                      onClick={() =>
                        setInteraction((current) =>
                          transitionCourseShellG04L03(current, {type: 'cancel-quit'})
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
          </>
        )}
      </section>
    </div>
  );
}

const animationModule: AnimationModule<CourseShellG04L03FrameState> = Object.freeze({
  key: 'shell-course-g04-l03-index-local',
  movie: COURSE_SHELL_G04_L03_MOVIE,
  runtime: Object.freeze({
    ...COURSE_SHELL_G04_L03_MOVIE,
    defaultFrameDomain: 'root',
    frameDomains: Object.freeze([
      Object.freeze({id: 'root', frameCount: 50}),
      Object.freeze({id: 'sprite-1011', frameCount: 48, fps: 12, rootFrame: 50}),
      Object.freeze({id: 'sprite-132', frameCount: 100, fps: 12, rootFrame: 1}),
      Object.freeze({id: 'sprite-302', frameCount: 149, fps: 12, rootFrame: 49}),
      Object.freeze({id: 'sprite-327', frameCount: 132, fps: 12, rootFrame: 49}),
      Object.freeze({id: 'sprite-528', frameCount: 871, fps: 12, rootFrame: 49}),
      ...COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_IDS.map((id) => {
        const data = COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA[id];
        return Object.freeze({id, frameCount: data.frameCount, fps: 12, rootFrame: data.rootFrame});
      }),
      ...COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_IDS.map((id) => {
        const data = COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_DATA[id];
        return Object.freeze({id, frameCount: 1, fps: 12, rootFrame: data.rootFrame});
      })
    ])
  }),
  playbackMode: 'once',
  playbackEndFrame: 49,
  playbackEndFrameByDomain: Object.freeze({
    root: 49,
    'sprite-1011': 48,
    'sprite-132': 100,
    'sprite-302': 149,
    'sprite-327': 132,
    'sprite-528': 871,
    ...Object.fromEntries(
      COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_IDS.map((id) => [
        id,
        COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA[id].frameCount
      ])
    ),
    ...Object.fromEntries(COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_IDS.map((id) => [id, 1]))
  }),
  reducedMotionFrame: 49,
  defaultScenarioByFrameDomain: Object.freeze({
    root: 'source-root-structural',
    'sprite-1011': 'native-menu-structural',
    'sprite-132': 'preloader-progress-structural',
    'sprite-302': 'popup-control-structural',
    'sprite-327': 'mouse-object-control-structural',
    'sprite-528': 'mover-tooltip-structural',
    ...Object.fromEntries(
      COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_IDS.map((id) => [
        id,
        COURSE_SHELL_G04_L03_ADDITIONAL_DOMAIN_DATA[id].scenarioId
      ])
    ),
    ...Object.fromEntries(
      COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_IDS.map((id) => [
        id,
        COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_DATA[id].scenarioId
      ])
    )
  }),
  scenarios,
  audioCues: Object.freeze([]),
  maturity: 'legacy-prototype',
  Renderer: CourseShellG04L03Renderer,
  getFrameState(frame: number, context: RuntimeContext) {
    return getCourseShellG04L03FrameState(frame, context);
  }
});

export default animationModule;
