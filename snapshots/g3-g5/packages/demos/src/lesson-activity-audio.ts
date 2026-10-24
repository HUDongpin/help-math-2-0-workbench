import type {LessonTextActivityDefinition, LessonTextActivitySnapshot} from './lesson-text-contract';
import {isSameOriginAssetSource} from './runtime';
import type {SourceAudioMedia} from './source-pcm-audio';
import {sourceActivityKey} from './lesson-source-clock';

export interface LessonActivityAudioState {
  readonly status: 'idle' | 'waiting' | 'playing' | 'paused' | 'ended' | 'stopped' | 'blocked' | 'error' | 'unavailable';
  readonly activityId: string | null;
}
interface Update {
  readonly identity: string;
  readonly activity?: LessonTextActivitySnapshot;
  readonly definitions: readonly LessonTextActivityDefinition[];
  readonly enabled: boolean;
  readonly paused: boolean;
  readonly language: 'en' | 'es';
  readonly volume: number;
}
interface Entry {
  readonly key: string;
  readonly definition: LessonTextActivityDefinition;
  readonly audio: SourceAudioMedia;
  readonly cancellationToken?: string;
  started: boolean;
  ended: boolean;
  pendingMetadata: boolean;
  cleanup?: () => void;
  cancelMetadata?: () => void;
}

/** Media lifecycle only. It has no timer and never completes a teaching step.
 * Authored child frames come from the single host clock. MP3 latency/seek fields
 * are retained in source evidence and are not silently used as trim instructions. */
export class LessonActivityAudioController {
  private identity = '';
  private latest?: Update;
  private pool = new Map<string, SourceAudioMedia>();
  private current?: Entry;
  private state: LessonActivityAudioState = {status:'idle',activityId:null};
  constructor(private readonly createAudio: (source: string, sha256?: string) => SourceAudioMedia,
    private readonly onChange: (state: LessonActivityAudioState) => void) {}

  private publish(status: LessonActivityAudioState['status'], activityId: string | null = this.current?.definition.id ?? null) {
    if (this.state.status === status && this.state.activityId === activityId) return;
    this.state = {status,activityId}; this.onChange(this.state);
  }
  private valid(definition: LessonTextActivityDefinition) {
    const audio = definition.audio;
    return Boolean(audio && isSameOriginAssetSource(audio.source) && /^[a-f0-9]{64}$/.test(audio.sha256)
      && ['en','es','shared'].includes(audio.language) && audio.firstFrame >= 1 && audio.lastFrame >= audio.firstFrame
      && (audio.offsetSeconds === undefined || (Number.isFinite(audio.offsetSeconds) && audio.offsetSeconds >= 0)));
  }
  private prepare(definition: LessonTextActivityDefinition) {
    if (!this.valid(definition)) return undefined;
    const source = definition.audio!;
    const key = `${source.source}:${source.sha256}`;
    let element = this.pool.get(key);
    if (!element) {
      element = this.createAudio(source.source,source.sha256); element.preload = 'auto';
      this.pool.set(key,element);
      if(element.prepareForTimeline)void element.prepareForTimeline().catch(()=>{});else element.load();
    }
    return element;
  }
  private play(entry: Entry, resume = false) {
    const latest = this.latest;
    if (this.current !== entry || !latest?.activity || latest.paused || !latest.enabled || entry.ended) return;
    const source = entry.definition.audio!;
    if (entry.audio.error) {entry.ended=true;this.publish('error');return;}
    if (!resume) {
      if (latest.activity.frame < source.firstFrame) {this.publish('waiting'); return;}
      if (latest.activity.frame > source.lastFrame) {entry.ended = true; this.publish('ended'); return;}
      if (entry.audio.readyState === 0) {
        if (!entry.pendingMetadata) {
          entry.pendingMetadata = true;
          const ready=()=>{entry.pendingMetadata=false;entry.cancelMetadata=undefined;this.play(entry);};
          entry.cancelMetadata=()=>entry.audio.removeEventListener('loadedmetadata',ready);
          entry.audio.addEventListener('loadedmetadata',ready,{once:true});
        }
        this.publish('waiting'); return;
      }
      // Starting part-way through an authored stream (e.g. gotoAndPlay(2)
      // on a stream whose first block is at frame 1) preserves that offset.
      entry.audio.currentTime = (source.offsetSeconds ?? 0) + Math.max(0,(latest.activity.frame-source.firstFrame)/entry.definition.fps);
    }
    entry.started = true;
    void entry.audio.play().then(()=>{
      if (this.current === entry && !entry.ended && !this.latest?.paused) this.publish('playing');
    }).catch(()=>{if(this.current === entry && !entry.ended) this.publish('blocked');});
  }
  update(value: Update) {
    if (value.identity !== this.identity) {this.dispose();this.identity=value.identity;}
    this.latest=value;
    if (value.enabled) for (const definition of value.definitions) {
      if (definition.audio?.language === 'shared' || definition.audio?.language === value.language) this.prepare(definition);
    }
    const activity=value.activity, definition=value.definitions.find(item=>item.id===activity?.id);
    if (!value.enabled || !activity || activity.status==='completed' || !definition || !this.valid(definition)
      || (definition.audio!.language!=='shared' && definition.audio!.language!==value.language)) {
      this.stop();this.publish(activity && !definition?.audio ? 'unavailable' : 'idle',activity?.id??null);return;
    }
    const key=`${value.identity}:${activity.id}:${activity.revision}`;
    if (this.current?.key!==key) {
      this.stop();const element=this.prepare(definition)!;
      element.currentTime=0;
      const entry:Entry={key,definition,audio:element,cancellationToken:activity.cancellationToken,started:false,ended:false,pendingMetadata:false};this.current=entry;
      const done=()=>{if(this.current===entry){entry.ended=true;this.publish('ended');}};
      const error=()=>{if(this.current===entry){entry.ended=true;this.publish('error');}};
      element.addEventListener('ended',done,{once:true});element.addEventListener('error',error,{once:true});
      entry.cleanup=()=>{element.removeEventListener('ended',done);element.removeEventListener('error',error);entry.cancelMetadata?.();};
    }
    const entry=this.current;
    entry.audio.volume=Math.max(0,Math.min(1,value.volume));
    if (entry.ended) return;
    if(value.paused){entry.audio.pause();this.publish('paused');return;}
    if(!entry.started)this.play(entry);
    else if(this.state.status==='paused')this.play(entry,true);
  }
  stop() {
    if(!this.current)return;
    this.current.cleanup?.();
    if(this.current.ended)return;
    this.current.audio.pause();this.current.audio.currentTime=0;this.current.ended=true;this.publish('stopped');
  }
  /** Retire only the media owner actually observed by this controller. The
   * latest clock snapshot may be newer than this passive audio update. */
  cancelObservedInstance(instanceId:string) {
    const observed=this.latest?.activity;
    if(!observed || observed.sourceInstanceId!==instanceId || !observed.cancellationToken
      || this.current?.cancellationToken!==observed.cancellationToken || this.current?.definition.id!==observed.id
      || this.current.key!==`${this.latest!.identity}:${observed.id}:${observed.revision}`)return false;
    this.stop();return true;
  }
  retry() {
    if(!this.current || this.current.ended || this.latest?.paused)return false;
    this.play(this.current,this.current.started);return true;
  }
  dispose() {
    this.stop();this.current=undefined;
    for(const element of this.pool.values()){element.pause();element.dispose?.();}
    this.pool.clear();this.latest=undefined;this.publish('idle',null);
  }
}

