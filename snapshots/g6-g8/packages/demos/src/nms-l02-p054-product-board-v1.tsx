'use client';
/* eslint-disable @next/next/no-img-element -- Hash-bound local source reveal tiles bypass image optimization. */
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {P054_CARDS, P054_CARD_SOURCE} from './generated/nms-l02-p054-cards-v1';
import {loadP054FeedbackAudio} from './nms-l02-p054-feedback-audio-loader';
import type {P054FeedbackKind} from './nms-l02-p054-feedback-audio-v1';
import {p054RevealShapeId, p054RevealTileUrl} from './nms-l02-p054-reveal-v1';
import {finishP054Feedback, initialP054State, selectP054Card,
  type P054Level, type P054State} from './nms-l02-p054-matching-state-candidate';

type Card = (typeof P054_CARDS)[number];
type AudioStatus = 'loading' | 'ready' | 'idle' | 'error';
type FeedbackClips = Record<P054FeedbackKind, HTMLAudioElement>;
export type P054ProductBoardControls = Readonly<{
  pause(): void; resume(): void; stop(): void; setVolume(volume: number): void;
}>;
export type P054ProductBoardSnapshot = Readonly<P054State & {
  audioStatus: AudioStatus; audioPlaying: boolean;
  feedbackFrame: number | null; paused: boolean;
}>;

export interface P054FeedbackDependencies {
  load(kind: P054FeedbackKind, signal: AbortSignal): Promise<Blob>;
  createUrl(blob: Blob): string;
  revokeUrl(url: string): void;
  createAudio(url: string): HTMLAudioElement;
}

const browserAudio: P054FeedbackDependencies = {
  load: loadP054FeedbackAudio,
  createUrl: blob => URL.createObjectURL(blob),
  revokeUrl: url => URL.revokeObjectURL(url),
  createAudio: url => new Audio(url),
};

/** Owns one pair of verified feedback resources; no source sound plays on mount. */
export class P054FeedbackSession {
  private generation = 0;
  private controller: AbortController | null = null;
  private clips: FeedbackClips | null = null;
  private urls: string[] = [];
  private closed = false;
  private volume = 1;
  private activeKind: P054FeedbackKind | null = null;
  private playEpoch = 0;
  private playbackAuthorized = false;
  status: AudioStatus = 'idle';
  playing = false;

  constructor(private readonly dependencies: P054FeedbackDependencies,
    private readonly onChange: (status: AudioStatus, playing: boolean) => void) {}

  private publish(status = this.status, playing = this.playing) {
    this.status = status;
    this.playing = playing;
    if (!this.closed) this.onChange(status, playing);
  }

  private pauseClips(reset: boolean) {
    this.playEpoch++;
    this.playbackAuthorized = false;
    if (!this.clips) return;
    for (const clip of Object.values(this.clips)) {
      clip.pause();
      if (reset) clip.currentTime = 0;
    }
    this.publish(this.status, false);
  }

  pause() { if (!this.closed) this.pauseClips(false); }

  private release() {
    this.playEpoch++;
    this.playbackAuthorized = false;
    if (this.clips) {
      for (const clip of Object.values(this.clips)) {
        clip.onplay = clip.onpause = clip.onended = null;
        clip.pause();
        clip.currentTime = 0;
        clip.removeAttribute('src');
        clip.load();
      }
    }
    this.clips = null;
    this.activeKind = null;
    for (const url of this.urls) this.dependencies.revokeUrl(url);
    this.urls = [];
  }

  stop() {
    if (this.closed) return;
    this.generation++;
    this.controller?.abort();
    this.controller = null;
    this.release();
    this.publish('idle', false);
  }

  close() {
    if (this.closed) return;
    this.stop();
    this.closed = true;
  }

  setVolume(value: number) {
    this.volume = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
    for (const clip of Object.values(this.clips ?? {})) clip.volume = this.volume;
  }

