'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { P046SourceAudio, type P046AudioDependencies } from './nms-l02-p046-audio-v1';
import {P046PracticeView} from './nms-l02-p046-practice-view-v1';
import {P046IntroView} from './nms-l02-p046-intro-view-v1';
import './nms-l02-p046-view-v1.css';
import {p046IntroClickBetween} from './nms-l02-p046-click-events-v1';
export type P046AudioSnapshot = ReturnType<P046SourceAudio['snapshot']>;
export interface P046PlayerControls { setPaused(value: boolean): void; replay(): boolean; narration(action: 'play' | 'stop'): void; stop(): void }
export interface P046PlayerProps {
  uiLanguage: 'en' | 'es'; paused: boolean; volume: number; seed?: number; reducedMotion?: boolean;
  readAudio: P046AudioDependencies['read']; connectControls?: (controls: P046PlayerControls) => () => void;
  onState?: (snapshot: P046AudioSnapshot) => void; onPaused?: (paused: boolean) => void; onReplay?: () => void; onComplete?: () => void;
}
export function NmsL2P046Player(props: P046PlayerProps) {
  const latest = useRef(props); latest.current = props;
  const engine = useRef<P046SourceAudio | null>(null), seenPaused = useRef(false);
  const [snapshot, setSnapshot] = useState<P046AudioSnapshot | null>(null);
  const modalChanged=useCallback((open:boolean)=>engine.current?.setModal(open),[]);
  useEffect(() => {
    let active = true, raf: number | null = null, lastFrame = -1, lastPhase = '', lastPaused: boolean | null = null, completedReplay = -1, clickReplay = -1, clickFrame = 0;
    seenPaused.current = false;
    const publish = (state: P046AudioSnapshot) => {
      if (!active) return;
      if(state.state.replay!==clickReplay){clickReplay=state.state.replay;clickFrame=0;}
      if(state.state.phase==='intro'&&state.phase==='playing'){
        const event=p046IntroClickBetween(clickFrame,state.state.frame);clickFrame=state.state.frame;
        if(event!==null)void session.clickEffect('timeline');
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
    const session = new P046SourceAudio({ read: (domain, signal) => latest.current.readAudio(domain, signal), changed: () => {
      if (!active) return;
      const state = session.snapshot(); publish(state);
      if (state.phase === 'playing' && raf === null) raf = requestAnimationFrame(tick);
      else if (state.phase !== 'playing' && raf !== null) { cancelAnimationFrame(raf); raf = null; }
    } }, props.seed ?? 0);
    engine.current = session; session.setVolume(latest.current.volume);
    const controls: P046PlayerControls = {
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
  return <div data-p046-assets="ready" data-p046-transport={snapshot.phase}>
    {snapshot.failure && <p role="alert">{props.uiLanguage === 'es' ? 'El audio no está disponible.' : 'Audio is unavailable.'}</p>}
    <p className="p046-course-title" lang="en">Fractions, Decimals, and Percent Concepts: Try It!</p>
    <div data-p046-frame={snapshot.state.frame} data-p046-phase={snapshot.state.phase}>
      {snapshot.state.phase==='intro'?<P046IntroView frame={snapshot.state.frame} language={props.uiLanguage} onModalChange={modalChanged} reducedMotion={props.reducedMotion}/>
        :<P046PracticeView state={snapshot.state} language={props.uiLanguage} interactive={!['closed','failed','loading'].includes(snapshot.phase)}
          onParts={parts=>{engine.current?.parts(parts);void engine.current?.clickEffect();}}
          onToggle={part=>engine.current?.toggle(part)}
          onInput={(field,value)=>engine.current?.input(field,value)}
          onCheck={()=>{engine.current?.check();void engine.current?.clickEffect();}}
          onDone={()=>{engine.current?.done();void engine.current?.clickEffect();}}
          onNew={()=>{engine.current?.newWhole();void engine.current?.clickEffect();}}
          onHelp={open=>{engine.current?.help(open);if(open)void engine.current?.clickEffect();}}
          onCloseFeedback={()=>{const state=engine.current?.snapshot().state;const kind=state?.phase==='correct-feedback'?'correct-close':state?.attempts===1?'wrong-close':'button';engine.current?.closeFeedback();void engine.current?.clickEffect(kind);}}
          onModalChange={modalChanged}/>}
    </div>
  </div>;
}
