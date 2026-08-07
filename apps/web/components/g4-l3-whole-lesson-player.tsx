'use client';

import {loadAnimationModule} from '@helpmath/demos/animation-registry';
import {
  createMemoryOnlyLessonHost,
  type LessonHostDecision,
  type LessonHostRequest,
} from '@helpmath/demos/runtime';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {
  AnimationRuntime,
  INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE,
  type AnimationRuntimePlaybackState,
  type AnimationRuntimeSeekRequest,
} from '@/components/animation-runtime';
import {G4L3ControlledCeoPreviewBoundary} from '@/components/g4-l3-controlled-ceo-preview-boundary';
import {G4L3Page36ReadableView} from '@/components/g4-l3-readable-view';
import type {LegacyCalculatorEvidence} from '@/components/legacy-calculator';
import {
  LegacyKeyTermsBrowser,
  type LegacyKeyTermSelectionRequest,
} from '@/components/legacy-key-terms-browser';
import {LegacyResumePrompt} from '@/components/legacy-resume-prompt';
import {
  LegacyResponsiveLessonShell,
  type LegacyLessonShellVisualSkin,
  type LessonShellTool,
} from '@/components/legacy-responsive-lesson-shell';
import {
  G4_L3_LESSON,
  findG4L3Page,
  getG4L3PageLabel,
  getG4L3SectionLabel,
  type G4L3Locale,
} from '@/lib/g4-l3-lesson-navigation';
import {G4_L3_PAGE_36_READABLE_VIEW_SPEC} from '@/lib/g4-l3-readable-view';
import {G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR} from '@/lib/g4-l3-whole-lesson-player-descriptor';
import {
  G4_L3_WHOLE_LESSON_STORAGE_KEY,
  completeG4L3Page,
  createInitialG4L3WholeLessonProgress,
  g4L3CompletionPercent,
  parseG4L3WholeLessonProgress,
  parseG4L3WholeLessonResumeCandidate,
  recordG4L3Replay,
  startG4L3LessonAtBeginning,
  visitG4L3Page,
  type G4L3WholeLessonProgress,
} from '@/lib/g4-l3-whole-lesson';
import {
  appendLegacyLessonHistory,
  takeLegacyLessonHistory,
} from '@/lib/legacy-shell-controls';
import {LEGACY_MAP_RAIL_MIN_WIDTH} from '@/lib/legacy-lesson-layout';

const G4_L3_LEGACY_VISUAL_SKIN: LegacyLessonShellVisualSkin = Object.freeze({
  authoredStage: G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.stage,
  chromeAsset: G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.visualSkin.chromeAsset,
  chromeEvidence:
    G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.visualSkin.evidence.kind,
  chromeFooterHeight:
    G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.visualSkin.footer.height,
  chromeHeaderHeight:
    G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.visualSkin.header.height,
  controlAssets:
    G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.visualSkin.controls,
  backgroundCompanion:
    G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.visualSkin.backgroundCompanion,
  resumePrompt:
    G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.visualSkin.resumePrompt,
  exitPrompt:
    G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.visualSkin.exitPrompt,
  layoutId: G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.visualSkin.layoutId,
  sourceAnimationId:
    G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.visualSkin.evidence.sourceAnimationId,
  sourceSwfSha256:
    G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.visualSkin.evidence.sourceSwfSha256,
});
const G4_L3_REQUIRED_MEMBER_COUNT =
  G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.course.expectedReleaseMemberCount;
const G4_L3_RELEASE_MEMBER_IDS = Object.freeze(
  G4_L3_LESSON.pages.map(({animationId}) => animationId),
);
const G4_L3_PAGE_INTERACTION_COMPANION_TARGET_ID =
  `${G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.course.domIdPrefix}-page-interaction-companion`;
