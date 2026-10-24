import {P038PageRuntimeV1,type P038GlossaryKey} from './alg-l06-p038-runtime-v1';

export type P038SessionSnapshot=ReturnType<P038PageRuntimeV1['snapshot']>;
export type P038SessionRuntime=Pick<P038PageRuntimeV1,
  'snapshot'|'tick'|'prepareMain'|'prepareSpanish'|'play'|'pause'|'openGlossary'|
  'closeGlossary'|'startSpanish'|'returnMain'|'replay'|'setVolume'|'close'>;

export interface P038SessionOptions {
  readyVisual:()=>Promise<unknown>;
  paintInitial:()=>boolean;
  createRuntime:()=>P038SessionRuntime;
  loadMain:(signal:AbortSignal)=>Promise<ArrayBuffer>;
  loadSpanish:(signal:AbortSignal)=>Promise<ArrayBuffer>;
  initialVolume:number;
  getReducedMotion:()=>boolean;
  onSnapshot:(value:P038SessionSnapshot)=>void;
  onFailure:(error:Error)=>void;
  onCloseDialog:()=>void;
}

/** One mount owns one runtime and one AbortController per source stream.
 * Late completions from a StrictMode cleanup cannot prepare or play a successor. */
export class P038PlayerSessionV1 {
  private readonly mainAbort=new AbortController();
  private spanishAbort:AbortController|null=null;
  private spanishFlight:Promise<boolean>|null=null;
  private runtime:P038SessionRuntime|null=null;
  private starting=false;
  private disposed=false;
  private ready=false;
  private spanishReady=false;
  private pendingPlay=false;
  private actionEpoch=0;
  private trigger:HTMLButtonElement|null=null;
  private error:Error|null=null;

