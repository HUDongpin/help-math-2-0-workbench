'use client';
import {useEffect, useMemo, useRef, useState} from 'react';
import {P037SourceAudio, type P037AudioSnapshot, type P037AudioDependencies} from './nms-l02-p037-audio-v1';
import {P037Practice} from './nms-l02-p037-practice-v1';
import {prepareP037Fonts} from './nms-l02-p037-fonts-v1';
import {createP037TermHost, p037SourceTerm} from './nms-l02-p037-term-host-v1';
import {NmsL2P037TermDialog} from './nms-l02-p037-term-dialog-v1';
import {P037_ID, p037Phase} from './nms-l02-p037-state-v1';
export interface P037PlayerControls {setPaused(value: boolean): void; replay(): boolean; narration(action: 'play' | 'stop'): void; stop(): void;}
export interface P037PlayerProps {
  readonly seed: number; readonly uiLanguage: 'en' | 'es'; readonly paused: boolean; readonly volume: number;
  readonly reducedMotion?: boolean; readonly readAudio: P037AudioDependencies['read'];
  readonly connectControls?: (controls: P037PlayerControls) => () => void;
  readonly onState?: (snapshot: P037AudioSnapshot) => void; readonly onPaused?: (paused: boolean) => void;
  readonly onReplay?: () => void; readonly onComplete?: () => void;
}
export function NmsL2P037Player(props: P037PlayerProps) {
  const latest = useRef(props); latest.current = props;
  const ready = useRef(false), engine = useRef<P037SourceAudio | null>(null), trigger = useRef<HTMLElement | null>(null);
  const seenPaused = useRef(false), host = useMemo(createP037TermHost, [props.seed]);
  const [assetsReady, setAssetsReady] = useState(false), [fontFailure, setFontFailure] = useState(false);
  const [snapshot, setSnapshot] = useState<P037AudioSnapshot | null>(null);
  useEffect(() => {
    let active = true;
    void prepareP037Fonts().then(() => {if (active) {ready.current = true; setAssetsReady(true);}})
      .catch(() => {if (active) {setFontFailure(true); latest.current.onPaused?.(true);}});
    return () => {active = false; ready.current = false;};
  }, []);
  useEffect(() => {
    let active = true, raf: number | null = null, lastState: P037AudioSnapshot['state'] | null = null;
    let lastPhase = '', completedReplay = -1, lastPaused: boolean | null = null;
    const publish = (s: P037AudioSnapshot) => {
      if (!active) return;
      setSnapshot(s); latest.current.onState?.(s);
      const paused = s.phase !== 'playing' || s.state.term !== null;
      if (lastPaused !== paused) {lastPaused = paused; latest.current.onPaused?.(paused);}
      if (p037Phase(s.state) === 'completed' && completedReplay !== s.state.replay) {
        completedReplay = s.state.replay; latest.current.onComplete?.();
      }
    };
    const tick = () => {
      raf = null; if (!active) return;
      const s = session.snapshot();
      if (s.state !== lastState || s.phase !== lastPhase) {lastState = s.state; lastPhase = s.phase; publish(s);}
      if (s.phase === 'playing') raf = requestAnimationFrame(tick);
    };
    const session = new P037SourceAudio({seed: props.seed, read: (d, signal) => latest.current.readAudio(d, signal), changed: s => {
      if (!active) return;
      publish(s);
      if (s.phase === 'playing' && raf === null) raf = requestAnimationFrame(tick);
      else if (s.phase !== 'playing' && raf !== null) {cancelAnimationFrame(raf); raf = null;}
    }});
    engine.current = session; session.setVolume(latest.current.volume);
    const resume = () => {
      if (!ready.current || session.snapshot().state.term !== null) {latest.current.onPaused?.(true); return;}
      void session.play();
    };
    const controls: P037PlayerControls = {
      setPaused(value) {if (!active) return; if (value) session.pause(); else resume();},
      replay() {
        if (!active || !ready.current) return false;
        host.dispatch({type: 'close-keyterm'}, session.snapshot().state);
        void session.replay(); latest.current.onReplay?.(); return true;
      },
      narration(action) {
        if (!active) return;
        if (action === 'play' && session.snapshot().state.term !== null) {latest.current.onPaused?.(true); return;}
        session.setNarrationEnabled(action === 'play'); if (action === 'play') resume();
      },
      stop() {if (!active) return; active = false; if (raf !== null) cancelAnimationFrame(raf); void session.close();},
    };
    const disconnect = latest.current.connectControls?.(controls);
    const visibility = () => {if (active && document.hidden) session.pause();};
    document.addEventListener('visibilitychange', visibility);
    return () => {
      active = false; if (raf !== null) cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', visibility); disconnect?.();
      if (engine.current === session) engine.current = null; void session.close();
    };
  }, [props.seed, host]);
  useEffect(() => {engine.current?.setVolume(props.volume);}, [props.volume]);
  useEffect(() => {
    if (props.paused) {seenPaused.current = true; engine.current?.pause();}
    else if (seenPaused.current && ready.current && engine.current?.snapshot().state.term === null) void engine.current.play();
  }, [props.paused, assetsReady]);
  if (fontFailure) return <p role="alert">{props.uiLanguage === 'es' ? 'El texto no está disponible.' : 'The text is unavailable.'}</p>;
  if (!snapshot || !assetsReady) return <p role="status">{props.uiLanguage === 'es' ? 'Cargando…' : 'Loading…'}</p>;
  const enabled = !['loading', 'failed', 'closed'].includes(snapshot.phase), term = snapshot.state.term ? p037SourceTerm(snapshot.state.term) : undefined;
  return <div data-p037-assets="ready" data-p037-audio-phase={snapshot.phase} data-p037-audio-frame={snapshot.state.mainFrame}>
    {snapshot.failure && <p role="alert">{props.uiLanguage === 'es' ? 'El audio no está disponible.' : 'Audio is unavailable.'}</p>}
    <P037Practice state={snapshot.state} language={props.uiLanguage} reducedMotion={props.reducedMotion} interactionEnabled={enabled}
      onChoose={id => engine.current?.choose(id)} onCancelSelection={() => engine.current?.cancelSelection()}
      onDrop={(id, target) => {if (ready.current && enabled) void engine.current?.drop(id, target);}}
      onClosePopup={() => engine.current?.closePopup()} onTerm={(id, node) => {
        const session = engine.current; if (!session || !enabled) return;
        const decision = host.dispatch({type: 'open-keyterm', entryId: id, sourceAnimationId: P037_ID,
          playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume'}, session.snapshot().state);
        if (decision.status === 'allowed') {trigger.current = node; session.openTerm(id);}
      }}/>
    {term && <NmsL2P037TermDialog term={term} language={props.uiLanguage} trigger={trigger.current} onClose={() => {
      const session = engine.current; if (!session) return;
      host.dispatch({type: 'close-keyterm'}, session.snapshot().state); session.closeTerm(); latest.current.onPaused?.(true);
    }}/>} 
  </div>;
}
