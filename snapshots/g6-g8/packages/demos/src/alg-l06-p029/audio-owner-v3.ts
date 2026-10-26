import {DecodedSourceStreamTransport,type DecodedSourceStreamBinding,
  type DecodedStreamResult} from '../decoded-source-stream-transport';
import {P029_AUDIO_MANIFEST} from './audio-schedule-v1';
import SOURCE_CUES from '../../../../migrations/shared-alg001-l06-p029/audio-v1/source-cues-v1.json';
import {p029Adpcm179EntryPolicy} from './adpcm179-entry-policy-v1';
import type {P029State} from './quiz-reducer-v1';
import {p029AudioIntent,P029_SOURCE} from './quiz-reducer-v1';

type Asset=(typeof P029_AUDIO_MANIFEST.embedded)[number]|typeof P029_AUDIO_MANIFEST.separateSa;
type Intent=NonNullable<ReturnType<typeof p029AudioIntent>>;
type Transport=Pick<DecodedSourceStreamTransport,'prepare'|'snapshot'|'seekDecodedSample'|
  'play'|'pause'|'setVolume'|'close'>;
const result=(accepted:boolean,reason:string):DecodedStreamResult=>Object.freeze({accepted,reason});
const hex=/^[a-f0-9]{64}$/u;
const embedded=(domain:string)=>P029_AUDIO_MANIFEST.embedded.find(a=>a.domain===domain);
type Block=readonly[number,number,number,number,number,number|null,number|null];
type Stream={readonly sourceSha256:string;readonly sampleRate:number;
  readonly decodedSamples:number;readonly initialLatencySamples:number;
  readonly blocks:readonly Block[]};
const streams=SOURCE_CUES.streams as unknown as Readonly<Record<string,Stream|undefined>>;
function mp3Cue(asset:Asset,frame:number,binding:DecodedSourceStreamBinding){
  if(!('domain' in asset)||asset.codec!=='mp3')throw Error('P029_MP3_CUE_DOMAIN_REQUIRED');
  const stream=streams[asset.domain];
  if(!stream||stream.sourceSha256!==asset.sourceSha256||
    stream.sampleRate!==binding.sampleRate||stream.decodedSamples!==binding.decodedSamples||
    SOURCE_CUES.physicalSwfSha256!==P029_SOURCE.swfSha256||
    SOURCE_CUES.sourceStructureSha256!==P029_SOURCE.structuralXmlSha256)
    throw Error(`P029_SOURCE_CUE_BINDING_MISMATCH:${asset.domain}`);
  const first=stream.blocks[0];
  if(first[0]!==asset.firstBlockFrame||first[6]!==stream.initialLatencySamples)
    throw Error(`P029_SOURCE_CUE_FIRST_BLOCK_MISMATCH:${asset.domain}`);
  if(frame<first[0])return {sample:stream.initialLatencySamples,
    delaySeconds:(first[0]-frame)/P029_AUDIO_MANIFEST.fps};
  const block=stream.blocks.find(b=>b[0]===frame);
  if(!block||block[6]===null)throw Error(`P029_SOURCE_CUE_UNRESOLVED:${asset.domain}:${frame}`);
  return {sample:block[6],delaySeconds:0};
}

/** All eight domains and optional SA share one reservation and one native
 * source owner. No locale callback or feedback selection bypasses that owner. */
export class P029AudioOwnerCueV3 {
  private ticket=0;
  private selected:{domain:string;epoch:number;frame:number}|null=null;
  private transport:Transport|null=null;
  private abort:AbortController|null=null;
  private disposal:Promise<void>=Promise.resolve();
  private closed=false;
  private volume=1;
  private failure:string|null=null;
  private spanish=false;
  constructor(private readonly options:{
    bindings:Readonly<Record<string,DecodedSourceStreamBinding|undefined>>;
    load:(asset:Asset,signal:AbortSignal)=>Promise<ArrayBuffer>;
    createTransport?:(binding:DecodedSourceStreamBinding)=>Transport;
    adpcm179EntryPolicy:ReturnType<typeof p029Adpcm179EntryPolicy>;
  }){}

