'use client';

import {useCallback, useEffect, useRef} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {P004_RESOURCE_PINS} from '@/lib/alg-l10-p004-resource-pins-v1';
import {AlgL10P004Player, type AlgL10P004PlayerProps} from '../../../packages/demos/src/alg-l10-p004-player-v2';
import {loadBoundLessonAudio, sourceLessonHostPlayback} from './source-lesson-host-bridge-v1';

const ID = 'shared-alg001-l10-p004';
const BINDING = {frameCount:609, frameDomain:'sprite-60', fps:12} as const;
type Snapshot = Parameters<NonNullable<AlgL10P004PlayerProps['onState']>>[0];

const readAudio: AlgL10P004PlayerProps['readAudio'] = (language, signal) => {
  const assetId = language === 'es' ? 'optional-spanish-audio' : 'source-stream';
  const pin = P004_RESOURCE_PINS[assetId];
  return loadBoundLessonAudio({animationId:ID, assetId,
    pin:{sourceBytes:pin.bytes, sourceSha256:pin.sha256},
    origin:window.location.origin, signal, contentType:pin.contentType,
    errorPrefix:'ALG_L10_P004_AUDIO'});
};

/** A draft adapter for the existing My Lesson protocol. Source glossary and
 * playback remain owned by the actual page player. Host Replay already records
 * progress; the connected player therefore does not receive an onReplay callback.
 * No route is installed here. */
export function G678AlgL10P004RuntimeV1(props:LessonRuntimeAdapterProps) {
  const latest = useRef(props); latest.current = props;
  const reportTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const onState = useCallback((snapshot:Snapshot) => {
    const playback = sourceLessonHostPlayback({frame:snapshot.frame,
      phase:snapshot.phase === 'loading' ? 'start-pending' : snapshot.phase,
      selectedAudio:snapshot.mode === 'spanish' ? 'spanish' : 'main',
      audio:{phase:snapshot.mainAudioPhase},
      spanish:{phase:snapshot.spanishAudioPhase}}, BINDING);
    if (reportTimer.current !== null) clearTimeout(reportTimer.current);
    reportTimer.current = setTimeout(() => {
      reportTimer.current = null;
      latest.current.onPlaybackStateChange?.(playback);
    }, 0);
  }, []);
  useEffect(() => () => {
    if (reportTimer.current !== null) clearTimeout(reportTimer.current);
    reportTimer.current = null;
  }, []);
  const scoped = process.env.NODE_ENV !== 'production' &&
    props.animationId === ID && props.moduleKey === ID && props.audioEnabled === true &&
    props.query.frameDomain === 'sprite-60' && props.query.scenario === 'source-static-frame' &&
    props.query.lang === 'en' && String(props.query.seed) === '0' && props.query.capture !== '1' &&
    ['en','es'].includes(props.uiLanguage ?? '');
  return <div className="runtime-shell" data-l10-p004-host-probe={ID}
    data-l10-p004-host-ready={scoped} data-l10-p004-host-error={scoped ? 'none' : 'scope'}
    data-lesson-presentation="modern-text-v1">
    {!scoped ? <p role="alert">{props.labels.unavailable}</p> :
      <AlgL10P004Player seed={0} uiLanguage={props.uiLanguage === 'es' ? 'es' : 'en'}
        paused={props.paused} volume={props.volume ?? 1} readAudio={readAudio}
        connectControls={props.connectRuntimeControls} onState={onState}
        onPaused={props.onRuntimePausedChange}/>}
  </div>;
}
