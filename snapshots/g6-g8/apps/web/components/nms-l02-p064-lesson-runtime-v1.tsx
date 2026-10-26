'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {P064QuizCandidate} from '@helpmath/demos/nms-l02-p064-local-candidate';
import type {P064QuizState} from '../../../packages/demos/src/nms-l02-p064-quiz-state-candidate';
import type {P064HostRequest} from '../../../packages/demos/src/nms-l02-p064-host-score-candidate';
import type {LessonRuntimeAdapterControls, LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';

const ID = 'shared-nms002-l02-p064';

/** The quiz advances on answers, not elapsed Flash frames. These values tell
 * the lesson toolbar there is no seekable or auto-playing transport. */
export const P064_QUIZ_TOOLBAR_STATE: AnimationRuntimePlaybackState = Object.freeze({
  audioAvailable: false,
  frame: 1,
  frameCount: 1,
  frameDomain: 'interaction-state',
  fps: 0,
  narration: 'unavailable',
  playbackProgress: null,
  seekAvailable: false,
  stepFrames: 0,
  transportMode: 'none',
});

/** Removing the URL before load() aborts an in-flight native media fetch.
 * Restoring it with preload=none preserves a later explicit learner click. */
export function cancelP064NativeAudio(root: ParentNode | null,
  retained: Iterable<HTMLAudioElement> = []): void {
  const all = new Set<HTMLAudioElement>(retained);
  root?.querySelectorAll<HTMLAudioElement>('audio').forEach(audio => all.add(audio));
  all.forEach(audio => {
    audio.pause();
    const source = audio.getAttribute('src');
    if (source === null) return;
    audio.preload = 'none';
    audio.removeAttribute('src');
    audio.load();
    audio.setAttribute('src', source);
  });
}

/** A question replacement detaches its previous native players. Abort their
 * pending loads immediately while keeping current controls and URLs intact. */
export function reconcileP064NativeAudioNodes(root: ParentNode | null,
  retained: Set<HTMLAudioElement>): void {
  if (!root) return;
  const current = new Set(root.querySelectorAll<HTMLAudioElement>('audio'));
  retained.forEach(audio => {
    if (current.has(audio)) return;
    cancelP064NativeAudio(null, [audio]);
    retained.delete(audio);
  });
  current.forEach(audio => retained.add(audio));
}

export function createP064LessonControls(cancelMedia: () => void,
  reportPaused: () => void): LessonRuntimeAdapterControls {
  return {
    setPaused(paused) {
      if (paused) cancelMedia();
      // A quiz has no timeline to start. Host Play does not start EA/SA audio.
      reportPaused();
    },
    replay() {
      cancelMedia();
      return false; // The host increments runtimeEpoch and resets its fq-score state.
    },
    narration(action) {
      if (action === 'stop') cancelMedia();
      reportPaused();
    },
    stop() {
      cancelMedia();
      reportPaused();
    },
  };
}

export function setP064NativeAudioVolume(root: ParentNode | null, volume: number): void {
  const safeVolume = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 1;
  root?.querySelectorAll<HTMLAudioElement>('audio').forEach(audio => {audio.volume = safeVolume;});
}

/** The real My Lesson host supplies fq-scoring and owns Replay epochs. No
 * isolated scoring host is created and no quiz phase marks the page reviewed. */
export function NmsL02P064LessonRuntimeV1(props: LessonRuntimeAdapterProps) {
  const root = useRef<HTMLDivElement>(null);
  const audioNodes = useRef(new Set<HTMLAudioElement>());
  const latest = useRef(props);
  latest.current = props;
  const [quiz, setQuiz] = useState<P064QuizState | null>(null);
  const seedText = props.query.seed ?? '0';
  const seed = /^(?:0|[1-9]\d*)$/u.test(seedText) ? Number(seedText) : NaN;
  const validSeed = Number.isSafeInteger(seed) && seed >= 0 && seed <= 0xffffffff;
  const validContext = props.animationId === ID && props.moduleKey === ID &&
    props.query.frameDomain === 'sprite-1258' &&
    props.query.scenario === 'source-quiz-seeded' && props.query.lang === 'en' && validSeed;

  const hostRequest = useCallback<P064HostRequest>(request => {
    return latest.current.onLessonHostRequest?.(request);
  }, []);
  const onState = useCallback((state: P064QuizState) => {
    setQuiz(state);
    reconcileP064NativeAudioNodes(root.current, audioNodes.current);
    setP064NativeAudioVolume(root.current, latest.current.volume ?? 1);
    latest.current.onPlaybackStateChange?.(P064_QUIZ_TOOLBAR_STATE);
  }, []);

  useEffect(() => {
    if (!validContext) return;
    const cancelMedia = () => cancelP064NativeAudio(root.current, audioNodes.current);
    const disconnect = props.connectRuntimeControls(createP064LessonControls(cancelMedia,
      () => latest.current.onRuntimePausedChange(true)));
    return () => {
      cancelMedia();
      disconnect();
    };
  }, [props.connectRuntimeControls, validContext]);

  useEffect(() => {
    if (!validContext) return;
    props.onPlaybackStateChange?.(P064_QUIZ_TOOLBAR_STATE);
    props.onRuntimePausedChange(true);
  }, [props.onPlaybackStateChange, props.onRuntimePausedChange, props.paused, validContext]);

  useEffect(() => {
    if (props.paused || props.seekRequest || props.narrationRequest?.action === 'stop') {
      cancelP064NativeAudio(root.current, audioNodes.current);
    }
  }, [props.paused, props.seekRequest, props.narrationRequest]);

  useEffect(() => {
    setP064NativeAudioVolume(root.current, props.volume ?? 1);
  }, [props.volume, quiz]);

  if (!validContext) {
    return <section data-animation-id={ID} data-p064-runtime-status="blocked" role="alert">
      {props.uiLanguage === 'es'
        ? 'El contexto del cuestionario de origen no está disponible.'
        : 'The source quiz context is unavailable.'}
    </section>;
  }
  return <div ref={root} data-animation-id={ID} data-p064-runtime-status="contextual-candidate"
    data-p064-toolbar-domain="interaction-state" data-p064-host-phase={quiz?.phase ?? 'initializing'}
    data-p064-answer-count={quiz?.responses.length ?? 0}>
    <P064QuizCandidate seed={seed} uiLanguage={props.uiLanguage ?? 'en'}
      onState={onState} onLessonHostRequest={hostRequest}/>
  </div>;
}
