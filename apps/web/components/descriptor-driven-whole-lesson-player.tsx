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
  type AnimationRuntimeNarrationRequest,
  type AnimationRuntimePlaybackState,
  type AnimationRuntimeSeekRequest,
} from '@/components/animation-runtime';
import type {LegacyCalculatorEvidence} from '@/components/legacy-calculator';
import {LegacyKeyTermsBrowser} from '@/components/legacy-key-terms-browser';
import {
  LegacyResponsiveLessonShell,
  type LegacyLessonShellVisualSkin,
  type LessonShellSection,
  type LessonShellTool,
} from '@/components/legacy-responsive-lesson-shell';
import type {WholeLessonHostPresentation} from '@/lib/whole-lesson-host-presentation';
import {
  resolveWholeLessonRuntimeSeed,
  type DescriptorDrivenLessonPlayerDescriptor,
  type WholeLessonPlayerLocale,
} from '@/lib/whole-lesson-player-descriptor';
import {
  appendLegacyLessonHistory,
  takeLegacyLessonHistory,
} from '@/lib/legacy-shell-controls';
import {LEGACY_MAP_RAIL_MIN_WIDTH} from '@/lib/legacy-lesson-layout';
import type {PublicAuthStatus} from '@/lib/auth-session';
import {
  tutorPageContext,
  type NovaTutorMode,
} from '@/lib/tutor-integration';
import {
  createInitialWholeLessonSessionProgress,
  parseWholeLessonSessionProgress,
  recordWholeLessonReplay,
  reviewWholeLessonPage,
  visitWholeLessonPage,
} from '@/lib/whole-lesson-session';

