'use client';
import {useEffect, useRef, useState} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import {NmsL2P034Player} from '../../../packages/demos/src/nms-l02-p034-player-v1';
import {P034_AUDIO_SOURCES} from '../../../packages/demos/src/nms-l02-p034-audio-source-v1';
import {readP034SourceAudio} from '../../../packages/demos/src/nms-l02-p034-audio-loader-v1';


const ID = 'shared-nms002-l02-p034';
export function NmsL2P034SourceRuntimeV1(props: LessonRuntimeAdapterProps) {
  const latest = useRef(props); latest.current = props;
  const [ready, setReady] = useState(false), [failure, setFailure] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);
  const inScope = process.env.NODE_ENV !== 'production' && props.audioEnabled === true && props.animationId === ID && props.moduleKey === ID
    && props.query.capture !== '1' && props.query.frameDomain === 'sprite-172'
    && props.query.scenario === 'source-decimal-practice' && props.query.lang === 'en';
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
      if (!inScope) throw Error('P034_PRIVATE_SCOPE');
      const animationModule = await loadClientAnimationModule(ID);
      const a = (animationModule as unknown as {privateP034Practice?: {version: number; sourceSwfSha256: string;
        audio: typeof P034_AUDIO_SOURCES}})?.privateP034Practice;
      if (!animationModule || animationModule.key !== ID || animationModule.maturity !== 'private-current-js' || !animationModule.textPresentation?.Renderer
        || !a || a.version !== 1 || a.sourceSwfSha256 !== 'c1ba22980b841b62e84169f3c1527dd6d6ab5f678279d7938bba5af6fd47b7ee'
        || JSON.stringify(a.audio) !== JSON.stringify(P034_AUDIO_SOURCES)) {
        throw Error('P034_REGISTRATION_REQUIRED');
      }
      await animationModule.textPresentation.prepare?.();
      if (active) setReady(true);
    })().catch(error => {
      if (active) {setFailure(error instanceof Error ? error.message : 'P034_PREPARATION_FAILED'); latest.current.onRuntimePausedChange(true);}
    });
    return () => {active = false;};
  }, [inScope, props.animationId, props.moduleKey]);
  const seed = Number(props.query.seed ?? 0);
  if (!inScope || failure || !Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) {
    return <p role="alert" data-p034-failure={failure || 'P034_PRIVATE_SCOPE'}>{props.labels.unavailable}</p>;
  }
  if (!ready) return <p role="status">{props.labels.loading}</p>;
  return <div className="runtime-shell" data-source-real-world-runtime={ID}
    data-lesson-presentation="modern-text-v1" data-source-alignment="candidate-not-accepted">
    <NmsL2P034Player seed={seed} uiLanguage={props.uiLanguage === 'es' ? 'es' : 'en'} paused={props.paused ?? true}
      volume={props.audioEnabled ? (props.volume ?? 0.8) : 0} reducedMotion={reducedMotion}
      readAudio={readP034SourceAudio} connectControls={props.connectRuntimeControls}
      onPaused={props.onRuntimePausedChange} onReplay={props.onReplay}
      onState={state => {
        if (state.phase === 'failed') latest.current.onRuntimePausedChange(true);
        latest.current.onPlaybackStateChange?.({audioAvailable: props.audioEnabled === true,
        frame: state.state.mainFrame, frameCount: 396, frameDomain: 'sprite-172', fps: 12,
        narration: state.phase === 'playing' && state.narrationEnabled ? 'playing' : 'idle',
        playbackProgress: (state.state.mainFrame - 1) / 395, seekAvailable: false, stepFrames: 1, transportMode: 'none'});
      }}/>
  </div>;
}
