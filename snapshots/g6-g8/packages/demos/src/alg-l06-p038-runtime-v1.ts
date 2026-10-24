import native from '../../../migrations/shared-alg001-l06-p038/native-v1/native-model-v1.json';
import {DecodedSourceStreamTransport, type DecodedSourceStreamBinding,
  type DecodedStreamResult} from './decoded-source-stream-transport';

export const P038_MAIN:DecodedSourceStreamBinding=Object.freeze({
  sourceSha256:'524ae7aa2cc1cb5f85bfe076b785a92c4d29470afdc813e577d93335408ff6fa',
  sourceBytes:154960,sampleRate:22050,channels:1,decodedSamples:686592,
  pcmSha256:'959735153b9a54400c103af8c762b2cc2b632a7f544ebcd1a86f7114972f3307',
});
export const P038_SA:DecodedSourceStreamBinding=Object.freeze({
  sourceSha256:'86aad21a9e9dc50791bdec2ee243dcdbff05302b2f75c23564c3305ef3650fea',
  sourceBytes:152544,sampleRate:48000,channels:1,decodedSamples:523008,
  pcmSha256:'a8c7bce0ddf79a28b08b8f3852b63bd2bb31ca3fd1af2959d35c8bf4357afee4',
});
export type P038GlossaryKey='Table'|'Output'|'Input'|'Equation'|'Rule'|'Graph'|'Function';
const KEYS:readonly P038GlossaryKey[]=['Table','Output','Input','Equation','Rule','Graph','Function'];
const FPS=12, FIRST_MAIN_FRAME=36, LAST_FRAME=409;
const answer=(accepted:boolean,reason:string):DecodedStreamResult=>Object.freeze({accepted,reason});
type Transport=Pick<DecodedSourceStreamTransport,
  'prepare'|'snapshot'|'subscribe'|'play'|'pause'|'replay'|'setVolume'|'close'>;
type LiveHit=(key:P038GlossaryKey,frame:number,buttonId:number,
  box:readonly number[])=>boolean;

/** Source positive-alpha placement and the physical button hit box are both
 * necessary. A product renderer must also confirm its connected live target;
 * the native model does not establish clip/occlusion or browser visibility. */
export function p038SourceCanOpen(key:P038GlossaryKey,frame:number,
  liveHit:LiveHit=()=>false):boolean{
  if(!KEYS.includes(key)||!Number.isInteger(frame)||frame<1||frame>LAST_FRAME)return false;
  const binding=native.buttonBindings.find(x=>x.sourceKeyAttribute===key);
  if(!binding||frame<binding.startFrame||frame>binding.lastSourceFrame)return false;
  const instance=native.instances.find(x=>x.kind==='button'&&
    x.objectId===binding.buttonObjectId&&x.depth===binding.depth);
  const run=instance?.runs.find(x=>x.firstFrame<=frame&&frame<=x.lastFrame&&
    x.alphaNumerator>0);
  const box=binding.sourceStageHitBoxAtStartPx;
  if(!run||box.length!==4||box.some(x=>!Number.isFinite(x))||
    box[2]<=box[0]||box[3]<=box[1])return false;
  try{return liveHit(key,frame,binding.buttonObjectId,box);}
  catch{return false;}
}

/** Maintained page-owned runtime. The one main buffer is scheduled once after
 * the 35-frame visual lead; pauses resume its decoded cursor and never seek by
 * SWF frame. This engineering clock is not measured Flash AV alignment. */
export class P038PageRuntimeV1{
  private readonly main:Transport;
  private readonly sa:Transport;
  private readonly unsubscribeMain:()=>void;
  private readonly unsubscribeSA:()=>void;
  private readonly commitFrame:(frame:number)=>boolean;
  private readonly liveHit:LiveHit;
  private context:AudioContext|undefined;
  private phase:'idle'|'loading'|'ready'|'start-pending'|'playing'|'paused'|
    'visual-boundary-held'|'failed'|'closed'='idle';
  private selected:'main'|'spanish'='main';
  private position=1;
  private committed=0;
  private anchor:{time:number;position:number}|undefined;
  private epoch=0;
  private mainRunEpoch:number|null=null;
  private nativeMainEof=false;
  private glossary:P038GlossaryKey|null=null;
  private failure:string|null=null;
  private spanishReady=false;
  private spanishEnded=false;

