import {DecodedSourceStreamTransport, type DecodedSourceStreamBinding,
  type DecodedStreamResult, type DecodedStreamSnapshot}
  from './decoded-source-stream-transport';
export type SourceAudioId='main'|'wrong4'|'right4'|'sa';
export type SourceTransportV1=Pick<DecodedSourceStreamTransport,
  'prepare'|'play'|'pause'|'replay'|'setVolume'|'snapshot'|'close'>;
export interface SourceAudioSnapshotV1 {
  readonly owner:SourceAudioId|null;
  readonly selected:DecodedStreamSnapshot|null;
  readonly main:DecodedStreamSnapshot|null;
  readonly wrong4:DecodedStreamSnapshot|null;
  readonly right4:DecodedStreamSnapshot|null;
  readonly spanish:DecodedStreamSnapshot|null;
  readonly session:number;
  readonly stateEpoch:number;
  readonly closed:boolean;
}
const rejected=(reason:string):DecodedStreamResult=>({accepted:false,reason});

/** One page mount owns the measured streams. The optional SA stream can only
 * start from a direct user action; selecting it cannot start it. */
export class SourceAudioOwnerV1 {
  private readonly transports=new Map<SourceAudioId,SourceTransportV1>();
  private readonly pending=new Set<AbortController>();
  private session=1;
  private selection=0;
  private stateEpoch=0;
  private owner:SourceAudioId|null=null;
  private beforeSpanish:SourceAudioId|null=null;
  private closed=false;
  private volume=1;

  constructor(private readonly bindings:Readonly<Record<SourceAudioId,DecodedSourceStreamBinding>>,
    private readonly getStateEpoch:()=>number,
    private readonly makeTransport:(binding:DecodedSourceStreamBinding,id:SourceAudioId)=>SourceTransportV1=
      binding=>new DecodedSourceStreamTransport(binding)){}

