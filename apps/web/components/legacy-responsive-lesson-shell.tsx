'use client';

import type {CSSProperties, ReactNode} from 'react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import {
  LegacyCalculator,
  type LegacyCalculatorEvidence,
} from '@/components/legacy-calculator';
import {LegacyExitPrompt} from '@/components/legacy-exit-prompt';
import {Link} from '@/i18n/navigation';
import {
  rememberLegacyAudibleVolume,
  toggleLegacyMute,
} from '@/lib/legacy-shell-controls';
import {
  LEGACY_LESSON_LAYOUT_CONTRACT,
  resolveLegacyLessonLayout,
  type LegacyLessonLayoutPolicy,
} from '@/lib/legacy-lesson-layout';
import type {
  WholeLessonBackgroundCompanion,
  WholeLessonControlAssets,
  WholeLessonExitPromptVisualEvidence,
  WholeLessonResumePromptVisualEvidence,
} from '@/lib/whole-lesson-player-descriptor';

export type LessonShellTool = 'help' | 'key-terms' | 'calculator' | null;

const WIDE_FUNCTIONAL_COMPANION_MEDIA = '(min-width: 1280px)';
const COARSE_POINTER_MEDIA = '(any-pointer: coarse)';
const LANGUAGE_ROUTE_FOCUS_INTENT_KEY =
  'help-math:lesson-language-route-focus-v1';
const LANGUAGE_ROUTE_TOOL_INTENT_PREFIX = 'tool:';

type ResponsiveFocusSurface = 'legacy' | 'modern-wide' | 'persistent';

interface ResponsiveFocusMemory {
  readonly key: string;
  readonly surface: ResponsiveFocusSurface;
}

export interface LegacyLessonShellVisualSkin {
  authoredStage: Readonly<{
    height: number;
    width: number;
  }>;
  chromeAsset: string;
  chromeEvidence: 'ffdec-static-structural-candidate' | 'original-runtime-accepted';
  chromeFooterHeight: number;
  chromeHeaderHeight: number;
  controlAssets: WholeLessonControlAssets;
  backgroundCompanion?: WholeLessonBackgroundCompanion;
  exitPrompt?: WholeLessonExitPromptVisualEvidence;
  resumePrompt?: WholeLessonResumePromptVisualEvidence;
  layoutId: 'help-math-course-shell-800x600-v1';
  sourceAnimationId: string;
  sourceSwfSha256: string;
}

export interface LessonShellReleaseBoundary {
  currentJsCandidate: boolean;
  currentJsPageCount: number;
  publicRelease: boolean;
  releaseId: string;
  requiredMemberCount: number;
  strictCompleteMemberCount: number;
  strictCompletion: boolean;
}

export interface LessonShellContextLabel {
  readonly sourceLanguage: 'en' | 'es';
  readonly text: string;
}

export interface LessonShellCourseContext {
  readonly courseTitle: LessonShellContextLabel;
  readonly pageTitle: LessonShellContextLabel;
  readonly section: Readonly<{
    title: LessonShellContextLabel;
  }>;
}

export interface SupportPauseSession {
  readonly page: number;
  readonly pausedBeforeOpen: boolean;
}

