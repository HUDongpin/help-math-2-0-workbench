'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import {P016PlayerV1, type P016CanvasAssetV1, type P016PlayerSnapshotV1, type P016PlayerControlsV1} from '../../../packages/demos/src/alg-l06-p016-player-v1';
import {P016_AUDIO_ASSETS,type P016AudioId} from '../../../packages/demos/src/alg-l06-p016-audio-schedule-v1';
import type {P016GlossaryKey} from '../../../packages/demos/src/alg-l06-p016-clock-v1';

const ID = 'shared-alg001-l06-p016';
const SOURCE_SHA256 = '2fdeba5b4dcfcfe7d1b575ab30d76a98fca802d6be670a679a54378f32aa4ae9';
const CANVAS_SHA256 = '3f6fddbf841d5cac7e28f1112971faed148c89160a8529ba81a30e12ab146b3a';
const CANVAS_URL = `/flash-assets/g678-local/${ID}/canvas-renderer.js?sha256=${CANVAS_SHA256}`;
export const P016_GLOSSARY_ENTRY_ID = {
  Function: 'function',
} as const satisfies Record<P016GlossaryKey,string>;
type P016EntryId = typeof P016_GLOSSARY_ENTRY_ID[P016GlossaryKey];
let canvasLoad: Promise<P016CanvasAssetV1> | undefined;

function p016CanvasAsset(): P016CanvasAssetV1 | undefined {
  return window.HELP_MATH_CANVAS_ASSETS?.[ID] as P016CanvasAssetV1 | undefined;
}

function exactCanvasAsset(): P016CanvasAssetV1 {
  const asset = p016CanvasAsset();
  if (asset?.metadata.animationId !== ID || asset.metadata.sourceSwfSha256 !== SOURCE_SHA256 ||
      asset.metadata.deterministicContentTimeline.timelineId !== 'sprite-139' ||
      asset.metadata.deterministicContentTimeline.frameCount !== 815 ||
      asset.metadata.stage.width !== 800 || asset.metadata.stage.height !== 600 ||
      asset.metadata.fps !== 12)
    throw Error('p016-canvas-identity-mismatch');
  return asset;
}

function loadCanvasAsset(): Promise<P016CanvasAssetV1> {
  if (p016CanvasAsset()) {
    try {return Promise.resolve(exactCanvasAsset());}
    catch (error) {return Promise.reject(error);}
  }
  if (!canvasLoad) canvasLoad = new Promise<P016CanvasAssetV1>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CANVAS_URL;
    script.async = true;
    script.onload = () => {
      try {resolve(exactCanvasAsset());}
      catch (error) {script.remove(); canvasLoad = undefined; reject(error);}
    };
    script.onerror = () => {script.remove(); canvasLoad = undefined; reject(Error('p016-canvas-request-failed'));};
    document.head.append(script);
  });
  return canvasLoad;
}