  private live(session:number,epoch:number,signal?:AbortSignal){
    return !this.closed&&session===this.session&&epoch===this.stateEpoch&&
      epoch===this.getStateEpoch()&&!signal?.aborted;
  }
  private transport(id:SourceAudioId){
    let value=this.transports.get(id);
    if(!value){
      value=this.makeTransport(this.bindings[id],id);
      this.transports.set(id,value);
      value.setVolume(this.volume);
    }
    return value;
  }
  private hold(id:SourceAudioId|null){
    if(!id)return;
    const value=this.transports.get(id);
    if(value&&['playing','start-pending'].includes(value.snapshot().phase))value.pause();
  }
  snapshot():SourceAudioSnapshotV1{
    return {owner:this.owner,
      selected:this.owner?this.transports.get(this.owner)?.snapshot()??null:null,
      main:this.transports.get('main')?.snapshot()??null,
      wrong4:this.transports.get('wrong4')?.snapshot()??null,
      right4:this.transports.get('right4')?.snapshot()??null,
      spanish:this.transports.get('sa')?.snapshot()??null,
      session:this.session,stateEpoch:this.stateEpoch,closed:this.closed};
  }
  syncStateEpoch(epoch:number){
    if(this.closed||epoch!==this.getStateEpoch()||epoch<this.stateEpoch)return false;
    if(epoch===this.stateEpoch)return true;
    this.stateEpoch=epoch;
    this.selection++;
    for(const controller of this.pending)controller.abort();
    this.pending.clear();
    this.hold(this.owner);
    return true;
  }
  setVolume(value:number){
    if(this.closed||!Number.isFinite(value)||value<0||value>1)return false;
    this.volume=value;
    let accepted=true;
    for(const transport of this.transports.values())
      accepted=transport.setVolume(value).accepted&&accepted;
    return accepted;
  }
  /** A newer selection aborts earlier loads, even within the same reducer epoch. */
  async select(id:SourceAudioId,epoch:number,
    load:(signal:AbortSignal)=>Promise<ArrayBuffer>,autostart=false):Promise<DecodedStreamResult>{
    if(id==='sa'&&autostart)return rejected('spanish-explicit-user-start-required');
    if(!this.syncStateEpoch(epoch))return rejected('stale-state-epoch');
    const session=this.session,selection=++this.selection,controller=new AbortController();
    for(const older of this.pending)older.abort();
    this.pending.clear();
    this.hold(this.owner);
    if(id==='sa')this.beforeSpanish=this.owner;
    this.owner=id;
    this.pending.add(controller);
    try{
      const bytes=await load(controller.signal);
      if(!this.live(session,epoch,controller.signal)||selection!==this.selection||this.owner!==id)
        return rejected('stale-source-load');
      const transport=this.transport(id);
      const prepared=await transport.prepare(bytes);
      if(!this.live(session,epoch,controller.signal)||selection!==this.selection||this.owner!==id)
        return rejected('stale-source-decode');
      if(!prepared.accepted||!autostart)return prepared;
      const started=await transport.play({activation:'automatic',reducedMotion:false});
      if(!this.live(session,epoch,controller.signal)||selection!==this.selection||this.owner!==id){
        this.hold(id);return rejected('stale-source-start');
      }
      return started;
    }finally{this.pending.delete(controller);}
  }
  /** The host calls this directly from an explicit Play or Close gesture. */
  async play(epoch:number,activation:'user'|'automatic'='user'):Promise<DecodedStreamResult>{
    if(!this.live(this.session,epoch)||!this.owner)return rejected('stale-or-no-audio-owner');
    if(this.owner==='sa'&&activation!=='user')return rejected('spanish-explicit-user-start-required');
    const id=this.owner,session=this.session,selection=this.selection;
    const transport=this.transports.get(id);
    if(!transport)return rejected('source-not-prepared');
    const started=await transport.play({activation,reducedMotion:false});
    if(!this.live(session,epoch)||selection!==this.selection||id!==this.owner){
      this.hold(id);return rejected('stale-audio-start');
    }
    return started;
  }
  pause(){this.hold(this.owner);}
  /** Stop a reducer-cancelled owner and invalidate any load that could arrive
   * after the visual state has moved to a hold or host handoff. */
  cancelCurrent(epoch:number){
    if(!this.live(this.session,epoch))return false;
    this.selection++;
    for(const controller of this.pending)controller.abort();
    this.pending.clear();
    this.hold(this.owner);this.owner=null;this.beforeSpanish=null;
    return true;
  }
  async activatePrepared(id:SourceAudioId,epoch:number,
    activation:'user'|'automatic'='automatic'):Promise<DecodedStreamResult>{
    if(!this.live(this.session,epoch)||id==='sa'&&activation!=='user')
      return rejected('stale-or-unapproved-owner');
    if(!this.transports.has(id))return rejected('source-not-prepared');
    this.hold(this.owner);
    this.owner=id;
    return this.play(epoch,activation);
  }
  /** Returning from SA never starts embedded audio or the visual clock. */
  returnFromSpanish(epoch:number){
    if(!this.live(this.session,epoch)||this.owner!=='sa')return false;
    this.hold('sa');this.transports.get('sa')?.replay();
    this.owner=this.beforeSpanish;
    this.beforeSpanish=null;
    return true;
  }
  replay(epoch:number){
    if(!this.syncStateEpoch(epoch))return false;
    this.selection++;
    for(const controller of this.pending)controller.abort();
    this.pending.clear();
    this.hold(this.owner);
    for(const transport of this.transports.values())transport.replay();
    this.owner=this.transports.has('main')?'main':null;
    this.beforeSpanish=null;
    return true;
  }
  async close(){
    if(this.closed)return;
    this.closed=true;this.session++;this.selection++;
    for(const controller of this.pending)controller.abort();
    this.pending.clear();
    this.hold(this.owner);this.owner=null;this.beforeSpanish=null;
    await Promise.all([...this.transports.values()].map(transport=>transport.close()));
    this.transports.clear();
  }
}
