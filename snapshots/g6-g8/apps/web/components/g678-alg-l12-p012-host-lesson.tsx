'use client';

import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type CSSProperties} from 'react';
import {G678AlgL12P006HostLesson} from './g678-alg-l12-p006-host-lesson';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import type {PageOnlyLessonPlayerDescriptor} from '@/lib/whole-lesson-player-descriptor';
import {initialP012Lesson, reduceP012Lesson, type P012LessonAction} from '../../../packages/demos/src/alg-l12-p012-lesson';
import {P012Controls} from '../../../packages/demos/src/alg-l12-p012-controls';
import {P012AudioController} from '../../../packages/demos/src/alg-l12-p012-audio';
import {P012TypographyRenderer, type P012TypographyAsset} from '../../../packages/demos/src/alg-l12-p012-typography-renderer';
import {p012AssetPath as assetPath, loadP012Typography as loadTypography, type P012Assets as Assets} from '../../../packages/demos/src/alg-l12-p012-typography-asset';
import type {P012Action} from '../../../packages/demos/src/alg-l12-p012-state';
import '../../../packages/demos/src/alg-l12-p012.css';
import '../../../packages/demos/src/alg-l12-p012-typography.css';

const ID = 'shared-alg001-l12-p012';

function P012Runtime(props: LessonRuntimeAdapterProps & {assets: Assets; coordinateEntryId: string}) {
  const {connectRuntimeControls, onPlaybackStateChange} = props;
  const latest = useRef(props);
  useLayoutEffect(() => {latest.current = props;}, [props]);
  const [view, setView] = useState(() => initialP012Lesson());
  const state = useRef(view), mounted = useRef(false), command = useRef(0);
  const audio = useRef<P012AudioController | null>(null);
  const root = useRef<HTMLDivElement>(null), readyRef = useRef(false);
  const [asset, setAsset] = useState<P012TypographyAsset | null>(null);
  const [ready, setReady] = useState(false), [error, setError] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const pendingGlossary = useRef<{trigger: HTMLButtonElement; seen: boolean} | null>(null);
  const coachStarted = useRef(false);
  const apply = useCallback((action: P012LessonAction) => {
    const next = reduceP012Lesson(state.current, action);
    if (next !== state.current) {state.current = next; if (mounted.current) setView(next);}
  }, []);
  const pause = useCallback(() => {
    command.current++; apply({kind: 'pause'}); audio.current?.pause();
    latest.current.onRuntimePausedChange(true);
  }, [apply]);
  const play = useCallback(() => {
    const owned = audio.current;
    if (!readyRef.current || !owned || state.current.glossaryOpen || state.current.phase === 'left') return false;
    const token = ++command.current;
    if (state.current.phase === 'interaction' && !state.current.interaction.coach.playing) {
      apply({kind: 'play'}); latest.current.onRuntimePausedChange(false); return true;
    }
    const request = state.current.phase === 'intro' ? owned.play() : owned.resume();
    void request.then(ok => {
      if (!mounted.current || token !== command.current || audio.current !== owned) return;
      setAudioError(!ok);
      if (ok) {apply({kind: 'play'}); latest.current.onRuntimePausedChange(false);}
      else pause();
    }).catch(() => {if (mounted.current && token === command.current) {setAudioError(true); pause();}});
    return true;
  }, [apply, pause]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const commands = command;
    mounted.current = true;
    const owned = new P012AudioController({origin: window.location.origin,
      mainPath: assetPath(props.assets, 'main.mp3'), coachPath: assetPath(props.assets, 'coach.mp3'),
      onChange(snapshot) {
        if (!mounted.current || !audio.current || audio.current !== owned) return;
        if (snapshot.phase === 'error') {setAudioError(true); if (!state.current.paused) pause();}
        else if (snapshot.phase === 'paused' && !state.current.paused &&
          (state.current.phase === 'intro' || state.current.interaction.coach.playing)) pause();
      },
    });
    audio.current = owned; owned.setVolume(latest.current.volume ?? 1);
    const initial = initialP012Lesson(0, matchMedia('(prefers-reduced-motion: reduce)').matches);
    state.current = initial;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setView(initial); latest.current.onRuntimePausedChange(true);
    if (initial.frame === 119) owned.seekFrame(119);
    void loadTypography(props.assets).then(value => {if (mounted.current && audio.current === owned) setAsset(value);})
      .catch(() => {if (mounted.current && audio.current === owned) setError(true);});
    const hidden = () => {if (document.hidden) pause();};
    document.addEventListener('visibilitychange', hidden);
    return () => {
      mounted.current = false; commands.current++; readyRef.current = false;
      state.current = reduceP012Lesson(state.current, {kind: 'navigation'});
      document.removeEventListener('visibilitychange', hidden);
      pendingGlossary.current = null;
      if (audio.current === owned) audio.current = null;
      void owned.close().catch(() => {});
    };
  }, [props.assets, pause]);
  useEffect(() => {audio.current?.setVolume(props.volume ?? 1);}, [props.volume]);
  useEffect(() => {if (props.paused && !state.current.paused) pause();}, [props.paused, pause]);

  useEffect(() => {
    const element = root.current; if (!element || !asset) return;
    const check = () => {
      const status = element.querySelector('[data-canvas-status]')?.getAttribute('data-canvas-status');
      if (status === 'ready') {readyRef.current = true; setReady(true); setError(false);}
      if (status === 'error') {readyRef.current = false; setReady(false); setError(true); pause();}
    };
    check(); const observer = new MutationObserver(check);
    observer.observe(element, {subtree: true, childList: true, attributes: true, attributeFilter: ['data-canvas-status']});
    return () => observer.disconnect();
  }, [asset, pause]);

  useEffect(() => {
    let frame = 0, tickAt = performance.now();
    const tick = (now: number) => {
      const owned = audio.current, snapshot = owned?.snapshot();
      if (state.current.paused || !snapshot || snapshot.phase === 'loading') tickAt = now;
      else if (state.current.phase === 'intro') {
        while (state.current.frame < snapshot.mainFrame && state.current.phase === 'intro') apply({kind: 'tick'});
        tickAt = now;
      } else if (state.current.phase === 'interaction') {
        if (state.current.interaction.coach.playing) {
          if (snapshot.coachPlaying && snapshot.coachLabel === state.current.interaction.coach.label) {
            coachStarted.current = true;
            while (state.current.interaction.coach.playing && state.current.interaction.coach.frame < snapshot.coachFrame) apply({kind: 'tick'});
          } else if (coachStarted.current && snapshot.coachLabel === null) {
            for (let step = 0; step < 16 && state.current.interaction.coach.playing; step++) apply({kind: 'tick'});
            coachStarted.current = false;
          }
          tickAt = now;
        }
        else if (now - tickAt > 1000) {pause(); tickAt = now;}
        else {
          while (now - tickAt >= 1000 / 12) {apply({kind: 'tick'}); tickAt += 1000 / 12;}
          if (!state.current.interaction.coach.playing && snapshot.coachLabel !== null) owned?.stopCoach();
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [apply, pause]);

  useEffect(() => connectRuntimeControls({
    setPaused(value) {if (value) pause(); else play();},
    replay() {
      pause(); pendingGlossary.current = null;
      latest.current.onLessonHostRequest?.({type: 'close-glossary'});
      audio.current?.reset(); apply({kind: 'replay'});
      if (state.current.frame === 119) audio.current?.seekFrame(119);
      return true;
    },
    narration(action) {if (action === 'play') play(); else pause();},
    stop() {pause(); pendingGlossary.current = null; latest.current.onLessonHostRequest?.({type: 'close-glossary'});},
  }), [connectRuntimeControls, apply, pause, play]);

  const interact = (action: P012Action) => {
    const old = state.current.interaction;
    apply({kind: 'interaction', action});
    const next = state.current.interaction;
    if (action.kind === 'close-popup') {command.current++; coachStarted.current = false; audio.current?.stopCoach();}
    if (next.popup.visible && !old.popup.visible && next.coach.label) {
      coachStarted.current = false;
      const token = ++command.current, owned = audio.current;
      void owned?.playCoach(next.coach.label).then(ok => {
        if (mounted.current && token === command.current && !ok) {setAudioError(true); pause();}
      }).catch(() => {if (mounted.current && token === command.current) {setAudioError(true); pause();}});
    }
  };
  const openCoordinate = (trigger: HTMLButtonElement) => {
    if (!readyRef.current || state.current.frame < 32 || pendingGlossary.current) return;
    pause(); apply({kind: 'open-coordinate'});
    const result = latest.current.onLessonHostRequest?.({type: 'open-glossary', entryId: props.coordinateEntryId}, {trigger});
    if (result?.status !== 'allowed') {apply({kind: 'close-coordinate'}); setError(true); return;}
    pendingGlossary.current = {trigger, seen: false};
  };
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const pending = pendingGlossary.current; if (!pending) return;
      const dialog = document.querySelector(`[role="dialog"][data-glossary-entry-id="${props.coordinateEntryId}"]`);
      if (dialog) pending.seen = true;
      else if (pending.seen) {
        pendingGlossary.current = null; apply({kind: 'close-coordinate'}); pause();
        if (pending.trigger.isConnected) pending.trigger.focus();
      }
    });
    observer.observe(document.body, {childList: true, subtree: true}); return () => observer.disconnect();
  }, [props.coordinateEntryId, apply, pause]);
  useEffect(() => {
    onPlaybackStateChange?.({audioAvailable: ready, frame: view.frame, frameCount: 119,
      frameDomain: 'sprite-86', fps: 12, narration: audioError ? 'unavailable' : view.paused ? 'waiting' : 'playing',
      playbackProgress: ready ? (view.frame - 1) / 118 : null,
      seekAvailable: false, stepFrames: 1, transportMode: 'none'});
  }, [onPlaybackStateChange, ready, view.frame, view.paused, audioError]);

  return <div ref={root} className="runtime-shell" data-p012-host="source-bound-local"
    data-lesson-presentation="modern-text-v1" data-lesson-text-binding="p012-source-native-text-v1"
    style={{'--flash-stage-width': '800px', '--flash-stage-height': '600px', '--flash-stage-aspect': '800 / 600'} as CSSProperties}
    data-p012-ready={ready} data-p012-frame={view.frame} data-p012-phase={view.phase}
    data-runtime-paused={view.paused} data-p012-coordinate={view.interaction.coordinateText}>
    {asset && <P012TypographyRenderer asset={asset} state={view} onCoordinate={openCoordinate} uiLanguage={props.uiLanguage}/>}
    {view.phase === 'interaction' && <P012Controls state={view.interaction} dispatch={interact} disabled={!ready}/>}
    {error && <p role="alert">{props.labels.unavailable}</p>}
    {audioError && <p role="alert">{props.uiLanguage === 'es' ? 'El audio no está disponible. Vuelve a pulsar Reproducir.' : 'Source audio is unavailable. Press Play to retry.'}</p>}
  </div>;
}

export function G678AlgL12P012HostLesson(props: Omit<ComponentProps<typeof G678AlgL12P006HostLesson>, 'privateRuntimeAdapters' | 'descriptor'> & {
  descriptor: PageOnlyLessonPlayerDescriptor; assets: Assets;
}) {
  const entry = props.descriptor.glossary.find(item => item.sourceKeyAttribute === 'Coordinate');
  if (!entry) throw Error('P012 Coordinate dictionary entry unavailable');
  const adapter = useMemo(() => ({animationId: ID, audioEnabled: true, glossaryClosePolicy: 'stay-paused' as const,
    Component: (runtimeProps: LessonRuntimeAdapterProps) => <P012Runtime {...runtimeProps} assets={props.assets} coordinateEntryId={entry.id}/>}), [props.assets, entry.id]);
  const adapters = useMemo(() => [adapter], [adapter]);
  return <G678AlgL12P006HostLesson {...props} privateRuntimeAdapters={adapters}/>;
}
