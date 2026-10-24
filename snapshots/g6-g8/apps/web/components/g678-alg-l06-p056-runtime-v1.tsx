'use client';

import {useCallback,useEffect,useState,useRef} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {loadBoundLessonAudio,useSourceLessonHostBridge,type SourceLessonSnapshot}
 from './source-lesson-host-bridge-v1';
import {P056PlayerV1,type P056CanvasAsset} from '../../../packages/demos/src/alg-l06-p056-player-v1';
import type {P056PageRuntimeV1} from '../../../packages/demos/src/alg-l06-p056-audio-runtime-v1';
import {P056_MEASURED_BINDINGS,type P056AudioDomain}
 from '../../../packages/demos/src/alg-l06-p056-measured-bindings-v1';
import type {P056RuntimeSnapshot}
 from '../../../packages/demos/src/alg-l06-p056-audio-runtime-v1';

const ID='shared-alg001-l06-p056';
const SOURCE_SHA='ba6ba691fafbc6bbd2d0a14b4d249c59e7f1569ca8aaddaa778957c6120205d1';
const CANVAS_SHA='9d0fa77a8c1339a4e559a76187c782167d6f351bdc3bae7ff4c3917c42847416';
const HOST_BINDING={frameCount:818,frameDomain:'sprite-305',fps:12,
 audioAvailable:true,companionIdSuffix:'-p056-source-readable',
 glossaryEntries:{"Value": "value", "Function": "function", "Input": "input", "Output": "output", "Table": "table", "Pattern": "pattern", "Relation": "relation", "Evaluate": "evaluate", "Substitute": "substitute", "Equation": "equation", "Solve": "solve"}} as const;
type CanvasAsset=P056CanvasAsset&{metadata:{animationId:string;
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
  m.deterministicContentTimeline.timelineId!=='sprite-305'||
  m.deterministicContentTimeline.frameCount!==818)
  throw Error('P056_CANVAS_IDENTITY');
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
   reject(Error('P056_CANVAS_REQUEST'))};
  document.head.append(script);
 });
 return canvasLoad;
}

const audio=(id:P056AudioDomain,signal:AbortSignal)=>{
 const binding=P056_MEASURED_BINDINGS[id];
 const assetId=id==='main'?'main-source-v1':id==='sa'?
  'optional-spanish-audio-v1':`feedback-${id}-source-v1`;
 return loadBoundLessonAudio({animationId:ID,assetId,pin:binding,
  origin:window.location.origin,signal,contentType:'audio/mpeg',errorPrefix:`P056_${id}`});
};

export function p056HostSnapshot(snapshot:P056RuntimeSnapshot):SourceLessonSnapshot{
 const {state,audio}=snapshot;
 const active=audio.selected??{phase:'idle'};
 return {frame:state.mainFrame,phase:snapshot.visualClockRunning?'playing':active.phase==='start-pending'?'start-pending':'held',
  selectedAudio:snapshot.spanishSelected?'spanish':'main',audio:active,
  spanish:snapshot.spanishLoading||audio.streams.sa?.phase==='start-pending'?{phase:'loading'}:audio.streams.sa??{phase:'idle'}};
}

/** Local source-pinned P056 candidate adapter in the real My Lesson host. */
export function G678AlgL6P056RuntimeV1(props:LessonRuntimeAdapterProps){
 const {source,readableTarget,onSnapshot,connectControls,openGlossary}=
  useSourceLessonHostBridge(props,HOST_BINDING);
 const [asset,setAsset]=useState<CanvasAsset|null>(null);
 const [error,setError]=useState<string|null>(null);
 const scoped=process.env.NODE_ENV!=='production'&&props.animationId===ID&&
  props.moduleKey===ID&&props.audioEnabled===true&&
  props.query.frameDomain==='sprite-305'&&
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
 const observe=useCallback((snapshot:P056RuntimeSnapshot)=>
  onSnapshot(p056HostSnapshot(snapshot)),[onSnapshot]);
 const load=useCallback((id:P056AudioDomain,signal:AbortSignal)=>audio(id,signal),[]);
 const glossaryTrigger=useRef<HTMLButtonElement|null>(null);
 const disconnected=useRef<(()=>void)|null>(null);
 const connect=useCallback((runtime:P056PageRuntimeV1|null)=>{
  disconnected.current?.();disconnected.current=null;if(!runtime){glossaryTrigger.current=null;return;}
  disconnected.current=connectControls({setPaused:paused=>{if(paused)runtime.pause();else runtime.play();},replay:()=>runtime.replay(),narration:action=>{if(action==='play')void runtime.startSpanish();else runtime.returnMain();},stop:()=>{void runtime.close();},closeGlossary:()=>{runtime.pause();runtime.closeGlossary();const trigger=glossaryTrigger.current;glossaryTrigger.current=null;requestAnimationFrame(()=>{if(trigger?.isConnected&&!trigger.disabled)trigger.focus({preventScroll:true});});}});
 },[connectControls]);
 return <div ref={source} data-p056-host-probe={ID}
  data-p056-host-ready={String(!!asset&&scoped)}
  data-p056-host-source-sha256={SOURCE_SHA}
  data-p056-host-canvas-sha256={CANVAS_SHA}
  data-p056-host-error={!scoped?'scope':error??'none'}>
  {!scoped||error?<p role="alert">{props.labels.unavailable}</p>:asset?
   <P056PlayerV1 asset={asset} load={load} language={props.uiLanguage} volume={props.volume??1}
    onSnapshot={observe} connectRuntime={connect} onGlossary={(key,trigger)=>{if(Object.prototype.hasOwnProperty.call(HOST_BINDING.glossaryEntries,key)){glossaryTrigger.current=trigger;openGlossary(key as keyof typeof HOST_BINDING.glossaryEntries,trigger);}}}
    hidePlaybackControls nativeTextTarget={readableTarget}/>:
   <p role="status">{props.labels.loading}</p>}
 </div>;
}
