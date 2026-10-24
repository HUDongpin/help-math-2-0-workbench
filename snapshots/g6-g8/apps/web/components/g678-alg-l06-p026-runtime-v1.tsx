'use client';

import {useEffect, useState} from 'react';
import {loadBoundLessonAudio,sourceLessonHostPlayback,useSourceLessonHostBridge} from './source-lesson-host-bridge-v1';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import {P026PlayerV1, type P026CanvasAssetV1, type P026PlayerSnapshotV1} from '../../../packages/demos/src/alg-l06-p026-player-v1';
import {P026_AUDIO_ASSETS,P026_SA_ASSET,type P026AudioId} from '../../../packages/demos/src/alg-l06-p026-audio-schedule-v1';
import type {P026GlossaryKey} from '../../../packages/demos/src/alg-l06-p026-timeline-v1';

const ID = 'shared-alg001-l06-p026';
const SOURCE_SHA256 = 'a61e60f95dc597c7b0024e7f013abfade47e199ae911be77916d5b38c7828e0c';
const CANVAS_SHA256 = '5f7b9b0cc37cb536113280c5fd35236cc67c9445b9802c86fce354801a742382';
const CANVAS_URL = `/flash-assets/g678-local/${ID}/canvas-renderer.js?sha256=${CANVAS_SHA256}`;
export const P026_GLOSSARY_ENTRY_ID = {
  'Independent variable':'independent-variable',Function:'function','Input variable':'input-variable',
  Domain:'domain','Dependent variable':'dependent-variable','Output variable':'output-variable',Range:'range',
} as const satisfies Record<P026GlossaryKey,string>;
const HOST_BINDING={frameCount:389,frameDomain:'sprite-55',fps:12,
  companionIdSuffix:'-p026-source-readable',glossaryEntries:P026_GLOSSARY_ENTRY_ID} as const;
let canvasLoad: Promise<P026CanvasAssetV1> | undefined;

function p026CanvasAsset(): P026CanvasAssetV1 | undefined {
  return window.HELP_MATH_CANVAS_ASSETS?.[ID] as P026CanvasAssetV1 | undefined;
}

function exactCanvasAsset(): P026CanvasAssetV1 {
  const asset = p026CanvasAsset();
  if (asset?.metadata.animationId !== ID || asset.metadata.sourceSwfSha256 !== SOURCE_SHA256 ||
      asset.metadata.deterministicContentTimeline.timelineId !== 'sprite-55' ||
      asset.metadata.deterministicContentTimeline.frameCount !== 389 ||
      asset.metadata.stage.width !== 800 || asset.metadata.stage.height !== 600 ||
      asset.metadata.fps !== 12)
    throw Error('p026-canvas-identity-mismatch');
  return asset;
}

function loadCanvasAsset(): Promise<P026CanvasAssetV1> {
  if (p026CanvasAsset()) {
    try {return Promise.resolve(exactCanvasAsset());}
    catch (error) {return Promise.reject(error);}
  }
  if (!canvasLoad) canvasLoad = new Promise<P026CanvasAssetV1>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CANVAS_URL;
    script.async = true;
    script.onload = () => {
      try {resolve(exactCanvasAsset());}
      catch (error) {script.remove(); canvasLoad = undefined; reject(error);}
    };
    script.onerror = () => {script.remove(); canvasLoad = undefined; reject(Error('p026-canvas-request-failed'));};
    document.head.append(script);
  });
  return canvasLoad;
}

/** The route and the source transport independently verify the exact MP3 bytes. */
export async function p026LoadMainAudio(id:P026AudioId,signal: AbortSignal): Promise<ArrayBuffer> {
  const pin=P026_AUDIO_ASSETS.find(asset=>asset.id===id);
  if(!pin)throw Error('p026-unknown-audio-domain');
  return loadBoundLessonAudio({animationId:ID,assetId:id,pin,signal,
    origin:window.location.origin,errorPrefix:'p026-main'});
}

export async function p026LoadSpanishAudio(signal:AbortSignal):Promise<ArrayBuffer>{
 return loadBoundLessonAudio({animationId:ID,assetId:'optional-spanish-audio-v1',pin:P026_SA_ASSET,signal,
  origin:window.location.origin,errorPrefix:'p026-spanish'});
}

export function p026HostPlayback(snapshot: P026PlayerSnapshotV1): AnimationRuntimePlaybackState {
  return sourceLessonHostPlayback(snapshot,HOST_BINDING);
}

/** Exact local P026 adapter for the existing My Lesson playback controls. */
export function G678AlgL6P026RuntimeV1(props: LessonRuntimeAdapterProps) {
  const {source,readableTarget,reducedMotion,connectControls,onSnapshot,openGlossary}=
    useSourceLessonHostBridge(props,HOST_BINDING);
  const [asset,setAsset]=useState<P026CanvasAssetV1|null>(null);
  const [error,setError]=useState<string|null>(null);
  const scoped = process.env.NODE_ENV !== 'production' &&
    props.animationId === ID && props.moduleKey === ID && props.audioEnabled === true &&
    props.query.frameDomain === 'sprite-55' && props.query.scenario === 'source-static-frame' &&
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


  return <div ref={source} data-p026-host-probe={ID} data-p026-host-ready={String(Boolean(asset) && scoped)}
    data-p026-host-source-sha256={SOURCE_SHA256} data-p026-host-error={!scoped ? 'scope' : error ?? 'none'}>
    {!scoped || error ? <p role="alert">{props.labels.unavailable}</p> :
        asset ? <P026PlayerV1 asset={asset} loadAudio={p026LoadMainAudio} loadSpanishAudio={p026LoadSpanishAudio}
          language={props.uiLanguage} reducedMotion={reducedMotion} volume={props.volume ?? 1}
          onSnapshot={snapshot=>onSnapshot({...snapshot,returning:snapshot.transitioning})} connectControls={connectControls} onOpenGlossary={openGlossary}
          hidePlaybackControls nativeTextTarget={readableTarget} /> :
          <p role="status">{props.labels.loading}</p>}
  </div>;
}
