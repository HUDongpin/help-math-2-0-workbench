import {DecodedSourceStreamTransport,type DecodedStreamPhase,
  type DecodedStreamResult,type DecodedSourceStreamBinding}
 from './decoded-source-stream-transport';

/** The separate, physical SA/L6IN06.mp3 and its measured Chromium PCM. */
export const P034_SA_ASSET=Object.freeze({
  sourceBytes:438816,
  sourceSha256:'2bebaa57aee0e80591e80cd542dc98f51839593820c9ec16d6a720dbfd9dab30',
  sampleRate:48000,channels:1,decodedSamples:1504512,
  pcmSha256:'dea44bb9bbc761714b74a6b90f402bc5dcba6aa8b334898e36fe67e6a5c84b61',
});
export type P034OptionalSpanishAudioSnapshot=Readonly<{
  phase:'idle'|'loading'|'start-pending'|'playing'|'paused'|'ended'|'error'|'closed';
  volume:number;failure:string|null;lessonCompleted:false;
  canResume:boolean;decodedSample:number|null;nativePhase:DecodedStreamPhase|null;
}>;
type SpanishTransport=Pick<DecodedSourceStreamTransport,
 'snapshot'|'subscribe'|'prepare'|'play'|'pause'|'setVolume'|'close'>;
type Options={
  binding:DecodedSourceStreamBinding;
  /** The caller must supply a bounded, source-pinned SA loader. */
  load:(signal:AbortSignal)=>Promise<ArrayBuffer>;
  onChange:(snapshot:P034OptionalSpanishAudioSnapshot)=>void;
  onEnded:()=>void;
  createContext?:()=>AudioContext;
  createTransport?:(binding:DecodedSourceStreamBinding,
    options:{createContext?:()=>AudioContext})=>SpanishTransport;
};
const result=(accepted:boolean,reason:string):DecodedStreamResult=>Object.freeze({accepted,reason});
const message=(error:unknown)=>error instanceof Error?error.message:String(error);

/** Independent optional recording. Locale and construction never start it.
 * One retained transport/buffer supports user Pause→Play at its positive cursor. */