function visualSkin(
  descriptor: DescriptorDrivenLessonPlayerDescriptor,
  presentation: WholeLessonHostPresentation,
): LegacyLessonShellVisualSkin {
  if (descriptor.schemaVersion === 2) {
    return Object.freeze({
      authoredStage: descriptor.stage,
      presentation: 'modern-wide',
      chromeAsset: '',
      chromeEvidence: descriptor.visualSkin.evidence.kind,
      chromeFooterHeight: 0,
      chromeHeaderHeight: 0,
      controlAssets: descriptor.visualSkin.controls,
      layoutId: descriptor.visualSkin.layoutId,
    });
  }
  return Object.freeze({
    authoredStage: descriptor.stage,
    presentation,
    chromeAsset: descriptor.visualSkin.chromeAsset,
    chromeEvidence: descriptor.visualSkin.evidence.kind,
    chromeFooterHeight: descriptor.visualSkin.footer.height,
    chromeHeaderHeight: descriptor.visualSkin.header.height,
    chromeTitleBand: descriptor.visualSkin.header.title,
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
  descriptor: DescriptorDrivenLessonPlayerDescriptor,
): LegacyCalculatorEvidence {
  if (descriptor.schemaVersion === 2) {
    return Object.freeze({behaviorKind: 'modern-support-only'});
  }
  return Object.freeze({
    behaviorKind: 'ffdec-actionscript-static-candidate',
    sourceAnimationId: descriptor.visualSkin.evidence.sourceAnimationId,
    sourceSwfSha256: descriptor.visualSkin.evidence.sourceSwfSha256,
  });
}

export function DescriptorDrivenWholeLessonPlayer({
  audioEnabled = false,
  authStatus = 'disabled',
  candidateMode,
  descriptor,
  hostPresentation = 'legacy-composite',
  locale,
  novaTutorMode = 'focus',
  releasePublished,
  reviewerMode = false,
  strictCompleteMemberCount,
}: {
  audioEnabled?: boolean;
  authStatus?: PublicAuthStatus;
  candidateMode: boolean;
  descriptor: DescriptorDrivenLessonPlayerDescriptor;
  hostPresentation?: WholeLessonHostPresentation;
  locale: WholeLessonPlayerLocale;
  novaTutorMode?: NovaTutorMode;
  releasePublished: boolean;
  reviewerMode?: boolean;
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
  const [narrationRequest, setNarrationRequest] =
    useState<AnimationRuntimeNarrationRequest | null>(null);
  const [runtimeEpoch, setRuntimeEpoch] = useState(0);
  const [navigationFocusEpoch, setNavigationFocusEpoch] = useState(0);
  const [tourFinished, setTourFinished] = useState(false);
  const initialPageFocusSkippedRef = useRef(false);
  const pendingScrubberFocusRef = useRef<
    'section-scrubber' | null
  >(null);
  const lessonPlayerRef = useRef<HTMLDivElement>(null);
  const pageHeadingRef = useRef<HTMLHeadingElement>(null);
  const seekRequestIdRef = useRef(0);
  const narrationRequestIdRef = useRef(0);
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
  const currentRuntimeSeed = resolveWholeLessonRuntimeSeed(
    currentRenderer,
    progress.replayCounts[currentPage.animationId] ?? 0,
  );
  const lessonHost = useMemo(() => createMemoryOnlyLessonHost({
    releaseId: descriptor.releaseId,
    releaseMemberIds: [...new Set(
      descriptor.pages.map((page) => page.animationId),
    )],
    currentAnimationId: currentPage.animationId,
    enabledCapabilities: descriptor.schemaVersion === 2
      ? descriptor.support.lessonHostCapabilities.filter(
          (capability) => capability !== 'audio' || audioEnabled,
        )
      : audioEnabled ? ['audio'] : [],
    initialLanguage: progress.locale,
    mode: 'audit',
    releasePublished: false,
  }), [audioEnabled, currentPage.animationId, descriptor, progress.locale]);
  const [, setLessonHostRevision] = useState(0);
  const lessonHostState = lessonHost.snapshot();
  const handleLessonHostRequest = useCallback((
    request: LessonHostRequest,
  ): LessonHostDecision => {
    const decision = lessonHost.dispatch(request);
    setLessonHostRevision((revision) => revision + 1);
    if (decision.status === 'allowed') {
      if (request.type === 'open-glossary') setPaused(true);
      if (request.type === 'close-glossary') setPaused(false);
    }
    return decision;
  }, [lessonHost]);
  const closeGlossary = useCallback(() => {
    handleLessonHostRequest({type: 'close-glossary'});
  }, [handleLessonHostRequest]);
  const reviewed = new Set(progress.reviewedAnimationIds);
  const visited = new Set(progress.visitedAnimationIds);
  const spanish = progress.locale === 'es';
  const activeGlossaryEntry = descriptor.schemaVersion === 2
    ? descriptor.glossary.find(
        (entry) => entry.id === lessonHostState.glossaryEntryId,
      ) ?? null
    : null;
  const registeredPages = descriptor.pages.filter(
    (page) => page.rendererAvailability.kind === 'registered',
  );
  const unavailablePageCount = descriptor.pages.length - registeredPages.length;
  const shellImplementation = descriptor.schemaVersion === 1
    ? descriptor.shellImplementation
    : undefined;
  const shellCurrentJsCandidate = Boolean(shellImplementation);
  const reviewedRegisteredCount = registeredPages.filter(
    (page) => reviewed.has(page.animationId),
  ).length;
  const completionPercent = registeredPages.length
    ? Math.round((reviewedRegisteredCount / registeredPages.length) * 100)
    : 0;
  const requiredMemberCount =
    descriptor.course.expectedReleaseMemberCount;
  const strictCompletion = descriptor.schemaVersion === 1 &&
    strictCompleteMemberCount === requiredMemberCount;
  const currentJsCandidate =
    registeredPages.length === descriptor.course.activePageCount &&
    (descriptor.schemaVersion === 2 || shellCurrentJsCandidate);
  const pagesBySection = useMemo(() => Object.fromEntries(
    descriptor.sections.map((section) => [
      section.code,
      descriptor.pages.filter((page) => page.sectionCode === section.code),
    ]),
  ), [descriptor]);
  const currentSectionPages = pagesBySection[currentSection.code] ?? [];
  const currentSectionPageOrdinal = Math.max(
    1,
    currentSectionPages.findIndex(
      (page) => page.animationId === currentPage.animationId,
    ) + 1,
  );
  const skin = useMemo(
    () => visualSkin(descriptor, hostPresentation),
    [descriptor, hostPresentation],
  );

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
    // See the G4 L3 player: a permanent section spine makes an auto-opened
    // course map a duplicate that covers it.
    if (hostPresentation === 'modern-wide') return;
    const frame = window.requestAnimationFrame(() => {
      if (window.innerWidth >= LEGACY_MAP_RAIL_MIN_WIDTH) setMapOpen(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hostPresentation]);

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
    if (pendingScrubberFocusRef.current) {
      const focusKey = pendingScrubberFocusRef.current;
      pendingScrubberFocusRef.current = null;
      const frame = window.requestAnimationFrame(() => {
        lessonPlayerRef.current
          ?.querySelector<HTMLInputElement>(
            `[data-responsive-focus-key="${focusKey}"]`,
          )
          ?.focus({preventScroll: true});
      });
      return () => window.cancelAnimationFrame(frame);
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
    setNarrationRequest(null);
  };
  const selectPage = (animationId: string) => {
    navigateToPage(animationId, true);
  };
  const selectSectionPageOrdinal = (sectionPageOrdinal: number) => {
    const destination = currentSectionPages[sectionPageOrdinal - 1];
    if (!destination || destination.animationId === currentPage.animationId) {
      return;
    }
    pendingScrubberFocusRef.current = 'section-scrubber';
    selectPage(destination.animationId);
  };

  // A page counts as reviewed when its current-JS animation has actually
  // played through. A position without a registered renderer has nothing to
  // play and therefore can never be counted.
  const reviewCurrentPage = () => {
    setProgress((value) =>
      reviewWholeLessonPage(value, descriptor, currentPage.animationId)
    );
  };

  // Next only moves. Stepping past a page never records it as reviewed.
  const advance = () => {
    if (!nextPage && tourFinished) return;
    if (nextPage) {
      lessonNavigationHistoryRef.current = appendLegacyLessonHistory(
        lessonNavigationHistoryRef.current,
        currentPage.animationId,
        nextPage.animationId,
      );
      setProgress((value) =>
        visitWholeLessonPage(value, descriptor, nextPage.animationId)
      );
    }
    setRuntimeEpoch((value) => value + 1);
    setMapOpen(false);
    setActiveTool(null);
    setPaused(false);
    setPlaybackState(INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE);
    setSeekRequest(null);
    setNarrationRequest(null);
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
    setNarrationRequest(null);
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

  const toggleNarration = () => {
    narrationRequestIdRef.current += 1;
    setNarrationRequest({
      action: playbackState.narration === 'playing' ? 'stop' : 'play',
      requestId: narrationRequestIdRef.current,
    });
  };

  const learningHomeHref = spanish ? '/es' : '/';
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
    window.location.assign(learningHomeHref);
  };
  const exitToLearningHome = () => window.location.assign(learningHomeHref);

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
    setNarrationRequest(null);
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
  const keyTermsPanel = descriptor.schemaVersion === 2
    ? <div
        className="lesson-shell2__key-terms"
        data-key-terms-authority="canonical-grade-four-master-xml"
      >
        <p>{spanish
          ? 'Este puente privado usa únicamente las tres definiciones bilingües exactas solicitadas por VB003.'
          : 'This private bridge uses only the three exact bilingual definitions requested by VB003.'}</p>
        <dl>
          {descriptor.glossary.map((entry) => <div key={entry.id}>
            <dt>{entry.labels[progress.locale]}</dt>
            <dd>{entry.definitions[progress.locale]}</dd>
          </div>)}
        </dl>
        <small>{spanish
          ? 'Fuente ligada por SHA-256: ELKTSG4.xml.'
          : 'Source bound by SHA-256: ELKTEG4.xml.'}</small>
        <details>
          <summary>{spanish
            ? 'Ver las páginas de Palabras importantes de la lección'
            : 'View lesson Important Words pages'}</summary>
          {vocabularyPageList}
        </details>
      </div>
    : shellImplementation
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
        audioEnabled={audioEnabled}
        audioLanguage={progress.locale}
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
        loadedSwfHostAsset={descriptor.schemaVersion === 1 &&
          currentPage.source.xmlBackgroundText
          ? descriptor.visualSkin.backgroundCompanion?.loadedSwfHostAsset
          : undefined}
        moduleKey={currentRenderer.moduleKey}
        narrationRequest={narrationRequest}
        onLessonHostRequest={handleLessonHostRequest}
        onPlaybackComplete={reviewCurrentPage}
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
          seed: currentRuntimeSeed,
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

  const glossaryOverlay = activeGlossaryEntry
    ? <section
        aria-labelledby={`${descriptor.course.domIdPrefix}-glossary-title`}
        aria-modal="true"
        className="lesson-shell2__page-only-glossary"
        data-glossary-entry-id={activeGlossaryEntry.id}
        data-glossary-storage="memory-only"
        data-source-key-attribute={activeGlossaryEntry.sourceKeyAttribute}
        data-source-sha256={activeGlossaryEntry.source[progress.locale].sha256}
        role="dialog"
      >
        <div>
          <p>{spanish ? 'Glosario' : 'Glossary'}</p>
          <h2 id={`${descriptor.course.domIdPrefix}-glossary-title`}>
            {activeGlossaryEntry.labels[progress.locale]}
          </h2>
          <p>{activeGlossaryEntry.definitions[progress.locale]}</p>
          <button autoFocus onClick={closeGlossary} type="button">
            {spanish ? 'Cerrar y continuar' : 'Close and continue'}
          </button>
        </div>
      </section>
    : undefined;

  const helpPanel = <div className="lesson-shell2__help">
    <p>{spanish
      ? 'Usa Anterior y Siguiente para recorrer esta lección.'
      : 'Use Previous and Next to move through this lesson.'}</p>
    <p>{spanish
      ? 'Una página se completa cuando termina su animación. Tu progreso permanece guardado en este dispositivo.'
      : 'A page completes when its animation finishes. Your progress stays saved on this device.'}</p>
    <p>{spanish
      ? 'La ayuda moderna no ejecuta vínculos heredados.'
      : 'Modern help does not execute legacy links.'}</p>
  </div>;

  // The shared modern lesson shell owns the learner-facing section spine.
  // Descriptor-driven lessons already carry the exact section sequence, so
  // adapt that data here instead of teaching the shell about a specific
  // grade, lesson, or animation id.
  const shellSections: LessonShellSection[] = descriptor.sections.map(
    (section) => {
      const sectionPages = pagesBySection[section.code] ?? [];
      const allReviewed = sectionPages.length > 0 && sectionPages.every(
        (page) => reviewed.has(page.animationId),
      );
      return {
        code: section.code,
        title: section.labels[progress.locale].text,
        state: section.code === currentSection.code
          ? 'current'
          : allReviewed
            ? 'complete'
            : 'upcoming',
        onSelect: () => navigateToPage(
          section.firstActiveAnimationId,
          true,
        ),
      };
    },
  );
  const tutorContext = tutorPageContext({
    releaseId: descriptor.releaseId,
    grade: descriptor.course.grade,
    lesson: descriptor.course.lesson,
    animationId: currentPage.animationId,
    sectionCode: currentPage.sectionCode,
    sectionTitle: sectionLabel.text,
    globalPageOrdinal: currentPage.globalPageOrdinal,
    activePageCount: descriptor.course.activePageCount,
    pageTitle: currentLabel.text,
    pageTitleEnglish: currentPage.labels.en.text,
    pageTitleSpanish: currentPage.labels.es.usesEnglishFallback
      ? null
      : currentPage.labels.es.text,
    locale: progress.locale,
    pageTitleUsesEnglishFallback: currentLabel.usesEnglishFallback,
  });

  return <div
    data-current-animation-id={currentPage.animationId}
    data-current-page={currentPage.globalPageOrdinal}
    data-hydrated={hydrated ? 'true' : 'false'}
    data-lesson-player={descriptor.schemaVersion === 2
      ? 'descriptor-driven-page-only-product-bridge'
      : 'descriptor-driven-whole-lesson-audit'}
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
      authStatus={authStatus}
      backgroundCompanionVisible={
        currentPage.source.xmlBackgroundText === true
      }
      calculatorEvidence={calculator}
      candidateMode={candidateMode}
      reviewerMode={reviewerMode}
      completionLabel={spanish
        ? `${reviewedRegisteredCount} de ${registeredPages.length} páginas completadas`
        : `${reviewedRegisteredCount} of ${registeredPages.length} pages complete`}
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
      disclosure={reviewerMode
        ? <section
            aria-label={spanish ? 'Límite de evidencia' : 'Evidence boundary'}
            className="lesson-shell2__audit-boundary"
          >
            <strong>{spanish ? 'Vista local de auditoría' : 'Local audit view'}</strong>
            <span>{spanish
              ? `${registeredPages.length}/${descriptor.pages.length} páginas current-JS; los contratos históricos del shell y de admisión estricta permanecen disponibles solo para revisión interna.`
              : `${registeredPages.length}/${descriptor.pages.length} current-JS pages; historical shell and strict-admission contracts remain available for internal review only.`}</span>
          </section>
        : undefined}
      finishedNotice={tourFinished
        ? <section aria-live="polite" className="lesson-shell2__finished">
            <span aria-hidden="true">★</span>
            <div>
              <h2>{spanish
                ? 'Lección completada'
                : 'Lesson complete'}</h2>
              <p>{spanish
                ? `Completaste ${reviewedRegisteredCount} de ${registeredPages.length} páginas.`
                : `You completed ${reviewedRegisteredCount} of ${registeredPages.length} pages.`}</p>
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
      narrationStatus={playbackState.narration}
      novaTutorMode={novaTutorMode}
      sections={shellSections}
      sectionProgress={{
        code: currentSection.code,
        currentPage: currentSectionPageOrdinal,
        label: currentSection.labels[progress.locale].text,
        onPageSelect: selectSectionPageOrdinal,
        totalPages: currentSectionPages.length,
      }}
      nextControlLabel={tourFinished
        ? (spanish ? 'Lección completada' : 'Lesson complete')
        : nextPage
          ? (spanish ? 'Página siguiente' : 'Next page')
          : (spanish ? 'Terminar recorrido' : 'Finish tour')}
      nextDisabled={!nextPage && tourFinished}
      nextLabel={tourFinished
        ? (spanish ? 'Lección completada ✓' : 'Lesson complete ✓')
        : nextPage
          ? (spanish ? 'Siguiente →' : 'Next →')
          : (spanish ? 'Terminar recorrido ✓' : 'Finish tour ✓')}
      onMapOpenChange={setMapOpen}
      onNarrationToggle={toggleNarration}
      onHeaderBack={returnToPreviousLocation}
      onExit={exitToLearningHome}
      onNext={advance}
      onPausedChange={setPaused}
      onPlaybackResumeFromInspection={resumeFromInspectedFrame}
      onPlaybackSeek={inspectFrame}
      onPrevious={() =>
        previousPage && selectPage(previousPage.animationId)}
      onReplay={replayCurrentPage}
      onStageOverlayControlIntent={activeGlossaryEntry
        ? closeGlossary
        : undefined}
      onToolChange={setActiveTool}
      onVolumeChange={setVolume}
      pageComplete={runtimeAvailable && reviewed.has(currentPage.animationId)}
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
      stageOverlay={glossaryOverlay}
      stageOverlayControlsEnabled={Boolean(activeGlossaryEntry)}
      status={<>
        <div>
          <p>
            <strong>{spanish
              ? 'Estado del paquete:'
              : 'Package status:'}</strong>{' '}
            {descriptor.schemaVersion === 2
              ? spanish
                ? `Puente privado page-only: ${registeredPages.length}/${descriptor.course.activePageCount} páginas registradas en el host moderno My Lesson; no es una declaración de fidelidad estricta ni de publicación.`
                : `Private page-only bridge: ${registeredPages.length}/${descriptor.course.activePageCount} pages registered in the modern My Lesson host; this is not a strict-fidelity or publication claim.`
              : spanish
                ? `Interfaz funcional de auditoría con ${registeredPages.length}/${descriptor.course.activePageCount} páginas registradas y el candidato de shell JavaScript; no es una declaración de fidelidad estricta ni de publicación.`
                : `Functional audit interface with ${registeredPages.length}/${descriptor.course.activePageCount} registered pages and the JavaScript shell candidate; this is not a strict-fidelity or publication claim.`}
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
      tutorContext={tutorContext}
      visualSkin={skin}
      volume={volume}
    />
  </div>;
}
