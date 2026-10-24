'use client';

import {useEffect,useState} from 'react';
import {loadBoundLessonAudio,sourceLessonHostPlayback,useSourceLessonHostBridge}
 from './source-lesson-host-bridge-v1';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import {P032PlayerV1,type P032CanvasAssetV1,type P032PlayerSnapshotV1}
 from '../../../packages/demos/src/alg-l06-p032-visual-player-v1';
import {P032_MAIN_ASSET,P032_SA_ASSET}
 from '../../../packages/demos/src/alg-l06-p032-audio-schedule-v1';
import type {P032GlossaryKey} from '../../../packages/demos/src/alg-l06-p032-timeline-v1';
import {P032_CANDIDATE_BINDING} from '@/lib/alg-l06-p032-candidate-binding-v1';

const ID='shared-alg001-l06-p032';
const SOURCE_SHA256='e425600d0b6cfab41ae50f7512cb8e6c4e3c6ee04bbfa10c29b437459876d836';
const CANVAS_SHA256='646ef50a5e3dc054bca4a323f6da775b82b22e769f33221fdaa155f51e0e2eaf';
const CANVAS_URL=`/flash-assets/g678-local/${ID}/canvas-renderer.js?sha256=${CANVAS_SHA256}`;
export const P032_GLOSSARY_ENTRY_ID={
 Set:'set','Ordered pair':'ordered-pair',Function:'function','X-coordinate':'x-coordinate',
} as const satisfies Record<P032GlossaryKey,string>;
const HOST_BINDING={frameCount:413,frameDomain:'sprite-22',fps:12,
 companionIdSuffix:'-p032-source-readable',glossaryEntries:P032_GLOSSARY_ENTRY_ID} as const;
let canvasLoad:Promise<P032CanvasAssetV1>|undefined;

function p032CanvasAsset():P032CanvasAssetV1|undefined{
 return window.HELP_MATH_CANVAS_ASSETS?.[ID] as P032CanvasAssetV1|undefined;
}
function exactCanvasAsset():P032CanvasAssetV1{
 const asset=p032CanvasAsset();
 if(asset?.metadata.animationId!==ID||asset.metadata.sourceSwfSha256!==SOURCE_SHA256||
  asset.metadata.deterministicContentTimeline.timelineId!=='sprite-22'||
  asset.metadata.deterministicContentTimeline.frameCount!==413||
  asset.metadata.stage.width!==800||asset.metadata.stage.height!==600||asset.metadata.fps!==12)
  throw Error('p032-canvas-identity-mismatch');
 return asset;
}
function loadCanvasAsset():Promise<P032CanvasAssetV1>{
 if(p032CanvasAsset()){
  try{return Promise.resolve(exactCanvasAsset());}
  catch(error){return Promise.reject(error);}
 }
 if(!canvasLoad)canvasLoad=new Promise<P032CanvasAssetV1>((resolve,reject)=>{
  const script=document.createElement('script');script.src=CANVAS_URL;script.async=true;
  script.onload=()=>{
   try{resolve(exactCanvasAsset());}
   catch(error){script.remove();canvasLoad=undefined;reject(error);}
  };
  script.onerror=()=>{script.remove();canvasLoad=undefined;
   reject(Error('p032-canvas-request-failed'));};
  document.head.append(script);
 });
 return canvasLoad;
}

export const p032LoadMainAudio=(signal:AbortSignal):Promise<ArrayBuffer>=>
 loadBoundLessonAudio({animationId:ID,assetId:'main-source-v1',pin:P032_MAIN_ASSET,
  signal,origin:window.location.origin,errorPrefix:'p032-main'});
export const p032LoadSpanishAudio=(signal:AbortSignal):Promise<ArrayBuffer>=>
 loadBoundLessonAudio({animationId:ID,assetId:'optional-spanish-audio-v1',pin:P032_SA_ASSET,
  signal,origin:window.location.origin,errorPrefix:'p032-spanish'});
export const p032HostPlayback=(snapshot:P032PlayerSnapshotV1):AnimationRuntimePlaybackState=>
 sourceLessonHostPlayback(snapshot,HOST_BINDING);

/** Exact local P032 adapter. Browser PCM values must come from a measured candidate binding;
 * null fields keep the host unavailable. */
export function G678AlgL6P032RuntimeV1(props:LessonRuntimeAdapterProps){
 const {source,readableTarget,reducedMotion,connectControls,onSnapshot,openGlossary}=
  useSourceLessonHostBridge(props,HOST_BINDING);
 const [asset,setAsset]=useState<P032CanvasAssetV1|null>(null);
 const [error,setError]=useState<string|null>(null);
 const audioBinding=P032_CANDIDATE_BINDING.browserMain;
 const spanishBinding=P032_CANDIDATE_BINDING.browserSpanish;
 const scoped=process.env.NODE_ENV!=='production'&&
  props.animationId===ID&&props.moduleKey===ID&&props.audioEnabled===true&&
  props.query.frameDomain==='sprite-22'&&props.query.scenario==='source-static-frame'&&
  props.query.lang==='en'&&String(props.query.seed)==='0'&&
  props.query.capture!=='1'&&['en','es'].includes(props.uiLanguage??'')&&
  !!audioBinding&&!!spanishBinding;
 useEffect(()=>{
  if(!scoped)return;
  let active=true;
  void loadCanvasAsset().then(value=>{if(active)setAsset(value);},cause=>{
   if(active)setError(cause instanceof Error?cause.message:String(cause));
  });
  return()=>{active=false;};
 },[scoped]);
 return <div ref={source} data-p032-host-probe={ID}
  data-p032-host-ready={String(Boolean(asset)&&scoped)}
  data-p032-host-source-sha256={SOURCE_SHA256}
  data-p032-host-error={!scoped?'scope-or-browser-binding':error??'none'}>
  {!scoped||error?<p role="alert">{props.labels.unavailable}</p>:
   asset&&audioBinding&&spanishBinding?
    <P032PlayerV1 asset={asset} audioBinding={audioBinding}
     spanishBinding={spanishBinding} loadAudio={p032LoadMainAudio}
     loadSpanishAudio={p032LoadSpanishAudio} language={props.uiLanguage}
     reducedMotion={reducedMotion} volume={props.volume??1}
     onSnapshot={onSnapshot}
     connectControls={connectControls} onOpenGlossary={openGlossary}
     hidePlaybackControls nativeTextTarget={readableTarget}/>:
    <p role="status">{props.labels.loading}</p>}
 </div>;
}
