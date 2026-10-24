'use client';

import {loadAnimationModule} from '@helpmath/demos/animation-registry';
import {
  createMemoryOnlyLessonHost,
  type LessonHostDecision,
  type LessonHostRequest,
} from '@helpmath/demos/runtime';
import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';

import {
  AnimationRuntime,
  INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE,
  type AnimationRuntimeNarrationRequest,
  type AnimationRuntimePlaybackState,
  type AnimationRuntimeSeekRequest,
} from '@/components/animation-runtime';
import type {LegacyCalculatorEvidence} from '@/components/legacy-calculator';
import {G4L12PrivateAudioCalibrationRuntime} from '@/components/g4-l12-private-audio-calibration-runtime';
import type {G4L12PrivateAudioCalibrationAsset} from '@/lib/g4-l12-private-audio-calibration-assets.server';
import type {G4L12Vb036PrivateBehavior} from '@/lib/g4-l12-vb036-private-behavior.server';
import {LegacyKeyTermsBrowser, type LegacyKeyTermSelectionRequest} from '@/components/legacy-key-terms-browser';
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
import {isLessonTypographyCandidateEnabled} from '@/lib/lesson-typography-policy';
import {hasLessonTextPresentation} from '../../../packages/demos/src/lesson-text-registry';
import type {PublicAuthStatus} from '@/lib/auth-session';
import {isGs002GameStart} from '@/lib/g4-l8-gs002-handoff';
import type {Gs002GameStart} from '../../../packages/demos/src/contract';
import {
  EMPTY_NOVA_CLIENT_CAPABILITIES,
  type NovaClientCapabilities,
} from '@/lib/nova-capabilities';
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

