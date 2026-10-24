'use client';

import {useCallback,useEffect,useState} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadBoundLessonAudio,useSourceLessonHostBridge,type SourceLessonSnapshot}
 from './source-lesson-host-bridge-v1';
import {P047AudioPlayerV1,type P047AudioPlayerControlsV1}
 from '../../../packages/demos/src/alg-l06-p047-audio-player-v1';
import {P047_MEASURED_BINDINGS,type P047AudioDomain}
 from '../../../packages/demos/src/alg-l06-p047-measured-bindings-v1';
import type {P047CanvasAssetV1}
 from '../../../packages/demos/src/alg-l06-p047-canvas-commit-v1';
import type {P047RuntimeSnapshot}
 from '../../../packages/demos/src/alg-l06-p047-audio-runtime-v1';

const ID='shared-alg001-l06-p047';
const SOURCE_SHA='7fdbb16bcea020b3a28ada7d0bfbed26d077b339a914a86f493feb6827a9e893';
const CANVAS_SHA='d959f374bb092f72efb20b8a80695539c681edbcbc0ab5e55d4f79483fe7eaf7';
export const P047_GLOSSARY_ENTRY_ID={Input:'input',Output:'output',Point:'point',Function:'function',Table:'table',
 Coordinate:'coordinate','X-coordinate':'x-coordinate','Y-coordinate':'y-coordinate'} as const;
const HOST_BINDING={frameCount:890,frameDomain:'sprite-117',fps:12,
 audioAvailable:true,companionIdSuffix:'-p047-source-readable',
 glossaryEntries:P047_GLOSSARY_ENTRY_ID} as const;
type CanvasAsset=P047CanvasAssetV1&{metadata:{animationId:string;
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
  m.deterministicContentTimeline.timelineId!=='sprite-117'||
  m.deterministicContentTimeline.frameCount!==890)
  throw Error('P047_CANVAS_IDENTITY');
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
   reject(Error('P047_CANVAS_REQUEST'))};
  document.head.append(script);
 });
 return canvasLoad;
}

const audio=(id:P047AudioDomain,signal:AbortSignal)=>{
 const binding=P047_MEASURED_BINDINGS[id];
 const assetId=id==='main'?'main-source-v1':id==='sa'?
  'optional-spanish-audio-v1':`feedback-${id}-source-v1`;
 return loadBoundLessonAudio({animationId:ID,assetId,pin:binding,
  origin:window.location.origin,signal,errorPrefix:`P047_${id}`});
};

export function p047HostSnapshot(snapshot:P047RuntimeSnapshot):SourceLessonSnapshot{
 const {state,tracks}=snapshot;
 const active=[tracks.main,tracks.wrong,tracks.right].find(track=>track.phase==='playing')??tracks.main;
 const pending=[tracks.main,tracks.wrong,tracks.right].some(track=>track.phase==='start-pending');
 return {frame:state.mainFrame,phase:snapshot.visualClockRunning?'playing':pending?'start-pending':'held',
  selectedAudio:state.spanishSelected?'spanish':'main',audio:active,
  spanish:snapshot.spanishLoading||tracks.sa.phase==='start-pending'?{phase:'loading'}:tracks.sa};
}

/** Local source-pinned P047 candidate adapter in the real My Lesson host. */
export function G678AlgL6P047RuntimeV1(props:LessonRuntimeAdapterProps){
 const {source,readableTarget,onSnapshot,connectControls,openGlossary}=
  useSourceLessonHostBridge(props,HOST_BINDING);
 const [asset,setAsset]=useState<CanvasAsset|null>(null);
 const [error,setError]=useState<string|null>(null);
 const scoped=process.env.NODE_ENV!=='production'&&props.animationId===ID&&
  props.moduleKey===ID&&props.audioEnabled===true&&
  props.query.frameDomain==='sprite-117'&&
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
 const observe=useCallback((snapshot:P047RuntimeSnapshot)=>
  onSnapshot(p047HostSnapshot(snapshot)),[onSnapshot]);
 const load=useCallback((id:P047AudioDomain,signal:AbortSignal)=>audio(id,signal),[]);
 const glossary=useCallback((term:string,trigger:HTMLButtonElement)=>{
  if(Object.hasOwn(P047_GLOSSARY_ENTRY_ID,term))
   openGlossary(term as keyof typeof P047_GLOSSARY_ENTRY_ID,trigger);
 },[openGlossary]);
 const connect=useCallback((controls:P047AudioPlayerControlsV1)=>
  connectControls(controls),[connectControls]);
 return <div ref={source} data-p047-host-probe={ID}
  data-p047-host-ready={String(!!asset&&scoped)}
  data-p047-host-source-sha256={SOURCE_SHA}
  data-p047-host-canvas-sha256={CANVAS_SHA}
  data-p047-host-error={!scoped?'scope':error??'none'}>
  {!scoped||error?<p role="alert">{props.labels.unavailable}</p>:asset?
   <P047AudioPlayerV1 asset={asset} load={load} language={props.uiLanguage} volume={props.volume??1}
    onSnapshot={observe} onGlossary={glossary} connectControls={connect}
    hidePlaybackControls nativeTextTarget={readableTarget}/>:
   <p role="status">{props.labels.loading}</p>}
 </div>;
}
