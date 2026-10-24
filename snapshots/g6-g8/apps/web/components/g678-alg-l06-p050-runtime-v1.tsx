'use client';

import {useCallback,useEffect,useState} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadBoundLessonAudio,useSourceLessonHostBridge,type SourceLessonSnapshot}
 from './source-lesson-host-bridge-v1';
import {P050AudioPlayerV1,type P050PlayerControls}
 from '../../../packages/demos/src/alg-l06-p050-audio-player-v1';
import {P050_MEASURED_BINDINGS,type P050AudioDomain}
 from '../../../packages/demos/src/alg-l06-p050-measured-bindings-v1';
import type {P050CanvasAssetV1}
 from '../../../packages/demos/src/alg-l06-p050-canvas-commit-v1';
import type {P050RuntimeSnapshot}
 from '../../../packages/demos/src/alg-l06-p050-audio-runtime-v1';

const ID='shared-alg001-l06-p050';
const SOURCE_SHA='4353f9cbd7e60043baa8f59c7f5193fcd930778ace4b918ab56f2953f306937e';
const CANVAS_SHA='d384ef32b39c8bd1e013c667653bcb5a643cbe703be6c145b87ce87a752347ff';
const HOST_BINDING={frameCount:674,frameDomain:'sprite-489',fps:12,
 audioAvailable:true,companionIdSuffix:'-p050-source-readable',
 glossaryEntries:{}} as const;
type CanvasAsset=P050CanvasAssetV1&{metadata:{animationId:string;
 sourceSwfSha256:string;fps:number;stage:{width:number;height:number};
 sourceRootTimeline:{frameCount:number;beginFrame:number};
 deterministicContentTimeline:{timelineId:string;frameCount:number};
 classification:string;audioRendering:string}};

let canvasLoad:Promise<CanvasAsset>|undefined;
const loaded=()=>window.HELP_MATH_CANVAS_ASSETS?.[ID] as unknown as CanvasAsset|undefined;
function exactCanvas():CanvasAsset{
 const asset=loaded(),m=asset?.metadata;
 if(!asset||m?.animationId!==ID||m.sourceSwfSha256!==SOURCE_SHA||
  m.classification!=='behavior-heavy-unregistered-source-canvas-draft-v1'||
  m.audioRendering!=='not-included'||m.fps!==12||
  m.stage.width!==800||m.stage.height!==600||
  m.sourceRootTimeline.frameCount!==10||m.sourceRootTimeline.beginFrame!==6||
  m.deterministicContentTimeline.timelineId!=='sprite-489'||
  m.deterministicContentTimeline.frameCount!==674)
  throw Error('P050_CANVAS_IDENTITY');
 return asset;
}
function loadCanvas():Promise<CanvasAsset>{
 if(loaded()){
  try{return Promise.resolve(exactCanvas())}catch(error){return Promise.reject(error)}
 }
 if(!canvasLoad)canvasLoad=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=`/flash-assets/g678-local/${ID}/canvas-renderer.js?sha256=${CANVAS_SHA}`;
  script.async=true;
  script.onload=()=>{try{resolve(exactCanvas())}catch(error){
   script.remove();canvasLoad=undefined;reject(error)}};
  script.onerror=()=>{script.remove();canvasLoad=undefined;
   reject(Error('P050_CANVAS_REQUEST'))};
  document.head.append(script);
 });
 return canvasLoad;
}

const audio=(id:P050AudioDomain,signal:AbortSignal)=>{
 const binding=P050_MEASURED_BINDINGS[id];
 const assetId=id==='main'?'main-source-v1':id==='sa'?
  'optional-spanish-audio-v1':`feedback-${id}-source-v1`;
 return loadBoundLessonAudio({animationId:ID,assetId,pin:binding,
  origin:window.location.origin,signal,contentType:id==='correct432'?'audio/wav':'audio/mpeg',errorPrefix:`P050_${id}`});
};

export function p050HostSnapshot(snapshot:P050RuntimeSnapshot):SourceLessonSnapshot{
 const {state,audio}=snapshot;
 const active=audio.selected??{phase:'idle'};
 return {frame:state.mainFrame,phase:snapshot.visualClockRunning?'playing':active.phase==='start-pending'?'start-pending':'held',
  selectedAudio:snapshot.spanishSelected?'spanish':'main',audio:active,
  spanish:snapshot.spanishLoading||audio.streams.sa?.phase==='start-pending'?{phase:'loading'}:audio.streams.sa??{phase:'idle'}};
}

/** Local source-pinned P050 candidate adapter in the real My Lesson host. */
export function G678AlgL6P050RuntimeV1(props:LessonRuntimeAdapterProps){
 const {source,readableTarget,onSnapshot,connectControls}=
  useSourceLessonHostBridge(props,HOST_BINDING);
 const [asset,setAsset]=useState<CanvasAsset|null>(null);
 const [error,setError]=useState<string|null>(null);
 const scoped=process.env.NODE_ENV!=='production'&&props.animationId===ID&&
  props.moduleKey===ID&&props.audioEnabled===true&&
  props.query.frameDomain==='sprite-489'&&
  props.query.scenario==='source-explicit-frames'&&props.query.lang==='en'&&
  String(props.query.seed)==='0'&&props.query.capture!=='1'&&
  ['en','es'].includes(props.uiLanguage??'');
 useEffect(()=>{
  if(!scoped)return;
  let live=true;
  void loadCanvas().then(value=>{if(live)setAsset(value)},cause=>{
   if(live)setError(String(cause))});
  return()=>{live=false};
 },[scoped]);
 const observe=useCallback((snapshot:P050RuntimeSnapshot)=>
  onSnapshot(p050HostSnapshot(snapshot)),[onSnapshot]);
 const load=useCallback((id:P050AudioDomain,signal:AbortSignal)=>audio(id,signal),[]);
 const connect=useCallback((controls:P050PlayerControls)=>
  connectControls({...controls,closeGlossary:()=>controls.setPaused(true)}),[connectControls]);
 return <div ref={source} data-p050-host-probe={ID}
  data-p050-host-ready={String(!!asset&&scoped)}
  data-p050-host-source-sha256={SOURCE_SHA}
  data-p050-host-canvas-sha256={CANVAS_SHA}
  data-p050-host-error={!scoped?'scope':error??'none'}>
  {!scoped||error?<p role="alert">{props.labels.unavailable}</p>:asset?
   <P050AudioPlayerV1 asset={asset} load={load} language={props.uiLanguage} volume={props.volume??1}
    onSnapshot={observe} connectControls={connect}
    hidePlaybackControls nativeTextTarget={readableTarget}/>:
   <p role="status">{props.labels.loading}</p>}
 </div>;
}
