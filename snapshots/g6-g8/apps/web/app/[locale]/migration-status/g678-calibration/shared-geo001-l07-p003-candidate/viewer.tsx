'use client';

import React, {useEffect, useState} from 'react';
import {GeoL07P003CandidateRenderer} from '@helpmath/demos/geo-l07-p003-local-candidate';

export function GeoL07P003CandidateViewer({locale, assetHrefs}: {
  locale: 'en' | 'es'; assetHrefs: Readonly<Record<string, string>>;
}) {
  const [frame, setFrame] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [replay, setReplay] = useState(0);
  useEffect(() => {
    if (!playing) return;
    if (frame >= 1274) {
      setPlaying(false);
      return;
    }
    const handle = window.setTimeout(() => setFrame(current => Math.min(1274, current + 1)), 1000 / 12);
    return () => window.clearTimeout(handle);
  }, [playing, frame]);
  const spanish = locale === 'es';
  return <div style={{maxWidth: 960, margin: '0 auto', padding: '1rem', color: '#11253b'}}>
    <h1>{spanish ? 'Volumen: candidato visual local' : 'Volume: local visual candidate'}</h1>
    <p role="status" style={{border: '2px solid #9b4d00', padding: '0.75rem'}}>
      {spanish
        ? 'No es una lección admitida. El texto original sigue en inglés; el glosario y el audio no funcionan aquí.'
        : 'Not an admitted lesson. Source text remains English; glossary and audio are unavailable here.'}
    </p>
    <GeoL07P003CandidateRenderer
      context={{frame, frameDomain: 'sprite-140', scenario: 'default', lang: locale, seed: 0, replay}}
      assetHrefs={assetHrefs}/>
    <div style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem'}}>
      <button type="button" onClick={() => setPlaying(value => !value)}>
        {playing ? (spanish ? 'Pausar' : 'Pause') : (spanish ? 'Reproducir' : 'Play')}
      </button>
      <button type="button" onClick={() => {setPlaying(false); setFrame(1); setReplay(value => value + 1);}}>
        {spanish ? 'Reiniciar' : 'Replay'}
      </button>
      <label htmlFor="geo-l07-p003-frame">{spanish ? 'Fotograma' : 'Frame'}: {frame}</label>
      <input id="geo-l07-p003-frame" type="range" min="1" max="1274" value={frame}
        onChange={event => {setPlaying(false); setFrame(Number(event.target.value));}}
        style={{flex: '1 1 240px'}}/>
    </div>
  </div>;
}
