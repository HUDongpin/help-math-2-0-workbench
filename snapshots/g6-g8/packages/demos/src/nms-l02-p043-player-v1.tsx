'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { P043SourceAudio, type P043AudioDependencies } from './nms-l02-p043-audio-v1';
import { P043Presentation } from './nms-l02-p043-presentation-v1';
import { p043CompletionDomain } from './nms-l02-p043-clock-v1';
export type P043AudioSnapshot = ReturnType<P043SourceAudio['snapshot']>;
export interface P043PlayerControls { setPaused(value: boolean): void; replay(): boolean; narration(action: 'play' | 'stop'): void; stop(): void }
export interface P043PlayerProps {
  uiLanguage: 'en' | 'es'; paused: boolean; volume: number; seed?: number; reducedMotion?: boolean;
  readAudio: P043AudioDependencies['read']; connectControls?: (controls: P043PlayerControls) => () => void;
  onState?: (snapshot: P043AudioSnapshot) => void; onPaused?: (paused: boolean) => void; onReplay?: () => void; onComplete?: () => void;
}
export function NmsL2P043Player(props: P043PlayerProps) {
  const latest = useRef(props); latest.current = props;
  const engine = useRef<P043SourceAudio | null>(null), seenPaused = useRef(false);
  const [snapshot, setSnapshot] = useState<P043AudioSnapshot | null>(null);
  const modalChanged = useCallback((open: boolean) => engine.current?.setModal(open), []);
  useEffect(() => {
    let active = true, raf: number | null = null, lastFrame = -1, lastPhase = '', lastPaused: boolean | null = null, completedReplay = -1;
    seenPaused.current = false;
    const publish = (state: P043AudioSnapshot) => {
      if (!active) return;
      setSnapshot(state); latest.current.onState?.(state);
      const paused = !['playing', 'loading'].includes(state.phase);
      if (paused !== lastPaused) { lastPaused = paused; latest.current.onPaused?.(paused); }
      if (state.state.completed && completedReplay !== state.state.replay) { completedReplay = state.state.replay; latest.current.onComplete?.(); }
    };
    const tick = () => {
      raf = null; if (!active) return;
      const state = session.snapshot(), phaseKey = state.phase + ':' + state.state.phase;
      if (state.state.frame !== lastFrame || phaseKey !== lastPhase) { lastFrame = state.state.frame; lastPhase = phaseKey; publish(state); }
      if (state.phase === 'playing' && raf === null) raf = requestAnimationFrame(tick);
    };
    const session = new P043SourceAudio({ read: (domain, signal) => latest.current.readAudio(domain, signal), changed: () => {
      if (!active) return;
      const state = session.snapshot(); publish(state);
      if (state.phase === 'playing' && raf === null) raf = requestAnimationFrame(tick);
      else if (state.phase !== 'playing' && raf !== null) { cancelAnimationFrame(raf); raf = null; }
    } }, props.seed ?? 0);
    engine.current = session; session.setVolume(latest.current.volume);
    const controls: P043PlayerControls = {
      setPaused(value) { if (!active) return; if (value) session.pause(); else void session.play(); },
      replay() { if (!active) return false; session.replay(); latest.current.onReplay?.(); return true; },
      narration(action) { if (!active) return; session.setNarration(action === 'play'); if (action === 'play') void session.play(); },
      stop() { if (!active) return; active = false; if (raf !== null) cancelAnimationFrame(raf); void session.close(); },
    };
    const disconnect = latest.current.connectControls?.(controls);
    const visibility = () => { if (active && document.hidden) session.pause(); };
    document.addEventListener('visibilitychange', visibility);
    return () => { active = false; if (raf !== null) cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', visibility); disconnect?.(); if (engine.current === session) engine.current = null; void session.close(); };
  }, [props.seed]);
  useEffect(() => { engine.current?.setVolume(props.volume); }, [props.volume]);
  useEffect(() => { if (props.paused) { seenPaused.current = true; engine.current?.pause(); } else if (seenPaused.current) void engine.current?.play(); }, [props.paused]);
  if (!snapshot) return <p role="status">{props.uiLanguage === 'es' ? 'Cargando…' : 'Loading…'}</p>;
  return <div data-p043-assets="ready" data-p043-transport={snapshot.phase}>
    {snapshot.failure && <p role="alert">{props.uiLanguage === 'es' ? 'El audio no está disponible.' : 'Audio is unavailable.'}</p>}
    <P043Presentation state={snapshot.state} frame={snapshot.state.frame} language={props.uiLanguage} completionDomain={p043CompletionDomain(props.seed ?? 0)}
      interactive={!['closed', 'failed', 'loading'].includes(snapshot.phase)} onMatch={(term, row) => engine.current?.match(term, row)}
      onCloseWrong={() => engine.current?.closeWrongFeedback()} onModalChange={modalChanged} />
  </div>;
}
