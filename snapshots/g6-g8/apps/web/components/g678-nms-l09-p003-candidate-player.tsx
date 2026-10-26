'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import {flushSync} from 'react-dom';
import type {RuntimeContext} from '../../../packages/demos/src/contract';
import {ContinuousSourceStreamClockCandidate} from
  '../../../packages/demos/src/continuous-source-stream-clock-candidate';
import type {NmsL09P003CanvasCandidate} from
  '../../../packages/demos/src/timelines/shared-nms002-l09-p003-canvas-bridge';
import {NMS_L09_P003_AUDIO_PLAN} from
  '../../../packages/demos/src/timelines/shared-nms002-l09-p003-audio-plan';
import {loadNmsL09P003LocalAsset} from
  '../../../packages/demos/src/timelines/shared-nms002-l09-p003-local-asset';
import {NmsL09P003NativeCandidate} from
  '../../../packages/demos/src/timelines/shared-nms002-l09-p003-native-candidate';
import {createNmsL09P003Clock, reduceNmsL09P003Clock,
  type NmsL09P003ClockState,
  NMS_L09_P003_SOURCE} from
  '../../../packages/demos/src/timelines/shared-nms002-l09-p003-source-clock';
import {NMS_L09_P003_AUDIO_PATH, NMS_L09_P003_AUDIO_SHA256} from
  '@/lib/g678-nms-l09-p003-audio-access';

type AudioMode = 'silent' | 'loading' | 'ready' | 'starting' | 'playing' |
  'paused' | 'ended' | 'failed';

