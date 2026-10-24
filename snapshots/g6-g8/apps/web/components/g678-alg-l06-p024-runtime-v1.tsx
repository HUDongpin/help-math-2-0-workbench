'use client';

import {useCallback,useEffect,useRef,useState} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import {P024PlayerV1,type P024CanvasAssetV1,type P024PlayerSnapshotV1,
 type P024PlayerControlsV1} from '../../../packages/demos/src/alg-l06-p024-player-v1';
import {P024_AUDIO_DOMAINS,P024_AUDIO_SA,type P024AudioDomainId}
 from '../../../packages/demos/src/alg-l06-p024-audio-schedule-v1';
import {P024_FEEDBACK,type P024GlossaryKey}
 from '../../../packages/demos/src/alg-l06-p024-state-v1';
import {ALG_L06_P024_DRAWING} from '../../../packages/demos/src/timelines/shared-alg001-l06-p024';

const ID='shared-alg001-l06-p024';
const SOURCE_SHA256='e36c6c293f1e620f82fa84d57a1b91fd0a977d24d365772126f87333ce359d05';
const CANVAS_URL=`/flash-assets/g678-local/${ID}/canvas-renderer.js?sha256=${ALG_L06_P024_DRAWING.assetSha256}`;
export const P024_GLOSSARY_ENTRY_ID={
 Range:'range',Function:'function',Output:'output',Set:'set','Function table':'function-table',
} as const satisfies Record<P024GlossaryKey,string>;
type P024EntryId=typeof P024_GLOSSARY_ENTRY_ID[P024GlossaryKey];
let canvasLoad:Promise<P024CanvasAssetV1>|undefined;

function installedCanvas():P024CanvasAssetV1|undefined{
 return window.HELP_MATH_CANVAS_ASSETS?.[ID] as P024CanvasAssetV1|undefined;
}
function exactCanvas():P024CanvasAssetV1{
 const asset=installedCanvas();
 const m=asset?.metadata as (P024CanvasAssetV1['metadata']&{
  mainQuizStopFrame?:number;feedbackFrameDomains?:Record<string,number>})|undefined;
 if(!asset||m?.animationId!==ID||m.sourceSwfSha256!==SOURCE_SHA256||
  m.deterministicContentTimeline.timelineId!=='sprite-208'||
  m.deterministicContentTimeline.frameCount!==381||
  m.stage.width!==800||m.stage.height!==600||m.fps!==12||m.mainQuizStopFrame!==154||
  m.sourceGlyphRendering?.suppressTextIdsSupported!==true||
  !m.feedbackFrameDomains||
  Object.entries(P024_FEEDBACK).some(([sprite,spec])=>
   m.feedbackFrameDomains?.[sprite.slice('sprite-'.length)]!==spec.end))
  throw Error('p024-canvas-identity-mismatch');
 return asset;
}
function loadCanvas():Promise<P024CanvasAssetV1>{
 if(installedCanvas()){
  try{return Promise.resolve(exactCanvas());}catch(error){return Promise.reject(error);}
 }
 if(!canvasLoad)canvasLoad=new Promise<P024CanvasAssetV1>((resolve,reject)=>{
  const script=document.createElement('script');script.src=CANVAS_URL;script.async=true;
  script.onload=()=>{try{resolve(exactCanvas());}catch(error){script.remove();canvasLoad=undefined;reject(error);}};
  script.onerror=()=>{script.remove();canvasLoad=undefined;reject(Error('p024-canvas-request-failed'));};
  document.head.append(script);
 });
 return canvasLoad;
}