function pageSessionId(
  page: DescriptorDrivenLessonPlayerDescriptor['pages'][number],
): string {
  return page.placementId ?? page.animationId;
}

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
  sourceActivityAudioQa = false,
  authStatus = 'disabled',
  candidateMode,
  descriptor,
  hostPresentation = 'legacy-composite',
  locale,
  novaCapabilities = EMPTY_NOVA_CLIENT_CAPABILITIES,
  novaTutorMode = 'focus',
  privateAudioCalibrationAssets,
  privateVb036Behavior,
  releasePublished,
  reviewerMode = false,
  strictCompleteMemberCount,
}: {
  audioEnabled?: boolean;
  sourceActivityAudioQa?: boolean;
  authStatus?: PublicAuthStatus;
  candidateMode: boolean;
  descriptor: DescriptorDrivenLessonPlayerDescriptor;
  hostPresentation?: WholeLessonHostPresentation;
  locale: WholeLessonPlayerLocale;
  novaCapabilities?: NovaClientCapabilities;
  novaTutorMode?: NovaTutorMode;
  privateAudioCalibrationAssets?: readonly G4L12PrivateAudioCalibrationAsset[];
  privateVb036Behavior?: G4L12Vb036PrivateBehavior;
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
  const [keyTermSelectionRequest, setKeyTermSelectionRequest] = useState<LegacyKeyTermSelectionRequest | null>(null);
  const keyTermRevision = useRef(0);
  const keyTermReturnFocus = useRef<HTMLElement | null>(null);
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
  // Kept outside persisted progress: one035 Start owns one036 page visit.
  const gs003Visit = useRef<{descriptor: DescriptorDrivenLessonPlayerDescriptor; level: 1 | 2} | null>(null);
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
  const publicPlayRequestIdRef=useRef(0);
  const playbackCommandOrder=useRef(0);
  const [publicPlayRequest,setPublicPlayRequest]=useState<{requestId:number;commandOrder:number}|null>(null);
  const lessonNavigationHistoryRef = useRef<readonly string[]>([]);
  const currentPage = descriptor.pages.find(
    (page) => pageSessionId(page) === progress.currentAnimationId,
  ) ?? descriptor.pages[0]!;
  const currentPageSessionId = pageSessionId(currentPage);
  const modernTextCandidate = isLessonTypographyCandidateEnabled() && hasLessonTextPresentation(currentPage.animationId);
  const currentIndex = currentPage.globalPageOrdinal - 1;
  const previousPage = descriptor.pages[currentIndex - 1] ?? null;
  const nextPage = descriptor.pages[currentIndex + 1] ?? null;
  const currentSection = descriptor.sections.find(
    (section) => section.code === currentPage.sectionCode,
  )!;
  const currentLabel = currentPage.labels[progress.locale];
  const currentRenderer = currentPage.rendererAvailability;
  const currentCalibrationAssets = useMemo(() =>
    descriptor.course.grade === 4 && descriptor.course.lesson === 12
      ? privateAudioCalibrationAssets?.filter((asset) =>
        asset.animationId === currentPage.animationId) ?? []
      : [], [descriptor.course.grade, descriptor.course.lesson, privateAudioCalibrationAssets, currentPage.animationId]);
  // These typography candidates have separately source-bound audio. Original
  // Spanish tracks, where present, remain user-started within the local QA gate.
  const typographyHostAudioEnabled = sourceActivityAudioQa && modernTextCandidate
    && (currentPage.animationId === 'course-g04-l09-ts-007'
      || currentPage.animationId === 'course-g04-l09-ts-008'
      || currentPage.animationId === 'course-g04-l09-ts-006'
      || currentPage.animationId === 'course-g04-l09-ts-005'
      || currentPage.animationId === 'course-g04-l09-ts-004'
      || currentPage.animationId === 'course-g04-l09-ts-003'
      || currentPage.animationId === 'course-g04-l09-ts-002'
      || currentPage.animationId === 'course-g03-l01-vb-009'
      || currentPage.animationId === 'course-g03-l01-vb-010'
      || currentPage.animationId === 'course-g03-l01-vb-015'
      || currentPage.animationId === 'course-g04-l04-ts-002'
      || currentPage.animationId === 'course-g04-l04-fq-002'
      || currentPage.animationId === 'course-g04-l04-fq-003'
      || currentPage.animationId === 'course-g04-l08-fq-002'
      || currentPage.animationId === 'course-g04-l08-fq-003'
      || currentPage.animationId === 'course-g04-l09-fq-002'
      || currentPage.animationId === 'course-g04-l09-fq-003'
      || currentPage.animationId === 'course-g04-l09-vb-008'
      || currentPage.animationId === 'course-g04-l09-vb-009'
      || currentPage.animationId === 'course-g04-l09-vb-010'
      || currentPage.animationId === 'course-g04-l09-vb-011'
      || currentPage.animationId === 'course-g04-l09-in-002'
      || currentPage.animationId === 'course-g04-l09-in-003'
      || currentPage.animationId === 'course-g04-l09-in-004'
      || currentPage.animationId === 'course-g04-l09-in-005'
      || currentPage.animationId === 'course-g04-l09-in-006'
      || currentPage.animationId === 'course-g04-l09-in-007'
      || currentPage.animationId === 'course-g04-l09-in-008'
      || currentPage.animationId === 'course-g04-l09-in-009'
      || currentPage.animationId === 'course-g04-l09-in-010'
      || currentPage.animationId === 'course-g04-l09-in-011'
      || currentPage.animationId === 'course-g04-l09-in-012'
      || currentPage.animationId === 'course-g04-l09-in-013'
      || currentPage.animationId === 'course-g04-l09-ti-002'
      || currentPage.animationId === 'course-g04-l09-ti-003'
      || currentPage.animationId === 'course-g04-l09-ti-004'
      || currentPage.animationId === 'course-g04-l09-ti-005'
      || currentPage.animationId === 'course-g04-l09-ti-007'
      || currentPage.animationId === 'course-g04-l09-vb-005'
      || currentPage.animationId === 'course-g04-l09-vb-006'
      || currentPage.animationId === 'course-g04-l09-vb-007'
      || currentPage.animationId === 'course-g04-l09-vb-002'
      || currentPage.animationId === 'course-g04-l09-vb-003'
      || currentPage.animationId === 'course-g04-l09-vb-004'
      || currentPage.animationId === 'course-g04-l09-ir-001'
      || currentPage.animationId === 'course-g04-l04-ts-004'
      || currentPage.animationId === 'course-g04-l04-ts-005'
      || currentPage.animationId === 'course-g04-l04-ts-006'
      || currentPage.animationId === 'course-g04-l04-ts-007'
      || currentPage.animationId === 'course-g04-l04-ts-008'
      || currentPage.animationId === 'course-g04-l05-vb-002'
      || currentPage.animationId === 'course-g04-l05-vb-003'
      || currentPage.animationId === 'course-g04-l05-vb-004'
      || currentPage.animationId === 'course-g04-l05-vb-005'
      || currentPage.animationId === 'course-g04-l05-vb-008'
      || currentPage.animationId === 'course-g04-l05-in-010'
      || currentPage.animationId === 'course-g04-l05-in-005'
      || currentPage.animationId === 'course-g04-l05-in-013'
      || currentPage.animationId === 'course-g04-l05-in-016'
      || currentPage.animationId === 'course-g04-l05-in-019'
      || currentPage.animationId === 'course-g04-l05-vb-011'
      || currentPage.animationId === 'course-g04-l05-vb-013'
      || currentPage.animationId === 'course-g04-l05-vb-012'
      || currentPage.animationId === 'course-g04-l05-vb-014'
      || currentPage.animationId === 'course-g04-l05-vb-007'
      || currentPage.animationId === 'course-g04-l05-in-017'
      || currentPage.animationId === 'course-g04-l05-in-002'
      || currentPage.animationId === 'course-g04-l05-vb-015'
      || currentPage.animationId === 'course-g04-l05-in-006'
      || currentPage.animationId === 'course-g04-l08-in-003'
      || currentPage.animationId === 'course-g04-l08-in-002'
      || currentPage.animationId === 'course-g04-l08-in-007'
      || currentPage.animationId === 'course-g04-l08-in-008'
      || currentPage.animationId === 'course-g04-l08-in-009'
      || currentPage.animationId === 'course-g04-l08-in-013'
      || currentPage.animationId === 'course-g04-l08-in-014'
      || currentPage.animationId === 'course-g04-l08-in-015'
      || currentPage.animationId === 'course-g04-l08-ti-002'
      || currentPage.animationId === 'course-g04-l08-ti-003'
      || currentPage.animationId === 'course-g04-l08-ti-004'
      || currentPage.animationId === 'course-g04-l08-ti-005'
      || currentPage.animationId === 'course-g04-l08-ti-006'
      || currentPage.animationId === 'course-g04-l08-ti-007'
      || currentPage.animationId === 'course-g04-l08-gs-002'
      || currentPage.animationId === 'course-g04-l08-gs-003'
      || currentPage.animationId === 'course-g04-l08-ts-002'
      || currentPage.animationId === 'course-g04-l08-ts-006'
      || currentPage.animationId === 'course-g04-l08-in-004'
      || currentPage.animationId === 'course-g04-l08-in-005'
      || currentPage.animationId === 'course-g04-l08-in-010'
      || currentPage.animationId === 'course-g04-l08-in-011'
      || currentPage.animationId === 'course-g04-l08-in-012'
      || currentPage.animationId === 'course-g04-l08-ts-003'
      || currentPage.animationId === 'course-g04-l08-ts-004'
      || currentPage.animationId === 'course-g04-l08-ts-005'
      || currentPage.animationId === 'course-g04-l08-vb-002'
      || currentPage.animationId === 'course-g04-l08-vb-008'
      || currentPage.animationId === 'course-g04-l08-vb-010'
      || currentPage.animationId === 'course-g04-l06-in-007'
      || currentPage.animationId === 'course-g04-l06-ts-002'
      || currentPage.animationId === 'course-g04-l06-ts-003'
      || currentPage.animationId === 'course-g04-l06-ts-004'
      || currentPage.animationId === 'course-g04-l06-ts-005'
      || currentPage.animationId === 'course-g04-l06-ts-006'
      || currentPage.animationId === 'course-g04-l06-vb-002'
      || currentPage.animationId === 'course-g04-l06-vb-003'
      || currentPage.animationId === 'course-g04-l06-vb-004'
      || currentPage.animationId === 'course-g04-l06-vb-007'
      || currentPage.animationId === 'course-g04-l06-vb-010'
      || currentPage.animationId === 'course-g04-l06-vb-012'
      || currentPage.animationId === 'course-g04-l05-rw-004'
      || currentPage.animationId === 'course-g04-l05-in-007'
      || currentPage.animationId === 'course-g04-l05-in-008'
      || currentPage.animationId === 'course-g04-l05-in-011'
      || currentPage.animationId === 'course-g04-l05-in-014'
      || currentPage.animationId === 'course-g04-l05-in-015'
      || currentPage.animationId === 'course-g04-l05-in-018'
      || currentPage.animationId === 'course-g04-l05-ts-007'
      || currentPage.animationId === 'course-g04-l05-ts-008'
      || currentPage.animationId === 'course-g04-l05-ts-003'
      || currentPage.animationId === 'course-g04-l05-ts-004'
      || currentPage.animationId === 'course-g04-l05-ts-002'
      || currentPage.animationId === 'course-g04-l05-ts-005'
      || currentPage.animationId === 'course-g04-l05-ts-006'
      || currentPage.animationId === 'course-g04-l05-vb-006'
      || currentPage.animationId === 'course-g04-l05-vb-009'
      || currentPage.animationId === 'course-g04-l04-vb-002'
      || currentPage.animationId === 'course-g04-l04-vb-003'
      || currentPage.animationId === 'course-g04-l04-vb-004'
      || currentPage.animationId === 'course-g04-l04-vb-005'
      || currentPage.animationId === 'course-g04-l04-vb-008'
      || currentPage.animationId === 'course-g04-l04-vb-010'
      || currentPage.animationId === 'course-g04-l04-vb-006'
      || currentPage.animationId === 'course-g04-l04-vb-007'
      || currentPage.animationId === 'course-g04-l04-vb-009'
      || currentPage.animationId === 'course-g04-l04-vb-011'
      || currentPage.animationId === 'course-g04-l04-vb-012'
      || currentPage.animationId === 'course-g04-l04-vb-013'
      || currentPage.animationId === 'course-g04-l04-in-002'
      || currentPage.animationId === 'course-g04-l04-vb-014'
      || currentPage.animationId === 'course-g04-l04-in-004'
      || currentPage.animationId === 'course-g04-l04-in-005'
      || currentPage.animationId === 'course-g04-l04-in-010'
      || currentPage.animationId === 'course-g04-l04-in-014'
      || currentPage.animationId === 'course-g04-l04-in-015'
      || currentPage.animationId === 'course-g04-l04-in-006'
      || currentPage.animationId === 'course-g04-l04-in-011'
      || currentPage.animationId === 'course-g04-l04-in-016'
      || currentPage.animationId === 'course-g04-l04-ir-001-4cfdc375'
      || currentPage.animationId === 'course-g04-l04-in-022'
      || currentPage.animationId === 'course-g04-l04-ti-002'
      || currentPage.animationId === 'course-g04-l04-rw-003'
      || currentPage.animationId === 'course-g04-l04-rw-004'
      || currentPage.animationId === 'course-g04-l04-rw-002'
      || currentPage.animationId === 'course-g04-l04-ti-006'
      || currentPage.animationId === 'course-g04-l04-ti-004'
      || currentPage.animationId === 'course-g04-l04-ti-005'
      || currentPage.animationId === 'course-g04-l04-in-009'
      || currentPage.animationId === 'course-g04-l04-in-013'
      || currentPage.animationId === 'course-g04-l04-in-018'
      || currentPage.animationId === 'course-g04-l04-in-019'
      || currentPage.animationId === 'course-g04-l04-in-020'
      || currentPage.animationId === 'course-g04-l04-in-021'
      || currentPage.animationId === 'course-g04-l04-in-007'
      || currentPage.animationId === 'course-g04-l04-in-012'
      || currentPage.animationId === 'course-g04-l04-in-017'
      || currentPage.animationId === 'course-g04-l04-in-003'
      || currentPage.animationId === 'course-g04-l04-gs-002');
  const narrationTrackId=typographyHostAudioEnabled && progress.locale==='es'
    ? currentPage.animationId==='course-g03-l01-vb-010' ? 'vb010-spanish-host'
      : ['course-g04-l09-ti-004','course-g04-l09-ti-005','course-g04-l09-ti-007'].includes(currentPage.animationId)
        ? `${currentPage.animationId}-spanish-host-narration` : undefined
    : undefined;
  const pageAudioEnabled = audioEnabled || currentCalibrationAssets.length > 0
    || typographyHostAudioEnabled;
  const currentVb036Behavior = descriptor.course.grade === 4
    && descriptor.course.lesson === 12
    && currentPage.animationId === 'course-g04-l12-vb-036'
    ? privateVb036Behavior
    : undefined;
  const runtimeEvidenceBoundary = currentPage.runtimeEvidenceBoundary;
  const runtimeAvailable = currentRenderer.kind === 'registered';
  const currentRuntimeSeed = resolveWholeLessonRuntimeSeed(
    currentRenderer,
    progress.replayCounts[currentPageSessionId] ?? 0,
  );
  const gs002VisitOwner = useMemo(() => ({}), [descriptor, currentPageSessionId, runtimeEpoch,
    progress.locale, locale, currentRuntimeSeed, progress.replayCounts[currentPageSessionId]]);
  const currentGs002VisitOwner = useRef<object | null>(null);
  useLayoutEffect(() => {
    currentGs002VisitOwner.current = gs002VisitOwner;
    if (gs003Visit.current && (gs003Visit.current.descriptor !== descriptor
      || currentPageSessionId !== 'g04-l08-placement-036')) gs003Visit.current = null;
    return () => {if (currentGs002VisitOwner.current === gs002VisitOwner) currentGs002VisitOwner.current = null;};
  }, [gs002VisitOwner, descriptor, currentPageSessionId]);
  const lessonHost = useMemo(() => createMemoryOnlyLessonHost({
    releaseId: descriptor.releaseId,
    releaseMemberIds: [...new Set(
      descriptor.pages.map((page) => page.animationId),
    )],
    currentAnimationId: currentPage.animationId,
    enabledCapabilities: descriptor.schemaVersion === 2
      ? [...new Set([...descriptor.support.lessonHostCapabilities.filter(
          (capability) => capability !== 'audio' || pageAudioEnabled,
        ), ...(modernTextCandidate ? ['keyterm' as const] : [])])]
      : [...(pageAudioEnabled ? ['audio' as const] : []), ...(modernTextCandidate ? ['keyterm' as const] : [])],
    initialLanguage: progress.locale,
    mode: 'audit',
    releasePublished: false,
  }), [pageAudioEnabled, modernTextCandidate, currentPage.animationId, descriptor, progress.locale]);
  const [, setLessonHostRevision] = useState(0);
  const lessonHostState = lessonHost.snapshot();
  const handleLessonHostRequest = useCallback((
    request: LessonHostRequest,
    context?: Readonly<{trigger?: HTMLElement; keyTermIndexLanguage?: 'en' | 'es'}>,
  ): LessonHostDecision => {
    const decision = lessonHost.dispatch(request);
    setLessonHostRevision((revision) => revision + 1);
    if (decision.status === 'allowed') {
      if (request.type === 'open-glossary') setPaused(true);
      if (request.type === 'close-glossary') setPaused(false);
      if (request.type === 'open-keyterm' || request.type === 'open-keyterm-by-source-key') {
        keyTermReturnFocus.current = context?.trigger?.isConnected ? context.trigger : null;
        setKeyTermSelectionRequest({...(request.type === 'open-keyterm-by-source-key'
          ? {sourceKey: request.sourceKey} : {entryId: request.entryId}), revision: ++keyTermRevision.current,
          sourceAnimationId: decision.state.currentAnimationId,
          ...(context?.keyTermIndexLanguage ? {indexLanguage: context.keyTermIndexLanguage} : {})});
        if (request.playbackDisposition === 'source-stop-timeline-and-audio-until-explicit-resume') {
          setPaused(true); setSeekRequest(null);
        }
        setActiveTool('key-terms');
      }
    }
    return decision;
  }, [lessonHost]);
  const handleToolChange = useCallback((tool: LessonShellTool) => {
    const returnFocus = keyTermReturnFocus.current;
    if (activeTool === 'key-terms' && tool !== 'key-terms') {
      lessonHost.dispatch({type:'close-keyterm'});
      setKeyTermSelectionRequest(null);
      keyTermReturnFocus.current = null;
    }
    setActiveTool(tool);
    // The authored key-term stop remains in force until explicit Resume.
    if (tool === null && returnFocus?.isConnected) requestAnimationFrame(() => {
      // The tool may have scrolled away from its source term. Reveal it on return.
      if (returnFocus.isConnected) returnFocus.focus();
    });
  }, [activeTool, lessonHost]);
  useEffect(() => {
    setKeyTermSelectionRequest(null); keyTermReturnFocus.current = null;
  }, [currentPageSessionId, progress.locale, runtimeEpoch]);
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
    (page) => reviewed.has(pageSessionId(page)),
  ).length;
  const completionPercent = registeredPages.length
    ? Math.round((reviewedRegisteredCount / registeredPages.length) * 100)
    : 0;
  const requiredMemberCount =
    descriptor.course.expectedReleaseMemberCount;
  const descriptorMembershipIsValid = descriptor.course.activePageCount ===
      descriptor.pages.length &&
    descriptor.course.expectedReleaseMemberCount ===
      descriptor.pages.length + descriptor.course.courseShellCount;
  const strictCompletion = descriptorMembershipIsValid &&
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
      (page) => pageSessionId(page) === currentPageSessionId,
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
  }, [currentPageSessionId, hydrated, navigationFocusEpoch]);

  const navigateToPage = (
    pageId: string,
    recordHistory: boolean,
    gs003Level?: 1 | 2,
  ) => {
    currentGs002VisitOwner.current = null;
    gs003Visit.current = gs003Level === undefined ? null : {descriptor, level: gs003Level};
    if (recordHistory) {
      lessonNavigationHistoryRef.current = appendLegacyLessonHistory(
        lessonNavigationHistoryRef.current,
        currentPageSessionId,
        pageId,
      );
    }
    setProgress((value) =>
      visitWholeLessonPage(value, descriptor, pageId)
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
    setPublicPlayRequest(null);
  };
  const handleGs002GameStart = (request: Gs002GameStart): boolean => {
    if (currentGs002VisitOwner.current !== gs002VisitOwner || !isGs002GameStart(request)
      || descriptor.course.grade !== 4 || descriptor.course.lesson !== 8
      || currentPageSessionId !== request.sourcePlacementId || currentPage.animationId !== request.sourceAnimationId
      || !runtimeAvailable || !modernTextCandidate || currentRenderer.kind !== 'registered'
      || currentRenderer.moduleKey !== request.sourceAnimationId || !nextPage
      || pageSessionId(nextPage) !== request.targetPlacementId || nextPage.animationId !== request.targetAnimationId
      || nextPage.rendererAvailability.kind !== 'registered'
      || nextPage.rendererAvailability.moduleKey !== request.targetAnimationId
      || !hasLessonTextPresentation(request.targetAnimationId)) return false;
    navigateToPage(request.targetPlacementId, true, request.level);
    return true;
  };
  const selectPage = (pageId: string) => {
    navigateToPage(pageId, true);
  };
  const selectSectionPageOrdinal = (sectionPageOrdinal: number) => {
    const destination = currentSectionPages[sectionPageOrdinal - 1];
    if (!destination || pageSessionId(destination) === currentPageSessionId) {
      return;
    }
    pendingScrubberFocusRef.current = 'section-scrubber';
    selectPage(pageSessionId(destination));
  };

  // A page counts as reviewed when its current-JS animation has actually
  // played through. A position without a registered renderer has nothing to
  // play and therefore can never be counted.
  const reviewCurrentPage = () => {
    setProgress((value) =>
      reviewWholeLessonPage(value, descriptor, currentPageSessionId)
    );
  };

  // Next only moves. Stepping past a page never records it as reviewed.
  const advance = () => {
    if (!nextPage && tourFinished) return; 
    currentGs002VisitOwner.current = null;
    gs003Visit.current = null;
    if (nextPage) {
      lessonNavigationHistoryRef.current = appendLegacyLessonHistory(
        lessonNavigationHistoryRef.current,
        currentPageSessionId,
        pageSessionId(nextPage),
      );
      setProgress((value) =>
        visitWholeLessonPage(value, descriptor, pageSessionId(nextPage))
      );
    }
    setRuntimeEpoch((value) => value + 1);
    setMapOpen(false);
    setActiveTool(null);
    setPaused(false);
    setPlaybackState(INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE);
    setSeekRequest(null);
    setNarrationRequest(null);
    setPublicPlayRequest(null);
    if (!nextPage) setTourFinished(true);
  };

  const replayCurrentPage = () => {
    if (!runtimeAvailable) return; 
    currentGs002VisitOwner.current = null;
    setProgress((value) =>
      recordWholeLessonReplay(value, descriptor, currentPageSessionId)
    );
    setRuntimeEpoch((value) => value + 1);
    setPaused(false);
    setPlaybackState(INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE);
    setSeekRequest(null);
    setNarrationRequest(null);
    setPublicPlayRequest(null);
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

  const publicPlay=()=>{
    publicPlayRequestIdRef.current++;
    setPublicPlayRequest({requestId:publicPlayRequestIdRef.current,commandOrder:++playbackCommandOrder.current});setPaused(false);
  };
  const toggleNarration = () => {
    const shouldStopNarration = playbackState.narration === 'playing'
      || playbackState.narration === 'paused';
    narrationRequestIdRef.current += 1;
    setNarrationRequest({
      action: shouldStopNarration ? 'stop' : 'play',
      requestId: narrationRequestIdRef.current,
      commandOrder:++playbackCommandOrder.current,
      ...(narrationTrackId ? {trackId:narrationTrackId} : {}),
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
    currentGs002VisitOwner.current = null;
    gs003Visit.current = null;
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.assign(learningHomeHref);
  };
  const exitToLearningHome = () => {
    currentGs002VisitOwner.current = null;
    gs003Visit.current = null;
    window.location.assign(learningHomeHref);
  };

  const restartTour = () => {
    const confirmed = window.confirm(spanish
      ? '¿Reiniciar el recorrido y borrar el progreso guardado en este navegador?'
      : 'Restart the tour and clear progress saved in this browser?');
    if (!confirmed) return;
    currentGs002VisitOwner.current = null;
    gs003Visit.current = null;
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
    setPublicPlayRequest(null);
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
        availableSectionPages.every((page) =>
          reviewed.has(pageSessionId(page))
        );
      const firstSectionPage = sectionPages[0]!;
      return <section key={section.code}>
        <h3>
          <button
            aria-current={section.code === currentSection.code
              ? 'step'
              : undefined}
            className="lesson-shell2__map-section-jump"
            data-complete={sectionReviewed ? 'true' : 'false'}
            data-section-code={section.code}
            onClick={() => selectPage(pageSessionId(firstSectionPage))}
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
            const pageId = pageSessionId(page);
            return <li key={pageId}>
              <button
                aria-current={pageId === currentPageSessionId
                  ? 'step'
                  : undefined}
                data-animation-id={page.animationId}
                data-complete={reviewed.has(pageId) ? 'true' : 'false'}
                data-placement-id={page.placementId}
                data-renderer-availability={available ? 'registered' : 'unavailable'}
                data-visited={visited.has(pageId) ? 'true' : 'false'}
                onClick={() => selectPage(pageId)}
                type="button"
              >
                <span>{available
                  ? (reviewed.has(pageId)
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
      const pageId = pageSessionId(page);
      return <li key={pageId}>
        <button onClick={() => selectPage(pageId)} type="button">
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
  const keyTermsPanel = modernTextCandidate
    ? <div className="lesson-shell2__key-terms" data-lesson-source-key-terms="true">
        <LegacyKeyTermsBrowser key={progress.locale} locale={progress.locale} selectionRequest={keyTermSelectionRequest} presentation="source-lesson"/>
      </div>
    : descriptor.schemaVersion === 2
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
      !(isLessonTypographyCandidateEnabled() && hasLessonTextPresentation(currentPage.animationId)) &&
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
    currentCalibrationAssets.length > 0
      ? `${descriptor.course.domIdPrefix}-private-audio-calibration-controls`
      : currentPage.presentation?.pageInteractionCompanionTargetIdSuffix
      ? `${descriptor.course.domIdPrefix}-${currentPage.presentation.pageInteractionCompanionTargetIdSuffix}`
      : undefined;
  const pageInteractionStageTargetId =
    currentPage.presentation?.pageInteractionStageTargetIdSuffix
      ? `${descriptor.course.domIdPrefix}-${currentPage.presentation.pageInteractionStageTargetIdSuffix}`
      : undefined;
  const PageRuntime = currentCalibrationAssets.length > 0
    ? G4L12PrivateAudioCalibrationRuntime : AnimationRuntime;
  const stage = currentRenderer.kind === 'registered'
    ? <PageRuntime
        assets={currentCalibrationAssets}
        audioEnabled={pageAudioEnabled}
        sourceActivityAudioQa={sourceActivityAudioQa}
        audioLanguage={progress.locale}
        animationId={currentPage.animationId}
        key={`${currentPageSessionId}:${runtimeEpoch}`}
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
        narrationTrackId={narrationTrackId}
        publicPlayRequest={publicPlayRequest}
        onLessonHostRequest={handleLessonHostRequest}
        onGs002GameStart={handleGs002GameStart}
        lessonPlacementId={currentPageSessionId}
        gs003EntryLevel={currentPageSessionId === 'g04-l08-placement-036'
          && gs003Visit.current?.descriptor === descriptor ? gs003Visit.current.level : undefined}
        onPlaybackComplete={reviewCurrentPage}
        onPlaybackStateChange={setPlaybackState}
        onReplay={() => {
          currentGs002VisitOwner.current = null;
          setProgress((value) => recordWholeLessonReplay(value, descriptor, currentPageSessionId));
        }}
        paused={paused}
        privateVb036Behavior={currentVb036Behavior}
        pageInteractionCompanionTargetId={pageInteractionCompanionTargetId}
        pageInteractionStageTargetId={pageInteractionStageTargetId}
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
        (page) => reviewed.has(pageSessionId(page)),
      );
      const firstSectionPage = sectionPages[0];
      return {
        code: section.code,
        title: section.labels[progress.locale].text,
        state: section.code === currentSection.code
          ? 'current'
          : allReviewed
            ? 'complete'
            : 'upcoming',
        onSelect: () => firstSectionPage && navigateToPage(
          pageSessionId(firstSectionPage),
          true,
        ),
      };
    },
  );
  const tutorContext = novaCapabilities.text
    ? tutorPageContext({
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
      })
    : undefined;

  return <div
    data-current-animation-id={currentPage.animationId}
    data-current-placement-id={currentPage.placementId}
    data-current-page={currentPage.globalPageOrdinal}
    data-hydrated={hydrated ? 'true' : 'false'}
    data-lesson-player={descriptor.schemaVersion === 2
      ? 'descriptor-driven-page-only-product-bridge'
      : 'descriptor-driven-whole-lesson-audit'}
    data-progress-kind="learner-session"
    data-progress-storage="local-device-only"
    data-renderer-availability={currentRenderer.kind}
    data-page-runtime-kind={runtimeEvidenceBoundary?.runtimeKind}
    data-page-actionscript-execution={
      runtimeEvidenceBoundary?.actionScriptExecution
    }
    data-page-natural-trace-validation={
      runtimeEvidenceBoundary?.naturalTraceValidation
    }
    data-page-audio-acceptance={runtimeEvidenceBoundary?.audioAcceptance}
    data-page-product-behavior={runtimeEvidenceBoundary?.productBehavior}
    data-page-product-visual-behavior-composite={
      runtimeEvidenceBoundary?.productVisualBehaviorComposite
    }
    data-page-replay-semantics={runtimeEvidenceBoundary?.replaySemantics}
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
      novaCapabilities={novaCapabilities}
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
      onPublicPlay={publicPlay}
      onPlaybackResumeFromInspection={resumeFromInspectedFrame}
      onPlaybackSeek={inspectFrame}
      onPrevious={() =>
        previousPage && selectPage(pageSessionId(previousPage))}
      onReplay={replayCurrentPage}
      onStageOverlayControlIntent={activeGlossaryEntry
        ? closeGlossary
        : undefined}
      onToolChange={handleToolChange}
      onVolumeChange={setVolume}
      pageComplete={runtimeAvailable && reviewed.has(currentPageSessionId)}
      pageInteractionCompanionTargetId={pageInteractionCompanionTargetId}
      pageInteractionStageTargetId={pageInteractionStageTargetId}
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
          {runtimeEvidenceBoundary
            ? <p data-page-runtime-evidence-boundary={
                runtimeEvidenceBoundary.runtimeKind
              }>
                {runtimeEvidenceBoundary.runtimeKind ===
                    'source-script-bound-product-behavior-current-js-candidate'
                  ? runtimeEvidenceBoundary.productVisualBehaviorComposite ===
                      'source-script-assignment-composite-generated-original-runtime-unvalidated'
                    ? spanish
                      ? 'La máquina de estados, el reinicio con Repetir y el compuesto visual derivado de las asignaciones del script fuente están implementados para FQ003; la capa de finalización queda oculta durante las preguntas y se activa solo en el resultado. Sigue siendo un candidato de Current-JS, no una aceptación: la traza natural, el audio, la fidelidad del runtime original, la revisión humana y la aprobación del propietario no están establecidos.'
                      : 'The state machine, Replay reset, and source-script-assignment visual composite are implemented for FQ003; the finish layer is hidden during questions and activated only for the result. This remains a Current-JS candidate, not acceptance: natural trace, audio, original-runtime fidelity, human review, and Owner approval are unestablished.'
                    : runtimeEvidenceBoundary.productVisualBehaviorComposite ===
                        'source-script-behavior-composite-generated-original-runtime-unvalidated'
                      ? spanish
                        ? 'La máquina de estados, el reinicio completo con Repetir y el compuesto visual fail-closed derivado de los scripts fuente están implementados para esta página VB/TS. Sigue siendo un candidato de Current-JS, no una aceptación: la ejecución AVM1, la traza natural, la animación de feedback, el audio, la fidelidad del runtime original, la revisión humana y la aprobación del propietario no están establecidos.'
                        : 'The state machine, complete Replay reset, and fail-closed source-script-derived visual composite are implemented for this VB/TS page. This remains a Current-JS candidate, not acceptance: AVM1 execution, natural trace, feedback animation, audio, original-runtime fidelity, human review, and Owner approval are unestablished.'
                      : spanish
                        ? 'Esta página usa un candidato de comportamiento JavaScript mantenible y ligado a los scripts de la fuente. Los controles del producto y el reinicio completo de su estado con Repetir están implementados. El compuesto visual de comportamiento, la traza natural, el audio y la paridad del runtime original aún no están establecidos.'
                        : 'This page uses a maintainable JavaScript behavior candidate bound to the source scripts. Product controls and complete product-state reset on Replay are implemented. The behavior-aware visual composite, natural trace, audio, and original-runtime parity remain unestablished.'
                  : spanish
                    ? 'Esta página usa un candidato JavaScript de fotogramas estáticos ligado a la fuente. El ActionScript original, la traza natural, el audio y la semántica original de Replay aún no están establecidos; Replay solo reinicia el renderizador actual.'
                    : 'This page uses a source-bound static-frame JavaScript candidate. Original ActionScript, natural trace, audio, and original Replay semantics are not yet established; Replay only restarts the current renderer.'}
              </p>
            : null}
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