/** Private mounted host probe. Opt-in sound is not My Lesson or audio acceptance. */
export function G678NmsL09P003CandidatePlayer({locale}: {locale: 'en' | 'es'}) {
  const [adapter, setAdapter] = useState<NmsL09P003CanvasCandidate | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [clock, setClock] = useState(() => createNmsL09P003Clock());
  const [commitError, setCommitError] = useState(false);
  const [audioMode, setAudioMode] = useState<AudioMode>('silent');
  const [audioError, setAudioError] = useState<string | null>(null);
  const host = useRef<HTMLElement>(null);
  const clockState = useRef(clock);
  clockState.current = clock;
  const committed = useRef<{frame: number; revision: number} | null>(null);
  const audioClock = useRef<ContinuousSourceStreamClockCandidate | null>(null);
  const audioAbort = useRef<AbortController | null>(null);
  const audioTicket = useRef(0);
  const playTicket = useRef(0);
  const commitAudioRef = useRef<(frame: number) => boolean>(() => false);
  const holdAudioRef = useRef<() => void>(() => {});
  const readCommitted = () => committed.current;
  useEffect(() => {
    let alive = true;
    void loadNmsL09P003LocalAsset().then(value => {
      if (alive) setAdapter(value);
    }).catch(() => {if (alive) setLoadError(true);});
    return () => {alive = false;};
  }, []);
  useEffect(() => {
    if (!adapter || audioMode !== 'silent' || !clock.playing) return;
    const interval = window.setInterval(() => {
      setClock(current => current.playing ? reduceNmsL09P003Clock(current, {
        type: 'synchronize-frame',
        frame: Math.min(current.frame + 1, NMS_L09_P003_SOURCE.mainFrameCount),
      }) : current);
    }, 1000 / NMS_L09_P003_SOURCE.fps);
    return () => window.clearInterval(interval);
  }, [adapter, audioMode, clock.playing]);
  useEffect(() => () => {
    audioTicket.current++;
    playTicket.current++;
    audioAbort.current?.abort();
    void audioClock.current?.close();
    audioClock.current = null;
  }, []);
  useEffect(() => {
    const holdHiddenPage = () => {
      if (!document.hidden) return;
      const phase = audioClock.current?.snapshot().phase;
      if (phase === 'playing' || phase === 'start-pending') {
        holdAudioRef.current();
      } else if (!audioClock.current) {
        setClock(current => current.playing
          ? reduceNmsL09P003Clock(current, {type: 'pause'}) : current);
      }
    };
    document.addEventListener('visibilitychange', holdHiddenPage);
    return () => document.removeEventListener('visibilitychange', holdHiddenPage);
  }, []);
  const context = useMemo<RuntimeContext>(() => ({
    frame: clock.frame, frameDomain: clock.frameDomain, rootFrame: clock.rootFrame,
    scenario: 'source-static-frame', lang: locale, seed: 0,
    replay: clock.revision,
  }), [clock, locale]);
  function commitVisualFrame(next: NmsL09P003ClockState): boolean {
    const previous = clockState.current;
    committed.current = null;
    host.current?.removeAttribute('data-p003-committed-frame');
    flushSync(() => setClock(next));
    const stage = host.current?.querySelector('[data-animation-id="shared-nms002-l09-p003"]');
    const result = readCommitted();
    const ready = result?.frame === next.frame && result.revision === next.revision &&
      stage?.getAttribute('data-p003-status') === 'ready' &&
      stage.getAttribute('data-flash-frame') === String(next.frame);
    if (!ready) {
      const refreshed = reduceNmsL09P003Clock(previous, {
        type: 'resume', frame: previous.frame,
      });
      flushSync(() => setClock(reduceNmsL09P003Clock(refreshed, {type: 'pause'})));
    }
    return ready;
  }
  function commitAudioFrame(frame: number): boolean {
    const previous = clockState.current;
    let next = reduceNmsL09P003Clock(previous, {type: 'resume', frame});
    if (audioClock.current?.snapshot().phase !== 'start-pending') {
      next = reduceNmsL09P003Clock(next, {type: 'pause'});
    }
    return commitVisualFrame(next);
  }
  commitAudioRef.current = commitAudioFrame;
  function markAudioState(snapshot: ReturnType<ContinuousSourceStreamClockCandidate['snapshot']>) {
    host.current?.setAttribute('data-p003-audio-frame', String(snapshot.frame));
    host.current?.setAttribute('data-p003-audio-sample',
      String(Math.floor(snapshot.audio.decodedSample)));
  }

  async function prepareAudio() {
    if (!adapter || (audioMode !== 'silent' && audioMode !== 'failed')) return;
    const ticket = ++audioTicket.current;
    playTicket.current++;
    audioAbort.current?.abort();
    void audioClock.current?.close();
    audioClock.current = null;
    setAudioError(null);
    flushSync(() => setAudioMode('loading'));
    const reset = reduceNmsL09P003Clock(
      reduceNmsL09P003Clock(clockState.current, {type: 'replay'}), {type: 'pause'});
    if (!commitVisualFrame(reset)) {
      setAudioError('The source picture could not be reset before sound.');
      setAudioMode('failed');
      return;
    }
    setCommitError(false);
    const abort = new AbortController();
    audioAbort.current = abort;
    const candidate = new ContinuousSourceStreamClockCandidate(
      NMS_L09_P003_AUDIO_PLAN, {
        commitHeldFrame: frame => commitAudioRef.current(frame),
      });
    audioClock.current = candidate;
    try {
      const url = new URL(`${NMS_L09_P003_AUDIO_PATH}?sha256=${NMS_L09_P003_AUDIO_SHA256}`,
        window.location.origin);
      const response = await fetch(url, {
        redirect: 'error', cache: 'no-store', signal: abort.signal,
      });
      if (!response.ok || response.redirected || response.url !== url.href ||
          response.headers.get('content-type')?.split(';')[0] !== 'audio/mpeg' ||
          response.headers.get('content-length') !==
            String(NMS_L09_P003_AUDIO_PLAN.decoder.sourceBytes)) {
        throw new Error('source-audio-delivery-failed');
      }
      const result = await candidate.prepare(await response.arrayBuffer());
      if (ticket !== audioTicket.current) return;
      if (!result.accepted) throw new Error(result.reason);
      markAudioState(candidate.snapshot());
      setAudioMode('ready');
    } catch (error) {
      if (ticket !== audioTicket.current) return;
      void candidate.close();
      audioClock.current = null;
      setAudioError(error instanceof Error ? error.message : 'source-audio-unavailable');
      setAudioMode('failed');
    }
  }
  async function startAudio(replay: boolean) {
    const candidate = audioClock.current;
    if (!candidate || !['ready', 'paused', 'playing', 'ended'].includes(audioMode)) return;
    if (document.hidden) return;
    const ticket = ++playTicket.current;
    setAudioError(null);
    if (replay) {
      const reset = candidate.replay();
      if (!reset.accepted) {
        setAudioError(reset.reason);
        setAudioMode('failed');
        return;
      }
    }
    setAudioMode('starting');
    try {
      const result = await candidate.play({activation: 'user',
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches});
      if (ticket !== playTicket.current) return;
      if (result.accepted && document.hidden) pauseAudio();
      else if (result.accepted) setAudioMode('playing');
      else {
        setAudioError(result.reason);
        setAudioMode('paused');
      }
    } catch (error) {
      if (ticket !== playTicket.current) return;
      void candidate.close();
      audioClock.current = null;
      setAudioError(error instanceof Error ? error.message : 'source-audio-clock-failed');
      setAudioMode('failed');
    }
  }
  function pauseAudio() {
    playTicket.current++;
    const result = audioClock.current?.pause();
    if (result?.accepted && audioClock.current) {
      markAudioState(audioClock.current.snapshot());
      setAudioError(null);
    }
    setAudioMode(result?.accepted ? 'paused' : 'failed');
    if (!result?.accepted) {
      void audioClock.current?.close();
      audioClock.current = null;
      setAudioError(result?.reason ?? 'source-audio-unavailable');
    }
  }
  holdAudioRef.current = pauseAudio;
  function inspectAudioFrame(frame: number) {
    playTicket.current++;
    const result = audioClock.current?.seekCandidateFrame(frame);
    if (result?.accepted && audioClock.current) {
      markAudioState(audioClock.current.snapshot());
      setAudioError(null);
    }
    setAudioMode(result?.accepted ? 'paused' : 'failed');
    if (!result?.accepted) {
      void audioClock.current?.close();
      audioClock.current = null;
      setAudioError(result?.reason ?? 'source-audio-unavailable');
    }
  }
  useEffect(() => {
    if (audioMode !== 'playing' || !audioClock.current) return;
    let frameHandle = 0;
    const tick = () => {
      const candidate = audioClock.current;
      if (!candidate) return;
      const snapshot = candidate.snapshot();
      markAudioState(snapshot);
      if (snapshot.phase === 'failed' || snapshot.phase === 'closed') {
        void candidate.close();
        audioClock.current = null;
        setAudioError(snapshot.audio.failure ?? 'source-audio-clock-failed');
        setAudioMode('failed');
        return;
      }
      if (snapshot.frame !== clockState.current.frame) {
        const next = snapshot.phase === 'playing'
          ? reduceNmsL09P003Clock(clockState.current, {
            type: 'synchronize-frame', frame: snapshot.frame,
          })
          : reduceNmsL09P003Clock(reduceNmsL09P003Clock(clockState.current, {
            type: 'resume', frame: snapshot.frame,
          }), {type: 'pause'});
        if (!commitVisualFrame(next)) {
          playTicket.current++;
          void candidate.close();
          audioClock.current = null;
          setAudioError('The source picture could not follow the sound clock.');
          setAudioMode('failed');
          return;
        }
      }
      if (snapshot.timelineReachedEnd) {
        setAudioMode('ended');
        return;
      }
      if (snapshot.phase !== 'playing') {
        setAudioMode('paused');
        return;
      }
      frameHandle = requestAnimationFrame(tick);
    };
    frameHandle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameHandle);
  }, [audioMode]);
  const displayedAudioMode = locale === 'es' ? {
    silent: 'sin activar', loading: 'cargando', ready: 'listo',
    starting: 'iniciando', playing: 'reproduciendo', paused: 'pausado',
    ended: 'finalizado', failed: 'no disponible',
  }[audioMode] : audioMode;
  return <section ref={host} lang={locale}
    data-p003-host="unregistered-local-probe" data-p003-audio-mode={audioMode}>
    <p role="status">{locale === 'es'
      ? `Vista local sin registrar. El texto y dibujo originales están en inglés. Audio de origen experimental (${displayedAudioMode}); su idioma no está verificado. No es una revisión de Mi Lección.`
      : `Unregistered local probe. Source drawing and text are in English. Experimental source audio (${displayedAudioMode}); its language is unverified. This is not a My Lesson review.`}</p>
    {loadError ? <p role="alert">The source drawing could not load.</p> :
      adapter ? <NmsL09P003NativeCandidate adapter={adapter} clock={clock}
        context={context} onResult={result => {
          if (result.status !== 'ready') {committed.current = null; return;}
          committed.current = {frame: clock.frame, revision: clock.revision};
          host.current?.setAttribute('data-p003-committed-frame', String(clock.frame));
        }}/> : <p role="status">Loading source drawing…</p>}
    {commitError ? <p role="alert">The requested source frame could not be committed.</p> : null}
    {audioError ? <p role="alert">{locale === 'es'
      ? 'Audio de origen no disponible: ' : 'Source audio unavailable: '}{audioError}</p> : null}
    {(audioMode === 'silent' || audioMode === 'failed') && <button type="button"
      disabled={!adapter} onClick={() => {void prepareAudio();}}>
      {locale === 'es' ? 'Preparar audio de origen local' : 'Prepare local source audio'}
    </button>}
    <div aria-label={locale === 'es'
      ? 'Controles privados de fotograma de origen' : 'Private source-frame controls'}>
      {audioMode === 'silent' ? <button type="button" onClick={() => {
        const next = reduceNmsL09P003Clock(clock, {type: clock.playing ? 'pause' : 'resume',
          frame: clock.frame});
        setCommitError(!commitVisualFrame(next));
      }} disabled={!adapter || clock.frame === 635}>
        {clock.playing ? locale === 'es' ? 'Pausar' : 'Pause'
          : locale === 'es' ? 'Reanudar' : 'Resume'}
      </button> : <>
        <button type="button" disabled={!['ready', 'paused'].includes(audioMode) ||
            clock.frame === 635}
          onClick={() => {void startAudio(false);}}>{locale === 'es'
            ? 'Iniciar audio de origen' : 'Start source sound'}</button>
        <button type="button" disabled={!['starting', 'playing'].includes(audioMode)}
          onClick={pauseAudio}>{locale === 'es'
            ? 'Pausar audio de origen' : 'Pause source sound'}</button>
      </>}
      <button type="button" onClick={() => {
        if (audioMode !== 'silent') {void startAudio(true); return;}
        setCommitError(!commitVisualFrame(reduceNmsL09P003Clock(clock, {type: 'replay'})));
      }} disabled={!adapter || audioMode === 'loading' || audioMode === 'failed' ||
          audioMode === 'starting'}>
        {audioMode === 'silent' ? locale === 'es' ? 'Repetir' : 'Replay'
          : locale === 'es' ? 'Repetir audio de origen' : 'Replay source sound'}
      </button>
      <label>{locale === 'es' ? 'Fotograma de origen' : 'Source frame'} {clock.frame}
        {locale === 'es' ? ' de ' : ' of '}635
        <input type="range" min="1" max="635" value={clock.frame}
          disabled={!adapter || ['loading', 'starting', 'failed'].includes(audioMode)}
          onChange={event => {
            const selected = Number(event.currentTarget.value);
            if (audioMode !== 'silent') {inspectAudioFrame(selected); return;}
            setCommitError(!commitVisualFrame(reduceNmsL09P003Clock(
              createNmsL09P003Clock(selected), {type: 'pause'})));
          }}/>
      </label>
    </div>
  </section>;
}
