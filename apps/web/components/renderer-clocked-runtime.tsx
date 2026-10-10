'use client';
import {
  loadAnimationModule,
  type AnimationModule,
  type AnimationRendererProps,
  type RendererPlaybackReport,
} from '@helpmath/demos/animation-registry';
import type {LessonHostRequest} from '@helpmath/demos/runtime';
import {useCallback, useEffect, useRef, useState, type CSSProperties} from 'react';

import type {
  AnimationRuntimeNarrationRequest,
  AnimationRuntimePlaybackState,
  AnimationRuntimeQuery,
} from './animation-runtime';

/**
 * Host for modules that run their own clock (`AnimationModule.clock ===
 * 'renderer'`), such as pages translated from ActionScript by HFR. The frame
 * clock, timeline audio cues and seek transport of the frame-clocked runtime do
 * not apply: the module plays, sounds and reports progress itself, and this
 * host turns its reports into the shell's playback state.
 */
export interface RendererClockedRuntimeProps {
  readonly animationId: string;
  readonly audioEnabled?: boolean;
  readonly audioLanguage?: AnimationRendererProps['lang'];
  readonly labels: Readonly<{unavailable: string; loading: string}>;
  readonly moduleKey: string;
  readonly narrationRequest?: AnimationRuntimeNarrationRequest | null;
  readonly onLessonFinished?: () => void;
  readonly onLessonHostRequest?: AnimationRendererProps['onLessonHostRequest'];
  readonly onPlaybackComplete?: () => void;
  readonly onPlaybackStateChange?: (state: AnimationRuntimePlaybackState) => void;
  readonly onReplay?: () => void;
  readonly paused?: boolean;
  readonly presentation?: 'workbench' | 'lesson' | 'legacy-shell';
  readonly query: AnimationRuntimeQuery;
  readonly uiLanguage?: AnimationRendererProps['lang'];
  readonly volume?: number;
}

const CAPABILITY_BY_REQUEST: Readonly<Partial<Record<LessonHostRequest['type'], string>>> = {
  'navigate': 'navigation',
  'set-language': 'language',
  'open-glossary': 'glossary',
  'close-glossary': 'glossary',
  'open-keyterm': 'keyterm',
  'close-keyterm': 'keyterm',
  'open-calculator': 'calculator',
  'close-calculator': 'calculator',
  'play-audio': 'audio',
  'stop-audio': 'audio',
  'record-fq-score': 'fq-scoring',
  'reset-fq-score': 'fq-scoring',
  'record-practice-feedback': 'practice-feedback',
  'reset-practice-feedback': 'practice-feedback',
};

/** A module may only ask for what it declared; blocked legacy calls are always passed on so the host can record the refusal. */
function moduleMayRequest(module: AnimationModule, request: LessonHostRequest): boolean {
  if (request.type === 'legacy') return true;
  const capability = CAPABILITY_BY_REQUEST[request.type];
  return Boolean(
    capability &&
      module.lessonHost?.capabilities.some((declared) => declared === capability),
  );
}

export function playbackStateFromReport(
  report: RendererPlaybackReport,
): AnimationRuntimePlaybackState {
  const frameCount = Math.max(1, report.frameCount);
  const frame = Math.min(Math.max(1, report.frame), frameCount);
  return {
    audioAvailable: report.narration !== 'unavailable',
    frame,
    frameCount,
    frameDomain: report.frameDomain,
    fps: report.fps,
    narration: report.narration,
    playbackProgress: frameCount > 1 ? (frame - 1) / (frameCount - 1) : 1,
    seekAvailable: false,
    stepFrames: 0,
    transportMode: 'none',
  };
}

export function RendererClockedRuntime({
  animationId,
  audioEnabled = true,
  audioLanguage,
  labels,
  moduleKey,
  narrationRequest,
  onLessonFinished,
  onLessonHostRequest,
  onPlaybackComplete,
  onPlaybackStateChange,
  onReplay,
  paused = false,
  presentation = 'workbench',
  query,
  uiLanguage,
  volume = 1,
}: RendererClockedRuntimeProps) {
  const [loaded, setLoaded] = useState<{key: string; module?: AnimationModule; failed?: boolean}>({key: moduleKey});
  const [reduced, setReduced] = useState(false);
  const completedRef = useRef(false);
  const finishedRef = useRef(false);
  const animationModule = loaded.key === moduleKey ? loaded.module : undefined;

  useEffect(() => {
    let cancelled = false;
    loadAnimationModule(moduleKey)
      .then((value) => {
        if (!cancelled) setLoaded({key: moduleKey, module: value, failed: !value || value.clock !== 'renderer'});
      })
      .catch(() => {
        if (!cancelled) setLoaded({key: moduleKey, failed: true});
      });
    return () => {
      cancelled = true;
    };
  }, [moduleKey]);

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const handleReport = useCallback((report: RendererPlaybackReport) => {
    onPlaybackStateChange?.(playbackStateFromReport(report));
    if (report.complete && !completedRef.current) {
      completedRef.current = true;
      onPlaybackComplete?.();
    }
    if (report.lessonFinished && !finishedRef.current) {
      finishedRef.current = true;
      onLessonFinished?.();
    }
  }, [onLessonFinished, onPlaybackComplete, onPlaybackStateChange]);

  const handleHostRequest = useCallback<NonNullable<AnimationRendererProps['onLessonHostRequest']>>(
    (request, context) => {
      if (!animationModule || !moduleMayRequest(animationModule, request)) return undefined;
      return onLessonHostRequest?.(request, context);
    },
    [animationModule, onLessonHostRequest],
  );

  if (loaded.failed) return <p className="runtime-unavailable">{labels.unavailable}</p>;
  if (!animationModule) return <p aria-live="polite" className="runtime-unavailable">{labels.loading}</p>;

  const Renderer = animationModule.Renderer;
  const lang = query.lang === 'es' ? 'es' : 'en';
  const seed = /^\d+$/u.test(query.seed ?? '') ? Number(query.seed) : 0;
  const stage = animationModule.movie.stage;
  return <div
    className="runtime-shell"
    data-audio-available={audioEnabled ? 'true' : 'false'}
    data-runtime-clock="renderer"
    data-runtime-paused={paused ? 'true' : 'false'}
    data-runtime-presentation={presentation}
    data-source-transport-parity="not-established"
    style={{
      '--flash-stage-width': `${stage.width}px`,
      '--flash-stage-height': `${stage.height}px`,
      '--flash-stage-aspect': `${stage.width} / ${stage.height}`,
    } as CSSProperties}
  >
    <div
      className="runtime-stage"
      data-animation-id={animationId}
      data-animation-module={animationModule.key}
    >
      <Renderer
        audioEnabled={audioEnabled}
        frame={1}
        lang={lang}
        narrationRequest={narrationRequest}
        onLessonHostRequest={handleHostRequest}
        onRendererPlayback={handleReport}
        onReplay={onReplay}
        paused={paused}
        reducedMotion={reduced}
        scenario="hfr"
        seed={seed}
        uiLanguage={uiLanguage ?? audioLanguage ?? lang}
        volume={volume}
      />
    </div>
  </div>;
}
