import type {GlossaryTransport,GlossaryTransportSnapshot} from './source-glossary-session';

/** A source-pinned full-buffer modern playback proposal. The caller owns byte
 * verification/decoding; this transport owns only timeline and audio lifecycle.
 * SWF block seek, silence, and original-host synchronization are not inferred. */
export interface SourceLinearAudioConfig {
  readonly frameCount:number;
  readonly fps:number;
  readonly sampleRate:number;
  readonly channels:number;
  readonly audioStartFrame:number;
  readonly decodedSamples:number;
  readonly originalBlockHeaderSamples:number;
  readonly sourceSwfSha256:string;
  readonly mp3Sha256:string;
}
export interface SourceLinearAudioOptions {
  /** Must fetch, hash-check and decode the configured source bytes. */
  readonly readVerified:(signal:AbortSignal)=>Promise<AudioBuffer>;
  readonly createContext?:()=>AudioContext;
  readonly onChange?:(snapshot:GlossaryTransportSnapshot)=>void;
}
const SHA=/^[a-f0-9]{64}$/u;
const fail=(detail:string)=>{throw Error(`LINEAR_AUDIO_${detail}`);};
const validInteger=(value:number)=>Number.isSafeInteger(value)&&value>0;

export function sourceLinearAudioConfig(config:SourceLinearAudioConfig):Readonly<SourceLinearAudioConfig & {
  samplesPerFrame:number;audioStartTimelineSample:number;audioEndTimelineSample:number;
  terminalTimelineSample:number;
}> {
  if(!validInteger(config.frameCount)||config.frameCount<2||!Number.isFinite(config.fps)||config.fps<=0||
    !validInteger(config.sampleRate)||!validInteger(config.channels)||
    !validInteger(config.audioStartFrame)||config.audioStartFrame>config.frameCount||
    !validInteger(config.decodedSamples)||!validInteger(config.originalBlockHeaderSamples)||
    !SHA.test(config.sourceSwfSha256)||!SHA.test(config.mp3Sha256))fail('CONFIG');
  if(config.originalBlockHeaderSamples!==config.decodedSamples)fail('SOURCE_SAMPLES');
  const samplesPerFrame=config.sampleRate/config.fps;
  const audioStartTimelineSample=(config.audioStartFrame-1)*samplesPerFrame;
  const audioEndTimelineSample=audioStartTimelineSample+config.decodedSamples;
  const terminalTimelineSample=config.frameCount*samplesPerFrame;
  if(!Number.isFinite(terminalTimelineSample)||audioEndTimelineSample>terminalTimelineSample)
    fail('TIMELINE');
  return Object.freeze({...config,samplesPerFrame,audioStartTimelineSample,
    audioEndTimelineSample,terminalTimelineSample});
}
export type SourceLinearAudioSchedule=ReturnType<typeof sourceLinearAudioConfig>;
export function sourceLinearFrameToSample(config:SourceLinearAudioSchedule,frame:number):number {
  if(!Number.isSafeInteger(frame)||frame<1||frame>config.frameCount)fail('FRAME');
  return (frame-1)*config.samplesPerFrame;
}
export function sourceLinearSampleToFrame(config:SourceLinearAudioSchedule,sample:number):number {
  if(!Number.isFinite(sample)||sample<0||sample>config.terminalTimelineSample)fail('SAMPLE');
  return Math.min(config.frameCount,1+Math.floor(sample/config.samplesPerFrame+1e-9));
}

