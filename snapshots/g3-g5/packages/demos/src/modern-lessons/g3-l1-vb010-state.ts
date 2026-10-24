import type {AnimationRendererProps, RuntimeContext, LessonPlaybackIdentity, LessonPlayCommand, HostAudioTrackEvent} from '../contract';
import type {LessonTextActivitySnapshot} from '../lesson-text-contract';
import {VB010_CONFIG as c} from './generated/g3-l1-vb010-source';
export const curveValue = <T,>(curve: readonly (readonly [number,T])[], frame:number, initial:T):T => curve.reduce((value,[f,next])=>f<=frame?next:value,initial);
export interface Vb010Session {
 readonly seed:number; readonly replay:number; readonly wrongCount:number;
 /** Feedback reset does not execute enableQuizButton. Keep this independently. */
 readonly answerLocked:boolean;
 readonly feedback:Readonly<{id:string;stage:'intro'|'outro';selected:string;revisionFloor:number}>|null;
 readonly feedbackRevision:number|null;
 /** Only set after the host accepts a frame request: this is already committed. */
 readonly pendingResume:number|null;
 /** A distinct public Play intent not yet accepted by the source clock. */
 readonly pendingPlay:LessonPlayCommand|null;
 readonly focusTarget:string|null;
 readonly playbackIdentity:LessonPlaybackIdentity|null;
 /** Host starts and public Play share this monotonic sequence. */
 readonly lastControlSequence:number;
}
type Vb010Context = RuntimeContext & Pick<AnimationRendererProps,'lessonPlaybackIdentity'>;
export const sameVb010Identity=(a:LessonPlaybackIdentity|null|undefined,b:LessonPlaybackIdentity|null|undefined)=>
 Boolean(a&&b&&a.playbackIdentity===b.playbackIdentity&&a.replay===b.replay&&a.seekRevision===b.seekRevision);
const validIdentity=(i:LessonPlaybackIdentity|undefined):i is LessonPlaybackIdentity=>Boolean(i&&typeof i.playbackIdentity==='string'&&i.playbackIdentity.length&&Number.isSafeInteger(i.replay)&&i.replay>=0&&Number.isSafeInteger(i.seekRevision)&&i.seekRevision>=0);
export const createVb010Session=(seed=0,replay=0,identity?:LessonPlaybackIdentity):Vb010Session=>({
 seed:seed>>>0,replay,wrongCount:0,answerLocked:false,feedback:null,feedbackRevision:null,
 pendingResume:null,pendingPlay:null,focusTarget:null,playbackIdentity:identity??null,lastControlSequence:0,
});
export function synchronizeVb010Session(s:Vb010Session,r:Vb010Context):Vb010Session {
 const identity=validIdentity(r.lessonPlaybackIdentity)?r.lessonPlaybackIdentity:undefined;
 if(s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0)||(identity&&!sameVb010Identity(s.playbackIdentity,identity)))return createVb010Session(r.seed,r.replay??0,identity);
 if(r.frame<c.clock.choiceStop){
  if(!s.wrongCount&&!s.answerLocked&&!s.feedback&&s.feedbackRevision===null&&s.pendingResume===null&&s.pendingPlay===null&&!s.focusTarget)return s;
  // A source seek before the quiz reconstructs teaching state, without replaying
  // a retained host event from the same identity if the caller has no new epoch.
  return {...createVb010Session(r.seed,r.replay??0,identity??s.playbackIdentity??undefined),lastControlSequence:s.lastControlSequence};
 }
 if(r.frame!==c.clock.choiceStop&&(s.feedback||s.pendingResume!==null||s.pendingPlay||s.focusTarget))return {...s,feedback:null,feedbackRevision:null,pendingResume:null,pendingPlay:null,focusTarget:null};
 return s;
}
const sourceContext=(s:Vb010Session,r:Vb010Context)=>r.lang==='en'&&r.scenario==='source-static-frame'&&!r.entryStateSha256&&
 (r.frameDomain??c.clock.mainDomain)===c.clock.mainDomain&&(r.rootFrame===undefined||r.rootFrame===c.clock.rootFrame)&&
 Number.isInteger(r.frame)&&r.frame>=1&&r.frame<=c.clock.frameCount&&Number.isSafeInteger(r.seed)&&s.seed===(r.seed>>>0)&&s.replay===(r.replay??0)&&
 (r.lessonPlaybackIdentity===undefined||validIdentity(r.lessonPlaybackIdentity)&&r.lessonPlaybackIdentity.replay===(r.replay??0)&&sameVb010Identity(s.playbackIdentity,r.lessonPlaybackIdentity));
