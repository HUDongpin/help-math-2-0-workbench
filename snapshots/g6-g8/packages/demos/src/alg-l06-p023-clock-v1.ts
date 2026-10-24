import {DecodedSourceStreamTransport,type DecodedSourceStreamBinding,type DecodedStreamResult}
  from './decoded-source-stream-transport';
import {P023_AUDIO_ASSETS,P023_AUDIO_DISPOSITION,P023_AUDIO_END_POSITION,p023AudioSlice,
  type P023AudioId} from './alg-l06-p023-audio-schedule-v1';
import {P023_TIMELINE,p023TimelineState,type P023TimelineGlossaryKey}
  from './alg-l06-p023-timeline-v1';

type Transport=Pick<DecodedSourceStreamTransport,
  'prepare'|'snapshot'|'subscribe'|'seekDecodedSample'|'play'|'pause'|'replay'|
  'holdSourceBoundary'|'setVolume'|'close'>;
type Phase='idle'|'loading'|'ready'|'start-pending'|'playing'|'paused'|
  'timeline-ended'|'failed'|'closed';
export type P023GlossaryKey=P023TimelineGlossaryKey;
const GLOSSARY_KEYS=new Set<string>(P023_TIMELINE.glossaryInstances.map(item=>item.key));
type Policy={activation:'automatic'|'user';reducedMotion:boolean};
const result=(accepted:boolean,reason:string):DecodedStreamResult=>Object.freeze({accepted,reason});
const FPS=12,END=410;
const ASSET=P023_AUDIO_ASSETS[0];
const AUDIO_END=ASSET.firstBlockFrame+
  (ASSET.decodedSamples-ASSET.initialSeekSamples)/ASSET.sampleRate*FPS;

/** One decoded main stream owns the visual clock. Its candidate native EOF is
 * about 0.237 frame before the last source image; the running AudioContext, not an ended
 * decoder sample or wall clock, carries that short visual tail. */
export class AlgL06P023ClockV1{
  private readonly transport:Transport;
  private readonly unsubscribe:()=>void;
  private readonly commitFrame:(frame:number)=>boolean;
  private readonly createContext:()=>AudioContext;
  private context?:AudioContext;
  private phase:Phase='idle';
  private position=1;
  private committedFrame=0;
  private anchor?:{contextTime:number;position:number};
  private epoch=0;
  private nativeEnded=false;
  private decodedExhausted=false;
  private glossaryOpen:P023GlossaryKey|null=null;
  private failure:string|null=null;
  private volume=1;