/** The route checks its own pins; the client also bounds and hashes each response. */
async function exactAudio(name:string,pin:{sourceBytes:number;sourceSha256:string},
 signal:AbortSignal):Promise<ArrayBuffer>{
 const expected=new URL(`/flash-assets/g678-local/${ID}/${name}?sha256=${pin.sourceSha256}`,
  window.location.origin);
 const response=await fetch(expected,{signal,credentials:'same-origin',cache:'no-store',redirect:'error'});
 if(!response.ok||response.redirected||response.url!==expected.href||
  response.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='audio/mpeg'||
  response.headers.get('content-length')!==String(pin.sourceBytes)||!response.body)
  throw Error('p024-audio-response-mismatch');
 const reader=response.body.getReader(),bytes=new Uint8Array(pin.sourceBytes);
 let length=0;
 try{
  for(;;){
   const chunk=await reader.read();
   if(signal.aborted)throw Error('p024-audio-load-canceled');
   if(chunk.done)break;
   if(length+chunk.value.byteLength>bytes.length)throw Error('p024-audio-response-too-large');
   bytes.set(chunk.value,length);length+=chunk.value.byteLength;
  }
  if(length!==bytes.length)throw Error('p024-audio-response-length-mismatch');
  const digest=await crypto.subtle.digest('SHA-256',bytes.buffer);
  if(signal.aborted)throw Error('p024-audio-load-canceled');
  const sha=Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,'0')).join('');
  if(sha!==pin.sourceSha256)throw Error('p024-audio-sha256-mismatch');
  return bytes.buffer;
 }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
export async function p024LoadSourceAudio(id:P024AudioDomainId,signal:AbortSignal):Promise<ArrayBuffer>{
 const pin=P024_AUDIO_DOMAINS.find(row=>row.id===id);
 if(!pin)throw Error('p024-unknown-audio-domain');
 return exactAudio(id,pin,signal);
}
/** The separate SA recording is fetched only from an explicit player action. */
export function p024LoadSpanishAudio(signal:AbortSignal):Promise<ArrayBuffer>{
 return exactAudio('optional-spanish-audio-v1',P024_AUDIO_SA,signal);
}

export function p024HostPaused(snapshot:P024PlayerSnapshotV1):boolean{
 // Return restores reducer intent before SA retirement finishes. Its temporary
 // idle phase must not feed a spurious Pause back through the modern host.
 return snapshot.audio.transitioning&&snapshot.state.sa==='idle'
  ? !snapshot.state.playing
  : snapshot.audio.selectedAudio==='spanish'
   ? !['playing','loading'].includes(snapshot.audio.spanish.phase)
   : !snapshot.state.playing;
}

export function p024HostPlayback(snapshot:P024PlayerSnapshotV1):AnimationRuntimePlaybackState{
 const {state,audio}=snapshot,frame=state.mainFrame;
 const narration=audio.selectedAudio==='spanish'
  ? audio.spanish.phase==='playing'?'playing':'idle'
  : audio.clock.phase==='playing'?'playing':
   state.phase==='quiz'||state.phase==='popup'?'interactive':'idle';
 return {audioAvailable:true,frame,frameCount:381,frameDomain:'sprite-208',fps:12,
  narration,playbackProgress:(frame-1)/380,seekAvailable:false,stepFrames:12,
  transportMode:'none'};
}

