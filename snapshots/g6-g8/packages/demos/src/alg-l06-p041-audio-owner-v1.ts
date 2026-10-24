import {DecodedSourceStreamTransport,type DecodedSourceStreamBinding,
  type DecodedStreamResult,type DecodedStreamSnapshot}
  from './decoded-source-stream-transport';
import {P041_MEASURED_BINDINGS,type P041MeasuredDomainId}
  from './alg-l06-p041-measured-bindings-v1';

export type P041AudioId=P041MeasuredDomainId;
type Transport=Pick<DecodedSourceStreamTransport,
  'prepare'|'play'|'pause'|'replay'|'setVolume'|'snapshot'|'close'>;
export type P041AudioSnapshot={
  owner:P041AudioId|null; selected:DecodedStreamSnapshot|null;
  main:DecodedStreamSnapshot|null; spanish:DecodedStreamSnapshot|null;
  session:number; stateEpoch:number; closed:boolean;
};
const rejected=(reason:string):DecodedStreamResult=>({accepted:false,reason});

/** A mount owns one transport per measured source stream. The page reducer's
 * epoch and this session token must both still match after every async edge. */
export class P041AudioOwnerV1 {
  private readonly transports=new Map<P041AudioId,Transport>();
  private readonly pending=new Set<AbortController>();
  private session=1;
  private selection=0;
  private stateEpoch=0;
  private owner:P041AudioId|null=null;
  private previousBeforeSpanish:P041AudioId|null=null;
  private closed=false;
  private volume=1;

  constructor(private readonly getStateEpoch:()=>number,
    private readonly makeTransport:(binding:DecodedSourceStreamBinding,id:P041AudioId)=>Transport=
      binding=>new DecodedSourceStreamTransport(binding)){}

  private live(session:number,epoch:number,signal?:AbortSignal){
    return !this.closed&&session===this.session&&epoch===this.stateEpoch&&
      epoch===this.getStateEpoch()&&!signal?.aborted;
  }
  private transport(id:P041AudioId){
    let value=this.transports.get(id);
    if(!value){value=this.makeTransport(P041_MEASURED_BINDINGS[id],id);
      this.transports.set(id,value);value.setVolume(this.volume);}
    return value;
  }
  private hold(id:P041AudioId|null){
    if(!id)return;
    const value=this.transports.get(id);
    if(value&&['playing','start-pending'].includes(value.snapshot().phase))value.pause();
  }
  snapshot():P041AudioSnapshot{
    return {owner:this.owner,selected:this.owner?this.transports.get(this.owner)?.snapshot()??null:null,
      main:this.transports.get('main')?.snapshot()??null,
      spanish:this.transports.get('sa')?.snapshot()??null,
      session:this.session,stateEpoch:this.stateEpoch,closed:this.closed};
  }
  /** Reset pending loads and previously selected playback on source state change.
   * A matching epoch is required before touching any transport. */
  syncStateEpoch(epoch:number){
    if(this.closed||epoch!==this.getStateEpoch()||epoch<this.stateEpoch)return false;
    if(epoch===this.stateEpoch)return true;
    this.stateEpoch=epoch;
    for(const controller of this.pending)controller.abort();
    this.pending.clear();
    this.hold(this.owner);
    return true;
  }
  setVolume(value:number){
    if(this.closed||!Number.isFinite(value)||value<0||value>1)return false;
    this.volume=value;
    return [...this.transports.values()].every(t=>t.setVolume(value).accepted);
  }
  /** Selection alone never starts SA. Embedded feedback may autostart after
   * exact byte/PCM preparation; a browser gesture rejection stays held. */
  async select(id:P041AudioId,epoch:number,
    load:(signal:AbortSignal)=>Promise<ArrayBuffer>,autostart=false):Promise<DecodedStreamResult>{
    if(id==='sa'&&autostart)return rejected('spanish-explicit-user-start-required');
    if(!this.syncStateEpoch(epoch))return rejected('stale-state-epoch');
    const session=this.session,selection=++this.selection,
      controller=new AbortController();
    for(const older of this.pending)older.abort();
    this.pending.clear();
    this.hold(this.owner);
    if(id==='sa')this.previousBeforeSpanish=this.owner;
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
      if(!prepared.accepted)return prepared;
      if(!autostart)return prepared;
      const started=await transport.play({activation:'automatic',reducedMotion:false});
      if(!this.live(session,epoch,controller.signal)||selection!==this.selection||this.owner!==id){
        this.hold(id);return rejected('stale-source-start');
      }
      return started;
    }finally{this.pending.delete(controller);}
  }
  /** Explicit Play is the recovery path for a rejected automatic start. */
  async play(epoch:number,activation:'user'|'automatic'='user',delaySeconds=0)
    :Promise<DecodedStreamResult>{
    if(!this.live(this.session,epoch)||!this.owner)return rejected('stale-or-no-audio-owner');
    if(this.owner==='sa'&&activation!=='user')return rejected('spanish-explicit-user-start-required');
    const id=this.owner,session=this.session;
    const t=this.transports.get(id);
    if(!t)return rejected('source-not-prepared');
    const result=await t.play({activation,reducedMotion:false,delaySeconds});
    if(!this.live(session,epoch)||id!==this.owner){this.hold(id);return rejected('stale-audio-start');}
    return result;
  }
  pause(){this.hold(this.owner);}
  async activatePrepared(id:P041AudioId,epoch:number,
    activation:'user'|'automatic'='automatic'):Promise<DecodedStreamResult>{
    if(!this.live(this.session,epoch)||id==='sa'&&activation!=='user')
      return rejected('stale-or-unapproved-owner');
    const target=this.transports.get(id);
    if(!target)return rejected('source-not-prepared');
    this.hold(this.owner);this.owner=id;
    return this.play(epoch,activation);
  }
  /** Return from optional SA holds the previous owner and resets SA only. */
  returnFromSpanish(epoch:number){
    if(!this.live(this.session,epoch)||this.owner!=='sa')return false;
    this.hold('sa');this.transports.get('sa')?.replay();
    this.owner=this.previousBeforeSpanish;
    this.previousBeforeSpanish=null;
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
    this.previousBeforeSpanish=null;
    return true;
  }
  async close(){
    if(this.closed)return;
    this.closed=true;this.session++;
    this.selection++;
    for(const controller of this.pending)controller.abort();
    this.pending.clear();this.hold(this.owner);this.owner=null;
    await Promise.all([...this.transports.values()].map(t=>t.close()));
    this.transports.clear();
  }
}
