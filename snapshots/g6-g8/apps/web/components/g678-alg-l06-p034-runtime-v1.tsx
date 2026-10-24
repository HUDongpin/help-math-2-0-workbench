'use client';

import {useEffect,useState} from 'react';
import {loadBoundLessonAudio,sourceLessonHostPlayback,useSourceLessonHostBridge}
 from './source-lesson-host-bridge-v1';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import {P034PlayerV1,type P034PlayerSnapshotV1}
 from '../../../packages/demos/src/alg-l06-p034-player-v1';
import type {P034CanvasAssetV1} from '../../../packages/demos/src/alg-l06-p034-visual-player-v1';
import type {P034GlossaryKey} from '../../../packages/demos/src/alg-l06-p034-glossary-v1';
import {P034_CANDIDATE_BINDING} from '@/lib/alg-l06-p034-candidate-binding-v1';

const ID='shared-alg001-l06-p034';
const SOURCE_SHA256='32ddbfde743b785610360f38b7030ab2dbd289438f6c4433e6699ce3004a629a';
const CANVAS_SHA256='8e424c04ecdde8168145b3aed03b02bcc2c38db95b776295fd7298fc04fedc87';
const CANVAS_URL=`/flash-assets/g678-local/${ID}/canvas-renderer.js?sha256=${CANVAS_SHA256}`;
export const P034_GLOSSARY_ENTRY_ID={
 'Vertical-line test':'vertical-line-test',Graph:'graph',Function:'function',Vertical:'vertical',Line:'line',
} as const satisfies Record<P034GlossaryKey,string>;
const HOST_BINDING={frameCount:434,frameDomain:'sprite-40',fps:12,
 companionIdSuffix:'-p034-source-readable',glossaryEntries:P034_GLOSSARY_ENTRY_ID} as const;
let canvasLoad:Promise<P034CanvasAssetV1>|undefined;

function p034CanvasAsset():P034CanvasAssetV1|undefined{
 return window.HELP_MATH_CANVAS_ASSETS?.[ID] as P034CanvasAssetV1|undefined;
}
function exactCanvasAsset():P034CanvasAssetV1{
 const asset=p034CanvasAsset();
 if(asset?.metadata.animationId!==ID||asset.metadata.sourceSwfSha256!==SOURCE_SHA256||
  asset.metadata.deterministicContentTimeline.timelineId!=='sprite-40'||
  asset.metadata.deterministicContentTimeline.frameCount!==434||
  asset.metadata.sourceRootTimeline.frameCount!==13||asset.metadata.sourceRootTimeline.beginFrame!==6||
  asset.metadata.stage.width!==800||asset.metadata.stage.height!==600||asset.metadata.fps!==12)
  throw Error('p034-canvas-identity-mismatch');
 return asset;
}
function loadCanvasAsset():Promise<P034CanvasAssetV1>{
 if(p034CanvasAsset()){
  try{return Promise.resolve(exactCanvasAsset());}
  catch(error){return Promise.reject(error);}
 }
 if(!canvasLoad)canvasLoad=new Promise<P034CanvasAssetV1>((resolve,reject)=>{
  const script=document.createElement('script');script.src=CANVAS_URL;script.async=true;
  script.onload=()=>{
   try{resolve(exactCanvasAsset());}
   catch(error){script.remove();canvasLoad=undefined;reject(error);}
  };
  script.onerror=()=>{script.remove();canvasLoad=undefined;
   reject(Error('p034-canvas-request-failed'));};
  document.head.append(script);
 });
 return canvasLoad;
}

export const p034LoadMainAudio=(signal:AbortSignal):Promise<ArrayBuffer>=>
 loadBoundLessonAudio({animationId:ID,assetId:'main-source-v1',pin:P034_CANDIDATE_BINDING.browserMain,
  signal,origin:window.location.origin,errorPrefix:'p034-main'});
export const p034LoadSpanishAudio=(signal:AbortSignal):Promise<ArrayBuffer>=>
 loadBoundLessonAudio({animationId:ID,assetId:'optional-spanish-audio-v1',pin:P034_CANDIDATE_BINDING.browserSpanish,
  signal,origin:window.location.origin,errorPrefix:'p034-spanish'});
export const p034HostPlayback=(snapshot:P034PlayerSnapshotV1):AnimationRuntimePlaybackState=>
 sourceLessonHostPlayback(snapshot,HOST_BINDING);

/** Exact local P034 adapter. Browser PCM values must come from a measured candidate binding;
 * the exact packet binds source and host files separately. */
export function G678AlgL6P034RuntimeV1(props:LessonRuntimeAdapterProps){
 const {source,readableTarget,reducedMotion,connectControls,onSnapshot,openGlossary}=
  useSourceLessonHostBridge(props,HOST_BINDING);
 const [asset,setAsset]=useState<P034CanvasAssetV1|null>(null);
 const [error,setError]=useState<string|null>(null);
 const audioBinding=P034_CANDIDATE_BINDING.browserMain;
 const spanishBinding=P034_CANDIDATE_BINDING.browserSpanish;
 const scoped=process.env.NODE_ENV!=='production'&&
  props.animationId===ID&&props.moduleKey===ID&&props.audioEnabled===true&&
  props.query.frameDomain==='sprite-40'&&props.query.scenario==='source-static-frame'&&
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
 return <div ref={source} data-p034-host-probe={ID}
  data-p034-host-ready={String(Boolean(asset)&&scoped)}
  data-p034-host-source-sha256={SOURCE_SHA256}
  data-p034-host-error={!scoped?'scope-or-browser-binding':error??'none'}>
  {!scoped||error?<p role="alert">{props.labels.unavailable}</p>:
   asset&&audioBinding&&spanishBinding?
    <P034PlayerV1 asset={asset} audioBinding={audioBinding}
     spanishBinding={spanishBinding} loadAudio={p034LoadMainAudio}
     loadSpanishAudio={p034LoadSpanishAudio} language={props.uiLanguage}
     reducedMotion={reducedMotion} volume={props.volume??1}
     onSnapshot={onSnapshot}
     connectControls={connectControls} onOpenGlossary={openGlossary}
     hidePlaybackControls nativeTextTarget={readableTarget}/>:
    <p role="status">{props.labels.loading}</p>}
 </div>;
}
