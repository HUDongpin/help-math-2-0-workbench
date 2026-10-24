import {DecodedSourceStreamTransport,type DecodedStreamResult,
  type DecodedSourceStreamBinding} from './decoded-source-stream-transport';
import {P027_SA_ASSET} from './alg-l06-p027-audio-schedule-v1';
import {loadP027SeparateSaSource} from './alg-l06-p027-audio-source-v1';

export type P027OptionalSpanishAudioSnapshot=Readonly<{
  phase:'idle'|'loading'|'playing'|'paused'|'ended'|'error'|'closed';
  volume:number;failure:string|null;lessonCompleted:false;
}>;
const result=(accepted:boolean,reason:string):DecodedStreamResult=>Object.freeze({accepted,reason});
/** Independent source SA. Locale never invokes start; the page owner holds
 * the one main range before this explicit user action and awaits retirement
 * before Return. A browser PCM binding is injected, never a native CLI hash. */
export class P027OptionalSpanishAudio {
  private phase:P027OptionalSpanishAudioSnapshot['phase']='idle';
  private volume=1;
  private failure:string|null=null;
  private epoch=0;
  private abort?:AbortController;
  private transport?:DecodedSourceStreamTransport;
  private unsubscribe?:()=>void;
  private disposal:Promise<void>=Promise.resolve();
  private readonly options:{
    binding:DecodedSourceStreamBinding;
    onChange:(snapshot:P027OptionalSpanishAudioSnapshot)=>void;
    onEnded:()=>void;
    load?:(signal:AbortSignal)=>Promise<ArrayBuffer>;
    createContext?:()=>AudioContext;
  };
  constructor(options:P027OptionalSpanishAudio['options']){
    const b=options.binding;
    if(!b||b.sourceSha256!==P027_SA_ASSET.sourceSha256||
      b.sourceBytes!==P027_SA_ASSET.sourceBytes||
      b.sampleRate!==P027_SA_ASSET.sampleRate||b.channels!==P027_SA_ASSET.channels||
      !Number.isSafeInteger(b.decodedSamples)||b.decodedSamples<=0||
      !/^[a-f0-9]{64}$/u.test(b.pcmSha256))
      throw Error('P027_SA_BROWSER_BINDING_MISSING_OR_MISMATCH');
    this.options={...options,binding:b};
  }
  snapshot():P027OptionalSpanishAudioSnapshot{
    return Object.freeze({phase:this.phase,volume:this.volume,failure:this.failure,
      lessonCompleted:false});
  }
  private emit(){try{this.options.onChange(this.snapshot());}catch{/* Host observer failure cannot retain sound. */}}
  private retire():Promise<void>{
    this.abort?.abort();this.abort=undefined;
    this.unsubscribe?.();this.unsubscribe=undefined;
    const old=this.transport;this.transport=undefined;
    if(old){
      let closed:Promise<void>;
      try{closed=old.close();}catch(error){closed=Promise.reject(error);}
      this.disposal=Promise.all([this.disposal,closed]).then(()=>undefined);
      void this.disposal.catch(()=>{});
    }
    return this.disposal;
  }
  private cancel(phase:P027OptionalSpanishAudioSnapshot['phase']):DecodedStreamResult{
    if(this.phase==='closed')return result(false,'closed');
    this.epoch++;void this.retire();this.phase=phase;this.failure=null;this.emit();
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
      const bytes=await (this.options.load??loadP027SeparateSaSource)(abort.signal);
      if(ticket!==this.epoch||abort.signal.aborted)return result(false,'stale-load');
      const transport=new DecodedSourceStreamTransport(this.options.binding!,
        {createContext:this.options.createContext});
      this.transport=transport;transport.setVolume(this.volume);
      this.unsubscribe=transport.subscribe(()=>{
        if(ticket!==this.epoch||this.transport!==transport)return;
        const snapshot=transport.snapshot();
        if(snapshot.phase==='buffer-ended'&&this.phase==='playing'){
          this.phase='ended';const retired=this.retire();this.emit();
          void retired.then(()=>{
            if(ticket!==this.epoch||this.phase!=='ended')return;
            try{this.options.onEnded();}catch{/* Callback cannot retain source. */}
          }).catch(error=>{
            if(ticket!==this.epoch)return;
            this.phase='error';this.failure=String(error);this.emit();
          });
        }else if(snapshot.phase==='interrupted')this.cancel('paused');
        else if(snapshot.phase==='closed'){
          this.epoch++;void this.retire();this.phase='error';
          this.failure='P027_OPTIONAL_SA_CONTEXT_CLOSED';this.emit();
        }else if(snapshot.phase==='playing'){
          this.phase='playing';this.emit();
        }
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
      void this.retire();this.phase='error';
      this.failure=error instanceof Error?error.message:String(error);this.emit();
      return result(false,this.failure);
    }
  }
  pause(){return this.cancel('paused');}
  stop(){return this.cancel('idle');}
  async stopAndWait(){this.stop();await this.disposal;}
  setVolume(value:number):DecodedStreamResult{
    if(this.phase==='closed'||!Number.isFinite(value)||value<0||value>1)
      return result(false,'invalid-volume');
    this.volume=value;this.transport?.setVolume(value);this.emit();
    return result(true,'volume-set');
  }
  async close(){
    if(this.phase!=='closed'){
      this.epoch++;const cleanup=this.retire();this.phase='closed';
      this.failure=null;this.emit();await cleanup;
    }else await this.disposal;
  }
}
