'use client';

import {useEffect, useState} from 'react';
import {loadBoundLessonAudio,sourceLessonHostPlayback,useSourceLessonHostBridge} from './source-lesson-host-bridge-v1';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import {P018PlayerV1, type P018CanvasAssetV1, type P018PlayerSnapshotV1} from '../../../packages/demos/src/alg-l06-p018-player-v1';
import {P018_AUDIO_ASSETS,type P018AudioId} from '../../../packages/demos/src/alg-l06-p018-audio-schedule-v1';
import type {P018GlossaryKey} from '../../../packages/demos/src/alg-l06-p018-clock-v1';

const ID = 'shared-alg001-l06-p018';
const SOURCE_SHA256 = '400f0cdcb574864c7e9e2208f986e91f26e10f796623b6ea41d80a59310e167a';
const CANVAS_SHA256 = '0204230c05b37bc076ae7510bbb4f6ef56b25d1fe50945f2bbb35e43521e88c6';
const CANVAS_URL = `/flash-assets/g678-local/${ID}/canvas-renderer.js?sha256=${CANVAS_SHA256}`;
export const P018_GLOSSARY_ENTRY_ID = {
  Evaluate:'evaluate', 'Input variable':'input-variable', Substitute:'substitute',
  Function:'function', Result:'result',
} as const satisfies Record<P018GlossaryKey,string>;
const HOST_BINDING={frameCount:648,frameDomain:'sprite-32',fps:12,
  companionIdSuffix:'-p018-source-readable',glossaryEntries:P018_GLOSSARY_ENTRY_ID} as const;
let canvasLoad: Promise<P018CanvasAssetV1> | undefined;

function p018CanvasAsset(): P018CanvasAssetV1 | undefined {
  return window.HELP_MATH_CANVAS_ASSETS?.[ID] as P018CanvasAssetV1 | undefined;
}

function exactCanvasAsset(): P018CanvasAssetV1 {
  const asset = p018CanvasAsset();
  if (asset?.metadata.animationId !== ID || asset.metadata.sourceSwfSha256 !== SOURCE_SHA256 ||
      asset.metadata.deterministicContentTimeline.timelineId !== 'sprite-32' ||
      asset.metadata.deterministicContentTimeline.frameCount !== 648 ||
      asset.metadata.stage.width !== 800 || asset.metadata.stage.height !== 600 ||
      asset.metadata.fps !== 12)
    throw Error('p018-canvas-identity-mismatch');
  return asset;
}

function loadCanvasAsset(): Promise<P018CanvasAssetV1> {
  if (p018CanvasAsset()) {
    try {return Promise.resolve(exactCanvasAsset());}
    catch (error) {return Promise.reject(error);}
  }
  if (!canvasLoad) canvasLoad = new Promise<P018CanvasAssetV1>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CANVAS_URL;
    script.async = true;
    script.onload = () => {
      try {resolve(exactCanvasAsset());}
      catch (error) {script.remove(); canvasLoad = undefined; reject(error);}
    };
    script.onerror = () => {script.remove(); canvasLoad = undefined; reject(Error('p018-canvas-request-failed'));};
    document.head.append(script);
  });
  return canvasLoad;
}

/** The route and the source transport independently verify the exact MP3 bytes. */
export async function p018LoadMainAudio(id:P018AudioId,signal: AbortSignal): Promise<ArrayBuffer> {
  const pin=P018_AUDIO_ASSETS.find(asset=>asset.id===id);
  if(!pin)throw Error('p018-unknown-audio-domain');
  return loadBoundLessonAudio({animationId:ID,assetId:id,pin,signal,
    origin:window.location.origin,errorPrefix:'p018-main'});
}

export function p018HostPlayback(snapshot: P018PlayerSnapshotV1): AnimationRuntimePlaybackState {
  return sourceLessonHostPlayback(snapshot,HOST_BINDING);
}

/** Exact local P018 adapter for the existing My Lesson playback controls. */
export function G678AlgL6P018RuntimeV1(props: LessonRuntimeAdapterProps) {
  const {source,readableTarget,reducedMotion,connectControls,onSnapshot,openGlossary}=
    useSourceLessonHostBridge(props,HOST_BINDING);
  const [asset,setAsset]=useState<P018CanvasAssetV1|null>(null);
  const [error,setError]=useState<string|null>(null);
  const scoped = process.env.NODE_ENV !== 'production' &&
    props.animationId === ID && props.moduleKey === ID && props.audioEnabled === true &&
    props.query.frameDomain === 'sprite-32' && props.query.scenario === 'source-static-frame' &&
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


  return <div ref={source} data-p018-host-probe={ID} data-p018-host-ready={String(Boolean(asset) && scoped)}
    data-p018-host-source-sha256={SOURCE_SHA256} data-p018-host-error={!scoped ? 'scope' : error ?? 'none'}>
    {!scoped || error ? <p role="alert">{props.labels.unavailable}</p> :
        asset ? <P018PlayerV1 asset={asset} loadAudio={p018LoadMainAudio}
          language={props.uiLanguage} reducedMotion={reducedMotion} volume={props.volume ?? 1}
          onSnapshot={onSnapshot} connectControls={connectControls} onOpenGlossary={openGlossary}
          hidePlaybackControls nativeTextTarget={readableTarget} /> :
          <p role="status">{props.labels.loading}</p>}
  </div>;
}
