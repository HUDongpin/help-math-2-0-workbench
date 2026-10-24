'use client';
import {useEffect, useId, useRef, useState} from 'react';
import {P038Session, type P038AudioSource, type P038SessionOptions} from './alg-l08-p038-session-v1';
import {p038InitialState, type P038Term} from './alg-l08-p038-state-v1';
import {p038View} from './alg-l08-p038-frame-v1';
import {ALG_L08_P038_PRESENTATION_SOURCE as V} from './alg-l08-p038-presentation-source-v1';
import {AlgL08P038Presentation} from './alg-l08-p038-presentation-v1';

export interface AlgL08P038Controls {
  setPaused(value: boolean): void;
  replay(): boolean;
  narration(action: 'play' | 'stop'): void;
  stop(): void;
  closeGlossary(): void;
  inspect(frame: number): boolean;
}
export interface AlgL08P038PlayerProps {
  seed: number; uiLanguage: 'en' | 'es'; paused?: boolean; volume?: number; reducedMotion?: boolean;
  audioSource: P038AudioSource; readAudio: P038SessionOptions['load'];
  connectControls?: (controls: AlgL08P038Controls) => () => void;
  onState?: (snapshot: ReturnType<P038Session['snapshot']>) => void;
  onPaused?: (paused: boolean) => void; onReplay?: () => void;
  onGlossary?: (term: P038Term, trigger: HTMLButtonElement) => void;
}
function TermDialog({term, language, trigger, close}: {
  term: P038Term; language: 'en' | 'es'; trigger: HTMLButtonElement | null; close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null), heading = useRef<HTMLHeadingElement>(null), id = useId();
  const entry = V.terms.find(candidate => candidate.id === V.sourceTermKeys[term])!;
  useEffect(() => {
    const element = dialog.current; element?.showModal(); heading.current?.focus();
    return () => { element?.close(); if (trigger?.isConnected) trigger.focus({preventScroll: true}); };
  }, [term, trigger]);
  return <dialog ref={dialog} className="alg-l08-p038__dialog" lang={language} aria-labelledby={id}
    data-p038-glossary-id={entry.id} onCancel={event => { event.preventDefault(); close(); }}>
    <h2 ref={heading} id={id} tabIndex={-1}>{entry.labels[language]}</h2>
    <p>{entry.definitions[language]}</p>
    <p>{language === 'es' ? 'La animación seguirá en pausa al cerrar. Usa Reanudar para continuar.' : 'The animation will stay paused when you close. Use Resume to continue.'}</p>
    <button type="button" onClick={close}>{language === 'es' ? 'Cerrar' : 'Close'}</button>
  </dialog>;
}
/** One source-owned session; main585 and explicit SA are the only audio owners.
 * A source clock never starts on mount, locale change, visibility return or reduced-motion change. */
