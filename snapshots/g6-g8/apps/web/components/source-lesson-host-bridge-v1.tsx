'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import type {LessonRuntimeAdapterProps, LessonRuntimeAdapterControls} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime-loader-core-v1.generated';

export interface SourceLessonSnapshot {
  frame:number;
  phase:string;
  returning?:boolean;
  selectedAudio:'main'|'spanish';
  audio:Readonly<{phase:string}>;
  spanish:Readonly<{phase:string}>;
}
export interface SourceLessonControls extends LessonRuntimeAdapterControls {
  closeGlossary():void;
}
export interface SourceLessonHostBinding<Key extends string> {
  readonly frameCount:number;
  readonly frameDomain:string;
  readonly fps:number;
  readonly audioAvailable?:boolean;
  readonly companionIdSuffix:string;
  readonly glossaryEntries:Readonly<Record<Key,string>>;
}

/** Request identity and bounded streaming are shared. The existing source
 * transport still checks the actual encoded-source/PCM hashes before it starts audio. */
export async function loadBoundLessonAudio(options:{animationId:string;assetId:string;
  pin:Readonly<{sourceBytes:number;sourceSha256:string}>;origin:string;
  signal:AbortSignal;errorPrefix:string;contentType?:'audio/mpeg'|'audio/wav'}):Promise<ArrayBuffer> {
  const {animationId,assetId,pin,origin,signal,errorPrefix,contentType='audio/mpeg'}=options;
  const fail=(reason:string)=>Error(`${errorPrefix}-${reason}`);
  if(!/^[a-z0-9-]+$/.test(animationId)||!/^[a-z0-9-]+$/.test(assetId)||
    !/^[a-f0-9]{64}$/.test(pin.sourceSha256)||!Number.isSafeInteger(pin.sourceBytes)||
    pin.sourceBytes<=0||pin.sourceBytes>64*1024*1024)
    throw fail('invalid-source-binding');
  const base=new URL(origin);
  if(!['http:','https:'].includes(base.protocol)||base.origin!==origin)
    throw fail('invalid-origin');
  if(signal.aborted)throw fail('load-canceled');
  const expected=new URL(`/flash-assets/g678-local/${animationId}/${assetId}?sha256=${pin.sourceSha256}`,origin);
  const response=await fetch(expected,{signal,credentials:'same-origin',cache:'no-store',redirect:'error'});
  if(!response.ok||response.redirected||response.url!==expected.href||
    response.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!==contentType||
    response.headers.get('content-length')!==String(pin.sourceBytes)||!response.body)
    throw fail('response-mismatch');
  const reader=response.body.getReader(),bytes=new Uint8Array(pin.sourceBytes);
  let length=0,drained=false;
  try {
    for(;;) {
      const chunk=await reader.read();
      if(signal.aborted)throw fail('load-canceled');
      if(chunk.done){drained=true;break;}
      if(length+chunk.value.byteLength>bytes.length)throw fail('response-too-large');
      bytes.set(chunk.value,length);length+=chunk.value.byteLength;
    }
    if(length!==bytes.length)throw fail('response-length-mismatch');
    return bytes.buffer;
  } finally {
    if(!drained)await reader.cancel().catch(()=>{});
    reader.releaseLock();
  }
}

export function sourceLessonHostPaused(snapshot:SourceLessonSnapshot):boolean {
  return snapshot.returning ? false : snapshot.selectedAudio==='spanish'
    ? !['playing','loading'].includes(snapshot.spanish.phase)
    : !['playing','start-pending'].includes(snapshot.phase);
}

