'use client';

import {useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type CSSProperties} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {G678MultiPageLessonPlayer} from './g678-multi-page-lesson-player-v3.generated';
import {advanceP005Clock, initialP005Clock, pauseP005Clock, seekP005Clock} from '../../../packages/demos/src/alg-l12-p005-visual-clock';

import '../../../packages/demos/src/alg-l12-p005-typography.css';

const ID = 'shared-alg001-l12-p005';
type Drawing = typeof import('../../../packages/demos/src/modules/shared-alg001-l12-p005').default;

function P005Runtime(props: LessonRuntimeAdapterProps) {
  const latest = useRef(props);
  useLayoutEffect(() => {latest.current = props;}, [props]);
  const {connectRuntimeControls, onPlaybackStateChange} = props;
  const root = useRef<HTMLDivElement>(null);
  const clock = useRef(initialP005Clock());
  const [frame, setFrame] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [replay, setReplay] = useState(0);
  const [drawing, setDrawing] = useState<Drawing | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const readyRef = useRef(false), lastSeek = useRef<number | null>(null);
  const reduced = useRef(false);
  const previousTick = useRef<number | undefined>(undefined);
  const publish = () => {setFrame(clock.current.frame); setPlaying(clock.current.playing);};

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    let active = true;
    void import('../../../packages/demos/src/modules/shared-alg001-l12-p005')
      .then(module => {if (active) setDrawing(module.default);})
      .catch(() => {if (active) setError(true);});
    return () => {active = false;};
  }, []);

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    reduced.current = media.matches;
    const changed = () => {
      reduced.current = media.matches;
      if (media.matches) {
        previousTick.current = undefined;
        clock.current = pauseP005Clock(clock.current, true); publish();
        latest.current.onRuntimePausedChange(true);
      }
    };
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, []);

  useEffect(() => {
    const element = root.current;
    if (!element || !drawing) return;
    const check = () => {
      const status = element.querySelector('[data-canvas-status]')?.getAttribute('data-canvas-status');
      const next = status === 'ready';
      if (next && !readyRef.current) {
        previousTick.current = undefined;
        clock.current = pauseP005Clock(clock.current, reduced.current || latest.current.paused === true);
        publish();
        if (reduced.current) latest.current.onRuntimePausedChange(true);
      }
      readyRef.current = next; setReady(next);
      if (status === 'error') {
        previousTick.current = undefined;
        setError(true); clock.current = pauseP005Clock(clock.current, true); publish();
        latest.current.onRuntimePausedChange(true);
      }
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(element, {subtree: true, childList: true, attributes: true, attributeFilter: ['data-canvas-status']});
    return () => observer.disconnect();
  }, [drawing]);

  useEffect(() => connectRuntimeControls({
    setPaused(paused) {
      previousTick.current = undefined;
      clock.current = pauseP005Clock(clock.current, paused || !readyRef.current || reduced.current); publish();
    },
    replay() {
      previousTick.current = undefined;
      clock.current = pauseP005Clock(initialP005Clock(), !readyRef.current || reduced.current);
      setReplay(value => value + 1); publish();
      latest.current.onRuntimePausedChange(!readyRef.current || reduced.current);
      return true;
    },
    narration() {},
    stop() {previousTick.current = undefined; clock.current = pauseP005Clock(clock.current, true); publish();},
  }), [connectRuntimeControls]);

  useEffect(() => {
    previousTick.current = undefined;
    clock.current = pauseP005Clock(clock.current, props.paused === true || !readyRef.current || reduced.current);
    publish();
    // The parent transport can request Play/Continue or reset pause after Replay.
    // Reflect a terminal/reduced-motion refusal after that request is committed.
    if (readyRef.current && !clock.current.playing && props.paused !== true)
      latest.current.onRuntimePausedChange(true);
  }, [props.paused, replay]);

  useEffect(() => {
    const request = props.seekRequest;
    if (!ready || !request || request.requestId === lastSeek.current) return;
    lastSeek.current = request.requestId;
    if (!Number.isInteger(request.frame) || request.frame < 1 || request.frame > 968) return;
    previousTick.current = undefined;
    clock.current = seekP005Clock(request.frame); publish();
    latest.current.onRuntimePausedChange(true);
  }, [props.seekRequest, ready]);

  useEffect(() => {
    let handle = 0;
    const tick = (now: number) => {
      const old = clock.current;
      if (readyRef.current && old.playing && previousTick.current !== undefined)
        clock.current = advanceP005Clock(old, now - previousTick.current);
      previousTick.current = readyRef.current && old.playing ? now : undefined;
      if (old.frame !== clock.current.frame || old.playing !== clock.current.playing) publish();
      if (old.playing && clock.current.frame === 968) {
        latest.current.onRuntimePausedChange(true);
        latest.current.onPlaybackComplete?.();
      }
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => {cancelAnimationFrame(handle); clock.current = pauseP005Clock(clock.current, true);};
  }, []);

  useEffect(() => {
    onPlaybackStateChange?.({audioAvailable: false, frame, frameCount: 968,
      frameDomain: 'sprite-391', fps: 12, narration: 'unavailable',
      playbackProgress: ready ? (frame - 1) / 967 : null,
      seekAvailable: ready, stepFrames: 12, transportMode: ready ? 'visual-frame-inspector' : 'none'});
  }, [frame, ready, onPlaybackStateChange]);

  const Renderer = drawing?.textPresentation.Renderer;
  return <div ref={root} className="runtime-shell"
    data-lesson-presentation="modern-text-v1" data-lesson-text-binding={drawing?.textPresentation.binding.version}
    style={{'--flash-stage-width': '800px', '--flash-stage-height': '600px', '--flash-stage-aspect': '800 / 600'} as CSSProperties}
    data-p005-host-probe="unregistered" data-runtime-paused={!playing}
    data-p005-frame={frame} data-p005-ready={ready} data-audio-rendered="false">
    {Renderer ? <Renderer frame={frame} frameDomain="sprite-391" scenario="source-static-frame"
      lang="en" uiLanguage={props.uiLanguage} seed={0} replay={replay} paused={!playing}/> : null}
    {error ? <p role="alert">{props.labels.unavailable}</p> : null}
    <p lang={props.uiLanguage}>{props.uiLanguage === 'es'
      ? 'Dibujo original en inglés. Audio y traducción pendientes; prueba local sin registrar.'
      : 'English source drawing. Audio and translation pending; unregistered local host probe.'}</p>
  </div>;
}

export function G678AlgL12P005HostLesson(props: Omit<ComponentProps<typeof G678MultiPageLessonPlayer>, 'privateRuntimeAdapter'>) {
  const adapter = useMemo(() => ({animationId: ID, audioEnabled: false, Component: P005Runtime}), []);
  return <G678MultiPageLessonPlayer {...props} privateRuntimeAdapter={adapter}/>;
}
