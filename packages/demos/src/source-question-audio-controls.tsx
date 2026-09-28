'use client';

import {useEffect, useMemo} from 'react';
import type {AnimationRendererProps} from './contract';
import {sourceQuestionAudioAssets} from './source-lesson-audio';

export function SourceQuestionAudioControls({animationId, enabled, questionNumber, runtime}: {
  animationId: string;
  enabled: boolean;
  questionNumber: number | null;
  runtime: AnimationRendererProps;
}) {
  const language = runtime.uiLanguage ?? runtime.lang;
  const assets = useMemo(() => sourceQuestionAudioAssets(animationId, questionNumber, language),
    [animationId, questionNumber, language]);
  useEffect(() => {
    const activeId = runtime.activeInteractiveAudioId;
    if (activeId && !assets.some(asset => asset.id === activeId))
      runtime.onLessonHostRequest?.({type: 'stop-audio', cueId: activeId});
  }, [assets, runtime.activeInteractiveAudioId, runtime.onLessonHostRequest]);
  if (questionNumber === null || runtime.audioEnabled !== true) return null;
  const spanish = language === 'es';
  return <div aria-label={spanish ? 'Audio de la pregunta' : 'Question audio'}
    data-source-question-audio={questionNumber}
    style={{alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8, padding: '8px 4px'}}>
    {assets.length === 0 ? <span style={{fontSize: 13}}>{spanish
      ? 'Esta pregunta no tiene una grabación disponible en este idioma.'
      : 'This question has no recording available in this language.'}</span> : assets.map(asset => {
      const playing = runtime.activeInteractiveAudioId === asset.id;
      const label = asset.option === null
        ? (spanish ? 'Escuchar pregunta' : 'Hear question')
        : (spanish ? `Escuchar respuesta ${asset.option}` : `Hear answer ${asset.option}`);
      return <button aria-label={playing ? (spanish ? 'Detener audio' : 'Stop audio') : label}
        aria-pressed={playing} data-interactive-audio-status="available"
        data-source-question-audio-cue={asset.id}
        disabled={!enabled || runtime.paused || !runtime.onLessonHostRequest}
        key={asset.id}
        onClick={event => runtime.onLessonHostRequest?.(playing
          ? {type: 'stop-audio', cueId: asset.id} : {type: 'play-audio', cueId: asset.id},
        {trigger: event.currentTarget})}
        style={{background: '#fff', border: '2px solid #0758ba', borderRadius: 10,
          color: '#0758ba', cursor: 'pointer', font: '700 14px system-ui', minHeight: 44, padding: '8px 12px'}}
        type="button">{playing ? (spanish ? 'Detener audio' : 'Stop audio') : label}</button>;
    })}
  </div>;
}
