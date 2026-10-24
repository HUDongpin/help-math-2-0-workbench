'use client';

import {useCallback,useEffect,useState} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadBoundLessonAudio,useSourceLessonHostBridge,
 type SourceLessonSnapshot} from './source-lesson-host-bridge-v1';
import {P041PlayerV1,type P041CanvasAssetV1,type P041PlayerControlsV1}
 from '../../../packages/demos/src/alg-l06-p041-player-v1';
import {P041_MEASURED_BINDINGS,type P041MeasuredDomainId}
 from '../../../packages/demos/src/alg-l06-p041-measured-bindings-v1';
import type {P041RuntimeSnapshot} from '../../../packages/demos/src/alg-l06-p041-runtime-v1';

const ID='shared-alg001-l06-p041';
const SOURCE_SHA='bb10cab8e835f2c3267e0add3774dc47fa38863fe12dab67f3199e4c0efadd85';
const CANVAS_SHA='77cdf78caf76bc825e4c8cbdc5f511dd377da9b289018a53cf1c72c7f3ad5923';
const HOST_BINDING={frameCount:869,frameDomain:'sprite-169',fps:12,
 companionIdSuffix:'-p041-source-readable',glossaryEntries:{}} as const;
type CanvasAsset=P041CanvasAssetV1&{metadata:{animationId:string;sourceSwfSha256:string;
 stage:{width:number;height:number};fps:number;
 sourceRootTimeline:{frameCount:number;beginFrame:number};
 deterministicContentTimeline:{timelineId:string;frameCount:number}}};

let canvasLoad:Promise<CanvasAsset>|undefined;
const loaded=()=>window.HELP_MATH_CANVAS_ASSETS?.[ID] as unknown as CanvasAsset|undefined;
function exactCanvas():CanvasAsset{
 const asset=loaded(),m=asset?.metadata;
 if(!asset||m?.animationId!==ID||m.sourceSwfSha256!==SOURCE_SHA||
  m.fps!==12||m.stage.width!==800||m.stage.height!==600||
  m.sourceRootTimeline.frameCount!==10||m.sourceRootTimeline.beginFrame!==6||
  m.deterministicContentTimeline.timelineId!=='sprite-169'||
  m.deterministicContentTimeline.frameCount!==869)
  throw Error('P041_CANVAS_IDENTITY');
 return asset;
}
function loadCanvas():Promise<CanvasAsset>{
 if(loaded()){
  try{return Promise.resolve(exactCanvas());}catch(error){return Promise.reject(error);}
 }
 if(!canvasLoad)canvasLoad=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=`/flash-assets/g678-local/${ID}/canvas-renderer.js?sha256=${CANVAS_SHA}`;
  script.async=true;
  script.onload=()=>{try{resolve(exactCanvas());}catch(error){
   script.remove();canvasLoad=undefined;reject(error);}};
  script.onerror=()=>{script.remove();canvasLoad=undefined;reject(Error('P041_CANVAS_REQUEST'));};
  document.head.append(script);
 });
 return canvasLoad;
}
const audio=(id:P041MeasuredDomainId,signal:AbortSignal)=>{
 const binding=P041_MEASURED_BINDINGS[id];
 const assetId=id==='main'?'main-source-v1':id==='sa'?
  'optional-spanish-audio-v1':`feedback-${id}-source-v1`;
 return loadBoundLessonAudio({animationId:ID,assetId,pin:binding,
  origin:window.location.origin,signal,errorPrefix:`P041_${id}`});
};

/** The ordinary host receives only observed page state. No browser clock or
 * source-node state is fabricated by this adapter. */
export function p041HostSnapshot(snapshot:P041RuntimeSnapshot):SourceLessonSnapshot{
 const {state,audio:owner}=snapshot;
 const playing=state.mainTimelinePlaying||!!state.feedback?.playing;
 return {frame:state.mainFrame,phase:playing?'playing':'held',
  selectedAudio:owner.owner==='sa'?'spanish':'main',
  audio:owner.owner==='sa'?owner.main??{phase:'idle'}:owner.selected??{phase:'idle'},
  spanish:owner.spanish??{phase:'idle'}};
}

export function G678AlgL6P041RuntimeV1(props:LessonRuntimeAdapterProps){
 const {source,readableTarget,onSnapshot,connectControls}=
  useSourceLessonHostBridge(props,HOST_BINDING);
 const [asset,setAsset]=useState<CanvasAsset|null>(null);
 const [error,setError]=useState<string|null>(null);
 const scoped=process.env.NODE_ENV!=='production'&&props.animationId===ID&&
  props.moduleKey===ID&&props.audioEnabled===true&&
  props.query.frameDomain==='sprite-169'&&
  props.query.scenario==='source-explicit-frames'&&props.query.lang==='en'&&
  String(props.query.seed)==='0'&&props.query.capture!=='1'&&
  ['en','es'].includes(props.uiLanguage??'');
 useEffect(()=>{
  if(!scoped)return;
  let live=true;
  void loadCanvas().then(value=>{if(live)setAsset(value);},cause=>{
   if(live)setError(String(cause));
  });
  return()=>{live=false;};
 },[scoped]);
 const observe=useCallback((snapshot:P041RuntimeSnapshot)=>onSnapshot(p041HostSnapshot(snapshot)),
  [onSnapshot]);
 const main=useCallback((signal:AbortSignal)=>audio('main',signal),[]);
 const feedback=useCallback((id:Exclude<P041MeasuredDomainId,'main'|'sa'>,
  signal:AbortSignal)=>audio(id,signal),[]);
 const spanish=useCallback((signal:AbortSignal)=>audio('sa',signal),[]);
 const connect=useCallback((controls:P041PlayerControlsV1)=>
  connectControls({...controls,closeGlossary:()=>{}}),[connectControls]);
 return <div ref={source} data-p041-host-probe={ID}
  data-p041-host-ready={String(!!asset&&scoped)}
  data-p041-host-source-sha256={SOURCE_SHA}
  data-p041-host-canvas-sha256={CANVAS_SHA}
  data-p041-host-error={!scoped?'scope':error??'none'}>
  {!scoped||error?<p role="alert">{props.labels.unavailable}</p>:asset?
   <P041PlayerV1 asset={asset} loadMain={main} loadFeedback={feedback}
    loadSpanish={spanish} language={props.uiLanguage} volume={props.volume??1}
    onSnapshot={observe} connectControls={connect}
    hidePlaybackControls nativeTextTarget={readableTarget}/>:
   <p role="status">{props.labels.loading}</p>}
 </div>;
}
