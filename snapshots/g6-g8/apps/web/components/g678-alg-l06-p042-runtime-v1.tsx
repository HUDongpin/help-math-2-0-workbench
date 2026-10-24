'use client';

import {useCallback,useEffect,useState} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadBoundLessonAudio,useSourceLessonHostBridge,
 type SourceLessonSnapshot} from './source-lesson-host-bridge-v1';
import {P042PlayerV1,type P042CanvasAssetV1,type P042PlayerControlsV1}
 from '../../../packages/demos/src/alg-l06-p042-player-v1';
import {P042_MEASURED_BINDINGS,type P042MeasuredDomainId}
 from '../../../packages/demos/src/alg-l06-p042-measured-bindings-v1';
import type {P042RuntimeSnapshot} from '../../../packages/demos/src/alg-l06-p042-runtime-v1';

const ID='shared-alg001-l06-p042';
const SOURCE_SHA='7df2077da472138df83a4485c0e15b7f3b1063aefcdcf2e3ded9232c98f68fcb';
const CANVAS_SHA='8eebb94446a095f5219bc5b3b46f740179d92e8ee6260a6a5cfa2d9d34fae8f4';
export const P042_GLOSSARY_ENTRY_ID={Substitute:'substitute',Input:'input',
 Value:'value',Simplify:'simplify',Expression:'expression',Calculate:'calculate',
 Output:'output',Function:'function'} as const;
const HOST_BINDING={frameCount:400,frameDomain:'sprite-341',fps:12,
 companionIdSuffix:'-p042-source-readable',
 glossaryEntries:P042_GLOSSARY_ENTRY_ID} as const;
type CanvasAsset=P042CanvasAssetV1&{metadata:{animationId:string;sourceSwfSha256:string;
 fps:number;stage:{width:number;height:number};
 sourceRootTimeline:{frameCount:number;beginFrame:number};
 deterministicContentTimeline:{timelineId:string;frameCount:number}}};

let canvasLoad:Promise<CanvasAsset>|undefined;
const loaded=()=>window.HELP_MATH_CANVAS_ASSETS?.[ID] as unknown as CanvasAsset|undefined;
function exactCanvas():CanvasAsset{
 const asset=loaded(),m=asset?.metadata;
 if(!asset||m?.animationId!==ID||m.sourceSwfSha256!==SOURCE_SHA||
  m.fps!==12||m.stage.width!==800||m.stage.height!==600||
  m.sourceRootTimeline.frameCount!==10||m.sourceRootTimeline.beginFrame!==6||
  m.deterministicContentTimeline.timelineId!=='sprite-341'||
  m.deterministicContentTimeline.frameCount!==400)
  throw Error('P042_CANVAS_IDENTITY');
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
  script.onerror=()=>{script.remove();canvasLoad=undefined;reject(Error('P042_CANVAS_REQUEST'));};
  document.head.append(script);
 });
 return canvasLoad;
}
const audio=(id:P042MeasuredDomainId,signal:AbortSignal)=>{
 const binding=P042_MEASURED_BINDINGS[id];
 const assetId=id==='main'?'main-source-v1':id==='sa'?
  'optional-spanish-audio-v1':`feedback-${id}-source-v1`;
 return loadBoundLessonAudio({animationId:ID,assetId,pin:binding,
  origin:window.location.origin,signal,errorPrefix:`P042_${id}`});
};

export function p042HostSnapshot(snapshot:P042RuntimeSnapshot):SourceLessonSnapshot{
 const {state,audio:owner}=snapshot;
 return {frame:state.mainFrame,phase:snapshot.visualClockRunning?'playing':'held',
  selectedAudio:owner.owner==='sa'?'spanish':'main',
  audio:owner.owner==='sa'?owner.main??{phase:'idle'}:owner.selected??{phase:'idle'},
  spanish:owner.spanish??{phase:'idle'}};
}

/** Exact local-only candidate adapter for the ordinary My Lesson controls. */
export function G678AlgL6P042RuntimeV1(props:LessonRuntimeAdapterProps){
 const {source,readableTarget,onSnapshot,connectControls,openGlossary}=
  useSourceLessonHostBridge(props,HOST_BINDING);
 const [asset,setAsset]=useState<CanvasAsset|null>(null);
 const [error,setError]=useState<string|null>(null);
 const scoped=process.env.NODE_ENV!=='production'&&props.animationId===ID&&
  props.moduleKey===ID&&props.audioEnabled===true&&
  props.query.frameDomain==='sprite-341'&&
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
 const observe=useCallback((snapshot:P042RuntimeSnapshot)=>onSnapshot(p042HostSnapshot(snapshot)),
  [onSnapshot]);
 const main=useCallback((signal:AbortSignal)=>audio('main',signal),[]);
 const feedback=useCallback((id:'wrong4'|'right4',signal:AbortSignal)=>audio(id,signal),[]);
 const spanish=useCallback((signal:AbortSignal)=>audio('sa',signal),[]);
 const glossary=useCallback((term:string,trigger:HTMLButtonElement)=>{
  if(Object.hasOwn(P042_GLOSSARY_ENTRY_ID,term))
   openGlossary(term as keyof typeof P042_GLOSSARY_ENTRY_ID,trigger);
 },[openGlossary]);
 const connect=useCallback((controls:P042PlayerControlsV1)=>
  connectControls(controls),[connectControls]);
 return <div ref={source} data-p042-host-probe={ID}
  data-p042-host-ready={String(!!asset&&scoped)}
  data-p042-host-source-sha256={SOURCE_SHA}
  data-p042-host-canvas-sha256={CANVAS_SHA}
  data-p042-host-error={!scoped?'scope':error??'none'}>
  {!scoped||error?<p role="alert">{props.labels.unavailable}</p>:asset?
   <P042PlayerV1 asset={asset} loadMain={main} loadFeedback={feedback}
    loadSpanish={spanish} language={props.uiLanguage} volume={props.volume??1}
    onSnapshot={observe} onGlossary={glossary} connectControls={connect}
    hidePlaybackControls nativeTextTarget={readableTarget}/>:
   <p role="status">{props.labels.loading}</p>}
 </div>;
}