const permitted=(s:Vb010Session,r:AnimationRendererProps)=>sourceContext(s,r)&&r.frame===c.clock.choiceStop&&!r.paused;
const currentSignal=(s:Vb010Session,r:AnimationRendererProps,e:HostAudioTrackEvent|LessonPlayCommand)=>
 sourceContext(s,r)&&validIdentity(r.lessonPlaybackIdentity)&&sameVb010Identity(e.identity,r.lessonPlaybackIdentity)&&
 Number.isSafeInteger(e.sequence)&&e.sequence>0&&e.sequence>s.lastControlSequence&&e.frameDomain===c.clock.mainDomain&&e.sourceFrame===r.frame;
/** Pure derivation runs before completion effects. The host has already frozen
 * the clock and retired the exact feedback/Close owners before publishing a
 * start or public Play. No generic paused/playing/terminal edge enters here. */
export function consumeVb010HostSignals(s:Vb010Session,r:AnimationRendererProps):Vb010Session {
 const start=r.hostAudioTrackStart,play=r.lessonPlayCommand,events:(HostAudioTrackEvent|LessonPlayCommand)[]=[];
 if(start?.kind==='accepted-start'&&start.trackId===c.spanishTrack.id&&start.trackSha256===c.spanishTrack.sha256&&currentSignal(s,r,start))events.push(start);
 if(play?.kind==='play'&&currentSignal(s,r,play))events.push(play);
 if(events.length===2&&events[0].sequence===events[1].sequence)return s;
 let next=s;
 for(const event of events.sort((a,b)=>a.sequence-b.sequence)){
  if(event.sequence<=next.lastControlSequence)continue;
  if(event.kind==='accepted-start'){
   next={...next,lastControlSequence:event.sequence,feedback:null,feedbackRevision:null,focusTarget:null,pendingPlay:null};
  }else if(event.kind==='play'){
   next={...next,lastControlSequence:event.sequence,feedback:null,feedbackRevision:null,focusTarget:null,
    pendingPlay:r.frame===c.clock.choiceStop&&next.pendingResume===null?event:null};
  }
 }
 return next;
}
/** Only an explicit public command can request the old ordinary-Play escape.
 * A failed request is consumed, so unpause or an unrelated render never retries
 * it as a new user action. A newer Spanish start clears this uncommitted intent. */
