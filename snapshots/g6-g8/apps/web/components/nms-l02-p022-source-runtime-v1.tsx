'use client';
import {useEffect, useRef, useState} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import {NmsL2P022Player} from '../../../packages/demos/src/nms-l02-p022-player-v1';
import {P022_IR as IR} from '../../../packages/demos/src/generated/nms-l02-p022-source-ir-v1';
import {readP022SourceAudio} from '../../../packages/demos/src/nms-l02-p022-audio-loader-v1';
import '../../../packages/demos/src/nms-l02-p022-v1.css';

const ID = 'shared-nms002-l02-p022';
export function NmsL2P022SourceRuntimeV1(props: LessonRuntimeAdapterProps) {
  const latest = useRef(props); latest.current = props;
  const [ready, setReady] = useState(false), [failure, setFailure] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);
  const inScope = process.env.NODE_ENV !== 'production' && props.audioEnabled === true && props.animationId === ID && props.moduleKey === ID
    && props.query.capture !== '1' && props.query.frameDomain === 'sprite-206'
    && props.query.scenario === 'source-fraction-quiz' && props.query.lang === 'en';
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
      if (!inScope) throw Error('P022_PRIVATE_SCOPE');
      const module = await loadClientAnimationModule(ID);
      const a = (module as unknown as {privateP022Question?: {version: number; sourceSwfSha256: string;
        audio: typeof IR.audio}})?.privateP022Question;
      if (!module || module.key !== ID || module.maturity !== 'private-current-js' || !module.textPresentation?.Renderer
        || !a || a.version !== 1 || a.sourceSwfSha256 !== 'c02ece5daf5f6eab9c6852106a17fe189c94b4f1dc2c32f75a1bba49de35db1c'
        || JSON.stringify(a.audio) !== JSON.stringify(IR.audio)) {
        throw Error('P022_REGISTRATION_REQUIRED');
      }
      await module.textPresentation.prepare?.();
      if (active) setReady(true);
    })().catch(error => {
      if (active) {setFailure(error instanceof Error ? error.message : 'P022_PREPARATION_FAILED'); latest.current.onRuntimePausedChange(true);}
    });
    return () => {active = false;};
  }, [inScope, props.animationId, props.moduleKey]);
  const seed = Number(props.query.seed ?? 0);
  if (!inScope || failure || !Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) {
    return <p role="alert" data-p022-failure={failure || 'P022_PRIVATE_SCOPE'}>{props.labels.unavailable}</p>;
  }
  if (!ready) return <p role="status">{props.labels.loading}</p>;
  return <div className="runtime-shell" data-source-real-world-runtime={ID}
    data-lesson-presentation="modern-text-v1" data-source-alignment="candidate-not-accepted">
    <NmsL2P022Player seed={seed} uiLanguage={props.uiLanguage === 'es' ? 'es' : 'en'} paused={props.paused ?? true}
      volume={props.audioEnabled ? (props.volume ?? 0.8) : 0} reducedMotion={reducedMotion}
      readAudio={readP022SourceAudio} connectControls={props.connectRuntimeControls}
      onPaused={props.onRuntimePausedChange} onReplay={props.onReplay} onComplete={props.onPlaybackComplete}
      onState={state => {
        if (state.phase === 'failed') latest.current.onRuntimePausedChange(true);
        latest.current.onPlaybackStateChange?.({audioAvailable: props.audioEnabled === true,
        frame: state.state.mainFrame, frameCount: 501, frameDomain: 'sprite-206', fps: 12,
        narration: state.phase === 'playing' && state.narrationEnabled ? 'playing' : 'idle',
        playbackProgress: (state.state.mainFrame - 1) / 500, seekAvailable: false, stepFrames: 1, transportMode: 'none'});
      }}/>
  </div>;
}
