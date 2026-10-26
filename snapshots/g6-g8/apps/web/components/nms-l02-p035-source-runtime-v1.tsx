'use client';
import {useEffect, useRef, useState} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import {NmsL2P035Player} from '../../../packages/demos/src/nms-l02-p035-player-v1';
import {P035_AUDIO_SOURCES} from '../../../packages/demos/src/nms-l02-p035-audio-source-v1';
import {readP035SourceAudio} from '../../../packages/demos/src/nms-l02-p035-audio-loader-v1';


const ID = 'shared-nms002-l02-p035';
export function NmsL2P035SourceRuntimeV1(props: LessonRuntimeAdapterProps) {
  const latest = useRef(props); latest.current = props;
  const [ready, setReady] = useState(false), [failure, setFailure] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);
  const inScope = process.env.NODE_ENV !== 'production' && props.audioEnabled === true && props.animationId === ID && props.moduleKey === ID
    && props.query.capture !== '1' && props.query.frameDomain === 'sprite-46'
    && props.query.scenario === 'source-explanation' && props.query.lang === 'en';
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
      if (!inScope) throw Error('P035_PRIVATE_SCOPE');
      const animationModule = await loadClientAnimationModule(ID);
      const a = (animationModule as unknown as {privateP035Explanation?: {version: number; sourceSwfSha256: string;
        audio: typeof P035_AUDIO_SOURCES}})?.privateP035Explanation;
      if (!animationModule || animationModule.key !== ID || animationModule.maturity !== 'private-current-js' || !animationModule.textPresentation?.Renderer
        || !a || a.version !== 1 || a.sourceSwfSha256 !== '24b2264eb4235034551040b479b267d64783f25be636391e3f811e39399f69f0'
        || JSON.stringify(a.audio) !== JSON.stringify(P035_AUDIO_SOURCES)) {
        throw Error('P035_REGISTRATION_REQUIRED');
      }
      await animationModule.textPresentation.prepare?.();
      if (active) setReady(true);
    })().catch(error => {
      if (active) {setFailure(error instanceof Error ? error.message : 'P035_PREPARATION_FAILED'); latest.current.onRuntimePausedChange(true);}
    });
    return () => {active = false;};
  }, [inScope, props.animationId, props.moduleKey]);
  const seed = Number(props.query.seed ?? 0);
  if (!inScope || failure || !Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) {
    return <p role="alert" data-p035-failure={failure || 'P035_PRIVATE_SCOPE'}>{props.labels.unavailable}</p>;
  }
  if (!ready) return <p role="status">{props.labels.loading}</p>;
  return <div className="runtime-shell" data-source-real-world-runtime={ID}
    data-lesson-presentation="modern-text-v1" data-source-alignment="candidate-not-accepted">
    <NmsL2P035Player seed={seed} uiLanguage={props.uiLanguage === 'es' ? 'es' : 'en'} paused={props.paused ?? true}
      volume={props.audioEnabled ? (props.volume ?? 0.8) : 0} reducedMotion={reducedMotion}
      readAudio={readP035SourceAudio} connectControls={props.connectRuntimeControls}
      onPaused={props.onRuntimePausedChange} onReplay={props.onReplay} onComplete={props.onPlaybackComplete}
      onState={state => {
        if (state.phase === 'failed') latest.current.onRuntimePausedChange(true);
        latest.current.onPlaybackStateChange?.({audioAvailable: props.audioEnabled === true,
        frame: state.state.mainFrame, frameCount: 1036, frameDomain: 'sprite-46', fps: 12,
        narration: state.phase === 'playing' && state.narrationEnabled ? 'playing' : 'idle',
        playbackProgress: (state.state.mainFrame - 1) / 1035, seekAvailable: false, stepFrames: 1, transportMode: 'none'});
      }}/>
  </div>;
}
