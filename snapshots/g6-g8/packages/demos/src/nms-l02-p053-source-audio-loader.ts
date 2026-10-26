export const P053_SOURCE_AUDIO_BYTES=256230;
export const P053_SOURCE_AUDIO_SHA256=
  '225177c9c27670c636ce383e0ec58e439888b14afa33427a53c14ff1ca7a4e7d';
export const P053_SOURCE_AUDIO_URL=
  `/flash-assets/g678-local/shared-nms002-l02-p053/source-audio?sha256=${P053_SOURCE_AUDIO_SHA256}`;

export type P053SourceAudioStatus='idle'|'loading'|'playing'|'paused'|'ended'|'error'|'disposed';
export type P053SourceAudioState=Readonly<{
  status:P053SourceAudioStatus;
  playing:boolean;
  volume:number;
}>;
export interface P053SourceAudioDependencies {
  load(signal:AbortSignal):Promise<Blob>;
  createUrl(blob:Blob):string;
  revokeUrl(url:string):void;
  createAudio(url:string):HTMLAudioElement;
}

export interface P053SourceAudioTransport {
  fetch:(input:RequestInfo|URL,init?:RequestInit)=>Promise<Response>;
  origin:()=>string;
}

const localHosts=new Set(['127.0.0.1','localhost','[::1]']);
const digest=async(bytes:Uint8Array)=>{
  const exact=new ArrayBuffer(bytes.byteLength);
  new Uint8Array(exact).set(bytes);
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',exact))]
    .map(value=>value.toString(16).padStart(2,'0')).join('');
};

/** Full source-order MP3 bytes; the decoded file duration is not a sprite clock. */
export async function loadP053SourceAudio(signal:AbortSignal,
  transport:P053SourceAudioTransport={fetch:(input,init)=>globalThis.fetch(input,init),
    origin:()=>location.origin}):Promise<Blob>{
  signal.throwIfAborted();
  const origin=new URL(transport.origin());
  if(origin.protocol!=='http:'||!localHosts.has(origin.hostname)||
    origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)
    throw Error('P053_AUDIO_LOCAL_ONLY');
  const url=new URL(P053_SOURCE_AUDIO_URL,origin);
  const response=await transport.fetch(url,{method:'GET',signal,cache:'no-store',
    credentials:'same-origin',redirect:'error'});
  signal.throwIfAborted();
  if(!response.ok||response.status!==200||response.redirected||response.url!==url.href||
    response.headers.get('content-type')!=='audio/mpeg'||
    response.headers.get('content-length')!==String(P053_SOURCE_AUDIO_BYTES)){
    await response.body?.cancel().catch(()=>{});
    throw Error('P053_AUDIO_RESPONSE');
  }
  const reader=response.body?.getReader();
  if(!reader)throw Error('P053_AUDIO_BODY');
  const bytes=new Uint8Array(P053_SOURCE_AUDIO_BYTES);let offset=0;
  try{
    for(;;){
      signal.throwIfAborted();
      const {done,value}=await reader.read();
      signal.throwIfAborted();
      if(done)break;
      if(offset+value.byteLength>bytes.length)throw Error('P053_AUDIO_SIZE');
      bytes.set(value,offset);offset+=value.byteLength;
    }
    if(offset!==bytes.length)throw Error('P053_AUDIO_SIZE');
    if(await digest(bytes)!==P053_SOURCE_AUDIO_SHA256)throw Error('P053_AUDIO_HASH');
    signal.throwIfAborted();
    return new Blob([bytes],{type:'audio/mpeg'});
  }finally{
    await reader.cancel().catch(()=>{});
    reader.releaseLock();
  }
}

const browserDependencies:P053SourceAudioDependencies={
  load:loadP053SourceAudio,
  createUrl:blob=>URL.createObjectURL(blob),
  revokeUrl:url=>URL.revokeObjectURL(url),
  createAudio:url=>new Audio(url),
};

/** Explicit learner-triggered narration transport; no construction-time fetch/play. */
export class P053SourceAudioSession {
  private generation=0;
  private playEpoch=0;
  private controller:AbortController|null=null;
  private clip:HTMLAudioElement|null=null;
  private objectUrl:string|null=null;
  private desiredPlaying=false;
  private closed=false;
  private state:P053SourceAudioState={status:'idle',playing:false,volume:1};

  constructor(private readonly deps:P053SourceAudioDependencies=browserDependencies,
    private readonly onState:(state:P053SourceAudioState)=>void=()=>{}){}

