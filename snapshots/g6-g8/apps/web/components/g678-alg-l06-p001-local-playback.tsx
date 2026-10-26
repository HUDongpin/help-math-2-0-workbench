'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {P001TitleView} from '@helpmath/demos/alg-l06-p001-local-candidate';
import {P001_AUDIO_PATH, P001_AUDIO_SHA256} from '@/lib/g678-alg-l06-p001-audio-access';

const LAST_FRAME = 134;
const FPS = 12;

/** Browser transport probe only; it does not establish original-runtime sync or listening. */
export function P001LocalPlayback({uiLanguage, textAssetHrefs}: {
  uiLanguage: 'en' | 'es';
  textAssetHrefs: readonly [string, string];
}) {
  const [frame, setFrame] = useState(1);
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'paused' | 'ended'>('idle');
  const [error, setError] = useState('');
  const context = useRef<AudioContext | null>(null);
  const decoded = useRef<AudioBuffer | null>(null);
  const source = useRef<AudioBufferSourceNode | null>(null);
  const offset = useRef(0);
  const started = useRef(0);
  const raf = useRef(0);
  const generation = useRef(0);

  const pause = useCallback(() => {
    generation.current++;
    cancelAnimationFrame(raf.current);
    if (source.current && context.current) {
      offset.current = Math.min(decoded.current?.duration ?? 0,
        Math.max(0, context.current.currentTime - started.current));
      source.current.onended = null;
      source.current.stop();
      source.current.disconnect();
      source.current = null;
    }
    setStatus('paused');
  }, []);

  useEffect(() => {
    const onVisibility = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      generation.current++;
      cancelAnimationFrame(raf.current);
      source.current?.stop();
      source.current?.disconnect();
      source.current = null;
      void context.current?.close();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [pause]);

  const play = async (replay: boolean) => {
    pause();
    const token = ++generation.current;
    if (replay) { offset.current = 0; setFrame(1); }
    setError('');
    setStatus('loading');
    try {
      if (!context.current) context.current = new AudioContext();
      await context.current.resume();
      if (!decoded.current) {
        const response = await fetch(`${P001_AUDIO_PATH}?sha256=${P001_AUDIO_SHA256}`,
          {cache: 'no-store'});
        if (!response.ok || response.headers.get('content-type') !== 'audio/mpeg') {
          throw new Error('Source audio is unavailable in this local preview.');
        }
        decoded.current = await context.current.decodeAudioData(await response.arrayBuffer());
      }
      if (token !== generation.current || !context.current || !decoded.current) return;
      const node = context.current.createBufferSource();
      node.buffer = decoded.current;
      node.connect(context.current.destination);
      const startOffset = Math.min(offset.current, Math.max(0, decoded.current.duration - 0.001));
      started.current = context.current.currentTime - startOffset;
      source.current = node;
      node.onended = () => {
        if (token !== generation.current) return;
        source.current = null;
        cancelAnimationFrame(raf.current);
        offset.current = decoded.current?.duration ?? 0;
        setFrame(LAST_FRAME);
        setStatus('ended');
      };
      node.start(0, startOffset);
      setStatus('playing');
      const tick = () => {
        if (token !== generation.current || !context.current) return;
        const seconds = Math.max(0, context.current.currentTime - started.current);
        setFrame(Math.min(LAST_FRAME, Math.floor(seconds * FPS) + 1));
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    } catch {
      if (token === generation.current) {
        setStatus('paused');
        setError('Source audio is unavailable in this local preview.');
      }
    }
  };

  return <section aria-label={uiLanguage === 'es' ? 'Candidato local con audio original' : 'Local source-audio candidate'}>
    <P001TitleView frame={frame} uiLanguage={uiLanguage} textAssetHrefs={textAssetHrefs}/>
    <p aria-live="polite">{uiLanguage === 'es' ? 'Fotograma' : 'Frame'} {frame}/{LAST_FRAME} · {status}</p>
    <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.75rem'}}>
      <button type="button" disabled={status === 'loading' || status === 'playing'}
        onClick={() => void play(status === 'ended')}>
        {uiLanguage === 'es' ? 'Reproducir' : 'Play source audio'}</button>
      <button type="button" disabled={status !== 'playing'} onClick={pause}>
        {uiLanguage === 'es' ? 'Pausar' : 'Pause'}</button>
      <button type="button" disabled={status === 'loading'} onClick={() => void play(true)}>
        {uiLanguage === 'es' ? 'Repetir' : 'Replay'}</button>
    </div>
    {error && <p role="alert">{error}</p>}
    <p>{uiLanguage === 'es'
      ? 'Vista técnica local; el audio original y la sincronización aún no están aceptados.'
      : 'Local engineering preview; original audio and synchronization are not accepted.'}</p>
  </section>;
}
