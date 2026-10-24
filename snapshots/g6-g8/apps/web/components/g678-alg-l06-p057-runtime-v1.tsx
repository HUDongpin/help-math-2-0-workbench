'use client';

import {useCallback,useEffect,useState,useRef} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadBoundLessonAudio,useSourceLessonHostBridge,type SourceLessonSnapshot}
 from './source-lesson-host-bridge-v1';
import {P057PlayerV1,type P057CanvasAsset} from '../../../packages/demos/src/alg-l06-p057-player-v1';
import type {P057PageRuntimeV1} from '../../../packages/demos/src/alg-l06-p057-audio-runtime-v1';
import {P057_MEASURED_BINDINGS,type P057AudioDomain}
 from '../../../packages/demos/src/alg-l06-p057-measured-bindings-v1';
import type {P057RuntimeSnapshot}
 from '../../../packages/demos/src/alg-l06-p057-audio-runtime-v1';

const ID='shared-alg001-l06-p057';
const SOURCE_SHA='03782ef6ed4587d61db4476648d0d69b5ad158f84b2f6a0ba747605a6712fb31';
const CANVAS_SHA='b2d839c31d4907b168e45a2607896f714731b88943d3cb93b10b11528634b401';
const HOST_BINDING={frameCount:856,frameDomain:'sprite-312',fps:12,
 audioAvailable:true,companionIdSuffix:'-p057-source-readable',
 glossaryEntries:{"Equation": "equation", "Function": "function", "Function table": "function-table", "Input": "input", "Output": "output", "Relation": "relation", "Value": "value"}} as const;
type CanvasAsset=P057CanvasAsset&{metadata:{animationId:string;
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
  m.deterministicContentTimeline.timelineId!=='sprite-312'||
  m.deterministicContentTimeline.frameCount!==856)
  throw Error('P057_CANVAS_IDENTITY');
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
   reject(Error('P057_CANVAS_REQUEST'))};
  document.head.append(script);
 });
 return canvasLoad;
}

const audio=(id:P057AudioDomain,signal:AbortSignal)=>{
 const binding=P057_MEASURED_BINDINGS[id];
 const assetId=id==='main'?'main-source-v1':id==='sa'?
  'optional-spanish-audio-v1':`feedback-${id}-source-v1`;
 return loadBoundLessonAudio({animationId:ID,assetId,pin:binding,
  origin:window.location.origin,signal,contentType:id==='105'?'audio/wav':'audio/mpeg',errorPrefix:`P057_${id}`});
};

export function p057HostSnapshot(snapshot:P057RuntimeSnapshot):SourceLessonSnapshot{
 const {state,audio}=snapshot;
 const active=audio.selected??{phase:'idle'};
 return {frame:state.mainFrame,phase:snapshot.visualClockRunning?'playing':active.phase==='start-pending'?'start-pending':'held',
  selectedAudio:snapshot.spanishSelected?'spanish':'main',audio:active,
  spanish:snapshot.spanishLoading||audio.streams.sa?.phase==='start-pending'?{phase:'loading'}:audio.streams.sa??{phase:'idle'}};
}

/** Local source-pinned P057 candidate adapter in the real My Lesson host. */
export function G678AlgL6P057RuntimeV1(props:LessonRuntimeAdapterProps){
 const {source,readableTarget,onSnapshot,connectControls,openGlossary}=
  useSourceLessonHostBridge(props,HOST_BINDING);
 const [asset,setAsset]=useState<CanvasAsset|null>(null);
 const [error,setError]=useState<string|null>(null);
 const scoped=process.env.NODE_ENV!=='production'&&props.animationId===ID&&
  props.moduleKey===ID&&props.audioEnabled===true&&
  props.query.frameDomain==='sprite-312'&&
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
 const observe=useCallback((snapshot:P057RuntimeSnapshot)=>
  onSnapshot(p057HostSnapshot(snapshot)),[onSnapshot]);
 const load=useCallback((id:P057AudioDomain,signal:AbortSignal)=>audio(id,signal),[]);
 const glossaryTrigger=useRef<HTMLButtonElement|null>(null);
 const disconnected=useRef<(()=>void)|null>(null);
 const connect=useCallback((runtime:P057PageRuntimeV1|null)=>{
  disconnected.current?.();disconnected.current=null;if(!runtime){glossaryTrigger.current=null;return;}
  disconnected.current=connectControls({setPaused:paused=>{if(paused)runtime.pause();else runtime.play();},replay:()=>runtime.replay(),narration:action=>{if(action==='play')void runtime.startSpanish();else runtime.returnMain();},stop:()=>{void runtime.close();},closeGlossary:()=>{runtime.pause();runtime.closeGlossary();const trigger=glossaryTrigger.current;glossaryTrigger.current=null;requestAnimationFrame(()=>{if(trigger?.isConnected&&!trigger.disabled)trigger.focus({preventScroll:true});});}});
 },[connectControls]);
 return <div ref={source} data-p057-host-probe={ID}
  data-p057-host-ready={String(!!asset&&scoped)}
  data-p057-host-source-sha256={SOURCE_SHA}
  data-p057-host-canvas-sha256={CANVAS_SHA}
  data-p057-host-error={!scoped?'scope':error??'none'}>
  {!scoped||error?<p role="alert">{props.labels.unavailable}</p>:asset?
   <P057PlayerV1 asset={asset} load={load} language={props.uiLanguage} volume={props.volume??1}
    onSnapshot={observe} connectRuntime={connect} onGlossary={(key,trigger)=>{if(Object.prototype.hasOwnProperty.call(HOST_BINDING.glossaryEntries,key)){glossaryTrigger.current=trigger;openGlossary(key as keyof typeof HOST_BINDING.glossaryEntries,trigger);}}}
    hidePlaybackControls nativeTextTarget={readableTarget}/>:
   <p role="status">{props.labels.loading}</p>}
 </div>;
}
