'use client';
import type {AnimationModule, AnimationRendererProps, RendererPlaybackReport} from '../../../packages/demos/src/contract';
import React, {useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties} from 'react';
import {permitsP009StaticPracticeRequest,permitsP009StaticPracticeCompletion} from './hfr-p009-static-practice-policy';
import {permitsP010StaticPracticeRequest,permitsP010StaticPracticeCompletion} from './hfr-p010-static-practice-policy';
import {permitsP019StaticPracticeRequest,permitsP019StaticPracticeCompletion,permitsP019PausedGlossaryClose} from './hfr-p019-static-practice-policy';
import {permitsP020StaticPracticeRequest,permitsP020StaticPracticeCompletion,permitsP020PausedGlossaryClose} from './hfr-p020-static-practice-policy';
import {permitsP022StaticPracticeCompletion,permitsP022PausedGlossaryClose} from './hfr-p022-static-practice-policy';
import {permitsP026StaticPracticeCompletion,permitsP026PausedGlossaryClose} from './hfr-p026-static-practice-policy';
import {permitsP027StaticPracticeCompletion,permitsP027PausedGlossaryClose} from './hfr-p027-static-practice-policy';
import {permitsP014StaticPracticeCompletion} from './hfr-p014-static-practice-policy';
import {moduleDeclaresLessonHostRequest} from './lesson-host-request-policy';
import {lessonTypographyLanguages} from '../lib/lesson-typography-policy';
import {INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE} from './animation-runtime-types';
import type {AnimationRuntimeNarrationRequest, AnimationRuntimePlaybackState, AnimationRuntimeQuery} from './animation-runtime-types';
import {consumeRendererReport, EMPTY_RENDERER_COMPLETION, rendererClockedBlocker, rendererClockPaused, rendererNarrationDisposition} from './renderer-clocked-policy';

export interface RendererClockedRuntimeProps {
  readonly animationId: string;
  readonly animationModule: AnimationModule;
  readonly audioEnabled?: boolean;
  readonly audioLanguage?: AnimationRendererProps['lang'];
  readonly rendererLessonSession?: AnimationRendererProps['rendererLessonSession'];
  readonly labels: Readonly<{unavailable: string; replay: string; reduced: string}>;
  readonly loadedSwfHostAsset?: unknown;
  readonly narrationRequest?: AnimationRuntimeNarrationRequest | null;
  readonly lessonHostNavigationHandoff?: AnimationRendererProps['lessonHostNavigationHandoff'];
  readonly onLessonFinished?: () => void;
  /** Filtered here by the same capability policy as the ordinary frame runtime. */
  readonly onLessonHostRequest?: AnimationRendererProps['onLessonHostRequest'];
  readonly onPlaybackComplete?: () => void;
  readonly onPlaybackStateChange?: (state: AnimationRuntimePlaybackState) => void;
  readonly onRuntimePausedChange?: (paused: boolean) => void;
  readonly onReplay?: () => void;
  readonly pageInteractionCompanionTargetId?: string;
  readonly pageInteractionStageTargetId?: string;
  readonly paused?: boolean;
  readonly presentation?: 'workbench' | 'lesson' | 'legacy-shell';
  readonly query: AnimationRuntimeQuery;
  readonly uiLanguage?: AnimationRendererProps['lang'];
  readonly volume?: number;
}

