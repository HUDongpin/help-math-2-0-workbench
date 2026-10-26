'use client';
import {useEffect, useRef, useState} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import {NmsL2P026Player} from '../../../packages/demos/src/nms-l02-p026-player-v1';
import {P026_AUDIO_SOURCE} from '../../../packages/demos/src/nms-l02-p026-audio-source-v1';
import {P026_AUDIO_URL, readP026SourceAudio} from '../../../packages/demos/src/nms-l02-p026-audio-loader-v1';
import '../../../packages/demos/src/nms-l02-p026-v1.css';

const ID = 'shared-nms002-l02-p026';
export function NmsL2P026SourceRuntimeV1(props: LessonRuntimeAdapterProps) {
  const latest = useRef(props); latest.current = props;
  const [ready, setReady] = useState(false), [failure, setFailure] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);
  const inScope = process.env.NODE_ENV !== 'production' && props.audioEnabled === true && props.animationId === ID && props.moduleKey === ID
    && props.query.capture !== '1' && props.query.frameDomain === 'sprite-82'
    && props.query.scenario === 'correct-pairs' && props.query.lang === 'en';
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    update(); preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    let active = true;
    setReady(false); setFailure('');
    void (async () => {
      if (!inScope) throw Error('P026_PRIVATE_SCOPE');
      const module = await loadClientAnimationModule(ID);
      const a = (module as unknown as {privateP026Practice?: {version: number; sourceSwfSha256: string;
        audioUrl: string; audio: typeof P026_AUDIO_SOURCE}})?.privateP026Practice;
      if (!module || module.key !== ID || module.maturity !== 'private-current-js' || !module.textPresentation?.Renderer
        || !a || a.version !== 1 || a.sourceSwfSha256 !== 'd168033f7af079b7fad715adadf4c94fffaa84a8b8ddaefbd8d344ed1cfde1f5'
        || a.audioUrl !== P026_AUDIO_URL || JSON.stringify(a.audio) !== JSON.stringify(P026_AUDIO_SOURCE)) {
        throw Error('P026_REGISTRATION_REQUIRED');
      }
      await module.textPresentation.prepare?.();
      if (active) setReady(true);
    })().catch(error => {
      if (active) {setFailure(error instanceof Error ? error.message : 'P026_PREPARATION_FAILED'); latest.current.onRuntimePausedChange(true);}
    });
    return () => {active = false;};
  }, [inScope, props.animationId, props.moduleKey]);
  const seed = Number(props.query.seed ?? 0);
  if (!inScope || failure || !Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) {
    return <p role="alert" data-p026-failure={failure || 'P026_PRIVATE_SCOPE'}>{props.labels.unavailable}</p>;
  }
  if (!ready) return <p role="status">{props.labels.loading}</p>;
  return <div className="runtime-shell" data-source-real-world-runtime={ID}
    data-lesson-presentation="modern-text-v1" data-source-alignment="candidate-not-accepted">
    <NmsL2P026Player seed={seed} uiLanguage={props.uiLanguage === 'es' ? 'es' : 'en'} paused={props.paused ?? true}
      volume={props.audioEnabled ? (props.volume ?? 0.8) : 0} reducedMotion={reducedMotion}
      readAudio={readP026SourceAudio} connectControls={props.connectRuntimeControls}
      onPaused={props.onRuntimePausedChange} onReplay={props.onReplay} onComplete={props.onPlaybackComplete}
      onState={state => {
        if (state.phase === 'failed') latest.current.onRuntimePausedChange(true);
        latest.current.onPlaybackStateChange?.({audioAvailable: props.audioEnabled === true,
        frame: state.clock.game.mainFrame, frameCount: 491, frameDomain: 'sprite-82', fps: 12,
        narration: state.narrationActive ? 'playing' : 'idle',
        playbackProgress: (state.clock.game.mainFrame - 1) / (P026_AUDIO_SOURCE.frames - 1), seekAvailable: false, stepFrames: 1, transportMode: 'none'});
      }}/>
  </div>;
}
