'use client';
import {useEffect, useRef, useState} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import {NmsL2P029IntegratedPlayer} from '../../../packages/demos/src/nms-l02-p029-integrated-player-v1';
import {P029_AUDIO_SOURCE} from '../../../packages/demos/src/nms-l02-p029-audio-source-v1';
import {P029_AUDIO_URL, readP029SourceAudio} from '../../../packages/demos/src/nms-l02-p029-audio-loader-v1';
import '../../../packages/demos/src/nms-l02-p029-v1.css';

const ID = 'shared-nms002-l02-p029';
export function NmsL2P029SourceRuntimeV1(props: LessonRuntimeAdapterProps) {
  const latest = useRef(props); latest.current = props;
  const [ready, setReady] = useState(false), [failure, setFailure] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);
  const inScope = process.env.NODE_ENV !== 'production' && props.audioEnabled === true && props.animationId === ID && props.moduleKey === ID
    && props.query.capture !== '1' && props.query.frameDomain === 'sprite-49'
    && props.query.scenario === 'default' && props.query.lang === 'en';
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
      if (!inScope) throw Error('P029_PRIVATE_SCOPE');
      const animationModule = await loadClientAnimationModule(ID);
      const a = (animationModule as unknown as {privateP029Decimal?: {version: number; sourceSwfSha256: string;
        audioUrl: string; audio: typeof P029_AUDIO_SOURCE}})?.privateP029Decimal;
      if (!animationModule || animationModule.key !== ID || animationModule.maturity !== 'private-current-js' || !animationModule.textPresentation?.Renderer
        || !a || a.version !== 1 || a.sourceSwfSha256 !== '4def014cda62cdfee43006ddbc1ce5b194ee89740f6576c886503b70c905fe30'
        || a.audioUrl !== P029_AUDIO_URL || JSON.stringify(a.audio) !== JSON.stringify(P029_AUDIO_SOURCE)) {
        throw Error('P029_REGISTRATION_REQUIRED');
      }
      await animationModule.textPresentation.prepare?.();
      if (active) setReady(true);
    })().catch(error => {
      if (active) {setFailure(error instanceof Error ? error.message : 'P029_PREPARATION_FAILED'); latest.current.onRuntimePausedChange(true);}
    });
    return () => {active = false;};
  }, [inScope, props.animationId, props.moduleKey]);
  const seed = Number(props.query.seed ?? 0);
  if (!inScope || failure || !Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) {
    return <p role="alert" data-p029-failure={failure || 'P029_PRIVATE_SCOPE'}>{props.labels.unavailable}</p>;
  }
  if (!ready) return <p role="status">{props.labels.loading}</p>;
  return <div className="runtime-shell" data-source-real-world-runtime={ID}
    data-lesson-presentation="modern-text-v1" data-source-alignment="candidate-not-accepted">
    <NmsL2P029IntegratedPlayer seed={seed} uiLanguage={props.uiLanguage === 'es' ? 'es' : 'en'} paused={props.paused ?? true}
      volume={props.audioEnabled ? (props.volume ?? 0.8) : 0} reducedMotion={reducedMotion}
      readAudio={readP029SourceAudio} connectControls={props.connectRuntimeControls}
      onPaused={props.onRuntimePausedChange} onReplay={props.onReplay} onComplete={props.onPlaybackComplete}
      onState={state => {
        if (state.phase === 'failed') latest.current.onRuntimePausedChange(true);
        latest.current.onPlaybackStateChange?.({audioAvailable: props.audioEnabled === true,
        frame: state.frame, frameCount: 383, frameDomain: 'sprite-49', fps: 12,
        narration: state.phase === 'playing' && state.narrationEnabled ? 'playing' : 'idle',
        playbackProgress: (state.frame - 1) / 382, seekAvailable: false, stepFrames: 1, transportMode: 'none'});
      }}/>
  </div>;
}