  async start() {
    if (this.closed || this.status === 'loading' || this.status === 'ready') return;
    const generation = ++this.generation;
    const controller = new AbortController();
    this.controller = controller;
    this.publish('loading', false);
    try {
      const [correct, wrong] = await Promise.all([
        this.dependencies.load('correct', controller.signal),
        this.dependencies.load('wrong', controller.signal),
      ]);
      if (this.closed || generation !== this.generation || controller.signal.aborted) return;
      const urls: string[] = [];
      try {
        urls.push(this.dependencies.createUrl(correct));
        urls.push(this.dependencies.createUrl(wrong));
        const clips = {
          correct: this.dependencies.createAudio(urls[0]),
          wrong: this.dependencies.createAudio(urls[1]),
        };
        if (this.closed || generation !== this.generation) {
          for (const clip of Object.values(clips)) {
            clip.pause(); clip.removeAttribute('src'); clip.load();
          }
          return;
        }
        this.urls = urls;
        this.clips = clips;
        for (const [kind, clip] of Object.entries(clips) as
          [P054FeedbackKind, HTMLAudioElement][]) {
          clip.preload = 'auto';
          clip.volume = this.volume;
          clip.onplay = () => {
            if (generation === this.generation && this.clips?.[kind] === clip &&
              this.activeKind === kind && this.playbackAuthorized)
              this.publish('ready', true);
          };
          const finishPlaying = () => {
            if (generation === this.generation && this.clips?.[kind] === clip &&
              this.activeKind === kind && this.playbackAuthorized) {
              this.playbackAuthorized = false;
              this.playEpoch++;
              this.publish('ready', false);
            }
          };
          clip.onpause = () => {if (clip.paused) finishPlaying();};
          clip.onended = finishPlaying;
        }
        this.publish('ready', false);
      } finally {
        if (this.urls !== urls) urls.forEach(url => this.dependencies.revokeUrl(url));
      }
    } catch {
      if (!this.closed && generation === this.generation) {
        this.release();
        this.publish('error', false);
      }
    } finally {
      if (this.controller === controller) this.controller = null;
    }
  }

  private async playClip(kind: P054FeedbackKind, reset: boolean) {
    const clip = this.status === 'ready' ? this.clips?.[kind] : null;
    if (!clip || this.closed) return false;
    if (reset) {
      this.pauseClips(true);
      this.activeKind = kind;
    }
    const generation = this.generation;
    const attempt = ++this.playEpoch;
    this.playbackAuthorized = true;
    try {
      await clip.play();
      if (this.closed || generation !== this.generation ||
        attempt !== this.playEpoch || !this.playbackAuthorized ||
        this.clips?.[kind] !== clip) {
        if (this.clips?.[kind] !== clip || !this.playbackAuthorized) clip.pause();
        return false;
      }
      this.publish('ready', true);
      return true;
    } catch {
      if (!this.closed && generation === this.generation &&
        attempt === this.playEpoch) {
        this.pauseClips(true);
        this.publish('error', false);
      }
      return false;
    }
  }

  play(kind: P054FeedbackKind) { return this.playClip(kind, true); }
  resume(kind: P054FeedbackKind) {
    return this.playClip(kind, this.activeKind !== kind);
  }
}

type TimerHandle = ReturnType<typeof setTimeout>;
export interface P054FeedbackScheduler {
  set(callback: () => void, delayMs: number): TimerHandle;
  clear(handle: TimerHandle): void;
}
const browserScheduler: P054FeedbackScheduler = {
  set: (callback, delayMs) => window.setTimeout(callback, delayMs) as unknown as TimerHandle,
  clear: handle => window.clearTimeout(handle as unknown as number),
};
export function p054FeedbackAudioStartFrame(kind: P054FeedbackKind): 2 | 3 {
  return kind === 'correct' ? 2 : 3;
}

/** Sprite 194 stops at 27; sprite 208 stops at 31, both at 12 fps from frame 2. */
export class P054FeedbackClock {
  frame: number | null = null;
  kind: P054FeedbackKind | null = null;
  paused = true;
  private timer: TimerHandle | null = null;

  constructor(private readonly onFrame: (frame: number | null) => void,
    private readonly onTerminal: () => void,
    private readonly scheduler: P054FeedbackScheduler = browserScheduler) {}