export function AlgL08P038Player(props: AlgL08P038PlayerProps) {
  const latest = useRef(props); latest.current = props;
  const engine = useRef<P038Session | null>(null), root = useRef<HTMLDivElement>(null);
  const termTrigger = useRef<HTMLButtonElement | null>(null);
  const helpTrigger = useRef<HTMLElement | SVGElement | null>(null), drawTrigger = useRef<HTMLElement | SVGElement | null>(null);
  const [snapshot, setSnapshot] = useState<ReturnType<P038Session['snapshot']> | null>(null);
  useEffect(() => {
    let active = true, raf: number | null = null, last = '';
    const update = () => {
      if (!active) return;
      const next = session.snapshot(), key = JSON.stringify(next);
      if (key !== last) { last = key; setSnapshot(next); latest.current.onState?.(next); }
      if (!next.failure && !next.loading && (next.state.playing || next.mode === 'sa' && next.spanishPhase === 'playing') && raf === null)
        raf = requestAnimationFrame(tick);
    };
    const tick = () => { raf = null; session.tick(); update(); };
    const session = new P038Session(props.audioSource, {load: (id, signal) => latest.current.readAudio(id, signal), changed: update});
    engine.current = session; session.setVolume(latest.current.volume ?? .8); update();
    const reportPause = () => {
      if (!active) return;
      const value = session.snapshot();
      latest.current.onPaused?.(!(value.state.playing || value.mode === 'sa' && value.spanishPhase === 'playing'));
    };
    const play = () => { void session.play().then(reportPause); };
    const controls: AlgL08P038Controls = {
      setPaused(value) { if (!active) return; if (value) { session.pause(); reportPause(); } else play(); },
      replay() { if (!active) return false; latest.current.onReplay?.(); void session.replay().then(reportPause); return true; },
      narration(action) { if (!active) return; if (action === 'stop') { session.pause(); reportPause(); } else play(); },
      stop() { if (active) void session.close(); },
      closeGlossary() { if (active) { session.closeGlossary(); latest.current.onPaused?.(true); } },
      inspect(frame) { return active && session.inspect(frame); },
    };
    const disconnect = latest.current.connectControls?.(controls);
    const hidden = () => { if (document.hidden) { session.pause(); reportPause(); } };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      active = false; if (raf !== null) cancelAnimationFrame(raf); disconnect?.();
      document.removeEventListener('visibilitychange', hidden);
      if (engine.current === session) engine.current = null;
      void session.close();
    };
  }, [props.seed, props.audioSource]);
  useEffect(() => { engine.current?.setVolume(props.volume ?? .8); }, [props.volume]);
  useEffect(() => { if (props.paused) engine.current?.pause(); }, [props.paused]);
  const state = snapshot?.state ?? p038InitialState(), es = props.uiLanguage === 'es';
  const view = p038View(state, {frame: state.mainFrame, frameDomain: 'sprite-585', scenario: 'source-vocabulary', lang: props.uiLanguage, seed: props.seed, replay: state.replay});
  const playing = state.playing || snapshot?.mode === 'sa' && snapshot.spanishPhase === 'playing';
  const locked = Boolean(snapshot?.loading) || snapshot?.mode === 'sa';
  const priorWrong = useRef(false), priorHelp = useRef(false), priorHint = useRef(false), priorGlossary = useRef(false);
  const restoreFocus = (target: HTMLElement | SVGElement | null) => {
    if (target instanceof HTMLElement && target.isConnected && (!(target instanceof HTMLButtonElement) || !target.disabled)) target.focus({preventScroll: true});
    else root.current?.querySelector<HTMLElement>('[data-p038-graph-scroll]')?.focus({preventScroll: true});
  };
  useEffect(() => { if (priorWrong.current && !state.wrong) restoreFocus(drawTrigger.current); priorWrong.current = Boolean(state.wrong); }, [state.wrong]);
  useEffect(() => { if (priorHelp.current && !state.help) restoreFocus(helpTrigger.current); priorHelp.current = state.help; }, [state.help]);
  useEffect(() => { if (priorHint.current && !state.hint) restoreFocus(drawTrigger.current); priorHint.current = Boolean(state.hint); }, [state.hint]);
  // The host closes before the glossary buttons re-enable and the coach dialog reopens.
  useEffect(() => { if (priorGlossary.current && !state.glossary) restoreFocus(termTrigger.current); priorGlossary.current = Boolean(state.glossary); }, [state.glossary]);
  const closeTerm = () => { engine.current?.closeGlossary(); latest.current.onPaused?.(true); };
  return <div ref={root} className="alg-l08-p038-player" data-p038-phase={snapshot?.phase ?? 'initializing'}
    data-p038-frame={state.mainFrame} data-p038-quiz-phase={state.phase} data-p038-attempts={state.quizTryCount}
    data-p038-y={state.Y} data-p038-c={state.C} data-p038-mc-count={state.mcCount} data-p038-clones={state.clones.length}
    data-p038-line-present={Boolean(state.line)} data-p038-line-visible={Boolean(state.line?.visible)}
    data-p038-help-visible={state.help} data-p038-hint-visible={Boolean(state.hint)} data-p038-wrong-visible={Boolean(state.wrong)}
    data-p038-replay={state.replay} data-p038-audio-mode={snapshot?.mode ?? 'main'} data-p038-glossary={state.glossary ?? ''}
    data-p038-modern-retry-restorations={state.wrongCloseEffects.flatMap(effect => effect.modernRestoredFixed).length}
    data-p038-reduced-motion={props.reducedMotion ?? false}>
    <AlgL08P038Presentation view={view} controlsLocked={locked}
      onNamedPoint={name => engine.current?.namedPoint(name)} onBackgroundPoint={point => engine.current?.backgroundPoint(point)} onClonePoint={name => engine.current?.clonePoint(name)}
      onSubmit={trigger => { drawTrigger.current = trigger ?? null; void engine.current?.submit(); }}
      onWrongClose={() => { void engine.current?.closeWrong(); }}
      onHelp={trigger => { helpTrigger.current = trigger ?? null; engine.current?.openHelp(); }} onHelpClose={() => engine.current?.closeHelp()} onHintClose={() => engine.current?.closeHint()}
      onTerm={(term, trigger) => { if (!engine.current?.openGlossary(term)) return; termTrigger.current = trigger; latest.current.onPaused?.(true); latest.current.onGlossary?.(term, trigger); }} />
    <div className="alg-l08-p038-player__controls" lang={props.uiLanguage}>
      {!props.connectControls && <><button type="button" disabled={Boolean(state.glossary) || Boolean(snapshot?.loading)} onClick={() => playing ? engine.current?.pause() : void engine.current?.play()}>{playing ? es ? 'Pausa' : 'Pause' : es ? 'Reanudar' : 'Resume'}</button>
        <button type="button" onClick={() => { latest.current.onReplay?.(); void engine.current?.replay(); }}>{es ? 'Repetir' : 'Replay'}</button></>}
      <button type="button" data-p038-spanish-audio="true" disabled={Boolean(state.glossary || state.help || state.hint || state.wrong || snapshot?.loading) || !props.audioSource.sa}
        onClick={() => { void engine.current?.spanishAudio(); }}>{es ? 'Audio en español' : 'Spanish Audio'}</button>
      {snapshot?.mode === 'sa' && <button type="button" data-p038-return="true" onClick={() => { engine.current?.returnMain(); latest.current.onPaused?.(true); }}>{es ? 'Volver a la animación' : 'Return to animation'}</button>}
    </div>
    {state.glossary && !props.onGlossary && <TermDialog term={state.glossary} language={props.uiLanguage} trigger={termTrigger.current} close={closeTerm} />}
    {snapshot?.failure && <p role="alert" lang={props.uiLanguage}>{es ? 'No se pudo reproducir el audio. Inténtalo de nuevo.' : 'Audio could not play. Please try again.'}</p>}
  </div>;
}
