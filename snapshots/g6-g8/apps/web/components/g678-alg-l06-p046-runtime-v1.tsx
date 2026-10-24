'use client';

import {useCallback,useEffect,useState} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadBoundLessonAudio,useSourceLessonHostBridge,type SourceLessonSnapshot}
 from './source-lesson-host-bridge-v1';
import {P046AudioPlayerV1,type P046AudioPlayerControlsV1}
 from '../../../packages/demos/src/alg-l06-p046-audio-player-v1';
import {P046_MEASURED_BINDINGS,type P046AudioDomain}
 from '../../../packages/demos/src/alg-l06-p046-measured-bindings-v1';
import type {P046CanvasAssetV1}
 from '../../../packages/demos/src/alg-l06-p046-canvas-commit-v1';
import type {P046RuntimeSnapshot}
 from '../../../packages/demos/src/alg-l06-p046-audio-runtime-v1';

const ID='shared-alg001-l06-p046';
const SOURCE_SHA='c69f1f0fdaff0201af171aaee6b9b90a33b483e8c93ffef406c31cf0853a54b8';
const CANVAS_SHA='888a3e9f41e236eda7b4d0fe9c04a0aaa38d9e12bdbdbe844cc6d1e12a5272d6';
export const P046_GLOSSARY_ENTRY_ID={Input:'input',Output:'output',Function:'function',Table:'table',
 Variable:'variable',Value:'value',Solve:'solve',Substitute:'substitute',Equation:'equation'} as const;
const HOST_BINDING={frameCount:743,frameDomain:'sprite-123',fps:12,
 audioAvailable:true,companionIdSuffix:'-p046-source-readable',
 glossaryEntries:P046_GLOSSARY_ENTRY_ID} as const;
type CanvasAsset=P046CanvasAssetV1&{metadata:{animationId:string;
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
  m.deterministicContentTimeline.timelineId!=='sprite-123'||
  m.deterministicContentTimeline.frameCount!==743)
  throw Error('P046_CANVAS_IDENTITY');
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
   reject(Error('P046_CANVAS_REQUEST'))};
  document.head.append(script);
 });
 return canvasLoad;
}

const audio=(id:P046AudioDomain,signal:AbortSignal)=>{
 const binding=P046_MEASURED_BINDINGS[id];
 const assetId=id==='main'?'main-source-v1':id==='sa'?
  'optional-spanish-audio-v1':`feedback-${id}-source-v1`;
 return loadBoundLessonAudio({animationId:ID,assetId,pin:binding,
  origin:window.location.origin,signal,errorPrefix:`P046_${id}`});
};

export function p046HostSnapshot(snapshot:P046RuntimeSnapshot):SourceLessonSnapshot{
 const {state,tracks}=snapshot;
 const active=[tracks.main,tracks.wrong,tracks.right].find(track=>track.phase==='playing')??tracks.main;
 const pending=[tracks.main,tracks.wrong,tracks.right].some(track=>track.phase==='start-pending');
 return {frame:state.mainFrame,phase:snapshot.visualClockRunning?'playing':pending?'start-pending':'held',
  selectedAudio:state.spanishSelected?'spanish':'main',audio:active,
  spanish:snapshot.spanishLoading||tracks.sa.phase==='start-pending'?{phase:'loading'}:tracks.sa};
}

/** Local source-pinned P046 candidate adapter in the real My Lesson host. */
export function G678AlgL6P046RuntimeV1(props:LessonRuntimeAdapterProps){
 const {source,readableTarget,onSnapshot,connectControls,openGlossary}=
  useSourceLessonHostBridge(props,HOST_BINDING);
 const [asset,setAsset]=useState<CanvasAsset|null>(null);
 const [error,setError]=useState<string|null>(null);
 const scoped=process.env.NODE_ENV!=='production'&&props.animationId===ID&&
  props.moduleKey===ID&&props.audioEnabled===true&&
  props.query.frameDomain==='sprite-123'&&
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
 const observe=useCallback((snapshot:P046RuntimeSnapshot)=>
  onSnapshot(p046HostSnapshot(snapshot)),[onSnapshot]);
 const load=useCallback((id:P046AudioDomain,signal:AbortSignal)=>audio(id,signal),[]);
 const glossary=useCallback((term:string,trigger:HTMLButtonElement)=>{
  if(Object.hasOwn(P046_GLOSSARY_ENTRY_ID,term))
   openGlossary(term as keyof typeof P046_GLOSSARY_ENTRY_ID,trigger);
 },[openGlossary]);
 const connect=useCallback((controls:P046AudioPlayerControlsV1)=>
  connectControls(controls),[connectControls]);
 return <div ref={source} data-p046-host-probe={ID}
  data-p046-host-ready={String(!!asset&&scoped)}
  data-p046-host-source-sha256={SOURCE_SHA}
  data-p046-host-canvas-sha256={CANVAS_SHA}
  data-p046-host-error={!scoped?'scope':error??'none'}>
  {!scoped||error?<p role="alert">{props.labels.unavailable}</p>:asset?
   <P046AudioPlayerV1 asset={asset} load={load} language={props.uiLanguage} volume={props.volume??1}
    onSnapshot={observe} onGlossary={glossary} connectControls={connect}
    hidePlaybackControls nativeTextTarget={readableTarget}/>:
   <p role="status">{props.labels.loading}</p>}
 </div>;
}
