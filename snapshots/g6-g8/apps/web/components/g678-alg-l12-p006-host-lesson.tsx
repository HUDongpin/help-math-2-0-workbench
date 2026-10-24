'use client';

import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {G678MultiPageLessonPlayer} from './g678-multi-page-lesson-player-v5.generated';
import {initialP006Clock} from '../../../packages/demos/src/alg-l12-p006-visual-clock';
import {decodeP006Audio, P006_AUDIO_SOURCE} from '../../../packages/demos/src/alg-l12-p006-audio-decode';
import {P006AudioTransport} from '../../../packages/demos/src/alg-l12-p006-audio-transport';
import {P006SpanishAudioController, type P006SpanishAudioSnapshot} from '../../../packages/demos/src/alg-l12-p006-spanish-audio';
import {p006CandidateHitRegions} from '../../../packages/demos/src/alg-l12-p006-glossary-hit';
import {p006TransportReady} from '../../../packages/demos/src/alg-l12-p006-host-policy';
import {P006_GLOSSARY_BUTTONS, requestP006GlossaryAfterVerifiedHit, type P006GlossaryState} from '../../../packages/demos/src/alg-l12-p006-glossary-state';
import type {PageOnlyLessonGlossaryEntry, PageOnlyLessonPlayerDescriptor} from '@/lib/whole-lesson-player-descriptor';

const ID = 'shared-alg001-l12-p006';
type Drawing = typeof import('../../../packages/demos/src/modules/shared-alg001-l12-p006').default;

