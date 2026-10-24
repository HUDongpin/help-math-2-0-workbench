'use client';
import {useEffect, useRef, useState, type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import type {LessonRuntimeAdapterControls, LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
const ALG_L6_P004_ID='shared-alg001-l06-p004',ALG_L6_P004_DRAW_ID=ALG_L6_P004_ID;
const ALG_L6_P004_SOURCE_SHA256='514867e794dbc86059a452c5f1091cabfabf73e6f7918d0d28d9cf7ee604573e';
const ALG_L6_P004_CANVAS_URL='/flash-assets/g678-local/shared-alg001-l06-p004/canvas-v1?sha256=6b6f124262c8b90517151ea77eee43a30843c170211d4cd76404e584c876c2d8';
import {AlgL06P004ContinuousSourceClockV1} from '../../../packages/demos/src/alg-l06-p004-continuous-source-clock-v1';
import {P004OptionalSpanishAudio, type P004OptionalSpanishAudioSnapshot} from '../../../packages/demos/src/alg-l06-p004-optional-spanish-audio-v1';
import {p004PresentationTextSnapshot} from '../../../packages/demos/src/alg-l06-p004-text-presentation-v1';
import {P004NativeTextV1} from '../../../packages/demos/src/alg-l06-p004-native-text-v1';
import {p004ActivateGlossaryOccurrence,p004VisibleGlossaryOccurrences} from '../../../packages/demos/src/alg-l06-p004-glossary-state-v1';
import {p004GlossaryContent} from '../../../packages/demos/src/alg-l06-p004-glossary-content-v1';
import {P004_CONTINUOUS_SOURCE_URL} from '../../../packages/demos/src/alg-l06-p004-continuous-source-clock-v1';
import styles from './g678-alg-l06-p004-runtime-v1.module.css';

type View = {phase: string; frame: number; run: string | null; ready: boolean; reduced: boolean; error: string | null};
type P004CanvasAsset = NonNullable<typeof window.HELP_MATH_CANVAS_ASSETS>[string] &
  {metadata?: {sourceSwfSha256?: string}};
let canvasLoad: Promise<void> | undefined;
function ensureCanvasLoaded() {
  const existing = window.HELP_MATH_CANVAS_ASSETS?.[ALG_L6_P004_DRAW_ID] as P004CanvasAsset | undefined;
  if (existing) return existing.metadata?.sourceSwfSha256 === ALG_L6_P004_SOURCE_SHA256
    ? Promise.resolve() : Promise.reject(Error('p004-canvas-identity-mismatch'));
  if (!canvasLoad) canvasLoad = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = ALG_L6_P004_CANVAS_URL;
    script.async = true;
    script.onload = () => {
      const loaded = window.HELP_MATH_CANVAS_ASSETS?.[ALG_L6_P004_DRAW_ID] as P004CanvasAsset | undefined;
      if (loaded?.metadata?.sourceSwfSha256 === ALG_L6_P004_SOURCE_SHA256) resolve();
      else {script.remove(); canvasLoad = undefined; reject(Error('p004-canvas-identity-mismatch'));}
    };
    script.onerror = () => {script.remove(); canvasLoad = undefined; reject(Error('p004-canvas-request-failed'));};
    document.head.append(script);
  });
  return canvasLoad;
}