  private schedule() {
    this.timer = this.scheduler.set(() => {
      this.timer = null;
      if (this.paused || this.frame === null || this.kind === null) return;
      this.frame++;
      this.onFrame(this.frame);
      if (this.frame === (this.kind === 'correct' ? 27 : 31)) {
        this.paused = true;
        this.onTerminal();
      } else this.schedule();
    }, 1000 / 12);
  }

  start(kind: P054FeedbackKind) {
    this.stop();
    this.kind = kind;
    this.frame = 2;
    this.paused = false;
    this.onFrame(2);
    this.schedule();
  }

  pause() {
    this.paused = true;
    if (this.timer !== null) this.scheduler.clear(this.timer);
    this.timer = null;
  }

  resume() {
    if (!this.paused || this.frame === null || this.kind === null ||
      this.frame >= (this.kind === 'correct' ? 27 : 31)) return;
    this.paused = false;
    this.schedule();
  }

  stop() {
    this.pause();
    this.frame = null;
    this.kind = null;
    this.onFrame(null);
  }
}

/** FFDec text IDs 97–100 in popup sprite 101, placed in game sprite 731. */
export const P054_PRODUCT_HELP_SOURCE = [
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

export interface P054ProductBoardProps {
  readonly level: P054Level;
  readonly uiLanguage?: 'en' | 'es';
  readonly onState?: (snapshot: P054ProductBoardSnapshot) => void;
  readonly onPlaybackChange?: (paused: boolean) => void;
  readonly connectControls?: (controls: P054ProductBoardControls) => () => void;
}

/** Source-backed board inside the modern host; terminal behavior remains unresolved. */
export function P054ProductBoardV1({level, uiLanguage = 'en', onState,
  onPlaybackChange,
  connectControls}: P054ProductBoardProps) {
  const cards = useMemo(() => P054_CARDS.filter(card => card.level === level)
    .sort((a, b) => a.placementOrder - b.placementOrder), [level]);
  const [state, setState] = useState<P054State>(() => initialP054State(level));
  const stateRef = useRef(state);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>('loading');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [feedbackFrame, setFeedbackFrame] = useState<number | null>(null);
  const [lastFeedbackFrame, setLastFeedbackFrame] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const session = useRef<P054FeedbackSession | null>(null);
  const clock = useRef<P054FeedbackClock | null>(null);
  const focusNextCard = useRef(false);
  const root = useRef<HTMLElement>(null);
  const feedbackContinue = useRef<HTMLButtonElement>(null);
  const retryButton = useRef<HTMLButtonElement>(null);
  const helpDialog = useRef<HTMLDialogElement>(null);
  const helpTrigger = useRef<HTMLButtonElement>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const es = uiLanguage === 'es';
  const feedback = state.phase === 'feedback-correct' || state.phase === 'feedback-wrong';

  useEffect(() => {
    let mounted = true;
    const current = new P054FeedbackSession(browserAudio, (status, playing) => {
      if (mounted) {setAudioStatus(status); setAudioPlaying(playing);}
    });
    session.current = current;
    void current.start();
    return () => {
      mounted = false;
      current.close();
      if (session.current === current) session.current = null;
    };
  }, []);
  useEffect(() => {
    let mounted = true;
    const current = new P054FeedbackClock(frame => {
      const kind = current.kind;
      if (kind && frame === p054FeedbackAudioStartFrame(kind) &&
        session.current?.status === 'ready') void session.current.play(kind);
      if (mounted) {
        setFeedbackFrame(frame);
        if (frame !== null) setLastFeedbackFrame(frame);
      }
    }, () => {
      const next = finishP054Feedback(stateRef.current);
      stateRef.current = next;
      focusNextCard.current = true;
      if (mounted) {setState(next); setFeedbackFrame(null);}
    });
    clock.current = current;
    return () => {
      mounted = false;
      current.stop();
      if (clock.current === current) clock.current = null;
    };
  }, []);
  const pauseBoard = () => {
    clock.current?.pause();
    session.current?.pause();
    setPaused(true);
  };
  const resumeBoard = () => {
    if (session.current?.status !== 'ready') return;
    setPaused(false);
    if (stateRef.current.phase === 'feedback-correct' ||
      stateRef.current.phase === 'feedback-wrong') {
      const kind = stateRef.current.phase === 'feedback-correct' ? 'correct' : 'wrong';
      const beforeSound = (clock.current?.frame ?? 0) < p054FeedbackAudioStartFrame(kind);
      clock.current?.resume();
      if (!beforeSound) void session.current.resume(kind);
    }
  };
  const stopBoard = () => {
    clock.current?.pause();
    session.current?.stop();
    setPaused(true);
  };
  const controls = useRef({pause: pauseBoard, resume: resumeBoard,
    stop: stopBoard, setVolume: (volume: number) => session.current?.setVolume(volume)});
  controls.current = {pause: pauseBoard, resume: resumeBoard,
    stop: stopBoard, setVolume: (volume: number) => session.current?.setVolume(volume)};
  useEffect(() => {
    const pauseOnHidden = () => {if (document.hidden) controls.current.pause();};
    const stopOnPagehide = () => controls.current.stop();
    document.addEventListener('visibilitychange', pauseOnHidden);
    window.addEventListener('pagehide', stopOnPagehide);
    return () => {
      document.removeEventListener('visibilitychange', pauseOnHidden);
      window.removeEventListener('pagehide', stopOnPagehide);
    };
  }, []);
  useEffect(() => {
    if (!session.current) return;
    return connectControls?.({
      pause: () => controls.current.pause(),
      resume: () => controls.current.resume(),
      stop: () => controls.current.stop(),
      setVolume: value => controls.current.setVolume(value),
    }) ?? undefined;
  }, [connectControls]);
  useEffect(() => {
    session.current?.pause();
    clock.current?.stop();
    const next = initialP054State(level);
    stateRef.current = next;
    setState(next);
    setLastFeedbackFrame(null);
    setPaused(false);
  }, [level]);
  useEffect(() => {onState?.({...state, audioStatus, audioPlaying,
    feedbackFrame, paused});},
    [state, audioStatus, audioPlaying, feedbackFrame, paused, onState]);
  useEffect(() => {onPlaybackChange?.(!feedback || paused);},
    [feedback, paused, onPlaybackChange]);
  useEffect(() => {
    if (!focusNextCard.current || audioStatus !== 'ready') return;
    focusNextCard.current = false;
    (root.current?.querySelector<HTMLButtonElement>('.p054-board__card:not(:disabled)')
      ?? root.current?.querySelector<HTMLElement>('[data-p054-terminal]'))?.focus();
  }, [state, audioStatus]);
  useEffect(() => {
    const dialog = helpDialog.current;
    if (!dialog) return;
    if (helpOpen && !dialog.open) dialog.showModal();
    if (!helpOpen && dialog.open) dialog.close();
  }, [helpOpen]);
  useEffect(() => {
    if (feedback && paused && audioStatus === 'ready') feedbackContinue.current?.focus();
  }, [feedback, paused, audioStatus]);
  useEffect(() => {if (audioStatus === 'error') retryButton.current?.focus();}, [audioStatus]);

  const choose = (card: Card) => {
    const next = selectP054Card(stateRef.current, cards, card.sourceInstanceName);
    if (next === stateRef.current) return;
    stateRef.current = next;
    setState(next);
    if (next.phase === 'feedback-correct' || next.phase === 'feedback-wrong') {
      const kind = next.phase === 'feedback-correct' ? 'correct' : 'wrong';
      clock.current?.start(kind);
    }
  };

  return <section ref={root} className="p054-board" lang={uiLanguage}
    data-animation-id="shared-nms002-l02-p054"
    data-source-swf-sha256={P054_CARD_SOURCE.sourceSwfSha256}
    data-p054-level={level} data-p054-phase={state.phase}
    data-p054-score={state.score} data-p054-matched-pairs={state.matchedPairIds.length}
    data-p054-feedback-frame={feedbackFrame ?? ''}
    data-p054-last-feedback-frame={lastFeedbackFrame ?? ''} data-p054-paused={paused}
    data-p054-audio-status={audioStatus} data-p054-audio-playing={audioPlaying}
    data-source-alignment="candidate-not-accepted">
    <h2>{es ? 'Juego de parejas' : 'Matching game'}</h2>
    <p>{es ? 'Encuentra seis parejas equivalentes.' : 'Find six equivalent pairs.'}</p>
    <p>{es ? 'La respuesta avanza con los fotogramas del origen. La transición final sigue en revisión.'
      : 'Feedback follows the source frame count. The final transition remains under review.'}</p>
    <p className="p054-board__audio-status" role={audioStatus === 'error' ? 'alert' : 'status'}>
      {audioStatus === 'loading' ? (es ? 'Cargando audio de respuesta del origen…' : 'Loading source feedback audio…')
        : audioStatus === 'ready' ? (es ? 'Audio de respuesta listo.' : 'Feedback audio ready.')
          : audioStatus === 'error' ? (es ? 'El audio de respuesta no está disponible. Vuelve a cargarlo.'
            : 'Feedback audio is unavailable. Reload it.')
            : (es ? 'El audio está detenido. Vuelve a cargarlo para continuar.'
              : 'Feedback audio is stopped. Reload it to continue.')}
    </p>
    {(audioStatus === 'error' || audioStatus === 'idle') && <button type="button"
      className="p054-board__audio-retry" ref={retryButton}
      onClick={() => {void session.current?.start();}}>
      {es ? 'Volver a cargar audio' : 'Reload feedback audio'}
    </button>}
    <p className="p054-board__score" aria-live="polite">{es ? 'Puntuación' : 'Score'}: {state.score}</p>
    <div className="p054-board__cards" role="group"
      aria-label={es ? 'Tarjetas matemáticas del origen' : 'Source mathematical cards'}>
      {cards.map(card => {
        const matched = state.matchedPairIds.includes(card.pairId);
        const selected = state.selected === card.sourceInstanceName;
        return <button type="button" className="p054-board__card"
          key={card.sourceInstanceName}
          disabled={audioStatus !== 'ready' || paused || matched || feedback || state.phase === 'terminal-unresolved'}
          aria-pressed={selected}
          aria-label={`${card.values.join(card.side === 1 ? '/' : '')}${matched ? (es ? ', emparejada' : ', matched') : ''}`}
          data-p054-matched={matched} data-source-instance={card.sourceInstanceName}
          data-source-character={card.sourceCharacterId} data-source-frame={card.sourceFrame}
          data-source-text-ids={card.sourceTextIds.join(',')}
          data-source-x={card.stagePx.x} data-source-y={card.stagePx.y}
          onClick={() => choose(card)}>
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
      <p data-p054-feedback-progress>{es ? 'Fotograma de respuesta' : 'Feedback frame'}: {' '}
        {feedbackFrame ?? 2}/{state.phase === 'feedback-correct' ? 27 : 31}</p>
    </div>}
    {paused && <button type="button" ref={feedbackContinue}
      disabled={audioStatus !== 'ready'} onClick={resumeBoard}>
      {es ? 'Reanudar actividad' : 'Resume activity'}</button>}
    {state.phase === 'terminal-unresolved' && <p role="status" tabIndex={-1}
      data-p054-terminal>{es
        ? 'Se encontraron seis parejas. La transición final del origen y el progreso del curso aún no están verificados.'
        : 'Six pairs found. Source terminal transition and course progress are not yet verified.'}</p>}
    <div className="p054-board__tools">
      <button type="button" ref={helpTrigger} onClick={() => setHelpOpen(true)}>{es
        ? 'Ayuda del botón Repeat original' : 'Help from source Repeat'}</button>
    </div>
    <dialog ref={helpDialog} className="p054-board__help" aria-labelledby="p054-help-title"
      onClose={() => {setHelpOpen(false); helpTrigger.current?.focus();}}>
      <h3 id="p054-help-title">{es ? 'Instrucciones originales (en inglés)' : 'Source instructions'}</h3>
      {P054_PRODUCT_HELP_SOURCE.map(item => <p key={item.id} lang="en"
        data-source-text-id={item.id} data-source-text-sha256={item.sha256}>{item.text}</p>)}
      <button type="button" onClick={() => helpDialog.current?.close()}>{es ? 'Cerrar ayuda' : 'Close help'}</button>
    </dialog>
  </section>;
}