export class P034OptionalSpanishAudio {
  private phase:P034OptionalSpanishAudioSnapshot['phase']='idle';
  private volume=1;
  private failure:string|null=null;
  private epoch=0;
  private abort?:AbortController;
  private transport?:SpanishTransport;
  private unsubscribe?:()=>void;
  private disposal:Promise<void>=Promise.resolve();
  constructor(private readonly options:Options){
    const b=options.binding;
    if(!b||typeof options.load!=='function'||
      b.sourceSha256!==P034_SA_ASSET.sourceSha256||
      b.sourceBytes!==P034_SA_ASSET.sourceBytes||
      b.sampleRate!==P034_SA_ASSET.sampleRate||
      b.channels!==P034_SA_ASSET.channels||
      b.decodedSamples!==P034_SA_ASSET.decodedSamples||
      b.pcmSha256!==P034_SA_ASSET.pcmSha256)
      throw Error('P034_SA_BROWSER_BINDING_OR_LOADER_MISSING');
  }
  snapshot():P034OptionalSpanishAudioSnapshot{
    const native=this.transport?.snapshot()??null;
    return Object.freeze({phase:this.phase,volume:this.volume,failure:this.failure,
      lessonCompleted:false,
      canResume:this.phase==='paused'&&native?.phase==='paused'&&
        native.decodedSample>0&&native.decodedSample<this.options.binding.decodedSamples,
      decodedSample:native?.decodedSample??null,nativePhase:native?.phase??null});
  }
  private emit(){
    try{this.options.onChange(this.snapshot());}
    catch{
      if(this.phase!=='closed'&&this.phase!=='error'){
        this.epoch++;void this.retire();this.phase='error';
        this.failure='P034_OPTIONAL_SA_OBSERVER_FAILED';
      }
    }
  }
  private retire():Promise<void>{
    this.abort?.abort();this.abort=undefined;
    try{this.unsubscribe?.();}catch{/* Still close the active transport. */}
    this.unsubscribe=undefined;
    const old=this.transport;this.transport=undefined;
    if(old){
      let closed:Promise<void>;
      try{closed=old.close();}catch(error){closed=Promise.reject(error);}
      this.disposal=Promise.all([this.disposal,closed]).then(()=>undefined);
      void this.disposal.catch(()=>{});
    }
    return this.disposal;
  }
  private fail(error:unknown):DecodedStreamResult{
    this.epoch++;void this.retire();this.phase='error';
    this.failure=message(error);this.emit();return result(false,this.failure);
  }
  private cancel(phase:P034OptionalSpanishAudioSnapshot['phase']):DecodedStreamResult{
    if(this.phase==='closed')return result(false,'closed');
    this.epoch++;const ticket=this.epoch,cleanup=this.retire();
    this.phase=phase;this.failure=null;this.emit();
    void cleanup.catch(error=>{if(ticket===this.epoch)this.fail(error);});
    return result(true,`optional-sa-${phase}`);
  }
  async start(policy:{activation:'user'}):Promise<DecodedStreamResult>{
    if(!policy||policy.activation!=='user')return result(false,'explicit-user-start-required');
    if(this.phase==='closed')return result(false,'closed');
    if(this.phase==='playing')return result(true,'already-playing');
    const ticket=++this.epoch,cleanup=this.retire();
    this.phase='loading';this.failure=null;this.emit();
    try{
      await cleanup;
      if(ticket!==this.epoch)return result(false,'stale-start');
      const abort=new AbortController();this.abort=abort;
      const bytes=await this.options.load(abort.signal);
      if(ticket!==this.epoch||abort.signal.aborted)return result(false,'stale-load');
      const transport=(this.options.createTransport??((binding,options)=>
        new DecodedSourceStreamTransport(binding,options)))(this.options.binding,
        {createContext:this.options.createContext});
      this.transport=transport;
      const volumeSet=transport.setVolume(this.volume);
      if(!volumeSet.accepted)throw Error(volumeSet.reason);
      this.unsubscribe=transport.subscribe(()=>{
        try{
        if(this.transport!==transport)return;
        const native=transport.snapshot();
        if(native.phase==='buffer-ended'&&this.phase==='playing'&&
          native.decodedSample===this.options.binding.decodedSamples){
          const endEpoch=this.epoch;
          this.phase='ended';const retired=this.retire();this.emit();
          void retired.then(()=>{
            if(endEpoch!==this.epoch||this.phase!=='ended')return;
            try{this.options.onEnded();}catch{/* Callback cannot retain source. */}
          }).catch(error=>{if(endEpoch===this.epoch)this.fail(error);});
        }else if(native.phase==='interrupted')this.cancel('paused');
        else if(native.phase==='closed')this.fail('P034_OPTIONAL_SA_CONTEXT_CLOSED');
        else if((native.phase==='failed'||native.phase==='play-rejected')&&
          (this.phase==='playing'||this.phase==='paused'))
          this.fail(native.failure??'P034_OPTIONAL_SA_NATIVE_FAILURE');
        else if(native.phase==='playing'){
          this.phase='playing';this.emit();
        }else if(native.phase==='start-pending'){
          this.phase='start-pending';this.emit();
        }
        }catch(error){this.fail(error);}
      });
      const prepared=await transport.prepare(bytes);
      if(ticket!==this.epoch||this.transport!==transport)return result(false,'stale-load');
      if(!prepared.accepted)throw Error(prepared.reason);
      const played=await transport.play({activation:'user',reducedMotion:false});
      if(ticket!==this.epoch||this.transport!==transport)return result(false,'stale-start');
      if(!played.accepted)throw Error(played.reason);
      return result(true,'optional-sa-playing-from-zero');
    }catch(error){
      if(ticket!==this.epoch)return result(false,'stale-start');
      return this.fail(error);
    }
  }
  pause():DecodedStreamResult{
    if(this.phase==='closed')return result(false,'closed');
    const transport=this.transport;
    let native:ReturnType<SpanishTransport['snapshot']>|undefined;
    try{native=transport?.snapshot();}catch(error){return this.fail(error);}
    if(transport&&(native?.phase==='playing'||native?.phase==='start-pending')){
      const ticket=++this.epoch; // Retire pending start completion, retain buffer.
      try{
        const held=transport.pause();
        if(!held.accepted)return this.fail(held.reason);
      }catch(error){return this.fail(error);}
      this.phase='paused';this.failure=null;this.emit();
      if(ticket!==this.epoch)
        return result(false,this.failure??'P034_OPTIONAL_SA_OBSERVER_FAILED');
      return result(true,'optional-sa-paused');
    }
    if(this.phase==='paused'&&native?.phase==='paused')return result(true,'optional-sa-paused');
    return this.cancel('paused'); // Loading is aborted and retired.
  }
  async resume(policy:{activation:'user'}):Promise<DecodedStreamResult>{
    if(!policy||policy.activation!=='user')return result(false,'explicit-user-resume-required');
    if(this.phase==='closed')return result(false,'closed');
    const transport=this.transport;
    if(!transport||!this.snapshot().canResume)return result(false,'optional-sa-not-resumable');
    const ticket=++this.epoch;
    this.phase='start-pending';this.failure=null;this.emit();
    if(ticket!==this.epoch)return result(false,this.failure??'P034_OPTIONAL_SA_OBSERVER_FAILED');
    try{
      const played=await transport.play({activation:'user',reducedMotion:false});
      if(ticket!==this.epoch||this.transport!==transport)return result(false,'stale-resume');
      if(!played.accepted)return this.fail(played.reason);
      this.phase='playing';this.emit();
      return result(true,'optional-sa-resumed');
    }catch(error){
      if(ticket!==this.epoch||this.transport!==transport)return result(false,'stale-resume');
      return this.fail(error);
    }
  }
  stop(){return this.cancel('idle');}
  async stopAndWait(){this.stop();await this.disposal;}
  setVolume(value:number):DecodedStreamResult{
    if(this.phase==='closed'||!Number.isFinite(value)||value<0||value>1)
      return result(false,'invalid-volume');
    try{
      const updated=this.transport?.setVolume(value);
      if(updated&&!updated.accepted)return this.fail(updated.reason);
      this.volume=value;this.emit();
      return this.phase==='error'?result(false,this.failure??'P034_OPTIONAL_SA_OBSERVER_FAILED'):
        result(true,'volume-set');
    }catch(error){return this.fail(error);}
  }
  async close(){
    if(this.phase!=='closed'){
      this.epoch++;const cleanup=this.retire();this.phase='closed';
      this.failure=null;this.emit();await cleanup;
    }else await this.disposal;
  }
}