export class SourceLinearAudioController implements GlossaryTransport {
  readonly config:SourceLinearAudioSchedule;
  private context:AudioContext|null=null;
  private gain:GainNode|null=null;
  private buffer:AudioBuffer|null=null;
  private node:AudioBufferSourceNode|null=null;
  private abort:AbortController|null=null;
  private pending:Promise<boolean>|null=null;
  private closing:Promise<void>|null=null;
  private generation=0;
  private loading=false;
  private resumeReady=false;
  private closed=false;
  private sample=0;
  private anchorTime:number|null=null;
  private anchorSample=0;
  private volume=0;
  private error:string|null=null;
  constructor(config:SourceLinearAudioConfig,private readonly options:SourceLinearAudioOptions) {
    this.config=sourceLinearAudioConfig(config);
    if(typeof options.readVerified!=='function')fail('READER');
  }
  private readonly contextStateChanged=():void=>{
    if(!this.closed&&this.context?.state!=='running'&&
      (this.anchorTime!==null||(this.loading&&this.resumeReady)))this.pause();
  };
  private position():number {
    if(this.anchorTime===null||!this.context)return this.sample;
    return Math.min(this.config.terminalTimelineSample,this.anchorSample+
      Math.max(0,this.context.currentTime-this.anchorTime)*this.config.sampleRate);
  }
  private rawSnapshot():GlossaryTransportSnapshot {
    const timelineSample=this.position();
    const phase=this.closed?'closed':this.loading?'loading':this.error?'error':
      timelineSample===this.config.terminalTimelineSample?'ended':
      this.anchorTime!==null?'playing':'paused';
    return {phase,frame:sourceLinearSampleToFrame(this.config,timelineSample),
      timelineSample,volume:this.volume,error:this.error};
  }
  private emit():void {this.options.onChange?.(this.rawSnapshot());}
  private dispose(node:AudioBufferSourceNode,stop:boolean):void {
    node.onended=null;
    try{if(stop)node.stop();}catch{ /* Stopped or not yet started. */ }
    try{node.disconnect();}catch{ /* Context close owns graph. */ }
  }
  private detach():void {
    const node=this.node;this.node=null;
    if(node)this.dispose(node,true);
    this.anchorTime=null;
  }
  private finishAtEnd():void {
    if(this.anchorTime!==null&&this.position()>=this.config.terminalTimelineSample){
      this.sample=this.config.terminalTimelineSample;this.detach();this.emit();
    }
  }
  snapshot():GlossaryTransportSnapshot {
    this.contextStateChanged();this.finishAtEnd();return this.rawSnapshot();
  }
  pause():void {
    if(this.closed)return;
    this.sample=this.position();this.generation++;
    this.abort?.abort();this.abort=null;this.pending=null;
    this.loading=false;this.resumeReady=false;this.detach();this.emit();
  }
  seekFrame(frame:number):void {
    const sample=sourceLinearFrameToSample(this.config,frame);
    if(this.closed)fail('CLOSED');
    this.pause();this.error=null;this.sample=sample;this.emit();
  }
  reset():void {this.seekFrame(1);}
  setVolume(volume:number):void {
    if(!Number.isFinite(volume)||volume<0||volume>1)fail('VOLUME');
    if(this.closed)fail('CLOSED');
    this.volume=volume;if(this.gain)this.gain.gain.value=volume;this.emit();
  }
  private ensureContext():AudioContext {
    if(this.context){
      if(this.context.state==='closed')fail('CONTEXT_CLOSED');
      return this.context;
    }
    const context=this.options.createContext?.()??new AudioContext({sampleRate:this.config.sampleRate});
    try{
      if(context.sampleRate!==this.config.sampleRate||context.state==='closed')fail('CONTEXT_RATE');
      const gain=context.createGain();gain.gain.value=this.volume;gain.connect(context.destination);
      context.addEventListener('statechange',this.contextStateChanged);
      this.context=context;this.gain=gain;return context;
    }catch(error){void context.close().catch(()=>{});throw error;}
  }
  private verifiedBuffer(buffer:AudioBuffer):AudioBuffer {
    if(buffer.sampleRate!==this.config.sampleRate||buffer.numberOfChannels!==this.config.channels||
      buffer.length!==this.config.decodedSamples)fail('DECODE');
    for(let channel=0;channel<buffer.numberOfChannels;channel++){
      const samples=buffer.getChannelData(channel);
      if(samples.length!==this.config.decodedSamples||!samples.every(Number.isFinite))fail('DECODE');
    }
    return buffer;
  }
  play():Promise<boolean> {
    if(this.closed)return Promise.resolve(false);
    this.contextStateChanged();this.finishAtEnd();
    if(this.anchorTime!==null)return Promise.resolve(true);
    if(this.pending)return this.pending;
    if(this.sample===this.config.terminalTimelineSample)return Promise.resolve(false);
    this.error=null;
    const ticket=++this.generation;
    const current=()=>!this.closed&&this.generation===ticket;
    const abort=new AbortController();this.abort=abort;
    this.loading=true;this.resumeReady=false;
    const pending=(async():Promise<boolean>=>{
      try{
        const context=this.ensureContext();
        // Explicit Play gesture resumes the context before the first await.
        await context.resume();
        if(!current())return false;
        if(context.state!=='running')fail('CONTEXT_NOT_RUNNING');
        this.resumeReady=true;
        const buffer=this.buffer??this.verifiedBuffer(await this.options.readVerified(abort.signal));
        if(!current())return false;
        this.buffer=this.verifiedBuffer(buffer);
        if(context.state!=='running'){this.pause();return false;}
        const anchor=context.currentTime;
        const timelineStart=Math.max(this.sample,this.config.audioStartTimelineSample);
        const sourceStart=timelineStart-this.config.audioStartTimelineSample;
        if(sourceStart<this.config.decodedSamples){
          const node=context.createBufferSource();node.buffer=buffer;node.loop=false;
          try{
            node.connect(this.gain!);
            node.start(anchor+(timelineStart-this.sample)/this.config.sampleRate,
              sourceStart/this.config.sampleRate,
              (this.config.decodedSamples-sourceStart)/this.config.sampleRate);
          }catch(error){this.dispose(node,true);throw error;}
          if(!current()){this.dispose(node,true);return false;}
          this.node=node;
          node.onended=()=>{
            if(!current()||this.node!==node)return;
            this.node=null;this.dispose(node,false);this.emit();
          };
        }
        this.anchorSample=this.sample;this.anchorTime=anchor;this.emit();return true;
      }catch(error){
        if(!current())return false;
        abort.abort();this.detach();
        const message=error instanceof Error?error.message:'';
        this.error=/^LINEAR_AUDIO_[A-Z_]+$/u.test(message)?message:'LINEAR_AUDIO_LOAD';
        this.emit();return false;
      }finally{
        if(current()){
          this.loading=false;this.resumeReady=false;this.abort=null;this.pending=null;this.emit();
        }
      }
    })();
    this.pending=pending;
    void pending.then(()=>{if(current()&&this.pending===pending)this.pending=null;});
    this.emit();return pending;
  }
  replay():Promise<boolean> {
    if(this.closed)return Promise.resolve(false);
    this.reset();return this.play();
  }
  close():Promise<void> {
    if(this.closing)return this.closing;
    this.pause();this.closed=true;
    this.context?.removeEventListener('statechange',this.contextStateChanged);
    try{this.gain?.disconnect();}catch{ /* Closing context releases graph. */ }
    this.closing=this.context?.close()??Promise.resolve();this.emit();return this.closing;
  }
}