/** The route and the source transport independently verify the exact MP3 bytes. */
export async function p016LoadMainAudio(id:P016AudioId,signal: AbortSignal): Promise<ArrayBuffer> {
  const pin=P016_AUDIO_ASSETS.find(asset=>asset.id===id);
  if(!pin)throw Error('p016-unknown-audio-domain');
  const expectedBytes=pin.sourceBytes;
  const expected = new URL(`/flash-assets/g678-local/${ID}/${id}?sha256=${pin.sourceSha256}`, window.location.origin);
  const response = await fetch(expected, {signal, credentials: 'same-origin', cache: 'no-store', redirect: 'error'});
  if (!response.ok || response.redirected || response.url !== expected.href ||
      response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'audio/mpeg' ||
      response.headers.get('content-length') !== String(expectedBytes) || !response.body)
    throw Error('p016-main-response-mismatch');
  const reader = response.body.getReader(), bytes = new Uint8Array(expectedBytes);
  let length = 0;
  try {
    for (;;) {
      const chunk = await reader.read();
      if (signal.aborted) throw Error('p016-main-load-canceled');
      if (chunk.done) break;
      if (length + chunk.value.byteLength > bytes.length) throw Error('p016-main-response-too-large');
      bytes.set(chunk.value, length); length += chunk.value.byteLength;
    }
    if (length !== bytes.length) throw Error('p016-main-response-length-mismatch');
    return bytes.buffer;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export function p016HostPlayback(snapshot: P016PlayerSnapshotV1): AnimationRuntimePlaybackState {
  const frame = snapshot.frame;
  return {
    audioAvailable: true, frame, frameCount: 815, frameDomain: 'sprite-139', fps: 12,
    narration: snapshot.selectedAudio === 'spanish'
      ? snapshot.spanish.phase === 'playing' ? 'playing' : 'idle'
      : snapshot.phase === 'playing' && snapshot.audio.phase === 'playing' ? 'playing' : 'idle',
    playbackProgress: (frame - 1) / 814,
    seekAvailable: false, stepFrames: 12, transportMode: 'none',
  };
}

/** Exact local P016 adapter for the existing My Lesson playback controls. */
export function G678AlgL6P016RuntimeV1(props: LessonRuntimeAdapterProps) {
  const latest = useRef(props); latest.current = props;
  const source = useRef<HTMLDivElement>(null);
  const controls = useRef<P016PlayerControlsV1 | null>(null);
  const [asset, setAsset] = useState<P016CanvasAssetV1 | null>(null);
  const [readableTarget, setReadableTarget] = useState<HTMLElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const glossary = useRef<{seen:boolean;entryId:P016EntryId}|null>(null);
  const lastPaused = useRef<boolean | null>(null);
  const reportTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoped = process.env.NODE_ENV !== 'production' &&
    props.animationId === ID && props.moduleKey === ID && props.audioEnabled === true &&
    props.query.frameDomain === 'sprite-139' && props.query.scenario === 'source-static-frame' &&
    props.query.lang === 'en' && String(props.query.seed) === '0' && props.query.capture !== '1' &&
    (props.uiLanguage === 'en' || props.uiLanguage === 'es');

  useEffect(() => {
    if (!scoped) return;
    let active = true;
    void loadCanvasAsset().then(value => {if (active) setAsset(value);}, cause => {
      if (active) setError(cause instanceof Error ? cause.message : String(cause));
    });
    return () => {active = false;};
  }, [scoped]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const element = source.current, owner = element?.closest('.lesson-shell2__learning-column');
    const id = props.pageInteractionCompanionTargetId;
    if (!element || !owner || !id?.endsWith('-p016-source-readable')) return;
    const resolve = () => {
      const target = element.ownerDocument.getElementById(id);
      const admitted = target?.parentElement === owner &&
        target.dataset.pageInteractionCompanionHost === 'true' && !element.contains(target) ? target : null;
      setReadableTarget(previous => previous === admitted ? previous : admitted);
    };
    resolve();
    const observer = new MutationObserver(resolve);
    observer.observe(owner, {childList: true, subtree: true});
    return () => observer.disconnect();
  }, [props.pageInteractionCompanionTargetId]);

  const connectControls = useCallback((value: P016PlayerControlsV1) => {
    controls.current = value;
    const disconnect = props.connectRuntimeControls(value);
    return () => {if (controls.current === value) controls.current = null; disconnect();};
  }, [props.connectRuntimeControls]);

  const onSnapshot = useCallback((snapshot: P016PlayerSnapshotV1) => {
    const paused = snapshot.returning ? false : snapshot.selectedAudio === 'spanish'
      ? !['playing', 'loading'].includes(snapshot.spanish.phase)
      : !['playing', 'start-pending'].includes(snapshot.phase);
    const playback = p016HostPlayback(snapshot);
    lastPaused.current = paused;
    // The host resets its pause flag after invoking Replay. Report the final
    // source state after that event completes, without reflecting it as a new
    // pause command back into an in-flight SA load or return.
    if (reportTimer.current !== null) clearTimeout(reportTimer.current);
    reportTimer.current = setTimeout(() => {
      reportTimer.current = null;
      if (latest.current.paused !== paused) latest.current.onRuntimePausedChange(paused);
      latest.current.onPlaybackStateChange?.(playback);
    }, 0);
  }, []);

  useEffect(() => {
    if (!props.paused || lastPaused.current !== false) return;
    const target = controls.current;
    // A host effect can request a pause while React is committing navigation.
    // Let that commit finish before the player synchronously paints its held frame.
    queueMicrotask(() => {
      if (target && controls.current === target && latest.current.paused && lastPaused.current === false)
        target.setPaused(true);
    });
  }, [props.paused]);

  const openGlossary = useCallback((key:P016GlossaryKey,trigger:HTMLButtonElement) => {
    if(!Object.prototype.hasOwnProperty.call(P016_GLOSSARY_ENTRY_ID,key)||glossary.current) return;
    const entryId=P016_GLOSSARY_ENTRY_ID[key];
    glossary.current={seen:false,entryId};
    // Move focus before the host makes the companion inert; keep the trigger
    // reference so its existing close/denial paths restore keyboard focus.
    if(document.activeElement===trigger)trigger.blur();
    try {
      const result=latest.current.onLessonHostRequest?.({type:'open-glossary',entryId},{trigger});
      if(result?.status==='allowed')return;
    } catch(error) {
      glossary.current=null;controls.current?.closeGlossary();
      throw error;
    }
    glossary.current=null;controls.current?.closeGlossary();
  },[]);
  useEffect(()=>{
    const check=()=>{
      const pending=glossary.current;if(!pending)return;
      if(document.querySelector(`[role="dialog"][data-glossary-entry-id="${pending.entryId}"]`)){
        pending.seen=true;return;
      }
      if(pending.seen){glossary.current=null;controls.current?.closeGlossary();}
    };
    const observer=new MutationObserver(check);
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>{observer.disconnect();glossary.current=null;};
  },[]);

  useEffect(() => () => {
    if (reportTimer.current !== null) clearTimeout(reportTimer.current);
    reportTimer.current = null;
  }, []);

  return <div ref={source} data-p016-host-probe={ID} data-p016-host-ready={String(Boolean(asset) && scoped)}
    data-p016-host-source-sha256={SOURCE_SHA256} data-p016-host-error={!scoped ? 'scope' : error ?? 'none'}>
    {!scoped || error ? <p role="alert">{props.labels.unavailable}</p> :
        asset ? <P016PlayerV1 asset={asset} loadAudio={p016LoadMainAudio}
          language={props.uiLanguage} reducedMotion={reducedMotion} volume={props.volume ?? 1}
          onSnapshot={onSnapshot} connectControls={connectControls} onOpenGlossary={openGlossary}
          hidePlaybackControls nativeTextTarget={readableTarget} /> :
          <p role="status">{props.labels.loading}</p>}
  </div>;
}
