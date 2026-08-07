'use client';

import {loadAnimationModule} from '@helpmath/demos/animation-registry';
import {useEffect, useMemo, useRef, useState} from 'react';

import {
  AnimationRuntime,
  INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE,
  type AnimationRuntimePlaybackState,
  type AnimationRuntimeSeekRequest,
} from '@/components/animation-runtime';
import type {LegacyCalculatorEvidence} from '@/components/legacy-calculator';
import {LegacyKeyTermsBrowser} from '@/components/legacy-key-terms-browser';
import {
  LegacyResponsiveLessonShell,
  type LegacyLessonShellVisualSkin,
  type LessonShellTool,
} from '@/components/legacy-responsive-lesson-shell';
import type {
  WholeLessonPlayerDescriptor,
  WholeLessonPlayerLocale,
} from '@/lib/whole-lesson-player-descriptor';
import {
  appendLegacyLessonHistory,
  takeLegacyLessonHistory,
} from '@/lib/legacy-shell-controls';
import {LEGACY_MAP_RAIL_MIN_WIDTH} from '@/lib/legacy-lesson-layout';
import {
  createInitialWholeLessonSessionProgress,
  parseWholeLessonSessionProgress,
  recordWholeLessonReplay,
  reviewWholeLessonPage,
  visitWholeLessonPage,
} from '@/lib/whole-lesson-session';

function visualSkin(
  descriptor: WholeLessonPlayerDescriptor,
): LegacyLessonShellVisualSkin {
  return Object.freeze({
    authoredStage: descriptor.stage,
    chromeAsset: descriptor.visualSkin.chromeAsset,
    chromeEvidence: descriptor.visualSkin.evidence.kind,
    chromeFooterHeight: descriptor.visualSkin.footer.height,
    chromeHeaderHeight: descriptor.visualSkin.header.height,
    controlAssets: descriptor.visualSkin.controls,
    backgroundCompanion: descriptor.visualSkin.backgroundCompanion,
    resumePrompt: descriptor.visualSkin.resumePrompt,
    exitPrompt: descriptor.visualSkin.exitPrompt,
    layoutId: descriptor.visualSkin.layoutId,
    sourceAnimationId: descriptor.visualSkin.evidence.sourceAnimationId,
    sourceSwfSha256: descriptor.visualSkin.evidence.sourceSwfSha256,
  });
}

function calculatorEvidence(
  descriptor: WholeLessonPlayerDescriptor,
): LegacyCalculatorEvidence {
  return Object.freeze({
    behaviorKind: 'ffdec-actionscript-static-candidate',
    sourceAnimationId: descriptor.visualSkin.evidence.sourceAnimationId,
    sourceSwfSha256: descriptor.visualSkin.evidence.sourceSwfSha256,
  });
}

