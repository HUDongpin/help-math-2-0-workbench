'use client';
/* eslint-disable @next/next/no-img-element -- Local hash-bound source SVGs must bypass image optimization. */
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {P054_CARDS, P054_CARD_SOURCE} from './generated/nms-l02-p054-cards-v1';
import {loadP054FeedbackAudio} from './nms-l02-p054-feedback-audio-loader';
import type {P054FeedbackKind} from './nms-l02-p054-feedback-audio-v1';
import {p054RevealShapeId, p054RevealTileUrl} from './nms-l02-p054-reveal-v1';
import {finishP054Feedback, initialP054State, selectP054Card,
  type P054Level, type P054State} from './nms-l02-p054-matching-state-candidate';

type Card = (typeof P054_CARDS)[number];
type FeedbackClips = Record<P054FeedbackKind, HTMLAudioElement>;

function stopFeedbackAudio(clips: FeedbackClips | null) {
  if (!clips) return;
  for (const clip of Object.values(clips)) {
    clip.pause();
    clip.currentTime = 0;
  }
}

/** FFDec text IDs 97–100 in source popup sprite 101, placed in game sprite 731. */
export const P054_HELP_SOURCE = [
  {id: 97, sha256: 'f811b9d4fa1aadfa864698738ad0c7c86ebfd418bcd6bd854002c8f6eb61ffea',
    text: 'Find the matching pairs and correct answers will reveal a picture and music.'},
  {id: 98, sha256: '0859a58498a7056424e3c7863fa7db137ecffdbd8741cb0bde39d73533c77770',
    text: 'For each correct match you get 10 points added to your score. For each incorrect match 2 points are subtracted from your score.'},
  {id: 99, sha256: 'be276b903c1a93c910d415b451f084ec7861ec7671bcf83b1192be6690e89d3c',
    text: 'When you are ready to play, choose a level and then click Start to begin the Fractions, Decimals, and Percents Match Game.'},
  {id: 100, sha256: '806c6cc5742a294191231c98451d2507a3c37f2cf815dff9dbdba0ae279a0f99',
    text: 'Click one box then find the next box that matches and click it.'},
] as const;

function CardValue({card}: {readonly card: Card}) {
  if (card.side === 2) return <span>{card.values[0]}</span>;
  return React.createElement('math', {'aria-label': `${card.values[0]}/${card.values[1]}`},
    React.createElement('mfrac', null,
      React.createElement('mn', null, card.values[0]),
      React.createElement('mn', null, card.values[1])));
}