/** Independent media for independently placed source MovieClips. This owns
 * no clock: source removal, pause and completion arrive in the host snapshot. */
export class LessonActivityAudioGroupController {
  private controllers=new Map<string,LessonActivityAudioController>();
  private states=new Map<string,LessonActivityAudioState>();
  private identity='';
  private state:LessonActivityAudioState={status:'idle',activityId:null};
  constructor(private readonly createAudio:(source:string,sha256?:string)=>SourceAudioMedia,
    private readonly onChange:(state:LessonActivityAudioState)=>void) {}
  private publish() {
    const priority:LessonActivityAudioState['status'][]=['blocked','error','playing','paused','waiting','stopped','ended','unavailable','idle'];
    const values=[...this.states.values()].reverse();
    const next=priority.map(status=>values.find(state=>state.status===status)).find(Boolean)??{status:'idle' as const,activityId:null};
    if(next.status===this.state.status&&next.activityId===this.state.activityId)return;
    this.state=next;this.onChange(next);
  }
  update(value:Update & {readonly activities?:readonly LessonTextActivitySnapshot[]}) {
    if(value.identity!==this.identity){this.dispose();this.identity=value.identity;}
    const groups=new Map<string,LessonTextActivityDefinition[]>();
    for(const definition of value.definitions){
      const key=sourceActivityKey(definition);groups.set(key,[...groups.get(key)??[],definition]);
    }
    for(const [key,controller] of this.controllers)if(!groups.has(key)){
      controller.dispose();this.controllers.delete(key);this.states.delete(key);
    }
    const activities=value.activities??(value.activity?[value.activity]:[]);
    for(const [key,definitions] of groups){
      let controller=this.controllers.get(key);
      if(!controller){controller=new LessonActivityAudioController(this.createAudio,state=>{this.states.set(key,state);this.publish();});this.controllers.set(key,controller);}
      controller.update({...value,identity:`${value.identity}:${key}`,definitions,
        activity:activities.find(activity=>sourceActivityKey(activity)===key)});
    }
    this.publish();
  }
  cancelObservedInstances(instanceIds:readonly string[]){
    let retired=0;
    for(const instanceId of new Set(instanceIds)){
      const controller=this.controllers.get(instanceId);
      if(controller?.cancelObservedInstance(instanceId))retired++;
    }
    return retired;
  }
  stop(){for(const controller of this.controllers.values())controller.stop();}
  retry(){let retried=false;for(const [key,controller] of this.controllers){
    if(this.states.get(key)?.status==='blocked'||this.states.get(key)?.status==='paused')retried=controller.retry()||retried;
  }return retried;}
  dispose(){for(const controller of this.controllers.values())controller.dispose();this.controllers.clear();this.states.clear();this.publish();}
}
