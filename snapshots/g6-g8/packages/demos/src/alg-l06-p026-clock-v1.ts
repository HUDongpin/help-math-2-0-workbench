import {DecodedSourceStreamTransport,type DecodedSourceStreamBinding,
  type DecodedStreamResult} from './decoded-source-stream-transport';
import {P026_AUDIO_ASSETS,P026_AUDIO_DISPOSITION,P026_BROWSER_BINDINGS,p026AudioSlice,
  type P026AudioId} from './alg-l06-p026-audio-schedule-v1';
import {P026_TIMELINE,p026TimelineState,type P026GlossaryKey}
  from './alg-l06-p026-timeline-v1';

type Transport=Pick<DecodedSourceStreamTransport,'prepare'|'snapshot'|'subscribe'|
  'seekDecodedSample'|'play'|'pause'|'replay'|'holdSourceBoundary'|'setVolume'|'close'>;
type Phase='idle'|'loading'|'ready'|'start-pending'|'playing'|'paused'|
  'timeline-ended'|'failed'|'closed';
type Policy={activation:'automatic'|'user';reducedMotion:boolean};
const result=(accepted:boolean,reason:string):DecodedStreamResult=>Object.freeze({accepted,reason});
const ids=['main-1','main-2'] as const;
const assetFor=(id:P026AudioId)=>P026_AUDIO_ASSETS[id==='main-1'?0:1];

export type P026BrowserBindings=Readonly<Record<P026AudioId,DecodedSourceStreamBinding>>;

/** P026 owns two separately decoded source ranges. SourceStreamRunsClockV1 is
 * unsuitable: it requires one concatenated decoder and retires all nodes at
 * the visual endpoint, which would cut P026's second native EOF after 389. */
export class AlgL06P026ClockV1 {
  private readonly transports:Readonly<Record<P026AudioId,Transport>>;
  private readonly unsubscribes:(()=>void)[]=[];
  private readonly commitFrame:(frame:number)=>boolean;
  private readonly bindings:P026BrowserBindings;
  private context?:AudioContext;
  private phase:Phase='idle';
  private position=1;
  private committedFrame=0;
  private anchor?:{contextTime:number;position:number};
  private epoch=0;
  private nativeEnded:Record<P026AudioId,boolean>={'main-1':false,'main-2':false};
  private glossaryOpen:P026GlossaryKey|null=null;
  private failure:string|null=null;
  private volume=1;

  constructor(options:{commitFrame:(frame:number)=>boolean;
    bindings?:P026BrowserBindings;createContext?:()=>AudioContext;
    createTransport?:(binding:DecodedSourceStreamBinding,createContext:()=>AudioContext,
      id:P026AudioId)=>Transport}){
    if(typeof options.commitFrame!=='function'||P026_TIMELINE.frameDomain!=='sprite-55'||
      P026_TIMELINE.mainFrameCount!==389||P026_TIMELINE.fps!==12||
      JSON.stringify(P026_AUDIO_DISPOSITION.mainRanges)!=='[[31,158],[196,389]]'||
      JSON.stringify(P026_AUDIO_DISPOSITION.gapFrames)!=='[159,195]'||
      P026_AUDIO_DISPOSITION.emptyNegativeSeekBlock.frame!==158||
      P026_AUDIO_DISPOSITION.emptyNegativeSeekBlock.seekSamples!==-2267||
      P026_AUDIO_DISPOSITION.emptyNegativeSeekBlock.mp3PayloadBytes!==0||
      P026_AUDIO_DISPOSITION.syntheticSilenceAdded!==false||
      P026_AUDIO_DISPOSITION.mainRangesConcatenated!==false||
      P026_AUDIO_DISPOSITION.separateSaSpliced!==false)
      throw Error('P026_SOURCE_DISPOSITION_DRIFT');
    const bindings=options.bindings??P026_BROWSER_BINDINGS;
    for(const id of ids){
      const source=assetFor(id),binding=bindings[id];
      if(!binding||binding.sourceSha256!==source.sourceSha256||
        binding.sourceBytes!==source.sourceBytes||
        binding.sampleRate!==source.sampleRate||binding.channels!==source.channels||
        !Number.isSafeInteger(binding.decodedSamples)||binding.decodedSamples<=source.initialSeekSamples||
        !/^[a-f0-9]{64}$/u.test(binding.pcmSha256))
        throw Error(`P026_BROWSER_BINDING_MISSING_OR_MISMATCH:${id}`);
    }
    this.bindings=bindings;
    this.commitFrame=options.commitFrame;
    const create=options.createContext??(()=>(new AudioContext({sampleRate:22050,
      latencyHint:'interactive'})));
    const shared=()=>this.context??=create();
    const transports={} as Record<P026AudioId,Transport>;
    for(const id of ids)transports[id]=
      options.createTransport?.(bindings[id],shared,id)??
        new DecodedSourceStreamTransport(bindings[id],{createContext:shared});
    this.transports=transports;
    for(const id of ids)this.unsubscribes.push(transports[id].subscribe(()=>{
      const native=transports[id].snapshot();
      if(native.phase==='buffer-ended')this.nativeEnded[id]=true;
      if(this.phase==='playing'&&(['buffer-ended','interrupted','closed','failed'].includes(native.phase)))
        this.settle();
    }));
  }

