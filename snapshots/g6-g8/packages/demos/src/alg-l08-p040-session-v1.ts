import{SourceStreamRunsClockV2,type SourceStreamRunsClockPlan}from'./source-stream-runs-clock-v2';
import{DecodedSourceStreamTransport}from'./decoded-source-stream-transport';
import{ALG_L08_P040_SOURCE as S}from'./alg-l08-p040-source-v1';
import{p040InitialState,p040Act,p040WorldTick,p040InstructionFrame,p040FeedbackFrame,type P040ProductAction,type P040AnswerFlag}from'./alg-l08-p040-state-v1';
export type P040AudioId=255|237|249|'sa';
export type P040Clock=Pick<SourceStreamRunsClockV2,'snapshot'|'prepare'|'play'|'pause'|'seekCandidateFrame'|'setVolume'|'close'>;
export type P040Spanish=Pick<DecodedSourceStreamTransport,'snapshot'|'prepare'|'play'|'pause'|'replay'|'setVolume'|'close'|'subscribe'>;
export interface P040SessionOptions{seed?:number;load:(id:P040AudioId,signal:AbortSignal)=>Promise<ArrayBuffer>;changed:()=>void;now?:()=>number;makeClock?:(plan:SourceStreamRunsClockPlan)=>P040Clock;makeSpanish?:()=>P040Spanish;}
type Action=P040ProductAction extends infer E?E extends{epoch:number}?Omit<E,'epoch'>:never:never;
type Owner={id:Exclude<P040AudioId,'sa'>;clock:P040Clock;ready:boolean;seek:number|null;generation:number};
export class P040Session{
 private state:ReturnType<typeof p040InitialState>;private owners=new Map<number,Owner>();private ownerGeneration=0;private serial=0;private abort:AbortController|null=null;private loading=false;private closed=false;private failure:string|null=null;private volume=.8;private worldPosition=0;private settledWorldPosition=0;private worldAnchor:number|null=null;
 private retiring=new Set<Promise<void>>();private closingOwners=new WeakMap<P040Clock|P040Spanish,Promise<void>>();private closing?:Promise<void>;private mode:'main'|'sa'='main';private spanish?:P040Spanish;private unsubscribe?:()=>void;
 constructor(private readonly options:P040SessionOptions){this.state=p040InitialState(options.seed??1);}
 private now(){return this.options.now?.()??performance.now();}private emit(){if(!this.closed)this.options.changed();}
 private retire(c:P040Clock|P040Spanish){const old=this.closingOwners.get(c);if(old)return old;const p=Promise.resolve().then(()=>c.close());this.closingOwners.set(c,p);this.retiring.add(p);void p.then(()=>this.retiring.delete(p),()=>{});return p;}
 private drop(owner:Owner){if(this.owners.get(owner.id)===owner)this.owners.delete(owner.id);this.retire(owner.clock);}
 private cancel(){this.serial++;this.abort?.abort();this.abort=null;this.loading=false;for(const o of this.owners.values())if(!o.ready)this.drop(o);}
 private holdWorld(){if(this.worldAnchor!==null){this.worldPosition+=Math.max(0,this.now()-this.worldAnchor)*12/1000;this.worldAnchor=null;}}
 // A native interruption stops every active owner at its actual held sample.
 // The game world keeps its last observed fractional tick; unobserved wall time
 // while audio was stopped must not move the car or instruction children.
 private holdStoppedOwners(){
  if(this.state.paused||this.loading||this.mode==='sa')return false;
  const observed=[...this.owners.values()].filter(o=>o.ready).map(owner=>({owner,snapshot:owner.clock.snapshot()}));
  if(!observed.some(({snapshot:s})=>s.failure||!['playing','timeline-ended'].includes(s.phase)))return false;
  this.worldPosition=this.settledWorldPosition;this.worldAnchor=null;
  this.holdOwners();this.state=p040Act(this.state,{type:'pause',epoch:this.state.source.epoch});this.cancel();
  this.emit();return true;
 }
 private holdOwners(){
  const owners=[...this.owners.values()];for(const o of owners)o.clock.pause();this.settle();
  for(const o of owners){const s=o.clock.snapshot();this.failure??=s.failure;
   if(s.phase==='failed'||s.phase==='closed'){this.failure??=`source-clock-${s.phase}:sprite-${o.id}`;this.drop(o);}
  }
 }
 private settle(){
  const position=this.worldPosition+(this.worldAnchor===null?0:Math.max(0,this.now()-this.worldAnchor)*12/1000),target=Math.floor(position+1e-9);while(this.state.worldTicks<target&&!this.state.paused)this.state=p040WorldTick(this.state);
  this.settledWorldPosition=position;
  const main=this.owners.get(255);if(main?.ready)this.state=p040InstructionFrame(this.state,main.clock.snapshot().frame);
  for(const[id,kind]of [[237,'Wrong'],[249,'Right']]as const){const o=this.owners.get(id);if(o?.ready)this.state=p040FeedbackFrame(this.state,kind,o.clock.snapshot().frame);}
  for(const o of this.owners.values())if(o.id===255?this.state.source.mainFrame>=736:!this.state.source.game?.feedback.some(f=>(f.kind==='Wrong'?237:249)===o.id))this.drop(o);
 }
 snapshot(){return{state:this.state,phase:this.closed?'closed':this.failure?'failed':this.loading?'loading':this.mode==='sa'?(this.spanish?.snapshot().phase??'idle'):this.state.paused?'paused':'playing',mode:this.mode,loading:this.loading,failure:this.failure,worldPosition:this.worldPosition+(this.worldAnchor===null?0:Math.max(0,this.now()-this.worldAnchor)*12/1000),audioOwners:[...this.owners.values()].map(o=>({id:o.id,generation:o.generation,...o.clock.snapshot()})),spanish:this.spanish?.snapshot()??null,closePending:this.retiring.size,lessonCompleted:false};}
 private spec(id:Exclude<P040AudioId,'sa'>):SourceStreamRunsClockPlan{const c=S.clocks.find(c=>c.spriteId===id)!;return{version:1,sourceSwfSha256:S.sourceSha256,frameDomain:`sprite-${id}`,firstFrame:1,lastFrame:id===255?736:id===237?28:27,fps:12,decoder:c.decoder,segments:c.segments,emptyNegativeBlocks:c.emptyNegativeBlocks,alignmentStatus:'source-run-candidate-not-original-runtime-accepted'};}
 private needed(){const a:{id:Exclude<P040AudioId,'sa'>;frame:number}[]=[];if(this.state.source.mainFrame<736)a.push({id:255,frame:this.state.source.mainFrame});for(const f of this.state.source.game?.feedback??[])a.push({id:f.kind==='Wrong'?237:249,frame:f.frame});return a;}
 private async activate(){if(this.closed||this.mode==='sa')return false;this.cancel();const serial=this.serial,abort=new AbortController();this.abort=abort;const current=()=>!this.closed&&this.serial===serial&&!abort.signal.aborted&&this.mode==='main';this.failure=null;this.loading=true;this.emit();
  try{
   await Promise.all([...this.retiring]);if(!current())return false;
   for(const n of this.needed()){
    let owner=this.owners.get(n.id);if(!owner){const clock=this.options.makeClock?.(this.spec(n.id))??new SourceStreamRunsClockV2(this.spec(n.id),{commitHeldFrame:()=>true});owner={id:n.id,clock,ready:false,seek:n.frame,generation:++this.ownerGeneration};this.owners.set(n.id,owner);clock.setVolume(this.volume);}
    const own=owner;
    if(!own.ready){const bytes=await this.options.load(n.id,abort.signal);if(!current()){this.drop(own);return false;}const ready=await own.clock.prepare(bytes);if(!current()){this.drop(own);return false;}if(!ready.accepted)throw Error(ready.reason);own.ready=true;}
    if(own.seek!==null){const seek=own.clock.seekCandidateFrame(own.seek);if(!seek.accepted)throw Error(seek.reason);own.seek=null;}
   }
   for(const o of this.owners.values()){const r=await o.clock.play({activation:'user',reducedMotion:false});if(!current())return false;if(!r.accepted)throw Error(r.reason);}
   this.state=p040Act(this.state,{type:'resume',epoch:this.state.source.epoch});this.worldAnchor=this.now();this.loading=false;this.abort=null;this.emit();return true;
  }catch(e){if(!current())return false;this.holdWorld();this.holdOwners();this.state=p040Act(this.state,{type:'pause',epoch:this.state.source.epoch});this.loading=false;this.failure=e instanceof Error?e.message:String(e);this.emit();return false;}
 }
 async play(){if(this.closed||this.loading)return false;this.holdStoppedOwners();if(this.mode==='sa'){if(this.spanish?.snapshot().phase==='buffer-ended')this.spanish.replay();const r=await this.spanish?.play({activation:'user',reducedMotion:false});this.emit();return r?.accepted??false;}if(!this.state.paused)return true;return this.activate();}
 pause(){if(this.closed||this.holdStoppedOwners())return;this.holdWorld();this.holdOwners();this.spanish?.pause();this.state=p040Act(this.state,{type:'pause',epoch:this.state.source.epoch});this.cancel();this.emit();}
 tick(){if(this.closed||this.loading||this.mode==='sa'||this.state.paused||this.holdStoppedOwners())return;this.settle();this.emit();}
 action(action:Action){if(this.closed||this.loading||this.mode==='sa')return false;this.pause();const before=this.state,next=p040Act(before,{...action,epoch:before.source.epoch}as P040ProductAction);if(next===before)return false;this.state=next;
  if(action.type==='draw'){const beforeGame=before.source.game,g=next.source.game;if(g&&beforeGame&&g.feedback!==beforeGame.feedback){const kind:P040AnswerFlag= g.score>beforeGame.score?'Right':'Wrong';const id=kind==='Right'?249:237;const o=this.owners.get(id);if(o)this.drop(o);}}
  if(next.source.mainFrame!==before.source.mainFrame){const o=this.owners.get(255);if(o){if(next.source.mainFrame<736)o.seek=next.source.mainFrame;else this.drop(o);}}
  if(next.source.mainFrame!==736)for(const id of[237,249]){const o=this.owners.get(id);if(o)this.drop(o);}
  this.emit();void this.activate();return true;
 }
 async spanishAudio(){if(this.closed||this.loading)return false;this.pause();this.mode='sa';this.failure=null;const serial=this.serial,abort=new AbortController();this.abort=abort;this.loading=true;this.emit();const current=()=>!this.closed&&this.serial===serial&&!abort.signal.aborted&&this.mode==='sa';let owner=this.spanish;
  try{await Promise.all([...this.retiring]);if(!current())return false;if(!owner){const bytes=await this.options.load('sa',abort.signal);if(!current())return false;owner=this.options.makeSpanish?.()??new DecodedSourceStreamTransport(S.sa);this.spanish=owner;owner.setVolume(this.volume);this.unsubscribe=owner.subscribe(()=>this.emit());const r=await owner.prepare(bytes);if(!current()){this.retire(owner);return false;}if(!r.accepted)throw Error(r.reason);}
   const restarted=owner.replay();if(!restarted.accepted)throw Error(restarted.reason);const r=await owner.play({activation:'user',reducedMotion:false});if(!current())return false;if(!r.accepted)throw Error(r.reason);this.loading=false;this.abort=null;this.emit();return true;
  }catch(e){if(!current())return false;this.loading=false;this.failure=e instanceof Error?e.message:String(e);this.emit();return false;}}
 returnFromSpanish(){if(this.closed||this.mode!=='sa')return false;this.pause();if(this.spanish&&this.spanish.snapshot().phase==='loading'){this.unsubscribe?.();this.unsubscribe=undefined;this.retire(this.spanish);this.spanish=undefined;}this.mode='main';this.emit();return true;}
 setVolume(v:number){if(!Number.isFinite(v)||v<0||v>1||this.closed)return false;this.volume=v;for(const o of this.owners.values())o.clock.setVolume(v);this.spanish?.setVolume(v);return true;}
 async replay(){if(this.closed)return false;this.pause();const serial=this.serial;for(const o of this.owners.values())this.drop(o);if(this.spanish){this.unsubscribe?.();this.unsubscribe=undefined;this.retire(this.spanish);this.spanish=undefined;}try{await Promise.all([...this.retiring]);}catch(e){this.failure=e instanceof Error?e.message:String(e);this.emit();return false;}if(this.closed||serial!==this.serial)return false;this.state=p040Act(this.state,{type:'replay',epoch:this.state.source.epoch});this.worldPosition=0;this.settledWorldPosition=0;this.worldAnchor=null;this.mode='main';this.failure=null;this.emit();return this.activate();}
 close(){if(this.closing)return this.closing;this.pause();this.closed=true;for(const o of this.owners.values())this.drop(o);if(this.spanish){this.unsubscribe?.();this.retire(this.spanish);this.spanish=undefined;}this.closing=Promise.all([...this.retiring]).then(()=>{});return this.closing;}
}
