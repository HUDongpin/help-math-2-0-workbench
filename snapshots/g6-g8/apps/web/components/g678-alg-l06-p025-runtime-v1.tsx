'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import {P025PlayerV1, type P025CanvasAssetV1, type P025PlayerSnapshotV1, type P025PlayerControlsV1} from '../../../packages/demos/src/alg-l06-p025-player-v1';
import {P025_AUDIO_ASSETS,P025_SA_ASSET,type P025AudioId} from '../../../packages/demos/src/alg-l06-p025-audio-schedule-v1';
import type {P025GlossaryKey} from '../../../packages/demos/src/alg-l06-p025-clock-v1';



const ID = 'shared-alg001-l06-p025';
const SOURCE_SHA256 = 'dcb6b709d71eada47053b50bcfcc1161dec5d1717ebca6cbf8463eb6863dbde6';
const CANVAS_SHA256 = 'a3fd0f401fa32779ddff8fc41bc423d458b2ea2a929c44a43fbe3446dc5082f9';
const CANVAS_URL = `/flash-assets/g678-local/${ID}/canvas-renderer.js?sha256=${CANVAS_SHA256}`;
export const P025_GLOSSARY_ENTRY_ID = {
  Domain:'domain', 'Independent variable':'independent-variable', 'Input variable':'input-variable', Function:'function',
} as const satisfies Record<P025GlossaryKey,string>;
type P025EntryId = typeof P025_GLOSSARY_ENTRY_ID[P025GlossaryKey];
let canvasLoad: Promise<P025CanvasAssetV1> | undefined;

function p025CanvasAsset(): P025CanvasAssetV1 | undefined {
  return window.HELP_MATH_CANVAS_ASSETS?.[ID] as P025CanvasAssetV1 | undefined;
}

function exactCanvasAsset(): P025CanvasAssetV1 {
  const asset = p025CanvasAsset();
  if (asset?.metadata.animationId !== ID || asset.metadata.sourceSwfSha256 !== SOURCE_SHA256 ||
      asset.metadata.deterministicContentTimeline.timelineId !== 'sprite-21' ||
      asset.metadata.deterministicContentTimeline.frameCount !== 299 ||
      asset.metadata.stage.width !== 800 || asset.metadata.stage.height !== 600 ||
      asset.metadata.fps !== 12)
    throw Error('p025-canvas-identity-mismatch');
  return asset;
}

function loadCanvasAsset(): Promise<P025CanvasAssetV1> {
  if (p025CanvasAsset()) {
    try {return Promise.resolve(exactCanvasAsset());}
    catch (error) {return Promise.reject(error);}
  }
  if (!canvasLoad) canvasLoad = new Promise<P025CanvasAssetV1>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CANVAS_URL;
    script.async = true;
    script.onload = () => {
      try {resolve(exactCanvasAsset());}
      catch (error) {script.remove(); canvasLoad = undefined; reject(error);}
    };
    script.onerror = () => {script.remove(); canvasLoad = undefined; reject(Error('p025-canvas-request-failed'));};
    document.head.append(script);
  });
  return canvasLoad;
}