export function DescriptorDrivenWholeLessonPlayer({
  candidateMode,
  descriptor,
  locale,
  releasePublished,
  strictCompleteMemberCount,
}: {
  candidateMode: boolean;
  descriptor: WholeLessonPlayerDescriptor;
  locale: WholeLessonPlayerLocale;
  releasePublished: boolean;
  strictCompleteMemberCount: number;
}) {
  const [progress, setProgress] = useState(() =>
    createInitialWholeLessonSessionProgress(descriptor, locale)
  );
  const [hydrated, setHydrated] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<LessonShellTool>(null);
  const [paused, setPaused] = useState(false);
  const [volume, setVolume] = useState(.8);
  const [playbackState, setPlaybackState] =
    useState<AnimationRuntimePlaybackState>(
      INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE,
    );
  const calculator = useMemo(
    () => calculatorEvidence(descriptor),
    [descriptor],
  );
  const [seekRequest, setSeekRequest] =
    useState<AnimationRuntimeSeekRequest | null>(null);
  const [runtimeEpoch, setRuntimeEpoch] = useState(0);
  const [navigationFocusEpoch, setNavigationFocusEpoch] = useState(0);
  const [tourFinished, setTourFinished] = useState(false);
  const initialPageFocusSkippedRef = useRef(false);
  const lessonPlayerRef = useRef<HTMLDivElement>(null);
  const pageHeadingRef = useRef<HTMLHeadingElement>(null);
  const seekRequestIdRef = useRef(0);
  const lessonNavigationHistoryRef = useRef<readonly string[]>([]);
  const currentPage = descriptor.pages.find(
    (page) => page.animationId === progress.currentAnimationId,
  ) ?? descriptor.pages[0]!;
  const currentIndex = currentPage.globalPageOrdinal - 1;
  const previousPage = descriptor.pages[currentIndex - 1] ?? null;
  const nextPage = descriptor.pages[currentIndex + 1] ?? null;
  const currentSection = descriptor.sections.find(
    (section) => section.code === currentPage.sectionCode,
  )!;
  const currentLabel = currentPage.labels[progress.locale];
  const currentRenderer = currentPage.rendererAvailability;
  const runtimeAvailable = currentRenderer.kind === 'registered';
  const reviewed = new Set(progress.reviewedAnimationIds);
  const visited = new Set(progress.visitedAnimationIds);
  const spanish = progress.locale === 'es';
  const registeredPages = descriptor.pages.filter(
    (page) => page.rendererAvailability.kind === 'registered',
  );
  const unavailablePageCount = descriptor.pages.length - registeredPages.length;
  const shellImplementation = descriptor.shellImplementation;
  const shellCurrentJsCandidate = Boolean(shellImplementation);
  const reviewedRegisteredCount = registeredPages.filter(
    (page) => reviewed.has(page.animationId),
  ).length;
  const completionPercent = registeredPages.length
    ? Math.round((reviewedRegisteredCount / registeredPages.length) * 100)
    : 0;
  const requiredMemberCount =
    descriptor.course.expectedReleaseMemberCount;
  const strictCompletion =
    strictCompleteMemberCount === requiredMemberCount;
  const currentJsCandidate =
    registeredPages.length === descriptor.course.activePageCount &&
    shellCurrentJsCandidate;
  const pagesBySection = useMemo(() => Object.fromEntries(
    descriptor.sections.map((section) => [
      section.code,
      descriptor.pages.filter((page) => page.sectionCode === section.code),
    ]),
  ), [descriptor]);
  const skin = useMemo(() => visualSkin(descriptor), [descriptor]);

  useEffect(() => {
    let active = true;
    let serialized: string | null = null;
    try {
      serialized = window.localStorage.getItem(
        descriptor.persistence.storageKey,
      );
    } catch {
      // Browser policy can block persistence; the in-memory audit session
      // remains navigable.
    }
    const storedProgress = parseWholeLessonSessionProgress(
      serialized,
      descriptor,
      locale,
    );
    queueMicrotask(() => {
      if (!active) return;
      setProgress(storedProgress);
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [descriptor, locale]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (window.innerWidth >= LEGACY_MAP_RAIL_MIN_WIDTH) setMapOpen(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        descriptor.persistence.storageKey,
        JSON.stringify(progress),
      );
    } catch {
      // Persistence is optional and cannot widen publication authority.
    }
  }, [descriptor.persistence.storageKey, hydrated, progress]);

  const nextModuleKey = nextPage?.rendererAvailability.kind === 'registered'
    ? nextPage.rendererAvailability.moduleKey
    : null;
  useEffect(() => {
    if (runtimeAvailable && nextModuleKey) {
      void loadAnimationModule(nextModuleKey);
    }
  }, [nextModuleKey, runtimeAvailable]);

  useEffect(() => {
    if (!hydrated) return;
    if (!initialPageFocusSkippedRef.current) {
      initialPageFocusSkippedRef.current = true;
      return;
    }
    pageHeadingRef.current?.focus();
  }, [currentPage.animationId, hydrated, navigationFocusEpoch]);

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
    setProgress((value) =>
      visitWholeLessonPage(value, descriptor, animationId)
    );
    setNavigationFocusEpoch((value) => value + 1);
    setRuntimeEpoch((value) => value + 1);
    setTourFinished(false);
    setMapOpen(false);
    setActiveTool(null);
    setPaused(false);
    setPlaybackState(INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE);
    setSeekRequest(null);
  };
  const selectPage = (animationId: string) => {
    navigateToPage(animationId, true);
  };

  const reviewCurrentPage = () => {
    if (!runtimeAvailable) return;
    setProgress((value) =>
      reviewWholeLessonPage(value, descriptor, currentPage.animationId)
    );
  };

  const advance = () => {
    if (!nextPage && tourFinished) return;
    if (nextPage) {
      lessonNavigationHistoryRef.current = appendLegacyLessonHistory(
        lessonNavigationHistoryRef.current,
        currentPage.animationId,
        nextPage.animationId,
      );
    }
    setProgress((value) => {
      const reviewedValue = runtimeAvailable
        ? reviewWholeLessonPage(
            value,
            descriptor,
            currentPage.animationId,
          )
        : value;
      return nextPage
        ? visitWholeLessonPage(
            reviewedValue,
            descriptor,
            nextPage.animationId,
          )
        : reviewedValue;
    });
    setRuntimeEpoch((value) => value + 1);
    setMapOpen(false);
    setActiveTool(null);
    setPaused(false);
    setPlaybackState(INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE);
    setSeekRequest(null);
    if (!nextPage) setTourFinished(true);
  };

  const replayCurrentPage = () => {
    if (!runtimeAvailable) return;
    setProgress((value) =>
      recordWholeLessonReplay(value, descriptor, currentPage.animationId)
    );
    setRuntimeEpoch((value) => value + 1);
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
    setPaused(false);
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

  const restartTour = () => {
    const confirmed = window.confirm(spanish
      ? '¿Reiniciar el recorrido y borrar el progreso guardado en este navegador?'
      : 'Restart the tour and clear progress saved in this browser?');
    if (!confirmed) return;
    setProgress(createInitialWholeLessonSessionProgress(
      descriptor,
      progress.locale,
    ));
    setRuntimeEpoch((value) => value + 1);
    setTourFinished(false);
    setMapOpen(false);
    setActiveTool(null);
    setPaused(false);
    setPlaybackState(INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE);
    setSeekRequest(null);
    lessonNavigationHistoryRef.current = [];
  };

  // The course map is the only section-level navigation. It already lists every
  // section with progress ticks, so the section heading itself jumps to the
  // section instead of a separate tab strip repeating the same names.
  const mapPanel = <div className="lesson-shell2__map-content">
    {descriptor.sections.map((section) => {
      const label = section.labels[progress.locale];
      const sectionPages = pagesBySection[section.code]!;
      const availableSectionPages = sectionPages.filter(
        (page) => page.rendererAvailability.kind === 'registered',
      );
      const sectionReviewed = availableSectionPages.length > 0 &&
        availableSectionPages.every((page) => reviewed.has(page.animationId));
      return <section key={section.code}>
        <h3>
          <button
            aria-current={section.code === currentSection.code
              ? 'step'
              : undefined}
            className="lesson-shell2__map-section-jump"
            data-complete={sectionReviewed ? 'true' : 'false'}
            data-section-code={section.code}
            onClick={() => selectPage(section.firstActiveAnimationId)}
            type="button"
          >
            <span aria-hidden="true">{sectionReviewed ? '✓' : section.order}</span>
            <span lang={label.sourceLanguage}>{label.text}</span>
          </button>
        </h3>
        <ol start={sectionPages[0]!.globalPageOrdinal}>
          {sectionPages.map((page) => {
            const pageLabel = page.labels[progress.locale];
            const available = page.rendererAvailability.kind === 'registered';
            return <li key={page.animationId}>
              <button
                aria-current={page.animationId === currentPage.animationId
                  ? 'step'
                  : undefined}
                data-animation-id={page.animationId}
                data-complete={reviewed.has(page.animationId) ? 'true' : 'false'}
                data-renderer-availability={available ? 'registered' : 'unavailable'}
                data-visited={visited.has(page.animationId) ? 'true' : 'false'}
                onClick={() => selectPage(page.animationId)}
                type="button"
              >
                <span>{available
                  ? (reviewed.has(page.animationId)
                      ? '✓'
                      : page.globalPageOrdinal)
                  : '—'}</span>
                <span lang={pageLabel.sourceLanguage}>
                  {pageLabel.text}
                  {!available
                    ? <small>{spanish ? ' · no disponible' : ' · unavailable'}</small>
                    : null}
                </span>
              </button>
            </li>;
          })}
        </ol>
      </section>;
    })}
  </div>;

  const vocabularyPages = pagesBySection.VB ?? [];
  const vocabularyPageList = <ol>
    {vocabularyPages.map((page) => {
      const label = page.labels[progress.locale];
      const available = page.rendererAvailability.kind === 'registered';
      return <li key={page.animationId}>
        <button onClick={() => selectPage(page.animationId)} type="button">
          <span>{available ? page.globalPageOrdinal : '—'}</span>
          <span lang={label.sourceLanguage}>
            {label.text}
            {!available
              ? <small>{spanish ? ' · no disponible' : ' · unavailable'}</small>
              : null}
          </span>
        </button>
      </li>;
    })}
  </ol>;
  const keyTermsPanel = shellImplementation
    ? <div
        className="lesson-shell2__key-terms"
        data-key-terms-shell-candidate="source-static-master-dependency"
      >
        <LegacyKeyTermsBrowser
          key={`${progress.locale}:${shellImplementation.sourceSwfSha256}`}
          locale={progress.locale}
          shellCandidate={shellImplementation}
        />
        <details>
          <summary>{spanish
            ? 'Ver las páginas de Palabras importantes de la lección'
            : 'View lesson Important Words pages'}</summary>
          <p>{spanish
            ? 'Estas páginas de Palabras importantes conservan el orden exacto del XML y siguen separadas del glosario maestro candidato.'
            : 'These Important Words pages preserve exact XML order and remain separate from the master glossary candidate.'}</p>
          {vocabularyPageList}
        </details>
      </div>
    : <div className="lesson-shell2__key-terms">
        <p>{spanish
          ? 'Estas páginas de Palabras importantes conservan el orden exacto del XML. No son el glosario Key Terms declarado por la lección.'
          : 'These Important Words pages preserve exact XML order. They are not the lesson-declared Key Terms glossary.'}</p>
        {vocabularyPageList}
        <small>{spanish
          ? 'L4KTE01.xml y L4KTS01.xml faltan; no se carga ni se inventa un sustituto.'
          : 'L4KTE01.xml and L4KTS01.xml are missing; no substitute is loaded or invented.'}</small>
      </div>;

  const sectionLabel = currentSection.labels[progress.locale];
  const pageHeading = <div>
    <p lang={sectionLabel.sourceLanguage}>{sectionLabel.text}</p>
    <h1
      lang={currentLabel.sourceLanguage}
      ref={pageHeadingRef}
      tabIndex={-1}
    >
      {currentLabel.text}
    </h1>
    {currentLabel.usesEnglishFallback
      ? <p lang="es">La fuente no proporciona un título en español; se conserva el título original en inglés.</p>
      : null}
    {spanish &&
      currentRenderer.kind === 'registered' &&
      currentRenderer.runtimeQuery?.language === 'fixed-en'
      ? <p lang="es">{currentLabel.usesEnglishFallback
        ? 'El candidato visual current-JS permanece limitado al contenido fuente en inglés.'
        : 'El título en español procede del XML; el candidato visual current-JS permanece limitado al contenido fuente en inglés.'}</p>
      : null}
  </div>;

  const runtimeLanguage =
    currentRenderer.kind === 'registered' &&
    currentRenderer.runtimeQuery?.language === 'fixed-en'
      ? 'en'
      : progress.locale;
  const pageInteractionCompanionTargetId =
    currentPage.presentation?.pageInteractionCompanionTargetIdSuffix
      ? `${descriptor.course.domIdPrefix}-${currentPage.presentation.pageInteractionCompanionTargetIdSuffix}`
      : undefined;
  const stage = currentRenderer.kind === 'registered'
    ? <AnimationRuntime
        animationId={currentPage.animationId}
        key={`${currentPage.animationId}:${runtimeEpoch}`}
        labels={{
          replay: spanish ? 'Repetir' : 'Replay',
          reduced: spanish
            ? 'El movimiento está reducido según la preferencia del dispositivo.'
            : 'Motion is reduced to match this device preference.',
          prototype: spanish ? 'Candidato current-JS' : 'Current-JS candidate',
          unavailable: spanish
            ? 'Este módulo no está disponible.'
            : 'This lesson module is unavailable.',
          loading: spanish ? 'Cargando página…' : 'Loading page…',
        }}
        loadedSwfHostAsset={currentPage.source.xmlBackgroundText
          ? descriptor.visualSkin.backgroundCompanion?.loadedSwfHostAsset
          : undefined}
        moduleKey={currentRenderer.moduleKey}
        onPlaybackStateChange={setPlaybackState}
        onReplay={() => setProgress((value) =>
          recordWholeLessonReplay(
            value,
            descriptor,
            currentPage.animationId,
          )
        )}
        paused={paused}
        pageInteractionCompanionTargetId={pageInteractionCompanionTargetId}
        presentation="legacy-shell"
        query={{
          frameDomain: currentRenderer.runtimeQuery?.frameDomain,
          lang: runtimeLanguage,
          scenario: currentRenderer.runtimeQuery?.scenario,
          seed: currentRenderer.runtimeQuery?.seed ?? '0',
        }}
        seekRequest={seekRequest}
        uiLanguage={progress.locale}
        volume={volume}
      />
    : <section
        aria-labelledby={`${descriptor.course.domIdPrefix}-unavailable-title`}
        className="lesson-shell2__unavailable-page"
        data-animation-id={currentPage.animationId}
        data-renderer-availability="unavailable"
      >
        <div>
          <span aria-hidden="true">{currentPage.globalPageOrdinal}</span>
          <h2 id={`${descriptor.course.domIdPrefix}-unavailable-title`}>
            {spanish
              ? 'Página conservada; current-JS aún no disponible'
              : 'Page preserved; current-JS not yet available'}
          </h2>
          <p>{spanish
            ? 'Esta posición permanece en el orden exacto del XML, pero no se carga ni se simula un renderer.'
            : 'This position remains in exact XML order, but no renderer is loaded or simulated.'}</p>
          <code>{currentPage.animationId}</code>
        </div>
      </section>;

  const helpPanel = <div className="lesson-shell2__help">
    <p>{spanish
      ? `Usa Anterior y Siguiente para recorrer las ${descriptor.pages.length} posiciones del XML. ${registeredPages.length} tienen módulos current-JS; ${unavailablePageCount} permanecen explícitamente no disponibles.`
      : `Use Previous and Next to traverse all ${descriptor.pages.length} XML positions. ${registeredPages.length} have current-JS modules; ${unavailablePageCount} remain explicitly unavailable.`}</p>
    <p>{spanish
      ? 'Solo una página con renderer registrado puede marcarse como revisada. El progreso local no modifica la admisión estricta.'
      : 'Only a page with a registered renderer can be marked reviewed. Local progress never changes strict admission.'}</p>
    <p>{spanish
      ? 'La ayuda moderna no ejecuta vínculos heredados.'
      : 'Modern help does not execute legacy links.'}</p>
  </div>;

  return <div
    data-current-animation-id={currentPage.animationId}
    data-current-page={currentPage.globalPageOrdinal}
    data-hydrated={hydrated ? 'true' : 'false'}
    data-lesson-player="descriptor-driven-whole-lesson-audit"
    data-progress-kind="learner-session"
    data-progress-storage="local-device-only"
    data-renderer-availability={currentRenderer.kind}
    data-shell-actionscript-executed={shellImplementation ? 'false' : undefined}
    data-shell-current-js-candidate={shellCurrentJsCandidate
      ? 'true'
      : 'false'}
    data-shell-runtime-parity="not-established"
    data-unavailable-pages={unavailablePageCount}
    ref={lessonPlayerRef}
  >
    <LegacyResponsiveLessonShell
      activeTool={activeTool}
      audioAvailable={playbackState.audioAvailable}
      backgroundCompanionVisible={
        currentPage.source.xmlBackgroundText === true
      }
      calculatorEvidence={calculator}
      candidateMode={candidateMode}
      completionAction={<button
        aria-pressed={runtimeAvailable
          ? reviewed.has(currentPage.animationId)
          : undefined}
        disabled={!runtimeAvailable}
        onClick={reviewCurrentPage}
        type="button"
      >
        {!runtimeAvailable
          ? (spanish ? 'current-JS no disponible' : 'current-JS unavailable')
          : reviewed.has(currentPage.animationId)
            ? (spanish ? '✓ Página revisada' : '✓ Page reviewed')
            : (spanish ? 'Marcar como revisada' : 'Mark reviewed')}
      </button>}
      completionLabel={spanish
        ? `${reviewedRegisteredCount} de ${registeredPages.length} páginas current-JS revisadas · ${unavailablePageCount} no disponibles`
        : `${reviewedRegisteredCount} of ${registeredPages.length} current-JS pages reviewed · ${unavailablePageCount} unavailable`}
      completionPercent={completionPercent}
      courseContext={{
        courseTitle: descriptor.course.labels[progress.locale],
        pageTitle: currentLabel,
        section: {
          title: sectionLabel,
        },
      }}
      courseHref={descriptor.course.href}
      currentAnimationId={currentPage.animationId}
      currentPage={currentPage.globalPageOrdinal}
      disclosure={<section
        aria-label={spanish ? 'Límite de evidencia' : 'Evidence boundary'}
        className="lesson-shell2__audit-boundary"
      >
        <strong>{spanish ? 'Vista local de auditoría' : 'Local audit view'}</strong>
        <span>{spanish
          ? `${registeredPages.length}/${descriptor.pages.length} páginas current-JS más ${shellCurrentJsCandidate ? 'un candidato funcional estático del shell' : 'ningún candidato del shell'}; ${strictCompleteMemberCount}/${requiredMemberCount} miembros estrictos; no publicada.`
          : `${registeredPages.length}/${descriptor.pages.length} current-JS pages plus ${shellCurrentJsCandidate ? 'one source-static functional shell candidate' : 'no shell candidate'}; ${strictCompleteMemberCount}/${requiredMemberCount} strict members; unpublished.`}</span>
      </section>}
      finishedNotice={tourFinished
        ? <section aria-live="polite" className="lesson-shell2__finished">
            <span aria-hidden="true">★</span>
            <div>
              <h2>{spanish
                ? 'Recorrido XML finalizado'
                : 'XML tour finished'}</h2>
              <p>{spanish
                ? `Revisaste ${reviewedRegisteredCount} de ${registeredPages.length} páginas disponibles. Las ${unavailablePageCount} páginas pendientes no se cuentan como revisadas.`
                : `You reviewed ${reviewedRegisteredCount} of ${registeredPages.length} available pages. The ${unavailablePageCount} pending pages are not counted as reviewed.`}</p>
            </div>
          </section>
        : undefined}
      gradeLessonLabel={spanish
        ? `Grado ${descriptor.course.grade} · Lección ${descriptor.course.lesson}`
        : `Grade ${descriptor.course.grade} · Lesson ${descriptor.course.lesson}`}
      helpPanel={helpPanel}
      idPrefix={descriptor.course.domIdPrefix}
      keyTermsPanel={keyTermsPanel}
      locale={progress.locale}
      mapOpen={mapOpen}
      mapPanel={mapPanel}
      nextControlLabel={tourFinished
        ? (spanish ? 'Recorrido finalizado' : 'Lesson tour finished')
        : nextPage
          ? (spanish ? 'Página siguiente' : 'Next page')
          : (spanish ? 'Terminar recorrido' : 'Finish tour')}
      nextDisabled={!nextPage && tourFinished}
      nextLabel={tourFinished
        ? (spanish ? 'Recorrido finalizado ✓' : 'Lesson tour finished ✓')
        : nextPage
          ? runtimeAvailable
            ? (spanish ? 'Revisada y siguiente →' : 'Reviewed & next →')
            : (spanish ? 'Siguiente página →' : 'Next page →')
          : runtimeAvailable
            ? (spanish ? 'Revisar y terminar ✓' : 'Review & finish ✓')
            : (spanish ? 'Terminar recorrido ✓' : 'Finish tour ✓')}
      onMapOpenChange={setMapOpen}
      onHeaderBack={returnToPreviousLocation}
      onExit={exitToLibrary}
      onNext={advance}
      onPausedChange={setPaused}
      onPlaybackResumeFromInspection={resumeFromInspectedFrame}
      onPlaybackSeek={inspectFrame}
      onPrevious={() =>
        previousPage && selectPage(previousPage.animationId)}
      onReplay={replayCurrentPage}
      onToolChange={setActiveTool}
      onVolumeChange={setVolume}
      pageInteractionCompanionTargetId={pageInteractionCompanionTargetId}
      pageHeading={pageHeading}
      paused={paused}
      playbackFrame={playbackState.frame}
      playbackFrameCount={playbackState.frameCount}
      playbackFrameDomain={playbackState.frameDomain}
      playbackInspectionActive={seekRequest !== null}
      playbackSeekAvailable={playbackState.seekAvailable}
      playbackStepFrames={playbackState.stepFrames}
      playbackTransportMode={playbackState.transportMode}
      previousDisabled={!previousPage}
      releaseBoundary={{
        currentJsCandidate,
        currentJsPageCount: registeredPages.length,
        publicRelease: releasePublished && strictCompletion,
        releaseId: descriptor.releaseId,
        requiredMemberCount,
        strictCompleteMemberCount,
        strictCompletion,
      }}
      runtimeAvailable={runtimeAvailable}
      stage={stage}
      status={<>
        <div>
          <p>
            <strong>{spanish
              ? 'Estado del paquete:'
              : 'Package status:'}</strong>{' '}
            {spanish
              ? `Interfaz funcional de auditoría con las ${descriptor.course.activePageCount} páginas registradas y el shell JavaScript; no es una declaración de fidelidad estricta ni de publicación.`
              : `Functional audit interface with all ${descriptor.course.activePageCount} registered pages and the JavaScript shell; this is not a strict-fidelity or publication claim.`}
          </p>
          <p>{spanish
            ? 'La fidelidad de ejecución original, el audio, la comparación visual, la revisión humana y la aceptación del propietario siguen siendo puertas independientes.'
            : 'Original-runtime fidelity, audio, visual comparison, human review, and owner acceptance remain independent gates.'}</p>
        </div>
        <button onClick={restartTour} type="button">{spanish
          ? 'Reiniciar recorrido'
          : 'Restart tour'}</button>
      </>}
      totalPages={descriptor.course.activePageCount}
      visualSkin={skin}
      volume={volume}
    />
  </div>;
}
