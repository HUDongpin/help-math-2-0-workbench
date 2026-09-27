'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import type {
  AnimationModule,
  AnimationRendererProps,
} from '../../../packages/demos/src/contract';
import {loadG4L5ProductModule} from '../../../packages/demos/src/g4-l5-product-registry.generated';

export type G4L5PrivateRuntimeNarration =
  | 'unavailable'
  | 'idle'
  | 'playing'
  | 'blocked';

export interface G4L5PrivateRuntimeState {
  readonly frame: number;
  readonly frameCount: number;
  readonly frameDomain: string;
  readonly narration: G4L5PrivateRuntimeNarration;
}

export const INITIAL_G4_L5_PRIVATE_RUNTIME_STATE:
G4L5PrivateRuntimeState = Object.freeze({
  frame: 1,
  frameCount: 1,
  frameDomain: 'root',
  narration: 'unavailable',
});

type ModuleLoader = (
  key: string,
) => Promise<AnimationModule | undefined>;

export function resolveG4L5RuntimeScenario(
  animationModule: AnimationModule | undefined,
  frameDomain: string,
) {
  return animationModule?.defaultScenarioByFrameDomain?.[frameDomain]
    ?? animationModule?.scenarios[0]?.id
    ?? 'product-candidate';
}

function exactAudioAsset(
  module: AnimationModule,
  language: 'en' | 'es',
  cueId: string,
) {
  return module.interactiveAudioAssets?.find((asset) =>
    asset.id === cueId &&
    (asset.language === 'shared' || asset.language === language) &&
    /^[a-f0-9]{64}$/u.test(asset.sha256) &&
    asset.source.endsWith(`sha256=${asset.sha256}`) &&
    asset.source.startsWith('/flash-assets/')
  );
}

export function G4L5PrivateAnimationRuntime({
  animationId,
  audioEnabled,
  frameDomain,
  language,
  moduleKey,
  moduleLoader = loadG4L5ProductModule,
  onLessonHostRequest,
  onPlaybackStateChange,
  replay,
  volume = .75,
}: {
  animationId: string;
  audioEnabled: boolean;
  frameDomain: string;
  language: 'en' | 'es';
  moduleKey: string;
  moduleLoader?: ModuleLoader;
  onLessonHostRequest: NonNullable<
    AnimationRendererProps['onLessonHostRequest']
  >;
  onPlaybackStateChange?: (state: G4L5PrivateRuntimeState) => void;
  replay: number;
  volume?: number;
}) {
  const [loaded, setLoaded] = useState<{
    key: string;
    module?: AnimationModule;
    failed?: boolean;
  }>({key: moduleKey});
  const [frame, setFrame] = useState(1);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationModule =
    loaded.key === moduleKey ? loaded.module : undefined;

  useEffect(() => {
    let cancelled = false;
    moduleLoader(moduleKey)
      .then((value) => {
        if (!cancelled) {
          setLoaded({key: moduleKey, module: value, failed: !value});
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded({key: moduleKey, failed: true});
      });
    return () => {
      cancelled = true;
    };
  }, [moduleKey, moduleLoader]);

  const domain = useMemo(
    () => animationModule?.runtime?.frameDomains?.find(
      (candidate) => candidate.id === frameDomain,
    ),
    [animationModule, frameDomain],
  );
  const frameCount = domain?.frameCount ?? 1;
  const fps = domain?.fps ?? animationModule?.runtime?.fps ??
    animationModule?.movie.fps ?? 0;
  const scenario = resolveG4L5RuntimeScenario(animationModule, frameDomain);

  useEffect(() => {
    if (!animationModule || !domain || !fps || frameCount <= 1) return;
    const startedAt = performance.now();
    let request = 0;
    const tick = (now: number) => {
      const next = Math.min(
        frameCount,
        1 + Math.floor(((now - startedAt) * fps) / 1000),
      );
      setFrame(next);
      if (next < frameCount) request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [animationId, animationModule, domain, fps, frameCount, replay]);

  useEffect(() => () => {
    audioRef.current?.pause();
    audioRef.current = null;
  }, []);

  const narration: G4L5PrivateRuntimeNarration = !audioEnabled ||
    !(animationModule?.interactiveAudioAssets?.length)
    ? 'unavailable'
    : activeAudioId
      ? 'playing'
      : audioBlocked
        ? 'blocked'
        : 'idle';

  useEffect(() => {
    onPlaybackStateChange?.({
      frame,
      frameCount,
      frameDomain,
      narration,
    });
  }, [
    frame,
    frameCount,
    frameDomain,
    narration,
    onPlaybackStateChange,
  ]);

  const stopAudio = useCallback((cueId?: string) => {
    if (cueId && cueId !== activeAudioId) return;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setActiveAudioId(null);
    setAudioBlocked(false);
  }, [activeAudioId]);

  const handleRequest = useCallback<
    NonNullable<AnimationRendererProps['onLessonHostRequest']>
  >((request, context) => {
    const decision = onLessonHostRequest(request, context);
    if (decision?.status !== 'allowed' || !animationModule) return decision;
    if (request.type === 'stop-audio') {
      stopAudio(request.cueId);
      return decision;
    }
    if (request.type !== 'play-audio' || !audioEnabled) return decision;
    const asset = exactAudioAsset(
      animationModule,
      language,
      request.cueId,
    );
    if (!asset) return decision;
    stopAudio();
    const audio = new Audio(asset.source);
    audio.preload = 'auto';
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.addEventListener('ended', () => {
      setActiveAudioId(null);
      setAudioBlocked(false);
    }, {once: true});
    audio.addEventListener('error', () => {
      setActiveAudioId(null);
      setAudioBlocked(true);
    }, {once: true});
    audioRef.current = audio;
    setActiveAudioId(asset.id);
    setAudioBlocked(false);
    void audio.play().catch(() => {
      setActiveAudioId(null);
      setAudioBlocked(true);
    });
    return decision;
  }, [
    audioEnabled,
    animationModule,
    language,
    onLessonHostRequest,
    stopAudio,
    volume,
  ]);

  if (loaded.failed) {
    return <p className="runtime-unavailable">Current-JS module unavailable.</p>;
  }
  if (!animationModule || !domain) {
    return <p aria-live="polite" className="runtime-unavailable">Loading Current-JS module…</p>;
  }
  const Renderer = animationModule.Renderer;
  return (
    <div
      data-active-audio-id={activeAudioId ?? ''}
      data-animation-id={animationId}
      data-private-runtime="g4-l5-product-v2"
      data-runtime-frame={frame}
      data-runtime-frame-count={frameCount}
      data-runtime-frame-domain={frameDomain}
      data-runtime-narration={narration}
      style={{height: '100%', width: '100%'}}
    >
      <Renderer
        activeInteractiveAudioId={activeAudioId}
        audioEnabled={audioEnabled}
        frame={frame}
        frameDomain={frameDomain}
        lang={language}
        onLessonHostRequest={handleRequest}
        reducedMotion={false}
        replay={replay}
        rootFrame={domain.rootFrame ?? 1}
        scenario={scenario}
        seed={0}
        uiLanguage={language}
      />
    </div>
  );
}