/** One module has one clock. No host frame timer or inferred terminal frame runs here. */
export function RendererClockedRuntime({
  animationId, animationModule, audioEnabled = false, audioLanguage, rendererLessonSession, labels,
  loadedSwfHostAsset, narrationRequest, lessonHostNavigationHandoff,
  onLessonFinished, onLessonHostRequest, onPlaybackComplete, onPlaybackStateChange, onRuntimePausedChange, onReplay,
  pageInteractionCompanionTargetId, pageInteractionStageTargetId,
  paused = false, presentation = 'workbench', query, uiLanguage, volume = 1,
}: RendererClockedRuntimeProps) {
  const localScopeId = useId();
  const localScope = useMemo(() => Object.freeze({id: `renderer-host:${localScopeId}`}), [localScopeId]);
  const [environment, setEnvironment] = useState<{hidden?: boolean; reduced?: boolean}>({});
  const liveEnvironment = useRef<{hidden?: boolean; reduced?: boolean}>({});
  const [replay, setReplay] = useState(0);
  const [playbackComplete, setPlaybackComplete] = useState(false);
  const [forwardedNarration, setForwardedNarration] = useState<AnimationRuntimeNarrationRequest | null>(null);
  const completion = useRef(EMPTY_RENDERER_COMPLETION);
  const lastReport = useRef<RendererPlaybackReport | null>(null);
  const consumedNarration = useRef(0);
  const requestedNarrationResume = useRef<number | null>(null);
  const activeRun = useRef(replay);
  const mounted = useRef(true);
  const effectivePaused = rendererClockPaused(paused, environment.hidden, environment.reduced);
  const blocker = rendererClockedBlocker(animationModule, query, loadedSwfHostAsset);
  const hostPaused = useRef(paused);
  hostPaused.current = paused;
  const controls = useRef({effectivePaused, blocker});
  controls.current = {effectivePaused, blocker};

  useEffect(() => {
    mounted.current = true;
    return () => {mounted.current = false;};
  }, []);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      const observed = {hidden: document.hidden, reduced: media.matches};
      liveEnvironment.current = observed;
      controls.current.effectivePaused = rendererClockPaused(hostPaused.current, observed.hidden, observed.reduced);
      setEnvironment(observed);
    };
    update();
    document.addEventListener('visibilitychange', update);
    media.addEventListener('change', update);
    return () => {
      document.removeEventListener('visibilitychange', update);
      media.removeEventListener('change', update);
    };
  }, []);
  useEffect(() => {
    if (!narrationRequest || !Number.isSafeInteger(narrationRequest.requestId) ||
        narrationRequest.requestId <= consumedNarration.current) return;
    const disposition = rendererNarrationDisposition(narrationRequest.action, {
      paused, hidden: liveEnvironment.current.hidden, reduced: liveEnvironment.current.reduced,
      audioEnabled, blocker, canResumeHost: Boolean(onRuntimePausedChange),
    });
    if (disposition === 'resume-host') {
      if (requestedNarrationResume.current !== narrationRequest.requestId) {
        requestedNarrationResume.current = narrationRequest.requestId;
        onRuntimePausedChange?.(false);
      }
      return; // Consume/forward only after the controlled pause prop is cleared.
    }
    requestedNarrationResume.current = null;
    consumedNarration.current = narrationRequest.requestId;
    if (disposition === 'forward') setForwardedNarration(narrationRequest);
  }, [narrationRequest, paused, environment.hidden, environment.reduced, audioEnabled, blocker, onRuntimePausedChange]);

  const handleReport = useCallback((report: RendererPlaybackReport) => {
    if (!mounted.current || activeRun.current !== replay || controls.current.blocker) return;
    const staticComplete=permitsP009StaticPracticeCompletion(animationModule,report,{hostPaused:hostPaused.current,hidden:liveEnvironment.current.hidden,reduced:liveEnvironment.current.reduced,blocker:controls.current.blocker}) || permitsP010StaticPracticeCompletion(animationModule,report,{hostPaused:hostPaused.current,hidden:liveEnvironment.current.hidden,reduced:liveEnvironment.current.reduced,blocker:controls.current.blocker}) || permitsP019StaticPracticeCompletion(animationModule,report,{hostPaused:hostPaused.current,hidden:liveEnvironment.current.hidden,reduced:liveEnvironment.current.reduced,blocker:controls.current.blocker}) || permitsP020StaticPracticeCompletion(animationModule,report,{hostPaused:hostPaused.current,hidden:liveEnvironment.current.hidden,reduced:liveEnvironment.current.reduced,blocker:controls.current.blocker}) || permitsP022StaticPracticeCompletion(animationModule,report,{hostPaused:hostPaused.current,hidden:liveEnvironment.current.hidden,reduced:liveEnvironment.current.reduced,blocker:controls.current.blocker}) || permitsP026StaticPracticeCompletion(animationModule,report,{hostPaused:hostPaused.current,hidden:liveEnvironment.current.hidden,reduced:liveEnvironment.current.reduced,blocker:controls.current.blocker}) || permitsP027StaticPracticeCompletion(animationModule,report,{hostPaused:hostPaused.current,hidden:liveEnvironment.current.hidden,reduced:liveEnvironment.current.reduced,blocker:controls.current.blocker}) || permitsP014StaticPracticeCompletion(animationModule,report,{hostPaused:hostPaused.current,hidden:liveEnvironment.current.hidden,reduced:liveEnvironment.current.reduced,blocker:controls.current.blocker});
    const decision = consumeRendererReport(report, audioEnabled, controls.current.effectivePaused && !staticComplete, completion.current, animationModule);
    if (!decision) return;
    lastReport.current = report;
    completion.current = decision.ledger;
    setPlaybackComplete(decision.ledger.complete);
    onPlaybackStateChange?.(decision.playbackState);
    if (decision.emitComplete) onPlaybackComplete?.();
    if (decision.emitLessonFinished) onLessonFinished?.();
  }, [replay, audioEnabled, animationModule, onPlaybackStateChange, onPlaybackComplete, onLessonFinished]);
  const latestReportHandler = useRef(handleReport);
  latestReportHandler.current = handleReport;
  useEffect(() => {
    if (!effectivePaused && lastReport.current) latestReportHandler.current(lastReport.current);
  }, [effectivePaused]);
  const handleHostRequest = useCallback<NonNullable<AnimationRendererProps['onLessonHostRequest']>>((request, context) => {
    const pausedSourceGlossary = request.type === 'open-glossary' && request.sourceAnimationId === animationId &&
      request.playbackDisposition === 'source-stop-timeline-and-audio-until-explicit-resume' &&
      !liveEnvironment.current.hidden;
    const pausedP019GlossaryClose=permitsP019PausedGlossaryClose(animationModule,request,{hostPaused:hostPaused.current,hidden:liveEnvironment.current.hidden,reduced:liveEnvironment.current.reduced,blocker:controls.current.blocker});
    const pausedP020GlossaryClose=permitsP020PausedGlossaryClose(animationModule,request,{hostPaused:hostPaused.current,hidden:liveEnvironment.current.hidden,reduced:liveEnvironment.current.reduced,blocker:controls.current.blocker});
    const pausedP022GlossaryClose=permitsP022PausedGlossaryClose(animationModule,request,{hostPaused:hostPaused.current,hidden:liveEnvironment.current.hidden,reduced:liveEnvironment.current.reduced,blocker:controls.current.blocker});
    const pausedP026GlossaryClose=permitsP026PausedGlossaryClose(animationModule,request,{hostPaused:hostPaused.current,hidden:liveEnvironment.current.hidden,reduced:liveEnvironment.current.reduced,blocker:controls.current.blocker});
    const pausedP027GlossaryClose=permitsP027PausedGlossaryClose(animationModule,request,{hostPaused:hostPaused.current,hidden:liveEnvironment.current.hidden,reduced:liveEnvironment.current.reduced,blocker:controls.current.blocker});
    const staticPractice=permitsP009StaticPracticeRequest(animationModule,request,{hostPaused:hostPaused.current,hidden:liveEnvironment.current.hidden,reduced:liveEnvironment.current.reduced,blocker:controls.current.blocker}) || permitsP010StaticPracticeRequest(animationModule,request,{hostPaused:hostPaused.current,hidden:liveEnvironment.current.hidden,reduced:liveEnvironment.current.reduced,blocker:controls.current.blocker}) || permitsP019StaticPracticeRequest(animationModule,request,{hostPaused:hostPaused.current,hidden:liveEnvironment.current.hidden,reduced:liveEnvironment.current.reduced,blocker:controls.current.blocker}) || permitsP020StaticPracticeRequest(animationModule,request,{hostPaused:hostPaused.current,hidden:liveEnvironment.current.hidden,reduced:liveEnvironment.current.reduced,blocker:controls.current.blocker});
    if (!mounted.current || activeRun.current !== replay || controls.current.blocker || liveEnvironment.current.hidden ||
        (controls.current.effectivePaused && !pausedSourceGlossary && !pausedP019GlossaryClose && !pausedP020GlossaryClose && !pausedP022GlossaryClose && !pausedP026GlossaryClose && !pausedP027GlossaryClose && !staticPractice)) return undefined;
    if (!moduleDeclaresLessonHostRequest(animationModule, request)) return undefined;
    if (!audioEnabled && (request.type === 'play-audio' || request.type === 'stop-audio')) return undefined;
    return onLessonHostRequest?.(request, context);
  }, [replay, onLessonHostRequest, animationModule, animationId, audioEnabled]);
  const handleReplay = () => {
    activeRun.current++;
    completion.current = EMPTY_RENDERER_COMPLETION;
    setPlaybackComplete(false);
    lastReport.current = null;
    setForwardedNarration(null);
    requestedNarrationResume.current = null;
    if (narrationRequest && Number.isSafeInteger(narrationRequest.requestId))
      consumedNarration.current = Math.max(consumedNarration.current, narrationRequest.requestId);
    onPlaybackStateChange?.(INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE);
    setReplay(activeRun.current);
    onReplay?.();
  };
  if (blocker) return <p className="runtime-unavailable" data-runtime-clock-error={blocker}>{labels.unavailable}</p>;
  const textPresentation = animationModule.textPresentation;
  const Renderer = textPresentation?.Renderer ?? animationModule.Renderer;
  const stage = animationModule.movie.stage;
  const languages = lessonTypographyLanguages(query.lang, uiLanguage, textPresentation?.binding);
  const lang = languages.visualLanguage;
  const parsedSeed = Number(query.seed);
  const seed = /^-?\d+$/u.test(query.seed ?? '') && Number.isSafeInteger(parsedSeed) ? parsedSeed >>> 0 : 0;
  const scenario = animationModule.scenarios.find((item) => item.id === query.scenario)?.id ?? animationModule.scenarios[0]?.id ?? 'default';
  const handoff = lessonHostNavigationHandoff?.targetAnimationId === animationId ? lessonHostNavigationHandoff : null;
  return <div className="runtime-shell" data-runtime-clock="renderer"
    data-lesson-presentation={textPresentation ? "modern-text-v1" : undefined}
    data-hfr-native-presentation={textPresentation ? "true" : undefined}
    data-runtime-playback-complete={playbackComplete ? 'true' : 'false'}
    data-runtime-paused={effectivePaused ? 'true' : 'false'} data-runtime-replay={replay}
    data-runtime-presentation={presentation} data-runtime-transport="none"
    data-source-transport-parity="not-established"
    style={{'--flash-stage-width': `${stage.width}px`, '--flash-stage-height': `${stage.height}px`,
      '--flash-stage-aspect': `${stage.width} / ${stage.height}`} as CSSProperties}>
    {presentation !== 'legacy-shell' && <div className="runtime-toolbar"><button type="button" onClick={handleReplay}>{labels.replay}</button></div>}
    {environment.reduced && <p className="reduced-motion-note" role="status">{labels.reduced}</p>}
    {languages.usesEnglishFallback && <p className="lesson-text-language-note" lang="es" data-lesson-text-language="en" data-spanish-translation="missing">Texto original en inglés. Esta página todavía no tiene una traducción al español verificada.</p>}
    <div className="runtime-stage" data-animation-id={animationId} data-animation-module={animationModule.key}
      data-runtime-input-held={effectivePaused ? "true" : "false"}>
      <Renderer key={replay} replay={replay} frame={1} frameDomain={query.frameDomain ?? animationModule.runtime?.defaultFrameDomain ?? "root"} lang={lang} scenario={scenario} seed={seed}
        rendererLessonSession={rendererLessonSession ?? localScope}
        audioEnabled={audioEnabled} audioLanguage={audioLanguage ?? languages.requestedLanguage} uiLanguage={languages.uiLanguage}
        volume={Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 0}
        narrationRequest={forwardedNarration} paused={effectivePaused} hostPaused={paused} reducedMotion={environment.reduced === true}
        lessonHostNavigationHandoff={handoff} onLessonHostRequest={handleHostRequest}
        onRendererPlayback={handleReport} onReplay={handleReplay}
        pageInteractionCompanionTargetId={pageInteractionCompanionTargetId} pageInteractionStageTargetId={pageInteractionStageTargetId} />
    </div>
  </div>;
}
