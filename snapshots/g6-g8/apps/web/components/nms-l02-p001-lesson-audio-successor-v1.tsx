'use client';
import {useEffect, useRef, useState} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import {NmsL2P001Player} from '../../../packages/demos/src/nms-l02-p001-player-v1';
import {P001_AUDIO_SOURCE} from '../../../packages/demos/src/nms-l02-p001-audio-source-v1';
import {P001_AUDIO_URL} from '../../../packages/demos/src/nms-l02-p001-audio-loader-v1';
import '../../../packages/demos/src/nms-l02-p001-v1.css';

import {readNmsL2IntroductionAudio} from '../../../packages/demos/src/nms-l02-introduction-audio-successor-v1';

// Explicit access-path successor for P001 inside the new NMS L2 lesson host.
// The original P001 module/audio/transport and freeze remain verified unchanged.
const ID = 'shared-nms002-l02-p001';
export function NmsL2P001LessonAudioSuccessorV1(props: LessonRuntimeAdapterProps) {
  const latest = useRef(props); latest.current = props;
  const [ready, setReady] = useState(false), [failure, setFailure] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);
  const inScope = process.env.NODE_ENV !== 'production' && props.audioEnabled === true && props.animationId === ID && props.moduleKey === ID
    && props.query.capture !== '1' && props.query.frameDomain === 'sprite-113'
    && props.query.scenario === 'source-introduction' && props.query.lang === 'en';
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
      if (!inScope) throw Error('P001_PRIVATE_SCOPE');
      const module = await loadClientAnimationModule(ID);
      const a = (module as unknown as {privateP001Introduction?: {version: number; sourceSwfSha256: string;
        audioUrl: string; audio: typeof P001_AUDIO_SOURCE}})?.privateP001Introduction;
      if (!module || module.key !== ID || module.maturity !== 'private-current-js' || !module.textPresentation?.Renderer
        || !a || a.version !== 1 || a.sourceSwfSha256 !== '1985e363a5f283bfde0c9e48718a97d49a055b583220525c8e6ed1e20e6b1b42'
        || a.audioUrl !== P001_AUDIO_URL || JSON.stringify(a.audio) !== JSON.stringify(P001_AUDIO_SOURCE)) {
        throw Error('P001_REGISTRATION_REQUIRED');
      }
      await module.textPresentation.prepare?.();
      if (active) setReady(true);
    })().catch(error => {
      if (active) {setFailure(error instanceof Error ? error.message : 'P001_PREPARATION_FAILED'); latest.current.onRuntimePausedChange(true);}
    });
    return () => {active = false;};
  }, [inScope, props.animationId, props.moduleKey]);
  const seed = Number(props.query.seed ?? 0);
  if (!inScope || failure || !Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) {
    return <p role="alert" data-p001-failure={failure || 'P001_PRIVATE_SCOPE'}>{props.labels.unavailable}</p>;
  }
  if (!ready) return <p role="status">{props.labels.loading}</p>;
  return <div className="runtime-shell" data-source-introduction-runtime={ID}
    data-lesson-presentation="modern-text-v1" data-source-alignment="candidate-not-accepted">
    <NmsL2P001Player seed={seed} uiLanguage={props.uiLanguage === 'es' ? 'es' : 'en'} paused={props.paused ?? true}
      volume={props.audioEnabled ? (props.volume ?? 0.8) : 0} reducedMotion={reducedMotion}
      readAudio={readNmsL2IntroductionAudio} connectControls={props.connectRuntimeControls}
      onPaused={props.onRuntimePausedChange} onReplay={props.onReplay} onComplete={props.onPlaybackComplete}
      onState={state => {
        if (state.phase === 'failed') latest.current.onRuntimePausedChange(true);
        latest.current.onPlaybackStateChange?.({audioAvailable: props.audioEnabled === true,
        frame: state.frame, frameCount: 136, frameDomain: 'sprite-113', fps: 12,
        narration: state.phase === 'playing' && state.narrationEnabled ? 'playing' : 'idle',
        playbackProgress: (state.frame - 1) / 135, seekAvailable: false, stepFrames: 1, transportMode: 'none'});
      }}/>
  </div>;
}