  constructor(options:{commitFrame:(frame:number)=>boolean;createContext?:()=>AudioContext;
    createTransport?:(binding:DecodedSourceStreamBinding,createContext:()=>AudioContext)=>Transport}){
    if(typeof options.commitFrame!=='function'||P023_AUDIO_ASSETS.length!==1||
      ASSET.id!=='main-1'||P023_AUDIO_DISPOSITION.frameDomain!=='sprite-38'||
      P023_TIMELINE.frameDomain!==P023_AUDIO_DISPOSITION.frameDomain||
      P023_TIMELINE.mainFrameCount!==END||P023_TIMELINE.fps!==FPS||
      GLOSSARY_KEYS.size!==4||
      P023_AUDIO_DISPOSITION.lastVisualFrame!==END||
      JSON.stringify(P023_AUDIO_DISPOSITION.mainRanges)!=='[[11,410]]'||
      JSON.stringify(P023_AUDIO_DISPOSITION.sourceZeroPayloadBlockFrames)!=='[12]'||
      ASSET.initialSeekSamples!==1673||ASSET.decodedSamples!==734400||
      P023_AUDIO_DISPOSITION.syntheticSilenceAdded!==false||
      P023_AUDIO_DISPOSITION.mainRangesConcatenated!==false||
      P023_AUDIO_DISPOSITION.separateSaSpliced!==false||
      P023_AUDIO_DISPOSITION.sourceHasNegativeSeek!==false||
      !(AUDIO_END>END-1&&AUDIO_END<END)||P023_AUDIO_END_POSITION!==END)
      throw Error('P023_MAIN_STREAM_DISPOSITION_DRIFT');
    this.commitFrame=options.commitFrame;
    this.createContext=options.createContext??(()=>
      new AudioContext({sampleRate:ASSET.sampleRate,latencyHint:'interactive'}));
    const shared=()=>this.context??=this.createContext();
    const binding={sourceSha256:ASSET.sourceSha256,sourceBytes:ASSET.sourceBytes,
      sampleRate:ASSET.sampleRate,channels:ASSET.channels,
      decodedSamples:ASSET.decodedSamples,pcmSha256:ASSET.pcmSha256} satisfies DecodedSourceStreamBinding;
    this.transport=options.createTransport?.(binding,shared)??
      new DecodedSourceStreamTransport(binding,{createContext:shared});
    this.unsubscribe=this.transport.subscribe(()=>{
      if(this.phase==='playing'&&this.transport.snapshot().phase==='buffer-ended')
        this.settle();
    });
  }
  private frame(){return Math.min(END,Math.max(1,Math.floor(this.position+1e-9)));}
  private commit(force=false){
    const frame=this.frame();if(!force&&frame===this.committedFrame)return true;
    try{if(this.commitFrame(frame)===true){this.committedFrame=frame;return true;}}
    catch{/* A Canvas failure must stop its soundtrack. */}
    return false;
  }
  private fail(reason:string){
    this.epoch++;this.anchor=undefined;this.transport.holdSourceBoundary();
    this.phase='failed';this.failure=reason;return result(false,reason);
  }
  private readonly contextChanged=()=>{
    if(this.context?.state==='running')return;
    if(this.phase==='start-pending'){
      this.transport.pause();this.epoch++;this.anchor=undefined;
      this.phase=this.context?.state==='closed'?'failed':'paused';
      if(this.phase==='failed')this.failure='main-context-closed';
    }else if(this.phase==='playing')this.settle();
  };
  private settle(){
    if(this.phase!=='playing'||!this.anchor||!this.context)return;
    const native=this.transport.snapshot();
    if(native.phase==='buffer-ended')this.nativeEnded=true;
    // AudioContext can reach the final decoded sample before its onended task
    // runs. Pause or SA selection then retires that task. Keep this separate
    // sample-coordinate evidence so explicit Return can finish the visual tail.
    if(native.decodedSample>=ASSET.decodedSamples)this.decodedExhausted=true;
    const interrupted=this.context.state!=='running'||
      ['interrupted','play-rejected','failed','closed'].includes(native.phase);
    // A buffer-ended transport retains its last sample. The context continues
    // ticking, including the short interval from native EOF to visual frame 410.
    const now=interrupted?(native.heldContextTime??native.contextTime??this.context.currentTime)
      :this.context.currentTime;
    if(!Number.isFinite(now))return void this.fail('invalid-context-time');
    this.position=Math.min(END,Math.max(this.position,
      this.anchor.position+Math.max(0,now-this.anchor.contextTime)*FPS));
    if(!this.commit())return void this.fail('source-frame-commit-failed');
    if(interrupted){
      this.transport.pause();this.epoch++;this.anchor=undefined;
      this.phase=this.context.state==='closed'?'failed':'paused';
      if(this.phase==='failed')this.failure='main-context-closed';
      return;
    }
    // Visual time alone cannot finish; either the native callback or the
    // pinned decoded sample count must independently establish exhaustion.
    if(this.position>=END&&(this.nativeEnded||this.decodedExhausted)){
      this.epoch++;this.transport.holdSourceBoundary();this.anchor=undefined;
      this.phase='timeline-ended';
    }
  }
  snapshot(){
    this.settle();
    const native=this.transport.snapshot();
    const audioPhase=this.phase==='playing'&&this.position<ASSET.firstBlockFrame?
      'preroll':this.phase==='playing'&&this.decodedExhausted?'visual-tail':native.phase;
    return Object.freeze({phase:this.phase,frame:this.frame(),frameDomain:'sprite-38' as const,
      elapsedSeconds:(this.position-1)/FPS,activeAudioId:'main-1' as P023AudioId,
      activePosition:this.position,transitioning:false,glossaryOpen:this.glossaryOpen,
      audio:Object.freeze({phase:audioPhase,decodedSample:native.decodedSample,
        contextTime:native.contextTime,volume:native.volume}),
      visualTailAfterAudioEOF:this.phase==='playing'&&this.decodedExhausted&&this.position<END,
      nativeBufferEndedObserved:this.nativeEnded,
      decodedSampleExhaustedObserved:this.decodedExhausted,
      mainFinalAudioTailPending:this.phase==='playing'&&this.frame()===END&&
        !this.nativeEnded&&!this.decodedExhausted,
      timelineReachedEnd:this.phase==='timeline-ended',failure:this.failure,
      sourceAlignment:'unresolved' as const,originalRuntimeAccepted:false as const,
      audioAccepted:false as const,lessonCompleted:false as const});
  }
  tick(){return this.snapshot();}
  async prepare(inputs:Readonly<Record<P023AudioId,ArrayBuffer>>):Promise<DecodedStreamResult>{
    if(this.phase!=='idle')return result(false,'prepare-not-idle');
    const ticket=++this.epoch;this.phase='loading';
    try{
      const bytes=inputs?.['main-1'];
      if(!(bytes instanceof ArrayBuffer))throw Error('missing-source-main-1');
      const prepared=await this.transport.prepare(bytes);
      if(ticket!==this.epoch)return result(false,'stale-prepare');
      if(!prepared.accepted)throw Error(`main-1:${prepared.reason}`);
      const volume=this.transport.setVolume(this.volume);
      if(!volume.accepted)throw Error(volume.reason);
      if(!this.commit(true))throw Error('source-first-frame-not-committed');
      if(ticket!==this.epoch)return result(false,'stale-prepare');
      this.context?.addEventListener('statechange',this.contextChanged);
      this.phase='ready';return result(true,'single-source-ready');
    }catch(error){
      if(ticket!==this.epoch)return result(false,'stale-prepare');
      this.phase='failed';this.failure=error instanceof Error?error.message:String(error);
      await this.transport.close();return result(false,this.failure);
    }
  }
  async play(policy:Policy):Promise<DecodedStreamResult>{
    this.settle();
    if(!policy||!['automatic','user'].includes(policy.activation)||
      typeof policy.reducedMotion!=='boolean')return result(false,'invalid-play-policy');
    if(policy.activation!=='user')return result(false,'explicit-user-play-required');
    if(this.glossaryOpen!==null)return result(false,'glossary-open-hold');
    if(this.phase==='playing')return result(true,'already-playing');
    if(!['ready','paused'].includes(this.phase)||!this.context)return result(false,'not-ready');
    const ticket=++this.epoch;this.phase='start-pending';
    if(!this.commit()){this.phase='paused';return result(false,'source-frame-not-committed');}
    try{
      if(this.nativeEnded||this.decodedExhausted){
        // Source is exhausted. Explicit Play only resumes the remaining visual
        // fraction using the same clock; it never restarts or extends the MP3.
        await this.context.resume();
        if(ticket!==this.epoch)return result(false,'stale-start');
        if(this.context.state!=='running')throw Error('context-not-running');
      }else{
        const slice=p023AudioSlice('main-1',this.position);
        if(!slice)throw Error('source-audio-ended-before-native-eof');
        const sought=this.transport.seekDecodedSample(slice.firstDecodedSample);
        if(!sought.accepted)throw Error(sought.reason);
        const started=await this.transport.play({...policy,delaySeconds:slice.delaySeconds});
        if(ticket!==this.epoch)return result(false,'stale-start');
        if(!started.accepted)throw Error(started.reason);
      }
      this.anchor={contextTime:this.context.currentTime,position:this.position};
      this.phase='playing';this.failure=null;this.settle();
      return result(true,this.decodedExhausted?'visual-tail-playing':'single-source-playing');
    }catch(error){
      if(ticket!==this.epoch)return result(false,'stale-start');
      this.transport.pause();this.anchor=undefined;this.phase='paused';
      this.failure=error instanceof Error?error.message:String(error);
      return result(false,this.failure);
    }
  }
  pause():DecodedStreamResult{
    this.settle();
    if(!['playing','start-pending'].includes(this.phase))return result(false,'not-playing');
    this.epoch++;this.transport.pause();this.anchor=undefined;this.phase='paused';
    return this.commit()?result(true,'single-source-held'):
      this.fail('paused-frame-not-committed');
  }
  /** Source-visible KeyAttribute gate and held main clock. The caller also
   * verifies exact native button instance/action identity. */
  openGlossary(key:P023GlossaryKey):DecodedStreamResult{
    this.settle();
    if(!GLOSSARY_KEYS.has(key)||!p023TimelineState(this.frame()).glossary[key]||
      this.glossaryOpen!==null||
      !['ready','paused','playing','start-pending','timeline-ended'].includes(this.phase))
      return result(false,'glossary-unavailable');
    if(['playing','start-pending'].includes(this.phase)&&!this.pause().accepted)
      return result(false,'main-pause-failed');
    this.glossaryOpen=key;return result(true,'glossary-opened-and-held');
  }
  closeGlossary():DecodedStreamResult{
    if(this.glossaryOpen===null)return result(false,'glossary-not-open');
    this.glossaryOpen=null;return result(true,'glossary-closed-held');
  }
  replay():DecodedStreamResult{
    if(!['ready','paused','playing','start-pending','timeline-ended'].includes(this.phase))
      return result(false,'not-ready');
    this.epoch++;this.anchor=undefined;this.nativeEnded=false;
    this.decodedExhausted=false;this.glossaryOpen=null;
    this.transport.replay();this.position=1;this.phase='ready';this.failure=null;
    return this.commit(true)?result(true,'source-replayed-and-held'):
      this.fail('replay-frame-not-committed');
  }
  setVolume(value:number):DecodedStreamResult{
    if(this.phase==='closed'||!Number.isFinite(value)||value<0||value>1)
      return result(false,'invalid-volume');
    this.volume=value;return this.transport.setVolume(value);
  }
  async close():Promise<void>{
    if(this.phase==='closed')return;
    this.epoch++;this.anchor=undefined;this.glossaryOpen=null;this.phase='closed';
    this.context?.removeEventListener('statechange',this.contextChanged);
    this.unsubscribe();await this.transport.close();
  }
}
