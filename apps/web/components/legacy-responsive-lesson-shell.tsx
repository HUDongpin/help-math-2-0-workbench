'use client';

import type {CSSProperties, ReactNode} from 'react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  AnimationRuntimeNarrationStatus,
} from '@/components/animation-runtime';
import {
  LegacyCalculator,
  type LegacyCalculatorEvidence,
} from '@/components/legacy-calculator';
import {LegacyExitPrompt} from '@/components/legacy-exit-prompt';
import {
  LessonNovaClassroomBand,
  LessonNovaTutor,
  NovaSparkle,
  type NovaSupportTab,
} from '@/components/lesson-nova-tutor';
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
import {
  NOVA_TUTOR_GATEWAY,
  type NovaTutorModel,
} from '@/lib/nova-provider-contract';
import {
  wholeLessonContentPlane,
  type WholeLessonHostPresentation,
} from '@/lib/whole-lesson-host-presentation';
import {
  tutorStageFrameSnapshot,
  type NovaTutorMode,
  type TutorFrameSnapshot,
  type TutorPageContext,
} from '@/lib/tutor-integration';
import type {
  WholeLessonBackgroundCompanion,
  WholeLessonChromeTitleBand,
  WholeLessonControlAssets,
  WholeLessonExitPromptVisualEvidence,
  WholeLessonResumePromptVisualEvidence,
} from '@/lib/whole-lesson-player-descriptor';

export type LessonShellTool = 'help' | 'key-terms' | 'calculator' | null;

/**
 * One entry in the lesson's section spine. The spine is the widescreen
 * replacement for the course-map rail: it shows where the learner is in the
 * lesson's own named sequence rather than listing every page.
 */
