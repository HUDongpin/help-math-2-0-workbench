import type {AnimationRendererProps} from '../contract';
import type {LessonTextActivityDefinition} from '../lesson-text-contract';
import source from './generated/g4-l3-gs002-companion-audio.json';

// Modern host holds427 during the game. The ending placement is source428;
// expiry is its explicit adapter event, not a claim that427 equals428.
export const GS002_SOURCE_ACTIVITIES:readonly LessonTextActivityDefinition[]=[69,158,319].map(id=>{
  const stream=source.streams.find(s=>s.characterId===id)!;
  const placement=stream.timelinePlacements.find(p=>p.frame===(id===319?428:427))!;
  return {id:`gs002-source-${id}`,sourceInstanceId:placement.instanceId,
    parentLifetime:{firstFrame:427,lastFrameExclusive:429},parentFrames:[427],frameDomain:stream.frameDomain,
    startFrame:id===319?1:2,endFrame:stream.frameCount,fps:12,
    audio:{source:stream.source,sha256:stream.sha256,language:'shared',spokenLanguage:'undetermined',firstFrame:stream.firstFrame,lastFrame:stream.lastFrame}};
});

// Only reachable popup Close buttons contain these down-state children.
// Sprite19 also contains button11, but has no source timeline placement.
export const GS002_BUTTON_ACTIVITIES:readonly LessonTextActivityDefinition[]=[
  {id:'help-close',characterId:10,parent:'sprite-321/depth-383/generation-1/sprite-164/depth-2/generation-1'},
  {id:'feedback-close',characterId:154,parent:'sprite-321/depth-270/generation-1/sprite-158/depth-1/generation-1'},
].map(({id,characterId,parent})=>{
  const stream=source.streams.find(s=>s.characterId===characterId)!;
  const button=stream.buttonPlacements[0]!;
  return {id:`gs002-button-${id}`,sourceInstanceId:`${parent}/${button.instanceId}`,
    buttonPress:{sourceButtonId:button.buttonId},parentLifetime:{firstFrame:427,lastFrameExclusive:428},parentFrames:[427],
    frameDomain:stream.frameDomain,startFrame:1,endFrame:5,fps:12,
    audio:{source:stream.source,sha256:stream.sha256,language:'shared',spokenLanguage:'undetermined',firstFrame:1,lastFrame:5}};
});

/** Owns only an observed host activity token, never a clock, player or score. */
export class Gs002SourceActivitySession {
  private pending?:{id:string;floor:number;done:boolean};
  update(runtime:AnimationRendererProps,mode:string):boolean{
    const desired=mode==='hit-resolving'?'gs002-source-69':mode==='feedback'?'gs002-source-158':mode==='expired'?'gs002-source-319':undefined;
    const activities=runtime.lessonActivities??[];
    const active=this.pending&&activities.find(a=>a.id===this.pending!.id&&a.revision>this.pending!.floor);
    if(this.pending&&this.pending.id!==desired){
      // Wait for the accepted request's observable revision before cancelling;
      // a guessed/stale token must never retire another instance.
      if(!active?.cancellationToken)return false;
      if(!runtime.onLessonActivityCancel?.({id:active.id,sourceInstanceId:active.sourceInstanceId,revision:active.revision,
        cancellationToken:active.cancellationToken,parentFrame:runtime.frame}))return false;
      this.pending=undefined;
    }
    if(!desired)return false;
    if(!this.pending){
      if(runtime.paused)return false;
      const floor=Math.max(0,...activities.map(a=>a.revision));
      if(runtime.onLessonActivityRequest?.({id:desired,parentFrame:runtime.frame}))this.pending={id:desired,floor,done:false};
      return false;
    }
    if(desired==='gs002-source-69'&&active?.status==='completed'&&active.frame===35&&!this.pending.done){
      this.pending.done=true;return true;
    }
    return false;
  }
}
