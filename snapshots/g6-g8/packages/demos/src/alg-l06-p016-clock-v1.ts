import {DecodedSourceStreamTransport,type DecodedSourceStreamBinding,type DecodedStreamResult}
  from './decoded-source-stream-transport';
import {P016_AUDIO_ASSETS,P016_AUDIO_DISPOSITION,P016_AUDIO_END_POSITION,p016AudioSlice,
  type P016AudioId} from './alg-l06-p016-audio-schedule-v1';
import {P016_TIMELINE} from './alg-l06-p016-timeline-v1';

type Transport=Pick<DecodedSourceStreamTransport,
  'prepare'|'snapshot'|'subscribe'|'seekDecodedSample'|'play'|'pause'|'replay'|
  'holdSourceBoundary'|'setVolume'|'close'>;
type Phase='idle'|'loading'|'ready'|'start-pending'|'playing'|'paused'|
  'timeline-ended'|'failed'|'closed';
export type P016GlossaryKey='Function';
type Policy={activation:'automatic'|'user';reducedMotion:boolean};
const result=(accepted:boolean,reason:string):DecodedStreamResult=>Object.freeze({accepted,reason});
const FPS=P016_TIMELINE.fps,END=P016_TIMELINE.mainFrameCount;
const ids=P016_AUDIO_ASSETS.map(a=>a.id);
const firstAvailable=P016_TIMELINE.glossary.Function.firstAvailableFrame;
const finalAsset=P016_AUDIO_ASSETS[1];
const finalAudioEnd=finalAsset.firstBlockFrame+
  (finalAsset.decodedSamples-finalAsset.initialSeekSamples)/finalAsset.sampleRate*FPS;

/** Two independent source ranges share one 22.05 kHz AudioContext. Visual
 * time advances across absent SWF blocks without inventing MP3 silence. The
 * selected decoded source is the sole audible owner; SA has another context. */
export class AlgL06P016ClockV1{
  private readonly transports=new Map<P016AudioId,Transport>();
  private readonly unsubscribe:(()=>void)[]=[];
  private readonly commitFrame:(frame:number)=>boolean;
  private readonly createContext:()=>AudioContext;
  private context?:AudioContext;
  private phase:Phase='idle';
  private activeId:P016AudioId='main-1';
  private position=1;
  private committedFrame=0;
  private anchor?:{contextTime:number;position:number};
  private epoch=0;
  private transitioning=false;
  private glossaryOpen:P016GlossaryKey|null=null;
  private failure:string|null=null;
  private volume=1;