  snapshot(){
    const audio=this.transport?.snapshot()??null;
    return Object.freeze({selected:this.selected?.domain??null,epoch:this.selected?.epoch??null,
      spanishSelected:this.spanish,phase:audio?.phase??(this.selected?'loading':'idle'),
      decodedSample:audio?.decodedSample??null,contextTime:audio?.contextTime??null,
      nativeEofObserved:audio?.phase==='buffer-ended',failure:this.failure,
      sourceAlignment:'unresolved' as const,originalRuntimeAccepted:false as const,
      audioAccepted:false as const,lessonCompleted:false as const});
  }
  private binding(asset:Asset):DecodedSourceStreamBinding{
    const key='domain' in asset?asset.domain:'separate-sa';
    const b=this.options.bindings[key];
    if(!b||b.sourceSha256!==asset.sourceSha256||b.sourceBytes!==asset.sourceBytes||
      b.sampleRate!==asset.sampleRate||b.channels!==asset.channels||
      !Number.isSafeInteger(b.decodedSamples)||b.decodedSamples<=0||!hex.test(b.pcmSha256))
      throw Error(`P029_BROWSER_PCM_BINDING_REQUIRED:${key}`);
    return b;
  }
  mainPrepared(){
    return !this.closed&&!this.spanish&&this.selected?.domain==='sprite-185'&&
      this.selected.frame===1&&
      ['ready','paused'].includes(this.transport?.snapshot().phase??'');
  }
  /** Run before Play so the user gesture enters transport.play synchronously. */
  async prepareMain():Promise<DecodedStreamResult>{
    if(this.closed||this.spanish)return result(false,'main-prepare-unavailable');
    if(this.mainPrepared())return result(true,'main-prepared');
    const asset=embedded('sprite-185')!;
    const cleanup=this.retire(),ticket=this.ticket;
    this.selected={domain:asset.domain,epoch:0,frame:1};
    try{
      const binding=this.binding(asset);
      await cleanup;
      if(ticket!==this.ticket)return result(false,'stale-main-prepare');
      const abort=new AbortController();this.abort=abort;
      const bytes=await this.options.load(asset,abort.signal);
      if(ticket!==this.ticket||abort.signal.aborted)return result(false,'stale-main-load');
      const transport=this.options.createTransport?.(binding)??new DecodedSourceStreamTransport(binding);
      this.transport=transport;
      const prepared=await transport.prepare(bytes);
      if(ticket!==this.ticket||this.transport!==transport)return result(false,'stale-main-decode');
      if(!prepared.accepted)throw Error(prepared.reason);
      transport.setVolume(this.volume);
      const first=mp3Cue(asset,1,binding);
      const seek=transport.seekDecodedSample(first.sample);
      if(!seek.accepted)throw Error(seek.reason);
      return result(true,'main-prepared');
    }catch(error){
      if(ticket!==this.ticket)return result(false,'stale-main-prepare');
      this.failure=error instanceof Error?error.message:String(error);
      await this.retire().catch(()=>{});
      return result(false,this.failure);
    }
  }
  /** Caller must invoke this in the actual user Play handler, before await. */
  startPreparedMain(epoch:number,delaySeconds=1/12):Promise<DecodedStreamResult>{
    if(!this.mainPrepared()||!Number.isSafeInteger(epoch)||
      !Number.isFinite(delaySeconds)||delaySeconds<0||delaySeconds>1/12)
      return Promise.resolve(result(false,'P029_MAIN_PRELOAD_REQUIRED'));
    this.selected!.epoch=epoch;
    // The prepared buffer and decoder cursor survive a frame-1 hold. Calling
    // play here enters AudioContext.resume in the actual user gesture.
    return this.transport!.play({activation:'user',reducedMotion:false,delaySeconds});
  }
  private retire():Promise<void>{
    this.ticket++;
    this.abort?.abort();this.abort=null;
    this.selected=null;
    const old=this.transport;this.transport=null;
    if(old){
      // close() invalidates and stops the native node before its first await.
      let closing:Promise<void>;
      try{closing=old.close();}catch(error){closing=Promise.reject(error);}
      this.disposal=Promise.all([this.disposal,closing]).then(()=>undefined);
      void this.disposal.catch(()=>{});
    }
    return this.disposal;
  }
  hold(reason='source-hold'):DecodedStreamResult{
    if(this.closed)return result(false,'closed');
    void this.retire();
    if(reason==='reducer-retired-audio')this.spanish=false;
    this.failure=null;
    return result(true,reason);
  }
  pause():DecodedStreamResult{
    if(this.closed)return result(false,'closed');
    const phase=this.transport?.snapshot().phase;
    if(phase==='playing'||phase==='start-pending')
      return this.transport!.pause();
    if(this.selected&&(!this.transport||phase==='loading'||
      (this.spanish&&phase==='ready'))){const spanish=this.spanish;void this.retire();
      if(spanish)this.spanish=false;return result(true,'loading-canceled');}
    return result(true,'already-held');
  }
  async sync(state:P029State,activation:'user'|'automatic'='automatic'):
    Promise<DecodedStreamResult>{
    if(this.closed)return result(false,'closed');
    if(this.spanish)return result(false,'explicit-spanish-return-required');
    const intent=p029AudioIntent(state);
    if(!intent){this.hold();return result(true,'source-domain-held');}
    const asset=embedded(intent.domain);
    if(!asset||asset.codec!==intent.codec)return result(false,'P029_AUDIO_DOMAIN_MISMATCH');
    if(this.selected?.domain===intent.domain&&this.selected.epoch===intent.epoch&&this.transport){
      this.selected.frame=intent.frame;
      if(['paused','interrupted','play-rejected'].includes(this.transport.snapshot().phase))
        return this.transport.play({activation,reducedMotion:false});
      return result(true,'source-domain-already-owned');
    }
    const cleanup=this.retire(),ticket=this.ticket;
    this.selected={domain:intent.domain,epoch:intent.epoch,frame:intent.frame};
    this.failure=null;
    try{
      const binding=this.binding(asset);
      await cleanup;
      if(ticket!==this.ticket||this.closed)return result(false,'stale-retirement');
      const abort=new AbortController();this.abort=abort;
      const bytes=await this.options.load(asset,abort.signal);
      if(ticket!==this.ticket||abort.signal.aborted)return result(false,'stale-load');
      const transport=this.options.createTransport?.(binding)??
        new DecodedSourceStreamTransport(binding);
      this.transport=transport;
      const prepared=await transport.prepare(bytes);
      if(ticket!==this.ticket||this.transport!==transport)return result(false,'stale-decode');
      if(!prepared.accepted)throw Error(prepared.reason);
      transport.setVolume(this.volume);
      let cue:{sample:number;delaySeconds:number};
      if(asset.codec==='mp3')cue=mp3Cue(asset,intent.frame,binding);
      else{
        if(asset.domain!=='sprite-179'||intent.frame!==2)
          throw Error(`P029_ADPCM_ENTRY_UNRESOLVED:${asset.domain}:${intent.frame}`);
        const expected=p029Adpcm179EntryPolicy(binding),policy=this.options.adpcm179EntryPolicy;
        if(!policy||policy.entryFrame!==expected.entryFrame||
          policy.decodedSample!==expected.decodedSample||
          policy.evidenceRef!==expected.evidenceRef)
          throw Error('P029_ADPCM179_ENTRY_POLICY_MISMATCH');
        cue={sample:policy.decodedSample,delaySeconds:0};
      }
      const seek=transport.seekDecodedSample(cue.sample);
      if(!seek.accepted)throw Error(seek.reason);
      const played=await transport.play({activation,reducedMotion:false,
        delaySeconds:cue.delaySeconds});
      if(ticket!==this.ticket||this.transport!==transport)return result(false,'stale-start');
      if(!played.accepted)throw Error(played.reason);
      return result(true,`playing:${intent.domain}`);
    }catch(error){
      if(ticket!==this.ticket)return result(false,'stale-load');
      this.failure=error instanceof Error?error.message:String(error);
      await this.retire().catch(()=>{});
      return result(false,this.failure);
    }
  }
  async startSeparateSpanish(activation:'user'):Promise<DecodedStreamResult>{
    if(activation!=='user')return result(false,'explicit-user-spanish-start-required');
    if(this.closed||this.spanish)return result(false,'spanish-unavailable');
    const asset=P029_AUDIO_MANIFEST.separateSa;
    const cleanup=this.retire(),ticket=this.ticket;
    this.spanish=true;this.selected={domain:'separate-sa',epoch:ticket,frame:0};
    try{
      const binding=this.binding(asset);
      await cleanup;
      if(ticket!==this.ticket||this.closed)return result(false,'stale-spanish-retirement');
      const abort=new AbortController();this.abort=abort;
      const bytes=await this.options.load(asset,abort.signal);
      if(ticket!==this.ticket||abort.signal.aborted)return result(false,'stale-spanish-load');
      const transport=this.options.createTransport?.(binding)??new DecodedSourceStreamTransport(binding);
      this.transport=transport;
      const prepared=await transport.prepare(bytes);
      if(ticket!==this.ticket||this.transport!==transport)return result(false,'stale-spanish-decode');
      if(!prepared.accepted)throw Error(prepared.reason);
      transport.setVolume(this.volume);
      const played=await transport.play({activation:'user',reducedMotion:false});
      if(ticket!==this.ticket||this.transport!==transport)return result(false,'stale-spanish-start');
      if(!played.accepted)throw Error(played.reason);
      return result(true,'separate-spanish-playing');
    }catch(error){
      if(ticket!==this.ticket)return result(false,'stale-spanish-load');
      this.failure=error instanceof Error?error.message:String(error);
      await this.retire().catch(()=>{});this.spanish=false;
      return result(false,this.failure);
    }
  }
  /** The held SA buffer and decoder cursor survive Pause. Enter the prepared
   * transport synchronously in the actual user handler; never reload or seek. */
  resumeSeparateSpanish():Promise<DecodedStreamResult>{
    if(this.closed||!this.spanish||this.selected?.domain!=='separate-sa'||
      !this.transport||!['paused','interrupted','play-rejected'].includes(
        this.transport.snapshot().phase))
      return Promise.resolve(result(false,'spanish-resume-unavailable'));
    const transport=this.transport,ticket=this.ticket;
    return transport.play({activation:'user',reducedMotion:false}).then(played=>{
      if(ticket!==this.ticket||this.transport!==transport||!this.spanish)
        return result(false,'stale-spanish-resume');
      if(!played.accepted)this.failure=played.reason;
      else this.failure=null;
      return played;
    });
  }
  async returnMain(state:P029State):Promise<DecodedStreamResult>{
    if(!this.spanish)return result(false,'spanish-not-selected');
    const cleanup=this.retire(),ticket=this.ticket;
    await cleanup;
    if(ticket!==this.ticket||this.closed)return result(false,'stale-spanish-return');
    this.spanish=false;
    // Return is held. An explicit host Play/sync chooses the current main cursor.
    return result(true,p029AudioIntent(state)?'main-held-for-explicit-resume':'main-held');
  }
  setVolume(value:number):DecodedStreamResult{
    if(this.closed||!Number.isFinite(value)||value<0||value>1)return result(false,'invalid-volume');
    this.volume=value;this.transport?.setVolume(value);return result(true,'volume-set');
  }
  async close():Promise<void>{
    if(this.closed){await this.disposal;return;}
    this.closed=true;await this.retire();this.spanish=false;
  }
}
