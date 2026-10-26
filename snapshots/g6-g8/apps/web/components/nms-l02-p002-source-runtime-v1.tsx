'use client';
import {useEffect, useRef, useState} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import {NmsL2P002IntegratedPlayer} from '../../../packages/demos/src/nms-l02-p002-integrated-player-v1';
import {P002_AUDIO_SOURCE} from '../../../packages/demos/src/nms-l02-p002-audio-source-v1';
import {P002_AUDIO_URL, readP002SourceAudio} from '../../../packages/demos/src/nms-l02-p002-audio-loader-v1';
import '../../../packages/demos/src/nms-l02-p002-v1.css';

const ID = 'shared-nms002-l02-p002';
export function NmsL2P002SourceRuntimeV1(props: LessonRuntimeAdapterProps) {
  const latest = useRef(props); latest.current = props;
  const [ready, setReady] = useState(false), [failure, setFailure] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);
  const inScope = process.env.NODE_ENV !== 'production' && props.audioEnabled === true && props.animationId === ID && props.moduleKey === ID
    && props.query.capture !== '1' && props.query.frameDomain === 'sprite-310'
    && props.query.scenario === 'source-real-world' && props.query.lang === 'en';
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
      if (!inScope) throw Error('P002_PRIVATE_SCOPE');
      const module = await loadClientAnimationModule(ID);
      const a = (module as unknown as {privateP002RealWorld?: {version: number; sourceSwfSha256: string;
        audioUrl: string; audio: typeof P002_AUDIO_SOURCE}})?.privateP002RealWorld;
      if (!module || module.key !== ID || module.maturity !== 'private-current-js' || !module.textPresentation?.Renderer
        || !a || a.version !== 1 || a.sourceSwfSha256 !== '45408bbcba684a5f1bd12bdbe993ec37dfc33b12e854fd979698c1e66afc09c6'
        || a.audioUrl !== P002_AUDIO_URL || JSON.stringify(a.audio) !== JSON.stringify(P002_AUDIO_SOURCE)) {
        throw Error('P002_REGISTRATION_REQUIRED');
      }
      await module.textPresentation.prepare?.();
      if (active) setReady(true);
    })().catch(error => {
      if (active) {setFailure(error instanceof Error ? error.message : 'P002_PREPARATION_FAILED'); latest.current.onRuntimePausedChange(true);}
    });
    return () => {active = false;};
  }, [inScope, props.animationId, props.moduleKey]);
  const seed = Number(props.query.seed ?? 0);
  if (!inScope || failure || !Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) {
    return <p role="alert" data-p002-failure={failure || 'P002_PRIVATE_SCOPE'}>{props.labels.unavailable}</p>;
  }
  if (!ready) return <p role="status">{props.labels.loading}</p>;
  return <div className="runtime-shell" data-source-real-world-runtime={ID}
    data-lesson-presentation="modern-text-v1" data-source-alignment="candidate-not-accepted">
    <NmsL2P002IntegratedPlayer seed={seed} uiLanguage={props.uiLanguage === 'es' ? 'es' : 'en'} paused={props.paused ?? true}
      volume={props.audioEnabled ? (props.volume ?? 0.8) : 0} reducedMotion={reducedMotion}
      readAudio={readP002SourceAudio} connectControls={props.connectRuntimeControls}
      onPaused={props.onRuntimePausedChange} onReplay={props.onReplay} onComplete={props.onPlaybackComplete}
      onState={state => {
        if (state.phase === 'failed') latest.current.onRuntimePausedChange(true);
        latest.current.onPlaybackStateChange?.({audioAvailable: props.audioEnabled === true,
        frame: state.frame, frameCount: 910, frameDomain: 'sprite-310', fps: 12,
        narration: state.phase === 'playing' && state.narrationEnabled ? 'playing' : 'idle',
        playbackProgress: (state.frame - 1) / 909, seekAvailable: false, stepFrames: 1, transportMode: 'none'});
      }}/>
  </div>;
}
