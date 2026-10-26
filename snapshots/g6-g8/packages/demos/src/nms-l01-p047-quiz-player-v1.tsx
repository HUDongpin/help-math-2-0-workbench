'use client';
import React, {useEffect, useRef, useState} from 'react';
import {P047QuizPresentation} from './nms-l01-p047-quiz-presentation-v1';
import {P047SessionV1, type P047SessionSnapshot} from './nms-l01-p047-session-v1';
import {p047AudioAsset, p047InputIdentity} from './nms-l01-p047-quiz-v1';
import type {P047AudioDependencies} from './nms-l01-p047-audio-v1';

export interface P047PlayerControls {
  setPaused(value: boolean): void;
  replay(): boolean;
  narration(action: 'play' | 'stop'): void;
  stop(): void;
}
export interface P047QuizPlayerProps {
  readonly seed: number;
  readonly uiLanguage: 'en' | 'es';
  readonly paused?: boolean;
  readonly volume?: number;
  readonly audioEnabled: boolean;
  readonly readAudio: P047AudioDependencies['read'];
  readonly connectControls?: (controls: P047PlayerControls) => () => void;
  readonly onState?: (snapshot: P047SessionSnapshot) => void;
  readonly onPaused?: (paused: boolean) => void;
  readonly onReplay?: () => void;
  readonly onComplete?: () => void;
}

/** Mounted quiz session shared by the product adapter and browser tests. The
 * parent host owns navigation/progress. Audio and assessment data stay local. */
export function P047QuizPlayer(props: P047QuizPlayerProps) {
  const latest = useRef(props); latest.current = props;
  const sessionRef = useRef<P047SessionV1 | null>(null);
  const [snapshot, setSnapshot] = useState<P047SessionSnapshot | null>(null);
  useEffect(() => {
    let active = true;
    const session = new P047SessionV1(props.seed, latest.current.uiLanguage, {
      readAudio: (asset, signal) => {
        if (!latest.current.audioEnabled) return Promise.reject(new Error('P047_AUDIO_DISABLED'));
        return latest.current.readAudio(asset, signal);
      },
      changed: value => { if (active) { setSnapshot(value); latest.current.onState?.(value); } },
    });
    sessionRef.current = session;
    session.setVolume(latest.current.volume ?? 1); session.setPaused(latest.current.paused ?? false);
    setSnapshot(session.snapshot()); latest.current.onState?.(session.snapshot());
    const controls: P047PlayerControls = {
      setPaused(value) { if (!active) return; session.setPaused(value); latest.current.onPaused?.(value); },
      replay() {
        if (!active || !session.replay()) return false;
        latest.current.onPaused?.(false); latest.current.onReplay?.(); return true;
      },
      narration(action) {
        if (!active) return;
        if (action === 'stop') { session.stopAudio(); return; }
        if (!latest.current.audioEnabled) return;
        const snapshot = session.snapshot(), identity = p047InputIdentity(snapshot.quiz);
        if (identity.questionId === null) return;
        session.setPaused(false); latest.current.onPaused?.(false);
        void session.playAudio(p047AudioAsset(identity.questionId, snapshot.audioLanguage, null).id, identity);
      },
      stop() { if (!active) return; active = false; void session.close(); },
    };
    const disconnect = latest.current.connectControls?.(controls);
    return () => { active = false; disconnect?.(); if (sessionRef.current === session) sessionRef.current = null; void session.close(); };
  }, [props.seed]);
  useEffect(() => { sessionRef.current?.setPaused(props.paused ?? false); }, [props.paused]);
  useEffect(() => { sessionRef.current?.setVolume(props.volume ?? 1); }, [props.volume]);
  useEffect(() => { sessionRef.current?.setAudioLanguage(props.uiLanguage); }, [props.uiLanguage]);
  useEffect(() => { if (!props.audioEnabled) sessionRef.current?.stopAudio(); }, [props.audioEnabled]);
  if (!snapshot) return <p role="status">{props.uiLanguage === 'es' ? 'Cargando cuestionario…' : 'Loading quiz…'}</p>;
  return <P047QuizPresentation state={snapshot.quiz} uiLanguage={props.uiLanguage} paused={snapshot.paused}
    elapsedMs={() => sessionRef.current?.elapsedMs() ?? 0} audioEnabled={props.audioEnabled}
    audioLanguage={snapshot.audioLanguage} activeAudioId={snapshot.audio.assetId} audioError={snapshot.audio.failure} audioPhase={snapshot.audio.phase}
    onAudioLanguage={language => sessionRef.current?.setAudioLanguage(language)}
    onAudio={(asset, identity) => { if (latest.current.audioEnabled) void sessionRef.current?.playAudio(asset, identity); }}
    onAction={action => {
      const session = sessionRef.current;
      if (!session?.dispatch(action)) return;
      if (action.type === 'replay') latest.current.onReplay?.();
      if (action.type === 'close') latest.current.onComplete?.();
    }}/>
}