/** Unregistered source-clock adapter inside the real modern lesson controls. */
export function G678AlgL6P004RuntimeV1(props: LessonRuntimeAdapterProps) {
  const latest = useRef(props); latest.current = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [readableTarget, setReadableTarget] = useState<HTMLElement | null>(null);
  const [replay, setReplay] = useState(0);
  const clockRef = useRef<AlgL06P004ContinuousSourceClockV1 | null>(null);
  const saRef = useRef<P004OptionalSpanishAudio | null>(null);
  const saActions = useRef<{start: () => void; returnMain: () => void} | null>(null);
  const [saView, setSaView] = useState<{selected: boolean; phase: P004OptionalSpanishAudioSnapshot['phase']}>({selected: false, phase: 'idle'});
  const controlsRef = useRef<LessonRuntimeAdapterControls | null>(null);
  const glossaryRef = useRef<{entryId:string;occurrenceId:string;trigger:HTMLElement;seen:boolean}|null>(null);
  const [glossaryOpen,setGlossaryOpen] = useState(false);
  const [glossaryDenied,setGlossaryDenied] = useState(false);
  
  const [view, setView] = useState<View>({phase: 'loading', frame: 1, run: null, ready: false, reduced: false, error: null});
  useEffect(() => {
    const source = stage.current, owner = source?.closest('.lesson-shell2__learning-column');
    const id = props.pageInteractionCompanionTargetId;
    if (!source || !owner || !id?.endsWith('-p004-source-readable')) return;
    const resolve = () => {
      const target = source.ownerDocument.getElementById(id);
      const admitted = target?.parentElement === owner &&
        target.dataset.pageInteractionCompanionHost === 'true' && !source.contains(target) ? target : null;
      setReadableTarget(previous => previous === admitted ? previous : admitted);
    };
    resolve();
    const observer = new MutationObserver(resolve);
    observer.observe(owner, {childList: true, subtree: true});
    return () => observer.disconnect();
  }, [props.pageInteractionCompanionTargetId]);
  useEffect(() => {
    const abort = new AbortController();
    let active = true, clock: AlgL06P004ContinuousSourceClockV1 | undefined, frameHandle = 0;
    let lastPainted = 0, lastView = '', lastReport = '', lastPhase = '', completeReported = false, reduced = false;
    let runtimeError: string | null = null;
    let operation = 0, saSelected = false;
    let sa: P004OptionalSpanishAudio;
    const updateSa = () => {if (active) setSaView({selected: saSelected, phase: sa.snapshot().phase});};
    let asset: (NonNullable<typeof window.HELP_MATH_CANVAS_ASSETS>[string] &
      {metadata?: {sourceSwfSha256?: string}}) | undefined;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    reduced = media.matches;
    const motionChanged = () => {reduced = media.matches;};
    media.addEventListener('change', motionChanged);
    const paint = (frame: number) => {
      try {
      const target = canvas.current;
      if (!active || !target || !asset || window.HELP_MATH_CANVAS_ASSETS?.[ALG_L6_P004_DRAW_ID] !== asset) return false;
      if (!Number.isInteger(frame) || frame < 1 || frame > 831) return false;
      const state = asset.render(target, {frame, scenario: 'source-static-frame', lang: 'en', seed: 0}) as
        {localFrame?: number; frameDomain?: string};
      if (state.localFrame !== frame || state.frameDomain !== 'sprite-95' ||
        target.getAttribute('data-flash-frame') !== String(frame)) return false;
      lastPainted = frame;
      return target.getBoundingClientRect().width > 0;
      } catch {return false;}
    };
    const pauseMain = () => {
      operation++;
      if (clock && ['playing', 'start-pending'].includes(clock.snapshot().phase)) clock.pause();
      latest.current.onRuntimePausedChange(true);
    };
    const pause = () => {
      pauseMain();
      if (saSelected) sa.pause();
    };
    const startMain = async () => {
      if (!clock || !active || glossaryRef.current || !['ready', 'paused'].includes(clock.snapshot().phase)) return;
      const ticket = ++operation;
      latest.current.onRuntimePausedChange(false);
      const result = await clock.play({activation: 'user', reducedMotion: reduced});
      if (!active || ticket !== operation) return;
      if (result.accepted) {runtimeError = null; latest.current.onRuntimePausedChange(false);}
      else {runtimeError = result.reason; setView(old => ({...old, error: runtimeError})); pause();}
    };
    const startSa = async () => {
      if (!active || !clock || glossaryRef.current || ['failed', 'closed', 'loading', 'idle'].includes(clock.snapshot().phase)) return;
      pauseMain(); saSelected = true; runtimeError = null; updateSa();
      const ticket = ++operation;
      const result = await sa.start({activation: 'user'});
      if (!active || ticket !== operation || !saSelected) return;
      if (!result.accepted) {
        runtimeError = result.reason;
        latest.current.onRuntimePausedChange(true);
      }
    };
    const returnMain = () => {
      if (!active || !saSelected) return;
      operation++; saSelected = false; sa.stop(); updateSa();
      runtimeError = null; lastPhase = '';
      // Source host returns to the retained main cursor, except at its terminal stop.
      if (clock && !glossaryRef.current && ['ready', 'paused'].includes(clock.snapshot().phase)) void startMain();
      else latest.current.onRuntimePausedChange(true);
    };
    sa = new P004OptionalSpanishAudio({
      onChange(snapshot) {
        if (!active) return;
        updateSa();
        if (saSelected) {
          latest.current.onRuntimePausedChange(snapshot.phase !== 'playing');
          if (snapshot.phase === 'error') runtimeError = snapshot.failure;
        }
      },
      onEnded: returnMain,
    });
    saRef.current = sa;
    const actions = {start: () => {void startSa();}, returnMain};
    saActions.current = actions;
    const start = () => saSelected ? startSa() : startMain();
    const controls: LessonRuntimeAdapterControls = {
      setPaused(value) {if (value) pause(); else void start();},
      replay() {
        if (!clock || !active) return false;
        if (glossaryRef.current) latest.current.onLessonHostRequest?.({type:'close-glossary'});
        glossaryRef.current=null;setGlossaryOpen(false);setGlossaryDenied(false);
        operation++; sa.stop(); saSelected = false; updateSa();
        const result = clock.replay();
        if (!result.accepted) return false;
        setReplay(value => value + 1);
        setView(value => ({...value, frame: 1}));
        completeReported = false;
        lastPhase = ''; lastReport = '';
        runtimeError = null;
        latest.current.onRuntimePausedChange(true);
        return true;
      },
      narration(action) {if (action === 'stop') pause(); else void start();},
      stop() {pause();},
    };
    controlsRef.current = controls;
    const disconnect = props.connectRuntimeControls(controls);
    const init = async () => {
      if (process.env.NODE_ENV === 'production' || props.animationId !== ALG_L6_P004_ID ||
        props.moduleKey !== ALG_L6_P004_ID || props.audioEnabled !== true ||
        props.query.frameDomain !== 'sprite-95' || props.query.scenario !== 'source-static-frame' ||
        props.query.lang !== 'en' || String(props.query.seed) !== '0' || props.query.capture === '1')
        throw Error('p004-host-probe-scope-mismatch');
      await ensureCanvasLoaded();
      if (!active) return;
      asset = window.HELP_MATH_CANVAS_ASSETS?.[ALG_L6_P004_DRAW_ID] as typeof asset;
      if (!asset || asset.metadata?.sourceSwfSha256 !== ALG_L6_P004_SOURCE_SHA256)
        throw Error('p004-canvas-identity-mismatch');
      await asset.ready();
      if (!active) return;
      clock = new AlgL06P004ContinuousSourceClockV1({commitHeldFrame: paint});
      clockRef.current = clock;
      const response = await fetch(P004_CONTINUOUS_SOURCE_URL, {signal: abort.signal,
        cache: 'no-store', credentials: 'same-origin', redirect: 'error'});
      const expectedUrl=new URL(P004_CONTINUOUS_SOURCE_URL,window.location.origin).href;
      if (!response.ok || response.redirected || response.url!==expectedUrl ||
        response.headers.get('content-type')?.split(';')[0].trim()!=='audio/mpeg' ||
        response.headers.get('content-length')!=='329030' || !response.body)
        throw Error('p004-continuous-source-request-failed');
      const reader=response.body.getReader(),bounded=new Uint8Array(329030);let length=0;
      try {for(;;){const chunk=await reader.read();if(chunk.done)break;
        if(!active||abort.signal.aborted||length+chunk.value.byteLength>bounded.length)throw Error('p004-source-load-canceled-or-oversized');
        bounded.set(chunk.value,length);length+=chunk.value.byteLength;}
        if(length!==bounded.length)throw Error('p004-source-length-mismatch');
      }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
      const bytes=bounded.buffer;
      if (!active) return;
      const prepared = await clock.prepare(bytes);
      if (!active) return;
      if (!prepared.accepted) throw Error(prepared.reason);
      clock.setVolume(latest.current.volume ?? 1);
      sa.setVolume(latest.current.volume ?? 1);
      latest.current.onRuntimePausedChange(true);
      const draw = () => {
        if (!active || !clock) return;
        const snapshot = clock.snapshot();
        if (snapshot.phase === 'failed' || snapshot.phase === 'closed') {
          runtimeError = snapshot.failure ?? 'p004-source-clock-closed';
          operation++; sa.stop(); void clock.close();
          latest.current.onRuntimePausedChange(true);
          setView(old => ({...old, phase: snapshot.phase, ready: false, error: runtimeError}));
          return;
        }
        const hostPhase = `${snapshot.phase}:${saSelected}:${sa.snapshot().phase}`;
        if (hostPhase !== lastPhase) {
          lastPhase = hostPhase;
          latest.current.onRuntimePausedChange(saSelected ? sa.snapshot().phase !== 'playing' : !['playing', 'start-pending'].includes(snapshot.phase));
        }
        const frame = snapshot.frame;
        if (frame !== lastPainted && !paint(frame)) {
          runtimeError = 'p004-frame-paint-failed';
          pause(); sa.stop(); void clock.close();
          setView(old => ({...old, ready: false, phase: 'failed', error: runtimeError})); return;
        }
        const report: AnimationRuntimePlaybackState = {
          audioAvailable: true, frame, frameCount: 831, frameDomain: 'sprite-95', fps: 12,
          narration: (saSelected ? sa.snapshot().phase === 'playing' : snapshot.phase === 'playing' && snapshot.audio.runId) ? 'playing' : 'idle',
          playbackProgress: (frame - 1) / 830,
          seekAvailable: false, stepFrames: 12, transportMode: 'none',
        };
        const reportKey = JSON.stringify(report);
        if (reportKey !== lastReport) {lastReport = reportKey; latest.current.onPlaybackStateChange?.(report);}
        const next: View = {phase: snapshot.phase, frame, run: snapshot.audio.runId, ready: true, reduced, error: runtimeError};
        const key = `${next.phase}:${next.frame}:${next.run}:${next.reduced}:${next.error}`;
        if (key !== lastView) {lastView = key; setView(next);}
        if (snapshot.timelineReachedEnd && !completeReported) {
          completeReported = true;
          // A source timeline stop is not lesson completion.
          latest.current.onRuntimePausedChange(true);
        }
        frameHandle = requestAnimationFrame(draw);
      };
      draw();
    };
    void init().catch(cause => {
      if (!active) return;
      pause(); sa.stop(); void clock?.close();
      setView(old => ({...old, phase: 'failed', error: cause instanceof Error ? cause.message : String(cause)}));
    });
    return () => {
      active = false; operation++; abort.abort(); cancelAnimationFrame(frameHandle);
      glossaryRef.current=null;
      media.removeEventListener('change', motionChanged);
      disconnect(); void clock?.close(); void sa.close().catch(() => {});
      if (saRef.current === sa) saRef.current = null;
      if (saActions.current === actions) saActions.current = null;
      if (clockRef.current === clock) clockRef.current = null;
      if (controlsRef.current === controls) controlsRef.current = null;
    };
  }, [props.animationId, props.moduleKey, props.audioEnabled, props.connectRuntimeControls]);
  useEffect(() => {clockRef.current?.setVolume(props.volume ?? 1); saRef.current?.setVolume(props.volume ?? 1);}, [props.volume]);
  useEffect(() => {
    const clock = clockRef.current;
    if (props.paused && clock && (['playing', 'start-pending'].includes(clock.snapshot().phase) || saRef.current?.snapshot().phase === 'playing'))
      controlsRef.current?.setPaused(true);
  }, [props.paused]);
  useEffect(()=>{
    const check=()=>{
      const pending=glossaryRef.current;if(!pending)return;
      const dialog=document.querySelector(`[role="dialog"][data-glossary-entry-id="${pending.entryId}"]`);
      if(dialog){pending.seen=true;return;}
      if(pending.seen){glossaryRef.current=null;setGlossaryOpen(false);
        controlsRef.current?.setPaused(true);
        requestAnimationFrame(()=>{if(pending.trigger.isConnected)pending.trigger.focus({preventScroll:true});});}
    };
    const observer=new MutationObserver(check);observer.observe(document.body,{childList:true,subtree:true});
    return()=>observer.disconnect();
  },[]);
  const openGlossary=(occurrenceId:string,trigger:HTMLElement)=>{
    const clock=clockRef.current;
    if(!clock||!view.ready||glossaryRef.current||!latest.current.onLessonHostRequest)return;
    const before=clock.snapshot();
    if(!['ready','paused','playing','start-pending','timeline-ended'].includes(before.phase))return;
    // The clock may advance between React render and activation: validate actual owned frame.
    let selected;
    try{selected=p004ActivateGlossaryOccurrence({frame:before.frame,paused:true,selectedButton:null,keyAttribute:null},occurrenceId);}
    catch{return;}
    const entry=p004GlossaryContent(selected.keyAttribute!,props.uiLanguage==='es'?'es':'en');
    controlsRef.current?.setPaused(true); // Also cancels an in-flight optional SA load.
    const entryId=entry.canonicalDictionaryKey.toLowerCase();
    glossaryRef.current={entryId,occurrenceId,trigger,seen:false};setGlossaryOpen(true);
    const result=latest.current.onLessonHostRequest({type:'open-glossary',entryId},{trigger});
    if(result?.status!=='allowed'){glossaryRef.current=null;setGlossaryOpen(false);setGlossaryDenied(true);}
    else setGlossaryDenied(false);
  };
  const style = {'--flash-stage-width': '800px', '--flash-stage-height': '600px',
    '--flash-stage-aspect': '800 / 600'} as CSSProperties;
  const textSnapshot = p004PresentationTextSnapshot(undefined, {frame: view.frame, frameDomain: 'sprite-95', rootFrame: 6,
    scenario: 'source-static-frame', lang: props.uiLanguage === 'es' ? 'es' : 'en', seed: 0, replay});
  const occurrences = p004VisibleGlossaryOccurrences(view.frame);
  return <div className="runtime-shell" style={style} data-p004-host-probe={ALG_L6_P004_ID}
    data-p004-probe-phase={view.phase} data-source-clock-ready={view.ready ? 'true' : 'false'}
    data-runtime-paused={(saView.selected ? saView.phase === 'playing' : view.phase === 'playing') ? 'false' : 'true'}
    data-p004-sa-selected={String(saView.selected)} data-p004-sa-phase={saView.phase}
    data-p004-glossary-open={String(glossaryOpen)} data-source-control-count={occurrences.length}
    data-runtime-playback-complete="false"
    data-p004-continuous-v1="true" data-source-timeline-ended={view.phase === 'timeline-ended' ? 'true' : 'false'}
    data-source-audio-run={view.run ?? 'none'} data-source-alignment="candidate-not-accepted">
    <div ref={stage} className="runtime-stage" data-animation-module={ALG_L6_P004_ID} style={{position:'relative'}}
      data-flash-frame={view.frame} data-flash-frame-domain="sprite-95" data-runtime-scenario="source-static-frame">
      <canvas ref={canvas} width={800} height={600} data-course-canvas={ALG_L6_P004_ID}
        aria-hidden="true"
        style={{display: 'block', width: '100%', height: 'auto'}}/>
      {view.ready&&occurrences.map(row=><button key={row.occurrenceId} type="button"
        className={styles.sourceHotspot} disabled={glossaryOpen}
        data-p004-source-occurrence={row.occurrenceId} data-source-key-attribute={row.keyAttribute}
        aria-label={p004GlossaryContent(row.keyAttribute,props.uiLanguage==='es'?'es':'en').label}
        style={{left:`${row.rect[0]/8}%`,top:`${row.rect[1]/6}%`,width:`${row.rect[2]/8}%`,height:`${row.rect[3]/6}%`}}
        onClick={event=>openGlossary(row.occurrenceId,event.currentTarget)}/>)}
    </div>
    {view.ready && readableTarget ? createPortal(<section className={styles.readable} aria-label="Source-readable lesson text"
      style={{maxWidth: 640, margin: '12px auto', minWidth: 0}}>
      <div role="group" aria-label={props.uiLanguage === 'es' ? 'Audio en español' : 'Spanish Audio'}
        style={{display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12}}>
        <button type="button" data-p004-sa-start disabled={glossaryOpen || saView.phase === 'loading' || saView.phase === 'playing'}
          onClick={() => saActions.current?.start()} className={styles.optionalAudioButton}>
          {props.uiLanguage === 'es' ? 'Reproducir audio en español' : 'Play Spanish Audio'}
        </button>
        {saView.selected ? <button type="button" data-p004-sa-return disabled={glossaryOpen} onClick={() => saActions.current?.returnMain()}
          className={styles.optionalAudioButton}>
          {props.uiLanguage === 'es' ? 'Volver a la animación' : 'Return to animation'}
        </button> : null}
        {saView.phase === 'loading' ? <span role="status">{props.labels.loading}</span> : null}
      </div>
      <div className={styles.vocabulary} role="group" aria-label={props.uiLanguage==='es'?'Vocabulario de la página':'Page vocabulary'}>
        {occurrences.map(row=><button key={row.occurrenceId} type="button" className={styles.optionalAudioButton}
          data-p004-companion-occurrence={row.occurrenceId} data-source-key-attribute={row.keyAttribute}
          disabled={glossaryOpen} onClick={event=>openGlossary(row.occurrenceId,event.currentTarget)}>
          {p004GlossaryContent(row.keyAttribute,props.uiLanguage==='es'?'es':'en').label}
        </button>)}
      </div>
      {glossaryDenied?<p role="status">{props.labels.unavailable}</p>:null}
      <P004NativeTextV1 snapshot={textSnapshot}/>
    </section>, readableTarget) : null}
    {!view.ready && !view.error ? <p role="status">{props.labels.loading}</p> : null}
    {view.error ? <p role="alert" data-p004-probe-error={view.error}>{props.labels.unavailable}</p> : null}
    {view.ready && view.reduced ? <p role="status">{props.labels.reduced}</p> : null}
  </div>;
}
