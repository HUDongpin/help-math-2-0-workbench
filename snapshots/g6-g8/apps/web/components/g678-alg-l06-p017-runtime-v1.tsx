'use client';

import {useEffect, useState} from 'react';
import {loadBoundLessonAudio,sourceLessonHostPlayback,useSourceLessonHostBridge} from './source-lesson-host-bridge-v1';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import {P017PlayerV1, type P017CanvasAssetV1, type P017PlayerSnapshotV1} from '../../../packages/demos/src/alg-l06-p017-player-v1';
import {P017_AUDIO_ASSETS,type P017AudioId} from '../../../packages/demos/src/alg-l06-p017-audio-schedule-v1';
import type {P017GlossaryKey} from '../../../packages/demos/src/alg-l06-p017-clock-v1';

const ID = 'shared-alg001-l06-p017';
const SOURCE_SHA256 = '7010ecfee54a80298e3bba09400a712cfed65dad983811d9a470bf017156ffb3';
const CANVAS_SHA256 = 'b78c06d8e3f0111ae28ee7d4c90f98381001fe3b3fa0e9e92d6b3ab24bda6a7f';
const CANVAS_URL = `/flash-assets/g678-local/${ID}/canvas-renderer.js?sha256=${CANVAS_SHA256}`;
export const P017_GLOSSARY_ENTRY_ID = {
  Equation:'equation', Sentence:'sentence', Function:'function', Rule:'rule',
  'Output variable':'output-variable', 'Input variable':'input-variable',
} as const satisfies Record<P017GlossaryKey,string>;
const HOST_BINDING={frameCount:721,frameDomain:'sprite-42',fps:12,
  companionIdSuffix:'-p017-source-readable',glossaryEntries:P017_GLOSSARY_ENTRY_ID} as const;
let canvasLoad: Promise<P017CanvasAssetV1> | undefined;

function p017CanvasAsset(): P017CanvasAssetV1 | undefined {
  return window.HELP_MATH_CANVAS_ASSETS?.[ID] as P017CanvasAssetV1 | undefined;
}

function exactCanvasAsset(): P017CanvasAssetV1 {
  const asset = p017CanvasAsset();
  if (asset?.metadata.animationId !== ID || asset.metadata.sourceSwfSha256 !== SOURCE_SHA256 ||
      asset.metadata.deterministicContentTimeline.timelineId !== 'sprite-42' ||
      asset.metadata.deterministicContentTimeline.frameCount !== 721 ||
      asset.metadata.stage.width !== 800 || asset.metadata.stage.height !== 600 ||
      asset.metadata.fps !== 12)
    throw Error('p017-canvas-identity-mismatch');
  return asset;
}

function loadCanvasAsset(): Promise<P017CanvasAssetV1> {
  if (p017CanvasAsset()) {
    try {return Promise.resolve(exactCanvasAsset());}
    catch (error) {return Promise.reject(error);}
  }
  if (!canvasLoad) canvasLoad = new Promise<P017CanvasAssetV1>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CANVAS_URL;
    script.async = true;
    script.onload = () => {
      try {resolve(exactCanvasAsset());}
      catch (error) {script.remove(); canvasLoad = undefined; reject(error);}
    };
    script.onerror = () => {script.remove(); canvasLoad = undefined; reject(Error('p017-canvas-request-failed'));};
    document.head.append(script);
  });
  return canvasLoad;
}

/** The route and the source transport independently verify the exact MP3 bytes. */
export async function p017LoadMainAudio(id:P017AudioId,signal: AbortSignal): Promise<ArrayBuffer> {
  const pin=P017_AUDIO_ASSETS.find(asset=>asset.id===id);
  if(!pin)throw Error('p017-unknown-audio-domain');
  return loadBoundLessonAudio({animationId:ID,assetId:id,pin,signal,
    origin:window.location.origin,errorPrefix:'p017-main'});
}

export function p017HostPlayback(snapshot: P017PlayerSnapshotV1): AnimationRuntimePlaybackState {
  return sourceLessonHostPlayback(snapshot,HOST_BINDING);
}

/** Exact local P017 adapter for the existing My Lesson playback controls. */
export function G678AlgL6P017RuntimeV1(props: LessonRuntimeAdapterProps) {
  const {source,readableTarget,reducedMotion,connectControls,onSnapshot,openGlossary}=
    useSourceLessonHostBridge(props,HOST_BINDING);
  const [asset,setAsset]=useState<P017CanvasAssetV1|null>(null);
  const [error,setError]=useState<string|null>(null);
  const scoped = process.env.NODE_ENV !== 'production' &&
    props.animationId === ID && props.moduleKey === ID && props.audioEnabled === true &&
    props.query.frameDomain === 'sprite-42' && props.query.scenario === 'source-static-frame' &&
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


  return <div ref={source} data-p017-host-probe={ID} data-p017-host-ready={String(Boolean(asset) && scoped)}
    data-p017-host-source-sha256={SOURCE_SHA256} data-p017-host-error={!scoped ? 'scope' : error ?? 'none'}>
    {!scoped || error ? <p role="alert">{props.labels.unavailable}</p> :
        asset ? <P017PlayerV1 asset={asset} loadAudio={p017LoadMainAudio}
          language={props.uiLanguage} reducedMotion={reducedMotion} volume={props.volume ?? 1}
          onSnapshot={onSnapshot} connectControls={connectControls} onOpenGlossary={openGlossary}
          hidePlaybackControls nativeTextTarget={readableTarget} /> :
          <p role="status">{props.labels.loading}</p>}
  </div>;
}