export function commitVb010PublicPlay(s:Vb010Session,r:AnimationRendererProps):Vb010Session {
 const command=s.pendingPlay;
 if(!command||command.sequence!==s.lastControlSequence||s.pendingResume!==null||!permitted(s,r)||!sameVb010Identity(command.identity,r.lessonPlaybackIdentity)||command.sourceFrame!==r.frame||!r.onLessonFrameRequest)return s;
 const accepted=r.onLessonFrameRequest({fromFrame:c.clock.choiceStop,toFrame:c.clock.correctResume,stopFrame:c.clock.frameCount})===true;
 return {...s,pendingPlay:null,pendingResume:accepted?c.clock.correctResume:null};
}
export function observeVb010Feedback(s:Vb010Session,activities:readonly LessonTextActivitySnapshot[]=[]){
 const pending=s.feedback,branch=c.branches.find(b=>b.id===pending?.id),id=pending?pending.id+(pending.stage==='outro'?'-outro':''):null;
 const definition=c.activities.find(d=>d.id===id),matches=activities.filter(a=>a.id===id||a.sourceInstanceId===branch?.sourceInstanceId),activity=matches.length===1?matches[0]:undefined;
 const bound=Boolean(pending&&branch&&definition&&activity&&activity.id===id&&activity.sourceInstanceId===branch.sourceInstanceId&&activity.frameDomain===definition.frameDomain&&
  Number.isSafeInteger(activity.revision)&&activity.revision>pending.revisionFloor&&(s.feedbackRevision===null||s.feedbackRevision===activity.revision)&&
  Number.isInteger(activity.frame)&&activity.frame>=definition.startFrame&&activity.frame<=definition.endFrame&&(activity.status==='playing'||activity.status==='completed'));
 const labels=branch?.labels.map(l=>({...l,alpha:bound?curveValue<number>(l.alpha,activity!.frame,0):0}))??[];
 const popupAlpha=bound&&branch!.kind==='wrong'&&pending!.stage==='intro'?curveValue<number>(branch!.popupAlpha,activity!.frame,0):0;
 const complete=bound&&activity!.status==='completed'&&activity!.frame===definition!.endFrame&&(branch!.kind==='correct'||pending!.stage==='outro');
 return {branch,definition,activity,bound,labels,popupAlpha,popup:popupAlpha>0,complete};
}
export function chooseVb010Answer(s:Vb010Session,id:string,r:AnimationRendererProps):Vb010Session {
 if(!permitted(s,r)||s.answerLocked||s.feedback||s.pendingPlay||s.pendingResume!==null||!r.onLessonFrameRequest)return s;
 const answer=c.answers.find(a=>a.id===id);if(!answer)return s;
 const kind=answer.correct?'correct':'wrong',branches=c.branches.filter(b=>b.kind===kind);
 // Deterministic Current-JS choice within source host's 3/4 sets. No Flash RNG parity claim.
 const branch=branches[(s.seed+s.wrongCount)%branches.length]!;
 const revisionFloor=Math.max(-1,...(r.lessonActivities??[]).filter(a=>a.sourceInstanceId===branch.sourceInstanceId&&Number.isSafeInteger(a.revision)).map(a=>a.revision));
 if(r.onLessonActivityRequest?.({id:branch.id,parentFrame:r.frame})!==true)return s;
 return {...s,answerLocked:true,wrongCount:s.wrongCount+(answer.correct?0:1),feedback:{id:branch.id,stage:'intro',selected:id,revisionFloor},feedbackRevision:null,focusTarget:null};
}
export function closeVb010Wrong(s:Vb010Session,r:AnimationRendererProps):Vb010Session {
 const seen=observeVb010Feedback(s,r.lessonActivities);
 if(!permitted(s,r)||!s.feedback||!seen.popup||!seen.activity)return s;
 if(r.onLessonActivityRequest?.({id:s.feedback.id+'-outro',parentFrame:r.frame,fromActivity:{id:seen.activity.id,revision:seen.activity.revision}})!==true)return s;
 return {...s,feedback:{...s.feedback,stage:'outro',revisionFloor:seen.activity.revision},feedbackRevision:null};
}
export function finishVb010Feedback(s:Vb010Session,r:AnimationRendererProps):Vb010Session {
 const seen=observeVb010Feedback(s,r.lessonActivities);
 if(!permitted(s,r)||!s.feedback||!seen.complete)return s;
 const target=seen.branch!.kind==='correct'?c.clock.correctResume:s.wrongCount>=2?c.clock.secondWrongResume:null;
 if(target!==null){
  if(r.onLessonFrameRequest?.({fromFrame:c.clock.choiceStop,toFrame:target,stopFrame:c.clock.frameCount})!==true)return s;
  return {...s,answerLocked:seen.branch!.kind==='correct',feedback:null,feedbackRevision:null,pendingResume:target,focusTarget:null};
 }
 return {...s,answerLocked:false,feedback:null,feedbackRevision:null,focusTarget:s.feedback.selected};
}
export function getVb010Teaching(frame:number,s:Vb010Session,activities:readonly LessonTextActivitySnapshot[]=[]){
 const feedback=observeVb010Feedback(s,activities);
 return {feedback,promptWords:c.promptWords.map(w=>({...w,visible:frame>=w.firstFrame&&!feedback.popup})),
  answers:c.answers.map(a=>({...a,alpha:curveValue<Readonly<{alpha:number;x:number;y:number}>>(a.trace,frame,{alpha:0,x:0,y:0}).alpha})),
  explanation:c.wrongExplanations[s.wrongCount===1?0:1],terminal:frame===c.clock.frameCount};
}
