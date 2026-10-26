'use client';
import {useEffect, useRef, useState} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import {NmsL2P037Player} from '../../../packages/demos/src/nms-l02-p037-player-v1';
import {P037_AUDIO_SOURCES} from '../../../packages/demos/src/nms-l02-p037-audio-source-v1';
import {readP037SourceAudio} from '../../../packages/demos/src/nms-l02-p037-audio-loader-v1';


const ID = 'shared-nms002-l02-p037';
export function NmsL2P037SourceRuntimeV1(props: LessonRuntimeAdapterProps) {
  const latest = useRef(props); latest.current = props;
  const [ready, setReady] = useState(false), [failure, setFailure] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);
  const inScope = process.env.NODE_ENV !== 'production' && props.audioEnabled === true && props.animationId === ID && props.moduleKey === ID
    && props.query.capture !== '1' && props.query.frameDomain === 'sprite-80'
    && props.query.scenario === 'source-practice' && props.query.lang === 'en';
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
      if (!inScope) throw Error('P037_PRIVATE_SCOPE');
      const animationModule = await loadClientAnimationModule(ID);
      const a = (animationModule as unknown as {privateP037Matching?: {version: number; sourceSwfSha256: string;
        audio: typeof P037_AUDIO_SOURCES}})?.privateP037Matching;
      if (!animationModule || animationModule.key !== ID || animationModule.maturity !== 'private-current-js' || !animationModule.textPresentation?.Renderer
        || !a || a.version !== 1 || a.sourceSwfSha256 !== '8f7ff05a83fd8c1370f979fedca8e148bd0b80c0bb45ddb7147534d3b92607a7'
        || JSON.stringify(a.audio) !== JSON.stringify(P037_AUDIO_SOURCES)) {
        throw Error('P037_REGISTRATION_REQUIRED');
      }
      await animationModule.textPresentation.prepare?.();
      if (active) setReady(true);
    })().catch(error => {
      if (active) {setFailure(error instanceof Error ? error.message : 'P037_PREPARATION_FAILED'); latest.current.onRuntimePausedChange(true);}
    });
    return () => {active = false;};
  }, [inScope, props.animationId, props.moduleKey]);
  const seed = Number(props.query.seed ?? 0);
  if (!inScope || failure || !Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) {
    return <p role="alert" data-p037-failure={failure || 'P037_PRIVATE_SCOPE'}>{props.labels.unavailable}</p>;
  }
  if (!ready) return <p role="status">{props.labels.loading}</p>;
  return <div className="runtime-shell" data-source-real-world-runtime={ID}
    data-lesson-presentation="modern-text-v1" data-source-alignment="candidate-not-accepted">
    <NmsL2P037Player seed={seed} uiLanguage={props.uiLanguage === 'es' ? 'es' : 'en'} paused={props.paused ?? true}
      volume={props.audioEnabled ? (props.volume ?? 0.8) : 0} reducedMotion={reducedMotion}
      readAudio={readP037SourceAudio} connectControls={props.connectRuntimeControls}
      onPaused={props.onRuntimePausedChange} onReplay={props.onReplay} onComplete={props.onPlaybackComplete}
      onState={state => {
        if (state.phase === 'failed') latest.current.onRuntimePausedChange(true);
        latest.current.onPlaybackStateChange?.({audioAvailable: props.audioEnabled === true,
        frame: state.state.mainFrame, frameCount: 483, frameDomain: 'sprite-80', fps: 12,
        narration: state.phase === 'playing' && state.narrationEnabled ? 'playing' : 'idle',
        playbackProgress: (state.state.mainFrame - 1) / 482, seekAvailable: false, stepFrames: 1, transportMode: 'none'});
      }}/>
  </div>;
}
