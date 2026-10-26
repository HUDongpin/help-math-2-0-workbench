'use client';
import {useEffect, useRef, useState} from 'react';
import type {AnimationRendererProps} from './contract';
import {geoL06P002MainState} from './geo-l06-p002-display-state-v1';
import {geoL06P002VisibleGlossaryTerms,
  type GeoL06P002SourceGlossaryTerm} from './geo-l06-p002-glossary-v1';
import {GeoL06P002Renderer} from './geo-l06-p002-renderer-v1';
import {GeoL06P002SourceAudioTransport} from './geo-l06-p002-source-audio-transport-v1';
import {createMemoryOnlyLessonHost, type LessonHostRequest,
  type LessonHostDecision} from './lesson-host-contract';
import './geo-l06-p002-local-candidate.css';

export function GeoL06P002LocalCandidate({locale}: {locale: 'en' | 'es'}) {
  const [frame, setFrame] = useState(1);
  const [replay, setReplay] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [audioState, setAudioState] = useState<'idle' | 'loading' | 'scheduled' | 'stopped' | 'error'>('idle');
  const [selected, setSelected] = useState<GeoL06P002SourceGlossaryTerm | null>(null);
  const [status, setStatus] = useState('');
  const [host] = useState(() => createMemoryOnlyLessonHost({releaseId: 'geo-l06-p002-local-candidate',
    releaseMemberIds: ['shared-geo001-l06-p002'],
    currentAnimationId: 'shared-geo001-l06-p002',
    enabledCapabilities: ['glossary'], mode: 'audit', releasePublished: false}));
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const startFrame = useRef(1);
  const startTime = useRef(0);
  const startToken = useRef(0);
  const transport = useRef<GeoL06P002SourceAudioTransport | null>(null);

  useEffect(() => () => {
    startToken.current += 1;
    transport.current?.close();
  }, []);

  useEffect(() => {
    if (!playing) return;
    let handle = 0;
    const tick = (now: number) => {
      const next = Math.min(1216, Math.max(startFrame.current,
        startFrame.current + Math.floor((now - startTime.current) * 12 / 1000)));
      setFrame(next);
      if (next === 1216) {
        transport.current?.stop();
        setAudioState('stopped');
        setPlaying(false);
      }
      else handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [playing]);

  useEffect(() => {
    if (selected && dialog.current && !dialog.current.open) {
      dialog.current.showModal();
      dialog.current.querySelector('button')?.focus();
    }
  }, [selected]);

  const close = () => {
    if (dialog.current?.open) dialog.current.close();
    host.dispatch({type: 'close-glossary'});
    setSelected(null);
    const trigger = opener.current;
    opener.current = null;
    if (trigger?.isConnected) trigger.focus();
  };
  const stopTransport = () => {
    startToken.current += 1;
    transport.current?.stop();
    setPlaying(false);
    setAudioState('stopped');
  };
  const onLessonHostRequest: NonNullable<AnimationRendererProps['onLessonHostRequest']> =
    (request: LessonHostRequest, context): LessonHostDecision => {
      if (request.type !== 'open-glossary') return host.dispatch(request);
      const state = geoL06P002MainState(frame, {frame, frameDomain: 'sprite-230',
        scenario: 'default', lang: locale, seed: 0, replay});
      const term = geoL06P002VisibleGlossaryTerms(state).find(item => item.id === request.entryId);
      if (!term) return {status: 'blocked', code: 'invalid-request',
        reason: 'Source term is not visible at this frame.', state: host.snapshot()};
      const decision = host.dispatch(request);
      if (decision.status === 'allowed') {
        stopTransport(); // The source button stops its timeline; closing does not resume.
        opener.current = context?.trigger ?? null;
        setSelected(term);
      }
      return decision;
    };
  const play = async () => {
    if (playing || audioState === 'loading') return;
    const targetFrame = frame === 1216 ? 1 : frame;
    const token = ++startToken.current;
    const sourceTransport = transport.current ?? new GeoL06P002SourceAudioTransport();
    transport.current = sourceTransport;
    setAudioState('loading');
    setStatus('');
    try {
      const started = await sourceTransport.startAt(targetFrame);
      if (!started || token !== startToken.current) return;
      startFrame.current = targetFrame;
      startTime.current = performance.now();
      setFrame(targetFrame);
      setPlaying(true);
      setAudioState('scheduled');
    } catch (error) {
      if (token !== startToken.current) return;
      setAudioState('error');
      setStatus(error instanceof Error ? error.message : 'GEO_P002_AUDIO_START_FAILED');
    }
  };
  const seek = (value: number) => {
    if (!Number.isSafeInteger(value) || value < 1 || value > 1216) {
      setStatus('Frame must be an integer from 1 to 1216.');
      return;
    }
    stopTransport();
    close();
    setFrame(value);
    setStatus('');
  };
  return <section className="geo-l06-p002-candidate" data-source-audio-transport-state={audioState}
    aria-label={locale === 'es'
    ? 'Candidato local GEO001 L6 P002' : 'GEO001 L6 P002 local candidate'}>
    <p className="geo-l06-p002-candidate__boundary">{locale === 'es'
      ? 'Solo candidato técnico local: sin registro Current-JS, fidelidad del entorno original, aprobación de audio ni publicación.'
      : 'Local engineering candidate only; no Current-JS registration, original-runtime fidelity, audio acceptance, or publication.'}</p>
    <GeoL06P002Renderer frame={frame} frameDomain="sprite-230" rootFrame={6}
      scenario="default" lang="en" uiLanguage={locale} seed={0} replay={replay}
      onLessonHostRequest={onLessonHostRequest}/>
    <div className="geo-l06-p002-candidate__controls">
      <label htmlFor="geo-p002-frame">{locale === 'es' ? 'Fotograma de origen' : 'Source frame'}</label>
      <input id="geo-p002-frame" type="number" inputMode="numeric" min={1} max={1216}
        value={frame} onChange={event => seek(Number(event.currentTarget.value))}/>
      <button type="button" onClick={() => void play()} disabled={playing || audioState === 'loading'}>
        {locale === 'es' ? 'Reproducir' : 'Play'}</button>
      <button type="button" onClick={stopTransport} disabled={!playing && audioState !== 'loading'}>
        {locale === 'es' ? 'Pausar' : 'Pause'}</button>
      <button type="button" onClick={() => {stopTransport(); close(); setFrame(1);
        setReplay(value => value + 1);}}>{locale === 'es' ? 'Repetir' : 'Replay'}</button>
      <output>{frame}/1216</output>
    </div>
    <p role="status">{audioState === 'loading'
      ? locale === 'es' ? 'Verificando el MP3 original…' : 'Verifying exact source MP3…'
      : locale === 'es' ? 'Transporte de audio de origen candidato; sincronización sin aprobar.'
        : 'Source-audio transport candidate; synchronization not accepted.'}</p>
    {status && <p role="alert">{status}</p>}
    <dialog ref={dialog} className="geo-l06-p002-candidate__dialog"
      aria-labelledby="geo-p002-glossary-title" onCancel={event => {event.preventDefault(); close();}}>
      <h2 id="geo-p002-glossary-title">{selected?.label}</h2>
      <p lang={locale}>{selected?.definition}</p>
      {selected?.sourceDefinitionConflict && <p>{locale === 'es'
        ? 'Nota de origen: dos índices antiguos difieren en la definición inglesa de Surface.'
        : 'Source note: two legacy indexes differ on the English Surface definition.'}</p>}
      <button type="button" onClick={close}>{locale === 'es' ? 'Cerrar' : 'Close'}</button>
    </dialog>
  </section>;
}
