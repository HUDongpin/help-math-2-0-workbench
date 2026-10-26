'use client';

import React, {useEffect, useRef, useState} from 'react';
import {DatL02P002CandidateRenderer} from '@helpmath/demos/dat-l02-p002-local-candidate';

export function DatL02P002CandidateViewer({locale, initialFrame, assetHrefs, maskPaths,
  transcript, audioUrl}: {
  locale: 'en' | 'es';
  initialFrame: number;
  assetHrefs: Readonly<Record<string, string>>;
  maskPaths: Readonly<Record<string, {d: string; clipRule: 'evenodd' | 'nonzero'}>>;
  transcript: Readonly<{title: string; assignment: string; steps: readonly string[]}>;
  audioUrl: string;
}) {
  const [frame, setFrame] = useState(initialFrame);
  const [playing, setPlaying] = useState(false);
  const [replay, setReplay] = useState(0);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (!playing) return;
    let handle = 0;
    const tick = () => {
      const audio = audioRef.current;
      if (!audio) return;
      const sourceFrame = Math.min(276, Math.floor(audio.currentTime * 12) + 1);
      setFrame(current => current === sourceFrame ? current : sourceFrame);
      handle = window.requestAnimationFrame(tick);
    };
    handle = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(handle);
  }, [playing]);
  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); return; }
    if (audio.ended || (Number.isFinite(audio.duration) &&
        audio.currentTime >= audio.duration - 0.04)) audio.currentTime = 0;
    void audio.play().catch(() => setAudioError(true));
  };
  const replayFromStart = () => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.currentTime = 0; }
    setFrame(1);
    setReplay(value => value + 1);
  };
  const spanish = locale === 'es';
  return <div style={{maxWidth: 960, margin: '0 auto', padding: '1rem', color: '#11253b'}}>
    <h1>{spanish ? 'Datos: candidato audiovisual local' : 'Data: local audiovisual candidate'}</h1>
    <p role="status" style={{border: '2px solid #9b4d00', padding: '0.75rem'}}>
      {spanish
        ? 'No es una lección admitida. El texto original sigue en inglés. La sincronización con el audio fuente no se ha verificado en Flash.'
        : 'Not an admitted lesson. Source text remains English. Source-audio synchronization has not been verified in Flash.'}
    </p>
    <audio ref={audioRef} src={audioUrl} preload="metadata" aria-hidden="true"
      onLoadedMetadata={event => {event.currentTarget.currentTime = (initialFrame - 1) / 12;}}
      onPlay={() => {setAudioError(false); setPlaying(true);}}
      onPause={() => setPlaying(false)}
      onEnded={() => {setPlaying(false); setFrame(276);}}
      onError={() => {setPlaying(false); setAudioError(true);}}/>
    {audioError && <p role="alert">{spanish
      ? 'El audio fuente no está disponible en esta sesión local.'
      : 'Source audio is unavailable in this local session.'}</p>}
    <DatL02P002CandidateRenderer
      context={{frame, frameDomain: 'sprite-113', rootFrame: 6,
        scenario: 'default', lang: locale, seed: 0, replay}}
      assetHrefs={assetHrefs} maskPaths={maskPaths} nativeTerminalAssignment={frame === 276}/>
    {frame === 276 ? <section lang="en" data-p002-native-terminal-assignment="candidate"
      style={{marginTop: '0.75rem', border: '1px solid #52687a', padding: '0.75rem',
        fontSize: 'clamp(1rem, 2vw, 1.25rem)', lineHeight: 1.5}}>
      <h2>{transcript.title}</h2>
      <p>{transcript.assignment}</p>
      <ul>{transcript.steps.map((step, index) => <li key={index}>{step}</li>)}</ul>
    </section> : <details style={{marginTop: '0.75rem', border: '1px solid #52687a',
      padding: '0.75rem', fontSize: 'clamp(1rem, 2vw, 1.25rem)', lineHeight: 1.5}}>
      <summary>{spanish
        ? 'Transcripción del texto original en inglés (sin sincronización)'
        : 'Original English text transcript (not synchronized)'}</summary>
      <p>{spanish
        ? 'La extracción no contiene una capa de texto en español; esta transcripción no indica cuándo aparece el texto en Flash.'
        : 'The source extraction contains no Spanish text layer. This transcript does not indicate when text appears in Flash.'}</p>
      <div lang="en">
        <h2>{transcript.title}</h2>
        <p>{transcript.assignment}</p>
        <ul>{transcript.steps.map((step, index) => <li key={index}>{step}</li>)}</ul>
      </div>
    </details>}
    <div style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
      marginTop: '0.75rem'}}>
      <button type="button" onClick={togglePlayback} disabled={audioError}>
        {playing ? (spanish ? 'Pausar' : 'Pause') : (spanish ? 'Reproducir' : 'Play')}
      </button>
      <button type="button" onClick={replayFromStart}>
        {spanish ? 'Reiniciar' : 'Replay'}
      </button>
      <label htmlFor="dat-l02-p002-frame">{spanish ? 'Fotograma' : 'Frame'}: {frame}</label>
      <input id="dat-l02-p002-frame" type="range" min="1" max="276" value={frame}
        onChange={event => {
          const nextFrame = Number(event.target.value);
          const audio = audioRef.current;
          if (audio) {audio.pause(); audio.currentTime = (nextFrame - 1) / 12;}
          setFrame(nextFrame);
        }}
        style={{flex: '1 1 240px'}}/>
    </div>
  </div>;
}
