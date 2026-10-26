'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { P047SourceAudio, type P047AudioDependencies } from './nms-l02-p047-audio-v1';
import {P047PracticeView} from './nms-l02-p047-practice-view-v1';
import {P047IntroView} from './nms-l02-p047-intro-view-v1';
import './nms-l02-p047-view-v1.css';
import {P047_COPY} from './nms-l02-p047-copy-v1';
export type P047AudioSnapshot = ReturnType<P047SourceAudio['snapshot']>;
export interface P047PlayerControls { setPaused(value: boolean): void; replay(): boolean; narration(action: 'play' | 'stop'): void; stop(): void }
export interface P047PlayerProps {
  uiLanguage: 'en' | 'es'; paused: boolean; volume: number; seed?: number; reducedMotion?: boolean;
  readAudio: P047AudioDependencies['read']; connectControls?: (controls: P047PlayerControls) => () => void;
  onState?: (snapshot: P047AudioSnapshot) => void; onPaused?: (paused: boolean) => void; onReplay?: () => void; onComplete?: () => void;
}
export function NmsL2P047Player(props: P047PlayerProps) {
  const latest = useRef(props); latest.current = props;
  const engine = useRef<P047SourceAudio | null>(null), seenPaused = useRef(false);
  const [snapshot, setSnapshot] = useState<P047AudioSnapshot | null>(null);
  const modalChanged=useCallback((open:boolean)=>engine.current?.setModal(open),[]);
  useEffect(() => {
    let active = true, raf: number | null = null, lastFrame = -1, lastPhase = '', lastPaused: boolean | null = null, completedReplay = -1;
    seenPaused.current = false;
    const publish = (state: P047AudioSnapshot) => {
      if (!active) return;
      setSnapshot(state); latest.current.onState?.(state);
      const paused = !['playing', 'loading'].includes(state.phase);
      if (paused !== lastPaused) { lastPaused = paused; latest.current.onPaused?.(paused); }
      if (state.state.completed && completedReplay !== state.state.replay) { completedReplay = state.state.replay; latest.current.onComplete?.(); }
    };
    const tick = () => {
      raf = null; if (!active) return;
      const state = session.snapshot(), phaseKey = state.phase + ':' + state.state.phase + ':' + state.state.celebrationFrame;
      if (state.state.frame !== lastFrame || phaseKey !== lastPhase) { lastFrame = state.state.frame; lastPhase = phaseKey; publish(state); }
      if (state.phase === 'playing' && raf === null) raf = requestAnimationFrame(tick);
    };
    const session = new P047SourceAudio({ read: (domain, signal) => latest.current.readAudio(domain, signal), changed: () => {
      if (!active) return;
      const state = session.snapshot(); publish(state);
      if (state.phase === 'playing' && raf === null) raf = requestAnimationFrame(tick);
      else if (state.phase !== 'playing' && raf !== null) { cancelAnimationFrame(raf); raf = null; }
    } }, props.seed ?? 0);
    engine.current = session; session.setVolume(latest.current.volume);
    const controls: P047PlayerControls = {
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
  return <div data-p047-assets="ready" data-p047-transport={snapshot.phase}>
    {snapshot.failure && <p role="alert">{props.uiLanguage === 'es' ? 'El audio no está disponible.' : 'Audio is unavailable.'}</p>}
    <p className="p047-course-title" lang={props.uiLanguage}>{P047_COPY[props.uiLanguage].title}</p>
    <div data-p047-frame={snapshot.state.frame} data-p047-phase={snapshot.state.phase}>
      {snapshot.state.phase==='intro'?<P047IntroView frame={snapshot.state.frame} language={props.uiLanguage} reducedMotion={props.reducedMotion} onModalChange={modalChanged}/>
        :<P047PracticeView state={snapshot.state} language={props.uiLanguage} interactive={!['closed','failed','loading'].includes(snapshot.phase)}
          onSelect={id=>engine.current?.select(id)}
          onDrop={tick=>engine.current?.drop(tick)}
          onCancel={()=>engine.current?.cancelSelection()}
          onHelp={open=>engine.current?.help(open)} onModalChange={modalChanged}/>}
    </div>
  </div>;
}
