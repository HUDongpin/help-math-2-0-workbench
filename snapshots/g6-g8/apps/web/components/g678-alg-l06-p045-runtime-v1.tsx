'use client';

import {useCallback,useEffect,useState} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadBoundLessonAudio,useSourceLessonHostBridge,type SourceLessonSnapshot}
 from './source-lesson-host-bridge-v1';
import {P045AudioPlayerV1,type P045AudioPlayerControlsV1}
 from '../../../packages/demos/src/alg-l06-p045-audio-player-v1';
import {P045_MEASURED_BINDINGS,type P045MeasuredDomainId}
 from '../../../packages/demos/src/alg-l06-p045-measured-bindings-v1';
import type {P045CanvasAssetV1}
 from '../../../packages/demos/src/alg-l06-p045-canvas-commit-v1';
import type {P045RuntimeSnapshot}
 from '../../../packages/demos/src/alg-l06-p045-audio-runtime-v1';

const ID='shared-alg001-l06-p045';
const SOURCE_SHA='9dfff51a15bb0010b98ca10c1fac954bee5d9451ceb649d8ac202e98f2c05b9d';
const CANVAS_SHA='4e9e318fdd503275e8d89b1b462b7e525888f0b0c14ecad3d6c114d18c7d5bc0';
export const P045_GLOSSARY_ENTRY_ID={Function:'function',Graph:'graph',Represent:'represent',
 Vertical:'vertical',Line:'line',Point:'point','Vertical-line test':'vertical-line-test'} as const;
const HOST_BINDING={frameCount:167,frameDomain:'sprite-350',fps:12,
 audioAvailable:true,companionIdSuffix:'-p045-source-readable',
 glossaryEntries:P045_GLOSSARY_ENTRY_ID} as const;
type CanvasAsset=P045CanvasAssetV1&{metadata:{animationId:string;
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
  m.deterministicContentTimeline.timelineId!=='sprite-350'||
  m.deterministicContentTimeline.frameCount!==167)
  throw Error('P045_CANVAS_IDENTITY');
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
   reject(Error('P045_CANVAS_REQUEST'))};
  document.head.append(script);
 });
 return canvasLoad;
}

const audio=(id:P045MeasuredDomainId,signal:AbortSignal)=>{
 const binding=P045_MEASURED_BINDINGS[id];
 const assetId=id==='main'?'main-source-v1':id==='sa'?
  'optional-spanish-audio-v1':`feedback-${id}-source-v1`;
 return loadBoundLessonAudio({animationId:ID,assetId,pin:binding,
  origin:window.location.origin,signal,errorPrefix:`P045_${id}`});
};

export function p045HostSnapshot(snapshot:P045RuntimeSnapshot):SourceLessonSnapshot{
 const {state,audio:owner}=snapshot;
 return {frame:state.mainFrame,
  phase:snapshot.visualClockRunning?'playing':'held',
  selectedAudio:owner.owner==='sa'?'spanish':'main',
  audio:owner.owner==='sa'?owner.main??{phase:'idle'}:owner.selected??{phase:'idle'},
  spanish:owner.spanish??{phase:'idle'}};
}

/** Local source-pinned P045 candidate adapter in the real My Lesson host. */
export function G678AlgL6P045RuntimeV1(props:LessonRuntimeAdapterProps){
 const {source,readableTarget,onSnapshot,connectControls,openGlossary}=
  useSourceLessonHostBridge(props,HOST_BINDING);
 const [asset,setAsset]=useState<CanvasAsset|null>(null);
 const [error,setError]=useState<string|null>(null);
 const scoped=process.env.NODE_ENV!=='production'&&props.animationId===ID&&
  props.moduleKey===ID&&props.audioEnabled===true&&
  props.query.frameDomain==='sprite-350'&&
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
 const observe=useCallback((snapshot:P045RuntimeSnapshot)=>
  onSnapshot(p045HostSnapshot(snapshot)),[onSnapshot]);
 const main=useCallback((signal:AbortSignal)=>audio('main',signal),[]);
 const feedback=useCallback((id:'wrong4'|'right4',signal:AbortSignal)=>audio(id,signal),[]);
 const spanish=useCallback((signal:AbortSignal)=>audio('sa',signal),[]);
 const glossary=useCallback((term:string,trigger:HTMLButtonElement)=>{
  if(Object.hasOwn(P045_GLOSSARY_ENTRY_ID,term))
   openGlossary(term as keyof typeof P045_GLOSSARY_ENTRY_ID,trigger);
 },[openGlossary]);
 const connect=useCallback((controls:P045AudioPlayerControlsV1)=>
  connectControls(controls),[connectControls]);
 return <div ref={source} data-p045-host-probe={ID}
  data-p045-host-ready={String(!!asset&&scoped)}
  data-p045-host-source-sha256={SOURCE_SHA}
  data-p045-host-canvas-sha256={CANVAS_SHA}
  data-p045-host-error={!scoped?'scope':error??'none'}>
  {!scoped||error?<p role="alert">{props.labels.unavailable}</p>:asset?
   <P045AudioPlayerV1 asset={asset} loadMain={main} loadFeedback={feedback}
    loadSpanish={spanish} language={props.uiLanguage} volume={props.volume??1}
    onSnapshot={observe} onGlossary={glossary} connectControls={connect}
    hidePlaybackControls nativeTextTarget={readableTarget}/>:
   <p role="status">{props.labels.loading}</p>}
 </div>;
}