  getState():P053SourceAudioState{return this.state;}

  private publish(status:P053SourceAudioStatus,playing:boolean){
    this.state=Object.freeze({status,playing,volume:this.state.volume});
    if(!this.closed)this.onState(this.state);
  }

  private release(){
    const clip=this.clip,url=this.objectUrl;
    this.clip=null;this.objectUrl=null;
    if(clip){
      clip.onplay=clip.onpause=clip.onended=clip.onerror=null;
      clip.pause();
      clip.currentTime=0;
      clip.removeAttribute('src');
      clip.load();
    }
    if(url)this.deps.revokeUrl(url);
  }

  /** Stop is recoverable: a later explicit play creates a fresh attempt. */
  stop(){
    if(this.closed)return;
    this.generation++;this.playEpoch++;this.desiredPlaying=false;
    this.controller?.abort();this.controller=null;
    this.release();this.publish('idle',false);
  }

  pause(){
    if(this.closed)return;
    this.playEpoch++;this.desiredPlaying=false;
    if(this.controller){
      this.generation++;this.controller.abort();this.controller=null;
    }
    this.clip?.pause();
    this.publish('paused',false);
  }

  setVolume(value:number){
    if(this.closed)return;
    const volume=Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;
    this.state=Object.freeze({...this.state,volume});
    if(this.clip)this.clip.volume=volume;
    this.onState(this.state);
  }

  async play():Promise<boolean>{
    if(this.closed)return false;
    if(this.controller)return false;
    const generation=this.clip?this.generation:++this.generation;
    const attempt=++this.playEpoch;
    this.desiredPlaying=true;
    let clip=this.clip;
    if(!clip){
      const controller=new AbortController();
      this.controller=controller;
      this.publish('loading',false);
      try{
        const blob=await this.deps.load(controller.signal);
        if(this.closed||generation!==this.generation||controller.signal.aborted)return false;
        const url=this.deps.createUrl(blob);
        if(this.closed||generation!==this.generation||controller.signal.aborted){
          this.deps.revokeUrl(url);return false;
        }
        try{clip=this.deps.createAudio(url);}
        catch(error){this.deps.revokeUrl(url);throw error;}
        if(this.closed||generation!==this.generation||controller.signal.aborted){
          clip.pause();clip.removeAttribute('src');clip.load();this.deps.revokeUrl(url);
          return false;
        }
        clip.preload='auto';clip.volume=this.state.volume;
        this.clip=clip;this.objectUrl=url;
        const current=clip;
        current.onplay=()=>{
          if(this.clip!==current||generation!==this.generation)return;
          if(!this.desiredPlaying){current.pause();return;}
          this.publish('playing',true);
        };
        current.onpause=()=>{
          if(this.clip===current&&generation===this.generation&&!this.desiredPlaying)
            this.publish('paused',false);
        };
        current.onended=()=>{
          if(this.clip===current&&generation===this.generation&&this.desiredPlaying){
            this.desiredPlaying=false;this.playEpoch++;
            this.publish('ended',false);
          }
        };
        current.onerror=()=>{
          if(this.clip===current&&generation===this.generation){
            this.desiredPlaying=false;this.playEpoch++;
            this.release();this.publish('error',false);
          }
        };
      }catch{
        if(!this.closed&&generation===this.generation){
          this.desiredPlaying=false;this.release();this.publish('error',false);
        }
        return false;
      }finally{
        if(this.controller===controller)this.controller=null;
      }
    }
    if(!clip||this.closed||generation!==this.generation||!this.desiredPlaying)return false;
    if(this.state.status==='ended')clip.currentTime=0;
    try{
      await clip.play();
      if(this.closed||generation!==this.generation||attempt!==this.playEpoch||
        this.clip!==clip||!this.desiredPlaying){
        if(this.clip!==clip||!this.desiredPlaying)clip.pause();
        return false;
      }
      this.publish('playing',true);return true;
    }catch{
      if(!this.closed&&generation===this.generation&&attempt===this.playEpoch){
        this.desiredPlaying=false;
        this.publish('error',false);
      }
      return false;
    }
  }

  dispose(){
    if(this.closed)return;
    this.stop();this.publish('disposed',false);this.closed=true;
  }
}

export function createP053SourceAudioLoader(deps?:P053SourceAudioDependencies,
  onState?:(state:P053SourceAudioState)=>void):P053SourceAudioSession{
  return new P053SourceAudioSession(deps,onState);
}