const G4_L3_CURRENT_JS_PAGE_COUNT =
  G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.pages.filter(
  (page) => page.rendererAvailability.kind === 'registered',
).length;
const G4_L3_CALCULATOR_EVIDENCE: LegacyCalculatorEvidence = Object.freeze({
  behaviorKind: 'ffdec-actionscript-static-candidate',
  sourceAnimationId:
    G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.visualSkin.evidence.sourceAnimationId,
  sourceSwfSha256:
    G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.visualSkin.evidence.sourceSwfSha256,
  panel: Object.freeze({
    asset:
      '/flash-assets/courses/shell-course-g04-l03-index-local/sprite-774/visual-001-87a19fa406ba.png',
    height: 488,
    sha256:
      '87a19fa406ba96dbefa3be9303ad3a69c8a6ea5f77dea539040368e4bc550a05',
    width: 363,
  }),
});
const SOURCE_STOP_KEYTERM_PLAYBACK =
  'source-stop-timeline-and-audio-until-explicit-resume' as const;
type SourceStopHold = Readonly<{
  animationId: string;
  entryId: string;
  requestRevision: number;
}>;

export function G4L3WholeLessonPlayer({
  candidateMode,
  controlledPreview,
  locale,
  releasePublished,
  strictCompleteMemberCount,
}: {
  candidateMode: boolean;
  controlledPreview: boolean;
  locale: G4L3Locale;
  releasePublished: boolean;
  strictCompleteMemberCount: number;
}) {
  const [progress, setProgress] = useState(
    createInitialG4L3WholeLessonProgress(locale),
  );
  const [hydrated, setHydrated] = useState(false);
  const [resumeCandidate, setResumeCandidate] =
    useState<G4L3WholeLessonProgress | null>(null);
  const [resumeDecision, setResumeDecision] =
    useState<'checking' | 'prompt' | 'resolved'>('checking');
  const [mapOpen, setMapOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<LessonShellTool>(null);
  const [keyTermSelectionRequest, setKeyTermSelectionRequest] =
    useState<LegacyKeyTermSelectionRequest | null>(null);
  const [sourceStopHold, setSourceStopHold] =
    useState<SourceStopHold | null>(null);
  const [paused, setPaused] = useState(false);
  const [volume, setVolume] = useState(.8);
  const [playbackState, setPlaybackState] =
    useState<AnimationRuntimePlaybackState>(
      INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE,
    );
  const [seekRequest, setSeekRequest] =
    useState<AnimationRuntimeSeekRequest | null>(null);
  const [runtimeEpoch, setRuntimeEpoch] = useState(0);
  const [lessonFinished, setLessonFinished] = useState(false);
  const initialPageFocusSkippedRef = useRef(false);
  const lessonPlayerRef = useRef<HTMLDivElement>(null);
  const pageHeadingRef = useRef<HTMLHeadingElement>(null);
  const seekRequestIdRef = useRef(0);
  const keyTermSelectionRevisionRef = useRef(0);
  const pageInteractionReturnFocusRef = useRef<HTMLElement | null>(null);
  const lessonNavigationHistoryRef = useRef<readonly string[]>([]);
  const currentPage = findG4L3Page(progress.currentAnimationId)
    ?? G4_L3_LESSON.pages[0]!;
  const currentAnimationId = currentPage.animationId;
  const currentIndex = currentPage.globalPageOrdinal - 1;
  const previousPage = G4_L3_LESSON.pages[currentIndex - 1] ?? null;
  const nextPage = G4_L3_LESSON.pages[currentIndex + 1] ?? null;
  const currentSection = G4_L3_LESSON.sections.find(
    (section) => section.code === currentPage.sectionCode,
  )!;
  const currentLabel = getG4L3PageLabel(currentPage, progress.language);
  const completed = new Set(progress.completedAnimationIds);
  const visited = new Set(progress.visitedAnimationIds);
  const completedCount = progress.completedAnimationIds.length;
  const completionPercent = g4L3CompletionPercent(progress);
  const spanish = progress.language === 'es';
  const lessonHostIdentity = `${currentAnimationId}\u0000${progress.language}`;
  const pagesBySection = useMemo(() => Object.fromEntries(
    G4_L3_LESSON.sections.map((section) => [
      section.code,
      G4_L3_LESSON.pages.filter((page) => page.sectionCode === section.code),
    ]),
  ), []);
  const lessonHost = useMemo(() => {
    const separator = lessonHostIdentity.indexOf('\u0000');
    const animationId = lessonHostIdentity.slice(0, separator);
    const language = lessonHostIdentity.slice(separator + 1) as G4L3Locale;
    return createMemoryOnlyLessonHost({
      releaseId: G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.releaseId,
      releaseMemberIds: G4_L3_RELEASE_MEMBER_IDS,
      currentAnimationId: animationId,
      enabledCapabilities: ['keyterm'],
      initialLanguage: language,
      mode: 'audit',
      releasePublished: false,
    });
  }, [lessonHostIdentity]);
  const handlePausedChange = useCallback((nextPaused: boolean) => {
    if (!nextPaused) setSourceStopHold(null);
    setPaused(nextPaused);
  }, []);
  const resetPageInteractionHost = useCallback(() => {
    lessonHost.dispatch({type: 'close-keyterm'});
    pageInteractionReturnFocusRef.current = null;
    setKeyTermSelectionRequest(null);
    setSourceStopHold(null);
  }, [lessonHost]);
  const handleLessonHostRequest = useCallback((
    request: LessonHostRequest,
    context?: Readonly<{trigger?: HTMLElement}>,
  ): LessonHostDecision => {
    const decision = lessonHost.dispatch(request);
    if (decision.status !== 'allowed' || request.type !== 'open-keyterm') {
      return decision;
    }
    const hostAnimationId = decision.state.currentAnimationId;
    keyTermSelectionRevisionRef.current += 1;
    const requestRevision = keyTermSelectionRevisionRef.current;
    pageInteractionReturnFocusRef.current =
      context?.trigger?.isConnected ? context.trigger : null;
    setKeyTermSelectionRequest({
      entryId: request.entryId,
      revision: requestRevision,
      sourceAnimationId: hostAnimationId,
    });
    if (request.playbackDisposition === SOURCE_STOP_KEYTERM_PLAYBACK) {
      setSourceStopHold({
        animationId: hostAnimationId,
        entryId: request.entryId,
        requestRevision,
      });
      setPaused(true);
      setSeekRequest(null);
    }
    setActiveTool('key-terms');
    return decision;
  }, [lessonHost]);
  const handleShellToolChange = useCallback((tool: LessonShellTool) => {
    const returnFocusTarget = pageInteractionReturnFocusRef.current;
    pageInteractionReturnFocusRef.current = null;
    if (activeTool === 'key-terms' && tool !== 'key-terms') {
      lessonHost.dispatch({type: 'close-keyterm'});
      setKeyTermSelectionRequest(null);
    }
    setActiveTool(tool);
    if (tool !== null || !returnFocusTarget?.isConnected) return;
    window.requestAnimationFrame(() => {
      if (returnFocusTarget.isConnected) {
        returnFocusTarget.focus({preventScroll: true});
      }
    });
  }, [activeTool, lessonHost]);

  useEffect(() => {
    let active = true;
    let serialized: string | null = null;
    try {
      serialized = window.localStorage.getItem(
        G4_L3_WHOLE_LESSON_STORAGE_KEY,
      );
    } catch {
      // Storage can be blocked by browser policy. The in-memory learner
      // session remains fully functional.
    }
    const candidate = parseG4L3WholeLessonResumeCandidate(
      serialized,
      locale,
    );
    const storedProgress = candidate ??
      parseG4L3WholeLessonProgress(serialized, locale);
    queueMicrotask(() => {
      if (!active) return;
      if (candidate) {
        setResumeCandidate(candidate);
        setResumeDecision('prompt');
      } else {
        setProgress(storedProgress);
        setResumeDecision('resolved');
      }
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [locale]);

  useEffect(() => {
    if (resumeDecision !== 'resolved') return;
    const frame = window.requestAnimationFrame(() => {
      if (window.innerWidth >= LEGACY_MAP_RAIL_MIN_WIDTH) setMapOpen(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [resumeDecision]);

  useEffect(() => {
    if (!hydrated || resumeDecision !== 'resolved') return;
    try {
      window.localStorage.setItem(
        G4_L3_WHOLE_LESSON_STORAGE_KEY,
        JSON.stringify(progress),
      );
    } catch {
      // Persistence is optional; never block lesson navigation when local
      // storage is disabled or full.
    }
  }, [hydrated, progress, resumeDecision]);

  useEffect(() => {
    if (nextPage) void loadAnimationModule(nextPage.animationId);
  }, [nextPage]);

  useEffect(() => {
    if (!hydrated) return;
    if (!initialPageFocusSkippedRef.current) {
      initialPageFocusSkippedRef.current = true;
      return;
    }
    pageHeadingRef.current?.focus();
  }, [currentPage.animationId, hydrated]);

  const navigateToPage = (
    animationId: string,
    recordHistory: boolean,
  ) => {
    if (recordHistory) {
      lessonNavigationHistoryRef.current = appendLegacyLessonHistory(
        lessonNavigationHistoryRef.current,
        currentPage.animationId,
        animationId,
      );
    }
    setProgress((value) => visitG4L3Page(value, animationId));
    setRuntimeEpoch((value) => value + 1);
    setLessonFinished(false);
    setMapOpen(false);
    resetPageInteractionHost();
    setActiveTool(null);
    setPaused(false);
    setPlaybackState(INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE);
    setSeekRequest(null);
  };
  const selectPage = (animationId: string) => {
    navigateToPage(animationId, true);
  };

  const completeCurrentPage = () => {
    setProgress((value) => completeG4L3Page(value, currentPage.animationId));
  };

  const completeAndAdvance = () => {
    if (!nextPage && lessonFinished) return;
    if (nextPage) {
      lessonNavigationHistoryRef.current = appendLegacyLessonHistory(
        lessonNavigationHistoryRef.current,
        currentPage.animationId,
        nextPage.animationId,
      );
    }
    setProgress((value) => {
      const completedValue = completeG4L3Page(value, currentPage.animationId);
      return nextPage
        ? visitG4L3Page(completedValue, nextPage.animationId)
        : completedValue;
    });
    setRuntimeEpoch((value) => value + 1);
    setMapOpen(false);
    resetPageInteractionHost();
    setActiveTool(null);
    setPaused(false);
    setPlaybackState(INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE);
    setSeekRequest(null);
    if (!nextPage) setLessonFinished(true);
  };

  const replayCurrentPage = () => {
    setProgress((value) => recordG4L3Replay(value, currentPage.animationId));
    setRuntimeEpoch((value) => value + 1);
    resetPageInteractionHost();
    setActiveTool(null);
    setPaused(false);
    setPlaybackState(INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE);
    setSeekRequest(null);
  };

  const inspectFrame = (frame: number) => {
    if (!playbackState.seekAvailable) return;
    seekRequestIdRef.current += 1;
    setPaused(true);
    setSeekRequest({
      frame,
      requestId: seekRequestIdRef.current,
    });
  };

  const resumeFromInspectedFrame = () => {
    if (!seekRequest) return;
    setSeekRequest(null);
    setSourceStopHold(null);
    setPaused(false);
  };

  const finishResumeDecision = (
    nextProgress: G4L3WholeLessonProgress,
  ) => {
    setProgress(nextProgress);
    setResumeCandidate(null);
    setResumeDecision('resolved');
    setRuntimeEpoch((value) => value + 1);
    setLessonFinished(false);
    setMapOpen(false);
    resetPageInteractionHost();
    setActiveTool(null);
    setPaused(false);
    setPlaybackState(INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE);
    setSeekRequest(null);
    lessonNavigationHistoryRef.current = [];
  };
  const continueFromSavedPosition = () => {
    if (!resumeCandidate) return;
    finishResumeDecision(resumeCandidate);
  };
  const startFromBeginning = () => {
    if (!resumeCandidate) return;
    finishResumeDecision(startG4L3LessonAtBeginning(resumeCandidate));
  };

  const libraryHref = spanish ? '/es/library' : '/library';
  const returnToPreviousLocation = () => {
    const transition = takeLegacyLessonHistory(
      lessonNavigationHistoryRef.current,
    );
    lessonNavigationHistoryRef.current = transition.history;
    if (transition.previousAnimationId) {
      navigateToPage(transition.previousAnimationId, false);
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.assign(libraryHref);
  };
  const exitToLibrary = () => window.location.assign(libraryHref);

  const restartLesson = () => {
    const confirmed = window.confirm(spanish
      ? '¿Reiniciar la lección y borrar el progreso guardado en este navegador?'
      : 'Restart the lesson and clear progress saved in this browser?');
    if (!confirmed) return;
    setProgress(createInitialG4L3WholeLessonProgress(progress.language));
    setRuntimeEpoch((value) => value + 1);
    setLessonFinished(false);
    setMapOpen(false);
    resetPageInteractionHost();
    setActiveTool(null);
    setPaused(false);
    setPlaybackState(INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE);
    setSeekRequest(null);
    lessonNavigationHistoryRef.current = [];
  };

  // The course map is the only section-level navigation. It already lists the
  // eight sections with progress ticks, so the section heading itself jumps to
  // the section instead of a separate tab strip repeating the same eight names.
  const mapPanel = <div className="lesson-shell2__map-content">
    {G4_L3_LESSON.sections.map((section) => {
      const label = getG4L3SectionLabel(section, progress.language);
      const sectionComplete = pagesBySection[section.code]!.every((page) =>
        completed.has(page.animationId)
      );
      return <section key={section.code}>
        <h3>
          <button
            aria-current={section.code === currentSection.code ? 'step' : undefined}
            className="lesson-shell2__map-section-jump"
            data-complete={sectionComplete ? 'true' : 'false'}
            data-section-code={section.code}
            onClick={() => selectPage(section.firstActiveAnimationId)}
            type="button"
          >
            <span aria-hidden="true">{sectionComplete ? '✓' : section.order}</span>
            <span lang={label.sourceLanguage}>{label.text}</span>
          </button>
        </h3>
        <ol start={pagesBySection[section.code]![0]!.globalPageOrdinal}>
          {pagesBySection[section.code]!.map((page) => {
            const labelText = getG4L3PageLabel(page, progress.language);
            return <li key={page.animationId}>
              <button
                aria-current={page.animationId === currentPage.animationId ? 'step' : undefined}
                data-animation-id={page.animationId}
                data-complete={completed.has(page.animationId) ? 'true' : 'false'}
                data-global-page-ordinal={page.globalPageOrdinal}
                data-section-code={page.sectionCode}
                data-spanish-title-status={page.spanishTitleStatus}
                data-visited={visited.has(page.animationId) ? 'true' : 'false'}
                onClick={() => selectPage(page.animationId)}
                type="button"
              >
                <span>{completed.has(page.animationId) ? '✓' : page.globalPageOrdinal}</span>
                <span lang={labelText.sourceLanguage}>{labelText.text}</span>
              </button>
            </li>;
          })}
        </ol>
      </section>;
    })}
  </div>;

  const vocabularyPages = pagesBySection.VB ?? [];
  const keyTermsPanel = <div className="lesson-shell2__key-terms">
    <LegacyKeyTermsBrowser key={progress.language} locale={progress.language}
      selectionRequest={keyTermSelectionRequest} />
    <details className="lesson-shell2__lesson-vocabulary-links">
      <summary>{spanish
        ? 'Páginas de vocabulario verificadas de esta lección'
        : 'Verified lesson vocabulary pages'}</summary>
      <p>{spanish
        ? 'Estas páginas de Palabras importantes sí conservan el orden exacto del XML del curso y permanecen separadas del glosario general candidato.'
        : 'These Important Words pages preserve exact course-XML order and remain separate from the grade-wide glossary candidate.'}</p>
      <ol>
        {vocabularyPages.map((page) => {
          const label = getG4L3PageLabel(page, progress.language);
          return <li key={page.animationId}>
            <button onClick={() => selectPage(page.animationId)} type="button">
              <span>{page.globalPageOrdinal}</span>
              <span lang={label.sourceLanguage}>{label.text}</span>
            </button>
          </li>;
        })}
      </ol>
    </details>
  </div>;

  const currentSectionLabel = getG4L3SectionLabel(
    currentSection,
    progress.language,
  );
  const pageHeading = <div>
    <p lang={currentSectionLabel.sourceLanguage}>{currentSectionLabel.text}</p>
    <h1 lang={currentLabel.sourceLanguage} ref={pageHeadingRef} tabIndex={-1}>{currentLabel.text}</h1>
    {currentLabel.usesEnglishFallback
      ? <p lang="es">La fuente no proporciona un título de página en español; se conserva el título original en inglés.</p>
      : null}
  </div>;

  const stage = <AnimationRuntime
    animationId={currentPage.animationId}
    key={`${currentPage.animationId}:${runtimeEpoch}`}
        labels={{
      replay: spanish ? 'Repetir' : 'Replay',
      reduced: spanish
        ? 'El movimiento está reducido según la preferencia del dispositivo.'
        : 'Motion is reduced to match this device preference.',
      prototype: spanish ? 'MVP de lección' : 'Lesson MVP',
      unavailable: spanish
        ? 'Este módulo no está disponible.'
        : 'This lesson module is unavailable.',
          loading: spanish ? 'Cargando página…' : 'Loading page…',
        }}
        loadedSwfHostAsset={currentPage.xmlBackgroundText
          ? G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.visualSkin
              .backgroundCompanion?.loadedSwfHostAsset
          : undefined}
    moduleKey={currentPage.animationId}
    onLessonHostRequest={handleLessonHostRequest}
    onPlaybackStateChange={setPlaybackState}
    onReplay={() => setProgress((value) =>
      recordG4L3Replay(value, currentPage.animationId)
    )}
    pageInteractionCompanionTargetId={
      G4_L3_PAGE_INTERACTION_COMPANION_TARGET_ID
    }
    paused={paused || resumeDecision !== 'resolved'}
    presentation="legacy-shell"
    query={{lang: progress.language, seed: '0'}}
    seekRequest={seekRequest}
    volume={volume}
  />;
  const resumePage = resumeCandidate
    ? findG4L3Page(resumeCandidate.currentAnimationId)
    : null;
  const resumePromptEvidence =
    G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.visualSkin.resumePrompt;
  const stageOverlay = resumeDecision === 'prompt' &&
      resumeCandidate &&
      resumePage &&
      resumePromptEvidence
    ? <LegacyResumePrompt
        evidence={resumePromptEvidence}
        locale={progress.language}
        onContinue={continueFromSavedPosition}
        onStartAtBeginning={startFromBeginning}
        resumePage={resumePage.globalPageOrdinal}
        resumePageLabel={
          getG4L3PageLabel(resumePage, progress.language).text
        }
      />
    : undefined;

  const helpPanel = <div className="lesson-shell2__help">
    <p>{spanish
      ? 'Usa Anterior y Siguiente para recorrer las 39 páginas en orden. Repetir reinicia solamente la página actual.'
      : 'Use Previous and Next to move through all 39 pages in order. Replay resets only the current page.'}</p>
    <p>{spanish
      ? 'Abre el Mapa del curso para saltar a cualquier sección o página. “Revisada” guarda progreso solamente en este navegador.'
      : 'Open the Course Map to jump to any section or page. “Reviewed” stores progress only in this browser.'}</p>
    <p>{spanish
      ? 'Este panel accesible reemplaza de forma segura el antiguo enlace de ayuda externo; no ejecuta URLs heredadas.'
      : 'This accessible panel safely replaces the legacy external help link; it does not execute legacy URLs.'}</p>
  </div>;
  const sourceStopNotice =
    sourceStopHold?.animationId === currentAnimationId
      ? <section
          aria-live="polite"
          data-source-stop-entry-id={sourceStopHold.entryId}
          data-source-stop-request-revision={sourceStopHold.requestRevision}
          data-source-stop-resume="explicit-current-js-control"
          style={{
            background: '#fff8cf',
            border: '2px solid #8d6400',
            borderRadius: 12,
            color: '#3f2b00',
            marginBlock: 12,
            padding: 14,
          }}
        >
          <strong>{spanish
            ? 'La animación permanece pausada.'
            : 'The animation remains paused.'}</strong>
          <p style={{margin: '6px 0 10px'}}>{spanish
            ? 'Cerrar Términos clave no reanuda esta página. Usa Reanudar animación cuando estés listo.'
            : 'Closing Key Terms does not resume this page. Use Resume animation when you are ready.'}</p>
          <button
            data-source-stop-resume-control="true"
            onClick={() => handlePausedChange(false)}
            type="button"
          >
            {spanish ? 'Reanudar animación' : 'Resume animation'}
          </button>
        </section>
      : undefined;
  const readableSupport =
    currentPage.animationId === G4_L3_PAGE_36_READABLE_VIEW_SPEC.animationId
      ? <G4L3Page36ReadableView
          key={`${currentPage.animationId}:${progress.language}`}
          locale={progress.language}
        />
      : undefined;
  const learningSupport = sourceStopNotice || readableSupport
    ? <>{sourceStopNotice}{readableSupport}</>
    : undefined;

  return <div
    data-current-animation-id={currentPage.animationId}
    data-current-page={currentPage.globalPageOrdinal}
    data-current-replay-count={progress.replayCounts[currentPage.animationId] ?? 0}
    data-hydrated={hydrated ? 'true' : 'false'}
    data-lesson-player="g4-l3-whole-lesson-mvp"
    data-progress-kind="learner-session"
    data-progress-storage="local-device-only"
    data-resume-decision={resumeDecision}
    data-source-stop-hold={
      sourceStopHold?.animationId === currentAnimationId ? 'true' : 'false'
    }
    lang={progress.language}
    ref={lessonPlayerRef}
  >
    <LegacyResponsiveLessonShell
      activeTool={activeTool}
      audioAvailable={playbackState.audioAvailable}
      backgroundCompanionVisible={currentPage.xmlBackgroundText}
      calculatorEvidence={G4_L3_CALCULATOR_EVIDENCE}
      candidateMode={candidateMode}
      completionAction={<button
        aria-pressed={completed.has(currentPage.animationId)}
        onClick={completeCurrentPage}
        type="button"
      >
        {completed.has(currentPage.animationId)
          ? (spanish ? '✓ Página revisada' : '✓ Page reviewed')
          : (spanish ? 'Marcar como revisada' : 'Mark reviewed')}
      </button>}
      completionLabel={spanish
        ? `${completedCount} de ${G4_L3_LESSON.activePageCount} páginas revisadas`
        : `${completedCount} of ${G4_L3_LESSON.activePageCount} pages reviewed`}
      completionPercent={completionPercent}
      courseContext={{
        courseTitle:
          G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.course.labels[
            progress.language
          ],
        pageTitle: currentLabel,
        section: {
          title: currentSectionLabel,
        },
      }}
      courseHref={G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.course.href}
      currentAnimationId={currentPage.animationId}
      currentPage={currentPage.globalPageOrdinal}
      disclosure={controlledPreview
        ? <G4L3ControlledCeoPreviewBoundary locale={progress.language} />
        : undefined}
      finishedNotice={lessonFinished
        ? <section aria-live="polite" className="lesson-shell2__finished">
            <span aria-hidden="true">★</span>
            <div>
              <h2>{spanish ? '¡Lección recorrida!' : 'Lesson journey complete!'}</h2>
              <p>{spanish
                ? `Has revisado ${progress.completedAnimationIds.length} de 39 páginas en este navegador.`
                : `You reviewed ${progress.completedAnimationIds.length} of 39 pages in this browser.`}</p>
            </div>
          </section>
        : undefined}
      gradeLessonLabel={spanish
        ? `Grado ${G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.course.grade} · Lección ${G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.course.lesson}`
        : `Grade ${G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.course.grade} · Lesson ${G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.course.lesson}`}
      helpPanel={helpPanel}
      idPrefix={G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.course.domIdPrefix}
      keyTermsPanel={keyTermsPanel}
      learningSupport={learningSupport}
      locale={progress.language}
      mapOpen={mapOpen}
      mapPanel={mapPanel}
      nextControlLabel={lessonFinished
        ? (spanish
            ? 'Revisión de la lección finalizada'
            : 'Lesson review finished')
        : nextPage
          ? (spanish ? 'Página siguiente' : 'Next page')
          : (spanish ? 'Terminar revisión' : 'Finish review')}
      nextDisabled={!nextPage && lessonFinished}
      nextLabel={lessonFinished
        ? (spanish ? 'Revisión finalizada ✓' : 'Lesson review finished ✓')
        : nextPage
          ? (spanish ? 'Revisada y siguiente →' : 'Reviewed & next →')
          : (spanish ? 'Terminar recorrido ✓' : 'Finish review ✓')}
      onMapOpenChange={setMapOpen}
      onHeaderBack={returnToPreviousLocation}
      onExit={exitToLibrary}
      onNext={completeAndAdvance}
      onPausedChange={handlePausedChange}
      onPlaybackResumeFromInspection={resumeFromInspectedFrame}
      onPlaybackSeek={inspectFrame}
      onPrevious={() => previousPage && selectPage(previousPage.animationId)}
      onReplay={replayCurrentPage}
      onToolChange={handleShellToolChange}
      onVolumeChange={setVolume}
      pageInteractionCompanionTargetId={
        G4_L3_PAGE_INTERACTION_COMPANION_TARGET_ID
      }
      pageHeading={pageHeading}
      paused={paused || resumeDecision !== 'resolved'}
      playbackFrame={playbackState.frame}
      playbackFrameCount={playbackState.frameCount}
      playbackFrameDomain={playbackState.frameDomain}
      playbackInspectionActive={seekRequest !== null}
      playbackSeekAvailable={playbackState.seekAvailable}
      playbackStepFrames={playbackState.stepFrames}
      playbackTransportMode={playbackState.transportMode}
      previousDisabled={!previousPage}
      releaseBoundary={{
        currentJsCandidate:
          G4_L3_CURRENT_JS_PAGE_COUNT ===
            G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.course.activePageCount,
        currentJsPageCount: G4_L3_CURRENT_JS_PAGE_COUNT,
        publicRelease: releasePublished,
        releaseId: G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.releaseId,
        requiredMemberCount: G4_L3_REQUIRED_MEMBER_COUNT,
        strictCompleteMemberCount,
        strictCompletion:
          strictCompleteMemberCount === G4_L3_REQUIRED_MEMBER_COUNT,
      }}
      runtimeAvailable
      stage={stage}
      stageOverlay={stageOverlay}
      status={<>
        <div>
          <p>
            {/* The shell renders this footer only in candidate mode, so the
                published-lesson wording it used to carry is unreachable. */}
            <strong>{spanish ? 'Estado del paquete:' : 'Package status:'}</strong>{' '}
            {spanish
              ? 'MVP JavaScript controlado; no es una declaración de fidelidad estricta ni de publicación pública.'
              : 'Controlled JavaScript MVP; this is not a strict-fidelity or public-release claim.'}
          </p>
          <p>{spanish
            ? 'El progreso es local. La fidelidad visual original, el audio, la revisión humana y la aceptación del propietario siguen siendo puertas independientes.'
            : 'Progress is local. Original visual fidelity, audio, human review, and owner acceptance remain independent gates.'}</p>
        </div>
        <button onClick={restartLesson} type="button">{spanish ? 'Reiniciar toda la lección' : 'Restart entire lesson'}</button>
      </>}
      totalPages={G4_L3_WHOLE_LESSON_PLAYER_DESCRIPTOR.course.activePageCount}
      visualSkin={G4_L3_LEGACY_VISUAL_SKIN}
      volume={volume}
    />
  </div>;
}
