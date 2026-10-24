'use client';

import {useCallback,useEffect,useState} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadBoundLessonAudio,useSourceLessonHostBridge,type SourceLessonSnapshot}
 from './source-lesson-host-bridge-v1';
import {P049AudioPlayerV1,type P049PlayerControls}
 from '../../../packages/demos/src/alg-l06-p049-audio-player-v1';
import {P049_MEASURED_BINDINGS,type P049AudioDomain}
 from '../../../packages/demos/src/alg-l06-p049-measured-bindings-v1';
import type {P049CanvasAssetV1}
 from '../../../packages/demos/src/alg-l06-p049-canvas-commit-v1';
import type {P049RuntimeSnapshot}
 from '../../../packages/demos/src/alg-l06-p049-audio-runtime-v1';

const ID='shared-alg001-l06-p049';
const SOURCE_SHA='33f90f5897fa60939fb7015f60c8789d98aad3dca65ad39cb04dac4fededb3a6';
const CANVAS_SHA='298611af1cccf27353df77f9b4d7b4fdbebe7992e1d0950c974dba83a85fc3d3';
export const P049_GLOSSARY_ENTRY_ID={'Function table':'function-table',Data:'data',Function:'function',Convert:'convert'} as const;
const HOST_BINDING={frameCount:401,frameDomain:'sprite-327',fps:12,
 audioAvailable:true,companionIdSuffix:'-p049-source-readable',
 glossaryEntries:P049_GLOSSARY_ENTRY_ID} as const;
type CanvasAsset=P049CanvasAssetV1&{metadata:{animationId:string;
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
  m.deterministicContentTimeline.timelineId!=='sprite-327'||
  m.deterministicContentTimeline.frameCount!==401)
  throw Error('P049_CANVAS_IDENTITY');
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
   reject(Error('P049_CANVAS_REQUEST'))};
  document.head.append(script);
 });
 return canvasLoad;
}

const audio=(id:P049AudioDomain,signal:AbortSignal)=>{
 const binding=P049_MEASURED_BINDINGS[id];
 const assetId=id==='main'?'main-source-v1':id==='sa'?
  'optional-spanish-audio-v1':`feedback-${id}-source-v1`;
 return loadBoundLessonAudio({animationId:ID,assetId,pin:binding,
  origin:window.location.origin,signal,contentType:id==='right4'?'audio/wav':'audio/mpeg',errorPrefix:`P049_${id}`});
};

export function p049HostSnapshot(snapshot:P049RuntimeSnapshot):SourceLessonSnapshot{
 const {state,audio}=snapshot;
 const active=audio.selected??{phase:'idle'};
 return {frame:state.mainFrame,phase:snapshot.visualClockRunning?'playing':active.phase==='start-pending'?'start-pending':'held',
  selectedAudio:snapshot.spanishSelected?'spanish':'main',audio:active,
  spanish:snapshot.spanishLoading||audio.spanish?.phase==='start-pending'?{phase:'loading'}:audio.spanish??{phase:'idle'}};
}

/** Local source-pinned P049 candidate adapter in the real My Lesson host. */
export function G678AlgL6P049RuntimeV1(props:LessonRuntimeAdapterProps){
 const {source,readableTarget,onSnapshot,connectControls,openGlossary}=
  useSourceLessonHostBridge(props,HOST_BINDING);
 const [asset,setAsset]=useState<CanvasAsset|null>(null);
 const [error,setError]=useState<string|null>(null);
 const scoped=process.env.NODE_ENV!=='production'&&props.animationId===ID&&
  props.moduleKey===ID&&props.audioEnabled===true&&
  props.query.frameDomain==='sprite-327'&&
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
 const observe=useCallback((snapshot:P049RuntimeSnapshot)=>
  onSnapshot(p049HostSnapshot(snapshot)),[onSnapshot]);
 const load=useCallback((id:P049AudioDomain,signal:AbortSignal)=>audio(id,signal),[]);
 const glossary=useCallback((term:string,trigger:HTMLButtonElement)=>{
  if(Object.hasOwn(P049_GLOSSARY_ENTRY_ID,term))
   openGlossary(term as keyof typeof P049_GLOSSARY_ENTRY_ID,trigger);
 },[openGlossary]);
 const connect=useCallback((controls:P049PlayerControls)=>
  connectControls(controls),[connectControls]);
 return <div ref={source} data-p049-host-probe={ID}
  data-p049-host-ready={String(!!asset&&scoped)}
  data-p049-host-source-sha256={SOURCE_SHA}
  data-p049-host-canvas-sha256={CANVAS_SHA}
  data-p049-host-error={!scoped?'scope':error??'none'}>
  {!scoped||error?<p role="alert">{props.labels.unavailable}</p>:asset?
   <P049AudioPlayerV1 asset={asset} load={load} language={props.uiLanguage} volume={props.volume??1}
    onSnapshot={observe} onGlossary={glossary} connectControls={connect}
    hidePlaybackControls nativeTextTarget={readableTarget}/>:
   <p role="status">{props.labels.loading}</p>}
 </div>;
}