/** The route and the source transport independently verify the exact MP3 bytes. */
export async function p025LoadMainAudio(id:P025AudioId,signal: AbortSignal): Promise<ArrayBuffer> {
  const pin=P025_AUDIO_ASSETS.find(asset=>asset.id===id);
  if(!pin)throw Error('p025-unknown-audio-domain');
  const expectedBytes=pin.sourceBytes;
  const expected = new URL(`/flash-assets/g678-local/${ID}/${id}?sha256=${pin.sourceSha256}`, window.location.origin);
  const response = await fetch(expected, {signal, credentials: 'same-origin', cache: 'no-store', redirect: 'error'});
  if (!response.ok || response.redirected || response.url !== expected.href ||
      response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'audio/mpeg' ||
      response.headers.get('content-length') !== String(expectedBytes) || !response.body)
    throw Error('p025-main-response-mismatch');
  const reader = response.body.getReader(), bytes = new Uint8Array(expectedBytes);
  let length = 0;
  try {
    for (;;) {
      const chunk = await reader.read();
      if (signal.aborted) throw Error('p025-main-load-canceled');
      if (chunk.done) break;
      if (length + chunk.value.byteLength > bytes.length) throw Error('p025-main-response-too-large');
      bytes.set(chunk.value, length); length += chunk.value.byteLength;
    }
    if (length !== bytes.length) throw Error('p025-main-response-length-mismatch');
    return bytes.buffer;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

/** Separate SA is fetched only after an explicit user selection in the player. */
export async function p025LoadSpanishAudio(signal:AbortSignal):Promise<ArrayBuffer>{
 const pin=P025_SA_ASSET;
 const expected=new URL(`/flash-assets/g678-local/${ID}/optional-spanish-audio-v1?sha256=${pin.sourceSha256}`,
  window.location.origin);
 const response=await fetch(expected,{signal,credentials:'same-origin',cache:'no-store',redirect:'error'});
 if(!response.ok||response.redirected||response.url!==expected.href||
  response.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='audio/mpeg'||
  response.headers.get('content-length')!==String(pin.sourceBytes)||!response.body)
  throw Error('p025-spanish-response-mismatch');
 const reader=response.body.getReader(),bytes=new Uint8Array(pin.sourceBytes);
 let length=0;
 try{
  for(;;){
   const chunk=await reader.read();
   if(signal.aborted)throw Error('p025-spanish-load-canceled');
   if(chunk.done)break;
   if(length+chunk.value.byteLength>bytes.length)throw Error('p025-spanish-response-too-large');
   bytes.set(chunk.value,length);length+=chunk.value.byteLength;
  }
  if(length!==bytes.length)throw Error('p025-spanish-response-length-mismatch');
  return bytes.buffer;
 }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}

export function p025HostPlayback(snapshot: P025PlayerSnapshotV1): AnimationRuntimePlaybackState {
  const frame = snapshot.frame;
  return {
    audioAvailable: true, frame, frameCount: 299, frameDomain: 'sprite-21', fps: 12,
    narration: snapshot.selectedAudio === 'spanish'
      ? snapshot.spanish.phase === 'playing' ? 'playing' : 'idle'
      : snapshot.phase === 'playing' && snapshot.audio.phase === 'playing' ? 'playing' : 'idle',
    playbackProgress: (frame - 1) / 298,
    seekAvailable: false, stepFrames: 12, transportMode: 'none',
  };
}

/** Exact local P025 adapter for the existing My Lesson playback controls. */
export function G678AlgL6P025RuntimeV1(props: LessonRuntimeAdapterProps) {
  const latest = useRef(props); latest.current = props;
  const source = useRef<HTMLDivElement>(null);
  const controls = useRef<P025PlayerControlsV1 | null>(null);
  const [asset, setAsset] = useState<P025CanvasAssetV1 | null>(null);
  const [readableTarget, setReadableTarget] = useState<HTMLElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const glossary = useRef<{seen:boolean;entryId:P025EntryId}|null>(null);
  const lastPaused = useRef<boolean | null>(null);
  const reportTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoped = process.env.NODE_ENV !== 'production' &&
    props.animationId === ID && props.moduleKey === ID && props.audioEnabled === true &&
    props.query.frameDomain === 'sprite-21' && props.query.scenario === 'source-static-frame' &&
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
    if (!element || !owner || !id?.endsWith('-p025-source-readable')) return;
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

  const connectControls = useCallback((value: P025PlayerControlsV1) => {
    controls.current = value;
    const disconnect = props.connectRuntimeControls(value);
    return () => {if (controls.current === value) controls.current = null; disconnect();};
  }, [props.connectRuntimeControls]);

  const onSnapshot = useCallback((snapshot: P025PlayerSnapshotV1) => {
    const paused = snapshot.transitioning ? false : snapshot.selectedAudio === 'spanish'
      ? !['playing', 'loading'].includes(snapshot.spanish.phase)
      : !['playing', 'start-pending'].includes(snapshot.phase);
    const playback = p025HostPlayback(snapshot);
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

  const openGlossary = useCallback((key:P025GlossaryKey,trigger:HTMLButtonElement) => {
    if(!Object.prototype.hasOwnProperty.call(P025_GLOSSARY_ENTRY_ID,key)||glossary.current) return;
    const entryId=P025_GLOSSARY_ENTRY_ID[key];
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

  return <div ref={source} data-p025-host-probe={ID} data-p025-host-ready={String(Boolean(asset) && scoped)}
    data-p025-host-source-sha256={SOURCE_SHA256} data-p025-host-error={!scoped ? 'scope' : error ?? 'none'}>
    {!scoped || error ? <p role="alert">{props.labels.unavailable}</p> :
        asset ? <P025PlayerV1 asset={asset} loadAudio={p025LoadMainAudio}
          loadSpanishAudio={p025LoadSpanishAudio}
          language={props.uiLanguage} reducedMotion={reducedMotion} volume={props.volume ?? 1}
          onSnapshot={onSnapshot} connectControls={connectControls} onOpenGlossary={openGlossary}
          hidePlaybackControls nativeTextTarget={readableTarget} /> :
          <p role="status">{props.labels.loading}</p>}
  </div>;
}