  constructor(options:{commitFrame:(frame:number)=>boolean;liveHit?:LiveHit;
    createMainContext?:()=>AudioContext;createSpanishContext?:()=>AudioContext;
    createTransport?:(binding:DecodedSourceStreamBinding,
      createContext:()=>AudioContext)=>Transport}){
    if(typeof options.commitFrame!=='function')throw Error('P038_FRAME_COMMIT_REQUIRED');
    this.commitFrame=options.commitFrame;this.liveHit=options.liveHit??(()=>false);
    const make=options.createTransport??((binding,createContext)=>
      new DecodedSourceStreamTransport(binding,{createContext}));
    const mainContext=options.createMainContext??(()=>new AudioContext({sampleRate:22050}));
    const spanishContext=options.createSpanishContext??(()=>new AudioContext({sampleRate:48000}));
    this.main=make(P038_MAIN,()=>this.context??=mainContext());
    this.sa=make(P038_SA,spanishContext);
    this.unsubscribeMain=this.main.subscribe(()=>{
      const n=this.main.snapshot();
      if(this.phase==='start-pending'&&
        (n.phase==='start-pending'||n.phase==='playing'))this.mainRunEpoch=n.epoch;
      if(n.phase==='buffer-ended'&&this.mainRunEpoch===n.epoch&&
        !this.nativeMainEof){
        this.nativeMainEof=true;this.mainRunEpoch=null;this.settle();
        if(this.frame()===LAST_FRAME&&this.phase==='paused')
          this.phase='visual-boundary-held';
      }else if(this.phase==='playing'&&this.selected==='main'&&
        ['interrupted','failed','closed','play-rejected'].includes(n.phase))this.settle();
    });
    this.unsubscribeSA=this.sa.subscribe(()=>{
      const n=this.sa.snapshot();
      if(n.phase==='buffer-ended')this.spanishEnded=true;
    });
  }
  private frame(){return Math.min(LAST_FRAME,Math.max(1,Math.floor(this.position+1e-9)));}
  private commit(force=false){
    const frame=this.frame();if(!force&&frame===this.committed)return true;
    try{if(this.commitFrame(frame)!==true)return false;}catch{return false;}
    this.committed=frame;return true;
  }
  private retireMain(){
    const n=this.main.snapshot();
    if(n.phase==='playing'||n.phase==='start-pending'){
      this.mainRunEpoch=null;this.main.pause();
    }
  }
  private fail(reason:string){
    this.epoch++;this.retireMain();this.anchor=undefined;
    this.phase='failed';this.failure=reason;return answer(false,reason);
  }
  private settle(){
    if(this.phase!=='playing'||!this.anchor||!this.context)return;
    const n=this.main.snapshot();
    const interrupted=this.context.state!=='running'||
      ['interrupted','failed','closed','play-rejected'].includes(n.phase);
    const now=interrupted?(n.heldContextTime??n.contextTime??this.context.currentTime):
      this.context.currentTime;
    if(!Number.isFinite(now))return void this.fail('P038_INVALID_AUDIO_CONTEXT_TIME');
    this.position=Math.min(LAST_FRAME,Math.max(this.position,
      this.anchor.position+Math.max(0,now-this.anchor.time)*FPS));
    if(!this.commit())return void this.fail('P038_FRAME_COMMIT_FAILED');
    if(interrupted){
      this.epoch++;this.retireMain();this.anchor=undefined;
      this.phase=this.context.state==='closed'?'failed':'paused';
      if(this.phase==='failed')this.failure='P038_MAIN_CONTEXT_CLOSED';
    }else if(this.position>=LAST_FRAME&&this.nativeMainEof){
      this.anchor=undefined;this.phase='visual-boundary-held';
    }
  }
  snapshot(){
    this.settle();const main=this.main.snapshot(),sa=this.sa.snapshot();
    return Object.freeze({phase:this.phase,frame:this.frame(),frameDomain:'sprite-67' as const,
      selectedAudio:this.selected,glossaryOpen:this.glossary,
      mainAudio:Object.freeze({phase:main.phase,decodedSample:main.decodedSample,
        contextTime:main.contextTime,nativeEofObserved:this.nativeMainEof}),
      spanishAudio:Object.freeze({phase:sa.phase,decodedSample:sa.decodedSample,
        ready:this.spanishReady,nativeEofObserved:this.spanishEnded}),
      mainLeadFramesWithoutBlock:35 as const,
      noBlockIsAudibleSilence:null,sourceAlignment:'unverified' as const,
      visualBoundaryReached:this.frame()===LAST_FRAME,
      sourceTerminalStopVerified:false as const,lessonCompleted:false as const,
      originalRuntimeAccepted:false as const,audioAccepted:false as const,
      failure:this.failure});
  }
  tick(){return this.snapshot();}
  async prepareMain(bytes:ArrayBuffer):Promise<DecodedStreamResult>{
    if(this.phase!=='idle')return answer(false,'main-prepare-not-idle');
    if(!(bytes instanceof ArrayBuffer))return answer(false,'main-source-bytes-required');
    const ticket=++this.epoch;this.phase='loading';
    const prepared=await this.main.prepare(bytes);
    if(ticket!==this.epoch)return answer(false,'stale-main-prepare');
    if(!prepared.accepted)return this.fail(prepared.reason);
    if(!this.context||this.context.sampleRate!==22050)
      return this.fail('P038_MAIN_CONTEXT_RATE_MISMATCH');
    if(!this.commit(true))return this.fail('P038_FIRST_FRAME_COMMIT_FAILED');
    this.phase='ready';return answer(true,'main-ready-held');
  }
  async prepareSpanish(bytes:ArrayBuffer):Promise<DecodedStreamResult>{
    if(this.phase==='closed'||this.spanishReady)return answer(false,'spanish-prepare-unavailable');
    if(!(bytes instanceof ArrayBuffer))return answer(false,'spanish-source-bytes-required');
    const prepared=await this.sa.prepare(bytes);
    this.spanishReady=prepared.accepted;
    return prepared;
  }
  async play(policy:{activation:'user';reducedMotion:boolean}):Promise<DecodedStreamResult>{
    this.settle();
    if(!policy||policy.activation!=='user'||typeof policy.reducedMotion!=='boolean')
      return answer(false,'explicit-user-play-required');
    if(this.selected!=='main'||this.glossary!==null)return answer(false,'main-held-by-owner');
    if(this.phase==='playing')return answer(true,'already-playing');
    if(!['ready','paused'].includes(this.phase)||!this.context)
      return answer(false,'main-not-ready');
    if(this.frame()===LAST_FRAME)return answer(false,'visual-boundary-held');
    const n=this.main.snapshot();
    if(!this.nativeMainEof&&n.decodedSample>=P038_MAIN.decodedSamples)
      return answer(false,'native-eof-pending');
    const delay=this.position<FIRST_MAIN_FRAME?
      (FIRST_MAIN_FRAME-this.position)/FPS:0;
    if(delay>0&&n.decodedSample!==0)
      return this.fail('P038_LEAD_WITH_NONZERO_AUDIO_CURSOR');
    const ticket=++this.epoch;this.phase='start-pending';this.failure=null;
    try{
      let time:number;
      if(this.nativeMainEof){
        await this.context.resume();time=this.context.currentTime;
      }else{
        const started=await this.main.play({...policy,delaySeconds:delay});
        if(ticket!==this.epoch)return answer(false,'stale-main-start');
        if(!started.accepted)throw Error(started.reason);
        const startedAt=this.main.snapshot();
        if(!startedAt.playbackAnchor)throw Error('P038_MAIN_ANCHOR_MISSING');
        this.mainRunEpoch=startedAt.epoch;
        time=startedAt.playbackAnchor.contextTime-delay;
      }
      if(ticket!==this.epoch)return answer(false,'stale-main-start');
      if(this.context.state!=='running'||!Number.isFinite(time))
        throw Error('P038_MAIN_CONTEXT_NOT_RUNNING');
      this.anchor={time,position:this.position};this.phase='playing';
      this.settle();return answer(true,delay>0?'visual-lead-main-scheduled':'continuous-main-playing');
    }catch(error){
      if(ticket!==this.epoch)return answer(false,'stale-main-start');
      this.retireMain();this.anchor=undefined;this.phase='paused';
      this.failure=error instanceof Error?error.message:String(error);
      return answer(false,this.failure);
    }
  }
  pause():DecodedStreamResult{
    this.settle();
    if(this.selected==='spanish'){
      const s=this.sa.snapshot();
      if(s.phase==='playing'||s.phase==='start-pending'){
        this.epoch++;return this.sa.pause();
      }
      return answer(false,'spanish-not-playing');
    }
    if(!['playing','start-pending'].includes(this.phase))return answer(false,'main-not-playing');
    const n=this.main.snapshot();
    const eofPending=!this.nativeMainEof&&n.phase==='playing'&&
      n.decodedSample>=P038_MAIN.decodedSamples&&this.context?.state==='running';
    this.epoch++;if(!eofPending)this.retireMain();
    this.anchor=undefined;this.phase='paused';
    return this.commit()?answer(true,'main-held'):
      this.fail('P038_HELD_FRAME_COMMIT_FAILED');
  }
  openGlossary(key:P038GlossaryKey):DecodedStreamResult{
    this.settle();
    if(this.selected!=='main'||this.glossary!==null||
      !['ready','paused','playing','start-pending','visual-boundary-held'].includes(this.phase)||
      !p038SourceCanOpen(key,this.frame(),this.liveHit))
      return answer(false,'glossary-unavailable');
    if(['playing','start-pending'].includes(this.phase)&&!this.pause().accepted)
      return answer(false,'main-pause-failed');
    this.glossary=key;return answer(true,'glossary-opened-held');
  }
  closeGlossary():DecodedStreamResult{
    if(this.glossary===null)return answer(false,'glossary-not-open');
    this.glossary=null;return answer(true,'glossary-closed-held');
  }
  async startSpanish(policy:{activation:'user'}):Promise<DecodedStreamResult>{
    if(!policy||policy.activation!=='user')return answer(false,'explicit-user-spanish-required');
    if(this.phase==='closed'||!this.spanishReady||this.glossary!==null)
      return answer(false,'spanish-unavailable');
    if(this.selected==='main'&&
      !['ready','paused','playing','start-pending','visual-boundary-held'].includes(this.phase))
      return answer(false,'main-not-ready-for-spanish');
    const before=this.main.snapshot();
    if(this.selected==='main'&&!this.nativeMainEof&&before.phase==='playing'&&
      before.decodedSample>=P038_MAIN.decodedSamples)
      return answer(false,'main-native-eof-pending');
    if(this.selected==='main'&&['playing','start-pending'].includes(this.phase)){
      const held=this.pause();if(!held.accepted)return held;
    }
    const after=this.main.snapshot();
    if(this.selected==='main'&&!this.nativeMainEof&&after.phase==='playing'&&
      after.decodedSample>=P038_MAIN.decodedSamples)
      return answer(false,'main-native-eof-pending');
    const previous=this.selected,ticket=++this.epoch;this.selected='spanish';
    const started=await this.sa.play({activation:'user',reducedMotion:false});
    if(ticket!==this.epoch||this.selected!=='spanish')
      return answer(false,'stale-spanish-start');
    if(!started.accepted){this.selected=previous;return started;}
    this.spanishEnded=false;return answer(true,'separate-spanish-playing');
  }
  returnMain():DecodedStreamResult{
    if(this.selected!=='spanish'||this.phase==='closed')return answer(false,'spanish-not-selected');
    this.epoch++;
    const s=this.sa.snapshot();
    if(s.phase==='playing'||s.phase==='start-pending')this.sa.pause();
    if(!this.sa.replay().accepted)return answer(false,'spanish-reset-failed');
    this.spanishEnded=false;this.selected='main';
    return answer(true,'main-returned-held');
  }
  replay():DecodedStreamResult{
    if(this.phase==='closed'||this.phase==='idle')
      return answer(false,'replay-unavailable');
    this.epoch++;this.retireMain();
    const s=this.sa.snapshot();if(s.phase==='playing'||s.phase==='start-pending')this.sa.pause();
    const m=this.main.replay(),a=this.sa.replay();
    if(!m.accepted||!a.accepted)return this.fail('P038_REPLAY_AUDIO_RESET_FAILED');
    this.selected='main';this.glossary=null;this.anchor=undefined;
    this.position=1;this.committed=0;this.nativeMainEof=false;
    this.mainRunEpoch=null;this.spanishEnded=false;
    this.phase=this.main.snapshot().phase==='ready'?'ready':'idle';
    this.spanishReady=this.sa.snapshot().phase==='ready';this.failure=null;
    return this.commit(true)?answer(true,'replayed-frame-one-held'):
      this.fail('P038_REPLAY_FRAME_COMMIT_FAILED');
  }
  setVolume(value:number):DecodedStreamResult{
    if(this.phase==='closed'||!Number.isFinite(value)||value<0||value>1)
      return answer(false,'invalid-volume');
    const m=this.main.setVolume(value),s=this.sa.setVolume(value);
    return m.accepted&&s.accepted?answer(true,'volume-set'):
      answer(false,'volume-rejected');
  }
  async close():Promise<void>{
    if(this.phase==='closed')return;
    this.epoch++;this.retireMain();
    const s=this.sa.snapshot();if(s.phase==='playing'||s.phase==='start-pending')this.sa.pause();
    this.anchor=undefined;this.glossary=null;this.phase='closed';
    this.unsubscribeMain();this.unsubscribeSA();
    const closed=await Promise.allSettled([this.main.close(),this.sa.close()]);
    const failed=closed.find((x):x is PromiseRejectedResult=>x.status==='rejected');
    if(failed)throw failed.reason;
  }
}
