'use client';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {P050PageRuntimeV1, type P050RuntimeOptions, type P050RuntimeSnapshot} from './alg-l06-p050-audio-runtime-v1';
import {P050NativeV1} from './alg-l06-p050-native-v1';
import {p050CommitCanvas, type P050CanvasAssetV1} from './alg-l06-p050-canvas-commit-v1';
import type {P050Event} from './alg-l06-p050-state-v1';

export interface P050PlayerControls {
  setPaused(paused: boolean): void; replay(): boolean; narration(action: 'play' | 'stop'): void; stop(): void;
}
export interface P050PlayerProps {
  asset: P050CanvasAssetV1; load: P050RuntimeOptions['load']; language?: 'en' | 'es'; volume?: number;
  hidePlaybackControls?: boolean; nativeTextTarget?: HTMLElement | null;
  onSnapshot?: (snapshot: P050RuntimeSnapshot) => void; onCleanup?: () => void;
  connectControls?: (controls: P050PlayerControls) => void | (() => void);
}
export function P050AudioPlayerV1({asset, load, language = 'en', volume = 1, hidePlaybackControls = false,
  nativeTextTarget, onSnapshot, onCleanup, connectControls}: P050PlayerProps) {
  const canvas = useRef<HTMLCanvasElement>(null), runtime = useRef<P050PageRuntimeV1 | null>(null);
  const latest = useRef({onSnapshot, onCleanup}); latest.current = {onSnapshot, onCleanup};
  const [view, setView] = useState<P050RuntimeSnapshot | null>(null), [error, setError] = useState<string | null>(null);
  const publish = useCallback((snapshot: P050RuntimeSnapshot) => {
    setView(snapshot); latest.current.onSnapshot?.(snapshot);
  }, []);
  useEffect(() => {
    let live = true;
    const page = new P050PageRuntimeV1({load, onSnapshot: s => {if (live) publish(s);},
      onCleanup: () => latest.current.onCleanup?.()});
    runtime.current = page; setView(null); setError(null);
    void asset.ready().then(() => {if (live) void page.start();}, e => {if (live) setError(String(e));});
    const hidden = () => {if (document.visibilityState === 'hidden') page.pause();};
    document.addEventListener('visibilitychange', hidden);
    return () => {live = false; document.removeEventListener('visibilitychange', hidden);
      if (runtime.current === page) runtime.current = null; void page.close();};
  }, [asset, load, publish]);
  useEffect(() => {runtime.current?.setVolume(volume);}, [volume, view?.ready]);
  useEffect(() => {
    if (!view || !canvas.current || view.state.phase === 'left') return;
    try {p050CommitCanvas(asset, canvas.current, view.state);}
    catch (e) {setError(String(e)); runtime.current?.pause();}
  }, [asset, view?.state]);
  useEffect(() => {
    if (!view?.visualClockRunning) return;
    let live = true, handle = 0;
    const tick = () => {if (live) {runtime.current?.tick(); handle = requestAnimationFrame(tick);}};
    handle = requestAnimationFrame(tick);
    return () => {live = false; cancelAnimationFrame(handle);};
  }, [view?.visualClockRunning]);
  const send = useCallback((event: P050Event) => {runtime.current?.send(event);}, []);
  useEffect(() => connectControls?.({setPaused: p => {if (p) runtime.current?.pause(); else runtime.current?.play();},
    replay: () => runtime.current?.replay() ?? false,
    narration: a => {if (a === 'play') runtime.current?.play(); else runtime.current?.pause();},
    stop: () => {runtime.current?.pause();}}), [connectControls]);
  const en = language === 'en', ready = !!view?.ready && !error, state = view?.state;
  const controls = <div data-p050-controls>
      {!hidePlaybackControls && <>
        <button type="button" disabled={!ready} onClick={() => runtime.current?.play()}>{en ? 'Play' : 'Reproducir'}</button>
        <button type="button" disabled={!ready} onClick={() => runtime.current?.pause()}>{en ? 'Pause' : 'Pausar'}</button>
        <button type="button" disabled={!ready} onClick={() => runtime.current?.replay()}>{en ? 'Replay' : 'Repetir'}</button>
      </>}
      {view?.spanishSelected ? <button type="button" onClick={() => runtime.current?.returnMain()}>
        {en ? 'Return to animation' : 'Volver a la animación'}</button> :
        <button type="button" disabled={!ready || state?.startRequested} onClick={() => void runtime.current?.startSpanish()}>
          {en ? 'Spanish Audio' : 'Audio en español'}</button>}
    {(!ready || view?.spanishLoading) && !error && !view?.failure &&
      <p role="status">{en ? 'Loading audio…' : 'Cargando audio…'}</p>}
    {(error || view?.failure) && <p role="alert">{error || view?.failure}</p>}
    </div>;
  const companion = state && <div data-p050-companion>
    {nativeTextTarget && hidePlaybackControls ? controls : null}
    <P050NativeV1 state={state} language={language} onEvent={ready && !view.spanishSelected ? send : undefined} />
  </div>;
  return <div data-p050-player data-p050-ready={String(ready)} data-p050-frame={state?.mainFrame ?? 1}
    data-p050-phase={state?.phase ?? 'loading'} data-p050-running={String(view?.visualClockRunning ?? false)}
    data-p050-audio-owner={view?.audio.owner ?? 'none'} data-p050-spanish={String(view?.spanishSelected ?? false)}
    data-p050-spanish-phase={view?.audio.streams.sa?.phase ?? 'idle'} data-p050-spanish-loading={String(view?.spanishLoading ?? false)}
    data-p050-feedback-frame={state?.feedback?.frame ?? 'none'} data-p050-feedback-sprite={state?.feedback?.spriteId ?? 'none'}
    data-p050-score={state?.score ?? 0} style={{minWidth: 0, maxWidth: '100%', color: '#203a60', lineHeight: 1.5}}>
    <style>{`[data-p050-player] button,[data-p050-companion] button{font:inherit;min-height:2.75rem;line-height:1.5;padding:.5em .75em;border:1px solid #8298b8;border-radius:.3em;background:#f3f7fc;color:#203a60;max-width:100%;overflow-wrap:anywhere}
[data-p050-player] button:focus-visible,[data-p050-companion] button:focus-visible{outline:3px solid #164faf;outline-offset:3px}
[data-p050-player] button:disabled,[data-p050-companion] button:disabled{color:#526075;background:#eff2f6}
[data-p050-controls]{display:flex;flex-wrap:wrap;gap:.5em;padding:.5em}`}</style>
    {!nativeTextTarget || !hidePlaybackControls ? controls : null}

    <canvas ref={canvas} width={800} height={600} aria-hidden="true"
      style={{display: 'block', width: '100%', height: 'auto', maxWidth: 800}} />
    {nativeTextTarget ? createPortal(companion, nativeTextTarget) : companion}
  </div>;
}