  private frame(){return Math.min(389,Math.max(1,Math.floor(this.position+1e-9)));}
  private commit(force=false):boolean{
    const frame=this.frame();
    if(!force&&frame===this.committedFrame)return true;
    try{if(this.commitFrame(frame)!==true)return false;}catch{return false;}
    this.committedFrame=frame;return true;
  }
  private retire(){for(const id of ids){
    const phase=this.transports[id].snapshot().phase;
    if(phase==='playing'||phase==='start-pending')this.transports[id].pause();
  }}
  private fail(reason:string){
    this.epoch++;this.retire();this.anchor=undefined;this.phase='failed';this.failure=reason;
    return result(false,reason);
  }
  private readonly contextChanged=()=>{
    if(!this.context||this.context.state==='running'||this.phase==='closed')return;
    this.settle();
    if(this.phase==='start-pending'){
      this.epoch++;this.retire();this.anchor=undefined;
      this.phase=this.context.state==='closed'?'failed':'paused';
      if(this.phase==='failed')this.failure='P026_MAIN_CONTEXT_CLOSED';
    }
  };
  private settle(){
    if(this.phase!=='playing'||!this.anchor||!this.context)return;
    for(const id of ids)if(this.transports[id].snapshot().phase==='buffer-ended')
      this.nativeEnded[id]=true;
    const interrupted=this.context.state!=='running'||ids.some(id=>
      ['interrupted','closed','failed','play-rejected'].includes(this.transports[id].snapshot().phase));
    const nativeTimes=ids.map(id=>this.transports[id].snapshot().heldContextTime)
      .filter((time):time is number=>time!==null);
    const now=interrupted&&nativeTimes.length?Math.min(...nativeTimes):this.context.currentTime;
    if(!Number.isFinite(now))return void this.fail('P026_INVALID_CONTEXT_TIME');
    this.position=Math.min(389,Math.max(this.position,
      this.anchor.position+Math.max(0,now-this.anchor.contextTime)*12));
    if(!this.commit())return void this.fail('P026_SOURCE_FRAME_COMMIT_FAILED');
    if(interrupted){
      this.epoch++;this.retire();this.anchor=undefined;
      this.phase=this.context.state==='closed'?'failed':'paused';
      if(this.phase==='failed')this.failure='P026_MAIN_CONTEXT_CLOSED';
      return;
    }
    // A visible frame 389 is held while the second real buffer is still live.
    if(this.position>=389&&this.nativeEnded['main-2']){
      this.epoch++;this.retire();this.anchor=undefined;this.phase='timeline-ended';
    }
  }
  snapshot(){
    this.settle();
    const native1=this.transports['main-1'].snapshot();
    const native2=this.transports['main-2'].snapshot();
    const frame=this.frame();
    const activeAudioId:P026AudioId|null=frame>=196?'main-2':
      frame>=31&&frame<=158?'main-1':null;
    const audioPhase=this.phase==='playing'&&frame===389&&!this.nativeEnded['main-2']?
      'playing':this.phase==='playing'&&frame>=159&&frame<=195?
      'source-gap':this.phase==='playing'&&frame<31?'preroll':
      activeAudioId?this.transports[activeAudioId].snapshot().phase:this.phase;
    return Object.freeze({phase:this.phase,frame,frameDomain:'sprite-55' as const,
      elapsedSeconds:(this.position-1)/12,activePosition:this.position,
      activeAudioId,glossaryOpen:this.glossaryOpen,
      audio:Object.freeze({phase:audioPhase,contextTime:this.context?.currentTime??null,
        volume:this.volume,ranges:Object.freeze({'main-1':native1,'main-2':native2})}),
      firstNativeEofObserved:this.nativeEnded['main-1'],
      secondNativeEofObserved:this.nativeEnded['main-2'],
      mainFinalAudioTailPending:this.phase==='playing'&&frame===389&&
        !this.nativeEnded['main-2'],
      timelineReachedEnd:this.phase==='timeline-ended',failure:this.failure,
      sourceAlignment:'unresolved' as const,originalRuntimeAccepted:false as const,
      audioAccepted:false as const,lessonCompleted:false as const});
  }
  tick(){return this.snapshot();}
  async prepare(inputs:Readonly<Record<P026AudioId,ArrayBuffer>>):Promise<DecodedStreamResult>{
    if(this.phase!=='idle')return result(false,'prepare-not-idle');
    const ticket=++this.epoch;this.phase='loading';
    try{
      for(const id of ids){
        const bytes=inputs?.[id];
        if(!(bytes instanceof ArrayBuffer))throw Error(`P026_MISSING_SOURCE:${id}`);
        const prepared=await this.transports[id].prepare(bytes);
        if(ticket!==this.epoch)return result(false,'stale-prepare');
        if(!prepared.accepted)throw Error(`${id}:${prepared.reason}`);
        const volume=this.transports[id].setVolume(this.volume);
        if(!volume.accepted)throw Error(volume.reason);
      }
      if(!this.context||this.context.sampleRate!==22050)throw Error('P026_CONTEXT_RATE_MISMATCH');
      this.context.addEventListener('statechange',this.contextChanged);
      if(!this.commit(true))throw Error('P026_FIRST_FRAME_NOT_COMMITTED');
      this.phase='ready';return result(true,'two-source-ranges-ready');
    }catch(error){
      if(ticket!==this.epoch)return result(false,'stale-prepare');
      this.phase='failed';this.failure=error instanceof Error?error.message:String(error);
      await this.close();return result(false,this.failure);
    }
  }
  async play(policy:Policy):Promise<DecodedStreamResult>{
    this.settle();
    if(!policy||policy.activation!=='user'||typeof policy.reducedMotion!=='boolean')
      return result(false,'explicit-user-play-required');
    if(this.glossaryOpen!==null)return result(false,'glossary-open-hold');
    if(this.phase==='playing')return result(true,'already-playing');
    if(!['ready','paused'].includes(this.phase)||!this.context)return result(false,'not-ready');
    const ticket=++this.epoch;this.phase='start-pending';
    if(!this.commit()){
      this.phase='paused';return result(false,'P026_SOURCE_FRAME_NOT_COMMITTED');
    }
    try{
      // Resume is initiated in the direct user gesture. Each transport then
      // schedules against the same native clock; no visual tick cues run 2.
      await this.context.resume();
      if(ticket!==this.epoch)return result(false,'stale-start');
      if(this.context.state!=='running')throw Error('context-not-running');
      const anchorTime=this.context.currentTime,anchorPosition=this.position;
      for(const id of ids){
        if(this.nativeEnded[id])continue;
        const slice=p026AudioSlice(id,anchorPosition,this.bindings[id].decodedSamples);
        if(!slice)continue;
        const due=anchorTime+slice.delaySeconds;
        // A paused buffer has its own native sample cursor. At frame 389 the
        // visual clock is held while audio keeps moving, so resuming from the
        // visual-frame estimate would replay the tail that already sounded.
        const held=this.transports[id].snapshot();
        const sourceSample=Math.min(this.bindings[id].decodedSamples-1,
          Math.max(slice.firstDecodedSample,
            ['paused','interrupted','play-rejected'].includes(held.phase)?
              held.decodedSample:0));
        const sought=this.transports[id].seekDecodedSample(sourceSample);
        if(!sought.accepted)throw Error(`${id}:${sought.reason}`);
        const started=await this.transports[id].play({...policy,
          delaySeconds:Math.max(0,due-this.context.currentTime)});
        if(ticket!==this.epoch)return result(false,'stale-start');
        if(!started.accepted)throw Error(`${id}:${started.reason}`);
      }
      if(ticket!==this.epoch)return result(false,'stale-start');
      this.anchor={contextTime:anchorTime,position:anchorPosition};
      this.phase='playing';this.failure=null;this.settle();
      return result(true,'two-source-ranges-playing');
    }catch(error){
      if(ticket!==this.epoch)return result(false,'stale-start');
      this.retire();this.anchor=undefined;this.phase='paused';
      this.failure=error instanceof Error?error.message:String(error);
      return result(false,this.failure);
    }
  }
  pause():DecodedStreamResult{
    this.settle();
    if(!['playing','start-pending'].includes(this.phase))return result(false,'not-playing');
    this.epoch++;this.retire();this.anchor=undefined;this.phase='paused';
    return this.commit()?result(true,'two-source-ranges-held'):
      this.fail('P026_PAUSED_FRAME_NOT_COMMITTED');
  }
  openGlossary(key:P026GlossaryKey):DecodedStreamResult{
    this.settle();
    if(this.glossaryOpen!==null||
      !p026TimelineState(this.frame()).glossaryInstances.some(instance=>
        instance.key===key&&instance.available)||
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
    this.epoch++;this.retire();this.anchor=undefined;
    this.nativeEnded={'main-1':false,'main-2':false};this.glossaryOpen=null;
    for(const id of ids)this.transports[id].replay();
    this.position=1;this.committedFrame=0;this.phase='ready';this.failure=null;
    return this.commit(true)?result(true,'two-source-ranges-replayed-held'):
      this.fail('P026_REPLAY_FRAME_NOT_COMMITTED');
  }
  seekCandidateFrame(frame:number):DecodedStreamResult{
    if(!Number.isSafeInteger(frame)||frame<1||frame>389||
      !['ready','paused','playing','start-pending','timeline-ended'].includes(this.phase))
      return result(false,'invalid-candidate-frame');
    this.epoch++;this.retire();this.anchor=undefined;this.position=frame;
    for(const id of ids)this.transports[id].replay();
    this.nativeEnded={'main-1':false,'main-2':false};
    this.phase='paused';this.failure=null;
    return this.commit(true)?result(true,'source-candidate-frame-held'):
      this.fail('P026_INSPECTED_FRAME_NOT_COMMITTED');
  }
  setVolume(value:number):DecodedStreamResult{
    if(this.phase==='closed'||!Number.isFinite(value)||value<0||value>1)
      return result(false,'invalid-volume');
    this.volume=value;
    const changed=ids.map(id=>this.transports[id].setVolume(value));
    return changed.every(change=>change.accepted)?result(true,'volume-set'):
      result(false,'volume-rejected');
  }
  async close():Promise<void>{
    if(this.phase==='closed')return;
    this.epoch++;this.retire();this.anchor=undefined;this.glossaryOpen=null;
    this.phase='closed';this.context?.removeEventListener('statechange',this.contextChanged);
    for(const unsubscribe of this.unsubscribes)unsubscribe();
    // Both transports share one context. Close sequentially so the second
    // observes its already closed context without racing a duplicate close.
    for(const id of ids)await this.transports[id].close();
  }
}
