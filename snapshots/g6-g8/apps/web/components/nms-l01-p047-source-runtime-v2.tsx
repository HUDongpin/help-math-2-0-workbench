'use client';
import {useEffect, useRef, useState} from 'react';
import type {AnimationModule} from '../../../packages/demos/src/contract';
import {P047QuizPlayer} from '../../../packages/demos/src/nms-l01-p047-quiz-player-v2';
import {readP047AudioAsset} from '../../../packages/demos/src/nms-l01-p047-audio-loader-v1';
import {P047_SOURCE} from '../../../packages/demos/src/nms-l01-p047-source-data-v1';
import {p047SourceFrame} from '../../../packages/demos/src/nms-l01-p047-quiz-v1';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import '../../../packages/demos/src/nms-l01-p047-quiz-v1.css';

const ID = 'shared-nms002-l01-p047';
interface Attachment {
  readonly version: 1;
  readonly sourceSwfSha256: string;
  readonly audioAssets: readonly {id: string; source: string; sha256: string; bytes: number}[];
}
export function NmsL1P047SourceRuntimeV2(props: LessonRuntimeAdapterProps) {
  const latest = useRef(props); latest.current = props;
  const [attachment, setAttachment] = useState<Attachment | null>(null), [failed, setFailed] = useState(false);
  const [failureCode,setFailureCode]=useState('');
  const inScope = process.env.NODE_ENV !== 'production' && props.animationId === ID && props.moduleKey === ID
    && props.query.capture !== '1' && props.query.frameDomain === 'sprite-1024'
    && props.query.scenario === 'source-quiz' && props.query.lang === 'en';
  useEffect(() => {
    let active = true;
    setAttachment(null); setFailed(false);
    void (async () => {
      if (!inScope) throw Error('P047_PRIVATE_SCOPE');
      const module = await loadClientAnimationModule(ID) as (AnimationModule & {privateP047Quiz?: Attachment}) | undefined;
      const a = module?.privateP047Quiz;
      if (!module || module.key !== ID || module.maturity !== 'private-current-js' || !module.textPresentation?.Renderer || !a
        || a.version !== 1 || a.sourceSwfSha256 !== P047_SOURCE.sourceSwfSha256 || a.audioAssets.length !== 270) throw Error('P047_REGISTRATION_REQUIRED');
      const seen = new Set<string>();
      for (const source of P047_SOURCE.audio) {
        const asset = a.audioAssets.find(asset => asset.id === source.id);
        const expected = `/flash-assets/g678-local/${ID}/quiz-audio/${source.id}?sha256=${source.sha256}`;
        if (!asset || seen.has(asset.id) || asset.source !== expected || asset.sha256 !== source.sha256 || asset.bytes !== source.bytes) throw Error('P047_AUDIO_ATTACHMENT');
        seen.add(asset.id);
      }
      await module.textPresentation.prepare?.();
      if (active) setAttachment(a);
    })().catch(error => { if (active) { setFailureCode(error instanceof Error?`${error.name}: ${error.message}`:'P047_PREPARATION_FAILED');setFailed(true); latest.current.onRuntimePausedChange(true); } });
    return () => { active = false; };
  }, [props.animationId, props.moduleKey, inScope]);
  if (!inScope || failed) return <p role="alert" data-p047-failure={inScope?failureCode:'P047_PRIVATE_SCOPE'}
    data-p047-query-domain={props.query.frameDomain} data-p047-query-scenario={props.query.scenario} data-p047-query-language={props.query.lang}>{props.labels.unavailable}</p>;
  if (!attachment) return <p role="status">{props.labels.loading}</p>;
  const seed = Number(props.query.seed ?? 0);
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) return <p role="alert">{props.labels.unavailable}</p>;
  return <div className="runtime-shell" data-source-quiz-runtime={ID} data-lesson-presentation="modern-text-v1" data-source-alignment="candidate-not-accepted">
    <P047QuizPlayer seed={seed} uiLanguage={props.uiLanguage === 'es' ? 'es' : 'en'} paused={props.paused}
      volume={props.volume} audioEnabled={props.audioEnabled === true} connectControls={props.connectRuntimeControls}
      onPaused={props.onRuntimePausedChange} onReplay={props.onReplay} onComplete={props.onPlaybackComplete}
      readAudio={readP047AudioAsset}
      onState={snapshot => {
        const picture = p047SourceFrame(snapshot.quiz);
        latest.current.onPlaybackStateChange?.({audioAvailable: props.audioEnabled === true, frame: picture.frame, frameCount: 74,
          frameDomain: 'sprite-1024', fps: 12, narration: snapshot.audio.phase === 'playing' ? 'playing' : 'idle',
          playbackProgress: snapshot.quiz.responses.length / 10, seekAvailable: false, stepFrames: 1, transportMode: 'none'});
      }}/>
  </div>;
}
