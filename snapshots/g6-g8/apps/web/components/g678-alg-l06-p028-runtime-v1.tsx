'use client';

import {useEffect,useState} from 'react';
import {loadBoundLessonAudio,sourceLessonHostPlayback,useSourceLessonHostBridge}
 from './source-lesson-host-bridge-v1';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import {P028PlayerV1,type P028CanvasAssetV1,type P028PlayerSnapshotV1}
 from '../../../packages/demos/src/alg-l06-p028-visual-player-v1';
import {P028_MAIN_ASSET,P028_SA_ASSET}
 from '../../../packages/demos/src/alg-l06-p028-audio-schedule-v1';
import type {P028GlossaryKey} from '../../../packages/demos/src/alg-l06-p028-timeline-v1';
import {P028_CANDIDATE_BINDING} from '@/lib/alg-l06-p028-candidate-binding-v1';

const ID='shared-alg001-l06-p028';
const SOURCE_SHA256='12b9912231512d5622b96708b83331217691169fadf185b3b2d0a27733e3c297';
const CANVAS_SHA256='b4d784c6dd65c0a412c4a41447d4485476a8715b665b175f277a40a40ffbb2e6';
const CANVAS_URL=`/flash-assets/g678-local/${ID}/canvas-renderer.js?sha256=${CANVAS_SHA256}`;
export const P028_GLOSSARY_ENTRY_ID={
 Relation:'relation',Set:'set','Ordered pair':'ordered-pair',
} as const satisfies Record<P028GlossaryKey,string>;
const HOST_BINDING={frameCount:134,frameDomain:'sprite-30',fps:12,
 companionIdSuffix:'-p028-source-readable',glossaryEntries:P028_GLOSSARY_ENTRY_ID} as const;
let canvasLoad:Promise<P028CanvasAssetV1>|undefined;

function p028CanvasAsset():P028CanvasAssetV1|undefined{
 return window.HELP_MATH_CANVAS_ASSETS?.[ID] as P028CanvasAssetV1|undefined;
}
function exactCanvasAsset():P028CanvasAssetV1{
 const asset=p028CanvasAsset();
 if(asset?.metadata.animationId!==ID||asset.metadata.sourceSwfSha256!==SOURCE_SHA256||
  asset.metadata.deterministicContentTimeline.timelineId!=='sprite-30'||
  asset.metadata.deterministicContentTimeline.frameCount!==134||
  asset.metadata.stage.width!==800||asset.metadata.stage.height!==600||asset.metadata.fps!==12)
  throw Error('p028-canvas-identity-mismatch');
 return asset;
}
function loadCanvasAsset():Promise<P028CanvasAssetV1>{
 if(p028CanvasAsset()){
  try{return Promise.resolve(exactCanvasAsset());}
  catch(error){return Promise.reject(error);}
 }
 if(!canvasLoad)canvasLoad=new Promise<P028CanvasAssetV1>((resolve,reject)=>{
  const script=document.createElement('script');script.src=CANVAS_URL;script.async=true;
  script.onload=()=>{
   try{resolve(exactCanvasAsset());}
   catch(error){script.remove();canvasLoad=undefined;reject(error);}
  };
  script.onerror=()=>{script.remove();canvasLoad=undefined;
   reject(Error('p028-canvas-request-failed'));};
  document.head.append(script);
 });
 return canvasLoad;
}

export const p028LoadMainAudio=(signal:AbortSignal):Promise<ArrayBuffer>=>
 loadBoundLessonAudio({animationId:ID,assetId:'main-source-v1',pin:P028_MAIN_ASSET,
  signal,origin:window.location.origin,errorPrefix:'p028-main'});
export const p028LoadSpanishAudio=(signal:AbortSignal):Promise<ArrayBuffer>=>
 loadBoundLessonAudio({animationId:ID,assetId:'optional-spanish-audio-v1',pin:P028_SA_ASSET,
  signal,origin:window.location.origin,errorPrefix:'p028-spanish'});
export const p028HostPlayback=(snapshot:P028PlayerSnapshotV1):AnimationRuntimePlaybackState=>
 sourceLessonHostPlayback(snapshot,HOST_BINDING);

/** Exact local P028 adapter. Browser PCM values must come from a measured candidate binding;
 * null fields keep the host unavailable. */
export function G678AlgL6P028RuntimeV1(props:LessonRuntimeAdapterProps){
 const {source,readableTarget,reducedMotion,connectControls,onSnapshot,openGlossary}=
  useSourceLessonHostBridge(props,HOST_BINDING);
 const [asset,setAsset]=useState<P028CanvasAssetV1|null>(null);
 const [error,setError]=useState<string|null>(null);
 const audioBinding=P028_CANDIDATE_BINDING.browserMain;
 const spanishBinding=P028_CANDIDATE_BINDING.browserSpanish;
 const scoped=process.env.NODE_ENV!=='production'&&
  props.animationId===ID&&props.moduleKey===ID&&props.audioEnabled===true&&
  props.query.frameDomain==='sprite-30'&&props.query.scenario==='source-static-frame'&&
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
 return <div ref={source} data-p028-host-probe={ID}
  data-p028-host-ready={String(Boolean(asset)&&scoped)}
  data-p028-host-source-sha256={SOURCE_SHA256}
  data-p028-host-error={!scoped?'scope-or-browser-binding':error??'none'}>
  {!scoped||error?<p role="alert">{props.labels.unavailable}</p>:
   asset&&audioBinding&&spanishBinding?
    <P028PlayerV1 asset={asset} audioBinding={audioBinding}
     spanishBinding={spanishBinding} loadAudio={p028LoadMainAudio}
     loadSpanishAudio={p028LoadSpanishAudio} language={props.uiLanguage}
     reducedMotion={reducedMotion} volume={props.volume??1}
     onSnapshot={onSnapshot}
     connectControls={connectControls} onOpenGlossary={openGlossary}
     hidePlaybackControls nativeTextTarget={readableTarget}/>:
    <p role="status">{props.labels.loading}</p>}
 </div>;
}