  constructor(options:{commitFrame:(frame:number)=>boolean;createContext?:()=>AudioContext;
    createTransport?:(binding:DecodedSourceStreamBinding,createContext:()=>AudioContext)=>Transport}){
    if(typeof options.commitFrame!=='function'||P016_AUDIO_ASSETS.length!==2||
      ids.join(',')!=='main-1,main-2'||
      P016_AUDIO_DISPOSITION.frameDomain!=='sprite-139'||
      P016_AUDIO_DISPOSITION.lastVisualFrame!==END||
      JSON.stringify(P016_AUDIO_DISPOSITION.mainRanges)!=='[[2,299],[312,815]]'||
      P016_AUDIO_DISPOSITION.syntheticSilenceAdded!==false||
      P016_AUDIO_DISPOSITION.mainRangesConcatenated!==false||
      P016_AUDIO_DISPOSITION.negativeSeekSemanticsResolved!==false||
      P016_TIMELINE.glossary.Function.firstFullHitFrame!==null||
      firstAvailable!==72||finalAudioEnd<=END||finalAudioEnd>=END+1)
      throw Error('P016_MAIN_RANGE_DISPOSITION_DRIFT');
    this.commitFrame=options.commitFrame;
    this.createContext=options.createContext??(()=>
      new AudioContext({sampleRate:22050,latencyHint:'interactive'}));
    const shared=()=>this.context??=this.createContext();
    for(const asset of P016_AUDIO_ASSETS){
      const binding={sourceSha256:asset.sourceSha256,sourceBytes:asset.sourceBytes,
        sampleRate:asset.sampleRate,channels:asset.channels,decodedSamples:asset.decodedSamples,
        pcmSha256:asset.pcmSha256} satisfies DecodedSourceStreamBinding;
      const transport=options.createTransport?.(binding,shared)??
        new DecodedSourceStreamTransport(binding,{createContext:shared});
      this.transports.set(asset.id,transport);
      this.unsubscribe.push(transport.subscribe(()=>{
        if(this.phase==='playing'&&this.activeId===asset.id&&
          transport.snapshot().phase==='buffer-ended')this.settle();
      }));
    }
  }
  private frame(){return Math.min(END,Math.max(1,Math.floor(this.position+1e-9)));}
  private commit(force=false){
    const frame=this.frame();if(!force&&frame===this.committedFrame)return true;
    try{if(this.commitFrame(frame)===true){this.committedFrame=frame;return true;}}
    catch{/* A Canvas failure must stop its soundtrack. */}
    return false;
  }
  private fail(reason:string){
    this.epoch++;this.anchor=undefined;this.transitioning=false;
    for(const transport of this.transports.values())transport.holdSourceBoundary();
    this.phase='failed';this.failure=reason;return result(false,reason);
  }
  private choose(position:number):P016AudioId|null{
    for(const asset of P016_AUDIO_ASSETS){
      if(position>asset.lastVisualFrame+1)continue;
      if(p016AudioSlice(asset.id,Math.min(position,P016_AUDIO_END_POSITION)))return asset.id;
    }
    return null;
  }
  private readonly contextChanged=()=>{
    if(this.context?.state==='running')return;
    if(this.phase==='start-pending'){
      this.transports.get(this.activeId)!.pause();
      this.epoch++;this.anchor=undefined;this.transitioning=false;
      this.phase=this.context?.state==='closed'?'failed':'paused';
      if(this.phase==='failed')this.failure='main-context-closed';
    }else if(this.phase==='playing')this.settle();
  };
  private settle(){
    if(this.phase!=='playing'||!this.anchor||!this.context)return;
    const native=this.transports.get(this.activeId)!.snapshot();
    const interrupted=this.context.state!=='running'||
      ['interrupted','play-rejected','failed','closed'].includes(native.phase);
    const now=interrupted?(native.heldContextTime??native.contextTime??this.context.currentTime)
      :this.context.currentTime;
    if(!Number.isFinite(now))return void this.fail('invalid-context-time');
    this.position=Math.min(P016_AUDIO_END_POSITION,Math.max(this.position,
      this.anchor.position+Math.max(0,now-this.anchor.contextTime)*FPS));
    if(!this.commit())return void this.fail('source-frame-commit-failed');
    if(interrupted){
      // A range transition may be awaiting AudioContext.resume(). The clock
      // epoch alone cannot cancel that transport's pending source start.
      this.transports.get(this.activeId)!.pause();
      this.epoch++;this.anchor=undefined;this.transitioning=false;
      this.phase=this.context.state==='closed'?'failed':'paused';
      if(this.phase==='failed')this.failure='main-context-closed';
      return;
    }
    const ended=native.phase==='buffer-ended';
    if(this.activeId==='main-2'&&ended){
      // The decoded source extends into the fractional part of frame 815.
      // Wait for real buffer EOF; then commit the last visual even if the
      // onended callback precedes a snapshot of that final fraction.
      this.position=Math.max(this.position,finalAudioEnd);
      if(!this.commit())return void this.fail('source-final-frame-commit-failed');
      this.epoch++;this.transports.get(this.activeId)!.holdSourceBoundary();
      this.anchor=undefined;this.transitioning=false;
      this.position=P016_AUDIO_END_POSITION;this.phase='timeline-ended';
      return;
    }
    if(ended&&!this.transitioning&&this.activeId==='main-1')
      void this.continueWithNext();
  }
  private async continueWithNext(){
    if(this.phase!=='playing'||this.transitioning)return;
    const current=ids.indexOf(this.activeId),next=ids[current+1];
    if(!next)return;
    const ticket=this.epoch;
    this.transitioning=true;
    this.transports.get(this.activeId)!.holdSourceBoundary();
    this.activeId=next;
    try{
      const slice=p016AudioSlice(next,this.position);
      if(!slice)throw Error('next-source-exhausted-before-start');
      const transport=this.transports.get(next)!;
      const sought=transport.seekDecodedSample(slice.firstDecodedSample);
      if(!sought.accepted)throw Error(sought.reason);
      const started=await transport.play({activation:'automatic',reducedMotion:false,
        delaySeconds:slice.delaySeconds});
      if(ticket!==this.epoch||this.phase!=='playing')return;
      if(!started.accepted)throw Error(started.reason);
      this.transitioning=false;
      this.settle();
    }catch(error){
      if(ticket!==this.epoch||this.phase!=='playing')return;
      this.fail(error instanceof Error?error.message:String(error));
    }
  }
  snapshot(){
    this.settle();
    const native=this.transports.get(this.activeId)!.snapshot();
    const asset=P016_AUDIO_ASSETS.find(row=>row.id===this.activeId)!;
    const audioPhase=this.phase==='playing'&&this.position<asset.firstBlockFrame?'preroll':
      this.phase==='playing'&&native.phase==='buffer-ended'?'gap':native.phase;
    return Object.freeze({phase:this.phase,frame:this.frame(),frameDomain:'sprite-139' as const,
      elapsedSeconds:(this.position-1)/FPS,activeAudioId:this.activeId,
      activePosition:this.position,transitioning:this.transitioning,
      glossaryOpen:this.glossaryOpen,
      audio:Object.freeze({phase:audioPhase,decodedSample:native.decodedSample,
        contextTime:native.contextTime,volume:native.volume}),
      mainFinalAudioTailPending:this.phase==='playing'&&this.frame()===END&&
        this.activeId==='main-2'&&native.decodedSample<asset.decodedSamples,
      timelineReachedEnd:this.phase==='timeline-ended',failure:this.failure,
      sourceAlignment:'unresolved' as const,originalRuntimeAccepted:false as const,
      audioAccepted:false as const,lessonCompleted:false as const});
  }
  tick(){return this.snapshot();}
  async prepare(inputs:Readonly<Record<P016AudioId,ArrayBuffer>>):Promise<DecodedStreamResult>{
    if(this.phase!=='idle')return result(false,'prepare-not-idle');
    const ticket=++this.epoch;this.phase='loading';
    try{
      for(const id of ids){
        const bytes=inputs?.[id];
        if(!(bytes instanceof ArrayBuffer))throw Error(`missing-source-${id}`);
        const prepared=await this.transports.get(id)!.prepare(bytes);
        if(ticket!==this.epoch)return result(false,'stale-prepare');
        if(!prepared.accepted)throw Error(`${id}:${prepared.reason}`);
        const volume=this.transports.get(id)!.setVolume(this.volume);
        if(!volume.accepted)throw Error(`${id}:${volume.reason}`);
      }
      if(!this.commit(true))throw Error('source-first-frame-not-committed');
      if(ticket!==this.epoch)return result(false,'stale-prepare');
      this.context?.addEventListener('statechange',this.contextChanged);
      this.phase='ready';return result(true,'two-source-ranges-ready');
    }catch(error){
      if(ticket!==this.epoch)return result(false,'stale-prepare');
      this.phase='failed';this.failure=error instanceof Error?error.message:String(error);
      await this.closeSources();return result(false,this.failure);
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
    const id=this.choose(this.position);
    if(id===null)return result(false,'source-audio-ended');
    this.activeId=id;
    const ticket=++this.epoch;this.phase='start-pending';
    if(!this.commit()){
      this.phase='paused';return result(false,'source-frame-not-committed');
    }
    try{
      const slice=p016AudioSlice(id,this.position);
      if(!slice)throw Error('source-audio-ended');
      const transport=this.transports.get(id)!;
      const sought=transport.seekDecodedSample(slice.firstDecodedSample);
      if(!sought.accepted)throw Error(sought.reason);
      const started=await transport.play({...policy,delaySeconds:slice.delaySeconds});
      if(ticket!==this.epoch)return result(false,'stale-start');
      if(!started.accepted)throw Error(started.reason);
      this.anchor={contextTime:this.context.currentTime,position:this.position};
      this.phase='playing';this.failure=null;this.settle();
      return result(true,'two-source-range-playing');
    }catch(error){
      if(ticket!==this.epoch)return result(false,'stale-start');
      this.transports.get(id)!.pause();this.anchor=undefined;this.phase='paused';
      this.failure=error instanceof Error?error.message:String(error);
      return result(false,this.failure);
    }
  }
  pause():DecodedStreamResult{
    this.settle();
    if(!['playing','start-pending'].includes(this.phase))return result(false,'not-playing');
    this.epoch++;this.transitioning=false;
    for(const transport of this.transports.values())transport.pause();
    this.anchor=undefined;this.phase='paused';
    return this.commit()?result(true,'source-ranges-held'):this.fail('paused-frame-not-committed');
  }
  openGlossary(key:P016GlossaryKey):DecodedStreamResult{
    this.settle();
    if(key!=='Function'||this.glossaryOpen!==null||
      this.frame()<firstAvailable||!['ready','paused','playing','start-pending',
        'timeline-ended'].includes(this.phase))
      return result(false,'glossary-unavailable');
    if(['playing','start-pending'].includes(this.phase)&&!this.pause().accepted)
      return result(false,'main-pause-failed');
    this.glossaryOpen=key;
    return result(true,'glossary-opened-and-held');
  }
  closeGlossary():DecodedStreamResult{
    if(this.glossaryOpen===null)return result(false,'glossary-not-open');
    this.glossaryOpen=null;return result(true,'glossary-closed-held');
  }
  replay():DecodedStreamResult{
    if(!['ready','paused','playing','start-pending','timeline-ended'].includes(this.phase))
      return result(false,'not-ready');
    this.epoch++;this.transitioning=false;this.anchor=undefined;this.glossaryOpen=null;
    for(const transport of this.transports.values())transport.replay();
    this.activeId='main-1';this.position=1;this.phase='ready';this.failure=null;
    return this.commit(true)?result(true,'source-replayed-and-held'):
      this.fail('replay-frame-not-committed');
  }
  setVolume(value:number):DecodedStreamResult{
    if(this.phase==='closed'||!Number.isFinite(value)||value<0||value>1)
      return result(false,'invalid-volume');
    this.volume=value;
    for(const transport of this.transports.values()){
      const changed=transport.setVolume(value);if(!changed.accepted)return changed;
    }
    return result(true,'volume-set');
  }
  async close():Promise<void>{
    if(this.phase==='closed')return;
    this.epoch++;this.transitioning=false;this.anchor=undefined;this.glossaryOpen=null;
    this.phase='closed';this.context?.removeEventListener('statechange',this.contextChanged);
    for(const unsubscribe of this.unsubscribe)unsubscribe();
    await this.closeSources();
  }
  private async closeSources(){
    for(const transport of this.transports.values())await transport.close();
  }
}
