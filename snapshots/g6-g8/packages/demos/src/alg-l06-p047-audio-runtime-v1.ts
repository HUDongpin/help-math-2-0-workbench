import {DecodedSourceStreamTransport, type DecodedSourceStreamBinding,
  type DecodedStreamSnapshot} from './decoded-source-stream-transport';
import {P047_MEASURED_BINDINGS, type P047AudioDomain} from './alg-l06-p047-measured-bindings-v1';
import {initialP047State, reduceP047, type P047State, type P047Event,
  type P047Transition, type P047Effect} from './alg-l06-p047-state-v1';

export type P047Transport = Pick<DecodedSourceStreamTransport,
  'prepare'|'play'|'pause'|'replay'|'snapshot'|'setVolume'|'subscribe'|'close'>;
type ClockDomain = Exclude<P047AudioDomain,'sa'>;
type Anchor = {time:number; position:number; audioEpoch:number};
type Loader = (domain:P047AudioDomain,signal:AbortSignal)=>Promise<ArrayBuffer>;
const domains:P047AudioDomain[] = ['main','wrong','right','sa'];
const clockDomains:ClockDomain[] = ['main','wrong','right'];
export type P047RuntimeSnapshot = Readonly<{
  state:P047State; ready:boolean; failure:string|null; spanishLoading:boolean;
  tracks:Readonly<Record<P047AudioDomain,DecodedStreamSnapshot>>;
  visualClockRunning:boolean;
  clockAuthority:'engineering-12fps-audio-context-observer';
  sourceFrameAlignmentAccepted:false; listeningAccepted:false; lessonCompleted:false;
}>;

/** Four source transports. Wrong and right deliberately have separate owners,
 * epochs and clocks: an accepted drop replaces only the same coach stream.
 * The observer does not equate MP3 decoder samples with original SWF frames. */
