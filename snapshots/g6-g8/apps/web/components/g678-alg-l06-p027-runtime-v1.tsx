'use client';

import {useEffect,useState} from 'react';
import {loadBoundLessonAudio,sourceLessonHostPlayback,useSourceLessonHostBridge}
 from './source-lesson-host-bridge-v1';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import {P027PlayerV1,type P027CanvasAssetV1,type P027PlayerSnapshotV1}
 from '../../../packages/demos/src/alg-l06-p027-player-v1';
import {P027_MAIN_ASSET,P027_SA_ASSET}
 from '../../../packages/demos/src/alg-l06-p027-audio-schedule-v1';
import type {P027GlossaryKey} from '../../../packages/demos/src/alg-l06-p027-timeline-v1';
import {P027_CANDIDATE_BINDING} from '@/lib/alg-l06-p027-candidate-binding-v1';

const ID='shared-alg001-l06-p027';
const SOURCE_SHA256='689318e75aac8740344e8ff119df34a288e7da24dc3dc0c62c0f22601666f984';
const CANVAS_SHA256='15aa87b51cf12834708b46290e95efa2a7f55e08f48d1d90010dcb32045fcb90';
const CANVAS_URL=`/flash-assets/g678-local/${ID}/canvas-renderer.js?sha256=${CANVAS_SHA256}`;
export const P027_GLOSSARY_ENTRY_ID={
 'Vertical-line test':'vertical-line-test',Function:'function',Graph:'graph',
 Vertical:'vertical',Line:'line',Point:'point',
} as const satisfies Record<P027GlossaryKey,string>;
const HOST_BINDING={frameCount:770,frameDomain:'sprite-46',fps:12,
 companionIdSuffix:'-p027-source-readable',glossaryEntries:P027_GLOSSARY_ENTRY_ID} as const;
let canvasLoad:Promise<P027CanvasAssetV1>|undefined;

function p027CanvasAsset():P027CanvasAssetV1|undefined{
 return window.HELP_MATH_CANVAS_ASSETS?.[ID] as P027CanvasAssetV1|undefined;
}
function exactCanvasAsset():P027CanvasAssetV1{
 const asset=p027CanvasAsset();
 if(asset?.metadata.animationId!==ID||asset.metadata.sourceSwfSha256!==SOURCE_SHA256||
  asset.metadata.deterministicContentTimeline.timelineId!=='sprite-46'||
  asset.metadata.deterministicContentTimeline.frameCount!==770||
  asset.metadata.stage.width!==800||asset.metadata.stage.height!==600||asset.metadata.fps!==12)
  throw Error('p027-canvas-identity-mismatch');
 return asset;
}
function loadCanvasAsset():Promise<P027CanvasAssetV1>{
 if(p027CanvasAsset()){
  try{return Promise.resolve(exactCanvasAsset());}
  catch(error){return Promise.reject(error);}
 }
 if(!canvasLoad)canvasLoad=new Promise<P027CanvasAssetV1>((resolve,reject)=>{
  const script=document.createElement('script');script.src=CANVAS_URL;script.async=true;
  script.onload=()=>{
   try{resolve(exactCanvasAsset());}
   catch(error){script.remove();canvasLoad=undefined;reject(error);}
  };
  script.onerror=()=>{script.remove();canvasLoad=undefined;
   reject(Error('p027-canvas-request-failed'));};
  document.head.append(script);
 });
 return canvasLoad;
}

export const p027LoadMainAudio=(signal:AbortSignal):Promise<ArrayBuffer>=>
 loadBoundLessonAudio({animationId:ID,assetId:'main-source-v1',pin:P027_MAIN_ASSET,
  signal,origin:window.location.origin,errorPrefix:'p027-main'});
export const p027LoadSpanishAudio=(signal:AbortSignal):Promise<ArrayBuffer>=>
 loadBoundLessonAudio({animationId:ID,assetId:'optional-spanish-audio-v1',pin:P027_SA_ASSET,
  signal,origin:window.location.origin,errorPrefix:'p027-spanish'});
export const p027HostPlayback=(snapshot:P027PlayerSnapshotV1):AnimationRuntimePlaybackState=>
 sourceLessonHostPlayback(snapshot,HOST_BINDING);

/** Exact local P027 adapter. Browser PCM values must come from the frozen
 * candidate binding; an FFmpeg candidate cannot unlock playback. */
export function G678AlgL6P027RuntimeV1(props:LessonRuntimeAdapterProps){
 const {source,readableTarget,reducedMotion,connectControls,onSnapshot,openGlossary}=
  useSourceLessonHostBridge(props,HOST_BINDING);
 const [asset,setAsset]=useState<P027CanvasAssetV1|null>(null);
 const [error,setError]=useState<string|null>(null);
 const audioBinding=P027_CANDIDATE_BINDING.browserMain;
 const spanishBinding=P027_CANDIDATE_BINDING.browserSpanish;
 const scoped=process.env.NODE_ENV!=='production'&&
  props.animationId===ID&&props.moduleKey===ID&&props.audioEnabled===true&&
  props.query.frameDomain==='sprite-46'&&props.query.scenario==='source-static-frame'&&
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
 return <div ref={source} data-p027-host-probe={ID}
  data-p027-host-ready={String(Boolean(asset)&&scoped)}
  data-p027-host-source-sha256={SOURCE_SHA256}
  data-p027-host-error={!scoped?'scope-or-browser-binding':error??'none'}>
  {!scoped||error?<p role="alert">{props.labels.unavailable}</p>:
   asset&&audioBinding&&spanishBinding?
    <P027PlayerV1 asset={asset} audioBinding={audioBinding}
     spanishBinding={spanishBinding} loadAudio={p027LoadMainAudio}
     loadSpanishAudio={p027LoadSpanishAudio} language={props.uiLanguage}
     reducedMotion={reducedMotion} volume={props.volume??1}
     onSnapshot={snapshot=>onSnapshot({...snapshot,returning:snapshot.transitioning})}
     connectControls={connectControls} onOpenGlossary={openGlossary}
     hidePlaybackControls nativeTextTarget={readableTarget}/>:
    <p role="status">{props.labels.loading}</p>}
 </div>;
}
