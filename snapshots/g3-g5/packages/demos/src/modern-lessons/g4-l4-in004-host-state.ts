import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition,LessonTextActivitySnapshot} from '../lesson-text-contract';
import {IN004_QUESTIONS,IN004_FEEDBACK,type In004Effect} from './g4-l4-in004-state';
import {createIn004Practice,reduceIn004Practice,type In004PracticeState,type In004PracticeAction} from './g4-l4-in004-practice';
const frames=IN004_QUESTIONS.map(q=>q.frame);
const activity=(id:string,depth:number,sprite:number,startFrame:number,endFrame:number):LessonTextActivityDefinition=>({id,sourceInstanceId:`sprite-207/depth-${depth}/generation-1`,frameDomain:`sprite-${sprite}`,parentLifetime:{firstFrame:474,lastFrameExclusive:483},parentFrames:frames,startFrame,endFrame,fps:12});
export const IN004_FEEDBACK_TIMELINES:readonly LessonTextActivityDefinition[]=[
 activity('in004-g4l4-coach',86,91,2,20),activity('in004-g4l4-final',90,97,2,25),
 ...IN004_FEEDBACK.wrong.branches.map(([a,b],i)=>activity('in004-g4l4-wrong-'+(i+1),88,93,a,b)),
];
export const IN004_FRAME_CONTROL={frameDomain:'sprite-207',completionFrame:483,transitions:[470,...frames].flatMap(fromFrame=>frames.map(toFrame=>({fromFrame,toFrame,stopFrame:toFrame})))} as const;
interface OwnedChild {readonly id:string;readonly floor:number;readonly revision:number|null;readonly token:string|null;readonly effectToken:string}
export interface In004Session {
 readonly seed:number;readonly replay:number;readonly practice:In004PracticeState|null;
 readonly pendingFrame:Readonly<{from:number;to:number}>|null;readonly children:readonly OwnedChild[];
}
export const createIn004Session=(seed=0,replay=0):In004Session=>({seed:seed>>>0,replay,practice:null,pendingFrame:null,children:[]});
const definition=(id:string)=>IN004_FEEDBACK_TIMELINES.find(d=>d.id===id);
const all=(r:AnimationRendererProps)=>r.lessonActivities??(r.lessonActivity?[r.lessonActivity]:[]);
const frameFor=(s:In004PracticeState)=>IN004_QUESTIONS.find(q=>q.id===s.question)!.frame;
function observed(c:OwnedChild,activities:readonly LessonTextActivitySnapshot[]){
 const d=definition(c.id)!;const matches=activities.filter(a=>a.id===c.id&&a.sourceInstanceId===d.sourceInstanceId&&a.frameDomain===d.frameDomain
  &&Number.isSafeInteger(a.revision)&&a.revision>c.floor&&Number.isInteger(a.frame)&&a.frame>=d.startFrame&&a.frame<=d.endFrame
  &&a.cancellationToken&&(c.revision===null||a.revision===c.revision)&&(c.token===null||a.cancellationToken===c.token));
 return matches.length===1?matches[0]:undefined;
}
/** Source-controlled question seeks preserve placed feedback siblings. A user
 * seek/Replay clears clock tokens and cannot be mistaken for that continuation. */