export class P047PageRuntimeV1 {
  private state = initialP047State();
  private readonly tracks:Record<P047AudioDomain,P047Transport>;
  private readonly contexts:Partial<Record<P047AudioDomain,AudioContext>> = {};
  private readonly generations:Record<P047AudioDomain,number> = {main:0,wrong:0,right:0,sa:0};
  private readonly anchors:Partial<Record<ClockDomain,Anchor>> = {};
  private readonly positions:Record<ClockDomain,number> = {main:1,wrong:2,right:2};
  private readonly abort = new AbortController();
  private readonly unsubscribe:(()=>void)[] = [];
  private ready = false;
  private closed = false;
  private started = false;
  private spanishPrepared = false;
  private spanishLoading = false;
  private failure:string|null = null;
  private ticking = false;
  constructor(private readonly options:{load:Loader;
    onSnapshot?:(snapshot:P047RuntimeSnapshot)=>void;
    onGlossary?:(term:string)=>void; onCleanup?:()=>void;
    makeTransport?:(binding:DecodedSourceStreamBinding,domain:P047AudioDomain)=>P047Transport;
    resumeEnded?:(domain:ClockDomain)=>Promise<boolean>;
  }) {
    this.tracks = Object.fromEntries(domains.map(domain=> {
      const track = options.makeTransport?.(P047_MEASURED_BINDINGS[domain],domain) ??
        new DecodedSourceStreamTransport(P047_MEASURED_BINDINGS[domain],{createContext:()=>{
          return this.context(domain);
        }});
      return [domain,track];
    })) as Record<P047AudioDomain,P047Transport>;
    for(const domain of domains)this.unsubscribe.push(this.tracks[domain].subscribe(()=>this.publish()));
  }
  private context(domain:P047AudioDomain):AudioContext {
    return this.contexts[domain]??(this.contexts[domain]=new AudioContext({
      sampleRate:P047_MEASURED_BINDINGS[domain].sampleRate,latencyHint:'interactive'}));
  }
  snapshot():P047RuntimeSnapshot {
    return {state:this.state,ready:this.ready&&!this.closed,failure:this.failure,spanishLoading:this.spanishLoading,
      tracks:Object.fromEntries(domains.map(id=>[id,this.tracks[id].snapshot()])) as Record<P047AudioDomain,DecodedStreamSnapshot>,
      visualClockRunning:!this.closed && Object.keys(this.anchors).length>0,
      clockAuthority:'engineering-12fps-audio-context-observer',
      sourceFrameAlignmentAccepted:false,listeningAccepted:false,lessonCompleted:false};
  }
  private publish():void {
    if(!this.closed)try{this.options.onSnapshot?.(this.snapshot());}catch{/* observer only */}
  }
  async start():Promise<boolean> {
    if(this.started||this.closed)return false;
    this.started=true;
    // Optional SA is requested only by an explicit Spanish Audio activation.
    const results=await Promise.allSettled(clockDomains.map(async domain=>{
      const bytes=await this.options.load(domain,this.abort.signal);
      if(this.closed||this.abort.signal.aborted)return false;
      const result=await this.tracks[domain].prepare(bytes);
      if(!result.accepted)throw Error(`${domain}: ${result.reason}`);
      return true;
    }));
    if(this.closed)return false;
    const failed=results.find(result=>result.status==='rejected'||!result.value);
    if(failed){this.failure=failed.status==='rejected'?String(failed.reason):'audio load retired';this.publish();return false;}
    this.ready=true;this.publish();return true;
  }
  private position(domain:ClockDomain):number {
    const anchor=this.anchors[domain], audio=this.tracks[domain].snapshot();
    if(!anchor||audio.contextTime===null||audio.epoch!==anchor.audioEpoch)return this.positions[domain];
    return Math.min(domain==='main'?889:20,
      anchor.position+Math.max(0,audio.contextTime-anchor.time)*12);
  }
  private hold(domain:P047AudioDomain,reset=false):void {
    this.generations[domain]++;
    if(domain==='sa')this.spanishLoading=false;
    if(domain!=='sa') {
      this.positions[domain]=this.position(domain);
      delete this.anchors[domain];
    }
    if(reset) {
      this.tracks[domain].replay();
      if(domain!=='sa')this.positions[domain]=domain==='main'?1:2;
    } else this.tracks[domain].pause();
  }
  private currentStart(domain:P047AudioDomain,generation:number,epoch:number,token?:number):boolean {
    if(this.closed||generation!==this.generations[domain]||epoch!==this.state.epoch)return false;
    if(domain==='sa')return this.state.spanishSelected;
    if(domain==='main')return this.state.mainPlaying&&!this.state.suspended;
    return this.state.coaches[domain]?.token===token && this.state.coaches[domain]?.playing===true;
  }
  private async startSpanish(activation:'user'|'automatic'):Promise<void> {
    if(this.spanishPrepared){void this.playTrack('sa',1,activation,true);return;}
    this.hold('sa',true);
    const ticket=++this.generations.sa,epoch=this.state.epoch;
    this.spanishLoading=true;this.publish();
    // Unlock the real context while the click still owns browser activation.
    // prepare() later uses this same context and still validates every byte.
    const unlock=this.options.makeTransport?Promise.resolve():this.context('sa').resume();
    try {
      await unlock;
      const bytes=await this.options.load('sa',this.abort.signal);
      if(!this.currentStart('sa',ticket,epoch))return;
      const result=await this.tracks.sa.prepare(bytes);
      if(!this.currentStart('sa',ticket,epoch))return;
      if(!result.accepted)throw Error(result.reason);
      this.spanishPrepared=true;
      void this.playTrack('sa',1,activation,true);
    } catch(error) {
      if(!this.currentStart('sa',ticket,epoch))return;
      this.failure=`sa: ${String(error)}`;
      this.apply({type:'pause',epoch:this.state.epoch},'automatic');
    }
  }
  private async playTrack(domain:P047AudioDomain,frame:number,activation:'user'|'automatic',restart:boolean,token?:number):Promise<void> {
    if(restart)this.hold(domain,true);
    const generation=++this.generations[domain], epoch=this.state.epoch;
    if(domain!=='sa')this.positions[domain]=Math.max(frame,this.positions[domain]);
    const before=this.tracks[domain].snapshot();
    let accepted:boolean, reason:string;
    if(domain!=='sa'&&before.phase==='buffer-ended') {
      // An explicit resume after decoder EOF may continue the visual tail.
      // No sample is fabricated and EOF never becomes lesson completion.
      const context=this.contexts[domain];
      try {
        if(this.options.resumeEnded)accepted=await this.options.resumeEnded(domain);
        else {await context?.resume();accepted=context?.state==='running';}
        reason='visual tail context resume';
      } catch {accepted=false;reason='visual tail context resume failed';}
    } else {
      const result=await this.tracks[domain].play({activation,reducedMotion:false});
      accepted=result.accepted;reason=result.reason;
    }
    if(!this.currentStart(domain,generation,epoch,token))return;
    const audio=this.tracks[domain].snapshot();
    if(!accepted||audio.contextTime===null) {
      this.failure=`${domain}: ${reason}`;
      this.apply({type:'pause',epoch:this.state.epoch},'automatic');
      return;
    }
    if(domain!=='sa')this.anchors[domain]={
      time:audio.playbackAnchor?.contextTime??audio.contextTime,
      position:this.positions[domain],audioEpoch:audio.epoch};
    this.publish();
  }
  private effect(effect:P047Effect,event:P047Event,activation:'user'|'automatic'):void {
    switch(effect.type) {
      case 'audio:pauseAll':for(const domain of domains)this.hold(domain);break;
      case 'audio:cancelAll':for(const domain of domains)this.hold(domain,true);break;
      case 'audio:pauseMain':this.hold('main');this.positions.main=this.state.mainFrame;break;
      case 'audio:cancelCoaches':this.hold('wrong',true);this.hold('right',true);break;
      case 'audio:explicitSpanish':void this.startSpanish(activation);break;
      case 'audio:resumeSpanish':
        if(!this.spanishPrepared)void this.startSpanish(activation);
        else void this.playTrack('sa',1,activation,this.tracks.sa.snapshot().phase==='buffer-ended');
        break;
      case 'main:play':void this.playTrack('main',effect.frame,activation,false);break;
      case 'coach:play':void this.playTrack(effect.kind,effect.frame,activation,event.type==='drop',effect.token);break;
      case 'coach:stop':this.hold(effect.kind,true);break;
      case 'host:DoHyperLinks':try{this.options.onGlossary?.(effect.term);}catch{this.failure='glossary host unavailable';}break;
      case 'host:cleanup':try{this.options.onCleanup?.();}catch{/* cleanup is idempotent */}break;
      case 'legacy:unboundCall':break; // No page-owned visual/audio target exists for these source calls.
    }
  }
  private apply(event:P047Event,activation:'user'|'automatic'):P047Transition {
    const transition=reduceP047(this.state,event);
    if(!transition.accepted)return transition;
    this.state=transition.state;
    if(event.type==='play'||event.type==='replay')this.failure=null;
    for(const effect of transition.effects)this.effect(effect,event,activation);
    this.publish();return transition;
  }
  send(event:P047Event):P047Transition {
    if(this.closed||(!this.ready&&!['replay','leave','pause'].includes(event.type)))
      return {accepted:false,reason:'page unavailable',state:this.state,effects:[]};
    this.tick();
    return this.apply(event,'user');
  }
  tick():void {
    if(this.closed||this.ticking)return;
    this.ticking=true;
    try {
      for(const domain of clockDomains) {
        const anchor=this.anchors[domain];if(!anchor)continue;
        const audio=this.tracks[domain].snapshot();
        if(audio.epoch!==anchor.audioEpoch||!['playing','buffer-ended'].includes(audio.phase)) {
          this.failure=`${domain}: audio clock interrupted`;
          this.apply({type:'pause',epoch:this.state.epoch},'automatic');break;
        }
        const frame=Math.floor(this.position(domain)+1e-8);
        if(domain==='main') {
          if(frame>this.state.mainFrame)this.apply({type:'advance-main',frame,epoch:this.state.epoch},'automatic');
        } else {
          const coach=this.state.coaches[domain];
          if(coach&&frame>coach.frame)this.apply({type:'advance-coach',kind:domain,frame,token:coach.token,epoch:this.state.epoch},'automatic');
        }
      }
      this.publish();
    } finally {this.ticking=false;}
  }
  setVolume(volume:number):boolean {
    if(this.closed||!Number.isFinite(volume)||volume<0||volume>1)return false;
    for(const domain of domains)this.tracks[domain].setVolume(volume);
    this.publish();return true;
  }
  async close():Promise<void> {
    if(this.closed)return;
    this.apply({type:'leave',epoch:this.state.epoch},'automatic');
    this.closed=true;this.ready=false;this.abort.abort();
    for(const unsubscribe of this.unsubscribe)unsubscribe();
    await Promise.all(domains.map(domain=>this.tracks[domain].close()));
    // A Spanish context can be unlocked before its fetch/prepare finishes.
    // Such a context is not yet attached to the transport and is still ours.
    await Promise.all(Object.values(this.contexts).filter(context=>context.state!=='closed').map(context=>context.close()));
  }
}
