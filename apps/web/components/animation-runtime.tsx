'use client';
import {loadAnimationModule, type AnimationModule} from '@helpmath/demos/animation-registry';
import {createRuntimeContext} from '@helpmath/demos/runtime';
import {useEffect, useRef, useState, type CSSProperties} from 'react';
type Query = {frame?: string; scenario?: string; lang?: string; seed?: string; capture?: string};

function useFrame(movie: AnimationModule['movie'] | undefined, running: boolean, replay: number) {
  const signature = `${movie?.fps ?? 0}:${movie?.frameCount ?? 0}:${running}:${replay}`;
  const [clock, setClock] = useState({signature, frame: 1});
  useEffect(() => {if (!movie || !running) return; const start = performance.now(); let request = 0; const tick = (now: number) => {const next = Math.min(movie.frameCount, Math.floor((now - start) / (1000 / movie.fps)) + 1); setClock((value) => value.signature === signature && value.frame === next ? value : {signature, frame: next}); if (next < movie.frameCount) request = requestAnimationFrame(tick);}; request = requestAnimationFrame(tick); return () => cancelAnimationFrame(request);}, [movie, running, signature]);
  return clock.signature === signature ? clock.frame : 1;
}

function useAudio(module: AnimationModule | undefined, frame: number, lang: 'en' | 'es', enabled: boolean, replay: number, scenario: string) {
  const active = useRef<Set<HTMLAudioElement>>(new Set()), previous = useRef(0);
  useEffect(() => {const playing = active.current; for (const audio of playing) {audio.pause(); audio.currentTime = 0;} playing.clear(); previous.current = 0; return () => {for (const audio of playing) audio.pause(); playing.clear();};}, [module, enabled, lang, replay, scenario]);
  useEffect(() => {if (!module || !enabled) return; const start = previous.current; previous.current = frame; for (const cue of module.audioCues) {if (cue.frame <= start || cue.frame > frame || (cue.language !== 'shared' && cue.language !== lang) || !cue.source.startsWith('/')) continue; const audio = new Audio(cue.source); active.current.add(audio); const done = () => active.current.delete(audio); audio.addEventListener('ended', done, {once: true}); audio.addEventListener('error', done, {once: true}); void audio.play().catch(done);}}, [module, enabled, frame, lang]);
}

export function AnimationRuntime({moduleKey, query, labels}: {moduleKey: string; query: Query; labels: {replay: string; reduced: string; prototype: string; unavailable: string; loading: string}}) {
  const [loaded, setLoaded] = useState<{key: string; module?: AnimationModule; failed?: boolean}>({key: moduleKey});
  const [replay, setReplay] = useState(0), [reduced, setReduced] = useState<boolean | undefined>();
  const animationModule = loaded.key === moduleKey ? loaded.module : undefined;
  useEffect(() => {let cancelled = false; loadAnimationModule(moduleKey).then((value) => {if (!cancelled) setLoaded({key: moduleKey, module: value, failed: !value});}).catch(() => {if (!cancelled) setLoaded({key: moduleKey, failed: true});}); return () => {cancelled = true;};}, [moduleKey]);
  useEffect(() => {const media = matchMedia('(prefers-reduced-motion: reduce)'), update = () => setReduced(media.matches); update(); media.addEventListener('change', update); return () => media.removeEventListener('change', update);}, []);
  const context = animationModule ? createRuntimeContext(query, animationModule.movie, animationModule.scenarios) : undefined;
  const capture = query.capture === '1', running = Boolean(animationModule && context?.captureFrame === undefined && reduced === false);
  const liveFrame = useFrame(animationModule?.movie, running, replay), frame = context?.captureFrame ?? (running ? liveFrame : 1);
  useAudio(animationModule, frame, context?.lang ?? 'en', running && !capture, replay, context?.scenario ?? 'default');
  if (loaded.failed) return <p className="runtime-unavailable">{labels.unavailable}</p>;
  if (!animationModule || !context) return <p aria-live="polite" className="runtime-unavailable">{labels.loading}</p>;
  const Renderer = animationModule.Renderer, onReplay = () => setReplay((value) => value + 1);
  const state = animationModule.getFrameState(frame, {frame, lang: context.lang, scenario: context.scenario, seed: context.seed});
  return <div className={`runtime-shell${capture ? ' runtime-shell--capture' : ''}`} style={capture ? {'--flash-stage-width': `${animationModule.movie.stage.width}px`, '--flash-stage-height': `${animationModule.movie.stage.height}px`, '--flash-stage-aspect': `${animationModule.movie.stage.width} / ${animationModule.movie.stage.height}`} as CSSProperties : undefined}>
    <div className="runtime-toolbar"><div><span className="prototype-badge">{labels.prototype}</span><span>{animationModule.movie.stage.width} × {animationModule.movie.stage.height}</span><span>{animationModule.movie.fps} FPS</span><span>{animationModule.movie.frameCount} frames</span></div><button disabled={context.captureFrame !== undefined} onClick={onReplay} type="button">{labels.replay}</button></div>
    {reduced === true && context.captureFrame === undefined ? <p className="reduced-motion-note" role="status">{labels.reduced}</p> : null}
    <div className="runtime-stage" data-animation-module={animationModule.key} data-flash-frame={frame} data-runtime-language={context.lang} data-runtime-scenario={context.scenario} data-runtime-seed={context.seed}><Renderer frame={frame} key={`${replay}:${context.lang}:${context.scenario}:${context.seed}`} lang={context.lang} onReplay={onReplay} scenario={context.scenario} seed={context.seed} state={state} /></div>
  </div>;
}
