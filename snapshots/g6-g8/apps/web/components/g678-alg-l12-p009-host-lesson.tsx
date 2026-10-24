'use client';

import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type CSSProperties} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {G678AlgL12P006HostLesson} from './g678-alg-l12-p006-host-lesson';
import {P009EmbeddedAudioController, type P009EmbeddedAudioSnapshot} from '../../../packages/demos/src/alg-l12-p009-embedded-audio';
import {P009SpanishAudioController, type P009SpanishAudioSnapshot} from '../../../packages/demos/src/alg-l12-p009-spanish-audio';
import {requestP009Glossary} from '../../../packages/demos/src/alg-l12-p009-glossary';
import type {PageOnlyLessonGlossaryEntry, PageOnlyLessonPlayerDescriptor} from '@/lib/whole-lesson-player-descriptor';

import '../../../packages/demos/src/alg-l12-p009-typography.css';

const ID = 'shared-alg001-l12-p009';
type Drawing = typeof import('../../../packages/demos/src/modules/shared-alg001-l12-p009')['default'];

function P009Runtime(props: LessonRuntimeAdapterProps & {glossaryEntries: readonly PageOnlyLessonGlossaryEntry[]}) {
  const latest = useRef(props);
  useLayoutEffect(() => {latest.current = props;}, [props]);
  const {connectRuntimeControls, onPlaybackStateChange} = props;
  const root = useRef<HTMLDivElement>(null);
  const transport = useRef<P009EmbeddedAudioController | null>(null);
  const spanishAudio = useRef<P009SpanishAudioController | null>(null);
  const spanishMode = useRef(false), returnMain = useRef<() => void>(() => {});
  const [spanishSelected, setSpanishSelected] = useState(false);
  const [spanishPhase, setSpanishPhase] = useState<P009SpanishAudioSnapshot['phase']>('idle');
  const mounted = useRef(false), command = useRef(0);
  const lastPublished = useRef<P009EmbeddedAudioSnapshot | null>(null);
  const [frame, setFrame] = useState(1);
  const [phase, setPhase] = useState<P009EmbeddedAudioSnapshot['phase']>('paused');
  const [timelineSample, setTimelineSample] = useState(0);
  const playing = phase === 'playing';
  const [replay, setReplay] = useState(0);
  const [drawing, setDrawing] = useState<Drawing | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const readyRef = useRef(false), lastSeek = useRef<number | null>(null);
  const reduced = useRef(false);
  const activeSeek = useRef<number | null>(null);
  const pending = useRef<{entryId: string; trigger: HTMLButtonElement; seen: boolean} | null>(null);
  const restoreFocus = useRef<HTMLButtonElement | null>(null);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [glossaryError, setGlossaryError] = useState(false);
  const publish = useCallback(() => {
    const state = transport.current?.snapshot();
    if (!state) return;
    const old = lastPublished.current;
    if (!old || old.frame !== state.frame || old.phase !== state.phase) {
      setFrame(state.frame); setPhase(state.phase); setTimelineSample(state.timelineSample);
      lastPublished.current = state;
    }
  }, []);
  const pause = useCallback(() => {
    command.current++; transport.current?.pause(); publish();
  }, [publish]);
  const play = useCallback(() => {
    const owned = transport.current;
    if (!readyRef.current || pending.current || spanishMode.current || !owned) return false;
    activeSeek.current = null;
    if (owned.snapshot().frame === 394) owned.reset();
    const token = ++command.current;
    latest.current.onRuntimePausedChange(false);
    const started = owned.play(); publish();
    void started.then(ok => {
      if (!mounted.current || command.current !== token || transport.current !== owned) return;
      publish(); latest.current.onRuntimePausedChange(!ok || owned.snapshot().phase !== 'playing');
    });
    return true;
  }, [publish]);

  const cancelSpanish = useCallback(() => {
    spanishMode.current = false; setSpanishSelected(false); spanishAudio.current?.stop();
  }, []);
  const pauseAll = useCallback(() => {pause(); spanishAudio.current?.pause();}, [pause]);
  const returnToMain = useCallback(() => {
    cancelSpanish();
    // Source EA/natural completion resumes the retained nonterminal cursor.
    // The modern terminal hold must never become an implicit Replay.
    const current = transport.current?.snapshot();
    if (!current || current.frame >= 394 || pending.current || !play())
      latest.current.onRuntimePausedChange(true);
  }, [cancelSpanish, play]);
  useLayoutEffect(() => {returnMain.current = returnToMain;}, [returnToMain]);
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    let active = true;
    const owned = new P009SpanishAudioController({origin: window.location.origin,
      onChange(state) {
        if (!active) return;
        setSpanishPhase(state.phase);
        if (spanishMode.current) latest.current.onRuntimePausedChange(
          state.phase !== 'loading' && state.phase !== 'playing');
      },
      onEnded() {if (active && spanishMode.current) returnMain.current();},
    });
    owned.setVolume(latest.current.volume ?? 1); spanishAudio.current = owned;
    return () => {
      active = false; spanishMode.current = false;
      if (spanishAudio.current === owned) spanishAudio.current = null;
      void owned.close().catch(() => {});
    };
  }, []);
  const playSpanish = useCallback(() => {
    if (!readyRef.current || pending.current || !spanishAudio.current) return false;
    pause(); activeSeek.current = null;
    spanishMode.current = true; setSpanishSelected(true);
    // Explicit SA action only; changing locale or completing a load is not play.
    void spanishAudio.current.start(); return true;
  }, [pause]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    mounted.current = true;
    const owned = new P009EmbeddedAudioController({origin: window.location.origin});
    owned.setVolume(latest.current.volume ?? 1);
    reduced.current = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // No context, network request or sound on entry. Reduced motion starts at
    // the complete, source-readable frame; explicit Play/Replay may start anew.
    if (reduced.current) owned.seekFrame(394);
    transport.current = owned; publish();
    latest.current.onRuntimePausedChange(true);
    return () => {
      mounted.current = false;
      // Live cancellation generation; this ref is not a captured DOM node.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      command.current++;
      readyRef.current = false;
      if (transport.current === owned) transport.current = null;
      void owned.close().catch(() => {});
    };
  }, [publish]);

  useEffect(() => {
    transport.current?.setVolume(props.volume ?? 1); spanishAudio.current?.setVolume(props.volume ?? 1);
  }, [props.volume]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    let active = true;
    void import('../../../packages/demos/src/modules/shared-alg001-l12-p009')
      .then(module => {if (active) setDrawing(module.default);})
      .catch(() => {if (active) setError(true);});
    return () => {active = false;};
  }, []);

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const changed = () => {
      reduced.current = media.matches;
      if (media.matches) {pauseAll(); latest.current.onRuntimePausedChange(true);}
    };
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, [pauseAll]);

  useEffect(() => {
    const element = root.current;
    if (!element || !drawing) return;
    const check = () => {
      const status = element.querySelector('[data-canvas-status]')?.getAttribute('data-canvas-status');
      const next = status === 'ready' && transport.current !== null;
      if (next) setError(false);
      readyRef.current = next; setReady(next);
      if (status === 'error') {
        setError(true); pauseAll(); latest.current.onRuntimePausedChange(true);
      }
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(element, {subtree: true, childList: true, attributes: true, attributeFilter: ['data-canvas-status']});
    return () => observer.disconnect();
  }, [drawing, pauseAll]);

  useEffect(() => connectRuntimeControls({
    setPaused(paused) {if (paused) pauseAll(); else if (spanishMode.current) playSpanish(); else play();},
    replay() {
      cancelSpanish();
      const hadGlossary = pending.current !== null;
      pending.current = null; restoreFocus.current = null; setGlossaryOpen(false); setGlossaryError(false);
      activeSeek.current = null;
      if (hadGlossary) latest.current.onLessonHostRequest?.({type: 'close-glossary'});
      command.current++; transport.current?.reset(); setReplay(value => value + 1); publish();
      if (!play()) latest.current.onRuntimePausedChange(true);
      return true;
    },
    narration(action) {if (action === 'play') {if (spanishMode.current) playSpanish(); else play();} else pauseAll();},
    stop() {
      cancelSpanish(); pause();
      const hadGlossary = pending.current !== null;
      pending.current = null; restoreFocus.current = null; setGlossaryOpen(false);
      activeSeek.current = null;
      if (hadGlossary) latest.current.onLessonHostRequest?.({type: 'close-glossary'});
    },
  }), [connectRuntimeControls, pause, pauseAll, play, playSpanish, cancelSpanish, publish]);

  useEffect(() => {
    // Continue is a real user action in the shared frame inspector. That host
    // clears its exact seek request instead of calling the adapter controls.
    // Generic props.paused=false (including glossary close) never starts audio.
    if (props.paused === true) pauseAll();
    else if (spanishMode.current) return;
    else if (!props.seekRequest && activeSeek.current !== null && !pending.current) {
      activeSeek.current = null;
      if (!play()) latest.current.onRuntimePausedChange(true);
    } else if (!props.seekRequest && !pending.current && transport.current) {
      const state = transport.current.snapshot();
      // The shared button sets paused=false after calling our controls, even
      // when assets are not ready. Reconcile after that commit; never queue play.
      if (state.phase !== 'playing' && state.phase !== 'loading')
        latest.current.onRuntimePausedChange(true);
    }
  }, [props.paused, props.seekRequest, pauseAll, play]);

  useEffect(() => {
    const request = props.seekRequest;
    if (!ready || pending.current || !request || request.requestId === lastSeek.current) return;
    if (!Number.isInteger(request.frame) || request.frame < 1 || request.frame > 394) return;
    // Synchronize an external host seek with both owned audio controllers and
    // their visible selection state before the new source frame is presented.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cancelSpanish(); lastSeek.current = request.requestId; activeSeek.current = request.requestId;
    command.current++; transport.current?.seekFrame(request.frame); publish();
    latest.current.onRuntimePausedChange(true);
  }, [props.seekRequest, ready, publish, cancelSpanish]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const saved = pending.current;
      if (!saved) return;
      if (document.querySelector(`[role="dialog"][data-glossary-entry-id="${saved.entryId}"]`)) saved.seen = true;
      else if (saved.seen) {
        pending.current = null; restoreFocus.current = saved.trigger; setGlossaryOpen(false);
            pause();
        latest.current.onRuntimePausedChange(true);
      }
    });
    observer.observe(document.body, {subtree: true, childList: true});
    const onDialogKey = (event: KeyboardEvent) => {
      const saved = pending.current;
      if (!saved) return;
      const dialog = document.querySelector<HTMLElement>(`[role="dialog"][data-glossary-entry-id="${saved.entryId}"]`);
      if (!dialog) return;
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopPropagation();
        latest.current.onLessonHostRequest?.({type: 'close-glossary'});
      } else if (event.key === 'Tab') {
        const controls = Array.from(dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )).filter(element => element.getClientRects().length > 0 && !element.closest('[hidden], [inert], [aria-hidden="true"]'));
        if (!controls.length) return;
        event.preventDefault(); event.stopPropagation();
        const index = controls.indexOf(document.activeElement as HTMLElement);
        const next = index < 0 ? (event.shiftKey ? controls.length - 1 : 0)
          : (index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
        controls[next]?.focus({preventScroll: true});
      }
    };
    document.addEventListener('keydown', onDialogKey, true);
    return () => {observer.disconnect(); document.removeEventListener('keydown', onDialogKey, true); pending.current = null;};
  }, [pause]);
  useEffect(() => {
    if (!glossaryOpen && restoreFocus.current) {
      const trigger = restoreFocus.current; restoreFocus.current = null;
      if (trigger.isConnected && !trigger.disabled) trigger.focus({preventScroll: true});
    }
  }, [glossaryOpen]);

  useEffect(() => {
    let handle = 0;
    const tick = () => {
      const before = lastPublished.current?.phase;
      publish();
      const state = lastPublished.current;
      if (before === 'playing' && state?.phase !== 'playing') {
        latest.current.onRuntimePausedChange(true);
        if (state?.phase === 'ended') latest.current.onPlaybackComplete?.();
      }
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [publish]);

  useEffect(() => {
    onPlaybackStateChange?.({audioAvailable: ready, frame, frameCount: 394,
      frameDomain: 'sprite-62', fps: 12, narration: ready ?
        (spanishSelected ? spanishPhase === 'playing' || spanishPhase === 'loading' : playing || phase === 'loading')
          ? 'playing' : 'waiting' : 'unavailable',
      playbackProgress: ready ? (frame - 1) / 393 : null,
      seekAvailable: ready, stepFrames: 12, transportMode: ready ? 'visual-frame-inspector' : 'none'});
  }, [frame, ready, playing, phase, spanishSelected, spanishPhase, onPlaybackStateChange]);

  const Renderer = drawing?.textPresentation.Renderer;
  const openGlossary = (characterId: number, displayedFrame: number, trigger: HTMLButtonElement) => {
    if (!readyRef.current || spanishMode.current || displayedFrame !== lastPublished.current?.frame) return;
    const intent = requestP009Glossary(transport.current?.snapshot().frame ?? 0, characterId, Boolean(pending.current));
    if (!intent) return;
    const entry = latest.current.glossaryEntries.find(item => item.sourceKeyAttribute === intent.sourceKeyAttribute);
    if (!entry || !/^[a-z0-9-]+$/.test(entry.id)) {setGlossaryError(true); return;}
    pause();
    latest.current.onRuntimePausedChange(true);
    const decision = latest.current.onLessonHostRequest?.({type: 'open-glossary', entryId: entry.id}, {trigger});
    if (decision?.status !== 'allowed') {setGlossaryError(true); return;}
    pending.current = {entryId: entry.id, trigger,
      seen: Boolean(document.querySelector(`[role="dialog"][data-glossary-entry-id="${entry.id}"]`))};
    pause();
    setGlossaryOpen(true); setGlossaryError(false); latest.current.onRuntimePausedChange(true);
  };
  return <div ref={root} className="runtime-shell"
    data-lesson-presentation="modern-text-v1" data-lesson-text-binding="p009-source-native-text-v1"
    style={{'--flash-stage-width': '800px', '--flash-stage-height': '600px', '--flash-stage-aspect': '800 / 600'} as CSSProperties}
    data-p009-host="source-bound-local" data-runtime-paused={!playing}
    data-p009-frame={frame} data-p009-ready={ready} data-audio-rendered={phase === 'playing'}
    data-p009-audio-phase={phase} data-p009-timeline-sample={timelineSample}
    data-p009-audio-candidate="continuous-stream-v1"
    data-p009-spanish-selected={spanishSelected} data-p009-spanish-phase={spanishPhase}>
    {Renderer ? <Renderer frame={frame} frameDomain="sprite-62" scenario="source-static-frame"
      lang="en" uiLanguage={props.uiLanguage} seed={0} replay={replay} paused={!playing}
      glossaryDisabled={!ready || glossaryOpen || spanishSelected} onTermActivate={openGlossary}/> : null}
    <section aria-label={props.uiLanguage === 'es' ? 'Audio en español opcional' : 'Optional Spanish audio'}
      data-p009-spanish-controls="explicit-only" style={{display: 'flex', flexWrap: 'wrap', gap: 8, padding: 12}}>
      <button type="button" disabled={!ready || glossaryOpen || spanishPhase === 'loading' || spanishPhase === 'playing'}
        style={{minHeight: 44, padding: '8px 14px'}} onClick={playSpanish}>
        {props.uiLanguage === 'es' ? 'Reproducir audio en español desde el inicio' : 'Play Spanish audio from start'}
      </button>
      <button type="button" disabled={!spanishSelected || (spanishPhase !== 'loading' && spanishPhase !== 'playing')}
        style={{minHeight: 44, padding: '8px 14px'}} onClick={() => {pauseAll(); latest.current.onRuntimePausedChange(true);}}>
        {props.uiLanguage === 'es' ? 'Pausar audio en español' : 'Pause Spanish audio'}
      </button>
      <button type="button" disabled={!spanishSelected} style={{minHeight: 44, padding: '8px 14px'}} onClick={returnToMain}>
        {props.uiLanguage === 'es' ? 'Volver a la animación' : 'Return to animation'}
      </button>
      <p role="status">{props.uiLanguage === 'es'
        ? 'Audio opcional: la animación espera mientras lo escuchas. Al reproducirlo de nuevo, empieza desde el inicio.'
        : 'Optional audio: the animation waits while you listen. Playing this audio again starts it from the beginning.'}</p>
    </section>
    {spanishPhase === 'error' ? <p role="alert">{props.uiLanguage === 'es'
      ? 'El audio en español no está disponible. Vuelve a intentarlo o regresa a la animación.'
      : 'Spanish audio is unavailable. Try again or return to the animation.'}</p> : null}
    {error || glossaryError ? <p role="alert">{props.labels.unavailable}</p> : null}
    {phase === 'error' ? <p role="alert">{props.uiLanguage === 'es'
      ? 'El audio fuente no está disponible. Pulsa Reproducir para volver a intentarlo.'
      : 'Source audio is unavailable. Press Play to try again.'}</p> : null}
    <p lang={props.uiLanguage}>{props.uiLanguage === 'es'
      ? 'Dibujo original en inglés. Audio con sincronización candidata; escucha y traducción pendientes. Vista local de ingeniería.'
      : 'English source drawing. Source audio uses candidate synchronization; listening and translation remain pending. Local engineering view.'}</p>
  </div>;
}

export function G678AlgL12P009HostLesson(props: Omit<ComponentProps<typeof G678AlgL12P006HostLesson>, 'privateRuntimeAdapters' | 'descriptor'> & {descriptor: PageOnlyLessonPlayerDescriptor}) {
  const adapter = useMemo(() => ({animationId: ID, audioEnabled: true, glossaryClosePolicy: 'stay-paused' as const,
    Component: (runtimeProps: LessonRuntimeAdapterProps) => <P009Runtime {...runtimeProps} glossaryEntries={props.descriptor.glossary}/>}), [props.descriptor.glossary]);
  const adapters = useMemo(() => [adapter], [adapter]);
  return <G678AlgL12P006HostLesson {...props} privateRuntimeAdapters={adapters}/>;
}
