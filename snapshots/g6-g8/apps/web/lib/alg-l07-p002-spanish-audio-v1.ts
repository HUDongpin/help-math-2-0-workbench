import {DecodedSourceStreamTransport,type DecodedSourceStreamBinding} from '../../../packages/demos/src/decoded-source-stream-transport';

/** Static source-host binding and Chrome154 decode are preserved in the page audit. */
export const P002_SA_BINDING:DecodedSourceStreamBinding=Object.freeze({
 sourceBytes:342384,sourceSha256:'1bbe047ac9df1f924560264c03525304c80248dee73a29776aa5f43c73e9f667',
 sampleRate:48000,channels:1,decodedSamples:1173888,pcmSha256:'d8cad874cd84307062a6d9136dc730e67b1bf6066ce3035c7c938d2bfe29fafa',
});
type Transport=Pick<DecodedSourceStreamTransport,'snapshot'|'subscribe'|'prepare'|'play'|'pause'|'setVolume'|'close'>;
export type P002SpanishSnapshot=Readonly<{phase:'idle'|'loading'|'playing'|'paused'|'ended'|'failed'|'closed';failure:string|null;lessonCompleted:false}>;
type Options={load:(signal:AbortSignal)=>Promise<ArrayBuffer>;changed:(snapshot:P002SpanishSnapshot)=>void;ended:()=>void;
 makeTransport?:(binding:DecodedSourceStreamBinding)=>Transport};

/** A separate source-sidecar operation. Each explicit Play starts at sample0;
 * Pause cancels pending reads, and construction/locale cannot initiate playback. */
export class P002SpanishAudio {
 private phase:P002SpanishSnapshot['phase']='idle';private failure:string|null=null;
 private epoch=0;private volume=1;private abort:AbortController|undefined;
 private transport:Transport|undefined;private unsubscribe:(()=>void)|undefined;
 private disposal:Promise<void>=Promise.resolve();
 constructor(private readonly options:Options){}
 snapshot():P002SpanishSnapshot{return Object.freeze({phase:this.phase,failure:this.failure,lessonCompleted:false});}
 private emit(){this.options.changed(this.snapshot());}
 private retire(){
  this.abort?.abort();this.abort=undefined;this.unsubscribe?.();this.unsubscribe=undefined;
  const old=this.transport;this.transport=undefined;
  if(old){this.disposal=Promise.all([this.disposal,old.close()]).then(()=>undefined);void this.disposal.catch(()=>{});}
  return this.disposal;
 }
 private fail(error:unknown){this.epoch++;void this.retire();this.phase='failed';this.failure=error instanceof Error?error.message:String(error);this.emit();return false;}
 async start(activation:'user'){
  if(activation!=='user'||this.phase==='closed'||this.phase==='loading'||this.phase==='playing')return false;
  const ticket=++this.epoch,cleanup=this.retire();this.phase='loading';this.failure=null;this.emit();
  try{
   await cleanup;if(ticket!==this.epoch)return false;
   const abort=new AbortController();this.abort=abort;const bytes=await this.options.load(abort.signal);
   if(ticket!==this.epoch||abort.signal.aborted)return false;
   const transport=(this.options.makeTransport??(binding=>new DecodedSourceStreamTransport(binding)))(P002_SA_BINDING);
   this.transport=transport;transport.setVolume(this.volume);
   this.unsubscribe=transport.subscribe(()=>{
    if(this.transport!==transport)return;
    const native=transport.snapshot();
    if(native.phase==='buffer-ended'){
     const endedEpoch=this.epoch;this.phase='ended';const retired=this.retire();this.emit();
     void retired.then(()=>{if(endedEpoch===this.epoch&&this.phase==='ended')this.options.ended();}).catch(e=>{if(endedEpoch===this.epoch)this.fail(e);});
    }else if(['failed','closed','play-rejected'].includes(native.phase))this.fail(native.failure??native.phase);
    else if(native.phase==='interrupted')this.pause();
    else if(native.phase==='playing'){this.phase='playing';this.emit();}
   });
   const prepared=await transport.prepare(bytes);if(ticket!==this.epoch||this.transport!==transport)return false;
   if(!prepared.accepted)throw Error(prepared.reason);
   const started=await transport.play({activation:'user',reducedMotion:false});
   if(ticket!==this.epoch||this.transport!==transport)return false;if(!started.accepted)throw Error(started.reason);
   this.phase='playing';this.emit();return true;
  }catch(error){if(ticket!==this.epoch)return false;return this.fail(error);}
 }
 pause(){if(this.phase==='closed')return;this.epoch++;void this.retire();this.phase='paused';this.failure=null;this.emit();}
 stop(){if(this.phase==='closed')return;this.epoch++;void this.retire();this.phase='idle';this.failure=null;this.emit();}
 async stopAndWait(){this.stop();await this.disposal;}
 setVolume(value:number){if(this.phase==='closed'||!Number.isFinite(value)||value<0||value>1)return;this.volume=value;this.transport?.setVolume(value);}
 async close(){if(this.phase!=='closed'){this.epoch++;const retired=this.retire();this.phase='closed';this.failure=null;this.emit();await retired;}else await this.disposal;}
}