export function synchronizeIn004Session(s:In004Session,r:RuntimeContext,activities:readonly LessonTextActivitySnapshot[]=[]):In004Session {
 const reset=()=>s.practice||s.children.length||s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0)?createIn004Session(r.seed,r.replay??0):s;
 if(s.seed!==(r.seed>>>0)||s.replay!==(r.replay??0)||(r.frameDomain??'sprite-207')!=='sprite-207')return reset();
 if(s.pendingFrame&&r.frame===s.pendingFrame.from)return s;
 if(!s.practice)return s;
 if(r.frame!==frameFor(s.practice))return reset();
 if(s.children.some(c=>c.revision!==null&&!observed(c,activities)))return reset();
 return s.pendingFrame?{...s,pendingFrame:null}:s;
}
export function bindIn004Children(s:In004Session,activities:readonly LessonTextActivitySnapshot[]):In004Session {
 let changed=false;const children=s.children.map(c=>{if(c.revision!==null)return c;const a=observed(c,activities);if(!a)return c;changed=true;return{...c,revision:a.revision,token:a.cancellationToken!};});return changed?{...s,children}:s;
}
const effectId=(e:In004Effect)=>IN004_FEEDBACK_TIMELINES.find(d=>d.frameDomain==='sprite-'+e.sprite&&d.startFrame===e.start&&d.endFrame===e.end)!.id;
function requested(s:In004Session,effects:readonly In004Effect[],activities:readonly LessonTextActivitySnapshot[]){
 let children=[...s.children];for(const e of effects){const id=effectId(e),d=definition(id)!;
  const floor=Math.max(-1,...activities.filter(a=>a.sourceInstanceId===d.sourceInstanceId&&Number.isSafeInteger(a.revision)).map(a=>a.revision),...children.filter(c=>definition(c.id)?.sourceInstanceId===d.sourceInstanceId).map(c=>c.revision??c.floor));
  children=children.filter(c=>definition(c.id)?.sourceInstanceId!==d.sourceInstanceId);children.push({id,floor,revision:null,token:null,effectToken:e.token});
 }return children;
}
export type In004HostAction=Exclude<In004PracticeAction,{type:'feedback-complete'}>|{type:'begin'}|{type:'finish'};
function permitted(s:In004Session,r:AnimationRendererProps){return r.lang==='en'&&r.scenario==='source-static-frame'&&!r.entryStateSha256
 &&(r.frameDomain??'sprite-207')==='sprite-207'&&(r.rootFrame??6)===6&&!r.paused&&(r.seed>>>0)===s.seed&&(r.replay??0)===s.replay
 &&(!s.pendingFrame||r.frame===s.pendingFrame.to);}
/** All consequential state changes commit only after the real host accepts the
 * authored seek or atomic sibling event; no fallback local teaching clock. */
export function dispatchIn004(s:In004Session,a:In004HostAction,r:AnimationRendererProps):In004Session {
 if(!permitted(s,r))return s;
 if(a.type==='begin'){
  if(s.practice||r.frame!==470)return s;const practice=createIn004Practice(s.seed,s.replay),to=frameFor(practice);
  if(r.onLessonFrameRequest?.({fromFrame:470,toFrame:to,stopFrame:to})!==true)return s;
  return {...s,practice,pendingFrame:{from:470,to}};
 }
 if(!s.practice||r.frame!==frameFor(s.practice))return s;
 let action:In004PracticeAction;
 if(a.type==='finish'){
  const c=s.children.find(c=>c.id==='in004-g4l4-final'),v=c&&observed(c,all(r));
  if(!c||c.revision===null||!v||v.status!=='completed'||v.frame!==25||c.effectToken!==s.practice.finalToken)return s;
  action={type:'feedback-complete',kind:'final',token:c.effectToken,frame:25};
 }else action=a;
 const result=reduceIn004Practice(s.practice,action,false);if(result.state===s.practice)return s;
 let pendingFrame=s.pendingFrame;
 if(a.type==='new-problem'){
  const to=frameFor(result.state);if(r.onLessonFrameRequest?.({fromFrame:r.frame,toFrame:to,stopFrame:to})!==true)return s;
  pendingFrame=to===r.frame?null:{from:r.frame,to};
 }
 if(result.effects.length){const requests=result.effects.map(e=>({id:effectId(e),parentFrame:r.frame}));const accepted=requests.length>1?r.onLessonActivitiesRequest?.(requests):r.onLessonActivityRequest?.(requests[0]!);if(accepted!==true)return s;}
 return {...s,practice:result.state,pendingFrame,children:result.effects.length?requested(s,result.effects,all(r)):s.children};
}
/** Exact owned snapshots for unmount/Replay cleanup, never a global audio stop. */
export function in004OwnedActivities(s:In004Session,activities:readonly LessonTextActivitySnapshot[]){return s.children.flatMap(c=>{const a=observed(c,activities);return a?[a]:[];});}