/** Local engineering board only; source audio is not listening or host acceptance. */
export function P054MatchingBoardCandidate({level, uiLanguage = 'en'}: {
  readonly level: P054Level; readonly uiLanguage?: 'en' | 'es';
}) {
  const cards = useMemo(() => P054_CARDS.filter(card => card.level === level)
    .sort((a, b) => a.placementOrder - b.placementOrder), [level]);
  const [state, setState] = useState<P054State>(() => initialP054State(level));
  const [revision, setRevision] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [audioStatus, setAudioStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioRetry, setAudioRetry] = useState(0);
  const audioClips = useRef<FeedbackClips | null>(null);
  const focusNextCard = useRef(false);
  const priorLevel = useRef(level);
  const root = useRef<HTMLElement>(null);
  const feedbackContinue = useRef<HTMLButtonElement>(null);
  const audioRetryButton = useRef<HTMLButtonElement>(null);
  const helpDialog = useRef<HTMLDialogElement>(null);
  const helpTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    const urls: string[] = [];
    let disposed = false;
    let current: FeedbackClips | null = null;
    void Promise.all([
      loadP054FeedbackAudio('correct', controller.signal),
      loadP054FeedbackAudio('wrong', controller.signal),
    ]).then(([correct, wrong]) => {
      if (disposed) return;
      const correctUrl = URL.createObjectURL(correct);
      urls.push(correctUrl);
      const wrongUrl = URL.createObjectURL(wrong);
      urls.push(wrongUrl);
      current = {correct: new Audio(correctUrl), wrong: new Audio(wrongUrl)};
      for (const clip of Object.values(current)) {
        clip.preload = 'auto';
        clip.onplay = () => setAudioPlaying(true);
        clip.onpause = clip.onended = () => setAudioPlaying(false);
      }
      audioClips.current = current;
      setAudioStatus('ready');
    }).catch(() => {
      if (!disposed) setAudioStatus('error');
    });
    return () => {
      disposed = true;
      controller.abort();
      if (current) {
        for (const clip of Object.values(current)) {
          clip.onplay = clip.onpause = clip.onended = null;
        }
        stopFeedbackAudio(current);
      }
      if (audioClips.current === current) audioClips.current = null;
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [audioRetry]);
  useEffect(() => {
    const stop = () => stopFeedbackAudio(audioClips.current);
    const onVisibility = () => {if (document.hidden) stop();};
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', stop);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', stop);
    };
  }, []);
  useEffect(() => {
    if (priorLevel.current === level) return;
    priorLevel.current = level;
    stopFeedbackAudio(audioClips.current);
    setState(initialP054State(level));
  }, [level]);
  useEffect(() => {
    if (!focusNextCard.current || audioStatus !== 'ready') return;
    focusNextCard.current = false;
    (root.current?.querySelector<HTMLButtonElement>('.p054-board__card:not(:disabled)')
      ?? root.current?.querySelector<HTMLElement>('[data-p054-terminal]'))?.focus();
  }, [state, revision, audioStatus]);
  useEffect(() => {
    const dialog = helpDialog.current;
    if (!dialog) return;
    if (helpOpen && !dialog.open) dialog.showModal();
    if (!helpOpen && dialog.open) dialog.close();
  }, [helpOpen]);
  const es = uiLanguage === 'es';
  const feedback = state.phase === 'feedback-correct' || state.phase === 'feedback-wrong';
  useEffect(() => {
    // Every card is disabled during feedback; move keyboard focus to the
    // local preview's explicit continuation instead of leaving it on <body>.
    if (feedback && audioStatus === 'ready') feedbackContinue.current?.focus();
  }, [feedback, audioStatus]);
  useEffect(() => {if (audioStatus === 'error') audioRetryButton.current?.focus();}, [audioStatus]);
  const replay = () => {
    stopFeedbackAudio(audioClips.current);
    focusNextCard.current = true;
    setState(initialP054State(level));
    setRevision(value => value + 1);
  };
  return <section ref={root} className="p054-board" lang={uiLanguage}
    data-animation-id="shared-nms002-l02-p054" data-source-swf-sha256={P054_CARD_SOURCE.sourceSwfSha256}
    data-p054-level={level} data-p054-phase={state.phase} data-p054-revision={revision}
    data-p054-audio-status={audioStatus} data-p054-audio-playing={audioPlaying}
    data-source-alignment="candidate-not-accepted">
    <h2>{es ? 'Juego de parejas — candidato local' : 'Matching game — local candidate'}</h2>
    <p>{es ? 'Encuentra seis parejas equivalentes.' : 'Find six equivalent pairs.'}
      {' '}{es ? 'El resultado, la sincronización de audio y la navegación originales siguen sin verificarse.'
        : 'Original result, audio synchronization and navigation remain unverified.'}</p>
    <p>{es ? 'El botón Continuar es una ayuda temporal; aún no reproduce la duración original de la respuesta.'
      : 'Continue is a temporary preview control; it does not reproduce source feedback timing.'}</p>
    <p>{es ? 'Repeat muestra instrucciones en el origen; el reinicio de abajo es solo para esta vista local.'
      : 'Source Repeat opens instructions; the reset below is only for this local preview.'}</p>
    <p className="p054-board__audio-status" role={audioStatus === 'error' ? 'alert' : 'status'}>
      {audioStatus === 'loading' ? (es ? 'Cargando audio de respuesta del origen…' : 'Loading source feedback audio…')
        : audioStatus === 'error' ? (es ? 'El audio de respuesta no está disponible; reinicia esta vista local.'
          : 'Source feedback audio is unavailable; reset this local preview.')
          : (es ? 'Audio de respuesta listo; la escucha original aún no está verificada.'
            : 'Feedback audio ready; original listening remains unverified.')}
    </p>
    {audioStatus === 'error' && <button type="button" className="p054-board__audio-retry"
      ref={audioRetryButton} onClick={() => {replay(); setAudioStatus('loading');
        setAudioRetry(value => value + 1);}}>
      {es ? 'Reintentar audio y reiniciar' : 'Retry audio and reset'}
    </button>}
    <p className="p054-board__score" aria-live="polite">{es ? 'Puntuación' : 'Score'}: {state.score}</p>
    <div className="p054-board__cards" role="group"
      aria-label={es ? 'Tarjetas matemáticas del origen' : 'Source mathematical cards'}>
      {cards.map(card => {
        const matched = state.matchedPairIds.includes(card.pairId);
        const selected = state.selected === card.sourceInstanceName;
        return <button type="button" className="p054-board__card"
          key={card.sourceInstanceName} disabled={audioStatus !== 'ready' || matched || feedback || state.phase === 'terminal-unresolved'}
          aria-pressed={selected} aria-label={`${card.values.join(card.side === 1 ? '/' : '')}${matched ? (es ? ', emparejada' : ', matched') : ''}`}
          data-p054-matched={matched}
          data-source-instance={card.sourceInstanceName} data-source-character={card.sourceCharacterId}
          data-source-frame={card.sourceFrame} data-source-text-ids={card.sourceTextIds.join(',')}
          data-source-x={card.stagePx.x} data-source-y={card.stagePx.y}
          onClick={() => {
            const next = selectP054Card(state, cards, card.sourceInstanceName);
            if (next.phase === 'feedback-correct' || next.phase === 'feedback-wrong') {
              const clip = audioClips.current?.[next.phase === 'feedback-correct' ? 'correct' : 'wrong'];
              if (!clip) {setAudioStatus('error'); return;}
              stopFeedbackAudio(audioClips.current);
              void clip.play().catch(() => {stopFeedbackAudio(audioClips.current); setAudioStatus('error');});
            }
            setState(next);
          }}>
          {matched ? <img alt="" aria-hidden="true" width={168} height={101}
            data-p054-reveal-shape={p054RevealShapeId(level, card.placementOrder)}
            src={p054RevealTileUrl(level, card.placementOrder)}/> : <CardValue card={card}/>}
        </button>;
      })}
    </div>
    {feedback && <div className="p054-board__feedback" role="status" aria-live="assertive">
      <p>{state.phase === 'feedback-correct'
        ? (es ? 'Pareja correcta: +10.' : 'Correct pair: +10.')
        : (es ? 'No corresponde: −2.' : 'Not a pair: −2.')}</p>
      <button type="button" ref={feedbackContinue} disabled={audioStatus !== 'ready'}
        onClick={() => {stopFeedbackAudio(audioClips.current); focusNextCard.current = true;
        setState(previous => finishP054Feedback(previous));}}>{es ? 'Continuar tras la respuesta'
          : 'Continue after feedback'}</button>
    </div>}
    {state.phase === 'terminal-unresolved' && <p role="status" tabIndex={-1} data-p054-terminal>{es
      ? 'Se encontraron seis parejas. La transición final del origen y el progreso del curso aún no están verificados.'
      : 'Six pairs found. Source terminal transition and course progress are not yet verified.'}</p>}
    <div className="p054-board__tools">
      <button type="button" ref={helpTrigger} onClick={() => setHelpOpen(true)}>{es
        ? 'Ayuda del botón Repeat original' : 'Help from source Repeat'}</button>
      <button type="button" onClick={replay}>{es
        ? 'Reiniciar vista local' : 'Reset local preview'}</button>
    </div>
    <dialog ref={helpDialog} className="p054-board__help" aria-labelledby="p054-help-title"
      onClose={() => {setHelpOpen(false); helpTrigger.current?.focus();}}>
      <h3 id="p054-help-title">{es ? 'Instrucciones originales (en inglés)' : 'Source instructions'}</h3>
      {P054_HELP_SOURCE.map(item => <p key={item.id} lang="en" data-source-text-id={item.id}>{item.text}</p>)}
      <button type="button" onClick={() => helpDialog.current?.close()}>{es ? 'Cerrar ayuda' : 'Close help'}</button>
    </dialog>
  </section>;
}
