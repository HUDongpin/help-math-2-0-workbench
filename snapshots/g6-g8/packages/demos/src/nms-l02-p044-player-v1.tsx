'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { P044SourceAudio, type P044AudioDependencies } from './nms-l02-p044-audio-v1';
import {P044PracticeView} from './nms-l02-p044-practice-view-v1';
import {P044IntroView} from './nms-l02-p044-intro-view-v1';
import './nms-l02-p044-partition-v1.css';
import './nms-l02-p044-practice-view-v1.css';
export type P044AudioSnapshot = ReturnType<P044SourceAudio['snapshot']>;
export interface P044PlayerControls { setPaused(value: boolean): void; replay(): boolean; narration(action: 'play' | 'stop'): void; stop(): void }
export interface P044PlayerProps {
  uiLanguage: 'en' | 'es'; paused: boolean; volume: number; seed?: number; reducedMotion?: boolean;
  readAudio: P044AudioDependencies['read']; connectControls?: (controls: P044PlayerControls) => () => void;
  onState?: (snapshot: P044AudioSnapshot) => void; onPaused?: (paused: boolean) => void; onReplay?: () => void; onComplete?: () => void;
}
export function NmsL2P044Player(props: P044PlayerProps) {
  const latest = useRef(props); latest.current = props;
  const engine = useRef<P044SourceAudio | null>(null), seenPaused = useRef(false);
  const [snapshot, setSnapshot] = useState<P044AudioSnapshot | null>(null);
  const modalChanged=useCallback((open:boolean)=>engine.current?.setModal(open),[]);
  useEffect(() => {
    let active = true, raf: number | null = null, lastFrame = -1, lastPhase = '', lastPaused: boolean | null = null, completedReplay = -1, introClickFrame = 0, introClickReplay = -1;
    seenPaused.current = false;
    const publish = (state: P044AudioSnapshot) => {
      if (!active) return;
      if(state.state.replay!==introClickReplay){introClickReplay=state.state.replay;introClickFrame=0;}
      if(state.state.phase==='intro'&&state.phase==='playing'){
        for(const frame of [292,323])if(introClickFrame<frame&&state.state.frame>=frame)void session.clickEffect();
        introClickFrame=state.state.frame;
      }
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
    const session = new P044SourceAudio({ read: (domain, signal) => latest.current.readAudio(domain, signal), changed: () => {
      if (!active) return;
      const state = session.snapshot(); publish(state);
      if (state.phase === 'playing' && raf === null) raf = requestAnimationFrame(tick);
      else if (state.phase !== 'playing' && raf !== null) { cancelAnimationFrame(raf); raf = null; }
    } }, props.seed ?? 0);
    engine.current = session; session.setVolume(latest.current.volume);
    const controls: P044PlayerControls = {
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
  return <div data-p044-assets="ready" data-p044-transport={snapshot.phase}>
    {snapshot.failure && <p role="alert">{props.uiLanguage === 'es' ? 'El audio no está disponible.' : 'Audio is unavailable.'}</p>}
    <p className="p044-course-title" lang="en">Fractions, Decimals, and Percent Concepts: Try It!</p>
    <div data-p044-frame={snapshot.state.frame} data-p044-phase={snapshot.state.phase}>
      {snapshot.state.phase==='intro'?<P044IntroView frame={snapshot.state.frame} language={props.uiLanguage} onModalChange={modalChanged}/>
        :<P044PracticeView state={snapshot.state} language={props.uiLanguage} interactive={!['closed','failed','loading'].includes(snapshot.phase)}
          onParts={parts=>engine.current?.parts(parts)} onToggle={part=>engine.current?.toggle(part)} onCheck={()=>engine.current?.check()}
          onNew={()=>engine.current?.newWhole()} onHelp={open=>engine.current?.help(open)} onCloseFeedback={()=>engine.current?.closeFeedback()}
          onModalChange={modalChanged} onClickEffect={()=>{void engine.current?.clickEffect();}}/>}
    </div>
  </div>;
}
