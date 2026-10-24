'use client';

import {useCallback,useEffect,useState} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadBoundLessonAudio,useSourceLessonHostBridge,type SourceLessonSnapshot}
 from './source-lesson-host-bridge-v1';
import {P048AudioPlayerV1,type P048PlayerControls}
 from '../../../packages/demos/src/alg-l06-p048-audio-player-v1';
import {P048_MEASURED_BINDINGS,type P048AudioDomain}
 from '../../../packages/demos/src/alg-l06-p048-measured-bindings-v1';
import type {P048CanvasAssetV1}
 from '../../../packages/demos/src/alg-l06-p048-canvas-commit-v1';
import type {P048RuntimeSnapshot}
 from '../../../packages/demos/src/alg-l06-p048-audio-runtime-v1';

const ID='shared-alg001-l06-p048';
const SOURCE_SHA='03a8334e6349a9e80b47bdea4d2c5ada40f635570be5d63f70e8706a03761780';
const CANVAS_SHA='a27fa6d830bab0f90c653e62f89e069c2301b570a7e34e309592bbf552e0733f';
export const P048_GLOSSARY_ENTRY_ID={Efficiency:'efficiency',Graph:'graph',Function:'function',Time:'time'} as const;
const HOST_BINDING={frameCount:327,frameDomain:'sprite-348',fps:12,
 audioAvailable:true,companionIdSuffix:'-p048-source-readable',
 glossaryEntries:P048_GLOSSARY_ENTRY_ID} as const;
type CanvasAsset=P048CanvasAssetV1&{metadata:{animationId:string;
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
  m.deterministicContentTimeline.timelineId!=='sprite-348'||
  m.deterministicContentTimeline.frameCount!==327)
  throw Error('P048_CANVAS_IDENTITY');
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
   reject(Error('P048_CANVAS_REQUEST'))};
  document.head.append(script);
 });
 return canvasLoad;
}

const audio=(id:P048AudioDomain,signal:AbortSignal)=>{
 const binding=P048_MEASURED_BINDINGS[id];
 const assetId=id==='main'?'main-source-v1':id==='sa'?
  'optional-spanish-audio-v1':`feedback-${id}-source-v1`;
 return loadBoundLessonAudio({animationId:ID,assetId,pin:binding,
  origin:window.location.origin,signal,errorPrefix:`P048_${id}`});
};

export function p048HostSnapshot(snapshot:P048RuntimeSnapshot):SourceLessonSnapshot{
 const {state,audio}=snapshot;
 const active=audio.selected??{phase:'idle'};
 return {frame:state.mainFrame,phase:snapshot.visualClockRunning?'playing':active.phase==='start-pending'?'start-pending':'held',
  selectedAudio:snapshot.spanishSelected?'spanish':'main',audio:active,
  spanish:snapshot.spanishLoading||audio.spanish?.phase==='start-pending'?{phase:'loading'}:audio.spanish??{phase:'idle'}};
}

/** Local source-pinned P048 candidate adapter in the real My Lesson host. */
export function G678AlgL6P048RuntimeV1(props:LessonRuntimeAdapterProps){
 const {source,readableTarget,onSnapshot,connectControls,openGlossary}=
  useSourceLessonHostBridge(props,HOST_BINDING);
 const [asset,setAsset]=useState<CanvasAsset|null>(null);
 const [error,setError]=useState<string|null>(null);
 const scoped=process.env.NODE_ENV!=='production'&&props.animationId===ID&&
  props.moduleKey===ID&&props.audioEnabled===true&&
  props.query.frameDomain==='sprite-348'&&
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
 const observe=useCallback((snapshot:P048RuntimeSnapshot)=>
  onSnapshot(p048HostSnapshot(snapshot)),[onSnapshot]);
 const load=useCallback((id:P048AudioDomain,signal:AbortSignal)=>audio(id,signal),[]);
 const glossary=useCallback((term:string,trigger:HTMLButtonElement)=>{
  if(Object.hasOwn(P048_GLOSSARY_ENTRY_ID,term))
   openGlossary(term as keyof typeof P048_GLOSSARY_ENTRY_ID,trigger);
 },[openGlossary]);
 const connect=useCallback((controls:P048PlayerControls)=>
  connectControls(controls),[connectControls]);
 return <div ref={source} data-p048-host-probe={ID}
  data-p048-host-ready={String(!!asset&&scoped)}
  data-p048-host-source-sha256={SOURCE_SHA}
  data-p048-host-canvas-sha256={CANVAS_SHA}
  data-p048-host-error={!scoped?'scope':error??'none'}>
  {!scoped||error?<p role="alert">{props.labels.unavailable}</p>:asset?
   <P048AudioPlayerV1 asset={asset} load={load} language={props.uiLanguage} volume={props.volume??1}
    onSnapshot={observe} onGlossary={glossary} connectControls={connect}
    hidePlaybackControls nativeTextTarget={readableTarget}/>:
   <p role="status">{props.labels.loading}</p>}
 </div>;
}