export function sourceLessonHostPlayback(snapshot:SourceLessonSnapshot,
  binding:Pick<SourceLessonHostBinding<string>,'frameCount'|'frameDomain'|'fps'|'audioAvailable'>):AnimationRuntimePlaybackState {
  return {audioAvailable:binding.audioAvailable??true,frame:snapshot.frame,frameCount:binding.frameCount,
    frameDomain:binding.frameDomain,fps:binding.fps,
    narration:binding.audioAvailable===false?'unavailable':snapshot.selectedAudio==='spanish'
      ? snapshot.spanish.phase==='playing'?'playing':'idle'
      : snapshot.phase==='playing'&&snapshot.audio.phase==='playing'?'playing':'idle',
    playbackProgress:(snapshot.frame-1)/(binding.frameCount-1),
    seekAvailable:false,stepFrames:binding.fps,transportMode:'none'};
}

/** P017/P018 share this host protocol, not their source clocks or glossary
 * instance gates. A snapshot never issues a new Play/SA request. */
export function useSourceLessonHostBridge<Key extends string>(props:LessonRuntimeAdapterProps,
  binding:SourceLessonHostBinding<Key>) {
  const latest=useRef(props);latest.current=props;
  const contract=useRef(binding);contract.current=binding;
  const source=useRef<HTMLDivElement>(null);
  const controls=useRef<SourceLessonControls|null>(null);
  const [readableTarget,setReadableTarget]=useState<HTMLElement|null>(null);
  const [reducedMotion,setReducedMotion]=useState(false);
  const glossary=useRef<{seen:boolean;entryId:string}|null>(null);
  const lastPaused=useRef<boolean|null>(null);
  const reportTimer=useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setReducedMotion(media.matches);
    update();media.addEventListener('change',update);
    return()=>media.removeEventListener('change',update);
  },[]);

  useEffect(()=>{
    const element=source.current,owner=element?.closest('.lesson-shell2__learning-column');
    const id=props.pageInteractionCompanionTargetId;
    if(!element||!owner||!id?.endsWith(binding.companionIdSuffix))return;
    const resolve=()=>{
      const target=element.ownerDocument.getElementById(id);
      const admitted=target?.parentElement===owner&&
        target.dataset.pageInteractionCompanionHost==='true'&&!element.contains(target)?target:null;
      setReadableTarget(previous=>previous===admitted?previous:admitted);
    };
    resolve();
    const observer=new MutationObserver(resolve);
    observer.observe(owner,{childList:true,subtree:true});
    return()=>observer.disconnect();
  },[props.pageInteractionCompanionTargetId,binding.companionIdSuffix]);

  const connectControls=useCallback((value:SourceLessonControls)=>{
    controls.current=value;
    const disconnect=props.connectRuntimeControls(value);
    return()=>{if(controls.current===value)controls.current=null;disconnect();};
  },[props.connectRuntimeControls]);

  const onSnapshot=useCallback((snapshot:SourceLessonSnapshot)=>{
    const paused=sourceLessonHostPaused(snapshot);
    const playback=sourceLessonHostPlayback(snapshot,contract.current);
    lastPaused.current=paused;
    // Replay first completes the host event; reflecting its intermediate flag
    // back into the player would cancel a pending SA load or explicit Return.
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

  const openGlossary=useCallback((key:Key,trigger:HTMLButtonElement)=>{
    const entries=contract.current.glossaryEntries;
    if(!Object.prototype.hasOwnProperty.call(entries,key)||glossary.current)return;
    const entryId=entries[key];glossary.current={seen:false,entryId};
    if(document.activeElement===trigger)trigger.blur();
    try {
      const request=latest.current.onLessonHostRequest?.({type:'open-glossary',entryId},{trigger});
      if(request?.status==='allowed')return;
    } catch(error) {
      glossary.current=null;controls.current?.closeGlossary();throw error;
    }
    glossary.current=null;controls.current?.closeGlossary();
  },[]);

  useEffect(()=>{
    const check=()=>{
      const pending=glossary.current;if(!pending)return;
      if(document.querySelector(`[role="dialog"][data-glossary-entry-id="${pending.entryId}"]`)) {
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

  return {source,readableTarget,reducedMotion,connectControls,onSnapshot,openGlossary};
}