export interface LessonShellSection {
  readonly code: string;
  readonly title: string;
  readonly state: 'complete' | 'current' | 'upcoming';
  readonly onSelect: () => void;
}

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
  chromeTitleBand?: WholeLessonChromeTitleBand;
  controlAssets: WholeLessonControlAssets;
  backgroundCompanion?: WholeLessonBackgroundCompanion;
  exitPrompt?: WholeLessonExitPromptVisualEvidence;
  resumePrompt?: WholeLessonResumePromptVisualEvidence;
  layoutId: 'help-math-course-shell-800x600-v1';
  /**
   * Which host presentation the player resolved for this lesson. Defaults to
   * the legacy composite, so an omitted value renders exactly as before.
   */
  presentation?: WholeLessonHostPresentation;
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
  /**
   * True when the active locale has no source string and the English one is
   * standing in. The shell never invents a translation; it reports the gap and
   * marks the text with its real `lang`, so a Spanish screen reader still
   * pronounces an English title as English.
   */
  readonly usesEnglishFallback?: boolean;
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
  modernWidePresentation = false,
}: {
  accessibleControlFallback: boolean;
  coarsePointerAvailable: boolean;
  companionCanRemainVisible: boolean;
  /**
   * The widescreen presentation draws no chrome, so the source hit areas have
   * no artwork under them. The labelled controls are then the only control
   * surface, not a second copy of one.
   */
  modernWidePresentation?: boolean;
}) {
  return modernWidePresentation ||
    accessibleControlFallback ||
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

/**
 * Narration is how a language learner receives the lesson, so it gets a named,
 * permanent seat in the chrome rather than a button that only appears when a
 * browser refuses autoplay. The control reads the same in every state; only
 * the state line and the treatment change.
 *
 * `unavailable` and `waiting` are reported, not actionable: the page either
 * carries no narration, or carries narration that is bound to the timeline and
 * has nothing to start on demand. Both stay in place as a disabled control so
 * the bar never reflows and the learner never has to look for it.
 */
function narrationCopy(
  status: AnimationRuntimeNarrationStatus,
  spanish: boolean,
) {
  if (status === 'unavailable') {
    return spanish
      ? {action: 'Esta página no tiene audio', hint: null}
      : {action: 'No audio on this page', hint: null};
  }
  if (status === 'waiting') {
    return spanish
      ? {action: 'El audio acompaña la página', hint: null}
      : {action: 'Audio plays with the page', hint: null};
  }
  if (status === 'playing') {
    return spanish
      ? {action: 'Detener el audio', hint: null}
      : {action: 'Stop the audio', hint: null};
  }
  if (status === 'blocked') {
    return spanish
      ? {action: 'Reproducir el audio', hint: 'Pulsa para empezar'}
      : {action: 'Play the audio', hint: 'Press to start'};
  }
  return spanish
    ? {action: 'Reproducir el audio', hint: null}
    : {action: 'Play the audio', hint: null};
}

/**
 * What the live region says. `waiting` is deliberately silent: it is the
 * resting state a page settles into once its narration has played, and
 * announcing it would interrupt the learner for no new information.
 */
function narrationAnnouncementCopy(
  status: AnimationRuntimeNarrationStatus,
  spanish: boolean,
) {
  if (status === 'blocked') {
    return spanish
      ? 'El navegador no puede reproducir el audio todavía. Usa Narración para empezar.'
      : 'The browser cannot play the audio yet. Use Narration to start it.';
  }
  if (status === 'playing') {
    return spanish ? 'El audio se está reproduciendo.' : 'The audio is playing.';
  }
  if (status === 'idle') {
    return spanish
      ? 'El audio está listo. Usa Narración para reproducirlo.'
      : 'The audio is ready. Use Narration to play it.';
  }
  return '';
}

function LessonNarrationControl({
  locale,
  muted,
  onToggle,
  runtimeAvailable,
  status,
  surface,
}: {
  locale: 'en' | 'es';
  muted: boolean;
  onToggle: () => void;
  runtimeAvailable: boolean;
  status: AnimationRuntimeNarrationStatus;
  /**
   * Set only where the control is not already inside a focus surface. The
   * modern toolbar declares `modern-wide` for everything it holds.
   */
  surface?: ResponsiveFocusSurface;
}) {
  const spanish = locale === 'es';
  const actionable = runtimeAvailable &&
    (status === 'blocked' || status === 'idle' || status === 'playing');
  const {action, hint} = narrationCopy(status, spanish);
  const control = <button
    aria-pressed={status === 'playing'}
    className="lesson-shell2__narration"
    data-narration-muted={muted ? 'true' : 'false'}
    data-narration-status={status}
    data-responsive-focus-key="narration"
    disabled={!actionable}
    onClick={onToggle}
    type="button"
  >
    <span aria-hidden="true" className="lesson-shell2__narration-icon">
      <span /><span /><span />
    </span>
    <span className="lesson-shell2__narration-copy">
      <span aria-hidden="true" className="lesson-shell2__narration-name">
        {spanish ? 'Narración' : 'Narration'}
      </span>
      <span className="lesson-shell2__narration-action">{action}</span>
      {hint
        ? <span
            aria-hidden="true"
            className="lesson-shell2__narration-hint"
          >{hint}</span>
        : null}
    </span>
    {muted && status !== 'unavailable'
      ? <span className="lesson-shell2__narration-muted">
          {spanish ? 'Sonido apagado' : 'Sound is off'}
        </span>
      : null}
  </button>;
  return surface
    ? <div
        className="lesson-shell2__narration-slot"
        data-responsive-focus-surface={surface}
      >{control}</div>
    : control;
}

export function LegacyResponsiveLessonShell({
  activeTool,
  audioAvailable,
  backgroundCompanionVisible,
  calculatorEvidence,
  candidateMode,
  reviewerMode = false,
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
  sections,
  locale,
  mapOpen,
  mapPanel,
  narrationStatus,
  novaTutorMode = 'focus',
  nextControlLabel,
  nextDisabled,
  nextLabel,
  onMapOpenChange,
  onNarrationToggle,
  onHeaderBack,
  onExit,
  onNext,
  onPausedChange,
  onPlaybackResumeFromInspection,
  onPlaybackSeek,
  onPrevious,
  onReplay,
  onToolChange,
  onTutorEngagementChange,
  onVolumeChange,
  pageComplete,
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
  tutorContext,
  tutorVocabulary = [],
  visualSkin,
  volume,
}: {
  activeTool: LessonShellTool;
  audioAvailable: boolean;
  backgroundCompanionVisible: boolean;
  calculatorEvidence: LegacyCalculatorEvidence;
  candidateMode: boolean;
  reviewerMode?: boolean;
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
  sections?: readonly LessonShellSection[];
  locale: 'en' | 'es';
  mapOpen: boolean;
  mapPanel: ReactNode;
  narrationStatus: AnimationRuntimeNarrationStatus;
  novaTutorMode?: NovaTutorMode;
  nextControlLabel: string;
  nextDisabled: boolean;
  nextLabel: string;
  onMapOpenChange: (open: boolean) => void;
  onNarrationToggle: () => void;
  onHeaderBack: () => void;
  onExit: () => void;
  onNext: () => void;
  onPausedChange: (paused: boolean) => void;
  onPlaybackResumeFromInspection: () => void;
  onPlaybackSeek: (frame: number) => void;
  onPrevious: () => void;
  onReplay: () => void;
  onToolChange: (tool: LessonShellTool) => void;
  onTutorEngagementChange?: (engaged: boolean) => void;
  onVolumeChange: (volume: number) => void;
  pageComplete: boolean;
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
  tutorContext?: TutorPageContext;
  tutorVocabulary?: readonly string[];
  visualSkin: LegacyLessonShellVisualSkin;
  volume: number;
}) {
  const spanish = locale === 'es';
  const narrationAnnouncement = narrationAnnouncementCopy(
    narrationStatus,
    spanish,
  );
  // Frame inspection is reviewer tooling. Every control that can start a seek
  // sits behind `reviewerMode`, so a learner cannot reach an inspected frame
  // — but nothing in the component should depend on that reachability
  // argument. Gating the state itself keeps the Pause control's label, its
  // click behavior, and the inspection data attributes from ever presenting
  // frame language to a learner, however a seek came to be requested.
  //
  // This is deliberately not `candidateMode`. Every lesson is a candidate
  // today, so gating on it rendered the instruments for every audience,
  // including the executive preview. Release status still discloses itself
  // through `candidateMode`; only the instruments moved.
  const frameInspectionActive = reviewerMode && playbackInspectionActive;
  const [exitPromptOpen, setExitPromptOpen] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  // Study owns a persistent support column on wide screens. It must not turn
  // into an unsolicited modal during the first mobile render, so the viewport
  // effect below opts the desktop column in after the media query resolves.
  const [studySupportOpen, setStudySupportOpen] = useState(false);
  const [studyTab, setStudyTab] = useState<NovaSupportTab>('read');
  const [tutorSnapshot, setTutorSnapshot] =
    useState<TutorFrameSnapshot | null>(null);
  const [tutorSnapshotRevision, setTutorSnapshotRevision] = useState(0);
  const [confirmedTutorProvider, setConfirmedTutorProvider] =
    useState<NovaTutorModel | null>(null);
  const activeTutorSnapshot = tutorSnapshot?.animationId === currentAnimationId
    ? tutorSnapshot
    : null;
  const stageOverlayOpen = Boolean(stageOverlay) || exitPromptOpen;
  const mapPanelId = `${idPrefix}-course-map`;
  const toolPanelId = `${idPrefix}-tool-panel`;
  const tutorPanelId = `${idPrefix}-nova-tutor`;
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
  // The widescreen presentation renders only the band the source chrome leaves
  // between its header and footer. Cropping is lossless because that chrome is
  // fully opaque, so nothing drawn beneath it is visible in the legacy
  // presentation either.
  const modernWide = visualSkin.presentation === 'modern-wide';
  const tutorAvailable = modernWide && Boolean(tutorContext);
  const tutorPanelVisible = tutorAvailable && (
    (novaTutorMode === 'study' && studySupportOpen) ||
    (novaTutorMode === 'focus' && tutorOpen)
  );
  const classroomBandVisible = tutorAvailable &&
    novaTutorMode === 'classroom' && tutorOpen;
  const tutorVisible = tutorAvailable && (
    novaTutorMode === 'study'
      ? studySupportOpen && studyTab === 'nova'
      : novaTutorMode === 'focus'
        ? tutorOpen && studyTab === 'nova'
        : tutorOpen
  );
  const tutorSurfaceVisible = tutorPanelVisible || classroomBandVisible;
  const contentPlane = useMemo(
    () => wholeLessonContentPlane({
      stage: visualSkin.authoredStage,
      headerHeight: visualSkin.chromeHeaderHeight,
      footerHeight: visualSkin.chromeFooterHeight,
    }),
    [
      visualSkin.authoredStage,
      visualSkin.chromeFooterHeight,
      visualSkin.chromeHeaderHeight,
    ],
  );
  // The lesson title band is authored in 800 x 600 stage pixels. Publishing it
  // as percentages of the authored plane keeps the live text locked to the
  // painted header at every rendered stage size, exactly like the chrome clips
  // above. The font size becomes a container query unit for the same reason:
  // the title has to scale with the artwork it sits on, not with the viewport.
  const chromeTitleBand = visualSkin.chromeTitleBand;
  const chromeTitleStyle = chromeTitleBand
    ? {
        '--lesson-chrome-title-color': chromeTitleBand.color,
        '--lesson-chrome-title-font': chromeTitleBand.fontFamily,
        '--lesson-chrome-title-height': `${
          (chromeTitleBand.bounds.height / visualSkin.authoredStage.height) * 100
        }%`,
        '--lesson-chrome-title-left': `${
          (chromeTitleBand.bounds.left / visualSkin.authoredStage.width) * 100
        }%`,
        '--lesson-chrome-title-size': `${
          (chromeTitleBand.fontSize / visualSkin.authoredStage.width) * 100
        }cqw`,
        '--lesson-chrome-title-top': `${
          (chromeTitleBand.bounds.top / visualSkin.authoredStage.height) * 100
        }%`,
        '--lesson-chrome-title-width': `${
          (chromeTitleBand.bounds.width / visualSkin.authoredStage.width) * 100
        }%`,
      }
    : null;
  const stageStyle = {
    ...chromeTitleStyle,
    '--lesson-chrome-bottom-clip': `${
      100 - (visualSkin.chromeFooterHeight / visualSkin.authoredStage.height) * 100
    }%`,
    '--lesson-chrome-top-clip': `${
      100 - (visualSkin.chromeHeaderHeight / visualSkin.authoredStage.height) * 100
    }%`,
    // The widescreen presentation shows only the authored content band, so the
    // stage box takes that band's aspect and the full authored plane is pushed
    // up behind it. Every value is derived from the authored stage and the
    // declared chrome heights; none is a restated measurement.
    '--lesson-stage-aspect': modernWide
      ? `${contentPlane.width} / ${contentPlane.height}`
      : `${visualSkin.authoredStage.width} / ${visualSkin.authoredStage.height}`,
    '--lesson-stage-max-height': `${
      modernWide ? contentPlane.height : visualSkin.authoredStage.height
    }px`,
    '--lesson-stage-max-width': `${visualSkin.authoredStage.width}px`,
    '--lesson-stage-viewport-fit-width': `${layoutPolicy.stageCapWidth}px`,
    '--lesson-plane-stage-height': `${contentPlane.stageHeightPercent}%`,
    '--lesson-plane-stage-top': `${contentPlane.stageTopPercent}%`,
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
  const tutorTriggerRef = useRef<HTMLButtonElement>(null);
  const supportPauseSessionRef = useRef<SupportPauseSession | null>(null);
  const exitPausedBeforeOpenRef = useRef(false);
  const lastResponsiveFocusRef = useRef<ResponsiveFocusMemory | null>(null);
  const initialStudyViewportResolvedRef = useRef(false);
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
    modernWidePresentation: modernWide,
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
  const tutorPanelModal = tutorPanelVisible && !wideViewportAvailable;
  const backgroundUnavailable = stageOverlayOpen || supportModalOpen ||
    tutorPanelModal;
  const supportOpen =
    (mapOpen && mapOverlay) || activeTool !== null;

  useEffect(() => {
    if (!tutorSurfaceVisible) return;
    let cancelled = false;
    let captureTimeout = 0;
    let capturedAtLeastOnce = false;
    // Canvas-backed lesson modules can finish their first meaningful paint
    // after code-split assets resolve. Keep the capture window open long
    // enough for a busy classroom device (and parallel browser validation)
    // while every attempt still rejects a fully transparent frame.
    const retryDelays = [80, 160, 320, 640, 1_200, 2_400] as const;
    let retryIndex = 0;
    const captureFrame = async () => {
      if (cancelled) return;
      const nextSnapshot = await tutorStageFrameSnapshot(
        legacyStageRef.current,
        currentAnimationId,
        modernWide
          ? {
              left: 0,
              top: contentPlane.top,
              width: contentPlane.width,
              height: contentPlane.height,
            }
          : undefined,
      );
      if (cancelled) return;
      if (nextSnapshot) {
        capturedAtLeastOnce = true;
        setTutorSnapshot((currentSnapshot) =>
          currentSnapshot?.animationId === nextSnapshot.animationId &&
          currentSnapshot.dataUrl === nextSnapshot.dataUrl
            ? currentSnapshot
            : nextSnapshot
        );
      } else if (!capturedAtLeastOnce && retryIndex >= retryDelays.length) {
        setTutorSnapshot(null);
      }
      if (retryIndex < retryDelays.length) {
        const delay = retryDelays[retryIndex];
        retryIndex += 1;
        captureTimeout = window.setTimeout(() => {
          void captureFrame();
        }, delay);
      }
    };
    const animationFrame = window.requestAnimationFrame(() => {
      void captureFrame();
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(captureTimeout);
    };
  }, [
    contentPlane,
    currentAnimationId,
    modernWide,
    studyTab,
    tutorSnapshotRevision,
    tutorSurfaceVisible,
  ]);

  useEffect(() => {
    // Map and tool overlays temporarily borrow playback so their controls do
    // not compete with the lesson. Nova is deliberately independent: opening,
    // using, or closing the tutor must never change the learner's transport.
    const decision = reconcileSupportPauseSession({
      currentPage,
      paused,
      playbackInspectionActive: frameInspectionActive,
      session: supportPauseSessionRef.current,
      supportOpen,
    });
    supportPauseSessionRef.current = decision.session;
    if (decision.requestedPaused !== null) {
      onPausedChange(decision.requestedPaused);
    }
  }, [
    currentPage,
    frameInspectionActive,
    onPausedChange,
    paused,
    supportOpen,
  ]);

  useEffect(() => {
    onTutorEngagementChange?.(tutorVisible);
  }, [onTutorEngagementChange, tutorVisible]);

  useEffect(() => {
    if (!tutorSurfaceVisible) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (novaTutorMode === 'study') {
        setStudySupportOpen(false);
        setStudyTab('read');
      } else {
        setTutorOpen(false);
        setStudyTab('read');
      }
      setTutorSnapshot(null);
      window.setTimeout(() => tutorTriggerRef.current?.focus(), 0);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [novaTutorMode, tutorSurfaceVisible]);

  useLayoutEffect(() => {
    const media = window.matchMedia(WIDE_FUNCTIONAL_COMPANION_MEDIA);
    const updateWideViewportAvailability = () => {
      setWideViewportAvailable(media.matches);
      if (!initialStudyViewportResolvedRef.current) {
        initialStudyViewportResolvedRef.current = true;
        setStudySupportOpen(novaTutorMode === 'study' && media.matches);
      }
    };

    updateWideViewportAvailability();
    media.addEventListener('change', updateWideViewportAvailability);
    return () => {
      media.removeEventListener('change', updateWideViewportAvailability);
    };
  }, [novaTutorMode]);

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
      // Use the stage's document position, not its transient viewport top.
      // Focusing a bottom-bar control can scroll the page just before a
      // ResizeObserver callback. A viewport-relative value then makes the
      // plane grow merely because the document moved under it — most visibly
      // while opening Nova. Adding scrollY keeps the fit stable across focus
      // scroll and lets the new support column, rather than scroll position,
      // determine the available width.
      const top = stageNode.getBoundingClientRect().top + window.scrollY;
      const containerWidth = shellNode.getBoundingClientRect().width;
      if (containerWidth <= 0) return;
      const nextPolicy = resolveLegacyLessonLayout({
        authoredStage: visualSkin.authoredStage,
        containerWidth,
        presentedPlane: modernWide ? contentPlane : undefined,
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
    contentPlane,
    modernWide,
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

  const dismissTutor = useCallback(() => {
    setTutorOpen(false);
    setStudySupportOpen(false);
    setStudyTab('read');
    setTutorSnapshot(null);
  }, []);

  const closeTutor = useCallback(() => {
    dismissTutor();
    window.setTimeout(() => tutorTriggerRef.current?.focus(), 0);
  }, [dismissTutor]);

  const toggleTutor = useCallback(() => {
    const opening = novaTutorMode === 'study'
      ? !studySupportOpen || studyTab !== 'nova'
      : novaTutorMode === 'focus'
        ? !tutorOpen || studyTab !== 'nova'
        : !tutorOpen;
    if (opening) {
      onMapOpenChange(false);
      onToolChange(null);
    }
    if (novaTutorMode === 'study') {
      setStudySupportOpen(opening);
      setStudyTab(opening ? 'nova' : 'read');
    } else if (novaTutorMode === 'focus') {
      setTutorOpen(opening);
      setStudyTab(opening ? 'nova' : 'read');
    } else {
      setTutorOpen(opening);
    }
    if (!opening) setTutorSnapshot(null);
  }, [
    novaTutorMode,
    onMapOpenChange,
    onToolChange,
    studyTab,
    studySupportOpen,
    tutorOpen,
  ]);

  const toggleMap = useCallback((trigger?: HTMLButtonElement) => {
    if (trigger) mapButtonRef.current = trigger;
    const open = !mapOpen;
    if (open && mapOverlay) {
      onToolChange(null);
    }
    if (open) dismissTutor();
    onMapOpenChange(open);
  }, [
    mapOpen,
    mapOverlay,
    onMapOpenChange,
    onToolChange,
    dismissTutor,
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
    if (nextTool) dismissTutor();
    onToolChange(nextTool);
  }, [
    activeTool,
    onMapOpenChange,
    onToolChange,
    toolOverlay,
    dismissTutor,
  ]);

  const closeMap = useCallback(() => {
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
    modernControlPresentation,
    onMapOpenChange,
  ]);

  const closeTool = useCallback(() => {
    const closingTool = activeTool;
    const rememberedTrigger = lastToolTriggerRef.current;

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
    onToolChange,
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
  // The prototype's primary yellow strip reports where the learner is in the
  // 39-page journey (Page 34 -> 87%). Earned completion remains a separate,
  // honest value in the course map and release/progress state.
  const journeyPercent = Math.round((currentPage / totalPages) * 100);
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

  // "Grade 4 · Lesson 3" / "Grado 4 · Leccion 3" -> "L3". Taking the trailing
  // number keeps this locale-independent without a new prop.
  const lessonNumberLabel = (gradeLessonLabel.match(/(\d+)\s*$/)?.[1]) ?? '';
  const sectionSpine = modernWide && sections && sections.length
    ? <nav
        aria-hidden={tutorPanelModal ? true : undefined}
        aria-label={spanish ? 'Secciones de la lección' : 'Lesson sections'}
        className="lesson-shell2__spine"
        data-responsive-focus-surface="persistent"
        inert={tutorPanelModal ? true : undefined}
      >
        <p className="lesson-shell2__spine-mark">{lessonNumberLabel
            ? `L${lessonNumberLabel} · ${courseContext.courseTitle.text}`
            : courseContext.courseTitle.text}</p>
        <ol>
          {sections.map((section) => <li key={section.code}>
            <button
              aria-current={section.state === 'current' ? 'step' : undefined}
              data-section-code={section.code}
              data-section-state={section.state}
              onClick={section.onSelect}
              type="button"
            >
              <span aria-hidden="true" className="lesson-shell2__spine-tick">
                {section.code}
              </span>
              <span className="lesson-shell2__spine-name">{section.title}</span>
            </button>
          </li>)}
        </ol>
      </nav>
    : null;
  const languageNav = <nav
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
    </nav>;
  const previousControl = <button
      className="lesson-shell2__learning-actions-previous"
      data-lesson-nav="action-previous"
      data-responsive-focus-key="previous"
      disabled={previousDisabled}
      onClick={onPrevious}
      type="button"
    >
      {spanish ? '← Anterior' : '← Previous'}
    </button>;
  const nextControl = <button
      aria-label={nextControlLabel}
      className="lesson-shell2__learning-actions-next"
      data-lesson-nav="action-next"
      data-responsive-focus-key="next"
      disabled={nextDisabled}
      onClick={onNext}
      type="button"
    >
      {nextLabel}
    </button>;
  const mapControl = <button
      aria-controls={mapPanelId}
      aria-expanded={mapOpen}
      data-course-map-trigger="modern-accessible-control"
      data-responsive-focus-fallback="true"
      data-responsive-focus-key="map"
      onClick={(event) => toggleMap(event.currentTarget)}
      type="button"
    >
      {spanish ? 'Mapa' : 'Map'}
    </button>;
  const readSupportExpanded = tutorPanelVisible && studyTab === 'read';
  const modernSupportControl = novaTutorMode === 'classroom'
    ? mapControl
    : <button
        aria-controls={tutorPanelId}
        aria-expanded={readSupportExpanded}
        aria-label={readSupportExpanded
          ? (spanish ? 'Cerrar apoyo de estudio' : 'Close study support')
          : (spanish ? 'Abrir apoyo de estudio' : 'Open study support')}
        className="lesson-shell2__study-support"
        data-responsive-focus-fallback="true"
        data-responsive-focus-key="study-support"
        onClick={() => {
          if (readSupportExpanded) {
            dismissTutor();
            return;
          }
          onMapOpenChange(false);
          onToolChange(null);
          setStudyTab('read');
          if (novaTutorMode === 'focus') {
            setTutorOpen(true);
          } else {
            setStudySupportOpen(true);
          }
        }}
        type="button"
      >
        {spanish ? 'Apoyo de estudio' : 'Study support'}
      </button>;
  const replayControl = <button
      data-responsive-focus-key="replay"
      disabled={!runtimeAvailable}
      onClick={() => {
        onReplay();
        if (tutorSurfaceVisible) {
          setTutorSnapshot(null);
          setTutorSnapshotRevision((revision) => revision + 1);
        }
      }}
      type="button"
    >
      {spanish ? 'Repetir' : 'Replay'}
    </button>;
  const pauseControl = <button
      aria-pressed={paused}
      data-frame-inspection-action={frameInspectionActive
        ? 'resume-current-js-from-inspected-frame'
        : 'toggle-pause'}
      data-responsive-focus-key="pause"
      disabled={!runtimeAvailable || supportOpen}
      onClick={() => frameInspectionActive
        ? onPlaybackResumeFromInspection()
        : onPausedChange(!paused)}
      type="button"
    >
      {paused && !frameInspectionActive && !supportOpen
        ? (spanish ? 'Continuar' : 'Resume')
        : supportOpen
          ? (spanish ? 'Herramienta en pausa' : 'Support tool paused')
          : frameInspectionActive
            ? (spanish
                ? 'Continuar desde el fotograma'
                : 'Continue from frame')
            : (spanish ? 'Pausa' : 'Pause')}
    </button>;
  const muteControl = <button
      aria-pressed={volume === 0}
      data-responsive-focus-key="mute"
      disabled={!runtimeAvailable || !audioAvailable}
      onClick={toggleMute}
      type="button"
    >
      {volume === 0
        ? (spanish ? 'Restaurar volumen' : 'Restore volume')
        : (spanish ? 'Silenciar' : 'Mute')}
    </button>;

  return <main
    data-audio-available={audioAvailable ? 'true' : 'false'}
    data-narration-status={narrationStatus}
    data-accessible-control-fallback={
      accessibleControlFallback ? 'true' : 'false'
    }
    className="whole-lesson-page lesson-shell2"
    data-candidate-mode={candidateMode ? 'true' : 'false'}
    data-reviewer-mode={reviewerMode ? 'true' : 'false'}
    data-coarse-pointer={coarsePointerAvailable ? 'true' : 'false'}
    data-current-animation-id={currentAnimationId}
    data-current-js-candidate={releaseBoundary.currentJsCandidate ? 'true' : 'false'}
    data-current-js-pages={releaseBoundary.currentJsPageCount}
    data-frame-inspection-active={frameInspectionActive ? 'true' : 'false'}
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
    data-page-complete={pageComplete ? 'true' : 'false'}
    data-earned-completion-percent={completionPercent}
    data-journey-percent={journeyPercent}
    data-host-presentation={modernWide ? 'modern-wide' : 'legacy-composite'}
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
    data-support-tool-playback="support-tools-pause-restore-nova-independent"
    data-tool-visual-authority={visualSkin.controlAssets.kind}
    data-strict-complete-members={releaseBoundary.strictCompleteMemberCount}
    data-strict-completion={releaseBoundary.strictCompletion ? 'true' : 'false'}
    data-tool-open={activeTool ? 'true' : 'false'}
    data-tutor-open={tutorSurfaceVisible ? 'true' : 'false'}
    data-tutor-interaction-open={tutorVisible ? 'true' : 'false'}
    data-tutor-frame-snapshot={tutorSurfaceVisible && activeTutorSnapshot
      ? 'available'
      : 'unavailable'}
    data-tutor-modal={tutorPanelModal ? 'true' : 'false'}
    data-tutor-mode={novaTutorMode}
    data-tutor-panel-open={tutorPanelVisible ? 'true' : 'false'}
    data-tutor-playback="independent"
    data-tutor-placement={novaTutorMode === 'classroom'
      ? 'classroom-voice-band'
      : novaTutorMode === 'study'
        ? 'study-support-region'
        : 'focus-side-column'}
    data-tutor-model={tutorContext
      ? confirmedTutorProvider ?? 'not-yet-confirmed'
      : 'unavailable'}
    data-tutor-provider={tutorContext
      ? confirmedTutorProvider
        ? NOVA_TUTOR_GATEWAY
        : 'same-origin-gateway-not-yet-confirmed'
      : 'unavailable'}
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
      {/* The strip is the only place lesson progress is reported. A page marks
          itself complete when its animation finishes, so this tick replaces the
          separate review control the learner used to have to press. */}
      <span
        className="lesson-shell2__session-page"
        data-page-complete={pageComplete ? 'true' : 'false'}
      >
        <span aria-hidden="true" className="lesson-shell2__session-page-tick">✓</span>
        {pageOrdinalLabel}
      </span>
      <LessonNarrationControl
        locale={locale}
        muted={volume === 0}
        onToggle={onNarrationToggle}
        runtimeAvailable={runtimeAvailable}
        status={narrationStatus}
        surface="persistent"
      />
      {modernWide ? null : languageNav}
    </section>

    {/* Announced outside the session bar: a compact landscape viewport hides
        that bar entirely, and a hidden live region announces nothing. */}
    <p aria-live="polite" className="sr-only">
      {pageComplete
        ? (spanish
            ? `${pageOrdinalLabel} completa`
            : `${pageOrdinalLabel} complete`)
        : ''}
    </p>

    {/* A refused autoplay arrives after the page has settled, and narration
        ends without any learner action. Both change the control silently, so
        the state is announced once here rather than from either copy of it. */}
    <p aria-live="polite" className="sr-only" data-narration-announcement="true">
      {narrationAnnouncement}
    </p>

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

      {sectionSpine}

      <article
        aria-hidden={supportModalOpen || tutorPanelModal ? true : undefined}
        className="lesson-shell2__learning-column"
        inert={supportModalOpen || tutorPanelModal ? true : undefined}
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

          {modernWide ? null : <div
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
          </div>}

          {/* The lesson's own name, as live text on the header band.
              What the chrome paints is `<CourseName>` — the product wordmark,
              identical in every lesson XML in the catalogue — and the lesson
              title `<NewTitle1>` was never drawn into that artwork at all. So
              this adds the missing string rather than covering a painted one:
              no glyph is masked, the artwork above stays untouched artwork,
              and the one name that identifies this lesson becomes selectable,
              resizable, reachable by the language layer, and speakable by a
              screen reader. */}
          {chromeTitleBand && !modernWide
            ? <p
                aria-hidden={stageOverlayOpen ? true : undefined}
                className="lesson-shell2__chrome-lesson-title"
                data-chrome-title-source-field={chromeTitleBand.sourceField}
                data-chrome-title-source-language={
                  courseContext.courseTitle.sourceLanguage
                }
                data-chrome-title-english-fallback={
                  courseContext.courseTitle.usesEnglishFallback
                    ? 'true'
                    : 'false'
                }
                inert={stageOverlayOpen ? true : undefined}
              >
                <span lang={courseContext.courseTitle.sourceLanguage}>
                  {courseContext.courseTitle.text}
                </span>
              </p>
            : null}

          {modernWide ? null : <div
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
          </div>}

          {modernWide ? null : <nav
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
          </nav>}

          {modernWide ? null : <div
            aria-label={reviewerMode
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
            {reviewerMode
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
                  : frameInspectionActive
                  ? (spanish
                      ? 'Continuar desde el fotograma inspeccionado'
                      : 'Continue from inspected frame')
                  : (spanish ? 'Reanudar animación' : 'Resume animation')
                : (spanish ? 'Pausar animación' : 'Pause animation')}
              aria-pressed={paused}
              className="lesson-shell2__legacy-hit lesson-shell2__legacy-hit--pause"
              data-frame-inspection-action={frameInspectionActive
                ? 'resume-current-js-from-inspected-frame'
                : 'toggle-pause'}
              data-responsive-focus-key="pause"
              disabled={
                !runtimeAvailable || supportOpen
              }
              onClick={() => frameInspectionActive
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
          </div>}

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

        {learningSupport && !(modernWide && tutorPanelVisible)
          ? <div
              aria-hidden={stageOverlayOpen ? true : undefined}
              className="lesson-shell2__learning-support"
              inert={stageOverlayOpen ? true : undefined}
            >
              {learningSupport}
            </div>
          : null}

        <div
          aria-describedby={reviewerMode ? transportBoundaryId : undefined}
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
          {modernWide ? previousControl : null}
          {modernWide ? pauseControl : null}
          {modernWide ? nextControl : null}
          {/* A compact landscape viewport hides the session bar, so this is the
              progress strip in that layout. It has to carry the same page
              completion state, or finishing a page would report nowhere. */}
          <div
            className="lesson-shell2__modern-completion"
            data-compact-landscape-completion="true"
            data-page-complete={pageComplete ? 'true' : 'false'}
          >
            <progress
              aria-label={spanish
                ? modernWide
                  ? 'Posición en la lección'
                  : 'Progreso de la lección'
                : modernWide
                  ? 'Lesson position'
                  : 'Lesson completion'}
              aria-valuetext={modernWide
                ? `${journeyPercent}% · ${pageOrdinalLabel} · ${completionLabel}`
                : `${completionPercent}% · ${completionLabel}`}
              data-progress-model={modernWide
                ? 'page-position'
                : 'earned-page-completion'}
              max={100}
              value={modernWide ? journeyPercent : completionPercent}
            >{modernWide ? journeyPercent : completionPercent}%</progress>
            {modernWide
              ? <>
                  <span aria-hidden="true" data-completion-position>
                    {pageOrdinalLabel}
                  </span>
                  <span aria-hidden="true" data-completion-share>
                    {spanish
                      ? `${journeyPercent}% del recorrido`
                      : `${journeyPercent}% through journey`}
                  </span>
                </>
              : <span aria-hidden="true">{pageComplete ? '✓ ' : ''}{spanish
                  ? `Progreso ${completionPercent}%`
                  : `Progress ${completionPercent}%`}</span>}
          </div>
          {/* The same reason the progress strip is mirrored here: narration is
              the lesson for a language learner, and it cannot disappear with
              the session bar when a phone is turned sideways. */}
          <LessonNarrationControl
            locale={locale}
            muted={volume === 0}
            onToggle={onNarrationToggle}
            runtimeAvailable={runtimeAvailable}
            status={narrationStatus}
          />
          {modernWide && tutorContext
            ? <button
                aria-controls={tutorPanelId}
                aria-expanded={tutorVisible}
                className="lesson-shell2__ask-nova"
                data-responsive-focus-key="ask-nova"
                onClick={toggleTutor}
                ref={tutorTriggerRef}
                type="button"
              >
                <NovaSparkle />
                <span>{spanish ? 'Preguntar a Nova' : 'Ask Nova'}</span>
              </button>
            : null}
          {modernWide ? replayControl : null}
          {modernWide ? muteControl : null}
          {modernWide ? modernSupportControl : null}
          {modernWide ? null : mapControl}
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
          {modernWide ? null : replayControl}
          {reviewerMode
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
          {modernWide ? null : pauseControl}
          {reviewerMode
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
          {modernWide ? null : muteControl}
        </div>

        {reviewerMode
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

        {modernWide ? null : <div
          aria-hidden={stageOverlayOpen ? true : undefined}
          className="lesson-shell2__learning-actions"
          data-responsive-focus-surface="persistent"
          inert={stageOverlayOpen ? true : undefined}
        >
          {previousControl}
          {nextControl}
        </div>}

        {finishedNotice}
      </article>

      {tutorPanelVisible && tutorContext
        ? <>
            <button
              aria-hidden="true"
              className="lesson-shell2__nova-scrim"
              onClick={closeTutor}
              tabIndex={-1}
              type="button"
            />
            <LessonNovaTutor
              activeTab={studyTab}
              context={tutorContext}
              defaultTab={novaTutorMode === 'study' ? 'read' : 'nova'}
              frameSnapshot={activeTutorSnapshot}
              id={tutorPanelId}
              key={`${novaTutorMode}:${currentAnimationId}`}
              locale={locale}
              modal={tutorPanelModal}
              onClose={closeTutor}
              onProviderConfirmed={setConfirmedTutorProvider}
              onTabChange={setStudyTab}
              placement={novaTutorMode === 'study' ? 'study' : 'focus'}
              readableContent={learningSupport}
              vocabulary={tutorVocabulary}
            />
          </>
        : null}

      {classroomBandVisible && tutorContext
        ? <LessonNovaClassroomBand
            context={tutorContext}
            frameSnapshot={activeTutorSnapshot}
            id={tutorPanelId}
            locale={locale}
            onClose={closeTutor}
            onProviderConfirmed={setConfirmedTutorProvider}
          />
        : null}

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