  constructor(private readonly options:P038SessionOptions){}
  get failure(){return this.error;}
  get isReady(){return this.ready;}
  get isDisposed(){return this.disposed;}
  get current(){return this.runtime?.snapshot()??null;}
  private publish(){
    if(!this.disposed&&this.runtime)this.options.onSnapshot(this.runtime.snapshot());
  }
  private fail(value:unknown){
    if(this.disposed)return;
    this.error=value instanceof Error?value:new Error(String(value));
    this.pendingPlay=false;
    try{this.options.onFailure(this.error);}catch{/* isolate observer */}finally{
      void this.close().catch(()=>{});
    }
  }
  private cancelSpanishFlight(){
    this.actionEpoch++;
    this.spanishAbort?.abort();this.spanishAbort=null;this.spanishFlight=null;
  }
  async start():Promise<void>{
    if(this.disposed||this.starting||this.runtime)return;
    this.starting=true;
    try{
      await this.options.readyVisual();
      if(this.disposed)return;
      if(!this.options.paintInitial())throw Error('P038_INITIAL_FRAME_COMMIT_FAILED');
      if(this.disposed)return;
      const runtime=this.options.createRuntime();this.runtime=runtime;
      const bytes=await this.options.loadMain(this.mainAbort.signal);
      if(this.disposed||this.mainAbort.signal.aborted)return;
      const prepared=await runtime.prepareMain(bytes);
      if(this.disposed||this.runtime!==runtime)return;
      if(!prepared.accepted)throw Error(prepared.reason);
      const volume=runtime.setVolume(this.options.initialVolume);
      if(!volume.accepted)throw Error(volume.reason);
      this.ready=true;this.publish();
      if(this.pendingPlay){this.pendingPlay=false;await this.play();}
    }catch(error){this.fail(error);}
  }
  async play():Promise<boolean>{
    if(this.disposed||this.error)return false;
    if(!this.ready||!this.runtime){this.pendingPlay=true;return true;}
    const runtime=this.runtime;
    try{
      const result=runtime.snapshot().selectedAudio==='spanish'?
        await runtime.startSpanish({activation:'user'}):
        await runtime.play({activation:'user',
          reducedMotion:this.options.getReducedMotion()});
      if(this.disposed||this.runtime!==runtime)return false;
      this.publish();
      if(!result.accepted){
        // The transport keeps gesture rejection/interruption recoverable.
        // A canceled older start must not close the newer live owner either.
        if(['failed','closed'].includes(runtime.snapshot().phase))
          this.fail(Error(result.reason));
        return false;
      }
      return true;
    }catch(error){this.fail(error);return false;}
  }
  pause(){
    this.pendingPlay=false;
    if(this.disposed||!this.ready||!this.runtime)return;
    this.runtime.pause();this.publish();
  }
  tick(){if(this.disposed||!this.runtime)return;this.runtime.tick();this.publish();}
  setVolume(value:number){
    if(this.disposed||!this.runtime)return;
    const result=this.runtime.setVolume(value);
    if(!result.accepted)this.fail(Error(result.reason));
  }
  openGlossary(key:P038GlossaryKey,trigger:HTMLButtonElement,
    onOpen:(key:P038GlossaryKey,trigger:HTMLButtonElement)=>void):boolean{
    if(this.disposed||!this.ready||!this.runtime)return false;
    this.trigger=trigger;
    const result=this.runtime.openGlossary(key);
    if(!result.accepted){this.trigger=null;this.publish();return false;}
    try{onOpen(key,trigger);this.publish();return true;}
    catch(error){this.closeGlossary();this.fail(error);return false;}
  }
  closeGlossary(){
    if(this.runtime?.snapshot().glossaryOpen)this.runtime.closeGlossary();
    this.options.onCloseDialog();
    const trigger=this.trigger;this.trigger=null;
    this.publish();
    if(trigger?.isConnected&&!trigger.disabled)trigger.focus({preventScroll:true});
  }
  async startSpanish():Promise<boolean>{
    if(this.disposed||!this.ready||!this.runtime||this.error)return false;
    if(this.spanishFlight)return this.spanishFlight;
    const runtime=this.runtime;
    // An explicit request holds the original main cursor throughout SA loading.
    runtime.pause();this.publish();
    const ticket=++this.actionEpoch,controller=new AbortController();
    this.spanishAbort=controller;
    const flight=Promise.resolve().then(async()=>{
      try{
        if(this.disposed||controller.signal.aborted||ticket!==this.actionEpoch)
          return false;
        if(!this.spanishReady){
          const bytes=await this.options.loadSpanish(controller.signal);
          if(this.disposed||controller.signal.aborted||ticket!==this.actionEpoch)return false;
          const prepared=await runtime.prepareSpanish(bytes);
          if(this.disposed)return false;
          if(prepared.accepted)this.spanishReady=true;
          if(controller.signal.aborted||ticket!==this.actionEpoch)return false;
          if(!prepared.accepted)throw Error(prepared.reason);
        }
        const started=await runtime.startSpanish({activation:'user'});
        if(this.disposed||ticket!==this.actionEpoch)return false;
        if(!started.accepted){
          this.publish();
          if(['failed','closed'].includes(runtime.snapshot().phase))
            this.fail(Error(started.reason));
          return false;
        }
        this.publish();return true;
      }catch(error){
        if(!this.disposed&&!controller.signal.aborted&&ticket===this.actionEpoch)this.fail(error);
        return false;
      }finally{
        if(this.spanishAbort===controller)this.spanishAbort=null;
        if(this.actionEpoch===ticket)this.spanishFlight=null;
      }
    });
    this.spanishFlight=flight;return flight;
  }
  returnMain(){
    if(this.disposed||!this.runtime)return false;
    this.cancelSpanishFlight();
    if(this.runtime.snapshot().selectedAudio!=='spanish'){
      this.publish();return true;
    }
    const result=this.runtime.returnMain();this.publish();
    if(!result.accepted)this.fail(Error(result.reason));
    return result.accepted;
  }
  replay(onBeforeReset:()=>void):boolean{
    if(this.disposed||!this.ready||!this.runtime)return false;
    this.pendingPlay=false;this.cancelSpanishFlight();this.closeGlossary();
    onBeforeReset();
    const result=this.runtime.replay();this.publish();
    if(!result.accepted)this.fail(Error(result.reason));
    return result.accepted;
  }
  async close():Promise<void>{
    if(this.disposed)return;
    this.disposed=true;this.pendingPlay=false;this.cancelSpanishFlight();
    this.mainAbort.abort();
    try{this.options.onCloseDialog();}catch{/* closed mount */}
    this.trigger=null;const runtime=this.runtime;this.runtime=null;
    if(runtime)await runtime.close();
  }
}