function isVisibleOverlayControl(element: HTMLElement): boolean {
  if (element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
  if (element.matches(':disabled')) return false;
  const closedDetails = element.closest('details:not([open])');
  if (
    closedDetails &&
    !(element.tagName === 'SUMMARY' && element.parentElement === closedDetails)
  ) return false;
  if (element.tabIndex < 0) return false;
  if (element.getClientRects().length === 0) return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

function responsiveFocusMemory(
  target: EventTarget | null,
): ResponsiveFocusMemory | null {
  if (!(target instanceof HTMLElement)) return null;
  const control = target.closest<HTMLElement>('[data-responsive-focus-key]');
  const surface = control?.closest<HTMLElement>(
    '[data-responsive-focus-surface]',
  )?.dataset.responsiveFocusSurface;
  const key = control?.dataset.responsiveFocusKey;
  if (
    !key ||
    (surface !== 'legacy' &&
      surface !== 'modern-wide' &&
      surface !== 'persistent')
  ) return null;
  return {key, surface};
}

function findResponsiveFocusTarget({
  key,
  modernPresentation,
  root,
}: {
  key: string;
  modernPresentation: boolean;
  root: HTMLElement;
}) {
  const surfaceOrder: readonly ResponsiveFocusSurface[] = modernPresentation
    ? ['modern-wide', 'persistent']
    : ['legacy', 'persistent'];
  const controls = [...root.querySelectorAll<HTMLElement>(
    '[data-responsive-focus-key]',
  )];
  const visibleControls = controls.filter(isVisibleOverlayControl);
  const exactCandidates = visibleControls.filter((element) =>
    element.dataset.responsiveFocusKey === key
  );
  const exactTarget = surfaceOrder.flatMap((surface) =>
    exactCandidates.filter((element) =>
      element.closest<HTMLElement>('[data-responsive-focus-surface]')
        ?.dataset.responsiveFocusSurface === surface
    )
  )[0];
  if (exactTarget) return exactTarget;

  // A navigation or transport action can disable itself at the first or final
  // page or frame. Keep keyboard focus on the equivalent surface instead of
  // letting it fall back to document.body, where a subsequent responsive
  // handoff cannot recover it. The anchor is each surface's map trigger: it is
  // the one control that is never disabled and is present for both audiences,
  // so the rescue survives the reviewer-only controls being gated out.
  return surfaceOrder.flatMap((surface) =>
    visibleControls.filter((element) =>
      element.dataset.responsiveFocusFallback === 'true' &&
      element.closest<HTMLElement>('[data-responsive-focus-surface]')
        ?.dataset.responsiveFocusSurface === surface
    )
  )[0] ?? null;
}

function initialLegacyLessonLayoutPolicy(
  authoredStage: Readonly<{height: number; width: number}>,
): LegacyLessonLayoutPolicy {
  return Object.freeze({
    compactLandscape: false,
    containerWidth: authoredStage.width,
    layoutMode: 'legacy-native',
    mapPresentation: 'overlay',
    stageCapWidth: authoredStage.width,
    toolPresentation: 'overlay',
    workspaceDensity: 'comfortable',
  });
}

/**
 * The labelled toolbar is a fallback, not a companion.
 *
 * It exists for the two cases where the source hit regions cannot be operated
 * as authored: a stage that has actually scaled below its 800 x 600 plane, so
 * every hotspot shrinks with it, and a coarse pointer, which cannot resolve
 * hotspots sized for a mouse. A wide viewport is neither — it renders the
 * plane at native size for a fine pointer, where a second labelled copy of
 * every control is duplication rather than access. `wideFunctionalCompanion`
 * therefore stays a layout signal only and no longer elects this surface.
 */
export function resolveModernControlPresentation({
  accessibleControlFallback,
  coarsePointerAvailable,
  companionCanRemainVisible,
}: {
  accessibleControlFallback: boolean;
  coarsePointerAvailable: boolean;
  companionCanRemainVisible: boolean;
}) {
  return accessibleControlFallback ||
    (coarsePointerAvailable && companionCanRemainVisible);
}

export function reconcileSupportPauseSession({
  currentPage,
  paused,
  playbackInspectionActive,
  session,
  supportOpen,
}: {
  currentPage: number;
  paused: boolean;
  playbackInspectionActive: boolean;
  session: SupportPauseSession | null;
  supportOpen: boolean;
}): Readonly<{
  requestedPaused: boolean | null;
  session: SupportPauseSession | null;
}> {
  if (supportOpen) {
    const activeSession = session?.page === currentPage
      ? session
      : {page: currentPage, pausedBeforeOpen: paused};
    return {
      requestedPaused: paused ? null : true,
      session: activeSession,
    };
  }
  if (!session) {
    return {requestedPaused: null, session: null};
  }
  return {
    requestedPaused: session.page === currentPage
      ? playbackInspectionActive || session.pausedBeforeOpen
      : null,
    session: null,
  };
}

function LegacyControlImage({
  assetRoot,
  file,
  height,
  width,
}: {
  assetRoot: string;
  file: string;
  height: number;
  width: number;
}) {
  // These are tiny, already-optimized source-control PNGs. Keeping the raw
  // pixels avoids responsive image rewriting inside the legacy control pod.
  // eslint-disable-next-line @next/next/no-img-element
  return <img
    alt=""
    aria-hidden="true"
    height={height}
    src={`${assetRoot}/${file}`}
    width={width}
  />;
}

function LegacyToolFace({
  file,
  height,
  label,
  visualSkin,
  width,
}: {
  file: string;
  height: number;
  label: string;
  visualSkin: LegacyLessonShellVisualSkin;
  width: number;
}) {
  if (visualSkin.controlAssets.kind === 'source-derived-diagnostic-candidate') {
    return <LegacyControlImage
      assetRoot={visualSkin.controlAssets.root}
      file={file}
      height={height}
      width={width}
    />;
  }
  return <span
    aria-hidden="true"
    className="lesson-shell2__modern-tool-face"
    data-control-origin="modern-functional-equivalent"
  >
    {label}
  </span>;
}

function LegacyNavigationControlFace({
  direction,
  visualSkin,
}: {
  direction: 'next' | 'previous';
  visualSkin: LegacyLessonShellVisualSkin;
}) {
  const controlAssets = visualSkin.controlAssets;
  if (
    controlAssets.kind !== 'source-derived-diagnostic-candidate' ||
    !controlAssets.navigation
  ) {
    return null;
  }
  const navigation = controlAssets.navigation;
  const placement = navigation[direction];
  const hoverDurationSeconds =
    navigation.files.overFrames.length / navigation.hoverFps;
  return <span
    aria-hidden="true"
    className={[
      'lesson-shell2__legacy-navigation-face',
      `lesson-shell2__legacy-navigation-face--${direction}`,
    ].join(' ')}
    data-navigation-visual-evidence={navigation.kind}
    data-source-hover-fps={navigation.hoverFps}
    data-source-hover-frame-count={navigation.files.overFrames.length}
    data-source-button-character-ids={
      navigation.sourceButtonCharacterIds.join(',')
    }
    data-source-mirror-x={placement.mirrorX ? 'true' : 'false'}
    data-source-sprite-character-id={placement.sourceSpriteCharacterId}
    style={{
      '--lesson-navigation-face-size':
        `${navigation.renderedSize / navigation.authoredHitAreaSize * 100}%`,
      '--lesson-navigation-hover-duration': `${hoverDurationSeconds}s`,
    } as CSSProperties}
  >
    {/* These SVGs preserve the exact FFDec 26.2.1 button states and the
        nested 13-frame Hand timeline from the hash-bound course shell.
        CSS selects the pointer state; ActionScript is not run. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      alt=""
      className="lesson-shell2__legacy-navigation-state lesson-shell2__legacy-navigation-state--up"
      height={navigation.renderedSize}
      src={`${controlAssets.root}/${navigation.files.up}`}
      width={navigation.renderedSize}
    />
    {navigation.files.overFrames.map((file, index) =>
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt=""
        className="lesson-shell2__legacy-navigation-state lesson-shell2__legacy-navigation-state--over"
        data-hover-frame={index + 1}
        height={navigation.renderedSize}
        key={file}
        src={`${controlAssets.root}/${file}`}
        style={{
          '--lesson-navigation-hover-delay':
            `${index / navigation.hoverFps}s`,
        } as CSSProperties}
        width={navigation.renderedSize}
      />
    )}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      alt=""
      className="lesson-shell2__legacy-navigation-state lesson-shell2__legacy-navigation-state--down"
      height={navigation.renderedSize}
      src={`${controlAssets.root}/${navigation.files.down}`}
      width={navigation.renderedSize}
    />
  </span>;
}

export function LegacyResponsiveLessonShell({
  activeTool,
  audioAvailable,
  backgroundCompanionVisible,
  calculatorEvidence,
  candidateMode,
  completionAction,
  completionLabel,
  completionPercent,
  courseContext,
  courseHref,
  currentAnimationId,
  currentPage,
  disclosure,
  finishedNotice,
  gradeLessonLabel,
  helpPanel,
  idPrefix,
  keyTermsPanel,
  learningSupport,
  locale,
  mapOpen,
  mapPanel,
  nextControlLabel,
  nextDisabled,
  nextLabel,
  onMapOpenChange,
  onHeaderBack,
  onExit,
  onNext,
  onPausedChange,
  onPlaybackResumeFromInspection,
  onPlaybackSeek,
  onPrevious,
  onReplay,
  onToolChange,
  onVolumeChange,
  pageInteractionCompanionTargetId,
  pageHeading,
  paused,
  playbackFrame,
  playbackFrameCount,
  playbackFrameDomain,
  playbackInspectionActive,
  playbackSeekAvailable,
  playbackStepFrames,
  playbackTransportMode,
  previousDisabled,
  releaseBoundary,
  runtimeAvailable,
  stage,
  stageOverlay,
  status,
  totalPages,
  visualSkin,
  volume,
}: {
  activeTool: LessonShellTool;
  audioAvailable: boolean;
  backgroundCompanionVisible: boolean;
  calculatorEvidence: LegacyCalculatorEvidence;
  candidateMode: boolean;
  completionAction: ReactNode;
  completionLabel: string;
  completionPercent: number;
  courseContext: LessonShellCourseContext;
  courseHref: string;
  currentAnimationId: string;
  currentPage: number;
  disclosure?: ReactNode;
  finishedNotice?: ReactNode;
  gradeLessonLabel: string;
  helpPanel: ReactNode;
  idPrefix: string;
  keyTermsPanel: ReactNode;
  learningSupport?: ReactNode;
  locale: 'en' | 'es';
  mapOpen: boolean;
  mapPanel: ReactNode;
  nextControlLabel: string;
  nextDisabled: boolean;
  nextLabel: string;
  onMapOpenChange: (open: boolean) => void;
  onHeaderBack: () => void;
  onExit: () => void;
  onNext: () => void;
  onPausedChange: (paused: boolean) => void;
  onPlaybackResumeFromInspection: () => void;
  onPlaybackSeek: (frame: number) => void;
  onPrevious: () => void;
  onReplay: () => void;
  onToolChange: (tool: LessonShellTool) => void;
  onVolumeChange: (volume: number) => void;
  pageInteractionCompanionTargetId?: string;
  pageHeading: ReactNode;
  paused: boolean;
  playbackFrame: number;
  playbackFrameCount: number;
  playbackFrameDomain: string;
  playbackInspectionActive: boolean;
  playbackSeekAvailable: boolean;
  playbackStepFrames: number;
  playbackTransportMode: 'none' | 'visual-frame-inspector';
  previousDisabled: boolean;
  releaseBoundary: LessonShellReleaseBoundary;
  runtimeAvailable: boolean;
  stage: ReactNode;
  stageOverlay?: ReactNode;
  status: ReactNode;
  totalPages: number;
  visualSkin: LegacyLessonShellVisualSkin;
  volume: number;
}) {
  const spanish = locale === 'es';
  const [exitPromptOpen, setExitPromptOpen] = useState(false);
  const stageOverlayOpen = Boolean(stageOverlay) || exitPromptOpen;
  const mapPanelId = `${idPrefix}-course-map`;
  const toolPanelId = `${idPrefix}-tool-panel`;
  const exitPromptId = `${idPrefix}-exit-prompt`;
  const transportBoundaryId = `${idPrefix}-transport-boundary`;
  const stageIdentity = `${visualSkin.authoredStage.width}x${visualSkin.authoredStage.height}`;
  const backgroundCompanion = backgroundCompanionVisible
    ? visualSkin.backgroundCompanion
    : undefined;
  const loadedSwfHostComposite = Boolean(
    backgroundCompanion?.loadedSwfHostRequired &&
      backgroundCompanion.loadedSwfHostAsset.sourceProvenLanguage === locale,
  );
  const navigationControlAssets =
    visualSkin.controlAssets.kind === 'source-derived-diagnostic-candidate'
      ? visualSkin.controlAssets.navigation
      : undefined;
  const bottomChromeAsset = navigationControlAssets &&
      visualSkin.controlAssets.kind === 'source-derived-diagnostic-candidate'
    ? `${visualSkin.controlAssets.root}/${navigationControlAssets.navigationFreeChromeFile}`
    : visualSkin.chromeAsset;
  const [layoutPolicy, setLayoutPolicy] = useState(
    () => initialLegacyLessonLayoutPolicy(visualSkin.authoredStage),
  );
  const [wideViewportAvailable, setWideViewportAvailable] = useState(false);
  const [coarsePointerAvailable, setCoarsePointerAvailable] = useState(false);
  const [renderedStageWidth, setRenderedStageWidth] = useState<number | null>(
    null,
  );
  const accessibleControlFallback = renderedStageWidth !== null &&
    renderedStageWidth < visualSkin.authoredStage.width * .95;
  const [
    backgroundCompanionLoad,
    setBackgroundCompanionLoadStatus,
  ] = useState<Readonly<{
    assetKey: string;
    status: 'ready' | 'error';
  }> | null>(null);
  const backgroundCompanionAssetKey = backgroundCompanion
    ? `${backgroundCompanion.asset}:${backgroundCompanion.assetSha256}`
    : '';
  const backgroundCompanionStatus = backgroundCompanion
    ? backgroundCompanionLoad?.assetKey === backgroundCompanionAssetKey
      ? backgroundCompanionLoad.status
      : 'loading'
    : 'not-required';
  const validateBackgroundCompanionImage = useCallback(
    (image: HTMLImageElement | null) => {
      if (!image?.complete || !backgroundCompanion) return;
      setBackgroundCompanionLoadStatus({
        assetKey: backgroundCompanionAssetKey,
        status:
          image.naturalWidth === visualSkin.authoredStage.width
            && image.naturalHeight === visualSkin.authoredStage.height
            ? 'ready'
            : 'error',
      });
    },
    [
      backgroundCompanion,
      backgroundCompanionAssetKey,
      visualSkin.authoredStage.height,
      visualSkin.authoredStage.width,
    ],
  );
  const stageStyle = {
    '--lesson-chrome-bottom-clip': `${
      100 - (visualSkin.chromeFooterHeight / visualSkin.authoredStage.height) * 100
    }%`,
    '--lesson-chrome-top-clip': `${
      100 - (visualSkin.chromeHeaderHeight / visualSkin.authoredStage.height) * 100
    }%`,
    '--lesson-stage-aspect': `${visualSkin.authoredStage.width} / ${visualSkin.authoredStage.height}`,
    '--lesson-stage-max-height': `${visualSkin.authoredStage.height}px`,
    '--lesson-stage-max-width': `${visualSkin.authoredStage.width}px`,
    '--lesson-stage-viewport-fit-width': `${layoutPolicy.stageCapWidth}px`,
  } as CSSProperties;
  const mapButtonRef = useRef<HTMLButtonElement>(null);
  const mapCloseRef = useRef<HTMLButtonElement>(null);
  const mapPanelRef = useRef<HTMLDivElement>(null);
  const lastToolTriggerRef = useRef<HTMLButtonElement>(null);
  const toolCloseRef = useRef<HTMLButtonElement>(null);
  const toolPanelRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLElement>(null);
  const legacyStageRef = useRef<HTMLDivElement>(null);
  const exitTriggerRef = useRef<HTMLButtonElement>(null);
  const exitPausedBeforeOpenRef = useRef(false);
  const lastResponsiveFocusRef = useRef<ResponsiveFocusMemory | null>(null);
  const supportPauseSessionRef = useRef<SupportPauseSession | null>(null);
  const lastAudibleVolumeRef = useRef(
    rememberLegacyAudibleVolume({
      lastAudibleVolume: .8,
      volume,
    }),
  );
  const mapOverlay = layoutPolicy.mapPresentation === 'overlay';
  const toolOverlay = layoutPolicy.toolPresentation === 'overlay';
  const companionCanRemainVisible = activeTool === null || toolOverlay;
  const wideFunctionalCompanion =
    wideViewportAvailable &&
    layoutPolicy.layoutMode === 'wide-functional' &&
    companionCanRemainVisible;
  const modernControlPresentation = resolveModernControlPresentation({
    accessibleControlFallback,
    coarsePointerAvailable,
    companionCanRemainVisible,
  });
  const previousModernControlPresentationRef = useRef(
    modernControlPresentation,
  );
  const previousActiveToolRef = useRef(activeTool);
  const previousToolOverlayRef = useRef(toolOverlay);
  // Exactly one control surface is live. The source hit regions stay authored
  // controls while they are the only surface; once the modern toolbar takes
  // over they become dead artwork rather than a second, undersized copy of
  // every action shadowing the labelled fallback. Decision overlays suppress
  // both surfaces.
  const legacyHitControlsInert = stageOverlayOpen || modernControlPresentation;
  const legacyHitControlMode = stageOverlayOpen
    ? 'inert-session-overlay'
    : modernControlPresentation
      ? 'inert-modern-surface'
      : 'active-visible-stage';
  const mapModalOpen = mapOpen && mapOverlay;
  const toolModalOpen = Boolean(activeTool) && toolOverlay;
  const supportModalOpen = mapModalOpen || toolModalOpen;
  const backgroundUnavailable = stageOverlayOpen || supportModalOpen;
  const supportOpen =
    (mapOpen && mapOverlay) || activeTool !== null;

  useLayoutEffect(() => {
    const media = window.matchMedia(WIDE_FUNCTIONAL_COMPANION_MEDIA);
    const updateWideViewportAvailability = () => {
      setWideViewportAvailable(media.matches);
    };

    updateWideViewportAvailability();
    media.addEventListener('change', updateWideViewportAvailability);
    return () => {
      media.removeEventListener('change', updateWideViewportAvailability);
    };
  }, []);

  useLayoutEffect(() => {
    const media = window.matchMedia(COARSE_POINTER_MEDIA);
    const updateCoarsePointerAvailability = () => {
      setCoarsePointerAvailable(media.matches);
    };

    updateCoarsePointerAvailability();
    media.addEventListener('change', updateCoarsePointerAvailability);
    return () => {
      media.removeEventListener('change', updateCoarsePointerAvailability);
    };
  }, []);

  useEffect(() => {
    const rememberResponsiveFocus = (event: FocusEvent) => {
      if (event.target === document.body) return;
      lastResponsiveFocusRef.current = responsiveFocusMemory(event.target);
    };
    document.addEventListener('focusin', rememberResponsiveFocus);
    return () => {
      document.removeEventListener('focusin', rememberResponsiveFocus);
    };
  }, []);

  const rememberLanguageRouteFocusIntent = useCallback(() => {
    try {
      window.sessionStorage.setItem(
        LANGUAGE_ROUTE_FOCUS_INTENT_KEY,
        activeTool !== null && !toolOverlay
          ? `${LANGUAGE_ROUTE_TOOL_INTENT_PREFIX}${activeTool}`
          : 'page-heading',
      );
    } catch {
      // Route focus recovery is an enhancement and must not block navigation
      // when session storage is unavailable.
    }
  }, [activeTool, toolOverlay]);

  useEffect(() => {
    if (stageOverlayOpen) return;
    let pendingIntent: string | null = null;
    try {
      pendingIntent = window.sessionStorage.getItem(
        LANGUAGE_ROUTE_FOCUS_INTENT_KEY,
      );
    } catch {
      return;
    }
    if (!pendingIntent) return;

    const pendingTool = pendingIntent.startsWith(
      LANGUAGE_ROUTE_TOOL_INTENT_PREFIX,
    )
      ? pendingIntent.slice(LANGUAGE_ROUTE_TOOL_INTENT_PREFIX.length)
      : null;
    const restorableTool = pendingTool === 'help' ||
        pendingTool === 'key-terms' ||
        pendingTool === 'calculator'
      ? pendingTool
      : null;
    if (restorableTool && !toolOverlay && activeTool !== restorableTool) {
      onToolChange(restorableTool);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const heading = shellRef.current?.querySelector<HTMLElement>(
        '.lesson-shell2__page-heading h1',
      );
      const target = restorableTool && activeTool === restorableTool &&
          !toolOverlay
        ? toolCloseRef.current
        : heading;
      if (!target) return;

      target.focus({preventScroll: true});
      if (document.activeElement !== target) return;
      try {
        window.sessionStorage.removeItem(LANGUAGE_ROUTE_FOCUS_INTENT_KEY);
      } catch {
        // The successful focus transfer is sufficient when cleanup is denied.
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeTool, onToolChange, stageOverlayOpen, toolOverlay]);

  useLayoutEffect(() => {
    const previousPresentation =
      previousModernControlPresentationRef.current;
    previousModernControlPresentationRef.current = modernControlPresentation;
    if (previousPresentation === modernControlPresentation) return;

    const currentFocus = responsiveFocusMemory(document.activeElement);
    const rememberedFocus = currentFocus ?? (
      document.activeElement === document.body
        ? lastResponsiveFocusRef.current
        : null
    );
    const outgoingSurface: ResponsiveFocusSurface = modernControlPresentation
      ? 'legacy'
      : 'modern-wide';
    if (rememberedFocus?.surface !== outgoingSurface) return;

    const root = shellRef.current;
    if (!root) return;
    const target = findResponsiveFocusTarget({
      key: rememberedFocus.key,
      modernPresentation: modernControlPresentation,
      root,
    });
    target?.focus({preventScroll: true});
  }, [modernControlPresentation]);

  useLayoutEffect(() => {
    const stageNode = legacyStageRef.current;
    const shellNode = shellRef.current;
    if (!stageNode || !shellNode) return;

    let animationFrame = 0;
    const updateViewportFit = () => {
      animationFrame = 0;
      const top = stageNode.getBoundingClientRect().top;
      const containerWidth = shellNode.getBoundingClientRect().width;
      if (containerWidth <= 0) return;
      const nextPolicy = resolveLegacyLessonLayout({
        authoredStage: visualSkin.authoredStage,
        containerWidth,
        stageTop: top,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      });
      setLayoutPolicy((current) =>
        current.compactLandscape === nextPolicy.compactLandscape &&
          current.containerWidth === nextPolicy.containerWidth &&
          current.layoutMode === nextPolicy.layoutMode &&
          current.mapPresentation === nextPolicy.mapPresentation &&
          current.stageCapWidth === nextPolicy.stageCapWidth &&
          current.toolPresentation === nextPolicy.toolPresentation &&
          current.workspaceDensity === nextPolicy.workspaceDensity
          ? current
          : nextPolicy);
    };
    const scheduleViewportFit = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(updateViewportFit);
    };

    updateViewportFit();
    window.addEventListener('resize', scheduleViewportFit);
    window.visualViewport?.addEventListener('resize', scheduleViewportFit);
    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(scheduleViewportFit);
    resizeObserver?.observe(shellNode);
    if (stageNode.parentElement) {
      resizeObserver?.observe(stageNode.parentElement);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', scheduleViewportFit);
      window.visualViewport?.removeEventListener('resize', scheduleViewportFit);
      resizeObserver?.disconnect();
    };
  }, [
    visualSkin.authoredStage,
  ]);

  useLayoutEffect(() => {
    const stageNode = legacyStageRef.current;
    if (!stageNode) return;
    const updateRenderedWidth = () => {
      const width = Math.round(stageNode.getBoundingClientRect().width * 1000) /
        1000;
      setRenderedStageWidth((current) =>
        current === width ? current : width);
    };
    updateRenderedWidth();
    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(updateRenderedWidth);
    resizeObserver?.observe(stageNode);
    window.addEventListener('resize', updateRenderedWidth);
    window.visualViewport?.addEventListener('resize', updateRenderedWidth);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateRenderedWidth);
      window.visualViewport?.removeEventListener('resize', updateRenderedWidth);
    };
  }, []);

  useEffect(() => {
    if (toolOverlay && mapOpen && activeTool) {
      onMapOpenChange(false);
    }
  }, [activeTool, mapOpen, onMapOpenChange, toolOverlay]);

  useEffect(() => {
    lastAudibleVolumeRef.current = rememberLegacyAudibleVolume({
      lastAudibleVolume: lastAudibleVolumeRef.current,
      volume,
    });
  }, [volume]);

  useEffect(() => {
    if (mapOpen && mapOverlay) mapCloseRef.current?.focus();
  }, [mapOpen, mapOverlay]);

  useEffect(() => {
    const previousActiveTool = previousActiveToolRef.current;
    const previousToolOverlay = previousToolOverlayRef.current;
    previousActiveToolRef.current = activeTool;
    previousToolOverlayRef.current = toolOverlay;
    const toolOpened = activeTool !== null && previousActiveTool === null;
    const toolBecameModal =
      activeTool !== null && toolOverlay && !previousToolOverlay;
    if (toolOpened || toolBecameModal) toolCloseRef.current?.focus();
  }, [activeTool, toolOverlay]);

  const reconcileSupportPlayback = useCallback((nextSupportOpen: boolean) => {
    const result = reconcileSupportPauseSession({
      currentPage,
      paused,
      playbackInspectionActive,
      session: supportPauseSessionRef.current,
      supportOpen: nextSupportOpen,
    });
    supportPauseSessionRef.current = result.session;
    if (
      result.requestedPaused !== null &&
      result.requestedPaused !== paused
    ) {
      onPausedChange(result.requestedPaused);
    }
  }, [
    currentPage,
    onPausedChange,
    paused,
    playbackInspectionActive,
  ]);

  useEffect(() => {
    reconcileSupportPlayback(supportOpen);
  }, [reconcileSupportPlayback, supportOpen]);

  const toggleMap = useCallback((trigger?: HTMLButtonElement) => {
    if (trigger) mapButtonRef.current = trigger;
    const open = !mapOpen;
    if (open && mapOverlay) {
      onToolChange(null);
    }
    reconcileSupportPlayback(
      (open && mapOverlay) || activeTool !== null,
    );
    onMapOpenChange(open);
  }, [
    activeTool,
    mapOpen,
    mapOverlay,
    onMapOpenChange,
    onToolChange,
    reconcileSupportPlayback,
  ]);

  const toggleTool = useCallback((
    tool: Exclude<LessonShellTool, null>,
    trigger: HTMLButtonElement,
  ) => {
    lastToolTriggerRef.current = trigger;
    const nextTool = activeTool === tool ? null : tool;
    if (nextTool && toolOverlay) {
      onMapOpenChange(false);
    }
    reconcileSupportPlayback(
      (mapOpen && mapOverlay) || nextTool !== null,
    );
    onToolChange(nextTool);
  }, [
    activeTool,
    mapOpen,
    mapOverlay,
    onMapOpenChange,
    onToolChange,
    reconcileSupportPlayback,
    toolOverlay,
  ]);

  const closeMap = useCallback(() => {
    reconcileSupportPlayback(activeTool !== null);
    onMapOpenChange(false);
    window.requestAnimationFrame(() => {
      const root = shellRef.current;
      const target = root
        ? findResponsiveFocusTarget({
            key: 'map',
            modernPresentation: modernControlPresentation,
            root,
          })
        : null;
      if (target) {
        target.focus({preventScroll: true});
        return;
      }
      const rememberedTrigger = mapButtonRef.current;
      if (rememberedTrigger && isVisibleOverlayControl(rememberedTrigger)) {
        rememberedTrigger.focus({preventScroll: true});
      }
    });
  }, [
    activeTool,
    modernControlPresentation,
    onMapOpenChange,
    reconcileSupportPlayback,
  ]);

  const closeTool = useCallback(() => {
    const closingTool = activeTool;
    const rememberedTrigger = lastToolTriggerRef.current;

    reconcileSupportPlayback(mapOpen && mapOverlay);
    onToolChange(null);
    window.requestAnimationFrame(() => {
      if (
        rememberedTrigger &&
        isVisibleOverlayControl(rememberedTrigger)
      ) {
        rememberedTrigger.focus({preventScroll: true});
        return;
      }

      const root = shellRef.current;
      if (!root || !closingTool) return;
      const target = findResponsiveFocusTarget({
        key: closingTool,
        modernPresentation:
          root.dataset.modernControlPresentation === 'true',
        root,
      });
      target?.focus({preventScroll: true});
    });
  }, [
    activeTool,
    mapOpen,
    mapOverlay,
    onToolChange,
    reconcileSupportPlayback,
  ]);

  const requestExit = useCallback((trigger: HTMLButtonElement) => {
    if (stageOverlay || exitPromptOpen) return;
    exitTriggerRef.current = trigger;
    exitPausedBeforeOpenRef.current = paused;
    if (!paused) onPausedChange(true);
    setExitPromptOpen(true);
  }, [exitPromptOpen, onPausedChange, paused, stageOverlay]);

  const cancelExit = useCallback(() => {
    const pausedBeforeOpen = exitPausedBeforeOpenRef.current;
    setExitPromptOpen(false);
    // Restore unconditionally so an immediate Escape/No cannot race the
    // parent's batched pause update from the opening click.
    onPausedChange(pausedBeforeOpen);
    window.requestAnimationFrame(() => exitTriggerRef.current?.focus());
  }, [onPausedChange]);

  const toggleMute = useCallback(() => {
    const transition = toggleLegacyMute({
      lastAudibleVolume: lastAudibleVolumeRef.current,
      volume,
    });
    lastAudibleVolumeRef.current = transition.lastAudibleVolume;
    onVolumeChange(transition.volume);
  }, [onVolumeChange, volume]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (activeTool) {
          closeTool();
        } else if (mapOpen) {
          closeMap();
        }
        return;
      }
      if (event.key !== 'Tab') return;
      const activeOverlay = activeTool && toolOverlay
        ? toolPanelRef.current
        : mapOpen && mapOverlay
          ? mapPanelRef.current
          : null;
      if (!activeOverlay) return;
      const focusable = [...activeOverlay.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), summary, textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      )].filter(isVisibleOverlayControl);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (!activeOverlay.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [
    activeTool,
    closeMap,
    closeTool,
    mapOpen,
    mapOverlay,
    toolOverlay,
  ]);

  const toolTitle = activeTool === 'key-terms'
    ? (spanish ? 'Términos clave' : 'Key Terms')
    : activeTool === 'calculator'
      ? (spanish ? 'Calculadora' : 'Calculator')
      : (spanish ? 'Ayuda' : 'Help');
  const pageOrdinalLabel = spanish
    ? `Página ${currentPage} de ${totalPages}`
    : `Page ${currentPage} of ${totalPages}`;
  const normalizedPlaybackFrameCount = Math.max(
    1,
    Math.trunc(playbackFrameCount),
  );
  const normalizedPlaybackFrame = Math.min(
    normalizedPlaybackFrameCount,
    Math.max(1, Math.trunc(playbackFrame)),
  );
  const normalizedPlaybackStep = Math.max(
    1,
    Math.trunc(playbackStepFrames || 20),
  );
  const timelinePercent = normalizedPlaybackFrameCount === 1
    ? 0
    : ((normalizedPlaybackFrame - 1) /
        (normalizedPlaybackFrameCount - 1)) * 100;
  const timelineStyle = {
    '--lesson-timeline-progress': `${timelinePercent}%`,
  } as CSSProperties;
  const volumeStyle = {
    '--lesson-volume-progress': `${Math.max(0, Math.min(1, volume)) * 100}%`,
  } as CSSProperties;

  useLayoutEffect(() => {
    if (document.activeElement !== document.body) return;
    const rememberedFocus = lastResponsiveFocusRef.current;
    const root = shellRef.current;
    if (!rememberedFocus || !root) return;
    const rememberedControl = [...root.querySelectorAll<HTMLElement>(
      '[data-responsive-focus-key]',
    )].find((element) =>
      element.dataset.responsiveFocusKey === rememberedFocus.key &&
      element.closest<HTMLElement>('[data-responsive-focus-surface]')
        ?.dataset.responsiveFocusSurface === rememberedFocus.surface
    );
    if (!rememberedControl || isVisibleOverlayControl(rememberedControl)) {
      return;
    }
    const target = findResponsiveFocusTarget({
      key: rememberedFocus.key,
      modernPresentation: modernControlPresentation,
      root,
    });
    if (target && target !== rememberedControl) {
      target.focus({preventScroll: true});
    }
  });

  return <main
    data-audio-available={audioAvailable ? 'true' : 'false'}
    data-accessible-control-fallback={
      accessibleControlFallback ? 'true' : 'false'
    }
    className="whole-lesson-page lesson-shell2"
    data-candidate-mode={candidateMode ? 'true' : 'false'}
    data-coarse-pointer={coarsePointerAvailable ? 'true' : 'false'}
    data-current-animation-id={currentAnimationId}
    data-current-js-candidate={releaseBoundary.currentJsCandidate ? 'true' : 'false'}
    data-current-js-pages={releaseBoundary.currentJsPageCount}
    data-frame-inspection-active={playbackInspectionActive ? 'true' : 'false'}
    data-learning-support={learningSupport ? 'present' : 'none'}
    data-layout-contract={LEGACY_LESSON_LAYOUT_CONTRACT}
    data-layout-container-width={layoutPolicy.containerWidth}
    data-layout-density={layoutPolicy.workspaceDensity}
    data-layout-mode={layoutPolicy.layoutMode}
    data-legacy-hit-control-mode={legacyHitControlMode}
    data-map-open={mapOpen ? 'true' : 'false'}
    data-map-presentation={layoutPolicy.mapPresentation}
    data-modern-control-presentation={
      modernControlPresentation ? 'true' : 'false'
    }
    data-presentation="wide-functional-audit-candidate"
    data-public-release={releaseBoundary.publicRelease ? 'true' : 'false'}
    data-release-id={releaseBoundary.releaseId}
    data-required-release-members={releaseBoundary.requiredMemberCount}
    data-runtime-available={runtimeAvailable ? 'true' : 'false'}
    data-runtime-frame-domain={playbackFrameDomain}
    data-runtime-transport={playbackTransportMode}
    data-shell-visual-authority={visualSkin.chromeEvidence}
    data-shell-layout={visualSkin.layoutId}
    data-shell-source-animation-id={visualSkin.sourceAnimationId}
    data-shell-source-swf-sha256={visualSkin.sourceSwfSha256}
    data-exit-decision={exitPromptOpen ? 'prompt' : 'closed'}
    data-session-decision-overlay={stageOverlayOpen ? 'open' : 'closed'}
    data-session-decision-kind={exitPromptOpen
      ? 'exit'
      : stageOverlay
        ? 'resume'
        : 'none'}
    data-source-background-companion={
      backgroundCompanion ? 'visible' : 'hidden'
    }
    data-source-background-companion-status={backgroundCompanionStatus}
    data-support-modal-open={supportModalOpen ? 'true' : 'false'}
    data-support-tool-playback="modern-support-open-forces-pause-restores-prior-state"
    data-tool-visual-authority={visualSkin.controlAssets.kind}
    data-strict-complete-members={releaseBoundary.strictCompleteMemberCount}
    data-strict-completion={releaseBoundary.strictCompletion ? 'true' : 'false'}
    data-tool-open={activeTool ? 'true' : 'false'}
    data-tool-presentation={layoutPolicy.toolPresentation}
    data-wide-functional-companion={wideFunctionalCompanion ? 'true' : 'false'}
    data-stage-render-mode={renderedStageWidth === null
      ? 'measuring'
      : Math.abs(renderedStageWidth - visualSkin.authoredStage.width) <= .5
        ? 'native-pixel-size'
        : 'proportional-scale'}
    data-active-tool={activeTool ?? 'none'}
    id="main-content"
    lang={locale}
    ref={shellRef}
    style={stageStyle}
  >
    <section
      aria-hidden={backgroundUnavailable ? true : undefined}
      aria-label={spanish ? 'Sesión de aprendizaje' : 'Learning session'}
      className="lesson-shell2__session-bar"
      inert={backgroundUnavailable ? true : undefined}
    >
      <div>
        <strong>{completionPercent}%</strong>
        <span>{completionLabel}</span>
      </div>
      <progress
        aria-label={spanish ? 'Progreso de la lección' : 'Lesson completion'}
        max={100}
        value={completionPercent}
      >{completionPercent}%</progress>
      <span>{pageOrdinalLabel}</span>
      <nav
        aria-label={spanish ? 'Idioma de la lección' : 'Lesson language'}
        className="lesson-shell2__language"
        data-responsive-focus-surface="persistent"
      >
        <Link
          aria-current={!spanish ? 'page' : undefined}
          data-responsive-focus-key="language-en"
          href={courseHref}
          locale="en"
          onClick={!spanish ? undefined : rememberLanguageRouteFocusIntent}
        >EN</Link>
        <Link
          aria-current={spanish ? 'page' : undefined}
          data-responsive-focus-key="language-es"
          href={courseHref}
          locale="es"
          onClick={spanish ? undefined : rememberLanguageRouteFocusIntent}
        >ES</Link>
      </nav>
    </section>

    {disclosure
      ? <div
          aria-hidden={backgroundUnavailable ? true : undefined}
          className="lesson-shell2__disclosure"
          inert={backgroundUnavailable ? true : undefined}
        >{disclosure}</div>
      : null}

    <div className="lesson-shell2__body">
      <button
        aria-hidden="true"
        className="lesson-shell2__scrim lesson-shell2__scrim--map"
        inert={stageOverlayOpen || toolModalOpen ? true : undefined}
        onClick={closeMap}
        tabIndex={-1}
        type="button"
      />
      <div
        aria-modal={mapOverlay && mapOpen ? true : undefined}
        aria-hidden={
          !mapOpen || stageOverlayOpen || toolModalOpen ? true : undefined
        }
        aria-label={spanish ? 'Mapa del curso' : 'Course map'}
        className="lesson-shell2__side-panel lesson-shell2__side-panel--map"
        id={mapPanelId}
        inert={
          !mapOpen || stageOverlayOpen || toolModalOpen ? true : undefined
        }
        ref={mapPanelRef}
        role={mapOverlay ? 'dialog' : 'complementary'}
      >
        <div
          aria-hidden="true"
          className="lesson-shell2__map-rail-summary"
          data-map-rail-summary="modern-responsive-context"
        >
          <div className="lesson-shell2__map-rail-summary-header">
            <span>{spanish ? 'Resumen del curso' : 'Course overview'}</span>
            <strong lang={courseContext.courseTitle.sourceLanguage}>
              {courseContext.courseTitle.text}
            </strong>
            <small>{gradeLessonLabel}</small>
          </div>
          <div className="lesson-shell2__map-rail-summary-current">
            <span>{spanish ? 'Página actual' : 'Current page'}</span>
            <strong lang={courseContext.pageTitle.sourceLanguage}>
              {courseContext.pageTitle.text}
            </strong>
            <small lang={courseContext.section.title.sourceLanguage}>
              {courseContext.section.title.text}
            </small>
          </div>
          <div className="lesson-shell2__map-rail-summary-progress">
            <div>
              <span>{spanish ? 'Progreso de la lección' : 'Lesson progress'}</span>
              <strong>{completionPercent}%</strong>
            </div>
            <div
              className="lesson-shell2__map-rail-summary-meter"
              style={{
                '--lesson-summary-progress': `${completionPercent}%`,
              } as CSSProperties}
            ><span /></div>
            <small>{pageOrdinalLabel}</small>
          </div>
          <p>{spanish
            ? `Usa Mapa en los controles de la lección para explorar las ${totalPages} páginas.`
            : `Use Map in the lesson controls to browse all ${totalPages} pages.`}</p>
        </div>
        <header>
          <div>
            <span>{spanish ? `${totalPages} páginas` : `${totalPages}-page sequence`}</span>
            <h2>{spanish ? 'Mapa del curso' : 'Course map'}</h2>
          </div>
          <button
            aria-label={spanish ? 'Cerrar el mapa' : 'Close course map'}
            data-course-map-close-control="true"
            onClick={closeMap}
            ref={mapCloseRef}
            type="button"
          >×</button>
        </header>
        <div className="lesson-shell2__map-content">{mapPanel}</div>
      </div>

      <article
        aria-hidden={supportModalOpen ? true : undefined}
        className="lesson-shell2__learning-column"
        inert={supportModalOpen ? true : undefined}
      >
        <header
          aria-hidden={stageOverlayOpen ? true : undefined}
          className="lesson-shell2__page-heading"
          inert={stageOverlayOpen ? true : undefined}
        >
          {pageHeading}
        </header>

        <div
          aria-label={`${gradeLessonLabel} · ${spanish
            ? `escenario heredado de ${visualSkin.authoredStage.width} por ${visualSkin.authoredStage.height}`
            : `legacy ${visualSkin.authoredStage.width} by ${visualSkin.authoredStage.height} stage`}`}
          className="lesson-shell2__legacy-stage"
          data-legacy-chrome-evidence={visualSkin.chromeEvidence}
          data-native-composite-stage={stageIdentity}
          data-source-background-companion={
            backgroundCompanion ? 'visible' : 'hidden'
          }
          data-source-background-companion-status={backgroundCompanionStatus}
          data-shell-layout={visualSkin.layoutId}
          data-viewport-fit-width={renderedStageWidth ?? undefined}
          ref={legacyStageRef}
          role="region"
          style={stageStyle}
        >
          {backgroundCompanion
            ? <div
                aria-hidden="true"
                className="lesson-shell2__source-background-text"
                data-source-character-id={backgroundCompanion.sourceCharacterId}
                data-source-instance-name={backgroundCompanion.sourceInstanceName}
                data-source-parent-depth={backgroundCompanion.rootDepth}
                data-source-root-frame={backgroundCompanion.rootFrame}
                inert={stageOverlayOpen ? true : undefined}
                data-source-swf-sha256={backgroundCompanion.sourceSwfSha256}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  className="lesson-shell2__source-background-text-image"
                  draggable={false}
                  height={visualSkin.authoredStage.height}
                  onError={() => setBackgroundCompanionLoadStatus({
                    assetKey: backgroundCompanionAssetKey,
                    status: 'error',
                  })}
                  onLoad={(event) =>
                    validateBackgroundCompanionImage(event.currentTarget)}
                  ref={validateBackgroundCompanionImage}
                  src={`${backgroundCompanion.asset}?sha256=${backgroundCompanion.assetSha256}`}
                  width={visualSkin.authoredStage.width}
                />
              </div>
            : null}

          {backgroundCompanionStatus === 'error'
            ? <p
                aria-live="assertive"
                aria-hidden={stageOverlayOpen ? true : undefined}
                className="lesson-shell2__host-composite-integrity-error"
                inert={stageOverlayOpen ? true : undefined}
                role="alert"
              >
                {spanish
                  ? 'El fondo compuesto ligado a la fuente no superó la verificación de integridad.'
                  : 'The source-bound composite background failed integrity verification.'}
              </p>
            : null}

          <div
            className="lesson-shell2__stage"
            data-authored-stage={stageIdentity}
            data-loaded-swf-host-composite={
              loadedSwfHostComposite ? 'true' : 'false'
            }
            inert={stageOverlayOpen ? true : undefined}
            aria-hidden={stageOverlayOpen ? true : undefined}
          >
            {stage}
          </div>

          <div
            aria-hidden="true"
            className="lesson-shell2__source-chrome"
            inert={stageOverlayOpen ? true : undefined}
          >
            {/* The exact 800 × 600 FFDec root-frame candidate is used only for
                the top and bottom shell bands. The live page renderer remains
                a separate full-stage layer beneath it. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              className="lesson-shell2__source-chrome-image lesson-shell2__source-chrome-image--top"
              height={visualSkin.authoredStage.height}
              src={visualSkin.chromeAsset}
              width={visualSkin.authoredStage.width}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              className="lesson-shell2__source-chrome-image lesson-shell2__source-chrome-image--bottom"
              height={visualSkin.authoredStage.height}
              src={bottomChromeAsset}
              width={visualSkin.authoredStage.width}
            />
          </div>

          <div
            aria-hidden={legacyHitControlsInert ? true : undefined}
            aria-label={spanish ? 'Controles superiores de la lección' : 'Lesson header controls'}
            className="lesson-shell2__legacy-header-hits"
            data-responsive-focus-surface="legacy"
            inert={legacyHitControlsInert ? true : undefined}
            role="group"
          >
            <button
              aria-label={spanish ? 'Abrir ayuda' : 'Open help'}
              aria-pressed={activeTool === 'help'}
              className="lesson-shell2__legacy-hit lesson-shell2__legacy-hit--help"
              data-responsive-focus-key="help"
              onClick={(event) => toggleTool('help', event.currentTarget)}
              type="button"
            />
            <button
              aria-label={spanish ? 'Volver a la ubicación anterior' : 'Back to previous location'}
              className="lesson-shell2__legacy-hit lesson-shell2__legacy-hit--header-previous"
              data-lesson-nav="header-back"
              data-responsive-focus-key="header-back"
              onClick={onHeaderBack}
              type="button"
            />
            <button
              aria-controls={exitPromptId}
              aria-expanded={exitPromptOpen}
              aria-haspopup="dialog"
              aria-label={spanish ? 'Salir a la biblioteca' : 'Exit to library'}
              className="lesson-shell2__legacy-hit lesson-shell2__legacy-hit--exit"
              data-exit-trigger="legacy-source-hit-area"
              data-responsive-focus-key="exit"
              disabled={Boolean(stageOverlay)}
              onClick={(event) => requestExit(event.currentTarget)}
              type="button"
            />
          </div>

          <nav
            aria-hidden={legacyHitControlsInert ? true : undefined}
            aria-label={spanish ? 'Herramientas heredadas' : 'Legacy lesson tools'}
            className="lesson-shell2__legacy-tools"
            data-responsive-focus-surface="legacy"
            inert={legacyHitControlsInert ? true : undefined}
          >
            <button
              aria-controls={mapPanelId}
              aria-expanded={mapOpen}
              className="lesson-shell2__legacy-tool lesson-shell2__legacy-tool--map"
              data-course-map-trigger="legacy-source-hit-area"
              data-responsive-focus-fallback="true"
              data-responsive-focus-key="map"
              onClick={(event) => toggleMap(event.currentTarget)}
              ref={mapButtonRef}
              type="button"
            >
              <LegacyToolFace
                file="lesson-shell-map-up.png"
                height={42}
                label={spanish ? 'Mapa' : 'Map'}
                visualSkin={visualSkin}
                width={136}
              />
              <span className="sr-only">{spanish ? 'Mapa' : 'Map'}</span>
            </button>
            <button
              aria-controls={toolPanelId}
              aria-expanded={activeTool === 'key-terms'}
              aria-pressed={activeTool === 'key-terms'}
              className="lesson-shell2__legacy-tool lesson-shell2__legacy-tool--key-terms"
              data-responsive-focus-key="key-terms"
              onClick={(event) => toggleTool('key-terms', event.currentTarget)}
              type="button"
            >
              <LegacyToolFace
                file="lesson-shell-key-terms-up.png"
                height={42}
                label={spanish ? 'Términos' : 'Key Terms'}
                visualSkin={visualSkin}
                width={136}
              />
              <span className="sr-only">{spanish ? 'Términos clave' : 'Key Terms'}</span>
            </button>
            <button
              aria-controls={toolPanelId}
              aria-expanded={activeTool === 'calculator'}
              aria-pressed={activeTool === 'calculator'}
              className="lesson-shell2__legacy-tool lesson-shell2__legacy-tool--calculator"
              data-responsive-focus-key="calculator"
              onClick={(event) => toggleTool('calculator', event.currentTarget)}
              type="button"
            >
              <LegacyToolFace
                file="lesson-shell-calculator-up.png"
                height={42}
                label={spanish ? 'Calculadora' : 'Calculator'}
                visualSkin={visualSkin}
                width={135}
              />
              <span className="sr-only">{spanish ? 'Calculadora' : 'Calculator'}</span>
            </button>
          </nav>

          <div
            aria-label={candidateMode
              ? (spanish
                  ? 'Controles visuales heredados con transporte moderno de auditoría'
                  : 'Legacy visuals with modern audit transport')
              : (spanish ? 'Controles de la lección' : 'Lesson controls')}
            aria-hidden={legacyHitControlsInert ? true : undefined}
            className="lesson-shell2__media-hits"
            data-control-origin="modern-functional-equivalent"
            data-responsive-focus-surface="legacy"
            data-source-transport-parity="not-established"
            data-transport-mode={playbackTransportMode}
            inert={legacyHitControlsInert ? true : undefined}
            role="group"
          >
            <button
              aria-label={spanish ? 'Página anterior' : 'Previous page'}
              className="lesson-shell2__legacy-hit lesson-shell2__legacy-hit--previous"
              data-lesson-nav="footer-previous"
              data-responsive-focus-key="previous"
              disabled={previousDisabled}
              onClick={onPrevious}
              type="button"
            >
              <LegacyNavigationControlFace
                direction="previous"
                visualSkin={visualSkin}
              />
            </button>
            <button
              aria-label={spanish ? 'Repetir página' : 'Replay page'}
              className="lesson-shell2__legacy-hit lesson-shell2__legacy-hit--replay"
              data-responsive-focus-key="replay"
              disabled={!runtimeAvailable}
              onClick={onReplay}
              type="button"
            />
            {candidateMode
              ? <>
                  <button
                    aria-label={spanish
                      ? `Retroceder ${normalizedPlaybackStep} fotogramas para inspección visual`
                      : `Inspect ${normalizedPlaybackStep} frames backward`}
                    className="lesson-shell2__legacy-hit lesson-shell2__legacy-hit--rewind"
                    data-responsive-focus-key="rewind"
                    disabled={
                      !playbackSeekAvailable || normalizedPlaybackFrame <= 1
                    }
                    onClick={() => onPlaybackSeek(
                      normalizedPlaybackFrame - normalizedPlaybackStep,
                    )}
                    type="button"
                  >
                    {visualSkin.controlAssets.kind ===
                      'source-derived-diagnostic-candidate'
                      ? <LegacyControlImage
                          assetRoot={visualSkin.controlAssets.root}
                          file="lesson-shell-rewind-up.png"
                          height={42}
                          width={42}
                        />
                      : <span aria-hidden="true">«</span>}
                  </button>
                  <label
                    className="lesson-shell2__legacy-timeline"
                    data-frame-domain={playbackFrameDomain}
                    style={timelineStyle}
                  >
                    <span className="sr-only">{spanish
                      ? 'Inspeccionar fotograma de la animación'
                      : 'Inspect animation frame'}</span>
                    <input
                      aria-valuetext={spanish
                        ? `Fotograma ${normalizedPlaybackFrame} de ${normalizedPlaybackFrameCount}`
                        : `Frame ${normalizedPlaybackFrame} of ${normalizedPlaybackFrameCount}`}
                      disabled={!playbackSeekAvailable}
                      data-responsive-focus-key="timeline"
                      max={normalizedPlaybackFrameCount}
                      min="1"
                      onChange={(event) =>
                        onPlaybackSeek(Number(event.target.value))}
                      step="1"
                      type="range"
                      value={normalizedPlaybackFrame}
                    />
                  </label>
                  <button
                    aria-label={spanish
                      ? `Avanzar ${normalizedPlaybackStep} fotogramas para inspección visual`
                      : `Inspect ${normalizedPlaybackStep} frames forward`}
                    className="lesson-shell2__legacy-hit lesson-shell2__legacy-hit--forward"
                    data-responsive-focus-key="forward"
                    disabled={
                      !playbackSeekAvailable ||
                        normalizedPlaybackFrame >= normalizedPlaybackFrameCount
                    }
                    onClick={() => onPlaybackSeek(
                      normalizedPlaybackFrame + normalizedPlaybackStep,
                    )}
                    type="button"
                  >
                    {visualSkin.controlAssets.kind ===
                      'source-derived-diagnostic-candidate'
                      ? <LegacyControlImage
                          assetRoot={visualSkin.controlAssets.root}
                          file="lesson-shell-forward-up.png"
                          height={42}
                          width={42}
                        />
                      : <span aria-hidden="true">»</span>}
                  </button>
                </>
              : null}
            <button
              aria-label={paused
                ? supportOpen
                  ? (spanish
                      ? 'Una herramienta de apoyo mantiene la animación en pausa'
                      : 'A support tool keeps animation paused')
                  : playbackInspectionActive
                  ? (spanish
                      ? 'Continuar desde el fotograma inspeccionado'
                      : 'Continue from inspected frame')
                  : (spanish ? 'Reanudar animación' : 'Resume animation')
                : (spanish ? 'Pausar animación' : 'Pause animation')}
              aria-pressed={paused}
              className="lesson-shell2__legacy-hit lesson-shell2__legacy-hit--pause"
              data-frame-inspection-action={playbackInspectionActive
                ? 'resume-current-js-from-inspected-frame'
                : 'toggle-pause'}
              data-responsive-focus-key="pause"
              disabled={
                !runtimeAvailable || supportOpen
              }
              onClick={() => playbackInspectionActive
                ? onPlaybackResumeFromInspection()
                : onPausedChange(!paused)}
              type="button"
            >
              {paused
                && visualSkin.controlAssets.kind === 'source-derived-diagnostic-candidate'
                ? <LegacyControlImage assetRoot={visualSkin.controlAssets.root} file="lesson-shell-play-up.png" height={27} width={27} />
                : null}
            </button>
            <div
              className="lesson-shell2__legacy-volume"
              data-control-origin="ffdec-actionscript-static-candidate"
              data-mute-restore-parity="original-runtime-not-established"
              data-muted={volume === 0 ? 'true' : 'false'}
              style={volumeStyle}
            >
              <button
                aria-label={volume === 0
                  ? (spanish ? 'Restaurar volumen' : 'Restore volume')
                  : (spanish ? 'Silenciar' : 'Mute')}
                aria-pressed={volume === 0}
                className="lesson-shell2__legacy-mute"
                data-responsive-focus-key="mute"
                disabled={!runtimeAvailable || !audioAvailable}
                onClick={toggleMute}
                type="button"
              >
                {visualSkin.controlAssets.kind ===
                    'source-derived-diagnostic-candidate'
                  ? <LegacyControlImage
                      assetRoot={visualSkin.controlAssets.root}
                      file={volume === 0
                        ? 'lesson-shell-volume-muted-icon-up.png'
                        : 'lesson-shell-volume-icon-up.png'}
                      height={42}
                      width={42}
                    />
                  : <span aria-hidden="true">{volume === 0 ? '🔇' : '🔊'}</span>}
              </button>
              <span aria-hidden="true" className="lesson-shell2__volume-meter">
                <span />
              </span>
              <label className="lesson-shell2__legacy-volume-slider">
                <span className="sr-only">{spanish ? 'Volumen' : 'Volume'}</span>
                <input
                  aria-label={spanish ? 'Volumen' : 'Volume'}
                  data-responsive-focus-key="volume"
                  disabled={!runtimeAvailable || !audioAvailable}
                  max="1"
                  min="0"
                  onChange={(event) =>
                    onVolumeChange(Number(event.target.value))}
                  step=".1"
                  type="range"
                  value={volume}
                />
              </label>
            </div>
            <button
              aria-label={nextControlLabel}
              className="lesson-shell2__legacy-hit lesson-shell2__legacy-hit--next"
              data-lesson-nav="footer-next"
              data-responsive-focus-key="next"
              disabled={nextDisabled}
              onClick={onNext}
              type="button"
            >
              <LegacyNavigationControlFace
                direction="next"
                visualSkin={visualSkin}
              />
            </button>
          </div>

          {exitPromptOpen
            ? <LegacyExitPrompt
                authoredStage={visualSkin.authoredStage}
                evidence={visualSkin.exitPrompt}
                id={exitPromptId}
                locale={locale}
                onCancel={cancelExit}
                onConfirmExit={onExit}
              />
            : stageOverlay}
        </div>

        {pageInteractionCompanionTargetId
          ? <div
              aria-hidden={stageOverlayOpen ? true : undefined}
              className="lesson-shell2__page-interaction-companion"
              data-page-interaction-companion-host="true"
              id={pageInteractionCompanionTargetId}
              inert={stageOverlayOpen ? true : undefined}
            />
          : null}

        {learningSupport
          ? <div
              aria-hidden={stageOverlayOpen ? true : undefined}
              className="lesson-shell2__learning-support"
              inert={stageOverlayOpen ? true : undefined}
            >
              {learningSupport}
            </div>
          : null}

        <div
          aria-describedby={candidateMode ? transportBoundaryId : undefined}
          aria-label={spanish ? 'Controles modernos de la lección' : 'Modern lesson controls'}
          aria-hidden={stageOverlayOpen ? true : undefined}
          className="lesson-shell2__modern-toolbar"
          data-responsive-focus-surface="modern-wide"
          data-tool-origin="modern-functional-equivalent"
          inert={stageOverlayOpen ? true : undefined}
          role="group"
        >
          <span
            className="lesson-shell2__modern-context"
          >
            {spanish ? 'Controles modernos' : 'Modern controls'}
          </span>
          <div
            className="lesson-shell2__modern-completion"
            data-compact-landscape-completion="true"
          >
            <progress
              aria-label={spanish
                ? 'Progreso de la lección'
                : 'Lesson completion'}
              aria-valuetext={`${completionPercent}% · ${completionLabel}`}
              max={100}
              value={completionPercent}
            >{completionPercent}%</progress>
            <span aria-hidden="true">{spanish
              ? `Progreso ${completionPercent}%`
              : `Progress ${completionPercent}%`}</span>
          </div>
          <button
            aria-controls={mapPanelId}
            aria-expanded={mapOpen}
            data-course-map-trigger="modern-accessible-control"
            data-responsive-focus-fallback="true"
            data-responsive-focus-key="map"
            onClick={(event) => toggleMap(event.currentTarget)}
            type="button"
          >
            {spanish ? 'Mapa' : 'Map'}
          </button>
          <button
            aria-controls={toolPanelId}
            aria-expanded={activeTool === 'help'}
            aria-pressed={activeTool === 'help'}
            data-responsive-focus-key="help"
            onClick={(event) => toggleTool('help', event.currentTarget)}
            type="button"
          >
            {spanish ? 'Ayuda' : 'Help'}
          </button>
          <button
            aria-controls={exitPromptId}
            aria-expanded={exitPromptOpen}
            aria-haspopup="dialog"
            data-exit-trigger="modern-accessible-control"
            data-responsive-focus-key="exit"
            disabled={Boolean(stageOverlay)}
            onClick={(event) => requestExit(event.currentTarget)}
            type="button"
          >
            {spanish ? 'Salir' : 'Exit'}
          </button>
          <button
            data-lesson-nav="modern-header-back"
            data-responsive-focus-key="header-back"
            onClick={onHeaderBack}
            type="button"
          >
            {spanish ? 'Volver' : 'Back'}
          </button>
          <Link
            aria-label={spanish
              ? 'Cambiar el idioma de la lección a inglés'
              : 'Switch lesson language to Spanish'}
            data-modern-language-switch="true"
            data-responsive-focus-key={spanish ? 'language-en' : 'language-es'}
            href={courseHref}
            locale={spanish ? 'en' : 'es'}
            onClick={rememberLanguageRouteFocusIntent}
          >
            {spanish ? 'EN' : 'ES'}
          </Link>
          <button
            aria-controls={toolPanelId}
            aria-expanded={activeTool === 'key-terms'}
            aria-pressed={activeTool === 'key-terms'}
            data-responsive-focus-key="key-terms"
            onClick={(event) => toggleTool('key-terms', event.currentTarget)}
            type="button"
          >
            {spanish ? 'Términos' : 'Key Terms'}
          </button>
          <button
            aria-controls={toolPanelId}
            aria-expanded={activeTool === 'calculator'}
            aria-pressed={activeTool === 'calculator'}
            data-responsive-focus-key="calculator"
            onClick={(event) => toggleTool('calculator', event.currentTarget)}
            type="button"
          >
            {spanish ? 'Calculadora' : 'Calculator'}
          </button>
          <button
            data-responsive-focus-key="replay"
            disabled={!runtimeAvailable}
            onClick={onReplay}
            type="button"
          >
            {spanish ? 'Repetir' : 'Replay'}
          </button>
          {candidateMode
            ? <button
                data-responsive-focus-key="rewind"
                disabled={!playbackSeekAvailable || normalizedPlaybackFrame <= 1}
                onClick={() => onPlaybackSeek(
                  normalizedPlaybackFrame - normalizedPlaybackStep,
                )}
                type="button"
              >
                {spanish
                  ? `−${normalizedPlaybackStep} fotogramas`
                  : `−${normalizedPlaybackStep} frames`}
              </button>
            : null}
          <button
            aria-pressed={paused}
            data-frame-inspection-action={playbackInspectionActive
              ? 'resume-current-js-from-inspected-frame'
              : 'toggle-pause'}
            data-responsive-focus-key="pause"
            disabled={
              !runtimeAvailable || supportOpen
            }
            onClick={() => playbackInspectionActive
              ? onPlaybackResumeFromInspection()
              : onPausedChange(!paused)}
            type="button"
          >
            {paused && !playbackInspectionActive && !supportOpen
              ? (spanish ? 'Continuar' : 'Resume')
              : supportOpen
                ? (spanish ? 'Herramienta en pausa' : 'Support tool paused')
                : playbackInspectionActive
                ? (spanish
                    ? 'Continuar desde el fotograma'
                    : 'Continue from frame')
                : (spanish ? 'Pausa' : 'Pause')}
          </button>
          {candidateMode
            ? <>
                <button
                  data-responsive-focus-key="forward"
                  disabled={
                    !playbackSeekAvailable ||
                      normalizedPlaybackFrame >= normalizedPlaybackFrameCount
                  }
                  onClick={() => onPlaybackSeek(
                    normalizedPlaybackFrame + normalizedPlaybackStep,
                  )}
                  type="button"
                >
                  {spanish
                    ? `+${normalizedPlaybackStep} fotogramas`
                    : `+${normalizedPlaybackStep} frames`}
                </button>
                <span
                  aria-hidden="true"
                  className="lesson-shell2__modern-transport-summary"
                  data-compact-transport-summary="true"
                >
                  {playbackTransportMode === 'visual-frame-inspector'
                    ? (spanish
                        ? 'Paridad del transporte de Flash: no establecida'
                        : 'Flash transport parity: not established')
                    : (spanish
                        ? 'Inspección de fotogramas no disponible'
                        : 'Frame inspection unavailable')}
                </span>
                <label className="lesson-shell2__modern-timeline">
                  <span>{spanish ? 'Inspeccionar fotograma' : 'Inspect frame'}</span>
                  <input
                    aria-valuetext={spanish
                      ? `Fotograma ${normalizedPlaybackFrame} de ${normalizedPlaybackFrameCount}`
                      : `Frame ${normalizedPlaybackFrame} of ${normalizedPlaybackFrameCount}`}
                    data-responsive-focus-key="timeline"
                    disabled={!playbackSeekAvailable}
                    max={normalizedPlaybackFrameCount}
                    min="1"
                    onChange={(event) =>
                      onPlaybackSeek(Number(event.target.value))}
                    step="1"
                    type="range"
                    value={normalizedPlaybackFrame}
                  />
                </label>
              </>
            : null}
          <label>
            <span>{spanish ? 'Volumen' : 'Volume'}</span>
            <input
              aria-label={spanish ? 'Volumen' : 'Volume'}
              data-responsive-focus-key="volume"
              disabled={!runtimeAvailable || !audioAvailable}
              max="1"
              min="0"
              onChange={(event) => onVolumeChange(Number(event.target.value))}
              step=".1"
              type="range"
              value={volume}
            />
          </label>
          <button
            aria-pressed={volume === 0}
            data-responsive-focus-key="mute"
            disabled={!runtimeAvailable || !audioAvailable}
            onClick={toggleMute}
            type="button"
          >
            {volume === 0
              ? (spanish ? 'Restaurar volumen' : 'Restore volume')
              : (spanish ? 'Silenciar' : 'Mute')}
          </button>
        </div>

        {candidateMode
          ? <p
              className="lesson-shell2__transport-boundary"
              aria-hidden={stageOverlayOpen ? true : undefined}
              data-source-transport-parity="not-established"
              data-transport-mode={playbackTransportMode}
              id={transportBoundaryId}
              inert={stageOverlayOpen ? true : undefined}
            >
              {playbackTransportMode === 'visual-frame-inspector'
                ? (spanish
                    ? 'La inspección de fotogramas es una ayuda moderna de auditoría: pausa, silencia y reconstruye el renderer. “Continuar desde el fotograma” reanuda la reproducción JavaScript actual; no afirma paridad con Rewind/Forward de Flash.'
                    : 'Frame inspection is a modern audit aid: it pauses, silences, and reconstructs the renderer. “Continue from frame” resumes current JavaScript playback; it does not claim Flash Rewind/Forward parity.')
                : (spanish
                    ? 'La inspección de fotogramas permanece desactivada porque este renderer no declara una reconstrucción segura del estado.'
                    : 'Frame inspection remains disabled because this renderer does not declare safe state reconstruction.')}
            </p>
          : null}

        <div
          aria-hidden={stageOverlayOpen ? true : undefined}
          className="lesson-shell2__learning-actions"
          data-responsive-focus-surface="persistent"
          inert={stageOverlayOpen ? true : undefined}
        >
          <button
            className="lesson-shell2__learning-actions-previous"
            data-lesson-nav="action-previous"
            data-responsive-focus-key="previous"
            disabled={previousDisabled}
            onClick={onPrevious}
            type="button"
          >
            {spanish ? '← Anterior' : '← Previous'}
          </button>
          {completionAction}
          <button
            aria-label={nextControlLabel}
            className="lesson-shell2__learning-actions-next"
            data-lesson-nav="action-next"
            data-responsive-focus-key="next"
            disabled={nextDisabled}
            onClick={onNext}
            type="button"
          >
            {nextLabel}
          </button>
        </div>

        {finishedNotice}
      </article>

      <button
        aria-hidden="true"
        className="lesson-shell2__scrim lesson-shell2__scrim--tool"
        inert={stageOverlayOpen || mapModalOpen ? true : undefined}
        onClick={closeTool}
        tabIndex={-1}
        type="button"
      />
      <div
        aria-modal={toolOverlay && activeTool ? true : undefined}
        aria-hidden={stageOverlayOpen || mapModalOpen ? true : undefined}
        aria-label={toolTitle}
        className="lesson-shell2__side-panel lesson-shell2__side-panel--tool"
        id={toolPanelId}
        inert={stageOverlayOpen || mapModalOpen ? true : undefined}
        ref={toolPanelRef}
        role={toolOverlay ? 'dialog' : 'complementary'}
      >
        <header>
          <div>
            <span>{spanish ? 'Herramienta de apoyo' : 'Support tool'}</span>
            <h2>{toolTitle}</h2>
            <div
              aria-hidden="true"
              className="lesson-shell2__tool-rail-page-context"
              data-tool-rail-page-context="modern-responsive-context"
            >
              <small>
                {pageOrdinalLabel} ·{' '}
                <span lang={courseContext.section.title.sourceLanguage}>
                  {courseContext.section.title.text}
                </span>
              </small>
              <strong
                lang={courseContext.pageTitle.sourceLanguage}
                title={courseContext.pageTitle.text}
              >{courseContext.pageTitle.text}</strong>
            </div>
          </div>
          <button aria-label={spanish ? 'Cerrar herramienta' : 'Close tool'} onClick={closeTool} ref={toolCloseRef} type="button">×</button>
        </header>
        <div className="lesson-shell2__tool-content">
          <div hidden={activeTool !== 'calculator'}>
            <LegacyCalculator
              evidence={calculatorEvidence}
              onRequestClose={closeTool}
              spanish={spanish}
            />
          </div>
          {activeTool === 'key-terms'
            ? keyTermsPanel
            : activeTool === 'calculator'
              ? null
              : helpPanel}
        </div>
      </div>
    </div>

    {candidateMode
      ? <footer
          aria-hidden={backgroundUnavailable ? true : undefined}
          className="lesson-shell2__status"
          inert={backgroundUnavailable ? true : undefined}
        >
          {status}
        </footer>
      : null}
  </main>;
}