/** P024's unregistered, local-only adapter for the existing My Lesson controls. */
export function G678AlgL6P024RuntimeV1(props:LessonRuntimeAdapterProps){
 const latest=useRef(props);latest.current=props;
 const source=useRef<HTMLDivElement>(null),controls=useRef<P024PlayerControlsV1|null>(null);
 const [asset,setAsset]=useState<P024CanvasAssetV1|null>(null);
 const [readableTarget,setReadableTarget]=useState<HTMLElement|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [reducedMotion,setReducedMotion]=useState(false);
 const glossary=useRef<{seen:boolean;entryId:P024EntryId}|null>(null);
 const replayReady=useRef(false);
 const lastPaused=useRef<boolean|null>(null);
 const reportTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const scoped=process.env.NODE_ENV!=='production'&&
  props.animationId===ID&&props.moduleKey===ID&&props.audioEnabled===true&&
  props.query.frameDomain==='sprite-208'&&props.query.scenario==='source-static-frame'&&
  props.query.lang==='en'&&String(props.query.seed)==='0'&&props.query.capture!=='1'&&
  (props.uiLanguage==='en'||props.uiLanguage==='es');

 useEffect(()=>{
  if(!scoped)return;
  let active=true;
  void loadCanvas().then(value=>{if(active)setAsset(value);},cause=>{
   if(active)setError(cause instanceof Error?cause.message:String(cause));
  });
  return()=>{active=false;};
 },[scoped]);
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>setReducedMotion(media.matches);
  update();media.addEventListener('change',update);
  return()=>media.removeEventListener('change',update);
 },[]);
 useEffect(()=>{
  const element=source.current,owner=element?.closest('.lesson-shell2__learning-column');
  const id=props.pageInteractionCompanionTargetId;
  if(!element||!owner||!id?.endsWith('-p024-source-readable'))return;
  const resolve=()=>{
   const target=element.ownerDocument.getElementById(id);
   const admitted=target?.parentElement===owner&&
    target.dataset.pageInteractionCompanionHost==='true'&&!element.contains(target)?target:null;
   setReadableTarget(previous=>previous===admitted?previous:admitted);
  };
  resolve();const observer=new MutationObserver(resolve);
  observer.observe(owner,{childList:true,subtree:true});
  return()=>observer.disconnect();
 },[props.pageInteractionCompanionTargetId]);
 const connectControls=useCallback((value:P024PlayerControlsV1)=>{
  controls.current=value;
  const disconnect=props.connectRuntimeControls({
   setPaused:paused=>value.setPaused(paused),
   replay:()=>{if(!replayReady.current)return false;value.replay();return true;},
   narration:action=>value.narration(action),stop:()=>value.stop(),
  });
  return()=>{if(controls.current===value)controls.current=null;disconnect();};
 },[props.connectRuntimeControls]);
 const onSnapshot=useCallback((snapshot:P024PlayerSnapshotV1)=>{
  replayReady.current=snapshot.visualReady&&!snapshot.error;
  const paused=p024HostPaused(snapshot);
  const playback=p024HostPlayback(snapshot);lastPaused.current=paused;
  if(reportTimer.current!==null)clearTimeout(reportTimer.current);
  reportTimer.current=setTimeout(()=>{
   reportTimer.current=null;
   if(latest.current.paused!==paused)latest.current.onRuntimePausedChange(paused);
   latest.current.onPlaybackStateChange?.(playback);
  },0);
 },[]);
 useEffect(()=>{
  if(!props.paused||lastPaused.current!==false)return;
  const target=controls.current;
  queueMicrotask(()=>{
   if(target&&controls.current===target&&latest.current.paused&&lastPaused.current===false)
    target.setPaused(true);
  });
 },[props.paused]);
 const openGlossary=useCallback((key:P024GlossaryKey,trigger:HTMLButtonElement)=>{
  if(!Object.hasOwn(P024_GLOSSARY_ENTRY_ID,key)||glossary.current)return;
  const entryId=P024_GLOSSARY_ENTRY_ID[key];glossary.current={seen:false,entryId};
  if(document.activeElement===trigger)trigger.blur();
  try{
   const result=latest.current.onLessonHostRequest?.({type:'open-glossary',entryId},{trigger});
   if(result?.status==='allowed')return;
  }catch(error){glossary.current=null;controls.current?.closeGlossary();throw error;}
  glossary.current=null;controls.current?.closeGlossary();
 },[]);
 useEffect(()=>{
  const check=()=>{
   const pending=glossary.current;if(!pending)return;
   if(document.querySelector(`[role="dialog"][data-glossary-entry-id="${pending.entryId}"]`)){
    pending.seen=true;return;
   }
   if(pending.seen){glossary.current=null;controls.current?.closeGlossary();}
  };
  const observer=new MutationObserver(check);
  observer.observe(document.body,{childList:true,subtree:true});
  return()=>{observer.disconnect();glossary.current=null;};
 },[]);
 useEffect(()=>()=>{
  if(reportTimer.current!==null)clearTimeout(reportTimer.current);
  reportTimer.current=null;
 },[]);
 return <div ref={source} data-p024-host-probe={ID}
  data-p024-host-ready={String(Boolean(asset)&&scoped)}
  data-p024-host-source-sha256={SOURCE_SHA256}
  data-p024-host-error={!scoped?'scope':error??'none'}>
  {!scoped||error?<p role="alert">{props.labels.unavailable}</p>:
   asset?<P024PlayerV1 asset={asset} loadAudio={p024LoadSourceAudio}
    loadSpanishAudio={p024LoadSpanishAudio} language={props.uiLanguage}
    reducedMotion={reducedMotion} volume={props.volume??1}
    onSnapshot={onSnapshot} connectControls={connectControls}
    onOpenGlossary={openGlossary} hidePlaybackControls nativeTextTarget={readableTarget}/>:
   <p role="status">{props.labels.loading}</p>}
 </div>;
}
