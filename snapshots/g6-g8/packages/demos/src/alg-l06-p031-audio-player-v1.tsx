import React, {useEffect, useRef, useState} from 'react';
import {P031AudioRuntimeV1} from './alg-l06-p031-audio-runtime-v1';
import {P031NativeV1} from './alg-l06-p031-native-v1';
import {P031_SOURCE_SHA256, type P031AnswerRequest} from './alg-l06-p031-source-v1';

export interface P031CanvasAsset {
  ready: () => Promise<unknown>;
  render: (canvas: HTMLCanvasElement, request: {frame: number; seed: 0; lang: 'en'}) => {
    frameDomain: string; localFrame: number; rootFrame: number; audioRendered: boolean;
  };
}
export interface P031PlayerProps {
  asset: P031CanvasAsset;
  load: (id: 'main' | 'sa', signal: AbortSignal) => Promise<ArrayBuffer>;
  language?: 'en' | 'es';
  volume?: number;
  onGlossary?: (key: string, trigger: HTMLButtonElement) => void;
  onUnresolvedAnswer?: (request: P031AnswerRequest) => void;
  onSnapshot?: (snapshot: ReturnType<P031AudioRuntimeV1['snapshot']>) => void;
  connectRuntime?: (runtime: P031AudioRuntimeV1 | null) => void;
  onCleanup?: () => void;
}

export function P031AudioPlayerV1(props: P031PlayerProps) {
  const canvas = useRef<HTMLCanvasElement>(null), runtime = useRef<P031AudioRuntimeV1 | null>(null);
  const callbacks = useRef(props); callbacks.current = props;
  const [frame, setFrame] = useState(1), [ready, setReady] = useState(false), [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<'main' | 'sa'>('main'), [loading, setLoading] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReducedMotion(media.matches); change(); media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    let live = true, animation = 0, committed = -1;
    setReady(false); setError(null);
    const commit = (sourceFrame: number) => {
      if (!live || !canvas.current) return false;
      try {
        const state = props.asset.render(canvas.current, {frame: sourceFrame, lang: 'en', seed: 0});
        if (state.frameDomain !== 'sprite-363' || state.localFrame !== sourceFrame || state.rootFrame !== 6 || state.audioRendered !== false ||
            canvas.current.getAttribute('data-flash-frame') !== String(sourceFrame)) throw Error('P031_CANVAS_READBACK');
        committed = sourceFrame; setFrame(sourceFrame); return true;
      } catch (cause) {setError(String(cause)); return false;}
    };
    const page = new P031AudioRuntimeV1({load: props.load, commitFrame: commit});
    runtime.current = page; callbacks.current.connectRuntime?.(page);
    const tick = () => {
      if (!live) return;
      const snapshot = page.snapshot();
      if (committed !== snapshot.frame && !commit(snapshot.frame)) page.pause();
      if (snapshot.failure) setError(snapshot.failure);
      setSelected(snapshot.selected); setLoading(snapshot.spanishLoading);
      callbacks.current.onSnapshot?.(snapshot);
      animation = requestAnimationFrame(tick);
    };
    void props.asset.ready().then(async () => {
      if (!live) return;
      page.setVolume(callbacks.current.volume ?? 1);
      const prepared = await page.prepare();
      if (!live) return;
      setReady(prepared); if (!prepared) setError(page.snapshot().failure ?? 'P031_AUDIO_PREPARE');
      tick();
    }, cause => {if (live) setError(String(cause));});
    return () => {
      live = false; cancelAnimationFrame(animation); callbacks.current.connectRuntime?.(null);
      if (runtime.current === page) runtime.current = null;
      void page.close().then(() => callbacks.current.onCleanup?.());
    };
  }, [props.asset, props.load]);
  useEffect(() => {runtime.current?.setVolume(props.volume ?? 1);}, [props.volume]);
  const en = props.language !== 'es';
  const control: React.CSSProperties = {font: 'inherit', minHeight: 44, padding: '.45em .65em'};
  const action = (fn: (page: P031AudioRuntimeV1) => unknown) => {if (runtime.current) {setError(null); return fn(runtime.current);}};
  return <div data-p031-player data-p031-ready={String(ready)} data-p031-frame={frame}
    data-p031-selected={selected} data-p031-source-sha256={P031_SOURCE_SHA256}
    style={{width: '100%', maxWidth: 800, minWidth: 0, fontSize: '1rem', lineHeight: 1.5, color: '#203a60'}}>
    {error && <p role="alert">{error}</p>}
    <canvas ref={canvas} width={800} height={600} aria-label={en ? 'Source lesson animation' : 'Animación de la lección'}
      style={{display: 'block', width: '100%', height: 'auto', aspectRatio: '4 / 3'}} />
    <div style={{display: 'flex', flexWrap: 'wrap', gap: '.5em', padding: '.75em'}}>
      <button type="button" style={control} data-p031-play disabled={!ready || loading} onClick={() => action(page => page.play())}>{en ? 'Play' : 'Reproducir'}</button>
      <button type="button" style={control} data-p031-pause disabled={!ready} onClick={() => action(page => page.pause())}>{en ? 'Pause' : 'Pausar'}</button>
      <button type="button" style={control} data-p031-replay disabled={!ready} onClick={() => action(page => page.replay())}>{en ? 'Replay' : 'Repetir'}</button>
      <button type="button" style={control} data-p031-spanish disabled={!ready || loading} onClick={() => action(page => page.startSpanish())}>{en ? 'Spanish Audio' : 'Audio en español'}</button>
      {selected === 'sa' && <button type="button" style={control} data-p031-return disabled={!ready} onClick={() => action(page => page.returnMain())}>{en ? 'Return to lesson' : 'Volver a la lección'}</button>}
    </div>
    <P031NativeV1 frame={frame} language={props.language} reducedMotion={reducedMotion}
      onGlossary={props.onGlossary ? (key, trigger) => {runtime.current?.pause(); props.onGlossary?.(key, trigger);} : undefined}
      onAnswerRequest={props.onUnresolvedAnswer ? choice => {
        if (!runtime.current) return;
        try {props.onUnresolvedAnswer?.(runtime.current.answer(choice));} catch (cause) {setError(String(cause));}
      } : undefined} />
  </div>;
}