function P006Runtime(props: LessonRuntimeAdapterProps & {glossaryEntries: readonly PageOnlyLessonGlossaryEntry[]}) {
  const latest = useRef(props);
  useLayoutEffect(() => {latest.current = props;}, [props]);
  const {connectRuntimeControls, onPlaybackStateChange} = props;
  const root = useRef<HTMLDivElement>(null);
  const clock = useRef(initialP006Clock());
  const [frame, setFrame] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [replay, setReplay] = useState(0);
  const [drawing, setDrawing] = useState<Drawing | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const readyRef = useRef(false), lastSeek = useRef<number | null>(null);
  const canvasReady = useRef(false);
  const transport = useRef<P006AudioTransport | null>(null);
  const spanishAudio = useRef<P006SpanishAudioController | null>(null);
  const spanishMode = useRef(false);
  const [spanishSelected, setSpanishSelected] = useState(false);
  const [spanishPhase, setSpanishPhase] = useState<P006SpanishAudioSnapshot['phase']>('idle');
  const returnMain = useRef<() => void>(() => {});
  const command = useRef(0), mounted = useRef(false);
  const pending = useRef<{entryId: string; trigger: HTMLButtonElement; seen: boolean} | null>(null);
  const [glossaryError, setGlossaryError] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [companionTarget, setCompanionTarget] = useState<HTMLElement | null>(null);
  const restoreFocus = useRef<HTMLButtonElement | null>(null);
  const publish = useCallback(() => {
    const state = transport.current?.snapshot();
    if (!state) return;
    clock.current = {frame: state.frame, elapsedMs: state.timelineSample * 1000 / 22050,
      playing: state.phase === 'playing' || state.phase === 'starting'};
    root.current?.setAttribute('data-p006-audio-phase', state.phase);
    root.current?.setAttribute('data-p006-audio-sample', String(state.timelineSample));
    setFrame(state.frame); setPlaying(clock.current.playing);
  }, []);
  const pause = useCallback(() => {
    command.current++; transport.current?.pause(); publish();
  }, [publish]);
  const start = useCallback(() => {
    const current = transport.current;
    if (!readyRef.current || !current || pending.current || spanishMode.current || current.snapshot().phase === 'ended') return false;
    const token = ++command.current;
    setAudioError(false);
    const task = current.play(); publish();
    void task.then(ok => {
      if (!mounted.current || token !== command.current) return;
      publish(); latest.current.onRuntimePausedChange(!ok);
    }).catch(() => {
      if (!mounted.current || token !== command.current) return;
      current.pause(); publish(); setAudioError(true); latest.current.onRuntimePausedChange(true);
    });
    return true;
  }, [publish]);

  const cancelSpanish = useCallback(() => {
    spanishMode.current = false; setSpanishSelected(false);
    spanishAudio.current?.stop();
  }, []);
  const returnToMain = useCallback(() => {
    // EA and natural SA completion resume the retained main cursor, never Replay.
    // start() rejects the terminal frame and a pending glossary.
    cancelSpanish();
    latest.current.onRuntimePausedChange(!start());
  }, [cancelSpanish, start]);
  useLayoutEffect(() => {returnMain.current = returnToMain;}, [returnToMain]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    let active = true;
    const controller = new P006SpanishAudioController({
      onChange(state) {
        if (!active) return;
        setSpanishPhase(state.phase);
        if (spanishMode.current) latest.current.onRuntimePausedChange(
          state.phase !== 'loading' && state.phase !== 'playing');
      },
      onEnded() {if (active && spanishMode.current) returnMain.current();},
    });
    controller.setVolume(latest.current.volume ?? 1);
    spanishAudio.current = controller;
    return () => {
      active = false; spanishMode.current = false; spanishAudio.current = null;
      void controller.close().catch(() => {});
    };
  }, []);

  const playSpanish = useCallback(() => {
    if (!readyRef.current || pending.current || !spanishAudio.current) return false;
    pause(); spanishMode.current = true; setSpanishSelected(true);
    // Only this explicit action loads SA. An ES locale never invokes it.
    void spanishAudio.current.start();
    return true;
  }, [pause]);
  const pauseAll = useCallback(() => {
    pause(); spanishAudio.current?.pause();
  }, [pause]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    mounted.current = true;
    let active = true;
    const abort = new AbortController();
    let context: AudioContext | null = null;
    const load = async () => {
      context = new AudioContext({sampleRate: 22050});
      const response = await fetch(`/flash-assets/g678-local/${ID}/source-audio?sha256=${P006_AUDIO_SOURCE.sha256}`,
        {signal: abort.signal, credentials: 'same-origin', cache: 'no-store'});
      if (!response.ok) throw Error('P006 audio unavailable');
      const decoded = await decodeP006Audio(context, await response.arrayBuffer());
      if (!active) return;
      transport.current = new P006AudioTransport(context, decoded);
      transport.current.setVolume(latest.current.volume ?? 1);
      setAudioReady(true);
      readyRef.current = canvasReady.current; setReady(readyRef.current);
      // Loading never starts narration, even when the host initially requests autoplay.
      latest.current.onRuntimePausedChange(true); publish();
    };
    void load().catch(() => {
      if (active) {setAudioError(true); readyRef.current = false; setReady(false); latest.current.onRuntimePausedChange(true);}
      if (context && context.state !== 'closed') void context.close().catch(() => {});
    });
    return () => {
      active = false; mounted.current = false;
      // This is a live cancellation counter, not a DOM ref captured by the effect.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      command.current++;
      abort.abort(); readyRef.current = false;
      const owned = transport.current; transport.current = null;
      if (owned) void owned.close().catch(() => {});
      else if (context && context.state !== 'closed') void context.close().catch(() => {});
    };
  }, [publish]);

  useEffect(() => {
    transport.current?.setVolume(props.volume ?? 1);
    spanishAudio.current?.setVolume(props.volume ?? 1);
  }, [props.volume]);

  useEffect(() => {
    const target = props.pageInteractionCompanionTargetId
      ? document.getElementById(props.pageInteractionCompanionTargetId) : null;
    // The host-owned portal node exists only after the parent DOM has committed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCompanionTarget(target?.dataset.pageInteractionCompanionHost === 'true' ? target : null);
  }, [props.pageInteractionCompanionTargetId]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    let active = true;
    void import('../../../packages/demos/src/modules/shared-alg001-l12-p006')
      .then(module => {if (active) setDrawing(module.default);})
      .catch(() => {if (active) setError(true);});
    return () => {active = false;};
  }, []);

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const changed = () => {
      if (media.matches) {
        pauseAll();
        latest.current.onRuntimePausedChange(true);
      }
    };
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, [pauseAll]);

  useEffect(() => {
    const element = root.current;
    if (!element || !drawing) return;
    const check = () => {
      const status = element.querySelector('[data-canvas-status]')?.getAttribute('data-canvas-status');
      canvasReady.current = p006TransportReady(canvasReady.current, status);
      const next = canvasReady.current && transport.current !== null;
      readyRef.current = next; setReady(next);
      if (status === 'error') {
        setError(true); pauseAll();
        latest.current.onRuntimePausedChange(true);
      }
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(element, {subtree: true, childList: true, attributes: true, attributeFilter: ['data-canvas-status']});
    return () => observer.disconnect();
  }, [drawing, pauseAll]);

  useEffect(() => connectRuntimeControls({
    setPaused(paused) {
      if (paused) {pauseAll(); return true;}
      return !(spanishMode.current ? playSpanish() : start());
    },
    replay() {
      if (pending.current) latest.current.onLessonHostRequest?.({type: 'close-glossary'});
      pending.current = null; setGlossaryOpen(false); setGlossaryError(false);
      cancelSpanish(); pause(); transport.current?.seekFrame(1);
      setReplay(value => value + 1); publish();
      latest.current.onRuntimePausedChange(!start());
      return true;
    },
    narration(action) {
      if (action === 'stop') {pauseAll(); latest.current.onRuntimePausedChange(true);}
      else latest.current.onRuntimePausedChange(!(spanishMode.current ? playSpanish() : start()));
    },
    stop() {cancelSpanish(); pause(); pending.current = null; setGlossaryOpen(false);},
  }), [connectRuntimeControls, pause, pauseAll, start, playSpanish, cancelSpanish, publish]);

  useEffect(() => {
    // Only explicit host controls start audio. Prop-driven modal/navigation pauses
    // may stop it, but a stale false prop never starts a new async playback task.
    if (props.paused) pauseAll();
  }, [props.paused, pauseAll]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const saved = pending.current;
      if (!saved) return;
      const open = document.querySelector(`[role="dialog"][data-glossary-entry-id="${saved.entryId}"]`);
      if (open) saved.seen = true;
      else if (saved.seen) {
        pending.current = null; restoreFocus.current = saved.trigger; setGlossaryOpen(false);
        // The private host transition owns stay-paused semantics. This observer
        // only restores focus and clears the outstanding interaction.
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
    return () => {
      observer.disconnect(); document.removeEventListener('keydown', onDialogKey, true);
      pending.current = null;
    };
  }, []);

  useEffect(() => {
    if (!glossaryOpen && restoreFocus.current) {
      const trigger = restoreFocus.current; restoreFocus.current = null;
      if (trigger.isConnected && !trigger.disabled) trigger.focus({preventScroll: true});
    }
  }, [glossaryOpen]);

  useEffect(() => {
    const request = props.seekRequest;
    if (!ready || pending.current || !request || request.requestId === lastSeek.current) return;
    lastSeek.current = request.requestId;
    if (!Number.isInteger(request.frame) || request.frame < 1 || request.frame > 342) return;
    // A host inspector command cancels the external SA transport and reflects that reset.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cancelSpanish(); pause(); transport.current?.seekFrame(request.frame); publish();
    latest.current.onRuntimePausedChange(true);
  }, [props.seekRequest, ready, pause, cancelSpanish, publish]);

  useEffect(() => {
    let handle = 0;
    const tick = () => {
      const wasPlaying = clock.current.playing;
      publish();
      const phase = transport.current?.snapshot().phase;
      if (wasPlaying && (phase === 'ended' || phase === 'paused' || phase === 'closed')) {
        latest.current.onRuntimePausedChange(true);
        if (phase === 'ended') latest.current.onPlaybackComplete?.();
      }
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => {cancelAnimationFrame(handle);};
  }, [publish]);

  useEffect(() => {
    onPlaybackStateChange?.({audioAvailable: audioReady, frame, frameCount: 342,
      frameDomain: 'sprite-53', fps: 12, narration: audioReady ?
        (spanishSelected ? spanishPhase === 'playing' || spanishPhase === 'loading' : playing) ? 'playing' : 'waiting' : 'unavailable',
      playbackProgress: ready ? (frame - 1) / 341 : null,
      seekAvailable: ready, stepFrames: 12, transportMode: ready ? 'visual-frame-inspector' : 'none'});
  }, [frame, ready, playing, audioReady, spanishSelected, spanishPhase, onPlaybackStateChange]);

  const Renderer = drawing?.textPresentation.Renderer;
  const openGlossary = (characterId: number, trigger: HTMLButtonElement) => {
    if (!readyRef.current || pending.current || spanishMode.current || !p006CandidateHitRegions(clock.current.frame).some(hit => hit.characterId === characterId)) return;
    const state: P006GlossaryState = {frame: clock.current.frame,
      transport: clock.current.frame === 342 ? 'stopped' : clock.current.playing ? 'playing' : 'paused', pendingGlossary: null};
    const request = requestP006GlossaryAfterVerifiedHit(state, characterId, true).pendingGlossary;
    const entry = latest.current.glossaryEntries.find(item => item.sourceKeyAttribute === request?.term);
    if (!entry || !/^[a-z0-9-]+$/.test(entry.id)) {setGlossaryError(true); return;}
    const decision = latest.current.onLessonHostRequest?.({type: 'open-glossary', entryId: entry.id}, {trigger});
    if (decision?.status !== 'allowed') {setGlossaryError(true); return;}
    // Release focus before React hides/inerts the companion. The accepted
    // host dialog takes autofocus on mount; denied requests keep trigger focus.
    if (document.activeElement === trigger) trigger.blur();
    pending.current = {entryId: entry.id, trigger,
      seen: Boolean(document.querySelector(`[role="dialog"][data-glossary-entry-id="${entry.id}"]`))};
    setGlossaryOpen(true);
    pause();
    latest.current.onRuntimePausedChange(true); setGlossaryError(false);
  };
  const companion = <>
    <section aria-label={props.uiLanguage === 'es' ? 'Audio en español opcional' : 'Optional Spanish audio'}
      data-p006-spanish-controls="explicit-only" style={{display: 'flex', flexWrap: 'wrap', gap: 8, padding: 12}}>
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
    <section aria-label={props.uiLanguage === 'es' ? 'Glosario de esta página' : 'Glossary for this page'}
      data-p006-glossary-controls="candidate-geometry" style={{display: 'flex', flexWrap: 'wrap', gap: 8, padding: 12}}>
      {p006CandidateHitRegions(frame).map(hit => {
        const term = P006_GLOSSARY_BUTTONS.find(button => button.characterId === hit.characterId)?.term;
        const entry = props.glossaryEntries.find(item => item.sourceKeyAttribute === term);
        return <button type="button" key={hit.characterId} data-source-character-id={hit.characterId}
          disabled={!ready || !entry || glossaryOpen || spanishSelected} style={{minHeight: 44, padding: '8px 14px'}}
          onClick={event => openGlossary(hit.characterId, event.currentTarget)}>
          {entry?.labels[props.uiLanguage === 'es' ? 'es' : 'en'] ?? term}
        </button>;
      })}
    </section>
    {glossaryError || audioError ? <p role="alert">{props.labels.unavailable}</p> : null}
    {spanishPhase === 'error' ? <p role="alert">{props.uiLanguage === 'es'
      ? 'El audio en español no está disponible. Inténtalo de nuevo o vuelve a la animación.'
      : 'Spanish audio is unavailable. Try again or return to the animation.'}</p> : null}
    <p lang={props.uiLanguage}>{props.uiLanguage === 'es'
      ? 'Dibujo original en inglés. Audio fuente con sincronización candidata; idioma, traducción y escucha pendientes. Candidato local de ingeniería.'
      : 'English source drawing. Source audio uses candidate synchronization; audio language, translation and listening remain pending. Local engineering candidate.'}</p>
  </>;
  return <div ref={root} className="runtime-shell" data-source-clock-runtime="p006-private-candidate"
    data-lesson-presentation="modern-text-v1" data-lesson-text-binding={drawing?.textPresentation.binding.version}
    style={{'--flash-stage-width': '800px', '--flash-stage-height': '600px', '--flash-stage-aspect': '800 / 600'} as CSSProperties}
    data-p006-host-probe="local-engineering" data-runtime-paused={!playing}
    data-p006-frame={frame} data-p006-ready={ready} data-audio-rendered={audioReady}
    data-p006-spanish-selected={spanishSelected} data-p006-spanish-phase={spanishPhase}
    data-p006-audio-candidate="continuous-stream-v2">
    {Renderer ? <Renderer frame={frame} frameDomain="sprite-53" scenario="source-static-frame"
      lang="en" uiLanguage={props.uiLanguage} seed={0} replay={replay} paused={!playing}/> : null}
    {error ? <p role="alert">{props.labels.unavailable}</p> : null}
    {companionTarget ? createPortal(companion, companionTarget) : null}
  </div>;
}

export function G678AlgL12P006HostLesson(props: Omit<ComponentProps<typeof G678MultiPageLessonPlayer>, 'privateRuntimeAdapter' | 'descriptor'> & {descriptor: PageOnlyLessonPlayerDescriptor}) {
  const adapter = useMemo(() => ({animationId: ID, audioEnabled: true, glossaryClosePolicy: 'stay-paused' as const,
    Component: (runtimeProps: LessonRuntimeAdapterProps) => <P006Runtime {...runtimeProps} glossaryEntries={props.descriptor.glossary}/>}), [props.descriptor.glossary]);
  return <G678MultiPageLessonPlayer {...props} privateRuntimeAdapter={adapter}/>;
}
